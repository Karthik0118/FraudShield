package com.myapp.realtimeprotection;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class TransactionDuplicateChecker {
    private static final int MAX_ENTRIES = 100;
    private static final long WINDOW_MS = 30000;
    
    private final Map<String, Long> cache;

    public TransactionDuplicateChecker() {
        this.cache = Collections.synchronizedMap(new LinkedHashMap<String, Long>(MAX_ENTRIES + 1, .75F, false) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Long> eldest) {
                return size() > MAX_ENTRIES;
            }
        });
    }

    private String getHash(String packageName, String text, long timestamp) {
        long timeWindow = timestamp / WINDOW_MS;
        return packageName + "|" + text + "|" + timeWindow;
    }

    public boolean isDuplicate(String packageName, String text, long timestamp) {
        String hash = getHash(packageName, text, timestamp);
        return cache.containsKey(hash);
    }

    public void recordProcessed(String packageName, String text, long timestamp) {
        String hash = getHash(packageName, text, timestamp);
        cache.put(hash, timestamp);
    }
}
