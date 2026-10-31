// Draws the app icon (electron/icon.png) from tools/app-icon.html with the game's own renderer.
// Usage: npm run icon

const { app, BrowserWindow, protocol, net } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

app.whenReady().then(async () => {
  protocol.handle('app', (req) => net.fetch(pathToFileURL(path.join(ROOT, decodeURIComponent(new URL(req.url).pathname))).toString()));
  const win = new BrowserWindow({ show: false, width: 256, height: 256, webPreferences: { offscreen: true } });
  await win.loadURL('app://tengu/tools/app-icon.html');
  for (let i = 0; i < 100 && !(await win.webContents.executeJavaScript('window.done === true')); i++) await new Promise((r) => setTimeout(r, 50));
  const data = await win.webContents.executeJavaScript("document.getElementById('c').toDataURL('image/png')");
  fs.writeFileSync(path.join(__dirname, 'icon.png'), Buffer.from(data.split(',')[1], 'base64'));
  console.log('wrote electron/icon.png');
  app.quit();
});
