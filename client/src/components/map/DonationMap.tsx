import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, Heart, Building, Users } from "lucide-react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationData {
  id: string;
  name: string;
  type: 'ngo' | 'orphanage' | 'hospital' | 'school' | 'shelter';
  lat: number;
  lng: number;
  address: string;
  description: string;
  needs: string[];
  contact: string;
  verified: boolean;
  distance?: number;
}

interface DonationMapProps {
  onLocationSelect: (location: LocationData) => void;
  userLocation?: { lat: number; lng: number };
}

// Custom marker icons
const createCustomIcon = (type: string, color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

const icons = {
  ngo: createCustomIcon('ngo', '#3b82f6'),
  orphanage: createCustomIcon('orphanage', '#ef4444'),
  hospital: createCustomIcon('hospital', '#10b981'),
  school: createCustomIcon('school', '#f59e0b'),
  shelter: createCustomIcon('shelter', '#8b5cf6'),
};

// Component to handle map updates
function MapUpdater({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export function DonationMap({ onLocationSelect, userLocation }: DonationMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([28.6139, 77.2090]); // Default to Delhi
  const [mapZoom, setMapZoom] = useState(10);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockLocations: LocationData[] = [
      {
        id: "1",
        name: "Hope Foundation",
        type: "ngo",
        lat: 28.6139,
        lng: 77.2090,
        address: "Connaught Place, New Delhi",
        description: "Supporting education for underprivileged children",
        needs: ["Books", "School Supplies", "Volunteers"],
        contact: "+91-9876543210",
        verified: true,
      },
      {
        id: "2",
        name: "Little Angels Orphanage",
        type: "orphanage",
        lat: 28.6200,
        lng: 77.2200,
        address: "Karol Bagh, New Delhi",
        description: "Caring for orphaned children",
        needs: ["Clothing", "Food", "Toys", "Medical Supplies"],
        contact: "+91-9876543211",
        verified: true,
      },
      {
        id: "3",
        name: "City Hospital",
        type: "hospital",
        lat: 28.6000,
        lng: 77.2000,
        address: "Lajpat Nagar, New Delhi",
        description: "Providing free healthcare services",
        needs: ["Medical Equipment", "Medicines", "Volunteers"],
        contact: "+91-9876543212",
        verified: true,
      },
      {
        id: "4",
        name: "Bright Future School",
        type: "school",
        lat: 28.6300,
        lng: 77.2300,
        address: "Rohini, New Delhi",
        description: "Free education for slum children",
        needs: ["Books", "Stationery", "Computers"],
        contact: "+91-9876543213",
        verified: true,
      },
      {
        id: "5",
        name: "Safe Haven Shelter",
        type: "shelter",
        lat: 28.5900,
        lng: 77.1900,
        address: "Nizamuddin, New Delhi",
        description: "Shelter for homeless families",
        needs: ["Food", "Clothing", "Blankets", "Hygiene Items"],
        contact: "+91-9876543214",
        verified: true,
      },
    ];

    setLocations(mockLocations);
    setFilteredLocations(mockLocations);
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(12);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoading(false);
        }
      );
    }
  };

  // Filter locations based on search and type
  useEffect(() => {
    let filtered = locations;

    if (searchQuery) {
      filtered = filtered.filter(
        (location) =>
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((location) => location.type === selectedType);
    }

    // Calculate distances if user location is available
    if (userLocation) {
      filtered = filtered.map((location) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          location.lat,
          location.lng
        );
        return { ...location, distance };
      });
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    setFilteredLocations(filtered);
  }, [searchQuery, selectedType, locations, userLocation]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ngo": return <Heart className="w-4 h-4" />;
      case "orphanage": return <Users className="w-4 h-4" />;
      case "hospital": return <Heart className="w-4 h-4" />;
      case "school": return <Building className="w-4 h-4" />;
      case "shelter": return <Building className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ngo": return "bg-blue-100 text-blue-800";
      case "orphanage": return "bg-red-100 text-red-800";
      case "hospital": return "bg-green-100 text-green-800";
      case "school": return "bg-yellow-100 text-yellow-800";
      case "shelter": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={getUserLocation}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <Navigation size={16} />
                <span>My Location</span>
              </Button>
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["all", "ngo", "orphanage", "hospital", "school", "shelter"].map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="capitalize"
              >
                {type === "all" ? "All Types" : type}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="h-96">
            <CardContent className="p-0 h-full">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                className="rounded-lg"
              >
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {filteredLocations.map((location) => (
                  <Marker
                    key={location.id}
                    position={[location.lat, location.lng]}
                    icon={icons[location.type]}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-sm mb-2">{location.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{location.address}</p>
                        <p className="text-xs mb-3">{location.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {location.needs.slice(0, 3).map((need, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {need}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onLocationSelect(location)}
                          className="w-full"
                        >
                          Donate Here
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </CardContent>
          </Card>
        </div>

        {/* Location List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Nearby Locations</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLocations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getTypeColor(location.type)}>
                          {getTypeIcon(location.type)}
                          <span className="ml-1 capitalize">{location.type}</span>
                        </Badge>
                        {location.verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                      {location.distance && (
                        <span className="text-xs text-muted-foreground">
                          {location.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-sm mb-1">{location.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{location.address}</p>
                    <p className="text-xs mb-3 line-clamp-2">{location.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {location.needs.slice(0, 2).map((need, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {need}
                        </Badge>
                      ))}
                      {location.needs.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{location.needs.length - 2} more
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onLocationSelect(location)}
                      className="w-full"
                    >
                      Donate Here
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
