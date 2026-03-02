# Solar Prediction Backend (Flask)

This repository contains the backend API for predicting solar power generation using NASA POWER, Open-Meteo, and a custom XGBoost model. It supports both historical hourly/daily data processing and forecast predictions with azimuth optimization.

---

## Features

* Compute hourly & daily energy generation for a solar panel.
* Support azimuth optimization to find the best panel orientation.
* Return structured JSON and CSV outputs for frontend integration.
* Train and store XGBoost regression model for energy prediction.
* Handles flexible frontend input formats (lat/lon, panel config, optional start/end dates).

---

## Technical Capabilities

* Fetches historical and forecast data automatically.
* Preprocesses and merges hourly & daily datasets (NASA + Open-Meteo).
* Builds feature-rich training sets with \~14 parameters.
* Trains an XGBoost regression model for energy prediction.
* Integrates a physics-based correction (tilt, azimuth, incidence angle).
* Provides 48h–3 month forecasts of solar energy (hourly & daily).
* Recommends optimal azimuth via grid search and shows uplift %.
* Exposes all functionality via REST endpoints (`/pipeline`, `/predict`).

---

## Folder Structure

```
solar-power-prediction/
└── src/
    ├── __pycache__/        # Python cache files
    ├── app.py              # Main Flask backend
    ├── data/
    │   ├── raw/            # Raw JSON responses from APIs
    │   └── processed/      # Processed CSVs & predictions
    └── requirements.txt    # Python dependencies
```

---

## Installation

Run the following in the `src/` directory to install dependencies:

```bash
pip install -r requirements.txt
```

---

## Sample Payload to Train & Predict

You can run both the pipeline (training) and prediction using `curl`:

```bash
curl -X POST http://127.0.0.1:5000/pipeline \
-H "Content-Type: application/json" \
-d '{
  "lat": 23.0225,
  "lon": 72.5714,
  "start": "20250901",
  "end": "20250907",
  "parameters": "ALLSKY_SFC_SW_DWN,T2M,RH2M,CLRSKY_KT,WS2M",
  "site_elevation": 50,
  "wind_elevation": 10,
  "wind_surface": 2
}' \
&& \
curl -X POST http://127.0.0.1:5000/predict \
-H "Content-Type: application/json" \
-d '{
  "lat": 23.0225,
  "lon": 72.5714,
  "area": 10.0,
  "tilt": 20.0,
  "azimuth": 180.0,
  "efficiency": 0.18,
  "loss_factor": 0.8,
  "degradation": 0.0
}'
```

---

## Sample Output

```json
{
  "daily_csv": "predictions_daily_20250914_105031.csv",
  "hourly_csv": "predictions_hourly_20250914_105031.csv",
  "mae": 9.002685485981488e-09,
  "message": "✅ Pipeline completed successfully",
  "rmse": 9.002685485981488e-09
}
```

---

### Output Files

* `predict_user_<timestamp>.csv/.json` – Predicted hourly energy for the user-specified azimuth.
* `predict_best_<timestamp>.csv/.json` – Predicted hourly energy for the azimuth with maximum total kWh.
