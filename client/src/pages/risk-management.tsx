import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  AlertTriangle,
  Target,
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Calendar,
  Building2,
  FileText,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flag,
  Building,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Risk Management Constants
const DUE_DILIGENCE_FRAMEWORKS = [
  "UNGPs",
  "OECD Guidelines",
  "ISO 26000",
  "EU Due Diligence Act",
  "ILO Standards",
  "Custom",
];

const GOVERNANCE_OVERSIGHT = [
  "Sustainability Committee",
  "Legal Department",
  "ESG Officer",
  "Board of Directors",
  "Other",
];

const FREQUENCY_OPTIONS = ["Ongoing", "Annual", "Bi-annual", "Ad-hoc"];

const STAKEHOLDER_GROUPS = [
  "Employees",
  "Suppliers",
  "NGOs",
  "Regulators",
  "Customers",
  "Indigenous Communities",
  "Investors",
];

const IRO_TYPES = ["Actual Impact", "Potential Impact", "Risk", "Opportunity"];

const IRO_CATEGORIES = [
  "E1 Climate",
  "E2 Pollution",
  "E3 Water",
  "E4 Biodiversity",
  "E5 Circular Economy",
  "S1 Workers",
  "S2 Value Chain Workers",
  "S3 Affected Communities",
  "S4 Consumers",
  "G1 Governance",
];

const LIKELIHOOD_SCALE = [
  { value: 1, label: "1 - Rare" },
  { value: 2, label: "2 - Unlikely" },
  { value: 3, label: "3 - Possible" },
  { value: 4, label: "4 - Likely" },
  { value: 5, label: "5 - Almost Certain" },
];

const SEVERITY_SCALE = [
  { value: 1, label: "1 - Negligible" },
  { value: 2, label: "2 - Minor" },
  { value: 3, label: "3 - Moderate" },
  { value: 4, label: "4 - Major" },
  { value: 5, label: "5 - Catastrophic" },
];

const TIME_HORIZONS = ["Short (<1 yr)", "Medium (1-5 yrs)", "Long (>5 yrs)"];

const VALUE_CHAIN_LOCATIONS = [
  "Own Operations",
  "Upstream",
  "Downstream",
  "Entire Chain",
];

const RESPONSE_TYPES = [
  "Avoidance",
  "Mitigation",
  "Remediation",
  "Adaptation",
  "Capitalize (Opportunity)",
  "Monitor Only",
];

const DEPARTMENTS = [
  "Operations",
  "Procurement",
  "Sustainability",
  "HR",
  "Legal",
  "Finance",
  "IT",
  "Marketing",
];

const MONITORING_METHODS = [
  "Site Visit",
  "Internal Audit",
  "ESG Report",
  "External Assurance",
  "Third-party Assessment",
];

const IRO_STATUSES = ["Emerging", "Under Control", "Escalated", "Resolved"];

// Form Schemas


// Due Diligence Schema
export const dueDiligenceSchema = z.object({
  frameworks: z.array(z.string().max(100)).min(1, "At least one framework is required"),
  scopeDescription: z.string().min(1, "Scope description is required").max(1000),
  governanceOversight: z.string().min(1, "Governance oversight is required").max(500),
  processDescription: z.string().min(1, "Process description is required").max(1000),
  frequency: z.string().min(1, "Frequency is required").max(100),
  stakeholderInvolvement: z
    .array(z.string().max(100))
    .min(1, "At least one stakeholder group is required"),
  grievanceMechanismAvailable: z.boolean(),
  grievanceMechanismDescription: z.string().max(1000).optional(),
  supportingDocuments: z.array(z.string().max(255)).optional(),
});

// IRO Register Schema
export const iroRegisterSchema = z.object({
  iroType: z.string().min(1, "IRO type is required").max(100),
  category: z.string().min(1, "Category is required").max(100),
  iroTitle: z.string().min(1, "IRO title is required").max(60),
  iroDescription: z.string().min(1, "IRO description is required").max(2000),
  likelihood: z.number().min(1).max(5),
  severityMagnitude: z.number().min(1).max(5),
  timeHorizon: z.string().min(1, "Time horizon is required").max(100),
  affectedStakeholders: z
    .array(z.string().max(100))
    .min(1, "At least one affected stakeholder is required"),
  valueChainLocation: z.string().min(1, "Value chain location is required").max(100),
  financialMateriality: z.boolean(),
  impactMateriality: z.boolean(),
  linkedStrategyGoal: z.array(z.string().max(100)).optional(),
});

// Action Plan Schema
export const actionPlanSchema = z.object({
  iroId: z.number().min(1, "IRO selection is required"),
  responseType: z.string().min(1, "Response type is required").max(100),
  responseDescription: z.string().min(1, "Response description is required").max(2000),
  targetOutcome: z.string().min(1, "Target outcome is required").max(1000),
  responsibleDepartment: z.string().min(1, "Responsible department is required").max(100),
  startDate: z.string().min(1, "Start date is required").max(20),
  endDate: z.string().max(20).optional(),
  budgetAmount: z.string().min(1, "Budget amount is required").max(20),
  budgetCurrency: z.string().max(10).default("EUR"),
});

// Monitoring Schema
export const monitoringSchema = z.object({
  iroId: z.number().min(1, "IRO selection is required"),
  lastReviewed: z.string().min(1, "Last reviewed date is required").max(50),
  monitoringMethod: z.string().min(1, "Monitoring method is required").max(1000),
  performanceIndicator: z.string().min(1, "Performance indicator is required").max(1000),
  currentStatus: z.string().min(1, "Current status is required").max(500),
  supportingDocuments: z.array(z.string().max(255)).optional(),
});


export default function RiskManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("due-diligence");
  const [selectedClient, setSelectedClient] = useState<string | number>(
    user?.role === "consultant" ? "none" : user?.organizationId
  );
  const [isIroDialogOpen, setIsIroDialogOpen] = useState(false);
  const [isActionPlanDialogOpen, setIsActionPlanDialogOpen] = useState(false);
  const [isMonitoringDialogOpen, setIsMonitoringDialogOpen] = useState(false);
  const [editingIro, setEditingIro] = useState<any>(null);
  const [editingActionPlan, setEditingActionPlan] = useState<any>(null);
  const [editingMonitoring, setEditingMonitoring] = useState<any>(null);

  console.log(selectedClient, "selectedClient in risk management page");

  // Fetch client organizations for consultants
  const { data: clientOrganizations } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user && user.role === "consultant",
  });

  // Queries
  const { data: dueDiligenceData, isLoading: isDueDiligenceLoading } = useQuery(
    {
      queryKey: [`/api/due-diligence-process?organizationId=${selectedClient}`],
    }
  );

  const { data: iroData, isLoading: isIroLoading } = useQuery({
    queryKey: [`/api/iro-register?organizationId=${selectedClient}`],
  });

  const { data: actionPlansData, isLoading: isActionPlansLoading } = useQuery({
    queryKey: [`/api/action-plans/?organizationId=${selectedClient}`],
  });

  console.log("actionPlanData:", actionPlansData);

  const { data: monitoringData, isLoading: isMonitoringLoading } = useQuery({
    queryKey: [`/api/iro-monitoring?organizationId=${selectedClient}`],
  });

  console.log("monitoringData:", monitoringData);

  // Forms
  const dueDiligenceForm = useForm<z.infer<typeof dueDiligenceSchema>>({
    resolver: zodResolver(dueDiligenceSchema),
    defaultValues: {
      frameworks: [],
      scopeDescription: "",
      governanceOversight: "",
      processDescription: "",
      frequency: "",
      stakeholderInvolvement: [],
      grievanceMechanismAvailable: false,
      grievanceMechanismDescription: "",
      supportingDocuments: [],
    },
  });

  const iroForm = useForm<z.infer<typeof iroRegisterSchema>>({
    resolver: zodResolver(iroRegisterSchema),
    defaultValues: {
      iroType: "",
      category: "",
      iroTitle: "",
      iroDescription: "",
      likelihood: 1,
      severityMagnitude: 1,
      timeHorizon: "",
      affectedStakeholders: [],
      valueChainLocation: "",
      financialMateriality: false,
      impactMateriality: false,
      linkedStrategyGoal: [],
    },
  });

  const actionPlanForm = useForm<z.infer<typeof actionPlanSchema>>({
    resolver: zodResolver(actionPlanSchema),
    defaultValues: {
      iroId: 0,
      responseType: "",
      responseDescription: "",
      targetOutcome: "",
      responsibleDepartment: "",
      startDate: "",
      endDate: "",
      budgetAmount: "",
      budgetCurrency: "EUR",
    },
  });

  const monitoringForm = useForm<z.infer<typeof monitoringSchema>>({
    resolver: zodResolver(monitoringSchema),
    defaultValues: {
      iroId: 0,
      lastReviewed: "",
      monitoringMethod: "",
      performanceIndicator: "",
      currentStatus: "",
      supportingDocuments: [],
    },
  });

  // Mutations
  const dueDiligenceMutation = useMutation({
    mutationFn: (data: z.infer<typeof dueDiligenceSchema>) => {
      const payload = { ...data, organizationId: selectedClient };
      return dueDiligenceData?.id
        ? apiRequest(
            `/api/due-diligence-process/${dueDiligenceData?.id}`,
            "PUT",
            payload
          )
        : apiRequest("/api/due-diligence-process", "POST", payload);
    },
    onSuccess: () => {
      toast({ title: "Due diligence process saved successfully" });
      console.log(selectedClient, "helloo thisbis cID");
      queryClient.invalidateQueries({
        queryKey: [
          `/api/due-diligence-process?organizationId=${selectedClient}`,
        ],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving due diligence process",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const iroMutation = useMutation({
    mutationFn: (data: z.infer<typeof iroRegisterSchema>) => {
      return editingIro
        ? apiRequest(`/api/iro-register/${editingIro.id}`, "PUT", data)
        : apiRequest("/api/iro-register", "POST", {
            ...data,
            organizationId: selectedClient,
          });
    },
    onSuccess: () => {
      toast({
        title: editingIro
          ? "IRO updated successfully"
          : "IRO created successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/iro-register?organizationId=${selectedClient}`],
      });
      setIsIroDialogOpen(false);
      setEditingIro(null);
      iroForm.reset({
        iroType: "",
        category: "",
        iroTitle: "",
        iroDescription: "",
        likelihood: 1,
        severityMagnitude: 1,
        timeHorizon: "",
        affectedStakeholders: [],
        valueChainLocation: "",
        financialMateriality: false,
        impactMateriality: false,
        linkedStrategyGoal: [],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving IRO",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const actionPlanMutation = useMutation({
    mutationFn: (data: z.infer<typeof actionPlanSchema>) => {
      console.log("selctedClient:", selectedClient);
      console.log("actionPlanData:", actionPlansData);
      const payload = { ...data, organizationId: selectedClient };
      return editingActionPlan
        ? apiRequest(`/api/action-plans/${editingActionPlan.id}`, "PUT", data)
        : apiRequest("/api/action-plans", "POST", payload);
    },
    onSuccess: () => {
      toast({
        title: editingActionPlan
          ? "Action plan updated successfully"
          : "Action plan created successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/action-plans/?organizationId=${selectedClient}`],
      });
      setIsActionPlanDialogOpen(false);
      setEditingActionPlan(null);
      actionPlanForm.reset({
        iroId: 0,
        responseType: "",
        responseDescription: "",
        targetOutcome: "",
        responsibleDepartment: "",
        startDate: "",
        endDate: "",
        budgetAmount: "",
        budgetCurrency: "EUR",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving action plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const monitoringMutation = useMutation({
    mutationFn: (data: z.infer<typeof monitoringSchema>) => {
      const payload = { ...data, organizationId: selectedClient };
      return editingMonitoring
        ? apiRequest(`/api/iro-monitoring/${editingMonitoring.id}`, "PUT", data)
        : apiRequest("/api/iro-monitoring", "POST", payload);
    },
    onSuccess: () => {
      toast({
        title: editingMonitoring
          ? "Monitoring entry updated successfully"
          : "Monitoring entry created successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/iro-monitoring?organizationId=${selectedClient}`],
      });
      setIsMonitoringDialogOpen(false);
      setEditingMonitoring(null);
      monitoringForm.reset({
        iroId: 0,
        lastReviewed: "",
        monitoringMethod: "",
        performanceIndicator: "",
        currentStatus: "",
        supportingDocuments: [],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving monitoring entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteIroMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/iro-register/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "IRO deleted successfully" });
      queryClient.invalidateQueries({
        queryKey: [`/api/iro-register?organizationId=${selectedClient}`],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting IRO",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteActionPlanMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/action-plans/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Action plan deleted successfully" });
      queryClient.invalidateQueries({
        queryKey: [`/api/action-plans/?organizationId=${selectedClient}`],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting action plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMonitoringMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/iro-monitoring/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Monitoring entry deleted successfully" });
      queryClient.invalidateQueries({
        queryKey: [`/api/iro-monitoring?organizationId=${selectedClient}`],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting monitoring entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Under Control":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "Escalated":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "Emerging":
        return <Flag className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskLevel = (likelihood: number, severity: number) => {
    const riskScore = likelihood * severity;
    if (riskScore >= 20)
      return { level: "Critical", color: "bg-red-100 text-red-800" };
    if (riskScore >= 15)
      return { level: "High", color: "bg-orange-100 text-orange-800" };
    if (riskScore >= 10)
      return { level: "Medium", color: "bg-yellow-100 text-yellow-800" };
    if (riskScore >= 5)
      return { level: "Low", color: "bg-green-100 text-green-800" };
    return { level: "Very Low", color: "bg-gray-100 text-gray-800" };
  };

  const onDueDiligenceSubmit = (data: z.infer<typeof dueDiligenceSchema>) => {
    dueDiligenceMutation.mutate(data);
  };

  const onIroSubmit = (data: z.infer<typeof iroRegisterSchema>) => {
    iroMutation.mutate(data);
  };

  const onActionPlanSubmit = (data: z.infer<typeof actionPlanSchema>) => {
    actionPlanMutation.mutate(data);
  };

  const onMonitoringSubmit = (data: z.infer<typeof monitoringSchema>) => {
    monitoringMutation.mutate(data);
  };

  // Load existing data into forms
  const loadDueDiligenceData = () => {
    if (dueDiligenceData) {
      dueDiligenceForm.reset({
        frameworks: dueDiligenceData?.frameworks || [],
        scopeDescription: dueDiligenceData?.scopeDescription || "",
        governanceOversight: dueDiligenceData?.governanceOversight || "",
        processDescription: dueDiligenceData?.processDescription || "",
        frequency: dueDiligenceData?.frequency || "",
        stakeholderInvolvement: dueDiligenceData?.stakeholderInvolvement || [],
        grievanceMechanismAvailable:
          dueDiligenceData?.grievanceMechanismAvailable || false,
        grievanceMechanismDescription:
          dueDiligenceData?.grievanceMechanismDescription || "",
        supportingDocuments: dueDiligenceData?.supportingDocuments || [],
      });
    }
  };

  useEffect(() => {
    if (dueDiligenceData === undefined) {
      dueDiligenceForm.reset({
        frameworks: [],
        scopeDescription: "",
        governanceOversight: "",
        processDescription: "",
        frequency: "",
        stakeholderInvolvement: [],
        grievanceMechanismAvailable: false,
        grievanceMechanismDescription: "",
        supportingDocuments: [],
      });
    } else if (dueDiligenceData) {
      dueDiligenceForm.reset({
        frameworks: dueDiligenceData.frameworks || [],
        scopeDescription: dueDiligenceData.scopeDescription || "",
        governanceOversight: dueDiligenceData.governanceOversight || "",
        processDescription: dueDiligenceData.processDescription || "",
        frequency: dueDiligenceData.frequency || "",
        stakeholderInvolvement: dueDiligenceData.stakeholderInvolvement || [],
        grievanceMechanismAvailable:
          dueDiligenceData.grievanceMechanismAvailable || false,
        grievanceMechanismDescription:
          dueDiligenceData.grievanceMechanismDescription || "",
        supportingDocuments: dueDiligenceData.supportingDocuments || [],
      });
    }
  }, [dueDiligenceData, dueDiligenceForm, selectedClient]);

  const openIroDialog = (iro?: any) => {
    if (iro) {
      setEditingIro(iro);
      iroForm.reset({
        iroType: iro.iroType || "",
        category: iro.category || "",
        iroTitle: iro.iroTitle || "",
        iroDescription: iro.iroDescription || "",
        likelihood: iro.likelihood || 1,
        severityMagnitude: iro.severityMagnitude || 1,
        timeHorizon: iro.timeHorizon || "",
        affectedStakeholders: iro.affectedStakeholders || [],
        valueChainLocation: iro.valueChainLocation || "",
        financialMateriality: iro.financialMateriality || false,
        impactMateriality: iro.impactMateriality || false,
        linkedStrategyGoal: iro.linkedStrategyGoal || [],
      });
    } else {
      setEditingIro(null);
      iroForm.reset({
        iroType: "",
        category: "",
        iroTitle: "",
        iroDescription: "",
        likelihood: 1,
        severityMagnitude: 1,
        timeHorizon: "",
        affectedStakeholders: [],
        valueChainLocation: "",
        financialMateriality: false,
        impactMateriality: false,
        linkedStrategyGoal: [],
      });
    }
    setIsIroDialogOpen(true);
  };

  const openActionPlanDialog = (actionPlan?: any) => {
    if (actionPlan) {
      setEditingActionPlan(actionPlan);
      actionPlanForm.reset({
        iroId: actionPlan.iroId || 0,
        responseType: actionPlan.responseType || "",
        responseDescription: actionPlan.responseDescription || "",
        targetOutcome: actionPlan.targetOutcome || "",
        responsibleDepartment: actionPlan.responsibleDepartment || "",
        startDate: actionPlan.startDate || "",
        endDate: actionPlan.endDate || "",
        budgetAmount: actionPlan.budgetAmount || "",
        budgetCurrency: actionPlan.budgetCurrency || "EUR",
      });
    } else {
      setEditingActionPlan(null);
      actionPlanForm.reset({
        iroId: 0,
        responseType: "",
        responseDescription: "",
        targetOutcome: "",
        responsibleDepartment: "",
        startDate: "",
        endDate: "",
        budgetAmount: "",
        budgetCurrency: "EUR",
      });
    }
    setIsActionPlanDialogOpen(true);
  };

  const openMonitoringDialog = (monitoring?: any) => {
    if (monitoring) {
      setEditingMonitoring(monitoring);
      monitoringForm.reset({
        iroId: monitoring.iroId || 0,
        lastReviewed: monitoring.lastReviewed || "",
        monitoringMethod: monitoring.monitoringMethod || "",
        performanceIndicator: monitoring.performanceIndicator || "",
        currentStatus: monitoring.currentStatus || "",
        supportingDocuments: monitoring.supportingDocuments || [],
      });
    } else {
      setEditingMonitoring(null);
      monitoringForm.reset({
        iroId: 0,
        lastReviewed: "",
        monitoringMethod: "",
        performanceIndicator: "",
        currentStatus: "",
        supportingDocuments: [],
      });
    }
    setIsMonitoringDialogOpen(true);
  };

  // Load data when component mounts
  useState(() => {
    loadDueDiligenceData();
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Risk & Impact Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage sustainability risks, impacts, and opportunities across
                your value chain
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
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
                    onValueChange={setSelectedClient}
                  >
                    <SelectTrigger className="w-full">
                      {/* Don't render SelectValue if selectedClient is "none" */}
                      {selectedClient === "none" ? (
                        <span className="text-muted-foreground">
                          Select Client
                        </span>
                      ) : (
                        <SelectValue placeholder="Select a client organization" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
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

        {/* Risk Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="due-diligence">
              <Shield className="h-4 w-4 mr-2" />
              Due Diligence
            </TabsTrigger>
            <TabsTrigger value="iro-register">
              <AlertTriangle className="h-4 w-4 mr-2" />
              IRO Register
            </TabsTrigger>
            <TabsTrigger value="action-plans">
              <Target className="h-4 w-4 mr-2" />
              Action Plans
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <Activity className="h-4 w-4 mr-2" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Due Diligence Process Tab */}
          <TabsContent value="due-diligence">
            <Card>
              <CardHeader>
                <CardTitle>Due Diligence Process</CardTitle>
                <p className="text-sm text-gray-600">
                  Document processes for identifying, preventing, mitigating,
                  and tracking sustainability impacts
                </p>
              </CardHeader>
              <CardContent>
                <Form {...dueDiligenceForm}>
                  <form
                    onSubmit={dueDiligenceForm.handleSubmit(
                      onDueDiligenceSubmit
                    )}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={dueDiligenceForm.control}
                        name="frameworks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Diligence Framework *</FormLabel>
                            <FormDescription>
                              Select the frameworks your company follows
                            </FormDescription>
                            <FormControl>
                              <div className="space-y-2">
                                {DUE_DILIGENCE_FRAMEWORKS.map((framework) => (
                                  <div
                                    key={framework}
                                    className="flex items-center space-x-2"
                                  >
                                    <input
                                      type="checkbox"
                                      id={framework}
                                      checked={field.value.includes(framework)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          field.onChange([
                                            ...field.value,
                                            framework,
                                          ]);
                                        } else {
                                          field.onChange(
                                            field.value.filter(
                                              (f) => f !== framework
                                            )
                                          );
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <label
                                      htmlFor={framework}
                                      className="text-sm font-medium"
                                    >
                                      {framework}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={dueDiligenceForm.control}
                        name="governanceOversight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Governance Oversight *</FormLabel>
                            <FormDescription>
                              Who is responsible for due diligence?
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select governance oversight" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GOVERNANCE_OVERSIGHT.map((oversight) => (
                                  <SelectItem key={oversight} value={oversight}>
                                    {oversight}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={dueDiligenceForm.control}
                      name="scopeDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scope of Due Diligence *</FormLabel>
                          <FormDescription>
                            Describe which parts of your operations/value chain
                            are included
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Covers internal operations, Tier-1 suppliers, and logistics partners."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dueDiligenceForm.control}
                      name="processDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Process Description *</FormLabel>
                          <FormDescription>
                            Briefly describe how the process is carried out
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="We conduct annual supplier audits, grievance mechanisms, and desktop reviews."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={dueDiligenceForm.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency *</FormLabel>
                            <FormDescription>
                              How often is due diligence performed?
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {FREQUENCY_OPTIONS.map((freq) => (
                                  <SelectItem key={freq} value={freq}>
                                    {freq}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={dueDiligenceForm.control}
                        name="grievanceMechanismAvailable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grievance Mechanism Available</FormLabel>
                            <FormDescription>
                              Whether a mechanism is available for affected
                              parties
                            </FormDescription>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="grievance-mechanism"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="rounded border-gray-300"
                                />
                                <label
                                  htmlFor="grievance-mechanism"
                                  className="text-sm font-medium"
                                >
                                  Yes, grievance mechanism is available
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={dueDiligenceForm.control}
                      name="stakeholderInvolvement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stakeholder Involvement *</FormLabel>
                          <FormDescription>
                            Which stakeholders are involved in the due diligence
                            process?
                          </FormDescription>
                          <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {STAKEHOLDER_GROUPS.map((stakeholder) => (
                                <div
                                  key={stakeholder}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="checkbox"
                                    id={stakeholder}
                                    checked={field.value.includes(stakeholder)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([
                                          ...field.value,
                                          stakeholder,
                                        ]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            (s) => s !== stakeholder
                                          )
                                        );
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <label
                                    htmlFor={stakeholder}
                                    className="text-sm font-medium"
                                  >
                                    {stakeholder}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {dueDiligenceForm.watch("grievanceMechanismAvailable") && (
                      <FormField
                        control={dueDiligenceForm.control}
                        name="grievanceMechanismDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Grievance Mechanism Description
                            </FormLabel>
                            <FormDescription>
                              Describe how stakeholders can raise concerns
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                placeholder="Online form, hotline, and anonymous reporting system."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="submit"
                        disabled={
                          user.role === "consultant" &&
                          selectedClient === "none"
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {dueDiligenceMutation.isPending
                          ? "Saving..."
                          : "Save Due Diligence Process"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IRO Register Tab */}
          <TabsContent value="iro-register">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>IRO Register</CardTitle>
                    <p className="text-sm text-gray-600">
                      Identify and assess impacts, risks, and opportunities
                    </p>
                  </div>
                  <Button
                    onClick={() => openIroDialog()}
                    disabled={selectedClient === "none"}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add IRO
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isIroLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : iroData && iroData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Time Horizon</TableHead>
                        <TableHead>Materiality</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {iroData.map((iro: any) => {
                        const riskLevel = getRiskLevel(
                          iro.likelihood,
                          iro.severityMagnitude
                        );
                        return (
                          <TableRow key={iro.id}>
                            <TableCell>
                              <Badge variant="outline">{iro.iroType}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{iro.category}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {iro.iroTitle}
                            </TableCell>
                            <TableCell>
                              <Badge className={riskLevel.color}>
                                {riskLevel.level}
                              </Badge>
                            </TableCell>
                            <TableCell>{iro.timeHorizon}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                {iro.financialMateriality && (
                                  <Badge variant="outline" className="text-xs">
                                    F
                                  </Badge>
                                )}
                                {iro.impactMateriality && (
                                  <Badge variant="outline" className="text-xs">
                                    I
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openIroDialog(iro)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    deleteIroMutation.mutate(iro.id)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a client organization to manage IROs
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start by adding impacts, risks, and opportunities to your
                      register
                    </p>
                    <Button
                      onClick={() => openIroDialog()}
                      disabled={selectedClient === "none"}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First IRO
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Action Plans Tab */}
          <TabsContent value="action-plans">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Action & Mitigation Plans</CardTitle>
                    <p className="text-sm text-gray-600">
                      Define response strategies for identified IROs
                    </p>
                  </div>
                  <Button
                    onClick={() => openActionPlanDialog()}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!iroData || iroData.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isActionPlansLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : actionPlansData && actionPlansData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IRO</TableHead>
                        <TableHead>Response Type</TableHead>
                        <TableHead>Target Outcome</TableHead>
                        <TableHead>Responsible Dept</TableHead>
                        <TableHead>Timeline</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actionPlansData.map((plan: any) => {
                        const linkedIro = iroData?.find(
                          (iro: any) => iro.id === plan.iroId
                        );
                        return (
                          <TableRow key={plan.id}>
                            <TableCell>
                              <div className="font-medium">
                                {linkedIro?.iroTitle || "Unknown IRO"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {linkedIro?.category}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {plan.responseType}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {plan.targetOutcome}
                            </TableCell>
                            <TableCell>{plan.responsibleDepartment}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {plan.startDate && (
                                  <div>
                                    Start:{" "}
                                    {new Date(
                                      plan.startDate
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                                {plan.endDate && (
                                  <div>
                                    End:{" "}
                                    {new Date(
                                      plan.endDate
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {plan.budgetAmount && (
                                <div className="text-sm font-medium">
                                  €{Number(plan.budgetAmount).toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openActionPlanDialog(plan)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    deleteActionPlanMutation.mutate(plan.id)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No action plans defined
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {!iroData || iroData.length === 0
                        ? "Add IROs first, then create action plans to address them"
                        : "Create action plans to address your identified risks and opportunities"}
                    </p>
                    <Button
                      onClick={() => openActionPlanDialog()}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!iroData || iroData.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Action Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Monitoring & Evaluation</CardTitle>
                    <p className="text-sm text-gray-600">
                      Track IRO progress and response effectiveness
                    </p>
                  </div>
                  <Button
                    onClick={() => openMonitoringDialog()}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!iroData || iroData.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Monitoring Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isMonitoringLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : monitoringData && monitoringData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IRO</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Performance Indicator</TableHead>
                        <TableHead>Monitoring Method</TableHead>
                        <TableHead>Last Reviewed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monitoringData.map((monitoring: any) => {
                        const linkedIro = iroData?.find(
                          (iro: any) => iro.id === monitoring.iroId
                        );
                        return (
                          <TableRow key={monitoring.id}>
                            <TableCell>
                              <div className="font-medium">
                                {linkedIro?.iroTitle || "Unknown IRO"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {linkedIro?.category}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(monitoring.currentStatus)}
                                <span className="font-medium">
                                  {monitoring.currentStatus}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {monitoring.performanceIndicator}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {monitoring.monitoringMethod}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {monitoring.lastReviewed &&
                                new Date(
                                  monitoring.lastReviewed
                                ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    openMonitoringDialog(monitoring)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    deleteMonitoringMutation.mutate(
                                      monitoring.id
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No monitoring entries
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {!iroData || iroData.length === 0
                        ? "Add IROs first, then create monitoring entries to track them"
                        : "Start monitoring your identified risks and opportunities"}
                    </p>
                    <Button
                      onClick={() => openMonitoringDialog()}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!iroData || iroData.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Monitoring Entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* IRO Register Dialog */}
        <Dialog open={isIroDialogOpen} onOpenChange={setIsIroDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIro ? "Edit IRO" : "Add New IRO"}
              </DialogTitle>
            </DialogHeader>
            <Form {...iroForm}>
              <form
                onSubmit={iroForm.handleSubmit(onIroSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={iroForm.control}
                    name="iroType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IRO Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose the type of entry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {IRO_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={iroForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select from E, S, G themes" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {IRO_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={iroForm.control}
                  name="iroTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IRO Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Water Scarcity in Production"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={iroForm.control}
                  name="iroDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IRO Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Operations in drought-prone area face reputational risk and water shortages."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={iroForm.control}
                    name="likelihood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Likelihood (1-5) *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="How likely?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LIKELIHOOD_SCALE.map((scale) => (
                              <SelectItem
                                key={scale.value}
                                value={scale.value.toString()}
                              >
                                {scale.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={iroForm.control}
                    name="severityMagnitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity/Impact (1-5) *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Expected impact?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SEVERITY_SCALE.map((scale) => (
                              <SelectItem
                                key={scale.value}
                                value={scale.value.toString()}
                              >
                                {scale.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={iroForm.control}
                    name="timeHorizon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Horizon *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Time scale" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_HORIZONS.map((horizon) => (
                              <SelectItem key={horizon} value={horizon}>
                                {horizon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={iroForm.control}
                    name="valueChainLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value Chain Location *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Where does IRO occur?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VALUE_CHAIN_LOCATIONS.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={iroForm.control}
                    name="affectedStakeholders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Affected Stakeholders *</FormLabel>
                        <FormDescription>
                          Groups affected by this IRO
                        </FormDescription>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-2">
                            {STAKEHOLDER_GROUPS.map((stakeholder) => (
                              <div
                                key={stakeholder}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`affected-${stakeholder}`}
                                  checked={field.value.includes(stakeholder)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([
                                        ...field.value,
                                        stakeholder,
                                      ]);
                                    } else {
                                      field.onChange(
                                        field.value.filter(
                                          (s) => s !== stakeholder
                                        )
                                      );
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label
                                  htmlFor={`affected-${stakeholder}`}
                                  className="text-sm"
                                >
                                  {stakeholder}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={iroForm.control}
                    name="financialMateriality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Materiality</FormLabel>
                        <FormDescription>
                          Could this affect financial performance?
                        </FormDescription>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="financial-materiality"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-gray-300"
                            />
                            <label
                              htmlFor="financial-materiality"
                              className="text-sm"
                            >
                              Yes, this has financial materiality
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={iroForm.control}
                    name="impactMateriality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact Materiality</FormLabel>
                        <FormDescription>
                          Does it have significant environmental/social impact?
                        </FormDescription>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="impact-materiality"
                              checked={field.value}
                              onChange={field.onChange}
                              className="rounded border-gray-300"
                            />
                            <label
                              htmlFor="impact-materiality"
                              className="text-sm"
                            >
                              Yes, this has impact materiality
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsIroDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={iroMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {iroMutation.isPending
                      ? "Saving..."
                      : editingIro
                      ? "Update IRO"
                      : "Create IRO"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Action Plan Dialog */}
        <Dialog
          open={isActionPlanDialogOpen}
          onOpenChange={setIsActionPlanDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingActionPlan ? "Edit Action Plan" : "Add New Action Plan"}
              </DialogTitle>
            </DialogHeader>
            <Form {...actionPlanForm}>
              <form
                onSubmit={actionPlanForm.handleSubmit(onActionPlanSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={actionPlanForm.control}
                    name="iroId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IRO *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select IRO" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {iroData?.map((iro: any) => (
                              <SelectItem
                                key={iro.id}
                                value={iro.id.toString()}
                              >
                                {iro.iroTitle} ({iro.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={actionPlanForm.control}
                    name="responseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="What type of action?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RESPONSE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={actionPlanForm.control}
                  name="responseDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Shift operations to less water-stressed region and install recycling systems."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={actionPlanForm.control}
                    name="targetOutcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Outcome *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Reduce water use by 30% within 2 years"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={actionPlanForm.control}
                    name="responsibleDepartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsible Department *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Who will lead?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={actionPlanForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={actionPlanForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={actionPlanForm.control}
                    name="budgetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (EUR) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="100000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsActionPlanDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={actionPlanMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionPlanMutation.isPending
                      ? "Saving..."
                      : editingActionPlan
                      ? "Update Action Plan"
                      : "Create Action Plan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Monitoring Dialog */}
        <Dialog
          open={isMonitoringDialogOpen}
          onOpenChange={setIsMonitoringDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMonitoring
                  ? "Edit Monitoring Entry"
                  : "Add New Monitoring Entry"}
              </DialogTitle>
            </DialogHeader>
            <Form {...monitoringForm}>
              <form
                onSubmit={monitoringForm.handleSubmit(onMonitoringSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={monitoringForm.control}
                    name="iroId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IRO *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select IRO" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {iroData?.map((iro: any) => (
                              <SelectItem
                                key={iro.id}
                                value={iro.id.toString()}
                              >
                                {iro.iroTitle} ({iro.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={monitoringForm.control}
                    name="currentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Status *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status of the IRO" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {IRO_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={monitoringForm.control}
                    name="lastReviewed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Reviewed *</FormLabel>
                        <FormControl>
                          <Input type="date" max={new Date().toISOString().split('T')[0]} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={monitoringForm.control}
                    name="monitoringMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monitoring Method *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type of monitoring" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MONITORING_METHODS.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={monitoringForm.control}
                  name="performanceIndicator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance Indicator (KPI) *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Water withdrawn per unit output (m³/unit)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMonitoringDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={monitoringMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {monitoringMutation.isPending
                      ? "Saving..."
                      : editingMonitoring
                      ? "Update Monitoring Entry"
                      : "Create Monitoring Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
