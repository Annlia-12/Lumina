import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { DonationMap } from "@/components/map/DonationMap";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/lib/constants";
import { 
  Heart, 
  Users, 
  Building, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Gift,
  HandHeart,
  Target,
  Clock,
  Star,
  Plus
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/stats"],
    enabled: !!user,
  });

  const { data: recentDonations } = useQuery({
    queryKey: [API_ENDPOINTS.DONATIONS, { limit: 5 }],
    enabled: !!user,
  });

  const { data: matches } = useQuery({
    queryKey: [API_ENDPOINTS.MATCHES],
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: [API_ENDPOINTS.NOTIFICATIONS],
    enabled: !!user,
  });

  const stats = [
    {
      title: "Total Donated",
      value: "₹15,240",
      change: "+12% this month",
      icon: Heart,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      title: "People Helped",
      value: "43",
      change: "+5 this week",
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10"
    },
    {
      title: "Impact Score",
      value: "92%",
      change: "+8% improvement",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900"
    },
    {
      title: "Organizations",
      value: "12",
      change: "Connected",
      icon: Building,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900"
    }
  ];

  const upcomingEvents = [
    {
      id: "1",
      title: "Food Distribution Drive",
      date: "Tomorrow, 10:00 AM",
      location: "Community Center",
      type: "volunteer"
    },
    {
      id: "2", 
      title: "Medical Camp",
      date: "This Weekend",
      location: "City Hospital",
      type: "medical"
    },
    {
      id: "3",
      title: "Education Material Drive",
      date: "Next Monday",
      location: "Schools District",
      type: "education"
    }
  ];

  const quickActions = [
    { title: "Make Donation", icon: Gift, href: "/donors", color: "bg-primary text-primary-foreground" },
    { title: "Find Volunteers", icon: Users, href: "/volunteers", color: "bg-accent text-accent-foreground" },
    { title: "Post Request", icon: Plus, href: "/requests/new", color: "bg-green-500 text-white" },
    { title: "View Map", icon: MapPin, href: "#map", color: "bg-blue-500 text-white" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

  <div className={`pt-16 ${sidebarOpen ? 'lg:ml-64' : ''}`}> // Only add margin if sidebar is open
        <div className="p-6 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.user_metadata?.name || user?.email}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening in your community today.
            </p>
          </motion.div>

          {/* Profile Section */}
          <ProfileCard />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={action.title} href={action.href}>
                      <Button
                        className={`w-full h-20 flex-col space-y-2 ${action.color}`}
                        data-testid={`button-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <action.icon size={20} />
                        <span className="text-sm">{action.title}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
                <TabsTrigger value="map" data-testid="tab-map">Map</TabsTrigger>
                <TabsTrigger value="matches" data-testid="tab-matches">Matches</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Recent Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ActivityFeed limit={3} />
                    </CardContent>
                  </Card>

                  {/* Upcoming Events */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>Upcoming Events</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {upcomingEvents.map((event) => (
                          <div key={event.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.date}</p>
                              <p className="text-xs text-muted-foreground">📍 {event.location}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Monthly Goals</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Donation Goal</span>
                          <span>₹15,240 / ₹20,000</span>
                        </div>
                        <Progress value={76} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Volunteer Hours</span>
                          <span>12 / 20 hours</span>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>People Helped</span>
                          <span>43 / 50 people</span>
                        </div>
                        <Progress value={86} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <ActivityFeed />
              </TabsContent>

              <TabsContent value="map">
                <DonationMap 
                  onLocationSelect={(location) => console.log('Selected location:', location)}
                  userLocation={undefined}
                />
              </TabsContent>

              <TabsContent value="matches">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(matches) && matches.length > 0 ? matches.map((match: any) => (
                    <Card key={match.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="text-xs">
                            {match.type || 'Match'}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{match.score}</span>
                          </div>
                        </div>
                        <h4 className="font-semibold mb-2">Smart Match Found</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {match.reason || "This opportunity aligns with your interests and location."}
                        </p>
                        <Button size="sm" className="w-full">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-12">
                      <HandHeart className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        We'll find relevant opportunities based on your preferences and activity.
                      </p>
                      <Button>
                        Update Preferences
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      <AIChatbot />
    </div>
  );
}
