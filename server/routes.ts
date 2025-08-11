import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import {
  insertOrganizationSchema,
  insertConsultantProfileSchema,
  insertGhgEmissionSchema,
  insertMaterialityTopicSchema,
  insertFacilitySchema,
  emissionFactors,
} from "@shared/schema";
import { z } from "zod";
import { Router } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  upload,
  readExcelFile,
  parseUKConversionFactors,
  type ExcelData,
} from "./excelReader";
import bcrypt from "bcrypt";
// Helper function to get accessible organizations for both owners and consultants
async function getAccessibleOrganizations(userId: string) {
  // First try to get organizations owned by the user
  const ownedOrgs = await storage.getOrganizationsByOwner(userId);

  if (ownedOrgs.length > 0) {
    return ownedOrgs;
  }

  // If no owned organizations, check for consultant relationships
  const consultantOrgs = await storage.getConsultantOrganizations(userId);

  if (consultantOrgs.length > 0) {
    // Map consultant organizations to organization objects
    return consultantOrgs.map((co) => ({
      id: co.organizationId,
      name: co.organizationName,
      industry: co.industry,
      country: co.country,
      employeeCount: co.employeeCount,
      annualRevenue: co.annualRevenue,
      reportingYear: co.reportingYear,
    }));
  }

  return [];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const validPassword = await bcrypt.compare(password, user?.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl,
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
        },
        access_token: process.env.ACCESS_TOKEN,
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      (req.session as any).passport = { user: sessionUser };
      req.user = sessionUser;

      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            onboardingCompleted: user.onboardingCompleted,
            role: user.role,
          },
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Demo login endpoint
  app.post("/api/demo-login", async (req: any, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "Invalid demo user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Demo user not found" });
      }

      // Create a demo session
      const demoUser = {
        claims: {
          sub: userId,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
        access_token: process.env.ACCESS_TOKEN,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      // Store demo user in session using passport format
      (req.session as any).passport = { user: demoUser };
      req.user = demoUser;

      // Save session to ensure it persists
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
        }
      });

      res.json({ message: "Demo login successful", user });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Demo login failed" });
    }
  });

  // User profile routes
  app.patch("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!role || !["organization", "consultant"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.upsertUser({
        id: userId,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        role,
      });

      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch("/api/user/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        onboardingCompleted: true,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Onboarding session creation (for new users during onboarding)
  app.post("/api/onboarding-session", async (req: any, res) => {
    try {
      const { email, firstName, lastName, role } = req.body;

      if (!email || !role || !["organization", "consultant"].includes(role)) {
        return res.status(400).json({ message: "Invalid onboarding data" });
      }

      // Generate a temporary user ID for onboarding
      const tempUserId = `temp_${role}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create temporary user session for onboarding
      const tempUser = {
        claims: {
          sub: tempUserId,
          email: email, // Use the actual email from the form
          first_name: firstName,
          last_name: lastName,
          profile_image_url: null,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
        access_token: process.env.ACCESS_TOKEN,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      // Store temp user in session
      (req.session as any).passport = { user: tempUser };
      req.user = tempUser;

      // Save session
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.json({ message: "Onboarding session created", userId: tempUserId });
      });
    } catch (error) {
      console.error("Error creating onboarding session:", error);
      res.status(500).json({ message: "Failed to create onboarding session" });
    }
  });

  // Organization routes
  app.post("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      let userId = req.user.claims.sub;
      const requestData = req.body.data;
      const { userData } = req.body;
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const userEmail = requestData.ownerEmail || req.user.claims.email;
      const organizationData = {
        name: requestData.name,
        industry: requestData.industry,
        businessType: requestData.businessType,
        country: requestData.country,
        employeeCount: requestData.employeeCount,
        annualRevenue: requestData.annualRevenue,
        reportingYear: requestData.reportingYear || new Date().getFullYear(),
      };

      // Validate organization data against schema
      const validatedOrgData = insertOrganizationSchema.parse(organizationData);
      // If this is a temporary onboarding user, create a permanent user account
      if (userId.startsWith("temp_")) {
        // Check if a user with this email already exists
        const existingUser = await storage.getUserByEmail(userEmail);

        if (existingUser) {
          // User already exists, use their ID and update their information
          userId = existingUser.id;

          // Update existing user with new information
          const user = await storage.upsertUser({
            id: existingUser.id,
            email: userEmail,
            password: hashedPassword,
            firstName: req.user.claims.first_name || existingUser.firstName,
            lastName: req.user.claims.last_name || existingUser.lastName,
            profileImageUrl:
              req.user.claims.profile_image_url || existingUser.profileImageUrl,
            role: "organization",
            onboardingCompleted: true,
          });
        } else {
          // Create new permanent user account
          const permanentUserId = `org_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          const user = await storage.upsertUser({
            id: permanentUserId,
            email: userEmail,
            password: hashedPassword,
            firstName: req.user.claims.first_name,
            lastName: req.user.claims.last_name,
            profileImageUrl: req.user.claims.profile_image_url,
            role: "organization",
            onboardingCompleted: true,
          });

          userId = permanentUserId;
        }

        // Update session with permanent user ID
        req.user.claims.sub = userId;
        (req.session as any).passport.user.claims.sub = userId;

        // Save updated session
        req.session.save((err: any) => {
          if (err) console.error("Session update error:", err);
        });
      }

      const organization = await storage.createOrganization({
        ...validatedOrgData,
        ownerId: userId,
      });

      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let organizations;
      if (user.role === "organization") {
        organizations = await storage.getOrganizationsByOwner(userId);
      } else {
        organizations = await storage.getOrganizationsByConsultant(userId);
      }

      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const organization = await storage.getOrganization(organizationId);

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Consultant Profile routes
  app.post("/api/consultants", isAuthenticated, async (req: any, res) => {
    try {
      let userId = req.user.claims.sub;
      const consultantData = insertConsultantProfileSchema.parse(req.body.data);
      const { userData } = req.body;
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // If this is a temporary onboarding user, create a permanent user account
      if (userId.startsWith("temp_")) {
        // Check if a user with this email already exists
        const existingUser = await storage.getUserByEmail(
          req.user.claims.email
        );

        if (existingUser) {
          // User already exists, use their ID and update their information
          userId = existingUser.id;

          // Update existing user with new information
          const user = await storage.upsertUser({
            id: existingUser.id,
            password: hashedPassword,
            email: req.user.claims.email,
            firstName: req.user.claims.first_name || existingUser.firstName,
            lastName: req.user.claims.last_name || existingUser.lastName,
            profileImageUrl:
              req.user.claims.profile_image_url || existingUser.profileImageUrl,
            role: "consultant",
            onboardingCompleted: true,
          });
        } else {
          // Create new permanent user account
          const permanentUserId = `consultant_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          const user = await storage.upsertUser({
            id: permanentUserId,
            email: req.user.claims.email,
            password: hashedPassword,
            firstName: req.user.claims.first_name,
            lastName: req.user.claims.last_name,
            profileImageUrl: req.user.claims.profile_image_url,
            role: "consultant",
            onboardingCompleted: true,
          });

          userId = permanentUserId;
        }

        // Update session with permanent user ID
        req.user.claims.sub = userId;
        (req.session as any).passport.user.claims.sub = userId;

        // Save updated session
        req.session.save((err: any) => {
          if (err) console.error("Session update error:", err);
        });
      }

      const consultantProfile = await storage.createConsultantProfile({
        ...consultantData,
        userId,
      });

      res.json(consultantProfile);
    } catch (error) {
      console.error("Error creating consultant profile:", error);
      res.status(500).json({ message: "Failed to create consultant profile" });
    }
  });

  app.get(
    "/api/consultants/profile",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.getConsultantProfileByUserId(userId);

        if (!profile) {
          return res
            .status(404)
            .json({ message: "Consultant profile not found" });
        }

        res.json(profile);
      } catch (error) {
        console.error("Error fetching consultant profile:", error);
        res.status(500).json({ message: "Failed to fetch consultant profile" });
      }
    }
  );

  // Company Profile routes
  app.get("/api/company-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get user's accessible organizations (owned or consultant)
      const organizations = await getAccessibleOrganizations(userId);
      if (organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      const organization = organizations[0];
      const companyProfile = await storage.getCompanyProfileByOrganization(
        organization.id
      );

      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      // Get related data
      const subsidiaries = await storage.getSubsidiariesByCompanyProfile(
        companyProfile.id
      );
      const ownershipStructure =
        await storage.getOwnershipStructureByCompanyProfile(companyProfile.id);
      const sustainabilityInitiatives =
        await storage.getSustainabilityInitiativesByCompanyProfile(
          companyProfile.id
        );
      const sustainabilityKPIs =
        await storage.getSustainabilityKPIsByCompanyProfile(companyProfile.id);

      res.json({
        ...companyProfile,
        subsidiaries,
        ownershipStructure,
        sustainabilityInitiatives,
        sustainabilityKPIs,
      });
    } catch (error) {
      console.error("Error fetching company profile:", error);
      res.status(500).json({ message: "Failed to fetch company profile" });
    }
  });
  app.get(
    "/api/company-profile/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizationId = req.params.id;

        if (!organizationId) {
          return res
            .status(400)
            .json({ message: "Organization ID is required" });
        }

        const companyProfile = await storage.getCompanyProfileByOrganization(
          organizationId
        );

        if (!companyProfile) {
          return res.status(202).json({
            legalName: "",
            legalForm: "",
            registeredAddress: "",
            country: "",
            naceSectorCode: "",
            fiscalYearEnd: null,
            parentCompany: "",
            reportingBasis: "",
            subsidiaries: [],
            ownershipStructure: [],
            sustainabilityInitiatives: [],
            sustainabilityKPIs: [],
          });
        }

        const subsidiaries = await storage.getSubsidiariesByCompanyProfile(
          companyProfile.id
        );
        const ownershipStructure =
          await storage.getOwnershipStructureByCompanyProfile(
            companyProfile.id
          );
        const sustainabilityInitiatives =
          await storage.getSustainabilityInitiativesByCompanyProfile(
            companyProfile.id
          );
        const sustainabilityKPIs =
          await storage.getSustainabilityKPIsByCompanyProfile(
            companyProfile.id
          );

        res.json({
          ...companyProfile,
          subsidiaries,
          ownershipStructure,
          sustainabilityInitiatives,
          sustainabilityKPIs,
        });
      } catch (error) {
        console.error("Error fetching company profile:", error);
        res.status(500).json({ message: "Failed to fetch company profile" });
      }
    }
  );

  // Materiality Topics routes
  app.get("/api/materiality-topics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Get user's accessible organizations (owned or consultant)
      const organizations = await getAccessibleOrganizations(userId);
      if (!organizations || organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }
      let organizationId = organizations[0].id;

      if (req.query.organizationId !== undefined) {
        if (
          isNaN(Number(req.query.organizationId)) ||
          req.query.organizationId === "none"
        ) {
          return res
            .status(400)
            .json({ message: "Invalid organizationId parameter" });
        }
        const requestedId = parseInt(req.query.organizationId);
        if (!isNaN(requestedId) && requestedId > 0) {
          // Only allow if user has access
          const found = organizations.find((org) => org.id === requestedId);
          if (found) {
            organizationId = requestedId;
          } else {
            return res
              .status(403)
              .json({ message: "Access denied to this organization" });
          }
        }
      }

      const topics = await storage.getMaterialityTopicsByOrganization(
        organizationId
      );
      res.json(topics);
    } catch (error) {
      console.error("Error fetching materiality topics:", error);
      res.status(500).json({ message: "Failed to fetch materiality topics" });
    }
  });

  app.post(
    "/api/materiality-topics",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Get user's accessible organizations (owned or consultant)
        const organizations = await getAccessibleOrganizations(userId);
        let organizationId;
        console.log(req.body.organizationId, "dfff");
        if (
          req.body &&
          req.body.organizationId &&
          +req.body.organizationId > 0
        ) {
          organizationId = req.body.organizationId;
        } else if (organizations && organizations.length > 0) {
          organizationId = organizations[0].id;
        } else {
          return res
            .status(400)
            .json({ message: "No organization found for user" });
        }

        const topicData = insertMaterialityTopicSchema.parse({
          ...req.body,
          organizationId,
        });

        // Upsert logic: check if topic exists for this org and topic name
        const existingTopics = await storage.getMaterialityTopicsByOrganization(
          organizationId
        );
        const existing = existingTopics.find(
          (t) => t.topic === topicData.topic
        );

        let topic;
        if (existing) {
          topic = await storage.updateMaterialityTopic(existing.id, topicData);
        } else {
          topic = await storage.createMaterialityTopic(topicData);
        }

        res.json(topic);
      } catch (error) {
        console.error("Error creating/updating materiality topic:", error);
        res
          .status(500)
          .json({ message: "Failed to create/update materiality topic" });
      }
    }
  );

  app.patch(
    "/api/materiality-topics/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const topicId = parseInt(req.params.id);
        const updates = req.body;

        const topic = await storage.updateMaterialityTopic(topicId, updates);
        res.json(topic);
      } catch (error) {
        console.error("Error updating materiality topic:", error);
        res.status(500).json({ message: "Failed to update materiality topic" });
      }
    }
  );

  app.delete(
    "/api/materiality-topics/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const topicId = parseInt(req.params.id);

        await storage.deleteMaterialityTopic(topicId);
        res.json({ message: "Topic deleted successfully" });
      } catch (error) {
        console.error("Error deleting materiality topic:", error);
        res.status(500).json({ message: "Failed to delete materiality topic" });
      }
    }
  );

  app.post("/api/company-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let organizationIdData = null;
      if (!req.body?.organizationId) {
        const organizations = await storage.getOrganizationsByOwner(userId);
        if (organizations.length === 0) {
          return res
            .status(400)
            .json({ message: "No organization found for user" });
        }
        organizationIdData = organizations[0]?.id;
      } else {
        organizationIdData = req.body.organizationId;
      }

      const {
        subsidiaries: subsidiaryData = [],
        ownershipStructure: ownershipData = [],
        sustainabilityInitiatives: initiativeData = [],
        sustainabilityKPIs: kpiData = [],
        ...profileData
      } = req.body;

      // Check if profile already exists
      let companyProfile = await storage.getCompanyProfileByOrganization(
        organizationIdData
      );

      if (companyProfile) {
        // Update existing profile
        companyProfile = await storage.updateCompanyProfile(companyProfile.id, {
          ...profileData,
          organizationId: organizationIdData,
        });
      } else {
        // Create new profile
        companyProfile = await storage.createCompanyProfile({
          ...profileData,
          organizationId: organizationIdData,
        });
      }

      // Handle subsidiaries
      for (const subsidiary of subsidiaryData) {
        if (subsidiary.name && subsidiary.country) {
          await storage.createSubsidiary({
            ...subsidiary,
            companyProfileId: companyProfile.id,
          });
        }
      }

      // Handle ownership structure
      for (const ownership of ownershipData) {
        if (ownership.entityName && ownership.role) {
          await storage.createOwnershipStructure({
            ...ownership,
            companyProfileId: companyProfile.id,
          });
        }
      }

      // Handle sustainability initiatives
      for (const initiative of initiativeData) {
        if (initiative.initiativeName && initiative.description) {
          await storage.createSustainabilityInitiative({
            ...initiative,
            companyProfileId: companyProfile.id,
          });
        }
      }

      // Handle sustainability KPIs
      for (const kpi of kpiData) {
        if (kpi.goalTitle && kpi.goalDescription) {
          await storage.createSustainabilityKPI({
            ...kpi,
            companyProfileId: companyProfile.id,
          });
        }
      }

      res.json(companyProfile);
    } catch (error) {
      console.error("Error creating/updating company profile:", error);
      res.status(500).json({ message: "Failed to save company profile" });
    }
  });

  // GHG Emissions routes
  app.get("/api/ghg-emissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let organizationIdData = null;
      if (!req.query?.organizationId) {
        const organizations = await getAccessibleOrganizations(userId);
        if (organizations.length === 0) {
          return res.status(404).json({ message: "No organization found" });
        }
        organizationIdData = organizations[0].id;
      } else {
        organizationIdData = req.query?.organizationId;
      }
      const emissions = await storage.getGhgEmissionsByOrganization(
        organizationIdData
      );

      res.json(emissions);
    } catch (error) {
      console.error("Error fetching GHG emissions:", error);
      res.status(500).json({ message: "Failed to fetch GHG emissions" });
    }
  });

  app.post("/api/ghg-emissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let organizationIdData = null;
      if (!req.body?.organizationId) {
        // Get user's accessible organizations (owned or consultant)
        const organizations = await getAccessibleOrganizations(userId);
        if (organizations.length === 0) {
          return res.status(404).json({ message: "No organization found" });
        }
        console.log(
          "No organizationId provided in request body",
          organizations[0].id
        );

        organizationIdData = organizations[0].id;
      } else {
        organizationIdData = req.body?.organizationId;
      }

      const emissionData = insertGhgEmissionSchema.parse({
        ...req.body,
        organizationId: organizationIdData,
      });

      const emission = await storage.createGhgEmission(emissionData);
      res.json(emission);
    } catch (error) {
      console.error("Error creating GHG emission:", error);
      res.status(500).json({ message: "Failed to create GHG emission" });
    }
  });
  app.post(
    "/api/organizations/:id/ghg-emissions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizationId = parseInt(req.params.id);
        const emissionData = insertGhgEmissionSchema.parse(req.body);

        const emission = await storage.createGhgEmission({
          ...emissionData,
          organizationId,
        });

        res.json(emission);
      } catch (error) {
        console.error("Error creating GHG emission:", error);
        res.status(500).json({ message: "Failed to create GHG emission" });
      }
    }
  );

  app.get(
    "/api/organizations/:id/ghg-emissions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizationId = parseInt(req.params.id);
        const emissions = await storage.getGhgEmissionsByOrganization(
          organizationId
        );
        res.json(emissions);
      } catch (error) {
        console.error("Error fetching GHG emissions:", error);
        res.status(500).json({ message: "Failed to fetch GHG emissions" });
      }
    }
  );

  // Materiality Topics routes
  app.post(
    "/api/organizations/:id/materiality-topics",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizationId = parseInt(req.params.id);
        const topicData = insertMaterialityTopicSchema.parse(req.body);

        const topic = await storage.createMaterialityTopic({
          ...topicData,
          organizationId,
        });

        res.json(topic);
      } catch (error) {
        console.error("Error creating materiality topic:", error);
        res.status(500).json({ message: "Failed to create materiality topic" });
      }
    }
  );

  app.get(
    "/api/organizations/:id/materiality-topics",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizationId = parseInt(req.params.id);
        const topics = await storage.getMaterialityTopicsByOrganization(
          organizationId
        );
        res.json(topics);
      } catch (error) {
        console.error("Error fetching materiality topics:", error);
        res.status(500).json({ message: "Failed to fetch materiality topics" });
      }
    }
  );

  // ESRS Disclosures routes
  app.get(
    "/api/organizations/:id/esrs-disclosures",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizationId = parseInt(req.params.id);
        const disclosures = await storage.getEsrsDisclosuresByOrganization(
          organizationId
        );
        res.json(disclosures);
      } catch (error) {
        console.error("Error fetching ESRS disclosures:", error);
        res.status(500).json({ message: "Failed to fetch ESRS disclosures" });
      }
    }
  );

  // Dashboard summary routes
  app.get(
    "/api/organizations/:id/dashboard-summary",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizationId = parseInt(req.params.id);

        const [organization, emissions, topics, disclosures] =
          await Promise.all([
            storage.getOrganization(organizationId),
            storage.getGhgEmissionsByOrganization(organizationId),
            storage.getMaterialityTopicsByOrganization(organizationId),
            storage.getEsrsDisclosuresByOrganization(organizationId),
          ]);

        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Calculate summary metrics
        const totalEmissions = emissions.reduce((sum, emission) => {
          return sum + parseFloat(emission.co2Equivalent || "0");
        }, 0);

        const scope1Emissions = emissions
          .filter((e) => e.scope === "scope1")
          .reduce((sum, e) => sum + parseFloat(e.co2Equivalent || "0"), 0);

        const scope2Emissions = emissions
          .filter((e) => e.scope === "scope2")
          .reduce((sum, e) => sum + parseFloat(e.co2Equivalent || "0"), 0);

        const scope3Emissions = emissions
          .filter((e) => e.scope === "scope3")
          .reduce((sum, e) => sum + parseFloat(e.co2Equivalent || "0"), 0);

        const materialityByCategory = topics.reduce((acc, topic) => {
          const category = topic.category || "other";
          if (!acc[category]) acc[category] = [];
          acc[category].push(topic);
          return acc;
        }, {} as Record<string, typeof topics>);

        const completionRate =
          disclosures.length > 0
            ? disclosures.reduce(
                (sum, d) => sum + (d.completionPercentage || 0),
                0
              ) / disclosures.length
            : 0;

        res.json({
          organization,
          emissions: {
            total: totalEmissions,
            scope1: scope1Emissions,
            scope2: scope2Emissions,
            scope3: scope3Emissions,
            byScope: {
              scope1: scope1Emissions,
              scope2: scope2Emissions,
              scope3: scope3Emissions,
            },
          },
          materiality: {
            total: topics.length,
            byCategory: materialityByCategory,
            // highPriority: topics.filter(
            //   (t) => parseFloat(t.overallScore?.toString() || "0") > 3
            // ).length,
          },
          compliance: {
            totalDisclosures: disclosures.length,
            completionRate,
            approved: disclosures.filter((d) => d.status === "approved").length,
            inReview: disclosures.filter((d) => d.status === "review").length,
            draft: disclosures.filter((d) => d.status === "draft").length,
          },
        });
      } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ message: "Failed to fetch dashboard summary" });
      }
    }
  );

  app.post("/api/emission-factors", isAuthenticated, async (req: any, res) => {
    const { level1, level2, level3, uom } = req.body;

    try {
      let factor;

      // --------------------------
      // Primary: all values present
      // --------------------------
      const baseConditions = [eq(emissionFactors.level1, level1)];
      if (level2) baseConditions.push(eq(emissionFactors.level2, level2));
      if (level3) baseConditions.push(eq(emissionFactors.level3, level3));
      if (uom) baseConditions.push(eq(emissionFactors.uom, uom));

      [factor] = await db
        .select()
        .from(emissionFactors)
        .where(and(...baseConditions));

      // --------------------------
      // Fallback 1: level3 omitted
      // --------------------------
      if (!factor && level2 && !level3) {
        const fallback1 = [
          eq(emissionFactors.level1, level1),
          eq(emissionFactors.level2, level2),
        ];
        if (uom) fallback1.push(eq(emissionFactors.uom, uom));

        [factor] = await db
          .select()
          .from(emissionFactors)
          .where(and(...fallback1));
      }

      // --------------------------
      // Fallback 2: only level1 + uom
      // --------------------------
      if (!factor && !level2 && !level3) {
        const fallback2 = [eq(emissionFactors.level1, level1)];
        if (uom) fallback2.push(eq(emissionFactors.uom, uom));

        [factor] = await db
          .select()
          .from(emissionFactors)
          .where(and(...fallback2));
      }

      // --------------------------
      // Fallback 3: only level1
      // --------------------------
      if (!factor && !uom) {
        [factor] = await db
          .select()
          .from(emissionFactors)
          .where(eq(emissionFactors.level1, level1));
      }

      if (!factor) {
        return res.status(404).json({ error: "Matching factor not found" });
      }

      const conversionFactor = parseFloat(factor.ghgConversionFactor);
      res.json({
        conversionFactor,
        result: conversionFactor,
      });
    } catch (error) {
      console.error("Calculation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Facilities routes
  app.get("/api/facilities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const organizations = await storage.getOrganizationsByOwner(userId);
      if (organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      const facilities = await storage.getFacilitiesByOrganization(
        organizations[0].id
      );
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.post("/api/facilities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const organizations = await storage.getOrganizationsByOwner(userId);
      if (organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      const validatedFacility = insertFacilitySchema.parse({
        ...req.body,
        organizationId: organizations[0].id,
      });

      const facility = await storage.createFacility(validatedFacility);
      res.json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(500).json({ message: "Failed to create facility" });
    }
  });

  app.put("/api/facilities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const facilityId = parseInt(req.params.id);
      const facility = await storage.updateFacility(facilityId, req.body);
      res.json(facility);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(500).json({ message: "Failed to update facility" });
    }
  });

  app.delete("/api/facilities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const facilityId = parseInt(req.params.id);
      await storage.deleteFacility(facilityId);
      res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });

  // Governance & Policies routes
  app.post(
    "/api/governance-structure",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        let organizationIdData = null;
        if (!req.body?.organizationId) {
          const organizations = await getAccessibleOrganizations(userId);
          if (!organizations || organizations.length === 0) {
            return res
              .status(404)
              .json({ message: "No organization found for user" });
          }
          organizationIdData = organizations[0].id;
        } else {
          organizationIdData = req.body?.organizationId;
        }

        const governanceData = {
          ...req.body,
          organizationId: organizationIdData,
        };
        const result = await storage.createGovernanceStructure(governanceData);
        res.json(result);
      } catch (error) {
        console.error("Error creating governance structure:", error);
        res
          .status(500)
          .json({ message: "Failed to create governance structure" });
      }
    }
  );

  app.get(
    "/api/governance-structure",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        let organizationIdData = null;

        if (!req.query?.organizationId) {
          const organizations = await getAccessibleOrganizations(userId);
          if (!organizations || organizations.length === 0) {
            return res
              .status(404)
              .json({ message: "No organization found for user" });
          }
          organizationIdData = organizations[0]?.id;
        } else {
          organizationIdData = req.query?.organizationId;
        }

        if (!organizationIdData) {
          return res
            .status(404)
            .json({ message: "No organization id for user" });
        }
        const result = await storage.getGovernanceStructureByOrganization(
          organizationIdData
        );
        if (!result) {
          return res
            .status(404)
            .json({ message: "Governance structure not found" });
        }
        res.json(result);
      } catch (error) {
        console.error("Error fetching governance structure:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch governance structure" });
      }
    }
  );

  app.put(
    "/api/governance-structure/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const { organizationId } = req.body;
        console.log(
          "Updating governance structure with ID:",
          id,
          "and organizationId:",
          organizationId
        );
        let result;
        if (organizationId) {
          const existing = await storage.getGovernanceStructureByOrganization(
            organizationId
          );

          if (existing) {
            result = await storage.updateGovernanceStructure(
              organizationId,
              req.body
            );
          } else {
            result = await storage.createGovernanceStructure({ ...req.body });
          }
        } else {
          result = await storage.updateGovernanceStructure(id, req.body);
        }
        res.json(result);
      } catch (error) {
        console.error("Error updating governance structure:", error);
        res
          .status(500)
          .json({ message: "Failed to update governance structure" });
      }
    }
  );

  app.post("/api/esg-policies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let organizationIdData = null;
      if (!req.body?.organizationId) {
        const organizations = await getAccessibleOrganizations(userId);
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }
        organizationIdData = organizations[0].id;
      } else {
        organizationIdData = req.body.organizationId;
      }

      if (!organizationIdData) {
        return res.status(404).json({ message: "No organization ID found" });
      }

      const policyData = {
        ...req.body,
        organizationId: organizationIdData,
        dateOfLastReview: req.body.dateOfLastReview
          ? new Date(req.body.dateOfLastReview)
          : "null",
      };

      const result = await storage.createEsgPolicy(policyData);
      res.json(result);
    } catch (error) {
      console.error("Error creating ESG policy:", error);
      res.status(500).json({ message: "Failed to create ESG policy" });
    }
  });

  app.get("/api/esg-policies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let organizationIdData = null;
      if (!req.query?.organizationId) {
        const organizations = await getAccessibleOrganizations(userId);
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }
        organizationIdData = organizations[0].id;
      } else {
        organizationIdData = req.query?.organizationId;
      }

      console.log(
        "Fetching ESG policies for organization ID:",
        organizationIdData
      );
      if (!organizationIdData) {
        return res.status(404).json({ message: "No organization ID found" });
      }

      const result = await storage.getEsgPoliciesByOrganization(
        organizationIdData
      );
      console.log("Fetched ESG policies for result ID:", result);

      if (!result) {
        return res.status(404).json({ message: "No ESG policies found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching ESG policies:", error);
      res.status(500).json({ message: "Failed to fetch ESG policies" });
    }
  });

  app.put("/api/esg-policies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      // Convert date string to Date object if provided
      const policyData = {
        ...req.body,
        dateOfLastReview: req.body.dateOfLastReview
          ? new Date(req.body.dateOfLastReview)
          : null,
      };

      const result = await storage.updateEsgPolicy(id, policyData);
      res.json(result);
    } catch (error) {
      console.error("Error updating ESG policy:", error);
      res.status(500).json({ message: "Failed to update ESG policy" });
    }
  });

  app.delete(
    "/api/esg-policies/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteEsgPolicy(id);
        res.json({ message: "ESG policy deleted successfully" });
      } catch (error) {
        console.error("Error deleting ESG policy:", error);
        res.status(500).json({ message: "Failed to delete ESG policy" });
      }
    }
  );

  app.post("/api/esg-incentives", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let organizationIdData = null;
      if (!req.body?.organizationId) {
        const organizations = await getAccessibleOrganizations(userId);
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }
        organizationIdData = organizations[0].id;
      } else {
        organizationIdData = req.body?.organizationId;
      }
      if (!organizationIdData) {
        return res.status(404).json({ message: "No organization ID found" });
      }
      const incentivesData = {
        ...req.body,
        organizationId: organizationIdData,
      };
      const result = await storage.createEsgIncentives(incentivesData);
      res.json(result);
    } catch (error) {
      console.error("Error creating ESG incentives:", error);
      res.status(500).json({ message: "Failed to create ESG incentives" });
    }
  });

  app.get("/api/esg-incentives", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let organizationIdData = null;
      if (!req.query?.organizationId) {
        const organizations = await getAccessibleOrganizations(userId);
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }
        organizationIdData = organizations[0].id;
      } else {
        organizationIdData = req.query?.organizationId;
      }
      if (!organizationIdData) {
        return res.status(404).json({ message: "No organization ID found" });
      }
      const result = await storage.getEsgIncentivesByOrganization(
        organizationIdData
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching ESG incentives:", error);
      res.status(500).json({ message: "Failed to fetch ESG incentives" });
    }
  });

  app.put("/api/esg-incentives/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { organizationId } = req.body;
      console.log(
        "Updating ESG incentives with ID:",
        id,
        "and organizationId:",
        organizationId
      );
      let result;
      if (organizationId) {
        const existing = await storage.getEsgIncentivesByOrganization(
          organizationId
        );

        if (existing) {
          result = await storage.updateEsgIncentives(
            organizationId,
            req.body
          );
        } else {
          result = await storage.createEsgIncentives(req.body);
        }
      } else {
        result = await storage.updateEsgIncentives(id, req.body);
      }
      if (!result) {
        return res.status(404).json({ message: "ESG incentives not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating ESG incentives:", error);
      res.status(500).json({ message: "Failed to update ESG incentives" });
    }
  });

  app.post(
    "/api/esg-information-flows",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        let organizationId = null;
        if (!req.body?.organizationId) {
          // Get user's accessible organizations (owned or consultant)
          const organizations = await getAccessibleOrganizations(userId);
          if (!organizations || organizations.length === 0) {
            return res
              .status(404)
              .json({ message: "No organization found for user" });
          }
          organizationId = organizations[0].id;
        } else {
          organizationId = req.body.organizationId;
        }
        if (!organizationId) {
          return res.status(404).json({ message: "No organization ID found" });
        }
        const flowsData = { ...req.body, organizationId };
        const result = await storage.createEsgInformationFlows(flowsData);
        res.json(result);
      } catch (error) {
        console.error("Error creating ESG information flows:", error);
        res
          .status(500)
          .json({ message: "Failed to create ESG information flows" });
      }
    }
  );

  app.get(
    "/api/esg-information-flows",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        let organizationId = null;
        if (!req.query?.organizationId) {
          const organizations = await storage.getOrganizationsByOwner(userId);
          if (!organizations || organizations.length === 0) {
            return res
              .status(404)
              .json({ message: "No organization found for user" });
          }
          organizationId = organizations[0].id;
        } else {
          organizationId = req.query?.organizationId;
        }
        if (!organizationId) {
          return res.status(404).json({ message: "No organization ID found" });
        }
        const result = await storage.getEsgInformationFlowsByOrganization(
          organizationId
        );
        if (!result) {
          return res
            .status(404)
            .json({ message: "No ESG information flows found" });
        }
        res.json(result);
      } catch (error) {
        console.error("Error fetching ESG information flows:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch ESG information flows" });
      }
    }
  );

  app.put(
    "/api/esg-information-flows/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const { organizationId } = req.body;

        console.log(
          "Updating ESG information flows with ID:",
          id,
          "and organizationId:",
          organizationId
        );
        let result;
        if (organizationId) {
          const existing = await storage.getEsgInformationFlowsByOrganization(
            organizationId
          );
          console.log("Existing ESG information flows:", existing);
         
          if (existing) {
            result = await storage.updateEsgInformationFlows(
              id,
              req.body
            );
            console.log("Result body in exis", result);
          } else {
            result = await storage.createEsgInformationFlows(req.body);
          }
        } else {
          result = await storage.updateEsgInformationFlows(id, req.body);
        }
        if (!result) {
          return res
            .status(404)
            .json({ message: "ESG information flows not found" });
        }

        // const result = await storage.updateEsgInformationFlows(id, req.body);
        res.json(result);
      } catch (error) {
        console.error("Error updating ESG information flows:", error);
        res
          .status(500)
          .json({ message: "Failed to update ESG information flows" });
      }
    }
  );

  app.post("/api/esg-integration", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let organizationId = null;
      if (!req.body?.organizationId) {
        const organizations = await storage.getOrganizationsByOwner(userId);
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }
        organizationId = organizations[0].id;
      } else {
        organizationId = req.body.organizationId;
      }
      if (!organizationId) {
        return res.status(404).json({ message: "No organization ID found" });
      }
      const integrationData = { ...req.body, organizationId };
      const result = await storage.createEsgIntegration(integrationData);
      res.json(result);
    } catch (error) {
      console.error("Error creating ESG integration:", error);
      res.status(500).json({ message: "Failed to create ESG integration" });
    }
  });

  app.get("/api/esg-integration", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let organizationId = null;
      if (!req.query?.organizationId) {
        const organizations = await storage.getOrganizationsByOwner(userId);
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }
        organizationId = organizations[0].id;
      } else {
        organizationId = req.query?.organizationId;
      }
      if (!organizationId) {
        return res.status(404).json({ message: "No organization ID found" });
      }
      const result = await storage.getEsgIntegrationByOrganization(
        organizationId
      );
      if (!result) {
        return res.status(404).json({ message: "No ESG integration found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching ESG integration:", error);
      res.status(500).json({ message: "Failed to fetch ESG integration" });
    }
  });

  app.put(
    "/api/esg-integration/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const { organizationId } = req.body;

        let result;
        if (organizationId) {
          const existing = await storage.getEsgIntegrationByOrganization(
            organizationId
          );
          if (existing) {
            result = await storage.updateEsgIntegration(
              organizationId,
              req.body
            );
          } else {
            result = await storage.createEsgIntegration(req.body);
          }
        } else {
          result = await storage.updateEsgIntegration(id, req.body);
        }
        if (!result) {
          return res.status(404).json({ message: "ESG integration not found" });
        }
        res.json(result);
      } catch (error) {
        console.error("Error updating ESG integration:", error);
        res.status(500).json({ message: "Failed to update ESG integration" });
      }
    }
  );

  // ESG Data Collection API Routes
  app.post("/api/esg-data-kpis", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await getAccessibleOrganizations(
        req.user.claims.sub
      );

      let organizationId;
      if (req.body && req.body.organizationId) {
        organizationId = req.body.organizationId;
      } else if (organizations && organizations.length > 0) {
        organizationId = organizations[0].id;
      } else {
        return res.status(404).json({
          message:
            "No organization found for user and no organizationId provided",
        });
      }
      if (!organizations || organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      const kpiData = { ...req.body, organizationId };
      const result = await storage.createEsgDataKpi(kpiData);
      res.json(result);
    } catch (error) {
      console.error("Error creating ESG data KPI:", error);
      res.status(500).json({ message: "Failed to create ESG data KPI" });
    }
  });

  app.get("/api/esg-data-kpis", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await getAccessibleOrganizations(
        req.user.claims.sub
      );
      if (!organizations || organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }
      let organizationId = organizations[0].id;

      if (req.query.organizationId !== undefined) {
        if (req.query.organizationId === "none") {
          return res
            .status(400)
            .json({ message: "Invalid organizationId parameter" });
        }
        const requestedId = parseInt(req.query.organizationId);
        if (!isNaN(requestedId) && requestedId > 0) {
          // Only allow if user has access
          const found = organizations.find((org) => org.id === requestedId);
          if (found) {
            organizationId = requestedId;
          } else {
            return res
              .status(403)
              .json({ message: "Access denied to this organization" });
          }
        }
      }

      const result = await storage.getEsgDataKpisByOrganization(organizationId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching ESG data KPIs:", error);
      res.status(500).json({ message: "Failed to fetch ESG data KPIs" });
    }
  });

  app.get(
    "/api/esg-data-kpis/section/:section",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizations = await storage.getOrganizationsByOwner(
          req.user.claims.sub
        );
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }
        const organizationId = organizations[0].id;
        const { section } = req.params;
        const result = await storage.getEsgDataKpisBySection(
          organizationId,
          section
        );
        res.json(result);
      } catch (error) {
        console.error("Error fetching ESG data KPIs by section:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch ESG data KPIs by section" });
      }
    }
  );

  app.get(
    "/api/esg-data-kpis/topic/:topic",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizations = await storage.getOrganizationsByOwner(
          req.user.claims.sub
        );
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }
        const organizationId = organizations[0].id;
        const { topic } = req.params;
        const result = await storage.getEsgDataKpisByTopic(
          organizationId,
          topic
        );
        res.json(result);
      } catch (error) {
        console.error("Error fetching ESG data KPIs by topic:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch ESG data KPIs by topic" });
      }
    }
  );

  app.put("/api/esg-data-kpis/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await storage.updateEsgDataKpi(Number(id), req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating ESG data KPI:", error);
      res.status(500).json({ message: "Failed to update ESG data KPI" });
    }
  });

  app.delete(
    "/api/esg-data-kpis/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        await storage.deleteEsgDataKpi(Number(id));
        res.json({ message: "ESG data KPI deleted successfully" });
      } catch (error) {
        console.error("Error deleting ESG data KPI:", error);
        res.status(500).json({ message: "Failed to delete ESG data KPI" });
      }
    }
  );

  // Risk & Impact Management API Routes

  // Due Diligence Process routes
  app.post(
    "/api/due-diligence-process",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizations = await storage.getOrganizationsByOwner(
          req.user.claims.sub
        );
        let organizationId;
        if (req.body && +req.body.organizationId) {
          organizationId = req.body.organizationId;
        } else if (organizations && organizations.length > 0) {
          organizationId = organizations[0].id;
        } else {
          return res.status(404).json({
            message:
              "No organization found for user and no organizationId provided",
          });
        }
        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }

        const processData = { ...req.body, organizationId };

        // Check if a process already exists for this organization
        const existing = await storage.getDueDiligenceProcessByOrganization(
          organizationId
        );

        let result;
        if (existing) {
          result = await storage.updateDueDiligenceProcess(
            existing.id,
            processData
          );
        } else {
          result = await storage.createDueDiligenceProcess(processData);
        }

        res.json(result);
      } catch (error) {
        console.error("Error creating/updating due diligence process:", error);
        res
          .status(500)
          .json({ message: "Failed to create/update due diligence process" });
      }
    }
  );

  app.put(
    "/api/due-diligence-process/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        console.log("Updating due diligence process with ID:", id);
        const result = await storage.updateDueDiligenceProcess(id, req.body);
        res.json(result);
      } catch (error) {
        console.error("Error updating due diligence process:", error);
        res
          .status(500)
          .json({ message: "Failed to update due diligence process" });
      }
    }
  );

  app.get(
    "/api/due-diligence-process",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const organizations = await getAccessibleOrganizations(
          req.user.claims.sub
        );

        if (!organizations || organizations.length === 0) {
          return res
            .status(404)
            .json({ message: "No organization found for user" });
        }

        let organizationId = organizations[0].id;

        if (req.query.organizationId !== undefined) {
          if (req.query.organizationId === "none") {
            return res
              .status(400)
              .json({ message: "Invalid organizationId parameter" });
          }

          const requestedId = parseInt(req.query.organizationId);
          if (!isNaN(requestedId) && requestedId > 0) {
            const found = organizations.find((org) => org.id === requestedId);
            if (found) {
              organizationId = requestedId;
            } else {
              return res
                .status(403)
                .json({ message: "Access denied to this organization" });
            }
          }
        }

        const result = await storage.getDueDiligenceProcessByOrganization(
          organizationId
        );
        res.json(result);
      } catch (error) {
        console.error("Error fetching due diligence process:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch due diligence process" });
      }
    }
  );

  // IRO Register routes
  app.post("/api/iro-register", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await getAccessibleOrganizations(
        req.user.claims.sub
      );

      console.log("Organizations accessible to user:", organizations);

      let organizationId;
      if (req.body && req.body.organizationId) {
        organizationId = req.body.organizationId;
      } else if (organizations && organizations.length > 0) {
        organizationId = organizations[0].id;
      } else {
        return res.status(404).json({
          message:
            "No organization found for user and no organizationId provided",
        });
      }

      const iroData = { ...req.body, organizationId };
      const result = await storage.createIroRegister(iroData);
      res.json(result);
    } catch (error) {
      console.error("Error creating IRO register entry:", error);
      res.status(500).json({ message: "Failed to create IRO register entry" });
    }
  });

  app.get("/api/iro-register", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await getAccessibleOrganizations(
        req.user.claims.sub
      );

      if (!organizations || organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      let organizationId = organizations[0].id;

      if (req.query.organizationId !== undefined) {
        if (req.query.organizationId === "none") {
          return res
            .status(400)
            .json({ message: "Invalid organizationId parameter" });
        }

        const requestedId = parseInt(req.query.organizationId);
        if (!isNaN(requestedId) && requestedId > 0) {
          const found = organizations.find((org) => org.id === requestedId);
          if (found) {
            organizationId = requestedId;
          } else {
            return res
              .status(403)
              .json({ message: "Access denied to this organization" });
          }
        }
      }

      const result = await storage.getIroRegisterByOrganization(organizationId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching IRO register:", error);
      res.status(500).json({ message: "Failed to fetch IRO register" });
    }
  });

  app.put("/api/iro-register/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.updateIroRegister(id, req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating IRO register entry:", error);
      res.status(500).json({ message: "Failed to update IRO register entry" });
    }
  });

  app.delete(
    "/api/iro-register/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteIroRegister(id);
        res.json({ message: "IRO register entry deleted successfully" });
      } catch (error) {
        console.error("Error deleting IRO register entry:", error);
        res
          .status(500)
          .json({ message: "Failed to delete IRO register entry" });
      }
    }
  );

  // Action Plans routes
  app.post("/api/action-plans", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await storage.getOrganizationsByOwner(
        req.user.claims.sub
      );

      let organizationId;
      if (req.body && req.body.organizationId) {
        organizationId = req.body.organizationId;
      } else if (organizations && organizations.length > 0) {
        organizationId = organizations[0].id;
      } else {
        return res.status(404).json({
          message:
            "No organization found for user and no organizationId provided",
        });
      }

      const planData = { ...req.body, organizationId };
      const result = await storage.createActionPlan(planData);
      res.json(result);
    } catch (error) {
      console.error("Error creating action plan:", error);
      res.status(500).json({ message: "Failed to create action plan" });
    }
  });

  app.get("/api/action-plans", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await getAccessibleOrganizations(
        req.user.claims.sub
      );

      if (!organizations || organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      let organizationId = organizations[0].id;

      if (req.query.organizationId !== undefined) {
        if (req.query.organizationId === "none") {
          return res
            .status(400)
            .json({ message: "Invalid organizationId parameter" });
        }

        const requestedId = parseInt(req.query.organizationId);
        if (!isNaN(requestedId) && requestedId > 0) {
          const found = organizations.find((org) => org.id === requestedId);
          if (found) {
            organizationId = requestedId;
          } else {
            return res
              .status(403)
              .json({ message: "Access denied to this organization" });
          }
        }
      }

      const result = await storage.getActionPlansByOrganization(organizationId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching action plans:", error);
      res.status(500).json({ message: "Failed to fetch action plans" });
    }
  });

  app.get(
    "/api/action-plans/iro/:iroId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const iroId = parseInt(req.params.iroId);
        const result = await storage.getActionPlansByIro(iroId);
        res.json(result);
      } catch (error) {
        console.error("Error fetching action plans by IRO:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch action plans by IRO" });
      }
    }
  );

  app.put("/api/action-plans/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.updateActionPlan(id, req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating action plan:", error);
      res.status(500).json({ message: "Failed to update action plan" });
    }
  });

  app.delete(
    "/api/action-plans/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteActionPlan(id);
        res.json({ message: "Action plan deleted successfully" });
      } catch (error) {
        console.error("Error deleting action plan:", error);
        res.status(500).json({ message: "Failed to delete action plan" });
      }
    }
  );

  // IRO Monitoring routes
  app.post("/api/iro-monitoring", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await storage.getOrganizationsByOwner(
        req.user.claims.sub
      );
      let organizationId;
      if (req.body && req.body.organizationId) {
        organizationId = req.body.organizationId;
      } else if (organizations && organizations.length > 0) {
        organizationId = organizations[0].id;
      } else {
        return res.status(404).json({
          message:
            "No organization found for user and no organizationId provided",
        });
      }

      const monitoringData = { ...req.body, organizationId };
      const result = await storage.createIroMonitoring(monitoringData);
      res.json(result);
    } catch (error) {
      console.error("Error creating IRO monitoring entry:", error);
      res
        .status(500)
        .json({ message: "Failed to create IRO monitoring entry" });
    }
  });

  app.get("/api/iro-monitoring", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await getAccessibleOrganizations(
        req.user.claims.sub
      );

      if (!organizations || organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }

      let organizationId = organizations[0].id;

      if (req.query.organizationId !== undefined) {
        if (req.query.organizationId === "none") {
          return res
            .status(400)
            .json({ message: "Invalid organizationId parameter" });
        }

        const requestedId = parseInt(req.query.organizationId);
        if (!isNaN(requestedId) && requestedId > 0) {
          const found = organizations.find((org) => org.id === requestedId);
          if (found) {
            organizationId = requestedId;
          } else {
            return res
              .status(403)
              .json({ message: "Access denied to this organization" });
          }
        }
      }

      const result = await storage.getIroMonitoringByOrganization(
        organizationId
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching IRO monitoring:", error);
      res.status(500).json({ message: "Failed to fetch IRO monitoring" });
    }
  });

  app.get(
    "/api/iro-monitoring/iro/:iroId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const iroId = parseInt(req.params.iroId);
        const result = await storage.getIroMonitoringByIro(iroId);
        res.json(result);
      } catch (error) {
        console.error("Error fetching IRO monitoring by IRO:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch IRO monitoring by IRO" });
      }
    }
  );

  app.put("/api/iro-monitoring/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.updateIroMonitoring(id, req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating IRO monitoring entry:", error);
      res
        .status(500)
        .json({ message: "Failed to update IRO monitoring entry" });
    }
  });

  app.delete(
    "/api/iro-monitoring/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteIroMonitoring(id);
        res.json({ message: "IRO monitoring entry deleted successfully" });
      } catch (error) {
        console.error("Error deleting IRO monitoring entry:", error);
        res
          .status(500)
          .json({ message: "Failed to delete IRO monitoring entry" });
      }
    }
  );

  // Excel file upload and processing routes
  // app.post("/upload-excel", upload.single("excelFile"), async (req, res) => {
  //   try {
  //     if (!req.file) {
  //       return res.status(400).json({ error: "No file uploaded" });
  //     }

  //     const excelData = readExcelFile(req.file.buffer);

  //     res.json({
  //       success: true,
  //       data: excelData,
  //       message: `Successfully read ${excelData.length} sheet(s) from Excel file`,
  //     });
  //   } catch (error) {
  //     console.error("Excel upload error:", error);
  //     res.status(500).json({
  //       error: "Failed to process Excel file",
  //       details: error instanceof Error ? error.message : "Unknown error",
  //     });
  //   }
  // });

  app.post(
    "/upload-conversion-factors",
    upload.single("excelFile"),
    async (req, res) => {
      try {
        // if (!req.file) {
        //   return res.status(400).json({ error: "No file uploaded" });
        // }

      //  const excelData = readExcelFile(req.file.buffer);
      //   const conversionFactors = parseUKConversionFactors(excelData);

        res.json({
          success: true,
          //data: conversionFactors,
          //totalFactors: conversionFactors.length,
          //message: `Successfully parsed ${conversionFactors.length} conversion factors`,
        });
      } catch (error) {
        console.error("Conversion factors upload error:", error);
        res.status(500).json({
          error: "Failed to process conversion factors file",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Reports API Routes
  app.get("/api/report-templates", isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getReportTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching report templates:", error);
      res.status(500).json({ message: "Failed to fetch report templates" });
    }
  });

  app.get(
    "/api/report-templates/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const template = await storage.getReportTemplateById(id);
        if (!template) {
          return res.status(404).json({ message: "Report template not found" });
        }
        res.json(template);
      } catch (error) {
        console.error("Error fetching report template:", error);
        res.status(500).json({ message: "Failed to fetch report template" });
      }
    }
  );

  app.post("/api/generated-reports", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await getAccessibleOrganizations(
        req.user.claims.sub
      );
      let organizationId;
      if (req.body && req.body.organizationId) {
        organizationId = req.body.organizationId;
      } else if (organizations && organizations.length > 0) {
        organizationId = organizations[0].id;
      } else {
        return res.status(404).json({
          message:
            "No organization found for user and no organizationId provided",
        });
      }

      const reportData = { ...req.body, organizationId };
      const result = await storage.createGeneratedReport(reportData);
      res.json(result);
    } catch (error) {
      console.error("Error creating generated report:", error);
      res.status(500).json({ message: "Failed to create generated report" });
    }
  });

  app.get("/api/generated-reports", isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await getAccessibleOrganizations(
        req.user.claims.sub
      );
      if (!organizations || organizations.length === 0) {
        return res
          .status(404)
          .json({ message: "No organization found for user" });
      }
      let organizationId = organizations[0].id;

      if (req.query.organizationId !== undefined) {
        if (req.query.organizationId === "none") {
          return res
            .status(400)
            .json({ message: "Invalid organizationId parameter" });
        }
        const requestedId = parseInt(req.query.organizationId);
        if (!isNaN(requestedId) && requestedId > 0) {
          // Only allow if user has access
          const found = organizations.find((org) => org.id === requestedId);
          if (found) {
            organizationId = requestedId;
          } else {
            return res
              .status(403)
              .json({ message: "Access denied to this organization" });
          }
        }
      }

      const reports = await storage.getGeneratedReportsByOrganization(
        organizationId
      );
      res.json(reports);
    } catch (error) {
      console.error("Error fetching generated reports:", error);
      res.status(500).json({ message: "Failed to fetch generated reports" });
    }
  });

  app.get(
    "/api/generated-reports/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const report = await storage.getGeneratedReportById(id);
        if (!report) {
          return res
            .status(404)
            .json({ message: "Generated report not found" });
        }
        res.json(report);
      } catch (error) {
        console.error("Error fetching generated report:", error);
        res.status(500).json({ message: "Failed to fetch generated report" });
      }
    }
  );

  app.put(
    "/api/generated-reports/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);

        // Clean update data to avoid timestamp issues
        const updateData = { ...req.body };

        // Remove any timestamp fields that should be handled by the database
        delete updateData.lastModified;
        delete updateData.updatedAt;
        delete updateData.createdAt;
        delete updateData.generatedAt;

        // Only allow finalizedAt if it's being set to finalize a report
        if (updateData.finalizedAt && updateData.status === "final") {
          updateData.finalizedAt = new Date(updateData.finalizedAt);
        } else {
          delete updateData.finalizedAt;
        }

        const result = await storage.updateGeneratedReport(id, updateData);
        res.json(result);
      } catch (error) {
        console.error("Error updating generated report:", error);
        res.status(500).json({ message: "Failed to update generated report" });
      }
    }
  );

  app.delete(
    "/api/generated-reports/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteGeneratedReport(id);
        res.json({ message: "Generated report deleted successfully" });
      } catch (error) {
        console.error("Error deleting generated report:", error);
        res.status(500).json({ message: "Failed to delete generated report" });
      }
    }
  );

  // Consultant Organizations routes
  app.get(
    "/api/consultant-organizations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // For consultants, get their client organizations
        if (user.role === "consultant") {
          const consultantOrgs = await storage.getConsultantOrganizations(
            userId
          );
          res.json(consultantOrgs);
        } else {
          return res.status(403).json({
            message:
              "Access denied. Only consultants can access this endpoint.",
          });
        }
      } catch (error) {
        console.error("Error fetching consultant organizations:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch consultant organizations" });
      }
    }
  );

  app.post(
    "/api/consultant-organizations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== "consultant") {
          return res.status(403).json({
            message:
              "Access denied. Only consultants can add client organizations.",
          });
        }

        // Create the organization first
        const organizationData = insertOrganizationSchema.parse({
          name: req.body.name,
          industry: req.body.industry,
          country: req.body.country,
          employeeCount: req.body.employeeCount,
          annualRevenue: req.body.annualRevenue,
          ownerId: userId, // Temporary - will be updated after creating the relationship
        });

        const organization = await storage.createOrganization(organizationData);

        // Create the consultant-organization relationship
        const consultantOrgData = {
          consultantId: userId,
          organizationId: organization.id,
          role: "consultant",
          contactEmail: req.body.contactEmail,
          contactPerson: req.body.contactPerson,
        };

        const consultantOrg = await storage.createConsultantOrganization(
          consultantOrgData
        );

        res.json({
          ...organization,
          contactEmail: req.body.contactEmail,
          contactPerson: req.body.contactPerson,
          consultantRole: "consultant",
        });
      } catch (error) {
        console.error("Error creating consultant organization:", error);
        res
          .status(500)
          .json({ message: "Failed to create consultant organization" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
