"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Target, Compass, RotateCcw, Lightbulb, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import type { OptimizationRecommendation, LocationData, PanelConfiguration } from "@/lib/solar-ai-service"

interface OptimizationRecommendationsProps {
  recommendations: OptimizationRecommendation | null
  location: LocationData | null
  currentConfig: PanelConfiguration
  isLoading: boolean
}

export function OptimizationRecommendations({
  recommendations,
  location,
  currentConfig,
  isLoading,
}: OptimizationRecommendationsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="font-semibold">Analyzing Optimal Configuration</h3>
              <p className="text-sm text-muted-foreground">
                AI is calculating the best panel orientation for your location...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!recommendations || !location) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No Recommendations Available</h3>
              <p className="text-sm text-muted-foreground">
                Please configure your panels and run predictions to get optimization recommendations.
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

  const getImprovementColor = (improvement: number) => {
    if (improvement > 10) return "text-green-600"
    if (improvement > 5) return "text-yellow-600"
    if (improvement > 0) return "text-blue-600"
    return "text-gray-600"
  }

  const getImprovementBadgeVariant = (improvement: number) => {
    if (improvement > 10) return "default"
    if (improvement > 5) return "secondary"
    return "outline"
  }

  const getOrientationDescription = (azimuth: number) => {
    if (azimuth >= 0 && azimuth < 45) return "North"
    if (azimuth >= 45 && azimuth < 135) return "East"
    if (azimuth >= 135 && azimuth < 225) return "South"
    if (azimuth >= 225 && azimuth < 315) return "West"
    return "North"
  }

  const improvementPercentage = Math.max(0, recommendations.improvementPercentage)
  const hasSignificantImprovement = improvementPercentage > 1

  return (
    <div className="space-y-6">
      {/* Improvement Overview */}
      <Card className={hasSignificantImprovement ? "border-accent/50 bg-accent/5" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Optimization Potential
            </CardTitle>
            <Badge variant={getImprovementBadgeVariant(improvementPercentage)} className="text-sm">
              {improvementPercentage > 0 ? "+" : ""}
              {formatNumber(improvementPercentage)}% improvement
            </Badge>
          </div>
          <CardDescription>
            {hasSignificantImprovement
              ? "Your system can be optimized for better performance"
              : "Your current configuration is already well-optimized"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Current Output</span>
              <span className="font-medium">{formatNumber(recommendations.currentOutput)} kWh/day</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Optimized Output</span>
              <span className="font-medium text-accent">{formatNumber(recommendations.optimizedOutput)} kWh/day</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">Potential Gain</span>
              <span className={`font-bold ${getImprovementColor(improvementPercentage)}`}>
                +{formatNumber(recommendations.optimizedOutput - recommendations.currentOutput)} kWh/day
              </span>
            </div>
            {/* Removed placeholder progress visualization to keep UI real-only */}
          </div>
        </CardContent>
      </Card>

      {/* Current vs Optimal Configuration */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Configuration</CardTitle>
            <CardDescription>Your existing panel setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Tilt Angle</span>
                </div>
                <Badge variant="outline">{currentConfig.tiltAngle}°</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Azimuth</span>
                </div>
                <Badge variant="outline">
                  {currentConfig.azimuthAngle}° ({getOrientationDescription(currentConfig.azimuthAngle)})
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Daily Output</span>
                </div>
                <span className="font-medium">{formatNumber(recommendations.currentOutput)} kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Optimal Configuration
              <ArrowRight className="h-4 w-4 text-accent" />
            </CardTitle>
            <CardDescription>AI-recommended settings for maximum output</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-accent" />
                  <span className="text-sm">Tilt Angle</span>
                </div>
                <Badge className="bg-accent text-accent-foreground">{recommendations.optimalTilt}°</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-accent" />
                  <span className="text-sm">Azimuth</span>
                </div>
                <Badge className="bg-accent text-accent-foreground">
                  {recommendations.optimalAzimuth}° ({getOrientationDescription(recommendations.optimalAzimuth)})
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-sm">Daily Output</span>
                </div>
                <span className="font-medium text-accent">{formatNumber(recommendations.optimizedOutput)} kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Reasoning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Analysis & Reasoning
          </CardTitle>
          <CardDescription>Why these settings are optimal for your location</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm leading-relaxed">{recommendations.reasoning}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Removed generic/static tips and guides to keep UI real-only */}
    </div>
  )
}
