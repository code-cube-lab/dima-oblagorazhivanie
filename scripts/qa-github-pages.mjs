import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const publicDir = path.join(projectDir, "pages-dist");
const basePath = "/dima-oblagorazhivanie";
const externalUrl = process.env.DIMA_QA_URL;
const playwrightEntry =
  "C:\\Users\\GIGA\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright\\index.mjs";

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".glb", "model/gltf-binary"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
]);

let server = null;
let url = externalUrl;

if (!url) {
  server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (
        requestUrl.pathname !== basePath &&
        !requestUrl.pathname.startsWith(`${basePath}/`)
      ) {
        response.writeHead(404).end("Not found");
        return;
      }
      let relativePath = decodeURIComponent(requestUrl.pathname.slice(basePath.length));
      if (!relativePath || relativePath === "/") relativePath = "/index.html";
      const resolvedPath = path.resolve(publicDir, relativePath.replace(/^[/\\]+/, ""));
      if (!resolvedPath.startsWith(`${publicDir}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      let filePath = resolvedPath;
      const fileStats = await stat(filePath).catch(() => null);
      if (!fileStats?.isFile()) filePath = path.join(publicDir, "404.html");
      const content = await readFile(filePath);
      response.writeHead(filePath.endsWith("404.html") ? 404 : 200, {
        "content-type": mimeTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      response.end(content);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  if (!port) throw new Error("Preview server did not start");
  url = `http://127.0.0.1:${port}${basePath}/`;
}

const { chromium } = await import(pathToFileURL(playwrightEntry).href);
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  const failedRequests = [];
  const glbResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) =>
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? "unknown" }),
  );
  page.on("response", (response) => {
    if (response.url().endsWith(".glb")) {
      glbResponses.push({ url: response.url(), status: response.status() });
    }
  });

  const navigation = await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  await page.locator(".model-status").getByText(/GLB-модель v16 загружена/).waitFor({
    timeout: 120_000,
  });
  const bodyText = await page.locator("body").innerText();
  const images = await page.locator("img").evaluateAll((items) =>
    items.map((image) => ({
      src: image.getAttribute("src"),
      complete: image.complete,
      width: image.naturalWidth,
    })),
  );

  await page.getByRole("button", { name: "Баня", exact: true }).click();
  await page.getByRole("button", { name: "Сверху", exact: true }).click();
  const roomLayer = page.getByRole("checkbox", { name: /Комнаты и мебель/ });
  await roomLayer.uncheck();
  await roomLayer.check();

  const canvasCount = await page.locator("canvas").count();
  await page.screenshot({
    path: path.join(projectDir, externalUrl ? "github-pages-public-qa.png" : "github-pages-qa.png"),
    fullPage: true,
  });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const mobileNavigation = await mobile.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  await mobile.locator(".hero").waitFor();
  const mobileMetrics = await mobile.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  await mobile.screenshot({
    path: path.join(projectDir, externalUrl ? "github-pages-public-mobile-qa.png" : "github-pages-mobile-qa.png"),
    fullPage: false,
  });
  await mobile.close();

  const checks = {
    status200: navigation?.status() === 200,
    mobileStatus200: mobileNavigation?.status() === 200,
    title: (await page.title()) === "Дима · Дом и участок — интерактивный проект",
    exactOrientation: bodyText.includes("гараж слева, витраж справа"),
    roomsAndBath: bodyText.includes("Комнаты и мебель") && bodyText.includes("Баня 3×7 м"),
    balconyGeometry:
      bodyText.includes("7,50 м") &&
      bodyText.includes("1,80 м") &&
      bodyText.includes("два выхода"),
    interiorRenovation:
      bodyText.includes("Кухня-гостиная") &&
      bodyText.includes("Детская Дарины") &&
      bodyText.includes("Детская Ярика"),
    lightingAndBudget:
      bodyText.includes("L01–L17") &&
      bodyText.includes("27,27–50,85 млн"),
    procurementAndAvitoStatus:
      bodyText.includes("Подрядчики, мебель и техника") &&
      bodyText.includes("Авито"),
    glbLoaded: glbResponses.some((response) => response.status === 200),
    threeDimensionalViewer: canvasCount > 0,
    layerControlsWork: await roomLayer.isChecked(),
    imagesLoad: images.every((image) => image.complete && image.width > 0),
    noFailedRequests: failedRequests.length === 0,
    noConsoleErrors: consoleErrors.length === 0,
    mobileNoHorizontalScroll: mobileMetrics.scrollWidth <= mobileMetrics.clientWidth + 1,
  };

  const result = {
    url,
    checks,
    glbResponses,
    canvasCount,
    imageCount: images.length,
    brokenImages: images.filter((image) => !image.complete || image.width === 0),
    failedRequests,
    consoleErrors,
    mobileMetrics,
  };
  console.log(JSON.stringify(result, null, 2));
  if (Object.values(checks).some((value) => !value)) process.exitCode = 1;
} finally {
  await browser.close();
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
