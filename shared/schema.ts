import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["organization", "consultant"] }),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  industry: varchar("industry"),
  businessType: varchar("business_type"),
  country: varchar("country"),
  employeeCount: integer("employee_count"),
  annualRevenue: varchar("annual_revenue"),
  reportingYear: integer("reporting_year").default(2024),
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consultant profiles table
export const consultantProfiles = pgTable("consultant_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  fullName: varchar("full_name").notNull(),
  phoneNumber: varchar("phone_number"),
  primaryLocation: varchar("primary_location"),
  websiteLinkedIn: varchar("website_linkedin"),
  typicalClientSize: varchar("typical_client_size"),
  esgFrameworks: text("esg_frameworks").array(),
  targetIndustries: text("target_industries").array(),
  geographicCoverage: text("geographic_coverage").array(),
  esgSoftwarePlatforms: text("esg_software_platforms").array(),
  dataAnalysisTools: text("data_analysis_tools").array(),
  serviceOfferings: text("service_offerings").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consultant-Organization relationships
export const consultantOrganizations = pgTable("consultant_organizations", {
  id: serial("id").primaryKey(),
  consultantId: varchar("consultant_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  role: varchar("role").default("consultant"),
  contactEmail: varchar("contact_email"),
  contactPerson: varchar("contact_person"),
  createdAt: timestamp("created_at").defaultNow(),
});

// GHG Emissions data
export const ghgEmissions = pgTable("ghg_emissions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  scope: varchar("scope", { enum: ["scope1", "scope2", "scope3"] }).notNull(),
  category: varchar("category"),
  source: varchar("source"),
  activityData: decimal("activity_data"),
  unit: varchar("unit"),
  emissionFactor: decimal("emission_factor"),
  co2Equivalent: decimal("co2_equivalent"),
  reportingPeriod: varchar("reporting_period"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Materiality Assessment - Enhanced for comprehensive assessment
export const materialityTopics = pgTable("materiality_topics", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  topic: varchar("topic").notNull(),
  category: varchar("category", {
    enum: ["environmental", "social", "governance"],
  }),
  subcategory: varchar("subcategory"), // E1-E5, S1-S4, G1
  isCustom: boolean("is_custom").default(false),
  // Scoring
  financialImpactScore: integer("financial_impact_score"), // 0-5 scale
  impactOnStakeholders: integer("impact_on_stakeholders"), // 0-5 scale
  stakeholderConcernLevel: varchar("stakeholder_concern_level", {
    enum: ["low", "medium", "high"],
  }),
  materialityIndex: decimal("materiality_index"), // Calculated weighted average
  isMaterial: boolean("is_material").default(false), // >3.0 threshold
  // Justification and narrative
  scoringJustification: text("scoring_justification"),
  whyMaterial: text("why_material"),
  impactedStakeholders: text("impacted_stakeholders").array(),
  businessRiskOrOpportunity: varchar("business_risk_or_opportunity", {
    enum: ["risk", "opportunity", "both"],
  }),
  linkedStandards: text("linked_standards").array(), // ESRS, GRI, SASB references
  managementResponse: text("management_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ESRS Disclosures
export const esrsDisclosures = pgTable("esrs_disclosures", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  standard: varchar("standard"), // e.g., "ESRS E1"
  datapoint: varchar("datapoint"),
  value: text("value"),
  status: varchar("status", { enum: ["draft", "review", "approved"] }).default(
    "draft"
  ),
  completionPercentage: integer("completion_percentage").default(0),
  lastReviewDate: date("last_review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Profile Tables
export const companyProfiles = pgTable("company_profiles", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  legalName: text("legal_name").notNull(),
  legalForm: text("legal_form").notNull(),
  registeredAddress: text("registered_address").notNull(),
  country: text("country").notNull(),
  naceSectorCode: text("nace_sector_code").notNull(),
  fiscalYearEnd: date("fiscal_year_end").notNull(),
  // Entity Scope & Reporting
  reportingBasis: text("reporting_basis"),
  // Corporate Structure
  parentCompany: text("parent_company"),
  // Business Model
  keyProducts: text("key_products").array(),
  primaryMarkets: text("primary_markets").array(),
  supplyChainDescription: text("supply_chain_description"),
  // Industry Classification
  industryCode: text("industry_code").notNull(),
  euTaxonomyEligible: boolean("eu_taxonomy_eligible").default(false),
  euTaxonomyDetails: text("eu_taxonomy_details"),
  activityDescription: text("activity_description"),
  sectorClassification: text("sector_classification").notNull(),
  sustainabilityClassification: text("sustainability_classification").notNull(),
  // Geography
  countriesOfOperation: text("countries_of_operation").array(),
  registeredHQ: text("registered_hq").notNull(),
  numberOfProductionSites: integer("number_of_production_sites").default(0),
  siteLocations: text("site_locations"),
  marketRegions: text("market_regions").array(),
  // Business Strategy
  sustainabilityPolicies: text("sustainability_policies"),
  netZeroTarget: integer("net_zero_target"),
  netZeroTargetDate: date("net_zero_target_date"),
  circularEconomyInitiatives: text("circular_economy_initiatives"),
  governanceOversight: text("governance_oversight"),
  transitionUpdates: text("transition_updates"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subsidiaries = pgTable("subsidiaries", {
  id: serial("id").primaryKey(),
  companyProfileId: integer("company_profile_id")
    .references(() => companyProfiles.id)
    .notNull(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  address: text("address").notNull(),
  ownershipPercentage: integer("ownership_percentage").notNull(),
  legalForm: text("legal_form").notNull(),
  relationToParent: text("relation_to_parent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ownershipStructure = pgTable("ownership_structure", {
  id: serial("id").primaryKey(),
  companyProfileId: integer("company_profile_id")
    .references(() => companyProfiles.id)
    .notNull(),
  entityName: text("entity_name").notNull(),
  role: text("role").notNull(), // Parent, Subsidiary, Shareholder
  ownershipPercentage: integer("ownership_percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sustainabilityInitiatives = pgTable("sustainability_initiatives", {
  id: serial("id").primaryKey(),
  companyProfileId: integer("company_profile_id")
    .references(() => companyProfiles.id)
    .notNull(),
  initiativeName: text("initiative_name").notNull(),
  description: text("description").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  currentStatus: text("current_status").notNull(), // Planned, Ongoing, Completed
  targetImpact: text("target_impact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sustainabilityKPIs = pgTable("sustainability_kpis", {
  id: serial("id").primaryKey(),
  companyProfileId: integer("company_profile_id")
    .references(() => companyProfiles.id)
    .notNull(),
  goalTitle: text("goal_title").notNull(),
  goalDescription: text("goal_description").notNull(),
  targetDate: date("target_date").notNull(),
  currentProgress: integer("current_progress").default(0),
  indicators: text("indicators").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  postalCode: text("postal_code"),
  facilityType: text("facility_type").notNull(), // Headquarters, Manufacturing, Office, Warehouse, etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Governance & Policies Module Tables
export const governanceStructure = pgTable("governance_structure", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  boardOversightMechanism: text("board_oversight_mechanism").notNull(),
  committeeName: text("committee_name"),
  committeeComposition: text("committee_composition").array(),
  committeeResponsibilities: text("committee_responsibilities").array(),
  reportingLine: text("reporting_line"),
  charterDocument: text("charter_document"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const esgPolicies = pgTable("esg_policies", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  policyName: text("policy_name").notNull(),
  policyCategory: text("policy_category").notNull(),
  appliesTo: text("applies_to").array(),
  policyStatus: text("policy_status").notNull(),
  dateOfLastReview: timestamp("date_of_last_review"),
  policyDocument: text("policy_document"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const esgIncentives = pgTable("esg_incentives", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  isEsgUsedInCompensation: boolean("is_esg_used_in_compensation").notNull(),
  applicableRoles: text("applicable_roles").array(),
  linkedEsgKpis: text("linked_esg_kpis").array(),
  weightOfEsgInVariablePay: decimal("weight_of_esg_in_variable_pay"),
  compensationApprovalBody: text("compensation_approval_body"),
  narrativeOnEsgIncentives: text("narrative_on_esg_incentives"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const esgInformationFlows = pgTable("esg_information_flows", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  whoTracksEsgKpis: text("who_tracks_esg_kpis").array(),
  esgReportingFrequency: text("esg_reporting_frequency"),
  internalEsgReportRecipients: text("internal_esg_report_recipients").array(),
  formatsOfEsgReporting: text("formats_of_esg_reporting").array(),
  narrativeDescriptionOfEsgDataFlow: text(
    "narrative_description_of_esg_data_flow"
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const esgIntegration = pgTable("esg_integration", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  whereIsEsgIntegrated: text("where_is_esg_integrated").array(),
  narrativeOnEsgIntegration: text("narrative_on_esg_integration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ESG Data Collection KPIs table
export const esgDataKpis = pgTable("esg_data_kpis", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),

  // KPI Basic Information
  kpiName: varchar("kpi_name").notNull(),
  esgSection: varchar("esg_section", {
    enum: ["environment", "social", "governance"],
  }).notNull(),
  esrsTopic: varchar("esrs_topic").notNull(), // E1, E2, E3, S1, S2, etc.
  topicTitle: varchar("topic_title").notNull(), // Climate Change, Own Workforce, etc.

  // KPI Measurement Details
  metricType: varchar("metric_type", {
    enum: ["quantitative", "qualitative", "monetary", "ratio"],
  }).notNull(),
  unitOfMeasure: varchar("unit_of_measure").notNull(),
  referenceStandard: text("reference_standard").array(), // Multi-select
  baselineYear: integer("baseline_year"),

  // Data Collection Details
  dataOwner: varchar("data_owner").notNull(),
  sourceType: text("source_type").array(), // Multi-select
  collectionFrequency: varchar("collection_frequency").notNull(),
  collectionMethod: varchar("collection_method").notNull(),

  // Verification & Assurance
  assuranceLevel: varchar("assurance_level").notNull(),
  verificationStatus: varchar("verification_status").notNull(),
  confidentialityLevel: varchar("confidentiality_level").notNull(),

  // Current Value & Metadata
  currentValue: text("current_value"), // Store as text to handle different data types
  reportingPeriod: varchar("reporting_period"),
  lastUpdated: timestamp("last_updated"),
  notes: text("notes"),

  // File attachments
  supportingFiles: text("supporting_files").array(), // File paths/URLs

  // Status tracking
  isActive: boolean("is_active").default(true),
  completionStatus: varchar("completion_status", {
    enum: ["complete", "partial", "missing"],
  }).default("missing"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reports Schema
export const reportTemplates = pgTable("report_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // "European Sustainability Reporting Standards (ESRS)"
  framework: varchar("framework").notNull(), // "CSRD (EU)"
  type: varchar("type", { enum: ["esrs", "gri", "sasb", "tcfd"] }).notNull(),
  status: varchar("status", { enum: ["available", "coming_soon"] }).default(
    "coming_soon"
  ),
  description: text("description"),
  sections: jsonb("sections"), // Array of report sections
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generatedReports = pgTable("generated_reports", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  templateId: integer("template_id").references(() => reportTemplates.id),
  title: varchar("title").notNull(),
  status: varchar("status", { enum: ["draft", "final"] }).default("draft"),
  language: varchar("language", { enum: ["en", "de"] }).default("en"),

  // Report Content (JSON structure)
  sections: jsonb("sections"), // Dynamic sections based on template

  // Metadata
  generatedAt: timestamp("generated_at").defaultNow(),
  lastModified: timestamp("last_modified").defaultNow(),
  finalizedAt: timestamp("finalized_at"),

  // Export tracking
  exportedPdf: boolean("exported_pdf").default(false),
  exportedWord: boolean("exported_word").default(false),
  exportedXhtml: boolean("exported_xhtml").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ownedOrganizations: many(organizations),
  consultantOrganizations: many(consultantOrganizations),
  consultantProfile: one(consultantProfiles),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [organizations.ownerId],
      references: [users.id],
    }),
    consultants: many(consultantOrganizations),
    ghgEmissions: many(ghgEmissions),
    materialityTopics: many(materialityTopics),
    esrsDisclosures: many(esrsDisclosures),
    companyProfile: one(companyProfiles),
    facilities: many(facilities),
    governanceStructure: one(governanceStructure),
    esgPolicies: many(esgPolicies),
    esgIncentives: one(esgIncentives),
    esgInformationFlows: one(esgInformationFlows),
    esgIntegration: one(esgIntegration),
    esgDataKpis: many(esgDataKpis),
    generatedReports: many(generatedReports),
  })
);

export const consultantProfilesRelations = relations(
  consultantProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [consultantProfiles.userId],
      references: [users.id],
    }),
  })
);

export const consultantOrganizationsRelations = relations(
  consultantOrganizations,
  ({ one }) => ({
    consultant: one(users, {
      fields: [consultantOrganizations.consultantId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [consultantOrganizations.organizationId],
      references: [organizations.id],
    }),
  })
);

export const ghgEmissionsRelations = relations(ghgEmissions, ({ one }) => ({
  organization: one(organizations, {
    fields: [ghgEmissions.organizationId],
    references: [organizations.id],
  }),
}));

export const materialityTopicsRelations = relations(
  materialityTopics,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [materialityTopics.organizationId],
      references: [organizations.id],
    }),
  })
);

export const esrsDisclosuresRelations = relations(
  esrsDisclosures,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [esrsDisclosures.organizationId],
      references: [organizations.id],
    }),
  })
);

// Company Profile relations
export const companyProfilesRelations = relations(
  companyProfiles,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [companyProfiles.organizationId],
      references: [organizations.id],
    }),
    subsidiaries: many(subsidiaries),
    ownershipStructure: many(ownershipStructure),
    sustainabilityInitiatives: many(sustainabilityInitiatives),
    sustainabilityKPIs: many(sustainabilityKPIs),
  })
);

export const facilitiesRelations = relations(facilities, ({ one }) => ({
  organization: one(organizations, {
    fields: [facilities.organizationId],
    references: [organizations.id],
  }),
}));

export const governanceStructureRelations = relations(
  governanceStructure,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [governanceStructure.organizationId],
      references: [organizations.id],
    }),
  })
);

export const esgPoliciesRelations = relations(esgPolicies, ({ one }) => ({
  organization: one(organizations, {
    fields: [esgPolicies.organizationId],
    references: [organizations.id],
  }),
}));

export const esgIncentivesRelations = relations(esgIncentives, ({ one }) => ({
  organization: one(organizations, {
    fields: [esgIncentives.organizationId],
    references: [organizations.id],
  }),
}));

export const esgInformationFlowsRelations = relations(
  esgInformationFlows,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [esgInformationFlows.organizationId],
      references: [organizations.id],
    }),
  })
);

export const esgIntegrationRelations = relations(esgIntegration, ({ one }) => ({
  organization: one(organizations, {
    fields: [esgIntegration.organizationId],
    references: [organizations.id],
  }),
}));

export const esgDataKpisRelations = relations(esgDataKpis, ({ one }) => ({
  organization: one(organizations, {
    fields: [esgDataKpis.organizationId],
    references: [organizations.id],
  }),
}));

// Reports Relations
export const reportTemplatesRelations = relations(
  reportTemplates,
  ({ many }) => ({
    generatedReports: many(generatedReports),
  })
);

export const generatedReportsRelations = relations(
  generatedReports,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [generatedReports.organizationId],
      references: [organizations.id],
    }),
    template: one(reportTemplates, {
      fields: [generatedReports.templateId],
      references: [reportTemplates.id],
    }),
  })
);

export const subsidiariesRelations = relations(subsidiaries, ({ one }) => ({
  companyProfile: one(companyProfiles, {
    fields: [subsidiaries.companyProfileId],
    references: [companyProfiles.id],
  }),
}));

export const ownershipStructureRelations = relations(
  ownershipStructure,
  ({ one }) => ({
    companyProfile: one(companyProfiles, {
      fields: [ownershipStructure.companyProfileId],
      references: [companyProfiles.id],
    }),
  })
);

export const sustainabilityInitiativesRelations = relations(
  sustainabilityInitiatives,
  ({ one }) => ({
    companyProfile: one(companyProfiles, {
      fields: [sustainabilityInitiatives.companyProfileId],
      references: [companyProfiles.id],
    }),
  })
);

export const sustainabilityKPIsRelations = relations(
  sustainabilityKPIs,
  ({ one }) => ({
    companyProfile: one(companyProfiles, {
      fields: [sustainabilityKPIs.companyProfileId],
      references: [companyProfiles.id],
    }),
  })
);

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertConsultantProfileSchema =
  createInsertSchema(consultantProfiles);
export const insertConsultantOrganizationSchema = createInsertSchema(
  consultantOrganizations
);
export const insertGhgEmissionSchema = createInsertSchema(ghgEmissions);
export const insertMaterialityTopicSchema =
  createInsertSchema(materialityTopics);
export const insertEsrsDisclosureSchema = createInsertSchema(esrsDisclosures);

// Company Profile schemas
export const insertCompanyProfileSchema = createInsertSchema(companyProfiles, {
  legalName: z.string().min(1, "Legal name is required"),
  legalForm: z.string().min(1, "Legal form is required"),
  registeredAddress: z.string().min(1, "Registered address is required"),
  country: z.string().min(1, "Country is required"),
  naceSectorCode: z.string().min(1, "NACE sector code is required"),
  reportingBasis: z.string().min(1, "Reporting basis is required"),
});
export const insertSubsidiarySchema = createInsertSchema(subsidiaries);
export const insertOwnershipStructureSchema =
  createInsertSchema(ownershipStructure);
export const insertSustainabilityInitiativeSchema = createInsertSchema(
  sustainabilityInitiatives
);
export const insertSustainabilityKPISchema =
  createInsertSchema(sustainabilityKPIs);
export const insertFacilitySchema = createInsertSchema(facilities);

// Governance Module Insert Schemas
export const insertGovernanceStructureSchema =
  createInsertSchema(governanceStructure);
export const insertEsgPolicySchema = createInsertSchema(esgPolicies);
export const insertEsgIncentivesSchema = createInsertSchema(esgIncentives);
export const insertEsgInformationFlowsSchema =
  createInsertSchema(esgInformationFlows);
export const insertEsgIntegrationSchema = createInsertSchema(esgIntegration);

// ESG Data Collection Insert Schema
export const insertEsgDataKpiSchema = createInsertSchema(esgDataKpis, {
  kpiName: z.string().min(1, "KPI name is required"),
  esgSection: z.enum(["environment", "social", "governance"]),
  esrsTopic: z.string().min(1, "ESRS topic is required"),
  topicTitle: z.string().min(1, "Topic title is required"),
  metricType: z.enum(["quantitative", "qualitative", "monetary", "ratio"]),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  dataOwner: z.string().min(1, "Data owner is required"),
  collectionFrequency: z.string().min(1, "Collection frequency is required"),
  collectionMethod: z.string().min(1, "Collection method is required"),
  assuranceLevel: z.string().min(1, "Assurance level is required"),
  verificationStatus: z.string().min(1, "Verification status is required"),
  confidentialityLevel: z.string().min(1, "Confidentiality level is required"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type ConsultantProfile = typeof consultantProfiles.$inferSelect;
export type InsertConsultantProfile = z.infer<
  typeof insertConsultantProfileSchema
>;
export type ConsultantOrganization =
  typeof consultantOrganizations.$inferSelect;
export type InsertConsultantOrganization = z.infer<
  typeof insertConsultantOrganizationSchema
>;
export type GhgEmission = typeof ghgEmissions.$inferSelect;
export type InsertGhgEmission = z.infer<typeof insertGhgEmissionSchema>;
export type MaterialityTopic = typeof materialityTopics.$inferSelect;
export type InsertMaterialityTopic = z.infer<
  typeof insertMaterialityTopicSchema
>;
export type EsrsDisclosure = typeof esrsDisclosures.$inferSelect;
export type InsertEsrsDisclosure = z.infer<typeof insertEsrsDisclosureSchema>;

// Company Profile types
export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type Subsidiary = typeof subsidiaries.$inferSelect;
export type InsertSubsidiary = z.infer<typeof insertSubsidiarySchema>;
export type OwnershipStructure = typeof ownershipStructure.$inferSelect;
export type InsertOwnershipStructure = z.infer<
  typeof insertOwnershipStructureSchema
>;
export type SustainabilityInitiative =
  typeof sustainabilityInitiatives.$inferSelect;
export type InsertSustainabilityInitiative = z.infer<
  typeof insertSustainabilityInitiativeSchema
>;
export type SustainabilityKPI = typeof sustainabilityKPIs.$inferSelect;
export type InsertSustainabilityKPI = z.infer<
  typeof insertSustainabilityKPISchema
>;
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;

// Governance Module Types
export type GovernanceStructure = typeof governanceStructure.$inferSelect;
export type InsertGovernanceStructure = z.infer<
  typeof insertGovernanceStructureSchema
>;
export type EsgPolicy = typeof esgPolicies.$inferSelect;
export type InsertEsgPolicy = z.infer<typeof insertEsgPolicySchema>;
export type EsgIncentives = typeof esgIncentives.$inferSelect;
export type InsertEsgIncentives = z.infer<typeof insertEsgIncentivesSchema>;
export type EsgInformationFlows = typeof esgInformationFlows.$inferSelect;
export type InsertEsgInformationFlows = z.infer<
  typeof insertEsgInformationFlowsSchema
>;
export type EsgIntegration = typeof esgIntegration.$inferSelect;
export type InsertEsgIntegration = z.infer<typeof insertEsgIntegrationSchema>;
export type EsgDataKpi = typeof esgDataKpis.$inferSelect;
export type InsertEsgDataKpi = z.infer<typeof insertEsgDataKpiSchema>;

// Risk & Impact Management Module Tables

// 1. Due Diligence Process
export const dueDiligenceProcess = pgTable("due_diligence_process", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  frameworks: text("frameworks").array(), // UNGPs, OECD Guidelines, ISO 26000, etc.
  scopeDescription: text("scope_description"),
  governanceOversight: varchar("governance_oversight"),
  processDescription: text("process_description"),
  frequency: varchar("frequency"),
  stakeholderInvolvement: text("stakeholder_involvement").array(),
  grievanceMechanismAvailable: boolean("grievance_mechanism_available"),
  grievanceMechanismDescription: text("grievance_mechanism_description"),
  supportingDocuments: text("supporting_documents").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. IRO (Impacts, Risks, Opportunities) Register
export const iroRegister = pgTable("iro_register", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  iroType: varchar("iro_type"), // Actual Impact, Potential Impact, Risk, Opportunity
  category: varchar("category"), // E1 Climate, S1 Workers, G1 Governance, etc.
  iroTitle: varchar("iro_title").notNull(),
  iroDescription: text("iro_description"),
  likelihood: integer("likelihood"), // 1-5 scale
  severityMagnitude: integer("severity_magnitude"), // 1-5 scale
  timeHorizon: varchar("time_horizon"), // Short, Medium, Long
  affectedStakeholders: text("affected_stakeholders").array(),
  valueChainLocation: varchar("value_chain_location"),
  financialMateriality: boolean("financial_materiality"),
  impactMateriality: boolean("impact_materiality"),
  linkedStrategyGoal: text("linked_strategy_goal").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. Action & Mitigation Plans
export const actionPlans = pgTable("action_plans", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  iroId: integer("iro_id").references(() => iroRegister.id),
  responseType: varchar("response_type"), // Avoidance, Mitigation, Remediation, etc.
  responseDescription: text("response_description"),
  targetOutcome: text("target_outcome"),
  responsibleDepartment: varchar("responsible_department"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  budgetAmount: decimal("budget_amount"),
  budgetCurrency: varchar("budget_currency").default("EUR"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. Monitoring & Evaluation
export const iroMonitoring = pgTable("iro_monitoring", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  iroId: integer("iro_id").references(() => iroRegister.id),
  lastReviewed: date("last_reviewed"),
  monitoringMethod: varchar("monitoring_method"),
  performanceIndicator: text("performance_indicator"),
  currentStatus: varchar("current_status"), // Emerging, Under Control, Escalated, Resolved
  supportingDocuments: text("supporting_documents").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emission Factors
export const emissionFactors = pgTable("emission_factors", {
  id: serial("id").primaryKey(),
  categoryId: varchar("category_id").notNull(),
  scope: varchar("scope").notNull(),
  level1: varchar("level1").notNull(),
  level2: varchar("level2"),
  level3: varchar("level3"),
  level4: varchar("level4"),
  columnText: varchar("column_text"),
  uom: varchar("uom").notNull(),
  ghgUnit: varchar("ghg_unit").notNull(),
  ghgConversionFactor: decimal("ghg_conversion_factor", { precision: 12, scale: 5 }).notNull(),
  year: integer("year").default(2024),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emissions Data
export const emissionsData = pgTable("emissions_data", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  scope: varchar("scope").notNull(),
  category: varchar("category").notNull(),
  subcategory: varchar("subcategory"),
  fuelType: varchar("fuel_type"),
  description: text("description"),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: varchar("unit").notNull(),
  emissionFactorId: integer("emission_factor_id").references(() => emissionFactors.id),
  emissionFactorValue: decimal("emission_factor_value", { precision: 12, scale: 5 }),
  customEmissionFactor: decimal("custom_emission_factor", { precision: 12, scale: 5 }),
  calculatedEmissions: decimal("calculated_emissions", { precision: 12, scale: 3 }),
  ghgType: varchar("ghg_type"),
  reportingPeriod: varchar("reporting_period"),
  location: varchar("location"),
  dataSource: varchar("data_source"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emissionFactorsRelations = relations(emissionFactors, ({ one }) => ({
  // no foreign keys besides PK, so likely none needed
}));

export const emissionsDataRelations = relations(emissionsData, ({ one }) => ({
  organization: one(organizations, {
    fields: [emissionsData.organizationId],
    references: [organizations.id],
  }),
  emissionFactor: one(emissionFactors, {
    fields: [emissionsData.emissionFactorId],
    references: [emissionFactors.id],
  }),
}));

// Risk Management Relations
export const dueDiligenceRelations = relations(
  dueDiligenceProcess,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [dueDiligenceProcess.organizationId],
      references: [organizations.id],
    }),
  })
);

export const iroRegisterRelations = relations(iroRegister, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [iroRegister.organizationId],
    references: [organizations.id],
  }),
  actionPlans: many(actionPlans),
  monitoring: many(iroMonitoring),
}));

export const actionPlansRelations = relations(actionPlans, ({ one }) => ({
  organization: one(organizations, {
    fields: [actionPlans.organizationId],
    references: [organizations.id],
  }),
  iro: one(iroRegister, {
    fields: [actionPlans.iroId],
    references: [iroRegister.id],
  }),
}));

export const iroMonitoringRelations = relations(iroMonitoring, ({ one }) => ({
  organization: one(organizations, {
    fields: [iroMonitoring.organizationId],
    references: [organizations.id],
  }),
  iro: one(iroRegister, {
    fields: [iroMonitoring.iroId],
    references: [iroRegister.id],
  }),
}));

// Risk Management Insert Schemas
export const insertDueDiligenceSchema = createInsertSchema(
  dueDiligenceProcess
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIroRegisterSchema = createInsertSchema(iroRegister).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActionPlansSchema = createInsertSchema(actionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIroMonitoringSchema = createInsertSchema(iroMonitoring).omit(
  {
    id: true,
    createdAt: true,
    updatedAt: true,
  }
);

// Risk Management Types
export type DueDiligenceProcess = typeof dueDiligenceProcess.$inferSelect;
export type InsertDueDiligenceProcess = z.infer<
  typeof insertDueDiligenceSchema
>;
export type IroRegister = typeof iroRegister.$inferSelect;
export type InsertIroRegister = z.infer<typeof insertIroRegisterSchema>;
export type ActionPlans = typeof actionPlans.$inferSelect;
export type InsertActionPlans = z.infer<typeof insertActionPlansSchema>;
export type IroMonitoring = typeof iroMonitoring.$inferSelect;
export type InsertIroMonitoring = z.infer<typeof insertIroMonitoringSchema>;

// Reports Insert Schemas
export const insertReportTemplateSchema = createInsertSchema(
  reportTemplates
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedReportSchema = createInsertSchema(
  generatedReports
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Reports Types
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type GeneratedReport = typeof generatedReports.$inferSelect;
export type InsertGeneratedReport = z.infer<typeof insertGeneratedReportSchema>;
