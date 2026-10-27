# Research: archers (bows, crossbows, archer skill effects)

Two passes (EN / JA / KO / ZH / RU), made for the Ranger and Sniper paths. The first covers
animation craft: real archery form, shipped-game frame data read from the game files, and
crossbow and acrobatic shots. The second covers skill effects and game feel. Rules that fx.md and
anim.md already hold are not repeated. Items marked **[observed]** come from playing the games, with
no text source; check them against footage before leaning on them.

## A. Real form (what to simplify from)

1. **Five beats.** World Archery's technique sheet: stance (side-on), draw (the bow pushes at the
   target, the draw elbow pulls with the back), anchor (the draw hand under the chin, the string
   touching lips and nose), release (both arms "make sharp movements as the bowstring snaps
   back"), follow-through (the draw hand goes to the back of the head, the bow hand keeps pressing
   at the target, and the bow jumps forward in the sling).
   https://extranet.worldarchery.sport/documents/index.php/Media/Information_Sheets/003_Guide_to_Recurve_Technique.pdf
   **Tengu:** set, draw, anchor at the cheek, release, follow-through; the draw hand ends behind the
   head, and the bow arm stays straight.
2. **The draw hand goes back; the bow arm does not drop.** It slides back along the neck to the
   shoulder, at most about 3 cm, while the bow arm keeps reaching. A drop belongs in the settle,
   not in the release. https://kenosha.extension.wisc.edu/files/2011/05/Handbook.pdf ,
   https://www.bow-international.com/features/recurve-follow-through/
3. **Kyudo's finish (zanshin).** The arms open to about 180°, one straight line, and good archers
   go past it. https://tokorozawa.w.waseda.jp/kg/doc/20//sotsuron2011/1K08B213.pdf
   **Tengu:** on the loose, open the arms to a line. That spread is the silhouette that reads small.
4. **The bow springs back in about 0.03 s** (strain gauges on a Japanese bow, about 50 G at the
   release), then rings down. https://nagano-nct.repo.nii.ac.jp/record/14/files/44_1-1.pdf
   **Tengu:** the string snaps from drawn to straight in one frame, never eased, then wobbles for 2–3
   frames.
5. **Archer's paradox.** An arrow flexes sideways as it leaves the bow and wobbles straight.
   https://www.worldarchery.sport/news/146270/why-do-arrows-bend
   **Tengu:** a slight shiver on the arrow for its first frames of flight, on hero shots only.
6. **A vibrating string's blur is darkest at its two extremes**, where it moves slowest.
   https://www.phys-l.org/archives/2016/8_2016/msg00137.html
   **Tengu:** draw the string's wobble as two faint lines, one at each side.

## B. Shipped-game frame data

7. **MapleStory bow attack (shoot1):** 300 / 150 / 350 ms. The bow sprite is 16×50 straight and
   35×46 drawn, with the string pulled back about 19 px (about 40% of the body's height) and the limbs
   bent 4 px shorter. On the last frame the body keeps the drawn pose but the bow is already straight
   again: the release is the bow springing back while the body holds. Read from HeavenMS's
   Character.wz/00002000.img.xml and Weapon/01452002.img.xml.
   **Tengu:** the longest beat is the hold after the loose.
8. **MapleStory crossbow attack (shoot2):** 160 / 160 / 250 / 100 / 150 ms. The crossbow never bends.
   The hand goes forward 11 px (the squeeze), then **back 28 px in the longest frame** (cocking), then
   settles, and the weapon shifts 2 px on the last frame as a kick. Weapon/01462001.img.xml.
   **Tengu:** a crossbow is stiff, and the back hand's big pull back after the shot is the motion.
9. **Crossbows are slower than bows:** Double Shot takes 810 ms on a bow and 870 ms on a crossbow.
   https://meowdb.com/msclassic/guides/attack-speed-and-animation-times
   **Tengu:** crossbow moves run 7–10% longer to pay for the kick.
10. **MapleStory bowman skills (Skill.wz 310–322).**
    - Hurricane: a 15×70 ms wind-up, a 6×70 ms firing loop, a 4×70 ms wind-down.
    - Piercing Arrow: a 20×60 ms charge; its arrow is 115×47 px.
    - Strafe: the first arrow at 300 ms, then one every 100 ms.
    - Skill arrows are huge (Arrow Blow's is 91×39 px on a body about 31 px tall).
    **Tengu:** a volley takes one long first draw, then quick shots; skill arrows can be 1.5–3× the hero.
11. **MapleStory reuses poses.** Its somersault is 9 × 120 ms of attack poses with the whole body
    turned 0 → 180 → 270°. Its rapidfire is one 60 ms release pose, looped while the arrows stream
    out. https://raw.githubusercontent.com/ronancpl/HeavenMS/master/wz/Character.wz/00002000.img.xml
12. **Battle for Wesnoth bowman:** ready 65, draw 75 + 75, full draw 100, release 130 ms. The
    Elvish Marksman holds the release 150 ms: a higher rank lingers longer on the finish.
    https://raw.githubusercontent.com/wesnoth/wesnoth/master/data/core/units/elves/Marksman.cfg
13. **Wesnoth's bow notes.** The bow is tilted so one animation reads for several aims. The bow
    and the draw arm keep separating through the last frames. The nock is skipped on quick shots.
    https://wiki.wesnoth.org/Making_Bow_Animations
14. **Wesnoth Thunderer (musket):** aim 3 × 100, hold 200, kick 2 × 140, recover 3 × 100 ms.
    **Tengu:** the sniper template is a still hold (about a quarter), a two-frame kick, a slow return.
15. **Smash bows (60 fps).** Link's earliest release is frame 16 and full charge frame 52, with a
    fixed 28-frame recovery. Pit's aerial shot is about 7% shorter than the grounded one.
    https://ultimateframedata.com/link , https://ultimateframedata.com/pit
    **Tengu:** a charge stretches only the hold, and air versions run a little shorter.
16. **Terraria:** a normal bow shot takes 0.2–0.5 s. Phantom Phoenix fires two arrows and a big
    one every third shot. https://terraria.wiki.gg/wiki/Bows

## C. Crossbows and acrobatics

17. **A shouldered crossbow touches four points:** firing hand, aiming hand, cheek, shoulder.
    High kneeling (back knee down, front shin upright) is the steady stance.
    https://steambow.at/en/blogs/news/crossbow-academy-pt-7-what-shooting-positions-work-with-a-crossbow
18. **A crank reload is a big, readable action** (Chivalry's heavy crossbow: 5.2 s). Run it on the
    upper body only. https://chivalry.wiki.gg/wiki/Heavy_Crossbow
    **Tengu:** two or three circular hand loops with the nose down, on heavy moves only.
19. **Crossbows must be big and must kick.** Held still on the shot, one "would look very odd".
    https://babel.speldesign.uu.se/?p=844137
20. **Heavy shots shove the shooter back.** Monster Hunter's charge 3 Dragon Piercer pushes the
    hunter 3 body-lengths. https://www.hk01.com/article/153268
21. **Speed shooting (Lars Andersen):** 3 arrows in 0.6 s, with the spare arrows held fanned in the
    draw hand and only a half draw per shot.
    https://laughingsquid.com/archer-lars-anderson-fires-three-arrows-in-0-6-seconds-shoots-arrows-fired-at-him-out-of-the-air/
    **Tengu:** spare arrows fanned in the draw hand read as "volley" at once.
22. **Air shots need their own pose:** the torso tipped forward 20–30°, the bow arm down at about
    45°, the knees tucked, and a little pop up on the release (which also explains the hang).
    https://itch.io/post/11946680

## D. Skill effects and game feel

23. **MapleStory archer classes** (mechanics from https://maplestorywiki.net/w/Bow_Master/Skills ,
    https://maplestorywiki.net/w/Marksman/Skills , https://maplestorywiki.net/w/Wind_Archer/Skills ,
    https://maplestorywiki.net/w/Pathfinder/Skills ; how they look is [observed]).
    - Hurricane streams thin pale arrows while the pose holds.
    - Snipe always crits and marks what it hits. Piercing Arrow gets stronger with each monster it
      passes.
    - Blizzard hits one monster, then freezes the area around the hit (260–300 × 200 px; 840 ms on a
      crossbow, https://meowdb.com/msclassic/skills/sniper/blizzard ).
    - Pathfinder's Triple Impact leaps and fires three arrows down.
    - Wind Archer is mint and white, with wisps on curving paths.
24. **Genshin Ganyu (60 fps):** a tap releases on frame 15, a full charge on frame 103, and the hit
    lands about 10 frames after the release. Hit-stop is 0 on normal hits and +0.12 s on weak-spot
    hits. https://library.keqingmains.com/characters/cryo/ganyu
    **Tengu:** heavy stops only on crits and finishers.
25. **Charge shown by glow colour:** Monster Hunter bow levels go none → red → orange → white, with a
    flash at each threshold. https://monsterhunterrise.wiki.fextralife.com/Bow
26. **Rez locks targets one at a time**, each with a tone, then releases them all.
    https://en.wikipedia.org/wiki/Rez_(video_game)
    **Tengu:** sights pop on 60–90 ms apart, nearest first, with rising ticks.
27. **Red Dead's Dead Eye slows and dims the world while you paint targets.**
    https://reddeadredemption2.wiki.fextralife.com/Dead-Eye
    **Tengu:** dim the world about a third during a lock-on, so the rose sights are the brightest
    thing on screen.
28. **League of Legends missiles:** the dangerous front (the "area of focus") has the most contrast,
    saturation and sharpness, and the trail is secondary. Every spell gets an importance rating,
    because "if everything is important, nothing is important."
    https://realtimevfx.com/t/anatomy-of-a-league-of-legends-missile-part-1-creating-areas-of-focus/11614
29. **Enter the Gungeon** regretted player bullets that looked like enemy bullets.
    https://itch.io/post/7788186
    **Tengu:** hero shots are green or steel blue, and rose is kept for sights and crits.
30. **Sniper tracers** [observed]: one thin bright line that vanishes in 100–200 ms, shrinking from
    the muzzle end toward the hit (a tracer method:
    https://forum.babylonjs.com/t/ideas-for-a-bullet-trail-tracer-and-impact-effects/292 ).
31. **Charge must show in both the look and the sound** (Overwatch players' complaints about
    Widowmaker shots). The full state swaps to an icon, and the gauge flashes on every gain (FFXIV
    Bard). https://overwatch.fandom.com/wiki/Widowmaker , https://www.icy-veins.com/ffxiv/bard-guide
32. **Wind as ribbons and leaves.** Disney's wind spirit (in *Myth: A Frozen Tale*) is a ribbon on a
    hand-animated path with a pattern scrolling along it and leaves riding along; Venti's wind is
    feathers.
    https://media.disneyanimation.com/technology/publications/2020/siggraph_2020_MYTH_FX_talk.pdf
33. **Speed trails are streaks that turn into dots as they age; magic trails stay dots.** Emit them
    by distance travelled, not by frame. https://80.lv/articles/trail-impact-vfx-production
34. **CyberConnect2 (CEDEC+KYUSHU):** an effect is main, sub and accent layers started one after
    another, never together; four tones at most. Ice shows cracks first, then a flash at the instant
    it breaks. https://www.4gamer.net/games/999/G999905/20231201050/
35. **Ice shatter.** A tiny burst first; spikes break apart rather than shrink; lingering shards
    and mist; dark contrast mixed into the blue.
    https://realtimevfx.com/t/three-ice-pillars-unity/12906
36. **Projectile hit-stop is shorter than melee, and the shooter doesn't freeze** (Sakurai; Capcom
    and Dustloop: only the shot and the target stop). Weak hits 0–30 ms, strong 50–80 ms, crit or
    kill 100–150 ms. https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/ ,
    https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/
37. **Screen shake for heavy shots:** a camera kick back from the aim on each shot (Vlambeer), and
    shake as trauma squared. Plain arrows don't shake.
    https://gamedeveloper.com/programming/video-sprucing-up-cameras-with-math
38. **The target's reaction carries the weight** (a Korean study of 2D shooters: sound and the enemy
    reacting matter more than the bullet). A contracting ring is the standard "about to fire" sign
    (Nintendo). https://www.koreascience.or.kr/article/JAKO201017337332989.page?lang=en ,
    https://www.nintendo.co.jp/jobs/introduction/design/work04.html

## Not found

- DFO Ranger/Launcher, Elsword Rena, Dead Cells, Octopath and Kingdom Rush frame data (no text
  sources).
- The anime sniper pose.
- Saint11 / MortMort / AdamCYounis / Slynyrd bow lessons (video or Patreon only).
