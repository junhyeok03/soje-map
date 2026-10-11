// 시연 모드의 "걷기" 애니메이션과 지도 점선이 실제 길을 따라가도록
// 대전역 → 장소 1 → … → 장소 6 구간의 도보 경로를 받아 app/walkRoutes.ts로 저장한다.
// 발표 중 외부 서버에 의존하지 않도록 실행 시점이 아니라 미리 받아 둔다.
//
// 사용법: node scripts/fetch-walk-routes.mjs
// 경로: FOSSGIS OSRM 도보 라우터 (routing.openstreetmap.de), 데이터 © OpenStreetMap contributors (ODbL)
import { readFile, writeFile } from "node:fs/promises";

const ROUTER = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const source = await readFile(new URL("../app/locations.ts", import.meta.url), "utf8");

const start = source.match(/WALK_START[\s\S]*?coordinates:\s*\[([\d.]+),\s*([\d.]+)\]/);
const locations = [
  ...source.matchAll(/id:\s*"([^"]+)",\s*order:\s*\d+,[\s\S]*?coordinates:\s*\[([\d.]+),\s*([\d.]+)\]/g),
].map(([, id, lat, lng]) => ({ id, coordinates: [Number(lat), Number(lng)] }));

if (!start || locations.length === 0) {
  throw new Error("app/locations.ts에서 출발점이나 장소 좌표를 찾지 못했습니다.");
}

const round = ([lat, lng]) => [Number(lat.toFixed(7)), Number(lng.toFixed(7))];
const sameish = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;

let from = [Number(start[1]), Number(start[2])];
const routes = {};
const summary = [];

for (const location of locations) {
  const to = location.coordinates;
  const url = `${ROUTER}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const response = await fetch(url, {
    headers: { "User-Agent": "soje-map-student-project (route snapshot)" },
  });
  if (!response.ok) throw new Error(`${location.id}: 경로 요청 실패 ${response.status}`);
  const { routes: found } = await response.json();
  const route = found[0];

  // 도로 위 경로 앞뒤에 실제 출발·도착 좌표를 붙여 장소 핀에서 시작하고 끝나게 한다.
  // 양 끝은 장소 좌표를 그대로 써야 구간끼리 정확히 이어진다.
  const road = route.geometry.coordinates
    .map(([lng, lat]) => round([lat, lng]))
    .filter((point) => !sameish(point, from) && !sameish(point, to))
    .filter((point, index, all) => index === 0 || !sameish(point, all[index - 1]));
  const path = [round(from), ...road, round(to)];

  routes[location.id] = path;
  summary.push(`${location.id}: ${Math.round(route.distance)}m`);
  from = to;
  await new Promise((resolve) => setTimeout(resolve, 1200)); // 공용 서버 사용 예절
}

const today = new Date().toISOString().slice(0, 10);
const body = Object.entries(routes)
  .map(([id, path]) => `  "${id}": [\n${path.map((p) => `    [${p[0]}, ${p[1]}],`).join("\n")}\n  ],`)
  .join("\n");

await writeFile(
  new URL("../app/walkRoutes.ts", import.meta.url),
  `// scripts/fetch-walk-routes.mjs로 생성한 파일입니다. 직접 고치지 말고 스크립트를 다시 실행하세요.
// 경로: FOSSGIS OSRM 도보 라우터(routing.openstreetmap.de), 데이터 © OpenStreetMap contributors (ODbL)
// 생성일: ${today} · ${summary.join(" · ")}
import type { LatLng } from "./arrival";

// 키는 도착 장소 id, 값은 직전 장소(첫 구간은 대전역)에서 그 장소까지의 도보 경로
export const WALK_ROUTES: Record<string, LatLng[]> = {
${body}
};
`,
);

console.log(summary.join("\n"));
