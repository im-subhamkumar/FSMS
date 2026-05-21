import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // 1. Create multiple Students with GPA
    const trainees = [
        { id: 'TRAINEE001', first: 'John', last: 'Trainee', email: 'john@example.com', gpa: 3.8, batch: 'B2024A' },
        { id: 'TRAINEE002', first: 'Jane', last: 'Doe', email: 'jane@example.com', gpa: 3.5, batch: 'B2024A' },
        { id: 'TRAINEE003', first: 'Mike', last: 'Ross', email: 'mike@example.com', gpa: 3.9, batch: 'B2024B' },
        { id: 'TRAINEE004', first: 'Sarah', last: 'Connor', email: 'sarah@example.com', gpa: 3.2, batch: 'B2024B' },
        { id: 'TRAINEE005', first: 'Arthur', last: 'Morgan', email: 'arthur@example.com', gpa: 3.6, batch: 'B2024A' },
    ];

    for (const t of trainees) {
        await prisma.student.upsert({
            where: { studentId: t.id },
            update: { gpa: t.gpa, batch: t.batch },
            create: {
                studentId: t.id,
                firstName: t.first,
                lastName: t.last,
                email: t.email,
                dob: new Date('2000-01-01'),
                gender: 'Male',
                nationality: 'Indian',
                phone: '1234567890',
                gpa: t.gpa,
                batch: t.batch
            }
        });
    }

    // 2. Create Users for Instructors
    const instructorUsers = [
        { email: 'instructor1@example.com', first: 'Alice', last: 'Smith' },
        { email: 'instructor2@example.com', first: 'Bob', last: 'Johnson' }
    ];

    for (const u of instructorUsers) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                password: 'password123',
                firstName: u.first,
                lastName: u.last,
                role: 'INSTRUCTOR'
            }
        });

        await prisma.instructor.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                employeeId: `EMP-${u.first.toUpperCase()}`,
                designation: 'FLIGHT_INSTRUCTOR',
                department: 'FLYING',
                dateOfJoining: new Date(),
                employmentType: 'FULL_TIME'
            }
        });
    }

    // 3. Create Aircraft
    const fleet = [
        { id: 'VT-ACC', tail: 'VT-ACC', name: 'Cessna 172' },
        { id: 'VT-BCC', tail: 'VT-BCC', name: 'Piper Archer' },
        { id: 'VT-CCC', tail: 'VT-CCC', name: 'Diamond DA40' }
    ];

    for (const a of fleet) {
        await prisma.aircraft.upsert({
            where: { id: a.id },
            update: {},
            create: {
                id: a.id,
                tailNumber: a.tail,
                name: a.name,
                model: 'Training',
                status: 'Active',
                type: 'Training'
            }
        });
    }

    // 4. Seed Document Categories
    console.log('Seeding DocumentCategories...');
    const cats = [
        { name: 'License', description: 'Pilot Licenses', requiresExpiry: true, warningThresholdDays: 60 },
        { name: 'Medical', description: 'Medical Certificates', requiresExpiry: true, warningThresholdDays: 30 },
        { name: 'Logbook', description: 'Flight Logs', requiresExpiry: false, warningThresholdDays: 0 },
        { name: 'Certificate', description: 'Training Certificates', requiresExpiry: false, warningThresholdDays: 0 }
    ];

    for (const c of cats) {
        await prisma.documentCategory.upsert({
            where: { name: c.name },
            update: {},
            create: c
        });
    }

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
