from flask import Flask, request, jsonify
import os
import json
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import math
import requests
import traceback
from flask_cors import CORS
# fpdf is optional (used only if/when PDF export is implemented).
try:
    from fpdf import FPDF  # type: ignore
except Exception:
    FPDF = None

# xgboost is only required for the /pipeline training endpoint.
# /predict can run without it, so we make it optional to improve local setup reliability.
try:
    import xgboost as xgb  # type: ignore
except Exception:
    xgb = None

# -------------------------------
# Setup folders
# -------------------------------
RAW_DIR = "data/raw"
PROCESSED_DIR = "data/processed"
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# -------------------------------
# Flask app
# -------------------------------
app = Flask(__name__)
# Allow the Next.js frontend (default: http://localhost:3000) to call this API
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# -------------------------------
# Basic routes
# -------------------------------
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "Solar Prediction API is running.",
        "endpoints": ["/predict", "/pipeline"]
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# -------------------------------
# Helper functions
# -------------------------------
def is_valid_date(date_str):
    try:
        datetime.strptime(date_str, "%Y%m%d")
        return True
    except ValueError:
        return False

def fetch_power_data(latitude, longitude, start, end, parameters, user="kirtan", community="AG",
                     site_elevation=None, wind_elevation=None, wind_surface=None):
    base_url = "https://power.larc.nasa.gov/api/temporal/hourly/point"
    query = {
        "start": start,
        "end": end,
        "latitude": latitude,
        "longitude": longitude,
        "community": community.upper(),
        "parameters": parameters,
        "format": "JSON",
        "units": "METRIC",
        "user": user,
        "header": "true",
        "time-standard": "LST"
    }

    if "WSC" in parameters.split(","):
        if site_elevation is None or wind_elevation is None or wind_surface is None:
            raise ValueError("WSC requested but site-elevation, wind-elevation, or wind-surface not provided.")
        query["site-elevation"] = site_elevation
        query["wind-elevation"] = wind_elevation
        query["wind-surface"] = wind_surface

    response = requests.get(base_url, params=query)
    if response.status_code == 200:
        return response.json()
    else:
        raise ValueError(f"❌ Error fetching data: {response.status_code} {response.text}")

def fetch_daily_wsc(latitude, longitude, start, end, site_elevation, wind_elevation, wind_surface):
    """Fetch daily WSC data from NASA POWER."""
    base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "start": start,
        "end": end,
        "latitude": latitude,
        "longitude": longitude,
        "community": "AG",
        "parameters": "WSC",
        "format": "JSON",
        "units": "METRIC",
        "time-standard": "LST",
        "site-elevation": site_elevation,
        "wind-elevation": wind_elevation,
        "wind-surface": wind_surface
    }
    r = requests.get(base_url, params=params)
    if r.status_code == 200:
        return r.json()
    else:
        raise ValueError(f"❌ Error fetching daily WSC: {r.status_code} {r.text}")

def save_raw_json(data, filename):
    path = os.path.join(RAW_DIR, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=4)
    print(f"📥 Saved raw JSON → {path}")

def convert_to_csv(data, filename):
    parameters = data.get("properties", {}).get("parameter", {})
    if not parameters:
        raise ValueError("❌ No parameter data found.")

    dfs = []
    for param, values in parameters.items():
        df = pd.DataFrame(values.items(), columns=["datetime", param])
        dfs.append(df.set_index("datetime"))

    final_df = pd.concat(dfs, axis=1).reset_index()
    path = os.path.join(PROCESSED_DIR, filename)
    final_df.to_csv(path, index=False)
    print(f"✅ Saved processed CSV → {path}")
    return path

def merge_wsc_with_csv(hourly_csv_path, wsc_json):
    """Merge daily WSC data into the latest hourly CSV."""
    df_hourly = pd.read_csv(hourly_csv_path)
    df_hourly["datetime"] = pd.to_datetime(df_hourly["datetime"].astype(str), format="%Y%m%d%H")
    
    # Extract WSC daily data
    wsc_dict = wsc_json.get("properties", {}).get("parameter", {}).get("WSC", {})
    df_wsc = pd.DataFrame(list(wsc_dict.items()), columns=["date", "WSC_daily"])
    df_wsc["date"] = pd.to_datetime(df_wsc["date"], format="%Y%m%d")

    # Merge: assign daily WSC to each hour
    df_hourly["date"] = df_hourly["datetime"].dt.date
    df_wsc["date"] = df_wsc["date"].dt.date
    df_merged = df_hourly.merge(df_wsc, on="date", how="left")
    df_merged.drop(columns=["date"], inplace=True)

    merged_csv = hourly_csv_path.replace(".csv", "_merged.csv")
    df_merged.to_csv(merged_csv, index=False)
    print(f"✅ Merged hourly CSV with WSC → {merged_csv}")
    return merged_csv

from datetime import datetime, timedelta
import pandas as pd
import requests

def fetch_openmeteo_in_chunks(lat, lon, start_date, end_date, chunk_days=3):
    all_chunks = []
    base_url = "https://api.open-meteo.com/v1/forecast"

    # Ensure datetimes
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, "%Y-%m-%d")

    while start_date < end_date:
        chunk_start = start_date
        chunk_end = min(start_date + timedelta(days=chunk_days-1), end_date)

        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": chunk_start.strftime("%Y-%m-%d"),
            "end_date": chunk_end.strftime("%Y-%m-%d"),
            "hourly": "shortwave_radiation,temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover",
            "timezone": "UTC"
        }

        try:
            resp = requests.get(base_url, params=params)
            resp.raise_for_status()
            data = resp.json()

            df = pd.DataFrame(data["hourly"])
            all_chunks.append(df)

        except Exception as e:
            print(f"⚠️ Error fetching {chunk_start} → {chunk_end}: {e}")

        start_date += timedelta(days=chunk_days)

    if all_chunks:
        df = pd.concat(all_chunks, ignore_index=True)
        df["datetime"] = pd.to_datetime(df["time"])
        return df
    else:
        return pd.DataFrame()
    
# -------------------------------
# Flask route
# -------------------------------
@app.route("/pipeline", methods=["POST"])
def pipeline():
    try:
        if xgb is None:
            return jsonify({
                "error": "xgboost is not installed. Install backend dependencies with: pip install -r requirements.txt"
            }), 500
        data = request.json
        lat = float(data.get("lat"))
        lon = float(data.get("lon"))
        start = data.get("start")
        end = data.get("end")
        params = data.get("parameters", "")
        site_elev = data.get("site_elevation")
        wind_elev = data.get("wind_elevation")
        wind_surf = data.get("wind_surface")

        # ---------- Fetch hourly ----------
        # ---------- Split hourly params from WSC ----------
        hourly_params_list = [p for p in params.split(",") if p != "WSC"]
        hourly_params = ",".join(hourly_params_list)

        fetched_data = fetch_power_data(
            latitude=lat,
            longitude=lon,
            start=start,
            end=end,
            parameters=hourly_params,
            site_elevation=site_elev,
            wind_elevation=wind_elev,
            wind_surface=wind_surf
        )

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        raw_file = f"power_raw_{timestamp}.json"
        csv_file = f"power_processed_{timestamp}.csv"

        save_raw_json(fetched_data, raw_file)
        hourly_csv_path = convert_to_csv(fetched_data, csv_file)

        # ---------- Fetch daily WSC & merge ----------
        if "WSC" in params.split(","):
            wsc_json = fetch_daily_wsc(lat, lon, start, end, site_elev, wind_elev, wind_surf)
            merged_csv_path = merge_wsc_with_csv(hourly_csv_path, wsc_json)
        else:
            merged_csv_path = hourly_csv_path

        # ---------- Train ----------
        PANEL_AREA = float(data.get("area", 10.0))
        EFFICIENCY = float(data.get("efficiency", 0.18))
        LOSS_FACTOR = float(data.get("loss_factor", 0.8))
        TILT = float(data.get("tilt", 20.0))
        AZIMUTH = float(data.get("azimuth", 180.0))

        df = pd.read_csv(merged_csv_path)

        # ---------- Fix datetime ----------
        if "datetime" in df.columns:
            df["datetime"] = pd.to_datetime(df["datetime"].astype(str), format="%Y%m%d%H")
        else:
            raise ValueError("❌ Input CSV must have a 'datetime' column in YYYYMMDDHH format.")

        # Feature engineering
        df["ALLSKY_SFC_SW_DWN_kWh"] = df["ALLSKY_SFC_SW_DWN"] / 1000.0
        df["energy_kWh"] = df["ALLSKY_SFC_SW_DWN_kWh"] * PANEL_AREA * EFFICIENCY * LOSS_FACTOR
        df["month"] = df["datetime"].dt.month
        df["hour"] = df["datetime"].dt.hour
        df["lat"] = float(lat)
        df["lon"] = float (lon)
        df["tilt"] = TILT
        df["azimuth"] = AZIMUTH
        df["area"] = PANEL_AREA

        feature_cols = [
            "ALLSKY_SFC_SW_DWN_kWh",
            "T2M", "RH2M", "CLRSKY_KT", "WS2M",
        ]

        if "WSC" in params.split(","):
            feature_cols.append("WSC_daily")

        feature_cols += ["month", "hour", "lat", "lon", "tilt", "azimuth", "area"
        ]

        X = df[feature_cols]
        y = df["energy_kWh"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = xgb.XGBRegressor(
            n_estimators=300, learning_rate=0.05, max_depth=6,
            subsample=0.8, colsample_bytree=0.8, random_state=42
        )
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        rmse = math.sqrt(mean_squared_error(y_test, preds))

        # Add-on: compute MAPE + error breakdowns
        mape = float(np.mean(np.abs((y_test - preds) / np.clip(y_test, 1e-6, None))) * 100)

        df_eval = X_test.copy()
        df_eval["energy_kWh"] = y_test.values
        df_eval["predicted_energy_kWh"] = preds

        extra_metrics = {"mae": mae, "rmse": rmse, "mape": mape}


        MODEL_PATH = "solar_model.joblib"
        joblib.dump({
            "model": model,
            "features": feature_cols,
            "panel_config": {
                "area": PANEL_AREA,
                "efficiency": EFFICIENCY,
                "loss_factor": LOSS_FACTOR,
                "tilt": TILT,
                "azimuth": AZIMUTH,
                "lat": lat,
                "lon": lon
            }
        }, MODEL_PATH)

        # ---------- Predict ----------
        df.replace(-999.0, pd.NA, inplace=True)
        df.dropna(inplace=True)

        df["ALLSKY_SFC_SW_DWN_kWh"] = df["ALLSKY_SFC_SW_DWN"] / 1000.0
        df["month"] = df["datetime"].dt.month
        df["hour"] = df["datetime"].dt.hour
        df["lat"] = lat
        df["lon"] = lon
        df["tilt"] = TILT
        df["azimuth"] = AZIMUTH
        df["area"] = PANEL_AREA

        X_pred = df[feature_cols].copy()
        for col in X_pred.select_dtypes(include='object').columns:
            X_pred[col] = pd.to_numeric(X_pred[col], errors='coerce')
        X_pred.fillna(0, inplace=True)
        X_pred = X_pred.astype(float)

        df["predicted_energy_kWh"] = model.predict(X_pred)
        
        hourly_out = os.path.join(PROCESSED_DIR, f"predictions_hourly_{timestamp}.csv")
        df[["datetime", "predicted_energy_kWh"]].to_csv(hourly_out, index=False)

        daily_out  = os.path.join(PROCESSED_DIR, f"predictions_daily_{timestamp}.csv")
        df_out = df[["datetime", "predicted_energy_kWh"]].set_index("datetime").resample("D").sum().reset_index()
        df_out.to_csv(daily_out, index=False)


        return jsonify({
            "message": "✅ Pipeline completed successfully",
            "mae": mae,
            "rmse": rmse,
            "hourly_csv": hourly_out,
            "daily_csv": daily_out
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
import pytz
from dateutil.relativedelta import relativedelta

def fetch_openmeteo_in_chunks(lat, lon, start_date, end_date, chunk_days=3):
    import requests

    url = "https://archive-api.open-meteo.com/v1/archive"
    all_chunks = []

    current_start = start_date
    while current_start < end_date:
        current_end = min(current_start + pd.Timedelta(days=chunk_days-1), end_date)

        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": current_start.strftime("%Y-%m-%d"),
            "end_date": current_end.strftime("%Y-%m-%d"),
            "hourly": ["temperature_2m", "relative_humidity_2m", "cloud_cover", "wind_speed_10m"],
            "timezone": "auto"
        }
        r = requests.get(url, params=params)
        if r.status_code != 200:
            raise ValueError(f"Open-Meteo error {r.status_code}: {r.text}")
        data = r.json()

        # Convert to DataFrame
        times = pd.to_datetime(data["hourly"]["time"])
        df_chunk = pd.DataFrame({
            "datetime": times,
            "T2M": data["hourly"]["temperature_2m"],
            "RH2M": data["hourly"]["relative_humidity_2m"],
            "CLRSKY_KT": data["hourly"]["cloud_cover"],   # proxy
            "WS2M": data["hourly"]["wind_speed_10m"]
        })
        all_chunks.append(df_chunk)

        current_start = current_end + pd.Timedelta(days=1)

    df = pd.concat(all_chunks).reset_index(drop=True)
    return df

# -------------------------------
# New: /predict endpoint + helpers
# -------------------------------
from datetime import timezone, timedelta

# pysolar is optional; if unavailable we use a built-in solar position approximation (NOAA-based).
try:
    from pysolar.solar import get_altitude, get_azimuth  # type: ignore
except Exception:
    def _to_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    def _solar_declination_and_eqtime(dt_utc: datetime):
        """Return (declination_rad, equation_of_time_min) using NOAA approximation."""
        dt_utc = _to_utc(dt_utc)
        n = dt_utc.timetuple().tm_yday
        hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        gamma = 2.0 * math.pi / 365.0 * (n - 1 + (hour - 12.0) / 24.0)

        eqtime = 229.18 * (
            0.000075
            + 0.001868 * math.cos(gamma)
            - 0.032077 * math.sin(gamma)
            - 0.014615 * math.cos(2 * gamma)
            - 0.040849 * math.sin(2 * gamma)
        )

        decl = (
            0.006918
            - 0.399912 * math.cos(gamma)
            + 0.070257 * math.sin(gamma)
            - 0.006758 * math.cos(2 * gamma)
            + 0.000907 * math.sin(2 * gamma)
            - 0.002697 * math.cos(3 * gamma)
            + 0.00148 * math.sin(3 * gamma)
        )
        return decl, eqtime

    def get_altitude(latitude_deg: float, longitude_deg: float, when: datetime) -> float:
        """Approximate solar altitude angle (degrees above horizon)."""
        when_utc = _to_utc(when)
        decl, eqtime = _solar_declination_and_eqtime(when_utc)

        # True solar time (minutes)
        minutes = when_utc.hour * 60.0 + when_utc.minute + when_utc.second / 60.0
        time_offset = eqtime + 4.0 * longitude_deg  # timezone offset is 0 for UTC
        tst = (minutes + time_offset) % 1440.0

        # Hour angle (degrees)
        ha = tst / 4.0 - 180.0
        if ha < -180.0:
            ha += 360.0
        ha_rad = math.radians(ha)

        lat_rad = math.radians(latitude_deg)
        cos_zenith = math.sin(lat_rad) * math.sin(decl) + math.cos(lat_rad) * math.cos(decl) * math.cos(ha_rad)
        cos_zenith = max(min(cos_zenith, 1.0), -1.0)
        zenith = math.acos(cos_zenith)
        altitude = 90.0 - math.degrees(zenith)
        return altitude

    def get_azimuth(latitude_deg: float, longitude_deg: float, when: datetime) -> float:
        """Approximate solar azimuth (degrees; 0=N, 90=E, 180=S, 270=W)."""
        when_utc = _to_utc(when)
        decl, eqtime = _solar_declination_and_eqtime(when_utc)

        minutes = when_utc.hour * 60.0 + when_utc.minute + when_utc.second / 60.0
        time_offset = eqtime + 4.0 * longitude_deg
        tst = (minutes + time_offset) % 1440.0

        ha = tst / 4.0 - 180.0
        if ha < -180.0:
            ha += 360.0
        ha_rad = math.radians(ha)

        lat_rad = math.radians(latitude_deg)
        # NOAA-style azimuth formula (shifted to [0, 360))
        az_rad = math.atan2(
            math.sin(ha_rad),
            math.cos(ha_rad) * math.sin(lat_rad) - math.tan(decl) * math.cos(lat_rad),
        ) + math.pi
        az_deg = (math.degrees(az_rad) + 360.0) % 360.0
        return az_deg

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def _coerce_number(v, default=None, cast=float):
    """Coerce string or numeric to a number; return default if not possible."""
    if v is None:
        return default
    try:
        return cast(v)
    except Exception:
        try:
            # try stripping and re-casting
            return cast(str(v).strip())
        except Exception:
            return default

def parse_user_request(payload):
    """Accepts a flexible payload from frontend and returns normalized params."""
    # location
    lat = _coerce_number(payload.get("lat") or payload.get("latitude") or payload.get("lat_deg"), None)
    lon = _coerce_number(payload.get("lon") or payload.get("longitude") or payload.get("lon_deg"), None)

    # panel config (required)
    area = _coerce_number(payload.get("area") or payload.get("panel_area") or payload.get("area_m2"), 10.0)
    tilt = _coerce_number(payload.get("tilt") or payload.get("panel_tilt"), 20.0)
    azimuth = _coerce_number(payload.get("azimuth") or payload.get("panel_azimuth"), 180.0)
    efficiency = _coerce_number(payload.get("efficiency") or payload.get("panel_efficiency"), 0.18)
    degradation = _coerce_number(payload.get("degradation") or payload.get("degrade"), 0.0)
    loss_factor = _coerce_number(payload.get("loss_factor") or payload.get("loss"), 0.8)

    # time window - optional; defaults: next 48 hours forecast
    start = payload.get("start")  # expects YYYYMMDD or ISO date
    end = payload.get("end")

    # azimuth recommendation search bounds and step (optional override)
    az_min = int(_coerce_number(payload.get("az_min"), 90))
    az_max = int(_coerce_number(payload.get("az_max"), 270))
    az_step = int(_coerce_number(payload.get("az_step"), 5))

    return {
        "lat": lat, "lon": lon,
        "area": area, "tilt": tilt, "azimuth": azimuth,
        "efficiency": efficiency, "degradation": degradation, "loss_factor": loss_factor,
        "start": start, "end": end,
        "az_range": list(range(az_min, az_max + 1, az_step))
    }

def fetch_hourly_ghi_open_meteo(lat, lon, hours=48, start_iso=None, end_iso=None):
    """Fetch hourly shortwave_radiation (GHI approx) from Open-Meteo.
    If start_iso/end_iso provided (ISO strings), use them, otherwise use next `hours` hours.
    Returns pandas DataFrame with columns: time (UTC ISO), ghi (W/m2)
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "shortwave_radiation,temperature_2m,relativehumidity_2m,wind_speed_10m,cloudcover",
        "timezone": "UTC"
    }
    if start_iso and end_iso:
        params["start_date"] = start_iso.split("T")[0]
        params["end_date"] = end_iso.split("T")[0]
    r = requests.get(OPEN_METEO_URL, params=params, timeout=30)
    r.raise_for_status()
    data = r.json().get("hourly", {})
    if not data or "time" not in data:
        raise ValueError("No forecast data returned from Open-Meteo.")
    df = pd.DataFrame({
        "time": data["time"],
        "shortwave_radiation": data.get("shortwave_radiation", [0]*len(data["time"])),
        "temperature_2m": data.get("temperature_2m", [None]*len(data["time"])),
        "relativehumidity_2m": data.get("relativehumidity_2m", [None]*len(data["time"])),
        "wind_speed_10m": data.get("wind_speed_10m", [None]*len(data["time"])),
        "cloudcover": data.get("cloudcover", [None]*len(data["time"]))
    })
    # keep only requested rows (if start_iso/end_iso provided they will match)
    return df

def compute_incidence_angle_deg(sun_alt_deg, sun_az_deg, panel_tilt_deg, panel_az_deg):
    """Return incidence angle in degrees between sun vector and panel normal.
       Formula:
       cos(theta) = sin(alt)*cos(tilt) + cos(alt)*sin(tilt)*cos(sun_az - panel_az)
    """
    # convert to radians
    alt = math.radians(sun_alt_deg)
    saz = math.radians(sun_az_deg)
    tilt = math.radians(panel_tilt_deg)
    paz = math.radians(panel_az_deg)
    cos_theta = math.sin(alt) * math.cos(tilt) + math.cos(alt) * math.sin(tilt) * math.cos(saz - paz)
    # clamp
    cos_theta = max(min(cos_theta, 1.0), -1.0)
    theta = math.degrees(math.acos(cos_theta)) if cos_theta >= -1.0 and cos_theta <= 1.0 else 90.0
    return theta

def compute_hourly_power_from_ghi(ghi_wm2, incidence_deg, area_m2, efficiency, loss_factor, degradation):
    """Compute power (W) on plane-of-array using a simple model:
       POA ≈ GHI * cos(incidence)  (if sun below horizon, POA=0)
       power_W = POA * area * efficiency * loss_factor * (1 - degradation)
    """
    # if sun below horizon or incidence angle >90 -> no power
    if ghi_wm2 is None:
        ghi_wm2 = 0.0
    cos_inc = math.cos(math.radians(incidence_deg))
    poa = ghi_wm2 * max(cos_inc, 0.0)
    power_w = poa * area_m2 * efficiency * loss_factor * max(0.0, (1.0 - degradation))
    return power_w

def evaluate_azimuth_energy(df_forecast, lat, lon, area, tilt, azimuth, efficiency, loss_factor, degradation):
    """Given forecast df (with df['time']), compute hourly energy using sun position and incidence model.
       Returns series of hourly energy_kWh and total_kWh.
    """
    energies = []
    times = []
    for t_iso, ghi in zip(df_forecast["time"], df_forecast["shortwave_radiation"]):
        # parse as UTC aware datetime
        dt = datetime.fromisoformat(t_iso.replace("Z", "+00:00")).astimezone(timezone.utc)
        # pysolar expects UTC naive or tz-aware? We pass tz-aware UTC datetime
        sun_alt = get_altitude(lat, lon, dt)
        sun_az = get_azimuth(lat, lon, dt)
        if sun_alt <= 0:
            # night
            energies.append(0.0)
        else:
            inc = compute_incidence_angle_deg(sun_alt, sun_az, tilt, azimuth)
            p_w = compute_hourly_power_from_ghi(ghi, inc, area, efficiency, loss_factor, degradation)
            energies.append(p_w / 1000.0)  # convert W->kW (for hourly kWh approximated as kW for 1 hour)
        times.append(dt.isoformat())
    series = pd.DataFrame({"time_utc": times, "ghi_wm2": df_forecast["shortwave_radiation"].tolist(), "energy_kWh": energies})
    total_kwh = float(series["energy_kWh"].sum())
    return series, total_kwh

@app.route("/predict", methods=["POST"])
def predict_endpoint():
    """Predict hourly & daily energy and recommend azimuth. Accepts flexible input formats for frontend."""
    try:
        payload = request.get_json(force=True)
        p = parse_user_request(payload)
        if p["lat"] is None or p["lon"] is None:
            return jsonify({"error": "latitude/longitude required (lat, lon)"}), 400

        # fetch forecast (next 48 hours by default)
        df_fore = fetch_hourly_ghi_open_meteo(p["lat"], p["lon"])

        # restrict horizon if start/end provided (optional)
        # (User can supply start/end as ISO strings; for simplicity we ignore here if not provided)

        # compute for current user azimuth
        series_user, total_user = evaluate_azimuth_energy(
            df_fore, p["lat"], p["lon"],
            p["area"], p["tilt"], p["azimuth"],
            p["efficiency"], p["loss_factor"], p["degradation"]
        )

        # grid search for best azimuth (tilt fixed)
        best = {"azimuth": p["azimuth"], "total_kwh": total_user}
        for az in p["az_range"]:
            ser, tot = evaluate_azimuth_energy(
                df_fore, p["lat"], p["lon"], p["area"], p["tilt"], az,
                p["efficiency"], p["loss_factor"], p["degradation"]
            )
            if tot > best["total_kwh"]:
                best = {"azimuth": az, "total_kwh": tot, "series": ser}

        # if best series not stored, compute it
        if "series" not in best:
            best["series"], best["total_kwh"] = evaluate_azimuth_energy(
                df_fore, p["lat"], p["lon"], p["area"], p["tilt"], best["azimuth"],
                p["efficiency"], p["loss_factor"], p["degradation"]
            )

        uplift_pct = (best["total_kwh"] - total_user) / total_user * 100.0 if total_user > 0 else 0.0

        # save CSV & JSON
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        user_csv = os.path.join(PROCESSED_DIR, f"predict_user_{ts}.csv")
        best_csv = os.path.join(PROCESSED_DIR, f"predict_best_{ts}.csv")
        series_user.to_csv(user_csv, index=False)
        best["series"].to_csv(best_csv, index=False)

        user_json = os.path.join(PROCESSED_DIR, f"predict_user_{ts}.json")
        best_json = os.path.join(PROCESSED_DIR, f"predict_best_{ts}.json")
        series_user.to_json(user_json, orient="records", indent=2)
        best["series"].to_json(best_json, orient="records", indent=2)

        # return structured response
        return jsonify({
            "message": "✅ Prediction complete",
            "input": {
                "lat": p["lat"], "lon": p["lon"],
                "tilt": p["tilt"], "azimuth": p["azimuth"],
                "area": p["area"], "efficiency": p["efficiency"]
            },
            "results": {
                "user_total_kwh": total_user,
                "best_azimuth": best["azimuth"],
                "best_total_kwh": best["total_kwh"],
                "uplift_percent": uplift_pct
            },
            "horizon_hours": int(len(series_user)),
            # Include the computed hourly series so the frontend can render real charts without reading files.
            "series": {
                "user": series_user.to_dict(orient="records"),
                "best": best["series"].to_dict(orient="records"),
            },
            "files": {
                "user_csv": user_csv,
                "best_csv": best_csv,
                "user_json": user_json,
                "best_json": best_json,
            }
        })

    except Exception as e:
        tb = traceback.format_exc()
        return jsonify({"error": str(e), "trace": tb}), 500
# -------------------------------
# Run Flask
# ------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Use Render's PORT, fallback to 5000 locally
    app.run(host="0.0.0.0", port=port, debug=True)
