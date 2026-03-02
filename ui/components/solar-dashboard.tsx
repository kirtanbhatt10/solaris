"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LocationInput } from "./location-input"
import { PanelConfiguration } from "./panel-configuration"
import { PredictionResults } from "./prediction-results"
import { OptimizationRecommendations } from "./optimization-recommendations"
import { ExportReports } from "./export-reports"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Sun,
  Zap,
  Settings,
  TrendingUp,
  MapPin,
  Activity,
  BarChart3,
  Lightbulb,
  FileText,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import type {
  LocationData,
  PanelConfiguration as PanelConfig,
  PredictionResult,
  OptimizationRecommendation,
} from "@/lib/solar-ai-service"

export function SolarDashboard() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [panelConfig, setPanelConfig] = useState<PanelConfig>({
    surfaceArea: 20,
    tiltAngle: 30,
    azimuthAngle: 180,
    efficiency: 20,
    panelEfficiency: 20,
    lossFactor: 15,
    degradation: 0.5,
    installationType: "roof",
  })
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<"input" | "predictions" | "optimization" | "reports">("input")

  const sections = [
    { id: "input", label: "Configuration", icon: Settings, description: "Set up your solar system parameters" },
    { id: "predictions", label: "Predictions", icon: BarChart3, description: "View AI-powered energy forecasts" },
    { id: "optimization", label: "Optimization", icon: Lightbulb, description: "Get improvement recommendations" },
    { id: "reports", label: "Reports", icon: FileText, description: "Export detailed analysis" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl pulse-glow">
                  <Sun className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Solaris <span className="text-primary">AI</span>
                </h1>
                <p className="text-sm text-muted-foreground">Intelligent Solar Power Prediction Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="status-active">
                <Activity className="h-3 w-3 mr-1" />
                AI Model Active
              </Badge>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section with Guaranteed Dark Background */}
        <div
          className="mb-12 text-center relative overflow-hidden rounded-3xl"
          style={{
            backgroundColor: "#1e293b",
            backgroundImage:
              "linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%), url(/images/solar-hero-bg.png)",
            backgroundBlendMode: "overlay",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 py-16 px-8">
            <h2 className="text-4xl font-bold mb-4 text-balance" style={{ color: "#ffffff" }}>
              Predict Your Solar Power Generation with <span style={{ color: "#fde047" }}>Advanced AI</span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-pretty" style={{ color: "#f1f5f9" }}>
              Get accurate solar power predictions, optimization recommendations, and actionable insights for your solar
              installation using cutting-edge machine learning models.
            </p>
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-2xl">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{section.label}</span>
                  {activeSection === section.id && <ChevronRight className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {activeSection === "input" && (
            <div className="slide-in">
              {/* Quick Stats */}
              {location && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Card className="modern-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">LOCATION</p>
                          <p className="font-semibold text-sm">{location.city || "Custom"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="modern-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 rounded-lg">
                          <Sun className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">PANEL AREA</p>
                          <p className="font-semibold text-sm">{panelConfig.surfaceArea}m²</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="modern-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Zap className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">PANEL EFFICIENCY</p>
                          <p className="font-semibold text-sm">{panelConfig.panelEfficiency}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="modern-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-chart-3/10 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-chart-3" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">TILT ANGLE</p>
                          <p className="font-semibold text-sm">{panelConfig.tiltAngle}°</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                  <LocationInput onLocationSelect={setLocation} selectedLocation={location} />
                </div>
                <div className="space-y-6">
                  <PanelConfiguration
                    config={panelConfig}
                    onConfigChange={setPanelConfig}
                    location={location}
                    onPredictionUpdate={setPrediction}
                    onRecommendationsUpdate={setRecommendations}
                    onLoadingChange={setIsLoading}
                  />
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        System Parameters
                      </CardTitle>
                      <CardDescription>Advanced configuration for precise predictions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Panel Efficiency */}
                      <div className="space-y-2">
                        <Label htmlFor="panel-efficiency">Panel Efficiency (%)</Label>
                        <Input
                          id="panel-efficiency"
                          type="number"
                          value={panelConfig.panelEfficiency}
                          onChange={(e) =>
                            setPanelConfig({ ...panelConfig, panelEfficiency: Number.parseFloat(e.target.value) || 0 })
                          }
                          min="10"
                          max="25"
                          step="0.1"
                          placeholder="20"
                        />
                        <p className="text-xs text-muted-foreground">Modern panels: 18-22%. Premium: 22-25%</p>
                      </div>

                      {/* Loss Factor */}
                      <div className="space-y-2">
                        <Label htmlFor="loss-factor">Loss Factor (%)</Label>
                        <Input
                          id="loss-factor"
                          type="number"
                          value={panelConfig.lossFactor}
                          onChange={(e) =>
                            setPanelConfig({ ...panelConfig, lossFactor: Number.parseFloat(e.target.value) || 0 })
                          }
                          min="0"
                          max="50"
                          step="0.1"
                          placeholder="15"
                        />
                        <p className="text-xs text-muted-foreground">
                          System losses: inverter, wiring, shading (10-20%)
                        </p>
                      </div>

                      {/* Degradation */}
                      <div className="space-y-2">
                        <Label htmlFor="degradation">Degradation (%/year)</Label>
                        <Input
                          id="degradation"
                          type="number"
                          value={panelConfig.degradation}
                          onChange={(e) =>
                            setPanelConfig({ ...panelConfig, degradation: Number.parseFloat(e.target.value) || 0 })
                          }
                          min="0"
                          max="2"
                          step="0.1"
                          placeholder="0.5"
                        />
                        <p className="text-xs text-muted-foreground">Annual efficiency loss (0.3-0.8% typical)</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeSection === "predictions" && (
            <div className="slide-in">
              <PredictionResults
                prediction={prediction}
                location={location}
                panelConfig={panelConfig}
                isLoading={isLoading}
              />
            </div>
          )}

          {activeSection === "optimization" && (
            <div className="slide-in">
              <OptimizationRecommendations
                recommendations={recommendations}
                location={location}
                currentConfig={panelConfig}
                isLoading={isLoading}
              />
            </div>
          )}

          {activeSection === "reports" && (
            <div className="slide-in">
              <ExportReports
                prediction={prediction}
                recommendations={recommendations}
                location={location}
                panelConfig={panelConfig}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Solaris AI. Powered by advanced machine learning algorithms.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
