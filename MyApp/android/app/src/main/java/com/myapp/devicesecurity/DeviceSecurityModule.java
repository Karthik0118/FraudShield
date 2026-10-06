package com.myapp.devicesecurity;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * DeviceSecurityModule
 *
 * React Native bridge that performs local device security checks.
 * Does NOT use private APIs, root access, or external AI services.
 * All checks use standard Android APIs available to normal applications.
 */
public class DeviceSecurityModule extends ReactContextBaseJavaModule {

    private static final String PREFS_NAME = "fraudshield_prefs";

    // Well-known system accessibility services that are NOT suspicious
    private static final Set<String> KNOWN_SAFE_ACCESSIBILITY = new HashSet<>();
    static {
        KNOWN_SAFE_ACCESSIBILITY.add("com.google.android.marvin.talkback");
        KNOWN_SAFE_ACCESSIBILITY.add("com.samsung.accessibility");
        KNOWN_SAFE_ACCESSIBILITY.add("com.google.android.accessibility");
        KNOWN_SAFE_ACCESSIBILITY.add("com.android.switchaccess");
        KNOWN_SAFE_ACCESSIBILITY.add("com.google.android.apps.accessibility");
    }

    // Well-known notification listeners that are NOT suspicious
    private static final Set<String> KNOWN_SAFE_NOTIFICATION_LISTENERS = new HashSet<>();
    static {
        KNOWN_SAFE_NOTIFICATION_LISTENERS.add("com.google.android.wearable");
        KNOWN_SAFE_NOTIFICATION_LISTENERS.add("com.google.android.apps.messaging");
        KNOWN_SAFE_NOTIFICATION_LISTENERS.add("com.android.systemui");
        KNOWN_SAFE_NOTIFICATION_LISTENERS.add("com.google.android.projection.gearhead");
    }

    public DeviceSecurityModule(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "DeviceSecurityModule";
    }

    /**
     * Runs all device security checks and returns a comprehensive result map.
     */
    @ReactMethod
    public void runSecurityScan(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            WritableMap result = Arguments.createMap();

            // 1. Accessibility Services Check
            WritableMap accessibilityResult = checkAccessibilityServices(context);
            result.putMap("accessibilityServices", accessibilityResult);

            // 2. Notification Listeners Check
            WritableMap notificationResult = checkNotificationListeners(context);
            result.putMap("notificationListeners", notificationResult);

            // 3. Developer Options / USB Debugging
            WritableMap developerResult = checkDeveloperOptions(context);
            result.putMap("developerOptions", developerResult);

            // 4. Install Sources (Unknown Sources)
            WritableMap installSourceResult = checkInstallSources(context);
            result.putMap("installSources", installSourceResult);

            // 5. Recently Installed Apps
            WritableMap recentAppsResult = checkRecentlyInstalledApps(context);
            result.putMap("recentApps", recentAppsResult);

            // 6. Device Encryption
            WritableMap encryptionResult = checkDeviceEncryption(context);
            result.putMap("deviceEncryption", encryptionResult);

            // Save last scan timestamp
            long scanTime = System.currentTimeMillis();
            result.putDouble("scanTimestamp", scanTime);

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putLong("last_security_scan", scanTime).apply();

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("SCAN_ERROR", "Security scan failed: " + e.getMessage());
        }
    }

    /**
     * Check enabled accessibility services and identify unfamiliar ones.
     */
    private WritableMap checkAccessibilityServices(Context context) {
        WritableMap result = Arguments.createMap();
        WritableArray services = Arguments.createArray();
        int unfamiliarCount = 0;

        try {
            AccessibilityManager am = (AccessibilityManager) context.getSystemService(Context.ACCESSIBILITY_SERVICE);
            if (am != null) {
                List<AccessibilityServiceInfo> enabledServices =
                        am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);

                if (enabledServices != null) {
                    String ownPackage = context.getPackageName();
                    for (AccessibilityServiceInfo info : enabledServices) {
                        if (info == null || info.getResolveInfo() == null) continue;

                        ServiceInfo serviceInfo = info.getResolveInfo().serviceInfo;
                        if (serviceInfo == null) continue;

                        String packageName = serviceInfo.packageName;
                        String serviceName = serviceInfo.name;
                        CharSequence labelCs = serviceInfo.loadLabel(context.getPackageManager());
                        String label = labelCs != null ? labelCs.toString() : serviceName;

                        // Determine if this is a known safe service
                        boolean isOwnApp = ownPackage.equals(packageName);
                        boolean isKnownSafe = isOwnApp || isSystemApp(context, packageName) || isKnownSafeAccessibility(packageName);
                        boolean isUnfamiliar = !isKnownSafe;

                        if (isUnfamiliar) unfamiliarCount++;

                        WritableMap svc = Arguments.createMap();
                        svc.putString("packageName", packageName);
                        svc.putString("label", label);
                        svc.putBoolean("isSystemApp", isSystemApp(context, packageName));
                        svc.putBoolean("isOwnApp", isOwnApp);
                        svc.putBoolean("isUnfamiliar", isUnfamiliar);
                        services.pushMap(svc);
                    }
                }
            }
        } catch (Exception e) {
            // Fail gracefully
        }

        result.putArray("services", services);
        result.putInt("total", services.size());
        result.putInt("unfamiliarCount", unfamiliarCount);
        result.putString("status", unfamiliarCount > 0 ? (unfamiliarCount >= 2 ? "risk" : "warning") : "safe");
        return result;
    }

    /**
     * Check apps that have notification listener access.
     */
    private WritableMap checkNotificationListeners(Context context) {
        WritableMap result = Arguments.createMap();
        WritableArray listeners = Arguments.createArray();
        int unfamiliarCount = 0;

        try {
            String flat = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
            if (flat != null && !flat.isEmpty()) {
                String ownPackage = context.getPackageName();
                String[] components = flat.split(":");
                Set<String> processedPackages = new HashSet<>();

                for (String component : components) {
                    if (component == null || component.isEmpty()) continue;
                    String packageName = component.contains("/") ? component.split("/")[0] : component;
                    packageName = packageName.trim();

                    if (packageName.isEmpty() || processedPackages.contains(packageName)) continue;
                    processedPackages.add(packageName);

                    boolean isOwnApp = ownPackage.equals(packageName);
                    boolean isKnownSafe = isOwnApp || isSystemApp(context, packageName) || isKnownSafeNotificationListener(packageName);
                    boolean isUnfamiliar = !isKnownSafe;

                    if (isUnfamiliar) unfamiliarCount++;

                    String label = getAppLabel(context, packageName);

                    WritableMap listener = Arguments.createMap();
                    listener.putString("packageName", packageName);
                    listener.putString("label", label);
                    listener.putBoolean("isSystemApp", isSystemApp(context, packageName));
                    listener.putBoolean("isOwnApp", isOwnApp);
                    listener.putBoolean("isUnfamiliar", isUnfamiliar);
                    listeners.pushMap(listener);
                }
            }
        } catch (Exception e) {
            // Fail gracefully
        }

        result.putArray("listeners", listeners);
        result.putInt("total", listeners.size());
        result.putInt("unfamiliarCount", unfamiliarCount);
        result.putString("status", unfamiliarCount > 0 ? (unfamiliarCount >= 2 ? "risk" : "warning") : "safe");
        return result;
    }

    /**
     * Check developer options and USB debugging status.
     */
    private WritableMap checkDeveloperOptions(Context context) {
        WritableMap result = Arguments.createMap();

        try {
            int devOptions = Settings.Secure.getInt(context.getContentResolver(),
                    Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0);
            int adbEnabled = Settings.Secure.getInt(context.getContentResolver(),
                    Settings.Global.ADB_ENABLED, 0);

            result.putBoolean("developerOptionsEnabled", devOptions == 1);
            result.putBoolean("usbDebuggingEnabled", adbEnabled == 1);

            if (devOptions == 1 && adbEnabled == 1) {
                result.putString("status", "warning");
            } else if (devOptions == 1 || adbEnabled == 1) {
                result.putString("status", "warning");
            } else {
                result.putString("status", "safe");
            }
        } catch (Exception e) {
            result.putBoolean("developerOptionsEnabled", false);
            result.putBoolean("usbDebuggingEnabled", false);
            result.putString("status", "safe");
        }

        return result;
    }

    /**
     * Check if unknown sources / sideloading is enabled.
     */
    private WritableMap checkInstallSources(Context context) {
        WritableMap result = Arguments.createMap();

        try {
            boolean unknownSourcesEnabled = false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // On Android 8+, it's per-app. Check if the device has any "canRequestPackageInstalls" scenario.
                // We can only check our own app's permission.
                unknownSourcesEnabled = context.getPackageManager().canRequestPackageInstalls();
            } else {
                int setting = Settings.Secure.getInt(context.getContentResolver(),
                        Settings.Secure.INSTALL_NON_MARKET_APPS, 0);
                unknownSourcesEnabled = setting == 1;
            }

            result.putBoolean("unknownSourcesEnabled", unknownSourcesEnabled);
            result.putString("status", unknownSourcesEnabled ? "warning" : "safe");
        } catch (Exception e) {
            result.putBoolean("unknownSourcesEnabled", false);
            result.putString("status", "safe");
        }

        return result;
    }

    /**
     * Check recently installed apps (within last 7 days).
     */
    private WritableMap checkRecentlyInstalledApps(Context context) {
        WritableMap result = Arguments.createMap();
        WritableArray recentApps = Arguments.createArray();

        try {
            PackageManager pm = context.getPackageManager();
            long sevenDaysAgo = System.currentTimeMillis() - (7L * 24 * 60 * 60 * 1000);

            List<PackageInfo> packages = pm.getInstalledPackages(0);
            for (PackageInfo pkg : packages) {
                if (pkg.firstInstallTime > sevenDaysAgo) {
                    boolean isSystem = (pkg.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                    if (isSystem) continue; // Skip system apps

                    String label = pkg.applicationInfo.loadLabel(pm).toString();

                    WritableMap app = Arguments.createMap();
                    app.putString("packageName", pkg.packageName);
                    app.putString("label", label);
                    app.putDouble("installTime", pkg.firstInstallTime);
                    recentApps.pushMap(app);
                }
            }
        } catch (Exception e) {
            // Fail gracefully
        }

        result.putArray("apps", recentApps);
        result.putInt("count", recentApps.size());
        result.putString("status", recentApps.size() > 3 ? "warning" : "safe");
        return result;
    }

    /**
     * Check device encryption status.
     */
    private WritableMap checkDeviceEncryption(Context context) {
        WritableMap result = Arguments.createMap();

        try {
            android.app.admin.DevicePolicyManager dpm =
                    (android.app.admin.DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);

            if (dpm != null) {
                int encryptionStatus = dpm.getStorageEncryptionStatus();
                boolean isEncrypted = encryptionStatus == android.app.admin.DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE
                        || encryptionStatus == android.app.admin.DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE_DEFAULT_KEY
                        || encryptionStatus == android.app.admin.DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE_PER_USER;

                result.putBoolean("isEncrypted", isEncrypted);
                result.putString("status", isEncrypted ? "safe" : "risk");
            } else {
                result.putBoolean("isEncrypted", true); // Assume encrypted if we can't check
                result.putString("status", "safe");
            }
        } catch (Exception e) {
            result.putBoolean("isEncrypted", true);
            result.putString("status", "safe");
        }

        return result;
    }

    /**
     * Opens the Android Security settings screen.
     */
    @ReactMethod
    public void openSecuritySettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_SECURITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SETTINGS_ERROR", e.getMessage());
        }
    }

    /**
     * Opens Android Developer Options settings.
     */
    @ReactMethod
    public void openDeveloperSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            // Fallback to general settings
            try {
                Intent fallback = new Intent(Settings.ACTION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getReactApplicationContext().startActivity(fallback);
                promise.resolve(true);
            } catch (Exception e2) {
                promise.reject("SETTINGS_ERROR", e2.getMessage());
            }
        }
    }

    /**
     * Opens the Installed Apps settings screen.
     */
    @ReactMethod
    public void openAppSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_MANAGE_APPLICATIONS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SETTINGS_ERROR", e.getMessage());
        }
    }

    /**
     * Gets the timestamp of the last security scan.
     */
    @ReactMethod
    public void getLastScanTime(Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext()
                    .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            long lastScan = prefs.getLong("last_security_scan", 0);
            promise.resolve((double) lastScan);
        } catch (Exception e) {
            promise.resolve(0.0);
        }
    }

    // ─── Utility Methods ───────────────────────────────────────────────────

    private boolean isSystemApp(Context context, String packageName) {
        try {
            ApplicationInfo info = context.getPackageManager().getApplicationInfo(packageName, 0);
            return (info.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isKnownSafeAccessibility(String packageName) {
        for (String safe : KNOWN_SAFE_ACCESSIBILITY) {
            if (packageName.contains(safe)) return true;
        }
        return false;
    }

    private boolean isKnownSafeNotificationListener(String packageName) {
        for (String safe : KNOWN_SAFE_NOTIFICATION_LISTENERS) {
            if (packageName.contains(safe)) return true;
        }
        return false;
    }

    private String getAppLabel(Context context, String packageName) {
        try {
            PackageManager pm = context.getPackageManager();
            ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            return info.loadLabel(pm).toString();
        } catch (Exception e) {
            return packageName;
        }
    }

    /**
     * Shows a local Android notification for device security risks.
     */
    @ReactMethod
    public void showSecurityAlert(String title, String message, String riskLevel, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            
            android.app.NotificationManager notificationManager = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            String channelId = "fraudshield_device_security";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.app.NotificationChannel channel = new android.app.NotificationChannel(
                        channelId,
                        "Device Security Alerts",
                        android.app.NotificationManager.IMPORTANCE_HIGH
                );
                notificationManager.createNotificationChannel(channel);
            }

            Intent intent = new Intent(context, getMainActivityClass(context));
            intent.setAction(Intent.ACTION_VIEW);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            intent.setData(android.net.Uri.parse("fraudshield://device_security"));

            int pendingIntentFlags = android.app.PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingIntentFlags |= android.app.PendingIntent.FLAG_IMMUTABLE;
            }
            android.app.PendingIntent pendingIntent = android.app.PendingIntent.getActivity(
                    context, (int) System.currentTimeMillis(), intent, pendingIntentFlags);

            androidx.core.app.NotificationCompat.Builder builder = new androidx.core.app.NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(android.R.drawable.ic_dialog_alert)
                    .setContentTitle(title)
                    .setContentText(message)
                    .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

            notificationManager.notify(999, builder.build());
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ALERT_ERROR", e.getMessage());
        }
    }

    private Class<?> getMainActivityClass(Context context) {
        String packageName = context.getPackageName();
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
        if (launchIntent != null && launchIntent.getComponent() != null) {
            try {
                return Class.forName(launchIntent.getComponent().getClassName());
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
        }
        return null;
    }
}
