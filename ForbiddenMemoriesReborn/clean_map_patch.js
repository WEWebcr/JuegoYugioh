// Inyectar CARDS_DATA en FMR_CARD_META y DB
(function() {
  function syncCardsData() {
    if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
      window.FMR_CARD_META = window.FMR_CARD_META || {};
      window.FMR_ST_POOL_V1 = window.FMR_ST_POOL_V1 || [];
      window.CARDS_DATA.forEach(function(c) {
        if (!c || !c.name) return;
        if (c.kind === 'MONSTER' || c.kind === 'FUSION' || (!c.kind && c.atk !== undefined)) {
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
        } else if (c.kind === 'SPELL' || c.kind === 'TRAP' || c.kind === 'EQUIP') {
          var stObj = {
            name: c.name, kind: c.kind, value: c.value || c.name.toUpperCase().replace(/\s+/g, '_'),
            text: c.text || c.desc || '', faceUp: true
          };
          if (!window.FMR_ST_POOL_V1.find(function(x){ return x && x.name === c.name; })) {
            window.FMR_ST_POOL_V1.push(stObj);
          }
          if (typeof STDB !== 'undefined' && Array.isArray(STDB) && !STDB.find(function(x){ return x && x.name === c.name; })) {
            STDB.push(stObj);
          }
        }
      });
    }
  }
  syncCardsData();
  document.addEventListener('DOMContentLoaded', syncCardsData);

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

window.persistUserSave = function(s) {
    if (!s) return;
    try {
        window.activeAccount = localStorage.getItem('FMR_ACTIVE_ACCOUNT') || window.activeAccount || null;
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
duelScaleStyle.textContent = `
    .wrap { zoom: 1.20; margin-top: 3vh !important; }
    .cardInfoPanel { transform: scale(1.15); transform-origin: center right; }

    /* VT323 size adjustments - this font renders larger than Press Start 2P */
    body, button, input, select { font-family: VT323, monospace !important; }
    .lp, #campaignDuelHud3000 { font-size: 20px !important; letter-spacing: 1px; }
    .cardInfoPanel { font-size: 15px !important; }
    .cardInfoPanel h3 { font-size: 16px !important; }
`;
document.head.appendChild(duelScaleStyle);

const portraitMap = {
    'MOTO': 'abueloYugi.jpg', 'TRISTAN_INTRO': 'DialogoSetoKaiba.png', 'TRISTAN': 'Tristan.jpg', 'WEEVIL': 'Weevil.jpeg', 'MAI': 'Mai.jpeg',
    'JOEY': 'Joey.jpeg', 'PEGASUS': 'Pegasus.jpeg', 'BAKURA': 'Bakura.jpeg', 'MARIK': 'Marik.jpeg', 'ISHIZU': 'Ishuzu.jpeg',
    'ODION': 'Odion.jpeg', 'NOAH': 'NoahKaiba.jpeg', 'KOSABURO': 'Kosaburo_Kaiba.jpeg', 'MAKO': 'mako.jpg', 'SETO': 'SetoKaiba.jpeg', 'YUGI': 'YugiMoTo.jpeg',
    'ABUELO': 'abueloYugi.jpg', 'ATEM': 'DialogoFaraom.png'
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

// Dialog renderer
window.renderCustomStoryDialog = function(lines, index, onFinish, btnText) {
    if (index === 0) window.playCustomMusic('dialogos.mp3');
    if (index >= lines.length) { if(onFinish) onFinish(); return; }
    let line = lines[index];
    let d = document.createElement('div');
    d.id = 'custom-dialog-fullscreen';
    
    let pFilename = portraitMap[line.speaker] || portraitMap['ATEM'];
    let nameOverride = pFilename === 'DialogoSetoKaiba.png' ? 'TRISTAN' : line.speaker;
    
    d.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:999999; background: url('ImagenesPersonajes/${pFilename}') center top / contain no-repeat, #000; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; cursor:pointer;`;
    
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
                onComplete(currentName, pass, email);
            } catch(e) {
                // Modo offline si no hay red
                overlay.remove();
                onComplete(currentName, pass, email);
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
        renderPS1Keyboard(async (name, pass, email) => {
            window.activeAccount = name;
            window.currentPassword = pass;
            try { sessionStorage.setItem('FMR_SESSION', JSON.stringify({ name: name, email: email, password: pass })); } catch(_) {}
            
            let ms = window.nativeAPI.freshState(name);
            ms.email = email;
            window.memorySave = ms;
            origSet('FMR_REBORN_STORY_V3000', JSON.stringify(ms));
            
            // Guardar inicial en servidor
            try {
                await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.assign({}, ms, { name: name, email: email, password: pass }))
                });
            } catch(_) {}
            
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
                let res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, password: pass })
                });
                let data = await res.json();
                if (!res.ok || data.error) {
                    msg.style.color = '#ff5555';
                    msg.textContent = data.error || 'Usuario o clave incorrecta.';
                    return;
                }
                
                let save = data.save;
                let actualName = (save && save.name) || name;
                window.activeAccount = actualName;
                window.currentPassword = pass;
                try { sessionStorage.setItem('FMR_SESSION', JSON.stringify({ name: actualName, password: pass })); } catch(_) {}
                
                window.memorySave = save;
                origSet('FMR_REBORN_STORY_V3000', JSON.stringify(save));
                
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
    btnTrade.onclick = () => { window.playViolinClick(); alert("El modo TRADE estará disponible pronto."); };
    
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
    if (window.hideDuelBoard) window.hideDuelBoard();
    if (window.nativeAPI && window.nativeAPI.showShell) window.nativeAPI.showShell();
    window.playCustomMusic('mapa.mp3');
    
    let camp = document.getElementById('campaign3000');
    if (camp) { camp.innerHTML = ''; camp.classList.add('hidden'); }
    
    // Obtenemos estado actual del save
    let s = {};
    try {
        let savedStr = origGet('FMR_SAVE_' + window.activeAccount);
        if (savedStr) s = JSON.parse(savedStr) || {};
    } catch(e) {}
    
    let cleared = Array.isArray(s.cleared) ? s.cleared.map(x => String(x).toLowerCase()) : [];
    let curActiveDeck = (s.decks && s.activeDeck && s.decks[s.activeDeck]) || s.deck || [];
    let activeDeckCount = curActiveDeck ? curActiveDeck.length : 40;
    
    const MILLENNIUM_ITEMS = window.getMillenniumItems(s);
    const unlockedCount = MILLENNIUM_ITEMS.filter(it => it.unlocked).length;
    
    // Contenedor principal del Mapa con imagen de ruinas egipcias
    let map = document.createElement('div');
    map.id = 'map-container-overlay';
    map.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:999999; background: linear-gradient(180deg, rgba(8,5,2,0.72) 0%, rgba(18,12,5,0.84) 100%), url("ImagenesPersonajes/PortadaPrincipal.jpeg") center center / cover no-repeat, #0a0600; overflow:hidden; font-family:"Segoe UI", sans-serif;';
    
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
    topBar.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:62px; background:linear-gradient(180deg, rgba(10,6,2,0.96) 0%, rgba(22,14,5,0.92) 80%, rgba(22,14,5,0) 100%); border-bottom:2px solid #b8860b; box-shadow:0 4px 20px rgba(0,0,0,0.85); z-index:100; display:flex; align-items:center; justify-content:space-between; padding:0 16px; box-sizing:border-box;';
    
    // 1.1 Left: Título y Logo
    let brandWrap = document.createElement('div');
    brandWrap.style.cssText = 'display:flex; align-items:center; gap:10px; cursor:pointer;';
    brandWrap.innerHTML = `
        <div style="font-size:26px; filter:drop-shadow(0 0 8px #ffd700); line-height:1;">☥</div>
        <div>
            <div style="font-family:'Cinzel', serif, 'Times New Roman'; font-size:15px; font-weight:900; color:#ffd700; letter-spacing:1.5px; text-shadow:0 2px 6px rgba(0,0,0,0.8);">CAMPAÑA · EL REINO DE LOS DUELOS</div>
            <div style="font-size:10px; color:#d4af37; letter-spacing:1px; font-family:'Segoe UI', sans-serif;">Ruta Sagrada hacia la Puerta del Nuevo Mundo</div>
        </div>
    `;
    topBar.appendChild(brandWrap);
    
    // 1.2 Center: Mini Barra de los 7 Artículos del Milenio
    let relicsBar = document.createElement('div');
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
    map.appendChild(svg);
    
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
                        <div style="position:absolute; top:-16px; background:linear-gradient(135deg, #1b4d2e, #2e7d32); color:#d4edda; border:1.5px solid #a3e9a4; border-radius:12px; padding:2px 7px; font-size:10px; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.85); white-space:nowrap; display:flex; align-items:center; gap:3px; z-index:25;">
                            <span>✨</span> <span>${n.itemIcon} RECUPERADO</span>
                        </div>
                    `;
                } else if (isUnlocked) {
                    relicBadgeHtml = `
                        <div style="position:absolute; top:-18px; background:linear-gradient(135deg, #b8860b, #ffd700); color:#000; border:1.5px solid #fff; border-radius:12px; padding:2px 8px; font-size:10px; font-weight:900; box-shadow:0 0 12px rgba(255,215,0,0.9); white-space:nowrap; display:flex; align-items:center; gap:3px; z-index:25; animation:relicBadgePulse 1.8s infinite ease-in-out;">
                            <span>${n.itemIcon}</span> <span>${n.itemName.toUpperCase()}</span>
                        </div>
                    `;
                } else {
                    relicBadgeHtml = `
                        <div style="position:absolute; top:-14px; background:rgba(25,16,5,0.85); color:#b8860b; border:1px solid #7c5a14; border-radius:10px; padding:2px 6px; font-size:9px; white-space:nowrap; display:flex; align-items:center; gap:3px; z-index:25;">
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
                <div style="width:70px; height:70px; border-radius:50%; ${borderStyle} overflow:hidden; box-shadow:0 0 16px rgba(0,0,0,0.8); background:#000; position:relative; ${filterStyle}">
                    <img src="ImagenesPersonajes/${p}" style="width:100%; height:100%; object-fit:cover; object-position:top;" onerror="this.src='https://i.imgur.com/vHqR8Kq.png'">
                    ${isCleared ? '<div style="position:absolute; inset:0; background:rgba(46,125,50,0.22); pointer-events:none;"></div>' : ''}
                </div>
                <div style="background:rgba(8,5,2,0.9); border:1.5px solid ${isCleared ? '#2e7d32' : (isUnlocked ? '#d4af37' : '#554015')}; padding:3px 8px; border-radius:6px; color:${isCleared ? '#a3e9a4' : (isUnlocked ? '#fff' : '#887755')}; font-size:12px; font-family:VT323, monospace; letter-spacing:1px; text-shadow:2px 2px 0 #000; white-space:nowrap;">
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
                if (rematchChoice && window.openFreeDuelMenu) {
                    window.openFreeDuelMenu();
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
                if (window.playViolinClick) window.playViolinClick();
                modal.remove();
                
                let startDuelFn = (window.nativeAPI && window.nativeAPI.beginStoryDuel) || window.beginStoryDuel;
                if (startDuelFn) {
                    window.lastDuelOpponent = n.char.toLowerCase();
                    
                    let introLines = [{ role: 'system', speaker: n.char.toUpperCase(), text: '¡Prepárate para el duelo!' }];
                    if (n.char.toLowerCase() === 'tristan') {
                        introLines = [{ role: 'system', speaker: 'TRISTAN_INTRO', text: '¡Bienvenido a tu primer duelo real! Veamos de qué estás hecho.' }];
                    } else if (n.char.toLowerCase() === 'mako') {
                        introLines = [{ role: 'system', speaker: 'MAKO', text: '¡Siente la furia de las olas y el poder del gran océano! ¡Nadie derrota a Mako Tsunami en su propio elemento!' }];
                    } else if (n.char.toLowerCase() === 'kosaburo') {
                        introLines = [{ role: 'system', speaker: 'KOSABURO', text: '¡Yo soy Kosaburo Kaiba! El verdadero poder de Exodia yace en mi cementerio. ¡Contempla la fuerza imparable de Exodia Necross!' }];
                    } else if (n.char.toLowerCase() === 'yugi') {
                        introLines = [{ role: 'system', speaker: 'YUGI', text: '¡Has llegado al duelo supremo! El Rompecabezas del Milenio y el poder de los Dioses Egipcios decidirán el destino. ¡Es hora del Duelo!' }];
                    }
                    
                    window.playCustomMusic('dialogos.mp3');
                    window.renderCustomStoryDialog(introLines, 0, () => {
                        map.remove();
                        if (window.showDuelBoard) window.showDuelBoard(); 
                        startDuelFn(n.char.toLowerCase());
                        
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
        
        map.appendChild(btn);
    });
    
    document.body.appendChild(map);
};
window.openFreeDuelMenu = function() {
    let mapOverlay = document.getElementById('map-container-overlay');
    if (mapOverlay) mapOverlay.style.display = 'none';
    
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
            if (saved && saved.cleared) cleared = saved.cleared; 
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
                overlay.remove();
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
        msg.innerHTML = 'Aún no has derrotado a ningún oponente.';
        msg.style.cssText = 'color: #fff; font-family: VT323, monospace; font-size: 16px; margin-top: 50px;';
        grid.appendChild(msg);
    }
    
    overlay.appendChild(grid);
    
    let backBtn = document.createElement('button');
    backBtn.textContent = 'VOLVER A LA TIENDA';
    backBtn.style.cssText = 'margin-top: 50px; background: rgba(0,0,0,0.8); border: 3px solid #c4a04d; color: #fceea4; padding: 15px 30px; font-weight: bold; cursor: pointer; border-radius: 8px; font-family:VT323, monospace; font-size:16px;';
    backBtn.onmouseover = window.playHoverSound;
    backBtn.onclick = () => {
        window.playViolinClick();
        overlay.remove();
        if (window.openCustomShopMenu) window.openCustomShopMenu();
    };
    overlay.appendChild(backBtn);
    
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
    // --- MONSTRUOS NEUTROS DE ALTO PODER (SIN DIOSES NI CARTAS ICÓNICAS) ---
    { name: 'Gate Guardian', price: 70000, tier: 'LEVIATÁN', desc: 'Guardián del laberinto legendario con 3750 ATK / 3400 DEF. Poder aplastante en combate.' },
    { name: 'Cosmo Queen', price: 60000, tier: 'REINA CÓSMICA', desc: 'Reina soberana del cosmos con 2900 ATK / 2450 DEF.' },
    { name: 'Twin-Headed Thunder Dragon', price: 52000, tier: 'TRUENO FUSIÓN', desc: 'Dragón trueno bicéfalo con 2800 ATK / 2100 DEF. El pilar legendario de Forbidden Memories.' },
    { name: 'Wingweaver', price: 48000, tier: 'HADA SUPREMA', desc: 'Hada guerrera de seis alas con 2750 ATK / 2400 DEF.' },
    { name: 'Skull Knight', price: 44000, tier: 'CABALLERO OSCURO', desc: 'Caballero hechicero con 2650 ATK / 2250 DEF. Uno de los mayores atacantes neutrales.' },
    { name: 'Sanga of the Thunder', price: 40000, tier: 'ELEMENTAL TRUENO', desc: 'Espíritu ancestral del rayo con 2600 ATK / 2200 DEF.' },
    { name: 'Ryu Senshi', price: 36000, tier: 'GUERRERO DRAGÓN', desc: 'Guerrero fusionado implacable con 2600 ATK / 2200 DEF.' },
    { name: 'Suijin', price: 35000, tier: 'ELEMENTAL AGUA', desc: 'Guardián acuático ancestral con 2500 ATK / 2400 DEF.' },
    { name: 'Cyber-Tech Alligator', price: 34000, tier: 'MÁQUINA CIBER', desc: 'Caimán cibernético mejorado con 2500 ATK / 1600 DEF.' },
    { name: 'Super Roboyarou', price: 33000, tier: 'MÁQUINA FUSIÓN', desc: 'Robot combatiente blindado con 2500 ATK / 1800 DEF.' },
    { name: 'Kazejin', price: 32000, tier: 'ELEMENTAL VIENTO', desc: 'Guardián del viento ancestral con 2400 ATK / 2200 DEF.' },
    { name: 'Sword Hunter', price: 30000, tier: 'CAZADOR DE ESPADAS', desc: 'Guerrero recolector de armas enemigas con 2450 ATK / 1700 DEF.' },
    { name: 'Goblin Attack Force', price: 28000, tier: 'FUERZA DE ÉLITE', desc: 'Fuerza de asalto de nivel 4 con un demoledor ataque de 2300 ATK.' },
    { name: 'Luster Dragon #2', price: 27000, tier: 'DRAGÓN BRILLANTE', desc: 'Majestuoso dragón esmeralda con 2400 ATK / 1400 DEF.' },
    { name: 'Crimson Sunbird', price: 24000, tier: 'AVE DE FUEGO', desc: 'Fénix carmesí solar con 2300 ATK / 1800 DEF.' },
    { name: 'The Fiend Megacyber', price: 22000, tier: 'GUERRERO CIBER', desc: 'Guerrero cibernético que refuerza el campo con 2200 ATK / 1200 DEF.' },
    { name: 'Flame Cerebrus', price: 20000, tier: 'BESTIA DE FUEGO', desc: 'Can cerbero llameante con 2100 ATK / 1800 DEF.' },
    { name: 'B. Dragon Jungle King', price: 20000, tier: 'DRAGÓN SELVÁTICO', desc: 'Dragón selvático venenoso con 2100 ATK / 1800 DEF.' },
    { name: 'Mystical Sand', price: 18000, tier: 'ROCA MÍSTICA', desc: 'Hechicera de arena y piedra con 2100 ATK / 1700 DEF.' },
    { name: 'Giant Rex', price: 16000, tier: 'DINOSAURIO', desc: 'Tiranosaurio jurásico prehistórico con 2000 ATK / 1200 DEF.' },

    // --- MAGIAS DEVASTADORAS ---
    { name: 'Raigeki', price: 65000, tier: 'MAGIA DEVASTADORA', desc: 'Invoca un rayo colosal que destruye todos los monstruos en el campo del oponente.' },
    { name: 'Renace al Monstruo', price: 55000, tier: 'MAGIA SAGRADA', desc: 'Revive de modo especial cualquier monstruo caído en el cementerio.' },
    { name: 'Pot of Greed', price: 46000, tier: 'MAGIA DE ROBO', desc: 'Otorga una inmensa ventaja robando 2 cartas adicionales de tu mazo.' },
    { name: 'Swords of Revealing Light', price: 42000, tier: 'MAGIA DE CONTROL', desc: 'Espadas de luz sagrada que bloquean todos los ataques del oponente durante 3 turnos.' },
    { name: 'Change of Heart', price: 38000, tier: 'MAGIA DE CONTROL', desc: 'Toma el control del monstruo más poderoso del oponente.' },
    { name: 'Dark Hole', price: 35000, tier: 'MAGIA DESTRUCTIVA', desc: 'Vórtice abisal que absorbe y destruye a todos los monstruos en el campo.' },
    { name: 'Axe of Despair', price: 25000, tier: 'EQUIPO PODEROSO', desc: 'Hacha maldita que otorga +1000 ATK de forma permanente al monstruo equipado.' },
    { name: 'Dragon Treasure', price: 14000, tier: 'EQUIPO DRAGÓN', desc: 'Tesoro ancestral que incrementa el ATK y la DEF de un dragón en +500 puntos.' },

    // --- TRAMPAS CRÍTICAS ---
    { name: 'Mirror Force', price: 58000, tier: 'TRAMPA REFLEJO', desc: 'Fuerza de espejo que destruye a todos los monstruos en posición de ataque del rival al ser atacado.' },
    { name: 'Magic Cylinder', price: 38000, tier: 'TRAMPA REFLEJO', desc: 'Anula el ataque enemigo y drena directamente los LP del oponente con el ATK de su monstruo.' },
    { name: 'Negate Attack', price: 26000, tier: 'TRAMPA DEFENSA', desc: 'Niega el ataque enemigo y finaliza la fase de batalla inmediatamente.' },
    { name: 'Sakuretsu Armor', price: 22000, tier: 'TRAMPA DESTRUCCIÓN', desc: 'Armadura explosiva que aniquila instantáneamente al monstruo que declare un ataque.' },
    { name: 'Waboku', price: 19000, tier: 'TRAMPA DEFENSA', desc: 'El jugador no recibe ningún daño por combate durante este turno.' },
    { name: 'Trap Hole', price: 15000, tier: 'TRAMPA CLÁSICA', desc: 'Agujero trampa que destruye inmediatamente a cualquier monstruo invocado con 1000+ ATK.' }
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
    
    // Check known special monsters first (Gate Guardian, Sanga, Suijin, Kazejin)
    const KNOWN_SPECIAL_MONSTERS = {
        'Gate Guardian': { type: 'Warrior', attr: 'DARK', atk: 3750, def: 3400, desc: 'Guardián del laberinto legendario con 3750 ATK / 3400 DEF. Poder aplastante en combate.' },
        'Sanga of the Thunder': { type: 'Thunder', attr: 'LIGHT', atk: 2600, def: 2200, desc: 'Espíritu ancestral del rayo con 2600 ATK / 2200 DEF.' },
        'Suijin': { type: 'Aqua', attr: 'WATER', atk: 2500, def: 2400, desc: 'Guardián acuático ancestral con 2500 ATK / 2400 DEF.' },
        'Kazejin': { type: 'Spellcaster', attr: 'WIND', atk: 2400, def: 2200, desc: 'Guardián del viento ancestral con 2400 ATK / 2200 DEF.' }
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
    
    // Check CARDS_DATA / FMR_CARD_META
    if (window.FMR_CARD_META && window.FMR_CARD_META[name]) {
        let m = window.FMR_CARD_META[name];
        return {
            name: m.name, num: num, imgUrl: imgUrl,
            type: m.type || 'Monstruo', attr: m.attr || 'TIERRA',
            atk: m.atk !== undefined ? m.atk : 0,
            def: m.def !== undefined ? m.def : 0,
            isMonster: true, isSpell: false, isTrap: false,
            desc: m.desc || m.text || ''
        };
    }
    // Check CARDS_DATA array directly
    if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
        let cd = window.CARDS_DATA.find(x => x && x.name === name);
        if (cd) {
            let cardImg = cd.image || imgUrl;
            let cardNum = cd.id || num;
            if (cd.kind === 'MONSTER' || cd.atk !== undefined) {
                return {
                    name: cd.name, num: cardNum, imgUrl: cardImg,
                    type: cd.type || 'Monstruo', attr: cd.attr || 'TIERRA',
                    atk: cd.atk !== undefined ? cd.atk : 0,
                    def: cd.def !== undefined ? cd.def : 0,
                    isMonster: true, isSpell: false, isTrap: false,
                    desc: cd.text || cd.desc || ''
                };
            } else {
                return {
                    name: cd.name, num: cardNum, imgUrl: cardImg,
                    type: cd.kind || 'MAGIA', attr: '-',
                    atk: '-', def: '-',
                    isMonster: false, isSpell: cd.kind === 'SPELL', isTrap: cd.kind === 'TRAP',
                    desc: cd.text || cd.desc || ''
                };
            }
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
    
    let oppDeck = window.CHARACTER_DECKS && window.CHARACTER_DECKS[oppId];
    let oppDisplayName = (oppDeck && oppDeck.name) || OPPONENT_NAMES[oppId] || oppId.toUpperCase();
    let cardPool = [];
    if (oppDeck && Array.isArray(oppDeck.cards)) {
        cardPool = [...new Set(oppDeck.cards)];
    }
    if (cardPool.length === 0) {
        cardPool = ['Dark Magician', 'Blue-Eyes White Dragon', 'Summoned Skull', 'Red-Eyes Black Dragon', 'Celtic Guardian'];
    }
    
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
        badge.innerHTML = `Posees: <b style="color:#fff;">${ownCount}</b> / 3`;
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
    leftSide.style.cssText = 'width: 320px; display:flex; flex-direction:column; margin-right: 20px; border-right: 2px solid #333; padding-right: 20px;';
    
    let previewImgWrap = document.createElement('div');
    previewImgWrap.style.cssText = 'width:100%; height: 460px; border: 3px solid #ffd700; border-radius: 8px; background: #000; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);';
    
    let previewImg = document.createElement('img');
    previewImg.src = 'https://i.imgur.com/vHqR8Kq.png';
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:contain; background:#000;';
    previewImgWrap.appendChild(previewImg);
    
    let previewText = document.createElement('div');
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
    
    let filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex; gap:10px; margin-bottom: 12px; align-items:center;';
    filterBar.innerHTML = `
        <input type="text" id="shop-search" placeholder="Buscar por nombre..." autocomplete="off" style="padding: 8px 14px; border-radius: 6px; border: 1px solid #555; background: #222; color: #fff; font-family:'Segoe UI'; width: 240px; font-size: 14px;">
        <select id="shop-filter-type" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; font-size: 14px;">
            <option value="">Todas las cartas (${POWERFUL_SHOP_CARDS.length})</option>
            <option value="MONSTER">Solo Monstruos</option>
            <option value="SPELL">Solo Magias</option>
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
        
        let activeShopCards = [...POWERFUL_SHOP_CARDS];
        let existingNames = new Set(activeShopCards.map(c => c.name.toLowerCase()));
        if (window.CARDS_DATA && Array.isArray(window.CARDS_DATA)) {
            window.CARDS_DATA.forEach(c => {
                if (c && c.name && c.price && c.price > 0 && !existingNames.has(c.name.toLowerCase())) {
                    activeShopCards.push({
                        name: c.name,
                        price: parseInt(c.price),
                        tier: c.tier || (c.kind === 'MONSTER' ? (c.atk >= 2500 ? 'ÉLITE ADMIN' : 'TIENDA') : 'MAGIA/TRAMPA'),
                        desc: c.text || c.desc || (c.kind === 'MONSTER' ? `Monstruo ${c.type || ''} (ATK ${c.atk || 0} / DEF ${c.def || 0})` : 'Efecto especial')
                    });
                    existingNames.add(c.name.toLowerCase());
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
            if (fType === 'MONSTER' && !info.isMonster) return;
            if (fType === 'SPELL' && !info.isSpell) return;
            if (fType === 'TRAP' && !info.isTrap) return;
            
            let ownCount = s.collection[item.name] || 0;
            let inDeck = counts[item.name] || 0;
            let canBuy = (s.pm >= item.price) && (ownCount < 3);
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
                        En Colección: <b style="color:#fff;">${ownCount}</b>/3 · En tu Deck: <b style="color:#81c784;">${inDeck}</b>
                    </div>
                `;
            };
            tr.onmouseout = () => tr.style.background = 'transparent';
            
            let statDisplay = info.isMonster ? `<span style="color:#ff5252; font-weight:bold;">${info.atk}</span> / <span style="color:#2196f3; font-weight:bold;">${info.def}</span>` : `<span style="color:#aaa; font-size:12px;">${item.tier}</span>`;
            
            tr.innerHTML = `
                <td style="padding: 10px 12px; color: #888;">#${String(info.num).replace(/[^\d]/g, '').padStart(3, '0')}</td>
                <td style="padding: 10px 12px; font-weight: bold; color: ${cardColor};">${info.name}</td>
                <td style="padding: 10px 12px; font-size:13px;">${info.type}</td>
                <td style="padding: 10px 12px;">${statDisplay}</td>
                <td style="padding: 10px 12px; text-align:center; font-weight:bold; color:#ffd700;">${item.price} PM</td>
                <td style="padding: 10px 12px; text-align:center; font-weight:bold;">
                    <span style="color:${ownCount > 0 ? '#fff' : '#666'}">${ownCount}/3</span>
                </td>
                <td style="padding: 10px 12px; text-align:center; font-weight:bold;">
                    <span style="color:${inDeck > 0 ? '#81c784' : '#666'}">${inDeck}</span>
                </td>
                <td style="padding: 10px 12px; text-align:center; white-space:nowrap;">
                    <button class="shop-buy-btn" style="background:${canBuy ? 'linear-gradient(180deg, #ffd700, #b8860b)' : '#444'}; color:${canBuy ? '#000' : '#888'}; border:none; padding:7px 12px; border-radius:4px; font-weight:bold; font-size:12px; cursor:${canBuy ? 'pointer' : 'not-allowed'}; margin-right:5px;">
                        ${ownCount >= 3 ? 'MÁXIMO' : s.pm < item.price ? 'SIN PM' : '🛒 COMPRAR'}
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
                50% { transform: translateY(-10px) rotate(0.4deg); }
            }
            @keyframes grandpaBounce {
                0% { transform: scale(1) translateY(0); }
                30% { transform: scale(1.08) translateY(-22px); }
                60% { transform: scale(0.96) translateY(5px); }
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
                padding: 12px 18px;
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
            }
            .shop-interactive-btn::before {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 5px; height: 100%;
                background: #ffd700;
                transition: width 0.18s ease;
            }
            .shop-interactive-btn:hover {
                transform: translateX(8px);
                border-color: #ffd700;
                background: linear-gradient(90deg, #442f10 0%, #201305 100%);
                box-shadow: 0 0 16px rgba(255, 215, 0, 0.5);
            }
            .shop-interactive-btn:hover::before {
                width: 10px;
            }
            .millennium-pedestal {
                transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer;
            }
            .millennium-pedestal:hover {
                transform: translateY(-6px) scale(1.08);
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
    topBar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px 28px; background:linear-gradient(180deg, rgba(20,15,8,0.95) 0%, rgba(10,8,4,0.7) 100%); border-bottom:2px solid #b8860b; box-shadow:0 4px 15px rgba(0,0,0,0.6); z-index:10;';
    topBar.innerHTML = `
        <div style="display:flex; align-items:center; gap:14px;">
            <span style="font-size:26px; filter:drop-shadow(0 0 6px #ffd700);">🏺</span>
            <div>
                <div style="font-family:VT323, monospace; color:#ffd700; font-size:28px; letter-spacing:2px; text-shadow:2px 2px 0 #000, 0 0 10px rgba(255,215,0,0.5);">
                    KAME GAME · TIENDA DEL ABUELO MOTO
                </div>
                <div style="font-size:12px; color:#c7a76d; letter-spacing:0.5px;">Bazar Ancestral de Cartas y Reliquias Milenarias</div>
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
            <div style="background:#201608; border:1px solid #ffd700; border-radius:6px; padding:6px 14px; display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">💰</span>
                <span style="color:#aaa; font-size:12px; font-weight:bold;">PM:</span>
                <span style="color:#ffd700; font-weight:bold; font-size:16px; font-family:VT323, monospace;" id="shop-menu-pm">${s.pm || 0}</span>
            </div>
            <div style="background:#16202d; border:1px solid #4a90e2; border-radius:6px; padding:6px 14px; display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">🎴</span>
                <span style="color:#aaa; font-size:12px; font-weight:bold;">DECK ACTIVO:</span>
                <span style="color:#66c0f4; font-weight:bold; font-size:13px;">${(s.activeDeck || 'Deck 1').toUpperCase()}</span>
                <span style="background:#0d47a1; color:#fff; font-size:11px; padding:2px 6px; border-radius:3px;">${activeDeckCount}/40</span>
            </div>
            <div style="background:#281c00; border:1px solid #b8860b; border-radius:6px; padding:6px 14px; display:flex; align-items:center; gap:8px;" title="Artículos del Milenio en tu poder">
                <span style="font-size:16px;">✨</span>
                <span style="color:#ffd700; font-size:12px; font-weight:bold;">MILENIO:</span>
                <span style="color:#fff; font-weight:bold; font-size:13px;">${unlockedCount} / 7</span>
            </div>
        </div>
    `;
    overlay.appendChild(topBar);

    // 2. MIDDLE WORKSPACE (Left: Grandpa Moto with Speech Bubble, Right: Action Menu)
    let workspace = document.createElement('div');
    workspace.style.cssText = 'flex: 1; display:flex; flex-direction:row; padding:10px 40px 0 40px; box-sizing:border-box; overflow:hidden; position:relative; align-items:center; justify-content:space-between;';

    // LEFT: GRANDPA MOTO + SPEECH BUBBLE
    let grandpaWrap = document.createElement('div');
    grandpaWrap.style.cssText = 'flex: 1; height: 100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; position:relative; max-width: 520px;';

    // Speech bubble
    let bubble = document.createElement('div');
    bubble.id = 'grandpa-speech-bubble';
    bubble.style.cssText = 'position:absolute; top: 15px; left: 10px; right: 10px; background: linear-gradient(135deg, #2b2010 0%, #181208 100%); border: 2px solid #ffd700; border-radius: 14px; padding: 14px 18px; box-shadow: 0 8px 25px rgba(0,0,0,0.8), 0 0 15px rgba(255,215,0,0.25); z-index: 5; transition: all 0.25s ease; min-height: 58px; display:flex; flex-direction:column; justify-content:center;';
    
    // Bubble pointer tail
    let bubbleTail = document.createElement('div');
    bubbleTail.style.cssText = 'position:absolute; bottom:-12px; left:50%; margin-left:-10px; width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-top:12px solid #ffd700;';
    bubble.appendChild(bubbleTail);

    let bubbleTitle = document.createElement('div');
    bubbleTitle.style.cssText = 'font-weight:bold; font-size:12px; color:#ffd700; font-family:VT323, monospace; letter-spacing:1px; margin-bottom:4px; display:flex; align-items:center; gap:6px;';
    bubbleTitle.innerHTML = '<span>👴 ABUELO MOTO DICE:</span>';
    bubble.appendChild(bubbleTitle);

    let bubbleText = document.createElement('div');
    bubbleText.id = 'grandpa-speech-text';
    bubbleText.style.cssText = 'font-size:14px; color:#fff; line-height:1.4; transition: opacity 0.15s ease; font-style:italic;';
    bubbleText.textContent = '¡Bienvenido a Kame Game, duelista! ¿En qué puedo ayudarte hoy para forjar tu destino?';
    bubble.appendChild(bubbleText);

    grandpaWrap.appendChild(bubble);

    // Warm radial aura behind Grandpa Moto
    let auraGlow = document.createElement('div');
    auraGlow.style.cssText = 'position:absolute; bottom: 0; width: 440px; height: 440px; background: radial-gradient(circle, rgba(255, 190, 40, 0.28) 0%, rgba(255, 140, 0, 0.12) 45%, rgba(0,0,0,0) 75%); border-radius: 50%; pointer-events:none; z-index: 1;';
    grandpaWrap.appendChild(auraGlow);

    // Grandpa Moto Image (Interactive + Breathing animation)
    let grandpaImg = document.createElement('img');
    grandpaImg.src = 'ImagenesPersonajes/abueloYugi.jpg';
    grandpaImg.alt = 'Abuelo Moto';
    grandpaImg.style.cssText = 'height: 58vh; max-height: 520px; object-fit: contain; z-index: 2; cursor: pointer; filter: drop-shadow(0 0 20px rgba(255, 180, 0, 0.45)); animation: grandpaFloat 3.8s ease-in-out infinite; transition: transform 0.2s ease;';
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
    clickHint.style.cssText = 'font-size:11px; color:#ffd700; background:rgba(0,0,0,0.7); border:1px solid #b8860b; border-radius:12px; padding:3px 12px; margin-bottom:8px; z-index:3; cursor:pointer; font-weight:bold; box-shadow:0 2px 6px #000;';
    clickHint.textContent = '💬 ¡Haz clic en el Abuelo!';
    clickHint.onclick = grandpaImg.onclick;
    grandpaWrap.appendChild(clickHint);

    workspace.appendChild(grandpaWrap);

    // RIGHT: INTERACTIVE NAVIGATION BUTTONS
    let rightSide = document.createElement('div');
    rightSide.style.cssText = 'flex: 1; display:flex; flex-direction:column; justify-content:center; align-items:flex-end; max-width: 520px; z-index: 4;';

    let btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex; flex-direction:column; gap: 11px; width: 100%; max-width: 440px;';

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
            <span style="font-size:20px; filter:drop-shadow(0 0 4px #ffd700);">${opt.icon}</span>
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:14px; color:#ffd700; font-family:VT323, monospace; letter-spacing:1.5px; text-shadow:1px 1px 0 #000;">${opt.label}</div>
                <div style="font-size:11px; color:#aaa; font-weight:normal; margin-top:2px;">${opt.desc}</div>
            </div>
            <span style="font-size:12px; color:#888;">▶</span>
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
    showcaseBar.style.cssText = 'background: linear-gradient(180deg, rgba(15,11,6,0.95) 0%, rgba(28,20,10,0.98) 100%); border-top: 2px solid #b8860b; padding: 10px 24px 14px 24px; box-shadow: 0 -6px 20px rgba(0,0,0,0.7); z-index: 10; display:flex; flex-direction:column; gap:8px;';

    let showcaseHeader = document.createElement('div');
    showcaseHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-family:VT323, monospace; font-size:16px; color:#ffd700; letter-spacing:1px;';
    showcaseHeader.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
            <span>🏺</span>
            <span>VITRINA DE RELIQUIAS SAGRADAS · 7 ARTÍCULOS DEL MILENIO</span>
            <span style="background:#3a2800; border:1px solid #ffd700; color:#fff; font-size:13px; padding:2px 8px; border-radius:4px;">
                ${unlockedCount} / 7 RECUPERADOS
            </span>
        </div>
        <div style="font-size:13px; color:#c7a76d; font-family:'Segoe UI', sans-serif;">Pasa el ratón o haz clic sobre un artículo para desvelar sus secretos antiguos</div>
    `;
    showcaseBar.appendChild(showcaseHeader);

    let itemsGrid = document.createElement('div');
    itemsGrid.style.cssText = 'display:flex; justify-content:space-around; align-items:center; gap:12px; flex-wrap:nowrap; overflow-x:auto; padding:4px 0;';

    MILLENNIUM_ITEMS.forEach(it => {
        let pedestal = document.createElement('div');
        pedestal.className = 'millennium-pedestal';
        pedestal.style.cssText = `flex: 1; min-width: 120px; max-width: 165px; height: 95px; background: ${it.unlocked ? 'linear-gradient(180deg, #332408 0%, #1a1204 100%)' : '#141416'}; border: 1.5px solid ${it.unlocked ? '#ffd700' : '#444'}; border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 6px; box-sizing:border-box; position:relative; box-shadow: ${it.unlocked ? '0 0 12px rgba(255, 215, 0, 0.25)' : 'none'}; opacity: ${it.unlocked ? '1' : '0.55'};`;

        // SVG Render
        let svgContainer = document.createElement('div');
        svgContainer.style.cssText = 'width: 48px; height: 48px; display:flex; align-items:center; justify-content:center; filter:' + (it.unlocked ? 'drop-shadow(0 0 6px #ffd700)' : 'grayscale(100%) opacity(40%)') + ';';
        svgContainer.innerHTML = `<svg viewBox="0 0 100 100" style="width:100%; height:100%;">${it.svgPath}</svg>`;
        pedestal.appendChild(svgContainer);

        // Name
        let nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-weight:bold; font-size:11px; color:' + (it.unlocked ? '#ffd700' : '#888') + '; margin-top:4px; text-align:center; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; width:100%;';
        nameEl.textContent = it.shortName;
        pedestal.appendChild(nameEl);

        // Badge
        let badgeEl = document.createElement('div');
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
    
    // Set duelOver flag so native engine doesn't loop
    if (typeof game !== 'undefined' && game) game.duelOver = true;
    window.storyDuelActive = false;
    
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
    }
    if (window.nativeAPI.showShell) window.nativeAPI.showShell();
    
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
        window.renderCustomStoryDialog(lossLines, 0, () => window.customShowMap());
    } else {
        s.wins = s.wins || {};
        s.wins[id] = (s.wins[id] || 0) + 1;
        if (!(s.cleared || []).includes(id)) s.cleared.push(id);
        if (!s.unlocked) s.unlocked = [];
        if (!s.unlocked.includes(id)) s.unlocked.push(id);
        
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
                        window.showMillenniumItemCelebration(wonItem, id, () => window.customShowMap());
                    } else {
                        window.customShowMap();
                    }
                } else {
                    window.customShowMap();
                }
            });
        });
    }
};

// endObserver removed to allow native finishStoryDuel hook to take over

window.customShowDeckEditor = function() {
    let saveKey = window.activeAccount ? ('FMR_SAVE_' + window.activeAccount) : 'FMR_REBORN_STORY_V3000';
    let sStr = origGet(saveKey) || origGet('FMR_REBORN_STORY_V3000');
    if (!sStr) return;
    let s = JSON.parse(sStr);
    
    const DEF = window.DEFAULT_DECK || [
      'Celtic Guardian','Celtic Guardian','Beaver Warrior','Beaver Warrior','Battle Ox','Battle Ox','Mystical Elf','Mystical Elf',
      'Feral Imp','Feral Imp','Winged Dragon, Guardian of the Fortress #1','Winged Dragon, Guardian of the Fortress #1',
      'Petit Dragon','Petit Dragon','Baby Dragon','Baby Dragon','Giant Soldier of Stone','Giant Soldier of Stone','Man-Eater Bug','Man-Eater Bug',
      'Silver Fang','Silver Fang','Flame Manipulator','Flame Manipulator',
      'Black Pendant','Black Pendant','Dragon Treasure','Dragon Treasure','Horn of the Unicorn','Horn of the Unicorn',
      'Waboku','Waboku','Trap Hole','Trap Hole','Dust Tornado','Dust Tornado','Sakuretsu Armor','Sakuretsu Armor','Renace al Monstruo','Negate Attack'
    ];
    
    s.collection = s.collection || {};
    s.decks = s.decks || {};
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
    leftSide.style.cssText = 'width: 320px; display:flex; flex-direction:column; margin-right: 20px; border-right: 2px solid #333; padding-right: 20px;';
    
    let previewImgWrap = document.createElement('div');
    previewImgWrap.style.cssText = 'width:100%; height: 460px; border: 3px solid #a67c00; border-radius: 8px; background: #000; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 15px #000;';
    
    let previewImg = document.createElement('img');
    previewImg.src = 'https://i.imgur.com/vHqR8Kq.png';
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:contain; background:#000;';
    previewImgWrap.appendChild(previewImg);
    
    let previewText = document.createElement('div');
    previewText.style.cssText = 'margin-top: 15px; background: #222; padding: 15px; border-radius: 6px; border: 1px solid #444; min-height: 150px;';
    previewText.innerHTML = '<i>Pasa el ratón sobre una carta para ver sus detalles.</i>';
    
    leftSide.appendChild(previewImgWrap);
    leftSide.appendChild(previewText);
    overlay.appendChild(leftSide);
    
    // RIGHT SIDE (MAIN)
    let rightSide = document.createElement('div');
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
            { exact: ["Beta The Magnet Warrior", "Gamma the Magnet Warrior"], result: "Valkyrion the Magna Warrior" }
        );
    }
}, 500);

console.log('=== V5 CLEAN MASTER PATCH INJECTED ===');



const originalCardHTML = window.cardHTML;
window.cardHTML = function(c, z, i) {
    let html = originalCardHTML ? originalCardHTML(c, z, i) : '';
    let name = c?.name || c?.[0] || '';
    if (name && window.CARD_MAPPINGS && window.CARD_MAPPINGS[name]) {
        let num = window.CARD_MAPPINGS[name];
        if (window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[num]) {
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
  var ready = c.kind !== 'TRAP' || (typeof game !== 'undefined' && game && game.turnNo >= (c.readyTurn || 0));
  var statusText = c.set ? (c.kind === 'TRAP' ? (ready ? 'LISTA' : 'ESPERA') : 'SET') : 'ACTIVA';
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






// DASHBOARDS PATCH V4

const oldFuse = window.fuse;
window.onBeforeFuse = function() {
    if (game && game.turn === 'player' && game.selected) {
        let ids = game.selected.filter(x => x && x[0] === 'h').map(x => x[1]).sort((a,b) => b-a);
        if (ids.length >= 2) {
            let names = ids.map(i => game.hand[i]?.[0]);
            let result = window.fusionResult(names);
            if (result) {
                let savedStr = origGet('FMR_SAVE_' + window.activeAccount);
                if (savedStr) {
                    let s = JSON.parse(savedStr);
                    if (!s.fusions) s.fusions = [];
                    if (!s.fusions.includes(result)) {
                        s.fusions.push(result);
                        origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
                        if (typeof memorySave !== 'undefined') window.memorySave.fusions = s.fusions;
                    }
                }
            }
        }
    }
    
};
try { fuse = window.fuse; } catch(e){}

window.getGlobalCardDict = function() {
    if (window.globalCardDict) return window.globalCardDict;
    let dict = {};
    let names = Object.keys(window.CARD_MAPPINGS || {});
    names.forEach(name => {
        let rawNum = window.CARD_MAPPINGS[name];
        let num = typeof rawNum === 'number' ? rawNum : (parseInt(String(rawNum || '').replace(/[^\d]/g, ''), 10) || 0);
        let meta = window.FMR_CARD_META && window.FMR_CARD_META[name];
        if (meta) {
            dict[name] = { num, name, type: meta.type, attr: meta.attr, atk: meta.atk, def: meta.def, isMonster: true, isExtra: meta.kind === 'FUSION' };
        } else {
            let st = window.FMR_ST_POOL_V1 && window.FMR_ST_POOL_V1.find(x => x && x.name === name);
            if (st) {
                dict[name] = { num, name, type: st.kind, isMonster: false, text: st.text, isExtra: false };
            } else {
                let dbCard = typeof DB !== 'undefined' && Array.isArray(DB) && DB.find(x => x && x[0] === name);
                if (dbCard) {
                    dict[name] = { num, name, type: dbCard[2], attr: dbCard[3], atk: dbCard[4], def: dbCard[5], isMonster: true, isExtra: false };
                } else {
                    let cd = (window.CARDS_DATA || []).find(x => x && x.name === name);
                    if (cd && (cd.kind === 'MONSTER' || cd.kind === 'FUSION' || cd.atk !== undefined)) {
                        dict[name] = { num, name, type: cd.type || 'Warrior', attr: cd.attr || 'EARTH', atk: cd.atk || 0, def: cd.def || 0, isMonster: true, isExtra: cd.kind === 'FUSION' };
                    } else if (cd) {
                        dict[name] = { num, name, type: cd.kind || 'SPELL', isMonster: false, text: cd.text || cd.desc || '', isExtra: false };
                    } else {
                        dict[name] = { num, name, type: 'UNKNOWN', isMonster: false, isExtra: false };
                    }
                }
            }
        }
    });
    window.globalCardDict = dict;
    return dict;
};

function updatePreview(previewImg, infoBox, name, extraHtml) {
    let dict = window.getGlobalCardDict();
    if (dict[name]) {
        let c = dict[name];
        if (window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[c.num]) {
            previewImg.src = window.CUSTOM_LOCAL_IMAGES[c.num];
            previewImg.style.display = 'block';
        } else {
            previewImg.style.display = 'none';
        }
        
        infoBox.style.display = 'block';
        
        let descHtml = extraHtml || '';
        if (!c.isMonster && c.text) {
            descHtml = c.text + (descHtml ? '<br/><br/>' + descHtml : '');
        }
        
        infoBox.innerHTML = `<h3 style="margin:0 0 10px 0; color:#ffcc00;">${name}</h3>` +
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
            <option value="SPELL">Solo Magias</option>
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
    let allNames = Object.keys(window.CARD_MAPPINGS || {}).sort((a,b) => {
        let na = parseInt(String(window.CARD_MAPPINGS[a] || 0).replace(/[^\d]/g, ''), 10) || 0;
        let nb = parseInt(String(window.CARD_MAPPINGS[b] || 0).replace(/[^\d]/g, ''), 10) || 0;
        return na - nb;
    });
    
    function renderList() {
        let q = overlay.querySelector('#coll-search').value.toLowerCase();
        let fCard = overlay.querySelector('#f-cardtype').value;
        let fAttr = overlay.querySelector('#f-attr').value;
        let fType = overlay.querySelector('#f-type').value;
        let fAtk = parseInt(overlay.querySelector('#f-atk').value) || -1;
        let fDef = parseInt(overlay.querySelector('#f-def').value) || -1;
        let fOwn = overlay.querySelector('#f-owned').value;
        
        tbody.innerHTML = '';
        
        allNames.forEach(name => {
            let c = dict[name];
            if (!c) return;
            let count = s.collection[name] || 0;
            
            // Filters
            if (q && !name.toLowerCase().includes(q)) return;
            if (fCard === 'MONSTER' && !c.isMonster) return;
            if (fCard === 'SPELL' && c.type !== 'SPELL') return;
            if (fCard === 'TRAP' && c.type !== 'TRAP') return;
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
                siblings.forEach(s => s.style.background = 'transparent');
                tr.style.background = '#444';
                tr.onmouseout = () => tr.style.background = '#444';
                siblings.forEach(sib => { if(sib!==tr) sib.onmouseout = () => sib.style.background = 'transparent'; });
                
                updatePreview(previewImg, infoBox, name);
            };
            
            let colorType = c.isMonster ? '#fff' : (c.type==='SPELL' ? '#4da6ff' : '#ff4d4d');
            if (isUnowned) colorType = '#666';
            
            let displayType = c.isMonster ? `${c.type} / ${c.attr}` : (c.type==='SPELL' ? 'Magia' : 'Trampa');
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
    let s = JSON.parse(origGet('FMR_SAVE_' + window.activeAccount) || '{}');
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: #1a1a1a; z-index:9999999; display:flex; flex-direction:row; padding: 20px; box-sizing:border-box; color: #fff; font-family: "Segoe UI", Arial, sans-serif;';
    
    let leftSide = document.createElement('div');
    leftSide.style.cssText = 'width: 320px; display:flex; flex-direction:column; margin-right: 20px; border-right: 2px solid #333; padding-right: 20px;';
    
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
        <div style="font-family:VT323, monospace; color:#ffcc00; font-size: 24px; text-shadow: 2px 2px 0 #000;">FUSIONES DESCUBIERTAS</div>
        <button id="btn-exit-fus" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:VT323, monospace; font-size:12px;">VOLVER</button>
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
    let exact = (window.FMR_FUSION_RULES_V1 || []).filter(r => r.exact);
    let discovered = new Set(s.fusions || []);
    
    exact.forEach(r => {
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
                updatePreview(previewImg, infoBox, name, `<strong>Receta Exacta:</strong><br/>${r.exact[0]}<br/>+<br/>${r.exact[1]}`);
            } else {
                previewImg.src = '';
                previewImg.style.display = 'none';
                infoBox.style.display = 'block';
                infoBox.innerHTML = `<h3 style="margin:0 0 10px 0; color:#666;">Fusión Desconocida</h3><div style="color:#aaa; font-size:12px;">Descubre esta fusión en un duelo para revelarla.</div>`;
            }
        };
        
        let displayRecipe = isKnown ? `<span style="color:#4da6ff">${r.exact[0]}</span> + <span style="color:#ff4d4d">${r.exact[1]}</span>` : '??? + ???';
        
        tr.innerHTML = `
            <td style="padding: 10px; font-weight: bold; color: ${isKnown ? '#ffcc00' : '#666'};">${name}</td>
            <td style="padding: 10px; font-size: 14px;">${displayRecipe}</td>
            <td style="padding: 10px; text-align:center;">
                ${isKnown ? `<b style="color:#00ffcc;">DESCUBIERTA</b>` : `<b style="color:#555;">OCULTA</b>`}
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

  var origInstall = window.installStoryDecks;
  window.installStoryDecks = function() {
    var opp = (window.storyOpponent || 'tristan').toLowerCase().replace(/[^a-z0-9_]/g, '');
    var sDeck = window['_serverDeck_' + opp];
    if (sDeck && sDeck.length >= 40) {
      if (typeof STORY_DECKS !== 'undefined') {
        STORY_DECKS[opp] = sDeck;
        console.log('[Duel] Usando deck oficial de servidor para:', opp);
      }
    }
    if (origInstall) origInstall.apply(this, arguments);

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

  // On-screen visual badge for active duel field
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
      return;
    }
    var fb = game.fieldBoost;
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
    } else {
      badge.style.display = 'none';
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
      if (r.ok) console.log('[Server Save] Partida guardada en servidor para:', name);
    }).catch(function(e) {
      console.warn('[Server Save] Error al guardar en servidor:', e);
    });
  }
  window.sendServerSave = sendServerSave;

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

  // setMonster hook (1 summon per turn + Gods cannot be set + transfer hand equips)
  var prevSetMonster = window.setMonster103 || window.setMonster;
  window.setMonster103 = function() {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (g && g.handSummoned) {
      duelToast('Solo se permite 1 invocaci\u00f3n o colocaci\u00f3n por turno.');
      return;
    }
    var sel = (g && g.selected || []).find(function(x) { return x && x[0] === 'h'; });
    var handCard = (sel && g.hand) ? g.hand[sel[1]] : null;
    if (handCard) {
      var selName = handCard.name || handCard[0] || '';
      if (isEgyptianGod(selName)) {
        duelToast('Los Dioses Egipcios no pueden colocarse boca abajo; requieren Invocación en Ataque tributando 3 monstruos.');
        return;
      }
    }
    var savedEquip = Number(handCard ? (handCard._handEquipAtk || handCard.equip || 0) : 0);
    var savedBoost = handCard ? (handCard.tempBoost || 0) : 0;
    var savedBoostDef = Number(handCard ? (handCard._handEquipDef || handCard.tempBoostDef || 0) : 0);
    var savedEquippedCards = handCard && handCard.equippedCards ? handCard.equippedCards.slice() : [];

    if (prevSetMonster) {
      var r = prevSetMonster.apply(this, arguments);
      if (savedEquip || savedBoost || savedBoostDef) {
        for (var s = 0; s < (g.field || []).length; s++) {
          var fMon = g.field[s];
          if (fMon && fMon.name === (handCard.name || handCard[0]) && !fMon._handEquipTransferred) {
            fMon._handEquipAtk = (fMon._handEquipAtk || 0) + savedEquip;
            fMon.equip = (fMon.equip || 0) + savedEquip;
            fMon._equipAtk111 = (fMon._equipAtk111 || 0) + savedEquip;
            fMon._handEquipDef = (fMon._handEquipDef || 0) + savedBoostDef;
            fMon.tempBoostDef = (fMon.tempBoostDef || 0) + savedBoostDef;
            fMon._equipDef111 = (fMon._equipDef111 || 0) + savedBoostDef;
            if (savedBoost) fMon.tempBoost = (fMon.tempBoost || 0) + savedBoost;
            if (savedEquippedCards.length) {
              fMon.equippedCards = (fMon.equippedCards || []).concat(savedEquippedCards);
            }
            fMon._handEquipTransferred = true;
            break;
          }
        }
        if (typeof render === 'function') render();
      }
      return r;
    }
  };
  window.setMonster = window.setMonster103;
  try { setMonster103 = window.setMonster103; setMonster = window.setMonster; } catch(_) {}

  // AI 3-Tribute Hook & Ultra-Aggressive Summoning for Egyptian Gods
  var origAiHandSummon = window.aiHandSummonOrSet;
  window.aiHandSummonOrSet = function() {
    if (typeof game === 'undefined' || !game || game.turn !== 'enemy') return;
    var opp = (window.storyOpponent || window.lastDuelOpponent || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    var isGodBoss = (opp === 'marik' || opp === 'kaiba' || opp === 'yugi');
    var hand = Array.isArray(game.enemyHand) ? game.enemyHand : [];

    // Ensure God card in hand for God Bosses on turn 1
    var godMap = {
      'marik': 'The Winged Dragon of Ra',
      'kaiba': 'Obelisk the Tormentor',
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

    // Check if we can tribute 3 monsters for God
    if (godIdx >= 0) {
      var enemyMons = [];
      for (var i = 0; i < (game.enemy || []).length; i++) {
        if (game.enemy[i]) enemyMons.push(i);
      }
      if (enemyMons.length >= 3) {
        var t1 = enemyMons[0], t2 = enemyMons[1], t3 = enemyMons[2];
        var m1 = game.enemy[t1], m2 = game.enemy[t2], m3 = game.enemy[t3];
        if (Array.isArray(game.enemyGrave)) {
          game.enemyGrave.push(m1, m2, m3);
        }
        game.enemy[t1] = null; game.enemy[t2] = null; game.enemy[t3] = null;
        var godCard = hand.splice(godIdx, 1)[0];
        var summoned = typeof mk === 'function' ? mk(godCard.name || godCard[0]) : null;
        if (!summoned) summoned = Object.assign({}, godCard, { atk: 5000, def: 5000, pos: 'ATK', faceUp: true });
        summoned.atk = 5000; summoned.def = 5000; summoned.pos = 'ATK'; summoned.faceUp = true;
        game.enemy[t1] = summoned;

        var summonDialogue = {
          'marik': '¡Jajajaja! ¡Siente la furia divina! ¡El Dragón Alado de Ra desciende con 5000 ATK!',
          'kaiba': '¡Ríndete! ¡Nadie puede desafiar mi poder absoluto! ¡Obelisk the Tormentor destruirá todo con 5000 ATK!',
          'yugi': '¡El lazo con los dioses antiguos despierta! ¡' + (summoned.name || 'Dios Egipcio') + ' desciende al campo de batalla con 5000 ATK!'
        };
        var msg = summonDialogue[opp] || ('¡El rival tributa 3 monstruos para invocar al Dios Egipcio ' + summoned.name + ' (5000 ATK / 5000 DEF)!');
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
        game.enemyBack[freeBack] = Object.assign({}, trapCard, { set: true, readyTurn: game.turnNo + 1 });
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

            // Re-check: Did this summon complete 3 tributes with God in hand?
            godIdx = hand.findIndex(function(c) { return c && isEgyptianGod(c.name || c[0]); });
            if (godIdx >= 0) {
              var countMons = [];
              for (var ci = 0; ci < (game.enemy || []).length; ci++) {
                if (game.enemy[ci]) countMons.push(ci);
              }
              if (countMons.length >= 3) {
                var c1 = countMons[0], c2 = countMons[1], c3 = countMons[2];
                if (Array.isArray(game.enemyGrave)) {
                  game.enemyGrave.push(game.enemy[c1], game.enemy[c2], game.enemy[c3]);
                }
                game.enemy[c1] = null; game.enemy[c2] = null; game.enemy[c3] = null;
                var gCard = hand.splice(godIdx, 1)[0];
                var gSummoned = typeof mk === 'function' ? mk(gCard.name || gCard[0]) : null;
                if (!gSummoned) gSummoned = Object.assign({}, gCard, { atk: 5000, def: 5000, pos: 'ATK', faceUp: true });
                gSummoned.atk = 5000; gSummoned.def = 5000; gSummoned.pos = 'ATK'; gSummoned.faceUp = true;
                game.enemy[c1] = gSummoned;

                var summonDialogue2 = {
                  'marik': '¡Jajajaja! ¡Siente la furia divina! ¡El Dragón Alado de Ra desciende con 5000 ATK!',
                  'kaiba': '¡Ríndete! ¡Nadie puede desafiar mi poder absoluto! ¡Obelisk the Tormentor destruirá todo con 5000 ATK!',
                  'yugi': '¡El lazo con los dioses antiguos despierta! ¡' + (gSummoned.name || 'Dios Egipcio') + ' desciende al campo de batalla con 5000 ATK!'
                };
                var msg2 = summonDialogue2[opp] || ('¡El rival tributa 3 monstruos para invocar al Dios Egipcio ' + gSummoned.name + ' (5000 ATK / 5000 DEF)!');
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

  // 3. Fusion System (Mano + Mano, Campo + Mano, Campo + Campo con Selección y Ejecución Automática)
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

    // A. MANO + MANO
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
        var r = typeof fusionResult === 'function' ? fusionResult([name1, name2]) : (window.fusionResult ? window.fusionResult([name1, name2]) : null);
        if (r) {
          var key = 'h' + i + '+h' + j + '->' + r;
          if (!seen[key]) {
            seen[key] = true;
            out.push({
              type: 'hand-hand',
              a: { zone: 'h', index: i, card: c1, name: name1 },
              b: { zone: 'h', index: j, card: c2, name: name2 },
              result: r
            });
          }
        }
      }
    }

    // B. CAMPO + MANO
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
        var rF = typeof fusionResult === 'function' ? fusionResult([nameF, nameH]) : (window.fusionResult ? window.fusionResult([nameF, nameH]) : null);
        if (rF) {
          var keyF = 'f' + f + '+h' + h + '->' + rF;
          if (!seen[keyF]) {
            seen[keyF] = true;
            out.push({
              type: 'field-hand',
              a: { zone: 'f', index: f, card: cf, name: nameF },
              b: { zone: 'h', index: h, card: ch, name: nameH },
              result: rF
            });
          }
        }
      }
    }

    // C. CAMPO + CAMPO
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
        var rFF = typeof fusionResult === 'function' ? fusionResult([nF1, nF2]) : (window.fusionResult ? window.fusionResult([nF1, nF2]) : null);
        if (rFF) {
          var keyFF = 'f' + f1 + '+f' + f2 + '->' + rFF;
          if (!seen[keyFF]) {
            seen[keyFF] = true;
            out.push({
              type: 'field-field',
              a: { zone: 'f', index: f1, card: cF1, name: nF1 },
              b: { zone: 'f', index: f2, card: cF2, name: nF2 },
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
    var matA = opt.a;
    var matB = opt.b;

    // Verificar espacio en campo si es hand-hand
    var targetSlot = -1;
    if (opt.type === 'field-hand' || opt.type === 'field-field') {
      targetSlot = matA.index;
    } else {
      targetSlot = game.field.findIndex(function(x) { return !x; });
      if (targetSlot < 0) {
        duelToast('No hay espacio libre en tu campo para la Fusión.');
        return;
      }
    }

    try {
      if (typeof window.onBeforeFuse === 'function') window.onBeforeFuse();
    } catch(_) {}

    // Enviar materiales al cementerio
    if (opt.type === 'hand-hand') {
      var idxs = [matA.index, matB.index].sort(function(a, b) { return b - a; });
      idxs.forEach(function(idx) {
        var card = game.hand.splice(idx, 1)[0];
        if (card) game.grave.push(Object.assign({}, card, { set: false, faceUp: true }));
      });
    } else if (opt.type === 'field-hand') {
      var fCard = game.field[matA.index];
      game.field[matA.index] = null;
      if (fCard) game.grave.push(Object.assign({}, fCard, { set: false, faceUp: true }));
      var hCard = game.hand.splice(matB.index, 1)[0];
      if (hCard) game.grave.push(Object.assign({}, hCard, { set: false, faceUp: true }));
    } else if (opt.type === 'field-field') {
      var fCardA = game.field[matA.index];
      game.field[matA.index] = null;
      if (fCardA) game.grave.push(Object.assign({}, fCardA, { set: false, faceUp: true }));
      var fCardB = game.field[matB.index];
      game.field[matB.index] = null;
      if (fCardB) game.grave.push(Object.assign({}, fCardB, { set: false, faceUp: true }));
    }

    // Crear el monstruo de fusión
    var fused = window.mk(resultName) || {
      name: resultName,
      level: 6,
      type: 'Warrior',
      attr: 'LIGHT',
      atk: 2100,
      def: 1800,
      pos: 'ATK',
      materials: [matA.name, matB.name],
      faceUp: true
    };
    fused.materials = [matA.name, matB.name];
    fused.pos = 'ATK';
    fused.faceUp = true;
    fused.faceDownSet103 = false;
    game.field[targetSlot] = fused;

    game.handSummoned = true; // Consumes the turn's summon!
    game.selected = [];

    if (window.playFusionSound) window.playFusionSound();
    else if (window.playSummonSound) window.playSummonSound();

    if (typeof updateSetButton103 === 'function') try { updateSetButton103(); } catch(_) {}
    if (typeof updateFusionAssist === 'function') try { updateFusionAssist(); } catch(_) {}
    if (typeof render === 'function') render();
    if (typeof setDuelView === 'function') setDuelView('field');

    var matDesc = '[' + (matA.zone === 'f' ? 'CAMPO' : 'MANO') + '] ' + matA.name + ' + [' + (matB.zone === 'f' ? 'CAMPO' : 'MANO') + '] ' + matB.name;
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
        var aMatch = (a.a.zone === selFocus.zone && a.a.index === selFocus.index) || (a.b.zone === selFocus.zone && a.b.index === selFocus.index);
        var bMatch = (b.a.zone === selFocus.zone && b.a.index === selFocus.index) || (b.b.zone === selFocus.zone && b.b.index === selFocus.index);
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

      var locA = o.a.zone === 'f' ? 'CAMPO' : 'MANO';
      var locB = o.b.zone === 'f' ? 'CAMPO' : 'MANO';
      var tagStyleA = o.a.zone === 'f' ? 'background:#00364d;border:1px solid #00c3ff;color:#8ce8ff;' : 'background:#4a3000;border:1px solid #d4af37;color:#ffd700;';
      var tagStyleB = o.b.zone === 'f' ? 'background:#00364d;border:1px solid #00c3ff;color:#8ce8ff;' : 'background:#4a3000;border:1px solid #d4af37;color:#ffd700;';

      var mMeta = (window.mk ? window.mk(o.result) : null) || {};
      var atk = mMeta.atk != null ? mMeta.atk : '?';
      var def = mMeta.def != null ? mMeta.def : '?';
      var thumb = getFusionCardThumb(o.result);

      item.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex:1.8;">' +
        '<div style="display:flex;flex-direction:column;gap:5px;flex:1;">' +
          '<div style="display:flex;align-items:center;gap:6px;font-size:15px;color:#fff;">' +
            '<span style="padding:2px 6px;border-radius:5px;font-size:11px;font-weight:900;' + tagStyleA + '">' + locA + '</span> ' +
            '<span>' + o.a.name + '</span>' +
          '</div>' +
          '<div style="color:#efc6ff;font-size:12px;margin-left:15px;">+</div>' +
          '<div style="display:flex;align-items:center;gap:6px;font-size:15px;color:#fff;">' +
            '<span style="padding:2px 6px;border-radius:5px;font-size:11px;font-weight:900;' + tagStyleB + '">' + locB + '</span> ' +
            '<span>' + o.b.name + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:22px;color:#ffd700;font-weight:bold;margin:0 4px;">➔</div>' +
        '<img src="' + thumb + '" alt="' + o.result + '" style="width:48px;height:70px;object-fit:cover;border-radius:5px;border:1px solid #ffd700;box-shadow:0 2px 6px #000;background:#000;flex-shrink:0;">' +
        '<div style="display:flex;flex-direction:column;gap:2px;">' +
          '<div style="font-size:18px;font-weight:900;color:#ffd700;line-height:1.2;">' + o.result + '</div>' +
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

    // 1. Si ya hay 2 cartas seleccionadas válidas, fusionar directamente:
    if (hs.length === 2 && fs.length === 0) {
      var cA = game.hand[hs[0]], cB = game.hand[hs[1]];
      if (isMonsterCard(cA) && isMonsterCard(cB)) {
        var nA = cardName(cA), nB = cardName(cB);
        var res = typeof fusionResult === 'function' ? fusionResult([nA, nB]) : (window.fusionResult ? window.fusionResult([nA, nB]) : null);
        if (res) {
          executeFusion({
            type: 'hand-hand',
            a: { zone: 'h', index: hs[0], card: cA, name: nA },
            b: { zone: 'h', index: hs[1], card: cB, name: nB },
            result: res
          });
          return;
        }
      }
    } else if (hs.length === 1 && fs.length === 1) {
      var cF = game.field[fs[0]], cH = game.hand[hs[0]];
      if (isMonsterCard(cF) && isMonsterCard(cH)) {
        var nF = cardName(cF), nH = cardName(cH);
        var resF = typeof fusionResult === 'function' ? fusionResult([nF, nH]) : (window.fusionResult ? window.fusionResult([nF, nH]) : null);
        if (resF) {
          executeFusion({
            type: 'field-hand',
            a: { zone: 'f', index: fs[0], card: cF, name: nF },
            b: { zone: 'h', index: hs[0], card: cH, name: nH },
            result: resF
          });
          return;
        }
      }
    } else if (fs.length === 2 && hs.length === 0) {
      var cF1 = game.field[fs[0]], cF2 = game.field[fs[1]];
      if (isMonsterCard(cF1) && isMonsterCard(cF2)) {
        var nF1 = cardName(cF1), nF2 = cardName(cF2);
        var resFF = typeof fusionResult === 'function' ? fusionResult([nF1, nF2]) : (window.fusionResult ? window.fusionResult([nF1, nF2]) : null);
        if (resFF) {
          executeFusion({
            type: 'field-field',
            a: { zone: 'f', index: fs[0], card: cF1, name: nF1 },
            b: { zone: 'f', index: fs[1], card: cF2, name: nF2 },
            result: resFF
          });
          return;
        }
      }
    }

    // 2. Si no hay 2 materiales válidos preseleccionados, abrir el modal de selección:
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
    var val = c.value || '';
    var kind = (c.kind || c.type || '').toUpperCase();
    if (kind === 'EQUIP' || val === 'EQUIP') return true;
    var equipNames = [
      'Axe of Despair', 'Black Pendant', 'Horn of the Unicorn', 'Dragon Treasure',
      'Garra del Dragón', 'United We Stand', 'Fusion Weapon', 'Malevolent Nuzzler',
      'Sword of Dark Destruction', 'Dark Energy', 'Invigoration', 'Electro-Whip',
      'Cyber Shield', 'Mystical Moon', 'Silver Bow and Arrow', 'Book of Secret Arts',
      'Elf\'s Light', 'Beast Fangs', 'Steel Shell', 'Vile Germs', 'Shine Palace',
      'Salamandra', 'Kunai with Chain', 'Megamorph', 'Sword of Kusanagi', 'Cestus of Dagla',
      'Magic Formula', 'Cyclon Laser', 'Mirror of Yata', 'Orb of Yasaka', 'Shattered Axe'
    ];
    if (equipNames.includes(name)) return true;
    if (['AXE_DESPAIR', 'BLACK_PENDANT', 'HORN_UNICORN', 'DRAGON_TREASURE', 'EQUIP_DRAGON', 'UNITED_WE_STAND', 'FUSION_WEAPON'].includes(val)) return true;
    var desc = (c.text || c.desc || '').toLowerCase();
    if (desc.includes('equipa') || desc.includes('equip') || desc.includes('monstruo equipado')) return true;
    return false;
  }
  window.isEquipSpell = isEquipSpell;

  function getEquipStats(eqCard) {
    var name = (eqCard && (eqCard.name || eqCard[0]) || '').trim();
    var val = (eqCard && eqCard.value) || '';
    var atk = 500;
    var def = 0;
    if (name === 'Axe of Despair' || val === 'AXE_DESPAIR') {
      atk = 1000; def = 0;
    } else if (name === 'Black Pendant' || val === 'BLACK_PENDANT') {
      atk = 500; def = 0;
    } else if (name === 'Horn of the Unicorn' || val === 'HORN_UNICORN') {
      atk = 700; def = 700;
    } else if (name === 'Dragon Treasure' || val === 'DRAGON_TREASURE' || name === 'Garra del Dragón' || val === 'EQUIP_DRAGON') {
      atk = 500; def = 500;
    } else if (name === 'United We Stand' || val === 'UNITED_WE_STAND') {
      atk = 800; def = 800;
    } else if (name === 'Fusion Weapon' || val === 'FUSION_WEAPON') {
      atk = 1500; def = 500;
    }
    return { atk: atk, def: def };
  }

  function canEquip(eqCard, target) {
    if (!eqCard || !target) return false;
    if (typeof isST === 'function' && isST(target)) return false;
    if (target.kind === 'SPELL' || target.kind === 'TRAP' || target.kind === 'EQUIP') return false;

    var eqName = (eqCard.name || eqCard[0] || '').trim();
    var eqVal = eqCard.value || '';
    var monType = target.type || target[2] || '';
    var monKind = target.kind || (target.materials && target.materials.length ? 'FUSION' : '');
    var monLevel = Number(target.level ?? target[1] ?? 0);

    if (eqVal === 'DRAGON_TREASURE' || eqName === 'Dragon Treasure' || eqVal === 'EQUIP_DRAGON' || eqName === 'Garra del Dragón') {
      return monType === 'Dragon';
    }
    if (eqVal === 'FUSION_WEAPON' || eqName === 'Fusion Weapon') {
      return (monKind === 'FUSION' || target.isFusion) && (monLevel <= 6);
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

    var eqStats = getEquipStats(eqCard);
    var boostStr = '+' + eqStats.atk + ' ATK' + (eqStats.def ? ' / +' + eqStats.def + ' DEF' : '');

    var headerHTML = '<h3 style="color:#ffd700;font-size:24px;margin:0 0 6px;text-align:center;letter-spacing:1px;text-shadow:0 0 8px #ffb300;">' +
      'EQUIPAR: ' + eqName + '</h3>' +
      '<p style="color:#fff;font-size:16px;margin:0 0 15px;text-align:center;line-height:1.3;">' +
      'Otorga <b style="color:#00ff88;">' + boostStr + '</b>. Elige el monstruo objetivo:</p>';

    var scrollList = document.createElement('div');
    scrollList.style.cssText = "display:flex;flex-direction:column;gap:10px;overflow-y:auto;padding-right:6px;max-height:50vh;";

    allTargets.forEach(function(t) {
      var c = t.card;
      var name = c.name || c[0] || 'Monstruo';
      var curAtk = (t.zone === 'h') ? (Number(c.atk ?? c[4] ?? 0) + Number(c.tempBoost || 0) + Number(c.equip || 0)) : (typeof window.effectiveAtk === 'function' ? window.effectiveAtk(c) : c.atk);
      var curDef = (c.kind === 'LINK') ? 'LINK' : (Number(c.def ?? c[5] ?? 0) + Number(c.tempDefense || 0) + Number(c.tempBoostDef || 0));
      var newAtk = curAtk + eqStats.atk;
      var newDef = (c.kind === 'LINK') ? 'LINK' : (curDef + eqStats.def);

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
        executeEquip(eqCard, source, t, eqStats);
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
            set: false,
            faceUp: true,
            equipToken109: token,
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
          g.playerBack[source.index].set = false;
          g.playerBack[source.index].faceUp = true;
          g.playerBack[source.index].equipToken109 = token;
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

  // 5. activateSTFromHand & activateSetCard
  var prevActivateHand = window.activateSTFromHand;
  window.activateSTFromHand = function(i) {
    var g = (typeof game !== 'undefined' && game) ? game : (typeof window !== 'undefined' ? window.game : null);
    if (!g || g.turn !== 'player') return;
    var c = g.hand ? g.hand[i] : null;
    if (!c) return;
    var val = c.value || '';
    var cName = c.name || '';
    if (val === 'REBORN' || cName === 'Renace al Monstruo') {
      resolveMonsterReborn(null, i);
      return;
    }
    // Intercept EQUIP cards
    if (c.kind === 'EQUIP' || val === 'EQUIP' || isEquipSpell(c)) {
      window.promptEquipTarget(c, { type: 'hand', index: i });
      return;
    }
    if (val === 'POT_OF_GREED' || cName === 'Pot of Greed') {
      g.hand.splice(i, 1);
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      for (var d = 0; d < 2; d++) { if (g.deck.length) g.hand.push(g.deck.pop()); }
      if (typeof enforceHandLimit === 'function') enforceHandLimit('player');
      if (window.playDrawSound) window.playDrawSound();
      if (typeof render === 'function') render();
      duelToast('¡Pot of Greed activado! Robas 2 cartas.');
      if (typeof log === 'function') log('Pot of Greed activado: robas 2 cartas.');
      return;
    }
    if (prevActivateHand) return prevActivateHand.apply(this, arguments);
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

    // 4. Pot of Greed estando SET:
    if (val === 'POT_OF_GREED' || cName === 'Pot of Greed') {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      for (var d = 0; d < 2; d++) { if (g.deck.length) g.hand.push(g.deck.pop()); }
      if (typeof enforceHandLimit === 'function') enforceHandLimit('player');
      if (window.playDrawSound) window.playDrawSound();
      if (typeof render === 'function') render();
      duelToast('¡Pot of Greed activado! Robas 2 cartas.');
      if (typeof log === 'function') log('Pot of Greed activado: robas 2 cartas.');
      return;
    }

    // 5. Raigeki estando SET:
    if (val === 'RAIGEKI' || cName === 'Raigeki') {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      var n = (typeof destroyAllMonsters109 === 'function') ? destroyAllMonsters109('enemy') : 0;
      if (typeof render === 'function') render();
      if (window.playDestroySound) window.playDestroySound();
      duelToast('¡Raigeki destruyó ' + n + ' monstruo(s) del rival!');
      if (typeof log === 'function') log('Raigeki destruye ' + n + ' monstruo(s) del rival.');
      return;
    }

    // 6. Dark Hole estando SET:
    if (val === 'DARK_HOLE' || cName === 'Dark Hole') {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      var a = (typeof destroyAllMonsters109 === 'function') ? destroyAllMonsters109('player') : 0;
      var b = (typeof destroyAllMonsters109 === 'function') ? destroyAllMonsters109('enemy') : 0;
      if (typeof render === 'function') render();
      if (window.playDestroySound) window.playDestroySound();
      duelToast('¡Dark Hole destruyó ' + (a+b) + ' monstruo(s) en el Campo!');
      if (typeof log === 'function') log('Dark Hole destruye ' + (a+b) + ' monstruo(s) en el Campo.');
      return;
    }

    // 7. Harpie\'s Feather Duster estando SET:
    if (val === 'FEATHER_DUSTER' || cName === "Harpie's Feather Duster") {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      var n = (typeof destroyBackrow109 === 'function') ? destroyBackrow109('enemy') : 0;
      if (typeof render === 'function') render();
      if (window.playDestroySound) window.playDestroySound();
      duelToast("¡Harpie's Feather Duster destruyó " + n + " carta(s) de Magia/Trampa rival!");
      if (typeof log === 'function') log("Harpie's Feather Duster destruye " + n + ' carta(s) de la zona de Magia/Trampa rival.');
      return;
    }

    // 8. Heavy Storm / Tormenta Pesada estando SET:
    if (val === 'HEAVY_STORM' || val === 'HEAVY_STORM_EN' || cName === 'Tormenta Pesada' || cName === 'Heavy Storm') {
      g.playerBack[i] = null;
      g.grave.push(Object.assign({}, c, { set: false, faceUp: true }));
      var n1 = (typeof destroyBackrow109 === 'function') ? destroyBackrow109('player') : 0;
      var n2 = (typeof destroyBackrow109 === 'function') ? destroyBackrow109('enemy') : 0;
      if (typeof render === 'function') render();
      if (window.playDestroySound) window.playDestroySound();
      duelToast('¡Tormenta Pesada destruyó ' + (n1+n2) + ' Magias/Trampas en el Campo!');
      if (typeof log === 'function') log('Tormenta Pesada destruye ' + (n1+n2) + ' Magias/Trampas en todo el Campo.');
      return;
    }

    // 9. Trampas (chequeo de turno y manuales):
    if (c.kind === 'TRAP') {
      var currentTurn = g.turnNo || 1;
      if (c.readyTurn && currentTurn < c.readyTurn) {
        duelToast(cName + ' fue colocada este turno. Debe permanecer SET hasta el próximo turno.');
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
            if (typeof render === 'function') render();
            duelToast('¡Dust Tornado destruyó ' + (targetCard.name || 'la carta rival') + '!');
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
      if (['MIRROR_FORCE', 'TRAP_HOLE', 'MAGIC_CYLINDER', 'NEGATE_ATTACK', 'SAKURETSU_ARMOR', 'TORRENTIAL'].includes(val) ||
          ['Trap Hole', 'Sakuretsu Armor', 'Negate Attack', 'Mirror Force', 'Torrential Tribute'].includes(cName)) {
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

  // 6. Automatic Battle Trap Trigger in aiBattle
  var prevAiBattleMaster = window.aiBattle;
  window.aiBattle = function() {
    if (game && game.turn === 'enemy') {
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

      var ei = (game.enemy || []).findIndex(function(c) { return c && (c.pos === 'ATK' || c.kind === 'LINK'); });
      if (ei < 0) ei = (game.enemy || []).findIndex(Boolean);

      if (ei >= 0) {
        var attacker = game.enemy[ei];
        var attackerIsGod = isEgyptianGod(attacker.name || attacker[0]);

        // 0. Crush Card Virus
        var ccvIdx = (game.playerBack || []).findIndex(function(c) {
          return c && c.set && (c.value === 'CRUSH_CARD_VIRUS' || c.name === 'Crush Card Virus');
        });
        if (ccvIdx >= 0) {
          var trapCCV = game.playerBack[ccvIdx];
          game.playerBack[ccvIdx] = null;
          game.grave.push(Object.assign({}, trapCCV, { set: false, faceUp: true }));
          var eDestroyed = 0;
          for (var ek = 0; ek < (game.enemy || []).length; ek++) {
            var em = game.enemy[ek];
            if (em) {
              if (isEgyptianGod(em.name || em[0])) {
                if (typeof log === 'function') log('\u00a1El Dios Egipcio ' + (em.name || 'Dios') + ' resiste la destrucci\u00f3n de Crush Card Virus!');
                continue;
              }
              game.enemyGrave.push(em);
              game.enemy[ek] = null;
              eDestroyed++;
            }
          }
          if (window.playDestroySound) window.playDestroySound();
          if (typeof render === 'function') render();
          if (typeof window.showTrap114 === 'function') window.showTrap114('Crush Card Virus', 'Destruye ' + eDestroyed + ' monstruos en el campo rival.');
          duelToast('\u00a1Crush Card Virus activado! Destruye ' + eDestroyed + ' monstruo(s) en el campo rival.');
          if (typeof log === 'function') log('\u00a1Crush Card Virus! Destruye todos los monstruos en el campo rival (' + eDestroyed + '). No afecta mano ni deck.');
          if (!attackerIsGod) return;
        }

        // 1. Negate Attack
        var negIdx = (game.playerBack || []).findIndex(function(c) {
          return c && c.set && (c.value === 'NEGATE_ATTACK' || c.name === 'Negate Attack');
        });
        if (negIdx >= 0) {
          if (attackerIsGod) {
            duelToast('¡Negate Attack falla! ¡El ataque del Dios Egipcio no puede ser negado!');
            if (typeof log === 'function') log('¡Negate Attack falla! El ataque supremo de ' + (attacker.name || 'Dios') + ' no puede ser negado.');
          } else {
            var trapN = game.playerBack[negIdx];
            game.playerBack[negIdx] = null;
            game.grave.push(Object.assign({}, trapN, { set: false, faceUp: true }));
            (game.enemy || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
            if (typeof render === 'function') render();
            if (typeof window.showTrap114 === 'function') window.showTrap114('Negate Attack', 'El ataque fue negado y la Battle Phase rival terminó.');
            duelToast('¡Negate Attack activado! El ataque fue negado y la Battle Phase rival terminó.');
            if (typeof log === 'function') log('¡Negate Attack! Niega el ataque y termina la Battle Phase.');
            return;
          }
        }

        // 2. Waboku
        var wabIdx = (game.playerBack || []).findIndex(function(c) {
          return c && c.set && (c.value === 'WABOKU' || c.name === 'Waboku');
        });
        if (wabIdx >= 0) {
          var trapW = game.playerBack[wabIdx];
          game.playerBack[wabIdx] = null;
          game.grave.push(Object.assign({}, trapW, { set: false, faceUp: true }));
          game._wabokuActiveThisTurn = true;
          game._wabokuActiveTurn = game.turnNo;
          (game.enemy || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
          if (typeof render === 'function') render();
          if (typeof window.showTrap114 === 'function') window.showTrap114('Waboku', 'Tus monstruos y LP están protegidos este turno.');
          duelToast('¡Waboku activado! Tus monstruos y LP están protegidos contra daño de batalla.');
          if (typeof log === 'function') log('¡Waboku! No habrá daño ni destrucción por batalla este turno.');
          return;
        }

        // 3. Sakuretsu Armor
        var sakIdx = (game.playerBack || []).findIndex(function(c) {
          return c && c.set && (c.value === 'SAKURETSU_ARMOR' || c.name === 'Sakuretsu Armor');
        });
        if (sakIdx >= 0) {
          if (attackerIsGod) {
            duelToast('¡Sakuretsu Armor falla! ¡El Dios Egipcio no puede ser destruido por Trampas!');
            if (typeof log === 'function') log('¡Sakuretsu Armor no puede destruir al Dios Egipcio ' + (attacker.name || 'Dios') + '! Solo puede ser destruido por batalla.');
          } else {
            var trapS = game.playerBack[sakIdx];
            game.playerBack[sakIdx] = null;
            game.grave.push(Object.assign({}, trapS, { set: false, faceUp: true }));
            game.enemy[ei] = null;
            game.enemyGrave.push(attacker);
            if (typeof render === 'function') render();
            if (typeof window.showTrap114 === 'function') window.showTrap114('Sakuretsu Armor', (attacker.name || 'El atacante') + ' fue destruido.');
            duelToast('¡Sakuretsu Armor activado! ' + (attacker.name || 'El atacante') + ' fue destruido.');
            if (typeof log === 'function') log('¡Sakuretsu Armor! Destruye al atacante ' + (attacker.name || '') + '.');
            return;
          }
        }

        // 4. Magic Cylinder
        var cylIdx = (game.playerBack || []).findIndex(function(c) {
          return c && c.set && (c.value === 'MAGIC_CYLINDER' || c.name === 'Magic Cylinder');
        });
        if (cylIdx >= 0) {
          if (attackerIsGod) {
            duelToast('¡Magic Cylinder falla! ¡El ataque del Dios Egipcio no puede ser negado!');
            if (typeof log === 'function') log('¡Magic Cylinder no puede contener el poder de ' + (attacker.name || 'Dios') + '!');
          } else {
            var trapC = game.playerBack[cylIdx];
            game.playerBack[cylIdx] = null;
            game.grave.push(Object.assign({}, trapC, { set: false, faceUp: true }));
            var dmg = Number(attacker.atk || 0);
            game.elp = Math.max(0, game.elp - dmg);
            (game.enemy || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
            if (typeof render === 'function') render();
            duelToast('¡Magic Cylinder! Ataque negado y ' + dmg + ' de daño al rival.');
            return;
          }
        }

        // 5. Mirror Force
        var mirIdx = (game.playerBack || []).findIndex(function(c) {
          return c && c.set && (c.value === 'MIRROR_FORCE' || c.name === 'Mirror Force');
        });
        if (mirIdx >= 0) {
          var trapM = game.playerBack[mirIdx];
          game.playerBack[mirIdx] = null;
          game.grave.push(Object.assign({}, trapM, { set: false, faceUp: true }));
          var destroyedCount = 0;
          for (var k = 0; k < (game.enemy || []).length; k++) {
            if (game.enemy[k] && (game.enemy[k].pos !== 'DEF' || game.enemy[k].kind === 'LINK')) {
              if (isEgyptianGod(game.enemy[k].name || game.enemy[k][0])) {
                if (typeof log === 'function') log('¡El Dios Egipcio ' + (game.enemy[k].name || '') + ' resiste la destrucción de Mirror Force!');
                continue; // IMMUNE!
              }
              game.enemyGrave.push(game.enemy[k]);
              game.enemy[k] = null;
              destroyedCount++;
            }
          }
          if (typeof render === 'function') render();
          if (typeof window.showTrap114 === 'function') window.showTrap114('Mirror Force', 'Se destruyeron ' + destroyedCount + ' monstruos atacantes.');
          duelToast('¡Mirror Force activado! Se destruyeron ' + destroyedCount + ' monstruos atacantes.');
          if (typeof log === 'function') log('¡Mirror Force! Destruye ' + destroyedCount + ' monstruos.');
          if (!attackerIsGod) return;
        }

        // Ultra-Aggressive Attack for Egyptian Gods (5000 ATK - never retreats to DEF)
        if (attackerIsGod) {
          var pi = (game.field || []).findIndex(Boolean);
          if (pi < 0) {
            // Direct Attack with God
            game.plp = Math.max(0, game.plp - 5000);
            if (typeof log === 'function') log('¡Ataque directo del temible ' + (attacker.name || 'Dios Egipcio') + '! ¡Pierdes 5000 LP!');
            duelToast('¡ATAQUE DIRECTO DE ' + (attacker.name || 'DIOS EGIPCIO').toUpperCase() + '! (-5000 LP)');
            if (window.playDestroySound) window.playDestroySound();
          } else {
            var pTarget = game.field[pi];
            var pPow = (pTarget.pos === 'DEF' ? (pTarget.def || 0) : (pTarget.atk || 0)) + (pTarget.tempBoost || 0) + (pTarget.tempBoostDef || 0);
            if (5000 >= pPow) {
              var diff = pTarget.pos === 'DEF' ? 0 : (5000 - pPow);
              if (diff > 0) game.plp = Math.max(0, game.plp - diff);
              game.field[pi] = null;
              if (Array.isArray(game.grave)) game.grave.push(pTarget);
              if (typeof log === 'function') log('¡' + (attacker.name || 'Dios') + ' (5000 ATK) aniquila a ' + (pTarget.name || 'monstruo') + '!' + (diff > 0 ? ' Recibes ' + diff + ' de daño.' : ''));
              duelToast('¡' + (attacker.name || 'Dios') + ' destruye a ' + (pTarget.name || 'monstruo') + '!');
              if (window.playDestroySound) window.playDestroySound();
            } else {
              // Target has > 5000: Battle can destroy God!
              var diffLoss = pPow - 5000;
              game.elp = Math.max(0, game.elp - diffLoss);
              game.enemy[ei] = null;
              if (Array.isArray(game.enemyGrave)) game.enemyGrave.push(attacker);
              if (typeof log === 'function') log('¡Batalla colosal! ' + (pTarget.name || 'Monstruo') + ' supera a ' + (attacker.name || 'Dios') + ' en combate. ¡El Dios es destruido por batalla!');
              duelToast('¡El Dios Egipcio fue destruido por batalla!');
            }
          }
          attacker.attackedTurn = game.turnNo;
          attacker.pos = 'ATK'; // NEVER switch to DEF!
          if (typeof render === 'function') render();
          return;
        }
      }
    }

    // Apply Guardian Signs bonus for AI battle against player monster
    var cleanedAI_A = null, cleanedAI_D = null;
    if (game && game.turn === 'enemy') {
      var aiAttacker = (game.enemy || []).find(function(c) { return c && (c.pos === 'ATK' || c.kind === 'LINK'); });
      if (!aiAttacker) aiAttacker = (game.enemy || []).find(Boolean);
      var playerDefIdx = (game.field || []).findIndex(Boolean);
      var playerDef = playerDefIdx >= 0 ? game.field[playerDefIdx] : null;

      if (aiAttacker && playerDef) {
        var aiRel = getSignCombatRelation(aiAttacker, playerDef);
        var aiSign = getCardSign(aiAttacker), plSign = getCardSign(playerDef);
        var aiSym = GUARDIAN_SYMBOLS[aiSign] || aiSign, plSym = GUARDIAN_SYMBOLS[plSign] || plSign;

        if (aiRel === 'adv') {
          aiAttacker.tempBoost = (aiAttacker.tempBoost || 0) + 500;
          cleanedAI_A = { card: aiAttacker, field: 'tempBoost', amount: 500 };
          if (typeof log === 'function') log('¡Signo Guardián Rival! ' + (aiAttacker.name || 'Rival') + ' [' + aiSym + '] > ' + (playerDef.name || 'Defensor') + ' [' + plSym + '] ➔ +500 ATK.');
          if (typeof duelToast === 'function') duelToast('¡Desventaja de Signo! ' + (aiAttacker.name || 'Rival') + ' tiene ventaja: +500 ATK.');
        } else if (aiRel === 'disadv') {
          if (playerDef.pos === 'DEF') {
            playerDef.tempBoostDef = (playerDef.tempBoostDef || 0) + 500;
            cleanedAI_D = { card: playerDef, field: 'tempBoostDef', amount: 500 };
            if (typeof log === 'function') log('¡Signo Guardián! ' + (playerDef.name || 'Defensor') + ' [' + plSym + '] > ' + (aiAttacker.name || 'Atacante') + ' [' + aiSym + '] ➔ +500 DEF.');
            if (typeof duelToast === 'function') duelToast('¡Ventaja de Signo Guardián! ' + (playerDef.name || 'Defensor') + ' resiste con ventaja: +500 DEF.');
          } else {
            playerDef.tempBoost = (playerDef.tempBoost || 0) + 500;
            cleanedAI_D = { card: playerDef, field: 'tempBoost', amount: 500 };
            if (typeof log === 'function') log('¡Signo Guardián! ' + (playerDef.name || 'Defensor') + ' [' + plSym + '] > ' + (aiAttacker.name || 'Atacante') + ' [' + aiSym + '] ➔ +500 ATK.');
            if (typeof duelToast === 'function') duelToast('¡Ventaja de Signo Guardián! ' + (playerDef.name || 'Defensor') + ' contrataca con ventaja: +500 ATK.');
          }
        }
      }
    }

    try {
      if (prevAiBattleMaster) return prevAiBattleMaster.apply(this, arguments);
    } finally {
      if (cleanedAI_A) cleanedAI_A.card[cleanedAI_A.field] = Math.max(0, (cleanedAI_A.card[cleanedAI_A.field] || 0) - cleanedAI_A.amount);
      if (cleanedAI_D) cleanedAI_D.card[cleanedAI_D.field] = Math.max(0, (cleanedAI_D.card[cleanedAI_D.field] || 0) - cleanedAI_D.amount);
      setTimeout(updateGuardianBattleHints, 30);
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

      // Enemy Crush Card Virus response on attack
      var enemyCCVIdx = (game.enemyBack || []).findIndex(function(c) {
        return c && c.set && (c.value === 'CRUSH_CARD_VIRUS' || c.name === 'Crush Card Virus') && (game.turnNo >= (c.readyTurn || 0));
      });
      if (enemyCCVIdx >= 0 && p) {
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
        var oppName = (typeof storyOpponent !== 'undefined' && storyOpponent) ? storyOpponent.toUpperCase() : 'EL RIVAL';
        var ccvMsg = '\u00a1' + oppName + ' activa Crush Card Virus! Destruye ' + pDestroyed + ' monstruo(s) en tu campo. (Mano y deck no son afectados)';
        duelToast(ccvMsg);
        if (typeof log === 'function') log(ccvMsg);
        if (attackerDied) {
          game.selected = [];
          if (typeof render === 'function') render();
          return;
        }
      }

      var cleanedP = null, cleanedE = null;
      if (p && e) {
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

  // Hook autoPlayerTrapAtEnemyBP60 as backup trap trigger
  var prevAutoBP60 = window.autoPlayerTrapAtEnemyBP60;
  window.autoPlayerTrapAtEnemyBP60 = async function() {
    if (game && game.turn === 'enemy') {
      var ei = (game.enemy || []).findIndex(function(c) { return c && (c.pos === 'ATK' || c.kind === 'LINK'); });
      if (ei < 0) ei = (game.enemy || []).findIndex(Boolean);
      var attacker = ei >= 0 ? game.enemy[ei] : null;
      var attackerIsGod = attacker && isEgyptianGod(attacker.name || attacker[0]);

      var negIdx = (game.playerBack || []).findIndex(function(c) {
        return c && c.set && (c.value === 'NEGATE_ATTACK' || c.name === 'Negate Attack');
      });
      if (negIdx >= 0) {
        if (attackerIsGod) {
          duelToast('¡Negate Attack falla! ¡El ataque del Dios Egipcio no puede ser negado!');
          if (typeof log === 'function') log('¡Negate Attack no puede detener al Dios Egipcio ' + (attacker.name || 'Dios') + '!');
        } else {
          var trapN = game.playerBack[negIdx];
          game.playerBack[negIdx] = null;
          game.grave.push(Object.assign({}, trapN, { set: false, faceUp: true }));
          (game.enemy || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
          if (typeof render === 'function') render();
          if (typeof window.showTrap114 === 'function') window.showTrap114('Negate Attack', 'El ataque fue negado y la Battle Phase rival terminó.');
          duelToast('¡Negate Attack activado! El ataque fue negado y la Battle Phase rival terminó.');
          if (typeof log === 'function') log('¡Negate Attack! Niega el ataque y termina la Battle Phase.');
          return true;
        }
      }
      var wabIdx = (game.playerBack || []).findIndex(function(c) {
        return c && c.set && (c.value === 'WABOKU' || c.name === 'Waboku');
      });
      if (wabIdx >= 0) {
        var trapW = game.playerBack[wabIdx];
        game.playerBack[wabIdx] = null;
        game.grave.push(Object.assign({}, trapW, { set: false, faceUp: true }));
        game._wabokuActiveThisTurn = true;
        game._wabokuActiveTurn = game.turnNo;
        (game.enemy || []).forEach(function(x) { if (x) x.attackedTurn = game.turnNo; });
        if (typeof render === 'function') render();
        if (typeof window.showTrap114 === 'function') window.showTrap114('Waboku', 'Tus monstruos y LP están protegidos este turno.');
        duelToast('¡Waboku activado! Tus monstruos y LP están protegidos contra daño de batalla.');
        if (typeof log === 'function') log('¡Waboku! No habrá daño ni destrucción por batalla este turno.');
        return true;
      }
    }
    if (prevAutoBP60) return await prevAutoBP60.apply(this, arguments);
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

  var prevRenderMaster = window.render;
  window.render = function() {
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

    /* Field Stats Banner */
    body.view-field #player .fieldStats,
    body.view-field #enemy .fieldStats,
    .fieldStats {
      flex: 0 0 20px !important;
      height: 20px !important;
      min-height: 20px !important;
      max-height: 20px !important;
      width: 100% !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      background: rgba(0, 0, 0, 0.9) !important;
      border-top: 1px solid #5a4625 !important;
      border-radius: 0 0 3px 3px !important;
      font-size: 8px !important;
      font-weight: 900 !important;
      padding: 0 2px !important;
      box-sizing: border-box !important;
      letter-spacing: -0.2px !important;
      overflow: hidden !important;
    }

    body.view-field #player .fieldStats .atk,
    body.view-field #enemy .fieldStats .atk,
    .fieldStats .atk {
      color: #ff5252 !important;
      display: flex !important;
      align-items: center !important;
    }

    body.view-field #player .fieldStats .def,
    body.view-field #enemy .fieldStats .def,
    .fieldStats .def {
      color: #4da6ff !important;
      display: flex !important;
      align-items: center !important;
    }

    /* Defense Position on Field: card rotates horizontally with clear blue border */
    body.view-field #player .fieldMonster.defense,
    body.view-field #enemy .fieldMonster.defense,
    .fieldMonster.defense {
      transform: rotate(90deg) scale(0.9) !important;
      border-color: #5bb2e8 !important;
    }

    body.view-field #player .fieldMonster.defense:hover,
    body.view-field #enemy .fieldMonster.defense:hover,
    .fieldMonster.defense:hover {
      transform: rotate(90deg) scale(0.96) !important;
    }

    body.view-field #player .fieldMonster.defense.selected,
    body.view-field #enemy .fieldMonster.defense.selected,
    .fieldMonster.defense.selected {
      transform: rotate(90deg) scale(0.98) !important;
      outline: 2.5px solid #f4d35e !important;
      box-shadow: 0 0 14px rgba(244, 211, 94, 0.75) !important;
    }

    body.view-field #player .fieldMonster.defense .fieldStats,
    body.view-field #enemy .fieldMonster.defense .fieldStats,
    .fieldMonster.defense .fieldStats {
      border-top-color: #2b5570 !important;
    }

    /* Responsive adjustments for mobile */
    @media (max-width: 650px) {
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
        font-size: 7px !important;
        height: 18px !important;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add('story-world-1');

})();

