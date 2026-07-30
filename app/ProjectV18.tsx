"use client";

import { useMemo, useState } from "react";

type PageKind =
  | "home"
  | "landscape"
  | "bath"
  | "kitchen"
  | "rooms"
  | "model"
  | "engineering"
  | "sheets"
  | "catalog"
  | "estimate"
  | "documents";

type Product = {
  room: string;
  title: string;
  size: string;
  price: string;
  status: string;
  note: string;
  url: string;
};

const navItems: [PageKind, string, string][] = [
  ["home", "Обзор", "/"],
  ["landscape", "Участок", "/landscape/"],
  ["bath", "Баня", "/bath/"],
  ["kitchen", "Кухня", "/kitchen/"],
  ["rooms", "Комнаты", "/rooms/"],
  ["model", "Планы", "/model/"],
  ["engineering", "Инженерия", "/engineering/"],
  ["sheets", "Листы", "/sheets/"],
  ["catalog", "Товары", "/catalog/"],
  ["estimate", "Смета", "/estimate/"],
  ["documents", "Документы", "/documents/"],
];

const products: Product[] = [
  {
    room: "Кухня-гостиная",
    title: "Кухня 5,20 м + остров",
    size: "5200 мм + 2400 × 1000 мм",
    price: "0,95–1,85 млн ₽",
    status: "индивидуальное изготовление",
    note: "Фасады, столешница, фурнитура и монтаж считаются после чистового обмера.",
    url: "https://stavropol.marya.ru/price/",
  },
  {
    room: "Кухня-гостиная",
    title: "MAUNFELD CVI593SFBK LUX",
    size: "590 × 520 × 58 мм · 7,0 кВт",
    price: "41 490 ₽",
    status: "нет в наличии на 30.07.2026",
    note: "Размер подтверждён страницей производителя; до покупки подобрать доступный аналог.",
    url: "https://www.maunfeld.ru/catalog/induction/induktsionnaya-varochnaya-panel-maunfeld-cvi593sfbk-lux-inverter",
  },
  {
    room: "Кухня-гостиная",
    title: "MAUNFELD MBF177SWGR",
    size: "540 × 545 × 1775 мм",
    price: "84 990 ₽",
    status: "доступен на странице производителя",
    note: "Нужна вентилируемая мебельная ниша по монтажной инструкции.",
    url: "https://www.maunfeld.ru/catalog/embedded-freezer/kholodilnik-morozilnik-vstraivaemyy-maunfeld-mbf177swgr-inverter",
  },
  {
    room: "Кухня-гостиная",
    title: "MAUNFELD MLP60530 Light Beam",
    size: "класс ниши 600 мм",
    price: "39 990 ₽",
    status: "проверить наличие перед заказом",
    note: "Точный паспортный проём, вода, слив и розетка подтверждаются до производства кухни.",
    url: "https://www.maunfeld.ru/catalog/vstraivaemye-posudomoechnye-mashiny/posudomoechnaya-mashina-maunfeld-mlp60530-light-beam",
  },
  {
    room: "Кухня-гостиная",
    title: "MAUNFELD Domina 60",
    size: "598 × 290 × 182 мм · патрубок Ø150",
    price: "17 990 ₽",
    status: "в продаже на дату проверки",
    note: "Канал, обратный клапан, питание и высоту установки согласовать с проектом вентиляции.",
    url: "https://www.maunfeld.ru/catalog/embedded/kukhonnaya-vytyazhka-maunfeld-domina-60-chyernyy",
  },
  {
    room: "Кухня-гостиная",
    title: "MAUNFELD EOEM.769B",
    size: "595 × 547 × 595 мм · 2,03 кВт",
    price: "47 490 ₽",
    status: "нет в наличии; глубину 547/567 мм перепроверить",
    note: "Ниша и вентиляционные зазоры проектируются только после выбора доступной модели.",
    url: "https://www.maunfeld.ru/catalog/electric/shkaf-dukhovoy-elektricheskiy-maunfeld-eoem-769b",
  },
  {
    room: "Кухня-гостиная",
    title: "MAUNFELD JBMO725BK01",
    size: "595 × 317 × 390 мм · 1,08 кВт",
    price: "24 990 ₽",
    status: "в продаже на дату проверки",
    note: "Нужны паспортная ниша, вентиляция и доступная розетка.",
    url: "https://www.maunfeld.ru/catalog/edmicrowave/mikrovolnovaya-pech-vstraivaemaya-maunfeld-jbmo725bk01",
  },
  {
    room: "Кухня-гостиная",
    title: "Стол Авалон · дуб",
    size: "1600 × 800 × 750 мм",
    price: "до 84 479 ₽",
    status: "каталог-кандидат",
    note: "Вмещает 6 мест; цену и конкретную модификацию перепроверить в Ставрополе.",
    url: "https://www.divan.ru/stavropol/category/stoly-avalon",
  },
  {
    room: "Санузлы",
    title: "GROHE Rapid SL 39536000",
    size: "около 500 × 135 × 1130 мм",
    price: "120 000 ₽",
    status: "под заказ",
    note: "Ось канализации, конструкция стены, комплект и клавиша подтверждаются до монтажа.",
    url: "https://stavropol.santehnica.ru/product/215901.html",
  },
  {
    room: "Спальни и гостиная",
    title: "Мебель Divan.ru · Ставрополь",
    size: "только после выбора артикула",
    price: "по выбранным моделям",
    status: "каталог-кандидат",
    note: "В модель заносятся именно паспортные габариты выбранной кровати, дивана и стола.",
    url: "https://www.divan.ru/stavropol/",
  },
  {
    room: "Встроенная мебель",
    title: "ARISTO Ставрополь",
    size: "по чистовому обмеру",
    price: "индивидуальный расчёт",
    status: "кандидат",
    note: "Гардеробные и шкафы считать после проверки стен, пола и электрических точек.",
    url: "https://stavropol.aristo.ru/",
  },
  {
    room: "Участок",
    title: "Гортензия Strawberry Blossom",
    size: "C2, 30–40 см · взрослая 1,5–2,0 × 1,2–1,5 м",
    price: "1 400 ₽",
    status: "мало, наличие проверить",
    note: "Габарит взрослой кроны учитывается в плане; перед посадкой проверить почву, свет и полив.",
    url: "https://stavropol.rasteniya24.ru/dekorativnye-rasteniya/gortenziya-metelchataya-strawberry-blossom",
  },
  {
    room: "Участок",
    title: "Лаванда Dwarf Blue",
    size: "поставочный размер не указан",
    price: "730 ₽",
    status: "в наличии на дату проверки",
    note: "Сажать только на солнечном дренированном месте; контейнер и фактический размер уточнить.",
    url: "https://stavropol.pitomnik-rose.ru/product/lavanda-dvarf-blyu",
  },
  {
    room: "Участок",
    title: "Можжевельник Tamariscifolia",
    size: "C2, 15–25 см",
    price: "930 ₽",
    status: "много на дату проверки",
    note: "В модели показывается взрослая крона; точные отступы и безопасность для детей проверяются.",
    url: "https://stavropol.rasteniya24.ru/dekorativnye-rasteniya/mozhzhevelnik-kazackij-tamariscifolia",
  },
  {
    room: "Участок",
    title: "Тротуарная плитка «Старый город»",
    size: "серый цвет · толщина 40 мм",
    price: "750 ₽/м²",
    status: "только пешеходные дорожки",
    note: "Не применять под автомобиль; основание, уклоны и фактический объём — по рабочему плану.",
    url: "https://stavropol.gs-com.ru/tile/oldcity/tp-oldcity-gray-4sm/",
  },
  {
    room: "Участок",
    title: "Лоток Gidrolica Standart DN100",
    size: "1000 × 146 × 135 мм · C250",
    price: "727,20 ₽ без решётки",
    status: "в наличии на дату проверки",
    note: "Количество и отметки нельзя назначать без топосъёмки, расхода воды и точки сброса.",
    url: "https://shop.gidrolica.ru/product/lotok-vodootvodnyj-gidrolica-standart-lv-10-14-5-13-5-plastikovyj169/",
  },
  {
    room: "Участок",
    title: "Maytoni Line O484WL-L6GF3K",
    size: "170 × 80 × 160 мм · 6 Вт · 3000K · IP65",
    price: "16 190 ₽",
    status: "более 20 шт. на дату проверки",
    note: "Кандидат для фасада и балкона; количество определяется светорасчётом.",
    url: "https://maytoni.ru/catalog/street/bra/o484wl-l6gf3k/",
  },
  {
    room: "Баня",
    title: "Везувий Скиф Стандарт 16 ДТ-4",
    size: "16 кВт · парная 8–18 м³ · H 640 мм",
    price: "51 250 ₽",
    status: "кандидат, не закупать отдельно",
    note: "Нужен проект печи, основания, экранов, пожарных отступов и полного дымохода.",
    url: "https://26.teplozhar.ru/dlya-bani-i-sauni/skif-standart-dt-4-to-n079908.html",
  },
  {
    room: "Баня",
    title: "Дверь «Банный эксперт»",
    size: "680 × 1800 × 8 мм · коробка осина",
    price: "12 000 ₽",
    status: "в наличии на дату проверки",
    note: "Проём и направление открывания согласовать с планом эвакуации и конструкцией перегородки.",
    url: "https://stavropol.pechi-online.ru/shop/dver_bronza_matovoe_18068_8_mm_3_petli_korobka_osina",
  },
  {
    room: "Баня",
    title: "Сэндвич-труба Ferrum Ø115/200",
    size: "Ø115/200 × 1000 мм · стенка 0,5 мм",
    price: "3 614 ₽ за секцию",
    status: "не является комплектом дымохода",
    note: "Высоту, проход кровли и полный набор элементов назначает профильный проект.",
    url: "https://stavropol.pechi-online.ru/shop/dymoxod_uteplennyj_nerzhaveyushhij_05_zerkalnyj_nerzhaveyushhij_d-115_200L1m_po_vode_ferrum-1400778906",
  },
  {
    room: "Санузлы",
    title: "Ванна Abber AB9315 L/R",
    size: "1700 × 750 × 600 мм · 210 л",
    price: "85 900 ₽",
    status: "в наличии на дату проверки",
    note: "Выбрать левую/правую версию; проверить слив и нагрузку перекрытия.",
    url: "https://stavropol.santehnica.ru/product/415971.html",
  },
  {
    room: "Санузлы",
    title: "Душевой уголок Veconi Rovigo",
    size: "1200 × 800 × 1950 мм · стекло 6 мм",
    price: "42 676 ₽",
    status: "в наличии на дату проверки",
    note: "Уклоны, слив и зону открывания двери проверить до гидроизоляции.",
    url: "https://stavropol.santehnica.ru/product/1690101.html",
  },
  {
    room: "Санузлы",
    title: "Тумба Jacob Delafon Tolbiac",
    size: "1185 × 456 × 520 мм",
    price: "47 434 ₽",
    status: "тумба без раковины",
    note: "Окончательный комплект и выводы воды согласовать до облицовки.",
    url: "https://stavropol.santehnica.ru/brand/jacob-delafon/tolbiac/",
  },
  {
    room: "Освещение",
    title: "Maytoni Focus C071CL-7W3K-B",
    size: "120 × 80 мм · отверстие Ø85 · 7 Вт · 3000K",
    price: "3 600 ₽",
    status: "кандидат + IES",
    note: "Количество только по расчёту освещённости; IP20 не использовать в мокрых/наружных зонах.",
    url: "https://maytoni.ru/catalog/functional/potolochnye-svetilniki-func/potolochnye-vstraivaemye-svetilniki/svetilniki-downlight/c071cl-7w3k-b/",
  },
  {
    room: "Строительные материалы",
    title: "Knauf Rotband 30 кг",
    size: "мешок 30 кг",
    price: "650,53 ₽",
    status: "цену уточнить перед заказом",
    note: "Количество только после обмера площади, кривизны и влажности основания.",
    url: "https://stavropol.prinesipoday.ru/catalog/stroitelnye-smesi/shtukaturki/shtukaturka-dlya-vnutrennikh-rabot/",
  },
  {
    room: "Строительные материалы",
    title: "Ceresit CL 51",
    size: "15 кг",
    price: "6 440,26 ₽",
    status: "кандидат гидроизоляции",
    note: "Расход определяется картой мокрых зон, основанием, лентами и примыканиями.",
    url: "https://stavropol.prinesipoday.ru/catalog/gidroizolyatsiya/gidroizolyatsiya-polimernaya/",
  },
  {
    room: "Электрика",
    title: "ВВГ-Пнг(А)-LS 3×2,5",
    size: "3 × 2,5 мм² · ориентировочно 5,4 × 11,3 мм",
    price: "115,20 ₽/м",
    status: "наличие на странице устарело — звонок обязателен",
    note: "Марка, метраж, трасса и защита только по однолинейной схеме и расчёту нагрузок.",
    url: "https://dixi-st.com/katalog-dixi/kabelno-provodnaya/kabel/silovoj/kabel-vvg-pnga-ls-3h25-gost-pk",
  },
];

const landscapeRenders = [
  ["Передний двор · баня не видна", "/renders/v19/01-landscape-overview-concept.png", "Эскиз: бетонный передний двор, справа зелёная полоса, слева у забора только хозблок 1 × 3 м. Баня находится за домом и этим ракурсом полностью скрыта."],
  ["Задний двор · баня слева", "/renders/v19/02-rear-yard-concept.png", "Эскиз атмосферы: здесь показана баня 3 × 7 м с отступом 1 м от левого и заднего заборов, газон, цветники и мангальная у дома; проёмы сверять по PDF."],
  ["Правая сторона", "/renders/v19/03-right-green-strip-concept.png", "Эскиз: непрерывная дорожка 1,20 м, взрослые растения и болларды 3000K."],
  ["Вечерний фасад", "/renders/v19/04-front-evening-lighting-concept.png", "Сценарий света без изменения утверждённого фасада."],
] as const;

const bathRenders = [
  ["Баня · комната отдыха", "/renders/v19/05-bath-lounge-concept.png", "Эскизная зона 3,00 × 2,70 м: стол, лавка, хранение и чайная линия."],
  ["Баня · моечная", "/renders/v19/06-bath-wash-concept.png", "Эскизная зона 3,00 × 1,50 м: душ, трап, тумба и влагостойкие материалы."],
  ["Баня · парная", "/renders/v19/07-bath-steam-concept.png", "Эскизная зона 3,00 × 2,80 м: полки и кандидат печи; пожарные узлы не утверждены."],
] as const;

const c4dControlRenders = [
  ["C4D · передний фасад PDF", "/renders/v19/c4d-control/01-front-pdf.png", "Технический контроль стороны и проёмов без клиентских изменений."],
  ["C4D · задний фасад PDF", "/renders/v19/c4d-control/02-rear-pdf.png", "Технический контроль трёх нижних и двух верхних проёмов."],
  ["C4D · правый фасад PDF", "/renders/v19/c4d-control/03-right-pdf.png", "Правый фасад не зеркален; два горизонтальных окна первого этажа."],
  ["C4D · левый фасад PDF", "/renders/v19/c4d-control/04-left-pdf.png", "Левый фасад с исходными проёмами и зоной будущего общего балкона."],
  ["C4D · с улицы", "/renders/v19/c4d-control/05-street-proposal.png", "Клиентский вариант общего балкона над гаражом."],
  ["C4D · общий балкон", "/renders/v19/c4d-control/06-connected-balcony.png", "Связь двери детской и бокового выхода родителей; конструкция требует расчёта."],
  ["C4D · задний двор", "/renders/v19/c4d-control/07-rear-mangal.png", "Контроль примыкания мангальной зоны к дому."],
  ["C4D · баня 3 × 7 м", "/renders/v19/c4d-control/08-bathhouse.png", "Габаритная модель бани без утверждённых внутренних инженерных узлов."],
  ["C4D · участок", "/renders/v19/c4d-control/09-site-overview.png", "Общий технический вид дома, дорожек, зелёной полосы и заднего двора."],
  ["C4D · план участка", "/renders/v19/c4d-control/10-site-plan.png", "Ортографический контроль расстановки."],
  ["C4D · план первого этажа", "/renders/v19/c4d-control/11-floor1.png", "Планировка, ремонт и свет как координационное задание."],
  ["C4D · план второго этажа", "/renders/v19/c4d-control/12-floor2.png", "Спальни, санузлы, детские и общий балкон."],
  ["C4D · кухня-гостиная", "/renders/v19/c4d-control/13-kitchen.png", "Габаритный контроль мебели; не фотореалистичная подача."],
  ["C4D · спальня родителей", "/renders/v19/c4d-control/14-parents.png", "Мебельные оболочки и проходы."],
  ["C4D · комната Дарины", "/renders/v19/c4d-control/15-darina.png", "Сон, учёба, гимнастика и выход на общий балкон."],
  ["C4D · комната Ярика", "/renders/v19/c4d-control/16-yarik.png", "Сон, учёба, хранение и свободная игровая зона."],
  ["C4D · санузел родителей", "/renders/v19/c4d-control/17-bathroom.png", "Габаритная расстановка сантехники; выводы ещё не рабочие."],
  ["C4D · ограждение балкона", "/renders/v19/c4d-control/18-balcony-detail.png", "Балкон 7,50 м, высокие боковые экраны и безопасное ограждение."],
] as const;

const roomRenders = [
  ["Фасад с улицы", "/renders/v16/01-front-photoreal.png", "Гараж слева, витраж справа — ориентир незеркальной подачи."],
  ["Общий балкон", "/renders/v16/02-balcony-photoreal.png", "Передняя часть 7,50 м над гаражом; два выхода соединены."],
  ["Кухня · общий вид", "/renders/v18/kitchen-01-overview.png", "Исправленная кухня на глухой стене; остекление свободно."],
  ["Кухня · со стороны столовой", "/renders/v18/kitchen-02-dining-view.png", "Остров, рабочая линия и шестиместный стол."],
  ["Кухня · техника и мойка", "/renders/v18/kitchen-03-work-zone.png", "Плита, мойка и посудомоечная машина показаны явно."],
  ["Кухня · вечер", "/renders/v18/kitchen-04-evening.png", "Сценарий 3000К без изменения геометрии."],
  ["Спальня родителей", "/renders/v16/04-parents-bedroom-photoreal.png", "Кровать 1800 мм, хранение и связь с общим балконом."],
  ["Детская Дарины", "/renders/v16/05-darina-room-photoreal.png", "Учёба, сон и безопасная зона гимнастики."],
  ["Детская Ярика", "/renders/v16/06-yarik-room-photoreal.png", "Рабочее место и закрытое хранение спортивных вещей."],
  ["Санузел родителей", "/renders/v16/07-bathroom-photoreal.png", "Ванна, двойная тумба и влагозащищённый свет."],
  ["Мангальная", "/renders/v16/08-mangal-photoreal.png", "Кирпичная линия, мойка, мангал и высокий светлый объём."],
  ["Баня 3 × 7 м", "/renders/v16/09-bathhouse-photoreal.png", "Отступы 1 м — требование заказчика, нормативность ещё проверяется."],
] as const;

const costGroups = [
  ["Обследование и рабочие проекты", "0,80–1,80 млн ₽", "Обмеры, АР, усиление проёма/балкона, ЭОМ, ВК, ОВ и газ."],
  ["Балкон и новый выход", "1,85–3,80 млн ₽", "Расчёт, каркас/плита, гидроизоляция, ограждение 1,20 м, экраны 1,80 м."],
  ["Электрика и освещение", "1,10–2,20 млн ₽", "Щит, трассы, изделия, 17 групп света, измерения и пуск."],
  ["Вода, отопление, вентиляция, газ", "2,40–4,30 млн ₽", "Только после ТУ и расчётов профильных проектировщиков."],
  ["Черновая и чистовая отделка", "7,70–12,90 млн ₽", "Ориентир для 241,46 м² по планам; уточняется ведомостью объёмов."],
  ["Кухня, мебель, техника, сантехника", "3,85–7,60 млн ₽", "Кухня включена диапазоном; выбранные артикулы считаются отдельно."],
  ["Мангальная", "0,85–1,60 млн ₽", "Негорючие узлы, дымоудаление, рабочая линия и мойка."],
  ["Двор, баня и озеленение", "5,00–9,70 млн ₽", "Водоотвод, покрытия, баня, хозблок, свет и посадки."],
] as const;

const stages = [
  ["01", "Лазерный обмер и обследование", "Стены, диагонали, уровни, проёмы, окна, вводы, фото скрытых дефектов.", "Акт обмера и модель фактического состояния."],
  ["02", "Фиксация планировки", "Кухня, санузлы, мебель, двери и проходы сверяются с обмером.", "Закрытый журнал коллизий."],
  ["03", "Рабочие инженерные разделы", "ЭОМ, ВК, ОВ, отопление, газ, спецификации и задания на отверстия.", "Подписанные профильные листы."],
  ["04", "Усиления и скрытые трассы", "Балкон, новый дверной проём, закладные, кабели, трубы, вентиляция.", "Акты скрытых работ и фото."],
  ["05", "Черновая отделка", "Штукатурка, стяжка, гидроизоляция, контроль плоскостей и влажности.", "Приёмка основания до закрытия."],
  ["06", "Чистовая отделка и свет", "Покраска, плитка, полы, потолки, двери, светильники и пуск.", "Покомнатная приёмка."],
  ["07", "Контрольный обмер мебели", "Кухня и шкафы запускаются только после готовых стен, пола и выводов.", "Производственные чертежи и BOM."],
  ["08", "Двор и наружные сети", "Сначала вода и тяжёлые поставки, затем бетон, дорожки, свет и баня.", "Исполнительные трассы."],
  ["09", "Посадки и финальная приёмка", "Растения после стройки; наладка полива, света и инженерии.", "Паспорта, гарантии, инструкции."],
] as const;

const githubTools = [
  ["Three.js", "MIT", "Оставить для лёгкого просмотра отдельных точных GLB-объектов; не источник реализма.", "adopt", "https://github.com/mrdoob/three.js/"],
  ["Babylon.js", "Apache-2.0", "Кандидат для будущей игровой сборки с PBR, столкновениями и интерактивными объектами.", "sandbox-test", "https://github.com/BabylonJS/Babylon.js/"],
  ["glTF Transform", "MIT", "Проверка и оптимизация GLB, текстур, повторов и размеров перед веб-публикацией.", "adopt", "https://github.com/donmccurdy/glTF-Transform"],
  ["React Three Fiber", "MIT", "Удобная React-обвязка Three.js, но сама по себе не улучшает модель и материалы.", "reference-only", "https://github.com/pmndrs/react-three-fiber"],
  ["IfcOpenShell", "LGPL/GPL по компонентам", "Независимая BIM/IFC-проверка объёмов и коллизий при появлении корректного IFC.", "sandbox-test", "https://github.com/IfcOpenShell/IfcOpenShell"],
  ["FreeCAD", "LGPL-2.1", "Параметрические размерные листы и независимый контроль масштаба.", "adopt", "https://github.com/FreeCAD/FreeCAD"],
] as const;

const modelSheets = [
  ["floor1", "Первый этаж", "/plans/v16/floor-1-c4d.png", "План модели Cinema 4D; площади сверяются с листом 7 PDF."],
  ["floor2", "Второй этаж", "/plans/v16/floor-2-c4d.png", "Детские, спальня родителей и общий безопасный балкон."],
  ["kitchen", "Кухня", "/plans/v18/kitchen-plan.svg", "Предложение 5,20 м на глухой стене 5,53 м; окна свободны."],
  ["electrical", "Электрика", "/plans/v17/electrical-floor1.svg", "Предварительное задание для инженера ЭОМ."],
  ["water", "Вода", "/plans/v17/water-sewer.svg", "Принципиальная схема; не рабочие диаметры и уклоны."],
] as const;

function asset(path: string) {
  if (typeof window === "undefined") return path;
  const base = window.location.pathname.startsWith("/dima-oblagorazhivanie")
    ? "/dima-oblagorazhivanie"
    : "";
  return `${base}${path}`;
}

function route(path: string) {
  if (typeof window === "undefined") return path;
  const base = window.location.pathname.startsWith("/dima-oblagorazhivanie")
    ? "/dima-oblagorazhivanie"
    : "";
  return `${base}${path}`;
}

function Header({ active }: { active: PageKind }) {
  return (
    <header className="site-header">
      <a className="site-brand" href={route("/")}>
        <span>ДО</span>
        <strong>Дима · Облагораживание</strong>
      </a>
      <nav aria-label="Страницы проекта">
        {navItems.map(([key, label, href]) => (
          <a className={key === active ? "active" : ""} href={route(href)} key={key}>
            {label}
          </a>
        ))}
      </nav>
      <a className="header-pdf" href={asset("/downloads/official-architecture.pdf")} target="_blank">
        PDF · 18 листов
      </a>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Дима · Облагораживание · v19</strong>
        <span>Многостраничный предпроект для согласования, расчётов и закупки.</span>
      </div>
      <p>
        Рендеры показывают проектное предложение. Размеры для производства мебели,
        электрические защиты, трубопроводы, газ и конструкции выпускаются после обмера
        профильными специалистами.
      </p>
    </footer>
  );
}

function PageIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function StatusKey() {
  return (
    <div className="status-key">
      <span><i className="status source" />по исходному PDF</span>
      <span><i className="status proposed" />проектное предложение</span>
      <span><i className="status verify" />проверить на объекте</span>
    </div>
  );
}

function RenderGallery({ onlyKitchen = false }: { onlyKitchen?: boolean }) {
  const items = onlyKitchen ? roomRenders.slice(2, 6) : roomRenders;
  return (
    <div className="render-grid">
      {items.map(([title, image, note]) => (
        <figure className="render-card" key={title}>
          <a href={asset(image)} target="_blank">
            <img src={asset(image)} alt={title} />
          </a>
          <figcaption>
            <strong>{title}</strong>
            <span>{note}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function VisualGallery({
  items,
}: {
  items: readonly (readonly [string, string, string])[];
}) {
  return (
    <div className="render-grid">
      {items.map(([title, image, note]) => (
        <figure className="render-card" key={title}>
          <a href={asset(image)} target="_blank">
            <img src={asset(image)} alt={title} />
          </a>
          <figcaption>
            <strong>{title}</strong>
            <span>{note}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function HomePage() {
  return (
    <>
      <section className="home-hero">
        <img src={asset("/renders/v16/01-front-photoreal.png")} alt="Фасад дома с улицы" />
        <div className="home-hero-shade" />
        <div className="home-hero-copy">
          <span className="eyebrow">Предпроект v19 · Ставрополь · 30 июля 2026</span>
          <h1>Дом, ремонт и участок — наглядно и по разделам</h1>
          <p>
            Плохая 3D-проходка удалена. Теперь клиент сначала видит крупные
            фотореалистичные кадры, затем открывает размеры, инженерные задания,
            реальные товары и поэтапную стоимость.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={route("/landscape/")}>Открыть благоустройство</a>
            <a className="button secondary" href={route("/sheets/")}>Листы для мастеров</a>
          </div>
        </div>
      </section>

      <section className="summary-band">
        <article><strong>18</strong><span>листов исходного PDF</span></article>
        <article><strong>7</strong><span>новых видов участка и бани</span></article>
        <article><strong>11</strong><span>страниц проекта</span></article>
        <article><strong>0</strong><span>низкополигональных проходок</span></article>
      </section>

      <section className="content-section">
        <PageIntro
          eyebrow="Главный результат"
          title="Каждое решение открывается отдельной страницей"
          text="Так подрядчик не путает красивый кадр с рабочим чертежом, а Дмитрий может отдельно проверить кухню, комнаты, сети, товары, стоимость и исходные документы."
        />
        <div className="page-card-grid">
          {navItems.slice(1).map(([key, label, href], index) => (
            <a className="page-card" href={route(href)} key={key}>
              <span>0{index + 1}</span>
              <strong>{label}</strong>
              <p>
                {key === "kitchen" && "Окно, гарнитур 5,20 м, остров, мойка, плита и все подключения."}
                {key === "landscape" && "Четыре новых вида двора, свет, растения, план 20 × 30 м и товары."}
                {key === "bath" && "Комната отдыха, моечная, парная, план 3 × 7 м и печное задание."}
                {key === "rooms" && "Крупные интерьерные и наружные рендеры с пояснениями."}
                {key === "model" && "Переключаемые планы этажей и инженерные слои."}
                {key === "engineering" && "ЭОМ, вода, канализация и задания для специалистов."}
                {key === "sheets" && "Реестр архитектурных, инженерных, мебельных и ландшафтных листов."}
                {key === "catalog" && "Реальные кандидаты с размерами, ценой, статусом и ссылкой."}
                {key === "estimate" && "Диапазоны, этапы, контрольные результаты и исключения."}
                {key === "documents" && "PDF, CSV, журналы и проверенные GitHub-инструменты."}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="content-section">
        <PageIntro
          eyebrow="Галерея"
          title="Крупные кадры вместо неудобной прогулки"
          text="Нажмите на любой кадр, чтобы открыть его в полном разрешении. Рендеры не заменяют размерные листы — соответствующий план находится на соседней странице."
        />
        <RenderGallery />
      </section>

      <section className="content-section evidence-callout">
        <div>
          <span className="eyebrow">Исправление кухни</span>
          <h2>Ошибка с перекрытым окном подтверждена и устранена</h2>
        </div>
        <p>
          В старом кадре гарнитур проходил по фасадной стене и перекрывал остекление.
          В исходном листе 7 детальная мебель не задана. Новое решение размещает кухню
          на глухой стене 5530 мм; гарнитур 5200 мм не пересекает ни один проём.
        </p>
        <a className="button primary" href={route("/kitchen/")}>Посмотреть доказательство</a>
      </section>
    </>
  );
}

function LandscapePage() {
  const landscapeProducts = products.filter((product) =>
    ["Участок", "Освещение"].includes(product.room),
  );
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Благоустройство · участок 20 × 30 м"
          title="Двор показан с четырёх сторон — отдельно от точного плана"
          text="Фотореалистичные изображения ниже показывают будущую атмосферу и материалы. Точная расстановка, подтверждённые габариты и запреты собраны на листе ЛД-01; изображения не используются для измерения."
        />
        <StatusKey />
        <div className="alert warning">
          <strong>Честный статус</strong>
          <p>
            Общий вид, зелёная полоса и вечерний свет — эскизные визуализации. Дом
            и участок сверяются по PDF и Cinema 4D; водоотвод, отметки и основания
            покрытий заблокированы до топосъёмки.
          </p>
        </div>
      </section>
      <section className="content-section compact">
        <VisualGallery items={landscapeRenders} />
      </section>
      <section className="content-section">
        <PageIntro
          eyebrow="ЛД-01"
          title="Размерный план: маршруты имеют начало и конец"
          text="На плане показаны участок, дом, передний бетонный двор, правая зелёная полоса, баня 3 × 7 м, хозблок 1 × 3 м, дорожки 1,20 м, посадки и точки света."
        />
        <div className="single-sheet-layout">
          <a href={asset("/plans/v19/landscape-plan.svg")} target="_blank">
            <img src={asset("/plans/v19/landscape-plan.svg")} alt="ЛД-01 — план благоустройства с размерами" />
          </a>
          <aside className="checklist-card">
            <span className="eyebrow">Что подтверждено</span>
            <h2>Габариты и пожелания</h2>
            <ul>
              <li>Участок 20,00 × 30,00 м.</li>
              <li>Баня 3,00 × 7,00 м, по 1,00 м слева и сзади.</li>
              <li>Хозблок 1,00 × 3,00 м у левого забора.</li>
              <li>Передний двор — преимущественно бетон.</li>
              <li>Зелень — справа и вдоль маршрута к заднему двору.</li>
              <li>Меньше деревьев, больше цветов и кустарников.</li>
            </ul>
            <a className="button primary" href={asset("/plans/v19/landscape-plan.svg")} target="_blank">
              Открыть лист крупно
            </a>
          </aside>
        </div>
      </section>
      <section className="content-section">
        <PageIntro
          eyebrow="Товары, видимые в проекте"
          title="Покрытия, растения и свет открываются по ссылке"
          text="Цены — ориентир на 30.07.2026. Количество считается после топосъёмки, пирогов покрытий, светорасчёта и финального посадочного плана."
        />
        <ProductGrid items={landscapeProducts} />
      </section>
    </>
  );
}

function BathPage() {
  const bathProducts = products.filter((product) => product.room === "Баня");
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Баня · 3,00 × 7,00 м · задний двор слева"
          title="Внутри бани теперь три отдельных помещения и понятный план"
          text="Комната отдыха, моечная и парная показаны раздельно. Их размеры — планировочный вариант; печь, дымоход, вентиляция, слив, фундамент и пожарные узлы должны быть рассчитаны профильными специалистами."
        />
        <StatusKey />
      </section>
      <section className="content-section compact">
        <VisualGallery items={bathRenders} />
      </section>
      <section className="content-section">
        <PageIntro
          eyebrow="БН-01"
          title="Планировка и задания печнику, сантехнику и электрику"
          text="Лист показывает зоны и мебельные габариты, но прямо запрещает строительство до выпуска профильных разделов."
        />
        <div className="single-sheet-layout">
          <a href={asset("/plans/v19/bath-plan.svg")} target="_blank">
            <img src={asset("/plans/v19/bath-plan.svg")} alt="БН-01 — план бани 3 на 7 метров" />
          </a>
          <aside className="calculation-card">
            <span className="eyebrow">Баланс площади</span>
            <strong>2,80 + 1,50 + 2,70 = 7,00 м</strong>
            <p>Парная ≈ 8,4 м², моечная ≈ 4,5 м², комната отдыха ≈ 8,1 м² до вычета перегородок.</p>
            <hr />
            <strong>Главный стоп-фактор</strong>
            <p>Печь и дымоход нельзя покупать отдельными деталями без полного печного проекта и проверки основания.</p>
            <a className="button primary" href={asset("/plans/v19/bath-plan.svg")} target="_blank">
              Открыть лист крупно
            </a>
          </aside>
        </div>
      </section>
      <section className="content-section">
        <PageIntro
          eyebrow="Комплектация бани"
          title="Кандидаты привязаны к габаритам и ограничениям"
          text="Карточка товара открывает страницу продавца. Статус «кандидат» не разрешает закупку до расчёта."
        />
        <ProductGrid items={bathProducts} />
      </section>
    </>
  );
}

function KitchenPage() {
  const kitchenProducts = products.filter((product) => product.room === "Кухня-гостиная");
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Кухня-гостиная · 50,12 м² · лист 7 PDF"
          title="Кухня исправлена: окна и двери больше не перекрыты"
          text="Исходный архитектурный лист задаёт контур комнаты и проёмы, но прямо говорит, что детальная мебель выполняется отдельным дизайн-проектом. Поэтому компоновка ниже — проверяемое проектное предложение, а не выдуманный «размер из рендера»."
        />
        <StatusKey />
        <div className="alert success">
          <strong>Принятое решение</strong>
          <p>
            Глухая внутренняя стена — 5530 мм по листу 7. Номинальная сумма модулей —
            5200 мм; по 165 мм остаётся на два торцевых зазора/добора. Финишные размеры
            обязательны после штукатурки, пола и инженерных выводов.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="compare-grid">
          <figure className="compare-card rejected">
            <img src={asset("/renders/v16/03-kitchen-living-photoreal.png")} alt="Старый ошибочный рендер кухни" />
            <figcaption>
              <span>ОТКЛОНЕНО</span>
              <strong>Старый рендер</strong>
              <p>Гарнитур стоит на фасадной линии и визуально пересекает остекление; горизонтальное окно было придумано.</p>
            </figcaption>
          </figure>
          <figure className="compare-card approved">
            <img src={asset("/renders/v18/kitchen-01-overview.png")} alt="Исправленный рендер кухни" />
            <figcaption>
              <span>ПРИНЯТО К ПРОРАБОТКЕ</span>
              <strong>Исправленная компоновка</strong>
              <p>Гарнитур перенесён на глухую стену; все наружные окна и двери остаются свободными.</p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="content-section">
        <PageIntro
          eyebrow="4 проверяемых ракурса"
          title="День, рабочая зона и вечерний свет"
          text="Во всех четырёх кадрах сохраняется одна логика: один гарнитур, один остров, одна мойка, одна плита и одна посудомоечная машина."
        />
        <RenderGallery onlyKitchen />
      </section>

      <section className="content-section">
        <PageIntro
          eyebrow="КМ-01 / КМ-02 / КМ-03"
          title="Размеры, развёртка и инженерные точки кухни"
          text="Листы ниже предназначены для согласования с мебельщиком, электриком и сантехником. Красные пометки требуют натурной проверки."
        />
        <div className="sheet-grid">
          {[
            ["Размерный план кухни", "/plans/v18/kitchen-plan.svg", "5530 мм стена, 5200 мм модули, остров 2400 × 1000 мм, проход 1100 мм."],
            ["Развёртка гарнитура", "/plans/v18/kitchen-elevation.svg", "Модули, техника, рабочая поверхность и отметки по высоте."],
            ["Электрика, вода и вентиляция", "/plans/v18/kitchen-mep.svg", "Розетки, выводы мойки/ПММ, панель 7 кВт и вытяжка."],
            ["Исходный лист 7", "/downloads/official-architecture.pdf#page=7", "Контур, площадь, проёмы и размер глухой стены проверяются по PDF."],
          ].map(([title, image, note], index) => (
            <figure className="sheet-card" key={title}>
              {index === 3 ? (
                <a className="pdf-sheet-link" href={asset(image)} target="_blank">
                  <img src={asset("/plans/v16/floor-1-c4d.png")} alt={title} />
                </a>
              ) : (
                <a href={asset(image)} target="_blank"><img src={asset(image)} alt={title} /></a>
              )}
              <figcaption><strong>{title}</strong><span>{note}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="content-section split-section">
        <div>
          <span className="eyebrow">Модульная ведомость · 5200 мм</span>
          <h2>Что именно заказывается у мебельщика</h2>
          <div className="data-table module-table">
            <div className="table-head"><span>Поз.</span><span>Модуль</span><span>Ширина</span><span>Контроль</span></div>
            {[
              ["K01", "Встраиваемый холодильник", "600 мм", "ниша и вентиляция по паспорту"],
              ["K02", "Колонна духового шкафа/хранения", "600 мм", "розетка не за прибором"],
              ["K03", "Карго", "300 мм", "направляющие и нагрузка"],
              ["K04", "Ящики подготовки", "800 мм", "рабочая зона"],
              ["K05", "Индукционная панель", "900 мм", "вырез по паспорту, отдельная линия"],
              ["K06", "Ящики", "600 мм", "разделительная рабочая зона"],
              ["K07", "Мойка", "800 мм", "вода, слив, фильтр, доступ"],
              ["K08", "Посудомоечная машина", "600 мм", "розетка в соседнем модуле"],
            ].map((row) => <div key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}
          </div>
        </div>
        <aside className="calculation-card">
          <span className="eyebrow">Проверка арифметики</span>
          <strong>600 + 600 + 300 + 800 + 900 + 600 + 800 + 600 = 5200 мм</strong>
          <p>5530 − 5200 = 330 мм. Предварительно: два добора по 165 мм.</p>
          <hr />
          <strong>Остров: 2400 × 1000 мм</strong>
          <p>Проход до рабочей линии: 1100 мм. Финально проверить открывание ПММ и фасадов.</p>
          <hr />
          <strong>Нельзя запускать в производство</strong>
          <p>Пока нет чистового контрольного обмера, паспортов всей техники и согласованных выводов ЭОМ/ВК/ОВ.</p>
        </aside>
      </section>

      <section className="content-section">
        <PageIntro
          eyebrow="Реальные товары-кандидаты"
          title="Техника и мебель привязаны к габаритам, цене и статусу"
          text="Цена на сайте — справочный ориентир на дату проверки, не коммерческое предложение. Если товар недоступен, сначала выбирается замена, затем корректируются ниша и инженерные нагрузки."
        />
        <ProductGrid items={kitchenProducts} />
      </section>

      <section className="content-section">
        <PageIntro
          eyebrow="Предварительная стоимость кухни"
          title="От проекта до пуска — отдельными строками"
          text="Диапазон нужен для планирования. Точная сумма появляется после обмера и минимум двух сопоставимых расчётов одинаковой комплектации."
        />
        <div className="cost-line-grid">
          {[
            ["K-B01", "Обмер и проект мебели", "35–90 тыс. ₽"],
            ["K-B02", "Корпуса, фасады и фурнитура", "550–950 тыс. ₽"],
            ["K-B03", "Кварцевая/компактная столешница", "180–380 тыс. ₽"],
            ["K-B04", "Остров 2400 × 1000 мм", "160–320 тыс. ₽"],
            ["K-B05", "Техника без замены кандидатов", "260–520 тыс. ₽"],
            ["K-B06", "Мойка, смеситель, фильтр", "55–160 тыс. ₽"],
            ["K-B07", "Электрика, вода, вентиляция", "120–280 тыс. ₽"],
            ["K-B08", "Доставка, подъём и монтаж", "90–220 тыс. ₽"],
          ].map(([code, title, price]) => (
            <article key={code}><span>{code}</span><strong>{title}</strong><b>{price}</b></article>
          ))}
        </div>
        <div className="total-line">
          <span>Рабочий диапазон кухни</span>
          <strong>1,45–2,92 млн ₽</strong>
          <small>локальный срез: пересекается с общедомовыми B04, B05, B09 и B11 и не прибавляется к ним повторно; коммерческие предложения ещё не получены</small>
        </div>
      </section>
    </>
  );
}

function RoomsPage() {
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Галерея дома и участка"
          title="Рендеры по комнатам — крупно и с назначением"
          text="На этой странице нет игровых органов управления и низкополигональных поверхностей. Каждый кадр открывается отдельно; рядом указано, какое решение он показывает."
        />
      </section>
      <section className="content-section compact"><RenderGallery /></section>
      <section className="content-section">
        <PageIntro
          eyebrow="Дополнительные серии"
          title="По четыре ракурса основных комнат"
          text="Эти контактные листы используются как предварительная подборка ракурсов. Кухонная серия v17 отклонена и заменена четырьмя исправленными кадрами v18 выше."
        />
        <div className="sheet-grid">
          {[
            ["Спальня родителей · 4 вида", "/renders/v17/12-parents-four-views.png"],
            ["Комната Дарины · 4 вида", "/renders/v17/13-darina-four-views.png"],
            ["Комната Ярика · 4 вида", "/renders/v17/14-yarik-four-views.png"],
            ["Санузел родителей · 4 вида", "/renders/v17/15-bathroom-four-views.png"],
          ].map(([title, image]) => (
            <figure className="sheet-card" key={title}>
              <a href={asset(image)} target="_blank"><img src={asset(image)} alt={title} /></a>
              <figcaption><strong>{title}</strong><span>Нажмите для просмотра в полном разрешении.</span></figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}

function ModelPage() {
  const [activeSheet, setActiveSheet] = useState(modelSheets[0][0]);
  const sheet = useMemo(
    () => modelSheets.find((item) => item[0] === activeSheet) ?? modelSheets[0],
    [activeSheet],
  );
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Интерактивная проверка без проходки"
          title="Переключайте этажи и инженерные слои"
          text="Это понятный режим согласования. Он не маскирует низкое качество модели свободной прогулкой: вместо этого показывает тот лист, который нужен для конкретного решения."
        />
        <div className="model-review">
          <div className="model-tabs">
            {modelSheets.map(([key, label]) => (
              <button className={key === activeSheet ? "active" : ""} key={key} onClick={() => setActiveSheet(key)}>
                {label}
              </button>
            ))}
          </div>
          <div className="model-sheet">
            <a href={asset(sheet[2])} target="_blank"><img src={asset(sheet[2])} alt={sheet[1]} /></a>
          </div>
          <aside>
            <span className="eyebrow">Сейчас открыт</span>
            <h2>{sheet[1]}</h2>
            <p>{sheet[3]}</p>
            <a className="button primary" href={asset(sheet[2])} target="_blank">Открыть крупно</a>
          </aside>
        </div>
      </section>
      <section className="content-section evidence-callout">
        <div><span className="eyebrow">Игровая версия</span><h2>Отделена от клиентского релиза</h2></div>
        <p>
          Babylon.js/Three.js не сделают плохую модель реалистичной. Для игры сначала
          нужны точные PBR-материалы, оптимизированные модели выбранной мебели/техники,
          коллизии, двери и проверка масштаба. До этого интерактивный лист полезнее и честнее.
        </p>
        <a className="button primary" href={route("/documents/")}>Открыть технический аудит</a>
      </section>
      <section className="content-section">
        <PageIntro
          eyebrow="Повторный рендер Cinema 4D · 30.07.2026"
          title="18 контрольных камер из нативной сцены v16"
          text="Кадры повторно рассчитаны Cinema 4D Physical + AO в разрешении 1200 × 750. Они доказывают состав сцены и ракурсы, но остаются техническими — фотореалистичные эскизы опубликованы отдельно."
        />
        <VisualGallery items={c4dControlRenders} />
      </section>
    </>
  );
}

function EngineeringPage() {
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Предварительные задания ЭОМ / ВК / ОВ"
          title="Что показать электрику, сантехнику и вентиляционщику"
          text="Листы привязаны к планировке, но не являются рабочим проектом. Окончательные кабели, защиты, диаметры, уклоны, газ и проходки назначают профильные специалисты после ТУ и обмера."
        />
        <div className="alert warning">
          <strong>Запрет на монтаж по эскизу</strong>
          <p>Без таблицы нагрузок, технических условий, паспортов оборудования и исполнительных отметок эти схемы используются только как техническое задание.</p>
        </div>
      </section>
      <section className="content-section">
        <div className="sheet-grid">
          {[
            ["ЭОМ-01 · первый этаж", "/plans/v17/electrical-floor1.svg", "Розетки, свет, кухня, гараж, гостевая и мокрые зоны."],
            ["ЭОМ-02 · второй этаж", "/plans/v17/electrical-floor2.svg", "Спальни, детские, санузлы и безопасный общий балкон."],
            ["ВК-01 · дом и участок", "/plans/v17/water-sewer.svg", "Принципиальные ввод, коллектор, стояки, кухня, баня и мангальная."],
            ["КМ-03 · кухня", "/plans/v18/kitchen-mep.svg", "Отдельная силовая линия панели, бытовые розетки, ПММ, холодильник, вода и вытяжка."],
          ].map(([title, image, note]) => (
            <figure className="sheet-card" key={title}>
              <a href={asset(image)} target="_blank"><img src={asset(image)} alt={title} /></a>
              <figcaption><strong>{title}</strong><span>{note}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="content-section split-section">
        <div>
          <span className="eyebrow">Кухня · реестр потребителей</span>
          <h2>Что заложить до отделки</h2>
          <div className="data-table engineering-table">
            <div className="table-head"><span>Код</span><span>Потребитель</span><span>Исходное значение</span><span>Кто подтверждает</span></div>
            {[
              ["E-K01", "Индукционная панель", "7,0 кВт по кандидату", "инженер ЭОМ + паспорт замены"],
              ["E-K02", "Духовой шкаф", "по выбранному артикулу", "инженер ЭОМ"],
              ["E-K03", "Посудомоечная машина", "отдельная розетка в соседнем модуле", "ЭОМ + мебельщик"],
              ["E-K04", "Холодильник", "неотключаемая линия по проекту", "инженер ЭОМ"],
              ["E-K05", "Вытяжка", "мощность и канал по выбранной модели", "ОВ + ЭОМ"],
              ["W-K01", "Мойка и фильтр", "ХВС/ГВС/слив · отметки после обмера", "инженер ВК"],
              ["W-K02", "Посудомоечная машина", "ХВС/слив через доступный узел", "инженер ВК"],
            ].map((row) => <div key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}
          </div>
        </div>
        <aside className="checklist-card">
          <span className="eyebrow">До штробления</span>
          <h2>Обязательные входы</h2>
          <ul>
            <li>Технические условия и разрешённая мощность.</li>
            <li>Точный перечень оборудования с паспортами.</li>
            <li>Фактические высоты пола, потолка и проёмов.</li>
            <li>Место щита, коллекторов, вентиляционных каналов.</li>
            <li>Согласование проходок с конструктором.</li>
            <li>Отдельный проект и договор по газу.</li>
          </ul>
        </aside>
      </section>
    </>
  );
}

const sheetGroups = [
  ["АР", "Архитектура и обмеры", "16", "Планы 1/2 этажей, 4 фасада, разрез и исходный PDF доступны; новый балкон и проём требуют обмера и конструктора.", "частично"],
  ["ЭОМ", "Электрика", "18", "Есть предварительные планы двух этажей и кухни; щит, нагрузки, кабели, защиты и трассы — после ТУ.", "задание"],
  ["СС", "Слаботочные сети", "4", "Интернет, камеры, домофон и датчики нужно согласовать с мебелью, воротами и электрикой.", "реестр"],
  ["ВК", "Вода и канализация", "12", "Показаны потребители обоих этажей, кухни, мангальной и бани; стояки, диаметры и уклоны не утверждены.", "задание"],
  ["ОВ", "Отопление и вентиляция", "13", "Нужны теплопотери, воздухообмены, оборудование, трассы и отдельное дымоудаление мангальной.", "blocked"],
  ["ГСВ", "Газ", "8", "Только отдельный раздел по ТУ и лицензированному проекту. Интернет-схемы не применяются.", "blocked"],
  ["ЛД", "Участок и благоустройство", "15", "ЛД-01 выпущен как эскиз; топография, вертикальная планировка, ливнёвка и пироги покрытий заблокированы.", "эскиз"],
  ["БН", "Баня 3 × 7 м", "13", "БН-01 и три интерьера выпущены как вариант; фундамент, печь, дымоход, вентиляция, ВК и ЭОМ заблокированы.", "эскиз"],
] as const;

function SheetsPage() {
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Реестр проекта · 99 требуемых листов"
          title="Мастеру показывается не картинка, а нужный раздел и его статус"
          text="Реестр разделяет исходные чертежи, эскизные задания и будущую рабочую документацию. Ни один лист со статусом blocked нельзя использовать для монтажа."
        />
        <div className="alert warning">
          <strong>Почему не все 99 листов помечены «готово»</strong>
          <p>
            Исходный PDF допускает отклонение фактической коробки до 12 см. Без
            лазерного обмера, обследования конструкций, ТУ и топосъёмки нельзя честно
            назначить монтажные координаты, кабели, диаметры, уклоны, газ и усиления.
          </p>
        </div>
      </section>
      <section className="content-section">
        <div className="sheet-register">
          <div className="table-head">
            <span>Раздел</span><span>Состав</span><span>Листов</span><span>Текущий результат</span><span>Статус</span>
          </div>
          {sheetGroups.map(([code, title, count, result, status]) => (
            <article key={code}>
              <strong>{code}</strong>
              <span>{title}</span>
              <b>{count}</b>
              <p>{result}</p>
              <em className={`sheet-status ${status}`}>{status}</em>
            </article>
          ))}
        </div>
      </section>
      <section className="content-section">
        <PageIntro
          eyebrow="Доступные листы"
          title="Что уже можно открыть крупно и передать для согласования"
          text="Это комплект для обсуждения с профильными специалистами. Рабочий выпуск появляется после закрытия входных данных."
        />
        <div className="sheet-grid">
          {[
            ["Исходная архитектура · 18 листов", "/downloads/official-architecture.pdf", "/plans/v16/source-front.png", "Главный источник размеров, планов, фасадов и разреза."],
            ["ЛД-01 · благоустройство", "/plans/v19/landscape-plan.svg", "/plans/v19/landscape-plan.svg", "Дом, покрытия, дорожки, баня, хозблок, растения и свет."],
            ["БН-01 · баня 3 × 7 м", "/plans/v19/bath-plan.svg", "/plans/v19/bath-plan.svg", "Планировочный вариант и задания специалистам."],
            ["КМ-01 · кухня", "/plans/v18/kitchen-plan.svg", "/plans/v18/kitchen-plan.svg", "Гарнитур, остров, проходы и привязка к глухой стене."],
            ["КМ-03 · кухня, инженерия", "/plans/v18/kitchen-mep.svg", "/plans/v18/kitchen-mep.svg", "Техническое задание ЭОМ/ВК/ОВ."],
            ["ЭОМ-01 · первый этаж", "/plans/v17/electrical-floor1.svg", "/plans/v17/electrical-floor1.svg", "Предварительная расстановка потребителей и света."],
            ["ЭОМ-02 · второй этаж", "/plans/v17/electrical-floor2.svg", "/plans/v17/electrical-floor2.svg", "Спальни, детские, санузлы и балкон."],
            ["ВК-01 · принципиальная схема", "/plans/v17/water-sewer.svg", "/plans/v17/water-sewer.svg", "Потребители двух этажей, кухни, мангальной и бани."],
          ].map(([title, href, preview, note]) => (
            <figure className="sheet-card" key={title}>
              <a href={asset(href)} target="_blank"><img src={asset(preview)} alt={title} /></a>
              <figcaption><strong>{title}</strong><span>{note}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="content-section evidence-callout">
        <div><span className="eyebrow">Порядок допуска</span><h2>Сначала обмер, затем рабочие листы</h2></div>
        <p>
          Обмерщик фиксирует коробку и вводы; архитектор обновляет планы; конструктор
          считает балкон и новый дверной проём; затем инженеры выпускают ЭОМ, ВК, ОВ
          и газ. После координации мебельщик получает чистовые развёртки.
        </p>
        <a className="button primary" href={route("/estimate/")}>Открыть этапы работ</a>
      </section>
    </>
  );
}

function ProductGrid({ items = products }: { items?: Product[] }) {
  return (
    <div className="product-grid">
      {items.map((product) => (
        <a className="product-card" href={product.url} target="_blank" rel="noreferrer" key={product.title}>
          <span>{product.room}</span>
          <strong>{product.title}</strong>
          <dl>
            <div><dt>Размер</dt><dd>{product.size}</dd></div>
            <div><dt>Цена</dt><dd>{product.price}</dd></div>
            <div><dt>Статус</dt><dd>{product.status}</dd></div>
          </dl>
          <p>{product.note}</p>
          <b>Открыть источник ↗</b>
        </a>
      ))}
    </div>
  );
}

function CatalogPage() {
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Комплектация · проверено 30.07.2026"
          title="Реальные товары, реальные размеры, прямые ссылки"
          text="Карточка показывает не только цену, но и то, что нужно проверить до заказа. Каталог-кандидат не означает, что изделие уже утверждено или куплено."
        />
        <StatusKey />
      </section>
      <section className="content-section compact"><ProductGrid /></section>
      <section className="content-section evidence-callout">
        <div><span className="eyebrow">Правило закупки</span><h2>Сначала артикул — потом ниша и розетка</h2></div>
        <p>
          Нельзя производить мебель по картинке. После выбора конкретного товара
          в проект заносятся паспортные размеры, вентиляционные зазоры, зоны открывания,
          мощность, вода, слив и сервисный доступ.
        </p>
        <a className="button primary" href={asset("/downloads/shopping-catalog-v19.csv")} download>Скачать каталог v19 · 30 позиций</a>
      </section>
    </>
  );
}

function EstimatePage() {
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Предварительная смета · Ставрополь · 30.07.2026"
          title="Стоимость показана диапазоном и по этапам"
          text="Коробка, крыша, окна и входная дверь считаются существующими. Интернет-цены не являются офертой; окончательная смета появляется после ведомости объёмов и коммерческих предложений."
        />
        <div className="estimate-summary">
          <article><span>Работы и комплектация</span><strong>24,35–45,40 млн ₽</strong><small>сумма 17 укрупнённых разделов</small></article>
          <article className="accent"><span>Плановый резерв 12%</span><strong>27,27–50,85 млн ₽</strong><small>не скрыт внутри единичных расценок</small></article>
          <article><span>Не включено</span><strong>земля и коробка</strong><small>считаются существующими</small></article>
        </div>
      </section>
      <section className="content-section">
        <div className="cost-group-grid">
          {costGroups.map(([title, price, note]) => (
            <article key={title}><span>{title}</span><strong>{price}</strong><p>{note}</p></article>
          ))}
        </div>
      </section>
      <section className="content-section">
        <PageIntro
          eyebrow="Последовательность после коробки"
          title="Что делает Дмитрий и что должен сдать подрядчик"
          text="Переход к следующему этапу разрешён только после контрольного результата текущего этапа."
        />
        <div className="stage-list">
          {stages.map(([number, title, action, result]) => (
            <article key={number}>
              <span>{number}</span>
              <div><strong>{title}</strong><p>{action}</p></div>
              <b>{result}</b>
            </article>
          ))}
        </div>
        <div className="download-row">
          <a className="button primary" href={asset("/downloads/estimate-v18.csv")} download>Скачать подробную смету CSV</a>
          <a className="button outline" href={asset("/downloads/construction-sequence-v17.csv")} download>Скачать порядок работ</a>
        </div>
      </section>
    </>
  );
}

function DocumentsPage() {
  return (
    <>
      <section className="content-section first">
        <PageIntro
          eyebrow="Исходники, журналы и технологии"
          title="Что лежит в основе приложения"
          text="Здесь собраны первичные чертежи, таблицы для подрядчиков и аудит GitHub-инструментов. Репозиторий не считается доказательством правильной геометрии — её задают только исходники и обмер."
        />
      </section>
      <section className="content-section compact">
        <div className="document-grid">
          {[
            ["Исходный PDF · 18 листов", "/downloads/official-architecture.pdf", "Главный источник планов, фасадов, разреза и размеров."],
            ["Каталог товаров v19 · 30 позиций", "/downloads/shopping-catalog-v19.csv", "Техника, сантехника, свет, материалы, баня, участок и растения."],
            ["BOQ кухни v18", "/downloads/kitchen-boq-v18.csv", "Модули, оборудование и предварительные диапазоны стоимости."],
            ["Инженерное задание кухни", "/downloads/kitchen-engineering-v18.csv", "Потребители, исходные мощности и ответственные."],
            ["Смета v18", "/downloads/estimate-v18.csv", "Разделы, диапазоны, источники и исключения."],
            ["Последовательность работ", "/downloads/construction-sequence-v17.csv", "Этапы, контрольные результаты и запреты перехода."],
          ].map(([title, href, note]) => (
            <a href={asset(href)} target="_blank" className="document-card" key={title}>
              <span>Файл</span><strong>{title}</strong><p>{note}</p><b>Открыть ↗</b>
            </a>
          ))}
        </div>
      </section>
      <section className="content-section">
        <PageIntro
          eyebrow="GitHub-аудит"
          title="Какие инструменты действительно полезны"
          text="Проверены назначение и лицензия. Для текущего релиза не подключается новый игровой движок: сначала исправляются исходные модели и материалы."
        />
        <div className="github-table">
          <div className="table-head"><span>Инструмент</span><span>Лицензия</span><span>Решение</span><span>Зачем</span></div>
          {githubTools.map(([title, license, note, decision, url]) => (
            <a href={url} target="_blank" rel="noreferrer" key={title}>
              <strong>{title}</strong><span>{license}</span><b>{decision}</b><p>{note}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="content-section evidence-callout">
        <div><span className="eyebrow">Следующий допуск</span><h2>Что нужно для настоящей игровой версии</h2></div>
        <p>
          Проверенная C4D/BIM-геометрия, реальные PBR-материалы, паспортные 3D-модели
          выбранной мебели и техники, оптимизация GLB, коллизии, навигационная сетка,
          интерактивные двери и повторная проверка размеров. Только после этого Babylon.js
          или Three.js дают полезный результат.
        </p>
        <a className="button primary" href={asset("/downloads/github-tool-audit-v18.csv")} download>Скачать аудит GitHub</a>
      </section>
    </>
  );
}

export function ProjectV18({ page }: { page: PageKind }) {
  return (
    <main>
      <Header active={page} />
      {page === "home" && <HomePage />}
      {page === "landscape" && <LandscapePage />}
      {page === "bath" && <BathPage />}
      {page === "kitchen" && <KitchenPage />}
      {page === "rooms" && <RoomsPage />}
      {page === "model" && <ModelPage />}
      {page === "engineering" && <EngineeringPage />}
      {page === "sheets" && <SheetsPage />}
      {page === "catalog" && <CatalogPage />}
      {page === "estimate" && <EstimatePage />}
      {page === "documents" && <DocumentsPage />}
      <Footer />
    </main>
  );
}
