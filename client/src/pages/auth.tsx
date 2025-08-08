import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Leaf } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import dashboardPreview from "/public/dashboard-preview.svg";

// Assuming you have the logo image file in the public directory
import logoImg from "/carbon-aegis-logo.png";

export default function Auth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleGoogleAuth = () => {
    toast({
      title: "Google Sign-In",
      description: "Google authentication will be implemented soon",
    });
  };

  const handleCredentialsAuth = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/login", "POST", {
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: isLogin ? "Login Successful" : "Registration Successful",
        description: isLogin
          ? "Welcome back!"
          : "Account created successfully!",
      });

      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast({
        title: isLogin ? "Login Failed" : "Registration Failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      handleCredentialsAuth.mutate(formData);
    } else {
      // For sign-up, navigate to role selection
      setLocation(
        `/role-selection?data=${encodeURIComponent(JSON.stringify(formData))}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--ca-grey-light)] to-white">
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Dashboard Preview */}
          <div className="relative">
            <div className="bg-gradient-to-br from-[var(--ca-green-normal)]/10 to-[var(--ca-green-hover)]/20 rounded-2xl p-6 shadow-2xl">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <img
                  src={dashboardPreview}
                  alt="Carbon Aegis Dashboard Preview"
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--ca-green-normal)] rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-[var(--ca-green-hover)] rounded-full opacity-60"></div>
            </div>

            {/* Preview Labels */}
            <div className="mt-6 text-center"></div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-8">
                <div className="w-10 h-10 bg-[var(--ca-green-normal)] rounded-lg flex items-center justify-center">
                  <Leaf className="text-white h-5 w-5" />
                </div>
                <span className="ml-3 text-2xl font-medium text-[var(--ca-grey-darker)]">
                  Carbon Aegis
                </span>
              </div>
              <h1 className="text-3xl font-bold text-[var(--ca-grey-darker)] mb-2">
                Drive Sustainable Growth with{" "}
                <span className="text-[var(--ca-green-normal)]">
                  Carbon Aegis
                </span>
              </h1>
              <p className="text-[var(--ca-grey-dark)]">
                Sign up or get started on your ESG journey
              </p>
            </div>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <Button
                  onClick={handleGoogleAuth}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 mb-4"
                >
                  <FaGoogle className="mr-2 h-4 w-4 text-[#4285F4]" />
                  Sign in with Google
                </Button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-[var(--ca-grey-dark)]">
                      OR
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <Label
                        htmlFor="name"
                        className="text-[var(--ca-grey-darker)]"
                      >
                        Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required={!isLogin}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-[var(--ca-grey-darker)]"
                    >
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="password"
                      className="text-[var(--ca-grey-darker)]"
                    >
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
                    disabled={handleCredentialsAuth.isPending}
                  >
                    {handleCredentialsAuth.isPending
                      ? "Please wait..."
                      : isLogin
                      ? "Sign In"
                      : "Create Account"}
                  </Button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-sm text-[var(--ca-grey-dark)]">
                    {isLogin
                      ? "Don't have an account?"
                      : "Already have an account?"}{" "}
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-[#2563eb] hover:underline font-medium"
                    >
                      {isLogin ? "Sign Up" : "Login Here"}
                    </button>
                  </p>
                </div>

                {/* Demo Credentials Info */}
                <div className="mt-6 p-4 bg-[var(--ca-grey-light)] rounded-lg">
                  <p className="text-sm font-medium text-[var(--ca-grey-darker)] mb-2">
                    Demo Credentials:
                  </p>
                  <div className="text-xs text-[var(--ca-grey-dark)] space-y-1">
                    <div>Organization: demo.org@carbonaegis.com / demo123</div>
                    <div>
                      Consultant: demo.consultant@carbonaegis.com / demo123
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
