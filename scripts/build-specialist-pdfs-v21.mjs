import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const outDir = join(root, "public", "downloads", "v21", "specialists");
const tempDir = join(root, "tmp", "pdfs", "v21", "specialists");
mkdirSync(outDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const esc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const fileUrl = (relative) => pathToFileURL(join(root, "public", relative)).href;

const registerPath = join(root, "public", "downloads", "v21", "product-first-register-v21.csv");
const products = readFileSync(registerPath, "utf8")
  .replace(/^\uFEFF/, "")
  .split(/\r?\n/)
  .slice(1)
  .filter(Boolean)
  .map((line) => {
    const c = line.split(";");
    return {
      id: c[0], zone: c[1], title: c[2], quantity: c[3], passport: c[4],
      price: c[6], subtotal: c[7], stock: c[8], sheet: c[10], check: c[11], url: c[12],
    };
  });

const specialists = [
  {
    file: "01-architect-constructor",
    title: "Архитектор и конструктор",
    status: "РАСЧЁТ / РАБОЧАЯ ДОКУМЕНТАЦИЯ",
    goal: "Проверить фактическую коробку и выпустить рабочие решения по балкону над гаражом, новому дверному проёму детской, мангальной и бане.",
    inputs: ["исходный PDF заказчика, листы 6–11", "лазерный обмер всех этажей и проёмов", "обследование плит, стен, перемычек и основания", "нагрузки от балкона, ограждений, мебели и людей"],
    deliverables: ["обмерные планы, четыре фасада, разрезы и ведомость отклонений", "расчёт и узлы балкона без стоек в проезде гаража", "усиление нового проёма детской и безопасное ограждение", "узлы примыкания мангальной и бани, пожарные отступы", "подписанный комплект КР/АР и задание смежникам"],
    stop: "Не демонтировать подоконный блок, не нагружать балкон и не строить примыкания до расчёта и письменного решения конструктора.",
    message: "Здравствуйте. Нужны обмер, обследование коробки и рабочий проект изменений частного дома в Ставрополе. Прошу отдельно рассчитать балкон над гаражом без опор в проезде, новый выход из детской, мангальную у стены и баню 3×7 м. Прилагаю исходный PDF и координационные листы.",
    drawings: ["downloads/official-architecture.pdf", "plans/v21/AR-05-bedroom-layout-plan.svg", "plans/v20/balcony-safety.svg", "plans/v21/AR-09-mangal-photo-match.svg"],
    productIds: [],
  },
  {
    file: "02-electrician",
    title: "Инженер ЭОМ / электромонтажник",
    status: "СНАЧАЛА ПРОЕКТ ЭОМ",
    goal: "Выпустить точные планы розеток, света, щита и кабельных трасс после фиксации техники, мебели и разрешённой мощности.",
    inputs: ["ТУ и разрешённая мощность", "паспорта всей техники и оборудования", "согласованные планы мебели и потолков", "влажные зоны, фасадное освещение, ворота, баня и участок"],
    deliverables: ["однолинейная схема, расчёт нагрузок и селективности", "планы розеток/выключателей с координатами X/Y/H", "групповые линии, кабели, защиты, УЗО/дифавтоматы", "сценарии света день/ночь и аварийное отключение", "кабельный журнал, спецификация и исполнительные схемы"],
    stop: "Не штробить и не закупать кабель по предварительному количеству 850 м до расчёта ЭОМ.",
    message: "Здравствуйте. Нужен рабочий проект ЭОМ частного дома: два этажа, гараж, подвал, котельная, баня, фасад и участок. Мебель и техника выбраны; прошу проверить паспорта, выдать координаты каждой точки, щит, защиты, кабели, сценарии освещения и спецификацию.",
    drawings: ["plans/v17/electrical-floor1.svg", "plans/v17/electrical-floor2.svg", "plans/v21/EOM-01-kitchen-outlets.svg"],
    productIds: ["K-01", "K-02", "K-03", "K-04", "K-05", "K-06", "K-09", "E-01", "E-02", "E-03", "E-04", "E-05"],
  },
  {
    file: "03-plumber-vk",
    title: "Инженер ВК / сантехник",
    status: "СНАЧАЛА РАСЧЁТ ВК",
    goal: "Привязать воду, канализацию, коллекторы и сервисные люки ко всем выбранным приборам дома, кухни, бани и мангальной.",
    inputs: ["точки ввода и выпуска, давление и анализ воды", "утверждённые планы санузлов и кухни", "паспорта приборов", "отметки полов, перекрытий и трасс"],
    deliverables: ["аксонометрия ХВС/ГВС/канализации", "координаты выводов X/Y/H и отметки трапов", "диаметры, уклоны, коллекторы, арматура и водоподготовка", "узлы гидроизоляции и сервисного доступа", "испытания и исполнительная схема"],
    stop: "Не заливать стяжку и не зашивать инсталляции до опрессовки, фотофиксации и акта скрытых работ.",
    message: "Здравствуйте. Нужен рабочий проект ВК для частного дома с тремя санузлами, кухней, котельной, баней и мойкой мангальной. Прилагаю модели и паспорта оборудования. Прошу выдать точные координаты, диаметры, уклоны, коллекторы, гидроизоляцию и спецификацию.",
    drawings: ["plans/v17/water-sewer.svg", "plans/v18/kitchen-mep.svg", "plans/v21/KM-04-product-coordination.svg"],
    productIds: ["K-04", "K-07", "K-08", "K-09", "S-01", "S-02", "S-03", "S-04", "M-02"],
  },
  {
    file: "04-hvac-boiler",
    title: "Инженер ОВ и котельной",
    status: "ТЕПЛОТЕХНИЧЕСКИЙ И АЭРОДИНАМИЧЕСКИЙ РАСЧЁТ",
    goal: "Рассчитать отопление, вентиляцию и котельную, сохранив сервисные зоны и исключив пересечения со строительными конструкциями.",
    inputs: ["теплотехнические характеристики ограждений", "объёмы и назначение помещений", "газовые ТУ и выбранное оборудование", "план потолков и допустимые проходки"],
    deliverables: ["теплопотери и подбор приборов отопления", "воздухообмены, аэродинамика, сечения, шум и балансировка", "схема котельной с сервисными зонами и дренажом", "дымоудаление кухни/котельной/мангальной как отдельные системы", "спецификация, автоматика и пусконаладка"],
    stop: "Не покупать установку и котёл только по габариту; мощности, трассы и дымоудаление пока не рассчитаны.",
    message: "Здравствуйте. Нужен рабочий проект ОВ частного дома в Ставрополе: отопление, котельная, приточно-вытяжная вентиляция, кухня, санузлы и отдельная мангальная. В сцене стоят кандидаты по габаритам; прошу выполнить расчёты и подтвердить либо заменить оборудование.",
    drawings: ["plans/v21/OV-01-boiler-room.svg", "plans/v21/OV-02-ventilation.svg"],
    productIds: ["K-05", "M-01", "M-02", "M-03"],
  },
  {
    file: "05-gas-designer",
    title: "Лицензированный проектировщик газа",
    status: "BLOCKED ДО ТУ",
    goal: "Получить отдельный согласованный проект газоснабжения котельной и допустимых газовых потребителей.",
    inputs: ["технические условия газораспределительной организации", "правоустанавливающие документы и план дома", "паспорт котла после теплотехнического расчёта", "вентиляция, дымоход, объём и остекление котельной"],
    deliverables: ["проект ГСВ/ГСН по ТУ", "трасса, узел учёта, запорная арматура и автоматика", "проверка помещения котельной и воздухообмена", "согласование, договор и исполнительная документация"],
    stop: "Не переносить газовую точку и не подключать оборудование самостоятельно. Координационный лист не является газовым проектом.",
    message: "Здравствуйте. Нужны ТУ, обследование и официальный проект газоснабжения частного дома в Ставрополе. Котельная 8,24 м², кандидат котла указан в приложении. Прошу проверить помещение, мощность, вентиляцию, дымоход и выпустить согласуемый комплект.",
    drawings: ["plans/v21/OV-01-boiler-room.svg"],
    productIds: ["M-01"],
  },
  {
    file: "06-kitchen-furniture",
    title: "Проектировщик кухни и мебельщик",
    status: "ПОСЛЕ ЧИСТОВОГО ОБМЕРА",
    goal: "Выпустить рабочую кухню по выбранной технике, не перекрывая окна и сохранив доступ ко всем коммуникациям.",
    inputs: ["чистовой обмер стен, пола, потолка и проёмов", "паспорта K-01…K-09", "утверждённые выводы ЭОМ/ВК/ОВ", "материалы фасадов, столешницы и фурнитуры"],
    deliverables: ["план и четыре развёртки с модулями", "карта ниш, вырезов, вентиляционных зазоров и открывания", "карта электрики/воды/слива/вытяжки", "спецификация корпусов, фасадов и фурнитуры", "монтажный контроль и акт регулировки"],
    stop: "Не запускать кухню в производство по проектным размерам коробки. Нужен чистовой контрольный обмер.",
    message: "Здравствуйте. Нужен рабочий проект кухни 5,20 м и острова 2,40×1,00 м. Техника, мойка и смеситель выбраны; окна должны оставаться полностью свободными. Прошу проверить каждый паспорт, выдать карту ниш/вырезов/выводов и коммерческое предложение после чистового обмера.",
    drawings: ["plans/v21/AR-04-kitchen-elevations.svg", "plans/v21/EOM-01-kitchen-outlets.svg", "plans/v21/KM-04-product-coordination.svg"],
    productIds: ["K-00", "K-01", "K-02", "K-03", "K-04", "K-05", "K-06", "K-07", "K-08", "K-09", "F-01", "F-02", "F-03"],
  },
  {
    file: "07-landscape-gardener",
    title: "Ландшафтный дизайнер и садовник",
    status: "ПОСЛЕ ТОПОСЪЁМКИ И АНАЛИЗА ПОЧВЫ",
    goal: "Перенести посадочную схему на участок: больше цветов и кустарников, минимум деревьев, безопасные проходы и сезонная декоративность.",
    inputs: ["топосъёмка, инсоляция и направление ветра", "анализ почвы, pH и вода для полива", "вертикальная планировка и дренаж", "фактические партии растений"],
    deliverables: ["разбивочный и посадочный планы с координатами", "ведомость растений: сорт, размер поставки, шаг и количество", "почвенные смеси, капельный полив и мульчирование", "календарь ухода, обрезки, подкормки и зимовки", "акт приживаемости и замены"],
    stop: "Не высаживать взрослые кроны по размеру модели; в C4D показан будущий объём, а не поставочный размер.",
    message: "Здравствуйте. Нужна реализация посадочного плана участка 20×30 м в Ставрополе. Приоритет — цветы и кустарники, зелёная полоса справа, мало деревьев. Прошу проверить почву/свет/полив, привязать каждое растение и дать календарь ухода.",
    drawings: ["plans/v21/GP-01-planting-plan.svg", "plans/v20/landscape-planting-plan.svg"],
    productIds: ["P-01", "P-02", "P-03", "P-04"],
  },
  {
    file: "08-paving-drainage",
    title: "Подрядчик покрытий и водоотвода",
    status: "ПОСЛЕ ВЕРТИКАЛЬНОЙ ПЛАНИРОВКИ",
    goal: "Сделать передний двор преимущественно бетонным, обеспечить заезд в гараж, уклоны от дома и организованный водоотвод.",
    inputs: ["топосъёмка с отметками", "геология/несущая способность основания", "масса автомобиля и режим эксплуатации", "точка законного сброса воды"],
    deliverables: ["план высот, уклонов и водосборных площадей", "пироги автомобильных и пешеходных покрытий", "лотки, пескоуловители, решётки и выпуск", "деформационные швы, бордюры и примыкания", "испытание проливом и исполнительные отметки"],
    stop: "Плитка 40 мм из реестра — только пешеходная; не применять на заезде автомобиля.",
    message: "Здравствуйте. Нужна вертикальная планировка и рабочий проект покрытий участка 20×30 м: большой бетонный передний двор, заезд в гараж, дорожки и линейный водоотвод. Прошу выдать отметки, уклоны, пироги, узлы и точную ведомость объёмов.",
    drawings: ["plans/v21/GP-01-planting-plan.svg", "plans/v19/landscape-plan.svg"],
    productIds: ["L-01", "L-02"],
  },
  {
    file: "09-finishes-general-contractor",
    title: "Генподрядчик и отделочные работы",
    status: "ПОСЛЕ КООРДИНАЦИИ ВСЕХ СЕТЕЙ",
    goal: "Организовать ремонт коробки по этапам, не закрывая непроверенные инженерные системы и скрытые работы.",
    inputs: ["утверждённые АР/КР/ЭОМ/ВК/ОВ", "ведомость помещений и отделки", "карты мокрых зон и узлы примыканий", "график поставок кухни, дверей и сантехники"],
    deliverables: ["календарный график и разбивка на захватки", "ведомость объёмов и смета материалов/работ", "образцы отделки и контрольные выкрас/раскладка", "акты скрытых работ, фотофиксация и журнал", "поэтапная приёмка геометрии и качества"],
    stop: "Не штукатурить поверх непринятых трасс и не укладывать плитку без испытаний ВК и гидроизоляции.",
    message: "Здравствуйте. Нужен расчёт и организация ремонта частного дома после коробки: черновая инженерия, штукатурка, стяжка, гидроизоляция, плитка, окраска, потолки и монтаж. Прошу смету по этапам, график, акты скрытых работ и гарантию.",
    drawings: ["downloads/official-architecture.pdf", "plans/v21/AR-05-bedroom-layout-plan.svg"],
    productIds: ["M-04", "M-05"],
  },
  {
    file: "10-bath-mangal-fire-safety",
    title: "Баня, печник и пожарная безопасность мангальной",
    status: "РАБОЧИЙ ПЕЧНОЙ ПРОЕКТ",
    goal: "Выпустить безопасные решения бани 3×7 м и кирпичной мангальной, примыкающей к дому, с отдельным дымоудалением.",
    inputs: ["фундамент и конструкции бани", "точная печь и полный дымоходный комплект", "материалы стены дома и перекрытий", "вентиляция, вода, канализация и электрика"],
    deliverables: ["план бани, полки, печь, защитные экраны и проходки", "отступы до горючих конструкций и узел основания", "полный дымоход, ревизия, оголовок и пожарные разделки", "мангальная со столешницей вне окна и сервисным доступом", "инструкции эксплуатации, огнетушитель и датчики"],
    stop: "Не покупать разрозненные секции дымохода и не разжигать печь/мангал без приёмки специалистом.",
    message: "Здравствуйте. Нужен рабочий проект и монтаж бани 3×7 м и кирпичной мангальной у задней стены дома. Прошу рассчитать печь, основание, экраны, вентиляцию, полный дымоход, проходки и пожарные отступы. Столешница мангальной не должна перекрывать окно.",
    drawings: ["plans/v19/bath-plan.svg", "plans/v21/AR-09-mangal-photo-match.svg", "plans/v21/GP-01-planting-plan.svg"],
    productIds: ["B-01", "B-02", "B-03"],
  },
];

const css = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #17251e; font-family: "Segoe UI", Arial, sans-serif; }
  .page { position: relative; width: 210mm; min-height: 297mm; padding: 18mm 16mm; page-break-after: always; background: #f5f3ed; }
  .page:last-child { page-break-after: auto; }
  .cover { display: flex; min-height: 297mm; flex-direction: column; justify-content: space-between; color: white; background: #183127; }
  .eyebrow { color: #d5a47a; font: 700 9pt Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 7mm 0; font: 500 34pt/1 Georgia, serif; }
  h2 { margin: 3mm 0 6mm; font: 500 22pt/1.1 Georgia, serif; }
  h3 { margin: 0 0 2mm; font-size: 13pt; }
  p, li { font-size: 10pt; line-height: 1.5; }
  .status { display: inline-block; padding: 2.5mm 4mm; color: #3e2b11; font-weight: 800; border-radius: 2mm; background: #efce99; }
  .meta { display: grid; gap: 4mm; }
  .meta div { padding-top: 4mm; border-top: .3mm solid rgba(255,255,255,.18); }
  .meta b { display: block; margin-bottom: 1.5mm; color: #d5a47a; font: 700 8pt Consolas, monospace; }
  .block { margin-bottom: 8mm; padding: 6mm; border: .3mm solid #ced7d1; border-radius: 3mm; background: white; }
  ul { margin: 0; padding-left: 6mm; }
  li { margin: 2mm 0; }
  .stop { color: #64291f; border-left: 2mm solid #b5543f; background: #f7e7df; }
  .message { color: #123d2b; border-left: 2mm solid #3d805f; background: #e8f2ec; }
  .product { margin: 3mm 0; padding: 4mm; border: .3mm solid #d6ddd8; border-radius: 2mm; background: white; }
  .product header { display: flex; justify-content: space-between; gap: 4mm; }
  .product b { color: #8c5536; }
  .product dl { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 6mm; margin: 3mm 0; }
  .product dt { color: #6b746f; font-size: 8pt; }
  .product dd { margin: 0; font-size: 8.5pt; }
  a { color: #17613f; font-weight: 700; overflow-wrap: anywhere; }
  .drawing { padding: 8mm; background: #e4e6e1; }
  .drawing img { width: 100%; height: 248mm; object-fit: contain; background: white; }
  .footer { position: absolute; right: 12mm; bottom: 7mm; color: #77807a; font: 7pt Consolas, monospace; }
`;

function productCard(product) {
  return `<article class="product">
    <header><b>${esc(product.id)}</b><span>${esc(product.zone)}</span></header>
    <h3>${esc(product.title)}</h3>
    <dl>
      <div><dt>Количество</dt><dd>${esc(product.quantity)}</dd></div>
      <div><dt>Размер</dt><dd>${esc(product.passport)}</dd></div>
      <div><dt>Цена</dt><dd>${esc(product.price)}</dd></div>
      <div><dt>Сумма</dt><dd>${esc(product.subtotal)}</dd></div>
      <div><dt>Лист</dt><dd>${esc(product.sheet)}</dd></div>
      <div><dt>Статус</dt><dd>${esc(product.stock)}</dd></div>
    </dl>
    <p><strong>Проверить:</strong> ${esc(product.check)}</p>
    <a href="${esc(product.url)}">Открыть карточку товара</a>
  </article>`;
}

function buildBody(specialist) {
  const selected = specialist.productIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);
  const cover = `<section class="page cover">
    <div>
      <div class="eyebrow">Дима · благоустройство · отдельное ТЗ специалисту</div>
      <h1>${esc(specialist.title)}</h1>
      <p>${esc(specialist.goal)}</p>
    </div>
    <div>
      <div class="status">${esc(specialist.status)}</div>
      <div class="meta">
        <div><b>ОБЪЕКТ</b><span>Частный дом, Ставрополь · участок 20×30 м · Cinema 4D v20.2</span></div>
        <div><b>СТАТУС</b><span>Координационное техническое задание. Не заменяет подписанную рабочую документацию.</span></div>
        <div><b>ДАТА</b><span>30.07.2026</span></div>
      </div>
    </div>
  </section>`;
  const brief = `<section class="page">
    <div class="eyebrow">01 · вход и результат</div>
    <h2>Что получить от специалиста</h2>
    <div class="block"><h3>Передать на вход</h3><ul>${specialist.inputs.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
    <div class="block"><h3>Получить на выходе</h3><ul>${specialist.deliverables.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
    <div class="block stop"><h3>Стоп-условие</h3><p>${esc(specialist.stop)}</p></div>
    <div class="block message"><h3>Сообщение исполнителю</h3><p>${esc(specialist.message)}</p></div>
    <div class="footer">${esc(specialist.file)} · стр. 2</div>
  </section>`;
  const productPages = selected.length
    ? Array.from({ length: Math.ceil(selected.length / 3) }, (_, index) => {
      const group = selected.slice(index * 3, index * 3 + 3);
      return `<section class="page"><div class="eyebrow">02 · выбранные товары</div><h2>Проверить паспорта и совместимость</h2>${group.map(productCard).join("")}<div class="footer">${esc(specialist.file)} · товары ${index + 1}</div></section>`;
    })
    : [];
  const drawings = specialist.drawings.map((drawing, index) => `<section class="page drawing">
    ${drawing.endsWith(".pdf")
      ? `<div class="block"><div class="eyebrow">Исходный документ</div><h2>Архитектурный PDF заказчика</h2><p>Откройте исходник отдельно и используйте листы 6–11. Перед рабочим проектом обязательно сравнить с натурным обмером.</p><p><a href="${fileUrl(drawing)}">Открыть исходный PDF</a></p></div>`
      : `<img src="${fileUrl(drawing)}" alt="${esc(drawing)}">`}
    <div class="footer">${esc(specialist.file)} · лист ${index + 1}</div>
  </section>`);
  return [cover, brief, ...productPages, ...drawings].join("");
}

for (const specialist of specialists) {
  const htmlPath = join(tempDir, `${specialist.file}.html`);
  const pdfPath = join(outDir, `${specialist.file}.pdf`);
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>${css}</style></head><body>${buildBody(specialist)}</body></html>`;
  writeFileSync(htmlPath, html, "utf8");
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
  console.log(pdfPath);
}
