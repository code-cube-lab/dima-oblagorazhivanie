import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const publicDir = path.join(projectDir, "pages-dist");
const reportDir = path.join(projectDir, "qa", "v18");
const basePath = "/dima-oblagorazhivanie";
const externalBase = process.env.DIMA_QA_URL?.replace(/\/$/, "");
const routes = ["", "kitchen", "rooms", "model", "engineering", "catalog", "estimate", "documents"];
const playwrightEntry =
  "C:\\Users\\GIGA\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright\\index.mjs";

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".csv", "text/csv; charset=utf-8"],
]);

await mkdir(reportDir, { recursive: true });
let server = null;
let rootUrl = externalBase;

if (!rootUrl) {
  server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (requestUrl.pathname !== basePath && !requestUrl.pathname.startsWith(`${basePath}/`)) {
        response.writeHead(404).end("Not found");
        return;
      }
      let relative = decodeURIComponent(requestUrl.pathname.slice(basePath.length)).replace(/^[/\\]+/, "");
      if (!relative) relative = "index.html";
      let filePath = path.resolve(publicDir, relative);
      if (!filePath.startsWith(publicDir)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      let fileStat = await stat(filePath).catch(() => null);
      if (fileStat?.isDirectory()) {
        filePath = path.join(filePath, "index.html");
        fileStat = await stat(filePath).catch(() => null);
      }
      if (!fileStat?.isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }
      const content = await readFile(filePath);
      response.writeHead(200, {
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
  if (!address || typeof address === "string") throw new Error("Preview server did not start");
  rootUrl = `http://127.0.0.1:${address.port}${basePath}`;
}

const { chromium } = await import(pathToFileURL(playwrightEntry).href);
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

const results = [];
try {
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const consoleErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("requestfailed", (request) =>
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? "unknown" }),
    );
    const url = `${rootUrl}/${route}${route ? "/" : ""}`;
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    const bodyText = await page.locator("body").innerText();
    const images = await page.locator("img").evaluateAll((items) =>
      items.map((image) => ({
        src: image.getAttribute("src"),
        complete: image.complete,
        width: image.naturalWidth,
      })),
    );
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    if (route === "" || route === "kitchen") {
      await page.screenshot({
        path: path.join(reportDir, externalBase ? `${route || "home"}-public.png` : `${route || "home"}-local.png`),
        fullPage: true,
      });
    }
    results.push({
      route: route || "home",
      url,
      status: response?.status() ?? 0,
      title: await page.title(),
      noWalkthrough: !/WASD|От третьего лица|От первого лица/.test(bodyText),
      expectedContent:
        route === "kitchen"
          ? bodyText.includes("5530 мм") &&
            bodyText.includes("5200 мм") &&
            bodyText.includes("Посудомоечная машина")
          : bodyText.includes("Дима · Облагораживание"),
      imagesLoad: images.every((image) => image.complete && image.width > 0),
      brokenImages: images.filter((image) => !image.complete || image.width === 0),
      noHorizontalScroll: metrics.scrollWidth <= metrics.clientWidth + 1,
      failedRequests,
      consoleErrors,
    });
    await page.close();
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const mobileResponse = await mobile.goto(`${rootUrl}/kitchen/`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  });
  const mobileMetrics = await mobile.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  await mobile.screenshot({
    path: path.join(reportDir, externalBase ? "kitchen-mobile-public.png" : "kitchen-mobile-local.png"),
    fullPage: false,
  });
  results.push({
    route: "kitchen-mobile",
    url: `${rootUrl}/kitchen/`,
    status: mobileResponse?.status() ?? 0,
    noHorizontalScroll: mobileMetrics.scrollWidth <= mobileMetrics.clientWidth + 1,
  });
  await mobile.close();
} finally {
  await browser.close();
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const checks = results.flatMap((result) =>
  Object.entries(result)
    .filter(([key, value]) => ["status", "noWalkthrough", "expectedContent", "imagesLoad", "noHorizontalScroll"].includes(key))
    .map(([key, value]) => ({
      route: result.route,
      check: key,
      pass: key === "status" ? value === 200 : value === true,
    })),
);
const report = {
  checkedAt: new Date().toISOString(),
  external: Boolean(externalBase),
  passed: checks.every((check) => check.pass) &&
    results.every((result) => !result.failedRequests?.length && !result.consoleErrors?.length),
  checks,
  results,
};
await writeFile(path.join(reportDir, externalBase ? "public-browser-qa.json" : "local-browser-qa.json"), JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
