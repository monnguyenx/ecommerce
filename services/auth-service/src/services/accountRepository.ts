import bcrypt from 'bcryptjs'
import { UserAccount, UserRole } from '../types/auth.js'
import { pool } from '../config/db.js'

export class AccountRepository {
  static async findByEmail(email: string): Promise<UserAccount | null> {
    try {
      const res = await pool.query(
        'SELECT id, name, email, password_hash as "passwordHash", role, is_active as "isActive", avatar, created_at as "createdAt", updated_at as "updatedAt" FROM accounts WHERE LOWER(email) = LOWER($1)',
        [email]
      )
      return res.rows[0] || null
    } catch (err) {
      console.error('[auth-service] DB findByEmail error:', err)
      return null
    }
  }

  static async findById(id: string): Promise<UserAccount | null> {
    try {
      const res = await pool.query(
        'SELECT id, name, email, password_hash as "passwordHash", role, is_active as "isActive", avatar, created_at as "createdAt", updated_at as "updatedAt" FROM accounts WHERE id = $1',
        [id]
      )
      return res.rows[0] || null
    } catch (err) {
      console.error('[auth-service] DB findById error:', err)
      return null
    }
  }

  static async create(payload: {
    name: string
    email: string
    password: string
    role?: UserRole
  }): Promise<UserAccount> {
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(payload.password, salt)
    const newId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
    const role = payload.role || 'customer'

    const res = await pool.query(
      `INSERT INTO accounts (id, name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, name, email, password_hash as "passwordHash", role, is_active as "isActive", avatar, created_at as "createdAt", updated_at as "updatedAt"`,
      [newId, payload.name, payload.email.toLowerCase(), passwordHash, role]
    )

    return res.rows[0]
  }

  static async updateStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      const res = await pool.query(
        'UPDATE accounts SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [isActive, id]
      )
      return (res.rowCount ?? 0) > 0
    } catch (err) {
      console.error('[auth-service] DB updateStatus error:', err)
      return false
    }
  }

  static async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }
}
