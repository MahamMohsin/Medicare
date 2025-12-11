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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  Search,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Doctor, Department, User } from "@shared/schema";

const doctorFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  specialization: z.string().min(1, "Specialization is required"),
  departmentId: z.string().optional(),
  qualifications: z.string().optional(),
  consultationFee: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

type DoctorFormData = z.infer<typeof doctorFormSchema>;

const SPECIALIZATIONS = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Neurology",
  "Pediatrics",
  "Dermatology",
  "Ophthalmology",
  "ENT",
  "Gynecology",
  "Psychiatry",
  "Radiology",
  "Pathology",
];

export default function Doctors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [viewDoctor, setViewDoctor] = useState<any>(null);

  const { data: doctors, isLoading } = useQuery<(Doctor & { user?: User; department?: Department })[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialization: "",
      departmentId: "",
      qualifications: "",
      consultationFee: "500",
      isAvailable: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DoctorFormData) => {
      return apiRequest("POST", "/api/doctors", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Doctor added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add doctor", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: DoctorFormData & { id: string }) => {
      return apiRequest("PATCH", `/api/doctors/${data.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Doctor updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      setIsDialogOpen(false);
      setSelectedDoctor(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update doctor", variant: "destructive" });
    },
  });

  const handleOpenDialog = (doctor?: any) => {
    if (doctor) {
      setSelectedDoctor(doctor);
      form.reset({
        firstName: doctor.user?.firstName || "",
        lastName: doctor.user?.lastName || "",
        email: doctor.user?.email || "",
        phone: doctor.user?.phone || "",
        specialization: doctor.specialization,
        departmentId: doctor.departmentId || "",
        qualifications: doctor.qualifications || "",
        consultationFee: doctor.consultationFee || "500",
        isAvailable: doctor.isAvailable ?? true,
      });
    } else {
      setSelectedDoctor(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: DoctorFormData) => {
    if (selectedDoctor) {
      updateMutation.mutate({ ...data, id: selectedDoctor.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredDoctors = (doctors || []).filter(
    (d) =>
      d.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Doctors"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Doctors" }]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Medical Staff</h2>
              <p className="text-muted-foreground">Manage doctors and their profiles</p>
            </div>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-doctor">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Doctor
            </Button>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search doctors..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-doctors"
            />
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onView={() => setViewDoctor(doctor)}
                  onEdit={() => handleOpenDialog(doctor)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Stethoscope className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No doctors found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "Add your first doctor to get started"}
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Doctor
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDoctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
            <DialogDescription>
              {selectedDoctor ? "Update doctor's information" : "Enter the doctor's details"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John" data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Smith" data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="doctor@medicare.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 234 567 8900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-specialization">
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SPECIALIZATIONS.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
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
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
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
                name="qualifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualifications</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="MBBS, MD, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consultationFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultation Fee ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Available for Appointments</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Toggle to show availability status
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
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
                  data-testid="button-submit-doctor"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : selectedDoctor
                    ? "Update"
                    : "Add Doctor"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDoctor} onOpenChange={() => setViewDoctor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Doctor Profile</DialogTitle>
          </DialogHeader>
          {viewDoctor && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={viewDoctor.user?.profileImageUrl} />
                  <AvatarFallback className="text-2xl">
                    {viewDoctor.user?.firstName?.[0]}{viewDoctor.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    Dr. {viewDoctor.user?.firstName} {viewDoctor.user?.lastName}
                  </h3>
                  <p className="text-muted-foreground">{viewDoctor.specialization}</p>
                  <Badge variant={viewDoctor.isAvailable ? "default" : "secondary"} className="mt-2">
                    {viewDoctor.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{viewDoctor.user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{viewDoctor.user?.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">${viewDoctor.consultationFee} / consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{viewDoctor.qualifications || "-"}</span>
                </div>
              </div>

              {viewDoctor.department && (
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{viewDoctor.department.name}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDoctor(null)}>
                  Close
                </Button>
                <Button onClick={() => { setViewDoctor(null); handleOpenDialog(viewDoctor); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DoctorCard({
  doctor,
  onView,
  onEdit,
}: {
  doctor: Doctor & { user?: User; department?: Department };
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <Card className="hover-elevate" data-testid={`card-doctor-${doctor.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={doctor.user?.profileImageUrl || undefined} />
            <AvatarFallback>
              {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="truncate font-semibold">
              Dr. {doctor.user?.firstName} {doctor.user?.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={doctor.isAvailable ? "default" : "secondary"} className="text-xs">
                {doctor.isAvailable ? "Available" : "Unavailable"}
              </Badge>
              {doctor.department && (
                <Badge variant="outline" className="text-xs">
                  {doctor.department.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>${doctor.consultationFee}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
