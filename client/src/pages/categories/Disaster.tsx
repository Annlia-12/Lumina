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
import { API_ENDPOINTS, DONATION_TYPES, URGENCY_LEVELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { insertDonationSchema, insertRequestSchema, insertActivitySchema } from "@shared/schema";
import { 
  AlertTriangle, 
  Plus, 
  Zap,
  Users,
  MapPin,
  Clock,
  Phone,
  Truck,
  Shield,
  Heart,
  Package,
  Radio,
  Siren
} from "lucide-react";

const emergencyDonationSchema = insertDonationSchema.extend({
  locationAddress: z.string().optional(),
  disasterType: z.string().optional(),
  urgencyLevel: z.string().optional(),
});

const emergencyRequestSchema = insertRequestSchema.extend({
  locationAddress: z.string().optional(),
  disasterType: z.string().optional(),
  impactLevel: z.string().optional(),
  contactPhone: z.string().optional(),
});

const emergencyResponseSchema = insertActivitySchema.extend({
  locationAddress: z.string().min(1, "Location is required"),
  disasterType: z.string().optional(),
  responseType: z.string().optional(),
});

type EmergencyDonationData = z.infer<typeof emergencyDonationSchema>;
type EmergencyRequestData = z.infer<typeof emergencyRequestSchema>;
type EmergencyResponseData = z.infer<typeof emergencyResponseSchema>;

const disasterTypes = [
  { value: "earthquake", label: "Earthquake" },
  { value: "flood", label: "Flood" },
  { value: "hurricane", label: "Hurricane/Cyclone" },
  { value: "wildfire", label: "Wildfire" },
  { value: "tornado", label: "Tornado" },
  { value: "drought", label: "Drought" },
  { value: "landslide", label: "Landslide" },
  { value: "tsunami", label: "Tsunami" },
  { value: "volcanic", label: "Volcanic Eruption" },
  { value: "pandemic", label: "Pandemic/Health Crisis" },
  { value: "conflict", label: "Conflict/War" },
  { value: "other", label: "Other Emergency" },
];

const responseTypes = [
  { value: "search_rescue", label: "Search & Rescue" },
  { value: "medical_aid", label: "Medical Aid" },
  { value: "food_water", label: "Food & Water Distribution" },
  { value: "shelter_setup", label: "Emergency Shelter Setup" },
  { value: "evacuation", label: "Evacuation Assistance" },
  { value: "infrastructure", label: "Infrastructure Repair" },
  { value: "communication", label: "Communication Support" },
  { value: "transportation", label: "Transportation" },
  { value: "psychological", label: "Psychological Support" },
  { value: "coordination", label: "Response Coordination" },
];

const impactLevels = [
  { value: "individual", label: "Individual/Family" },
  { value: "community", label: "Community (50-500 people)" },
  { value: "regional", label: "Regional (500-5000 people)" },
  { value: "major", label: "Major (5000+ people)" },
  { value: "catastrophic", label: "Catastrophic (State/National)" },
];

export default function Disaster() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const donationForm = useForm<EmergencyDonationData>({
    resolver: zodResolver(emergencyDonationSchema),
    defaultValues: {
      type: "other",
      title: "",
      description: "",
      quantity: 0,
      locationAddress: "",
      disasterType: "earthquake",
      urgencyLevel: "emergency",
    },
  });

  const requestForm = useForm<EmergencyRequestData>({
    resolver: zodResolver(emergencyRequestSchema),
    defaultValues: {
      type: "other",
      title: "",
      description: "",
      urgency: "emergency",
      targetQuantity: 0,
      locationAddress: "",
      disasterType: "earthquake",
      impactLevel: "community",
      contactPhone: "",
    },
  });

  const responseForm = useForm<EmergencyResponseData>({
    resolver: zodResolver(emergencyResponseSchema),
    defaultValues: {
      title: "",
      description: "",
      locationAddress: "",
      startTime: undefined,
      endTime: undefined,
      maxVolunteers: 0,
      disasterType: "earthquake",
      responseType: "search_rescue",
    },
  });

  // Fetch emergency supplies
  const { data: emergencySupplies = [], isLoading: suppliesLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.DONATIONS, { type: 'other', emergency: true }],
  });

  // Fetch emergency requests
  const { data: emergencyRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.REQUESTS, { urgency: 'emergency' }],
  });

  // Fetch emergency responses
  const { data: emergencyResponses = [], isLoading: responsesLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.ACTIVITIES, { emergency: true }],
  });

  // Create emergency donation mutation
  const createDonationMutation = useMutation({
    mutationFn: async (data: EmergencyDonationData) => {
      const { locationAddress, disasterType, urgencyLevel, ...donationData } = data;
      
      if (locationAddress) {
        donationData.location = {
          address: locationAddress,
          lat: 0,
          lng: 0,
        };
      }

      // Add emergency-specific metadata
      const metadata = { disasterType, urgencyLevel, emergency: true };

      const response = await apiRequest("POST", API_ENDPOINTS.DONATIONS, {
        ...donationData,
        metadata,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Emergency Supplies Listed! 🚨",
        description: "Your emergency supplies are now available for disaster relief coordination.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.DONATIONS] });
      setShowDonationForm(false);
      donationForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to list emergency supplies. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create emergency request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: EmergencyRequestData) => {
      const { locationAddress, disasterType, impactLevel, contactPhone, ...requestData } = data;
      
      if (locationAddress) {
        requestData.location = {
          address: locationAddress,
          lat: 0,
          lng: 0,
        };
      }

      // Add emergency-specific metadata
      const metadata = { disasterType, impactLevel, contactPhone, emergency: true };

      const response = await apiRequest("POST", API_ENDPOINTS.REQUESTS, {
        ...requestData,
        metadata,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Emergency Request Sent! 🚨",
        description: "Your emergency request has been broadcast to all available responders.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.REQUESTS] });
      
      // Send emergency alert
      apiRequest("POST", "/api/emergency/alert", {
        alertType: requestForm.getValues("disasterType"),
        location: { address: requestForm.getValues("locationAddress") },
        instructions: requestForm.getValues("description"),
      }).catch(console.error);
      
      setShowRequestForm(false);
      requestForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send emergency request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create emergency response mutation
  const createResponseMutation = useMutation({
    mutationFn: async (data: EmergencyResponseData) => {
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
        title: "Emergency Response Activated! 🚨",
        description: "Your emergency response team has been activated and is coordinating relief efforts.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVITIES] });
      setShowResponseForm(false);
      responseForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate emergency response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitDonation = (data: EmergencyDonationData) => {
    createDonationMutation.mutate(data);
  };

  const onSubmitRequest = (data: EmergencyRequestData) => {
    createRequestMutation.mutate(data);
  };

  const onSubmitResponse = (data: EmergencyResponseData) => {
    createResponseMutation.mutate(data);
  };

  const stats = [
    { label: "Active Emergencies", value: emergencyRequests.filter((req: any) => req.urgency === 'emergency').length, icon: AlertTriangle },
    { label: "Response Teams", value: emergencyResponses.length, icon: Users },
    { label: "Emergency Supplies", value: emergencySupplies.length, icon: Package },
    { label: "Lives Saved", value: "127", icon: Heart },
  ];

  const getDisasterColor = (disasterType: string) => {
    const colors: Record<string, string> = {
      earthquake: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      flood: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      hurricane: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      wildfire: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      tornado: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
      drought: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      pandemic: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      conflict: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    };
    return colors[disasterType] || 'bg-destructive/10 text-destructive';
  };

  const emergencyAlerts = emergencyRequests.filter((req: any) => {
    const requestTime = new Date(req.createdAt).getTime();
    const now = new Date().getTime();
    const hoursAgo = (now - requestTime) / (1000 * 60 * 60);
    return hoursAgo <= 6 && req.urgency === 'emergency'; // Emergency requests from last 6 hours
  });

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
                <AlertTriangle className="text-destructive" size={32} />
                <span>Disaster Relief</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Coordinate emergency response and mobilize resources during natural disasters
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
              <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" data-testid="button-donate-supplies">
                    <Package className="mr-2" size={18} />
                    Donate Supplies
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Donate Emergency Supplies</DialogTitle>
                  </DialogHeader>
                  <Form {...donationForm}>
                    <form onSubmit={donationForm.handleSubmit(onSubmitDonation)} className="space-y-4">
                      <FormField
                        control={donationForm.control}
                        name="disasterType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Disaster Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-disaster-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {disasterTypes.map((type) => (
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
                        control={donationForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Supplies</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., First Aid Kits, Water Bottles, Emergency Food" {...field} data-testid="input-supplies-title" />
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
                              <Textarea placeholder="Describe the emergency supplies, quantities, condition..." {...field} data-testid="textarea-supplies-description" value={field.value ?? ""} />
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
                            <FormLabel>Pickup Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Where supplies can be collected" {...field} data-testid="input-supplies-location" />
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
                          className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={createDonationMutation.isPending}
                          data-testid="button-submit-supplies"
                        >
                          {createDonationMutation.isPending ? "Listing..." : "Donate Supplies"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white" data-testid="button-request-help">
                    <Siren className="mr-2" size={18} />
                    Request Help
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Emergency Help Request</DialogTitle>
                  </DialogHeader>
                  <Form {...requestForm}>
                    <form onSubmit={requestForm.handleSubmit(onSubmitRequest)} className="space-y-4">
                      <FormField
                        control={requestForm.control}
                        name="disasterType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-emergency-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {disasterTypes.map((type) => (
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
                        control={requestForm.control}
                        name="impactLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Impact Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-impact-level">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {impactLevels.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={requestForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Summary</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description of the emergency" {...field} data-testid="input-emergency-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={requestForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Detailed Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the situation, immediate needs, number of people affected..." {...field} data-testid="textarea-emergency-description" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={requestForm.control}
                        name="locationAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Exact location of the emergency" {...field} data-testid="input-emergency-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={requestForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number for immediate contact" {...field} data-testid="input-emergency-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRequestForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={createRequestMutation.isPending}
                          data-testid="button-submit-emergency-request"
                        >
                          {createRequestMutation.isPending ? "Sending..." : "Send Emergency Alert"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={showResponseForm} onOpenChange={setShowResponseForm}>
                <DialogTrigger asChild>
                  <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-coordinate-response">
                    <Zap className="mr-2" size={18} />
                    Coordinate Response
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Coordinate Emergency Response</DialogTitle>
                  </DialogHeader>
                  <Form {...responseForm}>
                    <form onSubmit={responseForm.handleSubmit(onSubmitResponse)} className="space-y-4">
                      <FormField
                        control={responseForm.control}
                        name="responseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Response Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-response-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {responseTypes.map((type) => (
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
                        control={responseForm.control}
                        name="disasterType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Disaster Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-response-disaster-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {disasterTypes.map((type) => (
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
                        control={responseForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Operation Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Emergency Search & Rescue Operation" {...field} data-testid="input-response-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={responseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Operation Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the response operation, objectives, requirements..." {...field} data-testid="textarea-response-description" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={responseForm.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} data-testid="input-response-start" value={typeof field.value === 'string' ? field.value : ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={responseForm.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} data-testid="input-response-end" value={typeof field.value === 'string' ? field.value : ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={responseForm.control}
                        name="locationAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Operation Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Location where response will be coordinated" {...field} data-testid="input-response-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={responseForm.control}
                        name="maxVolunteers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Volunteers</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Maximum number of volunteers"
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                data-testid="input-max-volunteers"
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
                          onClick={() => setShowResponseForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={createResponseMutation.isPending}
                          data-testid="button-submit-response"
                        >
                          {createResponseMutation.isPending ? "Activating..." : "Activate Response"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Emergency Alerts */}
          {emergencyAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Siren className="text-destructive animate-pulse" size={24} />
                    <div>
                      <h3 className="font-semibold text-destructive">
                        ACTIVE EMERGENCY ALERTS: {emergencyAlerts.length} urgent situations
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Critical emergency situations requiring immediate response and resources
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
                <Card className={stat.label === "Active Emergencies" && Number(stat.value) > 0 ? "border-destructive/20 bg-destructive/5" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className={`text-2xl font-bold ${stat.label === "Active Emergencies" && Number(stat.value) > 0 ? "text-destructive" : ""}`}>
                          {stat.value}
                        </p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.label === "Active Emergencies" && Number(stat.value) > 0 ? "text-destructive" : "text-destructive"}`} />
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
            <Tabs defaultValue="emergencies" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="emergencies" data-testid="tab-emergencies">Active Emergencies</TabsTrigger>
                <TabsTrigger value="supplies" data-testid="tab-emergency-supplies">Emergency Supplies</TabsTrigger>
                <TabsTrigger value="responses" data-testid="tab-response-teams">Response Teams</TabsTrigger>
                <TabsTrigger value="resources" data-testid="tab-emergency-resources">Emergency Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="emergencies">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="text-destructive" size={20} />
                      <span>Active Emergency Situations</span>
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
                    ) : emergencyRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Active Emergencies</h3>
                        <p className="text-muted-foreground">
                          All clear - no emergency situations requiring immediate response.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {emergencyRequests
                          .sort((a: any, b: any) => {
                            // Sort by urgency first, then by creation time
                            const urgencyOrder = { emergency: 0, high: 1, medium: 2, low: 3 };
                            const urgencyDiff = (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 4) - (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 4);
                            if (urgencyDiff !== 0) return urgencyDiff;
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                          })
                          .map((request: any, index: number) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                            <Card className={`hover:shadow-lg transition-shadow ${request.urgency === 'emergency' ? 'border-destructive/20 bg-destructive/5' : ''}`}>
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
                                    {request.urgency === 'emergency' ? '🚨 EMERGENCY' : `${request.urgency} priority`}
                                  </Badge>
                                  {request.metadata?.disasterType && (
                                    <Badge className={`text-xs ${getDisasterColor(request.metadata.disasterType)}`}>
                                      {disasterTypes.find(d => d.value === request.metadata.disasterType)?.label}
                                    </Badge>
                                  )}
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{request.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {request.description}
                                </p>

                                <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                                  {request.location && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin size={14} />
                                      <span className="truncate">{request.location.address}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-2">
                                    <Clock size={14} />
                                    <span>Reported: {new Date(request.createdAt).toLocaleString()}</span>
                                  </div>

                                  {request.metadata?.contactPhone && (
                                    <div className="flex items-center space-x-2">
                                      <Phone size={14} />
                                      <span>Emergency contact available</span>
                                    </div>
                                  )}

                                  {request.metadata?.impactLevel && (
                                    <div className="flex items-center space-x-2">
                                      <Users size={14} />
                                      <span>Impact: {impactLevels.find(i => i.value === request.metadata.impactLevel)?.label}</span>
                                    </div>
                                  )}
                                </div>

                                <Button 
                                  size="sm" 
                                  className={`w-full ${
                                    request.urgency === 'emergency' 
                                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                  }`}
                                  data-testid={`button-respond-${request.id}`}
                                >
                                  <Zap className="mr-2" size={14} />
                                  {request.urgency === 'emergency' ? 'RESPOND NOW' : 'Respond to Emergency'}
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
                      <Package className="text-orange-500" size={20} />
                      <span>Emergency Supplies</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {suppliesLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-32 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : emergencySupplies.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Emergency Supplies Available</h3>
                        <p className="text-muted-foreground">
                          Emergency supplies are needed for disaster relief efforts.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {emergencySupplies.map((supply: any, index: number) => (
                          <motion.div
                            key={supply.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                    Emergency Supplies
                                  </Badge>
                                  {supply.metadata?.disasterType && (
                                    <Badge className={`text-xs ${getDisasterColor(supply.metadata.disasterType)}`}>
                                      {disasterTypes.find(d => d.value === supply.metadata.disasterType)?.label}
                                    </Badge>
                                  )}
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{supply.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {supply.description}
                                </p>

                                <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                                  {supply.quantity && (
                                    <div className="flex items-center space-x-2">
                                      <Package size={14} />
                                      <span>Available: {supply.quantity} units</span>
                                    </div>
                                  )}
                                  
                                  {supply.location && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin size={14} />
                                      <span className="truncate">{supply.location.address}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center space-x-2">
                                    <Clock size={14} />
                                    <span>Listed: {new Date(supply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white" data-testid={`button-request-supplies-${supply.id}`}>
                                  <Truck className="mr-2" size={14} />
                                  Request Supplies
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

              <TabsContent value="responses">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Radio className="text-blue-500" size={20} />
                      <span>Active Response Teams</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {responsesLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-32 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : emergencyResponses.length === 0 ? (
                      <div className="text-center py-12">
                        <Radio className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Active Response Teams</h3>
                        <p className="text-muted-foreground">
                          No emergency response operations currently active.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {emergencyResponses.map((response: any, index: number) => (
                          <motion.div
                            key={response.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  {response.metadata?.responseType && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                      {responseTypes.find(r => r.value === response.metadata.responseType)?.label}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {response.status}
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{response.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {response.description}
                                </p>

                                <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-2">
                                    <Clock size={14} />
                                    <span>
                                      {new Date(response.startTime).toLocaleDateString()} at{' '}
                                      {new Date(response.startTime).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <MapPin size={14} />
                                    <span className="truncate">{response.location?.address}</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Users size={14} />
                                    <span>
                                      Team: {response.currentVolunteers || 0}
                                      {response.maxVolunteers && ` / ${response.maxVolunteers}`} responders
                                    </span>
                                  </div>
                                </div>

                                <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white" data-testid={`button-join-response-${response.id}`}>
                                  <Radio className="mr-2" size={14} />
                                  Join Response Team
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

              <TabsContent value="resources">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="text-green-500" size={20} />
                      <span>Emergency Resources & Contacts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-6">
                          <h3 className="font-semibold text-red-800 dark:text-red-200 mb-4">Emergency Hotlines</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">National Emergency</span>
                              <span className="font-medium text-red-800 dark:text-red-200">911</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Disaster Relief Hotline</span>
                              <span className="font-medium text-red-800 dark:text-red-200">1-800-DISASTER</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Red Cross Emergency</span>
                              <span className="font-medium text-red-800 dark:text-red-200">1-800-REDCROSS</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">FEMA Assistance</span>
                              <span className="font-medium text-red-800 dark:text-red-200">1-800-621-3362</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-6">
                          <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-4">Emergency Preparation</h3>
                          <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                            <li className="flex items-start space-x-2">
                              <Package size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Keep emergency supply kit with 72 hours of provisions</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <Radio size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Have battery-powered or hand crank radio for alerts</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <Phone size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Create family communication plan with out-of-area contact</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Know evacuation routes and emergency shelter locations</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">Response Statistics</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Active Response Teams</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">{emergencyResponses.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Emergency Volunteers</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">247</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Response Time (Avg)</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">18 minutes</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Coverage Area</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">2,500 km²</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-6">
                          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4">Safety Guidelines</h3>
                          <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
                            <li className="flex items-start space-x-2">
                              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Only trained responders should enter dangerous areas</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <Shield size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Use proper protective equipment for all operations</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <Radio size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Maintain constant communication with command center</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <Users size={16} className="mt-0.5 flex-shrink-0" />
                              <span>Never work alone - always use buddy system</span>
                            </li>
                          </ul>
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
