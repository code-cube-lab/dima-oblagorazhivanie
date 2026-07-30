"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type ProjectLayer =
  | "house"
  | "interiors"
  | "changes"
  | "site"
  | "fence"
  | "plants";
export type ProjectView =
  | "front"
  | "rear"
  | "balcony"
  | "mangal"
  | "bath"
  | "top";
export type LightingMode = "day" | "evening" | "night";
export type MovementKey = "forward" | "backward" | "left" | "right";

export type ProjectViewerV17Api = {
  setView: (view: ProjectView) => void;
  setLayer: (key: ProjectLayer, visible: boolean) => void;
  setLighting: (mode: LightingMode) => void;
  setCutaway: (enabled: boolean) => void;
  focusRoom: (cameraToken: string) => void;
  startFirstPerson: () => void;
  startThirdPerson: () => void;
  stopWalk: () => void;
  setMove: (key: MovementKey, active: boolean) => void;
  reset: () => void;
};

const layerTokens: Record<ProjectLayer, string[]> = {
  house: ["02_ДОМ", "02_HOUSE"],
  interiors: ["03_ИНТЕРЬЕР", "03_INTERIOR"],
  changes: ["04_ИЗМЕНЕНИ", "04_CHANGE"],
  site: ["05_УЧАСТОК", "05_SITE"],
  fence: ["06_ЗАБОР", "06_FENCE"],
  plants: ["07_ОЗЕЛЕН", "07_PLANT"],
};

const viewCameras: Record<ProjectView, string> = {
  front: "CAM_05_",
  rear: "CAM_02_",
  balcony: "CAM_20_",
  mangal: "CAM_09_",
  bath: "CAM_10_",
  top: "CAM_12_",
};

const keyCodes: Record<MovementKey, string[]> = {
  forward: ["KeyW", "ArrowUp"],
  backward: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
};

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}

function setMaterialEmissive(
  material: THREE.Material,
  color: THREE.ColorRepresentation,
  intensity: number,
) {
  if (material instanceof THREE.MeshStandardMaterial) {
    material.emissive.set(color);
    material.emissiveIntensity = intensity;
    material.needsUpdate = true;
  }
}

function makeAvatar() {
  const avatar = new THREE.Group();
  avatar.name = "WEB_PLAYER_1_75M";

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.8, 6, 12),
    new THREE.MeshStandardMaterial({
      color: "#c36943",
      roughness: 0.72,
      metalness: 0.02,
    }),
  );
  body.position.y = 0.88;
  body.castShadow = true;
  avatar.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 20, 14),
    new THREE.MeshStandardMaterial({ color: "#d7aa87", roughness: 0.8 }),
  );
  head.position.y = 1.66;
  head.castShadow = true;
  avatar.add(head);

  const direction = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.3, 12),
    new THREE.MeshStandardMaterial({ color: "#143943", roughness: 0.6 }),
  );
  direction.rotation.x = Math.PI / 2;
  direction.position.set(0, 1.12, -0.32);
  avatar.add(direction);
  avatar.visible = false;
  return avatar;
}

function addWebPlanting(bounds: THREE.Box3) {
  const group = new THREE.Group();
  group.name = "07_ОЗЕЛЕНЕНИЕ_WEB__ВИДИМЫЕ_КУСТАРНИКИ_И_ЦВЕТЫ";
  const shrubMaterials = [
    new THREE.MeshStandardMaterial({ color: "#456846", roughness: 0.98 }),
    new THREE.MeshStandardMaterial({ color: "#587b4b", roughness: 0.98 }),
    new THREE.MeshStandardMaterial({ color: "#6f8b57", roughness: 0.98 }),
  ];
  const flowerMaterials = [
    new THREE.MeshStandardMaterial({ color: "#d6b0d2", roughness: 0.86 }),
    new THREE.MeshStandardMaterial({ color: "#ddd2a7", roughness: 0.86 }),
    new THREE.MeshStandardMaterial({ color: "#b997c8", roughness: 0.86 }),
  ];

  const x = bounds.max.x - Math.min(1.6, (bounds.max.x - bounds.min.x) * 0.08);
  const usableDepth = Math.max(8, bounds.max.z - bounds.min.z - 5);
  for (let index = 0; index < 9; index += 1) {
    const shrub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.58 + (index % 3) * 0.12, 2),
      shrubMaterials[index % shrubMaterials.length],
    );
    shrub.name = `WEB_КУСТАРНИК_${String(index + 1).padStart(2, "0")}`;
    shrub.position.set(
      x + Math.sin(index * 1.7) * 0.28,
      0.55,
      bounds.min.z + 2.5 + (usableDepth * index) / 8,
    );
    shrub.scale.y = 0.86 + (index % 2) * 0.2;
    shrub.castShadow = true;
    shrub.receiveShadow = true;
    group.add(shrub);
  }

  for (let index = 0; index < 28; index += 1) {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.09 + (index % 3) * 0.025, 12, 8),
      flowerMaterials[index % flowerMaterials.length],
    );
    flower.name = `WEB_ЦВЕТНИК_${String(index + 1).padStart(2, "0")}`;
    flower.position.set(
      x - 0.55 + (index % 4) * 0.23,
      0.16 + (index % 2) * 0.05,
      bounds.min.z + 1.6 + Math.floor(index / 4) * 0.55,
    );
    flower.castShadow = true;
    group.add(flower);
  }
  return group;
}

export const ProjectViewerV17 = forwardRef<
  ProjectViewerV17Api,
  {
    assetUrl: (path: string) => string;
    onStatus: (status: string) => void;
    onSelection: (selection: string) => void;
    onModeChange: (mode: string) => void;
  }
>(function ProjectViewerV17(
  { assetUrl, onStatus, onSelection, onModeChange },
  ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ProjectViewerV17Api | null>(null);

  useImperativeHandle(ref, () => ({
    setView: (view) => apiRef.current?.setView(view),
    setLayer: (key, visible) => apiRef.current?.setLayer(key, visible),
    setLighting: (mode) => apiRef.current?.setLighting(mode),
    setCutaway: (enabled) => apiRef.current?.setCutaway(enabled),
    focusRoom: (cameraToken) => apiRef.current?.focusRoom(cameraToken),
    startFirstPerson: () => apiRef.current?.startFirstPerson(),
    startThirdPerson: () => apiRef.current?.startThirdPerson(),
    stopWalk: () => apiRef.current?.stopWalk(),
    setMove: (key, active) => apiRef.current?.setMove(key, active),
    reset: () => apiRef.current?.reset(),
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#b8ced4");
    scene.fog = new THREE.Fog("#b8ced4", 42, 105);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.04, 280);
    camera.position.set(0, 7, 28);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.48;

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.075;
    orbit.target.set(0, 2.4, 0);
    orbit.maxPolarAngle = Math.PI * 0.495;
    orbit.minDistance = 1.2;
    orbit.maxDistance = 90;

    const firstPerson = new PointerLockControls(camera, renderer.domElement);
    const keys = new Set<string>();
    let navigationMode: "orbit" | "first" | "third" = "orbit";
    let lightingMode: LightingMode = "day";
    let cutawayEnabled = false;

    const hemisphere = new THREE.HemisphereLight("#dcecf2", "#514a3c", 0.95);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight("#fff0d2", 1.65);
    sun.position.set(22, 34, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 110;
    scene.add(sun);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: "#7e9273",
      roughness: 1,
    });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      groundMaterial,
    );
    ground.name = "WEB_GROUND";
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.035;
    ground.receiveShadow = true;
    scene.add(ground);

    const modelRoot = new THREE.Group();
    modelRoot.name = "MODEL_ROOT_REAL_SCALE";
    scene.add(modelRoot);
    const avatar = makeAvatar();
    scene.add(avatar);

    const loader = new GLTFLoader();
    const pointerRay = new THREE.Raycaster();
    const collisionRay = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const collisionMeshes: THREE.Mesh[] = [];
    const floorMeshes: THREE.Mesh[] = [ground];
    const practicalLights: THREE.PointLight[] = [];
    const fixtureMaterials = new Set<THREE.Material>();
    let loadedModel: THREE.Object3D | null = null;
    let enhancedPlants: THREE.Group | null = null;
    let modelBounds = new THREE.Box3(
      new THREE.Vector3(-15, 0, -20),
      new THREE.Vector3(15, 10, 20),
    );
    let disposed = false;

    const setMode = (mode: typeof navigationMode) => {
      navigationMode = mode;
      onModeChange(
        mode === "third"
          ? "От третьего лица"
          : mode === "first"
            ? "От первого лица"
            : "Обзор",
      );
    };

    const stopWalk = () => {
      if (firstPerson.isLocked) firstPerson.unlock();
      avatar.visible = false;
      orbit.enabled = true;
      orbit.minDistance = 1.2;
      orbit.maxDistance = 90;
      setMode("orbit");
      keys.clear();
    };

    const applyCameraNode = (token: string) => {
      if (!loadedModel) return false;
      const node = loadedModel.getObjectByProperty("name", token) ??
        loadedModel.children.find((item) => item.name.startsWith(token));
      const targetNode =
        node ??
        (() => {
          let found: THREE.Object3D | null = null;
          loadedModel?.traverse((object) => {
            if (!found && object.name.startsWith(token)) found = object;
          });
          return found;
        })();
      if (!targetNode) return false;
      stopWalk();
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      targetNode.getWorldPosition(position);
      targetNode.getWorldQuaternion(quaternion);
      camera.position.copy(position);
      camera.quaternion.copy(quaternion);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
      orbit.target.copy(position).addScaledVector(forward, 5);
      orbit.update();
      return true;
    };

    const applyView = (view: ProjectView) => {
      if (applyCameraNode(viewCameras[view])) {
        onStatus(`Камера «${view}» взята из точной сцены Cinema 4D.`);
        return;
      }
      stopWalk();
      const center = modelBounds.getCenter(new THREE.Vector3());
      const size = modelBounds.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.z) * 0.72;
      const positions: Record<ProjectView, THREE.Vector3> = {
        front: new THREE.Vector3(center.x, center.y + size.y * 0.28, modelBounds.max.z + radius),
        rear: new THREE.Vector3(center.x, center.y + size.y * 0.3, modelBounds.min.z - radius),
        balcony: new THREE.Vector3(modelBounds.min.x - radius * 0.6, center.y + size.y * 0.45, modelBounds.max.z + radius * 0.35),
        mangal: new THREE.Vector3(center.x, center.y + size.y * 0.28, modelBounds.min.z - radius * 0.55),
        bath: new THREE.Vector3(modelBounds.min.x - radius * 0.6, center.y + size.y * 0.45, modelBounds.min.z - radius * 0.45),
        top: new THREE.Vector3(center.x, modelBounds.max.y + Math.max(size.x, size.z) * 0.85, center.z + 0.01),
      };
      camera.position.copy(positions[view]);
      orbit.target.set(center.x, center.y + size.y * 0.25, center.z);
      camera.lookAt(orbit.target);
      orbit.update();
    };

    const setLayer = (key: ProjectLayer, visible: boolean) => {
      if (key === "plants" && enhancedPlants) enhancedPlants.visible = visible;
      if (!loadedModel) return;
      const tokens = layerTokens[key];
      loadedModel.traverse((object) => {
        const upperName = object.name.toUpperCase();
        if (tokens.some((token) => upperName.includes(token))) {
          object.visible = visible;
        }
      });
    };

    const setCutaway = (enabled: boolean) => {
      cutawayEnabled = enabled;
      if (!loadedModel) return;
      loadedModel.traverse((object) => {
        const name = object.name.toUpperCase();
        if (
          name.includes("КРОВЛ") ||
          name.includes("ROOF") ||
          name.includes("ПОТОЛОК")
        ) {
          object.visible = !enabled;
          object.userData.webCutaway = true;
        }
      });
      onStatus(
        enabled
          ? "Разрез включён: кровля и потолки скрыты, мебель и комнаты видны сверху."
          : "Разрез выключен: показана полная оболочка дома.",
      );
    };

    const applyLighting = (mode: LightingMode) => {
      lightingMode = mode;
      const night = mode === "night";
      const evening = mode === "evening";
      scene.background = new THREE.Color(
        night ? "#071522" : evening ? "#776f75" : "#b8ced4",
      );
      scene.fog = new THREE.Fog(
        night ? "#071522" : evening ? "#776f75" : "#b8ced4",
        night ? 26 : 42,
        night ? 78 : 105,
      );
      hemisphere.intensity = night ? 0.18 : evening ? 0.52 : 0.95;
      hemisphere.color.set(night ? "#6f86b8" : "#eaf6ff");
      sun.intensity = night ? 0.03 : evening ? 0.72 : 1.65;
      sun.color.set(evening ? "#ffc07a" : "#fff0d2");
      renderer.toneMappingExposure = night ? 0.72 : evening ? 0.78 : 0.7;
      groundMaterial.color.set(night ? "#26332b" : evening ? "#68745e" : "#7e9273");
      practicalLights.forEach((light) => {
        light.visible = night || evening;
        light.intensity = night ? 18 : evening ? 8 : 0;
      });
      fixtureMaterials.forEach((material) =>
        setMaterialEmissive(
          material,
          night || evening ? "#ffbf80" : "#4a3424",
          night ? 4.2 : evening ? 2.1 : 0.05,
        ),
      );
      onStatus(
        mode === "night"
          ? "Ночь: включены группы L01–L17, фасады, дорожки, балкон, баня и мангальная."
          : mode === "evening"
            ? "Вечер: включён тёплый архитектурный и рабочий свет."
            : "День: естественный свет, группы L01–L17 выключены.",
      );
    };

    const startFirstPerson = () => {
      avatar.visible = false;
      orbit.enabled = false;
      const center = modelBounds.getCenter(new THREE.Vector3());
      camera.position.set(center.x, 1.7, modelBounds.max.z - 2.2);
      camera.lookAt(center.x, 1.7, center.z);
      setMode("first");
      firstPerson.lock();
      onStatus("От первого лица: WASD/стрелки, мышь — взгляд, E — дверь, Esc — выход.");
    };

    const startThirdPerson = () => {
      if (firstPerson.isLocked) firstPerson.unlock();
      const center = modelBounds.getCenter(new THREE.Vector3());
      avatar.position.set(center.x, 0, modelBounds.max.z - 2.2);
      avatar.visible = true;
      camera.position.copy(avatar.position).add(new THREE.Vector3(3.6, 3.1, 5.2));
      orbit.enabled = true;
      orbit.minDistance = 3;
      orbit.maxDistance = 8;
      orbit.target.copy(avatar.position).add(new THREE.Vector3(0, 1.05, 0));
      camera.lookAt(orbit.target);
      orbit.update();
      setMode("third");
      onStatus("От третьего лица: WASD/стрелки или экранные кнопки, мышь — камера, E — дверь.");
    };

    const setMove = (key: MovementKey, active: boolean) => {
      keyCodes[key].forEach((code) => {
        if (active) keys.add(code);
        else keys.delete(code);
      });
    };

    const openDoor = (object: THREE.Object3D | null) => {
      if (!object) return false;
      const door = [object, object.parent, object.parent?.parent, object.parent?.parent?.parent].find(
        (candidate) =>
          candidate?.name
            .toUpperCase()
            .match(/ДВЕР|DOOR|BALCONY_DOOR|ОКНО_ЗАМЕНЕНО/),
      );
      if (!door) return false;
      if (typeof door.userData.closedRotationY !== "number") {
        door.userData.closedRotationY = door.rotation.y;
      }
      door.userData.open = !door.userData.open;
      door.rotation.y =
        door.userData.closedRotationY +
        (door.userData.open ? Math.PI * 0.42 : 0);
      onSelection(`${door.name}: ${door.userData.open ? "открыта" : "закрыта"}`);
      return true;
    };

    const interactFromCamera = () => {
      if (!loadedModel) return;
      pointerRay.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hits = pointerRay.intersectObject(loadedModel, true);
      const doorHit = hits.find((hit) =>
        [hit.object, hit.object.parent, hit.object.parent?.parent].some((object) =>
          object?.name.toUpperCase().match(/ДВЕР|DOOR|BALCONY_DOOR|ОКНО_ЗАМЕНЕНО/),
        ),
      );
      if (doorHit && doorHit.distance < 4) openDoor(doorHit.object);
    };

    const reset = () => {
      stopWalk();
      if (loadedModel) {
        loadedModel.traverse((object) => {
          object.visible = true;
          if (typeof object.userData.closedRotationY === "number") {
            object.rotation.y = object.userData.closedRotationY;
            object.userData.open = false;
          }
        });
      }
      if (enhancedPlants) enhancedPlants.visible = true;
      cutawayEnabled = false;
      applyLighting("day");
      applyView("front");
      onSelection("Ничего не выбрано");
    };

    apiRef.current = {
      setView: applyView,
      setLayer,
      setLighting: applyLighting,
      setCutaway,
      focusRoom: (token) => {
        if (applyCameraNode(token)) {
          onStatus("Комнатная камера взята из сцены Cinema 4D; показаны ремонт, мебель и свет.");
        } else {
          onStatus("Комнатная камера не найдена — используйте разрез и вид сверху.");
        }
      },
      startFirstPerson,
      startThirdPerson,
      stopWalk,
      setMove,
      reset,
    };

    const onKeyDown = (event: KeyboardEvent) => {
      keys.add(event.code);
      if (event.code === "KeyE") interactFromCamera();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    loader.load(
      assetUrl("/models/dima-v16.glb"),
      (gltf) => {
        if (disposed) return;
        loadedModel = gltf.scene;
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

        const rawBox = new THREE.Box3().setFromObject(loadedModel);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const rawCenter = rawBox.getCenter(new THREE.Vector3());
        let meterScale = 1;
        const horizontal = Math.max(rawSize.x, rawSize.z);
        if (horizontal > 180) meterScale = 0.01;
        else if (horizontal < 2) meterScale = 100;
        loadedModel.position.set(-rawCenter.x, -rawBox.min.y, -rawCenter.z);
        modelRoot.scale.setScalar(meterScale);
        modelRoot.add(loadedModel);
        modelRoot.updateMatrixWorld(true);
        modelBounds = new THREE.Box3().setFromObject(modelRoot);

        loadedModel.traverse((object) => {
          if (!isMesh(object)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const upperName = object.name.toUpperCase();
          if (upperName.match(/СТЕН|WALL|ЗАБОР|FENCE|ПЕРЕГОРОД/)) {
            collisionMeshes.push(object);
          }
          if (upperName.match(/ПОЛ_|FLOOR|УЧАСТОК|ДОРОЖК|БАЛКОН.*ПЛИТА/)) {
            floorMeshes.push(object);
          }
          if (upperName.match(/^L(0[1-9]|1[0-7])_/)) {
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.forEach((material) => fixtureMaterials.add(material));
          }
        });

        const lightAnchors = new Map<string, THREE.Vector3>();
        loadedModel.traverse((object) => {
          const match = object.name.toUpperCase().match(/^(L(?:0[1-9]|1[0-7]))_/);
          if (!match || lightAnchors.has(match[1])) return;
          lightAnchors.set(match[1], object.getWorldPosition(new THREE.Vector3()));
        });
        lightAnchors.forEach((position, group) => {
          const exterior = Number(group.slice(1)) >= 12;
          const light = new THREE.PointLight(
            "#ffd0a0",
            0,
            exterior ? 10 : 7,
            1.7,
          );
          light.name = `WEB_${group}_PRACTICAL`;
          light.position.copy(position);
          light.castShadow = false;
          practicalLights.push(light);
          scene.add(light);
        });

        enhancedPlants = addWebPlanting(modelBounds);
        scene.add(enhancedPlants);
        applyLighting(lightingMode);
        applyView("front");
        const meterSize = modelBounds.getSize(new THREE.Vector3());
        const scaleCheck =
          Math.max(meterSize.x, meterSize.z) >= 27 &&
          Math.max(meterSize.x, meterSize.z) <= 33 &&
          Math.min(meterSize.x, meterSize.z) >= 18 &&
          Math.min(meterSize.x, meterSize.z) <= 23;
        onStatus(
          `GLB v16 загружен: ${meterSize.x.toFixed(1)} × ${meterSize.z.toFixed(1)} × ${meterSize.y.toFixed(1)} м. ${
            scaleCheck
              ? "Проверка участка 20 × 30 м пройдена."
              : "Масштаб требует контрольного обмера участка."
          } Доступны день, ночь, разрез и два режима прогулки.`,
        );
      },
      (event) => {
        if (event.total > 0) {
          onStatus(
            `Загрузка точной модели: ${Math.round((event.loaded / event.total) * 100)}%`,
          );
        }
      },
      () =>
        onStatus(
          "Модель не загрузилась. Контрольные планы и рендеры ниже остаются доступны.",
        ),
    );

    const onPointerDown = (event: PointerEvent) => {
      if (!loadedModel || firstPerson.isLocked) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerRay.setFromCamera(pointer, camera);
      const hit = pointerRay.intersectObject(loadedModel, true)[0];
      if (!hit) return;
      onSelection(hit.object.name || hit.object.parent?.name || "Элемент модели");
      openDoor(hit.object);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    const moveVector = new THREE.Vector3();
    const forwardVector = new THREE.Vector3();
    const rightVector = new THREE.Vector3();
    const oldPosition = new THREE.Vector3();
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      if (navigationMode === "first" && firstPerson.isLocked) {
        const speed = 3.3 * delta;
        if (keys.has("KeyW") || keys.has("ArrowUp")) firstPerson.moveForward(speed);
        if (keys.has("KeyS") || keys.has("ArrowDown")) firstPerson.moveForward(-speed);
        if (keys.has("KeyA") || keys.has("ArrowLeft")) firstPerson.moveRight(-speed);
        if (keys.has("KeyD") || keys.has("ArrowRight")) firstPerson.moveRight(speed);
        camera.position.y = Math.max(1.65, Math.min(camera.position.y, modelBounds.max.y - 0.3));
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, modelBounds.min.x + 0.4, modelBounds.max.x - 0.4);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, modelBounds.min.z + 0.4, modelBounds.max.z - 0.4);
      } else if (navigationMode === "third") {
        moveVector.set(0, 0, 0);
        camera.getWorldDirection(forwardVector);
        forwardVector.y = 0;
        if (forwardVector.lengthSq() < 0.001) forwardVector.set(0, 0, -1);
        forwardVector.normalize();
        rightVector.crossVectors(forwardVector, camera.up).normalize();
        if (keys.has("KeyW") || keys.has("ArrowUp")) moveVector.add(forwardVector);
        if (keys.has("KeyS") || keys.has("ArrowDown")) moveVector.sub(forwardVector);
        if (keys.has("KeyA") || keys.has("ArrowLeft")) moveVector.sub(rightVector);
        if (keys.has("KeyD") || keys.has("ArrowRight")) moveVector.add(rightVector);
        if (moveVector.lengthSq() > 0.001) {
          moveVector.normalize();
          oldPosition.copy(avatar.position);
          const step = 2.8 * delta;
          collisionRay.set(
            avatar.position.clone().add(new THREE.Vector3(0, 1, 0)),
            moveVector,
          );
          collisionRay.far = 0.64;
          const blocked = collisionRay.intersectObjects(collisionMeshes, false).length > 0;
          if (!blocked) avatar.position.addScaledVector(moveVector, step);
          avatar.position.x = THREE.MathUtils.clamp(
            avatar.position.x,
            modelBounds.min.x + 0.45,
            modelBounds.max.x - 0.45,
          );
          avatar.position.z = THREE.MathUtils.clamp(
            avatar.position.z,
            modelBounds.min.z + 0.45,
            modelBounds.max.z - 0.45,
          );
          const downOrigin = avatar.position.clone().add(new THREE.Vector3(0, 3.5, 0));
          collisionRay.set(downOrigin, new THREE.Vector3(0, -1, 0));
          collisionRay.far = 7;
          const groundHit = collisionRay.intersectObjects(floorMeshes, false)[0];
          avatar.position.y = groundHit ? groundHit.point.y : 0;
          avatar.rotation.y = Math.atan2(moveVector.x, moveVector.z);
          const movement = avatar.position.clone().sub(oldPosition);
          camera.position.add(movement);
          orbit.target.copy(avatar.position).add(new THREE.Vector3(0, 1.05, 0));
        }
        orbit.update();
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
      firstPerson.disconnect();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.traverse((object) => {
        if (isMesh(object)) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      apiRef.current = null;
    };
  }, [assetUrl, onModeChange, onSelection, onStatus]);

  return (
    <div
      className="model-mount"
      ref={mountRef}
      aria-label="Интерактивная 3D-модель проекта с режимами дня, ночи и прогулки"
    />
  );
});
