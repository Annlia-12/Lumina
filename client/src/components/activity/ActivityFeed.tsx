import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock, User, Building, HandHeart, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useSupabase } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";
import type { ActivityFeedItem } from "@shared/schema";

interface ActivityFeedProps {
  limit?: number;
  className?: string;
}

export function ActivityFeed({ limit = 50, className }: ActivityFeedProps) {
  const queryClient = useQueryClient();
  const { subscribe } = useSupabase({ channel: "activity_feed" });
  
  const { data: activities = [], isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ACTIVITY_FEED, { limit }],
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribe((data: any) => {
      if (data.type === 'activity_update' || data.type === 'donation' || data.type === 'request' || data.type === 'volunteer') {
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVITY_FEED] });
      }
    });

    return unsubscribe;
  }, [subscribe, queryClient]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'donation':
        return <HandHeart className="text-primary" size={20} />;
      case 'request':
        return <Heart className="text-destructive" size={20} />;
      case 'volunteer':
        return <Users className="text-accent" size={20} />;
      case 'match':
        return <Heart className="text-green-500" size={20} />;
      default:
        return <User className="text-muted-foreground" size={20} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'donation':
        return 'bg-primary/10 text-primary';
      case 'request':
        return 'bg-destructive/10 text-destructive';
      case 'volunteer':
        return 'bg-accent/10 text-accent';
      case 'match':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const likeMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const response = await apiRequest("POST", `/api/activity-feed/${activityId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVITY_FEED] });
    },
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} data-testid="activity-feed">
      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground">
              Be the first to make a donation, create a request, or volunteer!
            </p>
          </CardContent>
        </Card>
      ) : (
        activities.map((activity: ActivityFeedItem, index: number) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    getActivityColor(activity.type)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-sm truncate">
                        {activity.title}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock size={12} className="mr-1" />
                        {formatTimeAgo(new Date(activity.createdAt))}
                      </span>
                    </div>
                    
                    {activity.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                        {activity.description}
                      </p>
                    )}

                    {activity.metadata && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {activity.metadata.type && (
                          <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                            {activity.metadata.type}
                          </span>
                        )}
                        {activity.metadata.urgency && (
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            activity.metadata.urgency === 'emergency' 
                              ? 'bg-destructive text-destructive-foreground'
                              : activity.metadata.urgency === 'high'
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                              : 'bg-secondary text-secondary-foreground'
                          )}>
                            {activity.metadata.urgency} priority
                          </span>
                        )}
                        {activity.metadata.location && (
                          <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                            📍 {activity.metadata.location.address || 'Location provided'}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-accent p-0 h-auto"
                        onClick={() => likeMutation.mutate(activity.id)}
                        disabled={likeMutation.isPending}
                        data-testid={`button-like-${activity.id}`}
                      >
                        <Heart size={14} className="mr-1" />
                        <span className="text-xs">{activity.likes}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary p-0 h-auto"
                        data-testid={`button-comment-${activity.id}`}
                      >
                        <MessageCircle size={14} className="mr-1" />
                        <span className="text-xs">{activity.comments}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}

      {activities.length >= limit && (
        <div className="text-center">
          <Button variant="outline" data-testid="button-load-more-activity">
            Load More Activity
          </Button>
        </div>
      )}
    </div>
  );
}
