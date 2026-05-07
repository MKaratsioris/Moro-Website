const root = document.documentElement;
const body = document.body;
const modeToggle = document.querySelector("[data-mode-toggle]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const menuLinks = [...menuPanel.querySelectorAll("a")];
const hero = document.querySelector(".hero");
const heroVideoLayers = [...document.querySelectorAll("[data-hero-video-layer]")];
const initialHeroVideoSrc = heroVideoLayers[0]?.getAttribute("src") || "";
const siteMain = document.querySelector(".site-main");
const sectionPath = document.querySelector("[data-section-path]");
const sectionPathLine = document.querySelector("[data-section-path-line]");
const sectionSteps = [...document.querySelectorAll("[data-section-step]")];
const galleryGrid = document.querySelector("[data-gallery-grid]");
const galleryPrev = document.querySelector("[data-gallery-prev]");
const galleryNext = document.querySelector("[data-gallery-next]");
const galleryStatus = document.querySelector("[data-gallery-status]");
const performanceGrid = document.querySelector("[data-performance-grid]");
const performancePrev = document.querySelector("[data-performance-prev]");
const performanceNext = document.querySelector("[data-performance-next]");
const performancePagination = document.querySelector("[data-performance-pagination]");
const photoLightbox = document.querySelector("[data-photo-lightbox]");
const photoPreview = document.querySelector("[data-photo-preview]");
const photoClose = document.querySelector("[data-photo-close]");
const photoPrev = document.querySelector("[data-photo-prev]");
const photoNext = document.querySelector("[data-photo-next]");
const photoCount = document.querySelector("[data-photo-count]");
let mediaManifest = window.MORAKI_MEDIA || { hero: [], gallery: [], performances: [] };
let currentHeroVideoIndex = 0;
let activeHeroVideoLayerIndex = 0;
let heroVideoTransitioning = false;
let photoButtons = [];
let currentPhotoIndex = 0;
let currentGalleryPage = 0;
let currentPerformanceIndex = 0;
const galleryPreviewCount = 5;
const heroCrossfadeMs = 1400;
const heroCrossfadeSeconds = heroCrossfadeMs / 1000;

const savedContrast = localStorage.getItem("moraki-contrast");
if (savedContrast === "dark") {
  root.dataset.contrast = "dark";
}

const updateSectionPath = () => {
  if (!siteMain || !sectionPath || !sectionPathLine || sectionSteps.length < 2) return;

  const mainRect = siteMain.getBoundingClientRect();
  const markerPoints = sectionSteps.map((step) => {
    const rect = step.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - mainRect.left;
    const y = rect.top + rect.height / 2 - mainRect.top;
    return { x, y };
  });
  const routedPoints = [markerPoints[0]];

  markerPoints.slice(1).forEach((nextPoint, index) => {
    const currentPoint = markerPoints[index];
    routedPoints.push(
      { x: currentPoint.x, y: nextPoint.y },
      nextPoint
    );
  });

  sectionPath.setAttribute("viewBox", `0 0 ${Math.round(siteMain.offsetWidth)} ${Math.round(siteMain.offsetHeight)}`);
  sectionPathLine.setAttribute("points", routedPoints.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(" "));
};

const scheduleSectionPathUpdate = () => {
  window.requestAnimationFrame(updateSectionPath);
};

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

const getHeroVideos = () => {
  const manifestVideos = Array.isArray(mediaManifest.hero) ? mediaManifest.hero : [];
  if (manifestVideos.length) {
    const initialVideoIndex = manifestVideos.findIndex((video) => video.src === initialHeroVideoSrc);
    if (initialVideoIndex > 0) {
      return [
        manifestVideos[initialVideoIndex],
        ...manifestVideos.slice(0, initialVideoIndex),
        ...manifestVideos.slice(initialVideoIndex + 1),
      ];
    }

    return manifestVideos;
  }

  return initialHeroVideoSrc
    ? [{ src: initialHeroVideoSrc, title: titleFromPath(initialHeroVideoSrc), type: videoTypeFromPath(initialHeroVideoSrc) }]
    : [];
};

const setHeroVideo = (index, shouldPlay = true) => {
  if (!heroVideoLayers.length) return;

  const videos = getHeroVideos();
  if (!videos.length) return;

  currentHeroVideoIndex = (index + videos.length) % videos.length;
  activeHeroVideoLayerIndex = 0;
  heroVideoTransitioning = false;

  const activeVideo = heroVideoLayers[activeHeroVideoLayerIndex];
  prepareHeroVideoLayer(activeVideo, videos[currentHeroVideoIndex].src);
  activeVideo.loop = videos.length === 1;

  heroVideoLayers.forEach((video, layerIndex) => {
    const isActive = layerIndex === activeHeroVideoLayerIndex;
    video.classList.toggle("is-active", isActive);
    if (!isActive) video.pause();
  });

  if (shouldPlay) {
    playHeroVideoLayer(activeVideo);
  }

  preloadNextHeroVideo();
};

const getActiveHeroVideoLayer = () => heroVideoLayers[activeHeroVideoLayerIndex];

const getStandbyHeroVideoLayer = () => heroVideoLayers[(activeHeroVideoLayerIndex + 1) % heroVideoLayers.length];

const playHeroVideoLayer = (video) => {
  if (!video) return;

  const playPromise = video.play();
  if (playPromise?.catch) playPromise.catch(() => {});
};

const prepareHeroVideoLayer = (video, src) => {
  if (!video || !src) return;

  video.muted = true;
  video.loop = false;
  video.playsInline = true;
  if (video.getAttribute("src") !== src) {
    video.src = src;
    video.load();
  }

  try {
    video.currentTime = 0;
  } catch {
    // Some browsers delay seeking until video metadata is available.
  }
};

const preloadNextHeroVideo = () => {
  const videos = getHeroVideos();
  if (heroVideoLayers.length < 2 || videos.length < 2) return;

  const standbyVideo = getStandbyHeroVideoLayer();
  const nextVideo = videos[(currentHeroVideoIndex + 1) % videos.length];
  if (standbyVideo?.getAttribute("src") !== nextVideo.src) {
    standbyVideo.src = nextVideo.src;
    standbyVideo.load();
  }
};

const transitionHeroVideo = (nextIndex) => {
  const videos = getHeroVideos();
  if (heroVideoTransitioning || !videos.length) return;
  if (heroVideoLayers.length < 2 || videos.length < 2) {
    setHeroVideo(nextIndex);
    return;
  }

  heroVideoTransitioning = true;
  const nextHeroVideoIndex = (nextIndex + videos.length) % videos.length;
  const currentLayer = getActiveHeroVideoLayer();
  const nextLayerIndex = (activeHeroVideoLayerIndex + 1) % heroVideoLayers.length;
  const nextLayer = heroVideoLayers[nextLayerIndex];

  currentHeroVideoIndex = nextHeroVideoIndex;
  prepareHeroVideoLayer(nextLayer, videos[currentHeroVideoIndex].src);
  playHeroVideoLayer(nextLayer);

  nextLayer.classList.add("is-active");
  currentLayer.classList.remove("is-active");

  window.setTimeout(() => {
    currentLayer.pause();
    activeHeroVideoLayerIndex = nextLayerIndex;
    heroVideoTransitioning = false;
    preloadNextHeroVideo();
  }, heroCrossfadeMs);
};

const maybeTransitionHeroVideo = (event) => {
  const activeVideo = getActiveHeroVideoLayer();
  if (event.currentTarget !== activeVideo || heroVideoTransitioning) return;

  const videos = getHeroVideos();
  if (videos.length < 2) return;

  if (event.type === "ended") {
    transitionHeroVideo(currentHeroVideoIndex + 1);
    return;
  }

  if (
    Number.isFinite(activeVideo.duration) &&
    activeVideo.duration > heroCrossfadeSeconds &&
    activeVideo.duration - activeVideo.currentTime <= heroCrossfadeSeconds
  ) {
    transitionHeroVideo(currentHeroVideoIndex + 1);
  }
};

const initializeHeroPlaylist = () => {
  if (!heroVideoLayers.length) return;

  heroVideoLayers.forEach((video) => {
    video.muted = true;
    video.loop = false;
    video.playsInline = true;
    video.addEventListener("timeupdate", maybeTransitionHeroVideo);
    video.addEventListener("ended", maybeTransitionHeroVideo);
  });

  setHeroVideo(0, false);
  playHeroVideoLayer(getActiveHeroVideoLayer());
};

const renderGallery = () => {
  if (!galleryGrid) return;

  galleryGrid.innerHTML = "";
  const totalPages = Math.max(1, Math.ceil(mediaManifest.gallery.length / galleryPreviewCount));
  currentGalleryPage = Math.min(currentGalleryPage, totalPages - 1);
  const pageStart = currentGalleryPage * galleryPreviewCount;
  const pageItems = mediaManifest.gallery.slice(pageStart, pageStart + galleryPreviewCount);

  pageItems.forEach((item, index) => {
    const manifestIndex = pageStart + index;
    const button = document.createElement("button");
    button.className = index === 0 ? "photo-card photo-card--wide" : "photo-card";
    button.type = "button";
    button.dataset.photo = item.src;
    button.dataset.photoIndex = String(manifestIndex);
    button.setAttribute("aria-label", `Open ${item.alt || titleFromPath(item.src)}`);

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.alt || `${titleFromPath(item.src)} of Alejandra Mantinan`;
    image.loading = index === 0 ? "eager" : "lazy";

    button.append(image);
    galleryGrid.append(button);
  });

  renderGalleryPagination(totalPages);
  scheduleSectionPathUpdate();
};

function renderGalleryPagination(totalPages) {
  if (galleryPrev) {
    galleryPrev.disabled = currentGalleryPage === 0 || totalPages <= 1;
  }

  if (galleryNext) {
    galleryNext.disabled = currentGalleryPage >= totalPages - 1 || totalPages <= 1;
  }

  if (galleryStatus) {
    galleryStatus.textContent = mediaManifest.gallery.length ? `${currentGalleryPage + 1} / ${totalPages}` : "";
  }
}

const setGalleryPage = (page) => {
  const totalPages = Math.max(1, Math.ceil(mediaManifest.gallery.length / galleryPreviewCount));
  currentGalleryPage = Math.min(Math.max(page, 0), totalPages - 1);
  renderGallery();
  bindPhotoButtons();
};

function renderPerformancePagination() {
  if (!performancePagination) return;

  performancePagination.textContent = mediaManifest.performances.length
    ? `${currentPerformanceIndex + 1} / ${mediaManifest.performances.length}`
    : "";
}

function renderPerformanceControls() {
  const hasMultipleVideos = mediaManifest.performances.length > 1;

  if (performancePrev) {
    performancePrev.disabled = !hasMultipleVideos || currentPerformanceIndex === 0;
  }

  if (performanceNext) {
    performanceNext.disabled = !hasMultipleVideos || currentPerformanceIndex >= mediaManifest.performances.length - 1;
  }

  renderPerformancePagination();
}

const setPerformanceIndex = (index) => {
  if (!mediaManifest.performances.length) return;

  currentPerformanceIndex = Math.min(Math.max(index, 0), mediaManifest.performances.length - 1);
  renderPerformances();
};

const stopRenderedPerformanceVideos = () => {
  performanceGrid?.querySelectorAll("video").forEach((video) => {
    video.pause();
  });
};

const renderPerformances = () => {
  if (!performanceGrid) return;

  stopRenderedPerformanceVideos();
  performanceGrid.innerHTML = "";
  if (!mediaManifest.performances.length) {
    renderPerformanceControls();
    return;
  }

  currentPerformanceIndex = Math.min(currentPerformanceIndex, mediaManifest.performances.length - 1);
  const item = mediaManifest.performances[currentPerformanceIndex];
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

  renderPerformanceControls();
  scheduleSectionPathUpdate();
};

initializeHeroPlaylist();
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

galleryPrev?.addEventListener("click", () => setGalleryPage(currentGalleryPage - 1));
galleryNext?.addEventListener("click", () => setGalleryPage(currentGalleryPage + 1));
performancePrev?.addEventListener("click", () => setPerformanceIndex(currentPerformanceIndex - 1));
performanceNext?.addEventListener("click", () => setPerformanceIndex(currentPerformanceIndex + 1));

const updateNavSocials = () => {
  const heroExit = hero.offsetTop + hero.offsetHeight - 90;
  body.classList.toggle("past-hero", window.scrollY >= heroExit);
};

updateNavSocials();
updateSectionPath();
window.addEventListener("scroll", updateNavSocials, { passive: true });
window.addEventListener("resize", () => {
  updateNavSocials();
  scheduleSectionPathUpdate();
});
window.addEventListener("load", updateSectionPath);

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
  if (!mediaManifest.gallery.length) return;

  currentPhotoIndex = (index + mediaManifest.gallery.length) % mediaManifest.gallery.length;
  const item = mediaManifest.gallery[currentPhotoIndex];
  photoPreview.src = item.src;
  photoPreview.alt = item.alt || `${titleFromPath(item.src)} of Alejandra Mantinan`;
  photoCount.textContent = `${currentPhotoIndex + 1} / ${mediaManifest.gallery.length}`;
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
  hero: Array.isArray(manifest?.hero) ? manifest.hero : [],
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

  const heroChanged = JSON.stringify(nextMediaManifest.hero) !== JSON.stringify(mediaManifest.hero);
  mediaManifest = nextMediaManifest;
  if (heroChanged) {
    setHeroVideo(0);
  }
  renderGallery();
  renderPerformances();
  bindPhotoButtons();
  scheduleSectionPathUpdate();
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
