import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  Bed,
  Calendar,
  ChevronUp,
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Stethoscope,
  TestTube,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@shared/schema";

const menuItems = {
  main: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "doctor", "nurse", "lab_staff", "receptionist", "patient"] },
  ],
  clinical: [
    { title: "Patients", url: "/patients", icon: Users, roles: ["admin", "doctor", "nurse", "receptionist"] },
    { title: "Appointments", url: "/appointments", icon: Calendar, roles: ["admin", "doctor", "nurse", "receptionist", "patient"] },
    { title: "Doctors", url: "/doctors", icon: Stethoscope, roles: ["admin", "receptionist", "patient"] },
  ],
  services: [
    { title: "Laboratory", url: "/lab", icon: TestTube, roles: ["admin", "doctor", "lab_staff", "nurse"] },
    { title: "Wards & Beds", url: "/wards", icon: Bed, roles: ["admin", "nurse", "receptionist"] },
    { title: "Billing", url: "/billing", icon: Receipt, roles: ["admin", "receptionist", "patient"] },
  ],
  admin: [
    { title: "Reports", url: "/reports", icon: ClipboardList, roles: ["admin"] },
    { title: "Administration", url: "/admin", icon: Settings, roles: ["admin"] },
  ],
};

function getRoleLabel(role: UserRole | undefined): string {
  const labels: Record<UserRole, string> = {
    admin: "Administrator",
    doctor: "Doctor",
    nurse: "Nurse",
    lab_staff: "Lab Staff",
    receptionist: "Receptionist",
    patient: "Patient",
  };
  return role ? labels[role] : "User";
}

function getRoleBadgeVariant(role: UserRole | undefined): "default" | "secondary" | "outline" {
  if (role === "admin") return "default";
  if (role === "doctor") return "secondary";
  return "outline";
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;

  const filterByRole = (items: typeof menuItems.main) => {
    return items.filter((item) => !userRole || item.roles.includes(userRole));
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold" data-testid="text-sidebar-title">Medicare</h2>
            <p className="text-xs text-muted-foreground">Hospital System</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(menuItems.main).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filterByRole(menuItems.clinical).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Clinical</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(menuItems.clinical).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filterByRole(menuItems.services).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Services</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(menuItems.services).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filterByRole(menuItems.admin).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(menuItems.admin).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-3 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "User"}
                </span>
                <Badge variant={getRoleBadgeVariant(userRole)} className="mt-0.5 text-xs">
                  {getRoleLabel(userRole)}
                </Badge>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-activity">
              <Activity className="mr-2 h-4 w-4" />
              Activity
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/api/logout" className="flex items-center" data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
