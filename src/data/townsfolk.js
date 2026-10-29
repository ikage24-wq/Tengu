// The people (and pets) who live in each town and go about their day there, each tied to the
// town's own places: apprentices at Sprout's archery range (and a cat asleep on the plaza tree's bough), a sailor hauling crates to the ship at
// the harbor, trainees at the crag's dummies, students at the grove's rune circle. They're drawn
// from time alone (render/townlife.js), so they cost the world nothing.
//
//   kind     'person', 'kid' (a smaller person), 'cat', 'dog', or 'chick'
//   seed     picks a person's look; `look` overrides parts of it (the town's colours)
//   gear     what they hold (item ids)
//   act      what they do all day:
//     stroll  walk between a and b, pausing at each end (`speed`, `pause`, `carry` a crate)
//     chase   run between a and b, a kid's game; `lag` follows a playmate that many seconds behind
//     shoot   loose arrows from x at the targets' xs, one at a time
//     train   swing combos at a dummy in front of them
//     spar    trade blows with a partner facing them (`lead` takes the first swing)
//     smith   hammer at an anvil
//     cast    practise spells
//     read    read a book that floats in front of them
//     chat    stand and talk, facing `facing`
//     nap     (pets) curl up and sleep, at `y` if not on the ground
//     peck    (chicks) hop about between a and b
//   lines    what they say now and then; `greet` when you walk up to them

export const TOWNSFOLK = {
  sprout: [
    { id: 'sp-apprentice1', name: 'Wren', kind: 'person', seed: 11, look: { outfitColor: '#bff0dc' }, gear: { weapon: { id: 'bow_50' } },
      act: { type: 'shoot', x: 2238, facing: 1, targets: [2300, 2360, 2420] }, lines: ['Steady... breathe...', 'Bullseye! ...almost.', 'Kestrel says aim small, miss small.'] },
    { id: 'sp-apprentice2', name: 'Alder', kind: 'person', seed: 23, look: { outfitColor: '#d9f7c7' }, gear: { weapon: { id: 'bow_50' } },
      act: { type: 'shoot', x: 2200, facing: 1, targets: [2360, 2420], offset: 1.6 }, lines: ['My arm hurts.', 'One more quiver, then lunch!'] },
    { id: 'sp-kid1', name: 'Pippa', kind: 'kid', seed: 37, act: { type: 'chase', a: 1260, b: 1680, speed: 62 }, lines: ["Can't catch me!", 'Tag, you\'re it!'] },
    { id: 'sp-kid2', name: 'Tobi', kind: 'kid', seed: 41, act: { type: 'chase', a: 1260, b: 1680, speed: 62, lag: 0.8 }, lines: ['Wait for meee!', 'No fair!'] },
    { id: 'sp-dog', kind: 'dog', seed: 3, act: { type: 'chase', a: 1260, b: 1680, speed: 62, lag: 1.5 } },
    { id: 'sp-elder', name: 'Old Fennel', kind: 'person', seed: 52, look: { hairColor: '#e9ebfa', outfitColor: '#e0cfff' },
      act: { type: 'stroll', a: 560, b: 720, speed: 12, pause: 6 }, lines: ['The well water is sweetest at dawn.', 'In my day, we shot with sticks!'], greet: ['Ah, a new face!', 'Mind the chickens, dear.'] },
    { id: 'sp-chick1', kind: 'chick', seed: 5, act: { type: 'peck', a: 380, b: 440 } },
    { id: 'sp-chick2', kind: 'chick', seed: 9, act: { type: 'peck', a: 410, b: 470 } },
    { id: 'sp-cat', kind: 'cat', seed: 2, act: { type: 'nap', x: 1404, y: 330 } },
  ],
  harbor: [
    { id: 'hb-sailor', name: 'Bosun Gill', kind: 'person', seed: 61, look: { outfitColor: '#bfe0ff' },
      act: { type: 'stroll', a: 420, b: 1940, speed: 26, pause: 3, carry: true }, lines: ['Heave... ho...', 'Last crate. Probably.'], greet: ['Ahoy!', 'Mind your step, matey.'] },
    { id: 'hb-gossip1', name: 'Nell', kind: 'person', seed: 72, look: { outfitColor: '#ffd0a8' }, act: { type: 'chat', x: 880, facing: 1 },
      lines: ['Did you hear about the cave?', 'The captain\'s lost his hat again.', 'Fresh fish, half price!'] },
    { id: 'hb-gossip2', name: 'Dory', kind: 'person', seed: 83, look: { outfitColor: '#fff3a6' }, act: { type: 'chat', x: 926, facing: -1, offset: 3 },
      lines: ['No! Really?', 'Ooh, tell me more.', 'I saw shadows on the rooftops...'] },
    { id: 'hb-sneak', name: '???', kind: 'kid', seed: 94, look: { outfitColor: '#5a5878', hairColor: '#3b3650' },
      act: { type: 'stroll', a: 1320, b: 1900, speed: 34, pause: 2.5 }, lines: ['...', 'Nothing to see here.'], greet: ['Wasn\'t me!', 'Shh!'] },
    { id: 'hb-cat', kind: 'cat', seed: 7, act: { type: 'nap', x: 1790, y: 320 } },
    { id: 'hb-cat2', kind: 'cat', seed: 4, act: { type: 'stroll', a: 1980, b: 2380, speed: 20, pause: 5 } },
  ],
  crag: [
    { id: 'cg-trainee1', name: 'Rusk', kind: 'person', seed: 15, look: { outfitColor: '#ffb38a' }, gear: { weapon: { id: 'sword_50' } },
      act: { type: 'train', x: 262, facing: 1 }, lines: ['Hyah!', 'Take that, dummy!'] },
    { id: 'cg-trainee2', name: 'Brindle', kind: 'person', seed: 28, look: { outfitColor: '#ffd0a8' }, gear: { weapon: { id: 'axe_25' } },
      act: { type: 'train', x: 418, facing: -1, offset: 0.5 }, lines: ['One hundred and one...', 'My arms are jelly.'] },
    { id: 'cg-spar1', name: 'Hale', kind: 'person', seed: 33, look: { outfitColor: '#e0504d' }, gear: { weapon: { id: 'sword_50' } },
      act: { type: 'spar', x: 1058, facing: 1, lead: true }, lines: ['Guard up!', 'Again!'] },
    { id: 'cg-spar2', name: 'Kova', kind: 'person', seed: 47, look: { outfitColor: '#5a6fb0' }, gear: { weapon: { id: 'sword_50' } },
      act: { type: 'spar', x: 1102, facing: -1 }, lines: ['Too slow!', 'Hah!'] },
    { id: 'cg-smith', name: 'Cinder', kind: 'person', seed: 58, look: { outfitColor: '#c98e66' }, gear: { weapon: { id: 'axe_25' } },
      act: { type: 'smith', x: 1808, facing: -1 }, lines: ['Hot hot hot!', 'Tora says the blade sings when it\'s ready.'] },
    { id: 'cg-dog', kind: 'dog', seed: 6, act: { type: 'stroll', a: 700, b: 1480, speed: 40, pause: 4 } },
  ],
  grove: [
    { id: 'gv-student1', name: 'Luma', kind: 'person', seed: 19, look: { outfitColor: '#e0cfff' }, gear: { weapon: { id: 'staff_50' } },
      act: { type: 'cast', x: 1740, facing: 1 }, lines: ['Sparkle... sparkle...', 'I made it glow!'] },
    { id: 'gv-student2', name: 'Orrin', kind: 'person', seed: 31, look: { outfitColor: '#bfe0ff' }, gear: { weapon: { id: 'staff_50' } },
      act: { type: 'cast', x: 1865, facing: -1, offset: 1.4 }, lines: ['Was that supposed to happen?', 'The runes are warm tonight.'] },
    { id: 'gv-reader', name: 'Sage Ilsa', kind: 'person', seed: 44, look: { outfitColor: '#c9a6ff', hairColor: '#e9ebfa' },
      act: { type: 'read', x: 1620, facing: -1 }, lines: ['Hmm, chapter seven...', 'The moonstones remember everything.'] },
    { id: 'gv-lamp', name: 'Fen', kind: 'person', seed: 56, look: { outfitColor: '#fff3a6' },
      act: { type: 'stroll', a: 120, b: 680, speed: 16, pause: 4 }, lines: ['Another lantern, another wish.', 'Lovely glow tonight.'], greet: ['Evening!', 'Watch the roots, traveller.'] },
    { id: 'gv-cat', kind: 'cat', seed: 8, look: { coat: '#3b3650' }, act: { type: 'nap', x: 1040, y: 324 } },
  ],
};
