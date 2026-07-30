"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

function asset(path: string) {
  if (typeof window === "undefined") return path;
  const base = window.location.pathname.startsWith("/dima-oblagorazhivanie")
    ? "/dima-oblagorazhivanie"
    : "";
  if (base && (path === base || path.startsWith(`${base}/`))) return path;
  return `${base}${path}`;
}

type ViewMode = "orbit" | "walk";
type SceneView = "whole" | "front" | "floor1" | "floor2" | "rear";

const viewLabels: Record<SceneView, string> = {
  whole: "Весь участок",
  front: "Главный фасад",
  floor1: "Первый этаж",
  floor2: "Второй этаж",
  rear: "Задний двор",
};

export default function C4DViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    setMode: (mode: ViewMode) => void;
    setView: (view: SceneView) => void;
    setRoofVisible: (visible: boolean) => void;
    lock: () => void;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ViewMode>("orbit");
  const [view, setView] = useState<SceneView>("whole");
  const [roofVisible, setRoofVisible] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let model: THREE.Object3D | null = null;
    let bounds = new THREE.Box3();
    let size = new THREE.Vector3(1, 1, 1);
    let center = new THREE.Vector3();
    let currentMode: ViewMode = "orbit";
    let roofIsVisible = true;
    const roofObjects: THREE.Object3D[] = [];
    const pressed = new Set<string>();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdde6e8);
    scene.fog = new THREE.FogExp2(0xdde6e8, 0.000025);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 100000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.maxPolarAngle = Math.PI * 0.495;
    orbit.screenSpacePanning = true;

    const walk = new PointerLockControls(camera, renderer.domElement);
    walk.addEventListener("lock", () => setLocked(true));
    walk.addEventListener("unlock", () => setLocked(false));

    scene.add(new THREE.HemisphereLight(0xe9f3ff, 0x5b6156, 2.1));
    const sun = new THREE.DirectionalLight(0xfff4df, 3.2);
    sun.position.set(-1200, 2200, -900);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const resize = () => {
      const width = Math.max(host.clientWidth, 320);
      const height = Math.max(host.clientHeight, 420);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const orient = (position: THREE.Vector3, target: THREE.Vector3) => {
      camera.position.copy(position);
      orbit.target.copy(target);
      orbit.update();
      camera.lookAt(target);
    };

    const setViewPosition = (next: SceneView) => {
      if (!model) return;
      const x = size.x;
      const y = size.y;
      const z = size.z;
      const ground = bounds.min.y;
      const eye = ground + Math.max(y * 0.2, 1.7);
      const target = center.clone();

      if (next === "whole") {
        orient(center.clone().add(new THREE.Vector3(x * 0.82, y * 0.95, z * 0.95)), center);
      } else if (next === "front") {
        orient(new THREE.Vector3(center.x, eye + y * 0.12, bounds.min.z - z * 0.38), new THREE.Vector3(center.x, eye, center.z));
      } else if (next === "rear") {
        orient(new THREE.Vector3(center.x, eye + y * 0.12, bounds.max.z + z * 0.38), new THREE.Vector3(center.x, eye, center.z));
      } else if (next === "floor1") {
        orient(new THREE.Vector3(center.x + x * 0.08, eye, center.z - z * 0.12), new THREE.Vector3(center.x, eye, center.z + z * 0.2));
      } else {
        const secondEye = ground + y * 0.59;
        orient(new THREE.Vector3(center.x + x * 0.08, secondEye, center.z - z * 0.12), new THREE.Vector3(center.x, secondEye, center.z + z * 0.2));
      }
    };

    const setViewerMode = (next: ViewMode) => {
      currentMode = next;
      orbit.enabled = next === "orbit";
      if (next === "walk") {
        if (model) setViewPosition(view);
      } else if (walk.isLocked) {
        walk.unlock();
      }
    };

    apiRef.current = {
      setMode: setViewerMode,
      setView: setViewPosition,
      setRoofVisible: (visible) => {
        roofIsVisible = visible;
        roofObjects.forEach((object) => { object.visible = visible; });
      },
      lock: () => {
        if (currentMode === "walk") walk.lock();
      },
    };

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      asset("/models/dima-v20-2.glb"),
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        model.traverse((object) => {
          const name = object.name.toLocaleUpperCase("ru");
          if (name.includes("КРОВЛ") || name.includes("ПОТОЛОК") || name.includes("ROOF")) {
            roofObjects.push(object);
            object.visible = roofIsVisible;
          }
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        scene.add(model);
        bounds.setFromObject(model);
        bounds.getSize(size);
        bounds.getCenter(center);
        camera.near = Math.max(Math.min(size.x, size.z) / 2000, 0.02);
        camera.far = Math.max(size.length() * 8, 1000);
        camera.updateProjectionMatrix();
        orbit.minDistance = Math.max(size.length() * 0.006, 0.2);
        orbit.maxDistance = size.length() * 2.5;
        sun.position.copy(center).add(new THREE.Vector3(-size.x, size.y * 2.2, -size.z));
        sun.shadow.camera.left = -size.x;
        sun.shadow.camera.right = size.x;
        sun.shadow.camera.top = size.z;
        sun.shadow.camera.bottom = -size.z;
        setViewPosition("whole");
        setProgress(100);
        setReady(true);
      },
      (event) => {
        if (event.total > 0) setProgress(Math.round((event.loaded / event.total) * 100));
      },
      () => {
        if (!disposed) setError("3D-модель не загрузилась. Откройте скачиваемый GLB или повторите загрузку страницы.");
      },
    );

    const onKeyDown = (event: KeyboardEvent) => pressed.add(event.code);
    const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      if (currentMode === "walk" && walk.isLocked && model) {
        const speed = Math.max(Math.max(size.x, size.z) * 0.075, 1.8);
        if (pressed.has("KeyW") || pressed.has("ArrowUp")) walk.moveForward(speed * delta);
        if (pressed.has("KeyS") || pressed.has("ArrowDown")) walk.moveForward(-speed * delta);
        if (pressed.has("KeyA") || pressed.has("ArrowLeft")) walk.moveRight(-speed * delta);
        if (pressed.has("KeyD") || pressed.has("ArrowRight")) walk.moveRight(speed * delta);
        if (pressed.has("KeyQ")) camera.position.y -= speed * 0.65 * delta;
        if (pressed.has("KeyE")) camera.position.y += speed * 0.65 * delta;
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
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      orbit.dispose();
      walk.disconnect();
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      apiRef.current = null;
    };
  }, []);

  const changeMode = (next: ViewMode) => {
    setMode(next);
    apiRef.current?.setMode(next);
  };
  const changeView = (next: SceneView) => {
    setView(next);
    apiRef.current?.setView(next);
  };

  return (
    <section className="c4d-viewer-shell">
      <div className="c4d-viewer-toolbar">
        <div>
          <span className="eyebrow">Модель Cinema 4D v20.2 · реальные габариты</span>
          <h2>Крутите дом снаружи или входите внутрь</h2>
        </div>
        <div className="c4d-mode-switch" aria-label="Режим просмотра">
          <button className={mode === "orbit" ? "active" : ""} onClick={() => changeMode("orbit")}>Вращение</button>
          <button className={mode === "walk" ? "active" : ""} onClick={() => changeMode("walk")}>Прогулка</button>
        </div>
      </div>

      <div className="c4d-viewer-frame">
        <div ref={hostRef} className="c4d-canvas" onClick={() => mode === "walk" && apiRef.current?.lock()} />
        {!ready && !error && <div className="c4d-loading"><b>{progress}%</b><span>Загружается модель 4,4 МБ</span></div>}
        {error && <div className="c4d-loading error"><b>Ошибка</b><span>{error}</span></div>}
        {ready && mode === "walk" && !locked && (
          <button className="c4d-enter" onClick={() => apiRef.current?.lock()}>
            Нажать и войти в режим прогулки
          </button>
        )}
        <div className="c4d-view-buttons">
          {(Object.keys(viewLabels) as SceneView[]).map((key) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => changeView(key)}>{viewLabels[key]}</button>
          ))}
        </div>
      </div>

      <div className="c4d-viewer-help">
        <div><strong>Вращение</strong><span>тяните мышью · колесо — масштаб · правая кнопка — сдвиг</span></div>
        <div><strong>Прогулка</strong><span>W A S D — движение · мышь — взгляд · Q/E — ниже/выше · Esc — выйти</span></div>
        <label>
          <input
            type="checkbox"
            checked={!roofVisible}
            onChange={(event) => {
              const visible = !event.target.checked;
              setRoofVisible(visible);
              apiRef.current?.setRoofVisible(visible);
            }}
          />
          скрыть кровлю и потолки
        </label>
      </div>
      <p className="c4d-viewer-disclaimer">
        Свободная навигация предназначена для согласования пространства. Коллизии и открывание дверей ещё не являются игровым функционалом; монтажные координаты берутся только с согласованных листов.
      </p>
    </section>
  );
}
