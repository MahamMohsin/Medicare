import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum values
export const USER_ROLES = ["admin", "doctor", "lab_staff", "nurse", "patient", "receptionist"] as const;
export type UserRole = typeof USER_ROLES[number];

// Users table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").$type<UserRole>().default("patient"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  doctorProfile: one(doctors, { fields: [users.id], references: [doctors.userId] }),
  patientProfile: one(patients, { fields: [users.id], references: [patients.userId] }),
}));

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  headDoctorId: varchar("head_doctor_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctors
export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  departmentId: varchar("department_id").references(() => departments.id),
  specialization: varchar("specialization").notNull(),
  qualifications: text("qualifications"),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }).default("500.00"),
  schedule: jsonb("schedule").$type<{[key: string]: {start: string, end: string}}>(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  department: one(departments, { fields: [doctors.departmentId], references: [departments.id] }),
  appointments: many(appointments),
}));

// Patients
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().unique(), // e.g., PAT-001
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender").$type<"male" | "female" | "other">(),
  bloodGroup: varchar("blood_group"),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  address: text("address"),
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  medicalHistory: jsonb("medical_history").$type<{allergies: string[], conditions: string[], medications: string[]}>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, { fields: [patients.userId], references: [users.id] }),
  appointments: many(appointments),
  admissions: many(admissions),
  bills: many(bills),
  labTests: many(labTests),
}));

// Appointment statuses
export const APPOINTMENT_STATUSES = ["scheduled", "completed", "cancelled", "no_show", "in_progress"] as const;
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  doctorId: varchar("doctor_id").references(() => doctors.id).notNull(),
  departmentId: varchar("department_id").references(() => departments.id),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: time("appointment_time").notNull(),
  status: varchar("status").$type<AppointmentStatus>().default("scheduled"),
  type: varchar("type").$type<"consultation" | "follow_up" | "emergency">().default("consultation"),
  notes: text("notes"),
  diagnosis: text("diagnosis"),
  prescription: jsonb("prescription").$type<{medications: {name: string, dosage: string, frequency: string, duration: string}[]}>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [appointments.doctorId], references: [doctors.id] }),
  department: one(departments, { fields: [appointments.departmentId], references: [departments.id] }),
}));

// Lab test catalog
export const labTestCatalog = pgTable("lab_test_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code").notNull().unique(),
  description: text("description"),
  normalRange: varchar("normal_range"),
  unit: varchar("unit"),
  sampleType: varchar("sample_type"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  turnaroundTime: varchar("turnaround_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lab test statuses
export const LAB_TEST_STATUSES = ["pending", "sample_collected", "in_progress", "completed", "cancelled"] as const;
export type LabTestStatus = typeof LAB_TEST_STATUSES[number];

// Lab tests (orders)
export const labTests = pgTable("lab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  doctorId: varchar("doctor_id").references(() => doctors.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  testCatalogId: varchar("test_catalog_id").references(() => labTestCatalog.id).notNull(),
  status: varchar("status").$type<LabTestStatus>().default("pending"),
  results: jsonb("results").$type<{value: string, unit: string, normalRange: string, interpretation: string}>(),
  collectedAt: timestamp("collected_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const labTestsRelations = relations(labTests, ({ one }) => ({
  patient: one(patients, { fields: [labTests.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [labTests.doctorId], references: [doctors.id] }),
  testCatalog: one(labTestCatalog, { fields: [labTests.testCatalogId], references: [labTestCatalog.id] }),
  appointment: one(appointments, { fields: [labTests.appointmentId], references: [appointments.id] }),
}));

// Ward types
export const WARD_TYPES = ["general", "icu", "private", "semi_private"] as const;
export type WardType = typeof WARD_TYPES[number];

// Wards
export const wards = pgTable("wards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").$type<WardType>().notNull(),
  floor: integer("floor"),
  capacity: integer("capacity").notNull(),
  chargePerDay: decimal("charge_per_day", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wardsRelations = relations(wards, ({ many }) => ({
  beds: many(beds),
}));

// Bed statuses
export const BED_STATUSES = ["available", "occupied", "maintenance", "reserved"] as const;
export type BedStatus = typeof BED_STATUSES[number];

// Beds
export const beds = pgTable("beds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wardId: varchar("ward_id").references(() => wards.id).notNull(),
  bedNumber: varchar("bed_number").notNull(),
  status: varchar("status").$type<BedStatus>().default("available"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bedsRelations = relations(beds, ({ one, many }) => ({
  ward: one(wards, { fields: [beds.wardId], references: [wards.id] }),
  admissions: many(admissions),
}));

// Admissions
export const admissions = pgTable("admissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  bedId: varchar("bed_id").references(() => beds.id).notNull(),
  doctorId: varchar("doctor_id").references(() => doctors.id),
  admissionDate: timestamp("admission_date").defaultNow(),
  dischargeDate: timestamp("discharge_date"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  status: varchar("status").$type<"admitted" | "discharged">().default("admitted"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const admissionsRelations = relations(admissions, ({ one }) => ({
  patient: one(patients, { fields: [admissions.patientId], references: [patients.id] }),
  bed: one(beds, { fields: [admissions.bedId], references: [beds.id] }),
  doctor: one(doctors, { fields: [admissions.doctorId], references: [doctors.id] }),
}));

// Payment statuses
export const PAYMENT_STATUSES = ["paid", "partial", "pending", "cancelled"] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

// Payment methods
export const PAYMENT_METHODS = ["cash", "card", "insurance", "upi"] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Bills
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billNumber: varchar("bill_number").notNull().unique(),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  admissionId: varchar("admission_id").references(() => admissions.id),
  items: jsonb("items").$type<{description: string, quantity: number, rate: number, amount: number}[]>().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  paymentStatus: varchar("payment_status").$type<PaymentStatus>().default("pending"),
  paymentMethod: varchar("payment_method").$type<PaymentMethod>(),
  insuranceClaim: varchar("insurance_claim"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const billsRelations = relations(bills, ({ one }) => ({
  patient: one(patients, { fields: [bills.patientId], references: [patients.id] }),
  appointment: one(appointments, { fields: [bills.appointmentId], references: [appointments.id] }),
  admission: one(admissions, { fields: [bills.admissionId], references: [admissions.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLabTestCatalogSchema = createInsertSchema(labTestCatalog).omit({ id: true, createdAt: true });
export const insertLabTestSchema = createInsertSchema(labTests).omit({ id: true, createdAt: true });
export const insertWardSchema = createInsertSchema(wards).omit({ id: true, createdAt: true });
export const insertBedSchema = createInsertSchema(beds).omit({ id: true, createdAt: true });
export const insertAdmissionSchema = createInsertSchema(admissions).omit({ id: true, createdAt: true });
export const insertBillSchema = createInsertSchema(bills).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertLabTestCatalog = z.infer<typeof insertLabTestCatalogSchema>;
export type LabTestCatalog = typeof labTestCatalog.$inferSelect;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type LabTest = typeof labTests.$inferSelect;
export type InsertWard = z.infer<typeof insertWardSchema>;
export type Ward = typeof wards.$inferSelect;
export type InsertBed = z.infer<typeof insertBedSchema>;
export type Bed = typeof beds.$inferSelect;
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type Admission = typeof admissions.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;
