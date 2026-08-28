from typing import Literal

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    text: str = Field(..., description="Raw message text to classify.")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": (
                        "Congratulations! You have won Rs. 50,000. "
                        "Click this link to claim your prize."
                    )
                }
            ]
        }
    }


class PredictResponse(BaseModel):
    prediction: Literal["FRAUD", "NOT_FRAUD"]
    fraud_probability: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Raw softmax probability of the predicted class.",
    )
    inference_time_ms: float = Field(..., description="Model inference time in milliseconds.")
    model_id: str = Field(..., description="Hugging Face model currently in use.")
