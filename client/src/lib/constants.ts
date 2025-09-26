export const USER_TYPES = {
  donor: "Donor",
  volunteer: "Volunteer", 
  ngo: "NGO/Orphanage",
  business: "Business",
  medical: "Medical/Hospital",
  farmer: "Farmer",
  clothing: "Clothing Store/Factory",
  event_host: "Event Host",
  vacant_home: "Vacant Home",
  disaster_relief: "Disaster Relief"
} as const;

export const DONATION_TYPES = {
  monetary: "Monetary",
  food: "Food",
  clothing: "Clothing",
  medical: "Medical Supplies",
  educational: "Educational Materials",
  shelter: "Shelter/Housing",
  other: "Other"
} as const;

export const URGENCY_LEVELS = {
  low: "Low",
  medium: "Medium", 
  high: "High",
  emergency: "Emergency"
} as const;

export const STATUS_OPTIONS = {
  active: "Active",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled"
} as const;

export const CATEGORY_ICONS = {
  donor: "fas fa-hand-holding-heart",
  volunteer: "fas fa-hands-helping",
  ngo: "fas fa-building",
  business: "fas fa-store",
  medical: "fas fa-hospital",
  farmer: "fas fa-leaf",
  clothing: "fas fa-tshirt",
  event_host: "fas fa-calendar-alt",
  vacant_home: "fas fa-home",
  disaster_relief: "fas fa-exclamation-triangle"
} as const;

export const CATEGORY_COLORS = {
  donor: "bg-primary/10 text-primary",
  volunteer: "bg-accent/10 text-accent",
  ngo: "bg-primary/10 text-primary",
  business: "bg-accent/10 text-accent",
  medical: "bg-primary/10 text-primary",
  farmer: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  clothing: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  event_host: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  vacant_home: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  disaster_relief: "bg-destructive/10 text-destructive"
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me"
  },
  DONATIONS: "/api/donations",
  REQUESTS: "/api/requests",
  ACTIVITIES: "/api/activities",
  MATCHES: "/api/matches",
  ACTIVITY_FEED: "/api/activity-feed",
  PAYMENTS: "/api/payments",
  CHAT: "/api/chat",
  NOTIFICATIONS: "/api/notifications",
  ORGANIZATIONS: "/api/organizations"
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "lumina_auth_token",
  USER: "lumina_user",
  THEME: "lumina_theme"
} as const;

export const RAZORPAY_OPTIONS = {
  currency: "INR",
  name: "Lumina",
  description: "Donation Payment",
  theme: {
    color: "#8b9a77" // Primary color
  }
} as const;
