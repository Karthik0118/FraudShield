package com.myapp.realtimeprotection;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class FraudShieldNotificationService extends NotificationListenerService {
    private static final String TAG = "FraudShieldService";
    private static final String PREFS_NAME = "fraudshield_prefs";
    private static final String PREF_ENABLED = "realtime_protection_enabled";
    
    private TransactionDuplicateChecker duplicateChecker;
    private ExecutorService executorService;
    private FraudAlertNotifier notifier;

    @Override
    public void onCreate() {
        super.onCreate();
        duplicateChecker = new TransactionDuplicateChecker();
        executorService = Executors.newSingleThreadExecutor();
        notifier = new FraudAlertNotifier();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (executorService != null) {
            executorService.shutdown();
        }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isEnabled = prefs.getBoolean(PREF_ENABLED, false);
            if (!isEnabled) {
                return;
            }

            String packageName = sbn.getPackageName();
            Notification notification = sbn.getNotification();
            if (notification == null || notification.extras == null) return;

            CharSequence textSeq = notification.extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence titleSeq = notification.extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence bigTextSeq = notification.extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

            String text = "";
            if (textSeq != null) text += textSeq.toString() + " ";
            if (titleSeq != null) text += titleSeq.toString() + " ";
            if (bigTextSeq != null) text += bigTextSeq.toString();

            if (text.trim().isEmpty()) return;

            if (!NotificationParser.isPaymentNotification(packageName, text)) {
                return;
            }

            long timestamp = sbn.getPostTime();
            if (duplicateChecker.isDuplicate(packageName, text, timestamp)) {
                return;
            }
            duplicateChecker.recordProcessed(packageName, text, timestamp);

            NotificationParser.ParsedTransaction transaction = NotificationParser.parse(packageName, text, timestamp);
            if (transaction != null) {
                checkFraud(transaction);
            }

        } catch (Exception e) {
            Log.e(TAG, "Error processing notification", e);
        }
    }

    private void checkFraud(NotificationParser.ParsedTransaction transaction) {
        executorService.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL("http://127.0.0.1:8000/predict-transaction");
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);

                JSONObject currentTx = new JSONObject();
                currentTx.put("amount", transaction.amount);
                currentTx.put("receiver_id", transaction.receiver);
                
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
                currentTx.put("timestamp", sdf.format(new Date(transaction.timestamp)));
                currentTx.put("transaction_type", transaction.transactionType);

                JSONObject requestBody = new JSONObject();
                requestBody.put("current_transaction", currentTx);
                requestBody.put("previous_transactions", new JSONArray());

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = requestBody.toString().getBytes("utf-8");
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                if (code == 200) {
                    BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"));
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    
                    JSONObject resJson = new JSONObject(response.toString());
                    boolean isFraud = resJson.optBoolean("is_fraud", false);
                    double prob = resJson.optDouble("fraud_probability", 0.0);
                    String riskLevel = resJson.optString("risk_level", "LOW");

                    if (isFraud || "HIGH".equals(riskLevel) || "MEDIUM".equals(riskLevel)) {
                        if ("HIGH".equals(riskLevel) || "MEDIUM".equals(riskLevel)) {
                            notifier.showFraudAlert(getApplicationContext(), transaction.amount, transaction.receiver, riskLevel, prob, transaction.sourceApp);
                        }
                    }

                    JSONObject eventJson = new JSONObject();
                    eventJson.put("amount", transaction.amount);
                    eventJson.put("receiver", transaction.receiver);
                    eventJson.put("riskLevel", riskLevel);
                    eventJson.put("fraudProbability", prob);
                    eventJson.put("sourceApp", transaction.sourceApp);
                    eventJson.put("timestamp", transaction.timestamp);

                    RealTimeProtectionModule.sendTransactionEvent(RealTimeProtectionModule.getReactContext(), eventJson.toString());
                }

            } catch (Exception e) {
                Log.e(TAG, "Error checking fraud", e);
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        });
    }
}
