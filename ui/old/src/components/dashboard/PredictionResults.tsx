import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Download, TrendingUp, Sun, Zap, AlertCircle } from "lucide-react";
import { SolarInputData, PredictionResponse } from "@/types/solar";

interface PredictionResultsProps {
  inputData: SolarInputData;
  predictionData: PredictionResponse;
}

export function PredictionResults({ inputData, predictionData }: PredictionResultsProps) {
  const { 
    hourlyData, 
    dailyData, 
    totalDaily, 
    potentialDaily, 
    efficiency, 
    improvement,
    recommendations 
  } = predictionData;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Output</p>
                <p className="text-2xl font-bold text-primary">{totalDaily.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">kWh</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold text-secondary">{efficiency.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Current Setup</p>
              </div>
              <Sun className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Potential</p>
                <p className="text-2xl font-bold text-primary-glow">{potentialDaily.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">kWh optimal</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-glow" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Improvement</p>
                <p className="text-2xl font-bold text-green-600">+{improvement.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">With optimization</p>
              </div>
              <AlertCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Prediction Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Hourly Solar Generation Forecast</CardTitle>
          <CardDescription>
            24-hour prediction vs optimal configuration for {inputData.location}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Current Setup"
                />
                <Line 
                  type="monotone" 
                  dataKey="optimal" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Optimal Setup"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Comparison */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Weekly Energy Production</CardTitle>
          <CardDescription>
            Daily totals comparison: current vs optimized setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="current" fill="hsl(var(--primary))" name="Current" />
                <Bar dataKey="optimal" fill="hsl(var(--secondary))" name="Optimal" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>AI Optimization Recommendations</CardTitle>
          <CardDescription>
            Actionable insights to maximize your solar energy production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map((rec, index) => {
              const IconComponent = rec.icon === 'sun' ? Sun : rec.icon === 'trending' ? TrendingUp : Zap;
              const iconBg = rec.icon === 'sun' ? 'bg-primary' : rec.icon === 'trending' ? 'bg-secondary' : 'bg-accent';
              
              return (
                <div key={index} className="flex items-start gap-3 p-4 bg-accent rounded-lg">
                  <div className={`p-2 ${iconBg} rounded-full`}>
                    <IconComponent className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: rec.description }} />
                    <Badge variant="secondary" className="mt-2">+{rec.improvement.toFixed(1)} kWh/day</Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="data" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export PDF Report
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}