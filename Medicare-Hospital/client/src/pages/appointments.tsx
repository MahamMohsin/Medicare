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
  Calendar,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Appointment, Patient, Doctor, Department } from "@shared/schema";

const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  departmentId: z.string().optional(),
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  type: z.enum(["consultation", "follow_up", "emergency"]),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  scheduled: "default",
  in_progress: "outline",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

export default function Appointments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewAppointment, setViewAppointment] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: appointmentsData, isLoading } = useQuery<{
    appointments: (Appointment & { patient?: Patient; doctor?: Doctor & { user?: any } })[];
    total: number;
  }>({
    queryKey: ["/api/appointments", { page: currentPage, status: statusFilter }],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients/list"],
  });

  const { data: doctors } = useQuery<(Doctor & { user?: any })[]>({
    queryKey: ["/api/doctors/list"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const appointments = appointmentsData?.appointments || [];

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      departmentId: "",
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTime: "",
      type: "consultation",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      return apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Appointment booked successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to book appointment", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AppointmentFormData & { id: string }) => {
      return apiRequest("PATCH", `/api/appointments/${data.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Appointment updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      setSelectedAppointment(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update appointment", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Appointment cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel appointment", variant: "destructive" });
    },
  });

  const handleOpenDialog = (appointment?: Appointment) => {
    if (appointment) {
      setSelectedAppointment(appointment);
      form.reset({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        departmentId: appointment.departmentId || "",
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        type: appointment.type || "consultation",
        notes: appointment.notes || "",
      });
    } else {
      setSelectedAppointment(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: AppointmentFormData) => {
    if (selectedAppointment) {
      updateMutation.mutate({ ...data, id: selectedAppointment.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient?.patientId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = filteredAppointments.filter((a) => a.appointmentDate === todayStr);
  const upcomingAppointments = filteredAppointments.filter((a) => a.appointmentDate > todayStr);
  const pastAppointments = filteredAppointments.filter((a) => a.appointmentDate < todayStr);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Appointments"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Appointments" }]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Appointment Management</h2>
              <p className="text-muted-foreground">Schedule and manage patient appointments</p>
            </div>
            <Button onClick={() => handleOpenDialog()} data-testid="button-book-appointment">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Today</CardDescription>
                <CardTitle className="text-3xl">{todayAppointments.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Upcoming</CardDescription>
                <CardTitle className="text-3xl">{upcomingAppointments.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-3xl">
                  {appointments.filter((a) => a.status === "completed").length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search appointments..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-appointments"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="today">
                <TabsList>
                  <TabsTrigger value="today" data-testid="tab-today">
                    Today ({todayAppointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                    Upcoming ({upcomingAppointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="past" data-testid="tab-past">
                    Past ({pastAppointments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="mt-4">
                  <AppointmentTable
                    appointments={todayAppointments}
                    isLoading={isLoading}
                    onView={setViewAppointment}
                    onEdit={handleOpenDialog}
                    onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                </TabsContent>

                <TabsContent value="upcoming" className="mt-4">
                  <AppointmentTable
                    appointments={upcomingAppointments}
                    isLoading={isLoading}
                    onView={setViewAppointment}
                    onEdit={handleOpenDialog}
                    onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                </TabsContent>

                <TabsContent value="past" className="mt-4">
                  <AppointmentTable
                    appointments={pastAppointments}
                    isLoading={isLoading}
                    onView={setViewAppointment}
                    onEdit={handleOpenDialog}
                    onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? "Edit Appointment" : "Book New Appointment"}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment
                ? "Update the appointment details"
                : "Schedule a new appointment for a patient"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-doctor">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors?.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.user?.firstName} {doctor.user?.lastName} - {doctor.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appointmentTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-time">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
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
                      <Textarea
                        {...field}
                        placeholder="Additional notes..."
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-appointment"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : selectedAppointment
                    ? "Update"
                    : "Book Appointment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewAppointment} onOpenChange={() => setViewAppointment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {viewAppointment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={statusColors[viewAppointment.status || "scheduled"]} className="capitalize">
                  {viewAppointment.status?.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {viewAppointment.type}
                </Badge>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {viewAppointment.patient?.firstName?.[0]}{viewAppointment.patient?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {viewAppointment.patient?.firstName} {viewAppointment.patient?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {viewAppointment.patient?.patientId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{viewAppointment.appointmentDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{viewAppointment.appointmentTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span>
                  Dr. {viewAppointment.doctor?.user?.firstName} {viewAppointment.doctor?.user?.lastName}
                </span>
              </div>

              {viewAppointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{viewAppointment.notes}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewAppointment(null)}>
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

function AppointmentTable({
  appointments,
  isLoading,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  appointments: any[];
  isLoading: boolean;
  onView: (apt: any) => void;
  onEdit: (apt: any) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">No appointments</h3>
        <p className="text-sm text-muted-foreground">No appointments found in this category</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((apt) => (
            <TableRow key={apt.id} data-testid={`row-appointment-${apt.id}`}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {apt.patient?.patientId}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">
                  Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{apt.doctor?.specialization}</p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {apt.appointmentDate}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {apt.appointmentTime}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {apt.type?.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[apt.status || "scheduled"]} className="capitalize">
                  {apt.status?.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onView(apt)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(apt)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {apt.status === "scheduled" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStatusChange(apt.id, "completed")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onDelete(apt.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
