"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Loader2, Globe } from "lucide-react"
import { type LocationData } from "@/lib/solar-ai-service"

interface LocationInputProps {
  onLocationSelect: (location: LocationData) => void
  selectedLocation: LocationData | null
}

export function LocationInput({ onLocationSelect, selectedLocation }: LocationInputProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<LocationData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [manualCoords, setManualCoords] = useState({ lat: "", lng: "" })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Real geocoding via Open-Meteo Geocoding API
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=6&language=en&format=json`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
      const data = (await res.json()) as any
      const results: LocationData[] = (data?.results || []).map((r: any) => ({
        latitude: r.latitude,
        longitude: r.longitude,
        city: r.name,
        country: r.country,
        elevation: r.elevation,
      }))
      setSearchResults(results)
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleManualCoordinates = () => {
    const lat = Number.parseFloat(manualCoords.lat)
    const lng = Number.parseFloat(manualCoords.lng)

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert("Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)")
      return
    }

    onLocationSelect({
      latitude: lat,
      longitude: lng,
      city: "Custom Location",
    })
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSelect({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: "Current Location",
        })
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("Unable to get your current location. Please search manually or enter coordinates.")
      },
    )
  }

  useEffect(() => {
    if (searchQuery.length > 2) {
      const debounceTimer = setTimeout(() => {
        handleSearch()
      }, 500)
      return () => clearTimeout(debounceTimer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  return (
    <Card className="h-fit vibrant-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg solar-glow">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-foreground">
            Location <span className="text-primary">Selection</span>
          </span>
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          Enter your location to get accurate solar predictions based on local weather patterns and sun exposure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {selectedLocation && (
          <div className="p-4 bg-gradient-to-br from-accent/15 via-accent/8 to-primary/5 rounded-xl border border-accent/30 relative overflow-hidden vibrant-card">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/8 to-primary/5"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-accent animate-pulse" />
                    <h3 className="font-semibold text-accent-foreground">Active Location</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedLocation.city && `${selectedLocation.city}, `}
                    {selectedLocation.latitude.toFixed(4)}°N, {Math.abs(selectedLocation.longitude).toFixed(4)}°
                    {selectedLocation.longitude >= 0 ? "E" : "W"}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-accent/25 text-accent-foreground border-accent/40 animate-pulse"
                >
                  <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
                  Ready
                </Badge>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a city or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-11 vibrant-input focus:border-primary/50"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="h-11 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((location, index) => (
                <button
                  key={index}
                  onClick={() => onLocationSelect(location)}
                  className="w-full p-3 text-left vibrant-card hover:border-accent/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/15 to-accent/10 rounded-lg group-hover:from-accent/20 group-hover:to-primary/15 transition-all duration-200">
                      <MapPin className="h-3 w-3 text-primary group-hover:text-accent transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{location.city}</div>
                      <div className="text-xs text-muted-foreground">
                        {location.country} • {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
            <span className="text-xs text-primary font-medium">MANUAL COORDINATES</span>
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <Input
                placeholder="-90 to 90"
                value={manualCoords.lat}
                onChange={(e) => setManualCoords((prev) => ({ ...prev, lat: e.target.value }))}
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                className="mt-1 h-9 vibrant-input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <Input
                placeholder="-180 to 180"
                value={manualCoords.lng}
                onChange={(e) => setManualCoords((prev) => ({ ...prev, lng: e.target.value }))}
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                className="mt-1 h-9 vibrant-input"
              />
            </div>
          </div>

          <Button
            onClick={handleManualCoordinates}
            variant="outline"
            disabled={!manualCoords.lat || !manualCoords.lng}
            className="w-full h-10 vibrant-card hover:border-accent/50 bg-gradient-to-r from-background/50 to-card/50"
          >
            <Globe className="h-4 w-4 mr-2" />
            Use Coordinates
          </Button>
        </div>

        <div className="pt-4 border-t border-gradient-to-r from-transparent via-border to-transparent">
          <Button
            onClick={getCurrentLocation}
            variant="outline"
            className="w-full h-11 bg-gradient-to-r from-primary/10 via-accent/8 to-primary/10 hover:from-primary/15 hover:via-accent/12 hover:to-primary/15 border-primary/30 hover:border-primary/50 text-primary hover:text-primary shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <MapPin className="h-4 w-4 mr-2 animate-pulse" />
            Use Current Location
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
