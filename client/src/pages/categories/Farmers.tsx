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
import { DonationMap } from "@/components/map/DonationMap";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { insertDonationSchema } from "@shared/schema";
import { 
  Leaf, 
  Plus, 
  Apple,
  Wheat,
  Sun,
  Droplets,
  MapPin,
  Clock,
  Truck,
  Calendar,
  TrendingUp,
  Map
} from "lucide-react";

const farmDonationSchema = insertDonationSchema.extend({
  locationAddress: z.string().optional(),
  harvestDate: z.string().optional(),
  season: z.string().optional(),
});

type FarmDonationData = z.infer<typeof farmDonationSchema>;

const seasons = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "monsoon", label: "Monsoon" },
  { value: "winter", label: "Winter" },
];

const produceTypes = [
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "grains", label: "Grains" },
  { value: "dairy", label: "Dairy Products" },
  { value: "herbs", label: "Herbs & Spices" },
  { value: "other", label: "Other Produce" },
];

export default function Farmers() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FarmDonationData>({
    resolver: zodResolver(farmDonationSchema),
    defaultValues: {
      type: "food",
      title: "",
      description: "",
      quantity: undefined,
      locationAddress: "",
      harvestDate: "",
      season: "summer",
    },
  });

  // Fetch user's donations
  const { data: userDonationsRaw, isLoading: donationsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.DONATIONS, { userId: user?.id }],
    enabled: !!user?.id,
  });
  const userDonations: any[] = userDonationsRaw ?? [];

  // Fetch food requests
  const { data: foodRequestsRaw, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.REQUESTS, { type: 'food' }],
  });
  const foodRequests: any[] = foodRequestsRaw ?? [];

  // Create donation mutation
  const createDonationMutation = useMutation({
    mutationFn: async (data: FarmDonationData) => {
      const { locationAddress, harvestDate, season, ...donationData } = data;
      
      if (locationAddress) {
        donationData.location = {
          address: locationAddress,
          lat: 0,
          lng: 0,
        };
      }

      // Add harvest date as expiry if provided
      if (harvestDate) {
        donationData.expiryDate = new Date(harvestDate);
      }

      const response = await apiRequest("POST", API_ENDPOINTS.DONATIONS, donationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fresh Produce Listed! 🌱",
        description: "Your farm produce is now available for communities in need.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.DONATIONS] });
      setShowDonationForm(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to list produce. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FarmDonationData) => {
    createDonationMutation.mutate(data);
  };

  const stats = [
    { label: "Produce Shared", value: userDonations.length + " batches", icon: Apple },
    { label: "Families Fed", value: "320", icon: Wheat },
    { label: "Seasonal Impact", value: "4 seasons", icon: Sun },
    { label: "Food Waste Saved", value: "1.2 tons", icon: Leaf },
  ];

  // Get fresh produce (within 7 days of harvest)
  const freshProduce = userDonations.filter((donation: any) => {
    if (!donation.expiryDate) return false;
    const harvestTime = new Date(donation.expiryDate).getTime();
    const now = new Date().getTime();
    const daysFromHarvest = (now - harvestTime) / (1000 * 60 * 60 * 24);
    return daysFromHarvest >= 0 && daysFromHarvest <= 7;
  });

  const getFreshnessStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: 'unknown', color: 'bg-secondary text-secondary-foreground' };
    
    const harvestTime = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    const daysFromHarvest = (now - harvestTime) / (1000 * 60 * 60 * 24);
    
    if (daysFromHarvest < 0) return { status: 'pre-harvest', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' };
    if (daysFromHarvest <= 2) return { status: 'fresh', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' };
    if (daysFromHarvest <= 7) return { status: 'good', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' };
    return { status: 'aging', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' };
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
                <Leaf className="text-green-500" size={32} />
                <span>Farmers Hub</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Share your fresh harvest and reduce food waste by connecting with communities
              </p>
            </div>
            
            <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-green-500 hover:bg-green-600 text-white" data-testid="button-share-produce">
                  <Plus className="mr-2" size={18} />
                  Share Produce
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Farm Produce</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produce Type</FormLabel>
                          <Select onValueChange={(value) => field.onChange(`${produceTypes.find(p => p.value === value)?.label} - ${value}`)}>
                            <FormControl>
                              <SelectTrigger data-testid="select-produce-type">
                                <SelectValue placeholder="Select produce type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {produceTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormControl>
                            <Input placeholder="e.g., Organic Tomatoes, Fresh Mangoes" {...field} className="mt-2" data-testid="input-produce-title" />
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
                            <Textarea placeholder="Describe the produce quality, organic/conventional, special characteristics..." {...field} data-testid="textarea-produce-description" value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity (kg/units)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Amount available" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                data-testid="input-produce-quantity"
                                value={field.value ?? 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="season"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Season</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-season">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {seasons.map((season) => (
                                  <SelectItem key={season.value} value={season.value}>
                                    {season.label}
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
                      name="harvestDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Harvest/Best Before Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              data-testid="input-harvest-date"
                            />
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
                          <FormLabel>Farm Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Your farm address for pickup" {...field} data-testid="input-farm-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDonationForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        disabled={createDonationMutation.isPending}
                        data-testid="button-submit-produce"
                      >
                        {createDonationMutation.isPending ? "Sharing..." : "Share Produce"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Fresh Produce Alert */}
          {freshProduce.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Apple className="text-green-600" size={24} />
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200">
                        Fresh Harvest: {freshProduce.length} batches ready for pickup
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Farm-fresh produce available now for immediate distribution
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                      <stat.icon className="h-8 w-8 text-green-500" />
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
            className="mb-8"
          >
            <Tabs defaultValue="produce" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="produce" className="flex items-center space-x-2">
                  <Wheat size={16} />
                  <span>My Produce</span>
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-2">
                  <Map size={16} />
                  <span>Find Nearby</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="produce" className="space-y-6">
                {/* My Produce */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wheat className="text-green-500" size={24} />
                  <span>My Shared Produce</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {donationsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-40 bg-muted rounded-lg mb-3"></div>
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : userDonations.length === 0 ? (
                  <div className="text-center py-12">
                    <Wheat className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">No Produce Shared</h3>
                    <p className="text-muted-foreground">
                      Start sharing your farm produce to reduce waste and help communities.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userDonations.map((donation: any, index: number) => (
                      <motion.div
                        key={donation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                Farm Produce
                              </Badge>
                              {donation.expiryDate && (
                                <Badge className={`text-xs ${getFreshnessStatus(donation.expiryDate).color}`}>
                                  {getFreshnessStatus(donation.expiryDate).status === 'fresh' ? 'Just Harvested' :
                                   getFreshnessStatus(donation.expiryDate).status === 'good' ? 'Fresh' :
                                   getFreshnessStatus(donation.expiryDate).status === 'pre-harvest' ? 'Coming Soon' : 'Aging'}
                                </Badge>
                              )}
                            </div>
                            
                            <h4 className="font-semibold mb-2 line-clamp-2">{donation.title}</h4>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                              {donation.description}
                            </p>

                            <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                              {donation.quantity && (
                                <div className="flex items-center space-x-2">
                                  <Wheat size={14} />
                                  <span>{donation.quantity} kg/units available</span>
                                </div>
                              )}
                              
                              {donation.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin size={14} />
                                  <span className="truncate">{donation.location.address}</span>
                                </div>
                              )}

                              {donation.expiryDate && (
                                <div className="flex items-center space-x-2">
                                  <Calendar size={14} />
                                  <span>
                                    Harvested: {new Date(donation.expiryDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock size={12} />
                                <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                              </div>
                              <Badge variant={donation.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                {donation.status}
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

            {/* Food Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Apple className="text-accent" size={24} />
                  <span>Community Food Requests</span>
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
                ) : foodRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Apple className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">No Food Requests</h3>
                    <p className="text-muted-foreground">
                      Check back soon to see what fresh produce your community needs.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {foodRequests.slice(0, 6).map((request: any, index: number) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  request.urgency === 'emergency' ? 'bg-destructive text-destructive-foreground' :
                                  request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                  'bg-secondary text-secondary-foreground'
                                }`}
                              >
                                {request.urgency} priority
                              </Badge>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                Food Needed
                              </Badge>
                            </div>
                            
                            <h4 className="font-semibold mb-2 text-sm line-clamp-2">{request.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {request.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              {request.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin size={10} />
                                  <span className="truncate">{request.location.address}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <TrendingUp size={10} />
                                <span>Fresh produce preferred</span>
                              </div>
                            </div>

                            <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white" data-testid={`button-fulfill-${request.id}`}>
                              <Truck className="mr-2" size={12} />
                              Supply Produce
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

              <TabsContent value="map">
                <DonationMap 
                  onLocationSelect={(location) => console.log('Selected location:', location)}
                  userLocation={undefined}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      <AIChatbot />
    </div>
  );
}
