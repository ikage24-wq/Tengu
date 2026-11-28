// The Mirror Twins' arts, handed over to the room (render/twins/room.js draws their reflections dancing in
// the mirrors at their entrance) without the room importing the rigs themselves: render/twins/index.js
// fills this in as it loads (importing the rigs from the room would loop through the scenery's modules).
export const TWIN_ARTS = { rondo: null, minuet: null };
