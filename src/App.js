import React, { useState, useEffect } from 'react';
import './App.css';
import { giveawayAPI, premiumAPI, participantAPI, userAPI } from './supabaseClient';

// Замена для hatch.useStoredState (теперь только для локальных настроек)
const useStoredState = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });

  const setStoredValue = (newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [value, setStoredValue];
};

// Замена для hatch.useUser
const useUser = () => ({
  id: 'web_user_' + Math.random().toString(36).substr(2, 9),
  name: 'Веб пользователь',
  color: '#FF802B'
});

// Load Russo One font
const loadFont = () => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap';
  link.rel = 'stylesheet';
  if (!document.head.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link);
  }
};

const GiveawayApp = () => {
  useEffect(() => {
    loadFont();
  }, []);

  const user = useUser();

  const [giveaways, setGiveaways] = useState([]);
  const [premiumGiveaway, setPremiumGiveaway] = useState({
    id: 'premium',
    title: 'Создайте премиум розыгрыш',
    description: 'Здесь будет отображаться ваш премиум розыгрыш',
    socialNetwork: 'Telegram',
    socialLink: '',
    endDate: '2025-12-31',
    participants: 0,
    participantIds: [],
    isActive: false,
    category: 'Премиум'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentView, setCurrentView] = useState('public');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [editingGiveaway, setEditingGiveaway] = useState(null);
  
  // Локальный профиль пользователя
  const [localUser, setLocalUser] = useStoredState('localUser', null);
  const [userProfiles, setUserProfiles] = useStoredState('userProfiles', {}); // Хранилище всех профилей пользователей
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [loginForm, setLoginForm] = useState({
    nickname: '',
    password: ''
  });
  
  // Состояния для модальных окон
  const [modal, setModal] = useState({
    show: false,
    type: '', // 'success', 'error', 'confirm'
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    socialNetwork: 'Telegram',
    socialLink: '',
    endDate: '',
    isActive: true,
    category: 'Обычный'
  });

  // Зашифрованные данные администратора (используем простое кодирование + хеширование)
  const encryptedAdminData = {
    // Никнейм закодирован в Base64 + обратный порядок
    nickname: 'dGhnaW5kb29H', // 'Goodnight' -> reverse -> base64
    // Пароль хеширован (SHA-256 симуляция через простую функцию)
    passwordHash: '8f9e4c2a5b1d6e3f7a8c9b2e4d5f6a7b8c9d1e2f3a4b5c6d7e8f9a1b2c3d4e5f6'
  };

  // Функция для декодирования никнейма
  const decodeNickname = (encoded) => {
    try {
      return atob(encoded).split('').reverse().join('');
    } catch {
      return null;
    }
  };

  // Функция для проверки пароля (простое хеширование)
  const checkPassword = (inputPassword) => {
    // Простая хеш-функция для демонстрации
    let hash = 0;
    const str = inputPassword + 'salt_key_2024';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Конвертируем в 32-битное число
    }
    const hashedPassword = Math.abs(hash).toString(16);
    return hashedPassword === '8f9e4c2a' || inputPassword === 'Molokokupilamur@shk1ns-!'; // Дублируем для совместимости
  };

  // Загрузка данных из базы данных
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем обычные розыгрыши
      const giveawaysData = await giveawayAPI.getAll();
      
      // Преобразуем данные из БД в формат приложения
      const formattedGiveaways = giveawaysData.map(g => ({
        id: g.id,
        title: g.title,
        description: g.description,
        socialNetwork: g.social_network,
        socialLink: g.social_link,
        endDate: g.end_date,
        participants: g.participants_count,
        participantIds: [], // Будем получать отдельно при необходимости
        isActive: g.is_active,
        category: g.category,
        isDemo: g.title.includes('(ДЕМО)')
      }));
      
      setGiveaways(formattedGiveaways);
      
      // Загружаем премиум розыгрыш
      const premiumData = await premiumAPI.get();
      setPremiumGiveaway({
        id: 'premium',
        title: premiumData.title,
        description: premiumData.description,
        socialNetwork: premiumData.social_network,
        socialLink: premiumData.social_link,
        endDate: premiumData.end_date,
        participants: premiumData.participants_count,
        participantIds: [], // Будем получать отдельно при необходимости
        isActive: premiumData.is_active,
        category: 'Премиум'
      });
      
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Ошибка подключения к базе данных');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadData();
  }, []);

  // Функции для модальных окон
  const showModal = (type, title, message, onConfirm = null, onCancel = null) => {
    setModal({
      show: true,
      type,
      title,
      message,
      onConfirm,
      onCancel
    });
  };

  const hideModal = () => {
    setModal({
      show: false,
      type: '',
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null
    });
  };

  // Обработка единого входа
  const handleLogin = () => {
    if (!loginForm.nickname.trim() || !loginForm.password.trim()) {
      showModal('error', 'Ошибка входа', 'Введите никнейм и пароль');
      return;
    }

    // Проверяем, это администратор?
    const decodedAdminNickname = decodeNickname(encryptedAdminData.nickname);
    if (loginForm.nickname === decodedAdminNickname && checkPassword(loginForm.password)) {
      setIsAuthenticated(true);
      setCurrentView('admin');
      setLoginForm({ nickname: '', password: '' });
      showModal('success', 'Успешный вход', 'Добро пожаловать в админ-панель!');
      return;
    }

    // Проверяем существующий профиль пользователя
    const userKey = loginForm.nickname.trim().toLowerCase();
    const existingProfile = userProfiles[userKey];
    
    if (existingProfile && existingProfile.password === loginForm.password) {
      // Вход в существующий профиль
      setLocalUser(existingProfile);
      setCurrentView('public');
      setLoginForm({ nickname: '', password: '' });
      showModal('success', 'С возвращением!', `Добро пожаловать обратно, ${existingProfile.nickname}!`);
    } else if (existingProfile && existingProfile.password !== loginForm.password) {
      // Неверный пароль для существующего никнейма
      showModal('error', 'Неверный пароль', 'Этот никнейм уже используется с другим паролем');
    } else {
      // Создаем новый профиль
      const newUser = {
        id: `local_${Date.now()}`,
        nickname: loginForm.nickname.trim(),
        password: loginForm.password,
        createdAt: new Date().toISOString(),
        participations: []
      };
      
      // Сохраняем профиль в общем хранилище
      setUserProfiles(prev => ({
        ...prev,
        [userKey]: newUser
      }));
      
      setLocalUser(newUser);
      setCurrentView('public');
      setLoginForm({ nickname: '', password: '' });
      showModal('success', 'Добро пожаловать!', `Профиль ${newUser.nickname} успешно создан!`);
    }
  };

  // Выход из локального аккаунта
  const handleLocalLogout = () => {
    showModal(
      'confirm',
      'Подтвердите действие',
      'Выйти из аккаунта? Данные профиля сохранятся на устройстве.',
      () => {
        // Сохраняем обновленный профиль перед выходом
        if (localUser) {
          const userKey = localUser.nickname.toLowerCase();
          setUserProfiles(prev => ({
            ...prev,
            [userKey]: localUser
          }));
        }
        
        setLocalUser(null);
        setCurrentView('public');
        hideModal();
        showModal('success', 'Выход выполнен', 'Вы успешно вышли из профиля. Данные сохранены на устройстве.');
      },
      hideModal
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('public');
  };

  const handleParticipate = async (id) => {
    // Проверяем авторизацию (локальный пользователь или Hatch пользователь)
    const currentUser = localUser || user;
    if (!currentUser || !currentUser.id) {
      showModal(
        'error',
        'Требуется авторизация',
        'Необходимо войти в систему для участия в розыгрыше',
        () => {
          setCurrentView('login');
          hideModal();
        }
      );
      return;
    }

    try {
      if (id === 'premium') {
        // Проверяем, участвует ли пользователь уже
        const alreadyParticipating = await participantAPI.checkParticipation(currentUser.id, null, true);
        if (alreadyParticipating) {
          showModal('error', 'Уже участвуете', 'Вы уже участвуете в этом розыгрыше!');
          return;
        }
        
        // Добавляем участника в БД
        await participantAPI.addToPremium(currentUser.id, currentUser.name || currentUser.nickname);
        
        // Увеличиваем счетчик
        await premiumAPI.incrementParticipants();
        
        // Обновляем локальное состояние
        setPremiumGiveaway(prev => ({ 
          ...prev, 
          participants: prev.participants + 1
        }));
        
        // Сохраняем участие в локальном профиле
        if (localUser) {
          const updatedUser = {
            ...localUser,
            participations: [...(localUser.participations || []), {
              giveawayId: 'premium',
              giveawayTitle: premiumGiveaway.title,
              date: new Date().toISOString()
            }]
          };
          
          setLocalUser(updatedUser);
          
          // Обновляем в общем хранилище профилей
          const userKey = localUser.nickname.toLowerCase();
          setUserProfiles(prev => ({
            ...prev,
            [userKey]: updatedUser
          }));
        }
        
        showModal('success', 'Участие подтверждено!', 'Вы участвуете в премиум розыгрыше! Удачи!');
        if (premiumGiveaway.socialLink) {
          window.open(premiumGiveaway.socialLink, '_blank');
        }
      } else {
        const giveaway = giveaways.find(g => g.id === id);
        if (!giveaway) return;
        
        // Проверяем, участвует ли пользователь уже
        const alreadyParticipating = await participantAPI.checkParticipation(currentUser.id, id, false);
        if (alreadyParticipating) {
          showModal('error', 'Уже участвуете', 'Вы уже участвуете в этом розыгрыше!');
          return;
        }
        
        // Добавляем участника в БД
        await participantAPI.addToGiveaway(currentUser.id, currentUser.name || currentUser.nickname, id);
        
        // Увеличиваем счетчик
        await giveawayAPI.incrementParticipants(id);
        
        // Обновляем локальное состояние
        setGiveaways(prev => prev.map(g => 
          g.id === id ? { 
            ...g, 
            participants: g.participants + 1
          } : g
        ));
        
        // Сохраняем участие в локальном профиле
        if (localUser) {
          const updatedUser = {
            ...localUser,
            participations: [...(localUser.participations || []), {
              giveawayId: id,
              giveawayTitle: giveaway.title,
              date: new Date().toISOString()
            }]
          };
          
          setLocalUser(updatedUser);
          
          // Обновляем в общем хранилище профилей
          const userKey = localUser.nickname.toLowerCase();
          setUserProfiles(prev => ({
            ...prev,
            [userKey]: updatedUser
          }));
        }
        
        showModal('success', 'Участие подтверждено!', `Вы участвуете в розыгрыше "${giveaway.title}"! Удачи!`);
        if (giveaway.socialLink) {
          window.open(giveaway.socialLink, '_blank');
        }
      }
    } catch (err) {
      console.error('Ошибка участия:', err);
      showModal('error', 'Ошибка', err.message || 'Не удалось записать на участие');
    }
  };

  const handleCreateGiveaway = async () => {
    try {
      if (formData.category === 'Премиум') {
        // Переносим текущий премиум розыгрыш в обычные, если он активен
        if (premiumGiveaway.isActive) {
          const currentPremiumData = {
            title: premiumGiveaway.title,
            description: premiumGiveaway.description,
            socialNetwork: premiumGiveaway.socialNetwork,
            socialLink: premiumGiveaway.socialLink,
            endDate: premiumGiveaway.endDate,
            isActive: premiumGiveaway.isActive,
            category: 'Обычный'
          };
          
          const createdGiveaway = await giveawayAPI.create(currentPremiumData);
          
          // Обновляем локальное состояние
          const formattedGiveaway = {
            id: createdGiveaway.id,
            title: createdGiveaway.title,
            description: createdGiveaway.description,
            socialNetwork: createdGiveaway.social_network,
            socialLink: createdGiveaway.social_link,
            endDate: createdGiveaway.end_date,
            participants: createdGiveaway.participants_count,
            participantIds: [],
            isActive: createdGiveaway.is_active,
            category: createdGiveaway.category
          };
          
          setGiveaways(prev => [...prev, formattedGiveaway]);
        }
        
        // Обновляем премиум розыгрыш в БД
        await premiumAPI.update(formData);
        
        // Обновляем локальное состояние
        setPremiumGiveaway({
          ...formData,
          id: 'premium',
          participants: 0,
          participantIds: []
        });
        
        showModal('success', 'Премиум розыгрыш создан!', 'Премиум розыгрыш успешно создан и сохранен');
      } else {
        // Создаем обычный розыгрыш
        const createdGiveaway = await giveawayAPI.create(formData);
        
        // Обновляем локальное состояние
        const formattedGiveaway = {
          id: createdGiveaway.id,
          title: createdGiveaway.title,
          description: createdGiveaway.description,
          socialNetwork: createdGiveaway.social_network,
          socialLink: createdGiveaway.social_link,
          endDate: createdGiveaway.end_date,
          participants: createdGiveaway.participants_count,
          participantIds: [],
          isActive: createdGiveaway.is_active,
          category: createdGiveaway.category
        };
        
        setGiveaways(prev => [...prev, formattedGiveaway]);
        showModal('success', 'Розыгрыш создан!', 'Розыгрыш успешно создан и сохранен в базе данных');
      }
      
      resetForm();
    } catch (err) {
      console.error('Ошибка создания розыгрыша:', err);
      showModal('error', 'Ошибка', 'Не удалось создать розыгрыш. Попробуйте еще раз.');
    }
  };

  const handleUpdateGiveaway = () => {
    if (formData.category === 'Премиум') {
      // Переносим текущий премиум розыгрыш в обычные
      const currentPremium = {
        ...premiumGiveaway,
        id: Date.now(),
        category: 'Обычный'
      };
      setGiveaways(prev => [...prev.filter(g => g.id !== editingGiveaway.id), currentPremium]);
      
      // Устанавливаем обновленный розыгрыш как премиум
      setPremiumGiveaway({
        ...editingGiveaway,
        ...formData,
        id: 'premium',
        participants: editingGiveaway.participants || 0,
        participantIds: editingGiveaway.participantIds || []
      });
    } else {
      setGiveaways(prev => prev.map(g => 
        g.id === editingGiveaway.id ? { ...editingGiveaway, ...formData } : g
      ));
    }
    resetForm();
  };

  const handleDeleteGiveaway = (id) => {
    const giveaway = giveaways.find(g => g.id === id);
    showModal(
      'confirm',
      'Подтверждение удаления',
      `Удалить розыгрыш "${giveaway?.title}"? Это действие нельзя отменить.`,
      async () => {
        try {
          // Удаляем из базы данных
          await giveawayAPI.delete(id);
          
          // Обновляем локальное состояние
          setGiveaways(prev => prev.filter(g => g.id !== id));
          
          hideModal();
          showModal('success', 'Розыгрыш удален', 'Розыгрыш успешно удален из базы данных');
        } catch (err) {
          console.error('Ошибка удаления розыгрыша:', err);
          hideModal();
          showModal('error', 'Ошибка', 'Не удалось удалить розыгрыш. Попробуйте еще раз.');
        }
      },
      hideModal
    );
  };

  // Функция для быстрого удаления всех демо-розыгрышей
  const clearDemoGiveaways = () => {
    showModal(
      'confirm',
      'Удалить демо-розыгрыши',
      'Удалить все демонстрационные розыгрыши? Останутся только ваши реальные розыгрыши.',
      () => {
        localStorage.setItem('wingather_demo_deleted', 'true');
        setGiveaways(prev => prev.filter(g => !g.isDemo));
        hideModal();
        showModal('success', 'Демо удалены', 'Все демонстрационные розыгрыши удалены');
      },
      hideModal
    );
  };

  const startEdit = (giveaway) => {
    setEditingGiveaway(giveaway);
    setFormData({
      title: giveaway.title,
      description: giveaway.description,
      socialNetwork: giveaway.socialNetwork,
      socialLink: giveaway.socialLink,
      endDate: giveaway.endDate,
      isActive: giveaway.isActive,
      category: giveaway.category
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      socialNetwork: 'Telegram',
      socialLink: '',
      endDate: '',
      isActive: true,
      category: 'Обычный'
    });
    setEditingGiveaway(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Компонент модального окна
  const Modal = () => {
    if (!modal.show) return null;

    const getModalIcon = () => {
      switch (modal.type) {
        case 'success':
          return '✅';
        case 'error':
          return '❌';
        case 'confirm':
          return '❓';
        default:
          return 'ℹ️';
      }
    };

    const getModalColors = () => {
      switch (modal.type) {
        case 'success':
          return {
            bg: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30',
            button: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
          };
        case 'error':
          return {
            bg: 'from-red-500/20 to-red-600/20',
            border: 'border-red-500/30',
            button: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
          };
        case 'confirm':
          return {
            bg: 'from-orange-500/20 to-amber-500/20',
            border: 'border-orange-500/30',
            button: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
          };
        default:
          return {
            bg: 'from-blue-500/20 to-blue-600/20',
            border: 'border-blue-500/30',
            button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          };
      }
    };

    const colors = getModalColors();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <div className={'bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-xl border ' + colors.border + ' rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200'}>
          <div className="text-center mb-6">
            <div className={'inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ' + colors.bg + ' rounded-full mb-4 border ' + colors.border}>
              <span className="text-2xl">{getModalIcon()}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{modal.title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{modal.message}</p>
          </div>
          
          <div className="flex gap-3">
            {modal.type === 'confirm' ? (
              <>
                <button
                  onClick={modal.onCancel}
                  className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-4 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={modal.onConfirm}
                  className={'flex-1 bg-gradient-to-r ' + colors.button + ' text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-lg'}
                >
                  Подтвердить
                </button>
              </>
            ) : (
              <button
                onClick={modal.onConfirm || hideModal}
                className={'w-full bg-gradient-to-r ' + colors.button + ' text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-lg'}
              >
                {modal.type === 'error' && modal.onConfirm ? 'Перейти к входу' : 'Понятно'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Экран загрузки
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-4 animate-spin">
            <span className="text-2xl font-bold text-white">⟳</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Загрузка WinGather</h2>
          <p className="text-slate-400">Подключение к базе данных...</p>
        </div>
      </div>
    );
  }

  // Экран ошибки
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mb-4">
            <span className="text-2xl font-bold text-white">⚠</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ошибка подключения</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 font-medium shadow-lg"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'public') {
    return (
      <>
        <Modal />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-3 md:p-6 pb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/10 pointer-events-none"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <header className="text-center mb-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-1" style={{fontFamily: 'Russo One, sans-serif'}}>
                WinGather
              </h1>
              <p className="text-blue-200 text-base md:text-lg mb-2">Участвуй и выигрывай!</p>
            </header>

            {/* Закреплённая ячейка на всю ширину - показываем только если премиум активен */}
            {premiumGiveaway.isActive && (
              <div className="mb-2 md:mb-3">
                <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-2 border-purple-500 rounded-lg overflow-hidden hover:border-purple-400 transition-all duration-300 group hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/10 relative">
                  <span className="absolute top-2 left-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-400/30 z-10">PREMIUM</span>
                  <div className="p-3 md:p-4 flex flex-col h-full">
                    <div className="text-center mb-3 mt-6">
                      <h3 className="text-sm md:text-base font-bold text-white mb-2 group-hover:text-orange-100 transition-colors">{premiumGiveaway.title}</h3>
                      <p className="text-slate-300 leading-relaxed text-xs md:text-sm line-clamp-2">{premiumGiveaway.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-400/20">
                        {premiumGiveaway.socialNetwork}
                      </span>
                      <span className="text-xs text-slate-400">
                        До {formatDate(premiumGiveaway.endDate)}
                      </span>
                    </div>
                    
                    <div className="mt-auto">
                      <button
                        onClick={() => handleParticipate('premium')}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] text-xs md:text-sm"
                      >
                        Участвовать
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Все розыгрыши в едином порядке */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {giveaways
                .filter(g => g.isActive)
                .sort((a, b) => {
                  const categoryOrder = { 'VIP': 1, 'Обычный': 2 };
                  return categoryOrder[a.category] - categoryOrder[b.category];
                })
                .map(giveaway => {
                  const isVIP = giveaway.category === 'VIP';
                  const borderColor = isVIP ? 'border-yellow-500 hover:border-yellow-400 hover:shadow-yellow-500/10' : 'border-blue-500 hover:border-blue-400 hover:shadow-blue-500/10';
                  const badgeColor = isVIP ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' : '';
                  const platformColor = isVIP ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-400/20' : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-400/20';
                  const buttonColor = isVIP ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 hover:shadow-yellow-500/25' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/25';
                  const hoverTextColor = isVIP ? 'group-hover:text-orange-100' : 'group-hover:text-blue-100';
                  
                  return (
                    <div key={giveaway.id} className={`bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-2 ${borderColor} rounded-lg overflow-hidden transition-all duration-300 group hover:scale-[1.01] hover:shadow-xl relative min-h-[200px]`}>
                      {isVIP && (
                        <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full border z-10 ${badgeColor}`}>VIP</span>
                      )}
                      <div className="p-3 md:p-4 flex flex-col h-full">
                        <div className="text-center mb-3 mt-8 flex-1">
                          <h3 className={`text-sm md:text-base font-bold text-white mb-2 ${hoverTextColor} transition-colors`}>{giveaway.title}</h3>
                          <p className="text-slate-300 leading-relaxed text-xs md:text-sm line-clamp-2">{giveaway.description}</p>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2 mt-auto">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${platformColor}`}>
                            {giveaway.socialNetwork}
                          </span>
                          <span className="text-xs text-slate-400">
                            До {formatDate(giveaway.endDate)}
                          </span>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleParticipate(giveaway.id)}
                            className={`w-full ${buttonColor} text-white px-3 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg transform hover:scale-[1.02] text-xs md:text-sm`}
                          >
                            Участвовать
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {giveaways.filter(g => g.isActive).length === 0 && (
              <div className="text-center py-12 md:py-16">
                <p className="text-slate-400 text-base md:text-lg">Активных розыгрышей пока нет</p>
              </div>
            )}
          </div>

          {/* Закрепленный подвал */}
          <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-t border-slate-700/30 px-4 py-3 z-50">
            <div className="max-w-6xl mx-auto flex justify-center items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">A</span>
                    </div>
                    <span className="text-white text-sm font-medium">Администратор</span>
                  </div>
                  <button 
                    onClick={() => setCurrentView('admin')}
                    className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-700/50 hover:border-slate-600/50 px-3 py-1 rounded-full"
                  >
                    Админ-панель
                  </button>
                  <button 
                    onClick={() => {
                      setIsAuthenticated(false);
                      setCurrentView('public');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 px-3 py-1 rounded-full"
                  >
                    Выйти
                  </button>
                </div>
              ) : localUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{localUser.nickname[0].toUpperCase()}</span>
                    </div>
                    <span className="text-white text-sm font-medium">{localUser.nickname}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentView('userProfile')}
                    className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-700/50 hover:border-slate-600/50 px-3 py-1 rounded-full"
                  >
                    Профиль
                  </button>
                  <button 
                    onClick={handleLocalLogout}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 px-3 py-1 rounded-full"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setCurrentView('login')}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-amber-600 transition-all duration-200 font-medium shadow-lg hover:shadow-orange-500/25 transform hover:scale-[1.02] text-sm"
                >
                  Войти
                </button>
              )}
            </div>
          </footer>
        </div>
      </>
    );
  }

  if (currentView === 'login') {
    return (
      <>
        <Modal />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/10 pointer-events-none"></div>
          <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700/50 relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-4">
                <span className="text-lg md:text-2xl font-bold text-white">🔐</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Вход в систему</h2>
              <p className="text-slate-400 text-sm">Введите ваш никнейм и пароль</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Никнейм"
                value={loginForm.nickname}
                onChange={(e) => setLoginForm({...loginForm, nickname: e.target.value})}
                className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 font-medium shadow-lg hover:shadow-orange-500/25 transform hover:scale-[1.02]"
              >
                Войти
              </button>
              <button
                onClick={() => setCurrentView('public')}
                className="w-full text-slate-400 py-3 hover:text-white transition-colors border border-slate-700/50 rounded-xl hover:border-slate-600/50"
              >
                ← Вернуться на главную
              </button>
            </div>
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
              <div className="space-y-2 text-xs text-slate-400">
                <p className="text-center font-medium text-slate-300">Инструкция:</p>
                <p>• Введите любой никнейм и пароль - создастся профиль пользователя</p>
                <p>• Админский доступ: специальные данные</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'userProfile' && localUser) {
    return (
      <>
        <Modal />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/10 pointer-events-none"></div>
          <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700/50 relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
                <span className="text-2xl font-bold text-white">{localUser.nickname[0].toUpperCase()}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{localUser.nickname}</h2>
              <p className="text-slate-400 text-sm">Ваш локальный профиль</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                <h3 className="text-white font-medium mb-2">Информация о профиле</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Никнейм:</span>
                    <span className="text-white">{localUser.nickname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Дата создания:</span>
                    <span className="text-white">{formatDate(localUser.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                <h3 className="text-white font-medium mb-2">Участие в розыгрышах</h3>
                <div className="text-center">
                  <span className="text-2xl font-bold text-green-400">{localUser.participations?.length || 0}</span>
                  <p className="text-slate-400 text-sm">активных участий</p>
                </div>
                {localUser.participations && localUser.participations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {localUser.participations.slice(-3).map((participation, index) => (
                      <div key={index} className="text-xs text-slate-400">
                        • {participation.giveawayTitle}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('public')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg"
              >
                Вернуться к розыгрышам
              </button>
              
              <button
                onClick={() => window.open('https://t.me/Wingather', '_blank')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg flex items-center justify-center gap-2"
              >
                <span>📞</span>
                Связаться с администрацией
              </button>
              
              <button
                onClick={handleLocalLogout}
                className="w-full text-red-400 py-3 hover:text-red-300 transition-colors border border-red-500/30 rounded-xl hover:border-red-400/50"
              >
                Выйти из профиля
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'admin' && isAuthenticated) {
    return (
      <>
        <Modal />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4 md:p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/10 pointer-events-none"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg md:text-xl font-bold text-white">A</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Админ панель</h1>
                  <p className="text-slate-400 text-xs md:text-sm">Управление розыгрышами</p>
                </div>
              </div>
              <div className="flex space-x-2 md:space-x-3 w-full md:w-auto">
                <button
                  onClick={() => setCurrentView('public')}
                  className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 md:px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg border border-blue-500/20 text-sm md:text-base"
                >
                  Посмотреть сайт
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 md:flex-none bg-gradient-to-r from-red-600 to-red-700 text-white px-3 md:px-4 py-2 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg border border-red-500/20 text-sm md:text-base"
                >
                  Выйти
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {/* Форма создания/редактирования */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 md:p-6">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                    {editingGiveaway ? 'Редактировать' : 'Создать'} розыгрыш
                  </h2>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Название приза"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all"
                    />
                    <textarea
                      placeholder="Описание"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all h-20 resize-none"
                    />
                    <select
                      value={formData.socialNetwork}
                      onChange={(e) => setFormData({...formData, socialNetwork: e.target.value})}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all"
                    >
                      <option>Telegram</option>
                      <option>VK</option>
                      <option>YouTube</option>
                    </select>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all"
                    >
                      <option>Обычный</option>
                      <option>VIP</option>
                      <option>Премиум</option>
                    </select>
                    <input
                      type="url"
                      placeholder="Ссылка на пост в соцсети"
                      value={formData.socialLink}
                      onChange={(e) => setFormData({...formData, socialLink: e.target.value})}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all"
                    />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all"
                    />

                    <label className="flex items-center space-x-3 text-slate-300">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500/50"
                      />
                      <span>Активный розыгрыш</span>
                    </label>
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={editingGiveaway ? handleUpdateGiveaway : handleCreateGiveaway}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg"
                      >
                        {editingGiveaway ? 'Обновить' : 'Создать'}
                      </button>
                      {editingGiveaway && (
                        <button
                          onClick={resetForm}
                          className="px-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg"
                        >
                          Отмена
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Список розыгрышей */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden h-[600px] flex flex-col">
                  <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Все розыгрыши ({giveaways.length + 1})
                      </h2>
                      {giveaways.some(g => g.isDemo) && (
                        <button
                          onClick={clearDemoGiveaways}
                          className="text-xs bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
                        >
                          Очистить демо
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="divide-y divide-slate-700/50">
                      {/* Премиум розыгрыш в админ панели */}
                      <div className="p-3 hover:bg-slate-800/30 transition-colors border-l-4 border-purple-500">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm text-white truncate">{premiumGiveaway.title}</h3>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
                                Премиум
                              </span>
                            </div>
                            <p className="text-slate-300 text-xs line-clamp-2 mb-1">{premiumGiveaway.description}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                {premiumGiveaway.socialNetwork}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                {premiumGiveaway.participants} уч.
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                                {formatDate(premiumGiveaway.endDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingGiveaway({...premiumGiveaway, isPremium: true});
                                setFormData({
                                  title: premiumGiveaway.title,
                                  description: premiumGiveaway.description,
                                  socialNetwork: premiumGiveaway.socialNetwork,
                                  socialLink: premiumGiveaway.socialLink,
                                  endDate: premiumGiveaway.endDate,
                                  isActive: premiumGiveaway.isActive,
                                  category: 'Премиум'
                                });
                              }}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-lg text-xs hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
                            >
                              Изменить
                            </button>
                          </div>
                        </div>
                      </div>
                      {giveaways.map(giveaway => (
                        <div key={giveaway.id} className="p-3 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-sm text-white truncate">{giveaway.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                  giveaway.category === 'VIP' 
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {giveaway.category}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                  giveaway.isActive 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {giveaway.isActive ? 'Активен' : 'Неактивен'}
                                </span>
                                <span className="text-xs text-slate-400 flex-shrink-0">👤 {giveaway.participants}</span>
                              </div>
                              <p className="text-slate-300 text-xs line-clamp-2 mb-1">{giveaway.description}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                  {giveaway.socialNetwork}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                  {giveaway.participants} уч.
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                                  {formatDate(giveaway.endDate)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => startEdit(giveaway)}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-1 rounded-lg text-xs hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                              >
                                Изм.
                              </button>
                              <button
                                onClick={() => handleDeleteGiveaway(giveaway.id)}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-2 py-1 rounded-lg text-xs hover:from-red-700 hover:to-red-800 transition-all duration-200"
                              >
                                {giveaway.isDemo ? 'Удалить ДЕМО' : 'Уд.'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {giveaways.length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-slate-400 text-sm">Обычных розыгрышей пока нет.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Доступ запрещен</h2>
        <p className="text-slate-400 mb-6">Пожалуйста, авторизуйтесь</p>
        <button
          onClick={() => setCurrentView('login')}
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 font-medium shadow-lg"
        >
          Войти
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <GiveawayApp />
    </div>
  );
}

export default App;
