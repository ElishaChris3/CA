import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Info,
  TrendingUp,
  TrendingDown,
  Bell,
  User,
  Calendar,
  Target,
  Zap,
  Factory,
  Edit3,
  Upload,
  Link2,
  MapPin,
  Building,
} from "lucide-react";
import { GhgEmission, InsertGhgEmission } from "@/shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { json } from "stream/consumers";

export default function EmissionOverview() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedScope, setSelectedScope] = useState<
    "scope1" | "scope2" | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFuelType, setSelectedFuelType] = useState<string | null>(null);
  const [selectedFuelSubType, setSelectedFuelSubType] = useState<string | null>(
    null
  );
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedEnergyType, setSelectedEnergyType] = useState<string | null>(
    null
  );
  // Fetch client organizations for consultants
  const { data: clientOrganizations } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user && user.role === "consultant",
  });

  console.log(selectedClient);
  console.log(selectedCategory, " thats the Category");

  const shouldSendClient =
    user?.role === "consultant" && selectedClient && selectedClient !== "all";

  const queryUrl = shouldSendClient
    ? `/api/ghg-emissions?organizationId=${selectedClient}`
    : "/api/ghg-emissions";
  const { data: emissions = [], isLoading } = useQuery<GhgEmission[]>({
    queryKey: [queryUrl],
  });

  // Fetch facilities data for location dropdown
  const { data: facilities = [] } = useQuery({
    queryKey: ["/api/facilities"],
  });

  // Calculate totals by scope
  const calculateScopeEmissions = (scope: string) => {
    return emissions
      .filter((e) => e.scope === scope)
      .reduce((sum, e) => sum + parseFloat(e.co2Equivalent || "0"), 0);
  };

  const scope1Total = calculateScopeEmissions("scope1");
  const scope2Total = calculateScopeEmissions("scope2");
  const scope3Total = calculateScopeEmissions("scope3");
  const totalEmissions = scope1Total + scope2Total + scope3Total;

  // Mock trend data for demonstration (in production, calculate from historical data)
  const getTrendData = (current: number, scope: string) => {
    const trends = {
      total: -5,
      scope1: 5,
      scope2: -5,
      scope3: -5,
    };
    return trends[scope as keyof typeof trends] || 0;
  };

  const MetricCard = ({
    title,
    value,
    unit,
    trend,
    scope,
  }: {
    title: string;
    value: number;
    unit: string;
    trend: number;
    scope: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Info className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="mr-1">{unit}</span>
          {trend !== 0 && (
            <div
              className={`flex items-center ${
                trend > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Process data for charts
  const processEmissionsData = () => {
    const monthlyData = {};
    const categoryData = {};
    const scopeData = [];

    emissions.forEach((emission) => {
      const month = emission.reportingPeriod || "2024-01";
      const category = emission.category || "Other";
      const scope = emission.scope;
      const value = parseFloat(emission.co2Equivalent || "0");

      // Monthly data
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month: month.split("-")[1],
          scope1: 0,
          scope2: 0,
          scope3: 0,
          total: 0,
        };
      }
      monthlyData[month][scope.replace("scope", "scope")] += value;
      monthlyData[month].total += value;

      // Category data
      if (!categoryData[category]) {
        categoryData[category] = { category, value: 0, scope };
      }
      categoryData[category].value += value;
    });

    // Scope breakdown
    scopeData.push(
      { name: "Scope 1", value: scope1Total, color: "#fb923c" },
      { name: "Scope 2", value: scope2Total, color: "#22c55e" },
      { name: "Scope 3", value: scope3Total, color: "#dc2626" }
    );

    return {
      monthly: Object.values(monthlyData),
      categories: Object.values(categoryData),
      scopes: scopeData,
    };
  };

  const { monthly, categories, scopes } = processEmissionsData();

  const COLORS = [
    "#fb923c",
    "#22c55e",
    "#dc2626",
    "#8b5cf6",
    "#f59e0b",
    "#06b6d4",
    "#10b981",
    "#ef4444",
  ];

  const EmissionsOverviewCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Trend Line Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Emissions Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} tCO2e`, ""]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="scope1"
                  stroke="#fb923c"
                  strokeWidth={2}
                  name="Scope 1"
                />
                <Line
                  type="monotone"
                  dataKey="scope2"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Scope 2"
                />
                <Line
                  type="monotone"
                  dataKey="scope3"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Scope 3"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scope Breakdown Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Emissions by Scope
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scopes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scopes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} tCO2e`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Emissions by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip formatter={(value) => [`${value} tCO2e`, ""]} />
                <Bar dataKey="value" fill="#8884d8">
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Area Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cumulative Emissions by Scope
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} tCO2e`, ""]} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="scope1"
                  stackId="1"
                  stroke="#fb923c"
                  fill="#fb923c"
                  fillOpacity={0.6}
                  name="Scope 1"
                />
                <Area
                  type="monotone"
                  dataKey="scope2"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                  name="Scope 2"
                />
                <Area
                  type="monotone"
                  dataKey="scope3"
                  stackId="1"
                  stroke="#dc2626"
                  fill="#dc2626"
                  fillOpacity={0.6}
                  name="Scope 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const EmissionsInsights = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Largest Source</CardTitle>
          <Factory className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {categories.length > 0
              ? categories.reduce((prev, current) =>
                  prev.value > current.value ? prev : current
                ).category
              : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {categories.length > 0
              ? `${categories
                  .reduce((prev, current) =>
                    prev.value > current.value ? prev : current
                  )
                  .value.toFixed(1)} tCO2e`
              : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {monthly.length > 0
              ? (totalEmissions / monthly.length).toFixed(1)
              : "0"}
          </div>
          <p className="text-xs text-muted-foreground">tCO2e per month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Intensity</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(totalEmissions / 1000000).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">tCO2e per $1M revenue</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scope 3 %</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalEmissions > 0
              ? ((scope3Total / totalEmissions) * 100).toFixed(1)
              : 0}
            %
          </div>
          <p className="text-xs text-muted-foreground">of total emissions</p>
        </CardContent>
      </Card>
    </div>
  );

  // Emission Data Entry Component
  const EmissionDataEntry = () => {
    const [activeTab, setActiveTab] = useState("manual");
    const [completeness, setCompleteness] = useState(15);
    const [selectedScope, setSelectedScope] = useState<
      "scope1" | "scope2" | null
    >(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
      null
    );
    const { toast } = useToast();

    // Mutation for saving emission data
    const saveEmissionMutation = useMutation({
      mutationFn: async (data: Omit<InsertGhgEmission, "organizationId">) => {
        if (
          user?.role === "consultant" &&
          (!selectedClient || selectedClient === "all")
        ) {
          throw new Error("Please select a client organization first");
        }
        return apiRequest("/api/ghg-emissions", "POST", data);
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Emission data saved successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/ghg-emissions"] });
        // Reset form and selections
        setSelectedScope(null);
        setSelectedCategory(null);
        emissionForm.reset();
      },
      onError: (error: any) => {
        let errorMessage = "Failed to save emission data";

        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("Save error:", error);
        console.error("Error details:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
      },
    });

    const { data: emissionFactorData, isLoading: emissionFactorLoading } =
      useQuery({
        queryKey: ["/api/emission-factors", selectedScope, selectedCategory],
        queryFn: async () => {
          if (!selectedScope || !selectedCategory) return null;

          const params: Record<string, string> = {
            scope: selectedScope,
            categoryId: selectedCategory,
          };

          if (emissionForm.getValues("fuelType")) {
            params.level1 = emissionForm.getValues("fuelType");
          }
          if (emissionForm.getValues("fuelSubType")) {
            params.level2 = emissionForm.getValues("fuelSubType");
          }
          if (emissionForm.getValues("unit")) {
            params.uom = emissionForm.getValues("unit");
          }
          if (emissionForm.getValues("vehicleFuelType")) {
            params.level1 = emissionForm.getValues("vehicleFuelType");
          }
          if (emissionForm.getValues("energyType")) {
            params.level1 = emissionForm.getValues("energyType");
          }

          return apiRequest("/api/emission-factors", "GET", params);
        },
        enabled: !!selectedScope && !!selectedCategory,
      });

    // Helper function to transform form data to API format
    const transformFormDataToEmission = async (
      formData: any,
      scope: string,
      category: string
    ): Promise<Omit<InsertGhgEmission, "organizationId">> => {
      const quantity = parseFloat(formData.quantity || "0");

      const isDeliveryVehicle = category === "Delivery vehicles";

      const apiPayload = {
        level1: category,
        level2: isDeliveryVehicle
          ? "HGV (all diesel)"
          : formData.fuelType || null,
        level3: formData.fuelSubType || null,
        uom: formData.unit || null,
      };

      console.log(formData, "Formieee");

      let emissionFactor = 0;

      try {
        const res = await apiRequest(
          "/api/emission-factors",
          "POST",
          apiPayload
        );
        const updatedCoversion = await res.json();
        console.log("✅ GHG API Response:", updatedCoversion);
        emissionFactor = updatedCoversion || 0;
      } catch (error) {
        console.error("❌ Error fetching emission factor:", error);
      }

      return {
        scope: scope as "scope1" | "scope2",
        category,
        source:
          formData.fuelSubType ||
          formData.energyType ||
          formData.fuelType ||
          "",
        activityData: quantity.toString(),
        unit: formData.unit || "",
        emissionFactor: emissionFactor?.conversionFactor?.toString() || "0",
        co2Equivalent:
          (quantity * emissionFactor?.conversionFactor).toString() || "0",
        reportingPeriod: "2024",
      };
    };

    // Form submit handlers
    const handleSaveEmission = async (formData: any) => {
      if (!selectedScope || !selectedCategory) {
        toast({
          title: "Error",
          description: "Please select scope and category first",
          variant: "destructive",
        });
        return;
      }

      const emissionData = await transformFormDataToEmission(
        formData,
        selectedScope,
        selectedCategory
      );
      console.log("Emission data before saving:", emissionData);
      if (
        user?.role === "consultant" &&
        selectedClient &&
        selectedClient !== "all"
      ) {
        emissionData.organizationId = Number(selectedClient);
      }
      console.log(
        "Saving emission data:",
        emissionData,
        user?.role === "consultant" &&
          selectedClient &&
          selectedClient !== "all",
        selectedClient
      );
      saveEmissionMutation.mutate(emissionData);
    };

    // Form schemas
    const reportingFormSchema = z.object({
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      location: z.string().min(1, "Location is required"),
    });
    const scope1CategoriesSchema = {
      Fuels: z.object({
        fuelType: z.string().min(1, "Fuel type is required"),
        fuelSubType: z.string().min(1, "Fuel sub-type is required"),
        unit: z.string().min(1, "Unit is required"),
        quantity: z.number().min(0, "Quantity must be positive"),
      }),
      Bioenergy: z.object({
        fuelType: z.string().min(1, "Fuel type is required"),
        fuelSubType: z.string().min(1, "Fuel sub-type is required"),
        unit: z.string().min(1, "Unit is required"),
        quantity: z.number().min(0, "Quantity must be positive"),
      }),
      "Passenger vehicles": z.object({
        fuelType: z.string().min(1, "Vehicle Category is required"),
        fuelSubType: z.string().min(1, "Vehicle Sub-Category is required"),
        unit: z.string().min(1, "Unit is required"),
        quantity: z.number().min(0, "Quantity must be positive"),
        vehicleFuelType: z.string().optional(),
        country: z.string().optional(),
      }),
      "Delivery vehicles": z.object({
        fuelType: z.string().min(1, "Fuel type is required"),
        fuelSubType: z.string().optional(),
        unit: z.string().min(1, "Unit is required"),
        quantity: z.number().min(0, "Quantity must be positive"),
        vehicleFuelType: z.string().optional(),
        country: z.string().optional(),
      }),
      "Refrigerant & other": z.object({
        fuelSubType: z.string().min(1, "Refrigerant is required"),
        quantity: z.number().min(0, "Quantity must be positive"),
      }),
      "UK electricity": z.object({
        country: z.string().min(1, "Country is required"),
        unit: z.string().min(1, "Unit is required"),
        quantity: z.number().min(0, "Quantity must be positive"),
      }),
      "Heat and steam": z.object({
        energyType: z.string().min(1, "Energy type is required"),
        unit: z.string().min(1, "Unit is required"),
        quantity: z.number().min(0, "Quantity must be positive"),
      }),
    };

    // Function to get the validation schema based on selected category
    const getValidationSchema = (selectedCategory: string | null) => {
      if (!selectedCategory) {
        return z.object({});
      }

      console.log("selectedCategory", selectedCategory);

      switch (selectedCategory) {
        case "Fuels":
        case "Bioenergy":
        case "Passenger vehicles":
          return scope1CategoriesSchema[selectedCategory] || z.object({});

        case "Delivery vehicles": {
          const baseSchema = scope1CategoriesSchema["Delivery vehicles"];

          if (!baseSchema || !("shape" in baseSchema)) {
            return z.object({});
          }

          const schema = baseSchema.superRefine((data, ctx) => {
            const optionalFuelTypes = [
              "Vans",
              "Heavy Goods Vehicles (HGVs) – Rigid",
              "HGV (all diesel)",
              "Refrigerated HGVs – Rigid",
              "Refrigerated HGVs – Articulated",
            ];

            // If fuelType is NOT in the allowed list, fuelSubType becomes required
            if (optionalFuelTypes.includes(data.fuelType)) {
              if (!data.fuelSubType || data.fuelSubType.trim() === "") {
                ctx.addIssue({
                  path: ["fuelSubType"],
                  code: z.ZodIssueCode.custom,
                  message: "Fuel subtype is required for this fuel type",
                });
              }
            }
          });

          return schema;
        }

        case "Refrigerant & other":
        case "UK electricity":
        case "Heat and steam":
          return scope1CategoriesSchema[selectedCategory] || z.object({});

        default:
          return z.object({});
      }
    };

    const emissionFormSchema = getValidationSchema(selectedCategory);

    const reportingForm = useForm<z.infer<typeof reportingFormSchema>>({
      resolver: zodResolver(reportingFormSchema),
      defaultValues: {
        startDate: "",
        endDate: "",
        location: "",
      },
    });

    const emissionForm = useForm<z.infer<typeof emissionFormSchema>>({
      resolver: zodResolver(emissionFormSchema),
      defaultValues: {
        fuelType: "",
        fuelSubType: "",
        unit: "",
        quantity: 0,
        vehicleFuelType: "",
        ladenWeight: "",
        country: "",
        energyType: "",
        supplierInfo: "",
      },
      shouldUnregister: true,
    });

    try {
      const parsed = emissionFormSchema.parse(emissionForm.getValues());
      console.log("Parsed data:", parsed);
    } catch (e) {
      console.log("Validation errors:", e.errors);
    }

    // Data for dropdown options
    const scope1Categories = [
      {
        id: "Fuels",
        name: "Stationary Combustion - Fuel",
        description: "Fuel combustion in stationary equipment",
      },
      {
        id: "Bioenergy",
        name: "Stationary Combustion - Bioenergy",
        description: "Bioenergy combustion in stationary equipment",
      },
      {
        id: "Passenger vehicles",
        name: "Mobile Combustion - Passenger Vehicles",
        description: "Passenger vehicle fuel combustion",
      },
      {
        id: "Delivery vehicles",
        name: "Mobile Combustion - Delivery Vehicles",
        description: "Delivery vehicle fuel combustion",
      },
      {
        id: "Refrigerant & other",
        name: "Fugitive Emissions - Refrigerants",
        description: "Refrigerant emissions and leaks",
      },
    ];

    const scope2Categories = [
      {
        id: "UK electricity",
        name: "Purchased Electricity",
        description: "Electricity purchased from grid",
      },
      {
        id: "Heat and steam",
        name: "Purchased Heat & Steam",
        description: "Heat and steam purchased from external sources",
      },
    ];

    const fuelTypes = {
      Fuels: [
        { value: "Gaseous fuels", label: "Gaseous Fuels" },
        { value: "Liquid fuels", label: "Liquid Fuels" },
        { value: "Solid fuels", label: "Solid Fuels" },
      ],
      Bioenergy: [
        { value: "Biofuel", label: "Biofuel" },
        { value: "Biomass", label: "Biomass" },
        { value: "Biogas", label: "Biogas" },
      ],
      "Passenger vehicles": [
        {
          value: "Cars (by market segment)",
          label: "Cars (by market segment)",
        },
        { value: "Cars (by size)", label: "Cars (by size)" },
        { value: "Motorbike", label: "Motorbike" },
      ],
      "Delivery vehicles": [
        { value: "Vans", label: "Vans" },
        {
          value: "Heavy Goods Vehicles (HGVs) – Rigid",
          label: "Heavy Goods Vehicles (HGVs) – Rigid",
        },
        {
          value: "HGV (all diesel)",
          label: "Heavy Goods Vehicles (HGVs) – Articulated",
        },
        {
          value: "Refrigerated HGVs – Rigid",
          label: "Refrigerated HGVs – Rigid",
        },
        {
          value: "Refrigerated HGVs – Articulated",
          label: "Refrigerated HGVs – Articulated",
        },
        { value: "All Vans (Average)", label: "All Vans (Average)" },
        { value: "All HGVs (Average)", label: "All HGVs (Average)" },
        {
          value: "HGVs refrigerated (all diesel)",
          label: "All refrigerated HGVs (Average)",
        },
      ],
      "Refrigerant & other": [{ value: "refrigerant", label: "Refrigerant" }],
    };

    const fuelSubTypes = {
      "Gaseous fuels": [
        { value: "Butane", label: "Butane" },
        { value: "CNG", label: "CNG" },
        { value: "LNG", label: "LNG" },
        { value: "LPG", label: "LPG" },
        { value: "Natural gas", label: "Natural gas" },
        {
          value: "Natural gas (100% mineral blend)",
          label: "Natural gas (100% mineral blend)",
        },
        { value: "Other petroleum gas", label: "Other petroleum gas" },
        { value: "Propane", label: "Propane" },
      ],
      "Liquid fuels": [
        { value: "Aviation spirit", label: "Aviation spirit" },
        { value: "Aviation turbine fuel", label: "Aviation turbine fuel" },
        { value: "Burning oil", label: "Burning oil" },
        {
          value: "Diesel (average biofuel blend)",
          label: "Diesel (average biofuel blend)",
        },
        {
          value: "Diesel (100% mineral diesel)",
          label: "Diesel (100% mineral diesel)",
        },
        { value: "Fuel oil", label: "Fuel oil" },
        { value: "Gas oil", label: "Gas oil" },
        { value: "Lubricants", label: "Lubricants" },
        { value: "Naphtha", label: "Naphtha" },
        {
          value: "Petrol (average biofuel blend)",
          label: "Petrol (average biofuel blend)",
        },
        {
          value: "Petrol (100% mineral petrol)",
          label: "Petrol (100% mineral petrol)",
        },
        {
          value: "Processed fuel oils - residual oil",
          label: "Processed fuel oils - residual oil",
        },
        {
          value: "Processed fuel oils - distillate oil",
          label: "Processed fuel oils - distillate oil",
        },
        { value: "refinery-misc", label: "Refinery miscellaneous" },
        { value: "Waste oils", label: "Waste oils" },
        { value: "Marine gas oil", label: "Marine gas oil" },
        { value: "Marine fuel oil", label: "Marine fuel oil" },
      ],
      "Solid fuels": [
        { value: "Coal (industrial)", label: "Coal (industrial)" },
        {
          value: "Coal (electricity generation)",
          label: "Coal (electricity generation)",
        },
        { value: "Coal (domestic)", label: "Coal (domestic)" },
        { value: "Coking coal", label: "Coking coal" },
        { value: "Petroleum coke", label: "Petroleum coke" },
        {
          value: "Coal (electricity generation - home produced coal only)",
          label: "Coal (electricity generation - home produced coal only)",
        },
      ],
      Biofuel: [
        { value: "Bioethanol", label: "Bioethanol" },
        { value: "Biodiesel ME", label: "Biodiesel ME" },
        {
          value: "Biodiesel ME (from used cooking oil)",
          label: "Biodiesel ME (from used cooking oil)",
        },
        {
          value: "Biodiesel ME (from tallow)",
          label: "Biodiesel ME (from tallow)",
        },
        { value: "Biodiesel HVO", label: "Biodiesel HVO" },
        { value: "Biopropane", label: "Biopropane" },
        { value: "Development diesel", label: "Development diesel" },
        { value: "Development petrol", label: "Development petrol" },
        { value: "Off road biodiesel", label: "Off road biodiesel" },
        { value: "Biomethane (compressed)", label: "Biomethane (compressed)" },
        { value: "Biomethane (liquified)", label: "Biomethane (liquified)" },
        { value: "Methanol (bio)", label: "Methanol (bio)" },
        { value: "Avtur (renewable)", label: "Avtur (renewable)" },
      ],
      Biomass: [
        { value: "Wood logs", label: "Wood logs" },
        { value: "Wood chips", label: "Wood chips" },
        { value: "Wood pellets", label: "Wood pellets" },
        { value: "Grass/straw", label: "Grass/straw" },
      ],
      Biogas: [
        { value: "Biogas", label: "Biogas" },
        { value: "Landfill gas", label: "Landfill gas" },
      ],
      // Mobile Passenger Vehicles
      "Cars (by market segment)": [
        { value: "Mini", label: "Mini" },
        { value: "Supermini", label: "Supermini" },
        { value: "Lower medium", label: "Lower medium" },
        { value: "Upper medium", label: "Upper medium" },
        { value: "Executive", label: "Executive" },
        { value: "Luxury", label: "Luxury" },
        { value: "Sports", label: "Sports" },
        { value: "Dual purpose 4X4", label: "Dual purpose 4X4" },
        { value: "MPV", label: "MPV" },
      ],
      "Cars (by size)": [
        { value: "Small car", label: "Small car" },
        { value: "Medium car", label: "Medium car" },
        { value: "Large car", label: "Large car" },
        { value: "Average car", label: "Average car" },
      ],
      Motorbike: [
        { value: "Small", label: "Small" },
        { value: "Medium", label: "Medium" },
        { value: "Large", label: "Large" },
        { value: "Average", label: "Average" },
      ],
      // Mobile Delivery Vehicles
      Vans: [
        {
          value: "Class I (up to 1.305 tonnes)",
          label: "Class I (up to 1.305 tonnes)",
        },
        {
          value: "Class II (1.305 to 1.74 tonnes)",
          label: "Class II (1.305 to 1.74 tonnes)",
        },
        {
          value: "Class III (1.74 to 3.5 tonnes)",
          label: "Class III (1.74 to 3.5 tonnes)",
        },
        {
          value: "Average (up to 3.5 tonnes)",
          label: "Average (up to 3.5 tonnes)",
        },
      ],
      "Heavy Goods Vehicles (HGVs) – Rigid": [
        { value: "Rigid (>3.5 - 7.5 tonnes)", label: "3.5 – 7.5 tonnes" },
        { value: "7.5 – 17 tonnes", label: "7.5 – 17 tonnes" },
        { value: "17 tonnes", label: "17 tonnes" },
        { value: "All rigids (Average)", label: "All rigids (Average)" },
      ],
      "HGV (all diesel)": [
        { value: "3.5 – 33 tonnes", label: "3.5 – 33 tonnes" },
        { value: "33 tonnes", label: "33 tonnes" },
        { value: "All artics (Average)", label: "All artics (Average)" },
      ],
      "Refrigerated HGVs – Rigid": [
        { value: "3.5 – 7.5 tonnes", label: "3.5 – 7.5 tonnes" },
        { value: "7.5 – 17 tonnes", label: "7.5 – 17 tonnes" },
        { value: "17 tonnes", label: "17 tonnes" },
        { value: "All rigids (Average)", label: "All rigids (Average)" },
      ],
      "Refrigerated HGVs – Articulated": [
        { value: "3.5 – 33 tonnes", label: "3.5 – 33 tonnes" },
        { value: "33 tonnes", label: "33 tonnes" },
        { value: "All artics (Average)", label: "All artics (Average)" },
      ],
      "All Vans (Average)": [],
      "All HGVs (Average)": [],
      "HGVs refrigerated (all diesel)": [],
      // Fugitive Refrigerants
      refrigerant: [
        { value: "Carbon dioxide", label: "Carbon dioxide" },
        { value: "Methane", label: "Methane" },
        { value: "Nitrous oxide", label: "Nitrous oxide" },
        { value: "HFC-23", label: "HFC-23" },
        { value: "HFC-32", label: "HFC-32" },
        { value: "HFC-41", label: "HFC-41" },
        { value: "HFC-125", label: "HFC-125" },
        { value: "HFC-134", label: "HFC-134" },
        { value: "HFC-134a", label: "HFC-134a" },
        { value: "HFC-143", label: "HFC-143" },
        { value: "HFC-143a", label: "HFC-143a" },
        { value: "HFC-152a", label: "HFC-152a" },
        { value: "HFC-227ea", label: "HFC-227ea" },
        { value: "HFC-236fa", label: "HFC-236fa" },
        { value: "HFC-245fa", label: "HFC-245fa" },
        { value: "HFC-43-I0mee", label: "HFC-43-I0mee" },
        {
          value: "Perfluoromethane (PFC-14)",
          label: "Perfluoromethane (PFC-14)",
        },
        {
          value: "Perfluoroethane (PFC-116)",
          label: "Perfluoroethane (PFC-116)",
        },
        {
          value: "Perfluoropropane (PFC-218)",
          label: "Perfluoropropane (PFC-218)",
        },
        {
          value: "Perfluorocyclobutane (PFC-318)",
          label: "Perfluorocyclobutane (PFC-318)",
        },
        {
          value: "Perfluorobutane (PFC-3-1-10)",
          label: "Perfluorobutane (PFC-3-1-10)",
        },
        {
          value: "Perfluoropentane (PFC-4-1-12)",
          label: "Perfluoropentane (PFC-4-1-12)",
        },
        {
          value: "Perfluorohexane (PFC-5-1-14)",
          label: "Perfluorohexane (PFC-5-1-14)",
        },
        { value: "PFC-9-1-18", label: "PFC-9-1-18" },
        { value: "Perfluorocyclopropane", label: "Perfluorocyclopropane" },
        {
          value: "Sulphur hexafluoride (SF6)",
          label: "Sulphur hexafluoride (SF6)",
        },
        { value: "HFC-152", label: "HFC-152" },
        { value: "HFC-161", label: "HFC-161" },
        { value: "HFC-236cb", label: "HFC-236cb" },
        { value: "HFC-236ea", label: "HFC-236ea" },
        { value: "HFC-245ca", label: "HFC-245ca" },
      ],
    };

    const units = {
      "Gaseous fuels": [
        { value: "tonnes", label: "tonnes" },
        { value: "kWh (Net CV)", label: "kWh (Net CV)" },
        { value: "kWh (Gross CV)", label: "kWh (Gross CV)" },
      ],
      "Liquid fuels": [
        { value: "tonnes", label: "tonnes" },
        { value: "kWh (Net CV)", label: "kWh (Net CV)" },
        { value: "kWh (Gross CV)", label: "kWh (Gross CV)" },
        { value: "litres", label: "litres" },
      ],
      "Solid fuels": [
        { value: "tonnes", label: "tonnes" },
        { value: "kWh (Net CV)", label: "kWh (Net CV)" },
        { value: "kWh (Gross CV)", label: "kWh (Gross CV)" },
      ],
      Biofuel: [
        { value: "litres", label: "litres" },
        { value: "GJ", label: "GJ" },
        { value: "kg", label: "kg" },
      ],
      Biomass: [
        { value: "tonnes", label: "tonnes" },
        { value: "kWh", label: "kWh" },
      ],
      Biogas: [
        { value: "tonnes", label: "tonnes" },
        { value: "kWh", label: "kWh" },
      ],
      // Mobile passenger vehicles - distance units
      "Cars (by market segment)": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      "Cars (by size)": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      Motorbike: [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      // Mobile delivery vehicles - distance units
      Vans: [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      "Heavy Goods Vehicles (HGVs) – Rigid": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      "HGV (all diesel)": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      "Refrigerated HGVs – Rigid": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      "Refrigerated HGVs – Articulated": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      "All Vans (Average)": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      "All HGVs (Average)": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      "HGVs refrigerated (all diesel)": [
        { value: "km", label: "km" },
        { value: "miles", label: "miles" },
      ],
      // Fugitive refrigerants - mass units
      refrigerant: [{ value: "kg", label: "kg" }],
    };

    const vehicleFuelTypes = [
      { value: "diesel", label: "Diesel" },
      { value: "petrol", label: "Petrol" },
      { value: "hybrid", label: "Hybrid" },
      { value: "phev", label: "Plug-in Hybrid Electric Vehicle" },
      { value: "bev", label: "Battery Electric Vehicle" },
      { value: "unknown", label: "Unknown" },
      { value: "CNG", label: "CNG" },
      { value: "LPG", label: "LPG" },
    ];

    const vanFuelTypes = [
      { value: "diesel", label: "Diesel" },
      { value: "petrol", label: "Petrol" },
      { value: "phev", label: "Plug-in Hybrid Electric Vehicle" },
      { value: "bev", label: "Battery Electric Vehicle" },
      { value: "hybrid", label: "Hybrid" },
      { value: "CNG", label: "CNG" },
      { value: "LPG", label: "LPG" },
      { value: "unknown", label: "Unknown" },
    ];

    const ladenWeightOptions = [
      { value: "0-laden", label: "0% Laden" },
      { value: "50-laden", label: "50% Laden" },
      { value: "100-laden", label: "100% Laden" },
      { value: "average-laden", label: "Average laden" },
    ];

    const countryOptions = [
      { value: "uk", label: "United Kingdom" },
      { value: "us", label: "United States" },
      { value: "ca", label: "Canada" },
      { value: "au", label: "Australia" },
      { value: "de", label: "Germany" },
      { value: "fr", label: "France" },
      { value: "it", label: "Italy" },
      { value: "es", label: "Spain" },
      { value: "nl", label: "Netherlands" },
      { value: "se", label: "Sweden" },
      { value: "no", label: "Norway" },
      { value: "dk", label: "Denmark" },
      { value: "fi", label: "Finland" },
      { value: "jp", label: "Japan" },
      { value: "kr", label: "South Korea" },
      { value: "cn", label: "China" },
      { value: "in", label: "India" },
      { value: "br", label: "Brazil" },
      { value: "mx", label: "Mexico" },
      { value: "za", label: "South Africa" },
    ];

    const energyTypeOptions = [
      { value: "onsite", label: "Onsite heat and steam" },
      { value: "district", label: "District heat and steam" },
    ];

    const handleCancel = () => {
      setSelectedScope(null);
      setSelectedCategory(null);
      emissionForm.reset();
    };

    return (
      <div className="space-y-6">
        {/* Header Section - Matching the screenshot */}
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
          <CardContent className="p-6">
            {/* Data Input Method Tabs */}
            <div className="flex space-x-1 mb-6">
              <Button
                variant={activeTab === "manual" ? "default" : "outline"}
                onClick={() => setActiveTab("manual")}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Manual Entry
              </Button>
              <Button
                variant={activeTab === "upload" ? "default" : "outline"}
                onClick={() => setActiveTab("upload")}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                File Upload
              </Button>
              <Button
                variant={activeTab === "connect" ? "default" : "outline"}
                onClick={() => setActiveTab("connect")}
                className="flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                Connect System
              </Button>
            </div>

            {/* Reporting Period and Location */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reporting Period */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Reporting Period
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      placeholder="Start Date"
                      className="pl-10"
                      {...reportingForm.register("startDate")}
                      max={reportingForm.watch("endDate") || undefined}
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      placeholder="End Date"
                      className="pl-10"
                      {...reportingForm.register("endDate")}
                      min={reportingForm.watch("startDate") || undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Facility/Location */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Facility/Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Select
                    onValueChange={(value) =>
                      reportingForm.setValue("location", value)
                    }
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities.length > 0 ? (
                        facilities.map((facility: any) => (
                          <SelectItem key={facility.id} value={facility.name}>
                            {facility.name} - {facility.city},{" "}
                            {facility.country}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="headquarters">
                            Headquarters - London
                          </SelectItem>
                          <SelectItem value="manufacturing">
                            Manufacturing Plant - Manchester
                          </SelectItem>
                          <SelectItem value="warehouse">
                            Warehouse - Birmingham
                          </SelectItem>
                          <SelectItem value="office">
                            Regional Office - Edinburgh
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Data Completeness Progress */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Data Completeness
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {completeness}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scope Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className={`cursor-pointer transition-all ${
              selectedScope === "scope1"
                ? "border-blue-500 bg-blue-50"
                : "hover:border-gray-300"
            }`}
            onClick={() => {
              setSelectedScope("scope1");
              setSelectedCategory(null);
            }}
          >
            <CardHeader>
              <CardTitle className="text-lg">
                Scope 1: Direct Emissions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Direct GHG emissions from sources that are owned or controlled
                by the organization
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scope1Categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedScope === "scope2"
                ? "border-green-500 bg-green-50"
                : "hover:border-gray-300"
            }`}
            onClick={() => {
              setSelectedScope("scope2");
              setSelectedCategory(null);
            }}
          >
            <CardHeader>
              <CardTitle className="text-lg">
                Scope 2: Indirect Emissions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Indirect GHG emissions from purchased electricity, heat, steam,
                and cooling
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scope2Categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Selection */}
        {selectedScope && (
          <Card>
            <CardHeader>
              <CardTitle>Select Category</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose the emission category for{" "}
                {selectedScope === "scope1" ? "Scope 1" : "Scope 2"}{" "}
                calculations
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedScope === "scope1"
                  ? scope1Categories
                  : scope2Categories
                ).map((category) => (
                  <Card
                    key={category.id}
                    className={`cursor-pointer transition-all ${
                      selectedCategory === category.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emission Calculation Forms */}
        {selectedCategory &&
          (selectedCategory === "Fuels" ||
            selectedCategory === "Bioenergy") && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCategory === "Fuels"
                    ? "Stationary Combustion - Fuel"
                    : "Stationary Combustion - Bioenergy"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enter the details for your{" "}
                  {selectedCategory === "Fuels" ? "Fuels" : "bioenergy"}{" "}
                  consumption
                </p>
              </CardHeader>
              <CardContent>
                <Form {...emissionForm}>
                  <form
                    onSubmit={emissionForm.handleSubmit(handleSaveEmission)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Fuel Type */}
                      <FormField
                        control={emissionForm.control}
                        name="fuelType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {selectedCategory === "Fuels"
                                ? "Fuel Type"
                                : "Bioenergy Type"}
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={`Select ${
                                      selectedCategory === "Fuels"
                                        ? "fuel"
                                        : "bioenergy"
                                    } type`}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {fuelTypes[
                                  selectedCategory as keyof typeof fuelTypes
                                ]?.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Fuel Sub-Type */}
                      <FormField
                        control={emissionForm.control}
                        name="fuelSubType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {selectedCategory === "Fuels"
                                ? "Fuel Sub-Type"
                                : "Bioenergy Sub-Type"}
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={`Select ${
                                      selectedCategory === "Fuels"
                                        ? "fuel"
                                        : "bioenergy"
                                    } sub-type`}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {emissionForm.watch("fuelType") &&
                                  fuelSubTypes[
                                    emissionForm.watch(
                                      "fuelType"
                                    ) as keyof typeof fuelSubTypes
                                  ]?.map((subType) => (
                                    <SelectItem
                                      key={subType.value}
                                      value={subType.value}
                                    >
                                      {subType.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Unit */}
                      <FormField
                        control={emissionForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit of Consumption</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {emissionForm.watch("fuelType") &&
                                  units[
                                    emissionForm.watch(
                                      "fuelType"
                                    ) as keyof typeof units
                                  ]?.map((unit) => (
                                    <SelectItem
                                      key={unit.value}
                                      value={unit.value}
                                    >
                                      {unit.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantity */}
                      <FormField
                        control={emissionForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter quantity"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the quantity of{" "}
                              {selectedCategory === "Fuels"
                                ? "fuel"
                                : "bioenergy"}{" "}
                              consumed using the selected unit.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={saveEmissionMutation.isPending}
                      >
                        {saveEmissionMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

        {/* Mobile Passenger Vehicles Form */}
        {selectedCategory === "Passenger vehicles" && (
          <Card>
            <CardHeader>
              <CardTitle>Mobile Combustion - Passenger Vehicles</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the details for your passenger vehicle emissions
              </p>
            </CardHeader>
            <CardContent>
              <Form {...emissionForm}>
                <form
                  onSubmit={emissionForm.handleSubmit(handleSaveEmission)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vehicle Category */}
                    <FormField
                      control={emissionForm.control}
                      name="fuelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vehicle category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fuelTypes["Passenger vehicles"]?.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Vehicle Sub-Category */}
                    <FormField
                      control={emissionForm.control}
                      name="fuelSubType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Sub-Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vehicle sub-category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {emissionForm.watch("fuelType") &&
                                fuelSubTypes[
                                  emissionForm.watch(
                                    "fuelType"
                                  ) as keyof typeof fuelSubTypes
                                ]?.map((subType) => (
                                  <SelectItem
                                    key={subType.value}
                                    value={subType.value}
                                  >
                                    {subType.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Fuel Type */}
                    <FormField
                      control={emissionForm.control}
                      name="vehicleFuelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fuel type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicleFuelTypes.map((fuel) => (
                                <SelectItem key={fuel.value} value={fuel.value}>
                                  {fuel.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Distance Unit */}
                    <FormField
                      control={emissionForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distance Unit</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select distance unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="km">km</SelectItem>
                              <SelectItem value="miles">miles</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Distance Travelled */}
                    <FormField
                      control={emissionForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Distance Travelled</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter distance travelled"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the number of kilometers or miles driven.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveEmissionMutation.isPending}
                    >
                      {saveEmissionMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Mobile Delivery Vehicles Form */}
        {selectedCategory === "Delivery vehicles" && (
          <Card>
            <CardHeader>
              <CardTitle>Mobile Combustion - Delivery Vehicles</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the details for your delivery vehicle emissions
              </p>
            </CardHeader>
            <CardContent>
              <Form {...emissionForm}>
                <form
                  onSubmit={emissionForm.handleSubmit(handleSaveEmission)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vehicle Category */}
                    <FormField
                      control={emissionForm.control}
                      name="fuelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vehicle category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fuelTypes["Delivery vehicles"]?.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Vehicle Sub-Category */}
                    {emissionForm.watch("fuelType") &&
                      ![
                        "All Vans (Average)",
                        "All HGVs (Average)",
                        "HGVs refrigerated (all diesel)",
                      ].includes(emissionForm.watch("fuelType")) && (
                        <FormField
                          control={emissionForm.control}
                          name="fuelSubType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vehicle Sub-Category</FormLabel>
                              <Select
                                // onValueChange={() => {
                                //   console.log(
                                //     "field value",
                                //     field.value,
                                //     field
                                //   );
                                //   field.onChange(field.value);
                                // }}
                                onValueChange={(value) => {
                                  console.log("value", value, "field", field);
                                  field.onChange(value); // Ensure value is passed correctly to form field
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select vehicle sub-category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {emissionForm.watch("fuelType") &&
                                    fuelSubTypes[
                                      emissionForm.watch(
                                        "fuelType"
                                      ) as keyof typeof fuelSubTypes
                                    ]?.map((subType) => (
                                      <SelectItem
                                        key={subType.value}
                                        value={subType.value}
                                      >
                                        {subType.label}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                    {/* Fuel Load / Laden Weight - only for HGVs */}
                    {emissionForm.watch("fuelType") &&
                      [
                        "Heavy Goods Vehicles (HGVs) – Rigid",
                        "HGV (all diesel)",
                        "Refrigerated HGVs – Rigid",
                        "Refrigerated HGVs – Articulated",
                      ].includes(emissionForm.watch("fuelType")) && (
                        <FormField
                          control={emissionForm.control}
                          name="ladenWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fuel Load / Laden Weight</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select laden weight" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ladenWeightOptions.map((option) => (
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
                      )}

                    {/* Fuel Type - only for vans */}
                    {emissionForm.watch("fuelType") === "Vans" && (
                      <FormField
                        control={emissionForm.control}
                        name="vehicleFuelType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuel Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select fuel type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vanFuelTypes.map((fuel) => (
                                  <SelectItem
                                    key={fuel.value}
                                    value={fuel.value}
                                  >
                                    {fuel.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Distance Unit */}
                    <FormField
                      control={emissionForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distance Unit</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select distance unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="km">km</SelectItem>
                              <SelectItem value="miles">miles</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Distance Travelled */}
                    <FormField
                      control={emissionForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Distance Travelled</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter distance travelled"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the number of kilometers or miles driven.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveEmissionMutation.isPending}
                    >
                      {saveEmissionMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Fugitive Emissions - Refrigerants Form */}
        {selectedCategory === "Refrigerant & other" && (
          <Card>
            <CardHeader>
              <CardTitle>Fugitive Emissions - Refrigerants</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the details for your refrigerant emissions
              </p>
            </CardHeader>
            <CardContent>
              <Form {...emissionForm}>
                <form
                  onSubmit={emissionForm.handleSubmit(handleSaveEmission)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Refrigerant Name */}
                    <FormField
                      control={emissionForm.control}
                      name="fuelSubType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refrigerant Name</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select refrigerant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fuelSubTypes.refrigerant?.map((refrigerant) => (
                                <SelectItem
                                  key={refrigerant.value}
                                  value={refrigerant.value}
                                >
                                  {refrigerant.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Refrigerant Quantity */}
                    <FormField
                      control={emissionForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refrigerant Quantity (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="Enter quantity in kg"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the mass of refrigerant released, leaked, or
                            otherwise emitted.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveEmissionMutation.isPending}
                    >
                      {saveEmissionMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Purchased Electricity Form */}
        {selectedCategory === "UK electricity" && (
          <Card>
            <CardHeader>
              <CardTitle>Purchased Electricity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the details for your purchased electricity consumption
              </p>
            </CardHeader>
            <CardContent>
              <Form {...emissionForm}>
                <form
                  onSubmit={emissionForm.handleSubmit(handleSaveEmission)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Country/Region */}
                    <FormField
                      control={emissionForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country/Region</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country/region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countryOptions.map((country) => (
                                <SelectItem
                                  key={country.value}
                                  value={country.value}
                                >
                                  {country.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Consumption Unit */}
                    <FormField
                      control={emissionForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consumption Unit</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select consumption unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kWh">kWh</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Electricity Consumed */}
                    <FormField
                      control={emissionForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Electricity Consumed</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter electricity consumed"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the amount of electricity consumed in kWh.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveEmissionMutation.isPending}
                    >
                      {saveEmissionMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Purchased Heat & Steam Form */}
        {selectedCategory === "Heat and steam" && (
          <Card>
            <CardHeader>
              <CardTitle>Purchased Heat & Steam</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the details for your purchased heat and steam consumption
              </p>
            </CardHeader>
            <CardContent>
              <Form {...emissionForm}>
                <form
                  onSubmit={emissionForm.handleSubmit(handleSaveEmission)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Energy Type */}
                    <FormField
                      control={emissionForm.control}
                      name="energyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Energy Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select energy type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {energyTypeOptions.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit */}
                    <FormField
                      control={emissionForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kWh">kWh</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Supplier Info */}
                    <FormField
                      control={emissionForm.control}
                      name="supplierInfo"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Supplier Info (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter supplier information"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: Enter details about your energy supplier.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Energy Used */}
                    <FormField
                      control={emissionForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Energy Used</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter energy used"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the amount of energy used in kWh.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveEmissionMutation.isPending}
                    >
                      {saveEmissionMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
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
              Emission Overview
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">📅 Current Reporting Year</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
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

        <Tabs defaultValue="overview" className="w-full">
          <div className="mb-6">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="overview" className="text-blue-600">
                Emission Overview
              </TabsTrigger>
              <TabsTrigger
                disabled={user?.role === "consultant" && selectedClient === ""}
                value="add-data"
              >
                Add Emission Data
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Emissions"
                value={totalEmissions}
                unit="tCO2e"
                trend={getTrendData(totalEmissions, "total")}
                scope="total"
              />
              <MetricCard
                title="Scope 1"
                value={scope1Total}
                unit="tCO2e"
                trend={getTrendData(scope1Total, "scope1")}
                scope="scope1"
              />
              <MetricCard
                title="Scope 2"
                value={scope2Total}
                unit="tCO2e"
                trend={getTrendData(scope2Total, "scope2")}
                scope="scope2"
              />
              <MetricCard
                title="Scope 3"
                value={scope3Total}
                unit="tCO2e"
                trend={getTrendData(scope3Total, "scope3")}
                scope="scope3"
              />
            </div>

            {/* Insights Cards */}
            <EmissionsInsights />

            {/* Charts and Analytics */}
            <EmissionsOverviewCharts />
          </TabsContent>

          <TabsContent value="add-data" className="space-y-6">
            <EmissionDataEntry />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
