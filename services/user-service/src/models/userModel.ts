import { UserProfile, UserListFilter, UserStatus, UserRole } from '../types/user.js'
import { pool } from '../config/db.js'

export class UserModel {
  static async findAll(filter: UserListFilter = {}): Promise<{ users: UserProfile[]; total: number }> {
    try {
      const conditions: string[] = []
      const values: any[] = []
      let idx = 1

      if (filter.search) {
        conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(email) LIKE $${idx} OR phone LIKE $${idx})`)
        values.push(`%${filter.search.toLowerCase()}%`)
        idx++
      }

      if (filter.role) {
        conditions.push(`role = $${idx}`)
        values.push(filter.role)
        idx++
      }

      if (filter.status) {
        conditions.push(`status = $${idx}`)
        values.push(filter.status)
        idx++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // Count query
      const countRes = await pool.query(`SELECT COUNT(*) FROM user_profiles ${whereClause}`, values)
      const total = parseInt(countRes.rows[0].count, 10)

      // Pagination
      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit

      const queryStr = `
        SELECT id, name, email, phone, role, status, avatar,
               total_orders as "totalOrders", total_spent as "totalSpent",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM user_profiles
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `
      values.push(limit, offset)

      const result = await pool.query(queryStr, values)

      return {
        users: result.rows.map((row) => ({ ...row, addresses: [] })),
        total
      }
    } catch (err) {
      console.error('[user-service] DB findAll error:', err)
      return { users: [], total: 0 }
    }
  }

  static async findById(id: string): Promise<UserProfile | null> {
    try {
      const res = await pool.query(
        `SELECT id, name, email, phone, role, status, avatar,
                total_orders as "totalOrders", total_spent as "totalSpent",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM user_profiles WHERE id = $1`,
        [id]
      )
      if (res.rows.length === 0) return null

      // Lấy danh sách địa chỉ
      const addrRes = await pool.query(
        `SELECT id, street, ward, district, city, is_default as "isDefault"
         FROM user_addresses WHERE user_id = $1`,
        [id]
      )

      return {
        ...res.rows[0],
        addresses: addrRes.rows
      }
    } catch (err) {
      console.error('[user-service] DB findById error:', err)
      return null
    }
  }

  static async findByEmail(email: string): Promise<UserProfile | null> {
    try {
      const res = await pool.query(
        `SELECT id, name, email, phone, role, status, avatar,
                total_orders as "totalOrders", total_spent as "totalSpent",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM user_profiles WHERE LOWER(email) = LOWER($1)`,
        [email]
      )
      if (res.rows.length === 0) return null
      return { ...res.rows[0], addresses: [] }
    } catch (err) {
      console.error('[user-service] DB findByEmail error:', err)
      return null
    }
  }

  static async syncProfile(payload: {
    id: string
    name: string
    email: string
    role: UserRole
  }): Promise<UserProfile | null> {
    try {
      const res = await pool.query(
        `INSERT INTO user_profiles (id, name, email, role, status, total_orders, total_spent)
         VALUES ($1, $2, $3, $4, 'active', 0, 0)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
         RETURNING id, name, email, phone, role, status, avatar, total_orders as "totalOrders", total_spent as "totalSpent", created_at as "createdAt", updated_at as "updatedAt"`,
        [payload.id, payload.name, payload.email.toLowerCase(), payload.role]
      )
      return { ...res.rows[0], addresses: [] }
    } catch (err) {
      console.error('[user-service] DB syncProfile error:', err)
      return null
    }
  }

  static async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const existing = await this.findById(id)
      if (!existing) return null

      const name = updates.name !== undefined ? updates.name : existing.name
      const phone = updates.phone !== undefined ? updates.phone : existing.phone
      const avatar = updates.avatar !== undefined ? updates.avatar : existing.avatar

      const res = await pool.query(
        `UPDATE user_profiles
         SET name = $1, phone = $2, avatar = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, name, email, phone, role, status, avatar, total_orders as "totalOrders", total_spent as "totalSpent", created_at as "createdAt", updated_at as "updatedAt"`,
        [name, phone, avatar, id]
      )

      return { ...res.rows[0], addresses: existing.addresses }
    } catch (err) {
      console.error('[user-service] DB update error:', err)
      return null
    }
  }

  static async updateStatus(id: string, status: UserStatus): Promise<UserProfile | null> {
    try {
      const res = await pool.query(
        `UPDATE user_profiles
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, name, email, phone, role, status, avatar, total_orders as "totalOrders", total_spent as "totalSpent", created_at as "createdAt", updated_at as "updatedAt"`,
        [status, id]
      )
      return res.rows[0] ? { ...res.rows[0], addresses: [] } : null
    } catch (err) {
      console.error('[user-service] DB updateStatus error:', err)
      return null
    }
  }

  static async getStats(): Promise<{ totalUsers: number; byRole: Record<string, number>; activeUsers: number }> {
    try {
      const totalRes = await pool.query('SELECT COUNT(*) FROM user_profiles;')
      const totalUsers = parseInt(totalRes.rows[0].count, 10)

      const activeRes = await pool.query("SELECT COUNT(*) FROM user_profiles WHERE status = 'active';")
      const activeUsers = parseInt(activeRes.rows[0].count, 10)

      const rolesRes = await pool.query('SELECT role, COUNT(*) as count FROM user_profiles GROUP BY role;')
      const byRole: Record<string, number> = { admin: 0, manager: 0, customer: 0 }
      rolesRes.rows.forEach((r) => {
        byRole[r.role] = parseInt(r.count, 10)
      })

      return { totalUsers, byRole, activeUsers }
    } catch (err) {
      console.error('[user-service] DB getStats error:', err)
      return { totalUsers: 0, byRole: { admin: 0, manager: 0, customer: 0 }, activeUsers: 0 }
    }
  }
}
