# Builds the Mochi voices (assets/audio/rec/mochi<Style><take>.mp3, listed in src/audio/recorded.js,
# played by src/audio/sfx.js `mochiVoice` at each Mochi's own pitch) from the Sonniss GDC bundles
# (royalty free inside the game; assets/audio/SOURCES.md): a short call cut from a recording, pitched
# into a small, cute voice, faded and peak-normalised. Eight styles (data/mochi-genes.js VOICES), two
# takes each; the mood (happy, sad, sleepy, a call) is played by pitch and level (sfx.js).
#   chirp   chicks chirping
#   coo     a gosling's soft peeps, a touch lower
#   squeak  a dry-ice squeak that sounds just like a mouse
#   trill   a bird flute's trill
#   peep    a hatchling calling out, pitched way up
#   hum     a soft whistle, pitched down into a hum
#   purr    a cat's mew, made kitten-small
#   boop    a squished frog's formant, pitched up into a boop
# Usage: python tools/build-mochi-voices.py   (SONNISS_ALL: the folder of packs)
import os, subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FF = os.environ.get('FFMPEG', os.path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'))
SRC = os.environ.get('SONNISS_ALL', 'C:/Users/admin/Desktop/claudeo').rstrip('/') + '/'
OUT = os.path.join(ROOT, 'assets', 'audio', 'rec')

S = {
    'chick': 'Mechanical Wave - Farm Animals/BIRDFowl_Chick Squawks-02_MWSFX_FA.wav',
    'gosling': 'Mechanical Wave - Farm Animals/BIRDFowl_Goose Baby And Adult-02_MWSFX_FA.wav',
    'mouse': 'Epic Stock Media - HD Game Materials/ICEFric_Dry Ice Squeak Metal Animal Mouse Imitation Short 07_ESM_HDGM.wav',
    'flute': 'CB_Sounddesign - Applicable Sounds - Organic UI and Building Games SFX/TOONMisc_Bird Flutes 3_CB Sounddesign_APPlicable Sounds.wav',
    'hatch': '344 Audio - Dinosaurs Vol. 1/ANMLRept_Hatchling Calling Out_344 Audio_Dinosaurs.wav',
    'whistle': 'SoundBits - Vox Hominis - Human Effort Voices/WHSTHmn_Whistle Male 06 09_SNDBTS_VH.wav',
    'meow': 'Mechanical Wave - Sound Effects Collection/ANMLCat_Cat Moew_ 03_MWSFX_SEC.wav',
    'frog': 'Epic Stock Media - Synthesized Nature Loops and Sounds/ANMLAmph_Animal Frog Echo Short Squished Frequency Formant 03_ESM_SNLS.wav',
}

# style: [(source, start s, length s, pitch, low-pass Hz or None)] (two takes)
V = {
    'Chirp': [('chick', 3.9, 0.32, 1.15, None), ('chick', 5.33, 0.3, 1.2, None)],
    'Coo': [('gosling', 0.32, 0.34, 0.95, 5000), ('gosling', 5.28, 0.34, 0.9, 5000)],
    'Squeak': [('mouse', 0.107, 0.34, 1.0, None), ('mouse', 1.181, 0.25, 1.05, None)],
    'Trill': [('flute', 0.0, 0.6, 1.0, None), ('flute', 0.2, 0.5, 1.15, None)],
    'Peep': [('hatch', 0.064, 0.5, 1.5, None), ('hatch', 0.939, 0.5, 1.6, None)],
    'Hum': [('whistle', 0.776, 0.5, 0.85, 2400), ('whistle', 1.905, 0.35, 0.9, 2400)],
    'Purr': [('meow', 1.375, 0.5, 1.35, None), ('meow', 2.264, 0.55, 1.3, None)],
    'Boop': [('frog', 0.0, 0.33, 1.4, None), ('frog', 0.0, 0.25, 1.7, None)],
}


def take(name, src, start, length, pitch, lpf):
    tmp = os.path.join(OUT, name + '.wav')
    fade = length / pitch * 0.35
    af = (f'aformat=sample_rates=44100:channel_layouts=stereo,asetrate={44100 * pitch:.0f},aresample=44100,'
          + (f'lowpass=f={lpf},' if lpf else '')
          + f'afade=t=in:d=0.004,afade=t=out:st={length / pitch - fade:.3f}:d={fade:.3f}')
    subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-ss', f'{start:.3f}', '-t', f'{length:.3f}', '-i', SRC + S[src], '-af', af, tmp], check=True)
    vd = subprocess.run([FF, '-nostdin', '-i', tmp, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mx = float(vd.split('max_volume: ')[1].split(' dB')[0])
    dst = os.path.join(OUT, name + '.mp3')
    subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-i', tmp, '-af', f'volume={-1 - mx}dB', '-c:a', 'libmp3lame', '-b:a', '96k', dst], check=True)
    os.remove(tmp)
    # (How loud it sits after: for the trims in src/audio/recorded.js.)
    vd = subprocess.run([FF, '-nostdin', '-i', dst, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    print(name, 'mean', vd.split('mean_volume: ')[1].split(' dB')[0])


for style, takes in V.items():
    for i, t in enumerate(takes):
        take(f'mochi{style}{i + 1}', *t)
