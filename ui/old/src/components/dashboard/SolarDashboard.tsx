import { useState } from "react";
import { SolarInputForm } from "./SolarInputForm";
import { PredictionResults } from "./PredictionResults";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, BarChart3, AlertCircle } from "lucide-react";
import { useSolarPrediction } from "@/hooks/useSolarPrediction";
import { SolarInputData } from "@/types/solar";
import solarHeroImage from "@/assets/solar-hero.jpg";

export function SolarDashboard() {
  const [inputData, setInputData] = useState<SolarInputData | null>(null);
  const { loading, error, data: predictionData, predictSolarOutput, resetPrediction } = useSolarPrediction();
  const showResults = !!predictionData;

  const handlePredict = async (data: SolarInputData) => {
    setInputData(data);
    await predictSolarOutput(data);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={solarHeroImage} 
          alt="Solar panels on rooftop with data visualization overlay"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-6">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              SolarPredict
            </h1>
            <p className="text-xl mb-6 text-gray-200">
              AI-powered solar energy forecasting for maximum efficiency
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <span>ML Predictions</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <span>Real-time Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-6 py-8">
        {!showResults ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Get Started</h2>
              <p className="text-muted-foreground">
                Enter your solar setup details to receive AI-powered energy predictions and optimization recommendations
              </p>
            </div>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <SolarInputForm onPredict={handlePredict} loading={loading} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Input Form Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-8">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <SolarInputForm onPredict={handlePredict} loading={loading} />
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-8">
              {inputData && predictionData && (
                <PredictionResults inputData={inputData} predictionData={predictionData} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">
              <strong>SolarPredict</strong> - Powered by advanced ML algorithms and real-time weather data
            </p>
            <p className="text-sm">
              Optimize your solar investment with data-driven insights
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}