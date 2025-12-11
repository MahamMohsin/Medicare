import { db } from "./db";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import {
  users,
  patients,
  doctors,
  departments,
  appointments,
  labTests,
  labTestCatalog,
  wards,
  beds,
  admissions,
  bills,
  type User,
  type UpsertUser,
  type Patient,
  type InsertPatient,
  type Doctor,
  type InsertDoctor,
  type Department,
  type InsertDepartment,
  type Appointment,
  type InsertAppointment,
  type LabTest,
  type InsertLabTest,
  type LabTestCatalog,
  type InsertLabTestCatalog,
  type Ward,
  type InsertWard,
  type Bed,
  type InsertBed,
  type Admission,
  type InsertAdmission,
  type Bill,
  type InsertBill,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  // Patients
  getPatients(search?: string): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<void>;
  
  // Doctors
  getDoctors(): Promise<(Doctor & { user?: User; department?: Department })[]>;
  getDoctor(id: string): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor, userData: Partial<UpsertUser>): Promise<Doctor>;
  updateDoctor(id: string, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined>;
  
  // Departments
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<void>;
  
  // Appointments
  getAppointments(status?: string): Promise<(Appointment & { patient?: Patient; doctor?: Doctor & { user?: User } })[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<void>;
  
  // Lab Tests
  getLabTests(status?: string): Promise<(LabTest & { patient?: Patient; doctor?: Doctor & { user?: User }; testCatalog?: LabTestCatalog })[]>;
  createLabTest(labTest: InsertLabTest): Promise<LabTest>;
  updateLabTestStatus(id: string, status: string): Promise<LabTest | undefined>;
  updateLabTestResults(id: string, results: any, status: string): Promise<LabTest | undefined>;
  getLabTestCatalog(): Promise<LabTestCatalog[]>;
  createLabTestCatalog(item: InsertLabTestCatalog): Promise<LabTestCatalog>;
  
  // Wards & Beds
  getWards(): Promise<Ward[]>;
  createWard(ward: InsertWard): Promise<Ward>;
  getBeds(wardId?: string): Promise<(Bed & { ward?: Ward; admission?: Admission & { patient?: Patient } })[]>;
  createBed(bed: InsertBed): Promise<Bed>;
  updateBedStatus(id: string, status: string): Promise<Bed | undefined>;
  
  // Admissions
  getAdmissions(status?: string): Promise<(Admission & { patient?: Patient; bed?: Bed & { ward?: Ward }; doctor?: Doctor & { user?: User } })[]>;
  createAdmission(admission: InsertAdmission): Promise<Admission>;
  dischargePatient(id: string): Promise<Admission | undefined>;
  
  // Bills
  getBills(status?: string): Promise<(Bill & { patient?: Patient })[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  recordPayment(id: string, amount: number, method: string): Promise<Bill | undefined>;
  
  // Dashboard
  getDashboardStats(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    availableBeds: number;
    monthlyRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Patients
  async getPatients(search?: string): Promise<Patient[]> {
    if (search) {
      return db
        .select()
        .from(patients)
        .where(
          or(
            ilike(patients.firstName, `%${search}%`),
            ilike(patients.lastName, `%${search}%`),
            ilike(patients.patientId, `%${search}%`),
            ilike(patients.phone, `%${search}%`)
          )
        )
        .orderBy(desc(patients.createdAt));
    }
    return db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const count = await db.select({ count: sql<number>`count(*)` }).from(patients);
    const patientId = `PAT-${String(Number(count[0].count) + 1).padStart(5, "0")}`;
    
    const [newPatient] = await db
      .insert(patients)
      .values({ ...patient, patientId })
      .returning();
    return newPatient;
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [updated] = await db
      .update(patients)
      .set({ ...patient, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePatient(id: string): Promise<void> {
    await db.delete(patients).where(eq(patients.id, id));
  }

  // Doctors
  async getDoctors(): Promise<(Doctor & { user?: User; department?: Department })[]> {
    const doctorList = await db.select().from(doctors).orderBy(desc(doctors.createdAt));
    const result = [];
    
    for (const doctor of doctorList) {
      let user: User | undefined;
      let department: Department | undefined;
      
      if (doctor.userId) {
        [user] = await db.select().from(users).where(eq(users.id, doctor.userId));
      }
      if (doctor.departmentId) {
        [department] = await db.select().from(departments).where(eq(departments.id, doctor.departmentId));
      }
      
      result.push({ ...doctor, user, department });
    }
    
    return result;
  }

  async getDoctor(id: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor || undefined;
  }

  async createDoctor(doctor: InsertDoctor, userData: Partial<UpsertUser>): Promise<Doctor> {
    const [user] = await db
      .insert(users)
      .values({ ...userData, role: "doctor" } as any)
      .returning();
    
    const [newDoctor] = await db
      .insert(doctors)
      .values({ ...doctor, userId: user.id })
      .returning();
    return newDoctor;
  }

  async updateDoctor(id: string, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const [updated] = await db
      .update(doctors)
      .set(doctor)
      .where(eq(doctors.id, id))
      .returning();
    return updated || undefined;
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return db.select().from(departments).orderBy(departments.name);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDept] = await db.insert(departments).values(department).returning();
    return newDept;
  }

  async updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updated] = await db
      .update(departments)
      .set(department)
      .where(eq(departments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDepartment(id: string): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // Appointments
  async getAppointments(status?: string): Promise<(Appointment & { patient?: Patient; doctor?: Doctor & { user?: User } })[]> {
    let query = db.select().from(appointments).orderBy(desc(appointments.appointmentDate));
    
    const appointmentList = status
      ? await db.select().from(appointments).where(eq(appointments.status, status as any)).orderBy(desc(appointments.appointmentDate))
      : await db.select().from(appointments).orderBy(desc(appointments.appointmentDate));
    
    const result = [];
    for (const apt of appointmentList) {
      const [patient] = await db.select().from(patients).where(eq(patients.id, apt.patientId));
      const [doctor] = await db.select().from(doctors).where(eq(doctors.id, apt.doctorId));
      let doctorUser: User | undefined;
      if (doctor?.userId) {
        [doctorUser] = await db.select().from(users).where(eq(users.id, doctor.userId));
      }
      result.push({ ...apt, patient, doctor: doctor ? { ...doctor, user: doctorUser } : undefined });
    }
    
    return result;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newApt] = await db.insert(appointments).values(appointment).returning();
    return newApt;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // Lab Tests
  async getLabTests(status?: string): Promise<(LabTest & { patient?: Patient; doctor?: Doctor & { user?: User }; testCatalog?: LabTestCatalog })[]> {
    const testList = status
      ? await db.select().from(labTests).where(eq(labTests.status, status as any)).orderBy(desc(labTests.createdAt))
      : await db.select().from(labTests).orderBy(desc(labTests.createdAt));
    
    const result = [];
    for (const test of testList) {
      const [patient] = await db.select().from(patients).where(eq(patients.id, test.patientId));
      const [testCatalogItem] = await db.select().from(labTestCatalog).where(eq(labTestCatalog.id, test.testCatalogId));
      let doctor: Doctor | undefined;
      let doctorUser: User | undefined;
      if (test.doctorId) {
        [doctor] = await db.select().from(doctors).where(eq(doctors.id, test.doctorId));
        if (doctor?.userId) {
          [doctorUser] = await db.select().from(users).where(eq(users.id, doctor.userId));
        }
      }
      result.push({
        ...test,
        patient,
        testCatalog: testCatalogItem,
        doctor: doctor ? { ...doctor, user: doctorUser } : undefined,
      });
    }
    
    return result;
  }

  async createLabTest(labTest: InsertLabTest): Promise<LabTest> {
    const [newTest] = await db.insert(labTests).values(labTest).returning();
    return newTest;
  }

  async updateLabTestStatus(id: string, status: string): Promise<LabTest | undefined> {
    const updates: any = { status };
    if (status === "sample_collected") {
      updates.collectedAt = new Date();
    }
    const [updated] = await db.update(labTests).set(updates).where(eq(labTests.id, id)).returning();
    return updated || undefined;
  }

  async updateLabTestResults(id: string, results: any, status: string): Promise<LabTest | undefined> {
    const [updated] = await db
      .update(labTests)
      .set({ results, status: status as any, completedAt: new Date() })
      .where(eq(labTests.id, id))
      .returning();
    return updated || undefined;
  }

  async getLabTestCatalog(): Promise<LabTestCatalog[]> {
    return db.select().from(labTestCatalog).orderBy(labTestCatalog.name);
  }

  async createLabTestCatalog(item: InsertLabTestCatalog): Promise<LabTestCatalog> {
    const [newItem] = await db.insert(labTestCatalog).values(item).returning();
    return newItem;
  }

  // Wards & Beds
  async getWards(): Promise<Ward[]> {
    return db.select().from(wards).orderBy(wards.name);
  }

  async createWard(ward: InsertWard): Promise<Ward> {
    const [newWard] = await db.insert(wards).values(ward).returning();
    return newWard;
  }

  async getBeds(wardId?: string): Promise<(Bed & { ward?: Ward; admission?: Admission & { patient?: Patient } })[]> {
    const bedList = wardId
      ? await db.select().from(beds).where(eq(beds.wardId, wardId)).orderBy(beds.bedNumber)
      : await db.select().from(beds).orderBy(beds.bedNumber);
    
    const result = [];
    for (const bed of bedList) {
      const [ward] = await db.select().from(wards).where(eq(wards.id, bed.wardId));
      let admission: (Admission & { patient?: Patient }) | undefined;
      
      if (bed.status === "occupied") {
        const [activeAdmission] = await db
          .select()
          .from(admissions)
          .where(and(eq(admissions.bedId, bed.id), eq(admissions.status, "admitted")));
        
        if (activeAdmission) {
          const [patient] = await db.select().from(patients).where(eq(patients.id, activeAdmission.patientId));
          admission = { ...activeAdmission, patient };
        }
      }
      
      result.push({ ...bed, ward, admission });
    }
    
    return result;
  }

  async createBed(bed: InsertBed): Promise<Bed> {
    const [newBed] = await db.insert(beds).values(bed).returning();
    return newBed;
  }

  async updateBedStatus(id: string, status: string): Promise<Bed | undefined> {
    const [updated] = await db.update(beds).set({ status: status as any }).where(eq(beds.id, id)).returning();
    return updated || undefined;
  }

  // Admissions
  async getAdmissions(status?: string): Promise<(Admission & { patient?: Patient; bed?: Bed & { ward?: Ward }; doctor?: Doctor & { user?: User } })[]> {
    const admissionList = status
      ? await db.select().from(admissions).where(eq(admissions.status, status as any)).orderBy(desc(admissions.admissionDate))
      : await db.select().from(admissions).orderBy(desc(admissions.admissionDate));
    
    const result = [];
    for (const admission of admissionList) {
      const [patient] = await db.select().from(patients).where(eq(patients.id, admission.patientId));
      const [bed] = await db.select().from(beds).where(eq(beds.id, admission.bedId));
      let ward: Ward | undefined;
      if (bed) {
        [ward] = await db.select().from(wards).where(eq(wards.id, bed.wardId));
      }
      let doctor: Doctor | undefined;
      let doctorUser: User | undefined;
      if (admission.doctorId) {
        [doctor] = await db.select().from(doctors).where(eq(doctors.id, admission.doctorId));
        if (doctor?.userId) {
          [doctorUser] = await db.select().from(users).where(eq(users.id, doctor.userId));
        }
      }
      result.push({
        ...admission,
        patient,
        bed: bed ? { ...bed, ward } : undefined,
        doctor: doctor ? { ...doctor, user: doctorUser } : undefined,
      });
    }
    
    return result;
  }

  async createAdmission(admission: InsertAdmission): Promise<Admission> {
    const [newAdmission] = await db.insert(admissions).values(admission).returning();
    await db.update(beds).set({ status: "occupied" }).where(eq(beds.id, admission.bedId));
    return newAdmission;
  }

  async dischargePatient(id: string): Promise<Admission | undefined> {
    const [admission] = await db
      .update(admissions)
      .set({ status: "discharged", dischargeDate: new Date() })
      .where(eq(admissions.id, id))
      .returning();
    
    if (admission) {
      await db.update(beds).set({ status: "available" }).where(eq(beds.id, admission.bedId));
    }
    
    return admission || undefined;
  }

  // Bills
  async getBills(status?: string): Promise<(Bill & { patient?: Patient })[]> {
    const billList = status
      ? await db.select().from(bills).where(eq(bills.paymentStatus, status as any)).orderBy(desc(bills.createdAt))
      : await db.select().from(bills).orderBy(desc(bills.createdAt));
    
    const result = [];
    for (const bill of billList) {
      const [patient] = await db.select().from(patients).where(eq(patients.id, bill.patientId));
      result.push({ ...bill, patient });
    }
    
    return result;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const count = await db.select({ count: sql<number>`count(*)` }).from(bills);
    const billNumber = `INV-${String(Number(count[0].count) + 1).padStart(6, "0")}`;
    
    const [newBill] = await db.insert(bills).values({ ...bill, billNumber }).returning();
    return newBill;
  }

  async recordPayment(id: string, amount: number, method: string): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, id));
    if (!bill) return undefined;
    
    const newPaidAmount = parseFloat(bill.paidAmount || "0") + amount;
    const total = parseFloat(bill.total);
    const newStatus = newPaidAmount >= total ? "paid" : "partial";
    
    const [updated] = await db
      .update(bills)
      .set({
        paidAmount: newPaidAmount.toString(),
        paymentStatus: newStatus as any,
        paymentMethod: method as any,
        updatedAt: new Date(),
      })
      .where(eq(bills.id, id))
      .returning();
    
    return updated || undefined;
  }

  // Dashboard
  async getDashboardStats(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    availableBeds: number;
    monthlyRevenue: number;
  }> {
    const today = new Date().toISOString().split("T")[0];
    
    const [patientCount] = await db.select({ count: sql<number>`count(*)` }).from(patients);
    const [todayAptCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.appointmentDate, today));
    const [availableBedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(beds)
      .where(eq(beds.status, "available"));
    const [revenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(paid_amount AS DECIMAL)), 0)` })
      .from(bills);
    
    return {
      totalPatients: Number(patientCount.count) || 0,
      todayAppointments: Number(todayAptCount.count) || 0,
      availableBeds: Number(availableBedCount.count) || 0,
      monthlyRevenue: Number(revenue.total) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
