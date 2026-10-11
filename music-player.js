(() => {
  const player = document.querySelector('[data-music-player]');
  if (!player) return;
  const labels = JSON.parse(player.dataset.musicLabels);
  let tracks = window.MORAKI_MEDIA?.music || [];
  const displayTitle = track => track.title.replace(/^\s*\d+[\s._)\-–—]*/, '').trim();
  const find = name => player.querySelector(`[data-music-${name}]`);
  const audio = find('audio'), title = find('title'), playlist = find('playlist');
  const progress = find('progress'), volume = find('volume'), error = find('error');
  const playButton = player.querySelector('[data-music-action="play"]');
  const muteButton = player.querySelector('[data-music-action="mute"]');
  const scriptURL = document.currentScript.src;
  let current = 0, request = 0, fade;
  const time = seconds => { const n = Number.isFinite(seconds) ? Math.floor(seconds) : 0; return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
  const setLabel = (button, label) => { button.title = label; button.setAttribute('aria-label', label); };
  const icon = paths => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  const speaker = '<path d="M11 5 6 9H3v6h3l5 4z"/>';
  const syncVolume = () => {
    audio.volume = Number(volume.value);
    const muted = audio.muted || audio.volume === 0;
    muteButton.innerHTML = icon(speaker + (muted ? '<path d="m16 9 6 6m0-6-6 6"/>' : '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'));
    muteButton.setAttribute('aria-pressed', String(muted));
    setLabel(muteButton, labels[muted ? 11 : 10]);
  };
  const syncPlay = () => {
    const playing = !audio.paused;
    playButton.innerHTML = playing ? icon('<path d="M8 5v14M16 5v14"/>') : icon('<path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/>');
    setLabel(playButton, labels[playing ? 6 : 5]);
    playButton.setAttribute('aria-pressed', String(playing));
    player.classList.toggle('is-playing', playing);
    [...playlist.children].forEach((row, index) => {
      const control = row.querySelector('.music-track-play');
      const active = index === current && playing;
      row.classList.toggle('is-track-playing', active);
      control.innerHTML = icon(active ? '<path d="M8 5v14M16 5v14"/>' : '<path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none"/>');
      control.title = labels[active ? 6 : 5];
    });
  };
  const syncProgress = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    progress.disabled = duration === 0;
    progress.value = duration ? audio.currentTime / duration * 100 : 0;
    find('elapsed').textContent = time(audio.currentTime);
    find('duration').textContent = time(duration);
    progress.setAttribute('aria-valuetext', `${time(audio.currentTime)} / ${time(duration)}`);
  };
  const cancelFade = () => { cancelAnimationFrame(fade); syncVolume(); };
  const start = async (smooth = false) => {
    const token = ++request;
    error.textContent = '';
    cancelFade();
    if (smooth) audio.volume = 0;
    try {
      await audio.play();
      if (token !== request) return;
      if (smooth) {
        const began = performance.now();
        const step = now => {
          if (token !== request) return;
          const fraction = Math.min(1, (now - began) / 240);
          audio.volume = Number(volume.value) * fraction;
          if (fraction < 1) fade = requestAnimationFrame(step);
        };
        fade = requestAnimationFrame(step);
      }
    } catch (e) { if (token === request && e.name !== 'AbortError') error.textContent = labels[17]; }
  };
  const select = (index, autoplay) => {
    ++request;
    cancelFade();
    audio.pause();
    current = (index + tracks.length) % tracks.length;
    audio.src = new URL(tracks[current].src.split('/').map(encodeURIComponent).join('/'), scriptURL).href;
    title.textContent = displayTitle(tracks[current]);
    [...playlist.children].forEach((row, i) => {
      row.classList.toggle('is-active', i === current);
      row.querySelector('button').setAttribute('aria-current', String(i === current));
    });
    syncProgress();
    if (autoplay) start(true);
  };
  const renderTracks = () => {
  playlist.replaceChildren();
  tracks.forEach((track, i) => {
    const row = document.createElement('li'), button = document.createElement('button');
    button.type = 'button';
    const number = document.createElement('span'); number.className = 'music-track-leading';
    const indexLabel = document.createElement('span'); indexLabel.className = 'music-track-number'; indexLabel.textContent = String(i + 1).padStart(2, '0');
    const quickPlay = document.createElement('span'); quickPlay.className = 'music-track-play'; quickPlay.title = labels[5]; quickPlay.setAttribute('aria-hidden', 'true'); quickPlay.innerHTML = icon('<path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none"/>');
    number.append(indexLabel, quickPlay);
    quickPlay.addEventListener('click', event => {
      event.stopPropagation();
      if (event.detail > 1) return;
      if (i !== current) select(i, true);
      else if (audio.paused) start();
      else { ++request; cancelFade(); audio.pause(); }
    });
    quickPlay.addEventListener('dblclick', event => event.stopPropagation());
    const name = document.createElement('span'); name.textContent = displayTitle(track);
    name.className = 'music-track-name';
    const duration = document.createElement('time'); duration.className = 'music-track-duration'; duration.textContent = track.duration ? time(track.duration) : '—:—';
    button.title = displayTitle(track);
    button.append(number, name, duration); row.append(button); playlist.append(row);
    button.addEventListener('dblclick', () => select(i, true));
    button.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(i, true); } });
    // Touch users can start a song with a single tap.
    button.addEventListener('pointerup', event => { if ((event.pointerType === 'touch' || event.pointerType === 'pen') && !event.target.closest('.music-track-play')) select(i, true); });
  });
  syncPlay();

  };
  renderTracks();
  player.addEventListener('click', event => {
    const action = event.target.closest('[data-music-action]')?.dataset.musicAction;
    if (!action || !tracks.length) return;
    if (action === 'play') { if (audio.paused) start(); else { ++request; cancelFade(); audio.pause(); } }
    if (action === 'stop') { ++request; cancelFade(); audio.pause(); audio.currentTime = 0; syncProgress(); }
    if (action === 'next') select(current + 1, true);
    if (action === 'previous') select(current - 1, true);
    if (action === 'mute') { audio.muted = !(audio.muted || audio.volume === 0); if (!audio.muted && Number(volume.value) === 0) volume.value = 0.7; syncVolume(); }
    if (action === 'quieter' || action === 'louder') { cancelFade(); volume.value = Math.max(0, Math.min(1, Number(volume.value) + (action === 'louder' ? 0.05 : -0.05))); audio.muted = false; syncVolume(); }
  });
  volume.addEventListener('input', () => { cancelFade(); audio.muted = false; syncVolume(); });
  progress.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(progress.value) / 100 * audio.duration; syncProgress(); });
  ['loadedmetadata', 'durationchange', 'timeupdate', 'emptied'].forEach(event => audio.addEventListener(event, syncProgress));
  ['play', 'pause', 'ended'].forEach(event => audio.addEventListener(event, syncPlay));
  audio.addEventListener('ended', () => select(current + 1, true));
  audio.addEventListener('error', () => { error.textContent = labels[17]; });
  const durationCache = new Map();
  let loadingDurations = false;
  const loadDurations = async () => {
    if (loadingDurations) return;
    loadingDurations = true;
    for (const track of [...tracks]) {
      if (!durationCache.has(track.src)) {
        const probe = new Audio(); probe.preload = 'metadata';
        const seconds = await new Promise(resolve => {
          const timer = setTimeout(() => resolve(0), 10000);
          probe.onloadedmetadata = () => { clearTimeout(timer); resolve(probe.duration); };
          probe.onerror = () => { clearTimeout(timer); resolve(0); };
          probe.src = new URL(track.src.split('/').map(encodeURIComponent).join('/'), scriptURL).href;
        });
        if (Number.isFinite(seconds) && seconds > 0) durationCache.set(track.src, seconds);
        probe.removeAttribute('src'); probe.load();
      }
      const index = tracks.findIndex(item => item.src === track.src);
      if (index >= 0 && durationCache.has(track.src)) playlist.children[index]?.querySelector('time')?.replaceChildren(time(durationCache.get(track.src)));
    }
    loadingDurations = false;
  };
  const refreshTracks = async () => {
    try {
      let next;
      if (['localhost', '127.0.0.1'].includes(location.hostname)) {
        const response = await fetch('/api/music', { cache: 'no-store' });
        if (!response.ok) return;
        next = await response.json();
      } else {
        const response = await fetch(new URL('media-manifest.js', scriptURL), { cache: 'no-store' });
        const match = (await response.text()).match(/window\.MORAKI_MEDIA\s*=\s*([\s\S]*?);\s*$/);
        next = match ? JSON.parse(match[1]).music : null;
      }
      if (!Array.isArray(next)) return;
      if (JSON.stringify(next) !== JSON.stringify(tracks)) {
        const selected = tracks[current]?.src;
        tracks = next;
        renderTracks();
        const index = tracks.findIndex(track => track.src === selected);
        if (index >= 0) { current = index; playlist.children[index]?.classList.add('is-active'); playlist.children[index]?.querySelector('button').setAttribute('aria-current', 'true'); }
        else if (tracks.length) select(0, false);
        else { ++request; audio.pause(); audio.removeAttribute('src'); audio.load(); title.textContent = labels[16]; }
        player.querySelectorAll('button').forEach(button => { button.disabled = !tracks.length; });
        volume.disabled = !tracks.length;
      }
      loadDurations();
    } catch { /* Static previews keep the build-time playlist. */ }
  };
  refreshTracks();
  loadDurations();
  setInterval(() => { if (!document.hidden) refreshTracks(); }, 5000);
  window.addEventListener('focus', refreshTracks);
  syncVolume();
  if (tracks.length) select(0, false);
  else { title.textContent = labels[16]; player.querySelectorAll('button, input').forEach(control => { control.disabled = true; }); }
})();
