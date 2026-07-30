import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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

test("server-renders the Dima project shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Дима · Дом и участок — интерактивный проект<\/title>/i);
  assert.match(html, /Дом и участок, которые можно проверить/);
  assert.match(html, /Осмотрите дом с любой стороны и включите комнаты/);
  assert.match(html, /Гараж слева, высокий витраж справа/);
  assert.match(html, /Баня 3×7 м/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the two balcony exits distinct and connected", async () => {
  const [app, specText, front, route, model] = await Promise.all([
    readFile(new URL("../app/DimaProjectApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/data/dima-v15-spec.json", import.meta.url), "utf8"),
    access(new URL("../public/renders/v15/01-front-photoreal.png", import.meta.url)),
    access(new URL("../public/renders/v15/02-balcony-photoreal.png", import.meta.url)),
    access(new URL("../public/models/dima-v15.glb", import.meta.url)),
  ]);

  assert.match(app, /Спальня с боковым выходом на общий балкон/);
  assert.match(app, /новым выходом на безопасный балкон/);
  assert.match(app, /единый Г‑образный балкон/);
  assert.match(app, /GLTFLoader/);

  const parsed = JSON.parse(specText);
  const frontDoor = parsed.facade_openings.front.find(
    (item) => item.name === "child_balcony_door",
  );
  const sideDoor = parsed.facade_openings.left.find(
    (item) => item.name === "parents_balcony_door",
  );
  assert.equal(frontDoor.source.startsWith("ИЗМЕНЕНИЕ КЛИЕНТА"), true);
  assert.equal(sideDoor.source.startsWith("ИЗМЕНЕНИЕ КЛИЕНТА"), true);
  assert.equal(parsed.client_changes.connected_balcony.guard_height, 1.2);
  assert.equal(parsed.client_changes.connected_balcony.maximum_clear_gap, 0.1);
  assert.equal(front, undefined);
  assert.equal(route, undefined);
  assert.equal(model, undefined);
});
