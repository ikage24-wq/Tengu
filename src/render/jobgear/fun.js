// Funny outfits and April Fools skins (placeholder until the designs land).

import { R, E } from '../pixel.js';
import { stubSet } from './stub.js';

export default {
  ...stubSet(),
  // A weapon cover: shapes around the grip at (0, 0), pointing toward -y; blade = [top, base].
  cover: () => ({ shapes: [R(-1, -2, 2, 6, '#8a6040'), E(0, -10, 3, 8, '#8fc4e8')], blade: [-18, -2] }),
};
