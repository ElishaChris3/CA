import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  FileText,
  Download,
  Edit3,
  Trash2,
  Plus,
  Save,
  Eye,
  ExternalLink,
  X,
  RefreshCw,
  Building,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Types
interface ReportTemplate {
  id: number;
  name: string;
  framework: string;
  type: "esrs" | "gri" | "sasb" | "tcfd";
  status: "available" | "coming_soon";
  description: string;
  sections: any[];
  createdAt: string;
  updatedAt: string;
}

interface GeneratedReport {
  id: number;
  organizationId: number;
  templateId: number;
  title: string;
  status: "draft" | "final";
  language: "en" | "de";
  sections: any;
  generatedAt: string;
  lastModified: string;
  finalizedAt?: string;
  exportedPdf: boolean;
  exportedWord: boolean;
  exportedXhtml: boolean;
  createdAt: string;
  updatedAt: string;
}

const reportSchema = z.object({
  templateId: z.number().min(1, "Template is required"),
  title: z.string().min(1, "Title is required"),
  language: z.enum(["en", "de"]),
  sections: z.record(z.any()).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | number>(
    user?.role === "consultant" ? "none" : user?.organizationId || 0
  );
  const [editingReport, setEditingReport] = useState<GeneratedReport | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentReport, setCurrentReport] = useState<GeneratedReport | null>(
    null
  );
  const [currentReportViewer, setCurrentReportViewer] =
    useState<GeneratedReport | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch client organizations for consultants
  const { data: clientOrganizations } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user && user.role === "consultant",
  });

  console.log("User Role:", user?.role);

  // Fetch report templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<
    ReportTemplate[]
  >({
    queryKey: ["/api/report-templates"],
  });

  // Fetch generated reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<
    GeneratedReport[]
  >({
    queryKey: [`/api/generated-reports?organizationId=${selectedClient}`],
  });

  console.log("Selected Client:", selectedClient);
  console.log("Reports Data:", reports);

  // Fetch company profile data for auto-filling
  const { data: companyProfile, isLoading: companyProfileLoading } = useQuery({
    queryKey: ["/api/company-profile"],
    enabled: !!currentReport, // Only fetch when editing a report
  });

  // Fetch governance data for auto-filling
  const { data: governanceData, isLoading: governanceLoading } = useQuery({
    queryKey: ["/api/governance-structure"],
    enabled: !!currentReport, // Only fetch when editing a report
  });

  // Fetch materiality topics data for auto-filling
  const { data: materialityTopics, isLoading: materialityLoading } = useQuery({
    queryKey: ["/api/materiality-topics"],
    enabled: !!currentReport, // Only fetch when editing a report
  });

  // Fetch Risk Management data for auto-filling
  const { data: riskRegister } = useQuery<any[]>({
    queryKey: ["/api/iro-register"],
    enabled: !!currentReport, // Only fetch when editing a report
  });

  const { data: dueDiligenceProcess } = useQuery<any>({
    queryKey: ["/api/due-diligence-process"],
    enabled: !!currentReport, // Only fetch when editing a report
  });

  const { data: actionPlans } = useQuery<any[]>({
    queryKey: ["/api/action-plans"],
    enabled: !!currentReport, // Only fetch when editing a report
  });

  // Fetch ESG Data KPIs for auto-filling Policies, Actions, Targets & KPIs section
  const { data: esgDataKpis } = useQuery<any[]>({
    queryKey: ["/api/esg-data-kpis"],
    enabled: !!currentReport, // Only fetch when editing a report
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: (data: ReportFormData) =>
      apiRequest("/api/generated-reports", "POST", {
        ...data,
        organizationId: selectedClient,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report created successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/generated-reports?organizationId=${selectedClient}`],
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create report",
        variant: "destructive",
      });
    },
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<GeneratedReport>;
    }) => apiRequest(`/api/generated-reports/${id}`, "PUT", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/generated-reports"] });
      setIsEditDialogOpen(false);
      setEditingReport(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/generated-reports/${id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/generated-reports?organizationId=${selectedClient}`],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  // Form for creating new reports
  const createForm = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    mode: "onSubmit",
    defaultValues: {
      templateId: 0,
      title: "",
      language: "en",
      sections: {},
    },
  });

  // Form for editing reports
  const editForm = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      templateId: 0,
      title: "",
      language: "en",
      sections: {},
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (editingReport) {
      editForm.reset({
        templateId: editingReport.templateId,
        title: editingReport.title,
        language: editingReport.language,
        sections: editingReport.sections || {},
      });
    }
  }, [editingReport, editForm]);

  // Auto-populate report sections from Company Profile and other data sources
  useEffect(() => {
    if (companyProfile && currentReport && currentReport.id) {
      console.log("Auto-populating report data:", {
        companyProfile,
        governanceData,
        materialityTopics,
        riskRegister,
        dueDiligenceProcess,
        actionPlans,
        currentReport,
      });

      // Check if sections already exist to avoid infinite loop
      const hasGeneralInfo =
        currentReport.sections?.general_info?.entityLegalName;
      const hasGovernanceStrategy =
        currentReport.sections?.governance_strategy?.keyProducts;
      const hasMaterialityAssessment =
        currentReport.sections?.materiality_assessment?.listOfAssessedTopics;
      const hasImpactsRisks =
        currentReport.sections?.impacts_risks?.sustainabilityRisks;

      if (
        hasGeneralInfo &&
        hasGovernanceStrategy &&
        hasMaterialityAssessment &&
        hasImpactsRisks
      ) {
        console.log("Sections already populated, skipping auto-population");
        return;
      }

      // Auto-fill General Information section from Company Profile data
      const subsidiariesText =
        companyProfile.subsidiaries
          ?.map(
            (sub: any) =>
              `${sub.name} (${sub.country}) - ${sub.ownershipPercentage}%`
          )
          .join(", ") || "";

      const reportingPeriod = companyProfile.fiscalYearEnd
        ? `1 January ${
            new Date(companyProfile.fiscalYearEnd).getFullYear() - 1
          } - ${format(new Date(companyProfile.fiscalYearEnd), "dd MMMM yyyy")}`
        : "";

      // Auto-fill Governance, Strategy & Business Model section
      const keyProductsText = companyProfile.keyProducts?.join(", ") || "";
      const primaryMarketsText =
        companyProfile.primaryMarkets?.join(", ") || "";
      const netZeroTargetText = companyProfile.netZeroTarget?.toString() || "";

      // Governance data from governance structure
      const governanceRolesText =
        governanceData?.committeeResponsibilities?.join(", ") || "";
      const boardOversightText = governanceData?.boardOversightMechanism || "";

      // Materiality assessment data from materiality topics
      const assessedTopicsList =
        materialityTopics
          ?.map(
            (topic: any) =>
              `${topic.topic} (${topic.subcategory || topic.category})`
          )
          .join(", ") || "";

      const materialTopicsTable =
        materialityTopics
          ?.filter((topic: any) => topic.isMaterial)
          .map(
            (topic: any) =>
              `${topic.topic}: Material Index ${
                topic.materialityIndex
              }, Stakeholders: ${
                topic.impactedStakeholders?.join(", ") || "N/A"
              }`
          )
          .join("\n") || "";

      // Risk Management data from IRO Register and Due Diligence Process
      const sustainabilityRisks =
        riskRegister
          ?.filter((item: any) => item.iroType === "Risk")
          .map((risk: any) => {
            const riskDetails = [];
            riskDetails.push(`Title: ${risk.iroTitle}`);
            riskDetails.push(`Description: ${risk.iroDescription || "N/A"}`);
            riskDetails.push(`Category: ${risk.category || "N/A"}`);
            riskDetails.push(`Likelihood: ${risk.likelihood || "N/A"}/5`);
            riskDetails.push(
              `Impact/Severity: ${risk.severityMagnitude || "N/A"}/5`
            );
            riskDetails.push(`Time Horizon: ${risk.timeHorizon || "N/A"}`);
            riskDetails.push(
              `Affected Stakeholders: ${
                risk.affectedStakeholders?.join(", ") || "N/A"
              }`
            );
            riskDetails.push(
              `Value Chain Location: ${risk.valueChainLocation || "N/A"}`
            );
            riskDetails.push(
              `Financial Materiality: ${
                risk.financialMateriality ? "Yes" : "No"
              }`
            );
            riskDetails.push(
              `Impact Materiality: ${risk.impactMateriality ? "Yes" : "No"}`
            );
            return riskDetails.join(" | ");
          })
          .join("\n\n") || "";

      const sustainabilityOpportunities =
        riskRegister
          ?.filter((item: any) => item.iroType === "Opportunity")
          .map(
            (opp: any) =>
              `${opp.iroTitle}: ${opp.iroDescription} (Value Chain: ${
                opp.valueChainLocation || "N/A"
              })`
          )
          .join("\n") || "";

      const valueChainMapping =
        riskRegister
          ?.map(
            (item: any) =>
              `${item.iroTitle}: Affects ${
                item.affectedStakeholders?.join(", ") || "N/A"
              } - Location: ${item.valueChainLocation || "N/A"}`
          )
          .join("\n") || "";

      console.log("Due Diligence Process Data:", dueDiligenceProcess);

      const dueDiligenceFrameworks =
        dueDiligenceProcess?.frameworks?.join(", ") || "";
      const scopeDescription = dueDiligenceProcess?.scopeDescription || "";
      const governanceOversight =
        dueDiligenceProcess?.governanceOversight || "";

      const remediationMechanisms =
        actionPlans
          ?.map(
            (plan: any) =>
              `${plan.responseType}: ${plan.responseDescription} (Target: ${
                plan.targetOutcome || "N/A"
              }, Responsible: ${plan.responsibleDepartment || "N/A"})`
          )
          .join("\n") || "";

      // ESG Data KPIs organized by topic for Policies, Actions, Targets & KPIs section
      const esgDataByTopic =
        esgDataKpis?.reduce((acc: any, kpi: any) => {
          const topicKey = `${kpi.esrsTopic} - ${kpi.topicTitle}`;
          if (!acc[topicKey]) {
            acc[topicKey] = [];
          }
          acc[topicKey].push(kpi);
          return acc;
        }, {}) || {};

      const policiesActionsTargetsKpis =
        Object.entries(esgDataByTopic)
          .map(([topic, kpis]: [string, any]) => {
            const kpiList = kpis
              .map((kpi: any) => {
                const kpiDetails = [];
                kpiDetails.push(`KPI: ${kpi.kpiName}`);
                kpiDetails.push(`Type: ${kpi.metricType}`);
                kpiDetails.push(`Unit: ${kpi.unitOfMeasure}`);
                kpiDetails.push(`Current Value: ${kpi.currentValue || "N/A"}`);
                kpiDetails.push(`Baseline Year: ${kpi.baselineYear || "N/A"}`);
                kpiDetails.push(`Data Owner: ${kpi.dataOwner}`);
                kpiDetails.push(
                  `Collection Frequency: ${kpi.collectionFrequency}`
                );
                kpiDetails.push(`Collection Method: ${kpi.collectionMethod}`);
                kpiDetails.push(`Assurance Level: ${kpi.assuranceLevel}`);
                kpiDetails.push(
                  `Verification Status: ${kpi.verificationStatus}`
                );
                kpiDetails.push(
                  `Reference Standards: ${
                    kpi.referenceStandard?.join(", ") || "N/A"
                  }`
                );
                kpiDetails.push(
                  `Reporting Period: ${kpi.reportingPeriod || "N/A"}`
                );
                kpiDetails.push(`Completion Status: ${kpi.completionStatus}`);
                if (kpi.notes) kpiDetails.push(`Notes: ${kpi.notes}`);
                return kpiDetails.join(" | ");
              })
              .join("\n\n");
            return `${topic}:\n${kpiList}`;
          })
          .join("\n\n\n") || "";

      // Update the current report sections with auto-filled data
      const updatedSections = {
        ...currentReport.sections,
        general_info: {
          entityLegalName: companyProfile.legalName || "",
          legalForm: companyProfile.legalForm || "",
          countryOfRegistration: companyProfile.country || "",
          naceSector: companyProfile.naceSectorCode || "",
          consolidationScope: subsidiariesText,
          registeredHQ: companyProfile.registeredHQ || "",
          reportingPeriod: reportingPeriod,
        },
        governance_strategy: {
          businessModelOverview: companyProfile.supplyChainDescription || "",
          keyProducts: keyProductsText,
          primaryMarkets: primaryMarketsText,
          esgStrategyOverview: companyProfile.sustainabilityPolicies || "",
          transitionPlan: companyProfile.transitionUpdates || "",
          netZeroTarget: netZeroTargetText,
          circularEconomyInitiatives:
            companyProfile.circularEconomyInitiatives || "",
          governanceRoles: governanceRolesText,
          boardOversight: boardOversightText,
        },
        materiality_assessment: {
          materialityAssessmentMethodology: "",
          listOfAssessedTopics: assessedTopicsList,
          stakeholderInputInAssessment: "",
          finalMaterialTopicsTable: materialTopicsTable,
        },
        impacts_risks: {
          sustainabilityRisks: sustainabilityRisks,
          sustainabilityOpportunities: sustainabilityOpportunities,
          valueChainMapping: valueChainMapping,
          dueDiligenceFrameworks: dueDiligenceFrameworks,
          scopeDescription: scopeDescription,
          governanceOversight: governanceOversight,
          remediationMechanisms: remediationMechanisms,
        },
        policies_actions_targets_kpis: {
          esgDataByTopic: policiesActionsTargetsKpis,
        },
      };

      console.log("Updated sections:", updatedSections);
      setCurrentReport({ ...currentReport, sections: updatedSections });
      setCurrentReportViewer({ ...currentReport, sections: updatedSections });
    }
  }, [
    companyProfile,
    governanceData,
    materialityTopics,
    riskRegister,
    dueDiligenceProcess,
    actionPlans,
    esgDataKpis,
    currentReport?.id,
  ]);

  const handleCreateReport = (data: ReportFormData) => {
    createReportMutation.mutate(data);
  };

  const handleUpdateReport = (data: ReportFormData) => {
    if (editingReport) {
      updateReportMutation.mutate({
        id: editingReport.id,
        data: {
          ...data,
          lastModified: new Date(),
        },
      });
    }
  };

  const handleDeleteReport = (id: number) => {
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReportMutation.mutate(id);
    }
  };

  const handleFinalizeReport = (report: GeneratedReport) => {
    updateReportMutation.mutate({
      id: report.id,
      data: {
        status: "final",
        finalizedAt: new Date().toISOString(),
      },
    });
  };

  const handleCancel = () => {
    setIsCreateDialogOpen(false);
    createForm.reset({
      templateId: 0,
      title: "",
      language: "en",
      sections: {},
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "coming_soon":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      case "final":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFrameworkColor = (type: string) => {
    switch (type) {
      case "esrs":
        return "bg-green-100 text-green-800";
      case "gri":
        return "bg-blue-100 text-blue-800";
      case "sasb":
        return "bg-purple-100 text-purple-800";
      case "tcfd":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (templatesLoading || reportsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-600">
              Generate and manage sustainability reports
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <div
                title={
                  selectedClient === 0 && user?.role == "consultant"
                    ? "Select a client organization first"
                    : ""
                }
                onClick={
                  selectedClient === "none" && user?.role == "consultant"
                    ? (e) => e.preventDefault()
                    : undefined
                }
                style={{
                  cursor:
                    selectedClient === 0 && user?.role == "consultant"
                      ? "not-allowed"
                      : undefined,
                }}
              >
                <Button
                  disabled={
                    selectedClient === "none" && user?.role == "consultant"
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Report
                </Button>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateReport)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates
                              .filter((t) => t.status === "available")
                              .map((template) => (
                                <SelectItem
                                  key={template.id}
                                  value={template.id.toString()}
                                >
                                  {template.name} - {template.framework}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Title *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter report title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createReportMutation.isPending}
                    >
                      {createReportMutation.isPending
                        ? "Creating..."
                        : "Create Report"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Client Selection for Consultants */}
        {user?.role === "consultant" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Building className="h-6 w-6 text-[var(--ca-green-normal)]" />
                  <div>
                    <h3 className="font-medium text-[var(--ca-grey-darker)]">
                      Select Client Organization
                    </h3>
                    <p className="text-sm text-[var(--ca-grey-dark)]">
                      Choose which client organization to manage
                    </p>
                  </div>
                </div>
                <div className="w-80">
                  <Select
                    value={selectedClient}
                    onValueChange={(value) => setSelectedClient(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem disabled value="none">
                        Select Client
                      </SelectItem>
                      {clientOrganizations?.map((client: any) => (
                        <SelectItem
                          key={client.organizationId}
                          value={client.organizationId.toString()}
                        >
                          {client.organizationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="generated">Generated Reports</TabsTrigger>
            <TabsTrigger value="editor" disabled={!currentReport || reports.length === 0}>
              Report Editor
            </TabsTrigger>
            <TabsTrigger value="viewer" disabled={!currentReportViewer || reports.length === 0}>
              Report Viewer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reports.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Draft Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reports.filter((r) => r.status === "draft").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Final Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reports.filter((r) => r.status === "final").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Available Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.filter((t) => t.status === "available").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports created yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Create your first report to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{report.title}</p>
                            <p className="text-sm text-gray-500">
                              Last modified:{" "}
                              {format(
                                new Date(report.lastModified),
                                "MMM d, yyyy HH:mm"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentReportViewer(report);
                              setActiveTab("viewer");
                            }}
                            title="View Report"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentReport(report);
                              setActiveTab("editor");
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {template.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {template.framework}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getFrameworkColor(template.type)}>
                          {template.type.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(template.status)}>
                          {template.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      {template.description}
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Sections ({template.sections?.length || 0}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.sections
                          ?.slice(0, 3)
                          .map((section: any, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {section.title}
                            </Badge>
                          ))}
                        {template.sections?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.sections.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                        disabled={template.status === "coming_soon"}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (template.status === "available") {
                            createForm.setValue("templateId", template.id);
                            createForm.setValue(
                              "title",
                              `${template.name} - ${format(
                                new Date(),
                                "yyyy-MM-dd"
                              )}`
                            );
                            setIsCreateDialogOpen(true);
                          }
                        }}
                        disabled={template.status === "coming_soon"}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="generated" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports generated yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Create your first report to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <div>
                            <h3 className="font-medium">{report.title}</h3>
                            <p className="text-sm text-gray-500">
                              Created:{" "}
                              {format(
                                new Date(report.createdAt),
                                "MMM d, yyyy HH:mm"
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              Last modified:{" "}
                              {format(
                                new Date(report.lastModified),
                                "MMM d, yyyy HH:mm"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentReportViewer(report);
                                setActiveTab("viewer");
                              }}
                              title="View Report"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentReport(report);
                                setActiveTab("editor");
                              }}
                              title="Open Editor"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {report.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFinalizeReport(report)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="space-y-6">
            {currentReport ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {currentReport.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Last modified:{" "}
                      {format(
                        new Date(currentReport.lastModified),
                        "MMM d, yyyy HH:mm"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(currentReport.status)}>
                      {currentReport.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Force data population for debugging
                        if (companyProfile && currentReport) {
                          console.log("Force populating data:", {
                            companyProfile,
                            governanceData,
                            materialityTopics,
                          });

                          const subsidiariesText =
                            companyProfile.subsidiaries
                              ?.map(
                                (sub: any) =>
                                  `${sub.name} (${sub.country}) - ${sub.ownershipPercentage}%`
                              )
                              .join(", ") || "";

                          const reportingPeriod = companyProfile.fiscalYearEnd
                            ? `1 January ${
                                new Date(
                                  companyProfile.fiscalYearEnd
                                ).getFullYear() - 1
                              } - ${format(
                                new Date(companyProfile.fiscalYearEnd),
                                "dd MMMM yyyy"
                              )}`
                            : "";

                          const keyProductsText =
                            companyProfile.keyProducts?.join(", ") || "";
                          const primaryMarketsText =
                            companyProfile.primaryMarkets?.join(", ") || "";
                          const netZeroTargetText =
                            companyProfile.netZeroTarget?.toString() || "";

                          const governanceRolesText =
                            governanceData?.committeeResponsibilities?.join(
                              ", "
                            ) || "";
                          const boardOversightText =
                            governanceData?.boardOversightMechanism || "";

                          const assessedTopicsList =
                            materialityTopics
                              ?.map(
                                (topic: any) =>
                                  `${topic.topic} (${
                                    topic.subcategory || topic.category
                                  })`
                              )
                              .join(", ") || "";

                          const materialTopicsTable =
                            materialityTopics
                              ?.filter((topic: any) => topic.isMaterial)
                              .map(
                                (topic: any) =>
                                  `${topic.topic}: Material Index ${
                                    topic.materialityIndex
                                  }, Stakeholders: ${
                                    topic.impactedStakeholders?.join(", ") ||
                                    "N/A"
                                  }`
                              )
                              .join("\n") || "";

                          // Risk Management data
                          const sustainabilityRisks =
                            riskRegister
                              ?.filter((item: any) => item.iroType === "Risk")
                              .map((risk: any) => {
                                const riskDetails = [];
                                riskDetails.push(`Title: ${risk.iroTitle}`);
                                riskDetails.push(
                                  `Description: ${risk.iroDescription || "N/A"}`
                                );
                                riskDetails.push(
                                  `Category: ${risk.category || "N/A"}`
                                );
                                riskDetails.push(
                                  `Likelihood: ${risk.likelihood || "N/A"}/5`
                                );
                                riskDetails.push(
                                  `Impact/Severity: ${
                                    risk.severityMagnitude || "N/A"
                                  }/5`
                                );
                                riskDetails.push(
                                  `Time Horizon: ${risk.timeHorizon || "N/A"}`
                                );
                                riskDetails.push(
                                  `Affected Stakeholders: ${
                                    risk.affectedStakeholders?.join(", ") ||
                                    "N/A"
                                  }`
                                );
                                riskDetails.push(
                                  `Value Chain Location: ${
                                    risk.valueChainLocation || "N/A"
                                  }`
                                );
                                riskDetails.push(
                                  `Financial Materiality: ${
                                    risk.financialMateriality ? "Yes" : "No"
                                  }`
                                );
                                riskDetails.push(
                                  `Impact Materiality: ${
                                    risk.impactMateriality ? "Yes" : "No"
                                  }`
                                );
                                return riskDetails.join(" | ");
                              })
                              .join("\n\n") || "";

                          const sustainabilityOpportunities =
                            riskRegister
                              ?.filter(
                                (item: any) => item.iroType === "Opportunity"
                              )
                              .map(
                                (opp: any) =>
                                  `${opp.iroTitle}: ${
                                    opp.iroDescription
                                  } (Value Chain: ${
                                    opp.valueChainLocation || "N/A"
                                  })`
                              )
                              .join("\n") || "";

                          const valueChainMapping =
                            riskRegister
                              ?.map(
                                (item: any) =>
                                  `${item.iroTitle}: Affects ${
                                    item.affectedStakeholders?.join(", ") ||
                                    "N/A"
                                  } - Location: ${
                                    item.valueChainLocation || "N/A"
                                  }`
                              )
                              .join("\n") || "";

                          console.log(
                            "Manual Auto-fill Due Diligence Process Data:",
                            dueDiligenceProcess
                          );

                          const dueDiligenceFrameworks =
                            dueDiligenceProcess?.frameworks?.join(", ") || "";
                          const scopeDescription =
                            dueDiligenceProcess?.scopeDescription || "";
                          const governanceOversight =
                            dueDiligenceProcess?.governanceOversight || "";

                          const remediationMechanisms =
                            actionPlans
                              ?.map(
                                (plan: any) =>
                                  `${plan.responseType}: ${
                                    plan.responseDescription
                                  } (Target: ${
                                    plan.targetOutcome || "N/A"
                                  }, Responsible: ${
                                    plan.responsibleDepartment || "N/A"
                                  })`
                              )
                              .join("\n") || "";

                          // ESG Data KPIs organized by topic for Policies, Actions, Targets & KPIs section
                          const esgDataByTopic =
                            esgDataKpis?.reduce((acc: any, kpi: any) => {
                              const topicKey = `${kpi.esrsTopic} - ${kpi.topicTitle}`;
                              if (!acc[topicKey]) {
                                acc[topicKey] = [];
                              }
                              acc[topicKey].push(kpi);
                              return acc;
                            }, {}) || {};

                          const policiesActionsTargetsKpis =
                            Object.entries(esgDataByTopic)
                              .map(([topic, kpis]: [string, any]) => {
                                const kpiList = kpis
                                  .map((kpi: any) => {
                                    const kpiDetails = [];
                                    kpiDetails.push(`KPI: ${kpi.kpiName}`);
                                    kpiDetails.push(`Type: ${kpi.metricType}`);
                                    kpiDetails.push(
                                      `Unit: ${kpi.unitOfMeasure}`
                                    );
                                    kpiDetails.push(
                                      `Current Value: ${
                                        kpi.currentValue || "N/A"
                                      }`
                                    );
                                    kpiDetails.push(
                                      `Baseline Year: ${
                                        kpi.baselineYear || "N/A"
                                      }`
                                    );
                                    kpiDetails.push(
                                      `Data Owner: ${kpi.dataOwner}`
                                    );
                                    kpiDetails.push(
                                      `Collection Frequency: ${kpi.collectionFrequency}`
                                    );
                                    kpiDetails.push(
                                      `Collection Method: ${kpi.collectionMethod}`
                                    );
                                    kpiDetails.push(
                                      `Assurance Level: ${kpi.assuranceLevel}`
                                    );
                                    kpiDetails.push(
                                      `Verification Status: ${kpi.verificationStatus}`
                                    );
                                    kpiDetails.push(
                                      `Reference Standards: ${
                                        kpi.referenceStandard?.join(", ") ||
                                        "N/A"
                                      }`
                                    );
                                    kpiDetails.push(
                                      `Reporting Period: ${
                                        kpi.reportingPeriod || "N/A"
                                      }`
                                    );
                                    kpiDetails.push(
                                      `Completion Status: ${kpi.completionStatus}`
                                    );
                                    if (kpi.notes)
                                      kpiDetails.push(`Notes: ${kpi.notes}`);
                                    return kpiDetails.join(" | ");
                                  })
                                  .join("\n\n");
                                return `${topic}:\n${kpiList}`;
                              })
                              .join("\n\n\n") || "";

                          const updatedSections = {
                            ...currentReport.sections,
                            general_info: {
                              entityLegalName: companyProfile.legalName || "",
                              legalForm: companyProfile.legalForm || "",
                              countryOfRegistration:
                                companyProfile.country || "",
                              naceSector: companyProfile.naceSectorCode || "",
                              consolidationScope: subsidiariesText,
                              registeredHQ: companyProfile.registeredHQ || "",
                              reportingPeriod: reportingPeriod,
                            },
                            governance_strategy: {
                              businessModelOverview:
                                companyProfile.supplyChainDescription || "",
                              keyProducts: keyProductsText,
                              primaryMarkets: primaryMarketsText,
                              esgStrategyOverview:
                                companyProfile.sustainabilityPolicies || "",
                              transitionPlan:
                                companyProfile.transitionUpdates || "",
                              netZeroTarget: netZeroTargetText,
                              circularEconomyInitiatives:
                                companyProfile.circularEconomyInitiatives || "",
                              governanceRoles: governanceRolesText,
                              boardOversight: boardOversightText,
                            },
                            materiality_assessment: {
                              materialityAssessmentMethodology: "",
                              listOfAssessedTopics: assessedTopicsList,
                              stakeholderInputInAssessment: "",
                              finalMaterialTopicsTable: materialTopicsTable,
                            },
                            impacts_risks: {
                              sustainabilityRisks: sustainabilityRisks,
                              sustainabilityOpportunities:
                                sustainabilityOpportunities,
                              valueChainMapping: valueChainMapping,
                              dueDiligenceFrameworks: dueDiligenceFrameworks,
                              scopeDescription: scopeDescription,
                              governanceOversight: governanceOversight,
                              remediationMechanisms: remediationMechanisms,
                            },
                            policies_actions_targets_kpis: {
                              esgDataByTopic: policiesActionsTargetsKpis,
                            },
                          };

                          setCurrentReport({
                            ...currentReport,
                            sections: updatedSections,
                          });
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Auto-fill Data
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentReport(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Close Editor
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>ESRS Report Editor</CardTitle>
                    <p className="text-sm text-gray-600">
                      Edit each section of your ESRS sustainability report
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Table of Contents */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Table of Contents</h3>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-700">
                            <div className="flex justify-between border-b pb-1">
                              <span>1. General Information</span>
                              <span>Page 3</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>
                                2. Governance, Strategy & Business Model
                              </span>
                              <span>Page 8</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>3. Materiality Assessment</span>
                              <span>Page 15</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>4. Impacts, Risks, and Opportunities</span>
                              <span>Page 22</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>5. Policies, Actions, Targets & KPIs</span>
                              <span>Page 30</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>6. EU Taxonomy Alignment</span>
                              <span>Page 45</span>
                            </div>
                            <div className="flex justify-between">
                              <span>7. Appendix</span>
                              <span>Page 52</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 1: General Information */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">
                            1. General Information
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (currentReport) {
                                updateReportMutation.mutate({
                                  id: currentReport.id,
                                  data: { sections: currentReport.sections },
                                });
                              }
                            }}
                            disabled={updateReportMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Entity Legal Name
                              </label>
                              <Input
                                placeholder="Enter legal entity name"
                                value={
                                  currentReport?.sections?.general_info
                                    ?.entityLegalName || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        general_info: {
                                          ...currentReport.sections
                                            ?.general_info,
                                          entityLegalName: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Entity Scope &
                                Reporting → Legal Name
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Legal Form
                              </label>
                              <Input
                                placeholder="e.g., Public Limited Company"
                                value={
                                  currentReport?.sections?.general_info
                                    ?.legalForm || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        general_info: {
                                          ...currentReport.sections
                                            ?.general_info,
                                          legalForm: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Entity Scope &
                                Reporting → Legal Form
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Country of Registration
                              </label>
                              <Input
                                placeholder="e.g., Germany"
                                value={
                                  currentReport?.sections?.general_info
                                    ?.countryOfRegistration || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        general_info: {
                                          ...currentReport.sections
                                            ?.general_info,
                                          countryOfRegistration: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Entity Scope &
                                Reporting → Country
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                NACE Sector
                              </label>
                              <Input
                                placeholder="e.g., 62.01 - Computer programming activities"
                                value={
                                  currentReport?.sections?.general_info
                                    ?.naceSector || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        general_info: {
                                          ...currentReport.sections
                                            ?.general_info,
                                          naceSector: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Industry and Taxonomy
                                Classification → NACE Sector Code
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Consolidation Scope
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="List subsidiaries and entities included in consolidation scope..."
                              value={
                                currentReport?.sections?.general_info
                                  ?.consolidationScope || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      general_info: {
                                        ...currentReport.sections?.general_info,
                                        consolidationScope: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Company Profile → Entity Scope & Reporting
                              → Subsidiary List
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Registered HQ
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={2}
                              placeholder="Enter registered headquarters address..."
                              value={
                                currentReport?.sections?.general_info
                                  ?.registeredHQ || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      general_info: {
                                        ...currentReport.sections?.general_info,
                                        registeredHQ: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Company Profile → Geography and Locations
                              → HQ Address
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Reporting Period
                            </label>
                            <Input
                              placeholder="e.g., 1 January 2024 - 31 December 2024"
                              value={
                                currentReport?.sections?.general_info
                                  ?.reportingPeriod || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      general_info: {
                                        ...currentReport.sections?.general_info,
                                        reportingPeriod: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Company Profile → Fiscal Year-End
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Governance, Strategy & Business Model */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">
                            2. Governance, Strategy & Business Model
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (currentReport) {
                                updateReportMutation.mutate({
                                  id: currentReport.id,
                                  data: { sections: currentReport.sections },
                                });
                              }
                            }}
                            disabled={updateReportMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">
                              Overview of Business Model
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Describe your business model, value proposition, and key activities..."
                              value={
                                currentReport?.sections?.governance_strategy
                                  ?.businessModelOverview || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      governance_strategy: {
                                        ...currentReport.sections
                                          ?.governance_strategy,
                                        businessModelOverview: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Key Products/Services
                              </label>
                              <textarea
                                className="w-full mt-1 p-2 border rounded-md"
                                rows={3}
                                placeholder="List key products and services..."
                                value={
                                  currentReport?.sections?.governance_strategy
                                    ?.keyProducts || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        governance_strategy: {
                                          ...currentReport.sections
                                            ?.governance_strategy,
                                          keyProducts: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Business Model
                                Description → Key Products
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Primary Markets
                              </label>
                              <textarea
                                className="w-full mt-1 p-2 border rounded-md"
                                rows={3}
                                placeholder="List primary markets and regions..."
                                value={
                                  currentReport?.sections?.governance_strategy
                                    ?.primaryMarkets || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        governance_strategy: {
                                          ...currentReport.sections
                                            ?.governance_strategy,
                                          primaryMarkets: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Business Model
                                Description → Primary Markets
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              ESG Strategy Overview
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Describe your ESG strategy and integration approach..."
                              value={
                                currentReport?.sections?.governance_strategy
                                  ?.esgStrategyOverview || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      governance_strategy: {
                                        ...currentReport.sections
                                          ?.governance_strategy,
                                        esgStrategyOverview: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Business Strategy and Initiatives →
                              Sustainability Policies Overview
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Transition Plan
                              </label>
                              <textarea
                                className="w-full mt-1 p-2 border rounded-md"
                                rows={3}
                                placeholder="Describe your sustainability transition plan..."
                                value={
                                  currentReport?.sections?.governance_strategy
                                    ?.transitionPlan || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        governance_strategy: {
                                          ...currentReport.sections
                                            ?.governance_strategy,
                                          transitionPlan: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Business Strategy and Initiatives →
                                Sustainability Transition Plan
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Net-Zero Target
                              </label>
                              <Input
                                placeholder="e.g., 2030"
                                value={
                                  currentReport?.sections?.governance_strategy
                                    ?.netZeroTarget || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        governance_strategy: {
                                          ...currentReport.sections
                                            ?.governance_strategy,
                                          netZeroTarget: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Business Strategy and Initiatives →
                                Net-Zero Target
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Circular Economy Initiatives
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Describe your circular economy and product stewardship initiatives..."
                              value={
                                currentReport?.sections?.governance_strategy
                                  ?.circularEconomyInitiatives || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      governance_strategy: {
                                        ...currentReport.sections
                                          ?.governance_strategy,
                                        circularEconomyInitiatives:
                                          e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Business Strategy and Initiatives →
                              Product Stewardship Section
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Governance Roles for ESG
                              </label>
                              <textarea
                                className="w-full mt-1 p-2 border rounded-md"
                                rows={3}
                                placeholder="Describe governance roles and committee responsibilities for ESG..."
                                value={
                                  currentReport?.sections?.governance_strategy
                                    ?.governanceRoles || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        governance_strategy: {
                                          ...currentReport.sections
                                            ?.governance_strategy,
                                          governanceRoles: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Governance & Policies → Committee Roles
                                and Committee Responsibilities
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Board Oversight of Sustainability
                              </label>
                              <textarea
                                className="w-full mt-1 p-2 border rounded-md"
                                rows={3}
                                placeholder="Describe board oversight mechanisms for sustainability..."
                                value={
                                  currentReport?.sections?.governance_strategy
                                    ?.boardOversight || ""
                                }
                                onChange={(e) => {
                                  if (currentReport) {
                                    setCurrentReport({
                                      ...currentReport,
                                      sections: {
                                        ...currentReport.sections,
                                        governance_strategy: {
                                          ...currentReport.sections
                                            ?.governance_strategy,
                                          boardOversight: e.target.value,
                                        },
                                      },
                                    });
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Governance & Policies → Board Oversight
                                of ESG
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Materiality Assessment */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">
                            3. Materiality Assessment
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (currentReport) {
                                updateReportMutation.mutate({
                                  id: currentReport.id,
                                  data: { sections: currentReport.sections },
                                });
                              }
                            }}
                            disabled={updateReportMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">
                              Materiality Assessment Methodology
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Describe your materiality assessment process and methodology..."
                              value={
                                currentReport?.sections?.materiality_assessment
                                  ?.materialityAssessmentMethodology || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      materiality_assessment: {
                                        ...currentReport.sections
                                          ?.materiality_assessment,
                                        materialityAssessmentMethodology:
                                          e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Manual text field
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              List of Assessed Topics
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={4}
                              placeholder="List of all topics assessed during materiality assessment..."
                              value={
                                currentReport?.sections?.materiality_assessment
                                  ?.listOfAssessedTopics || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      materiality_assessment: {
                                        ...currentReport.sections
                                          ?.materiality_assessment,
                                        listOfAssessedTopics: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Material Topics → Topic Identification
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Stakeholder Input in Assessment
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Describe stakeholder engagement in materiality assessment..."
                              value={
                                currentReport?.sections?.materiality_assessment
                                  ?.stakeholderInputInAssessment || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      materiality_assessment: {
                                        ...currentReport.sections
                                          ?.materiality_assessment,
                                        stakeholderInputInAssessment:
                                          e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Manual text field
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Double Materiality Matrix
                            </label>
                            <div className="mt-1 p-4 border rounded-md bg-gray-50">
                              {materialityTopics &&
                              materialityTopics.length > 0 ? (
                                <div className="flex flex-col items-center">
                                  <div className="mb-4">
                                    <svg
                                      width="320"
                                      height="320"
                                      className="border rounded-lg bg-white"
                                    >
                                      {/* Grid lines */}
                                      {[1, 2, 3, 4, 5].map((i) => (
                                        <g key={i}>
                                          {/* Vertical lines */}
                                          <line
                                            x1={(i / 5) * 240 + 40}
                                            y1={40}
                                            x2={(i / 5) * 240 + 40}
                                            y2={280}
                                            stroke="#e5e7eb"
                                            strokeWidth={1}
                                          />
                                          {/* Horizontal lines */}
                                          <line
                                            x1={40}
                                            y1={(i / 5) * 240 + 40}
                                            x2={280}
                                            y2={(i / 5) * 240 + 40}
                                            stroke="#e5e7eb"
                                            strokeWidth={1}
                                          />
                                        </g>
                                      ))}

                                      {/* Threshold lines */}
                                      <line
                                        x1={(3 / 5) * 240 + 40}
                                        y1={40}
                                        x2={(3 / 5) * 240 + 40}
                                        y2={280}
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        strokeDasharray="5,5"
                                      />
                                      <line
                                        x1={40}
                                        y1={240 - (3 / 5) * 240 + 40}
                                        x2={280}
                                        y2={240 - (3 / 5) * 240 + 40}
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        strokeDasharray="5,5"
                                      />

                                      {/* Axis labels */}
                                      <text
                                        x={160}
                                        y={310}
                                        textAnchor="middle"
                                        className="text-sm font-medium"
                                        fill="#374151"
                                      >
                                        Financial Materiality
                                      </text>
                                      <text
                                        x={15}
                                        y={160}
                                        textAnchor="middle"
                                        className="text-sm font-medium"
                                        fill="#374151"
                                        transform="rotate(-90, 15, 160)"
                                      >
                                        Impact Materiality
                                      </text>

                                      {/* Scale labels */}
                                      {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <g key={i}>
                                          <text
                                            x={(i / 5) * 240 + 40}
                                            y={300}
                                            textAnchor="middle"
                                            className="text-xs"
                                            fill="#6b7280"
                                          >
                                            {i}
                                          </text>
                                          <text
                                            x={25}
                                            y={240 - (i / 5) * 240 + 40 + 4}
                                            textAnchor="middle"
                                            className="text-xs"
                                            fill="#6b7280"
                                          >
                                            {i}
                                          </text>
                                        </g>
                                      ))}

                                      {/* Data points */}
                                      {materialityTopics
                                        .filter(
                                          (topic: any) =>
                                            topic.financialImpactScore !==
                                              null &&
                                            topic.impactOnStakeholders !== null
                                        )
                                        .map((topic: any, index: number) => {
                                          const x =
                                            (topic.financialImpactScore / 5) *
                                              240 +
                                            40;
                                          const y =
                                            240 -
                                            (topic.impactOnStakeholders / 5) *
                                              240 +
                                            40;

                                          const getCategoryColor = (
                                            category: string
                                          ) => {
                                            switch (category) {
                                              case "environmental":
                                                return "#10b981";
                                              case "social":
                                                return "#3b82f6";
                                              case "governance":
                                                return "#8b5cf6";
                                              default:
                                                return "#6b7280";
                                            }
                                          };

                                          const getStakeholderSize = (
                                            level: string
                                          ) => {
                                            switch (level) {
                                              case "high":
                                                return 12;
                                              case "medium":
                                                return 8;
                                              case "low":
                                                return 6;
                                              default:
                                                return 8;
                                            }
                                          };

                                          return (
                                            <circle
                                              key={topic.id}
                                              cx={x}
                                              cy={y}
                                              r={getStakeholderSize(
                                                topic.stakeholderConcernLevel
                                              )}
                                              fill={getCategoryColor(
                                                topic.category
                                              )}
                                              opacity={0.7}
                                              stroke={
                                                topic.isMaterial
                                                  ? "#ef4444"
                                                  : "#6b7280"
                                              }
                                              strokeWidth={
                                                topic.isMaterial ? 2 : 1
                                              }
                                            />
                                          );
                                        })}
                                    </svg>
                                  </div>

                                  {/* Legend */}
                                  <div className="flex justify-center space-x-8 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <span>Environmental</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                      <span>Social</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                      <span>Governance</span>
                                    </div>
                                  </div>

                                  <div className="mt-2 text-xs text-gray-500 text-center">
                                    {
                                      materialityTopics.filter(
                                        (t: any) => t.isMaterial
                                      ).length
                                    }{" "}
                                    material topics identified
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 py-8">
                                  <p>
                                    No materiality assessment data available.
                                  </p>
                                  <p className="text-xs mt-1">
                                    Complete the Material Topics module to
                                    display the matrix.
                                  </p>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Material Topics → Materiality Matrix
                              Visualization
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Final Material Topics Table
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={5}
                              placeholder="Table of final material topics with scoring and stakeholder impact..."
                              value={
                                currentReport?.sections?.materiality_assessment
                                  ?.finalMaterialTopicsTable || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      materiality_assessment: {
                                        ...currentReport.sections
                                          ?.materiality_assessment,
                                        finalMaterialTopicsTable:
                                          e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Material Topics → Material Topics Report
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Impacts, Risks, and Opportunities */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">
                            4. Impacts, Risks, and Opportunities
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (currentReport && updateReportMutation) {
                                updateReportMutation.mutate({
                                  id: currentReport.id,
                                  data: { sections: currentReport.sections },
                                });
                              }
                            }}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">
                              List of Sustainability Risks
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={8}
                              placeholder="Comprehensive list of sustainability risks from Risk Register including title, description, category, likelihood, impact severity, time horizon, affected stakeholders, value chain location, and materiality assessment..."
                              value={
                                currentReport?.sections?.impacts_risks
                                  ?.sustainabilityRisks || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      impacts_risks: {
                                        ...currentReport.sections
                                          ?.impacts_risks,
                                        sustainabilityRisks: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Risk Management → Risk Register (All
                              fields including title, description, category,
                              likelihood/5, impact severity/5, time horizon,
                              affected stakeholders, value chain location,
                              financial materiality, impact materiality)
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              List of Sustainability Opportunities
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={4}
                              placeholder="List sustainability opportunities from Opportunity Register..."
                              value={
                                currentReport?.sections?.impacts_risks
                                  ?.sustainabilityOpportunities || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      impacts_risks: {
                                        ...currentReport.sections
                                          ?.impacts_risks,
                                        sustainabilityOpportunities:
                                          e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Risk Management → Opportunity Register
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Value Chain Mapping
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Map value chain impacts and affected stakeholders..."
                              value={
                                currentReport?.sections?.impacts_risks
                                  ?.valueChainMapping || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      impacts_risks: {
                                        ...currentReport.sections
                                          ?.impacts_risks,
                                        valueChainMapping: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Risk Management → Affected Stakeholders
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Due Diligence Frameworks
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={2}
                              placeholder="List of due diligence frameworks (UNGPs, OECD Guidelines, ISO 26000, etc.)..."
                              value={
                                currentReport?.sections?.impacts_risks
                                  ?.dueDiligenceFrameworks || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      impacts_risks: {
                                        ...currentReport.sections
                                          ?.impacts_risks,
                                        dueDiligenceFrameworks: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Risk Management → Due Diligence Process →
                              Frameworks
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Scope Description
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Description of due diligence scope and coverage..."
                              value={
                                currentReport?.sections?.impacts_risks
                                  ?.scopeDescription || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      impacts_risks: {
                                        ...currentReport.sections
                                          ?.impacts_risks,
                                        scopeDescription: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Risk Management → Due Diligence Process →
                              Scope Description
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Governance Oversight
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={2}
                              placeholder="Governance oversight and responsible parties..."
                              value={
                                currentReport?.sections?.impacts_risks
                                  ?.governanceOversight || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      impacts_risks: {
                                        ...currentReport.sections
                                          ?.impacts_risks,
                                        governanceOversight: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Risk Management → Due Diligence Process →
                              Governance Oversight
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Remediation Mechanisms
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Describe remediation mechanisms and action plans..."
                              value={
                                currentReport?.sections?.impacts_risks
                                  ?.remediationMechanisms || ""
                              }
                              onChange={(e) => {
                                if (currentReport) {
                                  setCurrentReport({
                                    ...currentReport,
                                    sections: {
                                      ...currentReport.sections,
                                      impacts_risks: {
                                        ...currentReport.sections
                                          ?.impacts_risks,
                                        remediationMechanisms: e.target.value,
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Risk Management → Action Plans
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Policies, Actions, Targets & KPIs */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">
                            5. Policies, Actions, Targets & KPIs
                          </h3>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-3 block">
                              ESG Data by Topic (ESRS 2, E1–E5, S1–S4, G1)
                            </label>
                            <p className="text-xs text-gray-500 mb-4">
                              Source: Data Collection → ESG KPIs (All fields:
                              KPI name, type, unit, current value, baseline
                              year, data owner, collection frequency, collection
                              method, assurance level, verification status,
                              reference standards, reporting period, completion
                              status, notes)
                            </p>

                            {/* KPI Cards Display */}
                            <div className="space-y-6">
                              {esgDataKpis && esgDataKpis.length > 0 ? (
                                Object.entries(
                                  esgDataKpis.reduce((acc: any, kpi: any) => {
                                    const topicKey = `${kpi.esrsTopic} - ${kpi.topicTitle}`;
                                    if (!acc[topicKey]) {
                                      acc[topicKey] = [];
                                    }
                                    acc[topicKey].push(kpi);
                                    return acc;
                                  }, {})
                                ).map(([topic, kpis]: [string, any]) => (
                                  <div
                                    key={topic}
                                    className="border rounded-lg p-4 bg-gray-50"
                                  >
                                    <h4 className="font-medium text-lg mb-3 text-gray-800">
                                      {topic}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {kpis.map((kpi: any) => (
                                        <div
                                          key={kpi.id}
                                          className="bg-white border rounded-lg p-3 shadow-sm"
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <h5 className="font-medium text-sm text-gray-900">
                                              {kpi.kpiName}
                                            </h5>
                                            <span
                                              className={`px-2 py-1 text-xs rounded-full ${
                                                kpi.completionStatus ===
                                                "complete"
                                                  ? "bg-green-100 text-green-800"
                                                  : kpi.completionStatus ===
                                                    "partial"
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                              {kpi.completionStatus}
                                            </span>
                                          </div>
                                          <div className="space-y-1 text-xs text-gray-600">
                                            <div className="flex justify-between">
                                              <span>Type:</span>
                                              <span className="font-medium">
                                                {kpi.metricType}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Unit:</span>
                                              <span className="font-medium">
                                                {kpi.unitOfMeasure}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Current Value:</span>
                                              <span className="font-medium">
                                                {kpi.currentValue || "N/A"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Baseline Year:</span>
                                              <span className="font-medium">
                                                {kpi.baselineYear || "N/A"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Data Owner:</span>
                                              <span className="font-medium">
                                                {kpi.dataOwner}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Collection Frequency:</span>
                                              <span className="font-medium">
                                                {kpi.collectionFrequency}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Assurance Level:</span>
                                              <span className="font-medium">
                                                {kpi.assuranceLevel}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Verification Status:</span>
                                              <span className="font-medium">
                                                {kpi.verificationStatus}
                                              </span>
                                            </div>
                                            {kpi.referenceStandard &&
                                              kpi.referenceStandard.length >
                                                0 && (
                                                <div className="mt-2">
                                                  <span className="text-gray-500">
                                                    Reference Standards:
                                                  </span>
                                                  <div className="flex flex-wrap gap-1 mt-1">
                                                    {kpi.referenceStandard.map(
                                                      (
                                                        standard: string,
                                                        idx: number
                                                      ) => (
                                                        <span
                                                          key={idx}
                                                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                                        >
                                                          {standard}
                                                        </span>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            {kpi.reportingPeriod && (
                                              <div className="flex justify-between mt-1">
                                                <span>Reporting Period:</span>
                                                <span className="font-medium">
                                                  {kpi.reportingPeriod}
                                                </span>
                                              </div>
                                            )}
                                            {kpi.notes && (
                                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                                <span className="font-medium">
                                                  Notes:
                                                </span>{" "}
                                                {kpi.notes}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <p>No ESG data KPIs found</p>
                                  <p className="text-sm mt-1">
                                    Add KPIs in the Data Collection module to
                                    see them here
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 6: EU Taxonomy Alignment - COMMENTED OUT FOR NOW */}
                      {/*
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">6. EU Taxonomy Alignment</h3>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-sm font-medium">Taxonomy Eligible Activities</label>
                            <textarea 
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Describe EU Taxonomy eligible activities..."
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Taxonomy Aligned Activities</label>
                            <textarea 
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Describe EU Taxonomy aligned activities..."
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium">Turnover Alignment (%)</label>
                              <Input placeholder="%" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">CapEx Alignment (%)</label>
                              <Input placeholder="%" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">OpEx Alignment (%)</label>
                              <Input placeholder="%" />
                            </div>
                          </div>
                        </div>
                      </div>
                      */}

                      {/* Section 6: Appendix */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">6. Appendix</h3>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-sm font-medium">
                              Methodology Details
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Provide detailed methodology and calculation approaches..."
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Additional Data Tables
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={3}
                              placeholder="Include additional data tables and supporting information..."
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Assurance Statement
                            </label>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-md"
                              rows={2}
                              placeholder="Include third-party assurance statement..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4">
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            updateReportMutation.mutate({
                              id: currentReport.id,
                              data: {
                                sections: currentReport.sections,
                                status: "draft",
                              },
                            });
                          }}
                          disabled={updateReportMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateReportMutation.isPending
                            ? "Saving..."
                            : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No report selected</p>
                <p className="text-sm text-gray-400 mt-1">
                  Select a report from the Generated Reports tab to start
                  editing
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="viewer" className="space-y-6">
            {currentReportViewer ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {currentReportViewer.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Last modified:{" "}
                      {format(
                        new Date(currentReportViewer.lastModified),
                        "MMM d, yyyy HH:mm"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={getStatusColor(currentReportViewer.status)}
                    >
                      {currentReportViewer.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentReportViewer(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Close Viewer
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>ESRS Report Viewer</CardTitle>
                    <p className="text-sm text-gray-600">
                      View each section of your ESRS sustainability report
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Table of Contents */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Table of Contents</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-700">
                            <div className="flex justify-between border-b pb-1">
                              <span>1. General Information</span>
                              <span>Page 3</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>
                                2. Governance, Strategy & Business Model
                              </span>
                              <span>Page 8</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>3. Materiality Assessment</span>
                              <span>Page 15</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>4. Impacts, Risks, and Opportunities</span>
                              <span>Page 22</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>5. Policies, Actions, Targets & KPIs</span>
                              <span>Page 30</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span>6. EU Taxonomy Alignment</span>
                              <span>Page 45</span>
                            </div>
                            <div className="flex justify-between">
                              <span>7. Appendix</span>
                              <span>Page 52</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 1: General Information */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">
                            1. General Information
                          </h3>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Entity Legal Name
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections?.general_info
                                  ?.entityLegalName || "No data"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Entity Scope &
                                Reporting → Legal Name
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Legal Form
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections?.general_info
                                  ?.legalForm || "No data"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Entity Scope &
                                Reporting → Legal Form
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Country of Registration
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections?.general_info
                                  ?.countryOfRegistration || "No data"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Entity Scope &
                                Reporting → Country
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                NACE Sector
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections?.general_info
                                  ?.naceSector || "No data"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Source: Company Profile → Industry and Taxonomy
                                Classification → NACE Sector Code
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Consolidation Scope
                            </label>
                            <p className="text-sm text-gray-700">
                              {currentReportViewer?.sections?.general_info
                                ?.consolidationScope || "No data"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Company Profile → Entity Scope & Reporting
                              → Subsidiary List
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Registered HQ
                            </label>
                            <p className="text-sm text-gray-700">
                              {currentReportViewer?.sections?.general_info
                                ?.registeredHQ || "No data"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Company Profile → Geography and Locations
                              → HQ Address
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Reporting Period
                            </label>
                            <p className="text-sm text-gray-700">
                              {currentReportViewer?.sections?.general_info
                                ?.reportingPeriod || "No data"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Source: Company Profile → Fiscal Year-End
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Governance, Strategy & Business Model */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">
                            2. Governance, Strategy & Business Model
                          </h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">
                              Overview of Business Model
                            </label>
                            <p className="text-sm text-gray-700">
                              {currentReportViewer?.sections
                                ?.governance_strategy?.businessModelOverview ||
                                "No data"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Key Products/Services
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections
                                  ?.governance_strategy?.keyProducts ||
                                  "No data"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Primary Markets
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections
                                  ?.governance_strategy?.primaryMarkets ||
                                  "No data"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              ESG Strategy Overview
                            </label>
                            <p className="text-sm text-gray-700">
                              {currentReportViewer?.sections
                                ?.governance_strategy?.esgStrategyOverview ||
                                "No data"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Transition Plan
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections
                                  ?.governance_strategy?.transitionPlan ||
                                  "No data"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Net-Zero Target
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections
                                  ?.governance_strategy?.netZeroTarget ||
                                  "No data"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Circular Economy Initiatives
                            </label>
                            <p className="text-sm text-gray-700">
                              {currentReportViewer?.sections
                                ?.governance_strategy
                                ?.circularEconomyInitiatives || "No data"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Governance Roles for ESG
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections
                                  ?.governance_strategy?.governanceRoles ||
                                  "No data"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Board Oversight of Sustainability
                              </label>
                              <p className="text-sm text-gray-700">
                                {currentReportViewer?.sections
                                  ?.governance_strategy?.boardOversight ||
                                  "No data"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* More sections can be added similarly */}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No report selected</p>
                <p className="text-sm text-gray-400 mt-1">
                  Select a report from the Generated Reports tab to start
                  viewing
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Report Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Report: {editingReport?.title}</DialogTitle>
            </DialogHeader>
            {editingReport && (
              <Form {...editForm}>
                <form
                  onSubmit={editForm.handleSubmit(handleUpdateReport)}
                  className="space-y-4"
                >
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateReportMutation.isPending}
                    >
                      {updateReportMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
