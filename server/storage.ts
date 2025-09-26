import { type User, type InsertUser, type Donation, type InsertDonation, type Request, type InsertRequest, type Activity, type InsertActivity, type ActivityFeedItem, type Match, type Payment, type InsertPayment, type Organization, type InsertOrganization, type VolunteerRegistration, type InsertVolunteerRegistration, type Notification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;

  // Organizations
  createOrganization(organization: InsertOrganization & { userId: string }): Promise<Organization>;
  getOrganizationByUserId(userId: string): Promise<Organization | undefined>;

  // Donations
  createDonation(donation: InsertDonation & { donorId: string }): Promise<Donation>;
  getDonations(filters?: { type?: string; location?: { lat: number; lng: number; radius?: number } }): Promise<Donation[]>;
  getDonation(id: string): Promise<Donation | undefined>;
  updateDonation(id: string, donation: Partial<Donation>): Promise<Donation>;

  // Requests
  createRequest(request: InsertRequest & { requesterId: string }): Promise<Request>;
  getRequests(filters?: { type?: string; urgency?: string; location?: { lat: number; lng: number; radius?: number } }): Promise<Request[]>;
  getRequest(id: string): Promise<Request | undefined>;
  updateRequest(id: string, request: Partial<Request>): Promise<Request>;

  // Activities
  createActivity(activity: InsertActivity & { organizerId: string }): Promise<Activity>;
  getActivities(filters?: { location?: { lat: number; lng: number; radius?: number } }): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  updateActivity(id: string, activity: Partial<Activity>): Promise<Activity>;

  // Volunteer Registrations
  createVolunteerRegistration(registration: InsertVolunteerRegistration & { volunteerId: string }): Promise<VolunteerRegistration>;
  getVolunteerRegistrations(volunteerId: string): Promise<VolunteerRegistration[]>;

  // Matches
  getMatches(userId: string): Promise<Match[]>;
  createMatch(match: Omit<Match, 'id' | 'createdAt'>): Promise<Match>;

  // Activity Feed
  getActivityFeed(limit?: number): Promise<ActivityFeedItem[]>;
  createActivityFeedItem(item: Omit<ActivityFeedItem, 'id' | 'createdAt'>): Promise<ActivityFeedItem>;

  // Payments
  createPayment(payment: InsertPayment & { payerId: string }): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  updatePayment(id: string, payment: Partial<Payment>): Promise<Payment>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private donations: Map<string, Donation> = new Map();
  private requests: Map<string, Request> = new Map();
  private activities: Map<string, Activity> = new Map();
  private volunteerRegistrations: Map<string, VolunteerRegistration> = new Map();
  private matches: Map<string, Match> = new Map();
  private activityFeed: Map<string, ActivityFeedItem> = new Map();
  private payments: Map<string, Payment> = new Map();
  private notifications: Map<string, Notification> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      avatar: null,
      verified: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createOrganization(orgData: InsertOrganization & { userId: string }): Promise<Organization> {
    const id = randomUUID();
    const organization: Organization = {
      ...orgData,
      id,
      documents: orgData.documents || [],
      verified: false,
      createdAt: new Date(),
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async getOrganizationByUserId(userId: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.userId === userId);
  }

  async createDonation(donationData: InsertDonation & { donorId: string }): Promise<Donation> {
    const id = randomUUID();
    const donation: Donation = {
      ...donationData,
      id,
      recipientId: null,
      images: donationData.images || [],
      status: "active",
      createdAt: new Date(),
    };
    this.donations.set(id, donation);
    
    // Add to activity feed
    await this.createActivityFeedItem({
      userId: donationData.donorId,
      type: 'donation',
      title: `New donation: ${donation.title}`,
      description: donation.description || '',
      metadata: { donationId: id, type: donation.type },
      likes: 0,
      comments: 0,
    });

    return donation;
  }

  async getDonations(filters?: { type?: string; location?: { lat: number; lng: number; radius?: number } }): Promise<Donation[]> {
    let donations = Array.from(this.donations.values());
    
    if (filters?.type) {
      donations = donations.filter(d => d.type === filters.type);
    }
    
    return donations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDonation(id: string): Promise<Donation | undefined> {
    return this.donations.get(id);
  }

  async updateDonation(id: string, donationUpdate: Partial<Donation>): Promise<Donation> {
    const donation = this.donations.get(id);
    if (!donation) throw new Error('Donation not found');
    const updatedDonation = { ...donation, ...donationUpdate };
    this.donations.set(id, updatedDonation);
    return updatedDonation;
  }

  async createRequest(requestData: InsertRequest & { requesterId: string }): Promise<Request> {
    const id = randomUUID();
    const request: Request = {
      ...requestData,
      id,
      raisedAmount: "0",
      receivedQuantity: 0,
      images: requestData.images || [],
      status: "active",
      createdAt: new Date(),
    };
    this.requests.set(id, request);

    // Add to activity feed
    await this.createActivityFeedItem({
      userId: requestData.requesterId,
      type: 'request',
      title: `New request: ${request.title}`,
      description: request.description,
      metadata: { requestId: id, urgency: request.urgency },
      likes: 0,
      comments: 0,
    });

    return request;
  }

  async getRequests(filters?: { type?: string; urgency?: string; location?: { lat: number; lng: number; radius?: number } }): Promise<Request[]> {
    let requests = Array.from(this.requests.values());
    
    if (filters?.type) {
      requests = requests.filter(r => r.type === filters.type);
    }
    
    if (filters?.urgency) {
      requests = requests.filter(r => r.urgency === filters.urgency);
    }
    
    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRequest(id: string): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async updateRequest(id: string, requestUpdate: Partial<Request>): Promise<Request> {
    const request = this.requests.get(id);
    if (!request) throw new Error('Request not found');
    const updatedRequest = { ...request, ...requestUpdate };
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  async createActivity(activityData: InsertActivity & { organizerId: string }): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...activityData,
      id,
      currentVolunteers: 0,
      skills: activityData.skills || [],
      status: "active",
      createdAt: new Date(),
    };
    this.activities.set(id, activity);

    // Add to activity feed
    await this.createActivityFeedItem({
      userId: activityData.organizerId,
      type: 'volunteer',
      title: `New volunteer opportunity: ${activity.title}`,
      description: activity.description,
      metadata: { activityId: id, location: activity.location },
      likes: 0,
      comments: 0,
    });

    return activity;
  }

  async getActivities(filters?: { location?: { lat: number; lng: number; radius?: number } }): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async updateActivity(id: string, activityUpdate: Partial<Activity>): Promise<Activity> {
    const activity = this.activities.get(id);
    if (!activity) throw new Error('Activity not found');
    const updatedActivity = { ...activity, ...activityUpdate };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async createVolunteerRegistration(registrationData: InsertVolunteerRegistration & { volunteerId: string }): Promise<VolunteerRegistration> {
    const id = randomUUID();
    const registration: VolunteerRegistration = {
      ...registrationData,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.volunteerRegistrations.set(id, registration);
    return registration;
  }

  async getVolunteerRegistrations(volunteerId: string): Promise<VolunteerRegistration[]> {
    return Array.from(this.volunteerRegistrations.values()).filter(r => r.volunteerId === volunteerId);
  }

  async getMatches(userId: string): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(m => m.userId === userId);
  }

  async createMatch(matchData: Omit<Match, 'id' | 'createdAt'>): Promise<Match> {
    const id = randomUUID();
    const match: Match = {
      ...matchData,
      id,
      createdAt: new Date(),
    };
    this.matches.set(id, match);
    return match;
  }

  async getActivityFeed(limit = 50): Promise<ActivityFeedItem[]> {
    return Array.from(this.activityFeed.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivityFeedItem(itemData: Omit<ActivityFeedItem, 'id' | 'createdAt'>): Promise<ActivityFeedItem> {
    const id = randomUUID();
    const item: ActivityFeedItem = {
      ...itemData,
      id,
      createdAt: new Date(),
    };
    this.activityFeed.set(id, item);
    return item;
  }

  async createPayment(paymentData: InsertPayment & { payerId: string }): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = {
      ...paymentData,
      id,
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async updatePayment(id: string, paymentUpdate: Partial<Payment>): Promise<Payment> {
    const payment = this.payments.get(id);
    if (!payment) throw new Error('Payment not found');
    const updatedPayment = { ...payment, ...paymentUpdate };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...notificationData,
      id,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.set(id, { ...notification, read: true });
    }
  }
}

export const storage = new MemStorage();
