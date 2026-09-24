export type UserRole = 'admin' | 'manager' | 'customer'

export interface UserAccount {
  id: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  isActive: boolean
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface TokenPayload {
  userId: string
  email: string
  role: UserRole
  name: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
