import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Building, Users, ArrowRight } from "lucide-react";
import logoImg from "@/assets/carbon-aegis-logo.png";

const businessProfileSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry sector is required"),
  businessType: z.string().min(1, "Business type is required"),
  country: z.string().optional(),
  employeeCount: z.number().optional(),
  annualRevenue: z.number().optional(),
});

type BusinessProfileForm = z.infer<typeof businessProfileSchema>;

export default function Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<BusinessProfileForm>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: "",
      industry: "",
      businessType: "",
      country: "",
      employeeCount: undefined,
      annualRevenue: undefined,
    },
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: BusinessProfileForm) => {
      return apiRequest("/api/organizations", "POST", data);
    },
    onSuccess: () => {
      completeOnboardingMutation.mutate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/user/onboarding", "PATCH", {});
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "Your profile has been set up successfully.",
      });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessProfileForm) => {
    if (user?.role === 'organization') {
      createOrganizationMutation.mutate(data);
    } else {
      // For consultants, just complete onboarding
      completeOnboardingMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-[var(--ca-green-normal)] text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {user?.role === 'organization' ? 'Set up your organization' : 'Complete your consultant profile'}
                </CardTitle>
                <p className="text-[var(--ca-green-hover)] mt-2">
                  {user?.role === 'organization' 
                    ? 'Tell us about your organization to get started with ESG reporting'
                    : 'Complete your profile to start managing client ESG data'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <img 
                    src="/carbon-aegis-logo.png" 
                    alt="Carbon Aegis Logo" 
                    className="w-12 h-12 rounded-xl"
                  />
                <span className="text-xl font-medium">Carbon Aegis</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-10 h-10 bg-[var(--ca-green-normal)] rounded-full flex items-center justify-center">
                  <Building className="text-white h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--ca-grey-darker)]">
                  {user?.role === 'organization' ? 'Business Profile' : 'Consultant Profile'}
                </h2>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {user?.role === 'organization' && (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your company name" 
                                {...field}
                                className="border-[var(--ca-grey-light-active)] focus:border-[var(--ca-green-normal)]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry Sector *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-[var(--ca-grey-light-active)] focus:border-[var(--ca-green-normal)]">
                                  <SelectValue placeholder="Select industry sector" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="financial-services">Financial Services</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="energy">Energy</SelectItem>
                                <SelectItem value="construction">Construction</SelectItem>
                                <SelectItem value="transportation">Transportation</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-[var(--ca-grey-light-active)] focus:border-[var(--ca-green-normal)]">
                                  <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sme">Small/Medium Enterprise (SME)</SelectItem>
                                <SelectItem value="large-enterprise">Large Enterprise</SelectItem>
                                <SelectItem value="public-company">Public Company</SelectItem>
                                <SelectItem value="non-profit">Non-profit</SelectItem>
                                <SelectItem value="government">Government</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter country" 
                                  {...field}
                                  className="border-[var(--ca-grey-light-active)] focus:border-[var(--ca-green-normal)]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="employeeCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="Number of employees" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  className="border-[var(--ca-grey-light-active)] focus:border-[var(--ca-green-normal)]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {user?.role === 'consultant' && (
                    <div className="text-center py-8">
                      <div className="w-24 h-24 bg-[var(--ca-green-normal)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="h-12 w-12 text-[var(--ca-green-normal)]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--ca-grey-darker)] mb-2">
                        Ready to Get Started
                      </h3>
                      <p className="text-[var(--ca-grey-dark)]">
                        Your consultant profile is ready. You can now start managing client organizations and their ESG data.
                      </p>
                    </div>
                  )}

                  <div className="text-right">
                    <Button 
                      type="submit"
                      disabled={createOrganizationMutation.isPending || completeOnboardingMutation.isPending}
                      className="bg-[var(--ca-green-normal)] hover:bg-[var(--ca-green-hover)] text-white px-8 py-3 rounded-lg font-medium"
                    >
                      {createOrganizationMutation.isPending || completeOnboardingMutation.isPending ? (
                        "Setting up..."
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}