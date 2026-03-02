import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Zap, RotateCcw, Loader2, CalendarIcon, Cloud, Mountain } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SolarInputData } from "@/types/solar";

interface SolarInputFormProps {
  onPredict: (data: SolarInputData) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SolarInputForm({ onPredict, loading = false, disabled = false }: SolarInputFormProps) {
  const [formData, setFormData] = useState<SolarInputData>({
    location: "",
    latitude: 0,
    longitude: 0,
    surfaceArea: 0,
    tiltAngle: 30,
    azimuthAngle: 180,
    humidity: 0,
    windSurfaceElevation: "",
    siteElevation: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredict(formData);
  };

  const handleLocationExample = () => {
    setFormData({
      ...formData,
      location: "San Francisco, CA",
      latitude: 37.7749,
      longitude: -122.4194,
    });
  };

  return (
    <Card className="w-full shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Solar Configuration
        </CardTitle>
        <CardDescription>
          Enter your location and solar panel specifications for AI-powered predictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Location</Label>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="location">City or Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLocationExample}
                  >
                    Example
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.0001"
                    value={Number.isNaN(formData.latitude) ? '' : formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                    placeholder="37.7749"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    value={Number.isNaN(formData.longitude) ? '' : formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                    placeholder="-122.4194"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Panel Configuration</Label>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="surfaceArea">Surface Area (m²)</Label>
                <Input
                  id="surfaceArea"
                  type="number"
                  step="0.1"
                  value={Number.isNaN(formData.surfaceArea) ? '' : formData.surfaceArea}
                  onChange={(e) => setFormData({ ...formData, surfaceArea: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                  placeholder="20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tiltAngle">Tilt Angle (°)</Label>
                  <Input
                    id="tiltAngle"
                    type="number"
                    min="0"
                    max="90"
                    value={Number.isNaN(formData.tiltAngle) ? '' : formData.tiltAngle}
                    onChange={(e) => setFormData({ ...formData, tiltAngle: e.target.value === '' ? NaN : parseInt(e.target.value) })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="azimuthAngle">Azimuth Angle (°)</Label>
                  <Input
                    id="azimuthAngle"
                    type="number"
                    min="0"
                    max="360"
                    value={Number.isNaN(formData.azimuthAngle) ? '' : formData.azimuthAngle}
                    onChange={(e) => setFormData({ ...formData, azimuthAngle: e.target.value === '' ? NaN : parseInt(e.target.value) })}
                    placeholder="180"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Data Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Environmental Data</Label>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="humidity">Humidity (%)</Label>
                  <Input
                    id="humidity"
                    type="number"
                    min="0"
                    max="100"
                    value={Number.isNaN(formData.humidity) ? '' : formData.humidity}
                    onChange={(e) => setFormData({ ...formData, humidity: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                    placeholder="65"
                  />
                </div>
                <div>
                  <Label htmlFor="siteElevation">Site Elevation (m)</Label>
                  <Input
                    id="siteElevation"
                    type="number"
                    step="0.1"
                    value={Number.isNaN(formData.siteElevation) ? '' : formData.siteElevation}
                    onChange={(e) => setFormData({ ...formData, siteElevation: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="windSurfaceElevation">Parameters</Label>
                <Textarea
                  id="windSurfaceElevation"
                  value={formData.windSurfaceElevation}
                  onChange={(e) => setFormData({ ...formData, windSurfaceElevation: e.target.value })}
                  placeholder="eg All sky_sfc, sw, wsc"
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>


          <Button 
            type="submit" 
            variant="solar" 
            className="w-full"
            disabled={!formData.location || !formData.surfaceArea || loading || disabled}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Predictions...
              </>
            ) : (
              "Generate AI Predictions"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}