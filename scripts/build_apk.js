const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const BUILD_DIR = path.join(ANDROID_DIR, 'build');
const DEX_DIR = path.join(BUILD_DIR, 'dex');
const GEN_DIR = path.join(BUILD_DIR, 'gen');
const CLASSES_DIR = path.join(BUILD_DIR, 'classes');

// SDK & JDK Paths
const JBR_BIN = 'C:\\Program Files\\Android\\Android Studio\\jbr\\bin';
process.env.JAVA_HOME = 'C:\\Program Files\\Android\\Android Studio\\jbr';
process.env.PATH = JBR_BIN + ';' + process.env.PATH;
const JAVAC = path.join(JBR_BIN, 'javac.exe');
const JAR = path.join(JBR_BIN, 'jar.exe');
const KEYTOOL = path.join(JBR_BIN, 'keytool.exe');

const SDK_DIR = 'C:\\Users\\JosueTIR\\AppData\\Local\\Android\\Sdk';
const BUILD_TOOLS = path.join(SDK_DIR, 'build-tools', '34.0.0');
const AAPT2 = path.join(BUILD_TOOLS, 'aapt2.exe');
const D8 = path.join(BUILD_TOOLS, 'd8.bat');
const ZIPALIGN = path.join(BUILD_TOOLS, 'zipalign.exe');
const APKSIGNER = path.join(BUILD_TOOLS, 'apksigner.bat');
const ANDROID_JAR = path.join(SDK_DIR, 'platforms', 'android-34', 'android.jar');

const manifestPath = path.join(ANDROID_DIR, 'AndroidManifest.xml');
const manifestXml = fs.readFileSync(manifestPath, 'utf8');
const vNameMatch = manifestXml.match(/android:versionName="([^"]+)"/);
const vCodeMatch = manifestXml.match(/android:versionCode="([^"]+)"/);
const appVersion = vNameMatch ? vNameMatch[1] : '4.0.0';
const appBuild = vCodeMatch ? vCodeMatch[1] : '6';

console.log(`=== COMPILADOR DE APK NATIVO YU-GI-OH! FMR v${appVersion} (Build ${appBuild}) ===`);

const ASSETS_DIR = path.join(ANDROID_DIR, 'assets');

// Prepare clean build dirs
[BUILD_DIR, DEX_DIR, GEN_DIR, CLASSES_DIR].forEach(dir => {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
});

// Prepare assets directory for offline-first autonomous bundle
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// 1. Copy fresh YGOFMR2026-1.html
const htmlSrc = path.join(ROOT, 'YGOFMR2026-1.html');
const htmlDest = path.join(ASSETS_DIR, 'YGOFMR2026-1.html');
if (fs.existsSync(htmlSrc)) {
    fs.copyFileSync(htmlSrc, htmlDest);
}

// 2. Ensure junctions for local game media (cards, characters, audio, configs)
const assetFolders = ['imagenescartas', 'ImagenesPersonajes', 'musica', 'assets', 'data'];
assetFolders.forEach(folder => {
    const src = path.join(ROOT, folder);
    const dest = path.join(ASSETS_DIR, folder);
    if (!fs.existsSync(dest) && fs.existsSync(src)) {
        try {
            execSync(`cmd /c "mklink /J "${dest}" "${src}""`, { stdio: 'ignore' });
        } catch (_) {
            try { fs.cpSync(src, dest, { recursive: true }); } catch (__) {}
        }
    }
});

try {
    // 1. AAPT2 COMPILE
    console.log('[1/7] Compilando recursos con aapt2...');
    const compiledResZip = path.join(BUILD_DIR, 'compiled_res.zip');
    execSync(`"${AAPT2}" compile --dir "${path.join(ANDROID_DIR, 'res')}" -o "${compiledResZip}"`, { stdio: 'inherit' });

    // 2. AAPT2 LINK (Sin -A para evitar que aapt2 en Windows inserte barras invertidas \)
    console.log('[2/7] Enlazando manifiesto, recursos y generando R.java...');
    const unalignedResApk = path.join(BUILD_DIR, 'unaligned_resources.apk');
    const manifestPath = path.join(ANDROID_DIR, 'AndroidManifest.xml');
    execSync(`"${AAPT2}" link -I "${ANDROID_JAR}" --manifest "${manifestPath}" --min-sdk-version 24 --target-sdk-version 34 "${compiledResZip}" --java "${GEN_DIR}" -o "${unalignedResApk}" --auto-add-overlay`, { stdio: 'inherit' });

    // 3. JAVAC
    console.log('[3/7] Compilando código Java con OpenJDK 21...');
    const rJava = path.join(GEN_DIR, 'com', 'yugioh', 'fmr', 'R.java');
    const mainJava = path.join(ANDROID_DIR, 'src', 'com', 'yugioh', 'fmr', 'MainActivity.java');
    execSync(`"${JAVAC}" -source 8 -target 8 -cp "${ANDROID_JAR}" -d "${CLASSES_DIR}" "${rJava}" "${mainJava}"`, { stdio: 'inherit' });

    // 4. D8
    console.log('[4/7] Convirtiendo bytecode a Android DEX con d8...');
    const fmrDir = path.join(CLASSES_DIR, 'com', 'yugioh', 'fmr');
    const classFiles = fs.readdirSync(fmrDir).filter(f => f.endsWith('.class')).map(f => path.join(fmrDir, f));
    execSync(`"${D8}" --min-api 24 --lib "${ANDROID_JAR}" --output "${DEX_DIR}" ${classFiles.map(c => `"${c}"`).join(' ')}`, { stdio: 'inherit' });

    // 5. PACKAGING DEX INTO APK CON ASSETS Y RUTAS POSIX LIMPIAS (/)
    console.log('[5/7] Empaquetando classes.dex y assets locales dentro del APK...');
    const apkWithDex = path.join(BUILD_DIR, 'app_with_dex.apk');
    fs.copyFileSync(unalignedResApk, apkWithDex);
    execSync(`"${JAR}" uf "${apkWithDex}" -C "${DEX_DIR}" classes.dex`, { stdio: 'inherit' });
    // Empaquetar directorio assets/ con jar (garantiza barras / estándar y compatibles con Android Linux)
    execSync(`"${JAR}" uf "${apkWithDex}" -C "${ANDROID_DIR}" assets`, { stdio: 'inherit' });
    // Almacenar carpeta musica/ sin compresión (modo store -0) para acceso instantáneo con AssetFileDescriptor
    execSync(`"${JAR}" -u -0 -f "${apkWithDex}" -C "${ANDROID_DIR}" assets/musica`, { stdio: 'inherit' });

    // 6. ZIPALIGN
    console.log('[6/7] Optimizando y alineando APK a 4 bytes (zipalign)...');
    const alignedApk = path.join(BUILD_DIR, 'app_aligned.apk');
    execSync(`"${ZIPALIGN}" -f -p 4 "${apkWithDex}" "${alignedApk}"`, { stdio: 'inherit' });

    // 7. KEYSTORE & SIGNING
    console.log('[7/7] Firmando APK con apksigner...');
    const keystorePath = path.join(ANDROID_DIR, 'debug.keystore');
    if (!fs.existsSync(keystorePath)) {
        console.log('   Generando debug keystore...');
        execSync(`"${KEYTOOL}" -genkeypair -v -keystore "${keystorePath}" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=YuGiOhFMR,O=Bandai1998,C=CR"`, { stdio: 'inherit' });
    }

    const finalApkPath = path.join(ROOT, 'YuGiOh-ForbiddenMemoriesReborn.apk');
    execSync(`"${APKSIGNER}" sign --ks "${keystorePath}" --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android --out "${finalApkPath}" "${alignedApk}"`, { stdio: 'inherit' });

    // Copy to public download folder
    const pubDir = path.join(ROOT, 'public_downloads');
    if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
    fs.copyFileSync(finalApkPath, path.join(pubDir, 'app.apk'));

    const stats = fs.statSync(finalApkPath);
    console.log('\n======================================================');
    console.log(`  ¡APK v${appVersion} (Build ${appBuild}) GENERADO Y FIRMADO CON ÉXITO!`);
    console.log('  Archivo: ' + finalApkPath);
    console.log('  Tamaño:  ' + (stats.size / 1024).toFixed(1) + ' KB (' + stats.size + ' bytes)');
    console.log('  Descarga directa: ' + path.join(pubDir, 'app.apk'));
    console.log('======================================================\n');
} catch (err) {
    console.error('\n❌ Error al compilar APK:', err.message);
    process.exit(1);
}
