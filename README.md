# ☆ Burūj al-Qur'ān

### Quranic Constellation — An interactive galaxy of the 114 Surahs

![HTML5](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Glassmorphism-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)
![Surahs](https://img.shields.io/badge/Surahs-114-FFD700)
![Reciters](https://img.shields.io/badge/Reciters-20-34C759)

---

**Burūj al-Qur'ān** (Constellations of the Quran) is a unique, interactive web experience that visualizes all 114 surahs of the Holy Quran as stars in a celestial constellation. Each star's size reflects its verse count, its color represents its primary theme, and glowing lines connect surahs that share deep thematic relationships.

> *"By the sky containing great stars (Burūj)"* — Al-Buruj 85:1

---

## ✦ Features

### 🌌 Interactive Constellation
- **114 stars** arranged in an elliptical golden spiral on HTML5 Canvas
- Star **size** scales with verse count (Al-Baqarah glows largest at 286 ayat)
- Star **color** maps to one of 7 thematic categories
- **Glowing connection lines** reveal thematic relationships between surahs
- Hover to preview, click to explore

### 📖 Built-in Quran Reader
- **3 Arabic scripts**: Uthmani, Imlaei (Simple), Simple without Tashkeel
- **4 English translations**: Muhsin Khan & Hilali (default), Sahih International, Yusuf Ali, Pickthall
- Toggle between Arabic-only, English-only, or side-by-side view
- Bismillah handling (correctly skips for Al-Fatihah and At-Tawbah)

### 🎧 Audio Recitation
- **20 world-renowned reciters** with verified audio sources
- Inline player in surah detail modal — pick your reciter, then play
- Persistent bottom audio bar with seek, prev/next, and reciter switching
- Auto-advances to the next surah on completion

### 🔍 Explore & Filter
- **Search** by surah name (English or Arabic), number, or meaning
- **Filter by theme**: Tawheed, Prophets, Guidance, Akhirah, Worship, Society, Creation
- **Filter by Juz**: All 30 Juz with visual overlay
- **Two layouts**: Mushaf order or Revelation order
- Toggle thematic connection lines on/off

---

## ✦ Reciters

| # | Reciter | Source |
|---|---------|--------|
| 1 | Mishary Rashid Alafasy | Islamic Network CDN |
| 2 | Abdul Basit Abdul Samad | Islamic Network CDN |
| 3 | Abdur-Rahman As-Sudais | MP3Quran |
| 4 | Saud Ash-Shuraim | MP3Quran |
| 5 | Maher Al-Muaiqly | MP3Quran |
| 6 | Mohamed Siddiq Al-Minshawi | QuranicAudio |
| 7 | Abu Bakr Al-Shatri | QuranicAudio |
| 8 | Muhammad Ayyub | QuranicAudio |
| 9 | Muhammad Jibreel | MP3Quran |
| 10 | Ibrahim Al-Akhdar | QuranicAudio |
| 11 | Yasser Ad-Dossari | QuranicAudio |
| 12 | Nasser Al-Qatami | MP3Quran |
| 13 | Ahmed Al-Ajamy | QuranicAudio |
| 14 | Abdullah Awad Al-Juhani | QuranicAudio |
| 15 | Bandar Baleela | QuranicAudio |
| 16 | Ali Jaber | QuranicAudio |
| 17 | Abdullah Basfar | MP3Quran |
| 18 | Fares Abbad | MP3Quran |
| 19 | Khalifah Al-Tunaiji | QuranicAudio |
| 20 | Fatih Seferagic | QuranicAudio |

---

## ✦ Themes

| Theme | Color | Description |
|-------|-------|-------------|
| Tawheed | 🔵 Blue | Oneness of God, divine attributes |
| Prophets | 🟡 Gold | Stories of prophets and past nations |
| Guidance | 🟢 Green | Law, rulings, moral instruction |
| Akhirah | 🔴 Red | Day of Judgment, afterlife |
| Worship | 🟣 Purple | Prayer, devotion, remembrance |
| Society | 🔵 Cyan | Social justice, community, ethics |
| Creation | 🟠 Orange | Signs in nature, cosmos, reflection |

---

## ✦ Tech Stack

- **Rendering**: HTML5 Canvas with `requestAnimationFrame` loop
- **Layout**: Elliptical golden spiral with sqrt spread distribution
- **UI**: Glassmorphism dark theme with `backdrop-filter` blur effects
- **Quran Text**: [AlQuran Cloud API](https://alquran.cloud/api)
- **Audio**: Multi-CDN (Islamic Network, MP3Quran, QuranicAudio)
- **Dependencies**: Zero. Pure HTML, CSS, and vanilla JavaScript.

---

## ✦ Project Structure

```
quranic-constellation/
├── index.html    — App shell, modals, audio bar
├── style.css     — Dark glassmorphism theme, responsive layout
├── data.js       — 114 surahs, themes, Juz mapping, connections, 20 reciters
├── canvas.js     — Canvas rendering engine, spiral layout, star animation
└── ui.js         — UI controller, audio engine, reader, search, filters
```

---

## ✦ Getting Started

No build tools needed. Just open `index.html` in a browser.

```bash
# Clone
git clone https://github.com/ysultankpg/quranic-constellation.git

# Open
open quranic-constellation/index.html
```

Or visit the live site: **[ysultankpg.github.io/quranic-constellation](https://ysultankpg.github.io/quranic-constellation/)**

---

## ✦ APIs & Attribution

- Quran text via [AlQuran Cloud API](https://alquran.cloud/) (open, no key required)
- Audio via [Islamic Network CDN](https://cdn.islamic.network/), [MP3Quran](https://mp3quran.net/), and [QuranicAudio](https://quranicaudio.com/)
- All Quran content is the word of Allah — this app is a tool to explore and listen to it

---

## ✦ License

MIT License. Free to use, modify, and share.

Built with reverence for the Holy Quran.

---

<p align="center">
  <em>"Indeed, it is We who sent down the Quran and indeed, We will be its guardian."</em><br>
  — Al-Hijr 15:9
</p>
