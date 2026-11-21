# Builds the rest of the fight and movement sounds (assets/audio/rec/<name>.mp3, listed in src/audio/recorded.js)
# from the Sonniss GDC 2024 and 2026 bundles (royalty free inside the game; assets/audio/SOURCES.md),
# 2026-11-08: the weapon swings, thrusts, throwing stars and the skills that were still on the old
# free sample packs. Each is layers cut from the recordings (each pitched, its level set, delayed),
# mixed, faded and peak-normalised. The bows and crossbows keep their recordings (the bundles have
# none), and the tuned skill sounds keep their notes (recorded.js `music`). Movement (step 4): jumping,
# landing, climbing, mounts, furniture, the kettle, the cloud; footsteps keep theirs (the bundles have
# no footsteps). <name>1, <name>2... are takes.
# Usage: python tools/build-fight.py [name ...]   (SONNISS_ALL: the folder of packs)
import os, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FF = os.environ.get('FFMPEG', os.path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'))
SRC = os.environ.get('SONNISS_ALL', 'C:/Users/admin/Desktop/claudeo').rstrip('/') + '/'
OUT = os.path.join(ROOT, 'assets', 'audio', 'rec')

S = {
    'axehit': 'Justsoundeffects - Melee Weapons/WEAPAxe_Long Two-Handed Axe Flesh Hit_JSE_MW.wav',
    'scrapes': 'Justsoundeffects - Melee Weapons/WEAPSwrd_Weapon 03 Slow Scrapes_JSE_MW.wav',
    'blade': 'David Dumais Audio - Melee Weapons Sound Effects Pack 2/METLFric_SWING SCRAPE Swift Melee Weapon Swing With A Long Blade 14_DDUMAIS_MWP2.wav',
    'whip': 'David Dumais Audio - Melee Weapons Sound Effects Pack 2/WEAPWhip_WHIP Snap Crack 05_DDUMAIS_MWP2.wav',
    'airy': 'Rescopic Sound - Distinct Whooshes/WHSH_Airy-Whoosh Wind Gust 11_RSCPC_DW.wav',
    'deviant': 'Rescopic Sound - Distinct Whooshes/WHSH_Deviant-Whoosh Flabby Slow 09_RSCPC_DW.wav',
    'scifi': 'Rescopic Sound - Distinct Whooshes/WHSH_Pure SciFi-Whoosh Fast 03_RSCPC_DW.wav',
    'watery': 'Rescopic Sound - Distinct Whooshes/WHSH_Watery-Whoosh FIzzy Fast 03_RSCPC_DW.wav',
    'arcup': 'InMotionAudio - Arc/ELECArc_ArcPowerUpDesign04_InMotionAudio_Arc.wav',
    'powerup': 'Doex Studio - 90s Anime SFX Pack/Short_PowerUp_005.wav',
    'braam': 'Cinematic Sound Design - Ultra Transitions & Impacts/Transition Braam Slow Dark Creepy.wav',
    'firewhoosh': 'Epic Stock Media - Elemental Mutation Whooshes and Impacts/FIREWhsh_Whoosh Fire Deep Growl Monster Saturated Crisp 03_ESM_EMWI.wav',
    'flare': 'BluezoneCorp - Steampunk Weapon And Textures/Bluezone_BC0296_steampunk_weapon_flare_shot_explosion_003.wav',
    'arrow': 'Cinematic Sound Design - Cartoon Bloopers/Arrow Hit Rattle.wav',
    'body': '344 Audio - Cinematic Fight Vol. 1/FGHTImpt_4 x Punch, Body 02_344 Audio_Cinematic Fight Vol 1.wav',
    'file': 'Epic Stock Media - HD Game Materials/METLImpt_Metal Old File Impact Tap Against Tire Iron Metallic Hit 01_ESM_HDGM.wav',
    'liquid': '344 Audio - Elemental Palette Designed Vol. 1/WATRMisc_Water, Liquid Impact, Bubble, Sci Fi, Hit 04_344 Audio_Elemental Palette Designed Vol 1.wav',
    'windrush': '344 Audio - Elemental Palette Designed Vol. 1/WINDDsgn_Wind, Rush, Whoosh, Long x5 01_344 Audio_Elemental Palette Designed Vol 1.wav',
    'boom': 'Federico Soler - Effective Trailer Booms Vol. 2/EffectiveTrailer_Booms_Vol2_011.wav',
    'astonish': 'Alexander Kopeikin - Emotion and Magic/magic, energy flow, astonishment-001.wav',
    'light': 'Epic Stock Media - Fantasy Game 2 - Sound Kit for Enchanted Realms/MAGAngl_Magic Light Spell Enchantment Potion Effect Tonal Bright 03_ESM_FG2.wav',
    'bells': '344 Audio - Christmas Vol. 1/MAGMisc_Magic Christmas Bells 2_344 Audio_Christmas.wav',
    # Sakura Sprint's festival (2026-11-13): a deep round drum hit for the taiko, a small crowd
    # cheering and clapping, and a handbell pitched up into wind chimes.
    'taiko': 'BluezoneCorp - Modern Cinematic Impact/Bluezone_BC0294_modern_cinematic_impact_percussion_009.wav',
    'cheer': 'Sonik Sound Library - Spanish Crowds/CRWDCheer_Small Club, 50 People, Crowd, Spanish, Cheering and Applause-Surround_KSL_KS015.wav',
    'handbell': 'Mechanical Wave - Sound Effects Collection/BELLHand_Metallic Bell_ 22_MWSFX_SEC.wav',
    # Lily Lake's gala (2026-11-13): a clear held whistle for the lifeguard starter, and a lake
    # lapping gently at a dock.
    # Mortar Cliff's festival (2026-11-13): a wooden thump with a soft squelch for the mallet in the
    # mochi dough, and corn leaves rustling for the autumn breeze.
    'woodsq': 'Epic Stock Media - Tower Defense Game/WOODImpt_Hit Blood Spill Splat Wood Impact Light Hit Squelch Small Thump 03_ESM_TDG.wav',
    'cornleaf': 'InMotionAudio - Sound of the Corn/VEGELeaf_CornLeafMovements02_InMotionAudio_SoundoftheCorn.wav',
    'whistleh': 'SoundBits - Vox Hominis - Human Effort Voices/WHSTHmn_Whistle Male 06 09_SNDBTS_VH.wav',
    'lakelap': 'Epic Stock Media - Public Spaces - Storms Lakes Parks and Rural Nature Exteriors/WATRLap_Summer Tennessee Lake Dock Water Ripples Wake Wave Gentle 05 Distant_ESM_CPS.wav',
    'cloth24': 'InMotionAudio - Foley T-Shirt/FOLYClth_ClothMovement24_InMotionAudio_FoleyT-Shirt.wav',
    'cloth29': 'InMotionAudio - Foley T-Shirt/FOLYClth_ClothMovement29_InMotionAudio_FoleyT-Shirt.wav',
    'pats': 'InMotionAudio - Foley T-Shirt/FOLYClth_SinglePats04_InMotionAudio_FoleyT-Shirt.wav',
    'wooddrop': 'InMotionAudio - Wood/WOODImpt_Drops20_InMotionAudio_Wood.wav',
    'whistle': 'Pole Position - Steam Engine Model/Steam Engine Model - Engine - Whistle Short - CO-100k - Pitched Down 3 Octaves.wav',
    'steam': 'Justsoundeffects - Steampunk Gadgets/AIRBrst_Steam Release Short 03_JSE_SG_Mono.wav',
    'lid': 'Justsoundeffects - Water in Motion/WATRDrip_Dripping Water On Metal Pot Lid_JSE_WIM_Mono.wav',
    'wade': 'Justsoundeffects - Water in Motion/WATRMvmt_Soft Movement 01_JSE_WIM.wav',
    'bubbles': 'Cinematic Sound Design - Cartoon & Animation Vol 2/Cartoon Bubbles Short.wav',
    # The Tide Mage's water (2026-11-09).
    'wimpact': 'BluezoneCorp - Designed Water/Bluezone_BC0298_designed_water_impact_006.wav',
    'wtrans': 'BluezoneCorp - Designed Water/Bluezone_BC0298_designed_water_transition_impact_017.wav',
    'subimpact': 'InMotionAudio - Submerge/WATRImpt_Impact20_InMotionAudio_Submerge.wav',
    'drown': 'Epic Stock Media - Elemental Mutation Whooshes and Impacts/WATRImpt_Impact Water Deep Submerge Bubble Drown Ship Hit 05_ESM_EMWI.wav',
    'surf': 'Nick McMahan - Cascadia Shore Waves/WATRSurf_Ocean Hydrophone In Sand Large Near Single 01 _Cascadia Shore Waves.wav',
    'wflow': 'InMotionAudio - Submerge/WATRFlow_WaterFlow21_InMotionAudio_Submerge.wav',
    'wrock': 'InMotionAudio - Submerge/WATRMvmt_WaterRockMovement04_InMotionAudio_Submerge.wav',
    # The Tidecaller's moon (2026-11-09): bell shimmers, a twinkle, a bright chime and calm rain.
    'shimmer': 'Epic Stock Media - Strange Game Ambient Loops 3/MAGShim_Shimmer Loop Small Bell Metal Taps_ESM_SGA3.wav',
    # The Moon Moth's moths (2026-11-16): a soft jacket flutter for a wing beat, a book riffled
    # through for a burst of many wings, and an insect's wings for the swarm's hum.
    'harp': 'CB Sound Design - Dreamcatcher - The Sound of Dreams & Magic/Harp_Glissando_10b.wav',
    'confetti': 'Cinematic Sound Design - Hybrid Game & UI Elements/Cofetti Whoosh Pluck Spill.wav',
    'ropezip': 'Rogue Waves - Yacht & Marina/BOATMech_EXT Small yacht, rope moving through metal_RogueWaves_YachtMarina.wav',
    'carab': '344 Audio - Climbing Gear Foley Vol. 1/EQUISprt_Climbing Gear, Flicking Carabiner On Rope_344 Audio_Climbing Gear Foley Vol 1.wav',
    'strings': 'Eiravaein Works - 48Kilos/AcGtrFX,headstock,slowstroke,soft,strings,bright,airy,ringing,tonal,E.wav',
    'chirp': 'Jake Fielding - Sounds of Spain/BIRDSong_Bird, Nature, Isolated, Spain_Jake Fielding_Sounds of Spain.wav',
    'ignite': 'InspectorJ - Party Pack/Party-Pack_Match_Ignite_02-03.wav',
    'crackle': 'Ivo Vicic - Campfire - Bonfire FX/24 Campfire, Dropping Fresh Pine Branches in Fire, Crackling, Sizzling Strong, Close 02.wav',
    'ratchet': '344 Audio - Nuts And Bolts/Ratchet Clicking, Spin Once To Slow, Spin Twice To Slow, Spin Intermittent.wav',
    'plucks': 'Cinematic Sound Design - User Interface/Interface Plucks Happy.wav',
    'mmflut': 'Systematic-Sound - Sound Themes - Modern Cloth Foley 01/SFX CLOTH Foley Jacket Synthetic Soft Shell Whoosh Flutter.wav',
    'mmriffle': 'Sonic Bat - Turning The Page/SBttp_Regular Book Flip Through 001.wav',
    'mmwingfx': 'Red Libraries - Mutant Insects (FLYING)/RL_Mutant_Insects_Unknown_Wings Sweetner-E_Idle_03.wav',
    'twinkle': 'Cinematic Sound Design - User Interface/Button Arp Twinkle.wav',
    'brightup': 'Epic Stock Media - Anime Game/DSGNStngr_Power Up Bright Positive Successful Light Saturation Crash Shimmer 05_ESM_AG.wav',
    'rain': 'Bolt - Backyard Rain & Thunder - Suburban Rain Recordings/RAIN_Rain at Night Slow Crescendo Calm Suburban_BOLT_BackyardRain_UsiPro.wav',
    'astral': 'Alexander Kopeikin - Emotion and Magic/magic, energy flow, astral travel-015.wav',
    # The Thunderguard's storm (2026-11-09): arcs, crackle, buzz, an electric impact, a real thunderclap and roll.
    'zap': 'BluezoneCorp - High Voltage/Bluezone_BC0299_electricity_surge_discharge_electrical_arc_crackling_002_01.wav',
    'sizzle': 'BluezoneCorp - High Voltage/Bluezone_BC0299_electricity_texture_sizzling_crackling_006.wav',
    'arcds': 'InMotionAudio - Arc/ELECArc_ArcDesign15_InMotionAudio_Arc.wav',
    'buzz': 'InMotionAudio - Arc/ELECBuzz_Buzz27_InMotionAudio_Arc.wav',
    'elecimpact': 'Epic Stock Media - Elemental Mutation Whooshes and Impacts/ELECMisc_Impact Electric Tonal Deep Movement Motion Hiss Glitch 01_ESM_EMWI.wav',
    'thunder': 'Epic Stock Media - Public Spaces - Storms Lakes Parks and Rural Nature Exteriors/STORM_Texas Rain Thunder Initial Crash Boom Storm 01 Clap Lightning_ESM_CPS.wav',
    'rumble': 'Jake Fielding - Interior Wind Rain and Storms/THUN_Interior Thunder Rumble_JF_INT Storm_01.wav',
    # Long Hill Run's sweets (2026-11-13): a kawaii pop, a bright interface pop, a kalimba running
    # up, a single music box note, and a patter of cartoon pops.
    'kpop': 'Rogue Waves - Kawaii UI/TOONPop_Syringe Pop 4_RogueWaves_KawaiiUI.wav',
    'ipop': 'Cinematic Sound Design - Interface & Infographics/Interface Pop High Short.wav',
    'kalimba': 'CB_Sounddesign - Applicable Sounds - Organic UI and Building Games SFX/UIMisc_Kalimba 3 Up_CB Sounddesign_APPlicable Sounds.wav',
    'mbox': 'Sonic Bat - Music Boxes/SBmb_Music Box A 013.wav',
    'cpops': 'Cinematic Sound Design - Cartoon Impacts/Cartoon Pops Random Sequence Reverb.wav',
    # The Grand Mochi Course's festival (2026-11-13): fireworks near (a launch thump, then the big
    # boom and its crackle) and far off over the hills.
    'fwnear': 'Ivo Vicic - Fireworks FX/13 Fireworks_powerful explosions_multiples in a row_near.wav',
    'fwdist': 'Sonic Bat - Fireworks Ambience/SBfa_Distant Fireworks 005.wav',
    # The Mochi Grand Tour's kingdom (2026-11-13): a big brass horn for the fanfares, a second
    # horn, a heavy wooden gate creaking open, a gate's chain rattling, and a spear butt grounded
    # on stone.
    'hornbig': 'Jake Fielding - Cinematic Horn Braams/DSGNBram____Cinematic Horn Braam, Epic, Cinematic, Dark, Instrument, Huge-67.wav',
    'horn2': 'Mechanical Wave - Cinematic Feel/DSGNBram_Cinematic Horn_MWSFX_CF 05.wav',
    'gatecreak': 'Jake Fielding - Squeaky Gates/DOORGate_Wooden Metal Hinge Creaks_Jake Fielding_Squeaky Gates.wav',
    'chainrat': 'Jake Fielding - Squeaky Gates/DOORGate_Metal Gate Spring Latch Mechanism, Screech_Jake Fielding_Squeaky Gates_01.wav',
    'spear': '344 Audio - Historical Weapons Vol. 2/WEAPBlnt_Spear And Stick Impact, Wooden MKH 2_344 Audio_Medieval Weapons Vol 2.wav',
    # Tanabata Hurdles (2026-11-16): a cartoon dizzy for a Mochi seeing stars after a fall.
    'dizzy': 'Cinematic Sound Design - Cartoon Bloopers/Cartoon Confused Dizzy.wav',
    # Mochitsuki Mountain (2026-11-16): a bell struck in a church tower (pitched down, a temple
    # bell), a big gong, stone struck and a rock fall for the boulders, skis in soft snow for the
    # snowball, a wooden door's creak for the rice cart.
    'tbell': 'Ivo Vicic - Church Bells/04 Church Bells, Near Distance, In Church Tower-3 Different Bell 02.wav',
    'gong': 'Orbital Emitter - Cinematic Transitions for Editors Volume 2/80,TheGong.wav',
    'stone': 'BluezoneCorp - Stone Impact/Bluezone_BC0297_stone_impact_015.wav',
    'stone2': 'BluezoneCorp - Stone Impact/Bluezone_BC0297_stone_impact_041.wav',
    'rockfall': 'BluezoneCorp - Alien Tripod/Bluezone_BC0292_alien_tripod_debris_rock_collapse_earthquake_rumble_large_005.wav',
    'ski': 'Wavemotion - Ski Ride/SPRTWntr-EXT_Skiing On Soft Snow 01_WM_SKIRIDE.wav',
    'doorcreak': 'Rogue Waves - Creaking Door/DOORCreak_Wooden Door, Opening and Closing 09_RogueWaves_CreakingDoor.wav',
    # The bigger library (2026-11-16, the 2020 and 2023 bundles): real footsteps at last - dry grass,
    # a wooden floor, light snow, a soft paw - cute menu sounds, bells and ice.
    'grass14': 'PMSFX - STEPS Dry Grass & Shrubs/PM_SDGS_14 Footstep Step Dry Grass Shrubs Pine Needles Meadow .wav',
    'grass113': 'PMSFX - STEPS Dry Grass & Shrubs/PM_SDGS_113 Footstep Step Dry Grass Shrubs Pine Needles Meadow .wav',
    'grass186': 'PMSFX - STEPS Dry Grass & Shrubs/PM_SDGS_186 Footstep Step Dry Grass Shrubs Pine Needles Meadow .wav',
    'grassryk': 'RYK-Sounds - Footstep/grass 3 single step 3.wav',
    'woodfloor': 'RYK-Sounds - Footstep/wooden floor 1 loop.wav',
    'snowlight': 'Bluezone - Snow Footsteps/Bluezone_BC0264_snow_footsteps_walk_light_008.wav',
    'snowstep': 'RYK-Sounds - Footstep/snow 7 single step 2.wav',
    'paws': 'TheWorkRoom Audio Post - Animal Footsteps Foley - Paws Without Claws/ANF024.wav',
    'plop': 'SmartSoundFX - Cartoon & Infotainment/PLOP Mouth Drip Dry.wav',
    'boing': 'SmartSoundFX - Cartoon & Infotainment/BOING Bowl.wav',
    'balafon': 'Scoba Sounds – Scoba Ui Essentials/BALAFON - NOTIF OCT UP.wav',
    'uierror': 'Scoba Sounds – Scoba Ui Essentials/ERROR 13.wav',
    'farbells': 'Ivo Vicic - Church Bells/25 Church Bells, Far Distance, Rural Soundscape Distant, Hills Ridge, Spring 02.wav',
    'bellmen': 'Ivo Vicic - Bellmen - Folk Custom/22 BELLMEN_Kukuljanski Bell ringers.wav',
    'icecrack': 'BluezoneCorp - Ice Cracking/Bluezone_BC0278_ice_crack_break_078.wav',
    'icecracks': 'BluezoneCorp - Ice Cracking/Bluezone_BC0278_ice_crack_break_002.wav',
    'iceimpact': 'David Dumais Audio - Ice & Frost Magic 1/Magic_Spells_Impact_Ice13.wav',
    # Your island (2026-11-21): its farm's hens, sheep and cow (the library has no cow, so hers is a
    # farm pig's soft groan pitched down into a low moo), the zip line's pulley, planting, building;
    # Pastel Harbor's clock tower bells.
    'chicks': 'Mechanical Wave - Farm Animals/BIRDFowl_Chick Squawks-02_MWSFX_FA.wav',
    'sheep': '344 Audio- UK Canals, Parks & Forests/Sheeps & Lamps.wav',
    'piggroan': 'Articulated Sounds - Pig Farm Animal Groan/ANIMAL FARM Pig Groan 03, Martvili Georgia.wav',
    'gondola': 'Rzpost - The Gondola Lift/Gondola,Snowboard,Ski,Lyft,Style,Small,Size,Mechanism,Pulley,Passing,By_V2.wav',
    'towerbells': 'Ivo Vicic - Church Bells/04 Church Bells, Near Distance, In Church Tower-3 Different Bell 02.wav',
    'dig': 'TheWorkRoom Audio Post - Digging/DIG043.wav',
    'hammer': 'The Sound Pack Tree - Construction & Tools/176403 - Nail Hammering 03.wav',
    'magiccreate': 'CB_Sounddesign - Applicable Sounds - Organic UI and Building Games SFX/GAMEMisc_Magic Creation 23_CB Sounddesign_APPlicable Sounds.wav',
}

# name: [(source, start s, length s, pitch x, gain dB, delay ms), ...]
B = {
    # The Tide Mage (2026-11-09): a whip of water cracking, waves sent rolling and crashing down,
    # bubbles, splashes, a geyser, a whirlpool, a waterfall, her hits, and the swish of her staff.
    'tmswish': [('watery', 0.0, 0.34, 1.15, 0, 0), ('airy', 0.6, 0.25, 1.4, -10, 0)],
    'tmlash': [('whip', 0.0, 0.32, 1.05, -3, 0), ('watery', 0.0, 0.36, 1.2, -2, 0), ('subimpact', 0.08, 0.36, 1.35, -9, 50)],
    'tmwave': [('wtrans', 1.75, 0.8, 1.2, 0, 0), ('watery', 0.0, 0.4, 0.95, -6, 0)],
    'tmwavebig': [('wtrans', 1.6, 1.3, 0.92, 0, 0), ('drown', 0.0, 0.8, 0.8, -5, 140), ('surf', 16.9, 1.2, 1.0, -6, 100)],
    'tmbubble': [('bubbles', 0.0, 0.4, 1.15, 0, 0), ('liquid', 0.0, 0.25, 1.7, -9, 0)],
    'tmsplash': [('wimpact', 0.05, 0.55, 1.05, 0, 0), ('subimpact', 0.1, 0.45, 1.0, -4, 30)],
    'tmsplashbig': [('wimpact', 0.05, 0.8, 0.85, 0, 0), ('drown', 0.0, 0.6, 0.9, -4, 40), ('subimpact', 0.1, 0.5, 0.8, -4, 60)],
    'tmgeyser': [('wflow', 9.6, 1.0, 1.25, -2, 0), ('wimpact', 0.05, 0.6, 0.85, -2, 60)],
    'tmwhirl': [('wrock', 0.0, 1.0, 1.0, -2, 0), ('watery', 0.0, 0.5, 0.8, -4, 100)],
    'tmfall': [('wflow', 3.5, 0.7, 1.05, -2, 0), ('wimpact', 0.05, 0.5, 0.95, -3, 180)],
    'tmfallbig': [('wflow', 3.5, 0.9, 0.9, -1, 0), ('wimpact', 0.05, 0.7, 0.8, -2, 200), ('drown', 0.0, 0.5, 0.9, -6, 240)],
    'tmhit': [('liquid', 0.0, 0.32, 1.2, 0, 0), ('subimpact', 0.1, 0.28, 1.45, -6, 0)],
    # The Stormwall (2026-11-09): the storm pitched down and heavy, rain under it, thunder rolling
    # off every big blow; weight in every hit.
    'bwhit': [('axehit', 0.0, 0.3, 0.8, 0, 0), ('zap', 1.05, 0.2, 0.9, -8, 0)],
    'bwrain': [('rain', 200.0, 0.9, 1.0, 0, 0), ('rumble', 6.3, 0.6, 1.2, -8, 0)],
    'bwplate': [('elecimpact', 0.0, 0.35, 0.8, 0, 0), ('body', 0.0, 0.25, 0.8, -4, 0)],
    'bwfield': [('buzz', 1.0, 0.6, 0.8, -2, 0), ('arcds', 0.0, 0.4, 0.7, -6, 0)],
    'bwcage': [('arcup', 0.0, 0.6, 0.8, 0, 0), ('zap', 1.05, 0.4, 0.85, -4, 80)],
    'bwwall': [('thunder', 3.15, 0.9, 0.85, 0, 0), ('rain', 200.0, 0.7, 1.0, -6, 100)],
    'bwboltdown': [('thunder', 3.15, 1.0, 0.85, 0, 0), ('zap', 1.05, 0.3, 0.8, -4, 0)],
    'bwroll': [('rumble', 6.2, 1.0, 0.95, 0, 0), ('boom', 0.0, 0.6, 0.85, -4, 0)],
    'bwspout': [('arcup', 0.0, 0.6, 0.9, -2, 0), ('rain', 200.0, 0.5, 1.1, -8, 0)],
    'bwovercastfx': [('rumble', 6.0, 1.4, 0.9, -2, 0), ('rain', 230.0, 1.4, 1.0, -4, 200)],
    'bwcagebig': [('arcup', 0.0, 0.9, 0.7, 0, 0), ('thunder', 3.15, 0.9, 0.9, -4, 60)],
    'bwwallbig': [('thunder', 3.15, 1.1, 0.8, 0, 0), ('rain', 200.0, 1.0, 1.0, -4, 100)],
    'bwfieldbig': [('buzz', 1.0, 0.9, 0.7, 0, 0), ('arcds', 0.0, 0.6, 0.6, -4, 0)],
    'bwsquallfx': [('airy', 0.0, 1.0, 0.7, -2, 0), ('rain', 200.0, 1.0, 1.0, -6, 0), ('buzz', 1.0, 0.8, 0.8, -10, 0)],
    'bwstormcloud': [('rumble', 6.0, 1.6, 0.85, 0, 0), ('buzz', 3.0, 1.0, 0.7, -10, 0)],
    'bwclapbig': [('thunder', 3.15, 1.6, 0.75, 0, 0), ('boom', 0.0, 1.0, 0.8, -2, 0), ('rumble', 6.2, 1.4, 0.9, -6, 200)],
    'bwboltbig': [('thunder', 3.15, 1.6, 0.7, 0, 0), ('elecimpact', 0.0, 0.6, 0.7, -2, 0), ('braam', 0.0, 1.6, 0.9, -8, 0), ('rumble', 6.2, 1.8, 0.85, -4, 300)],
    'bwguardshell': [('sizzle', 0.0, 1.2, 0.8, -2, 0), ('elecimpact', 0.0, 0.4, 0.7, -6, 0)],
    'bwwave': [('arcds', 0.0, 0.9, 0.7, 0, 0), ('rain', 200.0, 0.6, 1.0, -6, 0)],
    'bweye': [('rumble', 6.2, 1.2, 0.9, 0, 0), ('arcup', 0.0, 0.8, 0.8, -4, 200)],
    # The Tempest (2026-11-09): the storm's sounds pitched up and cut short, fast whooshes; quicker
    # and sharper than the Thunderguard's, his finishers still crack thunder.
    'tphit': [('zap', 1.05, 0.16, 1.6, 0, 0), ('blade', 0.0, 0.18, 1.4, -6, 0)],
    'tpline': [('zap', 2.15, 0.25, 1.6, -2, 0), ('scifi', 0.0, 0.25, 1.4, -6, 0)],
    'tpflashstep': [('arcds', 0.0, 0.35, 1.5, 0, 0), ('scifi', 0.0, 0.3, 1.6, -4, 0)],
    'tpwhirlfx': [('airy', 0.0, 0.5, 1.5, -2, 0), ('sizzle', 0.4, 0.4, 1.3, -6, 0)],
    'tpfloor': [('sizzle', 0.2, 0.4, 1.3, -2, 0), ('zap', 2.15, 0.2, 1.4, -6, 40)],
    'tpbolt': [('thunder', 3.15, 0.8, 1.15, 0, 0), ('zap', 1.05, 0.25, 1.3, -4, 0)],
    'tpwave': [('arcds', 0.0, 0.5, 1.2, 0, 0), ('airy', 0.0, 0.4, 1.4, -6, 0)],
    'tpcuts': [('blade', 0.0, 0.25, 1.6, -2, 0), ('blade', 0.0, 0.25, 1.4, -4, 140), ('blade', 0.0, 0.25, 1.7, -4, 280), ('blade', 0.0, 0.25, 1.5, -4, 420), ('zap', 1.05, 0.6, 1.4, -6, 0)],
    'tprush': [('arcds', 0.0, 0.45, 1.3, 0, 0), ('scifi', 0.0, 0.4, 1.3, -4, 0), ('zap', 2.1, 0.3, 1.5, -6, 80)],
    'tpflashburst': [('arcup', 0.0, 0.45, 1.6, -2, 0), ('zap', 1.05, 0.2, 1.6, -6, 0)],
    'tpclapbig': [('thunder', 3.15, 1.2, 1.05, 0, 0), ('boom', 0.0, 0.7, 1.15, -4, 0), ('zap', 1.05, 0.3, 1.4, -6, 0)],
    'tpboltbig': [('thunder', 3.15, 1.4, 0.95, 0, 0), ('elecimpact', 0.0, 0.5, 1.0, -2, 0), ('rumble', 6.2, 1.4, 1.1, -6, 250)],
    'tpguardshell': [('sizzle', 0.0, 1.0, 1.3, -2, 0), ('airy', 0.0, 0.5, 1.5, -6, 0)],
    'tpstormcloud': [('rumble', 6.0, 1.4, 1.15, 0, 0), ('buzz', 3.0, 0.8, 1.1, -10, 0)],
    'tplightspeed': [('arcup', 0.0, 0.7, 1.4, 0, 0), ('scifi', 0.0, 0.4, 1.2, -4, 200)],
    # The Thunderguard (2026-11-09): every blow crackles, the finishers crack thunder.
    'tghit': [('zap', 1.05, 0.22, 1.3, 0, 0), ('body', 0.0, 0.2, 1.2, -6, 0)],
    'tgspark': [('zap', 2.15, 0.18, 1.5, -2, 0)],
    'tgchain': [('arcds', 0.0, 0.3, 1.2, 0, 0), ('zap', 1.05, 0.2, 1.6, -6, 0)],
    'tgdart': [('zap', 1.05, 0.3, 1.4, -2, 0), ('scifi', 0.0, 0.3, 1.2, -8, 0)],
    'tgburst': [('elecimpact', 0.0, 0.4, 1.2, 0, 0), ('sizzle', 0.3, 0.3, 1.0, -8, 40)],
    'tgfloor': [('sizzle', 0.2, 0.6, 1.0, -2, 0), ('zap', 2.15, 0.25, 1.1, -6, 60)],
    'tgring': [('zap', 1.0, 0.4, 1.0, -2, 0), ('airy', 0.0, 0.4, 1.2, -8, 0)],
    'tgbeam': [('arcds', 0.0, 0.6, 0.9, 0, 0), ('elecimpact', 0.0, 0.35, 1.1, -4, 30)],
    'tgcolumn': [('arcup', 0.0, 0.6, 1.2, -2, 0), ('zap', 2.15, 0.3, 1.1, -6, 80)],
    'tgbolt': [('thunder', 3.15, 1.0, 1.0, 0, 0), ('zap', 1.05, 0.3, 1.0, -4, 0), ('boom', 0.0, 0.6, 1.2, -8, 0)],
    'tgclap': [('thunder', 3.15, 1.2, 0.9, 0, 0), ('boom', 0.0, 0.8, 1.0, -4, 0), ('sizzle', 0.3, 0.4, 1.0, -10, 100)],
    'tgflash': [('zap', 1.05, 0.35, 1.3, 0, 0), ('scifi', 0.0, 0.35, 1.0, -6, 0)],
    'tgrush': [('arcds', 0.0, 0.6, 1.0, 0, 0), ('zap', 2.1, 0.4, 1.2, -4, 60), ('airy', 0.0, 0.5, 1.1, -8, 0)],
    'tgcyclone': [('buzz', 1.0, 1.2, 1.0, -2, 0), ('sizzle', 0.5, 1.0, 1.0, -6, 0), ('airy', 0.0, 0.8, 0.9, -8, 0)],
    'tgrodfx': [('arcup', 0.0, 0.8, 1.0, 0, 0), ('buzz', 2.0, 0.6, 1.2, -8, 0)],
    'tgclapbig': [('thunder', 3.15, 1.6, 0.85, 0, 0), ('boom', 0.0, 1.0, 0.9, -2, 0), ('rumble', 6.2, 1.4, 1.0, -6, 200)],
    'tgboltbig': [('thunder', 3.15, 1.6, 0.8, 0, 0), ('elecimpact', 0.0, 0.6, 0.8, -2, 0), ('braam', 0.0, 1.6, 1.0, -8, 0), ('rumble', 6.2, 1.8, 0.9, -4, 300)],
    'tgguardshell': [('sizzle', 0.0, 1.2, 1.0, -2, 0), ('arcup', 0.0, 0.6, 1.2, -6, 0)],
    'tgstormcloud': [('rumble', 6.0, 1.6, 1.0, 0, 0), ('buzz', 3.0, 1.0, 0.8, -10, 0)],
    'tgwave': [('arcds', 0.0, 0.8, 0.85, 0, 0), ('airy', 0.0, 0.6, 1.0, -6, 0)],
    'tgovercharge': [('arcup', 0.0, 0.9, 1.1, 0, 0), ('zap', 1.05, 0.4, 1.0, -4, 300)],
    # The Tidecaller (2026-11-09): the moon's tide, lighter and brighter than the Tide Mage's water:
    # pearls and crescents, bells and twinkles over the splashes, a calm rain, the moon's chime.
    'tcpearl': [('watery', 0.0, 0.3, 1.3, -2, 0), ('twinkle', 0.0, 0.35, 1.4, -10, 0)],
    'tchit': [('liquid', 0.0, 0.3, 1.35, 0, 0), ('shimmer', 2.0, 0.3, 1.2, -10, 0)],
    # The Eclipse (2026-11-16): blade hits with a twinkle, a dark braam and a bell as the eye
    # opens, fire for her corona, the moths darkened, a gong and the braam for Total Eclipse.
    'echit': [('blade', 0.0, 0.22, 0.85, 0, 0), ('twinkle', 0.0, 0.3, 0.9, -12, 20)],
    'eceyeopen': [('braam', 0.0, 0.9, 1.25, -2, 0), ('tbell', 1.6, 0.9, 0.9, -6, 60)],
    'ecring': [('firewhoosh', 0.2, 0.8, 1.1, 0, 0), ('shimmer', 2.0, 0.6, 1.1, -10, 40)],
    'ecringbig': [('firewhoosh', 0.2, 1.1, 0.9, 0, 0), ('flare', 0.0, 0.6, 0.9, -4, 40), ('shimmer', 8.0, 0.8, 1.0, -9, 80)],
    'ecportal': [('braam', 0.0, 0.6, 1.5, -3, 0), ('mmriffle', 0.16, 0.4, 0.8, -8, 60)],
    'ecedge': [('blade', 0.0, 0.32, 0.7, 0, 0), ('boom', 0.0, 0.6, 1.2, -4, 30), ('tbell', 15.24, 0.8, 1.1, -8, 60)],
    'ecpop': [('flare', 0.0, 0.5, 1.2, -1, 0), ('twinkle', 0.0, 0.4, 1.3, -10, 30)],
    'eccloud': [('mmriffle', 0.16, 0.6, 1.0, 0, 0), ('braam', 0.0, 0.6, 1.6, -8, 0)],
    'ecflurry': [('mmriffle', 0.16, 0.8, 0.95, -1, 0), ('blade', 0.0, 0.25, 0.9, -6, 380)],
    'ecswarm': [('mmwingfx', 1.0, 1.2, 0.85, -3, 0), ('mmriffle', 0.16, 1.0, 0.8, -2, 0)],
    'eceye': [('twinkle', 0.0, 0.5, 0.8, 0, 0), ('airy', 0.0, 0.35, 1.4, -8, 0)],
    'ecnewmoon': [('braam', 0.0, 1.6, 0.9, -2, 0), ('farbells', 10.5, 1.4, 0.8, -8, 200)],
    'ecpour': [('mmwingfx', 2.0, 1.5, 0.75, 0, 0), ('mmriffle', 0.16, 1.1, 0.7, -2, 50), ('boom', 0.0, 0.8, 0.9, -6, 300)],
    'ectotal': [('braam', 0.0, 2.0, 0.8, 0, 0), ('gong', 0.08, 2.2, 0.75, -6, 400), ('astral', 0.0, 2.0, 0.9, -10, 200)],
    'ecdiamond': [('flare', 0.0, 0.6, 0.85, 0, 0), ('boom', 0.0, 1.0, 0.9, -3, 20), ('brightup', 0.0, 1.0, 1.2, -8, 0)],
    # The Moon Moth's second four (2026-11-16): wings settling with a harp run for her veil, a quick
    # flutter as a blow misses, a breath and a spill of glitter for the dust, a little tap and a glow
    # for the lantern and a pop of wings, a cloth flick for the feint. The Eclipse's, a shade lower.
    'mmveil': [('mmriffle', 0.16, 0.7, 1.15, -2, 0), ('harp', 0.0, 1.1, 1.25, -7, 60), ('shimmer', 2.0, 0.6, 1.1, -12, 120)],
    'mmdodge': [('mmriffle', 0.16, 0.32, 1.45, -1, 0), ('airy', 0.0, 0.25, 1.6, -7, 0), ('twinkle', 0.0, 0.25, 1.5, -14, 30)],
    'mmdazzle': [('airy', 0.0, 0.45, 1.0, -3, 0), ('confetti', 0.05, 0.9, 1.15, -2, 60), ('twinkle', 0.0, 0.5, 1.25, -9, 140)],
    'mmlure': [('wooddrop', 0.0, 0.25, 1.4, -8, 0), ('light', 0.0, 0.9, 1.15, -3, 40)],
    'mmlurepop': [('flare', 0.0, 0.45, 1.5, -5, 0), ('mmriffle', 0.16, 0.7, 1.05, -1, 20), ('twinkle', 0.0, 0.45, 1.05, -8, 60)],
    'mmfeint': [('mmflut', 0.19, 0.45, 1.3, -1, 0), ('mmriffle', 0.16, 0.55, 1.25, -4, 80), ('twinkle', 0.0, 0.3, 1.6, -12, 120)],
    'ecveil': [('mmriffle', 0.16, 0.7, 0.977, -2, 0), ('harp', 0.0, 1.1, 1.062, -7, 60), ('shimmer', 2.0, 0.6, 0.935, -12, 120)],
    'ecdodge': [('mmriffle', 0.16, 0.32, 1.232, -1, 0), ('airy', 0.0, 0.25, 1.36, -7, 0), ('twinkle', 0.0, 0.25, 1.275, -14, 30)],
    'ecdazzle': [('airy', 0.0, 0.45, 0.85, -3, 0), ('confetti', 0.05, 0.9, 0.977, -2, 60), ('twinkle', 0.0, 0.5, 1.062, -9, 140)],
    'eclure': [('wooddrop', 0.0, 0.25, 1.19, -8, 0), ('light', 0.0, 0.9, 0.977, -3, 40)],
    'eclurepop': [('flare', 0.0, 0.45, 1.275, -5, 0), ('mmriffle', 0.16, 0.7, 0.892, -1, 20), ('twinkle', 0.0, 0.45, 0.892, -8, 60)],
    'ecfeint': [('mmflut', 0.19, 0.45, 1.105, -1, 0), ('mmriffle', 0.16, 0.55, 1.062, -4, 80), ('twinkle', 0.0, 0.3, 1.36, -12, 120)],
    # The Silkweaver (2026-11-16): a thread plucked and snapped for her mark, a quick wind of cloth and
    # a harp run as a cocoon wraps, rope running through a ring for her zip, swing and haul, a
    # carabiner's flick for a tug, a confetti spill as a cocoon bursts, a slow harp for her moon;
    # her pearl moths (brighter, no insect wings).
    'svhit': [('strings', 0.07, 0.25, 1.6, -6, 0), ('carab', 3.16, 0.18, 1.4, -3, 0), ('twinkle', 0.0, 0.25, 1.2, -14, 20)],
    'svwrapup': [('mmflut', 3.07, 0.4, 1.4, -2, 0), ('harp', 0.0, 0.6, 1.5, -8, 40)],
    'svpop': [('confetti', 0.05, 0.6, 1.3, -2, 0), ('mmriffle', 0.16, 0.5, 1.2, -6, 40), ('strings', 0.07, 0.4, 1.8, -12, 0)],
    'svknot': [('carab', 4.61, 0.3, 1.2, 0, 0), ('strings', 0.07, 0.5, 1.25, -6, 60)],
    'svlash': [('whip', 0.0, 0.3, 1.5, -6, 0), ('carab', 0.04, 0.25, 1.4, -4, 0)],
    'svzipline': [('ropezip', 2.42, 0.45, 1.4, 0, 0), ('twinkle', 0.0, 0.3, 1.3, -12, 100)],
    'svswing': [('ropezip', 0.28, 0.6, 1.2, -2, 0), ('airy', 0.0, 0.45, 1.1, -6, 60)],
    'svwhirl': [('mmflut', 0.19, 0.6, 1.1, 0, 0), ('strings', 0.07, 0.5, 1.4, -8, 100), ('airy', 0.0, 0.5, 1.2, -8, 0)],
    'svreel': [('ropezip', 14.1, 0.4, 1.0, 0, 0), ('carab', 3.16, 0.3, 1.0, -4, 300)],
    'svmoon': [('harp', 0.0, 1.6, 0.9, -2, 0), ('farbells', 10.5, 1.4, 1.0, -8, 300)],
    'svburst': [('confetti', 0.05, 0.9, 1.0, 0, 0), ('boom', 0.0, 0.8, 1.2, -6, 0), ('harp', 0.0, 0.8, 1.4, -8, 60)],
    'svthread': [('strings', 0.07, 0.3, 1.8, -4, 0), ('airy', 0.0, 0.3, 1.6, -8, 0)],
    'svswarm': [('mmriffle', 0.16, 1.0, 1.0, -1, 0), ('harp', 0.0, 0.8, 1.6, -10, 80)],
    'svcloud': [('mmriffle', 0.16, 0.6, 1.35, 0, 0), ('mmflut', 3.07, 0.5, 1.3, -4, 0), ('shimmer', 2.0, 0.5, 1.2, -12, 0)],
    'svflurry': [('mmriffle', 0.16, 0.8, 1.2, -1, 0), ('strings', 0.07, 0.4, 1.5, -10, 380)],
    'svflutter': [('mmflut', 0.19, 0.32, 1.45, 0, 0), ('airy', 0.0, 0.28, 1.6, -8, 0)],
    'svpearlmoon': [('light', 0.0, 1.4, 0.9, -2, 0), ('harp', 0.0, 1.2, 1.0, -8, 100), ('shimmer', 16.0, 1.4, 1.0, -6, 0)],
    'svpour': [('mmriffle', 0.16, 1.1, 0.9, 0, 0), ('harp', 0.0, 1.0, 1.1, -6, 50), ('mmflut', 5.66, 0.9, 0.9, -3, 150)],
    'svveil': [('mmriffle', 0.16, 0.7, 1.25, -2, 0), ('harp', 0.0, 1.1, 1.4, -7, 60), ('shimmer', 2.0, 0.6, 1.2, -12, 120)],
    'svdodge': [('mmriffle', 0.16, 0.32, 1.55, -1, 0), ('strings', 0.07, 0.25, 1.9, -10, 0)],
    'svdazzle': [('airy', 0.0, 0.45, 1.1, -3, 0), ('confetti', 0.05, 0.9, 1.25, -2, 60), ('twinkle', 0.0, 0.5, 1.35, -9, 140)],
    'svlure': [('wooddrop', 0.0, 0.25, 1.5, -8, 0), ('light', 0.0, 0.9, 1.25, -3, 40)],
    'svlurepop': [('confetti', 0.05, 0.5, 1.3, -4, 0), ('mmriffle', 0.16, 0.7, 1.15, -1, 20), ('twinkle', 0.0, 0.45, 1.15, -8, 60)],
    'svfeint': [('mmflut', 0.19, 0.45, 1.4, -1, 0), ('carab', 0.93, 0.2, 1.4, -6, 60), ('twinkle', 0.0, 0.3, 1.7, -12, 120)],
    # The Sunfeather (2026-11-16): her light arrows land with a rattle and a twinkle, sunbirds chirp
    # (single chirps cut from an isolated birdsong), a bright rising tone gathers on her bow, a flare and
    # a light spell for the beam, a breath of air for arrows loosed up, bells and a harp in the golden
    # light, a long bright rise for her sun.
    'sfhit': [('arrow', 0.0, 0.25, 1.2, -6, 0), ('twinkle', 0.0, 0.25, 1.4, -8, 10)],
    'sfhitbig': [('arrow', 0.0, 0.3, 0.9, -2, 0), ('brightup', 0.0, 0.5, 1.3, -8, 20), ('twinkle', 0.0, 0.3, 1.1, -10, 40)],
    'sfbird': [('chirp', 28.53, 0.12, 1.1, -2, 0), ('chirp', 28.83, 0.12, 1.15, -4, 140), ('chirp', 31.76, 0.12, 1.2, -6, 300)],
    'sfchirp': [('chirp', 35.36, 0.12, 1.1, -2, 0), ('airy', 0.0, 0.3, 1.4, -10, 0)],
    'sfcharge': [('brightup', 0.0, 0.6, 0.8, -6, 0), ('shimmer', 2.0, 0.5, 1.2, -10, 100)],
    'sfbeam': [('flare', 0.0, 0.5, 1.2, -2, 0), ('light', 0.0, 0.8, 1.3, -4, 0), ('boom', 0.0, 0.6, 1.4, -8, 0)],
    'sfupshot': [('airy', 0.0, 0.5, 1.3, -3, 0), ('twinkle', 0.0, 0.4, 1.0, -8, 280)],
    'sfupbig': [('airy', 0.0, 0.7, 1.0, -2, 0), ('brightup', 0.0, 0.8, 1.0, -6, 300)],
    'sffeatherfall': [('twinkle', 0.0, 0.3, 1.5, -8, 0)],
    'sflightfall': [('arrow', 0.0, 0.25, 1.0, -4, 0), ('twinkle', 0.0, 0.3, 1.2, -10, 0)],
    'sfgolden': [('light', 0.0, 1.0, 1.0, -2, 0), ('harp', 0.0, 0.9, 1.2, -8, 100), ('bells', 0.0, 0.8, 1.1, -10, 200)],
    'sfsun': [('brightup', 0.0, 1.2, 0.75, -2, 0), ('astral', 0.0, 1.6, 1.1, -8, 200), ('farbells', 10.5, 1.2, 1.2, -10, 400)],
    # The Phoenix (2026-11-16): a ratchet's click for her crossbow's trigger under a fire whoosh, a
    # campfire's crackle where her bolts land and burn, a match struck for Smoulder, flares and booms for
    # her bursts, fire birds' chirps, a great whoosh and a call for the phoenix.
    'phbolt': [('ratchet', 3.17, 0.05, 0.9, -6, 0), ('firewhoosh', 0.2, 0.35, 1.5, -3, 0), ('arrow', 0.0, 0.2, 0.8, -10, 0)],
    'phboltbig': [('ratchet', 3.17, 0.05, 0.8, -4, 0), ('firewhoosh', 0.2, 0.5, 1.1, 0, 0), ('boom', 0.0, 0.4, 1.4, -10, 0)],
    'phhit': [('crackle', 42.55, 0.3, 1.2, -4, 0), ('arrow', 0.0, 0.2, 0.9, -8, 0)],
    'phhitbig': [('flare', 0.0, 0.4, 1.1, -4, 0), ('crackle', 42.55, 0.4, 1.0, -6, 30)],
    'phbird': [('chirp', 28.53, 0.12, 0.9, -3, 0), ('chirp', 28.83, 0.12, 0.95, -5, 140), ('crackle', 42.55, 0.25, 1.3, -10, 0)],
    'phchirp': [('chirp', 35.36, 0.12, 0.9, -2, 0), ('firewhoosh', 0.2, 0.3, 1.6, -10, 0)],
    'phburn': [('crackle', 47.96, 0.35, 1.2, -10, 0)],
    'phstuck': [('ignite', 0.01, 0.6, 1.2, -4, 0)],
    'phblast': [('flare', 0.0, 0.6, 0.9, 0, 0), ('boom', 0.0, 0.7, 1.0, -4, 0), ('crackle', 42.55, 0.4, 1.0, -8, 60)],
    'phburst': [('flare', 0.0, 0.4, 1.3, -4, 0), ('crackle', 42.55, 0.25, 1.3, -10, 0)],
    'phwings': [('firewhoosh', 0.2, 0.7, 1.0, -2, 0), ('mmflut', 0.19, 0.4, 0.8, -8, 0)],
    'phsweep': [('firewhoosh', 0.2, 1.1, 0.8, 0, 0), ('chirp', 22.28, 0.5, 0.7, -6, 100), ('boom', 0.0, 0.8, 0.9, -6, 500)],
    'phpillar': [('firewhoosh', 0.2, 1.0, 0.7, -2, 0), ('crackle', 69.95, 1.0, 1.0, -6, 0)],
    'phcharge': [('ignite', 0.01, 0.6, 1.0, -6, 0), ('brightup', 0.0, 0.6, 0.8, -10, 0)],
    'phbeam': [('flare', 0.0, 0.5, 1.0, -2, 0), ('firewhoosh', 0.2, 0.8, 1.2, -2, 0), ('boom', 0.0, 0.6, 1.2, -6, 0)],
    'phupshot': [('firewhoosh', 0.2, 0.5, 1.3, -3, 0), ('crackle', 42.55, 0.3, 1.2, -10, 280)],
    'phupbig': [('firewhoosh', 0.2, 0.8, 1.0, -2, 0), ('flare', 0.0, 0.5, 0.9, -6, 300)],
    'phfeatherfall': [('crackle', 47.96, 0.25, 1.4, -10, 0)],
    'phlightfall': [('firewhoosh', 0.2, 0.25, 1.6, -8, 0), ('crackle', 42.55, 0.25, 1.2, -10, 0)],
    'phgolden': [('ignite', 0.01, 1.0, 0.9, -2, 0), ('firewhoosh', 0.2, 0.8, 0.9, -6, 100)],
    'phsun': [('firewhoosh', 0.2, 1.4, 0.7, 0, 0), ('braam', 0.0, 1.2, 1.4, -10, 200), ('crackle', 69.95, 1.2, 1.0, -8, 300)],
    # The Songbird (2026-11-16): her arrows loose with a plucked string and a happy pluck, notes chime
    # where they land, bluebirds chirp, a harp and bells for her heals and songs, a soft harp for the
    # lullaby, a rising chorus of bells and chirps for Grand Chorus.
    'sbshot': [('strings', 0.07, 0.25, 1.6, -6, 0), ('plucks', 0.0, 0.3, 1.0, -8, 20)],
    'sbshotbig': [('strings', 0.07, 0.4, 1.2, -4, 0), ('plucks', 0.0, 0.4, 0.9, -6, 20), ('airy', 0.0, 0.3, 1.2, -10, 0)],
    'sblull': [('harp', 0.0, 0.7, 0.8, -6, 0), ('airy', 0.0, 0.4, 0.9, -12, 0)],
    'sbhit': [('twinkle', 0.0, 0.3, 1.3, -6, 0), ('plucks', 0.0, 0.2, 1.4, -10, 30)],
    'sbhitbig': [('bells', 0.0, 0.5, 1.2, -4, 0), ('twinkle', 0.0, 0.4, 1.0, -8, 40)],
    'sbbird': [('chirp', 28.53, 0.12, 1.2, -3, 0), ('chirp', 28.83, 0.12, 1.25, -5, 140), ('chirp', 31.76, 0.12, 1.3, -6, 300)],
    'sbchirp': [('chirp', 35.36, 0.12, 1.25, -2, 0), ('plucks', 0.0, 0.2, 1.5, -12, 0)],
    'sbnotes': [('plucks', 0.0, 0.4, 1.2, -6, 0), ('twinkle', 0.0, 0.4, 1.1, -8, 100)],
    'sbmend': [('twinkle', 0.0, 0.3, 1.5, -10, 0)],
    'sbmelody': [('harp', 0.0, 1.0, 1.1, -3, 0), ('bells', 0.0, 0.9, 1.2, -8, 120), ('shimmer', 2.0, 0.8, 1.2, -12, 200)],
    'sbanthem': [('bells', 0.0, 1.0, 1.0, -2, 0), ('harp', 0.0, 1.0, 1.3, -8, 80), ('brightup', 0.0, 0.8, 1.1, -10, 200)],
    'sbribbon': [('harp', 0.0, 0.6, 1.5, -6, 0), ('airy', 0.0, 0.4, 1.2, -8, 0)],
    'sbflock': [('chirp', 22.28, 0.5, 1.1, -4, 0), ('chirp', 28.53, 0.12, 1.2, -6, 300), ('chirp', 35.36, 0.12, 1.3, -6, 500), ('bells', 0.0, 1.2, 1.0, -10, 200)],
    'sbwave': [('harp', 0.0, 1.2, 0.9, -2, 0), ('brightup', 0.0, 1.0, 0.9, -6, 0), ('farbells', 10.5, 1.2, 1.2, -8, 200)],
    'sbcharge': [('brightup', 0.0, 0.6, 0.9, -6, 0), ('harp', 0.0, 0.5, 1.6, -10, 100)],
    'sbbeam': [('flare', 0.0, 0.4, 1.3, -6, 0), ('light', 0.0, 0.8, 1.4, -4, 0), ('bells', 0.0, 0.6, 1.2, -8, 0)],
    'sbupshot': [('airy', 0.0, 0.5, 1.4, -3, 0), ('plucks', 0.0, 0.4, 1.0, -8, 280)],
    'sbupbig': [('airy', 0.0, 0.7, 1.1, -2, 0), ('bells', 0.0, 0.8, 1.1, -6, 300)],
    'sbfeatherfall': [('plucks', 0.0, 0.3, 1.5, -8, 0)],
    'sblightfall': [('twinkle', 0.0, 0.3, 1.3, -8, 0), ('plucks', 0.0, 0.2, 1.2, -10, 0)],
    'sbgolden': [('light', 0.0, 1.0, 1.1, -2, 0), ('harp', 0.0, 0.9, 1.3, -8, 100), ('chirp', 35.36, 0.12, 1.2, -10, 400)],
    'sbsun': [('brightup', 0.0, 1.2, 0.85, -2, 0), ('harp', 0.0, 1.4, 0.9, -8, 200), ('farbells', 10.5, 1.2, 1.3, -10, 400)],
    # The Moon Moth (2026-11-16): her mark (a soft puff of wings and a glint), the cloud of moths she
    # breaks into, the wings her finisher opens, Wing Flurry's whirl, the swarm in flight, the Full
    # Moon moth's nip, Midnight Swarm's moon rising and the swarm pouring down.
    'mmhit': [('mmflut', 0.19, 0.3, 1.5, 0, 0), ('twinkle', 0.0, 0.3, 1.3, -12, 0)],
    'mmflutter': [('mmflut', 0.19, 0.32, 1.35, 0, 0), ('airy', 0.0, 0.28, 1.5, -8, 0)],
    'ecflutter': [('mmflut', 3.07, 0.32, 1.15, 0, 0), ('braam', 0.0, 0.3, 1.9, -10, 0)],
    'mmcloud': [('mmriffle', 0.16, 0.6, 1.25, 0, 0), ('mmflut', 3.07, 0.5, 1.2, -4, 0), ('shimmer', 2.0, 0.5, 1.1, -12, 0)],
    'mmwings': [('mmflut', 0.19, 0.9, 0.85, 0, 0), ('airy', 0.0, 0.6, 0.9, -4, 0), ('light', 0.0, 0.8, 1.0, -9, 60)],
    'mmflurry': [('mmriffle', 0.16, 0.8, 1.1, -1, 0), ('shimmer', 8.0, 0.6, 1.3, -11, 0)],
    'mmswarm': [('mmwingfx', 1.0, 1.2, 1.0, -3, 0), ('mmriffle', 0.16, 1.0, 0.9, -2, 0)],
    'mmnip': [('mmriffle', 0.4, 0.25, 1.6, -5, 0), ('twinkle', 0.0, 0.25, 1.6, -12, 0)],
    'mmmoon': [('light', 0.0, 1.4, 0.8, -2, 0), ('bells', 0.0, 1.2, 0.85, -9, 100), ('shimmer', 16.0, 1.4, 0.9, -6, 0)],
    'mmpour': [('mmwingfx', 2.0, 1.5, 0.9, 0, 0), ('mmriffle', 0.16, 1.1, 0.8, -2, 50), ('mmflut', 5.66, 0.9, 0.8, -3, 150)],
    'tcbubblepop': [('bubbles', 0.0, 0.3, 1.25, -2, 0), ('liquid', 0.0, 0.25, 1.5, -8, 0)],
    'tcribbon': [('watery', 0.0, 0.4, 1.0, 0, 0), ('wflow', 9.6, 0.5, 1.2, -6, 0)],
    'tcpillar': [('brightup', 0.0, 1.0, 0.9, -4, 0), ('wflow', 9.6, 0.9, 1.1, -4, 80), ('shimmer', 5.0, 0.8, 1.0, -10, 0)],
    'tcshell': [('liquid', 0.0, 0.2, 1.6, -4, 0), ('bubbles', 0.0, 0.25, 1.4, -8, 0)],
    'tcdrops': [('lid', 0.0, 0.9, 1.1, -2, 0), ('liquid', 0.0, 0.3, 1.4, -8, 120)],
    'tcdropsbig': [('lid', 0.0, 1.0, 0.95, -2, 0), ('liquid', 0.0, 0.35, 1.2, -6, 120)],
    'tccrescent': [('watery', 0.0, 0.45, 0.9, 0, 0), ('wtrans', 1.6, 0.6, 1.1, -8, 0)],
    'tcspring': [('wflow', 9.6, 1.0, 1.1, -2, 0), ('wimpact', 0.05, 0.6, 0.95, -4, 60), ('twinkle', 0.0, 0.6, 1.0, -10, 100)],
    'tcsplash': [('wimpact', 0.05, 0.5, 1.0, 0, 0), ('bubbles', 0.0, 0.3, 1.1, -8, 40)],
    'tcsplashbig': [('wimpact', 0.05, 0.7, 0.85, 0, 0), ('drown', 0.0, 0.6, 1.0, -6, 60)],
    'tcdrop': [('liquid', 0.0, 0.25, 1.5, -6, 0), ('twinkle', 0.0, 0.5, 1.3, -8, 60)],
    'tcrevive': [('brightup', 0.0, 1.4, 0.85, -2, 0), ('shimmer', 8.0, 1.2, 1.0, -8, 100)],
    'tcrain': [('rain', 200.0, 3.0, 1.0, -2, 0), ('shimmer', 12.0, 2.0, 1.0, -12, 0)],
    'tcsurge': [('brightup', 0.0, 1.2, 1.0, -2, 0), ('wimpact', 0.05, 0.6, 0.9, -4, 40), ('wflow', 9.6, 0.8, 1.2, -6, 0)],
    'tcbless': [('shimmer', 16.0, 1.4, 1.0, -4, 0), ('light', 0.0, 0.9, 0.9, -6, 0)],
    'tcmoonfall': [('twinkle', 0.0, 0.5, 0.8, -6, 0), ('drown', 0.0, 0.8, 0.8, -2, 250), ('wimpact', 0.05, 0.7, 0.8, -2, 300)],
    'tcmoontide': [('astral', 0.0, 2.5, 1.0, -4, 0), ('surf', 0.0, 2.2, 0.9, -2, 300), ('brightup', 0.0, 1.4, 0.8, -6, 1200)],
    'tcglint': [('twinkle', 0.0, 0.9, 1.1, -4, 0), ('shimmer', 20.0, 0.6, 1.2, -8, 0)],
    'tcshellfx': [('bubbles', 0.0, 0.5, 1.0, 0, 0), ('shimmer', 24.0, 0.8, 1.0, -8, 80)],
    'tcpool': [('wflow', 3.5, 1.1, 1.05, -2, 0), ('shimmer', 28.0, 1.0, 1.0, -10, 120)],
    'tcwhirl': [('wrock', 0.0, 1.0, 0.95, -2, 0), ('watery', 0.0, 0.4, 0.9, -6, 0)],
    'tcsilverwave': [('wtrans', 1.6, 1.3, 0.95, 0, 0), ('shimmer', 30.0, 1.0, 1.0, -10, 100)],
    # The Maelstrom (2026-11-09): the deep sea, heavier and lower: spears of pressure, vortex bolts,
    # vortices and the finisher's whirlpool, beams, black water slammed down, glowing charges.
    'msspear': [('watery', 0.0, 0.3, 0.8, 0, 0), ('subimpact', 0.1, 0.3, 0.7, -4, 40)],
    'msbolt': [('wrock', 0.0, 0.5, 1.2, -2, 0), ('watery', 0.0, 0.3, 0.7, -4, 0)],
    'mshit': [('subimpact', 0.1, 0.3, 0.8, 0, 0), ('liquid', 0.0, 0.3, 0.8, -6, 0)],
    'msvortex': [('wrock', 0.0, 1.0, 0.8, 0, 0), ('drown', 0.0, 0.8, 0.7, -4, 100)],
    'msvortexsmall': [('wrock', 0.2, 0.5, 1.1, -4, 0)],
    'msbeam': [('wflow', 9.6, 0.8, 0.7, 0, 0), ('subimpact', 0.1, 0.3, 0.6, -4, 0)],
    'msbeambig': [('wflow', 9.6, 1.2, 0.6, 0, 0), ('drown', 0.0, 0.6, 0.6, -4, 60), ('boom', 0.0, 0.8, 1.2, -10, 0)],
    'msslam': [('drown', 0.0, 0.7, 0.75, 0, 0), ('wimpact', 0.05, 0.6, 0.7, -2, 30)],
    'msglowpop': [('liquid', 0.0, 0.35, 0.9, 0, 0), ('bubbles', 0.0, 0.3, 0.8, -6, 0)],
    'msslash': [('watery', 0.0, 0.4, 0.75, 0, 0), ('whip', 0.0, 0.3, 0.8, -8, 0)],
    'msmaelstrom': [('wrock', 0.0, 2.0, 0.6, 0, 0), ('drown', 0.0, 1.2, 0.55, -2, 200), ('braam', 0.0, 2.0, 1.0, -8, 0)],
    'msshellfx': [('bubbles', 0.0, 0.5, 0.7, 0, 0), ('drown', 0.0, 0.6, 0.9, -8, 80)],
    'mspool': [('wflow', 3.5, 1.1, 0.75, -2, 0), ('liquid', 0.0, 0.35, 0.8, -6, 120)],
    'msblackwave': [('wtrans', 1.6, 1.3, 0.75, 0, 0), ('drown', 0.0, 0.8, 0.65, -5, 140)],
    'tmshieldfx': [('bubbles', 0.0, 0.5, 0.9, 0, 0), ('light', 0.0, 0.9, 1.0, -6, 80)],
    'tmpool': [('wflow', 3.5, 1.1, 0.95, -2, 0), ('liquid', 0.0, 0.35, 1.0, -6, 120)],
    # Swings: an axe's heavy scrape through the air, a spear's long blade sweep, a dagger's quick
    # flick, a fist's whump; the heavy ones lower and longer.
    'axeSwing': [('scrapes', 14.46, 0.42, 0.85, 0, 0), ('airy', 0.7, 0.3, 1.3, -10, 0)],
    'axeSwingHeavy': [('scrapes', 21.63, 0.62, 0.75, 0, 0), ('deviant', 1.25, 0.4, 1.2, -8, 0)],
    'spearSwing': [('blade', 0.0, 0.32, 0.9, 0, 0), ('airy', 0.6, 0.3, 1.5, -8, 0)],
    'spearSwingHeavy': [('scrapes', 9.77, 0.45, 0.8, 0, 0), ('airy', 0.6, 0.4, 1.1, -6, 0)],
    'daggerSwing': [('airy', 0.6, 0.25, 2.0, 0, 0), ('blade', 0.02, 0.2, 1.4, -6, 0)],
    'fistSwing': [('deviant', 1.2, 0.35, 2.2, 0, 0)],
    # Thrusts: a fast hiss forward, the point arriving with a tap (a spear's on wood and iron).
    'spearThrust': [('scifi', 0.26, 0.3, 1.3, 0, 0), ('file', 0.13, 0.2, 0.8, -6, 120)],
    'thrust': [('scifi', 0.26, 0.28, 1.5, 0, 0), ('body', 1.16, 0.2, 1.0, -8, 110)],
    # Hits: a heavy arrow's rattle with a body blow and an axe's bite; a throwing star's ring.
    'arrowHitHeavy': [('arrow', 0.2, 0.45, 0.85, 0, 0), ('body', 3.22, 0.25, 0.9, -3, 0), ('axehit', 2.45, 0.35, 1.0, -8, 0)],
    'starHit': [('arrow', 0.2, 0.35, 1.35, 0, 0), ('file', 0.13, 0.22, 1.4, -6, 0)],
    # A throwing star thrown: a thin, fast whistle with a glint of metal.
    'star': [('scifi', 0.26, 0.35, 1.7, 0, 0), ('file', 0.13, 0.15, 1.8, -10, 60)],
    # Poison ticking: a small fizzing bubble.
    'dot': [('liquid', 0.14, 0.3, 1.5, 0, 0)],
    # Hook: a whip's crack and the iron catching.
    'hook': [('whip', 0.17, 0.6, 1.0, 0, 0), ('file', 0.13, 0.2, 0.9, -6, 200)],
    # Fire: a deep roaring whoosh and a flare going off.
    'fire': [('firewhoosh', 0.2, 0.9, 1.0, 0, 0), ('flare', 0.0, 0.6, 1.0, -6, 150)],
    # Poison: a fizzing, bubbling whoosh.
    'poison': [('watery', 0.77, 1.0, 0.9, 0, 0), ('liquid', 0.14, 0.4, 0.8, -6, 300)],
    # Mist: a soft gust carrying a damp hiss.
    'mist': [('airy', 0.6, 1.2, 0.85, 0, 0), ('watery', 0.8, 0.9, 0.7, -8, 0)],
    # Bladestorm: three blades sweeping round in quick succession.
    'bladestorm': [('blade', 0.0, 0.32, 1.0, 0, 0), ('blade', 0.0, 0.32, 1.15, -3, 110), ('scrapes', 14.46, 0.42, 0.9, -2, 220)],
    # Gathering power: an electric arc winding up under an anime power-up.
    'gather': [('arcup', 0.5, 0.9, 1.0, 0, 0), ('powerup', 4.34, 0.7, 1.0, -6, 0)],
    # Gathering holy light: a bright tonal spell and a shimmering flow of energy.
    'gatherHoly': [('light', 0.0, 0.9, 1.0, 0, 0), ('astonish', 3.0, 0.9, 1.0, -8, 0)],
    # ----- Movement (step 4) -----
    # Jumping: a quick swish of clothes, three takes so it never repeats.
    'jump1': [('cloth29', 0.0, 0.28, 1.25, 0, 0)],
    'jump2': [('cloth24', 0.0, 0.28, 1.2, 0, 0)],
    'jump3': [('cloth24', 1.42, 0.28, 1.3, 0, 0)],
    # Landing: a soft pat of feet and clothes, a low wooden bump under it.
    'land1': [('pats', 0.0, 0.25, 0.8, 0, 0), ('wooddrop', 0.0, 0.2, 0.6, -14, 0)],
    'land2': [('pats', 0.0, 0.25, 0.7, 0, 0), ('wooddrop', 0.0, 0.2, 0.55, -14, 0)],
    # Climbing: clothes rubbing on the rope, hand over hand.
    'climb1': [('cloth24', 1.45, 0.2, 0.9, 0, 0)],
    'climb2': [('cloth29', 0.3, 0.2, 0.85, 0, 0)],
    # Placing furniture: a piece of wood set down.
    'furnPlace': [('wooddrop', 0.0, 0.5, 1.0, 0, 0)],
    # Mounting up and getting off: a swish of clothes and a soft pat into the saddle (or onto the ground).
    'mountOn': [('cloth24', 0.1, 0.5, 1.1, 0, 0), ('pats', 0.0, 0.25, 0.9, -3, 260)],
    'mountOff': [('cloth29', 0.1, 0.45, 0.95, 0, 0), ('pats', 0.0, 0.25, 0.75, -3, 220)],
    # The crane's wing beat: a heavy flap of cloth.
    'craneFlap': [('pats', 0.0, 0.25, 1.15, 0, 0), ('cloth29', 0.0, 0.2, 1.4, -8, 0)],
    # The flying kettle: its whistle (a steam whistle, back up to pitch) and its lid rattling.
    'kettleWhistle': [('whistle', 1.6, 2.4, 3.0, 0, 0)],
    'kettleRattle': [('lid', 0.17, 0.14, 1.25, 0, 0)],
    # The cloud's puff: a short soft burst of steam.
    'nimbusPuff': [('steam', 0.0, 0.5, 1.4, 0, 0)],
    # The turtle surfacing: water swirling.
    'turtleSplash': [('wade', 0.3, 0.7, 1.1, 0, 0)],
    # The bunny's hop: a cartoon bubble boing.
    'bunHop': [('bubbles', 0.23, 0.23, 1.2, 0, 0)],
    # Buffs (2026-11-08, the player's pick over a shrill anime power-up): a warm light spell with
    # little bells; the party's is longer and fuller, the bells ringing on.
    'buff': [('light', 0.0, 1.3, 1.0, 0, 0), ('bells', 2.21, 1.2, 1.0, -8, 0)],
    'partyBuff': [('light', 0.0, 1.9, 0.94, 0, 0), ('bells', 2.21, 2.0, 1.0, -6, 0), ('bells', 0.41, 0.6, 1.0, -9, 450)],
    # Sakura Sprint's festival (2026-11-13). The taiko: one round "don" (a touch higher, lighter),
    # and at Go a double beat, the second higher; the crowd swelling up to a cheer (faded in, its
    # 7th value); one chime note (the game pitches it up into a little tune).
    'taikoDon': [('taiko', 0.0, 1.0, 1.12, 0, 0)],
    'taikoGo': [('taiko', 0.0, 1.3, 1.0, 0, 0), ('taiko', 0.0, 1.1, 1.2, -2, 150)],
    'crowdSwell': [('cheer', 0.0, 4.6, 1.0, 0, 0, 0.9)],
    'chimeBell': [('handbell', 0.28, 1.6, 1.0, 0, 0)],
    # Lily Lake's gala (2026-11-13). The lifeguard's whistle: a short toot on each count (the steady
    # middle of the held whistle, a touch higher) and a long blast at Go; a racer diving in (a
    # plunge, its spray, a few bubbles after); one climbing out and shaking off (a soft swish of
    # water); a buoy's fountain leaping (a gush and a swish); bubbles over the podium; and the lake
    # lapping at the shore, three takes (faded in).
    'lakeToot': [('whistleh', 0.82, 0.24, 1.2, 0, 0)],
    'lakeWhistle': [('whistleh', 0.80, 0.86, 1.2, 0, 0)],
    'lakeDive': [('subimpact', 0.1, 0.5, 1.1, 0, 0), ('wimpact', 0.95, 0.55, 1.15, -7, 25), ('bubbles', 0.0, 0.3, 1.0, -12, 140)],
    'lakeSwish': [('wade', 0.7, 0.9, 1.2, 0, 0)],
    'lakeJet': [('wflow', 9.6, 1.0, 1.3, -1, 0), ('wade', 0.75, 0.6, 1.35, -6, 60)],
    'lakeBubbles': [('bubbles', 0.0, 0.6, 1.05, 0, 0)],
    'lakeLap1': [('lakelap', 19.8, 2.8, 1.0, 0, 0, 0.6)],
    'lakeLap2': [('lakelap', 24.2, 3.0, 1.0, 0, 0, 0.6)],
    'lakeLap3': [('lakelap', 28.4, 3.0, 1.0, 0, 0, 0.6)],
    # Mortar Cliff's festival (2026-11-13). A mallet into the dough ("pettan": the wooden thump
    # pitched down with a little drum under it) on each count; two at Go, the drum swelling; the
    # breeze through the maples (a soft gust and rustling leaves, faded in); the bell at a wall's top
    # (the handbell, pitched down into a deeper bell).
    'mochiPound': [('woodsq', 0.0, 0.3, 0.82, 0, 0), ('taiko', 0.0, 0.35, 1.5, -12, 0)],
    'mochiPoundGo': [('woodsq', 0.0, 0.3, 0.82, 0, 0), ('woodsq', 0.0, 0.3, 0.92, 0, 170), ('taiko', 0.0, 0.8, 1.15, -6, 170)],
    'leafGust': [('airy', 0.0, 1.6, 1.0, -4, 0, 0.5), ('cornleaf', 0.3, 1.6, 1.0, 0, 150, 0.3)],
    'wallBell': [('handbell', 0.28, 1.8, 0.75, 0, 0)],
    # Cloud Glide's winter (2026-11-13). Soft bells on each count, bells and a rush of wind at Go;
    # yours taking off (a gust); landing in the snow (a soft pat, a little puff of air); a cheer as
    # yours lands; the wind over the peak now and then (faded in).
    'snowBell': [('bells', 0.0, 1.0, 1.0, 0, 0)],
    'snowGo': [('bells', 0.0, 1.4, 1.0, 0, 0), ('airy', 0.0, 1.2, 1.1, -4, 80)],
    'glideGust': [('airy', 0.0, 1.4, 0.95, 0, 0, 0.2)],
    'snowLand': [('pats', 0.0, 0.3, 0.9, 0, 0), ('airy', 0.2, 0.4, 1.4, -10, 0)],
    'snowWind': [('airy', 0.0, 2.0, 0.8, 0, 0, 0.6)],
    'landCheer': [('cheer', 1.0, 2.0, 1.0, 0, 0, 0.3)],
    # Long Hill Run's sweets (2026-11-13). A kawaii pop on each count; at Go a bright pop, a kalimba
    # running up and a music box note on top; a soft gust as yours tips over a hilltop and runs
    # down; single music box notes now and then (the game pitches them into a little tune); a
    # patter of cartoon pops and a twinkle over the podium as the sprinkles fall.
    'sweetPop': [('kpop', 0.0, 0.2, 1.0, 0, 0)],
    'sweetGo': [('ipop', 0.0, 0.2, 1.0, 0, 0), ('kalimba', 0.0, 0.5, 1.0, -2, 60), ('mbox', 0.04, 1.3, 2.0, -6, 300)],
    'sweetChime': [('mbox', 0.04, 1.3, 1.0, 0, 0)],
    'hillWhoosh': [('airy', 0.0, 1.2, 1.15, -3, 0, 0.25)],
    'sweetShower': [('cpops', 0.0, 0.97, 1.1, -4, 0), ('twinkle', 0.0, 1.8, 1.0, -5, 120)],
    # The Grand Mochi Course's festival at dusk (2026-11-13). The taiko a little deeper on each
    # count; at Go two strokes and a firework popping off; the drummer on the yagura drumming yours
    # over its top (three strokes); a firework launched and bursting as yours takes off; fireworks
    # booming far off now and then (three takes, faded in); sparkler twinkles and a far boom over
    # the podium.
    'matsuriDon': [('taiko', 0.0, 1.0, 0.92, 0, 0)],
    'matsuriGo': [('taiko', 0.0, 1.3, 0.92, 0, 0), ('taiko', 0.0, 1.1, 1.06, -2, 150), ('fwnear', 2.5, 1.6, 1.0, -9, 320)],
    'yaguraDon': [('taiko', 0.0, 0.5, 1.02, -1, 0), ('taiko', 0.0, 0.5, 1.08, -2, 170), ('taiko', 0.0, 1.0, 0.96, 0, 340)],
    'fwLaunch': [('fwnear', 1.3, 3.0, 1.0, 0, 0)],
    'fwFar1': [('fwdist', 11.4, 2.6, 1.0, 0, 0, 0.05)],
    'fwFar2': [('fwdist', 7.8, 2.4, 1.0, 0, 0, 0.05)],
    'fwFar3': [('fwdist', 6.3, 2.2, 1.0, 0, 0, 0.05)],
    'sparkShower': [('twinkle', 0.0, 1.8, 0.9, -3, 0), ('fwdist', 11.4, 2.6, 1.0, -8, 250)],
    # The Mochi Grand Tour's kingdom (2026-11-13). A guard's spear grounded on each count; at Go a
    # horn fanfare over two spears; the town gate creaking open; a flag running up a wall's pole;
    # the drawbridge chain overhead at the moat; a far horn call now and then (faded in); and the
    # full fanfare with a cheer under it as yours comes home and on the podium.
    'kingTap': [('spear', 0.0, 0.34, 0.92, 0, 0), ('taiko', 0.0, 0.4, 1.4, -14, 0)],
    'kingGo': [('hornbig', 0.0, 1.9, 1.5, 0, 0), ('spear', 0.0, 0.34, 0.92, -4, 0), ('spear', 0.75, 0.34, 0.86, -5, 170)],
    'kingGate': [('gatecreak', 12.2, 1.3, 1.0, 0, 0)],
    'kingFlag': [('cloth29', 0.0, 0.8, 1.1, 0, 0), ('airy', 0.3, 0.7, 1.5, -7, 0)],
    'kingChain': [('chainrat', 2.0, 1.3, 0.9, 0, 0)],
    'kingHorn': [('horn2', 0.2, 1.8, 1.25, 0, 0, 0.3)],
    'kingFanfare': [('hornbig', 0.0, 2.4, 1.42, 0, 0), ('horn2', 0.2, 1.8, 1.9, -7, 260), ('cheer', 1.0, 2.6, 1.0, -5, 420, 0.3)],
    # Tanabata Hurdles' star night (2026-11-16). A bamboo knock on each count; at LEAP! two knocks
    # and a wind-chime flourish with a twinkle; a soft whoosh as yours takes off and a star's
    # twinkle as it clears; a knocked bar's clack and rattle; a fall's bump and pat, and seeing
    # stars; a glass wind chime now and then (high, the furin); the podium's shower of stars.
    'tanaKnock': [('spear', 0.0, 0.3, 1.4, 0, 0)],
    'tanaGo': [('spear', 0.0, 0.3, 1.4, 0, 0), ('spear', 0.0, 0.3, 1.62, -2, 140), ('handbell', 0.28, 1.4, 1.9, -6, 260), ('twinkle', 0.0, 1.2, 1.0, -7, 300)],
    'leapWhoosh': [('airy', 0.6, 0.32, 1.35, -3, 0)],
    'leapStar': [('twinkle', 0.0, 0.9, 1.15, -2, 0)],
    'hurdleClack': [('spear', 0.0, 0.3, 1.2, 0, 0), ('arrow', 0.0, 0.7, 1.25, -6, 30)],
    'hurdleTumble': [('spear', 0.0, 0.35, 0.95, -2, 0), ('pats', 0.0, 0.3, 0.9, -3, 120), ('dizzy', 0.0, 1.6, 1.15, -5, 260)],
    'furin': [('handbell', 0.28, 1.3, 2.15, 0, 0)],
    # Mochitsuki Mountain (2026-11-16). A temple bell's ding for each count (and far off now and
    # then), and the great bell with a gong under it at Go - and for every bell a racer strikes;
    # a boulder's blows (stone struck, a thump under it) and its burst (a rock fall); a snowball's
    # crunch through the snow on each shove, its swish as it slips back and its thump into the
    # drift; the rice cart's creak on each tug, a thunk and a strained creak as a wheel sticks; a
    # piece of kagami-mochi plopping onto the stack.
    'mtTing': [('tbell', 1.6, 1.15, 0.84, 0, 0)],
    'mtGong': [('gong', 0.08, 3.4, 0.8, 0, 0), ('tbell', 15.24, 1.05, 0.62, -5, 0)],
    'rockHit': [('stone', 0.0, 0.5, 0.8, 0, 0), ('taiko', 0.0, 0.35, 1.3, -10, 0)],
    'rockBreak': [('stone2', 0.0, 0.28, 0.7, -1, 0), ('rockfall', 2.5, 2.0, 1.0, -2, 40)],
    'snowCrunch': [('ski', 0.98, 0.5, 0.9, 0, 0)],
    'snowSlip': [('ski', 12.75, 0.75, 1.05, 0, 0)],
    'snowThump': [('ski', 13.9, 0.4, 0.85, -2, 0), ('pats', 0.0, 0.3, 0.7, -4, 0)],
    'cartCreak': [('gatecreak', 11.55, 0.6, 0.9, 0, 0)],
    'cartStuck': [('spear', 0.0, 0.3, 0.7, 0, 0), ('doorcreak', 4.64, 0.7, 0.85, -3, 120)],
    'mochiPlop': [('woodsq', 0.0, 0.3, 0.75, 0, 0), ('pats', 0.0, 0.3, 0.85, -6, 0)],
    # Footsteps (2026-11-16, the bigger library; four takes each, one picked each step): dry grass,
    # a wooden floor, light snow, sand (the snow, finer), a cloud's soft pad (a paw, lower), and a
    # Mochi's own little paws.
    # (Takes picked to be about as loud as each other once levelled: a spiky one stood out.)
    **{f'stepGrass{i + 1}': [(src, st, 0.28, 1.0, 0, 0)] for i, (src, st) in enumerate([('grass14', 0.03), ('grass113', 0.25), ('grass186', 0.0), ('grassryk', 0.03)])},
    **{f'stepWood{i + 1}': [('woodfloor', st, 0.32, 1.0, 0, 0)] for i, st in enumerate([0.05, 0.51, 1.03, 1.53])},
    **{f'stepSnow{i + 1}': [(src, st, 0.28, 1.0, 0, 0)] for i, (src, st) in enumerate([('snowlight', 0.07), ('snowlight', 0.37), ('snowlight', 0.65), ('snowstep', 0.05)])},
    **{f'stepSand{i + 1}': [(src, st, 0.28, 1.25, 0, 0)] for i, (src, st) in enumerate([('snowlight', 0.07), ('snowlight', 0.37), ('snowlight', 0.65), ('snowstep', 0.05)])},
    **{f'stepCloud{i + 1}': [('paws', st, 0.26, 0.85, 0, 0)] for i, st in enumerate([2.11, 3.31, 4.27, 5.81])},
    **{f'mochiStep{i + 1}': [('paws', st, 0.22, 1.3, 0, 0)] for i, st in enumerate([2.57, 6.09, 6.55, 10.65])},
    # Menus (2026-11-16): a cartoon plop for a click, a little boing as a window pops open, a soft
    # error, a balafon's rising notes for a skill going up.
    'click': [('plop', 0.0, 0.16, 1.05, 0, 0)],
    'open': [('boing', 0.04, 0.34, 1.25, 0, 0)],
    'denied': [('uierror', 0.03, 0.36, 1.0, 0, 0)],
    'skillUp': [('balafon', 0.2, 0.9, 1.0, 0, 0)],
    # Bells and ice (2026-11-16): a town's bells far off over the hills; folk bell-ringers coming
    # through the carnival; a frozen monster's ice cracking under a frosty chime; ice creaking far
    # off in the snow.
    'townBell': [('farbells', 10.5, 4.4, 1.0, 0, 0)],
    'bellRingers': [('bellmen', 6.8, 4.2, 1.0, 0, 0, 0.6)],
    'freeze': [('icecrack', 0.4, 0.45, 1.0, 0, 0), ('iceimpact', 0.1, 0.8, 1.0, -6, 0)],
    'iceCreak': [('icecracks', 0.9, 0.8, 0.9, 0, 0)],
    'tanaStars': [('twinkle', 0.0, 1.8, 0.95, -2, 0), ('handbell', 0.28, 1.6, 1.6, -6, 200), ('handbell', 0.28, 1.6, 2.0, -8, 520)],
    # Your island (2026-11-21): a hen's little clucks, a sheep's baa, the cow's low moo; the zip line's
    # trolley whirring down the cable; a seed dug in; Shelly hammering a building together and its
    # finishing sparkle. Pastel Harbor's clock tower ringing the hour.
    'henCluck': [('chicks', 2.45, 0.7, 0.8, 0, 0)],
    'sheepBaa': [('sheep', 23.15, 1.5, 1.0, 0, 0)],
    'cowMoo': [('piggroan', 0.0, 0.8, 0.62, 0, 0, 0.05)],
    'zipRide': [('gondola', 3.6, 2.9, 1.05, 0, 0, 0.3)],
    'plantSeed': [('dig', 3.95, 0.4, 1.2, 0, 0)],
    'buildHammer': [('hammer', 1.5, 1.3, 1.0, 0, 0), ('magiccreate', 0.0, 1.2, 1.0, -8, 950)],
    'clockBells': [('towerbells', 1.5, 5.8, 1.12, 0, 0)],
}


def build(name, layers, fade=0.3):
    args = [FF, '-nostdin', '-v', 'error', '-y']
    fc = []
    for n, layer in enumerate(layers):
        # (A 7th value: a longer fade in, for something that swells up.)
        k, st, ln, p, db, dl = layer[:6]
        fin = layer[6] if len(layer) > 6 else 0.003
        args += ['-ss', f'{st:.3f}', '-t', f'{ln:.3f}', '-i', SRC + S[k]]
        out_len = ln / p
        f = (f'[{n}:a]aformat=sample_rates=44100:channel_layouts=stereo,asetrate={44100 * p:.0f},aresample=44100,'
             f'afade=t=in:d={fin},afade=t=out:st={out_len * (1 - fade):.3f}:d={out_len * fade:.3f},volume={db}dB')
        if dl:
            f += f',adelay={dl}|{dl}'
        fc.append(f + f'[l{n}]')
    n = len(layers)
    mix = ''.join(f'[l{i}]' for i in range(n)) + f'amix=inputs={n}:normalize=0:duration=longest[m]'
    tmp = os.path.join(OUT, name + '.wav')
    subprocess.run(args + ['-filter_complex', ';'.join(fc + [mix]), '-map', '[m]', tmp], check=True)
    vd = subprocess.run([FF, '-nostdin', '-i', tmp, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mx = float(vd.split('max_volume: ')[1].split(' dB')[0])
    subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-i', tmp, '-af', f'volume={-1 - mx}dB', '-c:a', 'libmp3lame', '-b:a', '128k', os.path.join(OUT, name + '.mp3')], check=True)
    os.remove(tmp)


for name in sys.argv[1:] or B:
    build(name, B[name])
    print(name)
