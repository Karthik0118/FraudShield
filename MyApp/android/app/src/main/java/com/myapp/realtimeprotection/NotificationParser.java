package com.myapp.realtimeprotection;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class NotificationParser {

    public static class ParsedTransaction {
        public double amount;
        public String receiver;
        public String direction;
        public String rawText;
        public String sourceApp;
        public long timestamp;
        public String transactionType = "UPI";

        public ParsedTransaction(double amount, String receiver, String direction, String rawText, String sourceApp, long timestamp) {
            this.amount = amount;
            this.receiver = receiver;
            this.direction = direction;
            this.rawText = rawText;
            this.sourceApp = sourceApp;
            this.timestamp = timestamp;
        }
    }

    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(?:₹|Rs\\.?|INR)\\s*([0-9,]+(?:\\.[0-9]+)?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RECEIVER_PATTERN = Pattern.compile("(?:to|paid to|sent to)\\s+([A-Za-z0-9 ]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern SENDER_PATTERN = Pattern.compile("(?:from|received from)\\s+([A-Za-z0-9 ]+)", Pattern.CASE_INSENSITIVE);

    public static ParsedTransaction parse(String packageName, String text, long timestamp) {
        if (text == null) return null;
        
        Matcher amountMatcher = AMOUNT_PATTERN.matcher(text);
        if (!amountMatcher.find()) {
            return null;
        }
        
        double amount = 0;
        try {
            String amountStr = amountMatcher.group(1).replace(",", "");
            amount = Double.parseDouble(amountStr);
        } catch (Exception e) {
            return null;
        }
        
        String direction = "UNKNOWN";
        String receiver = "unknown";
        
        if (text.toLowerCase().contains("received") || text.toLowerCase().contains("credited")) {
            direction = "RECEIVED";
            Matcher senderMatcher = SENDER_PATTERN.matcher(text);
            if (senderMatcher.find()) {
                receiver = senderMatcher.group(1).trim();
            }
        } else if (text.toLowerCase().contains("paid") || text.toLowerCase().contains("sent") || text.toLowerCase().contains("debited")) {
            direction = "SENT";
            Matcher receiverMatcher = RECEIVER_PATTERN.matcher(text);
            if (receiverMatcher.find()) {
                receiver = receiverMatcher.group(1).trim();
            }
        }
        
        if (receiver.isEmpty() || receiver.length() > 50) {
            receiver = "unknown";
        }
        
        String sourceApp = getAppDisplayName(packageName);
        
        return new ParsedTransaction(amount, receiver, direction, text, sourceApp, timestamp);
    }

    public static boolean isPaymentNotification(String packageName, String text) {
        if (text == null) return false;
        String lowerText = text.toLowerCase();
        boolean hasAmount = AMOUNT_PATTERN.matcher(text).find();
        boolean hasKeyword = lowerText.contains("paid") || lowerText.contains("sent") || 
                             lowerText.contains("received") || lowerText.contains("credited") || 
                             lowerText.contains("debited");
        return hasAmount && hasKeyword;
    }

    public static String getAppDisplayName(String packageName) {
        if (packageName == null) return "Unknown";
        if (packageName.equals("com.phonepe.app")) return "PhonePe";
        if (packageName.equals("com.google.android.apps.nbu.paisa.user")) return "Google Pay";
        if (packageName.equals("net.one97.paytm")) return "Paytm";
        if (packageName.equals("com.whatsapp")) return "WhatsApp Pay";
        if (packageName.equals("in.org.npci.upiapp")) return "BHIM";
        
        String lowerPkg = packageName.toLowerCase();
        if (lowerPkg.contains("sbi")) return "SBI";
        if (lowerPkg.contains("hdfc")) return "HDFC";
        if (lowerPkg.contains("icici")) return "ICICI";
        if (lowerPkg.contains("axis")) return "Axis";
        if (lowerPkg.contains("kotak")) return "Kotak";
        if (lowerPkg.contains("bob")) return "BOB";
        if (lowerPkg.contains("pnb")) return "PNB";
        
        return packageName;
    }
}
