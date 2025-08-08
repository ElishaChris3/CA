import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Building2,
  Plus,
  Search,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
} from "lucide-react";

// Form schema for adding new client organization
const addClientSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  industry: z.string().min(1, "Industry is required"),
  country: z.string().min(1, "Country is required"),
  employeeCount: z.coerce.number().min(1, "Employee count must be at least 1"),
  annualRevenue: z.coerce
    .number()
    .min(0, "Annual revenue must be non-negative"),
  contactEmail: z.string().email("Valid email is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
});

type AddClientFormData = z.infer<typeof addClientSchema>;

export default function ClientOrganizations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Fetch client organizations for the consultant
  const { data: clientOrganizations, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/consultant-organizations"],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<AddClientFormData>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      name: "",
      industry: "",
      country: "",
      employeeCount: 0,
      annualRevenue: 0,
      contactEmail: "",
      contactPerson: "",
    },
  });

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (data: AddClientFormData) => {
      return apiRequest("/api/consultant-organizations", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client organization added successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/consultant-organizations"],
      });
      setIsAddClientDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add client organization",
        variant: "destructive",
      });
    },
  });

  const handleAddClient = (data: AddClientFormData) => {
    const formData = {
      ...data,
      annualRevenue: String(data?.annualRevenue),
    };
    addClientMutation.mutate(formData);
  };

  // Filter clients based on search term
  const filteredClients =
    clientOrganizations?.filter(
      (client: any) =>
        client.organizationName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.country?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Industry options
  const industryOptions = [
    "Technology",
    "Finance",
    "Healthcare",
    "Manufacturing",
    "Retail",
    "Energy",
    "Real Estate",
    "Transportation",
    "Education",
    "Government",
    "Agriculture",
    "Other",
  ];

  // Country options (simplified list)
  const countryOptions = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Netherlands",
    "Switzerland",
    "Australia",
    "Japan",
    "Singapore",
    "Other",
  ];

  if (clientsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ca-green-normal)]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Dialog
        open={!!selectedClient}
        onOpenChange={() => setSelectedClient(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-xl shadow-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl text-gray-800">
              Client Organization Details
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-sm text-gray-800">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">
                  Organization Name
                </p>
                <p className="font-medium text-base">
                  {selectedClient.organizationName || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Industry</p>
                <p className="font-medium text-base">
                  {selectedClient.industry || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Country</p>
                <p className="font-medium text-base">
                  {selectedClient.country || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Employee Count</p>
                <p className="font-medium text-base">
                  {selectedClient.employeeCount?.toLocaleString() || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Annual Revenue</p>
                <p className="font-medium text-base">
                  ${selectedClient.annualRevenue?.toLocaleString() || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Contact Person</p>
                <p className="font-medium text-base">
                  {selectedClient.contactPerson || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Contact Email</p>
                <p className="font-medium text-base">
                  {selectedClient.contactEmail ? (
                    <a
                      href={`mailto:${selectedClient.contactEmail}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedClient.contactEmail}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Status</p>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-600 border-green-200 w-fit"
                >
                  Active
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ca-grey-darker)]">
              Client Organizations
            </h1>
            <p className="text-sm text-[var(--ca-grey-dark)] mt-1">
              Manage your client organizations and their sustainability data
            </p>
          </div>
          <Dialog
            open={isAddClientDialogOpen}
            onOpenChange={setIsAddClientDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-[var(--ca-green-normal)] hover:bg-[var(--ca-green-dark)]">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Client Organization</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit(handleAddClient)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter organization name"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      onValueChange={(value) =>
                        form.setValue("industry", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industryOptions.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.industry && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.industry.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      onValueChange={(value) => form.setValue("country", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.country && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.country.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Employee Count</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      placeholder="Enter employee count"
                      {...form.register("employeeCount")}
                    />
                    {form.formState.errors.employeeCount && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.employeeCount.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualRevenue">Annual Revenue (USD)</Label>
                    <Input
                      id="annualRevenue"
                      type="number"
                      placeholder="Enter annual revenue"
                      {...form.register("annualRevenue")}
                    />
                    {form.formState.errors.annualRevenue && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.annualRevenue.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Enter contact person name"
                      {...form.register("contactPerson")}
                    />
                    {form.formState.errors.contactPerson && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.contactPerson.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="Enter contact email"
                      {...form.register("contactEmail")}
                    />
                    {form.formState.errors.contactEmail && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.contactEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddClientDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addClientMutation.isPending}
                    className="bg-[var(--ca-green-normal)] hover:bg-[var(--ca-green-dark)]"
                  >
                    {addClientMutation.isPending ? "Adding..." : "Add Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">
                    Total Clients
                  </div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">
                    {clientOrganizations?.length || 0}
                  </div>
                </div>
                <Building2 className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">
                    Active Projects
                  </div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">
                    {clientOrganizations?.filter(
                      (client: any) => client.status === "active"
                    ).length || 0}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">
                    Countries
                  </div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">
                    {new Set(
                      clientOrganizations
                        ?.map((client: any) => client.country)
                        .filter(Boolean)
                    ).size || 0}
                  </div>
                </div>
                <MapPin className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--ca-grey-dark)] mb-1">
                    This Month
                  </div>
                  <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">
                    3
                  </div>
                  <div className="text-xs text-green-600">+2 new clients</div>
                </div>
                <Calendar className="h-8 w-8 text-[var(--ca-green-normal)]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Client Organizations Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm
                            ? "No clients found matching your search"
                            : "No client organizations yet"}
                        </div>
                        {!searchTerm && (
                          <Button
                            variant="outline"
                            className="mt-2"
                            onClick={() => setIsAddClientDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Client
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client: any) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">
                              {client.organizationName || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.contactPerson || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{client.industry || "N/A"}</TableCell>
                        <TableCell>{client.country || "N/A"}</TableCell>
                        <TableCell>
                          {client.employeeCount?.toLocaleString() || "N/A"}
                        </TableCell>
                        <TableCell>
                          ${client.annualRevenue?.toLocaleString() || "N/A"}
                        </TableCell>
                        <TableCell>
                          {client.contactEmail ? (
                            <a
                              href={`mailto:${client.contactEmail}`}
                              className="text-blue-600 hover:underline"
                            >
                              {client.contactEmail}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-600 border-green-200"
                          >
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedClient(client)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
