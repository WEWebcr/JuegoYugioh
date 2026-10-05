const fs = require('fs');
const path = require('path');
let html = fs.readFileSync('C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/FMR_V3_0_7_BANDAI1998_MENU.html', 'utf8');

// 1. Fix native missing <script> tag before V3.0.5
html = html.replace(/(<\/script>\s*\r?\n)(\s*\/\*\s*V3\.0\.5)/i, (m, p1, p2) => m.includes('<script>') ? m : p1 + '<script>\n' + p2);

// 1.5 Neutralize legacy background audio (menu_principal.mp3, muteAll, menuMusic)
html = html.replace("audio=new Audio('assets/menu_principal.mp3');", "audio=null; return null;");
html = html.replace("if(!muted) start();", "/* gesture audio disabled */");
html = html.replace("function muteAll(){", "function muteAll(){ return; /* disabled */");
html = html.replace(/function menuMusic\(\)\{[\s\S]*?catch\(e\)\{\}\}/, "function menuMusic(){}");
html = html.replace(/function stopMusic\(\)\{[\s\S]*?catch\(e\)\{\}\}/, "function stopMusic(){}");
html = html.replace(/menuMusic\(\);/g, "void 0;");
html = html.replace(/stopMusic\(\);/g, "void 0;");

// 2. Inject nativeAPI
let target = '[80,400,1200,3000,6000,10000,15000,22000].forEach(t=>setTimeout(stamp,t));';
let injection = target + `
window.nativeAPI = window.nativeAPI || {};
try { window.nativeAPI.showShop = showShop; } catch(e){}
try { window.nativeAPI.showCollection = showCollection; } catch(e){}
try { window.nativeAPI.showDeckEditor = showDeckEditor; } catch(e){}
try { window.nativeAPI.showFusions = showFusions; } catch(e){}
try { if (typeof beginStoryDuel !== 'undefined') window.nativeAPI.beginStoryDuel = beginStoryDuel; } catch(e){}
if (!window.nativeAPI.beginStoryDuel && typeof window.beginStoryDuel === 'function') window.nativeAPI.beginStoryDuel = window.beginStoryDuel;
try { window.nativeAPI.openDuelist = openDuelist; } catch(e){}
try { window.nativeAPI.showMap = showMap; } catch(e){}
try { window.nativeAPI.loadGame = loadGame; } catch(e){}
try { window.nativeAPI.saveGame = saveGame; } catch(e){}
try { window.nativeAPI.freshState = freshState; } catch(e){}
try { window.nativeAPI.showMain = showMain; } catch(e){}
try { window.nativeAPI.showPrologue = showPrologue; } catch(e){}
try { window.nativeAPI.showShell = showShell; } catch(e){}
try { if (typeof finishStoryDuel !== 'undefined') window.nativeAPI.finishStoryDuel = finishStoryDuel; } catch(e){}
if (!window.nativeAPI.finishStoryDuel && typeof window.finishStoryDuel === 'function') window.nativeAPI.finishStoryDuel = window.finishStoryDuel;
try { window.nativeAPI.setMemorySave = function(ns) { memorySave = ns; }; } catch(e){}
try { window.nativeAPI.getMemorySave = function() { return memorySave; }; } catch(e){}
try { window.nativeAPI.setStoryDuelActive = function(v) { storyDuelActive = v; window.storyDuelActive = v; }; } catch(e){}
try { window.nativeAPI.setStoryOpponent = function(v) { storyOpponent = v; window.storyOpponent = v; }; } catch(e){}
try { window.nativeAPI.setStoryDeckReady = function(v) { storyDeckReady = v; window.storyDeckReady = v; }; } catch(e){}
try { window.nativeAPI.setDuelHandled = function(v) { duelHandled = v; window.duelHandled = v; }; } catch(e){}
try { window.nativeAPI.getDuelHandled = function() { return duelHandled; }; } catch(e){}
try { window.nativeAPI.getStoryDuelActive = function() { return storyDuelActive; }; } catch(e){}
try { window.nativeAPI.getStoryOpponent = function() { return storyOpponent; }; } catch(e){}
try { window.nativeAPI.installStoryDecks = installStoryDecks; } catch(e){}
try { window.MASTER40 = MASTER40; } catch(e){}
try { window.CARDS109 = CARDS109; } catch(e){}
try { window.CARD_FILES = CARD_FILES; } catch(e){}
try { window.BANDAI_ART_FILES = BANDAI_ART_FILES; } catch(e){}
console.log('NATIVE API INJECTED:', Object.keys(window.nativeAPI));
`;

html = html.replace(target, injection);

// 3.1 Intercept newGame to avoid default Tristan deck
html = html.replace("['Sword of Dark Destruction',4,'Warrior','DARK',1000,1000],", "");
html = html.replace('function newGame(){', 'function newGame(){ if(window.customNewGame){ return window.customNewGame(); }');
html = html.replace(/onclick="newGame\(\)"/g, 'onclick="if(window.customNewGame) window.customNewGame(); else newGame();"');
html = html.replace('newGame=function(){', 'newGame=function(){ if(window.customNewGame) return window.customNewGame();');
html = html.replace('function freshGame53(){', 'function freshGame53(){ if(window.customNewGame) return window.customNewGame();');

// 3.1.2 Replace hardcoded DEFAULT_DECK of Tristan in base HTML
html = html.replace(/const DEFAULT_DECK = [\s\S]*?;\s*const TRISTAN_DECK/m, function() {
    return 'const DEFAULT_DECK = (typeof window !== "undefined" && typeof window.generateForbiddenMemoriesStarterDeck === "function") ? window.generateForbiddenMemoriesStarterDeck() : [\n' +
    '  "Baby Dragon", "Petit Dragon", "Koumori Dragon", "Thunder Dragon",\n' +
    '  "Celtic Guardian", "Zanki", "Beaver Warrior", "Battle Ox",\n' +
    '  "Mystical Elf", "Flame Manipulator", "Feral Imp", "Dark Magician",\n' +
    '  "Giant Soldier of Stone", "Silver Fang", "Man-Eater Bug", "Dragon Zombie",\n' +
    '  "Curse of Dragon", "Gaia the Fierce Knight", "Summoned Skull", "Meteor Dragon",\n' +
    '  "Beastking of the Swamps", "Baby Dragon", "Petit Dragon", "Celtic Guardian",\n' +
    '  "Battle Ox", "Silver Fang", "Mystical Elf", "Feral Imp",\n' +
    '  "Mountain", "Dragon Treasure", "Black Pendant", "Horn of the Unicorn",\n' +
    '  "Axe of Despair", "Pot of Greed", "Renace al Monstruo", "Fissure",\n' +
    '  "Trap Hole", "Waboku", "Sakuretsu Armor", "Dust Tornado"\n' +
    '];\nconst TRISTAN_DECK';
});

// 3. Intercept functions
html = html.replace('function showMap(){', 'function showMap(){ if(window.customShowMap && !window.forceNativeMap){ window.customShowMap(); return; }');
html = html.replace('function showMain(){', 'function showMain(){ if(window.customShowMain){ window.customShowMain(); return; }');
html = html.replace('function showPrologue(i){', 'function showPrologue(i){ if(window.customShowPrologue){ window.customShowPrologue(i); return; }');
html = html.replace('function finishStoryDuel(win){', 'function finishStoryDuel(win){ if(!storyDuelActive||duelHandled) return; duelHandled=true; storyDuelActive=false; window.storyDuelActive=false; storyDeckReady=false; if(window.customFinishStoryDuel){ window.customFinishStoryDuel(win); return; }');
html = html.replace("b.addEventListener('click',setMonster103);", "b.addEventListener('click',function(e){ if(typeof window.setMonster103==='function') return window.setMonster103.apply(this,arguments); return setMonster103.apply(this,arguments); });");
// setMonster103 recursive hook removed to prevent call stack overflow
html = html.replace('function loadGame(){if(memorySave)return memorySave;try{const x=localStorage.getItem(SAVE_KEY);', 'function loadGame(){try{const k=window.activeAccount?("FMR_SAVE_"+window.activeAccount):SAVE_KEY;const x=localStorage.getItem(k)||localStorage.getItem(SAVE_KEY);if(x)memorySave=JSON.parse(x);return memorySave;}catch(_){}if(memorySave)return memorySave;try{const x=localStorage.getItem(SAVE_KEY);');
html = html.replace('function log(t){', 'function log(t){ if(window.customLog) window.customLog(t); ');
html = html.replace('function paint96(p){', 'function paint96(p){ if(window.onPhaseChange) window.onPhaseChange(p); ');
html = html.replace('function enemyHand58(chosen=-1){', 'function enemyHand58(chosen=-1){ if(window.onEnemyHand) window.onEnemyHand(chosen); ');
html = html.replace('function enemyHand50(chosen=-1){', 'function enemyHand50(chosen=-1){ if(window.onEnemyHand) window.onEnemyHand(chosen); ');
html = html.replace("window.playEndTurnSound    = function() { _sfx('cambiofase.mp3', 0.8); };", "window.playEndTurnSound = function() { if(window.customPlayEndTurnSound) return window.customPlayEndTurnSound(); _sfx('endturn.mp3', 1.0); };");

// 3.5 Sanitize corrupted characters and symbols from base HTML
html = html
  .replace(/INVOCACI[^\w\s]*\s*N/g, 'INVOCACIÓN')
  .replace(/SINCRONIZACI[^\w\s]*\s*N/g, 'SINCRONIZACIÓN')
  .replace(/INFORMACI[^\w\s]*\s*N/g, 'INFORMACIÓN')
  .replace(/FUSI[^\w\s]*\s*N/g, 'FUSIÓN')
  .replace(/POSICI[^\w\s]*\s*N/g, 'POSICIÓN')
  .replace(/DESAPARECI[^\w\s]*\s*/g, 'DESAPARECIÓ ')
  .replace(/PLUT[^\w\s]*\s*N/g, 'PLUTÓN')
  .replace(/J[^\w\s]*P\./g, 'JÚP.')
  .replace(/J[^\w\s]*PITER/g, 'JÚPITER')
  .replace(/P[^\w\s]*0NDULO/g, 'PÉNDULO')
  .replace(/content:\s*"[^"]*S[^"]*"\s*;/g, 'content:" ⭐";')
  .replace(/onclick="closePile\(\)">[^<]*<\/button>/g, 'onclick="closePile()">✕</button>')
  .replace(/\ufffda[\ufffd\x00-\x1f\ufe0f\s]*ATAQUE/g, '⚔ ATAQUE')
  .replace(/\ufffdx:?[\ufffd\x00-\x1f\ufe0f\s]*DEFENSA/g, '🛡 DEFENSA')
  .replace(/\ufffda[\ufffd\x00-\x1f\ufe0f\s]*ATK/g, '⚔ ATK')
  .replace(/\ufffdx:?[\ufffd\x00-\x1f\ufe0f\s]*DEF/g, '🛡 DEF')
  .replace(/content:'\ufffda[\ufffd\x00-\x1f\ufe0f\s]*'/g, "content:'⚔ '")
  .replace(/content:'\ufffdx:?[\ufffd\x00-\x1f\ufe0f\s]*'/g, "content:'🛡 '")
  .replace(/<span class="atk">\ufffda[\ufffd\x00-\x1f\ufe0f\s]*/g, '<span class="atk">⚔ ')
  .replace(/<span class="def">\ufffdx:?[\ufffd\x00-\x1f\ufe0f\s]*/g, '<span class="def">🛡 ')
  .replace(/'\ufffdx:?[\ufffd\x00-\x1f\ufe0f\s]*'\s*\+\s*d/g, "'🛡 ' + d")
  .replace(/'\ufffdx:?[\ufffd\x00-\x1f\ufe0f\s]*'\s*\+\s*def/g, "'🛡 ' + def")
  .replace(/'\ufffda[\ufffd\x00-\x1f\ufe0f\s]*'\s*\+\s*a/g, "'⚔ ' + a")
  .replace(/'\ufffda[\ufffd\x00-\x1f\ufe0f\s]*'\s*\+\s*atk/g, "'⚔ ' + atk")
  .replace(/'\ufffdx:\ufffd\s*DEF'/g, "'🛡 DEF'")
  .replace(/'\ufffda\x1d\s*ATK'/g, "'⚔ ATK'")
  .replace(/'\ufffda\s+ATK'/g, "'⚔ ATK'")
  .replace(/const SIGN_SYMBOL\s*=\s*\{[^}]+\};/g, "const SIGN_SYMBOL={SOL:'☉',LUNA:'☽',MERCURIO:'☿',VENUS:'♀',MARTE:'♂',JUPITER:'♃',SATURNO:'♄',URANO:'♅',NEPTUNO:'♆',PLUTON:'♇'};")
  .replace(/const SYMBOL\s*=\s*window\.FMR_SIGN_SYMBOL\s*\|\|\s*\{[^}]+\};/g, "const SYMBOL=window.FMR_SIGN_SYMBOL||{SOL:'☉',LUNA:'☽',MERCURIO:'☿',VENUS:'♀',MARTE:'♂',JUPITER:'♃',SATURNO:'♄',URANO:'♅',NEPTUNO:'♆',PLUTON:'♇'};")
  .replace(/const LABEL\s*=\s*\{[^}]+\};/g, "const LABEL={SOL:'SOL',LUNA:'LUNA',VENUS:'VENUS',MERCURIO:'MERC.',NEPTUNO:'NEPT.',MARTE:'MARTE',JUPITER:'JÚP.',SATURNO:'SAT.',URANO:'URANO',PLUTON:'PLUTÓN'};")
  .replace(/['"][^'"]*&\s*['"]\.repeat/g, "'★'.repeat")
  .replace(/c\.kind==='LINK'\?'\s*'\s*:/g, "c.kind==='LINK'?'—':")
  .replace(/type\|\|c\[2\]\|\|'[^\']*'/g, "type||c[2]||'?'")
  .replace(/attr\|\|c\[3\]\|\|'[^\']*'/g, "attr||c[3]||'?'")
  .replace(/\ufffd&\ufffd/g, '★')
  .replace(/\ufffdS\ufffd/g, '⭐');

let mappings = {};
try {
    mappings = JSON.parse(fs.readFileSync('C:/Deploy/proyectoygo/card_mappings.json', 'utf8'));
} catch(e) {}

let cardsData = [];
try {
    cardsData = JSON.parse(fs.readFileSync('C:/Deploy/proyectoygo/data/cards.json', 'utf8'));
} catch(e) {}

// 4. Scan Images
let customImages = {};
try {
    const files = fs.readdirSync('C:/Deploy/proyectoygo/imagenescartas/Mundo1');
    files.forEach(f => {
        let match = f.match(/^(\d+)\.(jpg|jpeg|png)$/i);
        if (match) {
            customImages[parseInt(match[1])] = 'imagenescartas/Mundo1/' + f;
            customImages[f] = 'imagenescartas/Mundo1/' + f;
        }
    });
} catch(e) {
    console.log('Mundo1 images folder not found during build');
}

function scanDirRecursive(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(it => {
        const full = path.join(dir, it.name);
        if (it.isDirectory()) {
            scanDirRecursive(full);
        } else {
            const rel = full.replace(/\\/g, '/').replace(/^.*?(imagenescartas\/)/i, '$1');
            customImages[it.name] = rel;
            const match = it.name.match(/^(\d+)\.(jpg|jpeg|png)$/i);
            if (match) {
                customImages[parseInt(match[1])] = rel;
            }
        }
    });
}
try {
    scanDirRecursive('C:/Deploy/proyectoygo/imagenescartas/Mundo2');
} catch(e) {
    console.log('Mundo2 images folder error:', e.message);
}
try {
    scanDirRecursive('C:/Deploy/proyectoygo/imagenescartas/Mundo3');
} catch(e) {
    console.log('Mundo3 images folder error:', e.message);
}

// Ensure every card in cardsData with an image property is registered by ID and name
if (Array.isArray(cardsData)) {
    cardsData.forEach(c => {
        if (c.id && c.image) {
            customImages[c.id] = c.image;
            if (c.name) customImages[c.name] = c.image;
        }
    });
}

let characterDecks = {};
try {
    const deckFiles = fs.readdirSync('C:/Deploy/proyectoygo/data/decks');
    deckFiles.forEach(f => {
        if (f.endsWith('.json')) {
            const d = JSON.parse(fs.readFileSync('C:/Deploy/proyectoygo/data/decks/' + f, 'utf8'));
            const key = d.character || f.replace('.json', '');
            characterDecks[key] = d;
        }
    });
} catch(e) {
    console.log('Decks folder not found during build');
}

let patch = fs.readFileSync('C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js', 'utf8');
let mobilePatch = '';
try {
    mobilePatch = fs.readFileSync('C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/mobile_patch.js', 'utf8');
} catch(e) {
    console.log('mobile_patch.js not found');
}

// 5. Append patch cleanly at end of HTML
let outHtml = html + '\n<script>\nwindow.CUSTOM_LOCAL_IMAGES = ' + JSON.stringify(customImages) + ';\nwindow.CARD_MAPPINGS = ' + JSON.stringify(mappings) + ';\nwindow.CARDS_DATA = ' + JSON.stringify(cardsData) + ';\nwindow.CHARACTER_DECKS = ' + JSON.stringify(characterDecks) + ';\n</script>\n<script>\n' + patch + '\n</script>\n<script>\n' + mobilePatch + '\n</script>\n';

fs.writeFileSync('C:/Deploy/proyectoygo/YGOFMR2026-1.html', outHtml);
console.log('Build V6 successful! Output size: ' + outHtml.length + ' bytes');
