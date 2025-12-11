import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowRight,
  Beaker,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileText,
  FlaskConical,
  Plus,
  Search,
  TestTube,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { LabTest, LabTestCatalog, Patient, Doctor } from "@shared/schema";

const labTestOrderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().optional(),
  testCatalogId: z.string().min(1, "Test is required"),
  notes: z.string().optional(),
});

type LabTestOrderData = z.infer<typeof labTestOrderSchema>;

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  sample_collected: "secondary",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const statusSteps = ["pending", "sample_collected", "in_progress", "completed"];

export default function Lab() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: labTests, isLoading: testsLoading } = useQuery<
    (LabTest & { patient?: Patient; doctor?: Doctor & { user?: any }; testCatalog?: LabTestCatalog })[]
  >({
    queryKey: ["/api/lab-tests", { status: statusFilter }],
  });

  const { data: catalog, isLoading: catalogLoading } = useQuery<LabTestCatalog[]>({
    queryKey: ["/api/lab-catalog"],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients/list"],
  });

  const { data: doctors } = useQuery<(Doctor & { user?: any })[]>({
    queryKey: ["/api/doctors/list"],
  });

  const form = useForm<LabTestOrderData>({
    resolver: zodResolver(labTestOrderSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      testCatalogId: "",
      notes: "",
    },
  });

  const orderMutation = useMutation({
    mutationFn: async (data: LabTestOrderData) => {
      return apiRequest("POST", "/api/lab-tests", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lab test ordered successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      setIsOrderDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to order lab test", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/lab-tests/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const addResultMutation = useMutation({
    mutationFn: async ({ id, results }: { id: string; results: any }) => {
      return apiRequest("PATCH", `/api/lab-tests/${id}/results`, { results, status: "completed" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Results added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      setIsResultDialogOpen(false);
      setSelectedTest(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add results", variant: "destructive" });
    },
  });

  const onSubmitOrder = (data: LabTestOrderData) => {
    orderMutation.mutate(data);
  };

  const handleNextStatus = (test: any) => {
    const currentIndex = statusSteps.indexOf(test.status);
    if (currentIndex < statusSteps.length - 1) {
      updateStatusMutation.mutate({ id: test.id, status: statusSteps[currentIndex + 1] });
    }
  };

  const filteredTests = (labTests || []).filter((t) => {
    const matchesSearch =
      t.patient?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.patient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.testCatalog?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = (labTests || []).filter((t) => t.status === "pending").length;
  const inProgressCount = (labTests || []).filter((t) => ["sample_collected", "in_progress"].includes(t.status || "")).length;
  const completedCount = (labTests || []).filter((t) => t.status === "completed").length;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Laboratory"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Laboratory" }]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Laboratory Management</h2>
              <p className="text-muted-foreground">Manage lab tests and reports</p>
            </div>
            <Button onClick={() => setIsOrderDialogOpen(true)} data-testid="button-order-test">
              <Plus className="mr-2 h-4 w-4" />
              Order Test
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Pending</CardDescription>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>In Progress</CardDescription>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{inProgressCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Completed</CardDescription>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{completedCount}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tests">
            <TabsList>
              <TabsTrigger value="tests" data-testid="tab-tests">Lab Tests</TabsTrigger>
              <TabsTrigger value="catalog" data-testid="tab-catalog">Test Catalog</TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search tests..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search-tests"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sample_collected">Sample Collected</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {testsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredTests.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Test</TableHead>
                            <TableHead>Ordered By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTests.map((test) => (
                            <TableRow key={test.id} data-testid={`row-lab-test-${test.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {test.patient?.firstName?.[0]}{test.patient?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {test.patient?.firstName} {test.patient?.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {test.patient?.patientId}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{test.testCatalog?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {test.testCatalog?.code}
                                </p>
                              </TableCell>
                              <TableCell>
                                {test.doctor ? (
                                  <p className="text-sm">
                                    Dr. {test.doctor.user?.firstName} {test.doctor.user?.lastName}
                                  </p>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusColors[test.status || "pending"]} className="capitalize">
                                  {test.status?.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {test.status === "completed" && (
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedTest(test)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {test.status !== "completed" && test.status !== "cancelled" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleNextStatus(test)}
                                    >
                                      <ArrowRight className="mr-1 h-4 w-4" />
                                      Next
                                    </Button>
                                  )}
                                  {test.status === "in_progress" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => { setSelectedTest(test); setIsResultDialogOpen(true); }}
                                    >
                                      <FileText className="mr-1 h-4 w-4" />
                                      Add Results
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <TestTube className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No lab tests found</h3>
                      <p className="text-sm text-muted-foreground">Order a new test to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Catalog</CardTitle>
                  <CardDescription>Available laboratory tests and their details</CardDescription>
                </CardHeader>
                <CardContent>
                  {catalogLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : catalog && catalog.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {catalog.map((test) => (
                        <Card key={test.id} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold">{test.name}</h4>
                                <p className="text-xs text-muted-foreground font-mono">{test.code}</p>
                              </div>
                              <Badge variant="outline">${test.price}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {test.description || "No description available"}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {test.sampleType && (
                                <span className="flex items-center gap-1">
                                  <Beaker className="h-3 w-3" />
                                  {test.sampleType}
                                </span>
                              )}
                              {test.turnaroundTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {test.turnaroundTime}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Beaker className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No tests in catalog</h3>
                      <p className="text-sm text-muted-foreground">Add tests to the catalog to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Lab Test</DialogTitle>
            <DialogDescription>Create a new lab test order for a patient</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitOrder)} className="space-y-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-patient">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients?.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName} ({patient.patientId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="testCatalogId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-test">
                          <SelectValue placeholder="Select test" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {catalog?.map((test) => (
                          <SelectItem key={test.id} value={test.id}>
                            {test.name} - ${test.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordering Doctor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors?.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Additional notes..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={orderMutation.isPending} data-testid="button-submit-order">
                  {orderMutation.isPending ? "Ordering..." : "Order Test"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Test Results</DialogTitle>
            <DialogDescription>
              Enter the results for {selectedTest?.testCatalog?.name}
            </DialogDescription>
          </DialogHeader>
          <ResultsForm
            test={selectedTest}
            onSubmit={(results) => addResultMutation.mutate({ id: selectedTest.id, results })}
            isPending={addResultMutation.isPending}
            onCancel={() => setIsResultDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTest && !isResultDialogOpen} onOpenChange={() => setSelectedTest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Test Results</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Test</p>
                <p className="font-semibold">{selectedTest.testCatalog?.name}</p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-semibold">
                  {selectedTest.patient?.firstName} {selectedTest.patient?.lastName}
                </p>
              </div>

              {selectedTest.results && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground mb-2">Results</p>
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span>Value:</span>
                      <span className="font-medium">{selectedTest.results.value} {selectedTest.results.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Normal Range:</span>
                      <span className="font-medium">{selectedTest.results.normalRange}</span>
                    </div>
                    {selectedTest.results.interpretation && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Interpretation</p>
                        <p>{selectedTest.results.interpretation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTest(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResultsForm({
  test,
  onSubmit,
  isPending,
  onCancel,
}: {
  test: any;
  onSubmit: (results: any) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(test?.testCatalog?.unit || "");
  const [interpretation, setInterpretation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      value,
      unit,
      normalRange: test?.testCatalog?.normalRange || "",
      interpretation,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Value *</label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter result value"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Unit</label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="mg/dL, etc."
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Normal Range</label>
        <Input value={test?.testCatalog?.normalRange || "-"} disabled />
      </div>

      <div>
        <label className="text-sm font-medium">Interpretation</label>
        <Textarea
          value={interpretation}
          onChange={(e) => setInterpretation(e.target.value)}
          placeholder="Clinical interpretation of results..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !value}>
          {isPending ? "Saving..." : "Save Results"}
        </Button>
      </DialogFooter>
    </form>
  );
}
