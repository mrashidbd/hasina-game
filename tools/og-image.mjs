// Renders the link-preview image (icons/og-image.jpg, 1200×630, JPEG: WhatsApp wants previews under ~300 KB) with the same
// drawCard() the game uses for share cards, in headless Chromium.
// Usage (a static server must serve the repo, e.g. python3 -m http.server 8765):
//   node tools/cdp.mjs tools/og-image.mjs
// Env: OG_LANG=bn|en (default bn: the main audience), OG_OUT (default icons/og-image.jpg).
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = process.env.OG_OUT || 'icons/og-image.jpg';
const LANG = process.env.OG_LANG || 'bn';

export default async ({ ev, sleep }) => {
  await ev(`localStorage.setItem('kto-lang', ${JSON.stringify(LANG)}); location.reload();`).catch(() => {});
  await sleep(2500);
  const data = await ev(`await (async () => {
    const { preloadImages } = await import('./js/assets.js');
    await new Promise((done) => { let n = 0; preloadImages(() => { if (++n >= 21) done(); }); setTimeout(done, 4000); });
    await document.fonts.load('800 40px "KTO Bangla"', 'বাংলা');
    const { drawCard } = await import('./js/share.js');
    const c = document.createElement('canvas');
    c.width = 1200; c.height = 630;
    drawCard(c.getContext('2d'), 1200, 630, { promo: true, hero: 'studentF' });
    return c.toDataURL('image/jpeg', 0.86);
  })()`);
  writeFileSync(path.resolve(OUT), Buffer.from(data.split(',')[1], 'base64'));
  console.log(`wrote ${OUT}`);
};
