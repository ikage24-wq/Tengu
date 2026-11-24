// Fawnelle on screen (2026-11-23). Her pictures come from her own painter (render/fawnelle/worker.js),
// live, so her rig answers to how she really moves (her steps follow the ground she covers, her hair
// and charms swing on springs); the game only places the newest picture, a drawImage a frame.
//
// One request is out at a time, at most 60 a second (15 while she's just off screen): it carries the
// time, how far she has walked since the last one, her emotion and whether she's talking, and the
// views wanted: her body at the screen's density always, and while they're wanted a close face (a
// cutscene's portrait window) and a waist-up photo (the talk window's). Her newest picture is placed
// where she stands this frame, so she glides at the screen's own rate (the player's "her walk
// isn't smooth": placed where she stood for it, she moved in steps); a planted hoof drifts by a
// fraction of a pixel at most before the next picture. Without workers (an old browser) she is
// painted here instead, a few times a second; with no page at all (the tests) she isn't drawn.
import { gfx, snap, footShadow } from '../pixel.js';
import { ANCHOR, BOX, FACE } from './box.js';

const S = {
  worker: undefined,
  local: null,
  busy: false,
  sentAt: -9,
  seq: 0,
  lastX: null,
  lastT: null,
  vx: 0,
  sentX: null,
  pics: {},
  want: { face: -9, photo: -9 },
  talkWin: { until: -9, talking: false },
  shownAt: -9,
  firstAt: null,
  reset: true,
  time: 0,
};
const FPS = 60;
const FPS_NEAR = 15;
// The cutscene's portrait window (ui/cutscene.js PORTRAIT) and how close it sits on her face.
const FACE_WIN = 70;
const FACE_ZOOM = 2.35;
// The talk window's photo: the area her waist-up picture covers, and its zoom.
const PHOTO_W = 110;
const PHOTO_H = 132;
const PHOTO_ZOOM = 2.35;

function painter() {
  if (S.worker !== undefined) return S.worker;
  S.worker = false;
  if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    try {
      const w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      w.onmessage = ({ data }) => took(data);
      w.onerror = () => {
        S.worker = false;
        S.busy = false;
      };
      S.worker = w;
    } catch {
      S.worker = false;
    }
  }
  return S.worker;
}

// (No workers: painted on this thread, a few times a second, into canvases of its own.)
function paintHere(q) {
  if (typeof document === 'undefined' || typeof Path2D === 'undefined') return;
  if (!S.local) {
    S.local = { art: null, canvases: new Map(), loading: true };
    import('./art.js').then((art) => {
      S.local.art = art;
      S.local.loading = false;
    });
  }
  const L = S.local;
  if (!L.art) {
    S.busy = false;
    return;
  }
  if (q.reset) L.art.resetFawnelle();
  const dt = L.last == null ? 1 / 30 : Math.min(0.25, Math.max(0, q.t - L.last));
  L.last = q.t;
  L.art.stepFawnelle(dt, q.dist, q.emote, q.emoteT, q.talk);
  const pics = {};
  for (const v of q.views) {
    const c = document.createElement('canvas');
    c.width = v.w;
    c.height = v.h;
    const g = c.getContext('2d');
    g.setTransform(v.k, 0, 0, v.k, -v.x0 * v.k, -v.y0 * v.k);
    L.art.paintFawnelle(g, v.k, v.upper);
    pics[v.id] = c;
  }
  took({ seq: q.seq, pics });
}

const sent = new Map();
function took(d) {
  S.busy = false;
  const q = sent.get(d.seq);
  sent.delete(d.seq);
  if (d.error || !q) {
    if (d.error) {
      // (A painter that can't paint her isn't asked again: she stays as she last was.)
      S.worker = false;
      S.failed = d.error;
    }
    return;
  }
  for (const [id, pic] of Object.entries(d.pics)) {
    S.pics[id]?.pic?.close?.();
    S.pics[id] = { pic, x: q.x, y: q.y, facing: q.facing, view: q.views.find((v) => v.id === id), res: q.res };
  }
  if (S.firstAt == null) S.firstAt = S.time;
}

// The views at this density: her body's box, and the close-ups while they're wanted.
function viewsFor(res, time) {
  const k = res / 3;
  const views = [{ id: 'body', k, x0: BOX.x0, y0: BOX.y0, w: Math.ceil((BOX.x1 - BOX.x0) * k), h: Math.ceil((BOX.y1 - BOX.y0) * k), upper: false }];
  if (S.want.face > time) {
    const kf = (res * FACE_ZOOM) / 3;
    const half = (FACE_WIN / 2) * (3 / FACE_ZOOM);
    views.push({ id: 'face', k: kf, x0: FACE.x - half, y0: FACE.y - half, w: Math.ceil(FACE_WIN * res), h: Math.ceil(FACE_WIN * res), upper: true });
  }
  if (S.want.photo > time) {
    const kp = (res * PHOTO_ZOOM) / 3;
    const hw = (PHOTO_W / 2) * (3 / PHOTO_ZOOM);
    views.push({ id: 'photo', k: kp, x0: FACE.x - 4 - hw, y0: BOX.y0 + 18, w: Math.ceil(PHOTO_W * res), h: Math.ceil(PHOTO_H * res), upper: false });
  }
  return views;
}

// Asks for her next picture if none is out and a thirtieth of a second has passed.
// (Each picture is painted for where she'll be by the time it's on screen, her speed times a frame
// ahead, so her hooves stay planted while she glides.)
function ask(x, y, facing, time, state, fps = FPS) {
  if (S.lastX != null && time > S.lastT) S.vx += ((x - S.lastX) / (time - S.lastT) - S.vx) * 0.35;
  S.lastX = x;
  S.lastT = time;
  S.time = time;
  if (S.busy || time - S.sentAt < 1 / fps - 0.002) return;
  const xp = x + S.vx / FPS;
  const walked = S.sentX == null ? 0 : Math.abs(xp - S.sentX) * 3;
  const w = painter();
  if (!w && (typeof document === 'undefined' || time - S.sentAt < 0.25)) return;
  const res = gfx.scale * gfx.zoom;
  const q = { seq: ++S.seq, t: time + 1 / FPS, dist: walked, emote: state.emote ?? 'neutral', emoteT: state.emoteT ?? 0, talk: state.talk ? 1 : 0, views: viewsFor(res, time), reset: S.reset, res, x, y, facing };
  S.reset = false;
  S.sentX = xp;
  S.sentAt = time;
  S.busy = true;
  sent.set(q.seq, q);
  if (sent.size > 8) sent.delete(sent.keys().next().value);
  if (w) {
    const { x: _x, y: _y, facing: _f, res: _r, ...msg } = q;
    w.postMessage(msg);
  } else paintHere(q);
}

// Draws Fawnelle standing at world (x, y) (her feet's middle; `y` the ground), facing 1 or -1, at
// the camera's (cx, cy): `state` { emote, emoteT, talk, alpha, lift }. Her soft shadow goes under her.
export function drawFawnelle(ctx, x, y, facing, cx, cy, time, state = {}) {
  S.shownAt = time;
  ask(x, y, facing, time, state);
  const p = S.pics.body;
  if (!p) return;
  // (Fading in as her first picture arrives, rather than popping in.)
  const fadeIn = Math.min(1, (time - (S.firstAt ?? time)) / 0.25);
  const alpha = (state.alpha ?? 1) * fadeIn;
  if (alpha <= 0.01) return;
  const lift = state.lift ?? 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  footShadow(ctx, x - cx, y - cy, 22 - Math.min(10, lift * 0.3), 0, 1.1);
  const v = p.view;
  const wg = v.w / p.res;
  const hg = v.h / p.res;
  const top = snap(y - cy - lift + (v.y0 - ANCHOR[1]) / 3);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (facing >= 0) ctx.drawImage(p.pic, snap(x - cx + (v.x0 - ANCHOR[0]) / 3), top, wg, hg);
  else {
    ctx.translate(snap(x - cx - (v.x0 - ANCHOR[0]) / 3), top);
    ctx.scale(-1, 1);
    ctx.drawImage(p.pic, 0, 0, wg, hg);
  }
  ctx.restore();
}

// Her painter keeps her pictures fresh while she's just off screen too, so she's ready when she
// comes into view.
export function keepFawnelle(x, y, facing, time, state = {}) {
  ask(x, y, facing, time, state, FPS_NEAR);
}

// Her face for a cutscene's portrait window, centred on (x, y) (ui/cutscene.js); asking for it keeps
// it coming. Returns false until there's a picture. (The windows run on the world's clock; her
// pictures on the frame's, which her place in the world keeps: S.time.)
export function drawFawnelleFace(ctx, x, y) {
  S.want.face = S.time + 0.5;
  const p = S.pics.face;
  if (!p) return false;
  const s = FACE_WIN;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(p.pic, x - s / 2, y - s / 2, s, s);
  ctx.restore();
  return true;
}

// Her waist-up photo for the talk window (ui/npc.js), its middle at x and its foot at `bottom`;
// `talking` while her line types out (her mouth moves).
export function drawFawnellePhoto(ctx, x, bottom, talking) {
  S.want.photo = S.time + 0.5;
  S.talkWin = { until: S.time + 0.25, talking };
  const p = S.pics.photo;
  if (!p) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(p.pic, x - PHOTO_W / 2, bottom - PHOTO_H, PHOTO_W, PHOTO_H);
  ctx.restore();
  return true;
}

// Whether her talk window is open now, and whether she's mid-line (the world shows her shy, talking).
export const talkWindowOn = (time) => (S.talkWin.until > time ? S.talkWin : null);

// Leaving her map: her pictures go (and she starts afresh next time).
export function forgetFawnelle() {
  for (const p of Object.values(S.pics)) p.pic?.close?.();
  S.pics = {};
  S.lastX = null;
  S.lastT = null;
  S.vx = 0;
  S.sentX = null;
  S.firstAt = null;
  S.reset = true;
}
