import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userTypeEnum = pgEnum("user_type", [
  "donor", "volunteer", "ngo", "business", "medical", "farmer", 
  "clothing", "event_host", "vacant_home", "disaster_relief"
]);

export const donationTypeEnum = pgEnum("donation_type", [
  "monetary", "food", "clothing", "medical", "educational", "shelter", "other"
]);

export const statusEnum = pgEnum("status", ["active", "pending", "completed", "cancelled"]);

export const urgencyEnum = pgEnum("urgency", ["low", "medium", "high", "emergency"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  userType: userTypeEnum("user_type").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  bio: text("bio"),
  location: jsonb("location").$type<{ lat: number; lng: number; address: string }>(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organizations table (for NGOs, businesses, etc.)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  documents: text("documents").array(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Donations table
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  donorId: uuid("donor_id").references(() => users.id).notNull(),
  recipientId: uuid("recipient_id").references(() => users.id),
  type: donationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  quantity: integer("quantity"),
  location: jsonb("location").$type<{ lat: number; lng: number; address: string }>(),
  images: text("images").array(),
  status: statusEnum("status").default("active").notNull(),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Requests table
export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: uuid("requester_id").references(() => users.id).notNull(),
  type: donationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  urgency: urgencyEnum("urgency").default("medium").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }),
  raisedAmount: decimal("raised_amount", { precision: 10, scale: 2 }).default("0"),
  targetQuantity: integer("target_quantity"),
  receivedQuantity: integer("received_quantity").default(0),
  location: jsonb("location").$type<{ lat: number; lng: number; address: string }>(),
  images: text("images").array(),
  status: statusEnum("status").default("active").notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Volunteer activities table
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizerId: uuid("organizer_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: jsonb("location").$type<{ lat: number; lng: number; address: string }>().notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  maxVolunteers: integer("max_volunteers"),
  currentVolunteers: integer("current_volunteers").default(0),
  skills: text("skills").array(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Volunteer registrations table
export const volunteerRegistrations = pgTable("volunteer_registrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: uuid("activity_id").references(() => activities.id).notNull(),
  volunteerId: uuid("volunteer_id").references(() => users.id).notNull(),
  status: statusEnum("status").default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Matches table (AI-powered matching)
export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  donationId: uuid("donation_id").references(() => donations.id),
  requestId: uuid("request_id").references(() => requests.id),
  activityId: uuid("activity_id").references(() => activities.id),
  userId: uuid("user_id").references(() => users.id).notNull(),
  score: decimal("score", { precision: 3, scale: 2 }).notNull(),
  reason: text("reason"),
  status: statusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Live activity feed table
export const activityFeed = pgTable("activity_feed", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'donation', 'request', 'volunteer', 'match'
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  payerId: uuid("payer_id").references(() => users.id).notNull(),
  recipientId: uuid("recipient_id").references(() => users.id).notNull(),
  donationId: uuid("donation_id").references(() => donations.id),
  requestId: uuid("request_id").references(() => requests.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpayOrderId: text("razorpay_order_id"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  userType: true,
  phone: true,
  bio: true,
  location: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  description: true,
  website: true,
  documents: true,
});

export const insertDonationSchema = createInsertSchema(donations).pick({
  type: true,
  title: true,
  description: true,
  amount: true,
  quantity: true,
  location: true,
  images: true,
  expiryDate: true,
});

export const insertRequestSchema = createInsertSchema(requests).pick({
  type: true,
  title: true,
  description: true,
  urgency: true,
  targetAmount: true,
  targetQuantity: true,
  location: true,
  images: true,
  deadline: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  title: true,
  description: true,
  location: true,
  startTime: true,
  endTime: true,
  maxVolunteers: true,
  skills: true,
});

export const insertVolunteerRegistrationSchema = createInsertSchema(volunteerRegistrations).pick({
  activityId: true,
  message: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  recipientId: true,
  donationId: true,
  requestId: true,
  amount: true,
  razorpayPaymentId: true,
  razorpayOrderId: true,
  status: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertVolunteerRegistration = z.infer<typeof insertVolunteerRegistrationSchema>;
export type VolunteerRegistration = typeof volunteerRegistrations.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type ActivityFeedItem = typeof activityFeed.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
