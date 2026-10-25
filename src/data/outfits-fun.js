// Funny outfits and April Fools skins for the Cash Shop: silly hats, full-body costumes, and
// joke weapon covers. Each entry is drawn by src/render/jobgear/fun.js, which looks entries up by
// their index (so keep the order). Same fields as outfits-casual.js; a weapon cover (slot
// 'weapon') reskins any weapon you hold. Costumes are tops that also dress the slots in `covers`.

const hood = ['bottom', 'hat'];

export const FUN_LOOKS = [
  // Hats.
  { key: 'cone', name: 'Traffic Cone Hat', slot: 'hat', style: 'funny', cash: 800, color: '#ff8a3c', colors: false },
  { key: 'paperbag', name: 'Paper Bag Disguise', slot: 'hat', style: 'funny', cash: 800, color: '#d9b07a', colors: false },
  { key: 'groucho', name: 'Nose & Mustache Glasses', slot: 'hat', style: 'funny', cash: 900, color: '#2b2233', colors: false },
  { key: 'clownwig', name: 'Rainbow Clown Wig', slot: 'hat', style: 'funny', cash: 1200, color: '#ff5a6a', colors: false },
  { key: 'fishbowl', name: 'Fishbowl Helmet', slot: 'hat', style: 'funny', cash: 1400, color: '#d8f2ff', colors: false },
  { key: 'chickenhat', name: 'Roosting Chicken Hat', slot: 'hat', style: 'funny', cash: 1100, color: '#ffffff', colors: false },
  { key: 'propeller', name: 'Propeller Beanie', slot: 'hat', style: 'funny', cash: 900, color: '#3f7fd8' },
  { key: 'party', name: 'Party Hat & Blower', slot: 'hat', style: 'funny', cash: 900, color: '#b48cff' },
  { key: 'toast', name: 'Toast Face', slot: 'hat', style: 'funny', cash: 1000, color: '#f6dca0', colors: false },
  { key: 'sushi', name: 'Salmon Nigiri Hat', slot: 'hat', style: 'funny', cash: 1000, color: '#ff8a6a', colors: false },
  { key: 'arrow', name: 'Arrow Through the Head', slot: 'hat', style: 'funny', cash: 1000, color: '#c8324a', colors: false },
  { key: 'antennae', name: 'Bobble Antennae', slot: 'hat', style: 'funny', cash: 800, color: '#7fe08f' },
  // Full-body costumes.
  { key: 'banana', name: 'Banana Suit', slot: 'top', style: 'funny', cash: 2200, color: '#ffe066', colors: false, covers: hood },
  { key: 'chicken', name: 'Chicken Suit', slot: 'top', style: 'funny', cash: 2400, color: '#ffffff', colors: false, covers: ['bottom', 'hat', 'shoes'] },
  { key: 'shark', name: 'Shark Onesie', slot: 'top', style: 'funny', cash: 2200, color: '#7aa6d6', covers: hood },
  { key: 'dino', name: 'Dino Onesie', slot: 'top', style: 'funny', cash: 2200, color: '#7fd17a', covers: hood },
  { key: 'frog', name: 'Frog Onesie', slot: 'top', style: 'funny', cash: 2200, color: '#86d46a', covers: ['bottom', 'hat', 'shoes'] },
  { key: 'cow', name: 'Cow Onesie', slot: 'top', style: 'funny', cash: 2000, color: '#ffffff', colors: false, covers: hood },
  { key: 'robot', name: 'Cardboard Robot', slot: 'top', style: 'funny', cash: 1800, color: '#c89a62', colors: false, covers: hood },
  { key: 'hotdog', name: 'Hot Dog Costume', slot: 'top', style: 'funny', cash: 2000, color: '#d9583a', colors: false, covers: hood },
  // Shoes and gloves.
  { key: 'clownshoes', name: 'Giant Clown Shoes', slot: 'shoes', style: 'funny', cash: 1000, color: '#ff4a5a' },
  { key: 'bunnyslippers', name: 'Bunny Slippers', slot: 'shoes', style: 'funny', cash: 900, color: '#ffc2d6' },
  { key: 'duckfeet', name: 'Duck Feet Flippers', slot: 'shoes', style: 'funny', cash: 900, color: '#ff9f3a', colors: false },
  { key: 'foamfinger', name: 'Foam Finger', slot: 'gloves', style: 'funny', cash: 900, color: '#4f8fef' },
  { key: 'crab', name: 'Crab Claws', slot: 'gloves', style: 'funny', cash: 1000, color: '#ff5a4a', colors: false },
  // Back items.
  { key: 'towel', name: 'Superhero Towel Cape', slot: 'cape', style: 'funny', cash: 1000, color: '#ff6b8a' },
  { key: 'balloons', name: 'Balloon Bunch', slot: 'cape', style: 'funny', cash: 1500, color: '#ff8fc1', colors: false },
  { key: 'cardwings', name: 'Cardboard Wings', slot: 'cape', style: 'funny', cash: 1200, color: '#c89a62', colors: false },
  { key: 'snail', name: 'Snail Shell Backpack', slot: 'cape', style: 'funny', cash: 1300, color: '#e8a86a' },
  // Joke weapon covers.
  { key: 'fish', name: 'Fresh Fish Cover', slot: 'weapon', style: 'funny', cash: 1500, color: '#8fc4e8', colors: false },
  { key: 'baguette', name: 'Baguette Cover', slot: 'weapon', style: 'funny', cash: 1500, color: '#d99a4e', colors: false },
  { key: 'rubberchicken', name: 'Rubber Chicken Cover', slot: 'weapon', style: 'funny', cash: 2000, color: '#ffd84a', colors: false },
  { key: 'leek', name: 'Leek Cover', slot: 'weapon', style: 'funny', cash: 1500, color: '#7fd17a', colors: false },
  { key: 'pan', name: 'Frying Pan Cover', slot: 'weapon', style: 'funny', cash: 1800, color: '#4a4a58', colors: false },
  { key: 'lollipop', name: 'Giant Lollipop Cover', slot: 'weapon', style: 'funny', cash: 1800, color: '#ff7ab8', colors: false },
  { key: 'noodle', name: 'Pool Noodle Cover', slot: 'weapon', style: 'funny', cash: 1500, color: '#ff7ab8', colors: false },
  { key: 'umbrella', name: 'Polka Umbrella Cover', slot: 'weapon', style: 'funny', cash: 2000, color: '#ff5a6a', colors: false },
  { key: 'spoon', name: 'Giant Spoon Cover', slot: 'weapon', style: 'funny', cash: 1800, color: '#d9a86a', colors: false },
  { key: 'squeaky', name: 'Squeaky Hammer Cover', slot: 'weapon', style: 'funny', cash: 2500, color: '#ff4a5a', colors: false },
];
