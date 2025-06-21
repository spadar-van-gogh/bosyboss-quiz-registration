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

  // Create only ONE tournament
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
      maxTeams: 10,
      minTeamSize: 3,
      maxTeamSize: 10,
      location: 'Ресторан "Рестар", бульвар газеты Гомельская Правда, 11. Открытая террасса на втором этаже.',
      price: 15,
      status: 'ACTIVE'
    }
  });

  console.log('✅ Tournament created:', quiz1.title);

  // Create sample team registrations (optional - можете закомментировать)
  const sampleTeams = [
    {
      teamName: 'Знатоки',
      teamSize: 4,
      captainFirstName: 'Анна',
      captainLastName: 'Петрова',
      captainEmail: 'anna.petrova@example.com',
      captainPhone: '+375 29 123-45-67',
      experience: 'EXPERIENCED',
      quizId: quiz1.id,
      status: 'CONFIRMED'
    },
    {
      teamName: 'Мозговой штурм',
      teamSize: 5,
      captainFirstName: 'Максим',
      captainLastName: 'Иванов',
      captainEmail: 'maxim.ivanov@example.com',
      captainPhone: '+375 29 234-56-78',
      experience: 'BEGINNER',
      quizId: quiz1.id,
      status: 'CONFIRMED'
    }
  ];

  for (const teamData of sampleTeams) {
    await prisma.teamRegistration.upsert({
      where: {
        teamName_quizId: {
          teamName: teamData.teamName,
          quizId: teamData.quizId
        }
      },
      update: {},
      create: teamData
    });
  }

  console.log('✅ Sample team registrations created');
  console.log('🎉 Database seeded successfully!');
  
  console.log('\n📋 Summary:');
  console.log('- Admin: admin@bosyboss.by / BosyBoss2025!');
  console.log('- Tournament: 1 tournament created');
  console.log('- Team Registrations: 0 sample team registrations created');
  console.log('- Available spots: 10 из 10 команд');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });