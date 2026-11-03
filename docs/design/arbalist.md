# The Arbalist Engineer (the Archer's crossbow path; replaces the Stormcaller)

The player's picks (2026-11-02): a gadget gunner, brass and teal, an excited inventor, the Pressure
gauge with Big Bertha, and her turret as a machine prop (not a character). Held to the Wind Dancer
standard (CLAUDE.md).

## Who she is

A tinkerer whose crossbow is her own invention. Goggles up on her head, always fiddling: she pats
the crossbow proudly, cheers when a gadget works, cranks and swaps bolt cartridges on the fly. Her
shots are brass bolts glowing teal, gears flying where they hit, puffs of steam from her machine.

- **Colour:** polished brass and copper, with teal energy glowing in the bolts.
- **Shapes:** gears and cogs, rivets, steam puffs, and teal energy bands.
- **Readable:** the crossbow is held at the hip, never across her face (the Stormcaller's was held at
  the shoulder, its stock over her face).

## How she fights

- **Her string (her own figures, render/moves.js `ae*`):** a snap shot from the hip, a double shot
  (two bolts, a lever pumped between), a brace-and-crank shot that fires a heavy bolt through two,
  and a recoil blast that kicks her back as a big bolt rips through the line. Pool: a twirl-shot, a
  duck-and-fire, a triple crank, a sliding shot.
- **Commands:** up + attack fires straight up; in the air she fires down; out of a run she rolls and
  fires.
- **Pressure** (her gauge, internally Charge): every bolt that lands builds steam pressure; it fades
  once the fighting stops. Full (**Overdrive**): her crossbow vents steam and every shot fires two
  bolts.
- **Skills (gadgets):** Engineer Mastery; Sticky Bolt (a bolt sometimes sticks and bursts a moment
  later on everything close); Cluster Bolt (her string's last bolt splits into bomblets); Steam Vent
  (a hit on her sometimes vents steam that throws monsters back); **Deploy Turret** (she kneels and
  sets down a little brass turret that swivels and fires on its own for a while); Overclock (her
  next few bolts are heavy piercing ones); and **Big Bertha**, her finisher (full Pressure): she
  unfolds the crossbow into a giant ballista and fires one enormous bolt through everything.

## Status (2026-11-02)

Built, replacing the Stormcaller in place (the path keeps the `stormcaller` id, so saves and
Kestrel's trial carry over; the name is Arbalist Engineer).

- Crossbows are redrawn as compact gadget crossbows (render/weapon-designs.js), the rail level
  with the hand, so they sit at the waist; hers take a polished brass finish.
- Moves (render/moves.js `ae*`): aesnap, aedouble, aebrace, aerecoil and the pool's aetwirl,
  aeduck, aetriple, aeslide; aeup, aeair (down and in the air), aeroll; aedeploy, aebertha.
- Gadgets (world/engineer.js): Sticky Bolt, Cluster Bolt, Steam Vent, Deploy Turret (a machine
  prop, drawn from the `aeturret` strip), Overclock; Overdrive (full Pressure) fires a second bolt
  with every shot (world/melee.js `fire`).
- Skills: Engineer Mastery, Sticky Bolt, Cluster Bolt, Steam Vent, Deploy Turret, Overclock, Big
  Bertha (finisher).
- Effects (tools/fx-art.js): `aebolt`, `aebig`, `aehit`, `aeboom`, `aesteam`, `aeturret`,
  `aeballista`, `embgear`. Icons, the Pressure gauge, her steam aura, sounds.
- Removed: the Stormcaller's lightning (world/storm.js and its drawings).

## Animation rework (2026-11-03)

- Her moves set their own kicks (they no longer get the generic sway, which threw her body 40-60
  px forward and back during the twirl). Twirl: arm out, a little hop, one spin round the trigger
  finger (drawn behind her body as it passes over), slapped home at the hip.
- Each shot reads differently: Snap whips the crossbow up from nose-down; Double throws the free
  hand up and slams the lever; Brace drops onto one knee and winds the crank at the butt in big
  circles; Duck crouches with both knees bent and the head tucked; Triple leans back, stock on the
  hip, hammering the crank as it rattles; Slide is a baseball slide, front leg long, back knee
  skidding, leaning back with the hair streaming.
- Deploy Turret kneels, lowers the crossbow, reaches out to set the turret down and pats it twice,
  then hops up cheering. Big Bertha: down on one knee, three crank turns with the body bobbing into
  each, a growing shudder as it charges (eyes screwed half shut), then the kick throws her up off
  her knee and skids her back; she settles and pumps her fist. The roll hugs the crossbow along her
  back (no more poking through the floor).
- The free hand's crank sits at the butt behind her hip: in front, the big crossbow hides it.
