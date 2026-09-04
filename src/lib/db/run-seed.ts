import { seedDatabase } from './seed';
import { prisma } from './prisma';

async function main() {
  console.log('Seeding database...');
  await seedDatabase();
  const userCount = await prisma.user.count();
  const taskCount = await prisma.task.count();
  const groupCount = await prisma.group.count();
  console.log(`Database seeded successfully! Users: ${userCount}, Tasks: ${taskCount}, Groups: ${groupCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
