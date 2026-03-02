"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, FileSpreadsheet, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import type {
  PredictionResult,
  OptimizationRecommendation,
  LocationData,
  PanelConfiguration,
} from "@/lib/solar-ai-service"

interface ExportReportsProps {
  prediction: PredictionResult | null
  recommendations: OptimizationRecommendation | null
  location: LocationData | null
  panelConfig: PanelConfiguration
}

export function ExportReports({ prediction, recommendations, location, panelConfig }: ExportReportsProps) {
  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    predictions: true,
    timeSeries: true,
    recommendations: true,
    configuration: true,
  })
  const [reportPeriod, setReportPeriod] = useState("monthly")
  const [isExporting, setIsExporting] = useState(false)

  const hasData = prediction && location

  const generateCSVData = () => {
    if (!prediction) return ""

    const headers = ["Date", "Predicted Output (kWh)", "Actual Output (kWh)"]
    const rows = prediction.timeSeriesData.map((item) => [
      item.date,
      item.predicted.toFixed(2),
      item.actual?.toFixed(2) || "N/A",
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  const generatePDFContent = () => {
    if (!prediction || !location) return ""

    const currentDate = new Date().toLocaleDateString()
    const locationStr = location.city
      ? `${location.city} (${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°)`
      : `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`

    let content = `SOLAR POWER PREDICTION REPORT
Generated on: ${currentDate}
Location: ${locationStr}

EXECUTIVE SUMMARY
================
Avg Daily Output (forecast): ${prediction.dailyOutput.toFixed(1)} kWh/day
Forecast Horizon: ${prediction.horizonHours ?? "N/A"} hours
Forecast Horizon Total: ${(prediction.horizonTotalKwh ?? 0).toFixed(1)} kWh

SYSTEM CONFIGURATION
===================
Surface Area: ${panelConfig.surfaceArea} m²
Panel Efficiency: ${panelConfig.panelEfficiency}%
Tilt Angle: ${panelConfig.tiltAngle}°
Azimuth Angle: ${panelConfig.azimuthAngle}°
Installation Type: ${panelConfig.installationType}

`

    if (recommendations && selectedSections.recommendations) {
      content += `OPTIMIZATION RECOMMENDATIONS
============================
Current Output: ${recommendations.currentOutput.toFixed(1)} kWh/day
Optimized Output: ${recommendations.optimizedOutput.toFixed(1)} kWh/day
Improvement Potential: ${recommendations.improvementPercentage.toFixed(1)}%
Optimal Tilt: ${recommendations.optimalTilt}°
Optimal Azimuth: ${recommendations.optimalAzimuth}°

Reasoning: ${recommendations.reasoning}

`
    }

    if (selectedSections.timeSeries) {
      content += `DAILY FORECAST SERIES (Derived from backend hourly forecast)
===============================================
Date,Energy (kWh)
${prediction.timeSeriesData.map((item) => `${item.date},${item.predicted.toFixed(2)}`).join("\n")}
`
    }

    return content
  }

  const downloadCSV = () => {
    const csvContent = generateCSVData()
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `solar-predictions-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const downloadPDF = () => {
    const pdfContent = generatePDFContent()
    const blob = new Blob([pdfContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `solar-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (format: "csv" | "pdf") => {
    setIsExporting(true)

    // Simulate export processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (format === "csv") {
      downloadCSV()
    } else {
      downloadPDF()
    }

    setIsExporting(false)
  }

  const toggleSection = (section: keyof typeof selectedSections) => {
    setSelectedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const getSectionCount = () => {
    return Object.values(selectedSections).filter(Boolean).length
  }

  if (!hasData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No Data to Export</h3>
              <p className="text-sm text-muted-foreground">
                Please run solar predictions first to generate exportable reports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Export Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Solar Reports
          </CardTitle>
          <CardDescription>
            Download comprehensive reports with your solar predictions, recommendations, and analysis data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Reports include all prediction data, optimization recommendations, and system configuration details for
              professional analysis and record-keeping.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Sections</CardTitle>
            <CardDescription>Select which sections to include in your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="summary"
                  checked={selectedSections.summary}
                  onCheckedChange={() => toggleSection("summary")}
                />
                <label
                  htmlFor="summary"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Executive Summary
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="predictions"
                  checked={selectedSections.predictions}
                  onCheckedChange={() => toggleSection("predictions")}
                />
                <label
                  htmlFor="predictions"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Power Predictions
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timeSeries"
                  checked={selectedSections.timeSeries}
                  onCheckedChange={() => toggleSection("timeSeries")}
                />
                <label
                  htmlFor="timeSeries"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Historical Time Series
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recommendations"
                  checked={selectedSections.recommendations}
                  onCheckedChange={() => toggleSection("recommendations")}
                  disabled={!recommendations}
                />
                <label
                  htmlFor="recommendations"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Optimization Recommendations
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="configuration"
                  checked={selectedSections.configuration}
                  onCheckedChange={() => toggleSection("configuration")}
                />
                <label
                  htmlFor="configuration"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  System Configuration
                </label>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span>Selected Sections:</span>
              <Badge variant="outline">{getSectionCount()} of 5</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Settings</CardTitle>
            <CardDescription>Configure report format and time period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Period</label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (Last 30 days)</SelectItem>
                  <SelectItem value="monthly">Monthly (Last 12 months)</SelectItem>
                  <SelectItem value="yearly">Yearly Projection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Report Summary</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {location.city || `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}
                </p>
                <p>
                  <span className="font-medium">System Size:</span> {panelConfig.surfaceArea} m²
                </p>
                <p>
                  <span className="font-medium">Avg Daily Output:</span> {prediction.dailyOutput.toFixed(1)} kWh/day
                </p>
                <p>
                  <span className="font-medium">Horizon Total:</span>{" "}
                  {prediction.horizonTotalKwh != null ? prediction.horizonTotalKwh.toFixed(1) : "—"} kWh
                </p>
                {recommendations && (
                  <p>
                    <span className="font-medium">Optimization Potential:</span>{" "}
                    {recommendations.improvementPercentage.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Download Reports</CardTitle>
          <CardDescription>Choose your preferred format for the solar analysis report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={() => handleExport("csv")}
              disabled={isExporting || getSectionCount() === 0}
              className="h-auto p-4 flex flex-col items-center gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">CSV Data Export</div>
                <div className="text-xs text-muted-foreground">Raw data for analysis</div>
              </div>
            </Button>

            <Button
              onClick={() => handleExport("pdf")}
              disabled={isExporting || getSectionCount() === 0}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">PDF Report</div>
                <div className="text-xs text-muted-foreground">Comprehensive report</div>
              </div>
            </Button>
          </div>

          {isExporting && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Generating report with {getSectionCount()} sections...
              </div>
            </div>
          )}

          {getSectionCount() === 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please select at least one report section to export.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Report Preview
          </CardTitle>
          <CardDescription>Preview of key metrics that will be included in your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-chart-4">{prediction.dailyOutput.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">kWh/day (avg)</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-chart-2">
                {prediction.horizonTotalKwh != null ? prediction.horizonTotalKwh.toFixed(0) : "—"}
              </div>
              <div className="text-sm text-muted-foreground">kWh (horizon total)</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-chart-1">{prediction.horizonHours ?? "—"}</div>
              <div className="text-sm text-muted-foreground">hours (horizon)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
