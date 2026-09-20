import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import FRAUD_THRESHOLD, MAX_TEXT_LENGTH, MODEL_ID
from app.model import classifier
from app.schemas import PredictRequest, PredictResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("fraud.api")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Starting application. Loading text fraud model once into memory.")
    classifier.load()
    yield
    logger.info("Shutting down text fraud service.")


app = FastAPI(
    title="Fraud Text Classification API",
    description=(
        "Prototype ML service that classifies a message as FRAUD or NOT_FRAUD. "
        "This is the first stage of a larger pipeline (text model → URL detection → risk engine)."
    ),
    version="0.1.0",
    lifespan=lifespan,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc: RequestValidationError):
    for error in exc.errors():
        loc = error.get("loc", [])
        err_type = error.get("type", "")
        if "text" in loc:
            if err_type == "missing":
                return JSONResponse(status_code=422, content={"detail": "Text message is required."})
            if err_type == "string_type":
                return JSONResponse(status_code=422, content={"detail": "Text message must be a string."})
    return JSONResponse(status_code=422, content={"detail": "Invalid request payload."})


def validate_text(text: object) -> str:
    if not isinstance(text, str):
        raise HTTPException(status_code=422, detail="Text message must be a string.")
    if not text or not text.strip():
        raise HTTPException(status_code=422, detail="Text message cannot be empty.")
    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Text message exceeds the maximum length of {MAX_TEXT_LENGTH} characters.",
        )
    return text.strip()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": classifier.is_ready(),
        "model_id": MODEL_ID,
        "fraud_threshold": FRAUD_THRESHOLD,
    }


@app.post("/predict", response_model=PredictResponse, tags=["classification"])
def predict(payload: PredictRequest) -> PredictResponse:
    text = validate_text(payload.text)
    result = classifier.predict(text)
    return PredictResponse(
        prediction=result.prediction,
        fraud_probability=result.fraud_probability,
        confidence=result.confidence,
        inference_time_ms=result.inference_time_ms,
        model_id=result.model_id,
    )
