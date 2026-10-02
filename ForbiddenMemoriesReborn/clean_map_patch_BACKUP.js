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
fontLink.rel = 'stylesheet'; fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
document.head.appendChild(fontLink);

let duelScaleStyle = document.createElement('style');
duelScaleStyle.textContent = `
    .wrap { zoom: 1.20; margin-top: 3vh !important; }
    .cardInfoPanel { transform: scale(1.15); transform-origin: center right; }
`;
document.head.appendChild(duelScaleStyle);

const portraitMap = {
    'MOTO': 'abueloYugi.jpg', 'TRISTAN_INTRO': 'DialogoSetoKaiba.png', 'TRISTAN': 'Tristan.jpg', 'WEEVIL': 'Weevil.jpeg', 'MAI': 'Mai.jpeg',
    'JOEY': 'Joey.jpeg', 'PEGASUS': 'Pegasus.jpeg', 'BAKURA': 'Bakura.jpeg', 'MARIK': 'Marik.jpeg', 'ISHIZU': 'Ishuzu.jpeg',
    'ODION': 'Odion.jpeg', 'NOAH': 'NoahKaiba.jpeg', 'SETO': 'SetoKaiba.jpeg', 'YUGI': 'YugiMoTo.jpeg',
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
window.playCustomMusic = function(fileName) {
    if (window.FMRMusic302 && typeof window.FMRMusic302.stop === 'function') window.FMRMusic302.stop(); 
    let audio = document.getElementById('bgm3000');
    if (!audio) {
        audio = document.createElement('audio'); audio.id = 'bgm3000'; audio.loop = true; document.body.appendChild(audio);
    }
    
    audio.playbackRate = (fileName.toLowerCase() === 'minijefes.mp3') ? 0.85 : 1.0;
    
    if (audio.src.includes(fileName)) {
        if (audio.paused && origGet('FMR_BGM_OFF') !== '1') audio.play().catch(e => console.log(e));
        return; 
    }
    audio.src = 'musica/' + fileName;
    if (origGet('FMR_BGM_OFF') !== '1') {
        audio.play().catch(e => console.log(e));
    }
};

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

window.customLog = function(t) {
    if (!t) return;
    let lower = t.toLowerCase();
    if (lower.includes('boca abajo') || lower.includes('coloca una trampa') || lower.includes('coloca una carta')) {
        window.playSFX('set');
    } else if (lower.includes('fusión →') || lower.includes('hace sincro') || lower.includes('hace xyz') || lower.includes('hace link')) {
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
        let ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.audioCtx = ctx; if (ctx.state === 'suspended') ctx.resume();
        let osc = ctx.createOscillator(); let gain = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.1);
    } catch(e){}
}

window.playHoverSound = function() {
    try {
        let ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.audioCtx = ctx; if (ctx.state === 'suspended') ctx.resume();
        let osc = ctx.createOscillator(); let gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.05);
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
    dialogBox.style.cssText = 'position: absolute; bottom: 0; left: 0; width: 100vw; background: rgba(0,0,0,0.85); border-top: 6px solid #666; padding: 40px 10vw; box-sizing: border-box; color:#fff; font-family:"Press Start 2P", monospace; min-height: 25vh; z-index:2; box-shadow: 0 -10px 30px rgba(0,0,0,0.8);';
    
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
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: url("ImagenesPersonajes/ruinas_fondo.jpg") center / cover, #000; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:"Press Start 2P", monospace; color:white;';
    
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
    nameBox.style.cssText = 'text-align: left; font-size: 24px; background: rgba(0,0,0,0.8); border: 4px solid #c4a04d; border-radius: 8px; padding: 15px 25px; width: 450px; height: 35px; line-height: 35px; box-shadow: 0 0 15px #a67c00, inset 0 0 10px #000; color: #ffcc00; font-family: "Press Start 2P", monospace; letter-spacing: 5px; text-transform: uppercase; display: flex; align-items: center;';
    let cursor = document.createElement('span'); cursor.innerHTML = '_'; cursor.style.cssText = 'animation: blink 1s infinite; margin-left: 5px; color: #00ff00;';
    
    nameBox.appendChild(nameText); nameBox.appendChild(cursor); nameBoxWrapper.appendChild(nameBox);
    container.appendChild(grid); container.appendChild(rightPanel); container.appendChild(nameBoxWrapper);
    overlay.appendChild(container); document.body.appendChild(overlay);
    
    function showConfirmDialog() {
        let confirmBox = document.createElement('div');
        confirmBox.style.cssText = 'position:absolute; bottom:60px; left:50%; transform:translateX(-50%); background: radial-gradient(circle at center, #2a3b2a 0%, #111 100%); border:4px solid #777; padding:4px; z-index:10; width: 80%; max-width: 600px; box-shadow: 0 0 30px #000;';
        let inner = document.createElement('div');
        inner.style.cssText = 'background: rgba(0,0,0,0.85); border: 2px solid #555; padding: 25px; text-align: left; font-family: "Press Start 2P", monospace;';
        let p = document.createElement('div'); p.innerHTML = `Your NAME is <span style="color:#ffff00">${currentName}</span>`;
        p.style.fontSize = '16px'; p.style.marginBottom = '25px'; p.style.color = '#fff';
        
        let yes = document.createElement('div'); yes.textContent = 'YES'; yes.style.cssText = 'cursor:pointer; color:#ffff00; font-size:16px; margin-bottom:10px; background: rgba(255,255,0,0.25); padding: 10px; width: fit-content;';
        let no = document.createElement('div'); no.textContent = 'NO'; no.style.cssText = 'cursor:pointer; color:#fff; font-size:16px; padding: 10px; width: fit-content;';
        
        yes.onmouseover = () => { yes.style.background = 'rgba(255,255,0,0.25)'; yes.style.color = '#ffff00'; no.style.background = 'transparent'; no.style.color = '#fff'; window.playHoverSound(); };
        no.onmouseover = () => { no.style.background = 'rgba(255,255,0,0.25)'; no.style.color = '#ffff00'; yes.style.background = 'transparent'; yes.style.color = '#fff'; window.playHoverSound(); };
        
        yes.onclick = () => { window.playViolinClick(); confirmBox.remove(); showEmailDialog(); };
        no.onclick = () => { window.playViolinClick(); confirmBox.remove(); };
        inner.appendChild(p); inner.appendChild(yes); inner.appendChild(no); confirmBox.appendChild(inner); overlay.appendChild(confirmBox);
    }
    
    function showEmailDialog() {
        let box = document.createElement('div');
        box.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.95); border:3px solid #888; padding:30px; text-align:center; z-index:10; width: 500px; box-shadow: 0 0 20px #000; display:flex; flex-direction:column; gap:20px; font-family: "Press Start 2P", monospace;';
        box.innerHTML = `<div style="color:#fff; font-size:12px; margin-bottom:10px; line-height: 1.6;">Crea tu cuenta para guardar tu progreso:</div>
            <input type="email" id="kb-email" placeholder="Correo electrónico" style="padding:15px; font-family:inherit; font-size:12px; background:#222; color:#fff; border:2px solid #555; outline:none;">
            <input type="password" id="kb-pass" placeholder="Contraseña" style="padding:15px; font-family:inherit; font-size:12px; background:#222; color:#fff; border:2px solid #555; outline:none;">
            <div style="display:flex; justify-content:center; gap:20px; margin-top:10px;">
                <button id="kb-start-btn" style="background:#006600; color:#fff; border:2px solid #00ff00; padding:15px 30px; font-family:inherit; cursor:pointer; font-size: 10px;">COMENZAR</button>
                <button id="kb-cancel-btn" style="background:#660000; color:#fff; border:2px solid #ff0000; padding:15px 30px; font-family:inherit; cursor:pointer; font-size: 10px;">CANCELAR</button>
            </div>`;
        overlay.appendChild(box);
        
        document.getElementById('kb-cancel-btn').onmouseover = window.playHoverSound;
        document.getElementById('kb-cancel-btn').onclick = () => { window.playViolinClick(); box.remove(); };
        document.getElementById('kb-start-btn').onmouseover = window.playHoverSound;
        document.getElementById('kb-start-btn').onclick = () => {
            window.playViolinClick();
            let email = document.getElementById('kb-email').value.trim();
            let pass = document.getElementById('kb-pass').value.trim();
            if(!email || !pass) return alert('Por favor llena todos los campos.');
            let accs = JSON.parse(origGet('FMR_ACCOUNTS') || '{}');
            if(accs[email] && accs[email].data) return alert('Este correo ya tiene partida. Usa LOAD en el menú.');
            overlay.remove(); onComplete(currentName, email, pass);
        };
    }
};

window.customShowMain = function() {
    if (window.nativeAPI && window.nativeAPI.showShell) window.nativeAPI.showShell();
    
    let camp = document.getElementById('campaign3000');
    if (!camp) return;
    camp.innerHTML = '';
    camp.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: url("ImagenesPersonajes/PortadaPrincipal.jpeg") center / cover no-repeat, #000; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999;';
    
    let clickOverlay = document.createElement('div');
    clickOverlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; display:flex; justify-content:center; align-items:center; color:#ffcc00; font-family:"Press Start 2P", monospace; font-size:24px; cursor:pointer;';
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
        renderPS1Keyboard((name, email, pass) => {
            window.activeAccount = email;
            origSet('FMR_ACTIVE_ACCOUNT', email);
            let accs = JSON.parse(origGet('FMR_ACCOUNTS') || '{}');
            accs[email] = { password: pass, data: null };
            origSet('FMR_ACCOUNTS', JSON.stringify(accs));
            
            // Set save state using exposed API!
            let ms = window.nativeAPI.freshState(name);
            window.nativeAPI.saveGame(); // Wait, memorySave is internal. We need to pass ms to freshState?
            // Actually, in our regex replacement we exposed freshState and saveGame, but memorySave is closure.
            // A better way is just to manually create it in localStorage:
            origSet('FMR_REBORN_STORY_V3000', JSON.stringify(ms)); // this triggers our proxy and saves to account!
            
            // Show prologue directly!
            window.playCustomMusic('dialogos.mp3');
            window.renderCustomStoryDialog(introDialog, 0, () => {
                window.renderCustomStoryDialog(tristanIntroDialog, 0, () => {
                    localStorage.setItem('FMR_PROLOGUE_SEEN', '1');
                    window.customShowMap();
                });
            });
        });
    };
    
    let btnLoad = document.createElement('button');
    btnLoad.className = 'campBtn3000 ps1-btn'; btnLoad.textContent = 'CARGAR';
    btnLoad.onmouseover = window.playHoverSound;
    btnLoad.onclick = () => {
        window.playViolinClick();
        
        // If already logged in and has a save, go straight to map!
        if (window.activeAccount && origGet('FMR_SAVE_' + window.activeAccount)) {
            window.customShowMap();
            return;
        }
        
        let overlay = document.createElement('div');
        overlay.id = 'login-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;justify-content:center;align-items:center; font-family:"Press Start 2P", monospace;';
        let box = document.createElement('div');
        box.style.cssText = 'width: 400px; padding: 30px; display: flex; flex-direction: column; gap: 15px; background:rgba(0,0,0,0.9); border:4px solid #555;';
        box.innerHTML = `<h2 style="color:#fff; font-size:16px; text-align:center;">CARGAR PARTIDA</h2>
            <input type="email" id="login-email" placeholder="Correo electrónico" style="padding:15px; background:#222; color:#fff; border:2px solid #555; font-family:inherit; font-size:12px;">
            <input type="password" id="login-pass" placeholder="Contraseña" style="padding:15px; background:#222; color:#fff; border:2px solid #555; font-family:inherit; font-size:12px;">
            <button id="btn-login" style="width:100%; padding:15px; background:#006600; color:#fff; border:2px solid #00ff00; font-family:inherit; cursor:pointer; font-size:12px;">INICIAR SESIÓN</button>
            <button id="btn-login-close" style="width:100%; padding:15px; background:#660000; color:#fff; border:2px solid #ff0000; font-family:inherit; cursor:pointer; font-size:12px;">CANCELAR</button>`;
        overlay.appendChild(box); document.body.appendChild(overlay);
        
        document.getElementById('btn-login-close').onmouseover = window.playHoverSound;
        document.getElementById('btn-login-close').onclick = () => { window.playViolinClick(); overlay.remove(); };
        document.getElementById('btn-login').onmouseover = window.playHoverSound;
        document.getElementById('btn-login').onclick = () => {
            window.playViolinClick();
            let email = document.getElementById('login-email').value.trim();
            let pass = document.getElementById('login-pass').value.trim();
            if(!email || !pass) return alert("Llena todos los campos.");
            
            let accs = JSON.parse(origGet('FMR_ACCOUNTS') || '{}');
            if(!accs[email]) return alert("No se encontró ninguna partida con ese correo.");
            if(accs[email].password !== pass) return alert("Contraseña incorrecta.");
            if(!accs[email].data) return alert("Esta cuenta se creó pero no inició ninguna partida.");
            
            window.activeAccount = email; 
            origSet('FMR_ACTIVE_ACCOUNT', email); 
            
            // Reload page to re-initialize native state with the loaded save!
            location.reload(); 
        };
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
    window.customShowMap();
};

window.CUSTOM_NODES = [
    { id: 'n1', left: '50%', top: '85%', label: 'TRISTAN', char: 'TRISTAN', req: [] },
    { id: 'n2', left: '35%', top: '75%', label: 'WEEVIL', char: 'WEEVIL', req: ['tristan'] },
    { id: 'n3', left: '65%', top: '65%', label: 'MAI', char: 'MAI', req: ['weevil'] },
    { id: 'n4', left: '50%', top: '55%', label: 'JOEY', char: 'JOEY', req: ['mai'] },
    { id: 'n5', left: '30%', top: '45%', label: 'PEGASUS', char: 'PEGASUS', req: ['joey'] },
    { id: 'n6', left: '70%', top: '45%', label: 'BAKURA', char: 'BAKURA', req: ['pegasus'] },
    { id: 'n7', left: '50%', top: '35%', label: 'MARIK', char: 'MARIK', req: ['bakura'] },
    { id: 'n8', left: '35%', top: '25%', label: 'ISHIZU', char: 'ISHIZU', req: ['marik'] },
    { id: 'n9', left: '65%', top: '25%', label: 'ODION', char: 'ODION', req: ['ishizu'] },
    { id: 'n10', left: '50%', top: '15%', label: 'NOAH', char: 'NOAH', req: ['odion'] },
    { id: 'n11', left: '40%', top: '8%', label: 'KAIBA', char: 'SETO', req: ['noah'] },
    { id: 'n12', left: '60%', top: '8%', label: 'YUGI', char: 'YUGI', req: ['kaiba'] },
    { id: 'n13', left: '85%', top: '85%', label: 'SHOP', char: 'ABUELO', req: [] }, 
    { id: 'n14', left: '50%', top: '2%', label: 'PUERTA', char: 'ATEM', req: ['bakura','marik','ishizu','pegasus','yugi','kaiba','joey'] }
];

window.customShowMap = function() {
    if (window.nativeAPI && window.nativeAPI.showShell) window.nativeAPI.showShell();
    window.playCustomMusic('mapa.mp3');
    
    let camp = document.getElementById('campaign3000');
    if (camp) camp.innerHTML = '';
    
    let map = document.createElement('div');
    map.id = 'map-container-overlay';
    map.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999; background: url("ImagenesPersonajes/ruinas_fondo.jpg") center / cover, rgba(0,0,0,0.8); overflow: hidden;';
    
    const nodes = window.CUSTOM_NODES;

    let cleared = [];
    let unlocked = ['tristan'];
    try {
        let savedStr = origGet('FMR_SAVE_' + window.activeAccount);
        if (savedStr) {
            let saved = JSON.parse(savedStr);
            if (saved && saved.cleared) cleared = saved.cleared; 
            if (saved && saved.unlocked) unlocked = saved.unlocked;
        }
    } catch(e) {}
    
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 15;';
    
    for (let i = 0; i < 11; i++) {
        let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', nodes[i].left); line.setAttribute('y1', nodes[i].top);
        line.setAttribute('x2', nodes[i+1].left); line.setAttribute('y2', nodes[i+1].top);
        line.setAttribute('stroke', '#a67c00'); line.setAttribute('stroke-width', '4'); line.setAttribute('stroke-dasharray', '8,8');
        svg.appendChild(line);
    }
    let finalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    finalLine.setAttribute('x1', nodes[11].left); finalLine.setAttribute('y1', nodes[11].top);
    finalLine.setAttribute('x2', nodes[13].left); finalLine.setAttribute('y2', nodes[13].top);
    finalLine.setAttribute('stroke', '#a67c00'); finalLine.setAttribute('stroke-width', '4'); finalLine.setAttribute('stroke-dasharray', '8,8');
    svg.appendChild(finalLine);
    map.appendChild(svg);

    nodes.forEach(n => {
        let btn = document.createElement('div');
        btn.style.cssText = `position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; z-index: 16;`;
        btn.style.left = n.left; btn.style.top = n.top;
        
        let isUnlocked = true;
        if (n.char) {
            let cid = n.char.toLowerCase();
            if (cid === 'seto') cid = 'kaiba';
            if (cid === 'abuelo') isUnlocked = true;
            else if (cid === 'atem') isUnlocked = true;
            else isUnlocked = n.req.every(r => cleared.includes(r.toLowerCase()));
        }
        
        let isCleared = n.char && cleared.includes(n.char.toLowerCase() === 'seto' ? 'kaiba' : n.char.toLowerCase());
        
        let p = portraitMap[n.char];
        if (p) {
            let filterStyle = isCleared ? 'filter: grayscale(100%) brightness(0.6);' : (!isUnlocked ? 'filter: brightness(0.4);' : '');
            let hoverAction = (isCleared || !isUnlocked) ? '' : `onmouseover="this.style.transform='scale(1.1)'; window.playHoverSound();" onmouseout="this.style.transform='scale(1)'"`;
            btn.style.cursor = (isCleared || !isUnlocked) ? 'not-allowed' : 'pointer';
            
            let labelText = isCleared ? `<span style="color:#f54242">PASADO</span>` : (!isUnlocked ? '???' : n.label);
            
            btn.innerHTML = `<div style="width: 70px; height: 70px; border-radius: 50%; border: 3px solid #e4c06b; overflow: hidden; box-shadow: 0 0 15px #000; background: #000; transition: transform 0.2s; ${filterStyle}" ${hoverAction}>
                <img src="ImagenesPersonajes/${p}" style="width: 100%; height: 100%; object-fit: cover; object-position: top;" onerror="this.src='https://i.imgur.com/vHqR8Kq.png'">
            </div><div style="background: rgba(0,0,0,0.8); border: 2px solid #a67c00; padding: 4px 8px; border-radius: 6px; color: #fff; font-size: 12px; font-family:'Press Start 2P', monospace; text-shadow: 2px 2px 0px #000;">${labelText}</div>`;
        }
        
        btn.onclick = () => {
            if (isCleared) return; // Cannot fight defeated characters
            if (!isUnlocked) { window.playViolinClick(); return alert('Debes superar los duelos anteriores para desbloquear este camino.'); }
                window.playViolinClick();
                if (n.id === 'n13') {
                    let shopDialog = [{ role: 'system', speaker: 'MOTO', text: '¡Bienvenido a mi tienda! ¿Deseas ver el inventario o ajustar tu deck?' }];
                    window.playCustomMusic('dialogos.mp3');
                    window.renderCustomStoryDialog(shopDialog, 0, () => {
                        let choiceUI = document.createElement('div');
                        choiceUI.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;justify-content:center;align-items:center;flex-direction:column;gap:30px;';
                        
                        let question = document.createElement('div');
                        question.textContent = '¿Entrar a la tienda?';
                        question.style.cssText = 'color:#ffcc00;font-family:"Press Start 2P",monospace;font-size:32px;text-shadow:4px 4px 0 #000;';
                        
                        let btnYes = document.createElement('button');
                        btnYes.className = 'campBtn3000 ps1-btn ps1-btn-green';
                        btnYes.textContent = 'SÍ';
                        btnYes.style.fontSize = '24px';
                        btnYes.onclick = () => {
                            window.playViolinClick();
                            choiceUI.remove();
                            window.openCustomShopMenu();
                        };
                        
                        let btnNo = document.createElement('button');
                        btnNo.className = 'campBtn3000 ps1-btn ps1-btn-red';
                        btnNo.textContent = 'NO';
                        btnNo.style.fontSize = '24px';
                        btnNo.onclick = () => {
                            window.playViolinClick();
                            choiceUI.remove();
                            window.playCustomMusic('mapa.mp3');
                        };
                        
                        let row = document.createElement('div');
                        row.style.cssText = 'display:flex;gap:40px;';
                        row.appendChild(btnYes);
                        row.appendChild(btnNo);
                        
                        choiceUI.appendChild(question);
                        choiceUI.appendChild(row);
                        document.body.appendChild(choiceUI);
                    });
                }
                else if (n.id === 'n14') {
                    let items = ['bakura','marik','ishizu','pegasus','yugi','kaiba','joey'];
                    let missing = items.filter(x => !origGet('FMR_ITEM_GIVEN_' + x));
                    if (missing.length === 0) { alert('¡Has reunido todos los Artículos del Milenio! El Nuevo Mundo se abrirá pronto.'); }
                    else { alert('Aún te faltan Artículos del Milenio. Derrota a los portadores para conseguirlos.'); }
                }
                else {
                    // Bypass EVERYTHING and call native start duel!
                    if (window.nativeAPI && window.nativeAPI.beginStoryDuel) {
                        window.lastDuelOpponent = n.char.toLowerCase();
                        
                        // Add intro dialogues
                        let introLines = [{ role: 'system', speaker: n.char.toUpperCase(), text: '¡Prepárate para el duelo!' }];
                        if (n.char.toLowerCase() === 'tristan') {
                            introLines = [{ role: 'system', speaker: 'TRISTAN_INTRO', text: '¡Bienvenido a tu primer duelo real! Veamos de qué estás hecho.' }];
                        }
                        
                        window.playCustomMusic('dialogos.mp3');
                        window.renderCustomStoryDialog(introLines, 0, () => {
                            map.remove();
                            window.nativeAPI.beginStoryDuel(n.char.toLowerCase());
                            
                            // Disable native music and play minijefes.mp3
                            if (window.FMRMusic302) {
                                window.FMRMusic302.start = function(){};
                                window.FMRMusic302.stop = function(){};
                            }
                            window.playCustomMusic('minijefes.mp3');
                        });
                    } else {
                        alert("API nativa no cargada.");
                    }
                }
            };
        map.appendChild(btn);
    });
    
    let exitBtn = document.createElement('button');
    exitBtn.textContent = 'VOLVER AL MENÚ';
    exitBtn.style.cssText = 'position: absolute; bottom: 30px; right: 30px; z-index: 20; background: rgba(0,0,0,0.8); border: 3px solid #c4a04d; color: #fceea4; padding: 15px 30px; font-weight: bold; cursor: pointer; border-radius: 8px; font-family:"Press Start 2P", monospace; font-size:12px;';
    exitBtn.onmouseover = window.playHoverSound;
    exitBtn.onclick = () => { 
        window.playViolinClick();
        map.remove(); 
        window.customShowMain();
    };
    map.appendChild(exitBtn);
    
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
    title.style.cssText = 'color: #ffcc00; font-family: "Press Start 2P", monospace; font-size: 32px; text-shadow: 4px 4px 0 #000; margin-bottom: 40px; text-align: center;';
    overlay.appendChild(title);
    
    let grid = document.createElement('div');
    grid.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; gap: 30px; max-width: 1000px;';
    
    let cleared = [];
    let wins = {};
    let losses = {};
    try {
        let savedStr = origGet('FMR_SAVE_' + window.activeAccount);
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
            </div><div style="background: rgba(0,0,0,0.8); border: 2px solid #a67c00; padding: 6px 10px; border-radius: 6px; color: #fff; font-size: 14px; font-family:'Press Start 2P', monospace; text-shadow: 2px 2px 0px #000; text-align:center; width: 100%; box-sizing: border-box;">
                ${n.label}<br><span style="font-size:10px; color:#aaa; display:block; margin-top:5px;">W:${w} / L:${l}</span>
            </div>`;
            card.onmouseover = () => { card.style.transform = 'scale(1.1)'; window.playHoverSound(); };
            card.onmouseout = () => { card.style.transform = 'scale(1)'; };
            card.onclick = () => {
                window.playViolinClick();
                overlay.remove();
                if (window.nativeAPI && window.nativeAPI.beginStoryDuel) {
                    window.lastDuelOpponent = cid;
                    // Disable native music and play minijefes.mp3
                    if (window.FMRMusic302) {
                        window.FMRMusic302.start = function(){};
                        window.FMRMusic302.stop = function(){};
                    }
                    window.nativeAPI.beginStoryDuel(cid);
                    window.playCustomMusic('minijefes.mp3');
                } else {
                    alert("API nativa no cargada.");
                }
            };
            grid.appendChild(card);
        }
    });
    
    if (grid.children.length === 0) {
        let msg = document.createElement('div');
        msg.innerHTML = 'Aún no has derrotado a ningún oponente.';
        msg.style.cssText = 'color: #fff; font-family: "Press Start 2P", monospace; font-size: 16px; margin-top: 50px;';
        grid.appendChild(msg);
    }
    
    overlay.appendChild(grid);
    
    let backBtn = document.createElement('button');
    backBtn.textContent = 'VOLVER A LA TIENDA';
    backBtn.style.cssText = 'margin-top: 50px; background: rgba(0,0,0,0.8); border: 3px solid #c4a04d; color: #fceea4; padding: 15px 30px; font-weight: bold; cursor: pointer; border-radius: 8px; font-family:"Press Start 2P", monospace; font-size:16px;';
    backBtn.onmouseover = window.playHoverSound;
    backBtn.onclick = () => {
        window.playViolinClick();
        overlay.remove();
        if (window.openCustomShopMenu) window.openCustomShopMenu();
    };
    overlay.appendChild(backBtn);
    
    document.body.appendChild(overlay);
};

window.openCustomShopMenu = function() {
    window.playCustomMusic('tienda.mp3');
    let overlay = document.createElement('div');
    overlay.id = 'custom-shop-menu';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background: #111; z-index:9999999; display:flex; flex-direction:column; justify-content:center; align-items:flex-end; padding-right: 10vw;';
    
    let bgImg = document.createElement('div');
    bgImg.style.cssText = 'position:absolute; top:0; left:5%; width:50%; height:100%; background: url("ImagenesPersonajes/abueloYugi.jpg") center center / contain no-repeat; pointer-events:none;';
    overlay.appendChild(bgImg);
    
    let grad = document.createElement('div');
    grad.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to right, rgba(0,0,0,0.2) 30%, rgba(17,17,17,1) 60%); pointer-events:none;';
    overlay.appendChild(grad);
    
    let title = document.createElement('div');
    title.innerHTML = 'TIENDA DEL ABUELO MOTO';
    title.style.cssText = 'color: #ffcc00; font-family: "Press Start 2P", monospace; font-size: 28px; text-shadow: 2px 2px 0 #000; margin-bottom: 40px; z-index:2; text-align: right;';
    
    let btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex; flex-direction:column; gap: 15px; z-index:2; width: 450px;';
    
    function runNativeView(funcName) {
        if (window.nativeAPI && typeof window.nativeAPI[funcName] === 'function') {
            window.playChic && window.playChic();
            let mapOverlay = document.getElementById('map-container-overlay');
            if (mapOverlay) mapOverlay.style.display = 'none'; 
            overlay.remove(); 
            
            // Clean campaign container for native UI
            let camp = document.getElementById('campaign3000');
            if (camp) {
                camp.innerHTML = '<div id="campContent3000"></div>';
                camp.style.cssText = ''; 
                camp.className = 'campContainer3000';
            }
            
            window.nativeAPI[funcName](); 
            
            // We need to inject a back button logic since native back buttons usually call showMap
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

    const options = [
        { label: 'COLECCIÓN', action: () => runNativeView('showCollection') },
        { label: 'EDITAR DECK', action: () => {
            window.playViolinClick();
            overlay.remove();
            if (window.customShowDeckEditor) {
                let mapOverlay = document.getElementById('map-container-overlay');
                if (mapOverlay) mapOverlay.style.display = 'none';
                window.customShowDeckEditor();
            } else {
                runNativeView('showDeckEditor');
            }
        } },
        { label: 'DUELO LIBRE', action: () => { 
            window.playViolinClick();
            overlay.remove();
            window.openFreeDuelMenu();
        } },
        { label: 'TIENDA DE MEMORIAS', action: () => runNativeView('showShop') },
        { label: 'FUSIONES DESCUBIERTAS', action: () => runNativeView('showFusions') },
        { label: 'GUARDAR PARTIDA', action: () => { alert('¡Partida guardada exitosamente en el navegador!'); } },
        { label: 'VOLVER AL MAPA', action: () => { 
            window.playViolinClick(); 
            overlay.remove(); 
            let mapOverlay = document.getElementById('map-container-overlay');
            if (mapOverlay) mapOverlay.style.display = '';
            
            let camp = document.getElementById('campaign3000');
            if (camp) camp.className = 'campContainer3000 hidden';

            window.playCustomMusic('mapa.mp3'); 
        } }
    ];
    
    options.forEach(o => {
        let btn = document.createElement('button');
        btn.textContent = o.label;
        btn.style.cssText = 'background: linear-gradient(90deg, #3a2a10 0%, #1a1005 100%); border: 3px solid #a67c00; border-radius: 6px; padding: 15px; color: #fff; font-family: "Press Start 2P", monospace; font-size: 14px; text-align: center; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; position: relative;';
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; btn.style.boxShadow = '0 0 15px #a67c00'; window.playHoverSound(); };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = 'none'; };
        btn.onclick = () => { window.playViolinClick(); o.action(); };
        btnContainer.appendChild(btn);
    });
    
    overlay.appendChild(title);
    overlay.appendChild(btnContainer);
    document.body.appendChild(overlay);
};

window.customFinishStoryDuel = function(win) {
    if (!window.nativeAPI) return;
    let s = window.nativeAPI.loadGame();
    let id = window.lastDuelOpponent || 'tristan';
    if (!s) return window.customShowMain();
    
    // Set duelOver flag so native engine doesn't loop
    if (typeof game !== 'undefined' && game) game.duelOver = true;
    
    try { document.getElementById('duelOver64').classList.remove('show'); } catch(e){}
    try { document.getElementById('deckOut67').classList.remove('show'); } catch(e){}
    let hud = document.getElementById('campaignDuelHud3000');
    if (hud) hud.style.display = 'none';
    if (window.nativeAPI.showShell) window.nativeAPI.showShell();
    
    if (!win) {
        s.pm += 50;
        s.lastPlayed = Date.now();
        window.nativeAPI.saveGame();
        
        let lossLines = [{ role: 'system', speaker: id.toUpperCase(), text: '¿Eso es todo lo que tienes? ¡Vuelve cuando seas más fuerte!' }];
        if (id === 'tristan') lossLines = [{ role: 'system', speaker: 'TRISTAN_INTRO', text: 'Jaja, te falta mucho para vencerme.' }];
        
        window.playCustomMusic('dialogos.mp3');
        window.renderCustomStoryDialog(lossLines, 0, () => window.customShowMap());
    } else {
        if (!(s.cleared || []).includes(id)) s.cleared.push(id);
        if (!s.unlocked) s.unlocked = [];
        if (!s.unlocked.includes(id)) s.unlocked.push(id);
        
        // Native unlocked logic natively unlocks adjacent nodes. We can just unlock all nodes manually up to a point or let map recalculate.
        // The native nodes array contains reqs. Our customShowMap recalculates unlocked perfectly based on s.cleared!
        s.pm += 150;
        s.lastPlayed = Date.now();
        window.nativeAPI.saveGame();
        
        let winLines = [{ role: 'system', speaker: id.toUpperCase(), text: '¡Increíble! Has demostrado tu valía como duelista.' }];
        if (id === 'tristan') winLines = [{ role: 'system', speaker: 'TRISTAN_INTRO', text: 'Vaya... no esperaba que fueras tan fuerte. ¡Adelante, el camino es tuyo!' }];
        
        window.playCustomMusic('dialogos.mp3');
        window.renderCustomStoryDialog(winLines, 0, () => window.customShowMap());
    }
};

// endObserver removed to allow native finishStoryDuel hook to take over

window.customShowDeckEditor = function() {
    let sStr = origGet('FMR_SAVE_' + window.activeAccount);
    if (!sStr) return;
    let s = JSON.parse(sStr);
    
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
    previewImg.style.cssText = 'width:100%; height:100%; object-fit:cover;';
    previewImgWrap.appendChild(previewImg);
    
    let previewText = document.createElement('div');
    previewText.style.cssText = 'margin-top: 15px; background: #222; padding: 15px; border-radius: 6px; border: 1px solid #444; min-height: 150px;';
    previewText.innerHTML = '<i>Pasa el ratón sobre una carta para ver sus detalles.</i>';
    
    leftSide.appendChild(previewImgWrap);
    leftSide.appendChild(previewText);
    overlay.appendChild(leftSide);
    
    // RIGHT SIDE (MAIN)
    let rightSide = document.createElement('div');
    rightSide.style.cssText = 'flex: 1; display:flex; flex-direction:column;';
    
    let header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e4c06b; padding-bottom: 10px; margin-bottom: 10px;';
    header.innerHTML = `
        <div style="font-family:'Press Start 2P', monospace; color:#ffcc00; font-size: 24px; text-shadow: 2px 2px 0 #000;">DASHBOARD DEL DECK</div>
        <input type="text" id="deck-search" placeholder="🔍 Buscar nombre..." autocomplete="off" style="padding: 10px 15px; border-radius: 6px; border: 1px solid #555; background: #222; color: #fff; font-family:'Segoe UI'; width: 220px; font-size: 16px;">
        <div style="font-size: 18px; font-weight: bold; background: #333; padding: 10px 20px; border-radius: 8px; border: 1px solid #555;" id="deck-count"></div>
        <button id="btn-exit-deck" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:'Press Start 2P', monospace; font-size:12px;">VOLVER</button>
    `;
    rightSide.appendChild(header);

    let filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex; gap:10px; margin-bottom: 15px; align-items:center; flex-wrap:wrap; font-size: 14px;';
    filterBar.innerHTML = `
        <select id="filter-cardtype" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todas las cartas</option>
            <option value="MONSTER">Solo Monstruos</option>
            <option value="SPELL">Solo Magias</option>
            <option value="TRAP">Solo Trampas</option>
        </select>
        <select id="filter-attr" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
            <option value="">Todos los Atributos</option>
            <option value="LIGHT">LUZ</option>
            <option value="DARK">OSCURIDAD</option>
            <option value="EARTH">TIERRA</option>
            <option value="WATER">AGUA</option>
            <option value="FIRE">FUEGO</option>
            <option value="WIND">VIENTO</option>
        </select>
        <select id="filter-type" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
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
        <input type="number" id="filter-atk" placeholder="ATK Mínimo" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; width: 100px;">
        <input type="number" id="filter-def" placeholder="DEF Mínima" style="padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; width: 100px;">
    `;
    rightSide.appendChild(filterBar);

    let cardDict = {};
    let extraText = {};
    let validCards = [];
    let globalNum = 1;
    
    function isAdvanced(c) {
        let kind = c.kind || (c[6] && typeof c[6] === 'string' ? c[6] : null);
        return kind === 'LINK' || kind === 'XYZ' || kind === 'SYNCHRO' || kind === 'PENDULUM';
    }
    
    function isExtraDeck(c) {
        let tags = c.tags || (c[8] || []);
        let kind = c.kind || (c[6] && typeof c[6] === 'string' ? c[6] : null);
        return kind === 'FUSION' || tags.includes('FUSION');
    }

    if (window.FMR_CARD_META) {
        Object.values(window.FMR_CARD_META).forEach((c) => {
            if (isAdvanced(c)) return;
            if (!cardDict[c.name]) {
                let num = window.CARD_MAPPINGS ? (window.CARD_MAPPINGS[c.name] || globalNum++) : globalNum++;
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
                let num = window.CARD_MAPPINGS ? (window.CARD_MAPPINGS[c.name] || globalNum++) : globalNum++;
                cardDict[c.name] = { 
                    num: num, name: c.name, type: c.kind, attr: '-', 
                    atk: '-', def: '-', sign: '-', isMonster: false, isExtra: false 
                };
                extraText[c.name] = c.text || '';
            }
        });
    }
    
    s.extra = s.extra || []; // Inicializar extra deck
    
    let ownedSet = new Set(Object.keys(s.collection).filter(n => s.collection[n] > 0));
    s.deck.forEach(n => ownedSet.add(n));
    s.extra.forEach(n => ownedSet.add(n));
    
    let owned = Array.from(ownedSet).filter(n => cardDict[n]); // Filter out invalid ones
    owned.sort((a, b) => cardDict[a].num - cardDict[b].num);
    
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
                <th style="padding: 12px; border-bottom: 2px solid #555; text-align:center;">Ubicación</th>
                <th style="padding: 12px; border-bottom: 2px solid #555; text-align:center;">En Deck</th>
                <th style="padding: 12px; border-bottom: 2px solid #555; text-align:center;">Acciones</th>
            </tr>
        </thead>
        <tbody id="deck-tbody"></tbody>
    `;
    tableWrap.appendChild(table);
    rightSide.appendChild(tableWrap);
    
    overlay.appendChild(rightSide);
    document.body.appendChild(overlay);
    
    let tbody = document.getElementById('deck-tbody');
    let searchInput = document.getElementById('deck-search');
    let typeSelect = document.getElementById('filter-cardtype');
    let attrSelect = document.getElementById('filter-attr');
    let raceSelect = document.getElementById('filter-type');
    let atkInput = document.getElementById('filter-atk');
    let defInput = document.getElementById('filter-def');
    
    let currentFilter = { text: '', cardType: '', attr: '', race: '', atk: 0, def: 0 };
    
    function applyFilters() {
        currentFilter.text = searchInput.value.toLowerCase();
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
    
    function renderRows() {
        let counts = {};
        s.deck.forEach(n => counts[n] = (counts[n]||0) + 1);
        
        let exCounts = {};
        s.extra.forEach(n => exCounts[n] = (exCounts[n]||0) + 1);
        
        document.getElementById('deck-count').innerHTML = `
            PRINCIPAL: <span style="color:${s.deck.length === 40 ? '#4caf50' : '#f44336'}">${s.deck.length}</span>/40 
            <span style="color:#aaa; font-size:12px; margin:0 8px;">|</span> 
            EXTRA: <span style="color:${s.extra.length <= 15 ? '#2196f3' : '#f44336'}">${s.extra.length}</span>/15
        `;
        
        tbody.innerHTML = '';
        owned.forEach(name => {
            let info = cardDict[name];
            
            if (currentFilter.text && !name.toLowerCase().includes(currentFilter.text)) return;
            if (currentFilter.cardType) {
                if (currentFilter.cardType === 'MONSTER' && !info.isMonster) return;
                if (currentFilter.cardType === 'SPELL' && info.type !== 'SPELL') return;
                if (currentFilter.cardType === 'TRAP' && info.type !== 'TRAP') return;
            }
            if (currentFilter.attr && info.attr !== currentFilter.attr) return;
            if (currentFilter.race && info.type !== currentFilter.race) return;
            if (info.isMonster) {
                if (currentFilter.atk > 0 && info.atk < currentFilter.atk) return;
                if (currentFilter.def > 0 && info.def < currentFilter.def) return;
            } else {
                if (currentFilter.atk > 0 || currentFilter.def > 0) return;
            }
            
            let ownCount = s.collection[name] || 0;
            let inDeck = info.isExtra ? (exCounts[name] || 0) : (counts[name] || 0);
            let deckArray = info.isExtra ? s.extra : s.deck;
            let deckMax = info.isExtra ? 15 : 40;
            
            let maxC = 3; 
            if (name === 'Renace al Monstruo' || name === 'Raigeki' || name === 'Dark Hole' || name === 'Llamado de la Tumba' || name === 'Fusión') maxC = 1; 
            
            let cardColor = info.isMonster ? (info.isExtra ? '#9c27b0' : '#d4af37') : (info.type === 'TRAP' ? '#ff80ab' : '#4caf50');
            
            let tr = document.createElement('tr');
            tr.style.cssText = 'border-bottom: 1px solid #333; transition: background 0.2s; cursor: pointer;';
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
            
            tr.innerHTML = `
                <td style="padding: 10px 12px; color: #888;">#${info.num.toString().padStart(3, '0')}</td>
                <td style="padding: 10px 12px; font-weight: bold; color: ${cardColor};">${info.name}</td>
                <td style="padding: 10px 12px;">${info.type}</td>
                <td style="padding: 10px 12px;">${info.isMonster ? `<span style="color:#ff5252">${info.atk}</span>/<span style="color:#2196f3">${info.def}</span>` : '-'}</td>
                <td style="padding: 10px 12px; text-align:center;">
                    <span style="background:${info.isExtra ? '#6a1b9a' : '#333'}; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold;">${info.isExtra ? 'EXTRA' : 'PRINCIPAL'}</span>
                </td>
                <td style="padding: 10px 12px; text-align:center; font-weight:bold;">
                    <span style="color: ${inDeck > 0 ? '#fff' : '#555'}">${inDeck}</span> / <span style="color: #aaa">${ownCount}</span>
                </td>
                <td style="padding: 10px 12px; text-align:center;">
                    <button class="add-btn" style="background:#4caf50; color:#fff; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; margin-right:5px; font-weight:bold; ${(deckArray.length >= deckMax || inDeck >= Math.min(ownCount, maxC)) ? 'opacity:0.5; cursor:not-allowed;' : ''}">+</button>
                    <button class="rem-btn" style="background:#f44336; color:#fff; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold; ${inDeck === 0 ? 'opacity:0.5; cursor:not-allowed;' : ''}">-</button>
                </td>
            `;
            
            let addBtn = tr.querySelector('.add-btn');
            addBtn.onclick = (e) => {
                e.stopPropagation();
                if (deckArray.length >= deckMax) return;
                if (inDeck >= Math.min(ownCount, maxC)) return;
                deckArray.push(name);
                origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
                window.playHoverSound && window.playHoverSound();
                renderRows();
            };
            
            let remBtn = tr.querySelector('.rem-btn');
            remBtn.onclick = (e) => {
                e.stopPropagation();
                if (inDeck <= 0) return;
                deckArray.splice(deckArray.indexOf(name), 1);
                origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
                window.playHoverSound && window.playHoverSound();
                renderRows();
            };
            
            tbody.appendChild(tr);
        });
    }
    
    renderRows();
    
    document.getElementById('btn-exit-deck').onclick = () => {
        window.playViolinClick && window.playViolinClick();
        overlay.remove();
        if (window.openCustomShopMenu) window.openCustomShopMenu();
    };
};

// Init Boot
setTimeout(() => {
    window.customShowMain();
}, 300);

// XYZ Fusion Override
setTimeout(() => {
    if (typeof window.fusionResult === 'function') {
        const origFusionResult = window.fusionResult;
        window.fusionResult = function(names) {
            names = (names || []).filter(Boolean);
            if (names.length === 3 && names.includes('X-Head Cannon') && names.includes('Y-Dragon Head') && names.includes('Z-Metal Tank')) {
                return 'XYZ-Dragon Cannon';
            }
            return origFusionResult(names);
        };
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
                art.innerHTML = '<img src="' + localSrc + '" style="width:100%;height:100%;object-fit:cover;" />';
            }
            let fa = box.querySelector('.fieldArt');
            if (fa) {
                fa.innerHTML = '<img src="' + localSrc + '" style="width:100%;height:100%;object-fit:cover;" />';
            }
            return box.innerHTML;
        }
    }
    return html;
};
const originalStHTML = window.stHTML;






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
        let num = window.CARD_MAPPINGS[name];
        let meta = window.FMR_CARD_META && window.FMR_CARD_META[name];
        if (meta) {
            dict[name] = { num, name, type: meta.type, attr: meta.attr, atk: meta.atk, def: meta.def, isMonster: true };
        } else {
            let st = window.FMR_ST_POOL_V1 && window.FMR_ST_POOL_V1.find(x => x.name === name);
            if (st) {
                dict[name] = { num, name, type: st.kind, isMonster: false, text: st.text };
            } else {
                dict[name] = { num, name, type: 'UNKNOWN', isMonster: false };
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
        <div style="font-family:'Press Start 2P', monospace; color:#ffcc00; font-size: 24px; text-shadow: 2px 2px 0 #000;">BIBLIOTECA DE CARTAS</div>
        <input type="text" id="coll-search" placeholder="🔍 Buscar nombre..." autocomplete="off" style="padding: 10px 15px; border-radius: 6px; border: 1px solid #555; background: #222; color: #fff; font-family:'Segoe UI'; width: 220px; font-size: 16px;">
        <button id="btn-exit-coll" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:'Press Start 2P', monospace; font-size:12px;">VOLVER</button>
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
    let allNames = Object.keys(window.CARD_MAPPINGS || {}).sort((a,b) => window.CARD_MAPPINGS[a] - window.CARD_MAPPINGS[b]);
    
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
                <td style="padding: 10px; font-weight: bold; color: #888;">${c.num.toString().padStart(3, '0')}</td>
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
    title.style.cssText = 'margin:0; color:#ffcc00; font-family:"Press Start 2P", monospace; font-size:24px; text-shadow:2px 2px 0 #000;';
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

window.customShowShop = function() {
    let s = JSON.parse(origGet('FMR_SAVE_' + window.activeAccount) || '{}');
    if (!s.collection) return;
    
    // Ensure dashboard renders properly
    let dash = createDashboardBase('TIENDA DE MEMORIAS', null);
    if (!dash.overlay.parentNode) {
        document.body.appendChild(dash.overlay);
    }
    
    let pmHeader = document.createElement('div');
    pmHeader.style.cssText = 'padding: 15px; background: #111; border: 2px solid #a67c00; border-radius: 8px; margin-bottom: 20px; display:inline-block; align-self:flex-start; font-size:18px; font-weight:bold;';
    pmHeader.innerHTML = `PM DISPONIBLES: <span style="color:#00ffcc;">${s.pm}</span>`;
    dash.rightSide.insertBefore(pmHeader, dash.gridWrap);
    
    const FALLBACK_SHOP = [
        {name:'Battle Ox',price:300,type:'MONSTRUO'}, {name:'Black Pendant',price:300,type:'EQUIPO'},
        {name:'Dragon Treasure',price:350,type:'EQUIPO'}, {name:'Giant Soldier of Stone',price:450,type:'MONSTRUO'},
        {name:'Aqua Madoor',price:450,type:'MONSTRUO'}, {name:'La Jinn the Mystical Genie of the Lamp',price:450,type:'MONSTRUO'},
        {name:'Horn of the Unicorn',price:550,type:'EQUIPO'}, {name:'Dust Tornado',price:600,type:'TRAMPA'},
        {name:'Waboku',price:650,type:'TRAMPA'}, {name:'Trap Hole',price:800,type:'TRAMPA',after:'tristan'},
        {name:'Sakuretsu Armor',price:900,type:'TRAMPA',after:'weevil'}, {name:'Negate Attack',price:1000,type:'TRAMPA',after:'weevil'},
        {name:'Thunder Dragon',price:700,type:'MONSTRUO',after:'mai'}, {name:'Axe of Despair',price:850,type:'EQUIPO',after:'mai'},
        {name:'Magic Cylinder',price:1400,type:'TRAMPA',after:'joey'}, {name:'Renace al Monstruo',price:1500,type:'MAGIA',after:'joey'}
    ];
    const FALLBACK_LEGENDARIES = ['Slifer the Sky Dragon','Obelisk the Tormentor','The Winged Dragon of Ra'];
    
    let sourceShop = (window.SHOP && window.SHOP.length > 0) ? window.SHOP : FALLBACK_SHOP;
    let validShop = sourceShop.filter(x => !x.after || (s.cleared || []).includes(x.after));
    
    validShop.forEach(item => {
        let name = item.name;
        let owned = s.collection[name] || 0;
        let leg = (window.LEGENDARIES && window.LEGENDARIES.length > 0) ? window.LEGENDARIES : FALLBACK_LEGENDARIES;
        let max = leg.includes(name) ? 1 : 3;
        let canBuy = s.pm >= item.price && owned < max;
        
        let bottomHtml = `
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                <span style="color:#aaa;">Posees: ${owned}/${max}</span>
                <span style="color:#00ffcc; font-weight:bold;">${item.price} PM</span>
            </div>
            <button class="buy-btn" style="width:100%; padding:6px; font-weight:bold; cursor:${canBuy?'pointer':'not-allowed'}; background:${canBuy?'#28a745':'#555'}; color:#fff; border:none; border-radius:4px;" ${canBuy?'':'disabled'}>
                ${owned >= max ? 'LÍMITE' : s.pm < item.price ? 'SIN PM' : 'COMPRAR'}
            </button>
        `;
        
        let card = document.createElement('div');
        card.style.cssText = 'background: #2a2a2a; border-radius: 8px; border: 2px solid #444; overflow: hidden; display:flex; flex-direction:column; cursor:pointer; transition: transform 0.2s, border-color 0.2s;';
        card.onmouseover = () => { card.style.transform = 'scale(1.05)'; card.style.borderColor = '#a67c00'; };
        card.onmouseout = () => { card.style.transform = 'scale(1)'; card.style.borderColor = '#444'; };
        
        let imgWrap = document.createElement('div');
        imgWrap.style.cssText = 'height: 180px; width: 100%; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center;';
        let img = document.createElement('img');
        img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
        let dict = window.getGlobalCardDict();
        if (dict[name] && window.CUSTOM_LOCAL_IMAGES && window.CUSTOM_LOCAL_IMAGES[dict[name].num]) {
            img.src = window.CUSTOM_LOCAL_IMAGES[dict[name].num];
        } else {
            img.alt = name;
        }
        imgWrap.appendChild(img);
        card.appendChild(imgWrap);
        
        let bottom = document.createElement('div');
        bottom.style.cssText = 'padding: 10px; display:flex; flex-direction:column; justify-content:space-between; flex:1;';
        bottom.innerHTML = `<div style="font-weight:bold; font-size:13px; text-align:center; margin-bottom:8px; line-height:1.2;">${name}</div>${bottomHtml}`;
        card.appendChild(bottom);
        
        card.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                updatePreview(dash.previewImg, dash.infoBox, name);
            }
        };
        
        let btn = card.querySelector('button');
        btn.onclick = () => {
            if (window.playViolinClick) window.playViolinClick();
            s.pm -= item.price;
            s.collection[name] = (s.collection[name] || 0) + 1;
            origSet('FMR_SAVE_' + window.activeAccount, JSON.stringify(s));
            if (typeof memorySave !== 'undefined') window.memorySave = s; 
            if (dash.overlay.parentNode) dash.overlay.parentNode.removeChild(dash.overlay);
            window.customShowShop(); // refresh
        };
        dash.gridWrap.appendChild(card);
    });
};

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
        <div style="font-family:'Press Start 2P', monospace; color:#ffcc00; font-size: 24px; text-shadow: 2px 2px 0 #000;">FUSIONES DESCUBIERTAS</div>
        <button id="btn-exit-fus" style="background:#8b0000; color:#fff; border:2px solid #ff4d4d; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:'Press Start 2P', monospace; font-size:12px;">VOLVER</button>
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


window.surrenderDuel = function() {
    if (confirm('¿Estás seguro de que quieres rendirte?')) {
        let isStory = (typeof window.storyDuelActive !== 'undefined') ? window.storyDuelActive : false;
        if (isStory) {
            alert('¡Te has rendido! Fin del juego (Historia).');
            location.reload();
        } else {
            alert('Te has rendido. Volviendo al mapa...');
            document.getElementById('campaign3000').className = 'campContainer3000 hidden';
            window.openCustomShopMenu();
            window.playCustomMusic('mapa.mp3');
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
