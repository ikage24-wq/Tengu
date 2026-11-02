// The gummy rig (2026-11): the Candy Volcano's sweets-folk. The manor rig's skeleton on springs:
// the hips ride a damped spring that overshoots and settles, so every hop lands with a bounce, and
// that jiggle runs out through hair, ears and props a beat behind (never a squash of the body).

// A damped spring's offset at phase u (0..1 of a hop cycle): a quick rise, a fall, then the landing
// wobble ringing out.
export function bounce(u, height = 4) {
  if (u < 0.45) return -Math.sin((u / 0.45) * Math.PI) * height;
  const t = (u - 0.45) / 0.55;
  return Math.sin(t * Math.PI * 3) * Math.exp(-t * 4) * height * 0.35;
}
// The jiggle a beat behind the bounce, for hair, ears and props (radians).
export const jiggle = (u, k = 0.25) => bounce((u + 0.88) % 1, 1) * k;
