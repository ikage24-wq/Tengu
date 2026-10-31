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
  // Swim and dance: whole beach and stage looks (sold in the Swim style).
  { key: 'sailorswim', name: 'Sailor Swimsuit', slot: 'top', style: 'swim', cash: 2200, color: '#2e4f9a', covers: body },
  { key: 'gymnast', name: 'Starlight Gymnast Leotard', slot: 'top', style: 'swim', cash: 2600, color: '#8a5ae8', covers: [...body, 'gloves'] },
  { key: 'ballet', name: 'Swan Ballet Leotard', slot: 'top', style: 'swim', cash: 2600, color: '#ffffff', covers: body },
  { key: 'tropical', name: 'Tropical Halter Bikini', slot: 'top', style: 'swim', cash: 2400, color: '#ff6b6b', covers: [...body, 'cape'] },
  { key: 'retroswim', name: 'Retro Polka Swimsuit', slot: 'top', style: 'swim', cash: 2200, color: '#e5485f', covers: body },
  { key: 'surf', name: 'Surf Shorty Wetsuit', slot: 'top', style: 'swim', cash: 2400, color: '#2fb8c8', covers: [...body, 'cape'] },
  { key: 'ducky', name: 'Ducky Float Set', slot: 'top', style: 'swim', cash: 2000, color: '#7ac8ff', covers: [...body, 'cape'] },
];
