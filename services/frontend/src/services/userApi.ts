export interface UserItem {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'manager' | 'customer'
  status: 'active' | 'suspended' | 'pending'
  avatar?: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export interface UserStats {
  totalUsers: number
  byRole: Record<string, number>
  activeUsers: number
}

const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:8002'

export const userApi = {
  // Lấy danh sách users từ user-service
  async getUsers(token: string): Promise<UserItem[]> {
    try {
      const response = await fetch(`${USER_API_URL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Lỗi tải danh sách người dùng')
      }
      const json = await response.json()
      return json.data || []
    } catch (err) {
      console.error('[userApi] getUsers failed:', err)
      return []
    }
  },

  // Lấy thống kê người dùng
  async getStats(token: string): Promise<UserStats | null> {
    try {
      const response = await fetch(`${USER_API_URL}/api/v1/users/stats/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Lỗi tải thống kê')
      }
      const json = await response.json()
      return json.data || null
    } catch (err) {
      console.error('[userApi] getStats failed:', err)
      return null
    }
  }
}
