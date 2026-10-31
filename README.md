# Tengu

A cute pastel 2D side-scrolling MMO-style RPG. Start as a Novice, pick a job at level 10 and a path
at 30, hunt monsters, run dungeons, and play with friends. Everything is drawn in code and there is
no build step.

## Play

- **In the browser:** https://ikage24-wq.github.io/Twzt/ (keyboard, or touch controls on a phone held sideways)
- **On Windows:** download `Tengu-Setup-<version>.exe` from [Releases](https://github.com/ikage24-wq/Twzt/releases). It updates itself.

## Controls

| Key | Action |
| --- | --- |
| Left / Right | Walk |
| Space | Jump (Down + Space drops through a ledge) |
| Up | Climb, talk to an NPC, enter a portal |
| Z | Attack (hold to chain a combo) |
| X | Pick up loot |
| Q W E R A S D F 1 2 3 4 | Skill and potion hotkeys |
| I / C / K / L / M / O | Bag / Stats / Skills / Quests / World map / Cash Shop |
| N / T | Play with Friends / Emotes |
| Enter | Chat (`/help` for commands) |
| Esc | Close windows, or open Options |
| F11 | Full screen (Windows app) |

To bind a hotkey, select a skill or potion and press the key. Right-click a hotkey to clear it.

## Play with friends

Press **N**, then **Host a room** and share the six-digit code; up to 3 friends join with it.
Everyone shares the map, monsters, chat, parties, dungeons and trading. Players connect directly
to each other, so there's no server to run. Add `?net=local` to the address to test between tabs.

## Run from source

```sh
npm start            # serves the game at http://localhost:8000
npm test             # all tests
```

## Windows app

```sh
npm install          # once
npm run desktop      # run the app from source (F12 opens dev tools)
npm run dist         # build dist/Tengu-Setup-<version>.exe
```

To ship an update:

1. `npm version patch` (or `minor` / `major`): bumps the version, which also shows on the title screen.
2. Set a GitHub token with **repo** access once: `[Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_...', 'User')` in PowerShell.
3. `npm run release`, then `git push --follow-tags`.

Installed copies check for a new release on launch and every few hours, download it, and offer to
restart. Saves carry over between versions. The app isn't code-signed, so Windows shows a
SmartScreen warning on first install (**More info → Run anyway**).

## Tools

| Command | What it does |
| --- | --- |
| `npm run balance` | Checks job balance: tanks and healers never out-damage damage jobs |
| `node tools/tune.mjs` | Finds each job's damage tuning |
| `node tools/build-audio.mjs` | Rebuilds the recorded sound effects (needs ffmpeg) |
| `npm run icon` | Redraws the app icon |
| `tools/*.html` | Dev pages for checking art: open them through `npm start` |

## Layout

```
index.html      page shell
src/main.js     screens, game loop, autosave
src/core/       rules: stats, formulas, items, inventory, quests, saves
src/data/       content: jobs, skills, items, monsters, maps, NPCs, quests, outfits
src/world/      simulation: physics, combat, monsters, loot, bots, dungeons
src/render/     drawing: characters, gear, hair, monsters, effects, scenery
src/ui/         HUD, windows, menus, touch controls
src/net/        playing with friends (peer-to-peer)
src/audio/      music and sound effects, all synthesized except a few public domain recordings
electron/       the Windows app
tests/          node:test suites
tools/          balance, audio and art tools
```
