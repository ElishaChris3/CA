import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Building, Users, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<
    "organization" | "consultant" | null
  >(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
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

  const createOnboardingSession = useMutation({
    mutationFn: async (role: "organization" | "consultant") => {
      // Generate unique temporary email for each onboarding session
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const tempEmail = `onboarding_${role}_${timestamp}_${randomId}@carbonaegis.com`;
      if (!userData) {
        throw new Error("No user data available");
      }
      return await apiRequest("/api/onboarding-session", "POST", {
        email: userData.email,
        password: userData.password,
        firstName: userData.name.split(" ")[0],
        lastName: userData.name.split(" ")[1] || "",
        role: role,
      });
    },
    onSuccess: (_, role) => {
      if (role === "organization") {
        setLocation(
          `/organization-onboarding?data=${encodeURIComponent(
            JSON.stringify(userData)
          )}`
        );
      } else {
        setLocation(
          `/consultant-onboarding?data=${encodeURIComponent(
            JSON.stringify(userData)
          )}`
        );
      }
    },
    onError: (error) => {
      toast({
        title: "Setup Error",
        description: error.message || "Failed to start onboarding process",
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (selectedRole) {
      createOnboardingSession.mutate(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-[var(--ca-green-normal)] rounded-xl flex items-center justify-center">
              <Leaf className="text-white h-6 w-6" />
            </div>
            <span className="ml-3 text-2xl font-medium text-[var(--ca-grey-darker)]">
              Carbon Aegis
            </span>
          </div>

          <h1 className="text-4xl font-bold text-[var(--ca-grey-darker)] mb-4">
            Welcome to{" "}
            <span className="text-[var(--ca-green-normal)]">Carbon Aegis</span>
          </h1>
          <p className="text-lg text-[var(--ca-grey-dark)]">
            Join our network of ESG consultants and help organizations achieve
            their sustainability goals
          </p>
        </div>

        {/* Selection Section */}
        <div className="border-2 border-dashed border-[var(--ca-green-normal)]/30 rounded-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-[var(--ca-grey-darker)] mb-2">
              Which best describes you?
            </h2>
            <p className="text-[var(--ca-grey-dark)]">
              Choose how you'll use our ESG reporting platform to manage
              sustainability data and compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Organization Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedRole === "organization"
                  ? "border-[var(--ca-green-normal)] bg-[var(--ca-green-normal)]/5"
                  : "border-gray-200 hover:border-[var(--ca-green-normal)]/50"
              }`}
              onClick={() => setSelectedRole("organization")}
            >
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  {/* Organization SVG Icon */}
                  <div className="w-24 h-24 mx-auto mb-4 bg-[var(--ca-green-normal)]/10 rounded-xl flex items-center justify-center">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="8"
                        y="12"
                        width="32"
                        height="28"
                        fill="#e5f3f0"
                        stroke="#22c55e"
                        strokeWidth="2"
                        rx="2"
                      />
                      <rect x="12" y="16" width="4" height="4" fill="#22c55e" />
                      <rect x="20" y="16" width="4" height="4" fill="#22c55e" />
                      <rect x="28" y="16" width="4" height="4" fill="#22c55e" />
                      <rect x="12" y="24" width="4" height="4" fill="#22c55e" />
                      <rect x="20" y="24" width="4" height="4" fill="#22c55e" />
                      <rect x="28" y="24" width="4" height="4" fill="#22c55e" />
                      <rect x="12" y="32" width="4" height="4" fill="#22c55e" />
                      <rect x="20" y="32" width="4" height="4" fill="#22c55e" />
                      <rect x="28" y="32" width="4" height="4" fill="#22c55e" />
                    </svg>
                  </div>

                  <h3 className="text-2xl font-bold text-[var(--ca-grey-darker)] mb-2">
                    Organisation
                  </h3>
                  <p className="text-[var(--ca-grey-dark)] mb-6">
                    I need to complete ESG reporting for my organization
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="text-[var(--ca-grey-dark)]">
                      Integrate and manage ESG data
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="text-[var(--ca-grey-dark)]">
                      Generate sustainability reports
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="text-[var(--ca-grey-dark)]">
                      Track ESG performance metrics
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="text-[var(--ca-grey-dark)]">
                      Complete compliance reporting
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ESG Consultant Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedRole === "consultant"
                  ? "border-[var(--ca-green-normal)] bg-[var(--ca-green-normal)]/5"
                  : "border-gray-200 hover:border-[var(--ca-green-normal)]/50"
              }`}
              onClick={() => setSelectedRole("consultant")}
            >
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  {/* Consultant SVG Icon */}
                  <div className="w-24 h-24 mx-auto mb-4 bg-[var(--ca-green-normal)]/10 rounded-xl flex items-center justify-center">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="20" cy="16" r="4" fill="#22c55e" />
                      <circle
                        cx="28"
                        cy="20"
                        r="3"
                        fill="#22c55e"
                        opacity="0.7"
                      />
                      <rect
                        x="12"
                        y="24"
                        width="16"
                        height="12"
                        fill="#e5f3f0"
                        stroke="#22c55e"
                        strokeWidth="2"
                        rx="2"
                      />
                      <rect
                        x="20"
                        y="28"
                        width="12"
                        height="8"
                        fill="#e5f3f0"
                        stroke="#22c55e"
                        strokeWidth="2"
                        rx="2"
                      />
                      <rect x="16" y="28" width="2" height="2" fill="#22c55e" />
                      <rect x="24" y="32" width="2" height="2" fill="#22c55e" />
                      <path d="M8 40 L40 40" stroke="#22c55e" strokeWidth="2" />
                    </svg>
                  </div>

                  <h3 className="text-2xl font-bold text-[var(--ca-grey-darker)] mb-2">
                    ESG Consultant
                  </h3>
                  <p className="text-[var(--ca-grey-dark)] mb-6">
                    I manage ESG reporting for multiple client organizations
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="text-[var(--ca-grey-dark)]">
                      Manage multiple client projects
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="text-[var(--ca-grey-dark)]">
                      Centralized client data oversight
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="text-[var(--ca-grey-dark)]">
                      Multi-organization dashboards
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="text-[var(--ca-grey-dark)]">
                      Client reporting workflows
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Confirm Button */}
          <div className="text-center">
            <Button
              onClick={handleConfirm}
              disabled={!selectedRole || createOnboardingSession.isPending}
              className="bg-gray-600 hover:bg-gray-700 text-white px-12 py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createOnboardingSession.isPending ? "Setting up..." : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
