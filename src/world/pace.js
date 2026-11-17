// A walker's pace in a cutscene (world/director.js, world/cast.js): speeding up toward `top` over a
// quarter of a second, and slowing for the stop so it lands just as the distance `left` runs out
// (never below a crawl, so it does arrive). Never starting or stopping dead.
export const easedPace = (v, top, left, dt) => {
  const acc = top / 0.25;
  const brake = Math.sqrt(2 * acc * left);
  return Math.max(Math.min(top, v + acc * dt, brake), Math.min(top, 12));
};
