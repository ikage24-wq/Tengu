# Cutscenes

Story scenes are staged in the world itself, the way a film is: the camera moves, people walk
over, turn, hop and react, and the dialogue box carries the spoken lines. The world's own clock is
paused for the whole scene (no monster moves, no buff runs out), the HUD clears away, and the
letterbox bars come in.

Scenes live in `src/data/story.js` (`SCENES`) and `src/data/scenes.js`. A scene is a list of steps
played in order. The director is `src/world/director.js`; the cutscene window is
`src/ui/cutscene.js`.

## Steps

| Step | What it does |
|---|---|
| `{ card: 'Chapter 1', sub: 'A New Breeze' }` | A chapter title card |
| `{ who: 'mira', text: '...', mood: 'happy' }` | A spoken line in the dialogue box (`who: null` is narration) |
| `{ cam: 'mira', dur: 1.4 }` | Pan the camera to someone, `'player'`, or `{ x, y }`; `dur: 0` cuts |
| `{ walk: 'mira', to: 'player', gap: 30 }` | Walk to someone (stopping short), to an x, or `by: dx`; `speed` |
| `{ face: 'player', to: 'mira' }` | Turn to face someone, or `to: 1` / `-1` |
| `{ jump: 'mira' }` | A little hop |
| `{ emote: 'mira', kind: 'heart' }` | An emote pops over their head: `! ? heart note sweat anger zzz sparkle idea` |
| `{ say: 'mira', text: '...' }` | A speech bubble in the world over them; waits for a press |
| `{ wait: 0.5 }` | A pause |
| `{ fade: 'out', dur: 0.4 }` / `{ fade: 'in' }` | Fade the screen to a colour (`color`) and back |
| `{ flash: '#ffffff' }`, `{ shake: 2, dur: 0.6 }` | A flash; a shake |
| `{ fx: 'petals', at: 'player' }` | A burst: `sparkle hearts petals leaves wind confetti` |
| `{ spawn: 'rook', x: 900 }` | An NPC steps into the scene (`at` someone and `by` dx works too) |
| `{ leave: 'rook' }` | They fade out of it |
| `{ together: [steps] }` | Several steps at once |
| any step with `async: true` | Starts it and carries straight on |

## Rules the director keeps

- A step naming someone who isn't on the map is passed over, so a scene never gets stuck.
- When the scene ends, the camera eases back to you, NPCs who walked go back to their places, and
  the ones who came for the scene leave. You stay where the scene left you.
- Esc plays the rest out at once (everyone ends where the scene would have put them). Holding Z,
  Space or the mouse plays the staging three times as fast.

## Scenes online

- A scene is the watcher's own. While it plays, friends in the room step out of it (they, their
  effects and their numbers aren't drawn on your stage), nothing a friend does can hurt you, and the
  monsters on stage hold still for you. Effects and numbers already on screen when it began fade out
  as usual instead of hanging there.
- Friends see a little "in a scene" note over you, and the monsters leave you be until you're back.
- If your game was running the map's monsters, a friend on the map who isn't watching one takes
  them over until you're back, so nobody else's hunt freezes.
- In a shared dungeon run, a boss's entrance plays for the whole group at once; the leader's game
  takes no blows on the boss while its own copy plays.
- A friend's boat waits for you to finish a scene on the quay; a friend's run that starts while
  you watch one finishes the scene and takes you in.

## Writing a good one

- Open on a place, then come to the people: a cut or a slow pan over the landmark, then the camera
  to the hero.
- Let people react before they speak: an emote, a step closer, a turn to face you.
- One beat at a time: one emote, one move, one line. Use `together` only for things that really
  happen at once (a gust of wind with a shake).
- End with the camera on the hero, so the game picks up where the player expects.

`tests/director.test.js` checks the director; `tests/story.test.js` checks every scene's steps
name real people and known emotes and bursts.
