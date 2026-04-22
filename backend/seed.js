import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // 1. Create a Student
    const student = await prisma.student.upsert({
        where: { studentId: 'TRAINEE001' },
        update: {},
        create: {
            studentId: 'TRAINEE001',
            firstName: 'John',
            lastName: 'Trainee',
            email: 'john@example.com',
            dob: new Date('2000-01-01'),
            gender: 'Male',
            nationality: 'Indian',
            phone: '1234567890'
        }
    });

    // 2. Create a User for Instructor
    const user = await prisma.user.upsert({
        where: { email: 'instructor@example.com' },
        update: {},
        create: {
            email: 'instructor@example.com',
            password: 'password123',
            firstName: 'Alice',
            lastName: 'Instructor',
            role: 'INSTRUCTOR'
        }
    });

    // 3. Create an Instructor
    const instructor = await prisma.instructor.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            employeeId: 'EMP001',
            designation: 'FLIGHT_INSTRUCTOR',
            department: 'FLYING',
            dateOfJoining: new Date(),
            employmentType: 'FULL_TIME'
        }
    });

    // 4. Create an Aircraft
    const aircraft = await prisma.aircraft.upsert({
        where: { id: 'VT-ACC' },
        update: {},
        create: {
            id: 'VT-ACC',
            tailNumber: 'VT-ACC',
            name: 'Cessna 172',
            model: 'C172 Skyhawk',
            status: 'Active',
            type: 'Training'
        }
    });

    // 5. Seed Document Categories
    console.log('Seeding DocumentCategories...');
    await prisma.documentCategory.createMany({
        data: [
            { name: 'License', description: 'Pilot Licenses', requiresExpiry: true, warningThresholdDays: 60 },
            { name: 'Medical', description: 'Medical Certificates', requiresExpiry: true, warningThresholdDays: 30 },
            { name: 'Logbook', description: 'Flight Logs', requiresExpiry: false, warningThresholdDays: 0 },
            { name: 'Certificate', description: 'Training Certificates', requiresExpiry: false, warningThresholdDays: 0 }
        ],
        skipDuplicates: true
    });

    console.log('Seeding complete!', { student, instructor, aircraft });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
