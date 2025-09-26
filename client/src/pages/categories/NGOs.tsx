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
import { API_ENDPOINTS, DONATION_TYPES, URGENCY_LEVELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { insertRequestSchema, insertOrganizationSchema } from "@shared/schema";
import { 
  Building, 
  Plus, 
  Users, 
  Heart,
  FileText,
  Target,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Map
} from "lucide-react";

const requestFormSchema = insertRequestSchema.extend({
  locationAddress: z.string().optional(),
});

const organizationFormSchema = insertOrganizationSchema;

type RequestFormData = z.infer<typeof requestFormSchema>;
type OrganizationFormData = z.infer<typeof organizationFormSchema>;
type OrganizationData = OrganizationFormData & { verified?: boolean };

export default function NGOs() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestForm = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      type: "monetary",
      title: "",
      description: "",
      urgency: "medium",
      targetAmount: "",
      targetQuantity: undefined,
      locationAddress: "",
    },
  });

  const orgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
    },
  });

  // Fetch user's organization
  const { data: organizationRaw } = useQuery<OrganizationData | null>({
    queryKey: [`${API_ENDPOINTS.ORGANIZATIONS}/my`],
    enabled: !!user?.id,
  });
  const organization: OrganizationData | null = organizationRaw ?? null;

  // Fetch user's requests
  const { data: userRequestsRaw, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.REQUESTS, { userId: user?.id }],
    enabled: !!user?.id,
  });
  const userRequests: any[] = userRequestsRaw ?? [];

  // Fetch active donations
  const { data: availableDonationsRaw, isLoading: donationsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.DONATIONS],
  });
  const availableDonations: any[] = availableDonationsRaw ?? [];

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      const response = await apiRequest("POST", API_ENDPOINTS.ORGANIZATIONS, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization Registered! 🎉",
        description: "Your organization has been successfully registered.",
      });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ORGANIZATIONS}/my`] });
      setShowOrgForm(false);
      orgForm.reset();
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "Failed to register organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const { locationAddress, ...requestData } = data;
      
      // Add location if provided
      if (locationAddress) {
        requestData.location = {
          address: locationAddress,
          lat: 0,
          lng: 0,
        };
      }

      const response = await apiRequest("POST", API_ENDPOINTS.REQUESTS, requestData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Created! 📋",
        description: "Your request has been posted and is now visible to donors.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.REQUESTS] });
      setShowRequestForm(false);
      requestForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitRequest = (data: RequestFormData) => {
    createRequestMutation.mutate(data);
  };

  const onSubmitOrganization = (data: OrganizationFormData) => {
    createOrgMutation.mutate(data);
  };

  const stats = [
    { label: "Active Requests", value: userRequests.length, icon: FileText },
    { label: "Funds Raised", value: "₹" + userRequests.reduce((sum: number, req: any) => sum + parseFloat(req.raisedAmount || 0), 0).toLocaleString(), icon: Target },
    { label: "Volunteers", value: "28", icon: Users },
    { label: "Projects", value: "12", icon: Building },
  ];

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
                <Building className="text-primary" size={32} />
                <span>NGOs & Orphanages</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Connect with donors and volunteers to amplify your mission's reach
              </p>
            </div>
            
            <div className="flex space-x-2 mt-4 sm:mt-0">
              {!organization && (
                <Dialog open={showOrgForm} onOpenChange={setShowOrgForm}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-register-organization">
                      <Building className="mr-2" size={18} />
                      Register Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Register Your Organization</DialogTitle>
                    </DialogHeader>
                    <Form {...orgForm}>
                      <form onSubmit={orgForm.handleSubmit(onSubmitOrganization)} className="space-y-4">
                        <FormField
                          control={orgForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your organization name" {...field} data-testid="input-org-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={orgForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Describe your organization's mission..." {...field} data-testid="textarea-org-description" value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={orgForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourwebsite.com" {...field} data-testid="input-org-website" value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowOrgForm(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={createOrgMutation.isPending}
                            data-testid="button-submit-organization"
                          >
                            {createOrgMutation.isPending ? "Registering..." : "Register"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-request">
                    <Plus className="mr-2" size={18} />
                    Create Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Request</DialogTitle>
                  </DialogHeader>
                  <Form {...requestForm}>
                    <form onSubmit={requestForm.handleSubmit(onSubmitRequest)} className="space-y-4">
                      <FormField
                        control={requestForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Request Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-request-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(DONATION_TYPES).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
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
                        name="urgency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Urgency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-request-urgency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(URGENCY_LEVELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
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
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="What do you need?" {...field} data-testid="input-request-title" />
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your request..." {...field} data-testid="textarea-request-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {requestForm.watch("type") === "monetary" ? (
                        <FormField
                          control={requestForm.control}
                          name="targetAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Amount (₹)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} data-testid="input-request-amount" value={field.value ?? 0} />
                                <Input type="number" placeholder="0" {...field} data-testid="input-request-amount" value={field.value ?? 0} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={requestForm.control}
                          name="targetQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Number of items needed" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  data-testid="input-request-quantity"
                                  value={field.value ?? 0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={requestForm.control}
                        name="locationAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="City, State" {...field} data-testid="input-request-location" />
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
                          className="flex-1"
                          disabled={createRequestMutation.isPending}
                          data-testid="button-submit-request"
                        >
                          {createRequestMutation.isPending ? "Creating..." : "Create Request"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Organization Status */}
          {organization && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building className="text-primary" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{(organization?.name ?? "") as string}</h3>
                        <p className="text-sm text-muted-foreground">{(organization?.description ?? "") as string}</p>
                      </div>
                    </div>
                    <Badge variant={organization?.verified ? "default" : "secondary"}>
                      {organization?.verified ? (
                        <>
                          <CheckCircle className="mr-1" size={12} />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1" size={12} />
                          Pending Verification
                        </>
                      )}
                    </Badge>
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
                <TabsTrigger value="requests" data-testid="tab-requests">My Requests</TabsTrigger>
                <TabsTrigger value="donations" data-testid="tab-donations">Available Donations</TabsTrigger>
                <TabsTrigger value="volunteers" data-testid="tab-volunteers">Volunteers</TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-2" data-testid="tab-map">
                  <Map size={16} />
                  <span>Find Nearby</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="text-primary" size={20} />
                      <span>My Requests</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requestsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-40 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : userRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
                        <p className="text-muted-foreground">
                          Create your first request to start receiving donations and support.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userRequests.map((request: any, index: number) => (
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
                                    {DONATION_TYPES[request.type as keyof typeof DONATION_TYPES]}
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{request.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {request.description}
                                </p>

                                {request.targetAmount && (
                                  <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>Progress</span>
                                      <span>₹{request.raisedAmount || 0} / ₹{request.targetAmount}</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full">
                                      <div 
                                        className="h-2 bg-primary rounded-full"
                                        style={{ 
                                          width: `${Math.min(100, (parseFloat(request.raisedAmount || 0) / parseFloat(request.targetAmount)) * 100)}%` 
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Clock size={12} />
                                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <Badge variant={request.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                    {request.status}
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

              <TabsContent value="donations">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="text-accent" size={20} />
                      <span>Available Donations</span>
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
                    ) : availableDonations.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Donations Available</h3>
                        <p className="text-muted-foreground">
                          Check back soon for new donations from generous donors.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableDonations.map((donation: any, index: number) => (
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
                                  <Badge variant="outline" className="text-xs">
                                    Available
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{donation.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {donation.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                  {donation.location && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin size={12} />
                                      <span>{donation.location.address}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <Clock size={12} />
                                    <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <Button size="sm" className="w-full" data-testid={`button-contact-${donation.id}`}>
                                  Contact Donor
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

              <TabsContent value="volunteers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="text-accent" size={20} />
                      <span>Volunteer Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <h3 className="text-lg font-semibold mb-2">Volunteer System</h3>
                      <p className="text-muted-foreground mb-4">
                        Coordinate with volunteers and manage activities for your organization.
                      </p>
                      <Button>
                        <Plus className="mr-2" size={16} />
                        Create Volunteer Activity
                      </Button>
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
