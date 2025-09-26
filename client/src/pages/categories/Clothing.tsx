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
  Shirt, 
  Plus, 
  Package,
  Recycle,
  Users,
  MapPin,
  Clock,
  Scissors,
  Palette,
  Star,
  Map
} from "lucide-react";

const clothingDonationSchema = insertDonationSchema.extend({
  locationAddress: z.string().optional(),
  size: z.string().optional(),
  condition: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  gender: z.string().optional(),
});

type ClothingDonationData = z.infer<typeof clothingDonationSchema>;

const clothingCategories = [
  { value: "shirts", label: "Shirts & Tops" },
  { value: "pants", label: "Pants & Bottoms" },
  { value: "dresses", label: "Dresses & Skirts" },
  { value: "outerwear", label: "Jackets & Coats" },
  { value: "shoes", label: "Shoes & Footwear" },
  { value: "accessories", label: "Accessories" },
  { value: "children", label: "Children's Clothing" },
  { value: "formal", label: "Formal Wear" },
  { value: "winter", label: "Winter Clothing" },
  { value: "other", label: "Other" },
];

const clothingSizes = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "xxl", label: "XXL" },
  { value: "children", label: "Children's" },
  { value: "mixed", label: "Mixed Sizes" },
];

const clothingConditions = [
  { value: "new", label: "New with tags" },
  { value: "excellent", label: "Excellent condition" },
  { value: "good", label: "Good condition" },
  { value: "fair", label: "Fair condition" },
  { value: "vintage", label: "Vintage/Antique" },
];

const genderOptions = [
  { value: "unisex", label: "Unisex" },
  { value: "men", label: "Men's" },
  { value: "women", label: "Women's" },
  { value: "children", label: "Children's" },
];

export default function Clothing() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClothingDonationData>({
    resolver: zodResolver(clothingDonationSchema),
    defaultValues: {
      type: "clothing",
      title: "",
      description: "",
      quantity: 0,
      locationAddress: "",
      size: "m",
      condition: "good",
      category: "shirts",
      color: "",
      gender: "unisex",
    },
  });

  // Fetch user's donations
  const { data: userDonations = [], isLoading: donationsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.DONATIONS, { userId: user?.id, type: 'clothing' }],
    enabled: !!user?.id,
  });

  // Fetch clothing requests
  const { data: clothingRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.REQUESTS, { type: 'clothing' }],
  });

  // Create donation mutation
  const createDonationMutation = useMutation({
    mutationFn: async (data: ClothingDonationData) => {
      const { locationAddress, size, condition, category, color, gender, ...donationData } = data;
      
      if (locationAddress) {
        donationData.location = {
          address: locationAddress,
          lat: 0,
          lng: 0,
        };
      }

      // Add clothing-specific metadata
      const metadata = { size, condition, category, color, gender };
      
      const response = await apiRequest("POST", API_ENDPOINTS.DONATIONS, {
        ...donationData,
        metadata,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clothing Donation Listed! 👕",
        description: "Your clothing items are now available for those in need.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.DONATIONS] });
      setShowDonationForm(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to list clothing donation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClothingDonationData) => {
    createDonationMutation.mutate(data);
  };

  const stats = [
    { label: "Items Donated", value: Array.isArray(userDonations) ? userDonations.length : 0, icon: Package },
    { label: "People Clothed", value: "89", icon: Users },
    { label: "Textile Waste Reduced", value: "145 kg", icon: Recycle },
    { label: "Fashion Impact", value: "5★", icon: Star },
  ];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'excellent': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'good': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'fair': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'vintage': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-secondary text-secondary-foreground';
    }
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
                <Shirt className="text-purple-500" size={32} />
                <span>Clothing Stores & Factories</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Reduce textile waste by donating surplus clothing and supporting sustainable fashion
              </p>
            </div>
            
            <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-purple-500 hover:bg-purple-600 text-white" data-testid="button-donate-clothing">
                  <Plus className="mr-2" size={18} />
                  Donate Clothing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Donate Clothing Items</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clothing Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-clothing-category">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clothingCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
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
                          <FormLabel>Item Description</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Winter Jackets, Business Shirts, Children's Dresses" {...field} data-testid="input-clothing-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Size</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-clothing-size">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clothingSizes.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label}
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
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-clothing-gender">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {genderOptions.map((option) => (
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
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-clothing-condition">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clothingConditions.map((condition) => (
                                <SelectItem key={condition.value} value={condition.value}>
                                  {condition.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Number of items"
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                data-testid="input-clothing-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Blue, Mixed" {...field} data-testid="input-clothing-color" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the clothing items, brand, style, any special features..." {...field} data-testid="textarea-clothing-description" value={field.value ?? ""} />
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
                          <FormLabel>Pickup Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Your store/warehouse address" {...field} data-testid="input-clothing-location" />
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
                        className="flex-1 bg-purple-500 hover:bg-purple-600"
                        disabled={createDonationMutation.isPending}
                        data-testid="button-submit-clothing"
                      >
                        {createDonationMutation.isPending ? "Listing..." : "Donate Items"}
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
                      <stat.icon className="h-8 w-8 text-purple-500" />
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
            <Tabs defaultValue="donations" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="donations" data-testid="tab-my-donations">My Donations</TabsTrigger>
                <TabsTrigger value="requests" data-testid="tab-clothing-requests">Clothing Requests</TabsTrigger>
                <TabsTrigger value="impact" data-testid="tab-sustainability">Sustainability Impact</TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-2" data-testid="tab-map">
                  <Map size={16} />
                  <span>Find Nearby</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="donations">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="text-purple-500" size={20} />
                      <span>My Clothing Donations</span>
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
                        <Shirt className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Clothing Donations</h3>
                        <p className="text-muted-foreground">
                          Start reducing textile waste by donating surplus clothing items.
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
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    {clothingCategories.find(c => c.value === donation.metadata?.category)?.label || 'Clothing'}
                                  </Badge>
                                  {donation.metadata?.condition && (
                                    <Badge className={`text-xs ${getConditionColor(donation.metadata.condition)}`}>
                                      {clothingConditions.find(c => c.value === donation.metadata.condition)?.label}
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
                                  
                                  {donation.metadata?.size && (
                                    <div className="flex items-center space-x-2">
                                      <Scissors size={14} />
                                      <span>Size: {clothingSizes.find(s => s.value === donation.metadata.size)?.label}</span>
                                    </div>
                                  )}

                                  {donation.metadata?.color && (
                                    <div className="flex items-center space-x-2">
                                      <Palette size={14} />
                                      <span>Color: {donation.metadata.color}</span>
                                    </div>
                                  )}

                                  {donation.location && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin size={14} />
                                      <span className="truncate">{donation.location.address}</span>
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
              </TabsContent>

              <TabsContent value="requests">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="text-accent" size={20} />
                      <span>Clothing Requests</span>
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
                    ) : clothingRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Shirt className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Clothing Requests</h3>
                        <p className="text-muted-foreground">
                          Check back soon to see what clothing items your community needs.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clothingRequests.map((request: any, index: number) => (
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
                                    className={`text-xs ${
                                      request.urgency === 'emergency' ? 'bg-destructive text-destructive-foreground' :
                                      request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                      'bg-secondary text-secondary-foreground'
                                    }`}
                                  >
                                    {request.urgency} priority
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    Clothing
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

                                <Button size="sm" className="w-full bg-purple-500 hover:bg-purple-600 text-white" data-testid={`button-fulfill-${request.id}`}>
                                  <Shirt className="mr-2" size={14} />
                                  Provide Clothing
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

              <TabsContent value="impact">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Recycle className="text-green-500" size={20} />
                      <span>Sustainability Impact</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-6">
                          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4">Environmental Impact</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700 dark:text-green-300">CO2 Emissions Saved</span>
                              <span className="font-medium text-green-800 dark:text-green-200">2.3 tons</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700 dark:text-green-300">Water Conserved</span>
                              <span className="font-medium text-green-800 dark:text-green-200">15,000 liters</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700 dark:text-green-300">Landfill Waste Diverted</span>
                              <span className="font-medium text-green-800 dark:text-green-200">145 kg</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">Social Impact</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Families Supported</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">67</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Job Interviews Enabled</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">23</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">School Children Supported</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">156</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-6">
                          <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-4">Circular Economy</h3>
                          <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                            Your clothing donations contribute to a circular fashion economy, extending the lifecycle of textiles and reducing the need for new production.
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">98%</div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">Items Reused</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">2.5x</div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">Extended Lifecycle</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-6">
                          <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-4">Quality Distribution</h3>
                          <div className="space-y-2">
                            {clothingConditions.map((condition, index) => (
                              <div key={condition.value} className="flex items-center justify-between">
                                <span className="text-sm text-orange-700 dark:text-orange-300">{condition.label}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 h-2 bg-orange-200 dark:bg-orange-800 rounded-full">
                                    <div 
                                      className="h-full bg-orange-500 rounded-full" 
                                      style={{ width: `${Math.max(10, (5 - index) * 20)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-orange-600 dark:text-orange-400">
                                    {Math.max(5, (5 - index) * 8)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
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
