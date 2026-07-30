"use client";

import { useEffect, useMemo, useState } from "react";

function assetV21(path: string) {
  if (typeof window === "undefined") return path;
  const base = window.location.pathname.startsWith("/dima-oblagorazhivanie")
    ? "/dima-oblagorazhivanie"
    : "";
  if (base && (path === base || path.startsWith(`${base}/`))) return path;
  return `${base}${path}`;
}

type TourStop = {
  zone: string;
  title: string;
  image: string;
  drawing?: string;
  note: string;
};

const tourStops: TourStop[] = [
  { zone: "Фасады", title: "Улица → главный фасад", image: "/renders/v21/c4d-control/05-front-client-changes.png", drawing: "/renders/v21/c4d-control/01-front-pdf.png", note: "Гараж слева, дорога спереди. Балкон на всю ширину гаража; стойки не мешают заезду." },
  { zone: "Фасады", title: "Общий балкон", image: "/renders/v21/c4d-control/06-balcony-connected.png", drawing: "/renders/v21/c4d-control/18-balcony-safety.png", note: "Единый Г-образный балкон связывает дверь родителей и новую дверь детской." },
  { zone: "Участок", title: "Задний двор и мангальная", image: "/renders/v21/c4d-v20-2/50_mangal-photo-match-overview_v20_2.png", drawing: "/plans/v21/AR-09-mangal-photo-match.svg", note: "Исправлено по листу 7: Г-контур 1640 × 1990 мм находится в наружном правом углу террасы; возврат заканчивается до фасада и не перекрывает окно." },
  { zone: "Участок", title: "Участок целиком", image: "/renders/v21/c4d-control/09-site-overview.png", drawing: "/plans/v21/GP-01-planting-plan.svg", note: "Участок 20 × 30 м, баня 3 × 7 м, хозблок 1 × 3 м, бетонный передний двор и зелёная полоса справа." },
  { zone: "1 этаж", title: "Кухня-гостиная · ракурс 1", image: "/renders/v21/c4d-control/13-kitchen-living-a.png", drawing: "/plans/v21/AR-04-kitchen-elevations.svg", note: "Линейная кухня 5,20 м на внутренней стене; остров 2,40 × 1,00 м." },
  { zone: "1 этаж", title: "Кухня · окна свободны", image: "/renders/v21/c4d-control/39-kitchen-windows-clear.png", drawing: "/plans/v21/EOM-01-kitchen-outlets.svg", note: "Контрольный ракурс подтверждает: кухонная мебель не закрывает заднее остекление." },
  { zone: "1 этаж", title: "Лестница снизу", image: "/renders/v21/c4d-control/21-stairs-bottom.png", note: "Контроль лестничного марша и связи с коридором первого этажа." },
  { zone: "1 этаж", title: "Коридор", image: "/renders/v21/c4d-control/23-corridor-f1.png", note: "Путь от входа к санузлу, котельной, лестнице и кухне." },
  { zone: "1 этаж", title: "Гостевая · ракурс 1", image: "/renders/v21/c4d-control/33-guest-a.png", note: "Кровать 1600, шкаф и рабочее место в пределах комнаты по листу 7 PDF." },
  { zone: "1 этаж", title: "Гостевая · ракурс 2", image: "/renders/v21/c4d-control/34-guest-b.png", note: "Обратный ракурс для проверки проходов и окна." },
  { zone: "1 этаж", title: "Санузел · ракурс 1", image: "/renders/v21/c4d-control/25-bath-f1-a.png", note: "Инсталляция, раковина, зеркало и душевая; выводы фиксируются после обмера." },
  { zone: "1 этаж", title: "Санузел · ракурс 2", image: "/renders/v21/c4d-control/26-bath-f1-b.png", note: "Обратный ракурс для проверки зоны открывания и обслуживания." },
  { zone: "Гараж", title: "Гараж от ворот", image: "/renders/v21/c4d-control/35-garage-a.png", drawing: "/plans/v20/garage-basement-layouts.svg", note: "Автомобиль — габаритная оболочка 4,75 × 1,90 × 1,72 м для проверки заезда." },
  { zone: "Гараж", title: "Гараж от задней стены", image: "/renders/v21/c4d-control/36-garage-b.png", drawing: "/plans/v20/garage-basement-layouts.svg", note: "Второй ракурс показывает свободный путь к воротам и внутренней двери." },
  { zone: "Подвал", title: "Подвал · общий вид", image: "/renders/v21/c4d-control/37-basement-a.png", drawing: "/plans/v20/garage-basement-layouts.svg", note: "План и площадь 58,56 м² взяты с листа 6 PDF; высоту требуется подтвердить обмером." },
  { zone: "Подвал", title: "Подвал · хранение", image: "/renders/v21/c4d-control/38-basement-b.png", drawing: "/plans/v20/garage-basement-layouts.svg", note: "Стеллажи, верстак и технический шкаф показаны как вариант расстановки." },
  { zone: "2 этаж", title: "Спальня родителей · ракурс 1", image: "/renders/v21/c4d-control/14-parents-a.png", drawing: "/plans/v21/AR-06-parents-elevations.svg", note: "Кровать 1800, две тумбы и свободный путь к балконной двери." },
  { zone: "2 этаж", title: "Спальня родителей · ракурс 2", image: "/renders/v21/c4d-control/41-parents-b.png", drawing: "/plans/v21/AR-06-parents-elevations.svg", note: "Вид от балкона к комнате и проходу в гардеробную." },
  { zone: "2 этаж", title: "Детская Дарины · ракурс 1", image: "/renders/v21/c4d-control/15-darina-a.png", drawing: "/plans/v21/AR-07-darina-elevations.svg", note: "Кровать, рабочее место, шкаф, гимнастическая стенка и мат." },
  { zone: "2 этаж", title: "Детская Дарины · ракурс 2", image: "/renders/v21/c4d-control/42-darina-b.png", drawing: "/plans/v21/AR-07-darina-elevations.svg", note: "Вид от новой двери общего балкона; проём требует расчёта конструктора." },
  { zone: "2 этаж", title: "Детская Ярика · ракурс 1", image: "/renders/v21/c4d-control/16-yarik-a.png", drawing: "/plans/v21/AR-08-yarik-elevations.svg", note: "Кровать, стол, шкаф, хранение формы и свободная игровая зона." },
  { zone: "2 этаж", title: "Детская Ярика · ракурс 2", image: "/renders/v21/c4d-control/43-yarik-b.png", drawing: "/plans/v21/AR-08-yarik-elevations.svg", note: "Обратный ракурс от окна к комнате." },
  { zone: "2 этаж", title: "Лестница сверху", image: "/renders/v21/c4d-control/22-stairs-top.png", note: "Контроль выхода на холл второго этажа." },
  { zone: "2 этаж", title: "Коридор", image: "/renders/v21/c4d-control/24-corridor-f2.png", note: "Связь детских, санузлов, спальни родителей и лестницы." },
  { zone: "2 этаж", title: "Гардеробная · ракурс 1", image: "/renders/v21/c4d-control/31-wardrobe-a.png", note: "Система хранения в отдельном помещении; производство после чистового обмера." },
  { zone: "2 этаж", title: "Гардеробная · ракурс 2", image: "/renders/v21/c4d-control/32-wardrobe-b.png", note: "Обратный ракурс показывает глубину и сервисный проход." },
  { zone: "2 этаж", title: "Санузел детей · ракурс 1", image: "/renders/v21/c4d-control/27-child-bath-a.png", note: "Компоновка оборудования и проходов." },
  { zone: "2 этаж", title: "Санузел детей · ракурс 2", image: "/renders/v21/c4d-control/28-child-bath-b.png", note: "Обратный контрольный ракурс." },
  { zone: "2 этаж", title: "Санузел родителей · ракурс 1", image: "/renders/v21/c4d-control/29-parents-bath-b.png", note: "Ванна 1700, инсталляция и двойная раковина." },
  { zone: "2 этаж", title: "Санузел родителей · ракурс 2", image: "/renders/v21/c4d-control/30-parents-bath-c.png", note: "Второй ракурс для проверки проходов и выводов." },
  { zone: "Инженерия", title: "Котельная · ракурс 1", image: "/renders/v21/c4d-control/44-boiler-a.png", drawing: "/plans/v21/OV-01-boiler-room.svg", note: "B01 и B02 построены по опубликованным габаритам производителя; система требует расчёта." },
  { zone: "Инженерия", title: "Котельная · ракурс 2", image: "/renders/v21/c4d-control/45-boiler-b.png", drawing: "/plans/v21/OV-01-boiler-room.svg", note: "Обратный вид сервисной зоны, коллекторов, водоподготовки и газовой точки." },
  { zone: "Инженерия", title: "Вентиляционная установка", image: "/renders/v21/c4d-control/46-vent-unit.png", drawing: "/plans/v21/OV-02-ventilation.svg", note: "Корпус V01 построен 470 × 730 × 675 мм; расход и трассы пока расчётные." },
];

const roomPackages = [
  {
    code: "АР-06",
    title: "Спальня родителей",
    layout: "/plans/v21/AR-05-1-parents-plan.svg",
    elevations: "/plans/v21/AR-06-parents-elevations.svg",
    renders: ["/renders/v21/c4d-control/14-parents-a.png", "/renders/v21/c4d-control/41-parents-b.png"],
    brief: "4430 × 3640 мм · кровать 1800 · два выхода на единый балкон через спальню родителей и детскую.",
  },
  {
    code: "АР-07",
    title: "Детская Дарины",
    layout: "/plans/v21/AR-05-2-darina-plan.svg",
    elevations: "/plans/v21/AR-07-darina-elevations.svg",
    renders: ["/renders/v21/c4d-control/15-darina-a.png", "/renders/v21/c4d-control/42-darina-b.png"],
    brief: "4450 × 3950 мм · гимнастическая зона · новая дверь на общий балкон — изменение заказчика.",
  },
  {
    code: "АР-08",
    title: "Детская Ярика",
    layout: "/plans/v21/AR-05-3-yarik-plan.svg",
    elevations: "/plans/v21/AR-08-yarik-elevations.svg",
    renders: ["/renders/v21/c4d-control/16-yarik-a.png", "/renders/v21/c4d-control/43-yarik-b.png"],
    brief: "5430 × 3950 мм · хранение формы и мячей · свободная игровая зона.",
  },
];

export function JourneyPage() {
  const [index, setIndex] = useState(0);
  const [zone, setZone] = useState("Все");
  const zones = useMemo(() => ["Все", ...Array.from(new Set(tourStops.map((item) => item.zone)))], []);
  const visible = zone === "Все" ? tourStops : tourStops.filter((item) => item.zone === zone);
  const current = visible[Math.min(index, visible.length - 1)] ?? tourStops[0];
  const move = (delta: number) => setIndex((value) => (value + delta + visible.length) % visible.length);

  return (
    <div className="v21-page">
      <section className="v21-hero">
        <div>
          <span>Маршрут по дому · Cinema 4D v20.2</span>
          <h1>Путешествие только по рендерам</h1>
          <p>33 последовательные точки: фасады, участок, комнаты, гараж, подвал, котельная и вентиляция. Каждый кадр связан с чертежом и тем же объектом в сцене.</p>
        </div>
        <div className="v21-release-stamp"><strong>52</strong><span>камеры в C4D</span><b>геометрия собрана</b><small>фотореал — отдельный контроль качества</small></div>
      </section>

      <section className="render-tour" aria-label="Путешествие по рендерам">
        <div className="tour-zones">
          {zones.map((item) => (
            <button key={item} className={zone === item ? "active" : ""} onClick={() => { setZone(item); setIndex(0); }}>{item}</button>
          ))}
        </div>
        <div className="tour-stage">
          <img src={assetV21(current.image)} alt={current.title} />
          <div className="tour-coordinate"><span>{current.zone}</span><b>{String(visible.indexOf(current) + 1).padStart(2, "0")} / {String(visible.length).padStart(2, "0")}</b></div>
          <button className="tour-prev" aria-label="Предыдущий ракурс" onClick={() => move(-1)}>←</button>
          <button className="tour-next" aria-label="Следующий ракурс" onClick={() => move(1)}>→</button>
        </div>
        <div className="tour-caption">
          <div><span>Текущая точка</span><h2>{current.title}</h2><p>{current.note}</p></div>
          <div className="tour-links">
            {current.drawing && <a href={assetV21(current.drawing)} target="_blank" rel="noreferrer">Открыть связанный лист ↗</a>}
            <a href={assetV21("/models/dima-master-v20-2.c4d")} download>Скачать Cinema 4D</a>
            <a href={assetV21("/models/dima-v20-2.glb")} download>Скачать GLB для браузера</a>
          </div>
        </div>
        <div className="tour-strip">
          {visible.map((item, itemIndex) => (
            <button key={`${item.zone}-${item.title}`} className={item === current ? "active" : ""} onClick={() => setIndex(itemIndex)}>
              <img src={assetV21(item.image)} alt="" /><span>{item.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="v21-section direct-c4d-renders">
        <div className="v21-heading">
          <span>Новый расчёт Cinema 4D v20.2 · 1600 × 1000</span>
          <h2>Одиннадцать кадров с обновлёнными габаритами, включая исправленную мангальную</h2>
          <p>Это прямой вывод из нативной сцены после обновления товаров. Он подтверждает расстановку и масштаб, но пока не получает статус фотографии: форма предметов упрощена до проверяемых габаритных моделей.</p>
        </div>
        <div className="direct-c4d-grid">
          {[
            ["Главный фасад", "/renders/v21/c4d-v20-2/01-front-v20-2.png"],
            ["Задняя мангальная", "/renders/v21/c4d-v20-2/02-rear-mangal-v20-2.png"],
            ["Баня 3 × 7 м", "/renders/v21/c4d-v20-2/03-bath-v20-2.png"],
            ["Кухня-гостиная", "/renders/v21/c4d-v20-2/04-kitchen-living-v20-2.png"],
            ["Спальня родителей", "/renders/v21/c4d-v20-2/05-parents-v20-2.png"],
            ["Комната Дарины", "/renders/v21/c4d-v20-2/06-darina-v20-2.png"],
            ["Комната Ярика", "/renders/v21/c4d-v20-2/07-yarik-v20-2.png"],
            ["Котельная", "/renders/v21/c4d-v20-2/08-boiler-v20-2.png"],
            ["Мангальная · положение на террасе", "/renders/v21/c4d-v20-2/50_mangal-photo-match-overview_v20_2.png"],
            ["Мангальная · кирпичная стена и Г-контур", "/renders/v21/c4d-v20-2/51_mangal-L-firebox_v20_2.png"],
            ["Мангальная · встроенная мойка", "/renders/v21/c4d-v20-2/52_mangal-integrated-sink_v20_2.png"],
          ].map(([title, image]) => (
            <figure key={title}>
              <a href={assetV21(image)} target="_blank" rel="noreferrer"><img src={assetV21(image)} alt={title} /></a>
              <figcaption><strong>{title}</strong><span>Cinema 4D v20.2 · контроль геометрии</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="v21-warning">
        <strong>Что означает «реалистично» на этом этапе</strong>
        <p>Ракурсы получены из точной сцены Cinema 4D и годятся для проверки геометрии. Материалы и растительность ещё не прошли финальный фотореалистичный допуск; поэтому сайт не маскирует контрольный рендер под фотографию.</p>
      </section>
    </div>
  );
}

export function RoomsV21() {
  return (
    <section className="v21-section">
      <div className="v21-heading"><span>Новый комплект АР-05…АР-08</span><h2>Спальни: сначала понятный план, затем четыре стены и два рендера</h2><p>Первый старый лист заменён: общая расстановка вынесена отдельно, а каждая комната получила собственную развёртку.</p></div>
      <a className="primary-sheet" href={assetV21("/plans/v21/AR-05-bedroom-layout-plan.svg")} target="_blank" rel="noreferrer">
        <img src={assetV21("/plans/v21/AR-05-bedroom-layout-plan.svg")} alt="АР-05 план расстановки мебели в спальнях" />
        <div><span>АР-05</span><strong>План мебели трёх спален</strong><p>Три помещения разделены, размеры и предметы читаются независимо.</p></div>
      </a>
      <div className="room-packages">
        {roomPackages.map((room) => (
          <article key={room.code}>
            <header><span>{room.code}</span><h3>{room.title}</h3><p>{room.brief}</p></header>
            <div className="package-label"><b>01</b><span>План комнаты с размерами и мебелью</span></div>
            <a className="sheet-preview" href={assetV21(room.layout)} target="_blank" rel="noreferrer"><img src={assetV21(room.layout)} alt={`${room.title}: план с расстановкой мебели`} /></a>
            <div className="package-label"><b>02</b><span>Два связанных ракурса Cinema 4D</span></div>
            <div className="paired-renders">
              {room.renders.map((render, index) => <img key={render} src={assetV21(render)} alt={`${room.title}, ракурс ${index + 1}`} />)}
            </div>
            <div className="package-label"><b>03</b><span>Развёртки всех четырёх стен</span></div>
            <a className="sheet-preview" href={assetV21(room.elevations)} target="_blank" rel="noreferrer"><img src={assetV21(room.elevations)} alt={`${room.title}: развёртки четырёх стен`} /></a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EngineeringV21() {
  const systems = [
    {
      code: "ОВ-01",
      title: "Котельная",
      sheet: "/plans/v21/OV-01-boiler-room.svg",
      renders: ["/renders/v21/c4d-control/44-boiler-a.png", "/renders/v21/c4d-control/45-boiler-b.png"],
      files: [
        ["Ведомость оборудования CSV", "/downloads/v20/boiler-room-equipment-register.csv"],
        ["BAXI B01", "https://baxi.ru/production/domestic/wall/eco_nova_2025/100023941/"],
        ["ROMMER B02", "https://www.rommer.ru/catalog/boylery/napolnyy_kosvennogo_nagreva/rommer-boyler-kosvennogo-nagreva-napolnyy-150-l/"],
      ],
    },
    {
      code: "ОВ-02",
      title: "Вентиляция",
      sheet: "/plans/v21/OV-02-ventilation.svg",
      renders: ["/renders/v21/c4d-control/46-vent-unit.png"],
      files: [
        ["Ведомость помещений CSV", "/downloads/v20/ventilation-room-schedule.csv"],
        ["ВЕНТС V01", "https://ventilation-system.com/ru/product/vue-350-v1b-ec-a21/"],
        ["Этапы специалистов", "/plans/v20/mep-specialist-roadmap.svg"],
      ],
    },
  ];
  return (
    <section className="v21-section">
      <div className="v21-heading"><span>Инженерный выпуск v20.2</span><h2>Котельная и вентиляция: чертёж + рендер + ведомость + официальный источник</h2><p>Коды B01, B02, V01 и трассы совпадают в Cinema 4D, на листах и в CSV. Не рассчитанные величины прямо отмечены словом «РАСЧЁТ».</p></div>
      <div className="engineering-packages">
        {systems.map((system) => (
          <article key={system.code}>
            <header><span>{system.code}</span><h3>{system.title}</h3></header>
            <a className="sheet-preview" href={assetV21(system.sheet)} target="_blank" rel="noreferrer"><img src={assetV21(system.sheet)} alt={`${system.title}: лист СПДС`} /></a>
            <div className="paired-renders">{system.renders.map((render, index) => <img key={render} src={assetV21(render)} alt={`${system.title}, C4D ракурс ${index + 1}`} />)}</div>
            <div className="engineering-links">
              {system.files.map(([label, href]) => <a key={label} href={href.startsWith("http") ? href : assetV21(href)} target="_blank" rel="noreferrer">{label} ↗</a>)}
            </div>
          </article>
        ))}
      </div>
      <div className="normative-rail">
        <a href="https://protect.gost.ru/gost/details/ba2db0a2-01aa-45da-a9dd-e5525bd69ec3" target="_blank" rel="noreferrer"><b>ГОСТ Р 21.101-2020</b><span>общие требования СПДС</span></a>
        <a href="https://protect.gost.ru/gost/details/a241e289-aac3-4ee2-ad44-3259f9774799" target="_blank" rel="noreferrer"><b>ГОСТ 21.501-2018</b><span>архитектурные решения</span></a>
        <a href="https://protect.gost.ru/gost/details/6e019265-6517-4679-a6b9-3e780b9de7d3" target="_blank" rel="noreferrer"><b>ГОСТ 21.602-2016</b><span>отопление и вентиляция</span></a>
        <a href="https://base.garant.ru/400235883/" target="_blank" rel="noreferrer"><b>ГОСТ 21.508-2020</b><span>генеральные планы</span></a>
      </div>
    </section>
  );
}

export function SheetsV21() {
  const sheets = [
    ["АР-04", "Кухня: четыре стены", "/plans/v21/AR-04-kitchen-elevations.svg"],
    ["ЭОМ-01", "Кухня: розетки и выводы", "/plans/v21/EOM-01-kitchen-outlets.svg"],
    ["КМ-04", "Кухня: координация реальных товаров", "/plans/v21/KM-04-product-coordination.svg"],
    ["АР-05", "Спальни: общий план мебели", "/plans/v21/AR-05-bedroom-layout-plan.svg"],
    ["АР-05.1", "Спальня родителей: план", "/plans/v21/AR-05-1-parents-plan.svg"],
    ["АР-05.2", "Детская Дарины: план", "/plans/v21/AR-05-2-darina-plan.svg"],
    ["АР-05.3", "Детская Ярика: план", "/plans/v21/AR-05-3-yarik-plan.svg"],
    ["АР-06", "Спальня родителей", "/plans/v21/AR-06-parents-elevations.svg"],
    ["АР-07", "Детская Дарины", "/plans/v21/AR-07-darina-elevations.svg"],
    ["АР-08", "Детская Ярика", "/plans/v21/AR-08-yarik-elevations.svg"],
    ["ОВ-01", "Котельная", "/plans/v21/OV-01-boiler-room.svg"],
    ["ОВ-02", "Вентиляция", "/plans/v21/OV-02-ventilation.svg"],
    ["ГП-01", "Посадочный план", "/plans/v21/GP-01-planting-plan.svg"],
  ];
  return (
    <section className="v21-section">
      <div className="v21-heading"><span>Реестр листов v20.2</span><h2>Подача по СПДС: шифр, стадия, лист, статус и связанная сцена</h2><p>Это координационный комплект. Для выполнения строительных работ профильные проектировщики выпускают рабочую документацию и подписывают её.</p></div>
      <div className="v21-sheet-register">
        {sheets.map(([code, title, href]) => (
          <a key={code} href={assetV21(href)} target="_blank" rel="noreferrer"><span>{code}</span><strong>{title}</strong><b>Открыть лист ↗</b></a>
        ))}
      </div>
    </section>
  );
}

type ProductRow = {
  id: string;
  zone: string;
  title: string;
  quantity: string;
  passport: string;
  model: string;
  price: string;
  subtotal: string;
  stock: string;
  modelStatus: string;
  sheet: string;
  check: string;
  url: string;
};

function parseProductRegister(source: string): ProductRow[] {
  return source
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cells = line.split(";");
      return {
        id: cells[0] ?? "",
        zone: cells[1] ?? "",
        title: cells[2] ?? "",
        quantity: cells[3] ?? "",
        passport: cells[4] ?? "",
        model: cells[5] ?? "",
        price: cells[6] ?? "",
        subtotal: cells[7] ?? "",
        stock: cells[8] ?? "",
        modelStatus: cells[9] ?? "",
        sheet: cells[10] ?? "",
        check: cells[11] ?? "",
        url: cells[12] ?? "",
      };
    });
}

export function ProductFirstV21() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [zone, setZone] = useState("Все");
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch(assetV21("/downloads/v21/product-first-register-v21.csv"))
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
      .then((text) => setItems(parseProductRegister(text)))
      .catch(() => setLoadError("Реестр не загрузился. Его можно скачать по кнопке ниже."));
  }, []);

  const zones = useMemo(() => ["Все", ...Array.from(new Set(items.map((item) => item.zone)))], [items]);
  const visible = useMemo(() => items.filter((item) => {
    const inZone = zone === "Все" || item.zone === zone;
    const haystack = `${item.id} ${item.zone} ${item.title}`.toLocaleLowerCase("ru");
    return inZone && haystack.includes(query.toLocaleLowerCase("ru"));
  }), [items, query, zone]);

  return (
    <section className="v21-section product-first">
      <div className="v21-heading">
        <span>Шаг 01 · сначала выбран товар</span>
        <h2>41 позиция: ссылка, паспортный размер, цена и соответствие модели</h2>
        <p>Размеры из этой таблицы уже используются в координационных листах и сцене Cinema 4D v20.2. Цена и наличие зафиксированы на 30.07.2026 и перепроверяются перед оплатой.</p>
      </div>
      <div className="product-register-controls">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти технику, мебель, растение…" aria-label="Поиск по товарам" />
        <select value={zone} onChange={(event) => setZone(event.target.value)} aria-label="Фильтр по зоне">
          {zones.map((item) => <option key={item}>{item}</option>)}
        </select>
        <a href={assetV21("/downloads/v21/product-first-register-v21.csv")} download>Скачать полный CSV</a>
      </div>
      {loadError && <div className="alert warning"><strong>Реестр</strong><p>{loadError}</p></div>}
      <div className="product-register-grid">
        {visible.map((item) => (
          <article key={item.id}>
            <header><span>{item.id}</span><em>{item.zone}</em></header>
            <h3>{item.title}</h3>
            <dl>
              <div><dt>Количество</dt><dd>{item.quantity}</dd></div>
              <div><dt>Паспортный габарит</dt><dd>{item.passport}</dd></div>
              <div><dt>В Cinema 4D</dt><dd>{item.model}</dd></div>
              <div><dt>Цена</dt><dd>{item.price}</dd></div>
              <div><dt>Сумма</dt><dd>{item.subtotal}</dd></div>
              <div><dt>Лист</dt><dd>{item.sheet}</dd></div>
            </dl>
            <div className="product-statuses"><span>{item.stock}</span><b>{item.modelStatus}</b></div>
            <p><strong>До заказа:</strong> {item.check}</p>
            <a href={item.url} target="_blank" rel="noreferrer">Открыть страницу товара ↗</a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EstimateWorkflowV21() {
  const stages = [
    ["01", "Обмер и обследование", "лазерный обмер, топосъёмка, конструктив коробки, вводы", "СТОП: без фактических отметок не фиксировать монтаж"],
    ["02", "Заморозка товаров", "паспорта, габариты, открывание, мощность, вода, вентиляция", "Можно параллельно: коммерческие предложения"],
    ["03", "АР и интерьер", "планы, фасады, разрезы, развёртки комнат, кухня и санузлы", "СТОП: согласование Дмитрия и Олеси"],
    ["04", "Конструктив", "балкон над гаражом, новый проём детской, мангальная, баня", "Только расчёт и подпись конструктора"],
    ["05", "ЭОМ / ВК / ОВ / газ", "координация розеток, света, воды, канализации, отопления, вентиляции", "Газ — отдельный лицензированный проект"],
    ["06", "Черновые работы", "проходки, трассы, штукатурка, стяжка, гидроизоляция", "Скрытые работы фотографировать и актировать"],
    ["07", "Чистовая отделка", "плитка, окраска, потолки, двери, свет", "Можно параллельно: производство кухни и мебели"],
    ["08", "Мебель и техника", "монтаж после чистового контрольного обмера", "Паспорта и сервисный доступ обязательны"],
    ["09", "Участок", "вертикальная планировка, дренаж, покрытия, полив, растения, свет", "Посадки после тяжёлой техники"],
    ["10", "Пуск и приёмка", "испытания, автоматика, балансировка, исполнительные схемы", "Переход к эксплуатации только по актам"],
  ];
  const electrical = [
    ["Розетки AtlasDesign", "120 × 855 ₽", "102 600 ₽"],
    ["Выключатели AtlasDesign", "44 × 528 ₽", "23 232 ₽"],
    ["Downlight Maytoni Focus", "54 × 3 600 ₽", "194 400 ₽"],
    ["Фасадные бра Maytoni Line", "10 × 16 190 ₽", "161 900 ₽"],
    ["Кабель 3×2,5", "850 м × 115,20 ₽", "97 920 ₽"],
  ];
  return (
    <section className="v21-section estimate-v21">
      <div className="v21-heading"><span>Маршрут Дмитрия</span><h2>Что делать по порядку и что запускать параллельно</h2><p>Каждый этап имеет входные данные, результат и точку остановки. Это защищает от закупки мебели до чистового обмера и от монтажа инженерии по эскизу.</p></div>
      <div className="workflow-v21">
        {stages.map(([number, title, scope, gate]) => (
          <article key={number}><b>{number}</b><div><h3>{title}</h3><p>{scope}</p><span>{gate}</span></div></article>
        ))}
      </div>
      <div className="estimate-snapshot">
        <div>
          <span className="eyebrow">Пример детализации электрики</span>
          <h2>580 052 ₽ — только пять видимых позиций</h2>
          <p>Это не полный бюджет ЭОМ: нет щита, автоматики, подрозетников, рамок, монтажа, слаботочки и расчётных линий.</p>
        </div>
        <div className="mini-cost-table">
          {electrical.map(([title, formula, total]) => <div key={title}><strong>{title}</strong><span>{formula}</span><b>{total}</b></div>)}
          <footer><span>Предварительный итог</span><strong>580 052 ₽</strong></footer>
        </div>
      </div>
    </section>
  );
}

const specialistFiles = [
  ["01", "Архитектор и конструктор", "/downloads/v21/specialists/01-architect-constructor.pdf"],
  ["02", "Электрик", "/downloads/v21/specialists/02-electrician.pdf"],
  ["03", "Сантехник / проектировщик ВК", "/downloads/v21/specialists/03-plumber-vk.pdf"],
  ["04", "Отопление, вентиляция и котельная", "/downloads/v21/specialists/04-hvac-boiler.pdf"],
  ["05", "Проектировщик газа", "/downloads/v21/specialists/05-gas-designer.pdf"],
  ["06", "Кухня, мебель и столярные изделия", "/downloads/v21/specialists/06-kitchen-furniture.pdf"],
  ["07", "Ландшафт и сад", "/downloads/v21/specialists/07-landscape-gardener.pdf"],
  ["08", "Покрытия, уклоны и водоотвод", "/downloads/v21/specialists/08-paving-drainage.pdf"],
  ["09", "Отделка и генеральный подрядчик", "/downloads/v21/specialists/09-finishes-general-contractor.pdf"],
  ["10", "Баня, печь и мангальная", "/downloads/v21/specialists/10-bath-mangal-fire-safety.pdf"],
];

export function DocumentsV21() {
  return (
    <section className="v21-section documents-v21">
      <div className="v21-heading"><span>Выдача v21</span><h2>Отдельный файл Дмитрию и отдельное ТЗ каждому специалисту</h2><p>В каждом ТЗ указаны исходные данные, выбранные товары, требуемые результаты, стоп-условия и сообщение, которое можно отправить исполнителю.</p></div>
      <div className="document-bundles">
        <a href={assetV21("/downloads/v21/Dima-client-drawings-and-renders-v21.pdf")} target="_blank"><span>Дмитрию</span><strong>Понятные чертежи и рендеры</strong><b>Открыть PDF ↗</b></a>
        <a href={assetV21("/downloads/v21/Dima-engineering-drawings-v21.pdf")} target="_blank"><span>Инженерам</span><strong>Координационные листы</strong><b>Открыть PDF ↗</b></a>
        <a href={assetV21("/downloads/v21/product-first-register-v21.csv")} download><span>Закупка</span><strong>41 товар с размерами и ссылками</strong><b>Скачать CSV</b></a>
        <a href={assetV21("/models/dima-master-v20-2.c4d")} download><span>3D</span><strong>Исходная сцена Cinema 4D v20.2</strong><b>Скачать C4D</b></a>
      </div>
      <div className="specialist-files">
        {specialistFiles.map(([code, title, href]) => (
          <a key={code} href={assetV21(href)} target="_blank"><span>{code}</span><strong>{title}</strong><b>PDF ↗</b></a>
        ))}
      </div>
      <div className="v21-warning">
        <strong>Юридически и технически важный статус</strong>
        <p>Эти файлы — проверяемое задание и координационная основа. Рабочие проекты конструкций, газа, ЭОМ, ВК и ОВ выпускают профильные специалисты после обмера, ТУ и расчётов.</p>
      </div>
    </section>
  );
}
