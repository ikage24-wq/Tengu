# Research: Sakuemon's pixel animation (the player's main body and motion reference)

Artist: さくえもン, @sakuemonq on X (https://x.com/sakuemonq), with a pixivFANBOX at
https://sakuemon.fanbox.cc/. They make pixel art and fighting-game-style fan animations, built in
Fighter Maker 2nd (格ツク2nd). The player named this style as the body they want for heroes. See
[avatar.md](avatar.md) for the proportions and [anim.md](anim.md) for the first loop study.

Collected from Tenor, where the GIFs are shared, from the search pages for "sakuemon" and
"sakuemon-pixel-art". Five more GIFs found there are close-ups focused on bouncing chests. They
are left out on purpose: they are fan service, not body or motion craft. The GIFs are kept out
of the repo; re-download them from these links to study frame by frame.

## The animations

- https://tenor.com/view/sakuemon-hololive-pixel-art-pekora-houshou-marine-gif-20301431 : Pekora, Noel and Marine idles side by side. 24 frames.
- https://tenor.com/view/sakuemon-iroha-chibi-samurai-spirits-animation-gif-19408893 : Iroha (chibi samurai) idle: a crouched stance with sleeves and scarf trailing. 5 frames.
- https://tenor.com/view/sakuemon-pekora-houshou-marine-fighting-game-hololive-gif-27166184 : Hololive fighting game: Marine vs Pekora, a crescent smear attack, knockdown and bounce. 213 frames.
- https://tenor.com/view/sakuemon-pekora-noel-shirogane-noel-usada-pekora-gif-27166185 : Hololive fighting game: Noel vs Pekora, spacing and walking. 189 frames.
- https://tenor.com/view/sakuemon-pekora-punch-parry-counter-gif-27166187 : Hololive fighting game: Pekora parry and counter, with a screen-darkening super flash. 101 frames.
- https://tenor.com/view/sakuemon-pixel-art-cute-chibi-gif-19773251 : Four tiny 2-head chibis idling. 35 frames.
- https://tenor.com/view/sakuemon-pixel-art-hololive-houshou-marine-disgaea-gif-19771950 : Five characters looping (Rozalin, Marine, Elma, Lucoa, a runner): idle sways and an 8-frame run. 60 frames.
- https://tenor.com/view/sakuemon-pixel-art-hong-meiling-china-kick-gif-19491124 : Hong Meiling: fighting stance, then a high kick (chamber, extend, hold, retract). 32 frames.
- https://tenor.com/view/sakuemon-pixel-art-hoshiguma-yuugi-yuugi-oni-gif-27137537 : Yuugi (Touhou): idle with a long skirt swaying. 7 frames.
- https://tenor.com/view/sakuemon-pixel-art-houshou-marine-hololive-cute-gif-27137538 : Marine (tiny chibi): a walk with dust puffs at the heel. 8 frames.
- https://tenor.com/view/sakuemon-pixel-art-melty-blood-hundred-hand-slap-miyako-gif-19773250 : Miyako (Melty Blood): a hundred-hand slap, with arm smears and a crescent smear. 9 frames.
- https://tenor.com/view/sakuemon-pixel-art-morrigan-aensland-vampire-darkstalkers-gif-27137534 : Morrigan (Darkstalkers): idle with wing flaps, bats and hearts. 6 frames.
- https://tenor.com/view/sakuemon-pixel-art-pekora-peko-rabbit-girl-gif-27137531 : Pekora: squash into a deep crouch, then a stretched jump with arms up. 12 frames.
- https://tenor.com/view/sakuemon-pixel-art-shake-shake-mischief-makers-marina-gif-20301429 : Marina (Mischief Makers) and a big robot: shake attack, jumps. 175 frames.
- https://tenor.com/view/sakuemon-pixel-art-shantae-dance-gif-27137536 : Shantae: a belly dance with big hip sway and a hair whip that lags. 12 frames.
- https://tenor.com/view/sakuemon-pixel-art-shiranui-mai-mai-king-of-fighters-gif-27137532 : Shiranui Mai (KOF): idle, high kick, fan throw with a big smear arc. 23 frames.
- https://tenor.com/view/sakuemon-pixel-art-touhou-sakuya-maid-gif-27137533 : Sakuya (Touhou): a walk cycle with knives in hand. 8 frames.
- https://tenor.com/view/sakuemon-sakuemonq-hololive-pekora-iroha-gif-14116218198720396400 : Hololive fighting-game footage (Iroha vs Pekora): sword dash, hit sparks, KO burst. 394 frames.
- https://tenor.com/view/sakuemon-shantae-dance-dancing-harem-pants-gif-27166183 : Shantae: a longer dance, ponytail whipping. 131 frames.
- https://tenor.com/view/sakuemon-shirogane-noel-noel-shirogane-noel-shirogane-gif-3737575803032737426 : Noel (Hololive, knight): idle with mace and cape, weight shift and a blink. 8 frames.
- https://tenor.com/view/sakuemon-tower-of-druaga-druaga-gif-27166181 : Tower of Druaga crowd walk (second version). 32 frames.
- https://tenor.com/view/sakuemon-tower-of-druaga-druaga-roper-pixel-art-gif-20301432 : Tower of Druaga: a crowd of chibi characters walking in a row. 32 frames.
- https://tenor.com/view/sakuemonq-sakuemon-pekora-noel-dance-gif-27352255 : Noel and Pekora: a New Year dance, cheering. 24 frames.

## What they teach

1. **Proportions.** Fighters stand about 3 to 3.5 heads tall (Mai, Meiling, Noel and Morrigan
   are taller at about 4), with big heads and hands, curvy hips, full thighs and small feet. Tiny
   cast and crowd characters are 2-head chibis (the Druaga walk, the four-chibi idle, the small
   Marine walk). Both sizes share one outline and shading style.
2. **Idles are rhythmic stances, not standing still.** About 5 to 8 frames at about 120 ms:
   - knees bent, weight forward, a 1-2 px bob;
   - shoulders and arms rock against the hips;
   - capes, sleeves, skirts and hair trail a frame or two behind;
   - small personal touches: a blink or wink, bats circling, hearts floating.
3. **Attacks.** A kick or swing moves through clear key poses:
   - an anticipation pose that coils, then the strike;
   - one bright smear frame: a white or coloured crescent, as with Mai's fan and Miyako's slaps;
   - the extended pose held 2-3 frames;
   - then recovery.
   Flurries show several smeared arms at once.
4. **Jumps.** A deep squash crouch held for 2 frames, then a stretched launch with the arms
   thrown up (Pekora). The landing squashes again.
5. **Walks.** 8 frames:
   - the body rises and falls;
   - the skirt and hair swing opposite to the hips;
   - small chibis kick up dust puffs at the heel (Marine).
6. **Dance and sway.** Big side-to-side hip sway, and a long ponytail that whips through a wide
   arc a beat behind (Shantae). The silhouette changes every frame.
7. **Fighting-game feedback** (the Hololive fighting-game clips):
   - star-burst hit sparks in orange and white;
   - a knockdown that bounces once;
   - a parry or super that darkens the whole screen for a moment while the attacker flashes;
   - white impact silhouettes;
   - KO bursts.
8. **Rendering.**
   - a crisp 1 px dark outline in the part's own darker colour;
   - 3-4 tone shading, with chunky shadows on clothes and thighs;
   - bright rim lights on hair and metal;
   - small faces with big eyes and a clear mouth.

## Apply to Tengu

- **Idle.** Turn the breathing idle into a stance with a weight shift and a hip sway, with capes,
  skirts and hair lagging behind. The springs exist; they need hip motion to react to.
- **Attacks.** Combo steps already have timing (`world/melee.js`). Add an anticipation key, one
  smear frame (the effects kit has arc smears) and a 2-3 frame hold on the extended pose.
- **Jumps.** Squash 2 frames before launch and stretch on the way up, as the jump already
  partly does.
- **Bosses and specials.** A super-flash screen darken on big skills, and star-burst sparks on
  heavy hits.
- **Body.** If the hero rig changes to the player's preferred body, use these proportions for
  heroes, and keep 2-head chibis for small NPCs and crowds.

