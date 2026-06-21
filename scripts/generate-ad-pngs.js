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

// "for 🍁 political campaigns" laid out as positioned SVG elements
function subtextGroup(cx, y, fontSize) {
  const leafPx = fontSize * 1.0;   // leaf same height as cap
  const gap    = fontSize * 0.5;
  const forW   = measureArial('for', fontSize);
  const polW   = measureArial('political campaigns', fontSize);
  const total  = forW + gap + leafPx + gap + polW;
  const startX = cx - total / 2;
  const leafCX = startX + forW + gap + leafPx / 2;
  const polX   = startX + forW + gap + leafPx + gap;
  // Vertical: center leaf with text cap
  const leafCY = y - fontSize * 0.35;

  return `<text x="${startX.toFixed(1)}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="400" fill="#aaaaaa" text-anchor="start">for</text>
  ${mapleLeaf(leafCX, leafCY, leafPx)}
  <text x="${polX.toFixed(1)}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="400" fill="#aaaaaa" text-anchor="start">political campaigns</text>`;
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

(async () => {
  for (const fmt of formats) {
    const svg = Buffer.from(svgs[fmt.file]);
    const outPath = path.join(OUT, 'ad-07-howmany-white-blue', `${fmt.file}.png`);
    await sharp(svg).resize(fmt.width, fmt.height).png().toFile(outPath);
    console.log(`✓ ${fmt.file}: ${outPath}`);
  }
})();
