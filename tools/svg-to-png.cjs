// Renders SVG files to transparent PNGs with the browser (build-fx.py uses it for emblem art).
// Usage: node tools/svg-to-png.cjs SIZE in.svg out.png [in2.svg out2.png ...]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [size, ...files] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: Number(size), height: Number(size) } });
  for (let i = 0; i < files.length; i += 2) {
    const svg = fs.readFileSync(files[i], 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `);
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: files[i + 1], omitBackground: true, clip: { x: 0, y: 0, width: Number(size), height: Number(size) } });
  }
  await b.close();
})();
