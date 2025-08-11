// auth.ts
import { Express, RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";
import { TokenResponse } from "./types"; // We'll create this

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["organization", "consultant"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  return session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(user: any, tokens: TokenResponse) {
  user.claims = {
    sub: tokens.userId,
    email: tokens.email,
    first_name: tokens.firstName,
    last_name: tokens.lastName,
    profile_image_url: tokens.profileImageUrl,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 1 week
  };
  user.access_token = tokens.accessToken;
  user.refresh_token = tokens.refreshToken;
  user.expires_at = user.claims.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.first_name,
    lastName: claims.last_name,
    profileImageUrl: claims.profile_image_url,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(credentials.email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(
        credentials.password,
        user.password
      );
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create tokens and session similar to Replit auth format
      const tokens: TokenResponse = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImageUrl: user.profileImageUrl || "",
        accessToken: process.env.ACCESS_TOKEN,
        refreshToken: `refresh_${Date.now()}`,
      };

      const sessionUser: any = {};
      updateUserSession(sessionUser, tokens);
      await upsertUser(sessionUser.claims);

      // Store in session using same format as Replit auth
      (req.session as any).passport = { user: sessionUser };
      req.user = sessionUser;

      res.json({ message: "Login successful", user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const user = await storage.upsertUser({
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        password: hashedPassword,
        onboardingCompleted: false,
      });

      // Create tokens and session similar to Replit auth format
      const tokens: TokenResponse = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImageUrl: user.profileImageUrl || "",
        accessToken: process.env.ACCESS_TOKEN,
        refreshToken: `refresh_${Date.now()}`,
      };

      const sessionUser = {};
      updateUserSession(sessionUser, tokens);

      // Store in session using same format as Replit auth
      (req.session as any).passport = { user: sessionUser };
      req.user = sessionUser;

      res.json({ message: "Registration successful", user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Logout endpoint
  app.get("/api/logout", (req, res) => {
    const session = req.session as any;

    // Clear demo token if present
    if (session?.passport?.user?.access_token === process.env.ACCESS_TOKEN) {
      delete session.passport;
      delete req.user;
    }

    // Clear all session data
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      // Clear the session cookie with force expire
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: -1,
        expires: new Date(0),
      });

      // Redirect to home page or send success response
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  const session = req.session as any;

  if (session?.passport?.user?.access_token === process.env.ACCESS_TOKEN) {
    req.user = session.passport.user;
    return next();
  }

  if (!session?.passport?.user || !user?.claims?.exp) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.claims.exp) {
    return next();
  }

  if (user.refresh_token) {
    try {
      const tokens: TokenResponse = {
        userId: user.claims.sub,
        email: user.claims.email,
        firstName: user.claims.first_name,
        lastName: user.claims.last_name,
        profileImageUrl: user.claims.profile_image_url,
        accessToken: process.env.ACCESS_TOKEN,
        refreshToken: `refresh_${Date.now()}`,
      };

      updateUserSession(user, tokens);
      return next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  }

  res.status(401).json({ message: "Unauthorized" });
};

// Add types.ts file:
// export interface TokenResponse {
//   userId: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   profileImageUrl: string;
//   accessToken: string;
//   refreshToken: string;
// }
