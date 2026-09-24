import { Response } from 'express'
import { UserModel } from '../models/userModel.js'
import { AuthenticatedUserRequest } from '../middleware/authMiddleware.js'
import { UserRole, UserStatus } from '../types/user.js'

export class UserController {
  // GET /api/v1/users (Danh sách user - Admin hoặc Manager)
  static async getUsers(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const search = (req.query.search as string) || undefined
      const role = (req.query.role as UserRole) || undefined
      const status = (req.query.status as UserStatus) || undefined

      const result = await UserModel.findAll({ page, limit, search, role, status })

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      })
    } catch (error) {
      console.error('[user-service] getUsers error:', error)
      res.status(500).json({ success: false, message: 'Lỗi truy xuất danh sách người dùng' })
    }
  }

  // GET /api/v1/users/profile/me (Hồ sơ của user hiện tại)
  static async getMyProfile(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa xác thực danh tính' })
        return
      }

      let profile = await UserModel.findById(req.user.userId)
      if (!profile) {
        profile = await UserModel.findByEmail(req.user.email)
      }

      if (!profile) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ người dùng' })
        return
      }

      res.status(200).json({
        success: true,
        data: profile
      })
    } catch (error) {
      console.error('[user-service] getMyProfile error:', error)
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin hồ sơ' })
    }
  }

  // PUT /api/v1/users/profile/me (Cập nhật hồ sơ của user hiện tại)
  static async updateMyProfile(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa xác thực danh tính' })
        return
      }

      const { name, phone, avatar, addresses } = req.body

      const updated = await UserModel.update(req.user.userId, {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(avatar && { avatar }),
        ...(addresses && { addresses })
      })

      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật hồ sơ thành công',
        data: updated
      })
    } catch (error) {
      console.error('[user-service] updateMyProfile error:', error)
      res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ' })
    }
  }

  // GET /api/v1/users/:id (Chi tiết một user)
  static async getUserById(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const user = await UserModel.findById(id)

      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
        return
      }

      res.status(200).json({
        success: true,
        data: user
      })
    } catch (error) {
      console.error('[user-service] getUserById error:', error)
      res.status(500).json({ success: false, message: 'Lỗi lấy thông tin người dùng' })
    }
  }

  // PUT /api/v1/users/:id/status (Khóa / Kích hoạt tài khoản - Admin)
  static async updateUserStatus(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!['active', 'suspended', 'pending'].includes(status)) {
        res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' })
        return
      }

      const updated = await UserModel.updateStatus(id, status as UserStatus)
      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
        return
      }

      // INTER-SERVICE CALL: Đồng bộ trạng thái khóa/mở sang auth-service (:8001)
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001'
      fetch(`${authServiceUrl}/api/v1/auth/internal/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
        .then(() => console.log(`🔗 [user-service -> auth-service] Đã đồng bộ trạng thái khóa của user ${id}`))
        .catch((err) => console.warn('[user-service -> auth-service] Đồng bộ auth-service lỗi:', err.message))

      res.status(200).json({
        success: true,
        message: `Đã cập nhật trạng thái tài khoản thành: ${status}`,
        data: updated
      })
    } catch (error) {
      console.error('[user-service] updateUserStatus error:', error)
      res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái' })
    }
  }

  // POST /api/v1/users/internal/sync (Inter-service API từ auth-service gọi sang)
  static async syncProfile(req: any, res: Response): Promise<void> {
    try {
      const { id, name, email, role } = req.body
      if (!id || !email) {
        res.status(400).json({ success: false, message: 'Thiếu thông tin người dùng cần đồng bộ' })
        return
      }

      const synced = await UserModel.syncProfile({ id, name, email, role })
      res.status(201).json({
        success: true,
        message: '[user-service] Đã đồng bộ hồ sơ người dùng vào ecommerce_user_db',
        data: synced
      })
    } catch (err) {
      res.status(500).json({ success: false, message: 'Lỗi đồng bộ hồ sơ tại user-service' })
    }
  }

  // GET /api/v1/users/stats/summary (Thống kê người dùng)
  static async getStats(_req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const stats = await UserModel.getStats()
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('[user-service] getStats error:', error)
      res.status(500).json({ success: false, message: 'Lỗi lấy thống kê người dùng' })
    }
  }
}
