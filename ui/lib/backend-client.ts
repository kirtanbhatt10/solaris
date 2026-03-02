export interface BackendPredictRequest {
  lat: number
  lon: number
  area: number
  tilt: number
  azimuth: number
  efficiency: number
  loss_factor: number
  degradation: number
}

export interface BackendPredictResponse {
  message: string
  input: {
    lat: number
    lon: number
    tilt: number
    azimuth: number
    area: number
    efficiency: number
  }
  results: {
    user_total_kwh: number
    best_azimuth: number
    best_total_kwh: number
    uplift_percent: number
  }
  horizon_hours: number
  series: {
    user: Array<{ time_utc: string; ghi_wm2: number; energy_kWh: number }>
    best: Array<{ time_utc: string; ghi_wm2: number; energy_kWh: number }>
  }
  files: {
    user_csv: string
    best_csv: string
    user_json: string
    best_json: string
  }
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : "http://127.0.0.1:5000"

export async function callPredictEndpoint(payload: BackendPredictRequest): Promise<BackendPredictResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let detail = ""
    try {
      const data = await res.json()
      detail = data.error || JSON.stringify(data)
    } catch {
      detail = await res.text()
    }
    throw new Error(`Backend /predict error (${res.status}): ${detail}`)
  }

  return (await res.json()) as BackendPredictResponse
}

