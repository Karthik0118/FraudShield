# Fraud Text Classification API

Prototype ML service for the real-time fraud detection project. It classifies a message as `FRAUD` or `NOT_FRAUD` using a pre-trained Hugging Face text classifier. This is only the **text fraud model** stage. Later stages (URL detection, risk engine, user alerts) can be added without rewriting the `/predict` API.

## Python version

Python 3.10 or newer.

## Selected model

**[`mariagrandury/distilbert-base-uncased-finetuned-sms-spam-detection`](https://huggingface.co/mariagrandury/distilbert-base-uncased-finetuned-sms-spam-detection)**

| Property | Value |
|---|---|
| Architecture | DistilBERT (`DistilBertForSequenceClassification`) |
| Size | ~67 million parameters (~260 MB weights) |
| Task | SMS spam vs ham |
| Labels | `LABEL_0` (ham) / `LABEL_1` (spam), mapped to `NOT_FRAUD` / `FRAUD` |
| Input | Raw English text string |
| Output | Softmax probabilities over two classes |
| License | Apache 2.0 |
| Dataset | Hugging Face `sms_spam` (UCI SMS Spam Collection style) |

A smaller BERT-tiny SMS model was considered first, but it missed Indian prize/KYC phrasing. DistilBERT stays fast on CPU while handling those prototype examples more reliably.

### Why this model

- Still lightweight enough for real-time CPU inference (typically tens of milliseconds after warmup).
- Fine-tuned on SMS text, which matches the message-classification use case better than a generic sentiment model.
- Apache 2.0, safetensors, and compatible with `transformers` + PyTorch.
- Easy to replace later via `HF_MODEL_ID` when an in-house fraud model is trained.

### Known limitations

- This is a **spam/ham** model, not a dedicated Indian UPI/KYC/bank-fraud classifier.
- Training data is mostly English SMS (lottery/prize/call-now patterns). Regional language and some local scam templates may still be weaker.
- Spam is not the same as fraud: promotional SMS can score high; some sophisticated scam wording can score low.
- Accuracy is a prototype baseline, not production-grade fraud detection.
- Text-only: URLs, sender ID, and device signals are out of scope until later pipeline stages.

## Installation

From this directory:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

macOS / Linux:

```bash
source venv/bin/activate
```

```bash
pip install -r requirements.txt
```

Copy environment defaults:

```bash
copy .env.example .env
```

On macOS / Linux use `cp .env.example .env`.

## Model download / loading

The tokenizer and model download from the Hugging Face Hub **once**, on application startup, then stay in memory:

```text
Application starts
       ↓
Load tokenizer
       ↓
Load model
       ↓
Keep model in memory
       ↓
Wait for requests
```

The first start needs network access. Later starts reuse the local Hugging Face cache.

## Start the server

```bash
uvicorn app.main:app --reload
```

Open interactive docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

Health check: `GET /health`.

## API endpoint

`POST /predict`

### Example request

```json
{
  "text": "Congratulations! You have won Rs. 50,000. Click this link to claim your prize."
}
```

```bash
curl -X POST http://127.0.0.1:8000/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Congratulations! You have won Rs. 50,000. Click this link to claim your prize.\"}"
```

### Example response

```json
{
  "prediction": "FRAUD",
  "fraud_probability": 0.96,
  "confidence": 0.96,
  "inference_time_ms": 12.4,
  "model_id": "mariagrandury/distilbert-base-uncased-finetuned-sms-spam-detection"
}
```

Legitimate messages return `"prediction": "NOT_FRAUD"` and a low `fraud_probability`.

Invalid input (empty, missing, whitespace-only, non-string, or over `MAX_TEXT_LENGTH`) returns HTTP 422, for example:

```json
{
  "detail": "Text message cannot be empty."
}
```

## Threshold configuration

Set in `.env` (or the process environment):

```text
FRAUD_THRESHOLD=0.5
```

Rule:

```text
fraud_probability >= FRAUD_THRESHOLD  →  FRAUD
fraud_probability <  FRAUD_THRESHOLD  →  NOT_FRAUD
```

Do not scatter the cutoff in application code. Change only this variable when tuning.

## Tests

```bash
pytest -q
```

## Pipeline fit

```text
Incoming Message
       ↓
Text Fraud Model   ← this service
       ↓
URL Detection      ← later
       ↓
Risk Engine        ← later
       ↓
User Alert
```

Swap the backbone later by changing `HF_MODEL_ID` or replacing `TextFraudClassifier` in `app/model.py`. FastAPI routes stay the same.
