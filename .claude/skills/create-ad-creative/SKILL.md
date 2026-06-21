---
name: create-ad-creative
description: Design and render Just Canvass display/social ads as SVG → PNG. Use when the user asks to create, edit, or regenerate ad creatives (Google Display 300×250, Facebook/Instagram 1080×1080, Stories/Reels 1080×1920, landscape 1200×628). Covers brand colors, layout conventions, the Canadian maple leaf element, and the sharp/librsvg rendering pipeline with its gotchas.
---

# Creating Just Canvass Ad Creatives

Just Canvass (justcanvass.ca) is door-knocking / canvassing software **for political campaigns in Canada**. Ads are hand-authored SVG, rendered to PNG with `sharp`. This skill captures the brand, layout rules, the maple-leaf element, and — importantly — the rendering gotchas that cost time the first round.

## Brand

- **Blue theme** (primary): dark navy `#1a3570`, accent blue `#4a90d9`, white `#ffffff`
- **Orange theme** (alt): `#e8610a` on white, near-black text `#1a1a1a`
- **Maple leaf red**: `#D52B1E`
- Subtext gray: `#aaaaaa`
- Font: `Arial, sans-serif` (or `'Helvetica Neue', Arial, sans-serif` in the 300×250 source SVGs). Headlines are `font-weight="900"`.

## Layout conventions (learned preferences)

- **No "Just Canvass" header** at the top. The brand name lives **inside the CTA button** instead, e.g. `Just Canvass  →`.
- **Center all text** properly (`text-anchor="middle"`, x = canvas center).
- Reclaim empty space at the top — shift content up into it; don't leave a dead band.
- Keep an **8–20px bottom margin** on the 300×250 ads (avoid 30px+ gaps — they read as unbalanced). Button-text vertical centering baseline = `rectY + rectH/2 + fontSize*0.35`.
- **Ghost watermark**: a giant `?` (or theme glyph) at `opacity` 0.035–0.05, anchored bottom-right, behind the copy. Adds depth without noise.
- **Subtext** under the button reads `for 🍁 political campaigns` — lowercase, no period, with the maple leaf between "for" and "political". Center the whole line via `measureArial` (see gotcha 7). Place it **fairly close under the button**, not floating at the canvas bottom — the user prefers it tucked just beneath (e.g. button bottom ~840 → subtext baseline ~915 on the 1080² ad, a ~75px gap), and consistent across all three formats including the 1200×628.
- **Subtext appears on ALL formats** including 1200×628. On the landscape ad the user prefers the whole composition shifted **up** (headline starting higher, ~y=128) so the button + subtext clear the bottom edge with margin — don't bottom-anchor the landscape layout.
- Stories/Reels (1080×1920): keep content between **y=300 and ~y=1670** to clear Instagram's top profile bar and bottom link-sticker UI. Use a word-cascade (each line bigger, punchline word huge in accent color).
- **Iterate vertical spacing by eye, then verify.** The user fine-tunes button/subtext y-positions repeatedly ("move it up a bit", "tuck it under"). Expect several rounds — make the single y-value edit, regenerate, and Read the PNG each time rather than batching guesses.

## The Canadian maple leaf — DO THIS, NOT THAT

Use the **official Flag of Canada leaf path** (11-point, from Wikimedia Commons `File:Maple_Leaf.svg`). Do **not** hand-roll a leaf path — earlier attempts rendered as garbage.

```
viewBox of source: "-2015 -2000 4030 4030"  (natural height ~4030 units, center x=0, y≈15)
```

Path `d`:
```
m-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27l332-652 332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z
```

To place it at height `px` centered at (cx, cy):
```js
const scale = px / 4030;
const ty = cy - 15 * scale;   // recenter for stem-shifted centroid
`<path fill="#D52B1E" transform="translate(${cx},${ty}) scale(${scale})" d="${LEAF_PATH}"/>`
```

Spacing in the subtext line: gap between "for", the leaf, and "political" should be `~0.5 * fontSize` on each side (0.3 was too tight).

## Rendering pipeline & gotchas

Renderer is **sharp**, which uses **librsvg** under the hood. Known failures (all hit during development):

1. **Emoji do not render.** `🇨🇦` and other emoji fall back to text ("CA") or a box. Never rely on emoji glyphs — draw the leaf as an inline `<path>`.
2. **No SVG-inside-SVG via data URI.** `<image href="data:image/svg+xml;base64,...">` silently fails to render. Inline the shapes as native SVG elements instead.
3. **PNG data URIs work**, but rasterizing an external flag is unnecessary — the inline path is simpler and dependency-free.
4. **Don't fetch the leaf from a CDN at build time.** The Twemoji CDN returned an HTML error page that then broke `sharp`. The path is embedded in this skill — use it directly.
5. **Arrow `→`** renders fine as `&#x2192;` (HTML entity) inside a `<text>`.
6. The renderer can't preview via browser (`file://` and `localhost` are sandbox-blocked, Playwright times out). **Verify by reading the generated PNG with the Read tool** — always actually look at the output image before declaring done; don't trust the layout math alone.
7. **No text-metrics API.** To center a line that mixes `<text>` and an inline shape (like the maple-leaf subtext), char-count width guesses (`fontSize * 0.52 * len`) drift badly and shift the line off-center. Use a real **Arial advance-width table** (`measureArial()` in the script — widths per 1000 em) to measure each text run, then compute total width and `startX = cx - total/2`. This is what makes "for 🍁 political campaigns" sit truly centered under the button.

## Pipeline script

The working generator is `scripts/generate-ad-pngs.js`. It defines inline SVG strings per format, then:
```js
await sharp(Buffer.from(svgString)).resize(w, h).png().toFile(outPath);
```
Each format (square / stories / landscape) gets its **own independently-tuned layout** — don't just rescale one design, redesign the composition per aspect ratio.

**Output dir** for live/trial ads:
`C:\inetpub\wwwroot\just-canvas-backend\storage\app\marketing\ad-creatives\<ad-name>\`

**Source 300×250 SVGs** live in:
`src/assets/images/ads/` (e.g. `ad-07-howmany-white-blue.svg`, themed `-blue` / `-orange` pairs)

## Facebook / Instagram size specs

| Placement | Size | Key constraint |
|---|---|---|
| Feed square | 1080×1080 | safe everywhere |
| Stories / Reels | 1080×1920 | content within y=300–1670 (avoid UI chrome top/bottom) |
| Landscape / link | 1200×628 | wide, headline + CTA |

## Workflow when asked for a new ad

1. Confirm theme (blue/white default) and the headline concept.
2. Author each format's SVG with the conventions above (centered, no header, brand-in-button, ghost `?`, maple-leaf subtext).
3. Add it to `scripts/generate-ad-pngs.js` (or copy the pattern) and run `node scripts/generate-ad-pngs.js`.
4. Read the resulting PNG to sanity-check spacing/centering; iterate on the math, not by eye-in-browser.
