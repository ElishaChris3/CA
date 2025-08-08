import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Leaf, ChevronLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface FormData {
  // Business Profile
  companyName: string;
  industrySector: string;
  businessType: string;
  ownerEmail: string;

  // Operations Overview
  employeeCount: number;
  annualRevenueRange: string;
  numberOfFacilities: string;
  headquarterLocation: string;
}

export default function OrganizationOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    industrySector: "",
    businessType: "",
    ownerEmail: "",
    employeeCount: 25,
    annualRevenueRange: "",
    numberOfFacilities: "",
    headquarterLocation: "",
  });

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const data = searchParams.get("data");
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        setUserData(parsed);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        setLocation("/");
      }
    }
  }, []);

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const updatedData = {
        name: data.companyName,
        industry: data.industrySector,
        businessType: data.businessType,
        employeeCount: data.employeeCount,
        annualRevenue: data.annualRevenueRange,
        country: data.headquarterLocation,
        reportingYear: new Date().getFullYear(),
        ownerEmail: data.ownerEmail,
      };
      return await apiRequest("/api/organizations", "POST", {
        data: updatedData,
        userData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Organization Created",
        description: "Your organization profile has been set up successfully!",
      });
      // Navigate to organization dashboard
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create organization profile",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate business profile fields
      if (
        !formData.companyName ||
        !formData.industrySector ||
        !formData.ownerEmail
      ) {
        toast({
          title: "Required Fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  const handleComplete = () => {
    // Validate all required fields
    if (
      !formData.companyName ||
      !formData.industrySector ||
      !formData.ownerEmail ||
      !formData.annualRevenueRange ||
      !formData.numberOfFacilities ||
      !formData.headquarterLocation
    ) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createOrganizationMutation.mutate(formData);
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getEmployeeCountLabel = (count: number): string => {
    if (count <= 10) return "Micro enterprises: 1 to 10 employees";
    if (count <= 49) return "Small-sized enterprises: 10 to 49 employees";
    if (count <= 249) return "Medium-sized enterprises: 50 to 249 employees";
    return "Large enterprises: 250+ employees";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-80 bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-[var(--ca-green-normal)] rounded-lg flex items-center justify-center">
              <Leaf className="text-white h-5 w-5" />
            </div>
            <span className="ml-3 text-xl font-medium text-[var(--ca-grey-darker)]">
              Carbon Aegis
            </span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--ca-grey-darker)] mb-2">
              Streamline your ESG consulting
            </h1>
            <p className="text-sm text-[var(--ca-grey-dark)]">
              Follow the 7 simple steps to configure your client setup so that
              you can deliver exceptional sustainability guidance.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {/* Step 1: Business Profile */}
            <div className="flex items-start space-x-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 1
                    ? "bg-pink-100 text-pink-600 border-2 border-pink-300"
                    : currentStep > 1
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <div>
                <h3
                  className={`font-medium ${
                    currentStep === 1
                      ? "text-[var(--ca-grey-darker)]"
                      : "text-gray-500"
                  }`}
                >
                  Business Profile
                </h3>
                <p className="text-sm text-gray-500">
                  Capture core business details for personalized footprint
                  analysis
                </p>
              </div>
            </div>

            {/* Step 2: Operations Overview */}
            <div className="flex items-start space-x-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 2
                    ? "bg-pink-100 text-pink-600 border-2 border-pink-300"
                    : currentStep > 2
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <div>
                <h3
                  className={`font-medium ${
                    currentStep === 2
                      ? "text-[var(--ca-grey-darker)]"
                      : "text-gray-500"
                  }`}
                >
                  Operations Overview
                </h3>
                <p className="text-sm text-gray-500">
                  Map operational workflows influencing ecological footprint
                </p>
              </div>
            </div>
          </div>

          {/* GDPR Ready Badge */}
          <div className="mt-auto pt-8">
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">★</span>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-900">GDPR</div>
                <div className="text-xs text-blue-700">Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {currentStep === 1 && (
            <Card className="max-w-2xl">
              <div className="bg-gray-600 text-white p-6 rounded-t-lg">
                <h2 className="text-xl font-semibold">Business Profile</h2>
              </div>
              <CardContent className="p-8 space-y-6">
                <div>
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={(e) =>
                      updateFormData("companyName", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="industrySector"
                    className="text-sm font-medium"
                  >
                    Industry sector <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.industrySector}
                    onValueChange={(value) =>
                      updateFormData("industrySector", value)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="manufacturing">
                        Manufacturing
                      </SelectItem>
                      <SelectItem value="finance">Finance & Banking</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="energy">Energy & Utilities</SelectItem>
                      <SelectItem value="retail">
                        Retail & Consumer Goods
                      </SelectItem>
                      <SelectItem value="transportation">
                        Transportation & Logistics
                      </SelectItem>
                      <SelectItem value="construction">
                        Construction & Real Estate
                      </SelectItem>
                      <SelectItem value="agriculture">
                        Agriculture & Food
                      </SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessType" className="text-sm font-medium">
                    Business Type
                  </Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) =>
                      updateFormData("businessType", value)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="llc">
                        Limited Liability Company (LLC)
                      </SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="sole-proprietorship">
                        Sole Proprietorship
                      </SelectItem>
                      <SelectItem value="nonprofit">
                        Non-Profit Organization
                      </SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ownerEmail" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.ownerEmail}
                    onChange={(e) =>
                      updateFormData("ownerEmail", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="max-w-2xl">
              <div className="bg-gray-600 text-white p-6 rounded-t-lg">
                <h2 className="text-xl font-semibold">Operations Overview</h2>
              </div>
              <CardContent className="p-8 space-y-6">
                <div>
                  <Label className="text-sm font-medium">
                    Employee count slider{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-4">
                    <Slider
                      value={[formData.employeeCount]}
                      onValueChange={(value) =>
                        updateFormData("employeeCount", value[0])
                      }
                      max={500}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      {getEmployeeCountLabel(formData.employeeCount)}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Annual revenue range <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.annualRevenueRange}
                    onValueChange={(value) =>
                      updateFormData("annualRevenueRange", value)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Medium Companies: $10 million to $100 million" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="micro">
                        Micro Companies: Under $1 million
                      </SelectItem>
                      <SelectItem value="small">
                        Small Companies: $1 million to $10 million
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium Companies: $10 million to $100 million
                      </SelectItem>
                      <SelectItem value="large">
                        Large Companies: $100 million to $1 billion
                      </SelectItem>
                      <SelectItem value="enterprise">
                        Enterprise: Over $1 billion
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Number of facilities <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.numberOfFacilities}
                    onValueChange={(value) =>
                      updateFormData("numberOfFacilities", value)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="6-10 locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 location</SelectItem>
                      <SelectItem value="2-5">2-5 locations</SelectItem>
                      <SelectItem value="6-10">6-10 locations</SelectItem>
                      <SelectItem value="11-25">11-25 locations</SelectItem>
                      <SelectItem value="26-50">26-50 locations</SelectItem>
                      <SelectItem value="50+">50+ locations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="headquarterLocation"
                    className="text-sm font-medium"
                  >
                    Headquarter location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="headquarterLocation"
                    placeholder="Berlin"
                    value={formData.headquarterLocation}
                    onChange={(e) =>
                      updateFormData("headquarterLocation", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="px-6"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={createOrganizationMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    {createOrganizationMutation.isPending
                      ? "Setting up..."
                      : "Complete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
