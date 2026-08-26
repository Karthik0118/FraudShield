package com.myapp.urldetector;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * UrlDetector
 *
 * Local Java utility to detect unencrypted, insecure HTTP URLs from accessible text.
 * Strictly ignores secure HTTPS URLs.
 */
public class UrlDetector {

    // Matches ONLY http:// (specifically excludes https://)
    private static final Pattern INSECURE_HTTP_PATTERN = Pattern.compile(
        "http://[a-zA-Z0-9.-]+(?:\\.[a-zA-Z]{2,})+(?::\\d{1,5})?(?:/[^\\s<>\"'\\[\\]{}]*)?",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Extracts only insecure HTTP URLs present in the provided text.
     * Secure HTTPS URLs are explicitly filtered out and ignored.
     *
     * @param text Input string from accessibility node
     * @return List of matched insecure HTTP URLs
     */
    public static List<String> extractUrls(CharSequence text) {
        List<String> urls = new ArrayList<>();
        if (text == null || text.length() == 0) {
            return urls;
        }

        try {
            Matcher matcher = INSECURE_HTTP_PATTERN.matcher(text);
            while (matcher.find()) {
                String matched = matcher.group().trim();
                // Clean trailing punctuation if accidentally captured
                if (matched.endsWith(".") || matched.endsWith(",") || matched.endsWith(";")) {
                    matched = matched.substring(0, matched.length() - 1);
                }

                // Explicit double check: strictly insecure http:// only, never https://
                String lower = matched.toLowerCase();
                if (lower.startsWith("http://") && !lower.startsWith("https://")) {
                    if (matched.length() > 0 && !urls.contains(matched)) {
                        urls.add(matched);
                    }
                }
            }
        } catch (Exception ignored) {
            // Defensive: ensure regex never throws uncaught exceptions
        }

        return urls;
    }
}
