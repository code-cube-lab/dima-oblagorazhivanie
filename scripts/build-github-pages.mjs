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
const publicRoots = ["assets", "plans", "renders", "downloads", "data"];
const routes = ["/", "/landscape", "/bath", "/kitchen", "/rooms", "/model", "/engineering", "/sheets", "/catalog", "/estimate", "/documents"];

function applyBasePath(source) {
  let result = source;
  for (const root of publicRoots) {
    result = result.replaceAll(`/${root}/`, `${basePath}/${root}/`);
  }
  result = result.replaceAll("/favicon.svg", `${basePath}/favicon.svg`);
  for (const route of routes.filter((item) => item !== "/")) {
    result = result.replaceAll(`href="${route}/"`, `href="${basePath}${route}/"`);
  }
  result = result.replaceAll('href="/"', `href="${basePath}/"`);
  result = result.replaceAll("return`/`+e", `return\`${basePath}/\`+e`);
  return result;
}

let rootHtml = "";
const routeResults = [];
for (const route of routes) {
  const response = await worker.fetch(
    new Request(`http://localhost${route}`),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    executionContext,
  );
  if (!response.ok) {
    throw new Error(`SSR snapshot failed for ${route} with HTTP ${response.status}`);
  }
  let html = applyBasePath(await response.text());
  html = html.replace(
    "<head>",
    `<head><base href="${basePath}/"><meta name="theme-color" content="#111817"/>`,
  );
  const targetDir = route === "/" ? outputDir : path.join(outputDir, route.slice(1));
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, "index.html"), html, "utf8");
  if (route === "/") rootHtml = html;
  routeResults.push({ route, status: response.status, htmlBytes: Buffer.byteLength(html) });
}

await writeFile(path.join(outputDir, "404.html"), rootHtml, "utf8");
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

const readme = `# Дима · Облагораживание · v19

Публичная многостраничная версия проекта дома и участка.

Сайт: https://code-cube-lab.github.io/${repositoryName}/

Проект включает:

- крупные фотореалистичные рендеры без низкополигональной проходки;
- четыре новых вида благоустройства и три отдельных интерьера бани;
- лист ЛД-01 с участком 20 × 30 м и лист БН-01 с баней 3 × 7 м;
- отдельную страницу исправленной кухни с четырьмя ракурсами;
- планы участка, этажей, кухни, электрики, воды и вентиляции;
- общий соединённый балкон с двумя выходами;
- баню 3 × 7 м, хозблок, дорожки, растения и освещение;
- реальные товары-кандидаты с размерами, ценами и прямыми ссылками;
- поэтапную смету и задания подрядчикам;
- исходный архитектурный PDF.

Материалы предназначены для предпроектного согласования. Рабочие решения по конструкциям, газу, электрике и инженерным сетям требуют проверки профильными специалистами.
`;

await writeFile(path.join(outputDir, "README.md"), readme, "utf8");

console.log(
  JSON.stringify(
    {
      outputDir,
      basePath,
      routes: routeResults,
    },
    null,
    2,
  ),
);
