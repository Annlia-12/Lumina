import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { 
  Users, 
  Calendar,
  MapPin, 
  Clock, 
  Heart,
  Plus,
  CheckCircle,
  Star,
  Award,
  Map
} from "lucide-react";

export default function Volunteers() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch volunteer activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.ACTIVITIES],
  });

  // Fetch user's registrations
  const { data: userRegistrations = [], isLoading: registrationsLoading } = useQuery<any[]>({
    queryKey: [`/api/volunteer-registrations/${user?.id}`],
    enabled: !!user?.id,
  });

  // Register for activity mutation
  const registerMutation = useMutation({
    mutationFn: async ({ activityId, message }: { activityId: string; message: string }) => {
      const response = await apiRequest("POST", `${API_ENDPOINTS.ACTIVITIES}/${activityId}/register`, {
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful! 🎉",
        description: "You've successfully registered for this volunteer activity.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVITIES] });
      queryClient.invalidateQueries({ queryKey: [`/api/volunteer-registrations/${user?.id}`] });
      setShowRegistrationDialog(false);
      setRegistrationMessage("");
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRegister = (activity: any) => {
    setSelectedActivity(activity);
    setShowRegistrationDialog(true);
  };

  const submitRegistration = () => {
    if (selectedActivity) {
      registerMutation.mutate({
        activityId: selectedActivity.id,
        message: registrationMessage,
      });
    }
  };

  const isRegistered = (activityId: string) => {
    return userRegistrations.some((reg: any) => reg.activityId === activityId);
  };

  const stats = [
    { label: "Hours Volunteered", value: "127", icon: Clock },
    { label: "Activities Joined", value: "23", icon: CheckCircle },
    { label: "People Helped", value: "156", icon: Heart },
    { label: "Recognition Points", value: "890", icon: Award },
  ];

  const upcomingActivities = activities.filter((activity: any) => 
    new Date(activity.startTime) > new Date() && activity.status === 'active'
  ).slice(0, 6);

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
            className="mb-8"
          >
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Users className="text-accent" size={32} />
              <span>Volunteers Hub</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Join meaningful activities and make a hands-on difference in your community
            </p>
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
                      <stat.icon className="h-8 w-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="text-primary" size={20} />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-16 flex-col space-y-1" variant="outline">
                  <Plus size={18} />
                  <span className="text-sm">Create Activity</span>
                </Button>
                <Button className="h-16 flex-col space-y-1" variant="outline">
                  <Calendar size={18} />
                  <span className="text-sm">View Schedule</span>
                </Button>
                <Button className="h-16 flex-col space-y-1" variant="outline">
                  <Heart size={18} />
                  <span className="text-sm">My Impact</span>
                </Button>
                <Button className="h-16 flex-col space-y-1" variant="outline">
                  <Award size={18} />
                  <span className="text-sm">Certificates</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Tabs defaultValue="opportunities" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="opportunities" className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Opportunities</span>
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-2">
                  <Map size={16} />
                  <span>Find Nearby</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="opportunities">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="text-accent" size={24} />
                      <span>Upcoming Opportunities</span>
                    </CardTitle>
                  </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-40 bg-muted rounded-lg mb-3"></div>
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : upcomingActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">No Activities Available</h3>
                    <p className="text-muted-foreground">
                      Check back soon for new volunteer opportunities!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingActivities.map((activity: any, index: number) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow h-full">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant="outline" className="text-xs">
                                {activity.skills && activity.skills.length > 0 ? activity.skills[0] : 'General'}
                              </Badge>
                              <Badge 
                                variant={isRegistered(activity.id) ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {isRegistered(activity.id) ? 'Registered' : 'Open'}
                              </Badge>
                            </div>
                            
                            <h4 className="font-semibold mb-2 line-clamp-2">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                              {activity.description}
                            </p>

                            <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-2">
                                <Calendar size={14} />
                                <span>
                                  {new Date(activity.startTime).toLocaleDateString()} at{' '}
                                  {new Date(activity.startTime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <MapPin size={14} />
                                <span className="truncate">
                                  {activity.location?.address || 'Location TBD'}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Users size={14} />
                                <span>
                                  {activity.currentVolunteers || 0}
                                  {activity.maxVolunteers && ` / ${activity.maxVolunteers}`} volunteers
                                </span>
                              </div>
                            </div>

                            <div className="mt-auto">
                              {isRegistered(activity.id) ? (
                                <Button 
                                  variant="outline" 
                                  className="w-full" 
                                  disabled
                                  data-testid={`button-registered-${activity.id}`}
                                >
                                  <CheckCircle className="mr-2" size={16} />
                                  Registered
                                </Button>
                              ) : activity.maxVolunteers && activity.currentVolunteers >= activity.maxVolunteers ? (
                                <Button 
                                  variant="outline" 
                                  className="w-full" 
                                  disabled
                                  data-testid={`button-full-${activity.id}`}
                                >
                                  Activity Full
                                </Button>
                              ) : (
                                <Button 
                                  className="w-full" 
                                  onClick={() => handleRegister(activity)}
                                  data-testid={`button-register-${activity.id}`}
                                >
                                  <Plus className="mr-2" size={16} />
                                  Join Activity
                                </Button>
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

      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Volunteer Activity</DialogTitle>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg">
                <h4 className="font-semibold">{selectedActivity.title}</h4>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} />
                    <span>
                      {new Date(selectedActivity.startTime).toLocaleDateString()} at{' '}
                      {new Date(selectedActivity.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} />
                    <span>{selectedActivity.location?.address || 'Location TBD'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Message (Optional)
                </label>
                <Textarea
                  placeholder="Tell the organizer why you'd like to join or any relevant skills you have..."
                  value={registrationMessage}
                  onChange={(e) => setRegistrationMessage(e.target.value)}
                  rows={4}
                  data-testid="textarea-registration-message"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRegistrationDialog(false)}
                  className="flex-1"
                  data-testid="button-cancel-registration"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitRegistration}
                  className="flex-1"
                  disabled={registerMutation.isPending}
                  data-testid="button-submit-registration"
                >
                  {registerMutation.isPending ? "Registering..." : "Join Activity"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AIChatbot />
    </div>
  );
}
