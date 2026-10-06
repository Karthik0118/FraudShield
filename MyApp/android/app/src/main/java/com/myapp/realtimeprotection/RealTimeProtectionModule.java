package com.myapp.realtimeprotection;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONArray;

public class RealTimeProtectionModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    private static final String PREFS_NAME = "fraudshield_prefs";

    public RealTimeProtectionModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "RealTimeProtectionModule";
    }

    public static ReactApplicationContext getReactContext() {
        return reactContext;
    }

    @ReactMethod
    public void isNotificationAccessEnabled(Promise promise) {
        try {
            String enabledListeners = Settings.Secure.getString(getReactApplicationContext().getContentResolver(), "enabled_notification_listeners");
            boolean isEnabled = enabledListeners != null && enabledListeners.contains(getReactApplicationContext().getPackageName());
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void openNotificationAccessSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void setRealtimeProtectionEnabled(boolean enabled, Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean("realtime_protection_enabled", enabled).apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void isRealtimeProtectionEnabled(Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isEnabled = prefs.getBoolean("realtime_protection_enabled", false);
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void getRecentDetections(Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String detections = prefs.getString("recent_realtime_detections", "[]");
            promise.resolve(detections);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    public static void sendTransactionEvent(ReactApplicationContext context, String eventJson) {
        if (context != null && context.hasActiveReactInstance()) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onRealtimeTransaction", eventJson);
        } else {
            if (context != null) {
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String existing = prefs.getString("pending_realtime_events", "[]");
                try {
                    JSONArray array = new JSONArray(existing);
                    array.put(eventJson);
                    prefs.edit().putString("pending_realtime_events", array.toString()).apply();
                } catch (Exception e) {
                    // Ignore
                }
            }
        }
    }
}
