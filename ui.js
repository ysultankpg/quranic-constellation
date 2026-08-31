/* Quranic Constellation — UI Controller */
(function(){
const qc=window._qc;
const canvas=document.getElementById("constellation");
const tooltip=document.getElementById("tooltip");

/* ── Mobile sidebar toggle ── */
const sidebarToggle=document.getElementById("sidebar-toggle");
const sidebar=document.getElementById("sidebar");
if(sidebarToggle){
  sidebarToggle.addEventListener("click",()=>{
    sidebar.classList.toggle("open");
    sidebarToggle.textContent=sidebar.classList.contains("open")?"✕":"☰";
  });
  /* Close sidebar when tapping the canvas on mobile */
  canvas.addEventListener("click",()=>{
    if(sidebar.classList.contains("open")){sidebar.classList.remove("open");sidebarToggle.textContent="☰";}
  });
}
const surahOverlay=document.getElementById("surah-overlay");
const surahModal=document.getElementById("surah-modal-content");
const readerOverlay=document.getElementById("reader-overlay");
const audioBar=document.getElementById("audio-bar");
const infoBar=document.getElementById("info-bar");
const searchInput=document.getElementById("search");
const searchResults=document.getElementById("search-results");
const legendEl=document.getElementById("legend");
const filterLabel=document.getElementById("filter-label");
const themeReset=document.getElementById("theme-reset");
const scriptSelect=document.getElementById("script-select");
const transSelect=document.getElementById("trans-select");
const barReciterSel=document.getElementById("bar-reciter-select");
let audio=null,currentAudioIdx=-1,isPlaying=false;
let readerCache={},currentReaderIdx=-1,currentView="both";
let currentModalIdx=-1;

function hexA(h,a){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;}
function fmtTime(s){if(!s||isNaN(s))return"0:00";const m=Math.floor(s/60),sec=Math.floor(s%60);return m+":"+(sec<10?"0":"")+sec;}

/* ── Audio engine ──
   Creates a FRESH Audio object every time the source changes.
   This avoids the stale-event / browser-cache bugs that broke reciter switching.

   loadAudio(i)        — prepare surah i for playback, show bar, do NOT play
   playCurrentAudio()  — play whatever is currently loaded
   playAudio(i)        — load + immediately play (used by prev/next/auto-advance)
*/

function destroyAudio(){
  if(audio){
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio=null;
  }
}

/* Shared event handlers — wired onto every new Audio instance */
function onTimeUpdate(){
  if(!audio||!audio.duration)return;
  var pct=(audio.currentTime/audio.duration)*100;
  var cur=fmtTime(audio.currentTime),tot=fmtTime(audio.duration);
  document.getElementById("audio-seek").value=pct;
  document.getElementById("audio-time").textContent=cur+" / "+tot;
  var smSeek=document.getElementById("sm-p-seek");
  var smTime=document.getElementById("sm-p-time");
  if(smSeek)smSeek.value=pct;
  if(smTime)smTime.textContent=cur+" / "+tot;
}
function onEnded(){
  if(currentAudioIdx<113){playAudio(currentAudioIdx+1);if(currentModalIdx>=0)showModalPlayer(currentAudioIdx);}
  else{isPlaying=false;updatePlayButtons();}
}
function onAudioError(){
  isPlaying=false;updatePlayButtons();
  document.getElementById("audio-surah-name").textContent="Reciter not available for this surah";
}

function createAudio(src){
  destroyAudio();
  audio=new Audio();
  audio.addEventListener("timeupdate",onTimeUpdate);
  audio.addEventListener("ended",onEnded);
  audio.addEventListener("error",onAudioError);
  audio.preload="auto";
  audio.src=src;
  audio.load();
}

/* Load audio for surah i — shows the bottom bar but does NOT auto-play */
function loadAudio(i){
  currentAudioIdx=i;
  isPlaying=false;
  createAudio(audioUrl(i+1));
  updatePlayButtons();
  document.getElementById("audio-surah-name").textContent=(i+1)+". "+S[i][0]+" ("+S[i][1]+")";
  document.getElementById("audio-reciter-label").textContent=currentReciter.name;
  audioBar.classList.remove("hidden");infoBar.classList.add("pushed-up");
}

/* Play whatever is currently loaded */
function playCurrentAudio(){
  if(!audio)return;
  audio.play().then(function(){isPlaying=true;updatePlayButtons();}).catch(function(){});
}

/* Load + immediately play (prev / next / auto-advance) */
function playAudio(i){
  loadAudio(i);
  playCurrentAudio();
}

/* ── Populate reciter selects ── */
function populateReciterSelect(sel){
  sel.innerHTML="";
  RECITERS.forEach((r,i)=>{const o=document.createElement("option");o.value=i;o.textContent=r.name;sel.appendChild(o);});
}
populateReciterSelect(barReciterSel);

/* Bottom-bar reciter change: reload audio for new reciter, keep playing if was playing */
barReciterSel.addEventListener("change",()=>{
  currentReciter=RECITERS[parseInt(barReciterSel.value)];
  document.getElementById("audio-reciter-label").textContent=currentReciter.name;
  if(currentAudioIdx>=0){
    var wasPlaying=isPlaying;
    loadAudio(currentAudioIdx);
    if(wasPlaying)playCurrentAudio();
  }
  syncModalReciter();
});

/* ── Legend ── */
THEMES.forEach((th,i)=>{
  const el=document.createElement("div");el.className="legend-item";
  el.innerHTML=`<span class="dot" style="background:${th.color}"></span>${th.name}<span class="count">${THEME_COUNTS[i]}</span>`;
  el.addEventListener("click",()=>{
    if(qc.activeTheme===i){qc.activeTheme=null;document.querySelectorAll(".legend-item").forEach(l=>l.classList.remove("dimmed"));themeReset.classList.add("hidden");}
    else{qc.activeTheme=i;document.querySelectorAll(".legend-item").forEach((l,j)=>l.classList.toggle("dimmed",j!==i));themeReset.classList.remove("hidden");}
    updateFilterLabel();
  });
  legendEl.appendChild(el);
});
themeReset.addEventListener("click",()=>{qc.activeTheme=null;document.querySelectorAll(".legend-item").forEach(l=>l.classList.remove("dimmed"));themeReset.classList.add("hidden");updateFilterLabel();});

/* ── Juz / Mode / Conn ── */
const juzSel=document.getElementById("juz-select");
for(let j=1;j<=30;j++){const o=document.createElement("option");o.value=j;o.textContent="Juz "+j;juzSel.appendChild(o);}
juzSel.addEventListener("change",()=>{qc.activeJuz=parseInt(juzSel.value);updateFilterLabel();});
document.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-mode]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");qc.mode=btn.dataset.mode;qc.relayout();}));
document.querySelectorAll("[data-conn]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-conn]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");qc.showConn=btn.dataset.conn==="on";}));

/* ── Search ── */
searchInput.addEventListener("input",()=>{
  const q=searchInput.value.trim().toLowerCase();
  if(!q){searchResults.classList.add("hidden");qc.filteredSet=null;updateFilterLabel();return;}
  const matches=[];
  S.forEach((s,i)=>{if(s[0].toLowerCase().includes(q)||s[1].includes(q)||(""+(i+1))===q||s[6].toLowerCase().includes(q))matches.push(i);});
  qc.filteredSet=matches.length?new Set(matches):null;
  if(!matches.length){searchResults.innerHTML='<div class="search-item"><span class="s-name" style="color:#666">No results</span></div>';searchResults.classList.remove("hidden");return;}
  searchResults.innerHTML=matches.slice(0,8).map(i=>`<div class="search-item" data-idx="${i}"><span class="s-name">${i+1}. ${S[i][0]}</span><span class="s-num">${S[i][1]} - ${S[i][2]} ayat</span></div>`).join("");
  searchResults.classList.remove("hidden");
  searchResults.querySelectorAll(".search-item").forEach(el=>el.addEventListener("click",()=>{openSurahModal(parseInt(el.dataset.idx));searchResults.classList.add("hidden");searchInput.value="";qc.filteredSet=null;}));
  updateFilterLabel();
});
searchInput.addEventListener("blur",()=>setTimeout(()=>searchResults.classList.add("hidden"),200));

/* ── Canvas Mouse ── */
canvas.addEventListener("mousemove",e=>{
  const i=qc.hitTest(e.clientX,e.clientY);qc.hoveredIdx=i;
  if(i>=0)showTooltip(i,e.clientX,e.clientY);else tooltip.classList.add("hidden");
  canvas.style.cursor=i>=0?"pointer":"crosshair";
});
canvas.addEventListener("mouseleave",()=>{qc.hoveredIdx=-1;tooltip.classList.add("hidden");});
canvas.addEventListener("click",e=>{
  const i=qc.hitTest(e.clientX,e.clientY);
  if(i>=0){tooltip.classList.add("hidden");openSurahModal(i);}
});

function showTooltip(i,mx,my){
  const s=S[i],th=THEMES[s[5]];
  tooltip.innerHTML=`<div class="t-arabic">${s[1]}</div><div class="t-name">${i+1}. ${s[0]}</div><div class="t-meaning">${s[6]}</div><div class="t-meta"><span>${s[2]} ayat</span><span>${s[4]?"Meccan":"Medinan"}</span><span>Juz ${JUZ[i]}</span></div><div class="t-theme" style="background:${hexA(th.color,.15)};color:${th.color}">${th.name}</div>`;
  tooltip.classList.remove("hidden");
  const bw=document.body.clientWidth,bh=document.body.clientHeight;
  let tx=mx+16,ty=my-12;if(tx+250>bw)tx=mx-260;if(ty+140>bh)ty=my-140;if(ty<0)ty=8;
  tooltip.style.left=tx+"px";tooltip.style.top=ty+"px";
}

/* ══════════════════════════
   Surah Detail Modal with inline player
   ══════════════════════════ */
function openSurahModal(i){
  qc.selectedIdx=i;currentModalIdx=i;
  const s=S[i],th=THEMES[s[5]];
  const connIdxs=[...new Set(CONNECTIONS.filter(c=>c[0]===i||c[1]===i).map(c=>c[0]===i?c[1]:c[0]))];

  /* Hide hamburger when modal is open */
  if(sidebarToggle)sidebarToggle.classList.add("modal-open");

  let h=`<div class="sm-back-row"><button class="sm-back-btn" id="sm-back">&#8592; Back</button></div>
<div class="sm-header"><div class="sm-num">${i+1}</div><div class="sm-arabic">${s[1]}</div></div>
<div class="sm-name">${s[0]}</div>
<div class="sm-meaning">${s[6]}</div>
<div class="sm-badge" style="background:${hexA(th.color,.15)};color:${th.color}">${th.name} — ${th.desc}</div>
<div class="sm-grid">
  <div class="sm-cell"><div class="val">${s[2]}</div><div class="lbl">Ayat</div></div>
  <div class="sm-cell"><div class="val">${s[4]?"Meccan":"Medinan"}</div><div class="lbl">Type</div></div>
  <div class="sm-cell"><div class="val">#${s[3]}</div><div class="lbl">Revealed</div></div>
  <div class="sm-cell"><div class="val">${JUZ[i]}</div><div class="lbl">Juz</div></div>
</div>
<div class="sm-actions">
  <button class="sm-btn sm-btn-read" id="sm-read">&#9776; Read Surah</button>
  <button class="sm-btn sm-btn-listen" id="sm-listen">&#9654; Listen</button>
</div>
<div id="sm-player-container"></div>`;

  if(connIdxs.length){
    h+=`<div class="sm-section">Connected Surahs (${connIdxs.length})</div><div class="sm-conn">`;
    connIdxs.forEach(j=>{const cs=S[j];h+=`<button class="sm-conn-link" data-idx="${j}"><span style="color:${THEMES[cs[5]].color}">${j+1}.</span> ${cs[0]} — ${cs[6]}</button>`;});
    h+=`</div>`;
  }

  surahModal.innerHTML=h;
  surahOverlay.classList.remove("hidden");

  document.getElementById("sm-read").addEventListener("click",()=>{surahOverlay.classList.add("hidden");openReader(i);});

  /* Back button — return to constellation */
  document.getElementById("sm-back").addEventListener("click",()=>{closeSurahModal();});

  /* Listen button: load audio + show player UI, but do NOT auto-play.
     User picks reciter first, then presses the play button. */
  document.getElementById("sm-listen").addEventListener("click",()=>{
    loadAudio(i);
    showModalPlayer(i);
  });
  surahModal.querySelectorAll(".sm-conn-link").forEach(btn=>btn.addEventListener("click",()=>openSurahModal(parseInt(btn.dataset.idx))));

  /* If already playing/loaded for this surah, show player immediately */
  if(currentAudioIdx===i&&audio)showModalPlayer(i);
}

function showModalPlayer(i){
  const container=document.getElementById("sm-player-container");
  if(!container)return;
  let reciterOpts=RECITERS.map((r,idx)=>`<option value="${idx}"${idx===RECITERS.indexOf(currentReciter)?" selected":""}>${r.name}</option>`).join("");

  /* Title reflects current state */
  var titleText=isPlaying?"Now Playing":"Ready to Play";

  container.innerHTML=`<div class="sm-player">
<div class="sm-player-header">
  <div class="sm-player-title"><span class="pulse-dot"></span> ${titleText}</div>
  <button class="sm-player-close" id="sm-p-close">&times;</button>
</div>
<div class="sm-reciter-row">
  <label>Reciter</label>
  <select id="sm-reciter-sel">${reciterOpts}</select>
</div>
<div class="sm-player-controls">
  <button class="sm-p-btn" id="sm-p-prev">&#9664;&#9664;</button>
  <button class="sm-p-btn${isPlaying?" playing":""}" id="sm-p-play">${isPlaying?"&#10074;&#10074;":"&#9654;"}</button>
  <button class="sm-p-btn stop-btn" id="sm-p-stop">&#9632;</button>
  <button class="sm-p-btn" id="sm-p-next">&#9654;&#9654;</button>
  <div class="sm-progress">
    <input type="range" id="sm-p-seek" min="0" max="100" value="0">
    <span class="sm-time" id="sm-p-time">0:00 / 0:00</span>
  </div>
</div>
</div>`;

  /* Play/pause toggle */
  document.getElementById("sm-p-play").addEventListener("click",()=>{
    if(!audio)return;
    if(isPlaying){audio.pause();isPlaying=false;}
    else{audio.play().then(function(){isPlaying=true;updatePlayButtons();updateModalTitle();}).catch(function(){});return;}
    updatePlayButtons();updateModalTitle();
  });
  /* Stop */
  document.getElementById("sm-p-stop").addEventListener("click",()=>{
    if(!audio)return;
    audio.pause();audio.currentTime=0;isPlaying=false;
    updatePlayButtons();updateModalTitle();
  });
  /* Prev / Next — these auto-play */
  document.getElementById("sm-p-prev").addEventListener("click",()=>{if(currentAudioIdx>0){playAudio(currentAudioIdx-1);showModalPlayer(currentAudioIdx);}});
  document.getElementById("sm-p-next").addEventListener("click",()=>{if(currentAudioIdx<113){playAudio(currentAudioIdx+1);showModalPlayer(currentAudioIdx);}});
  /* Seek */
  document.getElementById("sm-p-seek").addEventListener("input",e=>{if(audio&&audio.duration)audio.currentTime=(e.target.value/100)*audio.duration;});
  /* Close player */
  document.getElementById("sm-p-close").addEventListener("click",()=>{
    destroyAudio();isPlaying=false;currentAudioIdx=-1;
    container.innerHTML="";
    audioBar.classList.add("hidden");infoBar.classList.remove("pushed-up");
    updatePlayButtons();
  });
  /* Modal reciter change: reload for new reciter, resume if was playing */
  document.getElementById("sm-reciter-sel").addEventListener("change",e=>{
    currentReciter=RECITERS[parseInt(e.target.value)];
    barReciterSel.value=e.target.value;
    document.getElementById("audio-reciter-label").textContent=currentReciter.name;
    if(currentAudioIdx>=0){
      var wasPlaying=isPlaying;
      loadAudio(currentAudioIdx);
      if(wasPlaying)playCurrentAudio();
      updateModalTitle();
    }
  });
}

function updateModalTitle(){
  var el=document.querySelector(".sm-player-title");
  if(el)el.innerHTML='<span class="pulse-dot"></span> '+(isPlaying?"Now Playing":"Ready to Play");
}

function syncModalReciter(){
  const sel=document.getElementById("sm-reciter-sel");
  if(sel)sel.value=RECITERS.indexOf(currentReciter);
}

function updatePlayButtons(){
  /* Bottom bar */
  document.getElementById("audio-play").innerHTML=isPlaying?"&#10074;&#10074;":"&#9654;";
  /* Modal player */
  const smPlay=document.getElementById("sm-p-play");
  if(smPlay){
    smPlay.innerHTML=isPlaying?"&#10074;&#10074;":"&#9654;";
    smPlay.classList.toggle("playing",isPlaying);
  }
}

function closeSurahModal(){
  surahOverlay.classList.add("hidden");currentModalIdx=-1;qc.selectedIdx=-1;
  /* Restore hamburger on mobile */
  if(sidebarToggle)sidebarToggle.classList.remove("modal-open");
}

document.getElementById("surah-close").addEventListener("click",()=>{closeSurahModal();});
surahOverlay.addEventListener("click",e=>{if(e.target===surahOverlay){closeSurahModal();}});

/* ══════════════════════════
   Quran Reader
   ══════════════════════════ */
function cacheKey(i){return i+"_"+scriptSelect.value+"_"+transSelect.value;}

function openReader(i){
  currentReaderIdx=i;const s=S[i];
  /* Hide hamburger */
  if(sidebarToggle)sidebarToggle.classList.add("modal-open");
  /* Add back button to reader header */
  var readerTitle=document.getElementById("reader-title");
  readerTitle.innerHTML=`<button class="sm-back-btn" id="reader-back">&#8592; Back</button><span style="color:#FFD700;margin-left:12px">${s[1]}</span> ${i+1}. ${s[0]} — ${s[6]}`;
  document.getElementById("reader-loading").textContent="Loading surah...";
  document.getElementById("reader-loading").classList.remove("hidden");
  document.getElementById("reader-content").classList.add("hidden");
  readerOverlay.classList.remove("hidden");
  /* Wire back button */
  var backBtn=document.getElementById("reader-back");
  if(backBtn)backBtn.addEventListener("click",function(){closeReader();});
  fetchAndRender(i);
}

function closeReader(){
  readerOverlay.classList.add("hidden");currentReaderIdx=-1;
  if(sidebarToggle)sidebarToggle.classList.remove("modal-open");
}
function fetchAndRender(i){
  const key=cacheKey(i);
  if(readerCache[key]){renderAyahs(i,readerCache[key]);return;}
  document.getElementById("reader-loading").textContent="Loading surah...";
  document.getElementById("reader-loading").classList.remove("hidden");
  document.getElementById("reader-content").classList.add("hidden");
  fetch(`https://api.alquran.cloud/v1/surah/${i+1}/editions/${scriptSelect.value},${transSelect.value}`)
    .then(r=>r.json()).then(data=>{
      if(data.code===200&&data.data&&data.data.length===2){
        const ar=data.data[0].ayahs,en=data.data[1].ayahs;
        const ayahs=ar.map((a,j)=>({num:a.numberInSurah,ar:a.text,en:en[j].text}));
        readerCache[key]=ayahs;renderAyahs(i,ayahs);
      }else{document.getElementById("reader-loading").textContent="Could not load surah. Try again.";}
    }).catch(()=>{document.getElementById("reader-loading").textContent="Network error. Check connection.";});
}
function renderAyahs(i,ayahs){
  const content=document.getElementById("reader-content");
  let html="";
  if(i!==0&&i!==8)html+=`<div class="reader-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
  ayahs.forEach(a=>{html+=`<div class="ayah-row"><div class="ayah-num">${a.num}</div><div class="ayah-text"><div class="ayah-ar">${a.ar}</div><div class="ayah-en">${a.en}</div></div></div>`;});
  content.innerHTML=html;content.className=`reader-view-${currentView}`;
  document.getElementById("reader-loading").classList.add("hidden");
  content.classList.remove("hidden");
  document.getElementById("reader-body").scrollTop=0;
  if(fontLevel!==0)applyFontSize();
}
scriptSelect.addEventListener("change",()=>{if(currentReaderIdx>=0)fetchAndRender(currentReaderIdx);});
transSelect.addEventListener("change",()=>{if(currentReaderIdx>=0)fetchAndRender(currentReaderIdx);});
document.querySelectorAll(".reader-tab").forEach(tab=>tab.addEventListener("click",()=>{
  document.querySelectorAll(".reader-tab").forEach(t=>t.classList.remove("active"));
  tab.classList.add("active");currentView=tab.dataset.view;
  const c=document.getElementById("reader-content");c.className=`reader-view-${currentView}`;
}));
document.getElementById("reader-close").addEventListener("click",()=>{closeReader();});
readerOverlay.addEventListener("click",e=>{if(e.target===readerOverlay){closeReader();}});

/* ── Font size controls ── */
let fontLevel=0; /* -3 to +5, 0=default */
const FONT_AR_BASE=22,FONT_EN_BASE=13,FONT_STEP=2;
function applyFontSize(){
  var arSize=FONT_AR_BASE+(fontLevel*FONT_STEP);
  var enSize=FONT_EN_BASE+(fontLevel*FONT_STEP);
  var body=document.getElementById("reader-body");
  if(!body)return;
  body.style.setProperty("--reader-ar-size",arSize+"px");
  body.style.setProperty("--reader-en-size",enSize+"px");
  document.querySelectorAll(".ayah-ar").forEach(function(el){el.style.fontSize=arSize+"px";});
  document.querySelectorAll(".ayah-en").forEach(function(el){el.style.fontSize=enSize+"px";});
}
document.getElementById("font-increase").addEventListener("click",function(){if(fontLevel<5){fontLevel++;applyFontSize();}});
document.getElementById("font-decrease").addEventListener("click",function(){if(fontLevel>-3){fontLevel--;applyFontSize();}});
document.getElementById("font-reset").addEventListener("click",function(){fontLevel=0;applyFontSize();});

/* ══════════════════════════
   Audio Player — bottom bar controls
   ══════════════════════════ */

document.getElementById("audio-play").addEventListener("click",()=>{
  if(!audio||!audio.src)return;
  if(isPlaying){audio.pause();isPlaying=false;updatePlayButtons();updateModalTitle();}
  else{audio.play().then(function(){isPlaying=true;updatePlayButtons();updateModalTitle();}).catch(function(){});}
});
document.getElementById("audio-stop").addEventListener("click",()=>{
  if(!audio)return;
  audio.pause();audio.currentTime=0;isPlaying=false;updatePlayButtons();updateModalTitle();
});
document.getElementById("audio-prev").addEventListener("click",()=>{if(currentAudioIdx>0){playAudio(currentAudioIdx-1);if(currentModalIdx>=0)showModalPlayer(currentAudioIdx);}});
document.getElementById("audio-next").addEventListener("click",()=>{if(currentAudioIdx<113){playAudio(currentAudioIdx+1);if(currentModalIdx>=0)showModalPlayer(currentAudioIdx);}});
document.getElementById("audio-close").addEventListener("click",()=>{
  destroyAudio();isPlaying=false;currentAudioIdx=-1;
  audioBar.classList.add("hidden");infoBar.classList.remove("pushed-up");
  const pc=document.getElementById("sm-player-container");if(pc)pc.innerHTML="";
  updatePlayButtons();
});

document.getElementById("audio-seek").addEventListener("input",e=>{if(audio&&audio.duration)audio.currentTime=(e.target.value/100)*audio.duration;});

function updateFilterLabel(){
  let p=[];if(qc.activeTheme!==null)p.push(THEMES[qc.activeTheme].name);
  if(qc.activeJuz>0)p.push("Juz "+qc.activeJuz);
  if(qc.filteredSet)p.push(qc.filteredSet.size+" matches");
  filterLabel.textContent=p.length?"Filtering: "+p.join(" + "):"Showing all 114 surahs";
}
})();
