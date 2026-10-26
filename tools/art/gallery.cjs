// Usage: node gallery.cjs <group> <out.png> [keys] — screenshots tools/mob-gallery.html.
const { chromium } = require('playwright');
const [group, out, keys] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`http://localhost:8000/tools/mob-gallery.html?group=${group}${keys ? '&keys=' + keys : ''}&t=${Date.now()}`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 15000 }).catch(() => errs.push('gallery never finished'));
  await p.screenshot({ path: out, fullPage: true });
  console.log(errs.length ? errs.join('\n') : 'ok'); await b.close();
})();
