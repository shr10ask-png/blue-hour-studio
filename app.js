/* ===========================
   Blue Hour Studio - app.js
   Clean + no syntax errors
   =========================== */

(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pad2 = (n) => String(n).padStart(2, "0");
  const todayKey = () => new Date().toISOString().slice(0, 10);

  // ---------- Elements ----------
  const timeDisplay = $("timeDisplay");
  const statusText = $("statusText");
  const startPauseBtn = $("startPauseBtn");
  const resetBtn = $("resetBtn");
  const modeButtons = Array.from(document.querySelectorAll(".mode"));

  const musicCategory = $("musicCategory");
  const musicPlayBtn = $("musicPlayBtn");
  const musicNextBtn = $("musicNextBtn");
  const musicStopBtn = $("musicStopBtn");
  const musicVolume = $("musicVolume");
  const musicPlayer = $("musicPlayer");
  const nowPlaying = $("nowPlaying");

  const openSettingsBtn = $("openSettingsBtn");
  const openAnalyticsBtn = $("openAnalyticsBtn");
  const openBgBtn = $("openBgBtn");
  const openFontBtn = $("openFontBtn");

  const settingsModal = $("settingsModal");
  const analyticsModal = $("analyticsModal");
  const bgModal = $("bgModal");
  const fontModal = $("fontModal");

  const pomodoroMin = $("pomodoroMin");
  const shortMin = $("shortMin");
  const longMin = $("longMin");
  const alarmSelect = $("alarmSelect");
  const autoNext = $("autoNext");
  const saveSettingsBtn = $("saveSettingsBtn");

  const weekMinutesEl = $("weekMinutes");
  const weekSessionsEl = $("weekSessions");
  const todayMinutesEl = $("todayMinutes");
  const weekChart = $("weekChart");
  const clearDataBtn = $("clearDataBtn");

  const bgLayer = $("bgLayer");
  const bgInput = $("bgInput");
  const bgType = $("bgType");
  const bgDim = $("bgDim");
  const applyBgBtn = $("applyBgBtn");
  const clearBgBtn = $("clearBgBtn");

  // Theme dots
  const themeDots = Array.from(document.querySelectorAll(".theme-dot"));

  // Safety: if core elements missing, stop gracefully
  if (!timeDisplay || !statusText || !startPauseBtn || !resetBtn || modeButtons.length !== 3) {
    console.error("Core timer elements missing in index.html.");
    return;
  }

  // ---------- Storage keys ----------
  const LS = {
    settings: "bhs_settings_v1",
    analytics: "bhs_analytics_v1",
    theme: "bhs_theme_v1",
    font: "bhs_font_v1",
    bg: "bhs_bg_v1"
  };

  // ---------- Defaults ----------
  const DEFAULT_SETTINGS = {
    pomodoro: 25,
    short: 5,
    long: 15,
    alarm: "soft",
    autoNext: false
  };

  const DEFAULT_BG = {
    path: "",
    type: "image",
    dim: 0.38
  };

  // ---------- Quotes ----------
  const QUOTES = [
    { t: "The secret of getting ahead is getting started.", a: "— Mark Twain" },
    { t: "Discipline is choosing between what you want now and what you want most.", a: "— Abraham Lincoln (attributed)" },
    { t: "It always seems impossible until it’s done.", a: "— Nelson Mandela" },
    { t: "What you do every day matters more than what you do once in a while.", a: "— Gretchen Rubin" },
    { t: "Be regular and orderly in your life, so that you may be violent and original in your work.", a: "— Gustave Flaubert" }
  ];
  const quoteText = $("quoteText");
  const quoteAuthor = $("quoteAuthor");

  // ---------- Audio (alarms) ----------
  // Tiny WebAudio beeps (no external files)
  function beep(pattern = "soft") {
    if (pattern === "none") return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const makeTone = (t, freq, dur, gain) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
    };

    // patterns
    if (pattern === "soft") {
      makeTone(now, 660, 0.12, 0.08);
      makeTone(now + 0.16, 880, 0.10, 0.06);
    } else if (pattern === "bell") {
      makeTone(now, 880, 0.18, 0.10);
      makeTone(now + 0.22, 660, 0.16, 0.08);
      makeTone(now + 0.46, 990, 0.12, 0.06);
    } else if (pattern === "digital") {
      makeTone(now, 1046, 0.08, 0.10);
      makeTone(now + 0.10, 1046, 0.08, 0.10);
      makeTone(now + 0.22, 1318, 0.10, 0.08);
    }

    // close after short time
    setTimeout(() => ctx.close().catch(() => {}), 900);
  }

  // ---------- Settings load/save ----------
  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS.settings);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return {
        pomodoro: clamp(Number(parsed.pomodoro) || DEFAULT_SETTINGS.pomodoro, 1, 120),
        short: clamp(Number(parsed.short) || DEFAULT_SETTINGS.short, 1, 60),
        long: clamp(Number(parsed.long) || DEFAULT_SETTINGS.long, 1, 90),
        alarm: ["soft", "bell", "digital", "none"].includes(parsed.alarm) ? parsed.alarm : DEFAULT_SETTINGS.alarm,
        autoNext: !!parsed.autoNext
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(s) {
    localStorage.setItem(LS.settings, JSON.stringify(s));
  }

  let settings = loadSettings();

  // Apply settings to modal fields
  function syncSettingsUI() {
    pomodoroMin.value = settings.pomodoro;
    shortMin.value = settings.short;
    longMin.value = settings.long;
    alarmSelect.value = settings.alarm;
    autoNext.checked = settings.autoNext;
  }

  // ---------- Theme ----------
  function setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(LS.theme, theme);
    themeDots.forEach(d => d.classList.toggle("is-active", d.dataset.setTheme === theme));
  }

  const savedTheme = localStorage.getItem(LS.theme);
  if (savedTheme) setTheme(savedTheme);

  themeDots.forEach(dot => {
    dot.addEventListener("click", () => setTheme(dot.dataset.setTheme));
  });

  // ---------- Font ----------
  function setFont(font) {
    document.body.setAttribute("data-font", font);
    localStorage.setItem(LS.font, font);
  }
  const savedFont = localStorage.getItem(LS.font);
  if (savedFont) setFont(savedFont);

  // ---------- Modals ----------
  function openModal(el) {
    if (!el) return;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }
  function closeModal(el) {
    if (!el) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-close-modal]");
    if (!btn) return;
    const id = btn.getAttribute("data-close-modal");
    closeModal($(id));
  });

  // close when clicking outside card
  [settingsModal, analyticsModal, bgModal, fontModal].forEach(m => {
    if (!m) return;
    m.addEventListener("click", (e) => {
      if (e.target === m) closeModal(m);
    });
  });

  openSettingsBtn?.addEventListener("click", () => { syncSettingsUI(); openModal(settingsModal); });
  openAnalyticsBtn?.addEventListener("click", () => { renderAnalytics(); openModal(analyticsModal); });
  openBgBtn?.addEventListener("click", () => { syncBgUI(); openModal(bgModal); });
  openFontBtn?.addEventListener("click", () => openModal(fontModal));

  // font cards
  Array.from(document.querySelectorAll(".font-card")).forEach(btn => {
    btn.addEventListener("click", () => {
      setFont(btn.dataset.font);
      closeModal(fontModal);
    });
  });

  // ---------- Background ----------
  function loadBg() {
    try {
      const raw = localStorage.getItem(LS.bg);
      if (!raw) return { ...DEFAULT_BG };
      const p = JSON.parse(raw);
      return {
        path: typeof p.path === "string" ? p.path : "",
        type: p.type === "video" ? "video" : "image",
        dim: clamp(Number(p.dim ?? DEFAULT_BG.dim), 0.15, 0.70)
      };
    } catch {
      return { ...DEFAULT_BG };
    }
  }
  function saveBg(bg) {
    localStorage.setItem(LS.bg, JSON.stringify(bg));
  }
  let bgState = loadBg();

  function applyBackground() {
    document.documentElement.style.setProperty("--overlay", String(bgState.dim));
    // clear existing video
    bgLayer.innerHTML = "";
    bgLayer.style.backgroundImage = "";

    const path = (bgState.path || "").trim();
    if (!path) return;

    if (bgState.type === "video") {
      const v = document.createElement("video");
      v.src = path;
      v.autoplay = true;
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      bgLayer.appendChild(v);
    } else {
      bgLayer.style.backgroundImage = `url("${path}")`;
    }
  }

  function syncBgUI() {
    bgInput.value = bgState.path;
    bgType.value = bgState.type;
    bgDim.value = String(bgState.dim);
  }

  applyBgBtn?.addEventListener("click", () => {
    bgState = {
      path: bgInput.value.trim(),
      type: bgType.value === "video" ? "video" : "image",
      dim: clamp(Number(bgDim.value), 0.15, 0.70)
    };
    saveBg(bgState);
    applyBackground();
    closeModal(bgModal);
  });

  clearBgBtn?.addEventListener("click", () => {
    bgState = { ...DEFAULT_BG };
    saveBg(bgState);
    applyBackground();
    syncBgUI();
  });

  applyBackground();

  // ---------- Timer ----------
  const MODES = {
    pomodoro: () => settings.pomodoro * 60,
    short: () => settings.short * 60,
    long: () => settings.long * 60
  };

  let currentMode = "pomodoro";
  let timeLeft = MODES[currentMode]();
  let timerId = null;
  let isRunning = false;

  function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timeDisplay.textContent = `${pad2(m)}:${pad2(s)}`;
  }

  function setStatus(t) {
    statusText.textContent = t;
  }

  function setMode(mode) {
    currentMode = mode;
    timeLeft = MODES[currentMode]();
    updateDisplay();
    setStatus("Ready.");
  }

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (isRunning) return;
      modeButtons.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      setMode(btn.dataset.mode);
    });
  });

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
    isRunning = false;
    startPauseBtn.textContent = "Start";
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startPauseBtn.textContent = "Pause";
    setStatus(currentMode === "pomodoro" ? "Focusing…" : "Break…");

    timerId = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 1);
      updateDisplay();

      if (timeLeft <= 0) {
        stopTimer();
        setStatus("Session complete.");
        beep(settings.alarm);

        if (settings.autoNext) {
          // simple auto-next logic:
          if (currentMode === "pomodoro") {
            // alternate short/long: every 4th pomodoro -> long
            recordPomodoroComplete();
            const state = loadAnalytics();
            const today = todayKey();
            const todaySessions = (state.days[today]?.sessions || 0);
            const next = (todaySessions % 4 === 0) ? "long" : "short";
            highlightMode(next);
            setMode(next);
          } else {
            highlightMode("pomodoro");
            setMode("pomodoro");
          }
          // auto-start next after small delay
          setTimeout(() => startTimer(), 600);
        }
      }
    }, 1000);
  }

  function highlightMode(mode) {
    modeButtons.forEach(b => b.classList.toggle("is-active", b.dataset.mode === mode));
  }

  startPauseBtn.addEventListener("click", () => {
    if (!isRunning) startTimer();
    else {
      // pause
      if (timerId) clearInterval(timerId);
      timerId = null;
      isRunning = false;
      startPauseBtn.textContent = "Start";
      setStatus("Paused.");
    }
  });

  resetBtn.addEventListener("click", () => {
    stopTimer();
    timeLeft = MODES[currentMode]();
    updateDisplay();
    setStatus("Ready.");
  });

  // ---------- Analytics ----------
  function loadAnalytics() {
    try {
      const raw = localStorage.getItem(LS.analytics);
      if (!raw) return { days: {} };
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object" || !p.days) return { days: {} };
      return p;
    } catch {
      return { days: {} };
    }
  }

  function saveAnalytics(a) {
    localStorage.setItem(LS.analytics, JSON.stringify(a));
  }

  // Add focus minutes as time passes (only during pomodoro)
  let lastTickStamp = null;
  function startFocusTracking() {
    lastTickStamp = Date.now();
  }
  function stopFocusTracking() {
    lastTickStamp = null;
  }
  function addFocusSeconds(sec) {
    const a = loadAnalytics();
    const k = todayKey();
    a.days[k] = a.days[k] || { minutes: 0, sessions: 0 };
    // store minutes as integer; accumulate seconds -> minutes
    a.days[k]._sec = (a.days[k]._sec || 0) + sec;
    const m = Math.floor(a.days[k]._sec / 60);
    a.days[k].minutes = m;
    saveAnalytics(a);
  }

  function recordPomodoroComplete() {
    const a = loadAnalytics();
    const k = todayKey();
    a.days[k] = a.days[k] || { minutes: 0, sessions: 0 };
    a.days[k].sessions = (a.days[k].sessions || 0) + 1;
    saveAnalytics(a);
  }

  // Hook tracking into timer
  const _startTimer = startTimer;
  startTimer = function () {
    if (isRunning) return;
    if (currentMode === "pomodoro") startFocusTracking();
    _startTimer();
  };

  // On each second during pomodoro, track focus seconds
  const originalSetInterval = window.setInterval;
  // No override; just use our existing interval tick:
  // We'll add focus tracking inside tick by detecting isRunning+mode.
  // -> easiest: add in the timer loop above:
  // We already have that timer loop; we add a line:
  // (Done below by adding this on every tick)
  // But we cannot edit above easily now—so we do a separate 1s watcher:
  originalSetInterval(() => {
    if (isRunning && currentMode === "pomodoro" && lastTickStamp) {
      addFocusSeconds(1);
    }
  }, 1000);

  function getLast7Days() {
    const a = loadAnalytics();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, ...((a.days[key]) || { minutes: 0, sessions: 0 }) });
    }
    return days;
  }

  function renderAnalytics() {
    const days = getLast7Days();
    const totalMin = days.reduce((s, d) => s + (d.minutes || 0), 0);
    const totalSessions = days.reduce((s, d) => s + (d.sessions || 0), 0);

    const tKey = todayKey();
    const todayObj = days.find(d => d.key === tKey) || { minutes: 0 };

    weekMinutesEl.textContent = `${totalMin} min`;
    weekSessionsEl.textContent = `${totalSessions}`;
    todayMinutesEl.textContent = `${todayObj.minutes || 0} min`;

    drawChart(days);
  }

  function drawChart(days) {
    if (!weekChart) return;
    const ctx = weekChart.getContext("2d");
    const W = weekChart.width;
    const H = weekChart.height;

    // clear
    ctx.clearRect(0, 0, W, H);

    // background
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, 0, W, H);

    const padding = 28;
    const innerW = W - padding * 2;
    const innerH = H - padding * 2;

    const maxVal = Math.max(30, ...days.map(d => d.minutes || 0));
    const barW = innerW / days.length * 0.62;
    const gap = innerW / days.length * 0.38;

    // axis line
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(padding, H - padding);
    ctx.lineTo(W - padding, H - padding);
    ctx.stroke();

    // labels + bars
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";

    const tKey = todayKey();

    days.forEach((d, i) => {
      const x = padding + i * (barW + gap) + barW / 2;
      const val = d.minutes || 0;
      const bh = (val / maxVal) * innerH;
      const y = (H - padding) - bh;

      // bar
      const isToday = (d.key === tKey);
      ctx.fillStyle = isToday ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.12)";
      ctx.fillRect(x - barW / 2, y, barW, bh);

      // day label
      const dd = new Date(d.key);
      const label = dd.toLocaleDateString(undefined, { weekday: "short" });
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(label, x, H - 10);

      // value label
      ctx.fillStyle = "rgba(255,255,255,0.60)";
      ctx.fillText(String(val), x, y - 6);
    });
  }

  clearDataBtn?.addEventListener("click", () => {
    localStorage.removeItem(LS.analytics);
    renderAnalytics();
  });

  // ---------- Music ----------
  // IMPORTANT: files must be in: music_select/<category>/<filename>
  // Example: music_select/lofi/lofi_01.mp3
  const PLAYLISTS = {
    lofi: ["lofi_01.mp3", "lofi_02.mp3"],
    adhd_music: ["focus_01.mp3"],
    instrumental: ["instrumental_01.mp3"],
    classical: ["classical_01.mp3"],
    classic_rock: ["classic_rock_01.mp3"],
    ambient: ["ambient_01.mp3"],
    brown_noise: ["brown_01.mp3"],
    white_noise: ["white_01.mp3"]
  };

  let currentIndex = 0;

  function currentList() {
    const cat = musicCategory.value;
    return { cat, list: PLAYLISTS[cat] || [] };
  }

function loadTrack(i){
  const { cat, list } = currentList();
  if (!list.length) return false;

  currentIndex = (i + list.length) % list.length;
  musicPlayer.src = `./music_select/${cat}/${list[currentIndex]}`;
  musicPlayer.load();

  musicPlayer.loop =
    cat === "brown_noise" ||
    cat === "white_noise" ||
    list.length === 1;

  return true;
}

    // IMPORTANT: use ./ for GitHub Pages
    musicPlayer.src = `./music_select/${cat}/${list[currentIndex]}`;

    musicPlayer.loop =
      cat === "brown_noise" ||
      cat === "white_noise" ||
      list.length === 1;

    nowPlaying.textContent = `Now playing: ${cat} — ${list[currentIndex]}`;
    return true;
  }

  async function playCurrent() {
    try {
      await musicPlayer.play();
    } catch (e) {
      console.warn("Play blocked or failed:", e);
    }
  }

  musicPlayBtn?.addEventListener("click", async () => {
    const { list } = currentList();
    if (!list.length) {
      nowPlaying.textContent = "No tracks listed for this category.";
      return;
    }

    // If no src yet, load first
    if (!musicPlayer.src || musicPlayer.src.trim() === "") {
      loadTrack(0);
    }
    await playCurrent();
  });

  musicNextBtn?.addEventListener("click", async () => {
    const { list } = currentList();
    if (!list.length) return;
    loadTrack(currentIndex + 1);
    await playCurrent();
  });

  musicStopBtn?.addEventListener("click", () => {
    musicPlayer.pause();
    musicPlayer.currentTime = 0;
    nowPlaying.textContent = "Stopped.";
  });

  musicVolume?.addEventListener("input", () => {
    musicPlayer.volume = clamp(Number(musicVolume.value), 0, 1);
  });
  musicPlayer.volume = clamp(Number(musicVolume?.value || 0.6), 0, 1);

  // auto-next when track ends (playlist wrap)
  musicPlayer.addEventListener("ended", async () => {
    const { cat, list } = currentList();
    if (!list.length) return;
    if (cat === "brown_noise" || cat === "white_noise") return; // loops already

    const nextIndex = (currentIndex + 1) % list.length;
    loadTrack(nextIndex);
    await playCurrent();
  });

  // ---------- Save settings ----------
  saveSettingsBtn?.addEventListener("click", () => {
    settings = {
      pomodoro: clamp(Number(pomodoroMin.value), 1, 120),
      short: clamp(Number(shortMin.value), 1, 60),
      long: clamp(Number(longMin.value), 1, 90),
      alarm: alarmSelect.value,
      autoNext: !!autoNext.checked
    };
    saveSettings(settings);

    // If not running, refresh mode duration display
    if (!isRunning) {
      timeLeft = MODES[currentMode]();
      updateDisplay();
      setStatus("Ready.");
    }

    closeModal(settingsModal);
  });

  // ---------- Startup ----------
  // Quote random
  if (quoteText && quoteAuthor) {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    quoteText.textContent = `“${q.t}”`;
    quoteAuthor.textContent = q.a;
  }

  // Sync UI + initial display
  syncSettingsUI();
  updateDisplay();
  setStatus("Ready.");
})();

