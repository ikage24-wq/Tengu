// Merchant Rep: how Coinbridge thinks of you (Penny keeps the book at the Trade Hall, ui/rep.js).
//
// You earn it by trading and by helping the town: selling at the Auction House (more for a bigger
// sale), bringing in guild bounties, filling fish requests, a night at the Gilded Kettle, and
// every sale at your own stall. Each standing (REP) gives its perks:
//   fee     what Madame Ledger keeps from an auction sale
//   slots   how many things you can have up at the Auction House at once
//   stall   a licence for your own stall on the market canal (`stall` items on its counter), which
//           keeps selling while you're away (world/stall.js)
// The last standing also gives its title.
// char.rep = { points, tier }.

export const REP = [
  { name: 'Stranger', need: 0, fee: 0.05, slots: 5, stall: 0, color: '#b8b0c8' },
  { name: 'Known Face', need: 60, fee: 0.04, slots: 6, stall: 0, color: '#8fd0a8' },
  { name: 'Trusted Trader', need: 200, fee: 0.03, slots: 7, stall: 0, color: '#8fb8ff' },
  { name: 'Merchant Friend', need: 450, fee: 0.03, slots: 8, stall: 4, color: '#ffb36b' },
  { name: 'Pillar of Coinbridge', need: 900, fee: 0.02, slots: 8, stall: 6, color: '#ffd36b', title: 'Pillar of Coinbridge' },
];

const repOf = (char) => (char.rep ??= { points: 0, tier: 0 });
export const repTier = (char) => REP[repOf(char).tier ?? 0];
export const repPoints = (char) => repOf(char).points ?? 0;
export const auctionFee = (char) => repTier(char).fee;
export const auctionSlots = (char) => repTier(char).slots;
export const stallSize = (char) => repTier(char).stall;

// The rep for each kind of good turn.
export const REP_FOR = {
  sale: (price) => Math.max(1, Math.min(15, Math.round(price / 250))),
  bounty: (rank) => 10 + 5 * (rank ?? 0),
  fishRequest: () => 4,
  innRoom: () => 2,
  stallSale: () => 1,
};

// Adds rep (and moves you up a standing when it's time). `world` may be null (offline sales).
export function addRep(world, char, n) {
  const r = repOf(char);
  r.points = (r.points ?? 0) + n;
  while (REP[(r.tier ?? 0) + 1] && r.points >= REP[(r.tier ?? 0) + 1].need) {
    r.tier = (r.tier ?? 0) + 1;
    const t = REP[r.tier];
    if (t.title && !(char.titles ??= []).includes(t.title)) {
      char.titles.push(t.title);
      char.title = t.title;
    }
    const perks = [`a ${Math.round(t.fee * 100)}% auction fee`, `${t.slots} auction slots`, ...(t.stall ? [`a stall of ${t.stall}`] : [])].join(', ');
    world?.log?.(`Coinbridge knows you now: you're a ${t.name}! (${perks}.) Penny at the Trade Hall has the details.`, t.color);
    world?.fx?.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
  }
}
