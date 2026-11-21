// A party friend's invite over to their island (net/visit.js 'invite', sent from their Shelly):
// go, and you arrive at their dock the usual way (net/visit.js askVisit), or say not now. It lapses
// after a minute. Their stove and craft bench are yours to use while you're there.

import { online } from '../net/online.js';
import { askVisit } from '../net/visit.js';
import { windowFrame, text, button, COLORS } from './kit.js';

const W = 224;
const H = 80;

export function islandInviteWindow(ui, state, world) {
  const win = state.windows.islandinvite;
  const inv = online.islandInvite;
  if (!inv || Date.now() > inv.until) {
    online.islandInvite = null;
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Island Invite', { theme: 'mint', icon: 'heart' })) {
    online.islandInvite = null;
    return;
  }
  const { ctx } = ui;
  text(ctx, `${inv.name} invites you over to their island!`, win.x + 10, win.y + 34, { size: 8, bold: true });
  text(ctx, 'Their stove and craft bench are yours to use while you visit.', win.x + 10, win.y + 46, { size: 6.5, color: COLORS.muted });
  const by = win.y + H - 24;
  if (button(ui, win.x + W - 136, by, 60, 17, 'Go!', { primary: true, size: 8 })) {
    const why = askVisit(world, inv.from);
    if (why) world.log(why, '#ffb3c6');
    online.islandInvite = null;
    win.open = false;
  }
  if (button(ui, win.x + W - 70, by, 60, 17, 'Not now', { size: 8 })) {
    online.islandInvite = null;
    win.open = false;
  }
}
