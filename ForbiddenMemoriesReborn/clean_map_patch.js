// Inyectar CARDS_DATA en FMR_CARD_META y DB
(function() {
  function syncCardsData() {
    if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
      window.FMR_CARD_META = window.FMR_CARD_META || {};
      window.FMR_ST_POOL_V1 = window.FMR_ST_POOL_V1 || [];
      window.CARDS_DATA.forEach(function(c) {
        if (!c || !c.name) return;
        var k = String(c.kind || '').toUpperCase();
        var t = String(c.type || '').toLowerCase();
        var isST = k === 'SPELL' || k === 'TRAP' || k === 'EQUIP' || k === 'FIELD' || t.includes('equip') || t.includes('field');
        if (isST) {
          if (window.FMR_CARD_META[c.name]) delete window.FMR_CARD_META[c.name];
          if (typeof DB !== 'undefined' && Array.isArray(DB)) {
            var dbIdx = DB.findIndex(function(x){ return x && x[0] === c.name; });
            if (dbIdx >= 0) DB.splice(dbIdx, 1);
          }
          var stKind = k === 'TRAP' ? 'TRAP' : (k === 'EQUIP' || t.includes('equip') ? 'EQUIP' : 'SPELL');
          var stObj = {
            name: c.name, kind: stKind, value: c.value || c.name.toUpperCase().replace(/\s+/g, '_'),
            text: c.text || c.desc || '', faceUp: true
          };
          if (!window.FMR_ST_POOL_V1.find(function(x){ return x && x.name === c.name; })) {
            window.FMR_ST_POOL_V1.push(stObj);
          }
          if (typeof STDB !== 'undefined' && Array.isArray(STDB) && !STDB.find(function(x){ return x && x.name === c.name; })) {
            STDB.push(stObj);
          }
        } else if (k === 'MONSTER' || k === 'FUSION' || (!k && c.atk !== undefined)) {
          if (!window.FMR_CARD_META[c.name]) {
            window.FMR_CARD_META[c.name] = {
              name: c.name, level: c.level || 4, type: c.type || 'Warrior', attr: c.attr || 'EARTH',
              atk: c.atk || 0, def: c.def || 0, sign1: c.sign1 || 'MARTE', sign2: c.sign2 || 'JUPITER',
              signs: [c.sign1 || 'MARTE', c.sign2 || 'JUPITER'], tags: c.kind === 'FUSION' ? ['FUSION'] : [],
              kind: c.kind === 'FUSION' ? 'FUSION' : null, desc: c.desc || c.text || ''
            };
          }
          if (typeof DB !== 'undefined' && Array.isArray(DB) && !DB.find(function(x){ return x && x[0] === c.name; })) {
            DB.push([c.name, c.level || 4, c.type || 'Warrior', c.attr || 'EARTH', c.atk || 0, c.def || 0, c.sign1 || 'MARTE', c.sign2 || 'JUPITER']);
          }
        }
      });
    }
  }
  syncCardsData();
  document.addEventListener('DOMContentLoaded', syncCardsData);

  // Global robust card resolver
  window.resolveGameCard = function(name) {
    if (!name) return null;
    var pool = window.FMR_ST_POOL_V1 || [];
    var st = pool.find(function(c) { return c && (c.name === name || (c.name && c.name.toLowerCase() === name.toLowerCase())); });
    if (st) return Object.assign({}, st, { faceUp: true });
    if (typeof DB !== 'undefined' && Array.isArray(DB)) {
      var d = DB.find(function(x) { return x && (x[0] === name || (x[0] && x[0].toLowerCase() === name.toLowerCase())); });
      if (d) return { name: d[0], level: d[1], type: d[2], attr: d[3], atk: d[4], def: d[5], pos: 'ATK', materials: [], faceUp: true };
    }
    if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
      var cd = window.CARDS_DATA.find(function(x) { return x && (x.name === name || (x.name && x.name.toLowerCase() === name.toLowerCase())); });
      if (cd) {
        if (cd.kind === 'SPELL' || cd.kind === 'TRAP' || cd.kind === 'EQUIP') {
          return { name: cd.name, kind: cd.kind, value: cd.value || cd.name.toUpperCase().replace(/\s+/g, '_'), text: cd.text || cd.desc || '', faceUp: true };
        } else {
          return { name: cd.name, level: cd.level || 4, type: cd.type || 'Warrior', attr: cd.attr || 'EARTH', atk: cd.atk || 0, def: cd.def || 0, pos: 'ATK', materials: [], faceUp: true };
        }
      }
    }
    if (typeof mkST === 'function') {
      var st2 = mkST(name);
      if (st2) return st2;
    }
    if (typeof mk === 'function') {
      var m2 = mk(name);
      if (m2) return m2;
    }
    return null;
  };

  // Synchronize DUELISTS array
  if (typeof DUELISTS !== 'undefined') {
    var existingDuelistIds = DUELISTS.map(function(d){ return d.id; });
    [
      {id:'mako',name:'Mako Tsunami',stars:2,theme:'WATER · Océano · Mar',iconic:'The Legendary Fisherman',rare:'Fortress Whale',implemented:true},
      {id:'kosaburo',name:'Kosaburo Kaiba',stars:4,theme:'Máquinas · Presión',iconic:'Exodia Necross',implemented:true},
      {id:'seto',name:'Seto Kaiba',stars:4,theme:'Dragones · Poder',iconic:'Blue-Eyes White Dragon',rare:'Blue-Eyes Ultimate Dragon',implemented:true}
    ].forEach(function(d) {
      if (!existingDuelistIds.includes(d.id)) DUELISTS.push(d);
    });
  }

  // Synchronize all character decks into STORY_DECKS immediately
  if (typeof STORY_DECKS !== 'undefined' && window.CHARACTER_DECKS) {
    Object.keys(window.CHARACTER_DECKS).forEach(function(k) {
      if (window.CHARACTER_DECKS[k] && Array.isArray(window.CHARACTER_DECKS[k].cards)) {
        STORY_DECKS[k] = window.CHARACTER_DECKS[k].cards.slice();
      }
    });
    if (STORY_DECKS.kaiba) STORY_DECKS.seto = STORY_DECKS.kaiba.slice();
    if (STORY_DECKS.kosaburo) STORY_DECKS.gozaburo = STORY_DECKS.kosaburo.slice();
  }

  if (typeof window.mkST === 'function') {
    var origMkST = window.mkST;
    window.mkST = function(name) {
      var r = origMkST(name);
      if (r) return r;
      if (window.FMR_ST_POOL_V1) {
        var found = window.FMR_ST_POOL_V1.find(function(x){ return x && x.name === name; });
        if (found) return Object.assign({}, found, { faceUp: true });
      }
      return null;
    };
    try { mkST = window.mkST; } catch(_) {}
  }
})();

// STARTUP GUARD: hide duel board immediately
(function() {
  function _hideBoard() {
    var w = document.getElementById('duelBoardWrapper');
    if (w) w.style.display = 'none';
    var t = document.getElementById('duelTopHeader');
    if (t) t.style.display = 'none';
  }
  _hideBoard();
  document.addEventListener('DOMContentLoaded', _hideBoard);
  window.addEventListener('load', _hideBoard);
  setTimeout(_hideBoard, 100);
  setTimeout(_hideBoard, 500);
})();

// V5 PATCH - Direct Native Interception

// Remove previous overrides to localStorage just in case
delete localStorage.setItem;
delete localStorage.getItem;
const origSet = localStorage.setItem.bind(localStorage);
const origGet = localStorage.getItem.bind(localStorage);

localStorage.setItem = function(k, v) {
    origSet(k, v);
    if (k === 'FMR_BGM_OFF') {
        let audio = document.getElementById('bgm3000');
        if (audio) {
            if (v === '1') audio.pause();
            else audio.play().catch(e=>{});
        }
    }
};

window.activeAccount = localStorage.getItem('FMR_ACTIVE_ACCOUNT') || null;

window.cleanAllOverlays = function() {
    document.querySelectorAll('#map-container-overlay').forEach(el => el.remove());
    document.querySelectorAll('#custom-freeduel-menu').forEach(el => el.remove());
    document.querySelectorAll('#custom-shop-overlay').forEach(el => el.remove());
    document.querySelectorAll('#custom-reward-choice-overlay').forEach(el => el.remove());
    document.querySelectorAll('#custom-dialog-fullscreen').forEach(el => el.remove());
    document.querySelectorAll('#relic-celebration-modal').forEach(el => el.remove());
    let camp = document.getElementById('campaign3000');
    if (camp) {
        camp.innerHTML = '';
        camp.classList.add('hidden');
        camp.style.display = 'none';
    }
};

window.persistUserSave = function(s) {
    if (!s) return;
    try {
        window.activeAccount = localStorage.getItem('FMR_ACTIVE_ACCOUNT') || window.activeAccount || null;
        if (window.activeAccount) {
            try { localStorage.setItem('FMR_ACTIVE_ACCOUNT', window.activeAccount); } catch(_) {}
        }
        window.memorySave = s;
        let json = JSON.stringify(s);
        if (window.activeAccount) {
            origSet('FMR_SAVE_' + window.activeAccount, json);
            let accs = JSON.parse(origGet('FMR_ACCOUNTS') || '{}');
            if (accs[window.activeAccount]) {
                accs[window.activeAccount].data = s;
                origSet('FMR_ACCOUNTS', JSON.stringify(accs));
            }
        }
        origSet('FMR_REBORN_STORY_V3000', json);
        if (window.nativeAPI && window.nativeAPI.setMemorySave) {
            window.nativeAPI.setMemorySave(s);
        }
        if (typeof window.sendServerSave === 'function') {
            window.sendServerSave(s);
        }
    } catch(e) {
        console.error('[persistUserSave error]', e);
    }
};

setTimeout(() => {
    if (window.nativeAPI && window.nativeAPI.finishStoryDuel && !window.nativeAPI.origFinishStoryDuel) {
        window.nativeAPI.origFinishStoryDuel = window.nativeAPI.finishStoryDuel;
        window.nativeAPI.finishStoryDuel = function(win) {
            if (!win && window.lastDuelOpponent) {
                try {
                    let sStr = origGet('FMR_SAVE_' + window.activeAccount);
                    if (sStr) {
                        let s = JSON.parse(sStr);
                        if (!s.losses) s.losses = {};
                        s.losses[window.lastDuelOpponent] = (s.losses[window.lastDuelOpponent] || 0) + 1;
                        origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
                    }
                } catch(e) {}
            }
            return window.nativeAPI.origFinishStoryDuel.apply(this, arguments);
        };
    }
}, 500);

const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet'; fontLink.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
document.head.appendChild(fontLink);

let duelScaleStyle = document.createElement('style');
duelScaleStyle.id = 'ygo-responsive-mobile-engine';
duelScaleStyle.textContent = `
    /* Fuente global VT323 */
    body, button, input, select { font-family: VT323, monospace !important; }
    .lp, #campaignDuelHud3000 { font-size: 20px !important; letter-spacing: 1px; }

    /* ════════════════════════════════════════════════════════════════
       1. PANTALLAS DE ESCRITORIO GRANDES (> 1024px y altura > 560px)
       ════════════════════════════════════════════════════════════════ */
    @media (min-width: 1025px) and (min-height: 561px) {
        .wrap { zoom: 1.20; margin-top: 3vh !important; }
        .cardInfoPanel { transform: scale(1.15); transform-origin: center right; font-size: 15px !important; }
        .cardInfoPanel h3 { font-size: 16px !important; }
    }

    /* ════════════════════════════════════════════════════════════════
       2. TABLETS Y PANTALLAS MEDIANAS (769px - 1024px y altura > 560px)
       ════════════════════════════════════════════════════════════════ */
    @media (min-width: 769px) and (max-width: 1024px) and (min-height: 561px) {
        .wrap { zoom: 0.95; margin-top: 1vh !important; max-width: 98vw !important; }
        .cardInfoPanel { transform: scale(0.95); font-size: 14px !important; }
    }

    /* ════════════════════════════════════════════════════════════════
       3. MODO MÓVIL AUTOMÁTICO (TELÉFONOS SMARTPHONE <= 768px)
       ════════════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
        html, body {
            overflow-x: hidden !important;
            -webkit-text-size-adjust: 100% !important;
            touch-action: manipulation !important;
        }

        /* Prevenir auto-zoom molesto en iPhones y Androids */
        input, select, textarea, button {
            font-size: 16px !important;
        }

        /* TABLERO DE DUELO EN MÓVIL (Ajuste óptimo de escala y altura) */
        .wrap {
            zoom: 0.76 !important;
            max-width: 100vw !important;
            margin: 0 auto !important;
            padding: 2px !important;
        }
        .board {
            grid-template-columns: 46px minmax(0,1fr) 46px !important;
            gap: 4px !important;
            padding: 4px !important;
            border-radius: 8px !important;
        }
        :root {
            --zoneH: 76px !important;
        }
        .zones {
            grid-auto-rows: 76px !important;
            gap: 4px !important;
        }
        .zone, .zones .zone, .zones.backrow .zone,
        #playerBack .zone, #enemyBack .zone, #player .zone, #enemy .zone,
        .linkZoneWrap .zone {
            height: 76px !important;
            min-height: 76px !important;
            max-height: 76px !important;
        }
        .hand {
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 4px !important;
            margin-top: 5px !important;
        }
        .hand .zone {
            height: 125px !important;
            min-height: 125px !important;
            max-height: 125px !important;
        }
        .hand .card {
            min-height: 125px !important;
        }
        .hand .cardArt {
            min-height: 52px !important;
        }
        .hand .artIcon {
            font-size: 30px !important;
        }
        .cardTop {
            min-height: 18px !important;
            padding: 1px 2px !important;
        }
        .cardTop .name {
            font-size: 8px !important;
            line-height: 1 !important;
        }
        .cardArt {
            min-height: 32px !important;
            margin: 1px 0 !important;
        }
        .artIcon {
            font-size: 20px !important;
        }
        .stats {
            font-size: 8px !important;
            padding: 1px 2px !important;
        }
        .cardMeta {
            font-size: 6px !important;
        }
        .posBadge {
            font-size: 6px !important;
            top: 18px !important;
            padding: 1px 2px !important;
        }
        .pile {
            height: 64px !important;
        }
        .pileLabel {
            font-size: 8px !important;
        }
        .phaseBar {
            gap: 4px !important;
            margin: 4px 0 !important;
        }
        .phaseBtn {
            min-width: 44px !important;
            padding: 5px 8px !important;
            font-size: 11px !important;
        }
        .btns {
            gap: 4px !important;
            margin: 4px 0 !important;
        }
        .btn {
            padding: 7px 9px !important;
            font-size: 12px !important;
        }
        .lp {
            font-size: 15px !important;
            padding: 4px 6px !important;
        }
        body.view-field #cardInfoPanel,
        body.view-field .cardInfoPanel,
        body.mobile-portrait #cardInfoPanel,
        body.mobile-portrait .cardInfoPanel,
        #cardInfoPanel,
        .cardInfoPanel {
            position: fixed !important;
            top: auto !important;
            bottom: 4px !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
            max-width: min(440px, calc(100vw - 16px)) !important;
            margin: 0 auto !important;
            transform: none !important;
            border-radius: 8px !important;
            z-index: 9999 !important;
            min-height: unset !important;
            max-height: 58px !important;
            height: auto !important;
            overflow-y: auto !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.85) !important;
            padding: 4px 8px !important;
            border: 1.5px solid #d4af37 !important;
            background: rgba(14, 11, 7, 0.94) !important;
            box-sizing: border-box !important;
        }

        #cardInfoPanel.empty-info,
        .cardInfoPanel.empty-info,
        #cardInfoPanel:has(.mutedInfo),
        .cardInfoPanel:has(.mutedInfo),
        body.has-no-selection #cardInfoPanel,
        body.has-no-selection .cardInfoPanel,
        body.no-card-selected #cardInfoPanel,
        body.no-card-selected .cardInfoPanel,
        body.mobile-bar-active #cardInfoPanel,
        body.mobile-bar-active .cardInfoPanel {
            display: none !important;
        }
        .cardInfoTitle {
            font-size: 9px !important;
            letter-spacing: 1px !important;
            padding-bottom: 2px !important;
            margin-bottom: 2px !important;
            border-bottom: 1px solid rgba(212, 175, 55, 0.4) !important;
            text-align: left !important;
        }
        .cardInfoBody, #cardInfoBody {
            font-size: 10px !important;
            line-height: 1.25 !important;
        }
        .infoName {
            font-size: 11px !important;
            margin-bottom: 1px !important;
            display: inline-block !important;
        }
        .infoStars {
            font-size: 9px !important;
            margin-bottom: 1px !important;
            display: inline-block !important;
            margin-left: 6px !important;
        }
        .infoGrid {
            font-size: 10px !important;
            gap: 2px 8px !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            align-items: center !important;
        }
        .infoAtk {
            font-size: 10.5px !important;
        }
        .infoDef {
            font-size: 10.5px !important;
        }

        /* MODALES ADAPTABLES AL ANCHO DE PANTALLA */
        .custom-auth-modal-box,
        #login-overlay > div,
        #fp-overlay > div,
        .positionWindow,
        .pileWindow {
            width: 92vw !important;
            max-width: 440px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
            padding: 16px !important;
            box-sizing: border-box !important;
        }

        /* MAPA EN TELÉFONOS */
        #map-container-overlay {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
        }
        #map-stage-track {
            min-height: 880px !important;
            height: 880px !important;
        }
        #map-top-bar {
            height: 48px !important;
            padding: 0 8px !important;
        }
        #map-top-bar .map-brand-subtitle {
            display: none !important;
        }
        #map-top-bar .map-brand-title {
            font-size: 12px !important;
        }
        #map-relics-bar {
            max-width: 36vw !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            padding: 2px 4px !important;
            scrollbar-width: none !important;
        }
        #map-relics-bar::-webkit-scrollbar { display: none !important; }
        #map-relics-bar > div {
            padding: 2px 5px !important;
        }
        #map-relics-bar span {
            font-size: 9px !important;
        }
        #map-actions-wrap {
            gap: 4px !important;
        }
        #map-actions-wrap > div, #map-actions-wrap > button {
            padding: 2px 6px !important;
            font-size: 11px !important;
        }
        .map-node-avatar {
            width: 52px !important;
            height: 52px !important;
        }
        .map-node-label {
            font-size: 10px !important;
            padding: 2px 4px !important;
        }
        .map-node-badge {
            font-size: 8px !important;
            padding: 1px 4px !important;
            top: -14px !important;
        }

        /* TIENDA DEL ABUELO EN MÓVIL */
        #custom-shop-overlay {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
        #shop-workspace {
            flex-direction: column !important;
            padding: 8px 12px !important;
            overflow-y: auto !important;
            justify-content: flex-start !important;
            gap: 6px !important;
        }
        #shop-grandpa-wrap {
            max-width: 100% !important;
            height: auto !important;
            min-height: 140px !important;
            justify-content: center !important;
        }
        #shop-grandpa-img {
            height: 18vh !important;
            max-height: 150px !important;
        }
        #grandpa-speech-bubble {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            min-height: auto !important;
            padding: 8px 12px !important;
            margin-bottom: 6px !important;
        }
        #grandpa-speech-text {
            font-size: 12px !important;
        }
        #shop-menu-actions {
            width: 100% !important;
            max-width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
        }
        .shop-interactive-btn {
            padding: 8px 10px !important;
            font-size: 12px !important;
            gap: 6px !important;
        }
        #shop-top-bar {
            padding: 6px 10px !important;
            flex-wrap: wrap !important;
            gap: 4px !important;
        }
        #shop-top-bar > div:first-child span {
            font-size: 18px !important;
        }
        #shop-top-bar > div:first-child div > div:first-child {
            font-size: 18px !important;
        }
        #shop-top-bar > div:first-child div > div:last-child {
            display: none !important;
        }

        /* DASHBOARD DECK EN MÓVIL */
        #custom-deck-editor {
            flex-direction: column !important;
            padding: 8px !important;
            overflow-y: auto !important;
        }
        #deck-editor-left-preview {
            display: none !important;
        }
    }

    /* ════════════════════════════════════════════════════════════════
       4. TELÉFONOS MUY COMPACTOS (ANCHO <= 400px)
       ════════════════════════════════════════════════════════════════ */
    @media (max-width: 400px) {
        .wrap {
            zoom: 0.68 !important;
        }
    }

    /* ════════════════════════════════════════════════════════════════
       5. TELÉFONOS EN MODO PANORÁMICO / LANDSCAPE (HORIZONTAL)
       ════════════════════════════════════════════════════════════════ */
    @media (max-height: 560px) and (orientation: landscape) {
        .wrap {
            zoom: 0.74 !important;
            max-width: 100vw !important;
            margin: 0 auto !important;
            padding: 0 4px !important;
        }
        /* Barra de Vida Superior (LP) Fija / Sticky para evitar que quede cortada */
        #duelTopHeader, .top {
            position: sticky !important;
            top: 0 !important;
            z-index: 1000 !important;
            padding: max(4px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) 4px max(10px, env(safe-area-inset-left)) !important;
            background: linear-gradient(180deg, rgba(20, 14, 8, 0.98) 0%, rgba(10, 7, 4, 0.95) 100%) !important;
            border-bottom: 1.5px solid #d4af37 !important;
            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.85) !important;
            margin-bottom: 3px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            box-sizing: border-box !important;
        }
        #duelTopHeader .mode {
            display: none !important;
        }
        #duelTopHeader b {
            font-size: 13px !important;
            color: #ffd700 !important;
            letter-spacing: 0.5px !important;
            text-shadow: 1px 1px 2px #000 !important;
        }
        .lp {
            font-size: 16px !important;
            padding: 2px 8px !important;
            font-weight: 900 !important;
            border-radius: 6px !important;
            background: rgba(0, 0, 0, 0.6) !important;
            border: 1px solid rgba(212, 175, 55, 0.4) !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            white-space: nowrap !important;
        }
        #plp { color: #4df !important; font-weight: 900 !important; font-size: 17px !important; }
        #elp { color: #ff5252 !important; font-weight: 900 !important; font-size: 17px !important; }

        .hand .zone {
            height: 110px !important;
            min-height: 110px !important;
            max-height: 110px !important;
        }
        .hand .card {
            min-height: 110px !important;
        }
        #shop-workspace {
            flex-direction: row !important;
        }
        #shop-grandpa-img {
            height: 48vh !important;
        }
    }
`;
document.head.appendChild(duelScaleStyle);

const portraitMap = {
    'MOTO': 'abueloYugi.jpg', 'TRISTAN_INTRO': 'Tristan.jpg', 'TRISTAN': 'Tristan.jpg', 'WEEVIL': 'Weevil.jpeg', 'MAI': 'Mai.jpeg',
    'JOEY': 'DialogoJoe.png', 'PEGASUS': 'Pegasus.jpeg', 'BAKURA': 'Bakura.jpeg', 'MARIK': 'Marik.jpeg', 'ISHIZU': 'Ishuzu.jpeg',
    'ODION': 'Odion.jpeg', 'NOAH': 'NoahKaiba.jpeg', 'KOSABURO': 'Kosaburo_Kaiba.jpeg', 'MAKO': 'mako.jpg', 'SETO': 'DialogoSetoKaiba.png', 'KAIBA': 'DialogoSetoKaiba.png', 'YUGI': 'YugiMoTo.jpeg',
    'ABUELO': 'abueloYugi.jpg', 'ATEM': 'DialogoFaraom.png'
};

const dialogPortraitMap = {
    'TRISTAN_INTRO': 'Tristan.jpg',
    'TRISTAN': 'Tristan.jpg',
    'SETO': 'DialogoSetoKaiba.png',
    'KAIBA': 'DialogoSetoKaiba.png',
    'YUGI': 'DialogoFaraom.png',
    'ATEM': 'DialogoFaraom.png',
    'JOEY': 'DialogoJoe.png',
    'MARIK': 'DialogoMarik.png',
    'WEEVIL': 'Weevil.jpeg',
    'MAI': 'Mai.jpeg',
    'MAKO': 'mako.jpg',
    'PEGASUS': 'Pegasus.jpeg',
    'BAKURA': 'Bakura.jpeg',
    'NOAH': 'NoahKaiba.jpeg',
    'KOSABURO': 'Kosaburo_Kaiba.jpeg',
    'ISHIZU': 'Ishuzu.jpeg',
    'ODION': 'Odion.jpeg',
    'MOTO': 'abueloYugi.jpg',
    'ABUELO': 'abueloYugi.jpg'
};

const introDialog = [
    { role: 'system', speaker: 'ATEM', text: 'El origen de los Artículos del Milenio... Todo comenzó en el Antiguo Egipto, bajo el reinado del Faraón Aknamkanon. El reino se encontraba bajo la amenaza inminente de invasores extranjeros.' },
    { role: 'system', speaker: 'ATEM', text: 'Para salvar a su pueblo, el hermano del Faraón, el sacerdote Aknadin, tradujo un libro de hechizos oscuros conocido como el Libro del Milenio.' },
    { role: 'system', speaker: 'ATEM', text: 'Este libro revelaba cómo forjar siete artefactos mágicos capaces de otorgar un poder divino: los Artículos del Milenio.' },
    { role: 'system', speaker: 'ATEM', text: 'Sin embargo, la magia requería un sacrificio terrible. Aknadin lideró una masacre secreta en el pueblo criminal de Kul Elna...' },
    { role: 'system', speaker: 'ATEM', text: 'Asesinó a 99 personas para fundir sus almas y cuerpos en oro fundido, creando así los artefactos. El único superviviente fue un niño llamado Bakura.' },
    { role: 'system', speaker: 'ATEM', text: 'Ahora, la oscuridad de Zorc ha regresado y el precio de este poder divino nos persigue.' },
    { role: 'system', speaker: 'ATEM', text: 'El destino del mundo entero descansa ahora en tus manos.' },
    { role: 'system', speaker: 'ATEM', text: 'El camino estará lleno de peligros, y las sombras intentarán quebrar tu voluntad y tu mente.' },
    { role: 'system', speaker: 'ATEM', text: 'Debes recolectar los Artículos del Milenio derrotando a sus portadores. Solo así podremos abrir la puerta del Nuevo Mundo y restaurar el equilibrio.' }
];

const tristanIntroDialog = [
    { role: 'system', speaker: 'TRISTAN_INTRO', text: '¡Vaya, vaya! Así que tú eres el nuevo duelista del que todos hablan...' },
    { role: 'system', speaker: 'TRISTAN_INTRO', text: 'Mi nombre es Tristan Taylor, y no dejaré que pases de este punto si no tienes agallas.' },
    { role: 'system', speaker: 'TRISTAN_INTRO', text: 'Las ruinas antiguas están repletas de duelistas peligrosos. ¡Demuéstrame tu fuerza en el tablero!' }
];

// Audio Utils
window.currentBgm = '';
window.unlockAudioHandlerInstalled = false;

function installAudioUnlocker() {
    if (window.unlockAudioHandlerInstalled) return;
    window.unlockAudioHandlerInstalled = true;
    const unlock = () => {
        let audio = document.getElementById('bgm3000');
        let isMuted = (localStorage.getItem('FMR_BGM_OFF') === '1');
        if (audio && audio.paused && window.currentBgm && !isMuted) {
            audio.muted = false;
            audio.volume = 0.55;
            audio.play().catch(e => console.log('Resume BGM after user gesture:', e));
        }
        // One-time only: remove listeners as soon as user interacts
        ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
            window.removeEventListener(evt, unlock, true);
        });
    };
    ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, unlock, true);
    });
}
try { installAudioUnlocker(); } catch(e){}

window.playCustomMusic = function(fileName) {
    if (!fileName) return;
    
    // Stop and silence any other stray audio elements on page
    try {
        document.querySelectorAll('audio').forEach(a => {
            if (a.id !== 'bgm3000') {
                a.pause();
                a.currentTime = 0;
                a.src = '';
            }
        });
    } catch(e){}

    let audio = document.getElementById('bgm3000');
    if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'bgm3000';
        audio.loop = true;
        document.body.appendChild(audio);
    }
    
    // If the exact same track is already actively playing, don't restart or cut it
    if (window.currentBgm === fileName && !audio.paused) {
        return;
    }
    
    window.currentBgm = fileName;
    
    let isMuted = (localStorage.getItem('FMR_BGM_OFF') === '1');
    audio.muted = isMuted;
    audio.volume = 0.55;
    audio.playbackRate = (fileName.toLowerCase() === 'minijefes.mp3') ? 0.85 : 1.0;
    
    // Stop previous track immediately to prevent overlapping passages
    try {
        audio.pause();
        audio.currentTime = 0;
    } catch(e){}
    
    audio.src = 'musica/' + fileName;
    audio.load();
    
    if (!isMuted) {
        let p = audio.play();
        if (p !== undefined) {
            p.catch(e => console.log('BGM play deferred until interaction:', e));
        }
    }
};

window.getDuelMusic = function(charId) {
    charId = (charId || '').toLowerCase().trim();
    if (charId === 'tristan') return 'DueloTristan.mp3';
    if (charId === 'weevil' || charId === 'wivil') return 'DueloWivil.mp3';
    if (charId === 'mai') return 'DueloMai.mp3';
    if (charId === 'joey') return 'dueloJoey.mp3';
    if (charId === 'mako') return 'MiniJefes.mp3';
    if (charId === 'pegasus' || charId === 'bakura') return 'MusicaJefes.mp3';
    if (charId === 'noah' || charId === 'kosaburo' || charId === 'gozaburo') return 'duelosjefes.mp3';
    if (charId === 'ishizu') return 'dueloIshizu.mp3';
    if (charId === 'odion') return 'dueloOdion.mp3';
    if (charId === 'seto' || charId === 'kaiba' || charId === 'marik' || charId === 'yugi' || charId === 'atem') {
        return 'dueloJefeFinal.mp3';
    }
    return 'duelosjefes.mp3';
};

// Sync mute toggle button
document.addEventListener('click', function(e) {
    let target = e.target;
    if (target && (target.id === 'musicToggle302' || target.closest('#musicToggle302'))) {
        setTimeout(() => {
            let audio = document.getElementById('bgm3000');
            if (!audio) return;
            let isMuted = (localStorage.getItem('FMR_BGM_OFF') === '1');
            audio.muted = isMuted;
            if (isMuted) {
                audio.pause();
            } else if (window.currentBgm) {
                audio.play().catch(() => {});
            }
        }, 60);
    }
}, true);

window.playViolinClick = function() {
    try {
        let audio = new Audio('musica/violin.mp3'); audio.volume = 0.6;
        let p = audio.play();
        if (p !== undefined) p.catch(e => playFallbackClick());
    } catch(e){ playFallbackClick(); }
};

window.playSFX = function(type) {
    try {
        let ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.audioCtx = ctx; if (ctx.state === 'suspended') ctx.resume();
        let t = ctx.currentTime;
        
        if (type === 'summon') {
            let oscBass = ctx.createOscillator();
            let gainBass = ctx.createGain();
            oscBass.type = 'sine';
            oscBass.frequency.setValueAtTime(150, t);
            oscBass.frequency.exponentialRampToValueAtTime(30, t + 0.5);
            gainBass.gain.setValueAtTime(0.6, t);
            gainBass.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            oscBass.connect(gainBass).connect(ctx.destination);
            oscBass.start(t); oscBass.stop(t + 0.5);
            
            let freqs = [600, 800, 1200, 1500];
            freqs.forEach(f => {
                let osc = ctx.createOscillator();
                let gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, t);
                osc.frequency.linearRampToValueAtTime(f + 200, t + 0.6);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
                osc.connect(gain).connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.6);
            });
        } else if (type === 'attack') {
            let oscSwish = ctx.createOscillator();
            let gainSwish = ctx.createGain();
            oscSwish.type = 'sine';
            oscSwish.frequency.setValueAtTime(800, t);
            oscSwish.frequency.exponentialRampToValueAtTime(100, t + 0.3);
            gainSwish.gain.setValueAtTime(0, t);
            gainSwish.gain.linearRampToValueAtTime(0.3, t + 0.05);
            gainSwish.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            oscSwish.connect(gainSwish).connect(ctx.destination);
            oscSwish.start(t); oscSwish.stop(t + 0.3);

            let bufferSize = ctx.sampleRate * 0.4;
            let buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            
            let noise = ctx.createBufferSource();
            noise.buffer = buffer;
            let noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(1000, t);
            noiseFilter.frequency.linearRampToValueAtTime(100, t + 0.4);
            
            let noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.5, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            
            noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
            noise.start(t);
        } else if (type === 'magic' || type === 'spell') {
            let osc = ctx.createOscillator();
            let gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(1200, t + 0.3);
            osc.frequency.linearRampToValueAtTime(600, t + 0.6);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t); osc.stop(t + 0.7);
        } else if (type === 'trap') {
            let osc = ctx.createOscillator();
            let gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            
            let filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, t);
            filter.frequency.exponentialRampToValueAtTime(200, t + 0.5);
            
            osc.connect(filter).connect(gain).connect(ctx.destination);
            osc.start(t); osc.stop(t + 0.5);
        } else if (type === 'damage') {
            let bufferSize = ctx.sampleRate * 0.3;
            let buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            
            let noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            let filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.linearRampToValueAtTime(200, t + 0.3);
            
            let gain = ctx.createGain();
            gain.gain.setValueAtTime(0.7, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            
            noise.connect(filter).connect(gain).connect(ctx.destination);
            noise.start(t);
        } else if (type === 'destroy') {
            let bufferSize = ctx.sampleRate * 0.5;
            let buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
            
            let noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            let filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(2000, t);
            
            let gain = ctx.createGain();
            gain.gain.setValueAtTime(0.6, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.5);
            
            noise.connect(filter).connect(gain).connect(ctx.destination);
            noise.start(t);
        }
    } catch(e){}
};

// ═══════════════════════════════════════════════════════════════════════
//  SISTEMA MEJORADO DE AUDIO Y EFECTOS PARA EL CAMPO DE DUELO
// ═══════════════════════════════════════════════════════════════════════
window.getAudioCtx = function() {
    if (!window.audioCtx) {
        window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (window.audioCtx && window.audioCtx.state === 'suspended') {
        window.audioCtx.resume().catch(() => {});
    }
    return window.audioCtx;
};

// Desbloqueo garantizado de audio en la primera interacción
function unlockAudioEngine() {
    let ctx = window.getAudioCtx ? window.getAudioCtx() : null;
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}
['click', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, unlockAudioEngine, { passive: true });
});

// Reproductor seguro de archivos de sonido con volumen optimizado
function playAudioFile(file, vol = 0.95) {
    try {
        let a = new Audio('musica/' + file);
        a.volume = Math.min(1.0, Math.max(0.1, vol));
        let p = a.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        return a;
    } catch (_) {}
}
window.playAudioFile = playAudioFile;

// 1. Sonido y Efecto de Cambio de Fase (DP, M1, BP, EP)
let lastPhasePlayed = null;
window.playPhaseSound = function(p) {
    playAudioFile('cambiofase.mp3', 1.0);
    try {
        let ctx = window.getAudioCtx();
        if (ctx) {
            let t = ctx.currentTime;
            let osc1 = ctx.createOscillator();
            let osc2 = ctx.createOscillator();
            let gain = ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1046.5, t); // C6
            osc1.frequency.exponentialRampToValueAtTime(1567.98, t + 0.12); // G6

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1318.5, t); // E6
            osc2.frequency.exponentialRampToValueAtTime(2093.0, t + 0.12); // C7

            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + 0.16);
            osc2.stop(t + 0.16);
        }
    } catch (_) {}
    
    if (p) {
        pulsePhaseBtn(p);
        showPhaseBanner(p);
    }
};

// 2. Sonido de Fin de Turno (End Turn)
window.playEndTurnSound = function() {
    playAudioFile('endturn.mp3', 1.0);
    try {
        let ctx = window.getAudioCtx();
        if (ctx) {
            let t = ctx.currentTime;
            let oscGong = ctx.createOscillator();
            let oscHarm = ctx.createOscillator();
            let gain = ctx.createGain();

            oscGong.type = 'sine';
            oscGong.frequency.setValueAtTime(220, t); // A3
            oscGong.frequency.exponentialRampToValueAtTime(110, t + 0.55); // A2

            oscHarm.type = 'triangle';
            oscHarm.frequency.setValueAtTime(440, t); // A4
            oscHarm.frequency.exponentialRampToValueAtTime(220, t + 0.4);

            gain.gain.setValueAtTime(0.45, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.58);

            oscGong.connect(gain);
            oscHarm.connect(gain);
            gain.connect(ctx.destination);

            oscGong.start(t);
            oscHarm.start(t);
            oscGong.stop(t + 0.58);
            oscHarm.stop(t + 0.58);
        }
    } catch (_) {}
    showPhaseBanner('EP', 'FIN DEL TURNO');
};
window.customPlayEndTurnSound = window.playEndTurnSound;

// 3. Sonido cuando el rival examina su mano
window.playEnemyCardBrowseSound = function() {
    playAudioFile('movercarta.mp3', 0.85);
    try {
        let ctx = window.getAudioCtx();
        if (ctx) {
            let t = ctx.currentTime;
            [0, 0.18, 0.36].forEach(offset => {
                let osc = ctx.createOscillator();
                let gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(950, t + offset);
                osc.frequency.exponentialRampToValueAtTime(450, t + offset + 0.04);
                gain.gain.setValueAtTime(0.22, t + offset);
                gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t + offset);
                osc.stop(t + offset + 0.04);
            });
        }
    } catch (_) {}
};

// 4. Sonido cuando el rival elige/fija su carta
window.playEnemyCardPickSound = function() {
    playAudioFile('escogenciamenu.mp3', 1.0);
    try {
        let ctx = window.getAudioCtx();
        if (ctx) {
            let t = ctx.currentTime;
            let o1 = ctx.createOscillator();
            let o2 = ctx.createOscillator();
            let g = ctx.createGain();
            o1.type = 'triangle';
            o2.type = 'sine';
            o1.frequency.setValueAtTime(587.33, t); // D5
            o1.frequency.exponentialRampToValueAtTime(880, t + 0.12); // A5
            o2.frequency.setValueAtTime(1174.66, t); // D6
            o2.frequency.exponentialRampToValueAtTime(1760, t + 0.12); // A6

            g.gain.setValueAtTime(0.45, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

            o1.connect(g);
            o2.connect(g);
            g.connect(ctx.destination);

            o1.start(t);
            o2.start(t);
            o1.stop(t + 0.38);
            o2.stop(t + 0.38);
        }
    } catch (_) {}
};

// 5. Sonido cuando vuelve el turno al jugador
window.playTurnStartSound = function() {
    playAudioFile('robarcarta.mp3', 0.95);
    try {
        let ctx = window.getAudioCtx();
        if (ctx) {
            let t = ctx.currentTime;
            let o1 = ctx.createOscillator();
            let g = ctx.createGain();
            o1.type = 'sine';
            o1.frequency.setValueAtTime(523.25, t); // C5
            o1.frequency.setValueAtTime(783.99, t + 0.1); // G5
            g.gain.setValueAtTime(0.3, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            o1.connect(g);
            g.connect(ctx.destination);
            o1.start(t);
            o1.stop(t + 0.35);
        }
    } catch (_) {}
    showPhaseBanner('DP', '¡TU TURNO!');
};

// Hook global cuando paint96 cambia de fase
window.onPhaseChange = function(p) {
    if (!p) return;
    if (p !== lastPhasePlayed) {
        lastPhasePlayed = p;
        window.playPhaseSound(p);
    } else {
        pulsePhaseBtn(p);
    }
};

// Hook global cuando la IA interactúa con su mano
window.onEnemyHand = function(chosen) {
    if (chosen === -1) {
        window.playEnemyCardBrowseSound();
    } else if (chosen >= 0) {
        window.playEnemyCardPickSound();
    }
};

// Animación de pulso visual en el botón de la fase activa
function pulsePhaseBtn(p) {
    const map = { DP: 'dfBtn', M1: 'm1Btn', BP: 'bpBtn', EP: 'epBtn' };
    const id = map[p];
    if (!id) return;
    const btn = document.getElementById(id);
    if (btn) {
        btn.classList.remove('phase-pulse');
        void btn.offsetWidth; // reflow
        btn.classList.add('phase-pulse');
    }
}

// Banner flotante elegante de fase / turno
function showPhaseBanner(p, customText) {
    const textMap = {
        DP: 'DRAW PHASE',
        M1: 'MAIN PHASE 1',
        BP: 'BATTLE PHASE',
        EP: 'END PHASE'
    };
    const text = customText || textMap[p] || p;
    let b = document.getElementById('duel-phase-banner');
    if (!b) {
        b = document.createElement('div');
        b.id = 'duel-phase-banner';
        b.style.cssText = 'position:fixed; top:42%; left:50%; transform:translate(-50%,-50%) scale(0.9); z-index:99999; pointer-events:none; font-family:VT323, monospace; font-size:32px; font-weight:bold; letter-spacing:3px; color:#ffd700; text-shadow:0 0 10px #ffcc00, 2px 2px 0 #000; background:rgba(18,18,24,0.85); border:2px solid #ffd700; border-radius:10px; padding:10px 28px; box-shadow:0 0 25px rgba(255,215,0,0.5); opacity:0; transition:opacity 0.2s ease-out, transform 0.25s ease-out;';
        document.body.appendChild(b);
    }
    b.textContent = text;
    b.style.opacity = '1';
    b.style.transform = 'translate(-50%,-50%) scale(1.05)';
    clearTimeout(b._timer);
    b._timer = setTimeout(() => {
        b.style.opacity = '0';
        b.style.transform = 'translate(-50%,-50%) scale(0.95)';
    }, 650);
}

// Inyección de estilos de audio y efectos
(function injectDuelAudioStyles() {
    const styleId = 'fmr-duel-audio-sfx-styles';
    if (document.getElementById(styleId)) return;
    const st = document.createElement('style');
    st.id = styleId;
    st.textContent = `
        @keyframes phasePulseAnim {
            0% { transform: scale(1); filter: drop-shadow(0 0 2px #ffd700); }
            50% { transform: scale(1.18); filter: drop-shadow(0 0 16px #ffd700) drop-shadow(0 0 25px #ff9800); }
            100% { transform: scale(1); filter: drop-shadow(0 0 4px #ffd700); }
        }
        .phaseBtn.phase-pulse {
            animation: phasePulseAnim 0.35s ease-out !important;
        }
        @keyframes rivalCardPickAnim {
            0% { transform: translateY(0); box-shadow: 0 0 5px rgba(255, 215, 0, 0.4); }
            50% { transform: translateY(-22px) scale(1.1); box-shadow: 0 0 25px #ffd700, 0 0 45px #d500f9; border-color: #ffd700 !important; }
            100% { transform: translateY(-16px) scale(1.05); box-shadow: 0 0 18px #ffd700, 0 0 30px #d500f9; border-color: #ffd700 !important; }
        }
        .enemyBack50.chosen {
            animation: rivalCardPickAnim 0.45s ease-out forwards !important;
            border-color: #ffd700 !important;
        }
    `;
    (document.head || document.documentElement).appendChild(st);
})();

// Re-vincular botones de fase para clicks manuales
function wirePhaseClickSounds() {
    ['dfBtn', 'm1Btn', 'bpBtn', 'epBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn && !btn._phaseSoundWired) {
            btn._phaseSoundWired = true;
            btn.addEventListener('click', () => {
                if (id === 'epBtn') {
                    window.playEndTurnSound();
                } else {
                    const p = id === 'dfBtn' ? 'DP' : (id === 'm1Btn' ? 'M1' : 'BP');
                    window.playPhaseSound(p);
                }
            });
        }
    });
}
document.addEventListener('DOMContentLoaded', wirePhaseClickSounds);
setInterval(wirePhaseClickSounds, 1000);

window.customLog = function(t) {
    if (!t) return;
    let lower = t.toLowerCase();
    if (lower.includes('revisa su mano')) {
        window.playEnemyCardBrowseSound();
    } else if (lower.includes('selecciona una carta') || lower.includes('rival elige')) {
        window.playEnemyCardPickSound();
    } else if (lower.includes('fin del turno rival') || lower.includes('comienza tu turno')) {
        window.playTurnStartSound();
    } else if (lower.includes('turno del rival')) {
        window.playEndTurnSound();
    } else if (lower.includes('boca abajo') || lower.includes('coloca una trampa') || lower.includes('coloca una carta')) {
        window.playSFX('set');
    } else if (lower.includes('fusión') || lower.includes('hace sincro') || lower.includes('hace xyz') || lower.includes('hace link')) {
        window.playSFX('fusion');
    } else if (lower.includes('invocaste') || lower.includes('invoca ') || lower.includes('invocó')) {
        window.playSFX('summon');
    } else if (lower.includes('activada') || lower.includes('equipada') || lower.includes('refuerzo') || lower.includes('activado')) {
        window.playSFX('magic');
    } else if (lower.includes('trampa') && lower.includes('activa')) {
        window.playSFX('trap');
    } else if (lower.includes('pierde') || lower.includes('recibes') || lower.includes('daño') || lower.includes('ataque directo')) {
        window.playSFX('damage');
    }
};

function playFallbackClick() {
    try {
        let ctx = window.getAudioCtx();
        if (ctx) {
            let osc = ctx.createOscillator(); let gain = ctx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.1);
        }
    } catch(e){}
}

window.playHoverSound = function() {
    try {
        let ctx = window.getAudioCtx();
        if (ctx) {
            let osc = ctx.createOscillator(); let gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.05);
        }
    } catch(e){}
};

// Global account wrapper to proxy native save logic
localStorage.setItem = function(k, v) {
    if(k === 'FMR_REBORN_STORY_V3000' && window.activeAccount) {
        origSet('FMR_SAVE_' + window.activeAccount, v);
        let accs = JSON.parse(origGet('FMR_ACCOUNTS') || '{}');
        if(accs[window.activeAccount]) {
            accs[window.activeAccount].data = JSON.parse(v);
            origSet('FMR_ACCOUNTS', JSON.stringify(accs));
        }
    }
    origSet(k, v);
};
localStorage.getItem = function(k) {
    if(k === 'FMR_REBORN_STORY_V3000' && window.activeAccount) {
        let s = origGet('FMR_SAVE_' + window.activeAccount);
        if(s) return s;
    }
    return origGet(k);
};

// CSS
if (!document.getElementById('anim-styles')) {
    let st = document.createElement('style'); st.id = 'anim-styles';
    st.innerHTML = `
        @keyframes floatAvatar { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .ps1-btn {
            background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
            border: 3px solid #555; border-top: 3px solid #777; border-bottom: 3px solid #333;
            border-radius: 8px; color: #e0e0e0; font-family: "Times New Roman", Times, serif; font-style: italic;
            font-size: 32px; font-weight: bold; letter-spacing: 3px; width: 320px; padding: 15px; margin: 10px auto;
            display: block; cursor: pointer; text-shadow: 2px 2px 4px #000; transition: all 0.2s; box-shadow: 0 8px 25px rgba(0,0,0,0.9);
        }
        .ps1-btn:hover { transform: scale(1.15); border-color: #c4a04d; color: #fff; box-shadow: 0 12px 30px rgba(196, 160, 77, 0.4); z-index: 10; }
        .ps1-btn-green { color: #55ff55; text-shadow: 0 0 10px rgba(0,255,0,0.5), 2px 2px 4px #000; }
        .ps1-btn-green:hover { color: #88ff88; text-shadow: 0 0 20px rgba(0,255,0,0.8), 2px 2px 4px #000; }
        .campBtns3000 { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; margin-top: 15vh !important; gap: 10px !important; }
    `;
    document.head.appendChild(st);
}

// Sistema de Suscripción (1 mes de prueba, $10 por 6 meses con SINPE Móvil)
window.showSubscriptionPurchaseModal = function(isBlocked = false, userObj = null, subObj = null) {
    let existing = document.getElementById('custom-subscription-modal');
    if (existing) existing.remove();

    let userName = (userObj && userObj.name) || window.activeAccount || localStorage.getItem('FMR_ACTIVE_ACCOUNT') || 'Duelista';
    let saveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
    let sStr = origGet(saveKey) || origGet('FMR_REBORN_STORY_V3000');
    let s = sStr ? JSON.parse(sStr) : null;
    
    let sub = subObj || (s && s.subscription) || {
        isActive: true,
        status: 'trial',
        remainingDays: 30,
        remainingMs: 30 * 24 * 60 * 60 * 1000,
        trialEndsAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };

    let overlay = document.createElement('div');
    overlay.id = 'custom-subscription-modal';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(4, 5, 10, 0.95); backdrop-filter:blur(6px); z-index:999999999; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box; font-family:"Segoe UI", Arial, sans-serif; overflow-y:auto;';

    let card = document.createElement('div');
    card.style.cssText = 'background: linear-gradient(145deg, #151824 0%, #0d0e17 100%); border: 3px solid #ffd700; border-radius: 12px; width: 100%; max-width: 620px; padding: 28px; box-shadow: 0 0 35px rgba(255, 215, 0, 0.35); position: relative; color: #fff; box-sizing: border-box; text-align: center;';

    // WhatsApp URL with prefilled text
    let waText = encodeURIComponent(`Hola Josue, adjunto comprobante de pago por SINPE Móvil de $10 USD para la suscripción de 6 meses de mi cuenta de duelista: ${userName}`);
    let waUrl = `https://wa.me/50657035886?text=${waText}`;

    card.innerHTML = `
        ${!isBlocked ? '<button id="btn-close-sub-modal" style="position:absolute; top:16px; right:18px; background:none; border:none; color:#ffd700; font-size:24px; cursor:pointer; font-weight:bold;">✕</button>' : ''}
        
        <div style="font-size:38px; margin-bottom:4px;">⭐</div>
        <div style="font-family:VT323, monospace; color:#ffd700; font-size:32px; letter-spacing:2px; text-shadow:2px 2px 0 #000;">
            ${isBlocked ? '⚠️ ACCESO SUSPENDIDO · RENOVACIÓN VIP' : 'SUSCRIPCIÓN DE JUEGO (6 MESES) - $10 USD'}
        </div>
        
        <div style="color:#aaa; font-size:14px; margin-top:8px; line-height:1.4;">
            ${isBlocked 
                ? `<b style="color:#ff6b6b;">Tu período de prueba o suscripción ha vencido.</b><br>Tus progresos, cartas y decks están <b>100% seguros y respaldados</b>. Para continuar jugando y participando en duelos, adquiere la suscripción por 6 meses.`
                : `Todos los usuarios reciben <b>1 mes de prueba gratuita</b>. Para continuar jugando y disfrutando del catálogo completo de cartas, duelos y torneos, suscríbete por <b>6 meses completos por solo $10 USD</b>.`
            }
        </div>

        <!-- RELOJ CONTADOR EN TIEMPO REAL -->
        <div style="margin:16px 0; background:#1e1a0f; border:1.5px solid #d4af37; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:center; gap:10px;">
            <span style="font-size:20px;">⏱️</span>
            <div>
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#aaa;">Estado de tu Cuenta (${userName})</div>
                <div id="sub-countdown-text" style="font-family:VT323, monospace; font-size:22px; font-weight:bold; color:${sub.isActive ? '#55ff55' : '#ff4d4d'};">
                    ${sub.isActive 
                        ? (sub.status === 'vip_6m' ? `⭐ VIP ACTIVO · ${sub.remainingDays} Días Restantes` : `⏳ PRUEBA ACTIVA · ${sub.remainingDays} Días Restantes`) 
                        : '⚠️ SUSCRIPCIÓN EXPIRADA'
                    }
                </div>
            </div>
        </div>

        <!-- DATOS DE PAGO SINPE MOVIL -->
        <div style="background:#111420; border:2px dashed #ffd700; border-radius:8px; padding:16px; margin-bottom:16px; text-align:left;">
            <div style="color:#ffd700; font-weight:bold; font-size:15px; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                <span>📱</span> DATOS PARA PAGO POR SINPE MÓVIL:
            </div>
            <div style="display:grid; grid-template-columns:1fr; gap:6px; font-size:14px;">
                <div>• <b>Número de Teléfono:</b> <span style="color:#64b5f6; font-size:17px; font-weight:bold; letter-spacing:1px;">5703-5886</span></div>
                <div>• <b>Titular de la Cuenta:</b> <span style="color:#81c784; font-weight:bold; font-size:16px;">Josue Avalos</span></div>
                <div>• <b>Monto:</b> <span style="color:#ffd700; font-weight:bold; font-size:16px;">$10 USD</span> <span style="color:#aaa; font-size:12px;">(o ~5,000 Colones)</span></div>
                <div>• <b>Duración:</b> <span style="color:#fff;">6 Meses de Acceso Ilimitado</span></div>
                <div>• <b>Tiempo de Activación:</b> <span style="color:#ffcc00; font-weight:bold;">¡Menos de 1 hora!</span></div>
            </div>
        </div>

        <!-- BOTÓN WHATSAPP -->
        <a href="${waUrl}" target="_blank" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(180deg, #25d366 0%, #128c7e 100%); color:#fff; font-weight:bold; font-size:16px; padding:12px 20px; border-radius:8px; margin-bottom:14px; box-shadow:0 4px 15px rgba(37,211,102,0.4); font-family:VT323, monospace; letter-spacing:1px; cursor:pointer;">
            <span style="font-size:20px;">💬</span> ENVIAR COMPROBANTE POR WHATSAPP (+506 5703-5886)
        </a>

        <!-- FORMULARIO DE NOTIFICACION POR CORREO -->
        <div style="background:#161a29; border:1px solid #334466; border-radius:8px; padding:12px; margin-bottom:14px; text-align:left;">
            <div style="font-size:12px; color:#aaa; margin-bottom:6px;">
                ¿Ya realizaste el SINPE? Envía una alerta automática a <b>joavce@hotmail.com</b> para agilizar la activación:
            </div>
            <div style="display:flex; gap:8px;">
                <input id="sub-notify-phone" type="text" placeholder="Tu número de teléfono o referencia..." style="flex:1; background:#0b0d14; border:1px solid #445577; color:#fff; padding:8px 10px; border-radius:4px; font-size:13px;">
                <button id="btn-sub-notify" style="background:#1976d2; color:#fff; border:none; padding:8px 14px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:13px; white-space:nowrap;">
                    📨 NOTIFICAR AHORA
                </button>
            </div>
            <div id="sub-notify-msg" style="font-size:12px; margin-top:6px; display:none;"></div>
        </div>

        <!-- BOTÓN DE VERIFICACIÓN / REINTENTO -->
        <div style="display:flex; gap:10px; justify-content:center;">
            <button id="btn-verify-sub" style="background:linear-gradient(180deg, #ffd700 0%, #b8860b 100%); color:#000; border:2px solid #fff; padding:10px 24px; border-radius:6px; cursor:pointer; font-weight:900; font-family:VT323, monospace; font-size:18px; letter-spacing:1px; box-shadow:0 4px 12px rgba(0,0,0,0.6);">
                🔄 YA PAGUÉ: VERIFICAR Y ENTRAR AL JUEGO
            </button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    if (!isBlocked) {
        let closeBtn = card.querySelector('#btn-close-sub-modal');
        if (closeBtn) closeBtn.onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    }

    // Handler: Notificar por correo
    let btnNotify = card.querySelector('#btn-sub-notify');
    let notifyMsg = card.querySelector('#sub-notify-msg');
    btnNotify.onclick = async () => {
        let phoneInput = card.querySelector('#sub-notify-phone').value.trim();
        btnNotify.disabled = true;
        btnNotify.textContent = 'Enviando...';
        try {
            let res = await fetch('/api/subscription/notify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: userName, phone: phoneInput, reference: 'SINPE Móvil $10' })
            });
            let d = await res.json();
            if (d.ok) {
                notifyMsg.style.display = 'block';
                notifyMsg.style.color = '#7ee787';
                notifyMsg.textContent = '✅ Notificación enviada a Josue Avalos (joavce@hotmail.com). Tu cuenta será activada en breve.';
            } else {
                notifyMsg.style.display = 'block';
                notifyMsg.style.color = '#ff6b6b';
                notifyMsg.textContent = 'Error: ' + (d.error || 'No se pudo enviar la alerta');
            }
        } catch(e) {
            notifyMsg.style.display = 'block';
            notifyMsg.style.color = '#ff6b6b';
            notifyMsg.textContent = 'Error de conexión con el servidor.';
        }
        btnNotify.disabled = false;
        btnNotify.textContent = '📨 NOTIFICAR AHORA';
    };

    // Handler: Verificar y entrar
    let btnVerify = card.querySelector('#btn-verify-sub');
    btnVerify.onclick = async () => {
        btnVerify.disabled = true;
        btnVerify.textContent = 'Comprobando...';
        try {
            let res = await fetch('/api/subscription/status/' + encodeURIComponent(userName));
            let d = await res.json();
            if (d.ok && d.subscription && d.subscription.isActive) {
                alert(`¡Excelente, ${userName}!\n\nTu suscripción está ACTIVA (${d.subscription.remainingDays} días restantes).\n¡Bienvenido al juego!`);
                overlay.remove();
                let loginOverlay = document.getElementById('account-modal-overlay');
                if (loginOverlay) loginOverlay.remove();
                if (window.customShowMap) window.customShowMap();
            } else {
                alert(`Aún no se ha registrado la activación para ${userName}.\n\nSi ya enviaste el comprobante de SINPE Móvil al 5703-5886, el administrador activará tu cuenta en menos de 1 hora.`);
            }
        } catch(e) {
            alert('Error de conexión al verificar el estado.');
        }
        btnVerify.disabled = false;
        btnVerify.textContent = '🔄 YA PAGUÉ: VERIFICAR Y ENTRAR AL JUEGO';
    };
};

// Dialog renderer
window.renderCustomStoryDialog = function(lines, index, onFinish, btnText) {
    if (index === 0) window.playCustomMusic('dialogos.mp3');
    if (index >= lines.length) { if(onFinish) onFinish(); return; }
    let line = lines[index];
    let d = document.createElement('div');
    d.id = 'custom-dialog-fullscreen';
    
    let pFilename = (typeof dialogPortraitMap !== 'undefined' && dialogPortraitMap[line.speaker]) || portraitMap[line.speaker] || 'DialogoFaraom.png';
    let nameOverride = line.speaker;
    if (line.speaker === 'TRISTAN_INTRO') nameOverride = 'TRISTAN';
    else if (line.speaker === 'SETO' || line.speaker === 'KAIBA') nameOverride = 'SETO KAIBA';
    else if (line.speaker === 'MOTO' || line.speaker === 'ABUELO') nameOverride = 'SR. MOTO';
    
    d.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:999999; background: url('ImagenesPersonajes/${pFilename}?v=20261003c') center top / contain no-repeat, #000; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; cursor:pointer;`;
    
    let darkOverlay = document.createElement('div');
    darkOverlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.9) 100%); pointer-events:none;';
    d.appendChild(darkOverlay);
    
    let dialogBox = document.createElement('div');
    dialogBox.style.cssText = 'position: absolute; bottom: 0; left: 0; width: 100vw; background: rgba(0,0,0,0.85); border-top: 6px solid #666; padding: 40px 10vw; box-sizing: border-box; color:#fff; font-family:VT323, monospace; min-height: 25vh; z-index:2; box-shadow: 0 -10px 30px rgba(0,0,0,0.8);';
    
    let speakerDiv = document.createElement('div');
    speakerDiv.style.cssText = 'position:absolute; top:-30px; left:10vw; background:#222; border:4px solid #666; border-top: 4px solid #999; padding:8px 25px; color:#ffcc00; font-size:20px; text-shadow:2px 2px 0 #000; font-weight:bold; letter-spacing:2px; box-shadow: 0 5px 15px rgba(0,0,0,0.8);';
    speakerDiv.textContent = nameOverride;
    
    let textDiv = document.createElement('div');
    textDiv.style.cssText = 'font-size: 22px; line-height: 2; text-shadow: 2px 2px 4px #000; margin-top: 15px;';
    textDiv.textContent = line.text;
    
    let nextBtn = document.createElement('div');
    nextBtn.innerHTML = '&#9660;'; 
    nextBtn.style.cssText = 'position:absolute; bottom:25px; right:5vw; color:#ffcc00; font-size:32px; animation: floatAvatar 1s infinite; text-shadow: 2px 2px 4px #000;';
    
    d.onclick = () => {
        window.playViolinClick();
        d.remove();
        window.renderCustomStoryDialog(lines, index + 1, onFinish, btnText);
    };
    
    dialogBox.appendChild(speakerDiv);
    dialogBox.appendChild(textDiv);
    dialogBox.appendChild(nextBtn);
    d.appendChild(dialogBox);
    document.body.appendChild(d);
};

// Keyboard
window.renderPS1Keyboard = function(onComplete) {
    window.playCustomMusic('ponerNombre.mp3');
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: url("ImagenesPersonajes/ruinas_fondo.jpg") center / cover, #000; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:VT323, monospace; color:white;';
    
    let dark = document.createElement('div');
    dark.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6);';
    overlay.appendChild(dark);
    
    let currentName = "";
    
    let container = document.createElement('div');
    container.style.cssText = 'background: rgba(0,0,0,0.85); border: 6px solid #445544; border-style: inset; padding: 30px; width: 850px; position: relative; box-shadow: 0 0 30px #000; z-index:2;';
    
    let grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(11, 1fr); gap: 15px; font-size: 20px; text-align: center; margin-bottom: 20px; width: 80%;';
    
    const chars = [
        'A','B','C','D','E','F','G','H','I','J','K',
        'L','M','N','O','P','Q','R','S','T','U','V',
        'W','X','Y','Z',' ',' ',' ',' ',' ',' ',' ',
        'a','b','c','d','e','f','g','h','i','j','k',
        'l','m','n','o','p','q','r','s','t','u','v',
        'w','x','y','z',' ',' ',' ',' ',' ',' ',' ',
        '0','1','2','3','4','5','6','7','8','9',' ',
        '+','-','*','/','&','$','%','!','?','.',' '
    ];
    
    let nameText = document.createElement('span');
    
    chars.forEach(c => {
        let span = document.createElement('span'); span.textContent = c;
        span.style.cssText = 'cursor:pointer; padding:10px; transition:all 0.1s; user-select:none; display:inline-block; width: 30px; height: 30px; line-height: 30px; color: #ddd;';
        if(c !== ' ') {
            span.onmouseover = () => { span.style.outline = '2px solid #00ff00'; span.style.color = '#00ff00'; window.playHoverSound(); };
            span.onmouseout = () => { span.style.outline = 'none'; span.style.color = '#ddd'; };
            span.onclick = () => {
                window.playViolinClick();
                if(currentName.length < 10) { currentName += c; nameText.textContent = currentName; }
            };
        }
        grid.appendChild(span);
    });
    
    let rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'position: absolute; right: 40px; top: 160px; display:flex; flex-direction:column; gap: 50px; align-items:flex-end; font-size:20px;';
    
    let backBtn = document.createElement('div');
    backBtn.innerHTML = '&#8592; &#8594;';
    backBtn.style.cssText = 'cursor:pointer; color:#ff9900; user-select:none; transition: color 0.1s;';
    backBtn.onmouseover = () => { backBtn.style.color = '#ffff00'; window.playHoverSound(); };
    backBtn.onmouseout = () => backBtn.style.color = '#ff9900';
    backBtn.onclick = () => { window.playViolinClick(); currentName = currentName.slice(0, -1); nameText.textContent = currentName; };
    
    let endBtn = document.createElement('div');
    endBtn.textContent = 'END';
    endBtn.style.cssText = 'cursor:pointer; color:#ff9900; user-select:none; border: 2px dashed #00ff00; padding: 5px; transition: color 0.1s;';
    endBtn.onmouseover = () => { endBtn.style.color = '#ffff00'; window.playHoverSound(); };
    endBtn.onmouseout = () => endBtn.style.color = '#ff9900';
    endBtn.onclick = () => {
        window.playViolinClick();
        if(!currentName.trim()) return alert('Ingresa un nombre válido.');
        showConfirmDialog();
    };
    
    rightPanel.appendChild(backBtn); rightPanel.appendChild(endBtn);
    
    let nameBoxWrapper = document.createElement('div');
    nameBoxWrapper.style.cssText = 'margin-top: 40px; display:flex; justify-content:center;';
    let nameBox = document.createElement('div');
    nameBox.style.cssText = 'text-align: left; font-size: 24px; background: rgba(0,0,0,0.8); border: 4px solid #c4a04d; border-radius: 8px; padding: 15px 25px; width: 450px; height: 35px; line-height: 35px; box-shadow: 0 0 15px #a67c00, inset 0 0 10px #000; color: #ffcc00; font-family: VT323, monospace; letter-spacing: 5px; text-transform: uppercase; display: flex; align-items: center;';
    let cursor = document.createElement('span'); cursor.innerHTML = '_'; cursor.style.cssText = 'animation: blink 1s infinite; margin-left: 5px; color: #00ff00;';
    
    nameBox.appendChild(nameText); nameBox.appendChild(cursor); nameBoxWrapper.appendChild(nameBox);
    container.appendChild(grid); container.appendChild(rightPanel); container.appendChild(nameBoxWrapper);
    overlay.appendChild(container); document.body.appendChild(overlay);
    
    function showConfirmDialog() {
        let confirmBox = document.createElement('div');
        confirmBox.style.cssText = 'position:absolute; bottom:60px; left:50%; transform:translateX(-50%); background: radial-gradient(circle at center, #2a3b2a 0%, #111 100%); border:4px solid #777; padding:4px; z-index:10; width: 80%; max-width: 600px; box-shadow: 0 0 30px #000;';
        let inner = document.createElement('div');
        inner.style.cssText = 'background: rgba(0,0,0,0.85); border: 2px solid #555; padding: 25px; text-align: left; font-family: VT323, monospace;';
        let p = document.createElement('div'); p.innerHTML = `Your NAME is <span style="color:#ffff00">${currentName}</span>`;
        p.style.fontSize = '16px'; p.style.marginBottom = '25px'; p.style.color = '#fff';
        
        let yes = document.createElement('div'); yes.textContent = 'YES'; yes.style.cssText = 'cursor:pointer; color:#ffff00; font-size:16px; margin-bottom:10px; background: rgba(255,255,0,0.25); padding: 10px; width: fit-content;';
        let no = document.createElement('div'); no.textContent = 'NO'; no.style.cssText = 'cursor:pointer; color:#fff; font-size:16px; padding: 10px; width: fit-content;';
        
        yes.onmouseover = () => { yes.style.background = 'rgba(255,255,0,0.25)'; yes.style.color = '#ffff00'; no.style.background = 'transparent'; no.style.color = '#fff'; window.playHoverSound(); };
        no.onmouseover = () => { no.style.background = 'rgba(255,255,0,0.25)'; no.style.color = '#ffff00'; yes.style.background = 'transparent'; yes.style.color = '#fff'; window.playHoverSound(); };
        
        yes.onclick = () => { window.playViolinClick(); confirmBox.remove(); showPasswordDialog(); };
        no.onclick = () => { window.playViolinClick(); confirmBox.remove(); };
        inner.appendChild(p); inner.appendChild(yes); inner.appendChild(no); confirmBox.appendChild(inner); overlay.appendChild(confirmBox);
    }
    
 function showPasswordDialog() {
        let box = document.createElement('div');
        box.style.cssText = "position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.95); border:3px solid #888; padding:30px; text-align:center; z-index:10; width: 450px; box-shadow: 0 0 20px #000; display:flex; flex-direction:column; gap:14px; font-family: VT323, monospace;";
        box.innerHTML = `<div style="color:#ffd700; font-size:24px; letter-spacing:2px; font-weight:bold;">REGISTRAR CUENTA</div>
            <div style="color:#fff; font-size:18px;">Jugador: <span style="color:#00ff00;">${currentName}</span></div>
            <div style="color:#aaa; font-size:14px;">Ingresa un correo electrónico válido para recuperar tu cuenta si olvidas la contraseña:</div>
            <input type="email" id="kb-email" placeholder="Correo electrónico (válido)" style="padding:12px; font-family:inherit; font-size:16px; background:#222; color:#fff; border:2px solid #555; outline:none; text-align:center;">
            <input type="password" id="kb-pass" placeholder="Contraseña (mínimo 4 caracteres)" style="padding:12px; font-family:inherit; font-size:16px; background:#222; color:#fff; border:2px solid #555; outline:none; text-align:center;">
            <input type="password" id="kb-pass2" placeholder="Confirmar contraseña" style="padding:12px; font-family:inherit; font-size:16px; background:#222; color:#fff; border:2px solid #555; outline:none; text-align:center;">
            <div id="kb-err" style="color:#ff5555; font-size:14px; min-height:16px;"></div>
            <div style="display:flex; justify-content:center; gap:20px; margin-top:5px;">
                <button id="kb-start-btn" style="background:#006600; color:#fff; border:2px solid #00ff00; padding:12px 28px; font-family:inherit; cursor:pointer; font-size:16px; font-weight:bold;">COMENZAR</button>
                <button id="kb-cancel-btn" style="background:#660000; color:#fff; border:2px solid #ff0000; padding:12px 28px; font-family:inherit; cursor:pointer; font-size:16px; font-weight:bold;">CANCELAR</button>
            </div>`;
        overlay.appendChild(box);
        
        document.getElementById('kb-cancel-btn').onmouseover = window.playHoverSound;
        document.getElementById('kb-cancel-btn').onclick = () => { window.playViolinClick(); box.remove(); };
        document.getElementById('kb-start-btn').onmouseover = window.playHoverSound;
        
        async function submitRegister() {
            window.playViolinClick();
            let email = document.getElementById('kb-email').value.trim();
            let pass = document.getElementById('kb-pass').value.trim();
            let pass2 = document.getElementById('kb-pass2').value.trim();
            let errEl = document.getElementById('kb-err');

            if (!email) { errEl.textContent = 'Ingresa tu correo electrónico.'; return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Ingresa un correo electrónico válido.'; return; }
            if (!pass || !pass2) { errEl.textContent = 'Escribe y confirma tu clave.'; return; }
            if (pass !== pass2) { errEl.textContent = 'Las claves no coinciden.'; return; }
            if (pass.length < 4) { errEl.textContent = 'Mínimo 4 caracteres.'; return; }
            
            errEl.style.color = '#ffcc00';
            errEl.textContent = 'Creando cuenta en el servidor...';
            
            try {
                let res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: currentName, email: email, password: pass })
                });
                let data = await res.json();
                if (!res.ok || data.error) {
                    errEl.style.color = '#ff5555';
                    errEl.textContent = data.error || 'Nombre o correo ya registrado. Usa CARGAR o elige otro.';
                    return;
                }
                overlay.remove();
                onComplete(currentName, pass, email, data && data.save);
            } catch(e) {
                // Modo offline si no hay red
                overlay.remove();
                onComplete(currentName, pass, email, null);
            }
        }
        
        document.getElementById('kb-start-btn').onclick = submitRegister;
        document.getElementById('kb-email').onkeydown = (e) => { if(e.key === 'Enter') submitRegister(); };
        document.getElementById('kb-pass').onkeydown = (e) => { if(e.key === 'Enter') submitRegister(); };
        document.getElementById('kb-pass2').onkeydown = (e) => { if(e.key === 'Enter') submitRegister(); };
        setTimeout(() => { document.getElementById('kb-email').focus(); }, 100);
    }
};

window.customShowMain = function() {
    if (window.nativeAPI && window.nativeAPI.showShell) window.nativeAPI.showShell();
    
    let camp = document.getElementById('campaign3000');
    if (!camp) {
        camp = document.createElement('div');
        camp.id = 'campaign3000';
        document.body.appendChild(camp);
    }
    camp.classList.remove('hidden');
    camp.style.display = '';
    camp.innerHTML = '';
    camp.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: url("ImagenesPersonajes/PortadaPrincipal.jpeg") center / cover no-repeat, #000; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999;';
    
    let clickOverlay = document.createElement('div');
    clickOverlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; display:flex; justify-content:center; align-items:center; color:#ffcc00; font-family:VT323, monospace; font-size:24px; cursor:pointer;';
    clickOverlay.innerHTML = '<div style="animation: blink 1s infinite;">HAZ CLIC PARA EMPEZAR</div>';
    clickOverlay.onclick = () => {
        window.playViolinClick();
        window.playCustomMusic('YGOFMR.mp3');
        clickOverlay.remove();
    };
    camp.appendChild(clickOverlay);
    
    let btnContainer = document.createElement('div');
    btnContainer.className = 'campBtns3000';
    btnContainer.style.marginTop = '15vh';
    
    let btnNew = document.createElement('button');
    btnNew.className = 'campBtn3000 ps1-btn ps1-btn-green'; btnNew.textContent = 'NEW GAME';
    btnNew.onmouseover = window.playHoverSound;
    btnNew.onclick = () => {
        window.playViolinClick();
        renderPS1Keyboard(async (name, pass, email, serverSave) => {
            window.activeAccount = name;
            window.currentPassword = pass;
            try {
                localStorage.setItem('FMR_ACTIVE_ACCOUNT', name);
                sessionStorage.setItem('FMR_SESSION', JSON.stringify({ name: name, email: email, password: pass }));
            } catch(_) {}
            
            let ms = serverSave || (window.nativeAPI && window.nativeAPI.freshState ? window.nativeAPI.freshState(name) : null);
            if (!ms && typeof freshState === 'function') ms = freshState(name);
            if (!ms) {
                let defDeck = (typeof window.generateForbiddenMemoriesStarterDeck === 'function') ? window.generateForbiddenMemoriesStarterDeck() : [];
                let coll = {};
                defDeck.forEach(c => coll[c] = (coll[c] || 0) + 1);
                ms = {
                    schema: 1,
                    name: name,
                    email: email,
                    pm: 0,
                    world: 1,
                    unlocked: ['tristan'],
                    cleared: [],
                    wins: {},
                    losses: {},
                    collection: coll,
                    deck: [...defDeck],
                    decks: { "Deck 1": [...defDeck] },
                    activeDeck: "Deck 1",
                    legendary: {},
                    pity: {},
                    fusions: [],
                    createdAt: Date.now(),
                    lastPlayed: Date.now()
                };
            }
            ms.name = name;
            ms.email = email;
            if (!ms.decks || Object.keys(ms.decks).length === 0) {
                ms.decks = { "Deck 1": [...(ms.deck || [])] };
            }
            if (!ms.activeDeck) ms.activeDeck = "Deck 1";
            
            window.memorySave = ms;
            origSet('FMR_REBORN_STORY_V3000', JSON.stringify(ms));
            origSet('FMR_SAVE_' + name, JSON.stringify(ms));
            if (window.nativeAPI && window.nativeAPI.setMemorySave) window.nativeAPI.setMemorySave(ms);
            
            // Solo si no vino del servidor (ej. offline), guardar inicial en servidor
            if (!serverSave) {
                try {
                    await fetch('/api/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(Object.assign({}, ms, { name: name, email: email, password: pass }))
                    });
                } catch(_) {}
            }
            
            if (typeof window.preloadServerDecks === 'function') window.preloadServerDecks();
            
            // Show prologue directly!
            window.playCustomMusic('dialogos.mp3');
            window.renderCustomStoryDialog(introDialog, 0, () => {
                window.renderCustomStoryDialog(tristanIntroDialog, 0, () => {
                    localStorage.setItem('FMR_PROLOGUE_SEEN', '1');
                    if(window.hideDuelBoard) window.hideDuelBoard(); window.customShowMap();
                });
            });
        });
    };
    
    let btnLoad = document.createElement('button');
    btnLoad.className = 'campBtn3000 ps1-btn'; btnLoad.textContent = 'CARGAR';
    btnLoad.onmouseover = window.playHoverSound;
    btnLoad.onclick = () => {
        window.playViolinClick();
        
        let overlay = document.createElement('div');
        overlay.id = 'login-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:999999;display:flex;justify-content:center;align-items:center; font-family:VT323, monospace;';
        let box = document.createElement('div');
        box.style.cssText = 'width: 440px; padding: 30px; display: flex; flex-direction: column; gap: 14px; background:rgba(0,0,0,0.95); border:4px solid #8b6914; border-radius: 8px; box-shadow: 0 0 30px #000;';
        box.innerHTML = `<h2 style="color:#ffd700; font-size:26px; text-align:center; margin:0 0 5px; letter-spacing:2px;">CARGAR PARTIDA</h2>
            <input type="text" id="login-name" placeholder="Nombre de jugador o Correo" style="padding:12px; background:#111; color:#fff; border:2px solid #555; font-family:inherit; font-size:18px; text-align:center;">
            <input type="password" id="login-pass" placeholder="Contraseña" style="padding:12px; background:#111; color:#fff; border:2px solid #555; font-family:inherit; font-size:18px; text-align:center;">
            <div style="text-align:right; margin-top:-5px;">
                <span id="btn-forgot-pass" style="color:#ffd700; text-decoration:underline; font-size:16px; cursor:pointer; user-select:none;">¿Olvidaste tu contraseña?</span>
            </div>
            <div id="login-msg" style="color:#ff5555; font-size:15px; min-height:18px; text-align:center;"></div>
            <button id="btn-login" style="width:100%; padding:14px; background:#006600; color:#fff; border:2px solid #00ff00; font-family:inherit; cursor:pointer; font-size:18px; font-weight:bold;">INICIAR SESIÓN</button>
            <a href="/download/app.apk" download style="display:block; text-align:center; text-decoration:none; padding:10px; background:#1b3a1d; color:#a3f7a3; border:1.5px solid #5cd65c; border-radius:6px; font-size:16px; font-weight:bold; letter-spacing:1px;">📲 DESCARGAR APK ANDROID</a>
            <button id="btn-login-close" style="width:100%; padding:12px; background:#660000; color:#fff; border:2px solid #ff0000; font-family:inherit; cursor:pointer; font-size:16px;">CANCELAR</button>`;
        overlay.appendChild(box); document.body.appendChild(overlay);
        
        document.getElementById('btn-login-close').onmouseover = window.playHoverSound;
        document.getElementById('btn-login-close').onclick = () => { window.playViolinClick(); overlay.remove(); };
        document.getElementById('btn-login').onmouseover = window.playHoverSound;
        
        // Modal de recuperacion de contrasena
        document.getElementById('btn-forgot-pass').onclick = () => {
            window.playViolinClick();
            openForgotPasswordModal();
        };

        function openForgotPasswordModal() {
            let fpOverlay = document.createElement('div');
            fpOverlay.id = 'fp-overlay';
            fpOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:1000000;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;';
            
            let fpBox = document.createElement('div');
            fpBox.style.cssText = 'width: 460px; padding: 30px; display: flex; flex-direction: column; gap: 14px; background:rgba(15,10,5,0.98); border:4px solid #ffd700; border-radius: 8px; box-shadow: 0 0 35px #000;';
            
            // Paso 1: Pedir correo o nombre
            function renderStep1() {
                fpBox.innerHTML = `
                    <h2 style="color:#ffd700; font-size:24px; text-align:center; margin:0; letter-spacing:2px;">RECUPERAR CONTRASEÑA</h2>
                    <p style="color:#ccc; font-size:15px; margin:5px 0 10px; line-height:1.4; text-align:center;">
                        Ingresa tu correo electrónico o tu nombre de jugador registrado. Te enviaremos un código de 6 dígitos.
                    </p>
                    <input type="text" id="fp-user-input" placeholder="Nombre de jugador o Correo" style="padding:12px; background:#111; color:#fff; border:2px solid #777; font-family:inherit; font-size:17px; text-align:center;">
                    <div id="fp-msg" style="color:#ff5555; font-size:15px; min-height:18px; text-align:center;"></div>
                    <button id="fp-btn-send" style="width:100%; padding:14px; background:#b8860b; color:#000; border:2px solid #ffd700; font-family:inherit; cursor:pointer; font-size:18px; font-weight:bold;">ENVIAR CÓDIGO POR CORREO</button>
                    <button id="fp-btn-cancel" style="width:100%; padding:10px; background:#444; color:#fff; border:1px solid #777; font-family:inherit; cursor:pointer; font-size:15px;">VOLVER AL LOGIN</button>
                `;
                
                document.getElementById('fp-btn-cancel').onclick = () => { window.playViolinClick(); fpOverlay.remove(); };
                
                async function handleSend() {
                    window.playViolinClick();
                    let val = document.getElementById('fp-user-input').value.trim();
                    let msg = document.getElementById('fp-msg');
                    if (!val) { msg.textContent = 'Por favor ingresa tu nombre o correo.'; return; }
                    
                    msg.style.color = '#ffcc00';
                    msg.textContent = 'Enviando código por correo...';
                    
                    try {
                        let res = await fetch('/api/forgot-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ identifier: val })
                        });
                        let data = await res.json();
                        if (!res.ok || data.error) {
                            msg.style.color = '#ff5555';
                            msg.textContent = data.error || 'No se pudo enviar el correo.';
                            return;
                        }
                        renderStep2(val, data.email || 'tu correo');
                    } catch (e) {
                        msg.style.color = '#ff5555';
                        msg.textContent = 'Error de conexión con el servidor.';
                    }
                }
                
                document.getElementById('fp-btn-send').onclick = handleSend;
                document.getElementById('fp-user-input').onkeydown = (e) => { if(e.key === 'Enter') handleSend(); };
                setTimeout(() => { document.getElementById('fp-user-input').focus(); }, 100);
            }
            
            // Paso 2: Introducir codigo y nueva clave
            function renderStep2(identifier, maskedEmail) {
                fpBox.innerHTML = `
                    <h2 style="color:#00ff00; font-size:24px; text-align:center; margin:0; letter-spacing:2px;">CÓDIGO ENVIADO</h2>
                    <p style="color:#ffd700; font-size:15px; margin:5px 0 10px; line-height:1.4; text-align:center;">
                        Se ha enviado un código de 6 dígitos a <b style="color:#fff;">${maskedEmail}</b>.<br>
                        (Revisa tu bandeja de entrada o carpeta de spam).
                    </p>
                    <input type="text" id="fp-code-input" placeholder="Código de 6 dígitos" maxlength="6" style="padding:12px; background:#111; color:#ffcc00; border:2px solid #ffd700; font-family:inherit; font-size:24px; text-align:center; letter-spacing:6px;">
                    <input type="password" id="fp-newpass-input" placeholder="Nueva Contraseña (mínimo 4 caracteres)" style="padding:12px; background:#111; color:#fff; border:2px solid #777; font-family:inherit; font-size:17px; text-align:center;">
                    <input type="password" id="fp-confirmpass-input" placeholder="Confirmar Nueva Contraseña" style="padding:12px; background:#111; color:#fff; border:2px solid #777; font-family:inherit; font-size:17px; text-align:center;">
                    <div id="fp-msg2" style="color:#ff5555; font-size:15px; min-height:18px; text-align:center;"></div>
                    <button id="fp-btn-submit" style="width:100%; padding:14px; background:#006600; color:#fff; border:2px solid #00ff00; font-family:inherit; cursor:pointer; font-size:18px; font-weight:bold;">RESTABLECER CONTRASEÑA</button>
                    <button id="fp-btn-back1" style="width:100%; padding:10px; background:#444; color:#fff; border:1px solid #777; font-family:inherit; cursor:pointer; font-size:15px;">SOLICITAR OTRO CÓDIGO</button>
                `;
                
                document.getElementById('fp-btn-back1').onclick = () => { window.playViolinClick(); renderStep1(); };
                
                async function handleReset() {
                    window.playViolinClick();
                    let code = document.getElementById('fp-code-input').value.trim();
                    let newPass = document.getElementById('fp-newpass-input').value.trim();
                    let confirmPass = document.getElementById('fp-confirmpass-input').value.trim();
                    let msg = document.getElementById('fp-msg2');
                    
                    if (!code || code.length < 6) { msg.textContent = 'Ingresa el código de 6 dígitos.'; return; }
                    if (!newPass || newPass.length < 4) { msg.textContent = 'La nueva clave debe tener al menos 4 caracteres.'; return; }
                    if (newPass !== confirmPass) { msg.textContent = 'Las contraseñas no coinciden.'; return; }
                    
                    msg.style.color = '#ffcc00';
                    msg.textContent = 'Restableciendo contraseña...';
                    
                    try {
                        let res = await fetch('/api/reset-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ identifier: identifier, code: code, newPassword: newPass })
                        });
                        let data = await res.json();
                        if (!res.ok || data.error) {
                            msg.style.color = '#ff5555';
                            msg.textContent = data.error || 'Código incorrecto o expirado.';
                            return;
                        }
                        
                        alert('¡Contraseña restablecida con éxito!\nYa puedes iniciar sesión con tu nueva contraseña.');
                        fpOverlay.remove();
                        document.getElementById('login-name').value = identifier;
                        document.getElementById('login-pass').value = newPass;
                        document.getElementById('login-msg').style.color = '#4caf50';
                        document.getElementById('login-msg').textContent = 'Contraseña actualizada. Inicia sesión.';
                    } catch (e) {
                        msg.style.color = '#ff5555';
                        msg.textContent = 'Error de conexión con el servidor.';
                    }
                }
                
                document.getElementById('fp-btn-submit').onclick = handleReset;
                document.getElementById('fp-confirmpass-input').onkeydown = (e) => { if(e.key === 'Enter') handleReset(); };
                setTimeout(() => { document.getElementById('fp-code-input').focus(); }, 100);
            }
            
            renderStep1();
            fpOverlay.appendChild(fpBox);
            document.body.appendChild(fpOverlay);
        }
        
        async function doLogin() {
            window.playViolinClick();
            let name = document.getElementById('login-name').value.trim();
            let pass = document.getElementById('login-pass').value.trim();
            let msg = document.getElementById('login-msg');
            if(!name || !pass) { msg.textContent = 'Llena todos los campos.'; return; }
            
            msg.style.color = '#ffcc00';
            msg.textContent = 'Verificando con el servidor...';
            
            try {
                let localSaveStr = origGet('FMR_SAVE_' + name) || origGet('FMR_REBORN_STORY_V3000');
                let localSaveObj = null;
                try { if (localSaveStr) localSaveObj = JSON.parse(localSaveStr); } catch(_) {}

                let res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, password: pass, clientSave: localSaveObj })
                });
                let data = await res.json();
                if (!res.ok || data.error) {
                    if (data && data.subscriptionExpired) {
                        msg.style.color = '#ff5555';
                        msg.textContent = 'Tu período de prueba o suscripción ha finalizado.';
                        setTimeout(() => {
                            if (window.showSubscriptionPurchaseModal) {
                                window.showSubscriptionPurchaseModal(true, data.user || { name: name }, data.subscription);
                            } else {
                                alert('⚠️ Tu suscripción ha finalizado.\nPor favor realiza el pago de $10 vía SINPE Móvil al 5703-5886 a nombre de Josue Avalos.');
                            }
                        }, 300);
                        return;
                    }
                    msg.style.color = '#ff5555';
                    msg.textContent = data.error || 'Usuario o clave incorrecta.';
                    return;
                }
                
                let save = data.save;
                let actualName = (save && save.name) || name;
                window.activeAccount = actualName;
                window.currentPassword = pass;
                try { 
                    localStorage.setItem('FMR_ACTIVE_ACCOUNT', actualName);
                    sessionStorage.setItem('FMR_SESSION', JSON.stringify({ name: actualName, password: pass })); 
                } catch(_) {}
                
                window.memorySave = save;
                origSet('FMR_REBORN_STORY_V3000', JSON.stringify(save));
                if (actualName) origSet('FMR_SAVE_' + actualName, JSON.stringify(save));
                if (window.nativeAPI && window.nativeAPI.setMemorySave) window.nativeAPI.setMemorySave(save);
                
                if (typeof window.preloadServerDecks === 'function') window.preloadServerDecks();
                
                overlay.remove();
                if(window.hideDuelBoard) window.hideDuelBoard();
                window.customShowMap();
            } catch(e) {
                msg.style.color = '#ff5555';
                msg.textContent = 'Error de conexión con el servidor.';
            }
        }
        
        document.getElementById('btn-login').onclick = doLogin;
        document.getElementById('login-name').onkeydown = (e) => { if(e.key === 'Enter') doLogin(); };
        document.getElementById('login-pass').onkeydown = (e) => { if(e.key === 'Enter') doLogin(); };
        setTimeout(() => { document.getElementById('login-name').focus(); }, 100);
    };
    
       let btnTrade = document.createElement('button');
    btnTrade.className = 'campBtn3000 ps1-btn'; btnTrade.textContent = 'TRADE';
    btnTrade.onmouseover = window.playHoverSound;
    btnTrade.onclick = () => {
        window.playViolinClick();
        if (typeof window.openTradeMode === 'function') {
            window.openTradeMode();
        } else {
            alert("El modo TRADE no está disponible.");
        }
    };
    
    let btnOpt = document.createElement('button');
    btnOpt.className = 'campBtn3000 ps1-btn'; btnOpt.textContent = 'OPCIONES';
    btnOpt.onmouseover = window.playHoverSound;
    btnOpt.onclick = () => { window.playViolinClick(); alert("Stereo mode toggled."); };
    
    btnContainer.appendChild(btnNew);
    btnContainer.appendChild(btnLoad);
    btnContainer.appendChild(btnTrade);
    btnContainer.appendChild(btnOpt);
    camp.appendChild(btnContainer);
};

// ════════════════════════════════════════════════════════════════
//  SISTEMA DE INTERCAMBIO (TRADE) ENTRE JUGADORES ACTIVOS
// ════════════════════════════════════════════════════════════════

window.showLoginForTrade = function(onSuccess) {
    let existingOverlay = document.getElementById('trade-login-overlay');
    if (existingOverlay) existingOverlay.remove();

    let overlay = document.createElement('div');
    overlay.id = 'trade-login-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:10000001;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;';
    
    let box = document.createElement('div');
    box.style.cssText = 'width: 440px; padding: 30px; display: flex; flex-direction: column; gap: 14px; background:rgba(10,12,18,0.97); border:4px solid #b8860b; border-radius: 8px; box-shadow: 0 0 30px rgba(255,215,0,0.4);';
    
    let curAcc = window.activeAccount || '';
    box.innerHTML = `
        <h2 style="color:#ffd700; font-size:26px; text-align:center; margin:0 0 5px; letter-spacing:2px;">IDENTIFICAR DUELISTA (TRADE)</h2>
        <div style="color:#aaa; font-size:14px; text-align:center; margin-top:-5px;">Ingresa tus credenciales para acceder a la banca de intercambio</div>
        <input type="text" id="trade-login-name" value="${curAcc}" placeholder="Nombre de jugador o Correo" style="padding:12px; background:#111; color:#fff; border:2px solid #555; font-family:inherit; font-size:18px; text-align:center;">
        <input type="password" id="trade-login-pass" placeholder="Contraseña" style="padding:12px; background:#111; color:#fff; border:2px solid #555; font-family:inherit; font-size:18px; text-align:center;">
        <div id="trade-login-msg" style="color:#ff5555; font-size:15px; min-height:18px; text-align:center;"></div>
        <button id="trade-btn-do-login" style="width:100%; padding:14px; background:#006600; color:#fff; border:2px solid #00ff00; font-family:inherit; cursor:pointer; font-size:18px; font-weight:bold;">ENTRAR AL MODO TRADE</button>
        <button id="trade-btn-close-login" style="width:100%; padding:12px; background:#660000; color:#fff; border:2px solid #ff0000; font-family:inherit; cursor:pointer; font-size:16px;">CANCELAR</button>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let nameInput = document.getElementById('trade-login-name');
    let passInput = document.getElementById('trade-login-pass');
    let msgEl = document.getElementById('trade-login-msg');

    async function handleLogin() {
        window.playViolinClick && window.playViolinClick();
        let name = nameInput.value.trim();
        let pass = passInput.value.trim();
        if (!name || !pass) {
            msgEl.textContent = 'Llena todos los campos.';
            return;
        }
        msgEl.style.color = '#ffcc00';
        msgEl.textContent = 'Verificando duelista...';

        try {
            let res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, password: pass })
            });
            let data = await res.json();
            if (!res.ok || data.error) {
                msgEl.style.color = '#ff5555';
                msgEl.textContent = data.error || 'Credenciales inválidas.';
                return;
            }
            let save = data.save;
            let actualName = (save && save.name) || name;
            window.activeAccount = actualName;
            window.currentPassword = pass;
            window.memorySave = save;
            try {
                localStorage.setItem('FMR_ACTIVE_ACCOUNT', actualName);
                sessionStorage.setItem('FMR_SESSION', JSON.stringify({ name: actualName, password: pass }));
            } catch(_) {}
            if (typeof origSet === 'function') {
                origSet('FMR_SAVE_' + actualName, JSON.stringify(save));
                origSet('FMR_REBORN_STORY_V3000', JSON.stringify(save));
            }
            overlay.remove();
            if (typeof onSuccess === 'function') onSuccess();
        } catch (e) {
            // Fallback de login local si el servidor no responde
            let localSaveStr = origGet ? (origGet('FMR_SAVE_' + name) || origGet('FMR_REBORN_STORY_V3000')) : null;
            if (localSaveStr) {
                try {
                    let save = JSON.parse(localSaveStr);
                    window.activeAccount = name;
                    window.currentPassword = pass;
                    window.memorySave = save;
                    overlay.remove();
                    if (typeof onSuccess === 'function') onSuccess();
                    return;
                } catch(_) {}
            }
            msgEl.style.color = '#ff5555';
            msgEl.textContent = 'Error de conexión con el servidor.';
        }
    }

    document.getElementById('trade-btn-do-login').onclick = handleLogin;
    document.getElementById('trade-btn-close-login').onclick = () => {
        window.playViolinClick && window.playViolinClick();
        overlay.remove();
    };
    nameInput.onkeydown = (e) => { if (e.key === 'Enter') handleLogin(); };
    passInput.onkeydown = (e) => { if (e.key === 'Enter') handleLogin(); };

    setTimeout(() => {
        if (!nameInput.value) nameInput.focus();
        else passInput.focus();
    }, 100);
};

window.openTradeMode = function() {
    if (!window.activeAccount) {
        window.showLoginForTrade(() => {
            window.openTradeDashboard();
        });
    } else {
        window.openTradeDashboard();
    }
};

window.openTradeDashboard = function() {
    let saveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
    let sStr = (typeof origGet === 'function' ? origGet(saveKey) : null) || (typeof origGet === 'function' ? origGet('FMR_REBORN_STORY_V3000') : null) || localStorage.getItem(saveKey);
    let s = null;
    try { if (sStr) s = JSON.parse(sStr); } catch(_) {}
    if (!s && window.memorySave) s = window.memorySave;
    if (!s) s = { collection: {}, deck: [], decks: {} };

    s.collection = s.collection || {};
    s.decks = s.decks || {};
    s.deck = s.deck || [];
    s.extra = s.extra || [];

    if (typeof window.cleanSaveCollection === 'function') {
        window.cleanSaveCollection(s);
    }

    function persistSave() {
        if (typeof window.persistUserSave === 'function') {
            window.persistUserSave(s);
        } else {
            let curSaveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
            let raw = JSON.stringify(s);
            if (typeof origSet === 'function') {
                origSet(curSaveKey, raw);
                origSet('FMR_REBORN_STORY_V3000', raw);
            } else {
                localStorage.setItem(curSaveKey, raw);
                localStorage.setItem('FMR_REBORN_STORY_V3000', raw);
            }
            if (window.nativeAPI && window.nativeAPI.setMemorySave) window.nativeAPI.setMemorySave(s);
        }
    }

    // Calcula cuántas copias están en uso en cualquier deck del emisor
    function getCopiesInDecks(cardName) {
        let maxCount = 0;
        if (Array.isArray(s.deck)) {
            maxCount = Math.max(maxCount, s.deck.filter(c => c === cardName).length);
        }
        if (s.decks && typeof s.decks === 'object') {
            Object.values(s.decks).forEach(dArr => {
                if (Array.isArray(dArr)) {
                    maxCount = Math.max(maxCount, dArr.filter(c => c === cardName).length);
                }
            });
        }
        if (Array.isArray(s.extra)) {
            maxCount = Math.max(maxCount, s.extra.filter(c => c === cardName).length);
        }
        return maxCount;
    }

    let existingDashboard = document.getElementById('custom-trade-dashboard');
    if (existingDashboard) existingDashboard.remove();

    let overlay = document.createElement('div');
    overlay.id = 'custom-trade-dashboard';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:#121216; z-index:9999999; display:flex; flex-direction:row; padding:20px; box-sizing:border-box; color:#fff; font-family:"Segoe UI", Arial, sans-serif;';

    // Panel Izquierdo: Preview de Carta y Desglose de Stock
    let leftSide = document.createElement('div');
    leftSide.style.cssText = 'width: 330px; display:flex; flex-direction:column; margin-right: 20px; border-right: 2px solid #333; padding-right: 20px; flex-shrink:0;';

    let previewImgWrap = document.createElement('div');
    previewImgWrap.style.cssText = 'width:100%; height: 430px; border: 3px solid #b8860b; border-radius: 8px; background: #000; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 20px rgba(0,0,0,0.8);';
    let previewImg = document.createElement('img');
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:contain; background:#000; display:block;';
    previewImg.src = 'https://i.imgur.com/vHqR8Kq.png';
    previewImgWrap.appendChild(previewImg);
    leftSide.appendChild(previewImgWrap);

    let infoBox = document.createElement('div');
    infoBox.style.cssText = 'margin-top:14px; padding:12px; background:#1a1a24; border:1px solid #334466; border-radius:8px;';
    infoBox.innerHTML = `
        <div id="trade-preview-name" style="font-weight:bold; font-size:16px; color:#ffd700;">Selecciona una carta</div>
        <div id="trade-preview-meta" style="font-size:12px; color:#aaa; margin-top:3px;">-</div>
        <div id="trade-preview-stats" style="margin-top:6px; font-size:13px; font-weight:bold;">-</div>
        <div id="trade-preview-desc" style="margin-top:8px; font-size:12px; color:#ddd; line-height:1.35; max-height:85px; overflow-y:auto;">Haz clic sobre una carta de la lista para inspeccionar sus detalles.</div>
    `;
    leftSide.appendChild(infoBox);

    let stockBox = document.createElement('div');
    stockBox.style.cssText = 'margin-top:10px; padding:12px; background:#221808; border:1px solid #b8860b; border-radius:8px; font-size:13px;';
    stockBox.innerHTML = `
        <div style="color:#ffd700; font-weight:bold; font-size:12px; letter-spacing:0.5px; border-bottom:1px solid #443311; padding-bottom:4px; margin-bottom:6px;">ESTADO DE COPIAS:</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
            <span style="color:#aaa;">Total en Colección:</span>
            <b id="trade-stock-total" style="color:#fff;">-</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
            <span style="color:#aaa;">Asignadas a Barajas:</span>
            <b id="trade-stock-decks" style="color:#81c784;">-</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:5px; padding-top:4px; border-top:1px dashed #554422;">
            <span style="color:#00ffcc; font-weight:bold;">Excedente Transferible:</span>
            <b id="trade-stock-available" style="color:#00ffcc; font-size:15px;">-</b>
        </div>
    `;
    leftSide.appendChild(stockBox);
    overlay.appendChild(leftSide);

    // Panel Derecho: Encabezado, Selector de Destinatario, Filtros y Tabla
    let rightSide = document.createElement('div');
    rightSide.style.cssText = 'flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0;';
    overlay.appendChild(rightSide);

    // Encabezado
    let header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #b8860b; padding-bottom: 10px; margin-bottom: 12px;';
    header.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:24px;">🏺</span>
            <div>
                <div style="font-family:VT323, monospace; color:#ffd700; font-size: 26px; text-shadow: 2px 2px 0 #000; letter-spacing:1px;">SISTEMA DE INTERCAMBIO (TRADE)</div>
                <div style="font-size:12px; color:#aaa;">Transfiere cartas excedentes (>3 copias no asignadas a decks) a otros duelistas activos</div>
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
            <div style="background:#1b2416; border:1px solid #4caf50; border-radius:6px; padding:6px 12px; font-size:13px;">
                👤 Duelista: <b style="color:#81c784;">${window.activeAccount || 'Invitado'}</b>
            </div>
            <button id="btn-trade-switch-user" style="background:#1b2838; color:#66c0f4; border:1px solid #4a90e2; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px;">🔄 CAMBIAR DUELISTA</button>
            <button id="btn-trade-exit" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:8px 18px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:VT323, monospace; font-size:16px;">VOLVER</button>
        </div>
    `;
    rightSide.appendChild(header);

    // Barra de Selección de Jugador Destinatario
    let targetBar = document.createElement('div');
    targetBar.style.cssText = 'background:linear-gradient(90deg, #161e2e 0%, #101520 100%); border:1px solid #3a5078; border-radius:8px; padding:10px 16px; margin-bottom:12px; display:flex; align-items:center; gap:14px; box-shadow:0 3px 8px rgba(0,0,0,0.4);';
    targetBar.innerHTML = `
        <span style="font-weight:bold; color:#66c0f4; font-size:13px; display:flex; align-items:center; gap:6px; white-space:nowrap;">
            🎯 ENVIAR CARTA A:
        </span>
        <select id="trade-target-select" style="flex:1; max-width:320px; padding:8px 12px; background:#0b0f17; color:#fff; border:1px solid #4a6fa5; border-radius:4px; font-size:13px;">
            <option value="">Cargando duelistas activos...</option>
        </select>
        <span style="color:#666; font-size:12px;">o escribir:</span>
        <input type="text" id="trade-target-input" placeholder="Nombre exacto del duelista..." style="flex:1; max-width:260px; padding:8px 12px; background:#0b0f17; color:#fff; border:1px solid #4a6fa5; border-radius:4px; font-size:13px;">
    `;
    rightSide.appendChild(targetBar);

    // Barra de Filtros y Búsqueda (Estilo Banca)
    let filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:10px; flex-wrap:wrap;';
    filterBar.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <input type="text" id="trade-search" placeholder="Buscar por nombre..." autocomplete="off" style="padding:8px 12px; border-radius:4px; border:1px solid #555; background:#222; color:#fff; font-family:'Segoe UI'; width:240px; font-size:14px;">
            <select id="trade-f-type" style="padding:8px 10px; background:#222; color:#fff; border:1px solid #555; border-radius:4px; font-size:13px;">
                <option value="">Todas las cartas</option>
                <option value="MONSTER">Monstruos</option>
                <option value="SPELL">Magias</option>
                <option value="TRAP">Trampas</option>
            </select>
        </div>
        <div id="trade-cards-counter" style="color:#00ffcc; font-weight:bold; font-size:13px; background:rgba(0,255,204,0.1); border:1px solid #00ffcc; border-radius:4px; padding:5px 12px;">
            0 cartas disponibles para enviar
        </div>
    `;
    rightSide.appendChild(filterBar);

    // Contenedor de la Tabla (Banca de Trade)
    let tableWrap = document.createElement('div');
    tableWrap.style.cssText = 'flex:1; overflow-y:auto; border:1px solid #333; border-radius:6px; background:#16161c;';
    tableWrap.innerHTML = `
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
            <thead>
                <tr style="background:#0d0d12; color:#ffd700; border-bottom:2px solid #b8860b; position:sticky; top:0; z-index:2;">
                    <th style="padding:10px; width:50px;">#</th>
                    <th style="padding:10px;">CARTA</th>
                    <th style="padding:10px; width:120px;">TIPO</th>
                    <th style="padding:10px; width:140px;">ATK / DEF</th>
                    <th style="padding:10px; text-align:center; width:100px;">TOTAL</th>
                    <th style="padding:10px; text-align:center; width:100px;">EN DECKS</th>
                    <th style="padding:10px; text-align:center; width:110px;">DISPONIBLES</th>
                    <th style="padding:10px; text-align:center; width:170px;">ACCIÓN</th>
                </tr>
            </thead>
            <tbody id="trade-tbody"></tbody>
        </table>
    `;
    rightSide.appendChild(tableWrap);

    let tbody = tableWrap.querySelector('#trade-tbody');
    let counterEl = filterBar.querySelector('#trade-cards-counter');
    let targetSelect = targetBar.querySelector('#trade-target-select');
    let targetInput = targetBar.querySelector('#trade-target-input');

    // Cargar duelistas activos
    async function loadActiveUsers() {
        let options = [];
        try {
            let res = await fetch('/api/active-users');
            let data = await res.json();
            if (data && Array.isArray(data.users)) {
                options = data.users.map(u => u.name);
            }
        } catch (_) {}

        // Complementar con usuarios locales en localStorage
        try {
            for (let i = 0; i < localStorage.length; i++) {
                let k = localStorage.key(i);
                if (k && k.startsWith('FMR_SAVE_')) {
                    let uName = k.replace('FMR_SAVE_', '').trim();
                    if (uName && !options.includes(uName)) options.push(uName);
                }
            }
        } catch (_) {}

        let myName = (window.activeAccount || '').toLowerCase().trim();
        let filteredUsers = options.filter(n => n && n.toLowerCase().trim() !== myName);

        targetSelect.innerHTML = '<option value="">-- Selecciona un duelista activo --</option>';
        if (filteredUsers.length === 0) {
            targetSelect.innerHTML += '<option value="" disabled>(No hay otros jugadores registrados)</option>';
        } else {
            filteredUsers.forEach(uName => {
                let opt = document.createElement('option');
                opt.value = uName;
                opt.textContent = uName;
                targetSelect.appendChild(opt);
            });
        }
    }
    loadActiveUsers();

    targetSelect.onchange = () => {
        if (targetSelect.value) targetInput.value = targetSelect.value;
    };

    function updatePreviewDetails(cardName, info, ownCount, inDecks, available) {
        if (!info) return;
        previewImg.src = info.imgUrl || 'https://i.imgur.com/vHqR8Kq.png';
        let cardColor = info.isMonster ? '#ffd700' : (info.isTrap ? '#ff80ab' : '#4caf50');
        
        let pName = document.getElementById('trade-preview-name');
        let pMeta = document.getElementById('trade-preview-meta');
        let pStats = document.getElementById('trade-preview-stats');
        let pDesc = document.getElementById('trade-preview-desc');
        
        if (pName) {
            pName.textContent = info.name;
            pName.style.color = cardColor;
        }
        if (pMeta) {
            pMeta.textContent = `[${info.type}] ${info.attr !== '-' ? ' · ' + info.attr : ''}`;
        }
        if (pStats) {
            pStats.innerHTML = info.isMonster ? `<span style="color:#ff5252;">⚔ ATK ${info.atk}</span> / <span style="color:#2196f3;">🛡 DEF ${info.def}</span>` : `<span style="color:${cardColor};">${info.type}</span>`;
        }
        if (pDesc) {
            pDesc.textContent = info.desc || info.text || 'Sin descripción especial.';
        }
        let sTotal = document.getElementById('trade-stock-total');
        let sDecks = document.getElementById('trade-stock-decks');
        let sAvail = document.getElementById('trade-stock-available');
        if (sTotal) sTotal.textContent = 'x' + ownCount;
        if (sDecks) sDecks.textContent = 'x' + inDecks;
        if (sAvail) sAvail.textContent = 'x' + available;
    }

    function renderTradeList() {
        tbody.innerHTML = '';
        let q = overlay.querySelector('#trade-search').value.toLowerCase().trim();
        let fType = overlay.querySelector('#trade-f-type').value;

        let tradeableList = [];
        let collKeys = Object.keys(s.collection || {}).sort();

        collKeys.forEach(cardName => {
            let total = s.collection[cardName] || 0;
            if (total <= 3) return; // REGLA: Debe tener más de 3 copias

            let inDecks = getCopiesInDecks(cardName);
            let minToKeep = Math.max(3, inDecks);
            let available = total - minToKeep;
            if (available <= 0) return; // REGLA: Copias que no estén en ningún deck

            let meta = window.getCardMetadata ? window.getCardMetadata(cardName) : null;
            if (!meta) return;

            // Filtro de cartas no programadas
            if (typeof window.isCardProgrammed === 'function' && !window.isCardProgrammed(meta)) return;

            if (q && !cardName.toLowerCase().includes(q)) return;
            if (fType === 'MONSTER' && !meta.isMonster) return;
            if (fType === 'SPELL' && !meta.isSpell) return;
            if (fType === 'TRAP' && !meta.isTrap) return;

            tradeableList.push({
                name: cardName,
                meta: meta,
                total: total,
                inDecks: inDecks,
                available: available
            });
        });

        counterEl.textContent = `${tradeableList.length} carta${tradeableList.length === 1 ? '' : 's'} disponible${tradeableList.length === 1 ? '' : 's'} para enviar`;

        if (tradeableList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:36px; color:#888;">
                        <div style="font-size:32px; margin-bottom:10px;">📦</div>
                        <div style="font-size:16px; color:#ddd; font-weight:bold;">No tienes cartas transferibles disponibles</div>
                        <div style="font-size:13px; color:#888; margin-top:6px; max-width:480px; margin-left:auto; margin-right:auto; line-height:1.4;">
                            Para intercambiar una carta, debes tener <b>más de 3 copias</b> en tu colección y las copias no deben estar en uso en ninguna de tus barajas.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Seleccionar la primera por defecto para el preview
        updatePreviewDetails(tradeableList[0].name, tradeableList[0].meta, tradeableList[0].total, tradeableList[0].inDecks, tradeableList[0].available);

        tradeableList.forEach(item => {
            let info = item.meta;
            let cardColor = info.isMonster ? '#d4af37' : (info.isTrap ? '#ff80ab' : '#4caf50');

            let tr = document.createElement('tr');
            tr.style.cssText = 'border-bottom: 1px solid #2a2a38; transition: background 0.15s; cursor: pointer;';
            tr.onmouseover = () => { tr.style.background = '#222230'; };
            tr.onmouseout = () => { if (!tr.classList.contains('selected-row')) tr.style.background = 'transparent'; };
            
            tr.onclick = () => {
                tbody.querySelectorAll('tr').forEach(r => {
                    r.classList.remove('selected-row');
                    r.style.background = 'transparent';
                });
                tr.classList.add('selected-row');
                tr.style.background = '#2a2a3e';
                updatePreviewDetails(item.name, info, item.total, item.inDecks, item.available);
            };

            let atkDef = info.isMonster ? `<span style="color:#ff5252;">${info.atk}</span> / <span style="color:#2196f3;">${info.def}</span>` : '-';

            tr.innerHTML = `
                <td style="padding:8px 10px; color:#888;">#${String(info.num).replace(/[^\d]/g, '').padStart(3, '0')}</td>
                <td style="padding:8px 10px; font-weight:bold; color:${cardColor};">${item.name}</td>
                <td style="padding:8px 10px; font-size:12px;">${info.type}</td>
                <td style="padding:8px 10px;">${atkDef}</td>
                <td style="padding:8px 10px; text-align:center; font-weight:bold; color:#fff;">x${item.total}</td>
                <td style="padding:8px 10px; text-align:center; color:#81c784;">x${item.inDecks}</td>
                <td style="padding:8px 10px; text-align:center; font-weight:bold; color:#00ffcc; font-size:14px;">x${item.available}</td>
                <td style="padding:8px 10px; text-align:center;">
                    <button class="btn-send-trade-action" style="background:linear-gradient(180deg, #00897b, #004d40); color:#fff; border:1px solid #26a69a; padding:6px 12px; border-radius:4px; font-weight:bold; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 5px rgba(0,0,0,0.5);">
                        🔁 Enviar 1 Copia
                    </button>
                </td>
            `;

            let sendBtn = tr.querySelector('.btn-send-trade-action');
            sendBtn.onclick = async (e) => {
                e.stopPropagation();
                let targetUser = (targetInput.value || targetSelect.value || '').trim();
                if (!targetUser) {
                    alert('Por favor selecciona o escribe el nombre del duelista destinatario.');
                    targetInput.focus();
                    return;
                }
                if (targetUser.toLowerCase() === (window.activeAccount || '').toLowerCase().trim()) {
                    alert('No puedes transferirte cartas a ti mismo.');
                    return;
                }

                let confirmed = confirm(`¿Estás seguro de que deseas transferir 1 copia de "${item.name}" al duelista "${targetUser}"?\n\nEsta carta se descontará de tu inventario y pasará a ser de su propiedad.`);
                if (!confirmed) return;

                sendBtn.disabled = true;
                sendBtn.style.opacity = '0.5';
                sendBtn.textContent = 'Transfiriendo...';

                try {
                    let res = await fetch('/api/trade', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: window.activeAccount,
                            to: targetUser,
                            cardName: item.name,
                            password: window.currentPassword
                        })
                    });
                    let data = await res.json();
                    if (!res.ok || data.error) {
                        throw new Error(data.error || 'Error del servidor en el intercambio.');
                    }

                    // Actualizar estado local del emisor
                    s.collection[item.name] = (s.collection[item.name] || 1) - 1;
                    if (s.collection[item.name] <= 0) delete s.collection[item.name];
                    persistSave();

                    // Si existe copia local en localStorage del receptor, actualizarla
                    try {
                        let recStr = origGet ? origGet('FMR_SAVE_' + targetUser) : localStorage.getItem('FMR_SAVE_' + targetUser);
                        if (recStr) {
                            let recSave = JSON.parse(recStr);
                            recSave.collection = recSave.collection || {};
                            recSave.collection[item.name] = (recSave.collection[item.name] || 0) + 1;
                            if (origSet) origSet('FMR_SAVE_' + targetUser, JSON.stringify(recSave));
                            else localStorage.setItem('FMR_SAVE_' + targetUser, JSON.stringify(recSave));
                        }
                    } catch(_) {}

                    window.playViolinClick && window.playViolinClick();
                    alert(`¡Transferencia exitosa!\n\nHas enviado 1 copia de "${item.name}" al duelista ${targetUser}.\nTe quedan ${s.collection[item.name] || 0} copias en tu colección.`);
                    renderTradeList();
                } catch (err) {
                    // Fallback local: Si el servidor falla pero el receptor está guardado en este navegador
                    let recStr = (typeof origGet === 'function' ? origGet('FMR_SAVE_' + targetUser) : null) || localStorage.getItem('FMR_SAVE_' + targetUser);
                    if (recStr) {
                        try {
                            let recSave = JSON.parse(recStr);
                            s.collection[item.name] = (s.collection[item.name] || 1) - 1;
                            if (s.collection[item.name] <= 0) delete s.collection[item.name];
                            persistSave();

                            recSave.collection = recSave.collection || {};
                            recSave.collection[item.name] = (recSave.collection[item.name] || 0) + 1;
                            if (typeof origSet === 'function') origSet('FMR_SAVE_' + targetUser, JSON.stringify(recSave));
                            else localStorage.setItem('FMR_SAVE_' + targetUser, JSON.stringify(recSave));

                            window.playViolinClick && window.playViolinClick();
                            alert(`¡Transferencia local realizada!\n\nHas enviado 1 copia de "${item.name}" al duelista ${targetUser}.\nTe quedan ${s.collection[item.name] || 0} copias en tu colección.`);
                            renderTradeList();
                            return;
                        } catch(_) {}
                    }
                    alert('No se pudo realizar el intercambio: ' + err.message);
                    sendBtn.disabled = false;
                    sendBtn.style.opacity = '1';
                    sendBtn.textContent = '🔁 Enviar 1 Copia';
                }
            };

            tbody.appendChild(tr);
        });
    }

    overlay.querySelector('#trade-search').oninput = renderTradeList;
    overlay.querySelector('#trade-f-type').onchange = renderTradeList;

    header.querySelector('#btn-trade-switch-user').onclick = () => {
        window.playViolinClick && window.playViolinClick();
        window.showLoginForTrade(() => {
            overlay.remove();
            window.openTradeDashboard();
        });
    };

    header.querySelector('#btn-trade-exit').onclick = () => {
        window.playViolinClick && window.playViolinClick();
        overlay.remove();
    };

    renderTradeList();
    document.body.appendChild(overlay);
};


window.customShowPrologue = function(i) {
    // If the native code tries to show the prologue (e.g. from an old save format), we just skip it to map.
    if(window.hideDuelBoard) window.hideDuelBoard(); window.customShowMap();
};

// ════════════════════════════════════════════════════════════════
//  SISTEMA CENTRAL DE LOS 7 ARTÍCULOS DEL MILENIO
// ════════════════════════════════════════════════════════════════
window.getMillenniumItems = function(s) {
    s = s || {};
    const cleared = Array.isArray(s.cleared) ? s.cleared.map(x => String(x).toLowerCase()) : [];
    return [
      {
        id: 'key',
        name: 'Llave del Milenio',
        shortName: 'Llave',
        bearer: 'Joey Wheeler / Shadi',
        bearerId: 'joey',
        power: 'Apertura de Almas y Mentes',
        desc: 'Desbloquea el santuario interior de la mente humana para explorar sus pensamientos o purificarla.',
        hint: 'Derrota a Joey Wheeler en la Campaña para recuperarla.',
        unlocked: cleared.includes('joey'),
        icon: '🔑',
        grandpaQuote: 'La Llave del Milenio abre los pasadizos más recónditos del alma de un duelista.',
        svgPath: `
          <ellipse cx="50" cy="30" rx="17" ry="21" fill="none" stroke="url(#goldGrad)" stroke-width="5.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"/>
          <ellipse cx="50" cy="30" rx="8.5" ry="5.2" fill="#1a1408" stroke="#ffd700" stroke-width="1.2"/>
          <circle cx="50" cy="30" r="2.4" fill="#ffd700"/>
          <rect x="23" y="48" width="54" height="7.5" rx="3" fill="url(#goldGrad)" stroke="#4a3000" stroke-width="1"/>
          <rect x="46" y="54" width="8" height="38" rx="2" fill="url(#goldGrad)" stroke="#4a3000" stroke-width="1"/>
          <rect x="54" y="78" width="9" height="3.5" fill="url(#goldGrad)"/>
          <rect x="54" y="86" width="7" height="3.5" fill="url(#goldGrad)"/>
        `
      },
      {
        id: 'eye',
        name: 'Ojo del Milenio',
        shortName: 'Ojo',
        bearer: 'Maximillion Pegasus',
        bearerId: 'pegasus',
        power: 'Lectura Mental y Captura de Almas',
        desc: 'Permite leer los pensamientos, ver las cartas en la mano del oponente y atrapar almas en cartas mágicas.',
        hint: 'Derrota a Maximillion Pegasus en la Campaña para recuperarlo.',
        unlocked: cleared.includes('pegasus'),
        icon: '👁️',
        grandpaQuote: 'Pegasus usó el Ojo del Milenio para atrapar mi alma en una cinta de video. ¡Un poder temible si cae en las manos equivocadas!',
        svgPath: `
          <circle cx="50" cy="50" r="36" fill="url(#eyeOrb)" stroke="#fff" stroke-width="2" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.8))"/>
          <path d="M24,50 Q50,28 76,50 Q50,72 24,50 Z" fill="#1a1408" stroke="#ffd700" stroke-width="2.2"/>
          <circle cx="50" cy="50" r="13" fill="url(#eyeOrb)" stroke="#ffe082" stroke-width="1.4"/>
          <circle cx="50" cy="50" r="5.5" fill="#000"/>
          <circle cx="48" cy="48" r="1.8" fill="#fff"/>
        `
      },
      {
        id: 'ring',
        name: 'Sortija del Milenio',
        shortName: 'Sortija',
        bearer: 'Yami Bakura',
        bearerId: 'bakura',
        power: 'Detección Mística y Magia Oscura',
        desc: 'Sus 5 agujas místicas apuntan hacia otros Artículos del Milenio o hacia personas con gran energía ancestral.',
        hint: 'Derrota a Yami Bakura en la Campaña para recuperarla.',
        unlocked: cleared.includes('bakura'),
        icon: '💍',
        grandpaQuote: 'La Sortija del Milenio... las almas atrapadas dentro de ella anhelan el poder de los Duelos de las Sombras.',
        svgPath: `
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#goldGrad)" stroke-width="4.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"/>
          <polygon points="50,30 36,54 64,54" fill="url(#goldGrad)" stroke="#4a3000" stroke-width="1.5"/>
          <circle cx="50" cy="45" r="4.2" fill="#1a1408"/>
          <circle cx="50" cy="45" r="2" fill="#ffd700"/>
          <polygon points="50,14 47,3 53,3" fill="url(#goldGrad)"/>
          <polygon points="80,40 92,36 89,42" fill="url(#goldGrad)"/>
          <polygon points="72,74 83,83 77,86" fill="url(#goldGrad)"/>
          <polygon points="28,74 17,83 23,86" fill="url(#goldGrad)"/>
          <polygon points="20,40 8,36 11,42" fill="url(#goldGrad)"/>
        `
      },
      {
        id: 'necklace',
        name: 'Collar del Milenio',
        shortName: 'Collar',
        bearer: 'Ishizu Ishtar',
        bearerId: 'ishizu',
        power: 'Clarividencia y Destino Sagrado',
        desc: 'Otorga a su portador visiones certeras sobre los hilos del destino y el desenlace de los combates.',
        hint: 'Derrota a Ishizu Ishtar en la Campaña para recuperarlo.',
        unlocked: cleared.includes('ishizu'),
        icon: '📿',
        grandpaQuote: 'El Collar del Milenio revela visiones del futuro... pero un verdadero duelista puede forjar su propio destino.',
        svgPath: `
          <path d="M18,40 C18,72 82,72 82,40 C82,30 75,23 70,23 C60,44 40,44 30,23 C25,23 18,30 18,40 Z" fill="url(#goldGrad)" stroke="#fff" stroke-width="1.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"/>
          <circle cx="50" cy="72" r="6.5" fill="url(#goldGrad)" stroke="#4a3000" stroke-width="1.4"/>
          <circle cx="35" cy="68" r="4.5" fill="url(#goldGrad)"/>
          <circle cx="65" cy="68" r="4.5" fill="url(#goldGrad)"/>
          <ellipse cx="50" cy="55" rx="7.5" ry="4.2" fill="#1a1408" stroke="#ffe082" stroke-width="1"/>
          <circle cx="50" cy="55" r="2" fill="#ffd700"/>
        `
      },
      {
        id: 'rod',
        name: 'Cetro del Milenio',
        shortName: 'Cetro',
        bearer: 'Marik Ishtar',
        bearerId: 'marik',
        power: 'Control Mental y Mandato Oscuro',
        desc: 'Permite doblegar la voluntad ajena a través de la hipnosis milenaria y canalizar monstruos oscuros.',
        hint: 'Derrota a Marik Ishtar en la Campaña para recuperarlo.',
        unlocked: cleared.includes('marik'),
        icon: '🔱',
        grandpaQuote: '¡El Cetro de Marik! Una reliquia peligrosa capaz de controlar la mente de duelistas inocentes.',
        svgPath: `
          <rect x="46" y="38" width="8" height="54" rx="3" fill="url(#goldGrad)" stroke="#4a3000" stroke-width="1.5"/>
          <circle cx="50" cy="92" r="5" fill="url(#goldGrad)"/>
          <line x1="46" y1="52" x2="54" y2="52" stroke="#4a3000" stroke-width="1.5"/>
          <line x1="46" y1="68" x2="54" y2="68" stroke="#4a3000" stroke-width="1.5"/>
          <path d="M50,12 C36,12 22,25 18,36 C31,34 43,38 50,42 C57,38 69,34 82,36 C78,25 64,12 50,12 Z" fill="url(#goldGrad)" stroke="#fff" stroke-width="1.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"/>
          <ellipse cx="50" cy="25" rx="8.5" ry="5.2" fill="#1a1408" stroke="#ffe082" stroke-width="1"/>
          <circle cx="50" cy="25" r="2.6" fill="#ffd700"/>
        `
      },
      {
        id: 'scale',
        name: 'Balanza del Milenio',
        shortName: 'Balanza',
        bearer: 'Seto Kaiba / Karim',
        bearerId: 'kaiba',
        power: 'Juicio del Corazón y Fusión Primordial',
        desc: 'Pesa la pureza del corazón contra la sagrada Pluma de Ma\'at y canaliza fusiones de monstruos primordiales.',
        hint: 'Derrota a Seto Kaiba en la Campaña para recuperarla.',
        unlocked: cleared.includes('kaiba') || cleared.includes('seto'),
        icon: '⚖️',
        grandpaQuote: 'La Balanza de Ma\'at juzga la pureza de los duelistas. En manos sabias, otorga un equilibrio absoluto en batalla.',
        svgPath: `
          <rect x="48" y="20" width="4" height="68" fill="url(#goldGrad)"/>
          <polygon points="50,88 35,96 65,96" fill="url(#goldGrad)"/>
          <circle cx="50" cy="22" r="9" fill="url(#goldGrad)" stroke="#fff" stroke-width="1.4" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"/>
          <circle cx="50" cy="22" r="4.2" fill="#1a1408"/>
          <circle cx="50" cy="22" r="1.8" fill="#ffd700"/>
          <line x1="16" y1="36" x2="84" y2="36" stroke="url(#goldGrad)" stroke-width="3.8" stroke-linecap="round"/>
          <line x1="22" y1="36" x2="16" y2="60" stroke="#ffd700" stroke-width="1.4"/>
          <line x1="22" y1="36" x2="28" y2="60" stroke="#ffd700" stroke-width="1.4"/>
          <path d="M12,60 Q22,70 32,60 Z" fill="url(#goldGrad)" stroke="#4a3000" stroke-width="1"/>
          <line x1="78" y1="36" x2="72" y2="60" stroke="#ffd700" stroke-width="1.4"/>
          <line x1="78" y1="36" x2="84" y2="60" stroke="#ffd700" stroke-width="1.4"/>
          <path d="M68,60 Q78,70 88,60 Z" fill="url(#goldGrad)" stroke="#4a3000" stroke-width="1"/>
        `
      },
      {
        id: 'puzzle',
        name: 'Rompecabezas del Milenio',
        shortName: 'Rompecabezas',
        bearer: 'Yugi Muto / Faraón Atem',
        bearerId: 'yugi',
        power: 'Justicia y Duelos de las Sombras',
        desc: 'El artículo supremo. Alberga el espíritu ancestral del Faraón y otorga dominio sobre el destino en los Duelos de las Sombras.',
        hint: 'Derrota a Yugi Muto en el Duelo Supremo de la Campaña para recuperarlo.',
        unlocked: cleared.includes('yugi'),
        icon: '🧩',
        grandpaQuote: '¡El Rompecabezas del Milenio! Yugi tardó años en armarlo. Alberga el alma de un faraón sin nombre con una fuerza inquebrantable.',
        svgPath: `
          <polygon points="50,88 14,26 86,26" fill="url(#goldGrad)" stroke="#fff" stroke-width="1.8" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"/>
          <circle cx="50" cy="18" r="8" fill="none" stroke="url(#goldGrad)" stroke-width="3"/>
          <circle cx="50" cy="18" r="4.5" fill="#1a1408"/>
          <line x1="25" y1="44" x2="75" y2="44" stroke="#684a08" stroke-width="1.8"/>
          <line x1="34" y1="62" x2="66" y2="62" stroke="#684a08" stroke-width="1.8"/>
          <line x1="43" y1="76" x2="57" y2="76" stroke="#684a08" stroke-width="1.8"/>
          <ellipse cx="50" cy="36" rx="13" ry="7" fill="#1a1408" stroke="#ffd700" stroke-width="1.4"/>
          <circle cx="50" cy="36" r="3.8" fill="url(#eyeGlow)"/>
          <circle cx="50" cy="36" r="1.8" fill="#000"/>
          <path d="M36,30 Q50,26 64,30" fill="none" stroke="#ffd700" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M45,43 L45,48" stroke="#ffd700" stroke-width="1.8"/>
          <path d="M55,43 L58,48" stroke="#ffd700" stroke-width="1.8"/>
        `
      }
    ];
};

// Pantalla de Celebración cuando se obtiene una Reliquia Sagrada
window.showMillenniumItemCelebration = function(wonItem, charId, onDone) {
    if (window.playCustomMusic) window.playCustomMusic('dueloterminado.mp3');
    if (window.playViolinClick) window.playViolinClick();
    
    let modal = document.createElement('div');
    modal.id = 'relic-celebration-modal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:radial-gradient(circle at center, rgba(35,22,6,0.96) 0%, rgba(8,5,2,0.99) 100%); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:20px; box-sizing:border-box;';
    
    let aura = document.createElement('div');
    aura.style.cssText = 'position:absolute; width:460px; height:460px; background:radial-gradient(circle, rgba(255,215,0,0.35) 0%, rgba(255,165,0,0.12) 45%, rgba(0,0,0,0) 75%); border-radius:50%; pointer-events:none;';
    modal.appendChild(aura);
    
    let svgBox = document.createElement('div');
    svgBox.style.cssText = 'width:130px; height:130px; margin-bottom:15px; display:flex; align-items:center; justify-content:center; filter:drop-shadow(0 0 20px #ffd700) drop-shadow(0 0 45px rgba(255,215,0,0.8)); z-index:2;';
    svgBox.innerHTML = `
      <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
        <defs>
          <linearGradient id="goldGradCelebration" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff8cc"/>
            <stop offset="35%" stop-color="#ffd700"/>
            <stop offset="75%" stop-color="#b8860b"/>
            <stop offset="100%" stop-color="#704214"/>
          </linearGradient>
          <radialGradient id="eyeGlowCelebration" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#ffd700"/>
            <stop offset="100%" stop-color="#d4af37"/>
          </radialGradient>
          <radialGradient id="eyeOrbCelebration" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#fff9d6"/>
            <stop offset="30%" stop-color="#ffd700"/>
            <stop offset="75%" stop-color="#996515"/>
            <stop offset="100%" stop-color="#3d2600"/>
          </radialGradient>
        </defs>
        ${wonItem.svgPath.replace(/url\(#goldGrad\)/g, 'url(#goldGradCelebration)').replace(/url\(#eyeGlow\)/g, 'url(#eyeGlowCelebration)').replace(/url\(#eyeOrb\)/g, 'url(#eyeOrbCelebration)')}
      </svg>
    `;
    modal.appendChild(svgBox);
    
    let subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-family:VT323, monospace; font-size:24px; color:#ffd700; letter-spacing:3px; text-shadow:0 0 12px #ffd700; z-index:2; margin-bottom:6px;';
    subtitle.textContent = '✨ ¡ARTÍCULO DEL MILENIO RECUPERADO! ✨';
    modal.appendChild(subtitle);
    
    let title = document.createElement('div');
    title.style.cssText = 'font-family:"Cinzel", serif, "Times New Roman"; font-size:32px; font-weight:900; color:#fff; letter-spacing:2px; text-shadow:0 0 25px rgba(255,215,0,0.8), 2px 2px 0 #000; z-index:2; margin-bottom:6px;';
    title.textContent = wonItem.name.toUpperCase();
    modal.appendChild(title);
    
    let bearerText = document.createElement('div');
    bearerText.style.cssText = 'font-size:15px; color:#f0e68c; font-family:"Segoe UI", sans-serif; z-index:2; margin-bottom:12px;';
    bearerText.textContent = `Entregado por ${wonItem.bearer} tras una gloriosa victoria`;
    modal.appendChild(bearerText);
    
    let descBox = document.createElement('div');
    descBox.style.cssText = 'max-width:540px; background:rgba(25,16,6,0.85); border:1.5px solid #b8860b; border-radius:10px; padding:12px 20px; color:#f5f5f5; font-size:14px; line-height:1.5; font-style:italic; font-family:"Segoe UI", sans-serif; z-index:2; margin-bottom:18px; box-shadow:0 4px 15px rgba(0,0,0,0.6);';
    descBox.textContent = `"${wonItem.desc}"`;
    modal.appendChild(descBox);
    
    let sStr = origGet('FMR_SAVE_' + window.activeAccount);
    let s = {};
    try { s = JSON.parse(sStr) || {}; } catch(_) {}
    let allItems = window.getMillenniumItems(s);
    let nowUnlocked = allItems.filter(x => x.unlocked).length;
    
    let counterPill = document.createElement('div');
    counterPill.style.cssText = 'background:#3a2000; border:2px solid #ffd700; border-radius:24px; padding:6px 20px; color:#ffd700; font-family:VT323, monospace; font-size:20px; font-weight:bold; letter-spacing:2px; box-shadow:0 0 15px rgba(255,215,0,0.4); z-index:2; margin-bottom:20px;';
    counterPill.textContent = `☥ RELIQUIAS RECUPERADAS: ${nowUnlocked} / 7`;
    modal.appendChild(counterPill);
    
    let btnContinue = document.createElement('button');
    btnContinue.className = 'campBtn3000 ps1-btn ps1-btn-green';
    btnContinue.style.cssText = 'padding:12px 36px; font-size:20px; font-family:VT323, monospace; letter-spacing:2px; cursor:pointer; z-index:2; box-shadow:0 0 20px rgba(76,175,80,0.5);';
    btnContinue.textContent = '☥ CONTINUAR AVENTURA';
    btnContinue.onclick = () => {
        if (window.playViolinClick) window.playViolinClick();
        modal.remove();
        if (typeof onDone === 'function') onDone();
    };
    modal.appendChild(btnContinue);
    
    document.body.appendChild(modal);
};

// ════════════════════════════════════════════════════════════════
//  NODOS Y RUTA DEL MAPA DE CAMPAÑA
// ════════════════════════════════════════════════════════════════
window.CUSTOM_NODES = [
    { id: 'n1', left: '50%', top: '86%', label: 'TRISTAN', char: 'TRISTAN', req: [] },
    { id: 'n2', left: '34%', top: '78%', label: 'WEEVIL', char: 'WEEVIL', req: ['tristan'] },
    { id: 'n3', left: '66%', top: '70%', label: 'MAI', char: 'MAI', req: ['weevil'] },
    { id: 'n3b', left: '34%', top: '62%', label: 'MAKO', char: 'MAKO', req: ['mai'] },
    { id: 'n4', left: '50%', top: '54%', label: 'JOEY', char: 'JOEY', req: ['mako'], itemKey: 'key', itemName: 'Llave del Milenio', itemIcon: '🔑' },
    { id: 'n5', left: '26%', top: '46%', label: 'PEGASUS', char: 'PEGASUS', req: ['joey'], itemKey: 'eye', itemName: 'Ojo del Milenio', itemIcon: '👁️' },
    { id: 'n6', left: '74%', top: '46%', label: 'BAKURA', char: 'BAKURA', req: ['pegasus'], itemKey: 'ring', itemName: 'Sortija del Milenio', itemIcon: '💍' },
    { id: 'n7', left: '50%', top: '39%', label: 'NOAH', char: 'NOAH', req: ['bakura'] },
    { id: 'n7b', left: '50%', top: '32%', label: 'KOSABURO', char: 'KOSABURO', req: ['noah'] },
    { id: 'n8', left: '30%', top: '25%', label: 'ISHIZU', char: 'ISHIZU', req: ['kosaburo'], itemKey: 'necklace', itemName: 'Collar del Milenio', itemIcon: '📿' },
    { id: 'n9', left: '70%', top: '25%', label: 'ODION', char: 'ODION', req: ['ishizu'] },
    { id: 'n10', left: '50%', top: '18%', label: 'MARIK', char: 'MARIK', req: ['odion'], itemKey: 'rod', itemName: 'Cetro del Milenio', itemIcon: '🔱' },
    { id: 'n11', left: '38%', top: '11%', label: 'KAIBA', char: 'SETO', req: ['marik'], itemKey: 'scale', itemName: 'Balanza del Milenio', itemIcon: '⚖️' },
    { id: 'n12', left: '62%', top: '11%', label: 'YUGI', char: 'YUGI', req: ['kaiba'], itemKey: 'puzzle', itemName: 'Rompecabezas del Milenio', itemIcon: '🧩' },
    { id: 'n13', left: '88%', top: '86%', label: 'TIENDA', char: 'ABUELO', req: [] }, 
    { id: 'n14', left: '50%', top: '4%', label: 'PUERTA SAGRADA', char: 'ATEM', req: ['bakura','noah','kosaburo','ishizu','pegasus','yugi','kaiba','joey','marik','odion','mako'] }
];

window.customShowMap = function() {
    window.isFreeDuelMode = false;
    if (window.cleanAllOverlays) window.cleanAllOverlays();
    if (window.hideDuelBoard) window.hideDuelBoard();
    if (window.nativeAPI && window.nativeAPI.showShell) window.nativeAPI.showShell();
    window.playCustomMusic('mapa.mp3');
    
    let camp = document.getElementById('campaign3000');
    if (camp) { camp.innerHTML = ''; camp.classList.add('hidden'); }
    
    // Obtenemos estado actual del save
    let s = {};
    try {
        let activeUser = window.activeAccount || localStorage.getItem('FMR_ACTIVE_ACCOUNT') || '';
        let savedStr = (activeUser ? origGet('FMR_SAVE_' + activeUser) : null) || origGet('FMR_REBORN_STORY_V3000');
        if (savedStr) s = JSON.parse(savedStr) || {};
        else if (window.memorySave) s = window.memorySave;
    } catch(e) {}
    
    let cleared = Array.isArray(s.cleared) ? s.cleared.map(x => String(x).toLowerCase()) : [];
    let curActiveDeck = (s.decks && s.activeDeck && s.decks[s.activeDeck]) || s.deck || [];
    let activeDeckCount = curActiveDeck ? curActiveDeck.length : 40;
    
    const MILLENNIUM_ITEMS = window.getMillenniumItems(s);
    const unlockedCount = MILLENNIUM_ITEMS.filter(it => it.unlocked).length;
    
    // Contenedor principal del Mapa con imagen de ruinas egipcias
    let map = document.createElement('div');
    map.id = 'map-container-overlay';
    map.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:999999; background: linear-gradient(180deg, rgba(8,5,2,0.72) 0%, rgba(18,12,5,0.84) 100%), url("ImagenesPersonajes/PortadaPrincipal.jpeg") center center / cover no-repeat, #0a0600; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; font-family:"Segoe UI", sans-serif;';
    
    let mapStage = document.createElement('div');
    mapStage.id = 'map-stage-track';
    mapStage.style.cssText = 'position:relative; width:100%; min-height:100vh;';
    
    // Inyección de estilos de animación para el mapa si no existen
    if (!document.getElementById('custom-map-animations')) {
        let st = document.createElement('style');
        st.id = 'custom-map-animations';
        st.textContent = `
            @keyframes relicNodeGlow {
                0%, 100% { box-shadow: 0 0 15px #ffd700, 0 0 30px rgba(255,215,0,0.5); border-color: #fff; }
                50% { box-shadow: 0 0 25px #fff, 0 0 50px rgba(255,215,0,0.9); border-color: #ffd700; }
            }
            @keyframes relicBadgePulse {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px #ffd700); }
                50% { transform: scale(1.08); filter: drop-shadow(0 0 10px #fff); }
            }
            @keyframes mapPathGlow {
                0%, 100% { opacity: 0.85; stroke-width: 4; }
                50% { opacity: 1; stroke-width: 5.5; }
            }
            .map-interactive-node {
                transition: transform 0.22s ease, filter 0.22s ease;
            }
            .map-interactive-node:hover {
                transform: translate(-50%, -50%) scale(1.15) !important;
                z-index: 50 !important;
            }
            .map-top-action-btn {
                background: linear-gradient(180deg, #2b1f0c 0%, #150f05 100%);
                border: 1.5px solid #b8860b;
                color: #f7e2a9;
                font-family: VT323, monospace;
                font-size: 15px;
                padding: 4px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .map-top-action-btn:hover {
                background: #ffd700;
                color: #000;
                border-color: #fff;
                box-shadow: 0 0 12px rgba(255,215,0,0.7);
            }
        `;
        document.head.appendChild(st);
    }
    
    // ── 1. BARRA SUPERIOR HUD ESTILO KAME GAME ─────────────────────
    let topBar = document.createElement('div');
    topBar.id = 'map-top-bar';
    topBar.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:62px; background:linear-gradient(180deg, rgba(10,6,2,0.96) 0%, rgba(22,14,5,0.92) 80%, rgba(22,14,5,0) 100%); border-bottom:2px solid #b8860b; box-shadow:0 4px 20px rgba(0,0,0,0.85); z-index:100; display:flex; align-items:center; justify-content:space-between; padding:0 16px; box-sizing:border-box;';
    
    // 1.1 Left: Título y Logo
    let brandWrap = document.createElement('div');
    brandWrap.id = 'map-brand-wrap';
    brandWrap.style.cssText = 'display:flex; align-items:center; gap:10px; cursor:pointer;';
    brandWrap.innerHTML = `
        <div style="font-size:26px; filter:drop-shadow(0 0 8px #ffd700); line-height:1;">☥</div>
        <div>
            <div class="map-brand-title" style="font-family:'Cinzel', serif, 'Times New Roman'; font-size:15px; font-weight:900; color:#ffd700; letter-spacing:1.5px; text-shadow:0 2px 6px rgba(0,0,0,0.8);">CAMPAÑA · EL REINO DE LOS DUELOS</div>
            <div class="map-brand-subtitle" style="font-size:10px; color:#d4af37; letter-spacing:1px; font-family:'Segoe UI', sans-serif;">Ruta Sagrada hacia la Puerta del Nuevo Mundo</div>
        </div>
    `;
    topBar.appendChild(brandWrap);
    
    // 1.2 Center: Mini Barra de los 7 Artículos del Milenio
    let relicsBar = document.createElement('div');
    relicsBar.id = 'map-relics-bar';
    relicsBar.style.cssText = 'display:flex; align-items:center; gap:6px; background:rgba(0,0,0,0.65); padding:4px 10px; border-radius:20px; border:1px solid #7c5a14;';
    
    MILLENNIUM_ITEMS.forEach(it => {
        let relicChip = document.createElement('div');
        relicChip.style.cssText = `display:flex; align-items:center; gap:4px; padding:3px 8px; border-radius:14px; cursor:pointer; transition:transform 0.18s ease; ${it.unlocked ? 'background:linear-gradient(135deg, rgba(212,175,55,0.3), rgba(0,0,0,0.8)); border:1.5px solid #ffd700; box-shadow:0 0 8px rgba(255,215,0,0.4);' : 'background:rgba(20,15,5,0.7); border:1px solid #4a3610; opacity:0.55;'}`;
        relicChip.title = it.unlocked ? `${it.name}: ¡RECUPERADO de ${it.bearer}!` : `${it.name}: Custodiado por ${it.bearer}. ¡Derrótalo para reclamarlo!`;
        relicChip.innerHTML = `<span>${it.unlocked ? it.icon : '🔒'}</span><span style="font-size:11px; font-weight:bold; color:${it.unlocked ? '#ffd700' : '#887755'}; font-family:'Segoe UI', sans-serif;">${it.shortName}</span>`;
        relicChip.onmouseover = () => { relicChip.style.transform = 'scale(1.1)'; };
        relicChip.onmouseout = () => { relicChip.style.transform = 'scale(1)'; };
        relicChip.onclick = () => {
            if (window.playViolinClick) window.playViolinClick();
            alert(`${it.icon} ${it.name.toUpperCase()}\n\nPortador Sagrado: ${it.bearer}\nPoder: ${it.power}\n\n"${it.desc}"\n\nEstado: ${it.unlocked ? '✅ RECUPERADO' : '🔒 BLOQUEADO (' + it.hint + ')'}`);
        };
        relicsBar.appendChild(relicChip);
    });
    topBar.appendChild(relicsBar);
    
    // 1.3 Right: Stats y Botones de Acción
    let actionsWrap = document.createElement('div');
    actionsWrap.id = 'map-actions-wrap';
    actionsWrap.style.cssText = 'display:flex; align-items:center; gap:10px;';
    
    // PM
    let pmBadge = document.createElement('div');
    pmBadge.style.cssText = 'background:#241904; border:1px solid #b8860b; border-radius:6px; padding:4px 10px; color:#ffd700; font-family:VT323, monospace; font-size:16px; font-weight:bold; letter-spacing:1px;';
    pmBadge.textContent = `💰 PM: ${s.pm || 0}`;
    actionsWrap.appendChild(pmBadge);
    
    // Deck Activo Pill
    let deckBadge = document.createElement('div');
    deckBadge.style.cssText = 'background:#142036; border:1px solid #3d6499; border-radius:6px; padding:4px 10px; color:#90caf9; font-family:VT323, monospace; font-size:15px; cursor:pointer;';
    deckBadge.title = 'Haz clic para ir al Editor de Decks';
    deckBadge.textContent = `🎴 DECK: ${s.activeDeck || 'Deck 1'} (${activeDeckCount}/40)`;
    deckBadge.onclick = () => {
        if (window.playViolinClick) window.playViolinClick();
        if (window.customShowDeckEditor) window.customShowDeckEditor();
    };
    actionsWrap.appendChild(deckBadge);
    
    // Milenio Counter Pill
    let milenioBadge = document.createElement('div');
    milenioBadge.style.cssText = 'background:#382200; border:1.5px solid #ffd700; border-radius:6px; padding:4px 12px; color:#ffd700; font-family:VT323, monospace; font-size:16px; font-weight:bold; box-shadow:0 0 10px rgba(255,215,0,0.3);';
    milenioBadge.textContent = `✨ MILENIO: ${unlockedCount} / 7`;
    actionsWrap.appendChild(milenioBadge);

    // Suscripción Countdown Pill
    let subBadge = document.createElement('div');
    subBadge.id = 'map-subscription-pill';
    let subInfo = (s && s.subscription) || { isActive: true, status: 'trial', remainingDays: 30 };
    let isVip = subInfo.status === 'vip_6m';
    let subColor = isVip ? '#ffd700' : (subInfo.isActive ? '#7ee787' : '#ff4d4d');
    let subBorder = isVip ? '#ffd700' : (subInfo.isActive ? '#2e7d32' : '#d32f2f');
    let subText = isVip ? `⭐ VIP: ${subInfo.remainingDays}d` : (subInfo.isActive ? `⏳ PRUEBA: ${subInfo.remainingDays}d` : `⚠️ EXPIRADA`);
    
    subBadge.style.cssText = `background:#151824; border:1.5px solid ${subBorder}; border-radius:6px; padding:4px 10px; color:${subColor}; font-family:VT323, monospace; font-size:15px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:4px; box-shadow:0 0 10px rgba(0,0,0,0.6); transition:transform 0.15s;`;
    subBadge.title = 'Haz clic para consultar o adquirir tu suscripción de 6 meses ($10 USD)';
    subBadge.textContent = subText;
    subBadge.onmouseover = () => { subBadge.style.transform = 'scale(1.05)'; };
    subBadge.onmouseout = () => { subBadge.style.transform = 'scale(1)'; };
    subBadge.onclick = () => {
        if (window.playViolinClick) window.playViolinClick();
        if (window.showSubscriptionPurchaseModal) window.showSubscriptionPurchaseModal(false, { name: window.activeAccount }, subInfo);
    };
    actionsWrap.appendChild(subBadge);
    
    // Botón Duelo Libre
    let btnFreeDuel = document.createElement('button');
    btnFreeDuel.className = 'map-top-action-btn';
    btnFreeDuel.style.cssText = 'background: linear-gradient(180deg, #1b2838 0%, #0d1520 100%); border: 1.5px solid #64b5f6; color: #e1f5fe;';
    btnFreeDuel.innerHTML = '<span>⚡</span><span>DUELO LIBRE</span>';
    btnFreeDuel.onclick = () => {
        if (window.playViolinClick) window.playViolinClick();
        if (window.openFreeDuelMenu) window.openFreeDuelMenu();
    };
    actionsWrap.appendChild(btnFreeDuel);

    // Botón Tienda
    let btnShop = document.createElement('button');
    btnShop.className = 'map-top-action-btn';
    btnShop.innerHTML = '<span>🏪</span><span>TIENDA</span>';
    btnShop.onclick = () => {
        if (window.playViolinClick) window.playViolinClick();
        if (window.openCustomShopMenu) window.openCustomShopMenu();
    };
    actionsWrap.appendChild(btnShop);
    
    // Botón Guardar
    let btnSave = document.createElement('button');
    btnSave.className = 'map-top-action-btn';
    btnSave.innerHTML = '<span>💾</span><span>GUARDAR</span>';
    btnSave.onclick = () => {
        if (window.playViolinClick) window.playViolinClick();
        s.lastPlayed = Date.now();
        if (window.persistUserSave) window.persistUserSave(s);
        else origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
        alert('💾 ¡Partida guardada exitosamente en el servidor y navegador!');
    };
    actionsWrap.appendChild(btnSave);
    
    // Botón Menú
    let btnExit = document.createElement('button');
    btnExit.className = 'map-top-action-btn';
    btnExit.style.borderColor = '#993333';
    btnExit.style.color = '#ff9999';
    btnExit.innerHTML = '<span>🚪</span><span>MENÚ</span>';
    btnExit.onclick = () => {
        if (window.playViolinClick) window.playViolinClick();
        map.remove();
        if (window.customShowMain) window.customShowMain();
    };
    actionsWrap.appendChild(btnExit);
    
    topBar.appendChild(actionsWrap);
    map.appendChild(topBar);
    map.appendChild(mapStage);
    
    // ── 2. SVG CONEXIONES DE RUTA Y DEFINICIÓN DE GRADIENTES ────────
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:15;';
    
    svg.innerHTML = `
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff8cc"/>
          <stop offset="35%" stop-color="#ffd700"/>
          <stop offset="75%" stop-color="#b8860b"/>
          <stop offset="100%" stop-color="#704214"/>
        </linearGradient>
        <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#ffd700"/>
          <stop offset="100%" stop-color="#d4af37"/>
        </radialGradient>
        <radialGradient id="eyeOrb" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fff9d6"/>
          <stop offset="30%" stop-color="#ffd700"/>
          <stop offset="75%" stop-color="#996515"/>
          <stop offset="100%" stop-color="#3d2600"/>
        </radialGradient>
      </defs>
    `;
    
    const nodes = window.CUSTOM_NODES;
    const MAP_EDGES = [
        ['n1', 'n2'],
        ['n2', 'n3'],
        ['n3', 'n3b'],
        ['n3b', 'n4'],
        ['n4', 'n5'],
        ['n5', 'n6'],
        ['n6', 'n7'],
        ['n7', 'n7b'],
        ['n7b', 'n8'],
        ['n8', 'n9'],
        ['n9', 'n10'],
        ['n10', 'n11'],
        ['n11', 'n12'],
        ['n12', 'n14'],
        ['n1', 'n13']
    ];
    
    MAP_EDGES.forEach(([fId, tId]) => {
        let fNode = nodes.find(x => x.id === fId);
        let tNode = nodes.find(x => x.id === tId);
        if (!fNode || !tNode) return;
        
        let fChar = (fNode.char || '').toLowerCase();
        if (fChar === 'seto') fChar = 'kaiba';
        let isPathConquered = (fNode.id === 'n13') || cleared.includes(fChar);
        
        let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fNode.left); line.setAttribute('y1', fNode.top);
        line.setAttribute('x2', tNode.left); line.setAttribute('y2', tNode.top);
        
        if (isPathConquered) {
            line.setAttribute('stroke', '#ffd700');
            line.setAttribute('stroke-width', '4.5');
            line.style.cssText = 'filter: drop-shadow(0 0 6px rgba(255,215,0,0.85)); animation: mapPathGlow 2.5s infinite ease-in-out;';
        } else {
            line.setAttribute('stroke', '#664a18');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '7,7');
            line.setAttribute('opacity', '0.65');
        }
        svg.appendChild(line);
    });
    mapStage.appendChild(svg);
    
    // ── 3. RENDERIZADO DE NODOS DE PERSONAJES Y ARTÍCULOS ───────────
    nodes.forEach(n => {
        let btn = document.createElement('div');
        btn.className = 'map-interactive-node';
        btn.style.cssText = `position:absolute; transform:translate(-50%, -50%); display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer; z-index:20; left:${n.left}; top:${n.top};`;
        
        let cid = (n.char || '').toLowerCase();
        if (cid === 'seto') cid = 'kaiba';
        
        let isUnlocked = true;
        if (cid === 'abuelo' || cid === 'atem') {
            isUnlocked = true;
        } else {
            isUnlocked = n.req.every(r => cleared.includes(r.toLowerCase()));
        }
        
        let isCleared = n.char && cleared.includes(cid);
        let hasItem = !!n.itemKey;
        let itemRecovered = hasItem && isCleared;
        
        let p = portraitMap[n.char];
        if (p) {
            let filterStyle = isCleared ? 'filter: brightness(0.7) contrast(0.95);' : (!isUnlocked ? 'filter: brightness(0.35) grayscale(100%);' : '');
            let borderStyle = isCleared ? 'border: 3px solid #4caf50;' : (isUnlocked ? (hasItem ? 'border: 3px solid #ffd700; animation: relicNodeGlow 2s infinite ease-in-out;' : 'border: 3px solid #e4c06b;') : 'border: 3px solid #443315;');
            
            // 3.1 Insignia de Reliquia Flotante (para los 7 portadores)
            let relicBadgeHtml = '';
            if (hasItem) {
                if (itemRecovered) {
                    relicBadgeHtml = `
                        <div class="map-node-badge" style="position:absolute; top:-16px; background:linear-gradient(135deg, #1b4d2e, #2e7d32); color:#d4edda; border:1.5px solid #a3e9a4; border-radius:12px; padding:2px 7px; font-size:10px; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.85); white-space:nowrap; display:flex; align-items:center; gap:3px; z-index:25;">
                            <span>✨</span> <span>${n.itemIcon} RECUPERADO</span>
                        </div>
                    `;
                } else if (isUnlocked) {
                    relicBadgeHtml = `
                        <div class="map-node-badge" style="position:absolute; top:-18px; background:linear-gradient(135deg, #b8860b, #ffd700); color:#000; border:1.5px solid #fff; border-radius:12px; padding:2px 8px; font-size:10px; font-weight:900; box-shadow:0 0 12px rgba(255,215,0,0.9); white-space:nowrap; display:flex; align-items:center; gap:3px; z-index:25; animation:relicBadgePulse 1.8s infinite ease-in-out;">
                            <span>${n.itemIcon}</span> <span>${n.itemName.toUpperCase()}</span>
                        </div>
                    `;
                } else {
                    relicBadgeHtml = `
                        <div class="map-node-badge" style="position:absolute; top:-14px; background:rgba(25,16,5,0.85); color:#b8860b; border:1px solid #7c5a14; border-radius:10px; padding:2px 6px; font-size:9px; white-space:nowrap; display:flex; align-items:center; gap:3px; z-index:25;">
                            <span>🔒</span> <span>${n.itemName}</span>
                        </div>
                    `;
                }
            }
            
            // 3.2 Etiqueta inferior de estado
            let labelText = isCleared ? `<span style="color:#a3e9a4">✓ ${n.label}</span>` : (!isUnlocked ? '???' : n.label);
            if (n.id === 'n13') labelText = '🏪 TIENDA';
            if (n.id === 'n14') labelText = unlockedCount >= 7 ? '🌌 NUEVO MUNDO' : `🔒 PUERTA (${unlockedCount}/7)`;
            
            btn.innerHTML = `
                ${relicBadgeHtml}
                <div class="map-node-avatar" style="width:70px; height:70px; border-radius:50%; ${borderStyle} overflow:hidden; box-shadow:0 0 16px rgba(0,0,0,0.8); background:#000; position:relative; ${filterStyle}">
                    <img src="ImagenesPersonajes/${p}" style="width:100%; height:100%; object-fit:cover; object-position:top;" onerror="this.src='https://i.imgur.com/vHqR8Kq.png'">
                    ${isCleared ? '<div style="position:absolute; inset:0; background:rgba(46,125,50,0.22); pointer-events:none;"></div>' : ''}
                </div>
                <div class="map-node-label" style="background:rgba(8,5,2,0.9); border:1.5px solid ${isCleared ? '#2e7d32' : (isUnlocked ? '#d4af37' : '#554015')}; padding:3px 8px; border-radius:6px; color:${isCleared ? '#a3e9a4' : (isUnlocked ? '#fff' : '#887755')}; font-size:12px; font-family:VT323, monospace; letter-spacing:1px; text-shadow:2px 2px 0 #000; white-space:nowrap;">
                    ${labelText}
                </div>
            `;
        }
        
        btn.onmouseover = () => { if (window.playHoverSound) window.playHoverSound(); };
        
        // ── 3.3 Click Handler Interactivo ──
        btn.onclick = () => {
            if (window.playViolinClick) window.playViolinClick();
            
            // Caso Tienda
            if (n.id === 'n13') {
                if (window.openCustomShopMenu) window.openCustomShopMenu();
                return;
            }
            
            // Caso Puerta al Nuevo Mundo
            if (n.id === 'n14') {
                if (unlockedCount >= 7) {
                    alert('🌌 ¡HAS REUNIDO LOS 7 ARTÍCULOS DEL MILENIO!\n\nEl Faraón Atem ha abierto las puertas del Nuevo Mundo. ¡El próximo capítulo comenzará muy pronto!');
                } else {
                    alert(`🔒 PUERTA SAGRADA DEL NUEVO MUNDO\n\nProgreso actual: ${unlockedCount} / 7 Artículos Recuperados.\n\nDebes derrotar a todos los portadores sagrados en la Campaña para quebrar el sello ancestral.`);
                }
                return;
            }
            
            // Ya superado
            if (isCleared) {
                let rematchChoice = confirm(`Ya has derrotado a ${n.label} en la Campaña principal.\n\n¿Deseas retarlo nuevamente en el DUELO LIBRE para ganar más cartas y PM?`);
                if (rematchChoice) {
                    window.isFreeDuelMode = true;
                    if (window.cleanAllOverlays) window.cleanAllOverlays();
                    let sCheckStr = origGet('FMR_SAVE_' + window.activeAccount);
                    if (sCheckStr) {
                        try {
                            let sCheck = JSON.parse(sCheckStr);
                            if (sCheck) {
                                if (sCheck.decks && sCheck.activeDeck && sCheck.decks[sCheck.activeDeck]) {
                                    sCheck.deck = [...sCheck.decks[sCheck.activeDeck]];
                                    if (window.persistUserSave) window.persistUserSave(sCheck);
                                }
                                if (sCheck.deck && sCheck.deck.length !== 40) {
                                    alert(`⚠️ DECK ACTIVO NO VÁLIDO (${sCheck.deck.length}/40) ⚠️\n\nTu Deck Activo ("${sCheck.activeDeck || 'Principal'}") debe tener EXACTAMENTE 40 cartas para poder combatir.\nPor favor ve al Dashboard del Deck para ajustarlo.`);
                                    if (window.customShowDeckEditor) window.customShowDeckEditor();
                                    return;
                                }
                            }
                        } catch(e) {}
                    }
                    let startDuelFn = (window.nativeAPI && window.nativeAPI.beginStoryDuel) || window.beginStoryDuel;
                    if (startDuelFn && n.char) {
                        let cid = n.char.toLowerCase() === 'seto' ? 'kaiba' : n.char.toLowerCase();
                        window.playViolinClick();
                        window.lastDuelOpponent = cid;
                        if (window.FMRMusic302) {
                            window.FMRMusic302.start = function(){};
                            window.FMRMusic302.stop = function(){};
                        }
                        if (window.showDuelBoard) window.showDuelBoard();
                        startDuelFn(cid);
                        window.playCustomMusic(window.getDuelMusic(cid));
                    } else if (window.openFreeDuelMenu) {
                        window.openFreeDuelMenu();
                    }
                }
                return;
            }
            
            // Bloqueado
            if (!isUnlocked) {
                alert('🔒 CAMINO BLOQUEADO\n\nDebes superar los duelos anteriores para abrir este sendero en el Reino de los Duelistas.');
                return;
            }
            
            // Verificar Deck Activo de 40 cartas
            let sCheckStr = origGet('FMR_SAVE_' + window.activeAccount);
            if (sCheckStr) {
                try {
                    let sCheck = JSON.parse(sCheckStr);
                    if (sCheck) {
                        if (sCheck.decks && sCheck.activeDeck && sCheck.decks[sCheck.activeDeck]) {
                            sCheck.deck = [...sCheck.decks[sCheck.activeDeck]];
                            if (window.persistUserSave) window.persistUserSave(sCheck);
                        }
                        if (sCheck.deck && sCheck.deck.length !== 40) {
                            alert(`⚠️ DECK ACTIVO NO VÁLIDO (${sCheck.deck.length}/40) ⚠️\n\nTu Deck Activo ("${sCheck.activeDeck || 'Principal'}") debe tener EXACTAMENTE 40 cartas para poder combatir.\nPor favor ve al Dashboard del Deck para ajustarlo.`);
                            if (window.customShowDeckEditor) window.customShowDeckEditor();
                            return;
                        }
                    }
                } catch(_) {}
            }
            
            // ── MODAL INTERACTIVO DE ENCUENTRO ("DESAFÍO DE DUELISTA") ──
            let modal = document.createElement('div');
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:9999999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
            
            let card = document.createElement('div');
            card.style.cssText = 'background:linear-gradient(180deg, #241604 0%, #120b02 100%); border:2px solid #ffd700; border-radius:14px; padding:24px 30px; width:440px; max-width:90vw; text-align:center; box-shadow:0 0 35px rgba(0,0,0,0.9), 0 0 20px rgba(255,215,0,0.25); display:flex; flex-direction:column; align-items:center; gap:12px;';
            
            let modalHeader = document.createElement('div');
            modalHeader.style.cssText = 'font-family:VT323, monospace; font-size:22px; color:#ffd700; letter-spacing:2px;';
            modalHeader.textContent = '⚔️ DESAFÍO DE DUELISTA DE CAMPAÑA ⚔️';
            card.appendChild(modalHeader);
            
            let imgWrap = document.createElement('div');
            imgWrap.style.cssText = 'width:90px; height:90px; border-radius:50%; border:3px solid #ffd700; overflow:hidden; box-shadow:0 0 20px rgba(255,215,0,0.4); margin:6px 0;';
            imgWrap.innerHTML = `<img src="ImagenesPersonajes/${p}" style="width:100%; height:100%; object-fit:cover; object-position:top;">`;
            card.appendChild(imgWrap);
            
            let nameTag = document.createElement('div');
            nameTag.style.cssText = 'font-family:"Cinzel", serif, "Times New Roman"; font-size:24px; font-weight:900; color:#fff; letter-spacing:1px;';
            nameTag.textContent = n.label;
            card.appendChild(nameTag);
            
            // Relic warning if this character has an item
            if (hasItem) {
                let relicBox = document.createElement('div');
                relicBox.style.cssText = 'width:100%; background:linear-gradient(135deg, rgba(212,175,55,0.25), rgba(30,18,4,0.9)); border:1.5px solid #ffd700; border-radius:8px; padding:10px 14px; box-sizing:border-box; box-shadow:0 0 15px rgba(255,215,0,0.25);';
                relicBox.innerHTML = `
                    <div style="color:#ffd700; font-size:12px; font-weight:bold; letter-spacing:1.5px;">⚡ CUSTODIA UN ARTÍCULO DEL MILENIO ⚡</div>
                    <div style="color:#fff; font-size:17px; font-weight:900; margin:4px 0;">${n.itemIcon} ${n.itemName}</div>
                    <div style="color:#a3e9a4; font-size:12px; font-weight:bold;">¡Al derrotar a este duelista, reclamarás su reliquia sagrada!</div>
                `;
                card.appendChild(relicBox);
            } else {
                let infoBox = document.createElement('div');
                infoBox.style.cssText = 'font-size:13px; color:#c7a76d; font-family:"Segoe UI", sans-serif;';
                infoBox.textContent = 'Duelo Oficial de Campaña · Baraja de 40 Cartas · Recompensa: PM + Cartas de Victoria';
                card.appendChild(infoBox);
            }
            
            let btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex; gap:16px; width:100%; justify-content:center; margin-top:8px;';
            
            let btnStart = document.createElement('button');
            btnStart.className = 'campBtn3000 ps1-btn ps1-btn-green';
            btnStart.style.cssText = 'padding:10px 24px; font-size:18px; font-family:VT323, monospace; letter-spacing:1.5px;';
            btnStart.textContent = '⚔️ INICIAR COMBATE';
            btnStart.onclick = () => {
                window.isFreeDuelMode = false;
                if (window.playViolinClick) window.playViolinClick();
                modal.remove();
                
                let startDuelFn = (window.nativeAPI && window.nativeAPI.beginStoryDuel) || window.beginStoryDuel;
                if (startDuelFn) {
                    let charKey = n.char.toLowerCase();
                    if (charKey === 'seto') charKey = 'kaiba';
                    if (charKey === 'gozaburo') charKey = 'kosaburo';
                    window.lastDuelOpponent = charKey;
                    
                    let introLines = [{ role: 'system', speaker: n.char.toUpperCase(), text: '¡Prepárate para el duelo!' }];
                    if (charKey === 'tristan') {
                        introLines = [{ role: 'system', speaker: 'TRISTAN_INTRO', text: '¡Bienvenido a tu primer duelo real! Veamos de qué estás hecho.' }];
                    } else if (charKey === 'mako') {
                        introLines = [{ role: 'system', speaker: 'MAKO', text: '¡Siente la furia de las olas y el poder del gran océano! ¡Nadie derrota a Mako Tsunami en su propio elemento!' }];
                    } else if (charKey === 'kosaburo') {
                        introLines = [{ role: 'system', speaker: 'KOSABURO', text: '¡Yo soy Kosaburo Kaiba! El verdadero poder de Exodia yace en mi cementerio. ¡Contempla la fuerza imparable de Exodia Necross!' }];
                    } else if (charKey === 'yugi') {
                        introLines = [{ role: 'system', speaker: 'YUGI', text: '¡Has llegado al duelo supremo! El Rompecabezas del Milenio y el poder de los Dioses Egipcios decidirán el destino. ¡Es hora del Duelo!' }];
                    }
                    
                    window.playCustomMusic('dialogos.mp3');
                    window.renderCustomStoryDialog(introLines, 0, () => {
                        map.remove();
                        if (window.showDuelBoard) window.showDuelBoard(); 
                        startDuelFn(charKey);
                        
                        if (window.FMRMusic302) {
                            window.FMRMusic302.start = function(){};
                            window.FMRMusic302.stop = function(){};
                        }
                        window.playCustomMusic(window.getDuelMusic(n.char));
                    });
                } else {
                    alert('API nativa no cargada.');
                }
            };
            btnRow.appendChild(btnStart);
            
            let btnCancel = document.createElement('button');
            btnCancel.className = 'campBtn3000 ps1-btn ps1-btn-red';
            btnCancel.style.cssText = 'padding:10px 24px; font-size:18px; font-family:VT323, monospace; letter-spacing:1.5px;';
            btnCancel.textContent = '✖️ CANCELAR';
            btnCancel.onclick = () => {
                if (window.playViolinClick) window.playViolinClick();
                modal.remove();
            };
            btnRow.appendChild(btnCancel);
            
            card.appendChild(btnRow);
            modal.appendChild(card);
            document.body.appendChild(modal);
        };
        
        mapStage.appendChild(btn);
    });
    
    document.body.appendChild(map);
};
window.openFreeDuelMenu = function() {
    window.isFreeDuelMode = true;
    if (window.cleanAllOverlays) window.cleanAllOverlays();
    if (window.hideDuelBoard) window.hideDuelBoard();
    let camp = document.getElementById('campaign3000');
    if (camp) {
        camp.innerHTML = '';
        camp.classList.add('hidden');
        camp.style.display = 'none';
    }
    if (typeof hideShell === 'function') hideShell();
    if (window.nativeAPI && window.nativeAPI.hideShell) window.nativeAPI.hideShell();
    
    let overlay = document.createElement('div');
    overlay.id = 'custom-freeduel-menu';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: url("ImagenesPersonajes/ruinas_fondo.jpg") center / cover no-repeat, #000; z-index:9999999; display:flex; flex-direction:column; align-items:center; overflow-y:auto; padding: 40px; box-sizing:border-box;';
    
    let title = document.createElement('div');
    title.innerHTML = 'DUELO LIBRE';
    title.style.cssText = 'color: #ffcc00; font-family: VT323, monospace; font-size: 32px; text-shadow: 4px 4px 0 #000; margin-bottom: 40px; text-align: center;';
    overlay.appendChild(title);
    
    let grid = document.createElement('div');
    grid.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; gap: 30px; max-width: 1000px;';
    
    let cleared = [];
    let wins = {};
    let losses = {};
    try {
        let saveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
        let savedStr = origGet(saveKey) || origGet('FMR_REBORN_STORY_V3000');
        if (savedStr) {
            let saved = JSON.parse(savedStr);
            if (saved && saved.cleared) cleared = saved.cleared.map(x => String(x).toLowerCase()); 
            if (saved && saved.wins) wins = saved.wins;
            if (saved && saved.losses) losses = saved.losses;
        }
    } catch(e) {}
    
    window.CUSTOM_NODES.forEach(n => {
        if (!n.char) return;
        let cid = n.char.toLowerCase() === 'seto' ? 'kaiba' : n.char.toLowerCase();
        if (cleared.includes(cid)) {
            let p = portraitMap[n.char];
            let w = wins[cid] || 0;
            let l = losses[cid] || 0;
            let card = document.createElement('div');
            card.style.cssText = 'width: 150px; display:flex; flex-direction:column; align-items:center; cursor:pointer; transition: transform 0.2s;';
            card.innerHTML = `<div style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid #e4c06b; overflow: hidden; box-shadow: 0 0 15px #000; background: #000; margin-bottom: 10px;">
                <img src="ImagenesPersonajes/${p}" style="width: 100%; height: 100%; object-fit: cover; object-position: top;" onerror="this.src='https://i.imgur.com/vHqR8Kq.png'">
            </div><div style="background: rgba(0,0,0,0.8); border: 2px solid #a67c00; padding: 6px 10px; border-radius: 6px; color: #fff; font-size: 14px; font-family:VT323, monospace; text-shadow: 2px 2px 0px #000; text-align:center; width: 100%; box-sizing: border-box;">
                ${n.label}<br><span style="font-size:10px; color:#aaa; display:block; margin-top:5px;">W:${w} / L:${l}</span>
            </div>`;
            card.onmouseover = () => { card.style.transform = 'scale(1.1)'; window.playHoverSound(); };
            card.onmouseout = () => { card.style.transform = 'scale(1)'; };
            card.onclick = () => {
                let sCheckStr = origGet('FMR_SAVE_' + window.activeAccount);
                if (sCheckStr) {
                    try {
                        let sCheck = JSON.parse(sCheckStr);
                        if (sCheck) {
                            if (sCheck.decks && sCheck.activeDeck && sCheck.decks[sCheck.activeDeck]) {
                                sCheck.deck = [...sCheck.decks[sCheck.activeDeck]];
                                if (window.persistUserSave) window.persistUserSave(sCheck);
                            }
                            if (sCheck.deck && sCheck.deck.length !== 40) {
                                alert('⚠️ DECK ACTIVO NO VÁLIDO (' + sCheck.deck.length + '/40) ⚠️\n\nTu Deck Activo ("' + (sCheck.activeDeck || 'Principal') + '") debe tener EXACTAMENTE 40 cartas para poder combatir.\nPor favor ve al Dashboard del Deck para ajustarlo.');
                                return;
                            }
                        }
                    } catch(e) {}
                }
                let startDuelFn = (window.nativeAPI && window.nativeAPI.beginStoryDuel) || window.beginStoryDuel;
                if (!startDuelFn) {
                    alert("API nativa no cargada.");
                    return;
                }
                window.playViolinClick();
                window.isFreeDuelMode = true;
                if (window.cleanAllOverlays) window.cleanAllOverlays();
                else overlay.remove();
                let cCamp = document.getElementById('campaign3000');
                if (cCamp) {
                    cCamp.innerHTML = '';
                    cCamp.classList.add('hidden');
                    cCamp.style.display = 'none';
                }
                if (typeof hideShell === 'function') hideShell();
                if (window.nativeAPI && window.nativeAPI.hideShell) window.nativeAPI.hideShell();
                window.lastDuelOpponent = cid;
                // Disable native music and play minijefes.mp3
                if (window.FMRMusic302) {
                    window.FMRMusic302.start = function(){};
                    window.FMRMusic302.stop = function(){};
                }
                if(window.showDuelBoard) window.showDuelBoard(); 
                startDuelFn(cid);
                window.playCustomMusic(window.getDuelMusic(cid));
            };
            grid.appendChild(card);
        }
    });
    
    if (grid.children.length === 0) {
        let msg = document.createElement('div');
        msg.innerHTML = 'Aún no has derrotado a ningún oponente en la Campaña para desbloquearlo en Duelo Libre.';
        msg.style.cssText = 'color: #fff; font-family: VT323, monospace; font-size: 18px; margin-top: 50px; text-align:center; text-shadow: 2px 2px 4px #000;';
        grid.appendChild(msg);
    }
    
    overlay.appendChild(grid);
    
    let btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:20px; justify-content:center; flex-wrap:wrap; margin-top:50px;';

    let mapBtn = document.createElement('button');
    mapBtn.textContent = '🏛️ VOLVER AL MAPA';
    mapBtn.className = 'campBtn3000 ps1-btn ps1-btn-blue';
    mapBtn.style.cssText = 'background: rgba(0,0,0,0.85); border: 3px solid #3b82f6; color: #93c5fd; padding: 12px 28px; font-weight: bold; cursor: pointer; border-radius: 8px; font-family:VT323, monospace; font-size:18px; letter-spacing:1px;';
    mapBtn.onmouseover = window.playHoverSound;
    mapBtn.onclick = () => {
        window.playViolinClick();
        window.isFreeDuelMode = false;
        if (window.cleanAllOverlays) window.cleanAllOverlays();
        else overlay.remove();
        if (window.customShowMap) window.customShowMap();
    };
    btnRow.appendChild(mapBtn);

    let shopBtn = document.createElement('button');
    shopBtn.textContent = '🏪 VOLVER A LA TIENDA';
    shopBtn.className = 'campBtn3000 ps1-btn ps1-btn-gold';
    shopBtn.style.cssText = 'background: rgba(0,0,0,0.85); border: 3px solid #c4a04d; color: #fceea4; padding: 12px 28px; font-weight: bold; cursor: pointer; border-radius: 8px; font-family:VT323, monospace; font-size:18px; letter-spacing:1px;';
    shopBtn.onmouseover = window.playHoverSound;
    shopBtn.onclick = () => {
        window.playViolinClick();
        if (window.cleanAllOverlays) window.cleanAllOverlays();
        else overlay.remove();
        if (window.openCustomShopMenu) window.openCustomShopMenu();
    };
    btnRow.appendChild(shopBtn);

    overlay.appendChild(btnRow);
    document.body.appendChild(overlay);
};

const OPPONENT_NAMES = {
    tristan: 'Tristan Taylor',
    weevil: 'Weevil Underwood',
    mai: 'Mai Valentine',
    mako: 'Mako Tsunami',
    joey: 'Joey Wheeler',
    pegasus: 'Maximillion Pegasus',
    bakura: 'Yami Bakura',
    marik: 'Yami Marik',
    noah: 'Noah Kaiba',
    kosaburo: 'Kosaburo Kaiba',
    ishizu: 'Ishizu Ishtar',
    odion: 'Odion',
    kaiba: 'Seto Kaiba',
    yugi: 'Yami Yugi'
};

const POWERFUL_SHOP_CARDS = [
    // --- CATÁLOGO ECONÓMICO PARA FUSIONES CLÁSICAS Y PRINCIPIANTES (100 - 500 PM) ---
    // DRAGONES
    { name: 'Baby Dragon', price: 150, tier: 'DRAGÓN BÁSICO', desc: 'Dragón principiante ideal para fusiones con Trueno y Guerrero (ATK 700 / DEF 700).' },
    { name: 'Petit Dragon', price: 150, tier: 'DRAGÓN BÁSICO', desc: 'Pequeño dragón con alas veloces para fusiones tempranas (ATK 700 / DEF 700).' },
    { name: 'One-Eyed White Dragon', price: 300, tier: 'DRAGÓN COMBATE', desc: 'Dragón blanco de combate (ATK 1300 / DEF 1000).' },
    { name: 'Winged Dragon, Guardian of the Fortress #1', price: 450, tier: 'DRAGÓN ALADO', desc: 'Dragón guardián defensor de fortalezas (ATK 1400 / DEF 1200).' },
    { name: 'Koumori Dragon', price: 500, tier: 'DRAGÓN OSCURO', desc: 'Dragón murciélago sombrío (ATK 1500 / DEF 1200).' },

    // TRUENO (THUNDER)
    { name: 'Kaminarikozou', price: 150, tier: 'TRUENO BÁSICO', desc: 'Espíritu eléctrico. ¡Fusiónalo con cualquier Dragón para crear al Dragón Trueno Bicéfalo! (ATK 700 / DEF 600).' },
    { name: 'Lala Li-Oon', price: 150, tier: 'TRUENO BÁSICO', desc: 'Criatura de nubes de tormenta para fusiones eléctricas (ATK 600 / DEF 600).' },
    { name: 'Mega Thunderball', price: 200, tier: 'TRUENO BÁSICO', desc: 'Esfera rodante de alto voltaje (ATK 750 / DEF 600).' },
    { name: 'Electric Lizard', price: 300, tier: 'TRUENO COMBATE', desc: 'Reptil electrificado (ATK 850 / DEF 800).' },
    { name: 'Tripwire Beast', price: 400, tier: 'TRUENO COMBATE', desc: 'Bestia eléctrica de gran impacto (ATK 1200 / DEF 1300).' },

    // AGUA (AQUA / FISH)
    { name: 'Frog the Jam', price: 150, tier: 'AGUA BÁSICA', desc: 'Rana anfibia para fusiones acuáticas (ATK 700 / DEF 500).' },
    { name: 'Root Water', price: 250, tier: 'AGUA COMBATE', desc: 'Anfibio azul de las profundidades marinas (ATK 1000 / DEF 1000).' },
    { name: 'Water Omotics', price: 400, tier: 'AGUA DONCELLA', desc: 'Doncella de agua (ATK 1400 / DEF 1200).' },

    // GUERRERO (WARRIOR)
    { name: 'Kagemusha of the Blue Flame', price: 200, tier: 'GUERRERO SOMBRA', desc: 'Guerrero sombra de la llama azul (ATK 800 / DEF 400).' },
    { name: 'Exiled Force', price: 300, tier: 'GUERRERO TÁCTICO', desc: 'Tropa guerrera de asalto (ATK 1000 / DEF 1000).' },
    { name: 'Masaki the Legendary Swordsman', price: 300, tier: 'GUERRERO ESPADA', desc: 'Espadachín legendario de mil batallas (ATK 1100 / DEF 1100).' },
    { name: 'Beaver Warrior', price: 350, tier: 'GUERRERO BESTIA', desc: 'Guerrero leal con gran defensa (ATK 1200 / DEF 1500).' },
    { name: 'Celtic Guardian', price: 450, tier: 'GUERRERO ÉLITE', desc: 'Elfo guerrero clásico con rápida espada (ATK 1400 / DEF 1200).' },

    // PIEDRA (ROCK)
    { name: 'Stone Armadiller', price: 250, tier: 'ROCA BLINDADA', desc: 'Armadillo de piedra impenetrable (ATK 1000 / DEF 1200).' },
    { name: 'Sand Stone', price: 450, tier: 'ROCA DESIERTO', desc: 'Guardián rocoso del desierto (ATK 1300 / DEF 1600).' },
    { name: 'Giant Soldier of Stone', price: 500, tier: 'ROCA COLOSAL', desc: 'Guardián legendario de roca sólida con 2000 DEF (ATK 1300 / DEF 2000).' },

    // "LAIDY" / FEMENINAS / HADAS
    { name: 'Dancing Elf', price: 100, tier: 'HADA DANZANTE', desc: 'Hada elemental femenina para fusiones mágicas tempranas (ATK 300 / DEF 200).' },
    { name: 'Key Mace', price: 150, tier: 'HADA SAGRADA', desc: 'Pequeña hada bondadosa con maza dorada (ATK 400 / DEF 800).' },
    { name: 'Lunar Queen Elzaim', price: 250, tier: 'REINA LUNAR', desc: 'Hechicera lunar que bendice el campo (ATK 750 / DEF 1100).' },
    { name: 'Harpie Lady', price: 450, tier: 'ARPÍA ALADA', desc: 'Dama alada clásica de veloces ataques (ATK 1300 / DEF 1400).' },
    { name: 'Mystical Elf', price: 500, tier: 'ELFA MÍSTICA', desc: 'Sacerdotisa mística con monumental defensa de 2000 DEF (ATK 800 / DEF 2000).' },

    // --- MONSTRUOS NEUTROS DE ALTO PODER (SIN DIOSES NI CARTAS ICÓNICAS) ---
    { name: 'Gate Guardian', price: 70000, tier: 'LEVIATÁN', desc: 'Guardián del laberinto legendario con 3750 ATK / 3400 DEF. Poder aplastante en combate.' },
    { name: 'Cosmo Queen', price: 60000, tier: 'REINA CÓSMICA', desc: 'Reina soberana del cosmos con 2900 ATK / 2450 DEF.' },
    { name: 'Wingweaver', price: 48000, tier: 'HADA SUPREMA', desc: 'Hada guerrera de seis alas con 2750 ATK / 2400 DEF.' },
    { name: 'Sanga of the Thunder', price: 40000, tier: 'ELEMENTAL TRUENO', desc: 'Espíritu ancestral del rayo con 2600 ATK / 2200 DEF.' },
    { name: 'Suijin', price: 35000, tier: 'ELEMENTAL AGUA', desc: 'Guardián acuático ancestral con 2500 ATK / 2400 DEF.' },
    { name: 'Cyber-Tech Alligator', price: 34000, tier: 'MÁQUINA CIBER', desc: 'Caimán cibernético mejorado con 2500 ATK / 1600 DEF.' },
    { name: 'Kazejin', price: 32000, tier: 'ELEMENTAL VIENTO', desc: 'Guardián del viento ancestral con 2400 ATK / 2200 DEF.' },
    { name: 'Sword Hunter', price: 30000, tier: 'CAZADOR DE ESPADAS', desc: 'Guerrero recolector de armas enemigas con 2450 ATK / 1700 DEF.' },
    { name: 'Goblin Attack Force', price: 28000, tier: 'FUERZA DE ÉLITE', desc: 'Fuerza de asalto de nivel 4 con un demoledor ataque de 2300 ATK.' },
    { name: 'Luster Dragon #2', price: 27000, tier: 'DRAGÓN BRILLANTE', desc: 'Majestuoso dragón esmeralda con 2400 ATK / 1400 DEF.' },
    { name: 'The Fiend Megacyber', price: 22000, tier: 'GUERRERO CIBER', desc: 'Guerrero cibernético que refuerza el campo con 2200 ATK / 1200 DEF.' },
    { name: 'Giant Rex', price: 16000, tier: 'DINOSAURIO', desc: 'Tiranosaurio jurásico prehistórico con 2000 ATK / 1200 DEF.' },

    // --- MAGIAS DEVASTADORAS ---
    { name: 'Raigeki', price: 65000, tier: 'MAGIA DEVASTADORA', desc: 'Invoca un rayo colosal que destruye todos los monstruos en el campo del oponente.' },
    { name: 'Renace al Monstruo', price: 55000, tier: 'MAGIA SAGRADA', desc: 'Revive de modo especial cualquier monstruo caído en el cementerio.' },
    { name: 'Pot of Greed', price: 46000, tier: 'MAGIA DE ROBO', desc: 'Otorga una inmensa ventaja robando 2 cartas adicionales de tu mazo.' },
    { name: 'Swords of Revealing Light', price: 42000, tier: 'MAGIA DE CONTROL', desc: 'Espadas de luz sagrada que bloquean todos los ataques del oponente durante 3 turnos.' },
    { name: 'Change of Heart', price: 38000, tier: 'MAGIA DE CONTROL', desc: 'Toma el control del monstruo más poderoso del oponente.' },
    { name: 'Dark Hole', price: 35000, tier: 'MAGIA DESTRUCTIVA', desc: 'Vórtice abisal que absorbe y destruye a todos los monstruos en el campo.' },
    { name: 'Mystical Space Typhoon', price: 4000, tier: 'MAGIA RÁPIDA', desc: 'Destruye 1 carta Mágica o Trampa en el campo.' },
    { name: 'Axe of Despair', price: 25000, tier: 'EQUIPO PODEROSO', desc: 'Hacha maldita que otorga +1000 ATK de forma permanente al monstruo equipado.' },
    { name: 'Dragon Treasure', price: 14000, tier: 'EQUIPO DRAGÓN', desc: 'Tesoro ancestral que incrementa el ATK y la DEF de un dragón en +500 puntos.' },

    // --- TRAMPAS CRÍTICAS ---
    { name: 'Mirror Force', price: 58000, tier: 'TRAMPA REFLEJO', desc: 'Fuerza de espejo que destruye a todos los monstruos en posición de ataque del rival al ser atacado.' },
    { name: 'Magic Cylinder', price: 38000, tier: 'TRAMPA REFLEJO', desc: 'Anula el ataque enemigo y drena directamente los LP del oponente con el ATK de su monstruo.' },
    { name: 'Negate Attack', price: 26000, tier: 'TRAMPA DEFENSA', desc: 'Niega el ataque enemigo y finaliza la fase de batalla inmediatamente.' },
    { name: 'Sakuretsu Armor', price: 22000, tier: 'TRAMPA DESTRUCCIÓN', desc: 'Armadura explosiva que aniquila instantáneamente al monstruo que declare un ataque.' },
    { name: 'Waboku', price: 19000, tier: 'TRAMPA DEFENSA', desc: 'El jugador no recibe ningún daño por combate durante este turno.' },
    { name: 'Trap Hole', price: 15000, tier: 'TRAMPA CLÁSICA', desc: 'Agujero trampa que destruye inmediatamente a cualquier monstruo invocado con 1000+ ATK.' },
    { name: 'Widespread Ruin', price: 12000, tier: 'TRAMPA DEVASTADORA', desc: 'Destruye al monstruo rival en posición de ataque con mayor ATK al ser atacado.' },
    { name: 'Acid Trap Hole', price: 5000, tier: 'TRAMPA CLÁSICA', desc: 'Disuelve y destruye de inmediato al monstruo atacante o invocado del rival.' },
    { name: 'Dust Tornado', price: 4000, tier: 'TRAMPA CLÁSICA', desc: 'Destruye 1 carta Mágica, Trampa o Equipo del rival.' },
    { name: 'Invisible Wire', price: 3000, tier: 'TRAMPA CLÁSICA', desc: 'Destruye al monstruo enemigo si su ATK es 2000 o menor.' },
    { name: 'Bear Trap', price: 1500, tier: 'TRAMPA CLÁSICA', desc: 'Destruye al monstruo enemigo si su ATK es 1500 o menor.' },
    { name: 'Eatgaboon', price: 1000, tier: 'TRAMPA CLÁSICA', desc: 'Destruye al monstruo enemigo si su ATK es 1000 o menor.' },
    { name: 'Goblin Fan', price: 1200, tier: 'TRAMPA CLÁSICA', desc: 'Niega el ataque enemigo y causa 500 LP de daño directo al rival.' },
    { name: 'Bad Reaction to Simochi', price: 2000, tier: 'TRAMPA CLÁSICA', desc: 'Causa 1000 LP de daño al rival y debilita en 1000 ATK al atacante.' },
    { name: 'Reverse Trap', price: 3500, tier: 'TRAMPA CLÁSICA', desc: 'Invierte el curso del combate otorgando +1000 ATK de sorpresa a tu defensa.' },
    { name: 'Fake Trap', price: 1500, tier: 'TRAMPA CLÁSICA', desc: 'Trampa señuelo que absorbe y niega por completo el ataque enemigo.' }
];

window.getCardMetadata = function(name) {
    if (!name) return { name: '', num: 0, imgUrl: 'https://i.imgur.com/vHqR8Kq.png', type: '-', attr: '-', atk: '-', def: '-', isMonster: false, isSpell: false, isTrap: false, desc: '' };
    let num = 0;
    if (window.CARD_MAPPINGS && window.CARD_MAPPINGS[name]) {
        num = window.CARD_MAPPINGS[name];
    }
    let imgUrl = 'https://i.imgur.com/vHqR8Kq.png';
    let padded = String(num).padStart(3, '0');
    if (num && window.CUSTOM_LOCAL_IMAGES) {
        if (window.CUSTOM_LOCAL_IMAGES[num]) imgUrl = window.CUSTOM_LOCAL_IMAGES[num];
        else if (window.CUSTOM_LOCAL_IMAGES[padded]) imgUrl = window.CUSTOM_LOCAL_IMAGES[padded];
        else if (window.CUSTOM_LOCAL_IMAGES[padded + '.jpg']) imgUrl = window.CUSTOM_LOCAL_IMAGES[padded + '.jpg'];
        else if (window.CUSTOM_LOCAL_IMAGES[padded + '.jpeg']) imgUrl = window.CUSTOM_LOCAL_IMAGES[padded + '.jpeg'];
        else if (window.CUSTOM_LOCAL_IMAGES[padded + '.png']) imgUrl = window.CUSTOM_LOCAL_IMAGES[padded + '.png'];
    }
    
    // Check known special monsters first (Gate Guardian, Sanga, Suijin, Kazejin, and classic field monsters)
    const KNOWN_SPECIAL_MONSTERS = {
        'Gate Guardian': { type: 'Warrior', attr: 'DARK', atk: 3750, def: 3400, desc: 'Guardián del laberinto legendario con 3750 ATK / 3400 DEF. Poder aplastante en combate.' },
        'Sanga of the Thunder': { type: 'Thunder', attr: 'LIGHT', atk: 2600, def: 2200, desc: 'Espíritu ancestral del rayo con 2600 ATK / 2200 DEF.' },
        'Suijin': { type: 'Aqua', attr: 'WATER', atk: 2500, def: 2400, desc: 'Guardián acuático ancestral con 2500 ATK / 2400 DEF.' },
        'Kazejin': { type: 'Spellcaster', attr: 'WIND', atk: 2400, def: 2200, desc: 'Guardián del viento ancestral con 2400 ATK / 2200 DEF.' },
        'One-Eyed White Dragon': { type: 'Dragon', attr: 'WIND', atk: 1300, def: 1000, desc: 'Dragón blanco de combate (ATK 1300 / DEF 1000).' },
        'One-eyed Shield Dragon': { type: 'Dragon', attr: 'WIND', atk: 1300, def: 1000, desc: 'Dragón blanco de combate (ATK 1300 / DEF 1000).' },
        'Kaminarikozou': { type: 'Thunder', attr: 'WIND', atk: 700, def: 600, desc: 'Espíritu eléctrico. ¡Fusiónalo con cualquier Dragón para crear al Dragón Trueno Bicéfalo! (ATK 700 / DEF 600).' },
        'Lala Li-Oon': { type: 'Thunder', attr: 'WIND', atk: 600, def: 600, desc: 'Criatura de nubes de tormenta para fusiones eléctricas (ATK 600 / DEF 600).' },
        'Root Water': { type: 'Fish', attr: 'WATER', atk: 1000, def: 1000, desc: 'Anfibio azul de las profundidades marinas (ATK 1000 / DEF 1000).' },
        'Water Omotics': { type: 'Aqua', attr: 'WATER', atk: 1400, def: 1200, desc: 'Doncella de agua (ATK 1400 / DEF 1200).' },
        'Kagemusha of the Blue Flame': { type: 'Warrior', attr: 'EARTH', atk: 800, def: 400, desc: 'Guerrero sombra de la llama azul (ATK 800 / DEF 400).' },
        'Masaki the Legendary Swordsman': { type: 'Warrior', attr: 'EARTH', atk: 1100, def: 1100, desc: 'Espadachín legendario de mil batallas (ATK 1100 / DEF 1100).' },
        'Stone Armadiller': { type: 'Rock', attr: 'EARTH', atk: 1000, def: 1200, desc: 'Armadillo de piedra impenetrable (ATK 1000 / DEF 1200).' },
        'Sand Stone': { type: 'Rock', attr: 'EARTH', atk: 1300, def: 1600, desc: 'Guardián rocoso del desierto (ATK 1300 / DEF 1600).' },
        'Dancing Elf': { type: 'Fairy', attr: 'WIND', atk: 300, def: 200, desc: 'Hada elemental femenina para fusiones mágicas tempranas (ATK 300 / DEF 200).' },
        'Key Mace': { type: 'Fairy', attr: 'LIGHT', atk: 400, def: 800, desc: 'Pequeña hada bondadosa con maza dorada (ATK 400 / DEF 800).' },
        'Lunar Queen Elzaim': { type: 'Fairy', attr: 'LIGHT', atk: 750, def: 1100, desc: 'Hechicera lunar que bendice el campo (ATK 750 / DEF 1100).' }
    };
    if (KNOWN_SPECIAL_MONSTERS[name]) {
        let sp = KNOWN_SPECIAL_MONSTERS[name];
        return {
            name: name, num: num, imgUrl: imgUrl,
            type: sp.type, attr: sp.attr,
            atk: sp.atk, def: sp.def,
            isMonster: true, isSpell: false, isTrap: false,
            desc: sp.desc
        };
    }
    
    // Check CARDS_DATA array directly first as authoritative source
    if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
        let normName = String(name).toLowerCase().trim();
        let cd = window.CARDS_DATA.find(x => x && (x.name === name || (x.name && x.name.toLowerCase().trim() === normName)));
        if (cd) {
            let cardImg = cd.image || imgUrl;
            let cardNum = cd.id || num;
            let cdKind = String(cd.kind || '').toUpperCase();
            let isST = cdKind === 'SPELL' || cdKind === 'TRAP' || cdKind === 'EQUIP' || cdKind === 'FIELD' || (cd.type && (String(cd.type).toLowerCase().includes('equip') || String(cd.type).toLowerCase().includes('field')));
            if (!isST && (cdKind === 'MONSTER' || cdKind === 'FUSION' || cdKind === 'LINK' || (cd.atk !== undefined && cd.atk !== '-'))) {
                return {
                    name: cd.name, num: cardNum, imgUrl: cardImg,
                    type: cd.type || 'Monstruo', attr: cd.attr || 'TIERRA',
                    atk: (cd.atk !== undefined && cd.atk !== '-') ? cd.atk : 0,
                    def: (cd.def !== undefined && cd.def !== '-') ? cd.def : 0,
                    isMonster: true, isSpell: false, isTrap: false,
                    desc: cd.text || cd.desc || ''
                };
            } else {
                let isTrap = cdKind === 'TRAP' || String(cd.type).toUpperCase() === 'TRAP';
                return {
                    name: cd.name, num: cardNum, imgUrl: cardImg,
                    type: cd.type || cd.kind || (isTrap ? 'TRAP' : 'MAGIA'), attr: '-',
                    atk: '-', def: '-',
                    isMonster: false, isSpell: !isTrap, isTrap: isTrap,
                    desc: cd.text || cd.desc || ''
                };
            }
        }
    }
    // Check FMR_CARD_META only for actual monsters
    if (window.FMR_CARD_META && window.FMR_CARD_META[name]) {
        let m = window.FMR_CARD_META[name];
        let mKind = String(m.kind || '').toUpperCase();
        if (mKind !== 'SPELL' && mKind !== 'TRAP' && mKind !== 'EQUIP' && mKind !== 'FIELD') {
            return {
                name: m.name, num: num, imgUrl: imgUrl,
                type: m.type || 'Monstruo', attr: m.attr || 'TIERRA',
                atk: m.atk !== undefined ? m.atk : 0,
                def: m.def !== undefined ? m.def : 0,
                isMonster: true, isSpell: false, isTrap: false,
                desc: m.desc || m.text || ''
            };
        }
    }
    // Check FMR_ST_POOL_V1
    if (window.FMR_ST_POOL_V1) {
        let st = window.FMR_ST_POOL_V1.find(x => x && x.name === name);
        if (st) {
            return {
                name: st.name, num: num, imgUrl: imgUrl,
                type: st.kind || 'MAGIA', attr: '-',
                atk: '-', def: '-',
                isMonster: false, isSpell: st.kind === 'SPELL', isTrap: st.kind === 'TRAP',
                desc: st.text || st.desc || ''
            };
        }
    }
    // Check DB
    if (typeof DB !== 'undefined' && Array.isArray(DB)) {
        let row = DB.find(x => x && x[0] === name);
        if (row) {
            return {
                name: row[0], num: num, imgUrl: imgUrl,
                type: row[2] || 'Monstruo', attr: row[3] || 'TIERRA',
                atk: row[4] !== undefined ? row[4] : 0,
                def: row[5] !== undefined ? row[5] : 0,
                isMonster: true, isSpell: false, isTrap: false,
                desc: ''
            };
        }
    }
    // Check STDB
    if (typeof STDB !== 'undefined' && Array.isArray(STDB)) {
        let st = STDB.find(x => x && x.name === name);
        if (st) {
            return {
                name: st.name, num: num, imgUrl: imgUrl,
                type: st.kind || 'MAGIA', attr: '-',
                atk: '-', def: '-',
                isMonster: false, isSpell: st.kind === 'SPELL', isTrap: st.kind === 'TRAP',
                desc: st.text || st.desc || ''
            };
        }
    }
    return {
        name: name, num: num, imgUrl: imgUrl,
        type: 'Carta', attr: '-', atk: '-', def: '-',
        isMonster: false, isSpell: false, isTrap: false, desc: ''
    };
};

window.PROGRAMMED_ST_NAMES = new Set([
  // Equipos
  'axe of despair', 'black pendant', 'horn of the unicorn', 'dragon treasure', 'garra del dragón', 'garra del dragon',
  'malevolent nuzzler', 'sword of dark destruction', 'dark energy', 'invigoration',
  'electro-whip', 'cyber shield', 'mystical moon', 'silver bow and arrow',
  'book of secret arts', "elf's light", 'elfs light', 'beast fangs', 'steel shell', 'vile germs',
  'kunai with chain', 'fusion weapon', 'united we stand', 'legendary sword',
  'laser cannon armor', 'insect armor with laser cannon', 'horn of light',
  'machine conversion factory', 'raise body heat', 'follow wind', 'power of kaishin',
  'violet crystal', 'shine palace', 'salamandra', 'mage power', 'poder del mago',
  'crush card', 'tyrant wing', 'megamorph', 'megamorfo',

  // Magias normales, rápidas y continuas
  'pot of greed', 'graceful charity', 'renace al monstruo', 'monster reborn', 'fissure',
  'stop defense', 'dragon capture jar', 'dian keto the cure master', 'soul of the pure',
  "goblin's secret remedy", 'goblins secret remedy', 'red medicine', 'mooyan curry', 'ookazi', 'hinotama',
  'sparks', 'final flame', 'tremendous fire', 'swords of revealing light',
  'swords of concealing light', 'espadas de luz reveladora', 'espadas de luz ocultadora',
  'raigeki', 'dark hole', "harpie's feather duster", 'harpies feather duster', 'heavy storm', 'tormenta pesada',
  'mystical space typhoon', 'mystical space typhonne', 'change of heart', 'scapegoat', 'limiter removal',
  'cybernetic zone', 'cybernetic fusion support', 'card of demise',

  // Campos
  'mountain', 'montaña', 'montana', 'yami', 'umi', 'forest', 'bosque', 'wasteland', 'yermo',
  'sogen', 'pueblo secreto de los magos', 'spellcaster village', 'a legendary ocean',

  // Trampas
  'mirror force', 'magic cylinder', 'negate attack', 'sakuretsu armor', 'waboku',
  'widespread ruin', 'trap hole', 'acid trap hole', 'torrential tribute', 'dust tornado',
  'threatening roar', 'crush card virus', 'eatgaboon', 'bear trap', 'invisible wire',
  'goblin fan', 'bad reaction to simochi', 'reverse trap', 'fake trap', 'javalina',
  'llamado de la tumba', 'toon defense', 'curse of anubis', 'statue of the wicked',
  'ring of defense', 'soul rope', 'obliterate!!!', 'destiny board', 'sentence of doom', 'muko'
]);

window.isCardProgrammed = function(cardOrName) {
  if (!cardOrName) return false;
  var c = null;
  var name = '';
  if (typeof cardOrName === 'string') {
    name = cardOrName.trim().toLowerCase();
    var dict = typeof window.getGlobalCardDict === 'function' ? window.getGlobalCardDict() : null;
    if (dict && (dict[cardOrName] || dict[name])) {
      c = dict[cardOrName] || dict[name];
    } else if (typeof window.getCardMetadata === 'function') {
      c = window.getCardMetadata(cardOrName);
    } else if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
      c = window.CARDS_DATA.find(function(x) { return x && (x.name === cardOrName || (x.name && x.name.toLowerCase().trim() === name)); });
    }
  } else {
    c = cardOrName;
    name = (c.name || c[0] || '').trim().toLowerCase();
  }
  if (!c) {
    return window.PROGRAMMED_ST_NAMES.has(name);
  }
  var kind = String(c.kind || c.type || '').toUpperCase();
  if (kind === 'MONSTER' || kind === 'FUSION' || kind === 'LINK' || c.isMonster || (c.atk !== undefined && c.atk !== '-' && kind !== 'SPELL' && kind !== 'TRAP' && kind !== 'EQUIP')) {
    return true;
  }
  if (window.PROGRAMMED_ST_NAMES.has(name)) return true;
  var val = String(c.value || '').toUpperCase();
  if (val && (val.startsWith('FIELD_') || val.startsWith('HEAL_') || val.startsWith('BURN_') || val.startsWith('EQUIP_'))) return true;
  return false;
};

window.isFieldSpell = function(c) {
  if (!c) return false;
  var name = (c.name || c[0] || '').trim().toLowerCase();
  var val = (c.value || '').toUpperCase();
  var type = String(c.type || c.kind || '').toLowerCase();
  if (type.includes('field') || type.includes('campo')) return true;
  if (val.startsWith('FIELD_')) return true;
  var fieldNames = [
    'mountain', 'montaña', 'montana', 'yami', 'umi', 'forest', 'bosque',
    'wasteland', 'yermo', 'sogen', 'pueblo secreto de los magos',
    'spellcaster village', 'a legendary ocean'
  ];
  return fieldNames.includes(name);
};


window.cleanSaveCollection = function(s) {
  if (!s) return s;
  var modified = false;
  if (s.collection && typeof s.collection === 'object') {
    var keys = Object.keys(s.collection);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!window.isCardProgrammed(k)) {
        delete s.collection[k];
        modified = true;
      }
    }
  }
  var defaultFillers = ['Celtic Guardian', 'Silver Fang', 'Mammoth Graveyard', 'Feral Imp', 'Winged Dragon, Guardian of the Fortress #1'];
  function sanitizeDeck(deckArr) {
    if (!Array.isArray(deckArr)) return deckArr;
    var filtered = deckArr.filter(function(cardName) {
      if (!window.isCardProgrammed(cardName)) {
        modified = true;
        return false;
      }
      return true;
    });
    var fIdx = 0;
    while (filtered.length < 40) {
      filtered.push(defaultFillers[fIdx % defaultFillers.length]);
      fIdx++;
      modified = true;
    }
    return filtered;
  }
  if (Array.isArray(s.deck)) {
    s.deck = sanitizeDeck(s.deck);
  }
  if (s.decks && typeof s.decks === 'object') {
    for (var dName in s.decks) {
      if (Array.isArray(s.decks[dName])) {
        s.decks[dName] = sanitizeDeck(s.decks[dName]);
      }
    }
  }
  if (modified) {
    if (typeof window.persistUserSave === 'function') {
      window.persistUserSave(s);
    } else {
      var curSaveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
      var raw = JSON.stringify(s);
      if (typeof origSet === 'function') {
        origSet(curSaveKey, raw);
        origSet('FMR_REBORN_STORY_V3000', raw);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(curSaveKey, raw);
        localStorage.setItem('FMR_REBORN_STORY_V3000', raw);
      }
      if (window.nativeAPI && window.nativeAPI.setMemorySave) window.nativeAPI.setMemorySave(s);
    }
  }
  return s;
};


function findLowestMonsterInDeck(deck, cardDict) {
    let lowestIdx = -1;
    let lowestAtk = Infinity;
    let lowestName = null;
    
    for (let i = 0; i < deck.length; i++) {
        let cardName = deck[i];
        let meta = (cardDict && cardDict[cardName]) || window.getCardMetadata(cardName);
        if (meta && (meta.isMonster || (meta.atk !== undefined && meta.atk !== '-'))) {
            let a = parseInt(meta.atk, 10);
            if (!isNaN(a) && a < lowestAtk) {
                lowestAtk = a;
                lowestIdx = i;
                lowestName = cardName;
            }
        }
    }
    if (lowestIdx >= 0) {
        return { index: lowestIdx, name: lowestName, atk: lowestAtk };
    }
    return { index: Math.max(0, deck.length - 1), name: deck[deck.length - 1] || 'Carta', atk: 0 };
}

window.showCustomDuelRewardChoice = function(oppId, rank, gain, onComplete) {
    let existingRewardOverlay = document.getElementById('custom-reward-choice-overlay');
    if (existingRewardOverlay) existingRewardOverlay.remove();

    let saveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
    let sStr = origGet(saveKey) || origGet('FMR_REBORN_STORY_V3000');
    let s = sStr ? JSON.parse(sStr) : (window.nativeAPI && window.nativeAPI.loadGame ? window.nativeAPI.loadGame() : null);
    if (!s) {
        if (typeof onComplete === 'function') onComplete();
        return;
    }
    s.collection = s.collection || {};
    s.deck = s.deck || [];
    if (typeof window.cleanSaveCollection === 'function') window.cleanSaveCollection(s);
    
    let oppDeck = window.CHARACTER_DECKS && window.CHARACTER_DECKS[oppId];
    let oppDisplayName = (oppDeck && oppDeck.name) || OPPONENT_NAMES[oppId] || oppId.toUpperCase();
    let cardPool = [];
    if (oppDeck && Array.isArray(oppDeck.cards)) {
        cardPool = [...new Set(oppDeck.cards)];
    }
    const ELIMINATED_UNKNOWN_ST = new Set([
      'Spiritual Energy Settle Machine', 'Orb of Yasaka', 'Mirror of Yata', 'Cyclon Laser', 'Cestus of Dagla',
      'Left Arm Offering', 'Jam Breeding Machine', 'Dark Sanctuary', 'Spirit Message "A"', 'Spirit Message "I"',
      'Spirit Message "L"', 'Spirit Message "N"', 'Dark Spirit\'s Mastery', 'The Dark Door', 'Card of Safe Return',
      'Multiplication of Ants', 'Insect Imitation', 'Insect Neglect', 'Insect Barrier', 'Jade Insect Whistle',
      'Cybernetic Fusion Support', 'Cybernetic Zone', 'Amazoness Fighting Spirit', 'Amazoness Heirloom',
      'Amazoness Spellcaster', 'Triangle Ecstasy Spark', 'Chaos Greed', 'The Claw of Hermos', 'The Fang of Critias',
      'Contract with Exodia', 'Hydro Pressure Cannon', 'Rage of Kairyu-Shin', 'Fury of Kairyu-Shin', 'Steel Shell',
      'Apophis the Swamp Deity', 'Embodiment of Apophis', 'Exchange of Despair and Hope', 'Exchange of the Spirit',
      'Gravekeeper\'s Trap', 'Muko', 'Curse of Anubis', 'Statue of the Wicked', 'Sentence of Doom', 'Destiny Board',
      'Dark Spirit of the Silent', 'Zoma the Spirit', 'Coffin Seller', 'Dark Spell Regeneration', 'Fiend\'s Hand Mirror',
      'Hidden Soldiers', 'Jam Defender', 'Metal Reflect Slime', 'Relieve Monster', 'Rope of Life', 'Legacy of Yata-Garasu',
      'Blast Held by a Tribute', 'Blast Held by Destiny', 'Abyss-strom', 'Aegis of the Ocean Dragon Lord', 'Shattered Axe',
      'Spiritual Water Art - Aoi', 'Tornado Wall', 'Amazoness Archers', 'Amazoness Willpower', 'Hysteric Party',
      'Trap Hole of Spikes', 'Toon Defense', 'Soul Rope', 'Obliterate!!!', 'Tyrant Wing', 'Card of Demise', 'Ring of Defense',
      'Shrink', 'Soul Exchange', 'The Flute of Summoning Dragon', 'White Dragon Ritual', 'Dragon\'s Rage',
      'Interdimensional Matter Transporter', 'Shadow Spell', 'Dark Magic Curtain', 'Fiend\'s Sanctuary', 'Magic Formula',
      'Thousand Knives', 'Black Illusion', 'Dark Renewal', 'Painful Choice', 'Remove Trap', 'A Legendary Ocean',
      'Dark-Piercing Light', 'Salvage', 'Umi', 'Drop Off', 'Fairy Box', 'Gamble', 'Graverobber', 'Kunai with Chain',
      'Magical Arm Shield', 'Metalmorph', 'Skull Dice', 'Jar of Greed', 'Toon Table of Contents', 'Toon World',
      'Ultimate Offering', 'DNA Surgery', 'Cost Down', 'Shine Palace', 'Snatch Steal', 'Card of Sanctity', 'Temple of the Kings'
    ]);
    window.ELIMINATED_UNKNOWN_ST = ELIMINATED_UNKNOWN_ST;
    if (cardPool.length > 0) {
        cardPool = cardPool.filter(c => !ELIMINATED_UNKNOWN_ST.has(c) && (typeof window.isCardProgrammed !== 'function' || window.isCardProgrammed(c)));
    }
    if (cardPool.length === 0) {
        cardPool = ['Dark Magician', 'Blue-Eyes White Dragon', 'Summoned Skull', 'Red-Eyes Black Dragon', 'Celtic Guardian'];
    }

    const NEW_REWARD_TRAPS = [
        'Eatgaboon', 'Bear Trap', 'Invisible Wire', 'Acid Trap Hole',
        'Widespread Ruin', 'Goblin Fan', 'Bad Reaction to Simochi',
        'Reverse Trap', 'Fake Trap'
    ];
    window.NEW_REWARD_TRAPS = NEW_REWARD_TRAPS;
    NEW_REWARD_TRAPS.forEach(t => {
        if (!cardPool.includes(t)) cardPool.push(t);
    });

    const NEW_REWARD_MONSTERS = [
        'Seiyaryu', 'Three-legged Zombies', 'Zera The Mant', 'Flying Penguin',
        'Millennium Shield', "Fairy's Gift", 'Black Luster Soldier', "Fiend's Mirror",
        'Labyrinth Wall', 'Jirai Gumo', 'Shadow Ghoul', 'Wall Shadow',
        'Labyrinth Tank', 'Sanga of the Thunder', 'Kazejin', 'Suijin',
        'Dungeon Worm', 'Monster Tamer', 'Ryu-kishin Powered', 'Swordstalker',
        'La Jinn the Mystical Genie', 'Toon Alligator', 'Rude Kaiser', 'Parrot Dragon',
        'Dark Rabbit', 'Bickuribox', "Harpie's Pet Dragon", 'Mystic Lamp',
        'Pendulum Machine', 'Giltia the D. Knight', 'Launcher Spider', 'Zone Eater',
        'Aqua Dragon', 'Sea King Dragon', 'Turu-Purun', 'Guardian of the Sea',
        'Aqua Snake', 'Giant Red Seasnake', 'Spike Seadra', '30,000-Year White Turtle',
        'Kappa Avenger', 'Kanikabuto', 'Zarigun', 'Millennium Golem',
        'Destroyer Golem', 'Barrel Rock', 'Minomushi Warrior', 'Stone Ghost',
        'Kaminari Attack', 'Tripwire Beast', 'Bolt Escargot', 'Bolt Penguin',
        'The Immortal of Thunder', 'Electric Snake', 'Wing Eagle', 'Punished Eagle',
        'Performance of Sword', 'Hungry Burger', 'Sengenjin', 'Skull Guardian',
        'Tri-Horned Dragon', 'Serpent Night Dragon', 'Skull Knight', 'Cosmo Queen',
        'Meteor Dragon', 'Firewing Pegasus', 'Psycho-Puppet', 'Garma Sword', 'Javelin Beetle', 'Fortress Whale', 'Dokurorider', 'Mask of Shine & Dark',
        'Summoned Skull', 'Meteor B. Dragon'
    ];
    window.NEW_REWARD_MONSTERS = NEW_REWARD_MONSTERS;
    NEW_REWARD_MONSTERS.forEach(m => {
        if (!cardPool.includes(m)) cardPool.push(m);
    });

    let normalizedOpp = String(oppId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedOpp === 'joey' || normalizedOpp === 'pegasus') {
        if (!cardPool.includes('Summoned Skull')) cardPool.push('Summoned Skull');
        if (!cardPool.includes('Meteor B. Dragon')) cardPool.push('Meteor B. Dragon');
    }

    // REGLAS ESPECIALES DE RECOMPENSAS:
    // 1. Blue-Eyes Ultimate Dragon y Gate Guardian SOLO son recompensas de rango muy raro para Seto Kaiba y Yugi.
    // 2. Zoa y Metalzoa también son recompensas muy raras.
    const ULTRA_RARE_BOSS_CARDS = ['Blue-Eyes Ultimate Dragon', 'Gate Guardian'];
    const VERY_RARE_CARDS = ['Zoa', 'Metalzoa'];

    // Asegurar que NO aparezcan en el cardPool general de otros duelistas
    cardPool = cardPool.filter(c => !ULTRA_RARE_BOSS_CARDS.includes(c) && !VERY_RARE_CARDS.includes(c));

    // Shuffle pool and select 3 cards
    let shuffled = [...cardPool].sort(() => 0.5 - Math.random());
    let candidates = shuffled.filter(c => (s.collection[c] || 0) < 3);
    if (candidates.length < 3) candidates = shuffled;
    
    let selected3 = candidates.slice(0, 3);
    while (selected3.length < 3 && cardPool.length > 0) {
        let rc = cardPool[Math.floor(Math.random() * cardPool.length)];
        if (!selected3.includes(rc) || selected3.length === cardPool.length) {
            selected3.push(rc);
        }
    }

    // Asegurar alta probabilidad de ofrecer los nuevos monstruos y trampas clásicas como recompensas
    if (Math.random() < 0.85 && selected3.length > 0) {
        let unownedMonsters = NEW_REWARD_MONSTERS.filter(m => (s.collection[m] || 0) < 3);
        let unownedTraps = NEW_REWARD_TRAPS.filter(t => (s.collection[t] || 0) < 3);
        let poolFeatured = (unownedMonsters.length > 0 && Math.random() < 0.6) ? unownedMonsters : (unownedTraps.length > 0 ? unownedTraps : NEW_REWARD_MONSTERS);
        let bonusReward = poolFeatured[Math.floor(Math.random() * poolFeatured.length)];
        if (bonusReward && !selected3.includes(bonusReward)) {
            selected3[selected3.length - 1] = bonusReward;
        }
    }

    // APLICACIÓN DE REGLAS DE RECOMPENSAS MUY RARAS:
    let rankStr = String(rank || '').toUpperCase();
    let isHighRank = rankStr.includes('S') || rankStr.includes('A');
    let isKaibaOrYugi = (normalizedOpp === 'kaiba' || normalizedOpp === 'seto' || normalizedOpp === 'yugi' || normalizedOpp === 'atem');

    // Blue-Eyes Ultimate Dragon y Gate Guardian: solo Seto Kaiba y Yugi, rango S o A, probabilidad muy rara (~5%)
    if (isKaibaOrYugi && isHighRank && Math.random() < 0.06 && selected3.length > 0) {
        let unownedBoss = ULTRA_RARE_BOSS_CARDS.filter(c => (s.collection[c] || 0) < 3);
        let bossChoice = unownedBoss.length > 0
            ? unownedBoss[Math.floor(Math.random() * unownedBoss.length)]
            : ULTRA_RARE_BOSS_CARDS[Math.floor(Math.random() * ULTRA_RARE_BOSS_CARDS.length)];
        if (bossChoice && !selected3.includes(bossChoice)) {
            selected3[0] = bossChoice; // Posición de honor para la recompensa suprema
        }
    }

    // Zoa y Metalzoa: recompensas muy raras (~4% de probabilidad en duelos de rango S o A)
    if (isHighRank && Math.random() < 0.05 && selected3.length > 0) {
        let unownedVR = VERY_RARE_CARDS.filter(c => (s.collection[c] || 0) < 3);
        let vrChoice = unownedVR.length > 0
            ? unownedVR[Math.floor(Math.random() * unownedVR.length)]
            : VERY_RARE_CARDS[Math.floor(Math.random() * VERY_RARE_CARDS.length)];
        if (vrChoice && !selected3.includes(vrChoice)) {
            selected3[selected3.length - 1] = vrChoice;
        }
    }

    // RECOMPENSAS DESTACADAS DE JOEY Y PEGASUS: Summoned Skull y Meteor B. Dragon (3500 ATK)
    if ((normalizedOpp === 'joey' || normalizedOpp === 'pegasus') && selected3.length > 0) {
        let jpPool = ['Summoned Skull', 'Meteor B. Dragon'];
        let unownedJP = jpPool.filter(c => (s.collection[c] || 0) < 3);
        let jpChoice = unownedJP.length > 0
            ? unownedJP[Math.floor(Math.random() * unownedJP.length)]
            : jpPool[Math.floor(Math.random() * jpPool.length)];
        let jpChance = isHighRank ? 0.85 : 0.55;
        if (Math.random() < jpChance && jpChoice && !selected3.includes(jpChoice)) {
            selected3[selected3.length - 1] = jpChoice;
        }
    }
    
    // Create UI Overlay
    let overlay = document.createElement('div');
    overlay.id = 'custom-reward-choice-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: radial-gradient(circle at center, #1b1c24 0%, #08080a 100%); z-index:99999999; display:flex; flex-direction:column; align-items:center; justify-content:center; box-sizing:border-box; padding:20px; font-family:"Segoe UI", Arial, sans-serif; overflow-y:auto;';
    
    let header = document.createElement('div');
    header.style.cssText = 'text-align:center; margin-bottom: 20px;';
    header.innerHTML = `
        <div style="font-family:VT323, monospace; color:#ffcc00; font-size:36px; text-shadow:3px 3px 0 #000; letter-spacing:2px;">¡VICTORIA EN DUELO!</div>
        <div style="color:#64b5f6; font-size:18px; font-weight:bold; margin-top:5px; text-shadow:1px 1px 0 #000;">HAS DERROTADO A: ${oppDisplayName.toUpperCase()}</div>
        <div style="color:#81c784; font-size:16px; margin-top:6px; font-weight:bold;">RANGO: <span style="color:#ffd700; font-size:22px;">${rank}</span> · +${gain} PM RECUPERADOS</div>
        <div style="color:#e0e0e0; font-size:15px; margin-top:10px;">Selecciona 1 de las siguientes 3 cartas de ${oppDisplayName} para quedártela e integrarla a tu Deck:</div>
    `;
    overlay.appendChild(header);
    
    let cardsContainer = document.createElement('div');
    cardsContainer.style.cssText = 'display:flex; gap:25px; justify-content:center; align-items:stretch; flex-wrap:wrap; max-width:1100px; margin-bottom:20px;';
    
    selected3.forEach(cardName => {
        let info = window.getCardMetadata(cardName);
        let cardColor = info.isMonster ? '#d4af37' : (info.isTrap ? '#ff80ab' : '#4caf50');
        let ownCount = s.collection[cardName] || 0;
        
        let cardBox = document.createElement('div');
        cardBox.style.cssText = 'background: rgba(22, 22, 32, 0.95); border: 2px solid #a67c00; border-radius: 10px; padding: 16px; width: 240px; display:flex; flex-direction:column; align-items:center; box-shadow: 0 8px 25px rgba(0,0,0,0.8); transition: transform 0.2s, box-shadow 0.2s; box-sizing:border-box;';
        cardBox.onmouseover = () => {
            cardBox.style.transform = 'translateY(-8px)';
            cardBox.style.boxShadow = '0 0 25px #ffd700';
            window.playHoverSound && window.playHoverSound();
        };
        cardBox.onmouseout = () => {
            cardBox.style.transform = 'translateY(0)';
            cardBox.style.boxShadow = '0 8px 25px rgba(0,0,0,0.8)';
        };
        
        let img = document.createElement('img');
        img.src = info.imgUrl;
        img.style.cssText = 'width:200px; height:290px; object-fit:cover; object-position:top center; border-radius:6px; border:2px solid #555; background:#000;';
        cardBox.appendChild(img);
        
        let nameEl = document.createElement('div');
        nameEl.style.cssText = `font-weight:bold; font-size:16px; color:${cardColor}; margin-top:12px; text-align:center; min-height:40px; display:flex; align-items:center; justify-content:center; line-height:1.2;`;
        nameEl.textContent = info.name;
        cardBox.appendChild(nameEl);
        
        let statsEl = document.createElement('div');
        statsEl.style.cssText = 'font-size:13px; color:#bbb; text-align:center; margin: 6px 0; min-height:36px;';
        if (info.isMonster) {
            statsEl.innerHTML = `<span style="color:#aaa;">[${info.type} · ${info.attr}]</span><br><span style="color:#ff5252; font-weight:bold;">⚔ ATK ${info.atk}</span> / <span style="color:#2196f3; font-weight:bold;">🛡 DEF ${info.def}</span>`;
        } else {
            statsEl.innerHTML = `<span style="color:#aaa;">[${info.type}]</span><br><span style="color:#ffe082; font-size:12px;">${info.desc ? info.desc.slice(0, 50) + (info.desc.length > 50 ? '...' : '') : 'Magia/Trampa'}</span>`;
        }
        cardBox.appendChild(statsEl);
        
        let badge = document.createElement('div');
        badge.style.cssText = 'font-size:12px; color:#aaa; background:#111; padding:4px 10px; border-radius:12px; border:1px solid #444; margin-bottom:12px;';
        badge.innerHTML = `Posees: <b style="color:#fff;">${ownCount}</b>`;
        cardBox.appendChild(badge);
        
        let chooseBtn = document.createElement('button');
        chooseBtn.textContent = '🎁 ELEGIR ESTA CARTA';
        chooseBtn.style.cssText = 'background: linear-gradient(180deg, #ffd700 0%, #b8860b 100%); color:#000; border:2px solid #fff; border-radius:6px; padding:10px 14px; font-weight:900; font-size:15px; cursor:pointer; width:100%; box-shadow:0 4px 10px rgba(0,0,0,0.5); font-family:VT323, monospace;';
        chooseBtn.onclick = () => {
            // Instantly disable all buttons so only exactly 1 card can be chosen
            overlay.querySelectorAll('button').forEach(b => {
                b.disabled = true;
                b.style.opacity = '0.5';
                b.style.cursor = 'default';
                b.onclick = null;
            });
            window.playViolinClick && window.playViolinClick();
            
            let curSaveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
            let curStr = origGet(curSaveKey) || origGet('FMR_REBORN_STORY_V3000');
            let freshSave = curStr ? JSON.parse(curStr) : s;
            freshSave.collection = freshSave.collection || {};
            freshSave.collection[cardName] = (freshSave.collection[cardName] || 0) + 1;
            
            if (window.persistUserSave) {
                window.persistUserSave(freshSave);
            } else {
                origSet(curSaveKey, JSON.stringify(freshSave));
                origSet('FMR_REBORN_STORY_V3000', JSON.stringify(freshSave));
                if (window.nativeAPI && window.nativeAPI.setMemorySave) {
                    window.nativeAPI.setMemorySave(freshSave);
                }
            }
            
            alert(`¡Has obtenido "${cardName}"!\n\n📦 La carta ha sido enviada directamente a tu BANCA / BAÚL DE RESERVA.\n\nPuedes verla y equiparla en cualquiera de tus decks abriendo el Dashboard del Deck.`);
            
            overlay.remove();
            if (typeof onComplete === 'function') onComplete();
        };
        cardBox.appendChild(chooseBtn);
        
        cardsContainer.appendChild(cardBox);
    });
    
    overlay.appendChild(cardsContainer);
    document.body.appendChild(overlay);
};

window.customShowShop = function() {
    let sStr = origGet('FMR_SAVE_' + window.activeAccount);
    let s = sStr ? JSON.parse(sStr) : (window.nativeAPI && window.nativeAPI.loadGame ? window.nativeAPI.loadGame() : null);
    if (!s) return;
    s.collection = s.collection || {};
    if (typeof window.cleanSaveCollection === 'function') window.cleanSaveCollection(s);
    s.deck = s.deck || [];
    s.decks = s.decks || {};
    if (Object.keys(s.decks).length === 0) {
        s.decks['Deck 1'] = [...s.deck];
    }
    s.activeDeck = s.activeDeck || Object.keys(s.decks)[0] || 'Deck 1';
    if (s.decks[s.activeDeck]) {
        s.deck = [...s.decks[s.activeDeck]];
    }
    
    let existingOverlay = document.getElementById('custom-shop-dashboard');
    if (existingOverlay) existingOverlay.remove();
    
    let overlay = document.createElement('div');
    overlay.id = 'custom-shop-dashboard';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:#121214; z-index:9999999; display:flex; flex-direction:row; padding:20px; box-sizing:border-box; color:#fff; font-family:"Segoe UI", Arial, sans-serif;';
    
    // LEFT SIDEBAR for Preview
    let leftSide = document.createElement('div');
    leftSide.id = 'shop-left-preview';
    leftSide.style.cssText = 'width: 320px; display:flex; flex-direction:column; margin-right: 20px; border-right: 2px solid #333; padding-right: 20px; flex-shrink: 0;';
    
    let previewImgWrap = document.createElement('div');
    previewImgWrap.id = 'preview-img-wrap';
    previewImgWrap.style.cssText = 'width:100%; height: 460px; border: 3px solid #ffd700; border-radius: 8px; background: #000; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);';
    
    let previewImg = document.createElement('img');
    previewImg.src = 'https://i.imgur.com/vHqR8Kq.png';
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:contain; background:#000;';
    previewImgWrap.appendChild(previewImg);
    
    let previewText = document.createElement('div');
    previewText.id = 'preview-text-box';
    previewText.style.cssText = 'margin-top: 15px; background: #1c1c24; padding: 15px; border-radius: 6px; border: 1px solid #444; min-height: 150px;';
    previewText.innerHTML = '<i>Pasa el ratón sobre una carta para ver sus detalles, costo y poder.</i>';
    
    leftSide.appendChild(previewImgWrap);
    leftSide.appendChild(previewText);
    overlay.appendChild(leftSide);
    
    // RIGHT SIDE (MAIN SHOP TABLE)
    let rightSide = document.createElement('div');
    rightSide.style.cssText = 'flex: 1; display:flex; flex-direction:column; overflow:hidden;';
    
    let header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #ffd700; padding-bottom: 12px; margin-bottom: 12px; flex-wrap:wrap; gap:10px;';
    header.innerHTML = `
        <div>
            <div style="font-family:VT323, monospace; color:#ffcc00; font-size: 26px; text-shadow: 2px 2px 0 #000; letter-spacing:1px;">TIENDA DE MEMORIAS · CARTAS PODEROSAS</div>
            <div style="color:#aaa; font-size:12px;">Cartas de élite para ayudarte a vencer a los rivales más desafiantes</div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
            <button id="btn-shop-subscription" style="background:linear-gradient(180deg, #ffd700 0%, #b8860b 100%); color:#000; border:2px solid #fff; padding:7px 16px; border-radius:6px; cursor:pointer; font-weight:900; font-family:VT323, monospace; font-size:16px; box-shadow:0 0 10px rgba(255,215,0,0.4); display:flex; align-items:center; gap:6px;">
                <span>⭐</span><span>SUSCRIPCIÓN (6 MESES) · $10</span>
            </button>
            <div id="shop-pm-balance" style="background:#2b2200; border:2px solid #ffd700; color:#ffd700; padding:8px 16px; border-radius:6px; font-weight:bold; font-size:16px; text-shadow:1px 1px 0 #000;">
                💰 ${s.pm || 0} PM
            </div>
            <div id="shop-deck-count" style="background:#222; border:1px solid #555; padding:8px 16px; border-radius:6px; font-weight:bold; font-size:14px;">
                DECK: <span style="color:${s.deck.length === 40 ? '#4caf50' : '#f44336'}">${s.deck.length}</span>/40
            </div>
            <button id="btn-exit-shop" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:9px 18px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:VT323, monospace; font-size:16px;">VOLVER</button>
        </div>
    `;
    rightSide.appendChild(header);

    let btnSub = header.querySelector('#btn-shop-subscription');
    if (btnSub) {
        btnSub.onclick = () => {
            if (window.playViolinClick) window.playViolinClick();
            if (window.showSubscriptionPurchaseModal) window.showSubscriptionPurchaseModal(false);
        };
    }
    
    let filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex; gap:10px; margin-bottom: 12px; align-items:center;';
    filterBar.innerHTML = `
        <input type="text" id="shop-search" placeholder="Buscar por nombre..." autocomplete="off" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #555; background: #222; color: #fff; font-family:'Segoe UI'; width: 240px; font-size: 14px;">
        <select id="shop-filter-type" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; font-size: 14px;">
            <option value="">Todas las cartas</option>
            <option value="MONSTER">Solo Monstruos</option>
            <option value="SPELL">Todas las Magias</option>
            <option value="SPELL_NORMAL">Magias Normales</option>
            <option value="SPELL_FIELD">Magias de Campo</option>
            <option value="SPELL_EQUIP">Magias de Equipo</option>
            <option value="TRAP">Solo Trampas</option>
        </select>
    `;
    rightSide.appendChild(filterBar);
    
    let tableWrap = document.createElement('div');
    tableWrap.style.cssText = 'flex: 1; overflow-y: auto; background: #1a1a20; border: 1px solid #444; border-radius: 8px; box-shadow: inset 0 0 10px #000;';
    
    let table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; text-align: left;';
    table.innerHTML = `
        <thead style="background: #252530; position: sticky; top: 0; z-index: 10;">
            <tr>
                <th style="padding: 10px 12px; border-bottom: 2px solid #ffd700; color:#ffd700; width:55px;">N°</th>
                <th style="padding: 10px 12px; border-bottom: 2px solid #ffd700; color:#ffd700;">Carta</th>
                <th style="padding: 10px 12px; border-bottom: 2px solid #ffd700; color:#ffd700;">Tipo</th>
                <th style="padding: 10px 12px; border-bottom: 2px solid #ffd700; color:#ffd700;">ATK / DEF / Efecto</th>
                <th style="padding: 10px 12px; border-bottom: 2px solid #ffd700; color:#ffd700; text-align:center;">Precio</th>
                <th style="padding: 10px 12px; border-bottom: 2px solid #ffd700; color:#ffd700; text-align:center;">Posees</th>
                <th style="padding: 10px 12px; border-bottom: 2px solid #ffd700; color:#ffd700; text-align:center;">En Deck</th>
                <th style="padding: 10px 12px; border-bottom: 2px solid #ffd700; color:#ffd700; text-align:center;">Acciones</th>
            </tr>
        </thead>
        <tbody id="shop-tbody"></tbody>
    `;
    tableWrap.appendChild(table);
    rightSide.appendChild(tableWrap);
    
    overlay.appendChild(rightSide);
    document.body.appendChild(overlay);
    
    let tbody = document.getElementById('shop-tbody');
    let searchInput = document.getElementById('shop-search');
    let typeSelect = document.getElementById('shop-filter-type');
    
    function renderShopRows() {
        let counts = {};
        s.deck.forEach(n => counts[n] = (counts[n]||0) + 1);
        
        let pmEl = document.getElementById('shop-pm-balance');
        if (pmEl) pmEl.innerHTML = `💰 ${s.pm || 0} PM`;
        let deckEl = document.getElementById('shop-deck-count');
        if (deckEl) deckEl.innerHTML = `DECK: <span style="color:${s.deck.length === 40 ? '#4caf50' : '#f44336'}">${s.deck.length}</span>/40`;
        
        tbody.innerHTML = '';
        let query = (searchInput.value || '').toLowerCase();
        let fType = typeSelect.value || '';
        
        const GENERAL_EQUIPS = new Set([
            'axe of despair', 'united we stand', 'mage power', 'poder del mago',
            'malevolent nuzzler', 'horn of the unicorn', 'black pendant',
            'horn of light', 'megamorph', 'megamorfo'
        ]);
        const SPECIFIC_EQUIPS = new Set([
            'dragon treasure', 'garra del dragón', 'garra del dragon',
            'legendary sword', 'sword of dark destruction', 'dark energy',
            "elf's light", 'elfs light', 'shine palace', 'salamandra',
            'beast fangs', 'mystical moon', 'follow wind', 'cyber shield',
            'elegant egotist', 'electro-whip', 'book of secret arts',
            'violet crystal', 'invigoration', 'machine conversion factory',
            'raise body heat', 'laser cannon armor', 'insect armor with laser cannon',
            'silver bow and arrow', 'vile germs', 'steel shell', 'power of kaishin',
            'fusion weapon'
        ]);

        // Helper: Verificar si una carta es monstruo FUSIÓN para excluirla de la tienda (solo cartas para usar al campo)
        function isFusionOrExtra(nameOrCard) {
            if (!nameOrCard) return false;
            let n = (typeof nameOrCard === 'string' ? nameOrCard : (nameOrCard.name || '')).trim();
            let norm = n.toLowerCase();
            // Los materiales base para fusiones NO son monstruos fusión (se juegan directamente en mano/campo)
            if (['kaminarikozou', 'lala li-oon', 'mega thunderball', 'petit dragon', 'baby dragon'].includes(norm)) return false;
            if (typeof window.isFusionMonster === 'function' && window.isFusionMonster(nameOrCard)) return true;
            if (window.FUSION_MONSTER_NAMES && window.FUSION_MONSTER_NAMES.has(n)) return true;
            if (typeof nameOrCard === 'object') {
                if (nameOrCard.kind === 'FUSION' || nameOrCard.type === 'Fusion' || (nameOrCard.tags && Array.isArray(nameOrCard.tags) && nameOrCard.tags.includes('FUSION'))) return true;
                if (nameOrCard.tier && nameOrCard.tier.includes('FUSIÓN')) return true;
            }
            return false;
        }

        let activeShopCards = [...POWERFUL_SHOP_CARDS].filter(item => !isFusionOrExtra(item));
        // Enforce equip pricing in POWERFUL_SHOP_CARDS
        activeShopCards.forEach(item => {
            let n = item.name.toLowerCase().trim();
            if (GENERAL_EQUIPS.has(n)) {
                item.price = 20000;
                item.tier = 'EQUIPO GENERAL (20k)';
            } else if (SPECIFIC_EQUIPS.has(n)) {
                item.price = 10000;
                item.tier = 'EQUIPO ESPECÍFICO (10k)';
            }
        });

        // Garantizar Mystical Space Typhoon y Dust Tornado a 4000 DP
        const REQUIRED_SHOP_ST = [
            { name: 'Mystical Space Typhoon', price: 4000, tier: 'MAGIA RÁPIDA', desc: 'Destruye 1 carta Mágica o Trampa en el campo.' },
            { name: 'Dust Tornado', price: 4000, tier: 'TRAMPA CLÁSICA', desc: 'Destruye 1 carta Mágica, Trampa o Equipo del rival.' }
        ];
        REQUIRED_SHOP_ST.forEach(req => {
            let norm = req.name.toLowerCase().trim();
            let found = activeShopCards.find(x => x.name.toLowerCase().trim() === norm);
            if (found) {
                found.price = req.price;
                found.tier = req.tier;
                found.desc = req.desc;
            } else {
                activeShopCards.push(req);
            }
        });

        let existingNames = new Set(activeShopCards.map(c => c.name.toLowerCase().trim()));

        // Ensure ALL Equip cards exist in the shop
        if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
            window.CARDS_DATA.forEach(c => {
                if (!c || !c.name) return;
                let norm = c.name.toLowerCase().trim();
                let isGen = GENERAL_EQUIPS.has(norm);
                let isSpec = SPECIFIC_EQUIPS.has(norm);
                let isEq = isGen || isSpec || (typeof window.isEquipSpell === 'function' && window.isEquipSpell(c));

                if (isEq) {
                    let eqPrice = isGen ? 20000 : 10000;
                    let eqTier = isGen ? 'EQUIPO GENERAL (20k)' : 'EQUIPO ESPECÍFICO (10k)';
                    if (!existingNames.has(norm)) {
                        activeShopCards.push({
                            name: c.name,
                            price: eqPrice,
                            tier: eqTier,
                            desc: c.text || c.desc || 'Carta Mágica de Equipo'
                        });
                        existingNames.add(norm);
                    } else {
                        let existing = activeShopCards.find(x => x.name.toLowerCase().trim() === norm);
                        if (existing) {
                            existing.price = eqPrice;
                            existing.tier = eqTier;
                        }
                    }
                } else if (c.price && c.price > 0 && !existingNames.has(norm)) {
                    if (isFusionOrExtra(c)) return; // REGLA: No poner monstruos fusión en la tienda
                    if (typeof window.isCardProgrammed === 'function' && !window.isCardProgrammed(c)) return;
                    activeShopCards.push({
                        name: c.name,
                        price: parseInt(c.price),
                        tier: c.tier || (c.kind === 'MONSTER' ? (c.atk >= 2500 ? 'ÉLITE ADMIN' : 'TIENDA') : 'MAGIA/TRAMPA'),
                        desc: c.text || c.desc || (c.kind === 'MONSTER' ? `Monstruo ${c.type || ''} (ATK ${c.atk || 0} / DEF ${c.def || 0})` : 'Efecto especial')
                    });
                    existingNames.add(norm);
                }
            });
        }
        
        let filterTotal = document.getElementById('shop-filter-type');
        if (filterTotal && filterTotal.options && filterTotal.options[0]) {
            filterTotal.options[0].textContent = `Todas las cartas (${activeShopCards.length})`;
        }
        
        activeShopCards.forEach(item => {
            let info = window.getCardMetadata(item.name);
            if (query && !item.name.toLowerCase().includes(query)) return;
            let isField = typeof window.isFieldSpell === 'function' ? window.isFieldSpell(info) : false;
            let isEquip = typeof window.isEquipSpell === 'function' ? window.isEquipSpell(info) : (GENERAL_EQUIPS.has(item.name.toLowerCase().trim()) || SPECIFIC_EQUIPS.has(item.name.toLowerCase().trim()));
            let isSpell = info.isSpell || isField || isEquip;

            if (fType === 'MONSTER' && !info.isMonster) return;
            if (fType === 'SPELL' && !isSpell) return;
            if (fType === 'SPELL_NORMAL' && (!isSpell || isField || isEquip)) return;
            if (fType === 'SPELL_FIELD' && (!isSpell || !isField)) return;
            if (fType === 'SPELL_EQUIP' && (!isSpell || !isEquip)) return;
            if (fType === 'TRAP' && !info.isTrap) return;
            
            let ownCount = s.collection[item.name] || 0;
            let inDeck = counts[item.name] || 0;
            let canBuy = (s.pm >= item.price);
            let canAddToDeck = (ownCount > inDeck) && (inDeck < 3);
            let canRemoveFromDeck = inDeck > 0;
            
            let cardColor = info.isMonster ? '#d4af37' : (info.isTrap ? '#ff80ab' : '#4caf50');
            
            let tr = document.createElement('tr');
            tr.style.cssText = 'border-bottom: 1px solid #333; transition: background 0.15s; cursor: pointer;';
            tr.onmouseover = () => {
                tr.style.background = '#282834';
                previewImg.src = info.imgUrl;
                let atkDef = info.isMonster ? `<br><br><span style="color:#ff5252; font-weight:bold;">⚔ ATK ${info.atk}</span> / <span style="color:#2196f3; font-weight:bold;">🛡 DEF ${info.def}</span>` : '';
                previewText.innerHTML = `
                    <div style="font-weight:bold; font-size:18px; color:${cardColor}; margin-bottom: 5px;">${info.name}</div>
                    <div style="font-size:13px; color:#aaa;">[${info.type}] ${info.attr !== '-' ? ' · ' + info.attr : ''} · <span style="color:#ffd700;">${item.tier}</span></div>
                    ${atkDef}
                    <div style="margin-top:10px; color:#ffe082; font-size:13px; line-height:1.4;">${item.desc || info.desc}</div>
                    <div style="margin-top:12px; padding-top:8px; border-top:1px solid #444; font-size:12px; color:#ccc;">
                        En Colección: <b style="color:#fff;">${ownCount}</b> · En tu Deck: <b style="color:#81c784;">${inDeck}</b>/3
                    </div>
                `;
            };
            tr.onmouseout = () => tr.style.background = 'transparent';
            
            let statDisplay = info.isMonster ? `<span style="color:#ff5252; font-weight:bold;">${info.atk}</span> / <span style="color:#2196f3; font-weight:bold;">${info.def}</span>` : `<span style="color:#aaa; font-size:12px;">${item.tier}</span>`;
            
            tr.innerHTML = `
                <td style="padding: 10px 12px; color: #888;">#${String(info.num).replace(/[^\d]/g, '').padStart(3, '0')}</td>
                <td style="padding: 10px 12px; font-weight: bold; color: ${cardColor};">${info.name}</td>
                <td style="padding: 10px 12px; font-size:13px;">${info.isMonster ? info.type : (info.isTrap ? 'Trampa' : (isField ? 'Magia (Campo)' : (isEquip ? 'Magia (Equipo)' : 'Magia (Normal)')))}</td>
                <td style="padding: 10px 12px;">${statDisplay}</td>
                <td style="padding: 10px 12px; text-align:center; font-weight:bold; color:#ffd700;">${item.price} PM</td>
                <td style="padding: 10px 12px; text-align:center; font-weight:bold;">
                    <span style="color:${ownCount > 0 ? '#fff' : '#666'}">x${ownCount}</span>
                </td>
                <td style="padding: 10px 12px; text-align:center; font-weight:bold;">
                    <span style="color:${inDeck > 0 ? '#81c784' : '#666'}">${inDeck}</span>
                </td>
                <td style="padding: 10px 12px; text-align:center; white-space:nowrap;">
                    <button class="shop-buy-btn" style="background:${canBuy ? 'linear-gradient(180deg, #ffd700, #b8860b)' : '#444'}; color:${canBuy ? '#000' : '#888'}; border:none; padding:7px 12px; border-radius:4px; font-weight:bold; font-size:12px; cursor:${canBuy ? 'pointer' : 'not-allowed'}; margin-right:5px;">
                        ${s.pm < item.price ? 'SIN PM' : '🛒 COMPRAR'}
                    </button>
                    <button class="shop-add-btn" style="background:#2e7d32; color:#fff; border:none; padding:7px 10px; border-radius:4px; font-weight:bold; font-size:12px; cursor:${canAddToDeck ? 'pointer' : 'not-allowed'}; opacity:${canAddToDeck ? '1' : '0.4'}; margin-right:4px;" title="Equipar al Deck">
                        ➕ AL DECK
                    </button>
                    <button class="shop-rem-btn" style="background:#c62828; color:#fff; border:none; padding:7px 10px; border-radius:4px; font-weight:bold; font-size:12px; cursor:${canRemoveFromDeck ? 'pointer' : 'not-allowed'}; opacity:${canRemoveFromDeck ? '1' : '0.4'};" title="Quitar del Deck">
                        ➖ QUITAR
                    </button>
                </td>
            `;
            
            // BUY BUTTON
            let buyBtn = tr.querySelector('.shop-buy-btn');
            buyBtn.onclick = (e) => {
                e.stopPropagation();
                if (!canBuy) return;
                window.playViolinClick && window.playViolinClick();
                s.pm -= item.price;
                s.collection = s.collection || {};
                s.collection[item.name] = (s.collection[item.name] || 0) + 1;
                
                if (window.persistUserSave) window.persistUserSave(s);
                else {
                    origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
                    if (window.nativeAPI && window.nativeAPI.saveGame) window.nativeAPI.saveGame();
                }
                
                alert(`¡Has comprado "${item.name}" por ${item.price} PM!\n\n📦 La carta ha sido enviada directamente a tu BANCA / BAÚL DE RESERVA.\nPuedes armar y equipar tus decks en el Dashboard del Deck.`);
                renderShopRows();
            };
            
            // ADD TO DECK BUTTON
            let addBtn = tr.querySelector('.shop-add-btn');
            addBtn.onclick = (e) => {
                e.stopPropagation();
                if (!canAddToDeck) return;
                window.playHoverSound && window.playHoverSound();
                if (s.deck.length < 40) {
                    s.deck.push(item.name);
                    if (s.decks && s.activeDeck) s.decks[s.activeDeck] = [...s.deck];
                    alert(`¡${item.name} añadida a tu Deck activo ("${s.activeDeck || 'Principal'}")! (Total: ${s.deck.length}/40)`);
                } else {
                    let lowest = findLowestMonsterInDeck(s.deck);
                    if (confirm(`Tu Deck activo ("${s.activeDeck || 'Principal'}") ya tiene 40 cartas.\n¿Deseas equipar ${item.name} reemplazando a ${lowest.name} (ATK ${lowest.atk})?`)) {
                        s.deck.splice(lowest.index, 1, item.name);
                        if (s.decks && s.activeDeck) s.decks[s.activeDeck] = [...s.deck];
                        alert(`¡${item.name} equipada en tu Deck activo!\n(Reemplazó a ${lowest.name} de ATK ${lowest.atk})`);
                    } else {
                        return;
                    }
                }
                if (window.persistUserSave) window.persistUserSave(s);
                else {
                    origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
                    if (window.nativeAPI && window.nativeAPI.saveGame) window.nativeAPI.saveGame();
                }
                renderShopRows();
            };
            
            // REMOVE FROM DECK BUTTON
            let remBtn = tr.querySelector('.shop-rem-btn');
            remBtn.onclick = (e) => {
                e.stopPropagation();
                if (!canRemoveFromDeck) return;
                window.playHoverSound && window.playHoverSound();
                let idx = s.deck.lastIndexOf(item.name);
                if (idx >= 0) {
                    s.deck.splice(idx, 1);
                    if (s.decks && s.activeDeck) s.decks[s.activeDeck] = [...s.deck];
                    if (window.persistUserSave) window.persistUserSave(s);
                    else {
                        origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
                        if (window.nativeAPI && window.nativeAPI.saveGame) window.nativeAPI.saveGame();
                    }
                    renderShopRows();
                }
            };
            
            tbody.appendChild(tr);
        });
    }
    
    searchInput.oninput = renderShopRows;
    typeSelect.onchange = renderShopRows;
    renderShopRows();

    if (typeof fetch === 'function') {
        fetch('/api/cards').then(r => r.json()).then(cards => {
            if (Array.isArray(cards)) {
                window.CARDS_DATA = cards;
                if (document.getElementById('custom-shop-dashboard')) {
                    renderShopRows();
                }
            }
        }).catch(() => {});
    }
    
    document.getElementById('btn-exit-shop').onclick = () => {
        window.playViolinClick && window.playViolinClick();
        overlay.remove();
        if (window.openCustomShopMenu) window.openCustomShopMenu();
    };
};

if (window.nativeAPI) window.nativeAPI.showShop = window.customShowShop;
window.showShop = window.customShowShop;

window.openCustomShopMenu = function() {
    window.playCustomMusic('tienda.mp3');
    
    let existing = document.getElementById('custom-shop-menu');
    if (existing) existing.remove();

    let sStr = origGet('FMR_SAVE_' + window.activeAccount);
    let s = sStr ? JSON.parse(sStr) : (window.nativeAPI && window.nativeAPI.loadGame ? window.nativeAPI.loadGame() : {});
    s = s || {};
    s.collection = s.collection || {};
    s.decks = s.decks || {};
    s.deck = s.deck || [];
    s.cleared = s.cleared || [];
    s.activeDeck = s.activeDeck || Object.keys(s.decks)[0] || 'Deck 1';
    let curActiveDeck = s.decks[s.activeDeck] || s.deck;
    let activeDeckCount = curActiveDeck ? curActiveDeck.length : 40;

    // 7 Artículos del Milenio Data & Unlocking Logic
    const MILLENNIUM_ITEMS = window.getMillenniumItems(s);


    let unlockedCount = MILLENNIUM_ITEMS.filter(it => it.unlocked).length;

    // Inject Styles if not already present
    if (!document.getElementById('custom-shop-style-animations')) {
        let styleTag = document.createElement('style');
        styleTag.id = 'custom-shop-style-animations';
        styleTag.textContent = `
            @keyframes grandpaFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-8px) rotate(0.4deg); }
            }
            @keyframes grandpaBounce {
                0% { transform: scale(1) translateY(0); }
                30% { transform: scale(1.06) translateY(-16px); }
                60% { transform: scale(0.97) translateY(4px); }
                100% { transform: scale(1) translateY(0); }
            }
            @keyframes shopSparkle {
                0% { opacity: 0.3; transform: translateY(0) scale(0.8); }
                50% { opacity: 1; transform: translateY(-25px) scale(1.1); }
                100% { opacity: 0; transform: translateY(-50px) scale(0.8); }
            }
            @keyframes goldPulseGlow {
                0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.4), inset 0 0 8px rgba(255, 215, 0, 0.2); }
                50% { box-shadow: 0 0 22px rgba(255, 215, 0, 0.8), inset 0 0 14px rgba(255, 215, 0, 0.4); }
            }
            .shop-interactive-btn {
                background: linear-gradient(90deg, #2b1d09 0%, #170e03 100%);
                border: 2px solid #b8860b;
                border-radius: 6px;
                padding: 10px 16px;
                color: #fff;
                font-family: 'Segoe UI', VT323, sans-serif;
                font-size: 14px;
                font-weight: bold;
                letter-spacing: 1px;
                text-align: left;
                cursor: pointer;
                transition: all 0.18s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                position: relative;
                overflow: hidden;
                box-sizing: border-box;
            }
            .shop-interactive-btn::before {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 5px; height: 100%;
                background: #ffd700;
                transition: width 0.18s ease;
            }
            .shop-interactive-btn:hover {
                transform: translateX(6px);
                border-color: #ffd700;
                background: linear-gradient(90deg, #442f10 0%, #201305 100%);
                box-shadow: 0 0 16px rgba(255, 215, 0, 0.5);
            }
            .shop-interactive-btn:hover::before {
                width: 8px;
            }
            .millennium-pedestal {
                transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer;
            }
            .millennium-pedestal:hover {
                transform: translateY(-4px) scale(1.06);
            }

            /* Scrollbars */
            #shop-menu-actions::-webkit-scrollbar,
            #shop-workspace::-webkit-scrollbar,
            #millennium-items-grid::-webkit-scrollbar,
            #custom-shop-menu::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            #shop-menu-actions::-webkit-scrollbar-thumb,
            #shop-workspace::-webkit-scrollbar-thumb,
            #millennium-items-grid::-webkit-scrollbar-thumb,
            #custom-shop-menu::-webkit-scrollbar-thumb {
                background: #ffd700;
                border-radius: 3px;
            }
            #shop-menu-actions::-webkit-scrollbar-track,
            #shop-workspace::-webkit-scrollbar-track,
            #millennium-items-grid::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.4);
            }

            /* Mobile Landscape Mode (Max Height <= 580px) */
            @media (max-height: 580px) {
                #shop-top-bar {
                    padding: 4px 14px !important;
                }
                .shop-header-title {
                    font-size: 18px !important;
                }
                .shop-header-subtitle {
                    display: none !important;
                }
                .shop-stat-badge {
                    padding: 3px 8px !important;
                    font-size: 11px !important;
                    gap: 4px !important;
                }
                #shop-workspace {
                    padding: 4px 16px 2px 16px !important;
                    gap: 12px !important;
                }
                #shop-grandpa-wrap {
                    max-width: 190px !important;
                    justify-content: flex-end !important;
                    padding-bottom: 2px !important;
                }
                #shop-grandpa-img {
                    height: 40vh !important;
                    max-height: 160px !important;
                }
                #grandpa-speech-bubble {
                    position: static !important;
                    padding: 5px 8px !important;
                    margin-bottom: 4px !important;
                    min-height: auto !important;
                    border-radius: 8px !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                #bubble-pointer-tail {
                    display: none !important;
                }
                #grandpa-speech-title {
                    font-size: 10px !important;
                    margin-bottom: 2px !important;
                }
                #grandpa-speech-text {
                    font-size: 11px !important;
                    line-height: 1.2 !important;
                    display: -webkit-box !important;
                    -webkit-line-clamp: 2 !important;
                    -webkit-box-orient: vertical !important;
                    overflow: hidden !important;
                }
                #shop-grandpa-hint {
                    display: none !important;
                }
                #shop-right-side {
                    max-width: none !important;
                    flex: 1 !important;
                }
                #shop-menu-actions {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 5px !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    max-height: calc(100vh - 84px) !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                    padding-right: 4px !important;
                }
                .shop-interactive-btn {
                    padding: 6px 10px !important;
                    gap: 8px !important;
                    min-height: 36px !important;
                }
                .shop-interactive-btn .btn-icon {
                    font-size: 18px !important;
                }
                .shop-interactive-btn .btn-label {
                    font-size: 12px !important;
                    letter-spacing: 0.5px !important;
                }
                .shop-interactive-btn .btn-desc {
                    display: none !important;
                }
                .shop-interactive-btn .btn-arrow {
                    display: none !important;
                }
                #shop-millennium-showcase {
                    padding: 3px 14px !important;
                    gap: 2px !important;
                }
                #shop-millennium-showcase.collapsed #millennium-items-grid {
                    display: none !important;
                }
                #shop-millennium-showcase.collapsed {
                    padding: 3px 14px !important;
                }
                .showcase-desc-hint {
                    display: none !important;
                }
                .millennium-pedestal {
                    min-width: 80px !important;
                    max-width: 105px !important;
                    height: 56px !important;
                    padding: 2px !important;
                }
                .pedestal-svg-box {
                    width: 26px !important;
                    height: 26px !important;
                }
                .pedestal-name-box {
                    font-size: 9px !important;
                }
                .pedestal-status-badge {
                    font-size: 8px !important;
                    padding: 1px 4px !important;
                }
                /* customShowShop in landscape */
                #custom-shop-dashboard {
                    padding: 6px 10px !important;
                }
                #shop-left-preview {
                    width: 170px !important;
                    margin-right: 10px !important;
                    padding-right: 10px !important;
                }
                #preview-img-wrap {
                    height: 175px !important;
                }
                #preview-text-box {
                    margin-top: 6px !important;
                    padding: 6px !important;
                    min-height: 70px !important;
                    font-size: 11px !important;
                }
            }

            /* Mobile Portrait Mode (@media (orientation: portrait), (max-width: 680px)) */
            @media (orientation: portrait), (max-width: 680px) {
                #shop-top-bar {
                    flex-direction: column !important;
                    gap: 6px !important;
                    padding: 8px 12px !important;
                }
                .shop-header-title {
                    font-size: 19px !important;
                    text-align: center !important;
                }
                .shop-header-subtitle {
                    display: none !important;
                }
                .shop-top-stats {
                    flex-wrap: wrap !important;
                    gap: 6px !important;
                    justify-content: center !important;
                }
                .shop-stat-badge {
                    padding: 4px 8px !important;
                    font-size: 11px !important;
                }
                #shop-workspace {
                    flex-direction: column !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                    padding: 8px 12px !important;
                    gap: 10px !important;
                    justify-content: flex-start !important;
                    align-items: stretch !important;
                }
                #shop-grandpa-wrap {
                    flex-direction: row !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    height: auto !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                    gap: 10px !important;
                }
                #shop-grandpa-img {
                    width: 64px !important;
                    height: 64px !important;
                    border-radius: 50% !important;
                    border: 2px solid #ffd700 !important;
                    object-fit: cover !important;
                    object-position: top !important;
                    animation: none !important;
                    flex-shrink: 0 !important;
                }
                #grandpa-speech-bubble {
                    position: static !important;
                    flex: 1 !important;
                    padding: 8px 10px !important;
                    min-height: auto !important;
                }
                #bubble-pointer-tail {
                    display: none !important;
                }
                #shop-grandpa-hint {
                    display: none !important;
                }
                #shop-right-side {
                    width: 100% !important;
                    max-width: 100% !important;
                }
                #shop-menu-actions {
                    width: 100% !important;
                    max-width: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 8px !important;
                    max-height: none !important;
                    overflow: visible !important;
                }
                .shop-interactive-btn {
                    padding: 10px 14px !important;
                    width: 100% !important;
                }
                .shop-interactive-btn .btn-desc {
                    display: block !important;
                    font-size: 10px !important;
                }
                #shop-millennium-showcase {
                    padding: 8px 12px !important;
                }
                #millennium-items-grid {
                    overflow-x: auto !important;
                    justify-content: flex-start !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                .millennium-pedestal {
                    min-width: 95px !important;
                    height: 75px !important;
                }
                /* customShowShop in portrait */
                #custom-shop-dashboard {
                    flex-direction: column !important;
                    padding: 8px !important;
                    overflow-y: auto !important;
                }
                #shop-left-preview {
                    width: 100% !important;
                    margin-right: 0 !important;
                    padding-right: 0 !important;
                    border-right: none !important;
                    border-bottom: 2px solid #333 !important;
                    padding-bottom: 8px !important;
                    margin-bottom: 8px !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: 10px !important;
                }
                #preview-img-wrap {
                    width: 90px !important;
                    height: 120px !important;
                    flex-shrink: 0 !important;
                }
                #preview-text-box {
                    flex: 1 !important;
                    margin-top: 0 !important;
                    min-height: auto !important;
                    font-size: 11px !important;
                }

                /* customShowDeckEditor in portrait */
                #custom-deck-editor {
                    flex-direction: column !important;
                    padding: 8px !important;
                    overflow-y: auto !important;
                }
                #deck-editor-left-preview {
                    width: 100% !important;
                    margin-right: 0 !important;
                    padding-right: 0 !important;
                    border-right: none !important;
                    border-bottom: 2px solid #333 !important;
                    padding-bottom: 8px !important;
                    margin-bottom: 8px !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: 10px !important;
                }
                #deck-preview-img-wrap {
                    width: 90px !important;
                    height: 120px !important;
                    flex-shrink: 0 !important;
                }
                #deck-preview-text {
                    flex: 1 !important;
                    margin-top: 0 !important;
                    min-height: auto !important;
                    font-size: 11px !important;
                }
            }
        `;
        document.head.appendChild(styleTag);
    }

    // MAIN OVERLAY CONTAINER
    let overlay = document.createElement('div');
    overlay.id = 'custom-shop-menu';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: radial-gradient(circle at 30% 40%, #1e170c 0%, #0d0a06 60%, #050402 100%); z-index:9999999; display:flex; flex-direction:column; box-sizing:border-box; color:#fff; font-family:"Segoe UI", Arial, sans-serif; overflow:hidden; user-select:none;';

    // SVG DEFS FOR GOLDEN SHADERS
    let svgDefsWrap = document.createElement('div');
    svgDefsWrap.style.cssText = 'position:absolute; width:0; height:0; overflow:hidden;';
    svgDefsWrap.innerHTML = `
      <svg width="0" height="0">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff5b8"/>
            <stop offset="30%" stop-color="#ffd700"/>
            <stop offset="70%" stop-color="#b8860b"/>
            <stop offset="100%" stop-color="#4a3200"/>
          </linearGradient>
          <radialGradient id="eyeOrb" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#fff8cc"/>
            <stop offset="35%" stop-color="#ffd700"/>
            <stop offset="75%" stop-color="#996515"/>
            <stop offset="100%" stop-color="#3d2800"/>
          </radialGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff59d"/>
            <stop offset="100%" stop-color="#ffb300"/>
          </radialGradient>
        </defs>
      </svg>
    `;
    overlay.appendChild(svgDefsWrap);

    // BACKGROUND HIEROGLYPHIC & PARTICLES OVERLAY
    let bgParticles = document.createElement('div');
    bgParticles.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; opacity:0.18; background-image: radial-gradient(#ffd700 1px, transparent 1px); background-size: 40px 40px;';
    overlay.appendChild(bgParticles);

    // 1. TOP HEADER STATUS BAR
    let topBar = document.createElement('div');
    topBar.id = 'shop-top-bar';
    topBar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px 28px; background:linear-gradient(180deg, rgba(20,15,8,0.95) 0%, rgba(10,8,4,0.7) 100%); border-bottom:2px solid #b8860b; box-shadow:0 4px 15px rgba(0,0,0,0.6); z-index:10;';
    topBar.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
            <span style="font-size:24px; filter:drop-shadow(0 0 6px #ffd700); flex-shrink:0;">🏺</span>
            <div style="min-width:0;">
                <div class="shop-header-title" style="font-family:VT323, monospace; color:#ffd700; font-size:26px; letter-spacing:1.5px; text-shadow:2px 2px 0 #000, 0 0 10px rgba(255,215,0,0.5); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    KAME GAME · TIENDA DEL ABUELO MOTO
                </div>
                <div class="shop-header-subtitle" style="font-size:12px; color:#c7a76d; letter-spacing:0.5px;">Bazar Ancestral de Cartas y Reliquias Milenarias</div>
            </div>
        </div>
        <div class="shop-top-stats" style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
            <div class="shop-stat-badge" style="background:#201608; border:1px solid #ffd700; border-radius:6px; padding:5px 12px; display:flex; align-items:center; gap:6px;">
                <span style="font-size:15px;">💰</span>
                <span style="color:#aaa; font-size:11px; font-weight:bold;">PM:</span>
                <span style="color:#ffd700; font-weight:bold; font-size:15px; font-family:VT323, monospace;" id="shop-menu-pm">${s.pm || 0}</span>
            </div>
            <div class="shop-stat-badge" style="background:#16202d; border:1px solid #4a90e2; border-radius:6px; padding:5px 12px; display:flex; align-items:center; gap:6px;">
                <span style="font-size:15px;">🎴</span>
                <span style="color:#aaa; font-size:11px; font-weight:bold;">DECK:</span>
                <span style="color:#66c0f4; font-weight:bold; font-size:12px;">${(s.activeDeck || 'Deck 1').toUpperCase()}</span>
                <span style="background:#0d47a1; color:#fff; font-size:10px; padding:1px 5px; border-radius:3px;">${activeDeckCount}/40</span>
            </div>
            <div class="shop-stat-badge" style="background:#281c00; border:1px solid #b8860b; border-radius:6px; padding:5px 12px; display:flex; align-items:center; gap:6px;" title="Artículos del Milenio en tu poder">
                <span style="font-size:15px;">✨</span>
                <span style="color:#ffd700; font-size:11px; font-weight:bold;">MILENIO:</span>
                <span style="color:#fff; font-weight:bold; font-size:12px;">${unlockedCount} / 7</span>
            </div>
        </div>
    `;
    overlay.appendChild(topBar);

    // 2. MIDDLE WORKSPACE (Left: Grandpa Moto with Speech Bubble, Right: Action Menu)
    let workspace = document.createElement('div');
    workspace.id = 'shop-workspace';
    workspace.style.cssText = 'flex: 1; display:flex; flex-direction:row; padding:10px 30px 4px 30px; box-sizing:border-box; overflow:hidden; position:relative; align-items:center; justify-content:space-between; gap:20px;';

    // LEFT: GRANDPA MOTO + SPEECH BUBBLE
    let grandpaWrap = document.createElement('div');
    grandpaWrap.id = 'shop-grandpa-wrap';
    grandpaWrap.style.cssText = 'flex: 1; height: 100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; position:relative; max-width: 480px; box-sizing:border-box;';

    // Speech bubble
    let bubble = document.createElement('div');
    bubble.id = 'grandpa-speech-bubble';
    bubble.style.cssText = 'position:relative; width: 100%; max-width: 440px; background: linear-gradient(135deg, #2b2010 0%, #181208 100%); border: 2px solid #ffd700; border-radius: 12px; padding: 10px 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.8), 0 0 12px rgba(255,215,0,0.25); z-index: 5; transition: all 0.25s ease; min-height: 50px; display:flex; flex-direction:column; justify-content:center; box-sizing:border-box; margin-bottom: 8px;';
    
    // Bubble pointer tail
    let bubbleTail = document.createElement('div');
    bubbleTail.id = 'bubble-pointer-tail';
    bubbleTail.style.cssText = 'position:absolute; bottom:-10px; left:50%; margin-left:-8px; width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid #ffd700;';
    bubble.appendChild(bubbleTail);

    let bubbleTitle = document.createElement('div');
    bubbleTitle.id = 'grandpa-speech-title';
    bubbleTitle.style.cssText = 'font-weight:bold; font-size:11px; color:#ffd700; font-family:VT323, monospace; letter-spacing:1px; margin-bottom:3px; display:flex; align-items:center; gap:5px;';
    bubbleTitle.innerHTML = '<span>👴 ABUELO MOTO DICE:</span>';
    bubble.appendChild(bubbleTitle);

    let bubbleText = document.createElement('div');
    bubbleText.id = 'grandpa-speech-text';
    bubbleText.style.cssText = 'font-size:13px; color:#fff; line-height:1.35; transition: opacity 0.15s ease; font-style:italic;';
    bubbleText.textContent = '¡Bienvenido a Kame Game, duelista! ¿En qué puedo ayudarte hoy para forjar tu destino?';
    bubble.appendChild(bubbleText);

    grandpaWrap.appendChild(bubble);

    // Warm radial aura behind Grandpa Moto
    let auraGlow = document.createElement('div');
    auraGlow.id = 'shop-aura-glow';
    auraGlow.style.cssText = 'position:absolute; bottom: 0; width: 380px; height: 380px; background: radial-gradient(circle, rgba(255, 190, 40, 0.25) 0%, rgba(255, 140, 0, 0.1) 45%, rgba(0,0,0,0) 75%); border-radius: 50%; pointer-events:none; z-index: 1;';
    grandpaWrap.appendChild(auraGlow);

    // Grandpa Moto Image (Interactive + Breathing animation)
    let grandpaImg = document.createElement('img');
    grandpaImg.id = 'shop-grandpa-img';
    grandpaImg.src = 'ImagenesPersonajes/abueloYugi.jpg';
    grandpaImg.alt = 'Abuelo Moto';
    grandpaImg.style.cssText = 'height: 52vh; max-height: 440px; object-fit: contain; z-index: 2; cursor: pointer; filter: drop-shadow(0 0 16px rgba(255, 180, 0, 0.45)); animation: grandpaFloat 3.8s ease-in-out infinite; transition: transform 0.2s ease;';
    grandpaImg.title = '¡Haz clic para hablar con el Abuelo Moto!';

    // Random wisdom quotes for clicking Grandpa
    const GRANDPA_RANDOM_QUOTES = [
      '¡Cree siempre en el Corazón de las Cartas, muchacho! Ellas responderán a tu espíritu.',
      '¡Esa baraja tuya tiene un vínculo sagrado contigo! Cuida a cada uno de tus monstruos.',
      'Recuerdo cuando conseguí por primera vez mi Dragón Blanco... ¡Qué tiempos aquellos tan memorables!',
      'Los 7 Artículos del Milenio tienen el poder de decidir el destino del mundo entero.',
      '¡Un verdadero duelista jamás se rinde, ni siquiera cuando sólo le quedan 100 LP!',
      '¡Me alegra mucho verte por aquí! Tómate tu tiempo para revisar tus cartas y preparar tu estrategia.',
      'Si combinas cartas afines en el tablero, ¡puedes desatar fusiones sorprendentes!'
    ];

    function setGrandpaSpeech(text, isTemporary) {
        bubbleText.style.opacity = '0';
        setTimeout(() => {
            bubbleText.textContent = text;
            bubbleText.style.opacity = '1';
        }, 120);
    }

    grandpaImg.onclick = () => {
        window.playViolinClick && window.playViolinClick();
        grandpaImg.style.animation = 'none';
        void grandpaImg.offsetWidth;
        grandpaImg.style.animation = 'grandpaBounce 0.55s ease, grandpaFloat 3.8s ease-in-out 0.55s infinite';
        
        let randomQuote = GRANDPA_RANDOM_QUOTES[Math.floor(Math.random() * GRANDPA_RANDOM_QUOTES.length)];
        setGrandpaSpeech(randomQuote);
    };

    grandpaWrap.appendChild(grandpaImg);

    // Floating hint badge below Grandpa
    let clickHint = document.createElement('div');
    clickHint.id = 'shop-grandpa-hint';
    clickHint.style.cssText = 'font-size:11px; color:#ffd700; background:rgba(0,0,0,0.7); border:1px solid #b8860b; border-radius:12px; padding:2px 10px; margin-bottom:6px; z-index:3; cursor:pointer; font-weight:bold; box-shadow:0 2px 6px #000;';
    clickHint.textContent = '💬 ¡Haz clic en el Abuelo!';
    clickHint.onclick = grandpaImg.onclick;
    grandpaWrap.appendChild(clickHint);

    workspace.appendChild(grandpaWrap);

    // RIGHT: INTERACTIVE NAVIGATION BUTTONS
    let rightSide = document.createElement('div');
    rightSide.id = 'shop-right-side';
    rightSide.style.cssText = 'flex: 1; display:flex; flex-direction:column; justify-content:center; align-items:flex-end; max-width: 500px; z-index: 4; box-sizing:border-box;';

    let btnContainer = document.createElement('div');
    btnContainer.id = 'shop-menu-actions';
    btnContainer.style.cssText = 'display:flex; flex-direction:column; gap: 9px; width: 100%; max-width: 440px; box-sizing:border-box;';

    function runNativeView(funcName) {
        if (funcName === 'showShop') {
            overlay.remove();
            window.customShowShop();
            return;
        }
        if (window.nativeAPI && typeof window.nativeAPI[funcName] === 'function') {
            window.playChic && window.playChic();
            let mapOverlay = document.getElementById('map-container-overlay');
            if (mapOverlay) mapOverlay.style.display = 'none'; 
            overlay.remove(); 
            
            let camp = document.getElementById('campaign3000');
            if (camp) {
                camp.innerHTML = '<div id="campContent3000"></div>';
                camp.style.cssText = ''; 
                camp.className = 'campContainer3000';
            }
            
            window.nativeAPI[funcName](); 
            
            setTimeout(() => {
                let backBtn = document.getElementById('back3000');
                if (backBtn) {
                    backBtn.onclick = () => {
                        window.playViolinClick();
                        if (camp) camp.innerHTML = '';
                        if (mapOverlay) mapOverlay.style.display = ''; 
                        window.playCustomMusic('mapa.mp3');
                    };
                }
            }, 100);
        } else {
            alert('Error: La función ' + funcName + ' no está disponible en la API nativa.');
        }
    }

    const MENU_OPTIONS = [
        { 
            icon: '📜', 
            label: 'COLECCIÓN DE CARTAS', 
            desc: 'Visualiza todas las cartas que posees en tu archivo.',
            speech: '¡Aquí puedes revisar tu colección completa de cartas! ¿Qué tesoros has encontrado en tus viajes?',
            action: () => runNativeView('showCollection') 
        },
        { 
            icon: '⚔️', 
            label: 'EDITAR DECK (DASHBOARD)', 
            desc: 'Organiza tus decks y configura tu Deck Activo.',
            speech: '¡El corazón del duelista! Ahora puedes crear varios decks y decidir cuál será tu Deck Activo para los combates.',
            action: () => {
                window.playViolinClick();
                overlay.remove();
                if (window.customShowDeckEditor) {
                    let mapOverlay = document.getElementById('map-container-overlay');
                    if (mapOverlay) mapOverlay.style.display = 'none';
                    window.customShowDeckEditor();
                } else {
                    runNativeView('showDeckEditor');
                }
            } 
        },
        { 
            icon: '⚡', 
            label: 'DUELO LIBRE', 
            desc: 'Reta a duelistas superados para conseguir más cartas.',
            speech: '¿Buscas entrenar y ganar nuevas cartas? ¡Reta a cualquier rival que hayas derrotado en la cúpula de duelos!',
            action: () => { 
                window.playViolinClick();
                overlay.remove();
                window.openFreeDuelMenu();
            } 
        },
        { 
            icon: '💎', 
            label: 'TIENDA DE MEMORIAS (CARTAS)', 
            desc: 'Adquiere cartas mágicas, trampas y monstruos con PM.',
            speech: '¡He traído cartas legendarias de todas partes del mundo! Puedes comprarlas usando los PM ganados en tus duelos.',
            action: () => {
                overlay.remove();
                window.customShowShop();
            } 
        },
        { 
            icon: '⭐', 
            label: 'SUSCRIPCIÓN VIP (6 MESES)', 
            desc: 'Renueva o amplía tu acceso completo al juego por 6 meses ($10 USD).',
            speech: '¡Mantén tu acceso ilimitado a duelos, torneos y la tienda completa! Suscríbete por 6 meses vía SINPE Móvil al 5703-5886.',
            action: () => {
                if (window.showSubscriptionPurchaseModal) window.showSubscriptionPurchaseModal(false);
            } 
        },
        { 
            icon: '🔮', 
            label: 'FUSIONES DESCUBIERTAS', 
            desc: 'Consulta tu recetario de fusiones realizadas.',
            speech: '¡El arte de la alquimia de monstruos! Revisa cada combinación mágica que has descubierto.',
            action: () => runNativeView('showFusions') 
        },
        { 
            icon: '💾', 
            label: 'GUARDAR PARTIDA', 
            desc: 'Respalda tus progresos y decks en el navegador y servidor.',
            speech: '¡Una sabia decisión! Un duelista precavido siempre asegura sus cartas y progresos.',
            action: () => { 
                if (window.persistUserSave) window.persistUserSave(s);
                else {
                    origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
                    origSet('FMR_REBORN_STORY_V3000', JSON.stringify(s));
                    if (window.nativeAPI && window.nativeAPI.saveGame) window.nativeAPI.saveGame();
                }
                setGrandpaSpeech('¡Partida guardada exitosamente! Tus progresos, cartas y barajas están respaldados con total seguridad.');
                alert('¡Partida y barajas guardadas exitosamente en el navegador y en el servidor!'); 
            } 
        },
        { 
            icon: '🗺️', 
            label: 'VOLVER AL MAPA', 
            desc: 'Regresa a la exploración de la campaña principal.',
            speech: '¡Que la fortuna y el Corazón de las Cartas te acompañen en tu próxima batalla!',
            action: () => {
                if(window.hideDuelBoard) window.hideDuelBoard();
                window.playViolinClick(); 
                overlay.remove(); 
                let mapOverlay = document.getElementById('map-container-overlay');
                if (mapOverlay) mapOverlay.style.display = '';
                let camp = document.getElementById('campaign3000');
                if (camp) camp.className = 'campContainer3000 hidden';
                window.playCustomMusic('mapa.mp3'); 
            } 
        }
    ];

    MENU_OPTIONS.forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'shop-interactive-btn';
        btn.innerHTML = `
            <span class="btn-icon" style="font-size:20px; filter:drop-shadow(0 0 4px #ffd700); flex-shrink:0;">${opt.icon}</span>
            <div style="flex:1; min-width:0; overflow:hidden;">
                <div class="btn-label" style="font-weight:bold; font-size:14px; color:#ffd700; font-family:VT323, monospace; letter-spacing:1px; text-shadow:1px 1px 0 #000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${opt.label}</div>
                <div class="btn-desc" style="font-size:11px; color:#aaa; font-weight:normal; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${opt.desc}</div>
            </div>
            <span class="btn-arrow" style="font-size:12px; color:#888; flex-shrink:0;">▶</span>
        `;
        btn.onmouseenter = () => {
            window.playHoverSound && window.playHoverSound();
            setGrandpaSpeech(opt.speech);
        };
        btn.onmouseleave = () => {
            setGrandpaSpeech('¡Bienvenido a Kame Game, duelista! ¿En qué puedo ayudarte hoy para forjar tu destino?');
        };
        btn.onclick = () => {
            window.playViolinClick && window.playViolinClick();
            opt.action();
        };
        btnContainer.appendChild(btn);
    });

    rightSide.appendChild(btnContainer);
    workspace.appendChild(rightSide);
    overlay.appendChild(workspace);

    // 3. BOTTOM SHOWCASE: VITRINA DE LOS 7 ARTÍCULOS DEL MILENIO
    let showcaseBar = document.createElement('div');
    showcaseBar.id = 'shop-millennium-showcase';
    showcaseBar.style.cssText = 'background: linear-gradient(180deg, rgba(15,11,6,0.95) 0%, rgba(28,20,10,0.98) 100%); border-top: 2px solid #b8860b; padding: 6px 20px 8px 20px; box-shadow: 0 -6px 20px rgba(0,0,0,0.7); z-index: 10; display:flex; flex-direction:column; gap:6px; flex-shrink:0;';

    // Collapsed by default on compact mobile landscape screens to prioritize full view of the 8 buttons
    if (window.innerHeight <= 580) {
        showcaseBar.classList.add('collapsed');
    }

    let showcaseHeader = document.createElement('div');
    showcaseHeader.id = 'showcase-header';
    showcaseHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-family:VT323, monospace; font-size:15px; color:#ffd700; letter-spacing:1px; cursor:pointer; user-select:none;';
    showcaseHeader.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">🏺</span>
            <span class="showcase-title">VITRINA DE RELIQUIAS SAGRADAS · 7 ARTÍCULOS DEL MILENIO</span>
            <span class="pedestal-count-badge" style="background:#3a2800; border:1px solid #ffd700; color:#fff; font-size:12px; padding:1px 8px; border-radius:4px;">
                ${unlockedCount} / 7
            </span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
            <span class="showcase-desc-hint" style="font-size:12px; color:#c7a76d; font-family:'Segoe UI', sans-serif;">Toca para ver secretos</span>
            <button id="btn-toggle-showcase" style="background:#2b2010; border:1px solid #ffd700; color:#ffd700; padding:2px 8px; border-radius:4px; font-size:12px; font-family:VT323, monospace; cursor:pointer;">▾ Ver / Ocultar</button>
        </div>
    `;
    showcaseHeader.onclick = () => {
        window.playViolinClick && window.playViolinClick();
        showcaseBar.classList.toggle('collapsed');
    };
    showcaseBar.appendChild(showcaseHeader);

    let itemsGrid = document.createElement('div');
    itemsGrid.id = 'millennium-items-grid';
    itemsGrid.style.cssText = 'display:flex; justify-content:space-around; align-items:center; gap:10px; flex-wrap:nowrap; overflow-x:auto; padding:3px 0; -webkit-overflow-scrolling:touch;';

    MILLENNIUM_ITEMS.forEach(it => {
        let pedestal = document.createElement('div');
        pedestal.className = 'millennium-pedestal';
        pedestal.style.cssText = `flex: 1; min-width: 110px; max-width: 155px; height: 85px; background: ${it.unlocked ? 'linear-gradient(180deg, #332408 0%, #1a1204 100%)' : '#141416'}; border: 1.5px solid ${it.unlocked ? '#ffd700' : '#444'}; border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 4px; box-sizing:border-box; position:relative; box-shadow: ${it.unlocked ? '0 0 12px rgba(255, 215, 0, 0.25)' : 'none'}; opacity: ${it.unlocked ? '1' : '0.55'};`;

        // SVG Render
        let svgContainer = document.createElement('div');
        svgContainer.className = 'pedestal-svg-box';
        svgContainer.style.cssText = 'width: 42px; height: 42px; display:flex; align-items:center; justify-content:center; filter:' + (it.unlocked ? 'drop-shadow(0 0 6px #ffd700)' : 'grayscale(100%) opacity(40%)') + ';';
        svgContainer.innerHTML = `<svg viewBox="0 0 100 100" style="width:100%; height:100%;">${it.svgPath}</svg>`;
        pedestal.appendChild(svgContainer);

        // Name
        let nameEl = document.createElement('div');
        nameEl.className = 'pedestal-name-box';
        nameEl.style.cssText = 'font-weight:bold; font-size:11px; color:' + (it.unlocked ? '#ffd700' : '#888') + '; margin-top:3px; text-align:center; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; width:100%;';
        nameEl.textContent = it.shortName;
        pedestal.appendChild(nameEl);

        // Badge
        let badgeEl = document.createElement('div');
        badgeEl.className = 'pedestal-status-badge';
        badgeEl.style.cssText = 'font-size:9px; font-weight:bold; padding:1px 6px; border-radius:3px; margin-top:2px; ' + (it.unlocked ? 'background:#1b5e20; color:#a5d6a7; border:1px solid #4caf50;' : 'background:#222; color:#888; border:1px solid #444;');
        badgeEl.textContent = it.unlocked ? '✨ ACTIVO' : '🔒 BLOQUEADO';
        pedestal.appendChild(badgeEl);

        pedestal.onmouseenter = () => {
            window.playHoverSound && window.playHoverSound();
            if (it.unlocked) {
                setGrandpaSpeech(it.grandpaQuote);
            } else {
                setGrandpaSpeech('El ' + it.name + ' aún no ha sido recuperado. ' + it.hint);
            }
        };

        pedestal.onclick = () => {
            window.playViolinClick && window.playViolinClick();
            showMillenniumItemModal(it);
        };

        itemsGrid.appendChild(pedestal);
    });

    showcaseBar.appendChild(itemsGrid);
    overlay.appendChild(showcaseBar);

    // MODAL DIALOG FOR DETAILED ITEM LORE
    function showMillenniumItemModal(it) {
        let existingModal = document.getElementById('millennium-lore-modal');
        if (existingModal) existingModal.remove();

        let modalOverlay = document.createElement('div');
        modalOverlay.id = 'millennium-lore-modal';
        modalOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:99999999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';

        let modalBox = document.createElement('div');
        modalBox.style.cssText = 'background:linear-gradient(135deg, #2b1f0e 0%, #150f07 100%); border:3px solid #ffd700; border-radius:12px; width:480px; max-width:90vw; padding:25px; box-shadow:0 0 35px rgba(255,215,0,0.4); display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; color:#fff;';

        modalBox.innerHTML = `
            <div style="width:90px; height:90px; margin-bottom:15px; filter:${it.unlocked ? 'drop-shadow(0 0 12px #ffd700)' : 'grayscale(100%)'};">
                <svg viewBox="0 0 100 100" style="width:100%; height:100%;">${it.svgPath}</svg>
            </div>
            <div style="font-family:VT323, monospace; font-size:26px; color:#ffd700; text-shadow:2px 2px 0 #000; letter-spacing:1px;">
                ${it.name.toUpperCase()}
            </div>
            <div style="font-size:13px; color:#ffe082; font-weight:bold; margin-top:4px;">
                Portador Original: <span style="color:#fff;">${it.bearer}</span>
            </div>
            <div style="background:#1e1406; border:1px solid #b8860b; border-radius:6px; padding:6px 14px; font-size:12px; color:#ffd700; font-weight:bold; margin:14px 0 10px 0;">
                ⚡ ${it.power}
            </div>
            <div style="font-size:14px; color:#e0e0e0; line-height:1.5; margin-bottom:16px;">
                ${it.desc}
            </div>
            <div style="padding:8px 14px; border-radius:6px; font-size:12px; font-weight:bold; width:100%; box-sizing:border-box; margin-bottom:18px; ${it.unlocked ? 'background:#1b5e20; color:#a5d6a7; border:1px solid #4caf50;' : 'background:#3e2723; color:#ffccbc; border:1px solid #d84315;'}">
                ${it.unlocked ? '✨ RECUERDO Y PODER RECUPERADO · ACTIVO EN TU VIAJE' : '🔒 BLOQUEADO: ' + it.hint}
            </div>
            <button id="btn-close-lore-modal" style="background:linear-gradient(180deg, #ffd700 0%, #b8860b 100%); color:#000; border:none; padding:10px 28px; border-radius:6px; font-weight:900; font-size:14px; cursor:pointer; font-family:VT323, monospace; letter-spacing:1px; box-shadow:0 4px 10px rgba(0,0,0,0.6);">
                CERRAR
            </button>
        `;

        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        modalBox.querySelector('#btn-close-lore-modal').onclick = () => {
            window.playViolinClick && window.playViolinClick();
            modalOverlay.remove();
        };
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                window.playViolinClick && window.playViolinClick();
                modalOverlay.remove();
            }
        };
    }

    document.body.appendChild(overlay);
};

window.customFinishStoryDuel = function(win) {
    if (window._customDuelFinishing) return;
    window._customDuelFinishing = true;
    setTimeout(() => { window._customDuelFinishing = false; }, 3000);

    if (!window.nativeAPI) return;
    let s = window.nativeAPI.loadGame();
    let id = window.lastDuelOpponent || 'tristan';
    id = id.toLowerCase() === 'seto' ? 'kaiba' : id.toLowerCase();
    if (!s) return window.customShowMain();
    
    // PRESERVAR FUSIONES DESCUBIERTAS DURANTE EL DUELO
    try {
        let curAccount = window.activeAccount || localStorage.getItem('FMR_ACTIVE_ACCOUNT') || '';
        let curSavedStr = origGet(curAccount ? ('FMR_SAVE_' + curAccount) : 'FMR_REBORN_STORY_V3000');
        if (curSavedStr) {
            let curSaved = JSON.parse(curSavedStr);
            if (Array.isArray(curSaved.fusions)) {
                s.fusions = Array.from(new Set([...(s.fusions || []), ...curSaved.fusions]));
            }
        }
        if (window.memorySave && Array.isArray(window.memorySave.fusions)) {
            s.fusions = Array.from(new Set([...(s.fusions || []), ...window.memorySave.fusions]));
        }
    } catch(_) {}
    
    // Set duelOver flag so native engine doesn't loop
    if (typeof game !== 'undefined' && game) game.duelOver = true;
    window.storyDuelActive = false;
    window.duelHandled = true;
    if (window.nativeAPI) {
      if (typeof window.nativeAPI.setStoryDuelActive === 'function') window.nativeAPI.setStoryDuelActive(false);
      if (typeof window.nativeAPI.setDuelHandled === 'function') window.nativeAPI.setDuelHandled(true);
      if (typeof window.nativeAPI.setStoryDeckReady === 'function') window.nativeAPI.setStoryDeckReady(false);
    }
    try { storyDuelActive = false; } catch(_) {}
    try { duelHandled = true; } catch(_) {}
    try { storyDeckReady = false; } catch(_) {}
    
    try { document.getElementById('duelOver64').classList.remove('show'); } catch(e){}
    try { document.getElementById('deckOut67').classList.remove('show'); } catch(e){}
    let hud = document.getElementById('campaignDuelHud3000');
    if (hud) hud.style.display = 'none';
    let fieldBadge = document.getElementById('fmrActiveFieldBadge');
    if (fieldBadge) fieldBadge.style.display = 'none';
    if (typeof game !== 'undefined' && game) {
        if (game.fieldBoost === 'SPELLCASTER_VILLAGE' || game.fieldBoost === 'YAMI' || game.fieldBoost === 'MOUNTAIN') {
            game.fieldBoost = null;
            game.activeField = null;
        }
        if (typeof window.updateFieldBoardTheme === 'function') window.updateFieldBoardTheme(null);
    }
    // Do not call showShell here to avoid campaign3000 overlay sticking over duel rewards/dialogs
    
    if (!win) {
        s.losses = s.losses || {};
        s.losses[id] = (s.losses[id] || 0) + 1;
        s.pm = (s.pm || 0) + 50;
        s.lastPlayed = Date.now();
        if (window.persistUserSave) window.persistUserSave(s);
        else {
            origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
            origSet('FMR_REBORN_STORY_V3000', JSON.stringify(s));
        }
        
        let lossLines = [{ role: 'system', speaker: id.toUpperCase(), text: '¿Eso es todo lo que tienes? ¡Vuelve cuando seas más fuerte!' }];
        if (id === 'tristan') lossLines = [{ role: 'system', speaker: 'TRISTAN_INTRO', text: 'Jaja, te falta mucho para vencerme.' }];
        else if (id === 'mako') lossLines = [{ role: 'system', speaker: 'MAKO', text: '¡El mar no perdona a los débiles! Vuelve cuando puedas nadar contra la corriente.' }];
        else if (id === 'kosaburo') lossLines = [{ role: 'system', speaker: 'KOSABURO', text: '¡Necios! ¡Nadie puede oponerse al poder absoluto de Exodia Necross!' }];
        
        window.playCustomMusic('dialogos.mp3');
        window.renderCustomStoryDialog(lossLines, 0, () => {
            if (window.cleanAllOverlays) window.cleanAllOverlays();
            if (window.isFreeDuelMode && window.openFreeDuelMenu) {
                window.openFreeDuelMenu();
            } else {
                window.customShowMap();
            }
        });
    } else {
        s.wins = s.wins || {};
        s.wins[id] = (s.wins[id] || 0) + 1;
        if (!(s.cleared || []).includes(id)) s.cleared.push(id);
        if (!s.unlocked) s.unlocked = [];
        if (!s.unlocked.includes(id)) s.unlocked.push(id);
        const storyNextMap = { tristan: 'weevil', weevil: 'mai', mai: 'mako', mako: 'joey', joey: 'pegasus', pegasus: 'bakura', bakura: 'noah', noah: 'kosaburo', kosaburo: 'ishizu', ishizu: 'odion', odion: 'marik', marik: 'kaiba', kaiba: 'yugi', yugi: 'atem' };
        const nextOpp = storyNextMap[id] || (typeof STORY_UNLOCK_NEXT !== 'undefined' && STORY_UNLOCK_NEXT[id]);
        if (nextOpp && !s.unlocked.includes(nextOpp)) s.unlocked.push(nextOpp);
        
        let rank = 'B';
        if (typeof game !== 'undefined' && game && game.plp !== undefined) {
            rank = game.plp >= 7000 ? 'S' : (game.plp >= 5000 ? 'A' : (game.plp >= 3000 ? 'B' : 'C'));
        }
        let bonus = { S: 250, A: 175, B: 100, C: 50 }[rank] || 100;
        let gain = 150 + bonus;
        s.pm = (s.pm || 0) + gain;
        s.lastPlayed = Date.now();
        if (window.persistUserSave) window.persistUserSave(s);
        else {
            origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
            origSet('FMR_REBORN_STORY_V3000', JSON.stringify(s));
        }
        
        let winLines = [{ role: 'system', speaker: id.toUpperCase(), text: '¡Increíble! Has demostrado tu valía como duelista.' }];
        if (id === 'tristan') {
            winLines = [{ role: 'system', speaker: 'TRISTAN_INTRO', text: 'Vaya... no esperaba que fueras tan fuerte. ¡Adelante, el camino de los duelistas es tuyo!' }];
        } else if (id === 'weevil') {
            winLines = [{ role: 'system', speaker: 'WEEVIL', text: '¡Maldición! Mis insectos perfectos fueron aplastados. Mai es la siguiente, buena suerte intentando descifrar su estrategia de viento.' }];
        } else if (id === 'mai') {
            winLines = [{ role: 'system', speaker: 'MAI', text: 'Bien jugado. Tienes un instinto excelente para el duelo. Joey está esperando para enfrentarte en la costa. ¡Demuéstrale lo que has aprendido!' }];
        } else if (id === 'mako') {
            winLines = [{ role: 'system', speaker: 'MAKO', text: '¡Increíble navegación! Has domado las aguas más salvajes. Tienes el espíritu de un verdadero guerrero del mar.' }];
        } else if (id === 'joey') {
            winLines = [
                { role: 'system', speaker: 'JOEY', text: '¡Guau! Me diste una buena paliza. Tus fusiones y combos son impresionantes.' },
                { role: 'system', speaker: 'JOEY', text: '¡Oye! Casi lo olvido. Toma esto, es la Llave del Milenio. ¡Te servirá para abrir la Puerta del Nuevo Mundo cuando reúnas los demás artículos!' }
            ];
        } else if (id === 'pegasus') {
            winLines = [
                { role: 'system', speaker: 'PEGASUS', text: '¡Oh, boy! Mi magia del Reino de los Duelistas no pudo con tu asombrosa baraja.' },
                { role: 'system', speaker: 'PEGASUS', text: '¡Maravilloso! Toma mi Ojo del Milenio como premio sagrado. Sin duda lo vas a necesitar para cruzar al Nuevo Mundo.' }
            ];
        } else if (id === 'bakura') {
            winLines = [
                { role: 'system', speaker: 'BAKURA', text: 'Ja, ja, ja... Así que pudiste sobrevivir a las sombras del cementerio. Eres un duelista extraordinario.' },
                { role: 'system', speaker: 'BAKURA', text: 'Llévate la Sortija del Milenio. Sus agujas místicas te guiarán directo hacia las demás reliquias.' }
            ];
        } else if (id === 'noah') {
            winLines = [{ role: 'system', speaker: 'NOAH', text: 'Imposible... Mis cálculos virtuales fallaron contra ti. Los duelos tienen corazón... Avanza y enfréntate a la familia Kaiba.' }];
        } else if (id === 'kosaburo') {
            winLines = [{ role: 'system', speaker: 'KOSABURO', text: '¡Maldición...! ¿Cómo has podido superar la fuerza infinita de Exodia Necross...?' }];
        } else if (id === 'ishizu') {
            winLines = [
                { role: 'system', speaker: 'ISHIZU', text: 'Mi visión del futuro fue alterada por tu determinación... El destino se doblega ante tu espíritu.' },
                { role: 'system', speaker: 'ISHIZU', text: 'Te entrego el Collar del Milenio. Las puertas sagradas del Nuevo Mundo te esperan cuando llegue el momento.' }
            ];
        } else if (id === 'odion') {
            winLines = [{ role: 'system', speaker: 'ODION', text: 'Has demostrado ser digno al atravesar mi defensa de trampas. Sigue adelante, el Amo Marik te está esperando.' }];
        } else if (id === 'marik') {
            winLines = [
                { role: 'system', speaker: 'MARIK', text: 'La oscuridad de Ra no pudo incinerarte... Reconozco mi derrota en este Duelo de las Sombras.' },
                { role: 'system', speaker: 'MARIK', text: 'Llévate el Cetro del Milenio. El Nuevo Mundo está casi a tu alcance... pero Atem te espera.' }
            ];
        } else if (id === 'kaiba' || id === 'seto') {
            winLines = [
                { role: 'system', speaker: 'SETO', text: 'Hmph. Has mejorado desde la última vez, lo admito. Pero mi Dragón Blanco de Ojos Azules volverá a desafiarte.' },
                { role: 'system', speaker: 'SETO', text: 'Aquí tienes la Balanza del Milenio. No dejes que nadie se interponga en tu camino al Nuevo Mundo.' }
            ];
        } else if (id === 'yugi') {
            winLines = [
                { role: 'system', speaker: 'YUGI', text: '¡Ese fue un duelo supremo y legendario! Me enseñaste el verdadero significado de confiar en el Corazón de las Cartas.' },
                { role: 'system', speaker: 'YUGI', text: 'Eres digno de portar el Rompecabezas del Milenio. ¡Ahora tienes los 7 Artículos Sagrados para abrir la Puerta del Nuevo Mundo!' }
            ];
        }
        
        // Show 3-card reward choice screen for the defeated character
        window.showCustomDuelRewardChoice(id, rank, gain, () => {
            window.playCustomMusic('dialogos.mp3');
            window.renderCustomStoryDialog(winLines, 0, () => {
                const nextStep = () => {
                    if (window.cleanAllOverlays) window.cleanAllOverlays();
                    if (window.isFreeDuelMode && window.openFreeDuelMenu) {
                        window.openFreeDuelMenu();
                    } else {
                        window.customShowMap();
                    }
                };

                // Check if this defeated opponent carries a Millennium Item
                const allItems = window.getMillenniumItems ? window.getMillenniumItems(s) : [];
                const wonItem = allItems.find(it => {
                    const b = (it.bearerId || '').toLowerCase();
                    return b === id.toLowerCase() || (b === 'kaiba' && id.toLowerCase() === 'seto');
                });
                
                const claimKey = 'FMR_ITEM_CLAIMED_' + id.toLowerCase();
                const alreadyClaimed = origGet(claimKey);
                
                if (wonItem && !alreadyClaimed) {
                    origSet(claimKey, '1');
                    if (window.showMillenniumItemCelebration) {
                        window.showMillenniumItemCelebration(wonItem, id, nextStep);
                    } else {
                        nextStep();
                    }
                } else {
                    nextStep();
                }
            });
        });
    }
};

// endObserver removed to allow native finishStoryDuel hook to take over


  // Generador dinámico de Barajas Iniciales estilo Yu-Gi-Oh! Forbidden Memories (PS1)
  window.generateForbiddenMemoriesStarterDeck = function(customCatalog) {
    var catalog = (Array.isArray(customCatalog) && customCatalog.length > 0) ? customCatalog : (window.CARDS_DATA || []);
    if (!catalog || catalog.length === 0) return null;
    var deck = [];
    var cardCounts = {};

    function addCard(name) {
      if (!name) return false;
      if ((cardCounts[name] || 0) >= 2) return false; // Máximo 2 copias por carta
      deck.push(name);
      cardCounts[name] = (cardCounts[name] || 0) + 1;
      return true;
    }

    function pickRandom(pool, count, maxTries) {
      if (!pool || pool.length === 0) return;
      var added = 0;
      var tries = 0;
      var limit = maxTries || 150;
      while (added < count && tries < limit) {
        tries++;
        var pick = pool[Math.floor(Math.random() * pool.length)];
        var name = pick.name || pick[0];
        if (addCard(name)) {
          added++;
        }
      }
    }

    var mainCards = catalog.filter(function(c) {
      var k = c.kind || c.type || '';
      return k !== 'FUSION' && k !== 'LINK' && c.type !== 'Divine-Beast' && c.type !== 'Ritual';
    });

    // 1. As / Jefe
    var acePool = mainCards.filter(function(c) {
      return c.kind === 'MONSTER' &&
        (c.level >= 5 && c.level <= 7) &&
        (((c.atk || 0) >= 1600 && (c.atk || 0) <= 2500) || (c.def || 0) >= 2000);
    });
    pickRandom(acePool, 1);

    // 2. Fuertes Nivel 4
    var strongL4Pool = mainCards.filter(function(c) {
      return c.kind === 'MONSTER' &&
        (c.level <= 4) &&
        (((c.atk || 0) >= 1200 && (c.atk || 0) <= 1600) || ((c.def || 0) >= 1800 && (c.def || 0) <= 2100));
    });
    pickRandom(strongL4Pool, 3);

    // 3. Materiales de fusión
    var dragons = mainCards.filter(function(c) { return c.kind === 'MONSTER' && (c.type === 'Dragon' || (c.name && c.name.toLowerCase().indexOf('dragon') >= 0)) && ((c.atk || 0) <= 1500 || c.level <= 4); });
    var thunderMachine = mainCards.filter(function(c) { return c.kind === 'MONSTER' && (c.type === 'Thunder' || c.type === 'Machine') && ((c.atk || 0) <= 1400 || c.level <= 4); });
    var warriors = mainCards.filter(function(c) { return c.kind === 'MONSTER' && c.type === 'Warrior' && ((c.atk || 0) <= 1400 || c.level <= 4); });
    var pyros = mainCards.filter(function(c) { return c.kind === 'MONSTER' && (c.type === 'Pyro' || c.attr === 'FIRE') && ((c.atk || 0) <= 1400 || c.level <= 4); });
    var beasts = mainCards.filter(function(c) { return c.kind === 'MONSTER' && (c.type === 'Beast' || c.type === 'Beast-Warrior') && ((c.atk || 0) <= 1400 || c.level <= 4); });
    var spellcastersFiends = mainCards.filter(function(c) { return c.kind === 'MONSTER' && (c.type === 'Spellcaster' || c.type === 'Fiend') && ((c.atk || 0) <= 1400 || c.level <= 4); });
    var others = mainCards.filter(function(c) { return c.kind === 'MONSTER' && ['Plant', 'Insect', 'Aqua', 'Zombie', 'Rock', 'Fish', 'Fairy', 'Winged Beast'].indexOf(c.type) >= 0 && ((c.atk || 0) <= 1400 || c.level <= 4); });
    var anyLowMonster = mainCards.filter(function(c) { return c.kind === 'MONSTER' && (c.level <= 4 || (c.atk || 0) <= 1400); });

    pickRandom(dragons, 3);
    pickRandom(thunderMachine, 3);
    pickRandom(warriors, 3);
    pickRandom(pyros, 3);
    pickRandom(beasts, 3);
    pickRandom(spellcastersFiends, 3);
    pickRandom(others, 3);
    pickRandom(anyLowMonster, 28 - deck.length);

    // 4. Mágicas / Equipos completamente programados
    var PROGRAMMED_STARTER_SPELLS = [
      'Axe of Despair', 'Black Pendant', 'Horn of the Unicorn', 'Dragon Treasure',
      'Malevolent Nuzzler', 'Sword of Dark Destruction', 'Dark Energy', 'Invigoration',
      'Electro-whip', 'Cyber Shield', 'Mystical Moon', 'Silver Bow and Arrow',
      'Book of Secret Arts', "Elf's Light", 'Beast Fangs', 'Steel Shell', 'Vile Germs',
      'Kunai with Chain', 'Fusion Weapon', 'United We Stand', 'Legendary Sword',
      'Laser Cannon Armor', 'Insect Armor with Laser Cannon', 'Horn of Light',
      'Machine Conversion Factory', 'Raise Body Heat', 'Follow Wind', 'Power of Kaishin',
      'Violet Crystal', 'Shine Palace', 'Salamandra',
      'Pot of Greed', 'Graceful Charity', 'Renace al Monstruo', 'Fissure', 'Stop Defense',
      'Dragon Capture Jar', 'Dian Keto the Cure Master', 'Soul of the Pure',
      "Goblin's Secret Remedy", 'Red Medicine', 'Mooyan Curry', 'Ookazi', 'Hinotama',
      'Sparks', 'Final Flame', 'Tremendous Fire',
      'Mountain', 'Yami', 'Umi', 'Forest', 'Wasteland', 'Sogen', 'Swords of Revealing Light'
    ];
    var spellPool = mainCards.filter(function(c) {
      return (c.kind === 'SPELL' || c.kind === 'EQUIP') && PROGRAMMED_STARTER_SPELLS.indexOf(c.name) >= 0;
    });
    pickRandom(spellPool, 6);

    // 5. Trampas completamente programadas
    var PROGRAMMED_STARTER_TRAPS = [
      'Trap Hole', 'Acid Trap Hole', 'Sakuretsu Armor', 'Waboku', 'Dust Tornado',
      'Negate Attack', 'Widespread Ruin', 'Eatgaboon', 'Bear Trap', 'Invisible Wire',
      'Threatening Roar'
    ];
    var trapPool = mainCards.filter(function(c) {
      return c.kind === 'TRAP' && PROGRAMMED_STARTER_TRAPS.indexOf(c.name) >= 0;
    });
    pickRandom(trapPool, 6);

    while (deck.length < 40) {
      pickRandom(anyLowMonster, 1, 200);
    }

    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }

    return deck.slice(0, 40);
  };

window.customShowDeckEditor = function() {
    let saveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
    let sStr = origGet(saveKey) || origGet('FMR_REBORN_STORY_V3000');
    if (!sStr) return;
    let s = JSON.parse(sStr);
    
    const generatedDeck = (typeof window.generateForbiddenMemoriesStarterDeck === 'function') ? window.generateForbiddenMemoriesStarterDeck() : null;
    const DEF = (generatedDeck && generatedDeck.length === 40) ? generatedDeck : (window.DEFAULT_DECK || []);
    
    s.collection = s.collection || {};
    s.decks = s.decks || {};
    if (typeof window.cleanSaveCollection === 'function') window.cleanSaveCollection(s);
    if (!s.deck || s.deck.length === 0) {
        s.deck = [...DEF];
        DEF.forEach(n => s.collection[n] = Math.max(s.collection[n] || 0, DEF.filter(x => x === n).length));
    }
    if (Object.keys(s.decks).length === 0) {
        s.decks['Deck 1'] = [...s.deck];
    }
    if (!s.activeDeck || !s.decks[s.activeDeck]) {
        s.activeDeck = Object.keys(s.decks)[0] || 'Deck 1';
    }
    if (s.decks[s.activeDeck]) {
        s.deck = [...s.decks[s.activeDeck]];
    }
    
    let currentDeckKey = s.activeDeck;

    function persistSave() {
        if (s.decks && s.activeDeck && s.decks[s.activeDeck]) {
            s.deck = [...s.decks[s.activeDeck]];
        }
        if (window.persistUserSave) {
            window.persistUserSave(s);
        } else {
            let curSaveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
            origSet(curSaveKey, JSON.stringify(s));
            origSet('FMR_REBORN_STORY_V3000', JSON.stringify(s));
            if (window.nativeAPI && window.nativeAPI.setMemorySave) window.nativeAPI.setMemorySave(s);
        }
    }
    
    let overlay = document.createElement('div');
    overlay.id = 'custom-deck-editor';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: #1a1a1a; z-index:9999999; display:flex; flex-direction:row; padding: 20px; box-sizing:border-box; color: #fff; font-family: "Segoe UI", Arial, sans-serif;';
    
    // LEFT SIDEBAR for Preview
    let leftSide = document.createElement('div');
    leftSide.id = 'deck-editor-left-preview';
    leftSide.style.cssText = 'width: 320px; display:flex; flex-direction:column; margin-right: 20px; border-right: 2px solid #333; padding-right: 20px;';
    
    let previewImgWrap = document.createElement('div');
    previewImgWrap.id = 'deck-preview-img-wrap';
    previewImgWrap.style.cssText = 'width:100%; height: 460px; border: 3px solid #a67c00; border-radius: 8px; background: #000; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 15px #000;';
    
    let previewImg = document.createElement('img');
    previewImg.src = 'https://i.imgur.com/vHqR8Kq.png';
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:contain; background:#000;';
    previewImgWrap.appendChild(previewImg);
    
    let previewText = document.createElement('div');
    previewText.id = 'deck-preview-text';
    previewText.style.cssText = 'margin-top: 15px; background: #222; padding: 15px; border-radius: 6px; border: 1px solid #444; min-height: 150px;';
    previewText.innerHTML = '<i>Pasa el ratón sobre una carta para ver sus detalles.</i>';
    
    leftSide.appendChild(previewImgWrap);
    leftSide.appendChild(previewText);
    overlay.appendChild(leftSide);
    
    // RIGHT SIDE (MAIN)
    let rightSide = document.createElement('div');
    rightSide.id = 'deck-editor-right-main';
    rightSide.style.cssText = 'flex: 1; display:flex; flex-direction:column; overflow:hidden;';
    
    let header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e4c06b; padding-bottom: 10px; margin-bottom: 8px; flex-shrink:0;';
    header.innerHTML = `
        <div style="font-family:VT323, monospace; color:#ffcc00; font-size: 24px; text-shadow: 2px 2px 0 #000;">DASHBOARD DEL DECK</div>
        <input type="text" id="deck-search" placeholder="Buscar nombre..." autocomplete="off" style="padding: 8px 12px; border-radius: 6px; border: 1px solid #555; background: #222; color: #fff; font-family:'Segoe UI'; width: 200px; font-size: 14px;">
        <div style="font-size: 16px; font-weight: bold; background: #333; padding: 6px 16px; border-radius: 8px; border: 1px solid #555;" id="deck-count"></div>
        <button id="btn-exit-deck" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:8px 18px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:VT323, monospace; font-size:16px;">VOLVER</button>
    `;
    rightSide.appendChild(header);

    // DECK MANAGEMENT TOOLBAR
    let deckBar = document.createElement('div');
    deckBar.id = 'deck-manager-bar';
    deckBar.style.cssText = 'display:flex; align-items:center; gap:10px; background:#1b2430; padding:8px 12px; border-radius:6px; border:1px solid #336699; margin-bottom:8px; flex-shrink:0; flex-wrap:wrap;';
    rightSide.appendChild(deckBar);

    let filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex; gap:8px; margin-bottom: 8px; align-items:center; flex-wrap:wrap; font-size: 13px; flex-shrink:0;';
    filterBar.innerHTML = `
        <select id="filter-cardtype" style="padding: 6px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todas las cartas</option>
            <option value="MONSTER">Solo Monstruos</option>
            <option value="SPELL">Solo Magias (Todas)</option>
            <option value="EQUIP">Solo Equipamientos</option>
            <option value="TRAP">Solo Trampas</option>
        </select>
        <select id="filter-attr" style="padding: 6px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todos los Atributos</option>
            <option value="LIGHT">LUZ</option>
            <option value="DARK">OSCURIDAD</option>
            <option value="EARTH">TIERRA</option>
            <option value="WATER">AGUA</option>
            <option value="FIRE">FUEGO</option>
            <option value="WIND">VIENTO</option>
        </select>
        <select id="filter-type" style="padding: 6px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todos los Tipos</option>
            <option value="Dragon">Dragón</option>
            <option value="Spellcaster">Lanzador de Conjuros</option>
            <option value="Zombie">Zombi</option>
            <option value="Warrior">Guerrero</option>
            <option value="Beast-Warrior">Guerrero-Bestia</option>
            <option value="Beast">Bestia</option>
            <option value="Winged Beast">Bestia Alada</option>
            <option value="Fiend">Demonio</option>
            <option value="Fairy">Hada</option>
            <option value="Insect">Insecto</option>
            <option value="Dinosaur">Dinosaurio</option>
            <option value="Reptile">Reptil</option>
            <option value="Fish">Pez</option>
            <option value="Sea Serpent">Serpiente Marina</option>
            <option value="Machine">Máquina</option>
            <option value="Thunder">Trueno</option>
            <option value="Aqua">Aqua</option>
            <option value="Pyro">Piro</option>
            <option value="Rock">Roca</option>
            <option value="Plant">Planta</option>
        </select>
        <input type="number" id="filter-atk" placeholder="ATK Mín" style="padding: 6px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; width: 80px;">
        <input type="number" id="filter-def" placeholder="DEF Mín" style="padding: 6px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; width: 80px;">
    `;
    rightSide.appendChild(filterBar);

    let cardDict = {};
    let extraText = {};
    let globalNum = 1;
    
    function isAdvanced(c) {
        let kind = c.kind || (c[6] && typeof c[6] === 'string' ? c[6] : null);
        return kind === 'LINK' || kind === 'XYZ' || kind === 'SYNCHRO' || kind === 'PENDULUM';
    }
    
    function isExtraDeck(c) {
        if (!c) return false;
        let tags = c.tags || (c[8] || []);
        let kind = c.kind || (c[6] && typeof c[6] === 'string' ? c[6] : null) || c.type;
        return kind === 'FUSION' || tags.includes('FUSION') || (typeof kind === 'string' && kind.toLowerCase().includes('fusion'));
    }

    if (window.FMR_CARD_META) {
        Object.values(window.FMR_CARD_META).forEach((c) => {
            if (isAdvanced(c)) return;
            let cdKind = String(c.kind || '').toUpperCase();
            if (cdKind === 'SPELL' || cdKind === 'TRAP' || cdKind === 'EQUIP' || cdKind === 'FIELD') return;
            if (!cardDict[c.name]) {
                let rawNum = window.CARD_MAPPINGS ? (window.CARD_MAPPINGS[c.name] || globalNum++) : globalNum++;
                let num = typeof rawNum === 'number' ? rawNum : (parseInt(String(rawNum || '').replace(/[^\d]/g, ''), 10) || 0);
                cardDict[c.name] = { 
                    num: num, name: c.name, type: c.type, attr: c.attr, 
                    atk: c.atk, def: c.def, sign: (c.sign1 || '-') + (c.sign2 ? ' / ' + c.sign2 : ''), 
                    isMonster: true, isExtra: isExtraDeck(c) 
                };
            }
        });
    }
    if (window.FMR_ST_POOL_V1) {
        window.FMR_ST_POOL_V1.forEach((c) => {
            if (isAdvanced(c)) return;
            if (!cardDict[c.name]) {
                let rawNum = window.CARD_MAPPINGS ? (window.CARD_MAPPINGS[c.name] || globalNum++) : globalNum++;
                let num = typeof rawNum === 'number' ? rawNum : (parseInt(String(rawNum || '').replace(/[^\d]/g, ''), 10) || 0);
                cardDict[c.name] = { 
                    num: num, name: c.name, type: c.kind, attr: '-', 
                    atk: '-', def: '-', sign: '-', isMonster: false, isExtra: false 
                };
                extraText[c.name] = c.text || '';
            }
        });
    }
    let gDict = window.getGlobalCardDict ? window.getGlobalCardDict() : {};
    Object.keys(gDict).forEach(name => {
        if (!cardDict[name]) {
            cardDict[name] = Object.assign({}, gDict[name], { isExtra: isExtraDeck(gDict[name]) });
        }
    });

    if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
        window.CARDS_DATA.forEach(cd => {
            if (!cd || !cd.name || cardDict[cd.name]) return;
            let meta = window.getCardMetadata ? window.getCardMetadata(cd.name) : null;
            if (meta) {
                cardDict[cd.name] = {
                    num: meta.num || 0,
                    name: meta.name,
                    type: meta.type || 'Monstruo',
                    attr: meta.attr || '-',
                    atk: meta.atk,
                    def: meta.def,
                    sign: '-',
                    isMonster: meta.isMonster,
                    isExtra: isExtraDeck(cd)
                };
                if (meta.desc) extraText[cd.name] = meta.desc;
            }
        });
    }
    
    s.extra = s.extra || [];

    // Ensure all cards in any deck or extra are in collection count
    Object.values(s.decks).forEach(dArr => {
        if (Array.isArray(dArr)) dArr.forEach(n => { if ((s.collection[n] || 0) < 1) s.collection[n] = 1; });
    });
    s.extra.forEach(n => { if ((s.collection[n] || 0) < 1) s.collection[n] = 1; });

    let ownedSet = new Set(Object.keys(s.collection).filter(n => s.collection[n] > 0));
    Object.values(s.decks).forEach(dArr => {
        if (Array.isArray(dArr)) dArr.forEach(n => ownedSet.add(n));
    });
    s.extra.forEach(n => ownedSet.add(n));
    ownedSet.forEach(name => {
        if (typeof window.isCardProgrammed === 'function' && !window.isCardProgrammed(name)) {
            ownedSet.delete(name);
        }
    });

    // Fallback metadata for ANY card in ownedSet that isn't yet in cardDict
    ownedSet.forEach(name => {
        if (!cardDict[name]) {
            let meta = window.getCardMetadata ? window.getCardMetadata(name) : null;
            let rawNum = (meta && meta.num) || (window.CARD_MAPPINGS ? (window.CARD_MAPPINGS[name] || 999) : 999);
            let num = typeof rawNum === 'number' ? rawNum : (parseInt(String(rawNum || '').replace(/[^\d]/g, ''), 10) || 999);
            cardDict[name] = {
                num: num,
                name: (meta && meta.name) || name,
                type: (meta && meta.type) || 'Carta',
                attr: (meta && meta.attr) || '-',
                atk: (meta && meta.atk != null) ? meta.atk : '-',
                def: (meta && meta.def != null) ? meta.def : '-',
                sign: '-',
                isMonster: meta ? meta.isMonster : false,
                isExtra: isExtraDeck(meta)
            };
            if (meta && meta.desc) extraText[name] = meta.desc;
        }
    });

    let owned = Array.from(ownedSet);
    owned.sort((a, b) => (parseInt(String((cardDict[a] && cardDict[a].num) || 999).replace(/[^\d]/g, ''), 10) || 0) - (parseInt(String((cardDict[b] && cardDict[b].num) || 999).replace(/[^\d]/g, ''), 10) || 0));

    // CONTAINER FOR DUAL DASHBOARDS (Top: Deck, Bottom: Banca)
    let dualContainer = document.createElement('div');
    dualContainer.style.cssText = 'flex: 1; display:flex; flex-direction:column; gap:10px; overflow:hidden;';
    
    // 1. TOP SECTION: DECK ACTUAL
    let topSection = document.createElement('div');
    topSection.style.cssText = 'flex: 1; display:flex; flex-direction:column; min-height:180px; overflow:hidden; border: 1px solid #336699; border-radius: 8px; background: #16202d;';
    topSection.innerHTML = `
        <div style="background: linear-gradient(90deg, #1e3a5f, #0d1e33); padding: 8px 14px; display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #336699;">
            <div style="font-weight:bold; font-size:14px; color:#66c0f4; display:flex; align-items:center; gap:8px;">
                <span id="deck-section-title">⚔️ DECK</span>
                <span id="deck-status-badge" style="padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold;"></span>
            </div>
            <div style="font-size:12px; color:#aaa;">Cartas de este deck · Clic en <b>[ ⬇ Enviar a la Banca ]</b> para sacar una carta</div>
        </div>
        <div style="flex:1; overflow-y:auto; box-shadow: inset 0 0 10px #000;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
                <thead style="background:#1b2838; position:sticky; top:0; z-index:5;">
                    <tr>
                        <th style="padding:6px 10px; border-bottom:1px solid #336699; width:45px;">N°</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #336699;">Nombre</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #336699; width:110px;">Tipo</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #336699; width:100px;">ATK/DEF</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #336699; text-align:center; width:90px;">Zona</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #336699; text-align:center; width:110px;">En Deck</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #336699; text-align:center; width:160px;">Acción</th>
                    </tr>
                </thead>
                <tbody id="deck-tbody"></tbody>
            </table>
        </div>
    `;
    dualContainer.appendChild(topSection);

    // 2. BOTTOM SECTION: BANCA / BAÚL DE RESERVA
    let bottomSection = document.createElement('div');
    bottomSection.style.cssText = 'flex: 1; display:flex; flex-direction:column; min-height:180px; overflow:hidden; border: 1px solid #8b6b23; border-radius: 8px; background: #201b14;';
    bottomSection.innerHTML = `
        <div style="background: linear-gradient(90deg, #4a3810, #221a08); padding: 8px 14px; display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #8b6b23;">
            <div style="font-weight:bold; font-size:14px; color:#ffd700; display:flex; align-items:center; gap:8px;">
                <span>📦 BANCA / BAÚL DE RESERVA</span>
                <span id="bench-status-badge" style="padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold; background:#332600; color:#ffd700; border:1px solid #8b6b23;"></span>
            </div>
            <div style="font-size:12px; color:#ccc;">Cartas en tu baúl (ganadas en duelos/tienda) · Clic en <b>[ ⬆ Enviar al Deck ]</b> para añadir</div>
        </div>
        <div style="flex:1; overflow-y:auto; box-shadow: inset 0 0 10px #000;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
                <thead style="background:#2a2012; position:sticky; top:0; z-index:5;">
                    <tr>
                        <th style="padding:6px 10px; border-bottom:1px solid #8b6b23; width:45px;">N°</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #8b6b23;">Nombre</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #8b6b23; width:110px;">Tipo</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #8b6b23; width:100px;">ATK/DEF</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #8b6b23; text-align:center; width:90px;">Zona</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #8b6b23; text-align:center; width:110px;">Disponibles</th>
                        <th style="padding:6px 10px; border-bottom:1px solid #8b6b23; text-align:center; width:160px;">Acción</th>
                    </tr>
                </thead>
                <tbody id="banca-tbody"></tbody>
            </table>
        </div>
    `;
    dualContainer.appendChild(bottomSection);

    rightSide.appendChild(dualContainer);
    overlay.appendChild(rightSide);
    document.body.appendChild(overlay);

    let deckTbody = document.getElementById('deck-tbody');
    let bancaTbody = document.getElementById('banca-tbody');
    let searchInput = document.getElementById('deck-search');
    let typeSelect = document.getElementById('filter-cardtype');
    let attrSelect = document.getElementById('filter-attr');
    let raceSelect = document.getElementById('filter-type');
    let atkInput = document.getElementById('filter-atk');
    let defInput = document.getElementById('filter-def');

    let currentFilter = { text: '', cardType: '', attr: '', race: '', atk: 0, def: 0 };

    function applyFilters() {
        currentFilter.text = (searchInput.value || '').toLowerCase().trim();
        currentFilter.cardType = typeSelect.value;
        currentFilter.attr = attrSelect.value;
        currentFilter.race = raceSelect.value;
        currentFilter.atk = parseInt(atkInput.value) || 0;
        currentFilter.def = parseInt(defInput.value) || 0;
        renderRows();
    }

    searchInput.oninput = applyFilters;
    typeSelect.onchange = applyFilters;
    attrSelect.onchange = applyFilters;
    raceSelect.onchange = applyFilters;
    atkInput.oninput = applyFilters;
    defInput.oninput = applyFilters;

    function getCardImageUrl(name) {
        if (cardDict[name]) {
            let num = cardDict[name].num;
            if (window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[num]) {
                return window.CUSTOM_LOCAL_IMAGES[num];
            }
        }
        if (window.BANDAI_ART_FILES && window.BANDAI_ART_FILES[name]) return window.BANDAI_ART_FILES[name];
        if (window.CARD_FILES && window.CARD_FILES[name] && window.CARD_FILES[name].length > 0) {
            return 'https://yugioh.fandom.com/wiki/Special:Redirect/file/' + encodeURIComponent(window.CARD_FILES[name][0]);
        }
        return 'https://i.imgur.com/vHqR8Kq.png'; 
    }

    function matchesFilter(name, info) {
        if (currentFilter.text && !name.toLowerCase().includes(currentFilter.text)) return false;
        if (currentFilter.cardType) {
            var isSpell = (info.type === 'SPELL' || info.type === 'EQUIP' || info.kind === 'SPELL' || info.kind === 'EQUIP' || (typeof isEquipSpell === 'function' && isEquipSpell(info)) || (!info.isMonster && info.type !== 'TRAP'));
            var isEquip = (info.type === 'EQUIP' || info.kind === 'EQUIP' || (typeof isEquipSpell === 'function' && isEquipSpell(info)));
            var isTrap = (info.type === 'TRAP' || info.kind === 'TRAP');
            if (currentFilter.cardType === 'MONSTER' && !info.isMonster) return false;
            if (currentFilter.cardType === 'SPELL' && !isSpell) return false;
            if (currentFilter.cardType === 'EQUIP' && !isEquip) return false;
            if (currentFilter.cardType === 'TRAP' && !isTrap) return false;
        }
        if (currentFilter.attr && info.attr !== currentFilter.attr) return false;
        if (currentFilter.race && info.type !== currentFilter.race) return false;
        if (info.isMonster) {
            if (currentFilter.atk > 0 && info.atk < currentFilter.atk) return false;
            if (currentFilter.def > 0 && info.def < currentFilter.def) return false;
        } else {
            if (currentFilter.atk > 0 || currentFilter.def > 0) return false;
        }
        return true;
    }

    function wireHover(tr, name, info, cardColor) {
        tr.onmouseover = () => {
            tr.style.background = '#2a2a2a';
            previewImg.src = getCardImageUrl(name);
            let txt = extraText[name] ? `<div style="margin-top:10px; color:#ffeb3b; font-size:13px;">${extraText[name]}</div>` : '';
            let atkDef = info.isMonster ? `<br><br><span style="color:#ff5252">ATK ${info.atk}</span> / <span style="color:#2196f3">DEF ${info.def}</span>` : '';
            previewText.innerHTML = `
                <div style="font-weight:bold; font-size:18px; color:${cardColor}; margin-bottom: 5px;">${info.name}</div>
                <div style="font-size:13px; color:#aaa;">[${info.type}] ${info.attr !== '-' ? ' · ' + info.attr : ''} ${info.isMonster ? ' · ' + info.sign : ''}</div>
                ${atkDef}
                ${txt}
            `;
        };
        tr.onmouseout = () => tr.style.background = 'transparent';
    }

    function renderDeckBar() {
        let deckKeys = Object.keys(s.decks);
        if (deckKeys.length === 0) {
            s.decks['Deck 1'] = [...s.deck];
            deckKeys = ['Deck 1'];
        }
        if (!s.decks[currentDeckKey]) currentDeckKey = deckKeys[0];
        if (!s.activeDeck || !s.decks[s.activeDeck]) s.activeDeck = deckKeys[0];

        let isActive = (currentDeckKey === s.activeDeck);
        let curCount = (s.decks[currentDeckKey] || []).length;
        
        let optionsHtml = deckKeys.map(k => {
            let cnt = (s.decks[k] || []).length;
            let actTag = (k === s.activeDeck) ? ' ⭐ [DECK ACTIVO]' : '';
            return `<option value="${k}" ${k === currentDeckKey ? 'selected' : ''}>${k} (${cnt}/40)${actTag}</option>`;
        }).join('');

        deckBar.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:bold; color:#ffcc00; font-size:14px; font-family:VT323, monospace; letter-spacing:1px;">DECK:</span>
                <select id="deck-selector" style="background:#0e1722; color:#fff; font-weight:bold; padding:6px 12px; border:1px solid #4a90e2; border-radius:4px; font-size:13px; cursor:pointer;">
                    ${optionsHtml}
                </select>
            </div>
            
            <div id="deck-active-slot" style="display:flex; align-items:center; gap:6px;">
                ${isActive ? `
                    <span style="background:linear-gradient(180deg, #1b5e20, #0d3813); color:#a5d6a7; border:1px solid #4caf50; padding:5px 12px; border-radius:4px; font-weight:bold; font-size:12px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 0 8px rgba(76,175,80,0.4);">
                        ⭐ DECK ACTIVO EN COMBATE
                    </span>
                ` : `
                    <button id="btn-activate-current-deck" style="background:linear-gradient(180deg, #ffd700, #b8860b); color:#000; border:1px solid #fff; padding:5px 12px; border-radius:4px; font-weight:900; font-size:12px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.5);" title="Establecer este deck para todos los duelos">
                        ⭐ ESTABLECER COMO DECK ACTIVO
                    </button>
                `}
            </div>

            <div style="flex:1;"></div>

            <div style="display:flex; gap:6px;">
                <button id="btn-new-deck" style="background:linear-gradient(180deg, #2e7d32, #1b5e20); color:#fff; border:1px solid #4caf50; padding:6px 12px; border-radius:4px; font-weight:bold; font-size:12px; cursor:pointer;" title="Crear un nuevo deck">
                    ➕ Crear Deck
                </button>
                <button id="btn-rename-deck" style="background:linear-gradient(180deg, #0277bd, #01579b); color:#fff; border:1px solid #29b6f6; padding:6px 10px; border-radius:4px; font-weight:bold; font-size:12px; cursor:pointer;" title="Renombrar este deck">
                    ✏️ Renombrar
                </button>
                <button id="btn-delete-deck" style="background:linear-gradient(180deg, #c62828, #b71c1c); color:#fff; border:1px solid #ef5350; padding:6px 10px; border-radius:4px; font-weight:bold; font-size:12px; cursor:pointer; ${deckKeys.length <= 1 ? 'opacity:0.4; cursor:not-allowed;' : ''}" title="Eliminar este deck">
                    🗑️ Eliminar
                </button>
            </div>
        `;

        let sel = deckBar.querySelector('#deck-selector');
        sel.onchange = (e) => {
            currentDeckKey = e.target.value;
            window.playViolinClick && window.playViolinClick();
            renderDeckBar();
            renderRows();
        };

        let actBtn = deckBar.querySelector('#btn-activate-current-deck');
        if (actBtn) {
            actBtn.onclick = () => {
                let curArr = s.decks[currentDeckKey] || [];
                if (curArr.length !== 40) {
                    alert(`⚠️ Para activar este deck para los duelos debe tener EXACTAMENTE 40 cartas.\n(Actualmente tiene ${curArr.length}/40 cartas).`);
                    return;
                }
                s.activeDeck = currentDeckKey;
                s.deck = [...curArr];
                persistSave();
                window.playViolinClick && window.playViolinClick();
                alert(`✅ ¡"${currentDeckKey}" es ahora tu DECK ACTIVO para todos tus duelos!`);
                renderDeckBar();
                renderRows();
            };
        }

        let newBtn = deckBar.querySelector('#btn-new-deck');
        newBtn.onclick = () => {
            let nextNum = Object.keys(s.decks).length + 1;
            let name = prompt('Nombre para el nuevo Deck:', 'Deck ' + nextNum);
            if (!name) return;
            name = name.trim();
            if (!name) return;
            if (s.decks[name]) {
                alert('Ya existe un deck llamado "' + name + '". Por favor elige otro nombre.');
                return;
            }
            let copyCurrent = confirm(`¿Deseas duplicar las cartas del deck actual ("${currentDeckKey}") en el nuevo deck?\n\n(Aceptar = Duplicar actual / Cancelar = Iniciar deck vacío)`);
            s.decks[name] = copyCurrent ? [...(s.decks[currentDeckKey] || [])] : [];
            currentDeckKey = name;
            persistSave();
            window.playViolinClick && window.playViolinClick();
            renderDeckBar();
            renderRows();
        };

        let renBtn = deckBar.querySelector('#btn-rename-deck');
        renBtn.onclick = () => {
            let newName = prompt(`Nuevo nombre para "${currentDeckKey}":`, currentDeckKey);
            if (!newName) return;
            newName = newName.trim();
            if (!newName || newName === currentDeckKey) return;
            if (s.decks[newName]) {
                alert('Ya existe un deck llamado "' + newName + '".');
                return;
            }
            s.decks[newName] = s.decks[currentDeckKey];
            delete s.decks[currentDeckKey];
            if (s.activeDeck === currentDeckKey) {
                s.activeDeck = newName;
            }
            currentDeckKey = newName;
            persistSave();
            window.playViolinClick && window.playViolinClick();
            renderDeckBar();
            renderRows();
        };

        let delBtn = deckBar.querySelector('#btn-delete-deck');
        delBtn.onclick = () => {
            let keys = Object.keys(s.decks);
            if (keys.length <= 1) {
                alert('No puedes eliminar el único deck disponible.');
                return;
            }
            if (!confirm(`¿Seguro que deseas eliminar el deck "${currentDeckKey}"?\nEsta acción no se puede deshacer.`)) return;
            delete s.decks[currentDeckKey];
            if (s.activeDeck === currentDeckKey) {
                s.activeDeck = Object.keys(s.decks)[0];
                s.deck = [...s.decks[s.activeDeck]];
                alert(`⚠️ Se ha asignado "${s.activeDeck}" como tu nuevo Deck Activo.`);
            }
            currentDeckKey = s.activeDeck;
            persistSave();
            window.playViolinClick && window.playViolinClick();
            renderDeckBar();
            renderRows();
        };
    }

    function renderRows() {
        let currentDeck = s.decks[currentDeckKey] = s.decks[currentDeckKey] || [];
        let deckCounts = {};
        currentDeck.forEach(n => deckCounts[n] = (deckCounts[n] || 0) + 1);
        let exCounts = {};
        s.extra.forEach(n => exCounts[n] = (exCounts[n] || 0) + 1);

        let dLen = currentDeck.length;
        let isDeckValid = (dLen === 40);

        let titleEl = document.getElementById('deck-section-title');
        if (titleEl) {
            titleEl.textContent = `⚔️ ${currentDeckKey.toUpperCase()}` + (currentDeckKey === s.activeDeck ? ' ⭐ (ACTIVO)' : '');
        }

        document.getElementById('deck-count').innerHTML = `
            ${currentDeckKey.toUpperCase()}: <span style="color:${isDeckValid ? '#4caf50' : '#f44336'}">${dLen}</span>/40 
            <span style="color:#aaa; font-size:12px; margin:0 8px;">|</span> 
            EXTRA: <span style="color:${s.extra.length <= 15 ? '#2196f3' : '#f44336'}">${s.extra.length}</span>/15
        `;

        let statusBadge = document.getElementById('deck-status-badge');
        if (statusBadge) {
            if (isDeckValid) {
                statusBadge.textContent = '✓ 40/40 COMPLETO' + (currentDeckKey === s.activeDeck ? ' (ACTIVO)' : '');
                statusBadge.style.background = '#1b5e20';
                statusBadge.style.color = '#a5d6a7';
                statusBadge.style.border = '1px solid #4caf50';
            } else if (dLen < 40) {
                statusBadge.textContent = '⚠️ ' + dLen + '/40 (Faltan ' + (40 - dLen) + ' cartas)';
                statusBadge.style.background = '#b71c1c';
                statusBadge.style.color = '#ffcdd2';
                statusBadge.style.border = '1px solid #f44336';
            } else {
                statusBadge.textContent = '⚠️ ' + dLen + '/40 (Sobran ' + (dLen - 40) + ' cartas)';
                statusBadge.style.background = '#e65100';
                statusBadge.style.color = '#ffe0b2';
                statusBadge.style.border = '1px solid #ff9800';
            }
        }

        // Render 1: TOP TABLE (Cartas actualmente en el DECK SELECCIONADO)
        deckTbody.innerHTML = '';
        let deckUnique = Array.from(new Set(currentDeck.concat(s.extra))).filter(n => cardDict[n]);
        deckUnique.sort((a, b) => (parseInt(String(cardDict[a].num).replace(/[^\d]/g, ''), 10) || 0) - (parseInt(String(cardDict[b].num).replace(/[^\d]/g, ''), 10) || 0));

        let deckRowsRendered = 0;
        deckUnique.forEach(name => {
            let info = cardDict[name];
            if (!matchesFilter(name, info)) return;

            let inDeck = info.isExtra ? (exCounts[name] || 0) : (deckCounts[name] || 0);
            if (inDeck <= 0) return;

            deckRowsRendered++;
            let ownCount = s.collection[name] || inDeck;
            let cardColor = info.isMonster ? (info.isExtra ? '#9c27b0' : '#d4af37') : (info.type === 'TRAP' ? '#ff80ab' : '#4caf50');

            let tr = document.createElement('tr');
            tr.style.cssText = 'border-bottom: 1px solid #223344; transition: background 0.15s; cursor: pointer;';
            wireHover(tr, name, info, cardColor);

            tr.innerHTML = `
                <td style="padding: 6px 10px; color: #888;">#${String(info.num).replace(/[^\d]/g, '').padStart(3, '0')}</td>
                <td style="padding: 6px 10px; font-weight: bold; color: ${cardColor};">${info.name}</td>
                <td style="padding: 6px 10px;">${info.type}</td>
                <td style="padding: 6px 10px;">${info.isMonster ? `<span style="color:#ff5252">${info.atk}</span>/<span style="color:#2196f3">${info.def}</span>` : '-'}</td>
                <td style="padding: 6px 10px; text-align:center;">
                    <span style="background:${info.isExtra ? '#4a148c' : '#0d47a1'}; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">${info.isExtra ? 'EXTRA' : 'PRINCIPAL'}</span>
                </td>
                <td style="padding: 6px 10px; text-align:center; font-weight:bold;">
                    <span style="color:#4caf50;">x${inDeck}</span> <span style="color:#888; font-size:11px;">(Total: ${ownCount})</span>
                </td>
                <td style="padding: 6px 10px; text-align:center;">
                    <button class="bench-btn" style="background:#c62828; color:#fff; border:1px solid #ef5350; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px; display:inline-flex; align-items:center; gap:4px;">
                        ⬇ Enviar a la Banca
                    </button>
                </td>
            `;

            let benchBtn = tr.querySelector('.bench-btn');
            benchBtn.onclick = (e) => {
                e.stopPropagation();
                let arr = info.isExtra ? s.extra : currentDeck;
                let idx = arr.indexOf(name);
                if (idx >= 0) {
                    arr.splice(idx, 1);
                    if (currentDeckKey === s.activeDeck) {
                        s.deck = [...currentDeck];
                    }
                    persistSave();
                    window.playHoverSound && window.playHoverSound();
                    renderDeckBar();
                    renderRows();
                }
            };

            deckTbody.appendChild(tr);
        });

        if (deckRowsRendered === 0) {
            deckTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:18px; color:#888; font-style:italic;">No hay cartas en este deck que coincidan con la búsqueda.</td></tr>`;
        }

        // Render 2: BOTTOM TABLE (Cartas en BANCA / BAÚL)
        bancaTbody.innerHTML = '';
        let benchRowsRendered = 0;
        let totalBenchCards = 0;

        owned.forEach(name => {
            let info = cardDict[name];
            let ownCount = s.collection[name] || 0;
            let inDeck = info.isExtra ? (exCounts[name] || 0) : (deckCounts[name] || 0);
            let inBench = Math.max(0, ownCount - inDeck);
            totalBenchCards += inBench;

            if (inBench <= 0) return;
            if (!matchesFilter(name, info)) return;

            benchRowsRendered++;
            let maxC = 3;
            if (name === 'Renace al Monstruo' || name === 'Raigeki' || name === 'Dark Hole' || name === 'Llamado de la Tumba' || name === 'Fusión') maxC = 1;
            let canAddMore = (inDeck < maxC);

            let cardColor = info.isMonster ? (info.isExtra ? '#9c27b0' : '#d4af37') : (info.type === 'TRAP' ? '#ff80ab' : '#4caf50');

            let tr = document.createElement('tr');
            tr.style.cssText = 'border-bottom: 1px solid #3d301c; transition: background 0.15s; cursor: pointer;';
            wireHover(tr, name, info, cardColor);

            tr.innerHTML = `
                <td style="padding: 6px 10px; color: #888;">#${String(info.num).replace(/[^\d]/g, '').padStart(3, '0')}</td>
                <td style="padding: 6px 10px; font-weight: bold; color: ${cardColor};">${info.name}</td>
                <td style="padding: 6px 10px;">${info.type}</td>
                <td style="padding: 6px 10px;">${info.isMonster ? `<span style="color:#ff5252">${info.atk}</span>/<span style="color:#2196f3">${info.def}</span>` : '-'}</td>
                <td style="padding: 6px 10px; text-align:center;">
                    <span style="background:${info.isExtra ? '#4a148c' : '#332600'}; color:${info.isExtra ? '#fff' : '#ffd700'}; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; border:1px solid #665000;">${info.isExtra ? 'EXTRA' : 'PRINCIPAL'}</span>
                </td>
                <td style="padding: 6px 10px; text-align:center; font-weight:bold;">
                    <span style="color:#ffd700;">x${inBench}</span> <span style="color:#888; font-size:11px;">(Total: ${ownCount})</span>
                </td>
                <td style="padding: 6px 10px; text-align:center;">
                    <button class="deck-btn" style="background:#2e7d32; color:#fff; border:1px solid #4caf50; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px; display:inline-flex; align-items:center; gap:4px; ${!canAddMore ? 'opacity:0.5; cursor:not-allowed;' : ''}">
                        ⬆ Enviar al Deck
                    </button>
                </td>
            `;

            let deckBtn = tr.querySelector('.deck-btn');
            deckBtn.onclick = (e) => {
                e.stopPropagation();
                if (!canAddMore) {
                    alert('Ya tienes el límite máximo permitido (' + maxC + ') de ' + name + ' en este Deck.');
                    return;
                }

                if (info.isExtra) {
                    if (s.extra.length >= 15) {
                        alert('Tu Extra Deck ya tiene el límite de 15 cartas.');
                        return;
                    }
                    s.extra.push(name);
                    persistSave();
                    window.playHoverSound && window.playHoverSound();
                    renderRows();
                    return;
                }

                // Main Deck
                if (currentDeck.length < 40) {
                    currentDeck.push(name);
                    if (currentDeckKey === s.activeDeck) {
                        s.deck = [...currentDeck];
                    }
                    persistSave();
                    window.playHoverSound && window.playHoverSound();
                    renderDeckBar();
                    renderRows();
                } else {
                    // Deck has 40 cartas -> prompt to swap
                    let lowest = findLowestMonsterInDeck(currentDeck, cardDict);
                    if (confirm('El deck "' + currentDeckKey + '" ya tiene 40 cartas.\n\n¿Deseas enviar a la Banca a ' + lowest.name + ' (ATK ' + lowest.atk + ') para incluir a ' + name + '?\n\n(O puedes cancelar y enviar manualmente cualquier carta a la banca con [ ⬇ ]).')) {
                        currentDeck.splice(lowest.index, 1, name);
                        if (currentDeckKey === s.activeDeck) {
                            s.deck = [...currentDeck];
                        }
                        persistSave();
                        window.playHoverSound && window.playHoverSound();
                        renderDeckBar();
                        renderRows();
                    }
                }
            };

            bancaTbody.appendChild(tr);
        });

        let benchBadge = document.getElementById('bench-status-badge');
        if (benchBadge) {
            benchBadge.textContent = totalBenchCards + ' Cartas en Banca';
        }

        if (benchRowsRendered === 0) {
            bancaTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:18px; color:#888; font-style:italic;">No hay cartas en la Banca que coincidan con la búsqueda.</td></tr>`;
        }
    }

    renderDeckBar();
    renderRows();

    document.getElementById('btn-exit-deck').onclick = () => {
        let activeDeckCards = s.decks[s.activeDeck] || s.deck || [];
        if (activeDeckCards.length !== 40) {
            alert('⚠️ TU DECK ACTIVO NO ESTÁ LISTO (' + activeDeckCards.length + '/40) ⚠️\n\nTu Deck Activo ("' + (s.activeDeck || 'Principal') + '") debe tener EXACTAMENTE 40 cartas para poder salir y combatir en duelos.\n\nAsegúrate de seleccionarlo y agregar ' + (activeDeckCards.length < 40 ? (40 - activeDeckCards.length) + ' carta(s) desde la Banca [ ⬆ Enviar al Deck ].' : (activeDeckCards.length - 40) + ' carta(s) de más [ ⬇ Enviar a la Banca ].'));
            return;
        }
        s.deck = [...activeDeckCards];
        persistSave();
        window.playViolinClick && window.playViolinClick();
        overlay.remove();
        if (window.openCustomShopMenu) window.openCustomShopMenu();
    };
};

// Init Boot
setTimeout(() => {
    window.customShowMain();
}, 300);

// XYZ, Weevil & Mai Fusion Override
setTimeout(() => {
    if (typeof window.fusionResult === 'function') {
        const origFusionResult = window.fusionResult;
        window.fusionResult = function(names) {
            names = (names || []).filter(Boolean);
            if (names.length === 3 && names.includes('X-Head Cannon') && names.includes('Y-Dragon Head') && names.includes('Z-Metal Tank')) {
                return 'XYZ-Dragon Cannon';
            }
            if (names.length === 2) {
                // WEEVIL FUSIONS
                if (names.includes('Cocoon of Evolution') && (names.includes('Petit Moth') || names.includes('petit moth'))) {
                    return 'Great Moth';
                }
                if (names.includes('Great Moth') && names.includes('Cocoon of Evolution')) {
                    return 'Perfectbly Ultimate Great Moth';
                }

                // MAI FUSIONS: Harpie's Pet Dragon = Harpie's Pet Baby Dragon + Cualquier Harpie o Amazona
                const isBabyDragon = names.some(n => n.toLowerCase().includes("pet baby dragon"));
                if (isBabyDragon) {
                    const other = names.find(n => !n.toLowerCase().includes("pet baby dragon"));
                    if (other) {
                        const oLower = other.toLowerCase();
                        if (oLower.includes('harpie') || oLower.includes('amazon') || oLower.includes('amazona')) {
                            return "Harpie's Pet Dragon";
                        }
                    }
                }

                // JOEY FUSIONS:
                // 1) Alligator's Sword Dragon = Alligator's Sword + Baby Dragon
                if (names.includes("Alligator's Sword") && names.includes("Baby Dragon")) {
                    return "Alligator's Sword Dragon";
                }
                // 2) Thousand Dragon = Baby Dragon + Time Wizard
                if (names.includes("Baby Dragon") && names.includes("Time Wizard")) {
                    return "Thousand Dragon";
                }
                // 3) Black Skull Dragon = Red-Eyes Black Dragon + Summoned Skull / The Fiend Megacyber
                const hasRedEyes = names.some(n => n.toLowerCase().includes("red-eyes") || n.toLowerCase().includes("red eyes"));
                const hasFiend = names.some(n => {
                    const nl = n.toLowerCase();
                    return nl.includes("summoned skull") || nl.includes("the fiend megacyber") || nl.includes("megacyber");
                });
                if (hasRedEyes && hasFiend) {
                    return "Black Skull Dragon";
                }
                // 4) Flame Swordsman = Blue Flame Swordsman + Warrior (or Masaki + Flame Manipulator)
                const hasBlueFlame = names.some(n => n.toLowerCase().includes("blue flame swordsman"));
                const warriorNames = [
                    "axe raider", "gearfried the iron knight", "marauding captain",
                    "panther warrior", "rocket warrior", "little-winguard", "gilford the lightning",
                    "alligator's sword", "masaki the legendary swordsman"
                ];
                const hasWarrior = names.some(n => warriorNames.includes(n.toLowerCase()));
                if (hasBlueFlame && hasWarrior) {
                    return "Flame Swordsman";
                }
                // 5) Red-Eyes Black Dragon Sword = The Claw of Hermos + Dragon
                const hasHermos = names.some(n => n.toLowerCase().includes("claw of hermos") || n.toLowerCase().includes("hermos"));
                const hasDragon = names.some(n => {
                    const nl = n.toLowerCase();
                    return nl.includes("red-eyes") || nl.includes("baby dragon") || nl.includes("thousand dragon") || nl.includes("alligator's sword dragon") || nl.includes("black skull dragon") || nl.includes("dragon");
                });
                if (hasHermos && hasDragon) {
                    return "Red-Eyes Black Dragon Sword";
                }

                // MARIK FUSIONS:
                // 1) Egyptian God Slime = Slime + Ra/Metal/Guardian or Slime + Slime
                const hasSlime = names.some(n => n.toLowerCase().includes("slime"));
                const hasRaOrSlime = names.some(n => n.toLowerCase().includes("winged dragon of ra") || n.toLowerCase().includes("guardian slime") || n.toLowerCase().includes("metal reflect slime"));
                if (hasSlime && hasRaOrSlime && names[0].toLowerCase() !== names[1].toLowerCase()) {
                    return "Egyptian God Slime";
                }
                // 2) Humanoid Worm Drake = Humanoid Slime + Lekunga / Worm Drake
                const hasHumanoidSlime = names.some(n => n.toLowerCase().includes("humanoid slime"));
                const hasWormOrDrake = names.some(n => n.toLowerCase().includes("lekunga") || n.toLowerCase().includes("worm drake") || n.toLowerCase().includes("grand tiki elder"));
                if (hasHumanoidSlime && hasWormOrDrake) {
                    return "Humanoid Worm Drake";
                }

                // ODION FUSION:
                // Reaper on the Nightmare = Nightmare Horse + Spirit Reaper
                const hasNightmareHorse = names.some(n => n.toLowerCase().includes("nightmare horse"));
                const hasSpiritReaper = names.some(n => n.toLowerCase().includes("spirit reaper"));
                if (hasNightmareHorse && hasSpiritReaper) {
                    return "Reaper on the Nightmare";
                }

                // KAIBA FUSIONS:
                // 1) Blue-Eyes Ultimate Dragon = Blue-Eyes White Dragon + Blue-Eyes White Dragon
                const bewdCount = names.filter(n => n.toLowerCase().includes("blue-eyes white dragon") || n.toLowerCase().includes("ojos azules")).length;
                if (bewdCount >= 2) {
                    return "Blue-Eyes Ultimate Dragon";
                }
                // 2) Doom Virus Dragon = The Fang of Critias + Crush Card Virus
                const hasCritias = names.some(n => n.toLowerCase().includes("fang of critias") || n.toLowerCase().includes("critias"));
                const hasCrushCard = names.some(n => n.toLowerCase().includes("crush card virus") || n.toLowerCase().includes("crush card"));
                if (hasCritias && hasCrushCard) {
                    return "Doom Virus Dragon";
                }
                // 3) Tyrant Burst Dragon = The Fang of Critias + Tyrant Wing
                const hasTyrantWing = names.some(n => n.toLowerCase().includes("tyrant wing"));
                if (hasCritias && hasTyrantWing) {
                    return "Tyrant Burst Dragon";
                }
                // 4) XY-Dragon Cannon = X-Head Cannon + Y-Dragon Head
                const hasXHead = names.some(n => n.toLowerCase().includes("x-head cannon") || n.toLowerCase().includes("x head"));
                const hasYHead = names.some(n => n.toLowerCase().includes("y-dragon head") || n.toLowerCase().includes("y dragon"));
                const hasZTank = names.some(n => n.toLowerCase().includes("z-metal tank") || n.toLowerCase().includes("z metal"));
                if (hasXHead && hasYHead) {
                    return "XY-Dragon Cannon";
                }
                // 5) XZ-Tank Cannon = X-Head Cannon + Z-Metal Tank
                if (hasXHead && hasZTank) {
                    return "XZ-Tank Cannon";
                }
                // 6) YZ-Tank Dragon = Y-Dragon Head + Z-Metal Tank
                if (hasYHead && hasZTank) {
                    return "YZ-Tank Dragon";
                }
                // 7) XYZ-Dragon Cannon = XY-Dragon Cannon + Z-Metal Tank / XZ + Y / YZ + X
                const hasXY = names.some(n => n.toLowerCase().includes("xy-dragon"));
                const hasXZ = names.some(n => n.toLowerCase().includes("xz-tank"));
                const hasYZ = names.some(n => n.toLowerCase().includes("yz-tank"));
                if ((hasXY && hasZTank) || (hasXZ && hasYHead) || (hasYZ && hasXHead)) {
                    return "XYZ-Dragon Cannon";
                }

                // YUGI FUSIONS:
                // 1) Dark Paladin = Dark Magician + Buster Blader
                const hasDarkMagician = names.some(n => n.toLowerCase().includes("dark magician") && !n.toLowerCase().includes("girl"));
                const hasBusterBlader = names.some(n => n.toLowerCase().includes("buster blader"));
                if (hasDarkMagician && hasBusterBlader) {
                    return "Dark Paladin";
                }
                // 2) Chimera the Flying Mythical Beast = Gazelle the King of Mythical Beasts + Berfomet
                const hasGazelle = names.some(n => n.toLowerCase().includes("gazelle"));
                const hasBerfomet = names.some(n => n.toLowerCase().includes("berfomet"));
                if (hasGazelle && hasBerfomet) {
                    return "Chimera the Flying Mythical Beast";
                }
                // 3) Amulet Dragon = Dark Magician + Dragon
                const hasDragonCard = names.some(n => n.toLowerCase().includes("dragon") && !n.toLowerCase().includes("dark magician girl"));
                if (hasDarkMagician && hasDragonCard) {
                    return "Amulet Dragon";
                }
                // 4) Dark Magician Girl the Dragon Knight = Dark Magician Girl + Dragon
                const hasDMG = names.some(n => n.toLowerCase().includes("dark magician girl"));
                if (hasDMG && hasDragonCard) {
                    return "Dark Magician Girl the Dragon Knight";
                }
                // 5) Arcana Knight Joker = Queen's Knight + King's Knight / Jack's Knight
                const hasQueen = names.some(n => n.toLowerCase().includes("queen's knight") || n.toLowerCase().includes("queens knight"));
                const hasKing = names.some(n => n.toLowerCase().includes("king's knight") || n.toLowerCase().includes("kings knight"));
                const hasJack = names.some(n => n.toLowerCase().includes("jack's knight") || n.toLowerCase().includes("jacks knight"));
                if ((hasQueen && hasKing) || (hasQueen && hasJack) || (hasKing && hasJack)) {
                    return "Arcana Knight Joker";
                }
                // 6) Valkyrion the Magna Warrior = Magnet Warrior + Magnet Warrior
                const magnetCount = names.filter(n => n.toLowerCase().includes("magnet warrior")).length;
                if (magnetCount >= 2) {
                    return "Valkyrion the Magna Warrior";
                }

                // KOSABURO FUSIONS:
                // 1) Skull Knight = Ancient Brain + Tainted Wisdom
                const hasAncientBrain = names.some(n => n.toLowerCase().includes("ancient brain"));
                const hasTaintedWisdom = names.some(n => n.toLowerCase().includes("tainted wisdom"));
                if (hasAncientBrain && hasTaintedWisdom) {
                    return "Skull Knight";
                }
            }
            return origFusionResult(names);
        };
        try { fusionResult = window.fusionResult; } catch(_) {}
    }

    if (Array.isArray(window.FMR_FUSION_RULES_V1)) {
        window.FMR_FUSION_RULES_V1.push(
            { exact: ['Ancient Brain', 'Tainted Wisdom'], result: 'Skull Knight' },
            { exact: ['Tainted Wisdom', 'Ancient Brain'], result: 'Skull Knight' },
            { exact: ['Cocoon of Evolution', 'Petit Moth'], result: 'Great Moth' },
            { exact: ['Cocoon of Evolution', 'petit moth'], result: 'Great Moth' },
            { exact: ['Great Moth', 'Cocoon of Evolution'], result: 'Perfectbly Ultimate Great Moth' },
            { exact: ['Great Moth', 'Cocoon of Evolution'], result: 'Perfectbly Ultimate Great Moth' }
        );

        const harpieAmazonessList = [
            'Cyber Harpie Lady',
            'Harpie Lady Sisters',
            'Harpie Lady',
            'Amazoness Archer',
            'Amazoness Blowpiper',
            'Amazoness Chain Master',
            'Amazoness Fighter',
            'Amazoness Paladin',
            'Amazoness Sage',
            'Amazoness Swords Woman',
            'Amazoness Trainee',
            'The Unfriendly Amazon'
        ];
        harpieAmazonessList.forEach(m => {
            window.FMR_FUSION_RULES_V1.push(
                { exact: ["Harpie's Pet Baby Dragon", m], result: "Harpie's Pet Dragon" }
            );
        });

        // JOEY FUSIONS IN RULES
        window.FMR_FUSION_RULES_V1.push(
            { exact: ["Alligator's Sword", "Baby Dragon"], result: "Alligator's Sword Dragon" },
            { exact: ["Baby Dragon", "Time Wizard"], result: "Thousand Dragon" },
            { exact: ["Red-Eyes Black Dragon", "Summoned Skull"], result: "Black Skull Dragon" },
            { exact: ["Red-Eyes Black Dragon", "The Fiend Megacyber"], result: "Black Skull Dragon" },
            { exact: ["The Claw of Hermos", "Red-Eyes Black Dragon"], result: "Red-Eyes Black Dragon Sword" },
            { exact: ["The Claw of Hermos", "Baby Dragon"], result: "Red-Eyes Black Dragon Sword" },
            { exact: ["Blue Flame Swordsman", "Axe Raider"], result: "Flame Swordsman" },
            { exact: ["Blue Flame Swordsman", "Gearfried the Iron Knight"], result: "Flame Swordsman" },
            { exact: ["Blue Flame Swordsman", "Marauding Captain"], result: "Flame Swordsman" },
            { exact: ["Blue Flame Swordsman", "Panther Warrior"], result: "Flame Swordsman" },
            { exact: ["Blue Flame Swordsman", "Rocket Warrior"], result: "Flame Swordsman" },
            { exact: ["Blue Flame Swordsman", "Little-Winguard"], result: "Flame Swordsman" },
            { exact: ["Blue Flame Swordsman", "Alligator's Sword"], result: "Flame Swordsman" }
        );

        // MARIK FUSIONS IN RULES
        window.FMR_FUSION_RULES_V1.push(
            { exact: ["Guardian Slime", "The Winged Dragon of Ra"], result: "Egyptian God Slime" },
            { exact: ["Guardian Slime", "Metal Reflect Slime"], result: "Egyptian God Slime" },
            { exact: ["Guardian Slime", "Humanoid Slime"], result: "Egyptian God Slime" },
            { exact: ["Metal Reflect Slime", "The Winged Dragon of Ra"], result: "Egyptian God Slime" },
            { exact: ["Humanoid Slime", "Lekunga"], result: "Humanoid Worm Drake" },
            { exact: ["Humanoid Slime", "Grand Tiki Elder"], result: "Humanoid Worm Drake" }
        );

        // ODION FUSION IN RULES
        window.FMR_FUSION_RULES_V1.push(
            { exact: ["Nightmare Horse", "Spirit Reaper"], result: "Reaper on the Nightmare" }
        );

        // KAIBA FUSIONS IN RULES
        window.FMR_FUSION_RULES_V1.push(
            { exact: ["Blue-Eyes White Dragon", "Blue-Eyes White Dragon"], result: "Blue-Eyes Ultimate Dragon" },
            { exact: ["The Fang of Critias", "Crush Card Virus"], result: "Doom Virus Dragon" },
            { exact: ["The Fang of Critias", "Tyrant Wing"], result: "Tyrant Burst Dragon" },
            { exact: ["X-Head Cannon", "Y-Dragon Head"], result: "XY-Dragon Cannon" },
            { exact: ["X-Head Cannon", "Z-Metal Tank"], result: "XZ-Tank Cannon" },
            { exact: ["Y-Dragon Head", "Z-Metal Tank"], result: "YZ-Tank Dragon" },
            { exact: ["XY-Dragon Cannon", "Z-Metal Tank"], result: "XYZ-Dragon Cannon" },
            { exact: ["XZ-Tank Cannon", "Y-Dragon Head"], result: "XYZ-Dragon Cannon" },
            { exact: ["YZ-Tank Dragon", "X-Head Cannon"], result: "XYZ-Dragon Cannon" }
        );

        // YUGI FUSIONS IN RULES
        window.FMR_FUSION_RULES_V1.push(
            { exact: ["Dark Magician", "Buster Blader"], result: "Dark Paladin" },
            { exact: ["Gazelle the King of Mythical Beasts", "Berfomet"], result: "Chimera the Flying Mythical Beast" },
            { exact: ["Dark Magician", "Curse of Dragon"], result: "Amulet Dragon" },
            { exact: ["Dark Magician", "Baby Dragon"], result: "Amulet Dragon" },
            { exact: ["Dark Magician Girl", "Curse of Dragon"], result: "Dark Magician Girl the Dragon Knight" },
            { exact: ["Dark Magician Girl", "Baby Dragon"], result: "Dark Magician Girl the Dragon Knight" },
            { exact: ["Queen's Knight", "King's Knight"], result: "Arcana Knight Joker" },
            { exact: ["Queen's Knight", "Jack's Knight"], result: "Arcana Knight Joker" },
            { exact: ["King's Knight", "Jack's Knight"], result: "Arcana Knight Joker" },
            { exact: ["Alpha The Magnet Warrior", "Beta The Magnet Warrior"], result: "Valkyrion the Magna Warrior" },
            { exact: ["Alpha The Magnet Warrior", "Gamma the Magnet Warrior"], result: "Valkyrion the Magna Warrior" },
            { exact: ["Beta The Magnet Warrior", "Gamma the Magnet Warrior"], result: "Valkyrion the Magna Warrior" },
            // TRISTAN & CLASSIC EXACT FUSIONS
            { exact: ["Warrior Dai Grepher", "Spirit Ryu"], result: "Ryu Senshi" },
            { exact: ["Spirit Ryu", "Warrior Dai Grepher"], result: "Ryu Senshi" },
            { exact: ["Robolady", "Roboyarou"], result: "Super Roboyarou" },
            { exact: ["Roboyarou", "Robolady"], result: "Super Roboyarou" },
            { exact: ["Roboyarou", "Roboyarou"], result: "Super Roboyarou" },
            { exact: ["Robolady", "Robolady"], result: "Super Robolady" },
            { exact: ["Baby Dragon", "Thunder Dragon"], result: "Twin-Headed Thunder Dragon" },
            { exact: ["Thunder Dragon", "Baby Dragon"], result: "Twin-Headed Thunder Dragon" },
            { exact: ["Dragon Zombie", "Thunder Dragon"], result: "Maga Oscura" },
            { exact: ["Thunder Dragon", "Dragon Zombie"], result: "Maga Oscura" },
            { exact: ["Curse of Dragon", "Baby Dragon"], result: "Meteor Dragon" },
            { exact: ["Baby Dragon", "Curse of Dragon"], result: "Meteor Dragon" }
        );
    }
}, 500);

console.log('=== V5 CLEAN MASTER PATCH INJECTED ===');



// Build case-insensitive lookup cache for CARD_MAPPINGS
window.getCardNumber = function(cardName) {
    if (!cardName) return null;
    if (window.CARD_MAPPINGS && window.CARD_MAPPINGS[cardName]) return window.CARD_MAPPINGS[cardName];
    let norm = String(cardName).toLowerCase().trim();
    if (!window.CARD_MAPPINGS_LOWER && window.CARD_MAPPINGS) {
        window.CARD_MAPPINGS_LOWER = {};
        for (let k in window.CARD_MAPPINGS) {
            window.CARD_MAPPINGS_LOWER[k.toLowerCase().trim()] = window.CARD_MAPPINGS[k];
        }
    }
    if (window.CARD_MAPPINGS_LOWER && window.CARD_MAPPINGS_LOWER[norm]) {
        return window.CARD_MAPPINGS_LOWER[norm];
    }
    return null;
};

const originalCardHTML = window.cardHTML;
window.cardHTML = function(c, z, i) {
    let html = originalCardHTML ? originalCardHTML(c, z, i) : '';
    let name = c?.name || c?.[0] || '';
    let num = window.getCardNumber(name);
    if (num && window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[num]) {
        let localSrc = window.CUSTOM_LOCAL_IMAGES[num];
        let box = document.createElement('div');
        box.innerHTML = html;
        let art = box.querySelector('.cardArt');
        if (art) {
            art.innerHTML = '<img src="' + localSrc + '" style="width:100%;height:100%;object-fit:cover;object-position:top center;" />';
        }
        let fa = box.querySelector('.fieldArt');
        if (fa) {
            fa.innerHTML = '<img src="' + localSrc + '" style="width:100%;height:100%;object-fit:cover;object-position:top center;" />';
        }
        return box.innerHTML;
    }
    return html;
};

// Style to prevent badge collision and duplicate thumbnail slices on Spell/Trap cards
(function() {
  if (typeof document !== 'undefined' && document.head) {
    var stStyle = document.createElement('style');
    stStyle.id = 'fmr-clean-st-style';
    stStyle.textContent = `
      body.view-hand #hand .card.equipReady110:before,
      body.view-hand #hand .card.equipPotential110:before,
      body.view-hand #hand .card.equipReady110::before,
      body.view-hand #hand .card.equipPotential110::before {
        display: none !important;
        content: none !important;
      }
      .stBandaiArt {
        display: none !important;
      }
      .card.spell, .card.trap {
        overflow: hidden !important;
      }
      .card.spell .cardArt img, .card.trap .cardArt img,
      .card.spell .fieldArt img, .card.trap .fieldArt img {
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: contain !important;
        background: #000 !important;
      }
    `;
    document.head.appendChild(stStyle);
  }
})();

window.stHTML = function(c, zone, i) {
  if (!c) return '<small>Zona libre</small>';
  var sel = (typeof game !== 'undefined' && game && game.selected && game.selected.some(function(x) { return x[0] === zone && x[1] === i; }));
  var cls = 'card ' + (c.kind === 'TRAP' ? 'trap' : 'spell') + (sel ? ' selected' : '');
  var name = c.name || '';
  var num = (window.CARD_MAPPINGS && window.CARD_MAPPINGS[name]) || 0;
  var imgSrc = (num && window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[num]) || '';
  if (!imgSrc && window.CUSTOM_LOCAL_IMAGES) {
    var dict = typeof window.getGlobalCardDict === 'function' ? window.getGlobalCardDict() : (window.CARD_MAPPINGS || {});
    var dNum = dict[name] && dict[name].num ? dict[name].num : dict[name];
    if (dNum && window.CUSTOM_LOCAL_IMAGES[dNum]) {
      imgSrc = window.CUSTOM_LOCAL_IMAGES[dNum];
    }
  }
  var isEquip = (c.kind === 'EQUIP' || c.value === 'EQUIP');
  var kindBadge = isEquip ? '⚡ EQUIPO' : (c.kind === 'TRAP' ? '🛡️ TRAMPA' : '🔮 MAGIA');
  var badgeColor = isEquip ? '#ffd700' : (c.kind === 'TRAP' ? '#ff80ab' : '#80deea');

  var imgTag = imgSrc ?
    '<img src="' + imgSrc + '" style="max-width:100%;max-height:100%;object-fit:contain;background:#000;display:block;margin:auto;" />' :
    '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;font-size:11px;">' + name + '</div>';

  if (zone === 'h') {
    var descText = isEquip ? (c.desc || c.text || 'Mágica de Equipo') : (c.kind === 'TRAP' ? (c.desc || c.text || 'Carta de Trampa') : (c.desc || c.text || 'Carta Mágica'));
    return '<div data-zone="' + zone + '" data-index="' + i + '" class="' + cls + '" onclick="select(\'' + zone + '\',' + i + ')" style="position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:5px;box-sizing:border-box;height:100%;">' +
      '<div class="cardTop" style="display:flex;justify-content:space-between;align-items:center;gap:4px;margin-bottom:2px;flex-shrink:0;">' +
        '<div class="name" style="font-size:11px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:1px 1px 2px #000;flex:1;" title="' + name + '">' + name + '</div>' +
        '<span style="font-size:8px;font-weight:bold;color:' + badgeColor + ';background:rgba(0,0,0,0.7);padding:1px 4px;border-radius:3px;border:1px solid ' + badgeColor + ';flex-shrink:0;">' + kindBadge + '</span>' +
      '</div>' +
      '<div class="cardArt" style="padding:0;overflow:hidden;flex:1;min-height:70px;max-height:98px;width:100%;border-radius:4px;margin:2px 0;background:#000;border:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">' +
        imgTag +
      '</div>' +
      '<div class="cardMeta" style="font-size:9px;color:#bbb;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px;flex-shrink:0;">' +
        descText +
      '</div>' +
      '<div class="stActions" style="display:flex;gap:4px;margin-top:2px;flex-shrink:0;">' +
        '<button style="flex:1;padding:4px 2px;font-size:10px;font-weight:bold;cursor:pointer;background:#392d20;color:#fff;border:1px solid #a48750;border-radius:4px;" onclick="event.stopPropagation();setST(' + i + ')">SET</button>' +
        '<button style="flex:1;padding:4px 2px;font-size:10px;font-weight:bold;cursor:pointer;background:#1b5e20;color:#fff;border:1px solid #4caf50;border-radius:4px;" onclick="event.stopPropagation();activateSTFromHand(' + i + ')" ' + (c.kind === 'TRAP' ? 'disabled' : '') + '>ACTIVAR</button>' +
      '</div>' +
    '</div>';
  }

  // Field backrow
  var isTrapField = (c.kind === 'TRAP' || (c.type && String(c.type).toUpperCase() === 'TRAP') || c.value === 'DUST_TORNADO' || c.name === 'Dust Tornado' || (c.value && String(c.value).includes('TRAP')));
  var ready = !isTrapField || (typeof window.isTrapReady === 'function' ? window.isTrapReady(c) : false);
  var statusText = c.set ? (isTrapField ? (ready ? 'LISTA' : 'ESPERA') : 'SET') : 'ACTIVA';
  return '<div data-zone="' + zone + '" data-index="' + i + '" class="' + cls + '" onclick="select(\'' + zone + '\',' + i + ')" style="position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:4px;box-sizing:border-box;height:100%;">' +
    '<div class="name" style="font-size:9px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;flex-shrink:0;" title="' + name + '">' + name + '</div>' +
    '<div class="fieldArt" style="flex:1;min-height:48px;width:100%;overflow:hidden;border-radius:3px;background:#000;margin:2px 0;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.15);">' +
      imgTag +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;font-size:8px;margin-top:2px;flex-shrink:0;">' +
      '<span style="color:#ffd700;font-weight:bold;">' + statusText + '</span>' +
      (c.set && ready ? '<button style="padding:2px 5px;font-size:8px;font-weight:bold;cursor:pointer;background:#1b5e20;color:#fff;border:1px solid #4caf50;border-radius:3px;" onclick="event.stopPropagation();activateSetCard(' + i + ')">ACTIVAR</button>' : '') +
    '</div>' +
  '</div>';
};
try { stHTML = window.stHTML; } catch(_) {}






// ==========================================
// REGISTRO Y PERSISTENCIA DEFINITIVA DE FUSIONES
// ==========================================
window.recordDiscoveredFusion = function(resultName) {
    if (!resultName || typeof resultName !== 'string') return;
    try {
        let curAccount = window.activeAccount || localStorage.getItem('FMR_ACTIVE_ACCOUNT') || '';
        let sKey = curAccount ? ('FMR_SAVE_' + curAccount) : 'FMR_REBORN_STORY_V3000';
        let sStr = origGet(sKey) || origGet('FMR_REBORN_STORY_V3000');
        let s = {};
        if (sStr) { try { s = JSON.parse(sStr); } catch(_) {} }
        
        s.fusions = Array.isArray(s.fusions) ? s.fusions : [];
        if (!s.fusions.includes(resultName)) {
            s.fusions.push(resultName);
            console.log('✨ [FUSIÓN DESCUBIERTA REGISTRADA]', resultName, 'Total:', s.fusions.length);
            
            let json = JSON.stringify(s);
            if (curAccount) origSet('FMR_SAVE_' + curAccount, json);
            origSet('FMR_REBORN_STORY_V3000', json);
            
            // Sincronizar en cuentas registradas
            let accsStr = origGet('FMR_ACCOUNTS');
            if (accsStr && curAccount) {
                try {
                    let accs = JSON.parse(accsStr);
                    if (accs[curAccount]) {
                        accs[curAccount].data = s;
                        origSet('FMR_ACCOUNTS', JSON.stringify(accs));
                    }
                } catch(_) {}
            }

            // Sincronizar memorySave y nativeAPI
            if (window.memorySave) {
                if (!Array.isArray(window.memorySave.fusions)) window.memorySave.fusions = [];
                if (!window.memorySave.fusions.includes(resultName)) window.memorySave.fusions.push(resultName);
            }
            if (window.nativeAPI && window.nativeAPI.setMemorySave) {
                window.nativeAPI.setMemorySave(s);
            }
            
            // Persistir de inmediato en servidor y local
            if (typeof window.persistUserSave === 'function') {
                window.persistUserSave(s);
            } else if (typeof window.sendServerSave === 'function') {
                window.sendServerSave(s);
            }
            
            if (typeof duelToast === 'function') {
                duelToast('✨ ¡FUSIÓN DESCUBIERTA: ' + resultName.toUpperCase() + '!');
            } else if (typeof toast === 'function') {
                toast('✨ ¡FUSIÓN DESCUBIERTA: ' + resultName.toUpperCase() + '!');
            }
        }
    } catch(err) {
        console.error('[Error guardando fusión descubierta]', err);
    }
};

window.onBeforeFuse = function(maybeResult) {
    if (maybeResult && typeof maybeResult === 'string') {
        window.recordDiscoveredFusion(maybeResult);
        return;
    }
    if (typeof game !== 'undefined' && game && game.turn === 'player' && Array.isArray(game.selected)) {
        let ids = game.selected.filter(x => x && x[0] === 'h').map(x => x[1]).sort((a,b) => b-a);
        if (ids.length >= 2 && Array.isArray(game.hand)) {
            let names = ids.map(i => {
                let c = game.hand[i];
                return (c && (c.name || c[0])) || null;
            }).filter(Boolean);
            let fnRes = typeof window.fusionResult === 'function' ? window.fusionResult : (typeof fusionResult === 'function' ? fusionResult : null);
            let result = fnRes ? fnRes(names) : null;
            if (result) {
                window.recordDiscoveredFusion(result);
            }
        }
    }
};

// Interceptor global para llamada a fuse() manual
const origGlobalFuse = window.fuse;
window.fuse = function() {
    try {
        if (typeof window.onBeforeFuse === 'function') window.onBeforeFuse();
    } catch(_) {}
    if (typeof origGlobalFuse === 'function') {
        return origGlobalFuse.apply(this, arguments);
    }
};
try { fuse = window.fuse; } catch(e){}

// Captura de clic en el botón de Fusión para asegurar registro instantáneo
document.addEventListener('click', function(e) {
    let btn = e.target && e.target.closest ? e.target.closest('#fusionBtn') : null;
    if (btn) {
        try {
            if (typeof window.onBeforeFuse === 'function') window.onBeforeFuse();
        } catch(_) {}
    }
}, true);

window.getGlobalCardDict = function() {
    if (window.globalCardDict) return window.globalCardDict;
    let dict = {};
    let names = Object.keys(window.CARD_MAPPINGS || {});
    names.forEach(name => {
        let rawNum = window.CARD_MAPPINGS[name];
        let num = typeof rawNum === 'number' ? rawNum : (parseInt(String(rawNum || '').replace(/[^\d]/g, ''), 10) || 0);
        let normName = name.toLowerCase().trim();
        let cardEntry = null;

        // Check CARDS_DATA first as authoritative source
        let cd = (window.CARDS_DATA || []).find(x => x && (x.name === name || (x.name && x.name.toLowerCase().trim() === normName)));
        if (cd) {
            let cdKind = String(cd.kind || '').toUpperCase();
            let isST = cdKind === 'SPELL' || cdKind === 'TRAP' || cdKind === 'EQUIP' || cdKind === 'FIELD' || (cd.type && (String(cd.type).toLowerCase().includes('equip') || String(cd.type).toLowerCase().includes('field')));
            if (!isST && (cdKind === 'MONSTER' || cdKind === 'FUSION' || cdKind === 'LINK' || (cd.atk !== undefined && cd.atk !== '-'))) {
                cardEntry = { num, name: cd.name, type: cd.type || 'Warrior', attr: cd.attr || 'EARTH', atk: cd.atk || 0, def: cd.def || 0, isMonster: true, isExtra: cdKind === 'FUSION', text: cd.text || cd.desc || '' };
            } else {
                cardEntry = { num, name: cd.name, type: cd.type || cd.kind || (cdKind === 'TRAP' ? 'TRAP' : 'SPELL'), isMonster: false, atk: '-', def: '-', text: cd.text || cd.desc || '', isExtra: false };
            }
        } else {
            let st = window.FMR_ST_POOL_V1 && window.FMR_ST_POOL_V1.find(x => x && (x.name === name || (x.name && x.name.toLowerCase().trim() === normName)));
            if (st) {
                cardEntry = { num, name, type: st.kind, isMonster: false, atk: '-', def: '-', text: st.text, isExtra: false };
            } else {
                let meta = window.FMR_CARD_META && (window.FMR_CARD_META[name] || window.FMR_CARD_META[normName]);
                let mKind = meta ? String(meta.kind || '').toUpperCase() : '';
                if (meta && mKind !== 'SPELL' && mKind !== 'TRAP' && mKind !== 'EQUIP' && mKind !== 'FIELD') {
                    cardEntry = { num, name, type: meta.type, attr: meta.attr, atk: meta.atk, def: meta.def, isMonster: true, isExtra: meta.kind === 'FUSION', text: meta.desc || '' };
                } else {
                    let dbCard = typeof DB !== 'undefined' && Array.isArray(DB) && DB.find(x => x && (x[0] === name || (x[0] && x[0].toLowerCase().trim() === normName)));
                    if (dbCard) {
                        cardEntry = { num, name, type: dbCard[2], attr: dbCard[3], atk: dbCard[4], def: dbCard[5], isMonster: true, isExtra: false };
                    } else {
                        cardEntry = { num, name, type: 'UNKNOWN', isMonster: false, atk: '-', def: '-', isExtra: false };
                    }
                }
            }
        }
        dict[name] = cardEntry;
        dict[normName] = cardEntry;
    });
    window.globalCardDict = dict;
    return dict;
};

function updatePreview(previewImg, infoBox, name, extraHtml) {
    let dict = window.getGlobalCardDict();
    let norm = name ? String(name).toLowerCase().trim() : '';
    let c = dict[name] || dict[norm];
    if (c) {
        if (window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[c.num]) {
            previewImg.src = window.CUSTOM_LOCAL_IMAGES[c.num];
            previewImg.style.display = 'block';
        } else {
            previewImg.style.display = 'none';
        }
        
        infoBox.style.display = 'block';
        
        let descHtml = extraHtml || '';
        let txt = c.text || c.desc || '';
        if (txt) {
            descHtml = txt + (descHtml ? '<br/><br/>' + descHtml : '');
        }
        
        infoBox.innerHTML = `<h3 style="margin:0 0 10px 0; color:#ffcc00;">#${String(c.num).padStart(3, '0')} ${name}</h3>` +
            (c.isMonster ? `<div style="color:#aaa; font-size:12px; margin-bottom:10px;">[${c.type}] · ${c.attr}</div>
            <div style="font-weight:bold;"><span style="color:#ff4d4d">ATK ${c.atk}</span> / <span style="color:#4da6ff">DEF ${c.def}</span></div>`
            : `<div style="color:#ff80ab; font-size:12px; margin-bottom:10px;">[${c.type}] Mágica/Trampa</div>`) + 
            (descHtml ? `<div style="margin-top:15px; padding-top:15px; border-top:1px solid #444; font-size:12px; line-height:1.4; color:#ddd;">${descHtml}</div>` : '');
    }
}

function handleBackBtn(overlay) {
    if (window.playViolinClick) window.playViolinClick();
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (window.openCustomShopMenu) {
        window.openCustomShopMenu();
    }
}

// COLLECTION WITH TABLE VIEW
window.customShowCollection = function() {
    let s = JSON.parse(origGet('FMR_SAVE_' + window.activeAccount) || '{}');
    if (!s.collection) return;
    if (typeof window.cleanSaveCollection === 'function') window.cleanSaveCollection(s);
    
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: #1a1a1a; z-index:9999999; display:flex; flex-direction:row; padding: 20px; box-sizing:border-box; color: #fff; font-family: "Segoe UI", Arial, sans-serif;';
    
    let leftSide = document.createElement('div');
    leftSide.style.cssText = 'width: 320px; display:flex; flex-direction:column; margin-right: 20px; border-right: 2px solid #333; padding-right: 20px;';
    
    let previewImgWrap = document.createElement('div');
    previewImgWrap.style.cssText = 'width:100%; height: 460px; border: 3px solid #a67c00; border-radius: 8px; background: #000; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 15px #000;';
    let previewImg = document.createElement('img');
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:contain; background:#000; display:none;';
    previewImgWrap.appendChild(previewImg);
    leftSide.appendChild(previewImgWrap);
    
    let infoBox = document.createElement('div');
    infoBox.style.cssText = 'margin-top:20px; padding:15px; background:#222; border-radius:8px; display:none;';
    leftSide.appendChild(infoBox);
    overlay.appendChild(leftSide);
    
    let rightSide = document.createElement('div');
    rightSide.style.cssText = 'flex:1; display:flex; flex-direction:column; overflow:hidden;';
    overlay.appendChild(rightSide);
    
    let header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e4c06b; padding-bottom: 10px; margin-bottom: 10px;';
    header.innerHTML = `
        <div style="font-family:VT323, monospace; color:#ffcc00; font-size: 24px; text-shadow: 2px 2px 0 #000;">BIBLIOTECA DE CARTAS</div>
        <input type="text" id="coll-search" placeholder="Buscar nombre..." autocomplete="off" style="padding: 10px 15px; border-radius: 6px; border: 1px solid #555; background: #222; color: #fff; font-family:'Segoe UI'; width: 220px; font-size: 16px;">
        <button id="btn-exit-coll" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:VT323, monospace; font-size:12px;">VOLVER</button>
    `;
    rightSide.appendChild(header);
    
    let filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex; gap:10px; margin-bottom: 15px; align-items:center; flex-wrap:wrap; font-size: 14px;';
    filterBar.innerHTML = `
        <select id="f-cardtype" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todas las cartas</option>
            <option value="MONSTER">Solo Monstruos</option>
            <option value="SPELL">Todas las Magias</option>
            <option value="SPELL_NORMAL">Magias Normales</option>
            <option value="SPELL_FIELD">Magias de Campo</option>
            <option value="SPELL_EQUIP">Magias de Equipo</option>
            <option value="TRAP">Solo Trampas</option>
        </select>
        <select id="f-attr" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todos los Atributos</option>
            <option value="LIGHT">LUZ</option>
            <option value="DARK">OSCURIDAD</option>
            <option value="EARTH">TIERRA</option>
            <option value="WATER">AGUA</option>
            <option value="FIRE">FUEGO</option>
            <option value="WIND">VIENTO</option>
        </select>
        <select id="f-type" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todos los Tipos</option>
            <option value="Dragon">Dragón</option>
            <option value="Spellcaster">Lanzador de Conjuros</option>
            <option value="Zombie">Zombi</option>
            <option value="Warrior">Guerrero</option>
            <option value="Beast-Warrior">Guerrero-Bestia</option>
            <option value="Beast">Bestia</option>
            <option value="Winged Beast">Bestia Alada</option>
            <option value="Fiend">Demonio</option>
            <option value="Fairy">Hada</option>
            <option value="Insect">Insecto</option>
            <option value="Dinosaur">Dinosaurio</option>
            <option value="Reptile">Reptil</option>
            <option value="Fish">Pez</option>
            <option value="Sea Serpent">Serpiente Marina</option>
            <option value="Machine">Máquina</option>
            <option value="Thunder">Trueno</option>
            <option value="Aqua">Aqua</option>
            <option value="Pyro">Piro</option>
            <option value="Rock">Roca</option>
            <option value="Plant">Planta</option>
        </select>
        <input type="number" id="f-atk" placeholder="ATK Mínimo" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; width: 100px;">
        <input type="number" id="f-def" placeholder="DEF Mínima" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; width: 100px;">
        <select id="f-owned" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todas (Poseídas y No)</option>
            <option value="OWNED">Solo Poseídas</option>
            <option value="UNOWNED">Solo No Poseídas</option>
        </select>
    `;
    rightSide.appendChild(filterBar);
    
    let tableWrap = document.createElement('div');
    tableWrap.style.cssText = 'flex: 1; overflow-y: auto; background: #222; border: 1px solid #444; border-radius: 8px; box-shadow: inset 0 0 10px #000;';
    
    let table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; text-align: left;';
    table.innerHTML = `
        <thead style="background: #333; position: sticky; top: 0; z-index: 10;">
            <tr>
                <th style="padding: 12px; border-bottom: 2px solid #555;">N°</th>
                <th style="padding: 12px; border-bottom: 2px solid #555;">Nombre</th>
                <th style="padding: 12px; border-bottom: 2px solid #555;">Tipo</th>
                <th style="padding: 12px; border-bottom: 2px solid #555;">ATK/DEF</th>
                <th style="padding: 12px; border-bottom: 2px solid #555; text-align:center;">Colección</th>
            </tr>
        </thead>
        <tbody id="coll-tbody"></tbody>
    `;
    tableWrap.appendChild(table);
    rightSide.appendChild(tableWrap);
    document.body.appendChild(overlay);
    
    let tbody = overlay.querySelector('#coll-tbody');
    let dict = window.getGlobalCardDict();
    
    // Strictly deduplicate collection entries: 1 entry per card (by ID and normalized name)
    let seenIds = new Set();
    let seenNames = new Set();
    let allCards = [];
    
    let sortedKeys = Object.keys(window.CARD_MAPPINGS || {}).sort((a,b) => {
        let na = parseInt(String(window.CARD_MAPPINGS[a] || 0).replace(/[^\d]/g, ''), 10) || 0;
        let nb = parseInt(String(window.CARD_MAPPINGS[b] || 0).replace(/[^\d]/g, ''), 10) || 0;
        return na - nb;
    });
    
    sortedKeys.forEach(rawName => {
        let norm = rawName.toLowerCase().trim();
        let c = dict[rawName] || dict[norm];
        if (!c || c.type === 'UNKNOWN') return;
        if (typeof window.isCardProgrammed === 'function' && !window.isCardProgrammed(c)) return;
        let cardNum = c.num;
        let cardName = c.name || rawName;
        let cardNorm = cardName.toLowerCase().trim();
        if (seenIds.has(cardNum) || seenNames.has(cardNorm)) return;
        seenIds.add(cardNum);
        seenNames.add(cardNorm);
        allCards.push(c);
    });
    
    function renderList() {
        let q = overlay.querySelector('#coll-search').value.toLowerCase().trim();
        let fCard = overlay.querySelector('#f-cardtype').value;
        let fAttr = overlay.querySelector('#f-attr').value;
        let fType = overlay.querySelector('#f-type').value;
        let fAtk = parseInt(overlay.querySelector('#f-atk').value) || -1;
        let fDef = parseInt(overlay.querySelector('#f-def').value) || -1;
        let fOwn = overlay.querySelector('#f-owned').value;
        
        tbody.innerHTML = '';
        
        allCards.forEach(c => {
            let name = c.name;
            let norm = name.toLowerCase().trim();
            let count = (s.collection && (s.collection[name] !== undefined ? s.collection[name] : s.collection[norm])) || 0;
            
            // Filters
            if (q && !norm.includes(q)) return;
            let isField = typeof window.isFieldSpell === 'function' ? window.isFieldSpell(c) : false;
            let isEquip = typeof window.isEquipSpell === 'function' ? window.isEquipSpell(c) : false;
            let isSpell = !c.isMonster && (c.type === 'SPELL' || c.kind === 'SPELL' || isField || isEquip) && c.type !== 'TRAP' && c.kind !== 'TRAP';

            if (fCard === 'MONSTER' && !c.isMonster) return;
            if (fCard === 'SPELL' && !isSpell) return;
            if (fCard === 'SPELL_NORMAL' && (!isSpell || isField || isEquip)) return;
            if (fCard === 'SPELL_FIELD' && (!isSpell || !isField)) return;
            if (fCard === 'SPELL_EQUIP' && (!isSpell || !isEquip)) return;
            if (fCard === 'TRAP' && (c.type !== 'TRAP' && c.kind !== 'TRAP')) return;
            if (fAttr && c.attr !== fAttr) return;
            if (fType && c.type !== fType) return;
            if (fAtk > -1 && (!c.isMonster || c.atk < fAtk)) return;
            if (fDef > -1 && (!c.isMonster || c.def < fDef)) return;
            if (fOwn === 'OWNED' && count === 0) return;
            if (fOwn === 'UNOWNED' && count > 0) return;
            
            let tr = document.createElement('tr');
            let isUnowned = (count === 0);
            
            tr.style.cssText = `border-bottom: 1px solid #333; cursor: pointer; transition: background 0.2s; color: ${isUnowned ? '#666' : '#fff'};`;
            tr.onmouseover = () => tr.style.background = '#333';
            tr.onmouseout = () => tr.style.background = 'transparent';
            
            tr.onclick = () => {
                let siblings = tbody.querySelectorAll('tr');
                siblings.forEach(sib => sib.style.background = 'transparent');
                tr.style.background = '#444';
                tr.onmouseout = () => tr.style.background = '#444';
                siblings.forEach(sib => { if(sib!==tr) sib.onmouseout = () => sib.style.background = 'transparent'; });
                
                updatePreview(previewImg, infoBox, name);
            };
            
            let colorType = c.isMonster ? '#fff' : (c.type==='SPELL' ? '#4da6ff' : '#ff4d4d');
            if (isUnowned) colorType = '#666';
            
            let displayType = c.isMonster ? `${c.type} / ${c.attr}` : ((c.type === 'TRAP' || c.kind === 'TRAP') ? 'Trampa' : (isField ? 'Magia (Campo)' : (isEquip ? 'Magia (Equipo)' : 'Magia (Normal)')));
            let displayStats = c.isMonster ? `<span style="color:${isUnowned?'#666':'#ff4d4d'}">${c.atk}</span> / <span style="color:${isUnowned?'#666':'#4da6ff'}">${c.def}</span>` : '-';
            
            tr.innerHTML = `
                <td style="padding: 10px; font-weight: bold; color: #888;">${String(c.num).replace(/[^\d]/g, '').padStart(3, '0')}</td>
                <td style="padding: 10px; font-weight: bold; color: ${colorType};">${name}</td>
                <td style="padding: 10px;">${displayType}</td>
                <td style="padding: 10px;">${displayStats}</td>
                <td style="padding: 10px; text-align:center;">
                    ${count > 0 ? `<b style="color:#00ffcc;">x${count}</b>` : `<b style="color:#555;">x0</b>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // Attach event listeners
    overlay.querySelector('#coll-search').oninput = renderList;
    ['f-cardtype', 'f-attr', 'f-type', 'f-atk', 'f-def', 'f-owned'].forEach(id => {
        overlay.querySelector('#'+id).onchange = renderList;
    });
    
    overlay.querySelector('#btn-exit-coll').onclick = () => handleBackBtn(overlay);
    
    renderList();
};

function createDashboardBase(titleText, backAction) {
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: #1a1a1a; z-index:9999999; display:flex; flex-direction:column; box-sizing:border-box; color: #fff; font-family: "Segoe UI", Arial, sans-serif;';
    
    let header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding: 20px 40px; background: #0d0d0d; border-bottom: 2px solid #a67c00;';
    
    let title = document.createElement('h1');
    title.innerHTML = titleText;
    title.style.cssText = 'margin:0; color:#ffcc00; font-family:VT323, monospace; font-size:24px; text-shadow:2px 2px 0 #000;';
    header.appendChild(title);
    
    let backBtn = document.createElement('button');
    backBtn.innerHTML = 'VOLVER';
    backBtn.style.cssText = 'background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:10px 20px; font-weight:bold; cursor:pointer; font-size:16px; border-radius:5px;';
    backBtn.onmouseover = () => backBtn.style.background = '#ff4d4d';
    backBtn.onmouseout = () => backBtn.style.background = '#8b0000';
    backBtn.onclick = () => handleBackBtn(overlay);
    header.appendChild(backBtn);
    overlay.appendChild(header);
    
    let container = document.createElement('div');
    container.style.cssText = 'flex:1; display:flex; padding:20px; gap:20px; overflow:hidden;';
    overlay.appendChild(container);
    
    let leftSide = document.createElement('div');
    leftSide.style.cssText = 'width: 320px; display:flex; flex-direction:column; border-right: 2px solid #333; padding-right: 20px;';
    
    let previewImgWrap = document.createElement('div');
    previewImgWrap.style.cssText = 'width:100%; height: 460px; border: 3px solid #a67c00; border-radius: 8px; background: #000; overflow: hidden; display:flex; align-items:center; justify-content:center;';
    let previewImg = document.createElement('img');
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:cover; display:none;';
    previewImgWrap.appendChild(previewImg);
    leftSide.appendChild(previewImgWrap);
    
    let infoBox = document.createElement('div');
    infoBox.style.cssText = 'margin-top:20px; padding:15px; background:#222; border-radius:8px; display:none;';
    leftSide.appendChild(infoBox);
    container.appendChild(leftSide);
    
    let rightSide = document.createElement('div');
    rightSide.style.cssText = 'flex:1; display:flex; flex-direction:column; overflow:hidden;';
    container.appendChild(rightSide);
    
    let gridWrap = document.createElement('div');
    gridWrap.style.cssText = 'flex:1; overflow-y:auto; padding-right:10px; display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; align-content:start;';
    rightSide.appendChild(gridWrap);
    
    return { overlay, rightSide, gridWrap, previewImg, infoBox };
}

// Obsolete duplicate customShowShop removed to ensure the modern high-power shop table is active.

window.customShowFusions = function() {
    let curAccount = window.activeAccount || localStorage.getItem('FMR_ACTIVE_ACCOUNT') || '';
    let sKey = curAccount ? ('FMR_SAVE_' + curAccount) : 'FMR_REBORN_STORY_V3000';
    let sStr = origGet(sKey) || origGet('FMR_REBORN_STORY_V3000');
    let s = {};
    if (sStr) { try { s = JSON.parse(sStr); } catch(_) {} }
    
    let fusionsList = Array.isArray(s.fusions) ? [...s.fusions] : [];
    if (window.memorySave && Array.isArray(window.memorySave.fusions)) {
        window.memorySave.fusions.forEach(f => {
            if (!fusionsList.includes(f)) fusionsList.push(f);
        });
    }
    let discovered = new Set(fusionsList);

    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: #1a1a1a; z-index:9999999; display:flex; flex-direction:row; padding: 20px; box-sizing:border-box; color: #fff; font-family: "Segoe UI", Arial, sans-serif;';
    
    let leftSide = document.createElement('div');
    leftSide.style.cssText = 'width: 320px; display:flex; flex-direction:column; margin-right: 20px; border-right: 2px solid #333; padding-right: 20px; flex-shrink: 0;';
    
    let previewImgWrap = document.createElement('div');
    previewImgWrap.style.cssText = 'width:100%; height: 460px; border: 3px solid #a67c00; border-radius: 8px; background: #000; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 15px #000;';
    let previewImg = document.createElement('img');
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:cover; display:none;';
    previewImgWrap.appendChild(previewImg);
    leftSide.appendChild(previewImgWrap);
    
    let infoBox = document.createElement('div');
    infoBox.style.cssText = 'margin-top:20px; padding:15px; background:#222; border-radius:8px; display:none;';
    leftSide.appendChild(infoBox);
    overlay.appendChild(leftSide);
    
    let rightSide = document.createElement('div');
    rightSide.style.cssText = 'flex:1; display:flex; flex-direction:column; overflow:hidden;';
    overlay.appendChild(rightSide);
    
    let header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e4c06b; padding-bottom: 10px; margin-bottom: 10px;';
    header.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px;">
            <div style="font-family:VT323, monospace; color:#ffcc00; font-size: 26px; text-shadow: 2px 2px 0 #000;">FUSIONES DESCUBIERTAS</div>
            <span style="background: rgba(0,255,204,0.15); border: 1px solid #00ffcc; color: #00ffcc; padding: 2px 10px; border-radius: 4px; font-size: 16px; font-weight: bold; font-family:VT323, monospace;">${discovered.size} DESCUBIERTAS</span>
        </div>
        <button id="btn-exit-fus" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:8px 18px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:VT323, monospace; font-size:16px;">VOLVER</button>
    `;
    rightSide.appendChild(header);
    
    let tableWrap = document.createElement('div');
    tableWrap.style.cssText = 'flex: 1; overflow-y: auto; background: #222; border: 1px solid #444; border-radius: 8px; box-shadow: inset 0 0 10px #000;';
    
    let table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; text-align: left;';
    table.innerHTML = `
        <thead style="background: #333; position: sticky; top: 0; z-index: 10;">
            <tr>
                <th style="padding: 12px; border-bottom: 2px solid #555;">Resultado de la Fusión</th>
                <th style="padding: 12px; border-bottom: 2px solid #555;">Receta Exacta</th>
                <th style="padding: 12px; border-bottom: 2px solid #555; text-align:center;">Estado</th>
            </tr>
        </thead>
        <tbody id="fus-tbody"></tbody>
    `;
    tableWrap.appendChild(table);
    rightSide.appendChild(tableWrap);
    
    document.body.appendChild(overlay);
    
    let tbody = overlay.querySelector('#fus-tbody');
    let allRules = (window.FMR_FUSION_RULES_V1 || []).filter(r => r && r.exact);
    
    // Deduplicar recetas simétricas (A+B vs B+A)
    let seenEntries = new Set();
    let uniqueExact = [];
    allRules.forEach(r => {
        let sortedMat = [...r.exact].sort().join(' + ');
        let key = r.result + '::' + sortedMat;
        if (!seenEntries.has(key)) {
            seenEntries.add(key);
            uniqueExact.push(r);
        }
    });

    // Agregar fusiones descubiertas que no estén en uniqueExact
    let knownResults = new Set(uniqueExact.map(r => r.result));
    discovered.forEach(name => {
        if (!knownResults.has(name)) {
            uniqueExact.push({ exact: ['Material A', 'Material B'], result: name, customDiscovered: true });
            knownResults.add(name);
        }
    });
    
    // Ordenar: primero las descubiertas, luego por nombre
    uniqueExact.sort((a, b) => {
        let aDis = discovered.has(a.result) ? 0 : 1;
        let bDis = discovered.has(b.result) ? 0 : 1;
        if (aDis !== bDis) return aDis - bDis;
        return a.result.localeCompare(b.result);
    });

    uniqueExact.forEach(r => {
        let isKnown = discovered.has(r.result);
        let name = isKnown ? r.result : '???';
        let tr = document.createElement('tr');
        
        tr.style.cssText = `border-bottom: 1px solid #333; cursor: pointer; transition: background 0.2s; color: ${isKnown ? '#fff' : '#666'};`;
        tr.onmouseover = () => tr.style.background = '#333';
        tr.onmouseout = () => tr.style.background = 'transparent';
        
        tr.onclick = () => {
            let siblings = tbody.querySelectorAll('tr');
            siblings.forEach(s => s.style.background = 'transparent');
            tr.style.background = '#444';
            tr.onmouseout = () => tr.style.background = '#444';
            siblings.forEach(sib => { if(sib!==tr) sib.onmouseout = () => sib.style.background = 'transparent'; });
            
            if (isKnown) {
                let recipeDesc = r.customDiscovered ? '<strong>Fusión Descubierta en Combate</strong>' : `<strong>Receta Exacta:</strong><br/>${r.exact[0]}<br/>+<br/>${r.exact[1]}`;
                updatePreview(previewImg, infoBox, name, recipeDesc);
            } else {
                previewImg.src = '';
                previewImg.style.display = 'none';
                infoBox.style.display = 'block';
                infoBox.innerHTML = `<h3 style="margin:0 0 10px 0; color:#666;">Fusión Desconocida</h3><div style="color:#aaa; font-size:12px;">Descubre esta fusión en un duelo para revelarla.</div>`;
            }
        };
        
        let displayRecipe = isKnown ? (r.customDiscovered ? '<span style="color:#00ffcc">Descubierta en Duelo</span>' : `<span style="color:#4da6ff">${r.exact[0]}</span> + <span style="color:#ff4d4d">${r.exact[1]}</span>`) : '??? + ???';
        
        tr.innerHTML = `
            <td style="padding: 10px; font-weight: bold; color: ${isKnown ? '#ffcc00' : '#666'};">${name}</td>
            <td style="padding: 10px; font-size: 14px;">${displayRecipe}</td>
            <td style="padding: 10px; text-align:center;">
                ${isKnown ? `<b style="color:#00ffcc; text-shadow:0 0 5px rgba(0,255,204,0.5);">DESCUBIERTA</b>` : `<b style="color:#555;">OCULTA</b>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    overlay.querySelector('#btn-exit-fus').onclick = () => handleBackBtn(overlay);
};


window.surrenderDuel = function() { if(window.playCancelSound) window.playCancelSound();
    if (confirm('¿Estás seguro de que quieres rendirte?')) {
        let isStory = (typeof window.storyDuelActive !== 'undefined') ? window.storyDuelActive : false;
        if (isStory) {
            alert('¡Te has rendido! Fin del juego (Historia).');
            location.reload();
        } else {
            alert('Te has rendido. Volviendo al mapa...');
            // ISOLATION: Hide the duel board wrapper completely
            if (window.hideDuelBoard) window.hideDuelBoard();
            // Reset story state
            if (window.storyDuelActive !== undefined) window.storyDuelActive = false;
            if (typeof window.newGame === 'function') {
                // Reset the game state so next duel starts fresh
                window.newGame();
                if (window.hideDuelBoard) window.hideDuelBoard(); // newGame calls showDuelBoard internally, hide it again
            }
            // Go to map
            if(window.hideDuelBoard) window.hideDuelBoard(); if (window.customShowMap) window.customShowMap();
            else if (window.showMain) window.showMain();
        }
    }
};

// Mejorar efectos de sonido
window.playViolinClick = function() {
    let a = new Audio('https://www.myinstants.com/media/sounds/yugioh-menu-select.mp3');
    a.volume = 0.5; a.play().catch(()=>{});
};
window.playHoverSound = function() {
    let a = new Audio('https://www.myinstants.com/media/sounds/yugioh-menu-move.mp3');
    a.volume = 0.3; a.play().catch(()=>{});
};
window.playChic = window.playViolinClick;

// Reemplazar sonidos nativos de duelo
window.nativeAtkSound = function() {
    let a = new Audio('https://www.myinstants.com/media/sounds/yugioh-attack.mp3');
    a.volume = 0.6; a.play().catch(()=>{});
};
window.nativeDefSound = function() {
    let a = new Audio('https://www.myinstants.com/media/sounds/yugioh-defense.mp3');
    a.volume = 0.6; a.play().catch(()=>{});
};
window.nativeLpSound = function() {
    let a = new Audio('https://www.myinstants.com/media/sounds/yugioh-lp-drain.mp3');
    a.volume = 0.6; a.play().catch(()=>{});
};


// CARD POOL FIX: Inject ALL custom/missing cards into FMR_ST_POOL_V1 after engine overwrites it.
// Engine script 91 runs: window.FMR_ST_POOL_V1 = CARDS109 (only 21 cards).
// DOMContentLoaded fires AFTER all sync scripts, so we restore the full pool here.
document.addEventListener('DOMContentLoaded', function _injectCustomCards() {
  document.removeEventListener('DOMContentLoaded', _injectCustomCards);
  var customCards = [
    {name:'Cybernetic Fusion Support',kind:'SPELL',value:'CYBER_FUSION_SUPPORT',text:'Invoca por Fusion 1 Monstruo de Fusion de Maquina.'},
    {name:'Cybernetic Zone',kind:'SPELL',value:'CYBERNETIC_ZONE',text:'Destierra 1 Monstruo de Maquina; al final devuelvelo e invocalo por Fusion.'},
    {name:'Fusion Weapon',kind:'EQUIP',value:'FUSION_WEAPON',text:'Monstruo de Fusion Nivel 6 o inferior gana 1500 ATK y 500 DEF.'},
    {name:'Graceful Charity',kind:'SPELL',value:'GRACEFUL_CHARITY',text:'Roba 3 cartas y descarta 2.'},
    {name:'Heavy Storm',kind:'SPELL',value:'HEAVY_STORM',text:'Destruye todas las Magias, Trampas y Equipos en el Campo.'},
    {name:'Limiter Removal',kind:'SPELL',value:'LIMITER_REMOVAL',text:'Dobla el ATK de todos los Monstruos de Maquina. Al final del turno, destruyelos.'},
    {name:'Pot of Greed',kind:'SPELL',value:'POT_OF_GREED',text:'Roba 2 cartas.'},
    {name:'Scapegoat',kind:'SPELL',value:'SCAPEGOAT',text:'Invoca hasta 4 Tokens de Ovejas en Defensa.'},
    {name:'Threatening Roar',kind:'TRAP',value:'THREATENING_ROAR',text:'El rival no puede atacar este turno.'},
    {name:'Cyber Commander',kind:'MONSTER',type:'Machine',attr:'DARK',atk:750,def:700,level:2,faceUp:true,value:'CYBER_COMMANDER',text:'Un soldado cibernetico de elite.'}
  ];
  var pool = window.FMR_ST_POOL_V1;
  if (!Array.isArray(pool)) { window.FMR_ST_POOL_V1 = []; pool = window.FMR_ST_POOL_V1; }
  customCards.forEach(function(c) {
    if (!pool.find(function(x){ return x && x.name === c.name; })) { pool.push(c); }
  });
  console.log('[Patch] FMR_ST_POOL_V1 total:', pool.length, 'cartas.');
});

// ================================================================
//  SERVER INTEGRATION: Auto-Save + Character Decks from Server
// ================================================================
(function() {
  window.preloadServerDecks = function() {
    ['tristan', 'weevil', 'mai', 'mako', 'joey', 'pegasus', 'bakura', 'marik', 'noah', 'kosaburo', 'ishizu', 'odion', 'kaiba', 'yugi'].forEach(function(opp) {
      fetch('/api/deck/' + opp)
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(d) {
          if (d && Array.isArray(d.cards) && d.cards.length >= 40) {
            window['_serverDeck_' + opp] = d.cards.slice();
            console.log('[Server Deck] Cargado deck de ' + opp + ' (' + d.cards.length + ' cartas)');
          }
        })
        .catch(function() {});
    });
  };

  // DUEL INITIALIZATION OVERHAUL:
  // Previene que newGame() inyecte las 48 cartas de Tristan o que installStoryDecks use fallbacks viejos de DB.
  window.customNewGame = function() {
    if (window.storyDuelActive || (typeof storyDuelActive !== 'undefined' && storyDuelActive)) {
      if (typeof window.installStoryDecks === 'function') {
        window.installStoryDecks();
        return;
      }
    }
    if (typeof origNewGameBase === 'function') {
      return origNewGameBase();
    }
  };

  window.showDuelBoard = function() {
    let w = document.getElementById('duelBoardWrapper');
    if (w) { w.style.display = 'block'; }
    let t = document.getElementById('duelTopHeader');
    if (t) { t.style.display = ''; }
    let camp = document.getElementById('campaign3000');
    if (camp) {
      camp.innerHTML = '';
      camp.classList.add('hidden');
      camp.style.display = 'none';
    }
    if (typeof hideShell === 'function') hideShell();
    if (window.nativeAPI && window.nativeAPI.hideShell) window.nativeAPI.hideShell();
  };

  window.beginStoryDuel = function(id) {
    if (window.cleanAllOverlays) window.cleanAllOverlays();
    let camp = document.getElementById('campaign3000');
    if (camp) {
      camp.innerHTML = '';
      camp.classList.add('hidden');
      camp.style.display = 'none';
    }
    if (typeof hideShell === 'function') hideShell();
    if (window.nativeAPI && window.nativeAPI.hideShell) window.nativeAPI.hideShell();
    if (window.showDuelBoard) window.showDuelBoard();
    window._customDuelFinishing = false;
    
    var rawId = String(id || 'tristan').toLowerCase().replace(/[^a-z0-9_]/g, '');
    var normId = rawId === 'seto' ? 'kaiba' : (rawId === 'gozaburo' ? 'kosaburo' : rawId);
    
    window.lastDuelOpponent = normId;
    window.storyOpponent = normId;
    window.storyDuelActive = true;
    window.storyDeckReady = false;
    window.duelHandled = false;
    
    if (window.nativeAPI) {
      if (typeof window.nativeAPI.setStoryOpponent === 'function') window.nativeAPI.setStoryOpponent(normId);
      if (typeof window.nativeAPI.setStoryDuelActive === 'function') window.nativeAPI.setStoryDuelActive(true);
      if (typeof window.nativeAPI.setStoryDeckReady === 'function') window.nativeAPI.setStoryDeckReady(false);
      if (typeof window.nativeAPI.setDuelHandled === 'function') window.nativeAPI.setDuelHandled(false);
    }
    try { storyOpponent = normId; } catch(_) {}
    try { storyDuelActive = true; } catch(_) {}
    try { storyDeckReady = false; } catch(_) {}
    try { duelHandled = false; } catch(_) {}
    
    // Instalar DIRECTAMENTE los decks limpios sin pasar por newGame() de Tristan
    window.installStoryDecks();
  };
  if (!window.nativeAPI) window.nativeAPI = {};
  window.nativeAPI.beginStoryDuel = window.beginStoryDuel;

  window.installStoryDecks = function() {
    var rawOpp = (window.storyOpponent || window.lastDuelOpponent || 'tristan').toLowerCase().replace(/[^a-z0-9_]/g, '');
    var opp = rawOpp === 'seto' ? 'kaiba' : (rawOpp === 'gozaburo' ? 'kosaburo' : rawOpp);

    console.log('[installStoryDecks] Instalando decks oficiales para duelo contra:', opp);

    // 1. Obtener la baraja oficial del rival
    var enemyCardNames = (window['_serverDeck_' + opp]) ||
                         (window['_serverDeck_' + rawOpp]) ||
                         (window.CHARACTER_DECKS && (window.CHARACTER_DECKS[opp] || window.CHARACTER_DECKS[rawOpp]) && (window.CHARACTER_DECKS[opp] || window.CHARACTER_DECKS[rawOpp]).cards) ||
                         (typeof STORY_DECKS !== 'undefined' && (STORY_DECKS[opp] || STORY_DECKS[rawOpp])) ||
                         (window.CHARACTER_DECKS && window.CHARACTER_DECKS.tristan && window.CHARACTER_DECKS.tristan.cards);

    if (!enemyCardNames || !Array.isArray(enemyCardNames) || enemyCardNames.length === 0) {
      console.warn('[installStoryDecks] No se encontró baraja para ' + opp + ', usando fallback');
      enemyCardNames = (window.CHARACTER_DECKS && window.CHARACTER_DECKS.tristan && window.CHARACTER_DECKS.tristan.cards) || [];
    }

    // 2. Obtener la baraja oficial del jugador desde su save activo
    var sSave = (window.nativeAPI && window.nativeAPI.loadGame && window.nativeAPI.loadGame()) ||
                (typeof loadGame === 'function' && loadGame()) ||
                window.memorySave;
    
    var playerCardNames = null;
    if (sSave) {
      if (sSave.decks && sSave.activeDeck && Array.isArray(sSave.decks[sSave.activeDeck]) && sSave.decks[sSave.activeDeck].length === 40) {
        playerCardNames = sSave.decks[sSave.activeDeck];
      } else if (Array.isArray(sSave.deck) && sSave.deck.length === 40) {
        playerCardNames = sSave.deck;
      }
    }
    if (!playerCardNames || playerCardNames.length !== 40) {
      if (window.DEFAULT_DECK && Array.isArray(window.DEFAULT_DECK) && window.DEFAULT_DECK.length === 40) {
        playerCardNames = window.DEFAULT_DECK;
      } else if (sSave && Array.isArray(sSave.deck) && sSave.deck.length > 0) {
        playerCardNames = sSave.deck.slice(0, 40);
      }
    }

    var cardResolver = window.resolveGameCard || function(n) { return { name: n, atk: 1500, def: 1200, pos: 'ATK', faceUp: true }; };

    // 3. Resolver cartas usando resolveGameCard (CARDS_DATA + FMR_ST_POOL_V1 + DB + mappings)
    var builtEnemy = (enemyCardNames || []).map(cardResolver).filter(Boolean);
    var builtPlayer = (playerCardNames || []).map(cardResolver).filter(Boolean);

    // Asegurar 40 cartas exactas sin elementos nulos
    while (builtEnemy.length < 40 && builtEnemy.length > 0) {
      builtEnemy.push(Object.assign({}, builtEnemy[Math.floor(Math.random() * builtEnemy.length)]));
    }
    while (builtPlayer.length < 40 && builtPlayer.length > 0) {
      builtPlayer.push(Object.assign({}, builtPlayer[Math.floor(Math.random() * builtPlayer.length)]));
    }
    builtEnemy = builtEnemy.slice(0, 40);
    builtPlayer = builtPlayer.slice(0, 40);

    // 4. Barajar con algoritmo Fisher-Yates
    function shuf(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      return arr;
    }
    shuf(builtEnemy);
    shuf(builtPlayer);

    // 5. Configurar el estado de duelo en game
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) {
      g = {
        pendingAction: null, pendingTarget: null, linkMaterialModes: {},
        plp: 8000, elp: 8000, hand: [], enemyHand: [],
        extra: [], extraUsed: [],
        field: Array(5).fill(null), enemy: Array(5).fill(null),
        playerBack: Array(5).fill(null), enemyBack: Array(5).fill(null),
        linkZones: [null, null], enemyLinkZones: [null, null],
        linkField: null, enemyLinkField: null,
        grave: [], enemyGrave: [],
        turn: 'player', selected: [], deck: [], enemyDeck: [],
        handSummoned: false, battlePhaseStarted: false,
        first: 'player', firstTurn: true, turnNo: 1, duelOver: false
      };
      if (typeof game !== 'undefined') game = g;
      window.game = g;
    }

    g.deck = builtPlayer.slice();
    g.enemyDeck = builtEnemy.slice();
    g.hand = [];
    g.enemyHand = [];
    g.field = Array(5).fill(null);
    g.enemy = Array(5).fill(null);
    g.playerBack = Array(5).fill(null);
    g.enemyBack = Array(5).fill(null);
    g.linkZones = [null, null];
    g.enemyLinkZones = [null, null];
    g.linkField = null;
    g.enemyLinkField = null;
    g.grave = [];
    g.enemyGrave = [];
    g.selected = [];
    g.plp = 8000;
    g.elp = 8000;
    g.turnNo = 1;
    g.turn = 'player';
    g.first = 'player';
    g.firstTurn = true;
    g.handSummoned = false;
    g.battlePhaseStarted = false;
    g.duelOver = false;
    g._storyResult3000 = null;
    g._turnStarts67 = { player: (g.first === "player" ? 1 : 0), enemy: (g.first === "enemy" ? 1 : 0) };
    g._aiPlan108 = null;

    // Robar 5 cartas iniciales legítimas
    for (var h = 0; h < 5; h++) {
      if (g.deck.length > 0) g.hand.push(g.deck.pop());
      if (g.enemyDeck.length > 0) g.enemyHand.push(g.enemyDeck.pop());
    }

    window.storyDeckReady = true;
    window.duelHandled = false;
    window.storyDuelActive = true;
    if (window.nativeAPI) {
      if (typeof window.nativeAPI.setStoryDeckReady === 'function') window.nativeAPI.setStoryDeckReady(true);
      if (typeof window.nativeAPI.setDuelHandled === 'function') window.nativeAPI.setDuelHandled(false);
      if (typeof window.nativeAPI.setStoryDuelActive === 'function') window.nativeAPI.setStoryDuelActive(true);
    }
    try { storyDeckReady = true; } catch(_) {}
    try { duelHandled = false; } catch(_) {}
    try { storyDuelActive = true; } catch(_) {}

    // Limpiar modales, overlays y clases de duelos previos
    try {
      var dOver = document.getElementById('duelOver64');
      if (dOver) dOver.classList.remove('show');
      var dOut = document.getElementById('deckOut67');
      if (dOut) dOut.classList.remove('show');
      var lFlow = document.getElementById('linkFlow64');
      if (lFlow) lFlow.classList.remove('show');
    } catch(_) {}
    document.body.classList.remove('enemy-hand-50', 'enemy-hand-preview', 'link-pick-zone64');

    // Desbloquear estado de turno y fases
    try {
      if (typeof bpLocked114 !== 'undefined') bpLocked114 = false;
      if (typeof enterPlayerTurn114 === 'function') enterPlayerTurn114();
    } catch(_) {}

    // Asegurar vista de mano para que el jugador pueda interactuar de inmediato
    if (typeof setDuelView === 'function') setDuelView('hand');
    if (typeof playerHand50 === 'function') playerHand50();
    if (typeof updateSetButton103 === 'function') updateSetButton103();

    // Encabezado del duelo en el tablero
    var oppDisplayName = (window.DUELISTS_NAMES && window.DUELISTS_NAMES[opp]) || opp.toUpperCase();
    var hud = document.getElementById('campaignDuelHud3000');
    if (hud) hud.textContent = 'MUNDO 1 · ' + oppDisplayName;
    var topHeader = document.getElementById('duelTopHeader');
    if (topHeader) {
      var b = topHeader.querySelector('b');
      if (b) b.textContent = 'MUNDO 1 · ' + oppDisplayName;
    }

    if (typeof showLoading === 'function') showLoading(false);
    if (typeof render === 'function') render();
    if (typeof log === 'function') log('Decks oficiales listos: ' + oppDisplayName + ' (40) vs ' + ((sSave && sSave.name) || 'Jugador') + ' (40)');
    console.log('[installStoryDecks] Instalación completada sin mezclas de Tristan.');

    // Guaranteed God card in opening hand for Marik, Kaiba, and Yugi on Turn 1
    var yugiChosenGod = null;
    if (opp === 'yugi') {
      var gods = ['Slifer the Sky Dragon', 'Obelisk the Tormentor', 'The Winged Dragon of Ra'];
      yugiChosenGod = gods[Math.floor(Math.random() * gods.length)];
      window._yugiSelectedGod = yugiChosenGod;
      console.log('[Duel Yugi] Dios Egipcio seleccionado para Yugi:', yugiChosenGod);
    }
    var godMap = {
      'marik': 'The Winged Dragon of Ra',
      'kaiba': 'Obelisk the Tormentor',
      'yugi': yugiChosenGod || window._yugiSelectedGod || 'Slifer the Sky Dragon'
    };
    if (godMap[opp] && typeof game !== 'undefined' && game && Array.isArray(game.enemyHand)) {
      var targetGod = godMap[opp];
      var hasGod = game.enemyHand.some(function(c) {
        return c && (c.name === targetGod || c[0] === targetGod);
      });
      if (!hasGod) {
        var dIdx = (game.enemyDeck || []).findIndex(function(c) {
          return c && (c.name === targetGod || c[0] === targetGod);
        });
        var swapCard = game.enemyHand[0];
        if (dIdx >= 0) {
          var gCard = game.enemyDeck.splice(dIdx, 1)[0];
          game.enemyHand[0] = gCard;
          if (swapCard) game.enemyDeck.push(swapCard);
          console.log('[God Guarantee] Swapped ' + targetGod + ' into ' + opp + ' opening hand.');
        } else {
          var gCard = (typeof mk === 'function' ? mk(targetGod) : null) || { name: targetGod, atk: 5000, def: 5000, pos: 'ATK', faceUp: true };
          gCard.atk = 5000; gCard.def = 5000; gCard.pos = 'ATK'; gCard.faceUp = true;
          game.enemyHand[0] = gCard;
          if (swapCard && Array.isArray(game.enemyDeck)) game.enemyDeck.push(swapCard);
          console.log('[God Guarantee] Injected ' + targetGod + ' into ' + opp + ' opening hand.');
        }
      }
    }

    // Kosaburo Kaiba: starts with 5 Exodia pieces in Graveyard
    if (opp === 'kosaburo' && typeof game !== 'undefined' && game) {
      if (!Array.isArray(game.enemyGrave)) game.enemyGrave = [];
      var exodiaPieces = [
        'Exodia the Forbidden One',
        'Right Arm of the Forbidden One',
        'Left Arm of the Forbidden One',
        'Right Leg of the Forbidden One',
        'Left Leg of the Forbidden One'
      ];
      exodiaPieces.forEach(function(pieceName) {
        var alreadyInGrave = game.enemyGrave.some(function(c) {
          return c && (c.name === pieceName || c[0] === pieceName);
        });
        if (!alreadyInGrave) {
          var dIdx = (game.enemyDeck || []).findIndex(function(c) {
            return c && (c.name === pieceName || c[0] === pieceName);
          });
          if (dIdx >= 0) {
            var card = game.enemyDeck.splice(dIdx, 1)[0];
            game.enemyGrave.push(card);
          } else {
            var hIdx = (game.enemyHand || []).findIndex(function(c) {
              return c && (c.name === pieceName || c[0] === pieceName);
            });
            if (hIdx >= 0) {
              var card = game.enemyHand[hIdx];
              if (game.enemyDeck && game.enemyDeck.length > 0) {
                game.enemyHand[hIdx] = game.enemyDeck.pop();
              }
              game.enemyGrave.push(card);
            } else {
              var poolCard = (window.FMR_ST_POOL_V1 || []).find(function(x) { return x && x.name === pieceName; });
              var card = poolCard ? Object.assign({}, poolCard, { faceUp: true }) : { name: pieceName, atk: 1000, def: 1000, pos: 'ATK', faceUp: true };
              game.enemyGrave.push(card);
            }
          }
        }
      });
      console.log('[Kosaburo] 5 piezas de Exodia colocadas en el Cementerio rival. Total en enemyGrave:', game.enemyGrave.length);
      if (typeof render === 'function') render();
    }

    // Active Starting Fields for Final Bosses:
    // Pueblo Secreto de los Magos - Yugi (+500 ATK/DEF Spellcaster)
    // Montaña - Seto Kaiba (+500 ATK/DEF Dragon, Winged Beast, Thunder)
    // Yami - Marik (+500 ATK/DEF Fiend, Spellcaster | -400 ATK/DEF Fairy)
    if (typeof game !== 'undefined' && game) {
      if (opp === 'yugi' || opp === 'atem') {
        game.fieldBoost = 'SPELLCASTER_VILLAGE';
        game.activeField = 'Pueblo Secreto de los Magos';
        if (typeof log === 'function') log('🔮 ¡Campo activo: Pueblo Secreto de los Magos! Magos reciben +500 ATK y +500 DEF.');
      } else if (opp === 'kaiba' || opp === 'seto') {
        game.fieldBoost = 'MOUNTAIN';
        game.activeField = 'Montaña';
        if (typeof log === 'function') log('⛰️ ¡Campo activo: Montaña! Dragón, Bestia Alada y Trueno reciben +500 ATK y +500 DEF.');
      } else if (opp === 'marik') {
        game.fieldBoost = 'YAMI';
        game.activeField = 'Yami';
        if (typeof log === 'function') log('🌑 ¡Campo activo: Yami! Demonios y Magos reciben +500 ATK y +500 DEF (Hadas -400 ATK/DEF).');
      } else {
        if (game.fieldBoost === 'SPELLCASTER_VILLAGE' || game.fieldBoost === 'YAMI' || game.fieldBoost === 'MOUNTAIN') {
          game.fieldBoost = null;
          game.activeField = null;
        }
      }
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
    }
  };

  // Helper to extract card monster type
  window.getCardType = function(c) {
    if (!c) return '';
    var t = c.type || (Array.isArray(c) ? c[2] : '') || '';
    if (!t && c.name && typeof DB !== 'undefined' && Array.isArray(DB)) {
      var dbEntry = DB.find(function(x) { return x && x[0] === c.name; });
      if (dbEntry) t = dbEntry[2] || '';
    }
    return String(t || '');
  };

  // Field stat calculations (+500 ATK/DEF)
  window.getFieldStatsBoost = function(c) {
    if (!c || typeof game === 'undefined' || !game || !game.fieldBoost) {
      return { atk: 0, def: 0 };
    }
    var fb = game.fieldBoost;
    var t = (window.getCardType(c) || '').toLowerCase();

    // 1. Montaña (Seto Kaiba / Mountain)
    if (fb === 'MOUNTAIN') {
      if (t.includes('dragon') || t.includes('dragón') || t.includes('winged beast') || t.includes('bestia alada') || t.includes('thunder') || t.includes('trueno')) {
        return { atk: 500, def: 500 };
      }
    }
    // 2. Yami (Marik)
    else if (fb === 'YAMI') {
      if (t.includes('fiend') || t.includes('demonio') || t.includes('spellcaster') || t.includes('mago') || t.includes('conjur')) {
        return { atk: 500, def: 500 };
      }
      if (t.includes('fairy') || t.includes('hada')) {
        return { atk: -400, def: -400 };
      }
    }
    // 3. Pueblo Secreto de los Magos (Yugi)
    else if (fb === 'SPELLCASTER_VILLAGE') {
      if (t.includes('spellcaster') || t.includes('mago') || t.includes('conjur')) {
        return { atk: 500, def: 500 };
      }
    }
    // 4. Bosque (Forest)
    else if (fb === 'FOREST' || fb === 'FIELD_FOREST') {
      if (t.includes('insect') || t.includes('insecto') || t.includes('beast') || t.includes('bestia') || t.includes('plant') || t.includes('planta')) {
        return { atk: 500, def: 500 };
      }
    }
    // 5. Wasteland (Tierra Yerma)
    else if (fb === 'WASTELAND' || fb === 'FIELD_WASTELAND') {
      if (t.includes('dinosaur') || t.includes('dinosaurio') || t.includes('zombie') || t.includes('zombi') || t.includes('rock') || t.includes('roca')) {
        return { atk: 500, def: 500 };
      }
    }
    // 6. Sogen (Pradera de Guerreros)
    else if (fb === 'SOGEN' || fb === 'FIELD_SOGEN') {
      if (t.includes('warrior') || t.includes('guerrero')) {
        return { atk: 500, def: 500 };
      }
    }
    // 7. Umi (Océano)
    else if (fb === 'UMI' || fb === 'FIELD_UMI') {
      if (t.includes('aqua') || t.includes('acu') || t.includes('fish') || t.includes('pez') || t.includes('sea serpent') || t.includes('serpiente') || t.includes('thunder') || t.includes('trueno')) {
        return { atk: 500, def: 500 };
      }
      if (t.includes('machine') || t.includes('máquina') || t.includes('maquina') || t.includes('pyro') || t.includes('fuego')) {
        return { atk: -400, def: -400 };
      }
    }
    return { atk: 0, def: 0 };
  };

  // Synchronize DEF boosts into tempBoostDef so native combat damage reflects field defense
  window.syncFieldStats = function() {
    if (typeof game === 'undefined' || !game) return;
    var fieldCards = [
      ...(game.field || []),
      ...(game.enemy || []),
      ...(game.linkZones || []),
      ...(game.enemyLinkZones || [])
    ].filter(Boolean);

    fieldCards.forEach(function(c) {
      if (!c || c.kind === 'LINK') return;
      var boost = window.getFieldStatsBoost(c).def;
      var prevApplied = Number(c._appliedFieldDef || 0);
      if (prevApplied !== boost || c.tempBoostDef === undefined) {
        c.tempBoostDef = Math.max(0, Number(c.tempBoostDef || 0) - prevApplied + boost);
        c._appliedFieldDef = boost;
      }
    });
  };

  // Inject CSS rules for duel field themes (Villa, Yami, Montaña)
  function fmrInjectFieldThemeStyles() {
    if (document.getElementById('fmrFieldBoardStyle')) return;
    var style = document.createElement('style');
    style.id = 'fmrFieldBoardStyle';
    style.textContent = [
      '/* Villa (Pueblo Secreto de los Magos) */',
      '.board.field-theme-village {',
      '  background: linear-gradient(rgba(14, 10, 6, 0.45), rgba(18, 14, 9, 0.68)), url("ImagenesPersonajes/villa.jpg") center center / cover no-repeat !important;',
      '  border-color: #ba68c8 !important;',
      '  box-shadow: 0 0 28px rgba(186, 104, 200, 0.5), inset 0 0 60px rgba(0, 0, 0, 0.75) !important;',
      '  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease !important;',
      '}',
      '.board.field-theme-village .zone {',
      '  border-color: rgba(186, 104, 200, 0.55) !important;',
      '  background: linear-gradient(145deg, rgba(30, 20, 35, 0.4), rgba(186, 104, 200, 0.1)) !important;',
      '}',
      '#duelBoardWrapper.field-theme-village {',
      '  background: linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.82)), url("ImagenesPersonajes/villa.jpg") center center / cover no-repeat fixed !important;',
      '}',
      '',
      '/* Yami (Campo Sombrío) */',
      '.board.field-theme-yami {',
      '  background: linear-gradient(rgba(14, 6, 22, 0.5), rgba(8, 3, 16, 0.75)), url("ImagenesPersonajes/yami.jpg") center center / cover no-repeat !important;',
      '  border-color: #9c27b0 !important;',
      '  box-shadow: 0 0 30px rgba(156, 39, 176, 0.55), inset 0 0 60px rgba(0, 0, 0, 0.8) !important;',
      '  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease !important;',
      '}',
      '.board.field-theme-yami .zone {',
      '  border-color: rgba(156, 39, 176, 0.55) !important;',
      '  background: linear-gradient(145deg, rgba(20, 8, 30, 0.45), rgba(156, 39, 176, 0.12)) !important;',
      '}',
      '#duelBoardWrapper.field-theme-yami {',
      '  background: linear-gradient(rgba(0, 0, 0, 0.68), rgba(0, 0, 0, 0.86)), url("ImagenesPersonajes/yami.jpg") center center / cover no-repeat fixed !important;',
      '}',
      '',
      '/* Montaña */',
      '.board.field-theme-mountain {',
      '  background: linear-gradient(rgba(10, 16, 26, 0.45), rgba(8, 12, 20, 0.7)), url("ImagenesPersonajes/montana.jpg") center center / cover no-repeat !important;',
      '  border-color: #4a90e2 !important;',
      '  box-shadow: 0 0 30px rgba(74, 144, 226, 0.55), inset 0 0 60px rgba(0, 0, 0, 0.75) !important;',
      '  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease !important;',
      '}',
      '.board.field-theme-mountain .zone {',
      '  border-color: rgba(74, 144, 226, 0.55) !important;',
      '  background: linear-gradient(145deg, rgba(12, 22, 38, 0.45), rgba(74, 144, 226, 0.12)) !important;',
      '}',
      '#duelBoardWrapper.field-theme-mountain {',
      '  background: linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.82)), url("ImagenesPersonajes/montana.jpg") center center / cover no-repeat fixed !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }
  window.fmrInjectFieldThemeStyles = fmrInjectFieldThemeStyles;

  // Dynamic board visual transformer for active duel field
  window.updateFieldBoardTheme = function(fb) {
    if (typeof fmrInjectFieldThemeStyles === 'function') fmrInjectFieldThemeStyles();
    var board = document.querySelector('.board');
    var wrapper = document.getElementById('duelBoardWrapper');
    var body = document.body;

    var themeClasses = ['field-theme-village', 'field-theme-yami', 'field-theme-mountain'];
    var removeClasses = function(el) {
      if (!el) return;
      themeClasses.forEach(function(cls) { el.classList.remove(cls); });
    };

    removeClasses(body);
    removeClasses(board);
    removeClasses(wrapper);

    var targetTheme = null;
    var norm = String(fb || '').toUpperCase().trim();
    if (norm === 'SPELLCASTER_VILLAGE' || norm === 'VILLA' || norm === 'VILLAGE' || norm.includes('MAGO') || norm.includes('PUEBLO')) {
      targetTheme = 'field-theme-village';
    } else if (norm === 'YAMI' || norm.includes('SOMB')) {
      targetTheme = 'field-theme-yami';
    } else if (norm === 'MOUNTAIN' || norm === 'MONTANA' || norm === 'MONTAÑA') {
      targetTheme = 'field-theme-mountain';
    }

    if (targetTheme) {
      if (body) body.classList.add(targetTheme);
      if (board) board.classList.add(targetTheme);
      if (wrapper) wrapper.classList.add(targetTheme);
    }
  };

  // On-screen visual badge and board theme for active duel field
  window.updateFieldIndicator = function() {
    var badge = document.getElementById('fmrActiveFieldBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'fmrActiveFieldBadge';
      badge.style.cssText = 'display:none; padding:5px 16px; border-radius:18px; font-size:12px; font-weight:bold; letter-spacing:0.5px; border:2px solid #c4a04d; background:linear-gradient(135deg, rgba(15,15,25,0.95), rgba(30,25,10,0.95)); color:#fceea4; text-shadow:0 0 6px rgba(252,238,164,0.6); box-shadow:0 3px 12px rgba(0,0,0,0.6); margin: 6px auto; width: fit-content; text-align: center; z-index: 100; transition: all 0.3s ease; font-family: VT323, monospace;';
      var topHeader = document.getElementById('duelTopHeader');
      if (topHeader && topHeader.parentNode) {
        topHeader.parentNode.insertBefore(badge, topHeader.nextSibling);
      } else {
        var board = document.getElementById('duelBoardWrapper');
        if (board) board.insertBefore(badge, board.firstChild);
      }
    }
    if (typeof game === 'undefined' || !game || !game.fieldBoost) {
      badge.style.display = 'none';
      if (typeof window.updateFieldBoardTheme === 'function') window.updateFieldBoardTheme(null);
      return;
    }
    var fb = game.fieldBoost;
    if (typeof window.updateFieldBoardTheme === 'function') window.updateFieldBoardTheme(fb);

    if (fb === 'SPELLCASTER_VILLAGE') {
      badge.style.display = 'block';
      badge.innerHTML = '🔮 CAMPO ACTIVO: <span style="color:#d4a5ff;">PUEBLO SECRETO DE LOS MAGOS</span> <span style="font-size:11px;color:#bbb;margin-left:6px;">(+500 ATK/DEF Magos)</span>';
      badge.style.borderColor = '#ba68c8';
      badge.style.boxShadow = '0 0 12px rgba(186,104,200,0.4)';
    } else if (fb === 'MOUNTAIN') {
      badge.style.display = 'block';
      badge.innerHTML = '⛰️ CAMPO ACTIVO: <span style="color:#64b5f6;">MONTAÑA</span> <span style="font-size:11px;color:#bbb;margin-left:6px;">(+500 ATK/DEF Dragón, Trueno, Bestia Alada)</span>';
      badge.style.borderColor = '#4a90e2';
      badge.style.boxShadow = '0 0 12px rgba(74,144,226,0.4)';
    } else if (fb === 'YAMI') {
      badge.style.display = 'block';
      badge.innerHTML = '🌑 CAMPO ACTIVO: <span style="color:#ce93d8;">YAMI</span> <span style="font-size:11px;color:#bbb;margin-left:6px;">(+500 Demonios/Magos | -400 Hadas)</span>';
      badge.style.borderColor = '#9c27b0';
      badge.style.boxShadow = '0 0 12px rgba(156,39,176,0.4)';
    } else if (fb === 'FOREST' || fb === 'FIELD_FOREST') {
      badge.style.display = 'block';
      badge.innerHTML = '🌲 CAMPO ACTIVO: <span style="color:#81c784;">BOSQUE</span> <span style="font-size:11px;color:#bbb;margin-left:6px;">(+500 Insecto, Bestia, Planta)</span>';
      badge.style.borderColor = '#4caf50';
      badge.style.boxShadow = '0 0 12px rgba(76,175,80,0.4)';
    } else if (fb === 'WASTELAND' || fb === 'FIELD_WASTELAND') {
      badge.style.display = 'block';
      badge.innerHTML = '🏜️ CAMPO ACTIVO: <span style="color:#ffb74d;">TIERRA YERMA</span> <span style="font-size:11px;color:#bbb;margin-left:6px;">(+500 Dinosaurio, Zombi, Roca)</span>';
      badge.style.borderColor = '#ff9800';
      badge.style.boxShadow = '0 0 12px rgba(255,152,0,0.4)';
    } else if (fb === 'SOGEN' || fb === 'FIELD_SOGEN') {
      badge.style.display = 'block';
      badge.innerHTML = '⚔️ CAMPO ACTIVO: <span style="color:#ffd54f;">SOGEN</span> <span style="font-size:11px;color:#bbb;margin-left:6px;">(+500 Guerreros y Bestias-Guerrero)</span>';
      badge.style.borderColor = '#ffc107';
      badge.style.boxShadow = '0 0 12px rgba(255,193,7,0.4)';
    } else if (fb === 'UMI' || fb === 'FIELD_UMI') {
      badge.style.display = 'block';
      badge.innerHTML = '🌊 CAMPO ACTIVO: <span style="color:#4dd0e1;">UMI</span> <span style="font-size:11px;color:#bbb;margin-left:6px;">(+500 Agua, Pez, Trueno | -400 Máq/Fuego)</span>';
      badge.style.borderColor = '#00bcd4';
      badge.style.boxShadow = '0 0 12px rgba(0,188,212,0.4)';
    } else {
      badge.style.display = 'none';
      if (typeof window.updateFieldBoardTheme === 'function') window.updateFieldBoardTheme(null);
    }
  };

  // Exodia Necross & Field Boosts in effectiveAtk
  (function() {
    var prevEA = window.effectiveAtk;
    window.effectiveAtk = function(c) {
      if (!c) return 0;
      var val;
      if (typeof prevEA === 'function') {
        var origFB = (typeof game !== 'undefined' && game) ? game.fieldBoost : null;
        if (game) game.fieldBoost = null;
        val = prevEA.apply(this, arguments);
        if (game) game.fieldBoost = origFB;
      } else {
        val = Number(c && c.atk || 0) + Number(c && c.tempBoost || 0) + Number(c && c.equip || 0);
      }

      // Field Boost for ATK
      var fbStats = window.getFieldStatsBoost(c);
      val += fbStats.atk;
      val += Number(c._handEquipAtk || 0);

      // Exodia Necross ATK bonus
      var cName = c.name || c[0] || '';
      if (cName === 'Exodia Necross') {
        var side = (typeof findSide111 === 'function') ? findSide111(c) : null;
        var grave = [];
        if (typeof game !== 'undefined' && game) {
          if (side === 'enemy' || (!side && ((game.enemy && game.enemy.includes(c)) || (game.enemyLinkZones && game.enemyLinkZones.includes(c))))) {
            grave = game.enemyGrave || [];
          } else if (side === 'player' || (!side && ((game.field && game.field.includes(c)) || (game.linkZones && game.linkZones.includes(c))))) {
            grave = game.grave || [];
          } else {
            var opp = (window.storyOpponent || window.lastDuelOpponent || '').toLowerCase();
            grave = (opp === 'kosaburo' ? game.enemyGrave : game.grave) || [];
          }
        }
        var exodiaPieces = [
          'exodia the forbidden one',
          'right arm of the forbidden one',
          'left arm of the forbidden one',
          'right leg of the forbidden one',
          'left leg of the forbidden one'
        ];
        var pCount = (grave || []).filter(function(g) {
          return g && exodiaPieces.includes((g.name || g[0] || '').toLowerCase());
        }).length;
        val += (pCount * 300);
      }
      return Math.max(0, val);
    };
    try { effectiveAtk = window.effectiveAtk; } catch(_) {}

    function restoreHandEquips() {
      var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
      if (!g) return;
      ['player', 'enemy'].forEach(function(side) {
        var fList = side === 'player' ? (g.field || []).concat(g.linkZones || []) : (g.enemy || []).concat(g.enemyLinkZones || []);
        fList.forEach(function(c) {
          if (c && c._handEquipAtk) {
            c.equip = (c.equip || 0) + c._handEquipAtk;
            c._equipAtk111 = (c._equipAtk111 || 0) + c._handEquipAtk;
          }
          if (c && c._handEquipDef) {
            c.tempBoostDef = (c.tempBoostDef || 0) + c._handEquipDef;
            c._equipDef111 = (c._equipDef111 || 0) + c._handEquipDef;
          }
        });
      });
    }
    window.restoreHandEquips = restoreHandEquips;

    // Hook cardHTML to visually show boosted ATK and DEF on field and in hand
    var origCardHTML = window.cardHTML;
    if (typeof origCardHTML === 'function') {
      window.cardHTML = function(c, zone, i) {
        if (c) {
          var isFieldZone = (zone === 'f' || zone === 'e' || zone === 'l' || zone === 'el');
          var isExodia = (c.name === 'Exodia Necross' || c[0] === 'Exodia Necross');
          var hasBonus = !!(c.equip || c.tempBoost || c.tempBoostDef || c._handEquipAtk || c._handEquipDef || (c.equippedCards && c.equippedCards.length));
          if (isFieldZone || isExodia || (zone === 'h' && hasBonus)) {
            var effAtk = (zone === 'h') ? (Number(c.atk ?? c[4] ?? 0) + Number(c.tempBoost || 0) + Number(c.equip || 0) + Number(c._handEquipAtk || 0)) : ((typeof window.effectiveAtk === 'function') ? window.effectiveAtk(c) : (Number(c.atk || 0) + Number(c.equip || 0)));
            var effDef = (c.kind === 'LINK') ? null : (Number(c.def ?? c[5] ?? 0) + Number(c.tempDefense || 0) + Number(c.tempBoostDef || 0) + Number(c._handEquipDef || 0));
            var clone = Array.isArray(c) ? c.slice() : Object.assign({}, c);
            clone.atk = effAtk;
            clone.def = effDef;
            if (Array.isArray(c)) {
              clone.name = c[0];
              clone.level = c[1];
              clone.type = c[2];
              clone.attr = c[3];
              clone[4] = effAtk;
              clone[5] = effDef;
            }
            var rendered = origCardHTML.call(this, clone, zone, i);
            if (isFieldZone && (c._handEquipAtk || c._handEquipDef)) {
              rendered = rendered.replace(/<div class="fieldStats">[\s\S]*?<\/div>/, c.kind === 'LINK' ? '<div class="fieldStats"><span class="atk">⚔ ' + effAtk + '</span><span class="def">LINK</span></div>' : '<div class="fieldStats"><span class="atk">⚔ ' + effAtk + '</span><span class="def">🛡 ' + effDef + '</span></div>');
            }
            return rendered;
          }
        }
        return origCardHTML.apply(this, arguments);
      };
      try { cardHTML = window.cardHTML; } catch(_) {}
    }

    // Hook render to sync field stats and update indicator
    var origRender = window.render;
    if (typeof origRender === 'function') {
      window.render = function() {
        if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
        origRender.apply(this, arguments);
        restoreHandEquips();
        if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      };
      try { render = window.render; } catch(_) {}
    }

    // Hook updateCardInfo to display boosted stats in inspector
    var origUpdateCardInfo = window.updateCardInfo;
    if (typeof origUpdateCardInfo === 'function') {
      window.updateCardInfo = function() {
        origUpdateCardInfo.apply(this, arguments);
        var pick = (typeof game !== 'undefined' && game && game.selected) ? [...game.selected].reverse().find(function(x) { return ['f','e','l','el'].includes(x[0]); }) : null;
        if (pick) {
          var z = pick[0], idx = pick[1];
          var c = z === 'f' ? game.field[idx] : z === 'e' ? game.enemy[idx] : z === 'l' ? game.linkZones[idx] : game.enemyLinkZones[idx];
          if (c) {
            var effAtk = (typeof window.effectiveAtk === 'function') ? window.effectiveAtk(c) : c.atk;
            var effDef = (c.kind === 'LINK') ? 'LINK' : (Number(c.def ?? c[5] ?? 0) + Number(c.tempDefense || 0) + Number(c.tempBoostDef || 0));
            var atkElem = document.querySelector('#cardInfoBody .infoAtk');
            if (atkElem) atkElem.textContent = effAtk;
            var defElem = document.querySelector('#cardInfoBody .infoDef');
            if (defElem) defElem.textContent = effDef;
          }
        }
      };
      try { updateCardInfo = window.updateCardInfo; } catch(_) {}
    }
  })();

  function sendServerSave(saveObj) {
    var name = window.activeAccount;
    var pass = window.currentPassword;
    if (!name || !pass) {
      try {
        var sess = JSON.parse(sessionStorage.getItem('FMR_SESSION') || '{}');
        name = name || sess.name;
        pass = pass || sess.password;
      } catch(_) {}
    }
    if (!name || !pass || !saveObj) return;

    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, saveObj, { name: name, password: pass }))
    }).then(function(r) {
      if (r.ok) return r.json();
    }).then(function(data) {
      if (data && data.ok) {
        console.log('[Server Save] Partida sincronizada con éxito para:', name);
        if (data && window.memorySave) {
          var hasNew = false;
          window.memorySave.collection = window.memorySave.collection || {};
          if (data.collection) {
            for (var cn in data.collection) {
              var sVal = data.collection[cn];
              var mVal = window.memorySave.collection[cn] || 0;
              if (sVal > mVal) {
                window.memorySave.collection[cn] = sVal;
                hasNew = true;
              }
            }
          }
          if (data.pm !== undefined && data.pm > (window.memorySave.pm || 0)) {
            window.memorySave.pm = data.pm;
            hasNew = true;
          }
          if (data.rewardsHistory) {
            window.memorySave.rewardsHistory = data.rewardsHistory;
          }
          if (data.cleared && Array.isArray(data.cleared)) {
            window.memorySave.cleared = window.memorySave.cleared || [];
            for (var cIdx = 0; cIdx < data.cleared.length; cIdx++) {
              var cOpp = data.cleared[cIdx];
              if (!window.memorySave.cleared.includes(cOpp)) {
                window.memorySave.cleared.push(cOpp);
                hasNew = true;
              }
            }
          }
          if (data.unlocked && Array.isArray(data.unlocked)) {
            window.memorySave.unlocked = window.memorySave.unlocked || [];
            for (var uIdx = 0; uIdx < data.unlocked.length; uIdx++) {
              var uOpp = data.unlocked[uIdx];
              if (!window.memorySave.unlocked.includes(uOpp)) {
                window.memorySave.unlocked.push(uOpp);
                hasNew = true;
              }
            }
          }
          if (data.wins && typeof data.wins === 'object') {
            window.memorySave.wins = window.memorySave.wins || {};
            for (var wKey in data.wins) {
              var wServer = data.wins[wKey] || 0;
              var wLocal = window.memorySave.wins[wKey] || 0;
              if (wServer > wLocal) {
                window.memorySave.wins[wKey] = wServer;
                hasNew = true;
              }
            }
          }
          if (hasNew) {
            try {
              var sStr = JSON.stringify(window.memorySave);
              prevSetItem.call(localStorage, 'FMR_REBORN_STORY_V3000', sStr);
              if (name) prevSetItem.call(localStorage, 'FMR_SAVE_' + name, sStr);
            } catch(_) {}
          }
        }
      }
    }).catch(function(e) {
      console.warn('[Server Save] Error al guardar en servidor:', e);
    });
  }
  window.sendServerSave = sendServerSave;

  function syncLatestFromServer() {
    var name = window.activeAccount;
    var pass = window.currentPassword;
    if (!name || !pass) {
      try {
        var sess = JSON.parse(sessionStorage.getItem('FMR_SESSION') || '{}');
        name = name || sess.name;
        pass = pass || sess.password;
      } catch(_) {}
    }
    if (!name || !pass) return;

    fetch('/api/load/' + encodeURIComponent(name))
      .then(function(r) { if (r.ok) return r.json(); })
      .then(function(serverSave) {
        if (!serverSave) return;
        var saveToUpdate = window.memorySave;
        if (!saveToUpdate) {
          try {
            var rawStr = prevGetItem ? prevGetItem.call(localStorage, 'FMR_SAVE_' + name) : localStorage.getItem('FMR_SAVE_' + name);
            if (rawStr) saveToUpdate = JSON.parse(rawStr);
          } catch(_) {}
        }
        if (!saveToUpdate) saveToUpdate = {};

        var added = 0;
        if (serverSave.collection) {
          saveToUpdate.collection = saveToUpdate.collection || {};
          for (var c in serverSave.collection) {
            var sc = serverSave.collection[c];
            var mc = saveToUpdate.collection[c] || 0;
            if (sc > mc) {
              saveToUpdate.collection[c] = sc;
              added++;
            }
          }
        }
        if (serverSave.pm !== undefined && serverSave.pm > (saveToUpdate.pm || 0)) {
          saveToUpdate.pm = serverSave.pm;
          added++;
        }
        if (serverSave.rewardsHistory) {
          saveToUpdate.rewardsHistory = serverSave.rewardsHistory;
        }
        if (serverSave.cleared && Array.isArray(serverSave.cleared)) {
          saveToUpdate.cleared = saveToUpdate.cleared || [];
          for (var i = 0; i < serverSave.cleared.length; i++) {
            var clr = serverSave.cleared[i];
            if (!saveToUpdate.cleared.includes(clr)) {
              saveToUpdate.cleared.push(clr);
              added++;
            }
          }
        }
        if (serverSave.unlocked && Array.isArray(serverSave.unlocked)) {
          saveToUpdate.unlocked = saveToUpdate.unlocked || [];
          for (var j = 0; j < serverSave.unlocked.length; j++) {
            var unl = serverSave.unlocked[j];
            if (!saveToUpdate.unlocked.includes(unl)) {
              saveToUpdate.unlocked.push(unl);
              added++;
            }
          }
        }
        if (serverSave.wins && typeof serverSave.wins === 'object') {
          saveToUpdate.wins = saveToUpdate.wins || {};
          for (var w in serverSave.wins) {
            var sw = serverSave.wins[w] || 0;
            var lw = saveToUpdate.wins[w] || 0;
            if (sw > lw) {
              saveToUpdate.wins[w] = sw;
              added++;
            }
          }
        }
        if (added > 0) {
          if (typeof window.cleanSaveCollection === 'function') window.cleanSaveCollection(saveToUpdate);
          window.memorySave = saveToUpdate;
          try {
            var raw = JSON.stringify(saveToUpdate);
            prevSetItem.call(localStorage, 'FMR_REBORN_STORY_V3000', raw);
            prevSetItem.call(localStorage, 'FMR_SAVE_' + name, raw);
          } catch(_) {}
          console.log('[Sync] Progreso actualizado desde el servidor:', name);
        }
      }).catch(function(_) {});
  }
  window.syncLatestFromServer = syncLatestFromServer;

  var prevSaveGame = window.saveGame;
  window.saveGame = function() {
    if (prevSaveGame) prevSaveGame.apply(this, arguments);
    var s = window.memorySave || (typeof loadGame === 'function' && loadGame());
    if (s) sendServerSave(s);
  };

  var prevSetItem = localStorage.setItem;
  localStorage.setItem = function(k, v) {
    prevSetItem.apply(this, arguments);
    if ((k === 'FMR_REBORN_STORY_V3000' || (typeof k === 'string' && k.indexOf('FMR_SAVE_') === 0)) && v) {
      try {
        var parsed = JSON.parse(v);
        sendServerSave(parsed);
      } catch(_) {}
    }
  };

  try {
    var savedSession = JSON.parse(sessionStorage.getItem('FMR_SESSION') || 'null');
    if (savedSession && savedSession.name && savedSession.password) {
      window.activeAccount = savedSession.name;
      window.currentPassword = savedSession.password;
    }
  } catch(_) {}

  // Sincronización al volver a enfocar la ventana o periódicamente cada 30 segundos
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) syncLatestFromServer();
    });
    setInterval(syncLatestFromServer, 30000);
  }

  window.preloadServerDecks();
})();


// ================================================================
//  MASTER BATTLE, TRAP, FUSION & REBORN ENGINE (V6)
// ================================================================
(function() {
  function duelToast(msg) {
    var existing = document.getElementById('duelFloatingToast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.id = 'duelFloatingToast';
    t.style.cssText = "position:fixed;top:18%;left:50%;transform:translateX(-50%);background:rgba(20,10,0,0.95);border:3px solid #ffd700;color:#ffd700;padding:16px 28px;font-family:VT323, monospace;font-size:22px;z-index:999999;box-shadow:0 0 25px #000;border-radius:8px;text-align:center;pointer-events:none;";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.4s';
      setTimeout(function() { t.remove(); }, 400);
    }, 2800);
  }

  function isWorld1Duel() {
    if (typeof storyDuelActive !== 'undefined' && storyDuelActive) return true;
    var opp = (typeof storyOpponent !== 'undefined' && storyOpponent) ? String(storyOpponent).toLowerCase() : '';
    if (['tristan', 'weevil', 'mai', 'joey'].includes(opp)) return true;
    var s = (typeof loadGame === 'function' ? loadGame() : null) || window.memorySave;
    if (!s || (s.world || 1) === 1) return true;
    return false;
  }

  // 1. Universal mk() function
  window.mk = function(name) {
    if (!name) return null;
    if (typeof name === 'object') {
      var realName = name.name || name[0];
      if (name.atk !== undefined || name.kind === 'MONSTER') {
        return Object.assign({}, name, { pos: name.pos || 'ATK', materials: name.materials || [], faceUp: true });
      }
      name = realName;
    }
    if (typeof name !== 'string') return null;
    if (typeof DB !== 'undefined' && Array.isArray(DB)) {
      var x = DB.find(function(c) { return c && c[0] === name; });
      if (x) return { name: x[0], level: x[1], type: x[2], attr: x[3], atk: x[4], def: x[5], pos: 'ATK', materials: [], faceUp: true };
    }
    if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
      var cd = window.CARDS_DATA.find(function(c) { return c && c.name === name; });
      if (cd && (cd.kind === 'MONSTER' || cd.kind === 'FUSION' || cd.atk !== undefined)) {
        return { name: cd.name, level: cd.level || 4, type: cd.type || 'Warrior', attr: cd.attr || 'EARTH', atk: cd.atk || 0, def: cd.def || 0, pos: 'ATK', materials: [], faceUp: true };
      }
    }
    var pool = window.FMR_ST_POOL_V1 || [];
    var st = pool.find(function(c) { return c && c.name === name; });
    if (st) return Object.assign({}, st, { pos: 'ATK', materials: [], faceUp: true });
    return null;
  };
  try { mk = window.mk; } catch(_) {}

  function isEgyptianGod(name) {
    if (!name) return false;
    var n = String(name).toLowerCase();
    return n.includes('winged dragon of ra') || n.includes('obelisk the tormentor') || n.includes('slifer the sky dragon') || n === 'the winged dragon of ra' || n === 'obelisk the tormentor' || n === 'slifer the sky dragon';
  }

  // 2. 1 Invocacion o Colocacion Normal por Turno
  // normalSummon
  window.normalSummon = function() {
    if (!game || game.turn !== 'player') return;
    if (game.handSummoned) { duelToast('Solo se permite 1 invocaci\u00f3n o colocaci\u00f3n por turno.'); return; }
    var sel = (game.selected || []).find(function(x) { return x && x[0] === 'h'; });
    var idx = sel ? sel[1] : null;
    if (idx == null || !game.hand || !game.hand[idx]) { duelToast('Selecciona primero un monstruo de tu mano.'); return; }
    var c = game.hand[idx];
    if (typeof isST === 'function' && isST(c)) { duelToast('Esta carta es Magia/Trampa. No se puede invocar como monstruo.'); return; }

    var cName = c.name || c[0] || '';
    if (isEgyptianGod(cName)) {
      var tributes = [];
      for (var ti = 0; ti < (game.field || []).length; ti++) {
        if (game.field[ti]) tributes.push(ti);
      }
      if (tributes.length < 3) {
        duelToast('¡' + (c.name || 'El Dios Egipcio') + ' requiere tributar 3 monstruos en tu campo!');
        return;
      }
      // Send 3 tributes to graveyard
      for (var k = 0; k < 3; k++) {
        var tIdx = tributes[k];
        var tMon = game.field[tIdx];
        if (tMon && Array.isArray(game.grave)) {
          game.grave.push(Object.assign({}, tMon, { faceUp: true }));
        }
        game.field[tIdx] = null;
      }
    }

    var slot = game.field.findIndex(function(x) { return !x; });
    if (slot < 0) { duelToast('No hay espacio libre en tu campo de monstruos.'); return; }

    var monster = window.mk(c) || window.mk(c.name || c[0]) || Object.assign({}, c, { pos: 'ATK', materials: [], faceUp: true });
    if (!monster) { duelToast('Error al invocar.'); return; }

    var eqAtk = Number(c._handEquipAtk || c.equip || 0);
    var eqDef = Number(c._handEquipDef || c.tempBoostDef || 0);
    if (eqAtk) {
      monster._handEquipAtk = (monster._handEquipAtk || 0) + eqAtk;
      monster.equip = (monster.equip || 0) + eqAtk;
      monster._equipAtk111 = (monster._equipAtk111 || 0) + eqAtk;
    }
    if (eqDef) {
      monster._handEquipDef = (monster._handEquipDef || 0) + eqDef;
      monster.tempBoostDef = (monster.tempBoostDef || 0) + eqDef;
      monster._equipDef111 = (monster._equipDef111 || 0) + eqDef;
    }
    if (c.tempBoost) monster.tempBoost = (monster.tempBoost || 0) + c.tempBoost;
    if (c.equippedCards && c.equippedCards.length) {
      monster.equippedCards = (monster.equippedCards || []).concat(c.equippedCards);
    }

    if (isEgyptianGod(monster.name)) {
      monster.atk = 5000;
      monster.def = 5000;
      monster.pos = 'ATK';
      monster.faceUp = true;
    }

    if (window.playSummonSound) window.playSummonSound();
    game.field[slot] = monster;
    game.hand.splice(idx, 1);
    game.handSummoned = true;
    game.selected = [];
    if (typeof render === 'function') render();
    if (typeof setDuelView === 'function') setDuelView('field');
    if (isEgyptianGod(monster.name)) {
      duelToast('¡Tributaste 3 monstruos para invocar al Dios Egipcio ' + monster.name + ' (5000 ATK)!');
      if (typeof log === 'function') log('¡Invocaste al Dios Egipcio ' + monster.name + ' (5000 ATK / 5000 DEF) tras tributar 3 monstruos!');
    } else {
      duelToast('Invocaste a ' + (monster.name || 'monstruo') + ' en ATAQUE.');
      if (typeof log === 'function') log('Invocaste ' + (monster.name || 'monstruo') + '.');
    }
  };
  try { normalSummon = window.normalSummon; } catch(_) {}

  // setMonster hook: 1 invocación o colocación por turno + Dioses NO pueden ser SET + soporte directo sin recursión
  window.setMonster103 = function() {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g || g.turn !== 'player') return;
    if (g.handSummoned) {
      if (typeof duelToast === 'function') duelToast('Solo se permite 1 invocación o colocación por turno.');
      if (typeof log === 'function') log('Ya hiciste tu invocación o SET desde la mano este turno.');
      return;
    }

    var sel = (g.selected || []).find(function(x) { return x && x[0] === 'h'; });
    var handCard = (sel && g.hand) ? g.hand[sel[1]] : null;
    if (!handCard) {
      if (typeof duelToast === 'function') duelToast('Selecciona exactamente 1 monstruo de la mano para hacer SET.');
      return;
    }

    // Regla de Dioses Egipcios: NO pueden ser colocados boca abajo (SET)
    var selName = handCard.name || handCard[0] || '';
    if (typeof isEgyptianGod === 'function' && isEgyptianGod(selName)) {
      if (typeof duelToast === 'function') duelToast('¡' + (handCard.name || 'El Dios Egipcio') + ' no puede colocarse boca abajo (SET)! Debe ser invocado en ATAQUE tributando 3 monstruos.');
      if (typeof log === 'function') log('¡' + (handCard.name || 'El Dios Egipcio') + ' no puede colocarse boca abajo (SET)! Requiere 3 tributos en ATAQUE.');
      return;
    }

    // Validación de monstruo
    var isMonster = handCard.kind === 'MONSTER' || handCard.atk !== undefined || (typeof isST === 'function' && !isST(handCard));
    var isFusion = String(handCard.kind || '').toUpperCase() === 'FUSION' || (window.FMR_CARD_META && window.FMR_CARD_META[selName] && String(window.FMR_CARD_META[selName].kind || '').toUpperCase() === 'FUSION');
    if (!isMonster || isFusion) {
      if (isFusion && typeof log === 'function') log('Los monstruos FUSIÓN no pueden colocarse con SET desde la mano.');
      else if (typeof log === 'function') log('Solo se pueden colocar monstruos en DEFENSA boca abajo.');
      return;
    }

    var slot = (g.field || []).findIndex(function(x) { return !x; });
    if (slot < 0) {
      if (typeof log === 'function') log('No hay espacio en tu campo para colocar el monstruo.');
      return;
    }

    var placed = (typeof mk === 'function' ? mk(selName) : null);
    if (!placed) {
      placed = {
        name: selName,
        level: handCard.level != null ? handCard.level : handCard[1],
        type: handCard.type || handCard[2] || 'Warrior',
        attr: handCard.attr || handCard[3] || 'EARTH',
        atk: handCard.atk != null ? handCard.atk : handCard[4],
        def: handCard.def != null ? handCard.def : handCard[5],
        materials: []
      };
    }
    placed.pos = 'DEF';
    placed.faceDown = true;
    placed.faceDownSet103 = true;
    placed.setFromHand = true;
    placed.summonedTurn = g.turnNo;
    if (window.playSetSound) window.playSetSound();
    placed.activeSign = null;
    placed.guardianSign = null;
    delete placed._signChosen101;

    // Transferencia de equipamientos de mano
    var savedEquip = Number(handCard._handEquipAtk || handCard.equip || 0);
    var savedBoost = handCard.tempBoost || 0;
    var savedBoostDef = Number(handCard._handEquipDef || handCard.tempBoostDef || 0);
    var savedEquippedCards = handCard.equippedCards ? handCard.equippedCards.slice() : [];
    if (savedEquip || savedBoost || savedBoostDef) {
      placed._handEquipAtk = (placed._handEquipAtk || 0) + savedEquip;
      placed.equip = (placed.equip || 0) + savedEquip;
      placed._equipAtk111 = (placed._equipAtk111 || 0) + savedEquip;
      placed._handEquipDef = (placed._handEquipDef || 0) + savedBoostDef;
      placed.tempBoostDef = (placed.tempBoostDef || 0) + savedBoostDef;
      placed._equipDef111 = (placed._equipDef111 || 0) + savedBoostDef;
      if (savedBoost) placed.tempBoost = (placed.tempBoost || 0) + savedBoost;
      if (savedEquippedCards.length) {
        placed.equippedCards = (placed.equippedCards || []).concat(savedEquippedCards);
      }
      placed._handEquipTransferred = true;
    }

    g.field[slot] = placed;
    g.hand.splice(sel[1], 1);
    g.handSummoned = true;
    g.selected = [];
    if (typeof render === 'function') render();
    if (typeof setDuelView === 'function') setDuelView('field');
    if (typeof log === 'function') log(selName + ' fue colocado en DEFENSA boca abajo (SET).');
    if (typeof updateSetButton103 === 'function') updateSetButton103();
  };
  window.setMonster = window.setMonster103;

  // Interceptor global en fase de captura para el botón SET (#setMonsterBtn103):
  document.addEventListener('click', function(e) {
    var btn = e.target && (e.target.id === 'setMonsterBtn103' || (typeof e.target.closest === 'function' && e.target.closest('#setMonsterBtn103')));
    if (btn) {
      var g = (typeof game !== 'undefined' && game) ? game : window.game;
      if (!g || g.turn !== 'player') return;
      var sel = (g.selected || []).find(function(x) { return x && x[0] === 'h'; });
      var handCard = (sel && g.hand) ? g.hand[sel[1]] : null;
      if (handCard && typeof isEgyptianGod === 'function' && isEgyptianGod(handCard.name || handCard[0])) {
        e.preventDefault();
        e.stopImmediatePropagation();
        duelToast('¡' + (handCard.name || 'El Dios Egipcio') + ' no puede colocarse boca abajo (SET)! Debe ser invocado en ATAQUE tributando 3 monstruos.');
        if (typeof log === 'function') log('¡' + (handCard.name || 'El Dios Egipcio') + ' no puede colocarse boca abajo (SET)!');
        return false;
      }
    }
  }, true);
  try { setMonster103 = window.setMonster103; setMonster = window.setMonster; } catch(_) {}

  // AI 3-Tribute Hook & Ultra-Aggressive Summoning for Egyptian Gods
  var origAiHandSummon = window.aiHandSummonOrSet;
  window.aiHandSummonOrSet = function() {
    if (typeof game === 'undefined' || !game || game.turn !== 'enemy') return;
    var opp = (window.storyOpponent || window.lastDuelOpponent || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    var isGodBoss = (opp === 'marik' || opp === 'kaiba' || opp === 'seto' || opp === 'yugi');
    var hand = Array.isArray(game.enemyHand) ? game.enemyHand : [];

    // Ensure God card in hand for God Bosses on turn 1
    var godMap = {
      'marik': 'The Winged Dragon of Ra',
      'kaiba': 'Obelisk the Tormentor',
      'seto': 'Obelisk the Tormentor',
      'yugi': window._yugiSelectedGod || 'Slifer the Sky Dragon'
    };
    if (isGodBoss && godMap[opp] && (game.turnNo === 1 || !hand.some(function(c) { return c && isEgyptianGod(c.name || c[0]); }))) {
      var targetGodName = godMap[opp];
      var hasGodInHand = hand.some(function(c) { return c && (c.name === targetGodName || c[0] === targetGodName); });
      var hasGodOnField = (game.enemy || []).some(function(c) { return c && (c.name === targetGodName || c[0] === targetGodName); });
      if (!hasGodInHand && !hasGodOnField) {
        var dIdx = (game.enemyDeck || []).findIndex(function(c) { return c && (c.name === targetGodName || c[0] === targetGodName); });
        var swapC = hand[0];
        if (dIdx >= 0) {
          var gCard = game.enemyDeck.splice(dIdx, 1)[0];
          hand[0] = gCard;
          if (swapC) game.enemyDeck.push(swapC);
        } else {
          var gCard = (typeof mk === 'function' ? mk(targetGodName) : null) || { name: targetGodName, atk: 5000, def: 5000, pos: 'ATK', faceUp: true };
          gCard.atk = 5000; gCard.def = 5000; gCard.pos = 'ATK'; gCard.faceUp = true;
          hand[0] = gCard;
          if (swapC && Array.isArray(game.enemyDeck)) game.enemyDeck.push(swapC);
        }
      }
    }

    var godIdx = hand.findIndex(function(c) { return c && isEgyptianGod(c.name || c[0]); });

    // Invocación de Dios Egipcio SIN tributos para Yugi, Kaiba y Marik (3 tributos solo para el jugador)
    if (godIdx >= 0 && isGodBoss) {
      var targetSlot = (game.enemy || []).findIndex(function(x) { return !x; });
      if (targetSlot < 0) {
        var minAtk = 999999, weakestSlot = -1;
        for (var ei = 0; ei < (game.enemy || []).length; ei++) {
          var em = game.enemy[ei];
          if (em && !isEgyptianGod(em.name || em[0])) {
            var emAtk = Number(em.atk || em[4] || 0);
            if (emAtk < minAtk) { minAtk = emAtk; weakestSlot = ei; }
          }
        }
        if (weakestSlot >= 0) {
          if (Array.isArray(game.enemyGrave)) game.enemyGrave.push(game.enemy[weakestSlot]);
          game.enemy[weakestSlot] = null;
          targetSlot = weakestSlot;
        }
      }

      if (targetSlot >= 0) {
        var godCard = hand.splice(godIdx, 1)[0];
        var summoned = typeof mk === 'function' ? mk(godCard.name || godCard[0]) : null;
        if (!summoned) summoned = Object.assign({}, godCard, { atk: 5000, def: 5000, pos: 'ATK', faceUp: true });
        summoned.atk = 5000; summoned.def = 5000; summoned.pos = 'ATK'; summoned.faceUp = true;
        game.enemy[targetSlot] = summoned;

        var summonDialogue = {
          'marik': '¡Jajajaja! ¡Siente la furia divina! ¡El Dragón Alado de Ra desciende al campo de batalla con 5000 ATK!',
          'kaiba': '¡Ríndete! ¡Nadie puede desafiar mi poder absoluto! ¡Obelisk the Tormentor destruirá todo con 5000 ATK!',
          'seto': '¡Ríndete! ¡Nadie puede desafiar mi poder absoluto! ¡Obelisk the Tormentor destruirá todo con 5000 ATK!',
          'yugi': '¡El lazo con los dioses antiguos despierta! ¡' + (summoned.name || 'Dios Egipcio') + ' desciende al campo de batalla con 5000 ATK!'
        };
        var msg = summonDialogue[opp] || ('¡' + opp.toUpperCase() + ' invoca al Dios Egipcio ' + summoned.name + ' (5000 ATK / 5000 DEF) sin necesidad de tributos!');
        if (typeof log === 'function') log(msg);
        duelToast(msg);
        game._aiPlan108 = null;
        if (typeof render === 'function') render();
        return;
      }
    }

    // Ultra-Aggressive summoning for God Bosses: ALWAYS summon if room and build towards 3 tributes
    if (isGodBoss) {
      // Proactive Crush Card Virus activation by God Boss if SET and ready
      var ccvEnemyIdx = (game.enemyBack || []).findIndex(function(c) {
        return c && c.set && (c.value === 'CRUSH_CARD_VIRUS' || c.name === 'Crush Card Virus') && (game.turnNo >= (c.readyTurn || 0));
      });
      if (ccvEnemyIdx >= 0 && (game.field || []).some(function(x) { return x && !isEgyptianGod(x.name || x[0]); })) {
        var ccvCard = game.enemyBack[ccvEnemyIdx];
        game.enemyBack[ccvEnemyIdx] = null;
        game.enemyGrave.push(Object.assign({}, ccvCard, { set: false, faceUp: true }));
        var pDest = 0;
        for (var pSlot = 0; pSlot < (game.field || []).length; pSlot++) {
          var pMon = game.field[pSlot];
          if (pMon) {
            if (isEgyptianGod(pMon.name || pMon[0])) continue;
            game.grave.push(pMon);
            game.field[pSlot] = null;
            pDest++;
          }
        }
        if (window.playDestroySound) window.playDestroySound();
        var msgCCV = '\u00a1' + opp.toUpperCase() + ' activa Crush Card Virus! Destruye ' + pDest + ' monstruo(s) en tu campo. (Mano y deck no son afectados)';
        if (typeof log === 'function') log(msgCCV);
        duelToast(msgCCV);
        if (typeof render === 'function') render();
      }

      // 1. Set any Trap card in hand
      var trapIdx = hand.findIndex(function(c) { return c && (c.kind === 'TRAP' || (c.type && String(c.type).includes('Trap'))); });
      var freeBack = (game.enemyBack || []).findIndex(function(x) { return !x; });
      if (trapIdx >= 0 && freeBack >= 0) {
        var trapCard = hand.splice(trapIdx, 1)[0];
        var curT = Number((game && game.turnNo) || 1);
        game.enemyBack[freeBack] = Object.assign({}, trapCard, {
          set: true,
          setSide: 'enemy',
          setTurn: curT,
          readyTurn: curT + 1,
          _setThisTurn: curT
        });
        if (typeof log === 'function') log(opp.toUpperCase() + ' coloca una Trampa agresivamente.');
      }

      // 2. Summon non-God monster (no 35% chance to skip - 100% aggressive!)
      var freeSlot = (game.enemy || []).findIndex(function(x) { return !x; });
      if (freeSlot >= 0 && hand.length > 0) {
        var nonGodMons = hand.filter(function(c) {
          return c && !isEgyptianGod(c.name || c[0]) && (c.kind === 'MONSTER' || c.atk !== undefined || (!c.kind && typeof isST === 'function' && !isST(c)));
        });
        if (nonGodMons.length > 0) {
          nonGodMons.sort(function(a, b) { return Number(b.atk || b[4] || 0) - Number(a.atk || a[4] || 0); });
          var chosen = nonGodMons[0];
          var hIdx = hand.indexOf(chosen);
          if (hIdx >= 0) {
            hand.splice(hIdx, 1);
            var mObj = typeof mk === 'function' ? mk(chosen.name || chosen[0]) : null;
            if (!mObj) mObj = Object.assign({}, chosen, { pos: 'ATK', materials: [], faceUp: true });
            mObj.pos = 'ATK'; mObj.faceUp = true;
            game.enemy[freeSlot] = mObj;
            if (typeof log === 'function') log(opp.toUpperCase() + ' invoca en ATAQUE a ' + (mObj.name || 'un monstruo') + '.');

            // Re-check: Did this summon leave God in hand for God Bosses?
            godIdx = hand.findIndex(function(c) { return c && isEgyptianGod(c.name || c[0]); });
            if (godIdx >= 0 && isGodBoss) {
              var targetSlot2 = (game.enemy || []).findIndex(function(x) { return !x; });
              if (targetSlot2 >= 0) {
                var gCard = hand.splice(godIdx, 1)[0];
                var gSummoned = typeof mk === 'function' ? mk(gCard.name || gCard[0]) : null;
                if (!gSummoned) gSummoned = Object.assign({}, gCard, { atk: 5000, def: 5000, pos: 'ATK', faceUp: true });
                gSummoned.atk = 5000; gSummoned.def = 5000; gSummoned.pos = 'ATK'; gSummoned.faceUp = true;
                game.enemy[targetSlot2] = gSummoned;

                var summonDialogue2 = {
                  'marik': '¡Jajajaja! ¡Siente la furia divina! ¡El Dragón Alado de Ra desciende al campo de batalla con 5000 ATK!',
                  'kaiba': '¡Ríndete! ¡Nadie puede desafiar mi poder absoluto! ¡Obelisk the Tormentor destruirá todo con 5000 ATK!',
                  'seto': '¡Ríndete! ¡Nadie puede desafiar mi poder absoluto! ¡Obelisk the Tormentor destruirá todo con 5000 ATK!',
                  'yugi': '¡El lazo con los dioses antiguos despierta! ¡' + (gSummoned.name || 'Dios Egipcio') + ' desciende al campo de batalla con 5000 ATK!'
                };
                var msg2 = summonDialogue2[opp] || ('¡' + opp.toUpperCase() + ' invoca al Dios Egipcio ' + gSummoned.name + ' (5000 ATK / 5000 DEF) sin necesidad de tributos!');
                if (typeof log === 'function') log(msg2);
                duelToast(msg2);
              }
            }

            if (typeof render === 'function') render();
            return;
          }
        }
      }
    }

    if (origAiHandSummon) return origAiHandSummon.apply(this, arguments);
  };
  try { aiHandSummonOrSet = window.aiHandSummonOrSet; } catch(_) {}

  // 3. Fusion System (Mano + Mano, Campo + Mano, Campo + Campo, Fusiones en Cadena de 3+ Materiales)
  window.FUSION_MONSTER_NAMES = window.FUSION_MONSTER_NAMES || new Set([
    "Alligator's Sword Dragon","Amazon of the Seas","Amphibious Bugroth","Amulet Dragon","Arcana Knight Joker",
    "Armored Zombie","B. Dragon Jungle King","Bean Soldier","Black Skull Dragon","Blackland Fire Dragon",
    "Bolt Escargot","Chimera the Flying Mythical Beast","Corroding Shark","Crimson Sunbird","Curse of Dragon",
    "Cyber Saurus","Cyber Soldier","Dark Magician Girl the Dragon Knight","Dark Paladin","Dark Witch",
    "Darkfire Dragon","Dice Armadillo","Disk Magician","Dissolverock","Doom Virus Dragon","Dragon Statue",
    "Dragon Zombie","Egyptian God Slime","Empress Judge","Enchanting Mermaid","Fire Reaper","Firegrass",
    "Flame Cerebrus","Flame Ghost","Flame Swordsman","Flower Wolf","Gaia the Dragon Champion","Giga-Tech Wolf",
    "Great Mammoth of Goldfine","Humanoid Worm Drake","Ice Water","Kairyu-Shin","Kaminari Attack",
    "Kwagar Hercules","Maga Oscura","Magical Ghost","Man-eating Black Shark","Marine Beast","Mavelus",
    "Metal Dragon","Metal Fish","Misairuzame","Mystical Sand","Nekogal #2","Pumpking the King of Ghosts",
    "Queen of Autumn Leaves","Rare Fish","Reaper on the Nightmare","Red-Eyes Black Dragon Sword",
    "Rose Spectre of Dunn","Sea King Dragon","Shadow Specter","Skelgon","Skull Knight","Snakeyashi",
    "Spike Seadra","Stone D.","Stone Ghost","Sword Arm of Dragon","The Immortal of Thunder",
    "Thousand Dragon","Thunder Dragon","Tiger Axe","Tripwire Beast","Turtle Tiger","Twin-Headed Thunder Dragon",
    "Tyrant Burst Dragon","Ultimate Dragon","Ushi Oni","Warrior of Tradition","Wood Remains","XY-Dragon Cannon",
    "XYZ-Dragon Cannon","XZ-Tank Cannon","YZ-Tank Dragon","Zombie Warrior",
    "Super Roboyarou","Super Robolady","Ryu Senshi"
  ]);

  function isFusionMonster(c) {
    if (!c) return false;
    if (typeof isST === 'function' && isST(c)) return false;
    if (c.kind === 'SPELL' || c.kind === 'TRAP' || c.kind === 'EQUIP') return false;
    if (c.type === 'SPELL' || c.type === 'TRAP' || c.type === 'EQUIP') return false;
    if (c.isFusion || c._isFused || c.kind === 'FUSION' || c.type === 'Fusion') return true;
    if (c.text && String(c.text).toUpperCase().startsWith('FUSION:')) return true;
    if (c.desc && String(c.desc).toUpperCase().startsWith('FUSION:')) return true;
    if (Array.isArray(c.materials) && c.materials.length > 0) return true;
    var name = c.name || c[0] || (typeof c === 'string' ? c : '');
    if (window.FUSION_MONSTER_NAMES && window.FUSION_MONSTER_NAMES.has(name)) return true;
    return false;
  }
  window.isFusionMonster = isFusionMonster;

  function getMonsterLevel(c) {
    if (!c) return 0;
    var lvl = Number(c.level ?? c[1] ?? 0);
    if (!lvl && typeof window.metaFor === 'function') {
      var m = window.metaFor(c.name || c[0]);
      if (m && m.level) lvl = Number(m.level);
    }
    if (!lvl && window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
      var cd = window.CARDS_DATA.find(function(x) { return x && x.name === (c.name || c[0]); });
      if (cd && cd.level) lvl = Number(cd.level);
    }
    return lvl || 0;
  }
  window.getMonsterLevel = getMonsterLevel;

  function isMonsterCard(c) {
    if (!c) return false;
    var n = cardName(c).toLowerCase();
    if (n.includes('critias') || n.includes('hermos') || n.includes('crush card') || n.includes('tyrant wing')) return true;
    if (typeof isST === 'function' && isST(c)) return false;
    if (c.kind === 'SPELL' || c.kind === 'TRAP' || c.kind === 'EQUIP') return false;
    if (c.type === 'SPELL' || c.type === 'TRAP' || c.type === 'EQUIP') return false;
    return true;
  }

  function cardName(c) {
    if (!c) return '';
    return c.name || c[0] || '';
  }

  function callPairFusion(n1, n2) {
    var fn = typeof fusionResult === 'function' ? fusionResult : window.fusionResult;
    return fn ? fn([n1, n2]) : null;
  }

  function getPermutations(arr) {
    if (arr.length <= 1) return [arr];
    var res = [];
    for (var i = 0; i < arr.length; i++) {
      var cur = arr[i];
      var rest = arr.slice(0, i).concat(arr.slice(i + 1));
      var sub = getPermutations(rest);
      for (var s = 0; s < sub.length; s++) {
        res.push([cur].concat(sub[s]));
      }
    }
    return res;
  }

  function resolveChainedFusion(cardNames) {
    if (!cardNames || cardNames.length < 2) return null;
    if (cardNames.length === 2) {
      var r2 = callPairFusion(cardNames[0], cardNames[1]);
      if (r2) {
        var m2 = (typeof window.metaFor === 'function' ? window.metaFor(r2) : null) || {};
        return { result: r2, chain: cardNames.slice(), atk: m2.atk || 0, materialsUsed: cardNames.slice() };
      }
      return null;
    }

    var perms = getPermutations(cardNames);
    var best = null;

    for (var p = 0; p < perms.length; p++) {
      var perm = perms[p];
      var current = callPairFusion(perm[0], perm[1]);
      if (!current) continue;
      var valid = true;
      for (var k = 2; k < perm.length; k++) {
        var next = callPairFusion(current, perm[k]);
        if (!next) {
          valid = false;
          break;
        }
        current = next;
      }
      if (valid && current) {
        var meta = (typeof window.metaFor === 'function' ? window.metaFor(current) : null) || {};
        var atk = meta.atk || 0;
        if (!best || atk > best.atk) {
          best = { result: current, chain: perm.slice(), atk: atk, materialsUsed: cardNames.slice() };
        }
      }
    }

    return best;
  }
  window.resolveChainedFusion = resolveChainedFusion;

  function resolveFieldChainedFusion(fieldName, handNames) {
    if (!fieldName || !handNames || !handNames.length) return null;
    if (handNames.length === 1) {
      var r = callPairFusion(fieldName, handNames[0]);
      if (r) {
        var m = (typeof window.metaFor === 'function' ? window.metaFor(r) : null) || {};
        return { result: r, chain: [fieldName, handNames[0]], atk: m.atk || 0 };
      }
      return null;
    }

    var perms = getPermutations(handNames);
    var best = null;

    for (var p = 0; p < perms.length; p++) {
      var perm = perms[p];
      var current = callPairFusion(fieldName, perm[0]);
      if (!current) continue;
      var valid = true;
      for (var k = 1; k < perm.length; k++) {
        var next = callPairFusion(current, perm[k]);
        if (!next) { valid = false; break; }
        current = next;
      }
      if (valid && current) {
        var meta = (typeof window.metaFor === 'function' ? window.metaFor(current) : null) || {};
        var atk = meta.atk || 0;
        if (!best || atk > best.atk) {
          best = { result: current, chain: [fieldName].concat(perm), atk: atk };
        }
      }
    }

    if (handNames.length >= 2) {
      var handBest = resolveChainedFusion(handNames);
      if (handBest) {
        var fRes = callPairFusion(handBest.result, fieldName);
        if (fRes) {
          var meta2 = (typeof window.metaFor === 'function' ? window.metaFor(fRes) : null) || {};
          var atk2 = meta2.atk || 0;
          if (!best || atk2 > best.atk) {
            best = { result: fRes, chain: handBest.chain.concat([fieldName]), atk: atk2 };
          }
        }
      }
    }

    return best;
  }
  window.resolveFieldChainedFusion = resolveFieldChainedFusion;

  function getFusionCardThumb(name) {
    var dict = window.getGlobalCardDict ? window.getGlobalCardDict() : {};
    if (dict[name] && window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[dict[name].num]) {
      return window.CUSTOM_LOCAL_IMAGES[dict[name].num];
    }
    if (window.CARD_MAPPINGS && window.CARD_MAPPINGS[name] && window.CUSTOM_LOCAL_IMAGES) {
      var num = window.CARD_MAPPINGS[name];
      if (window.CUSTOM_LOCAL_IMAGES[num]) return window.CUSTOM_LOCAL_IMAGES[num];
    }
    if (window.BANDAI_ART_FILES && window.BANDAI_ART_FILES[name]) return window.BANDAI_ART_FILES[name];
    if (window.CARD_FILES && window.CARD_FILES[name] && window.CARD_FILES[name].length > 0) {
      return 'https://yugioh.fandom.com/wiki/Special:Redirect/file/' + encodeURIComponent(window.CARD_FILES[name][0]);
    }
    if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
      var cd = window.CARDS_DATA.find(function(x) { return x && x.name === name; });
      if (cd && cd.image) return cd.image;
    }
    return 'https://i.imgur.com/vHqR8Kq.png';
  }

  function getAvailableFusionOptions() {
    if (!game || !game.hand || game.turn !== 'player' || game.handSummoned) return [];
    var out = [];
    var seen = {};

    // A. MANO + MANO (Pares)
    for (var i = 0; i < game.hand.length; i++) {
      var c1 = game.hand[i];
      if (!isMonsterCard(c1)) continue;
      var name1 = cardName(c1);
      if (!name1) continue;
      for (var j = i + 1; j < game.hand.length; j++) {
        var c2 = game.hand[j];
        if (!isMonsterCard(c2)) continue;
        var name2 = cardName(c2);
        if (!name2) continue;
        var r = callPairFusion(name1, name2);
        if (r) {
          var key = 'h' + i + '+h' + j + '->' + r;
          if (!seen[key]) {
            seen[key] = true;
            out.push({
              type: 'hand-hand',
              a: { zone: 'h', index: i, card: c1, name: name1 },
              b: { zone: 'h', index: j, card: c2, name: name2 },
              materials: [
                { zone: 'h', index: i, card: c1, name: name1 },
                { zone: 'h', index: j, card: c2, name: name2 }
              ],
              result: r
            });
          }
        }
      }
    }

    // B. MANO (3 Materiales en Cadena)
    if (game.hand.length >= 3) {
      for (var i = 0; i < game.hand.length; i++) {
        var cA = game.hand[i];
        if (!isMonsterCard(cA)) continue;
        var nA = cardName(cA);
        for (var j = i + 1; j < game.hand.length; j++) {
          var cB = game.hand[j];
          if (!isMonsterCard(cB)) continue;
          var nB = cardName(cB);
          for (var k = j + 1; k < game.hand.length; k++) {
            var cC = game.hand[k];
            if (!isMonsterCard(cC)) continue;
            var nC = cardName(cC);
            var r3 = resolveChainedFusion([nA, nB, nC]);
            if (r3) {
              var key3 = 'h' + i + '+h' + j + '+h' + k + '->' + r3.result;
              if (!seen[key3]) {
                seen[key3] = true;
                out.push({
                  type: 'hand-chain-3',
                  materials: [
                    { zone: 'h', index: i, card: cA, name: nA },
                    { zone: 'h', index: j, card: cB, name: nB },
                    { zone: 'h', index: k, card: cC, name: nC }
                  ],
                  result: r3.result,
                  chain: r3.chain
                });
              }
            }
          }
        }
      }
    }

    // C. CAMPO + MANO (Pares)
    for (var f = 0; f < (game.field || []).length; f++) {
      var cf = game.field[f];
      if (!cf || !isMonsterCard(cf)) continue;
      var nameF = cardName(cf);
      if (!nameF) continue;
      for (var h = 0; h < game.hand.length; h++) {
        var ch = game.hand[h];
        if (!isMonsterCard(ch)) continue;
        var nameH = cardName(ch);
        if (!nameH) continue;
        var rF = callPairFusion(nameF, nameH);
        if (rF) {
          var keyF = 'f' + f + '+h' + h + '->' + rF;
          if (!seen[keyF]) {
            seen[keyF] = true;
            out.push({
              type: 'field-hand',
              a: { zone: 'f', index: f, card: cf, name: nameF },
              b: { zone: 'h', index: h, card: ch, name: nameH },
              materials: [
                { zone: 'f', index: f, card: cf, name: nameF },
                { zone: 'h', index: h, card: ch, name: nameH }
              ],
              result: rF
            });
          }
        }
      }
    }

    // D. CAMPO + 2 CARTAS DE MANO (3 Materiales)
    if (game.hand.length >= 2) {
      for (var f = 0; f < (game.field || []).length; f++) {
        var cf = game.field[f];
        if (!cf || !isMonsterCard(cf)) continue;
        var nameF = cardName(cf);
        for (var h1 = 0; h1 < game.hand.length; h1++) {
          var ch1 = game.hand[h1];
          if (!isMonsterCard(ch1)) continue;
          var nh1 = cardName(ch1);
          for (var h2 = h1 + 1; h2 < game.hand.length; h2++) {
            var ch2 = game.hand[h2];
            if (!isMonsterCard(ch2)) continue;
            var nh2 = cardName(ch2);
            var rf3 = resolveFieldChainedFusion(nameF, [nh1, nh2]);
            if (rf3) {
              var keyF3 = 'f' + f + '+h' + h1 + '+h' + h2 + '->' + rf3.result;
              if (!seen[keyF3]) {
                seen[keyF3] = true;
                out.push({
                  type: 'field-hand-chain-3',
                  materials: [
                    { zone: 'f', index: f, card: cf, name: nameF },
                    { zone: 'h', index: h1, card: ch1, name: nh1 },
                    { zone: 'h', index: h2, card: ch2, name: nh2 }
                  ],
                  result: rf3.result,
                  chain: rf3.chain
                });
              }
            }
          }
        }
      }
    }

    // E. CAMPO + CAMPO
    for (var f1 = 0; f1 < (game.field || []).length; f1++) {
      var cF1 = game.field[f1];
      if (!cF1 || !isMonsterCard(cF1)) continue;
      var nF1 = cardName(cF1);
      if (!nF1) continue;
      for (var f2 = f1 + 1; f2 < (game.field || []).length; f2++) {
        var cF2 = game.field[f2];
        if (!cF2 || !isMonsterCard(cF2)) continue;
        var nF2 = cardName(cF2);
        if (!nF2) continue;
        var rFF = callPairFusion(nF1, nF2);
        if (rFF) {
          var keyFF = 'f' + f1 + '+f' + f2 + '->' + rFF;
          if (!seen[keyFF]) {
            seen[keyFF] = true;
            out.push({
              type: 'field-field',
              a: { zone: 'f', index: f1, card: cF1, name: nF1 },
              b: { zone: 'f', index: f2, card: cF2, name: nF2 },
              materials: [
                { zone: 'f', index: f1, card: cF1, name: nF1 },
                { zone: 'f', index: f2, card: cF2, name: nF2 }
              ],
              result: rFF
            });
          }
        }
      }
    }

    return out;
  }
  window.getAvailableFusionOptions = getAvailableFusionOptions;

  window.fusionOptions = function() {
    var opts = getAvailableFusionOptions();
    var out = [];
    opts.forEach(function(o) {
      if (o.type === 'hand-hand') {
        out.push({ ids: [o.a.index, o.b.index], result: o.result });
      } else if (o.type === 'field-hand') {
        out.push({ ids: [o.b.index], result: o.result, fieldIndex: o.a.index });
      }
    });
    return out;
  };
  try { fusionOptions = window.fusionOptions; } catch(_) {}

  window.updateFusionAssist = function() {
    var btn = document.getElementById('fusionBtn');
    if (!btn) return;
    var opts = getAvailableFusionOptions();
    var ready = game && game.turn === 'player' && !game.handSummoned && opts.length > 0;
    btn.disabled = !ready;
    btn.classList.toggle('disabled', !ready);
    btn.classList.toggle('fusionReady', ready);
    if (ready && opts.length > 0) {
      btn.innerHTML = 'Fusión <span class="fusionCount104">' + opts.length + '</span>';
      btn.title = opts.length + ' Fusión' + (opts.length === 1 ? '' : 'es') + ' disponible' + (opts.length === 1 ? '' : 's') + '. Pulsa para ver la lista y fusionar automáticamente.';
    } else {
      btn.innerHTML = 'Fusión';
      btn.title = (game && game.handSummoned) ? 'Ya realizaste tu invocación/fusión de este turno.' : 'No hay una Fusión disponible';
    }
  };
  try { updateFusionAssist = window.updateFusionAssist; } catch(_) {}

  function closeCustomFusionModal() {
    var m = document.getElementById('customFusionModal');
    if (m) m.remove();
  }
  window.closeCustomFusionModal = closeCustomFusionModal;

  function executeFusion(opt) {
    if (!game || game.turn !== 'player') return;
    if (game.handSummoned) {
      duelToast('Solo se permite 1 invocación o colocación por turno.');
      return;
    }

    var resultName = opt.result;
    var mats = opt.materials || [opt.a, opt.b].filter(Boolean);

    // Determinar casilla objetivo en campo:
    var targetSlot = -1;
    var fieldMat = mats.find(function(m) { return m && m.zone === 'f'; });
    if (fieldMat) {
      targetSlot = fieldMat.index;
    } else {
      targetSlot = game.field.findIndex(function(x) { return !x; });
      if (targetSlot < 0) {
        duelToast('No hay espacio libre en tu campo para la Fusión.');
        return;
      }
    }

    try {
      if (typeof window.onBeforeFuse === 'function') window.onBeforeFuse(resultName);
      if (typeof window.recordDiscoveredFusion === 'function') window.recordDiscoveredFusion(resultName);
    } catch(_) {}

    // Enviar materiales de campo al cementerio:
    mats.filter(function(m) { return m && m.zone === 'f'; }).forEach(function(m) {
      var fCard = game.field[m.index];
      game.field[m.index] = null;
      if (fCard) game.grave.push(Object.assign({}, fCard, { set: false, faceUp: true }));
    });

    // Enviar materiales de mano al cementerio (en orden descendente de índice para no desfasar el splice):
    var handMats = mats.filter(function(m) { return m && m.zone === 'h'; });
    var handIndices = handMats.map(function(m) { return m.index; }).sort(function(a, b) { return b - a; });
    handIndices.forEach(function(idx) {
      var card = game.hand.splice(idx, 1)[0];
      if (card) game.grave.push(Object.assign({}, card, { set: false, faceUp: true }));
    });

    // Crear el monstruo de fusión:
    var fused = window.mk(resultName) || {
      name: resultName,
      level: 6,
      type: 'Warrior',
      attr: 'LIGHT',
      atk: 2100,
      def: 1800,
      pos: 'ATK',
      materials: opt.chain || mats.map(function(m) { return m.name; }),
      faceUp: true
    };
    fused.materials = opt.chain || mats.map(function(m) { return m.name; });
    fused.pos = 'ATK';
    fused.faceUp = true;
    fused.faceDownSet103 = false;
    fused._isFused = true;
    fused.isFusion = true;
    fused.kind = 'FUSION';
    game.field[targetSlot] = fused;

    if (typeof window.recordDiscoveredFusion === 'function') {
      try { window.recordDiscoveredFusion(resultName); } catch(_) {}
    }

    game.handSummoned = true; // Consumes the turn's summon!
    game.selected = [];

    if (window.playFusionSound) window.playFusionSound();
    else if (window.playSummonSound) window.playSummonSound();

    if (typeof updateSetButton103 === 'function') try { updateSetButton103(); } catch(_) {}
    if (typeof updateFusionAssist === 'function') try { updateFusionAssist(); } catch(_) {}
    if (typeof render === 'function') render();
    if (typeof setDuelView === 'function') setDuelView('field');

    var matDesc = mats.map(function(m) {
      return '[' + (m.zone === 'f' ? 'CAMPO' : 'MANO') + '] ' + m.name;
    }).join(' + ');
    duelToast('¡FUSIÓN EXITOSA! Invocaste a ' + resultName + '.');
    if (typeof log === 'function') log('FUSIÓN → ' + resultName + ' (' + matDesc + ').');
  }
  window.executeFusion = executeFusion;

  function openFusionModal(options) {
    closeCustomFusionModal();
    if (!options || !options.length) {
      duelToast('No hay ninguna Fusión disponible en este momento.');
      return;
    }

    var selFocus = null;
    var allSel = (game && game.selected ? game.selected : []).filter(function(x) { return x && (x[0] === 'h' || x[0] === 'f'); });
    if (allSel.length === 1) {
      selFocus = { zone: allSel[0][0], index: allSel[0][1] };
    }

    var sortedOpts = options.slice();
    if (selFocus) {
      sortedOpts.sort(function(a, b) {
        var aMats = a.materials || [a.a, a.b].filter(Boolean);
        var bMats = b.materials || [b.a, b.b].filter(Boolean);
        var aMatch = aMats.some(function(m) { return m.zone === selFocus.zone && m.index === selFocus.index; });
        var bMatch = bMats.some(function(m) { return m.zone === selFocus.zone && m.index === selFocus.index; });
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    var overlay = document.createElement('div');
    overlay.id = 'customFusionModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.88);display:flex;justify-content:center;align-items:center;padding:16px;font-family:VT323, monospace;box-sizing:border-box;';

    var win = document.createElement('div');
    win.className = 'customFusionWin';
    win.style.cssText = 'width:min(740px,96vw);max-height:88vh;overflow-y:auto;background:linear-gradient(180deg,#24160c 0%,#120b06 100%);border:3px solid #d4af37;border-radius:16px;padding:20px;color:#fff;box-shadow:0 0 35px rgba(212,175,55,0.35),0 15px 45px rgba(0,0,0,0.9);display:flex;flex-direction:column;';

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #5a3e1b;padding-bottom:12px;margin-bottom:12px;';
    head.innerHTML = '<div style="font-size:26px;font-weight:900;color:#ffd700;display:flex;align-items:center;gap:10px;">⚡ FUSIONES DISPONIBLES <span style="background:#6d238e;border:1px solid #efc6ff;border-radius:12px;padding:2px 10px;font-size:16px;color:#fff;">' + sortedOpts.length + '</span></div><button type="button" id="customFusionCloseBtn" style="background:#3a1e12;border:2px solid #a67c00;color:#ffd700;font-size:20px;width:38px;height:38px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold;">✕</button>';
    win.appendChild(head);

    var help = document.createElement('div');
    help.style.cssText = 'font-size:16px;color:#e0d0b0;margin-bottom:14px;line-height:1.3;';
    help.innerHTML = 'Selecciona la combinación que deseas realizar. Se fusionará de forma <b>automática</b> usando las cartas de tu <b>MANO</b> o <b>CAMPO</b>.';
    win.appendChild(help);

    var list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:60vh;padding-right:6px;';

    sortedOpts.forEach(function(o) {
      var item = document.createElement('div');
      item.style.cssText = 'background:linear-gradient(135deg,#2b1f33 0%,#17111c 100%);border:2px solid #7a4299;border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 4px 10px rgba(0,0,0,0.5);cursor:pointer;transition:all 0.2s;';

      var mats = o.materials || [o.a, o.b].filter(Boolean);
      var matsHtml = mats.map(function(m, idx) {
        var loc = m.zone === 'f' ? 'CAMPO' : 'MANO';
        var tagStyle = m.zone === 'f' ? 'background:#00364d;border:1px solid #00c3ff;color:#8ce8ff;' : 'background:#4a3000;border:1px solid #d4af37;color:#ffd700;';
        return '<div style="display:flex;align-items:center;gap:6px;font-size:14px;color:#fff;">' +
          '<span style="padding:1px 5px;border-radius:4px;font-size:10px;font-weight:900;' + tagStyle + '">' + loc + '</span> ' +
          '<span>' + m.name + '</span>' +
        '</div>';
      }).join('<div style="color:#efc6ff;font-size:11px;margin-left:12px;">+</div>');

      var multiBadge = (mats.length > 2) ? '<span style="background:#b8860b;color:#fff;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:bold;margin-left:6px;">' + mats.length + ' MATS</span>' : '';

      var mMeta = (window.mk ? window.mk(o.result) : null) || {};
      var atk = mMeta.atk != null ? mMeta.atk : '?';
      var def = mMeta.def != null ? mMeta.def : '?';
      var thumb = getFusionCardThumb(o.result);

      item.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex:1.8;">' +
        '<div style="display:flex;flex-direction:column;gap:4px;flex:1;">' +
          matsHtml +
        '</div>' +
        '<div style="font-size:22px;color:#ffd700;font-weight:bold;margin:0 4px;">➔</div>' +
        '<img src="' + thumb + '" alt="' + o.result + '" style="width:48px;height:70px;object-fit:cover;border-radius:5px;border:1px solid #ffd700;box-shadow:0 2px 6px #000;background:#000;flex-shrink:0;">' +
        '<div style="display:flex;flex-direction:column;gap:2px;">' +
          '<div style="font-size:18px;font-weight:900;color:#ffd700;line-height:1.2;display:flex;align-items:center;">' + o.result + multiBadge + '</div>' +
          '<div style="font-size:14px;color:#55dfff;">ATK ' + atk + ' / DEF ' + def + '</div>' +
          (mMeta.type ? '<div style="font-size:12px;color:#aaa;">' + mMeta.type + ' · ' + (mMeta.attr || '') + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<button type="button" class="customFusionPickBtn" style="background:linear-gradient(180deg,#8a2be2 0%,#4b0082 100%);border:2px solid #efc6ff;color:#fff;font-family:inherit;font-size:16px;font-weight:900;padding:10px 18px;border-radius:10px;cursor:pointer;letter-spacing:1px;box-shadow:0 0 10px rgba(189,108,255,0.4);flex-shrink:0;">FUSIONAR</button>';

      var pickBtn = item.querySelector('.customFusionPickBtn');
      pickBtn.onclick = function(e) {
        e.stopPropagation();
        closeCustomFusionModal();
        executeFusion(o);
      };
      item.onclick = function() {
        closeCustomFusionModal();
        executeFusion(o);
      };

      list.appendChild(item);
    });

    win.appendChild(list);
    overlay.appendChild(win);
    document.body.appendChild(overlay);

    document.getElementById('customFusionCloseBtn').onclick = closeCustomFusionModal;
    overlay.onclick = function(e) {
      if (e.target === overlay) closeCustomFusionModal();
    };
  }
  window.openFusionModal = openFusionModal;

  window.fuse = function() {
    if (!game || game.turn !== 'player') return;
    if (game.handSummoned) {
      duelToast('Solo se permite 1 invocación o colocación por turno.');
      return;
    }

    var hs = (game.selected || []).filter(function(x) { return x && x[0] === 'h'; }).map(function(x) { return Number(x[1]); }).filter(Number.isInteger);
    var fs = (game.selected || []).filter(function(x) { return x && x[0] === 'f'; }).map(function(x) { return Number(x[1]); }).filter(Number.isInteger);

    // 1. Fusión directa de MANO (2 o más materiales seleccionados, ej: 2, 3, 4, 5 cartas)
    if (hs.length >= 2 && fs.length === 0) {
      var handCards = hs.map(function(i) { return game.hand[i]; });
      if (handCards.every(isMonsterCard)) {
        var handNames = handCards.map(cardName);
        var chainRes = resolveChainedFusion(handNames);
        if (chainRes) {
          executeFusion({
            type: 'hand-chain',
            materials: hs.map(function(idx, i) { return { zone: 'h', index: idx, card: handCards[i], name: handNames[i] }; }),
            result: chainRes.result,
            chain: chainRes.chain
          });
          return;
        }
      }
    } else if (fs.length === 1 && hs.length >= 1) {
      // 2. Fusión directa CAMPO (1 monstruo) + MANO (1 o más monstruos seleccionados)
      var fCard = game.field[fs[0]];
      var handCardsF = hs.map(function(i) { return game.hand[i]; });
      if (isMonsterCard(fCard) && handCardsF.every(isMonsterCard)) {
        var fName = cardName(fCard);
        var handNamesF = handCardsF.map(cardName);
        var chainResF = resolveFieldChainedFusion(fName, handNamesF);
        if (chainResF) {
          var allMats = [{ zone: 'f', index: fs[0], card: fCard, name: fName }].concat(
            hs.map(function(idx, i) { return { zone: 'h', index: idx, card: handCardsF[i], name: handNamesF[i] }; })
          );
          executeFusion({
            type: 'field-hand-chain',
            materials: allMats,
            result: chainResF.result,
            chain: chainResF.chain
          });
          return;
        }
      }
    } else if (fs.length === 2 && hs.length === 0) {
      // 3. Fusión directa CAMPO + CAMPO
      var cF1 = game.field[fs[0]], cF2 = game.field[fs[1]];
      if (isMonsterCard(cF1) && isMonsterCard(cF2)) {
        var nF1 = cardName(cF1), nF2 = cardName(cF2);
        var resFF = callPairFusion(nF1, nF2);
        if (resFF) {
          executeFusion({
            type: 'field-field',
            materials: [
              { zone: 'f', index: fs[0], card: cF1, name: nF1 },
              { zone: 'f', index: fs[1], card: cF2, name: nF2 }
            ],
            result: resFF
          });
          return;
        }
      }
    }

    // 4. Si no hay combinación directa válida preseleccionada, abrir el modal de selección de Fusiones disponibles:
    var opts = getAvailableFusionOptions();
    if (!opts.length) {
      duelToast('No hay ninguna Fusión disponible en este momento.');
      return;
    }

    openFusionModal(opts);
  };
  try { fuse = window.fuse; } catch(_) {}

  // 4. Renace al Monstruo Modal Resolver
  function resolveMonsterReborn(fromBackIndex, fromHandIndex) {
    var pGrave = (game.grave || []).map(function(c, idx) { return { card: c, pile: 'grave', idx: idx }; });
    var eGrave = (game.enemyGrave || []).map(function(c, idx) { return { card: c, pile: 'enemyGrave', idx: idx }; });
    var allGrave = pGrave.concat(eGrave).filter(function(x) {
      var c = x.card;
      return c && (c.atk !== undefined || c.kind === 'MONSTER' || (c.type && c.type !== 'SPELL' && c.type !== 'TRAP' && c.type !== 'EQUIP'));
    });

    if (!allGrave.length) {
      duelToast('Renace al Monstruo: No hay monstruos en ning\u00fan Cementerio.');
      return;
    }

    var slot = game.field.findIndex(function(x) { return !x; });
    if (slot < 0) {
      duelToast('No hay espacio libre en tu campo para invocar desde el Cementerio.');
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'rebornChoiceOverlay';
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;";
    var box = document.createElement('div');
    box.style.cssText = "width:460px;max-height:85vh;overflow-y:auto;padding:25px;background:rgba(20,10,0,0.96);border:3px solid #ffd700;border-radius:8px;text-align:center;box-shadow:0 0 35px #000;";
    box.innerHTML = '<h3 style="color:#ffd700;font-size:24px;margin:0 0 10px;">RENACE AL MONSTRUO</h3><p style="color:#fff;font-size:16px;margin:0 0 15px;">Selecciona el monstruo que deseas revivir:</p><div id="rebornTargets" style="display:flex;flex-direction:column;gap:10px;"></div><button id="rebornCancel" style="margin-top:15px;padding:8px 24px;background:#660000;color:#fff;border:2px solid #ff0000;font-family:inherit;font-size:16px;cursor:pointer;">CANCELAR</button>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('rebornCancel').onclick = function() { overlay.remove(); };

    var container = document.getElementById('rebornTargets');
    allGrave.forEach(function(item) {
      var c = item.card;
      var cName = c.name || c[0] || 'Monstruo';
      var atk = c.atk !== undefined ? c.atk : (c[4] || 0);
      var def = c.def !== undefined ? c.def : (c[5] || 0);

      var row = document.createElement('div');
      row.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#181818;border:2px solid #555;border-radius:5px;";

      var info = document.createElement('div');
      info.style.cssText = "text-align:left;color:#fff;font-size:17px;";
      info.innerHTML = '<b style="color:#ffd700;">' + cName + '</b> <span style="color:#aaa;font-size:14px;">(' + (item.pile === 'grave' ? 'Tu Cementerio' : 'Cementerio Rival') + ')</span><br><span style="color:#00ff00;">ATK: ' + atk + '</span> / <span style="color:#00ffff;">DEF: ' + def + '</span>';
      row.appendChild(info);

      var btns = document.createElement('div');
      btns.style.cssText = "display:flex;gap:8px;";

      var btnAtk = document.createElement('button');
      btnAtk.style.cssText = "padding:6px 12px;background:#006600;color:#fff;border:2px solid #00ff00;font-family:inherit;font-size:14px;cursor:pointer;font-weight:bold;";
      btnAtk.textContent = 'ATK';
      btnAtk.onclick = function() { finishReborn(item, 'ATK'); };
      btns.appendChild(btnAtk);

      var btnDef = document.createElement('button');
      btnDef.style.cssText = "padding:6px 12px;background:#004488;color:#fff;border:2px solid #0088ff;font-family:inherit;font-size:14px;cursor:pointer;font-weight:bold;";
      btnDef.textContent = 'DEF';
      btnDef.onclick = function() { finishReborn(item, 'DEF'); };
      btns.appendChild(btnDef);

      row.appendChild(btns);
      container.appendChild(row);
    });

    function finishReborn(item, pos) {
      overlay.remove();
      var sourcePile = item.pile === 'grave' ? game.grave : game.enemyGrave;
      var actualIdx = sourcePile.indexOf(item.card);
      var revivedCard = actualIdx >= 0 ? sourcePile.splice(actualIdx, 1)[0] : item.card;
      if (!revivedCard) return;

      var finalCard = window.mk(revivedCard) || Object.assign({}, revivedCard);
      finalCard.pos = pos;
      finalCard.faceUp = true;
      game.field[slot] = finalCard;

      // Consumir Renace al Monstruo
      if (fromBackIndex != null) {
        var used = game.playerBack[fromBackIndex];
        game.playerBack[fromBackIndex] = null;
        if (used) game.grave.push(Object.assign({}, used, { set: false, faceUp: true }));
      } else if (fromHandIndex != null) {
        var usedH = game.hand.splice(fromHandIndex, 1)[0];
        if (usedH) game.grave.push(Object.assign({}, usedH, { set: false, faceUp: true }));
      }

      game.selected = [];
      if (window.playSummonSound) window.playSummonSound();
      if (typeof render === 'function') render();
      duelToast('\u00a1Renace al Monstruo invoc\u00f3 a ' + (finalCard.name || 'monstruo') + ' en ' + pos + '!');
      if (typeof log === 'function') log('Renace al Monstruo invoco ' + (finalCard.name || 'monstruo') + ' en ' + pos + '.');
    }
  }

  // 4b. EQUIP SYSTEM: Direct Prompt Modal (Campo y Mano)
  function isEquipSpell(c) {
    if (!c) return false;
    var name = (c.name || c[0] || '').trim();
    var val = (c.value || '').toUpperCase();
    var kind = (c.kind || c.type || '').toUpperCase();

    // Las cartas de Trampa y Monstruos NUNCA son equipos
    if (kind === 'TRAP' || val === 'TRAP' || val.includes('TRAP') || name === 'Dust Tornado' || val === 'DUST_TORNADO') return false;
    if (kind === 'MONSTER') return false;

    if (kind === 'EQUIP' || val === 'EQUIP') return true;
    var equipNames = [
      'Axe of Despair', 'Black Pendant', 'Horn of the Unicorn', 'Dragon Treasure',
      'Garra del Dragón', 'United We Stand', 'Fusion Weapon', 'Malevolent Nuzzler',
      'Sword of Dark Destruction', 'Dark Energy', 'Invigoration', 'Electro-Whip', 'Electro-whip',
      'Cyber Shield', 'Mystical Moon', 'Silver Bow and Arrow', 'Book of Secret Arts',
      'Elf\'s Light', 'Beast Fangs', 'Steel Shell', 'Vile Germs', 'Shine Palace',
      'Salamandra', 'Kunai with Chain', 'Megamorph', 'Sword of Kusanagi', 'Cestus of Dagla',
      'Magic Formula', 'Cyclon Laser', 'Mirror of Yata', 'Orb of Yasaka', 'Shattered Axe',
      'Mage Power', 'Poder del Mago', 'Legendary Sword', 'Laser Cannon Armor',
      'Insect Armor with Laser Cannon', 'Horn of Light', 'Elegant Egotist',
      'Machine Conversion Factory', 'Raise Body Heat', 'Follow Wind', 'Power of Kaishin', 'Violet Crystal',
      'Lightning Blade'
    ];
    if (equipNames.includes(name)) return true;
    if (['AXE_DESPAIR', 'BLACK_PENDANT', 'HORN_UNICORN', 'DRAGON_TREASURE', 'EQUIP_DRAGON', 'UNITED_WE_STAND', 'FUSION_WEAPON', 'MAGE_POWER'].includes(val)) return true;
    var desc = (c.text || c.desc || '').toLowerCase();
    if ((desc.includes('equipa a') || desc.includes('monstruo equipado') || desc.includes('equipped with this card') || desc.includes('equip to')) && kind !== 'TRAP') return true;
    return false;
  }
  window.isEquipSpell = isEquipSpell;

  function getEquipStats(eqCard, target) {
    var name = (eqCard && (eqCard.name || eqCard[0]) || '').trim();
    var val = (eqCard && eqCard.value) || '';
    var atk = 500;
    var def = 0;
    if (name === 'Axe of Despair' || val === 'AXE_DESPAIR') {
      atk = 1000; def = 0;
    } else if (name === 'Insect Armor with Laser Cannon' || val === 'EQUIP_INSECT_HEAVY') {
      atk = 700; def = 700;
    } else if (name === 'Horn of the Unicorn' || val === 'HORN_UNICORN') {
      atk = 700; def = 700;
    } else if (name === 'Malevolent Nuzzler' || val === 'MALEVOLENT_NUZZLER') {
      atk = 700; def = 700;
    } else if (name === 'Horn of Light' || val === 'EQUIP_HORN_LIGHT') {
      atk = 0; def = 800;
    } else if (name === 'Black Pendant' || val === 'BLACK_PENDANT') {
      atk = 500; def = 0;
    } else if (name === 'Dragon Treasure' || val === 'DRAGON_TREASURE' || name === 'Garra del Dragón' || val === 'EQUIP_DRAGON') {
      atk = 500; def = 500;
    } else if (name === 'United We Stand' || val === 'UNITED_WE_STAND') {
      atk = 800; def = 800;
    } else if (name === 'Fusion Weapon' || val === 'FUSION_WEAPON') {
      atk = 1500; def = 500;
    } else if (name === 'Mage Power' || val === 'MAGE_POWER' || name === 'Poder del Mago') {
      var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
      var stCount = 1;
      if (g && Array.isArray(g.playerBack)) {
        stCount = g.playerBack.filter(Boolean).length;
        if (stCount < 1) stCount = 1;
      }
      atk = stCount * 500;
      def = stCount * 500;
    } else if (name === 'Megamorph' || val === 'MEGAMORPH' || name === 'Megamorfo') {
      var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
      var plp = (g && g.plp != null) ? g.plp : 8000;
      var elp = (g && g.elp != null) ? g.elp : 8000;
      var baseAtk = (target && target.atk != null) ? Number(target.atk) : 1000;
      if (plp < elp) {
        atk = baseAtk;
        def = 0;
      } else if (plp > elp) {
        atk = -Math.floor(baseAtk / 2);
        def = 0;
      } else {
        atk = 0;
        def = 0;
      }
    }
    return { atk: atk, def: def };
  }

  function canEquip(eqCard, target) {
    if (!eqCard || !target) return false;
    if (typeof isST === 'function' && isST(target)) return false;
    if (target.kind === 'SPELL' || target.kind === 'TRAP' || target.kind === 'EQUIP') return false;

    var eqName = (eqCard.name || eqCard[0] || '').trim();
    var eqVal = eqCard.value || '';
    var monType = (target.type || target[2] || '').toLowerCase();
    var monAttr = (target.attr || target[3] || '').toUpperCase();
    var monKind = target.kind || (target.materials && target.materials.length ? 'FUSION' : '');
    var monLevel = Number(target.level ?? target[1] ?? 0);

    if (eqVal === 'DRAGON_TREASURE' || eqName === 'Dragon Treasure' || eqVal === 'EQUIP_DRAGON' || eqName === 'Garra del Dragón') {
      return monType.includes('dragon') || monType.includes('dragón');
    }
    if (eqVal === 'EQUIP_WARRIOR' || eqName === 'Legendary Sword') {
      return monType.includes('warrior') || monType.includes('guerrero');
    }
    if (eqVal === 'EQUIP_DARK' || eqName === 'Sword of Dark Destruction') {
      return monAttr === 'DARK' || monType.includes('fiend') || monType.includes('demonio') || monType.includes('spellcaster') || monType.includes('mago');
    }
    if (eqVal === 'EQUIP_FIEND' || eqName === 'Dark Energy') {
      return monType.includes('fiend') || monType.includes('demonio');
    }
    if (eqVal === 'EQUIP_INSECT' || eqName === 'Laser Cannon Armor' || eqVal === 'EQUIP_INSECT_HEAVY' || eqName === 'Insect Armor with Laser Cannon') {
      return monType.includes('insect') || monType.includes('insecto');
    }
    if (eqVal === 'EQUIP_LIGHT' || eqName === "Elf's Light") {
      return monAttr === 'LIGHT' || monType.includes('fairy') || monType.includes('hada') || monType.includes('spellcaster') || monType.includes('mago');
    }
    if (eqVal === 'EQUIP_BEAST' || eqName === 'Beast Fangs') {
      return monType.includes('beast') || monType.includes('bestia');
    }
    if (eqVal === 'EQUIP_WATER' || eqName === 'Steel Shell' || eqVal === 'EQUIP_KAISHIN' || eqName === 'Power of Kaishin') {
      return monAttr === 'WATER' || monType.includes('aqua') || monType.includes('pez') || monType.includes('fish') || monType.includes('sea serpent');
    }
    if (eqVal === 'EQUIP_PLANT' || eqName === 'Vile Germs') {
      return monType.includes('plant') || monType.includes('planta');
    }
    if (eqVal === 'EQUIP_FAIRY' || eqName === 'Silver Bow and Arrow') {
      return monType.includes('fairy') || monType.includes('hada');
    }
    if (eqVal === 'EQUIP_THUNDER' || eqName === 'Electro-whip') {
      return monType.includes('thunder') || monType.includes('trueno');
    }
    if (eqVal === 'CYBER_SHIELD' || eqName === 'Cyber Shield' || eqVal === 'ELEGANT_EGOTIST' || eqName === 'Elegant Egotist') {
      var tName = (target.name || target[0] || '').toLowerCase();
      return tName.includes('harpie') || monType.includes('winged beast') || monType.includes('bestia alada') || monType.includes('warrior') || monType.includes('guerrero');
    }
    if (eqVal === 'EQUIP_MOON' || eqName === 'Mystical Moon') {
      return monType.includes('beast-warrior') || monType.includes('guerrero-bestia') || monType.includes('winged beast') || monType.includes('bestia alada');
    }
    if (eqVal === 'EQUIP_ZOMBIE' || eqName === 'Violet Crystal') {
      return monType.includes('zombie') || monType.includes('zombi');
    }
    if (eqVal === 'EQUIP_SPELLCASTER' || eqName === 'Book of Secret Arts') {
      return monType.includes('spellcaster') || monType.includes('mago') || monType.includes('conjur');
    }
    if (eqVal === 'EQUIP_EARTH' || eqName === 'Invigoration') {
      return monAttr === 'EARTH' || monType.includes('rock') || monType.includes('roca') || monType.includes('warrior') || monType.includes('guerrero');
    }
    if (eqVal === 'EQUIP_MACHINE' || eqName === 'Machine Conversion Factory') {
      return monType.includes('machine') || monType.includes('máquina') || monType.includes('maquina');
    }
    if (eqVal === 'EQUIP_DINO' || eqName === 'Raise Body Heat') {
      return monType.includes('dinosaur') || monType.includes('dinosaurio') || monType.includes('reptil') || monType.includes('reptile');
    }
    if (eqVal === 'EQUIP_WINGED_BEAST' || eqName === 'Follow Wind') {
      return monType.includes('winged beast') || monType.includes('bestia alada');
    }
    if (eqVal === 'FUSION_WEAPON' || eqName === 'Fusion Weapon') {
      return isFusionMonster(target) && (getMonsterLevel(target) <= 6) && (getMonsterLevel(target) > 0);
    }
    if (eqVal === 'MEGAMORPH' || eqName === 'Megamorph' || eqName === 'Megamorfo') {
      return true;
    }
    return true;
  }

  window.promptEquipTarget = function(eqCard, source) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g || g.turn !== 'player') return;
    if (!eqCard) return;

    var fieldTargets = [];
    (g.field || []).forEach(function(c, idx) {
      if (c && !c.faceDown && !c.faceDownSet103 && canEquip(eqCard, c)) {
        fieldTargets.push({ card: c, zone: 'f', index: idx, locLabel: 'CAMPO (Zona ' + (idx + 1) + ')' });
      }
    });
    (g.linkZones || []).forEach(function(c, idx) {
      if (c && !c.faceDown && !c.faceDownSet103 && canEquip(eqCard, c)) {
        fieldTargets.push({ card: c, zone: 'l', index: idx, locLabel: 'EXTRA LINK (Zona ' + (idx + 1) + ')' });
      }
    });

    var handTargets = [];
    (g.hand || []).forEach(function(c, idx) {
      if (!c) return;
      if (source && source.type === 'hand' && source.index === idx) return;
      if (typeof isST === 'function' && isST(c)) return;
      if (c.kind === 'SPELL' || c.kind === 'TRAP' || c.kind === 'EQUIP') return;
      if (canEquip(eqCard, c)) {
        handTargets.push({ card: c, zone: 'h', index: idx, locLabel: 'EN TU MANO (Carta ' + (idx + 1) + ')' });
      }
    });

    var allTargets = fieldTargets.concat(handTargets);
    var eqName = eqCard.name || eqCard[0] || 'Este Equipo';
    var eqVal = eqCard.value || '';

    if (!allTargets.length) {
      if (eqVal === 'DRAGON_TREASURE' || eqName === 'Dragon Treasure' || eqVal === 'EQUIP_DRAGON' || eqName === 'Garra del Dragón') {
        duelToast('Dragon Treasure requiere al menos un monstruo Tipo Dragón (en campo o en mano).');
      } else if (eqVal === 'FUSION_WEAPON' || eqName === 'Fusion Weapon') {
        duelToast('Fusion Weapon requiere un monstruo de Fusión Nivel 6 o menor (en campo o en mano).');
      } else {
        duelToast('No tienes ningún monstruo disponible en el campo ni en tu mano para equipar.');
      }
      return;
    }

    var oldModal = document.getElementById('equipChoiceOverlay');
    if (oldModal) oldModal.remove();

    var overlay = document.createElement('div');
    overlay.id = 'equipChoiceOverlay';
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;";

    var box = document.createElement('div');
    box.style.cssText = "width:480px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;background:linear-gradient(145deg, #231b12, #100b07);border:3px solid #ffd700;border-radius:10px;padding:20px;box-shadow:0 0 35px #000;box-sizing:border-box;";

    var sampleCard = (allTargets.length > 0 && allTargets[0]) ? allTargets[0].card : null;
    var eqStats = getEquipStats(eqCard, sampleCard);
    var isMega = (eqName === 'Megamorph' || eqVal === 'MEGAMORPH' || eqName === 'Megamorfo');
    var boostStr = isMega
      ? 'Duplica ATK (si LP < rival) / Mitad ATK (si LP > rival)'
      : ((eqStats.atk >= 0 ? '+' : '') + eqStats.atk + ' ATK' + (eqStats.def ? ' / +' + eqStats.def + ' DEF' : ''));

    var headerHTML = '<h3 style="color:#ffd700;font-size:24px;margin:0 0 6px;text-align:center;letter-spacing:1px;text-shadow:0 0 8px #ffb300;">' +
      'EQUIPAR: ' + eqName + '</h3>' +
      '<p style="color:#fff;font-size:16px;margin:0 0 15px;text-align:center;line-height:1.3;">' +
      'Otorga <b style="color:#00ff88;">' + boostStr + '</b>. Elige el monstruo objetivo:</p>';

    var scrollList = document.createElement('div');
    scrollList.style.cssText = "display:flex;flex-direction:column;gap:10px;overflow-y:auto;padding-right:6px;max-height:50vh;";

    allTargets.forEach(function(t) {
      var c = t.card;
      var name = c.name || c[0] || 'Monstruo';
      var tStats = getEquipStats(eqCard, c);
      var curAtk = (t.zone === 'h') ? (Number(c.atk ?? c[4] ?? 0) + Number(c.tempBoost || 0) + Number(c.equip || 0)) : (typeof window.effectiveAtk === 'function' ? window.effectiveAtk(c) : c.atk);
      var curDef = (c.kind === 'LINK') ? 'LINK' : (Number(c.def ?? c[5] ?? 0) + Number(c.tempDefense || 0) + Number(c.tempBoostDef || 0));
      var newAtk = curAtk + tStats.atk;
      var newDef = (c.kind === 'LINK') ? 'LINK' : (curDef + tStats.def);

      var num = (window.CARD_MAPPINGS && window.CARD_MAPPINGS[name]) || 0;
      var imgSrc = (num && window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[num]) || '';
      if (!imgSrc && window.CUSTOM_LOCAL_IMAGES) {
        var dict = typeof window.getGlobalCardDict === 'function' ? window.getGlobalCardDict() : (window.CARD_MAPPINGS || {});
        var dNum = dict[name] && dict[name].num ? dict[name].num : dict[name];
        if (dNum && window.CUSTOM_LOCAL_IMAGES[dNum]) imgSrc = window.CUSTOM_LOCAL_IMAGES[dNum];
      }
      var imgTag = imgSrc ? '<img src="' + imgSrc + '" style="width:42px;height:52px;object-fit:cover;border-radius:4px;border:1px solid #ffd700;" />' :
        '<div style="width:42px;height:52px;background:#333;border-radius:4px;border:1px solid #666;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa;">?</div>';

      var locBadgeColor = (t.zone === 'h') ? '#4fc3f7' : '#81c784';
      var locBadgeText = (t.zone === 'h') ? '✋ ' + t.locLabel : '⚔️ ' + t.locLabel;

      var row = document.createElement('div');
      row.style.cssText = "display:flex;align-items:center;gap:12px;padding:10px;background:#18130d;border:2px solid #5d4624;border-radius:6px;transition:0.15s;cursor:pointer;";
      row.onmouseover = function() { row.style.borderColor = '#ffd700'; row.style.background = '#251c12'; };
      row.onmouseout = function() { row.style.borderColor = '#5d4624'; row.style.background = '#18130d'; };

      row.innerHTML = imgTag +
        '<div style="flex:1;text-align:left;">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' +
            '<b style="color:#ffd700;font-size:18px;">' + name + '</b>' +
            '<span style="font-size:12px;color:' + locBadgeColor + ';background:rgba(0,0,0,0.6);padding:1px 6px;border-radius:3px;border:1px solid ' + locBadgeColor + ';">' + locBadgeText + '</span>' +
          '</div>' +
          '<div style="font-size:15px;color:#ddd;">' +
            'ATK: <span style="color:#fff;">' + curAtk + '</span> ➔ <b style="color:#00ff88;">' + newAtk + '</b>' +
            (c.kind === 'LINK' ? '' : ' | DEF: <span style="color:#fff;">' + curDef + '</span> ➔ <b style="color:#00e5ff;">' + newDef + '</b>') +
          '</div>' +
        '</div>' +
        '<button style="padding:8px 16px;background:#1b5e20;color:#fff;border:2px solid #4caf50;border-radius:5px;font-family:inherit;font-size:16px;font-weight:bold;cursor:pointer;flex-shrink:0;">EQUIPAR</button>';

      row.onclick = function() {
        overlay.remove();
        executeEquip(eqCard, source, t, tStats);
      };

      scrollList.appendChild(row);
    });

    var cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = "margin-top:15px;padding:8px 24px;background:#660000;color:#fff;border:2px solid #ff0000;border-radius:5px;font-family:inherit;font-size:16px;cursor:pointer;align-self:center;";
    cancelBtn.textContent = 'CANCELAR';
    cancelBtn.onclick = function() { overlay.remove(); };

    box.innerHTML = headerHTML;
    box.appendChild(scrollList);
    box.appendChild(cancelBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  };
  try { promptEquipTarget = window.promptEquipTarget; } catch(_) {}

  function executeEquip(eqCard, source, target, eqStats) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return;
    var tCard = target.card;
    var atk = eqStats.atk;
    var def = eqStats.def;

    tCard.equip = (tCard.equip || 0) + atk;
    if (def > 0) {
      tCard.tempBoostDef = (tCard.tempBoostDef || 0) + def;
    }
    if (!tCard.equippedCards) tCard.equippedCards = [];
    tCard.equippedCards.push(eqCard.name);

    if (target.zone === 'h') {
      tCard._handEquipAtk = (tCard._handEquipAtk || 0) + atk;
      tCard._handEquipDef = (tCard._handEquipDef || 0) + def;
      // Equipping monster in Hand
      if (source && source.type === 'hand') {
        var spliced = g.hand.splice(source.index, 1)[0] || eqCard;
        g.grave.push(Object.assign({}, spliced, { set: false, faceUp: true }));
      } else if (source && source.type === 'back') {
        var backCard = g.playerBack[source.index] || eqCard;
        g.playerBack[source.index] = null;
        g.grave.push(Object.assign({}, backCard, { set: false, faceUp: true }));
      }
    } else {
      // Equipping monster on Field
      var token = tCard._equipToken109 || ('EQM109-' + Date.now() + '-' + Math.random());
      tCard._equipToken109 = token;

      if (source && source.type === 'hand') {
        var splicedCard = g.hand.splice(source.index, 1)[0] || eqCard;
        var freeBackIdx = (g.playerBack || []).findIndex(function(x) { return !x; });
        if (freeBackIdx >= 0) {
          g.playerBack[freeBackIdx] = Object.assign({}, splicedCard, {
            kind: 'EQUIP',
            type: 'EQUIP',
            set: false,
            faceUp: true,
            equipToken109: token,
            _targetMonster: tCard,
            _appliedAtk109: atk,
            _appliedDef109: def
          });
        } else {
          tCard._handEquipAtk = (tCard._handEquipAtk || 0) + atk;
          tCard._handEquipDef = (tCard._handEquipDef || 0) + def;
          g.grave.push(Object.assign({}, splicedCard, { set: false, faceUp: true }));
        }
      } else if (source && source.type === 'back') {
        if (g.playerBack[source.index]) {
          g.playerBack[source.index].kind = 'EQUIP';
          g.playerBack[source.index].type = 'EQUIP';
          g.playerBack[source.index].set = false;
          g.playerBack[source.index].faceUp = true;
          g.playerBack[source.index].equipToken109 = token;
          g.playerBack[source.index]._targetMonster = tCard;
          g.playerBack[source.index]._appliedAtk109 = atk;
          g.playerBack[source.index]._appliedDef109 = def;
        }
      }
    }

    g.selected = [];
    if (typeof render === 'function') render();
    if (typeof restoreHandEquips === 'function') restoreHandEquips();
    var tName = tCard.name || tCard[0] || 'monstruo';
    var locText = target.zone === 'h' ? 'en tu mano' : 'en el campo';
    duelToast('¡' + (eqCard.name) + ' equipado a ' + tName + ' (' + locText + ')!');
    if (typeof log === 'function') log('Equipaste ' + eqCard.name + ' a ' + tName + ' (' + locText + '). +' + atk + ' ATK' + (def ? ' / +' + def + ' DEF' : '') + '.');
  }

  // Override equipSpell and activateEquipPlayer109
  window.equipSpell = function(i) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    var c = g && g.hand ? g.hand[i] : null;
    if (c) window.promptEquipTarget(c, { type: 'hand', index: i });
  };
  try { equipSpell = window.equipSpell; } catch(_) {}

  window.activateEquipPlayer109 = function(c) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    var handIdx = g && g.hand ? g.hand.indexOf(c) : -1;
    if (handIdx >= 0) {
      window.promptEquipTarget(c, { type: 'hand', index: handIdx });
      return;
    }
    var backIdx = g && g.playerBack ? g.playerBack.indexOf(c) : -1;
    if (backIdx >= 0) {
      window.promptEquipTarget(c, { type: 'back', index: backIdx });
      return;
    }
    window.promptEquipTarget(c, null);
  };
  try { activateEquipPlayer109 = window.activateEquipPlayer109; } catch(_) {}

  // Helper for Swords of Concealing Light
  function isConcealingSwords(c) {
    if (!c) return false;
    var v = c.value || '';
    var n = c.name || '';
    return v === 'SWORDS_OF_CONCEALING_LIGHT' || v === 'CONCEALING_SWORDS' || n === 'Swords of Concealing Light' || n === 'Espadas de Luz Ocultadora';
  }
  window.isConcealingSwords = isConcealingSwords;

  function getActiveConcealingSwords(side) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return null;
    var back = side === 'player' ? g.playerBack : g.enemyBack;
    if (!back) return null;
    for (var i = 0; i < back.length; i++) {
      var c = back[i];
      if (c && !c.set && isConcealingSwords(c) && Number(c.turnsLeft || 0) > 0) {
        return { card: c, index: i, side: side };
      }
    }
    return null;
  }
  window.getActiveConcealingSwords = getActiveConcealingSwords;

  function applyConcealingLightEffect(activatorSide, card) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return;
    var targetList = activatorSide === 'player' ? (g.enemy || []) : (g.field || []);
    var count = 0;
    for (var k = 0; k < targetList.length; k++) {
      var m = targetList[k];
      if (m) {
        if (typeof isEgyptianGod === 'function' && isEgyptianGod(m.name || m[0])) {
          if (typeof duelToast === 'function') duelToast('¡' + (m.name || 'Dios Egipcio') + ' es inmune a las Espadas de Luz Ocultadora!');
          continue;
        }
        m.pos = 'DEF';
        m.faceDown = true;
        m.faceUp = false;
        m.faceDownSet103 = true;
        m._concealed = true;
        count++;
      }
    }
    if (activatorSide === 'player' && g.enemyLinkField) {
      if (typeof isEgyptianGod !== 'function' || !isEgyptianGod(g.enemyLinkField.name || g.enemyLinkField[0])) {
        g.enemyLinkField.pos = 'DEF';
        g.enemyLinkField.faceDown = true;
        g.enemyLinkField.faceUp = false;
        g.enemyLinkField.faceDownSet103 = true;
        count++;
      }
    }
    if (window.playSetSound) window.playSetSound();
    if (typeof render === 'function') render();
    var actName = activatorSide === 'player' ? '¡Swords of Concealing Light!' : '¡El rival activa Swords of Concealing Light!';
    var msg = actName + ' ' + count + ' monstruo(s) cambiados a DEFENSA boca abajo. ¡No podrán cambiar de posición por 2 turnos!';
    if (typeof duelToast === 'function') duelToast(msg);
    if (typeof log === 'function') log(msg);
  }
  window.applyConcealingLightEffect = applyConcealingLightEffect;

  function checkConcealingTurnExpire(ownerSide) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return;
    var back = ownerSide === 'player' ? g.playerBack : g.enemyBack;
    var grave = ownerSide === 'player' ? g.grave : g.enemyGrave;
    if (!back) return;
    for (var i = 0; i < back.length; i++) {
      var c = back[i];
      if (c && !c.set && isConcealingSwords(c)) {
        var currentTurn = Number(g.turnNo || 1);
        var lastTicked = Number(c.lastTickedTurn || c.activatedTurn || 0);
        if (currentTurn > lastTicked) {
          c.lastTickedTurn = currentTurn;
          c.turnsLeft = Number(c.turnsLeft || 2) - 1;
          if (typeof log === 'function') {
            log('Swords of Concealing Light (' + (ownerSide === 'player' ? 'Jugador' : 'Rival') + '): ' + c.turnsLeft + ' turno(s) restante(s).');
          }
          if (c.turnsLeft <= 0) {
            back[i] = null;
            c.set = false;
            c.faceUp = true;
            grave.push(c);
            if (window.playDestroySound) window.playDestroySound();
            if (typeof duelToast === 'function') {
              duelToast('¡Swords of Concealing Light se autodestruye tras cumplir su 2do turno!');
            }
            if (typeof log === 'function') {
              log('Swords of Concealing Light se autodestruye en tu 2do turno tras activarse y va al Cementerio.');
            }
            if (typeof render === 'function') render();
          }
        }
      }
    }
  }
  window.checkConcealingTurnExpire = checkConcealingTurnExpire;

  // 4b. Wrapper robusto para setST (Garantiza timing estricto de trampas para el jugador)
  var prevSetST = window.setST;
  window.setST = function(i) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g || g.turn !== 'player') return;
    var beforeBack = (g.playerBack || []).slice();
    var curTurn = Number(g.turnNo || 1);
    var res;
    if (typeof prevSetST === 'function') {
      res = prevSetST.apply(this, arguments);
    }
    try {
      for (var z = 0; z < (g.playerBack || []).length; z++) {
        var card = g.playerBack[z];
        if (card && card !== beforeBack[z] && card.set) {
          card.setSide = 'player';
          card.setTurn = curTurn;
          card.readyTurn = curTurn + 1;
          card._setThisTurn = curTurn;
        }
      }
    } catch (_) {}
    return res;
  };
  try { setST = window.setST; setBackrow = function(i) { return window.setST(i); }; } catch(_) {}


  // ================================================================
  //  SPECIAL SPELL HANDLERS: Graceful Charity, Change of Heart, Scapegoat, Limiter Removal
  // ================================================================
  function isGracefulCharity(c) {
    if (!c) return false;
    var v = c.value || '';
    var n = c.name || '';
    return v === 'GRACEFUL_CHARITY' || n === 'Graceful Charity' || n === 'Graciosa Caridad';
  }
  function isChangeOfHeart(c) {
    if (!c) return false;
    var v = c.value || '';
    var n = c.name || '';
    return v === 'CHANGE_OF_HEART' || n === 'Change of Heart' || n === 'Cambio de Corazón';
  }
  function isScapegoat(c) {
    if (!c) return false;
    var v = c.value || '';
    var n = c.name || '';
    return v === 'SCAPEGOAT' || n === 'Scapegoat' || n === 'Chivo Expiatorio';
  }
  function isLimiterRemoval(c) {
    if (!c) return false;
    var v = c.value || '';
    var n = c.name || '';
    return v === 'LIMITER_REMOVAL' || n === 'Limiter Removal' || n === 'Eliminador de Límite';
  }

  window.resolveGracefulCharity = function(fromBackIndex, fromHandIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;
    var card;
    if (fromBackIndex != null && g.playerBack) {
      card = g.playerBack[fromBackIndex];
      g.playerBack[fromBackIndex] = null;
    } else if (fromHandIndex != null && g.hand) {
      card = g.hand.splice(fromHandIndex, 1)[0];
    }
    if (card) g.grave.push(Object.assign({}, card, { set: false, faceUp: true }));

    // Robar 3 cartas (sin descartar inmediatamente por límite; el límite solo aplica en End Phase)
    for (var d = 0; d < 3; d++) {
      if (g.deck && g.deck.length) g.hand.push(g.deck.pop());
    }
    if (window.playDrawSound) window.playDrawSound();
    if (typeof render === 'function') render();

    if (!g.hand || g.hand.length <= 2) {
      while (g.hand && g.hand.length) g.grave.push(g.hand.pop());
      if (typeof render === 'function') render();
      duelToast('¡Graceful Charity activada! Robaste 3 cartas y descartaste.');
      if (typeof log === 'function') log('Graceful Charity: robas 3 cartas y descartas al cementerio.');
      return;
    }

    // Modal interactivo para seleccionar 2 cartas a descartar
    var overlay = document.createElement('div');
    overlay.id = 'gracefulDiscardOverlay';
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;";

    var box = document.createElement('div');
    box.style.cssText = "width:500px;max-width:92vw;background:linear-gradient(145deg, #1c152a, #0c0f18);border:3px solid #ffcc00;border-radius:10px;padding:20px;box-shadow:0 0 35px #000;display:flex;flex-direction:column;align-items:center;";
    box.innerHTML = '<h3 style="color:#ffcc00;font-size:24px;margin:0 0 6px;text-align:center;">GRACEFUL CHARITY</h3>' +
      '<p style="color:#fff;font-size:16px;margin:0 0 15px;text-align:center;">Elige exactamente <b style="color:#ff5555;">2 cartas</b> de tu mano para descartar:</p>' +
      '<div id="gracefulHandList" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-height:50vh;overflow-y:auto;width:100%;"></div>' +
      '<div style="margin-top:15px;display:flex;gap:15px;">' +
        '<button id="btnConfirmGraceful" style="padding:10px 24px;background:#222;color:#888;border:2px solid #555;font-family:inherit;font-size:18px;cursor:not-allowed;" disabled>CONFIRMAR DESCARTE (0/2)</button>' +
      '</div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    var selectedIndices = [];
    var list = document.getElementById('gracefulHandList');
    var btnConfirm = document.getElementById('btnConfirmGraceful');

    g.hand.forEach(function(hCard, idx) {
      var item = document.createElement('div');
      item.style.cssText = "width:100px;padding:8px;background:#222;border:2px solid #555;border-radius:6px;text-align:center;cursor:pointer;color:#fff;transition:0.15s;";
      var cName = hCard.name || hCard[0] || 'Carta';
      var num = (window.CARD_MAPPINGS && window.CARD_MAPPINGS[cName]) || 0;
      var imgSrc = (num && window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[num]) || '';
      if (!imgSrc && window.CUSTOM_LOCAL_IMAGES) {
        var dict = typeof window.getGlobalCardDict === 'function' ? window.getGlobalCardDict() : (window.CARD_MAPPINGS || {});
        var dNum = dict[cName] && dict[cName].num ? dict[cName].num : dict[cName];
        if (dNum && window.CUSTOM_LOCAL_IMAGES[dNum]) imgSrc = window.CUSTOM_LOCAL_IMAGES[dNum];
      }
      var imgH = imgSrc ? '<img src="' + imgSrc + '" style="width:70px;height:90px;object-fit:cover;border-radius:4px;border:1px solid #ffcc00;" />' : '<div style="width:70px;height:90px;background:#333;margin:auto;">?</div>';
      item.innerHTML = imgH + '<div style="font-size:12px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + cName + '</div>';

      item.onclick = function() {
        if (window.playViolinClick) window.playViolinClick();
        var pos = selectedIndices.indexOf(idx);
        if (pos >= 0) {
          selectedIndices.splice(pos, 1);
          item.style.borderColor = '#555';
          item.style.background = '#222';
        } else {
          if (selectedIndices.length >= 2) return;
          selectedIndices.push(idx);
          item.style.borderColor = '#ff3333';
          item.style.background = '#441111';
        }
        btnConfirm.textContent = 'CONFIRMAR DESCARTE (' + selectedIndices.length + '/2)';
        if (selectedIndices.length === 2) {
          btnConfirm.style.background = '#990000';
          btnConfirm.style.color = '#fff';
          btnConfirm.style.borderColor = '#ff0000';
          btnConfirm.style.cursor = 'pointer';
          btnConfirm.disabled = false;
        } else {
          btnConfirm.style.background = '#222';
          btnConfirm.style.color = '#888';
          btnConfirm.style.borderColor = '#555';
          btnConfirm.style.cursor = 'not-allowed';
          btnConfirm.disabled = true;
        }
      };
      list.appendChild(item);
    });

    btnConfirm.onclick = function() {
      if (selectedIndices.length !== 2) return;
      overlay.remove();
      selectedIndices.sort(function(a, b) { return b - a; });
      selectedIndices.forEach(function(sIdx) {
        var discarded = g.hand.splice(sIdx, 1)[0];
        if (discarded) g.grave.push(Object.assign({}, discarded, { set: false, faceUp: true }));
      });
      if (window.playDestroySound) window.playDestroySound();
      if (typeof render === 'function') render();
      duelToast('¡Graceful Charity! Robaste 3 cartas y descartaste 2.');
      if (typeof log === 'function') log('Graceful Charity: robas 3 cartas y descartas 2 cartas al cementerio.');
    };
  };

  window.resolveChangeOfHeart = function(fromBackIndex, fromHandIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;

    var enemyMonsters = [];
    (g.enemy || []).forEach(function(m, idx) {
      if (m) enemyMonsters.push({ m: m, idx: idx });
    });

    if (enemyMonsters.length === 0) {
      duelToast('Change of Heart: El rival no tiene monstruos en el campo.');
      return;
    }

    var freePlayerSlot = (g.field || []).findIndex(function(x) { return !x; });
    if (freePlayerSlot < 0) {
      duelToast('No tienes espacio libre en tu zona de monstruos para tomar el control.');
      return;
    }

    var card;
    if (fromBackIndex != null && g.playerBack) {
      card = g.playerBack[fromBackIndex];
      g.playerBack[fromBackIndex] = null;
    } else if (fromHandIndex != null && g.hand) {
      card = g.hand.splice(fromHandIndex, 1)[0];
    }
    if (card) g.grave.push(Object.assign({}, card, { set: false, faceUp: true }));

    function executeTake(ei) {
      var mon = g.enemy[ei];
      if (!mon) return;
      g.enemy[ei] = null;
      mon._changeOfHeartOriginalSide = 'enemy';
      mon._changeOfHeartTurn = g.turnNo || 1;
      mon.faceUp = true;
      mon.faceDown = false;
      mon.faceDownSet103 = false;
      var dest = (g.field || []).findIndex(function(x) { return !x; });
      if (dest >= 0) {
        g.field[dest] = mon;
      } else {
        g.grave.push(mon);
      }
      if (window.playViolinClick) window.playViolinClick();
      if (typeof render === 'function') render();
      var mName = mon.name || mon[0] || 'Monstruo';
      duelToast('¡Change of Heart! Has tomado el control de ' + mName + '.');
      if (typeof log === 'function') log('Change of Heart: tomas el control de ' + mName + ' del rival hasta el final del turno.');
    }

    if (enemyMonsters.length === 1) {
      executeTake(enemyMonsters[0].idx);
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'changeHeartChoiceOverlay';
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;";
    var box = document.createElement('div');
    box.style.cssText = "width:420px;padding:20px;background:rgba(25,12,35,0.95);border:3px solid #ff77ff;border-radius:10px;text-align:center;box-shadow:0 0 30px #000;";
    box.innerHTML = '<h3 style="color:#ff77ff;font-size:24px;margin:0 0 10px;">CHANGE OF HEART</h3><p style="color:#fff;font-size:16px;margin:0 0 15px;">Selecciona el monstruo rival que deseas controlar:</p><div id="heartTargets" style="display:flex;flex-direction:column;gap:10px;"></div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    var container = document.getElementById('heartTargets');
    enemyMonsters.forEach(function(em) {
      var btn = document.createElement('button');
      btn.style.cssText = "padding:12px;background:#222;color:#ffcc00;border:2px solid #ff77ff;border-radius:6px;font-family:inherit;font-size:18px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;";
      var name = em.m.name || em.m[0] || 'Monstruo';
      var atk = (typeof effectiveAtk === 'function') ? effectiveAtk(em.m) : (em.m.atk || 0);
      btn.innerHTML = '<span>' + name + '</span><span style="color:#00ff88;">' + atk + ' ATK</span>';
      btn.onclick = function() {
        overlay.remove();
        executeTake(em.idx);
      };
      container.appendChild(btn);
    });
  };

  window.resolveScapegoat = function(fromBackIndex, fromHandIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;
    var card;
    if (fromBackIndex != null && g.playerBack) {
      card = g.playerBack[fromBackIndex];
      g.playerBack[fromBackIndex] = null;
    } else if (fromHandIndex != null && g.hand) {
      card = g.hand.splice(fromHandIndex, 1)[0];
    }
    if (card) g.grave.push(Object.assign({}, card, { set: false, faceUp: true }));

    var summoned = 0;
    for (var s = 0; s < (g.field || []).length; s++) {
      if (!g.field[s] && summoned < 4) {
        g.field[s] = {
          name: 'Sheep Token',
          num: 112,
          kind: 'TOKEN',
          type: 'Beast',
          attr: 'EARTH',
          level: 1,
          atk: 0,
          def: 0,
          pos: 'DEF',
          faceUp: true,
          faceDown: false,
          desc: 'Token de Oveja invocado por Scapegoat.'
        };
        summoned++;
      }
    }
    if (window.playViolinClick) window.playViolinClick();
    if (typeof render === 'function') render();
    duelToast('¡Scapegoat! Se invocaron ' + summoned + ' Tokens Oveja en Defensa.');
    if (typeof log === 'function') log('Scapegoat: invocas ' + summoned + ' Tokens Oveja (0 ATK / 0 DEF) en modo Defensa.');
  };

  window.resolveLimiterRemoval = function(fromBackIndex, fromHandIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;
    var card;
    if (fromBackIndex != null && g.playerBack) {
      card = g.playerBack[fromBackIndex];
      g.playerBack[fromBackIndex] = null;
    } else if (fromHandIndex != null && g.hand) {
      card = g.hand.splice(fromHandIndex, 1)[0];
    }
    if (card) g.grave.push(Object.assign({}, card, { set: false, faceUp: true }));

    var boosted = 0;
    for (var m = 0; m < (g.field || []).length; m++) {
      var mon = g.field[m];
      if (mon && (mon.type === 'Machine' || (mon[2] && mon[2].toLowerCase() === 'machine'))) {
        var base = Number(mon.atk ?? mon[4] ?? 0);
        mon.equip = (mon.equip || 0) + base;
        mon._limiterBoost = (mon._limiterBoost || 0) + base;
        mon._limiterTurn = g.turnNo || 1;
        boosted++;
      }
    }
    if (window.playViolinClick) window.playViolinClick();
    if (typeof render === 'function') render();
    duelToast('¡Limiter Removal! ATK duplicado en ' + boosted + ' monstruo(s) Máquina.');
    if (typeof log === 'function') log('Limiter Removal: duplica el ATK de tus monstruos Tipo Máquina (' + boosted + ').');
  };

  // Identification helpers
  function isHeavyStorm(c) {
    if (!c) return false;
    var v = String(c.value || '').toUpperCase();
    var n = String(c.name || '').trim().toLowerCase();
    return v === 'HEAVY_STORM' || v === 'HEAVY_STORM_EN' || n === 'heavy storm' || n === 'tormenta pesada' || n.includes('heavy storm') || n.includes('tormenta pesada');
  }
  window.isHeavyStorm = isHeavyStorm;

  function isFeatherDuster(c) {
    if (!c) return false;
    var v = String(c.value || '').toUpperCase();
    var n = String(c.name || '').trim().toLowerCase();
    return v === 'FEATHER_DUSTER' || n === "harpie's feather duster" || n === 'plumero de arpia' || n === 'plumero de la arpia' || n.includes('feather duster') || n.includes('plumero');
  }
  window.isFeatherDuster = isFeatherDuster;

  function isRaigeki(c) {
    if (!c) return false;
    var v = String(c.value || '').toUpperCase();
    var n = String(c.name || '').trim().toLowerCase();
    return v === 'RAIGEKI' || n === 'raigeki';
  }
  window.isRaigeki = isRaigeki;

  function isDarkHole(c) {
    if (!c) return false;
    var v = String(c.value || '').toUpperCase();
    var n = String(c.name || '').trim().toLowerCase();
    return v === 'DARK_HOLE' || n === 'dark hole' || n === 'agujero oscuro';
  }
  window.isDarkHole = isDarkHole;

  // Bulletproof Backrow destruction
  function destroyBackrowSide(side) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return 0;
    var back = (side === 'player') ? g.playerBack : g.enemyBack;
    var grave = (side === 'player') ? g.grave : g.enemyGrave;
    if (!Array.isArray(back)) return 0;
    if (!Array.isArray(grave)) {
      if (side === 'player') { g.grave = []; grave = g.grave; }
      else { g.enemyGrave = []; grave = g.enemyGrave; }
    }

    var count = 0;
    for (var i = 0; i < back.length; i++) {
      var c = back[i];
      if (!c) continue;
      back[i] = null;

      // Handle equip card stat detachment
      if (c.kind === 'EQUIP' || c.type === 'EQUIP' || c.equipToken109 || c._targetMonster || c._appliedAtk109) {
        if (c._targetMonster) {
          if (c._appliedAtk109) c._targetMonster.equip = Math.max(0, (c._targetMonster.equip || 0) - c._appliedAtk109);
          if (c._appliedDef109) c._targetMonster.tempBoostDef = Math.max(0, (c._targetMonster.tempBoostDef || 0) - c._appliedDef109);
          if (Array.isArray(c._targetMonster.equippedCards)) {
            var eqIdx = c._targetMonster.equippedCards.indexOf(c.name);
            if (eqIdx >= 0) c._targetMonster.equippedCards.splice(eqIdx, 1);
          }
        }
        var fieldMons = (side === 'player') ? (g.field || []).concat(g.linkZones || []) : (g.enemy || []).concat(g.enemyLinkZones || []);
        fieldMons.forEach(function(m) {
          if (m && c.equipToken109 && m._equipToken109 === c.equipToken109) {
            if (c._appliedAtk109) m.equip = Math.max(0, (m.equip || 0) - c._appliedAtk109);
            if (c._appliedDef109) m.tempBoostDef = Math.max(0, (m.tempBoostDef || 0) - c._appliedDef109);
            if (Array.isArray(m.equippedCards)) {
              var mIdx = m.equippedCards.indexOf(c.name);
              if (mIdx >= 0) m.equippedCards.splice(mIdx, 1);
            }
          }
        });
      }

      // Black Pendant graveyard effect (500 LP burn)
      if (c.value === 'BLACK_PENDANT' || (c.name && c.name.toLowerCase() === 'black pendant')) {
        if (side === 'player') {
          g.elp = Math.max(0, Number(g.elp || 0) - 500);
          if (typeof log === 'function') log('Black Pendant va al Cementerio: el rival pierde 500 LP.');
        } else {
          g.plp = Math.max(0, Number(g.plp || 0) - 500);
          if (typeof log === 'function') log('Black Pendant rival va al Cementerio: pierdes 500 LP.');
        }
      }

      // Swords cancellation
      if (c.value === 'SWORDS' || (c.name && c.name.toLowerCase().includes('swords of revealing light'))) {
        c.turns109 = 0;
      }
      if (typeof isConcealingSwords === 'function' && isConcealingSwords(c)) {
        c.turnsLeft = 0;
      }

      c.set = false;
      c.faceUp = true;
      grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      count++;
    }

    if (typeof cleanupOrphanedEquips === 'function') {
      try { cleanupOrphanedEquips(); } catch (_) {}
    }

    return count;
  }
  window.destroyBackrowSide = destroyBackrowSide;
  window.destroyBackrow109 = destroyBackrowSide;

  // Bulletproof Monsters destruction
  function destroyMonstersSide(side) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return 0;
    var field = (side === 'player') ? g.field : g.enemy;
    var grave = (side === 'player') ? g.grave : g.enemyGrave;
    var links = (side === 'player') ? g.linkZones : g.enemyLinkZones;
    if (!Array.isArray(field)) return 0;
    if (!Array.isArray(grave)) {
      if (side === 'player') { g.grave = []; grave = g.grave; }
      else { g.enemyGrave = []; grave = g.enemyGrave; }
    }

    var count = 0;
    for (var i = 0; i < field.length; i++) {
      var m = field[i];
      if (!m) continue;
      field[i] = null;
      m.faceDown = false;
      m.faceDownSet103 = false;
      m.faceUp = true;
      grave.push(m);
      count++;
    }

    if (Array.isArray(links)) {
      for (var li = 0; li < links.length; li++) {
        var lm = links[li];
        if (!lm) continue;
        links[li] = null;
        lm.faceDown = false;
        lm.faceUp = true;
        grave.push(lm);
        count++;
      }
    }

    if (typeof cleanupOrphanedEquips === 'function') {
      try { cleanupOrphanedEquips(); } catch (_) {}
    }

    return count;
  }
  window.destroyMonstersSide = destroyMonstersSide;
  window.destroyAllMonsters109 = destroyMonstersSide;

  // Card Resolvers
  window.resolveHeavyStorm = function(fromBackIndex, fromHandIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;

    var card = null;
    if (fromBackIndex != null && g.playerBack) {
      card = g.playerBack[fromBackIndex];
      g.playerBack[fromBackIndex] = null;
    } else if (fromHandIndex != null && g.hand) {
      card = g.hand.splice(fromHandIndex, 1)[0];
    }
    if (card) {
      if (!Array.isArray(g.grave)) g.grave = [];
      g.grave.push(Object.assign({}, card, { set: false, faceUp: true }));
    }

    var nPlayer = destroyBackrowSide('player');
    var nEnemy = destroyBackrowSide('enemy');
    var total = nPlayer + nEnemy;

    if (window.playDestroySound) window.playDestroySound();
    if (typeof render === 'function') render();
    duelToast('¡Heavy Storm destruyó ' + total + ' carta(s) de Magia/Trampa en el Campo!');
    if (typeof log === 'function') log('Tormenta Pesada destruye ' + total + ' Magias/Trampas en todo el Campo (Tus cartas: ' + nPlayer + ', Rival: ' + nEnemy + ').');
  };

  window.resolveFeatherDuster = function(fromBackIndex, fromHandIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;

    var card = null;
    if (fromBackIndex != null && g.playerBack) {
      card = g.playerBack[fromBackIndex];
      g.playerBack[fromBackIndex] = null;
    } else if (fromHandIndex != null && g.hand) {
      card = g.hand.splice(fromHandIndex, 1)[0];
    }
    if (card) {
      if (!Array.isArray(g.grave)) g.grave = [];
      g.grave.push(Object.assign({}, card, { set: false, faceUp: true }));
    }

    var nEnemy = destroyBackrowSide('enemy');

    if (window.playDestroySound) window.playDestroySound();
    if (typeof render === 'function') render();
    duelToast("¡Harpie's Feather Duster destruyó " + nEnemy + " carta(s) de Magia/Trampa del rival!");
    if (typeof log === 'function') log("Harpie's Feather Duster destruye " + nEnemy + ' carta(s) de la zona de Magia/Trampa rival.');
  };

  window.resolveRaigeki = function(fromBackIndex, fromHandIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;

    var card = null;
    if (fromBackIndex != null && g.playerBack) {
      card = g.playerBack[fromBackIndex];
      g.playerBack[fromBackIndex] = null;
    } else if (fromHandIndex != null && g.hand) {
      card = g.hand.splice(fromHandIndex, 1)[0];
    }
    if (card) {
      if (!Array.isArray(g.grave)) g.grave = [];
      g.grave.push(Object.assign({}, card, { set: false, faceUp: true }));
    }

    var nEnemy = destroyMonstersSide('enemy');

    if (window.playDestroySound) window.playDestroySound();
    if (typeof render === 'function') render();
    duelToast('¡Raigeki destruyó ' + nEnemy + ' monstruo(s) del rival!');
    if (typeof log === 'function') log('Raigeki destruye ' + nEnemy + ' monstruo(s) del rival.');
  };

  window.resolveDarkHole = function(fromBackIndex, fromHandIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;

    var card = null;
    if (fromBackIndex != null && g.playerBack) {
      card = g.playerBack[fromBackIndex];
      g.playerBack[fromBackIndex] = null;
    } else if (fromHandIndex != null && g.hand) {
      card = g.hand.splice(fromHandIndex, 1)[0];
    }
    if (card) {
      if (!Array.isArray(g.grave)) g.grave = [];
      g.grave.push(Object.assign({}, card, { set: false, faceUp: true }));
    }

    var nPlayer = destroyMonstersSide('player');
    var nEnemy = destroyMonstersSide('enemy');
    var total = nPlayer + nEnemy;

    if (window.playDestroySound) window.playDestroySound();
    if (typeof render === 'function') render();
    duelToast('¡Dark Hole destruyó ' + total + ' monstruo(s) en el Campo!');
    if (typeof log === 'function') log('Dark Hole destruye ' + total + ' monstruo(s) en el Campo (Tus monstruos: ' + nPlayer + ', Rival: ' + nEnemy + ').');
  };

  function isMST(c) {
    if (!c) return false;
    var n = (c.name || '').toLowerCase();
    var v = (c.value || '').toLowerCase();
    return n.includes('mystical space typhoon') || n.includes('tifón') || v === 'mst' || v === 'mystical_space_typhoon';
  }
  window.isMST = isMST;

  function isFissure(c) {
    if (!c) return false;
    var n = (c.name || '').toLowerCase();
    var v = (c.value || '').toLowerCase();
    return n === 'fissure' || n.includes('fisura') || v === 'fissure';
  }
  window.isFissure = isFissure;

  window.resolveMysticalSpaceTyphoon = function(backIndex, handIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;
    var targets = (g.enemyBack || []).map(function(x, idx) {
      return x ? { card: x, index: idx } : null;
    }).filter(Boolean);

    if (!targets.length) {
      duelToast('Mystical Space Typhoon: El rival no tiene cartas en su zona de Magia/Trampa.');
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'mstChoiceOverlay';
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;";
    var box = document.createElement('div');
    box.style.cssText = "width:420px;padding:25px;background:rgba(10,20,30,0.95);border:3px solid #64b5f6;border-radius:8px;text-align:center;box-shadow:0 0 30px #000;";
    box.innerHTML = '<h3 style="color:#64b5f6;font-size:24px;margin:0 0 15px;">MYSTICAL SPACE TYPHOON</h3><p style="color:#fff;font-size:16px;margin:0 0 15px;">Elige qué carta Mágica/Trampa rival destruir:</p><div id="mstTargets" style="display:flex;flex-direction:column;gap:10px;"></div><button id="mstCancel" style="margin-top:15px;padding:8px 20px;background:#660000;color:#fff;border:2px solid #ff0000;font-family:inherit;font-size:16px;cursor:pointer;">CANCELAR</button>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('mstCancel').onclick = function() { overlay.remove(); };

    var container = document.getElementById('mstTargets');
    targets.forEach(function(t) {
      var btn = document.createElement('button');
      btn.style.cssText = "padding:12px;background:#222;color:#64b5f6;border:2px solid #555;font-family:inherit;font-size:18px;cursor:pointer;";
      btn.textContent = t.card.set ? ('[SET] Carta Boca Abajo (Zona ' + (t.index + 1) + ')') : (t.card.name + ' (Zona ' + (t.index + 1) + ')');
      btn.onclick = function() {
        overlay.remove();
        var targetCard = g.enemyBack[t.index];
        g.enemyBack[t.index] = null;
        g.enemyGrave.push(Object.assign({}, targetCard, { set: false, faceUp: true }));

        if (handIndex !== null && handIndex !== undefined) {
          var c = g.hand.splice(handIndex, 1)[0];
          if (c) g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
        } else if (backIndex !== null && backIndex !== undefined) {
          var c = g.playerBack[backIndex];
          g.playerBack[backIndex] = null;
          if (c) g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
        }
        g.selected = [];
        if (window.playDestroySound) window.playDestroySound();
        if (typeof render === 'function') render();
        var destroyedName = targetCard.set ? 'la carta boca abajo' : targetCard.name;
        duelToast('¡Mystical Space Typhoon destruyó ' + destroyedName + '!');
        if (typeof log === 'function') log('Mystical Space Typhoon destruye ' + destroyedName + ' en la zona de Magia/Trampa rival.');
      };
      container.appendChild(btn);
    });
  };

  window.resolveFissure = function(backIndex, handIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;
    var oppMonsters = [];
    ['enemy', 'enemyLinkZones'].forEach(function(zoneKey) {
      (g[zoneKey] || []).forEach(function(m, idx) {
        if (m && !m.faceDownSet103 && !m.faceDown) {
          oppMonsters.push({
            zone: zoneKey,
            index: idx,
            card: m,
            atk: (typeof effectiveAtk === 'function' ? effectiveAtk(m) : m.atk) || 0
          });
        }
      });
    });
    if (!oppMonsters.length) {
      duelToast('Fissure: El rival no tiene monstruos boca arriba en el campo.');
      return;
    }
    oppMonsters.sort(function(a, b) { return a.atk - b.atk; });
    var target = oppMonsters[0];
    var mCard = g[target.zone][target.index];
    g[target.zone][target.index] = null;
    g.enemyGrave.push(mCard);

    if (handIndex !== null && handIndex !== undefined) {
      var c = g.hand.splice(handIndex, 1)[0];
      if (c) g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
    } else if (backIndex !== null && backIndex !== undefined) {
      var c = g.playerBack[backIndex];
      g.playerBack[backIndex] = null;
      if (c) g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
    }
    if (window.playDestroySound) window.playDestroySound();
    if (typeof render === 'function') render();
    duelToast('¡Fissure destruyó a ' + (mCard.name || 'el monstruo rival') + ' (ATK: ' + target.atk + ')!');
    if (typeof log === 'function') log('Fissure destruye a ' + (mCard.name || 'el monstruo rival') + ' por tener el menor ATK (' + target.atk + ').');
  };

  // 5. activateSTFromHand & activateSetCard
  var prevActivateHand = window.activateSTFromHand;
  window.activateSTFromHand = function(i) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g || g.turn !== 'player') return;
    var c = g.hand ? g.hand[i] : null;
    if (!c) return;
    var val = c.value || '';
    var cName = c.name || '';
    if (c.kind === 'TRAP' || val === 'DUST_TORNADO' || cName === 'Dust Tornado' || (c.type && String(c.type).toUpperCase() === 'TRAP') || (val && String(val).includes('TRAP'))) {
      duelToast(cName + ' es una Trampa: debes colocarla (SET) boca abajo primero.');
      if (typeof log === 'function') log(cName + ' es una Trampa: primero debes colocarla SET en el campo.');
      return;
    }
    if (val === 'REBORN' || cName === 'Renace al Monstruo') {
      resolveMonsterReborn(null, i);
      return;
    }
    // Intercept EQUIP cards
    if (c.kind === 'EQUIP' || val === 'EQUIP' || isEquipSpell(c)) {
      window.promptEquipTarget(c, { type: 'hand', index: i });
      return;
    }
    // Intercept FIELD spells desde la mano
    var nUpperHand = (cName || '').toUpperCase();
    var vUpperHand = (val || '').toUpperCase();
    if (vUpperHand === 'FIELD_MOUNTAIN' || nUpperHand === 'MONTAÑA' || nUpperHand === 'MONTANA' || nUpperHand === 'MOUNTAIN') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'MOUNTAIN';
      g.activeField = 'Montaña';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('⛰️ ¡Campo activo: Montaña! Dragón, Trueno y Bestia Alada reciben +500 ATK/DEF.');
      if (typeof log === 'function') log('⛰️ ¡Campo activo: Montaña! Dragón, Trueno y Bestia Alada reciben +500 ATK y +500 DEF.');
      return;
    }
    if (vUpperHand === 'FIELD_YAMI' || nUpperHand === 'YAMI') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'YAMI';
      g.activeField = 'Yami';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('🌑 ¡Campo activo: Yami! Demonios y Magos reciben +500 ATK/DEF (Hadas -400).');
      if (typeof log === 'function') log('🌑 ¡Campo activo: Yami! Demonios y Magos reciben +500 ATK y +500 DEF (Hadas -400).');
      return;
    }
    if (vUpperHand === 'FIELD_VILLAGE' || vUpperHand === 'SPELLCASTER_VILLAGE' || nUpperHand.includes('PUEBLO SECRETO') || nUpperHand.includes('VILLA')) {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'SPELLCASTER_VILLAGE';
      g.activeField = 'Pueblo Secreto de los Magos';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('🔮 ¡Campo activo: Pueblo Secreto de los Magos! Magos reciben +500 ATK/DEF.');
      if (typeof log === 'function') log('🔮 ¡Campo activo: Pueblo Secreto de los Magos! Magos reciben +500 ATK y +500 DEF.');
      return;
    }
    if (vUpperHand === 'FIELD_FOREST' || nUpperHand === 'FOREST' || nUpperHand === 'BOSQUE') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'FOREST';
      g.activeField = 'Bosque';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('🌲 ¡Campo activo: Bosque! Insectos, Bestias y Plantas reciben +500 ATK/DEF.');
      if (typeof log === 'function') log('🌲 ¡Campo activo: Bosque! Insectos, Bestias y Plantas reciben +500 ATK y +500 DEF.');
      return;
    }
    if (vUpperHand === 'FIELD_WASTELAND' || nUpperHand === 'WASTELAND' || nUpperHand === 'TIERRA YERMA') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'WASTELAND';
      g.activeField = 'Tierra Yerma';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('🏜️ ¡Campo activo: Tierra Yerma! Dinosaurios, Zombis y Rocas reciben +500 ATK/DEF.');
      if (typeof log === 'function') log('🏜️ ¡Campo activo: Tierra Yerma! Dinosaurios, Zombis y Rocas reciben +500 ATK y +500 DEF.');
      return;
    }
    if (vUpperHand === 'FIELD_SOGEN' || nUpperHand === 'SOGEN') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'SOGEN';
      g.activeField = 'Sogen';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('⚔️ ¡Campo activo: Sogen! Guerreros y Bestias-Guerrero reciben +500 ATK/DEF.');
      if (typeof log === 'function') log('⚔️ ¡Campo activo: Sogen! Guerreros y Bestias-Guerrero reciben +500 ATK y +500 DEF.');
      return;
    }
    if (vUpperHand === 'FIELD_UMI' || nUpperHand === 'UMI') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'UMI';
      g.activeField = 'Umi';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('🌊 ¡Campo activo: Umi! Monstruos de Agua, Pez y Trueno reciben +500 ATK/DEF (Máquinas y Fuego -400).');
      if (typeof log === 'function') log('🌊 ¡Campo activo: Umi! Monstruos de Agua, Pez y Trueno reciben +500 ATK/DEF (Máquinas y Fuego -400).');
      return;
    }

    // STOP DEFENSE (#320)
    if (val === 'STOP_DEFENSE' || nUpperHand === 'STOP DEFENSE' || nUpperHand.includes('DETENER LA DEFENSA')) {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      var defTargets = 0;
      (g.enemy || []).forEach(function(em) {
        if (em && (em.pos === 'DEF' || em.faceDown || em.faceDownSet103)) {
          em.pos = 'ATK';
          em.faceDown = false;
          em.faceDownSet103 = false;
          em.faceUp = true;
          defTargets++;
        }
      });
      if (typeof render === 'function') render();
      duelToast('🛡️➡️⚔️ ¡Stop Defense activado! ' + defTargets + ' monstruo(s) rivales obligados a pasar a ATAQUE.');
      if (typeof log === 'function') log('Stop Defense: obliga a ' + defTargets + ' monstruo(s) rivales en defensa a pasar a modo de ATAQUE.');
      return;
    }

    // DRAGON CAPTURE JAR (#329)
    if (val === 'DRAGON_CAPTURE_JAR' || nUpperHand === 'DRAGON CAPTURE JAR' || nUpperHand.includes('JARRA DE CAPTURA')) {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      var dragonsCaught = 0;
      (g.enemy || []).forEach(function(em) {
        if (em && (em.type || em[2] || '').toLowerCase().includes('dragon')) {
          em.pos = 'DEF';
          dragonsCaught++;
        }
      });
      if (typeof render === 'function') render();
      duelToast('🏺 ¡Dragon Capture Jar activado! ' + dragonsCaught + ' dragón(es) rivales encerrados en DEFENSA.');
      if (typeof log === 'function') log('Dragon Capture Jar: atrapa a ' + dragonsCaught + ' dragón(es) rivales forzándolos a posición defensiva.');
      return;
    }

    // HEALING SPELLS (#338 - #342)
    var healAmt = 0;
    if (val === 'HEAL_500' || nUpperHand === 'MOOYAN CURRY') healAmt = 500;
    else if (val === 'HEAL_500_RED' || nUpperHand === 'RED MEDICINE') healAmt = 500;
    else if (val === 'HEAL_1000' || nUpperHand === "GOBLIN'S SECRET REMEDY" || nUpperHand === 'GOBLINS SECRET REMEDY') healAmt = 1000;
    else if (val === 'HEAL_1000_SOUL' || nUpperHand === 'SOUL OF THE PURE') healAmt = 1000;
    else if (val === 'HEAL_2000' || nUpperHand === 'DIAN KETO THE CURE MASTER' || nUpperHand.includes('DIAN KETO')) healAmt = 2000;

    if (healAmt > 0) {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.plp = (g.plp || 8000) + healAmt;
      if (typeof render === 'function') render();
      duelToast('💚 ¡' + cName + ' activado! Recuperas +' + healAmt + ' LP (Total: ' + g.plp + ' LP).');
      if (typeof log === 'function') log(cName + ': recuperas +' + healAmt + ' LP. Puntos de vida actuales: ' + g.plp + '.');
      return;
    }

    // BURN SPELLS (#343 - #347)
    var burnAmt = 0, selfBurn = 0;
    if (val === 'BURN_200' || nUpperHand === 'SPARKS') burnAmt = 200;
    else if (val === 'BURN_500' || nUpperHand === 'HINOTAMA') burnAmt = 500;
    else if (val === 'BURN_600' || nUpperHand === 'FINAL FLAME') burnAmt = 600;
    else if (val === 'BURN_800' || nUpperHand === 'OOKAZI') burnAmt = 800;
    else if (val === 'BURN_1000' || nUpperHand === 'TREMENDOUS FIRE') { burnAmt = 1000; selfBurn = 500; }

    if (burnAmt > 0) {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.elp = Math.max(0, (g.elp || 8000) - burnAmt);
      if (selfBurn > 0) g.plp = Math.max(0, (g.plp || 8000) - selfBurn);
      if (window.playDestroySound) window.playDestroySound();
      if (typeof render === 'function') render();
      var burnMsg = '🔥 ¡' + cName + ' causa ' + burnAmt + ' de daño directo al rival!';
      if (selfBurn > 0) burnMsg += ' (Recibes ' + selfBurn + ' de daño).';
      duelToast(burnMsg);
      if (typeof log === 'function') log(burnMsg);
      return;
    }

    // Intercept Swords of Concealing Light desde la mano
    if (isConcealingSwords(c)) {
      var slot = (g.playerBack || []).findIndex(function(x) { return !x; });
      if (slot < 0) {
        duelToast('No hay espacio en la zona de Magia/Trampa para Swords of Concealing Light.');
        if (typeof log === 'function') log('No hay espacio en la zona de Magia/Trampa para mantener Swords of Concealing Light.');
        return;
      }
      g.hand.splice(i, 1);
      var placed = Object.assign({}, c, {
        set: false,
        faceUp: true,
        value: 'SWORDS_OF_CONCEALING_LIGHT',
        turnsLeft: 2,
        activatedTurn: g.turnNo || 1,
        lastTickedTurn: g.turnNo || 1
      });
      g.playerBack[slot] = placed;
      applyConcealingLightEffect('player', placed);
      return;
    }
    if (val === 'POT_OF_GREED' || cName === 'Pot of Greed') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      for (var d = 0; d < 2; d++) { if (g.deck.length) g.hand.push(g.deck.pop()); }
      if (window.playDrawSound) window.playDrawSound();
      if (typeof render === 'function') render();
      duelToast('¡Pot of Greed activado! Robas 2 cartas.');
      if (typeof log === 'function') log('Pot of Greed activado: robas 2 cartas.');
      return;
    }
    if (isGracefulCharity(c)) {
      window.resolveGracefulCharity(null, i);
      return;
    }
    if (isChangeOfHeart(c)) {
      window.resolveChangeOfHeart(null, i);
      return;
    }
    if (isScapegoat(c)) {
      window.resolveScapegoat(null, i);
      return;
    }
    if (isLimiterRemoval(c)) {
      window.resolveLimiterRemoval(null, i);
      return;
    }
    if (isHeavyStorm(c)) {
      window.resolveHeavyStorm(null, i);
      return;
    }
    if (isFeatherDuster(c)) {
      window.resolveFeatherDuster(null, i);
      return;
    }
    if (isRaigeki(c)) {
      window.resolveRaigeki(null, i);
      return;
    }
    if (isDarkHole(c)) {
      window.resolveDarkHole(null, i);
      return;
    }
    if (isMST(c)) {
      window.resolveMysticalSpaceTyphoon(null, i);
      return;
    }
    if (isFissure(c)) {
      window.resolveFissure(null, i);
      return;
    }
    if (val === 'CYBERNETIC_ZONE' || nUpperHand.includes('CYBERNETIC ZONE')) {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      var boostedMachines = 0;
      (g.player || []).forEach(function(pm) {
        if (pm && (pm.type === 'Machine' || (pm[2] && String(pm[2]).toLowerCase().includes('machine')))) {
          pm.atk = (pm.atk || 0) + 500;
          pm.def = (pm.def || 0) + 500;
          boostedMachines++;
        }
      });
      if (typeof render === 'function') render();
      duelToast('⚙️ ¡Cybernetic Zone activado! ' + boostedMachines + ' máquina(s) reciben +500 ATK/DEF.');
      if (typeof log === 'function') log('Cybernetic Zone otorga +500 ATK y +500 DEF a los monstruos Máquina.');
      return;
    }
    if (val === 'CYBER_FUSION_SUPPORT' || nUpperHand.includes('CYBERNETIC FUSION SUPPORT')) {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.plp = Math.max(100, (g.plp || 8000) - 1000);
      for (var cd = 0; cd < 1; cd++) { if (g.deck.length) g.hand.push(g.deck.pop()); }
      if (typeof render === 'function') render();
      duelToast('⚡ ¡Cybernetic Fusion Support activado! Pagas 1000 LP y robas 1 carta.');
      if (typeof log === 'function') log('Cybernetic Fusion Support activado: pagas 1000 LP y robas 1 carta.');
      return;
    }
    var prevHandLen = g.hand.length;
    if (prevActivateHand) prevActivateHand.apply(this, arguments);
    if (g.hand && g.hand.length === prevHandLen && g.hand[i] === c && c.kind !== 'TRAP') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      if (typeof render === 'function') render();
      duelToast('✨ ¡' + (c.name || 'Magia') + ' activada!');
      if (typeof log === 'function') log(c.name + ' ha sido activada y enviada al Cementerio.');
    }
  };
  try { activateSTFromHand = window.activateSTFromHand; } catch(_) {}

  window.activateSetCard = function(i) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g || g.turn !== 'player') return;
    var c = g.playerBack ? g.playerBack[i] : null;
    if (!c || !c.set) { duelToast('Selecciona una carta colocada (SET).'); return; }

    var val = c.value || '';
    var cName = c.name || '';

    // 1. Intercept EQUIP cards estando SET (abre selector inmediatamente):
    if (c.kind === 'EQUIP' || val === 'EQUIP' || isEquipSpell(c)) {
      window.promptEquipTarget(c, { type: 'back', index: i });
      return;
    }

    // 2. Renace al Monstruo estando SET:
    if (val === 'REBORN' || cName === 'Renace al Monstruo') {
      resolveMonsterReborn(i, null);
      return;
    }

    // 3. Swords of Revealing Light estando SET:
    if (val === 'SWORDS' || cName === 'Swords of Revealing Light') {
      c.set = false;
      c.faceUp = true;
      c.turns109 = 3;
      if (typeof revealAllSet109 === 'function') revealAllSet109('enemy');
      if (typeof render === 'function') render();
      duelToast('¡Swords of Revealing Light activada! El rival no podrá atacar por 3 turnos.');
      if (typeof log === 'function') log('Swords of Revealing Light: el rival no podrá atacar durante 3 turnos.');
      return;
    }

    // 3b. Swords of Concealing Light estando SET:
    if (isConcealingSwords(c)) {
      c.set = false;
      c.faceUp = true;
      c.value = 'SWORDS_OF_CONCEALING_LIGHT';
      c.turnsLeft = 2;
      c.activatedTurn = g.turnNo || 1;
      c.lastTickedTurn = g.turnNo || 1;
      applyConcealingLightEffect('player', c);
      return;
    }

    // 4. Pot of Greed estando SET:
    if (val === 'POT_OF_GREED' || cName === 'Pot of Greed') {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      for (var d = 0; d < 2; d++) { if (g.deck.length) g.hand.push(g.deck.pop()); }
      if (window.playDrawSound) window.playDrawSound();
      if (typeof render === 'function') render();
      duelToast('¡Pot of Greed activado! Robas 2 cartas.');
      if (typeof log === 'function') log('Pot of Greed activado: robas 2 cartas.');
      return;
    }

    // Intercept FIELD spells estando SET:
    var nUpperSet = (cName || '').toUpperCase();
    var vUpperSet = (val || '').toUpperCase();
    if (vUpperSet === 'FIELD_MOUNTAIN' || nUpperSet === 'MONTAÑA' || nUpperSet === 'MONTANA' || nUpperSet === 'MOUNTAIN') {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'MOUNTAIN';
      g.activeField = 'Montaña';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('⛰️ ¡Campo activo: Montaña! Dragón, Trueno y Bestia Alada reciben +500 ATK/DEF.');
      if (typeof log === 'function') log('⛰️ ¡Campo activo: Montaña! Dragón, Trueno y Bestia Alada reciben +500 ATK y +500 DEF.');
      return;
    }
    if (vUpperSet === 'FIELD_YAMI' || nUpperSet === 'YAMI') {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'YAMI';
      g.activeField = 'Yami';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('🌑 ¡Campo activo: Yami! Demonios y Magos reciben +500 ATK/DEF (Hadas -400).');
      if (typeof log === 'function') log('🌑 ¡Campo activo: Yami! Demonios y Magos reciben +500 ATK y +500 DEF (Hadas -400).');
      return;
    }
    if (vUpperSet === 'FIELD_VILLAGE' || vUpperSet === 'SPELLCASTER_VILLAGE' || nUpperSet.includes('PUEBLO SECRETO') || nUpperSet.includes('VILLA')) {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.fieldBoost = 'SPELLCASTER_VILLAGE';
      g.activeField = 'Pueblo Secreto de los Magos';
      if (typeof window.syncFieldStats === 'function') window.syncFieldStats();
      if (typeof window.updateFieldIndicator === 'function') window.updateFieldIndicator();
      if (typeof render === 'function') render();
      duelToast('🔮 ¡Campo activo: Pueblo Secreto de los Magos! Magos reciben +500 ATK/DEF.');
      if (typeof log === 'function') log('🔮 ¡Campo activo: Pueblo Secreto de los Magos! Magos reciben +500 ATK y +500 DEF.');
      return;
    }

    // 4b. Graceful Charity, Change of Heart, Scapegoat, Limiter Removal estando SET:
    if (isGracefulCharity(c)) {
      window.resolveGracefulCharity(i, null);
      return;
    }
    if (isChangeOfHeart(c)) {
      window.resolveChangeOfHeart(i, null);
      return;
    }
    if (isScapegoat(c)) {
      window.resolveScapegoat(i, null);
      return;
    }
    if (isLimiterRemoval(c)) {
      window.resolveLimiterRemoval(i, null);
      return;
    }

    // 5. Raigeki estando SET:
    if (isRaigeki(c)) {
      window.resolveRaigeki(i, null);
      return;
    }

    // 6. Dark Hole estando SET:
    if (isDarkHole(c)) {
      window.resolveDarkHole(i, null);
      return;
    }

    // 7. Harpie's Feather Duster estando SET:
    if (isFeatherDuster(c)) {
      window.resolveFeatherDuster(i, null);
      return;
    }

    // 8. Heavy Storm / Tormenta Pesada estando SET:
    if (isHeavyStorm(c)) {
      window.resolveHeavyStorm(i, null);
      return;
    }

    // 8b. Mystical Space Typhoon y Fissure estando SET:
    if (isMST(c)) {
      window.resolveMysticalSpaceTyphoon(i, null);
      return;
    }
    if (isFissure(c)) {
      window.resolveFissure(i, null);
      return;
    }

    // 9. Trampas (chequeo de turno y manuales):
    var isTrapCard = (c.kind === 'TRAP' || (c.type && String(c.type).toUpperCase() === 'TRAP') || val === 'DUST_TORNADO' || cName === 'Dust Tornado' || (val && String(val).includes('TRAP')));
    if (isTrapCard) {
      if (typeof window.isTrapReady === 'function' && !window.isTrapReady(c)) {
        duelToast(cName + ' fue colocada este turno. Debe permanecer SET hasta el próximo turno.');
        if (typeof log === 'function') log(cName + ' fue colocada este turno. Debe permanecer SET hasta el próximo turno.');
        return;
      }

      // Dust Tornado manual
      if (val === 'DUST_TORNADO' || cName === 'Dust Tornado') {
        var targets = (g.enemyBack || []).map(function(x, idx) {
          return x ? { card: x, index: idx } : null;
        }).filter(Boolean);

        if (!targets.length) {
          duelToast('Dust Tornado: El rival no tiene cartas en su zona de Magia/Trampa.');
          return;
        }

        var overlay = document.createElement('div');
        overlay.id = 'dustChoiceOverlay';
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;";
        var box = document.createElement('div');
        box.style.cssText = "width:420px;padding:25px;background:rgba(20,10,0,0.95);border:3px solid #ffd700;border-radius:8px;text-align:center;box-shadow:0 0 30px #000;";
        box.innerHTML = '<h3 style="color:#ffd700;font-size:24px;margin:0 0 15px;">DUST TORNADO</h3><p style="color:#fff;font-size:16px;margin:0 0 15px;">Elige qué carta rival destruir:</p><div id="dustTargets" style="display:flex;flex-direction:column;gap:10px;"></div><button id="dustCancel" style="margin-top:15px;padding:8px 20px;background:#660000;color:#fff;border:2px solid #ff0000;font-family:inherit;font-size:16px;cursor:pointer;">CANCELAR</button>';
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        document.getElementById('dustCancel').onclick = function() { overlay.remove(); };

        var container = document.getElementById('dustTargets');
        targets.forEach(function(t) {
          var btn = document.createElement('button');
          btn.style.cssText = "padding:12px;background:#222;color:#ffd700;border:2px solid #555;font-family:inherit;font-size:18px;cursor:pointer;";
          btn.textContent = t.card.set ? ('[SET] Carta Boca Abajo (Zona ' + (t.index + 1) + ')') : (t.card.name + ' (Zona ' + (t.index + 1) + ')');
          btn.onclick = function() {
            overlay.remove();
            var targetCard = g.enemyBack[t.index];
            g.enemyBack[t.index] = null;
            g.enemyGrave.push(Object.assign({}, targetCard, { set: false, faceUp: true }));
            g.playerBack[i] = null;
            g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
            g.selected = [];

            // Si la carta destruida era un Equipo, despojar los stats del monstruo rival
            if (targetCard && (targetCard.kind === 'EQUIP' || targetCard.type === 'EQUIP' || (typeof isEquipSpell === 'function' && isEquipSpell(targetCard)))) {
              if (typeof stripEquip109 === 'function') try { stripEquip109('enemy', targetCard); } catch(_) {}
              else if (targetCard._targetMonster) {
                targetCard._targetMonster.equip = Math.max(0, (targetCard._targetMonster.equip || 0) - (targetCard._appliedAtk109 || 500));
                targetCard._targetMonster.atk = Math.max(0, (targetCard._targetMonster.atk || 0) - (targetCard._appliedAtk109 || 500));
              }
            }

            if (window.playDestroySound) window.playDestroySound();
            if (typeof cleanupOrphanedEquips === 'function') try { cleanupOrphanedEquips(); } catch(_) {}
            if (typeof render === 'function') render();
            var tName = targetCard.set ? 'la carta SET rival' : (targetCard.name || 'la carta rival');
            duelToast('¡Dust Tornado destruyó ' + tName + '!');
            if (typeof log === 'function') log('Dust Tornado destruye ' + tName + ' de la zona de Magia/Trampa.');
          };
          container.appendChild(btn);
        });
        return;
      }

      // Waboku manual
      if (val === 'WABOKU' || cName === 'Waboku') {
        g.playerBack[i] = null;
        g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
        g._wabokuActiveThisTurn = true;
        g._wabokuActiveTurn = g.turnNo;
        g.selected = [];
        if (typeof render === 'function') render();
        duelToast('¡Waboku activado! Durante este turno tus monstruos y LP están protegidos.');
        return;
      }

      // Threatening Roar manual
      if (val === 'THREATENING_ROAR' || cName === 'Threatening Roar') {
        g.playerBack[i] = null;
        g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
        g._threateningRoarActive = true;
        g._threateningRoarTurn = g.turnNo;
        g.selected = [];
        if (typeof render === 'function') render();
        duelToast('¡Threatening Roar activado! El rival no podrá atacar este turno.');
        return;
      }

      // Crush Card Virus manual
      if (val === 'CRUSH_CARD_VIRUS' || cName === 'Crush Card Virus') {
        var destroyedCount = 0;
        for (var k = 0; k < (g.enemy || []).length; k++) {
          var em = g.enemy[k];
          if (em) {
            if (isEgyptianGod(em.name || em[0])) {
              if (typeof log === 'function') log('¡El Dios Egipcio ' + (em.name || 'Dios') + ' resiste la destrucción de Crush Card Virus!');
              continue;
            }
            g.enemyGrave.push(em);
            g.enemy[k] = null;
            destroyedCount++;
          }
        }
        g.playerBack[i] = null;
        g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
        g.selected = [];
        if (window.playDestroySound) window.playDestroySound();
        if (typeof render === 'function') render();
        duelToast('¡Crush Card Virus activado! Destruyó ' + destroyedCount + ' monstruo(s) en el campo rival.');
        if (typeof log === 'function') log('¡Crush Card Virus! Destruye todos los monstruos en el campo rival (' + destroyedCount + '). No afecta mano ni deck.');
        return;
      }

      // Automatic response traps
      if (['MIRROR_FORCE', 'TRAP_HOLE', 'MAGIC_CYLINDER', 'NEGATE_ATTACK', 'SAKURETSU_ARMOR', 'TORRENTIAL', 'WIDESPREAD_RUIN', 'EATGABOON', 'BEAR_TRAP', 'INVISIBLE_WIRE', 'ACID_TRAP_HOLE', 'GOBLIN_FAN', 'BAD_REACTION_TO_SIMOCHI', 'REVERSE_TRAP', 'FAKE_TRAP'].includes(val) ||
          ['Trap Hole', 'Sakuretsu Armor', 'Negate Attack', 'Mirror Force', 'Torrential Tribute', 'Widespread Ruin', 'Eatgaboon', 'Bear Trap', 'Invisible Wire', 'Acid Trap Hole', 'Goblin Fan', 'Bad Reaction to Simochi', 'Reverse Trap', 'Fake Trap'].includes(cName)) {
        duelToast(cName + ' es una Trampa de respuesta automática. Se activará cuando el rival ataque o invoque.');
        return;
      }

      duelToast(cName + ' se activará automáticamente cuando se cumpla su condición.');
      return;
    }

    // 10. Fallback para CUALQUIER otra Magia en zona de Magias/Trampas:
    g.playerBack[i] = null;
    g.hand.push(Object.assign({}, c, { set: false, faceUp: true }));
    var handIdx = g.hand.length - 1;
    var lenBefore = g.hand.length;
    window.activateSTFromHand(handIdx);
    if (g.hand.length === lenBefore && g.hand[handIdx] === c) {
      g.hand.splice(handIdx, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      g.selected = [];
      if (typeof render === 'function') render();
      duelToast('¡' + cName + ' activado!');
      if (typeof log === 'function') log(cName + ' activado desde el campo.');
    }
  };
  try { activateSetCard = window.activateSetCard; } catch(_) {}

  // Override de dustTornadoPlayer109 para garantizar que nunca se active desde la mano ni en el turno que fue seteada
  window.dustTornadoPlayer109 = function(c, fromBackIndex) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return;
    if (fromBackIndex == null) {
      duelToast('Dust Tornado es una Trampa: debes colocarla (SET) boca abajo primero.');
      if (typeof log === 'function') log('Dust Tornado es una Trampa: debes colocarla (SET) boca abajo primero.');
      return;
    }
    var cardInBack = g.playerBack ? g.playerBack[fromBackIndex] : null;
    if (cardInBack && !window.isTrapReady(cardInBack)) {
      duelToast('Dust Tornado fue colocada este turno. Debe permanecer SET hasta el próximo turno.');
      if (typeof log === 'function') log('Dust Tornado fue colocada este turno. Debe permanecer SET hasta el próximo turno.');
      return;
    }
    if (typeof activateSetCard === 'function') {
      return activateSetCard(fromBackIndex);
    }
  };
  try { dustTornadoPlayer109 = window.dustTornadoPlayer109; } catch(_) {}

  // ==========================================
  // GUARDIAN SIGNS SYSTEM (YGO FM Core Mechanic)
  // ==========================================
  var GUARDIAN_BEATS = {
    // Solar cycle: Sol > Luna > Venus > Mercurio > Sol
    SOL: 'LUNA',
    LUNA: 'VENUS',
    VENUS: 'MERCURIO',
    MERCURIO: 'SOL',
    // Planetary cycle: Marte > Jupiter > Saturno > Urano > Pluton > Neptuno > Marte
    MARTE: 'JUPITER',
    JUPITER: 'SATURNO',
    SATURNO: 'URANO',
    URANO: 'PLUTON',
    PLUTON: 'NEPTUNO',
    NEPTUNO: 'MARTE'
  };

  var GUARDIAN_SYMBOLS = {
    SOL: '☉',
    LUNA: '☽',
    VENUS: '♀',
    MERCURIO: '☿',
    NEPTUNO: '♆',
    MARTE: '♂',
    JUPITER: '♃',
    SATURNO: '♄',
    URANO: '♅',
    PLUTON: '♇'
  };

  var GUARDIAN_LABELS = {
    SOL: 'SOL',
    LUNA: 'LUNA',
    VENUS: 'VENUS',
    MERCURIO: 'MERCURIO',
    NEPTUNO: 'NEPTUNO',
    MARTE: 'MARTE',
    JUPITER: 'JÚPITER',
    SATURNO: 'SATURNO',
    URANO: 'URANO',
    PLUTON: 'PLUTÓN'
  };

  window.FMR_SIGN_SYMBOL = GUARDIAN_SYMBOLS;
  window.FMR_SIGN_LABEL = GUARDIAN_LABELS;

  function ensureActiveSign(c) {
    if (!c) return null;
    if (c.activeSign) return c.activeSign;
    if (c.guardianSign) {
      c.activeSign = c.guardianSign;
      return c.activeSign;
    }
    var m = (typeof window.FMR_CARD_META !== 'undefined' && window.FMR_CARD_META) ? window.FMR_CARD_META[c.name || c[0]] : null;
    var s1 = c.sign1 || (m && m.sign1) || (c.signs && c.signs[0]);
    if (s1) {
      c.activeSign = s1;
      c.guardianSign = s1;
      return s1;
    }
    var attr = String(c.attr || (c && c[3]) || '').toUpperCase();
    var type = String(c.type || (c && c[2]) || '').toUpperCase();
    var a = 'SOL';
    if (type === 'THUNDER') a = 'PLUTON';
    else if (attr === 'LIGHT') a = 'SOL';
    else if (attr === 'FIRE') a = 'MARTE';
    else if (attr === 'WATER') a = 'NEPTUNO';
    else if (attr === 'DARK' && type === 'FIEND') a = 'LUNA';
    else if (attr === 'WIND') a = 'MERCURIO';
    else if (attr === 'EARTH') a = 'SATURNO';
    else if (attr === 'DARK') a = 'LUNA';
    else a = 'JUPITER';
    c.activeSign = a;
    c.guardianSign = a;
    return a;
  }
  window.ensureActiveSign = ensureActiveSign;

  function getCardSign(c) {
    return ensureActiveSign(c);
  }

  function getSignCombatRelation(attacker, defender) {
    if (!attacker || !defender) return 'none';
    var aSign = getCardSign(attacker);
    var dSign = getCardSign(defender);
    if (!aSign || !dSign) return 'none';
    if (GUARDIAN_BEATS[aSign] === dSign) return 'adv';
    if (GUARDIAN_BEATS[dSign] === aSign) return 'disadv';
    return 'neutral';
  }
  window.getSignCombatRelation = getSignCombatRelation;

  function getActivePlayerAttacker() {
    if (typeof game === 'undefined' || !game || game.turn !== 'player') return null;
    if (typeof pendingAttack114 !== 'undefined' && pendingAttack114 && pendingAttack114.card) {
      return pendingAttack114.card;
    }
    var pick = (game.selected || []).find(function(x) { return x && (x[0] === 'f' || x[0] === 'l'); });
    if (pick) {
      var c = pick[0] === 'f' ? (game.field && game.field[pick[1]]) : (game.linkZones && game.linkZones[pick[1]]);
      if (c && c.pos !== 'DEF') return c;
    }
    return null;
  }

  function updateGuardianBattleHints() {
    // 1. Clear existing badges & highlights
    document.querySelectorAll('.guardianSignBattleBadge').forEach(function(b) { b.remove(); });
    document.querySelectorAll('.signAdvantageHighlight, .signDisadvantageHighlight').forEach(function(el) {
      el.classList.remove('signAdvantageHighlight', 'signDisadvantageHighlight');
    });

    if (typeof game === 'undefined' || !game || game.turn !== 'player') return;

    var attacker = getActivePlayerAttacker();
    if (!attacker) return;

    var aSign = getCardSign(attacker);
    if (!aSign) return;
    var aSym = GUARDIAN_SYMBOLS[aSign] || aSign;

    // Scan enemy field monsters
    for (var i = 0; i < 5; i++) {
      var defender = game.enemy && game.enemy[i];
      if (!defender) continue;

      var dSign = getCardSign(defender);
      if (!dSign) continue;
      var dSym = GUARDIAN_SYMBOLS[dSign] || dSign;

      var rel = getSignCombatRelation(attacker, defender);
      if (rel !== 'adv' && rel !== 'disadv') continue;

      var zoneEl = document.querySelector('#enemy > .zone:nth-child(' + (i + 1) + ')');
      var monsterEl = document.querySelector('#enemy .fieldMonster[data-zone="e"][data-index="' + i + '"]');

      if (monsterEl) {
        if (rel === 'adv') {
          monsterEl.classList.add('signAdvantageHighlight');
        } else {
          monsterEl.classList.add('signDisadvantageHighlight');
        }
      }

      if (zoneEl) {
        zoneEl.style.position = 'relative';
        var badge = document.createElement('div');
        badge.className = 'guardianSignBattleBadge ' + rel;
        if (rel === 'adv') {
          badge.innerHTML = '<div class="signBadgeTop">⚡ +500 VENTAJA</div><div class="signBadgeSub">' + aSym + ' ➔ ' + dSym + '</div>';
        } else {
          badge.innerHTML = '<div class="signBadgeTop">⚠️ -500 PELIGRO</div><div class="signBadgeSub">' + dSym + ' ➔ ' + aSym + '</div>';
        }
        zoneEl.appendChild(badge);
      }
    }
  }
  window.updateGuardianBattleHints = updateGuardianBattleHints;

  // Universal Trap Timing & Readiness Resolver (Regla Oficial FMR: 1 turno completo / Fase Final tras colocar)
  window.isTrapReady = function(c) {
    if (!c || !c.set) return false;
    var isTrap = (c.kind === 'TRAP' || (c.type && String(c.type).toUpperCase() === 'TRAP') || c.value === 'DUST_TORNADO' || c.name === 'Dust Tornado' || (c.value && String(c.value).includes('TRAP')));
    if (!isTrap) return true;

    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return false;

    var currentTurn = Number(g.turnNo || 1);
    var currentSide = g.turn; // 'player' or 'enemy'

    // Si fue colocada en esta misma acción / turno por el jugador actual
    if (c._setThisTurn != null && Number(c._setThisTurn) === currentTurn) {
      if (c.setSide && c.setSide === currentSide) return false;
    }

    // Chequeo estricto de setSide y setTurn:
    // Una trampa NUNCA puede activarse en el mismo turno por el jugador que la colocó
    if (c.setSide && c.setSide === currentSide) {
      if (c.setTurn != null && Number(c.setTurn) === currentTurn) return false;
      if (c.readyTurn != null && currentTurn < Number(c.readyTurn)) return false;
    }

    // Si no tiene setTurn ni readyTurn (cartas colocadas sin metadatos):
    if (c.setTurn == null && c.readyTurn == null) {
      c.setSide = c.setSide || currentSide;
      c.setTurn = currentTurn;
      c.readyTurn = currentTurn + 1;
      return false;
    }

    return true;
  };
  var isTrapReady = window.isTrapReady;

  // Verificador Universal de Trampas ante Invocación (Trap Hole, Torrential Tribute)
  window.checkSummonTraps = function(summonedCard, summonedSide, slotIndex) {
    if (!game || !summonedCard) return false;
    var defendingSide = summonedSide === 'enemy' ? 'player' : 'enemy';
    var defBack = defendingSide === 'player' ? (game.playerBack || []) : (game.enemyBack || []);
    var defGrave = defendingSide === 'player' ? game.grave : game.enemyGrave;
    var sumField = summonedSide === 'enemy' ? game.enemy : game.field;
    var sumGrave = summonedSide === 'enemy' ? game.enemyGrave : game.grave;

    // 1. Torrential Tribute
    var torIdx = defBack.findIndex(function(c) {
      return c && c.set && isTrapReady(c) && (c.value === 'TORRENTIAL' || c.name === 'Torrential Tribute');
    });
    if (torIdx >= 0) {
      var trapTor = defBack[torIdx];
      defBack[torIdx] = null;
      defGrave.push(Object.assign({}, trapTor, { set: false, faceUp: true }));
      var torDest = 0;
      for (var ei = 0; ei < (game.enemy || []).length; ei++) {
        var em = game.enemy[ei];
        if (em && !isEgyptianGod(em.name || em[0])) {
          game.enemyGrave.push(em); game.enemy[ei] = null; torDest++;
        }
      }
      for (var pi = 0; pi < (game.field || []).length; pi++) {
        var pm = game.field[pi];
        if (pm && !isEgyptianGod(pm.name || pm[0])) {
          game.grave.push(pm); game.field[pi] = null; torDest++;
        }
      }
      if (window.playDestroySound) window.playDestroySound();
      var labelTor = defendingSide === 'player' ? '¡Tu Torrential Tribute activado!' : '¡El rival activa Torrential Tribute!';
      if (typeof duelToast === 'function') duelToast(labelTor + ' (' + torDest + ' monstruos destruidos)');
      if (typeof log === 'function') log(labelTor + ' Destruye todos los monstruos en el campo (' + torDest + ').');
      if (typeof render === 'function') render();
      return true;
    }

    // 2. Trap Hole (Monstruos invocados con ATK >= 1000)
    var sAtk = Number(summonedCard.atk || summonedCard[4] || 0);
    var thIdx = defBack.findIndex(function(c) {
      return c && c.set && isTrapReady(c) && (c.value === 'TRAP_HOLE' || c.name === 'Trap Hole');
    });
    if (thIdx >= 0 && sAtk >= 1000) {
      var sName = summonedCard.name || summonedCard[0] || 'Monstruo';
      if (isEgyptianGod(sName)) {
        if (typeof duelToast === 'function') duelToast('¡Trap Hole falla! ¡Los Dioses Egipcios no caen en trampas!');
        if (typeof log === 'function') log('¡Trap Hole no puede atrapar al Dios Egipcio ' + sName + '!');
        return false;
      }
      var trapH = defBack[thIdx];
      defBack[thIdx] = null;
      defGrave.push(Object.assign({}, trapH, { set: false, faceUp: true }));
      if (slotIndex != null) sumField[slotIndex] = null;
      sumGrave.push(summonedCard);
      if (window.playDestroySound) window.playDestroySound();
      var labelTH = defendingSide === 'player' ? '¡Tu Trap Hole activado!' : '¡El rival activa Trap Hole!';
      if (typeof duelToast === 'function') duelToast(labelTH + ' ' + sName + ' (' + sAtk + ' ATK) cayó en el pozo y fue destruido.');
      if (typeof log === 'function') log(labelTH + ' ' + sName + ' (' + sAtk + ' ATK) es destruido de inmediato al ser invocado.');
      if (typeof render === 'function') render();
      return true;
    }

    // 3. Acid Trap Hole ante Invocación
    var athIdx = defBack.findIndex(function(c) {
      return c && c.set && isTrapReady(c) && (c.value === 'ACID_TRAP_HOLE' || c.name === 'Acid Trap Hole');
    });
    if (athIdx >= 0) {
      var sName = summonedCard.name || summonedCard[0] || 'Monstruo';
      if (!isEgyptianGod(sName)) {
        var trapATH = defBack[athIdx];
        defBack[athIdx] = null;
        defGrave.push(Object.assign({}, trapATH, { set: false, faceUp: true }));
        if (slotIndex != null) sumField[slotIndex] = null;
        sumGrave.push(summonedCard);
        if (window.playDestroySound) window.playDestroySound();
        var labelATH = defendingSide === 'player' ? '¡Tu Acid Trap Hole activado!' : '¡El rival activa Acid Trap Hole!';
        if (typeof duelToast === 'function') duelToast(labelATH + ' ' + sName + ' fue disuelto en ácido y destruido.');
        if (typeof log === 'function') log(labelATH + ' ' + sName + ' es destruido por Acid Trap Hole al ser invocado.');
        if (typeof render === 'function') render();
        return true;
      }
    }

    // 4. Eatgaboon ante Invocación (ATK <= 1000)
    if (sAtk <= 1000) {
      var eatIdx = defBack.findIndex(function(c) {
        return c && c.set && isTrapReady(c) && (c.value === 'EATGABOON' || c.name === 'Eatgaboon');
      });
      if (eatIdx >= 0) {
        var sName = summonedCard.name || summonedCard[0] || 'Monstruo';
        if (!isEgyptianGod(sName)) {
          var trapEat = defBack[eatIdx];
          defBack[eatIdx] = null;
          defGrave.push(Object.assign({}, trapEat, { set: false, faceUp: true }));
          if (slotIndex != null) sumField[slotIndex] = null;
          sumGrave.push(summonedCard);
          if (window.playDestroySound) window.playDestroySound();
          var labelEat = defendingSide === 'player' ? '¡Tu Eatgaboon activado!' : '¡El rival activa Eatgaboon!';
          if (typeof duelToast === 'function') duelToast(labelEat + ' ' + sName + ' (' + sAtk + ' ATK) fue devorado.');
          if (typeof log === 'function') log(labelEat + ' ' + sName + ' es devorado por Eatgaboon al ser invocado.');
          if (typeof render === 'function') render();
          return true;
        }
      }
    }

    // 5. Bear Trap ante Invocación (ATK <= 1500)
    if (sAtk <= 1500) {
      var bearIdx = defBack.findIndex(function(c) {
        return c && c.set && isTrapReady(c) && (c.value === 'BEAR_TRAP' || c.name === 'Bear Trap');
      });
      if (bearIdx >= 0) {
        var sName = summonedCard.name || summonedCard[0] || 'Monstruo';
        if (!isEgyptianGod(sName)) {
          var trapBear = defBack[bearIdx];
          defBack[bearIdx] = null;
          defGrave.push(Object.assign({}, trapBear, { set: false, faceUp: true }));
          if (slotIndex != null) sumField[slotIndex] = null;
          sumGrave.push(summonedCard);
          if (window.playDestroySound) window.playDestroySound();
          var labelBear = defendingSide === 'player' ? '¡Tu Bear Trap activada!' : '¡El rival activa Bear Trap!';
          if (typeof duelToast === 'function') duelToast(labelBear + ' ' + sName + ' (' + sAtk + ' ATK) cayó en la trampa de oso.');
          if (typeof log === 'function') log(labelBear + ' ' + sName + ' es atrapado y destruido por Bear Trap.');
          if (typeof render === 'function') render();
          return true;
        }
      }
    }

    // 6. Invisible Wire ante Invocación (ATK <= 2000)
    if (sAtk <= 2000) {
      var wireIdx = defBack.findIndex(function(c) {
        return c && c.set && isTrapReady(c) && (c.value === 'INVISIBLE_WIRE' || c.name === 'Invisible Wire');
      });
      if (wireIdx >= 0) {
        var sName = summonedCard.name || summonedCard[0] || 'Monstruo';
        if (!isEgyptianGod(sName)) {
          var trapWire = defBack[wireIdx];
          defBack[wireIdx] = null;
          defGrave.push(Object.assign({}, trapWire, { set: false, faceUp: true }));
          if (slotIndex != null) sumField[slotIndex] = null;
          sumGrave.push(summonedCard);
          if (window.playDestroySound) window.playDestroySound();
          var labelWire = defendingSide === 'player' ? '¡Tu Invisible Wire activado!' : '¡El rival activa Invisible Wire!';
          if (typeof duelToast === 'function') duelToast(labelWire + ' ' + sName + ' (' + sAtk + ' ATK) fue rebanado.');
          if (typeof log === 'function') log(labelWire + ' ' + sName + ' es rebanado por Invisible Wire al ser invocado.');
          if (typeof render === 'function') render();
          return true;
        }
      }
    }

    return false;
  };

  // Helper to reliably get monster ATK and DEF regardless of object format
  function getCardStats(c) {
    if (!c) return { atk: 0, def: 0, name: '' };
    var name = typeof c === 'string' ? c : (c.name || c[0] || '');
    var atk = c.atk !== undefined ? Number(c.atk) : (c[4] !== undefined ? Number(c[4]) : null);
    var def = c.def !== undefined ? Number(c.def) : (c[5] !== undefined ? Number(c[5]) : null);
    if (atk === null || def === null || isNaN(atk) || isNaN(def)) {
      var cd = null;
      if (typeof window.resolveGameCard === 'function') cd = window.resolveGameCard(name);
      else if (typeof window.mk === 'function') cd = window.mk(name);
      if (cd) {
        if (atk === null || isNaN(atk)) atk = Number(cd.atk || 0);
        if (def === null || isNaN(def)) def = Number(cd.def || 0);
      }
    }
    return { atk: atk || 0, def: def || 0, name: name };
  }
  window.getCardStats = getCardStats;

  // 6. MOTOR DE INTELIGENCIA ARTIFICIAL INTELIGENTE, PRUDENTE Y AGRESIVA (FMR MÁXIMO PODER)
  window.aiHandSummonOrSet = function() {
    if (!game || game.turn !== 'enemy' || !Array.isArray(game.enemyHand)) return;

    var opp = (window.storyOpponent || window.lastDuelOpponent || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    var isGodBoss = (opp === 'marik' || opp === 'kaiba' || opp === 'seto' || opp === 'yugi');
    var hand = game.enemyHand;

    // A0. Invocación de Dios Egipcio SIN tributos para Yugi, Kaiba y Marik (3 tributos solo para el jugador)
    if (isGodBoss) {
      var godMap = {
        'marik': 'The Winged Dragon of Ra',
        'kaiba': 'Obelisk the Tormentor',
        'seto': 'Obelisk the Tormentor',
        'yugi': window._yugiSelectedGod || 'Slifer the Sky Dragon'
      };
      var targetGodName = godMap[opp];
      if (targetGodName && (game.turnNo === 1 || !hand.some(function(c) { return c && isEgyptianGod(c.name || c[0]); }))) {
        var hasGodInHand = hand.some(function(c) { return c && (c.name === targetGodName || c[0] === targetGodName); });
        var hasGodOnField = (game.enemy || []).some(function(c) { return c && (c.name === targetGodName || c[0] === targetGodName); });
        if (!hasGodInHand && !hasGodOnField) {
          var dIdx = (game.enemyDeck || []).findIndex(function(c) { return c && (c.name === targetGodName || c[0] === targetGodName); });
          var swapC = hand[0];
          if (dIdx >= 0) {
            var gCard = game.enemyDeck.splice(dIdx, 1)[0];
            hand[0] = gCard;
            if (swapC) game.enemyDeck.push(swapC);
          } else {
            var gCard = (typeof window.mk === 'function' ? window.mk(targetGodName) : null) || { name: targetGodName, atk: 5000, def: 5000, pos: 'ATK', faceUp: true };
            gCard.atk = 5000; gCard.def = 5000; gCard.pos = 'ATK'; gCard.faceUp = true;
            hand[0] = gCard;
            if (swapC && Array.isArray(game.enemyDeck)) game.enemyDeck.push(swapC);
          }
        }
      }

      var godIdx = hand.findIndex(function(c) { return c && isEgyptianGod(c.name || c[0]); });
      if (godIdx >= 0) {
        var targetSlot = (game.enemy || []).findIndex(function(x) { return !x; });
        if (targetSlot < 0) {
          var minAtk = 999999, weakestIdx = -1;
          for (var ei = 0; ei < (game.enemy || []).length; ei++) {
            var em = game.enemy[ei];
            if (em && !isEgyptianGod(em.name || em[0])) {
              var emAtk = Number(em.atk || em[4] || 0);
              if (emAtk < minAtk) { minAtk = emAtk; weakestIdx = ei; }
            }
          }
          if (weakestIdx >= 0) {
            if (Array.isArray(game.enemyGrave)) game.enemyGrave.push(game.enemy[weakestIdx]);
            game.enemy[weakestIdx] = null;
            targetSlot = weakestIdx;
          }
        }

        if (targetSlot >= 0) {
          var godCard = hand.splice(godIdx, 1)[0];
          var summonedGod = (typeof window.mk === 'function' ? window.mk(godCard.name || godCard[0]) : null) || Object.assign({}, godCard, { atk: 5000, def: 5000, pos: 'ATK', faceUp: true });
          summonedGod.atk = 5000; summonedGod.def = 5000; summonedGod.pos = 'ATK'; summonedGod.faceUp = true;
          game.enemy[targetSlot] = summonedGod;
          var summonDialogue = {
            'marik': '¡Jajajaja! ¡Siente la furia divina! ¡El Dragón Alado de Ra desciende al campo de batalla con 5000 ATK!',
            'kaiba': '¡Ríndete! ¡Nadie puede desafiar mi poder absoluto! ¡Obelisk the Tormentor destruirá todo con 5000 ATK!',
            'seto': '¡Ríndete! ¡Nadie puede desafiar mi poder absoluto! ¡Obelisk the Tormentor destruirá todo con 5000 ATK!',
            'yugi': '¡El lazo con los dioses antiguos despierta! ¡' + (summonedGod.name || 'Dios Egipcio') + ' desciende al campo de batalla con 5000 ATK!'
          };
          var msg = summonDialogue[opp] || ('¡' + opp.toUpperCase() + ' invoca al Dios Egipcio ' + summonedGod.name + ' (5000 ATK / 5000 DEF) sin necesidad de tributos!');
          if (typeof log === 'function') log(msg);
          duelToast(msg);
          game._aiPlan108 = null;
          if (typeof render === 'function') render();
          return;
        }
      }
    }

    // A. Colocar Trampas en la fila trasera
    for (var h = game.enemyHand.length - 1; h >= 0; h--) {
      var c = game.enemyHand[h];
      if (c && (c.kind === 'TRAP' || c.type === 'Trap' || c.type === 'TRAP' || c.value === 'DUST_TORNADO' || c.name === 'Dust Tornado' || (c.value && String(c.value).includes('TRAP')))) {
        var backSlot = (game.enemyBack || []).findIndex(function(x) { return !x; });
        if (backSlot >= 0) {
          game.enemyHand.splice(h, 1);
          var curTurn = Number(game.turnNo || 1);
          game.enemyBack[backSlot] = Object.assign({}, c, {
            set: true,
            setSide: 'enemy',
            setTurn: curTurn,
            readyTurn: curTurn + 1,
            _setThisTurn: curTurn
          });
          if (typeof log === 'function') log('El rival coloca una Trampa boca abajo.');
        }
      }
    }

    // A2. IA Activa Dust Tornado si tiene una SET y lista (colocada en un turno anterior), y el jugador tiene cartas en su fila trasera
    for (var b = 0; b < (game.enemyBack || []).length; b++) {
      var bCard = game.enemyBack[b];
      if (!bCard || !bCard.set) continue;
      var curTurn = Number(game.turnNo || 1);
      if (bCard._setThisTurn === curTurn) continue;
      if (bCard.setSide === 'enemy' && bCard.setTurn === curTurn) continue;
      if (!isTrapReady(bCard)) continue;

      if (bCard.value === 'DUST_TORNADO' || bCard.name === 'Dust Tornado') {
        var pTargets = (game.playerBack || []).map(function(x, idx) { return x ? { card: x, index: idx } : null; }).filter(Boolean);
        if (pTargets.length > 0) {
          game.enemyBack[b] = null;
          game.enemyGrave.push(Object.assign({}, bCard, { set: false, faceUp: true }));
          var pTargetObj = pTargets[0];
          var pCardDestroyed = game.playerBack[pTargetObj.index];
          game.playerBack[pTargetObj.index] = null;
          game.grave.push(Object.assign({}, pCardDestroyed, { set: false, faceUp: true }));

          if (pCardDestroyed && (pCardDestroyed.kind === 'EQUIP' || pCardDestroyed.type === 'EQUIP' || (typeof isEquipSpell === 'function' && isEquipSpell(pCardDestroyed)))) {
            if (typeof stripEquip109 === 'function') try { stripEquip109('player', pCardDestroyed); } catch(_) {}
            else if (pCardDestroyed._targetMonster) {
              pCardDestroyed._targetMonster.equip = Math.max(0, (pCardDestroyed._targetMonster.equip || 0) - (pCardDestroyed._appliedAtk109 || 500));
            }
          }

          if (window.playDestroySound) window.playDestroySound();
          if (typeof cleanupOrphanedEquips === 'function') try { cleanupOrphanedEquips(); } catch(_) {}
          if (typeof render === 'function') render();
          var pCardName = pCardDestroyed.set ? 'tu carta SET' : (pCardDestroyed.name || 'tu carta de Magia/Trampa');
          duelToast('¡El rival activó Dust Tornado y destruyó ' + pCardName + '!');
          if (typeof log === 'function') log('¡El rival activa Dust Tornado y destruye ' + pCardName + '!');
          break;
        }
      }
    }

    var freeMonsterSlot = (game.enemy || []).findIndex(function(x) { return !x; });
    var fnFusion = typeof window.fusionResult === 'function' ? window.fusionResult : (typeof fusionResult === 'function' ? fusionResult : null);

    // B. FUSIONES DESDE LA MANO (IA FMR Forbidden Memories)
    if (freeMonsterSlot >= 0 && fnFusion && game.enemyHand.length >= 2) {
      var bestFusion = null;
      var bestAtk = -1;
      var matIdxA = -1, matIdxB = -1;

      for (var i = 0; i < game.enemyHand.length; i++) {
        var cardA = game.enemyHand[i];
        if (!cardA || isST(cardA)) continue;
        var nameA = cardA.name || cardA[0];

        for (var j = i + 1; j < game.enemyHand.length; j++) {
          var cardB = game.enemyHand[j];
          if (!cardB || isST(cardB)) continue;
          var nameB = cardB.name || cardB[0];

          var res = fnFusion([nameA, nameB]);
          if (res) {
            var tempMon = window.mk ? window.mk(res) : null;
            var fAtk = (tempMon && tempMon.atk) || 2000;
            if (fAtk > bestAtk) {
              bestAtk = fAtk;
              bestFusion = res;
              matIdxA = i;
              matIdxB = j;
            }
          }
        }
      }

      if (bestFusion && matIdxA >= 0 && matIdxB >= 0) {
        var idxs = [matIdxA, matIdxB].sort(function(a, b) { return b - a; });
        idxs.forEach(function(idx) {
          var m = game.enemyHand.splice(idx, 1)[0];
          if (m) game.enemyGrave.push(Object.assign({}, m, { set: false, faceUp: true }));
        });

        var fusedCard = window.mk(bestFusion) || { name: bestFusion, atk: bestAtk, def: 1800, pos: 'ATK', faceUp: true };
        fusedCard.pos = 'ATK';
        fusedCard.faceUp = true;
        game.enemy[freeMonsterSlot] = fusedCard;

        if (window.playFusionSound) window.playFusionSound();
        if (typeof log === 'function') log('¡FUSIÓN RIVAL! ' + (idxs.length) + ' cartas combinadas ➔ ' + bestFusion + ' (' + (fusedCard.atk || bestAtk) + ' ATK).');
        if (typeof duelToast === 'function') duelToast('¡FUSIÓN RIVAL: ' + bestFusion.toUpperCase() + '!');
        if (typeof render === 'function') render();
        if (typeof window.checkSummonTraps === 'function') window.checkSummonTraps(fusedCard, 'enemy', freeMonsterSlot);
        return;
      }
    }

    // C. FUSIÓN CAMPO + MANO RIVAL
    if (fnFusion && game.enemyHand.length >= 1) {
      for (var f = 0; f < (game.enemy || []).length; f++) {
        var fMon = game.enemy[f];
        if (!fMon) continue;
        var fName = fMon.name || fMon[0];

        for (var h = 0; h < game.enemyHand.length; h++) {
          var hCard = game.enemyHand[h];
          if (!hCard || isST(hCard)) continue;
          var hName = hCard.name || hCard[0];

          var resF = fnFusion([fName, hName]);
          if (resF) {
            var evolved = window.mk(resF);
            if (evolved && (evolved.atk || 0) >= (fMon.atk || 0)) {
              game.enemyHand.splice(h, 1);
              game.enemyGrave.push(fMon);
              game.enemyGrave.push(hCard);
              evolved.pos = 'ATK';
              evolved.faceUp = true;
              game.enemy[f] = evolved;
              if (window.playFusionSound) window.playFusionSound();
              if (typeof log === 'function') log('¡FUSIÓN CAMPO + MANO RIVAL! ' + fName + ' + ' + hName + ' ➔ ' + resF + ' (' + evolved.atk + ' ATK).');
              if (typeof duelToast === 'function') duelToast('¡FUSIÓN RIVAL: ' + resF.toUpperCase() + '!');
              if (typeof render === 'function') render();
              if (typeof window.checkSummonTraps === 'function') window.checkSummonTraps(evolved, 'enemy', f);
              return;
            }
          }
        }
      }
    }

    // D. EQUIPAR CARTAS DE MAGIA / EQUIPO
    for (var h = game.enemyHand.length - 1; h >= 0; h--) {
      var eq = game.enemyHand[h];
      if (eq && (eq.kind === 'EQUIP' || eq.type === 'EQUIP' || eq.value === 'EQUIP' || isEquipSpell(eq) || (eq.name && (eq.name.includes('Pendant') || eq.name.includes('Treasure') || eq.name.includes('Unicorn'))))) {
        var strongestTarget = null, sAtk = -1;
        (game.enemy || []).forEach(function(mon) {
          if (mon && (mon.atk || 0) > sAtk) {
            sAtk = mon.atk || 0;
            strongestTarget = mon;
          }
        });
        if (strongestTarget) {
          game.enemyHand.splice(h, 1);
          var token = strongestTarget._equipToken109 || ('EQM109-' + Date.now() + '-' + Math.random());
          strongestTarget._equipToken109 = token;
          var eqSlot = (game.enemyBack || []).findIndex(function(x) { return !x; });
          var boost = 500;
          if (eq.name === 'Axe of Despair' || eq.value === 'AXE_DESPAIR') boost = 1000;
          else if (eq.name === 'Horn of the Unicorn' || eq.value === 'HORN_UNICORN') boost = 700;
          else if (eq.name === 'United We Stand' || eq.value === 'UNITED_WE_STAND') boost = 800;

          if (eqSlot >= 0) {
            game.enemyBack[eqSlot] = Object.assign({}, eq, {
              kind: 'EQUIP',
              type: 'EQUIP',
              set: false,
              faceUp: true,
              equipToken109: token,
              _targetMonster: strongestTarget,
              _appliedAtk109: boost,
              _appliedDef109: 0
            });
          } else {
            game.enemyGrave.push(eq);
          }

          strongestTarget.atk = (strongestTarget.atk || 0) + boost;
          strongestTarget.equip = (strongestTarget.equip || 0) + boost;
          if (typeof log === 'function') log('¡El rival activa ' + eq.name + ' y equipa a ' + strongestTarget.name + ' (+' + boost + ' ATK)!');
          if (typeof duelToast === 'function') duelToast('¡El rival equipó ' + eq.name + ' (+' + boost + ' ATK)!');
        }
      }
    }

    // E. INVOCACIÓN NORMAL INTELIGENTE, PRUDENTE Y AGRESIVA
    var openSlot = (game.enemy || []).findIndex(function(x) { return !x; });
    if (openSlot >= 0 && game.enemyHand.length > 0) {
      var monsters = game.enemyHand.filter(function(c) {
        if (!c || isST(c)) return false;
        var cName = c.name || c[0] || '';
        if (typeof isEgyptianGod === 'function' && isEgyptianGod(cName)) {
          if (isGodBoss) return true; // Yugi, Kaiba y Marik no necesitan tributos
          var tributesAvailable = (game.enemy || []).filter(Boolean).length;
          if (tributesAvailable < 3) return false;
        }
        return true;
      });

      if (monsters.length > 0) {
        // Ordenar por ATK real descendente
        monsters.sort(function(a, b) {
          var aStats = getCardStats(a);
          var bStats = getCardStats(b);
          return (bStats.atk || 0) - (aStats.atk || 0);
        });

        var best = monsters[0];
        var idx = game.enemyHand.indexOf(best);
        game.enemyHand.splice(idx, 1);

        var summoned = (typeof window.mk === 'function' ? window.mk(best.name || best[0]) : null) || {
          name: best.name || best[0],
          atk: best.atk || best[4] || 0,
          def: best.def || best[5] || 0,
          pos: 'ATK',
          faceUp: true
        };

        var bestStats = getCardStats(summoned);
        var sAtk = Number(bestStats.atk || 0);
        var sDef = Number(bestStats.def || 0);

        // Evaluar amenazas del jugador para decidir posición
        var playerMonsters = (game.field || []).filter(Boolean);
        var playerMaxAtk = 0;
        var canBeatAnyTarget = false;

        playerMonsters.forEach(function(pm) {
          var patk = typeof effectiveAtk === 'function' ? effectiveAtk(pm) : (pm.atk || 0);
          if (patk > playerMaxAtk) playerMaxAtk = patk;
          if (pm.pos === 'ATK' && sAtk > patk) canBeatAnyTarget = true;
          else if (pm.pos === 'DEF' && sAtk > Number(pm.def || pm.tempDefense || 0)) canBeatAnyTarget = true;
        });

        if (playerMonsters.length === 0) {
          // Campo jugador vacío: atacar directamente a menos que sea extremadamente débil
          if (sAtk >= 1000 || sAtk >= sDef) {
            summoned.pos = 'ATK';
          } else {
            summoned.pos = 'DEF';
          }
        } else {
          // El jugador tiene monstruos en campo:
          // Si el monstruo invocado supera al más fuerte o puede destruir al menos a uno:
          if (sAtk >= playerMaxAtk || canBeatAnyTarget) {
            summoned.pos = 'ATK'; // Agresivo: busca combate
          } else {
            // Prudente: El jugador tiene monstruos superiores (ej. Crimson Sunbird 3000 ATK > sAtk)
            // ¡NUNCA exponer un monstruo débil en ATAQUE ante atacantes superiores!
            summoned.pos = 'DEF';
          }
        }

        summoned.faceUp = true;
        game.enemy[openSlot] = summoned;
        if (window.playSummonSound) window.playSummonSound();
        if (typeof log === 'function') log('El rival invoca a ' + (summoned.name || 'un monstruo') + ' en ' + (summoned.pos === 'ATK' ? 'ATAQUE' : 'DEFENSA') + ' (' + sAtk + ' ATK / ' + sDef + ' DEF).');
        if (typeof render === 'function') render();
        if (typeof window.checkSummonTraps === 'function') window.checkSummonTraps(summoned, 'enemy', openSlot);
      }
    }
  };
  try { aiHandSummonOrSet = window.aiHandSummonOrSet; } catch(_) {}

  // Battle Trap Selection Prompt System
  function getPlayerBattleTraps() {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g || !g.playerBack) return [];
    var list = [];
    for (var i = 0; i < g.playerBack.length; i++) {
      var c = g.playerBack[i];
      if (!c || !c.set) continue;
      if (typeof isTrapReady === 'function' && !isTrapReady(c)) continue;

      var val = c.value || '';
      var name = c.name || '';
      var trapType = null;
      var trapDesc = '';

      var valUpper = String(val || '').toUpperCase();
      var normLower = String(name || '').toLowerCase().trim();

      if (valUpper === 'CRUSH_CARD_VIRUS' || normLower === 'crush card virus' || normLower === 'crush card') {
        trapType = 'CRUSH_CARD_VIRUS';
        trapDesc = 'Destruye todos los monstruos en el campo rival.';
      } else if (valUpper === 'NEGATE_ATTACK' || normLower === 'negate attack' || normLower === 'negar el ataque') {
        trapType = 'NEGATE_ATTACK';
        trapDesc = 'Niega el ataque y termina la Battle Phase rival.';
      } else if (valUpper === 'WABOKU' || normLower === 'waboku') {
        if (!g._wabokuActiveThisTurn) {
          trapType = 'WABOKU';
          trapDesc = 'Tus monstruos y LP no reciben daño de batalla este turno.';
        }
      } else if (val === 'MIRROR_FORCE' || name === 'Mirror Force') {
        trapType = 'MIRROR_FORCE';
        trapDesc = 'Destruye todos los monstruos rivales en modo de Ataque.';
      } else if (val === 'SAKURETSU_ARMOR' || name === 'Sakuretsu Armor') {
        trapType = 'SAKURETSU_ARMOR';
        trapDesc = 'Destruye al atacante e interrumpe su combate.';
      } else if (val === 'MAGIC_CYLINDER' || name === 'Magic Cylinder') {
        trapType = 'MAGIC_CYLINDER';
        trapDesc = 'Niega el ataque y refleja el daño de ATK directamente al rival.';
      } else if (val === 'WIDESPREAD_RUIN' || name === 'Widespread Ruin') {
        trapType = 'WIDESPREAD_RUIN';
        trapDesc = 'Destruye al monstruo rival en modo de Ataque con mayor ATK.';
      } else if (val === 'EATGABOON' || name === 'Eatgaboon') {
        trapType = 'EATGABOON';
        trapDesc = 'Destruye al monstruo atacante si su ATK es 1000 o menor.';
      } else if (val === 'BEAR_TRAP' || name === 'Bear Trap') {
        trapType = 'BEAR_TRAP';
        trapDesc = 'Destruye al monstruo atacante si su ATK es 1500 o menor.';
      } else if (val === 'INVISIBLE_WIRE' || name === 'Invisible Wire') {
        trapType = 'INVISIBLE_WIRE';
        trapDesc = 'Destruye al monstruo atacante si su ATK es 2000 o menor.';
      } else if (val === 'ACID_TRAP_HOLE' || name === 'Acid Trap Hole') {
        trapType = 'ACID_TRAP_HOLE';
        trapDesc = 'Disuelve y destruye de inmediato al monstruo atacante.';
      } else if (val === 'GOBLIN_FAN' || name === 'Goblin Fan') {
        trapType = 'GOBLIN_FAN';
        trapDesc = 'Niega el ataque enemigo y causa 500 LP de daño al rival.';
      } else if (val === 'BAD_REACTION_TO_SIMOCHI' || name === 'Bad Reaction to Simochi') {
        trapType = 'BAD_REACTION_TO_SIMOCHI';
        trapDesc = 'Causa 1000 LP de daño al rival y debilita al atacante en 1000 ATK.';
      } else if (val === 'REVERSE_TRAP' || name === 'Reverse Trap') {
        trapType = 'REVERSE_TRAP';
        trapDesc = 'Invierte el combate otorgando +1000 ATK de sorpresa a tu defensa.';
      } else if (val === 'FAKE_TRAP' || name === 'Fake Trap') {
        trapType = 'FAKE_TRAP';
        trapDesc = 'Señuelo que absorbe y niega por completo el ataque enemigo.';
      }

      if (trapType) {
        list.push({
          index: i,
          card: c,
          type: trapType,
          name: name || c.name || trapType,
          desc: trapDesc
        });
      }
    }
    return list;
  }
  window.getPlayerBattleTraps = getPlayerBattleTraps;

  function promptPlayerBattleTrap(attackerCard, readyTraps) {
    return new Promise(function(resolve) {
      if (!readyTraps || readyTraps.length === 0) {
        return resolve(null);
      }

      var existing = document.getElementById('battleTrapModal');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

      var atkName = (attackerCard && (attackerCard.name || attackerCard[0])) || 'Monstruo Rival';
      var atkPower = (typeof effectiveAtk === 'function' ? effectiveAtk(attackerCard) : (attackerCard && attackerCard.atk)) || 0;

      var overlay = document.createElement('div');
      overlay.id = 'battleTrapModal';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:14px;backdrop-filter:blur(4px);';

      var box = document.createElement('div');
      box.style.cssText = 'background:linear-gradient(150deg,#1c152a 0%,#0c0f18 100%);border:2.5px solid #d500f9;border-radius:12px;box-shadow:0 0 30px rgba(213,0,249,0.5), inset 0 0 15px rgba(213,0,249,0.2);width:100%;max-width:390px;padding:16px;color:#fff;text-align:center;font-family:sans-serif;box-sizing:border-box;';

      var header = document.createElement('div');
      header.style.cssText = 'font-size:11px;font-weight:900;color:#ff5252;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;';
      header.textContent = '⚔️ ¡DECLARACIÓN DE ATAQUE RIVAL!';
      box.appendChild(header);

      var title = document.createElement('div');
      title.style.cssText = 'font-size:15px;font-weight:bold;color:#ffe57f;margin-bottom:4px;';
      title.textContent = atkName + ' (' + atkPower + ' ATK)';
      box.appendChild(title);

      var sub = document.createElement('div');
      sub.style.cssText = 'font-size:12px;color:#bbb;margin-bottom:14px;';
      sub.textContent = '¿Deseas activar una Carta Trampa de respuesta?';
      box.appendChild(sub);

      var listCont = document.createElement('div');
      listCont.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-bottom:12px;max-height:55vh;overflow-y:auto;';

      function cleanup(choice) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        window._activeTrapPromptResolve = null;
        resolve(choice);
      }
      window._activeTrapPromptResolve = cleanup;

      readyTraps.forEach(function(trapItem) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = 'width:100%;padding:10px 12px;background:linear-gradient(135deg,#7b1fa2 0%,#4a148c 100%);color:#fff;border:1.5px solid #ea80fc;border-radius:8px;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:2px;box-shadow:0 3px 10px rgba(0,0,0,0.6);';

        var btnTitle = document.createElement('span');
        btnTitle.style.cssText = 'font-size:13px;font-weight:900;color:#f3e5f5;letter-spacing:0.3px;';
        btnTitle.textContent = '🟣 Activar ' + trapItem.name;

        var btnDesc = document.createElement('span');
        btnDesc.style.cssText = 'font-size:11px;color:#e1bee7;opacity:0.92;line-height:1.25;';
        btnDesc.textContent = trapItem.desc;

        btn.appendChild(btnTitle);
        btn.appendChild(btnDesc);

        btn.onclick = function() { cleanup(trapItem); };
        listCont.appendChild(btn);
      });
      box.appendChild(listCont);

      var passBtn = document.createElement('button');
      passBtn.type = 'button';
      passBtn.style.cssText = 'width:100%;padding:10px 12px;background:#263238;color:#cfd8dc;border:1.5px solid #546e7a;border-radius:8px;font-size:12.5px;font-weight:bold;cursor:pointer;';
      passBtn.textContent = '❌ NO ACTIVAR NINGUNA';
      passBtn.onclick = function() { cleanup(null); };
      box.appendChild(passBtn);

      overlay.appendChild(box);
      document.body.appendChild(overlay);
    });
  }
  window.promptPlayerBattleTrap = promptPlayerBattleTrap;

  window.aiBattle = async function() {
    if (!game || game.turn !== 'enemy') return;

    if (game.first === 'enemy' && game.firstTurn) {
      if (typeof log === 'function') log('El rival inició el duelo y no puede atacar en su primer turno.');
      return;
    }

    if (game._threateningRoarActive) {
      if (game._threateningRoarTurn === game.turnNo) {
        game._threateningRoarActive = false;
        duelToast('Threatening Roar impide que el rival ataque este turno.');
        return;
      } else {
        game._threateningRoarActive = false;
      }
    }

    if (game._wabokuActiveThisTurn) {
      if (game._wabokuActiveTurn === game.turnNo) {
        (game.enemy || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
        duelToast('Waboku evitó el daño y protegió a tus monstruos este turno.');
        if (typeof log === 'function') log('Waboku protege tu campo: no hay daño ni destrucción.');
        if (typeof render === 'function') render();
        return;
      } else {
        game._wabokuActiveThisTurn = false;
        game._wabokuActiveTurn = null;
      }
    }

    // Swords of Revealing Light (Espadas de Luz Reveladora)
    var sRevealing = (typeof findSwords109 === 'function') ? findSwords109('player') : null;
    if (!sRevealing && game.playerBack) {
      var sIdx = game.playerBack.findIndex(function(c) {
        return c && !c.set && (c.value === 'SWORDS' || c.value === 'SWORDS_REVEALING' || c.name === 'Swords of Revealing Light') && Number(c.turns109 || 0) > 0;
      });
      if (sIdx >= 0) sRevealing = { card: game.playerBack[sIdx], index: sIdx };
    }
    if (sRevealing) {
      if (typeof tickSwords109 === 'function') {
        tickSwords109('player');
      } else {
        sRevealing.card.turns109 = Math.max(0, Number(sRevealing.card.turns109 || 0) - 1);
        if (sRevealing.card.turns109 <= 0) {
          game.playerBack[sRevealing.index] = null;
          sRevealing.card.set = false; sRevealing.card.faceUp = true;
          game.grave.push(sRevealing.card);
          if (typeof log === 'function') log('Swords of Revealing Light expira y va al Cementerio.');
        }
      }
      duelToast('Swords of Revealing Light impide los ataques del rival.');
      if (typeof render === 'function') render();
      return;
    }

    var trapTriggeredThisTurn = false;

    // Iterar sobre TODOS los monstruos del rival para evaluar ataques prudentes y agresivos
    for (var ei = 0; ei < (game.enemy || []).length; ei++) {
      if (!game.enemy || game.elp <= 0 || game.plp <= 0) break;
      var e = game.enemy[ei];
      if (!e) continue;
      if (e.attackedTurn === game.turnNo) continue;

      var attackerIsGod = isEgyptianGod(e.name || e[0]);
      var currentEffectiveAtk = typeof effectiveAtk === 'function' ? effectiveAtk(e) : (e.atk || 0);
      var playerHasConcealing = (typeof getActiveConcealingSwords === 'function') ? !!getActiveConcealingSwords('player') : false;

      // Si el monstruo está boca abajo o en defensa forzada por Swords of Concealing Light, no puede atacar
      if (e.faceDown || e.faceDownSet103 || (playerHasConcealing && e.pos === 'DEF')) {
        continue;
      }

      var remainingPlayerMonsters = (game.field || []).map(function(c, idx) { return c ? { c: c, idx: idx } : null; }).filter(Boolean);

      // CASO 1: ATAQUE DIRECTO (El jugador NO tiene monstruos en el campo)
      if (remainingPlayerMonsters.length === 0) {
        // En ataque directo el rival es agresivo al 100%
        if (!playerHasConcealing && e.pos !== 'ATK' && e.kind !== 'LINK') {
          e.pos = 'ATK';
          if (typeof log === 'function') log(e.name + ' pasa a posición de ATAQUE para embestir directamente.');
        }

        // Verificar trampas de respuesta del jugador
        var readyBattleTraps = getPlayerBattleTraps();
        if (readyBattleTraps.length > 0) {
          var trapPrompt = (typeof window.promptPlayerBattleTrap === 'function') ? window.promptPlayerBattleTrap : promptPlayerBattleTrap;
          var chosenTrap = await trapPrompt(e, readyBattleTraps);
          if (chosenTrap) {
            var tIdx = chosenTrap.index;
            var tCard = game.playerBack[tIdx];
            game.playerBack[tIdx] = null;
            game.grave.push(Object.assign({}, tCard, { set: false, faceUp: true }));

            if (chosenTrap.type === 'CRUSH_CARD_VIRUS') {
              var eDestroyed = 0;
              for (var ek = 0; ek < (game.enemy || []).length; ek++) {
                var em = game.enemy[ek];
                if (em) {
                  if (isEgyptianGod(em.name || em[0])) continue;
                  game.enemyGrave.push(em);
                  game.enemy[ek] = null;
                  eDestroyed++;
                }
              }
              if (window.playDestroySound) window.playDestroySound();
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Crush Card Virus', 'Destruye ' + eDestroyed + ' monstruos en el campo rival.');
              duelToast('¡Crush Card Virus activado! Destruye ' + eDestroyed + ' monstruo(s) rivales.');
              if (typeof log === 'function') log('¡Crush Card Virus! Destruye todos los monstruos en el campo rival (' + eDestroyed + ').');
              if (!attackerIsGod) continue;
            } else if (chosenTrap.type === 'NEGATE_ATTACK') {
              if (attackerIsGod) {
                duelToast('¡Negate Attack falla contra Dios Egipcio!');
                if (typeof log === 'function') log('¡Negate Attack no puede detener al Dios Egipcio ' + (e.name || 'Dios') + '!');
              } else {
                (game.enemy || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
                if (typeof window.showTrap114 === 'function') window.showTrap114('Negate Attack', '¡Ataque negado y Battle Phase rival terminada!');
                if (typeof render === 'function') render();
                duelToast('¡Negate Attack activado! Ataque negado y Battle Phase rival terminada.');
                if (typeof log === 'function') log('¡Negate Attack! Niega el ataque y termina la Battle Phase.');
                return;
              }
            } else if (chosenTrap.type === 'WABOKU') {
              game._wabokuActiveThisTurn = true;
              game._wabokuActiveTurn = game.turnNo;
              if (typeof window.showTrap114 === 'function') window.showTrap114('Waboku', '¡Tus monstruos y LP están protegidos contra daño de batalla este turno!');
              if (typeof render === 'function') render();
              duelToast('¡Waboku activado! Tus monstruos y LP están protegidos.');
              if (typeof log === 'function') log('¡Waboku activado! No habrá daño este turno, pero el rival continúa atacando.');
            } else if (chosenTrap.type === 'MIRROR_FORCE') {
              if (typeof window.showTrap114 === 'function') window.showTrap114('Mirror Force', '¡Destruye todos los monstruos en modo de Ataque del rival!');
              var destroyedCount = 0;
              for (var k = 0; k < (game.enemy || []).length; k++) {
                if (game.enemy[k] && (game.enemy[k].pos !== 'DEF' || game.enemy[k].kind === 'LINK')) {
                  if (isEgyptianGod(game.enemy[k].name || game.enemy[k][0])) continue;
                  game.enemyGrave.push(game.enemy[k]);
                  game.enemy[k] = null;
                  destroyedCount++;
                }
              }
              if (window.playDestroySound) window.playDestroySound();
              if (typeof render === 'function') render();
              duelToast('¡Mirror Force destruyó ' + destroyedCount + ' monstruo(s) atacantes!');
              if (typeof log === 'function') log('¡Mirror Force! Destruye ' + destroyedCount + ' monstruos atacantes del rival.');
              if (!attackerIsGod && !game.enemy[ei]) continue;
            } else if (chosenTrap.type === 'SAKURETSU_ARMOR') {
              if (attackerIsGod) {
                duelToast('¡Sakuretsu Armor falla contra Dios Egipcio!');
              } else {
                game.enemy[ei] = null;
                game.enemyGrave.push(e);
                e.attackedTurn = game.turnNo;
                if (window.playDestroySound) window.playDestroySound();
                if (typeof render === 'function') render();
                duelToast('¡Sakuretsu Armor destruyó a ' + (e.name || 'el atacante') + '!');
                if (typeof log === 'function') log('¡Sakuretsu Armor! Destruye al atacante ' + (e.name || 'el atacante') + '. Tu monstruo y LP quedan a salvo.');
                continue;
              }
            } else if (chosenTrap.type === 'MAGIC_CYLINDER') {
              if (attackerIsGod) {
                duelToast('¡Magic Cylinder falla contra Dios Egipcio!');
              } else {
                var dmgCyl = Number(currentEffectiveAtk || 0);
                game.elp = Math.max(0, game.elp - dmgCyl);
                e.attackedTurn = game.turnNo;
                if (typeof render === 'function') render();
                duelToast('¡Magic Cylinder! Ataque negado y ' + dmgCyl + ' de daño al rival.');
                if (typeof log === 'function') log('¡Magic Cylinder! Ataque negado y refleja ' + dmgCyl + ' LP de daño al rival.');
                continue;
              }
            } else if (chosenTrap.type === 'WIDESPREAD_RUIN') {
              var highAtk = -1, highIdx = -1;
              for (var wk = 0; wk < (game.enemy || []).length; wk++) {
                var wem = game.enemy[wk];
                if (wem && (wem.pos !== 'DEF' || wem.kind === 'LINK')) {
                  if (isEgyptianGod(wem.name || wem[0])) continue;
                  var curAtk = typeof effectiveAtk === 'function' ? effectiveAtk(wem) : (wem.atk || 0);
                  if (curAtk > highAtk) {
                    highAtk = curAtk;
                    highIdx = wk;
                  }
                }
              }
              if (highIdx >= 0) {
                var killedM = game.enemy[highIdx];
                game.enemyGrave.push(killedM);
                game.enemy[highIdx] = null;
                if (window.playDestroySound) window.playDestroySound();
                if (typeof render === 'function') render();
                if (typeof window.showTrap114 === 'function') window.showTrap114('Widespread Ruin', '¡Destruye a ' + (killedM.name || 'monstruo') + ' (' + highAtk + ' ATK)!');
                duelToast('¡Widespread Ruin destruyó a ' + (killedM.name || 'monstruo') + ' (' + highAtk + ' ATK)!');
                if (typeof log === 'function') log('¡Widespread Ruin! Destruye al monstruo con mayor ATK del rival: ' + (killedM.name || 'monstruo') + '.');
                if (highIdx === ei) continue;
              } else {
                duelToast('¡Widespread Ruin activado, pero no hay objetivos en ataque!');
              }
            } else if (chosenTrap.type === 'ACID_TRAP_HOLE') {
              if (attackerIsGod) {
                duelToast('¡Acid Trap Hole falla contra Dios Egipcio!');
              } else {
                game.enemy[ei] = null;
                game.enemyGrave.push(e);
                e.attackedTurn = game.turnNo;
                if (window.playDestroySound) window.playDestroySound();
                if (typeof render === 'function') render();
                if (typeof window.showTrap114 === 'function') window.showTrap114('Acid Trap Hole', '¡Disuelve y destruye al atacante!');
                duelToast('¡Acid Trap Hole disolvió y destruyó a ' + (e.name || 'el atacante') + '!');
                if (typeof log === 'function') log('¡Acid Trap Hole! Disuelve en ácido a ' + (e.name || 'el atacante') + '.');
                continue;
              }
            } else if (chosenTrap.type === 'EATGABOON') {
              if (attackerIsGod) {
                duelToast('¡Eatgaboon falla contra Dios Egipcio!');
              } else if (currentEffectiveAtk <= 1000) {
                game.enemy[ei] = null;
                game.enemyGrave.push(e);
                e.attackedTurn = game.turnNo;
                if (window.playDestroySound) window.playDestroySound();
                if (typeof render === 'function') render();
                if (typeof window.showTrap114 === 'function') window.showTrap114('Eatgaboon', '¡Devora al atacante!');
                duelToast('¡Eatgaboon devoró y destruyó a ' + (e.name || 'el atacante') + '!');
                if (typeof log === 'function') log('¡Eatgaboon! Devora y destruye a ' + (e.name || 'el atacante') + ' (' + currentEffectiveAtk + ' ATK).');
                continue;
              } else {
                duelToast('¡Eatgaboon activado, pero el atacante tiene más de 1000 ATK!');
                if (typeof log === 'function') log('¡Eatgaboon falla! El atacante supera los 1000 ATK (' + currentEffectiveAtk + ' ATK).');
              }
            } else if (chosenTrap.type === 'BEAR_TRAP') {
              if (attackerIsGod) {
                duelToast('¡Bear Trap falla contra Dios Egipcio!');
              } else if (currentEffectiveAtk <= 1500) {
                game.enemy[ei] = null;
                game.enemyGrave.push(e);
                e.attackedTurn = game.turnNo;
                if (window.playDestroySound) window.playDestroySound();
                if (typeof render === 'function') render();
                if (typeof window.showTrap114 === 'function') window.showTrap114('Bear Trap', '¡Atrapa y destruye al atacante!');
                duelToast('¡Bear Trap atrapó y destruyó a ' + (e.name || 'el atacante') + '!');
                if (typeof log === 'function') log('¡Bear Trap! Atrapa y destruye a ' + (e.name || 'el atacante') + ' (' + currentEffectiveAtk + ' ATK).');
                continue;
              } else {
                duelToast('¡Bear Trap activada, pero el atacante tiene más de 1500 ATK!');
                if (typeof log === 'function') log('¡Bear Trap falla! El atacante supera los 1500 ATK (' + currentEffectiveAtk + ' ATK).');
              }
            } else if (chosenTrap.type === 'INVISIBLE_WIRE') {
              if (attackerIsGod) {
                duelToast('¡Invisible Wire falla contra Dios Egipcio!');
              } else if (currentEffectiveAtk <= 2000) {
                game.enemy[ei] = null;
                game.enemyGrave.push(e);
                e.attackedTurn = game.turnNo;
                if (window.playDestroySound) window.playDestroySound();
                if (typeof render === 'function') render();
                if (typeof window.showTrap114 === 'function') window.showTrap114('Invisible Wire', '¡Corta y destruye al atacante!');
                duelToast('¡Invisible Wire rebanó y destruyó a ' + (e.name || 'el atacante') + '!');
                if (typeof log === 'function') log('¡Invisible Wire! Corta y destruye a ' + (e.name || 'el atacante') + ' (' + currentEffectiveAtk + ' ATK).');
                continue;
              } else {
                duelToast('¡Invisible Wire activado, pero el atacante tiene más de 2000 ATK!');
                if (typeof log === 'function') log('¡Invisible Wire falla! El atacante supera los 2000 ATK (' + currentEffectiveAtk + ' ATK).');
              }
            } else if (chosenTrap.type === 'GOBLIN_FAN') {
              if (attackerIsGod) {
                duelToast('¡Goblin Fan falla contra Dios Egipcio!');
              } else {
                e.attackedTurn = game.turnNo;
                game.elp = Math.max(0, game.elp - 500);
                if (typeof render === 'function') render();
                if (typeof window.showTrap114 === 'function') window.showTrap114('Goblin Fan', '¡Ataque cancelado y 500 LP de daño al rival!');
                duelToast('¡Goblin Fan canceló el ataque y causó 500 LP de daño al rival!');
                if (typeof log === 'function') log('¡Goblin Fan! Anula el ataque de ' + (e.name || 'el atacante') + ' y causa 500 LP de daño directo.');
                continue;
              }
            } else if (chosenTrap.type === 'FAKE_TRAP') {
              e.attackedTurn = game.turnNo;
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Fake Trap', '¡Ataque absorbido por el señuelo!');
              duelToast('¡Fake Trap absorbió y anuló el ataque enemigo por completo!');
              if (typeof log === 'function') log('¡Fake Trap! Actúa como señuelo absorbiendo todo el impacto del ataque.');
              continue;
            } else if (chosenTrap.type === 'BAD_REACTION_TO_SIMOCHI') {
              game.elp = Math.max(0, game.elp - 1000);
              e.tempBoost = (e.tempBoost || 0) - 1000;
              currentEffectiveAtk = Math.max(0, currentEffectiveAtk - 1000);
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Bad Reaction to Simochi', '¡1000 LP de daño y -1000 ATK al atacante!');
              duelToast('¡Bad Reaction to Simochi causa 1000 LP de daño y reduce el ATK rival en -1000!');
              if (typeof log === 'function') log('¡Bad Reaction to Simochi! Causa 1000 LP de daño y reduce el ATK de ' + (e.name || 'atacante') + ' en -1000.');
            } else if (chosenTrap.type === 'REVERSE_TRAP') {
              if (typeof bestTarget !== 'undefined' && bestTarget && bestTarget.c) {
                bestTarget.c.tempBoost = (bestTarget.c.tempBoost || 0) + 1000;
              }
              currentEffectiveAtk = Math.max(0, currentEffectiveAtk - 1000);
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Reverse Trap', '¡+1000 ATK a tu defensa e invierte la fuerza!');
              duelToast('¡Reverse Trap otorga +1000 ATK de sorpresa a tu defensa!');
              if (typeof log === 'function') log('¡Reverse Trap! Invierte el combate otorgando +1000 ATK defensivo de sorpresa.');
            }
          }
        }

        if (!game.enemy[ei]) continue;

        var directDmg = currentEffectiveAtk;
        if (!game._wabokuActiveThisTurn) {
          game.plp = Math.max(0, game.plp - directDmg);
          if (typeof log === 'function') log('¡ATAQUE DIRECTO RIVAL! ' + e.name + ' causa ' + directDmg + ' LP de daño.');
          duelToast('¡ATAQUE DIRECTO RIVAL! ' + e.name + ' (-' + directDmg + ' LP)');
          if (window.playDestroySound) window.playDestroySound();
        } else {
          if (typeof log === 'function') log('¡Ataque directo de ' + e.name + ' bloqueado por Waboku!');
        }
        e.attackedTurn = game.turnNo;
        if (typeof render === 'function') render();
        if (game.plp <= 0) break;
        continue;
      }

      // CASO 2: EL JUGADOR TIENE MONSTRUOS EN EL CAMPO -> EVALUACIÓN PRUDENTE Y AGRESIVA
      var favorableTargets = [];

      for (var t = 0; t < remainingPlayerMonsters.length; t++) {
        var targetObj = remainingPlayerMonsters[t];
        var targetCard = targetObj.c;
        var isSet = !!(targetCard.faceDownSet103 || targetCard.faceDown);

        var aiBonus = 0, plBonus = 0;
        if (typeof getSignCombatRelation === 'function') {
          var relCombat = getSignCombatRelation(e, targetCard);
          if (relCombat === 'adv') aiBonus = 500;
          else if (relCombat === 'disadv') plBonus = 500;
        }

        var effectiveAttackerPower = currentEffectiveAtk + aiBonus;
        var tAtk = (typeof effectiveAtk === 'function' ? effectiveAtk(targetCard) : (targetCard.atk || 0)) + plBonus;
        var tDef = (targetCard.def || 0) + (targetCard.tempDefense || 0) + (targetCard.tempBoostDef || 0) + plBonus;

        var score = -1;

        if (isSet) {
          // Carta set (boca abajo): prudente atacar solo con monstruos con ATK decente (>= 1100)
          if (effectiveAttackerPower >= 1400) {
            score = 8000 + effectiveAttackerPower;
          } else if (effectiveAttackerPower >= 1000) {
            score = 4000 + effectiveAttackerPower;
          } else {
            score = -1; // Muy arriesgado atacar boca abajo con monstruo débil
          }
        } else if (targetCard.pos === 'ATK') {
          if (effectiveAttackerPower > tAtk) {
            // ¡OBJETIVO PRIORITARIO MÁXIMO! Destruye al enemigo e inflige daño a los LP
            score = 10000 + (effectiveAttackerPower - tAtk) * 2;
          } else if (effectiveAttackerPower === tAtk) {
            // Empate de ataque: intercambio viable si el monstruo tiene buen ATK
            if (effectiveAttackerPower >= 1500) {
              score = 3000;
            } else {
              score = 1500;
            }
          } else {
            // Monstruo enemigo es MÁS FUERTE: ¡NUNCA ATACAR DE MANERA SUICIDA!
            score = -1;
          }
        } else {
          // Monstruo boca arriba en DEFENSA
          if (effectiveAttackerPower > tDef) {
            // Destruye limpiamente la defensa sin recibir daño de retroceso
            score = 7000 + (effectiveAttackerPower - tDef);
          } else {
            // No supera la defensa rival (rebotaría o recibiría daño): ¡NUNCA ATACAR!
            score = -1;
          }
        }

        if (score > 0) {
          favorableTargets.push({ target: targetObj, score: score });
        }
      }

      // SI NO HAY NINGÚN OBJETIVO FAVORABLE:
      // El monstruo rival es más débil que los monstruos del jugador o no puede destruir a ninguno favorablemente.
      // Debe ser PRUDENTE: NO ATACAR y ponerse en DEFENSA para evitar recibir daño a los LP.
      if (favorableTargets.length === 0) {
        if (!playerHasConcealing && e.kind !== 'LINK') {
          if (e.pos !== 'DEF') {
            e.pos = 'DEF';
            if (typeof log === 'function') log(e.name + ' adopta una postura defensiva prudente ante monstruos superiores.');
          } else {
            if (typeof log === 'function') log(e.name + ' evalúa el campo con prudencia y se mantiene en defensa.');
          }
        } else {
          if (typeof log === 'function') log(e.name + ' evalúa el campo con prudencia y prefiere no atacar.');
        }
        e.attackedTurn = game.turnNo;
        if (typeof render === 'function') render();
        continue; // Pasa al siguiente monstruo sin inmolarse
      }

      // ORDENAR OBJETIVOS FAVORABLES POR PUNTAJE DESCENDENTE Y ATACAR AL MEJOR
      favorableTargets.sort(function(a, b) { return b.score - a.score; });
      var bestTarget = favorableTargets[0].target;

      // Para atacar, ponerse en posición de ATAQUE
      if (!playerHasConcealing && e.pos !== 'ATK' && e.kind !== 'LINK') {
        e.pos = 'ATK';
        if (typeof log === 'function') log(e.name + ' pasa a posición de ATAQUE para arremeter con ventaja.');
      }

      // VERIFICACIÓN DE TRAMPAS DE RESPUESTA ANTE EL ATAQUE VÁLIDO CON SELECTOR INTERACTIVO
      var readyBattleTraps = getPlayerBattleTraps();
      if (readyBattleTraps.length > 0) {
        var trapPrompt = (typeof window.promptPlayerBattleTrap === 'function') ? window.promptPlayerBattleTrap : promptPlayerBattleTrap;
        var chosenTrap = await trapPrompt(e, readyBattleTraps);
        if (chosenTrap) {
          var tIdx = chosenTrap.index;
          var tCard = game.playerBack[tIdx];
          game.playerBack[tIdx] = null;
          game.grave.push(Object.assign({}, tCard, { set: false, faceUp: true }));

          if (chosenTrap.type === 'CRUSH_CARD_VIRUS') {
            var eDestroyed = 0;
            for (var ek = 0; ek < (game.enemy || []).length; ek++) {
              var em = game.enemy[ek];
              if (em) {
                if (isEgyptianGod(em.name || em[0])) continue;
                game.enemyGrave.push(em);
                game.enemy[ek] = null;
                eDestroyed++;
              }
            }
            if (window.playDestroySound) window.playDestroySound();
            if (typeof render === 'function') render();
            if (typeof window.showTrap114 === 'function') window.showTrap114('Crush Card Virus', 'Destruye ' + eDestroyed + ' monstruos en el campo rival.');
            duelToast('¡Crush Card Virus activado! Destruye ' + eDestroyed + ' monstruo(s) rivales.');
            if (typeof log === 'function') log('¡Crush Card Virus! Destruye todos los monstruos en el campo rival (' + eDestroyed + ').');
            if (!attackerIsGod) continue;
          } else if (chosenTrap.type === 'NEGATE_ATTACK') {
            if (attackerIsGod) {
              duelToast('¡Negate Attack falla contra Dios Egipcio!');
              if (typeof log === 'function') log('¡Negate Attack no puede detener al Dios Egipcio ' + (e.name || 'Dios') + '!');
            } else {
              (game.enemy || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
              if (typeof window.showTrap114 === 'function') window.showTrap114('Negate Attack', '¡Ataque negado y Battle Phase rival terminada!');
              if (typeof render === 'function') render();
              duelToast('¡Negate Attack activado! Ataque negado y Battle Phase rival terminada.');
              if (typeof log === 'function') log('¡Negate Attack! Niega el ataque y termina la Battle Phase.');
              return;
            }
          } else if (chosenTrap.type === 'WABOKU') {
            game._wabokuActiveThisTurn = true;
            game._wabokuActiveTurn = game.turnNo;
            if (typeof window.showTrap114 === 'function') window.showTrap114('Waboku', '¡Tus monstruos y LP están protegidos contra daño de batalla este turno!');
            if (typeof render === 'function') render();
            duelToast('¡Waboku activado! Tus monstruos y LP están protegidos.');
            if (typeof log === 'function') log('¡Waboku activado! No habrá daño este turno, pero el rival continúa atacando.');
          } else if (chosenTrap.type === 'MIRROR_FORCE') {
            if (typeof window.showTrap114 === 'function') window.showTrap114('Mirror Force', '¡Destruye todos los monstruos en modo de Ataque del rival!');
            var destroyedCount = 0;
            for (var k = 0; k < (game.enemy || []).length; k++) {
              if (game.enemy[k] && (game.enemy[k].pos !== 'DEF' || game.enemy[k].kind === 'LINK')) {
                if (isEgyptianGod(game.enemy[k].name || game.enemy[k][0])) continue;
                game.enemyGrave.push(game.enemy[k]);
                game.enemy[k] = null;
                destroyedCount++;
              }
            }
            if (window.playDestroySound) window.playDestroySound();
            if (typeof render === 'function') render();
            duelToast('¡Mirror Force destruyó ' + destroyedCount + ' monstruo(s) atacantes!');
            if (typeof log === 'function') log('¡Mirror Force! Destruye ' + destroyedCount + ' monstruos atacantes del rival.');
            if (!attackerIsGod && !game.enemy[ei]) continue;
          } else if (chosenTrap.type === 'SAKURETSU_ARMOR') {
            if (attackerIsGod) {
              duelToast('¡Sakuretsu Armor falla contra Dios Egipcio!');
            } else {
              game.enemy[ei] = null;
              game.enemyGrave.push(e);
              e.attackedTurn = game.turnNo;
              if (window.playDestroySound) window.playDestroySound();
              if (typeof render === 'function') render();
              duelToast('¡Sakuretsu Armor destruyó a ' + (e.name || 'el atacante') + '!');
              if (typeof log === 'function') log('¡Sakuretsu Armor! Destruye al atacante ' + (e.name || 'el atacante') + '. Tu monstruo y LP quedan a salvo.');
              continue;
            }
          } else if (chosenTrap.type === 'MAGIC_CYLINDER') {
            if (attackerIsGod) {
              duelToast('¡Magic Cylinder falla contra Dios Egipcio!');
            } else {
              var dmgCyl = Number(currentEffectiveAtk || 0);
              game.elp = Math.max(0, game.elp - dmgCyl);
              e.attackedTurn = game.turnNo;
              if (typeof render === 'function') render();
              duelToast('¡Magic Cylinder! Ataque negado y ' + dmgCyl + ' de daño al rival.');
              if (typeof log === 'function') log('¡Magic Cylinder! Ataque negado y refleja ' + dmgCyl + ' LP de daño al rival.');
              continue;
            }
          } else if (chosenTrap.type === 'WIDESPREAD_RUIN') {
            var highAtk = -1, highIdx = -1;
            for (var wk = 0; wk < (game.enemy || []).length; wk++) {
              var wem = game.enemy[wk];
              if (wem && (wem.pos !== 'DEF' || wem.kind === 'LINK')) {
                if (isEgyptianGod(wem.name || wem[0])) continue;
                var curAtk = typeof effectiveAtk === 'function' ? effectiveAtk(wem) : (wem.atk || 0);
                if (curAtk > highAtk) {
                  highAtk = curAtk;
                  highIdx = wk;
                }
              }
            }
            if (highIdx >= 0) {
              var killedM = game.enemy[highIdx];
              game.enemyGrave.push(killedM);
              game.enemy[highIdx] = null;
              if (window.playDestroySound) window.playDestroySound();
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Widespread Ruin', '¡Destruye a ' + (killedM.name || 'monstruo') + ' (' + highAtk + ' ATK)!');
              duelToast('¡Widespread Ruin destruyó a ' + (killedM.name || 'monstruo') + ' (' + highAtk + ' ATK)!');
              if (typeof log === 'function') log('¡Widespread Ruin! Destruye al monstruo con mayor ATK del rival: ' + (killedM.name || 'monstruo') + '.');
              if (highIdx === ei) continue;
            } else {
              duelToast('¡Widespread Ruin activado, pero no hay objetivos en ataque!');
            }
          } else if (chosenTrap.type === 'ACID_TRAP_HOLE') {
            if (attackerIsGod) {
              duelToast('¡Acid Trap Hole falla contra Dios Egipcio!');
            } else {
              game.enemy[ei] = null;
              game.enemyGrave.push(e);
              e.attackedTurn = game.turnNo;
              if (window.playDestroySound) window.playDestroySound();
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Acid Trap Hole', '¡Disuelve y destruye al atacante!');
              duelToast('¡Acid Trap Hole disolvió y destruyó a ' + (e.name || 'el atacante') + '!');
              if (typeof log === 'function') log('¡Acid Trap Hole! Disuelve en ácido a ' + (e.name || 'el atacante') + '.');
              continue;
            }
          } else if (chosenTrap.type === 'EATGABOON') {
            if (attackerIsGod) {
              duelToast('¡Eatgaboon falla contra Dios Egipcio!');
            } else if (currentEffectiveAtk <= 1000) {
              game.enemy[ei] = null;
              game.enemyGrave.push(e);
              e.attackedTurn = game.turnNo;
              if (window.playDestroySound) window.playDestroySound();
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Eatgaboon', '¡Devora al atacante!');
              duelToast('¡Eatgaboon devoró y destruyó a ' + (e.name || 'el atacante') + '!');
              if (typeof log === 'function') log('¡Eatgaboon! Devora y destruye a ' + (e.name || 'el atacante') + ' (' + currentEffectiveAtk + ' ATK).');
              continue;
            } else {
              duelToast('¡Eatgaboon activado, pero el atacante tiene más de 1000 ATK!');
              if (typeof log === 'function') log('¡Eatgaboon falla! El atacante supera los 1000 ATK (' + currentEffectiveAtk + ' ATK).');
            }
          } else if (chosenTrap.type === 'BEAR_TRAP') {
            if (attackerIsGod) {
              duelToast('¡Bear Trap falla contra Dios Egipcio!');
            } else if (currentEffectiveAtk <= 1500) {
              game.enemy[ei] = null;
              game.enemyGrave.push(e);
              e.attackedTurn = game.turnNo;
              if (window.playDestroySound) window.playDestroySound();
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Bear Trap', '¡Atrapa y destruye al atacante!');
              duelToast('¡Bear Trap atrapó y destruyó a ' + (e.name || 'el atacante') + '!');
              if (typeof log === 'function') log('¡Bear Trap! Atrapa y destruye a ' + (e.name || 'el atacante') + ' (' + currentEffectiveAtk + ' ATK).');
              continue;
            } else {
              duelToast('¡Bear Trap activada, pero el atacante tiene más de 1500 ATK!');
              if (typeof log === 'function') log('¡Bear Trap falla! El atacante supera los 1500 ATK (' + currentEffectiveAtk + ' ATK).');
            }
          } else if (chosenTrap.type === 'INVISIBLE_WIRE') {
            if (attackerIsGod) {
              duelToast('¡Invisible Wire falla contra Dios Egipcio!');
            } else if (currentEffectiveAtk <= 2000) {
              game.enemy[ei] = null;
              game.enemyGrave.push(e);
              e.attackedTurn = game.turnNo;
              if (window.playDestroySound) window.playDestroySound();
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Invisible Wire', '¡Corta y destruye al atacante!');
              duelToast('¡Invisible Wire rebanó y destruyó a ' + (e.name || 'el atacante') + '!');
              if (typeof log === 'function') log('¡Invisible Wire! Corta y destruye a ' + (e.name || 'el atacante') + ' (' + currentEffectiveAtk + ' ATK).');
              continue;
            } else {
              duelToast('¡Invisible Wire activado, pero el atacante tiene más de 2000 ATK!');
              if (typeof log === 'function') log('¡Invisible Wire falla! El atacante supera los 2000 ATK (' + currentEffectiveAtk + ' ATK).');
            }
          } else if (chosenTrap.type === 'GOBLIN_FAN') {
            if (attackerIsGod) {
              duelToast('¡Goblin Fan falla contra Dios Egipcio!');
            } else {
              e.attackedTurn = game.turnNo;
              game.elp = Math.max(0, game.elp - 500);
              if (typeof render === 'function') render();
              if (typeof window.showTrap114 === 'function') window.showTrap114('Goblin Fan', '¡Ataque cancelado y 500 LP de daño al rival!');
              duelToast('¡Goblin Fan canceló el ataque y causó 500 LP de daño al rival!');
              if (typeof log === 'function') log('¡Goblin Fan! Anula el ataque de ' + (e.name || 'el atacante') + ' y causa 500 LP de daño directo.');
              continue;
            }
          } else if (chosenTrap.type === 'FAKE_TRAP') {
            e.attackedTurn = game.turnNo;
            if (typeof render === 'function') render();
            if (typeof window.showTrap114 === 'function') window.showTrap114('Fake Trap', '¡Ataque absorbido por el señuelo!');
            duelToast('¡Fake Trap absorbió y anuló el ataque enemigo por completo!');
            if (typeof log === 'function') log('¡Fake Trap! Actúa como señuelo absorbiendo todo el impacto del ataque.');
            continue;
          } else if (chosenTrap.type === 'BAD_REACTION_TO_SIMOCHI') {
            game.elp = Math.max(0, game.elp - 1000);
            e.tempBoost = (e.tempBoost || 0) - 1000;
            currentEffectiveAtk = Math.max(0, currentEffectiveAtk - 1000);
            if (typeof render === 'function') render();
            if (typeof window.showTrap114 === 'function') window.showTrap114('Bad Reaction to Simochi', '¡1000 LP de daño y -1000 ATK al atacante!');
            duelToast('¡Bad Reaction to Simochi causa 1000 LP de daño y reduce el ATK rival en -1000!');
            if (typeof log === 'function') log('¡Bad Reaction to Simochi! Causa 1000 LP de daño y reduce el ATK de ' + (e.name || 'atacante') + ' en -1000.');
          } else if (chosenTrap.type === 'REVERSE_TRAP') {
            if (typeof bestTarget !== 'undefined' && bestTarget && bestTarget.c) {
              bestTarget.c.tempBoost = (bestTarget.c.tempBoost || 0) + 1000;
            }
            currentEffectiveAtk = Math.max(0, currentEffectiveAtk - 1000);
            if (typeof render === 'function') render();
            if (typeof window.showTrap114 === 'function') window.showTrap114('Reverse Trap', '¡+1000 ATK a tu defensa e invierte la fuerza!');
            duelToast('¡Reverse Trap otorga +1000 ATK de sorpresa a tu defensa!');
            if (typeof log === 'function') log('¡Reverse Trap! Invierte el combate otorgando +1000 ATK defensivo de sorpresa.');
          }
        }
      }

      if (!game.enemy[ei]) continue;

      // RESOLUCIÓN DE COMBATE CONTRA EL OBJETIVO SELECCIONADO
      var pCard = bestTarget.c;
      var pIdx = bestTarget.idx;

      if (typeof triggerBattleTrap === 'function') triggerBattleTrap('player', pIdx);

      var wasSet = !!(pCard.faceDownSet103 || pCard.faceDown);
      if (wasSet) {
        pCard.faceDown = false;
        pCard.faceDownSet103 = false;
        pCard.faceUp = true;
        pCard.pos = 'DEF';
        if (typeof log === 'function') log('¡El ataque rival revela a ' + (pCard.name || 'tu monstruo') + ' en DEFENSA!');
        duelToast('¡Monstruo revelado en defensa: ' + (pCard.name || 'Monstruo') + '!');
      }

      // Bonificaciones de Signos Guardianes
      var aiSignBonus = 0, plSignBonus = 0;
      if (typeof getSignCombatRelation === 'function') {
        var rel = getSignCombatRelation(e, pCard);
        if (rel === 'adv') aiSignBonus = 500;
        else if (rel === 'disadv') plSignBonus = 500;
      }

      var finalAttackerAtk = currentEffectiveAtk + aiSignBonus;
      var finalTargetAtk = (typeof effectiveAtk === 'function' ? effectiveAtk(pCard) : (pCard.atk || 0)) + plSignBonus;
      var finalTargetDef = (pCard.def || 0) + (pCard.tempDefense || 0) + (pCard.tempBoostDef || 0) + plSignBonus;

      var isWaboku = !!game._wabokuActiveThisTurn;

      if (pCard.pos === 'DEF' && pCard.kind !== 'LINK') {
        if (finalAttackerAtk > finalTargetDef) {
          if (!isWaboku) {
            game.field[pIdx] = null;
            game.grave.push(pCard);
            if (typeof log === 'function') log(e.name + ' (' + finalAttackerAtk + ' ATK) destruye a ' + pCard.name + ' (' + finalTargetDef + ' DEF).');
            duelToast('¡Rival destruyó a tu ' + pCard.name + '!');
            if (window.playDestroySound) window.playDestroySound();
          } else {
            if (typeof log === 'function') log('Waboku protege a ' + pCard.name + ' de la destrucción.');
          }
        } else if (finalAttackerAtk < finalTargetDef) {
          var recoil = finalTargetDef - finalAttackerAtk;
          if (!isWaboku) {
            game.elp = Math.max(0, game.elp - recoil);
            if (typeof log === 'function') log(e.name + ' no supera la DEF de ' + pCard.name + '. El rival recibe ' + recoil + ' de daño.');
            if (window.playLPGainSound) window.playLPGainSound();
          }
        } else {
          if (typeof log === 'function') log('Empate con la DEF de ' + pCard.name + ': nadie es destruido.');
        }
      } else {
        // Objetivo en ATAQUE
        if (finalAttackerAtk > finalTargetAtk) {
          var diff = finalAttackerAtk - finalTargetAtk;
          if (!isWaboku) {
            game.plp = Math.max(0, game.plp - diff);
            game.field[pIdx] = null;
            game.grave.push(pCard);
            if (typeof log === 'function') log(e.name + ' destruye a ' + pCard.name + '. Recibes ' + diff + ' LP de daño.');
            duelToast('¡' + e.name + ' destruyó a ' + pCard.name + '! (-' + diff + ' LP)');
            if (window.playDestroySound) window.playDestroySound();
          } else {
            if (typeof log === 'function') log('Waboku evita el daño de batalla.');
          }
        } else if (finalAttackerAtk < finalTargetAtk) {
          var recoilAtk = finalTargetAtk - finalAttackerAtk;
          game.elp = Math.max(0, game.elp - recoilAtk);
          game.enemy[ei] = null;
          game.enemyGrave.push(e);
          if (typeof log === 'function') log(e.name + ' es destruido al atacar a ' + pCard.name + '. El rival pierde ' + recoilAtk + ' LP.');
          if (window.playDestroySound) window.playDestroySound();
        } else {
          if (!isWaboku) {
            game.enemy[ei] = null;
            game.field[pIdx] = null;
            game.enemyGrave.push(e);
            game.grave.push(pCard);
            if (typeof log === 'function') log('Empate de ATK entre ' + e.name + ' y ' + pCard.name + ': ambos destruidos.');
            if (window.playDestroySound) window.playDestroySound();
          } else {
            game.enemy[ei] = null;
            game.enemyGrave.push(e);
            if (typeof log === 'function') log(e.name + ' es destruido en empate. Waboku protege a ' + pCard.name + '.');
          }
        }
      }

      e.attackedTurn = game.turnNo;
      if (typeof cleanupOrphanedEquips === 'function') try { cleanupOrphanedEquips(); } catch(_) {}
      if (typeof render === 'function') render();
    }

    // Regla Oficial de Límite de Mano: Descarte de End Phase del rival si supera 6 cartas en mano
    if (Array.isArray(game.enemyHand) && game.enemyHand.length > 6) {
      var toDiscardCount = game.enemyHand.length - 6;
      var indexed = game.enemyHand.map(function(card, idx) {
        var score = 1000;
        if (card) {
          if (!isST(card)) {
            var a = Number(card.atk || card[4] || 0);
            var d = Number(card.def || card[5] || 0);
            score = Math.max(a, d);
          } else {
            score = 1500;
          }
        }
        return { card: card, idx: idx, score: score };
      });
      // Descartar las cartas con menor puntuación/utilidad primero
      indexed.sort(function(a, b) { return a.score - b.score; });
      var indicesToDiscard = indexed.slice(0, toDiscardCount).map(function(x) { return x.idx; });
      indicesToDiscard.sort(function(a, b) { return b - a; });

      var discardedNames = [];
      indicesToDiscard.forEach(function(i) {
        var disc = game.enemyHand.splice(i, 1)[0];
        if (disc) {
          game.enemyGrave.push(disc);
          discardedNames.push(disc.name || disc[0] || 'Carta');
        }
      });
      if (typeof log === 'function') log('El rival descarta ' + discardedNames.join(', ') + ' al Cementerio por límite de mano en End Phase.');
      if (typeof duelToast === 'function') duelToast('Rival descarta ' + discardedNames.length + ' carta(s) por límite de mano.');
      if (typeof render === 'function') render();
    }

    if (typeof render === 'function') render();
    if (game.plp <= 0 || game.elp <= 0) {
      if (typeof log === 'function') log('Duelo terminado.');
    }
  };
  try { aiBattle = window.aiBattle; } catch(_) {}

  // Hook window.attack for player attacks
  var prevAttackMaster = window.attack;
  window.attack = function() {
    if (typeof game !== 'undefined' && game && game.turn === 'player') {
      var pi = (game.selected || []).find(function(x) { return x && x[0] === 'f'; });
      var p = (pi != null && game.field) ? game.field[pi[1]] : null;
      if (!p && (game.selected || []).some(function(x) { return x && x[0] === 'l'; })) {
        p = game.linkField;
      }
      var ei = (game.selected || []).find(function(x) { return x && x[0] === 'e'; });
      var e = (ei != null && game.enemy) ? game.enemy[ei[1]] : null;
      if (!e && (game.selected || []).some(function(x) { return x && x[0] === 'el'; })) {
        e = game.enemyLinkField;
      }

      // AI Battle Traps in response to Player Attack
      if (p) {
        var oppName = (typeof storyOpponent !== 'undefined' && storyOpponent) ? storyOpponent.toUpperCase() : 'EL RIVAL';

        // 0. Enemy Crush Card Virus
        var enemyCCVIdx = (game.enemyBack || []).findIndex(function(c) {
          return c && c.set && isTrapReady(c) && (c.value === 'CRUSH_CARD_VIRUS' || c.name === 'Crush Card Virus');
        });
        if (enemyCCVIdx >= 0) {
          var eCCV = game.enemyBack[enemyCCVIdx];
          game.enemyBack[enemyCCVIdx] = null;
          game.enemyGrave.push(Object.assign({}, eCCV, { set: false, faceUp: true }));
          var pDestroyed = 0;
          var attackerDied = false;
          for (var pi2 = 0; pi2 < (game.field || []).length; pi2++) {
            var pm = game.field[pi2];
            if (pm) {
              if (isEgyptianGod(pm.name || pm[0])) {
                if (typeof log === 'function') log('\u00a1Tu Dios Egipcio ' + (pm.name || 'Dios') + ' resiste Crush Card Virus!');
                continue;
              }
              if (pm === p) attackerDied = true;
              game.grave.push(pm);
              game.field[pi2] = null;
              pDestroyed++;
            }
          }
          if (window.playDestroySound) window.playDestroySound();
          if (typeof render === 'function') render();
          var ccvMsg = '\u00a1' + oppName + ' activa Crush Card Virus! Destruye ' + pDestroyed + ' monstruo(s) en tu campo.';
          duelToast(ccvMsg);
          if (typeof log === 'function') log(ccvMsg);
          if (attackerDied) {
            game.selected = [];
            if (typeof render === 'function') render();
            return;
          }
        }

        // 1. Enemy Negate Attack
        var enemyNegIdx = (game.enemyBack || []).findIndex(function(c) {
          return c && c.set && isTrapReady(c) && (c.value === 'NEGATE_ATTACK' || c.name === 'Negate Attack');
        });
        if (enemyNegIdx >= 0) {
          var eNeg = game.enemyBack[enemyNegIdx];
          game.enemyBack[enemyNegIdx] = null;
          game.enemyGrave.push(Object.assign({}, eNeg, { set: false, faceUp: true }));
          (game.field || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
          game.selected = [];
          if (typeof render === 'function') render();
          duelToast('\u00a1' + oppName + ' activa Negate Attack! Tu ataque fue negado y la Battle Phase termin\u00f3.');
          if (typeof log === 'function') log('\u00a1' + oppName + ' activa Negate Attack! El ataque fue negado.');
          return;
        }

        // 2. Enemy Waboku
        var enemyWabIdx = (game.enemyBack || []).findIndex(function(c) {
          return c && c.set && isTrapReady(c) && (c.value === 'WABOKU' || c.name === 'Waboku');
        });
        if (enemyWabIdx >= 0) {
          var eWab = game.enemyBack[enemyWabIdx];
          game.enemyBack[enemyWabIdx] = null;
          game.enemyGrave.push(Object.assign({}, eWab, { set: false, faceUp: true }));
          game._wabokuEnemyActiveTurn = game.turnNo;
          duelToast('\u00a1' + oppName + ' activa Waboku! Sus monstruos no recibir\u00e1n da\u00f1o de batalla este turno.');
          if (typeof log === 'function') log('\u00a1' + oppName + ' activa Waboku!');
          if (typeof render === 'function') render();
        }

        // 3. Enemy Mirror Force
        var enemyMirIdx = (game.enemyBack || []).findIndex(function(c) {
          return c && c.set && isTrapReady(c) && (c.value === 'MIRROR_FORCE' || c.name === 'Mirror Force');
        });
        if (enemyMirIdx >= 0) {
          var eMir = game.enemyBack[enemyMirIdx];
          game.enemyBack[enemyMirIdx] = null;
          game.enemyGrave.push(Object.assign({}, eMir, { set: false, faceUp: true }));
          if (typeof window.showTrap114 === 'function') window.showTrap114('Mirror Force', '¡' + oppName + ' activa Mirror Force y destruye tus monstruos en Ataque!');
          var pMirDestroyed = 0;
          for (var mi = 0; mi < (game.field || []).length; mi++) {
            if (game.field[mi] && (game.field[mi].pos !== 'DEF' || game.field[mi].kind === 'LINK')) {
              if (isEgyptianGod(game.field[mi].name || game.field[mi][0])) continue;
              game.grave.push(game.field[mi]);
              game.field[mi] = null;
              pMirDestroyed++;
            }
          }
          game.selected = [];
          if (window.playDestroySound) window.playDestroySound();
          if (typeof render === 'function') render();
          duelToast('\u00a1' + oppName + ' activa Mirror Force! Destruye ' + pMirDestroyed + ' de tus monstruos atacantes.');
          if (typeof log === 'function') log('\u00a1' + oppName + ' activa Mirror Force! Destruye tus monstruos en modo de ataque.');
          return;
        }

        // 4. Enemy Sakuretsu Armor
        var enemySakIdx = (game.enemyBack || []).findIndex(function(c) {
          return c && c.set && isTrapReady(c) && (c.value === 'SAKURETSU_ARMOR' || c.name === 'Sakuretsu Armor');
        });
        if (enemySakIdx >= 0) {
          var eSak = game.enemyBack[enemySakIdx];
          game.enemyBack[enemySakIdx] = null;
          game.enemyGrave.push(Object.assign({}, eSak, { set: false, faceUp: true }));
          if (isEgyptianGod(p.name || p[0])) {
            duelToast('\u00a1Tu Dios Egipcio no es afectado por Sakuretsu Armor!');
          } else {
            if (pi != null) game.field[pi[1]] = null;
            else game.linkField = null;
            game.grave.push(p);
            game.selected = [];
            if (window.playDestroySound) window.playDestroySound();
            if (typeof render === 'function') render();
            duelToast('\u00a1' + oppName + ' activa Sakuretsu Armor! ' + (p.name || 'Tu atacante') + ' fue destruido.');
            if (typeof log === 'function') log('\u00a1' + oppName + ' activa Sakuretsu Armor! Destruye a tu atacante ' + (p.name || 'atacante') + '.');
            return;
          }
        }

        // 4b. Enemy Widespread Ruin
        var enemyWideIdx = (game.enemyBack || []).findIndex(function(c) {
          return c && c.set && isTrapReady(c) && (c.value === 'WIDESPREAD_RUIN' || c.name === 'Widespread Ruin');
        });
        if (enemyWideIdx >= 0) {
          var eWide = game.enemyBack[enemyWideIdx];
          game.enemyBack[enemyWideIdx] = null;
          game.enemyGrave.push(Object.assign({}, eWide, { set: false, faceUp: true }));
          var pHighAtk = -1, pHighIdx = -1;
          for (var wi = 0; wi < (game.field || []).length; wi++) {
            var pm = game.field[wi];
            if (pm && (pm.pos !== 'DEF' || pm.kind === 'LINK')) {
              var wAtk = typeof effectiveAtk === 'function' ? effectiveAtk(pm) : (pm.atk || 0);
              if (wAtk > pHighAtk) { pHighAtk = wAtk; pHighIdx = wi; }
            }
          }
          if (pHighIdx >= 0 && !isEgyptianGod(game.field[pHighIdx].name || game.field[pHighIdx][0])) {
            var desPm = game.field[pHighIdx];
            game.field[pHighIdx] = null;
            game.grave.push(desPm);
            if (window.playDestroySound) window.playDestroySound();
            if (typeof render === 'function') render();
            duelToast('¡' + oppName + ' activa Widespread Ruin! Destruye a ' + (desPm.name || 'tu monstruo'));
            if (typeof log === 'function') log('¡' + oppName + ' activa Widespread Ruin! Destruye a tu ' + (desPm.name || 'monstruo') + ' (' + pHighAtk + ' ATK).');
            if (pi != null && pHighIdx === pi[1]) return;
          }
        }

        // 5. Enemy Magic Cylinder
        var enemyCylIdx = (game.enemyBack || []).findIndex(function(c) {
          return c && c.set && isTrapReady(c) && (c.value === 'MAGIC_CYLINDER' || c.name === 'Magic Cylinder');
        });
        if (enemyCylIdx >= 0) {
          var eCyl = game.enemyBack[enemyCylIdx];
          game.enemyBack[enemyCylIdx] = null;
          game.enemyGrave.push(Object.assign({}, eCyl, { set: false, faceUp: true }));
          var pDmg = typeof effectiveAtk === 'function' ? effectiveAtk(p) : (p.atk || 0);
          game.plp = Math.max(0, game.plp - pDmg);
          p.attackedTurn = game.turnNo;
          game.selected = [];
          if (typeof render === 'function') render();
          duelToast('\u00a1' + oppName + ' activa Magic Cylinder! Ataque negado y recibes ' + pDmg + ' LP de da\u00f1o.');
          if (typeof log === 'function') log('\u00a1' + oppName + ' activa Magic Cylinder! Ataque negado, recibes ' + pDmg + ' LP de da\u00f1o.');
          return;
        }
      }

      var cleanedP = null, cleanedE = null;
      if (p && e) {
        if (e && (e.faceDown || e.faceDownSet103)) {
          e.faceDown = false;
          e.faceDownSet103 = false;
          e.faceUp = true;
          e.pos = 'DEF';
          if (typeof duelToast === 'function') duelToast('¡Ataque revela a ' + (e.name || 'Monstruo') + ' en Defensa!');
          if (typeof log === 'function') log('¡El ataque revela a ' + (e.name || 'Monstruo') + ' en posición de DEFENSA!');
        }
        var rel = getSignCombatRelation(p, e);
        var pSign = getCardSign(p), eSign = getCardSign(e);
        var pSym = GUARDIAN_SYMBOLS[pSign] || pSign, eSym = GUARDIAN_SYMBOLS[eSign] || eSign;

        if (rel === 'adv') {
          p.tempBoost = (p.tempBoost || 0) + 500;
          cleanedP = { card: p, field: 'tempBoost', amount: 500 };
          if (typeof duelToast === 'function') {
            duelToast('¡Ventaja de Signo Guardián! ' + (p.name || 'Atacante') + ' (' + pSym + ') supera a ' + (e.name || 'Defensor') + ' (' + eSym + '): +500 ATK.');
          }
          if (typeof log === 'function') {
            log('¡Signo Guardián! ' + (p.name || 'Atacante') + ' [' + pSym + '] > ' + (e.name || 'Defensor') + ' [' + eSym + '] ➔ +500 ATK.');
          }
        } else if (rel === 'disadv') {
          if (e.pos === 'DEF') {
            e.tempBoostDef = (e.tempBoostDef || 0) + 500;
            cleanedE = { card: e, field: 'tempBoostDef', amount: 500 };
            if (typeof duelToast === 'function') {
              duelToast('¡Desventaja de Signo! ' + (e.name || 'Defensor') + ' (' + eSym + ') supera a ' + (p.name || 'Atacante') + ' (' + pSym + '): +500 DEF.');
            }
            if (typeof log === 'function') {
              log('¡Signo Guardián Rival! ' + (e.name || 'Defensor') + ' [' + eSym + '] > ' + (p.name || 'Atacante') + ' [' + pSym + '] ➔ +500 DEF.');
            }
          } else {
            e.tempBoost = (e.tempBoost || 0) + 500;
            cleanedE = { card: e, field: 'tempBoost', amount: 500 };
            if (typeof duelToast === 'function') {
              duelToast('¡Desventaja de Signo! ' + (e.name || 'Defensor') + ' (' + eSym + ') supera a ' + (p.name || 'Atacante') + ' (' + pSym + '): +500 ATK.');
            }
            if (typeof log === 'function') {
              log('¡Signo Guardián Rival! ' + (e.name || 'Defensor') + ' [' + eSym + '] > ' + (p.name || 'Atacante') + ' [' + pSym + '] ➔ +500 ATK.');
            }
          }
        }
      }

      var res;
      try {
        res = prevAttackMaster ? prevAttackMaster.apply(this, arguments) : undefined;
      } finally {
        if (cleanedP) cleanedP.card[cleanedP.field] = Math.max(0, (cleanedP.card[cleanedP.field] || 0) - cleanedP.amount);
        if (cleanedE) cleanedE.card[cleanedE.field] = Math.max(0, (cleanedE.card[cleanedE.field] || 0) - cleanedE.amount);
        setTimeout(updateGuardianBattleHints, 30);
      }
      return res;
    }
    return prevAttackMaster ? prevAttackMaster.apply(this, arguments) : undefined;
  };
  try { attack = window.attack; } catch(_) {}

  // Hook window.select for instant update of battle hints
  var prevSelectMaster = window.select;
  window.select = function(zone, i) {
    var r = prevSelectMaster ? prevSelectMaster.apply(this, arguments) : undefined;
    setTimeout(updateGuardianBattleHints, 10);
    return r;
  };
  try { select = window.select; } catch(_) {}

  // Hook window.changePosition: official rules (summon turn restriction) & Flip Summon to Attack
  window.changePosition = function() {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return;

    if (g.turn !== 'player') {
      if (typeof duelToast === 'function') duelToast('Solo puedes cambiar posiciones durante tu turno.');
      return;
    }

    if (g.battlePhaseStarted) {
      if (typeof duelToast === 'function') duelToast('Ya entraste en fase de ataque. No puedes cambiar posiciones este turno.');
      if (typeof log === 'function') log('Ya entraste en fase de ataque. No puedes cambiar la posición de tus monstruos este turno.');
      return;
    }

    if (typeof getActiveConcealingSwords === 'function' && getActiveConcealingSwords('enemy')) {
      if (typeof duelToast === 'function') duelToast('Swords of Concealing Light del rival impide cambiar posiciones.');
      if (typeof log === 'function') log('Swords of Concealing Light rival impide cambiar de posición a tus monstruos.');
      return;
    }

    var pick = [...(g.selected || [])].reverse().find(function(x) { return x && (x[0] === 'f' || x[0] === 'l'); });
    var c = pick ? (pick[0] === 'f' ? (g.field && g.field[Number(pick[1])]) : (g.linkZones && g.linkZones[Number(pick[1])])) : null;

    if (!c) {
      if (typeof duelToast === 'function') duelToast('Selecciona uno de tus monstruos para cambiar su posición.');
      if (typeof log === 'function') log('Selecciona uno de tus monstruos para cambiar su posición.');
      return;
    }

    if (c.kind === 'LINK') {
      g.selected = [];
      if (typeof render === 'function') render();
      if (typeof duelToast === 'function') duelToast(c.name + ' es Link: permanece siempre en ATAQUE.');
      if (typeof log === 'function') log(c.name + ' es un monstruo Link: permanece siempre en ATAQUE y no tiene DEF.');
      return;
    }

    // Regla Oficial Yu-Gi-Oh!: No se puede cambiar la posición de batalla en el turno de invocación o colocación
    if (c.summonedTurn === g.turnNo) {
      if (typeof duelToast === 'function') duelToast('No puedes cambiar la posición en el turno de invocación o colocación.');
      if (typeof log === 'function') log('No puedes cambiar la posición de ' + (c.name || 'este monstruo') + ' en el mismo turno en que fue invocado o colocado.');
      return;
    }

    // Regla Oficial: Solo 1 cambio manual de posición por turno
    if (c.changedPositionTurn === g.turnNo) {
      if (typeof duelToast === 'function') duelToast('Este monstruo ya cambió de posición este turno.');
      if (typeof log === 'function') log((c.name || 'El monstruo') + ' ya cambió de posición este turno.');
      return;
    }

    // Regla Oficial: Un monstruo que ya atacó este turno no puede cambiar de posición
    if (c.attackedTurn === g.turnNo) {
      if (typeof duelToast === 'function') duelToast('Un monstruo que ya atacó este turno no puede cambiar de posición.');
      if (typeof log === 'function') log((c.name || 'El monstruo') + ' ya atacó este turno.');
      return;
    }

    // Invocación por Volteo (Flip Summon) desde modo SET / Boca Abajo
    if (c.faceDown || c.faceDownSet103) {
      c.faceDown = false;
      c.faceDownSet103 = false;
      c.faceUp = true;
      c.pos = 'ATK';
      c.changedPositionTurn = g.turnNo;
      g.selected = [];
      if (window.playSummonSound) window.playSummonSound();
      if (typeof duelToast === 'function') duelToast('¡Invocación por Volteo! ' + (c.name || 'Monstruo') + ' se coloca en ATAQUE.');
      if (typeof log === 'function') log('¡Invocación por Volteo! ' + (c.name || 'Monstruo') + ' se voltea boca arriba en posición de ATAQUE.');
      if (typeof render === 'function') render();
      return;
    }

    // Cambio manual de posición entre ATK y DEF
    c.pos = (c.pos === 'DEF' ? 'ATK' : 'DEF');
    c.changedPositionTurn = g.turnNo;
    g.selected = [];
    if (window.playSummonSound) window.playSummonSound();
    if (typeof duelToast === 'function') duelToast((c.name || 'Monstruo') + ' cambió a posición de ' + (c.pos === 'ATK' ? 'ATAQUE' : 'DEFENSA') + '.');
    if (typeof log === 'function') log((c.name || 'Monstruo') + ' cambió a posición de ' + (c.pos === 'ATK' ? 'ATAQUE.' : 'DEFENSA.'));
    if (typeof render === 'function') render();
  };
  try { changePosition = window.changePosition; } catch(_) {}

  // Hook window.playerHand50: start of player turn countdown check for continuous spells
  var prevPlayerHandConceal = window.playerHand50;
  window.playerHand50 = function() {
    var r = prevPlayerHandConceal ? prevPlayerHandConceal.apply(this, arguments) : undefined;
    try {
      if (typeof checkConcealingTurnExpire === 'function') {
        checkConcealingTurnExpire('player');
      }
    } catch(e) {}
    return r;
  };
  try { playerHand50 = window.playerHand50; } catch(_) {}

  // Hook window.startRival58: start of rival turn countdown check
  var prevStartRivalConceal = window.startRival58;
  if (typeof prevStartRivalConceal === 'function') {
    window.startRival58 = function() {
      try {
        if (typeof checkConcealingTurnExpire === 'function') {
          checkConcealingTurnExpire('enemy');
        }
      } catch(e) {}
      return prevStartRivalConceal.apply(this, arguments);
    };
    try { startRival58 = window.startRival58; } catch(_) {}
  }

  // Hook window.cardHTML: render face-down defense cards correctly on field
  var prevCardHTMLConceal = window.cardHTML;
  if (typeof prevCardHTMLConceal === 'function') {
    window.cardHTML = function(c, zone, i) {
      if (c && (zone === 'e' || zone === 'f') && (c.faceDown || c.faceDownSet103)) {
        var sel = typeof game !== 'undefined' && game && game.selected && game.selected.some(function(x) { return x && x[0] === zone && Number(x[1]) === Number(i); });
        var label = c._concealed ? 'OCULTO' : 'SET';
        return '<div data-zone="' + zone + '" data-index="' + i + '" class="fieldMonster defense faceDownSet103 ' + (sel ? 'selected' : '') + '" onclick="select(\'' + zone + '\',' + i + ')"><div class="setMonsterBack103"><span>' + label + '</span></div><div class="setMonsterDef103">🛡 DEF</div></div>';
      }
      return prevCardHTMLConceal.apply(this, arguments);
    };
    try { cardHTML = window.cardHTML; } catch(_) {}
  }

  // Hook window.updateCardInfo: show detailed info for concealed cards
  var prevUpdateCardInfoConceal = window.updateCardInfo;
  if (typeof prevUpdateCardInfoConceal === 'function') {
    window.updateCardInfo = function() {
      var r = prevUpdateCardInfoConceal.apply(this, arguments);
      try {
        if (typeof game === 'undefined' || !game) return r;
        var pick = [...(game.selected || [])].reverse().find(function(x) { return x && ['f', 'e', 'l', 'el'].includes(x[0]); });
        if (!pick) return r;
        var zone = pick[0], idx = Number(pick[1]);
        var targetList = (zone === 'f') ? game.field : (zone === 'e' ? game.enemy : null);
        var c = targetList ? targetList[idx] : null;
        if (c && (c.faceDown || c.faceDownSet103)) {
          var body = document.getElementById('cardInfoBody');
          var grid = body && body.querySelector('.infoGrid');
          if (grid) {
            var s = document.createElement('span'); s.textContent = 'Posición';
            var b = document.createElement('b'); b.className = 'infoSet103';
            b.textContent = c._concealed ? 'DEFENSA BOCA ABAJO (Espadas de Luz Ocultadora)' : 'SET · DEFENSA BOCA ABAJO';
            grid.append(s, b);
          }
        }
      } catch(_) {}
      return r;
    };
    try { updateCardInfo = window.updateCardInfo; } catch(_) {}
  }

  // Hook window.stHTML: display active turn badge on continuous spells in backrow
  var prevStHTMLConceal = window.stHTML;
  if (typeof prevStHTMLConceal === 'function') {
    window.stHTML = function(c, zone, i) {
      if (c && !c.set && zone !== 'h') {
        var tLeft = c.turnsLeft != null ? c.turnsLeft : c.turns109;
        if (tLeft != null) {
          var res = prevStHTMLConceal.apply(this, arguments);
          return res.replace('<div style="font-size:10px"></div>', '<div style="font-size:10px; color:#4df; font-weight:bold;">ACTIVA · ' + tLeft + 'T</div>');
        }
      }
      return prevStHTMLConceal.apply(this, arguments);
    };
    try { stHTML = window.stHTML; } catch(_) {}
  }

  // Disable automatic trap triggering in autoPlayerTrapAtEnemyBP60
  // All battle traps (Negate Attack, Waboku, Mirror Force, Sakuretsu Armor, etc.)
  // must be prompted interactively in aiBattle via promptPlayerBattleTrap ONLY when an attack is declared!
  // If the opponent does not attack, traps remain SET and never activate when passing to End Phase.
  window.autoPlayerTrapAtEnemyBP60 = async function() {
    return false;
  };

  // 6.5 Universal Spell/Trap Immunity Guard for Egyptian Gods
  // (Cannot be destroyed, cannot be negated, cannot be removed by Spells or Traps; only by battle!)
  function safeguardEgyptianGods(fn) {
    if (typeof game === 'undefined' || !game) return fn ? fn() : undefined;
    var pGods = [];
    (game.field || []).forEach(function(m, i) {
      if (m && isEgyptianGod(m.name || m[0])) pGods.push({ idx: i, card: m });
    });
    var eGods = [];
    (game.enemy || []).forEach(function(m, i) {
      if (m && isEgyptianGod(m.name || m[0])) eGods.push({ idx: i, card: m });
    });

    var res;
    try {
      if (fn) res = fn();
    } catch(err) {
      console.error('Error during ST activation:', err);
    }

    var restored = false;
    pGods.forEach(function(g) {
      if (game.field[g.idx] !== g.card) {
        game.field[g.idx] = g.card;
        if (Array.isArray(game.grave)) {
          var gi = game.grave.lastIndexOf(g.card);
          if (gi >= 0) game.grave.splice(gi, 1);
        }
        restored = true;
      }
    });
    eGods.forEach(function(g) {
      if (game.enemy[g.idx] !== g.card) {
        game.enemy[g.idx] = g.card;
        if (Array.isArray(game.enemyGrave)) {
          var gi = game.enemyGrave.lastIndexOf(g.card);
          if (gi >= 0) game.enemyGrave.splice(gi, 1);
        }
        restored = true;
      }
    });

    if (restored) {
      duelToast('¡Los Dioses Egipcios son inmunes a la destrucción de Magias y Trampas!');
      if (typeof log === 'function') log('¡El poder divino es supremo! Los Dioses Egipcios no pueden ser destruidos ni negados por Magias o Trampas (solo por batalla).');
      if (typeof render === 'function') render();
    }

    return res;
  }

  var prevActivateSTMaster = window.activateSTFromHand;
  window.activateSTFromHand = function() {
    var args = arguments;
    return safeguardEgyptianGods(function() {
      if (prevActivateSTMaster) return prevActivateSTMaster.apply(window, args);
    });
  };
  try { activateSTFromHand = window.activateSTFromHand; } catch(_) {}

  var prevActivateSetMaster = window.activateSetCard;
  window.activateSetCard = function() {
    var args = arguments;
    return safeguardEgyptianGods(function() {
      if (prevActivateSetMaster) return prevActivateSetMaster.apply(window, args);
    });
  };
  try { activateSetCard = window.activateSetCard; } catch(_) {}

  // 7. World 1 Extra Deck blocker
  var prevAiExtraMaster = window.aiExtraSummon;
  window.aiExtraSummon = function() {
    if (isWorld1Duel()) {
      return;
    }
    if (prevAiExtraMaster) return prevAiExtraMaster.apply(this, arguments);
  };
  try { aiExtraSummon = window.aiExtraSummon; } catch(_) {}

  var prevPlaceLinkMaster = window.placeLink;
  window.placeLink = function(c, side) {
    if (isWorld1Duel()) {
      return null;
    }
    if (prevPlaceLinkMaster) return prevPlaceLinkMaster.apply(this, arguments);
    return null;
  };
  try { placeLink = window.placeLink; } catch(_) {}

  var prevOpenPileMaster = window.openPile;
  window.openPile = function(kind) {
    if ((kind === 'extra' || kind === 'enemyExtra') && isWorld1Duel()) {
      duelToast('El Extra Deck est\u00e1 prohibido en el Mundo 1.');
      return;
    }
    if (prevOpenPileMaster) return prevOpenPileMaster.apply(this, arguments);
  };
  try { openPile = window.openPile; } catch(_) {}

  // 8. Signos Guardianes Limpios y Sanitizador Visual
  window.FMR_SIGN_SYMBOL = {
    SOL: '☉',
    LUNA: '☽',
    MERCURIO: '☿',
    VENUS: '♀',
    MARTE: '♂',
    JUPITER: '♃',
    SATURNO: '♄',
    URANO: '♅',
    NEPTUNO: '♆',
    PLUTON: '♇'
  };

  function fixBadChars() {
    var syms = {
      SOL: '☉', LUNA: '☽', MERCURIO: '☿', VENUS: '♀', MARTE: '♂',
      JUPITER: '♃', SATURNO: '♄', URANO: '♅', NEPTUNO: '♆', PLUTON: '♇'
    };
    var labels = {
      SOL: 'SOL', LUNA: 'LUNA', MERCURIO: 'MERC.', VENUS: 'VENUS', MARTE: 'MARTE',
      JUPITER: 'JÚP.', SATURNO: 'SAT.', URANO: 'URANO', NEPTUNO: 'NEPT.', PLUTON: 'PLUTÓN'
    };

    // 1. Limpiar .handSign102 (Signos en la parte inferior de las cartas de la mano)
    document.querySelectorAll('.handSign102').forEach(function(el) {
      var txt = (el.textContent || '').toUpperCase();
      for (var k in labels) {
        if (txt.includes(k) || txt.includes(labels[k].toUpperCase()) || (k === 'PLUTON' && txt.includes('PLUT')) || (k === 'JUPITER' && txt.includes('J'))) {
          el.innerHTML = '<span class="sym" style="font-size:11px;line-height:1;margin-right:2px;">' + (syms[k] || '') + '</span><span>' + labels[k] + '</span>';
          el.title = 'Signo: ' + labels[k];
          break;
        }
      }
    });

    // 2. Limpiar .posBadge (Posición de batalla)
    document.querySelectorAll('.posBadge').forEach(function(el) {
      if (el.textContent.includes('ATK')) {
        el.textContent = '⚔ ATK';
      } else if (el.textContent.includes('DEF')) {
        el.textContent = '🛡 DEF';
      }
    });

    // 3. Limpiar .attrBadge (Icono de Tipo/Atributo en la esquina superior derecha)
    document.querySelectorAll('.card.monster').forEach(function(cardEl) {
      var badge = cardEl.querySelector('.attrBadge');
      if (!badge) return;
      var zone = cardEl.dataset.zone;
      var idx = Number(cardEl.dataset.index);
      var card = null;
      if (zone === 'h' && game && game.hand) card = game.hand[idx];
      else if (zone === 'f' && game && game.field) card = game.field[idx];
      else if (zone === 'e' && game && game.enemy) card = game.enemy[idx];

      if (card) {
        var t = String(card.type || card[2] || '');
        var a = String(card.attr || card[3] || '');
        var icon = t.includes('Dragon') ? '🐉' :
                   t.includes('Warrior') ? '⚔️' :
                   t.includes('Spellcaster') ? '🧙' :
                   t.includes('Thunder') ? '⚡' :
                   t.includes('Machine') ? '⚙️' :
                   t.includes('Zombie') ? '💀' :
                   t.includes('Beast') ? '🐺' :
                   t.includes('Insect') ? '🪲' :
                   t.includes('Fiend') ? '😈' :
                   t.includes('Pyro') ? '🔥' :
                   (t.includes('Aqua') || t.includes('Fish') || t.includes('Sea Serpent')) ? '💧' :
                   t.includes('Dinosaur') ? '🦖' :
                   t.includes('Reptile') ? '🦎' :
                   t.includes('Plant') ? '🌿' :
                   t.includes('Rock') ? '🪨' :
                   t.includes('Winged') ? '🦅' :
                   (a === 'LIGHT' ? '☀️' : a === 'DARK' ? '🌑' : a === 'FIRE' ? '🔥' : a === 'WATER' ? '💧' : a === 'WIND' ? '🌪️' : '⛰️');
        badge.textContent = icon;
      }
    });

    // 4. Limpiar .fieldStats (ATK y DEF en las fichas del campo)
    document.querySelectorAll('.fieldStats .atk').forEach(function(el) {
      var num = el.textContent.replace(/[^0-9]/g, '');
      if (num) el.innerHTML = '⚔ ' + num;
    });
    document.querySelectorAll('.fieldStats .def').forEach(function(el) {
      var num = el.textContent.replace(/[^0-9]/g, '');
      if (num) el.innerHTML = '🛡 ' + num;
    });
  }
  window.fixBadChars = fixBadChars;

  // 5c. LIMPIEZA DE EQUIPOS CUANDO EL MONSTRUO DEJA EL CAMPO
  function cleanupOrphanedEquips() {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g) return;

    var sides = [
      { side: 'player', field: g.field, links: g.linkZones, back: g.playerBack, grave: g.grave },
      { side: 'enemy', field: g.enemy, links: g.enemyLinkZones, back: g.enemyBack, grave: g.enemyGrave }
    ];

    sides.forEach(function(s) {
      if (!Array.isArray(s.back) || !Array.isArray(s.grave)) return;
      var activeFieldMonsters = (s.field || []).concat(s.links || []).filter(Boolean);

      for (var i = 0; i < s.back.length; i++) {
        var eq = s.back[i];
        if (!eq) continue;

        // Si la carta está SET boca abajo, aún no ha sido activada/equipada
        if (eq.set) continue;

        var isEq = (eq.kind === 'EQUIP' || eq.type === 'EQUIP' || eq.value === 'EQUIP' || (typeof isEquipSpell === 'function' && isEquipSpell(eq)));
        if (!isEq && !eq.equipToken109 && !eq._targetMonster) continue;

        var hasTargetOnField = false;

        if (eq.equipToken109) {
          hasTargetOnField = activeFieldMonsters.some(function(m) {
            return m && m._equipToken109 === eq.equipToken109;
          });
        } else if (eq._targetMonster) {
          hasTargetOnField = activeFieldMonsters.some(function(m) {
            return m === eq._targetMonster;
          });
        }

        if (!hasTargetOnField) {
          // El monstruo equipado ya no está en el campo: el equipo va al cementerio
          s.back[i] = null;
          eq.set = false;
          eq.faceUp = true;
          s.grave.push(eq);

          var eqName = eq.name || eq[0] || 'Carta de Equipo';
          var eqVal = eq.value || '';

          // Efecto de Cementerio de Black Pendant (-500 LP al rival)
          if (eqVal === 'BLACK_PENDANT' || eqName === 'Black Pendant') {
            if (s.side === 'player') {
              g.elp = Math.max(0, Number(g.elp || 0) - 500);
              if (typeof log === 'function') log('Black Pendant va al Cementerio: el rival pierde 500 LP.');
            } else {
              g.plp = Math.max(0, Number(g.plp || 0) - 500);
              if (typeof log === 'function') log('Black Pendant va al Cementerio: recibes 500 LP de daño.');
            }
          }

          if (typeof log === 'function') {
            log(eqName + ' es destruido y enviado al Cementerio (el monstruo equipado dejó el Campo).');
          }
          if (typeof duelToast === 'function') {
            duelToast(eqName + ' al Cementerio (monstruo equipado destruido)');
          }
        }
      }
    });
  }
  window.cleanupOrphanedEquips = cleanupOrphanedEquips;

  var prevRenderMaster = window.render;
  window.render = function() {
    if (typeof cleanupOrphanedEquips === 'function') {
      try { cleanupOrphanedEquips(); } catch(_) {}
    }
    if (typeof game !== 'undefined' && game) {
      if (game.turn === 'player' || (game._wabokuActiveTurn && game.turnNo !== game._wabokuActiveTurn)) {
        game._wabokuActiveThisTurn = false;
        game._wabokuActiveTurn = null;
        game._threateningRoarActive = false;
      }
    }
    if (isWorld1Duel() && typeof game !== 'undefined' && game) {
      game.extra = [];
      game.extraUsed = [];
      game.linkZones = [null, null];
      game.enemyLinkZones = [null, null];
      game.linkField = null;
      game.enemyLinkField = null;
    }
    if (prevRenderMaster) prevRenderMaster.apply(this, arguments);

    if (isWorld1Duel()) {
      var ep = document.getElementById('enemyExtraPile');
      if (ep) ep.style.display = 'none';
      var pp = document.querySelector('.playerPileGroup .extraPile');
      if (pp) pp.style.display = 'none';
      var sl = document.getElementById('sharedLink');
      if (sl) sl.style.display = 'none';
    }

    if (typeof updateFusionAssist === 'function') try { updateFusionAssist(); } catch(_) {}
    if (typeof updateSetButton103 === 'function') try { updateSetButton103(); } catch(_) {}
    if (typeof fixBadChars === 'function') try { fixBadChars(); } catch(_) {}
    if (typeof updateGuardianBattleHints === 'function') try { updateGuardianBattleHints(); } catch(_) {}
  };
  try { render = window.render; } catch(_) {}

  // CSS for World 1 Extra Deck hiding, Fusion Button, and Guardian Signs Battle Badges
  var style = document.createElement('style');
  style.id = 'world1ExtraBlockerStyle';
  style.textContent = `
    /* ════════════════════════════════════════════════════════════════
       ENCABEZADO UNIFICADO DE DUELO Y LP (HORIZONTAL Y VERTICAL)
       ════════════════════════════════════════════════════════════════ */
    #campaignDuelHud3000 {
      display: none !important;
    }
    #duelTopHeader .mode,
    #duelTopHeader .mode::after {
      display: none !important;
      content: '' !important;
    }
    #duelTopHeader, .top {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      box-sizing: border-box !important;
    }
    #duelTopHeader .lp, .lp {
      font-size: 15px !important;
      font-weight: 900 !important;
      padding: 2px 10px !important;
      border-radius: 6px !important;
      background: rgba(0, 0, 0, 0.7) !important;
      border: 1px solid rgba(212, 175, 55, 0.5) !important;
      color: #fff !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      white-space: nowrap !important;
    }
    #plp { color: #4fc3f7 !important; font-weight: 900 !important; text-shadow: 0 0 6px rgba(79, 195, 247, 0.8) !important; }
    #elp { color: #ff5252 !important; font-weight: 900 !important; text-shadow: 0 0 6px rgba(255, 82, 82, 0.8) !important; }

    /* Centrado Vertical en Modo Portrait */
    @media (orientation: portrait), (max-width: 768px) {
      body.view-field,
      body.mobile-portrait.view-field {
        min-height: 100vh !important;
        min-height: 100dvh !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important; /* Centrado vertical completo del campo */
        align-items: center !important;
        padding: 6px 4px 20px 4px !important;
        box-sizing: border-box !important;
      }
      body.view-field .wrap,
      body.mobile-portrait.view-field .wrap {
        margin: auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        width: 100% !important;
        max-width: min(520px, 98vw) !important;
        zoom: 0.84 !important;
      }
      body.view-field #duelTopHeader {
        width: 100% !important;
        margin-bottom: 3px !important;
        border-radius: 8px 8px 0 0 !important;
        position: static !important;
      }
      body.view-field #duelBoardWrapper {
        width: 100% !important;
      }
    }

    /* Barra Superior Fija y LP Visibles en Modo Landscape */
    @media (orientation: landscape) {
      body.view-field,
      body.mobile-landscape.view-field {
        display: block !important;
        min-height: unset !important;
        padding: 0 !important;
      }
      body.view-field .wrap,
      body.mobile-landscape.view-field .wrap {
        padding: 0 4px !important;
        max-width: 100vw !important;
        margin: 0 auto !important;
        zoom: 0.74 !important;
      }
      body.view-field #duelTopHeader,
      body.mobile-landscape #duelTopHeader,
      #duelTopHeader,
      .top {
        position: sticky !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        z-index: 99999 !important;
        padding: max(2px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 2px max(12px, env(safe-area-inset-left)) !important;
        background: linear-gradient(180deg, rgba(20, 14, 8, 0.98) 0%, rgba(10, 7, 4, 0.95) 100%) !important;
        border-bottom: 1.5px solid #d4af37 !important;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.85) !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin: 0 0 3px 0 !important;
        box-sizing: border-box !important;
        height: 32px !important;
        min-height: 32px !important;
      }
      #duelTopHeader b {
        font-size: 13px !important;
        color: #ffd700 !important;
        letter-spacing: 0.5px !important;
        text-shadow: 1px 1px 2px #000 !important;
      }
    }

    body.story-world-1 #enemyExtraPile,
    body.story-world-1 .extraPile,
    body.story-world-1 #sharedLink { display: none !important; }
    body.view-field #fusionBtn { display: inline-flex !important; }

    /* GUARDIAN SIGNS BATTLE INDICATORS */
    .guardianSignBattleBadge {
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      z-index: 9999 !important;
      padding: 4px 8px !important;
      border-radius: 8px !important;
      font-family: 'VT323', monospace, sans-serif !important;
      text-align: center !important;
      pointer-events: none !important;
      letter-spacing: 0.5px !important;
      animation: signBadgePulse 1s infinite alternate ease-in-out !important;
      white-space: nowrap !important;
    }
    .guardianSignBattleBadge .signBadgeTop {
      font-size: 15px !important;
      font-weight: 900 !important;
      line-height: 1.1 !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.6) !important;
    }
    .guardianSignBattleBadge .signBadgeSub {
      font-size: 13px !important;
      font-weight: bold !important;
      opacity: 0.95 !important;
      margin-top: 1px !important;
    }
    .guardianSignBattleBadge.adv {
      background: linear-gradient(180deg, #ffe066, #e6b800) !important;
      color: #1a1200 !important;
      border: 2px solid #ffffff !important;
      box-shadow: 0 0 14px #ffd700, 0 4px 10px rgba(0,0,0,0.85) !important;
    }
    .guardianSignBattleBadge.disadv {
      background: linear-gradient(180deg, #ff4d4d, #cc0000) !important;
      color: #ffffff !important;
      border: 2px solid #ffcccc !important;
      box-shadow: 0 0 14px #ff3333, 0 4px 10px rgba(0,0,0,0.85) !important;
    }
    .signAdvantageHighlight {
      outline: 3px solid #ffd700 !important;
      box-shadow: 0 0 16px 4px #ffd700 !important;
      transition: all 0.2s ease !important;
    }
    .signDisadvantageHighlight {
      outline: 3px solid #ff3333 !important;
      box-shadow: 0 0 16px 4px #ff3333 !important;
      transition: all 0.2s ease !important;
    }
    @keyframes signBadgePulse {
      0% { transform: translate(-50%, -50%) scale(0.95); }
      100% { transform: translate(-50%, -50%) scale(1.05); }
    }

    /* ============================================================== */
    /* FMR DUEL BEAUTIFIER: CRISP & PROPORTIONAL CARDS IN HAND & FIELD */
    /* ============================================================== */

    /* --- 1. VISTA MANO (HAND VIEW) --- */
    body.view-hand #hand {
      display: grid !important;
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      gap: 12px !important;
      max-width: 980px !important;
      margin: 15px auto 30px !important;
      padding: 0 10px !important;
    }

    body.view-hand #hand .zone {
      height: 270px !important;
      min-height: 270px !important;
      max-height: 270px !important;
      border: 0 !important;
      background: transparent !important;
    }

    body.view-hand #hand .card,
    .hand .card {
      height: 270px !important;
      min-height: 270px !important;
      max-height: 270px !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      padding: 6px !important;
      border-radius: 9px !important;
      border: 2px solid #9e814a !important;
      background: linear-gradient(160deg, #2a2015, #140e0a) !important;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.75), inset 0 0 0 1px rgba(255, 255, 255, 0.12) !important;
      box-sizing: border-box !important;
      position: relative !important;
      transition: transform 0.16s ease, box-shadow 0.16s ease !important;
    }

    body.view-hand #hand .card:hover,
    .hand .card:hover {
      transform: translateY(-8px) scale(1.03) !important;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.9), 0 0 14px rgba(229, 200, 120, 0.45) !important;
      z-index: 30 !important;
    }

    body.view-hand #hand .card.selected,
    .hand .card.selected {
      transform: translateY(-10px) scale(1.045) !important;
      outline: 3px solid #f4d35e !important;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.95), 0 0 22px rgba(244, 211, 94, 0.7) !important;
      z-index: 35 !important;
    }

    /* Card Header in Hand */
    body.view-hand #hand .card .cardTop,
    .hand .card .cardTop {
      height: 24px !important;
      min-height: 24px !important;
      padding: 2px 6px !important;
      background: rgba(10, 8, 6, 0.88) !important;
      border-radius: 4px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: 2px !important;
    }

    body.view-hand #hand .card .cardTop .name,
    .hand .card .cardTop .name {
      font-size: 11px !important;
      font-weight: 800 !important;
      color: #fff !important;
      text-shadow: 0 1px 3px #000 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    body.view-hand #hand .card .attrBadge,
    .hand .card .attrBadge {
      font-size: 12px !important;
      filter: drop-shadow(0 1px 2px #000) !important;
    }

    /* Position Badge in Hand */
    body.view-hand #hand .card .posBadge,
    .hand .card .posBadge {
      position: absolute !important;
      left: 8px !important;
      top: 34px !important;
      z-index: 10 !important;
      font-size: 8px !important;
      font-weight: 800 !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      background: rgba(0, 0, 0, 0.85) !important;
      border: 1px solid #7a6035 !important;
      color: #f4d35e !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.6) !important;
    }

    /* Card Artwork in Hand - Expansive Frame */
    body.view-hand #hand .card .cardArt,
    .hand .card .cardArt,
    body.view-hand #hand .card.spell .cardArt,
    body.view-hand #hand .card.trap .cardArt {
      width: 100% !important;
      height: 155px !important;
      min-height: 155px !important;
      max-height: 155px !important;
      flex: 0 0 155px !important;
      margin: 2px 0 !important;
      border-radius: 6px !important;
      overflow: hidden !important;
      border: 1.5px solid #8e7343 !important;
      background: #000 !important;
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.9) !important;
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    body.view-hand #hand .card.spell .cardArt {
      border-color: #3b8875 !important;
    }

    body.view-hand #hand .card.trap .cardArt {
      border-color: #9c3f7d !important;
    }

    /* Image inside Card Art: Anchored top center so monster illustration is 100% visible */
    body.view-hand #hand .card .cardArt img,
    .hand .card .cardArt img,
    body.view-hand #hand .card.spell .cardArt img,
    body.view-hand #hand .card.trap .cardArt img,
    .cardArt img,
    .bandaiArt img,
    .stBandaiArt img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: top center !important;
      display: block !important;
    }

    /* Card Metadata in Hand */
    body.view-hand #hand .card .cardMeta,
    .hand .card .cardMeta {
      font-size: 8.5px !important;
      color: #d6c5a5 !important;
      text-align: center !important;
      margin: 2px 0 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* Guardian Sign Pills in Hand */
    .handSigns102 {
      display: flex !important;
      gap: 4px !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 2px 0 2px !important;
      min-height: 18px !important;
      pointer-events: none !important;
    }

    .handSign102 {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 3px !important;
      padding: 1px 6px !important;
      border: 1px solid #8e7343 !important;
      border-radius: 4px !important;
      background: rgba(15, 12, 8, 0.85) !important;
      color: #ffd45c !important;
      font-size: 8px !important;
      font-weight: 800 !important;
      line-height: 1.2 !important;
    }

    .handSign102 .sym {
      font-size: 11px !important;
      color: #ffea79 !important;
      line-height: 1 !important;
    }

    /* Prevent Modals from Bleeding onto the Screen */
    #positionModal.hidden, .positionModal.hidden,
    #pileModal.hidden, .pileModal.hidden {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    /* Stats Footer in Hand */
    body.view-hand #hand .card .stats,
    .hand .card .stats {
      height: 24px !important;
      min-height: 24px !important;
      margin: 0 !important;
      padding: 0 8px !important;
      background: rgba(8, 7, 5, 0.92) !important;
      border: 1px solid #5a4625 !important;
      border-radius: 4px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      font-size: 10.5px !important;
      font-weight: 900 !important;
      box-sizing: border-box !important;
    }

    body.view-hand #hand .card .stats .atk,
    .hand .card .stats .atk {
      color: #ff5252 !important;
    }

    body.view-hand #hand .card .stats .def,
    .hand .card .stats .def {
      color: #4da6ff !important;
    }

    /* --- 2. VISTA CAMPO (DUEL FIELD) --- */
    body.view-field #player .zone,
    body.view-field #enemy .zone {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 2px !important;
    }

    /* Field Monster card: fills the zone elegantly */
    body.view-field #player .fieldMonster,
    body.view-field #enemy .fieldMonster,
    .fieldMonster {
      width: 90% !important;
      max-width: 90% !important;
      height: 94% !important;
      max-height: 94% !important;
      aspect-ratio: unset !important;
      margin: auto !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      border: 2px solid #bda66e !important;
      border-radius: 6px !important;
      background: #17120b !important;
      padding: 2px !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.65) !important;
      cursor: pointer !important;
      transition: transform 0.15s ease, box-shadow 0.15s ease !important;
    }

    body.view-field #player .fieldMonster:hover,
    body.view-field #enemy .fieldMonster:hover,
    .fieldMonster:hover {
      transform: translateY(-3px) scale(1.03) !important;
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.8) !important;
      z-index: 15 !important;
    }

    body.view-field #player .fieldMonster.selected,
    body.view-field #enemy .fieldMonster.selected,
    .fieldMonster.selected {
      transform: translateY(-4px) scale(1.05) !important;
      outline: 2.5px solid #f4d35e !important;
      outline-offset: 1px !important;
      box-shadow: 0 0 14px rgba(244, 211, 94, 0.75), 0 8px 18px rgba(0,0,0,0.85) !important;
      z-index: 20 !important;
    }

    /* Field Monster Artwork */
    body.view-field #player .fieldArt,
    body.view-field #enemy .fieldArt,
    .fieldArt,
    .bandaiFieldArt {
      flex: 1 1 auto !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      border-radius: 4px !important;
      overflow: hidden !important;
      border: 1px solid #7a6035 !important;
      background: #000 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
    }

    /* Field Monster Image: Always top-centered and crisp */
    body.view-field #player .fieldArt img,
    body.view-field #enemy .fieldArt img,
    .fieldArt img,
    .bandaiFieldArt img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: top center !important;
      display: block !important;
      border-radius: 3px !important;
    }

    /* Field Stats Banner - Ampliado y Visible */
    body.view-field #player .fieldStats,
    body.view-field #enemy .fieldStats,
    .fieldStats {
      flex: 0 0 28px !important;
      height: 28px !important;
      min-height: 28px !important;
      max-height: 28px !important;
      width: 100% !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      background: rgba(0, 0, 0, 0.94) !important;
      border-top: 2px solid #d4af37 !important;
      border-radius: 0 0 4px 4px !important;
      font-size: 13.5px !important;
      font-weight: 900 !important;
      padding: 0 4px !important;
      box-sizing: border-box !important;
      letter-spacing: 0px !important;
      overflow: hidden !important;
    }

    body.view-field #player .fieldStats .atk,
    body.view-field #enemy .fieldStats .atk,
    .fieldStats .atk {
      color: #ff5252 !important;
      font-size: 13.5px !important;
      font-weight: 900 !important;
      text-shadow: 0 0 4px #000, 1px 1px 2px #000 !important;
      display: flex !important;
      align-items: center !important;
    }

    body.view-field #player .fieldStats .def,
    body.view-field #enemy .fieldStats .def,
    .fieldStats .def {
      color: #4da6ff !important;
      font-size: 13.5px !important;
      font-weight: 900 !important;
      text-shadow: 0 0 4px #000, 1px 1px 2px #000 !important;
      display: flex !important;
      align-items: center !important;
    }

    /* Panel de Información de Cartas - Solo en Escritorio Grande Horizontal */
    @media (min-width: 769px) and (min-height: 601px) and (orientation: landscape) {
      #cardInfoPanel, .cardInfoPanel {
        width: 250px !important;
        min-width: 230px !important;
        min-height: 180px !important;
        background: rgba(14, 11, 7, 0.95) !important;
        border: 2px solid #d4af37 !important;
        border-radius: 10px !important;
        padding: 12px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(212, 175, 55, 0.15) !important;
        z-index: 100 !important;
      }

      .cardInfoTitle {
        font-size: 16px !important;
        font-weight: bold !important;
        color: #ffd700 !important;
        letter-spacing: 2px !important;
        border-bottom: 1.5px solid #d4af37 !important;
        padding-bottom: 6px !important;
        margin-bottom: 8px !important;
        text-shadow: 1px 1px 2px #000 !important;
        text-align: center !important;
      }

      .cardInfoBody, #cardInfoBody {
        font-size: 14px !important;
        line-height: 1.45 !important;
        color: #f0f0f0 !important;
      }

      .infoName {
        font-size: 16px !important;
        font-weight: 900 !important;
        color: #ffffff !important;
        margin-bottom: 4px !important;
        text-shadow: 1px 1px 2px #000 !important;
      }

      .infoStars {
        font-size: 14px !important;
        color: #ffd700 !important;
        margin-bottom: 6px !important;
      }

      .infoGrid {
        font-size: 13.5px !important;
        gap: 5px 10px !important;
        display: grid !important;
        grid-template-columns: auto 1fr !important;
      }

      .infoGrid span {
        color: #aaa !important;
        font-weight: normal !important;
      }

      .infoGrid b {
        color: #fff !important;
        font-weight: bold !important;
      }

      .infoAtk {
        color: #ff5252 !important;
        font-size: 15px !important;
        font-weight: 900 !important;
      }

      .infoDef {
        color: #4da6ff !important;
        font-size: 15px !important;
        font-weight: 900 !important;
      }
    }

    /* Defense Position on Field: card rotates horizontally with clear blue border & defense shield */
    body.view-field #player .fieldMonster.defense,
    body.view-field #enemy .fieldMonster.defense,
    .fieldMonster.defense {
      transform: rotate(90deg) scale(0.86) !important;
      transform-origin: center center !important;
      border: 2.5px solid #29b6f6 !important;
      box-shadow: 0 0 14px rgba(41, 182, 246, 0.85), inset 0 0 10px rgba(41, 182, 246, 0.35) !important;
      background: linear-gradient(135deg, #071526, #0e294b) !important;
      position: relative !important;
    }

    body.view-field #player .fieldMonster.defense::after,
    body.view-field #enemy .fieldMonster.defense::after,
    .fieldMonster.defense::after {
      content: '🛡️ DEFENSA' !important;
      position: absolute !important;
      top: 2px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: linear-gradient(90deg, #0d47a1, #1976d2) !important;
      color: #ffffff !important;
      font-size: 8px !important;
      font-weight: 900 !important;
      padding: 1px 5px !important;
      border-radius: 4px !important;
      border: 1px solid #64b5f6 !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.85) !important;
      z-index: 15 !important;
      letter-spacing: 0.5px !important;
      pointer-events: none !important;
      white-space: nowrap !important;
    }

    body.view-field #player .fieldMonster.defense:hover,
    body.view-field #enemy .fieldMonster.defense:hover,
    .fieldMonster.defense:hover {
      transform: rotate(90deg) scale(0.92) !important;
    }

    body.view-field #player .fieldMonster.defense.selected,
    body.view-field #enemy .fieldMonster.defense.selected,
    .fieldMonster.defense.selected {
      transform: rotate(90deg) scale(0.92) !important;
      outline: 2.5px solid #f4d35e !important;
      box-shadow: 0 0 16px rgba(244, 211, 94, 0.85), inset 0 0 10px rgba(41, 182, 246, 0.5) !important;
    }

    body.view-field #player .fieldMonster.defense .fieldStats,
    body.view-field #enemy .fieldMonster.defense .fieldStats,
    .fieldMonster.defense .fieldStats {
      border-top: 1.5px solid #29b6f6 !important;
      background: rgba(6, 20, 38, 0.92) !important;
    }

    body.view-field #player .fieldMonster.defense .fieldStats .def,
    body.view-field #enemy .fieldMonster.defense .fieldStats .def,
    .fieldMonster.defense .fieldStats .def {
      color: #4fc3f7 !important;
      font-weight: 900 !important;
      text-shadow: 0 0 8px rgba(79, 195, 247, 0.95) !important;
      font-size: 1.1em !important;
    }

    body.view-field #player .fieldMonster.defense .fieldStats .atk,
    body.view-field #enemy .fieldMonster.defense .fieldStats .atk,
    .fieldMonster.defense .fieldStats .atk {
      opacity: 0.45 !important;
    }

    /* Prevent clipping on defense zones */
    body.view-field .zone:has(.fieldMonster.defense) {
      overflow: visible !important;
      z-index: 8 !important;
    }

    /* Responsive adjustments for mobile and portrait */
    @media (max-width: 768px), (orientation: portrait) {
      body.view-hand #hand {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 8px !important;
        padding: 0 4px !important;
      }
      body.view-hand #hand .zone {
        height: 215px !important;
        min-height: 215px !important;
        max-height: 215px !important;
      }
      body.view-hand #hand .card,
      .hand .card {
        height: 215px !important;
        min-height: 215px !important;
        max-height: 215px !important;
        padding: 4px !important;
      }
      body.view-hand #hand .card .cardArt,
      .hand .card .cardArt,
      body.view-hand #hand .card.spell .cardArt,
      body.view-hand #hand .card.trap .cardArt {
        height: 115px !important;
        min-height: 115px !important;
        max-height: 115px !important;
        flex: 0 0 115px !important;
      }
      body.view-hand #hand .card .cardTop .name,
      .hand .card .cardTop .name {
        font-size: 9px !important;
      }
      body.view-hand #hand .card .stats,
      .hand .card .stats {
        font-size: 8.5px !important;
        height: 20px !important;
        min-height: 20px !important;
      }
      body.view-field #player .fieldStats,
      body.view-field #enemy .fieldStats,
      .fieldStats {
        font-size: 11px !important;
        height: 22px !important;
      }
      body.view-field #player .fieldStats .atk,
      body.view-field #enemy .fieldStats .atk,
      .fieldStats .atk {
        font-size: 11px !important;
      }
      body.view-field #player .fieldStats .def,
      body.view-field #enemy .fieldStats .def,
      .fieldStats .def {
        font-size: 11px !important;
      }
      body.view-field #cardInfoPanel,
      body.view-field .cardInfoPanel,
      body.mobile-portrait #cardInfoPanel,
      body.mobile-portrait .cardInfoPanel,
      #cardInfoPanel, .cardInfoPanel {
        min-height: unset !important;
        min-width: unset !important;
        width: auto !important;
        max-width: min(440px, calc(100vw - 16px)) !important;
        max-height: 58px !important;
        height: auto !important;
        padding: 4px 8px !important;
        border-radius: 8px !important;
        border: 1.5px solid #d4af37 !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.85) !important;
        overflow-y: auto !important;
        position: fixed !important;
        top: auto !important;
        bottom: 4px !important;
        left: 8px !important;
        right: 8px !important;
        transform: none !important;
        margin: 0 auto !important;
        z-index: 9999 !important;
        background: rgba(14, 11, 7, 0.94) !important;
        box-sizing: border-box !important;
      }

      #cardInfoPanel.empty-info,
      .cardInfoPanel.empty-info,
      #cardInfoPanel:has(.mutedInfo),
      .cardInfoPanel:has(.mutedInfo),
      body.has-no-selection #cardInfoPanel,
      body.has-no-selection .cardInfoPanel,
      body.no-card-selected #cardInfoPanel,
      body.no-card-selected .cardInfoPanel,
      body.mobile-bar-active #cardInfoPanel,
      body.mobile-bar-active .cardInfoPanel {
        display: none !important;
      }
      .cardInfoTitle {
        font-size: 9px !important;
        letter-spacing: 1px !important;
        padding-bottom: 2px !important;
        margin-bottom: 2px !important;
        border-bottom: 1px solid rgba(212, 175, 55, 0.4) !important;
        text-align: left !important;
      }
      .cardInfoBody, #cardInfoBody {
        font-size: 10px !important;
        line-height: 1.25 !important;
      }
      .infoName {
        font-size: 11px !important;
        margin-bottom: 1px !important;
        display: inline-block !important;
      }
      .infoStars {
        font-size: 9px !important;
        margin-bottom: 1px !important;
        display: inline-block !important;
        margin-left: 6px !important;
      }
      .infoGrid {
        font-size: 10px !important;
        gap: 2px 8px !important;
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: wrap !important;
        align-items: center !important;
      }
      .infoAtk {
        font-size: 10.5px !important;
      }
      .infoDef {
        font-size: 10.5px !important;
      }
    }
  `;
  document.head.appendChild(style);
  // Sync duel top header title and hide redundant overlays
  function syncDuelTopHeader() {
    var topHeader = document.getElementById('duelTopHeader');
    if (topHeader) {
      var b = topHeader.querySelector('b');
      if (b) {
        if (typeof storyDuelActive !== 'undefined' && storyDuelActive && typeof storyOpponent !== 'undefined' && storyOpponent) {
          var dObj = (typeof DUELISTS !== 'undefined' && DUELISTS.find(function(x) { return x.id === storyOpponent; }));
          var dName = dObj ? dObj.name : String(storyOpponent).toUpperCase();
          b.textContent = 'MUNDO 1 · ' + dName;
        } else {
          b.textContent = 'Forbidden Memories Reborn';
        }
      }
      var mode = topHeader.querySelector('.mode');
      if (mode) mode.style.setProperty('display', 'none', 'important');
    }
    var oldHud = document.getElementById('campaignDuelHud3000');
    if (oldHud) oldHud.style.setProperty('display', 'none', 'important');
  }
  window.syncDuelTopHeader = syncDuelTopHeader;

  var prevRenderHeaderSync = window.render;
  if (typeof prevRenderHeaderSync === 'function') {
    window.render = function() {
      var r = prevRenderHeaderSync.apply(this, arguments);
      try { syncDuelTopHeader(); } catch(_) {}
      return r;
    };
    try { render = window.render; } catch(_) {}
  }

  window.addEventListener('resize', syncDuelTopHeader);
  window.addEventListener('orientationchange', syncDuelTopHeader);
  setInterval(syncDuelTopHeader, 1000);

})();



  // =========================================================================
  // SISTEMA OFICIAL DE LÍMITE DE MANO EN YU-GI-OH (MÁXIMO 6 AL FINAL DEL TURNO)
  // Durante el turno, el jugador y el rival pueden robar/tener más de 6 cartas si
  // los efectos de cartas lo permiten. Solo al finalizar el turno (End Phase) se
  // debe descartar al Cementerio hasta tener exactamente 6 cartas.
  // =========================================================================

  window.promptEndPhaseDiscard = function(cardsToDiscard, onComplete) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g || !Array.isArray(g.hand) || g.hand.length <= 6 || cardsToDiscard <= 0) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    var existingOverlay = document.getElementById('endPhaseDiscardOverlay');
    if (existingOverlay) existingOverlay.remove();

    var overlay = document.createElement('div');
    overlay.id = 'endPhaseDiscardOverlay';
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:VT323, monospace;padding:12px;box-sizing:border-box;";

    var box = document.createElement('div');
    box.style.cssText = "width:560px;max-width:95vw;background:linear-gradient(145deg, #221414, #0f0a0a);border:3px solid #ff4444;border-radius:12px;padding:20px;box-shadow:0 0 40px rgba(255,50,50,0.4);display:flex;flex-direction:column;align-items:center;box-sizing:border-box;";
    box.innerHTML = '<h3 style="color:#ff5555;font-size:26px;margin:0 0 6px;text-align:center;letter-spacing:1px;text-shadow:0 0 8px #ff2222;">LÍMITE DE MANO (END PHASE)</h3>' +
      '<p style="color:#eee;font-size:16px;margin:0 0 14px;text-align:center;line-height:1.4;">Tienes <b>' + g.hand.length + '</b> cartas en mano.<br>Debes descartar <b style="color:#ff4444;font-size:18px;">' + cardsToDiscard + '</b> carta(s) al Cementerio hasta tener exactamente 6:</p>' +
      '<div id="endPhaseHandList" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-height:50vh;overflow-y:auto;width:100%;padding:4px;box-sizing:border-box;"></div>' +
      '<div style="margin-top:16px;display:flex;gap:15px;">' +
        '<button id="btnConfirmEndPhaseDiscard" style="padding:10px 24px;background:#222;color:#888;border:2px solid #555;font-family:inherit;font-size:18px;cursor:not-allowed;border-radius:6px;transition:0.2s;" disabled>DESCARTAR AL CEMENTERIO (0/' + cardsToDiscard + ')</button>' +
      '</div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    var selectedIndices = [];
    var list = document.getElementById('endPhaseHandList');
    var btnConfirm = document.getElementById('btnConfirmEndPhaseDiscard');

    g.hand.forEach(function(hCard, idx) {
      var item = document.createElement('div');
      item.style.cssText = "width:100px;padding:8px;background:#222;border:2px solid #555;border-radius:6px;text-align:center;cursor:pointer;color:#fff;transition:0.15s;box-sizing:border-box;";
      var cName = hCard.name || hCard[0] || 'Carta';
      var num = (window.CARD_MAPPINGS && window.CARD_MAPPINGS[cName]) || 0;
      var imgSrc = (num && window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[num]) || '';
      if (!imgSrc && window.CUSTOM_LOCAL_IMAGES) {
        var dict = typeof window.getGlobalCardDict === 'function' ? window.getGlobalCardDict() : (window.CARD_MAPPINGS || {});
        var dNum = dict[cName] && dict[cName].num ? dict[cName].num : dict[cName];
        if (dNum && window.CUSTOM_LOCAL_IMAGES[dNum]) imgSrc = window.CUSTOM_LOCAL_IMAGES[dNum];
      }
      var imgH = imgSrc ? '<img src="' + imgSrc + '" style="width:72px;height:92px;object-fit:cover;border-radius:4px;border:1px solid #ffcc00;" />' : '<div style="width:72px;height:92px;background:#333;margin:auto;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:24px;color:#888;">?</div>';
      var statText = isST(hCard) ? (hCard.kind || 'MAGIA') : (hCard.atk != null ? (hCard.atk + '/' + (hCard.def || 0)) : (hCard[4] != null ? (hCard[4] + '/' + (hCard[5] || 0)) : ''));
      item.innerHTML = imgH +
        '<div style="font-size:12px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:bold;">' + cName + '</div>' +
        (statText ? '<div style="font-size:10px;color:#ffcc00;margin-top:2px;">' + statText + '</div>' : '');

      item.onclick = function() {
        if (window.playViolinClick) window.playViolinClick();
        var pos = selectedIndices.indexOf(idx);
        if (pos >= 0) {
          selectedIndices.splice(pos, 1);
          item.style.borderColor = '#555';
          item.style.background = '#222';
          item.style.boxShadow = 'none';
        } else {
          if (selectedIndices.length >= cardsToDiscard) return;
          selectedIndices.push(idx);
          item.style.borderColor = '#ff3333';
          item.style.background = '#441111';
          item.style.boxShadow = '0 0 10px #ff3333';
        }
        btnConfirm.textContent = 'DESCARTAR AL CEMENTERIO (' + selectedIndices.length + '/' + cardsToDiscard + ')';
        if (selectedIndices.length === cardsToDiscard) {
          btnConfirm.style.background = '#b30000';
          btnConfirm.style.color = '#fff';
          btnConfirm.style.borderColor = '#ff3333';
          btnConfirm.style.cursor = 'pointer';
          btnConfirm.style.boxShadow = '0 0 15px #ff2222';
          btnConfirm.disabled = false;
        } else {
          btnConfirm.style.background = '#222';
          btnConfirm.style.color = '#888';
          btnConfirm.style.borderColor = '#555';
          btnConfirm.style.cursor = 'not-allowed';
          btnConfirm.style.boxShadow = 'none';
          btnConfirm.disabled = true;
        }
      };
      list.appendChild(item);
    });

    btnConfirm.onclick = function() {
      if (selectedIndices.length !== cardsToDiscard) return;
      overlay.remove();
      selectedIndices.sort(function(a, b) { return b - a; });
      var discardedNames = [];
      selectedIndices.forEach(function(sIdx) {
        var discarded = g.hand.splice(sIdx, 1)[0];
        if (discarded) {
          g.grave.push(isST(discarded) ? Object.assign({}, discarded, { set: false, faceUp: true }) : (window.mk ? window.mk(discarded.name || discarded[0]) : discarded));
          discardedNames.push(discarded.name || discarded[0] || 'Carta');
        }
      });
      if (window.playDestroySound) window.playDestroySound();
      if (typeof render === 'function') render();
      duelToast('Descartaste ' + discardedNames.length + ' carta(s) por límite de mano.');
      if (typeof log === 'function') log('Límite de mano en End Phase: descartas ' + discardedNames.join(', ') + ' al Cementerio.');
      if (typeof onComplete === 'function') onComplete();
    };
  };

  // Override global enforceHandLimit para que no descarte durante el turno
  window.enforceHandLimit = function(side, isEndPhase) {
    if (!isEndPhase) return;
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g) return;
    var hand = side === 'enemy' ? g.enemyHand : g.hand;
    var grave = side === 'enemy' ? g.enemyGrave : g.grave;
    if (!hand || hand.length <= 6) return;
    var toDiscard = hand.length - 6;
    if (side === 'enemy') {
      while (hand.length > 6) {
        var c = hand.pop();
        if (c) {
          grave.push(isST(c) ? Object.assign({}, c, { faceUp: true, set: false }) : (window.mk ? window.mk(c.name || c[0]) : c));
          if (typeof log === 'function') log('El rival descarta ' + (c.name || c[0]) + ' al Cementerio por límite de mano.');
        }
      }
    } else {
      if (typeof window.promptEndPhaseDiscard === 'function') {
        window.promptEndPhaseDiscard(toDiscard);
      }
    }
  };
  try { enforceHandLimit = window.enforceHandLimit; } catch(_) {}

  // Interceptor de End Turn para límite de mano en End Phase y revertir efectos temporales (Change of Heart, etc.)
  var origEndTurn = window.endTurn;
  window.endTurn = function() {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g || g.turn !== 'player') return;

    // 1. REGLA OFICIAL: Si el jugador supera 6 cartas al final del turno, debe descartar interactivamente
    if (Array.isArray(g.hand) && g.hand.length > 6) {
      var needToDiscard = g.hand.length - 6;
      window.promptEndPhaseDiscard(needToDiscard, function() {
        // Al completar el descarte de la End Phase, continúa la transición de fin de turno
        window.endTurn();
      });
      return;
    }

    // 2. Reversión de efectos temporales (Change of Heart)
    if (Array.isArray(g.field)) {
      for (var fi = 0; fi < g.field.length; fi++) {
        var m = g.field[fi];
        if (m && m._changeOfHeartOriginalSide === 'enemy') {
          g.field[fi] = null;
          delete m._changeOfHeartOriginalSide;
          delete m._changeOfHeartTurn;
          var eSlot = (g.enemy || []).findIndex(function(x) { return !x; });
          if (eSlot >= 0) {
            g.enemy[eSlot] = m;
          } else {
            g.enemyGrave.push(m);
          }
          if (typeof log === 'function') log(m.name + ' regresa al control del oponente.');
        }
      }
      if (typeof render === 'function') render();
    }

    if (typeof origEndTurn === 'function') {
      return origEndTurn.apply(this, arguments);
    }
  };
  try { endTurn = window.endTurn; } catch(_) {}

  // Robo automático de inicio de turno:
  // - En turno 1: quien va primero ya tiene 5 cartas (no roba); quien va segundo roba hasta 6 cartas.
  // - En turnos subsiguientes (turnNo > 1): el jugador siempre roba al inicio de su turno hasta completar 5 cartas.
  window.startTurnDraw67 = function(side) {
    var g = (typeof game !== 'undefined' && game) ? game : window.game;
    if (!g || g.duelOver) return false;
    var hand = side === 'enemy' ? g.enemyHand : g.hand;
    var deck = side === 'enemy' ? g.enemyDeck : g.deck;
    var label = side === 'enemy' ? 'El rival' : 'Tú';
    g._turnStarts67 = g._turnStarts67 || { player: 0, enemy: 0 };
    var n = g._turnStarts67[side] || 0;
    var need = 0;
    if (g.turnNo > 1) {
      need = Math.max(0, 5 - (hand ? hand.length : 0));
    } else if (n === 0) {
      need = (g.first === side) ? 0 : Math.max(0, 6 - (hand ? hand.length : 0));
    } else {
      need = Math.max(0, 5 - (hand ? hand.length : 0));
    }
    g._turnStarts67[side] = n + 1;
    for (var k = 0; k < need; k++) {
      if (!deck || !deck.length) {
        if (typeof finishDeckOut67 === 'function') finishDeckOut67(side);
        return false;
      }
      hand.push(deck.pop());
      if (typeof render === 'function') render();
      if (typeof log === 'function') log(label + ' roba 1 carta' + (need > 1 ? ' (' + (k + 1) + '/' + need + ')' : '') + '.');
    }
    return true;
  };
  try { startTurnDraw67 = window.startTurnDraw67; } catch(_) {}
