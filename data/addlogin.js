const fs = require('fs');

const loginBlock = `

// ════════════════════════════════════════════════════════════════
//  SISTEMA DE LOGIN + SAVE EN SERVIDOR
//  La intercepcion de customShowMain es SINCRONA:
//  se ejecuta al parsear el script, antes de DOMContentLoaded,
//  garantizando que el login aparezca antes del main menu.
// ════════════════════════════════════════════════════════════════

(function() {
  var SERVER_MODE = false;
  var SERVER_CHECK_DONE = false;
  var SESSION = null;

  function apiPost(path, body, cb) {
    fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function(r) { return r.json(); }).then(cb)
      .catch(function(e) { cb({ error: e.message }); });
  }

  function apiSave(data) {
    if (!SESSION) return;
    apiPost('/api/save', Object.assign({}, data, { name: SESSION.name, password: SESSION.password }), function() {});
  }

  // Detectar servidor AHORA (async fetch, no bloquea)
  fetch('/api/saves')
    .then(function(r) { SERVER_MODE = r.ok; SERVER_CHECK_DONE = true; })
    .catch(function() { SERVER_MODE = false; SERVER_CHECK_DONE = true; });

  function patchSaveFunctions() {
    var origSave = window.saveGame || function() {};
    window.saveGame = function() {
      origSave.apply(this, arguments);
      if (SERVER_MODE && SESSION) {
        var s = window.memorySave || (typeof loadGame === 'function' && loadGame());
        if (s) apiSave(s);
      }
    };
  }

  function patchInstallStoryDecks() {
    var orig = window.installStoryDecks;
    if (!orig || orig._patched) return;
    window.installStoryDecks = function() {
      if (!SERVER_MODE) { return orig.apply(this, arguments); }
      var opp = (window.storyOpponent || 'tristan').toLowerCase().replace(/[^a-z0-9_]/g, '');
      fetch('/api/deck/' + opp)
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(dd) {
          if (!dd || !Array.isArray(dd.cards) || dd.cards.length < 40) {
            return orig.apply(window, arguments);
          }
          var pool = window.FMR_ST_POOL_V1 || [];
          function resolve(n) {
            var c = pool.find(function(x) { return x && x.name === n; });
            if (c) return Object.assign({}, c, { faceUp: true });
            if (typeof DB !== 'undefined' && DB) {
              var d = DB.find(function(x) { return x && x[0] === n; });
              if (d) return { name: d[0], level: d[1], type: d[2], attr: d[3], atk: d[4], def: d[5], pos: 'ATK', materials: [], faceUp: true };
            }
            return null;
          }
          var cards = dd.cards.map(resolve).filter(Boolean);
          if (cards.length >= 40 && window.game) {
            window.game.enemyDeck = cards.slice(); window.game.enemyHand = [];
            window.game.extra = []; window.game.extraUsed = [];
            console.log('[Deck] Servidor:', opp, cards.length, 'cartas');
          } else { orig.apply(window, arguments); }
        }).catch(function() { orig.apply(window, arguments); });
    };
    window.installStoryDecks._patched = true;
  }

  function buildLoginUI() {
    if (document.getElementById('fmrLogin')) return;
    var s = document.createElement('style');
    s.textContent = [
      '#fmrLogin{position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#060614,#1a0800);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:"Segoe UI",sans-serif}',
      '#fmrBox{background:#111120;border:2px solid #8b6914;border-radius:12px;padding:32px;width:340px;box-shadow:0 0 50px #ffd70033}',
      '.fmrH1{color:#ffd700;font-size:1.9rem;font-weight:bold;letter-spacing:4px;text-align:center;text-shadow:0 0 24px #ffd70066}',
      '.fmrH2{color:#555;font-size:.75rem;letter-spacing:8px;text-align:center;margin:4px 0 28px}',
      '.fmrTabs{display:flex;border-radius:6px;overflow:hidden;margin-bottom:20px;border:1px solid #333}',
      '.fmrTab{flex:1;padding:9px;border:none;cursor:pointer;font-weight:700;font-size:.82rem;transition:.2s}',
      '.fmrOn{background:#8b6914;color:#fff}.fmrOff{background:#0d0d1a;color:#666}',
      '.fmrL{display:block;color:#888;font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}',
      '.fmrI{width:100%;background:#060614;border:1px solid #333;color:#e8d5a3;padding:10px 12px;border-radius:5px;font-size:.9rem;margin-bottom:14px;box-sizing:border-box;outline:none}',
      '.fmrI:focus{border-color:#8b6914}',
      '.fmrBtn{width:100%;padding:13px;background:#8b6914;border:none;border-radius:5px;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;letter-spacing:1px}',
      '.fmrBtn:hover{background:#b8881c}',
      '.fmrErr{color:#ff5555;font-size:.8rem;min-height:18px;text-align:center;margin-bottom:10px}',
      '.fmrSkip{display:block;text-align:center;margin-top:14px;color:#444;font-size:.73rem;cursor:pointer;text-decoration:underline}'
    ].join('');
    document.head.appendChild(s);
    var div = document.createElement('div');
    div.id = 'fmrLogin';
    div.innerHTML =
      '<div class="fmrH1">FORBIDDEN MEMORIES</div><div class="fmrH2">REBORN</div>' +
      '<div id="fmrBox">' +
        '<div class="fmrTabs">' +
          '<button class="fmrTab fmrOn" id="fmrTI">Iniciar Sesion</button>' +
          '<button class="fmrTab fmrOff" id="fmrTR">Crear Cuenta</button>' +
        '</div>' +
        '<label class="fmrL">Nombre de jugador</label>' +
        '<input class="fmrI" id="fmrU" type="text" maxlength="32" placeholder="Tu nombre">' +
        '<label class="fmrL">Clave</label>' +
        '<input class="fmrI" id="fmrP" type="password" maxlength="64" placeholder="Min. 4 caracteres">' +
        '<div id="fmrCB" style="display:none">' +
          '<label class="fmrL">Confirmar clave</label>' +
          '<input class="fmrI" id="fmrPC" type="password" maxlength="64" placeholder="Repetir clave">' +
        '</div>' +
        '<div class="fmrErr" id="fmrE"></div>' +
        '<button class="fmrBtn" id="fmrGo">ENTRAR</button>' +
        '<span class="fmrSkip" id="fmrSkipBtn">Jugar sin cuenta (solo esta sesion)</span>' +
      '</div>';
    document.body.appendChild(div);

    window.fmrMode = 'login';
    function setMode(m) {
      window.fmrMode = m;
      var r = m === 'register';
      document.getElementById('fmrTI').className  = 'fmrTab ' + (r ? 'fmrOff' : 'fmrOn');
      document.getElementById('fmrTR').className  = 'fmrTab ' + (r ? 'fmrOn' : 'fmrOff');
      document.getElementById('fmrCB').style.display = r ? 'block' : 'none';
      document.getElementById('fmrGo').textContent   = r ? 'CREAR CUENTA' : 'ENTRAR';
      document.getElementById('fmrE').textContent    = '';
    }
    document.getElementById('fmrTI').addEventListener('click', function() { setMode('login'); });
    document.getElementById('fmrTR').addEventListener('click', function() { setMode('register'); });
    document.getElementById('fmrGo').addEventListener('click', doSubmit);
    document.getElementById('fmrSkipBtn').addEventListener('click', goOffline);
    div.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSubmit(); });
    setTimeout(function() { var u = document.getElementById('fmrU'); if (u) u.focus(); }, 80);

    function doSubmit() {
      var name = (document.getElementById('fmrU').value || '').trim();
      var pass = document.getElementById('fmrP').value;
      var err  = document.getElementById('fmrE');
      if (!name) { err.textContent = 'Escribe tu nombre'; return; }
      if (!pass) { err.textContent = 'Escribe tu clave'; return; }
      if (window.fmrMode === 'register') {
        var pc = (document.getElementById('fmrPC') || {}).value || '';
        if (pass !== pc) { err.textContent = 'Las claves no coinciden'; return; }
        if (pass.length < 4) { err.textContent = 'Minimo 4 caracteres'; return; }
        err.textContent = 'Creando cuenta...';
        apiPost('/api/register', { name: name, password: pass }, function(r) {
          if (r.error) { err.textContent = r.error; return; }
          SESSION = { name: r.save.name, password: pass };
          fmrStart(r.save);
        });
      } else {
        err.textContent = 'Iniciando sesion...';
        apiPost('/api/login', { name: name, password: pass }, function(r) {
          if (r.error) { err.textContent = r.error; return; }
          SESSION = { name: r.save.name, password: pass };
          fmrStart(r.save);
        });
      }
    }

    function goOffline() {
      SESSION = null; SERVER_MODE = false;
      var ov = document.getElementById('fmrLogin'); if (ov) ov.remove();
      if (window._fmrOrig) window._fmrOrig();
    }
    window._fmrGoOffline = goOffline;
  }

  function fmrStart(saveData) {
    try { window.memorySave = saveData; } catch(_) {}
    try { localStorage.setItem('FMR_REBORN_STORY_V3000', JSON.stringify(saveData)); } catch(_) {}
    var ov = document.getElementById('fmrLogin'); if (ov) ov.remove();
    patchSaveFunctions();
    setTimeout(patchInstallStoryDecks, 300);
    if (window._fmrOrig) window._fmrOrig();
  }

  // ── INTERCEPCION SINCRONA ────────────────────────────────────────
  // Se llama AHORA (al parsear el script, pre-DOMContentLoaded).
  // Si customShowMain no existe aun, reintenta en 50ms.
  function interceptNow() {
    if (!window.customShowMain) { setTimeout(interceptNow, 50); return; }
    if (window.customShowMain._fmrP) return;
    var orig = window.customShowMain;
    window._fmrOrig = orig;

    window.customShowMain = function() {
      if (!SERVER_CHECK_DONE) { setTimeout(window.customShowMain, 80); return; }
      if (SERVER_MODE) { buildLoginUI(); return; }
      orig.apply(this, arguments);
    };
    window.customShowMain._fmrP = true;
    if (window.nativeAPI) window.nativeAPI.showMain = window.customShowMain;
    console.log('[Auth] customShowMain interceptado de forma sincrona.');
  }

  interceptNow(); // <-- SINCRONO, pre-DOMContentLoaded

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(patchInstallStoryDecks, 600);
  });

})();
`;

const patchPath = 'C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js';
const current = fs.readFileSync(patchPath, 'utf8');
fs.writeFileSync(patchPath, current + loginBlock, 'utf8');
console.log('Login block added. Patch size:', (current + loginBlock).length);