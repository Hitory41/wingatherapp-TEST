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
  const [userProfiles, setUserProfiles] = useStoredState('userProfiles', {});
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [loginForm, setLoginForm] = useState({ 
    nickname: '', 
    password: '' 
  });

  // Состояния для модальных окон
  const [modal, setModal] = useState({
    show: false,
    type: '',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  // Состояние для модального окна с информацией о розыгрыше
  const [giveawayModal, setGiveawayModal] = useState({
    show: false,
    giveaway: null
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

  // Зашифрованные данные администратора
  const encryptedAdminData = {
    nickname: 'dGhnaW5kb29H',
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

  // Функция для проверки пароля
  const checkPassword = (inputPassword) => {
    let hash = 0;
    const str = inputPassword + 'salt_key_2024';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hashedPassword = Math.abs(hash).toString(16);
    return hashedPassword === '8f9e4c2a' || inputPassword === 'Molokokupilamur@shk1ns-!';
  };

  // Загрузка данных из базы данных
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const giveawaysData = await giveawayAPI.getAll();
      
      const formattedGiveaways = giveawaysData.map(g => ({
        id: g.id,
        title: g.title,
        description: g.description,
        socialNetwork: g.social_network,
        socialLink: g.social_link,
        endDate: g.end_date,
        participants: g.participants_count,
        participantIds: [],
        isActive: g.is_active,
        category: g.category,
        isDemo: g.title.includes('(ДЕМО)')
      }));
      
      setGiveaways(formattedGiveaways);
      
      const premiumData = await premiumAPI.get();
      setPremiumGiveaway({
        id: 'premium',
        title: premiumData.title,
        description: premiumData.description,
        socialNetwork: premiumData.social_network,
        socialLink: premiumData.social_link,
        endDate: premiumData.end_date,
        participants: premiumData.participants_count,
        participantIds: [],
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

  // Функции для модального окна розыгрыша
  const showGiveawayModal = (giveaway) => {
    setGiveawayModal({
      show: true,
      giveaway: giveaway
    });
  };

  const hideGiveawayModal = () => {
    setGiveawayModal({
      show: false,
      giveaway: null
    });
  };

  // Обработка единого входа
  const handleLogin = () => {
    if (!loginForm.nickname.trim() || !loginForm.password.trim()) {
      showModal('error', 'Ошибка входа', 'Введите никнейм и пароль');
      return;
    }

    const decodedAdminNickname = decodeNickname(encryptedAdminData.nickname);
    if (loginForm.nickname === decodedAdminNickname && checkPassword(loginForm.password)) {
      setIsAuthenticated(true);
      setCurrentView('admin');
      setLoginForm({ 
        nickname: '', 
        password: '' 
      });
      showModal('success', 'Успешный вход', 'Добро пожаловать в админ-панель!');
      return;
    }

    const userKey = loginForm.nickname.trim().toLowerCase();
    const existingProfile = userProfiles[userKey];

    if (existingProfile && existingProfile.password === loginForm.password) {
      setLocalUser(existingProfile);
      setCurrentView('public');
      setLoginForm({ 
        nickname: '', 
        password: '' 
      });
      showModal('success', 'С возвращением!', `Добро пожаловать обратно, ${existingProfile.nickname}!`);
    } else if (existingProfile && existingProfile.password !== loginForm.password) {
      showModal('error', 'Неверный пароль', 'Этот никнейм уже используется с другим паролем');
    } else {
      const newUser = {
        id: `local_${Date.now()}`,
        nickname: loginForm.nickname.trim(),
        password: loginForm.password,
        createdAt: new Date().toISOString(),
        participations: []
      };
      
      setUserProfiles(prev => ({
        ...prev,
        [userKey]: newUser
      }));
      
      setLocalUser(newUser);
      setCurrentView('public');
      setLoginForm({ 
        nickname: '', 
        password: '' 
      });
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

  const handleParticipate = async (id, fromModal = false) => {
    if (fromModal) {
      hideGiveawayModal();
    }

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
        const alreadyParticipating = await participantAPI.checkParticipation(currentUser.id, null, true);
        if (alreadyParticipating) {
          showModal('error', 'Уже участвуете', 'Вы уже участвуете в этом розыгрыше!');
          return;
        }
        
        await participantAPI.addToPremium(currentUser.id, currentUser.name || currentUser.nickname);
        await premiumAPI.incrementParticipants();
        
        setPremiumGiveaway(prev => ({ 
          ...prev, 
          participants: prev.participants + 1
        }));
        
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
          
          const userKey = localUser.nickname.toLowerCase();
          setUserProfiles(prev => ({
            ...prev,
            [userKey]: updatedUser
          }));
        }
        
        showModal('success', 'Участие подтверждено!', 'Вы участвуете в премиум розыгрыше! Удачи!');
        if (premiumGiveaway.socialLink && premiumGiveaway.socialLink.trim()) {
          setTimeout(() => {
            window.open(premiumGiveaway.socialLink, '_blank');
          }, 1000);
        }
      } else {
        const giveaway = giveaways.find(g => g.id === id);
        if (!giveaway) return;
        
        const alreadyParticipating = await participantAPI.checkParticipation(currentUser.id, id, false);
        if (alreadyParticipating) {
          showModal('error', 'Уже участвуете', 'Вы уже участвуете в этом розыгрыше!');
          return;
        }
        
        await participantAPI.addToGiveaway(currentUser.id, currentUser.name || currentUser.nickname, id);
        await giveawayAPI.incrementParticipants(id);
        
        setGiveaways(prev => prev.map(g => 
          g.id === id ? { 
            ...g, 
            participants: g.participants + 1
          } : g
        ));
        
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
          
          const userKey = localUser.nickname.toLowerCase();
          setUserProfiles(prev => ({
            ...prev,
            [userKey]: updatedUser
          }));
        }
        
        showModal('success', 'Участие подтверждено!', `Вы участвуете в розыгрыше "${giveaway.title}"! Удачи!`);
        if (giveaway.socialLink && giveaway.socialLink.trim()) {
          setTimeout(() => {
            window.open(giveaway.socialLink, '_blank');
          }, 1000);
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
        
        await premiumAPI.update(formData);
        
        setPremiumGiveaway({
          ...formData,
          id: 'premium',
          participants: 0,
          participantIds: []
        });
        
        showModal('success', 'Премиум розыгрыш создан!', 'Премиум розыгрыш успешно создан и сохранен');
      } else {
        const createdGiveaway = await giveawayAPI.create(formData);
        
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
      const currentPremium = {
        ...premiumGiveaway,
        id: Date.now(),
        category: 'Обычный'
      };
      setGiveaways(prev => [...prev.filter(g => g.id !== editingGiveaway.id), currentPremium]);

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
          await giveawayAPI.delete(id);
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

  // Компонент модального окна с информацией о розыгрыше
  const GiveawayModal = () => {
    if (!giveawayModal.show || !giveawayModal.giveaway) return null;

    const giveaway = giveawayModal.giveaway;
    const isVIP = giveaway.category === 'VIP';
    const isPremium = giveaway.category === 'Премиум';
    
    const getModalColors = () => {
      if (isPremium) {
        return {
          bg: 'from-purple-500/20 to-purple-600/20',
          border: 'border-purple-500/30',
          button: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-400/30'
        };
      } else if (isVIP) {
        return {
          bg: 'from-yellow-500/20 to-amber-500/20',
          border: 'border-yellow-500/30',
          button: 'from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
        };
      } else {
        return {
          bg: 'from-blue-500/20 to-blue-600/20',
          border: 'border-blue-500/30',
          button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30'
        };
      }
    };

    const colors = getModalColors();
    const hasValidLink = giveaway.socialLink && giveaway.socialLink.trim();

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
        <div className={'bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-2 ' + colors.border + ' rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300'}>
          <div className="relative">
            <button
              onClick={hideGiveawayModal}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-10"
            >
              ✕
            </button>

            <div className={'bg-gradient-to-r ' + colors.bg + ' p-6 rounded-t-2xl border-b ' + colors.border}>
              <div className="flex items-center gap-3 mb-3">
                <span className={'px-3 py-1 rounded-full text-sm font-medium border ' + colors.badge}>
                  {giveaway.category}
                </span>
                <span className="text-slate-400 text-sm">
                  👥 {giveaway.participants} участников
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white pr-8">{giveaway.title}</h3>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-white font-medium mb-2">Описание розыгрыша:</h4>
                <p className="text-slate-300 leading-relaxed">{giveaway.description}</p>
              </div>

              {/* Блок со ссылкой УБРАН - пользователь переходит только через кнопку "Участвовать" */}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                  <div className="text-slate-400 text-xs mb-1">Платформа</div>
                  <div className="text-white font-medium">{giveaway.socialNetwork}</div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                  <div className="text-slate-400 text-xs mb-1">Окончание</div>
                  <div className="text-white font-medium">{formatDate(giveaway.endDate)}</div>
                </div>
              </div>

              {!hasValidLink && (
                <div className="mb-6 bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                  <div className="text-amber-300 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    Администратор не добавил ссылку на этот розыгрыш
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={hideGiveawayModal}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => handleParticipate(giveaway.id === 'premium' ? 'premium' : giveaway.id, true)}
                  className={'flex-2 bg-gradient-to-r ' + colors.button + ' text-white py-3 px-6 rounded-xl transition-all duration-200 font-medium shadow-lg min-w-[120px]'}
                >
                  🎯 Участвовать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Компонент обычного модального окна
  const Modal = () => {
    if (!modal.show) return null;

    const getModalIcon = () => {
      switch (modal.type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'confirm': return '❓';
        default: return 'ℹ️';
      }
    };

    const getModalColors = () => {
      switch (modal.type) {
        case 'success': return 'border-green-500/50 bg-green-900/20';
        case 'error': return 'border-red-500/50 bg-red-900/20';
        case 'confirm': return 'border-yellow-500/50 bg-yellow-900/20';
        default: return 'border-blue-500/50 bg-blue-900/20';
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <div className={`bg-slate-800/95 backdrop-blur-xl border-2 ${getModalColors()} rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{getModalIcon()}</span>
              <h3 className="text-xl font-bold text-white">{modal.title}</h3>
            </div>
            
            <p className="text-slate-300 mb-6 leading-relaxed">{modal.message}</p>
            
            <div className="flex gap-3">
              {modal.type === 'confirm' ? (
                <>
                  <button
                    onClick={modal.onCancel}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={modal.onConfirm}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-lg"
                  >
                    Подтвердить
                  </button>
                </>
              ) : (
                <button
                  onClick={modal.onConfirm || hideModal}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-lg"
                >
                  ОК
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Отображение загрузки
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Загрузка розыгрышей...</p>
        </div>
      </div>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Ошибка загрузки</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-6 rounded-xl transition-all duration-200 font-medium shadow-lg"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  // Страница входа
  if (currentView === 'login') {
    return (
      <>
        <Modal />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold font-russo bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                WinGather
              </h1>
              <p className="text-slate-400">Войдите или создайте профиль</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Никнейм</label>
                <input
                  type="text"
                  value={loginForm.nickname}
                  onChange={(e) => setLoginForm(prev => ({ 
                    ...prev, 
                    nickname: e.target.value 
                  }))}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Введите никнейм"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Пароль</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ 
                    ...prev, 
                    password: e.target.value 
                  }))}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Введите пароль"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-lg transform hover:scale-[1.02]"
              >
                Войти / Создать профиль
              </button>

              <button
                onClick={() => setCurrentView('public')}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium"
              >
                Вернуться назад
              </button>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Если никнейм новый - будет создан профиль.<br />
              Если существующий - требуется правильный пароль.
            </div>
          </div>
        </div>
      </>
    );
  }

  // Админ-панель
  if (currentView === 'admin' && isAuthenticated) {
    return (
      <>
        <Modal />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-russo bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                  Админ-панель WinGather
                </h1>
                <p className="text-slate-400">Управление розыгрышами</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('public')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Публичная страница
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Выход
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {editingGiveaway ? 'Редактировать розыгрыш' : 'Создать розыгрыш'}
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Название</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        title: e.target.value 
                      }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Название розыгрыша"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        description: e.target.value 
                      }))}
                      rows="3"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Описание розыгрыша"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Платформа</label>
                      <select
                        value={formData.socialNetwork}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          socialNetwork: e.target.value 
                        }))}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Telegram">Telegram</option>
                        <option value="VK">VK</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Discord">Discord</option>
                        <option value="TikTok">TikTok</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Категория</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          category: e.target.value 
                        }))}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Обычный">Обычный</option>
                        <option value="VIP">VIP</option>
                        <option value="Премиум">Премиум</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Ссылка на розыгрыш</label>
                    <input
                      type="url"
                      value={formData.socialLink}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        socialLink: e.target.value 
                      }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Дата окончания</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endDate: e.target.value 
                      }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          isActive: e.target.checked 
                        }))}
                        className="sr-only"
                      />
                      <div className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-orange-500' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                      <span className="ml-3 text-slate-300">Активный розыгрыш</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  {editingGiveaway ? (
                    <>
                      <button
                        onClick={handleUpdateGiveaway}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-lg"
                      >
                        Сохранить изменения
                      </button>
                      <button
                        onClick={resetForm}
                        className="bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium"
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreateGiveaway}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium shadow-lg transform hover:scale-[1.02]"
                    >
                      Создать розыгрыш
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {premiumGiveaway.isActive && (
                  <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 backdrop-blur-xl border-2 border-purple-500 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30">PREMIUM</span>
                        {premiumGiveaway.title}
                      </h3>
                      <button
                        onClick={() => startEdit(premiumGiveaway)}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Редактировать
                      </button>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{premiumGiveaway.description}</p>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{premiumGiveaway.socialNetwork}</span>
                      <span>👥 {premiumGiveaway.participants} участников</span>
                      <span>До {formatDate(premiumGiveaway.endDate)}</span>
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Активные розыгрыши ({giveaways.filter(g => g.isActive).length})</h3>
                    {giveaways.some(g => g.isDemo) && (
                      <button
                        onClick={clearDemoGiveaways}
                        className="text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-1 rounded-lg border border-yellow-500/30 transition-colors"
                      >
                        Очистить демо
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {giveaways
                      .filter(g => g.isActive)
                      .map(giveaway => {
                        const isVIP = giveaway.category === 'VIP';
                        const badgeColor = isVIP ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' : 'bg-blue-500/20 text-blue-300 border-blue-400/30';
                        
                        return (
                          <div key={giveaway.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isVIP && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs border ${badgeColor}`}>
                                    VIP
                                  </span>
                                )}
                                <h4 className="font-semibold text-white text-sm">{giveaway.title}</h4>
                                {giveaway.isDemo && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                    ДЕМО
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEdit(giveaway)}
                                  className="text-blue-400 hover:text-blue-300 text-xs p-1"
                                  title="Редактировать"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteGiveaway(giveaway.id)}
                                  className="text-red-400 hover:text-red-300 text-xs p-1"
                                  title="Удалить"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-300 text-xs mb-2 line-clamp-2">{giveaway.description}</p>
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>{giveaway.socialNetwork}</span>
                              <span>👥 {giveaway.participants}</span>
                              <span>До {formatDate(giveaway.endDate)}</span>
                            </div>
                          </div>
                        );
                      })}
                    
                    {giveaways.filter(g => g.isActive).length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <div className="text-4xl mb-2">📝</div>
                        <p>Нет активных розыгрышей</p>
                        <p className="text-sm">Создайте первый розыгрыш</p>
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

  // Публичная страница
  return (
    <>
      <Modal />
      <GiveawayModal />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative">
        {/* Заголовок по центру вверху */}
        <div className="text-center pt-8 pb-6">
          <h1 className="text-6xl font-bold font-russo bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            WinGather
          </h1>
          <p className="text-slate-400 text-xl">Участвуй и выигрывай!</p>
        </div>

        {/* Основной контент */}
        <div className="max-w-7xl mx-auto px-3 md:px-6 pb-20">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {premiumGiveaway.isActive && (
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 mb-2 md:mb-3">
                <div 
                  className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-2 border-purple-500 rounded-lg overflow-hidden hover:border-purple-400 transition-all duration-300 group hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/10 relative cursor-pointer"
                  onClick={() => showGiveawayModal({...premiumGiveaway, id: 'premium', category: 'Премиум'})}
                >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          showGiveawayModal({...premiumGiveaway, id: 'premium', category: 'Премиум'});
                        }}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] text-xs md:text-sm"
                      >
                        Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {giveaways
              .filter(g => g.isActive)
              .sort((a, b) => {
                // Сначала VIP, потом Обычные
                if (a.category === 'VIP' && b.category !== 'VIP') return -1;
                if (b.category === 'VIP' && a.category !== 'VIP') return 1;
                return 0; // Остальные по порядку
              })
              .map(giveaway => {
                const isVIP = giveaway.category === 'VIP';
                const borderColor = isVIP ? 'border-yellow-500' : 'border-blue-500';
                const hoverTextColor = isVIP ? 'group-hover:text-yellow-100' : 'group-hover:text-blue-100';
                const badgeColor = isVIP ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' : '';
                const platformColor = isVIP 
                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-400/20'
                  : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-400/20';
                const buttonColor = isVIP
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 hover:shadow-yellow-500/25'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/25';

                return (
                  <div 
                    key={giveaway.id} 
                    className={`bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-2 ${borderColor} rounded-lg overflow-hidden transition-all duration-300 group hover:scale-[1.01] hover:shadow-xl relative min-h-[200px] cursor-pointer`}
                    onClick={() => showGiveawayModal(giveaway)}
                  >
                    {isVIP && (
                      <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full border z-10 ${badgeColor}`}>VIP</span>
                    )}
                    <div className="p-3 md:p-4 flex flex-col h-full min-h-[200px]">
                      <div className="text-center mb-3 mt-8 flex-grow">
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
                      
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                        <span>👥 {giveaway.participants} участников</span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showGiveawayModal(giveaway);
                          }}
                          className={`w-full ${buttonColor} text-white px-3 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg transform hover:scale-[1.02] text-xs md:text-sm`}
                        >
                          Подробнее
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {giveaways.filter(g => g.isActive).length === 0 && !premiumGiveaway.isActive && (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-2xl font-bold text-white mb-2">Розыгрышей пока нет</h3>
                <p className="text-slate-400 text-center max-w-md">
                  В данный момент нет активных розыгрышей. Следите за обновлениями!
                </p>
              </div>
            )}
          </div>
        
        {/* Кнопка входа внизу страницы (как в оригинале) */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          {localUser ? (
            <div className="flex gap-2 items-center">
              <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white text-sm font-medium">{localUser.nickname}</span>
              </div>
              <button
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
              >
                Профиль
              </button>
              <button
                onClick={handleLocalLogout}
                className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
              >
                Выход
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('login')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg"
            >
              Вход
            </button>
          )}
        </div>

        {/* Модальное окно профиля */}
        {showUserProfile && localUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Мой профиль</h3>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Никнейм</div>
                  <div className="text-white font-medium">{localUser.nickname}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Дата регистрации</div>
                  <div className="text-white font-medium">{formatDate(localUser.createdAt)}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Участие в розыгрышах</div>
                  <div className="text-white font-medium">{localUser.participations?.length || 0}</div>
                </div>
              </div>

              {localUser.participations && localUser.participations.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">История участий</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {localUser.participations.map((participation, index) => (
                      <div key={index} className="bg-slate-700/30 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-white text-sm">{participation.giveawayTitle}</span>
                        <span className="text-slate-400 text-xs">{formatDate(participation.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GiveawayApp;
