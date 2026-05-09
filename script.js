const root = document.documentElement;
const body = document.body;
const modeToggle = document.querySelector("[data-mode-toggle]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const menuLinks = [...menuPanel.querySelectorAll("a")];
const languageMenu = document.querySelector("[data-language-menu]");
const languageToggle = document.querySelector("[data-language-toggle]");
const languageOptions = [...document.querySelectorAll("[data-language-option]")];
const hero = document.querySelector(".hero");
const heroVideoLayers = [...document.querySelectorAll("[data-hero-video-layer]")];
const heroAudioToggle = document.querySelector("[data-hero-audio-toggle]");
const initialHeroVideoSrc = heroVideoLayers[0]?.getAttribute("src") || "";
const siteMain = document.querySelector(".site-main");
const sectionPath = document.querySelector("[data-section-path]");
const sectionPathLine = document.querySelector("[data-section-path-line]");
const sectionSteps = [...document.querySelectorAll("[data-section-step]")];
const aboutTabSource = document.querySelector(".about-tab-source");
const aboutTabPanelsWrap = document.querySelector(".about-tab-panels");
const aboutTabs = [...document.querySelectorAll("[data-about-tab]")];
const aboutPanels = [...document.querySelectorAll("[data-about-panel]")];
const galleryGrid = document.querySelector("[data-gallery-grid]");
const galleryPrev = document.querySelector("[data-gallery-prev]");
const galleryNext = document.querySelector("[data-gallery-next]");
const galleryStatus = document.querySelector("[data-gallery-status]");
const performanceGrid = document.querySelector("[data-performance-grid]");
const performancePrev = document.querySelector("[data-performance-prev]");
const performanceNext = document.querySelector("[data-performance-next]");
const performancePagination = document.querySelector("[data-performance-pagination]");
const scheduleList = document.querySelector(".schedule-list");
const visitorCounter = document.querySelector("[data-visitor-counter]");
const visitorCount = document.querySelector("[data-visitor-count]");
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
let heroAudioMuted = true;
let unavailableHeroVideoSources = new Set();
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

const supportedLanguages = ["es", "el", "it", "de", "fr", "ru", "tr", "sv", "da", "hi", "hu", "zh", "ja", "ar", "ko"];
const pageLanguage = supportedLanguages.includes(root.lang) ? root.lang : "en";
const labels = {
  en: {
    closeLanguageMenu: "Close language menu",
    closeMenu: "Close menu",
    heroVideoHasNoAudio: "Hero video has no audio",
    muteHeroVideo: "Mute hero video",
    openLanguageMenu: "Open language menu",
    openMedia: "Open",
    openMenu: "Open menu",
    photoAltJoin: "of Alejandra Mantinan",
    unmuteHeroVideo: "Unmute hero video",
  },
  es: {
    closeLanguageMenu: "Cerrar menú de idiomas",
    closeMenu: "Cerrar menú",
    heroVideoHasNoAudio: "El video principal no tiene audio",
    muteHeroVideo: "Silenciar video principal",
    openLanguageMenu: "Abrir menú de idiomas",
    openMedia: "Abrir",
    openMenu: "Abrir menú",
    photoAltJoin: "de Alejandra Mantiñan",
    unmuteHeroVideo: "Activar audio del video principal",
  },
  el: {
    closeLanguageMenu: "Κλείσιμο μενού γλωσσών",
    closeMenu: "Κλείσιμο μενού",
    heroVideoHasNoAudio: "Το κεντρικό βίντεο δεν έχει ήχο",
    muteHeroVideo: "Σίγαση κεντρικού βίντεο",
    openLanguageMenu: "Άνοιγμα μενού γλωσσών",
    openMedia: "Άνοιγμα",
    openMenu: "Άνοιγμα μενού",
    photoAltJoin: "της Alejandra Mantiñan",
    unmuteHeroVideo: "Ενεργοποίηση ήχου κεντρικού βίντεο",
  },
  it: {
    closeLanguageMenu: "Chiudi menu lingue",
    closeMenu: "Chiudi menu",
    heroVideoHasNoAudio: "Il video principale non ha audio",
    muteHeroVideo: "Disattiva audio del video principale",
    openLanguageMenu: "Apri menu lingue",
    openMedia: "Apri",
    openMenu: "Apri menu",
    photoAltJoin: "di Alejandra Mantiñan",
    unmuteHeroVideo: "Attiva audio del video principale",
  },
  de: {
    closeLanguageMenu: "Sprachmenü schließen",
    closeMenu: "Menü schließen",
    heroVideoHasNoAudio: "Das Hauptvideo hat keinen Ton",
    muteHeroVideo: "Hauptvideo stummschalten",
    openLanguageMenu: "Sprachmenü öffnen",
    openMedia: "Öffnen",
    openMenu: "Menü öffnen",
    photoAltJoin: "von Alejandra Mantiñan",
    unmuteHeroVideo: "Ton des Hauptvideos einschalten",
  },
  fr: {
    closeLanguageMenu: "Fermer le menu des langues",
    closeMenu: "Fermer le menu",
    heroVideoHasNoAudio: "La vidéo principale n'a pas de son",
    muteHeroVideo: "Couper le son de la vidéo principale",
    openLanguageMenu: "Ouvrir le menu des langues",
    openMedia: "Ouvrir",
    openMenu: "Ouvrir le menu",
    photoAltJoin: "d'Alejandra Mantiñan",
    unmuteHeroVideo: "Activer le son de la vidéo principale",
  },
  ru: {
    closeLanguageMenu: "Закрыть меню языков",
    closeMenu: "Закрыть меню",
    heroVideoHasNoAudio: "В главном видео нет звука",
    muteHeroVideo: "Отключить звук главного видео",
    openLanguageMenu: "Открыть меню языков",
    openMedia: "Открыть",
    openMenu: "Открыть меню",
    photoAltJoin: "Alejandra Mantiñan",
    unmuteHeroVideo: "Включить звук главного видео",
  },
  tr: {
    closeLanguageMenu: "Dil menüsünü kapat",
    closeMenu: "Menüyü kapat",
    heroVideoHasNoAudio: "Ana videoda ses yok",
    muteHeroVideo: "Ana videonun sesini kapat",
    openLanguageMenu: "Dil menüsünü aç",
    openMedia: "Aç",
    openMenu: "Menüyü aç",
    photoAltJoin: "Alejandra Mantiñan",
    unmuteHeroVideo: "Ana videonun sesini aç",
  },
  sv: {
    closeLanguageMenu: "Stäng språkmenyn",
    closeMenu: "Stäng menyn",
    heroVideoHasNoAudio: "Huvudvideon har inget ljud",
    muteHeroVideo: "Stäng av ljudet i huvudvideon",
    openLanguageMenu: "Öppna språkmenyn",
    openMedia: "Öppna",
    openMenu: "Öppna menyn",
    photoAltJoin: "av Alejandra Mantiñan",
    unmuteHeroVideo: "Slå på ljudet i huvudvideon",
  },
  da: {
    closeLanguageMenu: "Luk sprogmenuen",
    closeMenu: "Luk menuen",
    heroVideoHasNoAudio: "Hovedvideoen har ingen lyd",
    muteHeroVideo: "Slå lyden fra hovedvideoen",
    openLanguageMenu: "Åbn sprogmenuen",
    openMedia: "Åbn",
    openMenu: "Åbn menuen",
    photoAltJoin: "af Alejandra Mantiñan",
    unmuteHeroVideo: "Slå lyden til hovedvideoen",
  },
  hi: {
    closeLanguageMenu: "भाषा मेनू बंद करें",
    closeMenu: "मेनू बंद करें",
    heroVideoHasNoAudio: "मुख्य वीडियो में ध्वनि नहीं है",
    muteHeroVideo: "मुख्य वीडियो की ध्वनि बंद करें",
    openLanguageMenu: "भाषा मेनू खोलें",
    openMedia: "खोलें",
    openMenu: "मेनू खोलें",
    photoAltJoin: "Alejandra Mantiñan की",
    unmuteHeroVideo: "मुख्य वीडियो की ध्वनि चालू करें",
  },
  hu: {
    closeLanguageMenu: "Nyelvi menü bezárása",
    closeMenu: "Menü bezárása",
    heroVideoHasNoAudio: "A fő videónak nincs hangja",
    muteHeroVideo: "Fő videó némítása",
    openLanguageMenu: "Nyelvi menü megnyitása",
    openMedia: "Megnyitás",
    openMenu: "Menü megnyitása",
    photoAltJoin: "Alejandra Mantiñan képe",
    unmuteHeroVideo: "Fő videó hangjának bekapcsolása",
  },
  zh: {
    closeLanguageMenu: "关闭语言菜单",
    closeMenu: "关闭菜单",
    heroVideoHasNoAudio: "主视频没有声音",
    muteHeroVideo: "关闭主视频声音",
    openLanguageMenu: "打开语言菜单",
    openMedia: "打开",
    openMenu: "打开菜单",
    photoAltJoin: "Alejandra Mantiñan",
    unmuteHeroVideo: "打开主视频声音",
  },
  ja: {
    closeLanguageMenu: "言語メニューを閉じる",
    closeMenu: "メニューを閉じる",
    heroVideoHasNoAudio: "メイン動画に音声はありません",
    muteHeroVideo: "メイン動画をミュート",
    openLanguageMenu: "言語メニューを開く",
    openMedia: "開く",
    openMenu: "メニューを開く",
    photoAltJoin: "Alejandra Mantiñan",
    unmuteHeroVideo: "メイン動画の音声をオン",
  },
  ar: {
    closeLanguageMenu: "إغلاق قائمة اللغات",
    closeMenu: "إغلاق القائمة",
    heroVideoHasNoAudio: "الفيديو الرئيسي بلا صوت",
    muteHeroVideo: "كتم صوت الفيديو الرئيسي",
    openLanguageMenu: "فتح قائمة اللغات",
    openMedia: "فتح",
    openMenu: "فتح القائمة",
    photoAltJoin: "لـ Alejandra Mantiñan",
    unmuteHeroVideo: "تشغيل صوت الفيديو الرئيسي",
  },
  ko: {
    closeLanguageMenu: "언어 메뉴 닫기",
    closeMenu: "메뉴 닫기",
    heroVideoHasNoAudio: "메인 비디오에 소리가 없습니다",
    muteHeroVideo: "메인 비디오 음소거",
    openLanguageMenu: "언어 메뉴 열기",
    openMedia: "열기",
    openMenu: "메뉴 열기",
    photoAltJoin: "Alejandra Mantiñan",
    unmuteHeroVideo: "메인 비디오 소리 켜기",
  },
}[pageLanguage];

const normalizeLanguageUrl = () => {
  if (!window.history?.replaceState || !/^https?:$/.test(window.location.protocol)) return;

  const preferredPaths = { en: "/en", es: "/es", el: "/el", it: "/it", de: "/de", fr: "/fr", ru: "/ru", tr: "/tr", sv: "/sv", da: "/da", hi: "/hi", hu: "/hu", zh: "/zh", ja: "/ja", ar: "/ar", ko: "/ko" };
  const preferredPath = preferredPaths[pageLanguage] || "/en";
  const languageCodes = Object.keys(preferredPaths);
  const legacyLanguagePaths = languageCodes
    .filter((language) => language !== "en")
    .map((language) => `/index-${language}.html`);
  const pageLanguagePaths = languageCodes.map((language) => `/pages/${language}.html`);
  const currentPath = window.location.pathname;
  const cleanHash = window.location.hash === "#home" ? "" : window.location.hash;
  const shouldNormalize =
    currentPath === "/" ||
    currentPath === "/index.html" ||
    legacyLanguagePaths.includes(currentPath) ||
    pageLanguagePaths.includes(currentPath) ||
    currentPath === `${preferredPath}/` ||
    window.location.hash === "#home";

  if (shouldNormalize) {
    window.history.replaceState(null, "", `${preferredPath}${window.location.search}${cleanHash}`);
  }
};

normalizeLanguageUrl();

const resolveSitePath = (src) => {
  if (!src || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(src)) return src;
  if (window.location.protocol === "file:") {
    return window.location.pathname.replace(/\\/g, "/").includes("/pages/") ? `../${src}` : src;
  }

  return `/${src}`;
};

const updateVisitorCounter = async () => {
  if (!visitorCounter || !visitorCount) return;

  const formatCount = (count) => new Intl.NumberFormat(pageLanguage).format(count);
  const localCount = () => {
    const countKey = "alejandra-local-visitor-count";
    const sessionKey = "alejandra-local-visitor-counted";

    try {
      const storedCount = Number(localStorage.getItem(countKey)) || 0;
      const shouldCountVisit = !sessionStorage.getItem(sessionKey);
      const nextCount = shouldCountVisit ? storedCount + 1 : Math.max(storedCount, 1);

      if (shouldCountVisit) {
        localStorage.setItem(countKey, String(nextCount));
        sessionStorage.setItem(sessionKey, "true");
      }

      return nextCount;
    } catch {
      return 1;
    }
  };

  const endpoint = visitorCounter.dataset.visitorEndpoint;
  let count;

  if (endpoint && /^https?:$/.test(window.location.protocol)) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const data = response.ok ? await response.json() : {};
      count = Number(data.count);
    } catch {
      count = undefined;
    }
  }

  visitorCount.textContent = formatCount(Number.isFinite(count) ? count : localCount());
};

updateVisitorCounter();

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

const setAboutTab = (tabName, shouldFocus = false) => {
  if (!aboutTabs.length || !aboutPanels.length) return;

  const nextTab = aboutTabs.find((tab) => tab.dataset.aboutTab === tabName) || aboutTabs[0];
  const nextTabName = nextTab.dataset.aboutTab;

  aboutTabs.forEach((tab) => {
    const isActive = tab === nextTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  aboutPanels.forEach((panel) => {
    const isActive = panel.dataset.aboutPanel === nextTabName;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  if (shouldFocus) {
    nextTab.focus();
  }

  updateAboutPanelFadeState();
  scheduleSectionPathUpdate();
};

const highlightAboutParagraphStarts = () => {
  aboutPanels.forEach((panel) => {
    panel.querySelectorAll("p").forEach((paragraph) => {
      if (paragraph.querySelector(".about-paragraph-start")) return;

      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();

      while (textNode && !textNode.textContent.trim()) {
        textNode = walker.nextNode();
      }

      if (!textNode) return;

      const match = textNode.textContent.match(/^(\s*)(\S+)/);
      if (!match) return;

      const [, leadingSpace, firstWord] = match;
      const rest = textNode.textContent.slice(leadingSpace.length + firstWord.length);
      const fragment = document.createDocumentFragment();

      if (leadingSpace) {
        fragment.append(document.createTextNode(leadingSpace));
      }

      const start = document.createElement("span");
      start.className = "about-paragraph-start";
      start.textContent = firstWord;
      fragment.append(start, document.createTextNode(rest));
      textNode.replaceWith(fragment);
    });
  });
};

const updateAboutPanelFadeState = () => {
  const activePanel = aboutPanels.find((panel) => !panel.hidden);
  aboutTabPanelsWrap?.classList.toggle("is-scrolled", Boolean(activePanel && activePanel.scrollTop > 8));
};

const initializeAboutTabs = () => {
  if (!aboutTabs.length || !aboutPanels.length) return;

  const bioSourceText = aboutTabSource?.textContent.trim();
  const bioPanelText = document.querySelector('[data-about-panel="bio"] p');
  if (bioSourceText && bioPanelText && bioPanelText.textContent.trim() === "Bio content will be added here.") {
    bioPanelText.textContent = bioSourceText;
  }

  aboutTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setAboutTab(tab.dataset.aboutTab));
    tab.addEventListener("keydown", (event) => {
      const keyActions = {
        ArrowRight: 1,
        ArrowDown: 1,
        ArrowLeft: -1,
        ArrowUp: -1,
      };

      if (event.key === "Home") {
        event.preventDefault();
        setAboutTab(aboutTabs[0].dataset.aboutTab, true);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setAboutTab(aboutTabs[aboutTabs.length - 1].dataset.aboutTab, true);
        return;
      }

      if (!(event.key in keyActions)) return;

      event.preventDefault();
      const nextIndex = (index + keyActions[event.key] + aboutTabs.length) % aboutTabs.length;
      setAboutTab(aboutTabs[nextIndex].dataset.aboutTab, true);
    });
  });

  aboutPanels.forEach((panel) => {
    panel.addEventListener("scroll", updateAboutPanelFadeState, { passive: true });
  });

  highlightAboutParagraphStarts();
  setAboutTab("bio");
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
  let videos = [];
  if (manifestVideos.length) {
    const initialVideoIndex = manifestVideos.findIndex((video) => video.src === initialHeroVideoSrc);
    if (initialVideoIndex > 0) {
      videos = [
        manifestVideos[initialVideoIndex],
        ...manifestVideos.slice(0, initialVideoIndex),
        ...manifestVideos.slice(initialVideoIndex + 1),
      ];
    } else {
      videos = manifestVideos;
    }
  } else if (initialHeroVideoSrc) {
    videos = [{ src: initialHeroVideoSrc, title: titleFromPath(initialHeroVideoSrc), type: videoTypeFromPath(initialHeroVideoSrc) }];
  }

  return videos.filter((video) => video?.src && !unavailableHeroVideoSources.has(video.src));
};

const heroVideoHasAudio = (video) => video?.hasAudio !== false;

const getNextHeroVideoWithAudioIndex = () => {
  const videos = getHeroVideos();
  if (!videos.length) return -1;
  if (heroVideoHasAudio(videos[currentHeroVideoIndex])) return currentHeroVideoIndex;

  return videos.findIndex(heroVideoHasAudio);
};

const updateHeroAudioButton = () => {
  if (!heroAudioToggle) return;

  const hasAudioOption = getHeroVideos().some(heroVideoHasAudio);
  heroAudioToggle.classList.toggle("is-unmuted", !heroAudioMuted);
  heroAudioToggle.disabled = !hasAudioOption;
  heroAudioToggle.setAttribute("aria-pressed", String(!heroAudioMuted));
  heroAudioToggle.setAttribute(
    "aria-label",
    hasAudioOption ? (heroAudioMuted ? labels.unmuteHeroVideo : labels.muteHeroVideo) : labels.heroVideoHasNoAudio
  );
};

const setHeroAudioMuted = (muted) => {
  heroAudioMuted = muted;
  heroVideoLayers.forEach((video) => {
    video.muted = heroAudioMuted;
    video.volume = heroAudioMuted ? 0 : 1;
  });
  updateHeroAudioButton();
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

  const videoSrc = resolveSitePath(src);
  video.muted = heroAudioMuted;
  video.volume = heroAudioMuted ? 0 : 1;
  video.autoplay = false;
  video.removeAttribute("autoplay");
  video.loop = false;
  video.playsInline = true;
  video.dataset.mediaSrc = src;
  if (video.getAttribute("src") !== videoSrc) {
    video.src = videoSrc;
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
  const nextVideoSrc = resolveSitePath(nextVideo.src);
  if (standbyVideo?.getAttribute("src") !== nextVideoSrc) {
    standbyVideo.pause();
    standbyVideo.muted = true;
    standbyVideo.volume = 0;
    standbyVideo.classList.remove("is-active");
    standbyVideo.dataset.mediaSrc = nextVideo.src;
    standbyVideo.src = nextVideoSrc;
    standbyVideo.load();
  }
};

const handleHeroVideoError = (event) => {
  const failedVideo = event.currentTarget;
  const failedSrc = failedVideo?.dataset.mediaSrc || failedVideo?.getAttribute("src");
  if (failedSrc) {
    unavailableHeroVideoSources.add(failedSrc);
  }

  heroVideoTransitioning = false;
  updateHeroAudioButton();

  const videos = getHeroVideos();
  if (!videos.length) {
    failedVideo?.classList.remove("is-active");
    return;
  }

  if (failedVideo === getActiveHeroVideoLayer()) {
    setHeroVideo(Math.min(currentHeroVideoIndex, videos.length - 1));
  } else {
    preloadNextHeroVideo();
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
    video.muted = heroAudioMuted;
    video.volume = heroAudioMuted ? 0 : 1;
    video.loop = false;
    video.playsInline = true;
    video.addEventListener("timeupdate", maybeTransitionHeroVideo);
    video.addEventListener("ended", maybeTransitionHeroVideo);
    video.addEventListener("error", handleHeroVideoError);
  });

  setHeroVideo(0, false);
  updateHeroAudioButton();
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
    button.setAttribute("aria-label", `${labels.openMedia} ${item.alt || titleFromPath(item.src)}`);

    const image = document.createElement("img");
    image.src = resolveSitePath(item.src);
    image.alt = item.alt || `${titleFromPath(item.src)} ${labels.photoAltJoin}`;
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
  source.src = resolveSitePath(item.src);
  source.type = item.type || videoTypeFromPath(item.src);
  video.append(source);

  const label = document.createElement("span");
  label.textContent = item.title || titleFromPath(item.src);

  card.append(video, label);
  performanceGrid.append(card);

  renderPerformanceControls();
  scheduleSectionPathUpdate();
};

initializeAboutTabs();
initializeHeroPlaylist();
renderGallery();
renderPerformances();

const updateLanguageOptionLinks = () => {
  if (!languageOptions.length) return;

  const hash = window.location.hash === "#home" ? "" : window.location.hash || "";
  languageOptions.forEach((option) => {
    const baseHref =
      window.location.protocol === "file:" && option.dataset.localLanguageHref
        ? option.dataset.localLanguageHref
        : option.dataset.languageHref || option.getAttribute("href").split("#")[0];
    option.setAttribute("href", `${baseHref}${hash}`);
  });
};

const setLanguageMenu = (open) => {
  if (!languageMenu || !languageToggle) return;

  languageMenu.classList.toggle("is-open", open);
  languageToggle.setAttribute("aria-expanded", String(open));
  languageToggle.setAttribute("aria-label", open ? labels.closeLanguageMenu : labels.openLanguageMenu);
};

const setMenu = (open) => {
  const isOpen = menuPanel.classList.contains("is-open");
  if (open === isOpen && !menuPanel.classList.contains("is-closing")) return;

  if (open) {
    setLanguageMenu(false);
  }

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
  menuToggle.setAttribute("aria-label", open ? labels.closeMenu : labels.openMenu);
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

languageToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  setMenu(false);
  setLanguageMenu(!languageMenu?.classList.contains("is-open"));
});

languageOptions.forEach((option) => {
  option.addEventListener("click", () => setLanguageMenu(false));
});

document.addEventListener("click", (event) => {
  if (!languageMenu?.classList.contains("is-open")) return;
  if (languageMenu.contains(event.target)) return;

  setLanguageMenu(false);
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
heroAudioToggle?.addEventListener("click", () => {
  const shouldMute = !heroAudioMuted;
  setHeroAudioMuted(shouldMute);

  if (!shouldMute) {
    const audioVideoIndex = getNextHeroVideoWithAudioIndex();
    if (audioVideoIndex !== -1 && audioVideoIndex !== currentHeroVideoIndex) {
      transitionHeroVideo(audioVideoIndex);
      return;
    }
  }

  playHeroVideoLayer(getActiveHeroVideoLayer());
});

const updateScheduleListState = () => {
  if (!scheduleList) return;

  const items = [...scheduleList.querySelectorAll("article")];
  const isScrollable = items.length > 8;
  scheduleList.classList.toggle("is-scrollable", isScrollable);

  if (!isScrollable) {
    scheduleList.style.removeProperty("--schedule-list-max");
    return;
  }

  const borderTop = Number.parseFloat(getComputedStyle(scheduleList).borderTopWidth) || 0;
  const visibleHeight = items.slice(0, 8).reduce((total, item) => total + item.getBoundingClientRect().height, borderTop);
  scheduleList.style.setProperty("--schedule-list-max", `${Math.ceil(visibleHeight)}px`);
};

const updateNavSocials = () => {
  const heroExit = hero.offsetTop + hero.offsetHeight - 90;
  const heroAudioFadePoint = hero.offsetTop + hero.offsetHeight * 0.5;
  body.classList.toggle("past-hero", window.scrollY >= heroExit);
  body.classList.toggle("hero-audio-hidden", window.scrollY >= heroAudioFadePoint);
};

updateScheduleListState();
updateNavSocials();
updateSectionPath();
updateLanguageOptionLinks();
setLanguageMenu(false);
window.addEventListener("scroll", updateNavSocials, { passive: true });
window.addEventListener("hashchange", updateLanguageOptionLinks);
window.addEventListener("resize", () => {
  updateScheduleListState();
  updateNavSocials();
  scheduleSectionPathUpdate();
});
window.addEventListener("load", () => {
  updateScheduleListState();
  updateSectionPath();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
    setLanguageMenu(false);
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
  photoPreview.src = resolveSitePath(item.src);
  photoPreview.alt = item.alt || `${titleFromPath(item.src)} ${labels.photoAltJoin}`;
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
    unavailableHeroVideoSources = new Set();
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
    const response = await fetch(`${resolveSitePath("media-manifest.js")}?updated=${Date.now()}`, { cache: "no-store" });
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
