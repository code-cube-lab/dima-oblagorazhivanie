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

type Section =
  | "overview"
  | "plans"
  | "walk"
  | "engineering"
  | "planting"
  | "stages"
  | "budget"
  | "sources";

type DataRow = Record<string, string | number | boolean | null>;
type ProcurementData = {
  meta: {
    checked_at: string;
    partial_selected_sum_rub: number;
    priced_positions: number;
    missing_price_or_quote: number;
    warning: string;
  };
  stages: { title: string; rows: DataRow[] };
  estimate: { title: string; rows: DataRow[] };
  contractors: { title: string; rows: DataRow[] };
  specification: { title: string; rows: DataRow[] };
  appliances: { title: string; rows: DataRow[] };
  planting: { title: string; rows: DataRow[] };
  siteAudit: { title: string; rows: DataRow[] };
};

type SceneController = {
  preset: (name: string) => void;
  setStage: (stage: number) => void;
  setLayer: (layer: string, visible: boolean) => void;
  enterWalk: () => void;
  exitWalk: () => void;
  toggleDoor: (id: string) => void;
  moveSelected: (dx: number, dz: number) => void;
};

const sections: Array<{ id: Section; label: string; mark: string }> = [
  { id: "overview", label: "Обзор проекта", mark: "01" },
  { id: "plans", label: "Чертежи и размеры", mark: "02" },
  { id: "walk", label: "Прогулка по объекту", mark: "03" },
  { id: "engineering", label: "Инженерные системы", mark: "04" },
  { id: "planting", label: "Растения и свет", mark: "05" },
  { id: "stages", label: "Этапы реализации", mark: "06" },
  { id: "budget", label: "Цены и подрядчики", mark: "07" },
  { id: "sources", label: "Источники и риски", mark: "08" },
];

const stageNames = [
  "Существующая коробка",
  "Черновые сети",
  "Перегородки и основания",
  "Чистовая отделка",
  "Мебель и техника",
  "Благоустройство",
  "Итоговая концепция",
];

const verifiedFacts = [
  ["Участок", "20,00 × 30,00 м", "Лист 4"],
  ["Кадастровый номер", "26:12:011903:1397", "Лист 4"],
  ["Посадка дома", "1,70 м слева · 4,20 м справа", "Лист 4"],
  ["Отступ от улицы", "5,05 м до гаража · 5,89 м до фасада", "Лист 4"],
  ["Дом по посадочным осям", "14,10 × 11,46 м", "Листы 4, 7"],
  ["Здание", "2 этажа + подвал · высота 8,09 м", "Листы 4, 14"],
  ["Задняя терраса", "14,10 × 2,66 м · 41,03 м²", "Листы 4, 7"],
  ["Гараж", "47,75 м² · ворота 3,60 × 2,80 м", "Листы 7, 10"],
  ["Первый этаж", "149,47 м² полезной площади", "Лист 7"],
  ["Второй этаж", "91,99 м² полезной площади", "Лист 8"],
];

const proposedFacts = [
  ["Баня", "3,00 × 7,00 м", "1,00 м от левого и заднего забора"],
  ["Хозблок", "1,00 × 3,00 м", "Левый передний угол, у забора"],
  ["Мангальная", "Остеклённая задняя зона", "Оба торца примыкают к дому без зазора"],
  ["Общий Г-образный балкон", "Боковая часть + единая лицевая 7,95 × 1,95 м", "Лицевая плита над гаражом широко перекрывается с боковой; внутри угла нет ограждения"],
  ["Правая дорожка", "1,20 м", "Непрерывно от улицы к заднему двору"],
  ["Посадки", "37 растений", "Кустарники, цветы и злаки, без новых деревьев"],
];

const planSheets = [
  {
    title: "Посадка дома на участке",
    detail: "Точная основа: участок, дорога, отступы, адрес и кадастровый номер.",
    image: "/plans/site-plan.png",
    source: "Лист АР-4",
  },
  {
    title: "План первого этажа",
    detail: "Гараж, кухня-гостиная, спальня, котельная, лестница и мангальная зона.",
    image: "/plans/floor-1.png",
    source: "Лист АР-7",
  },
  {
    title: "План второго этажа",
    detail: "Три спальни, гардероб, два санузла и большая Г-образная открытая площадка.",
    image: "/plans/floor-2.png",
    source: "Лист АР-8",
  },
  {
    title: "Разрез 1-1",
    detail: "Высоты этажей, лестница, подвал, кровля и отметки парапетов.",
    image: "/plans/section.png",
    source: "Лист АР-14",
  },
  {
    title: "Главный фасад",
    detail: "Проёмы, гаражные ворота, вход и вертикальное панорамное остекление.",
    image: "/plans/facade-front.png",
    source: "Лист АР-10",
  },
  {
    title: "Задний фасад",
    detail: "Терраса, выступающая площадка второго этажа и наружные проёмы.",
    image: "/plans/facade-rear.png",
    source: "Лист АР-11",
  },
];

function currency(value: unknown) {
  if (typeof value !== "number") return value ? String(value) : "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function makeLabel(text: string, color = "#102f3d") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scale = 2;
  ctx.font = `700 ${14 * scale}px Segoe UI`;
  const width = Math.ceil(ctx.measureText(text).width + 24 * scale);
  canvas.width = width;
  canvas.height = 34 * scale;
  ctx.font = `700 ${14 * scale}px Segoe UI`;
  ctx.fillStyle = "rgba(248,247,242,.94)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.roundRect(2 * scale, 2 * scale, width - 4 * scale, 30 * scale, 7 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 12 * scale, 17 * scale);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width / 90, 0.75, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function addDimension(
  group: THREE.Group,
  start: THREE.Vector3,
  end: THREE.Vector3,
  label: string,
  color = 0xb65f38,
) {
  const material = new THREE.LineBasicMaterial({ color, depthTest: false });
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([start, end]),
    material,
  );
  line.renderOrder = 19;
  group.add(line);
  const tick = 0.18;
  for (const point of [start, end]) {
    const points =
      Math.abs(end.x - start.x) > Math.abs(end.z - start.z)
        ? [
            new THREE.Vector3(point.x, point.y, point.z - tick),
            new THREE.Vector3(point.x, point.y, point.z + tick),
          ]
        : [
            new THREE.Vector3(point.x - tick, point.y, point.z),
            new THREE.Vector3(point.x + tick, point.y, point.z),
          ];
    const mark = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      material,
    );
    mark.renderOrder = 19;
    group.add(mark);
  }
  const sprite = makeLabel(label);
  sprite.position.copy(start).lerp(end, 0.5);
  sprite.position.y += 0.42;
  group.add(sprite);
}

function addBox(
  group: THREE.Group,
  name: string,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  height: number,
  y = 0,
  material?: THREE.Material,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(x2 - x1, height, z2 - z1),
    material ??
      new THREE.MeshStandardMaterial({
        color: 0xe5e1d8,
        roughness: 0.78,
      }),
  );
  mesh.name = name;
  mesh.position.set((x1 + x2) / 2, y + height / 2, (z1 + z2) / 2);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addWall(
  group: THREE.Group,
  name: string,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  height: number,
  y: number,
  material: THREE.Material,
  thickness = 0.16,
) {
  const horizontal = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
  return addBox(
    group,
    name,
    horizontal ? Math.min(x1, x2) : x1 - thickness / 2,
    horizontal ? z1 - thickness / 2 : Math.min(z1, z2),
    horizontal ? Math.max(x1, x2) : x1 + thickness / 2,
    horizontal ? z1 + thickness / 2 : Math.max(z1, z2),
    height,
    y,
    material,
  );
}

function makeTree(group: THREE.Group, x: number, z: number, scale = 1) {
  const shrub = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55 * scale, 2),
    new THREE.MeshStandardMaterial({
      color: 0x5d7c55,
      roughness: 0.95,
    }),
  );
  shrub.position.set(x, 0.5 * scale, z);
  shrub.scale.y = 0.9;
  shrub.castShadow = true;
  group.add(shrub);
}

function makePlantClump(
  group: THREE.Group,
  x: number,
  z: number,
  color: number,
  scale = 1,
) {
  for (let i = 0; i < 5; i += 1) {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.16 * scale, 10, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.88 }),
    );
    const angle = (i / 5) * Math.PI * 2;
    flower.position.set(
      x + Math.cos(angle) * 0.18 * scale,
      0.25 * scale + (i % 2) * 0.08,
      z + Math.sin(angle) * 0.18 * scale,
    );
    flower.castShadow = true;
    group.add(flower);
  }
}

const ProjectScene = forwardRef<
  SceneController,
  {
    onSelection: (name: string) => void;
    onStatus: (text: string) => void;
  }
>(function ProjectScene({ onSelection, onStatus }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controller = useRef<SceneController | null>(null);

  useImperativeHandle(ref, () => ({
    preset: (name) => controller.current?.preset(name),
    setStage: (stage) => controller.current?.setStage(stage),
    setLayer: (layer, visible) => controller.current?.setLayer(layer, visible),
    enterWalk: () => controller.current?.enterWalk(),
    exitWalk: () => controller.current?.exitWalk(),
    toggleDoor: (id) => controller.current?.toggleDoor(id),
    moveSelected: (dx, dz) => controller.current?.moveSelected(dx, dz),
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc9d7d7);
    scene.fog = new THREE.FogExp2(0xc9d7d7, 0.012);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.08, 160);
    camera.position.set(28, 24, 35);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.target.set(10, 2.2, 15);
    orbit.maxPolarAngle = Math.PI / 2.02;
    orbit.minDistance = 5;
    orbit.maxDistance = 70;

    const walk = new PointerLockControls(camera, renderer.domElement);
    walk.addEventListener("lock", () =>
      onStatus("Прогулка включена: WASD — движение, мышь — обзор, E — дверь, Esc — выход."),
    );
    walk.addEventListener("unlock", () =>
      onStatus("Прогулка приостановлена. Можно выбрать другой ракурс."),
    );

    scene.add(new THREE.HemisphereLight(0xe8f0f0, 0x5a5246, 2.25));
    const sun = new THREE.DirectionalLight(0xfff2da, 4.1);
    sun.position.set(-12, 28, -10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    scene.add(sun);

    const groups: Record<string, THREE.Group> = {
      site: new THREE.Group(),
      shell: new THREE.Group(),
      interiors: new THREE.Group(),
      balcony: new THREE.Group(),
      mangal: new THREE.Group(),
      buildings: new THREE.Group(),
      hardscape: new THREE.Group(),
      planting: new THREE.Group(),
      lighting: new THREE.Group(),
      furniture: new THREE.Group(),
      engineering: new THREE.Group(),
      dimensions: new THREE.Group(),
    };
    Object.values(groups).forEach((group) => scene.add(group));

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x778c69,
      roughness: 0.96,
    });
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xb6b6b0,
      roughness: 0.82,
    });
    const paverMat = new THREE.MeshStandardMaterial({
      color: 0x8d8c86,
      roughness: 0.78,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe5e1d8,
      roughness: 0.72,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x24333a,
      roughness: 0.62,
      metalness: 0.08,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8c5537,
      roughness: 0.74,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xb8d5db,
      transparent: true,
      opacity: 0.34,
      roughness: 0.12,
      transmission: 0.25,
      depthWrite: false,
    });
    const brickMat = new THREE.MeshStandardMaterial({
      color: 0x873f2c,
      roughness: 0.9,
    });

    addBox(groups.site, "Участок 20×30 м", 0, 0, 20, 30, 0.16, -0.16, groundMat);
    addBox(groups.hardscape, "Передний бетонный двор", 0, 0, 17, 5.89, 0.08, 0, concreteMat);
    addBox(groups.hardscape, "Правая дорожка 1,20 м", 15.8, 5.05, 17, 20.2, 0.09, 0, paverMat);
    addBox(groups.hardscape, "Поперечная дорожка 1,20 м", 4, 20.2, 17, 21.4, 0.09, 0, paverMat);
    addBox(groups.hardscape, "Дорожка к бане 1,20 м", 4, 21.4, 5.2, 25.5, 0.09, 0, paverMat);
    addBox(
      groups.hardscape,
      "Правая зелёная полоса",
      17,
      0,
      20,
      30,
      0.07,
      0,
      new THREE.MeshStandardMaterial({ color: 0x607d53, roughness: 1 }),
    );

    // Забор и дорожная линия. Передняя сторона оставлена с проёмами под ворота и калитку.
    addWall(groups.site, "Левый забор", 0, 0, 0, 30, 1.85, 0, darkMat, 0.08);
    addWall(groups.site, "Правый забор", 20, 0, 20, 30, 1.85, 0, darkMat, 0.08);
    addWall(groups.site, "Задний забор", 0, 30, 20, 30, 1.85, 0, darkMat, 0.08);
    addWall(groups.site, "Передний забор слева", 0, 0, 1.4, 0, 1.85, 0, darkMat, 0.08);
    addWall(groups.site, "Передний забор справа", 11.5, 0, 20, 0, 1.85, 0, darkMat, 0.08);
    addBox(
      groups.site,
      "Проезжая часть",
      -2,
      -6,
      22,
      -0.25,
      0.06,
      -0.04,
      new THREE.MeshStandardMaterial({ color: 0x55585b, roughness: 0.96 }),
    );

    // Первый этаж: точные внешние габариты из листов 4 и 7.
    addBox(groups.shell, "Плита первого этажа", 1.7, 5.05, 15.8, 16.51, 0.18, 0, concreteMat);
    addWall(groups.shell, "Гараж левая стена", 1.7, 5.05, 1.7, 16.51, 3.4, 0.18, wallMat, 0.22);
    addWall(groups.shell, "Гараж задняя стена", 1.7, 16.51, 6.37, 16.51, 3.4, 0.18, wallMat, 0.22);
    addWall(groups.shell, "Гараж фасад левый", 1.7, 5.05, 2.49, 5.05, 3.4, 0.18, wallMat, 0.22);
    addWall(groups.shell, "Гараж фасад правый", 6.1, 5.05, 6.37, 5.05, 3.4, 0.18, wallMat, 0.22);
    addBox(groups.shell, "Гаражные ворота 3,60×2,80", 2.49, 4.97, 6.09, 5.05, 2.8, 0.18, darkMat);

    addWall(groups.shell, "Жилая левая стена", 6.37, 5.89, 6.37, 16.51, 3.4, 0.18, wallMat, 0.22);
    addWall(groups.shell, "Жилая правая стена", 15.8, 5.89, 15.8, 16.51, 3.4, 0.18, wallMat, 0.22);
    addWall(groups.shell, "Жилая задняя стена", 6.37, 16.51, 15.8, 16.51, 3.4, 0.18, wallMat, 0.22);
    addWall(groups.shell, "Фасад до входа", 6.37, 5.89, 10.3, 5.89, 3.4, 0.18, wallMat, 0.22);
    addWall(groups.shell, "Фасад после входа", 11.3, 5.89, 15.8, 5.89, 3.4, 0.18, wallMat, 0.22);

    const doors: Record<string, THREE.Object3D> = {};
    const makeDoor = (
      id: string,
      x: number,
      y: number,
      z: number,
      width: number,
      height: number,
      rotationY = 0,
    ) => {
      const pivot = new THREE.Object3D();
      pivot.name = id;
      pivot.position.set(x - width / 2, y, z);
      pivot.rotation.y = rotationY;
      pivot.userData.target = 0;
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.07),
        woodMat,
      );
      door.position.set(width / 2, height / 2, 0);
      door.castShadow = true;
      pivot.add(door);
      groups.shell.add(pivot);
      doors[id] = pivot;
      return pivot;
    };
    const makeSideDoor = (
      id: string,
      x: number,
      y: number,
      z: number,
      width: number,
      height: number,
    ) => {
      const pivot = new THREE.Object3D();
      pivot.name = id;
      pivot.position.set(x, y, z - width / 2);
      pivot.rotation.y = -Math.PI / 2;
      pivot.userData.target = 0;
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.07),
        woodMat,
      );
      door.position.set(width / 2, height / 2, 0);
      door.castShadow = true;
      pivot.add(door);
      groups.shell.add(pivot);
      doors[id] = pivot;
      return pivot;
    };
    makeDoor("front-door", 10.8, 0.18, 5.77, 1, 2.3);

    // Внутренние перегородки первого этажа — по плану АР-7, без скрытого конструктивного статуса.
    addWall(groups.interiors, "Граница гаража", 6.37, 5.89, 6.37, 16.51, 3, 0.2, wallMat, 0.12);
    addWall(groups.interiors, "Кладовая", 1.7, 14.0, 6.37, 14.0, 3, 0.2, wallMat, 0.12);
    addWall(groups.interiors, "Спальня верх", 6.37, 9.83, 9.82, 9.83, 3, 0.2, wallMat, 0.12);
    addWall(groups.interiors, "Спальня правая", 9.82, 5.89, 9.82, 9.83, 3, 0.2, wallMat, 0.12);
    addWall(groups.interiors, "Котельная левая", 12.46, 5.89, 12.46, 9.83, 3, 0.2, wallMat, 0.12);
    addWall(groups.interiors, "Котельная верх", 12.46, 9.83, 15.8, 9.83, 3, 0.2, wallMat, 0.12);
    addWall(groups.interiors, "Лестничный блок", 9.82, 9.83, 9.82, 13.2, 3, 0.2, wallMat, 0.12);

    const stairMat = new THREE.MeshStandardMaterial({ color: 0x9b8b76, roughness: 0.85 });
    for (let i = 0; i < 12; i += 1) {
      addBox(
        groups.interiors,
        `Ступень ${i + 1}`,
        7.05 + i * 0.22,
        10.3,
        7.3 + i * 0.22,
        12.35,
        0.16 + i * 0.22,
        0.18,
        stairMat,
      );
    }

    // Второй этаж и исходная большая задняя площадка/балкон.
    addBox(groups.shell, "Плита второго этажа", 5.51, 5.89, 15.8, 16.51, 0.2, 3.4, concreteMat);
    addWall(groups.shell, "Второй этаж фасад", 5.51, 5.89, 15.8, 5.89, 3.58, 3.6, wallMat, 0.22);
    addWall(groups.shell, "Второй этаж задняя стена", 5.51, 16.51, 15.8, 16.51, 3.58, 3.6, wallMat, 0.22);
    addWall(groups.shell, "Второй этаж левая стена", 5.51, 5.89, 5.51, 16.51, 3.58, 3.6, wallMat, 0.22);
    addWall(groups.shell, "Второй этаж правая стена", 15.8, 5.89, 15.8, 16.51, 3.58, 3.6, wallMat, 0.22);
    addBox(groups.shell, "Кровля основного объёма", 5.42, 5.7, 15.9, 16.7, 0.34, 7.66, darkMat);

    addBox(groups.balcony, "Задний балкон — листы 8, 11", 1.5, 16.51, 16, 19.93, 0.2, 3.34, concreteMat);
    addWall(groups.balcony, "Ограждение заднего балкона", 1.5, 19.88, 16, 19.88, 1.1, 3.54, glassMat, 0.06);
    addWall(groups.balcony, "Ограждение балкона слева", 1.5, 16.51, 1.5, 19.93, 1.1, 3.54, glassMat, 0.06);
    addWall(groups.balcony, "Ограждение балкона справа", 16, 16.51, 16, 19.93, 1.1, 3.54, glassMat, 0.06);
    for (let x = 1.5; x <= 16.01; x += 1.45) {
      addBox(groups.balcony, "Стойка ограждения", x - 0.025, 19.84, x + 0.025, 19.92, 1.15, 3.5, darkMat);
    }

    // Общий Г-образный балкон: существующий боковой выход родителей
    // соединён с одним новым лицевым выходом детской.
    addBox(groups.balcony, "Боковая часть общего балкона — размер подтвердить обмером", 1.7, 5.05, 5.85, 16.51, 0.18, 3.31, concreteMat);
    addBox(groups.balcony, "Единая лицевая часть общего балкона 7,95×1,95 м — проект", 1.7, 3.95, 9.65, 5.9, 0.18, 3.31, concreteMat);

    const addVerticalGuardX = (name: string, x1: number, x2: number, z: number) => {
      addWall(groups.balcony, `${name}: цоколь 0,15 м`, x1, z, x2, z, 0.15, 3.43, darkMat, 0.07);
      for (let x = x1 + 0.05; x <= x2 - 0.05; x += 0.115) {
        addBox(groups.balcony, `${name}: вертикальная стойка`, x - 0.018, z - 0.025, x + 0.018, z + 0.025, 1.2, 3.43, darkMat);
      }
      addWall(groups.balcony, `${name}: поручень`, x1, z, x2, z, 0.055, 4.575, darkMat, 0.06);
    };
    const addVerticalGuardZ = (name: string, x: number, z1: number, z2: number) => {
      addWall(groups.balcony, `${name}: цоколь 0,15 м`, x, z1, x, z2, 0.15, 3.43, darkMat, 0.07);
      for (let z = z1 + 0.05; z <= z2 - 0.05; z += 0.115) {
        addBox(groups.balcony, `${name}: вертикальная стойка`, x - 0.025, z - 0.018, x + 0.025, z + 0.018, 1.2, 3.43, darkMat);
      }
      addWall(groups.balcony, `${name}: поручень`, x, z1, x, z2, 0.055, 4.575, darkMat, 0.06);
    };

    addVerticalGuardX("Лицевое безопасное ограждение", 1.7, 9.65, 3.98);
    addVerticalGuardZ("Правое ограждение лицевой части", 9.62, 3.95, 5.9);
    addVerticalGuardZ("Наружное ограждение общей Г-образной части", 1.73, 3.95, 16.51);
    addVerticalGuardX("Заднее ограждение боковой части", 1.7, 5.85, 16.48);

    makeDoor("child-balcony-door", 7.69, 3.44, 5.76, 1.6, 2.99);
    makeSideDoor("parents-side-balcony-door", 5.39, 3.44, 12.36, 1.2, 2.99);

    // Мангальная комната: оба боковых торца доходят до стены дома.
    addBox(groups.mangal, "Пол мангальной 14,10×2,66", 1.7, 16.51, 15.8, 19.17, 0.16, 0.04, paverMat);
    addBox(groups.mangal, "Кровля мангальной", 1.65, 16.46, 15.85, 19.22, 0.18, 3.2, darkMat);
    addWall(groups.mangal, "Стекло торец слева без зазора", 1.7, 16.51, 1.7, 19.17, 3.05, 0.18, glassMat, 0.07);
    addWall(groups.mangal, "Стекло торец справа без зазора", 15.8, 16.51, 15.8, 19.17, 3.05, 0.18, glassMat, 0.07);
    addWall(groups.mangal, "Фасадное стекло мангальной", 1.7, 19.17, 15.8, 19.17, 3.05, 0.18, glassMat, 0.07);
    for (const x of [1.7, 4.52, 7.34, 10.16, 12.98, 15.8]) {
      addBox(groups.mangal, "Стойка мангальной", x - 0.035, 19.12, x + 0.035, 19.2, 3.15, 0.16, darkMat);
    }
    addBox(groups.mangal, "Кирпичная рабочая линия 4,87 м", 9.45, 16.72, 14.32, 17.45, 0.9, 0.18, brickMat);
    addBox(groups.mangal, "Столешница мангальной", 9.4, 16.68, 14.37, 17.49, 0.08, 1.08, darkMat);
    addBox(groups.mangal, "Очаг", 12.55, 16.6, 13.85, 17.56, 1.25, 0.18, darkMat);
    const hood = new THREE.Mesh(
      new THREE.ConeGeometry(0.78, 1.25, 4),
      darkMat,
    );
    hood.position.set(13.2, 2.23, 17.08);
    hood.rotation.y = Math.PI / 4;
    groups.mangal.add(hood);
    addBox(groups.mangal, "Мойка", 10, 16.62, 10.85, 17.54, 0.12, 1.08, glassMat);

    // Баня и хозблок — требования заказчика, показываются как проектные.
    addBox(groups.buildings, "Баня 3×7 м", 1, 22, 4, 29, 3.1, 0.1, woodMat);
    addBox(groups.buildings, "Кровля бани", 0.9, 21.9, 4.1, 29.1, 0.2, 3.2, darkMat);
    addBox(groups.buildings, "Навес/хозблок 1×3 м", 0, 0, 1, 3, 2.45, 0.05, woodMat);
    addBox(groups.buildings, "Кровля хозблока", 0, 0, 1, 3, 0.14, 2.5, darkMat);

    // Комплектация: предметы можно выбирать и перемещать шагом 25 см.
    const furnitureItems: THREE.Object3D[] = [];
    const movableBox = (
      name: string,
      x1: number,
      z1: number,
      x2: number,
      z2: number,
      h: number,
      y: number,
      color: number,
    ) => {
      const mesh = addBox(
        groups.furniture,
        name,
        x1,
        z1,
        x2,
        z2,
        h,
        y,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.78,
          emissive: 0x000000,
        }),
      );
      mesh.userData.movable = true;
      furnitureItems.push(mesh);
      return mesh;
    };
    movableBox("Диван в кухне-гостиной", 10.6, 12.55, 13.6, 13.5, 0.72, 0.2, 0xb9a48e);
    movableBox("Кухонный остров", 10.1, 10.45, 12.5, 11.35, 0.92, 0.2, 0x5d5148);
    movableBox("Стол мангальной", 4.8, 17.45, 7.8, 18.5, 0.78, 0.2, 0x8b5f42);
    movableBox("Кровать спальни 1 этажа", 7.05, 6.55, 8.85, 8.55, 0.58, 0.2, 0xc7b8a6);

    // Растения: точное количество концепции v13.
    const hydrangeas = [
      [18.45, 4.2],
      [18.45, 8.2],
      [18.45, 12.2],
      [18.45, 16.2],
    ];
    hydrangeas.forEach(([x, z]) => makeTree(groups.planting, x, z, 1.25));
    [
      [18.45, 20],
      [18.45, 22.4],
      [18.45, 24.8],
      [18.4, 27.2],
      [18.4, 29],
    ].forEach(([x, z]) => makeTree(groups.planting, x, z, 0.9));
    [2.2, 6.2, 10.2, 14.2, 18.2, 26].forEach((z) =>
      makePlantClump(groups.planting, 17.55, z, 0xc9b980, 1.35),
    );
    for (let i = 0; i < 10; i += 1) {
      makePlantClump(groups.planting, 6.3 + i * 0.7, 19.65, 0x6e4b8b, 0.72);
    }
    for (let i = 0; i < 12; i += 1) {
      makePlantClump(groups.planting, 5.9 + i * 0.7, 20.1, 0x8c6bb0, 0.62);
    }

    // Болларды: 16 точек 3000K.
    const bollards = [
      [16.4, 6.2], [16.4, 8.7], [16.4, 11.2], [16.4, 13.7], [16.4, 16.2], [16.4, 18.7],
      [5, 20.8], [8.5, 20.8], [12, 20.8], [15.5, 20.8],
      [4.6, 22], [4.6, 23.8], [4.6, 25.6], [4.6, 27.4],
      [7, 4.4], [14.7, 4.4],
    ];
    bollards.forEach(([x, z], i) => {
      addBox(groups.lighting, `Боллард ${i + 1}`, x - 0.05, z - 0.05, x + 0.05, z + 0.05, 0.72, 0.03, darkMat);
      const lamp = new THREE.PointLight(0xffc36e, 0.35, 3.5);
      lamp.position.set(x, 0.7, z);
      groups.lighting.add(lamp);
    });

    // Концептуальные инженерные трассы — показаны отдельно и не выдаются за рабочий проект.
    const lineMaterial = (color: number) =>
      new THREE.LineBasicMaterial({ color, linewidth: 2 });
    const engineeringLine = (name: string, color: number, points: Array<[number, number, number]>) => {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        ),
        lineMaterial(color),
      );
      line.name = name;
      groups.engineering.add(line);
    };
    engineeringLine("Вода — концепция", 0x2f8ec4, [[15.2, 0.32, 2], [15.2, 0.32, 8], [13.8, 0.32, 8], [13.8, 0.32, 17]]);
    engineeringLine("Канализация — концепция", 0x7f4f31, [[14.7, 0.27, 17], [14.7, 0.27, 7], [16.8, 0.27, 3]]);
    engineeringLine("Электрика — концепция", 0xe3ad36, [[10.8, 2.65, 5.9], [10.8, 2.65, 14], [15.3, 2.65, 14]]);
    engineeringLine("Газ — только после ТУ", 0xd85a54, [[19, 0.45, 2], [16.4, 0.45, 2], [16.4, 0.45, 8.8], [15.2, 0.45, 8.8]]);

    // Размерный слой.
    addDimension(groups.dimensions, new THREE.Vector3(0, 0.4, -0.6), new THREE.Vector3(20, 0.4, -0.6), "20,00 м — ширина участка");
    addDimension(groups.dimensions, new THREE.Vector3(-0.65, 0.4, 0), new THREE.Vector3(-0.65, 0.4, 30), "30,00 м — длина участка");
    addDimension(groups.dimensions, new THREE.Vector3(1.7, 0.42, 4.45), new THREE.Vector3(15.8, 0.42, 4.45), "14,10 м — дом");
    addDimension(groups.dimensions, new THREE.Vector3(0, 0.42, 4.1), new THREE.Vector3(1.7, 0.42, 4.1), "1,70 м");
    addDimension(groups.dimensions, new THREE.Vector3(15.8, 0.42, 4.1), new THREE.Vector3(20, 0.42, 4.1), "4,20 м");
    addDimension(groups.dimensions, new THREE.Vector3(0.65, 0.42, 0), new THREE.Vector3(0.65, 0.42, 5.05), "5,05 м до гаража");
    addDimension(groups.dimensions, new THREE.Vector3(0.5, 0.5, 29.45), new THREE.Vector3(1, 0.5, 29.45), "1,00 м");
    addDimension(groups.dimensions, new THREE.Vector3(1, 0.5, 29.45), new THREE.Vector3(4, 0.5, 29.45), "3,00 м — баня");

    const selected = { current: null as THREE.Mesh | null };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const handleSelect = (event: PointerEvent) => {
      if (walk.isLocked) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(furnitureItems, false);
      if (selected.current) {
        (selected.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      }
      selected.current = hits[0]?.object as THREE.Mesh | null;
      if (selected.current) {
        (selected.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x7b432a);
        onSelection(selected.current.name);
        onStatus("Предмет выбран. Используйте стрелки справа, шаг перемещения — 25 см.");
      } else {
        onSelection("");
      }
    };
    renderer.domElement.addEventListener("pointerdown", handleSelect);

    const keyState = new Set<string>();
    const keyDown = (event: KeyboardEvent) => {
      keyState.add(event.code);
      if (event.code === "KeyE" && walk.isLocked) {
        let nearest: THREE.Object3D | null = null;
        let distance = Infinity;
        Object.values(doors).forEach((door) => {
          const d = camera.position.distanceTo(door.getWorldPosition(new THREE.Vector3()));
          if (d < distance) {
            distance = d;
            nearest = door;
          }
        });
        if (nearest && distance < 2.6) {
          const targetDoor = nearest as THREE.Object3D;
          targetDoor.userData.target = targetDoor.userData.target ? 0 : -Math.PI / 2;
          onStatus("Дверь переключена.");
        }
      }
    };
    const keyUp = (event: KeyboardEvent) => keyState.delete(event.code);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    const applyPreset = (name: string) => {
      walk.unlock();
      orbit.enabled = true;
      const presets: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
        overview: { position: [28, 24, 35], target: [10, 2.2, 15] },
        plan: { position: [10, 43, 15], target: [10, 0, 15] },
        front: { position: [10, 6.5, -16], target: [9.5, 3.2, 9] },
        rear: { position: [10, 7.5, 42], target: [9, 3, 16] },
        right: { position: [34, 7, 14], target: [10, 3, 14] },
        left: { position: [-16, 7, 14], target: [9, 3, 14] },
        mangal: { position: [8.5, 2.1, 23.5], target: [9.2, 1.35, 17.2] },
        balcony: { position: [-11, 7.4, -4], target: [5.5, 4.25, 8.7] },
      };
      const preset = presets[name] ?? presets.overview;
      camera.position.set(...preset.position);
      orbit.target.set(...preset.target);
      orbit.update();
    };

    const applyStage = (stage: number) => {
      groups.engineering.visible = stage === 1 || stage === 2 || stage === 6;
      groups.interiors.visible = stage >= 2;
      groups.furniture.visible = stage >= 4;
      groups.mangal.visible = stage >= 4;
      groups.buildings.visible = stage >= 5;
      groups.hardscape.visible = stage >= 5;
      groups.planting.visible = stage >= 5;
      groups.lighting.visible = stage >= 5;
      groups.balcony.visible = stage >= 2;
      groups.dimensions.visible = true;
    };

    controller.current = {
      preset: applyPreset,
      setStage: applyStage,
      setLayer: (layer, visible) => {
        if (groups[layer]) groups[layer].visible = visible;
      },
      enterWalk: () => {
        orbit.enabled = false;
        camera.position.set(10, 1.72, 2.2);
        camera.lookAt(10, 1.72, 8);
        walk.lock();
      },
      exitWalk: () => {
        walk.unlock();
        applyPreset("overview");
      },
      toggleDoor: (id) => {
        const door = doors[id];
        if (!door) return;
        door.userData.target = door.userData.target ? 0 : -Math.PI / 2;
      },
      moveSelected: (dx, dz) => {
        if (!selected.current) {
          onStatus("Сначала щёлкните по дивану, столу, острову или кровати.");
          return;
        }
        selected.current.position.x += dx;
        selected.current.position.z += dz;
        onStatus(`${selected.current.name}: перемещено на ${Math.abs(dx || dz).toFixed(2)} м.`);
      },
    };

    applyStage(6);
    applyPreset("overview");

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.04);
      Object.values(doors).forEach((door) => {
        door.rotation.y = THREE.MathUtils.lerp(
          door.rotation.y,
          door.userData.target ?? 0,
          Math.min(1, dt * 7),
        );
      });
      if (walk.isLocked) {
        const speed = 4.2 * dt;
        if (keyState.has("KeyW") || keyState.has("ArrowUp")) walk.moveForward(speed);
        if (keyState.has("KeyS") || keyState.has("ArrowDown")) walk.moveForward(-speed);
        if (keyState.has("KeyA") || keyState.has("ArrowLeft")) walk.moveRight(-speed);
        if (keyState.has("KeyD") || keyState.has("ArrowRight")) walk.moveRight(speed);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, 0.35, 19.65);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -4.8, 29.65);
        camera.position.y = 1.72;
      } else {
        orbit.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      orbit.dispose();
      walk.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handleSelect);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [onSelection, onStatus]);

  return <div className="scene-canvas" ref={mountRef} aria-label="Интерактивная трёхмерная модель дома и участка" />;
});

function StatusPill({ value }: { value: unknown }) {
  const text = String(value || "не задан");
  const lowered = text.toLowerCase();
  const kind =
    lowered.includes("pass") || lowered.includes("провер")
      ? "ok"
      : lowered.includes("block") || lowered.includes("нуж")
        ? "danger"
        : "warn";
  return <span className={`status-pill ${kind}`}>{text}</span>;
}

function DataTable({
  rows,
  columns,
  empty,
}: {
  rows: DataRow[];
  columns: Array<{ key: string; label: string; price?: boolean; status?: boolean }>;
  empty: string;
}) {
  if (!rows.length) return <div className="empty-card">{empty}</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.ID || "row"}-${index}`}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.status ? (
                    <StatusPill value={row[column.key]} />
                  ) : column.price ? (
                    currency(row[column.key])
                  ) : (
                    String(row[column.key] ?? "—")
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DimaProjectApp() {
  const [section, setSection] = useState<Section>("overview");
  const [stage, setStage] = useState(6);
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState(
    "Модель открыта в обзорном режиме. Все размеры указаны в метрах.",
  );
  const [showDimensions, setShowDimensions] = useState(true);
  const [showEngineering, setShowEngineering] = useState(true);
  const [showPlants, setShowPlants] = useState(true);
  const [data, setData] = useState<ProcurementData | null>(null);
  const [budgetFilter, setBudgetFilter] = useState("");
  const sceneRef = useRef<SceneController>(null);

  useEffect(() => {
    fetch("/data/procurement.json")
      .then((response) => response.json())
      .then(setData)
      .catch(() =>
        setStatus("Таблица цен не загрузилась. Откройте Excel из раздела «Источники»."),
      );
  }, []);

  const filteredEstimate = useMemo(() => {
    const rows = data?.estimate.rows ?? [];
    const q = budgetFilter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, budgetFilter]);

  const switchSection = (id: Section) => {
    setSection(id);
    if (id === "plans") sceneRef.current?.preset("plan");
    if (id === "walk") sceneRef.current?.preset("overview");
    if (id === "overview") sceneRef.current?.preset("overview");
  };

  const changeStage = (next: number) => {
    setStage(next);
    sceneRef.current?.setStage(next);
    setStatus(`Показан этап: ${stageNames[next]}.`);
  };

  const toggleLayer = (
    layer: string,
    next: boolean,
    setter: (value: boolean) => void,
  ) => {
    setter(next);
    sceneRef.current?.setLayer(layer, next);
  };

  return (
    <main className="app-shell">
      <a className="skip-link" href="#main-content">
        Перейти к содержанию
      </a>

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">ДО</span>
          <div>
            <strong>Дима · Облагораживание</strong>
            <small>Интерактивный проект дома и участка · редакция v14</small>
          </div>
        </div>
        <div className="top-actions">
          <span className="source-badge">Основа: архитектурный PDF · 18 листов</span>
          <a className="button ghost" href="/downloads/official-architecture.pdf" target="_blank">
            Открыть оригинал
          </a>
        </div>
      </header>

      <aside className="sidebar" aria-label="Разделы проекта">
        <div className="site-stamp">
          <span>СТАВРОПОЛЬ</span>
          <strong>20 × 30 м</strong>
          <small>ул. Владимира Калмыкова</small>
        </div>
        <nav>
          {sections.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? "nav-item active" : "nav-item"}
              onClick={() => switchSection(item.id)}
            >
              <span>{item.mark}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">Статус точности</span>
          <strong>Документная модель</strong>
          <p>
            Геометрия из листов АР. Новые решения выделены отдельно и не подменяют
            рабочие расчёты.
          </p>
        </div>
      </aside>

      <section id="main-content" className="content">
        <div className="project-hero">
          <div>
            <span className="eyebrow">Жилой дом · участок 600 м²</span>
            <h1>Дом, который можно понять до начала работ</h1>
            <p>
              Одна наглядная система связывает официальный план, трёхмерную прогулку,
              размеры, этапы ремонта, растения, оборудование и цены.
            </p>
          </div>
          <div className="hero-metrics">
            <div><span>Дом</span><strong>14,10 × 11,46 м</strong></div>
            <div><span>Этажность</span><strong>2 + подвал</strong></div>
            <div><span>Площадь участка</span><strong>600 м²</strong></div>
            <div><span>Частичная комплектация</span><strong>{currency(data?.meta.partial_selected_sum_rub ?? 575852)}</strong></div>
          </div>
        </div>

        <div className="viewer-card">
          <div className="viewer-toolbar" aria-label="Управление моделью">
            <div className="preset-group">
              {[
                ["overview", "Общий"],
                ["plan", "Сверху"],
                ["front", "Фасад"],
                ["rear", "Задний двор"],
                ["mangal", "Мангальная"],
                ["balcony", "Балкон"],
              ].map(([id, label]) => (
                <button key={id} onClick={() => sceneRef.current?.preset(id)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="layer-group">
              <label>
                <input
                  type="checkbox"
                  checked={showDimensions}
                  onChange={(event) =>
                    toggleLayer("dimensions", event.target.checked, setShowDimensions)
                  }
                />
                Размеры
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showEngineering}
                  onChange={(event) =>
                    toggleLayer("engineering", event.target.checked, setShowEngineering)
                  }
                />
                Сети
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showPlants}
                  onChange={(event) =>
                    toggleLayer("planting", event.target.checked, setShowPlants)
                  }
                />
                Растения
              </label>
            </div>
          </div>
          <div className="viewer-stage">
            <ProjectScene
              ref={sceneRef}
              onSelection={setSelected}
              onStatus={setStatus}
            />
            <div className="viewer-callout">
              <span>1 единица = 1 метр</span>
              <strong>Модель по листам АР-4, 7–14</strong>
            </div>
            <div className="north-mark" aria-label="Север">С</div>
          </div>
          <div className="viewer-status" aria-live="polite">
            <span>{status}</span>
            <span className={selected ? "selection live" : "selection"}>
              {selected || "Предмет не выбран"}
            </span>
          </div>
        </div>

        {section === "overview" && (
          <section className="section-stack">
            <div className="section-heading">
              <span className="eyebrow">01 · Сводка</span>
              <h2>Что подтверждено документом</h2>
              <p>Каждое число ниже имеет конкретный лист-источник.</p>
            </div>
            <div className="fact-grid">
              {verifiedFacts.map(([label, value, source]) => (
                <article className="fact-card" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{source}</small>
                </article>
              ))}
            </div>
            <div className="split-panel">
              <article className="editorial-card">
                <span className="eyebrow">Исходный стиль</span>
                <h3>Спокойная современная архитектура</h3>
                <p>
                  Светлая штукатурка, графитовые порталы, термодерево и высокое
                  остекление. Новая отделка сохраняет характер исходного проекта.
                </p>
                <img src="/plans/render-front.png" alt="Исходная визуализация главного фасада из архитектурного проекта" />
              </article>
              <article className="editorial-card">
                <span className="eyebrow">Задний двор</span>
                <h3>Балкон и мангальная не потеряны</h3>
                <p>
                  Большая задняя площадка второго этажа восстановлена по листам 8,
                  11 и 18. Остеклённая мангальная замыкается на стену дома обоими
                  торцами.
                </p>
                <img src="/plans/render-rear.png" alt="Исходная визуализация заднего фасада и террасы" />
              </article>
            </div>
            <div className="section-heading compact">
              <span className="eyebrow">Контроль Cinema 4D v14</span>
              <h2>Один общий балкон, два разных выхода</h2>
              <p>
                На лицевом фасаде гараж остаётся слева, высокое остекление — справа.
                Новая дверь выполнена только вместо одного окна детской. Второй выход
                находится сбоку и относится к спальне родителей.
              </p>
            </div>
            <div className="plan-grid">
              {[
                {
                  image: "/renders/01-front-elevation-v14.png",
                  source: "Контроль ориентации",
                  title: "Лицевой фасад без зеркального отражения",
                  detail: "Гараж слева; высокая двухсветная витражная часть справа; второе верхнее лицевое окно сохранено.",
                },
                {
                  image: "/renders/02-front-common-balcony-v14.png",
                  source: "Новый выход детской",
                  title: "Лицевая часть общего балкона",
                  detail: "Только окно шириной 1,60 м заменено на балконную дверь. Изменение требует обследования и расчёта.",
                },
                {
                  image: "/renders/03-common-balcony-two-exits-v14.png",
                  source: "Проверка маршрута",
                  title: "Боковой выход родителей связан с выходом детской",
                  detail: "Лицевая плита проходит над гаражом до двери детской и широко перекрывается с боковой плитой. Внутреннего ограждения и перепада в углу нет; габарит боковой части подтверждается исполнительным обмером.",
                },
              ].map((render) => (
                <a className="plan-card" href={render.image} target="_blank" key={render.image}>
                  <div className="plan-image">
                    <img src={render.image} alt={render.title} />
                  </div>
                  <div>
                    <span>{render.source}</span>
                    <h3>{render.title}</h3>
                    <p>{render.detail}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {section === "plans" && (
          <section className="section-stack">
            <div className="section-heading">
              <span className="eyebrow">02 · Официальная основа</span>
              <h2>Чертежи можно открыть крупно</h2>
              <p>
                Изображения показаны без перерисовки — это страницы исходного PDF.
                Нажмите на лист для просмотра в полном размере.
              </p>
            </div>
            <div className="plan-grid">
              {planSheets.map((sheet) => (
                <a className="plan-card" href={sheet.image} target="_blank" key={sheet.image}>
                  <div className="plan-image">
                    <img src={sheet.image} alt={sheet.title} />
                  </div>
                  <div>
                    <span>{sheet.source}</span>
                    <h3>{sheet.title}</h3>
                    <p>{sheet.detail}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="verified-list">
              <div className="section-heading compact">
                <span className="eyebrow">Размерная ведомость</span>
                <h2>Подтверждено и предложено — отдельно</h2>
              </div>
              <div className="dimension-table">
                <div className="dimension-head">
                  <span>Объект</span><span>Размер</span><span>Основание</span>
                </div>
                {verifiedFacts.map(([name, size, source]) => (
                  <div key={name}><strong>{name}</strong><span>{size}</span><small>{source}</small></div>
                ))}
                {proposedFacts.map(([name, size, note]) => (
                  <div className="proposed-row" key={name}><strong>{name}</strong><span>{size}</span><small>{note}</small></div>
                ))}
              </div>
            </div>
          </section>
        )}

        {section === "walk" && (
          <section className="section-stack">
            <div className="section-heading">
              <span className="eyebrow">03 · Интерактив</span>
              <h2>Прогулка и проверка расстановки</h2>
              <p>
                Войдите на участок, откройте двери и перемещайте разрешённую мебель
                шагом 25 см. Это рабочая проверка масштаба, а не видеоролик.
              </p>
            </div>
            <div className="control-grid">
              <article className="control-card primary">
                <span className="control-number">WASD</span>
                <h3>Свободная прогулка</h3>
                <p>Мышь — смотреть, E — ближайшая дверь, Esc — выйти.</p>
                <button className="button solid" onClick={() => sceneRef.current?.enterWalk()}>
                  Начать прогулку
                </button>
                <button className="button text" onClick={() => sceneRef.current?.exitWalk()}>
                  Вернуться к обзору
                </button>
              </article>
              <article className="control-card">
                <span className="control-number">ДВЕРИ</span>
                <h3>Проверка открывания</h3>
                <button className="button ghost dark" onClick={() => sceneRef.current?.toggleDoor("front-door")}>
                  Входная дверь
                </button>
                <button className="button ghost dark" onClick={() => sceneRef.current?.toggleDoor("parents-side-balcony-door")}>
                  Балкон: существующая боковая дверь родителей
                </button>
                <button className="button ghost dark" onClick={() => sceneRef.current?.toggleDoor("child-balcony-door")}>
                  Балкон: новая лицевая дверь детской
                </button>
              </article>
              <article className="control-card">
                <span className="control-number">0,25 м</span>
                <h3>Передвинуть предмет</h3>
                <p>{selected || "Сначала щёлкните по мебели в модели."}</p>
                <div className="move-pad" aria-label="Перемещение выбранного предмета">
                  <button onClick={() => sceneRef.current?.moveSelected(0, -0.25)}>↑</button>
                  <button onClick={() => sceneRef.current?.moveSelected(-0.25, 0)}>←</button>
                  <button onClick={() => sceneRef.current?.moveSelected(0.25, 0)}>→</button>
                  <button onClick={() => sceneRef.current?.moveSelected(0, 0.25)}>↓</button>
                </div>
              </article>
            </div>
          </section>
        )}

        {section === "engineering" && (
          <section className="section-stack">
            <div className="section-heading">
              <span className="eyebrow">04 · Инженерия</span>
              <h2>Сети показаны как координационная концепция</h2>
              <p>
                Цветные линии помогают увидеть взаимное расположение, но не являются
                рабочим проектом без ТУ, расчётов и исполнительных обмеров.
              </p>
            </div>
            <div className="system-grid">
              {[
                ["Вода", "#2f8ec4", "Точки кухни, санузлов, котельной и мангальной. Нужны давление и источник."],
                ["Канализация", "#7f4f31", "Самотёчные участки рассчитываются по отметкам и точке выпуска."],
                ["Электрика", "#e3ad36", "Группы, щит, заземление и мощности — после задания на оборудование."],
                ["Газ", "#d85a54", "Только по техническим условиям и отдельному согласованному проекту."],
                ["Отопление", "#b84b3a", "Мощность котла и контуры — после теплотехнического расчёта."],
                ["Вентиляция", "#6a7993", "Отдельно кухня, санузлы, котельная и дымоудаление мангальной."],
              ].map(([name, color, text]) => (
                <article className="system-card" key={name}>
                  <i style={{ backgroundColor: color }} />
                  <h3>{name}</h3>
                  <p>{text}</p>
                  <StatusPill value={name === "Газ" ? "BLOCKED: нужны ТУ" : "Координационная схема"} />
                </article>
              ))}
            </div>
            <div className="warning-panel">
              <strong>Мангальная зона</strong>
              <p>
                Бытовая кухонная вытяжка не заменяет дымосборник мангала. Нужны
                тепловой расчёт, негорючие узлы, самостоятельный дымоход, приток
                воздуха и обслуживание.
              </p>
            </div>
          </section>
        )}

        {section === "planting" && (
          <section className="section-stack">
            <div className="section-heading">
              <span className="eyebrow">05 · Озеленение</span>
              <h2>Меньше деревьев, больше цветов и кустарников</h2>
              <p>
                Концепция содержит 37 растений: четыре гортензии, три спиреи, два
                дёрена, шесть мискантусов, десять шалфеев и двенадцать лаванд.
              </p>
            </div>
            <DataTable
              rows={data?.planting.rows ?? []}
              empty="Загружается посадочная ведомость…"
              columns={[
                { key: "Растение / сорт", label: "Растение" },
                { key: "Кол-во", label: "Кол-во" },
                { key: "Взрослая высота, м", label: "Высота" },
                { key: "Шаг посадки, м", label: "Шаг" },
                { key: "Зона", label: "Где посадить" },
                { key: "Статус", label: "Статус", status: true },
              ]}
            />
            <div className="lighting-scheme">
              <div>
                <span className="eyebrow">Освещение участка</span>
                <h3>16 боллардов · 3000 K</h3>
                <p>
                  Шесть вдоль правого маршрута, четыре на поперечной дорожке, четыре
                  к бане и два у парадной зоны.
                </p>
              </div>
              <div className="light-legend">
                <span><i />Маршруты</span>
                <span><i />Входы</span>
                <span><i />Мангальная</span>
                <span><i />Фасад</span>
              </div>
            </div>
          </section>
        )}

        {section === "stages" && (
          <section className="section-stack">
            <div className="section-heading">
              <span className="eyebrow">06 · Очерёдность</span>
              <h2>Посмотрите объект на каждом этапе</h2>
              <p>
                Ползунок управляет слоями трёхмерной модели. Работы идут от
                обследования коробки к инженерии, отделке, мебели и участку.
              </p>
            </div>
            <div className="stage-controller">
              <div className="stage-current">
                <span>{String(stage + 1).padStart(2, "0")}</span>
                <div>
                  <small>Сейчас показано</small>
                  <strong>{stageNames[stage]}</strong>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                value={stage}
                onChange={(event) => changeStage(Number(event.target.value))}
                aria-label="Этап реализации"
              />
              <div className="stage-labels">
                {stageNames.map((name, index) => (
                  <button
                    key={name}
                    className={index === stage ? "active" : ""}
                    onClick={() => changeStage(index)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <DataTable
              rows={data?.stages.rows ?? []}
              empty="Загружается календарь этапов…"
              columns={[
                { key: "Этап", label: "Этап" },
                { key: "Работы", label: "Что делаем" },
                { key: "Кто отвечает", label: "Ответственный" },
                { key: "Статус", label: "Статус", status: true },
                { key: "Контроль", label: "Контроль результата" },
              ]}
            />
          </section>
        )}

        {section === "budget" && (
          <section className="section-stack">
            <div className="section-heading">
              <span className="eyebrow">07 · Стоимость</span>
              <h2>Цены, товары и подрядчики — с датой и источником</h2>
              <p>
                Частичная сумма включает только позиции с заданным количеством.
                Строительные объёмы не выдумываются до обмеров.
              </p>
            </div>
            <div className="budget-summary">
              <article><span>Позиции с ценой</span><strong>{data?.meta.priced_positions ?? 29}</strong></article>
              <article><span>Нужна цена или КП</span><strong>{data?.meta.missing_price_or_quote ?? 13}</strong></article>
              <article className="accent"><span>Частичная комплектация</span><strong>{currency(data?.meta.partial_selected_sum_rub ?? 575852)}</strong></article>
            </div>
            <div className="search-row">
              <label>
                Найти позицию
                <input
                  type="search"
                  value={budgetFilter}
                  onChange={(event) => setBudgetFilter(event.target.value)}
                  placeholder="Например: кухня, потолок, сантехника"
                />
              </label>
              <a className="button solid" href="/downloads/estimate-procurement-v13.xlsx">
                Скачать полную таблицу Excel
              </a>
            </div>
            <DataTable
              rows={filteredEstimate}
              empty="По вашему запросу позиции не найдены."
              columns={[
                { key: "Раздел", label: "Раздел" },
                { key: "Позиция", label: "Товар или работа" },
                { key: "Цена, ₽", label: "Цена", price: true },
                { key: "Стоимость, ₽", label: "Сумма", price: true },
                { key: "Статус цены", label: "Статус", status: true },
                { key: "Источник", label: "Источник" },
              ]}
            />
            <div className="section-heading compact">
              <span className="eyebrow">Подрядчики</span>
              <h2>Кандидаты, а не назначенные исполнители</h2>
            </div>
            <DataTable
              rows={data?.contractors.rows ?? []}
              empty="Загружается реестр кандидатов…"
              columns={[
                { key: "Специализация", label: "Специализация" },
                { key: "Исполнитель", label: "Кандидат" },
                { key: "Цена/КП", label: "Цена или КП" },
                { key: "Статус", label: "Статус", status: true },
                { key: "Контрольный вопрос", label: "Что проверить" },
              ]}
            />
          </section>
        )}

        {section === "sources" && (
          <section className="section-stack">
            <div className="section-heading">
              <span className="eyebrow">08 · Проверяемость</span>
              <h2>Откуда взято каждое решение</h2>
              <p>
                Официальный PDF имеет приоритет над старыми Blender/FBX-моделями и
                ранними генеративными изображениями.
              </p>
            </div>
            <div className="source-grid">
              <a className="source-card primary-source" href="/downloads/official-architecture.pdf" target="_blank">
                <span>ГЛАВНЫЙ ИСТОЧНИК</span>
                <h3>Архитектурные решения — 18 листов</h3>
                <p>Планы, фасады, разрез, посадка, адрес и кадастровый номер.</p>
                <strong>Открыть PDF →</strong>
              </a>
              <a className="source-card" href="/downloads/estimate-procurement-v13.xlsx">
                <span>ТАБЛИЦА</span>
                <h3>Смета и комплектация v13</h3>
                <p>Цены, техника, растения, подрядчики и статусы проверки.</p>
                <strong>Скачать Excel →</strong>
              </a>
              <a className="source-card" href="/plans/mangal-abutment-control.png" target="_blank">
                <span>КОНТРОЛЬНЫЙ КАДР</span>
                <h3>Примыкание мангальной</h3>
                <p>Боковой торец доходит до стены дома без видимого зазора.</p>
                <strong>Открыть кадр →</strong>
              </a>
            </div>
            <div className="risk-register">
              <div className="section-heading compact">
                <span className="eyebrow">Что ещё нельзя выдавать за рабочий проект</span>
                <h2>Открытые инженерные вопросы</h2>
              </div>
              {[
                ["Топосъёмка и отметки", "Посадка из PDF подтверждена, но высоты и фактическая граница требуют геодезии."],
                ["Исполнительный обмер коробки", "В PDF прямо указано возможное отличие фактических размеров до 12 см."],
                ["Два выхода на общий Г-образный балкон", "Боковой выход родителей указан заказчиком как существующий, но противоречит отметке подоконника в PDF — нужен обмер. Новый проём выполняется только из детской вместо одного лицевого окна; второе окно остаётся."],
                ["Газ и котельная", "Нужны технические условия, теплопотери, дымоход и согласованный проект."],
                ["Дренаж", "Уклоны и аварийный путь воды назначаются только по отметкам участка и дороги."],
                ["Итоговая смета", "Нужны обмерные объёмы и минимум три коммерческих предложения на крупные разделы."],
              ].map(([title, text]) => (
                <article key={title}>
                  <span>ТРЕБУЕТ ПРОВЕРКИ</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer>
          <div>
            <strong>Дима · Облагораживание</strong>
            <span>Интерактивная документная модель · редакция v14 · 30.07.2026</span>
          </div>
          <p>
            Наглядный координационный проект. Опасные строительные и инженерные
            решения выполняются профильными специалистами после обследования.
          </p>
        </footer>
      </section>
    </main>
  );
}
