import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Dashboard
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/dashboard/activity", isAuthenticated, async (req, res) => {
    res.json([]);
  });

  // Users
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, async (req, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Patients
  app.get("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const patients = await storage.getPatients(search);
      res.json({ patients, total: patients.length });
    } catch (error) {
      console.error("Error getting patients:", error);
      res.status(500).json({ error: "Failed to get patients" });
    }
  });

  app.get("/api/patients/list", isAuthenticated, async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error getting patients list:", error);
      res.status(500).json({ error: "Failed to get patients list" });
    }
  });

  app.get("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error getting patient:", error);
      res.status(500).json({ error: "Failed to get patient" });
    }
  });

  app.post("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.createPatient(req.body);
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ error: "Failed to create patient" });
    }
  });

  app.patch("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      res.json(patient);
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ error: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePatient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ error: "Failed to delete patient" });
    }
  });

  // Doctors
  app.get("/api/doctors", isAuthenticated, async (req, res) => {
    try {
      const doctors = await storage.getDoctors();
      res.json(doctors);
    } catch (error) {
      console.error("Error getting doctors:", error);
      res.status(500).json({ error: "Failed to get doctors" });
    }
  });

  app.get("/api/doctors/list", isAuthenticated, async (req, res) => {
    try {
      const doctors = await storage.getDoctors();
      res.json(doctors);
    } catch (error) {
      console.error("Error getting doctors list:", error);
      res.status(500).json({ error: "Failed to get doctors list" });
    }
  });

  app.post("/api/doctors", isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, email, phone, ...doctorData } = req.body;
      const doctor = await storage.createDoctor(doctorData, { firstName, lastName, email, phone });
      res.status(201).json(doctor);
    } catch (error) {
      console.error("Error creating doctor:", error);
      res.status(500).json({ error: "Failed to create doctor" });
    }
  });

  app.patch("/api/doctors/:id", isAuthenticated, async (req, res) => {
    try {
      const doctor = await storage.updateDoctor(req.params.id, req.body);
      res.json(doctor);
    } catch (error) {
      console.error("Error updating doctor:", error);
      res.status(500).json({ error: "Failed to update doctor" });
    }
  });

  // Departments
  app.get("/api/departments", isAuthenticated, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error getting departments:", error);
      res.status(500).json({ error: "Failed to get departments" });
    }
  });

  app.post("/api/departments", isAuthenticated, async (req, res) => {
    try {
      const department = await storage.createDepartment(req.body);
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  app.patch("/api/departments/:id", isAuthenticated, async (req, res) => {
    try {
      const department = await storage.updateDepartment(req.params.id, req.body);
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ error: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDepartment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });

  // Appointments
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const appointments = await storage.getAppointments(status !== "all" ? status : undefined);
      res.json({ appointments, total: appointments.length });
    } catch (error) {
      console.error("Error getting appointments:", error);
      res.status(500).json({ error: "Failed to get appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const appointment = await storage.createAppointment(req.body);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.patch("/api/appointments/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const appointment = await storage.updateAppointment(req.params.id, { status });
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ error: "Failed to update appointment status" });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAppointment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Lab Tests
  app.get("/api/lab-tests", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const tests = await storage.getLabTests(status !== "all" ? status : undefined);
      res.json(tests);
    } catch (error) {
      console.error("Error getting lab tests:", error);
      res.status(500).json({ error: "Failed to get lab tests" });
    }
  });

  app.post("/api/lab-tests", isAuthenticated, async (req, res) => {
    try {
      const test = await storage.createLabTest(req.body);
      res.status(201).json(test);
    } catch (error) {
      console.error("Error creating lab test:", error);
      res.status(500).json({ error: "Failed to create lab test" });
    }
  });

  app.patch("/api/lab-tests/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const test = await storage.updateLabTestStatus(req.params.id, status);
      res.json(test);
    } catch (error) {
      console.error("Error updating lab test status:", error);
      res.status(500).json({ error: "Failed to update lab test status" });
    }
  });

  app.patch("/api/lab-tests/:id/results", isAuthenticated, async (req, res) => {
    try {
      const { results, status } = req.body;
      const test = await storage.updateLabTestResults(req.params.id, results, status);
      res.json(test);
    } catch (error) {
      console.error("Error updating lab test results:", error);
      res.status(500).json({ error: "Failed to update lab test results" });
    }
  });

  // Lab Test Catalog
  app.get("/api/lab-catalog", isAuthenticated, async (req, res) => {
    try {
      const catalog = await storage.getLabTestCatalog();
      res.json(catalog);
    } catch (error) {
      console.error("Error getting lab catalog:", error);
      res.status(500).json({ error: "Failed to get lab catalog" });
    }
  });

  app.post("/api/lab-catalog", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createLabTestCatalog(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating lab catalog item:", error);
      res.status(500).json({ error: "Failed to create lab catalog item" });
    }
  });

  // Wards
  app.get("/api/wards", isAuthenticated, async (req, res) => {
    try {
      const wards = await storage.getWards();
      res.json(wards);
    } catch (error) {
      console.error("Error getting wards:", error);
      res.status(500).json({ error: "Failed to get wards" });
    }
  });

  app.post("/api/wards", isAuthenticated, async (req, res) => {
    try {
      const ward = await storage.createWard(req.body);
      res.status(201).json(ward);
    } catch (error) {
      console.error("Error creating ward:", error);
      res.status(500).json({ error: "Failed to create ward" });
    }
  });

  // Beds
  app.get("/api/beds", isAuthenticated, async (req, res) => {
    try {
      const wardId = req.query.wardId as string | undefined;
      const beds = await storage.getBeds(wardId);
      res.json(beds);
    } catch (error) {
      console.error("Error getting beds:", error);
      res.status(500).json({ error: "Failed to get beds" });
    }
  });

  app.post("/api/beds", isAuthenticated, async (req, res) => {
    try {
      const bed = await storage.createBed(req.body);
      res.status(201).json(bed);
    } catch (error) {
      console.error("Error creating bed:", error);
      res.status(500).json({ error: "Failed to create bed" });
    }
  });

  // Admissions
  app.get("/api/admissions", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const admissions = await storage.getAdmissions(status);
      res.json(admissions);
    } catch (error) {
      console.error("Error getting admissions:", error);
      res.status(500).json({ error: "Failed to get admissions" });
    }
  });

  app.post("/api/admissions", isAuthenticated, async (req, res) => {
    try {
      const admission = await storage.createAdmission(req.body);
      res.status(201).json(admission);
    } catch (error) {
      console.error("Error creating admission:", error);
      res.status(500).json({ error: "Failed to create admission" });
    }
  });

  app.patch("/api/admissions/:id/discharge", isAuthenticated, async (req, res) => {
    try {
      const admission = await storage.dischargePatient(req.params.id);
      res.json(admission);
    } catch (error) {
      console.error("Error discharging patient:", error);
      res.status(500).json({ error: "Failed to discharge patient" });
    }
  });

  // Bills
  app.get("/api/bills", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const bills = await storage.getBills(status);
      res.json(bills);
    } catch (error) {
      console.error("Error getting bills:", error);
      res.status(500).json({ error: "Failed to get bills" });
    }
  });

  app.post("/api/bills", isAuthenticated, async (req, res) => {
    try {
      const { patientId, items } = req.body;
      const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
      const bill = await storage.createBill({
        patientId,
        items,
        subtotal: subtotal.toString(),
        total: subtotal.toString(),
      });
      res.status(201).json(bill);
    } catch (error) {
      console.error("Error creating bill:", error);
      res.status(500).json({ error: "Failed to create bill" });
    }
  });

  app.post("/api/bills/:id/payment", isAuthenticated, async (req, res) => {
    try {
      const { amount, paymentMethod } = req.body;
      const bill = await storage.recordPayment(req.params.id, amount, paymentMethod);
      res.json(bill);
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  return httpServer;
}
