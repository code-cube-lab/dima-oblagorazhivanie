import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders all eleven v19 pages", async () => {
  const routes = ["/", "/landscape", "/bath", "/kitchen", "/rooms", "/model", "/engineering", "/sheets", "/catalog", "/estimate", "/documents"];
  for (const pathname of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  }
});

test("home is render-first and contains no bad walkthrough", async () => {
  const response = await render("/");
  const html = await response.text();
  assert.match(html, /Дом, ремонт и участок — наглядно и по разделам/);
  assert.match(html, /Плохая 3D-проходка удалена/);
  assert.match(html, /0<\/strong><span>низкополигональных проходок/);
  assert.doesNotMatch(html, /WASD|От третьего лица|PointerLockControls|ProjectViewerV17/);
  assert.match(
    html,
    /https:\/\/code-cube-lab\.github\.io\/dima-oblagorazhivanie\/og\.png/,
  );
});

test("kitchen page fixes the glazing conflict and publishes four corrected renders", async () => {
  const response = await render("/kitchen");
  const html = await response.text();
  assert.match(html, /5530 мм/);
  assert.match(html, /5200 мм/);
  assert.match(html, /по 165 мм/);
  assert.match(html, /2400 × 1000 мм/);
  assert.match(html, /1100 мм/);
  assert.match(html, /Индукционная панель/);
  assert.match(html, /Посудомоечная машина/);
  assert.match(html, /наружные окна и двери остаются свободными/);
  assert.match(html, /kitchen-01-overview\.png/);
  assert.match(html, /kitchen-02-dining-view\.png/);
  assert.match(html, /kitchen-03-work-zone\.png/);
  assert.match(html, /kitchen-04-evening\.png/);
});

test("engineering, catalog and estimate pages expose contractor-ready registers with limits", async () => {
  const [engineering, catalog, estimate] = await Promise.all([
    render("/engineering").then((response) => response.text()),
    render("/catalog").then((response) => response.text()),
    render("/estimate").then((response) => response.text()),
  ]);
  assert.match(engineering, /Запрет на монтаж по эскизу/);
  assert.match(engineering, /7,0 кВт по кандидату/);
  assert.match(engineering, /Технические условия/);
  assert.match(catalog, /590 × 520 × 58 мм/);
  assert.match(catalog, /540 × 545 × 1775 мм/);
  assert.match(catalog, /41 490 ₽/);
  assert.match(catalog, /84 990 ₽/);
  assert.match(estimate, /24,35–45,40 млн ₽/);
  assert.match(estimate, /27,27–50,85 млн ₽/);
  assert.match(estimate, /Интернет-цены не являются офертой/);
});

test("landscape, bath and sheet pages expose renders, dimensions, limits and product links", async () => {
  const [landscape, bath, sheets] = await Promise.all([
    render("/landscape").then((response) => response.text()),
    render("/bath").then((response) => response.text()),
    render("/sheets").then((response) => response.text()),
  ]);
  assert.match(landscape, /участок 20 × 30 м/i);
  assert.match(landscape, /landscape-overview-concept\.png/);
  assert.match(landscape, /landscape-plan\.svg/);
  assert.match(landscape, /Тротуарная плитка «Старый город»/);
  assert.match(bath, /3,00 × 7,00 м/);
  assert.match(bath, /bath-lounge-concept\.png/);
  assert.match(bath, /bath-wash-concept\.png/);
  assert.match(bath, /bath-steam-concept\.png/);
  assert.match(bath, /пожарные узлы/i);
  assert.match(sheets, /99 требуемых листов/);
  assert.match(sheets, /blocked нельзя использовать для монтажа/);
});

test("required v19 and inherited v18 drawings, renders and downloads exist", async () => {
  const files = [
    "../public/plans/v19/landscape-plan.svg",
    "../public/plans/v19/bath-plan.svg",
    "../public/renders/v19/01-landscape-overview-concept.png",
    "../public/renders/v19/02-rear-yard-concept.png",
    "../public/renders/v19/03-right-green-strip-concept.png",
    "../public/renders/v19/04-front-evening-lighting-concept.png",
    "../public/renders/v19/05-bath-lounge-concept.png",
    "../public/renders/v19/06-bath-wash-concept.png",
    "../public/renders/v19/07-bath-steam-concept.png",
    "../public/downloads/shopping-catalog-v19.csv",
    "../public/plans/v18/kitchen-plan.svg",
    "../public/plans/v18/kitchen-elevation.svg",
    "../public/plans/v18/kitchen-mep.svg",
    "../public/renders/v18/kitchen-01-overview.png",
    "../public/renders/v18/kitchen-02-dining-view.png",
    "../public/renders/v18/kitchen-03-work-zone.png",
    "../public/renders/v18/kitchen-04-evening.png",
    "../public/downloads/shopping-catalog-v18.csv",
    "../public/downloads/kitchen-boq-v18.csv",
    "../public/downloads/kitchen-engineering-v18.csv",
    "../public/downloads/estimate-v18.csv",
    "../public/downloads/github-tool-audit-v18.csv",
  ];
  for (const file of files) {
    assert.equal(await access(new URL(file, import.meta.url)), undefined, file);
  }
});

test("kitchen arithmetic closes and the 5530 mm source dimension is documented", async () => {
  const [app, plan, boq] = await Promise.all([
    readFile(new URL("../app/ProjectV18.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/plans/v18/kitchen-plan.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/downloads/kitchen-boq-v18.csv", import.meta.url), "utf8"),
  ]);
  assert.match(app, /600 \+ 600 \+ 300 \+ 800 \+ 900 \+ 600 \+ 800 \+ 600 = 5200 мм/);
  assert.match(app, /5530 − 5200 = 330 мм/);
  assert.match(plan, /5530 · по листу 7 PDF/);
  assert.match(plan, /5200 · сумма модулей/);
  assert.match(boq, /не добавлять повторно к общедомовой смете/);
});

test("documents page includes pinned GitHub HEAD revisions and adoption decisions", async () => {
  const [html, audit] = await Promise.all([
    render("/documents").then((response) => response.text()),
    readFile(new URL("../public/downloads/github-tool-audit-v18.csv", import.meta.url), "utf8"),
  ]);
  assert.match(html, /Babylon\.js/);
  assert.match(html, /glTF Transform/);
  assert.match(html, /не подключается новый игровой движок/);
  assert.match(audit, /eba30de865cfbf31ac736f792defd9a60ff28d57/);
  assert.match(audit, /227f5a188c8f362ee636ddf9553612d9742c4200/);
  assert.match(audit, /dd665ec2862382df7f4fa9c9f0db9bb593326d62/);
});
