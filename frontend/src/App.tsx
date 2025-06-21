import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Star, Mail, Phone, User, MessageSquare, Trophy } from 'lucide-react';

// API Base URL из переменных окружения
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bosyboss-quiz-registration-production.up.railway.app';

// Types
interface Quiz {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: number;
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  location: string;
  price: number;
  availableSpots: number;
  isFull: boolean;
}

interface TeamRegistrationForm {
  teamName: string;
  teamSize: number;
  captainFirstName: string;
  captainLastName: string;
  captainEmail: string;
  captainPhone: string;
  experience: 'BEGINNER' | 'EXPERIENCED' | 'PROFESSIONAL';
  howHeardAbout?: string;
  notes?: string;
  quizId: string;
}

// Отдельный интерфейс для ошибок
interface TeamRegistrationFormErrors {
  teamName?: string;
  teamSize?: string;
  captainFirstName?: string;
  captainLastName?: string;
  captainEmail?: string;
  captainPhone?: string;
  experience?: string;
  howHeardAbout?: string;
  notes?: string;
  quizId?: string;
}

// Mock data for demonstration
const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Большой Интеллектуальный Турнир',
    description: 'Масштабное мероприятие с несколькими раундами: история, наука, поп-культура и логика',
    date: '2025-06-29T17:00:00Z',
    startTime: '17:00',
    duration: 240,
    maxTeams: 10,
    minTeamSize: 3,
    maxTeamSize: 10,
    location: 'Ресторан "Рестар", бульвар газеты Гомельская Правда, 11. Открытая террасса на втором этаже.',
    price: 15,
    availableSpots: 10,
    isFull: false
  },
  // {
  //   id: '2',
  //   title: 'Science Battle',
  //   description: 'Научная битва команд: физика, химия, биология, математика и IT',
  //   date: '2025-06-20T18:30:00Z',
  //   startTime: '18:30',
  //   duration: 150,
  //   maxTeams: 15,
  //   minTeamSize: 4,
  //   maxTeamSize: 8,
  //   location: 'Технопарк "Сколково", конференц-зал',
  //   price: 500,
  //   availableSpots: 3,
  //   isFull: false
  // },
  // {
  //   id: '3',
  //   title: 'Ретро-квиз 90-х и 2000-х',
  //   description: 'Ностальгическое мероприятие: музыка, фильмы, игры и тренды прошлых десятилетий',
  //   date: '2025-06-25T20:00:00Z',
  //   startTime: '20:00',
  //   duration: 120,
  //   maxTeams: 12,
  //   minTeamSize: 2,
  //   maxTeamSize: 5,
  //   location: 'Антикафе "Циферблат"',
  //   price: 300,
  //   availableSpots: 0,
  //   isFull: true
  // }
];

export default function App() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errors, setErrors] = useState<TeamRegistrationFormErrors>({});

  const [formData, setFormData] = useState<TeamRegistrationForm>({
    teamName: '',
    teamSize: 0,
    captainFirstName: '',
    captainLastName: '',
    captainEmail: '',
    captainPhone: '',
    experience: 'BEGINNER',
    howHeardAbout: '',
    notes: '',
    quizId: ''
  });

  /// Load quizzes on component mount
  useEffect(() => {
    setIsLoading(true);
    
    fetch('https://bosyboss-quiz-registration-production.up.railway.app/api/quizzes')
      .then(response => response.json())
      .then(data => {
        setQuizzes(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading quizzes:', error);
        // Fallback на mock данные
        setQuizzes(mockQuizzes);
        setIsLoading(false);
      });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: TeamRegistrationFormErrors = {};

    if (!formData.teamName.trim()) newErrors.teamName = 'Название команды обязательно';
    
    // Исправленная валидация размера команды
    if (!formData.teamSize || formData.teamSize === 0) {
      newErrors.teamSize = 'Укажите количество участников';
    } else if (formData.teamSize < (selectedQuiz?.minTeamSize || 2)) {
      newErrors.teamSize = `Минимум ${selectedQuiz?.minTeamSize || 2} участников`;
    } else if (formData.teamSize > (selectedQuiz?.maxTeamSize || 6)) {
      newErrors.teamSize = `Максимум ${selectedQuiz?.maxTeamSize || 6} участников`;
    }

    if (!formData.captainFirstName.trim()) newErrors.captainFirstName = 'Имя капитана обязательно';
    if (!formData.captainLastName.trim()) newErrors.captainLastName = 'Фамилия капитана обязательна';
    
    if (!formData.captainEmail.trim()) {
      newErrors.captainEmail = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.captainEmail)) {
      newErrors.captainEmail = 'Некорректный email';
    }
    
    if (!formData.captainPhone.trim()) {
      newErrors.captainPhone = 'Телефон обязателен';
    } else if (!/^\+?375[\d\s\-\(\)]{8,}$/.test(formData.captainPhone)) {
      newErrors.captainPhone = 'Некорректный номер телефона (формат: +375 XX XXX-XX-XX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'teamSize' ? (value ? parseInt(value) : 0) : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof TeamRegistrationFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleQuizSelect = (quiz: Quiz) => {
    if (quiz.isFull) return;
    
    setSelectedQuiz(quiz);
    setFormData(prev => ({ 
      ...prev, 
      quizId: quiz.id,
      teamSize: quiz.minTeamSize // Set default team size
    }));
    setShowForm(true);
    setSubmitMessage('');
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Реальный запрос к API
      const response = await fetch('https://bosyboss-quiz-registration-production.up.railway.app/api/registrations/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage(`Команда "${formData.teamName}" успешно зарегистрирована! Проверьте email для подтверждения.`);
        setShowForm(false);
        setFormData({
          teamName: '',
          teamSize: 0,
          captainFirstName: '',
          captainLastName: '',
          captainEmail: '',
          captainPhone: '',
          experience: 'BEGINNER',
          howHeardAbout: '',
          notes: '',
          quizId: ''
        });
        
        // Обновляем список квизов
        fetch(`${API_BASE_URL}/api/quizzes`)
          .then(response => response.json())
          .then(data => setQuizzes(data))
          .catch(error => console.error('Error reloading quizzes:', error));
          
      } else {
        setSubmitMessage(result.error || 'Ошибка при регистрации');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitMessage('Ошибка при регистрации. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загружаем турниры...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Trophy className="text-white text-xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">БосыBoss</h1>
            </div>
            <div className="text-sm text-gray-500">
              Командные интеллектуальные турниры
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {submitMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{submitMessage}</p>
              </div>
            </div>
          </div>
        )}

        {!showForm ? (
          <>
            {/* Page Title */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Регистрация команд на турниры
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Соберите команду и примите участие в интеллектуальных соревнованиях
              </p>
            </div>

            {/* Quiz Cards */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map(quiz => (
                <div 
                  key={quiz.id} 
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    quiz.isFull ? 'opacity-75' : 'cursor-pointer'
                  }`}
                  onClick={() => handleQuizSelect(quiz)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                        {quiz.title}
                      </h3>
                      {quiz.isFull && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Мест нет
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-6 line-clamp-3">
                      {quiz.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                        {formatDate(quiz.date)}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-700">
                        <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                        {quiz.startTime} ({quiz.duration} минут)
                      </div>

                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                        {quiz.location}
                      </div>

                      <div className="flex items-center text-sm text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-indigo-500" />
                        Команда: {quiz.minTeamSize}-{quiz.maxTeamSize} человек
                      </div>

                      <div className="flex items-center text-sm text-gray-700">
                        <Trophy className="w-4 h-4 mr-2 text-indigo-500" />
                        Свободно мест: {quiz.availableSpots} из {quiz.maxTeams} команд
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-indigo-600">
                        {quiz.price === 0 ? 'Бесплатно' : `${quiz.price} BYN`}
                      </div>
                      
                      <button
                        disabled={quiz.isFull}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          quiz.isFull
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {quiz.isFull ? 'Нет мест' : 'Регистрация'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Team Registration Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Form Header */}
              <div className="bg-indigo-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">
                  Регистрация команды на "{selectedQuiz?.title}"
                </h3>
                <p className="text-indigo-100 mt-1">
                  {selectedQuiz && formatDate(selectedQuiz.date)} в {selectedQuiz?.startTime}
                </p>
                <p className="text-indigo-200 text-sm mt-1">
                  Размер команды: {selectedQuiz?.minTeamSize}-{selectedQuiz?.maxTeamSize} человек
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Team Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-indigo-500" />
                    Информация о команде
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Название команды *
                      </label>
                      <input
                        type="text"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.teamName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Мозговые штурмовики"
                      />
                      {errors.teamName && (
                        <p className="mt-1 text-sm text-red-600">{errors.teamName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Количество участников *
                      </label>
                      <input
                        type="number"
                        name="teamSize"
                        value={formData.teamSize || ''}
                        onChange={handleInputChange}
                        min={selectedQuiz?.minTeamSize}
                        max={selectedQuiz?.maxTeamSize}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.teamSize ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder={`${selectedQuiz?.minTeamSize}-${selectedQuiz?.maxTeamSize}`}
                      />
                      {errors.teamSize && (
                        <p className="mt-1 text-sm text-red-600">{errors.teamSize}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Captain Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-500" />
                    Контактное лицо (Капитан команды)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Имя капитана *
                      </label>
                      <input
                        type="text"
                        name="captainFirstName"
                        value={formData.captainFirstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.captainFirstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Имя"
                      />
                      {errors.captainFirstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.captainFirstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Фамилия капитана *
                      </label>
                      <input
                        type="text"
                        name="captainLastName"
                        value={formData.captainLastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.captainLastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Фамилия"
                      />
                      {errors.captainLastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.captainLastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email капитана *
                      </label>
                      <input
                        type="email"
                        name="captainEmail"
                        value={formData.captainEmail}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.captainEmail ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="captain@email.com"
                      />
                      {errors.captainEmail && (
                        <p className="mt-1 text-sm text-red-600">{errors.captainEmail}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Телефон капитана *
                      </label>
                      <input
                        type="tel"
                        name="captainPhone"
                        value={formData.captainPhone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.captainPhone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="+375 (29) 123-45-67"
                      />
                      {errors.captainPhone && (
                        <p className="mt-1 text-sm text-red-600">{errors.captainPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Star className="w-4 h-4 inline mr-1" />
                      Опыт участия в интеллектуальных играх
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="BEGINNER">Падаван 🟢</option>
                      <option value="EXPERIENCED">Рыцарь-джедай ⚔️</option>
                      <option value="PROFESSIONAL">Мастер-джедай ✨</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Как узнали о турнире?
                    </label>
                    <select
                      name="howHeardAbout"
                      value={formData.howHeardAbout}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Выберите вариант</option>
                      <option value="social_media">Социальные сети</option>
                      <option value="friends">От друзей</option>
                      <option value="advertising">Реклама</option>
                      <option value="previous_events">Участвовали ранее</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Дополнительные комментарии
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Особые пожелания, вопросы или что-то важное о команде..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.notes?.length || 0}/500 символов
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Назад к списку турниров
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Регистрация команды...
                      </>
                    ) : (
                      'Зарегистрировать команду'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}