import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import {
  users,
  departments,
  doctors,
  wards,
  beds,
  labTestCatalog,
  patients,
} from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create demo user for development
  const [demoUser] = await db
    .insert(users)
    .values({
      id: "demo-user",
      email: "admin@medicare.hospital",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    })
    .onConflictDoNothing()
    .returning();
  console.log("Demo user created:", demoUser?.email || "already exists");

  // Create departments
  const deptData = [
    { name: "General Medicine", description: "Primary care and internal medicine" },
    { name: "Cardiology", description: "Heart and cardiovascular system" },
    { name: "Orthopedics", description: "Bone, joint, and muscle disorders" },
    { name: "Neurology", description: "Brain and nervous system" },
    { name: "Pediatrics", description: "Children's health care" },
    { name: "Dermatology", description: "Skin conditions and diseases" },
    { name: "Ophthalmology", description: "Eye care and vision" },
    { name: "ENT", description: "Ear, nose, and throat" },
    { name: "Radiology", description: "Medical imaging" },
    { name: "Pathology", description: "Laboratory diagnostics" },
  ];

  for (const dept of deptData) {
    await db.insert(departments).values(dept).onConflictDoNothing();
  }
  console.log("Departments seeded");

  // Create wards
  const wardData = [
    { name: "General Ward A", type: "general" as const, floor: 1, capacity: 20, chargePerDay: "500" },
    { name: "General Ward B", type: "general" as const, floor: 1, capacity: 20, chargePerDay: "500" },
    { name: "ICU", type: "icu" as const, floor: 2, capacity: 10, chargePerDay: "2500" },
    { name: "Private Room - Premium", type: "private" as const, floor: 3, capacity: 10, chargePerDay: "1500" },
    { name: "Semi-Private Ward", type: "semi_private" as const, floor: 2, capacity: 15, chargePerDay: "800" },
  ];

  const createdWards = [];
  for (const ward of wardData) {
    const [created] = await db.insert(wards).values(ward).onConflictDoNothing().returning();
    if (created) createdWards.push(created);
  }
  console.log("Wards seeded");

  // Create beds for each ward
  const existingWards = await db.select().from(wards);
  for (const ward of existingWards) {
    const existingBeds = await db.select().from(beds);
    if (existingBeds.length > 0) continue;

    for (let i = 1; i <= Math.min(ward.capacity, 10); i++) {
      await db.insert(beds).values({
        wardId: ward.id,
        bedNumber: `${ward.name.split(" ")[0]}-${String(i).padStart(2, "0")}`,
        status: Math.random() > 0.7 ? "occupied" : "available",
      });
    }
  }
  console.log("Beds seeded");

  // Create lab test catalog
  const labTests = [
    { name: "Complete Blood Count", code: "CBC", price: "150", sampleType: "Blood", turnaroundTime: "4 hours", normalRange: "Varies", unit: "cells/mcL" },
    { name: "Blood Glucose Fasting", code: "BGF", price: "80", sampleType: "Blood", turnaroundTime: "2 hours", normalRange: "70-100 mg/dL", unit: "mg/dL" },
    { name: "Lipid Profile", code: "LP", price: "350", sampleType: "Blood", turnaroundTime: "6 hours", normalRange: "<200 mg/dL total", unit: "mg/dL" },
    { name: "Liver Function Test", code: "LFT", price: "450", sampleType: "Blood", turnaroundTime: "8 hours", normalRange: "Varies", unit: "U/L" },
    { name: "Kidney Function Test", code: "KFT", price: "400", sampleType: "Blood", turnaroundTime: "6 hours", normalRange: "0.7-1.3 mg/dL Creatinine", unit: "mg/dL" },
    { name: "Thyroid Profile", code: "THY", price: "550", sampleType: "Blood", turnaroundTime: "12 hours", normalRange: "0.4-4.0 mIU/L TSH", unit: "mIU/L" },
    { name: "Urinalysis", code: "UA", price: "100", sampleType: "Urine", turnaroundTime: "2 hours", normalRange: "Varies", unit: "varies" },
    { name: "Chest X-Ray", code: "CXR", price: "300", sampleType: "Imaging", turnaroundTime: "1 hour", normalRange: "N/A", unit: "N/A" },
    { name: "ECG", code: "ECG", price: "200", sampleType: "Electrical", turnaroundTime: "30 mins", normalRange: "60-100 bpm", unit: "bpm" },
    { name: "COVID-19 RT-PCR", code: "COVID", price: "500", sampleType: "Nasal Swab", turnaroundTime: "24 hours", normalRange: "Negative", unit: "N/A" },
  ];

  for (const test of labTests) {
    await db.insert(labTestCatalog).values(test).onConflictDoNothing();
  }
  console.log("Lab test catalog seeded");

  // Create sample patients
  const samplePatients = [
    { patientId: "PAT-00001", firstName: "John", lastName: "Smith", phone: "+1 555-0101", gender: "male" as const, bloodGroup: "A+", email: "john.smith@email.com" },
    { patientId: "PAT-00002", firstName: "Sarah", lastName: "Johnson", phone: "+1 555-0102", gender: "female" as const, bloodGroup: "B+", email: "sarah.j@email.com" },
    { patientId: "PAT-00003", firstName: "Michael", lastName: "Williams", phone: "+1 555-0103", gender: "male" as const, bloodGroup: "O+", email: "m.williams@email.com" },
    { patientId: "PAT-00004", firstName: "Emily", lastName: "Brown", phone: "+1 555-0104", gender: "female" as const, bloodGroup: "AB-", email: "emily.b@email.com" },
    { patientId: "PAT-00005", firstName: "David", lastName: "Davis", phone: "+1 555-0105", gender: "male" as const, bloodGroup: "O-", email: "david.d@email.com" },
  ];

  for (const patient of samplePatients) {
    await db.insert(patients).values(patient).onConflictDoNothing();
  }
  console.log("Sample patients seeded");

  // Create sample doctors
  const allDepts = await db.select().from(departments);
  const sampleDoctors = [
    { firstName: "Robert", lastName: "Chen", email: "dr.chen@medicare.hospital", specialization: "Cardiology" },
    { firstName: "Amanda", lastName: "Wilson", email: "dr.wilson@medicare.hospital", specialization: "Neurology" },
    { firstName: "James", lastName: "Taylor", email: "dr.taylor@medicare.hospital", specialization: "Orthopedics" },
    { firstName: "Lisa", lastName: "Anderson", email: "dr.anderson@medicare.hospital", specialization: "Pediatrics" },
    { firstName: "Mark", lastName: "Thompson", email: "dr.thompson@medicare.hospital", specialization: "General Medicine" },
  ];

  for (const doc of sampleDoctors) {
    const [user] = await db
      .insert(users)
      .values({
        email: doc.email,
        firstName: doc.firstName,
        lastName: doc.lastName,
        role: "doctor",
      })
      .onConflictDoNothing()
      .returning();

    if (user) {
      const dept = allDepts.find((d) => d.name === doc.specialization || d.name.includes(doc.specialization.split(" ")[0]));
      await db.insert(doctors).values({
        userId: user.id,
        specialization: doc.specialization,
        departmentId: dept?.id,
        consultationFee: "500",
        isAvailable: true,
      });
    }
  }
  console.log("Sample doctors seeded");

  console.log("Database seeding completed!");
}

seed()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    pool.end();
    process.exit(1);
  });
