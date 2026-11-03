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
