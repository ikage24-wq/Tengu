// A stand-in screen for tests: just enough canvas for the game to draw real frames without a
// browser, so a test can count what gets painted (pixel.js `paintStats`). Every drawing call is a
// no-op; reading pixels back gives blank ones.
const noop = () => {};
// A 2D matrix with the parts of DOMMatrix the game uses.
class Matrix {
  constructor(m = [1, 0, 0, 1, 0, 0]) {
    [this.a, this.b, this.c, this.d, this.e, this.f] = Array.isArray(m) ? m : [m.a, m.b, m.c, m.d, m.e, m.f];
  }
  multiply(o) {
    const { a, b, c, d, e, f } = this;
    return new Matrix([a * o.a + c * o.b, b * o.a + d * o.b, a * o.c + c * o.d, b * o.c + d * o.d, a * o.e + c * o.f + e, b * o.e + d * o.f + f]);
  }
  inverse() {
    const { a, b, c, d, e, f } = this;
    const det = a * d - b * c || 1;
    return new Matrix([d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]);
  }
  translate(x = 0, y = 0) { return this.multiply(new Matrix([1, 0, 0, 1, x, y])); }
  scale(x = 1, y = x) { return this.multiply(new Matrix([x, 0, 0, y, 0, 0])); }
  rotate() { return this; }
  transformPoint(p) { return { x: this.a * p.x + this.c * p.y + this.e, y: this.b * p.x + this.d * p.y + this.f }; }
}
const gradient = { addColorStop: noop };
function fakeContext(canvas) {
  let transform = new Matrix();
  const stack = [];
  const ctx = {
    canvas,
    getTransform: () => new Matrix(transform),
    setTransform: (a, b, c, d, e, f) => { transform = typeof a === 'object' ? new Matrix(a) : new Matrix([a, b, c, d, e, f]); },
    resetTransform: () => { transform = new Matrix(); },
    save: () => stack.push(transform),
    restore: () => { transform = stack.pop() ?? transform; },
    scale: (x, y = x) => { transform = transform.scale(x, y); },
    translate: (x, y) => { transform = transform.translate(x, y); },
    transform: (a, b, c, d, e, f) => { transform = transform.multiply(new Matrix([a, b, c, d, e, f])); },
    rotate: (r) => { const cs = Math.cos(r); const sn = Math.sin(r); transform = transform.multiply(new Matrix([cs, sn, -sn, cs, 0, 0])); },
    createLinearGradient: () => gradient, createRadialGradient: () => gradient, createConicGradient: () => gradient, createPattern: () => ({ setTransform: noop }),
    measureText: (t) => ({ width: String(t).length * 5, actualBoundingBoxAscent: 6, actualBoundingBoxDescent: 2 }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    isPointInPath: () => false,
    roundRect: noop,
  };
  return new Proxy(ctx, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
}
function fakeCanvas() {
  const c = { width: 300, height: 150, style: {}, addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: c.width, height: c.height }) };
  c.getContext = () => (c._ctx ??= fakeContext(c));
  return c;
}
export function installFakeScreen() {
  if (globalThis.document) return;
  globalThis.document = { createElement: () => fakeCanvas(), addEventListener: noop, removeEventListener: noop, body: { appendChild: noop }, fullscreenElement: null };
  globalThis.window ??= globalThis;
  globalThis.addEventListener ??= noop;
  globalThis.removeEventListener ??= noop;
  globalThis.ImageData ??= class { constructor(data, w, h) { this.data = data; this.width = w; this.height = h; } };
  globalThis.OffscreenCanvas ??= class { constructor(w, h) { const c = fakeCanvas(); c.width = w; c.height = h; return c; } };
  globalThis.Image ??= class { decode() { return Promise.resolve(); } };
  // (Sound files never arrive: the sound engine waits quietly.)
  globalThis.fetch = () => new Promise(() => {});
  globalThis.DOMMatrix ??= Matrix;
  globalThis.Path2D ??= class { addPath() {} moveTo() {} lineTo() {} closePath() {} rect() {} roundRect() {} arc() {} arcTo() {} ellipse() {} bezierCurveTo() {} quadraticCurveTo() {} };
  globalThis.DOMPoint ??= class { constructor(x = 0, y = 0) { this.x = x; this.y = y; } matrixTransform(m) { return m.transformPoint(this); } };
}
export { fakeCanvas };
