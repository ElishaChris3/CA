import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Save,
  Edit,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MaterialityTopic } from "@/shared/schema";

interface MaterialTopicsReportProps {
  topics: MaterialityTopic[];
}

const STAKEHOLDER_OPTIONS = [
  "Employees",
  "Customers",
  "Suppliers",
  "Investors",
  "Regulators",
  "Communities",
  "NGOs",
  "Media",
  "Government",
  "Industry Partners",
];

const ESRS_STANDARDS = [
  "ESRS E1 - Climate Change",
  "ESRS E2 - Pollution",
  "ESRS E3 - Water and Marine Resources",
  "ESRS E4 - Biodiversity and Ecosystems",
  "ESRS E5 - Circular Economy",
  "ESRS S1 - Own Workforce",
  "ESRS S2 - Workers in Value Chain",
  "ESRS S3 - Affected Communities",
  "ESRS S4 - Consumers and End-users",
  "ESRS G1 - Business Conduct",
  "GRI 102 - General Disclosures",
  "GRI 201 - Economic Performance",
  "GRI 205 - Anti-corruption",
  "GRI 302 - Energy",
  "GRI 305 - Emissions",
  "SASB - Industry Standards",
];

export default function MaterialTopicsReport({
  topics,
  selectedClientId,
}: MaterialTopicsReportProps) {
  const [editingTopic, setEditingTopic] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    whyMaterial: string;
    impactedStakeholders: string[];
    businessRiskOrOpportunity: string;
    linkedStandards: string[];
    managementResponse: string;
  }>({
    whyMaterial: "",
    impactedStakeholders: [],
    businessRiskOrOpportunity: "",
    linkedStandards: [],
    managementResponse: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTopicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(
        `/api/materiality-topics/${id}`,
        "PATCH",
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/materiality-topics?organizationId=${selectedClientId}`,
        ],
      });
      toast({
        title: "Success",
        description: "Topic report updated successfully",
      });
      setEditingTopic(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update topic report",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (topic: MaterialityTopic) => {
    setEditingTopic(topic.id);
    setFormData({
      whyMaterial: topic.whyMaterial || "",
      impactedStakeholders: topic.impactedStakeholders || [],
      businessRiskOrOpportunity: topic.businessRiskOrOpportunity || "",
      linkedStandards: topic.linkedStandards || [],
      managementResponse: topic.managementResponse || "",
    });
  };

  const handleSave = () => {
    if (editingTopic === null) return;

    // Map form data to database column names
    const updateData = {
      whyMaterial: formData.whyMaterial,
      impactedStakeholders: formData.impactedStakeholders,
      businessRiskOrOpportunity: formData.businessRiskOrOpportunity,
      linkedStandards: formData.linkedStandards,
      managementResponse: formData.managementResponse,
    };

    updateTopicMutation.mutate({ id: editingTopic, data: updateData });
  };

  const handleCancel = () => {
    setEditingTopic(null);
    setFormData({
      whyMaterial: "",
      impactedStakeholders: [],
      businessRiskOrOpportunity: "",
      linkedStandards: [],
      managementResponse: "",
    });
  };

  const handleStakeholderToggle = (stakeholder: string) => {
    const newStakeholders = formData.impactedStakeholders.includes(stakeholder)
      ? formData.impactedStakeholders.filter((s) => s !== stakeholder)
      : [...formData.impactedStakeholders, stakeholder];
    setFormData({ ...formData, impactedStakeholders: newStakeholders });
  };

  const handleStandardToggle = (standard: string) => {
    const newStandards = formData.linkedStandards.includes(standard)
      ? formData.linkedStandards.filter((s) => s !== standard)
      : [...formData.linkedStandards, standard];
    setFormData({ ...formData, linkedStandards: newStandards });
  };

  const completedReports = topics.filter(
    (t) => t.whyMaterial && t.managementResponse
  );
  const completionPercentage =
    topics.length > 0 ? (completedReports.length / topics.length) * 100 : 0;

  if (topics.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Material Topics</h3>
        <p className="text-muted-foreground">
          Complete the scoring step to identify material topics before creating
          reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Material Topics Report</h2>
          <p className="text-muted-foreground">
            Complete the narrative details for each material topic
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Report Completion Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {topics.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Material Topics
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {completedReports.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Completed Reports
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(completionPercentage)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Overall Progress
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Topics Summary</CardTitle>
          <CardDescription>
            Overview of all material topics with their materiality scores and
            completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Materiality Index</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((topic) => (
                  <TableRow key={topic.id}>
                    <TableCell>
                      <div className="font-medium">{topic.topic}</div>
                      {topic.subcategory && (
                        <Badge variant="outline" className="mt-1">
                          {topic.subcategory}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          topic.category === "environmental"
                            ? "bg-green-100 text-green-800"
                            : topic.category === "social"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }
                      >
                        {topic.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {topic.materialityIndex}
                      </div>
                    </TableCell>
                    <TableCell>
                      {topic.whyMaterial && topic.managementResponse ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Complete</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Incomplete</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(topic)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Forms */}
      <div className="space-y-6">
        {topics.map((topic) => (
          <Card key={topic.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{topic.topic}</span>
                  <Badge variant="outline">{topic.subcategory}</Badge>
                  <Badge
                    className={
                      parseFloat(topic.materialityIndex!) >= 4.0
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                    }
                  >
                    {parseFloat(topic.materialityIndex!) >= 4.0
                      ? "Highly Material"
                      : "Material"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {topic.whyMaterial && topic.managementResponse && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {editingTopic === topic.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(topic)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingTopic === topic.id ? (
                <div className="space-y-6">
                  {/* Why Material */}
                  <div className="space-y-2">
                    <Label htmlFor={`why-material-${topic.id}`}>
                      Why is this Material? *
                      <span className="text-sm text-muted-foreground ml-1">
                        (Summarize why the topic is material for your business,
                        citing data or stakeholder expectations)
                      </span>
                    </Label>
                    <Textarea
                      id={`why-material-${topic.id}`}
                      placeholder="e.g., Water-intensive operations in drought-prone areas create reputational and operational risk."
                      value={formData.whyMaterial}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whyMaterial: e.target.value,
                        })
                      }
                      rows={3}
                      required
                    />
                  </div>

                  {/* Impacted Stakeholders */}
                  <div className="space-y-2">
                    <Label>
                      Impacted Stakeholders *
                      <span className="text-sm text-muted-foreground ml-1">
                        (Which stakeholders are most affected by this topic?)
                      </span>
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {STAKEHOLDER_OPTIONS.map((stakeholder) => (
                        <div
                          key={stakeholder}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`stakeholder-${topic.id}-${stakeholder}`}
                            checked={formData.impactedStakeholders.includes(
                              stakeholder
                            )}
                            onChange={() =>
                              handleStakeholderToggle(stakeholder)
                            }
                            className="rounded border-gray-300"
                          />
                          <Label
                            htmlFor={`stakeholder-${topic.id}-${stakeholder}`}
                            className="text-sm cursor-pointer"
                          >
                            {stakeholder}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business Risk or Opportunity */}
                  <div className="space-y-2">
                    <Label htmlFor={`risk-opportunity-${topic.id}`}>
                      Business Risk or Opportunity *
                      <span className="text-sm text-muted-foreground ml-1">
                        (Does this topic present a risk, opportunity, or both?)
                      </span>
                    </Label>
                    <Select
                      value={formData.businessRiskOrOpportunity}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          businessRiskOrOpportunity: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk/opportunity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="risk">Risk</SelectItem>
                        <SelectItem value="opportunity">Opportunity</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Linked Standards */}
                  <div className="space-y-2">
                    <Label>
                      Linked ESRS/GRI/SASB Standards
                      <span className="text-sm text-muted-foreground ml-1">
                        (Select any standards that address this material topic)
                      </span>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {ESRS_STANDARDS.map((standard) => (
                        <div
                          key={standard}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`standard-${topic.id}-${standard}`}
                            checked={formData.linkedStandards.includes(
                              standard
                            )}
                            onChange={() => handleStandardToggle(standard)}
                            className="rounded border-gray-300"
                          />
                          <Label
                            htmlFor={`standard-${topic.id}-${standard}`}
                            className="text-sm cursor-pointer"
                          >
                            {standard}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Management Response */}
                  <div className="space-y-2">
                    <Label htmlFor={`management-response-${topic.id}`}>
                      Management Response *
                      <span className="text-sm text-muted-foreground ml-1">
                        (Summarize how the company is responding to or managing
                        this material issue)
                      </span>
                    </Label>
                    <Textarea
                      id={`management-response-${topic.id}`}
                      placeholder="e.g., Water recycling systems have been installed at major plants."
                      value={formData.managementResponse}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          managementResponse: e.target.value,
                        })
                      }
                      rows={3}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Why Material</h4>
                      <p className="text-sm text-muted-foreground">
                        {topic.whyMaterial || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Management Response
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {topic.managementResponse || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Impacted Stakeholders
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {topic.impactedStakeholders?.map((stakeholder) => (
                          <Badge
                            key={stakeholder}
                            variant="secondary"
                            className="text-xs"
                          >
                            {stakeholder}
                          </Badge>
                        )) || (
                          <span className="text-sm text-muted-foreground">
                            Not provided
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Risk/Opportunity</h4>
                      <p className="text-sm text-muted-foreground">
                        {topic.businessRiskOrOpportunity || "Not provided"}
                      </p>
                    </div>
                  </div>
                  {topic.linkedStandards &&
                    topic.linkedStandards.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Linked Standards</h4>
                        <div className="flex flex-wrap gap-1">
                          {topic.linkedStandards.map((standard) => (
                            <Badge
                              key={standard}
                              variant="outline"
                              className="text-xs"
                            >
                              {standard}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
