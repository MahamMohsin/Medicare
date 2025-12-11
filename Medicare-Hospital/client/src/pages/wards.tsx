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
  Bed,
  Building2,
  CheckCircle,
  DollarSign,
  LogIn,
  LogOut,
  Plus,
  Search,
  Settings,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Ward, Bed as BedType, Patient, Doctor, Admission } from "@shared/schema";

const admissionFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  bedId: z.string().min(1, "Bed is required"),
  doctorId: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});

type AdmissionFormData = z.infer<typeof admissionFormSchema>;

const bedStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "secondary",
  occupied: "default",
  maintenance: "outline",
  reserved: "destructive",
};

const bedStatusIcons: Record<string, React.ReactNode> = {
  available: <CheckCircle className="h-4 w-4" />,
  occupied: <User className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  reserved: <Settings className="h-4 w-4" />,
};

export default function Wards() {
  const { toast } = useToast();
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [isAdmitDialogOpen, setIsAdmitDialogOpen] = useState(false);
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);

  const { data: wards, isLoading: wardsLoading } = useQuery<Ward[]>({
    queryKey: ["/api/wards"],
  });

  const { data: beds, isLoading: bedsLoading } = useQuery<(BedType & { ward?: Ward; admission?: Admission & { patient?: Patient } })[]>({
    queryKey: ["/api/beds", { wardId: selectedWard !== "all" ? selectedWard : undefined }],
  });

  const { data: admissions, isLoading: admissionsLoading } = useQuery<(Admission & { patient?: Patient; bed?: BedType & { ward?: Ward }; doctor?: Doctor & { user?: any } })[]>({
    queryKey: ["/api/admissions", { status: "admitted" }],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients/list"],
  });

  const { data: doctors } = useQuery<(Doctor & { user?: any })[]>({
    queryKey: ["/api/doctors/list"],
  });

  const form = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      patientId: "",
      bedId: "",
      doctorId: "",
      diagnosis: "",
      notes: "",
    },
  });

  const admitMutation = useMutation({
    mutationFn: async (data: AdmissionFormData) => {
      return apiRequest("POST", "/api/admissions", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Patient admitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      setIsAdmitDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to admit patient", variant: "destructive" });
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admissions/${id}/discharge`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Patient discharged successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      setIsDischargeDialogOpen(false);
      setSelectedAdmission(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to discharge patient", variant: "destructive" });
    },
  });

  const handleAdmit = () => {
    if (selectedBed) {
      form.setValue("bedId", selectedBed.id);
    }
    setIsAdmitDialogOpen(true);
  };

  const onSubmitAdmission = (data: AdmissionFormData) => {
    admitMutation.mutate(data);
  };

  const availableBeds = (beds || []).filter((b) => b.status === "available").length;
  const occupiedBeds = (beds || []).filter((b) => b.status === "occupied").length;
  const maintenanceBeds = (beds || []).filter((b) => b.status === "maintenance").length;
  const totalBeds = beds?.length || 0;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const filteredBeds = selectedWard === "all" ? beds : beds?.filter((b) => b.wardId === selectedWard);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Wards & Beds"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Wards & Beds" }]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Ward Management</h2>
              <p className="text-muted-foreground">Manage beds and patient admissions</p>
            </div>
            <Button onClick={handleAdmit} data-testid="button-admit-patient">
              <LogIn className="mr-2 h-4 w-4" />
              Admit Patient
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Total Beds</CardDescription>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalBeds}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Available</CardDescription>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{availableBeds}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Occupied</CardDescription>
                <User className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{occupiedBeds}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Occupancy Rate</CardDescription>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{occupancyRate}%</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="beds">
            <TabsList>
              <TabsTrigger value="beds" data-testid="tab-beds">Bed Overview</TabsTrigger>
              <TabsTrigger value="admissions" data-testid="tab-admissions">Current Admissions</TabsTrigger>
            </TabsList>

            <TabsContent value="beds" className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedWard === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWard("all")}
                >
                  All Wards
                </Button>
                {wards?.map((ward) => (
                  <Button
                    key={ward.id}
                    variant={selectedWard === ward.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWard(ward.id)}
                  >
                    {ward.name}
                  </Button>
                ))}
              </div>

              {bedsLoading ? (
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredBeds && filteredBeds.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {filteredBeds.map((bed) => (
                    <BedCard
                      key={bed.id}
                      bed={bed}
                      onAdmit={() => { setSelectedBed(bed); handleAdmit(); }}
                      onDischarge={(admission) => { setSelectedAdmission(admission); setIsDischargeDialogOpen(true); }}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Bed className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No beds found</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedWard !== "all" ? "No beds in this ward" : "Add beds to get started"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="admissions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Admissions</CardTitle>
                  <CardDescription>Patients currently admitted in the hospital</CardDescription>
                </CardHeader>
                <CardContent>
                  {admissionsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : admissions && admissions.length > 0 ? (
                    <div className="space-y-4">
                      {admissions.map((admission) => (
                        <div
                          key={admission.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                          data-testid={`admission-${admission.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                {admission.patient?.firstName?.[0]}{admission.patient?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">
                                {admission.patient?.firstName} {admission.patient?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {admission.bed?.ward?.name} - Bed {admission.bed?.bedNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Admitted: {admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : "-"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {admission.doctor && (
                              <Badge variant="outline">
                                Dr. {admission.doctor.user?.firstName} {admission.doctor.user?.lastName}
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedAdmission(admission); setIsDischargeDialogOpen(true); }}
                            >
                              <LogOut className="mr-1 h-4 w-4" />
                              Discharge
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No current admissions</h3>
                      <p className="text-sm text-muted-foreground">All patients have been discharged</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isAdmitDialogOpen} onOpenChange={setIsAdmitDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Admit Patient</DialogTitle>
            <DialogDescription>Assign a patient to a bed</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAdmission)} className="space-y-4">
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
                name="bedId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bed">
                          <SelectValue placeholder="Select available bed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {beds?.filter((b) => b.status === "available").map((bed) => (
                          <SelectItem key={bed.id} value={bed.id}>
                            {bed.ward?.name} - Bed {bed.bedNumber}
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
                    <FormLabel>Attending Doctor</FormLabel>
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
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Initial diagnosis" />
                    </FormControl>
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
                <Button type="button" variant="outline" onClick={() => setIsAdmitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={admitMutation.isPending} data-testid="button-submit-admission">
                  {admitMutation.isPending ? "Admitting..." : "Admit Patient"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDischargeDialogOpen} onOpenChange={setIsDischargeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discharge Patient</DialogTitle>
            <DialogDescription>
              Are you sure you want to discharge this patient?
            </DialogDescription>
          </DialogHeader>
          {selectedAdmission && (
            <div className="rounded-lg border p-4">
              <p className="font-semibold">
                {selectedAdmission.patient?.firstName} {selectedAdmission.patient?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedAdmission.bed?.ward?.name} - Bed {selectedAdmission.bed?.bedNumber}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDischargeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => dischargeMutation.mutate(selectedAdmission?.id)}
              disabled={dischargeMutation.isPending}
            >
              {dischargeMutation.isPending ? "Discharging..." : "Confirm Discharge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BedCard({
  bed,
  onAdmit,
  onDischarge,
}: {
  bed: BedType & { ward?: Ward; admission?: Admission & { patient?: Patient } };
  onAdmit: () => void;
  onDischarge: (admission: any) => void;
}) {
  const isAvailable = bed.status === "available";
  const isOccupied = bed.status === "occupied";

  return (
    <Card
      className={`hover-elevate cursor-pointer transition-colors ${
        isAvailable ? "border-green-200 dark:border-green-900" : ""
      } ${isOccupied ? "border-blue-200 dark:border-blue-900" : ""}`}
      data-testid={`bed-${bed.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold">#{bed.bedNumber}</span>
          <Badge variant={bedStatusColors[bed.status || "available"]} className="capitalize">
            {bedStatusIcons[bed.status || "available"]}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mb-2">{bed.ward?.name}</p>

        {isOccupied && bed.admission?.patient && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm font-medium truncate">
              {bed.admission.patient.firstName} {bed.admission.patient.lastName}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => onDischarge(bed.admission)}
            >
              <LogOut className="mr-1 h-3 w-3" />
              Discharge
            </Button>
          </div>
        )}

        {isAvailable && (
          <Button size="sm" className="mt-2 w-full" onClick={onAdmit}>
            <Plus className="mr-1 h-3 w-3" />
            Admit
          </Button>
        )}

        {bed.status === "maintenance" && (
          <p className="mt-2 text-xs text-muted-foreground">Under maintenance</p>
        )}

        {bed.status === "reserved" && (
          <p className="mt-2 text-xs text-muted-foreground">Reserved</p>
        )}
      </CardContent>
    </Card>
  );
}
