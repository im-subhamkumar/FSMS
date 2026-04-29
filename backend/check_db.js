import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('Testing Aircraft fetch...');
        const data = await prisma.aircraft.findMany();
        console.log('Success! Count:', data.length);
        console.log('Data:', data);
    } catch (e) {
        console.error('FAILED!', e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
