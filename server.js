/**
 * Forbidden Memories Reborn - Servidor Express v2
 * Uso:   node server.js
 * Puerto: 3000 (o variable de entorno PORT)
 *
 * Sistema de autenticacion:
 *   POST /api/register  -> crea cuenta (nombre + password)
 *   POST /api/login     -> inicia sesion, devuelve datos del save
 *   POST /api/save      -> guarda partida (requiere auth)
 *   GET  /api/load/:name -> carga partida (solo nombre, sin datos privados)
 */
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const SAVES_DIR = path.join(ROOT, 'saves');
if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
}

// ── Configuracion de Correo Electronico (SMTP Titan Email) ────────
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.titan.email',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'joavce@mantixor.com',
    pass: process.env.SMTP_PASS || 'R0st1p040*'
  }
});

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return user[0] + '*@' + domain;
  return user.slice(0, 2) + '*'.repeat(user.length - 2) + '@' + domain;
}

app.use(express.json({ limit: '25mb' }));

// ── Utilidades ──────────────────────────────────────────────────
function hashPassword(pw) {
  return crypto.createHash('sha256').update(String(pw) + 'FMR_SALT_2026').digest('hex');
}
function safeName(n) {
  return String(n).replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 32);
}
function savePath(name) {
  return path.join(ROOT, 'saves', safeName(name) + '.json');
}
function readSave(name) {
  if (!name) return null;
  const p = savePath(name);
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
  }
  // Fallback insensible a mayusculas/minusculas (crucial para entornos Linux como Render)
  try {
    const target = safeName(name).toLowerCase() + '.json';
    const files = fs.readdirSync(SAVES_DIR);
    const match = files.find(f => f.toLowerCase() === target);
    if (match) {
      return JSON.parse(fs.readFileSync(path.join(SAVES_DIR, match), 'utf8'));
    }
  } catch (_) {}
  return null;
}
function writeSave(data) {
  fs.writeFileSync(savePath(data.name), JSON.stringify(data, null, 2), 'utf8');
}
function findSaveByEmailOrName(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim();
  // 1. Busqueda directa por nombre de archivo
  const byName = readSave(clean);
  if (byName) return byName;

  // 2. Busqueda en saves por correo o nombre ignorando mayusculas
  const dir = path.join(ROOT, 'saves');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const lower = clean.toLowerCase();
    for (const f of files) {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (d && ((d.email && d.email.toLowerCase() === lower) || (d.name && d.name.toLowerCase() === lower))) {
          return d;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

// ── Inyeccion / Seeding de Cuentas Preconfiguradas (e.g. Render Deployment) ──
function ensureSeedUsers() {
  try {
    const josueExisting = findSaveByEmailOrName('josue') || findSaveByEmailOrName('joavce@hotmail.com');
    if (!josueExisting) {
      const josueSeed = {
        name: "josue",
        email: "joavce@hotmail.com",
        passwordHash: "69a6b100074bc1e3c319a6c533277fdb873c9a44d896accc5c42230b4ce3b3ce", // Clave: 1234
        schema: 1,
        world: 1,
        pm: 2300,
        unlocked: ["tristan"],
        cleared: ["tristan"],
        wins: { tristan: 1 },
        losses: {},
        collection: {
          "Celtic Guardian": 2, "Beaver Warrior": 2, "Battle Ox": 2, "Mystical Elf": 2,
          "Feral Imp": 2, "Winged Dragon, Guardian of the Fortress #1": 2, "Petit Dragon": 2,
          "Baby Dragon": 2, "Giant Soldier of Stone": 2, "Man-Eater Bug": 2, "Silver Fang": 2,
          "Flame Manipulator": 2, "Black Pendant": 2, "Dragon Treasure": 2, "Horn of the Unicorn": 2,
          "Waboku": 2, "Trap Hole": 2, "Dust Tornado": 2, "Sakuretsu Armor": 2,
          "Renace al Monstruo": 1, "Negate Attack": 1, "Cyber Ultimate Dragon Test": 2
        },
        deck: [
          "Celtic Guardian", "Celtic Guardian", "Beaver Warrior", "Beaver Warrior", "Battle Ox", "Battle Ox",
          "Mystical Elf", "Mystical Elf", "Feral Imp", "Feral Imp", "Winged Dragon, Guardian of the Fortress #1",
          "Winged Dragon, Guardian of the Fortress #1", "Petit Dragon", "Petit Dragon", "Baby Dragon", "Baby Dragon",
          "Giant Soldier of Stone", "Giant Soldier of Stone", "Man-Eater Bug", "Man-Eater Bug", "Silver Fang", "Silver Fang",
          "Flame Manipulator", "Flame Manipulator", "Black Pendant", "Black Pendant", "Dragon Treasure", "Dragon Treasure",
          "Horn of the Unicorn", "Horn of the Unicorn", "Waboku", "Waboku", "Trap Hole", "Trap Hole", "Dust Tornado",
          "Dust Tornado", "Sakuretsu Armor", "Sakuretsu Armor", "Renace al Monstruo", "Negate Attack"
        ],
        legendary: {},
        pity: {},
        fusions: [],
        createdAt: 1790869321027,
        lastPlayed: Date.now(),
        rewardsHistory: [
          { type: "DP", amount: 5000, mode: "add", reason: "Cuenta Inicial Josue", date: 1790899326260 }
        ],
        decks: {
          "Deck-Inicial": [
            "Celtic Guardian", "Celtic Guardian", "Beaver Warrior", "Beaver Warrior", "Battle Ox", "Battle Ox",
            "Mystical Elf", "Mystical Elf", "Feral Imp", "Feral Imp", "Winged Dragon, Guardian of the Fortress #1",
            "Winged Dragon, Guardian of the Fortress #1", "Petit Dragon", "Petit Dragon", "Baby Dragon", "Baby Dragon",
            "Giant Soldier of Stone", "Giant Soldier of Stone", "Man-Eater Bug", "Man-Eater Bug", "Silver Fang", "Silver Fang",
            "Flame Manipulator", "Flame Manipulator", "Black Pendant", "Black Pendant", "Dragon Treasure", "Dragon Treasure",
            "Horn of the Unicorn", "Horn of the Unicorn", "Waboku", "Waboku", "Trap Hole", "Trap Hole", "Dust Tornado",
            "Dust Tornado", "Sakuretsu Armor", "Sakuretsu Armor", "Renace al Monstruo", "Negate Attack"
          ]
        },
        activeDeck: "Deck-Inicial",
        extra: [],
        trialEndsAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        subscriptionEndsAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
        subscriptionPlan: "vip_6m",
        subscriptionStatus: "active",
        subscriptionHistory: [
          {
            type: "vip_extension",
            months: 6,
            grantedAt: Date.now(),
            expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
            reason: "Cuenta Fundador Josue (VIP 6 Meses)",
            grantedBy: "system"
          }
        ]
      };
      fs.writeFileSync(path.join(SAVES_DIR, 'Josue.json'), JSON.stringify(josueSeed, null, 2), 'utf8');
      console.log('[Seed] Cuenta "josue" inyectada exitosamente con suscripción VIP activa.');
    }
  } catch (err) {
    console.error('[Seed] Error al inyectar cuenta josue:', err.message);
  }
}
ensureSeedUsers();

// ── Control de Suscripciones (1 mes de prueba, $10 por 6 meses) ──
const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const VIP_6M_DURATION_MS = 180 * 24 * 60 * 60 * 1000; // 180 dias (~6 meses)

function computeSubscriptionStatus(save) {
  if (!save) return { isActive: false, status: 'expired', remainingDays: 0, remainingMs: 0 };

  // Cuenta admin siempre activa
  if (save.name && save.name.toLowerCase() === 'admin') {
    return {
      isActive: true,
      status: 'admin',
      isTrial: false,
      trialEndsAt: Date.now() + 3650 * 24 * 60 * 60 * 1000,
      subscriptionEndsAt: Date.now() + 3650 * 24 * 60 * 60 * 1000,
      remainingMs: 3650 * 24 * 60 * 60 * 1000,
      remainingDays: 3650,
      plan: 'admin'
    };
  }

  const now = Date.now();

  // Asegurar trialEndsAt (30 dias de prueba)
  if (!save.trialEndsAt) {
    if (save.createdAt && (now - save.createdAt) < TRIAL_DURATION_MS) {
      save.trialEndsAt = save.createdAt + TRIAL_DURATION_MS;
    } else {
      save.trialEndsAt = now + TRIAL_DURATION_MS;
    }
  }

  const trialEnds = Number(save.trialEndsAt) || 0;
  const subEnds = Number(save.subscriptionEndsAt) || 0;

  const isSubActive = subEnds > now;
  const isTrialActive = trialEnds > now;
  const isActive = isSubActive || isTrialActive;

  let status = 'expired';
  let effectiveExpiresAt = trialEnds;
  let isTrial = false;

  if (isSubActive) {
    status = 'vip_6m';
    effectiveExpiresAt = subEnds;
    isTrial = false;
  } else if (isTrialActive) {
    status = 'trial';
    effectiveExpiresAt = trialEnds;
    isTrial = true;
  } else {
    status = 'expired';
    effectiveExpiresAt = Math.max(trialEnds, subEnds);
  }

  const remainingMs = Math.max(0, effectiveExpiresAt - now);
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  return {
    isActive,
    status,
    isTrial,
    trialEndsAt: trialEnds,
    subscriptionEndsAt: subEnds > 0 ? subEnds : null,
    effectiveExpiresAt,
    remainingMs,
    remainingDays,
    plan: status
  };
}

// ── Archivos estaticos ──────────────────────────────────────────
app.use('/imagenescartas',     express.static(path.join(ROOT, 'imagenescartas')));
app.use('/ImagenesPersonajes', express.static(path.join(ROOT, 'ImagenesPersonajes')));
app.use('/musica',             express.static(path.join(ROOT, 'musica')));
app.use('/assets',             express.static(path.join(ROOT, 'assets')));
app.use('/admin',              express.static(path.join(ROOT, 'admin')));

// ── Juego principal ─────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'YGOFMR2026-1.html')));

// ════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════

// Registrar cuenta  POST /api/register  { name, email, password }
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: 'Nombre, correo y clave requeridos' });
  if (String(name).length < 2)   return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
  if (String(password).length < 4) return res.status(400).json({ error: 'La clave debe tener al menos 4 caracteres' });

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Debes proporcionar un correo electrónico válido para registrar tu cuenta.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  const existingName = readSave(name);
  if (existingName) return res.status(409).json({ error: 'Ya existe una cuenta con ese nombre de jugador' });

  const existingEmail = findSaveByEmailOrName(cleanEmail);
  if (existingEmail) return res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });

  const DEFAULT_DECK = [
    'Celtic Guardian','Celtic Guardian','Beaver Warrior','Beaver Warrior','Battle Ox','Battle Ox','Mystical Elf','Mystical Elf',
    'Feral Imp','Feral Imp','Winged Dragon, Guardian of the Fortress #1','Winged Dragon, Guardian of the Fortress #1',
    'Petit Dragon','Petit Dragon','Baby Dragon','Baby Dragon','Giant Soldier of Stone','Giant Soldier of Stone','Man-Eater Bug','Man-Eater Bug',
    'Silver Fang','Silver Fang','Flame Manipulator','Flame Manipulator',
    'Black Pendant','Black Pendant','Dragon Treasure','Dragon Treasure','Horn of the Unicorn','Horn of the Unicorn',
    'Waboku','Waboku','Trap Hole','Trap Hole','Dust Tornado','Dust Tornado','Sakuretsu Armor','Sakuretsu Armor','Renace al Monstruo','Negate Attack'
  ];

  // Crear save fresco con deck inicial
  const starterCollection = {};
  DEFAULT_DECK.forEach(n => starterCollection[n] = (starterCollection[n] || 0) + 1);

  const save = {
    name:         name,
    email:        cleanEmail,
    passwordHash: hashPassword(password),
    schema:       1,
    world:        1,
    pm:           0,
    unlocked:     ['tristan'],
    cleared:      [],
    wins:         {},
    losses:       {},
    collection:   starterCollection,
    deck:         [...DEFAULT_DECK],
    legendary:    {},
    pity:         {},
    fusions:      [],
    trialEndsAt:        Date.now() + TRIAL_DURATION_MS,
    subscriptionEndsAt: null,
    subscriptionPlan:   'trial',
    subscriptionStatus: 'active',
    subscriptionHistory: [{ type: 'trial', date: Date.now(), days: 30 }],
    createdAt:    Date.now(),
    lastPlayed:   Date.now()
  };

  try {
    writeSave(save);

    // Enviar correo de bienvenida (no bloqueante)
    try {
      mailer.sendMail({
        from: '"Yu-Gi-Oh! Forbidden Memories Reborn" <joavce@mantixor.com>',
        to: cleanEmail,
        subject: '¡Bienvenido al Duelo! - Yu-Gi-Oh! Forbidden Memories Reborn',
        html: `
          <div style="background:#0d1117; color:#c9d1d9; font-family:'Segoe UI',Arial,sans-serif; padding:25px; border:2px solid #e4c06b; border-radius:10px; max-width:600px; margin:auto;">
            <h1 style="color:#ffd700; text-align:center; font-size:24px; margin-top:0;">YU-GI-OH! FORBIDDEN MEMORIES REBORN</h1>
            <p style="font-size:16px;">¡Hola, Duelista <b>${name}</b>!</p>
            <p>Tu cuenta ha sido creada exitosamente. Tienes <b>1 mes de prueba gratuita (30 días)</b> para disfrutar de todos los duelos y la tienda de cartas.</p>
            <div style="background:#161b22; border:1px solid #30363d; padding:15px; border-radius:6px; margin:20px 0;">
              <p style="margin:5px 0;"><b>Nombre de Duelista:</b> <span style="color:#58a6ff;">${name}</span></p>
              <p style="margin:5px 0;"><b>Correo Vinculado:</b> <span style="color:#7ee787;">${cleanEmail}</span></p>
              <p style="margin:5px 0;"><b>Período de Prueba:</b> <span style="color:#ffd700;">30 Días Activo</span></p>
            </div>
            <p style="color:#8b949e; font-size:13px; text-align:center; margin-top:30px; border-top:1px solid #21262d; padding-top:15px;">
              ¡Que comiencen los duelos!
            </p>
          </div>
        `
      }).catch(err => console.error('[Mailer] Error bienvenida:', err.message));
    } catch (_) {}

    const subStatus = computeSubscriptionStatus(save);
    const { passwordHash, resetCode, resetCodeExpires, ...publicSave } = save;
    publicSave.subscription = subStatus;
    res.json({ ok: true, save: publicSave });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login  POST /api/login  { name / identifier, password } (puede ser nombre de duelista o correo)
app.post('/api/login', (req, res) => {
  const identifier = req.body?.name || req.body?.identifier;
  const password = req.body?.password;
  if (!identifier || !password) return res.status(400).json({ error: 'Nombre/correo y clave requeridos' });

  const save = findSaveByEmailOrName(identifier);
  if (!save) return res.status(404).json({ error: 'Cuenta no encontrada. Verifica el nombre o correo.' });
  if (save.passwordHash !== hashPassword(password)) return res.status(401).json({ error: 'Clave incorrecta' });

  const subStatus = computeSubscriptionStatus(save);
  save.lastPlayed = Date.now();
  writeSave(save);

  if (!subStatus.isActive) {
    return res.status(403).json({
      ok: false,
      subscriptionExpired: true,
      error: 'Tu período de prueba o suscripción ha finalizado.',
      subscription: subStatus,
      user: { name: save.name, email: save.email }
    });
  }

  const { passwordHash, resetCode, resetCodeExpires, ...publicSave } = save;
  publicSave.subscription = subStatus;
  res.json({ ok: true, save: publicSave });
});

// Solicitar recuperacion de clave  POST /api/forgot-password  { identifier / email / name }
app.post('/api/forgot-password', async (req, res) => {
  const identifier = req.body?.identifier || req.body?.email || req.body?.name;
  if (!identifier) return res.status(400).json({ error: 'Ingresa tu nombre de jugador o correo electrónico.' });

  const save = findSaveByEmailOrName(identifier);
  if (!save) {
    return res.status(404).json({ error: 'No se encontró ninguna cuenta asociada a este nombre o correo.' });
  }

  if (!save.email) {
    return res.status(400).json({ error: 'Esta cuenta no tiene un correo electrónico vinculado para recuperación.' });
  }

  // Generar codigo de 6 digitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  save.resetCode = code;
  save.resetCodeExpires = Date.now() + (15 * 60 * 1000); // 15 minutos
  writeSave(save);

  try {
    await mailer.sendMail({
      from: '"Yu-Gi-Oh! Forbidden Memories Reborn" <joavce@mantixor.com>',
      to: save.email,
      subject: 'Código de Recuperación de Contraseña - Yu-Gi-Oh! FMR',
      html: `
        <div style="background:#0d1117; color:#c9d1d9; font-family:'Segoe UI',Arial,sans-serif; padding:30px; border:2px solid #e4c06b; border-radius:10px; max-width:600px; margin:auto;">
          <h1 style="color:#ffd700; text-align:center; font-size:24px; margin-top:0;">RECUPERACIÓN DE CONTRASEÑA</h1>
          <p style="font-size:16px;">Hola, <b>${save.name}</b>:</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <b>Yu-Gi-Oh! Forbidden Memories Reborn</b>.</p>
          <div style="background:#161b22; border:2px dashed #ffd700; padding:20px; border-radius:8px; text-align:center; margin:25px 0;">
            <div style="font-size:14px; color:#8b949e; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">Tu código de verificación es:</div>
            <div style="font-size:36px; font-weight:bold; color:#ffcc00; letter-spacing:8px; font-family:monospace;">${code}</div>
            <div style="font-size:12px; color:#f85149; margin-top:8px;">Este código vence en 15 minutos.</div>
          </div>
          <p style="font-size:14px; color:#8b949e;">Ingresa este código en el juego junto con tu nueva contraseña. Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          <p style="color:#8b949e; font-size:12px; text-align:center; margin-top:30px; border-top:1px solid #21262d; padding-top:15px;">
            Yu-Gi-Oh! Forbidden Memories Reborn · Servidor Oficial
          </p>
        </div>
      `
    });

    res.json({ ok: true, message: 'Se ha enviado un código de 6 dígitos a tu correo (' + maskEmail(save.email) + ').', email: maskEmail(save.email) });
  } catch (err) {
    console.error('[Mailer] Error enviando correo de recuperacion:', err);
    res.status(500).json({ error: 'Hubo un error al enviar el correo. Por favor intenta de nuevo.' });
  }
});

// Restablecer clave con codigo  POST /api/reset-password  { identifier / email / name, code, newPassword }
app.post('/api/reset-password', (req, res) => {
  const identifier = req.body?.identifier || req.body?.email || req.body?.name;
  const { code, newPassword } = req.body || {};
  if (!identifier || !code || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const save = findSaveByEmailOrName(identifier);
  if (!save) return res.status(404).json({ error: 'Cuenta no encontrada.' });

  if (!save.resetCode || String(save.resetCode).trim() !== String(code).trim()) {
    return res.status(400).json({ error: 'El código de recuperación es incorrecto.' });
  }

  if (!save.resetCodeExpires || Date.now() > save.resetCodeExpires) {
    return res.status(400).json({ error: 'El código ha expirado. Por favor solicita uno nuevo.' });
  }

  if (String(newPassword).length < 4) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
  }

  save.passwordHash = hashPassword(newPassword);
  delete save.resetCode;
  delete save.resetCodeExpires;
  writeSave(save);

  res.json({ ok: true, message: '¡Tu contraseña ha sido restablecida con éxito!' });
});

// Cambiar clave  POST /api/changePassword  { name, oldPassword, newPassword }
app.post('/api/changePassword', (req, res) => {
  const { name, oldPassword, newPassword } = req.body || {};
  if (!name || !oldPassword || !newPassword) return res.status(400).json({ error: 'Datos incompletos' });
  const save = readSave(name);
  if (!save) return res.status(404).json({ error: 'Cuenta no encontrada' });
  if (save.passwordHash !== hashPassword(oldPassword)) return res.status(401).json({ error: 'Clave actual incorrecta' });
  if (String(newPassword).length < 4) return res.status(400).json({ error: 'La nueva clave debe tener al menos 4 caracteres' });
  save.passwordHash = hashPassword(newPassword);
  writeSave(save);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════
//  SAVES
// ════════════════════════════════════════════════════════════════

// Listar partidas (solo info publica para admin)  GET /api/saves
app.get('/api/saves', requireAdmin, (req, res) => {
  const dir = path.join(ROOT, 'saves');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        return { name: d.name, world: d.world, lastPlayed: d.lastPlayed, wins: d.wins, file: f };
      } catch { return null; }
    }).filter(Boolean);
    res.json(files);
  } catch { res.json([]); }
});

// Forzar o verificar inyección de Josue  ALL /api/seed-josue
app.all('/api/seed-josue', (req, res) => {
  ensureSeedUsers();
  const user = findSaveByEmailOrName('josue');
  res.json({
    ok: true,
    message: 'Usuario "josue" verificado e inyectado con éxito en el servidor.',
    user: {
      name: user?.name,
      email: user?.email,
      pm: user?.pm,
      subscription: user ? computeSubscriptionStatus(user) : null
    }
  });
});

// Guardar partida  POST /api/save  { name, password, ...saveData }
app.post('/api/save', (req, res) => {
  const { name, password, ...data } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: 'Auth requerida (name + password)' });

  const existing = readSave(name);
  if (!existing) return res.status(404).json({ error: 'Cuenta no encontrada. Registrate primero.' });
  if (existing.passwordHash !== hashPassword(password)) return res.status(401).json({ error: 'Clave incorrecta' });

  const subStatus = computeSubscriptionStatus(existing);
  if (!subStatus.isActive) {
    return res.status(403).json({
      error: 'Tu suscripción ha finalizado. Por favor adquiere la suscripción de 6 meses para continuar jugando.',
      subscriptionExpired: true,
      subscription: subStatus
    });
  }

  // Mantener passwordHash existente, actualizar el resto
  const updated = { ...existing, ...data, name, passwordHash: existing.passwordHash, lastPlayed: Date.now() };
  try { writeSave(updated); res.json({ ok: true, subscription: subStatus }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Consultar estado de suscripción de un usuario  GET /api/subscription/status/:name
app.get('/api/subscription/status/:name', (req, res) => {
  const save = readSave(req.params.name);
  if (!save) return res.status(404).json({ error: 'Usuario no encontrado' });
  const status = computeSubscriptionStatus(save);
  res.json({ ok: true, name: save.name, subscription: status });
});

// Notificación de comprobante de pago SINPE Móvil  POST /api/subscription/notify-payment
app.post('/api/subscription/notify-payment', async (req, res) => {
  const { name, phone, reference, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nombre de usuario requerido' });

  const save = readSave(name);
  const userEmail = (save && save.email) ? save.email : 'No especificado';
  const nowStr = new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' });

  try {
    // Enviar correo a joavce@hotmail.com
    await mailer.sendMail({
      from: '"Yu-Gi-Oh! Reborn Suscripciones" <joavce@mantixor.com>',
      to: 'joavce@hotmail.com',
      subject: `🔔 Nueva Solicitud de Suscripción ($10) - Duelista: ${name}`,
      html: `
        <div style="background:#0d1117; color:#c9d1d9; font-family:'Segoe UI',Arial,sans-serif; padding:30px; border:2px solid #ffd700; border-radius:10px; max-width:650px; margin:auto;">
          <h1 style="color:#ffd700; text-align:center; font-size:22px; margin-top:0;">
            ⭐ SOLICITUD DE SUSCRIPCIÓN (6 MESES) - $10 USD
          </h1>
          <p style="font-size:16px;">Hola <b>Josue</b>:</p>
          <p>El duelista <b>${name}</b> ha enviado una solicitud de activación de suscripción de 6 meses por SINPE Móvil.</p>
          
          <div style="background:#161b22; border:1px solid #30363d; padding:20px; border-radius:8px; margin:20px 0;">
            <p style="margin:8px 0;"><b>Duelista:</b> <span style="color:#58a6ff; font-size:17px; font-weight:bold;">${name}</span></p>
            <p style="margin:8px 0;"><b>Correo del Jugador:</b> <span style="color:#7ee787;">${userEmail}</span></p>
            <p style="margin:8px 0;"><b>Teléfono WhatsApp:</b> <span style="color:#ffd700;">${phone || 'No especificado'}</span></p>
            <p style="margin:8px 0;"><b>Comprobante / Referencia:</b> <span>${reference || 'Enviado por WhatsApp'}</span></p>
            <p style="margin:8px 0;"><b>Notas:</b> <span>${notes || 'Sin notas adicionales'}</span></p>
            <p style="margin:8px 0;"><b>Fecha / Hora:</b> <span>${nowStr}</span></p>
          </div>

          <div style="text-align:center; margin:30px 0;">
            <a href="https://juegoyugioh.onrender.com/admin" style="background:linear-gradient(180deg, #ffd700 0%, #b8860b 100%); color:#000; text-decoration:none; padding:12px 28px; border-radius:6px; font-weight:bold; font-size:15px; display:inline-block;">
              IR AL PANEL DE USUARIOS PARA ACTIVAR (+6 MESES)
            </a>
          </div>

          <p style="color:#8b949e; font-size:12px; text-align:center; border-top:1px solid #21262d; padding-top:15px;">
            Servidor Yu-Gi-Oh! Forbidden Memories Reborn · Notificación Automática de Pagos
          </p>
        </div>
      `
    });

    res.json({ ok: true, message: 'Notificación enviada a Josue Avalos exitosamente.' });
  } catch (err) {
    console.error('[Subscription Notify Error]', err);
    res.status(500).json({ error: 'Error al enviar la notificación: ' + err.message });
  }
});

// Cargar partida  GET /api/load/:name  (sin contrasena, solo datos publicos del juego)
// La verificacion de identidad se hace en el cliente (sessionStorage)
app.get('/api/load/:name', (req, res) => {
  const save = readSave(req.params.name);
  if (!save) return res.status(404).json({ error: 'Partida no encontrada' });
  const { passwordHash, ...publicSave } = save;
  res.json(publicSave);
});

// Eliminar partida (admin)  DELETE /api/saves/:name
app.delete('/api/saves/:name', requireAdmin, (req, res) => {
  const file = savePath(req.params.name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'No encontrado' });
  try { fs.unlinkSync(file); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
//  ADMIN AUTHENTICATION & SECURITY
// ════════════════════════════════════════════════════════════════
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'R0st1p040*';
const ADMIN_SECRET = 'YGO_ADMIN_SECRET_' + (process.env.ADMIN_SECRET || 'FMR_2026_ROSTI');

function generateAdminToken() {
  const payload = { u: ADMIN_USER, t: Date.now() };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(str).digest('hex');
  return `${str}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [str, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(str).digest('hex');
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
    if (payload.u !== ADMIN_USER) return false;
    // Validez de 7 dias
    if (Date.now() - payload.t > 7 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch (_) {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();
  else if (req.headers['x-admin-token']) token = req.headers['x-admin-token'];
  else if (req.query && req.query.adminToken) token = req.query.adminToken;

  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Acceso no autorizado al panel de administración. Inicia sesión como administrador.' });
  }
  next();
}

// Login de Administrador  POST /api/admin/login  { username, password }
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
    const token = generateAdminToken();
    return res.json({ ok: true, token, user: ADMIN_USER });
  }
  return res.status(401).json({ error: 'Credenciales de administrador incorrectas' });
});

// Verificar Token  GET /api/admin/verify
app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : req.headers['x-admin-token'];
  if (verifyAdminToken(token)) {
    return res.json({ ok: true, user: ADMIN_USER });
  }
  return res.status(401).json({ ok: false, error: 'Sesión administrativa no válida' });
});

// ════════════════════════════════════════════════════════════════
//  SUBIDA DE IMAGENES DE CARTAS (EXAMINAR)
// ════════════════════════════════════════════════════════════════
app.post('/api/upload-image', requireAdmin, (req, res) => {
  try {
    const { filename, base64Data, cardName } = req.body || {};
    if (!base64Data) {
      return res.status(400).json({ error: 'No se envió ningún dato de imagen' });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = '.jpg';
    let dataBuffer;
    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes('png')) ext = '.png';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      else if (mime.includes('webp')) ext = '.webp';
      dataBuffer = Buffer.from(matches[2], 'base64');
    } else {
      dataBuffer = Buffer.from(base64Data, 'base64');
    }

    const targetDir = path.join(ROOT, 'imagenescartas', 'custom');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const cleanBase = (cardName || filename || 'card').toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 30);
    const uniqueFile = `card_${cleanBase}_${Date.now()}${ext}`;
    const targetPath = path.join(targetDir, uniqueFile);

    fs.writeFileSync(targetPath, dataBuffer);
    const relPath = `imagenescartas/custom/${uniqueFile}`;

    res.json({ ok: true, path: relPath, filename: uniqueFile });
  } catch (err) {
    console.error('[Upload] Error subiendo imagen:', err);
    res.status(500).json({ error: 'Error al procesar y guardar la imagen: ' + err.message });
  }
});

// ════════════════════════════════════════════════════════════════
//  GESTION DE USUARIOS / REGALIAS
// ════════════════════════════════════════════════════════════════

// Listar todos los usuarios con su progreso y estado  GET /api/admin/users
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const dir = path.join(ROOT, 'saves');
  try {
    if (!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const now = Date.now();
    const users = files.map(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (!d || !d.name) return null;
        
        let totalWins = 0;
        if (d.wins && typeof d.wins === 'object') {
          Object.values(d.wins).forEach(v => totalWins += (parseInt(v) || 0));
        }
        let totalLosses = 0;
        if (d.losses && typeof d.losses === 'object') {
          Object.values(d.losses).forEach(v => totalLosses += (parseInt(v) || 0));
        }

        const lastPlayedMs = d.lastPlayed || d.createdAt || 0;
        const diffHours = (now - lastPlayedMs) / (1000 * 60 * 60);

        let collectionCardsTotal = 0;
        if (d.collection && typeof d.collection === 'object') {
          Object.values(d.collection).forEach(v => collectionCardsTotal += (parseInt(v) || 0));
        }

        const sub = computeSubscriptionStatus(d);

        return {
          name: d.name,
          email: d.email || 'Sin correo',
          world: d.world || 1,
          pm: d.pm !== undefined ? d.pm : 0,
          unlocked: Array.isArray(d.unlocked) ? d.unlocked : [],
          cleared: Array.isArray(d.cleared) ? d.cleared : [],
          totalWins: totalWins,
          totalLosses: totalLosses,
          wins: d.wins || {},
          deckCount: Array.isArray(d.deck) ? d.deck.length : 0,
          collectionCount: collectionCardsTotal,
          createdAt: d.createdAt || null,
          lastPlayed: lastPlayedMs,
          isActive24h: diffHours <= 24,
          file: f,
          trialEndsAt: sub.trialEndsAt,
          subscriptionEndsAt: sub.subscriptionEndsAt,
          isSubscriptionActive: sub.isActive,
          subscriptionStatus: sub.status,
          remainingDays: sub.remainingDays
        };
      } catch { return null; }
    }).filter(Boolean);

    // Ordenar por ultima actividad descendente
    users.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar usuarios: ' + err.message });
  }
});

// Otorgar DP (+Regalia o ajuste)  POST /api/admin/user/:name/grant-dp
app.post('/api/admin/user/:name/grant-dp', requireAdmin, (req, res) => {
  const save = readSave(req.params.name);
  if (!save) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { amount, mode, reason } = req.body || {};
  const num = parseInt(amount);
  if (isNaN(num)) return res.status(400).json({ error: 'Monto de DP inválido' });

  const prev = save.pm || 0;
  if (mode === 'set') {
    save.pm = Math.max(0, num);
  } else {
    save.pm = Math.max(0, prev + num);
  }

  // Registrar en historial de regalias de la partida si existe
  save.rewardsHistory = save.rewardsHistory || [];
  save.rewardsHistory.push({
    type: 'DP',
    amount: num,
    mode: mode || 'add',
    reason: reason || 'Regalía de Administrador',
    date: Date.now()
  });

  writeSave(save);
  res.json({ ok: true, name: save.name, prevPm: prev, newPm: save.pm, reason });
});

// Regalar Carta(s) a un usuario  POST /api/admin/user/:name/grant-card
app.post('/api/admin/user/:name/grant-card', requireAdmin, (req, res) => {
  const save = readSave(req.params.name);
  if (!save) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { cardName, count, reason } = req.body || {};
  if (!cardName) return res.status(400).json({ error: 'Nombre de carta requerido' });
  const qty = Math.max(1, Math.min(3, parseInt(count) || 1));

  save.collection = save.collection || {};
  const prevCount = save.collection[cardName] || 0;
  save.collection[cardName] = Math.min(9, prevCount + qty);

  save.rewardsHistory = save.rewardsHistory || [];
  save.rewardsHistory.push({
    type: 'CARD',
    card: cardName,
    count: qty,
    reason: reason || 'Regalía de Carta de Administrador',
    date: Date.now()
  });

  writeSave(save);
  res.json({ ok: true, name: save.name, card: cardName, count: qty, totalNow: save.collection[cardName] });
});

// Regalía Masiva / Programada  POST /api/admin/broadcast-reward
app.post('/api/admin/broadcast-reward', requireAdmin, (req, res) => {
  const { dpAmount, cardName, filter, reason } = req.body || {};
  const dpNum = parseInt(dpAmount) || 0;
  const now = Date.now();

  const dir = path.join(ROOT, 'saves');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    let count = 0;

    files.forEach(f => {
      try {
        const filePath = path.join(dir, f);
        const save = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!save || !save.name) return;

        // Filtros de aplicacion
        if (filter === 'active24h') {
          const diff = (now - (save.lastPlayed || 0)) / (1000 * 60 * 60);
          if (diff > 24) return;
        } else if (filter === 'progressM1') {
          const cleared = Array.isArray(save.cleared) ? save.cleared.length : 0;
          if (cleared < 3) return;
        }

        let modified = false;
        if (dpNum > 0) {
          save.pm = (save.pm || 0) + dpNum;
          modified = true;
        }
        if (cardName) {
          save.collection = save.collection || {};
          save.collection[cardName] = Math.min(9, (save.collection[cardName] || 0) + 1);
          modified = true;
        }

        if (modified) {
          save.rewardsHistory = save.rewardsHistory || [];
          save.rewardsHistory.push({
            type: 'BROADCAST',
            dp: dpNum,
            card: cardName || null,
            reason: reason || 'Regalía Global del Servidor',
            date: now
          });
          fs.writeFileSync(filePath, JSON.stringify(save, null, 2), 'utf8');
          count++;
        }
      } catch (_) {}
    });

    res.json({ ok: true, affectedCount: count, dpAmount: dpNum, cardName, reason });
  } catch (err) {
    res.status(500).json({ error: 'Error en regalía masiva: ' + err.message });
  }
});

// Activar / Modificar Suscripción  POST /api/admin/user/:name/subscription
app.post('/api/admin/user/:name/subscription', requireAdmin, async (req, res) => {
  const save = readSave(req.params.name);
  if (!save) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { action, months, customDate, reason } = req.body || {};
  const numMonths = parseInt(months) || 6;
  const now = Date.now();

  save.subscriptionHistory = save.subscriptionHistory || [];

  if (action === 'set_date' && customDate) {
    save.subscriptionEndsAt = new Date(customDate).getTime();
  } else {
    // Por defecto 'extend_6m' o meses especificados
    const durationMs = numMonths * 30 * 24 * 60 * 60 * 1000;
    const currentBase = Math.max(now, save.subscriptionEndsAt || 0);
    save.subscriptionEndsAt = currentBase + durationMs;
  }

  save.subscriptionPlan = 'vip_6m';
  save.subscriptionStatus = 'active';

  save.subscriptionHistory.push({
    type: 'vip_extension',
    months: numMonths,
    grantedAt: now,
    expiresAt: save.subscriptionEndsAt,
    reason: reason || 'Activación / Renovación de Suscripción 6 Meses ($10)',
    grantedBy: req.adminUser || 'admin'
  });

  writeSave(save);

  const newStatus = computeSubscriptionStatus(save);

  // Opcional: Notificar por correo al jugador si tiene correo vinculado
  if (save.email && isValidEmail(save.email)) {
    try {
      const expDateStr = new Date(save.subscriptionEndsAt).toLocaleDateString('es-CR');
      mailer.sendMail({
        from: '"Yu-Gi-Oh! Forbidden Memories Reborn" <joavce@mantixor.com>',
        to: save.email,
        subject: '⭐ ¡Tu Suscripción VIP ha sido activada! - Yu-Gi-Oh! FMR',
        html: `
          <div style="background:#0d1117; color:#c9d1d9; font-family:'Segoe UI',Arial,sans-serif; padding:30px; border:2px solid #ffd700; border-radius:10px; max-width:600px; margin:auto;">
            <h1 style="color:#ffd700; text-align:center; font-size:24px; margin-top:0;">¡SUSCRIPCIÓN VIP ACTIVADA!</h1>
            <p style="font-size:16px;">¡Felicidades, Duelista <b>${save.name}</b>!</p>
            <p>Tu comprobante de pago por SINPE Móvil ha sido verificado y tu suscripción de 6 meses ya se encuentra <b>100% activa</b>.</p>
            <div style="background:#161b22; border:1px solid #30363d; padding:15px; border-radius:6px; margin:20px 0;">
              <p style="margin:6px 0;"><b>Plan:</b> <span style="color:#ffd700; font-weight:bold;">VIP 6 Meses ($10 USD)</span></p>
              <p style="margin:6px 0;"><b>Fecha de Vencimiento:</b> <span style="color:#7ee787; font-weight:bold;">${expDateStr}</span> (${newStatus.remainingDays} días restantes)</p>
              <p style="margin:6px 0;"><b>Acceso:</b> <span style="color:#58a6ff;">Total (Duelos, Cartas, Baúl, Nube)</span></p>
            </div>
            <p>Ya puedes iniciar sesión en el juego y continuar tu progreso normalmente.</p>
            <p style="color:#8b949e; font-size:12px; text-align:center; margin-top:30px; border-top:1px solid #21262d; padding-top:15px;">
              ¡Gracias por apoyar a Yu-Gi-Oh! Forbidden Memories Reborn!
            </p>
          </div>
        `
      }).catch(e => console.error('[Subscription Email Error]', e));
    } catch (_) {}
  }

  res.json({
    ok: true,
    name: save.name,
    subscriptionEndsAt: save.subscriptionEndsAt,
    remainingDays: newStatus.remainingDays,
    status: newStatus
  });
});

// ════════════════════════════════════════════════════════════════
//  CARTAS (CATALOGO Y TIENDA)
// ════════════════════════════════════════════════════════════════

app.get('/api/cards', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards.json'), 'utf8'))); }
  catch { res.status(500).json({ error: 'No se pudo leer el catalogo' }); }
});

app.post('/api/cards', requireAdmin, (req, res) => {
  const c = req.body;
  if (!c || !c.name || !c.kind) return res.status(400).json({ error: 'name y kind requeridos' });
  try {
    const p = path.join(ROOT, 'data', 'cards.json');
    const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!c.id) c.id = Math.max(0, ...cards.map(x => x.id || 0)) + 1;
    
    // Integración de costo en tienda y tier
    c.price = parseInt(c.price) || 0;
    c.tier = c.tier || (c.kind === 'MONSTER' ? (c.atk >= 2500 ? 'ÉLITE ADMIN' : 'TIENDA') : 'MAGIA/TRAMPA');
    c.inShop = c.inShop !== false && c.price > 0;

    const idx = cards.findIndex(x => x.id === c.id);
    if (idx >= 0) cards[idx] = c; else cards.push(c);
    fs.writeFileSync(p, JSON.stringify(cards, null, 2), 'utf8');
    res.json({ ok: true, card: c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cards/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const p = path.join(ROOT, 'data', 'cards.json');
    let cards = JSON.parse(fs.readFileSync(p, 'utf8'));
    cards = cards.filter(c => c.id !== id);
    fs.writeFileSync(p, JSON.stringify(cards, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
//  DECKS DE PERSONAJES
// ════════════════════════════════════════════════════════════════

app.get('/api/decks', (req, res) => {
  const dir = path.join(ROOT, 'data', 'decks');
  try {
    const decks = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; }
    }).filter(Boolean);
    res.json(decks);
  } catch { res.json([]); }
});

app.get('/api/deck/:character', (req, res) => {
  const char = String(req.params.character).replace(/[^a-z0-9_]/g, '').toLowerCase();
  const file = path.join(ROOT, 'data', 'decks', char + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Deck no encontrado: ' + char });
  try { res.json(JSON.parse(fs.readFileSync(file, 'utf8'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/deck/:character', requireAdmin, (req, res) => {
  const char = String(req.params.character).replace(/[^a-z0-9_]/g, '').toLowerCase();
  const data = req.body;
  if (!data || !Array.isArray(data.cards)) return res.status(400).json({ error: 'cards[] requerido' });
  if (data.cards.length < 40 || data.cards.length > 60) return res.status(400).json({ error: 'El deck debe tener entre 40 y 60 cartas. Tiene: ' + data.cards.length });
  const file = path.join(ROOT, 'data', 'decks', char + '.json');
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log('  Forbidden Memories Reborn - Servidor');
  console.log('==========================================');
  console.log('  Juego:  http://localhost:' + PORT + '/');
  console.log('  Admin:  http://localhost:' + PORT + '/admin');
  console.log('  Saves:  ' + path.join(ROOT, 'saves'));
  console.log('==========================================');
  console.log('');
});