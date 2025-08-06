
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xwdfosoiejzmajkoqarv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZGZvc29pZWp6bWFqa29xYXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTM1MTksImV4cCI6MjA2OTk4OTUxOX0.Hy3pDT5DHN1PTlP-1omwhCykwqMvoK86DWc6srQmtbw'

export const supabase = createClient(supabaseUrl, supabaseKey)

// API функции для работы с розыгрышами

// === GIVEAWAYS ===
export const giveawayAPI = {
  // Получить все розыгрыши
  async getAll() {
    const { data, error } = await supabase
      .from('giveaways')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Создать новый розыгрыш
  async create(giveaway) {
    const { data, error } = await supabase
      .from('giveaways')
      .insert([{
        title: giveaway.title,
        description: giveaway.description,
        social_network: giveaway.socialNetwork,
        social_link: giveaway.socialLink,
        end_date: giveaway.endDate,
        is_active: giveaway.isActive,
        category: giveaway.category,
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Обновить розыгрыш
  async update(id, updates) {
    const { data, error } = await supabase
      .from('giveaways')
      .update({
        title: updates.title,
        description: updates.description,
        social_network: updates.socialNetwork,
        social_link: updates.socialLink,
        end_date: updates.endDate,
        is_active: updates.isActive,
        category: updates.category,
      })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Удалить розыгрыш
  async delete(id) {
    const { error } = await supabase
      .from('giveaways')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Увеличить счетчик участников
  async incrementParticipants(id) {
    const { data, error } = await supabase
      .rpc('increment_participants', { giveaway_id: id })
    
    if (error) throw error
    return data
  }
}

// === PREMIUM GIVEAWAY ===
export const premiumAPI = {
  // Получить премиум розыгрыш
  async get() {
    const { data, error } = await supabase
      .from('premium_giveaway')
      .select('*')
      .eq('id', 'premium')
      .single()
    
    if (error) throw error
    return data
  },

  // Обновить премиум розыгрыш
  async update(updates) {
    const { data, error } = await supabase
      .from('premium_giveaway')
      .update({
        title: updates.title,
        description: updates.description,
        social_network: updates.socialNetwork,
        social_link: updates.socialLink,
        end_date: updates.endDate,
        is_active: updates.isActive,
      })
      .eq('id', 'premium')
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Увеличить счетчик участников премиум розыгрыша
  async incrementParticipants() {
    const { data, error } = await supabase
      .rpc('increment_premium_participants')
    
    if (error) throw error
    return data
  }
}

// === PARTICIPANTS ===
export const participantAPI = {
  // Добавить участника к обычному розыгрышу
  async addToGiveaway(userId, userName, giveawayId) {
    const { data, error } = await supabase
      .from('participants')
      .insert([{
        user_id: userId,
        user_name: userName,
        giveaway_id: giveawayId
      }])
      .select()
    
    if (error) {
      if (error.code === '23505') { // Уникальное ограничение
        throw new Error('Вы уже участвуете в этом розыгрыше!')
      }
      throw error
    }
    return data[0]
  },

  // Добавить участника к премиум розыгрышу
  async addToPremium(userId, userName) {
    const { data, error } = await supabase
      .from('participants')
      .insert([{
        user_id: userId,
        user_name: userName,
        premium_giveaway_id: 'premium'
      }])
      .select()
    
    if (error) {
      if (error.code === '23505') { // Уникальное ограничение
        throw new Error('Вы уже участвуете в этом розыгрыше!')
      }
      throw error
    }
    return data[0]
  },

  // Проверить участие пользователя в розыгрыше
  async checkParticipation(userId, giveawayId = null, isPremium = false) {
    let query = supabase
      .from('participants')
      .select('id')
      .eq('user_id', userId)
    
    if (isPremium) {
      query = query.eq('premium_giveaway_id', 'premium')
    } else {
      query = query.eq('giveaway_id', giveawayId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data.length > 0
  },

  // Получить количество участников
  async getCount(giveawayId = null, isPremium = false) {
    let query = supabase
      .from('participants')
      .select('id', { count: 'exact' })
    
    if (isPremium) {
      query = query.eq('premium_giveaway_id', 'premium')
    } else {
      query = query.eq('giveaway_id', giveawayId)
    }
    
    const { count, error } = await query
    
    if (error) throw error
    return count || 0
  }
}

// === USERS ===
export const userAPI = {
  // Создать пользователя
  async create(nickname, passwordHash) {
    const userId = `local_${Date.now()}`
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        nickname: nickname,
        password_hash: passwordHash
      }])
      .select()
    
    if (error) {
      if (error.code === '23505') { // Уникальное ограничение
        throw new Error('Этот никнейм уже занят')
      }
      throw error
    }
    return data[0]
  },

  // Найти пользователя по никнейму
  async findByNickname(nickname) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('nickname', nickname)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return data
  }
}

// SQL функции уже созданы в Части 2
// Все функции работают с правильными типами данных UUID и VARCHAR
