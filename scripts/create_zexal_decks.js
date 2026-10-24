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
      "Zubaba Knight", "Zubaba Knight", "Zubaba Knight",
      "Gogogo Golem", "Gogogo Golem",
      "Dododo Warrior", "Dododo Warrior",
      "Crane Crane", "Crane Crane",
      "Kagetokage", "Kagetokage",
      "Double or Nothing!", "Double or Nothing!",
      "Onomatopaira", "Onomatopaira",
      "Xyz Unit", "Xyz Unit",
      "Dark Hole", "Raigeki", "Monster Reborn",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Sakuretsu Armor", "Sakuretsu Armor",
      "Trap Hole", "Trap Hole", "Waboku", "Waboku",
      "Xyz Block", "Xyz Block", "Xyz Reborn", "Xyz Reborn", "Magic Cylinder"
    ],
    extraDeck: [
      "Grenosaurus", "Grenosaurus",
      "Number 17: Leviathan Dragon",
      "Gagaga Cowboy"
    ]
  },
  {
    character: "flip",
    displayName: "Flip Turner",
    world: "Mundo4",
    cards: [
      "Tour Guide From the Underworld", "Tour Guide From the Underworld",
      "Crane Crane", "Crane Crane", "Crane Crane",
      "Zubaba Knight", "Zubaba Knight",
      "Kagetokage", "Kagetokage", "Kagetokage",
      "Gagaga Girl", "Gagaga Girl",
      "Gagaga Magician", "Gagaga Magician",
      "Goblindbergh", "Goblindbergh",
      "Dododo Buster", "Dododo Buster",
      "Onomatopaira", "Onomatopaira",
      "Gagagarevenge", "Gagagarevenge",
      "Xyz Unit", "Xyz Unit",
      "Swords of Revealing Light", "Pot of Greed",
      "Dark Hole", "Monster Reborn", "Mystical Space Typhoon",
      "Mirror Force", "Bottomless Trap Hole", "Bottomless Trap Hole",
      "Xyz Block", "Xyz Block", "Xyz Reborn", "Xyz Reborn",
      "Trap Hole", "Waboku", "Magic Cylinder", "Compulsory Evacuation Device"
    ],
    extraDeck: [
      "Number 17: Leviathan Dragon",
      "Grenosaurus",
      "Submersible Carrier Aero Shark",
      "Gagaga Cowboy"
    ]
  },
  {
    character: "shark",
    displayName: "Reginald Kastle (Shark)",
    world: "Mundo4",
    cards: [
      "Big Jaws", "Big Jaws", "Big Jaws",
      "Skull Kraken", "Skull Kraken", "Skull Kraken",
      "Spear Shark", "Spear Shark", "Spear Shark",
      "Doublefin Shark", "Doublefin Shark", "Doublefin Shark",
      "Silent Angler", "Silent Angler", "Silent Angler",
      "Tin Goldfish", "Tin Goldfish",
      "Monster Reborn", "Dark Hole", "Raigeki",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Pot of Greed", "Generation Force", "Generation Force",
      "Xyz Unit", "Xyz Unit", "Overlay Regen",
      "Mirror Force", "Torrential Tribute", "Torrential Tribute",
      "Bottomless Trap Hole", "Bottomless Trap Hole",
      "Xyz Reborn", "Xyz Reborn", "Xyz Block", "Xyz Block",
      "Magic Cylinder", "Negate Attack", "Waboku"
    ],
    extraDeck: [
      "Submersible Carrier Aero Shark",
      "Submersible Carrier Aero Shark",
      "Black Ray Lancer",
      "Black Ray Lancer",
      "Number 32: Shark Drake",
      "Number 30: Acid Golem of Destruction",
      "Number 17: Leviathan Dragon"
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
      "Doublefin Shark", "Doublefin Shark",
      "Tin Goldfish", "Tin Goldfish", "Tin Goldfish",
      "Goblindbergh", "Goblindbergh",
      "Monster Reborn", "Dark Hole", "Raigeki", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Generation Force", "Generation Force",
      "Xyz Unit", "Overlay Regen", "Overlay Regen",
      "Mirror Force", "Torrential Tribute", "Bottomless Trap Hole", "Bottomless Trap Hole",
      "Xyz Reborn", "Xyz Reborn", "Xyz Block", "Xyz Block",
      "Waboku", "Waboku", "Magic Cylinder", "Negate Attack", "Compulsory Evacuation Device"
    ],
    extraDeck: [
      "Ice Beast Zerofyne",
      "Ice Beast Zerofyne",
      "Number 32: Shark Drake",
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
      "Monster Reborn", "Raigeki", "Dark Hole", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Generation Force", "Generation Force", "Xyz Unit", "Xyz Unit",
      "Overlay Regen", "Overlay Regen",
      "Mirror Force", "Mirror Force", "Bottomless Trap Hole", "Bottomless Trap Hole",
      "Tachyon Transmigration", "Tachyon Transmigration",
      "Xyz Reborn", "Xyz Block", "Magic Cylinder", "Negate Attack"
    ],
    extraDeck: [
      "Starliege Paladynamo",
      "Starliege Paladynamo",
      "Neo Galaxy-Eyes Photon Dragon",
      "Number 10: Illumiknight",
      "Heroic Champion - Excalibur",
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
      "Gogogo Giant", "Gogogo Giant",
      "Tin Goldfish", "Tin Goldfish",
      "Goblindbergh", "Goblindbergh",
      "Monster Reborn", "Dark Hole", "Raigeki", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Onomatopaira", "Onomatopaira",
      "Generation Force", "Generation Force", "Xyz Unit", "Overlay Regen",
      "Mirror Force", "Bottomless Trap Hole", "Bottomless Trap Hole",
      "Xyz Block", "Xyz Block", "Xyz Reborn", "Xyz Reborn",
      "Waboku", "Waboku", "Magic Cylinder", "Negate Attack", "Compulsory Evacuation Device", "Sakuretsu Armor"
    ],
    extraDeck: [
      "Number 33: Chronomaly Machu Mech",
      "Number 33: Chronomaly Machu Mech",
      "Number 50: Blackship of Corn",
      "Gagaga Cowboy",
      "Number 39: Utopia"
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
      "Dododo Warrior", "Dododo Warrior",
      "Kagetokage", "Kagetokage",
      "Goblindbergh", "Goblindbergh",
      "Tin Goldfish", "Tin Goldfish",
      "Rank-Up-Magic Barian's Force", "Rank-Up-Magic Barian's Force",
      "Monster Reborn", "Dark Hole", "Raigeki", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Generation Force", "Generation Force", "Xyz Unit", "Overlay Regen",
      "Mirror Force", "Torrential Tribute", "Bottomless Trap Hole", "Bottomless Trap Hole",
      "Xyz Reborn", "Xyz Reborn", "Xyz Block", "Xyz Block",
      "Magic Cylinder", "Negate Attack", "Waboku", "Fiendish Chain"
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
      "Galaxy-Eyes Photon Dragon", "Galaxy-Eyes Photon Dragon",
      "Photon Thrasher", "Photon Thrasher",
      "Photon Crusher", "Photon Crusher",
      "Goblindbergh", "Goblindbergh",
      "Kagetokage", "Kagetokage",
      "Rank-Up-Magic Barian's Force", "Rank-Up-Magic Barian's Force",
      "Monster Reborn", "Dark Hole", "Raigeki", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Generation Force", "Generation Force", "Xyz Unit", "Overlay Regen",
      "Tachyon Transmigration", "Tachyon Transmigration", "Tachyon Transmigration",
      "Mirror Force", "Bottomless Trap Hole", "Bottomless Trap Hole",
      "Xyz Reborn", "Xyz Reborn", "Xyz Block", "Xyz Block",
      "Magic Cylinder", "Negate Attack"
    ],
    extraDeck: [
      "Number 107: Galaxy-Eyes Tachyon Dragon",
      "Number 107: Galaxy-Eyes Tachyon Dragon",
      "Neo Galaxy-Eyes Photon Dragon",
      "Number 39: Utopia",
      "Starliege Paladynamo"
    ]
  },
  {
    character: "vector",
    displayName: "Vector",
    world: "Mundo4",
    cards: [
      "Umbral Horror Ghoul", "Umbral Horror Ghoul", "Umbral Horror Ghoul",
      "Umbral Horror Unform", "Umbral Horror Unform", "Umbral Horror Unform",
      "Tour Guide From the Underworld", "Tour Guide From the Underworld",
      "Kagetokage", "Kagetokage", "Kagetokage",
      "Goblindbergh", "Goblindbergh",
      "Rank-Up-Magic Barian's Force", "Rank-Up-Magic Barian's Force",
      "Monster Reborn", "Dark Hole", "Raigeki", "Pot of Greed",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Generation Force", "Generation Force", "Xyz Unit", "Overlay Regen",
      "Mirror Force", "Torrential Tribute", "Bottomless Trap Hole", "Bottomless Trap Hole",
      "Xyz Block", "Xyz Block", "Xyz Reborn", "Xyz Reborn",
      "Magic Cylinder", "Negate Attack", "Waboku", "Compulsory Evacuation Device", "Fiendish Chain", "Fiendish Chain"
    ],
    extraDeck: [
      "Number 104: Masquerade",
      "Number 104: Masquerade",
      "Number 66: Master Key Beetle",
      "Number 66: Master Key Beetle",
      "Number 39: Utopia"
    ]
  },
  {
    character: "yuma",
    displayName: "Yuma Tsukumo (& Astral)",
    world: "Mundo4",
    cards: [
      "Gagaga Magician", "Gagaga Magician", "Gagaga Magician",
      "Gagaga Girl", "Gagaga Girl",
      "Gogogo Golem", "Gogogo Golem", "Gogogo Golem",
      "Gogogo Giant", "Gogogo Giant",
      "Zubaba Knight", "Zubaba Knight",
      "Dododo Warrior", "Dododo Warrior",
      "Dododo Buster", "Dododo Buster",
      "Kagetokage", "Kagetokage",
      "Goblindbergh", "Goblindbergh",
      "Tin Goldfish", "Tin Goldfish",
      "Double or Nothing!", "Double or Nothing!", "Double or Nothing!",
      "Onomatopaira", "Onomatopaira",
      "Gagagarevenge", "Gagagarevenge",
      "Rank-Up-Magic Barian's Force",
      "Monster Reborn", "Pot of Greed", "Raigeki", "Dark Hole",
      "Mystical Space Typhoon", "Mystical Space Typhoon",
      "Mirror Force", "Bottomless Trap Hole",
      "Xyz Reborn", "Xyz Reborn", "Xyz Block"
    ],
    extraDeck: [
      "Number 39: Utopia",
      "Number 39: Utopia",
      "Number C39: Utopia Ray",
      "Number 17: Leviathan Dragon",
      "Gagaga Cowboy",
      "Number 50: Blackship of Corn",
      "Heroic Champion - Excalibur",
      "Grenosaurus"
    ]
  }
];

zexalDecks.forEach(d => {
  const p = path.join(DECKS_DIR, `${d.character}.json`);
  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
  console.log(`Deck created: ${d.displayName} -> ${p}`);
});
