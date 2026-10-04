/**
 * Generador de Baraja Inicial estilo Yu-Gi-Oh! Forbidden Memories (PS1)
 * Genera una baraja de exactamente 40 cartas balanceada, con materiales de fusión,
 * cartas mágicas/equipos, trampas y una carta As / Jefe única para cada jugador.
 */
const fs = require('fs');
const path = require('path');

let cachedCards = null;

function getCardsCatalog() {
  if (cachedCards) return cachedCards;
  try {
    const p = path.join(__dirname, 'data', 'cards.json');
    if (fs.existsSync(p)) {
      cachedCards = JSON.parse(fs.readFileSync(p, 'utf8'));
      return cachedCards;
    }
  } catch (_) {}
  return [];
}

function generateForbiddenMemoriesStarterDeck(customCatalog) {
  const catalog = (Array.isArray(customCatalog) && customCatalog.length > 0) ? customCatalog : getCardsCatalog();
  const deck = [];
  const cardCounts = {};

  function addCard(name) {
    if (!name) return false;
    if ((cardCounts[name] || 0) >= 2) return false; // Máximo 2 copias por carta para asegurar variedad
    deck.push(name);
    cardCounts[name] = (cardCounts[name] || 0) + 1;
    return true;
  }

  function pickRandom(pool, count, maxTries = 150) {
    if (!pool || pool.length === 0) return;
    let added = 0;
    let tries = 0;
    while (added < count && tries < maxTries) {
      tries++;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const name = pick.name || pick[0];
      if (addCard(name)) {
        added++;
      }
    }
  }

  // Filtrar solo cartas legales de baraja principal (excluir FUSION, LINK, Divine-Beast / Dioses Egipcios)
  const mainCards = catalog.filter(c => {
    const k = c.kind || c.type || '';
    return k !== 'FUSION' && k !== 'LINK' && c.type !== 'Divine-Beast' && c.type !== 'Ritual';
  });

  // 1. CARTA AS / JEFE DE LA BARAJA (1 carta)
  // Monstruos nivel 5 a 7, ATK 1600 - 2500 o DEF >= 2000
  const acePool = mainCards.filter(c =>
    c.kind === 'MONSTER' &&
    (c.level >= 5 && c.level <= 7) &&
    ((c.atk >= 1600 && c.atk <= 2500) || c.def >= 2000)
  );
  pickRandom(acePool, 1);

  // 2. MONSTRUOS FUERTES DE NIVEL 4 (3 cartas)
  // Monstruos nivel 4 con ATK 1200 - 1600 o DEF 1800 - 2100
  const strongL4Pool = mainCards.filter(c =>
    c.kind === 'MONSTER' &&
    c.level <= 4 &&
    ((c.atk >= 1200 && c.atk <= 1600) || (c.def >= 1800 && c.def <= 2100))
  );
  pickRandom(strongL4Pool, 3);

  // 3. MATERIALES DE FUSIÓN Y TROPAS BÁSICAS (24 cartas)
  // Distribuidas por tipos elementales para garantizar fusiones clásicas
  const dragons = mainCards.filter(c => c.kind === 'MONSTER' && (c.type === 'Dragon' || (c.name && c.name.toLowerCase().includes('dragon'))) && (c.atk <= 1500 || c.level <= 4));
  const thunderMachine = mainCards.filter(c => c.kind === 'MONSTER' && (c.type === 'Thunder' || c.type === 'Machine') && (c.atk <= 1400 || c.level <= 4));
  const warriors = mainCards.filter(c => c.kind === 'MONSTER' && c.type === 'Warrior' && (c.atk <= 1400 || c.level <= 4));
  const pyros = mainCards.filter(c => c.kind === 'MONSTER' && (c.type === 'Pyro' || c.attr === 'FIRE') && (c.atk <= 1400 || c.level <= 4));
  const beasts = mainCards.filter(c => c.kind === 'MONSTER' && (c.type === 'Beast' || c.type === 'Beast-Warrior') && (c.atk <= 1400 || c.level <= 4));
  const spellcastersFiends = mainCards.filter(c => c.kind === 'MONSTER' && (c.type === 'Spellcaster' || c.type === 'Fiend') && (c.atk <= 1400 || c.level <= 4));
  const others = mainCards.filter(c => c.kind === 'MONSTER' && ['Plant', 'Insect', 'Aqua', 'Zombie', 'Rock', 'Fish', 'Fairy', 'Winged Beast'].includes(c.type) && (c.atk <= 1400 || c.level <= 4));
  const anyLowMonster = mainCards.filter(c => c.kind === 'MONSTER' && (c.level <= 4 || c.atk <= 1400));

  pickRandom(dragons, 3);
  pickRandom(thunderMachine, 3);
  pickRandom(warriors, 3);
  pickRandom(pyros, 3);
  pickRandom(beasts, 3);
  pickRandom(spellcastersFiends, 3);
  pickRandom(others, 3);
  pickRandom(anyLowMonster, 28 - deck.length);

  // 4. MÁGICAS Y EQUIPOS PROGRAMADOS (6 cartas)
  // ÚNICAMENTE cartas de magia y equipo completamente programadas y funcionales en el motor de duelo
  const PROGRAMMED_STARTER_SPELLS = [
    // Equipos clásicos con soporte funcional
    'Axe of Despair', 'Black Pendant', 'Horn of the Unicorn', 'Dragon Treasure',
    'Malevolent Nuzzler', 'Sword of Dark Destruction', 'Dark Energy', 'Invigoration',
    'Electro-whip', 'Cyber Shield', 'Mystical Moon', 'Silver Bow and Arrow',
    'Book of Secret Arts', "Elf's Light", 'Beast Fangs', 'Steel Shell', 'Vile Germs',
    'Kunai with Chain', 'Fusion Weapon', 'United We Stand', 'Legendary Sword',
    'Laser Cannon Armor', 'Insect Armor with Laser Cannon', 'Horn of Light',
    'Machine Conversion Factory', 'Raise Body Heat', 'Follow Wind', 'Power of Kaishin',
    'Violet Crystal', 'Shine Palace', 'Salamandra',
    // Magias normales / utilitarias totalmente implementadas
    'Pot of Greed', 'Graceful Charity', 'Renace al Monstruo', 'Fissure', 'Stop Defense',
    'Dragon Capture Jar', 'Dian Keto the Cure Master', 'Soul of the Pure',
    "Goblin's Secret Remedy", 'Red Medicine', 'Mooyan Curry', 'Ookazi', 'Hinotama',
    'Sparks', 'Final Flame', 'Tremendous Fire',
    // Campos implementados (+500 stats)
    'Mountain', 'Yami', 'Umi', 'Forest', 'Wasteland', 'Sogen', 'Swords of Revealing Light'
  ];

  const spellPool = mainCards.filter(c =>
    (c.kind === 'SPELL' || c.kind === 'EQUIP') &&
    PROGRAMMED_STARTER_SPELLS.includes(c.name)
  );
  pickRandom(spellPool, 6);

  // 5. TRAMPAS PROGRAMADAS (6 cartas)
  // ÚNICAMENTE trampas que tienen lógica de activación implementada
  const PROGRAMMED_STARTER_TRAPS = [
    'Trap Hole', 'Acid Trap Hole', 'Sakuretsu Armor', 'Waboku', 'Dust Tornado',
    'Negate Attack', 'Widespread Ruin', 'Eatgaboon', 'Bear Trap', 'Invisible Wire',
    'Threatening Roar'
  ];

  const trapPool = mainCards.filter(c =>
    c.kind === 'TRAP' &&
    PROGRAMMED_STARTER_TRAPS.includes(c.name)
  );
  pickRandom(trapPool, 6);

  // Completar hasta 40 cartas exactas si hiciera falta
  while (deck.length < 40) {
    pickRandom(anyLowMonster, 1, 200);
  }

  // Barajar el mazo para mezclar las posiciones
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, 40);
}

module.exports = {
  generateForbiddenMemoriesStarterDeck
};
