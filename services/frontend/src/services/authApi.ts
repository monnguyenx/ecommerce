import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth'

const DEMO_USERS: Record<string, { user: User; passwordHash: string }> = {
  'admin@ecommerce.local': {
    user: {
      id: 'usr-admin-01',
      name: 'Nguyễn Văn Quản Trị',
      email: 'admin@ecommerce.local',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      lastLogin: 'Hôm nay, 10:30'
    },
    passwordHash: 'admin123'
  },
  'manager@ecommerce.local': {
    user: {
      id: 'usr-mgr-02',
      name: 'Trần Thị Điều Phối',
      email: 'manager@ecommerce.local',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      lastLogin: 'Hôm nay, 09:15'
    },
    passwordHash: 'manager123'
  },
  'customer@ecommerce.local': {
    user: {
      id: 'usr-cust-03',
      name: 'Lê Hoàng Khách Mua',
      email: 'customer@ecommerce.local',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      lastLogin: 'Hôm qua, 18:40'
    },
    passwordHash: 'customer123'
  }
}

const AUTH_STORAGE_KEY = 'ecommerce_auth_token'
const USER_STORAGE_KEY = 'ecommerce_user_data'

export const authApi = {
  // Lấy người dùng đã lưu trong phiên làm việc
  getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },

  // Đăng nhập
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const apiUrl = import.meta.env.VITE_AUTH_API_URL

    // Nếu cấu hình kết nối microservice backend thật
    if (apiUrl) {
      try {
        const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        })
        const data = await response.json()
        if (response.ok && data.token) {
          localStorage.setItem(AUTH_STORAGE_KEY, data.token)
          if (data.user) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user))
          }
          return { success: true, message: 'Đăng nhập thành công', token: data.token, user: data.user }
        }
        return { success: false, message: data.message || 'Email hoặc mật khẩu không chính xác' }
      } catch (error) {
        console.warn('Backend microservice chưa sẵn sàng, chuyển sang chế độ Mock/Demo:', error)
      }
    }

    // Mô phỏng độ trễ mạng khi gọi microservice
    await new Promise((resolve) => setTimeout(resolve, 600))

    const account = DEMO_USERS[credentials.email.toLowerCase()]
    if (!account || account.passwordHash !== credentials.password) {
      // Cho phép đăng nhập demo với bất kỳ tài khoản nào nếu mật khẩu >= 6 ký tự
      if (credentials.password && credentials.password.length >= 6) {
        const demoUser: User = {
          id: `usr-${Date.now().toString().slice(-4)}`,
          name: credentials.email.split('@')[0] || 'Người dùng',
          email: credentials.email,
          role: 'customer',
          lastLogin: 'Vừa xong'
        }
        localStorage.setItem(AUTH_STORAGE_KEY, 'mock-jwt-token-' + Date.now())
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoUser))
        return {
          success: true,
          message: 'Đăng nhập thành công (Tài khoản mẫu)',
          token: 'mock-jwt-token',
          user: demoUser
        }
      }

      return {
        success: false,
        message: 'Email hoặc mật khẩu không hợp lệ. Vui lòng kiểm tra lại!'
      }
    }

    localStorage.setItem(AUTH_STORAGE_KEY, 'mock-jwt-token-' + account.user.id)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(account.user))

    return {
      success: true,
      message: 'Đăng nhập thành công',
      token: 'mock-jwt-token-' + account.user.id,
      user: account.user
    }
  },

  // Đăng ký tài khoản mới
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (!credentials.email || !credentials.password || !credentials.name) {
      return { success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' }
    }

    if (credentials.password !== credentials.confirmPassword) {
      return { success: false, message: 'Mật khẩu xác nhận không khớp' }
    }

    if (DEMO_USERS[credentials.email.toLowerCase()]) {
      return { success: false, message: 'Email này đã được sử dụng trong hệ thống' }
    }

    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: credentials.name,
      email: credentials.email,
      role: credentials.role || 'customer',
      lastLogin: 'Vừa tạo'
    }

    localStorage.setItem(AUTH_STORAGE_KEY, 'mock-jwt-token-' + newUser.id)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))

    return {
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token: 'mock-jwt-token-' + newUser.id,
      user: newUser
    }
  },

  // Đăng xuất
  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}
