const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = 'C:\\inetpub\\wwwroot\\just-canvas-backend\\storage\\app\\marketing\\ad-creatives';

// Official maple leaf path from the Flag of Canada (Wikimedia Commons)
// viewBox "-2015 -2000 4030 4030" — natural size ~4030 units
const LEAF_PATH = 'm-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27l332-652 332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z';

const formats = [
  { file: '1080x1080', width: 1080, height: 1080 },
  { file: '1080x1920', width: 1080, height: 1920 },
  { file: '1200x628',  width: 1200, height: 628  },
];

// Arial advance widths (per 1000 em) — used to measure text for true centering,
// since librsvg gives no text-metrics API and char-count estimates drift badly.
const ARIAL_W = {
  ' ':278,'!':278,'"':355,'#':556,'$':556,'%':889,'&':667,"'":191,'(':333,')':333,
  '*':389,'+':584,',':278,'-':333,'.':278,'/':278,'0':556,'1':556,'2':556,'3':556,
  '4':556,'5':556,'6':556,'7':556,'8':556,'9':556,':':278,';':278,'<':584,'=':584,
  '>':584,'?':556,'@':1015,
  'A':667,'B':667,'C':722,'D':722,'E':667,'F':611,'G':778,'H':722,'I':278,'J':500,
  'K':667,'L':556,'M':833,'N':722,'O':778,'P':667,'Q':778,'R':722,'S':667,'T':611,
  'U':722,'V':667,'W':944,'X':667,'Y':667,'Z':611,
  'a':556,'b':556,'c':500,'d':556,'e':556,'f':278,'g':556,'h':556,'i':222,'j':222,
  'k':500,'l':222,'m':833,'n':556,'o':556,'p':556,'q':556,'r':333,'s':500,'t':278,
  'u':556,'v':500,'w':722,'x':500,'y':500,'z':500,
};
function measureArial(str, fontSize) {
  let units = 0;
  for (const ch of str) units += (ARIAL_W[ch] != null ? ARIAL_W[ch] : 556);
  return units / 1000 * fontSize;
}

// Inline maple leaf centered at (cx, cy), rendered at px pixels tall
function mapleLeaf(cx, cy, px) {
  // Path natural height: 4030 units (y: -2000 to +2030)
  // Path natural center: x=0, y=~15
  const scale = px / 4030;
  const tx = cx;
  const ty = cy - 15 * scale; // offset to visually center (stem shifts centroid down slightly)
  return `<path fill="#D52B1E" transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${scale.toFixed(6)})" d="${LEAF_PATH}"/>`;
}

// "for 🍁 municipal campaigns" laid out as positioned SVG elements
function subtextGroup(cx, y, fontSize) {
  const leafPx = fontSize * 1.0;   // leaf same height as cap
  const gap    = fontSize * 0.5;
  const forW   = measureArial('for', fontSize);
  const polW   = measureArial('municipal campaigns', fontSize);
  const total  = forW + gap + leafPx + gap + polW;
  const startX = cx - total / 2;
  const leafCX = startX + forW + gap + leafPx / 2;
  const polX   = startX + forW + gap + leafPx + gap;
  // Vertical: center leaf with text cap
  const leafCY = y - fontSize * 0.35;

  return `<text x="${startX.toFixed(1)}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="400" fill="#aaaaaa" text-anchor="start">for</text>
  ${mapleLeaf(leafCX, leafCY, leafPx)}
  <text x="${polX.toFixed(1)}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="400" fill="#aaaaaa" text-anchor="start">municipal campaigns</text>`;
}

const svgs = {
  '1080x1080': `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="#ffffff"/>
  <rect width="1080" height="18" fill="#1a3570"/>
  <text x="940" y="980" font-family="Arial, sans-serif" font-size="900" font-weight="900" fill="#1a3570" text-anchor="middle" opacity="0.04">?</text>
  <text x="540" y="320" font-family="Arial, sans-serif" font-size="110" font-weight="900" fill="#1a3570" text-anchor="middle">How many doors</text>
  <text x="540" y="450" font-family="Arial, sans-serif" font-size="110" font-weight="900" fill="#1a3570" text-anchor="middle">did your team</text>
  <text x="540" y="610" font-family="Arial, sans-serif" font-size="138" font-weight="900" fill="#4a90d9" text-anchor="middle">knock today?</text>
  <rect x="190" y="680" width="700" height="160" rx="12" fill="#1a3570"/>
  <text x="540" y="782" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">Just Canvass  &#x2192;</text>
  ${subtextGroup(540, 915, 46)}
</svg>`,

  '1080x1920': `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="#ffffff"/>
  <rect width="1080" height="18" fill="#1a3570"/>
  <text x="800" y="1750" font-family="Arial, sans-serif" font-size="1600" font-weight="900" fill="#1a3570" text-anchor="middle" opacity="0.035">?</text>
  <text x="540" y="480" font-family="Arial, sans-serif" font-size="120" font-weight="900" fill="#1a3570" text-anchor="middle">How many</text>
  <text x="540" y="700" font-family="Arial, sans-serif" font-size="210" font-weight="900" fill="#4a90d9" text-anchor="middle">doors</text>
  <text x="540" y="870" font-family="Arial, sans-serif" font-size="105" font-weight="900" fill="#1a3570" text-anchor="middle">did your team</text>
  <text x="540" y="1050" font-family="Arial, sans-serif" font-size="125" font-weight="900" fill="#1a3570" text-anchor="middle">knock today?</text>
  <line x1="120" y1="1160" x2="960" y2="1160" stroke="#1a3570" stroke-width="3" stroke-opacity="0.15"/>
  <rect x="150" y="1250" width="780" height="155" rx="14" fill="#1a3570"/>
  <text x="540" y="1351" font-family="Arial, sans-serif" font-size="66" font-weight="900" fill="#ffffff" text-anchor="middle">Just Canvass  &#x2192;</text>
  ${subtextGroup(540, 1520, 54)}
</svg>`,

  '1200x628': `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628">
  <rect width="1200" height="628" fill="#ffffff"/>
  <rect width="1200" height="12" fill="#1a3570"/>
  <text x="1060" y="600" font-family="Arial, sans-serif" font-size="580" font-weight="900" fill="#1a3570" text-anchor="middle" opacity="0.04">?</text>
  <text x="600" y="128" font-family="Arial, sans-serif" font-size="88" font-weight="900" fill="#1a3570" text-anchor="middle">How many doors</text>
  <text x="600" y="230" font-family="Arial, sans-serif" font-size="88" font-weight="900" fill="#1a3570" text-anchor="middle">did your team</text>
  <text x="600" y="344" font-family="Arial, sans-serif" font-size="108" font-weight="900" fill="#4a90d9" text-anchor="middle">knock today?</text>
  <rect x="300" y="406" width="600" height="120" rx="8" fill="#1a3570"/>
  <text x="600" y="481" font-family="Arial, sans-serif" font-size="50" font-weight="900" fill="#ffffff" text-anchor="middle">Just Canvass  &#x2192;</text>
  ${subtextGroup(600, 588, 34)}
</svg>`,
};

// ---------------------------------------------------------------------------
// Google Display Network sizes ("dimensions-google")
// Parametric layouts: each archetype redesigns the composition for its aspect
// ratio rather than rescaling one design (per skill conventions).
// ---------------------------------------------------------------------------

// Largest font-size (px) at which `str` fits within maxW, optionally capped.
// SAFETY pads the metric: librsvg on Windows substitutes a font slightly wider
// than true Arial, so the table under-measures — shrink ~10% to avoid clipping.
const SAFETY = 1.13;
function fitFont(str, maxW, cap) {
  const f = maxW / (measureArial(str, 1) * SAFETY); // measureArial is linear in font-size
  return cap != null ? Math.min(f, cap) : f;
}

const C = { navy: '#1a3570', blue: '#4a90d9', white: '#ffffff' };
const BTN = 'Just Canvass  &#x2192;';      // entity arrow renders in librsvg
const BTN_W = 'Just Canvass  >';            // ASCII proxy for width measuring

// Square / rectangle: 200×200, 250×250, 300×250, 336×280
function buildSquare(w, h) {
  const cx = w / 2;
  const bar = Math.max(3, Math.round(h * 0.045));
  const hf = fitFont('How many doors', w * 0.90, w * 0.14);
  const accent = hf * 1.12;
  const gap = hf * 1.12;
  const y1 = h * 0.17 + hf;
  const y2 = y1 + gap;
  const y3 = y2 + gap * 0.55 + (accent - hf);
  const btnW = w * 0.82, btnH = hf * 1.5;
  const btnX = cx - btnW / 2;
  const btnY = y3 + hf * 0.6;
  const btnFont = fitFont(BTN_W, btnW * 0.82, btnH * 0.46);
  const btnTextY = btnY + btnH / 2 + btnFont * 0.35;
  const subFont = hf * 0.42;
  const subY = btnY + btnH + subFont * 1.55;
  const showSub = subY <= h - Math.max(6, h * 0.04);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${C.white}"/>
  <rect width="${w}" height="${bar}" fill="${C.navy}"/>
  <text x="${(w * 0.9).toFixed(1)}" y="${(h * 0.97).toFixed(1)}" font-family="Arial, sans-serif" font-size="${(h * 1.5).toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="middle" opacity="0.045">?</text>
  <text x="${cx}" y="${y1.toFixed(1)}" font-family="Arial, sans-serif" font-size="${hf.toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="middle">How many doors</text>
  <text x="${cx}" y="${y2.toFixed(1)}" font-family="Arial, sans-serif" font-size="${hf.toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="middle">did your team</text>
  <text x="${cx}" y="${y3.toFixed(1)}" font-family="Arial, sans-serif" font-size="${accent.toFixed(1)}" font-weight="900" fill="${C.blue}" text-anchor="middle">knock today?</text>
  <rect x="${btnX.toFixed(1)}" y="${btnY.toFixed(1)}" width="${btnW.toFixed(1)}" height="${btnH.toFixed(1)}" rx="${(btnH * 0.18).toFixed(1)}" fill="${C.navy}"/>
  <text x="${cx}" y="${btnTextY.toFixed(1)}" font-family="Arial, sans-serif" font-size="${btnFont.toFixed(1)}" font-weight="900" fill="${C.white}" text-anchor="middle">${BTN}</text>
  ${showSub ? subtextGroup(cx, subY, subFont) : ''}
</svg>`;
}

// Half-page 300×600: tall word-cascade with accent punchline + subtext
function buildHalfPage(w, h) {
  const cx = w / 2;
  const f = fitFont('did your team', w * 0.90, w * 0.13);
  const big = fitFont('doors', w * 0.92, w * 0.34);
  const y1 = h * 0.16;
  const y2 = y1 + big * 0.95;
  const y3 = y2 + f * 1.35;
  const y4 = y3 + f * 1.25;
  const btnW = w * 0.84, btnH = f * 1.5;
  const btnX = cx - btnW / 2;
  const btnY = y4 + f * 1.1;
  const btnFont = fitFont(BTN_W, btnW * 0.82, btnH * 0.46);
  const btnTextY = btnY + btnH / 2 + btnFont * 0.35;
  const subFont = f * 0.46;
  const subY = btnY + btnH + subFont * 1.7;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${C.white}"/>
  <rect width="${w}" height="${Math.round(h * 0.02)}" fill="${C.navy}"/>
  <text x="${(w * 0.78).toFixed(1)}" y="${(h * 0.95).toFixed(1)}" font-family="Arial, sans-serif" font-size="${(h * 0.85).toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="middle" opacity="0.04">?</text>
  <text x="${cx}" y="${y1.toFixed(1)}" font-family="Arial, sans-serif" font-size="${f.toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="middle">How many</text>
  <text x="${cx}" y="${y2.toFixed(1)}" font-family="Arial, sans-serif" font-size="${big.toFixed(1)}" font-weight="900" fill="${C.blue}" text-anchor="middle">doors</text>
  <text x="${cx}" y="${y3.toFixed(1)}" font-family="Arial, sans-serif" font-size="${f.toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="middle">did your team</text>
  <text x="${cx}" y="${y4.toFixed(1)}" font-family="Arial, sans-serif" font-size="${f.toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="middle">knock today?</text>
  <rect x="${btnX.toFixed(1)}" y="${btnY.toFixed(1)}" width="${btnW.toFixed(1)}" height="${btnH.toFixed(1)}" rx="${(btnH * 0.18).toFixed(1)}" fill="${C.navy}"/>
  <text x="${cx}" y="${btnTextY.toFixed(1)}" font-family="Arial, sans-serif" font-size="${btnFont.toFixed(1)}" font-weight="900" fill="${C.white}" text-anchor="middle">${BTN}</text>
  ${subtextGroup(cx, subY, subFont)}
</svg>`;
}

// Skyscraper 160×600, 120×600: one word per line, accent punchline, narrow button
function buildSky(w, h) {
  const cx = w / 2;
  const words = [
    ['How', C.navy], ['many', C.navy], ['doors', C.navy], ['did', C.navy],
    ['your', C.navy], ['team', C.navy], ['knock', C.blue], ['today?', C.blue],
  ];
  const f = fitFont('today?', w * 0.84, w * 0.22);
  const lh = f * 1.45;
  let y = h * 0.10 + f;
  let lines = '';
  for (const [t, c] of words) {
    lines += `\n  <text x="${cx}" y="${y.toFixed(1)}" font-family="Arial, sans-serif" font-size="${f.toFixed(1)}" font-weight="900" fill="${c}" text-anchor="middle">${t}</text>`;
    y += lh;
  }
  const btnH = f * 1.5, btnW = w * 0.88, btnX = cx - btnW / 2;
  const btnY = h - btnH - Math.max(8, h * 0.03);
  const btnFont = fitFont(BTN_W, btnW * 0.86, btnH * 0.44);
  const btnTextY = btnY + btnH / 2 + btnFont * 0.35;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${C.white}"/>
  <rect width="${w}" height="${Math.round(h * 0.02)}" fill="${C.navy}"/>${lines}
  <rect x="${btnX.toFixed(1)}" y="${btnY.toFixed(1)}" width="${btnW.toFixed(1)}" height="${btnH.toFixed(1)}" rx="${(btnH * 0.18).toFixed(1)}" fill="${C.navy}"/>
  <text x="${cx}" y="${btnTextY.toFixed(1)}" font-family="Arial, sans-serif" font-size="${btnFont.toFixed(1)}" font-weight="900" fill="${C.white}" text-anchor="middle">${BTN}</text>
</svg>`;
}

// Horizontal banner / billboard: headline left, CTA button right
function buildBanner(w, h) {
  const padX = w * 0.03;
  const btnText = h >= 110 ? BTN_W : 'Just Canvass';
  const btnLabel = h >= 110 ? BTN : 'Just Canvass';
  const btnH = h * 0.60;
  const btnFont = Math.min(h * 0.28, fitFont(btnText, Math.min(w * 0.28, 200), 999));
  const btnW = measureArial(btnText, btnFont) * SAFETY + btnFont * 1.2;
  const btnX = w - padX - btnW;
  const btnY = (h - btnH) / 2;
  const btnTextY = btnY + btnH / 2 + btnFont * 0.35;
  const leftW = btnX - padX * 3;
  const l1 = 'How many doors did';
  const l2 = 'your team knock today?';
  const hf = Math.min(h * 0.36, fitFont(l2, leftW, 999));
  const lineGap = hf * 1.12;
  const y1 = h / 2 - lineGap / 2 + hf * 0.35;
  const y2 = y1 + lineGap;
  const ghost = h >= 90
    ? `\n  <text x="${(w * 0.5).toFixed(1)}" y="${(h * 0.95).toFixed(1)}" font-family="Arial, sans-serif" font-size="${(h * 1.5).toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="middle" opacity="0.04">?</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${C.white}"/>
  <rect width="${w}" height="${Math.max(2, Math.round(h * 0.05))}" fill="${C.navy}"/>${ghost}
  <text x="${padX.toFixed(1)}" y="${y1.toFixed(1)}" font-family="Arial, sans-serif" font-size="${hf.toFixed(1)}" font-weight="900" fill="${C.navy}" text-anchor="start">${l1}</text>
  <text x="${padX.toFixed(1)}" y="${y2.toFixed(1)}" font-family="Arial, sans-serif" font-size="${hf.toFixed(1)}" font-weight="900" fill="${C.blue}" text-anchor="start">${l2}</text>
  <rect x="${btnX.toFixed(1)}" y="${btnY.toFixed(1)}" width="${btnW.toFixed(1)}" height="${btnH.toFixed(1)}" rx="${(btnH * 0.16).toFixed(1)}" fill="${C.navy}"/>
  <text x="${(btnX + btnW / 2).toFixed(1)}" y="${btnTextY.toFixed(1)}" font-family="Arial, sans-serif" font-size="${btnFont.toFixed(1)}" font-weight="900" fill="${C.white}" text-anchor="middle">${btnLabel}</text>
</svg>`;
}

const GOOGLE_SIZES = [
  { file: '300x250', w: 300, h: 250, build: buildSquare },   // Medium Rectangle
  { file: '336x280', w: 336, h: 280, build: buildSquare },   // Large Rectangle
  { file: '250x250', w: 250, h: 250, build: buildSquare },   // Square
  { file: '200x200', w: 200, h: 200, build: buildSquare },   // Small Square
  { file: '300x600', w: 300, h: 600, build: buildHalfPage }, // Half Page
  { file: '160x600', w: 160, h: 600, build: buildSky },      // Wide Skyscraper
  { file: '120x600', w: 120, h: 600, build: buildSky },      // Skyscraper
  { file: '728x90',  w: 728, h: 90,  build: buildBanner },   // Leaderboard
  { file: '970x90',  w: 970, h: 90,  build: buildBanner },   // Large Leaderboard
  { file: '468x60',  w: 468, h: 60,  build: buildBanner },   // Banner
  { file: '320x50',  w: 320, h: 50,  build: buildBanner },   // Mobile Banner
  { file: '320x100', w: 320, h: 100, build: buildBanner },   // Large Mobile Banner
  { file: '970x250', w: 970, h: 250, build: buildBanner },   // Billboard
];

(async () => {
  const adName = 'ad-07-howmany-white-blue';

  // Social formats (square / stories / landscape)
  for (const fmt of formats) {
    const svg = Buffer.from(svgs[fmt.file]);
    const outPath = path.join(OUT, adName, `${fmt.file}.png`);
    await sharp(svg).resize(fmt.width, fmt.height).png().toFile(outPath);
    console.log(`✓ social   ${fmt.file}`);
  }

  // Google Display Network formats
  const gDir = path.join(OUT, adName, 'dimensions-google');
  fs.mkdirSync(gDir, { recursive: true });
  for (const g of GOOGLE_SIZES) {
    const svg = Buffer.from(g.build(g.w, g.h));
    const outPath = path.join(gDir, `${g.file}.png`);
    await sharp(svg).png().toFile(outPath);
    console.log(`✓ google   ${g.file}`);
  }
  console.log(`\nGoogle ads → ${gDir}`);
})();
