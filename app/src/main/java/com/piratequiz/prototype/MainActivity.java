package com.piratequiz.prototype;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.local";
    private static final String ASSET_PREFIX = "/assets/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view,
                    WebResourceRequest request
            ) {
                Uri uri = request.getUrl();
                if (
                        "https".equals(uri.getScheme())
                        && APP_HOST.equals(uri.getHost())
                        && uri.getPath() != null
                        && uri.getPath().startsWith(ASSET_PREFIX)
                ) {
                    String assetPath = uri.getPath().substring(ASSET_PREFIX.length());
                    if (assetPath.contains("..")) {
                        return new WebResourceResponse(
                                "text/plain",
                                "UTF-8",
                                null
                        );
                    }

                    try {
                        InputStream stream = getAssets().open(assetPath);
                        return new WebResourceResponse(
                                mimeTypeFor(assetPath),
                                "UTF-8",
                                stream
                        );
                    } catch (IOException ignored) {
                        return new WebResourceResponse(
                                "text/plain",
                                "UTF-8",
                                null
                        );
                    }
                }

                return super.shouldInterceptRequest(view, request);
            }
        });

        webView.setBackgroundColor(0xFF071922);
        webView.loadUrl("https://" + APP_HOST + "/assets/index.html");
        setContentView(webView);
    }

    private String mimeTypeFor(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js") || path.endsWith(".mjs")) return "text/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".webp")) return "image/webp";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }
}
