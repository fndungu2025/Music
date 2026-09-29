/* Tunesmith Studio — a single-page client for the Suno API (https://docs.sunoapi.org). */
(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  const HOSTS = {
    direct: { suno: 'https://api.sunoapi.org', upload: 'https://sunoapiorg.redpandaai.co' },
    proxy: { suno: '/suno', upload: '/suno-upload' }, // Netlify rewrites (see netlify.toml)
  };
  const POLL_MS = 5000;
  const JOB_TIMEOUT_MS = 20 * 60 * 1000;

  const MODELS = [
    { id: 'V6', name: 'V6', tag: 'Recommended', rec: true, desc: 'Most natural vocals and the richest detail.' },
    { id: 'V6_WILD', name: 'V6 Wild', tag: 'Bold', desc: 'Pushes creative boundaries for distinctive results.' },
    { id: 'V6_MINI', name: 'V6 Mini', tag: 'Fast', desc: 'Lightweight and quick — great for sketching ideas.' },
  ];
  const LEGACY_MODELS = [
    { id: 'V5_5', name: 'V5.5', desc: 'Voice-customized model.' },
    { id: 'V5', name: 'V5', desc: 'Superior expression, faster generation.' },
    { id: 'V4_5PLUS', name: 'V4.5+', desc: 'Richer tones, up to 8 min.' },
    { id: 'V4_5ALL', name: 'V4.5 All', desc: 'Better song structure, up to 8 min.' },
    { id: 'V4_5', name: 'V4.5', desc: 'Smart prompts, up to 8 min.' },
    { id: 'V4', name: 'V4', desc: 'Improved vocals, up to 4 min.' },
  ];
  const ALL_MODELS = [...MODELS, ...LEGACY_MODELS];
  const DURATION_MODELS = ['V5_5', 'V6', 'V6_MINI', 'V6_WILD'];
  const PERSONA_MODELS = ['V5', 'V5_5', 'V6', 'V6_MINI', 'V6_WILD'];
  const isV6 = (m) => m.startsWith('V6');
  const limits = (m) => ({
    style: m === 'V4' ? 200 : 1000,
    lyrics: isV6(m) ? 5000 : m === 'V4' ? 3000 : 5000,
    simplePrompt: 3000,
    title: 80,
  });

  const VIBES = [
    ['🌙', 'Lo-fi chill'], ['⚡', 'Synthwave'], ['🎸', 'Indie rock'], ['💃', 'Dance pop'], ['🤠', 'Country'],
    ['🎷', 'Smooth jazz'], ['🔥', 'Trap'], ['🎻', 'Cinematic orchestral'], ['🌴', 'Reggaeton'], ['🎹', 'Piano ballad'],
    ['🪩', 'Disco funk'], ['🌊', 'Ambient'], ['🥁', 'Afrobeats'], ['🤘', 'Metal'], ['🎤', '90s R&B'], ['🪕', 'Folk'],
  ];
  const GENRES = ['pop', 'rock', 'hip hop', 'edm', 'r&b', 'jazz', 'lo-fi', 'folk', 'country', 'k-pop', 'house', 'soul',
    'upbeat', 'melancholic', 'dreamy', 'energetic', 'female vocals', 'male vocals', 'acoustic guitar', 'synth', '808s', '120 bpm'];
  const SONG_TAGS = ['[Intro]', '[Verse]', '[Pre-Chorus]', '[Chorus]', '[Bridge]', '[Outro]', '[Instrumental]', '[Drop]', '[Hook]'];
  const SURPRISES = [
    'An upbeat summer anthem about a road trip with best friends, catchy whistled hook',
    'A melancholic piano ballad about the last train home in the rain',
    'A funky disco track about a robot learning to dance',
    'A cozy lo-fi hip hop beat for studying on a snowy afternoon',
    'An epic cinematic orchestral piece for a dragon flying over mountains',
    'A playful ukulele song about a cat who thinks it runs the house',
    'A dreamy synthwave track about neon city lights at midnight',
    'A heartfelt country song about a grandmother’s kitchen',
    'An energetic pop-punk anthem about quitting a boring job',
    'A smooth jazz tune for a rooftop dinner in Paris',
    'A reggaeton banger about dancing until sunrise on the beach',
    'An ambient soundscape of floating through a quiet galaxy',
    'A 90s R&B slow jam about texting your crush at 2am',
    'A sea shanty about pirates who only steal socks',
  ];
  const LYRIC_IDEAS = [
    'A hopeful song about starting over in a new city, with a big singalong chorus',
    'A funny love song from a houseplant to the person who keeps forgetting to water it',
    'A breakup song that turns empowering in the bridge',
    'A lullaby about the moon keeping watch over a sleeping town',
    'A hype anthem for a small-town basketball team making the finals',
    'Nostalgic song about summer evenings riding bikes as kids',
  ];
  const COOKING = [
    'Tuning the guitars…', 'Warming up the vocalist…', 'Finding the perfect hook…', 'Laying down the drums…',
    'Adding a little reverb…', 'Arguing about the bridge…', 'Polishing the chorus…', 'Mixing the final take…',
    'Sprinkling in some magic…', 'Counting in: 1, 2, 3, 4…',
  ];
  const STEM_NAMES = ['Lead Vocal', 'Backing Vocals', 'Drum Kit', 'Kick', 'Snare', 'Hi-Hat', 'Bass', 'Bass Guitar', '808', 'Piano',
    'Electric Guitar', 'Acoustic Guitar', 'Guitar', 'Synth', 'Synth Pad', 'Synth Bass', 'Synth Lead', 'Keyboards', 'Rhodes', 'Organ',
    'Strings', 'String Section', 'Violin', 'Cello', 'Brass Section', 'Horns', 'Saxophone', 'Trumpet', 'Woodwinds', 'Flute',
    'Percussion', 'Choir', 'Orchestra', 'Sound Effects', 'Risers'].filter((n) => n !== 'Strings');
  const STEM_LABELS = {
    vocalUrl: 'Vocals', instrumentalUrl: 'Instrumental', backingVocalsUrl: 'Backing vocals', drumsUrl: 'Drums', bassUrl: 'Bass',
    guitarUrl: 'Guitar', keyboardUrl: 'Keys', percussionUrl: 'Percussion', stringsUrl: 'Strings', synthUrl: 'Synth', fxUrl: 'FX',
    brassUrl: 'Brass', woodwindsUrl: 'Woodwinds', originUrl: 'Original',
  };
  const SOUND_KEYS = ['Any', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

  const ERRORS = {
    400: 'Some parameters were invalid.', 401: 'That API key was rejected. Double-check it and try again.',
    402: 'Not enough credits for this action.', 404: 'Endpoint not found.', 405: 'Rate limit reached — give it a moment.',
    409: 'This already exists.', 413: 'Your prompt or lyrics are too long for this model.',
    422: 'Some parameters failed validation.', 429: 'You are out of credits. Top up at sunoapi.org to keep creating.',
    430: 'Too many requests too quickly — slow down a touch.', 451: 'Could not fetch the source file.',
    455: 'Suno API is under maintenance. Please try again soon.', 500: 'The Suno API hit a server error. Try again.',
  };

  // ---------------------------------------------------------------------------
  // Icons
  // ---------------------------------------------------------------------------
  const P = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const ICONS = {
    spark: P('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>'),
    remix: P('<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>'),
    pen: P('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    library: P('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: P('<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>'),
    monitor: P('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    lock: P('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    eye: P('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.2"/><rect x="14" y="4" width="4" height="16" rx="1.2"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5.5v13a1 1 0 0 1-1.5.86l-9.5-6.5a1 1 0 0 1 0-1.72l9.5-6.5A1 1 0 0 1 20 5.5z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5.5v13a1 1 0 0 0 1.5.86l9.5-6.5a1 1 0 0 0 0-1.72L5.5 4.64A1 1 0 0 0 4 5.5z"/></svg>',
    mic: P('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>'),
    expand: P('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
    x: P('<path d="M18 6 6 18M6 6l12 12"/>'),
    dice: P('<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1" fill="currentColor"/>'),
    wand: P('<path d="m15 4 5 5L9 20H4v-5z"/><path d="M13 6l5 5"/>'),
    clip: P('<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>'),
    sliders: P('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
    download: P('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>'),
  };
  const icon = (name) => ICONS[name] || '';

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTime = (s) => { s = Math.max(0, Math.floor(Number(s) || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const hashHue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

  const store = {
    get(k, d) { try { const v = localStorage.getItem('ts.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ts.' + k, JSON.stringify(v)); } catch (e) { console.warn('storage failed', e); } },
    del(k) { try { localStorage.removeItem('ts.' + k); } catch {} },
  };

  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach((el) => { if (!el.firstChild) el.innerHTML = icon(el.dataset.icon); });
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const state = {
    key: '',
    mode: store.get('mode', 'simple'),
    model: store.get('model', 'V6'),
    vocal: '',
    refs: [], // {id, kind, name, url, busy}
    library: store.get('library', []),
    jobs: store.get('jobs', []),
    personas: store.get('personas', []),
    lyricDrafts: store.get('lyricDrafts', []),
    queue: [], // playback order (track ids)
    current: null,
    hosts: null,
  };
  const saveLibrary = () => store.set('library', state.library);
  const saveJobs = () => store.set('jobs', state.jobs);

  // ---------------------------------------------------------------------------
  // API layer
  // ---------------------------------------------------------------------------
  class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code; } }

  function pickHosts() {
    if (state.hosts) return state.hosts;
    const forced = store.get('hostMode', null);
    const canProxy = location.protocol.startsWith('http') && !['localhost', '127.0.0.1'].includes(location.hostname);
    state.hosts = forced ? HOSTS[forced] : canProxy ? HOSTS.proxy : HOSTS.direct;
    return state.hosts;
  }

  async function rawFetch(kind, path, init) {
    const hosts = pickHosts();
    const url = hosts[kind] + path;
    let res;
    try {
      res = await fetch(url, init);
    } catch (e) {
      if (hosts === HOSTS.proxy) { state.hosts = HOSTS.direct; return rawFetch(kind, path, init); }
      throw new ApiError('Network error — could not reach the Suno API.', 0);
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) {
      // The proxy isn't configured (e.g. a static preview) — fall back to calling the API directly.
      if (hosts === HOSTS.proxy) { state.hosts = HOSTS.direct; return rawFetch(kind, path, init); }
      throw new ApiError(`Unexpected response (${res.status}).`, res.status);
    }
    return res.json();
  }

  async function api(path, { method = 'GET', body, query } = {}) {
    let p = path;
    if (query) p += '?' + new URLSearchParams(query).toString();
    const init = { method, headers: { Authorization: `Bearer ${state.key}`, Accept: 'application/json' } };
    if (body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(clean(body)); }
    const json = await rawFetch('suno', p, init);
    if (json && typeof json.code === 'number' && json.code !== 200) {
      const base = ERRORS[json.code] || 'Request failed.';
      const detail = json.msg && json.msg !== 'success' ? json.msg : '';
      throw new ApiError(detail && !base.includes(detail) ? `${base} ${detail}` : base, json.code);
    }
    return json?.data;
  }

  function clean(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length) || Number.isNaN(v)) continue;
      out[k] = v;
    }
    return out;
  }

  const callbackUrl = () => (location.protocol === 'https:' ? `${location.origin}/api/callback` : 'https://example.com/suno-callback');

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('uploadPath', 'tunesmith');
    fd.append('fileName', `${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`);
    const json = await rawFetch('upload', '/api/file-stream-upload', { method: 'POST', headers: { Authorization: `Bearer ${state.key}` }, body: fd });
    if (!json?.success && json?.code !== 200) throw new ApiError(json?.msg || 'Upload failed.', json?.code);
    return json.data.downloadUrl;
  }

  async function refreshCredits() {
    try {
      const c = await api('/api/v1/generate/credit');
      const el = $('#credits-val');
      const prev = el.textContent;
      el.textContent = Number(c).toLocaleString();
      if (prev !== el.textContent) { $('#credits').classList.remove('bump'); void $('#credits').offsetWidth; $('#credits').classList.add('bump'); }
      return c;
    } catch (e) { if (e.code === 401) lock('Your API key is no longer valid.'); }
  }

  // ---------------------------------------------------------------------------
  // Toasts, modal, confetti
  // ---------------------------------------------------------------------------
  function toast(title, msg = '', type = 'info', ms = 5000) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const ico = { info: '🎵', ok: '✅', err: '⚠️', warn: '⏳' }[type] || '🎵';
    el.innerHTML = `<span class="t-ico">${ico}</span><div><b>${esc(title)}</b>${msg ? `<span class="muted small">${esc(msg)}</span>` : ''}</div>`;
    const box = $('#toasts');
    box.append(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
  }

  let modalOnClose = null;
  function openModal(title, html, { wide = false, onClose } = {}) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    $('.modal-card').classList.toggle('wide', wide);
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    hydrateIcons($('#modal'));
    modalOnClose = onClose || null;
    setTimeout(() => $('#modal-body input, #modal-body textarea, #modal-body button')?.focus(), 50);
    return $('#modal-body');
  }
  function closeModal() {
    if ($('#modal').hidden) return;
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    const cb = modalOnClose; modalOnClose = null; cb?.();
  }

  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#confetti'); const ctx = cv.getContext('2d');
    const dpr = devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = ['#7c3aed', '#db2777', '#f59e0b', '#10b981', '#3b82f6'];
    const parts = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight / 2.2, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 4,
      r: Math.random() * 6 + 3, c: pick(colors), rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
    }));
    let t = 0;
    (function frame() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => { p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); ctx.restore(); });
      if (++t < 150) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  function setBusy(btn, busy, label) {
    if (!btn) return;
    btn.disabled = busy;
    btn.classList.toggle('loading', busy);
    const l = $('.btn-label', btn);
    if (l) { if (busy) { l.dataset.orig = l.dataset.orig || l.textContent; if (label) l.textContent = label; } else if (l.dataset.orig) l.textContent = l.dataset.orig; }
  }

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------
  function applyTheme(pref) {
    const root = document.documentElement;
    if (pref === 'light' || pref === 'dark') root.setAttribute('data-theme', pref); else root.removeAttribute('data-theme');
    try { localStorage.setItem('ts.theme', pref); } catch {}
    $$('.theme-switch button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeSet === pref)));
  }
  function initTheme() {
    const map = { light: 'sun', system: 'monitor', dark: 'moon' };
    $$('.theme-switch button').forEach((b) => { b.innerHTML = icon(map[b.dataset.themeSet]); b.addEventListener('click', () => applyTheme(b.dataset.themeSet)); });
    let pref = 'system';
    try { pref = localStorage.getItem('ts.theme') || 'system'; } catch {}
    applyTheme(['light', 'dark'].includes(pref) ? pref : 'system');
  }

  // ---------------------------------------------------------------------------
  // Key gate
  // ---------------------------------------------------------------------------
  function readKey() {
    try { return sessionStorage.getItem('ts.key') || localStorage.getItem('ts.key.remember') || ''; } catch { return ''; }
  }
  function saveKey(key, remember) {
    try {
      sessionStorage.setItem('ts.key', key);
      if (remember) localStorage.setItem('ts.key.remember', key); else localStorage.removeItem('ts.key.remember');
    } catch {}
  }
  function forgetKey() { try { sessionStorage.removeItem('ts.key'); localStorage.removeItem('ts.key.remember'); } catch {} }

  function lock(message) {
    state.key = '';
    forgetKey();
    $('#audio').pause();
    $('#app').hidden = true;
    $('#gate').hidden = false;
    const err = $('#gate-error');
    err.hidden = !message; err.textContent = message || '';
    $('#gate-key').value = '';
    $('#gate-key').focus();
  }

  function initGate() {
    $('#gate-peek').innerHTML = icon('eye');
    $('#gate-peek').addEventListener('click', () => { const i = $('#gate-key'); i.type = i.type === 'password' ? 'text' : 'password'; });
    $('#gate-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const key = $('#gate-key').value.trim();
      const btn = $('#gate-submit'); const err = $('#gate-error');
      err.hidden = true;
      if (!key) return;
      state.key = key;
      setBusy(btn, true, 'Checking your key…');
      try {
        const credits = await api('/api/v1/generate/credit');
        saveKey(key, $('#gate-remember').checked);
        enterApp(credits);
      } catch (ex) {
        state.key = '';
        err.textContent = ex.code === 401 ? 'That key didn’t work. Copy it again from sunoapi.org/api-key.' : ex.message;
        err.hidden = false;
      } finally { setBusy(btn, false); }
    });
  }

  function enterApp(credits) {
    $('#gate').hidden = true;
    $('#app').hidden = false;
    if (credits != null) $('#credits-val').textContent = Number(credits).toLocaleString(); else refreshCredits();
    renderLibrary(); renderJobs();
    resumeJobs();
    if (!store.get('welcomed', false)) {
      store.set('welcomed', true);
      toast('Welcome to the studio!', 'Describe a song and hit Create — your first track streams in about 30 seconds.', 'ok', 7000);
    }
  }

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------
  function goTab(name) {
    $$('.tab').forEach((t) => { const on = t.dataset.tab === name; t.classList.toggle('active', on); t.setAttribute('aria-selected', String(on)); });
    $$('.panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
    store.set('tab', name);
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------------------
  // Shared form widgets
  // ---------------------------------------------------------------------------
  function sliderHTML(id, label, min, max, step, value, lo, hi) {
    return `<div class="slider"><div class="slider-head"><label for="${id}">${label}</label><output id="${id}-out">${value}</output></div>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" />
      <div class="slider-hint"><span>${lo}</span><span>${hi}</span></div></div>`;
  }
  const VARIETY = ['Off — exact style', 'Normal', 'High — distinct styles', 'Extra — bold', 'Max — wild'];
  function bindSliders(root) {
    $$('input[type=range]', root).forEach((r) => {
      const out = $(`#${r.id}-out`, root);
      const upd = () => {
        const p = ((r.value - r.min) / (r.max - r.min)) * 100;
        r.style.setProperty('--p', p + '%');
        if (!out) return;
        if (r.id.endsWith('variety')) out.textContent = VARIETY[r.value];
        else if (r.id.endsWith('duration')) out.textContent = fmtTime(r.value);
        else out.textContent = Number(r.value).toFixed(2);
      };
      r.addEventListener('input', upd); upd();
    });
  }

  function fineTuneHTML(prefix, { duration = true, persona = true, audioWeight = true } = {}) {
    const personas = state.personas.map((p) => `<option value="${esc(p.personaId)}">${esc(p.name)}</option>`).join('');
    return `
      ${sliderHTML(`${prefix}-styleWeight`, 'Style adherence', 0, 1, 0.01, 0.65, 'Loose', 'Strict')}
      ${sliderHTML(`${prefix}-weirdness`, 'Weirdness', 0, 1, 0.01, 0.5, 'Safe', 'Experimental')}
      ${audioWeight ? sliderHTML(`${prefix}-audioWeight`, 'Audio weight', 0, 1, 0.01, 0.65, 'Low', 'High') : ''}
      ${sliderHTML(`${prefix}-variety`, 'Variety', 0, 4, 1, 1, 'Exact', 'Max')}
      ${duration ? `<div data-duration-wrap>${sliderHTML(`${prefix}-duration`, 'Length', 10, 360, 5, 120, '0:10', '6:00')}<p class="fine" data-duration-note></p></div>` : ''}
      ${persona ? `<div class="grid-2" data-persona-wrap>
        <div><label class="label" for="${prefix}-persona">Persona / Voice ID</label>
          <input class="input" id="${prefix}-persona" list="${prefix}-persona-list" placeholder="Pick or paste an ID" />
          <datalist id="${prefix}-persona-list">${personas}</datalist></div>
        <div><label class="label" for="${prefix}-personaModel">Persona type</label>
          <select class="input select" id="${prefix}-personaModel"><option value="style_persona">Style persona</option><option value="voice_persona">Voice (Suno Voice ID)</option></select></div>
      </div><p class="fine" data-persona-note>Create personas from any track in your Library to reuse its vibe or voice.</p>` : ''}`;
  }
  function readFineTune(root, prefix, model, { includeAudioWeight = true } = {}) {
    const v = (id) => $(`#${prefix}-${id}`, root);
    const out = {
      styleWeight: v('styleWeight') ? Number(v('styleWeight').value) : undefined,
      weirdnessConstraint: v('weirdness') ? Number(v('weirdness').value) : undefined,
      variety: v('variety') ? Number(v('variety').value) : undefined,
    };
    if (includeAudioWeight && v('audioWeight')) out.audioWeight = Number(v('audioWeight').value);
    if (v('duration') && DURATION_MODELS.includes(model)) out.duration = Number(v('duration').value);
    const pid = v('persona')?.value.trim();
    if (pid) { out.personaId = pid; if (PERSONA_MODELS.includes(model)) out.personaModel = v('personaModel').value; }
    return out;
  }
  function syncFineTuneNotes(root, model) {
    const dn = $('[data-duration-note]', root);
    if (dn) dn.textContent = DURATION_MODELS.includes(model) ? '' : `Length control isn't available on ${model} — pick a V6 model to set it.`;
    const dw = $('[data-duration-wrap] .slider', root);
    if (dw) dw.style.opacity = DURATION_MODELS.includes(model) ? '' : '.4';
  }

  function counters(root = document) {
    $$('.counter', root).forEach((c) => {
      const input = document.getElementById(c.dataset.for);
      if (!input) return;
      const upd = () => {
        const max = Number(input.dataset.max || input.maxLength) || 0;
        const n = input.value.length;
        c.textContent = max > 0 ? `${n.toLocaleString()} / ${max.toLocaleString()}` : n ? `${n.toLocaleString()} chars` : '';
        c.classList.toggle('over', max > 0 && n > max);
      };
      input.addEventListener('input', upd); input._count = upd; upd();
    });
  }

  function insertAtCursor(ta, text) {
    const s = ta.selectionStart ?? ta.value.length; const e = ta.selectionEnd ?? s;
    const before = ta.value.slice(0, s); const pre = before && !before.endsWith('\n') ? '\n' : '';
    ta.value = before + pre + text + '\n' + ta.value.slice(e);
    const pos = (before + pre + text + '\n').length;
    ta.focus(); ta.setSelectionRange(pos, pos); ta.dispatchEvent(new Event('input'));
  }

  // ---------------------------------------------------------------------------
  // Create tab
  // ---------------------------------------------------------------------------
  function renderModels() {
    const card = (m, legacy) => `<button type="button" class="model ${legacy ? 'legacy' : ''} ${state.model === m.id ? 'on' : ''}" data-model="${m.id}" aria-pressed="${state.model === m.id}">
      <b>${esc(m.name)}</b>${m.tag ? `<span class="tag ${m.rec ? 'rec' : ''}">${esc(m.tag)}</span>` : '<span></span>'}<span class="desc">${esc(m.desc)}</span></button>`;
    $('#models').innerHTML = MODELS.map((m) => card(m)).join('');
    $('#models-legacy').innerHTML = LEGACY_MODELS.map((m) => card(m, true)).join('');
    if (LEGACY_MODELS.some((m) => m.id === state.model)) $('#models-legacy').closest('details').open = true;
    const m = ALL_MODELS.find((x) => x.id === state.model);
    $('#model-summary').textContent = `Model: ${m?.name || state.model}`;
    applyModelLimits();
  }
  function applyModelLimits() {
    const L = limits(state.model);
    $('#c-style').dataset.max = L.style;
    $('#c-lyrics').dataset.max = L.lyrics;
    ['#c-style', '#c-lyrics'].forEach((s) => $(s)._count?.());
    syncFineTuneNotes($('#ft-body'), state.model);
    const pn = $('[data-persona-note]', $('#ft-body'));
    if (pn) pn.textContent = PERSONA_MODELS.includes(state.model) ? 'Create personas from any track in your Library to reuse its vibe or voice.' : `Persona type is ignored on ${state.model}.`;
  }

  function setMode(mode) {
    state.mode = mode; store.set('mode', mode);
    $$('#mode-seg .seg-btn').forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle('active', on); b.setAttribute('aria-checked', String(on)); });
    $('.mode-simple').hidden = mode !== 'simple';
    $('.mode-custom').hidden = mode !== 'custom';
    syncInstrumental();
  }
  function syncInstrumental() {
    const inst = $('#instrumental').checked;
    $('#lyrics-field').style.display = inst ? 'none' : '';
    $('#vocal-field').style.opacity = inst ? .4 : 1;
    $('#vocal-field').style.pointerEvents = inst ? 'none' : '';
    const aw = $('#ct-audioWeight')?.closest('.slider');
    if (aw) aw.style.display = inst ? 'none' : '';
  }

  function initCreate() {
    renderModels();
    $('#models').parentElement.addEventListener('click', (e) => {
      const b = e.target.closest('[data-model]'); if (!b) return;
      state.model = b.dataset.model; store.set('model', state.model); renderModels();
    });
    $$('#mode-seg .seg-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $('#instrumental').addEventListener('change', syncInstrumental);

    // Vibes (simple)
    $('#s-vibes').innerHTML = VIBES.map(([e, v]) => `<button type="button" class="chip" data-vibe="${esc(v)}"><span class="emoji">${e}</span>${esc(v)}</button>`).join('');
    $('#s-vibes').addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      c.classList.toggle('on');
      const sel = $$('#s-vibes .chip.on').map((x) => x.dataset.vibe);
      $('#s-style').value = sel.join(', ');
    });
    $('#surprise').addEventListener('click', () => {
      const t = $('#s-prompt'); t.value = pick(SURPRISES.filter((s) => s !== t.value)); t.dispatchEvent(new Event('input')); t.focus();
    });

    // Genres (custom)
    $('#c-genres').innerHTML = GENRES.map((g) => `<button type="button" class="chip" data-g="${esc(g)}">${esc(g)}</button>`).join('');
    $('#c-genres').addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      const ta = $('#c-style'); const parts = ta.value.split(',').map((s) => s.trim()).filter(Boolean);
      const i = parts.findIndex((p) => p.toLowerCase() === c.dataset.g);
      if (i >= 0) parts.splice(i, 1); else parts.push(c.dataset.g);
      ta.value = parts.join(', '); ta.dispatchEvent(new Event('input'));
      c.classList.toggle('on', i < 0);
    });
    $('#c-style').addEventListener('input', () => {
      const parts = $('#c-style').value.toLowerCase().split(',').map((s) => s.trim());
      $$('#c-genres .chip').forEach((c) => c.classList.toggle('on', parts.includes(c.dataset.g)));
    });

    $('#tagbar').innerHTML = SONG_TAGS.map((t) => `<button type="button" data-tag="${t}">${t}</button>`).join('');
    $('#tagbar').addEventListener('click', (e) => { const b = e.target.closest('[data-tag]'); if (b) insertAtCursor($('#c-lyrics'), b.dataset.tag); });

    $$('#c-vocal .seg-btn').forEach((b) => b.addEventListener('click', () => {
      state.vocal = b.dataset.v; $$('#c-vocal .seg-btn').forEach((x) => x.classList.toggle('active', x === b));
    }));

    // Fine-tune
    $('#ft-body').innerHTML = fineTuneHTML('ct');
    bindSliders($('#ft-body'));
    const ftSync = () => $('#ft-body').classList.toggle('off', !$('#ft-on').checked);
    $('#ft-on').addEventListener('change', ftSync); ftSync();

    // Boost style
    $('#boost-style').addEventListener('click', async (e) => {
      const ta = $('#c-style');
      const content = ta.value.trim() || 'Pop, uplifting';
      const btn = e.currentTarget; btn.disabled = true; const orig = btn.innerHTML; btn.innerHTML = `${icon('wand')} Boosting…`;
      try {
        const data = await api('/api/v1/style/generate', { method: 'POST', body: { content } });
        if (data?.result) { ta.value = data.result.slice(0, limits(state.model).style); ta.dispatchEvent(new Event('input')); toast('Style boosted ✨', 'Tweak it however you like.', 'ok'); }
        else toast('No boost returned', data?.errorMessage || 'Try a different description.', 'err');
        refreshCredits();
      } catch (ex) { toast('Could not boost style', ex.message, 'err'); } finally { btn.disabled = false; btn.innerHTML = orig; }
    });

    $('#write-lyrics').addEventListener('click', () => {
      const idea = [$('#c-title').value, $('#c-style').value].filter(Boolean).join(' — ');
      goTab('lyrics');
      if (idea && !$('#l-prompt').value) { $('#l-prompt').value = `A song called ${idea}`.slice(0, 200); $('#l-prompt')._count?.(); }
      $('#l-prompt').focus();
    });

    initRefs();
    $('#create-form').addEventListener('submit', onCreate);
    setMode(state.mode);
  }

  // References (simple mode attachments)
  function initRefs() {
    $$('.ref-drop').forEach((d) => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = d.dataset.accept; input.multiple = d.dataset.max !== '1'; input.hidden = true;
      d.append(input);
      d.tabIndex = 0; d.setAttribute('role', 'button');
      d.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
      d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
      input.addEventListener('change', () => { [...input.files].forEach((f) => addRefFile(d.dataset.ref, f)); input.value = ''; });
      dropify(d, (files) => files.forEach((f) => addRefFile(d.dataset.ref, f)));
    });
    $('#ref-url-add').addEventListener('click', () => {
      const url = $('#ref-url').value.trim();
      if (!/^https?:\/\//i.test(url)) { toast('Paste a full http(s) URL', '', 'err'); return; }
      addRef({ id: uid(), kind: $('#ref-url-kind').value, name: url.split('/').pop() || url, url });
      $('#ref-url').value = '';
    });
    $('#ref-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]'); if (!b) return;
      state.refs = state.refs.filter((r) => r.id !== b.dataset.rm); renderRefs();
    });
  }
  function dropify(el, onFiles) {
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag'));
    el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('drag'); onFiles([...e.dataTransfer.files]); });
  }
  const REF_MAX = { image: 5, video: 1, audio: 5 };
  function addRef(ref) {
    if (state.refs.filter((r) => r.kind === ref.kind).length >= REF_MAX[ref.kind]) { toast(`Max ${REF_MAX[ref.kind]} ${ref.kind} reference(s)`, '', 'err'); return false; }
    state.refs.push(ref); renderRefs(); return true;
  }
  async function addRefFile(kind, file) {
    const ref = { id: uid(), kind, name: file.name, url: '', busy: true };
    if (!addRef(ref)) return;
    try { ref.url = await uploadFile(file); ref.busy = false; }
    catch (ex) { state.refs = state.refs.filter((r) => r !== ref); toast('Upload failed', ex.message, 'err'); }
    renderRefs();
  }
  function renderRefs() {
    const emo = { image: '🖼️', audio: '🎧', video: '🎬' };
    $('#ref-list').innerHTML = state.refs.map((r) => `<span class="ref-item ${r.busy ? 'busy' : ''}">${r.busy ? '' : emo[r.kind]}<span class="name" title="${esc(r.name)}">${esc(r.name)}</span><button type="button" data-rm="${r.id}" aria-label="Remove">${icon('x').replace('<svg', '<svg width="14" height="14"')}</button></span>`).join('');
  }

  async function onCreate(e) {
    e.preventDefault();
    const btn = $('#create-btn');
    const model = state.model;
    const instrumental = $('#instrumental').checked;
    const L = limits(model);
    let body; let label;

    if (state.mode === 'simple') {
      const prompt = $('#s-prompt').value.trim();
      const style = $('#s-style').value.trim();
      if (state.refs.some((r) => r.busy)) return toast('Hang on — still uploading references', '', 'warn');
      const byKind = (k) => state.refs.filter((r) => r.kind === k).map((r) => r.url);
      if (!prompt && !style && !state.refs.length) {
        $('#s-prompt').classList.add('invalid'); $('#s-prompt').focus();
        setTimeout(() => $('#s-prompt').classList.remove('invalid'), 1500);
        return toast('Tell us what to make', 'Describe the song, pick a vibe, or add a reference.', 'err');
      }
      if (prompt.length > L.simplePrompt) return toast('Description is too long', `Keep it under ${L.simplePrompt} characters.`, 'err');
      body = { customMode: false, instrumental, model, callBackUrl: callbackUrl(), prompt, style,
        imageUrls: byKind('image'), audioUrls: byKind('audio'), videoUrls: byKind('video') };
      label = prompt || style || 'Inspired by your references';
    } else {
      const title = $('#c-title').value.trim();
      const style = $('#c-style').value.trim();
      const lyrics = instrumental ? '' : $('#c-lyrics').value.trim();
      const negativeTags = $('#c-negative').value.trim();
      if (!style && !lyrics && !negativeTags) {
        $('#c-style').classList.add('invalid'); $('#c-style').focus();
        setTimeout(() => $('#c-style').classList.remove('invalid'), 1500);
        return toast('Add a style or some lyrics', 'Custom mode needs at least a style, lyrics, or styles to exclude.', 'err');
      }
      if (style.length > L.style) return toast('Style is too long', `${model} allows ${L.style} characters.`, 'err');
      if (lyrics.length > L.lyrics) return toast('Lyrics are too long', `${model} allows ${L.lyrics} characters.`, 'err');
      body = { customMode: true, instrumental, model, callBackUrl: callbackUrl(), title, style, negativeTags };
      if (lyrics) { if (isV6(model)) body.lyrics = lyrics; else body.prompt = lyrics; }
      if (!instrumental && state.vocal) body.vocalGender = state.vocal;
      if ($('#ft-on').checked) Object.assign(body, readFineTune($('#ft-body'), 'ct', model, { includeAudioWeight: !instrumental }));
      label = title || style || 'Custom song';
    }

    setBusy(btn, true, 'Sending to the studio…');
    try {
      const data = await api('/api/v1/generate', { method: 'POST', body });
      addJob({ kind: 'music', taskId: data.taskId, label, meta: { model, op: 'Create' } });
      toast('Your song is in the oven 🔥', 'First preview usually streams in ~30 seconds.', 'ok');
      refreshCredits();
    } catch (ex) { toast('Could not start generation', ex.message, 'err', 8000); }
    finally { setBusy(btn, false); }
  }

  // ---------------------------------------------------------------------------
  // Lyrics tab
  // ---------------------------------------------------------------------------
  function initLyrics() {
    $('#l-surprise').addEventListener('click', () => { const t = $('#l-prompt'); t.value = pick(LYRIC_IDEAS); t._count?.(); t.focus(); });
    $('#lyrics-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const prompt = $('#l-prompt').value.trim();
      if (!prompt) { $('#l-prompt').focus(); return toast('What should the lyrics be about?', '', 'err'); }
      const btn = $('#l-btn');
      setBusy(btn, true, 'Summoning the muse…');
      try {
        const data = await api('/api/v1/lyrics', { method: 'POST', body: { prompt, callBackUrl: callbackUrl() } });
        addJob({ kind: 'lyrics', taskId: data.taskId, label: prompt });
        renderLyricDrafts(true);
        refreshCredits();
      } catch (ex) { toast('Could not write lyrics', ex.message, 'err'); } finally { setBusy(btn, false); }
    });
    $('#lyric-results').addEventListener('click', (e) => {
      const b = e.target.closest('[data-use],[data-copy],[data-del]'); if (!b) return;
      const d = state.lyricDrafts.find((x) => x.id === (b.dataset.use || b.dataset.copy || b.dataset.del)); if (!d) return;
      if (b.dataset.use) {
        setMode('custom'); $('#instrumental').checked = false; syncInstrumental();
        $('#c-lyrics').value = d.text; $('#c-lyrics').dispatchEvent(new Event('input'));
        if (d.title && !$('#c-title').value) $('#c-title').value = d.title.slice(0, 80);
        goTab('create'); toast('Lyrics loaded', 'Add a style and hit Create.', 'ok');
        setTimeout(() => $('#c-style').focus(), 300);
      } else if (b.dataset.copy) {
        navigator.clipboard?.writeText(d.text).then(() => toast('Copied to clipboard', '', 'ok', 2000));
      } else {
        state.lyricDrafts = state.lyricDrafts.filter((x) => x !== d); store.set('lyricDrafts', state.lyricDrafts); renderLyricDrafts();
      }
    });
    renderLyricDrafts();
  }
  function lyricHTML(text) { return esc(text).replace(/^(\[[^\]]+\])$/gm, '<span class="sec">$1</span>'); }
  function renderLyricDrafts(pending = false) {
    const pend = pending || state.jobs.some((j) => j.kind === 'lyrics' && j.status === 'running');
    const cards = state.lyricDrafts.map((d) => `<article class="card lyric-card">
      <div class="row between gap-8"><h3 class="h3">${esc(d.title || 'Untitled')}</h3><button class="icon-btn" data-del="${d.id}" title="Remove draft" aria-label="Remove draft">${icon('x')}</button></div>
      <pre>${lyricHTML(d.text)}</pre>
      <div class="row gap-8"><button class="btn btn-primary btn-sm" data-use="${d.id}">${icon('spark').replace('<svg', '<svg width="16" height="16"')} Use in a song</button><button class="btn btn-ghost btn-sm" data-copy="${d.id}">Copy</button></div>
    </article>`).join('');
    const skel = pend ? `<article class="card lyric-card"><h3 class="h3">Writing…</h3><div class="job-msg">Rhyming “fire” with “desire”…</div><div class="bar indet"><i></i></div></article>` : '';
    $('#lyric-results').innerHTML = skel + cards;
  }

  // ---------------------------------------------------------------------------
  // Remix Lab
  // ---------------------------------------------------------------------------
  const TOOLS = [
    { id: 'cover', emoji: '🎭', name: 'Cover a song', desc: 'Keep the melody, reimagine the style.', endpoint: '/api/v1/generate/upload-cover',
      sources: 1, fields: ['title', 'style', 'lyrics', 'negativeTags', 'vocalGender', 'instrumental', 'model'], ft: { duration: true, persona: true } },
    { id: 'extend', emoji: '➡️', name: 'Extend my audio', desc: 'Continue your track seamlessly.', endpoint: '/api/v1/generate/upload-extend',
      sources: 1, fields: ['continueAt', 'title', 'style', 'lyrics', 'negativeTags', 'vocalGender', 'instrumental', 'model'], ft: { duration: false, persona: true } },
    { id: 'vocals', emoji: '🎤', name: 'Add vocals', desc: 'Put a singer on your instrumental.', endpoint: '/api/v1/generate/add-vocals',
      sources: 1, required: ['title', 'style', 'negativeTags'], fields: ['title', 'style', 'lyrics', 'negativeTags', 'vocalGender', 'model'], ft: { duration: false, persona: false } },
    { id: 'band', emoji: '🥁', name: 'Add instrumental', desc: 'Build a backing band under your vocals.', endpoint: '/api/v1/generate/add-instrumental',
      sources: 1, required: ['title', 'style', 'negativeTags'], styleKey: 'tags', fields: ['title', 'style', 'negativeTags', 'vocalGender', 'model'], ft: { duration: false, persona: false } },
    { id: 'mashup', emoji: '🔀', name: 'Mashup', desc: 'Blend two songs into something new.', endpoint: '/api/v1/generate/mashup',
      sources: 2, fields: ['title', 'style', 'lyrics', 'vocalGender', 'model'], ft: { duration: true, persona: true } },
    { id: 'sounds', emoji: '🔊', name: 'Sounds & loops', desc: 'Generate SFX, loops and one-shots.', endpoint: '/api/v1/generate/sounds', sources: 0 },
    { id: 'stems', emoji: '🎚️', name: 'Split stems', desc: 'Separate vocals & instruments from any file.', endpoint: '/api/v1/vocal-removal/generate', sources: 1 },
  ];
  let activeTool = null;
  const remixSources = [];

  function initRemix() {
    $('#tools').innerHTML = TOOLS.map((t) => `<button class="tool" data-tool="${t.id}"><span class="t-emoji">${t.emoji}</span><b>${t.name}</b><p>${t.desc}</p></button>`).join('');
    $('#tools').addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (b) openTool(b.dataset.tool); });
    $('#remix-form').addEventListener('submit', onRemix);
  }

  function sourceHTML(i, label) {
    return `<div class="field"><span class="label">${label}</span>
      <div class="drop" data-src="${i}" tabindex="0" role="button"><strong>Drop an audio file or click to browse</strong><span class="muted small">MP3, WAV, M4A · up to 8 minutes</span></div>
      <div class="src-or">or</div>
      <input class="input" data-src-url="${i}" placeholder="Paste a public audio URL" /></div>`;
  }

  function openTool(id) {
    activeTool = TOOLS.find((t) => t.id === id);
    remixSources.length = 0;
    $$('.tool').forEach((t) => t.classList.toggle('on', t.dataset.tool === id));
    const f = $('#remix-form');
    const t = activeTool;
    let html = `<div class="row between gap-8 wrap"><h3 class="h3">${t.emoji} ${t.name}</h3><span class="muted small">${t.desc}</span></div><div class="mt-16"></div>`;

    if (t.sources === 2) html += `<div class="grid-2">${sourceHTML(0, 'Song A')}${sourceHTML(1, 'Song B')}</div>`;
    else if (t.sources === 1) html += sourceHTML(0, t.id === 'stems' ? 'Audio to split (max 20 MB)' : 'Your audio');

    if (t.id === 'sounds') {
      html += `<div class="field"><div class="field-head"><label class="label" for="r-prompt">Describe the sound</label></div>
        <textarea class="input textarea" id="r-prompt" rows="3" maxlength="500" placeholder="Warm vinyl crackle with a mellow Rhodes chord loop"></textarea>
        <div class="field-foot"><span class="hint">Loops, SFX, textures, one-shots.</span><span class="counter" data-for="r-prompt"></span></div></div>
        <div class="grid-2"><div class="field"><label class="label" for="r-key">Key</label><select class="input select" id="r-key">${SOUND_KEYS.map((k) => `<option>${k}</option>`).join('')}</select></div>
        <div class="field"><label class="label" for="r-bpm">Tempo (BPM)</label><input class="input" id="r-bpm" type="number" min="1" max="300" placeholder="Auto" /></div></div>
        <div class="row gap-12 wrap"><label class="switch-row"><input type="checkbox" id="r-loop" checked /><span class="switch"></span><span>Seamless loop</span></label>
        <label class="switch-row"><input type="checkbox" id="r-grab" /><span class="switch"></span><span>Capture lyric subtitles</span></label></div>
        ${modelSelectHTML()}`;
    } else if (t.id === 'stems') {
      html += `<div class="field"><span class="label">Separation</span><div class="seg seg-sm" id="r-stemtype">
          <button type="button" class="seg-btn active" data-v="separate_vocal">Vocals + instrumental</button>
          <button type="button" class="seg-btn" data-v="split_stem">All instruments</button>
          <button type="button" class="seg-btn" data-v="split_stem_advanced">One instrument</button></div></div>
        <div class="field" id="r-stemname-wrap" hidden><label class="label" for="r-stemname">Instrument</label><select class="input select" id="r-stemname">${STEM_NAMES.map((n) => `<option>${n}</option>`).join('')}</select></div>`;
    } else {
      const has = (k) => t.fields.includes(k);
      const req = (k) => (t.required || []).includes(k);
      const star = (k) => (req(k) ? ' <span class="muted">*</span>' : '');
      if (has('continueAt')) html += `<div class="field"><label class="label" for="r-continueAt">Continue from (seconds)</label><input class="input" id="r-continueAt" type="number" min="1" step="0.1" placeholder="e.g. 45 — leave blank to continue from the end" /></div>`;
      html += `<div class="grid-2">
        ${has('title') ? `<div class="field"><label class="label" for="r-title">Title${star('title')}</label><input class="input" id="r-title" maxlength="80" placeholder="My remix" /></div>` : ''}
        ${has('negativeTags') ? `<div class="field"><label class="label" for="r-negative">Exclude styles${star('negativeTags')}</label><input class="input" id="r-negative" placeholder="lo-fi, distortion" value="${req('negativeTags') ? 'low quality, off-key' : ''}" /></div>` : ''}
      </div>`;
      if (has('style')) html += `<div class="field"><label class="label" for="r-style">${t.id === 'band' ? 'Instrumental style' : 'Style'}${star('style')}</label><input class="input" id="r-style" maxlength="1000" placeholder="${t.id === 'band' ? 'acoustic guitar, soft piano, warm strings' : 'jazz, smoky lounge, upright bass'}" /></div>`;
      if (has('lyrics')) html += `<div class="field" data-lyrics-wrap><label class="label" for="r-lyrics">Lyrics <span class="muted">(optional)</span></label><textarea class="input textarea mono" id="r-lyrics" rows="5" placeholder="[Verse]\n…"></textarea></div>`;
      html += `<div class="row gap-12 wrap mt-8">`;
      if (has('instrumental')) html += `<label class="switch-row"><input type="checkbox" id="r-instrumental" /><span class="switch"></span><span>Instrumental</span></label>`;
      if (has('vocalGender')) html += `<div class="seg seg-sm" id="r-vocal"><button type="button" class="seg-btn active" data-v="">Any voice</button><button type="button" class="seg-btn" data-v="f">Female</button><button type="button" class="seg-btn" data-v="m">Male</button></div>`;
      html += `</div>${modelSelectHTML()}
        <details class="disclosure mt-16"><summary>${icon('sliders').replace('<svg', '<svg width="18" height="18"')} Fine-tune</summary>
        <label class="switch-row"><input type="checkbox" id="rt-on" /><span class="switch"></span><span>Use fine-tune controls</span></label>
        <div class="ft-body off" id="rt-body">${fineTuneHTML('rt', t.ft)}</div></details>`;
    }

    html += `<button class="btn btn-primary btn-lg w-full mt-16" type="submit" id="r-go">${icon('spark').replace('<svg', '<svg width="18" height="18"')}<span class="btn-label">${t.id === 'stems' ? 'Split it' : t.id === 'sounds' ? 'Make the sound' : 'Start remix'}</span></button>`;
    f.innerHTML = html;
    f.hidden = false;
    hydrateIcons(f); counters(f); bindSliders(f);

    $$('[data-src]', f).forEach((d) => bindSource(d, Number(d.dataset.src)));
    $$('[data-src-url]', f).forEach((inp) => inp.addEventListener('input', () => { remixSources[Number(inp.dataset.srcUrl)] = inp.value.trim(); }));
    $$('.seg', f).forEach((seg) => seg.addEventListener('click', (e) => {
      const b = e.target.closest('.seg-btn'); if (!b) return;
      $$('.seg-btn', seg).forEach((x) => x.classList.toggle('active', x === b));
      if (seg.id === 'r-stemtype') $('#r-stemname-wrap').hidden = b.dataset.v !== 'split_stem_advanced';
    }));
    $('#rt-on', f)?.addEventListener('change', (e) => $('#rt-body').classList.toggle('off', !e.target.checked));
    $('#r-instrumental', f)?.addEventListener('change', (e) => { const w = $('[data-lyrics-wrap]', f); if (w) w.style.display = e.target.checked ? 'none' : ''; });
    const ms = $('#r-model', f);
    if (ms) { const sync = () => syncFineTuneNotes(f, ms.value); ms.addEventListener('change', sync); sync(); }
    f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function modelSelectHTML() {
    const opt = (m) => `<option value="${m.id}" ${m.id === state.model ? 'selected' : ''}>${m.name}${m.tag ? ` — ${m.tag}` : ''}</option>`;
    return `<div class="field mt-16"><label class="label" for="r-model">Model</label><select class="input select" id="r-model">
      <optgroup label="Current">${MODELS.map(opt).join('')}</optgroup><optgroup label="Legacy">${LEGACY_MODELS.map(opt).join('')}</optgroup></select></div>`;
  }

  function bindSource(drop, i) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'audio/*'; input.hidden = true;
    drop.after(input);
    const handle = async (file) => {
      if (!file) return;
      drop.innerHTML = `<div class="src-ok" style="color:var(--muted)"><span class="ref-item busy" style="border:0;background:none"></span>Uploading ${esc(file.name)}…</div>`;
      try {
        const url = await uploadFile(file);
        remixSources[i] = url;
        const u = $(`[data-src-url="${i}"]`); if (u) u.value = url;
        drop.innerHTML = `<div class="src-ok">✓ ${esc(file.name)}</div><audio controls src="${esc(url)}"></audio>`;
      } catch (ex) {
        drop.innerHTML = `<strong>Upload failed — try again</strong><span class="muted small">${esc(ex.message)}</span>`;
        toast('Upload failed', ex.message, 'err');
      }
    };
    drop.addEventListener('click', (e) => { if (e.target.tagName !== 'AUDIO') input.click(); });
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => handle(input.files[0]));
    dropify(drop, (files) => handle(files[0]));
  }

  async function onRemix(e) {
    e.preventDefault();
    const t = activeTool; if (!t) return;
    const f = $('#remix-form');
    const btn = $('#r-go');
    const val = (id) => $(`#${id}`, f)?.value.trim() ?? '';
    const segVal = (id) => $(`#${id} .seg-btn.active`, f)?.dataset.v || '';
    const srcs = remixSources.filter(Boolean);
    if (t.sources && srcs.length < t.sources) return toast(t.sources === 2 ? 'Add both songs first' : 'Add your audio first', 'Upload a file or paste a URL.', 'err');
    if (srcs.some((s) => !/^https?:\/\//i.test(s))) return toast('Audio URL must start with http(s)://', '', 'err');

    let body; let kind = 'music'; let label;
    const model = val('r-model') || state.model;

    if (t.id === 'sounds') {
      const prompt = val('r-prompt');
      if (!prompt) { $('#r-prompt').focus(); return toast('Describe the sound you want', '', 'err'); }
      body = { prompt, model, callBackUrl: callbackUrl(), soundLoop: $('#r-loop').checked, soundKey: val('r-key'), grabLyrics: $('#r-grab').checked };
      const bpm = Number(val('r-bpm')); if (bpm) body.soundTempo = clamp(Math.round(bpm), 1, 300);
      label = prompt;
    } else if (t.id === 'stems') {
      const type = segVal('r-stemtype');
      body = { audioUrl: srcs[0], type, callBackUrl: callbackUrl() };
      if (type === 'split_stem_advanced') body.stemName = val('r-stemname');
      kind = 'stems'; label = 'Stems from your upload';
    } else {
      for (const k of t.required || []) {
        const id = k === 'negativeTags' ? 'r-negative' : `r-${k}`;
        if (!val(id)) { $(`#${id}`, f)?.focus(); $(`#${id}`, f)?.classList.add('invalid'); setTimeout(() => $(`#${id}`, f)?.classList.remove('invalid'), 1500); return toast('Please fill in the required fields', 'Title, style and excluded styles are required for this tool.', 'err'); }
      }
      const instrumental = $('#r-instrumental', f)?.checked || false;
      const lyrics = instrumental ? '' : val('r-lyrics');
      body = { model, callBackUrl: callbackUrl(), title: val('r-title'), negativeTags: val('r-negative') };
      body[t.styleKey || 'style'] = val('r-style');
      if (lyrics) { if (isV6(model)) body.lyrics = lyrics; else body.prompt = lyrics; }
      if (t.fields.includes('instrumental')) body.instrumental = instrumental;
      const vg = segVal('r-vocal'); if (vg && !instrumental) body.vocalGender = vg;
      if (t.fields.includes('continueAt') && val('r-continueAt')) body.continueAt = Number(val('r-continueAt'));
      if ($('#rt-on', f)?.checked) Object.assign(body, readFineTune(f, 'rt', model, { includeAudioWeight: !instrumental }));
      if (t.sources === 2) body.uploadUrlList = srcs.slice(0, 2); else body.uploadUrl = srcs[0];
      label = body.title || `${t.name}${body.style || body.tags ? ' — ' + (body.style || body.tags) : ''}`;
    }

    setBusy(btn, true, 'Sending…');
    try {
      const data = await api(t.endpoint, { method: 'POST', body });
      if (kind === 'stems') {
        const track = upsertTrack({ id: 'upload-' + data.taskId, taskId: data.taskId, title: 'Uploaded audio (stems)', tags: body.type.replace(/_/g, ' '), audio_url: srcs[0], upload: true, createdAt: Date.now() });
        addJob({ kind: 'stems', taskId: data.taskId, label, trackId: track.id });
      } else {
        addJob({ kind: 'music', taskId: data.taskId, label, meta: { model, op: t.name } });
      }
      toast(`${t.emoji} ${t.name} started`, 'Watch the progress in the Create tab or your Library.', 'ok');
      refreshCredits();
    } catch (ex) { toast(`${t.name} failed`, ex.message, 'err', 8000); } finally { setBusy(btn, false); }
  }

  // ---------------------------------------------------------------------------
  // Jobs & polling
  // ---------------------------------------------------------------------------
  const JOB_META = {
    music: { emoji: '🎵', path: '/api/v1/generate/record-info' },
    lyrics: { emoji: '✍️', path: '/api/v1/lyrics/record-info' },
    wav: { emoji: '💿', path: '/api/v1/wav/record-info' },
    stems: { emoji: '🎚️', path: '/api/v1/vocal-removal/record-info' },
    video: { emoji: '🎬', path: '/api/v1/mp4/record-info' },
    cover: { emoji: '🖼️', path: '/api/v1/suno/cover/record-info' },
    midi: { emoji: '🎹', path: '/api/v1/midi/record-info' },
  };
  const MUSIC_PROGRESS = { PENDING: 12, TEXT_SUCCESS: 40, FIRST_SUCCESS: 75, SUCCESS: 100 };
  const MUSIC_FAIL = ['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR', 'GENERATE_LYRICS_FAILED'];
  const FLAG_FAIL = ['CREATE_TASK_FAILED', 'GENERATE_WAV_FAILED', 'GENERATE_AUDIO_FAILED', 'GENERATE_MP4_FAILED', 'CALLBACK_EXCEPTION'];

  function addJob(j) {
    const job = { id: uid(), status: 'running', progress: 5, msg: pick(COOKING), createdAt: Date.now(), ...j };
    state.jobs.unshift(job);
    state.jobs = state.jobs.slice(0, 30);
    saveJobs(); renderJobs(); pollSoon();
    return job;
  }
  function updateJob(job, patch) { Object.assign(job, patch); saveJobs(); renderJobs(); }

  function renderJobs() {
    const running = state.jobs.filter((j) => j.status === 'running').length;
    $('#jobs-count').textContent = running ? `${running} in progress` : '';
    const list = state.jobs.slice(0, 8);
    if (!list.length) { $('#jobs').innerHTML = '<p class="empty-mini">Nothing cooking yet. Your generations will show up here live.</p>'; return; }
    $('#jobs').innerHTML = list.map((j) => {
      const m = JOB_META[j.kind] || JOB_META.music;
      const cls = j.status === 'done' ? 'done' : j.status === 'failed' ? 'failed' : '';
      const ico = j.status === 'done' ? '✓' : j.status === 'failed' ? '!' : m.emoji;
      const indet = j.kind !== 'music' && j.status === 'running';
      const actions = j.status === 'failed' && j.retryable !== false ? `<div class="job-actions"><button class="btn btn-ghost btn-sm" data-job-retry="${j.id}">Check again</button><button class="btn btn-ghost btn-sm" data-job-dismiss="${j.id}">Dismiss</button></div>`
        : j.status === 'done' && j.kind === 'music' ? `<div class="job-actions"><button class="btn btn-soft btn-sm" data-job-play="${j.id}">${icon('play').replace('<svg', '<svg width="14" height="14"')} Play</button><button class="btn btn-ghost btn-sm" data-job-dismiss="${j.id}">Clear</button></div>`
        : j.status !== 'running' ? `<div class="job-actions"><button class="btn btn-ghost btn-sm" data-job-dismiss="${j.id}">Clear</button></div>` : '';
      return `<div class="job ${cls}"><div class="job-top"><span class="job-ico">${ico}</span><span class="job-title" title="${esc(j.label)}">${esc(j.label)}</span></div>
        ${j.status === 'running' ? `<div class="bar ${indet ? 'indet' : ''}" style="--w:${j.progress}%"><i></i></div>` : ''}
        <div class="job-msg">${esc(j.msg || '')}</div>${actions}</div>`;
    }).join('');
    renderLyricDrafts();
  }

  let pollTimer = null; let polling = false;
  function pollSoon(ms = 1500) { clearTimeout(pollTimer); pollTimer = setTimeout(pollAll, ms); }
  function resumeJobs() { if (state.jobs.some((j) => j.status === 'running')) pollSoon(500); }

  async function pollAll() {
    if (polling || !state.key) return;
    polling = true;
    const running = state.jobs.filter((j) => j.status === 'running');
    for (const job of running) {
      try { await pollJob(job); } catch (ex) {
        if (ex.code === 401) { polling = false; return lock('Your API key is no longer valid.'); }
        job.errors = (job.errors || 0) + 1;
        if (job.errors > 5) updateJob(job, { status: 'failed', msg: ex.message });
      }
      if (job.status === 'running' && Date.now() - job.createdAt > JOB_TIMEOUT_MS) updateJob(job, { status: 'failed', msg: 'This is taking unusually long. You can check again later.' });
    }
    polling = false;
    if (state.jobs.some((j) => j.status === 'running')) pollSoon(POLL_MS);
  }

  async function pollJob(job) {
    const meta = JOB_META[job.kind];
    const data = await api(meta.path, { query: { taskId: job.taskId } });
    if (!data) return;
    job.errors = 0;
    const cook = () => (Math.random() < .5 ? pick(COOKING) : job.msg);

    if (job.kind === 'music') {
      const st = data.status;
      const tracks = data.response?.sunoData || [];
      if (tracks.length) ingestTracks(tracks, job, st !== 'SUCCESS');
      if (st === 'SUCCESS') {
        updateJob(job, { status: 'done', progress: 100, msg: `${tracks.length} track${tracks.length === 1 ? '' : 's'} ready — enjoy!`, trackIds: tracks.map((t) => t.id) });
        toast('Your song is ready! 🎉', job.label, 'ok'); confetti(); refreshCredits();
        if (!state.current && tracks[0]) playTrack(tracks[0].id);
      } else if (MUSIC_FAIL.includes(st)) {
        updateJob(job, { status: 'failed', retryable: false, msg: data.errorMessage || (st === 'SENSITIVE_WORD_ERROR' ? 'The prompt was flagged by the content filter. Try rephrasing.' : 'Generation failed.') });
        toast('Generation failed', job.msg, 'err', 8000); refreshCredits();
      } else {
        const firstNow = st === 'FIRST_SUCCESS' && job.lastStatus !== 'FIRST_SUCCESS';
        updateJob(job, { progress: MUSIC_PROGRESS[st] || job.progress, lastStatus: st, trackIds: tracks.map((t) => t.id),
          msg: st === 'FIRST_SUCCESS' ? 'First take is streaming — press play!' : st === 'TEXT_SUCCESS' ? 'Lyrics written, recording now…' : cook() });
        if (firstNow) toast('First preview is live 🎧', 'Stream it now while the final mix finishes.', 'info');
      }
    } else if (job.kind === 'lyrics') {
      if (data.status === 'SUCCESS') {
        const drafts = (data.response?.data || []).filter((d) => d.text).map((d) => ({ id: uid(), title: d.title, text: d.text, prompt: job.label }));
        state.lyricDrafts = [...drafts, ...state.lyricDrafts].slice(0, 30); store.set('lyricDrafts', state.lyricDrafts);
        updateJob(job, { status: 'done', msg: `${drafts.length} draft${drafts.length === 1 ? '' : 's'} ready in the Lyrics tab` });
        toast('Lyrics are ready ✍️', 'Pick your favorite in the Lyrics tab.', 'ok'); refreshCredits();
      } else if (['CREATE_TASK_FAILED', 'GENERATE_LYRICS_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(data.status)) {
        updateJob(job, { status: 'failed', retryable: false, msg: data.errorMessage || 'Lyrics generation failed.' });
      } else updateJob(job, { msg: 'Finding the right words…' });
    } else if (job.kind === 'cover' || job.kind === 'midi') {
      const f = data.successFlag;
      const ok = job.kind === 'cover' ? f === 1 || f === '1' || f === 'SUCCESS' : f === 1 || f === '1' || f === 'SUCCESS';
      const bad = job.kind === 'cover' ? [3, '3'].includes(f) : [2, 3, '2', '3'].includes(f);
      if (ok) {
        const t = findTrack(job.trackId);
        if (t) {
          t.assets = t.assets || {};
          if (job.kind === 'cover') t.assets.covers = data.response?.images || [];
          else t.assets.midi = data.midiData || null;
          saveLibrary(); renderLibrary(); refreshDetail(t.id);
        }
        updateJob(job, { status: 'done', msg: job.kind === 'cover' ? 'Cover art ready' : 'MIDI ready to download' });
        toast(job.kind === 'cover' ? 'Cover art ready 🖼️' : 'MIDI ready 🎹', job.label, 'ok'); refreshCredits();
      } else if (bad) updateJob(job, { status: 'failed', retryable: false, msg: data.errorMessage || 'Task failed.' });
      else updateJob(job, { msg: 'Working on it…' });
    } else {
      const f = data.successFlag;
      if (f === 'SUCCESS') {
        const t = findTrack(job.trackId);
        const r = data.response || {};
        if (t) {
          t.assets = t.assets || {};
          if (job.kind === 'wav') t.assets.wav = r.audioWavUrl;
          if (job.kind === 'video') t.assets.video = r.videoUrl;
          if (job.kind === 'stems') { t.assets.stems = r; t.assets.stemsTaskId = job.taskId; }
          saveLibrary(); renderLibrary(); refreshDetail(t.id);
        }
        const names = { wav: 'WAV file ready 💿', video: 'Music video ready 🎬', stems: 'Stems are ready 🎚️' };
        updateJob(job, { status: 'done', msg: 'Done — open the track to download' });
        toast(names[job.kind], job.label, 'ok'); refreshCredits();
      } else if (FLAG_FAIL.includes(f)) {
        updateJob(job, { status: 'failed', retryable: false, msg: data.errorMessage || 'Task failed.' });
      } else updateJob(job, { msg: { wav: 'Rendering lossless audio…', video: 'Rendering visuals…', stems: 'Pulling the mix apart…' }[job.kind] || 'Working…' });
    }
  }

  // ---------------------------------------------------------------------------
  // Library
  // ---------------------------------------------------------------------------
  const findTrack = (id) => state.library.find((t) => t.id === id);
  function upsertTrack(t) {
    const ex = findTrack(t.id);
    if (ex) { Object.assign(ex, Object.fromEntries(Object.entries(t).filter(([, v]) => v !== '' && v != null))); saveLibrary(); return ex; }
    state.library.unshift(t); saveLibrary(); return t;
  }
  function ingestTracks(items, job, streaming) {
    items.forEach((s) => {
      if (!s.id) return;
      upsertTrack({
        id: s.id, taskId: job.taskId, title: s.title || job.label, tags: s.tags || '', prompt: s.prompt || '',
        audio_url: s.audio_url || s.source_audio_url || '', stream_audio_url: s.stream_audio_url || s.source_stream_audio_url || '',
        image_url: s.image_url || s.source_image_url || '', duration: s.duration || 0, model: s.model_name || job.meta?.model || '',
        op: job.meta?.op || '', streaming: streaming && !s.audio_url, createdAt: findTrack(s.id)?.createdAt || Date.now(),
      });
    });
    renderLibrary();
  }

  function artHTML(t, { fab = true } = {}) {
    const hue = hashHue(t.title || t.id);
    const bg = t.image_url ? '' : `style="background:linear-gradient(135deg,hsl(${hue} 70% 55%),hsl(${(hue + 60) % 360} 75% 50%))"`;
    return `<div class="art" ${bg}>${t.image_url ? `<img src="${esc(t.image_url)}" alt="" loading="lazy" onerror="this.remove()"/>` : `<span class="gen-art">${esc((t.title || '♪').trim()[0] || '♪')}</span>`}
      ${t.streaming ? '<span class="pill live">Streaming</span>' : t.op && t.op !== 'Create' ? `<span class="pill">${esc(t.op)}</span>` : ''}
      ${fab ? `<button class="play-fab" data-play="${esc(t.id)}" aria-label="Play ${esc(t.title)}">${icon(state.current === t.id && !$('#audio').paused ? 'pause' : 'play')}</button>` : ''}</div>`;
  }

  function renderLibrary() {
    const q = $('#lib-search').value.trim().toLowerCase();
    const items = state.library.filter((t) => !q || `${t.title} ${t.tags}`.toLowerCase().includes(q));
    $('#lib-count').textContent = state.library.length;
    $('#lib-empty').hidden = state.library.length > 0;
    $('#library').innerHTML = items.map((t) => {
      const a = t.assets || {};
      const chips = [a.wav && 'WAV', a.video && 'MP4', a.stems && 'STEMS', a.midi && 'MIDI'].filter(Boolean).map((x) => `<span>${x}</span>`).join('');
      return `<article class="track ${state.current === t.id ? 'playing' : ''}" data-id="${esc(t.id)}">
        ${artHTML(t)}
        <div class="t-body"><div class="t-title" title="${esc(t.title)}">${esc(t.title || 'Untitled')}</div>
        <div class="t-tags">${esc(t.tags || t.prompt?.slice(0, 80) || '')}</div>
        <div class="t-foot"><div class="t-assets">${chips}</div><span class="t-dur">${t.duration ? fmtTime(t.duration) : t.streaming ? 'live' : ''}</span></div></div></article>`;
    }).join('');
    if (q && !items.length) $('#library').innerHTML = '<p class="muted">No tracks match that search.</p>';
    state.queue = items.filter((t) => t.audio_url || t.stream_audio_url).map((t) => t.id);
  }

  function initLibrary() {
    $('#lib-search').addEventListener('input', renderLibrary);
    $('#library').addEventListener('click', (e) => {
      const p = e.target.closest('[data-play]');
      if (p) { e.stopPropagation(); return togglePlay(p.dataset.play); }
      const card = e.target.closest('.track'); if (card) openDetail(card.dataset.id);
    });
    $('#import-btn').addEventListener('click', () => {
      const body = openModal('Import a task', `<p class="muted" style="margin-top:0">Paste the <b>taskId</b> of any song you generated with this API key (e.g. from another device or the Suno API dashboard).</p>
        <form id="imp-form"><input class="input mono" id="imp-id" placeholder="taskId" required /><button class="btn btn-primary w-full mt-16" type="submit"><span class="btn-label">Import</span></button></form>`);
      $('#imp-form', body).addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = $('#imp-id').value.trim(); if (!id) return;
        const btn = e.submitter; setBusy(btn, true, 'Looking it up…');
        try {
          const data = await api('/api/v1/generate/record-info', { query: { taskId: id } });
          const tracks = data?.response?.sunoData || [];
          if (!tracks.length) throw new Error(data?.status ? `Task status: ${data.status}` : 'No tracks found for that task.');
          ingestTracks(tracks, { taskId: id, label: 'Imported', meta: { op: 'Imported' } }, data.status !== 'SUCCESS');
          closeModal(); toast(`Imported ${tracks.length} track(s)`, '', 'ok');
        } catch (ex) { toast('Import failed', ex.message, 'err'); } finally { setBusy(btn, false); }
      });
    });
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => goTab(b.dataset.goto)));
  }

  // ---------------------------------------------------------------------------
  // Track detail + actions
  // ---------------------------------------------------------------------------
  let detailId = null;
  function refreshDetail(id) { if (detailId === id && !$('#modal').hidden && $('#modal-body [data-detail]')) openDetail(id, true); }

  function openDetail(id, keepScroll = false) {
    const t = findTrack(id); if (!t) return;
    detailId = id;
    const a = t.assets || {};
    const canAct = !t.upload && !t.streaming;
    const scroll = keepScroll ? $('#modal-body').scrollTop : 0;
    const action = (key, emoji, label, sub) => `<button class="action" data-act="${key}"><span class="a-emoji">${emoji}</span><span>${label}<small>${sub}</small></span></button>`;
    const stemRows = a.stems ? Object.entries(a.stems).filter(([k, v]) => STEM_LABELS[k] && v && k !== 'originUrl').map(([k, v]) => `<div class="stem"><span>${STEM_LABELS[k]}</span><audio controls preload="none" src="${esc(v)}"></audio><a class="btn btn-ghost btn-sm" href="${esc(v)}" target="_blank" rel="noopener" download>${icon('download').replace('<svg', '<svg width="16" height="16"')}</a></div>`).join('') : '';
    const origin = a.stems?.originData?.length && !stemRows ? a.stems.originData.map((o) => `<div class="stem"><span>${esc(o.stem_type_group_name || 'Stem')}</span><audio controls preload="none" src="${esc(o.audio_url)}"></audio><a class="btn btn-ghost btn-sm" href="${esc(o.audio_url)}" target="_blank" rel="noopener">${icon('download').replace('<svg', '<svg width="16" height="16"')}</a></div>`).join('') : '';

    const html = `<div data-detail>
      <div class="detail-top">${artHTML(t)}
        <div class="detail-meta">
          <div class="t-title">${esc(t.title || 'Untitled')}</div>
          <div class="kv">${t.model ? `<span>${esc(t.model)}</span>` : ''}${t.duration ? `<span>${fmtTime(t.duration)}</span>` : ''}${t.op ? `<span>${esc(t.op)}</span>` : ''}${t.streaming ? '<span>Streaming preview</span>' : ''}</div>
          ${t.tags ? `<p class="muted small" style="margin:0">${esc(t.tags)}</p>` : ''}
          <div class="row gap-8 wrap mt-8">
            <button class="btn btn-primary btn-sm" data-play="${esc(t.id)}">${icon('play').replace('<svg', '<svg width="15" height="15"')} Play</button>
            ${t.audio_url ? `<a class="btn btn-soft btn-sm" href="${esc(t.audio_url)}" target="_blank" rel="noopener" download>${icon('download').replace('<svg', '<svg width="15" height="15"')} MP3</a>` : ''}
            ${canAct ? `<button class="btn btn-ghost btn-sm" data-act="karaoke">${icon('mic').replace('<svg', '<svg width="15" height="15"')} Sing along</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-act="copy">Copy IDs</button>
          </div>
        </div>
      </div>
      ${canAct ? `<div class="actions-grid">
        ${action('extend', '➡️', 'Extend', 'Keep the song going')}
        ${action('replace', '✂️', 'Replace section', 'Rewrite 10s+ of it')}
        ${action('stems', '🎚️', 'Split stems', 'Vocals & instruments')}
        ${action('wav', '💿', 'Get WAV', 'Lossless audio')}
        ${action('video', '🎬', 'Music video', 'MP4 visualizer')}
        ${action('cover', '🖼️', 'Cover art', 'New artwork')}
        ${action('persona', '🧬', 'Create persona', 'Reuse this voice/vibe')}
        ${action('refresh', '🔄', 'Refresh links', 'Re-fetch audio URLs')}
      </div>` : t.streaming ? '<p class="fine">Actions unlock once the final mix is ready (usually a minute or two).</p>' : ''}
      <div class="assets">
        ${a.wav ? `<div class="asset"><div class="asset-head">💿 WAV <a class="btn btn-soft btn-sm" href="${esc(a.wav)}" target="_blank" rel="noopener" download>Download</a></div></div>` : ''}
        ${a.video ? `<div class="asset"><div class="asset-head">🎬 Music video <a class="btn btn-soft btn-sm" href="${esc(a.video)}" target="_blank" rel="noopener" download>Download</a></div><video controls preload="none" src="${esc(a.video)}"></video></div>` : ''}
        ${stemRows || origin ? `<div class="asset"><div class="asset-head">🎚️ Stems ${a.stemsTaskId ? `<button class="btn btn-soft btn-sm" data-act="midi">🎹 ${a.midi ? 'Regenerate' : 'Make'} MIDI</button>` : ''}</div><div class="stems">${stemRows || origin}</div></div>` : ''}
        ${a.midi ? `<div class="asset"><div class="asset-head">🎹 MIDI <button class="btn btn-soft btn-sm" data-act="midi-dl">Download .mid</button></div><p class="muted small" style="margin:0">${(a.midi.instruments || []).map((i) => `${esc(i.name)} (${i.notes?.length || 0} notes)`).join(' · ')}</p></div>` : ''}
        ${a.covers?.length ? `<div class="asset"><div class="asset-head">🖼️ Cover art</div><div class="covers">${a.covers.map((c) => `<a href="${esc(c)}" target="_blank" rel="noopener"><img src="${esc(c)}" alt="Cover option" loading="lazy"/></a>`).join('')}</div><p class="fine" style="margin:0">Click an image to open it. <button class="chip chip-ghost" data-act="use-cover">Use first as artwork</button></p></div>` : ''}
        ${a.personaId ? `<div class="asset"><div class="asset-head">🧬 Persona <code class="mono">${esc(a.personaId)}</code></div><p class="muted small" style="margin:0">Available in Fine-tune → Persona when creating.</p></div>` : ''}
        ${t.prompt && !t.upload ? `<div class="asset"><div class="asset-head">📝 Lyrics / prompt <button class="btn btn-ghost btn-sm" data-act="reuse">Reuse in Create</button></div><pre class="lyrics-view">${lyricHTML(t.prompt)}</pre></div>` : ''}
      </div>
      <div class="row between mt-16"><span class="muted small mono">task ${esc(t.taskId || '')}</span><button class="btn btn-danger btn-sm" data-act="delete">Remove from library</button></div>
    </div>`;
    const body = openModal(t.title || 'Track', html, { wide: true, onClose: () => { detailId = null; } });
    body.scrollTop = scroll;
    body.onclick = (e) => {
      const p = e.target.closest('[data-play]'); if (p) return togglePlay(p.dataset.play);
      const b = e.target.closest('[data-act]'); if (b) trackAction(t, b.dataset.act, b);
    };
  }

  async function simpleTask(t, kind, path, body, btn, label) {
    btn && (btn.disabled = true);
    try {
      const data = await api(path, { method: 'POST', body: { callBackUrl: callbackUrl(), ...body } });
      addJob({ kind, taskId: data.taskId, label: `${label} · ${t.title}`, trackId: t.id });
      toast(`${label} started`, 'We’ll let you know when it’s ready.', 'ok');
      refreshCredits();
    } catch (ex) {
      // Some endpoints return the existing task when it was already done.
      if (ex.code === 409 || /exist/i.test(ex.message)) toast('Already created', 'Use “Check again” in the studio panel or refresh links.', 'warn');
      else toast(`${label} failed`, ex.message, 'err', 8000);
    } finally { btn && (btn.disabled = false); }
  }

  function trackAction(t, act, btn) {
    const ids = { taskId: t.taskId, audioId: t.id };
    switch (act) {
      case 'wav': return simpleTask(t, 'wav', '/api/v1/wav/generate', ids, btn, 'WAV conversion');
      case 'cover': return simpleTask(t, 'cover', '/api/v1/suno/cover/generate', { taskId: t.taskId }, btn, 'Cover art');
      case 'midi': return simpleTask(t, 'midi', '/api/v1/midi/generate', { taskId: t.assets.stemsTaskId }, btn, 'MIDI');
      case 'midi-dl': return downloadMidi(t);
      case 'video': return formVideo(t);
      case 'stems': return formStems(t);
      case 'extend': return formExtend(t);
      case 'replace': return formReplace(t);
      case 'persona': return formPersona(t);
      case 'karaoke': closeModal(); return openKaraoke(t.id);
      case 'refresh': return refreshTrack(t, btn);
      case 'use-cover': t.image_url = t.assets.covers[0]; saveLibrary(); renderLibrary(); openDetail(t.id, true); if (state.current === t.id) updatePlayerMeta(t); return;
      case 'copy': navigator.clipboard?.writeText(`taskId: ${t.taskId}\naudioId: ${t.id}`).then(() => toast('IDs copied', '', 'ok', 2000)); return;
      case 'reuse':
        closeModal(); setMode('custom');
        $('#c-title').value = t.title || ''; $('#c-style').value = t.tags || ''; $('#c-lyrics').value = t.prompt || '';
        ['#c-style', '#c-lyrics'].forEach((s) => $(s).dispatchEvent(new Event('input')));
        goTab('create'); return;
      case 'delete':
        if (!confirm(`Remove “${t.title}” from your library? (It stays on Suno’s servers for 14 days.)`)) return;
        state.library = state.library.filter((x) => x.id !== t.id); saveLibrary();
        if (state.current === t.id) { $('#audio').pause(); state.current = null; $('#player').hidden = true; }
        closeModal(); renderLibrary(); return;
    }
  }

  async function refreshTrack(t, btn) {
    btn.disabled = true;
    try {
      const data = await api('/api/v1/generate/record-info', { query: { taskId: t.taskId } });
      ingestTracks(data?.response?.sunoData || [], { taskId: t.taskId, label: t.title, meta: { op: t.op, model: t.model } }, data?.status !== 'SUCCESS');
      toast('Links refreshed', '', 'ok', 2500); openDetail(t.id, true);
    } catch (ex) { toast('Could not refresh', ex.message, 'err'); } finally { btn.disabled = false; }
  }

  function backToDetail() { return `<button type="button" class="btn btn-ghost" data-back>← Back</button>`; }
  function wireBack(body, t) { $('[data-back]', body)?.addEventListener('click', () => openDetail(t.id)); }

  function formVideo(t) {
    const body = openModal('🎬 Make a music video', `<form id="f"><p class="muted" style="margin-top:0">Generates an MP4 with animated visuals for “${esc(t.title)}”.</p>
      <div class="grid-2"><div class="field"><label class="label" for="v-author">Artist name</label><input class="input" id="v-author" maxlength="50" placeholder="Your artist name" /></div>
      <div class="field"><label class="label" for="v-domain">Watermark / brand</label><input class="input" id="v-domain" maxlength="50" placeholder="yoursite.com" /></div></div>
      <div class="row gap-8">${backToDetail(t)}<button class="btn btn-primary" style="flex:1" type="submit"><span class="btn-label">Create video</span></button></div></form>`);
    wireBack(body, t);
    $('#f', body).addEventListener('submit', async (e) => { e.preventDefault(); await simpleTask(t, 'video', '/api/v1/mp4/generate', { taskId: t.taskId, audioId: t.id, author: $('#v-author').value.trim(), domainName: $('#v-domain').value.trim() }, e.submitter, 'Music video'); openDetail(t.id); });
  }

  function formStems(t) {
    const body = openModal('🎚️ Split stems', `<form id="f">
      <div class="field"><span class="label">What should we separate?</span>
      <div class="seg seg-sm" id="st-type"><button type="button" class="seg-btn active" data-v="separate_vocal">Vocals + instrumental</button><button type="button" class="seg-btn" data-v="split_stem">Every instrument</button><button type="button" class="seg-btn" data-v="split_stem_advanced">One instrument</button></div></div>
      <div class="field" id="st-name-wrap" hidden><label class="label" for="st-name">Instrument</label><select class="input select" id="st-name">${STEM_NAMES.map((n) => `<option>${n}</option>`).join('')}</select></div>
      <p class="fine">“Every instrument” returns up to 12 stems (drums, bass, guitar, keys, strings…) and costs more credits.</p>
      <div class="row gap-8 mt-16">${backToDetail(t)}<button class="btn btn-primary" style="flex:1" type="submit"><span class="btn-label">Split</span></button></div></form>`);
    wireBack(body, t);
    $('#st-type', body).addEventListener('click', (e) => { const b = e.target.closest('.seg-btn'); if (!b) return; $$('#st-type .seg-btn').forEach((x) => x.classList.toggle('active', x === b)); $('#st-name-wrap').hidden = b.dataset.v !== 'split_stem_advanced'; });
    $('#f', body).addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = $('#st-type .seg-btn.active').dataset.v;
      await simpleTask(t, 'stems', '/api/v1/vocal-removal/generate', { taskId: t.taskId, audioId: t.id, type, stemName: type === 'split_stem_advanced' ? $('#st-name').value : undefined }, e.submitter, 'Stem split');
      openDetail(t.id);
    });
  }

  function formExtend(t) {
    const body = openModal('➡️ Extend this song', `<form id="f">
      <div class="field">${t.duration
        ? sliderHTML('x-at', 'Continue from', 1, Math.max(2, Math.floor(t.duration)), 1, Math.max(1, Math.floor(t.duration) - 1), '0:00', fmtTime(t.duration))
        : '<label class="label" for="x-at">Continue from (seconds)</label><input class="input" id="x-at" type="number" min="1" placeholder="seconds" />'}</div>
      <p class="fine" style="margin-top:-8px">Tip: start a little before the end to rewrite the outro.</p>
      <div class="grid-2"><div class="field"><label class="label" for="x-title">Title</label><input class="input" id="x-title" maxlength="80" value="${esc((t.title || '') + ' (Extended)').slice(0, 80)}" /></div>
      <div class="field"><label class="label" for="x-model">Model</label><select class="input select" id="x-model">${ALL_MODELS.map((m) => `<option value="${m.id}" ${m.id === state.model ? 'selected' : ''}>${m.name}</option>`).join('')}</select></div></div>
      <div class="field"><label class="label" for="x-style">Style</label><input class="input" id="x-style" value="${esc(t.tags || '')}" maxlength="1000" /></div>
      <div class="field"><label class="label" for="x-lyrics">Lyrics for the new part <span class="muted">(optional)</span></label><textarea class="input textarea mono" id="x-lyrics" rows="5" placeholder="[Verse 3]\n…"></textarea></div>
      <label class="switch-row"><input type="checkbox" id="x-inst" /><span class="switch"></span><span>Instrumental continuation</span></label>
      <div class="row gap-8 mt-16">${backToDetail(t)}<button class="btn btn-primary" style="flex:1" type="submit"><span class="btn-label">Extend</span></button></div></form>`);
    wireBack(body, t); bindSliders(body);
    const out = $('#x-at-out', body); const r = $('#x-at', body);
    if (out && r?.type === 'range') { const u = () => { out.textContent = fmtTime(r.value); }; r.addEventListener('input', u); u(); }
    $('#f', body).addEventListener('submit', async (e) => {
      e.preventDefault();
      const model = $('#x-model').value; const inst = $('#x-inst').checked; const lyr = inst ? '' : $('#x-lyrics').value.trim();
      const b = { audioId: t.id, taskId: t.taskId, model, continueAt: Number($('#x-at').value) || undefined, title: $('#x-title').value.trim(), style: $('#x-style').value.trim(), instrumental: inst };
      if (lyr) { if (isV6(model)) b.lyrics = lyr; else b.prompt = lyr; }
      const btn = e.submitter; setBusy(btn, true, 'Sending…');
      try {
        const data = await api('/api/v1/generate/extend', { method: 'POST', body: { callBackUrl: callbackUrl(), ...b } });
        addJob({ kind: 'music', taskId: data.taskId, label: b.title || `Extend · ${t.title}`, meta: { model, op: 'Extended' } });
        toast('Extending your song ➡️', '', 'ok'); closeModal(); refreshCredits();
      } catch (ex) { toast('Extend failed', ex.message, 'err', 8000); } finally { setBusy(btn, false); }
    });
  }

  function formReplace(t) {
    const dur = Math.floor(t.duration || 120);
    const maxLen = Math.max(10, Math.floor(dur / 2));
    const body = openModal('✂️ Replace a section', `<form id="f">
      <p class="muted" style="margin-top:0">Pick a window (10 s minimum, up to half the song) and rewrite what happens there. The new part blends into the original.</p>
      ${sliderHTML('rp-start', 'Start', 0, Math.max(0, dur - 10), 0.5, Math.min(30, Math.max(0, dur - 20)), '0:00', fmtTime(dur))}
      ${sliderHTML('rp-len', 'Length', 10, maxLen, 0.5, Math.min(15, maxLen), '10 s', `${maxLen} s`)}
      <p class="fine" id="rp-sum"></p>
      <div class="grid-2"><div class="field"><label class="label" for="rp-title">Title</label><input class="input" id="rp-title" value="${esc(t.title || '')}" maxlength="80" /></div>
      <div class="field"><label class="label" for="rp-tags">Style</label><input class="input" id="rp-tags" value="${esc(t.tags || '')}" /></div></div>
      <div class="field"><label class="label" for="rp-lyrics">New lyrics for this section</label><textarea class="input textarea mono" id="rp-lyrics" rows="3" placeholder="[Chorus]\nThe new line goes here" required></textarea></div>
      <div class="field"><label class="label" for="rp-full">Full song lyrics after the change</label><textarea class="input textarea mono" id="rp-full" rows="6">${esc(t.prompt || '')}</textarea></div>
      <div class="field"><label class="label" for="rp-neg">Exclude styles <span class="muted">(optional)</span></label><input class="input" id="rp-neg" /></div>
      <div class="row gap-8">${backToDetail(t)}<button type="button" class="btn btn-ghost" id="rp-preview">▶ Preview window</button><button class="btn btn-primary" style="flex:1" type="submit"><span class="btn-label">Replace</span></button></div></form>`);
    wireBack(body, t); bindSliders(body);
    const s = $('#rp-start', body); const l = $('#rp-len', body);
    const sync = () => { $('#rp-start-out').textContent = fmtTime(s.value); $('#rp-len-out').textContent = `${Number(l.value).toFixed(1)} s`; $('#rp-sum').textContent = `Replacing ${fmtTime(s.value)} → ${fmtTime(Number(s.value) + Number(l.value))}`; };
    s.addEventListener('input', sync); l.addEventListener('input', sync); sync();
    $('#rp-preview', body).addEventListener('click', () => { playTrack(t.id, Number(s.value)); });
    $('#f', body).addEventListener('submit', async (e) => {
      e.preventDefault();
      const start = Number(s.value); const end = Math.min(dur, start + Number(l.value));
      const lyrics = $('#rp-lyrics').value.trim(); const full = $('#rp-full').value.trim();
      if (!lyrics) { $('#rp-lyrics').focus(); return toast('Write the new lyrics for this section', '', 'err'); }
      if (end - start < 10) return toast('The window must be at least 10 seconds', '', 'err');
      const b = { taskId: t.taskId, audioId: t.id, prompt: lyrics, tags: $('#rp-tags').value.trim() || 'pop', title: $('#rp-title').value.trim() || t.title || 'Untitled',
        infillStartS: Number(start.toFixed(2)), infillEndS: Number(end.toFixed(2)), fullLyrics: full || lyrics, negativeTags: $('#rp-neg').value.trim(), callBackUrl: callbackUrl() };
      const btn = e.submitter; setBusy(btn, true, 'Sending…');
      try {
        const data = await api('/api/v1/generate/replace-section', { method: 'POST', body: b });
        addJob({ kind: 'music', taskId: data.taskId, label: `Section edit · ${t.title}`, meta: { op: 'Edited' } });
        toast('Rewriting that section ✂️', '', 'ok'); closeModal(); refreshCredits();
      } catch (ex) { toast('Replace failed', ex.message, 'err', 8000); } finally { setBusy(btn, false); }
    });
  }

  function formPersona(t) {
    const dur = Math.floor(t.duration || 60);
    const body = openModal('🧬 Create a persona', `<form id="f">
      <p class="muted" style="margin-top:0">Capture this track’s voice and vibe as a reusable persona. Pick a segment where the vocals shine.</p>
      <div class="grid-2"><div class="field"><label class="label" for="pe-name">Persona name</label><input class="input" id="pe-name" required placeholder="Midnight Crooner" /></div>
      <div class="field"><label class="label" for="pe-style">Style label</label><input class="input" id="pe-style" value="${esc((t.tags || '').split(',').slice(0, 3).join(','))}" /></div></div>
      <div class="field"><label class="label" for="pe-desc">Description</label><textarea class="input textarea" id="pe-desc" rows="3" required placeholder="Warm, breathy female vocals over lush synth-pop; nostalgic and dreamy."></textarea></div>
      ${sliderHTML('pe-start', 'Analyze from', 0, Math.max(0, dur - 10), 1, 0, '0:00', fmtTime(dur))}
      ${sliderHTML('pe-len', 'Segment length', 10, 30, 1, 30, '10 s', '30 s')}
      <div class="row gap-8 mt-16">${backToDetail(t)}<button class="btn btn-primary" style="flex:1" type="submit"><span class="btn-label">Create persona</span></button></div></form>`);
    wireBack(body, t); bindSliders(body);
    const s = $('#pe-start', body); const l = $('#pe-len', body);
    const sync = () => { $('#pe-start-out').textContent = fmtTime(s.value); $('#pe-len-out').textContent = `${l.value} s`; }; s.addEventListener('input', sync); l.addEventListener('input', sync); sync();
    $('#f', body).addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#pe-name').value.trim(); const description = $('#pe-desc').value.trim();
      if (!name || !description) return toast('Name and description are required', '', 'err');
      const start = Number(s.value); const end = Math.min(dur || start + 30, start + Number(l.value));
      const btn = e.submitter; setBusy(btn, true, 'Creating…');
      try {
        const data = await api('/api/v1/generate/generate-persona', { method: 'POST', body: { taskId: t.taskId, audioId: t.id, name, description, vocalStart: start, vocalEnd: end, style: $('#pe-style').value.trim() } });
        const persona = { personaId: data.personaId, name: data.name || name, description };
        state.personas = [persona, ...state.personas.filter((p) => p.personaId !== persona.personaId)]; store.set('personas', state.personas);
        t.assets = t.assets || {}; t.assets.personaId = persona.personaId; saveLibrary();
        rebuildPersonaLists();
        toast('Persona created 🧬', `“${persona.name}” is ready in Fine-tune → Persona.`, 'ok'); refreshCredits(); openDetail(t.id);
      } catch (ex) { toast('Persona failed', ex.message, 'err', 8000); } finally { setBusy(btn, false); }
    });
  }
  function rebuildPersonaLists() {
    $$('datalist[id$="-persona-list"]').forEach((dl) => { dl.innerHTML = state.personas.map((p) => `<option value="${esc(p.personaId)}">${esc(p.name)}</option>`).join(''); });
  }

  // MIDI export (Standard MIDI File, format 1) from the API's note data
  function downloadMidi(t) {
    const inst = t.assets?.midi?.instruments || [];
    if (!inst.length) return toast('No MIDI notes found', '', 'err');
    const TPQ = 480; const BPM = 120; const tps = (TPQ * BPM) / 60;
    const vlq = (n) => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
    const str = (s) => [...s].map((c) => c.charCodeAt(0) & 0x7f);
    const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    const chunk = (id, data) => [...str(id), ...u32(data.length), ...data];
    const tempo = [0, 0xff, 0x51, 3, ...[60000000 / BPM].map((u) => [(u >> 16) & 255, (u >> 8) & 255, u & 255]).flat(), 0, 0xff, 0x2f, 0];
    const tracks = [chunk('MTrk', tempo)];
    const melodic = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15];
    let mi = 0;
    inst.forEach((ins) => {
      const drum = /drum|kick|snare|hat|perc/i.test(ins.name);
      const c = drum ? 9 : melodic[mi++ % melodic.length];
      const evs = [];
      (ins.notes || []).forEach((n) => {
        const p = clamp(Math.round(n.pitch), 0, 127); const v = clamp(Math.round((n.velocity ?? 0.8) * 127), 1, 127);
        evs.push({ t: Math.round(n.start * tps), d: [0x90 | c, p, v], o: 1 }, { t: Math.round(n.end * tps), d: [0x80 | c, p, 0], o: 0 });
      });
      evs.sort((a, b) => a.t - b.t || a.o - b.o);
      const name = str(ins.name || 'Track');
      const data = [0, 0xff, 0x03, ...vlq(name.length), ...name];
      let last = 0;
      evs.forEach((ev) => { data.push(...vlq(Math.max(0, ev.t - last)), ...ev.d); last = ev.t; });
      data.push(0, 0xff, 0x2f, 0);
      tracks.push(chunk('MTrk', data));
    });
    const header = chunk('MThd', [0, 1, 0, tracks.length, (TPQ >> 8) & 255, TPQ & 255]);
    const bytes = new Uint8Array([...header, ...tracks.flat()]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
    a.download = `${(t.title || 'track').replace(/[^\w\- ]+/g, '')}.mid`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------------------------------------------------------------------------
  // Karaoke
  // ---------------------------------------------------------------------------
  let karaokeWords = null; let karaokeEls = [];
  async function openKaraoke(id) {
    const t = findTrack(id); if (!t) return;
    if (t.upload || t.streaming) return toast('Karaoke needs a finished song', '', 'warn');
    const body = openModal(`🎤 ${t.title}`, '<div class="bar indet"><i></i></div><p class="muted">Syncing lyrics to the beat…</p>', { wide: true, onClose: () => { karaokeWords = null; karaokeEls = []; } });
    try {
      let data = t.karaoke;
      if (!data) { data = await api('/api/v1/generate/get-timestamped-lyrics', { method: 'POST', body: { taskId: t.taskId, audioId: t.id } }); t.karaoke = { alignedWords: data?.alignedWords || [], waveformData: (data?.waveformData || []).slice(0, 2000) }; saveLibrary(); data = t.karaoke; }
      const words = data.alignedWords || [];
      if (!words.length) { body.innerHTML = '<p class="muted">No timed lyrics available for this track (instrumentals have none).</p>'; return; }
      const wave = data.waveformData || [];
      const bars = 90; const step = Math.max(1, Math.floor(wave.length / bars)); const maxW = Math.max(...wave, 0.0001);
      const waveHTML = wave.length ? `<div class="k-wave" id="k-wave">${Array.from({ length: Math.min(bars, wave.length) }, (_, i) => `<i style="height:${Math.max(4, (wave[i * step] / maxW) * 100)}%"></i>`).join('')}</div>` : '';
      let html = '';
      words.forEach((w, i) => {
        const raw = String(w.word || '');
        const parts = raw.split(/(\[[^\]]*\])/);
        parts.forEach((p) => {
          if (/^\[[^\]]*\]$/.test(p)) html += `<span class="k-sec">${esc(p.slice(1, -1))}</span>`;
          else if (p.trim()) html += `<span class="w" data-i="${i}">${esc(p.trim()).replace(/\n+/g, '<br/>')}</span>${/\n\s*$/.test(p) ? '<br/>' : ' '}`;
          else if (p.includes('\n')) html += '<br/>';
        });
      });
      body.innerHTML = `${waveHTML}<div class="karaoke" id="karaoke">${html}</div><p class="fine center">Tap any word to jump there.</p>`;
      karaokeWords = words; karaokeEls = $$('#karaoke .w', body); lastK = -1;
      body.querySelector('#karaoke').addEventListener('click', (e) => { const w = e.target.closest('.w'); if (!w) return; const word = words[Number(w.dataset.i)]; playTrack(t.id, Math.max(0, word.startS - 0.1)); });
      if (state.current !== t.id) playTrack(t.id); else if ($('#audio').paused) $('#audio').play();
    } catch (ex) { body.innerHTML = `<p class="muted">Couldn’t load synced lyrics: ${esc(ex.message)}</p>`; }
  }
  let lastK = -1;
  function syncKaraoke(time) {
    if (!karaokeWords || !karaokeEls.length) return;
    let idx = -1;
    for (let i = 0; i < karaokeWords.length; i++) { if (karaokeWords[i].startS <= time) idx = i; else break; }
    if (idx === lastK) return; lastK = idx;
    karaokeEls.forEach((el) => { const i = Number(el.dataset.i); el.classList.toggle('now', i === idx); el.classList.toggle('past', i < idx); });
    const now = karaokeEls.find((el) => Number(el.dataset.i) === idx);
    const box = $('#karaoke');
    if (now && box) { const top = now.offsetTop - box.offsetTop - box.clientHeight / 3; box.scrollTo({ top, behavior: 'smooth' }); }
    const wave = $$('#k-wave i'); const dur = $('#audio').duration || 1;
    wave.forEach((w, i) => w.classList.toggle('on', i / wave.length <= time / dur));
  }

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------
  const audio = () => $('#audio');
  function updatePlayerMeta(t) {
    $('#p-title').textContent = t.title || 'Untitled';
    $('#p-sub').textContent = t.streaming ? 'Streaming preview · final mix in progress' : t.tags || '';
    const art = $('#p-art');
    if (t.image_url) art.style.backgroundImage = `url("${t.image_url}")`;
    else { const h = hashHue(t.title || t.id); art.style.backgroundImage = `linear-gradient(135deg,hsl(${h} 70% 55%),hsl(${(h + 60) % 360} 75% 50%))`; }
  }
  function playTrack(id, at) {
    const t = findTrack(id); if (!t) return;
    const src = t.audio_url || t.stream_audio_url;
    if (!src) return toast('This track isn’t playable yet', 'Hang tight — it’s still being generated.', 'warn');
    const a = audio();
    if (state.current !== id || a.src !== src) { a.src = src; state.current = id; }
    if (at != null) { const seek = () => { a.currentTime = at; }; if (a.readyState >= 1) seek(); else a.addEventListener('loadedmetadata', seek, { once: true }); }
    a.play().catch(() => {});
    $('#player').hidden = false;
    updatePlayerMeta(t);
    renderLibrary();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title || 'Untitled', artist: 'Tunesmith Studio', artwork: t.image_url ? [{ src: t.image_url, sizes: '512x512' }] : [] });
    }
  }
  function togglePlay(id) {
    const a = audio();
    if (id && id !== state.current) return playTrack(id);
    if (!state.current) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }
  function step(dir) {
    if (!state.queue.length) return;
    const i = state.queue.indexOf(state.current);
    const next = state.queue[(i + dir + state.queue.length) % state.queue.length];
    playTrack(next);
  }
  function initPlayer() {
    const a = audio();
    $('#p-play').innerHTML = icon('play'); $('#p-prev').innerHTML = icon('prev'); $('#p-next').innerHTML = icon('next');
    $('#p-karaoke').innerHTML = icon('mic'); $('#p-open').innerHTML = icon('expand');
    $('#p-play').addEventListener('click', () => togglePlay());
    $('#p-prev').addEventListener('click', () => step(-1));
    $('#p-next').addEventListener('click', () => step(1));
    $('#p-karaoke').addEventListener('click', () => state.current && openKaraoke(state.current));
    $('#p-open').addEventListener('click', () => state.current && openDetail(state.current));
    const range = $('#p-range'); let seeking = false;
    range.addEventListener('input', () => { seeking = true; const d = a.duration; if (isFinite(d)) $('#p-cur').textContent = fmtTime((range.value / 1000) * d); range.style.setProperty('--p', range.value / 10 + '%'); });
    range.addEventListener('change', () => { const d = a.duration; if (isFinite(d)) a.currentTime = (range.value / 1000) * d; seeking = false; });
    a.addEventListener('timeupdate', () => {
      const d = a.duration;
      if (!seeking && isFinite(d) && d > 0) { range.value = (a.currentTime / d) * 1000; range.style.setProperty('--p', (a.currentTime / d) * 100 + '%'); }
      $('#p-cur').textContent = fmtTime(a.currentTime);
      syncKaraoke(a.currentTime);
    });
    a.addEventListener('loadedmetadata', () => { $('#p-dur').textContent = isFinite(a.duration) ? fmtTime(a.duration) : 'live'; });
    const sync = () => {
      const playing = !a.paused;
      $('#p-play').innerHTML = icon(playing ? 'pause' : 'play');
      $('#player').classList.toggle('is-playing', playing);
      $$('.play-fab').forEach((b) => { b.innerHTML = icon(b.dataset.play === state.current && playing ? 'pause' : 'play'); });
      $$('.track').forEach((c) => c.classList.toggle('playing', c.dataset.id === state.current));
    };
    a.addEventListener('play', sync); a.addEventListener('pause', sync);
    a.addEventListener('ended', () => { sync(); if (!karaokeWords) step(1); });
    a.addEventListener('error', () => { if (state.current) toast('Couldn’t play this track', 'The link may have expired — open it and use “Refresh links”.', 'err'); });
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => a.play());
      navigator.mediaSession.setActionHandler('pause', () => a.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
      navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.code === 'Space' && state.current && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement?.tagName || '') && !$('#app').hidden) { e.preventDefault(); togglePlay(); }
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  function init() {
    hydrateIcons();
    initTheme();
    initGate();
    $('#logout').innerHTML = icon('lock');
    $('#logout').addEventListener('click', () => { if (confirm('Lock the studio and forget your API key on this device? Your library stays.')) lock(); });
    $('#credits').addEventListener('click', refreshCredits);
    $$('.tab').forEach((t) => t.addEventListener('click', () => goTab(t.dataset.tab)));
    $$('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
    $('#modal-x').innerHTML = icon('x');
    initCreate(); initLyrics(); initRemix(); initLibrary(); initPlayer();
    counters();
    goTab(store.get('tab', 'create'));
    state.key = readKey();
    if (state.key) {
      $('#gate').hidden = true;
      enterApp(null);
    } else {
      $('#gate').hidden = false;
      $('#gate-key').focus();
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) resumeJobs(); });
    $('#jobs').addEventListener('click', (e) => {
      const r = e.target.closest('[data-job-retry]'); const d = e.target.closest('[data-job-dismiss]'); const p = e.target.closest('[data-job-play]');
      if (r) { const j = state.jobs.find((x) => x.id === r.dataset.jobRetry); if (j) { updateJob(j, { status: 'running', createdAt: Date.now(), errors: 0, msg: 'Checking…' }); pollSoon(200); } }
      if (d) { state.jobs = state.jobs.filter((x) => x.id !== d.dataset.jobDismiss); saveJobs(); renderJobs(); }
      if (p) { const j = state.jobs.find((x) => x.id === p.dataset.jobPlay); if (j?.trackIds?.[0]) playTrack(j.trackIds[0]); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
