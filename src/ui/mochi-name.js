// Naming a Mochi (docs/design/mochi.md step 7): when one hatches in your garden (world/garden-
// life.js), and whenever you rename it from its care panel. A sweet name is suggested (Roll for
// another: data/mochi-names.js); type your own, and OK (or Enter). While it's open it has the
// keyboard, so typing doesn't move you or open your bag (ui/manager.js).

import { STAGES } from '../data/mochi-genes.js';
import { suggestName, cleanName, NAME_MAX, NAME_CHAR } from '../data/mochi-names.js';
import { COLORS, windowFrame, text, box, button } from './kit.js';
import { portraitCard, cap } from './mochi-kit.js';

const W = 260;
const H = 132;
const taken = (world, rec) => (world.char.garden?.mochi ?? []).filter((r) => r !== rec).map((r) => r.name).filter(Boolean);

export function mochiNameWindow(ui, state, world) {
  const win = state.windows.mochiname;
  const rec = world.naming;
  if (!rec) {
    win.open = false;
    return;
  }
  if (win.for !== rec) {
    win.for = rec;
    win.draft = rec.name ?? suggestName(taken(world, rec));
  }
  const ok = () => {
    const name = cleanName(win.draft);
    if (!name) return;
    const had = rec.name;
    rec.name = name;
    world.naming = null;
    win.open = false;
    world.log(had ? `${had} is called ${name} now.` : `Say hello to ${name}!`, '#ffc2d4');
  };
  if (!windowFrame(ui, win, W, H, rec.name ? 'Rename your Mochi' : `Name your ${STAGES[rec.stage] ?? 'Mochi'}`)) {
    // (Closed without a name: it can be named later from its care panel.)
    if (!win.open) world.naming = null;
    return;
  }
  const { ctx } = ui;
  const x = win.x + 10;
  const y = win.y + 30;
  // Its portrait (a little photo card), and the name being typed.
  portraitCard(ctx, rec, x, y - 2, 76, 86, world.now, { scale: 1.8 });
  for (const ch of ui.input.typed) {
    if (ch === '\b') win.draft = win.draft.slice(0, -1);
    else if (NAME_CHAR.test(ch) && win.draft.length < NAME_MAX && !(ch === ' ' && !win.draft)) win.draft += ch;
  }
  const fx = x + 86;
  const fw = W - 106;
  text(ctx, `${cap(rec.personality)} ${STAGES[rec.stage] ?? 'Mochi'}`, fx, y + 6, { size: 7, bold: true, color: '#a8467a' });
  box(ctx, fx, y + 14, fw, 17, { fill: '#ffffff', edge: COLORS.accent, r: 8.5 });
  state.typeField = { x: fx, y: y + 14, w: fw, h: 17 };
  const caret = Math.floor(world.now * 2) % 2 ? '|' : '';
  if (win.draft) text(ctx, `${win.draft}${caret}`, fx + 6, y + 26, { size: 9, bold: true });
  else text(ctx, `${caret}Type a name`, fx + 6, y + 26, { size: 9, color: COLORS.muted });
  text(ctx, `${win.draft.length}/${NAME_MAX}`, fx + fw - 6, y + 26, { size: 6.5, align: 'right', color: COLORS.muted });
  if (button(ui, fx, y + 40, 62, 17, 'Roll', { size: 8, iconName: 'dice' })) win.draft = suggestName([...taken(world, rec), win.draft]);
  const good = Boolean(cleanName(win.draft));
  if (button(ui, fx + fw - 62, y + 40, 62, 17, 'OK', { primary: good, enabled: good, size: 8.5, iconName: 'heart' }) || (good && (ui.input.pressed.has('Enter') || ui.input.pressed.has('NumpadEnter')))) ok();
}
