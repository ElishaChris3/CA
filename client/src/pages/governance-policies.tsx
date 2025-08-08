import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Save,
  Building,
  Users,
  Target,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";

// Option arrays for dropdowns
const boardOversightOptions = [
  { value: "Full Board", label: "Full Board" },
  { value: "ESG Committee", label: "ESG Committee" },
  { value: "Risk & Audit Committee", label: "Risk & Audit Committee" },
  { value: "Sustainability Committee", label: "Sustainability Committee" },
  { value: "Ethics Committee", label: "Ethics Committee" },
  { value: "Nomination Committee", label: "Nomination Committee" },
  { value: "No Oversight", label: "No Oversight" },
];

const committeeCompositionOptions = [
  { value: "Board Chair", label: "Board Chair" },
  { value: "Independent Directors", label: "Independent Directors" },
  { value: "CEO", label: "CEO" },
  { value: "CFO", label: "CFO" },
  { value: "CSO", label: "CSO" },
  { value: "Chief Risk Officer", label: "Chief Risk Officer" },
  { value: "Legal Counsel", label: "Legal Counsel" },
  { value: "Employee Representatives", label: "Employee Representatives" },
  { value: "Investor Relations", label: "Investor Relations" },
  { value: "Other", label: "Other" },
];

const committeeResponsibilityOptions = [
  { value: "Climate Change", label: "Climate Change" },
  { value: "Human Rights", label: "Human Rights" },
  { value: "Biodiversity", label: "Biodiversity" },
  { value: "Anti-Corruption", label: "Anti-Corruption" },
  { value: "Diversity & Inclusion", label: "Diversity & Inclusion" },
  { value: "Executive Pay", label: "Executive Pay" },
  { value: "ESG Risks & Opportunities", label: "ESG Risks & Opportunities" },
  { value: "Stakeholder Engagement", label: "Stakeholder Engagement" },
  { value: "Other", label: "Other" },
];

const reportingLineOptions = [
  { value: "Full Board", label: "Full Board" },
  { value: "CEO", label: "CEO" },
  { value: "Executive Committee", label: "Executive Committee" },
  { value: "Supervisory Board", label: "Supervisory Board" },
  { value: "Risk Committee", label: "Risk Committee" },
  { value: "Other", label: "Other" },
];

const policyCategoryOptions = [
  { value: "Environmental Policy", label: "Environmental Policy" },
  { value: "Human Rights Policy", label: "Human Rights Policy" },
  { value: "Anti-Corruption Policy", label: "Anti-Corruption Policy" },
  { value: "Whistleblower Policy", label: "Whistleblower Policy" },
  {
    value: "Diversity & Inclusion Policy",
    label: "Diversity & Inclusion Policy",
  },
  {
    value: "Responsible Sourcing Policy",
    label: "Responsible Sourcing Policy",
  },
  { value: "Health & Safety Policy", label: "Health & Safety Policy" },
  { value: "Code of Conduct", label: "Code of Conduct" },
  { value: "Cybersecurity/Data Ethics", label: "Cybersecurity/Data Ethics" },
  { value: "Climate Policy", label: "Climate Policy" },
  {
    value: "Conflict of Interest Policy",
    label: "Conflict of Interest Policy",
  },
  { value: "Other", label: "Other" },
];

const appliesToOptions = [
  { value: "Entire Organization", label: "Entire Organization" },
  { value: "Specific Departments", label: "Specific Departments" },
  { value: "Subsidiaries", label: "Subsidiaries" },
  { value: "Suppliers", label: "Suppliers" },
  { value: "Contractors", label: "Contractors" },
  { value: "Joint Ventures", label: "Joint Ventures" },
  { value: "Temporary Staff", label: "Temporary Staff" },
  { value: "Other", label: "Other" },
];

const policyStatusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Under Internal Review", label: "Under Internal Review" },
  { value: "Board Approved", label: "Board Approved" },
  { value: "Publicly Disclosed", label: "Publicly Disclosed" },
  { value: "Archived", label: "Archived" },
];

const applicableRolesOptions = [
  { value: "CEO", label: "CEO" },
  { value: "CFO", label: "CFO" },
  { value: "CSO", label: "CSO" },
  { value: "COO", label: "COO" },
  { value: "Board Members", label: "Board Members" },
  { value: "Senior Executives", label: "Senior Executives" },
  { value: "Country Heads", label: "Country Heads" },
  { value: "Business Unit Leaders", label: "Business Unit Leaders" },
  { value: "Other", label: "Other" },
];

const linkedEsgKpiOptions = [
  {
    value: "Scope 1 Emissions Reduction",
    label: "Scope 1 Emissions Reduction",
  },
  {
    value: "Scope 2 Emissions Reduction",
    label: "Scope 2 Emissions Reduction",
  },
  { value: "Scope 3 Targets", label: "Scope 3 Targets" },
  { value: "Net-Zero Milestones", label: "Net-Zero Milestones" },
  { value: "Gender Diversity Ratio", label: "Gender Diversity Ratio" },
  { value: "Employee Safety", label: "Employee Safety" },
  { value: "Training Hours", label: "Training Hours" },
  {
    value: "Whistleblower Cases Resolved",
    label: "Whistleblower Cases Resolved",
  },
  {
    value: "ESG Ratings (e.g., MSCI, Sustainalytics)",
    label: "ESG Ratings (e.g., MSCI, Sustainalytics)",
  },
  { value: "EU Taxonomy Alignment", label: "EU Taxonomy Alignment" },
  { value: "Community Engagement", label: "Community Engagement" },
  { value: "Customer Satisfaction", label: "Customer Satisfaction" },
  { value: "Other", label: "Other" },
];

const compensationApprovalBodyOptions = [
  { value: "Board of Directors", label: "Board of Directors" },
  { value: "Compensation Committee", label: "Compensation Committee" },
  { value: "HR Department", label: "HR Department" },
  { value: "Shareholders", label: "Shareholders" },
  { value: "CEO", label: "CEO" },
  { value: "Supervisory Board", label: "Supervisory Board" },
  { value: "Other", label: "Other" },
];

const whoTracksEsgKpiOptions = [
  { value: "Sustainability Team", label: "Sustainability Team" },
  { value: "Finance Department", label: "Finance Department" },
  { value: "Risk & Compliance", label: "Risk & Compliance" },
  { value: "Operations", label: "Operations" },
  { value: "HR", label: "HR" },
  { value: "Procurement", label: "Procurement" },
  { value: "CSR Office", label: "CSR Office" },
  { value: "ESG Task Force", label: "ESG Task Force" },
  { value: "Third-Party Consultants", label: "Third-Party Consultants" },
  { value: "Other", label: "Other" },
];

const esgReportingFrequencyOptions = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Bi-Annually", label: "Bi-Annually" },
  { value: "Annually", label: "Annually" },
  { value: "Ad-hoc", label: "Ad-hoc" },
];

const internalEsgReportRecipientsOptions = [
  { value: "Board", label: "Board" },
  { value: "Executive Committee", label: "Executive Committee" },
  { value: "Middle Management", label: "Middle Management" },
  { value: "Business Unit Heads", label: "Business Unit Heads" },
  { value: "Departmental Staff", label: "Departmental Staff" },
  { value: "All Employees", label: "All Employees" },
  { value: "Internal Audit Team", label: "Internal Audit Team" },
  { value: "Other", label: "Other" },
];

const formatsOfEsgReportingOptions = [
  { value: "Dashboard (BI Tools)", label: "Dashboard (BI Tools)" },
  { value: "Excel Reports", label: "Excel Reports" },
  { value: "PowerPoint Decks", label: "PowerPoint Decks" },
  { value: "Email Memos", label: "Email Memos" },
  { value: "Printed Reports", label: "Printed Reports" },
  { value: "Town Halls", label: "Town Halls" },
  { value: "KPI Scorecards", label: "KPI Scorecards" },
  { value: "Intranet Updates", label: "Intranet Updates" },
  { value: "Other", label: "Other" },
];

const esgIntegrationOptions = [
  { value: "Budgeting", label: "Budgeting" },
  { value: "Procurement", label: "Procurement" },
  { value: "R&D", label: "R&D" },
  { value: "Product Design", label: "Product Design" },
  { value: "Investment Decision-Making", label: "Investment Decision-Making" },
  { value: "Risk Management", label: "Risk Management" },
  { value: "HR & Training", label: "HR & Training" },
  { value: "M&A Activities", label: "M&A Activities" },
  { value: "Supplier Evaluation", label: "Supplier Evaluation" },
  { value: "Marketing", label: "Marketing" },
  { value: "Stakeholder Engagement", label: "Stakeholder Engagement" },
  { value: "Legal Compliance", label: "Legal Compliance" },
  { value: "Tax Strategy", label: "Tax Strategy" },
  { value: "Other", label: "Other" },
];

// Form schemas
const governanceStructureSchema = z.object({
  boardOversightMechanism: z
    .string()
    .min(1, "Board oversight mechanism is required"),
  committeeName: z.string().min(1, "Commitee Name is required"),
  committeeComposition: z.array(z.string()).optional(),
  committeeResponsibilities: z.array(z.string()).optional(),
  reportingLine: z.string().optional(),
  charterDocument: z.string().min(1, "Charter Document is required"),
});

const esgPolicySchema = z.object({
  policyName: z.string().min(1, "Policy name is required"),
  policyCategory: z.string().min(1, "Policy category is required"),
  appliesTo: z.array(z.string()).optional(),
  policyStatus: z.string().min(1, "Policy status is required"),
  dateOfLastReview: z.date().optional(),
  policyDocument: z.string().optional(),
});

const esgIncentivesSchema = z.object({
  isEsgUsedInCompensation: z.boolean(),
  applicableRoles: z.array(z.string()).optional(),
  linkedEsgKpis: z.array(z.string()).optional(),
  weightOfEsgInVariablePay: z.number().min(1, "Weight is required"),
  compensationApprovalBody: z.string().optional(),
  narrativeOnEsgIncentives: z.string().optional(),
});

const esgInformationFlowsSchema = z.object({
  whoTracksEsgKpis: z.array(z.string()).optional(),
  esgReportingFrequency: z.string().min(1, "Reporting Frequency is required"),
  internalEsgReportRecipients: z.array(z.string()).optional(),
  formatsOfEsgReporting: z.array(z.string()).optional(),
  narrativeDescriptionOfEsgDataFlow: z
    .string()
    .min(1, "Narrative DataFlow on ESG Integration is required"),
});

const esgIntegrationSchema = z.object({
  whereIsEsgIntegrated: z
    .array(z.string())
    .min(1, "At least one ESG integration area is required"),
  narrativeOnEsgIntegration: z
    .string()
    .min(1, "Narrative on ESG Integration is required"),
});

type GovernanceStructureForm = z.infer<typeof governanceStructureSchema>;
type EsgPolicyForm = z.infer<typeof esgPolicySchema>;
type EsgIncentivesForm = z.infer<typeof esgIncentivesSchema>;
type EsgInformationFlowsForm = z.infer<typeof esgInformationFlowsSchema>;
type EsgIntegrationForm = z.infer<typeof esgIntegrationSchema>;

export default function GovernancePolicies() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("governance-structure");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [policies, setPolicies] = useState([]);
  const [selectedCommitteeComposition, setSelectedCommitteeComposition] =
    useState<string[]>([]);
  const [
    selectedCommitteeResponsibilities,
    setSelectedCommitteeResponsibilities,
  ] = useState<string[]>([]);
  const [selectedAppliesTo, setSelectedAppliesTo] = useState<string[]>([]);
  const [selectedApplicableRoles, setSelectedApplicableRoles] = useState<
    string[]
  >([]);
  const [selectedLinkedEsgKpis, setSelectedLinkedEsgKpis] = useState<string[]>(
    []
  );
  const [selectedWhoTracksEsgKpis, setSelectedWhoTracksEsgKpis] = useState<
    string[]
  >([]);
  const [
    selectedInternalEsgReportRecipients,
    setSelectedInternalEsgReportRecipients,
  ] = useState<string[]>([]);
  const [selectedFormatsOfEsgReporting, setSelectedFormatsOfEsgReporting] =
    useState<string[]>([]);
  const [selectedEsgIntegration, setSelectedEsgIntegration] = useState<
    string[]
  >([]);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch client organizations for consultants
  const { data: clientOrganizations } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user && user.role === "consultant",
  });

  // Initialize forms
  const governanceForm = useForm<GovernanceStructureForm>({
    resolver: zodResolver(governanceStructureSchema),
    defaultValues: {
      boardOversightMechanism: "",
      committeeName: "",
      committeeComposition: [],
      committeeResponsibilities: [],
      reportingLine: "",
      charterDocument: "",
    },
  });

  const policyForm = useForm<EsgPolicyForm>({
    resolver: zodResolver(esgPolicySchema),
    defaultValues: {
      policyName: "",
      policyCategory: "",
      appliesTo: [],
      policyStatus: "",
      dateOfLastReview: undefined,
      policyDocument: "",
    },
  });

  const incentivesForm = useForm<EsgIncentivesForm>({
    resolver: zodResolver(esgIncentivesSchema),
    defaultValues: {
      isEsgUsedInCompensation: false,
      applicableRoles: [],
      linkedEsgKpis: [],
      weightOfEsgInVariablePay: 0,
      compensationApprovalBody: "",
      narrativeOnEsgIncentives: "",
    },
  });

  const informationFlowsForm = useForm<EsgInformationFlowsForm>({
    resolver: zodResolver(esgInformationFlowsSchema),
    defaultValues: {
      whoTracksEsgKpis: [],
      esgReportingFrequency: "",
      internalEsgReportRecipients: [],
      formatsOfEsgReporting: [],
      narrativeDescriptionOfEsgDataFlow: "",
    },
  });

  const integrationForm = useForm<EsgIntegrationForm>({
    resolver: zodResolver(esgIntegrationSchema),
    defaultValues: {
      whereIsEsgIntegrated: [],
      narrativeOnEsgIntegration: "",
    },
  });

  console.log("User role:", user?.role === "organization");

  // Queries
  const { data: governanceStructure } = useQuery({
    queryKey: [
      `/api/governance-structure/?organizationId=${selectedClient}`,
      selectedClient,
    ],
    enabled:
      user?.role === "organization" ||
      (user?.role === "consultant" && selectedClient !== ""),
  });

  const { data: esgPolicies = [] } = useQuery({
    queryKey: [`/api/esg-policies?organizationId=${selectedClient}`],
    enabled:
      user?.role === "organization" ||
      (user?.role === "consultant" && selectedClient !== ""),
  });

  const { data: esgIncentives } = useQuery({
    queryKey: [`/api/esg-incentives?organizationId=${selectedClient}`],
    enabled:
      user?.role === "organization" ||
      (user?.role === "consultant" && selectedClient !== ""),
  });

  const { data: esgInformationFlows } = useQuery({
    queryKey: [`/api/esg-information-flows?organizationId=${selectedClient}`],
    enabled:
      user?.role === "organization" ||
      (user?.role === "consultant" && selectedClient !== ""),
  });

  const { data: esgIntegration } = useQuery({
    queryKey: [`/api/esg-integration?organizationId=${selectedClient}`],
    enabled:
      user?.role === "organization" ||
      (user?.role === "consultant" && selectedClient !== ""),
  });

  const deleteEsgPolicyMutation = useMutation({
    mutationFn: (id: number) => {
      console.log("Deleting ESG Policy with ID:", id);
      return apiRequest(`/api/esg-policies/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "ESG Policy deleted successfully" });
      queryClient.invalidateQueries({
        queryKey: [`/api/esg-policies?organizationId=${selectedClient}`],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting ESG Policy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutations
  const saveGovernanceStructure = useMutation({
    mutationFn: async (data: GovernanceStructureForm) => {
      console.log(
        "Saving Governance Structure with selectedClient:",
        selectedClient
      );

      const formData = {
        ...data,
        committeeComposition: selectedCommitteeComposition,
        committeeResponsibilities: selectedCommitteeResponsibilities,
      };
      if (
        user?.role === "consultant" &&
        selectedClient &&
        selectedClient !== ""
      ) {
        formData.organizationId = Number(selectedClient);
      }
      if (governanceStructure?.id) {
        return await apiRequest(
          `/api/governance-structure/${governanceStructure.id}`,
          "PUT",
          formData
        );
      } else {
        return await apiRequest("/api/governance-structure", "POST", formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/api/governance-structure?organizationId=" + selectedClient,
        ],
      });
      toast({
        title: "Success",
        description: "Governance structure saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save governance structure",
        variant: "destructive",
      });
    },
  });

  const saveEsgPolicy = useMutation({
    mutationFn: async (data: EsgPolicyForm) => {
      if (
        user?.role === "consultant" &&
        (!selectedClient || selectedClient === "")
      ) {
        throw new Error("Client organization not selected");
      }
      const formData = {
        ...data,
        appliesTo: selectedAppliesTo,
        organizationId:
          user?.role === "consultant" ? Number(selectedClient) : undefined,
      };

      if (editingPolicy) {
        return await apiRequest(
          `/api/esg-policies/${editingPolicy.id}`,
          "PUT",
          formData
        );
      } else {
        return await apiRequest("/api/esg-policies", "POST", formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/esg-policies?organizationId=${selectedClient}`],
      });
      toast({
        title: "Success",
        description: `ESG policy ${
          editingPolicy ? "updated" : "saved"
        } successfully`,
      });
      policyForm.reset({
        policyName: "",
        policyCategory: "",
        appliesTo: [],
        policyStatus: "",
        dateOfLastReview: undefined,
        policyDocument: "",
      });
      setSelectedAppliesTo([]);
      setSelectedAppliesTo([]);
      setEditingPolicy(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save ESG policy",
        variant: "destructive",
      });
    },
  });

  const saveEsgIncentives = useMutation({
    mutationFn: async (data: EsgIncentivesForm) => {
      if (
        user?.role === "consultant" &&
        (!selectedClient || selectedClient === "")
      ) {
        throw new Error("Client organization not selected");
      }
      const formData = {
        ...data,
        applicableRoles: selectedApplicableRoles,
        linkedEsgKpis: selectedLinkedEsgKpis,
        organizationId:
          user?.role === "consultant" ? Number(selectedClient) : undefined,
      };

      if (esgIncentives?.id) {
        return await apiRequest(
          `/api/esg-incentives/${esgIncentives.id}`,
          "PUT",
          formData
        );
      } else {
        return await apiRequest("/api/esg-incentives", "POST", formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/esg-incentives?organizationId=${selectedClient}`],
      });
      toast({
        title: "Success",
        description: "ESG incentives saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save ESG incentives",
        variant: "destructive",
      });
    },
  });

  const saveEsgInformationFlows = useMutation({
    mutationFn: async (data: EsgInformationFlowsForm) => {
      if (
        user?.role === "consultant" &&
        (!selectedClient || selectedClient === "")
      ) {
        throw new Error("Client organization not selected");
      }
      const formData = {
        ...data,
        whoTracksEsgKpis: selectedWhoTracksEsgKpis,
        internalEsgReportRecipients: selectedInternalEsgReportRecipients,
        formatsOfEsgReporting: selectedFormatsOfEsgReporting,
        organizationId:
          user?.role === "consultant" ? Number(selectedClient) : undefined,
      };

      if (esgInformationFlows?.id) {
        return await apiRequest(
          `/api/esg-information-flows/${esgInformationFlows.id}`,
          "PUT",
          formData
        );
      } else {
        return await apiRequest("/api/esg-information-flows", "POST", formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/esg-information-flows?organizationId=${selectedClient}`,
        ],
      });
      toast({
        title: "Success",
        description: "ESG information flows saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save ESG information flows",
        variant: "destructive",
      });
    },
  });

  const saveEsgIntegration = useMutation({
    mutationFn: async (data: EsgIntegrationForm) => {
      if (
        user?.role === "consultant" &&
        (!selectedClient || selectedClient === "")
      ) {
        throw new Error("Client organization not selected");
      }
      const formData = {
        ...data,
        whereIsEsgIntegrated: selectedEsgIntegration,
        organizationId:
          user?.role === "consultant" ? Number(selectedClient) : undefined,
      };

      if (esgIntegration?.id) {
        return await apiRequest(
          `/api/esg-integration/${esgIntegration.id}`,
          "PUT",
          formData
        );
      } else {
        return await apiRequest("/api/esg-integration", "POST", formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/esg-integration?organizationId=${selectedClient}`],
      });
      toast({
        title: "Success",
        description: "ESG integration saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save ESG integration",
        variant: "destructive",
      });
    },
  });

  // Load existing data
  useEffect(() => {
    if (governanceStructure) {
      console.log("Loading governance structure:", governanceStructure);
      governanceForm.reset(governanceStructure);
      setSelectedCommitteeComposition(
        governanceStructure.committeeComposition || []
      );
      setSelectedCommitteeResponsibilities(
        governanceStructure.committeeResponsibilities || []
      );
    } else {
      governanceForm.reset({
        boardOversightMechanism: "",
        committeeName: "",
        committeeComposition: [],
        committeeResponsibilities: [],
        reportingLine: "",
        charterDocument: "",
      });
      setSelectedCommitteeComposition([]);
      setSelectedCommitteeResponsibilities([]);
    }
  }, [governanceStructure, governanceForm]);

  useEffect(() => {
    if (esgIncentives) {
      incentivesForm.reset({
        ...esgIncentives,
        weightOfEsgInVariablePay:
          typeof esgIncentives.weightOfEsgInVariablePay === "string"
            ? parseFloat(esgIncentives.weightOfEsgInVariablePay) || 0
            : esgIncentives.weightOfEsgInVariablePay || 0,
        applicableRoles: esgIncentives.applicableRoles || [],
        linkedEsgKpis: esgIncentives.linkedEsgKpis || [],
      });
      setSelectedApplicableRoles(esgIncentives.applicableRoles || []);
      setSelectedLinkedEsgKpis(esgIncentives.linkedEsgKpis || []);
    } else {
      incentivesForm.reset({
        isEsgUsedInCompensation: false,
        applicableRoles: [],
        linkedEsgKpis: [],
        weightOfEsgInVariablePay: 0,
        compensationApprovalBody: "",
        narrativeOnEsgIncentives: "",
      });
      setSelectedApplicableRoles([]);
      setSelectedLinkedEsgKpis([]);
    }
  }, [esgIncentives, incentivesForm]);

  useEffect(() => {
    if (esgInformationFlows) {
      informationFlowsForm.reset(esgInformationFlows);
      setSelectedWhoTracksEsgKpis(esgInformationFlows.whoTracksEsgKpis || []);
      setSelectedInternalEsgReportRecipients(
        esgInformationFlows.internalEsgReportRecipients || []
      );
      setSelectedFormatsOfEsgReporting(
        esgInformationFlows.formatsOfEsgReporting || []
      );
    } else {
      informationFlowsForm.reset({
        whoTracksEsgKpis: [],
        esgReportingFrequency: "",
        internalEsgReportRecipients: [],
        formatsOfEsgReporting: [],
        narrativeDescriptionOfEsgDataFlow: "",
      });
      setSelectedWhoTracksEsgKpis([]);
      setSelectedInternalEsgReportRecipients([]);
      setSelectedFormatsOfEsgReporting([]);
    }
  }, [esgInformationFlows, informationFlowsForm]);

  useEffect(() => {
    if (esgIntegration) {
      integrationForm.reset(esgIntegration);
      setSelectedEsgIntegration(esgIntegration?.whereIsEsgIntegrated || []);
    } else {
      integrationForm.reset({
        whereIsEsgIntegrated: [],
        narrativeOnEsgIntegration: "",
      });
      setSelectedEsgIntegration([]);
    }
  }, [esgIntegration, integrationForm]);

  useEffect(() => {
    if (editingPolicy) {
      console.log("Editing policy:", editingPolicy);
      policyForm.reset({
        policyName: editingPolicy.policyName || "",
        policyCategory: editingPolicy.policyCategory || "",
        appliesTo: editingPolicy.appliesTo || [],
        policyStatus: editingPolicy.policyStatus || "",
        dateOfLastReview: editingPolicy.dateOfLastReview
          ? new Date(editingPolicy.dateOfLastReview)
          : undefined,
        policyDocument: editingPolicy.policyDocument || "",
      });
      setSelectedAppliesTo(editingPolicy.appliesTo || []);
    } else {
      policyForm.reset();
      setSelectedAppliesTo([]);
    }
  }, [editingPolicy, policyForm]);

  // Multi-select helper component
  const MultiSelectBadges = ({
    options,
    selected,
    onSelectionChange,
    label,
  }: {
    options: { value: string; label: string }[];
    selected: string[];
    onSelectionChange: (newSelected: string[]) => void;
    label: string;
  }) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select
          onValueChange={(value) => {
            if (!selected.includes(value)) {
              onSelectionChange([...selected, value]);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {options.find((opt) => opt.value === item)?.label || item}
              <button
                onClick={() =>
                  onSelectionChange(selected.filter((s) => s !== item))
                }
                className="ml-1 text-xs hover:bg-gray-200 rounded-full p-1"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ca-grey-darker)]">
              Governance & Policies
            </h1>
            <p className="text-muted-foreground mt-1">
              Capture your organization's sustainability governance, policies,
              and integration processes
            </p>
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
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem disabled>Select Client</SelectItem>
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

        {/* Module Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="governance-structure"
              className="flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              Governance
            </TabsTrigger>
            <TabsTrigger
              value="esg-policies"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Policies
            </TabsTrigger>
            <TabsTrigger
              value="esg-incentives"
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Incentives
            </TabsTrigger>
            <TabsTrigger
              value="information-flows"
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Info Flows
            </TabsTrigger>
            <TabsTrigger
              value="integration"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Integration
            </TabsTrigger>
          </TabsList>

          {/* 1. Sustainability Governance Structure */}
          <TabsContent value="governance-structure">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-green-600" />
                  Sustainability Governance Structure
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Define your organization's sustainability governance setup and
                  oversight mechanisms
                </p>
              </CardHeader>
              <CardContent>
                <Form {...governanceForm}>
                  <form
                    onSubmit={governanceForm.handleSubmit((data) =>
                      saveGovernanceStructure.mutate(data)
                    )}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={governanceForm.control}
                        name="boardOversightMechanism"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Board Oversight Mechanism *</FormLabel>
                            <FormDescription>
                              Select the main entity responsible for ESG
                              oversight at board level
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select oversight mechanism" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {boardOversightOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={governanceForm.control}
                        name="committeeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Committee Name*</FormLabel>
                            <FormDescription>
                              Official name of the committee responsible for
                              sustainability oversight
                            </FormDescription>
                            <FormControl>
                              <Input
                                placeholder="Enter committee name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <MultiSelectBadges
                          options={committeeCompositionOptions}
                          selected={selectedCommitteeComposition}
                          onSelectionChange={setSelectedCommitteeComposition}
                          label="Committee Composition"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <MultiSelectBadges
                          options={committeeResponsibilityOptions}
                          selected={selectedCommitteeResponsibilities}
                          onSelectionChange={
                            setSelectedCommitteeResponsibilities
                          }
                          label="Committee Responsibilities"
                        />
                      </div>

                      <FormField
                        control={governanceForm.control}
                        name="reportingLine"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reporting Line</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select reporting line" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {reportingLineOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Who does this committee report to?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={governanceForm.control}
                        name="charterDocument"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Charter Document*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Upload charter document"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Upload the formal document defining the
                              committee's scope and duties
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          saveGovernanceStructure.isPending ||
                          (user?.role === "consultant"
                            ? selectedClient === ""
                            : false)
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saveGovernanceStructure.isPending
                          ? "Saving..."
                          : "Save Structure"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. ESG Policy Register */}
          <TabsContent value="esg-policies">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5 text-green-600" />
                    ESG Policy Register
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Maintain a comprehensive register of all ESG-related
                    policies
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...policyForm}>
                    <form
                      onSubmit={policyForm.handleSubmit(saveEsgPolicy.mutate)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={policyForm.control}
                          name="policyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Policy Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter policy name"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter the official title of the policy
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={policyForm.control}
                          name="policyCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Policy Category *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select policy category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {policyCategoryOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Classify the policy based on its thematic scope
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="md:col-span-2">
                          <MultiSelectBadges
                            options={appliesToOptions}
                            selected={selectedAppliesTo}
                            onSelectionChange={setSelectedAppliesTo}
                            label="Applies To"
                          />
                        </div>

                        <FormField
                          control={policyForm.control}
                          name="policyStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Policy Status *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select policy status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {policyStatusOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Specify the current development status of the
                                policy
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={policyForm.control}
                          name="dateOfLastReview"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Last Review</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() ||
                                      date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                Select the most recent date this policy was
                                reviewed
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={policyForm.control}
                          name="policyDocument"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Policy Document</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Upload policy document"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Attach the policy file for reference (PDF/DOC)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            saveEsgPolicy.isPending ||
                            (user?.role === "consultant"
                              ? selectedClient === ""
                              : false)
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {saveEsgPolicy.isPending
                            ? "Saving..."
                            : editingPolicy
                            ? "Update Policy"
                            : "Add Policy"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Existing Policies List */}
              {esgPolicies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Existing ESG Policies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {esgPolicies.map((policy: any) => {
                        console.log("Policy:", policy);

                        return (
                          <div
                            key={policy.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium">
                                {policy.policyName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {policy.policyCategory}
                              </p>
                              <Badge variant="secondary" className="mt-1">
                                {policy.policyStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingPolicy(policy)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  deleteEsgPolicyMutation.mutate(policy.id)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* 3. ESG-Linked Incentives */}
          <TabsContent value="esg-incentives">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  ESG-Linked Incentives
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure ESG criteria in executive compensation and incentive
                  structures
                </p>
              </CardHeader>
              <CardContent>
                <Form {...incentivesForm}>
                  <form
                    onSubmit={incentivesForm.handleSubmit(
                      saveEsgIncentives.mutate
                    )}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={incentivesForm.control}
                        name="isEsgUsedInCompensation"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                ESG Criteria in Executive Compensation
                              </FormLabel>
                              <FormDescription>
                                Is part of variable executive pay tied to
                                sustainability performance?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={incentivesForm.control}
                        name="weightOfEsgInVariablePay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Weight of ESG in Variable Pay (%)*
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter percentage"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the percentage weight of ESG performance in
                              overall variable pay
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <MultiSelectBadges
                          options={applicableRolesOptions}
                          selected={selectedApplicableRoles}
                          onSelectionChange={setSelectedApplicableRoles}
                          label="Applicable Roles"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <MultiSelectBadges
                          options={linkedEsgKpiOptions}
                          selected={selectedLinkedEsgKpis}
                          onSelectionChange={setSelectedLinkedEsgKpis}
                          label="Linked ESG KPIs"
                        />
                      </div>

                      <FormField
                        control={incentivesForm.control}
                        name="compensationApprovalBody"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compensation Approval Body</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select approval body" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {compensationApprovalBodyOptions.map(
                                  (option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Who approves the incentive structure?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={incentivesForm.control}
                        name="narrativeOnEsgIncentives"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Narrative on ESG Incentives</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe how ESG incentives are structured, assessed, and verified..."
                                {...field}
                                rows={4}
                              />
                            </FormControl>
                            <FormDescription>
                              Describe how ESG incentives are structured,
                              assessed, and verified
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          saveEsgIncentives.isPending ||
                          (user?.role === "consultant"
                            ? selectedClient === ""
                            : false)
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saveEsgIncentives.isPending
                          ? "Saving..."
                          : "Save Incentives"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Internal ESG Information Flows */}
          <TabsContent value="information-flows">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-green-600" />
                  Internal ESG Information Flows
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Define how ESG information flows within your organization
                </p>
              </CardHeader>
              <CardContent>
                <Form {...informationFlowsForm}>
                  <form
                    onSubmit={informationFlowsForm.handleSubmit(
                      saveEsgInformationFlows.mutate
                    )}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <MultiSelectBadges
                          options={whoTracksEsgKpiOptions}
                          selected={selectedWhoTracksEsgKpis}
                          onSelectionChange={setSelectedWhoTracksEsgKpis}
                          label="Who Tracks ESG KPIs"
                        />
                      </div>

                      <FormField
                        control={informationFlowsForm.control}
                        name="esgReportingFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              ESG Reporting Frequency (Internal)*
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {esgReportingFrequencyOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How often are ESG metrics shared within the
                              organization?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <MultiSelectBadges
                          options={internalEsgReportRecipientsOptions}
                          selected={selectedInternalEsgReportRecipients}
                          onSelectionChange={
                            setSelectedInternalEsgReportRecipients
                          }
                          label="Internal ESG Report Recipients"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <MultiSelectBadges
                          options={formatsOfEsgReportingOptions}
                          selected={selectedFormatsOfEsgReporting}
                          onSelectionChange={setSelectedFormatsOfEsgReporting}
                          label="Formats of ESG Reporting"
                        />
                      </div>

                      <FormField
                        control={informationFlowsForm.control}
                        name="narrativeDescriptionOfEsgDataFlow"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>
                              Narrative Description of ESG Data Flow*
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Explain the flow of ESG information — from collection to internal reporting..."
                                {...field}
                                rows={4}
                              />
                            </FormControl>
                            <FormDescription>
                              Explain the flow of ESG information — from
                              collection to internal reporting
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          saveEsgInformationFlows.isPending ||
                          (user?.role === "consultant"
                            ? selectedClient === ""
                            : false)
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saveEsgInformationFlows.isPending
                          ? "Saving..."
                          : "Save Information Flows"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. ESG Integration into Core Business Processes */}
          <TabsContent value="integration">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  ESG Integration into Core Business Processes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Define how ESG considerations are embedded into business
                  processes
                </p>
              </CardHeader>
              <CardContent>
                <Form {...integrationForm}>
                  <form
                    onSubmit={integrationForm.handleSubmit(
                      saveEsgIntegration.mutate
                    )}
                    className="space-y-6"
                  >
                    <div className="space-y-6">
                      <FormField
                        control={integrationForm.control}
                        name="whereIsEsgIntegrated"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Where is ESG Integrated*</FormLabel>
                            <FormControl>
                              <MultiSelectBadges
                                options={esgIntegrationOptions}
                                selected={selectedEsgIntegration}
                                onSelectionChange={(values) => {
                                  setSelectedEsgIntegration(values);
                                  field.onChange(values);
                                }}
                                label=""
                              />
                            </FormControl>
                            <FormDescription>
                              Select all areas where ESG considerations are
                              integrated
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={integrationForm.control}
                        name="narrativeOnEsgIntegration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Narrative on ESG Integration*</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Explain how ESG is embedded into decision-making processes..."
                                {...field}
                                rows={6}
                              />
                            </FormControl>
                            <FormDescription>
                              Explain how ESG is embedded into decision-making
                              processes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          saveEsgIntegration.isPending ||
                          (user?.role === "consultant"
                            ? selectedClient === ""
                            : false)
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saveEsgIntegration.isPending
                          ? "Saving..."
                          : "Save Integration"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
