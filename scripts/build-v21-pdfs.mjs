import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const outDir = join(root, "public", "downloads", "v21");
const tempDir = join(root, "tmp", "pdfs", "v21");
const archiveDir = resolve(root, "..", "..", "..", "output", "pdf");
mkdirSync(outDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });
mkdirSync(archiveDir, { recursive: true });

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const fileUrl = (relative) => pathToFileURL(join(root, "public", relative)).href;
const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const sheets = [
  ["АР-04", "Кухня-гостиная. Развёртки четырёх стен", "plans/v21/AR-04-kitchen-elevations.svg"],
  ["ЭОМ-01", "Кухня. Розетки и выводы", "plans/v21/EOM-01-kitchen-outlets.svg"],
  ["КМ-04", "Кухня. Координация выбранных товаров", "plans/v21/KM-04-product-coordination.svg"],
  ["АР-05", "Спальни. Сводный план мебели", "plans/v21/AR-05-bedroom-layout-plan.svg"],
  ["АР-05.1", "Спальня родителей. План мебели", "plans/v21/AR-05-1-parents-plan.svg"],
  ["АР-06", "Спальня родителей. Развёртки", "plans/v21/AR-06-parents-elevations.svg"],
  ["АР-05.2", "Детская Дарины. План мебели", "plans/v21/AR-05-2-darina-plan.svg"],
  ["АР-07", "Детская Дарины. Развёртки", "plans/v21/AR-07-darina-elevations.svg"],
  ["АР-05.3", "Детская Ярика. План мебели", "plans/v21/AR-05-3-yarik-plan.svg"],
  ["АР-08", "Детская Ярика. Развёртки", "plans/v21/AR-08-yarik-elevations.svg"],
  ["АР-09", "Мангальная. План 1640×1990 и вид по фото", "plans/v21/AR-09-mangal-photo-match.svg"],
  ["ОВ-01", "Котельная. План и развёртки", "plans/v21/OV-01-boiler-room.svg"],
  ["ОВ-02", "Вентиляция. Принципиальная схема", "plans/v21/OV-02-ventilation.svg"],
  ["ГП-01", "Посадочный план", "plans/v21/GP-01-planting-plan.svg"],
];

const nestedSources = new Map([
  ["plans/v21/AR-04-kitchen-elevations.svg", "plans/v20/kitchen-elevations-4walls.svg"],
  ["plans/v21/EOM-01-kitchen-outlets.svg", "plans/v20/kitchen-outlets-detailed.svg"],
  ["plans/v21/OV-01-boiler-room.svg", "plans/v20/boiler-room-layout-4walls.svg"],
  ["plans/v21/OV-02-ventilation.svg", "plans/v20/ventilation-schematic.svg"],
  ["plans/v21/GP-01-planting-plan.svg", "plans/v20/landscape-planting-plan.svg"],
]);

const packages = [
  {
    code: "АР-04 / ЭОМ-01",
    title: "Кухня-гостиная",
    note: "Мебель находится на внутренней стене; заднее остекление свободно. Точки электрики окончательно привязать после паспортов техники.",
    drawings: ["plans/v21/AR-04-kitchen-elevations.svg", "plans/v21/EOM-01-kitchen-outlets.svg"],
    renders: ["renders/v21/c4d-control/13-kitchen-living-a.png", "renders/v21/c4d-control/39-kitchen-windows-clear.png"],
  },
  {
    code: "АР-05.1 / АР-06",
    title: "Спальня родителей",
    note: "Кровать 1800, две тумбы, стол Олеси. Проход к существующей боковой двери общего балкона оставлен свободным.",
    drawings: ["plans/v21/AR-05-1-parents-plan.svg", "plans/v21/AR-06-parents-elevations.svg"],
    renders: ["renders/v21/c4d-control/14-parents-a.png", "renders/v21/c4d-control/41-parents-b.png"],
  },
  {
    code: "АР-05.2 / АР-07",
    title: "Детская Дарины",
    note: "Рабочее место, кровать, шкаф и гимнастическая зона. Новый выход на общий балкон - только после расчёта усиления проёма.",
    drawings: ["plans/v21/AR-05-2-darina-plan.svg", "plans/v21/AR-07-darina-elevations.svg"],
    renders: ["renders/v21/c4d-control/15-darina-a.png", "renders/v21/c4d-control/42-darina-b.png"],
  },
  {
    code: "АР-05.3 / АР-08",
    title: "Детская Ярика",
    note: "Кровать, рабочее место, шкаф и закрытое хранение спортивной формы; центр комнаты оставлен свободным.",
    drawings: ["plans/v21/AR-05-3-yarik-plan.svg", "plans/v21/AR-08-yarik-elevations.svg"],
    renders: ["renders/v21/c4d-control/16-yarik-a.png", "renders/v21/c4d-control/43-yarik-b.png"],
  },
  {
    code: "ОВ-01",
    title: "Котельная",
    note: "Оборудование построено по паспортным габаритам. Мощность, газ, дымоудаление, воздухообмен и диаметры - только по расчёту профильных инженеров.",
    drawings: ["plans/v21/OV-01-boiler-room.svg"],
    renders: ["renders/v21/c4d-control/44-boiler-a.png", "renders/v21/c4d-control/45-boiler-b.png"],
  },
  {
    code: "ОВ-02",
    title: "Вентиляция",
    note: "На листе показана координационная схема. Расходы, сечения, шумоглушение, противопожарные проходки и балансировку рассчитывает инженер ОВ.",
    drawings: ["plans/v21/OV-02-ventilation.svg"],
    renders: ["renders/v21/c4d-control/46-vent-unit.png"],
  },
  {
    code: "ГП-01",
    title: "Участок и посадки",
    note: "Участок 20×30 м; баня 3×7 м с отступом 1 м, хозблок 1×3 м, передний двор преимущественно бетонный, зелёная полоса справа.",
    drawings: ["plans/v21/GP-01-planting-plan.svg"],
    renders: ["renders/v21/c4d-control/05-front-client-changes.png", "renders/v21/c4d-control/07-rear-mangal.png", "renders/v21/c4d-control/09-site-overview.png"],
  },
  {
    code: "АР-09",
    title: "Мангальная в наружном правом углу террасы",
    note: "Исправлено по листу 7 и фотографиям заказчика: кирпичная стена стоит по наружной задней линии, возврат 1990 мм идёт к дому, но заканчивается до фасада; мойка встроена в горизонтальную столешницу.",
    drawings: ["plans/v21/AR-09-mangal-photo-match.svg"],
    renders: ["renders/v21/c4d-v20-2/50_mangal-photo-match-overview_v20_2.png", "renders/v21/c4d-v20-2/51_mangal-L-firebox_v20_2.png", "renders/v21/c4d-v20-2/52_mangal-integrated-sink_v20_2.png"],
  },
];

const css = `
  @page { size: A3 landscape; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; color: #102d35; font-family: "Segoe UI", Arial, sans-serif; }
  .page { width: 420mm; height: 297mm; page-break-after: always; position: relative; overflow: hidden; background: #f4f0e7; }
  .page:last-child { page-break-after: auto; }
  .cover { display: grid; grid-template-columns: 1.25fr .75fr; color: white; background: #102d35; }
  .cover-main { padding: 34mm 25mm; display: flex; flex-direction: column; justify-content: space-between; }
  .cover-side { padding: 28mm 20mm; background: #173c46; border-left: .4mm solid rgba(255,255,255,.18); }
  .eyebrow { color: #e49a70; font: 700 10pt Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
  h1 { max-width: 250mm; margin: 7mm 0; font: 500 43pt/.95 Georgia, serif; letter-spacing: -.03em; }
  h2 { margin: 0; font: 500 28pt/1 Georgia, serif; }
  h3 { margin: 2mm 0; font: 500 18pt/1 Georgia, serif; }
  p { margin: 0; font-size: 11pt; line-height: 1.55; }
  .muted { color: rgba(255,255,255,.65); }
  .facts { display: grid; gap: 4mm; margin-top: 18mm; }
  .facts div { display: grid; grid-template-columns: 28mm 1fr; gap: 4mm; padding-top: 3mm; border-top: .3mm solid rgba(255,255,255,.16); }
  .facts b { color: #e49a70; font: 700 9pt Consolas, monospace; }
  .facts span { font-size: 9.5pt; line-height: 1.45; }
  .status { padding: 5mm; color: #47300e; background: #f5dbaa; border-left: 2mm solid #c16b20; font-size: 10pt; line-height: 1.5; }
  .registry { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-top: 10mm; }
  .registry div { min-height: 21mm; padding: 4mm; background: rgba(255,255,255,.07); border: .3mm solid rgba(255,255,255,.12); }
  .registry b { display: block; color: #e49a70; font: 700 8pt Consolas, monospace; }
  .registry span { display: block; margin-top: 2mm; font-size: 8.5pt; line-height: 1.3; }
  .sheet-page { display: grid; grid-template-rows: minmax(0,1fr) 31mm; gap: 3mm; padding: 7mm; background: #e7e5de; }
  .sheet-page.direct { display: block; padding: 8mm; }
  .sheet-page .drawing-wrap { min-height: 0; background: white; box-shadow: 0 4mm 15mm rgba(16,45,53,.12); }
  .sheet-page img { width: 100%; height: 100%; object-fit: contain; background: white; }
  .sheet-strip { display: grid; grid-template-columns: 1fr 85mm 42mm; background: white; border: .45mm solid #102d35; }
  .sheet-strip > div { padding: 3mm 4mm; border-right: .35mm solid #102d35; }
  .sheet-strip > div:last-child { border-right: 0; }
  .sheet-strip b, .sheet-strip span { display: block; }
  .sheet-strip b { font: 700 9pt Consolas, monospace; color: #b8663f; }
  .sheet-strip span { margin-top: 1.5mm; font-size: 8.5pt; line-height: 1.3; }
  .chapter { display: grid; grid-template-columns: 110mm 1fr; }
  .chapter-title { padding: 28mm 18mm; color: white; background: #102d35; }
  .chapter-title h2 { margin: 7mm 0; font-size: 34pt; }
  .chapter-title p { color: rgba(255,255,255,.68); }
  .chapter-title .number { position: absolute; bottom: 18mm; left: 18mm; font: 500 70pt Georgia, serif; color: rgba(255,255,255,.12); }
  .render-board { display: grid; gap: 3mm; padding: 13mm; background: #e7e5de; }
  .render-board.two { grid-template-columns: 1fr 1fr; }
  .render-board.three { grid-template-columns: 1.35fr .65fr; grid-template-rows: 1fr 1fr; }
  .render-board img { width: 100%; height: 100%; object-fit: cover; background: #0b1f25; }
  .render-board.three img:first-child { grid-row: 1 / -1; }
  .footer { position: absolute; right: 8mm; bottom: 4mm; color: #6c7779; font: 7pt Consolas, monospace; }
`;

function cover(title, subtitle) {
  return `<section class="page cover">
    <div class="cover-main">
      <div><div class="eyebrow">Дима - благоустройство · Cinema 4D v20.2</div><h1>${esc(title)}</h1><p class="muted">${esc(subtitle)}</p></div>
      <div class="status">СПДС-ориентированная подача. Статус: эскиз/координация. Газ, несущие изменения, электрика, ВК и ОВ не выдаются в монтаж до расчёта и подписи профильных специалистов.</div>
    </div>
    <aside class="cover-side">
      <div class="eyebrow">Реестр</div>
      <div class="registry">${sheets.map(([code, name]) => `<div><b>${esc(code)}</b><span>${esc(name)}</span></div>`).join("")}</div>
      <div class="facts">
        <div><b>ОСНОВА</b><span>PDF заказчика, листы 6-11; изменения по балкону, мангальной и участку.</span></div>
        <div><b>ЕДИНИЦЫ</b><span>мм; участок 20×30 м; дом по осям 14,10×11,46 м.</span></div>
        <div><b>ПРОВЕРИТЬ</b><span>Натурные обмеры, отметки, конструкции, мощности и инженерные расчёты.</span></div>
      </div>
    </aside>
  </section>`;
}

function sheetPage(relative, label) {
  const nested = nestedSources.get(relative);
  if (!nested) {
    return `<section class="page sheet-page direct"><img src="${fileUrl(relative)}" alt="${esc(label)}"><div class="footer">${esc(label)} · v20.2</div></section>`;
  }
  const [code, title] = label.split(" · ");
  return `<section class="page sheet-page">
    <div class="drawing-wrap"><img src="${fileUrl(nested)}" alt="${esc(label)}"></div>
    <div class="sheet-strip">
      <div><b>${esc(code)}</b><span>${esc(title ?? label)} · источник графики: связанный координационный лист</span></div>
      <div><b>СТАТУС</b><span>Эскиз/координация. Размеры подтвердить обмером и профильным расчётом.</span></div>
      <div><b>ВЫПУСК</b><span>v20.2<br>30.07.2026</span></div>
    </div>
  </section>`;
}

function renderPage(pkg, index) {
  const cls = pkg.renders.length >= 3 ? "three" : "two";
  return `<section class="page chapter">
    <div class="chapter-title"><div class="eyebrow">${esc(pkg.code)}</div><h2>${esc(pkg.title)}</h2><p>${esc(pkg.note)}</p><div class="number">${String(index + 1).padStart(2, "0")}</div></div>
    <div class="render-board ${cls}">${pkg.renders.map((render) => `<img src="${fileUrl(render)}" alt="${esc(pkg.title)}">`).join("")}</div>
  </section>`;
}

function html(body) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
}

function printPdf(name, content) {
  const htmlPath = join(tempDir, `${name}.html`);
  const pdfPath = join(outDir, `${name}.pdf`);
  writeFileSync(htmlPath, html(content), "utf8");
  execFileSync(edge, [
    "--headless=new",
    "--disable-gpu",
    "--allow-file-access-from-files",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=5000",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: "inherit" });
  copyFileSync(pdfPath, join(archiveDir, `${name}.pdf`));
  return pdfPath;
}

const engineerBody = [
  cover("Инженерный комплект чертежей", "Читаемые листы для предварительного согласования с архитектором, электриком, инженерами ОВ/ВК, газовой службой, мебельщиком и садовником."),
  ...sheets.map(([code, name, relative]) => sheetPage(relative, `${code} · ${name}`)),
].join("");

const clientBody = [
  cover("Понятный альбом: чертёж рядом с рендером", "Для Дмитрия: сначала план и размеры, затем те же предметы и проёмы в ракурсах Cinema 4D. Рендер не используется как измерительный документ."),
  ...packages.flatMap((pkg, index) => [
    renderPage(pkg, index),
    ...pkg.drawings.map((drawing) => sheetPage(drawing, `${pkg.code} · ${pkg.title}`)),
  ]),
].join("");

console.log(printPdf("Dima-engineering-drawings-v21", engineerBody));
console.log(printPdf("Dima-client-drawings-and-renders-v21", clientBody));
