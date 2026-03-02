import { useState } from 'react';
import { SolarInputData, PredictionResponse, ApiState } from '@/types/solar';

export function useSolarPrediction() {
  const [apiState, setApiState] = useState<ApiState>({
    loading: false,
    error: null,
    data: null,
  });

  const predictSolarOutput = async (inputData: SolarInputData): Promise<void> => {
    setApiState({ loading: true, error: null, data: null });

    try {
      // TODO: Replace with your AI API endpoint
      const response = await fetch('/api/solar-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your API key header here if needed
          // 'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(inputData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: PredictionResponse = await response.json();
      
      setApiState({ loading: false, error: null, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setApiState({ loading: false, error: errorMessage, data: null });
    }
  };

  const resetPrediction = () => {
    setApiState({ loading: false, error: null, data: null });
  };

  return {
    ...apiState,
    predictSolarOutput,
    resetPrediction,
  };
}