const fs = require('fs');
const path = require('path');

const DECKS_DIR = path.join(__dirname, '..', 'data', 'decks');

const zexalDecks = [
  {
    character: "bronk",
    displayName: "Bronk Stone",
    world: "Mundo4",
    cards: [
      "Tin Goldfish", "Tin Goldfish", "Tin Goldfish",
      "Goblindbergh", "Goblindbergh", "Goblindbergh",
      "Kagetokage", "Kagetokage", "Kagetokage",
      "Zubaba Knight", "Zubaba Knight", "Zubaba Knight",
      "Gogogo Golem", "Gogogo Golem",
      "Gogogo Giant", "Gogogo Giant",
      "Dododo Buster", "Dododo Buster",
      "Xyz Unit", "Xyz Unit",
      "Double or Nothing!", "Double or Nothing!",
      "Generation Force", "Generation Force",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Bottomless Trap Hole", "Torrential Tribute"
    ],
    extraDeck: [
      "Number 39: Utopia",
      "Number C39: Utopia Ray",
      "Gagaga Cowboy",
      "Number 50: Blackship of Corn",
      "Grenosaurus",
      "Number 17: Leviathan Dragon"
    ]
  },
  {
    character: "flip",
    displayName: "Flip Turner",
    world: "Mundo4",
    cards: [
      "Tour Guide From the Underworld", "Tour Guide From the Underworld", "Tour Guide From the Underworld",
      "Crane Crane", "Crane Crane", "Crane Crane",
      "Kagetokage", "Kagetokage", "Kagetokage",
      "Goblindbergh", "Goblindbergh", "Goblindbergh",
      "Tin Goldfish", "Tin Goldfish",
      "Gagaga Magician", "Gagaga Magician",
      "Gagaga Girl", "Gagaga Girl",
      "Xyz Unit", "Xyz Unit",
      "Gagagarevenge", "Gagagarevenge",
      "Onomatopaira", "Onomatopaira",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Bottomless Trap Hole", "Torrential Tribute"
    ],
    extraDeck: [
      "Number 17: Leviathan Dragon",
      "Number 17: Leviathan Dragon",
      "Grenosaurus",
      "Submersible Carrier Aero Shark",
      "Number 39: Utopia",
      "Gagaga Cowboy"
    ]
  },
  {
    character: "shark",
    displayName: "Reginald Kastle (Shark)",
    world: "Mundo4",
    cards: [
      "Doublefin Shark", "Doublefin Shark", "Doublefin Shark",
      "Silent Angler", "Silent Angler", "Silent Angler",
      "Spear Shark", "Spear Shark", "Spear Shark",
      "Tin Goldfish", "Tin Goldfish", "Tin Goldfish",
      "Big Jaws", "Big Jaws", "Big Jaws",
      "Skull Kraken", "Skull Kraken",
      "Xyz Unit", "Xyz Unit",
      "Generation Force", "Generation Force",
      "Overlay Regen",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Torrential Tribute", "Torrential Tribute",
      "Bottomless Trap Hole", "Bottomless Trap Hole"
    ],
    extraDeck: [
      "Number 32: Shark Drake",
      "Number 32: Shark Drake",
      "Black Ray Lancer",
      "Submersible Carrier Aero Shark",
      "Number 17: Leviathan Dragon",
      "Number 30: Acid Golem of Destruction",
      "Number 50: Blackship of Corn"
    ]
  },
  {
    character: "rio",
    displayName: "Rio Kastle",
    world: "Mundo4",
    cards: [
      "Blizzard Thunderbird", "Blizzard Thunderbird", "Blizzard Thunderbird",
      "Aurora Wing", "Aurora Wing", "Aurora Wing",
      "Silent Angler", "Silent Angler", "Silent Angler",
      "Doublefin Shark", "Doublefin Shark", "Doublefin Shark",
      "Tin Goldfish", "Tin Goldfish", "Tin Goldfish",
      "Goblindbergh", "Goblindbergh",
      "Xyz Unit", "Xyz Unit",
      "Generation Force", "Generation Force",
      "Overlay Regen",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Torrential Tribute", "Torrential Tribute",
      "Bottomless Trap Hole", "Bottomless Trap Hole"
    ],
    extraDeck: [
      "Ice Beast Zerofyne",
      "Ice Beast Zerofyne",
      "Number 32: Shark Drake",
      "Submersible Carrier Aero Shark",
      "Number 50: Blackship of Corn",
      "Gagaga Cowboy"
    ]
  },
  {
    character: "kite",
    displayName: "Kite Tenjo",
    world: "Mundo4",
    cards: [
      "Photon Thrasher", "Photon Thrasher", "Photon Thrasher",
      "Photon Crusher", "Photon Crusher", "Photon Crusher",
      "Photon Vanisher", "Photon Vanisher", "Photon Vanisher",
      "Galaxy-Eyes Photon Dragon", "Galaxy-Eyes Photon Dragon", "Galaxy-Eyes Photon Dragon",
      "Parsec, the Interstellar Dragon", "Parsec, the Interstellar Dragon",
      "Goblindbergh", "Goblindbergh",
      "Kagetokage", "Kagetokage",
      "Xyz Unit", "Xyz Unit",
      "Generation Force", "Generation Force",
      "Tachyon Transmigration", "Tachyon Transmigration",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Bottomless Trap Hole", "Bottomless Trap Hole"
    ],
    extraDeck: [
      "Neo Galaxy-Eyes Photon Dragon",
      "Starliege Paladynamo",
      "Starliege Paladynamo",
      "Heroic Champion - Excalibur",
      "Number 10: Illumiknight",
      "Number 39: Utopia"
    ]
  },
  {
    character: "trey",
    displayName: "Trey (III)",
    world: "Mundo4",
    cards: [
      "Chronomaly Crystal Skull", "Chronomaly Crystal Skull", "Chronomaly Crystal Skull",
      "Chronomaly Golden Jet", "Chronomaly Golden Jet", "Chronomaly Golden Jet",
      "Gogogo Golem", "Gogogo Golem", "Gogogo Golem",
      "Gogogo Giant", "Gogogo Giant", "Gogogo Giant",
      "Tin Goldfish", "Tin Goldfish",
      "Goblindbergh", "Goblindbergh",
      "Xyz Unit", "Xyz Unit",
      "Onomatopaira", "Onomatopaira",
      "Generation Force", "Generation Force",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Torrential Tribute", "Torrential Tribute",
      "Bottomless Trap Hole", "Bottomless Trap Hole"
    ],
    extraDeck: [
      "Number 33: Chronomaly Machu Mech",
      "Number 33: Chronomaly Machu Mech",
      "Number 39: Utopia",
      "Number 50: Blackship of Corn",
      "Gagaga Cowboy"
    ]
  },
  {
    character: "quattro",
    displayName: "Quattro (IV)",
    world: "Mundo4",
    cards: [
      "Gimmick Puppet Dreary Doll", "Gimmick Puppet Dreary Doll", "Gimmick Puppet Dreary Doll",
      "Gimmick Puppet Magnet Doll", "Gimmick Puppet Magnet Doll", "Gimmick Puppet Magnet Doll",
      "Parsec, the Interstellar Dragon", "Parsec, the Interstellar Dragon",
      "Kagetokage", "Kagetokage", "Kagetokage",
      "Goblindbergh", "Goblindbergh", "Goblindbergh",
      "Tin Goldfish", "Tin Goldfish",
      "Xyz Unit", "Xyz Unit",
      "Rank-Up-Magic Barian's Force", "Rank-Up-Magic Barian's Force",
      "Generation Force", "Generation Force",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Torrential Tribute", "Torrential Tribute",
      "Bottomless Trap Hole", "Bottomless Trap Hole"
    ],
    extraDeck: [
      "Number 15: Gimmick Puppet Giant Grinder",
      "Number 15: Gimmick Puppet Giant Grinder",
      "Neo Galaxy-Eyes Photon Dragon",
      "Number 39: Utopia",
      "Gagaga Cowboy"
    ]
  },
  {
    character: "mizar",
    displayName: "Mizar",
    world: "Mundo4",
    cards: [
      "Radius, the Half-Moon Dragon", "Radius, the Half-Moon Dragon", "Radius, the Half-Moon Dragon",
      "Parsec, the Interstellar Dragon", "Parsec, the Interstellar Dragon", "Parsec, the Interstellar Dragon",
      "Galaxy-Eyes Photon Dragon", "Galaxy-Eyes Photon Dragon", "Galaxy-Eyes Photon Dragon",
      "Photon Thrasher", "Photon Thrasher", "Photon Thrasher",
      "Photon Crusher", "Photon Crusher",
      "Goblindbergh", "Goblindbergh",
      "Kagetokage", "Kagetokage",
      "Xyz Unit", "Xyz Unit",
      "Tachyon Transmigration", "Tachyon Transmigration",
      "Rank-Up-Magic Barian's Force", "Rank-Up-Magic Barian's Force",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Bottomless Trap Hole", "Bottomless Trap Hole"
    ],
    extraDeck: [
      "Number 107: Galaxy-Eyes Tachyon Dragon",
      "Number 107: Galaxy-Eyes Tachyon Dragon",
      "Neo Galaxy-Eyes Photon Dragon",
      "Starliege Paladynamo",
      "Number 39: Utopia"
    ]
  },
  {
    character: "vector",
    displayName: "Vector",
    world: "Mundo4",
    cards: [
      "Umbral Horror Ghoul", "Umbral Horror Ghoul", "Umbral Horror Ghoul",
      "Umbral Horror Unform", "Umbral Horror Unform", "Umbral Horror Unform",
      "Tour Guide From the Underworld", "Tour Guide From the Underworld", "Tour Guide From the Underworld",
      "Kagetokage", "Kagetokage", "Kagetokage",
      "Goblindbergh", "Goblindbergh", "Goblindbergh",
      "Tin Goldfish",
      "Xyz Unit", "Xyz Unit",
      "Rank-Up-Magic Barian's Force", "Rank-Up-Magic Barian's Force",
      "Generation Force", "Generation Force",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn",
      "Torrential Tribute", "Torrential Tribute",
      "Bottomless Trap Hole", "Bottomless Trap Hole"
    ],
    extraDeck: [
      "Number 66: Master Key Beetle",
      "Number 66: Master Key Beetle",
      "Number 104: Masquerade",
      "Number 39: Utopia",
      "Number 50: Blackship of Corn"
    ]
  },
  {
    character: "yuma",
    displayName: "Yuma Tsukumo (& Astral)",
    world: "Mundo4",
    cards: [
      "Gagaga Magician", "Gagaga Magician", "Gagaga Magician",
      "Gagaga Girl", "Gagaga Girl",
      "Gogogo Golem", "Gogogo Golem",
      "Gogogo Giant", "Gogogo Giant",
      "Zubaba Knight",
      "Dododo Buster",
      "Kagetokage", "Kagetokage",
      "Goblindbergh", "Goblindbergh", "Goblindbergh",
      "Tin Goldfish", "Tin Goldfish",
      "Double or Nothing!",
      "Onomatopaira", "Onomatopaira",
      "Gagagarevenge", "Gagagarevenge",
      "Xyz Unit", "Xyz Unit",
      "Rank-Up-Magic Barian's Force",
      "Raigeki", "Dark Hole", "Monster Reborn", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Mirror Force",
      "Magic Cylinder", "Magic Cylinder",
      "Xyz Block", "Xyz Block",
      "Xyz Reborn", "Xyz Reborn"
    ],
    extraDeck: [
      "Number 39: Utopia",
      "Number 39: Utopia",
      "Number C39: Utopia Ray",
      "Heroic Champion - Excalibur",
      "Gagaga Cowboy",
      "Number 50: Blackship of Corn",
      "Number 17: Leviathan Dragon"
    ]
  }
];

zexalDecks.forEach(d => {
  const p = path.join(DECKS_DIR, `${d.character}.json`);
  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
  console.log(`Deck created: ${d.displayName} -> ${p} (cards: ${d.cards.length}, extra: ${d.extraDeck.length})`);
});
