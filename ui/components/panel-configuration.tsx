"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Settings, Calculator, Loader2 } from "lucide-react"
import { type LocationData, type PanelConfiguration as PanelConfig } from "@/lib/solar-ai-service"
import { callPredictEndpoint } from "@/lib/backend-client"

interface PanelConfigurationProps {
  config: PanelConfig
  onConfigChange: (config: PanelConfig) => void
  location: LocationData | null
  onPredictionUpdate: (prediction: PredictionResult | null) => void
  onRecommendationsUpdate: (recommendations: OptimizationRecommendation | null) => void
  onLoadingChange: (loading: boolean) => void
}

export function PanelConfiguration({
  config,
  onConfigChange,
  location,
  onPredictionUpdate,
  onRecommendationsUpdate,
  onLoadingChange,
}: PanelConfigurationProps) {
  const [isCalculating, setIsCalculating] = useState(false)

  const updateConfig = (updates: Partial<PanelConfig>) => {
    onConfigChange({ ...config, ...updates })
  }

  const calculatePredictions = async () => {
    if (!location) {
      alert("Please select a location first")
      return
    }

    try {
      setIsCalculating(true)
      onLoadingChange(true)

      // Call real backend /predict endpoint
      const backendResponse = await callPredictEndpoint({
        lat: location.latitude,
        lon: location.longitude,
        area: config.surfaceArea,
        tilt: config.tiltAngle,
        azimuth: config.azimuthAngle,
        efficiency: config.panelEfficiency / 100, // backend expects 0–1
        // backend expects a retained-energy multiplier (e.g. 0.85 = 15% losses)
        loss_factor: Math.max(0, 1 - config.lossFactor / 100),
        degradation: config.degradation / 100,
      })

      const { user_total_kwh, best_tilt, best_azimuth, best_total_kwh, uplift_percent } = backendResponse.results
      const horizonDays = backendResponse.horizon_hours > 0 ? backendResponse.horizon_hours / 24 : 2

      // Build a real daily time series from backend hourly data
      const dailyByDate = new Map<string, number>()
      for (const row of backendResponse.series.user) {
        const date = new Date(row.time_utc).toISOString().split("T")[0]
        dailyByDate.set(date, (dailyByDate.get(date) || 0) + (row.energy_kWh || 0))
      }
      const timeSeriesData = Array.from(dailyByDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, kwh]) => ({ date, predicted: kwh }))

      // And the optimized daily series
      const bestDailyByDate = new Map<string, number>()
      for (const row of backendResponse.series.best) {
        const date = new Date(row.time_utc).toISOString().split("T")[0]
        bestDailyByDate.set(date, (bestDailyByDate.get(date) || 0) + (row.energy_kWh || 0))
      }
      const bestTimeSeriesData = Array.from(bestDailyByDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, kwh]) => ({ date, predicted: kwh }))

      const dailyOutput =
        timeSeriesData.length > 0
          ? timeSeriesData.reduce((acc, d) => acc + d.predicted, 0) / timeSeriesData.length
          : user_total_kwh / horizonDays

      const prediction: any = {
        dailyOutput,
        horizonHours: backendResponse.horizon_hours,
        horizonTotalKwh: user_total_kwh,
        timeSeriesData,
      }

      const recommendations: any = {
        optimalTilt: best_tilt,
        optimalAzimuth: best_azimuth,
        currentOutput: dailyOutput,
        optimizedOutput:
          bestTimeSeriesData.length > 0
            ? bestTimeSeriesData.reduce((acc, d) => acc + d.predicted, 0) / bestTimeSeriesData.length
            : best_total_kwh / horizonDays,
        improvementPercentage: uplift_percent,
        reasoning: `Based on the latest solar forecast at (${location.latitude.toFixed(
          4,
        )}, ${location.longitude.toFixed(
          4,
        )}), adjusting your panels to ${best_tilt}° tilt and ${best_azimuth}° azimuth is estimated to increase daily energy production by approximately ${uplift_percent.toFixed(
          1,
        )}%.`,
      }

      onPredictionUpdate(prediction)
      onRecommendationsUpdate(recommendations)
    } catch (error) {
      console.error("Calculation failed:", error)
      alert("Failed to calculate predictions. Please try again.")
    } finally {
      setIsCalculating(false)
      onLoadingChange(false)
    }
  }

  // Auto-calculate when config changes (debounced)
  useEffect(() => {
    if (!location) return

    const debounceTimer = setTimeout(() => {
      calculatePredictions()
    }, 1000)

    return () => clearTimeout(debounceTimer)
  }, [config, location])

  const getOrientationDescription = (azimuth: number) => {
    if (azimuth >= 0 && azimuth < 45) return "North"
    if (azimuth >= 45 && azimuth < 135) return "East"
    if (azimuth >= 135 && azimuth < 225) return "South"
    if (azimuth >= 225 && azimuth < 315) return "West"
    return "North"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Panel Configuration
        </CardTitle>
        <CardDescription>Configure your solar panel specifications for accurate predictions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Surface Area */}
        <div className="space-y-2">
          <Label htmlFor="surface-area">Total Panel Surface Area (m²)</Label>
          <Input
            id="surface-area"
            type="number"
            value={config.surfaceArea}
            onChange={(e) => updateConfig({ surfaceArea: Number.parseFloat(e.target.value) || 0 })}
            min="1"
            step="0.1"
            placeholder="20"
          />
          <p className="text-xs text-muted-foreground">Total area of all solar panels combined. Typical: 15-30 m²</p>
        </div>

        {/* Tilt Angle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Tilt Angle: {config.tiltAngle}°</Label>
            <Badge variant="outline">
              {config.tiltAngle === 0
                ? "Flat"
                : config.tiltAngle < 30
                  ? "Low"
                  : config.tiltAngle < 60
                    ? "Optimal"
                    : "Steep"}
            </Badge>
          </div>
          <Slider
            value={[config.tiltAngle]}
            onValueChange={([value]) => updateConfig({ tiltAngle: value })}
            min={0}
            max={90}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">0° = flat, 30-45° typically optimal</p>
        </div>

        {/* Azimuth Angle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Azimuth Angle: {config.azimuthAngle}°</Label>
            <Badge variant="outline">{getOrientationDescription(config.azimuthAngle)}</Badge>
          </div>
          <Slider
            value={[config.azimuthAngle]}
            onValueChange={([value]) => updateConfig({ azimuthAngle: value })}
            min={0}
            max={359}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">0° = North, 90° = East, 180° = South, 270° = West</p>
        </div>

        {/* Calculate Button */}
        <div className="pt-4 border-t">
          <Button onClick={calculatePredictions} disabled={!location || isCalculating} className="w-full" size="lg">
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating Predictions...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Solar Predictions
              </>
            )}
          </Button>
          {!location && (
            <p className="text-xs text-muted-foreground text-center mt-2">Please select a location first</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
