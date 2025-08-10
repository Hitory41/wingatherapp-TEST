import React, { useState, useEffect } from 'react';
import './App.css';
import { giveawayAPI, premiumAPI, participantAPI, userAPI } from './api';

function App() {
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

  // Загрузка данных
  const loadGiveaways = async () => {
    try {
      const data = await giveawayAPI.getAll();
      setGiveaways(data);
    } catch (error) {
      console.error('Ошибка загрузки розыгрышей:', error);
      showMessageModal('Ошибка', 'Не удалось загрузить розыгрыши', 'error');
    }
  };

  const loadPremiumGiveaway = async () => {
    try {
      const data = await premiumAPI.get();
      setPremiumGiveaway(data);
    } catch (error) {
      console.error('Ошибка загрузки премиум розыгрыша:', error);
    }
  };

  const loadParticipants = async (giveawayId, isPremium = false) => {
    try {
      // Здесь должен быть запрос к API для получения списка участников
      // Пока что заглушка
      const mockParticipants = [
        { id: 1, user_name: 'Участник 1', created_at: new Date().toISOString() },
        { id: 2, user_name: 'Участник 2', created_at: new Date().toISOString() },
      ];
      setParticipantsData(mockParticipants);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      showMessageModal('Ошибка', 'Не удалось загрузить список участников', 'error');
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    loadGiveaways();
    loadPremiumGiveaway();
    
    // Проверяем локального пользователя
    const savedUser = localStorage.getItem('wingather_user');
    if (savedUser) {
      setLocalUser(JSON.parse(savedUser));
    }

    // Проверяем админскую аутентификацию
    const isAdmin = localStorage.getItem('wingather_admin') === 'true';
    setIsAdminAuthenticated(isAdmin);
  }, []);

  const handleLocalLogout = () => {
    localStorage.removeItem('wingather_user');
    setLocalUser(null);
    setShowUserProfile(false);
    showMessageModal('Выход выполнен', 'Вы успешно вышли из аккаунта', 'success');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('wingather_admin', 'true');
      setShowAdminLogin(false);
      setAdminPassword('');
      showMessageModal('Вход в админ панель', 'Добро пожаловать в админ панель!', 'success');
    } else {
      showMessageModal('Ошибка', 'Неверный пароль администратора', 'error');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('wingather_admin');
    showMessageModal('Выход из админ панели', 'Вы вышли из админ панели', 'info');
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

    try {
      if (isPremium) {
        await participantAPI.addToPremium(localUser.id, localUser.nickname);
        await premiumAPI.incrementParticipants();
      } else {
        await participantAPI.addToGiveaway(localUser.id, localUser.nickname, giveaway.id);
        await giveawayAPI.incrementParticipants(giveaway.id);
      }

      showMessageModal('Участие принято!', 'Вы успешно участвуете в розыгрыше', 'success');
      
      // Обновляем данные
      if (isPremium) {
        loadPremiumGiveaway();
      } else {
        loadGiveaways();
      }

      // Переход на внешнюю платформу
      const link = isPremium ? premiumGiveaway.social_link : giveaway.social_link;
      if (link) {
        window.open(link, '_blank');
      }
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Произошла ошибка при участии в розыгрыше', 'error');
    }
  };

  // ==================== АДМИН ФУНКЦИИ ====================

  const handleCreateGiveaway = async (giveawayData) => {
    try {
      await giveawayAPI.create(giveawayData);
      await loadGiveaways();
      setShowCreateModal(false);
      showMessageModal('Успех!', 'Розыгрыш успешно создан', 'success');
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Не удалось создать розыгрыш', 'error');
    }
  };

  const handleUpdateGiveaway = async (id, updates) => {
    try {
      await giveawayAPI.update(id, updates);
      await loadGiveaways();
      setShowEditModal(false);
      setEditingGiveaway(null);
      showMessageModal('Успех!', 'Розыгрыш успешно обновлен', 'success');
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Не удалось обновить розыгрыш', 'error');
    }
  };

  const handleDeleteGiveaway = async (id) => {
    try {
      await giveawayAPI.delete(id);
      await loadGiveaways();
      setShowDeleteConfirm(false);
      setDeletingGiveaway(null);
      showMessageModal('Успех!', 'Розыгрыш успешно удален', 'success');
    } catch (error) {
      showMessageModal('Ошибка', error.message || 'Не удалось удалить розыгрыш', 'error');
    }
  };

  const handleUpdatePremium = async (updates) => {
    try {
      await premiumAPI.update(updates);
      await loadPremiumGiveaway();
      setShowPremiumModal(false);
      showMessageModal('Успех!', 'Премиум розыгрыш обновлен', 'success');
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
            <h3 className="text-2xl font-bold text-white">Создать розыгрыш</h3>
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
                placeholder="https://t.me/yourchanne"
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

  // Модальное окно редактирования розыгрыша
  const EditGiveawayModal = () => {
    const [formData, setFormData] = useState({
      title: editingGiveaway?.title || '',
      description: editingGiveaway?.description || '',
      socialNetwork: editingGiveaway?.social_network || 'Telegram',
      socialLink: editingGiveaway?.social_link || '',
      endDate: editingGiveaway?.end_date || '',
      category: editingGiveaway?.category || 'Обычный',
      isActive: editingGiveaway?.is_active || true
    });

    useEffect(() => {
      if (editingGiveaway) {
        setFormData({
          title: editingGiveaway.title || '',
          description: editingGiveaway.description || '',
          socialNetwork: editingGiveaway.social_network || 'Telegram',
          socialLink: editingGiveaway.social_link || '',
          endDate: editingGiveaway.end_date || '',
          category: editingGiveaway.category || 'Обычный',
          isActive: editingGiveaway.is_active !== undefined ? editingGiveaway.is_active : true
        });
      }
    }, [editingGiveaway]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title.trim() || !formData.description.trim() || !formData.endDate) {
        showMessageModal('Ошибка', 'Заполните все обязательные поля', 'error');
        return;
      }
      handleUpdateGiveaway(editingGiveaway.id, formData);
    };

    if (!showEditModal || !editingGiveaway) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Редактировать розыгрыш</h3>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingGiveaway(null);
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
                id="editIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="editIsActive" className="text-white text-sm">
                Розыгрыш активен
              </label>
            </div>

            <div className="bg-slate-700/20 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2">Статистика</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Участников:</span>
                <span className="text-white font-bold">{editingGiveaway.participants_count || 0}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingGiveaway(null);
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 px-6 rounded-xl transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 px-6 rounded-xl transition-colors font-medium"
              >
                Сохранить изменения
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Модальное окно подтверждения удаления
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm || !deletingGiveaway) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Подтвердите удаление</h3>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingGiveaway(null);
              }}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
            <h4 className="text-white font-bold mb-2">{deletingGiveaway.title}</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Категория:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  deletingGiveaway.category === 'VIP' 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {deletingGiveaway.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Участников:</span>
                <span className="text-white font-bold">{deletingGiveaway.participants_count || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Статус:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  deletingGiveaway.is_active 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {deletingGiveaway.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-200 text-sm text-center">
              <strong>Внимание!</strong> Это действие нельзя отменить. 
              Розыгрыш и все связанные с ним данные будут удалены навсегда.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingGiveaway(null);
              }}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 px-6 rounded-xl transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              onClick={() => handleDeleteGiveaway(deletingGiveaway.id)}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl transition-colors font-medium"
            >
              Удалить навсегда
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Модальное окно управления премиум розыгрышем
  const PremiumModal = () => {
    const [formData, setFormData] = useState({
      title: premiumGiveaway?.title || '',
      description: premiumGiveaway?.description || '',
      socialNetwork: premiumGiveaway?.social_network || 'YouTube',
      socialLink: premiumGiveaway?.social_link || '',
      endDate: premiumGiveaway?.end_date || '',
      isActive: premiumGiveaway?.is_active || false
    });

    useEffect(() => {
      if (premiumGiveaway) {
        setFormData({
          title: premiumGiveaway.title || '',
          description: premiumGiveaway.description || '',
          socialNetwork: premiumGiveaway.social_network || 'YouTube',
          socialLink: premiumGiveaway.social_link || '',
          endDate: premiumGiveaway.end_date || '',
          isActive: premiumGiveaway.is_active || false
        });
      }
    }, [premiumGiveaway]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title.trim() || !formData.description.trim() || !formData.endDate) {
        showMessageModal('Ошибка', 'Заполните все обязательные поля', 'error');
        return;
      }
      handleUpdatePremium(formData);
    };

    if (!showPremiumModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                PREMIUM
              </span>
              <h3 className="text-2xl font-bold text-white">Премиум розыгрыш</h3>
            </div>
            <button
              onClick={() => setShowPremiumModal(false)}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Название премиум розыгрыша *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                placeholder="Введите название премиум розыгрыша"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Описание *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Опишите супер-приз и условия премиум розыгрыша"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Социальная сеть</label>
              <select
                value={formData.socialNetwork}
                onChange={(e) => setFormData({...formData, socialNetwork: e.target.value})}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="YouTube">YouTube</option>
                <option value="Telegram">Telegram</option>
                <option value="VK">ВКонтакте</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Ссылка на канал/группу *</label>
              <input
                type="url"
                value={formData.socialLink}
                onChange={(e) => setFormData({...formData, socialLink: e.target.value})}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                placeholder="https://youtube.com/@yourchannel"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Дата окончания *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="premiumIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="premiumIsActive" className="text-white text-sm">
                Показывать премиум розыгрыш на главной странице
              </label>
            </div>

            {premiumGiveaway && (
              <div className="bg-slate-700/20 rounded-xl p-4">
                <h4 className="text-white font-medium mb-3">Статистика премиум розыгрыша</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-500/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">👥</span>
                      <span className="text-purple-200 text-sm">Участники</span>
                    </div>
                    <span className="text-white text-xl font-bold">{premiumGiveaway.participants_count || 0}</span>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">📊</span>
                      <span className="text-purple-200 text-sm">Статус</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      premiumGiveaway.is_active 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {premiumGiveaway.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 px-6 rounded-xl transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl transition-colors font-medium"
              >
                Сохранить премиум розыгрыш
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Модальное окно просмотра участников
  const ParticipantsModal = () => {
    if (!showParticipantsModal || !viewingParticipants) return null;

    const isPremium = viewingParticipants.id === 'premium';

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPremium 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : viewingParticipants.category === 'VIP'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {isPremium ? 'PREMIUM' : viewingParticipants.category}
              </span>
              <h3 className="text-xl font-bold text-white">Участники</h3>
            </div>
            <button
              onClick={() => {
                setShowParticipantsModal(false);
                setViewingParticipants(null);
                setParticipantsData([]);
              }}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
            <h4 className="text-white font-bold text-lg mb-2">{viewingParticipants.title}</h4>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Всего участников:</span>
              <span className="text-white font-bold text-xl">{participantsData.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {participantsData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😴</div>
                <h4 className="text-white text-lg font-medium mb-2">Пока нет участников</h4>
                <p className="text-slate-400 text-sm">
                  Как только кто-то присоединится к розыгрышу, они появятся здесь
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {participantsData.map((participant, index) => (
                  <div key={participant.id} className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{participant.user_name[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <h5 className="text-white font-medium">{participant.user_name}</h5>
                          <p className="text-slate-400 text-sm">Участник #{index + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">Присоединился</p>
                        <p className="text-white text-sm">{formatDate(participant.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Детальное модальное окно розыгрыша
  const GiveawayModal = () => {
    if (!showGiveawayModal || !selectedGiveaway) return null;

    const isPremium = selectedGiveaway.id === 'premium';

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPremium 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : selectedGiveaway.category === 'VIP'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {isPremium ? 'PREMIUM' : selectedGiveaway.category}
              </span>
              {isAdminAuthenticated && (
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
                  onClick={() => {
                    setViewingParticipants(selectedGiveaway);
                    loadParticipants(selectedGiveaway.id, isPremium);
                    setShowParticipantsModal(true);
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-700/50 hover:border-slate-600/50 px-2 py-1 rounded-full"
                >
                  👥 Участники
                </button>
              )}
            </div>
            <button
              onClick={() => setShowGiveawayModal(false)}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            {selectedGiveaway.title}
          </h2>

          <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
            <p className="text-slate-300 leading-relaxed text-center">
              {selectedGiveaway.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-700/20 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2">Социальная сеть</h4>
              <p className="text-slate-300">{selectedGiveaway.social_network}</p>
            </div>
            <div className="bg-slate-700/20 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2">Окончание</h4>
              <p className="text-slate-300">{formatDate(selectedGiveaway.end_date)}</p>
            </div>
          </div>

          <div className="bg-slate-700/20 rounded-xl p-4 mb-6">
            <h4 className="text-white font-medium mb-2">Участники</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className="text-xl font-bold text-white">
                {selectedGiveaway.participants_count || 0} участников
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              handleParticipate(selectedGiveaway, isPremium);
              setShowGiveawayModal(false);
            }}
            className={`w-full py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg ${
              isPremium
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                : selectedGiveaway.category === 'VIP'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
            }`}
          >
            Участвовать в розыгрыше
          </button>
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
            <h3 className="text-xl font-bold text-white">Вход в админ панель</h3>
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
                placeholder="Введите пароль"
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

  // Профиль пользователя
  const UserProfile = () => {
    if (!showUserProfile || !localUser) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Профиль пользователя</h3>
            <button
              onClick={() => setShowUserProfile(false)}
              className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">{localUser.nickname[0].toUpperCase()}</span>
            </div>
            <h4 className="text-white text-xl font-bold">{localUser.nickname}</h4>
            <p className="text-slate-400 text-sm">Пользователь с {formatDate(localUser.createdAt)}</p>
          </div>

          <button
            onClick={handleLocalLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl transition-colors font-medium"
          >
            Выйти из аккаунта
          </button>
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
      
      try {
        if (isLogin) {
          // Вход
          const user = await userAPI.findByNickname(nickname.trim());
          if (user && user.password_hash === password) {
            const userData = { 
              id: user.id, 
              nickname: user.nickname, 
              createdAt: user.created_at 
            };
            setLocalUser(userData);
            localStorage.setItem('wingather_user', JSON.stringify(userData));
            setCurrentView('main');
            showMessageModal('Добро пожаловать!', `Вы успешно вошли как ${nickname}`, 'success');
          } else {
            showMessageModal('Ошибка', 'Неверный никнейм или пароль', 'error');
          }
        } else {
          // Регистрация
          const userData = await userAPI.create(nickname.trim(), password);
          const userForStorage = { 
            id: userData.id, 
            nickname: userData.nickname, 
            createdAt: userData.created_at 
          };
          setLocalUser(userForStorage);
          localStorage.setItem('wingather_user', JSON.stringify(userForStorage));
          setCurrentView('main');
          showMessageModal('Регистрация успешна!', `Добро пожаловать, ${nickname}!`, 'success');
        }
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
              {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
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

  // Админ-панель
  const AdminView = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold font-russo bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Админ-панель
            </h1>
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
              <h3 className="text-xl font-bold mb-2">Создать розыгрыш</h3>
              <p className="text-green-100">Добавить новый розыгрыш для пользователей</p>
            </button>

            <button
              onClick={() => setShowPremiumModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-6 rounded-2xl transition-all duration-200 text-left"
            >
              <h3 className="text-xl font-bold mb-2">Премиум розыгрыш</h3>
              <p className="text-purple-100">Настроить премиум розыгрыш</p>
            </button>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Управление розыгрышами</h2>
            
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
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      giveaway.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {giveaway.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  
                  <h3 className="text-white font-bold mb-2">{giveaway.title}</h3>
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">{giveaway.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs">До {formatDate(giveaway.end_date)}</span>
                    <span className="text-slate-400 text-xs">{giveaway.participants_count || 0} участников</span>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => {
                        setEditingGiveaway(giveaway);
                        setShowEditModal(true);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        setDeletingGiveaway(giveaway);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      Удалить
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setViewingParticipants(giveaway);
                      loadParticipants(giveaway.id);
                      setShowParticipantsModal(true);
                    }}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                  >
                    👥 Участники ({giveaway.participants_count || 0})
                  </button>
                </div>
              ))}
            </div>
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
      <>
        <Modal />
        <CreateGiveawayModal />
        <EditGiveawayModal />
        <DeleteConfirmModal />
        <PremiumModal />
        <ParticipantsModal />
        <AdminView />
      </>
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
      <GiveawayModal />
      <UserProfile />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative pb-16">
        {/* Заголовок по центру вверху */}
        <div className="text-center pt-8 pb-6">
          <h1 className="text-6xl font-bold font-russo bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            WinGather
          </h1>
          <p className="text-slate-400 text-xl">Участвуй и выигрывай!</p>
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
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleParticipate(premiumGiveaway, true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg"
                >
                  Участвовать
                </button>
              </div>
            </div>
          )}

          {/* Сетка розыгрышей 2x2 как в оригинале */}
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
                  <span className="text-slate-400 text-xs">До {formatDate(giveaway.end_date)}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 text-center leading-tight">
                  {giveaway.title}
                </h3>

                <p className="text-slate-300 text-sm text-center mb-4 line-clamp-3">
                  {giveaway.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      giveaway.category === 'VIP' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {giveaway.social_network}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <span>👤</span>
                    <span>{giveaway.participants_count || 0} участников</span>
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
                  Подробнее
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Единый подвал как в оригинале */}
        <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-t border-slate-700/30 px-4 py-3 z-50">
          <div className="max-w-6xl mx-auto flex justify-center items-center gap-4">
            {isAdminAuthenticated ? (
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
                  <span className="text-white text-sm font-medium">{localUser.nickname}</span>
                </div>
                <button 
                  onClick={() => setShowUserProfile(!showUserProfile)}
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
              <>
                <button 
                  onClick={() => setCurrentView('login')}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-amber-600 transition-all duration-200 font-medium shadow-lg hover:shadow-orange-500/25 transform hover:scale-[1.02] text-sm"
                >
                  Вход
                </button>
                <button
