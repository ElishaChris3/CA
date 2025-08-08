import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CalendarIcon,
  Plus,
  Upload,
  FileText,
  Download,
  Globe,
  Building,
  Users,
  Target,
  Leaf,
  MapPin,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";

// Form validation schemas
const entityScopeSchema = z.object({
  legalName: z
    .string()
    .min(1, "Legal name is required")
    .max(50, "Max 50 characters allowed"),
  legalForm: z.string().min(1, "Legal form is required"),
  registeredAddress: z.string().min(1, "Registered address is required"),
  country: z.string().min(1, "Country is required"),
  naceSectorCode: z.string().min(1, "NACE sector code is required"),
  fiscalYearEnd: z.date(),
  parentCompany: z.string().optional(),
  reportingBasis: z.string().min(1, "Reporting basis is required"),
});

const subsidiarySchema = z.object({
  name: z
    .string()
    .min(1, "Subsidiary name is required")
    .max(50, "Max 50 characters allowed"),
  country: z.string().min(1, "Country is required"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(200, "Max 200 characters allowed"),
  ownershipPercentage: z
    .number()
    .min(1, "Ownership percentage must be at least 1%")
    .max(100, "Ownership percentage cannot exceed 100%"),
  legalForm: z.string().min(1, "Legal form is required"),
  relationToParent: z.string().min(1, "Relation to parent is required"),
});

const facilitySchema = z.object({
  name: z
    .string()
    .min(1, "Facility name is required")
    .max(50, "Max 50 characters allowed"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional(),
  facilityType: z.string().min(1, "Facility type is required"),
  description: z.string().optional(),
});

const businessModelSchema = z.object({
  keyProducts: z
    .array(z.string())
    .min(1, "Select at least one product/service"),
  primaryMarkets: z.array(z.string()).min(1, "Select at least one market"),
  supplyChainDescription: z
    .string()
    .min(10, "Provide a detailed supply chain description"),
});

const SustainabilityKPIsSchema = z.object({
  goalTitle: z.string().min(1, "Goal title is required"),
  currentProgress: z
    .number()
    .min(1, "Current progress must be at least 1")
    .max(100, "Current progress cannot exceed 100"),
  goalDescription: z.string().min(10, "Goal description is required"),
  kpiIndicators: z
    .array(z.string())
    .min(1, "Select at least one KPI/Indicator"),
});

const industryClassificationSchema = z.object({
  industryCode: z.string().min(1, "Industry code is required"),
  euTaxonomyEligible: z.boolean(),
  euTaxonomyDetails: z.string().optional(),
  activityDescription: z.string().min(10, "Activity description is required"),
  sectorClassification: z.string().min(1, "Sector classification is required"),
  sustainabilityClassification: z
    .string()
    .min(1, "Sustainability classification is required"),
});

const geographySchema = z.object({
  countriesOfOperation: z
    .array(z.string())
    .min(1, "Select at least one country"),
  registeredHQ: z.string().min(1, "Registered HQ is required"),
  numberOfProductionSites: z.number().min(1, "Number must be at least 1"),
  siteLocations: z.string().optional(),
  marketRegions: z.array(z.string()).min(1, "Select at least one region"),
});

const businessStrategySchema = z.object({
  sustainabilityPolicies: z
    .string()
    .min(1, "Provide detailed sustainability policies"),
  netZeroTarget: z.number().min(0).max(100, "Target must be between 0–100%"),
  netZeroTargetDate: z.date(),
  circularEconomyInitiatives: z
    .string()
    .min(10, "Describe circular economy initiatives"),
  governanceOversight: z.string().min(1, "Governance oversight is required"),
  transitionUpdates: z.string().min(10, "Provide transition updates"),
});

const sustainabilityInitiativesSchema = z.object({
  initiativeName: z
    .string()
    .min(1, "Initiative name is required")
    .max(50, "Max 50 characters allowed"),
  currentStatus: z.string().min(1, "Current status is required"),
  targetImpact: z.string().min(1, "Target impact is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Max 50 characters allowed"),
});

type EntityScopeForm = z.infer<typeof entityScopeSchema>;
type SubsidiaryForm = z.infer<typeof subsidiarySchema>;
type BusinessModelForm = z.infer<typeof businessModelSchema>;
type IndustryClassificationForm = z.infer<typeof industryClassificationSchema>;
type GeographyForm = z.infer<typeof geographySchema>;
type BusinessStrategyForm = z.infer<typeof businessStrategySchema>;
type FacilityForm = z.infer<typeof facilitySchema>;
type SustainabilityInitiativesForm = z.infer<
  typeof sustainabilityInitiativesSchema
>;
type SustainabilityInitiativesFormArray = z.infer<
  typeof sustainabilityInitiativesSchema
>;
type SustainabilityKPIsForm = z.infer<typeof SustainabilityKPIsSchema>;
type SustainabilityKPIsFormArray = z.infer<typeof SustainabilityKPIsSchema>;

// Options for dropdowns
const legalFormOptions = [
  { value: "LLC", label: "Limited Liability Company (LLC)" },
  { value: "PLC", label: "Public Limited Company (PLC)" },
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership" },
  { value: "Other", label: "Other" },
];

const productServiceOptions = [
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Retail", label: "Retail" },
  { value: "Energy", label: "Energy" },
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Construction", label: "Construction" },
  { value: "Financial Services", label: "Financial Services" },
  { value: "Education", label: "Education" },
  { value: "Transportation & Logistics", label: "Transportation & Logistics" },
  { value: "Other", label: "Other" },
];

const marketOptions = [
  { value: "Domestic", label: "Domestic" },
  { value: "Regional", label: "Regional" },
  { value: "International", label: "International" },
  { value: "Other", label: "Other" },
];

const sectorOptions = [
  { value: "Agriculture", label: "Agriculture" },
  { value: "Energy", label: "Energy" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Financial Services", label: "Financial Services" },
  { value: "Construction", label: "Construction" },
  { value: "Education", label: "Education" },
  { value: "Transportation", label: "Transportation" },
  { value: "Other", label: "Other" },
];

const sustainabilityClassificationOptions = [
  { value: "Sustainable", label: "Sustainable" },
  { value: "Non-Sustainable", label: "Non-Sustainable" },
  { value: "Partially Sustainable", label: "Partially Sustainable" },
];

const governanceOptions = [
  { value: "Board-Level Oversight", label: "Board-Level Oversight" },
  { value: "Department-Level Oversight", label: "Department-Level Oversight" },
  { value: "Executive-Level Oversight", label: "Executive-Level Oversight" },
  { value: "Management-Level Oversight", label: "Management-Level Oversight" },
];

const facilityTypeOptions = [
  { value: "Headquarters", label: "Headquarters" },
  { value: "Manufacturing", label: "Manufacturing Facility" },
  { value: "Office", label: "Office" },
  { value: "Warehouse", label: "Warehouse/Distribution Center" },
  { value: "Research", label: "Research & Development" },
  { value: "Retail", label: "Retail Store" },
  { value: "Service", label: "Service Center" },
  { value: "Other", label: "Other" },
];

const countryOptions = [
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "UK", label: "United Kingdom" },
  { value: "USA", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Spain", label: "Spain" },
  { value: "Italy", label: "Italy" },
  { value: "Other", label: "Other" },
];

// Mock NACE codes for demo
const naceCodeOptions = [
  { value: "A01", label: "A01 - Crop and animal production" },
  { value: "B05", label: "B05 - Mining of coal and lignite" },
  { value: "C10", label: "C10 - Manufacture of food products" },
  {
    value: "D35",
    label: "D35 - Electricity, gas, steam and air conditioning supply",
  },
  { value: "F41", label: "F41 - Construction of buildings" },
  { value: "G45", label: "G45 - Wholesale and retail trade" },
  { value: "H49", label: "H49 - Land transport and transport via pipelines" },
  { value: "J62", label: "J62 - Computer programming, consultancy" },
  { value: "K64", label: "K64 - Financial service activities" },
  {
    value: "M70",
    label: "M70 - Activities of head offices; management consultancy",
  },
];

const reportingBasisOptions = [
  { value: "Group-level (Consolidated)", label: "Group-level (Consolidated)" },
  {
    value: "Individual Entity (Standalone)",
    label: "Individual Entity (Standalone)",
  },
];

interface SubsidiaryFormData {
  name: string;
  country: string;
  address: string;
  ownershipPercentage: number;
  legalForm: string;
  relationToParent: string;
}

// Ownership structure validation schema
const ownershipStructureSchema = z.object({
  entityName: z
    .string()
    .min(1, "Entity name is required")
    .max(100, "Entity name must be less than 100 characters"),
  role: z.enum(["Parent", "Subsidiary", "Shareholder"], {
    required_error: "Role is required",
    invalid_type_error: "Invalid role selected",
  }),
  ownershipPercentage: z
    .number()
    .min(1, "Ownership percentage cannot be negative")
    .max(100, "Ownership percentage cannot exceed 100%")
    .refine((val) => !isNaN(val), {
      message: "Ownership percentage must be a number",
    }),
});

// Enhanced ownership structure array validation
const ownershipStructureArraySchema = z.array(ownershipStructureSchema).refine(
  (entries) => {
    // Check that percentages don't exceed 100% for the same entity
    const entityTotals: Record<string, number> = {};

    for (const entry of entries) {
      if (!entityTotals[entry.entityName]) {
        entityTotals[entry.entityName] = 0;
      }
      entityTotals[entry.entityName] += entry.ownershipPercentage;

      if (entityTotals[entry.entityName] > 100) {
        return false;
      }
    }

    return true;
  },
  {
    message: "Total ownership percentage for an entity cannot exceed 100%",
    path: [0, "ownershipPercentage"],
  }
);

type OwnershipStructureFormData = z.infer<typeof ownershipStructureSchema>;

interface SustainabilityInitiativeFormData {
  initiativeName: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  currentStatus: string;
  targetImpact?: string;
}

interface SustainabilityKPIFormData {
  goalTitle: string;
  goalDescription: string;
  targetDate: Date;
  currentProgress: number;
  indicators: string;
}

interface FacilityFormData {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  facilityType: string;
  description?: string;
}

export default function CompanyProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("entity-scope");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [subsidiaries, setSubsidiaries] = useState<SubsidiaryFormData[]>([]);
  const [subsidiariesErrors, setSubsidiariesErrors] = useState<
    Record<number, Record<string, string>>
  >({});
  const [ownershipStructure, setOwnershipStructure] = useState<
    OwnershipStructureFormData[]
  >([]);
  const [ownershipStructureErrors, setOwnershipStructureErrors] = useState<
    Record<number, Record<string, string>>
  >({});
  // Sustainability Initiatives Form (array)
  const sustainabilityInitiativesForm = useForm<{
    initiatives: SustainabilityInitiativesFormArray[];
  }>({
    resolver: zodResolver(
      z.object({ initiatives: z.array(sustainabilityInitiativesSchema) })
    ),
    defaultValues: { initiatives: [] },
  });
  const { fields, append, remove } = useFieldArray({
    control: sustainabilityInitiativesForm.control,
    name: "initiatives",
  });

  const sustainabilityKPIsForm = useForm<{
    kpis: SustainabilityKPIsFormArray[];
  }>({
    resolver: zodResolver(
      z.object({ kpis: z.array(SustainabilityKPIsSchema) })
    ),
    defaultValues: { kpis: [] },
  });
  const {
    fields: kpiFields,
    append: kpiAppend,
    remove: kpiRemove,
  } = useFieldArray({
    control: sustainabilityKPIsForm.control,
    name: "kpis",
  });

  const [sustainabilityInitiativesErrors, setSustainabilityInitiativesErrors] =
    useState<Record<number, Record<string, string>>>({});
  const [sustainabilityKPIs, setSustainabilityKPIs] = useState<
    SustainabilityKPIFormData[]
  >([]);
  const [facilities, setFacilities] = useState<FacilityFormData[]>([]);
  const [facilitiesErrors, setFacilitiesErrors] = useState<
    Record<number, Record<string, string>>
  >({});
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch client organizations for consultants
  const { data: clientOrganizations } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user && user.role === "consultant",
  });

  // Fetch existing company profile
  const { data: companyProfile, isLoading } = useQuery({
    queryKey: ["/api/company-profile", selectedClient],
    enabled: !!user && user.role !== "consultant",
  });

  const { data: companyOrganizationProfile, isOrganizationLoading } = useQuery({
    queryKey: [`/api/company-profile/${selectedClient}`, selectedClient],
    enabled:
      !!user &&
      (user.role !== "consultant" ||
        (user.role === "consultant" && selectedClient !== "all")),
  });

  // Fetch facilities
  const { data: facilitiesData } = useQuery({
    queryKey: ["/api/facilities"],
    enabled: true,
  });

  // Form instances
  const entityScopeForm = useForm<EntityScopeForm>({
    resolver: zodResolver(entityScopeSchema),
    defaultValues: {
      legalName: "",
      legalForm: "",
      registeredAddress: "",
      country: "",
      naceSectorCode: "",
      fiscalYearEnd: new Date(),
      parentCompany: "",
      reportingBasis: "",
    },
  });

  const subsidiaryForm = useForm<SubsidiaryForm>({
    resolver: zodResolver(subsidiarySchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      facilityType: "",
      description: "",
    },
  });

  const facilityForm = useForm<FacilityForm>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      facilityType: "",
      description: "",
    },
  });

  const sustainabilityInitiativesFormArray =
    useForm<SustainabilityInitiativesFormArray>({
      resolver: zodResolver(sustainabilityInitiativesSchema),
      defaultValues: {
        initiativeName: "",
        currentStatus: "",
        targetImpact: "",
        description: "",
      },
    });

  const businessModelForm = useForm<BusinessModelForm>({
    resolver: zodResolver(businessModelSchema),
    defaultValues: {
      keyProducts: [],
      primaryMarkets: [],
      supplyChainDescription: "",
    },
  });

  const industryForm = useForm<IndustryClassificationForm>({
    resolver: zodResolver(industryClassificationSchema),
    defaultValues: {
      industryCode: "",
      euTaxonomyEligible: false,
      euTaxonomyDetails: "",
      activityDescription: "",
      sectorClassification: "",
      sustainabilityClassification: "",
    },
  });

  const geographyForm = useForm<GeographyForm>({
    resolver: zodResolver(geographySchema),
    defaultValues: {
      countriesOfOperation: [],
      registeredHQ: "",
      numberOfProductionSites: 0,
      siteLocations: "",
      marketRegions: [],
    },
  });

  const businessStrategyForm = useForm<BusinessStrategyForm>({
    resolver: zodResolver(businessStrategySchema),
    defaultValues: {
      sustainabilityPolicies: "",
      netZeroTarget: 0,
      netZeroTargetDate: new Date(),
      circularEconomyInitiatives: "",
      governanceOversight: "",
      transitionUpdates: "",
    },
  });

  // Submit mutations
  const saveCompanyProfile = useMutation({
    mutationFn: async (data: any) => {
      if (user?.role === "consultant" && selectedClient === "all") {
        throw new Error(
          "Please select a client organization to save the profile."
        );
      }
      return await apiRequest("/api/company-profile", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Company Profile Saved",
        description: "Your company profile has been updated successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/company-profile", selectedClient],
      });
    },
    onError: (error) => {
      console.error("Error Saving company profile :", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save company profile",
        variant: "destructive",
      });
    },
  });

  const saveFacility = useMutation({
    mutationFn: async (data: FacilityFormData) => {
      return await apiRequest("/api/facilities", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Facility Saved",
        description: "Your facility has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save facility",
        variant: "destructive",
      });
    },
  });

  const addSubsidiary = () => {
    setSubsidiaries([
      ...subsidiaries,
      {
        name: "",
        country: "",
        address: "",
        ownershipPercentage: 0,
        legalForm: "",
        relationToParent: "",
      },
    ]);
  };

  const removeSubsidiary = (index: number) => {
    setSubsidiaries(subsidiaries.filter((_, i) => i !== index));
    // Remove errors for this subsidiary
    const newErrors = { ...subsidiariesErrors };
    delete newErrors[index];
    // Reindex remaining errors
    const reindexedErrors: Record<number, Record<string, string>> = {};
    Object.keys(newErrors).forEach((key) => {
      const numKey = parseInt(key);
      if (numKey > index) {
        reindexedErrors[numKey - 1] = newErrors[numKey];
      } else {
        reindexedErrors[numKey] = newErrors[numKey];
      }
    });
    setSubsidiariesErrors(reindexedErrors);
  };

  const addOwnershipEntry = () => {
    setOwnershipStructure([
      ...ownershipStructure,
      {
        entityName: "",
        role: "Parent" as const, // Default to Parent to satisfy the type
        ownershipPercentage: 0,
      },
    ]);
    // Clear any existing errors when adding a new entry
    setOwnershipStructureErrors({});
  };

  const removeOwnershipEntry = (index: number) => {
    const updated = [...ownershipStructure];
    updated.splice(index, 1);
    setOwnershipStructure(updated);
    // Remove errors for the deleted entry
    const updatedErrors = { ...ownershipStructureErrors };
    delete updatedErrors[index];
    setOwnershipStructureErrors(updatedErrors);
  };

  const validateOwnershipStructure = (): boolean => {
    try {
      ownershipStructureArraySchema.parse(ownershipStructure);
      setOwnershipStructureErrors({});
      return true;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<number, Record<string, string>> = {};

        error.errors.forEach((err: any) => {
          // The path will be [index, fieldName] for field-level errors
          if (err.path && err.path.length >= 2) {
            const index = err.path[0] as number;
            const field = err.path[1] as string;

            if (!newErrors[index]) {
              newErrors[index] = {};
            }
            newErrors[index][field] = err.message;
          }
        });

        setOwnershipStructureErrors(newErrors);
      } else {
        console.error("Validation error:", error);
      }
      return false;
    }
  };

  const handleOwnershipFieldChange = (
    index: number,
    field: keyof OwnershipStructureFormData,
    value: string | number
  ) => {
    // Convert empty string to undefined for role to avoid type issues
    if (field === "role" && value === "") {
      value = "Parent" as const; // Default to Parent if empty
    }
    const updated = [...ownershipStructure];
    updated[index] = { ...updated[index], [field]: value };
    setOwnershipStructure(updated);

    // Clear error for this field when it changes
    if (ownershipStructureErrors[index]?.[field]) {
      const updatedErrors = { ...ownershipStructureErrors };
      delete updatedErrors[index]?.[field];

      // If no more errors for this index, remove the index entirely
      if (Object.keys(updatedErrors[index] || {}).length === 0) {
        delete updatedErrors[index];
      }

      setOwnershipStructureErrors(updatedErrors);
    }
  };

  const addSustainabilityInitiative = () => {
    setSustainabilityInitiatives([
      ...sustainabilityInitiatives,
      {
        initiativeName: "",
        description: "",
        startDate: new Date(),
        endDate: undefined,
        currentStatus: "Planned",
        targetImpact: "",
      },
    ]);
  };

  const removeSustainabilityInitiative = (index: number) => {
    setSustainabilityInitiatives(
      sustainabilityInitiatives.filter((_, i) => i !== index)
    );
  };

  const addSustainabilityKPI = () => {
    setSustainabilityKPIs([
      ...sustainabilityKPIs,
      {
        goalTitle: "",
        goalDescription: "",
        targetDate: new Date(),
        currentProgress: 0,
        indicators: "",
      },
    ]);
  };

  const removeSustainabilityKPI = (index: number) => {
    setSustainabilityKPIs(sustainabilityKPIs.filter((_, i) => i !== index));
  };

  // Subsidiary validation functions
  const validateSubsidiary = (
    subsidiary: SubsidiaryFormData,
    index: number
  ) => {
    try {
      subsidiarySchema.parse(subsidiary);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        return errors;
      }
      return {};
    }
  };

  const validateAllSubsidiaries = () => {
    try {
      subsidiariesArraySchema.parse(subsidiaries);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const globalErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length === 0) {
            globalErrors.general = err.message;
          }
        });
        return globalErrors;
      }
      return {};
    }
  };

  const updateSubsidiaryField = (
    index: number,
    field: keyof SubsidiaryFormData,
    value: string | number
  ) => {
    const updated = [...subsidiaries];
    updated[index] = { ...updated[index], [field]: value };
    setSubsidiaries(updated);

    // Validate the updated subsidiary
    const errors = validateSubsidiary(updated[index], index);
    const newErrors = { ...subsidiariesErrors };

    if (Object.keys(errors).length > 0) {
      newErrors[index] = errors;
    } else {
      delete newErrors[index];
    }

    setSubsidiariesErrors(newErrors);
  };

  // Facility validation functions
  const validateFacility = (facility: FacilityFormData, index: number) => {
    const errors: Record<string, string> = {};

    if (!facility.name.trim()) {
      errors.name = "Facility name is required";
    }

    if (!facility.facilityType) {
      errors.facilityType = "Facility type is required";
    }

    if (!facility.address.trim()) {
      errors.address = "Address is required";
    }

    if (!facility.city.trim()) {
      errors.city = "City is required";
    }

    if (!facility.country) {
      errors.country = "Country is required";
    }

    return errors;
  };

  const updateFacilityField = (
    index: number,
    field: keyof FacilityFormData,
    value: string
  ) => {
    const updated = [...facilities];
    updated[index] = { ...updated[index], [field]: value };
    setFacilities(updated);

    // Validate the updated facility
    const errors = validateFacility(updated[index], index);
    const newErrors = { ...facilitiesErrors };

    if (Object.keys(errors).length > 0) {
      newErrors[index] = errors;
    } else {
      delete newErrors[index];
    }

    setFacilitiesErrors(newErrors);
  };

  const addFacility = () => {
    setFacilities([
      ...facilities,
      {
        name: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        facilityType: "",
        description: "",
      },
    ]);
  };

  const removeFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index));
    // Remove errors for this facility
    const newErrors = { ...facilitiesErrors };
    delete newErrors[index];
    // Reindex remaining errors
    const reindexedErrors: Record<number, Record<string, string>> = {};
    Object.keys(newErrors).forEach((key) => {
      const numKey = parseInt(key);
      if (numKey > index) {
        reindexedErrors[numKey - 1] = newErrors[numKey];
      } else {
        reindexedErrors[numKey] = newErrors[numKey];
      }
    });
    setFacilitiesErrors(reindexedErrors);
  };

  const handleFinalSubmit = async () => {
    // Only validate and submit the currently active tab. Validating all tabs
    // was blocking saves and preventing API calls when other sections were incomplete.

    const entityData = entityScopeForm.getValues();
    const businessData = businessModelForm.getValues();
    const industryData = industryForm.getValues();
    const geographyData = geographyForm.getValues();
    const strategyData = businessStrategyForm.getValues();
    const facilityData = facilityForm.getValues();
    const subsidiaryData = subsidiaryForm.getValues();
    const sustainabilityInitiativesData =
      sustainabilityInitiativesForm.getValues();
    const sustainabilityKPIsData = sustainabilityKPIsForm.getValues();
    const completeProfile = {
      ...businessData,
      ...industryData,
      ...geographyData,
      ...strategyData,
      ...facilityData,
      ...subsidiaryData,
      ...sustainabilityInitiativesData,
      ...sustainabilityKPIsData,
      keyProducts: selectedProducts,
      primaryMarkets: selectedMarkets,
      countriesOfOperation: selectedCountries,
      marketRegions: selectedRegions,
      ownershipStructure,
      sustainabilityKPIs,
      facilities,
      subsidiaries,
      ...(user?.role === "consultant" &&
        selectedClient !== "all" && { organizationId: selectedClient }),
      ...entityData,
    };

    switch (activeTab) {
      case "entity-scope": {
        // Validate Entity Scope, Facilities and Subsidiaries together
        const isEntityValid = await entityScopeForm.trigger();
        let hasErrors = !isEntityValid;

        const allFacilitiesErrors: Record<number, Record<string, string>> = {};
        facilities.forEach((facility, index) => {
          const errors = validateFacility(facility, index);
          if (Object.keys(errors).length > 0) {
            allFacilitiesErrors[index] = errors;
            hasErrors = true;
          }
        });
        setFacilitiesErrors(allFacilitiesErrors);

        const allSubsidiariesErrors: Record<number, Record<string, string>> = {};
        subsidiaries.forEach((subsidiary, index) => {
          const errors = validateSubsidiary(subsidiary, index);
          if (Object.keys(errors).length > 0) {
            allSubsidiariesErrors[index] = errors;
            hasErrors = true;
          }
        });
        setSubsidiariesErrors(allSubsidiariesErrors);

        if (hasErrors) {
          // Mark entity form as submitted so messages show
          entityScopeForm.handleSubmit(() => {})();
          const errorEl = document.querySelector('[data-invalid="true"]');
          if (errorEl) errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        entityScopeForm.handleSubmit(() => saveCompanyProfile.mutate(completeProfile))();
        break;
      }
      case "corporate-structure": {
        // Run only corporate-structure specific manual validations
        let hasErrors = false;
        const allSubsidiariesErrors: Record<number, Record<string, string>> = {};
        subsidiaries.forEach((subsidiary, index) => {
          const errors = validateSubsidiary(subsidiary, index);
          if (Object.keys(errors).length > 0) {
            allSubsidiariesErrors[index] = errors;
            hasErrors = true;
          }
        });
        setSubsidiariesErrors(allSubsidiariesErrors);

        const globalSubsidiaryErrors = validateAllSubsidiaries();
        if (Object.keys(globalSubsidiaryErrors).length > 0) {
          hasErrors = true;
        }

        if (!validateOwnershipStructure()) {
          hasErrors = true;
        }

        if (hasErrors) {
          const errorEl = document.querySelector('[data-invalid="true"]');
          if (errorEl) errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        saveCompanyProfile.mutate(completeProfile);
        break;
      }
      case "business-model": {
        businessModelForm.handleSubmit(() => saveCompanyProfile.mutate(completeProfile))();
        break;
      }
      case "industry-classification": {
        industryForm.handleSubmit(() => saveCompanyProfile.mutate(completeProfile))();
        break;
      }
      case "geography": {
        geographyForm.handleSubmit(() => saveCompanyProfile.mutate(completeProfile))();
        break;
      }
      case "business-strategy": {
        // Only validate business strategy related forms on this tab
        const isValid = await businessStrategyForm.trigger();
        const initiativesValid = await sustainabilityInitiativesForm.trigger();
        const kpisValid = await sustainabilityKPIsForm.trigger();
        if (!isValid || !initiativesValid || !kpisValid) {
          const errorEl = document.querySelector('[data-invalid="true"]');
          if (errorEl) errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
          // mark as submitted on these forms to display errors
          businessStrategyForm.handleSubmit(() => {})();
          sustainabilityInitiativesForm.handleSubmit(() => {})();
          sustainabilityKPIsForm.handleSubmit(() => {})();
          return;
        }
        businessStrategyForm.handleSubmit(() => saveCompanyProfile.mutate(completeProfile))();
        break;
      }
      default: {
        console.error("No matching active tab found.");
        break;
      }
    }
  };

  const onCancelClick = () => {
    switch (activeTab) {
      case "entity-scope":
        entityScopeForm.reset();
        break;
      case "business-model":
        businessModelForm.reset();
        break;
      case "industry-classification":
        industryForm.reset();
        break;
      case "geography":
        geographyForm.reset();
        break;
      case "business-strategy":
        businessStrategyForm.reset();
        break;
      default:
        console.error("No matching active tab found to reset.");
        break;
    }
  };

  useEffect(() => {
    if (companyProfile) {
      console.log(
        "Setting company organization profile for client:",
        selectedClient
      );
      console.log("Company Organization Profile Data:", companyProfile);

      entityScopeForm.reset({
        legalName: companyProfile?.legalName || "",
        legalForm: companyProfile?.legalForm || "",
        registeredAddress: companyProfile?.registeredAddress || "",
        country: companyProfile?.country || "",
        naceSectorCode: companyProfile?.naceSectorCode || "",
        fiscalYearEnd: companyProfile?.fiscalYearEnd
          ? new Date(companyProfile?.fiscalYearEnd)
          : new Date(),
        parentCompany: companyProfile?.parentCompany || "",
        reportingBasis: companyProfile?.reportingBasis || "",
      });
      const fetchedKeyProducts = companyProfile?.keyProducts || [];
      const fetchedPrimaryMarkets = companyProfile?.primaryMarkets || [];

      businessModelForm.reset({
        keyProducts: fetchedKeyProducts,
        primaryMarkets: fetchedPrimaryMarkets,
        supplyChainDescription: companyProfile?.supplyChainDescription || "",
      });

      setSelectedProducts(fetchedKeyProducts);
      setSelectedMarkets(fetchedPrimaryMarkets);
      industryForm.reset({
        industryCode: companyProfile?.industryCode || "",
        euTaxonomyEligible: companyProfile?.euTaxonomyEligible || false,
        euTaxonomyDetails: companyProfile?.euTaxonomyDetails || "",
        activityDescription: companyProfile?.activityDescription || "",
        sectorClassification: companyProfile?.sectorClassification || "",
        sustainabilityClassification:
          companyProfile?.sustainabilityClassification || "",
      });
      console.log("siteLocations", companyProfile?.siteLocations);
      geographyForm.reset({
        countriesOfOperation: companyProfile?.countriesOfOperation || [],
        registeredHQ: companyProfile?.registeredHQ || "",
        numberOfProductionSites: companyProfile?.numberOfProductionSites || 0,
        siteLocations: companyProfile?.siteLocations || "",
        marketRegions: companyProfile?.marketRegions || [],
      });
      businessStrategyForm.reset({
        sustainabilityPolicies: companyProfile?.sustainabilityPolicies || "",
        netZeroTarget: companyProfile?.netZeroTarget || 0,
        circularEconomyInitiatives:
          companyProfile?.circularEconomyInitiatives || "",
        governanceOversight: companyProfile?.governanceOversight || "",
        transitionUpdates: companyProfile?.transitionUpdates || "",
      });
      subsidiaryForm.reset({
        name: companyProfile?.subsidiary?.name || "",
        address: companyProfile?.subsidiary?.address || "",
        city: companyProfile?.subsidiary?.city || "",
        state: companyProfile?.subsidiary?.state || "",
        country: companyProfile?.subsidiary?.country || "",
        postalCode: companyProfile?.subsidiary?.postalCode || "",
        facilityType: companyProfile?.subsidiary?.facilityType || "",
        description: companyProfile?.subsidiary?.description || "",
      });
      sustainabilityInitiativesForm.reset({
        initiatives: companyProfile?.sustainabilityInitiatives || [],
      });
      sustainabilityKPIsForm.reset({
        kpis: companyProfile?.sustainabilityKPIs || [],
      });
    } else {
      // Also reset local states if companyProfile is null
      setSelectedProducts([]);
      setSelectedMarkets([]);
      // Clear all forms
      entityScopeForm.reset();
      businessModelForm.reset();
      industryForm.reset();
      geographyForm.reset();
      businessStrategyForm.reset();
      subsidiaryForm.reset();
      sustainabilityInitiativesForm.reset();
      sustainabilityKPIsForm.reset();
    }
  }, [
    companyProfile,
    entityScopeForm,
    businessModelForm,
    industryForm,
    geographyForm,
    businessStrategyForm,
    subsidiaryForm,
    sustainabilityInitiativesForm,
    sustainabilityKPIsForm,
    setSelectedProducts,
    setSelectedMarkets,
    selectedClient,
  ]);

  useEffect(() => {
    if (companyOrganizationProfile) {
      console.log(
        "Setting company organization profile for client:",
        selectedClient
      );
      console.log(
        "Company Organization Profile Data:",
        companyOrganizationProfile
      );

      entityScopeForm.reset({
        legalName: companyOrganizationProfile?.legalName || "",
        legalForm: companyOrganizationProfile?.legalForm || "",
        registeredAddress: companyOrganizationProfile?.registeredAddress || "",
        country: companyOrganizationProfile?.country || "",
        naceSectorCode: companyOrganizationProfile?.naceSectorCode || "",
        fiscalYearEnd: companyOrganizationProfile?.fiscalYearEnd
          ? new Date(companyOrganizationProfile?.fiscalYearEnd)
          : new Date(),
        parentCompany: companyOrganizationProfile?.parentCompany || "",
        reportingBasis: companyOrganizationProfile?.reportingBasis || "",
      });
      const fetchedKeyProducts = companyOrganizationProfile?.keyProducts || [];
      const fetchedPrimaryMarkets =
        companyOrganizationProfile?.primaryMarkets || [];

      businessModelForm.reset({
        keyProducts: fetchedKeyProducts,
        primaryMarkets: fetchedPrimaryMarkets,
        supplyChainDescription:
          companyOrganizationProfile?.supplyChainDescription || "",
      });

      setSelectedProducts(fetchedKeyProducts);
      setSelectedMarkets(fetchedPrimaryMarkets);
      industryForm.reset({
        industryCode: companyOrganizationProfile?.industryCode || "",
        euTaxonomyEligible:
          companyOrganizationProfile?.euTaxonomyEligible || false,
        euTaxonomyDetails: companyOrganizationProfile?.euTaxonomyDetails || "",
        activityDescription:
          companyOrganizationProfile?.activityDescription || "",
        sectorClassification:
          companyOrganizationProfile?.sectorClassification || "",
        sustainabilityClassification:
          companyOrganizationProfile?.sustainabilityClassification || "",
      });
      console.log("siteLocations", companyOrganizationProfile?.siteLocations);
      geographyForm.reset({
        countriesOfOperation:
          companyOrganizationProfile?.countriesOfOperation || [],
        registeredHQ: companyOrganizationProfile?.registeredHQ || "",
        numberOfProductionSites:
          companyOrganizationProfile?.numberOfProductionSites || 0,
        siteLocations: companyOrganizationProfile?.siteLocations || "",
        marketRegions: companyOrganizationProfile?.marketRegions || [],
      });
      businessStrategyForm.reset({
        sustainabilityPolicies:
          companyOrganizationProfile?.sustainabilityPolicies || "",
        netZeroTarget: companyOrganizationProfile?.netZeroTarget || 0,
        circularEconomyInitiatives:
          companyOrganizationProfile?.circularEconomyInitiatives || "",
        governanceOversight:
          companyOrganizationProfile?.governanceOversight || "",
        transitionUpdates: companyOrganizationProfile?.transitionUpdates || "",
      });
      subsidiaryForm.reset({
        name: companyOrganizationProfile?.subsidiary?.name || "",
        address: companyOrganizationProfile?.subsidiary?.address || "",
        city: companyOrganizationProfile?.subsidiary?.city || "",
        state: companyOrganizationProfile?.subsidiary?.state || "",
        country: companyOrganizationProfile?.subsidiary?.country || "",
        postalCode: companyOrganizationProfile?.subsidiary?.postalCode || "",
        facilityType:
          companyOrganizationProfile?.subsidiary?.facilityType || "",
        description: companyOrganizationProfile?.subsidiary?.description || "",
      });
      sustainabilityInitiativesForm.reset({
        initiatives:
          companyOrganizationProfile?.sustainabilityInitiatives || [],
      });
      sustainabilityKPIsForm.reset({
        kpis: companyOrganizationProfile?.sustainabilityKPIs || [],
      });
    } else {
      // Also reset local states if companyOrganizationProfile is null
      setSelectedProducts([]);
      setSelectedMarkets([]);
      // Clear all forms
      entityScopeForm.reset();
      businessModelForm.reset();
      industryForm.reset();
      geographyForm.reset();
      businessStrategyForm.reset();
      subsidiaryForm.reset();
      sustainabilityInitiativesForm.reset();
      sustainabilityKPIsForm.reset();
    }
  }, [
    companyOrganizationProfile,
    entityScopeForm,
    businessModelForm,
    industryForm,
    geographyForm,
    businessStrategyForm,
    subsidiaryForm,
    sustainabilityInitiativesForm,
    sustainabilityKPIsForm,
    setSelectedProducts,
    setSelectedMarkets,
    selectedClient,
  ]);

  const handleSaveFacilities = async () => {
    try {
      for (const facility of facilities) {
        if (
          facility.name &&
          facility.address &&
          facility.city &&
          facility.country &&
          facility.facilityType
        ) {
          await saveFacility.mutateAsync(facility);
        }
      }
    } catch (error) {
      console.error("Error saving facilities:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading company profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[var(--ca-green-normal)]/10 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-[var(--ca-green-normal)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--ca-grey-darker)]">
                  Company Profile
                </h1>
                <p className="text-[var(--ca-grey-dark)]">
                  Define your organization's legal identity, business model, and
                  sustainability strategy
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import from Excel
              </Button>
              <Button variant="outline" size="sm">
                <Globe className="w-4 h-4 mr-2" />
                Connect via API
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
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem disabled>Select Client </SelectItem>
                      {clientOrganizations?.map((client: any) => (
                        <SelectItem
                          key={client.organizationId}
                          value={client.organizationId.toString()}
                        >
                          {client.organizationName +
                            client.organizationId.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Company Profile Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="entity-scope">Entity Scope</TabsTrigger>
                <TabsTrigger value="corporate-structure">
                  Corporate Structure
                </TabsTrigger>
                <TabsTrigger value="business-model">Business Model</TabsTrigger>
                <TabsTrigger value="industry-classification">
                  Industry Classification
                </TabsTrigger>
                <TabsTrigger value="geography">Geography</TabsTrigger>
                <TabsTrigger value="business-strategy">
                  Business Strategy
                </TabsTrigger>
              </TabsList>

              {/* Entity Scope & Reporting */}
              <TabsContent value="entity-scope" className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-[var(--ca-green-normal)]" />
                  <h3 className="text-lg font-semibold">
                    Entity Scope & Reporting
                  </h3>
                </div>

                <Form {...entityScopeForm}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={entityScopeForm.control}
                        name="legalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Name *</FormLabel>
                            <FormDescription>
                              Enter the official legal name of the entity. This
                              is required to establish a unique identity for
                              compliance reporting.
                            </FormDescription>
                            <FormControl>
                              <Input
                                placeholder="Enter the official legal name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={entityScopeForm.control}
                        name="legalForm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Form *</FormLabel>
                            <FormDescription>
                              Select the legal structure of the entity to align
                              with regulatory frameworks.
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select legal form" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {legalFormOptions.map((option) => (
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
                    </div>

                    <FormField
                      control={entityScopeForm.control}
                      name="registeredAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registered Address *</FormLabel>
                          <FormDescription>
                            Provide the official registered address of the
                            company for consolidation purposes.
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Enter the official registered address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={entityScopeForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <FormDescription>
                              Select the country where the company is registered
                              to ensure localization accuracy.
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countryOptions.map((option) => (
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
                        control={entityScopeForm.control}
                        name="naceSectorCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NACE Sector Code *</FormLabel>
                            <FormDescription>
                              Choose the NACE code that represents the primary
                              industry of the company. This aligns with EU
                              Taxonomy classifications.
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select NACE code" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {naceCodeOptions.map((option) => (
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={entityScopeForm.control}
                        name="fiscalYearEnd"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fiscal Year-End *</FormLabel>
                            <FormDescription>
                              Specify the fiscal year-end to synchronize
                              reporting timelines.
                            </FormDescription>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={entityScopeForm.control}
                        name="parentCompany"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent Company (Optional)</FormLabel>
                            <FormDescription>
                              Enter the name of the parent company if
                              applicable. This clarifies ownership
                              relationships.
                            </FormDescription>
                            <FormControl>
                              <Input
                                placeholder="Enter parent company name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={entityScopeForm.control}
                      name="reportingBasis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporting Basis *</FormLabel>
                          <FormDescription>
                            Specify whether this report covers the entire group
                            (including subsidiaries) or only the individual
                            entity. This must align with your financial
                            reporting under the Accounting Directive.
                          </FormDescription>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reporting basis" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {reportingBasisOptions.map((option) => (
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
                  </form>
                </Form>

                {/* Facilities Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Facilities</h4>
                    <Button disabled={user?.role === "consultant" && selectedClient === ""} onClick={addFacility} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Facility
                    </Button>
                  </div>

                  {facilities.map((facility, index) => (
                    <Card key={index} className="mb-4">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">
                            Facility {index + 1}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFacility(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`facility-name-${index}`}>
                              Facility Name *
                            </Label>
                            <Input
                              id={`facility-name-${index}`}
                              placeholder="Enter facility name"
                              value={facility.name}
                              onChange={(e) =>
                                updateFacilityField(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className={
                                facilitiesErrors[index]?.name
                                  ? "border-red-500"
                                  : ""
                              }
                              data-invalid={!!facilitiesErrors[index]?.name}
                            />
                            {facilitiesErrors[index]?.name && (
                              <p className="text-sm text-red-500 mt-1">
                                {facilitiesErrors[index].name}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`facility-type-${index}`}>
                              Facility Type *
                            </Label>
                            <Select
                              value={facility.facilityType}
                              onValueChange={(value) =>
                                updateFacilityField(
                                  index,
                                  "facilityType",
                                  value
                                )
                              }
                            >
                              <SelectTrigger
                                className={
                                  facilitiesErrors[index]?.facilityType
                                    ? "border-red-500"
                                    : ""
                                }
                                data-invalid={!!facilitiesErrors[index]?.facilityType}
                              >
                                <SelectValue placeholder="Select facility type" />
                              </SelectTrigger>
                              <SelectContent>
                                {facilityTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {facilitiesErrors[index]?.facilityType && (
                              <p className="text-sm text-red-500 mt-1">
                                {facilitiesErrors[index].facilityType}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`facility-address-${index}`}>
                              Address *
                            </Label>
                            <Input
                              id={`facility-address-${index}`}
                              placeholder="Enter address"
                              value={facility.address}
                              onChange={(e) =>
                                updateFacilityField(
                                  index,
                                  "address",
                                  e.target.value
                                )
                              }
                              className={
                                facilitiesErrors[index]?.address
                                  ? "border-red-500"
                                  : ""
                              }
                              data-invalid={!!facilitiesErrors[index]?.address}
                            />
                            {facilitiesErrors[index]?.address && (
                              <p className="text-sm text-red-500 mt-1">
                                {facilitiesErrors[index].address}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`facility-city-${index}`}>
                              City *
                            </Label>
                            <Input
                              id={`facility-city-${index}`}
                              placeholder="Enter city"
                              value={facility.city}
                              onChange={(e) =>
                                updateFacilityField(
                                  index,
                                  "city",
                                  e.target.value
                                )
                              }
                              className={
                                facilitiesErrors[index]?.city
                                  ? "border-red-500"
                                  : ""
                              }
                              data-invalid={!!facilitiesErrors[index]?.city}
                            />
                            {facilitiesErrors[index]?.city && (
                              <p className="text-sm text-red-500 mt-1">
                                {facilitiesErrors[index].city}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`facility-state-${index}`}>
                              State (Optional)
                            </Label>
                            <Input
                              id={`facility-state-${index}`}
                              placeholder="Enter state"
                              value={facility.state}
                              onChange={(e) => {
                                const updated = [...facilities];
                                updated[index].state = e.target.value;
                                setFacilities(updated);
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`facility-country-${index}`}>
                              Country *
                            </Label>
                            <Select
                              value={facility.country}
                              onValueChange={(value) =>
                                updateFacilityField(index, "country", value)
                              }
                            >
                              <SelectTrigger
                                className={
                                  facilitiesErrors[index]?.country
                                    ? "border-red-500"
                                    : ""
                                }
                                data-invalid={!!facilitiesErrors[index]?.country}
                              >
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countryOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {facilitiesErrors[index]?.country && (
                              <p className="text-sm text-red-500 mt-1">
                                {facilitiesErrors[index].country}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`facility-postal-${index}`}>
                              Postal Code (Optional)
                            </Label>
                            <Input
                              id={`facility-postal-${index}`}
                              placeholder="Enter postal code"
                              value={facility.postalCode}
                              onChange={(e) =>
                                updateFacilityField(
                                  index,
                                  "postalCode",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`facility-description-${index}`}>
                              Description (Optional)
                            </Label>
                            <Textarea
                              id={`facility-description-${index}`}
                              placeholder="Enter facility description"
                              value={facility.description}
                              onChange={(e) =>
                                updateFacilityField(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Subsidiary List */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Subsidiaries</h4>
                    <Button disabled={user?.role === "consultant" && selectedClient === ""} onClick={addSubsidiary} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subsidiary
                    </Button>
                  </div>

                  {subsidiaries.map((subsidiary, index) => (
                    <Card key={index} className="mb-4">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">
                            Subsidiary {index + 1}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubsidiary(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`subsidiary-name-${index}`}>
                              Subsidiary Name *
                            </Label>
                            <Input
                              id={`subsidiary-name-${index}`}
                              placeholder="Enter subsidiary name"
                              value={subsidiary.name}
                              onChange={(e) =>
                                updateSubsidiaryField(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className={
                                subsidiariesErrors[index]?.name
                                  ? "border-red-500"
                                  : ""
                              }
                              data-invalid={!!subsidiariesErrors[index]?.name}
                            />
                            {subsidiariesErrors[index]?.name && (
                              <p className="text-sm text-red-500 mt-1">
                                {subsidiariesErrors[index].name}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`subsidiary-country-${index}`}>
                              Country *
                            </Label>
                            <Select
                              value={subsidiary.country}
                              onValueChange={(value) =>
                                updateSubsidiaryField(index, "country", value)
                              }
                            >
                              <SelectTrigger
                                className={
                                  subsidiariesErrors[index]?.country
                                    ? "border-red-500"
                                    : ""
                                }
                                data-invalid={!!subsidiariesErrors[index]?.country}
                              >
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countryOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {subsidiariesErrors[index]?.country && (
                              <p className="text-sm text-red-500 mt-1">
                                {subsidiariesErrors[index].country}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`subsidiary-address-${index}`}>
                              Address *
                            </Label>
                            <Input
                              id={`subsidiary-address-${index}`}
                              placeholder="Enter address"
                              value={subsidiary.address}
                              onChange={(e) =>
                                updateSubsidiaryField(
                                  index,
                                  "address",
                                  e.target.value
                                )
                              }
                              className={
                                subsidiariesErrors[index]?.address
                                  ? "border-red-500"
                                  : ""
                              }
                              data-invalid={!!subsidiariesErrors[index]?.address}
                            />
                            {subsidiariesErrors[index]?.address && (
                              <p className="text-sm text-red-500 mt-1">
                                {subsidiariesErrors[index].address}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`subsidiary-ownership-${index}`}>
                              Ownership % *
                            </Label>
                            <Input
                              id={`subsidiary-ownership-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              name={`subsidiary-ownership-${index}`}
                              placeholder="Enter ownership percentage"
                              value={subsidiary.ownershipPercentage}
                              onChange={(e) =>
                                updateSubsidiaryField(
                                  index,
                                  "ownershipPercentage",
                                  Number(e.target.value)
                                )
                              }
                              className={
                                subsidiariesErrors[index]?.ownershipPercentage
                                  ? "border-red-500"
                                  : ""
                              }
                              data-invalid={!!subsidiariesErrors[index]?.ownershipPercentage}
                            />
                            {subsidiariesErrors[index]?.ownershipPercentage && (
                              <p className="text-sm text-red-500 mt-1">
                                {subsidiariesErrors[index].ownershipPercentage}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`subsidiary-legal-form-${index}`}>
                              Legal Form *
                            </Label>
                            <Select
                              value={subsidiary.legalForm}
                              onValueChange={(value) =>
                                updateSubsidiaryField(index, "legalForm", value)
                              }
                            >
                              <SelectTrigger
                                className={
                                  subsidiariesErrors[index]?.legalForm
                                    ? "border-red-500"
                                    : ""
                                }
                                data-invalid={!!subsidiariesErrors[index]?.legalForm}
                              >
                                <SelectValue placeholder="Select legal form" />
                              </SelectTrigger>
                              <SelectContent>
                                {legalFormOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {subsidiariesErrors[index]?.legalForm && (
                              <p className="text-sm text-red-500 mt-1">
                                {subsidiariesErrors[index].legalForm}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`subsidiary-relation-${index}`}>
                              Relation to Parent *
                            </Label>
                            <Select
                              value={subsidiary.relationToParent}
                              onValueChange={(value) =>
                                updateSubsidiaryField(
                                  index,
                                  "relationToParent",
                                  value
                                )
                              }
                            >
                              <SelectTrigger
                                className={
                                  subsidiariesErrors[index]?.relationToParent
                                    ? "border-red-500"
                                    : ""
                                }
                                data-invalid={!!subsidiariesErrors[index]?.relationToParent}
                              >
                                <SelectValue placeholder="Select relation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Fully Owned">
                                  Fully Owned
                                </SelectItem>
                                <SelectItem value="Majority Owned">
                                  Majority Owned
                                </SelectItem>
                                <SelectItem value="Minority Owned">
                                  Minority Owned
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {subsidiariesErrors[index]?.relationToParent && (
                              <p className="text-sm text-red-500 mt-1">
                                {subsidiariesErrors[index].relationToParent}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Corporate Structure */}
              <TabsContent value="corporate-structure" className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-[var(--ca-green-normal)]" />
                  <h3 className="text-lg font-semibold">Corporate Structure</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">
                      Ownership Structure
                    </h4>
                    <Button disabled={user?.role === "consultant" && selectedClient === ""} onClick={addOwnershipEntry} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ownership Entry
                    </Button>
                  </div>

                  {ownershipStructure.map((entry, index) => (
                    <Card key={index} className="mb-4">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">
                            Ownership Entry {index + 1}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOwnershipEntry(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`ownership-entity-${index}`}>
                              Entity Name *
                            </Label>
                            <Input
                              id={`ownership-entity-${index}`}
                              placeholder="Enter entity name"
                              value={entry.entityName}
                              onChange={(e) =>
                                handleOwnershipFieldChange(
                                  index,
                                  "entityName",
                                  e.target.value
                                )
                              }
                              className={
                                ownershipStructureErrors[index]?.entityName
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {ownershipStructureErrors[index]?.entityName && (
                              <p className="text-sm text-red-500 mt-1">
                                {ownershipStructureErrors[index]?.entityName}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`ownership-role-${index}`}>
                              Role *
                            </Label>
                            <Select
                              value={entry.role}
                              onValueChange={(value) =>
                                handleOwnershipFieldChange(index, "role", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Subsidiary">
                                  Subsidiary
                                </SelectItem>
                                <SelectItem value="Shareholder">
                                  Shareholder
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`ownership-percentage-${index}`}>
                              Ownership % *
                            </Label>
                            <div>
                              <Input
                                id={`ownership-percentage-${index}`}
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Enter ownership percentage"
                                value={entry.ownershipPercentage}
                                onChange={(e) =>
                                  handleOwnershipFieldChange(
                                    index,
                                    "ownershipPercentage",
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  )
                                }
                                className={
                                  ownershipStructureErrors[index]
                                    ?.ownershipPercentage
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                              {ownershipStructureErrors[index]
                                ?.ownershipPercentage && (
                                <p className="text-sm text-red-500 mt-1">
                                  {
                                    ownershipStructureErrors[index]
                                      ?.ownershipPercentage
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="mt-6">
                    <Label htmlFor="ownership-chart">
                      Ownership Chart Upload
                    </Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Upload an ownership chart for detailed governance
                        documentation.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Upload className="w-4 h-4 mr-2" />
                        Select Excel File
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Business Model Description */}
              <TabsContent value="business-model" className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Building className="w-5 h-5 text-[var(--ca-green-normal)]" />
                  <h3 className="text-lg font-semibold">
                    Business Model Description
                  </h3>
                </div>

                <Form {...businessModelForm}>
                  <form className="space-y-6">
                    <div>
                      <Label>Key Products/Services *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        <FormField
                          control={businessModelForm.control}
                          name="keyProducts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Diligence Framework *</FormLabel>
                              <FormDescription>
                                Select the frameworks your company follows
                              </FormDescription>
                              <FormControl>
                                <div className="space-y-2">
                                  {productServiceOptions.map((option) => (
                                    <div
                                      key={option?.value}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        id={option.value}
                                        checked={selectedProducts.includes(
                                          option.value
                                        )}
                                        onCheckedChange={(checked) => {
                                          const newProducts = checked
                                            ? [
                                                ...selectedProducts,
                                                option.value,
                                              ]
                                            : selectedProducts.filter(
                                                (p) => p !== option.value
                                              );

                                          setSelectedProducts(newProducts);
                                          field.onChange(newProducts);
                                        }}
                                      />
                                      <Label
                                        htmlFor={option.value}
                                        className="text-sm"
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Select the company's primary products or services from
                        the list. If not listed, choose 'Other' and specify.
                      </p>
                    </div>

                    <div>
                      <Label>Primary Markets *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                        <FormField
                          control={businessModelForm.control}
                          name="primaryMarkets"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Diligence Framework *</FormLabel>
                              <FormDescription>
                                Select the frameworks your company follows
                              </FormDescription>
                              <FormControl>
                                <div className="space-y-2">
                                  {marketOptions.map((option) => (
                                    <div
                                      key={option?.value}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        id={option.value}
                                        checked={selectedMarkets.includes(
                                          option.value
                                        )}
                                        onCheckedChange={(checked) => {
                                          const newMarkets = checked
                                            ? [...selectedMarkets, option.value]
                                            : selectedMarkets.filter(
                                                (m) => m !== option.value
                                              );

                                          setSelectedMarkets(newMarkets);
                                          field.onChange(newMarkets);
                                        }}
                                      />
                                      <Label
                                        htmlFor={option.value}
                                        className="text-sm"
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Indicate where the company operates its primary markets
                        to map its geographic footprint.
                      </p>
                    </div>

                    <FormField
                      control={businessModelForm.control}
                      name="supplyChainDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supply Chain Description *</FormLabel>
                          <FormDescription>
                            Describe key elements of the supply chain, including
                            major suppliers and logistics networks.
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Describe key elements of the supply chain, including major suppliers and logistics networks."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </TabsContent>

              {/* Industry Classification */}
              <TabsContent
                value="industry-classification"
                className="space-y-6"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-[var(--ca-green-normal)]" />
                  <h3 className="text-lg font-semibold">
                    Industry and Taxonomy Classification
                  </h3>
                </div>

                <Form {...industryForm}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={industryForm.control}
                        name="industryCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry Code (NACE/NAICS) *</FormLabel>
                            <FormDescription>
                              Select the appropriate industry code from the
                              predefined list based on your company's primary
                              sector.
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry code" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {naceCodeOptions.map((option) => (
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
                        control={industryForm.control}
                        name="sectorClassification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sector Classification *</FormLabel>
                            <FormDescription>
                              Choose the sector classification that best matches
                              the company's business operations.
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sector" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sectorOptions.map((option) => (
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
                    </div>

                    <FormField
                      control={industryForm.control}
                      name="sustainabilityClassification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sustainability Classification *</FormLabel>
                          <FormDescription>
                            Select the sustainability classification that
                            applies to the company's overall activities.
                          </FormDescription>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sustainability classification" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sustainabilityClassificationOptions.map(
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-2">
                      <FormField
                        control={industryForm.control}
                        name="euTaxonomyEligible"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>EU Taxonomy Eligible</FormLabel>
                              <FormDescription>
                                Check if the company's activities align with the
                                EU Taxonomy for sustainable business.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={industryForm.control}
                      name="euTaxonomyDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            EU Taxonomy Details (if applicable)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide details about EU Taxonomy alignment..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            If partially aligned, provide further details about
                            which activities are considered sustainable.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={industryForm.control}
                      name="activityDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide a brief description of the company's alignment with the EU Taxonomy..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a brief description of the company's
                            alignment with the EU Taxonomy. Explain which
                            activities are considered sustainable and why.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </TabsContent>

              {/* Geography and Locations */}
              <TabsContent value="geography" className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-5 h-5 text-[var(--ca-green-normal)]" />
                  <h3 className="text-lg font-semibold">
                    Geography and Locations
                  </h3>
                </div>

                <Form {...geographyForm}>
                  <form className="space-y-6">
                    <div>
                      <Label>Countries of Operation *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        <FormField
                          control={geographyForm.control}
                          name="countriesOfOperation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Diligence Framework *</FormLabel>
                              <FormDescription>
                                Select the frameworks your company follows
                              </FormDescription>
                              <FormControl>
                                <div className="space-y-2">
                                  {countryOptions.map((option) => (
                                    <div
                                      key={option?.value}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        id={option.value}
                                        checked={selectedMarkets.includes(
                                          option.value
                                        )}
                                        onCheckedChange={(checked) => {
                                          const newMarkets = checked
                                            ? [...selectedMarkets, option.value]
                                            : selectedMarkets.filter(
                                                (m) => m !== option.value
                                              );

                                          setSelectedMarkets(newMarkets);
                                          field.onChange(newMarkets);
                                        }}
                                      />
                                      <Label
                                        htmlFor={option.value}
                                        className="text-sm"
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* {countryOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={option.value}
                                checked={selectedCountries.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCountries([...selectedCountries, option.value]);
                                  } else {
                                    setSelectedCountries(selectedCountries.filter(c => c !== option.value));
                                  }
                                }}
                              />
                              <Label htmlFor={option.value} className="text-sm">
                                {option.label}
                              </Label>
                            </div>
                          ))} */}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Select all the countries where your company operates.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={geographyForm.control}
                        name="registeredHQ"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registered HQ Location *</FormLabel>
                            <FormDescription>
                              Enter the main headquarters address where your
                              company is registered.
                            </FormDescription>
                            <FormControl>
                              <Input
                                placeholder="Enter headquarters address"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={geographyForm.control}
                        name="numberOfProductionSites"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Production Sites *</FormLabel>
                            <FormDescription>
                              Enter the number of production sites your company
                              operates.
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Enter number of sites"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : e.target.valueAsNumber
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={geographyForm.control}
                      name="siteLocations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Production Site Locations</FormLabel>
                          <FormDescription>
                            List the addresses or cities of your company's
                            production sites. Include key regions or plants.
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="List the addresses or cities of your company's production sites..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <Label>Geographic Market Regions *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                        <FormField
                          control={geographyForm.control}
                          name="marketRegions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Diligence Framework *</FormLabel>
                              <FormDescription>
                                Select the frameworks your company follows
                              </FormDescription>
                              <FormControl>
                                <div className="space-y-2">
                                  {marketOptions.map((option) => (
                                    <div
                                      key={option?.value}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        id={option.value}
                                        checked={selectedMarkets.includes(
                                          option.value
                                        )}
                                        onCheckedChange={(checked) => {
                                          const newMarkets = checked
                                            ? [...selectedMarkets, option.value]
                                            : selectedMarkets.filter(
                                                (m) => m !== option.value
                                              );

                                          setSelectedMarkets(newMarkets);
                                          field.onChange(newMarkets);
                                        }}
                                      />
                                      <Label
                                        htmlFor={option.value}
                                        className="text-sm"
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Select the geographic market regions where your company
                        primarily operates.
                      </p>
                    </div>

                    <div className="mt-6">
                      <Label>Site Geolocation Import</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Download className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Import location data from Excel or use map interface
                          to set coordinates.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Upload className="w-4 h-4 mr-2" />
                          Import Locations
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Business Strategy & Initiatives */}
              <TabsContent value="business-strategy" className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="w-5 h-5 text-[var(--ca-green-normal)]" />
                  <h3 className="text-lg font-semibold">
                    Business Strategy & Initiatives
                  </h3>
                </div>
                {/* Error banner for Business Strategy & Initiatives */}
                {(businessStrategyForm.formState.isSubmitted ||
                  businessStrategyForm.formState.submitCount > 0 ||
                  (businessStrategyForm.formState.isDirty &&
                    !businessStrategyForm.formState.isValid)) &&
                  !businessStrategyForm.formState.isValid && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 font-medium border border-red-300">
                      Please fill all required fields in Business Strategy &
                      Initiatives.
                    </div>
                  )}
                <Form {...businessStrategyForm}>
                  <form className="space-y-6">
                    <FormField
                      control={businessStrategyForm.control}
                      name="sustainabilityPolicies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Sustainability Policies Overview *
                          </FormLabel>
                          <FormDescription>
                            Provide a brief description of your company's
                            sustainability policies. Include key areas such as
                            environmental, social, and governance (ESG)
                            policies.
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Provide a brief description of your company's sustainability policies..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={businessStrategyForm.control}
                        name="netZeroTarget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Net-Zero Emissions Target (%) *
                            </FormLabel>
                            <FormDescription>
                              Enter your company's target for reducing carbon
                              emissions by a specific percentage.
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Enter target percentage"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessStrategyForm.control}
                        name="netZeroTargetDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Net-Zero Target Date *</FormLabel>
                            <FormDescription>
                              Select the target date for achieving net-zero
                              emissions.
                            </FormDescription>
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
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={businessStrategyForm.control}
                      name="circularEconomyInitiatives"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Product Stewardship and Circular Economy Initiatives
                            *
                          </FormLabel>
                          <FormDescription>
                            Describe your company's efforts in product
                            stewardship, including actions related to product
                            design, recycling, reusing, and reducing waste.
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your company's efforts in product stewardship and circular economy..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessStrategyForm.control}
                      name="governanceOversight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Governance and Oversight *</FormLabel>
                          <FormDescription>
                            Who in your organization oversees sustainability
                            initiatives?
                          </FormDescription>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select governance oversight" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {governanceOptions.map((option) => (
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
                      control={businessStrategyForm.control}
                      name="transitionUpdates"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Sustainability Transition Plan Updates *
                          </FormLabel>
                          <FormDescription>
                            Describe key updates on your sustainability
                            transition, including progress made towards set
                            goals.
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder="Describe key updates on your sustainability transition..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="mt-6">
                      <Label>Sustainability Transition Plan Upload</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Upload your company's formal transition plan or
                          roadmap (PDF/Word, max 5MB).
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>

                {/* Sustainability Initiatives */}
                {/* Error banner for Sustainability Initiatives */}
                {sustainabilityInitiativesForm.formState.isSubmitted &&
                  !sustainabilityInitiativesForm.formState.isValid && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 font-medium border border-red-300">
                      Please fill all required fields for Sustainability
                      Initiatives.
                    </div>
                  )}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">
                      Sustainability Initiatives
                    </h4>
                    <Button
                      onClick={() =>
                        append({
                          initiativeName: "",
                          currentStatus: "",
                          targetImpact: "",
                          description: "",
                        })
                      }
                      size="sm"
                      disabled={user?.role === "consultant" && selectedClient === ""}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Initiative
                    </Button>
                  </div>
                  <Form {...sustainabilityInitiativesForm}>
                    <form className="space-y-4">
                      {fields.map((field, index) => (
                        <Card key={field.id} className="mb-4">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-sm">
                                Initiative {index + 1}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                type="button"
                              >
                                Remove
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={sustainabilityInitiativesForm.control}
                                name={`initiatives.${index}.initiativeName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Initiative Name *</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter initiative name"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={sustainabilityInitiativesForm.control}
                                name={`initiatives.${index}.currentStatus`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Status *</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Planned">
                                          Planned
                                        </SelectItem>
                                        <SelectItem value="Ongoing">
                                          Ongoing
                                        </SelectItem>
                                        <SelectItem value="Completed">
                                          Completed
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="md:col-span-2">
                                <FormField
                                  control={
                                    sustainabilityInitiativesForm.control
                                  }
                                  name={`initiatives.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description *</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Describe the initiative..."
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={sustainabilityInitiativesForm.control}
                                name={`initiatives.${index}.targetImpact`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Impact *</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., 20% reduction in energy consumption"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </form>
                  </Form>
                </div>

                {/* Sustainability KPIs */}
                {/* Error banner for Sustainability Goals and KPIs */}
                {sustainabilityKPIsForm.formState.isSubmitted &&
                  !sustainabilityKPIsForm.formState.isValid && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 font-medium border border-red-300">
                      Please fill all required fields for Sustainability Goals
                      and KPIs.
                    </div>
                  )}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">
                      Sustainability Goals and KPIs
                    </h4>
                    <Button
                      onClick={() =>
                        kpiAppend({
                          goalTitle: "",
                          currentProgress: 0,
                          goalDescription: "",
                          kpiIndicators: [],
                        })
                      }
                      size="sm"
                      disabled={user?.role === "consultant" && selectedClient === ""}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add KPI
                    </Button>
                  </div>
                  <Form {...sustainabilityKPIsForm}>
                    <form className="space-y-4">
                      {kpiFields.map((field, index) => (
                        <Card key={field.id} className="mb-4">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-sm">
                                KPI {index + 1}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => kpiRemove(index)}
                                type="button"
                              >
                                Remove
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={sustainabilityKPIsForm.control}
                                name={`kpis.${index}.goalTitle`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Goal Title *</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter goal title"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={sustainabilityKPIsForm.control}
                                name={`kpis.${index}.currentProgress`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Progress (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="Enter current progress"
                                        value={field.value}
                                        onChange={e => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="md:col-span-2">
                                <FormField
                                  control={sustainabilityKPIsForm.control}
                                  name={`kpis.${index}.goalDescription`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Goal Description *</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Describe the sustainability goal..."
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={sustainabilityKPIsForm.control}
                                name={`kpis.${index}.kpiIndicators`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>KPIs/Indicators *</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., 30% reduction in Scope 1 emissions"
                                        value={field.value?.join(", ") || ""}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value
                                              .split(",")
                                              .map((s) => s.trim())
                                              .filter(Boolean)
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </form>
                  </Form>
                </div>
              </TabsContent>

              {/* Navigation and Save */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <div className="flex space-x-2">
                  <Badge variant="outline">
                    <Leaf className="w-3 h-3 mr-1" />
                    ESRS Compliant
                  </Badge>
                  <Badge variant="outline">
                    <Globe className="w-3 h-3 mr-1" />
                    GDPR Compliant
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onCancelClick}>
                    Cancel
                  </Button>
                  <Button
                   
                    onClick={handleFinalSubmit}
                    disabled={saveCompanyProfile.isPending || user?.role === "consultant" && selectedClient === ""}
                    className="bg-[var(--ca-green-normal)]"
                  >
                    {saveCompanyProfile.isPending
                      ? "Saving..."
                      : "Save Company Profile"}
                  </Button>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
