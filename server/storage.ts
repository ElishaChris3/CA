import {
  users,
  organizations,
  consultantProfiles,
  consultantOrganizations,
  ghgEmissions,
  materialityTopics,
  esrsDisclosures,
  companyProfiles,
  subsidiaries,
  ownershipStructure,
  sustainabilityInitiatives,
  sustainabilityKPIs,
  facilities,
  governanceStructure,
  esgPolicies,
  esgIncentives,
  esgInformationFlows,
  esgIntegration,
  esgDataKpis,
  dueDiligenceProcess,
  iroRegister,
  actionPlans,
  iroMonitoring,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type ConsultantProfile,
  type InsertConsultantProfile,
  type ConsultantOrganization,
  type InsertConsultantOrganization,
  type GhgEmission,
  type InsertGhgEmission,
  type MaterialityTopic,
  type InsertMaterialityTopic,
  type EsrsDisclosure,
  type InsertEsrsDisclosure,
  type CompanyProfile,
  type InsertCompanyProfile,
  type Subsidiary,
  type InsertSubsidiary,
  type OwnershipStructure,
  type InsertOwnershipStructure,
  type SustainabilityInitiative,
  type InsertSustainabilityInitiative,
  type SustainabilityKPI,
  type InsertSustainabilityKPI,
  type Facility,
  type InsertFacility,
  type GovernanceStructure,
  type InsertGovernanceStructure,
  type EsgPolicy,
  type InsertEsgPolicy,
  type EsgIncentives,
  type InsertEsgIncentives,
  type EsgInformationFlows,
  type InsertEsgInformationFlows,
  type EsgIntegration,
  type InsertEsgIntegration,
  type EsgDataKpi,
  type InsertEsgDataKpi,
  type DueDiligenceProcess,
  type InsertDueDiligenceProcess,
  type IroRegister,
  type InsertIroRegister,
  type ActionPlans,
  type InsertActionPlans,
  type IroMonitoring,
  type InsertIroMonitoring,
  reportTemplates,
  generatedReports,
  type ReportTemplate,
  type InsertReportTemplate,
  type GeneratedReport,
  type InsertGeneratedReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganizationsByOwner(ownerId: string): Promise<Organization[]>;
  getOrganizationsByConsultant(consultantId: string): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization>;
  
  // Consultant Profile operations
  createConsultantProfile(profile: InsertConsultantProfile): Promise<ConsultantProfile>;
  getConsultantProfileByUserId(userId: string): Promise<ConsultantProfile | undefined>;
  updateConsultantProfile(id: number, updates: Partial<ConsultantProfile>): Promise<ConsultantProfile>;
  
  // Consultant-Organization relationships
  addConsultantToOrganization(consultantId: string, organizationId: number): Promise<void>;
  createConsultantOrganization(consultantOrg: InsertConsultantOrganization): Promise<ConsultantOrganization>;
  getConsultantOrganizations(consultantId: string): Promise<any[]>;
  
  // GHG Emissions
  createGhgEmission(emission: InsertGhgEmission): Promise<GhgEmission>;
  getGhgEmissionsByOrganization(organizationId: number): Promise<GhgEmission[]>;
  
  // Materiality Topics
  createMaterialityTopic(topic: InsertMaterialityTopic): Promise<MaterialityTopic>;
  getMaterialityTopicsByOrganization(organizationId: number): Promise<MaterialityTopic[]>;
  updateMaterialityTopic(id: number, updates: Partial<MaterialityTopic>): Promise<MaterialityTopic>;
  deleteMaterialityTopic(id: number): Promise<void>;
  
  // ESRS Disclosures
  createEsrsDisclosure(disclosure: InsertEsrsDisclosure): Promise<EsrsDisclosure>;
  getEsrsDisclosuresByOrganization(organizationId: number): Promise<EsrsDisclosure[]>;
  
  // Company Profile operations
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  getCompanyProfileByOrganization(organizationId: number): Promise<CompanyProfile | undefined>;
  updateCompanyProfile(id: number, updates: Partial<CompanyProfile>): Promise<CompanyProfile>;
  
  // Subsidiary operations
  createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary>;
  getSubsidiariesByCompanyProfile(companyProfileId: number): Promise<Subsidiary[]>;
  
  // Ownership Structure operations
  createOwnershipStructure(structure: InsertOwnershipStructure): Promise<OwnershipStructure>;
  getOwnershipStructureByCompanyProfile(companyProfileId: number): Promise<OwnershipStructure[]>;
  
  // Sustainability Initiatives operations
  createSustainabilityInitiative(initiative: InsertSustainabilityInitiative): Promise<SustainabilityInitiative>;
  getSustainabilityInitiativesByCompanyProfile(companyProfileId: number): Promise<SustainabilityInitiative[]>;
  
  // Sustainability KPIs operations
  createSustainabilityKPI(kpi: InsertSustainabilityKPI): Promise<SustainabilityKPI>;
  getSustainabilityKPIsByCompanyProfile(companyProfileId: number): Promise<SustainabilityKPI[]>;
  
  // Facilities operations
  createFacility(facility: InsertFacility): Promise<Facility>;
  getFacilitiesByOrganization(organizationId: number): Promise<Facility[]>;
  updateFacility(id: number, updates: Partial<Facility>): Promise<Facility>;
  deleteFacility(id: number): Promise<void>;
  
  // Governance Module operations
  createGovernanceStructure(structure: InsertGovernanceStructure): Promise<GovernanceStructure>;
  getGovernanceStructureByOrganization(organizationId: number): Promise<GovernanceStructure | undefined>;
  updateGovernanceStructure(id: number, updates: Partial<GovernanceStructure>): Promise<GovernanceStructure>;
  
  createEsgPolicy(policy: InsertEsgPolicy): Promise<EsgPolicy>;
  getEsgPoliciesByOrganization(organizationId: number): Promise<EsgPolicy[]>;
  updateEsgPolicy(id: number, updates: Partial<EsgPolicy>): Promise<EsgPolicy>;
  deleteEsgPolicy(id: number): Promise<void>;
  
  createEsgIncentives(incentives: InsertEsgIncentives): Promise<EsgIncentives>;
  getEsgIncentivesByOrganization(organizationId: number): Promise<EsgIncentives | undefined>;
  updateEsgIncentives(id: number, updates: Partial<EsgIncentives>): Promise<EsgIncentives>;
  
  createEsgInformationFlows(flows: InsertEsgInformationFlows): Promise<EsgInformationFlows>;
  getEsgInformationFlowsByOrganization(organizationId: number): Promise<EsgInformationFlows | undefined>;
  updateEsgInformationFlows(id: number, updates: Partial<EsgInformationFlows>): Promise<EsgInformationFlows>;
  
  createEsgIntegration(integration: InsertEsgIntegration): Promise<EsgIntegration>;
  getEsgIntegrationByOrganization(organizationId: number): Promise<EsgIntegration | undefined>;
  updateEsgIntegration(id: number, updates: Partial<EsgIntegration>): Promise<EsgIntegration>;
  
  // ESG Data Collection operations
  createEsgDataKpi(kpi: InsertEsgDataKpi): Promise<EsgDataKpi>;
  getEsgDataKpisByOrganization(organizationId: number): Promise<EsgDataKpi[]>;
  getEsgDataKpisBySection(organizationId: number, esgSection: string): Promise<EsgDataKpi[]>;
  getEsgDataKpisByTopic(organizationId: number, esrsTopic: string): Promise<EsgDataKpi[]>;
  updateEsgDataKpi(id: number, updates: Partial<EsgDataKpi>): Promise<EsgDataKpi>;
  deleteEsgDataKpi(id: number): Promise<void>;
  
  // Risk & Impact Management operations
  // Due Diligence Process
  createDueDiligenceProcess(process: InsertDueDiligenceProcess): Promise<DueDiligenceProcess>;
  getDueDiligenceProcessByOrganization(organizationId: number): Promise<DueDiligenceProcess | undefined>;
  updateDueDiligenceProcess(id: number, updates: Partial<DueDiligenceProcess>): Promise<DueDiligenceProcess>;
  
  // IRO Register
  createIroRegister(iro: InsertIroRegister): Promise<IroRegister>;
  getIroRegisterByOrganization(organizationId: number): Promise<IroRegister[]>;
  updateIroRegister(id: number, updates: Partial<IroRegister>): Promise<IroRegister>;
  deleteIroRegister(id: number): Promise<void>;
  
  // Action Plans
  createActionPlan(plan: InsertActionPlans): Promise<ActionPlans>;
  getActionPlansByOrganization(organizationId: number): Promise<ActionPlans[]>;
  getActionPlansByIro(iroId: number): Promise<ActionPlans[]>;
  updateActionPlan(id: number, updates: Partial<ActionPlans>): Promise<ActionPlans>;
  deleteActionPlan(id: number): Promise<void>;
  
  // IRO Monitoring
  createIroMonitoring(monitoring: InsertIroMonitoring): Promise<IroMonitoring>;
  getIroMonitoringByOrganization(organizationId: number): Promise<IroMonitoring[]>;
  getIroMonitoringByIro(iroId: number): Promise<IroMonitoring[]>;
  updateIroMonitoring(id: number, updates: Partial<IroMonitoring>): Promise<IroMonitoring>;
  deleteIroMonitoring(id: number): Promise<void>;

  // Reports operations
  // Report Templates
  getReportTemplates(): Promise<ReportTemplate[]>;
  getReportTemplateById(id: number): Promise<ReportTemplate | undefined>;
  
  // Generated Reports
  createGeneratedReport(report: InsertGeneratedReport): Promise<GeneratedReport>;
  getGeneratedReportsByOrganization(organizationId: number): Promise<GeneratedReport[]>;
  getGeneratedReportById(id: number): Promise<GeneratedReport | undefined>;
  updateGeneratedReport(id: number, updates: Partial<GeneratedReport>): Promise<GeneratedReport>;
  deleteGeneratedReport(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(org)
      .returning();
    return organization;
  }

  async getOrganizationsByOwner(ownerId: string): Promise<Organization[]> {
    return await db
      .select()
      .from(organizations)
      .where(eq(organizations.ownerId, ownerId))
      .orderBy(desc(organizations.createdAt));
  }

  async getOrganizationsByConsultant(consultantId: string): Promise<Organization[]> {
    return await db
      .select({
        id: organizations.id,
        name: organizations.name,
        industry: organizations.industry,
        businessType: organizations.businessType,
        country: organizations.country,
        employeeCount: organizations.employeeCount,
        annualRevenue: organizations.annualRevenue,
        reportingYear: organizations.reportingYear,
        ownerId: organizations.ownerId,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .innerJoin(
        consultantOrganizations,
        eq(organizations.id, consultantOrganizations.organizationId)
      )
      .where(eq(consultantOrganizations.consultantId, consultantId))
      .orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return organization;
  }

  async updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization> {
    const [organization] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return organization;
  }

  // Consultant Profile operations
  async createConsultantProfile(profile: InsertConsultantProfile): Promise<ConsultantProfile> {
    const [consultantProfile] = await db
      .insert(consultantProfiles)
      .values(profile)
      .returning();
    return consultantProfile;
  }

  async getConsultantProfileByUserId(userId: string): Promise<ConsultantProfile | undefined> {
    const [profile] = await db
      .select()
      .from(consultantProfiles)
      .where(eq(consultantProfiles.userId, userId));
    return profile;
  }

  async updateConsultantProfile(id: number, updates: Partial<ConsultantProfile>): Promise<ConsultantProfile> {
    const [profile] = await db
      .update(consultantProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(consultantProfiles.id, id))
      .returning();
    return profile;
  }

  // Consultant-Organization relationships
  async addConsultantToOrganization(consultantId: string, organizationId: number): Promise<void> {
    await db.insert(consultantOrganizations).values({
      consultantId,
      organizationId,
    });
  }

  async createConsultantOrganization(consultantOrg: InsertConsultantOrganization): Promise<ConsultantOrganization> {
    const [newConsultantOrg] = await db.insert(consultantOrganizations).values(consultantOrg).returning();
    return newConsultantOrg;
  }

  async getConsultantOrganizations(consultantId: string): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: consultantOrganizations.id,
          organizationId: consultantOrganizations.organizationId,
          role: consultantOrganizations.role,
          contactEmail: consultantOrganizations.contactEmail,
          contactPerson: consultantOrganizations.contactPerson,
          createdAt: consultantOrganizations.createdAt,
          organizationName: organizations.name,
          industry: organizations.industry,
          country: organizations.country,
          employeeCount: organizations.employeeCount,
          annualRevenue: organizations.annualRevenue,
          reportingYear: organizations.reportingYear,
        })
        .from(consultantOrganizations)
        .leftJoin(organizations, eq(consultantOrganizations.organizationId, organizations.id))
        .where(eq(consultantOrganizations.consultantId, consultantId));
      
      return result;
    } catch (error) {
      console.error('Error in getConsultantOrganizations:', error);
      // Return empty array if there's an error
      return [];
    }
  }

  // GHG Emissions
  async createGhgEmission(emission: InsertGhgEmission): Promise<GhgEmission> {
    const [ghgEmission] = await db
      .insert(ghgEmissions)
      .values(emission)
      .returning();
    return ghgEmission;
  }

  async getGhgEmissionsByOrganization(organizationId: number): Promise<GhgEmission[]> {
    return await db
      .select()
      .from(ghgEmissions)
      .where(eq(ghgEmissions.organizationId, organizationId))
      .orderBy(desc(ghgEmissions.createdAt));
  }

  // Materiality Topics
  async createMaterialityTopic(topic: InsertMaterialityTopic): Promise<MaterialityTopic> {
    const [materialityTopic] = await db
      .insert(materialityTopics)
      .values(topic)
      .returning();
    return materialityTopic;
  }

  async getMaterialityTopicsByOrganization(organizationId: number): Promise<MaterialityTopic[]> {
    return await db
      .select()
      .from(materialityTopics)
      .where(eq(materialityTopics.organizationId, organizationId))
      .orderBy(desc(materialityTopics.createdAt));
  }

  async updateMaterialityTopic(id: number, updates: Partial<MaterialityTopic>): Promise<MaterialityTopic> {
    const [topic] = await db
      .update(materialityTopics)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(materialityTopics.id, id))
      .returning();
    return topic;
  }

  async deleteMaterialityTopic(id: number): Promise<void> {
    await db.delete(materialityTopics).where(eq(materialityTopics.id, id));
  }

  // ESRS Disclosures
  async createEsrsDisclosure(disclosure: InsertEsrsDisclosure): Promise<EsrsDisclosure> {
    const [esrsDisclosure] = await db
      .insert(esrsDisclosures)
      .values(disclosure)
      .returning();
    return esrsDisclosure;
  }

  async getEsrsDisclosuresByOrganization(organizationId: number): Promise<EsrsDisclosure[]> {
    return await db
      .select()
      .from(esrsDisclosures)
      .where(eq(esrsDisclosures.organizationId, organizationId))
      .orderBy(desc(esrsDisclosures.createdAt));
  }

  // Company Profile operations
  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const [newProfile] = await db.insert(companyProfiles).values(profile).returning();
    return newProfile;
  }

  async getCompanyProfileByOrganization(organizationId: number): Promise<CompanyProfile | undefined> {
    const [profile] = await db.select().from(companyProfiles).where(eq(companyProfiles.organizationId, organizationId));
    return profile;
  }

  async updateCompanyProfile(id: number, updates: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const [updatedProfile] = await db.update(companyProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  // Subsidiary operations
  async createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary> {
    const [newSubsidiary] = await db.insert(subsidiaries).values(subsidiary).returning();
    return newSubsidiary;
  }

  async getSubsidiariesByCompanyProfile(companyProfileId: number): Promise<Subsidiary[]> {
    return await db.select().from(subsidiaries).where(eq(subsidiaries.companyProfileId, companyProfileId));
  }

  // Ownership Structure operations
  async createOwnershipStructure(structure: InsertOwnershipStructure): Promise<OwnershipStructure> {
    const [newStructure] = await db.insert(ownershipStructure).values(structure).returning();
    return newStructure;
  }

  async getOwnershipStructureByCompanyProfile(companyProfileId: number): Promise<OwnershipStructure[]> {
    return await db.select().from(ownershipStructure).where(eq(ownershipStructure.companyProfileId, companyProfileId));
  }

  // Sustainability Initiatives operations
  async createSustainabilityInitiative(initiative: InsertSustainabilityInitiative): Promise<SustainabilityInitiative> {
    const [newInitiative] = await db.insert(sustainabilityInitiatives).values(initiative).returning();
    return newInitiative;
  }

  async getSustainabilityInitiativesByCompanyProfile(companyProfileId: number): Promise<SustainabilityInitiative[]> {
    return await db.select().from(sustainabilityInitiatives).where(eq(sustainabilityInitiatives.companyProfileId, companyProfileId));
  }

  // Sustainability KPIs operations
  async createSustainabilityKPI(kpi: InsertSustainabilityKPI): Promise<SustainabilityKPI> {
    const [newKPI] = await db.insert(sustainabilityKPIs).values(kpi).returning();
    return newKPI;
  }

  async getSustainabilityKPIsByCompanyProfile(companyProfileId: number): Promise<SustainabilityKPI[]> {
    return await db.select().from(sustainabilityKPIs).where(eq(sustainabilityKPIs.companyProfileId, companyProfileId));
  }
  
  async createFacility(facility: InsertFacility): Promise<Facility> {
    const [result] = await db
      .insert(facilities)
      .values(facility)
      .returning();
    return result;
  }
  
  async getFacilitiesByOrganization(organizationId: number): Promise<Facility[]> {
    return await db
      .select()
      .from(facilities)
      .where(eq(facilities.organizationId, organizationId));
  }
  
  async updateFacility(id: number, updates: Partial<Facility>): Promise<Facility> {
    const [result] = await db
      .update(facilities)
      .set(updates)
      .where(eq(facilities.id, id))
      .returning();
    return result;
  }
  
  async deleteFacility(id: number): Promise<void> {
    await db.delete(facilities).where(eq(facilities.id, id));
  }

  // Governance Module methods
  async createGovernanceStructure(structure: InsertGovernanceStructure): Promise<GovernanceStructure> {
    const [result] = await db.insert(governanceStructure).values(structure).returning();
    return result;
  }

  async getGovernanceStructureByOrganization(organizationId: number): Promise<GovernanceStructure | undefined> {
    const [result] = await db
      .select()
      .from(governanceStructure)
      .where(eq(governanceStructure.organizationId, organizationId));
    return result;
  }

  async updateGovernanceStructure(id: number, updates: Partial<GovernanceStructure>): Promise<GovernanceStructure> {
    const [result] = await db
      .update(governanceStructure)
      .set(updates)
      .where(eq(governanceStructure.id, id))
      .returning();
    return result;
  }

  async createEsgPolicy(policy: InsertEsgPolicy): Promise<EsgPolicy> {
    const [result] = await db.insert(esgPolicies).values(policy).returning();
    return result;
  }

  async getEsgPoliciesByOrganization(organizationId: number): Promise<EsgPolicy[]> {
    return await db
      .select()
      .from(esgPolicies)
      .where(eq(esgPolicies.organizationId, organizationId));
  }

  async updateEsgPolicy(id: number, updates: Partial<EsgPolicy>): Promise<EsgPolicy> {
    const [result] = await db
      .update(esgPolicies)
      .set(updates)
      .where(eq(esgPolicies.id, id))
      .returning();
    return result;
  }

  async deleteEsgPolicy(id: number): Promise<void> {
    await db.delete(esgPolicies).where(eq(esgPolicies.id, id));
  }

  async createEsgIncentives(incentives: InsertEsgIncentives): Promise<EsgIncentives> {
    const [result] = await db.insert(esgIncentives).values(incentives).returning();
    return result;
  }

  async getEsgIncentivesByOrganization(organizationId: number): Promise<EsgIncentives | undefined> {
    const [result] = await db
      .select()
      .from(esgIncentives)
      .where(eq(esgIncentives.organizationId, organizationId));
    return result;
  }

  async updateEsgIncentives(id: number, updates: Partial<EsgIncentives>): Promise<EsgIncentives> {
    const [result] = await db
      .update(esgIncentives)
      .set(updates)
      .where(eq(esgIncentives.id, id))
      .returning();
    return result;
  }

  async createEsgInformationFlows(flows: InsertEsgInformationFlows): Promise<EsgInformationFlows> {
    const [result] = await db.insert(esgInformationFlows).values(flows).returning();
    return result;
  }

  async getEsgInformationFlowsByOrganization(organizationId: number): Promise<EsgInformationFlows | undefined> {
    const [result] = await db
      .select()
      .from(esgInformationFlows)
      .where(eq(esgInformationFlows.organizationId, organizationId));
    return result;
  }

  async updateEsgInformationFlows(id: number, updates: Partial<EsgInformationFlows>): Promise<EsgInformationFlows> {
    const [result] = await db
      .update(esgInformationFlows)
      .set(updates)
      .where(eq(esgInformationFlows.id, id))
      .returning();
    return result;
  }

  async createEsgIntegration(integration: InsertEsgIntegration): Promise<EsgIntegration> {
    const [result] = await db.insert(esgIntegration).values(integration).returning();
    return result;
  }

  async getEsgIntegrationByOrganization(organizationId: number): Promise<EsgIntegration | undefined> {
    const [result] = await db
      .select()
      .from(esgIntegration)
      .where(eq(esgIntegration.organizationId, organizationId));
    return result;
  }

  async updateEsgIntegration(id: number, updates: Partial<EsgIntegration>): Promise<EsgIntegration> {
    const [result] = await db
      .update(esgIntegration)
      .set(updates)
      .where(eq(esgIntegration.id, id))
      .returning();
    return result;
  }

  // ESG Data Collection operations
  async createEsgDataKpi(kpi: InsertEsgDataKpi): Promise<EsgDataKpi> {
    const [created] = await db.insert(esgDataKpis).values(kpi).returning();
    return created;
  }

  async getEsgDataKpisByOrganization(organizationId: number): Promise<EsgDataKpi[]> {
    return await db.select().from(esgDataKpis).where(eq(esgDataKpis.organizationId, organizationId));
  }

  async getEsgDataKpisBySection(organizationId: number, esgSection: string): Promise<EsgDataKpi[]> {
    return await db.select().from(esgDataKpis)
      .where(and(eq(esgDataKpis.organizationId, organizationId)));
  }

  async getEsgDataKpisByTopic(organizationId: number, esrsTopic: string): Promise<EsgDataKpi[]> {
    return await db.select().from(esgDataKpis)
      .where(and(eq(esgDataKpis.organizationId, organizationId), eq(esgDataKpis.esrsTopic, esrsTopic)));
  }

  async updateEsgDataKpi(id: number, updates: Partial<EsgDataKpi>): Promise<EsgDataKpi> {
    const [updated] = await db.update(esgDataKpis).set(updates).where(eq(esgDataKpis.id, id)).returning();
    if (!updated) {
      throw new Error("ESG data KPI not found");
    }
    return updated;
  }

  async deleteEsgDataKpi(id: number): Promise<void> {
    await db.delete(esgDataKpis).where(eq(esgDataKpis.id, id));
  }

  // Risk & Impact Management operations
  // Due Diligence Process
  async createDueDiligenceProcess(process: InsertDueDiligenceProcess): Promise<DueDiligenceProcess> {
    const [created] = await db.insert(dueDiligenceProcess).values(process).returning();
    return created;
  }

  async getDueDiligenceProcessByOrganization(organizationId: number): Promise<DueDiligenceProcess | undefined> {
    const [result] = await db
      .select()
      .from(dueDiligenceProcess)
      .where(eq(dueDiligenceProcess.organizationId, organizationId));
    return result;
  }

  async updateDueDiligenceProcess(id: number, updates: Partial<DueDiligenceProcess>): Promise<DueDiligenceProcess> {
    const [updated] = await db
      .update(dueDiligenceProcess)
      .set(updates)
      .where(eq(dueDiligenceProcess.id, id))
      .returning();
    if (!updated) {
      throw new Error("Due diligence process not found");
    }
    return updated;
  }

  // IRO Register
  async createIroRegister(iro: InsertIroRegister): Promise<IroRegister> {
    const [created] = await db.insert(iroRegister).values(iro).returning();
    return created;
  }

  async getIroRegisterByOrganization(organizationId: number): Promise<IroRegister[]> {
    return await db
      .select()
      .from(iroRegister)
      .where(eq(iroRegister.organizationId, organizationId))
      .orderBy(desc(iroRegister.createdAt));
  }

  async updateIroRegister(id: number, updates: Partial<IroRegister>): Promise<IroRegister> {
    const [updated] = await db
      .update(iroRegister)
      .set(updates)
      .where(eq(iroRegister.id, id))
      .returning();
    if (!updated) {
      throw new Error("IRO register entry not found");
    }
    return updated;
  }

  async deleteIroRegister(id: number): Promise<void> {
    await db.delete(iroRegister).where(eq(iroRegister.id, id));
  }

  // Action Plans
  async createActionPlan(plan: InsertActionPlans): Promise<ActionPlans> {
    const [created] = await db.insert(actionPlans).values(plan).returning();
    return created;
  }

  async getActionPlansByOrganization(organizationId: number): Promise<ActionPlans[]> {
    return await db
      .select()
      .from(actionPlans)
      .where(eq(actionPlans.organizationId, organizationId))
      .orderBy(desc(actionPlans.createdAt));
  }

  async getActionPlansByIro(iroId: number): Promise<ActionPlans[]> {
    return await db
      .select()
      .from(actionPlans)
      .where(eq(actionPlans.iroId, iroId))
      .orderBy(desc(actionPlans.createdAt));
  }

  async updateActionPlan(id: number, updates: Partial<ActionPlans>): Promise<ActionPlans> {
    const [updated] = await db
      .update(actionPlans)
      .set(updates)
      .where(eq(actionPlans.id, id))
      .returning();
    if (!updated) {
      throw new Error("Action plan not found");
    }
    return updated;
  }

  async deleteActionPlan(id: number): Promise<void> {
    await db.delete(actionPlans).where(eq(actionPlans.id, id));
  }

  // IRO Monitoring
  async createIroMonitoring(monitoring: InsertIroMonitoring): Promise<IroMonitoring> {
    const [created] = await db.insert(iroMonitoring).values(monitoring).returning();
    return created;
  }

  async getIroMonitoringByOrganization(organizationId: number): Promise<IroMonitoring[]> {
    return await db
      .select()
      .from(iroMonitoring)
      .where(eq(iroMonitoring.organizationId, organizationId))
      .orderBy(desc(iroMonitoring.createdAt));
  }

  async getIroMonitoringByIro(iroId: number): Promise<IroMonitoring[]> {
    return await db
      .select()
      .from(iroMonitoring)
      .where(eq(iroMonitoring.iroId, iroId))
      .orderBy(desc(iroMonitoring.createdAt));
  }

  async updateIroMonitoring(id: number, updates: Partial<IroMonitoring>): Promise<IroMonitoring> {
    const [updated] = await db
      .update(iroMonitoring)
      .set(updates)
      .where(eq(iroMonitoring.id, id))
      .returning();
    if (!updated) {
      throw new Error("IRO monitoring entry not found");
    }
    return updated;
  }

  async deleteIroMonitoring(id: number): Promise<void> {
    await db.delete(iroMonitoring).where(eq(iroMonitoring.id, id));
  }

  // Reports operations
  // Report Templates
  async getReportTemplates(): Promise<ReportTemplate[]> {
    return await db.select().from(reportTemplates).orderBy(reportTemplates.name);
  }

  async getReportTemplateById(id: number): Promise<ReportTemplate | undefined> {
    const [template] = await db.select().from(reportTemplates).where(eq(reportTemplates.id, id));
    return template;
  }

  // Generated Reports
  async createGeneratedReport(report: InsertGeneratedReport): Promise<GeneratedReport> {
    const [created] = await db.insert(generatedReports).values(report).returning();
    return created;
  }

  async getGeneratedReportsByOrganization(organizationId: number): Promise<GeneratedReport[]> {
    return await db
      .select()
      .from(generatedReports)
      .where(eq(generatedReports.organizationId, organizationId))
      .orderBy(desc(generatedReports.createdAt));
  }

  async getGeneratedReportById(id: number): Promise<GeneratedReport | undefined> {
    const [report] = await db.select().from(generatedReports).where(eq(generatedReports.id, id));
    return report;
  }

  async updateGeneratedReport(id: number, updates: Partial<GeneratedReport>): Promise<GeneratedReport> {
    const [updated] = await db
      .update(generatedReports)
      .set({
        ...updates,
        lastModified: new Date(),
        updatedAt: new Date()
      })
      .where(eq(generatedReports.id, id))
      .returning();
    if (!updated) {
      throw new Error("Generated report not found");
    }
    return updated;
  }

  async deleteGeneratedReport(id: number): Promise<void> {
    await db.delete(generatedReports).where(eq(generatedReports.id, id));
  }
}

export const storage = new DatabaseStorage();
