import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create a User (Admin)
  const user = await prisma.user.upsert({
    where: { email: 'admin@fsms.com' },
    update: {},
    create: {
      email: 'admin@fsms.com',
      password: 'mypassword',
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  // 2. Create a Student
  const student = await prisma.student.upsert({
    where: { studentId: 'FSMS-STU-0001' },
    update: {},
    create: {
      studentId: 'FSMS-STU-0001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@fsms.com',
      dob: new Date('2000-01-01'),
      gender: 'Male',
      nationality: 'Indian',
    },
  });

  // 3. Create an Invoice
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-' + Date.now().toString().slice(-6),
      studentId: student.id,
      issuedById: user.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Initial seed invoice',
      amount: 1000,
      status: 'PENDING',
      items: {
        create: [
          {
            description: 'Flight Training - 10 hours',
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000,
          }
        ]
      }
    }
  });

  console.log('Seed completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
