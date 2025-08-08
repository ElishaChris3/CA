
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, MessageCircle, TrendingUp, FileText, Calendar, Mail, Phone, MapPin, Building, Plus, Edit3, Eye, Download, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/dashboard-layout';

const stakeholderSchema = z.object({
  name: z.string().min(1, "Stakeholder name is required"),
  organization: z.string().min(1, "Organization is required"),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  influenceLevel: z.string().min(1, "Influence level is required"),
  interestLevel: z.string().min(1, "Interest level is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  location: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  esrsRelevance: z.array(z.string()).min(1, "At least one ESRS relevance is required"),
});

const engagementSchema = z.object({
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  engagementType: z.string().min(1, "Engagement type is required"),
  method: z.string().min(1, "Method is required"),
  frequency: z.string().min(1, "Frequency is required"),
  lastEngagement: z.string().min(1, "Last engagement date is required"),
  nextEngagement: z.string().min(1, "Next engagement date is required"),
  keyTopics: z.string().min(10, "Key topics must be at least 10 characters"),
  outcomes: z.string().optional(),
  followUpActions: z.string().optional(),
});

type StakeholderForm = z.infer<typeof stakeholderSchema>;
type EngagementForm = z.infer<typeof engagementSchema>;

export default function StakeholderData() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mapping');
  const [selectedStakeholder, setSelectedStakeholder] = useState<any>(null);

  // Mock data for demonstration
  const mockStakeholders = [
    {
      id: 1,
      name: "John Smith",
      organization: "Green Energy Partners",
      category: "Investors",
      type: "Institutional Investor",
      influenceLevel: "High",
      interestLevel: "High",
      contactEmail: "john.smith@greenenergypartners.com",
      contactPhone: "+1-555-0123",
      location: "New York, USA",
      description: "Leading institutional investor focused on sustainable energy investments",
      esrsRelevance: ["E1", "E5", "G1"],
      lastEngagement: "2024-03-15",
      nextEngagement: "2024-06-15",
      engagementScore: 85
    },
    {
      id: 2,
      name: "Sarah Johnson",
      organization: "Workers Union Local 123",
      category: "Employees",
      type: "Union Representative",
      influenceLevel: "High",
      interestLevel: "High",
      contactEmail: "sarah.johnson@union123.org",
      contactPhone: "+1-555-0456",
      location: "Chicago, USA",
      description: "Union representative focusing on worker rights and safety",
      esrsRelevance: ["S1", "S2"],
      lastEngagement: "2024-03-01",
      nextEngagement: "2024-05-01",
      engagementScore: 92
    },
    {
      id: 3,
      name: "David Chen",
      organization: "Community Environmental Group",
      category: "Communities",
      type: "Community Leader",
      influenceLevel: "Medium",
      interestLevel: "High",
      contactEmail: "david.chen@environmentalgroup.org",
      contactPhone: "+1-555-0789",
      location: "San Francisco, USA",
      description: "Community leader advocating for environmental protection",
      esrsRelevance: ["E2", "E3", "E4"],
      lastEngagement: "2024-02-20",
      nextEngagement: "2024-04-20",
      engagementScore: 78
    }
  ];

  const stakeholderForm = useForm<StakeholderForm>({
    resolver: zodResolver(stakeholderSchema),
    defaultValues: {
      name: "",
      organization: "",
      category: "",
      type: "",
      influenceLevel: "",
      interestLevel: "",
      contactEmail: "",
      contactPhone: "",
      location: "",
      description: "",
      esrsRelevance: [],
    },
  });

  const engagementForm = useForm<EngagementForm>({
    resolver: zodResolver(engagementSchema),
    defaultValues: {
      stakeholderId: "",
      engagementType: "",
      method: "",
      frequency: "",
      lastEngagement: "",
      nextEngagement: "",
      keyTopics: "",
      outcomes: "",
      followUpActions: "",
    },
  });

  const stakeholderCategories = [
    { value: "Investors", label: "Investors & Shareholders" },
    { value: "Employees", label: "Employees & Workers" },
    { value: "Customers", label: "Customers & Clients" },
    { value: "Suppliers", label: "Suppliers & Partners" },
    { value: "Communities", label: "Local Communities" },
    { value: "Regulators", label: "Regulators & Government" },
    { value: "NGOs", label: "NGOs & Civil Society" },
    { value: "Media", label: "Media & Press" },
  ];

  const influenceLevels = [
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  const interestLevels = [
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  const engagementTypes = [
    { value: "Formal", label: "Formal Engagement" },
    { value: "Informal", label: "Informal Engagement" },
    { value: "Consultation", label: "Consultation" },
    { value: "Collaboration", label: "Collaboration" },
    { value: "Information", label: "Information Sharing" },
  ];

  const engagementMethods = [
    { value: "Meeting", label: "Face-to-face Meeting" },
    { value: "Survey", label: "Survey" },
    { value: "Workshop", label: "Workshop" },
    { value: "Interview", label: "Interview" },
    { value: "Focus Group", label: "Focus Group" },
    { value: "Email", label: "Email Communication" },
    { value: "Phone", label: "Phone Call" },
    { value: "Online", label: "Online Platform" },
  ];

  const frequencies = [
    { value: "Weekly", label: "Weekly" },
    { value: "Monthly", label: "Monthly" },
    { value: "Quarterly", label: "Quarterly" },
    { value: "Bi-annual", label: "Bi-annual" },
    { value: "Annual", label: "Annual" },
    { value: "Ad-hoc", label: "Ad-hoc" },
  ];

  const esrsOptions = [
    { value: "E1", label: "E1 - Climate Change" },
    { value: "E2", label: "E2 - Pollution" },
    { value: "E3", label: "E3 - Water & Marine Resources" },
    { value: "E4", label: "E4 - Biodiversity & Ecosystems" },
    { value: "E5", label: "E5 - Resource Use & Circular Economy" },
    { value: "S1", label: "S1 - Own Workforce" },
    { value: "S2", label: "S2 - Workers in Value Chain" },
    { value: "S3", label: "S3 - Affected Communities" },
    { value: "S4", label: "S4 - Consumers & End-users" },
    { value: "G1", label: "G1 - Business Conduct" },
  ];

  const onSubmitStakeholder = async (data: StakeholderForm) => {
    try {
      console.log('Stakeholder data:', data);
      toast({
        title: "Stakeholder Saved",
        description: "Stakeholder has been saved successfully.",
      });
      stakeholderForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save stakeholder.",
        variant: "destructive",
      });
    }
  };

  const onSubmitEngagement = async (data: EngagementForm) => {
    try {
      console.log('Engagement data:', data);
      toast({
        title: "Engagement Saved",
        description: "Engagement record has been saved successfully.",
      });
      engagementForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save engagement.",
        variant: "destructive",
      });
    }
  };

  const StakeholderCard = ({ stakeholder }: { stakeholder: any }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-[var(--ca-green-normal)]" />
            <div>
              <CardTitle className="text-lg">{stakeholder.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{stakeholder.organization}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{stakeholder.category}</Badge>
            <Badge variant={stakeholder.influenceLevel === 'High' ? 'default' : 'secondary'}>
              {stakeholder.influenceLevel} Influence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{stakeholder.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>{stakeholder.contactEmail}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>{stakeholder.contactPhone || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>{stakeholder.location || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Engagement: {stakeholder.engagementScore}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {stakeholder.esrsRelevance.map((esrs: string) => (
              <Badge key={esrs} variant="outline" className="text-xs">
                {esrs}
              </Badge>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              Engage
            </Button>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getStakeholderMatrix = () => {
    const matrix = {
      high_high: [],
      high_medium: [],
      high_low: [],
      medium_high: [],
      medium_medium: [],
      medium_low: [],
      low_high: [],
      low_medium: [],
      low_low: []
    };

    mockStakeholders.forEach(stakeholder => {
      const key = `${stakeholder.influenceLevel.toLowerCase()}_${stakeholder.interestLevel.toLowerCase()}`;
      matrix[key as keyof typeof matrix].push(stakeholder);
    });

    return matrix;
  };

  const matrix = getStakeholderMatrix();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--ca-grey-darker)]">Stakeholder Data</h1>
            <p className="text-muted-foreground mt-2">
              Manage stakeholder relationships and engagement aligned with ESRS requirements
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button size="sm" className="bg-[var(--ca-green-normal)] hover:bg-[var(--ca-green-darker)]">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Stakeholder
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Stakeholders</p>
                  <p className="text-2xl font-bold">{mockStakeholders.length}</p>
                </div>
                <Users className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Influence</p>
                  <p className="text-2xl font-bold">{mockStakeholders.filter(s => s.influenceLevel === 'High').length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
                  <p className="text-2xl font-bold">
                    {Math.round(mockStakeholders.reduce((sum, s) => sum + s.engagementScore, 0) / mockStakeholders.length)}%
                  </p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{new Set(mockStakeholders.map(s => s.category)).size}</p>
                </div>
                <Building className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mapping">Stakeholder Mapping</TabsTrigger>
            <TabsTrigger value="directory">Stakeholder Directory</TabsTrigger>
            <TabsTrigger value="engagement">Engagement Tracking</TabsTrigger>
            <TabsTrigger value="analysis">Analysis & Reporting</TabsTrigger>
          </TabsList>

          {/* Stakeholder Mapping Tab */}
          <TabsContent value="mapping">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stakeholder Influence-Interest Matrix</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Map stakeholders based on their influence and interest levels
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 h-96">
                    {/* High Interest Row */}
                    <div className="border-2 border-red-200 bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Manage Closely</h4>
                      <p className="text-xs text-red-600 mb-2">High Influence • High Interest</p>
                      <div className="space-y-1">
                        {matrix.high_high.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Keep Satisfied</h4>
                      <p className="text-xs text-orange-600 mb-2">Medium Influence • High Interest</p>
                      <div className="space-y-1">
                        {matrix.medium_high.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-2 border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Keep Informed</h4>
                      <p className="text-xs text-yellow-600 mb-2">Low Influence • High Interest</p>
                      <div className="space-y-1">
                        {matrix.low_high.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Medium Interest Row */}
                    <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Keep Satisfied</h4>
                      <p className="text-xs text-blue-600 mb-2">High Influence • Medium Interest</p>
                      <div className="space-y-1">
                        {matrix.high_medium.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-2 border-gray-200 bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Monitor</h4>
                      <p className="text-xs text-gray-600 mb-2">Medium Influence • Medium Interest</p>
                      <div className="space-y-1">
                        {matrix.medium_medium.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Monitor</h4>
                      <p className="text-xs text-green-600 mb-2">Low Influence • Medium Interest</p>
                      <div className="space-y-1">
                        {matrix.low_medium.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Low Interest Row */}
                    <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Keep Satisfied</h4>
                      <p className="text-xs text-purple-600 mb-2">High Influence • Low Interest</p>
                      <div className="space-y-1">
                        {matrix.high_low.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-2 border-indigo-200 bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-medium text-indigo-800 mb-2">Monitor</h4>
                      <p className="text-xs text-indigo-600 mb-2">Medium Influence • Low Interest</p>
                      <div className="space-y-1">
                        {matrix.medium_low.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-2 border-teal-200 bg-teal-50 p-4 rounded-lg">
                      <h4 className="font-medium text-teal-800 mb-2">Minimal Effort</h4>
                      <p className="text-xs text-teal-600 mb-2">Low Influence • Low Interest</p>
                      <div className="space-y-1">
                        {matrix.low_low.map((stakeholder: any) => (
                          <div key={stakeholder.id} className="text-xs bg-white p-2 rounded border">
                            {stakeholder.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stakeholder Directory Tab */}
          <TabsContent value="directory">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Stakeholder Directory</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Complete list of identified stakeholders and their details
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockStakeholders.map((stakeholder) => (
                        <StakeholderCard key={stakeholder.id} stakeholder={stakeholder} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Stakeholder</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...stakeholderForm}>
                      <form onSubmit={stakeholderForm.handleSubmit(onSubmitStakeholder)} className="space-y-4">
                        <FormField
                          control={stakeholderForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter stakeholder name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stakeholderForm.control}
                          name="organization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter organization" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stakeholderForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {stakeholderCategories.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
                                      {category.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stakeholderForm.control}
                          name="influenceLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Influence Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select influence level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {influenceLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stakeholderForm.control}
                          name="interestLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interest Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select interest level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {interestLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stakeholderForm.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stakeholderForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full">
                          Save Stakeholder
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Engagement Tracking Tab */}
          <TabsContent value="engagement">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Tracking</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track and plan stakeholder engagement activities
                </p>
              </CardHeader>
              <CardContent>
                <Form {...engagementForm}>
                  <form onSubmit={engagementForm.handleSubmit(onSubmitEngagement)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={engagementForm.control}
                        name="stakeholderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stakeholder</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select stakeholder" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mockStakeholders.map((stakeholder) => (
                                  <SelectItem key={stakeholder.id} value={stakeholder.id.toString()}>
                                    {stakeholder.name} - {stakeholder.organization}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={engagementForm.control}
                        name="engagementType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Engagement Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select engagement type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {engagementTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={engagementForm.control}
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {engagementMethods.map((method) => (
                                  <SelectItem key={method.value} value={method.value}>
                                    {method.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={engagementForm.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {frequencies.map((freq) => (
                                  <SelectItem key={freq.value} value={freq.value}>
                                    {freq.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={engagementForm.control}
                        name="lastEngagement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Engagement</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={engagementForm.control}
                        name="nextEngagement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next Engagement</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={engagementForm.control}
                      name="keyTopics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Topics</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe key topics discussed" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4">
                      <Button variant="outline" type="button">
                        Save Draft
                      </Button>
                      <Button type="submit" className="bg-[var(--ca-green-normal)] hover:bg-[var(--ca-green-darker)]">
                        Save Engagement
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis & Reporting Tab */}
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {mockStakeholders.filter(s => s.engagementScore >= 80).length}
                        </div>
                        <div className="text-sm text-green-600">High Engagement</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {mockStakeholders.filter(s => s.engagementScore >= 60 && s.engagementScore < 80).length}
                        </div>
                        <div className="text-sm text-yellow-600">Medium Engagement</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Engagement by Category</h4>
                      {stakeholderCategories.map((category) => {
                        const categoryStakeholders = mockStakeholders.filter(s => s.category === category.value);
                        const avgEngagement = categoryStakeholders.length > 0 
                          ? categoryStakeholders.reduce((sum, s) => sum + s.engagementScore, 0) / categoryStakeholders.length 
                          : 0;
                        
                        return (
                          <div key={category.value} className="flex items-center justify-between">
                            <span className="text-sm">{category.label}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={avgEngagement} className="w-20 h-2" />
                              <span className="text-sm font-medium">{Math.round(avgEngagement)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Stakeholder Engagement Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Stakeholder Mapping Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      ESRS Stakeholder Analysis
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Engagement Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
