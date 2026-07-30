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
      publicAsset("/models/dima-v15.glb"),
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
        onStatus("Точная GLB-модель v15 загружена: дом, комнаты, участок, баня и растения.");
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
    image: "/plans/v15/floor-1-c4d.png",
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
    image: "/plans/v15/floor-2-c4d.png",
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
  ["Обследование и рабочие проекты", "0,9–1,6 млн ₽", "обмеры, архитектура, конструктив, инженерные разделы"],
  ["Инженерия дома и газ", "1,6–3,0 млн ₽", "электрика, вода, канализация, отопление, вентиляция, согласования"],
  ["Черновая и чистовая отделка", "6,5–11,5 млн ₽", "241,46 м² по планам, без изменения коробки"],
  ["Балкон, фасады и мангальная", "2,2–4,2 млн ₽", "усиления, ограждение, навес, дымоудаление, мойка"],
  ["Кухня, мебель и техника", "4,0–7,0 млн ₽", "семейная комплектация среднего/выше среднего уровня"],
  ["Двор, водоотвод, забор и свет", "3,0–5,5 млн ₽", "бетон, дорожки, ливнёвка, ворота, наружное освещение"],
  ["Баня 3×7 м", "2,0–3,6 млн ₽", "коробка, печь, инженерия, внутренняя отделка"],
  ["Растения, газон и полив", "0,8–1,6 млн ₽", "посадочный материал, грунт, посадка, капельный полив"],
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
  ["Фасад с улицы", "/renders/v15/01-front-photoreal.png", "Гараж слева, высокий витраж справа, бетонный двор и зелёная полоса справа."],
  ["Общий безопасный балкон", "/renders/v15/02-balcony-photoreal.png", "Два выхода — из спальни родителей и детской — на единый Г‑образный балкон."],
  ["Мангальная терраса", "/renders/v15/03-mangal-photoreal.png", "Кирпичная рабочая линия, мангал, казан, мойка и высокий светлый навес."],
  ["Баня 3×7 м", "/renders/v15/04-bathhouse-photoreal.png", "Отступ 1 м слева и 1 м сзади, отдельная освещённая дорожка."],
];

export function DimaProjectApp() {
  const viewerRef = useRef<ViewerApi>(null);
  const [status, setStatus] = useState("Подготовка точной модели v15…");
  const [selection, setSelection] = useState("Ничего не выбрано");
  const [activeView, setActiveView] = useState<ViewKey>("front");
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    house: true,
    interiors: true,
    changes: true,
    site: true,
    fence: true,
    plants: true,
  });

  const setView = (view: ViewKey) => {
    setActiveView(view);
    viewerRef.current?.setView(view);
  };

  const toggleLayer = (key: LayerKey) => {
    const visible = !layers[key];
    setLayers((current) => ({ ...current, [key]: visible }));
    viewerRef.current?.setLayer(key, visible);
  };

  const totalPlants = useMemo(
    () => plants.reduce((sum, row) => sum + Number(row[1].match(/\d+/)?.[0] ?? 0), 0),
    [],
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
          <a href="#cost">Стоимость</a>
        </nav>
        <a className="download-link" href={publicAsset("/downloads/official-architecture.pdf")} target="_blank">
          Исходный PDF
        </a>
      </header>

      <section className="hero" id="top">
        <img src={publicAsset("/renders/v15/01-front-photoreal.png")} alt="Фотореалистичный вид точного фасада с улицы" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="kicker">Предпроект v15 · Ставрополь · 30 июля 2026</span>
          <h1>Дом и участок, которые можно проверить</h1>
          <p>
            Не абстрактный рендер: модель восстановлена по 18 листам PDF. Улица находится
            спереди, гараж слева, витраж справа. Комнаты, баня, общий балкон, мангальная,
            растения, размеры и бюджет собраны в одном понятном проекте.
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
          <h2>Осмотрите дом с любой стороны и включите комнаты</h2>
          <p>
            Это та же геометрия, что сохранена в Cinema 4D. Колёсико — масштаб,
            перетаскивание — поворот. В режиме прогулки используйте WASD. По двери можно нажать.
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
              ] as [ViewKey, string][]).map(([key, label]) => (
                <button className={activeView === key ? "active" : ""} key={key} onClick={() => setView(key)}>
                  {label}
                </button>
              ))}
            </div>
            <button className="walk-button" onClick={() => viewerRef.current?.startWalk()}>
              Прогулка внутри
            </button>
          </div>
          <div className="viewer-grid">
            <div className="viewer-canvas">
              <ProjectViewer ref={viewerRef} onStatus={setStatus} onSelection={setSelection} />
              <div className="orientation-note">Улица ↓ · задний двор ↑</div>
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
              ] as [LayerKey, string][]).map(([key, label]) => (
                <label key={key}>
                  <input checked={layers[key]} type="checkbox" onChange={() => toggleLayer(key)} />
                  <span>{label}</span>
                </label>
              ))}
              <button className="reset-button" onClick={() => {
                setLayers({ house: true, interiors: true, changes: true, site: true, fence: true, plants: true });
                viewerRef.current?.reset();
              }}>
                Сбросить вид
              </button>
              <div className="model-status">
                <small>Состояние</small>
                <p>{status}</p>
                <small>Выбрано</small>
                <p>{selection}</p>
              </div>
            </aside>
          </div>
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
          <a href={publicAsset("/plans/v15/source-front.png")} target="_blank">
            <img src={publicAsset("/plans/v15/source-front.png")} alt="Исходный передний фасад из PDF" />
            <span>1. Исходный фасад PDF</span>
          </a>
          <a href={publicAsset("/renders/v15/06-front-c4d-control.png")} target="_blank">
            <img src={publicAsset("/renders/v15/06-front-c4d-control.png")} alt="Контрольная геометрия Cinema 4D" />
            <span>2. Контроль геометрии C4D</span>
          </a>
          <a href={publicAsset("/renders/v15/01-front-photoreal.png")} target="_blank">
            <img src={publicAsset("/renders/v15/01-front-photoreal.png")} alt="Фотореалистичный фасад" />
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
          <div><span className="kicker">Освещение 3000K</span><h3>Свет без ослепления соседей</h3></div>
          <ul>
            <li>6 низких опор вдоль правой дорожки, шаг около 3 м;</li>
            <li>3 опоры к бане и отдельный свет у входа;</li>
            <li>подсветка входа, ворот, балкона и рабочей линии мангальной;</li>
            <li>аварийный свет и ручное отключение; фасадные приборы направлены вниз;</li>
            <li>кабели и автоматика рассчитываются отдельным разделом электрики.</li>
          </ul>
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
          <div><span>Работы и комплектация</span><strong>21–38 млн ₽</strong><small>предварительный диапазон</small></div>
          <div className="accent"><span>С резервом 15%</span><strong>24–44 млн ₽</strong><small>решение для планирования бюджета</small></div>
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
      </section>

      <section className="section sources-section">
        <div className="section-title">
          <span className="kicker">Кандидаты для запросов КП</span>
          <h2>Кого и где проверять в Ставрополе</h2>
          <p>Это не автоматическое назначение подрядчика. Перед договором нужны выезд, реквизиты, смета, гарантия и проверка реальных объектов.</p>
        </div>
        <div className="source-links">
          <a href="https://stavropol.mslandshaft.ru/portfolio/" target="_blank" rel="noreferrer"><strong>Ландшафт Плюс</strong><span>проект, дренаж, посадки · запросить объекты через 2–3 сезона</span></a>
          <a href="https://vashremont26.ru/" target="_blank" rel="noreferrer"><strong>Ваш Ремонт</strong><span>местный ориентир «под ключ» от 15 000 ₽/м² · получить подробное КП</span></a>
          <a href="https://stavropol.1remont-kvartir.ru/" target="_blank" rel="noreferrer"><strong>1 Ремонт Квартир</strong><span>публичные диапазоны по классам ремонта · сравнить состав работ</span></a>
          <a href="https://mebelnazakaz26.ru/" target="_blank" rel="noreferrer"><strong>Мебель на заказ 26</strong><span>кухни и встроенная мебель · проверить фурнитуру и гарантию</span></a>
          <a href="https://stavropol.marya.ru/price/" target="_blank" rel="noreferrer"><strong>Кухни «Мария»</strong><span>альтернативное КП на кухню после чистовых замеров</span></a>
          <a href="https://stavropol.santehnica.ru/" target="_blank" rel="noreferrer"><strong>Сантехника-Онлайн</strong><span>скрытые части купить до разводки, сверить сервис и наличие</span></a>
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
        <strong>Дима · Облагораживание · версия 15</strong>
        <span>Исходник: архитектурный PDF · модель: Cinema 4D 2026 · веб: GLB</span>
        <a href={publicAsset("/downloads/official-architecture.pdf")} target="_blank">Открыть исходные чертежи</a>
      </footer>
    </main>
  );
}
