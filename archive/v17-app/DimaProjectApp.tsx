"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  ProjectViewerV17,
  type LightingMode,
  type MovementKey,
  type ProjectLayer,
  type ProjectView,
  type ProjectViewerV17Api,
} from "./ProjectViewerV17";

type LayerKey = "house" | "interiors" | "changes" | "site" | "fence" | "plants";
type ViewKey = "front" | "rear" | "balcony" | "mangal" | "bath" | "top";

type ViewerApi = {
  setView: (view: ViewKey) => void;
  setLayer: (key: LayerKey, visible: boolean) => void;
  startWalk: () => void;
  reset: () => void;
};

const layerTokens: Record<LayerKey, string[]> = {
  house: ["02_ДОМ", "02_HOUSE"],
  interiors: ["03_ИНТЕРЬЕР", "03_INTERIOR"],
  changes: ["04_ИЗМЕНЕНИ", "04_CHANGE"],
  site: ["05_УЧАСТОК", "05_SITE"],
  fence: ["06_ЗАБОР", "06_FENCE"],
  plants: ["07_ОЗЕЛЕН", "07_PLANT"],
};

const views: Record<ViewKey, { position: [number, number, number]; target: [number, number, number] }> = {
  front: { position: [0, 5.4, 22], target: [0, 2.2, 0] },
  rear: { position: [0, 6.4, -23], target: [0, 2.4, -1] },
  balcony: { position: [-18, 8.2, 15], target: [-2, 3.5, 0] },
  mangal: { position: [0, 5.2, -18], target: [1, 2.0, -4] },
  bath: { position: [-14, 10, -18], target: [-7, 1.5, -9] },
  top: { position: [0, 28, 0.01], target: [0, 0, 0] },
};

function publicAsset(path: string) {
  return `https://code-cube-lab.github.io/dima-oblagorazhivanie${path}`;
}

const ProjectViewer = forwardRef<
  ViewerApi,
  {
    onStatus: (status: string) => void;
    onSelection: (selection: string) => void;
  }
>(function ProjectViewer({ onStatus, onSelection }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ViewerApi | null>(null);

  useImperativeHandle(ref, () => ({
    setView: (view) => apiRef.current?.setView(view),
    setLayer: (key, visible) => apiRef.current?.setLayer(key, visible),
    startWalk: () => apiRef.current?.startWalk(),
    reset: () => apiRef.current?.reset(),
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#cad8d4");
    scene.fog = new THREE.Fog("#cad8d4", 35, 75);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.02, 250);
    camera.position.set(...views.front.position);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.07;
    orbit.target.set(...views.front.target);
    orbit.maxPolarAngle = Math.PI * 0.495;
    orbit.minDistance = 2.5;
    orbit.maxDistance = 60;

    const walk = new PointerLockControls(camera, renderer.domElement);
    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => keys.add(event.code);
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    scene.add(new THREE.HemisphereLight("#e9f2ff", "#6d6654", 2.2));
    const sun = new THREE.DirectionalLight("#fff3d8", 4.0);
    sun.position.set(18, 28, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: "#8fa184", roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene.add(ground);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);
    const loader = new GLTFLoader();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let loadedModel: THREE.Object3D | null = null;
    let disposed = false;

    const applyView = (view: ViewKey) => {
      const preset = views[view];
      if (walk.isLocked) walk.unlock();
      orbit.enabled = true;
      camera.position.set(...preset.position);
      orbit.target.set(...preset.target);
      camera.lookAt(orbit.target);
      orbit.update();
    };

    const setLayer = (key: LayerKey, visible: boolean) => {
      if (!loadedModel) return;
      const tokens = layerTokens[key];
      loadedModel.traverse((object) => {
        const upperName = object.name.toUpperCase();
        if (tokens.some((token) => upperName.includes(token))) {
          object.visible = visible;
        }
      });
    };

    const reset = () => {
      if (loadedModel) {
        loadedModel.traverse((object) => {
          object.visible = true;
          if (typeof object.userData.closedRotationY === "number") {
            object.rotation.y = object.userData.closedRotationY;
            object.userData.open = false;
          }
        });
      }
      applyView("front");
      onSelection("Ничего не выбрано");
    };

    apiRef.current = {
      setView: applyView,
      setLayer,
      reset,
      startWalk: () => {
        orbit.enabled = false;
        camera.position.set(0, 1.7, 14);
        camera.lookAt(0, 1.7, 0);
        walk.lock();
        onStatus("Прогулка: WASD или стрелки, Esc — выйти. Нажмите дверь, чтобы открыть.");
      },
    };

    loader.load(
      publicAsset("/models/dima-v16.glb"),
      (gltf) => {
        if (disposed) return;
        loadedModel = gltf.scene;
        loadedModel.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        const sourceTemplates: THREE.Object3D[] = [];
        loadedModel.traverse((object) => {
          if (
            object.name.includes("PH_SOURCE_") ||
            object.name.includes("PH_CC0_ИСТОЧНИКИ")
          ) {
            sourceTemplates.push(object);
          }
        });
        sourceTemplates.forEach((object) => object.parent?.remove(object));
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const fitScale = 25 / Math.max(size.x, size.z, size.y * 1.4);
        loadedModel.position.copy(center).multiplyScalar(-1);
        modelRoot.add(loadedModel);
        modelRoot.scale.setScalar(fitScale);
        const fittedBox = new THREE.Box3().setFromObject(modelRoot);
        modelRoot.position.y -= fittedBox.min.y;
        onStatus("GLB-модель v16 загружена: дом, отремонтированные комнаты, балкон 7,50 м, участок, баня, растения и свет.");
      },
      (event) => {
        if (event.total > 0) {
          onStatus(`Загрузка точной модели: ${Math.round((event.loaded / event.total) * 100)}%`);
        }
      },
      () => onStatus("Модель не загрузилась. Контрольные планы и рендеры ниже остаются доступны."),
    );

    const onPointerDown = (event: PointerEvent) => {
      if (!loadedModel || walk.isLocked) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(loadedModel, true)[0];
      if (!hit) return;
      const object = hit.object;
      onSelection(object.name || object.parent?.name || "Элемент модели");
      const door = [object, object.parent, object.parent?.parent].find((candidate) =>
        candidate?.name.toUpperCase().match(/ДВЕР|DOOR/),
      );
      if (door) {
        if (typeof door.userData.closedRotationY !== "number") {
          door.userData.closedRotationY = door.rotation.y;
        }
        door.userData.open = !door.userData.open;
        door.rotation.y =
          door.userData.closedRotationY + (door.userData.open ? Math.PI * 0.42 : 0);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      if (walk.isLocked) {
        const speed = 4.2 * delta;
        if (keys.has("KeyW") || keys.has("ArrowUp")) walk.moveForward(speed);
        if (keys.has("KeyS") || keys.has("ArrowDown")) walk.moveForward(-speed);
        if (keys.has("KeyA") || keys.has("ArrowLeft")) walk.moveRight(-speed);
        if (keys.has("KeyD") || keys.has("ArrowRight")) walk.moveRight(speed);
        camera.position.y = 1.7;
      } else {
        orbit.update();
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      orbit.dispose();
      walk.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      apiRef.current = null;
    };
  }, [onSelection, onStatus]);

  return <div className="model-mount" ref={mountRef} aria-label="Интерактивная 3D-модель проекта" />;
});

const roomFloors = [
  {
    title: "Первый этаж",
    total: "149,47 м²",
    image: "/plans/v16/floor-1-c4d.png",
    rooms: [
      ["Кухня-гостиная", "50,12"],
      ["Гараж", "47,75"],
      ["Спальня", "13,68"],
      ["Лестница", "8,75"],
      ["Кладовая", "8,34"],
      ["Котельная", "8,24"],
      ["Прихожая", "6,08"],
      ["С/У", "3,43"],
      ["Коридор", "3,07"],
    ],
  },
  {
    title: "Второй этаж",
    total: "91,99 м²",
    image: "/plans/v16/floor-2-c4d.png",
    rooms: [
      ["Детская Дарины", "16,33"],
      ["Детская Ярика", "16,87"],
      ["Спальня родителей", "15,58"],
      ["С/У родителей", "11,17"],
      ["Лестница", "8,75"],
      ["С/У детей", "8,31"],
      ["Коридор", "7,52"],
      ["Гардероб", "7,47"],
    ],
  },
];

const plants = [
  ["Гортензия метельчатая", "4 шт.", "1,6 × 1,5 м", "шаг 3,8–4,0 м", "правая полоса"],
  ["Спирея японская", "3 шт.", "0,75 × 0,85 м", "шаг 2,4 м", "справа у заднего двора"],
  ["Дёрен белый", "2 шт.", "1,8 × 1,6 м", "шаг 1,8–2,0 м", "правый дальний угол"],
  ["Мискантус", "6 групп", "1,5 × 0,9 м", "шаг 3,5–4,0 м", "ритм вдоль дорожки"],
  ["Лаванда Hidcote", "12 шт.", "0,5 × 0,7 м", "шаг 0,7 м", "солнце у дороги"],
  ["Шалфей", "11 шт.", "0,55 × 0,6 м", "шаг 0,7 м", "цветник у террасы"],
  ["Эхинацея", "13 шт.", "0,8 × 0,55 м", "шаг 0,65 м", "цветник у террасы"],
  ["Барвинок", "4 группы", "0,2 × 0,6 м", "шаг 0,45 м", "почвопокровный край"],
];

const costGroups = [
  ["Обследование, архитектура и проекты", "0,8–1,8 млн ₽", "обмеры, дизайн, конструктив, ЭОМ, ВК, ОВ и газ"],
  ["Балкон 7,50 м", "1,85–3,80 млн ₽", "расчёт, новый проём, каркас/плита, ограждение 1,20 м и экраны 1,80 м"],
  ["Электрика и освещение", "1,1–2,2 млн ₽", "щит, кабели, автоматика, 17 групп света, монтаж и пуск"],
  ["Инженерия дома", "2,4–4,3 млн ₽", "вода, канализация, отопление, вентиляция и газ"],
  ["Черновая и чистовая отделка", "7,7–12,9 млн ₽", "241,46 м² по планам, без стоимости существующей коробки"],
  ["Кухня, мебель, техника, сантехника", "3,85–7,60 млн ₽", "семейная комплектация среднего/выше среднего уровня"],
  ["Мангальная", "0,85–1,60 млн ₽", "кирпичная линия, мойка, дымоудаление и негорючие узлы"],
  ["Двор, баня, хозблок и озеленение", "5,0–9,7 млн ₽", "водоотвод, бетон, дорожки, наружный свет, баня 3×7 м и посадки"],
];

const stages = [
  ["01", "Обмеры и обследование", "зафиксировать фактические размеры, трещины, влажность и точки вводов"],
  ["02", "Рабочие проекты", "архитектура, усиление новой двери и балкона, электрика, вода, газ, вентиляция"],
  ["03", "Тяжёлые и скрытые работы", "проёмы, усиления, трассы, гидроизоляция; фото до зашивки"],
  ["04", "Черновая отделка", "штукатурка, стяжка, основания и контроль лазером"],
  ["05", "Чистовая отделка и мебель", "образцы материалов, кухня и встроенная мебель после контрольного замера"],
  ["06", "Двор и баня", "сначала водоотвод и тяжёлые поставки, затем бетон, дорожки и свет"],
  ["07", "Посадки и приёмка", "растения после строительных работ; пусконаладка и исполнительная документация"],
];

const gallery = [
  ["Фасад с улицы", "/renders/v16/01-front-photoreal.png", "Гараж слева, высокий витраж справа, бетонный двор и зелёная полоса справа."],
  ["Балкон на весь гараж", "/renders/v16/02-balcony-photoreal.png", "Передняя часть 7,50 м, высокие экраны 1,80 м и два выхода на единый Г‑образный балкон."],
  ["Кухня-гостиная", "/renders/v16/03-kitchen-living-photoreal.png", "Кухня 5,2 м с островом, стол на шесть мест, диван и ТВ-стена."],
  ["Спальня родителей", "/renders/v16/04-parents-bedroom-photoreal.png", "Спокойная отделка, кровать 1800 мм, туалетный стол Олеси и связь с гардеробом."],
  ["Детская Дарины", "/renders/v16/05-darina-room-photoreal.png", "Шалфейный акцент, гимнастический мат, шведская стенка и хранение инвентаря."],
  ["Детская Ярика", "/renders/v16/06-yarik-room-photoreal.png", "Синий акцент, рабочий стол и закрытое хранение формы и мяча."],
  ["Санузел родителей", "/renders/v16/07-bathroom-photoreal.png", "Ванна, двойная тумба, инсталляция и влагостойкий свет."],
  ["Мангальная терраса", "/renders/v16/08-mangal-photoreal.png", "Кирпичная рабочая линия, мангал, казан, мойка и высокий светлый навес."],
  ["Баня 3×7 м", "/renders/v16/09-bathhouse-photoreal.png", "Отступ 1 м слева и 1 м сзади, отдельная освещённая дорожка."],
  ["Кухня-гостиная · 4 ракурса", "/renders/v17/11-kitchen-four-views.png", "Дневные и вечерний ракурсы одной планировки: кухня 5,2 м, остров, стол, диван и ТВ-зона."],
  ["Спальня родителей · 4 ракурса", "/renders/v17/12-parents-four-views.png", "Кровать 1800 мм, гардероб, столик Олеси и реальный выход на общий балкон."],
  ["Комната Дарины · 4 ракурса", "/renders/v17/13-darina-four-views.png", "Спальное, учебное и гимнастическое места; отдельный кадр новой двери на тот же общий балкон."],
  ["Комната Ярика · 4 ракурса", "/renders/v17/14-yarik-four-views.png", "Кровать, рабочее место, закрытое хранение спортивной формы и вечерний сценарий света."],
  ["Санузел родителей · 4 ракурса", "/renders/v17/15-bathroom-four-views.png", "Ванна, двойная тумба, инсталляция, душевая зона и безопасный ночной свет."],
];

const interiorSpecs = [
  ["Кухня-гостиная · 50,12 м²", "теплый белый, микроцемент, дуб", "кухня 5,2 м, остров, стол на 6, диван, ТВ-стена", "L01–L04 + L11"],
  ["Спальня родителей · 15,58 м²", "теплый белый, мягкое изголовье, дуб", "кровать 1800, тумбы, стол Олеси, гардероб", "L06 + 2 бра"],
  ["Детская Дарины · 16,33 м²", "теплый белый, шалфейный акцент", "кровать, стол, шкаф, гимнастика, ленты и обручи", "L07 + рабочий"],
  ["Детская Ярика · 16,87 м²", "теплый белый, приглушенный синий", "кровать, стол, шкаф, хранение формы и мяча", "L08 + рабочий"],
  ["Санузлы · 22,91 м² суммарно", "светлый керамогранит R10", "инсталляции, ванна, душевая 1200×800, зеркала", "L09 IP44"],
  ["Гостевая и прихожая", "моющаяся краска, дуб и керамогранит", "кровать 1600, шкафы до потолка, банкетка", "L05 + L10"],
];

const lightingGroups = [
  ["L01–L04", "Кухня, остров, гостиная, стол", "3000К · CRI90 · диммер", "готовка / ужин / кино"],
  ["L05–L08", "Гостевая, родители, Дарина, Ярик", "3000К · CRI90", "общий / чтение / учеба / игра"],
  ["L09–L11", "Санузлы, лестница, кухня LED", "IP44 в мокрых зонах", "зеркало / ночной / рабочий"],
  ["L12–L13", "Дорожки и общий балкон", "3000К · IP65", "вечер / безопасность"],
  ["L14–L17", "Мангальная, баня, фасады, хозблок", "3000К · IP65", "готовка / фасад / датчик"],
];

const products = [
  ["Кухня «Мария» · Vector Touch", "от 280 736 ₽", "ориентир базовой компоновки; точный расчёт 5,2 м + остров", "https://stavropol.marya.ru/price/"],
  ["MAUNFELD CVI593SFBK LUX", "41 490 ₽ · нет в наличии", "индукционная панель — недоступный ориентир; перед заказом подобрать замену и пересчитать силовую линию", "https://www.maunfeld.ru/catalog/induction/induktsionnaya-varochnaya-panel-maunfeld-cvi593sfbk-lux-inverter"],
  ["MAUNFELD MBF177SWGR", "84 990 ₽", "кандидат: встраиваемый холодильник-морозильник; проверить нишу, вентиляцию и наличие", "https://www.maunfeld.ru/catalog/embedded-freezer/kholodilnik-morozilnik-vstraivaemyy-maunfeld-mbf177swgr-inverter"],
  ["MAUNFELD MLP60530", "цена уточняется", "кандидат на посудомоечную машину; вода, канализация и розетка привязываются после утверждения", "https://www.maunfeld.ru/catalog/vstraivaemye-posudomoechnye-mashiny/posudomoechnaya-mashina-maunfeld-mlp60530-light-beam"],
  ["MAUNFELD Domina 60", "цена уточняется", "кандидат на вытяжку; до заказа подтвердить канал вентиляции и высоту установки", "https://www.maunfeld.ru/catalog/embedded/kukhonnaya-vytyazhka-maunfeld-domina-60-chyernyy"],
  ["Grohe Rapid SL 38528001", "46 197 ₽ · под заказ", "подтверждённый кандидат; клавиша и часть крепежа приобретаются отдельно", "https://stavropol.santehnica.ru/product/69119.html"],
  ["Мебель для гостиной · Divan.ru", "по выбранным моделям", "каталог-кандидат для дивана, ТВ-зоны, обеденной группы; габариты ещё не привязаны к 3D", "https://www.divan.ru/stavropol/category/stenki"],
  ["Кровати и матрасы · Divan.ru", "по выбранным моделям", "каталог-кандидат для спальни родителей и гостевой; розетки и бра после выбора", "https://www.divan.ru/stavropol/category/krovati-i-matrasy"],
  ["Детская мебель · Divan.ru", "по выбранным моделям", "кандидаты для Дарины и Ярика; проверить безопасность, крепления и реальные размеры", "https://www.divan.ru/stavropol/category/mebel-dla-detskoj"],
  ["ARISTO Ставрополь", "индивидуальный расчёт", "гардероб, прихожая и закрытое хранение только после контрольного замера", "https://stavropol.aristo.ru/"],
  ["Maytoni Focus · 3000К · CRI>90", "цена уточняется", "кандидат внутреннего света; количество определяет светотехнический расчёт", "https://maytoni.ru/catalog/functional/potolochnye-svetilniki-func/potolochnye-vstraivaemye-svetilniki/svetilniki-downlight/c071cl-7w3k-b/"],
  ["Maytoni Line · IP65", "цена уточняется", "кандидат для фасада и балкона; есть материалы для точной 3D-привязки", "https://maytoni.ru/catalog/street/bra/o484wl-l6gf3k/"],
  ["Печи «Ермак»", "после расчёта парной", "каталог-кандидат для бани; модель выбирается вместе с дымоходом, основанием и вентиляцией", "https://ermak-pech.ru/pechi-dlya-bani"],
  ["Лаванда Hidcote", "цена и сезон уточняются", "кандидат для солнечной полосы вдоль дороги, шаг посадки 0,7 м", "https://stavropol.zpitomnik.ru/product/lavanda_uzkolistnaya_hidcote/"],
  ["Гортензия Little Lime", "цена и сезон уточняются", "кандидат для правой посадочной полосы; окончательно после анализа почвы и полива", "https://stavropol.zpitomnik.ru/product/gortenziya_metelchataya_little_lime/"],
  ["Матовый натяжной потолок", "280–700 ₽/м²", "публичный ориентир Ставрополя; итог только после замера", "https://potolokstavropol.ru/"],
  ["Световые линии", "от 2 800 ₽/м²", "уточнить состав профиля, блоки питания и сервисный доступ", "https://potolokstavropol.ru/"],
];

const selectionPurchases = [
  { match: /КУХН|ОСТРОВ|СТОЛЕШ|KITCHEN/, label: "Рассчитать кухню", url: "https://stavropol.marya.ru/price/", status: "индивидуальный расчёт" },
  { match: /ДИВАН|СОФА|ТВ_|TV_|ГОСТИН/, label: "Смотреть мебель гостиной", url: "https://www.divan.ru/stavropol/category/stenki", status: "каталог-кандидат" },
  { match: /КРОВАТ|МАТРАС|BED/, label: "Смотреть кровати и матрасы", url: "https://www.divan.ru/stavropol/category/krovati-i-matrasy", status: "каталог-кандидат" },
  { match: /ДАРИН|ЯРИК|ДЕТСК|CHILD/, label: "Смотреть детскую мебель", url: "https://www.divan.ru/stavropol/category/mebel-dla-detskoj", status: "каталог-кандидат" },
  { match: /УНИТАЗ|ИНСТАЛ|TOILET/, label: "Grohe Rapid SL", url: "https://stavropol.santehnica.ru/product/69119.html", status: "46 197 ₽ · под заказ" },
  { match: /ШКАФ|ГАРДЕРОБ|WARDROBE/, label: "Рассчитать встроенный шкаф", url: "https://stavropol.aristo.ru/", status: "после контрольного замера" },
  { match: /СВЕТ|L0[1-9]|L1[0-7]|LIGHT/, label: "Смотреть светильник 3000К", url: "https://maytoni.ru/catalog/functional/potolochnye-svetilniki-func/potolochnye-vstraivaemye-svetilniki/svetilniki-downlight/c071cl-7w3k-b/", status: "кандидат · нужен светорасчёт" },
  { match: /БАНЯ|ПЕЧЬ|SAUNA/, label: "Смотреть печи для бани", url: "https://ermak-pech.ru/pechi-dlya-bani", status: "после расчёта парной" },
  { match: /ЦВЕТ|ЛАВАНД|ГОРТЕНЗ|РАСТЕН|PLANT/, label: "Смотреть растения", url: "https://stavropol.zpitomnik.ru/catalog/", status: "сорт и сезон уточняются" },
];

export function DimaProjectApp() {
  const viewerRef = useRef<ProjectViewerV17Api>(null);
  const [status, setStatus] = useState("Подготовка интерактивной модели v17…");
  const [selection, setSelection] = useState("Ничего не выбрано");
  const [activeView, setActiveView] = useState<ProjectView>("front");
  const [lighting, setLighting] = useState<LightingMode>("day");
  const [cutaway, setCutaway] = useState(false);
  const [walkMode, setWalkMode] = useState("Осмотр");
  const [layers, setLayers] = useState<Record<ProjectLayer, boolean>>({
    house: true,
    interiors: true,
    changes: true,
    site: true,
    fence: true,
    plants: true,
  });

  const setView = (view: ProjectView) => {
    setActiveView(view);
    viewerRef.current?.setView(view);
  };

  const toggleLayer = (key: ProjectLayer) => {
    const visible = !layers[key];
    setLayers((current) => ({ ...current, [key]: visible }));
    viewerRef.current?.setLayer(key, visible);
  };

  const changeLighting = (mode: LightingMode) => {
    setLighting(mode);
    viewerRef.current?.setLighting(mode);
  };

  const changeCutaway = () => {
    const enabled = !cutaway;
    setCutaway(enabled);
    viewerRef.current?.setCutaway(enabled);
  };

  const moveButtonProps = (direction: MovementKey) => ({
    onPointerDown: () => viewerRef.current?.setMove(direction, true),
    onPointerUp: () => viewerRef.current?.setMove(direction, false),
    onPointerCancel: () => viewerRef.current?.setMove(direction, false),
    onPointerLeave: () => viewerRef.current?.setMove(direction, false),
  });

  const totalPlants = useMemo(
    () => plants.reduce((sum, row) => sum + Number(row[1].match(/\d+/)?.[0] ?? 0), 0),
    [],
  );
  const selectedPurchase = useMemo(
    () => selectionPurchases.find((item) => item.match.test(selection.toUpperCase())),
    [selection],
  );

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="В начало проекта">
          <span>ДО</span>
          <strong>Дима · Облагораживание</strong>
        </a>
        <nav aria-label="Разделы проекта">
          <a href="#model">3D</a>
          <a href="#plan">Размеры</a>
          <a href="#rooms">Комнаты</a>
          <a href="#engineering">Инженерия</a>
          <a href="#shopping">Покупки</a>
          <a href="#cost">Стоимость</a>
        </nav>
        <a className="download-link" href={publicAsset("/downloads/official-architecture.pdf")} target="_blank">
          Исходный PDF
        </a>
      </header>

      <section className="hero" id="top">
        <img src={publicAsset("/renders/v16/01-front-photoreal.png")} alt="Фотореалистичный вид точного фасада с улицы" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="kicker">Интерактивный предпроект v17 · Ставрополь · 30 июля 2026</span>
          <h1>Дом и участок, которые можно проверить</h1>
          <p>
            Не абстрактный рендер: модель восстановлена по 18 листам PDF. Улица находится
            спереди, гараж слева, витраж справа. Балкон 7,50 м перекрывает весь гараж,
            а комнаты показаны с ремонтом, мебелью, техникой и 17 группами освещения.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#model">Открыть точную 3D-модель</a>
            <a className="secondary-button" href="#plan">Проверить размеры</a>
          </div>
        </div>
        <div className="hero-facts">
          <div><strong>20 × 30 м</strong><span>участок · 600 м²</span></div>
          <div><strong>14,50 × 11,46 м</strong><span>дом по PDF</span></div>
          <div><strong>8,09 м</strong><span>высота дома</span></div>
          <div><strong>3 × 7 м</strong><span>баня с отступами 1 м</span></div>
        </div>
      </section>

      <section className="section viewer-section" id="model">
        <div className="section-title">
          <span className="kicker">Единая модель Cinema 4D → GLB → сайт</span>
          <h2>Осмотрите дом днём и ночью, затем пройдите его в масштабе</h2>
          <p>
            Это та же геометрия, что сохранена в Cinema 4D. Колёсико — масштаб,
            перетаскивание — поворот. Для прогулки выберите вид от первого или третьего лица.
            WASD/стрелки — движение, мышь — обзор, E или щелчок — открыть дверь.
          </p>
        </div>
        <div className="viewer-shell">
          <div className="viewer-toolbar">
            <div className="view-buttons" aria-label="Камеры">
              {([
                ["front", "Улица"],
                ["rear", "Зад"],
                ["balcony", "Балкон"],
                ["mangal", "Мангальная"],
                ["bath", "Баня"],
                ["top", "Сверху"],
              ] as [ProjectView, string][]).map(([key, label]) => (
                <button className={activeView === key ? "active" : ""} key={key} onClick={() => setView(key)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="viewer-mode-buttons" aria-label="Режим прогулки">
              <button className="walk-button" onClick={() => viewerRef.current?.startThirdPerson()}>
                От третьего лица
              </button>
              <button onClick={() => viewerRef.current?.startFirstPerson()}>
                От первого лица
              </button>
              <button onClick={() => viewerRef.current?.stopWalk()}>Выйти</button>
            </div>
          </div>
          <div className="viewer-scenes">
            <div className="lighting-buttons" aria-label="Время суток">
              {([
                ["day", "День"],
                ["evening", "Вечер"],
                ["night", "Ночь · включить свет"],
              ] as [LightingMode, string][]).map(([mode, label]) => (
                <button
                  className={lighting === mode ? "active" : ""}
                  key={mode}
                  onClick={() => changeLighting(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className={cutaway ? "cutaway-button active" : "cutaway-button"} onClick={changeCutaway}>
              {cutaway ? "Вернуть крышу" : "Разрез: показать ремонт"}
            </button>
          </div>
          <div className="room-camera-bar" aria-label="Камеры комнат">
            <span>Быстро войти в комнату:</span>
            {[
              ["CAM_15_", "Кухня-гостиная"],
              ["CAM_16_", "Родители"],
              ["CAM_17_", "Дарина"],
              ["CAM_18_", "Ярик"],
              ["CAM_19_", "Санузел"],
            ].map(([camera, label]) => (
              <button key={camera} onClick={() => viewerRef.current?.focusRoom(camera)}>
                {label}
              </button>
            ))}
          </div>
          <div className="viewer-grid">
            <div className="viewer-canvas">
              <ProjectViewerV17
                assetUrl={publicAsset}
                ref={viewerRef}
                onStatus={setStatus}
                onSelection={setSelection}
                onModeChange={setWalkMode}
              />
              <div className="orientation-note">Улица ↓ · задний двор ↑</div>
              <div className="walk-mode-badge">{walkMode}</div>
              <div className="mobile-dpad" aria-label="Экранное управление">
                <button className="dpad-up" {...moveButtonProps("forward")} aria-label="Вперёд">↑</button>
                <button className="dpad-left" {...moveButtonProps("left")} aria-label="Влево">←</button>
                <button className="dpad-down" {...moveButtonProps("backward")} aria-label="Назад">↓</button>
                <button className="dpad-right" {...moveButtonProps("right")} aria-label="Вправо">→</button>
              </div>
            </div>
            <aside className="layer-panel">
              <span className="kicker">Слои проекта</span>
              {([
                ["house", "Дом и проёмы"],
                ["interiors", "Комнаты и мебель"],
                ["changes", "Балкон и мангальная"],
                ["site", "Участок и баня"],
                ["fence", "Забор и ворота"],
                ["plants", "Растения"],
              ] as [ProjectLayer, string][]).map(([key, label]) => (
                <label key={key}>
                  <input checked={layers[key]} type="checkbox" onChange={() => toggleLayer(key)} />
                  <span>{label}</span>
                </label>
              ))}
              <button className="reset-button" onClick={() => {
                setLayers({ house: true, interiors: true, changes: true, site: true, fence: true, plants: true });
                setLighting("day");
                setCutaway(false);
                viewerRef.current?.reset();
              }}>
                Сбросить вид
              </button>
              <div className="model-status">
                <small>Состояние</small>
                <p>{status}</p>
                <small>Выбрано</small>
                <p>{selection}</p>
                {selectedPurchase ? (
                  <a className="object-purchase" href={selectedPurchase.url} target="_blank" rel="noreferrer">
                    <strong>{selectedPurchase.label}</strong>
                    <span>{selectedPurchase.status}</span>
                  </a>
                ) : (
                  <a className="object-purchase muted" href="#shopping">
                    <strong>Где купить этот объект</strong>
                    <span>если точная модель ещё не выбрана — открыть каталог по помещениям</span>
                  </a>
                )}
              </div>
            </aside>
          </div>
          <div className="control-guide">
            <strong>Управление без загадок</strong>
            <span><b>Осмотр:</b> тяните мышью, колесо приближает.</span>
            <span><b>От третьего лица:</b> WASD/стрелки или экранные кнопки.</span>
            <span><b>От первого лица:</b> щёлкните по сцене, мышью осматривайтесь, Esc — выход.</span>
            <span><b>Двери:</b> подойдите и нажмите E или щёлкните по полотну.</span>
          </div>
        </div>
        <div className="drawing-grid">
          <figure>
            <img src={publicAsset("/plans/v16/balcony-detail.svg")} alt="Размерная схема балкона на всю ширину гаража" />
            <figcaption><strong>Балкон 7,50 м</strong><span>Линиями показаны полная ширина, ограждение 1,20 м и высокие перегородки 1,80 м.</span></figcaption>
          </figure>
          <figure>
            <img src={publicAsset("/plans/v16/lighting-scheme.svg")} alt="Схема внутреннего и наружного освещения L01–L17" />
            <figcaption><strong>Свет L01–L17</strong><span>Отдельные группы для комнат, санузлов, балкона, мангальной, бани, дорожек и фасадов.</span></figcaption>
          </figure>
        </div>
      </section>

      <section className="section" id="plan">
        <div className="section-title">
          <span className="kicker">Точный генплан · не зеркальный</span>
          <h2>Все основные размеры и функциональные связи</h2>
          <p>
            Дорожки соединяют вход, заднюю террасу и баню. Передний двор почти полностью
            бетонный; озеленение сосредоточено справа и продолжается вдоль дороги.
          </p>
        </div>
        <div className="plan-layout">
          <figure className="plot-figure">
            <div className="plot">
              <div className="green-right"><span>озеленение 3 м</span></div>
              <div className="rear-lawn"><span>газон</span></div>
              <div className="front-concrete"><span>бетонный двор 17 × 5,89 м</span></div>
              <div className="right-path"><span>1,2 м</span></div>
              <div className="cross-path"><span>дорожка к бане</span></div>
              <div className="house-footprint">
                <strong>ДОМ</strong>
                <span>14,50 × 11,46 м</span>
                <small>гараж слева ↓</small>
              </div>
              <div className="bath-footprint"><strong>БАНЯ</strong><span>3 × 7 м</span></div>
              <div className="shed-footprint"><strong>Хозблок</strong><span>1 × 3 м</span></div>
              <div className="mangal-footprint"><span>мангальная терраса</span></div>
              <div className="dim dim-left-house">1,50 м</div>
              <div className="dim dim-right-house">4,00 м</div>
              <div className="dim dim-front-house">5,05 / 5,89 м</div>
              <div className="dim dim-bath-left">1,00 м</div>
              <div className="dim dim-bath-rear">1,00 м</div>
            </div>
            <div className="road">УЛИЦА · ФАСАД · ВЪЕЗД</div>
            <figcaption>Схема в метрах. Север и фактические отметки уточняются топосъёмкой.</figcaption>
          </figure>
          <div className="dimension-cards">
            <article><span>Границы</span><strong>20 × 30 м</strong><p>Участок 600 м²; дорога по нижней стороне схемы.</p></article>
            <article><span>Дом</span><strong>14,50 м</strong><p>Наружная ширина; между осями 14,10 м, глубина по осям 11,46 м.</p></article>
            <article><span>Отступы дома</span><strong>1,50 / 4,00 м</strong><p>До левой и правой границ по наружным стенам.</p></article>
            <article><span>Перед домом</span><strong>5,05–5,89 м</strong><p>Гараж выдвинут ближе к дороге, основная часть стоит глубже.</p></article>
            <article><span>Общий балкон</span><strong>7,50 м</strong><p>Передняя часть на всю ширину гаража, соединена с боковым выходом родителей; экраны 1,80 м.</p></article>
            <article><span>Баня</span><strong>3 × 7 м</strong><p>1,00 м от левой и 1,00 м от задней границы.</p></article>
            <article><span>Хозблок</span><strong>1 × 3 м</strong><p>В переднем левом углу, вплотную к линии забора.</p></article>
            <article className="warning"><span>До стройки</span><strong>Нужна топосъёмка</strong><p>Проверить границы, высоты, уклоны, вводы и нормы отступов.</p></article>
          </div>
        </div>
      </section>

      <section className="section" id="rooms">
        <div className="section-title">
          <span className="kicker">Комнаты восстановлены по листам 7–8</span>
          <h2>Внутри не пустая коробка</h2>
          <p>
            В 3D можно отключить фасады и увидеть мебельные объёмы. Ниже — контрольные
            планы этажей и площади помещений из исходного проекта.
          </p>
        </div>
        <div className="floor-grid">
          {roomFloors.map((floor) => (
            <article className="floor-card" key={floor.title}>
              <div className="floor-image">
                <img src={publicAsset(floor.image)} alt={`Контрольный план: ${floor.title}`} />
              </div>
              <div className="floor-info">
                <span className="kicker">{floor.total}</span>
                <h3>{floor.title}</h3>
                <div className="room-list">
                  {floor.rooms.map(([name, area]) => (
                    <div key={name}><span>{name}</span><strong>{area} м²</strong></div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="family-brief">
          <article><strong>Дмитрий и Олеся</strong><p>Спальня с боковым выходом на общий балкон, гардероб и отдельный санузел.</p></article>
          <article><strong>Дарина · 8 лет</strong><p>Детская с местом для гимнастической стенки и новым выходом на безопасный балкон.</p></article>
          <article><strong>Ярик · 6 лет</strong><p>Детская с рабочим столом, хранением формы и свободной зоной для игры с мячом.</p></article>
          <article><strong>Семейная дача</strong><p>Большая кухня-гостиная, задняя терраса и светлая мангальная зона для разных блюд.</p></article>
        </div>
        <div className="section-title compact-title">
          <span className="kicker">Ремонт по помещениям</span>
          <h2>Отделка, мебель и свет уже связаны между собой</h2>
          <p>Это не пустые цветные коробки: для каждой комнаты задана функция, отделка, комплектация и группа освещения.</p>
        </div>
        <div className="plant-table interior-table" role="table" aria-label="Ведомость ремонта по помещениям">
          <div className="plant-head" role="row"><span>Помещение</span><span>Отделка</span><span>Мебель и оборудование</span><span>Свет</span></div>
          {interiorSpecs.map((row) => (
            <div role="row" key={row[0]}>{row.map((cell) => <span role="cell" key={cell}>{cell}</span>)}</div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <span className="kicker">Как будет выглядеть после реализации</span>
          <h2>Фотореалистичные кадры на проверенной геометрии</h2>
          <p>
            Изображения показывают материалы и атмосферу. Для контроля размеров рядом
            доступны технические виды Cinema 4D и исходный PDF.
          </p>
        </div>
        <div className="gallery">
          {gallery.map(([title, image, text]) => (
            <figure key={title}>
              <img src={publicAsset(image)} alt={title} />
              <figcaption><strong>{title}</strong><span>{text}</span></figcaption>
            </figure>
          ))}
        </div>
        <div className="evidence-strip">
          <a href={publicAsset("/plans/v16/source-front.png")} target="_blank">
            <img src={publicAsset("/plans/v16/source-front.png")} alt="Исходный передний фасад из PDF" />
            <span>1. Исходный фасад PDF</span>
          </a>
          <a href={publicAsset("/renders/v16/10-front-c4d-control.png")} target="_blank">
            <img src={publicAsset("/renders/v16/10-front-c4d-control.png")} alt="Контрольная геометрия Cinema 4D" />
            <span>2. Контроль геометрии C4D</span>
          </a>
          <a href={publicAsset("/renders/v16/01-front-photoreal.png")} target="_blank">
            <img src={publicAsset("/renders/v16/01-front-photoreal.png")} alt="Фотореалистичный фасад" />
            <span>3. Материалы и озеленение</span>
          </a>
        </div>
      </section>

      <section className="section planting-section">
        <div className="section-title">
          <span className="kicker">Озеленение · {totalPlants} растений и групп</span>
          <h2>Меньше деревьев, больше цветов и кустарников</h2>
          <p>Посадки не перекрывают окна, проходы и мангальную. Итоговые сорта подтверждаются после анализа почвы, солнца и полива.</p>
        </div>
        <div className="plant-table" role="table" aria-label="Ведомость растений">
          <div className="plant-head" role="row"><span>Растение</span><span>Количество</span><span>Взрослый размер</span><span>Шаг</span><span>Где посадить</span></div>
          {plants.map((row) => (
            <div role="row" key={row[0]}>{row.map((cell) => <span role="cell" key={cell}>{cell}</span>)}</div>
          ))}
        </div>
        <div className="lighting-card">
          <div><span className="kicker">17 групп света · 3000K</span><h3>Внутри, на балконе и по всему участку</h3></div>
          <ul>
            <li>жилые комнаты: CRI90, диммирование, отдельные рабочие и вечерние группы;</li>
            <li>санузлы: IP44, раздельный общий свет, зеркало и ночной сценарий;</li>
            <li>дорожки, общий балкон, мангальная, баня и фасады: IP65;</li>
            <li>ночной проход, датчики, астрореле, аварийное и ручное отключение;</li>
            <li>кабели, УЗО, автоматы и нагрузки рассчитываются проектом ЭОМ.</li>
          </ul>
        </div>
        <div className="plant-table lighting-table" role="table" aria-label="Группы освещения">
          <div className="plant-head" role="row"><span>Группы</span><span>Зона</span><span>Качество и защита</span><span>Сценарии</span></div>
          {lightingGroups.map((row) => (
            <div role="row" key={row[0]}>{row.map((cell) => <span role="cell" key={cell}>{cell}</span>)}</div>
          ))}
        </div>
      </section>

      <section className="section engineering-section" id="engineering">
        <div className="section-title">
          <span className="kicker">Инженерное задание · ЭОМ-01/02 · ВК-01</span>
          <h2>Розетки, освещение, вода и канализация показаны на отдельных листах</h2>
          <p>
            Это привязанная к планировке схема для обсуждения с электриком и сантехником.
            Она специально отмечена как предварительная: рабочие кабели, защиты, диаметры,
            уклоны, отметки, газ и проходки выпускаются только после обмера, технических
            условий и профильных расчётов.
          </p>
        </div>
        <div className="drawing-grid engineering-grid">
          <figure>
            <a href={publicAsset("/plans/v17/electrical-floor1.svg")} target="_blank">
              <img src={publicAsset("/plans/v17/electrical-floor1.svg")} alt="План-задание электрики первого этажа" />
            </a>
            <figcaption>
              <strong>ЭОМ-01 · первый этаж</strong>
              <span>Розетки, свет, выключатели, щит, кухня, гараж, гостевая и мокрые зоны.</span>
            </figcaption>
          </figure>
          <figure>
            <a href={publicAsset("/plans/v17/electrical-floor2.svg")} target="_blank">
              <img src={publicAsset("/plans/v17/electrical-floor2.svg")} alt="План-задание электрики второго этажа" />
            </a>
            <figcaption>
              <strong>ЭОМ-02 · второй этаж</strong>
              <span>Детские, спальня, санузлы, ночной свет и общий безопасный балкон с двумя выходами.</span>
            </figcaption>
          </figure>
          <figure>
            <a href={publicAsset("/plans/v17/water-sewer.svg")} target="_blank">
              <img src={publicAsset("/plans/v17/water-sewer.svg")} alt="Принципиальная схема воды и канализации" />
            </a>
            <figcaption>
              <strong>ВК-01 · вода и канализация</strong>
              <span>Ввод, коллектор, стояки, кухня, санузлы, баня, мангальная и выпуск в границах участка.</span>
            </figcaption>
          </figure>
        </div>
        <div className="engineering-warning">
          <strong>Что пока нельзя отдавать монтажникам как рабочий проект</strong>
          <span>
            Схему щита, кабели, автоматы, УЗО, заземление, диаметры труб, канализационные
            уклоны, вентиляцию и газ. Для них нужны ТУ, перечень оборудования, фактические
            отметки и подпись профильного специалиста.
          </span>
        </div>
        <div className="source-links document-links">
          <a href={publicAsset("/downloads/engineering-register-v17.csv")} download>
            <strong>Реестр инженерных разделов</strong>
            <span>что уже есть, чего не хватает и кто должен выпустить рабочий документ</span>
          </a>
          <a href={publicAsset("/downloads/construction-sequence-v17.csv")} download>
            <strong>11 этапов после коробки</strong>
            <span>действия Дмитрия, работа специалистов и запреты перехода к следующему этапу</span>
          </a>
          <a href={publicAsset("/downloads/lighting-v16.csv")} download>
            <strong>Свет L01–L17</strong>
            <span>помещения, сценарии, влагозащита и логика наружного освещения</span>
          </a>
          <a href={publicAsset("/downloads/official-architecture.pdf")} target="_blank">
            <strong>Исходные архитектурные листы</strong>
            <span>проверить ориентацию, проёмы и размеры до выпуска рабочих разделов</span>
          </a>
        </div>
      </section>

      <section className="section" id="cost">
        <div className="section-title">
          <span className="kicker">Предварительная стоимость · Ставрополь · 30.07.2026</span>
          <h2>Реалистичный бюджет, а не ложная точная цифра</h2>
          <p>
            Коробка, крыша, окна и входная дверь уже есть. До обмеров и коммерческих
            предложений безопасно использовать диапазон, а не фиксированную смету.
          </p>
        </div>
        <div className="budget-hero">
          <div><span>Работы и комплектация</span><strong>24,35–45,40 млн ₽</strong><small>сумма 17 разделов</small></div>
          <div className="accent"><span>С резервом 12%</span><strong>27,27–50,85 млн ₽</strong><small>решение для планирования бюджета</small></div>
          <div><span>Не включено</span><strong>земля и коробка</strong><small>они считаются существующими</small></div>
        </div>
        <div className="cost-grid">
          {costGroups.map(([title, price, text]) => (
            <article key={title}><span>{title}</span><strong>{price}</strong><p>{text}</p></article>
          ))}
        </div>
        <div className="price-note">
          <strong>Как превратить диапазон в смету:</strong>
          <span>обмеры → ведомость объёмов → минимум 3 сопоставимых КП → договор с этапами и удержанием → резерв на скрытые дефекты.</span>
        </div>
        <div className="source-links document-links">
          <a href={publicAsset("/downloads/interior-v16.csv")} download><strong>Ремонт по комнатам</strong><span>отделка, мебель, оборудование и свет для каждого помещения</span></a>
          <a href={publicAsset("/downloads/shopping-catalog-v17.csv")} download><strong>Комплектация v17</strong><span>по помещениям: статусы, цены, прямые ссылки и требуемые подключения</span></a>
          <a href={publicAsset("/downloads/construction-sequence-v17.csv")} download><strong>Порядок работ</strong><span>11 этапов, контрольные результаты и условия перехода</span></a>
          <a href={publicAsset("/downloads/budget-v16.csv")} download><strong>Сводная смета</strong><span>17 разделов, минимум, максимум и резерв 12%</span></a>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <span className="kicker">Порядок реализации</span>
          <h2>Строить поэтапно, не переделывая готовое</h2>
        </div>
        <div className="timeline">
          {stages.map(([number, title, text]) => (
            <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></article>
          ))}
        </div>
        <div className="source-links document-links stage-download">
          <a href={publicAsset("/downloads/construction-sequence-v17.csv")} download>
            <strong>Скачать подробный порядок для Дмитрия</strong>
            <span>по каждому этапу: кто отвечает, что принять и когда запрещено начинать следующий</span>
          </a>
        </div>
      </section>

      <section className="section sources-section" id="shopping">
        <div className="section-title">
          <span className="kicker">Проверено по открытым сайтам · 30.07.2026</span>
          <h2>Подрядчики, мебель и техника для этого проекта</h2>
          <p>Это кандидаты для сравнения, а не автоматически нанятые исполнители. Перед договором нужны выезд, реквизиты, детальная смета, гарантия и осмотр реальных объектов.</p>
        </div>
        <div className="source-links">
          <a href="https://stavropol.proff-remont.ru/" target="_blank" rel="noreferrer"><strong>Proff Ремонт</strong><span>ремонт домов и квартир · запросить смету именно по коттеджу и акты скрытых работ</span></a>
          <a href="https://vashremont26.ru/" target="_blank" rel="noreferrer"><strong>Ваш Ремонт 26</strong><span>комплексная отделка · проверить портфолио домов, договор и технадзор</span></a>
          <a href="https://rego-remont26.ru/" target="_blank" rel="noreferrer"><strong>Рего-ремонт 26</strong><span>кандидат на комплексный ремонт · запросить график, смету и гарантию</span></a>
          <a href="https://potolokstavropol.ru/" target="_blank" rel="noreferrer"><strong>PotolokStavropol</strong><span>матовые потолки 280–700 ₽/м², электромонтаж от 250 ₽/м²; уточнить полный состав</span></a>
          <a href="https://stavropol.electric-doma.ru/" target="_blank" rel="noreferrer"><strong>Клуб 24.7 Электрик</strong><span>кандидат на монтаж · требуются измерения, протоколы, схема щита и маркировка</span></a>
          <a href="https://mebelnazakaz26.ru/" target="_blank" rel="noreferrer"><strong>Мебель на заказ 26</strong><span>кухни и встроенная мебель · проверить фурнитуру и гарантию</span></a>
          <a href="https://stavropol.aristo.ru/" target="_blank" rel="noreferrer"><strong>ARISTO Ставрополь</strong><span>гардеробные и встроенная мебель · сравнить материалы, кромку и монтаж</span></a>
          <a href="https://gardenstav.ru/" target="_blank" rel="noreferrer"><strong>GardenStav</strong><span>ландшафт и полив · запросить дендроплан, анализ почвы и гарантию приживаемости</span></a>
        </div>
        <div className="section-title compact-title">
          <span className="kicker">Товары уже привязаны к модели</span>
          <h2>Проверяемая комплектация</h2>
          <p>Цены ниже взяты со страниц продавцов и могут измениться. Перед заказом сверяются наличие, гарантия, монтажные размеры и итоговая доставка.</p>
        </div>
        <div className="source-links product-links">
          {products.map(([title, price, text, url]) => (
            <a href={url} target="_blank" rel="noreferrer" key={`${title}-${price}`}>
              <strong>{title}</strong><b>{price}</b><span>{text}</span>
            </a>
          ))}
        </div>
        <div className="price-note avito-note">
          <strong>Авито — пока не внедрено как подтверждённый источник.</strong>
          <span>Сервис заблокировал автоматический просмотр объявлений. Пришлите 3–5 ссылок на выбранных мастеров — тогда они будут проверены по рейтингу, отзывам, портфолио, договору и гарантии без выдуманных данных.</span>
        </div>
      </section>

      <section className="section disclaimer">
        <div>
          <span className="kicker">Граница ответственности</span>
          <h2>Что уже можно принять и что ещё нельзя строить</h2>
        </div>
        <div>
          <p><strong>Можно принять:</strong> ориентацию дома, состав помещений, расположение бани/хозблока, логику дорожек, концепцию посадок, света и материалов.</p>
          <p><strong>До стройки обязательны:</strong> обмеры, топосъёмка, расчёт балкона и нового проёма, проект дымоудаления, электрики, воды, канализации, отопления и газа профильными специалистами.</p>
        </div>
      </section>

      <footer>
        <strong>Дима · Облагораживание · версия 17</strong>
        <span>Исходник: архитектурный PDF · модель: Cinema 4D 2026 · веб-режимы: GLB + Three.js</span>
        <a href={publicAsset("/downloads/official-architecture.pdf")} target="_blank">Открыть исходные чертежи</a>
      </footer>
    </main>
  );
}
