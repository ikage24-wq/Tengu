# Co-op and bots: the push (2026-11-03)

The player's ask: multiplayer should be awesome, focused on co-op, with much better bots. Their
picks (all of them):

Co-op
1. **Team moves.** Combo chains passed between players (one launches, another catches it in the
   air for a bonus), reviving a downed friend by standing by them, side-by-side buffs that stack
   when you fight near each other, a group finisher when the party's gauges are full.
2. **Co-op content.** Party quests (gather and hunt together for a shared reward), bosses with
   mechanics that need 2+ people, harder party-only dungeon modes.
3. **Easy grouping.** Friends and nearby players on the world map, one-click join, party pings and
   waypoints, party chat with quick emotes, shared quest progress.
4. **Co-op life skills.** Bonus finds when two work the same vein or tree, a party feast (party-wide
   food buffs), crafting for a friend.

Bots
5. **Smarter fighting.** Their job's real skills and finishers, dodging boss telegraphs, focusing
   your target, proper tanking and healing in dungeons, reviving you, calling out what they do.
6. **Real personalities.** Memory of you (runs, trades, gifts), bot friendships, goals they talk
   about (a set they farm, a level they chase), moods.
7. **Feel like real players.** Natural movement, emotes and reactions, showing off gear, AFK in
   town, joining and leaving over the day, their own parties.
8. **Bots fill co-op.** When friends are offline, bots fill party slots and play the co-op content
   (team moves, party quests, two-person mechanics) properly.

Everything works the same with online friends (net/together.js, online.js) and with bot party
members (world/party.js), so a solo player gets the full co-op game with bots. Bot chat follows the
chat gate (CLAUDE.md). Bots never take life spots from the player.

Built in two waves: (1) team moves, easy grouping, co-op life skills; (2) co-op content, smarter
bots and bots filling co-op, bot personalities and real-player feel. Each part is shown to the
player before it is merged.

## Part 4 built: co-op life skills (`world/coop-life.js`)
- **Working together:** two or more of the party at the same vein, tree, herb patch or fishing
  nook (within 6 s of each other) get one more find per helper (up to two), better rare odds and a
  quarter more life EXP each, with a "Together!" pop and a mint sparkle over the spot. Bot party
  members near you sometimes come over when you start, work it beside you with its own move, cheer
  at the find and go back to hunting after; their work never rests the spot. Online, a `work`
  message (sent at the start and every few seconds) gives a party friend at the same spot the bonus.
- **Party feasts:** a Party Feasts tab at every stove, one feast per tier from a bigger batch of that
  tier's dish ingredients (two of its dishes' bonuses together, 20 minutes). Eating it serves the
  whole party on the map: bot members (their stats take it) and online party friends (`feast`
  message); serving gives a little Cooking EXP per member fed.
- **Crafting for a friend:** a "For" pill on the craft window picks a party member here; the piece
  goes straight to them (a bot wears it if it suits them and thanks you through the chat gate; an
  online friend gets it through a `gift` message), and gear made that way says "Made by" you.
- Tests: `tests/coop-life.test.js`.

## Built: co-op content (part 2)

- **Party quests** (world/partyquest.js, data/coop.js): Posy keeps a Party Board by every town's
  plaza with a hunt, a gather and a defend for the region at your level, changing every two hours
  (the same board for everyone). Progress is shared: your kills and finds, your party members'
  (they gather the material at the map's spots too, never one you're using), and online friends'
  (a `pq` message; a friend taking a quest shares it). Done, everyone is paid EXP and gold, and
  you get Party Tokens to trade at the board.
- **Two-person boss mechanics** (world/coopboss.js, render/coop.js): the Queen Bee and the Myconid
  Queen share a big blow among everyone in a gold ring; Old MacGoblin and Tuskar wear a guard that
  breaks only when struck from both sides at once; Gnarlroot's armour is down only while someone
  stands on the Root Seal. Party members crowd into the ring, take the empty side (hopping over the
  boss), hold the seal, and call it out through the chat gate. Alone they're all still winnable.
- **Hard mode is party-only** (two or more, after a first clear): each Hollow boss gets one more
  mechanic (tethered Twin Puffballs, an Earthquake Stomp to share, a Bark Ward to break from both
  sides), and the clear pays three times the tokens and Gnarlroot's Leaf Crown, a Hard-only look.
- tools/coop-stage.html stages each of these for pictures and videos.

## Built: team moves (wave 1, part 1)

All in world/teamwork.js; the same with bot party members and with friends online (a friend's
game works out its own catches and revives and tells yours: net/together.js, `team` messages).

- **Team Catch.** A monster one member launches can be caught in the air by another for 1.2 s:
  +25% damage (+10% more per catch in a chain, up to +60%), it pops back up, "TEAM!" (x2, x3...)
  and two stars clinking. Bots near a launch often go for the catch; their own launches are
  yours to catch.
- **Revive by standing by.** Stand by a fallen member for 2.5 s (a peach ring fills round them):
  up with 30% HP. A hit taking a tenth of your HP at once, or walking off, breaks it. Bots walk
  over to get you or each other up; a fallen bot in the field waits while someone helps.
- **Side by side.** +4% damage for each member fighting within ~200 px (up to three), a party
  badge with pips by the gauge, and soft beads of light linking you while you fight.
- **Group Finisher.** Your finisher while another member near you has a full gauge: everyone
  near joins a beat apart (the party combo), the full ones spending theirs, then a shared burst
  and a short slow-motion beat. The HUD says GROUP FINISHER READY. A friend online with a full
  gauge plays their own finisher a beat later.
- Effects in the party's own colours (sunrise peach and sky blue, two stars meeting):
  `celteamcatch`, `celteamlink`, `celteamrevive`, `celteamburst` (tools/fx-art.js).

- The telegraphs are Tengu's own effect art (tools/fx-art.js, the `celco*` strips), each in its
  boss's shapes: the share ring's rim carries the Queen Bee's honeycomb and bees, the Myconid
  Queen's mushroom caps and spores, or Tuskar's stomping rocks, with a gold star pip over it per
  player standing in it; the guard is built of pieces laid round the boss (MacGoblin's red
  barn-door planks, Tuskar's flame bulwark, Gnarlroot's bark plates) that crack on a struck side
  and break apart; the Root Seal is a rune circle of roots with its stone, and its ribbon of light
  (and the twins' spore tether, fraying red) is a short piece chained along the curve.
- Online, the game running a boss sends its mechanics (`coop`, or `run`/`coop` in a shared
  dungeon run) a few times a second: the ring and who's in it, the seal and whether it's held, the
  guard and its struck sides, the twins, and any burst. Friends' games rebuild them on their copy
  of the boss (world/coopboss.js `coopShared` / `applyCoopShared`).
- Gnarlroot's Leaf Crown is a hat of its own (a twig circlet of oak and maple leaves, an acorn and
  a glowing green gem; render/jobgear/acc.js `leafcrown`), never sold.
- tools/coop-stage.html stages each of these for pictures and videos (modes board, queen, mac,
  gnarl, twins, spore, tuskar, gnarlhard; `ui=0` hides the HUD).
