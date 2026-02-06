/* =========================================================
   Blue Hour Studio — FINAL app.js
   =========================================================
   Features:
   - Panels: Settings / Analytics / Background
   - Theme + Typography
   - Pomodoro Timer
   - Centered motivational quotes
   - Alarm (4 types, generated sound)
   - Music playlists (local files)
   - Brown & White noise auto-loop
   - Weekly analytics with canvas chart
   - Background image/video with blur & opacity
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  /* =======================
     PANELS
     ======================= */
  const settingsOverlay = $("settingsOverlay");
  const analyticsOverlay = $("analyticsOverlay");
  const backgroundOverlay = $("backgroundOverlay");

  const openSettingsBtn = $("openSettingsBtn");
  const closeSettingsBtn = $("closeSettingsBtn");
  const openAnalyticsBtn = $("openAnalyticsBtn");
  const closeAnalyticsBtn = $("closeAnalyticsBtn");
  const openBackgroundBtn = $("openBackgroundBtn");
  const closeBackgroundBtn = $("closeBackgroundBtn");

  function openOverlay(el){
    if(!el) return;
    el.classList.remove("is-hidden");
    el.setAttribute("aria-hidden","false");
  }
  function closeOverlay(el){
    if(!el) return;
    el.classList.add("is-hidden");
    el.setAttribute("aria-hidden","true");
  }

  openSettingsBtn?.addEventListener("click", () => openOverlay(settingsOverlay));
  closeSettingsBtn?.addEventListener("click", () => closeOverlay(settingsOverlay));

  openAnalyticsBtn?.addEventListener("click", () => {
    openOverlay(analyticsOverlay);
    renderAnalytics();
  });
  closeAnalyticsBtn?.addEventListener("click", () => closeOverlay(analyticsOverlay));

  openBackgroundBtn?.addEventListener("click", () => openOverlay(backgroundOverlay));
  closeBackgroundBtn?.addEventListener("click", () => closeOverlay(backgroundOverlay));

  [settingsOverlay, analyticsOverlay, backgroundOverlay].forEach(ov => {
    ov?.addEventListener("click", (e) => {
      if(e.target === ov) closeOverlay(ov);
    });
  });

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      closeOverlay(settingsOverlay);
      closeOverlay(analyticsOverlay);
      closeOverlay(backgroundOverlay);
    }
  });

  /* =======================
     THEME & TYPOGRAPHY
     ======================= */
  const themeSelect = $("themeSelect");
  const fontSelect = $("fontSelect");

  const UI_KEY = "bhs_ui_v1";
  function loadUI(){
    try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; }
    catch { return {}; }
  }
  function saveUI(o){
    localStorage.setItem(UI_KEY, JSON.stringify(o));
  }

  const ui = loadUI();
  if(ui.theme) document.body.setAttribute("data-theme", ui.theme);
  if(ui.font) document.body.setAttribute("data-font", ui.font);
  if(themeSelect && ui.theme) themeSelect.value = ui.theme;
  if(fontSelect && ui.font) fontSelect.value = ui.font;

  themeSelect?.addEventListener("change", () => {
    const t = themeSelect.value;
    document.body.setAttribute("data-theme", t);
    const u = loadUI(); u.theme = t; saveUI(u);
  });

  fontSelect?.addEventListener("change", () => {
    const f = fontSelect.value;
    document.body.setAttribute("data-font", f);
    const u = loadUI(); u.font = f; saveUI(u);
  });

  /* =======================
     BACKGROUND
     ======================= */
  const bgLayer = $("bgLayer");
  const bgType = $("bgType");
  const bgPath = $("bgPath");
  const bgOpacity = $("bgOpacity");
  const bgBlur = $("bgBlur");
  const applyBgBtn = $("applyBgBtn");
  const clearBgBtn = $("clearBgBtn");

  const BG_KEY = "bhs_bg_v1";
  function loadBG(){
    try { return JSON.parse(localStorage.getItem(BG_KEY)) || {}; }
    catch { return {}; }
  }
  function saveBG(o){ localStorage.setItem(BG_KEY, JSON.stringify(o)); }

  function applyBgControls(op, blur){
    document.documentElement.style.setProperty("--bgOpacity", String(op));
    document.documentElement.style.setProperty("--bgBlur", `${blur}px`);
  }

  function applyBackground(type, path){
    if(!bgLayer) return;
    bgLayer.style.backgroundImage = "";
    bgLayer.innerHTML = "";

    if(!path) return;

    if(type === "video"){
      const v = document.createElement("video");
      v.src = path;
      v.autoplay = true;
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      v.style.width = "100%";
      v.style.height = "100%";
      v.style.objectFit = "cover";
      bgLayer.appendChild(v);
    } else {
      bgLayer.style.backgroundImage = `url("${path}")`;
    }
  }

  const savedBG = loadBG();
  if(savedBG.type) bgType && (bgType.value = savedBG.type);
  if(savedBG.path) bgPath && (bgPath.value = savedBG.path);
  if(typeof savedBG.opacity === "number") bgOpacity && (bgOpacity.value = savedBG.opacity);
  if(typeof savedBG.blur === "number") bgBlur && (bgBlur.value = savedBG.blur);

  applyBgControls(
    typeof savedBG.opacity === "number" ? savedBG.opacity : 0.28,
    typeof savedBG.blur === "number" ? savedBG.blur : 10
  );
  applyBackground(savedBG.type || "image", savedBG.path || "");

  applyBgBtn?.addEventListener("click", () => {
    const type = bgType?.value || "image";
    const path = bgPath?.value.trim() || "";
    const op = Number(bgOpacity?.value || 0.28);
    const blur = Number(bgBlur?.value || 10);

    applyBgControls(op, blur);
    applyBackground(type, path);
    saveBG({ type, path, opacity: op, blur });
  });

  clearBgBtn?.addEventListener("click", () => {
    if(bgPath) bgPath.value = "";
    if(bgLayer){ bgLayer.style.backgroundImage = ""; bgLayer.innerHTML = ""; }
    saveBG({ type: bgType?.value || "image", path: "", opacity: Number(bgOpacity?.value || 0.28), blur: Number(bgBlur?.value || 10) });
  });

  bgOpacity?.addEventListener("input", () => applyBgControls(bgOpacity.value, bgBlur.value));
  bgBlur?.addEventListener("input", () => applyBgControls(bgOpacity.value, bgBlur.value));

  /* =======================
     QUOTES (CENTERED)
     ======================= */
  const quoteText = $("quoteText");
  const quoteAuthor = $("quoteAuthor");

  const QUOTES = [
    { t: "Nothing is so fatiguing as the eternal hanging on of an uncompleted task.", a: "— William James" },
    { t: "Concentrate all your thoughts upon the work in hand.", a: "— Alexander Graham Bell" },
    { t: "It is not that I'm so smart. But I stay with the questions much longer.", a: "— Albert Einstein" },
    { t: "You have power over your mind — not outside events.", a: "— Marcus Aurelius" },
    { t: "Be regular and orderly in your life, so that you may be violent and original in your work.", a: "— Gustave Flaubert" }
  ];

  function setRandomQuote(){
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    if(quoteText) quoteText.textContent = `“${q.t}”`;
    if(quoteAuthor) quoteAuthor.textContent = q.a;
  }
  setRandomQuote();

  /* =======================
     TIMER + ALARM
     ======================= */
  const timeDisplay = $("timeDisplay");
  const statusText = $("statusText");
  const startPauseBtn = $("startPauseBtn");
  const resetBtn = $("resetBtn");
  const pomodoroMin = $("pomodoroMin");
  const shortMin = $("shortMin");
  const longMin = $("longMin");
  const autoNext = $("autoNext");
  const alarmSelect = $("alarmSelect");
  const alarmAudio = $("alarmAudio");
  const modeBtns = Array.from(document.querySelectorAll(".mode"));

  let mode = "pomodoro";
  let running = false;
  let remainSec = 25 * 60;
  let timerId = null;

  function pad(n){ return String(n).padStart(2,"0"); }
  function renderTime(){
    const m = Math.floor(remainSec/60);
    const s = remainSec%60;
    if(timeDisplay) timeDisplay.textContent = `${pad(m)}:${pad(s)}`;
  }
  function setStatus(msg){ if(statusText) statusText.textContent = msg; }

  function durations(){
    return {
      pomodoro: Number(pomodoroMin?.value || 25),
      short: Number(shortMin?.value || 5),
      long: Number(longMin?.value || 15)
    };
  }

  function stopTimer(){
    clearInterval(timerId);
    timerId = null;
    running = false;
    startPauseBtn.textContent = "Start";
  }

  function resetTimer(){
    stopTimer();
    remainSec = durations()[mode] * 60;
    renderTime();
    setStatus("Ready.");
  }

  function startTimer(){
    if(running) return;
    running = true;
    startPauseBtn.textContent = "Pause";
    setRandomQuote();
    timerId = setInterval(tick, 1000);
  }

  function setMode(m){
    mode = m;
    modeBtns.forEach(b => b.classList.toggle("is-active", b.dataset.mode === m));
    resetTimer();
  }

  function makeTone(freq){
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.25;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  function playAlarm(){
    const a = alarmSelect?.value || "soft";
    if(a === "bell") makeTone(880);
    else if(a === "digital") makeTone(1320);
    else if(a === "chime") makeTone(660);
    else makeTone(440);
  }

  function tick(){
    remainSec--;
    if(remainSec <= 0){
      stopTimer();
      renderTime();
      playAlarm();
      setStatus("Done.");
      return;
    }
    renderTime();
  }

  modeBtns.forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
  startPauseBtn?.addEventListener("click", () => running ? stopTimer() : startTimer());
  resetBtn?.addEventListener("click", resetTimer);
  setMode("pomodoro");

  /* =======================
     MUSIC (FINAL)
     ======================= */
  const PLAYLISTS = {
    lofi: ["lofi_01.mp3", "lofi_02.mp3"],
    adhd_music: ["focus_01.mp3"],
    instrumental: ["instrimental_01.mp3"],,
    classical: [ "classical_01.mp3", "classical_02.mp3"],
    classic_rock: ["classic_rock_01.mp3"],
    ambient: ["ambient_01.mp3"],
    brown_noise: ["brown_01.mp3"],
    white_noise: ["white_01.mp3"]
  };

  const musicCategory = $("musicCategory");
  const musicPlayer = $("musicPlayer");
  const musicPlayBtn = $("musicPlayBtn");
  const musicNextBtn = $("musicNextBtn");
  const musicStopBtn = $("musicStopBtn");
  const musicVolume = $("musicVolume");

  let currentIndex = 0;

  function currentList(){
    const cat = musicCategory.value;
    return { cat, list: PLAYLISTS[cat] || [] };
  }
function loadTrack(i){
  const { cat, list } = currentList();
  if (!list.length) return false;

  currentIndex = (i + list.length) % list.length;
  musicPlayer.src = `. /music_select/${cat}/${list[currentIndex]}`;

  musicPlayer.loop =
    cat === "brown_noise" ||
    cat === "white_noise" ||
    list. length === 1;

  return true;
}



    return true;
  }

  musicVolume.oninput = () => musicPlayer.volume = musicVolume.value;
  musicPlayer.volume = musicVolume.value;

  musicPlayBtn.onclick = async () => {
    const { list } = currentList();
    if(!list.length){ setStatus("Add music files to PLAYLISTS."); return; }
    if(!musicPlayer.src) loadTrack(0);
    await musicPlayer.play();
  };

  musicNextBtn.onclick = async () => {
    if(loadTrack(currentIndex+1)) await musicPlayer.play();
  };

  musicStopBtn.onclick = () => {
    musicPlayer.pause();
    musicPlayer.currentTime = 0;
  };

  musicCategory.onchange = () => {
    musicPlayer.pause();
    musicPlayer.src = "";
    setStatus("Ready.");
  };
musicPlayer.addEventListener("ended", async () => {
  const { cat, list } = currentList();
  if (!list.length) return;

  // Noise zaten loop
  if (cat === "brown_noise" || cat === "white_noise") return;

  // Sonraki track; bittiyse başa sar
  const nextIndex = (currentIndex + 1) % list.length;

  const ok = loadTrack(nextIndex);
  if (!ok) return;

  try { await musicPlayer.play(); } catch {}
});
   
  /* =======================
     ANALYTICS (WEEKLY)
     ======================= */
  const STATS_KEY = "bhs_stats_v1";
  const weekMinutesEl = $("weekMinutes");
  const weekSessionsEl = $("weekSessions");
  const todayMinutesEl = $("todayMinutes");
  const weekChart = $("weekChart");
  const clearDataBtn = $("clearDataBtn");

  function loadStats(){ try{return JSON.parse(localStorage.getItem(STATS_KEY))||{};}catch{return{};} }
  function saveStats(s){ localStorage.setItem(STATS_KEY, JSON.stringify(s)); }

  function todayKey(d=new Date()){
    return d.toISOString().slice(0,10);
  }

  function last7(){
    const a=[];
    for(let i=6;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      a.push(todayKey(d));
    }
    return a;
  }

  function renderAnalytics(){
    const stats = loadStats();
    const keys = last7();
    let weekMin=0, weekSes=0;

    keys.forEach(k=>{
      const v=stats[k]||{m:0,s:0};
      weekMin+=v.m||0; weekSes+=v.s||0;
    });

    weekMinutesEl.textContent = `${weekMin} min`;
    weekSessionsEl.textContent = weekSes;
    todayMinutesEl.textContent = `${(stats[todayKey()]?.m)||0} min`;
    drawChart(keys.map(k=>stats[k]?.m||0));
  }

  function drawChart(data){
    const ctx = weekChart.getContext("2d");
    ctx.clearRect(0,0,weekChart.width,weekChart.height);
    const max = Math.max(...data,10);
    const w = 60;
    data.forEach((v,i)=>{
      const h = (v/max)*200;
      ctx.fillStyle="rgba(255,255,255,0.5)";
      ctx.fillRect(20+i*(w+10), 240-h, w, h);
    });
  }

  clearDataBtn.onclick = () => {
    localStorage.removeItem(STATS_KEY);
    renderAnalytics();
  };
});



   







