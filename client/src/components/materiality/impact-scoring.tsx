import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Save, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MaterialityTopic } from '@/shared/schema';

interface ImpactScoringProps {
  topics: MaterialityTopic[];
  refetch: () => void;
}

const LIKERT_SCALE = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Very High' },
  { value: 5, label: 'Critical' },
];

const STAKEHOLDER_CONCERN_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function ImpactScoring({ topics, refetch }: ImpactScoringProps) {
  const [editingTopic, setEditingTopic] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    financialImpactScore: number;
    impactOnStakeholders: number;
    stakeholderConcernLevel: string;
    scoringJustification: string;
  }>({
    financialImpactScore: 0,
    impactOnStakeholders: 0,
    stakeholderConcernLevel: '',
    scoringJustification: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTopicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/materiality-topics/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materiality-topics'] });
      refetch();
      toast({
        title: "Success",
        description: "Topic scoring updated successfully",
      });
      setEditingTopic(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update topic scoring",
        variant: "destructive",
      });
    }
  });

  const calculateMaterialityIndex = (financial: number, impact: number, stakeholder: string) => {
    const stakeholderScore = stakeholder === 'high' ? 5 : stakeholder === 'medium' ? 3 : 1;
    return (financial * 0.4 + impact * 0.4 + stakeholderScore * 0.2).toFixed(2);
  };

  const getMaterialityLevel = (index: number) => {
    if (index < 2.0) return { level: 'Not material', color: 'bg-gray-100 text-gray-800' };
    if (index < 3.0) return { level: 'Low materiality', color: 'bg-yellow-100 text-yellow-800' };
    if (index < 4.0) return { level: 'Material', color: 'bg-orange-100 text-orange-800' };
    return { level: 'Highly material', color: 'bg-red-100 text-red-800' };
  };

  const handleEdit = (topic: MaterialityTopic) => {
    setEditingTopic(topic.id);
    setFormData({
      financialImpactScore: topic.financialImpactScore || 0,
      impactOnStakeholders: topic.impactOnStakeholders || 0,
      stakeholderConcernLevel: topic.stakeholderConcernLevel || '',
      scoringJustification: topic.scoringJustification || '',
    });
  };

  const handleSave = () => {
    if (editingTopic === null) return;

    const materialityIndex = parseFloat(
      calculateMaterialityIndex(
        formData.financialImpactScore,
        formData.impactOnStakeholders,
        formData.stakeholderConcernLevel
      )
    );

    const updateData = {
      ...formData,
      materialityIndex,
      isMaterial: materialityIndex >= 3.0,
    };

    updateTopicMutation.mutate({ id: editingTopic, data: updateData });
  };

  const handleCancel = () => {
    setEditingTopic(null);
    setFormData({
      financialImpactScore: 0,
      impactOnStakeholders: 0,
      stakeholderConcernLevel: '',
      scoringJustification: '',
    });
  };

  const scoredTopics = topics.filter(t => t.financialImpactScore !== null);
  const completionPercentage = topics.length > 0 ? (scoredTopics.length / topics.length) * 100 : 0;

  if (topics.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Topics Selected</h3>
        <p className="text-muted-foreground">
          Please go to the Topic Identification tab to select topics before scoring.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Scoring Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completed: {scoredTopics.length} of {topics.length} topics</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Scoring Logic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Logic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">40%</div>
              <div className="text-sm text-muted-foreground">Financial Impact</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">40%</div>
              <div className="text-sm text-muted-foreground">Impact on Stakeholders</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">20%</div>
              <div className="text-sm text-muted-foreground">Stakeholder Concern</div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <Badge className="bg-gray-100 text-gray-800">0.0 - 1.9</Badge>
              <div className="text-xs mt-1">Not material</div>
            </div>
            <div>
              <Badge className="bg-yellow-100 text-yellow-800">2.0 - 2.9</Badge>
              <div className="text-xs mt-1">Low materiality</div>
            </div>
            <div>
              <Badge className="bg-orange-100 text-orange-800">3.0 - 3.9</Badge>
              <div className="text-xs mt-1">Material</div>
            </div>
            <div>
              <Badge className="bg-red-100 text-red-800">4.0 - 5.0</Badge>
              <div className="text-xs mt-1">Highly material</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Scoring */}
      <div className="space-y-4">
        {topics.map((topic) => (
          <Card key={topic.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{topic.topic}</span>
                  <Badge variant="outline">{topic.subcategory}</Badge>
                  {topic.materialityIndex && (
                    <Badge className={getMaterialityLevel(parseFloat(topic.materialityIndex)).color}>
                      {getMaterialityLevel(parseFloat(topic.materialityIndex)).level}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {topic.financialImpactScore !== null && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {editingTopic === topic.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleEdit(topic)}>
                      {topic.financialImpactScore !== null ? 'Edit' : 'Score'}
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingTopic === topic.id ? (
                <div className="space-y-6">
                  {/* Financial Impact Score */}
                  <div className="space-y-2">
                    <Label htmlFor={`financial-${topic.id}`}>
                      Financial Impact Score
                      <span className="text-sm text-muted-foreground ml-1">
                        (How significantly does this topic affect your business's ability to generate value?)
                      </span>
                    </Label>
                    <div className="px-3">
                      <Slider
                        id={`financial-${topic.id}`}
                        min={0}
                        max={5}
                        step={1}
                        value={[formData.financialImpactScore]}
                        onValueChange={(value) => setFormData({ ...formData, financialImpactScore: value[0] })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>None (0)</span>
                        <span>Critical (5)</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline">
                        {LIKERT_SCALE.find(s => s.value === formData.financialImpactScore)?.label} ({formData.financialImpactScore})
                      </Badge>
                    </div>
                  </div>

                  {/* Impact on Stakeholders */}
                  <div className="space-y-2">
                    <Label htmlFor={`impact-${topic.id}`}>
                      Impact on Stakeholders/Society
                      <span className="text-sm text-muted-foreground ml-1">
                        (How significantly does your organization's activities related to this topic impact people or the environment?)
                      </span>
                    </Label>
                    <div className="px-3">
                      <Slider
                        id={`impact-${topic.id}`}
                        min={0}
                        max={5}
                        step={1}
                        value={[formData.impactOnStakeholders]}
                        onValueChange={(value) => setFormData({ ...formData, impactOnStakeholders: value[0] })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>None (0)</span>
                        <span>Critical (5)</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline">
                        {LIKERT_SCALE.find(s => s.value === formData.impactOnStakeholders)?.label} ({formData.impactOnStakeholders})
                      </Badge>
                    </div>
                  </div>

                  {/* Stakeholder Concern Level */}
                  <div className="space-y-2">
                    <Label htmlFor={`concern-${topic.id}`}>
                      Stakeholder Concern Level
                      <span className="text-sm text-muted-foreground ml-1">
                        (What is the level of concern shown by stakeholders for this issue?)
                      </span>
                    </Label>
                    <Select
                      value={formData.stakeholderConcernLevel}
                      onValueChange={(value) => setFormData({ ...formData, stakeholderConcernLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select concern level" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAKEHOLDER_CONCERN_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Justification */}
                  <div className="space-y-2">
                    <Label htmlFor={`justification-${topic.id}`}>
                      Justification (Narrative)
                      <span className="text-sm text-muted-foreground ml-1">
                        (Describe why this topic is scored this way. Reference internal data or stakeholder input.)
                      </span>
                    </Label>
                    <Textarea
                      id={`justification-${topic.id}`}
                      placeholder="e.g., Significant CO₂ emissions from operations; EU customers pushing for decarbonization."
                      value={formData.scoringJustification}
                      onChange={(e) => setFormData({ ...formData, scoringJustification: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Calculated Materiality Index */}
                  {formData.financialImpactScore > 0 && formData.impactOnStakeholders > 0 && formData.stakeholderConcernLevel && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Calculated Materiality Index</h4>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {calculateMaterialityIndex(formData.financialImpactScore, formData.impactOnStakeholders, formData.stakeholderConcernLevel)}
                        </div>
                        <Badge className={getMaterialityLevel(parseFloat(calculateMaterialityIndex(formData.financialImpactScore, formData.impactOnStakeholders, formData.stakeholderConcernLevel))).color}>
                          {getMaterialityLevel(parseFloat(calculateMaterialityIndex(formData.financialImpactScore, formData.impactOnStakeholders, formData.stakeholderConcernLevel))).level}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {topic.financialImpactScore ?? '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">Financial Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {topic.impactOnStakeholders ?? '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">Stakeholder Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {topic.materialityIndex ?? '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">Materiality Index</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}