# Cuts the prologue's sounds (data/story.js `prologue`, the cutscene's `sound` steps) out of the
# Sonniss GDC bundle recordings (royalty free inside the game; assets/audio/SOURCES.md) into
# assets/audio/rec, the way tools/build-rec.py does the fight sounds: each a stretch of one recording,
# shaped (pitch, filters, fades) and peak-normalised. Point SONNISS_ALL at the folder of packs.
# Usage: python tools/build-prologue-audio.py [name ...]
import os, subprocess, sys, array

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FF = os.environ.get('FFMPEG', os.path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'))
SRC = os.environ.get('SONNISS_ALL', 'C:/Users/admin/Desktop/claudeo').rstrip('/') + '/'
OUT = os.path.join(ROOT, 'assets', 'audio', 'rec')

# name: (pack/file, start s (or 'peak:a-b' to start just before the loudest moment in a..b), length s,
#        extra ffmpeg filters, peak dBFS)
SOUNDS = {
    # Her phone buzzing on the kotatsu's board: one long buzz.
    'phoneBuzz': ('Nikko Barrera-Amaya - Office hits/Lyd_SFX_38_Cell Phone Vibrations_7.wav', 0, 1.6, '', -4),
    # Her yawn, startled awake and still half asleep.
    'yawn': ('UberDuo - Inhale – Tanja – Character Playset/HMNBrth_Human, Adult, Female, Yawn 3_UberDuo_INHL.wav', 0, 2.62, '', -6),
    # The Queen's snore: a snort slowed right down into a big, round, cartoon SNRRRK.
    'snore': ('Mechanical Wave - Farm Animals/ANMLFarm_Pig Squeal and Snort-18_MWSFX_FA.wav', 0, 1.55, 'asetrate=48000*0.58,aresample=48000,lowpass=f=1600,equalizer=f=180:t=q:w=1:g=4', -5),
    # Her papers lifting off the table in the breeze.
    'pageFlutter': ('344 Audio - Antique Books/PAPRMisc_Antique Books Flicking Through Pages 11_344 Audio_Antiques - Books.wav', 0, 1.88, '', -8),
    # A soft, airy gust: the breeze from nowhere, the wind that blows the Mochi away, the gust at sea.
    'breeze': ('Rescopic Sound - Distinct Whooshes/WHSH_Airy-Whoosh Wind Gust 11_RSCPC_DW.wav', 0, 3.2, 'highpass=f=120', -5),
    # A bright little twinkle: the crown landing, the sprout coming up, the gust finding you.
    'twinkle': ('Cinematic Sound Design - User Interface/Button Arp Twinkle.wav', 0, 1.81, '', -8),
    # Fireworks far off over the village on festival night.
    'fireworkFar': ('Sonic Bat - Fireworks Ambience/SBfa_Distant Fireworks 005.wav', 'peak:5-90', 3.2, 'highpass=f=60', -10),
    # The faint ring under the falling star: a little mechanical alarm bell, far away.
    'alarmFaint': ('BluezoneCorp - Steampunk Mechanical Sounds/Bluezone_BC0282_steampunk_mechanical_metal_element_alarm_mechanism_001.wav', 0, 2.0, 'highpass=f=700,aecho=0.6:0.5:120:0.35', -16),
    # Three little music-box phrases: her goodnight, and the gust that finds you.
    'musicBoxA': ('Sonic Bat - Music Boxes/SBmb_Music Box A 013.wav', 0, 2.84, 'aecho=0.7:0.6:180|340:0.3|0.18', -8),
    'musicBoxB': ('Sonic Bat - Music Boxes/SBmb_Music Box B 028.wav', 0, 2.64, 'aecho=0.7:0.6:180|340:0.3|0.18', -8),
    'musicBoxC': ('Sonic Bat - Music Boxes/SBmb_Music Box C 059.wav', 0, 2.72, 'aecho=0.7:0.6:180|340:0.3|0.18', -8),
}


def loudest(path, a, b):
    raw = subprocess.run([FF, '-nostdin', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', path, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True).stdout
    x = array.array('h')
    x.frombytes(raw)
    m = max(range(len(x)), key=lambda i: abs(x[i]))
    return a + max(0.0, m / 8000 - 0.25)


def peak_db(path):
    out = subprocess.run([FF, '-nostdin', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    for line in out.splitlines():
        if 'max_volume' in line:
            return float(line.split('max_volume:')[1].split('dB')[0])
    return 0.0


def build(name):
    src, start, length, extra, target = SOUNDS[name]
    path = SRC + src
    if isinstance(start, str) and start.startswith('peak:'):
        a, b = (float(v) for v in start[5:].split('-'))
        start = loudest(path, a, b)
    tmp = os.path.join(OUT, f'_{name}.wav')
    fade = min(0.35, length * 0.25)
    chain = ','.join(f for f in [extra, f'afade=t=in:d=0.01', f'afade=t=out:st={length - fade:.3f}:d={fade:.3f}'] if f)
    subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-ss', str(start), '-t', str(length), '-i', path, '-ac', '2', '-ar', '48000', '-af', chain, tmp], check=True)
    gain = target - peak_db(tmp)
    subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-i', tmp, '-af', f'volume={gain:.2f}dB', '-c:a', 'libmp3lame', '-q:a', '4', os.path.join(OUT, f'{name}.mp3')], check=True)
    os.remove(tmp)
    print(f'{name}: {start:.2f}s +{length}s, {gain:+.1f} dB')


if __name__ == '__main__':
    for n in sys.argv[1:] or SOUNDS:
        build(n)
