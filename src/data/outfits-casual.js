// Casual and swim outfits for the Cash Shop: everyday modern clothes (no fantasy) and beachwear.
// Each entry is drawn by src/render/jobgear/casual.js, which looks entries up by their index.
//
// { key, name, slot, style ('casual' | 'swim'), cash, color, colors (false: one look only),
//   covers (other slots this piece dresses too, like a one-piece's bottom) }

export const CASUAL_LOOKS = [
  // Tops.
  { key: 'tee', name: 'Heart Graphic Tee', slot: 'top', style: 'casual', cash: 500, color: '#8fd3ff' },
  { key: 'stripes', name: 'Striped Long-Sleeve', slot: 'top', style: 'casual', cash: 550, color: '#5f7fd8' },
  { key: 'cardigan', name: 'Cozy Cardigan', slot: 'top', style: 'casual', cash: 700, color: '#f2b8c6' },
  { key: 'varsity', name: 'Varsity Jacket', slot: 'top', style: 'casual', cash: 900, color: '#d8485f' },
  { key: 'flannel', name: 'Flannel Shirt', slot: 'top', style: 'casual', cash: 650, color: '#d0504a' },
  { key: 'track', name: 'Track Jacket', slot: 'top', style: 'casual', cash: 700, color: '#3f9a7a' },
  { key: 'sweatervest', name: 'Argyle Sweater Vest', slot: 'top', style: 'casual', cash: 750, color: '#c9a46a' },
  { key: 'parka', name: 'Puffy Winter Parka', slot: 'top', style: 'casual', cash: 1100, color: '#7aa8e8' },
  { key: 'raincoat', name: 'Duckling Raincoat', slot: 'top', style: 'casual', cash: 800, color: '#ffd34d' },
  { key: 'idol', name: 'Idol Stage Outfit', slot: 'top', style: 'casual', cash: 1200, color: '#ff8fc4', covers: ['bottom'] },
  { key: 'chef', name: 'Chef Coat', slot: 'top', style: 'casual', cash: 650, color: '#f6f2ea' },
  { key: 'sailor', name: 'School Sailor Uniform', slot: 'top', style: 'casual', cash: 1000, color: '#3e4f8e', covers: ['bottom'] },
  { key: 'pinafore', name: 'Denim Pinafore Dress', slot: 'top', style: 'casual', cash: 900, color: '#5b86c8', covers: ['bottom'] },
  // Bottoms.
  { key: 'jorts', name: 'Denim Shorts', slot: 'bottom', style: 'casual', cash: 450, color: '#6a95d0' },
  { key: 'plaid', name: 'Plaid Skirt', slot: 'bottom', style: 'casual', cash: 550, color: '#c8484f' },
  { key: 'trackpants', name: 'Track Pants', slot: 'bottom', style: 'casual', cash: 500, color: '#3f9a7a' },
  { key: 'cargo', name: 'Cargo Shorts', slot: 'bottom', style: 'casual', cash: 450, color: '#a59a6a' },
  { key: 'tennis', name: 'Tennis Skirt', slot: 'bottom', style: 'casual', cash: 550, color: '#f6f2ea' },
  { key: 'flowerskirt', name: 'Flower Midi Skirt', slot: 'bottom', style: 'casual', cash: 650, color: '#ffe08a' },
  // Shoes.
  { key: 'hightops', name: 'High-Top Sneakers', slot: 'shoes', style: 'casual', cash: 600, color: '#e8485f' },
  { key: 'rainboots', name: 'Rain Boots', slot: 'shoes', style: 'casual', cash: 500, color: '#ffd34d' },
  { key: 'loafers', name: 'Loafers & Socks', slot: 'shoes', style: 'casual', cash: 500, color: '#7a4a38' },
  { key: 'platforms', name: 'Platform Boots', slot: 'shoes', style: 'casual', cash: 750, color: '#3b3550' },
  { key: 'sandals', name: 'Strappy Sandals', slot: 'shoes', style: 'casual', cash: 450, color: '#e9b47a' },
  // Hats and headwear.
  { key: 'cap', name: 'Sideways Cap', slot: 'hat', style: 'casual', cash: 450, color: '#5f7fd8' },
  { key: 'bucket', name: 'Bucket Hat', slot: 'hat', style: 'casual', cash: 500, color: '#b9d98a' },
  { key: 'pompom', name: 'Pompom Beanie', slot: 'hat', style: 'casual', cash: 500, color: '#ff9ec0' },
  { key: 'headphones', name: 'Headphones', slot: 'hat', style: 'casual', cash: 800, color: '#b48cff' },
  { key: 'glasses', name: 'Round Glasses', slot: 'hat', style: 'casual', cash: 400, color: '#8a5a3c' },
  { key: 'catears', name: 'Cat-Ear Headband', slot: 'hat', style: 'casual', cash: 600, color: '#3b3550' },
  { key: 'bow', name: 'Big Hair Bow', slot: 'hat', style: 'casual', cash: 550, color: '#ff6b8a' },
  { key: 'visor', name: 'Sun Visor', slot: 'hat', style: 'casual', cash: 450, color: '#8fd3ff' },
  { key: 'chefhat', name: 'Chef Hat', slot: 'hat', style: 'casual', cash: 500, color: '#f6f2ea' },
  // Gloves.
  { key: 'fingerless', name: 'Fingerless Gloves', slot: 'gloves', style: 'casual', cash: 400, color: '#3b3550' },
  { key: 'mittens', name: 'Fluffy Mittens', slot: 'gloves', style: 'casual', cash: 450, color: '#ff8f8f' },
  // On the back.
  { key: 'backpack', name: 'School Backpack', slot: 'cape', style: 'casual', cash: 700, color: '#ffb36b' },
  { key: 'guitar', name: 'Guitar Case', slot: 'cape', style: 'casual', cash: 900, color: '#3b3550' },
  { key: 'scarf', name: 'Long Knit Scarf', slot: 'cape', style: 'casual', cash: 600, color: '#e8485f' },
  { key: 'tote', name: 'Tote Bag', slot: 'cape', style: 'casual', cash: 450, color: '#f3e6cc' },
  // Swim.
  { key: 'onepiece', name: 'Frilly Swimsuit', slot: 'top', style: 'swim', cash: 1100, color: '#ff8fb0', covers: ['bottom'] },
  { key: 'bikini', name: 'Ruffle Bikini Top', slot: 'top', style: 'swim', cash: 700, color: '#ffb36b' },
  { key: 'bikinibottom', name: 'Ruffle Bikini Skirt', slot: 'bottom', style: 'swim', cash: 600, color: '#ffb36b' },
  { key: 'dotbikini', name: 'Polka-Dot Bikini Top', slot: 'top', style: 'swim', cash: 700, color: '#ff6b8a' },
  { key: 'dotbikinibottom', name: 'Polka-Dot Bikini Bottom', slot: 'bottom', style: 'swim', cash: 600, color: '#ff6b8a' },
  { key: 'tankini', name: 'Striped Tankini', slot: 'top', style: 'swim', cash: 800, color: '#5fc8d8' },
  { key: 'rashguard', name: 'Rash Guard', slot: 'top', style: 'swim', cash: 800, color: '#3f7fd8' },
  { key: 'boardshorts', name: 'Hibiscus Board Shorts', slot: 'bottom', style: 'swim', cash: 650, color: '#ff7a6b' },
  { key: 'trunks', name: 'Swim Trunks', slot: 'bottom', style: 'swim', cash: 500, color: '#4aa8e8' },
  { key: 'sunhat', name: 'Ribbon Sun Hat', slot: 'hat', style: 'swim', cash: 700, color: '#f3dca4' },
  { key: 'goggles', name: 'Snorkel Goggles', slot: 'hat', style: 'swim', cash: 650, color: '#3fc0c8' },
  { key: 'flipflops', name: 'Flip-Flops', slot: 'shoes', style: 'swim', cash: 500, color: '#ff8fb0' },
  { key: 'swimring', name: 'Swim Ring', slot: 'cape', style: 'swim', cash: 900, color: '#ff6b6b' },
  { key: 'towel', name: 'Beach Towel Cape', slot: 'cape', style: 'swim', cash: 750, color: '#5fc8d8' },
  { key: 'sunglasses', name: 'Heart Sunglasses', slot: 'hat', style: 'swim', cash: 600, color: '#ff6b8a' },
];
