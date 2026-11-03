# Builds the finished effects in assets/audio/rec (src/audio/recorded.js) from the Sonniss GDC 2024 and 2026
# bundles: each is layers cut from the recordings, mixed, trimmed, faded and peak-normalised. Set SONNISS to the wavs.
import subprocess, array, os, json, sys
FF = os.environ.get('FFMPEG', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'))
SRC = os.environ.get('SONNISS', 'C:/Users/admin/tv/sound-check/sonniss/src').rstrip('/') + '/'  # the bundles' .wav files, all in one folder
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'audio', 'rec') + '/'
os.makedirs(OUT, exist_ok=True)
F = {
    'blade': 'METLFric_SWING SCRAPE Swift Melee Weapon Swing With A Long Blade 14_DDUMAIS_MWP2.wav',
    'slice': 'DSGNStngr_Action Deploy Units Sword Slice Special Move Layered Swish 04_ESM_TDG.wav',
    'sweep': 'Woosh Sweep Slide Infographics Basic.wav',
    'cuts': 'WEAPSwrd_Sword Slide Cuts, Metallic, Impact CM4 2_344 Audio_Medieval Weapons Vol 2.wav',
    'body': 'FGHTImpt_4 x Punch, Body 02_344 Audio_Cinematic Fight Vol 1.wav',
    'thud': 'SWSH_SWING IMPACTS Quick Heavy Weapon Swing To Thud Impact Var 01_DDUMAIS_MWP2.wav',
    'metal': 'METLImpt_METAL SWING HIT Weapon Swing To Metallic Body Impact And Resonant Tail 01_DDUMAIS_MWP2.wav',
    'smash': 'GORESplt_Gore Designed Transient Heavy Impact Smash 01_ESM_HALG.wav',
    'smack': 'FGHTImpt_Combat Punch Impact Light Hit Delay Crunchy Vintage Quick Smack 05_ESM_AG.wav',
    'stick': 'WEAPBlnt_Spear And Stick Impact, Wooden MKH 2_344 Audio_Medieval Weapons Vol 2.wav',
    'arrow': 'Arrow Hit Rattle.wav',
    'death': 'EXPLDsgn_Explosion Small Blast Enemy Death Crunchy Boom Cartoon Noisy Crash Impact Delay 03_ESM_AG.wav',
    'fire': 'FIREWhsh_Whoosh Fire Deep Growl Monster Saturated Crisp 03_ESM_EMWI.wav',
    'freeze': 'ICEBrk_Skill Freeze Whoosh Break Impact Layered Movement Shatter 03_ESM_TDG.wav',
    'fissure': 'ice, surface cracking, fissure, fast, hard-003.wav',
    'elec': 'ELECMisc_Impact Electric Tonal Deep Movement Motion Hiss Glitch 01_ESM_EMWI.wav',
    'water': 'WATRImpt_Impact Water Deep Submerge Bubble Drown Ship Hit 05_ESM_EMWI.wav',
    'water2': 'WATRMisc_Water, Liquid Impact, Bubble, Sci Fi, Hit 04_344 Audio_Elemental Palette Designed Vol 1.wav',
    'light': 'MAGAngl_Magic Light Spell Enchantment Potion Effect Tonal Bright 03_ESM_FG2.wav',
    'chord': 'Impact Hit Rapid Chord Reverb.wav',
    'shadow': 'DSGNMisc_Misc Monster Tentacle Modulated Creature Shadow Abstract Swept Wobble Lfo 02_ESM_AG.wav',
    'wind': 'WINDDsgn_Wind, Rush, Whoosh, Long x5 01_344 Audio_Elemental Palette Designed Vol 1.wav',
    'create': 'GAMEMisc_Magic Creation 23_CB Sounddesign_APPlicable Sounds.wav',
}
_cache = {}


def mono(k):
    if k not in _cache:
        raw = subprocess.run([FF, '-nostdin', '-v', 'error', '-i', SRC + F[k], '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True).stdout
        a = array.array('h')
        a.frombytes(raw)
        _cache[k] = a
    return _cache[k]


def peak(k, a, b):
    """Where the loudest hit between a and b seconds begins (its attack, a few ms early)."""
    x = mono(k)
    i0, i1 = int(a * 8000), min(int(b * 8000), len(x))
    if i1 <= i0: sys.exit(f"peak out of range: {k} {a}-{b}, file is {len(x)/8000:.2f}s")
    m = max(range(i0, i1), key=lambda i: abs(x[i]))
    th = abs(x[m]) / 4
    j = m
    # Back up over the attack (up to 40 ms) to where the signal first rises past a quarter of the peak.
    while j > max(i0, m - 320) and max(abs(v) for v in x[max(0, j - 16):j + 1]) > th:
        j -= 16
    return max(0.0, j / 8000 - 0.004)


def build(name, layers, fade=0.3):
    """layers: (file key, start s, length s, gain dB, delay ms)."""
    args = [FF, '-nostdin', '-v', 'error', '-y']
    fc = []
    for n, (k, st, ln, db, dl) in enumerate(layers):
        args += ['-ss', f'{st:.3f}', '-t', f'{ln:.3f}', '-i', SRC + F[k]]
        f = (f'[{n}:a]aformat=sample_rates=44100:channel_layouts=stereo,afade=t=in:d=0.003,'
             f'afade=t=out:st={ln * (1 - fade):.3f}:d={ln * fade:.3f},volume={db}dB')
        if dl:
            f += f',adelay={dl}|{dl}'
        fc.append(f + f'[l{n}]')
    n = len(layers)
    mix = ''.join(f'[l{i}]' for i in range(n)) + f'amix=inputs={n}:normalize=0:duration=longest[m]'
    tmp = OUT + name + '.wav'
    subprocess.run(args + ['-filter_complex', ';'.join(fc + [mix]), '-map', '[m]', tmp], check=True)
    vd = subprocess.run([FF, '-nostdin', '-i', tmp, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mx = float(vd.split('max_volume: ')[1].split(' dB')[0])
    subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-i', tmp, '-af', f'volume={-1 - mx}dB', '-c:a', 'libmp3lame', '-b:a', '128k', OUT + name + '.mp3'], check=True)
    os.remove(tmp)


S = {}
body_t = [0.19, 1.16, 2.20, 3.20]
# Swings: the long-blade scrape with a light air sweep; the heavy one a layered special-move slice.
S['swing'] = [[('blade', 0.0, 0.36, 0, 0), ('sweep', 0.03, 0.10, -12, 0)]]
S['swingHeavy'] = [[('slice', 0.18, 0.62, 0, 0)]]
# Sword hits: a metallic cut (the crack) on a body punch (the weight), four takes.
S['hit'] = [[('cuts', peak('cuts', c, c + 0.45), 0.32, 0, 0), ('body', peak('body', b, b + 0.3), 0.25, -7, 0)] for c, b in zip([0.15, 2.26, 4.34, 6.34], body_t)]
# Heavy hits: a heavy weapon's thud (from its impact, not its whoosh) on a body punch, four takes.
S['hitHeavy'] = [[('thud', peak('thud', t, t + 0.6), 0.45, 0, 0), ('body', peak('body', b, b + 0.3), 0.25, -6, 0)] for t, b in zip([0.07, 3.06, 6.10, 9.11], body_t)]
# Crit: a metal hit with its ringing tail over a heavy transient smash, and a chord ringing out.
S['crit'] = [[('metal', peak('metal', 0.06, 1.72), 1.1, 0, 0), ('smash', peak('smash', 0, 0.6), 0.45, -4, 0), ('chord', peak('chord', 0.25, 1.48), 0.9, -12, 30)]]
# Fists: the crunchy smack on a body punch.
S['hitFist'] = [[('smack', peak('smack', 0.03, 0.62), 0.35, 0, 0), ('body', peak('body', b, b + 0.3), 0.22, -4, 0)] for b in body_t]
# Spears and staffs: wooden stick impacts, four takes.
S['hitSpear'] = [[('stick', peak('stick', t, t + 0.25), 0.3, 0, 0), ('body', peak('body', b, b + 0.3), 0.2, -8, 0)] for t, b in zip([0.65, 1.32, 1.99, 5.05], body_t)]
S['arrowHit'] = [[('arrow', peak('arrow', 0.16, 0.68), 0.5, 0, 0), ('body', peak('body', 0.19, 0.42), 0.2, -10, 0)]]
# A monster defeated: a small crunchy cartoon blast.
S['poof'] = [[('death', 0.02, 0.75, 0, 0)]]
# Elements: a cast (the wind-up) and a hit for each.
S['castFire'] = [[('fire', 0.15, 1.0, 0, 0)]]
S['fireHit'] = [[('fire', peak('fire', 0.6, 1.6), 0.6, 0, 0), ('smash', peak('smash', 0, 0.6), 0.3, -12, 0)]]
S['castIce'] = [[('fissure', 0.30, 0.8, 0, 0)]]
S['iceHit'] = [[('freeze', 0.08, 1.0, 0, 0)]]
S['zapHit'] = [[('elec', 0.02, 0.85, 0, 0)]]
S['waterHit'] = [[('water2', 0.13, 0.65, 0, 0), ('water', 0.02, 0.7, -8, 0)]]
S['castHoly'] = [[('light', 0.0, 1.3, 0, 0)]]
S['holyHit'] = [[('chord', peak('chord', 0.25, 1.48), 1.0, 0, 0), ('light', 0.0, 0.6, -10, 0)]]
S['darkHit'] = [[('shadow', 0.02, 0.8, 0, 0), ('body', peak('body', 0.19, 0.42), 0.2, -8, 0)]]
S['windHit'] = [[('wind', 0.05, 0.55, 0, 0), ('body', peak('body', 1.16, 1.46), 0.2, -10, 0)]]
S['cast'] = [[('create', 0.22, 1.0, 0, 0)]]


# ----- The rest of the game's sounds that these recordings suit -----
F.update({
    'woodhit': "WOODImpt_Wooden Hit, Dark, Heavy Hit, Vampire's Prison_344 Audio_Haunting Ambiences Vol 3.wav",
    'lowring': 'DSGNImpt_Metal Hit Thud Thump Low Ring Geofon 1_The Noisery_Moaning Metal.wav',
    'file': 'METLImpt_Metal Old File Impact Tap Against Tire Iron Metallic Hit 01_ESM_HDGM.wav',
    'squelch': 'WOODImpt_Hit Blood Spill Splat Wood Impact Light Hit Squelch Small Thump 03_ESM_TDG.wav',
    'gurgle': 'CREAAqua_Aquatic Creature Gurgling 2_SNDBTS_VB-SE.wav',
    'glass': 'GLASMvmt_Whoosh Glass Crystal Fragments Sharp Shards Dry 05_ESM_EMWI.wav',
    'braam': 'Transition Braam Slow Dark Creepy.wav',
    'storm': 'WINDDsgn_EXT, Eye Of The Storm_344 Audio_Extreme Winds Vol 1.wav',
    'arc': 'ELECBuzz_Buzz27_InMotionAudio_Arc.wav',
    'thunder': 'STORM_Texas Rain Thunder Initial Crash Boom Storm 01 Clap Lightning_ESM_CPS.wav',
    'boomA': 'EffectiveTrailer_Booms_Vol2_214.wav',
    'boomB': 'EffectiveTrailer_Booms_Vol2_011.wav',
    'boomC': 'EffectiveTrailer_Booms_Vol2_075.wav',
    'crushed': 'ice, block of ice crushed, heavy-015.wav',
    'snap': 'ice, crack, ice block snapping-001.wav',
    'powerup': 'DSGNStngr_Power Up Bright Positive Successful Light Saturation Crash Shimmer 05_ESM_AG.wav',
    'entry': 'Game Entry Happy Short.wav',
    'plucks': 'Interface Plucks Happy.wav',
    'twinkle': 'Button Arp Twinkle.wav',
    'kalimba': 'UIMisc_Kalimba 3 Up_CB Sounddesign_APPlicable Sounds.wav',
    'ting': 'Ting Coins.wav',
    'musicbox': 'SBmb_Music Box A 013.wav',
    'glassy': 'Interface Accept Glassy Snap.wav',
    'alert': 'UIAlert_Collect Scifi Futuristic Electronic Bass Burst Sweep Heavy 04_ESM_FG2.wav',
    'fireworks': '13 Fireworks_powerful explosions_multiples in a row_near.wav',
    'whistles': '02 Fireworks_ explosions_dense_whistles.wav',
    'downer': 'DSGNBass_Tone Downer (Reverb)_344 Audio_Bass Drops and Downers Vol 3.wav',
    'horn': 'DSGNBram____Cinematic Horn Braam, Epic, Cinematic, Dark, Instrument, Huge-67.wav',
    'roar': 'ANMLRept_Large Herbivore Roar 01_344 Audio_Dinosaurs Vol 2.wav',
    'bells': '04 Church Bells, Near Distance, In Church Tower-3 Different Bell 02.wav',
    'waves': 'WATRWave_Medium Waves at Pebble Beach_JSE_RCoN_Stereo.wav',
    'astonish': 'magic, energy flow, astonishment-001.wav',
    'astral': 'magic, energy flow, astral travel-015.wav',
    'confetti': 'Cofetti Whoosh Pluck Spill.wav',
    'debris': 'Woosh Debris.wav',
    'pop': 'Interface Pop High Short.wav',
    'coinflip': 'Foley Coin Flip Single Fast.wav',
    'uiclick': 'UIClick_UI Button Analog Vintage Double Click Neutral Dry Press 11_ESM_BG.wav',
    'perc': 'Interface Percussion Snap.wav',
    'bag': 'CLOTHFlp_Action Inventory Open Flip Cloth Canvas Bag Slide Light 02_ESM_FG2.wav',
    'page': 'Encyclopedia Glossy Page Turn Muted.wav',
    'deny': 'Deny Muted.wav',
    'birds': 'TOONMisc_Bird Flutes 3_CB Sounddesign_APPlicable Sounds.wav',
})
wood_t = [2.27, 13.30, 20.87, 27.28]
cut_t = [0.15, 2.26, 4.34, 6.34, 8.48, 10.82]
# Weapons.
S['hitMedium'] = [[('cuts', peak('cuts', c, c + 0.45), 0.34, 0, 0), ('body', peak('body', b, b + 0.3), 0.25, -4, 0)] for c, b in zip(cut_t[2:], body_t)]
S['hitDagger'] = [[('cuts', peak('cuts', c, c + 0.45), 0.2, 0, 0), ('smack', peak('smack', 0.03, 0.62), 0.18, -8, 0)] for c in cut_t[:4]]
S['hitAxe'] = [[('woodhit', peak('woodhit', t, t + 0.7), 0.45, 0, 0), ('body', peak('body', b, b + 0.3), 0.25, -5, 0)] for t, b in zip(wood_t, body_t)]
S['steelHit'] = [[('file', peak('file', 0, 1.5), 0.5, 0, 0), ('lowring', peak('lowring', 0, 1), 0.6, -6, 0)]]
S['rageHit'] = [[('thud', peak('thud', t, t + 0.6), 0.45, 0, 0), ('lowring', peak('lowring', 0, 1), 0.6, -4, 0)] for t in [12.12, 15.11]]
S['poisonHit'] = [[('squelch', 0.0, 0.3, 0, 0), ('gurgle', 0.2, 0.6, -3, 0)]]
S['arcaneHit'] = [[('glass', 0.3, 0.8, 0, 0), ('body', peak('body', 2.20, 2.41), 0.2, -10, 0)]]
S['hurt'] = [[('body', peak('body', 2.20, 2.41), 0.25, 0, 0), ('smash', peak('smash', 0, 0.6), 0.25, -10, 0)]]
S['miss'] = [[('sweep', 0.03, 0.14, 0, 0)]]
S['landHard'] = [[('woodhit', peak('woodhit', 37.51, 38.2), 0.35, 0, 0)]]
# Spells and big blows.
S['castPoison'] = [[('gurgle', 0.0, 1.0, 0, 0)]]
S['castDark'] = [[('braam', 0.3, 1.2, 0, 0)]]
S['castWind'] = [[('storm', 20.0, 1.0, 0, 0), ('wind', 0.05, 0.6, -4, 0)]]
S['castZap'] = [[('arc', 0.0, 0.8, 0, 0), ('elec', 0.02, 0.5, -10, 0)]]
S['lightning'] = [[('thunder', peak('thunder', 3.0, 6.1), 1.6, 0, 0)]]
S['boom'] = [[('boomA', 0.25, 1.8, 0, 0)]]
S['quake'] = [[('boomB', 0.25, 2.2, 0, 0)]]
S['meteor'] = [[('boomC', 0.25, 2.0, 0, 120), ('fire', 0.15, 0.6, -4, 0)]]
S['fireBurst'] = [[('fire', 0.15, 1.3, 0, 0), ('boomA', 0.25, 1.0, -10, 0)]]
S['iceBurst'] = [[('crushed', 0.25, 1.1, 0, 0), ('freeze', 0.08, 0.8, -4, 0)]]
S['holyBurst'] = [[('chord', peak('chord', 0.25, 1.48), 1.2, 0, 0), ('light', 0.0, 1.0, -6, 0)]]
S['freeze'] = [[('crushed', 0.25, 1.0, 0, 0)]]
S['crack'] = [[('snap', 0.5, 0.8, 0, 0)]]
S['gust'] = [[('storm', 60.0, 1.2, 0, 0), ('wind', 0.05, 0.8, -3, 0)]]
S['heal'] = [[('astonish', 3.0, 1.4, 0, 0), ('light', 0.0, 0.8, -8, 0)]]
S['portal'] = [[('astral', 5.0, 1.4, 0, 0)]]
S['blink'] = [[('confetti', 0.1, 0.4, 0, 0)]]
S['dash'] = [[('debris', 0.3, 0.6, 0, 0)]]
S['roar'] = [[('roar', 0.2, 2.0, 0, 0)]]
# The Acrobat's fireworks.
S['acfirework'] = [[('whistles', 4.0, 1.3, 0, 0)]]
S['acburst'] = [[('fireworks', peak('fireworks', 4.1, 4.8), 1.2, 0, 0)]]
# Jingles: short, bright, and each its own.
S['levelup'] = [[('powerup', 0.05, 1.2, 0, 0), ('entry', 0.0, 0.5, -6, 0)]]
S['questAccept'] = [[('plucks', 0.0, 0.6, 0, 0)]]
S['questDone'] = [[('twinkle', 0.0, 1.2, 0, 0), ('entry', 0.0, 0.5, -8, 0)]]
S['rareDrop'] = [[('musicbox', 0.04, 0.9, 0, 0), ('ting', 0.1, 0.5, -8, 60)]]
S['itemGet'] = [[('glassy', 0.0, 0.35, 0, 0)]]
S['jobUp'] = [[('alert', 0.0, 0.3, 0, 0), ('powerup', 0.05, 1.2, -3, 120)]]
S['bossDefeated'] = [[('fireworks', peak('fireworks', 2.6, 3.1), 1.8, 0, 0), ('twinkle', 0.0, 1.2, -6, 300)]]
S['death'] = [[('downer', 0.12, 2.6, 0, 0)]]
S['phase'] = [[('horn', 0.12, 3.0, 0, 0)]]
# Menus and pickups.
S['coin'] = [[('ting', 0.1, 0.4, 0, 0)]]
S['pickup'] = [[('pop', 0.0, 0.15, 0, 0)]]
S['buy'] = [[('coinflip', 0.0, 0.5, 0, 0), ('ting', 0.1, 0.4, -6, 80)]]
S['click'] = [[('uiclick', 0.0, 0.15, 0, 0)]]
S['open'] = [[('perc', 0.0, 0.3, 0, 0)]]
S['openBag'] = [[('bag', 0.05, 0.4, 0, 0)]]
S['openPaper'] = [[('page', 0.0, 0.3, 0, 0)]]
S['denied'] = [[('deny', 0.0, 0.35, 0, 0)]]
S['skillUp'] = [[('kalimba', 0.0, 0.45, 0, 0)]]
# The world.
S['townBell'] = [[('bells', 1.6, 4.4, 0, 0)]]
S['waveWash'] = [[('waves', 2.0, 4.0, 0, 0)]]
S['birdTrill'] = [[('birds', 0.04, 0.75, 0, 0)]]

# ----- From the 2024 bundle: better takes for some of the above, and the sounds it adds -----
F.update({
    'dizzy': 'Cartoon Confused Dizzy.wav',
    'bubbles': 'Cartoon Bubbles Short.wav',
    'syringe': 'TOONPop_Syringe Pop 4_RogueWaves_KawaiiUI.wav',
    'oscursor': 'UIClick_Operating System UI Cursor_RogueWaves_KawaiiUI.wav',
    'handpop': 'UIClick_Hand Pop UI Diminished 1_RogueWaves_KawaiiUI.wav',
    'click33': 'UIClick_UI Click 33_CB Sounddesign_ACTIVATION2.wav',
    'window': 'UIMvmt_Window Open Thin 05_RSCPC_USIN.wav',
    'confirm': 'UIAlert_Confirm Middle 12_RSCPC_USIN.wav',
    'feedback': 'UIMisc_Feedback 36 up_CB Sounddesign_ACTIVATION2.wav',
    'pwr': 'Short_PowerUp_005.wav',
    'arcs': 'Bluezone_BC0299_electricity_surge_discharge_electrical_arc_crackling_002_01.wav',
    'explode': 'EXPLReal_Medium Realistic Explosion 15_DDUMAIS_NONE.wav',
    'nuke': 'EXPLDsgn_Nuclear Explosion 07_DDUMAIS_NONE.wav',
    'bigboom': 'Bluezone_BC0294_modern_cinematic_impact_boom_003.wav',
    'cinehit': 'DSGNBoom_Cinematic Hit_MWSFX_CF 05.wav',
    'stone': 'Bluezone_BC0297_stone_impact_015.wav',
    'stone2': 'Bluezone_BC0297_stone_impact_041.wav',
    'axe': 'WEAPAxe_Long Two-Handed Axe Flesh Hit_JSE_MW.wav',
    'shield': 'WEAPArmr_Metal Shield Block Hits_JSE_MW.wav',
    'drops': 'WOODImpt_Drops20_InMotionAudio_Wood.wav',
    'glassbrk': 'GLASBrk_Glass Break Hit_04_MWSFX_GL.wav',
    'growl': 'GRWL ROAR ANGRY.wav',
    'vortex': 'DSGN VORTEX IN.wav',
    'scifi': 'WHSH_Pure SciFi-Whoosh Fast 03_RSCPC_DW.wav',
    'airy': 'WHSH_Airy-Whoosh Wind Gust 11_RSCPC_DW.wav',
    'bwater': 'Bluezone_BC0298_designed_water_impact_006.wav',
    'sizzle': 'ICEMisc_Ice Sizzle_05_MWSFX_SEC.wav',
    'energy': 'WEAPSwrd_Mecha Energy Sword Cut_RogueWaves_AnimeStudio.wav',
    'kite': 'BIRDPrey_Red Kite Call, Screech, Bird of Prey, Hawk,_Jake Fielding_Red Kite_02.wav',
    'owls': 'BIRDPrey_Spring Night Deciduous Forest Many Tawny Owls Wind Leaves Rustling_JSE_FA.wav',
    'tit': 'BIRDSong_Spring Noon Coniferous Forest Coal Tit Wind_JSE_FA.wav',
    'drip': 'WATRDrip_SingleDrip03_InMotionAudio_CaveDesign.wav',
    'oak': 'Wind - Oak - Calm - Close - Inside Canopy - XY - MKH8060.wav',
    'wheat': 'AMBRurl_Field Wheat Dry Sizzle Insects Wind Soft_SYSO_SYSO011.wav',
    'lake': 'WATRLap_Lake Small Sandy Beach Loop_Cascadia Shore Waves.wav',
    'scrape': 'WOODFric_Scrapes09_InMotionAudio_Wood.wav',
    'handbell': 'BELLHand_Metallic Bell_ 22_MWSFX_SEC.wav',
})
axe_t = [0.02, 2.45, 4.84, 7.25]
shield_t = [0.01, 2.44, 4.81, 7.33]
# Status and impacts.
S['stun'] = [[('dizzy', 0.0, 0.8, 0, 0)]]
S['hitAxe'] = [[('axe', peak('axe', t, t + 0.4), 0.38, 0, 0), ('body', peak('body', b, b + 0.3), 0.25, -6, 0)] for t, b in zip(axe_t, body_t)]
S['steelHit'] = [[('shield', peak('shield', t, t + 0.5), 0.45, 0, 0)] for t in shield_t]
S['poisonHit'] = [[('squelch', 0.0, 0.3, 0, 0), ('bubbles', 0.0, 0.45, -2, 0)]]
S['castPoison'] = [[('bubbles', 0.0, 0.5, 0, 0), ('gurgle', 0.0, 0.9, -6, 0)]]
S['waterHit'] = [[('bwater', 0.0, 0.9, 0, 0), ('water2', 0.13, 0.5, -6, 0)]]
S['ice'] = [[('sizzle', 0.25, 0.9, 0, 0)]]
S['zap'] = [[('arcs', 0.0, 0.5, 0, 0)]]
S['castZap'] = [[('arcs', 0.6, 0.9, 0, 0), ('elec', 0.02, 0.5, -8, 0)]]
S['boom'] = [[('explode', 0.0, 1.4, 0, 0)]]
S['quake'] = [[('nuke', 0.0, 2.6, 0, 0)]]
S['meteor'] = [[('bigboom', 0.0, 2.2, 0, 120), ('fire', 0.15, 0.6, -4, 0)]]
S['blast'] = [[('cinehit', 0.1, 1.6, 0, 0)]]
S['stomp'] = [[('stone', 0.0, 0.45, 0, 0), ('body', peak('body', 3.20, 3.49), 0.25, -4, 0)]]
S['landHard'] = [[('stone2', 0.0, 0.5, 0, 0)]]
S['roar'] = [[('growl', 0.05, 2.1, 0, 0)]]
S['portal'] = [[('vortex', 0.0, 1.8, 0, 0)]]
S['dash'] = [[('scifi', 0.18, 0.75, 0, 0)]]
S['gust'] = [[('airy', 0.5, 1.4, 0, 0)]]
S['castWind'] = [[('airy', 0.5, 0.9, 0, 0)]]
S['crescentcut'] = [[('energy', 0.07, 0.85, 0, 0)]]
# Buffs.
S['powerup'] = [[('pwr', 0.27, 1.9, 0, 0)]]
S['partyBuff'] = [[('pwr', 0.27, 1.9, 0, 0), ('chord', peak('chord', 0.25, 1.48), 0.9, -10, 0)]]
S['buff'] = [[('pwr', 4.32, 0.85, 0, 0)]]
S['suzu'] = [[('handbell', 0.05, 1.8, 0, 0)]]
S['holyChime'] = [[('handbell', 0.05, 1.2, 0, 0), ('light', 0.0, 0.8, -8, 0)]]
# What things are made of (struck).
S['matStone'] = [[('stone', 0.0, 0.35, 0, 0)]]
S['matWood'] = [[('drops', 0.04, 0.38, 0, 0)]]
S['matArmor'] = [[('shield', peak('shield', 9.69, 10.2), 0.45, 0, 0)]]
S['matCrystal'] = [[('glassbrk', 0.08, 0.55, 0, 0)]]
S['matSlime'] = [[('bubbles', 0.0, 0.45, 0, 0)]]
# Menus.
S['pickup'] = [[('syringe', 0.0, 0.2, 0, 0)]]
S['cursor'] = [[('oscursor', 0.0, 0.08, 0, 0)]]
S['close'] = [[('handpop', 0.0, 0.22, 0, 0)]]
S['cancel'] = [[('handpop', 0.0, 0.22, 0, 0)]]
S['click'] = [[('click33', 0.0, 0.14, 0, 0)]]
S['open'] = [[('window', 0.0, 0.6, 0, 0)]]
S['questAccept'] = [[('confirm', 0.0, 0.6, 0, 0)]]
S['skillUp'] = [[('feedback', 0.0, 0.5, 0, 0)]]
# The world around you.
S['hawkCry'] = [[('kite', 0.18, 1.75, 0, 0)]]
S['owl'] = [[('owls', 0.05, 0.95, 0, 0)]]
S['birdChirp'] = [[('tit', 2.0, 1.4, 0, 0)]]
S['drip'] = [[('drip', 0.03, 0.12, 0, 0)]]
S['leafRustle'] = [[('oak', 10.0, 2.0, 0, 0)]]
S['cricket'] = [[('wheat', 10.0, 2.0, 0, 0)]]
S['waveWash'] = [[('lake', 6.8, 1.6, 0, 0)]]
S['woodCreak'] = [[('scrape', 0.04, 0.5, 0, 0)]]

missing=[k for k,v in F.items() if not os.path.exists(SRC+v)]
if missing: sys.exit(f"missing {missing}")
only = sys.argv[1:]
for name, vs in S.items():
    if only and name not in only:
        continue
    for i, layers in enumerate(vs):
        build(f'{name}{i + 1}' if len(vs) > 1 else name, layers)
print(json.dumps({k: len(v) for k, v in S.items()}))
