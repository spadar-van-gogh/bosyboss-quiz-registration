import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('BosyBoss2025!', 10);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@bosyboss.by' },
    update: {},
    create: {
      email: 'admin@bosyboss.by',
      name: 'Администратор БосыBoss',
      password: hashedPassword,
      role: 'SUPER_ADMIN'
    }
  });

  console.log('✅ Admin created:', admin.email);

  // Create tournament - БЕЗ тестовых команд!
  const quiz1 = await prisma.quiz.upsert({
    where: { id: 'quiz-1' },
    update: {},
    create: {
      id: 'quiz-1',
      title: 'Большой Интеллектуальный Турнир',
      description: 'Масштабное мероприятие с несколькими раундами: история, наука, поп-культура и логика',
      date: new Date('2025-06-29T17:00:00Z'),
      startTime: '17:00',
      duration: 240,
      maxTeams: 10,        // 10 КОМАНД максимум
      minTeamSize: 3,      // От 3 участников в команде
      maxTeamSize: 10,     // До 10 участников в команде
      location: 'Ресторан "Рестар", бульвар газеты Гомельская Правда, 11. Открытая террасса на втором этаже.',
      price: 15,
      status: 'ACTIVE'
    }
  });

  console.log('✅ Tournament created:', quiz1.title);

  // НЕ создаем тестовые команды - начинаем с чистого листа!
  
  console.log('🎉 Database seeded successfully!');
  
  console.log('\n📋 Summary:');
  console.log('- Admin: admin@bosyboss.by / BosyBoss2025!');
  console.log('- Tournament: 1 tournament created');
  console.log('- Available slots: 10 из 10 команд (чистый старт)');
  console.log('- Team size: от 3 до 10 участников в команде');
  console.log('- Ready for real registrations! 🚀');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });