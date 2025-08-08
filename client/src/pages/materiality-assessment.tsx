import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  BarChart3,
  Network,
  Download,
  Building,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { MaterialityTopic } from "@/shared/schema";
import TopicIdentification from "@/components/materiality/topic-identification";
import ImpactScoring from "@/components/materiality/impact-scoring";
import MaterialityMatrix from "@/components/materiality/materiality-matrix";
import MaterialTopicsReport from "@/components/materiality/material-topics-report";
import { useAuth } from "@/hooks/useAuth";

export default function MaterialityAssessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("identification");
  const [selectedClient, setSelectedClient] = useState<string | number>(
    user?.role === "consultant" ? "none" : user?.organizationId || 0
  );

  // Set selectedClient to org user's orgId when a non-consultant logs in
  useEffect(() => {
    console.log("user==========", user);
    if (user && user.role !== "consultant" && user.organizationId) {
      setSelectedClient(user.organizationId);
    }
  }, [user]);

  // Fetch client organizations for consultants
  const { data: clientOrganizations } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user && user.role === "consultant",
  });

  // Fetch materiality topics
  const {
    data: topics = [],
    isLoading,
    refetch,
  } = useQuery<MaterialityTopic[]>({
    queryKey: [`/api/materiality-topics?organizationId=${selectedClient}`],
  });

  // Refetch topics when selectedClient changes
  useEffect(() => {
    refetch();
  }, [selectedClient, refetch]);

  // Calculate progress based on completed steps
  const getProgressStats = () => {
    const topicsArray = Array.isArray(topics) ? topics : [];
    const totalTopics = topicsArray.length;
    const scoredTopics = topicsArray.filter(
      (t) => t.financialImpactScore !== null
    ).length;
    const materialTopics = topicsArray.filter((t) => t.isMaterial).length;
    const completedReports = topicsArray.filter(
      (t) => t.whyMaterial && t.managementResponse
    ).length;

    return {
      totalTopics,
      scoredTopics,
      materialTopics,
      completedReports,
      overallProgress:
        totalTopics > 0
          ? Math.round((completedReports / totalTopics) * 100)
          : 0,
    };
  };

  const stats = getProgressStats();

  const tabConfig = [
    {
      id: "identification",
      label: "Topic Identification",
      icon: <CheckCircle className="w-4 h-4" />,
      description: "Select and identify material ESG topics",
      completed: stats.totalTopics > 0,
    },
    {
      id: "scoring",
      label: "Impact Scoring",
      icon: <BarChart3 className="w-4 h-4" />,
      description: "Score topics for financial and impact materiality",
      completed:
        stats.scoredTopics === stats.totalTopics && stats.totalTopics > 0,
    },
    {
      id: "matrix",
      label: "Materiality Matrix",
      icon: <Network className="w-4 h-4" />,
      description: "Visual prioritization matrix",
      completed: stats.materialTopics > 0,
    },
    {
      id: "report",
      label: "Material Topics Report",
      icon: <FileText className="w-4 h-4" />,
      description: "Final report with justifications",
      completed:
        stats.completedReports === stats.materialTopics &&
        stats.materialTopics > 0,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Materiality Assessment
            </h1>
            <p className="text-muted-foreground mt-2">
              Identify, assess, and prioritize ESG factors that are most
              relevant to your business operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
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
                    value={selectedClient.toString()}
                    onValueChange={(val) => {
                      console.log("valueee", val);
                      setSelectedClient(Number(val));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a client organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Select Client Organization
                      </SelectItem>
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

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Assessment Progress
            </CardTitle>
            <CardDescription>
              Track your progress through the materiality assessment process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalTopics}
                </div>
                <div className="text-sm text-muted-foreground">
                  Topics Identified
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.scoredTopics}
                </div>
                <div className="text-sm text-muted-foreground">
                  Topics Scored
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.materialTopics}
                </div>
                <div className="text-sm text-muted-foreground">
                  Material Topics
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.completedReports}
                </div>
                <div className="text-sm text-muted-foreground">
                  Completed Reports
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{stats.overallProgress}%</span>
              </div>
              <Progress value={stats.overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Assessment Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            {tabConfig.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.completed && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 rounded-full p-0"
                  >
                    <CheckCircle className="w-3 h-3" />
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="identification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Topic Identification
                </CardTitle>
                <CardDescription>
                  Select ESG topics that are relevant to your business and
                  industry. Topics are organized by ESRS themes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopicIdentification
                  key={selectedClient}
                  topics={Array.isArray(topics) ? topics : []}
                  refetch={refetch}
                  selectedClientId={selectedClient}
                  user={user}
                  isDisabled={
                    user?.role === "consultant" && selectedClient === "none"
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Impact & Magnitude Scoring
                </CardTitle>
                <CardDescription>
                  Score each topic for financial impact, stakeholder impact, and
                  stakeholder concern level.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImpactScoring
                  topics={Array.isArray(topics) ? topics : []}
                  refetch={refetch}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Materiality Matrix
                </CardTitle>
                <CardDescription>
                  Visual representation of topics plotted by financial and
                  impact materiality scores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialityMatrix
                  topics={Array.isArray(topics) ? topics : []}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Material Topics Report
                </CardTitle>
                <CardDescription>
                  Final report with justifications and management responses for
                  material topics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialTopicsReport
                  topics={
                    Array.isArray(topics)
                      ? topics.filter((t) => t.isMaterial)
                      : []
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
