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
  Building,
  Building2,
  Edit,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Department, User, UserRole } from "@shared/schema";

const departmentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentFormSchema>;

const userRoleSchema = z.object({
  role: z.enum(["admin", "doctor", "nurse", "lab_staff", "receptionist", "patient"]),
});

type UserRoleData = z.infer<typeof userRoleSchema>;

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrator", description: "Full system access" },
  { value: "doctor", label: "Doctor", description: "Patient care and prescriptions" },
  { value: "nurse", label: "Nurse", description: "Ward and patient management" },
  { value: "lab_staff", label: "Lab Staff", description: "Laboratory operations" },
  { value: "receptionist", label: "Receptionist", description: "Front desk operations" },
  { value: "patient", label: "Patient", description: "Limited access to own records" },
];

export default function Admin() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: departments, isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const departmentForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const roleForm = useForm<UserRoleData>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: {
      role: "patient",
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      return apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Department created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDepartmentDialogOpen(false);
      departmentForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create department", variant: "destructive" });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData & { id: string }) => {
      return apiRequest("PATCH", `/api/departments/${data.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Department updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDepartmentDialogOpen(false);
      setSelectedDepartment(null);
      departmentForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update department", variant: "destructive" });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Department deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete department", variant: "destructive" });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async (data: UserRoleData & { id: string }) => {
      return apiRequest("PATCH", `/api/users/${data.id}/role`, { role: data.role });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    },
  });

  const handleOpenDepartmentDialog = (department?: Department) => {
    if (department) {
      setSelectedDepartment(department);
      departmentForm.reset({
        name: department.name,
        description: department.description || "",
      });
    } else {
      setSelectedDepartment(null);
      departmentForm.reset();
    }
    setIsDepartmentDialogOpen(true);
  };

  const onSubmitDepartment = (data: DepartmentFormData) => {
    if (selectedDepartment) {
      updateDepartmentMutation.mutate({ ...data, id: selectedDepartment.id });
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const handleOpenUserRoleDialog = (user: User) => {
    setSelectedUser(user);
    roleForm.setValue("role", (user.role as UserRole) || "patient");
    setIsUserRoleDialogOpen(true);
  };

  const onSubmitUserRole = (data: UserRoleData) => {
    if (selectedUser) {
      updateUserRoleMutation.mutate({ ...data, id: selectedUser.id });
    }
  };

  const filteredUsers = (users || []).filter(
    (u) =>
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (role) {
      case "admin":
        return "default";
      case "doctor":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Administration"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Administration" }]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">System Administration</h2>
              <p className="text-muted-foreground">Manage departments, users, and system settings</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Departments</CardDescription>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{departments?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Total Users</CardDescription>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{users?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Administrators</CardDescription>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {(users || []).filter((u) => u.role === "admin").length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="departments">
            <TabsList>
              <TabsTrigger value="departments" data-testid="tab-departments">
                <Building className="mr-2 h-4 w-4" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">
                <UserCog className="mr-2 h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="departments" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>Manage hospital departments</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenDepartmentDialog()} data-testid="button-add-department">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </CardHeader>
                <CardContent>
                  {departmentsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : departments && departments.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {departments.map((dept) => (
                            <TableRow key={dept.id}>
                              <TableCell className="font-medium">{dept.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {dept.description || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenDepartmentDialog(dept)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteDepartmentMutation.mutate(dept.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No departments</h3>
                      <p className="text-sm text-muted-foreground">Add your first department</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage user roles and permissions</CardDescription>
                    </div>
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.profileImageUrl || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {user.firstName?.[0]}{user.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {user.firstName} {user.lastName}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {user.email}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getRoleBadgeVariant(user.role || "patient")} className="capitalize">
                                  {user.role?.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenUserRoleDialog(user)}
                                >
                                  <UserCog className="mr-1 h-4 w-4" />
                                  Change Role
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No users found</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? "Try adjusting your search" : "No users registered yet"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hospital Settings</CardTitle>
                  <CardDescription>Configure hospital information and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Hospital Name</label>
                      <Input value="Medicare Hospital" disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Phone</label>
                      <Input placeholder="+1 234 567 8900" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input placeholder="contact@medicare.com" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Website</label>
                      <Input placeholder="https://medicare.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Textarea placeholder="Hospital address..." />
                  </div>
                  <div className="flex justify-end">
                    <Button>Save Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDepartment ? "Edit Department" : "Add Department"}
            </DialogTitle>
            <DialogDescription>
              {selectedDepartment ? "Update department details" : "Create a new department"}
            </DialogDescription>
          </DialogHeader>
          <Form {...departmentForm}>
            <form onSubmit={departmentForm.handleSubmit(onSubmitDepartment)} className="space-y-4">
              <FormField
                control={departmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cardiology" data-testid="input-department-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={departmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Department description..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDepartmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
                >
                  {createDepartmentMutation.isPending || updateDepartmentMutation.isPending
                    ? "Saving..."
                    : selectedDepartment
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUserRoleDialogOpen} onOpenChange={setIsUserRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(onSubmitUserRole)} className="space-y-4">
              <FormField
                control={roleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <p className="font-medium">{role.label}</p>
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUserRoleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserRoleMutation.isPending}>
                  {updateUserRoleMutation.isPending ? "Updating..." : "Update Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
