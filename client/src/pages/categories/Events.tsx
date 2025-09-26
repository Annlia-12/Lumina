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
import { insertActivitySchema } from "@shared/schema";
import { 
  Calendar, 
  Plus, 
  Users,
  Music,
  MapPin,
  Clock,
  Ticket,
  DollarSign,
  Heart,
  Star,
  PartyPopper,
  Map
} from "lucide-react";

const eventSchema = insertActivitySchema.extend({
  locationAddress: z.string().min(1, "Location is required"),
  eventType: z.string().optional(),
  ticketPrice: z.string().optional(),
  capacity: z.number().optional(),
  fundraisingGoal: z.string().optional(),
});

type EventData = z.infer<typeof eventSchema>;

const eventTypes = [
  { value: "fundraiser", label: "Fundraising Event" },
  { value: "awareness", label: "Awareness Campaign" },
  { value: "volunteer", label: "Volunteer Drive" },
  { value: "community", label: "Community Gathering" },
  { value: "educational", label: "Educational Workshop" },
  { value: "cultural", label: "Cultural Event" },
  { value: "sports", label: "Sports Event" },
  { value: "charity", label: "Charity Gala" },
  { value: "auction", label: "Charity Auction" },
  { value: "concert", label: "Benefit Concert" },
];

export default function Events() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EventData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      locationAddress: "",
      startTime: undefined,
      endTime: undefined,
      maxVolunteers: 0,
      skills: [],
      eventType: "fundraiser",
      ticketPrice: "",
      capacity: 0,
      fundraisingGoal: "",
    },
  });

  // Fetch user's events
  const { data: userEvents = [], isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.ACTIVITIES, { userId: user?.id }],
    enabled: !!user?.id,
  });

  // Fetch all upcoming events
  const { data: upcomingEvents = [], isLoading: upcomingLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.ACTIVITIES],
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: EventData) => {
      const { locationAddress, eventType, ticketPrice, capacity, fundraisingGoal, startTime, endTime, ...activityData } = data;
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
        metadata: { eventType, ticketPrice, capacity, fundraisingGoal },
      };
      const response = await apiRequest("POST", API_ENDPOINTS.ACTIVITIES, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Created! 🎉",
        description: "Your event has been scheduled and is now visible to the community.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVITIES] });
      setShowEventForm(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventData) => {
    createEventMutation.mutate(data);
  };

  const stats = [
    { label: "Events Hosted", value: Array.isArray(userEvents) ? userEvents.length : 0, icon: Calendar },
    { label: "Funds Raised", value: "₹2,45,000", icon: DollarSign },
    { label: "Attendees", value: "1,240", icon: Users },
    { label: "Community Impact", value: "5★", icon: Star },
  ];

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fundraiser: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      awareness: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      volunteer: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      community: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      educational: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      cultural: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      sports: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      charity: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      auction: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
      concert: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
    };
    return colors[type] || 'bg-secondary text-secondary-foreground';
  };

  const getEventStatusColor = (startTime: string) => {
    const now = new Date();
    const eventStart = new Date(startTime);
    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilEvent < 0) return { status: 'completed', color: 'bg-gray-100 text-gray-700' };
    if (hoursUntilEvent <= 24) return { status: 'starting soon', color: 'bg-orange-100 text-orange-700' };
    if (hoursUntilEvent <= 168) return { status: 'this week', color: 'bg-blue-100 text-blue-700' };
    return { status: 'upcoming', color: 'bg-green-100 text-green-700' };
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
                <Calendar className="text-blue-500" size={32} />
                <span>Event Hosts</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Organize fundraising events, awareness campaigns, and community gatherings
              </p>
            </div>
            
            <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-blue-500 hover:bg-blue-600 text-white" data-testid="button-create-event">
                  <Plus className="mr-2" size={18} />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-event-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {eventTypes.map((type) => (
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
                          <FormLabel>Event Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Charity Gala for Education, Community Food Drive" {...field} data-testid="input-event-title" />
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
                            <Textarea placeholder="Describe the event..." {...field} data-testid="textarea-event-description" value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} data-testid="input-event-start" value={typeof field.value === 'string' ? field.value : ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} data-testid="input-event-end" value={typeof field.value === 'string' ? field.value : ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="locationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Venue address" {...field} data-testid="input-event-location" />
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
                                placeholder="Maximum number of attendees"
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                data-testid="input-event-capacity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ticketPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ticket Price (₹)</FormLabel>
                            <FormControl>
                              <Input placeholder="0 for free" {...field} data-testid="input-ticket-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("eventType") === "fundraiser" && (
                      <FormField
                        control={form.control}
                        name="fundraisingGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fundraising Goal (₹)</FormLabel>
                            <FormControl>
                              <Input placeholder="Target amount to raise" {...field} data-testid="input-fundraising-goal" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
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
                              data-testid="input-event-max-volunteers"
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
                        onClick={() => setShowEventForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                        disabled={createEventMutation.isPending}
                        data-testid="button-submit-event"
                      >
                        {createEventMutation.isPending ? "Creating..." : "Create Event"}
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
                      <stat.icon className="h-8 w-8 text-blue-500" />
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
            <Tabs defaultValue="my-events" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="my-events" data-testid="tab-my-events">My Events</TabsTrigger>
                <TabsTrigger value="upcoming" data-testid="tab-upcoming-events">Upcoming Events</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-event-analytics">Analytics</TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-2" data-testid="tab-map">
                  <Map size={16} />
                  <span>Find Nearby</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-events">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PartyPopper className="text-blue-500" size={20} />
                      <span>My Events</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {eventsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-40 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : userEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Events Created</h3>
                        <p className="text-muted-foreground">
                          Start making an impact by creating your first community event.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userEvents.map((event: any, index: number) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  {event.metadata?.eventType && (
                                    <Badge className={`text-xs ${getEventTypeColor(event.metadata.eventType)}`}>
                                      {eventTypes.find(t => t.value === event.metadata.eventType)?.label}
                                    </Badge>
                                  )}
                                  <Badge className={`text-xs ${getEventStatusColor(event.startTime).color}`}>
                                    {getEventStatusColor(event.startTime).status}
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{event.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {event.description}
                                </p>

                                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-2">
                                    <Calendar size={14} />
                                    <span>
                                      {new Date(event.startTime).toLocaleDateString()} at{' '}
                                      {new Date(event.startTime).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <MapPin size={14} />
                                    <span className="truncate">{event.location?.address}</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Users size={14} />
                                    <span>
                                      {event.currentVolunteers || 0}
                                      {event.metadata?.capacity && ` / ${event.metadata.capacity}`} attendees
                                    </span>
                                  </div>

                                  {event.metadata?.ticketPrice && (
                                    <div className="flex items-center space-x-2">
                                      <Ticket size={14} />
                                      <span>
                                        {event.metadata.ticketPrice === "0" ? "Free" : `₹${event.metadata.ticketPrice}`}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Clock size={12} />
                                    <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <Badge variant={event.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                    {event.status}
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

              <TabsContent value="upcoming">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Music className="text-accent" size={20} />
                      <span>Upcoming Community Events</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-40 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : upcomingEvents.filter((event: any) => new Date(event.startTime) > new Date()).length === 0 ? (
                      <div className="text-center py-12">
                        <Music className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                        <p className="text-muted-foreground">
                          Check back soon for exciting community events and fundraisers.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingEvents
                          .filter((event: any) => new Date(event.startTime) > new Date())
                          .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                          .slice(0, 12)
                          .map((event: any, index: number) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  {event.metadata?.eventType && (
                                    <Badge className={`text-xs ${getEventTypeColor(event.metadata.eventType)}`}>
                                      {eventTypes.find(t => t.value === event.metadata.eventType)?.label}
                                    </Badge>
                                  )}
                                  <Badge className={`text-xs ${getEventStatusColor(event.startTime).color}`}>
                                    {getEventStatusColor(event.startTime).status}
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2 line-clamp-2">{event.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                  {event.description}
                                </p>

                                <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-2">
                                    <Calendar size={14} />
                                    <span>
                                      {new Date(event.startTime).toLocaleDateString()} at{' '}
                                      {new Date(event.startTime).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <MapPin size={14} />
                                    <span className="truncate">{event.location?.address}</span>
                                  </div>

                                  {event.metadata?.ticketPrice && (
                                    <div className="flex items-center space-x-2">
                                      <Ticket size={14} />
                                      <span>
                                        {event.metadata.ticketPrice === "0" ? "Free Entry" : `₹${event.metadata.ticketPrice}`}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white" data-testid={`button-attend-${event.id}`}>
                                  <Heart className="mr-2" size={14} />
                                  Attend Event
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

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="text-yellow-500" size={20} />
                      <span>Event Analytics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">Event Performance</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Average Attendance</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">85%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Total Attendees</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">1,240</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Repeat Attendees</span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">45%</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-6">
                          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4">Fundraising Impact</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700 dark:text-green-300">Total Funds Raised</span>
                              <span className="font-medium text-green-800 dark:text-green-200">₹2,45,000</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700 dark:text-green-300">Average per Event</span>
                              <span className="font-medium text-green-800 dark:text-green-200">₹49,000</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700 dark:text-green-300">Goal Achievement</span>
                              <span className="font-medium text-green-800 dark:text-green-200">92%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-6">
                          <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-4">Event Categories</h3>
                          <div className="space-y-2">
                            {eventTypes.slice(0, 5).map((type, index) => (
                              <div key={type.value} className="flex items-center justify-between">
                                <span className="text-sm text-purple-700 dark:text-purple-300">{type.label}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 h-2 bg-purple-200 dark:bg-purple-800 rounded-full">
                                    <div 
                                      className="h-full bg-purple-500 rounded-full" 
                                      style={{ width: `${Math.max(20, (5 - index) * 20)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-purple-600 dark:text-purple-400">
                                    {Math.max(8, (5 - index) * 8)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-6">
                          <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-4">Community Engagement</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700 dark:text-orange-300">Volunteer Signups</span>
                              <span className="font-medium text-orange-800 dark:text-orange-200">312</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700 dark:text-orange-300">Social Shares</span>
                              <span className="font-medium text-orange-800 dark:text-orange-200">1,856</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700 dark:text-orange-300">Community Rating</span>
                              <span className="font-medium text-orange-800 dark:text-orange-200">4.8/5</span>
                            </div>
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
