// Solar prediction data types for API integration
export interface SolarInputData {
  location: string;
  latitude: number;
  longitude: number;
  surfaceArea: number;
  tiltAngle: number;
  azimuthAngle: number;
  humidity: number;
  windSurfaceElevation: string;
  siteElevation: number;
}

export interface HourlyPrediction {
  hour: string;
  predicted: number;
  optimal: number;
}

export interface DailyPrediction {
  day: string;
  current: number;
  optimal: number;
}

export interface OptimizationRecommendation {
  title: string;
  description: string;
  improvement: number;
  icon: 'sun' | 'trending' | 'zap';
}

export interface PredictionResponse {
  hourlyData: HourlyPrediction[];
  dailyData: DailyPrediction[];
  totalDaily: number;
  potentialDaily: number;
  efficiency: number;
  improvement: number;
  recommendations: OptimizationRecommendation[];
}

export interface ApiState {
  loading: boolean;
  error: string | null;
  data: PredictionResponse | null;
}