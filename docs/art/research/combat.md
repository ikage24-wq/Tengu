# Research: combos, links, finishers, juggles and smooth moves (EN / JA / KO / ZH)

Area: combo and hit counters, links and cancels between moves, finisher ("limit break") moves and
how they are staged, smoothness between attack animations, and air-juggle limits. Sources are
shipped-game data (wikis built from game files, patch notes), developer talks and articles, and
community frame-data essays. Each finding gives the technique, the numbers, the source, and how it
could apply to Tengu.

This file sits next to `fx.md` (hit-stop, shake, flashes) and `anim.md` (frame timing, smears,
overshoot). Where those already cover a point, this file points to them instead of repeating it.

## 0. What Tengu already has (so we don't re-suggest it)
- **Hit counter**: every hit within `HITS_WINDOW = 3` s adds one (`world/world.js`). The HUD shows a
  big number that pops (scale +45% for 0.16 s), the word HITS, a drain bar, and colour tiers with
  words at 10 / 25 / 50 / 100 (NICE! / GREAT! / AWESOME! / LEGENDARY!) (`ui/hud.js`). "FINISHER
  READY" blinks once you reach a finisher's cost.
- **Finishers**: Judgment-style moves with `hitsCost: 30` spend the counter, freeze the world
  for 0.55 s (`CUTIN_HOLD`), and play a 0.9 s cut-in: a dim, letterbox bars, and a slanted banner
  with the hero and the move name (`ui/hud.js drawCutin`, `world/combat.js`).
- **LINK**: a skill started within `LINK_WINDOW = 0.7` s of a finisher landing gets +25% damage and
  a "LINK!" pop (`world/combat.js`).
- **Combo steps**: a combo step can be cut into the next one 76% of the way through (`CANCEL`). The
  next press is accepted until 0.45 s after the step ends (`WINDOW`). Skill presses are buffered for
  0.3 s (`world/world.js`).
- **Pose blending**: a new move eases out of the old pose over `BLEND = 0.07` s with smoothstep
  (`render/scene.js`, `render/hero.js blendMove`).
- **Weight**: hit-stop capped at `MAX_STOP = 0.1` s (anything heavier becomes slow motion), slow
  motion at 0.35× after a boss falls (`main.js`), launches, and a slow hang during air cuts
  (`HANG_FALL = 30` px/s).
- **Rage** (Berserker): it builds per blow, holds for 5 s, then drains at 12/s. Rampage spends all
  of it for up to double damage.

So the base is in place. What follows is about deepening it: a counter that rewards variety and
survives a mistake, links that reward order, a tiered finisher gauge, sharper finisher staging,
juggles that end on their own, and blends that carry speed.

## 1. Engines and queries that worked
- **WebSearch** worked in all four languages. Its Korean and Chinese results lean on news and
  forum posts.
- **curl** on `ffxiv.consolegameswiki.com` returned full pages (the Limit Break and action pages
  quoted below).
- **Blocked**: elwiki.net and elsword.fandom.com (403; Elsword numbers come from search snippets
  of elwiki), namu.wiki and thewiki.kr (403), srk.shib.live and wiki.supercombo.gg (bot wall; not
  bypassed), primagames.com (403), and bilibili opus (captcha). The Guilty Gear Xrd handout PDF
  connection was reset.
- **Not found anywhere**: the exact Aran combo decay time, the exact DMC decay rate, DFO cut-in
  frame counts, and MapleStory Origin skill cut-scene length. These are marked as unverified
  wherever they come up.

## 2. Findings

### A. Combo and hit counters

**1. Devil May Cry: seven named ranks; getting hit drops tiers; variety earns points**
- **Ranks**: D Dismal, C Crazy, B Badass, A Apocalyptic, S Savage, SS Sick Skills, SSS Smokin' Sexy
  Style. Every fight starts at D.
- **Points**: every hit and every kill earns style points. Harder moves earn more. Ranged chip
  shots earn almost nothing. Repeating one attack earns less, so mixing moves is the main way up.
- **Losing it**: one hit taken drops you **one or two tiers** (not to zero). Stopping attacking makes
  the meter drain. The end-of-mission grade depends on how long you *held* a high rank.
- **Sources**: https://shacknews.com/article/110322/stylish-points-and-style-ranks-in-devil-may-cry-5 ,
  https://samurai-gamers.com/devil-may-cry-5/stylish-rank-system/ , GameSpot DMC4 walkthrough.
- **Tengu**: our tiers count hits only, and a pause wipes everything. Two cheap changes: (a) a hit
  *taken* knocks the counter down one tier boundary (for example, 57 drops to 25) instead of
  leaving it alone; (b) the same skill used back to back adds fewer hits to the counter
  (see finding 5). Our cute words fit the pastel tone better than DMC's, so keep them and add
  two more above 100 (for example, 200 "MYTHIC!").

**2. Bayonetta: a long, forgiving window and a growing multiplier**
- **Window**: the combo ends when you stop landing hits. Guides give **3 s** (ludo.guide), **about
  5 s** (Steam), and **6 s** (Prima, Bayonetta 2). Hitting any enemy from anywhere keeps it alive.
  Taunts stall the timer.
- **Score**: combo points × multiplier. The multiplier starts at 1.0. Plain melee hits raise it by
  **0.05** per step; other moves raise it faster. It caps at ×9.9 on screen. In Bayonetta 3,
  ending a combo pays out **10% of its score as Orbs** (currency).
- **Sources**: https://bayonetta.fandom.com/wiki/Combo_System_(Bayonetta_3) ,
  https://nintendolife.com/guides/bayonetta-2-how-the-combat-scoring-system-works-and-how-to-get-a-platinum-trophy-in-every-battle ,
  https://www.ludo.guide/guide/bayonetta/11-achievements .
- **Tengu**: our 3 s window sits at the strict end of this range, which suits the field (mobs
  are close). In boss rooms and dungeons, where you dodge more, 4–5 s would be fairer. Freeze the
  timer during hit-stop, cut-ins and slow motion so those never eat the window. A small payout when
  a long combo ends (bonus EXP or mesos as a share of hits, shown as a little "COMBO ×1.2 EXP" pop)
  gives the counter a use beyond finishers.

**3. MapleStory: combo kills drop orbs every 50; Aran's combo unlocks skills by threshold**
- **Combo Kill** (all jobs): consecutive kills build a count. Every **multiple of 50** spawns a
  Combo Orb near you, worth EXP that grows with the count. Orbs keep coming past 999. Aran's link
  skill raises orb EXP to **400% (Lv 70)** and **650% (Lv 120)**.
- **Aran's combo**: each hit adds 1. Combo Smash needs **10**, Combo Fenrir **20**, and Aegis
  Shield (party buff) **300**. Combo Ability gives knockback resistance, ATT, DEF and speed **every
  10** combo (older) or **every 50, up to 5 times** (MapleStory M). The combo is lost when you stop
  attacking (exact seconds not found).
- **Sources**: https://maplestory.nexon.com/Guide/N23GameInformation/Articles/450 (KO, official),
  https://ayumilove.net/maplestory-aran-skill-build-guide/ ,
  https://ayumilove.net/maplestory-m-aran-skill-build-guide/ , https://strategywiki.org/wiki/MapleStory/Aran .
- **Tengu**: this is the closest model to ours. Two ideas fit: a soft orb (a coloured bubble that
  pops out of the last mob hit and flies to the hero) every 50 hits, and small **stepped buffs**
  while the counter is high (for example, +2% attack speed per 25 hits, up to 4 steps). The buff
  makes the tier words matter and is a gentle reason to keep the chain alive.

**4. Elsword: the awakening gauge fills from hits landed and hits taken**
- **Rule**: the awakening charge fills each time you land a hit **or** get hit. A rough figure with
  no stat investment is **about 100 hits landed, or 50 hits taken, per orb**. You can hold up to 3
  orbs. Awakening lasts **30 / 60 / 90 s** for 1 / 2 / 3 orbs, raises attack, and at 3 orbs some
  characters take a special form.
- **Sources**: elwiki "Awakening Mode" (https://elwiki.net/w/Awakening_Mode, read via search
  snippets; the page refuses direct fetches).
- **Tengu**: counting hits *taken* as charge is a classic comeback valve. Taking a hit would then
  feed the finisher gauge (see finding 13) even while it drops the counter tier.

**5. Smash Bros.: stale-move queue and freshness bonus (rewarding variety in numbers)**
- **Rule**: the last **9** moves that connected are queued. A move already in the queue does less
  damage, by slot (Ultimate): **9%, 8.5%, 7.6%, 6.8%, 5.9%, 5.0%, 4.3%, 3.3%, 2.5%**. A move used 9
  times in a row loses about **53%**. A move not in the queue gets a **×1.05 freshness bonus**.
- **Source**: https://www.ssbwiki.com/Stale-move_negation .
- **Tengu**: don't cut damage (it would feel bad in a grind MMO). Use the same queue to scale how
  much each hit adds to the **counter**, or to the finisher gauge. A hit from a move not among
  the last 4 adds 1.5; a repeat adds 1. That nudges players to weave basics and skills, which
  our rules already allow.

**6. Timers versus tallies (Dustloop combo-system essay)**
- **Timers**: the combo or gauge expires after a set time. Timers are simple, and they should
  **pause during hit-stop**. Their weakness is that they punish slow, heavy moves and links,
  because a full recovery always costs more time than a cancel.
- **Tallies**: each move adds points toward a limit. Skullgirls' "Drama" rises with hits and decays
  once the target recovers.
- **Advice**: "having more systems with less overall effects tends to feel less harsh on the
  player."
- **Source**: https://dustloop.com/w/User:Slimegirl-scientist/Infinite_Prevention_and_Combo_Mechanics .
- **Tengu**: our hit window is a timer, and heavy finishers like the 1.6 s Crimson Eclipse
  already run longer than the 3 s window allows comfortably. Start the window from the *end* of
  the current move rather than from the last hit, so a long finisher never drops the count.

### B. Links and cancels

**7. FFXIV combos: in-order bonus of about ×1.8–2.3, plus a side effect; the next button glows**
- **Warrior**: Heavy Swing → Maim **190 → 340** combo potency (+10 Beast Gauge) → Storm's Path
  **220 → 500** (+heal 250, +20 Beast Gauge).
- **Paladin**: Fast Blade → Riot Blade **170 → 330** (+restores MP) → Royal Authority **200 → 460**
  (+grants Atonement Ready and Divine Might for 30 s, which makes the next holy spell instant and
  stronger).
- **Display**: the next combo action's icon gets a **flashing yellow border** that fades when the
  window runs out.
- **Window**: about **30 s** since Endwalker (TheBalance Warrior guide; older content used about
  15 s, unconfirmed). It is that long because the global cooldown is 2.5 s; the window is a
  safety net, not a timing test.
- **Sources**: https://ffxiv.consolegameswiki.com/wiki/Maim , `.../Storm's_Path`, `.../Riot_Blade`,
  `.../Royal_Authority`, https://www.thebalanceffxiv.com/jobs/tanks/warrior/basic-guide/ .
- **Tengu**: our skills already chain step by step on one key. A **cross-skill rotation** is the
  missing layer. For example, Paladin: Shield Bash → Holy Cut → Smite in that order, each within
  about 4 s of the last. Each in-order step hits ×1.5 (keep it below FFXIV's ×2, because our
  basics weave in between) and adds a job-flavoured extra: Paladin gets MP back and the next
  holy skill empowered, Berserker gets Rage. Light the next skill's hotbar icon with a gold
  outline, as FFXIV does. This adds depth without cooldowns.

**8. Cancel types: partial vs complete, buffered vs instant (God of War's combat designer)**
- **Types**: a *partial cancel* is allowed only in set windows, either **pre-hit** (before the
  hit frames) or **post-hit** (after them). A *complete cancel* is allowed at any time.
- **Input**: a *buffered* cancel is stored and fires when the window opens; good games let a newer
  press overwrite an older buffered one. An *instant* cancel fires on the frame it's pressed if the
  window is open.
- **Example**: a 60-frame attack with hit frames 15–20. The attack→attack cancel is buffered on
  frames 0–21 and fires at 21. Block can cancel on any frame (0–60).
- **Policy**: God of War allows pre-hit cancels on basic attacks (friendlier) but only post-hit
  cancels on the strong specials, so they can't loop. Kratos had **about 4,000 cancel branches** in
  God of War 2. Ninja Gaiden allows no pre-hit cancels at all.
- **Source**: Eric Williams, https://www.gamedeveloper.com/game-platforms/combat-canceled-i-god-of-war-i-action-game-design .
  A ZH echo with the God of War 3 example (light attack: complete cancel into block; heavy:
  cancellable only before the blade extends): https://www.gamersky.com/zl/201607/776125.shtml .
- **Tengu**: our rules are already "post-hit only" for skill→skill (`skillReadyAt`) and allow
  walking and jumping to cut the follow-through. Two refinements fit: (a) let a newer buffered
  press **replace** an older one (today the 0.3 s skill buffer holds one press); (b) give
  heavy finishers a later post-hit window than light steps (the `CANCEL` 0.76 becomes per step).

**9. Cancel freedom changes enemy design (GMTK, via gcores)**
- **Rule**: Dark Souls-style uncancellable attacks make every swing a commitment. Bayonetta-style
  "dodge out of anything" makes play flowing and forgiving, so the designers make enemies more
  aggressive to compensate.
- **Source**: https://www.gcores.com/articles/98516 (ZH, summarizing Game Maker's Toolkit).
- **Tengu**: our dodges (`guard`) are skills, so they obey the skill-after-skill wait. If we ever
  let a dodge cut a skill's follow-through, bosses must hit harder and more often to match.

**10. Rewards placed on combo positions (Dead Cells, Hades)**
- **Dead Cells**: the Broadsword's 2nd and 3rd hits always crit (since 1.1). The Bladed Tonfas'
  leaping opener, if it connects, makes the rest of the combo crit. Machete and Pistol's 3rd hit
  crits, knocks back, pierces shields and burns. The Rhythm n' Bouzouki crits from the 3rd hit
  onward when you press on a **~98 BPM** beat (about 0.61 s per hit), and the weapon flashes yellow
  and throws music notes when you're on time.
- **Hades**: the Stygian Blade's 3-hit chain deals **20 / 25 / 30** (×1, ×1.25, ×1.5), and only the
  3rd thrust knocks back.
- **Sources**: https://deadcells.wiki.gg/wiki/Broadsword , https://deadcells.wiki.gg/wiki/Bladed_Tonfas ,
  https://deadcells.wiki.gg/wiki/Machete_and_Pistol , https://deadcells.wiki.gg/wiki/Bouzouki ,
  https://hades.fandom.com/wiki/Stygian_Blade .
- **Tengu**: our sword runs 85 / 90 / 100 / 190 (finisher ×2.2), which matches the pattern. Two
  new ideas: a **"perfect timing" press**, where pressing the next step in the last 0.15 s of the
  window (shown by a brief sparkle on the blade) makes that step crit; and one weapon (dagger?)
  whose opener, if it lands, makes the rest of that chain crit.

**11. Alternating two kinds of move (Elsword's Way of the Sword)**
- **Rule**: Elsword's gauge swings between Vigor and Destruction. Destruction skills drain
  Destruction and grant Vigor; Vigor skills do the reverse. In the Destruction aura, heavy (X)
  attacks deal **+100%** and Destruction skills **+50%** (figures from an older Vietnamese wiki
  page, may be outdated).
- **Sources**: https://elwiki.net/w/Way_of_the_Sword , https://elwiki.net/w/Elsword/vi (via search
  snippets).
- **Tengu**: a fine model for the Paladin/Berserker split or for a future swordsman. Alternating a
  "fast" skill and a "heavy" skill charges the other one. It turns our LINK into a back-and-forth,
  so you don't just mash one skill.

**12. Skill chains and recasts in other MMOs (DFO, Lost Ark)**
- **DFO Skill Chain (2026)**: up to 4 skills on one hotkey, fired in order. A per-chain delay of
  **0–5 s** (default 3 s) sets how soon it moves to the next. It mainly smooths play; a guide notes
  that some classes (Soma) only get their full cancel-damage bonus when the presses are separate
  taps.
- **Lost Ark combo skills**: after the first cast, the same key can be pressed again within a
  window for follow-up hits (Storm Dragon Awakening: two more casts). Wait too long and it goes on
  cooldown.
- **Sources**: https://df.nexon.com/community/dnfboard/article/2978642 ,
  https://df.nexon.com/community/dnfboard/article/2978919 (KO),
  https://upcomer.com/lost-arks-combat-system-explained .
- **Tengu**: our "one step per press" skills are already the Lost Ark model. No change needed;
  this confirms the design.

**13. Input buffer size (Smash)**
- **Rule**: Brawl buffers most actions in the last **10 frames** (167 ms) of a move; Ultimate uses
  **9 frames** (150 ms). Holding the button through the end also counts.
- **Source**: https://www.ssbwiki.com/Buffer .
- **Tengu**: our 0.3 s skill buffer is twice Smash's. That is fine for an MMO with ping in mind,
  but a press made 0.3 s early sometimes fires a skill the player had changed their mind about.
  Use **0.2 s** for skills and keep a longer buffer for basic-combo taps.

### C. Finishers and "limit break" moves

**14. FFXIV Limit Break: bars, fill rates and lock times**
- **Gauge**: **10,000 units per bar**, up to 3 bars (4 players: 1 bar, 8 players: 2–3). It fills
  passively every 3 s: **220 units per tick** at best (bar 1 in **2 min 18 s**, all 3 in **6 min
  51 s**); each composition penalty lowers it (170, 160, 154, 144, 140).
- **Events**: a direct heal on someone at ≤10% HP gives **200 per bar** (up to 600). Surviving
  lethal damage gives **500 per bar** (up to 1,500). Kills, interrupts and mechanics can add more.
- **Use**: one button fires the **highest tier** your bars allow and **spends every bar**, even
  partly filled ones. A full bar **flashes orange with a sound**.
- **Power and lock**: melee LB1 Braver = 2 s cast + 3.86 s lock (5.86 s total); LB2 = ×2.2 Braver,
  3 s + 3.86 s; LB3 = ×3.5 Braver, 4.5 s cast + 3.7 s lock (8.2 s). Tank LBs are instant: −20% damage
  for 10 s (1.93 s lock), −40% for 15 s, −80% for 8 s (3.86 s lock).
- **Sources**: https://ffxiv.consolegameswiki.com/wiki/Limit_Break ,
  https://akhmorning.com/allagan-studies/limit-break .
- **Tengu**: replace the single "30 hits" cost with a **3-segment finisher gauge**, filled by hits
  (1 per hit, ×1.5 for fresh moves), kills (+5), and hits taken (+2, the Elsword valve). For example,
  30 / 60 / 100. The finisher key fires the highest tier and spends it all: tier 1 is today's move,
  tier 2 adds an extra strike and a bigger burst, tier 3 adds the full cut-in and a screen-wide
  blow. Flash the segment and chime when it fills. The gauge can live under the HP/MP bars.

**15. Smash Final Smash staging**
- **Standby**: on gaining it, the screen darkens briefly, the fighter gets a multicoloured aura,
  and the **eyes glow yellow**.
- **Activation**: a **close-up of the fighter's eyes**, a zoom onto the user, camera control locked,
  and a **solid-coloured patterned background** unique to each Final Smash. Background motion and
  moving platforms slow down.
- **Cinematic version**: some Final Smashes play their scene only **if the first hitbox connects**;
  a miss ends it fast.
- **Meter** (Ultimate): it fills passively, **faster from taking damage than dealing it**, and a
  full meter expires after **20 s**.
- **Source**: https://www.ssbwiki.com/Final_Smash .
- **Tengu**: (a) a **standby look** while the finisher is ready, beyond the HUD text: a soft rim
  glow around the hero and a sparkle in the eyes (our chibi eyes are big, so it reads well).
  (b) Split the cut-in into **"declare"** (on press: the dim, eye close-up and banner) and
  **"pay-off"** (on hit: the big burst), so a whiffed finisher still looks right and a landed one
  feels earned. (c) Behind the hero, use a flat pastel pattern in the school colour (holy gold
  rays, rage red streaks) instead of plain dimming.

**16. Smash "Special Zoom" and "Finish Zoom" on the deciding blow**
- **Rule**: on certain strong hits the game zooms toward the **point of impact** and time slows
  sharply for "a short moment". The background flashes **blue with sparks pointing at the impact**.
  When the game predicts a KO, the background is **red** instead, with a fixed ping-plus-slash
  sound. It is mostly skipped with more than 2 players.
- **Source**: https://www.ssbwiki.com/Finish_Zoom (frame counts not published).
- **Tengu**: use this for the hit that kills a boss, or the finisher blow that kills the last mob
  in a room: zoom 1.1× toward the impact, a 1-frame colour flash (tier colour), radial speed lines
  aimed at the hit, and 0.3–0.5 s at 0.3× speed. Skip it when several players share the screen.
  `fx.md` finding 10 has the boss-kill numbers.

**17. Fighting-game "super freeze": the world stops, only the user moves**
- **Rule**: KOF XIII **pauses the game during the super's startup flash**, and only the player who
  made the flash can input until it ends. MUGEN's "super pause" freezes play and darkens the
  screen. In Street Fighter, the cinematic plays **before** the move's real startup frames, so the
  freeze never eats the move's timing. Zangief's SFV Critical Art has a single pre-freeze frame and
  then grabs instantly.
- **Sources**: https://srk.shib.live/w/The_King_of_Fighters_XIII/Game_Elements/Super_Freeze (search
  snippet), https://srk.shib.live/w/Street_Fighter_6/Game_Data (snippet),
  https://mugenguild.com/forum/msg.2327314 .
- **Tengu**: this is what our `CUTIN_HOLD` does. Two details to copy: count the move's own timing
  from the *end* of the freeze (so `at` fractions don't shift), and buffer presses made during the
  freeze so they fire when it ends (the KOF "only you can input" rule).

**18. Sakurai: short slow motion, released quickly; layered tiers**
- **Rule**: Sakurai's presets stack up: none → stop → stop + vibration → stop + vibration + slow
  motion. A short slow motion that ends *right away* works better than a long one. "Boss stop"
  means flash and freeze on a boss kill.
- **Sources**: `ja.md` finding 22; https://automaton-media.com/articles/newsjp/20220824-216055/ (JA).
- **Tengu**: map these to the finisher tiers in finding 14: tier 1 = stop + shake; tier 2 = stop +
  shake + flash; tier 3 = stop + shake + flash + 0.3 s slow motion that snaps back to normal.

**19. Awakening and "ultimate" presentation in MMOs (Elsword, DNF, MapleStory, ZZZ)**
- **DNF Duel**: the Awakening Skill costs no MP and ends the awakened state's bonuses when used. If
  it hits, a scripted animation plays and then the damage applies.
- **MapleStory 6th job**: each Origin skill has a new cut-scene (Nexon). Players report it is
  invincible during the cast (unverified). After an Origin skill, other long cooldowns tick faster
  by "the length of the casting animation", so the lock time isn't wasted.
- **Zenless Zone Zero**: a chain attack slows time for "a few seconds" while you pick between two
  portraits, and it can chain into a third (2× on elites, 3× on bosses).
- **Sources**: https://diamondlobby.com/dnf-duel/how-awakening-works/ ,
  https://gamedeveloper.com/press-release/_a-new-age-of-maplestory-is-here_- ,
  https://www.invenglobal.com/articles/20951/ , https://gamewith.net/zenless-zone-zero/46150 .
- **Tengu**: (a) make the hero **untouchable for the whole finisher** (our finishers already use
  `guard: 1.3`; keep it to the full length of the move). (b) A finisher lock should never cost the
  player buff time, so pause buff timers during the cut-in.

**20. Guilty Gear Xrd: poses over smoothness, cameras for supers**
- **Rule**: Arc System Works animates in "limited animation". Each frame is a hand-placed key, like
  stop motion, because full in-betweening made the 3D characters look too 3D. Clear poses come
  first, and the model is re-shaped on every key. Dramatic camera angles are saved for supers.
  Hit effects are 2D image sequences that change every frame.
- **Sources**: https://www.gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The ,
  https://videohighlight.com/v/yhGjCzxJV3E (timestamped summary, 29:21–33:39, 47:28).
- **Tengu**: for finisher cut-ins, draw the hero close-up as **2–3 held poses** (draw, strike, hold)
  that snap rather than tween. `anim.md` finding 14 covers mixing 1s/2s/3s timing.

### D. Smooth moves between attacks

**21. Inertialization and dead blending: carry the old motion's speed, don't just fade**
- **Rule**: Gears of War 4 dropped normal cross-fades for **inertialization**: on the switch, the
  gap between old and new pose is stored and decays to zero, so the new animation plays at full
  strength at once. Cross-fades damp the new move's detail and look "mushy". **Dead blending**
  (Daniel Holden) carries the *old* pose forward with its velocity (decaying with a half-life) and
  fades that into the new pose. Example blends are about **0.2 s**; 1 s is "unrealistically long".
- **Sources**: https://www.gdcvault.com/play/1025165/Inertialization (Bollo, GDC 2018),
  https://theorangeduck.com/page/dead-blending .
- **Tengu**: `blendMove` is a 70 ms smoothstep cross-fade between two frozen poses. For
  attack→attack that is right (short, so the new strike is never softened). The upgrade is to keep
  the **weapon's angular speed**: when a slash cuts into a backhand, the blade keeps swinging the
  way it was going for a frame or two before it turns. Store the old move's weapon angle velocity,
  extrapolate `angle + v·t` with `v` halving every 30 ms, and blend that into the new pose. The
  same applies to `lunge` and `lift`, so a lunge into a thrust doesn't stop dead.

**22. Blend length by transition type (engine practice)**
- **Rule**: in Unreal, a 0.25 s blend-in made an attack "always start a quarter of the way in",
  because the blend ate the start. Tutorials set **0.2–0.3 s** for blend-out back to idle, and
  overlap the next attack's blend-in with the previous blend-out for fluid combos. Spine projects
  commonly use a 0.2 s default mix, with shorter per-pair mixes where needed.
- **Sources**: https://answers.unrealengine.com/questions/780112/view.html ,
  https://bugnet.io/blog/fix-unreal-anim-montage-blend-out-not-triggering ,
  https://esotericsoftware.com/spine-applying-animations , https://esotericsoftware.com/forum/d/10913 .
- **Tengu**: use **different blend lengths per transition**: attack→attack 50–70 ms (as now);
  attack→idle, walk or jump **150–200 ms** (today the end of a combo snaps to idle in 70 ms, which
  is where moves feel choppiest); hurt→anything 100 ms. Never let the blend run past a strike's
  `at`: if a strike lands at 0.42 of a 0.38 s step (160 ms), a 70 ms blend is safe, but 150 ms would
  not be.

**23. Short anticipation for the player; act on a key frame, not on the press**
- **Rule**: Bayonetta's opening attacks average **4–6 frames** of anticipation (67–100 ms), the
  attack itself runs 3–30 frames, and the shortest move is about **10 frames** total. The engine
  listens for the next input as soon as a combo-starting move begins, but **waits for a key frame**
  in the current move before starting the next, so it never cuts off the hit. Good animation hides
  that wait.
- **Source**: https://aztez.com/?p=546 (Aztez developer blog).
- **Tengu**: this matches our `at` timing and buffering. Keep hero wind-ups at 60–100 ms (`anim.md`
  finding 18) and let the 2nd and later steps of a chain start *from the previous step's
  follow-through pose*: no fresh wind-up, because the old swing is the wind-up.

**24. Movement may cut recovery (Hollow Knight)**
- **Rule**: the Knight's basic nail slash has a **0.35 s** duration and a **0.41 s** cooldown (Quick
  Slash: 0.28 s / 0.25 s). A new slash needs both to run out, but turning or dashing ends the
  duration early once the cooldown is done, for up to about **+39%** attack rate.
- **Source**: https://hollowknight.wiki/w/Quick_Slash .
- **Tengu**: the same as our `recoverAt` rule (walk or jump cuts the follow-through, not the
  skill wait). It's a good sign the rule is standard. Make sure the cut blends (finding 22) instead
  of popping straight into a walk.

**25. Smears, overshoot and settle**
- Already covered: one flat-colour smear frame, never on wind-up or recovery (`anim.md` 15,
  `en.md`); overshoot on the hit frame and slow settle (`anim.md` 19, `fx.md`); keys with easing
  only next to them (`anim.md` 5, Dead Cells); snappy 1s/2s/3s timing (`anim.md` 14).
- **New for finishers**: give each finisher **two settle poses** (a rebound up, then rest), as PA
  Works recommends for weight (`anim.md` 13), and hold the final pose for 150–250 ms before the
  blend to idle. A finisher that recovers as fast as a jab doesn't read as a finisher.

### E. Juggles and air combos

**26. The standard juggle tools: start, increase, limit; gravity; same-move limits; one OTG**
- **Juggle values** (SF and KOF): each move has a juggle *start*, an *increase* when it hits a
  juggled target, and a *limit*; past the limit it whiffs.
- **Gravity scaling**: Guilty Gear +R ties gravity to the hit count; Strive raises gravity as the
  combo goes on, and a move used **3+ times** in one combo launches lower. Hokuto no Ken raised
  gravity only until **30 hits**, then targets bounced off the floor, which allowed infinite
  combos (a warning).
- **Hit-state limits**: Skullgirls allows **one OTG** (hit on the ground) and one wall bounce per
  combo. Under Night allows 3 wall bounces or hard knockdowns in total.
- **Damage scaling**: Street Fighter −10% per move; KOF −5% per move; SF4 doesn't scale the 2nd hit.
- **Advice**: several mild systems feel fairer than one harsh one.
- **Source**: https://dustloop.com/w/User:Slimegirl-scientist/Infinite_Prevention_and_Combo_Mechanics .
- **Tengu**: mobs get launched (`launch`) and hang during air cuts. Today nothing ends a juggle on
  its own except running out of moves. Add per-mob air state: `airHits` and a **gravity multiplier
  of 1 + 0.08 per air hit** (so the 10th air hit drops them about twice as fast), and
  **after 12 air hits, the mob falls and can't be re-launched until it lands and gets up**. Allow
  **one** ground bounce per juggle. Bosses: super-armour already ignores launches; keep that.

**27. DNF Duel: separate air and ground hitstun decay; damage floors**
- **Hitstun decay**: on the ground, each attack's hitstun drops **5 frames for every 120 frames**
  (2 s) spent in hitstun. In the air it drops **4 frames for every 30 frames** (0.5 s), four times
  faster. Starting a combo with a light (A) normal moves the timer **60 frames** ahead.
- **Damage**: each move has a combo rate (10–100%), and the combo keeps the *lowest* seen. Most
  moves have a **10–15% floor**; Awakening supers have a **50%** floor.
- **Source**: https://www.dustloop.com/wiki/images/cache/3/3e/DNFD%252FDamage.html .
- **Tengu**: "air time decays fast, ground time slowly" suits a MapleStory-like game where most
  fighting is on the ground. Give finishers a high damage floor (for example, they always do at
  least 50% of their listed damage), so a finisher at the end of a long juggle still feels big.

**28. Dungeon Fighter's arena corrections (보정): five mild limits**
- **Rule**: a 2015 KR patch made five corrections toggleable in duel practice:
  1. *Stand*: after taking enough damage while standing, the target falls down.
  2. *Hit recovery*: the longer the combo, the faster the target recovers from each hit.
  3. *Air combo*: after taking enough damage in the air, the target falls faster and faster.
  4. *Down combo*: after enough damage on the ground, the target gets up faster.
  5. *Evasion*: the longer the combo, the more likely the target dodges.
  No numbers were given.
- **Sources**: https://www.inven.co.kr/board/df/4307/46 (KO, 2015-05-26); hitstop split in DFO
  (역경직 for blunt hits): `anim.md` finding 3 and `ko.md` finding 8.
- **Tengu**: corrections 3 and 4 are worth copying for **bosses and elite mobs** (normal mobs die
  too fast to need them): a boss juggled for more than 1.5 s falls faster; a downed boss hit for
  more than 2 s gets up with a short shockwave that pushes the hero back.

**29. Virtua Fighter and MvC3 caps**
- **VF**: juggle hits + OTG hits **≤ 6**, counting only air hits.
- **MvC3**: a hidden hitstun-deterioration value grows during a combo. Launchers and air finishers
  add little, OTG hits add a lot, so the OTG is what ends a launcher → air combo → OTG loop.
- **Sources**: https://ns2.virtuafighter.com/threads/unevadable-meatys-juggle-potential.18049/page-2 ,
  https://srk.shib.live/w/Marvel_vs_Capcom_3/Combo_Limiters/Hit_Stun_Deterioration (search snippet).
- **Tengu**: a fighting game needs tight caps; we don't. Our cap (12 air hits) can be generous,
  because mobs can't escape anyway and it's mainly about not looking silly. Charge the most for
  hits on a downed mob, as MvC3 does.

## 3. Top 8 recommendations (ordered by payoff per effort)

1. **Make the hit counter forgiving and fair** (S). Pause its timer during hit-stop, cut-ins and
   slow motion. Count the window from the end of the current move. A hit taken drops one tier
   (DMC) instead of doing nothing. Fresh moves add 1.5 hits, repeats add 1 (Smash's stale queue).
   Add a tier above 100. *(Findings 1, 5, 6.)*
2. **Blend by transition type, and carry speed** (S–M). Keep 50–70 ms between attacks, use
   150–200 ms from an attack back to idle, walk or jump, and hold each finisher's last pose
   150–250 ms. Carry the weapon's swing speed through the switch (dead blending), so a cut that
   cancels into the next keeps flowing instead of stopping and restarting. *(Findings 21, 22, 25.)*
3. **A 3-tier finisher gauge, FFXIV-style** (M). Segments at about 30 / 60 / 100, filled by hits,
   kills and hits taken. One press fires the highest tier and spends everything. Each segment
   flashes and chimes when it fills. Tier 3 gets the full cut-in. *(Findings 4, 14.)*
4. **Stage the finisher in two beats** (S–M). "Declare" on the press: dim, eye close-up, banner,
   a flat pastel pattern in the school colour. "Pay-off" on the hit: burst, Finish-Zoom-style
   1.1× zoom toward the impact, speed lines, and a short slow motion that snaps back. Add a
   ready glow (rim light, eye sparkle) while the finisher is available. Keep the hero untouchable
   throughout, and pause buff timers. *(Findings 15–19.)*
5. **Cross-skill rotations with an in-order bonus** (M). For example, Paladin: bash → holy cut →
   smite, each within about 4 s, gets ×1.5 and a job extra (MP back, an empowered holy skill, or
   Rage). The next skill's hotbar icon gets a gold outline. *(Finding 7; Elsword's alternation,
   finding 11.)*
6. **Juggles that end themselves** (S). Per-mob air hits, gravity +8% per air hit, a cap of 12 air
   hits, then a forced drop with no re-launch until the mob stands. One ground bounce per juggle.
   Finishers do at least 50% of their listed damage. *(Findings 26–29.)*
7. **A "perfect timing" press in basic combos** (S). Pressing in the last 0.15 s of the window
   makes that step crit, with a blade sparkle and a brighter number. It rewards rhythm without
   punishing mashing. *(Finding 10.)*
8. **Counter rewards that matter while playing** (S–M). Small stepped buffs while the counter is
   high (for example, +2% attack speed per 25 hits, up to 4 steps), a combo orb every 50 hits, and a
   small EXP payout when a long chain ends. *(Findings 2, 3.)*

Rules check (CLAUDE.md): nothing here adds a cooldown. Rotations and finishers stay gated by MP,
gauge and animation. Finishers still play out in full, and the counter changes don't let a skill
start before `skillReadyAt`. Extend `tests/melee.test.js` for the juggle cap and the rotation
bonus.

## 4. Reference list

**Combo counters and ranks**
- Shacknews, DMC5 Stylish Points and Style Ranks — https://shacknews.com/article/110322/stylish-points-and-style-ranks-in-devil-may-cry-5
- Samurai Gamers, DMC5 Stylish Rank System — https://samurai-gamers.com/devil-may-cry-5/stylish-rank-system/
- GameSpot, Devil May Cry 4 walkthrough (style meter drain) — https://www.gamespot.com/articles/devil-may-cry-4-walkthrough/1100-6185546/
- Bayonetta Wiki, Combo System (Bayonetta 3) — https://bayonetta.fandom.com/wiki/Combo_System_(Bayonetta_3)
- Nintendo Life, Bayonetta 2 combat scoring — https://nintendolife.com/guides/bayonetta-2-how-the-combat-scoring-system-works-and-how-to-get-a-platinum-trophy-in-every-battle
- Prima Games, Bayonetta 2 "The Art of the Combo" — https://primagames.com/eguides/bayonetta-2-eguide/chapter-iv-know-your-potential-combat-primer-advanced/the-art-of-the-combo
- ludo.guide, Bayonetta achievements — https://www.ludo.guide/guide/bayonetta/11-achievements
- Nexon (KO), MapleStory Combo Kill guide — https://maplestory.nexon.com/Guide/N23GameInformation/Articles/450
- Ayumilove, MapleStory Aran skill build — https://ayumilove.net/maplestory-aran-skill-build-guide/
- Ayumilove, MapleStory M Aran — https://ayumilove.net/maplestory-m-aran-skill-build-guide/
- StrategyWiki, MapleStory/Aran — https://strategywiki.org/wiki/MapleStory/Aran
- Elwiki, Awakening Mode — https://elwiki.net/w/Awakening_Mode
- SmashWiki, Stale-move negation — https://www.ssbwiki.com/Stale-move_negation
- Dustloop, Infinite Prevention and Combo Mechanics — https://dustloop.com/w/User:Slimegirl-scientist/Infinite_Prevention_and_Combo_Mechanics

**Links and cancels**
- FFXIV wiki, Maim — https://ffxiv.consolegameswiki.com/wiki/Maim
- FFXIV wiki, Storm's Path — https://ffxiv.consolegameswiki.com/wiki/Storm%27s_Path
- FFXIV wiki, Riot Blade — https://ffxiv.consolegameswiki.com/wiki/Riot_Blade
- FFXIV wiki, Royal Authority — https://ffxiv.consolegameswiki.com/wiki/Royal_Authority
- FFXIV wiki, Chaos Thrust (combo border display) — https://ffxiv.consolegameswiki.com/wiki/Chaos_Thrust
- The Balance, Warrior basic guide (30 s combo window) — https://www.thebalanceffxiv.com/jobs/tanks/warrior/basic-guide/
- Eric Williams, "Combat Canceled: God of War & Action Game Design" — https://www.gamedeveloper.com/game-platforms/combat-canceled-i-god-of-war-i-action-game-design
- Gamersky (ZH), cancels in action games — https://www.gamersky.com/zl/201607/776125.shtml
- Gcores (ZH), cancel design after GMTK — https://www.gcores.com/articles/98516
- Dead Cells wiki, Broadsword — https://deadcells.wiki.gg/wiki/Broadsword
- Dead Cells wiki, Bladed Tonfas — https://deadcells.wiki.gg/wiki/Bladed_Tonfas
- Dead Cells wiki, Machete and Pistol — https://deadcells.wiki.gg/wiki/Machete_and_Pistol
- Dead Cells wiki, Rhythm n' Bouzouki — https://deadcells.wiki.gg/wiki/Bouzouki
- Hades wiki, Stygian Blade — https://hades.fandom.com/wiki/Stygian_Blade
- Elwiki, Way of the Sword — https://elwiki.net/w/Way_of_the_Sword
- DFO board (KO), 스킬체인이란? — https://df.nexon.com/community/dnfboard/article/2978642
- DFO board (KO), 스킬체인 공략 — https://df.nexon.com/community/dnfboard/article/2978919
- Upcomer, Lost Ark combat system explained — https://upcomer.com/lost-arks-combat-system-explained
- SmashWiki, Buffer — https://www.ssbwiki.com/Buffer

**Finishers**
- FFXIV wiki, Limit Break — https://ffxiv.consolegameswiki.com/wiki/Limit_Break
- Allagan Studies, Limit Break — https://akhmorning.com/allagan-studies/limit-break
- SmashWiki, Final Smash — https://www.ssbwiki.com/Final_Smash
- SmashWiki, Special Zoom / Finish Zoom — https://www.ssbwiki.com/Finish_Zoom
- SuperCombo, KOF XIII Super Freeze — https://srk.shib.live/w/The_King_of_Fighters_XIII/Game_Elements/Super_Freeze
- SuperCombo, Street Fighter 6 Game Data — https://srk.shib.live/w/Street_Fighter_6/Game_Data
- Mugen Guild, super pause — https://mugenguild.com/forum/msg.2327314
- Automaton (JA), Sakurai channel launch and "boss stop" — https://automaton-media.com/articles/newsjp/20220824-216055/
- Diamond Lobby, DNF Duel awakening — https://diamondlobby.com/dnf-duel/how-awakening-works/
- Nexon press release, MapleStory New Age (Origin skills) — https://gamedeveloper.com/press-release/_a-new-age-of-maplestory-is-here_-
- Inven Global, MapleStory 6th job update summary — https://www.invenglobal.com/articles/20951/new-6th-job-skills-added-a-summary-of-key-changes-in-the-maple-anniversary-2nd-update
- GameWith, Zenless Zone Zero chain attacks — https://gamewith.net/zenless-zone-zero/46150
- GDC Vault, Motomura, "GuiltyGearXrd's Art Style" — https://www.gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The
- Timestamped summary of the same talk — https://videohighlight.com/v/yhGjCzxJV3E

**Smooth moves**
- GDC Vault, Bollo, "Inertialization: High-Performance Animation Transitions in Gears of War" — https://www.gdcvault.com/play/1025165/Inertialization
- Daniel Holden, Dead Blending — https://theorangeduck.com/page/dead-blending
- Unreal answers, blend time cutting an attack's start — https://answers.unrealengine.com/questions/780112/view.html
- Bugnet, montage blend-out tuning — https://bugnet.io/blog/fix-unreal-anim-montage-blend-out-not-triggering
- Esoteric Software, Spine: Applying Animations (mix durations) — https://esotericsoftware.com/spine-applying-animations
- Spine forum, default mix 0.2 in practice — https://esotericsoftware.com/forum/d/10913
- Aztez devblog, "Characters Adhering To Input" — https://aztez.com/?p=546
- Hollow Knight wiki, Quick Slash — https://hollowknight.wiki/w/Quick_Slash

**Juggles**
- Dustloop, DNF Duel damage and hitstun systems — https://www.dustloop.com/wiki/images/cache/3/3e/DNFD%252FDamage.html
- Inven (KO), DFO first-server patch 2015-05-26 (결투 연습 보정) — https://www.inven.co.kr/board/df/4307/46
- Virtua Fighter forum, juggle + OTG cap — https://ns2.virtuafighter.com/threads/unevadable-meatys-juggle-potential.18049/page-2
- SuperCombo, MvC3 Hit Stun Deterioration — https://srk.shib.live/w/Marvel_vs_Capcom_3/Combo_Limiters/Hit_Stun_Deterioration
- SmashWiki, Juggle — https://www.ssbwiki.com/Juggle
