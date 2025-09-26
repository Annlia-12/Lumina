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
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, DONATION_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { insertDonationSchema } from "@shared/schema";
import { 
  Heart, 
  Gift, 
  Plus, 
  MapPin, 
  Clock, 
  Filter,
  Search,
  DollarSign,
  Users,
  Building,
  Utensils
} from "lucide-react";

const donationFormSchema = insertDonationSchema.extend({
  locationAddress: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationFormSchema>;

export default function Donors() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      type: "monetary",
      title: "",
      description: "",
      amount: "",
      quantity: 0,
      locationAddress: "",
    },
  });

  // Fetch active requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.REQUESTS],
  });

  // Fetch user's donations
  const { data: userDonations = [], isLoading: donationsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.DONATIONS, { userId: user?.id }],
    enabled: !!user?.id,
  });

  // Create donation mutation
  const createDonationMutation = useMutation({
    mutationFn: async (data: DonationFormData) => {
      const formData = new FormData();
      const { locationAddress, ...donationData } = data;
      
      // Add location if provided
      if (locationAddress) {
        donationData.location = {
          address: locationAddress,
          lat: 0,
          lng: 0,
        };
      }

      Object.entries(donationData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await apiRequest("POST", API_ENDPOINTS.DONATIONS, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Donation Created! 🎉",
        description: "Your donation has been posted and is now visible to those in need.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.DONATIONS] });
      setShowDonationForm(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create donation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DonationFormData) => {
    createDonationMutation.mutate(data);
  };

  const filteredRequests = requests.filter((request: any) => {
    const matchesType = filterType === "all" || request.type === filterType;
    const matchesSearch = !searchQuery || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDonate = (request: any) => {
    setSelectedRequest(request);
    setShowPaymentForm(true);
  };

  const stats = [
    { label: "Total Donated", value: "₹15,240", icon: DollarSign },
    { label: "People Helped", value: "43", icon: Users },
    { label: "Organizations", value: "12", icon: Building },
    { label: "Active Donations", value: Array.isArray(userDonations) ? userDonations.length : 0, icon: Gift },
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
                <Heart className="text-primary" size={32} />
                <span>Donors Hub</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Make a difference with secure donations and track your impact
              </p>
            </div>
            
            <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0" data-testid="button-create-donation">
                  <Plus className="mr-2" size={18} />
                  Create Donation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Donation</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Donation Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-donation-type">
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
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="What are you donating?" {...field} data-testid="input-donation-title" />
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
                            <Textarea placeholder="Describe your donation..." {...field} data-testid="textarea-donation-description" value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("type") === "monetary" ? (
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} data-testid="input-donation-amount" value={field.value ?? 0} onChange={(e) => field.onChange(e.target.value ? e.target.value : "0")}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
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
                                data-testid="input-donation-quantity"
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
                          <FormLabel>Location (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="City, State" {...field} data-testid="input-donation-location" />
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
                        {createDonationMutation.isPending ? "Creating..." : "Create Donation"}
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
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters & Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-requests"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter size={16} className="text-muted-foreground" />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40" data-testid="select-filter-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(DONATION_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="text-accent" size={24} />
                  <span>Active Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-muted rounded-lg mb-3"></div>
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterType !== "all" 
                        ? "Try adjusting your filters to find more requests."
                        : "There are currently no active requests. Check back soon!"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.map((request: any, index: number) => (
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

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
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
                            </div>

                            <Button 
                              className="w-full mt-4" 
                              size="sm"
                              onClick={() => handleDonate(request)}
                              data-testid={`button-donate-${request.id}`}
                            >
                              <Gift className="mr-2" size={16} />
                              Donate Now
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Payment Form Dialog */}
      {showPaymentForm && selectedRequest && (
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="sm:max-w-md">
            <PaymentForm
              recipientId={selectedRequest.requesterId}
              recipientName="Request Creator" // In real app, fetch user name
              requestId={selectedRequest.id}
              suggestedAmount={selectedRequest.targetAmount ? Math.min(1000, parseFloat(selectedRequest.targetAmount) - parseFloat(selectedRequest.raisedAmount || 0)) : 500}
              onSuccess={() => {
                setShowPaymentForm(false);
                queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.REQUESTS] });
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <AIChatbot />
    </div>
  );
}
