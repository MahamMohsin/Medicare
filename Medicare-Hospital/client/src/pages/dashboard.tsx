import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Bed,
  Calendar,
  CalendarPlus,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Stethoscope,
  TestTube,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { Appointment, Patient, Doctor } from "@shared/schema";

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  availableBeds: number;
  monthlyRevenue: number;
  pendingLabTests: number;
  activeDoctors: number;
}

interface RecentActivity {
  id: string;
  type: "appointment" | "patient" | "lab" | "admission";
  description: string;
  time: string;
}

const COLORS = ["hsl(201, 96%, 32%)", "hsl(142, 76%, 36%)", "hsl(28, 85%, 48%)", "hsl(280, 75%, 42%)"];

const mockPatientTrends = [
  { month: "Jan", patients: 45 },
  { month: "Feb", patients: 52 },
  { month: "Mar", patients: 48 },
  { month: "Apr", patients: 62 },
  { month: "May", patients: 75 },
  { month: "Jun", patients: 68 },
];

const mockBedOccupancy = [
  { name: "General", value: 65 },
  { name: "ICU", value: 85 },
  { name: "Private", value: 45 },
  { name: "Semi-Private", value: 55 },
];

const mockRevenueData = [
  { department: "Cardiology", revenue: 45000 },
  { department: "Orthopedics", revenue: 38000 },
  { department: "Neurology", revenue: 32000 },
  { department: "General", revenue: 28000 },
];

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery<{ appointments: (Appointment & { patient?: Patient; doctor?: Doctor & { user?: any } })[] }>({
    queryKey: ["/api/appointments"],
  });

  const recentAppointments = appointmentsData?.appointments || [];

  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.firstName || "User";

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Dashboard" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold" data-testid="text-greeting">
                {greeting()}, {userName}
              </h2>
              <p className="text-muted-foreground">Here's what's happening at Medicare Hospital today</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild data-testid="button-register-patient">
                <Link href="/patients?action=new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register Patient
                </Link>
              </Button>
              <Button variant="outline" asChild data-testid="button-book-appointment">
                <Link href="/appointments?action=new">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Patients"
              value={stats?.totalPatients ?? 0}
              icon={<Users className="h-5 w-5" />}
              trend="+12%"
              loading={statsLoading}
              testId="stat-total-patients"
            />
            <StatCard
              title="Today's Appointments"
              value={stats?.todayAppointments ?? 0}
              icon={<Calendar className="h-5 w-5" />}
              loading={statsLoading}
              testId="stat-today-appointments"
            />
            <StatCard
              title="Available Beds"
              value={stats?.availableBeds ?? 0}
              icon={<Bed className="h-5 w-5" />}
              loading={statsLoading}
              testId="stat-available-beds"
            />
            <StatCard
              title="Monthly Revenue"
              value={stats?.monthlyRevenue ?? 0}
              icon={<DollarSign className="h-5 w-5" />}
              prefix="$"
              trend="+8%"
              loading={statsLoading}
              testId="stat-monthly-revenue"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Patient Registration Trends</CardTitle>
                  <CardDescription>Monthly patient registrations</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockPatientTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="patients"
                        stroke="hsl(201, 96%, 32%)"
                        fill="hsl(201, 96%, 32%)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Bed Occupancy</CardTitle>
                  <CardDescription>Current occupancy by ward type</CardDescription>
                </div>
                <Bed className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockBedOccupancy}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {mockBedOccupancy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Revenue by Department</CardTitle>
                  <CardDescription>This month's revenue breakdown</CardDescription>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockRevenueData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="department" type="category" className="text-xs" width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickAction
                  icon={<UserPlus />}
                  label="Register Patient"
                  href="/patients?action=new"
                  testId="quick-action-register"
                />
                <QuickAction
                  icon={<CalendarPlus />}
                  label="Book Appointment"
                  href="/appointments?action=new"
                  testId="quick-action-appointment"
                />
                <QuickAction
                  icon={<TestTube />}
                  label="Order Lab Test"
                  href="/lab?action=new"
                  testId="quick-action-lab"
                />
                <QuickAction
                  icon={<Bed />}
                  label="Admit Patient"
                  href="/wards?action=admit"
                  testId="quick-action-admit"
                />
                <QuickAction
                  icon={<FileText />}
                  label="Generate Bill"
                  href="/billing?action=new"
                  testId="quick-action-bill"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Today's Appointments</CardTitle>
                  <CardDescription>Upcoming scheduled appointments</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/appointments">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentAppointments && recentAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {recentAppointments.slice(0, 5).map((apt) => (
                      <AppointmentItem key={apt.id} appointment={apt} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <Link href="/appointments?action=new">
                        <Plus className="mr-1 h-4 w-4" />
                        Book Appointment
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Latest actions in the system</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Activity className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  prefix?: string;
  loading?: boolean;
  testId?: string;
}

function StatCard({ title, value, icon, trend, prefix = "", loading, testId }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" data-testid={testId}>
              {prefix}{value.toLocaleString()}
            </span>
            {trend && (
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="mr-1 h-3 w-3" />
                {trend}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon, label, href, testId }: { icon: React.ReactNode; label: string; href: string; testId: string }) {
  return (
    <Button variant="ghost" className="w-full justify-start" asChild data-testid={testId}>
      <Link href={href}>
        <span className="mr-3 text-primary">{icon}</span>
        {label}
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </Link>
    </Button>
  );
}

function AppointmentItem({ appointment }: { appointment: Appointment & { patient?: Patient; doctor?: Doctor } }) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "default",
      completed: "secondary",
      cancelled: "destructive",
      in_progress: "outline",
    };
    return variants[status] || "default";
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Stethoscope className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">
          {appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : "Patient"}
        </p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {appointment.appointmentTime}
        </p>
      </div>
      <Badge variant={getStatusBadge(appointment.status || "scheduled")} className="capitalize">
        {appointment.status?.replace("_", " ")}
      </Badge>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const getIcon = () => {
    switch (activity.type) {
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      case "patient":
        return <Users className="h-4 w-4" />;
      case "lab":
        return <TestTube className="h-4 w-4" />;
      case "admission":
        return <Bed className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm">{activity.description}</p>
        <p className="text-xs text-muted-foreground">{activity.time}</p>
      </div>
    </div>
  );
}
