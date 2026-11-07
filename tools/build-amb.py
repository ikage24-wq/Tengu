# Cuts the ambience loops (assets/audio/amb/*.mp3, played by src/audio/ambience.js) out of the
# Sonniss GDC bundle recordings (royalty free inside the game; assets/audio/SOURCES.md): a stretch
# of each recording, folded to stereo, its end cross-faded into its start so it loops with no seam.
# The bundles have to be downloaded by hand first; point SONNISS_ALL at the folder of packs.
# Usage: python tools/build-amb.py [name ...]
import os, subprocess, sys, wave, array

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FF = os.environ.get('FFMPEG', os.path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'))
SRC = os.environ.get('SONNISS_ALL', 'C:/Users/admin/Desktop/claudeo').rstrip('/') + '/'
OUT = os.path.join(ROOT, 'assets', 'audio', 'amb')
TMP = os.path.join(OUT, '_tmp.wav')

# name: (pack/file, start s, length s, gain dB)
LOOPS = {
    # Small waves lapping a sandy beach (Dawnlight Beach).
    'shore': ('Nick McMahan - Cascadia Shore Waves/WATRLap_Lake Small Sandy Beach Loop_Cascadia Shore Waves.wav', 20, 40, 0),
    # A marina: boats knocking at their moorings, rope creaking, water slapping (Sunny Dock).
    'marina': ('Rogue Waves - Yacht & Marina/AMBNaut_Atmos, EXT Marina, boats, rope creaking,_RogueWaves_YachtMarina_11.wav', 5, 40, 0),
    # A deciduous forest at noon: a gentle wind in the leaves, birds far off (the woods).
    'forest': ('Justsoundeffects - Forest Ambiences/AMBForst_Spring Noon Deciduous Forest Gentle Wind Leaves Rustling Blackbird Raven in Background_JSE_FA.wav', 20, 40, 0),
    # A field on a warm day: dry grass, insects, a soft wind (the meadows).
    'field': ('Systematic Sound - General Ambience Series - Rural Countryside 01/AMBRurl_Field Wheat Dry Sizzle Insects Wind Soft_SYSO_SYSO011.wav', 30, 40, 0),
}
FADE = 3.0  # seconds cross-faded at the loop point
RATE = 44100


def build(name):
    rel, start, length, gain = LOOPS[name]
    src = SRC + rel
    # A stretch long enough for the loop and its fade, as 16-bit stereo.
    subprocess.run([FF, '-y', '-loglevel', 'error', '-ss', str(start), '-t', str(length + FADE), '-i', src,
                    '-ac', '2', '-ar', str(RATE), '-af', f'volume={gain}dB', '-sample_fmt', 's16', TMP], check=True)
    with wave.open(TMP, 'rb') as w:
        data = array.array('h', w.readframes(w.getnframes()))
    n = int(length * RATE) * 2
    f = int(FADE * RATE) * 2
    out = data[:n]
    # The tail past the loop point fades into the start: the loop's last moment leads straight
    # back into its first.
    for i in range(0, f, 2):
        k = i / f
        for c in (0, 1):
            out[i + c] = int(data[n + i + c] * (1 - k) + data[i + c] * k)
    with wave.open(TMP, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(out.tobytes())
    dst = os.path.join(OUT, f'{name}.mp3')
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', TMP, '-b:a', '112k', dst], check=True)
    os.remove(TMP)
    print(f'{name}: {os.path.getsize(dst) // 1024} KB')


os.makedirs(OUT, exist_ok=True)
for name in sys.argv[1:] or LOOPS:
    build(name)
