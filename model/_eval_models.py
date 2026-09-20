from transformers import pipeline

texts = [
    "Congratulations! You have won Rs. 50,000. Click this link to claim your prize.",
    "Congratulations! You have won INR 50,000. Click this link immediately to claim your reward.",
    "Your bank account will be blocked today. Verify your KYC immediately using this link.",
    "You have received a cashback of Rs. 10,000. Claim it now.",
    "Hi, I'll be home around 7 PM.",
    "Your appointment is confirmed for tomorrow at 10 AM.",
    "Can you send me the project report when you get time?",
]

models = [
    "cybersectony/phishing-email-detection-distilbert_v2.4.1",
    "ealvaradob/bert-finetuned-phishing",
]

with open("model_eval.txt", "w", encoding="utf-8") as f:
    for mid in models:
        f.write(f"\n=== {mid} ===\n")
        try:
            clf = pipeline("text-classification", model=mid, top_k=None)
            for t in texts:
                out = clf(t)[0]
                f.write(f"{out} | {t}\n")
        except Exception as exc:
            f.write(f"ERROR {exc}\n")
