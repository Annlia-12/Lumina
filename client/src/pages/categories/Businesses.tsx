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
import { API_ENDPOINTS, DONATION_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { insertDonationSchema } from "@shared/schema";
import { 
  Store, 
  Plus, 
  Clock,
  Package,
  Utensils,
  AlertTriangle,
  MapPin,
  Calendar,
  Truck,
  Leaf,
  Map
} from "lucide-react";

const donationFormSchema = insertDonationSchema.extend({
  locationAddress: z.string().optional(),
  expiryDate: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationFormSchema>;

export default function Businesses() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar open by default
  const [showDonationForm, setShowDonationForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      type: "food",
      title: "",
      description: "",
      quantity: undefined,
      locationAddress: "",
      expiryDate: "",
    },
  });

  // Fetch user's donations
  const { data: userDonations = [], isLoading: donationsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.DONATIONS, { userId: user?.id }],
    enabled: !!user?.id,
  });
  const userDonationsArr = userDonations as any[];

  // Fetch active requests
  const { data: activeRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.REQUESTS],
  });
  const activeRequestsArr = activeRequests as any[];

  // Create donation mutation
  const createDonationMutation = useMutation({
    mutationFn: async (data: DonationFormData) => {
      const { locationAddress, expiryDate, ...donationData } = data;
      
      // Add location if provided
      if (locationAddress) {
        donationData.location = {
          address: locationAddress,
          lat: 0,
          lng: 0,
        };
      }

      // Add expiry date if provided
      if (expiryDate) {
        (donationData as any).expiryDate = new Date(expiryDate);
      }

      const response = await apiRequest("POST", API_ENDPOINTS.DONATIONS, donationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Donation Listed! 🎉",
        description: "Your surplus items are now available for pickup by organizations in need.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.DONATIONS] });
      setShowDonationForm(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to list donation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DonationFormData) => {
    createDonationMutation.mutate(data);
  };

  const stats = [
    { label: "Items Donated", value: userDonationsArr.length, icon: Package },
    { label: "Waste Reduced", value: "2.8 tons", icon: Leaf },
    { label: "Organizations Helped", value: "15", icon: Store },
    { label: "Pickup Requests", value: "42", icon: Truck },
  ];

  // Categorize donations by urgency (based on expiry)
  const urgentDonations = userDonationsArr.filter((donation: any) => {
    if (!donation.expiryDate) return false;
    const expiryTime = new Date(donation.expiryDate).getTime();
    const now = new Date().getTime();
    const hoursUntilExpiry = (expiryTime - now) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  });

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: 'none', color: 'bg-secondary text-secondary-foreground' };
    
    const expiryTime = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    const hoursUntilExpiry = (expiryTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry <= 0) return { status: 'expired', color: 'bg-destructive text-destructive-foreground' };
    if (hoursUntilExpiry <= 24) return { status: 'urgent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' };
    if (hoursUntilExpiry <= 72) return { status: 'soon', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' };
    return { status: 'fresh', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' };
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
                <Store className="text-accent" size={32} />
                <span>Business Partners</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Reduce waste by donating surplus food and resources to communities in need
              </p>
            </div>
            
            <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0" data-testid="button-create-donation">
                  <Plus className="mr-2" size={18} />
                  List Surplus Items
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>List Surplus Items</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-donation-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="food">Food Items</SelectItem>
                              <SelectItem value="other">Other Supplies</SelectItem>
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
                            <Input placeholder="e.g., Fresh Vegetables, Packaged Meals" {...field} data-testid="input-donation-title" />
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
                            <Textarea placeholder="Describe the items, condition, and any special requirements..." {...field} data-testid="textarea-donation-description" value={field.value === null ? "" : field.value} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Number of items/portions" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-donation-quantity"
                              value={field.value === null ? "" : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("type") === "food" && (
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field}
                                data-testid="input-expiry-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="locationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Your business address" {...field} data-testid="input-donation-location" />
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
                        className="flex-1"
                        disabled={createDonationMutation.isPending}
                        data-testid="button-submit-donation"
                      >
                        {createDonationMutation.isPending ? "Listing..." : "List Items"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Urgent Donations Alert */}
          {urgentDonations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-orange-600" size={24} />
                    <div>
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                        Urgent: {urgentDonations.length} items expiring within 24 hours
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        These items need immediate pickup to prevent waste
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
                      <stat.icon className="h-8 w-8 text-accent" />
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
            <Tabs defaultValue="donations" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="donations" className="flex items-center space-x-2">
                  <Package size={16} />
                  <span>My Donations</span>
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-2">
                  <Map size={16} />
                  <span>Find Nearby</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="donations" className="space-y-6">
                {/* My Donations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="text-accent" size={24} />
                  <span>My Listed Items</span>
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
                ) : userDonationsArr.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">No Items Listed</h3>
                    <p className="text-muted-foreground">
                      Start reducing waste by listing your surplus items for donation.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userDonationsArr.map((donation: any, index: number) => (
                      <motion.div
                        key={donation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant="secondary" className="text-xs">
                                {DONATION_TYPES[donation.type as keyof typeof DONATION_TYPES]}
                              </Badge>
                              {donation.expiryDate && (
                                <Badge className={`text-xs ${getExpiryStatus(donation.expiryDate).color}`}>
                                  {getExpiryStatus(donation.expiryDate).status === 'urgent' ? 'Expires Soon!' :
                                   getExpiryStatus(donation.expiryDate).status === 'expired' ? 'Expired' :
                                   getExpiryStatus(donation.expiryDate).status === 'soon' ? 'Expires in 3 days' : 'Fresh'}
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
                                  <Package size={14} />
                                  <span>{donation.quantity} items</span>
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
                                  <Clock size={14} />
                                  <span>
                                    Expires: {new Date(donation.expiryDate).toLocaleDateString()} at{' '}
                                    {new Date(donation.expiryDate).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar size={12} />
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

            {/* Active Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="text-primary" size={24} />
                  <span>Current Community Needs</span>
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
                ) : activeRequestsArr.length === 0 ? (
                  <div className="text-center py-12">
                    <Utensils className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">No Active Requests</h3>
                    <p className="text-muted-foreground">
                      Check back soon to see what your community needs.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeRequestsArr.filter((request: any) => request.type === 'food' || request.type === 'other').slice(0, 6).map((request: any, index: number) => (
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
                            </div>
                            
                            <h4 className="font-semibold mb-2 text-sm line-clamp-2">{request.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {request.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              {request.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin size={10} />
                                  <span className="truncate">{request.location.address}</span>
                                </div>
                              )}
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
