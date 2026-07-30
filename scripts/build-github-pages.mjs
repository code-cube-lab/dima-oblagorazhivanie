import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const clientDir = path.join(projectDir, "dist", "client");
const serverEntry = path.join(projectDir, "dist", "server", "index.js");
const outputDir = path.join(projectDir, "pages-dist");
const repositoryName = "dima-oblagorazhivanie";
const basePath = `/${repositoryName}`;

if (path.dirname(outputDir) !== projectDir || path.basename(outputDir) !== "pages-dist") {
  throw new Error(`Unsafe output directory: ${outputDir}`);
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(clientDir, outputDir, { recursive: true });

const workerModule = await import(pathToFileURL(serverEntry).href);
const worker = workerModule.default ?? workerModule;
const executionContext = {
  waitUntil(promise) {
    Promise.resolve(promise).catch(() => {});
  },
  passThroughOnException() {},
};
const response = await worker.fetch(
  new Request("http://localhost/"),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  executionContext,
);

if (!response.ok) {
  throw new Error(`SSR snapshot failed with HTTP ${response.status}`);
}

const publicRoots = ["assets", "plans", "renders", "downloads", "data"];

function applyBasePath(source) {
  let result = source;
  for (const root of publicRoots) {
    result = result.replaceAll(`/${root}/`, `${basePath}/${root}/`);
  }
  result = result.replaceAll("/favicon.svg", `${basePath}/favicon.svg`);
  result = result.replaceAll("return`/`+e", `return\`${basePath}/\`+e`);
  return result;
}

let html = applyBasePath(await response.text());
html = html.replace(
  "<head>",
  `<head><base href="${basePath}/"><meta name="theme-color" content="#111817"/>`,
);

await writeFile(path.join(outputDir, "index.html"), html, "utf8");
await writeFile(path.join(outputDir, "404.html"), html, "utf8");
await writeFile(path.join(outputDir, ".nojekyll"), "", "utf8");

const assetDir = path.join(outputDir, "assets");
const assetNames = await readdir(assetDir);

for (const assetName of assetNames) {
  if (!assetName.endsWith(".js") && !assetName.endsWith(".css")) continue;
  const assetPath = path.join(assetDir, assetName);
  const original = await readFile(assetPath, "utf8");
  const patched = applyBasePath(original);
  if (patched !== original) {
    await writeFile(assetPath, patched, "utf8");
  }
}

const readme = `# Дима · Облагораживание

Публичная интерактивная версия проекта дома и участка.

Сайт: https://code-cube-lab.github.io/${repositoryName}/

Проект включает:

- точную GLB-модель из Cinema 4D;
- планы участка и обоих этажей;
- общий соединённый балкон с двумя выходами;
- баню 3 × 7 м, хозблок, дорожки, растения и освещение;
- реалистичные кадры, размеры, этапы и диапазон стоимости;
- исходный архитектурный PDF.

Материалы предназначены для предпроектного согласования. Рабочие решения по конструкциям, газу, электрике и инженерным сетям требуют проверки профильными специалистами.
`;

await writeFile(path.join(outputDir, "README.md"), readme, "utf8");

console.log(
  JSON.stringify(
    {
      outputDir,
      basePath,
      htmlBytes: Buffer.byteLength(html),
      sourceStatus: response.status,
    },
    null,
    2,
  ),
);
