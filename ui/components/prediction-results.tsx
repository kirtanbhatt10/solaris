"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Zap, Timer, Loader2, AlertCircle } from "lucide-react"
import type { PredictionResult, LocationData, PanelConfiguration } from "@/lib/solar-ai-service"

interface PredictionResultsProps {
  prediction: PredictionResult | null
  location: LocationData | null
  panelConfig: PanelConfiguration
  isLoading: boolean
}

export function PredictionResults({ prediction, location, panelConfig, isLoading }: PredictionResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="font-semibold">Calculating Solar Predictions</h3>
              <p className="text-sm text-muted-foreground">
                Analyzing weather patterns, solar irradiance, and panel configuration...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!prediction || !location) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No Predictions Available</h3>
              <p className="text-sm text-muted-foreground">
                Please select a location and configure your panels to see predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(num)
  }

  // Prepare chart data
  const timeSeriesData = prediction.timeSeriesData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    predicted: Number.parseFloat(item.predicted.toFixed(1)),
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Output (forecast)</CardTitle>
            <Zap className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{formatNumber(prediction.dailyOutput)} kWh</div>
            <p className="text-xs text-muted-foreground">Computed from backend forecast series</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Horizon Total</CardTitle>
            <Timer className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {prediction.horizonTotalKwh != null ? formatNumber(prediction.horizonTotalKwh) : "—"} kWh
            </div>
            <p className="text-xs text-muted-foreground">
              {prediction.horizonHours != null ? `${prediction.horizonHours} hours` : "Forecast horizon"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Energy (from backend forecast horizon)</CardTitle>
          <CardDescription>Each point is computed by summing the backend hourly kWh for that date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  label={{ value: "kWh", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                  name="Energy"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* System Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Summary</CardTitle>
          <CardDescription>Overview of your solar installation configuration and location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Location Details</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Location:</span> {location.city || "Custom Location"}
                </p>
                <p>
                  <span className="font-medium">Coordinates:</span> {location.latitude.toFixed(4)}°,{" "}
                  {location.longitude.toFixed(4)}°
                </p>
                {location.elevation && (
                  <p>
                    <span className="font-medium">Elevation:</span> {location.elevation}m above sea level
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Panel Configuration</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Surface Area:</span> {panelConfig.surfaceArea} m²
                </p>
                <p>
                  <span className="font-medium">Panel Efficiency:</span> {panelConfig.panelEfficiency}%
                </p>
                <p>
                  <span className="font-medium">Orientation:</span> {panelConfig.tiltAngle}° tilt,{" "}
                  {panelConfig.azimuthAngle}° azimuth
                </p>
                <p>
                  <span className="font-medium">Installation:</span>{" "}
                  {panelConfig.installationType.charAt(0).toUpperCase() + panelConfig.installationType.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
