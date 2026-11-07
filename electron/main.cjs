// The desktop app (npm run desktop / npm run dist): Tengu in its own window, updating itself from
// GitHub Releases.
//
// The game is served from app://tengu/ rather than loaded off the disk, so it runs exactly as it
// does from a web server: ES modules, module workers and fetch() all work. Keep that address the
// same in every version: saves live in the page's localStorage, which belongs to the address, so
// changing it would lose everyone's saves.

const { app, BrowserWindow, protocol, net, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'app';
const HOST = 'tengu';
const ROOT = path.join(__dirname, '..');
// Check for a new version at start and then every few hours.
const UPDATE_EVERY = 4 * 60 * 60 * 1000;

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// Only one copy of the game at a time (a second launch brings the first to the front).
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function serveGame() {
  protocol.handle(SCHEME, (req) => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(ROOT, decodeURIComponent(pathname === '/' ? '/index.html' : pathname)));
    // Never serve anything outside the game's own folder.
    if (!file.startsWith(ROOT)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    title: 'Tengu',
    backgroundColor: '#2b2140',
    autoHideMenuBar: true,
    icon: path.join(ROOT, 'electron', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false },
  });
  win.removeMenu();
  win.loadURL(`${SCHEME}://${HOST}/index.html`);
  // Links out of the game open in the player's own browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
  // F11 toggles full screen; F12 opens the developer tools in a build run from source.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    } else if (input.key === 'F12' && !app.isPackaged) {
      win.webContents.toggleDevTools();
    }
  });
  win.on('closed', () => { win = null; });
}

// Updates: downloaded quietly in the background; once one is ready the player is asked whether to
// restart now (otherwise it installs the next time they quit).
// (The versions were renumbered down to 0.1 after 1.0.1, so an update may carry a lower number
// than the copy installed: take it anyway, it's the newest release.)
autoUpdater.allowDowngrade = true;
function checkForUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.checkForUpdates().catch(() => {});
}
autoUpdater.on('update-downloaded', async (info) => {
  const { response } = await dialog.showMessageBox(win ?? undefined, {
    type: 'info',
    buttons: ['Restart now', 'Later'],
    defaultId: 0,
    cancelId: 1,
    title: 'Update ready',
    message: `Tengu ${info.version} is ready.`,
    detail: 'Restart to play the new version. If you choose Later, it installs when you quit.',
  });
  if (response === 0) autoUpdater.quitAndInstall();
});

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

// A self-check for builds (TENGU_SMOKE=1): load the game, make sure it started with no errors
// and that a save survives, then quit with exit code 0 (fine) or 1 (something broke).
async function smokeTest() {
  const errors = [];
  win.webContents.on('console-message', (e, level, message) => { if (level >= 3) errors.push(message); });
  await new Promise((r) => win.webContents.once('did-finish-load', r));
  await new Promise((r) => setTimeout(r, 4000));
  const ok = await win.webContents.executeJavaScript("typeof window.twzt === 'object' && (localStorage.setItem('tengu-smoke', '1'), localStorage.getItem('tengu-smoke') === '1')").catch((e) => errors.push(String(e)) && false);
  // (TENGU_SMOKE_SHOT=<file.png> also saves a picture of the window.)
  if (process.env.TENGU_SMOKE_SHOT) require('node:fs').writeFileSync(process.env.TENGU_SMOKE_SHOT, (await win.webContents.capturePage()).toPNG());
  console.log(JSON.stringify({ started: ok, errors, version: app.getVersion() }));
  app.exit(ok && !errors.length ? 0 : 1);
}

app.whenReady().then(() => {
  serveGame();
  createWindow();
  if (process.env.TENGU_SMOKE) return smokeTest();
  checkForUpdates();
  setInterval(checkForUpdates, UPDATE_EVERY);
});

app.on('window-all-closed', () => app.quit());
