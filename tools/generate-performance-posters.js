const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const performanceFolder = path.join(root, "video", "performances");
const posterFolder = path.join(root, "assets", "performance-posters");
const framePage = "tools/performance-poster-frame.html";
const videoExtensions = new Set([".mp4", ".m4v", ".mov", ".webm", ".ogv"]);

const chromeCandidates = process.platform === "win32"
  ? [
      path.join(process.env.PROGRAMFILES || "", "Google", "Chrome", "Application", "chrome.exe"),
      path.join(process.env["PROGRAMFILES(X86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
      path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    ]
  : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];

const chromePath = chromeCandidates.find((candidate) => candidate && fs.existsSync(candidate));
if (!chromePath) {
  throw new Error("Google Chrome was not found. Install Chrome or update chromeCandidates in this script.");
}

fs.mkdirSync(posterFolder, { recursive: true });
const temporaryFolder = fs.mkdtempSync(path.join(os.tmpdir(), "moraki-posters-"));

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".ogv": "video/ogg",
  ".webm": "video/webm",
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://127.0.0.1");
  const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
  const absolutePath = path.resolve(root, relativePath);

  if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end();
    return;
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    response.writeHead(404).end();
    return;
  }

  const fileSize = fs.statSync(absolutePath).size;
  const range = request.headers.range;
  const headers = {
    "Content-Type": contentTypes[path.extname(absolutePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
    "Accept-Ranges": "bytes",
  };

  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Math.min(Number(match[2]), fileSize - 1) : fileSize - 1;
    if (!match || start > end || start >= fileSize) {
      response.writeHead(416, { "Content-Range": `bytes */${fileSize}` }).end();
      return;
    }

    response.writeHead(206, {
      ...headers,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Length": end - start + 1,
    });
    fs.createReadStream(absolutePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, "Content-Length": fileSize });
  fs.createReadStream(absolutePath).pipe(response);
});

const runChrome = (videoPath, outputPath, index, port) =>
  new Promise((resolve, reject) => {
    const videoWebPath = path.relative(root, videoPath).split(path.sep).join("/");
    const query = new URLSearchParams({ src: `/${videoWebPath}` });
    const url = `http://127.0.0.1:${port}/${framePage}?${query}`;
    const child = spawn(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--autoplay-policy=no-user-gesture-required",
        "--window-size=640,360",
        "--force-device-scale-factor=1",
        "--virtual-time-budget=10000",
        `--user-data-dir=${path.join(temporaryFolder, `profile-${index}`)}`,
        `--screenshot=${outputPath}`,
        url,
      ],
      { stdio: "ignore", windowsHide: true }
    );

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve();
      } else {
        reject(new Error(`Chrome could not generate ${path.basename(outputPath)} (exit code ${code}).`));
      }
    });
  });

const runPool = async (items, worker, concurrency = 3) => {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
};

server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  const videos = fs
    .readdirSync(performanceFolder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && videoExtensions.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
    .map((entry) => path.join(performanceFolder, entry.name));

  try {
    await runPool(videos, async (videoPath, index) => {
      const posterName = `${path.basename(videoPath, path.extname(videoPath))}.png`;
      const outputPath = path.join(posterFolder, posterName);
      const candidatePath = path.join(temporaryFolder, `poster-${index}.png`);
      process.stdout.write(`Generating ${posterName}... `);
      await runChrome(videoPath, candidatePath, index, port);
      const candidateSize = fs.statSync(candidatePath).size;
      if (candidateSize < 8 * 1024) {
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size >= 8 * 1024) {
          console.log("kept existing poster (Chrome could not decode this video format)");
          return;
        }
        console.log("skipped (Chrome could not decode this video format)");
        return;
      }
      fs.copyFileSync(candidatePath, outputPath);
      console.log("done");
    });
    console.log(`Generated ${videos.length} performance poster(s).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
    fs.rmSync(temporaryFolder, { recursive: true, force: true });
  }
});
