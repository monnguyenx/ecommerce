export type UserRole = 'admin' | 'manager' | 'customer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  lastLogin?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
  role?: UserRole
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}
