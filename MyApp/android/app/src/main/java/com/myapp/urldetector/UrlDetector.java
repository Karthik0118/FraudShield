package com.myapp.urldetector;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * UrlDetector
 *
 * Local Java utility to detect HTTP and HTTPS URLs from text.
 * Both HTTP and HTTPS URLs are extracted so the backend URL analyzer
 * can properly score them using its full set of risk signals.
 *
 * HTTP-only is NOT automatically considered malicious — the backend
 * URL analyzer determines the actual risk based on multiple signals.
 */
public class UrlDetector {

    // Matches both http:// and https:// URLs
    private static final Pattern URL_PATTERN = Pattern.compile(
        "https?://[a-zA-Z0-9.-]+(?:\\.[a-zA-Z]{2,})+(?::\\d{1,5})?(?:/[^\\s<>\"'\\[\\]{}]*)?",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Extracts all HTTP and HTTPS URLs present in the provided text.
     *
     * @param text Input string from accessibility node
     * @return List of matched URLs (both HTTP and HTTPS)
     */
    public static List<String> extractUrls(CharSequence text) {
        List<String> urls = new ArrayList<>();
        if (text == null || text.length() == 0) {
            return urls;
        }

        try {
            Matcher matcher = URL_PATTERN.matcher(text);
            while (matcher.find()) {
                String matched = matcher.group().trim();
                // Clean trailing punctuation if accidentally captured
                if (matched.endsWith(".") || matched.endsWith(",") || matched.endsWith(";")) {
                    matched = matched.substring(0, matched.length() - 1);
                }

                if (matched.length() > 0 && !urls.contains(matched)) {
                    urls.add(matched);
                }
            }
        } catch (Exception ignored) {
            // Defensive: ensure regex never throws uncaught exceptions
        }

        return urls;
    }
}
