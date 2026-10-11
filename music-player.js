(() => {
  const player = document.querySelector('[data-music-player]');
  if (!player) return;
  const labels = JSON.parse(player.dataset.musicLabels);
  const tracks = window.MORAKI_MEDIA?.music || [];
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
    title.textContent = tracks[current].title;
    [...playlist.children].forEach((row, i) => {
      row.classList.toggle('is-active', i === current);
      row.querySelector('button').setAttribute('aria-current', String(i === current));
    });
    syncProgress();
    if (autoplay) start(true);
  };
  tracks.forEach((track, i) => {
    const row = document.createElement('li'), button = document.createElement('button');
    button.type = 'button';
    const number = document.createElement('span'); number.textContent = String(i + 1).padStart(2, '0');
    const name = document.createElement('span'); name.textContent = track.title;
    button.append(number, name); row.append(button); playlist.append(row);
    button.addEventListener('dblclick', () => select(i, true));
    button.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(i, true); } });
    // Touch users can start a song with a single tap.
    button.addEventListener('pointerup', event => { if (event.pointerType === 'touch' || event.pointerType === 'pen') select(i, true); });
  });

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
  syncVolume();
  if (tracks.length) select(0, false);
  else { title.textContent = labels[16]; player.querySelectorAll('button, input').forEach(control => { control.disabled = true; }); }
})();
