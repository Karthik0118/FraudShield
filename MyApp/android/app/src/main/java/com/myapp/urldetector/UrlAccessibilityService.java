package com.myapp.urldetector;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.os.Handler;
import android.os.Looper;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * UrlAccessibilityService
 *
 * Android AccessibilityService that monitors foreground app content for
 * fraud detection. Designed to minimise false positives by:
 *
 * 1. Coalescing all visible text into a single snapshot (not per-node emission).
 * 2. Content-hashing to skip duplicate/unchanged screens.
 * 3. Debouncing rapid accessibility events (500ms coalesce window).
 * 4. Filtering out trivially short or meaningless fragments.
 * 5. Emitting structured events (text + package + detected URLs) to the JS layer.
 */
public class UrlAccessibilityService extends AccessibilityService {

    private static final String TAG = "FraudShield.A11y";

    // ── Debounce & Deduplication ─────────────────────────────────────────────
    /** Minimum ms between processing events for the same package. */
    private static final long DEBOUNCE_MS = 500;

    /** Minimum aggregate text length worth analysing (skip UI noise). */
    private static final int MIN_AGGREGATE_LENGTH = 20;

    /** Cooldown after emitting an event before we emit another for the same content hash. */
    private static final long CONTENT_COOLDOWN_MS = 10_000;

    /** Maximum number of recent content hashes to remember. */
    private static final int MAX_HASH_HISTORY = 50;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable pendingProcess = null;
    private long lastProcessTime = 0;
    private String lastContentHash = "";
    private long lastContentHashTime = 0;

    // Simple LRU-ish set of recently-seen hashes
    private final Set<String> recentHashes = new HashSet<>();
    private final List<String> hashOrder = new ArrayList<>();

    // ── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;

        int eventType = event.getEventType();
        // Only process window state changes and content changes
        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            return;
        }

        // Debounce: coalesce rapid events into a single processing pass
        if (pendingProcess != null) {
            mainHandler.removeCallbacks(pendingProcess);
        }

        final CharSequence pkgName = event.getPackageName();
        final String packageName = pkgName != null ? pkgName.toString() : "unknown";

        pendingProcess = () -> {
            try {
                processScreen(packageName);
            } catch (Exception ignored) {
                // Never crash the host app
            }
        };

        mainHandler.postDelayed(pendingProcess, DEBOUNCE_MS);
    }

    /**
     * Process the entire visible screen as a single unit.
     * Collects all text, deduplicates, and emits to JS if content is new and meaningful.
     */
    private void processScreen(String packageName) {
        long now = System.currentTimeMillis();
        lastProcessTime = now;

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        try {
            // Collect all visible text from the screen
            StringBuilder aggregateText = new StringBuilder();
            Set<String> seenFragments = new HashSet<>();
            collectTextFromTree(rootNode, aggregateText, seenFragments);

            String fullText = aggregateText.toString().trim();

            // Skip trivially short content (UI buttons, labels, etc.)
            if (fullText.length() < MIN_AGGREGATE_LENGTH) {
                return;
            }

            // Content hashing for deduplication
            String contentHash = computeSimpleHash(fullText);

            // Skip if identical to the last emitted content (within cooldown)
            if (contentHash.equals(lastContentHash) &&
                (now - lastContentHashTime) < CONTENT_COOLDOWN_MS) {
                return;
            }

            // Also check against recent history
            if (recentHashes.contains(contentHash)) {
                return;
            }

            // Record this hash
            lastContentHash = contentHash;
            lastContentHashTime = now;
            addToHashHistory(contentHash);

            // Extract URLs from the aggregate text
            List<String> detectedUrls = UrlDetector.extractUrls(fullText);

            // Emit structured event to JS layer
            emitToJS(fullText, packageName, detectedUrls);

        } catch (Exception ignored) {
            // Defensive
        } finally {
            rootNode.recycle();
        }
    }

    /**
     * Recursively collects text from the node tree, deduplicating fragments.
     * Concatenates with newlines to preserve some structure without blindly
     * mashing unrelated UI elements together.
     */
    private void collectTextFromTree(AccessibilityNodeInfo node,
                                      StringBuilder sb,
                                      Set<String> seenFragments) {
        if (node == null) return;

        try {
            // Collect primary text
            CharSequence text = node.getText();
            if (text != null) {
                String fragment = text.toString().trim();
                if (fragment.length() > 0 && !seenFragments.contains(fragment)) {
                    seenFragments.add(fragment);
                    if (sb.length() > 0) sb.append("\n");
                    sb.append(fragment);
                }
            }

            // Collect content description (e.g. image alt text)
            CharSequence desc = node.getContentDescription();
            if (desc != null) {
                String fragment = desc.toString().trim();
                if (fragment.length() > 0 && !seenFragments.contains(fragment)) {
                    seenFragments.add(fragment);
                    if (sb.length() > 0) sb.append("\n");
                    sb.append(fragment);
                }
            }

            // Recurse into children
            int childCount = node.getChildCount();
            for (int i = 0; i < childCount; i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    collectTextFromTree(child, sb, seenFragments);
                    child.recycle();
                }
            }
        } catch (Exception ignored) {
        }
    }

    /**
     * Emit a structured event to the React Native JS layer.
     */
    private void emitToJS(String aggregateText, String packageName, List<String> detectedUrls) {
        try {
            ReactApplicationContext reactContext = AccessibilityBridgeModule.getReactContextInstance();
            if (reactContext == null || !reactContext.hasActiveCatalystInstance()) return;

            WritableMap payload = Arguments.createMap();
            payload.putString("text", aggregateText);
            payload.putString("packageName", packageName);

            // Include detected URLs as a comma-separated string for simplicity
            if (detectedUrls != null && !detectedUrls.isEmpty()) {
                StringBuilder urlsStr = new StringBuilder();
                for (int i = 0; i < detectedUrls.size(); i++) {
                    if (i > 0) urlsStr.append(",");
                    urlsStr.append(detectedUrls.get(i));
                }
                payload.putString("detectedUrls", urlsStr.toString());
            } else {
                payload.putString("detectedUrls", "");
            }

            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onAccessibilityTextScanned", payload);
        } catch (Exception ignored) {
        }
    }

    /**
     * Simple hash: uses Java's hashCode on the normalised text.
     * Good enough for deduplication without cryptographic overhead.
     */
    private String computeSimpleHash(String text) {
        // Normalise whitespace for comparison
        String normalised = text.replaceAll("\\s+", " ").trim().toLowerCase();
        return String.valueOf(normalised.hashCode());
    }

    /**
     * Maintains a bounded set of recent content hashes to prevent re-analysis.
     */
    private void addToHashHistory(String hash) {
        if (recentHashes.size() >= MAX_HASH_HISTORY) {
            // Remove oldest
            String oldest = hashOrder.remove(0);
            recentHashes.remove(oldest);
        }
        recentHashes.add(hash);
        hashOrder.add(hash);
    }

    @Override
    public void onInterrupt() {
        // No-op
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (pendingProcess != null) {
            mainHandler.removeCallbacks(pendingProcess);
        }
        try {
            OverlayManager.getInstance(getApplicationContext()).dismissOverlay();
        } catch (Exception ignored) {
        }
    }
}
