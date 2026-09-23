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
