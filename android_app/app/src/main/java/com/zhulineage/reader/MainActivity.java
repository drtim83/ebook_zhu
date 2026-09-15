package com.zhulineage.reader;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;

public class MainActivity extends Activity implements TextToSpeech.OnInitListener {

    private static final String TAG = "ZhuReader";
    private WebView webView;
    private TextToSpeech tts;
    private boolean isTtsInitialized = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Immersive reading experience with solid black status bar
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(android.graphics.Color.BLACK);

        // Initialize Native Android Text-to-Speech
        tts = new TextToSpeech(this, this);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Console logs & alerts support
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d(TAG, consoleMessage.message() + " -- From line "
                        + consoleMessage.lineNumber() + " of "
                        + consoleMessage.sourceId());
                return true;
            }
        });

        // Add TTS bridge for JavaScript
        webView.addJavascriptInterface(new AndroidTTSBridge(), "AndroidTTS");

        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsInitialized = true;
            tts.setSpeechRate(1.0f);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    mainHandler.post(() -> {
                        if (webView != null) {
                            webView.evaluateJavascript("window.onAndroidTTSStart && window.onAndroidTTSStart('" + utteranceId + "');", null);
                        }
                    });
                }

                @Override
                public void onDone(String utteranceId) {
                    mainHandler.post(() -> {
                        if (webView != null) {
                            webView.evaluateJavascript("window.onAndroidTTSDone && window.onAndroidTTSDone('" + utteranceId + "');", null);
                        }
                    });
                }

                @Override
                public void onError(String utteranceId) {
                    mainHandler.post(() -> {
                        if (webView != null) {
                            webView.evaluateJavascript("window.onAndroidTTSError && window.onAndroidTTSError('" + utteranceId + "');", null);
                        }
                    });
                }
            });
            Log.d(TAG, "Native Android TTS initialized successfully");
        } else {
            Log.e(TAG, "Native Android TTS initialization failed with status: " + status);
        }
    }

    public class AndroidTTSBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return isTtsInitialized;
        }

        @JavascriptInterface
        public void speak(String text, String lang, float rate) {
            if (!isTtsInitialized || tts == null || text == null || text.trim().isEmpty()) {
                return;
            }
            try {
                if ("zh".equalsIgnoreCase(lang)) {
                    int result = tts.setLanguage(Locale.SIMPLIFIED_CHINESE);
                    if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        tts.setLanguage(Locale.CHINESE);
                    }
                } else {
                    tts.setLanguage(Locale.US);
                }
                tts.setSpeechRate(rate > 0 ? rate : 1.0f);
                tts.setPitch(1.0f);

                Bundle params = new Bundle();
                String utteranceId = "tts_" + System.currentTimeMillis();
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
            } catch (Exception e) {
                Log.e(TAG, "Error in speak: " + e.getMessage());
            }
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) {
                tts.stop();
            }
        }

        @JavascriptInterface
        public boolean isSpeaking() {
            return tts != null && tts.isSpeaking();
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
