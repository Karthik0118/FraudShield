# Postman Collection Format & Dummy Data

This document contains instructions for testing the `/predict-transaction` API in Postman, along with 20 dummy datasets containing various payment networks (UPI, NEFT, IMPS, RTGS) and transaction behaviors (normal vs. fraudulent).

## 1. Postman Setup

### Endpoint Details
*   **Method:** `POST`
*   **URL:** `http://127.0.0.1:8000/predict-transaction`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Body:** raw -> JSON

### cURL Equivalent
```bash
curl --location 'http://127.0.0.1:8000/predict-transaction' \
--header 'Content-Type: application/json' \
--data '{
  "current_transaction": {
    "amount": 5000,
    "receiver_id": "user_123",
    "timestamp": "2026-10-04T13:00:00",
    "transaction_type": "UPI"
  },
  "previous_transactions": [
    {
      "amount": 200,
      "receiver_id": "user_001",
      "timestamp": "2026-10-03T10:00:00",
      "transaction_type": "UPI"
    }
  ]
}'
```

---

## 2. Dummy Datasets

Copy and paste the JSON blocks below into the raw body of your Postman request.

### Scenario A: Normal Behaviors (Low Risk)

**1. Standard Grocery/Utility (UPI)**
```json
{
  "current_transaction": { "amount": 1500, "receiver_id": "vendor_A", "timestamp": "2026-10-04T18:30:00", "transaction_type": "UPI" },
  "previous_transactions": [
    { "amount": 800, "receiver_id": "vendor_B", "timestamp": "2026-10-02T12:00:00", "transaction_type": "UPI" },
    { "amount": 1200, "receiver_id": "vendor_A", "timestamp": "2026-09-28T18:00:00", "transaction_type": "UPI" }
  ]
}
```

**2. Monthly Rent Payment (NEFT)**
```json
{
  "current_transaction": { "amount": 25000, "receiver_id": "landlord_01", "timestamp": "2026-10-01T09:00:00", "transaction_type": "NEFT" },
  "previous_transactions": [
    { "amount": 25000, "receiver_id": "landlord_01", "timestamp": "2026-09-01T09:15:00", "transaction_type": "NEFT" },
    { "amount": 25000, "receiver_id": "landlord_01", "timestamp": "2026-08-01T10:00:00", "transaction_type": "NEFT" }
  ]
}
```

**3. Frequent Small Transfers (UPI)**
```json
{
  "current_transaction": { "amount": 150, "receiver_id": "friend_01", "timestamp": "2026-10-04T20:00:00", "transaction_type": "UPI" },
  "previous_transactions": [
    { "amount": 100, "receiver_id": "friend_01", "timestamp": "2026-10-04T19:30:00", "transaction_type": "UPI" },
    { "amount": 50, "receiver_id": "friend_02", "timestamp": "2026-10-03T15:00:00", "transaction_type": "UPI" }
  ]
}
```

**4. Salary Transfer / Self-Account (IMPS)**
```json
{
  "current_transaction": { "amount": 10000, "receiver_id": "self_acct_2", "timestamp": "2026-10-04T10:00:00", "transaction_type": "IMPS" },
  "previous_transactions": [
    { "amount": 15000, "receiver_id": "self_acct_2", "timestamp": "2026-09-20T11:00:00", "transaction_type": "IMPS" }
  ]
}
```

**5. Empty History (First Transaction)**
```json
{
  "current_transaction": { "amount": 500, "receiver_id": "shop_01", "timestamp": "2026-10-04T11:00:00", "transaction_type": "UPI" },
  "previous_transactions": []
}
```

**6. Large Business Payment (RTGS)**
```json
{
  "current_transaction": { "amount": 250000, "receiver_id": "supplier_X", "timestamp": "2026-10-04T14:00:00", "transaction_type": "RTGS" },
  "previous_transactions": [
    { "amount": 200000, "receiver_id": "supplier_X", "timestamp": "2026-09-04T13:30:00", "transaction_type": "RTGS" }
  ]
}
```

**7. Regular E-commerce (UPI)**
```json
{
  "current_transaction": { "amount": 4500, "receiver_id": "amazon_pay", "timestamp": "2026-10-04T21:00:00", "transaction_type": "UPI" },
  "previous_transactions": [
    { "amount": 200, "receiver_id": "amazon_pay", "timestamp": "2026-10-01T20:00:00", "transaction_type": "UPI" },
    { "amount": 8500, "receiver_id": "amazon_pay", "timestamp": "2026-09-15T22:00:00", "transaction_type": "UPI" }
  ]
}
```

**8. Mutual Fund SIP (NEFT)**
```json
{
  "current_transaction": { "amount": 10000, "receiver_id": "zerodha_mf", "timestamp": "2026-10-05T08:00:00", "transaction_type": "NEFT" },
  "previous_transactions": [
    { "amount": 10000, "receiver_id": "zerodha_mf", "timestamp": "2026-09-05T08:00:00", "transaction_type": "NEFT" }
  ]
}
```

**9. Routine Pharmacy Purchase (UPI)**
```json
{
  "current_transaction": { "amount": 350, "receiver_id": "apollo_pharm", "timestamp": "2026-10-04T16:00:00", "transaction_type": "UPI" },
  "previous_transactions": [
    { "amount": 600, "receiver_id": "apollo_pharm", "timestamp": "2026-09-18T10:30:00", "transaction_type": "UPI" }
  ]
}
```

**10. Family Transfer (IMPS)**
```json
{
  "current_transaction": { "amount": 5000, "receiver_id": "mom_acct", "timestamp": "2026-10-04T12:00:00", "transaction_type": "IMPS" },
  "previous_transactions": [
    { "amount": 4000, "receiver_id": "mom_acct", "timestamp": "2026-09-02T14:00:00", "transaction_type": "IMPS" }
  ]
}
```

---

### Scenario B: Anomalous / Fraudulent Behaviors (Medium/High Risk)

**11. High Amount + New Receiver (UPI)**
```json
{
  "current_transaction": { "amount": 45000, "receiver_id": "unknown_scammer", "timestamp": "2026-10-04T13:00:00", "transaction_type": "UPI" },
  "previous_transactions": [
    { "amount": 150, "receiver_id": "friend_01", "timestamp": "2026-10-03T10:00:00", "transaction_type": "UPI" },
    { "amount": 200, "receiver_id": "vendor_A", "timestamp": "2026-10-02T12:00:00", "transaction_type": "UPI" },
    { "amount": 50, "receiver_id": "friend_01", "timestamp": "2026-10-01T09:00:00", "transaction_type": "UPI" }
  ]
}
```

**12. Late Night Suspicious Transfer (IMPS)**
```json
{
  "current_transaction": { "amount": 12000, "receiver_id": "crypto_exchange", "timestamp": "2026-10-04T03:15:00", "transaction_type": "IMPS" },
  "previous_transactions": [
    { "amount": 500, "receiver_id": "zomato", "timestamp": "2026-10-03T20:00:00", "transaction_type": "UPI" },
    { "amount": 100, "receiver_id": "uber", "timestamp": "2026-10-03T18:00:00", "transaction_type": "UPI" }
  ]
}
```

**13. Velocity Attack / Rapid Successive Small Transfers (UPI)**
```json
{
  "current_transaction": { "amount": 4999, "receiver_id": "fraud_acct_1", "timestamp": "2026-10-04T12:05:00", "transaction_type": "UPI" },
  "previous_transactions": [
    { "amount": 4999, "receiver_id": "fraud_acct_1", "timestamp": "2026-10-04T12:04:00", "transaction_type": "UPI" },
    { "amount": 4999, "receiver_id": "fraud_acct_1", "timestamp": "2026-10-04T12:03:00", "transaction_type": "UPI" },
    { "amount": 4999, "receiver_id": "fraud_acct_1", "timestamp": "2026-10-04T12:02:00", "transaction_type": "UPI" }
  ]
}
```

**14. Massive RTGS to Unknown Entity (RTGS)**
```json
{
  "current_transaction": { "amount": 950000, "receiver_id": "shell_corp_001", "timestamp": "2026-10-04T11:00:00", "transaction_type": "RTGS" },
  "previous_transactions": [
    { "amount": 1000, "receiver_id": "utility_bill", "timestamp": "2026-09-20T10:00:00", "transaction_type": "NEFT" },
    { "amount": 2500, "receiver_id": "grocery_store", "timestamp": "2026-09-15T14:00:00", "transaction_type": "UPI" }
  ]
}
```

**15. Maxing Out UPI Limit Instantly (UPI)**
```json
{
  "current_transaction": { "amount": 100000, "receiver_id": "new_payee_x", "timestamp": "2026-10-04T09:30:00", "transaction_type": "UPI" },
  "previous_transactions": [
    { "amount": 50, "receiver_id": "tea_stall", "timestamp": "2026-10-04T09:15:00", "transaction_type": "UPI" }
  ]
}
```

**16. Random High-Value NEFT after inactivity (NEFT)**
```json
{
  "current_transaction": { "amount": 75000, "receiver_id": "unknown_broker", "timestamp": "2026-10-04T10:00:00", "transaction_type": "NEFT" },
  "previous_transactions": [
    { "amount": 200, "receiver_id": "mobile_recharge", "timestamp": "2025-12-01T10:00:00", "transaction_type": "UPI" }
  ]
}
```

**17. Unusual Pattern Change (UPI)**
```json
{
  "current_transaction": { "amount": 15000, "receiver_id": "gaming_site", "timestamp": "2026-10-04T01:00:00", "transaction_type": "UPI" },
  "previous_transactions": [
    { "amount": 10, "receiver_id": "temple_donation", "timestamp": "2026-10-03T08:00:00", "transaction_type": "UPI" },
    { "amount": 20, "receiver_id": "temple_donation", "timestamp": "2026-10-02T08:00:00", "transaction_type": "UPI" }
  ]
}
```

**18. Pinging to test account then large drain (IMPS)**
```json
{
  "current_transaction": { "amount": 49000, "receiver_id": "attacker_wallet", "timestamp": "2026-10-04T14:05:00", "transaction_type": "IMPS" },
  "previous_transactions": [
    { "amount": 1, "receiver_id": "attacker_wallet", "timestamp": "2026-10-04T14:00:00", "transaction_type": "IMPS" },
    { "amount": 500, "receiver_id": "normal_store", "timestamp": "2026-10-01T10:00:00", "transaction_type": "UPI" }
  ]
}
```

**19. Uncharacteristic Large Transfer (IMPS)**
```json
{
  "current_transaction": { "amount": 85000, "receiver_id": "random_acct", "timestamp": "2026-10-04T15:00:00", "transaction_type": "IMPS" },
  "previous_transactions": [
    { "amount": 3500, "receiver_id": "gym_fee", "timestamp": "2026-10-01T07:00:00", "transaction_type": "UPI" },
    { "amount": 1200, "receiver_id": "grocery", "timestamp": "2026-09-28T18:00:00", "transaction_type": "UPI" }
  ]
}
```

**20. Multiple Large Transactions in a Row (RTGS)**
```json
{
  "current_transaction": { "amount": 150000, "receiver_id": "offshore_acct", "timestamp": "2026-10-04T16:15:00", "transaction_type": "RTGS" },
  "previous_transactions": [
    { "amount": 150000, "receiver_id": "offshore_acct", "timestamp": "2026-10-04T16:10:00", "transaction_type": "RTGS" },
    { "amount": 150000, "receiver_id": "offshore_acct", "timestamp": "2026-10-04T16:05:00", "transaction_type": "RTGS" }
  ]
}
```
