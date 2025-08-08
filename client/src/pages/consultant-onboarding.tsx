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
import { Badge } from "@/components/ui/badge";
import { Leaf, ChevronLeft, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface FormData {
  // Consultant Profile
  fullName: string;
  phoneNumber: string;
  primaryLocation: string;
  websiteLinkedIn: string;

  // Experience & Expertise
  typicalClientSize: string;
  esgFrameworks: string[];
  targetIndustries: string[];
  geographicCoverage: string[];

  // Technology & Tools
  esgSoftwarePlatforms: string[];
  dataAnalysisTools: string[];

  // Service Offerings
  serviceOfferings: string[];
}

export default function ConsultantOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phoneNumber: "",
    primaryLocation: "",
    websiteLinkedIn: "",
    typicalClientSize: "",
    esgFrameworks: [],
    targetIndustries: [],
    geographicCoverage: [],
    esgSoftwarePlatforms: [],
    dataAnalysisTools: [],
    serviceOfferings: [],
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

  const createConsultantMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/consultants", "POST", {
        data,
        userData: userData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Consultant Profile Created",
        description: "Your consultant profile has been set up successfully!",
      });
      // Navigate to consultant dashboard
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create consultant profile",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < 4) {
      // Basic validation for required fields
      if (
        currentStep === 1 &&
        (!formData.fullName ||
          !formData.primaryLocation ||
          !formData.websiteLinkedIn)
      ) {
        toast({
          title: "Required Fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    createConsultantMutation.mutate(formData);
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleArrayItem = (field: keyof FormData, item: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i) => i !== item)
      : [...currentArray, item];
    updateFormData(field, newArray);
  };

  const removeArrayItem = (field: keyof FormData, item: string) => {
    const currentArray = formData[field] as string[];
    updateFormData(
      field,
      currentArray.filter((i) => i !== item)
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="max-w-2xl">
            <div className="bg-gray-600 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-semibold">Consultant Profile</h2>
            </div>
            <CardContent className="p-8 space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name/Organization Name{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="Enter your/organization name"
                  value={formData.fullName}
                  onChange={(e) => updateFormData("fullName", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="Enter number"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    updateFormData("phoneNumber", e.target.value)
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label
                  htmlFor="primaryLocation"
                  className="text-sm font-medium"
                >
                  Primary Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="primaryLocation"
                  placeholder="Enter location"
                  value={formData.primaryLocation}
                  onChange={(e) =>
                    updateFormData("primaryLocation", e.target.value)
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label
                  htmlFor="websiteLinkedIn"
                  className="text-sm font-medium"
                >
                  Website/LinkedIn Profile{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="websiteLinkedIn"
                  placeholder="Add url"
                  value={formData.websiteLinkedIn}
                  onChange={(e) =>
                    updateFormData("websiteLinkedIn", e.target.value)
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
        );

      case 2:
        return (
          <Card className="max-w-2xl">
            <div className="bg-gray-600 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-semibold">Experience & Expertise</h2>
            </div>
            <CardContent className="p-8 space-y-6">
              <div>
                <Label className="text-sm font-medium">
                  Typical Client Size
                </Label>
                <Select
                  value={formData.typicalClientSize}
                  onValueChange={(value) =>
                    updateFormData("typicalClientSize", value)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Startups (0-50)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startups">Startups (0-50)</SelectItem>
                    <SelectItem value="small">
                      Small Companies (51-200)
                    </SelectItem>
                    <SelectItem value="medium">
                      Medium Companies (201-1000)
                    </SelectItem>
                    <SelectItem value="large">
                      Large Companies (1000+)
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise (5000+)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">
                    ESG Frameworks Experience
                  </Label>
                  <button className="text-sm text-red-500 hover:underline">
                    Reset Selection
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.esgFrameworks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.esgFrameworks.map((framework) => (
                        <Badge
                          key={framework}
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {framework}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              removeArrayItem("esgFrameworks", framework)
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "GRI",
                      "ESRS",
                      "CSRD",
                      "SASB",
                      "TCFD",
                      "ISO 14001",
                      "UN SDGs",
                      "GHG Protocol",
                      "Other",
                    ].map((framework) => (
                      <Button
                        key={framework}
                        variant={
                          formData.esgFrameworks.includes(framework)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          toggleArrayItem("esgFrameworks", framework)
                        }
                        className="text-xs"
                      >
                        {framework}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">
                    Target Industry for Your ESG Work
                  </Label>
                  <button className="text-sm text-red-500 hover:underline">
                    Reset Selection
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.targetIndustries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.targetIndustries.map((industry) => (
                        <Badge
                          key={industry}
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {industry}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              removeArrayItem("targetIndustries", industry)
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "Financial Services",
                      "Transportation BI",
                      "Retail & Consumer",
                      "Technology",
                      "Manufacturing",
                      "Agriculture",
                      "Healthcare",
                      "Energy & Utilities",
                      "Other",
                    ].map((industry) => (
                      <Button
                        key={industry}
                        variant={
                          formData.targetIndustries.includes(industry)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          toggleArrayItem("targetIndustries", industry)
                        }
                        className="text-xs"
                      >
                        {industry}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">
                    Geographic Coverage
                  </Label>
                  <button className="text-sm text-red-500 hover:underline">
                    Reset Selection
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.geographicCoverage.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.geographicCoverage.map((region) => (
                        <Badge
                          key={region}
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {region}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              removeArrayItem("geographicCoverage", region)
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "North America",
                      "Europe",
                      "Asia Pacific",
                      "Africa",
                      "Middle East",
                      "Latin America",
                      "Global",
                    ].map((region) => (
                      <Button
                        key={region}
                        variant={
                          formData.geographicCoverage.includes(region)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          toggleArrayItem("geographicCoverage", region)
                        }
                        className="text-xs"
                      >
                        {region}
                      </Button>
                    ))}
                  </div>
                </div>
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
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="max-w-2xl">
            <div className="bg-gray-600 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-semibold">Technology & Tools</h2>
            </div>
            <CardContent className="p-8 space-y-6">
              <div>
                <Label className="text-sm font-medium">
                  ESG Software/Platforms Experience
                </Label>
                <div className="space-y-2 mt-2">
                  {formData.esgSoftwarePlatforms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.esgSoftwarePlatforms.map((platform) => (
                        <Badge
                          key={platform}
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {platform}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              removeArrayItem("esgSoftwarePlatforms", platform)
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      "Sustainalytics",
                      "Refinitiv",
                      "Bloomberg ESG",
                      "Diligent ESG",
                      "MSCI ESG",
                      "Persefoni",
                      "Watershed",
                      "SustainIQ",
                      "Other",
                    ].map((platform) => (
                      <Button
                        key={platform}
                        variant={
                          formData.esgSoftwarePlatforms.includes(platform)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          toggleArrayItem("esgSoftwarePlatforms", platform)
                        }
                        className="text-xs"
                      >
                        {platform}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Data Analysis Tools
                </Label>
                <div className="space-y-2 mt-2">
                  {formData.dataAnalysisTools.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.dataAnalysisTools.map((tool) => (
                        <Badge
                          key={tool}
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {tool}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              removeArrayItem("dataAnalysisTools", tool)
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      "Excel",
                      "Power BI",
                      "Tableau",
                      "Python",
                      "R",
                      "SQL",
                      "SPSS",
                      "SAS",
                      "Other",
                    ].map((tool) => (
                      <Button
                        key={tool}
                        variant={
                          formData.dataAnalysisTools.includes(tool)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          toggleArrayItem("dataAnalysisTools", tool)
                        }
                        className="text-xs"
                      >
                        {tool}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Carbon Footprint Tools
                </Label>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      "Carbon Trust Footprint",
                      "DEFRA Factors",
                      "GaBi",
                      "GHG Protocol Tools",
                      "Simapro",
                      "EPA Tools",
                      "Other",
                    ].map((tool) => (
                      <Button
                        key={tool}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {tool}
                      </Button>
                    ))}
                  </div>
                </div>
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
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="max-w-2xl">
            <div className="bg-gray-600 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-semibold">Service Offerings</h2>
            </div>
            <CardContent className="p-8 space-y-6">
              <div>
                <Label className="text-sm font-medium">
                  ESG Software/Platforms Experience
                </Label>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "ESG Strategy Development",
                      "Carbon Footprint Assessment",
                      "Supply Chain ESG",
                      "Due Diligence",
                      "Risk Assessment",
                      "ESG Reporting & Disclosure",
                      "Materiality Assessment",
                      "Impact Measurement",
                      "Regulatory Compliance",
                      "ESG Training",
                      "Stakeholder Engagement",
                      "Other",
                    ].map((service) => (
                      <Button
                        key={service}
                        variant={
                          formData.serviceOfferings.includes(service)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          toggleArrayItem("serviceOfferings", service)
                        }
                        className="text-xs h-auto py-2 px-3"
                      >
                        {service}
                      </Button>
                    ))}
                  </div>
                </div>
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
                  disabled={createConsultantMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {createConsultantMutation.isPending
                    ? "Setting up..."
                    : "Complete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const steps = [
    {
      id: 1,
      title: "Consultant Profile",
      description:
        "Capture core business details for personalized footprint analysis",
    },
    {
      id: 2,
      title: "Experience & Expertise",
      description: "Map operational workflows influencing ecological footprint",
    },
    {
      id: 3,
      title: "Technology & Tools",
      description:
        "Measure energy use and infrastructure for emission tracking",
    },
    {
      id: 4,
      title: "Service Offerings",
      description: "Log transport networks and mobility-related emissions",
    },
  ];

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
            {steps.map((step) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.id
                      ? "bg-pink-100 text-pink-600 border-2 border-pink-300"
                      : currentStep > step.id
                      ? "bg-pink-100 text-pink-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                <div>
                  <h3
                    className={`font-medium ${
                      currentStep === step.id
                        ? "text-[var(--ca-grey-darker)]"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
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
        <div className="flex-1 p-8">{renderStep()}</div>
      </div>
    </div>
  );
}
