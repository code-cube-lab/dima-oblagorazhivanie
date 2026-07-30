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
  assert.match(html, /Осмотрите дом днём и ночью, затем пройдите его в масштабе/);
  assert.match(html, /Гараж слева, высокий витраж справа/);
  assert.match(html, /Баня 3×7 м/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the two balcony exits connected across the full garage width", async () => {
  const [app, specText, front, route, model] = await Promise.all([
    readFile(new URL("../app/DimaProjectApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/data/dima-v16-spec.json", import.meta.url), "utf8"),
    access(new URL("../public/renders/v16/01-front-photoreal.png", import.meta.url)),
    access(new URL("../public/renders/v16/02-balcony-photoreal.png", import.meta.url)),
    access(new URL("../public/models/dima-v16.glb", import.meta.url)),
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
  assert.equal(parsed.client_changes.connected_balcony.high_privacy_screen_height, 1.8);
  assert.deepEqual(parsed.client_changes.connected_balcony.front_rect, [1.5, 4.45, 9, 5.89]);
  assert.equal(parsed.client_changes.connected_balcony.maximum_clear_gap, 0.1);
  assert.equal(front, undefined);
  assert.equal(route, undefined);
  assert.equal(model, undefined);
});

test("publishes interior renovation, equipment, contractor candidates, and lighting", async () => {
  const app = await readFile(new URL("../app/DimaProjectApp.tsx", import.meta.url), "utf8");
  assert.match(app, /кухня 5,2 м, остров/);
  assert.match(app, /MAUNFELD CVI593SFBK LUX/);
  assert.match(app, /17 групп света/);
  assert.match(app, /Авито — пока не внедрено как подтверждённый источник/);
  assert.match(app, /24,35–45,40 млн ₽/);
});

test("publishes v17 game controls, engineering sheets, shopping register, and room view sets", async () => {
  const [app, viewer, electrical1, electrical2, water, catalog, sequence, kitchenViews] =
    await Promise.all([
      readFile(new URL("../app/DimaProjectApp.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/ProjectViewerV17.tsx", import.meta.url), "utf8"),
      access(new URL("../public/plans/v17/electrical-floor1.svg", import.meta.url)),
      access(new URL("../public/plans/v17/electrical-floor2.svg", import.meta.url)),
      access(new URL("../public/plans/v17/water-sewer.svg", import.meta.url)),
      access(new URL("../public/downloads/shopping-catalog-v17.csv", import.meta.url)),
      access(new URL("../public/downloads/construction-sequence-v17.csv", import.meta.url)),
      access(new URL("../public/renders/v17/11-kitchen-four-views.png", import.meta.url)),
    ]);

  assert.match(app, /От третьего лица/);
  assert.match(app, /Ночь · включить свет/);
  assert.match(app, /ЭОМ-01 · первый этаж/);
  assert.match(app, /ВК-01 · вода и канализация/);
  assert.match(app, /MAUNFELD CVI593SFBK LUX/);
  assert.match(app, /41 490 ₽ · нет в наличии/);
  assert.match(viewer, /MODEL_ROOT_REAL_SCALE/);
  assert.match(viewer, /Проверка участка 20 × 30 м пройдена/);
  assert.equal(electrical1, undefined);
  assert.equal(electrical2, undefined);
  assert.equal(water, undefined);
  assert.equal(catalog, undefined);
  assert.equal(sequence, undefined);
  assert.equal(kitchenViews, undefined);
});

test("keeps one L01-L17 lighting dictionary across JSON, CSV, app, and GLB names", async () => {
  const [specText, csv, app] = await Promise.all([
    readFile(new URL("../public/data/dima-v16-spec.json", import.meta.url), "utf8"),
    readFile(new URL("../public/downloads/lighting-v16.csv", import.meta.url), "utf8"),
    readFile(new URL("../app/DimaProjectApp.tsx", import.meta.url), "utf8"),
  ]);
  const spec = JSON.parse(specText);
  const groups = [
    ...spec.lighting_program.interior_groups,
    ...spec.lighting_program.exterior_groups,
  ];
  assert.equal(groups.length, 17);
  assert.deepEqual(groups, [
    "L01 кухонная рабочая зона",
    "L02 кухонный остров",
    "L03 гостиная",
    "L04 обеденный стол",
    "L05 гостевая спальня",
    "L06 спальня родителей",
    "L07 детская Дарины",
    "L08 детская Ярика",
    "L09 санузлы",
    "L10 холлы и лестница",
    "L11 кухонная LED-подсветка",
    "L12 дорожки",
    "L13 общий балкон",
    "L14 мангальная",
    "L15 баня",
    "L16 фасады дома",
    "L17 хозблок",
  ]);
  for (const group of groups) {
    const id = group.slice(0, 3);
    assert.match(csv, new RegExp(`^${id};`, "m"));
  }
  assert.match(app, /\["L12–L13", "Дорожки и общий балкон"/);
  assert.match(app, /\["L14–L17", "Мангальная, баня, фасады, хозблок"/);
});
