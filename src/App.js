import React, { useState, useEffect } from 'react';
import './App.css';
import { giveawayAPI, premiumAPI, participantAPI, userAPI } from './api';

function App() {
  console.log('🚀 DEV VERSION LOADED - ' + new Date().toLocaleTimeString());
  
  const [currentView, setCurrentView] = useState('main');
  const [giveaways, setGiveaways] = useState([]);
  const [premiumGiveaway, setPremiumGiveaway] = useState(null);
  const [localUser, setLocalUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState(null);
  const [showGiveawayModal, setShowGiveawayModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGiveaway, setDeletingGiveaway] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [participantsData, setParticipantsData] = useState([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [viewingParticipants, setViewingParticipants] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // DEV: Mock data для разработки
  const mockGiveaways = [
    {
      id: 1,
      title: 'iPhone 15 Pro (DEV)',
      description: 'Супер розыгрыш нового iPhone 15 Pro! Участвуй и выигрывай крутой смартфон.',
      social_network: 'Telegram',
      social_link: 'https://t.me/wingather',
      end_date: '2025-02-01',
      is_active: true,
      category: 'VIP',
      participants_count: 142
    },
    {
      id: 2,
      title: 'AirPods Pro 2 (DEV)',
      description: 'Беспроводные наушники Apple AirPods Pro 2-го поколения с активным шумоподавлением.',
      social_network: 'Telegram', 
      social_link: 'https://t.me/wingather',
      end_date: '2025-01-25',
      is_active: true,
      category: 'Обычный',
      participants_count: 87
    },
    {
      id: 3,
      title: 'MacBook Air M3 (DEV)',
      description: 'Мощный и стильный ноутбук Apple MacBook Air с чипом M3 для работы и творчества.',
      social_network: 'YouTube',
      social_link: 'https://youtube.com/@wingather',
      end_date: '2025-03-15',
      is_active: true,
      category: 'VIP',
      participants_count: 256
    },
    {
      id: 4,
      title: 'PlayStation 5 (DEV)',
      description: 'Игровая консоль нового поколения Sony PlayStation 5 с играми в комплекте.',
      social_network: 'VK',
      social_link: 'https://vk.com/wingather',
      end_date: '2025-01-20',
      is_active: true,
      category: 'Обычный',
      participants_count: 198
    }
  ];

  const mockPremiumGiveaway = {
    id: 'premium',
    title: 'Tesla Model 3 (PREMIUM DEV)',
    description: 'Невероятный премиум розыгрыш электромобиля Tesla Model 3! Самый крутой приз в истории WinGather.',
    social_network: 'YouTube',
    social_link: 'https://youtube.com/@wingather',
    end_date: '2025-06-01',
    is_active: true,
    participants_count: 1337
  };

  // Загрузка данных
  const loadGiveaways = async () => {
    try {
      // В dev режиме используем mock данные
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 DEV: Using mock giveaways data');
        setGiveaways(mockGiveaways);
        return;
      }
      
      const data = await giveawayAPI.getAll();
      setGiveaways(data);
    } catch (error) {
      console.error('Ошибка загрузки розыгрышей:', error);
      // Fallback to mock data on error
      console.log('🔧 DEV: Fallback to mock data due to error');
      setGiveaways(mockGiveaways);
      showMessageModal('DEV: Используются тестовые данные', 'Не удалось подключиться к API, используются моковые данные', 'warning');
    }
  };

  const loadPremiumGiveaway = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 DEV: Using mock premium giveaway data');
        setPremiumGiveaway(mockPremiumGiveaway);
        return;
      }
      
      const data = await premiumAPI.get();
      setPremiumGiveaway(data);
    } catch (error) {
      console.error('Ошибка загрузки премиум розыгрыша:', error);
      setPremiumGiveaway(mockPremiumGiveaway);
    }
  };

  const loadParticipants = async (giveawayId, isPremium = false) => {
    try {
      // Mock participants для dev
      const mockParticipants = [
        { id: 1, user_name: 'DevUser1', created_at: new Date().toISOString() },
        { id: 2, user_name: 'TestUser2', created_at: new Date().toISOString() },
        { id: 3, user_name: 'DemoUser3', created_at: new Date().toISOString() }
      ];
      setParticipantsData(mockParticipants);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      showMessageModal('Ошибка', 'Не удалось загрузить список участников', 'error');
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    console.log('🔧 DEV: Loading initial data...');
    loadGiveaways();
    loadPremiumGiveaway();
    
    // Проверяем локального пользователя
    const savedUser = localStorage.getItem('wingather_user_dev');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      console.log('🔧 DEV: Loaded saved user:', userData);
      setLocalUser(userData);
    }

    // Проверяем админскую аутентификацию
    const isAdmin = localStorage.getItem('wingather_admin_dev') === 'true';
    setIsAdminAuthenticated(isAdmin);
    if (isAdmin) {
      console.log('🔧 DEV: Admin mode active');
    }
  }, []);

  const handleLocalLogout = () => {
    localStorage.removeItem('wingather_user_dev');
    setLocalUser(null);
    setShowUserProfile(false);
    showMessageModal('Выход выполнен', 'Вы успешно вышли из аккаунта (DEV)', 'success');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123' || adminPassword === 'dev') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('wingather_admin_dev', 'true');
      setShowAdminLogin(false);
      setAdminPassword('');
      showMessageModal('Вход в админ панель', 'Добро пожаловать в DEV админ панель!', 'success');
    } else {
      showMessageModal('Ошибка', 'Неверный пароль администратора (попробуйте "dev")', 'error');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('wingather_admin_dev');
    showMessageModal('Выход из админ панели', 'Вы вышли из DEV админ панели', 'info');
  };

  const showMessageModal = (title, message, type = 'info') => {
    setModalContent({ title, message, type });
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const handleGiveawayClick = (giveaway) => {
    setSelectedGiveaway(giveaway);
    setShowGiveawayModal(true);
  };

  const handleParticipate = async (giveaway, isPremium = false) => {
    if (!localUser) {
      showMessageModal('Требуется авторизация', 'Войдите в аккаунт для участия в розыгрыше', 'warning');
      return;
    }

    console.log('🔧 DEV: Simulating participation...', { giveaway: giveaway.title, isPremium });

    try {
      // В dev режиме имитируем успешное участие
      showMessageModal('Участие принято! (DEV)', `Вы успешно участвуете в розыгрыше "${giveaway.title}"`, 'success');
      
      // Имитируем обновление счетчика
      if (isPremium) {
        setPremiumGiveaway(prev => ({
          ...prev,
          participants_count: (prev.participants_count || 0) + 1
        }));
      } else {
        setGiveaways(prev => prev.map(g => 
          g.id === giveaway.id 
            ? { ...g, participants_count: (g.participants_count || 0) + 1 }
            : g
        ));
      }

      // Переход на внешнюю платформу
      const link = isPremium ? premiumGiveaway.social_link : giveaway.social_link;
      if (link) {
        console.log('🔧 DEV: Would open link:', link);
        // В dev режиме не открываем окна
        // window.open(link, '_blank');
      }
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Произошла ошибка при участии в розыгрыше', 'error');
    }
  };

  // ==================== АДМИН ФУНКЦИИ (DEV) ====================

  const handleCreateGiveaway = async (giveawayData) => {
    try {
      console.log('🔧 DEV: Creating giveaway:', giveawayData);
      
      // Имитируем создание розыгрыша
      const newGiveaway = {
        id: Date.now(),
        title: giveawayData.title,
        description: giveawayData.description,
        social_network: giveawayData.socialNetwork,
        social_link: giveawayData.socialLink,
        end_date: giveawayData.endDate,
        category: giveawayData.category,
        is_active: giveawayData.isActive,
        participants_count: 0
      };
      
      setGiveaways(prev => [newGiveaway, ...prev]);
      setShowCreateModal(false);
      showMessageModal('Успех! (DEV)', 'Розыгрыш успешно создан в dev режиме', 'success');
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Не удалось создать розыгрыш', 'error');
    }
  };

  const handleUpdateGiveaway = async (id, updates) => {
    try {
      console.log('🔧 DEV: Updating giveaway:', { id, updates });
      
      setGiveaways(prev => prev.map(g => 
        g.id === id 
          ? {
              ...g,
              title: updates.title,
              description: updates.description,
              social_network: updates.socialNetwork,
              social_link: updates.socialLink,
              end_date: updates.endDate,
              category: updates.category,
              is_active: updates.isActive
            }
          : g
      ));
      
      setShowEditModal(false);
      setEditingGiveaway(null);
      showMessageModal('Успех! (DEV)', 'Розыгрыш успешно обновлен в dev режиме', 'success');
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Не удалось обновить розыгрыш', 'error');
    }
  };

  const handleDeleteGiveaway = async (id) => {
    try {
      console.log('🔧 DEV: Deleting giveaway:', id);
      
      setGiveaways(prev => prev.filter(g => g.id !== id));
      setShowDeleteConfirm(false);
      setDeletingGiveaway(null);
      showMessageModal('Успех! (DEV)', 'Розыгрыш успешно удален в dev режиме', 'success');
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Не удалось удалить розыгрыш', 'error');
    }
  };

  const handleUpdatePremium = async (updates) => {
    try {
      console.log('🔧 DEV: Updating premium giveaway:', updates);
      
      setPremiumGiveaway(prev => ({
        ...prev,
        title: updates.title,
        description: updates.description,
        social_network: updates.socialNetwork,
        social_link: updates.socialLink,
        end_date: updates.endDate,
        is_active: updates.isActive
      }));
      
      setShowPremiumModal(false);
      showMessageModal('Успех! (DEV)', 'Премиум розыгрыш обновлен в dev режиме', 'success');
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Не удалось обновить премиум розыгрыш', 'error');
    }
  };

  // Компонент модального окна
  const Modal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">{modalContent.title}</h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 mb-6">{modalContent.message}</p>
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-xl transition-colors"
          >
            ОК
          </button>
        </div>
      </div>
    );
  };

  // Модальное окно создания розыгрыша
  const CreateGiveawayModal = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      socialNetwork: 'Telegram',
      socialLink: '',
      endDate: '',
      category: 'Обычный',
      isActive: true
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title.trim() || !formData.description.trim() || !formData.endDate) {
        showMessageModal('Ошибка', 'Заполните все обязательные поля', 'error');
        return;
      }
      handleCreateGiveaway(formData);
    };

    if (!showCreateModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Создать розыгрыш (DEV)</h3>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  title: '',
                  description: '',
                  socialNetwork: 'Telegram',
                  socialLink: '',
                  endDate: '',
                  category: 'Обычный',
                  isActive: true
                });
              }}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Название розыгрыша *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                placeholder="Введите название розыгрыша"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Описание *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 resize-none"
                placeholder="Опишите призы и условия розыгрыша"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Социальная сеть</label>
                <select
                  value={formData.socialNetwork}
                  onChange={(e) => setFormData({...formData, socialNetwork: e.target.value})}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Telegram">Telegram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="VK">ВКонтакте</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Категория</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Обычный">Обычный</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Ссылка на канал/группу</label>
              <input
                type="url"
                value={formData.socialLink}
                onChange={(e) => setFormData({...formData, socialLink: e.target.value})}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                placeholder="https://t.me/yourchannel"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Дата окончания *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="isActive" className="text-white text-sm">
                Активировать розыгрыш сразу после создания
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    title: '',
                    description: '',
                    socialNetwork: 'Telegram',
                    socialLink: '',
                    endDate: '',
                    category: 'Обычный',
                    isActive: true
                  });
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 px-6 rounded-xl transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-6 rounded-xl transition-colors font-medium"
              >
                Создать розыгрыш
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Компонент авторизации
  const AuthView = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!nickname.trim() || !password.trim()) {
        showMessageModal('Ошибка', 'Заполните все поля', 'error');
        return;
      }

      setLoading(true);
      console.log('🔧 DEV: Auth attempt:', { nickname, isLogin });
      
      try {
        // В dev режиме имитируем авторизацию
        const userData = { 
          id: `dev_${Date.now()}`, 
          nickname: nickname.trim(), 
          createdAt: new Date().toISOString() 
        };
        
        setLocalUser(userData);
        localStorage.setItem('wingather_user_dev', JSON.stringify(userData));
        setCurrentView('main');
        
        const message = isLogin 
          ? `Вы успешно вошли как ${nickname} (DEV)` 
          : `Добро пожаловать, ${nickname}! (DEV)`;
        showMessageModal(isLogin ? 'Добро пожаловать!' : 'Регистрация успешна!', message, 'success');
      } catch (error) {
        showMessageModal('Ошибка', error.message || 'Произошла ошибка', 'error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-russo bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
              WinGather
            </h1>
            <p className="text-slate-400">{isLogin ? 'Вход в аккаунт' : 'Создание аккаунта'}</p>
            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full mt-2 inline-block">
              DEV MODE
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Никнейм</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                placeholder="Введите никнейм"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                placeholder="Введите пароль"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-6 rounded-xl transition-all duration-200 font-medium"
            >
              {loading ? 'Загрузка...' : (isLogin ? 'Войти (DEV)' : 'Зарегистрироваться (DEV)')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Есть аккаунт? Войдите'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setCurrentView('main')}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              ← Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Компонент админского входа
  const AdminLoginModal = () => {
    if (!showAdminLogin) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Вход в админ панель (DEV)</h3>
            <button
              onClick={() => setShowAdminLogin(false)}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Пароль администратора</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white"
                placeholder='Введите пароль (попробуйте "dev")'
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <button
              onClick={handleAdminLogin}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-xl transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Рендер в зависимости от текущего вида
  if (currentView === 'login') {
    return (
      <>
        <Modal />
        <AdminLoginModal />
        <AuthView />
      </>
    );
  }

  if (currentView === 'admin' && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold font-russo bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Админ-панель
              </h1>
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                DEV MODE
              </span>
            </div>
            <button
              onClick={() => setCurrentView('main')}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition-colors"
            >
              ← На главную
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-6 rounded-2xl transition-all duration-200 text-left"
            >
              <h3 className="text-xl font-bold mb-2">Создать розыгрыш (DEV)</h3>
              <p className="text-green-100">Добавить новый розыгрыш для тестирования</p>
            </button>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Управление розыгрышами (DEV)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {giveaways.map((giveaway) => (
                <div key={giveaway.id} className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      giveaway.category === 'VIP' 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {giveaway.category}
                    </span>
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                      DEV
                    </span>
                  </div>
                  
                  <h3 className="text-white font-bold mb-2">{giveaway.title}</h3>
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">{giveaway.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs">До {formatDate(giveaway.end_date)}</span>
                    <span className="text-slate-400 text-xs">{giveaway.participants_count || 0} участников</span>
                  </div>

                  <div className="text-center text-slate-400 text-xs py-2">
                    DEV: Редактирование и удаление доступны в полной версии
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Modal />
        <CreateGiveawayModal />
      </div>
    );
  }

  // Сортировка розыгрышей: VIP сначала, потом обычные
  const sortedGiveaways = [...giveaways].sort((a, b) => {
    if (a.category === 'VIP' && b.category !== 'VIP') return -1;
    if (a.category !== 'VIP' && b.category === 'VIP') return 1;
    return 0;
  });

  // Главная страница
  return (
    <>
      <Modal />
      <AdminLoginModal />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative pb-16">
        {/* DEV Badge */}
        <div className="fixed top-4 right-4 z-50">
          <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full">
            🔧 DEV MODE
          </span>
        </div>

        {/* Заголовок по центру вверху */}
        <div className="text-center pt-8 pb-6">
          <h1 className="text-6xl font-bold font-russo bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            WinGather
          </h1>
          <p className="text-slate-400 text-xl">Участвуй и выигрывай!</p>
          <span className="text-sm text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full mt-2 inline-block">
            Development Version
          </span>
        </div>

        {/* Основной контент */}
        <div className="max-w-6xl mx-auto px-3 md:px-6 pb-20">
          {/* Премиум розыгрыш */}
          {premiumGiveaway && premiumGiveaway.is_active && (
            <div 
              onClick={() => handleGiveawayClick({...premiumGiveaway, id: 'premium'})}
              className="mb-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl p-6 cursor-pointer hover:border-purple-400/70 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  PREMIUM
                </span>
                <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                  DEV
                </span>
                <span className="text-slate-400 text-sm">До {formatDate(premiumGiveaway.end_date)}</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">
                {premiumGiveaway.title}
              </h3>
              
              <p className="text-slate-300 text-center leading-relaxed mb-4">
                {premiumGiveaway.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-sm">{premiumGiveaway.social_network}</span>
                  <span className="text-slate-400 text-xs">({premiumGiveaway.participants_count} участников)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleParticipate(premiumGiveaway, true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg"
                >
                  Участвовать (DEV)
                </button>
              </div>
            </div>
          )}

          {/* Сетка розыгрышей 2x2 */}
          <div className="grid grid-cols-2 gap-6">
            {sortedGiveaways.filter(g => g.is_active).map((giveaway) => (
              <div 
                key={giveaway.id}
                onClick={() => handleGiveawayClick(giveaway)}
                className={`bg-slate-800/50 backdrop-blur-xl border-2 rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] min-h-[200px] ${
                  giveaway.category === 'VIP' 
                    ? 'border-yellow-500/50 hover:border-yellow-400/70' 
                    : 'border-blue-500/50 hover:border-blue-400/70'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    giveaway.category === 'VIP' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {giveaway.category}
                  </span>
                  <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                    DEV
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 text-center leading-tight">
                  {giveaway.title}
                </h3>

                <p className="text-slate-300 text-sm text-center mb-4 line-clamp-3">
                  {giveaway.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-xs">До {formatDate(giveaway.end_date)}</span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <span>👤</span>
                    <span>{giveaway.participants_count || 0}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleParticipate(giveaway);
                  }}
                  className={`w-full py-3 px-4 rounded-xl transition-all duration-200 font-medium ${
                    giveaway.category === 'VIP'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                  }`}
                >
                  Участвовать (DEV)
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-t border-slate-700/30 px-4 py-3 z-50">
          <div className="max-w-6xl mx-auto flex justify-center items-center gap-4">
            {isAdminAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <span className="text-white text-sm font-medium">Администратор (DEV)</span>
                </div>
                <button 
                  onClick={() => setCurrentView('admin')}
                  className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-700/50 hover:border-slate-600/50 px-3 py-1 rounded-full"
                >
                  Админ-панель
                </button>
                <button 
                  onClick={handleAdminLogout}
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
                  <span className="text-white text-sm font-medium">{localUser.nickname} (DEV)</span>
                </div>
                <button 
                  onClick={handleLocalLogout}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 px-3 py-1 rounded-full"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setCurrentView('login')}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-amber-600 transition-all duration-200 font-medium shadow-lg hover:shadow-orange-500/25 transform hover:scale-[1.02] text-sm"
                >
                  Вход (DEV)
                </button>
                <button 
                  onClick={() => setShowAdminLogin(true)}
                  className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-700/50 hover:border-slate-600/50 px-3 py-1 rounded-full"
                >
                  ⚙️ Админ
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
