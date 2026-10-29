// Draws one frame of the world: scenery, NPCs, loot, monsters, the player, effects, and numbers.

import { wornGear } from '../core/character.js';
import { drawCombatAura, heartbeat } from './aura.js';
import { gaugeOf, phantom, shadowClones, inForm, hasFaith } from '../world/melee.js';
import { moveAt, MOVES, DANCE_MOVES } from './moves.js';
import { settings } from '../core/settings.js';
import { NPCS } from '../data/npcs.js';
import { drawSceneBack, drawSceneFront } from './scenery.js';
import { drawHero } from './hero.js';
import { drawMonster } from './monsters.js';
import { drawEffects, drawWarnings, drawNumbers, drawDrops } from './effects.js';
import { questMarker } from '../ui/npc.js';
import { nearbyNpc } from '../world/world.js';
import { groundAt } from '../world/physics.js';
import { text, box, COLORS } from '../ui/kit.js';
import { createAnim, stepAnim } from './animator.js';
import { createParticles, updateParticles, drawParticles, absorbJuice, shakeOffset, dust, elementStep, elementAura, landing } from './particles.js';
import { ITEMS } from '../data/items.js';
import { drawBubble, flushBubbles } from '../ui/chat.js';
import { drawBuffEffects } from './buffs.js';
import { fxSprite } from './fx-sprites.js';
import { drawTinted } from './tint.js';
import { drawPets } from './pets.js';
import { drawStreet, drawTownsfolk, npcRoutine, drawParty, drawFallen } from './town.js';
import { botsIn, bodiedIn } from '../world/bots.js';
import { partyMembers } from '../world/party.js';
import { drawGhosts } from './ghosts.js';
import { drawSpots, drawFishing } from './fishing.js';
import { nextStep } from '../world/routes.js';
import { titleOf } from '../core/collection.js';
import { drawZonesBack, drawZonesFront, drawCallout } from './trial.js';
import { drawHollowBack, drawHollowFront, drawDarkness } from './hollow.js';
import { drawGlowcap, drawCage, drawSeal, drawChest, drawRootKey, drawZone, drawZoneHit } from './dungeon.js';
import { shock, starFlash, puff } from './fxkit.js';
import { snap, gfx, footShadow, slopeAt } from './pixel.js';
import { drawGlowing, drawLighting, drawDreamy } from './post.js';

// Render-side state that persists between frames: the player's animation and the particles.
const feel = { anim: createAnim(), fx: createParticles(), last: null, world: null };

export const VIEW_W = 640;
export const VIEW_H = 360;
const BAR_ROOM = 34;

export function createCamera() {
  return { x: 0, y: 0, ready: false };
}

// Follows the player smoothly and stays inside the map. It looks ahead the way you face (eased,
// so turning drifts the view over rather than snapping, and a quick turn back and forth doesn't
// swing it), leans toward a boss you're fighting, and only follows you up and down once you
// land, so jumps don't bob the view (unless you'd leave the screen).
const LOOKAHEAD = 44;
export function updateCamera(cam, world, dt) {
  const map = world.map;
  const b = world.body;
  const fresh = !cam.ready || cam.mapId !== map.id;
  // The lookahead turns around once you've faced the other way for a moment.
  if (b.facing !== cam.face) {
    cam.turned = (cam.turned ?? 0) + dt;
    if (cam.turned > 0.25 || cam.face == null) {
      cam.face = b.facing;
      cam.turned = 0;
    }
  } else cam.turned = 0;
  const boss = world.mobs.find((m) => m.def.boss && m.hp > 0 && Math.abs(m.x - b.x) < 300 && Math.abs(m.y - b.y) < 160);
  const lookTo = boss ? Math.max(-90, Math.min(90, (boss.x - b.x) * 0.3)) : (cam.face ?? 1) * LOOKAHEAD;
  cam.look = fresh ? lookTo : cam.look + (lookTo - cam.look) * (1 - Math.exp(-dt * 2.2));
  const tx = Math.max(0, Math.min(map.width - VIEW_W, b.x + cam.look - VIEW_W / 2));
  // Vertical follow happens on the ground (or a rope); in the air the camera holds, unless you
  // get near the top or bottom of the view.
  const footY = fresh || b.onGround || b.rope ? b.y : cam.footY;
  const screenY = b.y - cam.y;
  cam.footY = !fresh && (screenY < 70 || screenY > VIEW_H - 40) ? b.y : footY;
  // The camera can sit a bar's height below the map so the floor shows above the status bar.
  const ty = Math.max(0, Math.min(map.height - VIEW_H + BAR_ROOM, cam.footY - VIEW_H * 0.6));
  if (fresh) {
    cam.x = tx;
    cam.y = ty;
    cam.ready = true;
    cam.mapId = map.id;
    return;
  }
  const k = 1 - Math.exp(-dt * 8);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * (1 - Math.exp(-dt * (b.onGround ? 6 : 10)));
}

// How long a new move takes to ease out of the one before it (a few frames; long enough to hide the
// snap, short enough that the wind-up still reads as instant).
const BLEND = 0.07;

// How long the hero takes to ease back to standing after a move ends (research/combat.md 22: a move
// that snaps straight to idle is where combat feels choppiest; 150-200 ms reads as recovering).
const SETTLE = 0.17;

// The Spirit Mage's dance flows from figure to figure and sinks back to standing slowly.
const DANCE_BLEND = 0.18;
const DANCE_SETTLE = 0.32;

export function playerPose(world) {
  const b = world.body;
  const last = world.lastPose;
  const settle = last && DANCE_MOVES.has(last.kind) ? DANCE_SETTLE : SETTLE;
  if (!world.pose && last && b.onGround && !b.rope && Math.abs(b.vx) <= 8 && world.now - last.endedAt < settle && MOVES[last.kind]) {
    return { pose: last.kind, progress: 1, dur: last.dur, settle: (world.now - last.endedAt) / settle, ready: true, hit: last.hit, fin: last.fin };
  }
  const blend = world.pose && DANCE_MOVES.has(world.pose.kind) ? DANCE_BLEND : BLEND;
  if (world.pose) return { pose: world.pose.kind, progress: 1 - world.pose.t / world.pose.dur, dur: world.pose.dur, from: world.pose.from, blend: (world.now - (world.pose.since ?? -9)) / blend, hit: world.pose.hit, fin: world.pose.fin };
  if (b.rope) return { pose: 'climb' };
  if (!b.onGround) return { pose: 'jump', vy: b.vy };
  if (Math.abs(b.vx) > 8) return { pose: 'walk' };
  return { pose: 'idle' };
}

function drawNpcs(ctx, world, cam, time) {
  const near = nearbyNpc(world);
  for (const n of world.map.npcs) {
    const npc = NPCS[n.id];
    const x = n.x - cam.x;
    const y = groundAt(world.map, n.x) - cam.y;
    if (x < -40 || x > VIEW_W + 40) continue;
    // Each NPC runs their own idle routine, but turns to face you while you're close.
    const r = npcRoutine(n.id, time + (n.x % 97) * 0.1);
    const close = near?.id === n.id;
    const facing = r.facing && !close ? r.facing : world.body.x < n.x ? -1 : 1;
    const busy = r.pose && !close;
    const look = r.face ? { ...npc.look, face: r.face } : npc.look;
    footShadow(ctx, x, y, 12);
    drawHero(ctx, look, npc.gear ?? null, x, y - (r.lift ?? 0), { pose: busy ? r.pose : 'idle', progress: r.progress ?? 0, dur: 0.5, time, seed: n.x % 97, facing, job: npc.showJob, rig: r.rig, onHands: r.hands });
    if (r.extra) r.extra(ctx, x, y - (r.lift ?? 0), time, facing);
    ctx.font = 'bold 8px sans-serif';
    const label = npc.name;
    const w = ctx.measureText(label).width + 10;
    const hovered = world.hoverNpc === n.id;
    box(ctx, x - w / 2, y + 2, w, 11, { fill: hovered ? COLORS.accent : 'rgba(90,63,122,0.75)', edge: hovered ? '#ffffff' : null, r: 5 });
    text(ctx, label, x, y + 10, { size: 8, bold: true, align: 'center', color: '#ffffff' });
    if (hovered && near?.id !== n.id) {
      box(ctx, x - 28, y - 70, 56, 12, { fill: '#ffffff', edge: COLORS.accent, r: 6 });
      text(ctx, 'Click to talk', x, y - 61, { size: 7.5, bold: true, align: 'center', color: COLORS.accent });
    }
    const mark = questMarker(world.char, n.id);
    if (mark) {
      const bob = Math.sin(time * 4) * 2;
      text(ctx, mark, x, y - 54 + bob, { size: 16, bold: true, align: 'center', color: mark === '?' ? '#7ee081' : '#ffe36b', outline: '#8f5cc4' });
    }
    if (near?.id === n.id) {
      box(ctx, x - 22, y - 70, 44, 12, { fill: '#ffffff', edge: COLORS.accent, r: 6 });
      text(ctx, '▲ Talk', x, y - 61, { size: 8, bold: true, align: 'center', color: COLORS.accent });
    }
  }
}

function drawMobs(ctx, world, cam, time) {
  let boss = null;
  for (const m of world.mobs) {
    const x = m.x - cam.x;
    const y = m.y - cam.y;
    if (x < -80 || x > VIEW_W + 80) continue;
    // In a dungeon a swing winds back, then lunges.
    const lean = m.windup > 0 ? -m.dir * 2.5 : m.lunge > 0 ? m.dir * 6 * (m.lunge / 0.18) : 0;
    // During hit-stop the monster just struck shudders in place, harder than anyone else and
    // dying away as the stop runs out (Sakurai): sideways on the ground, every which way in the air.
    const struck = world.hitstop > 0 && m.flash > 0;
    if (struck && !(m.stopPeak >= world.hitstop)) m.stopPeak = world.hitstop;
    if (!struck) m.stopPeak = 0;
    const amp = struck ? Math.min(2.5, 0.8 + m.stopPeak * 18) * (world.hitstop / m.stopPeak) : 0;
    const sign = Math.floor(time * 60) % 2 ? 1 : -1;
    const ang = m.air > 0 ? Math.floor(time * 60) * 2.4 : 0;
    drawMonster(ctx, m, x + lean + sign * amp * Math.cos(ang), y + sign * amp * Math.sin(ang), time, world.now);
    if (m.big > world.now && m.hp > 0) text(ctx, '!!', x, y - m.def.h - 14 + Math.sin(time * 30) * 1.5, { size: 16, bold: true, align: 'center', color: '#ff4d6d', outline: '#ffffff' });
    if (m.def.boss) boss = m;
    if (settings.monsterHp && m.hp > 0 && m.hp < m.def.hp && !m.def.boss) {
      const w = Math.max(24, m.def.w);
      box(ctx, x - w / 2, y - m.def.h - 7, w, 4, { fill: 'rgba(58,45,79,0.5)', edge: null, r: 2 });
      box(ctx, x - w / 2, y - m.def.h - 7, Math.max(2, (w * m.hp) / m.def.hp), 4, { fill: COLORS.hp, edge: null, r: 2 });
    }
  }
  if (boss && boss.hp > 0) {
    box(ctx, 170, 60, 300, 12, { fill: 'rgba(58,45,79,0.6)', edge: '#ffffff', r: 6 });
    box(ctx, 171, 61, Math.max(4, (298 * boss.hp) / boss.def.hp), 10, { fill: '#c9a6ff', edge: null, r: 5 });
    text(ctx, `${boss.def.name}  Lv ${boss.def.level}`, 320, 69, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: '#5a3f7a' });
  }
}

export function drawWorld(ctx, world, viewCam, time) {
  const b = world.body;
  const dt = feel.last === null ? 0 : Math.min(0.1, Math.max(0, time - feel.last));
  feel.last = time;
  if (feel.world !== world || feel.mapId !== world.map.id) {
    feel.enteredAt = time;
    feel.fx = createParticles();
    if (feel.world !== world) feel.anim = createAnim();
    feel.world = world;
    feel.mapId = world.map.id;
  }
  absorbJuice(feel.fx, world);
  // Endgame weapons leave elemental footsteps and wrap their wielder in sparkles.
  const element = settings.weaponEffects && world.char.equipment.weapon ? ITEMS[world.char.equipment.weapon.id].element : null;
  for (const e of stepAnim(feel.anim, b, dt)) {
    if (e === 'step') {
      dust(feel.fx, b.x - b.facing * 6, b.y, 1, -b.facing);
      if (element) elementStep(feel.fx, b.x - b.facing * 4, b.y, element, b.facing);
    }
    if (e === 'land') {
      landing(feel.fx, b.x, b.y, (feel.anim.land ?? 0) >= 0.14);
      if (element) for (const dx of [-6, 0, 6]) elementStep(feel.fx, b.x + dx, b.y, element, Math.sign(dx) || 1);
    }
    if (e === 'jump') dust(feel.fx, b.x, b.y, 3);
  }
  if (element && !world.dead) elementAura(feel.fx, b.x, b.y, element, dt);
  updateParticles(feel.fx, dt, world, viewCam, VIEW_W, VIEW_H);
  const [ox, oy] = shakeOffset(feel.fx, time);
  const cam = { x: viewCam.x + ox, y: viewCam.y + oy };
  const nearPortal = world.map.portals.find((p) => !p.hidden && Math.abs(p.x - b.x) < 22 && Math.abs(p.y - b.y) < 6);
  // The portal on your guided route, if you're following one.
  const routePortal = world.route ? nextStep(world.map.id, world.route.to)?.portal : null;
  drawSceneBack(ctx, world.map, cam, VIEW_W, VIEW_H, time, nearPortal?.id, () => drawStreet(ctx, world.map, cam, VIEW_W, time), routePortal?.id);
  drawTownsfolk(ctx, world.map, cam, VIEW_W, time, botsIn(world.bots, world.map.id), world.hoverBot, world.body);
  drawNpcs(ctx, world, cam, time);
  drawWarnings(ctx, world, cam, time);
  if (world.dungeon) drawDungeonBack(ctx, world, cam, time);
  if (world.dungeon) drawHollowBack(ctx, world, cam, time);
  // Fishing spots by the water.
  drawSpots(ctx, world, cam, time);
  // A queen's moves about to land.
  drawZonesBack(ctx, world, cam, time);
  drawDrops(ctx, world, cam, time);
  drawMobs(ctx, world, cam, time);
  // A Beastmaster's wolf and bear walk behind her; her hawk flies over her (drawn after her).
  drawPets(ctx, world, cam, time, 'back');

  drawParty(ctx, bodiedIn(world.bots, world.map.id), cam, VIEW_W, time, world.hoverBot);
  // Friends in your online room.
  drawGhosts(ctx, world, cam, VIEW_W, time);

  const p = playerPose(world);
  // Blink while recovering from a hit, but not through a move's own untouchable stretch (dashes,
  // dodges, finishers): that should read as power, not as being hurt.
  const blink = world.invuln > 0 && !world.pose && Math.floor(time * 16) % 2 === 0;
  if (b.onGround) footShadow(ctx, b.x - cam.x, b.y - cam.y, 13, slopeAt(b.surface, b.x));
  // A chat emoticon shows on the face for a few seconds.
  const look = world.emote ? { ...world.char.appearance, face: world.emote.face } : world.char.appearance;
  const hx = snap(b.x - cam.x);
  const hy = snap(b.y - cam.y);
  // After fighting (attacking or getting hit) the hero stays in a bouncy ready stance for a few
  // seconds before relaxing.
  if (world.pose || world.attackTimer > 0 || world.invuln > 0.6) feel.lastFight = world.now;
  const ready = !world.map.isTown && world.now - (feel.lastFight ?? -99) < 4;
  const low = !world.map.isTown && world.char.hp < (world.stats?.maxHp ?? 1) * 0.3;
  const heroState = { ...p, time, facing: b.facing, hurt: world.invuln > 0.6 && !world.pose, alpha: world.dead ? 0.5 : blink ? 0.45 : 1, job: world.char.job, ready, low, urgent: true };
  const buffs = world.dead ? {} : world.char.buffs;
  drawBuffEffects(ctx, buffs, 'back', hx, hy, time, world.now, b.facing);
  const gear = wornGear(world.char);
  drawBuffClones(ctx, buffs, look, gear, hx, hy, heroState, time);
  // Phantom (a Thief's full Shadow): her shadow copy stands just behind her, and plays each move a
  // beat after she does.
  if (!world.dead && (phantom(world) || shadowClones(world))) drawPhantom(ctx, world, look, gear, hx, hy, heroState);
  // A Thief darting leaves violet afterimages of herself along the way, fading fast.
  drawAfterimages(ctx, world, look, gear, cam, heroState, time);
  // A warrior path's form: a glow round the hero that breathes with the heartbeat, and in Demon Form
  // a blood-red shadow of him just behind him that strikes again a beat after each swing.
  if (!world.dead && inForm(world)) drawForm(ctx, world, look, gear, hx, hy, heroState, time);
  // Knocked out: the same fall as a downed party member (up and back, a bounce, lying with a ghost).
  if (world.dead) {
    if (feel.fellAt === undefined) feel.fellAt = time;
    const since = time - feel.fellAt;
    if (since >= 0.34 && !feel.fellDust) {
      feel.fellDust = true;
      dust(feel.fx, b.x - b.facing * 7, b.y, 4);
    }
    drawFallen(ctx, look, gear, hx, hy, { ...heroState, alpha: 0.85 }, since);
  } else {
    feel.fellAt = undefined;
    feel.fellDust = false;
    // A job's gauge builds up around them as the fight goes on: a Warrior's Valor, an Archer's
    // Momentum, a Berserker's Rage, a Paladin's Faith, a Beastmaster's Bond (each 0-100).
    const gauge = gaugeOf(world.char);
    // In a form the aura stays at its fullest.
    const power = gauge ? [gauge, inForm(world) ? 1 : (world[gauge] ?? 0) / 100] : null;
    const ay = hy - (p.pose ? moveAt(p.pose, p.progress ?? 0, p.dur)?.lift ?? 0 : 0);
    // A form draws the whole aura larger.
    const auraScale = inForm(world) ? 1.4 : 1;
    if (power) drawCombatAura(ctx, power[0], 'back', hx, ay, time, auraScale, power[1], b.facing);
    drawHero(ctx, look, gear, hx, hy, heroState, feel.anim);
    if (power) drawCombatAura(ctx, power[0], 'front', hx, ay, time, auraScale, power[1], b.facing);
    // The rod and line while you fish (and the Fish / Cook hints).
    drawFishing(ctx, world, cam, time, hx, hy);
    drawPets(ctx, world, cam, time, 'front');
  }
  drawBuffEffects(ctx, buffs, 'front', hx, hy, time, world.now, b.facing);
  drawSupport(ctx, buffs, hx, hy, time, world.now);
  // Your own name tag, like everyone else's; click it (or you) to see your profile.
  if (!world.dead) {
    ctx.font = 'bold 7px sans-serif';
    const label = world.char.name;
    const w = ctx.measureText(label).width + 10;
    const hot = world.hoverSelf;
    box(ctx, hx - w / 2, hy + 2, w, 10, { fill: hot ? COLORS.accent : 'rgba(255,143,193,0.85)', edge: '#ffffff', r: 5, width: 1 });
    text(ctx, label, hx, hy + 9.5, { size: 7, bold: true, align: 'center', color: '#ffffff' });
    // The title you wear, in gold under your name.
    const title = titleOf(world.char);
    if (title) text(ctx, title, hx, hy + 20, { size: 6.5, bold: true, align: 'center', color: '#ffe9a0', outline: 'rgba(90,63,122,0.85)' });
  }

  // HD: light and color over the world, then effects on a glowing layer.
  const hd = gfx.hd;
  // Light gathers around you and the portals.
  const lights = [{ x: hx, y: hy - 22, r: 96 }];
  for (const pt of world.map.portals) if (!pt.hidden) lights.push({ x: pt.x - cam.x, y: pt.y - 26 - cam.y, r: 56, k: 0.8, c: '#e6dcff' });
  if (hd && !gfx.noLight) drawLighting(ctx, world.map, cam, VIEW_W, VIEW_H, time, lights);
  // The foreground: framing pieces and the nearest drifting petals, in front of everyone (and of
  // the light, being between it and the camera), but under the effects.
  const actors = [{ x: hx, top: hy - 50 }];
  for (const m of world.mobs) if (m.hp > 0) actors.push({ x: m.x - cam.x, top: m.y - m.def.h - cam.y });
  drawSceneFront(ctx, world.map, cam, VIEW_W, VIEW_H, time, actors);
  if (world.dungeon) {
    drawHollowFront(ctx, world, cam, time);
    // The dark rooms: light only where the group and the glowcaps are.
    drawDarkness(ctx, world, cam, time);
  }
  const drawFx = (g) => {
    drawEffects(g, world, cam, time);
    if (world.dungeon) drawDungeonFront(g, world, cam, time);
    drawZonesFront(g, world, cam, time);
    drawParticles(g, feel.fx, cam, time);
  };
  if (hd && !gfx.noGlow) drawGlowing(ctx, drawFx);
  else drawFx(ctx);
  if (settings.filter === 'dreamy') drawDreamy(ctx);
  if (settings.damageNumbers) drawNumbers(ctx, world, cam);
  drawCallout(ctx, world);
  if (settings.chatBubbles) drawBubbles(ctx, world, cam);
  // Every bubble queued this frame (yours, NPCs', the crowd's, your party's), laid out together.
  flushBubbles(ctx);
  // HD: a new map fades in from a soft glow instead of cutting straight in.
  const enter = time - (feel.enteredAt ?? -9);
  if (gfx.hd && enter < 0.5) {
    ctx.save();
    ctx.globalAlpha = (1 - enter / 0.5) ** 2;
    ctx.fillStyle = '#fff6fb';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }
}

// The Thief's darting moves (Shadow Step, her dashes and flash cuts, a blink, the finisher's
// blinks) leave afterimages: a copy of her every few pixels she covers, tinted violet, fading out
// over a quarter second (the speed reads as shadow, not as a smear).
const GHOST_MOVES = new Set(['dashstab', 'backstab', 'assassinate', 'flashcut', 'vaultcut']);
const GHOST_LIFE = 0.24;
function drawAfterimages(ctx, world, look, gear, cam, state, time) {
  const g = (feel.ghosts ??= []);
  const b = world.body;
  const w = world.stats?.weaponType;
  const last = g.at(-1);
  if ((w === 'dagger' || w === 'gauntlet') && GHOST_MOVES.has(world.pose?.kind) && (!last || Math.abs(last.x - b.x) > 7 || Math.abs(last.y - b.y) > 7)) g.push({ x: b.x, y: b.y, at: time, state });
  while (g.length && (time - g[0].at > GHOST_LIFE || time < g[0].at)) g.shift();
  for (const k of g) {
    const age = (time - k.at) / GHOST_LIFE;
    const gx = snap(k.x - cam.x);
    const gy = snap(k.y - cam.y);
    drawTinted(ctx, gx, gy, '#6a4ec8', 0.7, (c) => drawHero(c, look, gear, gx, gy, { ...k.state, job: null, alpha: k.state.alpha * 0.5 * (1 - age) ** 1.5 }));
  }
}

// Buffs that copy you: Shadow Partner's dark clone just behind, and Mirage's golden decoys.
function drawPhantom(ctx, world, look, gear, x, y, state) {
  const ph = world.phantom;
  const live = ph && world.now >= ph.since && world.now < ph.until;
  const pose = live ? { pose: ph.kind, progress: (world.now - ph.since) / ph.dur, dur: ph.dur, from: null, blend: 1 } : {};
  // Shadow Clones (full Ki): two ink clones of the Shinobi, one each side of her, inked flat black
  // with a brush-dry edge of smoke rising off them.
  if (shadowClones(world)) {
    const t = state.time ?? 0;
    for (const [k, side] of [[0, -1], [1, 1]]) {
      const cx = x + state.facing * side * (live ? 14 : 20);
      const pose = live && world.now >= ph.since + k * 0.08 ? { pose: ph.kind, progress: Math.min(1, (world.now - ph.since - k * 0.08) / ph.dur), dur: ph.dur, from: null, blend: 1 } : {};
      fxSprite(ctx, 'celinkaura', cx, y + 4, { t: t * 0.8 + k, scale: 0.36, alpha: 0.7 * state.alpha });
      drawTinted(ctx, cx, y, '#14101a', 0.86, (c) => drawHero(c, look, gear, cx, y, { ...state, ...pose, job: null, alpha: state.alpha * 0.62 }));
    }
    return;
  }
  const px = x - state.facing * (live ? 10 : 16);
  // A smoky see-through copy (the Thief's realistic look): violet smoke curling up off it, the copy
  // itself thin and flickering a little like smoke in a draught.
  const t = state.time ?? 0;
  const flicker = 0.9 + 0.1 * Math.sin(t * 9) * Math.sin(t * 3.7);
  fxSprite(ctx, 'celshadowaura', px, y + 4, { t: t * 0.8, scale: 0.42, alpha: 0.75 * state.alpha });
  drawTinted(ctx, px, y, '#2e2266', 0.78, (c) => drawHero(c, look, gear, px, y, { ...state, ...pose, job: null, alpha: state.alpha * 0.5 * flicker }));
}

// The two forms' looks: the glow round the hero, and the tint of the shadow (Demon Form only).
const FORM_LOOKS = {
  rage: { glow: 'celdemonglow', shadow: '#8a0a24' },
  holy: { glow: 'celholyglow', shadow: null },
};

function drawForm(ctx, world, look, gear, x, y, state, time) {
  const sw = world.formSwing;
  const form = FORM_LOOKS[hasFaith(world.char) ? 'holy' : 'rage'];
  const live = sw && world.now >= sw.since && world.now < sw.until;
  const pose = live ? { pose: sw.kind, progress: (world.now - sw.since) / sw.dur, dur: sw.dur, from: null, blend: 1 } : {};
  const beat = heartbeat(time);
  // A glow round them that breathes (a slow swell) and blinks bright on each heartbeat.
  const breath = 0.5 + 0.5 * Math.sin(time * 2.4);
  const blink = beat < 1 ? 1 - beat : 0;
  fxSprite(ctx, form.glow, x, y + 10, { t: time, scale: 1.6 + 0.25 * breath + 0.15 * blink, alpha: Math.min(1, 0.45 + 0.3 * breath + 0.4 * blink) });
  if (!form.shadow) return;
  const sx = x - state.facing * (live ? 8 : 12);
  drawTinted(ctx, sx, y, form.shadow, 0.85, (c) => drawHero(c, look, gear, sx, y, { ...state, ...pose, job: null, alpha: state.alpha * (0.6 + 0.2 * beat) }));
}

function drawBuffClones(ctx, buffs, look, gear, x, y, state, time) {
  const clone = (dx, alpha, tint, k) => drawTinted(ctx, x + dx, y, tint, k, (c) => drawHero(c, look, gear, x + dx, y, { ...state, job: null, alpha: state.alpha * alpha }));
  if (buffs.shadowpartner) {
    clone(-state.facing * (12 + Math.sin(time * 2) * 2), 0.6, '#1e1650', 0.85);
  }
  // Fox Illusion: two illusions of the Kitsune in blue fox fire at her sides, flickering, flames
  // licking up off them.
  if (buffs.foxillusion) {
    for (const side of [-1, 1]) {
      const dx = side * (24 + Math.sin(time * 1.3 + side) * 3);
      const flicker = 0.4 + 0.12 * Math.sin(time * 7 + side * 2);
      fxSprite(ctx, 'celfoxfire', x + dx, y + 4, { t: time + side, scale: 0.3, alpha: 0.6 });
      clone(dx, flicker, '#2f6cf0', 0.7);
    }
  }
  if (buffs.mirage) {
    for (const side of [-1, 1]) {
      const flicker = 0.25 + 0.2 * Math.sin(time * 6 + side * 2);
      clone(side * (20 + Math.sin(time * 1.5 + side) * 4), flicker, '#ffd66b', 0.55);
    }
  }
}

// Speech bubbles over the player and NPCs; they fade out at the end.
function drawBubbles(ctx, world, cam) {
  for (const [who, bubble] of Object.entries(world.bubbles ?? {})) {
    const npc = who === 'player' ? null : world.map.npcs.find((n) => n.id === who);
    if (who !== 'player' && !npc) continue;
    const x = who === 'player' ? world.body.x : npc.x;
    const y = who === 'player' ? world.body.y : groundAt(world.map, npc.x);
    drawBubble(ctx, snap(x - cam.x), snap(y - cam.y - 62), bubble.text, Math.min(1, bubble.t * 2));
  }
}

// ---------- Dungeons ----------

// The room's things on the floor: glowcaps, cages, keys, the chest, roots sealing the exit, and
// the warnings of boss moves about to go off.
function drawDungeonBack(ctx, world, cam, time) {
  const run = world.dungeon;
  const room = run.room;
  const gy = world.map.groundY - cam.y;
  for (const p of world.map.portals) {
    if (!p.sealed) continue;
    const x = p.x - cam.x;
    if (x > -40 && x < VIEW_W + 40) drawSeal(ctx, x, p.y - cam.y, room.cleared, time);
  }
  for (const o of room.objects) {
    const x = o.x - cam.x;
    if (x < -40 || x > VIEW_W + 40) continue;
    if (o.kind === 'glowcap') drawGlowcap(ctx, x, gy, o.done, time + o.id);
    else if (o.kind === 'cage') drawCage(ctx, x, gy, o.done, o.done ? 1 : o.progress, time + o.id);
    else if (o.kind === 'chest') drawChest(ctx, x, gy, Boolean(o.open), time);
    // A hint over what you can use.
    const near = !o.done && Math.abs(o.x - world.body.x) < 26 && world.body.onGround && !world.channel;
    if (near && (o.kind !== 'chest' || room.cleared)) {
      box(ctx, x - 24, gy - 62, 48, 12, { fill: '#ffffff', edge: COLORS.accent, r: 6 });
      text(ctx, o.kind === 'chest' ? '▲ Open' : o.kind === 'cage' ? '▲ Free' : '▲ Light', x, gy - 53, { size: 8, bold: true, align: 'center', color: COLORS.accent });
    }
  }
  for (const k of room.keys) if (!k.got) drawRootKey(ctx, k.x - cam.x, k.y - cam.y, time + k.t);
  // Saplings feeding the boss: a green ribbon of life.
  const boss = world.mobs.find((m) => m.def.mech === 'gnarl' && m.hp > 0);
  if (boss) {
    for (const a of room.adds) {
      if (a.hp <= 0 || !a.def.fight?.mender) continue;
      ctx.save();
      ctx.strokeStyle = '#9be08f';
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 8);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -time * 30;
      ctx.beginPath();
      ctx.moveTo(a.x - cam.x, a.y - a.def.h * 0.5 - cam.y);
      ctx.quadraticCurveTo((a.x + boss.x) / 2 - cam.x, Math.min(a.y, boss.y) - 120 - cam.y, boss.x - cam.x, boss.y - boss.def.h * 0.5 - cam.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  for (const z of run.zones) {
    if (z.hit) continue;
    const p = Math.min(1, z.t / z.warn);
    // Lanes run from the boss toward the wall it's charging at.
    if (z.kind === 'lane' && z.dir < 0) drawZone(ctx, 'lane', z.x + z.w - cam.x, z.y - cam.y, -z.w, p, time);
    else drawZone(ctx, z.kind, (z.kind === 'circle' ? z.x : z.x) - cam.x, z.y - cam.y, z.w, p, time);
  }
}

// Things that happen in the air: boss moves landing, spit, group heals, and the
// bar while you work on something.
function drawDungeonFront(ctx, world, cam, time) {
  const run = world.dungeon;
  for (const z of run.zones) {
    if (!z.hit || z.kind === 'lane') continue;
    drawZoneHit(ctx, z.kind, z.x - cam.x, z.y - cam.y, z.w, Math.min(1, z.after / 0.5), time);
  }
  for (const v of run.vfx) {
    const p = v.t / v.dur;
    const x = v.x - cam.x;
    const y = v.y - cam.y;
    ctx.save();
    if (v.kind === 'groupheal') {
      ctx.globalAlpha = 1 - p;
      shock(ctx, x, y - 4, 30 + p * 120, 6 + p * 18, 3 * (1 - p) + 0.5, '#7ee081');
    } else if (v.kind === 'spit') {
      const sx = x + (v.tx - v.x) * p;
      const sy = y + (v.ty - v.y) * p - Math.sin(p * Math.PI) * 18;
      puff(ctx, sx, sy, 4, '#e0b8ff', '#a07ad6');
    } else if (v.kind === 'crash') {
      ctx.globalAlpha = 1 - p;
      starFlash(ctx, x, y - 30, 30 * (0.4 + p), 6, p, '#ffe36b');
      puff(ctx, x, y - 8, 12 * (1 - p) + 3, '#f6e2c8', '#c9a27a');
    }
    ctx.restore();
  }
  for (const bot of partyMembers(world.bots)) {
    if (bot.buffs && bot.body && bot.map === world.map.id && !bot.down) drawSupport(ctx, bot.buffs, bot.body.x - cam.x, bot.body.y - cam.y, time, world.now);
  }
  const ch = world.channel;
  if (ch) {
    const x = world.body.x - cam.x;
    const y = world.body.y - cam.y - 64;
    box(ctx, x - 22, y, 44, 7, { fill: 'rgba(58,45,79,0.6)', edge: '#ffffff', r: 3.5 });
    box(ctx, x - 21, y + 1, Math.max(3, 42 * ch.obj.progress), 5, { fill: ch.obj.kind === 'cage' ? '#9be08f' : '#ffd66b', edge: null, r: 2.5 });
  }
}

// A mage's support magic on someone: a shimmering bubble while their Arcane Barrier holds, and
// little green plus-sparkles rising while Renew heals them.
function drawSupport(ctx, buffs, x, y, time, now) {
  let barrier = null;
  let renew = false;
  for (const [id, b] of Object.entries(buffs)) {
    if (b.until <= now) continue;
    if (b.shield > 0) barrier = { ...b, id };
    if (b.values?.regenPct) renew = true;
  }
  // A Spirit Mage's ward: the sphere of light and sacred rope, as on her.
  if (barrier?.id === 'spiritward') fxSprite(ctx, 'celspiritward', x, y + 4, { t: time, scale: 0.78, alpha: 0.6 * Math.min(1, (now - barrier.since) * 3) });
  else if (barrier) {
    const k = 1 + Math.sin(time * 4) * 0.03;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.ellipse(x, y - 24, 18 * k, 29 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#c9ecff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y - 24, 14 * k, 25 * k, 0, Math.PI * 1.15, Math.PI * 1.45);
    ctx.stroke();
    ctx.restore();
  }
  if (renew) {
    ctx.save();
    ctx.fillStyle = '#9be08f';
    for (let i = 0; i < 3; i++) {
      const p = (time * 0.7 + i / 3) % 1;
      const px = x + Math.sin(i * 2.4 + time) * 10;
      const py = y - 8 - p * 40;
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.9;
      ctx.fillRect(px - 0.75, py - 2.5, 1.5, 5);
      ctx.fillRect(px - 2.5, py - 0.75, 5, 1.5);
    }
    ctx.restore();
  }
}
