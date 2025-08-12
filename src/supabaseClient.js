import { createClient } from '@supabase/supabase-js';

// Тестовая база данных
const supabaseUrl = 'https://mkcwndpvifvckcxaajju.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rY3duZHB2aWZ2Y2tjeGFhamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTc0NTAsImV4cCI6MjA3MDQzMzQ1MH0.mJY2hkKh-WDJTyEBaiW63MrbKfjOf3Ki8vI-KRa0sfM';

const supabase = createClient(supabaseUrl, supabaseKey);

// API для работы с обычными розыгрышами
export const giveawayAPI = {
  // Получить все розыгрыши
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Ошибка получения розыгрышей:', error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Ошибка запроса розыгрышей:', err);
      return [];
    }
  },

  // Создать новый розыгрыш
  async create(giveawayData) {
    try {
      // Проверка обязательных полей
      if (!giveawayData.title || !giveawayData.endDate) {
        throw new Error('Название и дата окончания обязательны');
      }

      const { data, error } = await supabase
        .from('giveaways')
        .insert([{
          title: giveawayData.title,
          description: giveawayData.description,
          social_network: giveawayData.socialNetwork,
          social_link: giveawayData.socialLink,
          end_date: giveawayData.endDate,
          is_active: giveawayData.isActive,
          category: giveawayData.category,
          participants_count: 0
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Ошибка создания розыгрыша: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка создания розыгрыша:', err);
      throw err;
    }
  },

  // Обновить розыгрыш
  async update(id, updates) {
    try {
      // Проверка существования розыгрыша
      const { data: existing, error: fetchError } = await supabase
        .from('giveaways')
        .select('id')
        .eq('id', id)
        .single();
      
      if (fetchError || !existing) {
        throw new Error('Розыгрыш не найден');
      }

      const { data, error } = await supabase
        .from('giveaways')
        .update({
          title: updates.title,
          description: updates.description,
          social_network: updates.socialNetwork,
          social_link: updates.socialLink,
          end_date: updates.endDate,
          is_active: updates.isActive,
          category: updates.category
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Ошибка обновления розыгрыша: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка обновления розыгрыша:', err);
      throw err;
    }
  },

  // Удалить розыгрыш
  async delete(id) {
    try {
      // Проверка существования розыгрыша
      const { data: existing, error: fetchError } = await supabase
        .from('giveaways')
        .select('id')
        .eq('id', id)
        .single();
      
      if (fetchError || !existing) {
        throw new Error('Розыгрыш не найден');
      }

      const { error } = await supabase
        .from('giveaways')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Ошибка удаления розыгрыша: ${error.message}`);
      }
      
      return true;
    } catch (err) {
      console.error('Ошибка удаления розыгрыша:', err);
      throw err;
    }
  },

  // Увеличить счетчик участников
  async incrementParticipants(id) {
    try {
      // Проверка существования розыгрыша
      const { data: existing, error: fetchError } = await supabase
        .from('giveaways')
        .select('id')
        .eq('id', id)
        .single();
      
      if (fetchError || !existing) {
        throw new Error('Розыгрыш не найден');
      }

      const { data, error } = await supabase
        .rpc('increment_participants', { giveaway_id: id });
      
      if (error) {
        throw new Error(`Ошибка увеличения счетчика: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка увеличения счетчика участников:', err);
      throw err;
    }
  }
};

// API для работы с премиум розыгрышем
export const premiumAPI = {
  // Получить премиум розыгрыш
  async get() {
    try {
      const { data, error } = await supabase
        .from('premium_giveaway')
        .select('*')
        .single();
      
      if (error) {
        // Если записи нет, создаем дефолтную
        if (error.code === 'PGRST116') {
          return await this.create();
        }
        throw new Error(`Ошибка получения премиум розыгрыша: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка получения премиум розыгрыша:', err);
      // Возвращаем дефолтные данные в случае ошибки
      return {
        id: 1,
        title: 'Создайте премиум розыгрыш',
        description: 'Здесь будет отображаться ваш премиум розыгрыш',
        social_network: 'Telegram',
        social_link: '',
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        participants_count: 0,
        is_active: false
      };
    }
  },

  // Создать/обновить премиум розыгрыш
  async create(updates) {
    try {
      // Проверка обязательных полей
      if (!updates?.title || !updates?.endDate) {
        throw new Error('Название и дата окончания обязательны');
      }

      // Сначала пытаемся получить существующий премиум розыгрыш
      const { data: existing, error: fetchError } = await supabase
        .from('premium_giveaway')
        .select('*')
        .single();

      let result;
      
      if (fetchError || !existing) {
        // Создаем новый, если не существует
        const { data, error } = await supabase
          .from('premium_giveaway')
          .insert([{
            title: updates.title,
            description: updates.description,
            social_network: updates.socialNetwork,
            social_link: updates.socialLink,
            end_date: updates.endDate,
            is_active: updates.isActive,
            participants_count: 0
          }])
          .select()
          .single();
        
        if (error) throw new Error(`Ошибка создания премиум розыгрыша: ${error.message}`);
        result = data;
      } else {
        // Обновляем существующий
        const { data, error } = await supabase
          .from('premium_giveaway')
          .update({
            title: updates.title,
            description: updates.description,
            social_network: updates.socialNetwork,
            social_link: updates.socialLink,
            end_date: updates.endDate,
            is_active: updates.isActive,
            participants_count: 0 // Сбрасываем счетчик при обновлении
          })
          .eq('id', 1)
          .select()
          .single();
        
        if (error) throw new Error(`Ошибка обновления премиум розыгрыша: ${error.message}`);
        result = data;
      }
      
      return result;
    } catch (err) {
      console.error('Ошибка создания/обновления премиум розыгрыша:', err);
      throw err;
    }
  },

  // Увеличить счетчик участников премиум розыгрыша
  async incrementParticipants() {
    try {
      const { data, error } = await supabase
        .rpc('increment_premium_participants');
      
      if (error) {
        throw new Error(`Ошибка увеличения счетчика премиум: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка увеличения счетчика премиум участников:', err);
      throw err;
    }
  }
};

// API для работы с участниками
export const participantAPI = {
  // Добавить участника в обычный розыгрыш
  async addToGiveaway(userId, userName, giveawayId) {
    try {
      // Проверка существования розыгрыша
      const { data: existingGiveaway, error: giveawayError } = await supabase
        .from('giveaways')
        .select('id')
        .eq('id', giveawayId)
        .single();
      
      if (giveawayError || !existingGiveaway) {
        throw new Error('Розыгрыш не найден');
      }

      const { data, error } = await supabase
        .from('participants')
        .insert([{
          user_id: userId,
          user_name: userName,
          giveaway_id: giveawayId,
          is_premium: false
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Пользователь уже участвует в этом розыгрыше');
        }
        throw new Error(`Ошибка добавления участника: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка добавления участника в розыгрыш:', err);
      throw err;
    }
  },

  // Добавить участника в премиум розыгрыш
  async addToPremium(userId, userName) {
    try {
      // Проверка существования премиум розыгрыша
      const { data: existingPremium, error: premiumError } = await supabase
        .from('premium_giveaway')
        .select('id')
        .single();
      
      if (premiumError || !existingPremium) {
        // Если премиум розыгрыша нет, создаем его
        await premiumAPI.create({
          title: 'Премиум розыгрыш',
          description: 'Участие в премиум розыгрыше',
          socialNetwork: 'Telegram',
          socialLink: '',
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          isActive: true
        });
      }

      const { data, error } = await supabase
        .from('participants')
        .insert([{
          user_id: userId,
          user_name: userName,
          giveaway_id: null,
          is_premium: true
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Пользователь уже участвует в премиум розыгрыше');
        }
        throw new Error(`Ошибка добавления участника в премиум: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка добавления участника в премиум розыгрыш:', err);
      throw err;
    }
  },

  // Проверить участие пользователя
  async checkParticipation(userId, giveawayId = null, isPremium = false) {
    try {
      let query = supabase
        .from('participants')
        .select('id')
        .eq('user_id', userId)
        .eq('is_premium', isPremium);
      
      if (!isPremium && giveawayId) {
        query = query.eq('giveaway_id', giveawayId);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        // Если записи нет, значит пользователь не участвует
        if (error.code === 'PGRST116') {
          return false;
        }
        throw new Error(`Ошибка проверки участия: ${error.message}`);
      }
      
      return !!data;
    } catch (err) {
      console.error('Ошибка проверки участия:', err);
      return false;
    }
  },

  // Получить всех участников розыгрыша
  async getParticipants(giveawayId = null, isPremium = false) {
    try {
      let query = supabase
        .from('participants')
        .select('*')
        .eq('is_premium', isPremium);
      
      if (!isPremium && giveawayId) {
        query = query.eq('giveaway_id', giveawayId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Ошибка получения участников: ${error.message}`);
      }
      
      return data || [];
    } catch (err) {
      console.error('Ошибка получения участников:', err);
      return [];
    }
  }
};

// API для работы с пользователями
export const userAPI = {
  // Создать или обновить профиль пользователя
  async upsertProfile(userId, profileData) {
    try {
      // Проверка обязательных полей
      if (!profileData.nickname) {
        throw new Error('Никнейм обязателен');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert([{
          user_id: userId,
          nickname: profileData.nickname,
          created_at: profileData.createdAt || new Date().toISOString()
        }], {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Никнейм уже занят');
        }
        throw new Error(`Ошибка создания/обновления профиля: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка работы с профилем пользователя:', err);
      throw err;
    }
  },

  // Получить профиль пользователя
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Профиль не найден
        }
        throw new Error(`Ошибка получения профиля: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Ошибка получения профиля пользователя:', err);
      return null;
    }
  }
};

export default supabase;
