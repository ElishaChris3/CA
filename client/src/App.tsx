import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import RoleSelection from "@/pages/role-selection";
import Onboarding from "@/pages/onboarding";
import OrganizationOnboarding from "@/pages/organization-onboarding";
import ConsultantOnboarding from "@/pages/consultant-onboarding";
import OrganizationDashboard from "@/pages/organization-dashboard";
import ConsultantDashboard from "@/pages/consultant-dashboard";
import CompanyProfile from "@/pages/company-profile";
import MaterialityAssessment from "@/pages/materiality-assessment";
import EmissionOverview from "@/pages/emission-overview";
import GovernancePolicies from "@/pages/governance-policies";
import DataCollection from "@/pages/data-collection";
import RiskManagement from "@/pages/risk-management";
import Reports from "@/pages/reports";
import Team from "@/pages/team";
import ClientOrganizations from "@/pages/client-organizations";
import type { User } from "@shared/schema";
import { useEffect } from "react";
import settings from "./pages/settings";
const StakeholderData = () => <div className="p-8">Stakeholder Data module coming soon...</div>;

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();
  const userData = user as User;

  // Centralized role-based redirect logic
  useEffect(() => {
    if (isAuthenticated && userData?.role && userData?.onboardingCompleted) {
      // If user is on root path and authenticated with completed onboarding, redirect to appropriate dashboard
      if (location === "/" || location === "/dashboard") {
        // Always redirect to /dashboard - the component will render the correct dashboard based on role
        if (location !== "/dashboard") {
          setLocation("/dashboard");
        }
      }
    }
  }, [isAuthenticated, userData, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ca-green-normal)]"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Auth} />
          <Route path="/role-selection" component={RoleSelection} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/organization-onboarding" component={OrganizationOnboarding} />
          <Route path="/consultant-onboarding" component={ConsultantOnboarding} />
        </>
      ) : (
        <>
          {!userData?.role ? (
            <Route path="/" component={RoleSelection} />
          ) : !userData?.onboardingCompleted ? (
            <Route path="/" component={Onboarding} />
          ) : (
            <>
              <Route path="/" component={userData.role === 'organization' ? OrganizationDashboard : ConsultantDashboard} />
              <Route path="/dashboard" component={userData.role === 'organization' ? OrganizationDashboard : ConsultantDashboard} />
              <Route path="/company-profile" component={CompanyProfile} />
              <Route path="/materiality-assessment" component={MaterialityAssessment} />
              <Route path="/emission-overview" component={EmissionOverview} />
              <Route path="/governance-policies" component={GovernancePolicies} />
              <Route path="/risk-management" component={RiskManagement} />
              <Route path="/stakeholders" component={StakeholderData} />
              <Route path="/data-collection" component={DataCollection} />
              <Route path="/performance-metrics" component={() => <div className="p-8">Performance Metrics module coming soon...</div>} />
              <Route path="/compliance" component={() => <div className="p-8">Compliance module coming soon...</div>} />
              <Route path="/reports" component={Reports} />
              <Route path="/settings" component={settings} />
              <Route path="/team" component={Team} />
              <Route path="/clients" component={ClientOrganizations} />
              <Route path="/client-organizations" component={ClientOrganizations} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;