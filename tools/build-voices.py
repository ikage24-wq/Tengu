# Builds the monsters' voices (assets/audio/rec/mv<Family><Event><take>.mp3, listed in
# src/audio/recorded.js, played by src/audio/sfx.js `mobVoice`) from the Sonniss GDC 2024 and 2026
# bundles (royalty free inside the game; assets/audio/SOURCES.md): one call cut from a recording,
# pitched (a small, cute thing up, a big one down), faded and peak-normalised. Each family has three
# moments (Spot: it sees you; Hurt: it's hit; Die: it's beaten), two takes each.
# Usage: python tools/build-voices.py [family ...]   (SONNISS_ALL: the folder of packs)
import os, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FF = os.environ.get('FFMPEG', os.path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'))
SRC = os.environ.get('SONNISS_ALL', 'C:/Users/admin/Desktop/claudeo').rstrip('/') + '/'
OUT = os.path.join(ROOT, 'assets', 'audio', 'rec')

S = {
    'hatch': '344 Audio - Dinosaurs Vol. 1/ANMLRept_Hatchling Calling Out_344 Audio_Dinosaurs.wav',
    'chick': 'Mechanical Wave - Farm Animals/BIRDFowl_Chick Squawks-02_MWSFX_FA.wav',
    'goose': 'Mechanical Wave - Farm Animals/BIRDFowl_Goose Baby And Adult-02_MWSFX_FA.wav',
    'meow': 'Mechanical Wave - Sound Effects Collection/ANMLCat_Cat Moew_ 03_MWSFX_SEC.wav',
    'bark': '344 Audio - Dog Vocalisations Vol. 1/ANMLDog_Dog Barks, Multiple, Indoors, Perspective,_344 Audio_Dog Vocalisations_02.wav',
    'grunt': '344 Audio - Dog Vocalisations Vol. 1/ANMLDog_Dog Shuffle, Grunt, Movement, Lying Down_344 Audio_Dog Vocalisations.wav',
    'herbivore': '344 Audio - Dinosaurs Vol. 2/ANMLRept_Large Herbivore Roar 01_344 Audio_Dinosaurs Vol 2.wav',
    'raptor': '344 Audio - Dinosaurs Vol. 1/ANMLRept_Raptor Flair_344 Audio_Dinosaurs.wav',
    'kite': 'Jake Fielding - Red Kite/BIRDPrey_Red Kite Call, Screech, Bird of Prey, Hawk,_Jake Fielding_Red Kite_02.wav',
    'rooster': 'Mechanical Wave - Farm Animals/BIRDFowl_Rooster Call-12_MWSFX_FA.wav',
    'insect': 'SoundBits - Vox Bestiae - Source Elements/CREAInsc_Insectoid Creature Tremble Attack Long 1_SNDBTS_VB-SE.wav',
    'laugh': 'SoundBits - Vox Hominis - Human Effort Voices/VOXLaff_Laughing Female 02 06_SNDBTS_VH.wav',
    'shimmer': 'Epic Stock Media - Anime Game/DSGNStngr_Power Up Bright Positive Successful Light Saturation Crash Shimmer 05_ESM_AG.wav',
    'elf': 'Cinematic Sound Design - Cartoon Bloopers/Character Elf It Shall Be Done.wav',
    'dizzy': 'Cinematic Sound Design - Cartoon Bloopers/Cartoon Confused Dizzy.wav',
    'squeal': 'Epic Stock Media - Humanoid Creatures Vol 4 - Monstrous and Undead Creature Vocalization Sound Sets/HMNBrth_Construction Kit Male Screeching Breath Inhale Weak Squeal 05_ESM_HC4.wav',
    'creak': 'Rogue Waves - Creaking Door/DOORCreak_Wooden Door, Opening and Closing 09_RogueWaves_CreakingDoor.wav',
    'hinge': 'Jake Fielding - Squeaky Gates/DOORGate_Wooden Metal Hinge Creaks_Jake Fielding_Squeaky Gates.wav',
    'snap': 'InMotionAudio - Wood/WOODBrk_Snap09_InMotionAudio_Wood.wav',
    'treecrack': 'Mechanical Wave - Lumberjack/WOODBrk_Tree Crack and Fall-13_MWSFX_TJ.wav',
    'robogrowl': 'DavidDumais - Robotic Creatures Sound FX/CREAMisc_Creature 05 Long Growl 31_DDUMAIS_MCSFX.wav',
    'poweron': 'DavidDumais - Robotic Creatures Sound FX/CREAMisc_Creature Power On 14_DDUMAIS_MCSFX.wav',
    'ethereal': 'SoundBits - Vox Bestiae - Source Elements/CREAEthr_Ethereal Entity Grim Pain Long 4_SNDBTS_VB-SE.wav',
    'flutter': 'Epic Stock Media - Humanoid Creatures Vol 4 - Monstrous and Undead Creature Vocalization Sound Sets/VOXReac_Construction Kit Male Flutter Death Vocal Stuttered Long 05_ESM_HC4.wav',
    'gurgle': 'SoundBits - Vox Bestiae - Source Elements/CREAAqua_Aquatic Creature Gurgling 2_SNDBTS_VB-SE.wav',
    'bubbles': 'Cinematic Sound Design - Cartoon & Animation Vol 2/Cartoon Bubbles Short.wav',
    'frog': 'Epic Stock Media - Synthesized Nature Loops and Sounds/ANMLAmph_Animal Frog Echo Short Squished Frequency Formant 03_ESM_SNLS.wav',
    'yellF': "344 Audio - Anime Fight Voices Vol. 2/VOXFem_Anime, Warrior Elf Princess Aggressive Yell_344 Audio_Anime Fight Voices Vol 2_14.wav",
    'exhaleF': '344 Audio - Anime Fight Voices Vol. 2/VOXFem_Anime, Schoolgirl Fight Exhale 15_344 Audio_Anime Fight Voices Vol 2.wav',
    'breathF': '344 Audio - Anime Fight Voices Vol. 2/VOXFem_Anime, Adult Warrior Breaths 40_344 Audio_Anime Fight Voices Vol 2.wav',
    'aiyah': "344 Audio - Anime Fight Voices Vol. 1/VOXMale_Warrior Opponent Attack, 'Ai yah' 2_344 Audio_Anime Fight Voices.wav",
}

# family: { Event: [(source, start s, length s, pitch x), ...two takes] }. Pitch x 1.3 is about
# four and a half semitones up (and a little quicker); lengths are of the source, before pitching.
V = {
    # Small animals: a hatchling's chirp, chicks, a kitten-high meow, a yip.
    'Critter': {
        'Spot': [('hatch', 0.06, 0.66, 1.25), ('meow', 1.36, 0.5, 1.35)],
        'Hurt': [('chick', 2.67, 0.32, 1.1), ('bark', 3.53, 0.15, 1.9)],
        'Die': [('hatch', 0.92, 0.55, 1.1), ('meow', 2.26, 0.6, 1.2)],
    },
    # Bears, wolves, the big ones: a bark and a grunt down low, a great beast's roar.
    'Beast': {
        'Spot': [('bark', 1.64, 0.3, 0.8), ('grunt', 0.39, 0.36, 0.85)],
        'Hurt': [('bark', 3.53, 0.2, 0.9), ('grunt', 1.13, 0.18, 0.9)],
        'Die': [('herbivore', 5.09, 0.95, 1.3), ('raptor', 0.02, 0.75, 0.95)],
    },
    # Birds and bats: a hawk's call, a rooster's crow quickened, a chick's squawk.
    'Bird': {
        'Spot': [('kite', 5.42, 0.6, 1.2), ('rooster', 0.52, 0.5, 1.4)],
        'Hurt': [('kite', 10.24, 0.35, 1.3), ('chick', 0.08, 0.3, 0.95)],
        'Die': [('kite', 15.3, 0.7, 1.1), ('goose', 2.19, 0.5, 1.25)],
    },
    # Bees, mites and moths: an insect creature's tremble, sped up into a buzz.
    'Buzz': {
        'Spot': [('insect', 0.55, 0.6, 1.8), ('insect', 0.02, 0.4, 2.0)],
        'Hurt': [('insect', 0.02, 0.25, 2.2), ('insect', 1.0, 0.25, 2.0)],
        'Die': [('insect', 0.55, 0.9, 1.4), ('insect', 1.2, 0.7, 1.6)],
    },
    # Sprites and wisps: a giggle high and quick, a twinkle.
    'Sprite': {
        'Spot': [('laugh', 0.33, 0.37, 1.4), ('shimmer', 0.1, 0.5, 1.3)],
        'Hurt': [('exhaleF', 0.07, 0.25, 1.5), ('laugh', 0.17, 0.1, 1.5)],
        'Die': [('shimmer', 0.1, 0.62, 1.0), ('laugh', 0.33, 0.37, 1.15)],
    },
    # Goblins and imps: a cartoon elf's cheeky line, a dizzy wobble, a squeak.
    'Goblin': {
        'Spot': [('elf', 0.01, 0.42, 1.25), ('dizzy', 0.0, 0.48, 1.1)],
        'Hurt': [('squeal', 0.0, 0.35, 1.4), ('aiyah', 0.02, 0.35, 1.6)],
        'Die': [('dizzy', 0.0, 0.48, 0.9), ('squeal', 0.0, 0.85, 1.2)],
    },
    # Trees, saplings and mandrakes: wood creaking like a groan, a twig's snap, a trunk cracking.
    'Plant': {
        'Spot': [('creak', 4.63, 0.45, 1.0), ('hinge', 9.86, 0.42, 0.9)],
        'Hurt': [('snap', 0.56, 0.2, 1.0), ('hinge', 11.57, 0.3, 1.1)],
        'Die': [('treecrack', 2.28, 0.62, 1.1), ('creak', 0.76, 0.25, 0.8)],
    },
    # Golems, armour, clockwork: a machine creature powering up, a mechanical growl.
    'Stone': {
        'Spot': [('poweron', 0.01, 0.6, 1.0), ('robogrowl', 0.12, 0.6, 1.2)],
        'Hurt': [('robogrowl', 0.5, 0.25, 1.4), ('poweron', 0.6, 0.25, 1.3)],
        'Die': [('robogrowl', 0.12, 1.3, 0.8), ('poweron', 0.01, 1.4, 0.75)],
    },
    # Ghosts, dolls and spirits: a soft ethereal moan, a fluttering wail, raised and gentled.
    'Ghost': {
        'Spot': [('ethereal', 0.0, 0.7, 1.3), ('flutter', 0.02, 0.58, 1.3)],
        'Hurt': [('ethereal', 0.6, 0.3, 1.5), ('flutter', 0.76, 0.3, 1.5)],
        'Die': [('ethereal', 0.0, 1.5, 1.1), ('flutter', 0.76, 1.2, 1.2)],
    },
    # Sea folk and jellies: a gurgle, a frog's squish, bubbles.
    'Sea': {
        'Spot': [('gurgle', 0.02, 0.6, 1.3), ('frog', 0.0, 0.25, 1.0)],
        'Hurt': [('bubbles', 0.23, 0.2, 1.0), ('frog', 0.0, 0.25, 1.3)],
        'Die': [('gurgle', 1.5, 0.8, 1.1), ('bubbles', 0.0, 0.43, 0.8)],
    },
    # Witches, ladies, captains: anime fight voices.
    'People': {
        'Spot': [('yellF', 0.07, 0.5, 1.1), ('aiyah', 0.02, 0.64, 1.0)],
        'Hurt': [('exhaleF', 0.07, 0.25, 1.0), ('breathF', 0.01, 0.18, 1.0)],
        'Die': [('yellF', 0.07, 1.04, 1.0), ('aiyah', 0.3, 0.36, 0.85)],
    },
}


def take(name, src, start, length, pitch):
    tmp = os.path.join(OUT, name + '.wav')
    fade = length / pitch * 0.35
    af = (f'aformat=sample_rates=44100:channel_layouts=stereo,asetrate={44100 * pitch:.0f},aresample=44100,'
          f'afade=t=in:d=0.004,afade=t=out:st={length / pitch - fade:.3f}:d={fade:.3f}')
    subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-ss', f'{start:.3f}', '-t', f'{length:.3f}', '-i', SRC + S[src], '-af', af, tmp], check=True)
    vd = subprocess.run([FF, '-nostdin', '-i', tmp, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mx = float(vd.split('max_volume: ')[1].split(' dB')[0])
    dst = os.path.join(OUT, name + '.mp3')
    subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-i', tmp, '-af', f'volume={-1 - mx}dB', '-c:a', 'libmp3lame', '-b:a', '96k', dst], check=True)
    os.remove(tmp)


for fam in sys.argv[1:] or V:
    for ev, takes in V[fam].items():
        for i, t in enumerate(takes):
            take(f'mv{fam}{ev}{i + 1}', *t)
    print(fam, 'done')
