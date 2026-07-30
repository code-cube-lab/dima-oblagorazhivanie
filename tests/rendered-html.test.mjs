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
  assert.match(html, /Дом, который можно понять до начала работ/);
  assert.match(html, /Один общий балкон, два разных выхода/);
  assert.match(html, /второе верхнее лицевое окно сохранено/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the two balcony exits distinct and connected", async () => {
  const [app, facts, front, route] = await Promise.all([
    readFile(new URL("../app/DimaProjectApp.tsx", import.meta.url), "utf8"),
    readFile(
      "C:/!_2_Projeckt/Дима Облагораживание/Cinema 4D v13/07_Документы/project-facts.json",
      "utf8",
    ),
    access(new URL("../public/renders/01-front-elevation-v14.png", import.meta.url)),
    access(new URL("../public/renders/03-common-balcony-two-exits-v14.png", import.meta.url)),
  ]);

  assert.match(app, /parents-side-balcony-door/);
  assert.match(app, /child-balcony-door/);
  assert.match(app, /Единая лицевая часть общего балкона 7,95×1,95 м/);
  assert.doesNotMatch(app, /child-balcony-door-bedroom-4/);

  const parsed = JSON.parse(facts);
  const doors = parsed.facts.find(
    (item) => item.id === "ARCH-COMMON-BALCONY-DOORS",
  );
  const balcony = parsed.facts.find(
    (item) => item.id === "ARCH-COMMON-L-BALCONY",
  );
  assert.equal(doors.value.openings.length, 2);
  assert.equal(doors.value.unchanged_front_window_width, 1200);
  assert.equal(
    balcony.value.footprint_segments.slab_overlap_at_corner.minimum_clear_route,
    1200,
  );
  assert.equal(front, undefined);
  assert.equal(route, undefined);
});
