// Full outfits for the Cash Shop: one piece that dresses the whole body (a top that also covers the
// bottom, shoes, and its own hat, gloves or back piece). Drawn by src/render/jobgear/costume.js,
// which looks entries up by their index (so keep the order). Same fields as outfits-casual.js.

const body = ['bottom', 'shoes', 'hat'];

export const COSTUME_LOOKS = [
  { key: 'yukata', name: 'Fireworks Yukata', slot: 'top', style: 'costume', cash: 2800, color: '#2e3f8a', covers: [...body, 'cape'] },
  { key: 'gothic', name: 'Midnight Gothic Lolita', slot: 'top', style: 'costume', cash: 3000, color: '#2b2233', covers: [...body, 'cape'] },
  { key: 'pajamas', name: 'Sleepy Bunny Pajamas', slot: 'top', style: 'costume', cash: 2400, color: '#b9c8ff', covers: [...body, 'gloves'] },
  { key: 'astronaut', name: 'Star Voyager Suit', slot: 'top', style: 'costume', cash: 3200, color: '#f2f2f6', covers: [...body, 'gloves', 'cape'] },
  { key: 'detective', name: 'Inverness Detective', slot: 'top', style: 'costume', cash: 2800, color: '#b8925a', covers: [...body, 'cape'] },
  { key: 'ballgown', name: 'Starlight Princess Gown', slot: 'top', style: 'costume', cash: 3600, color: '#8a6bff', covers: [...body, 'gloves', 'cape'] },
  { key: 'tuxedo', name: 'Phantom Gentleman', slot: 'top', style: 'costume', cash: 3200, color: '#24212e', covers: [...body, 'gloves', 'cape'] },
  { key: 'cheer', name: 'Pop Star Cheer', slot: 'top', style: 'costume', cash: 2600, color: '#ff4f8a', covers: [...body, 'gloves'] },
  { key: 'pirate', name: 'Pirate Captain', slot: 'top', style: 'costume', cash: 3400, color: '#b8323f', covers: [...body, 'cape'] },
  { key: 'mermaid', name: 'Pearl Mermaid', slot: 'top', style: 'costume', cash: 3600, color: '#3fc0c8', covers: [...body, 'cape'] },
  { key: 'aviator', name: 'Sky Pilot', slot: 'top', style: 'costume', cash: 3000, color: '#8a5a3a', covers: [...body, 'gloves', 'cape'] },
  { key: 'snow', name: 'Snow Princess', slot: 'top', style: 'costume', cash: 3600, color: '#8fc8ff', covers: [...body, 'gloves', 'cape'] },
  // The six Sweethearts' own outfits (data/sweethearts.js): never sold, theirs alone.
  { key: 'swbaker', name: "Poppy's Strawberry Apron", slot: 'top', style: 'costume', cash: 0, color: '#ff8fae', covers: [...body, 'cape'], unsold: true },
  { key: 'swpoet', name: "Lark's Cable Knit", slot: 'top', style: 'costume', cash: 0, color: '#8fc8c8', covers: [...body, 'cape'], unsold: true },
  { key: 'swknight', name: "Rowan's Soft Steel", slot: 'top', style: 'costume', cash: 0, color: '#8fb8e8', covers: [...body, 'gloves', 'cape'], unsold: true },
  { key: 'swfox', name: "Yuzu's Shrine Haori", slot: 'top', style: 'costume', cash: 0, color: '#ff7a4a', covers: [...body, 'cape'], unsold: true },
  { key: 'swstar', name: "Celeste's Constellation Robe", slot: 'top', style: 'costume', cash: 0, color: '#4a4aa8', covers: [...body, 'cape'], unsold: true },
  { key: 'swsailor', name: "Marlowe's Sea Stripes", slot: 'top', style: 'costume', cash: 0, color: '#2f5fb8', covers: [...body, 'cape'], unsold: true },
  // Swim and dance: whole beach and stage looks (sold in the Swim style).
  { key: 'sailorswim', name: 'Sailor Swimsuit', slot: 'top', style: 'swim', cash: 2200, color: '#2e4f9a', covers: body },
  { key: 'gymnast', name: 'Starlight Gymnast Leotard', slot: 'top', style: 'swim', cash: 2600, color: '#8a5ae8', covers: [...body, 'gloves'] },
  { key: 'ballet', name: 'Swan Ballet Leotard', slot: 'top', style: 'swim', cash: 2600, color: '#ffffff', covers: body },
  { key: 'tropical', name: 'Tropical Halter Bikini', slot: 'top', style: 'swim', cash: 2400, color: '#ff6b6b', covers: [...body, 'cape'] },
  { key: 'retroswim', name: 'Retro Polka Swimsuit', slot: 'top', style: 'swim', cash: 2200, color: '#e5485f', covers: body },
  { key: 'surf', name: 'Surf Shorty Wetsuit', slot: 'top', style: 'swim', cash: 2400, color: '#2fb8c8', covers: [...body, 'cape'] },
  { key: 'ducky', name: 'Ducky Float Set', slot: 'top', style: 'swim', cash: 2000, color: '#7ac8ff', covers: [...body, 'cape'] },
  // Coinbridge's people's own (data/npcs.js): never sold, theirs alone.
  { key: 'cbledger', name: "Madame Ledger's Velvet Frock", slot: 'top', style: 'costume', cash: 0, color: '#6a2a5a', covers: [...body, 'gloves', 'cape'], unsold: true },
  { key: 'cbhalvard', name: "Halvard's Old Gambeson", slot: 'top', style: 'costume', cash: 0, color: '#8a6a44', covers: [...body, 'gloves', 'cape'], unsold: true },
  { key: 'cbpenny', name: "Penny's Clerk Waistcoat", slot: 'top', style: 'costume', cash: 0, color: '#7fcfb0', covers: body, unsold: true },
  { key: 'cbjuniper', name: "Juniper's Kettle Apron", slot: 'top', style: 'costume', cash: 0, color: '#c8603a', covers: [...body, 'cape'], unsold: true },
  { key: 'cbwendell', name: "Wendell's Comfy Cardigan", slot: 'top', style: 'costume', cash: 0, color: '#8a9a6a', covers: body, unsold: true },
  { key: 'cbtilly', name: "Tilly's Card Shark Vest", slot: 'top', style: 'costume', cash: 0, color: '#3f8a5a', covers: body, unsold: true },
  // Kinako, the Mochi Garden's keeper (data/npcs.js): his shop apron by day, his shady coat by night.
  { key: 'kinakoday', name: "Kinako's Shop Apron", slot: 'top', style: 'costume', cash: 0, color: '#ff9ec0', covers: body, unsold: true },
  { key: 'kinakonight', name: "Kinako's Night Coat", slot: 'top', style: 'costume', cash: 0, color: '#3a2e4a', covers: body, unsold: true },
  { key: 'cbmoth', name: "The Moth's Wing Shawl", slot: 'top', style: 'costume', cash: 0, color: '#3a2a4a', covers: [...body, 'cape'], unsold: true },
];
