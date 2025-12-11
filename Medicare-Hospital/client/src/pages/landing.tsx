import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Activity, 
  Calendar, 
  ClipboardList, 
  Heart, 
  Shield, 
  Stethoscope,
  Users,
  Building2,
  TestTube,
  Bed,
  Receipt
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold" data-testid="text-hospital-name">Medicare Hospital</h1>
              <p className="text-xs text-muted-foreground">Hospital Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm">
                <Activity className="h-4 w-4 text-primary" />
                <span>Comprehensive Healthcare Management</span>
              </div>
              <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl" data-testid="text-hero-title">
                Modern Hospital Management for Better Patient Care
              </h2>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                Streamline your hospital operations with our integrated platform. 
                From patient registration to billing, manage everything in one place.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">Get Started</a>
                </Button>
                <Button size="lg" variant="outline" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-card py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h3 className="mb-3 text-2xl font-semibold md:text-3xl">Complete Hospital Management</h3>
              <p className="text-muted-foreground">Everything you need to run your healthcare facility efficiently</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Patient Management"
                description="Complete patient registration with demographics, medical history tracking, and visit records."
              />
              <FeatureCard
                icon={<Calendar className="h-6 w-6" />}
                title="Appointment Scheduling"
                description="Book appointments with real-time availability, calendar views, and status management."
              />
              <FeatureCard
                icon={<Stethoscope className="h-6 w-6" />}
                title="Doctor Portal"
                description="Consultation interface, prescription management, and patient follow-up tracking."
              />
              <FeatureCard
                icon={<TestTube className="h-6 w-6" />}
                title="Laboratory Management"
                description="Test catalog, sample tracking, and automated report generation."
              />
              <FeatureCard
                icon={<Bed className="h-6 w-6" />}
                title="Ward & Bed Management"
                description="Real-time bed availability, patient admissions, and ward transfers."
              />
              <FeatureCard
                icon={<Receipt className="h-6 w-6" />}
                title="Billing System"
                description="Automated invoicing, payment tracking, and comprehensive financial reports."
              />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h3 className="mb-3 text-2xl font-semibold md:text-3xl">Role-Based Access</h3>
              <p className="text-muted-foreground">Customized dashboards for every role in your hospital</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <RoleCard role="Admin" description="Full system access and configuration" icon={<Shield />} />
              <RoleCard role="Doctor" description="Patient consultations and prescriptions" icon={<Stethoscope />} />
              <RoleCard role="Nurse" description="Patient care and ward management" icon={<Heart />} />
              <RoleCard role="Lab Staff" description="Test processing and reports" icon={<TestTube />} />
              <RoleCard role="Receptionist" description="Appointments and registrations" icon={<ClipboardList />} />
              <RoleCard role="Patient" description="View records and appointments" icon={<Users />} />
            </div>
          </div>
        </section>

        <section className="border-t bg-card py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <StatCard value="10,000+" label="Patients Served" />
              <StatCard value="50+" label="Healthcare Professionals" />
              <StatCard value="99.9%" label="System Uptime" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-medium">Medicare Hospital</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Hospital Management System - Providing quality healthcare services
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function RoleCard({ role, description, icon }: { role: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="font-medium">{role}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-muted-foreground">{label}</p>
    </div>
  );
}
