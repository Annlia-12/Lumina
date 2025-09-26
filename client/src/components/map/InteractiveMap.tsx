import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, Plus, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Mock map data
const mockMapData = [
  {
    id: "1",
    type: "donation",
    title: "Food Distribution Center",
    location: { lat: 28.6139, lng: 77.2090, address: "New Delhi, India" },
    description: "Fresh meals available for pickup",
    status: "active"
  },
  {
    id: "2", 
    type: "volunteer",
    title: "Beach Cleanup Event",
    location: { lat: 19.0760, lng: 72.8777, address: "Mumbai, India" },
    description: "Join us for coastal conservation",
    status: "active"
  },
  {
    id: "3",
    type: "request",
    title: "Medical Supplies Needed",
    location: { lat: 12.9716, lng: 77.5946, address: "Bangalore, India" },
    description: "Urgent: First aid supplies required",
    status: "urgent"
  }
];

interface InteractiveMapProps {
  height?: string;
  showControls?: boolean;
  data?: any[];
}

export function InteractiveMap({ height = "h-96", showControls = true, data = mockMapData }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredData = data.filter(item => 
    selectedFilter === "all" || item.type === selectedFilter
  );

  const handleFindNearby = () => {
    // Mock geolocation
    console.log("Finding nearby locations...");
  };

  const handleAddLocation = () => {
    // Mock add location
    console.log("Adding new location...");
  };

  return (
    <Card className="overflow-hidden">
      <div className={`relative ${height}`} data-testid="map-container">
        {!mapLoaded ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading interactive map...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Connecting with nearby groups and tracking live donations
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 relative overflow-hidden">
            {/* Mock map background */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                <path
                  d="M0,150 Q100,100 200,120 T400,140"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-primary"
                />
                <path
                  d="M0,180 Q150,160 250,170 T400,165"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none" 
                  className="text-accent"
                />
              </svg>
            </div>

            {/* Mock location markers */}
            {filteredData.map((item, index) => (
              <div
                key={item.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${20 + index * 25}%`,
                  top: `${30 + index * 15}%`
                }}
                data-testid={`map-marker-${item.id}`}
              >
                <div className="relative">
                  <MapPin 
                    className={`w-6 h-6 ${
                      item.type === 'donation' ? 'text-primary' :
                      item.type === 'volunteer' ? 'text-accent' : 'text-destructive'
                    } group-hover:scale-110 transition-transform`}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-48">
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.location.address}</p>
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          item.type === 'donation' ? 'bg-primary/10 text-primary' :
                          item.type === 'volunteer' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Map info overlay */}
            <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 text-xs text-muted-foreground">
              Interactive Map - {filteredData.length} locations
            </div>
          </div>
        )}
      </div>

      {showControls && (
        <CardContent className="p-6 border-t border-border">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleFindNearby}
              className="flex items-center space-x-2"
              data-testid="button-find-nearby"
            >
              <Search size={16} />
              <span>Find Nearby</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleAddLocation}
              className="flex items-center space-x-2"
              data-testid="button-add-location"
            >
              <Plus size={16} />
              <span>Add Location</span>
            </Button>

            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-muted-foreground" />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-40" data-testid="select-map-filter">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="donation">Food Donations</SelectItem>
                  <SelectItem value="request">Medical Supplies</SelectItem>
                  <SelectItem value="volunteer">Volunteer Opportunities</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
