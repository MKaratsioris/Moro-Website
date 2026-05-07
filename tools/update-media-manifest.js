const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const videoExtensions = new Set([".mp4", ".m4v", ".mov", ".webm", ".ogv"]);

const videoTypes = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
};

const videoRank = {
  ".mp4": 0,
  ".webm": 1,
  ".m4v": 2,
  ".mov": 3,
  ".ogv": 4,
};

const toWebPath = (absolutePath) => path.relative(root, absolutePath).split(path.sep).join("/");

const titleFromFile = (fileName) =>
  path
    .basename(fileName, path.extname(fileName))
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([0-9])/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

const readFolder = (folder, extensions) => {
  const absoluteFolder = path.join(root, folder);
  if (!fs.existsSync(absoluteFolder)) return [];

  return fs
    .readdirSync(absoluteFolder, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => extensions.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => {
      const titleCompare = titleFromFile(a.name).localeCompare(titleFromFile(b.name), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return titleCompare || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    })
    .map((entry) => path.join(absoluteFolder, entry.name));
};

const convertPerformanceVideos = () => {
  const folder = path.join(root, "video", "performances");
  if (!fs.existsSync(folder)) return;

  fs.readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => path.extname(entry.name).toLowerCase() === ".mov")
    .forEach((entry) => {
      const source = path.join(folder, entry.name);
      const output = path.join(folder, `${path.basename(entry.name, path.extname(entry.name))}.mp4`);
      if (fs.existsSync(output)) return;

      console.log(`Converting ${entry.name} to ${path.basename(output)}...`);
      const result = spawnSync(
        "ffmpeg",
        [
          "-y",
          "-i",
          source,
          "-vf",
          "scale=1280:-2",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "27",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          output,
        ],
        { stdio: "inherit" }
      );

      if (result.error) {
        console.warn(`Could not run ffmpeg: ${result.error.message}`);
      } else if (result.status !== 0) {
        throw new Error(`ffmpeg failed while converting ${entry.name}.`);
      }
    });
};

convertPerformanceVideos();

const gallery = readFolder("gallery", imageExtensions).map((absolutePath) => ({
  src: toWebPath(absolutePath),
  alt: `${titleFromFile(absolutePath)} - Alejandra Mantinan`,
}));

const preferWebVideos = (files) => {
  const byName = new Map();
  files.forEach((file) => {
    const key = path.basename(file, path.extname(file)).toLowerCase();
    const current = byName.get(key);
    const currentRank = current ? videoRank[path.extname(current).toLowerCase()] ?? 99 : 99;
    const nextRank = videoRank[path.extname(file).toLowerCase()] ?? 99;
    if (!current || nextRank < currentRank) {
      byName.set(key, file);
    }
  });
  return [...byName.values()].sort((a, b) => {
    const titleCompare = titleFromFile(a).localeCompare(titleFromFile(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return titleCompare || path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true, sensitivity: "base" });
  });
};

const performances = preferWebVideos(readFolder(path.join("video", "performances"), videoExtensions)).map((absolutePath) => {
  const extension = path.extname(absolutePath).toLowerCase();
  return {
    src: toWebPath(absolutePath),
    title: titleFromFile(absolutePath),
    type: videoTypes[extension] || "",
  };
});

const output = `window.MORAKI_MEDIA = ${JSON.stringify({ gallery, performances }, null, 2)};\n`;
fs.writeFileSync(path.join(root, "media-manifest.js"), output, "utf8");

console.log(`Wrote media-manifest.js with ${gallery.length} gallery item(s) and ${performances.length} performance item(s).`);
