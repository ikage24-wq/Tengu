// The emote wheel (T, or the smiley button on a phone): eight emotes round a circle, each a pose
// and a face your hero puts on (friends online see it too). Tap one, or tap outside to close.

import { text, box, hover, clicked } from './kit.js';

export const EMOTES = [
  { id: 'cheer', label: 'Cheer', pose: 'cheer', face: 'excited', dur: 1.2 },
  { id: 'dance', label: 'Dance', pose: 'kagura', face: 'giggle', dur: 1.4 },
  { id: 'flip', label: 'Flip', pose: 'flip', face: 'playful', dur: 0.8 },
  { id: 'love', label: 'Love', pose: 'cheer', face: 'love', dur: 1 },
  { id: 'pray', label: 'Thanks', pose: 'pray', face: 'shy', dur: 1.2 },
  { id: 'flex', label: 'Flex', pose: 'roar', face: 'determined', dur: 1 },
  { id: 'sleepy', label: 'Sleepy', pose: null, face: 'sleepy', dur: 0 },
  { id: 'sad', label: 'Sad', pose: null, face: 'sad', dur: 0 },
];

export function playEmote(world, e) {
  if (world.dead || world.fishing) return;
  world.emote = { face: e.face, t: 3 };
  // The players around you see it (world/bots.js).
  world.heard = { emote: e.id, at: world.now };
  if (e.pose && world.body.onGround && !world.pose && !(world.attackTimer > 0)) world.pose = { kind: e.pose, t: e.dur, dur: e.dur, since: world.now };
}

export function emoteWheel(ui, state, world) {
  if (!state.emotes) return;
  const { ctx } = ui;
  const cx = 320;
  const cy = 170;
  const R = 62;
  ctx.save();
  ctx.fillStyle = 'rgba(40,22,62,0.25)';
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = 'rgba(255,250,246,0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, R + 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffb8dc';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'Emotes', cx, cy + 3, { size: 9, bold: true, align: 'center', color: '#a8467a' });
  let picked = false;
  EMOTES.forEach((e, i) => {
    const a = -Math.PI / 2 + (i / EMOTES.length) * Math.PI * 2;
    const x = cx + Math.cos(a) * R;
    const y = cy + Math.sin(a) * R;
    const hot = hover(ui, x - 20, y - 12, 40, 24);
    box(ctx, x - 20, y - 11, 40, 22, { fill: hot ? '#ff8fc1' : '#ffffff', edge: '#ff8fc1', r: 11, width: 1.5 });
    text(ctx, e.label, x, y + 3, { size: 7.5, bold: true, align: 'center', color: hot ? '#ffffff' : '#a8467a' });
    if (clicked(ui, x - 20, y - 12, 40, 24)) {
      playEmote(world, e);
      picked = true;
    }
  });
  ctx.restore();
  // Picking one, Esc, or tapping anywhere else closes it.
  if (picked || ui.input.pressed?.has('Escape') || ui.mouse.clicked) {
    state.emotes = false;
    ui.mouse.clicked = false;
  }
}
