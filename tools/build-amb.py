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
    # (2026-11-08: a bed for every other kind of place.)
    # Water lapping against a harbour wall (the harbours).
    'harborwater': ('Jake Fielding - Industrial Harbor/WATRWave_Water Lapping against port_Jake Fielding_Industrial Harbor.wav', 20, 40, 0),
    # A village: a chorus of birds, a cuckoo, people about their day far off (the towns).
    'townday': ('Sonik Sound Library - Spatial Countryside/AMBBird_Ambience, Rural, Residencial, Birds Chorus, Cuckoo, Light Human Activity_KS_Spatial Counstryside-Surround_KSL_KS011.wav', 40, 40, 0),
    # A cave's own air: a low hollow room tone with drips far off (the caves).
    'cave': ('InMotionAudio - Cave Design/AMBUndr_CaveDesign01_InMotionAudio_CaveDesign.wav', 1, 17, 0),
    # Wind over high grass, pipits and insects (the crags and mountain ledges).
    'highland': ('Just Sound Effects - Highlands of Norway/AMBSwmp_Meadow Pipits calling many Insects humming Wind blowing through Grass_JSE_HoN_Stereo.wav', 20, 40, 0),
    # Trees in a night wind, quiet (the ruins).
    'nightwood': ('Systematic Sound - General Ambience Series - Nightscapes 01/AMBForst_Nighttime-Woodlands Windy Trees Rustling Quiet_SYSO_SYSO009.wav', 60, 40, 0),
    # A soft wind howling high up (the sky islands).
    'softwind': ('Sonik Sound Library - Spatial Countryside/WIND_Wind, Soft Wind Howling, Soft Leaves Rustle on Concrete_KS_Spatial Counstryside-Stereo_KSL_KS011.wav', 20, 40, 0),
    # A deep, mystic hum under the roots (Rootwood Hollow).
    'mystic': ('Epic Stock Media - Strange Game Ambient Loops 3/DSGNSynth_Dark Loop Mystic Forest Tonal Steady Synth_ESM_SGA3.wav', 5, 40, 0),
    # Water flowing under the surface (the Sunken Aquarium Palace).
    'underwater': ('InMotionAudio - Submerge/WATRFlow_WaterFlow21_InMotionAudio_Submerge.wav', 1, 28, 0),
    # A crowd far off, families laughing and squealing (the Clockwork Carnival).
    'fairground': ('Epic Stock Media - Public Spaces - Crowds Walla and Everyday Ambiences/AMBPubl_Cruise Ship Walla Distant Adults Children Laughing Screaming 4_ESM_CPS.wav', 30, 40, 0),
    # A shimmer of small bells and metal taps (the Star Observatory).
    'shimmer': ('Epic Stock Media - Strange Game Ambient Loops 3/MAGShim_Shimmer Loop Small Bell Metal Taps_ESM_SGA3.wav', 1, 38, 0),
    # A cauldron bubbling and popping over a fire (the Candy Volcano).
    'cauldron': ("344 Audio - Haunting Ambiences Vol. 5/FIRECrkl_Fire Crackling, Popping, Witch's Cauldron_344 Audio_Haunting Ambiences Vol 5.wav", 40, 40, 0),
    # Wind round a chimney, high and hollow (the Sky Whale's back).
    'chimney': ('InMotionAudio - Chimney Wind/WINDInt_ChimneyWind05_InMotionAudio_ChimneyWind.wav', 20, 40, 0),
    # A big hall full of hushed voices (the Dream Theatre's audience).
    'hall': ('Jake Fielding - Neutral Interior Walla/CRWDWalla_Neutral Interior Walla, Hushed Voices, Reverberant,_Jake Fielding_INT WALLA_03.wav', 20, 40, 0),
    # A quiet living room (indoors: your hut, the Sweethearts' rooms).
    'quietroom': ('Systematic Sound - General Ambience Series - Quiet Rooms 01/AMBRoom_Quiet Room Flat C Livingroom 02_SYSO_SYSO0013.wav', 30, 40, 0),
    # Rain on a window, steady (Moonlit Manor).
    'rainwindow': ('Jake Fielding - Interior Wind Rain and Storms/RAINInt_Heavy Rain on Window,  Constant _JF_INT Storm.wav', 1, 26, 0),
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
