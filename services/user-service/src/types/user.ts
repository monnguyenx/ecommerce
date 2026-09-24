export type UserRole = 'admin' | 'manager' | 'customer'
export type UserStatus = 'active' | 'suspended' | 'pending'

export interface UserAddress {
  id: string
  street: string
  ward: string
  district: string
  city: string
  isDefault: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  avatar?: string
  addresses: UserAddress[]
  totalOrders: number
  totalSpent: number
  createdAt: string
  updatedAt: string
}

export interface UserListFilter {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
  status?: UserStatus
}
