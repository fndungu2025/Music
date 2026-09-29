# Tunesmith Studio

A single-page music studio for the [Suno API](https://docs.sunoapi.org). Users unlock it with their own Suno API key, then write, generate, remix and perform AI songs in the browser.

## Features

| Area | What you can do | Suno API endpoints |
| --- | --- | --- |
| **Create: Simple** | Describe a song, pick vibes, optionally attach image/audio/video references | `POST /api/v1/generate` (`customMode: false`), file upload API |
| **Create: Custom** | Title, style (with AI **Boost style**), lyrics with section tags, excluded styles, voice gender, instrumental, style weight, weirdness, audio weight, variety, length, persona | `POST /api/v1/generate` (`customMode: true`), `POST /api/v1/style/generate` |
| **Models** | V6 (default), V6 Wild, V6 Mini, plus the legacy V5.5 → V4 models. Character limits and length/persona support adapt to the selected model | — |
| **Lyrics** | AI lyric drafts you can send straight to Custom mode | `POST /api/v1/lyrics`, `GET /api/v1/lyrics/record-info` |
| **Remix Lab** | Cover a song, extend your audio, add vocals, add instrumental, mashup two songs, sounds and loops (key/BPM/loop), split stems from any file | `upload-cover`, `upload-extend`, `add-vocals`, `add-instrumental`, `mashup`, `sounds`, `vocal-removal` |
| **Library** | Streaming previews while a track generates, then per-track: extend, replace section, split stems (2-stem, full, or single instrument), WAV, music video, cover art, persona, MIDI export (.mid), karaoke | `extend`, `replace-section`, `vocal-removal`, `midi`, `wav`, `mp4`, `suno/cover`, `generate-persona`, `get-timestamped-lyrics` |
| **Karaoke** | Word-by-word synced lyrics with a waveform; tap any word to jump there | `POST /api/v1/generate/get-timestamped-lyrics` |
| **Account** | Live credit balance, import any past task by ID | `GET /api/v1/generate/credit`, `GET /api/v1/generate/record-info` |

The app also has light, dark and system themes, a persistent player with Media Session support, a live job tracker that resumes after reload, and toasts and confetti when tracks finish.

## How it works

- Plain HTML, CSS and JavaScript with no build step and no dependencies.
- The API key is kept in `sessionStorage`, or in `localStorage` if the user ticks "Remember on this device". It is sent only as the `Authorization` header to the Suno API.
- `netlify.toml` proxies `/suno/*` to `api.sunoapi.org` and `/suno-upload/*` to the Suno file upload host, so the browser makes same-origin requests. When the proxy isn't available, as on a local static server, the app calls the API directly.
- Every Suno task requires a `callBackUrl`. The app points it at `/api/callback`, a tiny Netlify Function that returns 200, and polls the `record-info` endpoints for results.
- The library, job queue, lyric drafts and personas are stored in the browser's `localStorage`. Suno keeps generated files for 14 days, so download the ones you want to keep.

## Deploy on Netlify

1. Connect this repo in Netlify and deploy the `main` branch.
2. Leave the build command empty. The publish directory is `.`, and `netlify.toml` already sets it.

## Run locally

```bash
npx netlify dev        # full experience, including the proxy and the callback function
# or
python3 -m http.server # static only; the app falls back to calling the API directly
```
