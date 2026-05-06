const root = document.documentElement;
const body = document.body;
const modeToggle = document.querySelector("[data-mode-toggle]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const menuLinks = [...menuPanel.querySelectorAll("a")];
const hero = document.querySelector(".hero");
const galleryGrid = document.querySelector("[data-gallery-grid]");
const performanceGrid = document.querySelector("[data-performance-grid]");
const photoLightbox = document.querySelector("[data-photo-lightbox]");
const photoPreview = document.querySelector("[data-photo-preview]");
const photoClose = document.querySelector("[data-photo-close]");
const photoPrev = document.querySelector("[data-photo-prev]");
const photoNext = document.querySelector("[data-photo-next]");
const photoCount = document.querySelector("[data-photo-count]");
let mediaManifest = window.MORAKI_MEDIA || { gallery: [], performances: [] };
let photoButtons = [];
let currentPhotoIndex = 0;

const savedContrast = localStorage.getItem("moraki-contrast");
if (savedContrast === "dark") {
  root.dataset.contrast = "dark";
}

const titleFromPath = (src) => {
  const fileName = src.split("/").pop() || "Media";
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([0-9])/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
};

const videoTypeFromPath = (src) => {
  const extension = src.split(".").pop().toLowerCase();
  const types = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    ogv: "video/ogg",
  };
  return types[extension] || "";
};

const renderGallery = () => {
  if (!galleryGrid) return;

  galleryGrid.innerHTML = "";
  mediaManifest.gallery.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = index === 0 ? "photo-card photo-card--wide" : "photo-card";
    button.type = "button";
    button.dataset.photo = item.src;
    button.dataset.photoIndex = String(index);
    button.setAttribute("aria-label", `Open ${item.alt || titleFromPath(item.src)}`);

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.alt || `${titleFromPath(item.src)} of Alejandra Mantinan`;
    image.loading = index === 0 ? "eager" : "lazy";

    button.append(image);
    galleryGrid.append(button);
  });
};

const renderPerformances = () => {
  if (!performanceGrid) return;

  performanceGrid.innerHTML = "";
  mediaManifest.performances.forEach((item) => {
    const card = document.createElement("article");
    card.className = "video-card performance-card";

    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;

    const source = document.createElement("source");
    source.src = item.src;
    source.type = item.type || videoTypeFromPath(item.src);
    video.append(source);

    const label = document.createElement("span");
    label.textContent = item.title || titleFromPath(item.src);

    card.append(video, label);
    performanceGrid.append(card);
  });
};

renderGallery();
renderPerformances();

const setMenu = (open) => {
  const isOpen = menuPanel.classList.contains("is-open");
  if (open === isOpen && !menuPanel.classList.contains("is-closing")) return;

  if (open) {
    body.classList.add("menu-open");
    menuPanel.classList.remove("is-closing");
    menuToggle.classList.add("is-open");
    menuPanel.classList.add("is-open");
  } else {
    menuToggle.classList.remove("is-open");
    menuPanel.classList.remove("is-open");
    menuPanel.classList.add("is-closing");
    window.setTimeout(() => {
      menuPanel.classList.remove("is-closing");
      if (!photoLightbox.classList.contains("is-open")) {
        body.classList.remove("menu-open");
      }
    }, 650);
  }

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};

modeToggle.addEventListener("click", () => {
  const nextMode = root.dataset.contrast === "dark" ? "light" : "dark";
  if (nextMode === "dark") {
    root.dataset.contrast = "dark";
  } else {
    root.removeAttribute("data-contrast");
  }
  localStorage.setItem("moraki-contrast", nextMode);
});

menuToggle.addEventListener("click", () => {
  setMenu(!menuPanel.classList.contains("is-open"));
});

menuLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

const updateNavSocials = () => {
  const heroExit = hero.offsetTop + hero.offsetHeight - 90;
  body.classList.toggle("past-hero", window.scrollY >= heroExit);
};

updateNavSocials();
window.addEventListener("scroll", updateNavSocials, { passive: true });
window.addEventListener("resize", updateNavSocials);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
    closePhoto();
  }

  if (!photoLightbox.classList.contains("is-open")) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showRelativePhoto(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    showRelativePhoto(1);
  }
});

const showPhoto = (index) => {
  if (!photoButtons.length) return;

  currentPhotoIndex = (index + photoButtons.length) % photoButtons.length;
  const button = photoButtons[currentPhotoIndex];
  const image = button.querySelector("img");
  photoPreview.src = button.dataset.photo;
  photoPreview.alt = image.alt;
  photoCount.textContent = `${currentPhotoIndex + 1} / ${photoButtons.length}`;
};

const showRelativePhoto = (step) => {
  showPhoto(currentPhotoIndex + step);
};

const openPhoto = (button) => {
  const index = Number(button.dataset.photoIndex || 0);
  showPhoto(index);
  photoLightbox.classList.add("is-open");
  photoLightbox.setAttribute("aria-hidden", "false");
  body.classList.add("menu-open");
  photoClose.focus();
};

function closePhoto() {
  photoLightbox.classList.remove("is-open");
  photoLightbox.setAttribute("aria-hidden", "true");
  photoPreview.removeAttribute("src");
  photoPreview.alt = "";
  photoCount.textContent = "";
  if (!menuPanel.classList.contains("is-open")) {
    body.classList.remove("menu-open");
  }
}

const bindPhotoButtons = () => {
  photoButtons = [...document.querySelectorAll("[data-photo]")];
  photoButtons.forEach((button) => {
    button.addEventListener("click", () => openPhoto(button));
  });
};

const normalizeManifest = (manifest) => ({
  gallery: Array.isArray(manifest?.gallery) ? manifest.gallery : [],
  performances: Array.isArray(manifest?.performances) ? manifest.performances : [],
});

const parseManifestScript = (text) => {
  const match = text.match(/window\.MORAKI_MEDIA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

const updateRenderedMedia = (nextManifest) => {
  const nextMediaManifest = normalizeManifest(nextManifest);
  if (JSON.stringify(nextMediaManifest) === JSON.stringify(mediaManifest)) return;

  mediaManifest = nextMediaManifest;
  renderGallery();
  renderPerformances();
  bindPhotoButtons();
};

const refreshMediaManifest = async () => {
  if (!/^https?:$/.test(window.location.protocol)) return;

  try {
    const response = await fetch(`media-manifest.js?updated=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;

    const nextManifest = parseManifestScript(await response.text());
    if (nextManifest) {
      updateRenderedMedia(nextManifest);
    }
  } catch {
    // Local file previews cannot fetch adjacent files; the script tag still handles the initial render.
  }
};

bindPhotoButtons();

if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) {
  window.addEventListener("focus", refreshMediaManifest);
  window.setInterval(refreshMediaManifest, 5000);
}

photoClose.addEventListener("click", closePhoto);
photoPrev.addEventListener("click", () => showRelativePhoto(-1));
photoNext.addEventListener("click", () => showRelativePhoto(1));

photoLightbox.addEventListener("click", (event) => {
  if (event.target === photoLightbox) {
    closePhoto();
  }
});
