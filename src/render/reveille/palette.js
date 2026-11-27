// Madame Reveille's colours (remade 2026-11-27): the Queen's bedside alarm clock (pink lacquer, brass bells, a cream
// dial) grown into a brisk morning governess, and a rooster's pride. Copper-auburn hair; a rose waistcoat and
// pleated rose skirt with gold buttons and a gold hem band marked like a clock's bezel; a cream blouse with a ruffled
// stand collar and jabot; white stockings, rose button boots; her little rose bonnet with two brass alarm bells on
// top and their striker between; a bustle of rooster plumes (deep iridescent teal, one tipped gold); a brass
// handbell with a cream handle; a gold pocket watch on a chain. Every part outlined in a deeper shade of its own
// colour, never near-black; her face bare. Her effects: brass and bell-gold, dawn pink and peach, a soft morning
// cream, sound rings, the snooze button's red.

export const SKIN = ['#fffaf4', '#ffeadf', '#f6d0c2', '#e2ab9c'];
export const SKIN_INK = '#c98a86';
// her hair: copper-auburn, a peach light, plum-red in its shade (never grey)
export const HAIR = { lt: '#f0a066', base: '#c0622f', sh: '#9a4424', deep: '#742f1c', ink: '#6c2c1e' };
export const HAIR_SHADE = (al) => `rgba(96,30,38,${al})`;
export const HAIR_SHINE = ['rgba(255,226,190,0)', 'rgba(255,222,184,0.6)'];
// her waistcoat, sleeves, skirt and bonnet: rose lacquer, like the clock
export const ROSE = { lt: '#ffb4c4', base: '#f27c98', sh: '#d45e7c', deep: '#b24664', ink: '#9c3c5a' };
// her blouse, ruffles and petticoat: morning cream
export const CREAM = { lt: '#ffffff', base: '#fff8ee', sh: '#f2e2d0', deep: '#dcc4aa', ink: '#c2a486' };
// brass: the bells, buttons, trims, watch
export const GOLD = { lt: '#fff2c0', base: '#f6c64e', sh: '#d49a32', deep: '#b07a24', ink: '#9a6a24' };
// the rooster plumes of her bustle: deep iridescent teal, a green sheen
export const PLUME = { lt: '#86e0cc', base: '#2fa096', sh: '#237c7c', deep: '#1a5e66', ink: '#1a5662', sheen: '#b8f4d8' };
export const STOCK = { lt: '#ffffff', base: '#fdfbff', sh: '#e6e0ee', deep: '#ccc4dc', ink: '#b2a8c6' };
export const SHOE = { lt: '#ff90a6', base: '#d44c6c', sh: '#b03a58', ink: '#8e2c48' };
// the handbell's handle: cream-lacquered wood
export const HANDLE = { lt: '#fffaf0', base: '#f6e4c8', sh: '#dcc29c', ink: '#b8966e' };
// a clock's dial and hands
export const DIAL = { base: '#fffdf6', sh: '#ecdfcc', ink: '#c4ac8c', hand: '#6a3a58', tick: '#b88a5a' };
// the snooze button
export const SNOOZE = { lt: '#ff9aa8', base: '#ec4a62', sh: '#c43450', deep: '#9a2440', ink: '#8a2440', cap: '#fff6f0' };
// dawn light (her raid-wide, her first light)
export const DAWN = { cream: '#fff6dc', peach: '#ffd2a0', pink: '#ffb2c6', lilac: '#cbb0ea', gold: '#ffe08a' };
export const SLEEP = { base: '#c8b8ff', lt: '#efe8ff', deep: '#9a86e0' };
// her face
export const LASH = '#4a2234';
export const BROW = '#7c3626';
// her own eyes: a sunrise in each, gold low down where the sun is coming up, through coral and rose to a dusk plum
// at the top; the sun sits on the eye's flat lower edge like the horizon
export const IRIS = ['#ffe08a', '#ff9e6a', '#e8607e', '#7e3a86'];
export const RING = '#5c2656';
export const PUPIL = '#3c1838';
export const LIP = { base: '#f48a9c', sh: '#c8627a', in: '#983a58', tongue: '#ff9ab0', teeth: '#ffffff' };
export const BLUSH = ['#ffc6c2', '#ffa0a8'];
