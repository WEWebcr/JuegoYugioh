package com.yugioh.fmr;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;

public class MainActivity extends Activity {

    public static final String PREFS_NAME = "FMR_PREFS";
    public static final String KEY_SERVER_URL = "server_url";
    public static final String DEFAULT_URL = "https://yugiohreborn.onrender.com/";

    private WebView mWebView;
    private ProgressBar mProgressBar;
    private SharedPreferences mPrefs;

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
        public CustomWebViewClient(MainActivity act) {
            this.activity = act;
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

    private void configureWebView() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " YuGiOhFMR-AndroidApp/3.0.0");

        mWebView.setWebChromeClient(new CustomChromeClient(mProgressBar));
        mWebView.setWebViewClient(new CustomWebViewClient(this));
    }

    public void loadGameUrl() {
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
        b.setTitle("⚠️ Error de Conexión");
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
        b.setTitle("Yu-Gi-Oh! FMR");
        b.setMessage("¿Deseas salir del juego o configurar el servidor?");
        b.setPositiveButton("Salir", new ExitClick(this));
        b.setNeutralButton("Configurar Servidor", new ConfigClick(this));
        b.setNegativeButton("Continuar Duelo", null);
        b.show();
    }

    static class ExitClick implements DialogInterface.OnClickListener {
        private final MainActivity act;
        public ExitClick(MainActivity a) { this.act = a; }
        public void onClick(DialogInterface d, int w) { act.finish(); }
    }
}
