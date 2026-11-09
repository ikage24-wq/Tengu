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
    # Nightfall: a dark braam swelling (raised a little, so it's grand rather than grim).
    'nightfall': [('braam', 0.4, 1.4, 1.15, 0, 0)],
    # Stormburst: a rush of wind, a heavy blow and a trailer boom underneath.
    'stormburst': [('windrush', 0.05, 0.9, 0.8, 0, 0), ('body', 1.16, 0.3, 0.75, -2, 0), ('boom', 0.27, 1.2, 1.0, -6, 0)],
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
}


def build(name, layers, fade=0.3):
    args = [FF, '-nostdin', '-v', 'error', '-y']
    fc = []
    for n, (k, st, ln, p, db, dl) in enumerate(layers):
        args += ['-ss', f'{st:.3f}', '-t', f'{ln:.3f}', '-i', SRC + S[k]]
        out_len = ln / p
        f = (f'[{n}:a]aformat=sample_rates=44100:channel_layouts=stereo,asetrate={44100 * p:.0f},aresample=44100,'
             f'afade=t=in:d=0.003,afade=t=out:st={out_len * (1 - fade):.3f}:d={out_len * fade:.3f},volume={db}dB')
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
