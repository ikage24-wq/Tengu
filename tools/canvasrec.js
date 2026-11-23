// Records a page's canvas frame by frame on a fixed clock: `advance(dt)` moves the page on one
// frame, then the canvas is encoded (H.264) and muxed into a plain MP4, posted to /save/<name>.
export function mp4(chunks, desc, W, H, fps) {
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const u16 = (n) => [(n >>> 8) & 255, n & 255];
  const str = (s) => [...s].map((c) => c.charCodeAt(0));
  const cat = (parts) => {
    const len = parts.reduce((a, p) => a + p.length, 0);
    const o = new Uint8Array(len);
    let k = 0;
    for (const p of parts) { o.set(p, k); k += p.length; }
    return o;
  };
  const box = (type, ...parts) => {
    const body = cat(parts.map((p) => (p instanceof Uint8Array ? p : new Uint8Array(p))));
    return cat([new Uint8Array([...u32(body.length + 8), ...str(type)]), body]);
  };
  const full = (type, v, f, ...parts) => box(type, [v, ...u32(f).slice(1)], ...parts);
  const N = chunks.length;
  const TS = fps * 1000;
  const delta = 1000;
  const dur = N * delta;
  const matrix = [...u32(0x10000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x10000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x40000000)];
  const ftyp = box('ftyp', str('isom'), u32(512), str('isom'), str('iso2'), str('avc1'), str('mp41'));
  const moovOf = (off) => {
    const mvhd = full('mvhd', 0, 0, u32(0), u32(0), u32(TS), u32(dur), u32(0x10000), u16(0x100), new Array(10).fill(0), matrix, new Array(24).fill(0), u32(2));
    const tkhd = full('tkhd', 0, 3, u32(0), u32(0), u32(1), u32(0), u32(dur), new Array(8).fill(0), u16(0), u16(0), u16(0), u16(0), matrix, u32(W << 16), u32(H << 16));
    const mdhd = full('mdhd', 0, 0, u32(0), u32(0), u32(TS), u32(dur), u16(0x55c4), u16(0));
    const hdlr = full('hdlr', 0, 0, u32(0), str('vide'), new Array(12).fill(0), str('VideoHandler'), [0]);
    const vmhd = full('vmhd', 0, 1, new Array(8).fill(0));
    const dinf = box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1)));
    const avc1 = box('avc1', new Array(6).fill(0), u16(1), new Array(16).fill(0), u16(W), u16(H), u32(0x480000), u32(0x480000), u32(0), u16(1), new Array(32).fill(0), u16(0x18), u16(0xffff), box('avcC', desc));
    const keys = chunks.map((c, i) => (c.key ? i + 1 : 0)).filter(Boolean);
    const stbl = box('stbl', full('stsd', 0, 0, u32(1), avc1), full('stts', 0, 0, u32(1), u32(N), u32(delta)), full('stss', 0, 0, u32(keys.length), ...keys.map(u32)),
      full('stsc', 0, 0, u32(1), u32(1), u32(N), u32(1)), full('stsz', 0, 0, u32(0), u32(N), ...chunks.map((c) => u32(c.data.length))), full('stco', 0, 0, u32(1), u32(off)));
    return box('moov', mvhd, box('trak', tkhd, box('mdia', mdhd, hdlr, box('minf', vmhd, dinf, stbl))));
  };
  const moov = moovOf(ftyp.length + moovOf(0).length + 8);
  const dataLen = chunks.reduce((a, c) => a + c.data.length, 0);
  return new Blob([ftyp, moov, new Uint8Array([...u32(dataLen + 8), ...str('mdat')]), ...chunks.map((c) => c.data)], { type: 'video/mp4' });
}

export async function record(canvas, advance, secs, name, { fps = 30, bitrate = 2_500_000 } = {}) {
  const W = canvas.width - (canvas.width % 2);
  const H = canvas.height - (canvas.height % 2);
  const chunks = [];
  let desc = null;
  let err = null;
  const enc = new VideoEncoder({
    output: (chunk, meta) => {
      if (meta?.decoderConfig?.description && !desc) desc = new Uint8Array(meta.decoderConfig.description);
      const d = new Uint8Array(chunk.byteLength);
      chunk.copyTo(d);
      chunks.push({ data: d, key: chunk.type === 'key' });
    },
    error: (e) => (err = String(e)),
  });
  enc.configure({ codec: 'avc1.640028', width: W, height: H, bitrate, framerate: fps, avc: { format: 'avc' } });
  const n = Math.round(secs * fps);
  const crop = document.createElement('canvas');
  crop.width = W;
  crop.height = H;
  const cg = crop.getContext('2d');
  for (let i = 0; i < n; i++) {
    globalThis.recProgress = i / n;
    advance(1 / fps);
    cg.drawImage(canvas, 0, 0);
    const fr = new VideoFrame(crop, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
    enc.encode(fr, { keyFrame: i % (fps * 2) === 0 });
    fr.close();
    while (enc.encodeQueueSize > 6) await new Promise((r) => enc.addEventListener('dequeue', r, { once: true }));
    // (A breath every few frames, so the page and the PC stay responsive through a long film.)
    if (i % 10 === 9) await new Promise((r) => setTimeout(r, 4));
  }
  await enc.flush();
  enc.close();
  const blob = mp4(chunks, desc, W, H, fps);
  const st = (await fetch(`/save/${name}`, { method: 'POST', body: blob })).status;
  return { st, frames: chunks.length, mb: +(blob.size / 1e6).toFixed(2), err };
}
