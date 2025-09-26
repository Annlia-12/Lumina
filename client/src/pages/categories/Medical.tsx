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
import { API_ENDPOINTS, URGENCY_LEVELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { insertDonationSchema, insertActivitySchema } from "@shared/schema";
import { 
  Hospital, 
  Plus, 
  Heart,
  Stethoscope,
  Shield,
  Ambulance,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Calendar,
  Map
} from "lucide-react";

const medicalDonationSchema = insertDonationSchema.extend({
  locationAddress: z.string().optional(),
});

const medicalActivitySchema = insertActivitySchema.extend({
  locationAddress: z.string().min(1, "Location is required"),
});

type MedicalDonationData = z.infer<typeof medicalDonationSchema>;
type MedicalActivityData = z.infer<typeof medicalActivitySchema>;

export default function Medical() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const donationForm = useForm<MedicalDonationData>({
    resolver: zodResolver(medicalDonationSchema),
    defaultValues: {
      type: "medical",
      title: "",
      description: "",
      quantity: 0,
      locationAddress: "",
    },
  });

  const serviceForm = useForm<MedicalActivityData>({
    resolver: zodResolver(medicalActivitySchema),
    defaultValues: {
      title: "",
      description: "",
      locationAddress: "",
      startTime: undefined,
      endTime: undefined,
      maxVolunteers: 0,
      skills: [],
    },
  });

  // Fetch user's donations
  const { data: userDonations = [], isLoading: donationsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.DONATIONS, { userId: user?.id, type: 'medical' }],
    enabled: !!user?.id,
  });

  // Fetch medical requests
  const { data: medicalRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.REQUESTS, { type: 'medical' }],
  });

  // Fetch medical activities
  const { data: medicalServices = [], isLoading: servicesLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.ACTIVITIES, { medical: true }],
  });

  // Create donation mutation
  const createDonationMutation = useMutation({
    mutationFn: async (data: MedicalDonationData) => {
      const { locationAddress, ...donationData } = data;
      
      if (locationAddress) {
        donationData.location = {
          address: locationAddress,
          lat: 0,
          lng: 0,
        };
      }

      const response = await apiRequest("POST", API_ENDPOINTS.DONATIONS, donationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Medical Supplies Listed! 🏥",
        description: "Your medical supplies are now available for healthcare organizations.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.DONATIONS] });
      setShowDonationForm(false);
      donationForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to list medical supplies. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create medical service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: MedicalActivityData) => {
      const { locationAddress, startTime, endTime, ...activityData } = data;
      activityData.location = {
        address: locationAddress,
        lat: 0,
        lng: 0,
      };
      // Add startTime and endTime to payload
      const payload = {
        ...activityData,
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
      };
      const response = await apiRequest("POST", API_ENDPOINTS.ACTIVITIES, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Medical Service Created! 🩺",
        description: "Your medical service is now available for the community.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVITIES] });
      setShowServiceForm(false);
      serviceForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create medical service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitDonation = (data: MedicalDonationData) => {
    createDonationMutation.mutate(data);
  };

  const onSubmitService = (data: MedicalActivityData) => {
    createServiceMutation.mutate(data);
  };

  const stats = [
    { label: "Supplies Donated", value: Array.isArray(userDonations) ? userDonations.length : 0, icon: Stethoscope },
    { label: "People Treated", value: "248", icon: Heart },
    { label: "Emergency Responses", value: "12", icon: Ambulance },
    { label: "Health Camps", value: "8", icon: Shield },
  ];

  const emergencyRequests = Array.isArray(medicalRequests)
    ? medicalRequests.filter((req: any) => req.urgency === 'emergency')
    : [];

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
                <Hospital className="text-primary" size={32} />
                <span>Healthcare Providers</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Provide medical supplies, services, and emergency response coordination
              </p>
            </div>
            
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-donate-supplies">
                    <Stethoscope className="mr-2" size={18} />
                    Donate Supplies
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Donate Medical Supplies</DialogTitle>
                  </DialogHeader>
                  <Form {...donationForm}>
                    <form onSubmit={donationForm.handleSubmit(onSubmitDonation)} className="space-y-4">
                      <FormField
                        control={donationForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplies Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., PPE, Medications, Equipment" {...field} data-testid="input-supplies-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={donationForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the medical supplies, condition, expiry dates..." {...field} data-testid="textarea-supplies-description" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={donationForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Number of units" 
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                data-testid="input-supplies-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={donationForm.control}
                        name="locationAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Pickup location" {...field} data-testid="input-supplies-location" />
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
                          data-testid="button-submit-supplies"
                        >
                          {createDonationMutation.isPending ? "Listing..." : "List Supplies"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
                <DialogTrigger asChild>
                  <Button data-testid="button-offer-service">
                    <Plus className="mr-2" size={18} />
                    Offer Medical Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Offer Medical Service</DialogTitle>
                  </DialogHeader>
                  <Form {...serviceForm}>
                    <form onSubmit={serviceForm.handleSubmit(onSubmitService)} className="space-y-4">
                      <FormField
                        control={serviceForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Free Health Camp, Emergency Response" {...field} data-testid="input-service-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the medical service, requirements, what you'll provide..." {...field} data-testid="textarea-service-description" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={serviceForm.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} data-testid="input-service-start" value={typeof field.value === 'string' ? field.value : ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={serviceForm.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} data-testid="input-service-end" value={typeof field.value === 'string' ? field.value : ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={serviceForm.control}
                        name="locationAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Service location address" {...field} data-testid="input-service-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceForm.control}
                        name="maxVolunteers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Participants (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Maximum number of people you can serve" 
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                data-testid="input-max-participants"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowServiceForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={createServiceMutation.isPending}
                          data-testid="button-submit-service"
                        >
                          {createServiceMutation.isPending ? "Creating..." : "Offer Service"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Emergency Alert */}
          {emergencyRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-destructive" size={24} />
                    <div>
                      <h3 className="font-semibold text-destructive">
                        Medical Emergency: {emergencyRequests.length} urgent requests
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Critical medical supplies or services needed immediately
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
                      <stat.icon className="h-8 w-8 text-primary" />
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
            <Tabs defaultValue="requests" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="requests" data-testid="tab-medical-requests">Medical Requests</TabsTrigger>
                <TabsTrigger value="supplies" data-testid="tab-my-supplies">My Supplies</TabsTrigger>
                <TabsTrigger value="services" data-testid="tab-medical-services">Medical Services</TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-2" data-testid="tab-map">
                  <Map size={16} />
                  <span>Find Nearby</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Ambulance className="text-destructive" size={20} />
                      <span>Medical Requests</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requestsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-40 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : medicalRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Hospital className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Medical Requests</h3>
                        <p className="text-muted-foreground">
                          No medical assistance requests at the moment.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {medicalRequests.map((request: any, index: number) => (
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
                                    Medical
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

                                <Button size="sm" className="w-full" data-testid={`button-respond-${request.id}`}>
                                  <Shield className="mr-2" size={14} />
                                  Provide Assistance
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

              <TabsContent value="supplies">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Stethoscope className="text-primary" size={20} />
                      <span>My Medical Supplies</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {donationsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-32 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : userDonations.length === 0 ? (
                      <div className="text-center py-12">
                        <Stethoscope className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Supplies Listed</h3>
                        <p className="text-muted-foreground">
                          Start by donating medical supplies to help healthcare organizations.
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
                                  <Badge variant="secondary" className="text-xs">
                                    Medical Supplies
                                  </Badge>
                                  <Badge variant={donation.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                    {donation.status}
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{donation.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {donation.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Clock size={12} />
                                    <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  {donation.quantity && (
                                    <span>{donation.quantity} units</span>
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

              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="text-accent" size={20} />
                      <span>Medical Services</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {servicesLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-32 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : medicalServices.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Medical Services</h3>
                        <p className="text-muted-foreground mb-4">
                          Be the first to offer medical services to your community.
                        </p>
                        <Button onClick={() => setShowServiceForm(true)}>
                          <Plus className="mr-2" size={16} />
                          Offer Medical Service
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {medicalServices.map((service: any, index: number) => (
                          <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  <Badge variant="secondary" className="text-xs">
                                    Medical Service
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {service.status}
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{service.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {service.description}
                                </p>

                                <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-2">
                                    <Calendar size={14} />
                                    <span>
                                      {new Date(service.startTime).toLocaleDateString()} at{' '}
                                      {new Date(service.startTime).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <MapPin size={14} />
                                    <span className="truncate">{service.location?.address}</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Users size={14} />
                                    <span>
                                      {service.currentVolunteers || 0}
                                      {service.maxVolunteers && ` / ${service.maxVolunteers}`} participants
                                    </span>
                                  </div>
                                </div>

                                <Button size="sm" className="w-full" data-testid={`button-join-${service.id}`}>
                                  <Heart className="mr-2" size={14} />
                                  Get Medical Care
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
