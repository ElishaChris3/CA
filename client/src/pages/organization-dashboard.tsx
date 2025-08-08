import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Users, TrendingDown, TrendingUp, Calendar, ChevronDown, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function OrganizationDashboard() {
  const { user } = useAuth();

  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: !!user,
  });

  const currentOrganization = organizations && organizations.length > 0 ? organizations[0] : null;

  if (organizationsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ca-green-normal)]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-[var(--ca-grey-darker)] mb-4">
            No Organization Found
          </h2>
          <p className="text-[var(--ca-grey-dark)]">
            Please create an organization to get started with ESG reporting.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Sample data for the dashboard (replace with real data from API)
  const ghgEmissionsData = [
    { month: 'Jan', scope1: 80, scope2: 95, scope3: 70 },
    { month: 'Feb', scope1: 85, scope2: 80, scope3: 75 },
    { month: 'Mar', scope1: 90, scope2: 85, scope3: 80 },
    { month: 'Apr', scope1: 75, scope2: 90, scope3: 85 },
    { month: 'May', scope1: 80, scope2: 95, scope3: 90 },
    { month: 'Jun', scope1: 85, scope2: 85, scope3: 95 },
    { month: 'Jul', scope1: 90, scope2: 90, scope3: 85 },
    { month: 'Aug', scope1: 85, scope2: 85, scope3: 90 },
    { month: 'Sep', scope1: 80, scope2: 95, scope3: 95 },
    { month: 'Oct', scope1: 90, scope2: 90, scope3: 85 },
    { month: 'Nov', scope1: 85, scope2: 85, scope3: 90 },
    { month: 'Dec', scope1: 80, scope2: 80, scope3: 85 }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ca-grey-darker)]">Home</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Current Reporting Year</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ESG Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Environment Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--ca-grey-darker)]">Environment</h2>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Carbon Footprint (Scope 1, 2, 3)</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-bold">12</span>
                <span className="text-sm text-gray-500">metric tons</span>
                <span className="text-sm text-green-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -5%
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Renewable Energy Adoption (%)</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-bold">12</span>
                <span className="text-sm text-gray-500">%</span>
                <span className="text-sm text-green-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -5%
                </span>
              </div>
            </Card>
          </div>

          {/* Social Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--ca-grey-darker)]">Social</h2>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Employee Diversity Index</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-bold">70</span>
                <span className="text-sm text-gray-500">%</span>
                <span className="text-sm text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -20%
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Supplier Compliance Rate</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-bold">12</span>
                <span className="text-sm text-gray-500">%</span>
                <span className="text-sm text-green-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -5%
                </span>
              </div>
            </Card>
          </div>

          {/* Governance Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--ca-grey-darker)]">Governance</h2>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Board Diversity Score</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-bold">7/10</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Ethics Violation Rate</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-bold">20</span>
                <span className="text-sm text-gray-500">%</span>
                <span className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +1%
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* GHG Emissions Chart */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">GHG Emissions</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-16 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">40%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Jan 24 - Feb 24 2025</span>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Compare it to
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ghgEmissionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scope1" stackId="a" fill="#22c55e" name="Scope 1" />
                  <Bar dataKey="scope2" stackId="a" fill="#06b6d4" name="Scope 2" />
                  <Bar dataKey="scope3" stackId="a" fill="#8b5cf6" name="Scope 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Comparison Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">TOTAL GHG EMISSIONS (TCO2E)</span>
                </div>
                <div className="mt-1">
                  <span className="text-lg font-bold">1800</span>
                  <span className="text-sm text-green-600 ml-2">+5% Compare to 1 Year +7%</span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">REDUCED (TCO2E)</span>
                </div>
                <div className="mt-1">
                  <span className="text-lg font-bold">50</span>
                  <span className="text-sm text-red-600 ml-2">-3% Compare to 1 Year +7%</span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">OFFSET (TCO2E)</span>
                </div>
                <div className="mt-1">
                  <span className="text-lg font-bold">180</span>
                  <span className="text-sm text-red-600 ml-2">+4% Compare to 1 Year -37%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social - Employee Diversity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg">Social - Employee Diversity</CardTitle>
              </div>
              <span className="text-sm text-gray-500">Jan 24 - Feb 24 2025</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Employee Diversity Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}