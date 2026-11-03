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
