/* ==========================================================================
   SISTEMA DE DETECCIÓN MÓVIL Y OPTIMIZACIÓN TÁCTIL (MOBILE UX SUITE)
   ========================================================================== */
(function initMobileOptimizationSuite() {
  if (window.__mobileSuiteInitialized) return;
  window.__mobileSuiteInitialized = true;

  // Inyección de estilos de la Suite Móvil
  const mStyle = document.createElement('style');
  mStyle.id = 'fmr-mobile-ux-styles';
  mStyle.textContent = `
    /* Controles y HUD Flotante */
    #fmr-mobile-floating-hud {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 9999999;
      display: flex;
      gap: 6px;
      align-items: center;
      pointer-events: auto;
    }
    .m-hud-btn {
      background: linear-gradient(180deg, #302213 0%, #150f09 100%);
      border: 1.5px solid #d4af37;
      color: #ffd700;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      font-weight: 800;
      padding: 6px 10px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.7);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
    }
    .m-hud-btn:active {
      transform: scale(0.94);
      background: #44321c;
    }
    .m-hud-apk {
      background: linear-gradient(180deg, #1b3a1d 0%, #0d200e 100%);
      border-color: #5cd65c;
      color: #a3f7a3;
    }

    /* Aviso de Pantalla Vertical */
    #fmr-mobile-portrait-prompt {
      position: fixed;
      inset: 0;
      z-index: 99999999;
      background: rgba(8, 5, 2, 0.94);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    .m-prompt-card {
      background: linear-gradient(180deg, #241604 0%, #120b02 100%);
      border: 2px solid #ffd700;
      border-radius: 16px;
      padding: 24px 20px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.9), 0 0 25px rgba(255,215,0,0.3);
    }
    .m-prompt-icon {
      font-size: 42px;
      margin-bottom: 10px;
      animation: mIconSpin 2.5s infinite ease-in-out;
    }
    @keyframes mIconSpin {
      0%, 100% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(90deg) scale(1.1); }
    }
    .m-prompt-title {
      color: #ffd700;
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .m-prompt-desc {
      color: #e0d0b0;
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 18px;
    }
    .m-prompt-btns {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .m-prompt-btn-full {
      background: linear-gradient(180deg, #d4af37 0%, #997a15 100%);
      color: #000;
      border: 1px solid #fff;
      border-radius: 8px;
      padding: 12px;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
    }
    .m-prompt-btn-dismiss {
      background: transparent;
      color: #a09070;
      border: 1px solid #4a3820;
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    /* Barra Táctil Flotante de Acciones en Combate */
    #fmr-mobile-action-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      z-index: 9999998;
      background: linear-gradient(180deg, rgba(32, 22, 12, 0.98) 0%, rgba(12, 8, 4, 1) 100%);
      border-top: 2px solid #ffd700;
      box-shadow: 0 -8px 25px rgba(0,0,0,0.85);
      padding: 8px 12px 14px;
      box-sizing: border-box;
      display: none;
      flex-direction: column;
      gap: 6px;
      animation: mSlideUp 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #fmr-mobile-action-bar.active {
      display: flex !important;
    }
    @keyframes mSlideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .m-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
    }
    .m-bar-cardname {
      color: #ffd700;
      font-size: 14px;
      font-weight: 900;
      text-shadow: 0 1px 2px #000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 65%;
    }
    .m-bar-stats {
      color: #a3e9a4;
      font-size: 12px;
      font-weight: 800;
    }
    .m-bar-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .m-act-btn {
      flex: 1;
      min-width: 74px;
      min-height: 42px;
      padding: 8px 6px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #a48750;
      box-shadow: 0 3px 6px rgba(0,0,0,0.6);
      touch-action: manipulation;
    }
    .m-act-btn:active {
      transform: scale(0.95);
    }
    .m-act-atk {
      background: linear-gradient(180deg, #b83a20 0%, #681d0d 100%);
      border-color: #ff6b4a;
      color: #fff;
    }
    .m-act-set {
      background: linear-gradient(180deg, #2b4670 0%, #15253d 100%);
      border-color: #5c8ed6;
      color: #fff;
    }
    .m-act-spell {
      background: linear-gradient(180deg, #1d6e52 0%, #0d3829 100%);
      border-color: #4edba7;
      color: #fff;
    }
    .m-act-trap {
      background: linear-gradient(180deg, #7c2258 0%, #420f2e 100%);
      border-color: #e652ad;
      color: #fff;
    }
    .m-act-fuse {
      background: linear-gradient(180deg, #6c2da3 0%, #3a155a 100%);
      border-color: #b96bfa;
      color: #fff;
    }
    .m-act-pos {
      background: linear-gradient(180deg, #5c5535 0%, #2e2a18 100%);
      border-color: #c4b66c;
      color: #fff;
    }
    .m-act-info {
      background: #251d14;
      border-color: #ffd700;
      color: #ffd700;
      flex: 0 0 46px;
      min-width: 46px;
    }
    .m-act-cancel {
      background: #1b1612;
      border-color: #665034;
      color: #aaa;
      flex: 0 0 38px;
      min-width: 38px;
    }

    /* Modal de Detalles de Carta Táctil */
    #fmr-mobile-card-modal {
      position: fixed;
      inset: 0;
      z-index: 99999999;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(6px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    .m-card-modal-content {
      background: linear-gradient(180deg, #251a0c 0%, #120c06 100%);
      border: 2px solid #ffd700;
      border-radius: 14px;
      width: min(440px, 94vw);
      max-height: 90vh;
      overflow-y: auto;
      padding: 18px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.9);
      box-sizing: border-box;
    }
    .m-card-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #6b5238;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .m-card-modal-title {
      color: #ffd700;
      font-size: 18px;
      font-weight: 900;
    }
    .m-card-modal-close {
      background: #392b1a;
      border: 1px solid #ffd700;
      color: #ffd700;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .m-card-modal-body {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .m-card-modal-art {
      flex: 0 0 110px;
      height: 155px;
      border: 2px solid #a88954;
      border-radius: 6px;
      overflow: hidden;
      background: #000;
    }
    .m-card-modal-art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .m-card-modal-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .m-card-modal-type {
      color: #c9b48c;
      font-size: 13px;
    }
    .m-card-modal-stats {
      color: #ffd700;
      font-size: 14px;
      font-weight: 800;
    }
    .m-card-modal-desc {
      color: #ddd;
      font-size: 12px;
      line-height: 1.45;
      background: rgba(0,0,0,0.4);
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #4a3a28;
    }

    /* Ajustes responsivos para teléfono en landscape (horizontal) */
    @media (orientation: landscape) and (max-height: 540px) {
      .wrap {
        padding: 2px !important;
        max-width: 100vw !important;
      }
      .board {
        padding: 4px !important;
        gap: 4px !important;
      }
      .zone, .zones .zone, .zones.backrow .zone,
      #playerBack .zone, #enemyBack .zone, #player .zone, #enemy .zone {
        height: 64px !important;
        min-height: 64px !important;
        max-height: 64px !important;
      }
      .cardTop .name {
        font-size: 8px !important;
      }
      .cardArt {
        min-height: 28px !important;
      }
      .artIcon {
        font-size: 18px !important;
      }
      .stats {
        font-size: 8px !important;
        padding: 1px 2px !important;
      }
      .sideLog {
        height: 110px !important;
        font-size: 7.5px !important;
      }
      .phaseBar {
        gap: 4px !important;
        margin: 3px 0 !important;
      }
      .phaseBtn {
        min-width: 44px !important;
        padding: 4px 6px !important;
        font-size: 11px !important;
      }
    }
  `;
  document.head.appendChild(mStyle);

  // 1. Detección Inteligente de Dispositivo Móvil
  function checkIsMobile() {
    const nav = (typeof window !== 'undefined' && window.navigator) || (typeof navigator !== 'undefined' && navigator) || {};
    const ua = nav.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const hasTouch = (nav.maxTouchPoints > 0) || ('ontouchstart' in window);
    const isTouchPhoneOrTablet = hasTouch && (Math.min(window.innerWidth || 9999, window.innerHeight || 9999) <= 850);
    return isMobileUA || isTouchPhoneOrTablet;
  }

  window.isMobileDevice = checkIsMobile();

  // 2. Detección de Orientación
  let portraitPromptDismissed = false;
  function updateOrientation() {
    window.isMobileDevice = checkIsMobile();
    const isPortrait = window.innerHeight > window.innerWidth;

    if (window.isMobileDevice) {
      document.body.classList.add('is-mobile-device');
    } else {
      document.body.classList.remove('is-mobile-device');
    }

    if (isPortrait) {
      document.body.classList.add('mobile-portrait');
      document.body.classList.remove('mobile-landscape');
    } else {
      document.body.classList.add('mobile-landscape');
      document.body.classList.remove('mobile-portrait');
    }

    handlePortraitPrompt(isPortrait);
  }

  // 3. Aviso Retro PS1 de Giro de Pantalla
  function handlePortraitPrompt(isPortrait) {
    let promptEl = document.getElementById('fmr-mobile-portrait-prompt');
    if (!window.isMobileDevice || !isPortrait || portraitPromptDismissed) {
      if (promptEl) promptEl.style.display = 'none';
      return;
    }

    if (!promptEl) {
      promptEl = document.createElement('div');
      promptEl.id = 'fmr-mobile-portrait-prompt';
      promptEl.innerHTML = `
        <div class="m-prompt-card">
          <div class="m-prompt-icon">📱 ➔ 🔄</div>
          <div class="m-prompt-title">MODO MÓVIL DETECTADO</div>
          <div class="m-prompt-desc">Gira tu teléfono horizontalmente (Landscape) para la mejor experiencia y control completo del tablero retro PS1.</div>
          <div class="m-prompt-btns">
            <button class="m-prompt-btn-full" id="m-btn-fullscreen">⛶ Pantalla Completa</button>
            <button class="m-prompt-btn-dismiss" id="m-btn-dismiss">Continuar en Vertical</button>
          </div>
        </div>
      `;
      document.body.appendChild(promptEl);

      const fsBtn = document.getElementById('m-btn-fullscreen');
      if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

      const disBtn = document.getElementById('m-btn-dismiss');
      if (disBtn) disBtn.addEventListener('click', () => {
        portraitPromptDismissed = true;
        promptEl.style.display = 'none';
      });
    }

    promptEl.style.display = 'flex';
  }

  // 4. Modo Pantalla Completa (Fullscreen)
  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (_) {}
  }
  window.toggleFullscreen = toggleFullscreen;

  // 5. Botón Flotante de Pantalla Completa y Enlace APK
  function injectMobileFloatingControls() {
    if (document.getElementById('fmr-mobile-floating-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'fmr-mobile-floating-hud';
    hud.innerHTML = `
      <button class="m-hud-btn" id="m-hud-fs-btn" title="Pantalla Completa">⛶</button>
      <a class="m-hud-btn m-hud-apk" id="m-hud-apk-btn" href="/download/app.apk" download title="Descargar APK Android">📲 APK</a>
    `;
    document.body.appendChild(hud);

    const fsBtn = document.getElementById('m-hud-fs-btn');
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
  }

  // 6. Barra Táctil Flotante de Acciones (Mobile Action Bar)
  function updateMobileActionBar() {
    if (!window.isMobileDevice) return;
    let bar = document.getElementById('fmr-mobile-action-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'fmr-mobile-action-bar';
      document.body.appendChild(bar);
    }

    const g = window.game;
    if (!g || !g.selected || g.selected.length === 0) {
      bar.classList.remove('active');
      bar.innerHTML = '';
      return;
    }

    const sel = g.selected[0];
    const type = sel[0];
    const idx = sel[1];

    let card = null;
    let isHand = (type === 'h');
    let isPlayerField = (type === 'p');

    if (isHand && g.hand) {
      card = g.hand[idx];
    } else if (isPlayerField && g.field) {
      card = g.field[idx];
    }

    if (!card) {
      bar.classList.remove('active');
      bar.innerHTML = '';
      return;
    }

    const cObj = (typeof window.resolveGameCard === 'function') ? window.resolveGameCard(card) : (Array.isArray(card) ? { name: card[0], kind: card[6] || 'MONSTER', atk: card[4], def: card[5] } : card);
    const cName = cObj.name || card[0] || 'Carta';
    const cKind = cObj.kind || (cObj.isSpell ? 'SPELL' : (cObj.isTrap ? 'TRAP' : 'MONSTER'));

    let buttonsHtml = '';

    if (isHand) {
      if (cKind === 'MONSTER') {
        buttonsHtml += '<button class="m-act-btn m-act-atk" id="m-btn-summon-atk">⚔ INVOCAR</button>';
        buttonsHtml += '<button class="m-act-btn m-act-set" id="m-btn-summon-set">🛡 SET</button>';
        if (typeof window.fuse === 'function') {
          buttonsHtml += '<button class="m-act-btn m-act-fuse" id="m-btn-fuse">🔄 FUSIÓN</button>';
        }
      } else if (cKind === 'SPELL' || cKind === 'MAGIC') {
        buttonsHtml += '<button class="m-act-btn m-act-spell" id="m-btn-spell-act">✨ ACTIVAR</button>';
        buttonsHtml += '<button class="m-act-btn m-act-set" id="m-btn-spell-set">🛡 SET</button>';
      } else if (cKind === 'TRAP') {
        buttonsHtml += '<button class="m-act-btn m-act-trap" id="m-btn-trap-set">🛡 COLOCAR SET</button>';
      }
    } else if (isPlayerField) {
      buttonsHtml += '<button class="m-act-btn m-act-atk" id="m-btn-field-atk">⚔ ATACAR</button>';
      buttonsHtml += '<button class="m-act-btn m-act-pos" id="m-btn-field-pos">🔄 CAMBIAR POS</button>';
    }

    buttonsHtml += '<button class="m-act-btn m-act-info" id="m-btn-details">👁 DETALLES</button>';
    buttonsHtml += '<button class="m-act-btn m-act-cancel" id="m-btn-cancel">✕</button>';

    const statsStr = (cObj.atk !== undefined) ? ('⚔' + cObj.atk + ' 🛡' + cObj.def) : '';

    bar.innerHTML = `
      <div class="m-bar-header">
        <span class="m-bar-cardname">${cName}</span>
        ${statsStr ? `<span class="m-bar-stats">${statsStr}</span>` : ''}
      </div>
      <div class="m-bar-buttons">${buttonsHtml}</div>
    `;
    bar.classList.add('active');

    const btnAtk = document.getElementById('m-btn-summon-atk');
    if (btnAtk) btnAtk.onclick = () => {
      if (typeof window.normalSummon === 'function') window.normalSummon();
      bar.classList.remove('active');
    };

    const btnSet = document.getElementById('m-btn-summon-set') || document.getElementById('m-btn-trap-set') || document.getElementById('m-btn-spell-set');
    if (btnSet) btnSet.onclick = () => {
      if (typeof window.setCard === 'function') window.setCard();
      else if (typeof window.normalSummon === 'function') window.normalSummon();
      bar.classList.remove('active');
    };

    const btnSpellAct = document.getElementById('m-btn-spell-act');
    if (btnSpellAct) btnSpellAct.onclick = () => {
      if (typeof window.activateSpell === 'function') window.activateSpell(idx);
      else if (typeof window.normalSummon === 'function') window.normalSummon();
      bar.classList.remove('active');
    };

    const btnFuse = document.getElementById('m-btn-fuse');
    if (btnFuse) btnFuse.onclick = () => {
      if (typeof window.fuse === 'function') window.fuse();
      bar.classList.remove('active');
    };

    const btnFieldAtk = document.getElementById('m-btn-field-atk');
    if (btnFieldAtk) btnFieldAtk.onclick = () => {
      if (typeof window.attack === 'function') window.attack();
      bar.classList.remove('active');
    };

    const btnFieldPos = document.getElementById('m-btn-field-pos');
    if (btnFieldPos) btnFieldPos.onclick = () => {
      if (typeof window.changePosition === 'function') window.changePosition();
      bar.classList.remove('active');
    };

    const btnDetails = document.getElementById('m-btn-details');
    if (btnDetails) btnDetails.onclick = () => {
      showMobileCardDetailsModal(cObj);
    };

    const btnCancel = document.getElementById('m-btn-cancel');
    if (btnCancel) btnCancel.onclick = () => {
      if (window.game) window.game.selected = [];
      if (typeof window.render === 'function') window.render();
      bar.classList.remove('active');
    };
  }

  // 7. Modal de Detalles Táctiles de Carta
  function showMobileCardDetailsModal(card) {
    let modal = document.getElementById('fmr-mobile-card-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'fmr-mobile-card-modal';
      document.body.appendChild(modal);
    }

    const name = card.name || 'Carta';
    const kind = card.kind || (card.isSpell ? 'MAGIA' : (card.isTrap ? 'TRAMPA' : 'MONSTRUO'));
    const atk = (card.atk !== undefined) ? card.atk : '-';
    const def = (card.def !== undefined) ? card.def : '-';
    const stars = card.stars || card.level || 0;
    const desc = card.desc || card.description || card.effect || 'Sin descripción especial.';

    let imgSrc = '';
    if (window.CUSTOM_LOCAL_IMAGES && card.id && window.CUSTOM_LOCAL_IMAGES[card.id]) {
      imgSrc = window.CUSTOM_LOCAL_IMAGES[card.id];
    } else if (window.CARD_FILES && window.CARD_FILES[name]) {
      imgSrc = 'assets/bandai1998/' + window.CARD_FILES[name];
    }

    modal.innerHTML = `
      <div class="m-card-modal-content">
        <div class="m-card-modal-header">
          <span class="m-card-modal-title">${name}</span>
          <button class="m-card-modal-close" id="m-card-modal-close-btn">✕</button>
        </div>
        <div class="m-card-modal-body">
          ${imgSrc ? `<div class="m-card-modal-art"><img src="${imgSrc}" alt="${name}"></div>` : ''}
          <div class="m-card-modal-info">
            <div class="m-card-modal-type">Tipo: <b>${kind}</b> ${stars ? `· Nivel: <b>${'★'.repeat(Math.min(12, stars))}</b>` : ''}</div>
            ${kind === 'MONSTER' || kind === 'MONSTRUO' ? `<div class="m-card-modal-stats">⚔ ATK: <b>${atk}</b> &nbsp;|&nbsp; 🛡 DEF: <b>${def}</b></div>` : ''}
            <div class="m-card-modal-desc">${desc}</div>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';

    document.getElementById('m-card-modal-close-btn').onclick = () => {
      modal.style.display = 'none';
    };
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };
  }
  window.showMobileCardDetailsModal = showMobileCardDetailsModal;

  // 8. Integración con el Render Loop
  function attachMobileRenderHook() {
    const origRender = window.render;
    if (typeof origRender === 'function' && !window.__origRenderHooked) {
      window.__origRenderHooked = true;
      window.render = function() {
        origRender.apply(this, arguments);
        try { updateMobileActionBar(); } catch (_) {}
      };
    }
  }

  window.updateMobileActionBar = updateMobileActionBar;

  // 9. Listeners de pantalla, rotación y carga
  window.addEventListener('resize', updateOrientation);
  window.addEventListener('orientationchange', updateOrientation);

  function boot() {
    updateOrientation();
    injectMobileFloatingControls();
    attachMobileRenderHook();
  }

  if (document.body) boot();
  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 400);

})();
