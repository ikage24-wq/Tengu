// Your island (docs/design/home-island.md; research home-mounts.md): a little beach cove of your
// own in the sea off Pastel Harbor. Captain Rook hands you its deed (the quest `island_deed`), and
// with it a Home Shell: use it anywhere to go home, and again on the island to go back where you
// were. Or sail your own little skiff out from the harbor's quay, the slow and pretty way.
//
// Shelly, a hermit crab carpenter who came with the island, builds it up a stage at a time from
// what you bring her (things you find in play, never one item ground out). Each stage adds
// something to do, not just room:
//   1  Shell Beach and your hut: the dock, the beach, a garden plot (day one)
//   2  Tide Pond: a pond with its own fish, and a little fishing jetty
//   3  The Rocky Rise: an ore rock and a herb patch
//   4  Coral Islet: a rope bridge over the shallows to a second islet, room to decorate
//   5  Sunset Terrace: a cliff-top terrace up a ladder to show off your trophies
// The island never replaces the hunting maps: its spots are small and refill once a day like any
// other's. Nothing withers while you're away and there's nothing to pay upkeep on.

export const HOME_STAGES = [
  null,
  { name: 'Shell Beach', about: 'Your dock, a stretch of beach, your hut and a garden plot.', needs: {}, gold: 0 },
  { name: 'Tide Pond', about: 'A pond behind the hut with fish of its own, and a jetty to fish from.', needs: { oak_log: 10, cotton: 6, shell: 6 }, gold: 3000 },
  { name: 'The Rocky Rise', about: 'A rocky rise with an ore rock and a herb patch.', needs: { copper_ore: 12, maple_log: 8, clover: 10 }, gold: 8000 },
  { name: 'Coral Islet', about: 'A rope bridge over the shallows to a second islet, with room to decorate.', needs: { maple_log: 20, iron_ore: 10, silkmoss: 8, hollow_acorn: 6 }, gold: 20000 },
  { name: 'Sunset Terrace', about: 'A cliff-top terrace on the islet, up a ladder, to show off your trophies.', needs: { cedar_log: 15, silver_ore: 10, lotus_fiber: 8 }, gold: 50000 },
];
export const HOME_MAX = HOME_STAGES.length - 1;

// The island's own fish (data/fishing.js pools): the pond's and the sea's off the dock.
export const HOME_SEA_POOL = { fish_goby: 6, fish_clown: 3, fish_sardine: 3, fish_seapony: 1 };
export const HOME_POND_POOL = { fish_minnow: 5, fish_carp: 4, fish_perch: 2, fish_koi: 0.6 };
