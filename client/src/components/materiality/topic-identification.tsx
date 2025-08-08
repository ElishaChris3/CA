import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MaterialityTopic } from "@/shared/schema";

interface TopicIdentificationProps {
  topics: MaterialityTopic[];
  refetch: () => void;
  selectedClientId: number;
  user: any; // or your User type
  isDisabled: boolean;
}

const ESRS_TOPICS = {
  environmental: {
    label: "Environment (E1-E5)",
    color: "bg-green-100 text-green-800",
    topics: [
      { id: "ghg-emissions", label: "GHG Emissions", subcategory: "E1" },
      {
        id: "energy-consumption",
        label: "Energy Consumption",
        subcategory: "E1",
      },
      {
        id: "water-marine",
        label: "Water & Marine Resources",
        subcategory: "E3",
      },
      {
        id: "biodiversity",
        label: "Biodiversity & Ecosystems",
        subcategory: "E4",
      },
      {
        id: "circular-economy",
        label: "Circular Economy & Waste",
        subcategory: "E5",
      },
      { id: "pollution", label: "Pollution Prevention", subcategory: "E2" },
    ],
  },
  social: {
    label: "Social (S1-S4)",
    color: "bg-blue-100 text-blue-800",
    topics: [
      {
        id: "working-conditions",
        label: "Working Conditions",
        subcategory: "S1",
      },
      {
        id: "equal-opportunity",
        label: "Equal Opportunity (Diversity, Inclusion)",
        subcategory: "S1",
      },
      { id: "health-safety", label: "Health & Safety", subcategory: "S1" },
      { id: "human-rights", label: "Human Rights", subcategory: "S1" },
      {
        id: "affected-communities",
        label: "Affected Communities",
        subcategory: "S3",
      },
      { id: "end-users", label: "End-users/Consumers", subcategory: "S4" },
    ],
  },
  governance: {
    label: "Governance (G1)",
    color: "bg-purple-100 text-purple-800",
    topics: [
      { id: "anti-corruption", label: "Anti-Corruption", subcategory: "G1" },
      {
        id: "board-diversity",
        label: "Board Diversity & Structure",
        subcategory: "G1",
      },
      {
        id: "esg-risk-management",
        label: "ESG Risk Management",
        subcategory: "G1",
      },
      {
        id: "executive-remuneration",
        label: "Executive Remuneration",
        subcategory: "G1",
      },
      {
        id: "whistleblower",
        label: "Whistleblower Mechanisms",
        subcategory: "G1",
      },
    ],
  },
};

export default function TopicIdentification({
  topics,
  refetch,
  selectedClientId,
  user,
  isDisabled,
}: TopicIdentificationProps) {
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
    new Set(topics.map((t) => t.topic))
  );
  const [customTopic, setCustomTopic] = useState("");

  // Sync selectedTopics and clear customTopic when topics prop changes
  useEffect(() => {
    setSelectedTopics(new Set(topics.map((t) => t.topic)));
    setCustomTopic("");
  }, [topics]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("selectedClientId TID type outside:", typeof selectedClientId);
  console.log("selectedClientId TID outside:", selectedClientId);
  console.log("TID data outside :", topics);

  const createTopicMutation = useMutation({
    mutationFn: async (topicData: {
      topic: string;
      category: string;
      subcategory?: string;
      isCustom?: boolean;
    }) => {
      console.log("Creating topic with data inside:", topicData);
      console.log("Selected Client ID:", selectedClientId);

      return await apiRequest("/api/materiality-topics", "POST", {
        ...topicData,
        organizationId: selectedClientId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/materiality-topics?organizationId=${selectedClientId}`,
        ],
      });
      refetch();
      toast({
        title: "Success",
        description: "Topic created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create topic",
        variant: "destructive",
      });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (topicId: number) => {
      return await apiRequest(`/api/materiality-topics/${topicId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/materiality-topics?organizationId=${selectedClientId}`,
        ],
      });
      refetch();
      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete topic",
        variant: "destructive",
      });
    },
  });

  const handleTopicToggle = (
    topicId: string,
    category: string,
    subcategory?: string
  ) => {
    const newSelectedTopics = new Set(selectedTopics);
    console.log("topic id", topicId);
    if (newSelectedTopics.has(topicId)) {
      newSelectedTopics.delete(topicId);
      // Find and delete the topic from the database
      const existingTopic = topics.find((t) => t.topic === topicId);
      if (existingTopic) {
        deleteTopicMutation.mutate(existingTopic.id);
      }
    } else {
      newSelectedTopics.add(topicId);
      // Create the topic in the database
      createTopicMutation.mutate({
        topic: topicId,
        category,
        subcategory,
        isCustom: false,
      });
    }

    setSelectedTopics(newSelectedTopics);
  };

  const handleAddCustomTopic = () => {
    if (!customTopic.trim()) return;

    const topicId = customTopic.toLowerCase().replace(/\s+/g, "-");
    createTopicMutation.mutate({
      topic: customTopic,
      category: "governance", // Default to governance for custom topics
      isCustom: true,
    });

    setCustomTopic("");
  };

  const handleRemoveCustomTopic = (topicId: number) => {
    deleteTopicMutation.mutate(topicId);
  };

  const customTopics = topics.filter((t) => t.isCustom);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Select the ESG topics that are relevant to your business and industry.
          Topics are organized by ESRS themes. You can also add custom topics
          that are specific to your organization.
        </p>
      </div>

      {/* ESRS Topics */}
      <div className="space-y-6">
        {Object.entries(ESRS_TOPICS).map(([category, categoryData]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={categoryData.color}>
                  {categoryData.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryData.topics.map((topic) => (
                  <div key={topic.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={topic.id}
                      checked={selectedTopics.has(topic.id)}
                      onCheckedChange={() =>
                        handleTopicToggle(topic.id, category, topic.subcategory)
                      }
                      disabled={isNaN(Number(selectedClientId))}
                    />
                    <Label htmlFor={topic.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>{topic.label}</span>
                        <Badge variant="outline" className="ml-2">
                          {topic.subcategory}
                        </Badge>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Custom Topics
          </CardTitle>
          <CardDescription>
            Add topics that are specific to your organization or industry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom topic (e.g., AI ethics, supply chain disruption)"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddCustomTopic()}
              disabled={isDisabled}
            />
            <Button
              onClick={handleAddCustomTopic}
              disabled={!customTopic.trim() || isDisabled}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {customTopics.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Added Custom Topics:</h4>
              <div className="space-y-2">
                {customTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span>{topic.topic}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomTopic(topic.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Topics
          </CardTitle>
          <CardDescription>
            Import topics from Excel or other formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import from Excel
            </Button>
            <Button variant="outline" disabled>
              <Upload className="w-4 h-4 mr-2" />
              Import from CSV
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Import functionality coming soon
          </p>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Selection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedTopics.size}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Topics Selected
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {customTopics.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Custom Topics Added
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {selectedTopics.size - customTopics.length}
              </div>
              <div className="text-sm text-muted-foreground">
                ESRS Topics Selected
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
