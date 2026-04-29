// ============================================================
// Comprehensive Seed Script — Master Data
// Integrates all modules: Users, Students, Instructors, Aircraft, 
// Maintenance, Courses, Pricing, Invoices, Slots, Weather, Docs
// ============================================================

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master Data for all FSMS Modules...\n');

  // --- 0. Clean DB (Optional but recommended for fresh seed) ---
  console.log('Cleaning existing data...');
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.flyingSlot.deleteMany({});
  await prisma.slotRequest.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.weatherCheck.deleteMany({});
  await prisma.documentVersion.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.documentCategory.deleteMany({});
  await prisma.pricingRate.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.maintenanceActivity.deleteMany({});
  await prisma.squawk.deleteMany({});
  await prisma.aircraft.deleteMany({});
  await prisma.studentAccount.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.studentMedical.deleteMany({});
  await prisma.studentLicense.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.instructorDocument.deleteMany({});
  await prisma.instructorChangeLog.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.user.deleteMany({});
  
  // --- 1. Users (Admins & Staff) ---
  const admin = await prisma.user.create({
    data: { email: 'admin@fsms.in', password: 'password123', firstName: 'Super', lastName: 'Admin', role: 'ADMIN' }
  });
  const ame1 = await prisma.user.create({
    data: { email: 'ame.mehta@fsms.in', password: 'password123', firstName: 'Rahul', lastName: 'Mehta', role: 'STAFF' }
  });
  const ame2 = await prisma.user.create({
    data: { email: 'ame.nair@fsms.in', password: 'password123', firstName: 'Priya', lastName: 'Nair', role: 'STAFF' }
  });
  console.log('  [1/10] Admin and Staff users seeded');

  // --- 2. Instructors & Students ---
  const instrUsers = [
    { email: 'capt.arora@fsms.in', firstName: 'Capt', lastName: 'Arora', role: 'INSTRUCTOR' },
    { email: 'capt.das@fsms.in', firstName: 'Capt', lastName: 'Das', role: 'INSTRUCTOR' },
    { email: 'capt.kumar@fsms.in', firstName: 'Capt', lastName: 'Kumar', role: 'INSTRUCTOR' }
  ];
  const instructors = [];
  for (let i=0; i<instrUsers.length; i++) {
    const user = await prisma.user.create({ data: { ...instrUsers[i], password: 'password123' }});
    const instr = await prisma.instructor.create({
      data: {
        userId: user.id, employeeId: `INS-00${i+1}`, designation: 'FLIGHT_INSTRUCTOR', department: 'FLYING', 
        employmentType: 'FULL_TIME', dateOfJoining: new Date('2023-01-15'), totalHours: 1500 + (i*500)
      }
    });
    instructors.push({ user, instr });
  }

  const stuData = [
    { studentId: 'STU-001', firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@fsms.in', dob: new Date('2000-03-15'), gender: 'Male', nationality: 'Indian', phone: '9876543210', batch: 'Batch-A' },
    { studentId: 'STU-002', firstName: 'Sneha', lastName: 'Reddy', email: 'sneha@fsms.in', dob: new Date('2002-05-30'), gender: 'Female', nationality: 'Indian', phone: '9876543213', batch: 'Batch-A' },
    { studentId: 'STU-003', firstName: 'Vikram', lastName: 'Singh', email: 'vikram@fsms.in', dob: new Date('2000-09-12'), gender: 'Male', nationality: 'Indian', phone: '9876543214', batch: 'Batch-B' }
  ];
  const students = [];
  for (const s of stuData) {
    const user = await prisma.user.create({ data: { email: s.email, password: 'password123', firstName: s.firstName, lastName: s.lastName, role: 'STUDENT' }});
    const stu = await prisma.student.create({ data: s });
    students.push({ user, stu });
  }
  console.log('  [2/10] Instructors and Students seeded');

  // --- 3. Aircraft & Maintenance ---
  const aircraftData = [
    { id: 'VT-BXA', tailNumber: 'VT-BXA', name: 'Cessna 172 Skyhawk', model: '172S', status: 'Active', maintenanceStatus: 'AOG', assignedAmeId: ame1.id, totalFlightHours: 4218 },
    { id: 'VT-MKJ', tailNumber: 'VT-MKJ', name: 'Cessna 172 Skyhawk', model: '172S', status: 'Active', maintenanceStatus: 'AIRWORTHY', assignedAmeId: ame2.id, totalFlightHours: 3901 },
    { id: 'VT-PRA', tailNumber: 'VT-PRA', name: 'Piper PA-28', model: 'PA-28', status: 'Active', maintenanceStatus: 'IN_MAINTENANCE', assignedAmeId: ame1.id, totalFlightHours: 2540 }
  ];
  for (const ac of aircraftData) {
    await prisma.aircraft.create({ data: ac });
  }

  await prisma.squawk.createMany({
    data: [
      { aircraftId: 'VT-BXA', issue: 'Left brake feels soft on rollout', severity: 'Critical', status: 'Open', reportedById: instructors[0].user.id },
      { aircraftId: 'VT-PRA', issue: 'Unusual vibration above 2,500 RPM', severity: 'Major', status: 'In Progress', reportedById: instructors[1].user.id }
    ]
  });

  await prisma.maintenanceActivity.createMany({
    data: [
      { description: 'Resolved left brake issue on VT-BXA.', type: 'Complete', userId: ame1.id },
      { description: 'Routine 50-hour inspection started for VT-PRA.', type: 'Alert', userId: ame2.id }
    ]
  });
  console.log('  [3/10] Aircraft & Maintenance seeded');

  // --- 4. Courses & Pricing Rates ---
  const courses = [
    { code: 'PPL-01', name: 'Private Pilot License', level: 'PPL', durationHours: 45, price: 400000 },
    { code: 'CPL-01', name: 'Commercial Pilot License', level: 'CPL', durationHours: 200, price: 2500000 },
    { code: 'IFR-01', name: 'Instrument Rating', level: 'IFR', durationHours: 50, price: 500000 }
  ];
  const createdCourses = [];
  for (const c of courses) {
    createdCourses.push(await prisma.course.create({ data: { ...c, createdBy: admin.id }}));
  }

  // Generic Rates
  await prisma.pricingRate.createMany({
    data: [
      { name: 'Cessna 172 Rental', category: 'AIRCRAFT_RENTAL', rateType: 'HOURLY', amount: 8000, createdBy: admin.id },
      { name: 'Piper PA-28 Rental', category: 'AIRCRAFT_RENTAL', rateType: 'HOURLY', amount: 9500, createdBy: admin.id },
      { name: 'Flight Instructor Fee', category: 'INSTRUCTOR_FEE', rateType: 'HOURLY', amount: 3000, createdBy: admin.id },
      { name: 'DGCA Exam Fee', category: 'EXAM_FEE', rateType: 'FLAT', amount: 5000, createdBy: admin.id }
    ]
  });
  // Linked Rates
  for (const c of createdCourses) {
    await prisma.pricingRate.create({
      data: { name: `${c.code} Base Fee`, category: 'COURSE_FEE', rateType: 'FLAT', amount: c.price, courseId: c.id, createdBy: admin.id }
    });
  }
  console.log('  [4/10] Courses & Pricing seeded');

  // --- 5. Flying Slots & Slot Requests ---
  const today = new Date();
  const pastDate = new Date(today); pastDate.setDate(today.getDate() - 5);
  const futureDate = new Date(today); futureDate.setDate(today.getDate() + 2);

  await prisma.flyingSlot.createMany({
    data: [
      { date: pastDate, startTime: '08:00', endTime: '10:00', status: 'COMPLETED', aircraft: 'VT-MKJ', studentId: students[0].user.id, instructorId: instructors[0].user.id },
      { date: pastDate, startTime: '11:00', endTime: '13:00', status: 'CANCELLED', aircraft: 'VT-PRA', studentId: students[1].user.id, instructorId: instructors[1].user.id, notes: 'Weather hold' },
      { date: today, startTime: '09:00', endTime: '11:00', status: 'SCHEDULED', aircraft: 'VT-MKJ', studentId: students[2].user.id, instructorId: instructors[2].user.id },
      { date: futureDate, startTime: '14:00', endTime: '16:00', status: 'SCHEDULED', aircraft: 'VT-BXA', studentId: students[0].user.id, instructorId: instructors[0].user.id }
    ]
  });

  await prisma.slotRequest.createMany({
    data: [
      { date: futureDate, timePreference: 'Morning', instructorPreference: 'Capt Arora', aircraftPreference: 'VT-MKJ', studentId: students[1].user.id, status: 'PENDING' },
      { date: futureDate, timePreference: 'Afternoon', instructorPreference: 'Any', aircraftPreference: 'Cessna 172', studentId: students[2].user.id, status: 'APPROVED' }
    ]
  });
  console.log('  [5/10] Flying Slots & Requests seeded');

  // --- 6. Schedules (For Dispatch Board) ---
  await prisma.schedule.createMany({
    data: [
      { traineeId: students[0].stu.id, traineeName: 'Aarav Sharma', instructorId: instructors[0].instr.id, instructorName: 'Capt Arora', aircraftId: 'VT-MKJ', startTime: new Date(today.setHours(9,0,0,0)), endTime: new Date(today.setHours(11,0,0,0)), status: 'SCHEDULED', weatherVerdict: 'GO' },
      { traineeId: students[1].stu.id, traineeName: 'Sneha Reddy', instructorId: instructors[1].instr.id, instructorName: 'Capt Das', aircraftId: 'VT-PRA', startTime: new Date(today.setHours(13,0,0,0)), endTime: new Date(today.setHours(15,0,0,0)), status: 'CANCELLED', cancellationReason: 'Aircraft in Maintenance', weatherVerdict: 'NO-GO' }
    ]
  });
  console.log('  [6/10] Schedules seeded');

  // --- 7. Weather Checks ---
  await prisma.weatherCheck.createMany({
    data: [
      { icao: 'VIDP', stationName: 'Indira Gandhi Intl', studentType: 'SPL', verdict: 'NO-GO', windSpeed: 25, visibilitySm: 2.0, ceilingFt: 800, temperatureC: 28, reasons: 'Visibility too low for SPL. Wind exceeds limit.', warnings: 'Gusts up to 35kts' },
      { icao: 'VABB', stationName: 'Chhatrapati Shivaji Intl', studentType: 'CPL', verdict: 'GO', windSpeed: 10, visibilitySm: 10.0, ceilingFt: 3500, temperatureC: 32 }
    ]
  });
  console.log('  [7/10] Weather Checks seeded');

  // --- 8. Documents & Categories ---
  const cat1 = await prisma.documentCategory.create({ data: { name: 'Medical Certificates', requiresExpiry: true, warningThresholdDays: 30 }});
  const cat2 = await prisma.documentCategory.create({ data: { name: 'Training Manuals', requiresExpiry: false }});

  const doc1 = await prisma.document.create({
    data: { title: 'Class 1 Medical - Aarav', categoryId: cat1.id, studentId: students[0].user.id, expiryDate: new Date(new Date().setFullYear(new Date().getFullYear()+1)) }
  });
  await prisma.documentVersion.create({
    data: { documentId: doc1.id, fileUrl: 'medical_aarav.pdf', originalName: 'medical_aarav.pdf', mimeType: 'application/pdf', size: 1024000 }
  });

  const doc2 = await prisma.document.create({
    data: { title: 'Cessna 172 POH', categoryId: cat2.id, aircraftId: 'VT-MKJ' }
  });
  await prisma.documentVersion.create({
    data: { documentId: doc2.id, fileUrl: 'cessna_poh.pdf', originalName: 'cessna_poh.pdf', mimeType: 'application/pdf', size: 5000000 }
  });
  console.log('  [8/10] Documents seeded');

  // --- 9. Invoices & Payments ---
  // Create varied invoices to feed the Report Dashboard
  const invoices = [
    { num: 'INV-2026-001', stu: students[0].stu.id, amt: 400000, paid: 400000, status: 'PAID', monthOffset: -2, items: [{ description: 'PPL Course Fee', quantity: 1, unitPrice: 400000, totalPrice: 400000 }] },
    { num: 'INV-2026-002', stu: students[1].stu.id, amt: 22000, paid: 0, status: 'OVERDUE', monthOffset: -1, items: [{ description: 'Cessna 172 Rental', quantity: 2, unitPrice: 8000, totalPrice: 16000 }, { description: 'Instructor Fee', quantity: 2, unitPrice: 3000, totalPrice: 6000 }] },
    { num: 'INV-2026-003', stu: students[2].stu.id, amt: 2500000, paid: 500000, status: 'PENDING', monthOffset: 0, items: [{ description: 'CPL Course Fee', quantity: 1, unitPrice: 2500000, totalPrice: 2500000 }] },
    { num: 'INV-2026-004', stu: students[0].stu.id, amt: 25000, paid: 25000, status: 'PAID', monthOffset: -1, items: [{ description: 'Piper PA-28 Rental', quantity: 2, unitPrice: 9500, totalPrice: 19000 }, { description: 'Instructor Fee', quantity: 2, unitPrice: 3000, totalPrice: 6000 }] }
  ];

  for (const inv of invoices) {
    const issued = new Date(); issued.setMonth(issued.getMonth() + inv.monthOffset);
    const due = new Date(issued); due.setDate(due.getDate() + 15);
    
    const createdInv = await prisma.invoice.create({
      data: {
        invoiceNumber: inv.num, studentId: inv.stu, issuedById: admin.id, status: inv.status, 
        amount: inv.amt, paidAmount: inv.paid, issuedDate: issued, dueDate: due,
        items: { create: inv.items }
      }
    });

    if (inv.paid > 0) {
      await prisma.payment.create({
        data: { invoiceId: createdInv.id, amount: inv.paid, method: 'Bank Transfer', paidAt: new Date(issued.getTime() + 86400000) }
      });
    }
  }
  console.log('  [9/10] Invoices & Payments seeded');

  console.log('\n✅ Master Seeding Complete! All modules are now populated with varied, interlinked data.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
