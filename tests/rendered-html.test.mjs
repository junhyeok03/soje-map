import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Soje memory map shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>소제, 시간의 지도<\/title>/i);
  assert.match(html, /골목 위에 겹쳐진/);
  assert.match(html, /소제동 기억 산책/);
  assert.match(html, /<link[^>]+rel="icon"[^>]+href="\/favicon\.svg"/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview/);
});

test("serves the bare public-path alias used by the school proxy", async () => {
  const response = await render("/junhyeok/pj");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>소제, 시간의 지도<\/title>/i);
});
