
import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import cv2
import numpy as np
import tensorflow_hub as hub
import tf_keras as keras

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Dog vs Cat Classifier API")

# Allow requests from the frontend during local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "dog_cat_model.h5"
)

model = keras.models.load_model(
    MODEL_PATH,
    custom_objects={"KerasLayer": hub.KerasLayer},
    compile=False,
)

CLASS_NAMES = ["Cat", "Dog"]


@app.get("/")
def home():
    return {"message": "Dog vs Cat Classifier API is running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image.")

    contents = await file.read()
    image_array = np.frombuffer(contents, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    image = cv2.resize(image, (224, 224))
    image = image.astype(np.float32) / 255.0
    image = np.expand_dims(image, axis=0)

    predictions = model.predict(image, verbose=0)[0]

    # The model outputs two logits, so convert them to probabilities.
    exp_predictions = np.exp(
        predictions - np.max(predictions)
    )
    probabilities = exp_predictions / np.sum(exp_predictions)

    predicted_index = int(np.argmax(probabilities))

    return {
        "prediction": CLASS_NAMES[predicted_index],
        "confidence": round(float(probabilities[predicted_index]) * 100, 2),
        "probabilities": {
            "Cat": round(float(probabilities[0]) * 100, 2),
            "Dog": round(float(probabilities[1]) * 100, 2),
        },
    }
