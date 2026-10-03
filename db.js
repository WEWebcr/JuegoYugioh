/**
 * Módulo de Base de Datos - Yu-Gi-Oh! Forbidden Memories Reborn
 * Soporta conexión a MongoDB Atlas (Cloud) con fallback resiliente a almacenamiento local en saves/*.json
 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SAVES_DIR = path.join(ROOT, 'saves');
if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
}

let client = null;
let db = null;
let savesCollection = null;
let isConnected = false;

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'yugioh_fmr';

function safeName(n) {
  return String(n).replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 32);
}

function savePath(name) {
  return path.join(SAVES_DIR, safeName(name) + '.json');
}

// ── Métodos de Almacenamiento Local (Fallback / Caché) ────────────
function readSaveLocal(name) {
  if (!name) return null;
  const p = savePath(name);
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
  }
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

function writeSaveLocal(data) {
  if (!data || !data.name) return;
  try {
    fs.writeFileSync(savePath(data.name), JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Database] Error escribiendo save local:', err.message);
  }
}

function findSaveLocal(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim();
  const byName = readSaveLocal(clean);
  if (byName) return byName;

  try {
    const files = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json'));
    const lower = clean.toLowerCase();
    for (const f of files) {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(SAVES_DIR, f), 'utf8'));
        if (d && (
          (d.email && d.email.toLowerCase() === lower) ||
          (d.name && d.name.toLowerCase() === lower) ||
          (Array.isArray(d.aliases) && d.aliases.some(a => String(a).toLowerCase() === lower))
        )) {
          return d;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

function getAllLocalSaves() {
  try {
    const files = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(SAVES_DIR, f), 'utf8')); }
      catch { return null; }
    }).filter(Boolean);
  } catch (_) {
    return [];
  }
}

// ── Métodos Híbridos / MongoDB ─────────────────────────────────────
async function initDatabase() {
  if (!MONGODB_URI) {
    console.log('[Database] MONGODB_URI no configurado en variables de entorno.');
    console.log('[Database] Operando en modo almacenamiento local resiliente (saves/*.json).');
    isConnected = false;
    return false;
  }

  try {
    console.log('[Database] Conectando a MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    await client.connect();
    db = client.db(DB_NAME);
    savesCollection = db.collection('saves');

    // Crear índices para optimizar búsquedas por nombre y correo
    try {
      await savesCollection.createIndex({ name: 1 }, { unique: true });
      await savesCollection.createIndex({ email: 1 });
    } catch (_) {}

    isConnected = true;
    console.log(`[Database] ¡Conectado exitosamente a MongoDB Atlas! (Base de datos: "${DB_NAME}", Colección: "saves")`);

    // Sincronizar partidas locales a la nube
    await migrateLocalSavesToMongo();
    return true;
  } catch (err) {
    console.warn('[Database] Advertencia: No se pudo conectar a MongoDB Atlas:', err.message);
    console.warn('[Database] Continuando con almacenamiento local (saves/*.json).');
    isConnected = false;
    return false;
  }
}

async function getSave(name) {
  if (!name) return null;
  const clean = String(name).trim();

  if (isConnected && savesCollection) {
    try {
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const doc = await savesCollection.findOne({
        name: { $regex: new RegExp('^' + escaped + '$', 'i') }
      });
      if (doc) {
        const { _id, ...saveData } = doc;
        // Guardar copia de respaldo en disco local
        writeSaveLocal(saveData);
        return saveData;
      }
    } catch (err) {
      console.warn('[Database] Error consultando save en MongoDB:', err.message);
    }
  }

  return readSaveLocal(clean);
}

async function findSave(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim();
  const lower = clean.toLowerCase();

  if (isConnected && savesCollection) {
    try {
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('^' + escaped + '$', 'i');
      const doc = await savesCollection.findOne({
        $or: [
          { name: regex },
          { email: regex },
          { aliases: lower }
        ]
      });
      if (doc) {
        const { _id, ...saveData } = doc;
        writeSaveLocal(saveData);
        return saveData;
      }
    } catch (err) {
      console.warn('[Database] Error buscando usuario en MongoDB:', err.message);
    }
  }

  return findSaveLocal(clean);
}

async function saveUser(data, syncGithubFn) {
  if (!data || !data.name) return false;

  // 1. Guardar en disco local y opcionalmente sincronizar en GitHub
  writeSaveLocal(data);
  if (typeof syncGithubFn === 'function') {
    try { syncGithubFn(data); } catch (_) {}
  }

  // 2. Guardar en MongoDB Atlas
  if (isConnected && savesCollection) {
    try {
      const clean = String(data.name).trim();
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await savesCollection.updateOne(
        { name: { $regex: new RegExp('^' + escaped + '$', 'i') } },
        { $set: data },
        { upsert: true }
      );
      return true;
    } catch (err) {
      console.error('[Database] Error actualizando documento en MongoDB:', err.message);
      return false;
    }
  }

  return true;
}

async function getAllUsers() {
  if (isConnected && savesCollection) {
    try {
      const docs = await savesCollection.find({}).toArray();
      if (docs && docs.length > 0) {
        return docs.map(d => {
          const { _id, ...save } = d;
          return save;
        });
      }
    } catch (err) {
      console.warn('[Database] Error listando usuarios desde MongoDB:', err.message);
    }
  }
  return getAllLocalSaves();
}

async function migrateLocalSavesToMongo() {
  if (!isConnected || !savesCollection) return;
  try {
    const localSaves = getAllLocalSaves();
    let migratedCount = 0;
    for (const save of localSaves) {
      if (save && save.name) {
        const clean = String(save.name).trim();
        const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exists = await savesCollection.findOne({
          name: { $regex: new RegExp('^' + escaped + '$', 'i') }
        });
        if (!exists) {
          await savesCollection.insertOne(save);
          migratedCount++;
        }
      }
    }
    if (migratedCount > 0) {
      console.log(`[Database] Se migraron exitosamente ${migratedCount} partida(s) locales a MongoDB Atlas.`);
    }
  } catch (err) {
    console.warn('[Database] Error durante la migración a MongoDB:', err.message);
  }
}

async function getDbStatus() {
  let count = 0;
  if (isConnected && savesCollection) {
    try {
      count = await savesCollection.countDocuments();
    } catch (_) {}
  } else {
    try {
      count = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json')).length;
    } catch (_) {}
  }

  return {
    ok: true,
    provider: isConnected ? 'mongodb' : 'local_disk',
    connected: isConnected,
    database: isConnected ? DB_NAME : 'saves_local_folder',
    uriConfigured: !!MONGODB_URI,
    totalSaves: count,
    serverTime: new Date().toISOString()
  };
}

async function deleteUser(name) {
  if (!name) return false;
  const clean = String(name).trim();
  const file = savePath(clean);
  if (fs.existsSync(file)) {
    try { fs.unlinkSync(file); } catch (_) {}
  }
  if (isConnected && savesCollection) {
    try {
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await savesCollection.deleteOne({ name: { $regex: new RegExp('^' + escaped + '$', 'i') } });
      return true;
    } catch (err) {
      console.warn('[Database] Error eliminando usuario de MongoDB:', err.message);
      return false;
    }
  }
  return true;
}

module.exports = {
  initDatabase,
  getSave,
  findSave,
  saveUser,
  getAllUsers,
  getDbStatus,
  migrateLocalSavesToMongo,
  deleteUser,
  safeName,
  savePath
};
