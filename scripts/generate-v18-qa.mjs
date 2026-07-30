import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePdf =
  "C:\\!_2_Projeckt\\Дима Облагораживание\\Снимок экрана 2025—09—13 в 18.38.43.pdf";

const fileMap = [
  ["SRC_PDF", sourcePdf],
  ["FACTS", path.join(project, "qa/v18/project-facts.json")],
  ["BROWSER_QA", path.join(project, "qa/v18/local-browser-qa.json")],
  ["PLAN_KITCHEN", path.join(project, "public/plans/v18/kitchen-plan.svg")],
  ["ELEVATION_KITCHEN", path.join(project, "public/plans/v18/kitchen-elevation.svg")],
  ["MEP_KITCHEN", path.join(project, "public/plans/v18/kitchen-mep.svg")],
  ["FLOOR_1", path.join(project, "public/plans/v16/floor-1-c4d.png")],
  ["FLOOR_2", path.join(project, "public/plans/v16/floor-2-c4d.png")],
  ["RENDER_K1", path.join(project, "public/renders/v18/kitchen-01-overview.png")],
  ["RENDER_K2", path.join(project, "public/renders/v18/kitchen-02-dining-view.png")],
  ["RENDER_K3", path.join(project, "public/renders/v18/kitchen-03-work-zone.png")],
  ["RENDER_K4", path.join(project, "public/renders/v18/kitchen-04-evening.png")],
  ["ESTIMATE", path.join(project, "public/downloads/estimate-v18.csv")],
  ["CATALOG", path.join(project, "public/downloads/shopping-catalog-v18.csv")],
  ["GITHUB_AUDIT", path.join(project, "public/downloads/github-tool-audit-v18.csv")],
];

const files = [];
for (const [id, filePath] of fileMap) {
  const bytes = await readFile(filePath);
  files.push({
    id,
    path: path.resolve(filePath),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

const check = (id, name, owner, object, status, evidence, blocking_note) => ({
  id,
  name,
  owner,
  object,
  status,
  evidence,
  ...(blocking_note ? { blocking_note } : {}),
});

const blockedMeasurement = "Нет контрольного лазерного обмера фактической коробки.";
const blockedNative = "Нет повторно открытой и сверенной нативной C4D/BIM-модели ревизии v18.";
const blockedMep = "Нет ТУ и подписанного расчёта профильного проектировщика.";

const gates = [
  {
    id: "G1",
    name: "Sources",
    status: "BLOCKED",
    evidence: ["SRC_PDF", "FACTS"],
    checks: [
      check("G1_SOURCE_REGISTER", "Реестр исходников", "архитектор", "PDF 18 листов", "PASS", ["SRC_PDF", "FACTS"]),
      check("G1_SCALE_BOUNDARY", "Масштаб и границы", "геодезист", "дом и участок", "BLOCKED", ["SRC_PDF", "FACTS"], blockedMeasurement),
      check("G1_LIMITS", "Границы достоверности", "координатор", "реестр фактов", "PASS", ["FACTS"]),
      check("G1_SITE_DATA", "Данные участка", "геодезист и инженер", "рельеф, грунт, сети", "BLOCKED", ["FACTS"], "Нет топосъёмки, геологии и исполнительной съёмки сетей.")
    ]
  },
  {
    id: "G2",
    name: "Architecture",
    status: "BLOCKED",
    evidence: ["SRC_PDF", "FLOOR_1", "FLOOR_2"],
    checks: [
      check("G2_EXISTING_GEOMETRY", "Фактическая геометрия", "архитектор", "существующий дом", "BLOCKED", ["SRC_PDF", "FLOOR_1", "FLOOR_2"], blockedMeasurement),
      check("G2_DIMENSIONS", "Размеры и проёмы", "архитектор", "этажи и фасады", "BLOCKED", ["SRC_PDF", "FACTS"], "Изменённый балкон и новый дверной проём не обследованы."),
      check("G2_DRAWING_METADATA", "Метаданные листов", "архитектор", "планы", "BLOCKED", ["FLOOR_1", "FLOOR_2"], "На предварительных растровых листах нет полного набора рабочих отметок и размерных цепей."),
      check("G2_NO_INVENTION", "Нет выдуманной геометрии", "независимый проверяющий", "модель и рендеры", "BLOCKED", ["SRC_PDF", "FLOOR_1", "FLOOR_2"], blockedNative),
      check("G2_CODE_OFFSETS", "Нормативные отступы", "архитектор", "баня и хозблок", "BLOCKED", ["FACTS"], "Требования заказчика не подтверждены градостроительными и противопожарными расчётами.")
    ]
  },
  {
    id: "G3",
    name: "Engineering",
    status: "BLOCKED",
    evidence: ["MEP_KITCHEN", "FACTS"],
    checks: [
      check("G3_STRUCTURE_BOUNDARY", "Граница конструктивных решений", "конструктор", "балкон и проём", "PASS", ["FACTS"]),
      check("G3_UTILITIES", "Инженерные сети", "ЭОМ, ВК, ОВ и газ", "дом", "BLOCKED", ["MEP_KITCHEN", "FACTS"], blockedMep),
      check("G3_DRAINAGE", "Водоотвод", "инженер НВК", "дом и участок", "BLOCKED", ["FACTS"], "Нет высотной съёмки, уклонов и места разрешённого сброса."),
      check("G3_COLLISIONS", "Закрытие коллизий", "BIM-координатор", "все сети", "BLOCKED", ["FACTS"], "Нет объединённой инженерной модели и журнала закрытых коллизий.")
    ]
  },
  {
    id: "G4",
    name: "Site",
    status: "BLOCKED",
    evidence: ["PLAN_KITCHEN", "CATALOG", "FACTS"],
    checks: [
      check("G4_HARDSCAPE", "Покрытия", "ландшафтный архитектор", "двор", "BLOCKED", ["FACTS"], "Нет рабочих пирогов, уклонов, швов и ведомости объёмов."),
      check("G4_PLANTING", "Посадки", "дендролог", "участок", "BLOCKED", ["CATALOG", "FACTS"], "Нет принятого дендроплана с количеством, шагом и взрослыми габаритами."),
      check("G4_LIGHTING", "Наружное освещение", "светотехник", "участок", "BLOCKED", ["FACTS"], "Нет светотехнического расчёта, IP-классов и рабочих групп управления."),
      check("G4_FURNITURE", "Мебель", "конструктор мебели", "кухня", "BLOCKED", ["PLAN_KITCHEN", "ELEVATION_KITCHEN", "CATALOG"], "Компоновка согласована как предложение, но производственный обмер и карты крепления отсутствуют.")
    ]
  },
  {
    id: "G5",
    name: "BIM/CAD",
    status: "BLOCKED",
    evidence: ["PLAN_KITCHEN", "ELEVATION_KITCHEN", "FLOOR_1", "FLOOR_2"],
    checks: [
      check("G5_COORDINATES", "Координаты и единицы", "BIM-координатор", "нативная модель", "BLOCKED", ["FLOOR_1", "FLOOR_2"], blockedNative),
      check("G5_EXCHANGE", "Обменные форматы", "BIM-координатор", "IFC, DWG, GLB", "BLOCKED", ["FACTS"], "Нет принятого комплекта обменных моделей v18."),
      check("G5_ROUNDTRIP", "Повторное открытие", "BIM-координатор", "ориентация и масштаб", "BLOCKED", ["FACTS"], "Не выполнена проверка C4D-IFC-GLB без зеркалирования и смещения."),
      check("G5_DELIVERABLES", "Комплект моделей", "BIM-координатор", "нативные файлы", "BLOCKED", ["PLAN_KITCHEN", "ELEVATION_KITCHEN"], "Есть размерные листы кухни, но нет принятой нативной модели всего объекта.")
    ]
  },
  {
    id: "G6",
    name: "Visuals",
    status: "BLOCKED",
    evidence: ["RENDER_K1", "RENDER_K2", "RENDER_K3", "RENDER_K4", "BROWSER_QA"],
    checks: [
      check("G6_CAMERAS", "Ракурсы", "визуализатор", "кухня", "PASS", ["RENDER_K1", "RENDER_K2", "RENDER_K3", "RENDER_K4"]),
      check("G6_MODEL_MATCH", "Совпадение с моделью", "независимый проверяющий", "кухня", "BLOCKED", ["RENDER_K1", "RENDER_K2", "RENDER_K3", "RENDER_K4"], blockedNative),
      check("G6_ANNOTATIONS", "Подписи и размеры", "архитектор", "сайт и листы", "PASS", ["PLAN_KITCHEN", "ELEVATION_KITCHEN", "BROWSER_QA"]),
      check("G6_STATES", "Статусы решений", "координатор", "сайт", "PASS", ["FACTS", "BROWSER_QA"])
    ]
  },
  {
    id: "G7",
    name: "Release",
    status: "BLOCKED",
    evidence: ["ESTIMATE", "CATALOG", "GITHUB_AUDIT", "BROWSER_QA"],
    checks: [
      check("G7_ESTIMATE", "Смета", "сметчик", "дом и участок", "BLOCKED", ["ESTIMATE"], "Нет ведомости фактических объёмов и коммерческих предложений."),
      check("G7_SCOPE", "Состав и исключения", "координатор", "клиентское приложение", "PASS", ["FACTS", "ESTIMATE"]),
      check("G7_LICENSES", "Лицензии", "технический аудитор", "код, модели и изображения", "BLOCKED", ["GITHUB_AUDIT"], "GitHub-код проверен, но нет полного реестра лицензий всех 3D-моделей и текстур будущей игровой версии."),
      check("G7_RELEASE", "Комплект передачи", "независимый проверяющий", "рабочий проект", "BLOCKED", ["BROWSER_QA", "FACTS"], "Веб-приложение открывается, но нативные рабочие проекты и подписи профильных специалистов отсутствуют.")
    ]
  }
];

const report = {
  project: "Дима Облагораживание",
  revision: "v18",
  reviewer: "residential-project-qa-gatekeeper",
  checked_at: new Date().toISOString(),
  independent: true,
  scope_stage: "предпроект для согласования",
  overall_status: "BLOCKED",
  release_decision:
    "Разрешена публикация только как предварительное клиентское приложение. Передача как рабочего строительного проекта запрещена.",
  files,
  gates
};

await writeFile(
  path.join(project, "qa/v18/qa-seven-gates.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);
await writeFile(
  path.join(project, "qa/v18/release-manifest.json"),
  JSON.stringify(
    {
      project: report.project,
      revision: report.revision,
      generated_at: report.checked_at,
      scope_stage: report.scope_stage,
      overall_status: report.overall_status,
      files
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Generated QA report and release manifest for ${files.length} evidence files.`);
