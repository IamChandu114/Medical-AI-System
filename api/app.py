from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import joblib
import os

# -----------------------------
# Base Directory
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# -----------------------------
# Load Models
# -----------------------------
diabetes_model = joblib.load(os.path.join(MODEL_DIR, "diabetes_model.pkl"))
heart_model = joblib.load(os.path.join(MODEL_DIR, "heart_model.pkl"))
kidney_model = joblib.load(os.path.join(MODEL_DIR, "kidney_model.pkl"))

# -----------------------------
# App
# -----------------------------
app = FastAPI(title="AI Smart Healthcare System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Schema
# -----------------------------
class PatientData(BaseModel):
    pregnancies: float
    glucose: float
    bloodPressure: float
    skinThickness: float
    insulin: float
    bmi: float
    dpf: float
    age: float

# -----------------------------
@app.get("/")
def home():
    return {"status": "AI Smart Healthcare API running 🚀"}

# -----------------------------
def explain_ai(data: PatientData):
    reasons = []
    if data.glucose > 140: reasons.append("High glucose level detected")
    if data.bmi > 30: reasons.append("High BMI (obesity risk)")
    if data.age > 45: reasons.append("Age is a significant risk factor")
    if data.bloodPressure > 90: reasons.append("Elevated blood pressure")
    if data.insulin > 150: reasons.append("Abnormal insulin level")
    if not reasons:
        reasons.append("All vital parameters are within normal range")
    return reasons

# -----------------------------
@app.post("/predict")
def predict(data: PatientData):

    features = np.array([[  
        data.pregnancies,
        data.glucose,
        data.bloodPressure,
        data.skinThickness,
        data.insulin,
        data.bmi,
        data.dpf,
        data.age
    ]])

    return {
        "diabetes": int(diabetes_model.predict(features)[0]),
        "heart": int(heart_model.predict(features)[0]),
        "kidney": int(kidney_model.predict(features)[0]),
        "liver": 0,
        "thyroid": 0,
        "explanation": explain_ai(data)
    }
