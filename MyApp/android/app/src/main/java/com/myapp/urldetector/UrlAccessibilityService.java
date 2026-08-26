package com.myapp.urldetector;

import android.accessibilityservice.AccessibilityService;
import android.text.TextUtils;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.List;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * UrlAccessibilityService
 *
 * Android AccessibilityService implemented in pure Java.
 * Inspects visible node trees from the active foreground application to detect
 * HTTP and HTTPS URLs in real-time and trigger native overlay alerts.
 * Respects 3-second snooze intervals when alerts are dismissed.
 */
public class UrlAccessibilityService extends AccessibilityService {

    // Duplicate suppression window
    private static final long URL_COOLDOWN_MS = 5000;

    private String lastDetectedUrl = "";
    private long lastDetectedTimestamp = 0;
    private String lastEmittedText = "";
    private long lastEmittedTimestamp = 0;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) {
            return;
        }

        try {
            AccessibilityNodeInfo rootNode = getRootInActiveWindow();
            if (rootNode != null) {
                inspectNodeRecursive(rootNode);
                rootNode.recycle();
            }
        } catch (Exception ignored) {
            // Defensive: ensure accessibility event processing never throws unhandled crashes
        }
    }

    /**
     * Recursively traverses the accessibility node tree to inspect text and content descriptions.
     */
    private void inspectNodeRecursive(AccessibilityNodeInfo node) {
        if (node == null) {
            return;
        }

        try {
            // Check primary text
            CharSequence text = node.getText();
            if (text != null && text.length() > 0) {
                processTextContent(text);
            }

            // Check accessibility content description
            CharSequence description = node.getContentDescription();
            if (description != null && description.length() > 0) {
                processTextContent(description);
            }

            // Inspect child nodes
            int childCount = node.getChildCount();
            for (int i = 0; i < childCount; i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    inspectNodeRecursive(child);
                    child.recycle();
                }
            }
        } catch (Exception ignored) {
        }
    }

    /**
     * Extracts URLs from given text and enforces duplicate/snooze checks before showing the overlay alert.
     */
    private void processTextContent(CharSequence text) {
        if (text == null) return;
        
        String textString = text.toString().trim();
        if (textString.length() == 0) return;

        long now = System.currentTimeMillis();

        // Prevent spamming the JS bridge with identical text in short intervals
        if (!textString.equals(lastEmittedText) || (now - lastEmittedTimestamp > 2000)) {
            lastEmittedText = textString;
            lastEmittedTimestamp = now;
            try {
                ReactApplicationContext reactContext = AccessibilityBridgeModule.getReactContextInstance();
                if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onAccessibilityTextScanned", textString);
                }
            } catch (Exception ignored) {
            }
        }

        List<String> detectedUrls = UrlDetector.extractUrls(text);
        if (detectedUrls == null || detectedUrls.isEmpty()) {
            return;
        }

        now = System.currentTimeMillis();
        OverlayManager overlayManager = OverlayManager.getInstance(getApplicationContext());

        for (String url : detectedUrls) {
            if (TextUtils.isEmpty(url)) {
                continue;
            }

            // 1. Check if this URL or alerts are currently snoozed (e.g. within 3 seconds of dismissal)
            if (overlayManager.isSnoozed(url)) {
                continue;
            }

            // 2. Duplicate cooldown check: ignore identical URL within cooldown window
            if (url.equals(lastDetectedUrl) && (now - lastDetectedTimestamp < URL_COOLDOWN_MS)) {
                continue;
            }

            // Record latest detection
            lastDetectedUrl = url;
            lastDetectedTimestamp = now;

            // Trigger immediate native overlay over active app
            overlayManager.showOverlay(url);
            break;
        }
    }

    @Override
    public void onInterrupt() {
        // No-op
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            OverlayManager.getInstance(getApplicationContext()).dismissOverlay();
        } catch (Exception ignored) {
        }
    }
}
