import express, { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { storage } from "./storage";
import {
  insertUserSchema,
  insertDonationSchema,
  insertRequestSchema,
  insertActivitySchema,
  insertVolunteerRegistrationSchema,
  insertPaymentSchema,
  insertOrganizationSchema,
} from "@shared/schema";

import {
  chatWithAI,
  generateSmartMatches,
  analyzeImage,
  generateDonationSuggestions,
} from "./services/openai";
import { razorpayService } from "./services/razorpay";
import { twilioService } from "./services/twilio";

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const upload = multer({ storage: multer.memoryStorage() });
const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-key";

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 100,
});
app.use(limiter);

// Authentication middleware
const authenticate = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ===================== ROUTES =====================

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ----------------- AUTH -----------------
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) return res.status(409).json({ message: "User exists" });

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await storage.createUser({ ...userData, password: hashedPassword });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    const { password, ...userResponse } = user;

    res.status(201).json({ user: userResponse, token });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    const { password: _, ...userResponse } = user;
    res.json({ user: userResponse, token });
  } catch (err) {
    res.status(400).json({ message: "Login failed" });
  }
});

app.get("/api/auth/me", authenticate, async (req: Request & { user?: any }, res) => {
  const { password, ...userResponse } = req.user;
  res.json({ user: userResponse });
});

// ----------------- CHAT -----------------
app.post("/api/chat", authenticate, async (req: Request & { user?: any }, res) => {
  try {
    const { message } = req.body;
    const response = await chatWithAI(message, req.user);
    res.json(response);
  } catch {
    res.status(500).json({ message: "Chat service temporarily unavailable" });
  }
});

// ----------------- DONATIONS -----------------
app.post(
  "/api/donations",
  authenticate,
  upload.array("images", 5),
  async (req: Request & { user?: any; files?: any }, res) => {
    try {
      const donationData = insertDonationSchema.parse(req.body);

      // Handle uploaded images (placeholder)
      const images: string[] = [];
      if (req.files) {
        for (const file of req.files) {
          const fileName = `donations/${Date.now()}-${file.originalname}`;
          images.push(`https://placeholder.com/${fileName}`);
        }
      }

      const donation = await storage.createDonation({
        ...donationData,
        donorId: req.user.id,
        images,
      });

      // Generate smart matches
      const matches = await generateSmartMatches(req.user, [donation]);
      for (const match of matches) {
        await storage.createMatch({
          donationId: donation.id,
          requestId: null,
          activityId: null,
          userId: req.user.id,
          score: match.score.toString(),
          reason: match.reason,
          status: "pending",
        });
      }

      // Notify via Twilio
      if (req.user.phone && donationData.amount) {
        await twilioService.sendDonationAlert(req.user.phone, donation.title, `₹${donationData.amount}`);
      }

      res.status(201).json(donation);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to create donation" });
    }
  }
);

app.get("/api/donations", async (req, res) => {
  try {
    const donations = await storage.getDonations();
    res.json(donations);
  } catch {
    res.status(500).json({ message: "Failed to fetch donations" });
  }
});

// ----------------- IMAGE ANALYSIS -----------------
app.post(
  "/api/analyze-image",
  authenticate,
  upload.single("image"),
  async (req: Request & { user?: any; file?: any }, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No image provided" });

      const base64Image = req.file.buffer.toString("base64");
      const analysis = await analyzeImage(base64Image);
      res.json({ analysis });
    } catch {
      res.status(500).json({ message: "Image analysis failed" });
    }
  }
);

// ----------------- REAL-TIME PLACEHOLDER -----------------
httpServer.on("upgrade", (request, socket, head) => {
  console.log("WebSocket connection upgrade requested");
});

// ===================== SERVER START =====================
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
