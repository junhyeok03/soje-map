import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneModules = path.join(
  projectRoot,
  "dist",
  "standalone",
  "node_modules",
);

if (!fs.existsSync(standaloneModules)) {
  throw new Error(
    "Standalone output was not found. Set next.config output to standalone before running this script.",
  );
}

const rootRequire = createRequire(path.join(projectRoot, "package.json"));
const copied = new Set();
const queue = [
  "react",
  "react-dom",
  "react-server-dom-webpack",
  "@vitejs/plugin-rsc",
].map((name) => ({ name, optional: false, resolver: rootRequire }));

function findPackageJson(name, resolver) {
  try {
    return resolver.resolve(`${name}/package.json`);
  } catch {
    const entryPath = resolver.resolve(name);
    let directory = path.dirname(entryPath);

    while (directory !== path.dirname(directory)) {
      const candidate = path.join(directory, "package.json");
      if (fs.existsSync(candidate)) {
        const metadata = JSON.parse(fs.readFileSync(candidate, "utf8"));
        if (metadata.name === name) return candidate;
      }
      directory = path.dirname(directory);
    }
  }

  return null;
}

while (queue.length > 0) {
  const dependency = queue.shift();
  if (!dependency || copied.has(dependency.name)) continue;

  let packageJsonPath;
  try {
    packageJsonPath = findPackageJson(dependency.name, dependency.resolver);
  } catch (error) {
    if (dependency.optional) continue;
    throw error;
  }

  if (!packageJsonPath) {
    if (dependency.optional) continue;
    throw new Error(`Could not resolve standalone dependency: ${dependency.name}`);
  }

  const packageRoot = path.dirname(fs.realpathSync(packageJsonPath));
  const packageMetadata = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const packageTarget = path.join(standaloneModules, dependency.name);

  fs.mkdirSync(path.dirname(packageTarget), { recursive: true });
  fs.rmSync(packageTarget, { force: true, recursive: true });
  fs.cpSync(packageRoot, packageTarget, {
    recursive: true,
    dereference: true,
    filter(source) {
      return !path
        .relative(packageRoot, source)
        .split(path.sep)
        .includes("node_modules");
    },
  });
  copied.add(dependency.name);

  const packageRequire = createRequire(packageJsonPath);
  const optionalNames = new Set(
    Object.keys(packageMetadata.optionalDependencies ?? {}),
  );
  const childNames = Object.keys({
    ...(packageMetadata.dependencies ?? {}),
    ...(packageMetadata.optionalDependencies ?? {}),
  });

  for (const name of childNames) {
    if (copied.has(name)) continue;
    queue.push({
      name,
      optional: optionalNames.has(name),
      resolver: packageRequire,
    });
  }
}

console.log(
  `  Added ${copied.size} peer runtime packages to the standalone server.`,
);
