const fs = require('fs');
const https = require('https');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'imagenescartas', 'Mundo4');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const cards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards.json'), 'utf8'))
  .filter(c => c.id >= 1100 && c.id <= 1160);

console.log(`Starting download for ${cards.length} Zexal cards...`);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // handle redirect
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  let successCount = 0;
  for (const c of cards) {
    const filePath = path.join(targetDir, `${c.id}.jpg`);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
      console.log(`[SKIP] Card ${c.id}: ${c.name} already exists.`);
      successCount++;
      continue;
    }

    try {
      const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(c.name)}`;
      const json = await fetchJson(url);
      if (json.data && json.data[0] && json.data[0].card_images && json.data[0].card_images[0]) {
        const imgUrl = json.data[0].card_images[0].image_url;
        await downloadFile(imgUrl, filePath);
        console.log(`[OK] Card ${c.id}: ${c.name} downloaded successfully (${fs.statSync(filePath).size} bytes).`);
        successCount++;
      } else {
        console.warn(`[WARN] Card ${c.id}: ${c.name} not found in API`);
      }
    } catch (err) {
      console.error(`[ERROR] Card ${c.id}: ${c.name} error:`, err.message);
    }
    // slight delay
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nFinished: ${successCount}/${cards.length} cards downloaded to imagenescartas/Mundo4`);
}

run();
