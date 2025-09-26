import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { insertDonationSchema } from "@shared/schema";
import { 
  Home, 
  Plus, 
  Bed,
  Shield,
  Users,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Key
} from "lucide-react";

const homeOfferSchema = insertDonationSchema.extend({
  locationAddress: z.string().min(1, "Location is required"),
  homeType: z.string().optional(),
  capacity: z.number().optional(),
  duration: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  restrictions: z.string().optional(),
  availability: z.string().optional(),
});

type HomeOfferData = z.infer<typeof homeOfferSchema>;

const homeTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "Single Family House" },
  { value: "room", label: "Single Room" },
  { value: "basement", label: "Basement/Studio" },
  { value: "guest_house", label: "Guest House" },
  { value: "commercial", label: "Commercial Space" },
  { value: "community_center", label: "Community Center" },
  { value: "shelter", label: "Temporary Shelter" },
];

const durationOptions = [
  { value: "emergency", label: "Emergency (1-7 days)" },
  { value: "short", label: "Short-term (1-4 weeks)" },
  { value: "medium", label: "Medium-term (1-6 months)" },
  { value: "long", label: "Long-term (6+ months)" },
  { value: "temporary", label: "Temporary/As needed" },
];

const amenitiesList = [
  "Electricity", "Water", "Heating", "Cooling", "Kitchen", "Bathroom", 
  "Furnished", "Internet", "Parking", "Pet-friendly", "Accessible", "Security"
];

export default function Homes() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<HomeOfferData>({
    resolver: zodResolver(homeOfferSchema),
    defaultValues: {
      type: "shelter",
      title: "",
      description: "",
      locationAddress: "",
      homeType: "apartment",
      capacity: 0,
      duration: "emergency",
      amenities: [],
      restrictions: "",
      availability: "",
    },
  });

  // Fetch user's home offers
  const { data: userOffers = [], isLoading: offersLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.DONATIONS, { userId: user?.id, type: 'shelter' }],
    enabled: !!user?.id,
  });

  // Fetch shelter requests
  const { data: shelterRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.REQUESTS, { type: 'shelter' }],
  });

  // Create home offer mutation
  const createOfferMutation = useMutation({
    mutationFn: async (data: HomeOfferData) => {
      const { locationAddress, homeType, capacity, duration, amenities, restrictions, availability, ...donationData } = data;
      
      donationData.location = {
        address: locationAddress,
        lat: 0,
        lng: 0,
      };

      // Add home-specific metadata
      const metadata = { homeType, capacity, duration, amenities, restrictions, availability };

      const response = await apiRequest("POST", API_ENDPOINTS.DONATIONS, {
        ...donationData,
        quantity: capacity,
        metadata,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Home Listed! 🏠",
        description: "Your vacant home is now available to help those in need of shelter.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.DONATIONS] });
      setShowOfferForm(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to list home offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HomeOfferData) => {
    createOfferMutation.mutate(data);
  };

  const stats = [
    { label: "Homes Offered", value: Array.isArray(userOffers) ? userOffers.length : 0, icon: Home },
    { label: "People Housed", value: "47", icon: Users },
    { label: "Safe Nights", value: "892", icon: Bed },
    { label: "Community Safety", value: "98%", icon: Shield },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getDurationColor = (duration: string) => {
    const colors: Record<string, string> = {
      emergency: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      short: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      long: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      temporary: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    };
    return colors[duration] || 'bg-secondary text-secondary-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`pt-16${sidebarOpen ? ' lg:ml-64' : ' ml-0'}`}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <Home className="text-orange-500" size={32} />
                <span>Vacant Homes</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Provide temporary shelter and housing solutions for those in need
              </p>
            </div>
            
            <Dialog open={showOfferForm} onOpenChange={setShowOfferForm}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-orange-500 hover:bg-orange-600 text-white" data-testid="button-offer-home">
                  <Plus className="mr-2" size={18} />
                  Offer Home
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Offer Temporary Housing</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="homeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-home-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {homeTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Safe Family Apartment, Emergency Shelter Room" {...field} data-testid="input-home-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the space, condition, and what you're offering..." {...field} data-testid="textarea-home-description" value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Property address (privacy protected)" {...field} data-testid="input-home-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Maximum number of people you can house"
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                data-testid="input-home-capacity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-home-duration">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {durationOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Amenities</FormLabel>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {amenitiesList.map((amenity) => (
                              <label key={amenity} className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.value?.includes(amenity) || false}
                                  onChange={(e) => {
                                    const current = field.value || [];
                                    if (e.target.checked) {
                                      field.onChange([...current, amenity]);
                                    } else {
                                      field.onChange(current.filter(a => a !== amenity));
                                    }
                                  }}
                                  className="rounded border border-border"
                                />
                                <span>{amenity}</span>
                              </label>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restrictions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restrictions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any restrictions, requirements, or special conditions..." {...field} data-testid="textarea-home-restrictions" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Immediate, Starting next week, Call first" {...field} data-testid="input-home-availability" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowOfferForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                        disabled={createOfferMutation.isPending}
                        data-testid="button-submit-home-offer"
                      >
                        {createOfferMutation.isPending ? "Listing..." : "Offer Home"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Tabs defaultValue="my-offers" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="my-offers" data-testid="tab-my-offers">My Offers</TabsTrigger>
                <TabsTrigger value="requests" data-testid="tab-shelter-requests">Shelter Requests</TabsTrigger>
                <TabsTrigger value="safety" data-testid="tab-safety-resources">Safety & Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="my-offers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Key className="text-orange-500" size={20} />
                      <span>My Home Offers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {offersLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-40 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : userOffers.length === 0 ? (
                      <div className="text-center py-12">
                        <Home className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Homes Offered</h3>
                        <p className="text-muted-foreground">
                          Help provide shelter by offering your vacant property to those in need.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userOffers.map((offer: any, index: number) => (
                          <motion.div
                            key={offer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                    {homeTypes.find(t => t.value === offer.metadata?.homeType)?.label || 'Property'}
                                  </Badge>
                                  {offer.metadata?.duration && (
                                    <Badge className={`text-xs ${getDurationColor(offer.metadata.duration)}`}>
                                      {durationOptions.find(d => d.value === offer.metadata.duration)?.label}
                                    </Badge>
                                  )}
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{offer.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {offer.description}
                                </p>

                                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                                  {offer.quantity && (
                                    <div className="flex items-center space-x-2">
                                      <Users size={14} />
                                      <span>Capacity: {offer.quantity} people</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-2">
                                    <MapPin size={14} />
                                    <span className="truncate">{offer.location?.address}</span>
                                  </div>

                                  {offer.metadata?.amenities && offer.metadata.amenities.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {offer.metadata.amenities.slice(0, 3).map((amenity: string) => (
                                        <Badge key={amenity} variant="outline" className="text-xs">
                                          {amenity}
                                        </Badge>
                                      ))}
                                      {offer.metadata.amenities.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{offer.metadata.amenities.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Clock size={12} />
                                    <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <Badge variant={offer.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                    {offer.status}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bed className="text-destructive" size={20} />
                      <span>Shelter Requests</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requestsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-32 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : shelterRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Bed className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Shelter Requests</h3>
                        <p className="text-muted-foreground">
                          Currently no urgent shelter needs in your area.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shelterRequests.map((request: any, index: number) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getUrgencyColor(request.urgency)}`}
                                  >
                                    {request.urgency} priority
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    Shelter Needed
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{request.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {request.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                  {request.location && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin size={12} />
                                      <span>{request.location.address}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <Clock size={12} />
                                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white" data-testid={`button-provide-shelter-${request.id}`}>
                                  <Home className="mr-2" size={14} />
                                  Provide Shelter
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="safety">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="text-green-500" size={20} />
                      <span>Safety & Resources</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-6">
                          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4">Safety Guidelines</h3>
                          <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
                            <li className="flex items-start space-x-2">
                              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Always verify identity through our platform before meeting</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Conduct initial meetings in public, safe locations</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Set clear expectations and boundaries upfront</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Keep emergency contacts informed</span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">Legal Considerations</h3>
                          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                            <li className="flex items-start space-x-2">
                              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Check local housing regulations and tenant rights</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Consider basic rental agreements for longer stays</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Verify insurance coverage for temporary occupants</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Understand liability and property protection rights</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-6">
                          <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-4">Emergency Resources</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-purple-700 dark:text-purple-300">National Emergency Helpline</span>
                              <span className="font-medium text-purple-800 dark:text-purple-200">911</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-700 dark:text-purple-300">Housing Crisis Hotline</span>
                              <span className="font-medium text-purple-800 dark:text-purple-200">1-800-HOME</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-700 dark:text-purple-300">Legal Aid Services</span>
                              <span className="font-medium text-purple-800 dark:text-purple-200">211</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-700 dark:text-purple-300">Mental Health Support</span>
                              <span className="font-medium text-purple-800 dark:text-purple-200">988</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-6">
                          <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-4">Community Impact</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700 dark:text-orange-300">Families Housed This Month</span>
                              <span className="font-medium text-orange-800 dark:text-orange-200">23</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700 dark:text-orange-300">Average Stay Duration</span>
                              <span className="font-medium text-orange-800 dark:text-orange-200">3.2 weeks</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700 dark:text-orange-300">Success Rate</span>
                              <span className="font-medium text-orange-800 dark:text-orange-200">94%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700 dark:text-orange-300">Safety Rating</span>
                              <span className="font-medium text-orange-800 dark:text-orange-200">4.9/5</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      <AIChatbot />
    </div>
  );
}
