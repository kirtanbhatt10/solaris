// Mock AI service for solar power prediction
// This provides the hollow structure that can later integrate with trained ML models

export interface LocationData {
  latitude: number
  longitude: number
  city?: string
  country?: string
  elevation?: number // meters above sea level
}

export interface PanelConfiguration {
  surfaceArea: number // in square meters
  tiltAngle: number // in degrees
  azimuthAngle: number // in degrees (0 = north, 90 = east, 180 = south, 270 = west)
  efficiency: number // panel efficiency percentage (legacy, kept for compatibility)
  panelEfficiency: number // panel efficiency percentage
  lossFactor: number // system losses percentage
  degradation: number // annual degradation percentage

  // Extra fields used across UI screens (kept here so components share one config shape)
  installationType: "roof" | "ground" | "carport"
  startDate?: string
  endDate?: string
  customParameters?: string
  humidity?: number
}

export interface EnvironmentalData {
  solarIrradiance: number // kWh/m²/day
  temperature: number // Celsius
  humidity: number // percentage
  windSpeed: number // m/s
  cloudCover: number // percentage
  season: "spring" | "summer" | "autumn" | "winter"
}

export interface PredictionResult {
  // Real outputs derived from backend forecast horizon + hourly series
  dailyOutput: number // average kWh/day over the backend forecast horizon
  horizonHours?: number
  horizonTotalKwh?: number
  timeSeriesData: {
    date: string
    predicted: number
  }[]
}

export interface OptimizationRecommendation {
  optimalTilt: number
  optimalAzimuth: number
  currentOutput: number
  optimizedOutput: number
  improvementPercentage: number
  reasoning: string
}

export class SolarAIService {
  // Mock weather data - in real implementation, this would fetch from weather APIs
  private generateMockEnvironmentalData(location: LocationData): EnvironmentalData {
    const season = this.getCurrentSeason()
    const baseIrradiance = season === "summer" ? 6.5 : season === "winter" ? 3.2 : 4.8

    // Adjust for elevation (higher elevation = more solar irradiance)
    const elevationFactor = location.elevation ? 1 + (location.elevation / 10000) * 0.1 : 1

    return {
      solarIrradiance: baseIrradiance + (Math.random() - 0.5) * 2,
      temperature: season === "summer" ? 25 + Math.random() * 10 : 15 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      windSpeed: 2 + Math.random() * 8,
      cloudCover: Math.random() * 60,
      season,
    }
  }

  private getCurrentSeason(): "spring" | "summer" | "autumn" | "winter" {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return "spring"
    if (month >= 5 && month <= 7) return "summer"
    if (month >= 8 && month <= 10) return "autumn"
    return "winter"
  }

  // Mock prediction algorithm - replace with actual ML model
  async predictSolarOutput(
    location: LocationData,
    panelConfig: PanelConfiguration,
    environmentalData?: EnvironmentalData,
  ): Promise<PredictionResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const envData = environmentalData || this.generateMockEnvironmentalData(location)

    // Mock calculation based on basic solar physics
    const peakSunHours = envData.solarIrradiance
    const temperatureDerating = 1 - Math.max(0, envData.temperature - 25) * 0.004
    const cloudDerating = 1 - (envData.cloudCover / 100) * 0.7
    const tiltFactor = Math.cos((Math.abs(panelConfig.tiltAngle - Math.abs(location.latitude)) * Math.PI) / 180)

    const systemLossFactor = 1 - panelConfig.lossFactor / 100
    const degradationFactor = 1 - panelConfig.degradation / 100 // First year degradation

    const dailyOutput =
      panelConfig.surfaceArea *
      (panelConfig.panelEfficiency / 100) *
      peakSunHours *
      temperatureDerating *
      cloudDerating *
      tiltFactor *
      systemLossFactor *
      degradationFactor

    // Generate 30 days of time series data
    const timeSeriesData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - 29 + i)
      const variation = 0.8 + Math.random() * 0.4 // ±20% variation

      return {
        date: date.toISOString().split("T")[0],
        predicted: dailyOutput * variation,
        actual: Math.random() > 0.3 ? dailyOutput * variation * (0.9 + Math.random() * 0.2) : undefined,
      }
    })

    return {
      dailyOutput: Math.round(dailyOutput * 100) / 100,
      monthlyOutput: Math.round(dailyOutput * 30 * 100) / 100,
      yearlyOutput: Math.round(dailyOutput * 365 * 100) / 100,
      efficiency: Math.round((dailyOutput / (panelConfig.surfaceArea * peakSunHours)) * 100 * 100) / 100,
      confidence: 75 + Math.random() * 20,
      timeSeriesData,
    }
  }

  // Mock optimization algorithm
  async getOptimizationRecommendations(
    location: LocationData,
    currentConfig: PanelConfiguration,
  ): Promise<OptimizationRecommendation> {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Optimal angles based on latitude (simplified)
    const optimalTilt = Math.abs(location.latitude)
    const optimalAzimuth = location.latitude >= 0 ? 180 : 0 // South for northern hemisphere, north for southern

    const currentPrediction = await this.predictSolarOutput(location, currentConfig)
    const optimizedConfig = { ...currentConfig, tiltAngle: optimalTilt, azimuthAngle: optimalAzimuth }
    const optimizedPrediction = await this.predictSolarOutput(location, optimizedConfig)

    const improvement =
      ((optimizedPrediction.dailyOutput - currentPrediction.dailyOutput) / currentPrediction.dailyOutput) * 100

    return {
      optimalTilt,
      optimalAzimuth,
      currentOutput: currentPrediction.dailyOutput,
      optimizedOutput: optimizedPrediction.dailyOutput,
      improvementPercentage: Math.round(improvement * 100) / 100,
      reasoning: `Based on your location at ${location.latitude}°N, ${location.longitude}°E, the optimal panel orientation is ${optimalTilt}° tilt facing ${optimalAzimuth === 180 ? "south" : "north"} to maximize solar exposure throughout the year.`,
    }
  }

  // Mock location geocoding
  async geocodeLocation(query: string): Promise<LocationData[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock geocoding results
    const mockResults: LocationData[] = [
      { latitude: 37.7749, longitude: -122.4194, city: "San Francisco", country: "USA" },
      { latitude: 40.7128, longitude: -74.006, city: "New York", country: "USA" },
      { latitude: 51.5074, longitude: -0.1278, city: "London", country: "UK" },
      { latitude: 48.8566, longitude: 2.3522, city: "Paris", country: "France" },
      { latitude: 35.6762, longitude: 139.6503, city: "Tokyo", country: "Japan" },
    ]

    return mockResults.filter(
      (location) =>
        location.city?.toLowerCase().includes(query.toLowerCase()) ||
        location.country?.toLowerCase().includes(query.toLowerCase()),
    )
  }
}

export const solarAI = new SolarAIService()
