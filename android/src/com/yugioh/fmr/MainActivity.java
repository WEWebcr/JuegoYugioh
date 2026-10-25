package com.yugioh.fmr;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    public static final String PREFS_NAME = "FMR_PREFS";
    public static final String KEY_SERVER_URL = "server_url";
    public static final String DEFAULT_URL = "https://yugiohreborn.onrender.com/";

    private WebView mWebView;
    private ProgressBar mProgressBar;
    private SharedPreferences mPrefs;
    private NativeAudioBridge mNativeAudio;

    public static class NativeStorageBridge {
        private final Context context;

        public NativeStorageBridge(Context ctx) {
            this.context = ctx;
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        @JavascriptInterface
        public boolean saveData(String key, String data) {
            if (key == null || data == null) return false;
            try {
                String safeKey = key.replaceAll("[^a-zA-Z0-9_\\-]", "_");
                FileOutputStream fos = context.openFileOutput("fmr_save_" + safeKey + ".json", Context.MODE_PRIVATE);
                fos.write(data.getBytes(StandardCharsets.UTF_8));
                fos.flush();
                fos.close();
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

        @JavascriptInterface
        public String loadData(String key) {
            if (key == null) return null;
            try {
                String safeKey = key.replaceAll("[^a-zA-Z0-9_\\-]", "_");
                FileInputStream fis = context.openFileInput("fmr_save_" + safeKey + ".json");
                BufferedReader reader = new BufferedReader(new InputStreamReader(fis, StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();
                return sb.toString();
            } catch (Exception e) {
                return null;
            }
        }

        @JavascriptInterface
        public boolean hasData(String key) {
            if (key == null) return false;
            try {
                String safeKey = key.replaceAll("[^a-zA-Z0-9_\\-]", "_");
                File f = new File(context.getFilesDir(), "fmr_save_" + safeKey + ".json");
                return f.exists() && f.length() > 0;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public boolean deleteData(String key) {
            if (key == null) return false;
            try {
                String safeKey = key.replaceAll("[^a-zA-Z0-9_\\-]", "_");
                File f = new File(context.getFilesDir(), "fmr_save_" + safeKey + ".json");
                return f.delete();
            } catch (Exception e) {
                return false;
            }
        }
    }

    public static class NativeAudioBridge implements MediaPlayer.OnCompletionListener {
        private final Context context;
        private MediaPlayer bgmPlayer;
        private String currentBgm = null;
        private float bgmVolume = 0.55f;
        private boolean isMuted = false;
        private boolean isPaused = false;

        public NativeAudioBridge(Context ctx) {
            this.context = ctx;
        }

        @JavascriptInterface
        public synchronized void playBgm(String fileName) {
            if (fileName == null || fileName.isEmpty()) return;
            try {
                String cleanName = fileName.replace("musica/", "").trim();
                if (cleanName.equals(currentBgm) && bgmPlayer != null && bgmPlayer.isPlaying()) {
                    return;
                }
                stopBgmInternal();
                currentBgm = cleanName;

                AssetFileDescriptor afd = null;
                try {
                    afd = context.getAssets().openFd("musica/" + cleanName);
                } catch (Exception e1) {
                    try {
                        afd = context.getAssets().openFd(cleanName);
                    } catch (Exception ignored) {}
                }

                if (afd != null) {
                    bgmPlayer = new MediaPlayer();
                    bgmPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                    afd.close();
                    bgmPlayer.setLooping(true);
                    bgmPlayer.setVolume(isMuted ? 0f : bgmVolume, isMuted ? 0f : bgmVolume);
                    bgmPlayer.prepare();
                    bgmPlayer.start();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public synchronized void stopBgm() {
            stopBgmInternal();
        }

        public synchronized void stopBgmInternal() {
            try {
                if (bgmPlayer != null) {
                    if (bgmPlayer.isPlaying()) bgmPlayer.stop();
                    bgmPlayer.release();
                    bgmPlayer = null;
                }
                currentBgm = null;
            } catch (Exception ignored) {}
        }

        public synchronized void pauseBgm() {
            try {
                if (bgmPlayer != null && bgmPlayer.isPlaying()) {
                    bgmPlayer.pause();
                    isPaused = true;
                }
            } catch (Exception ignored) {}
        }

        public synchronized void resumeBgm() {
            try {
                if (bgmPlayer != null && isPaused) {
                    bgmPlayer.start();
                    isPaused = false;
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public synchronized void setVolume(float vol) {
            this.bgmVolume = vol;
            if (bgmPlayer != null) {
                bgmPlayer.setVolume(isMuted ? 0f : bgmVolume, isMuted ? 0f : bgmVolume);
            }
        }

        @JavascriptInterface
        public synchronized void setMuted(boolean muted) {
            this.isMuted = muted;
            if (bgmPlayer != null) {
                bgmPlayer.setVolume(isMuted ? 0f : bgmVolume, isMuted ? 0f : bgmVolume);
            }
        }

        @JavascriptInterface
        public void playSfx(String fileName) {
            if (fileName == null || isMuted) return;
            try {
                String cleanName = fileName.replace("musica/", "").trim();
                AssetFileDescriptor afd = null;
                try {
                    afd = context.getAssets().openFd("musica/" + cleanName);
                } catch (Exception e1) {
                    try {
                        afd = context.getAssets().openFd(cleanName);
                    } catch (Exception e2) {
                        try {
                            afd = context.getAssets().openFd("assets/" + cleanName);
                        } catch (Exception ignored) {}
                    }
                }
                if (afd != null) {
                    MediaPlayer sfx = new MediaPlayer();
                    sfx.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                    afd.close();
                    sfx.setLooping(false);
                    sfx.setVolume(1.0f, 1.0f);
                    sfx.setOnCompletionListener(this);
                    sfx.prepare();
                    sfx.start();
                }
            } catch (Exception ignored) {}
        }

        @Override
        public void onCompletion(MediaPlayer mp) {
            try {
                if (mp != null) {
                    mp.release();
                }
            } catch (Exception ignored) {}
        }
    }

    static class LimitedInputStream extends FilterInputStream {
        private long remaining;

        public LimitedInputStream(InputStream in, long limit) {
            super(in);
            this.remaining = limit;
        }

        @Override
        public int read() throws IOException {
            if (remaining <= 0) return -1;
            int r = super.read();
            if (r != -1) remaining--;
            return r;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (remaining <= 0) return -1;
            if (len > remaining) len = (int) remaining;
            int r = super.read(b, off, len);
            if (r > 0) remaining -= r;
            return r;
        }
    }

    static class CustomChromeClient extends WebChromeClient {
        private final ProgressBar bar;
        public CustomChromeClient(ProgressBar b) {
            this.bar = b;
        }
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (bar != null) {
                if (newProgress < 100) {
                    bar.setVisibility(View.VISIBLE);
                    bar.setProgress(newProgress);
                } else {
                    bar.setVisibility(View.GONE);
                }
            }
        }
    }

    static class CustomWebViewClient extends WebViewClient {
        private final MainActivity activity;
        private static final Map<String, String> sAssetPathMap = new HashMap<String, String>();
        private static boolean sAssetMapInitialized = false;

        public CustomWebViewClient(MainActivity act) {
            this.activity = act;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request == null || request.getUrl() == null) {
                return super.shouldInterceptRequest(view, request);
            }
            Uri uri = request.getUrl();
            String host = uri.getHost();
            String scheme = uri.getScheme();

            // 1. Interceptar peticiones locales bajo el dominio seguro virtual https://fmr.local/
            if ("fmr.local".equalsIgnoreCase(host) || "appassets.androidplatform.net".equalsIgnoreCase(host)) {
                String path = uri.getPath();
                if (path != null && path.startsWith("/")) {
                    path = path.substring(1);
                }
                if (path == null || path.isEmpty()) {
                    path = "YGOFMR2026-1.html";
                }

                // Las llamadas API (/api/...) NO son assets locales; deben ser manejadas por la red
                if (path.startsWith("api/")) {
                    return null;
                }

                return serveAsset(path, request);
            }

            // 2. Interceptar también si se accede por file:///android_asset/
            if ("file".equalsIgnoreCase(scheme)) {
                String path = uri.getPath();
                if (path != null) {
                    if (path.startsWith("/android_asset/")) {
                        path = path.substring("/android_asset/".length());
                    } else if (path.startsWith("/")) {
                        path = path.substring(1);
                    }
                    return serveAsset(path, request);
                }
            }

            return super.shouldInterceptRequest(view, request);
        }

        private synchronized String resolveAssetCasing(String path) {
            if (path == null) return null;
            if (!sAssetMapInitialized && activity != null) {
                buildAssetMap("", activity.getAssets());
                sAssetMapInitialized = true;
            }
            return sAssetPathMap.get(path.toLowerCase());
        }

        private void buildAssetMap(String prefix, AssetManager am) {
            try {
                String[] list = am.list(prefix);
                if (list == null) return;
                for (int i = 0; i < list.length; i++) {
                    String item = list[i];
                    String full = prefix.isEmpty() ? item : (prefix + "/" + item);
                    sAssetPathMap.put(full.toLowerCase(), full);
                    buildAssetMap(full, am);
                }
            } catch (Exception ignored) {}
        }

        private WebResourceResponse serveAsset(String rawPath, WebResourceRequest request) {
            if (rawPath == null || activity == null) return null;
            String path = rawPath;
            try {
                path = URLDecoder.decode(path, "UTF-8");
            } catch (Exception ignored) {}
            int q = path.indexOf('?');
            if (q != -1) path = path.substring(0, q);
            int h = path.indexOf('#');
            if (h != -1) path = path.substring(0, h);

            try {
                InputStream is = null;
                try {
                    is = activity.getAssets().open(path);
                } catch (IOException e1) {
                    String resolved = resolveAssetCasing(path);
                    if (resolved != null) {
                        path = resolved;
                        is = activity.getAssets().open(path);
                    } else {
                        return null;
                    }
                }

                String mime = getMimeType(path);
                boolean isText = mime.startsWith("text/") || mime.equals("application/javascript") || mime.equals("application/json");
                // CRÍTICO: Para recursos binarios (imágenes, audio), encoding DEBE ser null
                String encoding = isText ? "UTF-8" : null;

                Map<String, String> headers = new HashMap<String, String>();
                headers.put("Access-Control-Allow-Origin", "*");
                headers.put("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
                headers.put("Accept-Ranges", "bytes");

                long fileLength = -1;
                try {
                    AssetFileDescriptor afd = activity.getAssets().openFd(path);
                    if (afd != null) {
                        fileLength = afd.getLength();
                        afd.close();
                    }
                } catch (Exception ignored) {
                    try {
                        fileLength = is.available();
                    } catch (Exception ignored2) {}
                }

                String rangeHeader = null;
                if (request != null && request.getRequestHeaders() != null) {
                    rangeHeader = request.getRequestHeaders().get("Range");
                    if (rangeHeader == null) rangeHeader = request.getRequestHeaders().get("range");
                }

                if (rangeHeader != null && rangeHeader.startsWith("bytes=") && fileLength > 0) {
                    String rangeVal = rangeHeader.substring(6).trim();
                    long start = 0;
                    long end = fileLength - 1;
                    int dash = rangeVal.indexOf('-');
                    if (dash != -1) {
                        String sStr = rangeVal.substring(0, dash).trim();
                        String eStr = rangeVal.substring(dash + 1).trim();
                        if (!sStr.isEmpty()) {
                            try { start = Long.parseLong(sStr); } catch (Exception ignored) {}
                        }
                        if (!eStr.isEmpty()) {
                            try { end = Long.parseLong(eStr); } catch (Exception ignored) {}
                        }
                    }
                    if (end >= fileLength) end = fileLength - 1;
                    if (start > end) start = 0;

                    long contentLength = (end - start) + 1;
                    headers.put("Content-Range", "bytes " + start + "-" + end + "/" + fileLength);
                    headers.put("Content-Length", String.valueOf(contentLength));

                    if (start > 0) {
                        long skipped = 0;
                        while (skipped < start) {
                            long s = is.skip(start - skipped);
                            if (s <= 0) break;
                            skipped += s;
                        }
                    }

                    return new WebResourceResponse(mime, encoding, 206, "Partial Content", headers, new LimitedInputStream(is, contentLength));
                }

                if (fileLength > 0) {
                    headers.put("Content-Length", String.valueOf(fileLength));
                }

                return new WebResourceResponse(mime, encoding, 200, "OK", headers, is);
            } catch (IOException e) {
                return null;
            }
        }

        private static String getMimeType(String path) {
            String p = path.toLowerCase();
            if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
            if (p.endsWith(".js")) return "application/javascript";
            if (p.endsWith(".css")) return "text/css";
            if (p.endsWith(".json")) return "application/json";
            if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
            if (p.endsWith(".png")) return "image/png";
            if (p.endsWith(".webp")) return "image/webp";
            if (p.endsWith(".mp3")) return "audio/mpeg";
            if (p.endsWith(".ogg")) return "audio/ogg";
            if (p.endsWith(".wav")) return "audio/wav";
            return "application/octet-stream";
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request != null && request.isForMainFrame() && activity != null) {
                activity.showConnectionErrorDialog();
            }
        }
        @Override
        public void onReceivedSslError(WebView view, android.webkit.SslErrorHandler handler, android.net.http.SslError error) {
            if (handler != null) handler.proceed();
        }
        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (activity != null) {
                activity.hideSystemUI();
            }
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        mPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        RelativeLayout root = new RelativeLayout(this);
        root.setBackgroundColor(Color.BLACK);

        mWebView = new WebView(this);
        mWebView.setBackgroundColor(Color.BLACK);
        RelativeLayout.LayoutParams webParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.MATCH_PARENT);
        root.addView(mWebView, webParams);

        mProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        mProgressBar.setMax(100);
        RelativeLayout.LayoutParams progParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT, 8);
        progParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        root.addView(mProgressBar, progParams);

        setContentView(root);
        hideSystemUI();

        configureWebView();
        loadGameUrl();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mNativeAudio != null) {
            mNativeAudio.pauseBgm();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUI();
        if (mNativeAudio != null) {
            mNativeAudio.resumeBgm();
        }
    }

    @Override
    protected void onDestroy() {
        if (mNativeAudio != null) {
            mNativeAudio.stopBgmInternal();
        }
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }

    private void configureWebView() {
        mWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        mWebView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        mWebView.setVerticalScrollBarEnabled(false);
        mWebView.setHorizontalScrollBarEnabled(false);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " YuGiOhFMR-AndroidApp/" + getAppVersionName());

        mNativeAudio = new NativeAudioBridge(this);
        mWebView.addJavascriptInterface(mNativeAudio, "NativeAudio");
        mWebView.addJavascriptInterface(new NativeStorageBridge(this), "NativeStorage");
        mWebView.setWebChromeClient(new CustomChromeClient(mProgressBar));
        mWebView.setWebViewClient(new CustomWebViewClient(this));
    }

    public void loadGameUrl() {
        boolean hasLocalAsset = false;
        try {
            InputStream is = getAssets().open("YGOFMR2026-1.html");
            if (is != null) {
                is.close();
                hasLocalAsset = true;
            }
        } catch (Exception ignored) {}

        if (hasLocalAsset) {
            mWebView.loadUrl("https://fmr.local/YGOFMR2026-1.html");
            return;
        }

        String url = mPrefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        if (url == null || url.isEmpty() || url.contains("juegoyugioh") || !url.contains("yugiohreborn")) {
            url = DEFAULT_URL;
            mPrefs.edit().putString(KEY_SERVER_URL, DEFAULT_URL).apply();
        }
        mWebView.loadUrl(url);
    }

    public void showConnectionErrorDialog() {
        final String currentUrl = mPrefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        AlertDialog.Builder b = new AlertDialog.Builder(this);
        b.setTitle("⚠️ Error de Conexión (APK v" + getAppVersionName() + ")");
        b.setMessage("No se pudo conectar al servidor:\n" + currentUrl + "\n\n¿Deseas reintentar o configurar un servidor / IP local?");
        b.setPositiveButton("Reintentar", new RetryClick(this));
        b.setNeutralButton("Cambiar Servidor", new ConfigClick(this));
        b.setNegativeButton("Restablecer Oficial", new ResetClick(this, mPrefs));
        b.setCancelable(false);
        b.show();
    }

    static class RetryClick implements DialogInterface.OnClickListener {
        private final MainActivity act;
        public RetryClick(MainActivity a) { this.act = a; }
        public void onClick(DialogInterface d, int w) { act.loadGameUrl(); }
    }

    static class ResetClick implements DialogInterface.OnClickListener {
        private final MainActivity act;
        private final SharedPreferences prefs;
        public ResetClick(MainActivity a, SharedPreferences p) { this.act = a; this.prefs = p; }
        public void onClick(DialogInterface d, int w) {
            prefs.edit().putString(KEY_SERVER_URL, DEFAULT_URL).apply();
            act.loadGameUrl();
        }
    }

    static class ConfigClick implements DialogInterface.OnClickListener {
        private final MainActivity act;
        public ConfigClick(MainActivity a) { this.act = a; }
        public void onClick(DialogInterface d, int w) { act.showServerConfigDialog(); }
    }

    public void showServerConfigDialog() {
        final EditText input = new EditText(this);
        input.setHint("Ej: http://192.168.1.100:3005/");
        input.setText(mPrefs.getString(KEY_SERVER_URL, DEFAULT_URL));

        AlertDialog.Builder b = new AlertDialog.Builder(this);
        b.setTitle("⚙️ Configurar Servidor");
        b.setMessage("Ingresa la URL del servidor del juego:");
        b.setView(input);
        b.setPositiveButton("Guardar y Conectar", new SaveServerClick(this, mPrefs, input));
        b.setNegativeButton("Cancelar", null);
        b.show();
    }

    static class SaveServerClick implements DialogInterface.OnClickListener {
        private final MainActivity act;
        private final SharedPreferences prefs;
        private final EditText inp;
        public SaveServerClick(MainActivity a, SharedPreferences p, EditText i) {
            this.act = a; this.prefs = p; this.inp = i;
        }
        public void onClick(DialogInterface d, int w) {
            String newUrl = inp.getText().toString().trim();
            if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                newUrl = "http://" + newUrl;
            }
            if (!newUrl.endsWith("/")) {
                newUrl = newUrl + "/";
            }
            prefs.edit().putString(KEY_SERVER_URL, newUrl).apply();
            act.loadGameUrl();
        }
    }

    public void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public void onBackPressed() {
        AlertDialog.Builder b = new AlertDialog.Builder(this);
        b.setTitle("Yu-Gi-Oh! FMR - APK v" + getAppVersionName());
        b.setMessage("Versión instalada: v" + getAppVersionName() + " (Build " + getAppVersionCode() + ")\nServidor conectado:\n" + mPrefs.getString(KEY_SERVER_URL, DEFAULT_URL) + "\n\n¿Deseas salir del juego o configurar el servidor?");
        b.setPositiveButton("Salir", new ExitClick(this));
        b.setNeutralButton("Configurar Servidor", new ConfigClick(this));
        b.setNegativeButton("Continuar Duelo", null);
        b.show();
    }

    public String getAppVersionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "4.0.0";
        }
    }

    public int getAppVersionCode() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
        } catch (Exception e) {
            return 6;
        }
    }

    static class ExitClick implements DialogInterface.OnClickListener {
        private final MainActivity act;
        public ExitClick(MainActivity a) { this.act = a; }
        public void onClick(DialogInterface d, int w) { act.finish(); }
    }
}
