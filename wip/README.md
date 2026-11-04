# Unfinished work (paused 2026-11-04)

Two patches of half-done work from the quality pass's "own version per path" item (each second
job plays its first job's skills with its own moves and effects; docs/art/briefs/quality-pass.md
part B). They were stopped mid-way, so they are untested and may be incomplete. Both apply
cleanly to this branch as it stands:

    git apply wip/per-path-skills-warrior-archer.patch   # Paladin/Berserker, Trickster/Arbalist
    git apply wip/per-path-skills-dancers-witch.patch    # Blade/Sky Dancer, Idol/Astronomer

They were written separately, so each may add its own copy of the per-path override mechanism;
keep one when combining. Run `npm test` after applying. Delete this folder once they're used.

Not started yet: the map layout reworks and the area boss nests (part D, the player's picks).
