import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";
import MetricCard from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Building, TrendingUp, BarChart3, Lightbulb, Shield, TrendingDown, Eye, Settings, Leaf, Zap, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConsultantDashboard() {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string>("");

  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: !!user,
  });

  const { data: clientOrganizations, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user,
  });

  if (organizationsLoading || clientsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ca-green-normal)]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const clientCount = clientOrganizations?.length || 0;
  
  // Data for charts and metrics
  const surveysData = [
    { name: 'Completed', value: 60, color: '#22c55e' },
    { name: 'In Progress', value: 25, color: '#f59e0b' },
    { name: 'Pending', value: 15, color: '#ef4444' }
  ];

  const clientEngagementData = [
    { name: 'Very Active', value: 45, color: '#2563eb' },
    { name: 'Active', value: 35, color: '#3b82f6' },
    { name: 'Inactive', value: 20, color: '#93c5fd' }
  ];

  const emissionsData = [
    { name: 'Client A', scope1: 2500, scope2: 1800, scope3: 3200 },
    { name: 'Client B', scope1: 1900, scope2: 2200, scope3: 2800 },
    { name: 'Client C', scope1: 3100, scope2: 2600, scope3: 3500 },
    { name: 'Client D', scope1: 2200, scope2: 1900, scope3: 2400 },
    { name: 'Client E', scope1: 2800, scope2: 2100, scope3: 2900 }
  ];

  const aiRecommendations = [
    {
      title: "Shift to Renewable Energy",
      description: "Client A should prioritize renewable energy adoption",
      impact: "High",
      icon: <Leaf className="h-5 w-5" />
    },
    {
      title: "Optimize Supply Chain",
      description: "Client B has inefficient supply chain emissions",
      impact: "Medium",
      icon: <TrendingUp className="h-5 w-5" />
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ca-grey-darker)]">
              Home
            </h1>
            <p className="text-sm text-[var(--ca-grey-dark)] mt-1">
              Overview of your sustainability consulting portfolio
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-[var(--ca-grey-dark)]" />
              <span className="text-sm text-[var(--ca-grey-dark)]">Current Reporting: 2024</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[var(--ca-grey-normal)] rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-[var(--ca-grey-darker)]">
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                </div>
                <div className="text-xs text-[var(--ca-grey-dark)] capitalize">{user?.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Selection */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Building className="h-6 w-6 text-[var(--ca-green-normal)]" />
                <div>
                  <h3 className="font-medium text-[var(--ca-grey-darker)]">Select Client Organization</h3>
                  <p className="text-sm text-[var(--ca-grey-dark)]">View data for a specific client</p>
                </div>
              </div>
              <div className="w-80">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a client organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients (Portfolio View)</SelectItem>
                    {clientOrganizations?.map((client: any) => (
                      <SelectItem key={client.organizationId} value={client.organizationId.toString()}>
                        {client.organizationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Metrics Row - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="ca-metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">Total Clients Managed</div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">{clientCount}</div>
                </div>
                <Building className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="ca-metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">Active Projects</div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">8</div>
                  <div className="text-xs text-green-600">+2 this month</div>
                </div>
                <TrendingUp className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="ca-metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">Compliance Rate</div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">78%</div>
                  <div className="text-xs text-red-500">-5% from last month</div>
                </div>
                <Shield className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="ca-metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">Total Emissions</div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">12,500</div>
                  <div className="text-xs text-green-600">-8% reduction</div>
                </div>
                <Zap className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="ca-metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">Avg Response Time</div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">2.4h</div>
                  <div className="text-xs text-green-600">Improved response</div>
                </div>
                <BarChart3 className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="ca-metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">Client Satisfaction</div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">94%</div>
                  <div className="text-xs text-green-600">+3% this quarter</div>
                </div>
                <Users className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Surveys Chart */}
          <Card className="ca-metric-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[var(--ca-grey-darker)]">Surveys</CardTitle>
                <Eye className="h-4 w-4 text-[var(--ca-grey-normal)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">36</div>
                </div>
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={surveysData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {surveysData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-[var(--ca-grey-dark)]">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-[var(--ca-grey-dark)]">In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-[var(--ca-grey-dark)]">Pending</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Manage Surveys
              </Button>
            </CardContent>
          </Card>

          {/* Client Engagement Chart */}
          <Card className="ca-metric-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[var(--ca-grey-darker)]">Client Engagement</CardTitle>
                <Eye className="h-4 w-4 text-[var(--ca-grey-normal)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientEngagementData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {clientEngagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-right">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-sm text-[var(--ca-grey-dark)]">Very Active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-sm text-[var(--ca-grey-dark)]">Inactive Clients</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Improve Engagement
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Total Emissions Reduced */}
        <Card className="ca-metric-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--ca-grey-darker)]">Total Emissions Reduced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-3xl font-bold text-[var(--ca-grey-darker)]">2245</div>
              <div className="text-sm text-[var(--ca-grey-dark)]">Metric Tons</div>
              <div className="text-sm text-[var(--ca-grey-dark)]">CO2 equivalent reduced across all clients</div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-[var(--ca-grey-darker)] mb-2">Top Areas Requiring Improvement</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--ca-grey-dark)]">Supply chain data consistency</span>
                        <span className="text-xs text-red-500">High Impact</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--ca-grey-dark)]">Top Areas Requiring Improvement</span>
                        <span className="text-xs text-yellow-500">Medium Impact</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emission Hotspots */}
              <div>
                <div className="text-sm font-medium text-[var(--ca-grey-darker)] mb-2">Emission Hotspots</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-xs text-red-600 font-medium">Business Travel</div>
                    <div className="text-xs text-red-500">High Impact</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="text-xs text-orange-600 font-medium">Energy Consumption</div>
                    <div className="text-xs text-orange-500">High Impact</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  Review Emissions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GHG Emissions Summary */}
        <Card className="ca-metric-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--ca-grey-darker)]">GHG Emissions Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="scope1" stackId="a" fill="#8884d8" />
                  <Bar dataKey="scope2" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="scope3" stackId="a" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#8884d8] rounded"></div>
                <span className="text-sm text-[var(--ca-grey-dark)]">Scope 1</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#82ca9d] rounded"></div>
                <span className="text-sm text-[var(--ca-grey-dark)]">Scope 2</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#ffc658] rounded"></div>
                <span className="text-sm text-[var(--ca-grey-dark)]">Scope 3</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="ca-metric-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--ca-grey-darker)]">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiRecommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-[var(--ca-grey-light-active)] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[var(--ca-green-normal)]/10 rounded-lg flex items-center justify-center">
                      {rec.icon}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--ca-grey-darker)]">{rec.title}</div>
                      <div className="text-sm text-[var(--ca-grey-dark)]">{rec.description}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
