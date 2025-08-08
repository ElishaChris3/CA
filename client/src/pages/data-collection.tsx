import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Leaf,
  Users,
  Building,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Upload,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEsgDataKpiSchema } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";

// KPI Form Schema
const kpiFormSchema = insertEsgDataKpiSchema.omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
});

type KpiFormData = z.infer<typeof kpiFormSchema>;

// ESG Topic structure based on ESRS
const ESG_TOPICS = {
  environment: {
    title: "Environment (E)",
    icon: Leaf,
    color: "text-green-600",
    topics: [
      {
        code: "E1",
        title: "Climate Change",
        kpis: [
          {
            name: "Scope 1 GHG Emissions",
            unit: "tCO₂e",
            type: "quantitative",
          },
          {
            name: "Scope 2 GHG Emissions",
            unit: "tCO₂e",
            type: "quantitative",
          },
          {
            name: "Scope 3 GHG Emissions",
            unit: "tCO₂e",
            type: "quantitative",
          },
          { name: "Energy Consumption", unit: "kWh", type: "quantitative" },
          {
            name: "Energy Intensity per Revenue",
            unit: "kWh/EUR",
            type: "ratio",
          },
          { name: "Emissions Intensity", unit: "tCO₂e/FTE", type: "ratio" },
          { name: "Carbon Reduction Target", unit: "%", type: "ratio" },
        ],
      },
      {
        code: "E2",
        title: "Pollution",
        kpis: [
          {
            name: "NOx, SOx, PM emissions",
            unit: "kg/year",
            type: "quantitative",
          },
          {
            name: "Chemical Use (by substance)",
            unit: "kg",
            type: "quantitative",
          },
          {
            name: "Hazardous Waste Generated",
            unit: "Tonnes/year",
            type: "quantitative",
          },
        ],
      },
      {
        code: "E3",
        title: "Water & Marine Resources",
        kpis: [
          { name: "Water Withdrawal", unit: "m³", type: "quantitative" },
          { name: "Water Consumption", unit: "m³", type: "quantitative" },
          { name: "Discharges to Water", unit: "m³", type: "quantitative" },
          { name: "% Water Recycled", unit: "%", type: "ratio" },
        ],
      },
      {
        code: "E4",
        title: "Biodiversity & Ecosystems",
        kpis: [
          {
            name: "Sites near sensitive biodiversity areas",
            unit: "Count",
            type: "quantitative",
          },
          {
            name: "Land Use (hectares converted)",
            unit: "ha/year",
            type: "quantitative",
          },
          { name: "Restoration Projects", unit: "Text", type: "qualitative" },
        ],
      },
      {
        code: "E5",
        title: "Circular Economy & Resource Use",
        kpis: [
          {
            name: "Total Waste Generated",
            unit: "Tonnes",
            type: "quantitative",
          },
          { name: "% Waste Recycled", unit: "%", type: "ratio" },
          { name: "Reused Material Share", unit: "%", type: "ratio" },
          { name: "Packaging Circularity", unit: "%", type: "ratio" },
        ],
      },
    ],
  },
  social: {
    title: "Social (S)",
    icon: Users,
    color: "text-blue-600",
    topics: [
      {
        code: "S1",
        title: "Own Workforce",
        kpis: [
          {
            name: "Total Employees",
            unit: "Count (FTEs)",
            type: "quantitative",
          },
          { name: "Gender Ratio", unit: "%", type: "ratio" },
          { name: "Pay Gap (gender)", unit: "%", type: "ratio" },
          {
            name: "Training Hours per Employee",
            unit: "Hours/year",
            type: "quantitative",
          },
          {
            name: "Occupational Injuries (LTIR)",
            unit: "Rate per 1M hours",
            type: "quantitative",
          },
          { name: "Turnover Rate", unit: "%", type: "ratio" },
        ],
      },
      {
        code: "S2",
        title: "Workers in Value Chain",
        kpis: [
          {
            name: "% Suppliers Screened for Labor Practices",
            unit: "%",
            type: "ratio",
          },
          {
            name: "Human Rights Incidents",
            unit: "Count/year",
            type: "quantitative",
          },
          { name: "Audits Conducted", unit: "Count", type: "quantitative" },
          {
            name: "Remediation Actions Taken",
            unit: "Count",
            type: "quantitative",
          },
        ],
      },
      {
        code: "S3",
        title: "Affected Communities",
        kpis: [
          {
            name: "Community Engagement Projects",
            unit: "Count",
            type: "quantitative",
          },
          { name: "% Revenue in High-Risk Areas", unit: "%", type: "ratio" },
          { name: "Displacement Events", unit: "Count", type: "quantitative" },
        ],
      },
      {
        code: "S4",
        title: "Consumers/End-users",
        kpis: [
          {
            name: "Product Safety Incidents",
            unit: "Count/year",
            type: "quantitative",
          },
          {
            name: "Customer Satisfaction Score",
            unit: "Index (1-10)",
            type: "quantitative",
          },
          {
            name: "Complaints Received & Resolved",
            unit: "Count",
            type: "quantitative",
          },
        ],
      },
    ],
  },
  governance: {
    title: "Governance (G)",
    icon: Building,
    color: "text-purple-600",
    topics: [
      {
        code: "G1",
        title: "Business Conduct",
        kpis: [
          { name: "Code of Conduct Training %", unit: "%", type: "ratio" },
          { name: "Whistleblower Cases", unit: "Count", type: "quantitative" },
          {
            name: "Anti-corruption Incidents",
            unit: "Count",
            type: "quantitative",
          },
          { name: "Legal Fines Paid", unit: "EUR/year", type: "monetary" },
        ],
      },
      {
        code: "GOV-2",
        title: "Governance Roles & Oversight",
        kpis: [
          {
            name: "ESG Responsibility at Board Level",
            unit: "Text",
            type: "qualitative",
          },
          {
            name: "Executive Compensation Linked to ESG",
            unit: "Yes/No",
            type: "qualitative",
          },
          {
            name: "ESG Performance Oversight Frequency",
            unit: "Frequency",
            type: "qualitative",
          },
        ],
      },
    ],
  },
};

// Dropdown options
const DATA_OWNERS = [
  "Sustainability Officer",
  "HR",
  "Finance",
  "Legal",
  "Procurement",
  "External Consultant",
];

const SOURCE_TYPES = [
  "ERP",
  "HRIS",
  "Utility Bill",
  "IoT Sensors",
  "Supplier Reports",
  "Audit Logs",
];

const COLLECTION_FREQUENCIES = [
  "Real-Time",
  "Monthly",
  "Quarterly",
  "Annually",
];

const COLLECTION_METHODS = [
  "Manual Entry",
  "Spreadsheet Upload",
  "Automated Feed/API",
  "Audit Submission",
];

const ASSURANCE_LEVELS = [
  "None",
  "Limited Assurance",
  "Reasonable Assurance",
  "Third-Party Certified",
];

const VERIFICATION_STATUSES = [
  "Not Verified",
  "Internally Reviewed",
  "Third-Party Verified",
];

const CONFIDENTIALITY_LEVELS = [
  "Public Disclosure",
  "Internal Only",
  "Sensitive (Management Only)",
];

const REFERENCE_STANDARDS = [
  "GHG Protocol",
  "ISO 14064",
  "EU Taxonomy",
  "TCFD",
  "SASB",
  "GRI",
  "Custom",
];

export default function DataCollection() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("environment");
  const [selectedClient, setSelectedClient] = useState<string | number>(
    user?.role === "consultant" ? "none" : undefined
  );
  const isNoneSelected =
    selectedClient === "none" && user?.role === "consultant";
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [selectedKpi, setSelectedKpi] = useState<any>(null);
  const [isKpiDialogOpen, setIsKpiDialogOpen] = useState(false);
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
  const [selectedReferenceStandards, setSelectedReferenceStandards] = useState<
    string[]
  >([]);

  const queryClient = useQueryClient();

  // Fetch client organizations for consultants
  const { data: clientOrganizations } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user && user.role === "consultant",
  });

  console.log(selectedClient, "Selected Client in Data Collection");

  // Fetch ESG data KPIs
  const { data: esgKpis = [], isLoading } = useQuery({
    queryKey: [`/api/esg-data-kpis?organizationId=${selectedClient}`],
    queryFn: async () => {
      if (isNoneSelected) return [];
      const response = await apiRequest(
        `/api/esg-data-kpis?organizationId=${selectedClient}`,
        "GET"
      );
      return response.json();
    },
    enabled: !isNoneSelected,
  });

  console.log("ESG KPIs:", esgKpis);
  console.log("Selected Client:", selectedClient);

  // KPI form
  const form = useForm<KpiFormData>({
    resolver: zodResolver(kpiFormSchema),
    defaultValues: {
      kpiName: "",
      esgSection: "environment",
      esrsTopic: "",
      topicTitle: "",
      metricType: "quantitative",
      unitOfMeasure: "",
      referenceStandard: [],
      baselineYear: new Date().getFullYear(),
      dataOwner: "",
      sourceType: [],
      collectionFrequency: "",
      collectionMethod: "",
      assuranceLevel: "",
      verificationStatus: "",
      confidentialityLevel: "",
      currentValue: "",
      reportingPeriod: "",
      notes: "",
      supportingFiles: [],
      isActive: true,
      completionStatus: "missing",
    },
  });

  // Create/Update KPI mutation
  const saveKpi = useMutation({
    mutationFn: async (data: KpiFormData) => {
      const kpiData = {
        ...data,
        organizationId: selectedClient,
        sourceType: selectedSourceTypes,
        referenceStandard: selectedReferenceStandards,
      };

      if (selectedKpi?.id) {
        return await apiRequest(
          `/api/esg-data-kpis/${selectedKpi.id}`,
          "PUT",
          kpiData
        );
      } else {
        return await apiRequest("/api/esg-data-kpis", "POST", kpiData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/esg-data-kpis?organizationId=${selectedClient}`],
      });
      toast({
        title: "Success",
        description: selectedKpi?.id
          ? "KPI updated successfully"
          : "KPI created successfully",
      });
      setIsKpiDialogOpen(false);
      setSelectedKpi(null);
      form.reset({
        kpiName: "",
        esgSection: "environment",
        esrsTopic: "",
        topicTitle: "",
        metricType: "quantitative",
        unitOfMeasure: "",
        referenceStandard: [],
        baselineYear: new Date().getFullYear(),
        dataOwner: "",
        sourceType: [],
        collectionFrequency: "",
        collectionMethod: "",
        assuranceLevel: "",
        verificationStatus: "",
        confidentialityLevel: "",
        currentValue: "",
        reportingPeriod: "",
        notes: "",
        supportingFiles: [],
        isActive: true,
        completionStatus: "missing",
      });
      setSelectedSourceTypes([]);
      setSelectedReferenceStandards([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save KPI",
        variant: "destructive",
      });
    },
  });

  // Delete KPI mutation
  const deleteKpi = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/esg-data-kpis/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/esg-data-kpis?organizationId=${selectedClient}`],
      });
      toast({
        title: "Success",
        description: "KPI deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete KPI",
        variant: "destructive",
      });
    },
  });

  // Toggle topic expansion
  const toggleTopic = (topicCode: string) => {
    setExpandedTopics((prev) =>
      prev.includes(topicCode)
        ? prev.filter((t) => t !== topicCode)
        : [...prev, topicCode]
    );
  };

  // Open KPI dialog for editing
  const openKpiDialog = (kpi: any = null, predefinedData: any = null) => {
    setSelectedKpi(kpi);
    setIsKpiDialogOpen(true);

    if (kpi) {
      form.reset(kpi);
      setSelectedSourceTypes(kpi.sourceType || []);
      setSelectedReferenceStandards(kpi.referenceStandard || []);
    } else if (predefinedData) {
      form.reset({
        ...form.getValues(),
        kpiName: predefinedData.name,
        esgSection: activeSection,
        esrsTopic: predefinedData.topic,
        topicTitle: predefinedData.topicTitle,
        metricType: predefinedData.type,
        unitOfMeasure: predefinedData.unit,
      });
    } else {
      form.reset({
        kpiName: "",
        esgSection: "environment",
        esrsTopic: "",
        topicTitle: "",
        metricType: "quantitative",
        unitOfMeasure: "",
        referenceStandard: [],
        baselineYear: new Date().getFullYear(),
        dataOwner: "",
        sourceType: [],
        collectionFrequency: "",
        collectionMethod: "",
        assuranceLevel: "",
        verificationStatus: "",
        confidentialityLevel: "",
        currentValue: "",
        reportingPeriod: "",
        notes: "",
        supportingFiles: [],
        isActive: true,
        completionStatus: "missing",
      });
      setSelectedSourceTypes([]);
      setSelectedReferenceStandards([]);
    }
  };

  // Filter KPIs
  const filteredKpis = esgKpis.filter((kpi) => {
    const matchesSection =
      filterSection === "all" || kpi.esgSection === filterSection;
    const matchesStatus =
      filterStatus === "all" || kpi.completionStatus === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      kpi.kpiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.topicTitle.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSection && matchesStatus && matchesSearch;
  });

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "partial":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "missing":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Multi-select component for arrays
  const MultiSelectBadges = ({
    options,
    selected,
    onSelectionChange,
    label,
  }: any) => {
    const toggleSelection = (value: string) => {
      if (selected.includes(value)) {
        onSelectionChange(selected.filter((item: string) => item !== value));
      } else {
        onSelectionChange([...selected, value]);
      }
    };

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
          {selected.map((item: string) => (
            <Badge
              key={item}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100"
              onClick={() => toggleSelection(item)}
            >
              {item} ×
            </Badge>
          ))}
        </div>
        <Select onValueChange={toggleSelection}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ESG Data Collection
            </h1>
            <p className="text-gray-600 mt-1">
              Collect and manage ESG KPIs across Environment, Social, and
              Governance topics
            </p>
          </div>
          <Button onClick={() => openKpiDialog()} disabled={isNoneSelected}>
            <Plus className="w-4 h-4 mr-2" />
            Add Custom KPI
          </Button>
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

        <Tabs
          value={activeSection}
          onValueChange={setActiveSection}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="environment"
              className="flex items-center gap-2"
            >
              <Leaf className="w-4 h-4" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="governance" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Governance
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Environment Tab */}
          <TabsContent value="environment">
            <div className="space-y-4">
              {ESG_TOPICS.environment.topics.map((topic) => (
                <Card key={topic.code}>
                  <Collapsible
                    open={expandedTopics.includes(topic.code)}
                    onOpenChange={() => toggleTopic(topic.code)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Leaf className="w-5 h-5 text-green-600" />
                          <div className="text-left">
                            <CardTitle className="text-lg">
                              {topic.code} - {topic.title}
                            </CardTitle>
                            <CardDescription>
                              {topic.kpis.length} KPIs available
                            </CardDescription>
                          </div>
                        </div>
                        {expandedTopics.includes(topic.code) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {topic.kpis.map((kpi, index) => (
                            <Card
                              key={index}
                              className="p-4 border-l-4 border-l-green-500"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{kpi.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {kpi.unit}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {kpi.type}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openKpiDialog(null, {
                                      ...kpi,
                                      topic: topic.code,
                                      topicTitle: topic.title,
                                    })
                                  }
                                  disabled={isNoneSelected}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social">
            <div className="space-y-4">
              {ESG_TOPICS.social.topics.map((topic) => (
                <Card key={topic.code}>
                  <Collapsible
                    open={expandedTopics.includes(topic.code)}
                    onOpenChange={() => toggleTopic(topic.code)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-blue-600" />
                          <div className="text-left">
                            <CardTitle className="text-lg">
                              {topic.code} - {topic.title}
                            </CardTitle>
                            <CardDescription>
                              {topic.kpis.length} KPIs available
                            </CardDescription>
                          </div>
                        </div>
                        {expandedTopics.includes(topic.code) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {topic.kpis.map((kpi, index) => (
                            <Card
                              key={index}
                              className="p-4 border-l-4 border-l-blue-500"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{kpi.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {kpi.unit}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {kpi.type}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openKpiDialog(null, {
                                      ...kpi,
                                      topic: topic.code,
                                      topicTitle: topic.title,
                                    })
                                  }
                                  disabled={isNoneSelected}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance">
            <div className="space-y-4">
              {ESG_TOPICS.governance.topics.map((topic) => (
                <Card key={topic.code}>
                  <Collapsible
                    open={expandedTopics.includes(topic.code)}
                    onOpenChange={() => toggleTopic(topic.code)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-purple-600" />
                          <div className="text-left">
                            <CardTitle className="text-lg">
                              {topic.code} - {topic.title}
                            </CardTitle>
                            <CardDescription>
                              {topic.kpis.length} KPIs available
                            </CardDescription>
                          </div>
                        </div>
                        {expandedTopics.includes(topic.code) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {topic.kpis.map((kpi, index) => (
                            <Card
                              key={index}
                              className="p-4 border-l-4 border-l-purple-500"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{kpi.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {kpi.unit}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {kpi.type}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openKpiDialog(null, {
                                      ...kpi,
                                      topic: topic.code,
                                      topicTitle: topic.title,
                                    })
                                  }
                                  disabled={isNoneSelected}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter & Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="search">Search KPIs</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Search by name or topic..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="section-filter">ESG Section</Label>
                      <Select
                        value={filterSection}
                        onValueChange={setFilterSection}
                      >
                        <SelectTrigger id="section-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sections</SelectItem>
                          <SelectItem value="environment">
                            Environment
                          </SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="governance">Governance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status-filter">Status</Label>
                      <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                      >
                        <SelectTrigger id="status-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="missing">Missing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPIs Table */}
              <Card>
                <CardHeader>
                  <CardTitle>ESG KPIs ({filteredKpis.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>KPI Name</TableHead>
                        <TableHead>Data Value</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKpis.map((kpi) => (
                        <TableRow key={kpi.id}>
                          <TableCell>
                            {getStatusIcon(kpi.completionStatus)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {kpi.kpiName}
                          </TableCell>
                          <TableCell className="font-mono">
                            {kpi.currentValue ? (
                              <span className="bg-blue-50 px-2 py-1 rounded text-blue-700">
                                {kpi.currentValue}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">
                                No data
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{kpi.esgSection}</Badge>
                          </TableCell>
                          <TableCell>{kpi.esrsTopic}</TableCell>
                          <TableCell>{kpi.metricType}</TableCell>
                          <TableCell>{kpi.unitOfMeasure}</TableCell>
                          <TableCell>{kpi.dataOwner}</TableCell>
                          <TableCell>
                            {kpi.lastUpdated
                              ? new Date(kpi.lastUpdated).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  disabled={isNoneSelected}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openKpiDialog(kpi)}
                                  disabled={isNoneSelected}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteKpi.mutate(kpi.id)}
                                  className="text-red-600"
                                  disabled={isNoneSelected}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* KPI Dialog */}
        <Dialog open={isKpiDialogOpen} onOpenChange={setIsKpiDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedKpi ? "Edit KPI" : "Add New KPI"}
              </DialogTitle>
              <DialogDescription>
                Enter the details for this ESG KPI
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(saveKpi.mutate)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="kpiName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KPI Name *</FormLabel>
                        <FormDescription>
                          Enter the name of the KPI
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="e.g., Scope 1 GHG Emissions"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="esgSection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ESG Section *</FormLabel>
                        <FormDescription>
                          Select the ESG section
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ESG section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="environment">
                              Environment
                            </SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="governance">
                              Governance
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="esrsTopic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ESRS Topic *</FormLabel>
                        <FormDescription>
                          Enter the ESRS topic code (e.g., E1, S1, G1)
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="e.g., E1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="topicTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic Title *</FormLabel>
                        <FormDescription>Enter the topic title</FormDescription>
                        <FormControl>
                          <Input
                            placeholder="e.g., Climate Change"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metricType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metric Type *</FormLabel>
                        <FormDescription>
                          Select the type of metric
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select metric type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="quantitative">
                              Quantitative
                            </SelectItem>
                            <SelectItem value="qualitative">
                              Qualitative
                            </SelectItem>
                            <SelectItem value="monetary">Monetary</SelectItem>
                            <SelectItem value="ratio">Ratio</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitOfMeasure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit of Measure *</FormLabel>
                          <FormDescription>
                            Enter the unit of measurement
                          </FormDescription>
                          <FormControl>
                            <Input
                              placeholder="e.g., tCO₂e, kWh, %"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentValue"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormLabel>Data Value</FormLabel>
                            <div className="relative group">
                              <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 whitespace-nowrap z-10">
                                Enter the measured or calculated value for this
                                KPI
                              </div>
                            </div>
                          </div>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 2000, 45.6, 98.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dataOwner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Owner *</FormLabel>
                        <FormDescription>
                          Who is responsible for this data?
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select data owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DATA_OWNERS.map((owner) => (
                              <SelectItem key={owner} value={owner}>
                                {owner}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collectionFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Frequency *</FormLabel>
                        <FormDescription>
                          How often is this data collected?
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
                            {COLLECTION_FREQUENCIES.map((freq) => (
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
                    control={form.control}
                    name="collectionMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Method *</FormLabel>
                        <FormDescription>
                          How is this data collected?
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COLLECTION_METHODS.map((method) => (
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

                  <FormField
                    control={form.control}
                    name="assuranceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assurance Level *</FormLabel>
                        <FormDescription>
                          What level of assurance applies?
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assurance level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ASSURANCE_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="verificationStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Status *</FormLabel>
                        <FormDescription>
                          What is the verification status?
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select verification status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VERIFICATION_STATUSES.map((status) => (
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

                  <FormField
                    control={form.control}
                    name="confidentialityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confidentiality Level *</FormLabel>
                        <FormDescription>
                          What is the confidentiality level?
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select confidentiality level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONFIDENTIALITY_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="baselineYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baseline Year</FormLabel>
                        <FormDescription>
                          Enter the baseline year for this KPI
                        </FormDescription>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2024"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportingPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Period</FormLabel>
                        <FormDescription>
                          Enter the reporting period
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="e.g., Q1 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <MultiSelectBadges
                      options={SOURCE_TYPES}
                      selected={selectedSourceTypes}
                      onSelectionChange={setSelectedSourceTypes}
                      label="Source Types"
                    />
                  </div>
                  <div>
                    <MultiSelectBadges
                      options={REFERENCE_STANDARDS}
                      selected={selectedReferenceStandards}
                      onSelectionChange={setSelectedReferenceStandards}
                      label="Reference Standards"
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormDescription>
                        Add any additional notes about this KPI
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes..."
                          className="min-h-[100px]"
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
                    onClick={() => setIsKpiDialogOpen(false)}
                    disabled={isNoneSelected}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveKpi.isPending || isNoneSelected}
                  >
                    {saveKpi.isPending
                      ? "Saving..."
                      : selectedKpi
                      ? "Update KPI"
                      : "Create KPI"}
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
