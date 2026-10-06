package com.myapp.realtimeprotection;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public class FraudAlertNotifier {
    private static final String CHANNEL_ID = "fraudshield_alerts";

    public void showFraudAlert(Context context, double amount, String receiver, String riskLevel, double fraudProbability, String sourceApp) {
        if ("LOW".equals(riskLevel)) return;

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "FraudShield Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            notificationManager.createNotificationChannel(channel);
        }

        String contentText = "";
        if ("HIGH".equals(riskLevel)) {
            contentText = "HIGH-RISK TRANSACTION: ₹" + amount + " → " + receiver;
        } else if ("MEDIUM".equals(riskLevel)) {
            contentText = "Suspicious Transaction: ₹" + amount + " → " + receiver;
        }

        Intent intent = new Intent(context, getMainActivityClass(context));
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        
        // Use a deep link that React Native's Linking module can natively intercept
        String deepLink = "fraudshield://realtime_result" +
                "?amount=" + amount +
                "&receiver=" + Uri.encode(receiver) +
                "&risk_level=" + riskLevel +
                "&fraud_probability=" + fraudProbability +
                "&source_app=" + Uri.encode(sourceApp);
                
        intent.setData(Uri.parse(deepLink));

        int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, (int) System.currentTimeMillis(), intent, pendingIntentFlags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle("🛡️ FraudShield Alert")
                .setContentText(contentText)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
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
