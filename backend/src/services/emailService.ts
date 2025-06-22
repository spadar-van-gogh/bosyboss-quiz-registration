import { Resend } from 'resend';

// Создаем экземпляр Resend только если есть API ключ
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface TeamRegistrationWithQuiz {
  id: string;
  teamName: string;
  teamSize: number;
  captainFirstName: string;
  captainLastName: string;
  captainEmail: string;
  captainPhone: string;
  status: string;
  quiz: {
    title: string;
    description: string | null;
    date: Date;
    startTime: string;
    location: string | null;
    price: number;
    minTeamSize: number;
    maxTeamSize: number;
  };
}

// Email templates for team registration
const getTeamConfirmationEmailHTML = (registration: TeamRegistrationWithQuiz) => {
  const { teamName, teamSize, captainFirstName, captainLastName, quiz } = registration;
  const quizDate = new Date(quiz.date).toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isWaitlist = registration.status === 'WAITLIST';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Подтверждение регистрации команды</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .team-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .status { padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center; }
            .confirmed { background: #D1FAE5; color: #065F46; }
            .waitlist { background: #FEF3C7; color: #92400E; }
            .footer { color: #666; font-size: 14px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏆 БосыBoss</h1>
                <h2>${isWaitlist ? 'Команда в списке ожидания' : 'Регистрация команды подтверждена!'}</h2>
            </div>
            
            <div class="content">
                <p>Привет, ${captainFirstName} ${captainLastName}!</p>
                
                <div class="status ${isWaitlist ? 'waitlist' : 'confirmed'}">
                    ${isWaitlist 
                      ? '📋 Ваша команда добавлена в список ожидания. Мы уведомим вас, если освободится место.'
                      : '✅ Регистрация вашей команды подтверждена!'
                    }
                </div>

                <div class="team-details">
                    <h3>👥 Информация о команде:</h3>
                    <p><strong>Название команды:</strong> ${teamName}</p>
                    <p><strong>Количество участников:</strong> ${teamSize} человек</p>
                    <p><strong>Капитан:</strong> ${captainFirstName} ${captainLastName}</p>
                </div>

                <div class="team-details">
                    <h3>📝 Детали мероприятия:</h3>
                    <p><strong>Название:</strong> ${quiz.title}</p>
                    ${quiz.description ? `<p><strong>Описание:</strong> ${quiz.description}</p>` : ''}
                    <p><strong>Дата:</strong> ${quizDate}</p>
                    <p><strong>Время:</strong> ${quiz.startTime}</p>
                    ${quiz.location ? `<p><strong>Место:</strong> ${quiz.location}</p>` : ''}
                    <p><strong>Размер команды:</strong> от ${quiz.minTeamSize} до ${quiz.maxTeamSize} человек</p>
                    ${quiz.price > 0 ? `<p><strong>Стоимость:</strong> ${quiz.price} BYN</p>` : '<p><strong>Участие бесплатное</strong></p>'}
                </div>

                ${!isWaitlist ? `
                    <h3>📋 Что дальше?</h3>
                    <ul>
                        <li>Приводите всю команду за 15 минут до начала</li>
                        <li>Убедитесь, что все участники знают время и место</li>
                        <li>Если команда не может прийти, обязательно отмените регистрацию</li>
                        <li>Возьмите с собой ручки для всей команды</li>
                    </ul>
                ` : ''}

                <div class="footer">
                    <p>С уважением,<br>Команда БосыBoss</p>
                    <p><small>ID регистрации: ${registration.id}</small></p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const sendTeamConfirmationEmail = async (registration: TeamRegistrationWithQuiz) => {
  try {

    // === НОВОЕ ЛОГИРОВАНИЕ ===
    console.log('🔧 === DEBUG EMAIL SERVICE ===');
    console.log('🔑 RESEND_API_KEY:', process.env.RESEND_API_KEY ? `настроен (длина: ${process.env.RESEND_API_KEY.length})` : '❌ ОТСУТСТВУЕТ');
    console.log('📧 FROM_EMAIL:', process.env.FROM_EMAIL);
    console.log('📬 TO EMAIL:', registration.captainEmail);
    console.log('🤖 resend объект:', resend ? 'создан' : '❌ НЕ СОЗДАН');
    console.log('=====================================');
    // === КОНЕЦ НОВОГО ЛОГИРОВАНИЯ ===
    
    console.log('Отправляем email через Resend...');
    
    if (!resend) {
      console.error('Resend не настроен - отсутствует RESEND_API_KEY');
      throw new Error('Email service not configured');
    }

    const isWaitlist = registration.status === 'WAITLIST';
    
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'restardigital@gmail.com',
      to: registration.captainEmail,
      subject: isWaitlist 
        ? `📋 Команда "${registration.teamName}" в списке ожидания: ${registration.quiz.title}`
        : `✅ Команда "${registration.teamName}" зарегистрирована: ${registration.quiz.title}`,
      html: getTeamConfirmationEmailHTML(registration)
    });

    console.log('Email отправлен успешно:', result);
    return result;
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw error;
  }
};

export const sendTeamReminderEmail = async (registration: TeamRegistrationWithQuiz) => {
  try {
    if (!resend) {
      throw new Error('Email service not configured');
    }

    const quizDate = new Date(registration.quiz.date).toLocaleDateString('ru-RU');
    
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'restardigital@gmail.com',
      to: registration.captainEmail,
      subject: `🔔 Напоминание: турнир завтра!`,
      html: `
        <h2>Привет, ${registration.captainFirstName}!</h2>
        <p>Напоминаем, что завтра ${quizDate} в ${registration.quiz.startTime} состоится турнир "${registration.quiz.title}".</p>
        <p>Не забудьте привести всю команду "${registration.teamName}" (${registration.teamSize} человек)!</p>
        <p>До встречи!</p>
        <p><strong>С уважением,<br>Команда БосыBoss</strong></p>
      `
    });

    return result;
  } catch (error) {
    console.error('Error sending team reminder:', error);
    throw error;
  }
};