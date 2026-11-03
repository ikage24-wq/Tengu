# Builds the finished effects in assets/audio/rec (src/audio/recorded.js) from the Sonniss GDC 2026 bundle:
# each is layers cut from its recordings, mixed, trimmed, faded and peak-normalised. Set SONNISS to the bundle's wavs.
import subprocess, array, os, json, sys
FF = os.environ.get('FFMPEG', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'))
SRC = os.environ.get('SONNISS', 'C:/Users/admin/tv/sound-check/sonniss/src').rstrip('/') + '/'  # the bundle's .wav files, unzipped flat
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

only = sys.argv[1:]
for name, vs in S.items():
    if only and name not in only:
        continue
    for i, layers in enumerate(vs):
        build(f'{name}{i + 1}' if len(vs) > 1 else name, layers)
print(json.dumps({k: len(v) for k, v in S.items()}))
