import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Bed,
  Calendar,
  Download,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "hsl(201, 96%, 32%)",
  "hsl(142, 76%, 36%)",
  "hsl(28, 85%, 48%)",
  "hsl(280, 75%, 42%)",
  "hsl(340, 82%, 52%)",
];

const mockPatientData = [
  { month: "Jan", patients: 145, appointments: 320 },
  { month: "Feb", patients: 152, appointments: 345 },
  { month: "Mar", patients: 148, appointments: 298 },
  { month: "Apr", patients: 162, appointments: 389 },
  { month: "May", patients: 175, appointments: 412 },
  { month: "Jun", patients: 168, appointments: 378 },
];

const mockRevenueData = [
  { month: "Jan", revenue: 125000, expenses: 95000 },
  { month: "Feb", revenue: 138000, expenses: 98000 },
  { month: "Mar", revenue: 142000, expenses: 102000 },
  { month: "Apr", revenue: 156000, expenses: 108000 },
  { month: "May", revenue: 168000, expenses: 112000 },
  { month: "Jun", revenue: 175000, expenses: 118000 },
];

const mockDepartmentRevenue = [
  { name: "Cardiology", value: 45000 },
  { name: "Orthopedics", value: 38000 },
  { name: "Neurology", value: 32000 },
  { name: "General Medicine", value: 28000 },
  { name: "Pediatrics", value: 22000 },
];

const mockAppointmentsByDoctor = [
  { doctor: "Dr. Smith", appointments: 85, completed: 78 },
  { doctor: "Dr. Johnson", appointments: 72, completed: 68 },
  { doctor: "Dr. Williams", appointments: 65, completed: 60 },
  { doctor: "Dr. Brown", appointments: 58, completed: 54 },
  { doctor: "Dr. Davis", appointments: 52, completed: 48 },
];

const mockLabTestVolume = [
  { week: "Week 1", tests: 156 },
  { week: "Week 2", tests: 178 },
  { week: "Week 3", tests: 165 },
  { week: "Week 4", tests: 192 },
];

const mockBedOccupancy = [
  { ward: "General", total: 50, occupied: 38 },
  { ward: "ICU", total: 20, occupied: 18 },
  { ward: "Private", total: 30, occupied: 15 },
  { ward: "Semi-Private", total: 40, occupied: 28 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("month");

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Reports"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Reports" }]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Analytics & Reports</h2>
              <p className="text-muted-foreground">Comprehensive hospital performance metrics</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Patients"
              value="1,248"
              change="+12.5%"
              trend="up"
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              title="Appointments"
              value="2,142"
              change="+8.2%"
              trend="up"
              icon={<Calendar className="h-5 w-5" />}
            />
            <MetricCard
              title="Revenue"
              value="$904,500"
              change="+15.3%"
              trend="up"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <MetricCard
              title="Bed Occupancy"
              value="72%"
              change="-3.1%"
              trend="down"
              icon={<Bed className="h-5 w-5" />}
            />
          </div>

          <Tabs defaultValue="patients">
            <TabsList>
              <TabsTrigger value="patients" data-testid="tab-patients">
                <Users className="mr-2 h-4 w-4" />
                Patients
              </TabsTrigger>
              <TabsTrigger value="revenue" data-testid="tab-revenue">
                <DollarSign className="mr-2 h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="appointments" data-testid="tab-appointments">
                <Calendar className="mr-2 h-4 w-4" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="operations" data-testid="tab-operations">
                <Activity className="mr-2 h-4 w-4" />
                Operations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="mt-4 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Registration Trends</CardTitle>
                    <CardDescription>Monthly patient registrations and appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockPatientData}>
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
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="patients"
                            stackId="1"
                            stroke={COLORS[0]}
                            fill={COLORS[0]}
                            fillOpacity={0.6}
                            name="New Patients"
                          />
                          <Area
                            type="monotone"
                            dataKey="appointments"
                            stackId="2"
                            stroke={COLORS[1]}
                            fill={COLORS[1]}
                            fillOpacity={0.6}
                            name="Appointments"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Demographics</CardTitle>
                    <CardDescription>Distribution by age group</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "0-18", value: 15 },
                              { name: "19-35", value: 28 },
                              { name: "36-50", value: 32 },
                              { name: "51-65", value: 18 },
                              { name: "65+", value: 7 },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            dataKey="value"
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
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
            </TabsContent>

            <TabsContent value="revenue" className="mt-4 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
                    <CardDescription>Monthly financial overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `$${value / 1000}k`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
                          />
                          <Legend />
                          <Bar dataKey="revenue" fill={COLORS[1]} name="Revenue" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" fill={COLORS[2]} name="Expenses" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue by Department</CardTitle>
                    <CardDescription>Department-wise revenue distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockDepartmentRevenue}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}k`}
                          >
                            {mockDepartmentRevenue.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Appointments by Doctor</CardTitle>
                  <CardDescription>Total vs completed appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockAppointmentsByDoctor} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="doctor" type="category" className="text-xs" width={100} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="appointments" fill={COLORS[0]} name="Total" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="completed" fill={COLORS[1]} name="Completed" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="mt-4 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lab Test Volume</CardTitle>
                    <CardDescription>Weekly test orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockLabTestVolume}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="week" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="tests"
                            stroke={COLORS[0]}
                            strokeWidth={2}
                            dot={{ fill: COLORS[0] }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bed Occupancy by Ward</CardTitle>
                    <CardDescription>Current occupancy status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockBedOccupancy}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="ward" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="total" fill={COLORS[0]} name="Total Beds" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="occupied" fill={COLORS[2]} name="Occupied" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}</span>
          <span
            className={`flex items-center text-sm ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp className={`mr-1 h-3 w-3 ${trend === "down" ? "rotate-180" : ""}`} />
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
