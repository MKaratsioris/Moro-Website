# Alejandra Mantinan

[Personal Website](https://alejandramantinan.com)

## Updating videos and photos

Add or replace files in `video/hero`, `video/performances`, or `gallery`. Netlify rebuilds `media-manifest.js` automatically before publishing.

After adding or replacing performance videos, run `node tools/generate-performance-posters.js` to extract lightweight preview images, then update the manifest. These posters appear immediately in the carousel and video playlist without downloading each full video.

For a local preview or a manual upload, run `update-media-manifest.cmd` after changing files, or leave `watch-media-manifest.cmd` running while editing. With Node.js, you can also run `node tools/update-media-manifest.js`. Include the updated `media-manifest.js` with your media files when uploading manually.

For fast loading and smaller uploads, export videos as web-optimized MP4 files using H.264 video, AAC audio, a maximum width of 1280 px, and the `faststart` option. A useful ffmpeg starting point is:

```powershell
ffmpeg -i "input.mov" -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "output.mp4"
```

Aim for roughly 10–25 MB per performance video when the source and acceptable quality allow it. The page delays performance previews until their section is nearby, but smaller source files still provide the largest improvement to first playback on slower connections.

## Versions
- `v1.0` : Main website in English. Sections included - `About`, `Schedule`, `Gallery`, `Performances`, `Contact Me`.
- `v2.0`: Add language menu - `English`, `Spanish`, `Greek`, `Italian`, `French`, `German`, `Swedish`, `Danish`, `Turkish`, `Russian`, `Korean`, `Japanese`, `Chinese`, `Arabic`.
- `v3.0`: Add music player.

## Audience counters

The hero counts each browser once (using local storage), across all language pages. Each performance selection adds one video view; carousel navigation and automatic previews do not add views. Starting totals are generated once: 3696–9636 visitors and 369–963 views per video, before adding new activity.

Production counters use the Netlify function in `netlify/functions/counters.mjs` and the site-wide `audience-counters` Blobs store. Netlify installs the dependency from `package.json` during deployment. Conditional writes protect concurrent increments. Deploy through Netlify to activate shared totals; static hosting alone cannot run this endpoint. These seeded totals are display counters, not historical analytics.

Localhost/file previews use separate local storage counts. Run `node tools/preview.cjs` and open http://127.0.0.1:4173/ to preview. Browser-local visitor recognition resets if storage is cleared or a different browser is used.

## Music playlist
With node tools/preview.cjs running, the player scans music/ through the local preview server every five seconds while the page is visible; adding or removing files needs no manual refresh. Netlify regenerates the playlist during each build: deploy new files to update the published site. For file previews or manual uploads, run node tools/update-media-manifest.js (or update-media-manifest.cmd) and upload media-manifest.js with the audio files. Supported extensions: MP3, M4A, AAC, OGG, WAV, FLAC, OPUS, WEBM; playback support depends on the browser. Song titles come from filenames. Double-click a playlist song, press Enter/Space on a focused song, or tap on touch devices to play it.
