import { Request, Response } from 'express'
import { AccountRepository } from '../services/accountRepository.js'
import { JwtService } from '../services/jwtService.js'
import { AuthenticatedRequest } from '../middleware/authMiddleware.js'

export class AuthController {
  // POST /api/v1/auth/login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ email và mật khẩu'
        })
        return
      }

      const account = await AccountRepository.findByEmail(email)
      if (!account) {
        res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        })
        return
      }

      if (!account.isActive) {
        res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ quản trị viên'
        })
        return
      }

      const isPasswordValid = await AccountRepository.verifyPassword(password, account.passwordHash)
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        })
        return
      }

      const tokens = JwtService.generateTokens({
        userId: account.id,
        email: account.email,
        role: account.role,
        name: account.name
      })

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
          avatar: account.avatar
        }
      })
    } catch (error) {
      console.error('[auth-service] Login error:', error)
      res.status(500).json({
        success: false,
        message: 'Đã có lỗi xảy ra tại Auth Service'
      })
    }
  }

  // POST /api/v1/auth/register
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body

      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng điền họ tên, email và mật khẩu'
        })
        return
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có tối thiểu 6 ký tự'
        })
        return
      }

      const existing = await AccountRepository.findByEmail(email)
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'Email này đã được sử dụng'
        })
        return
      }

      const validRole = role === 'manager' ? 'manager' : 'customer'

      const newAccount = await AccountRepository.create({
        name: name.trim(),
        email: email.trim(),
        password,
        role: validRole
      })

      const tokens = JwtService.generateTokens({
        userId: newAccount.id,
        email: newAccount.email,
        role: newAccount.role,
        name: newAccount.name
      })

      // INTER-SERVICE CALL: Đồng bộ người dùng sang user-service (:8002)
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8002'
      fetch(`${userServiceUrl}/api/v1/users/internal/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newAccount.id,
          name: newAccount.name,
          email: newAccount.email,
          role: newAccount.role
        })
      })
        .then(() => console.log(`🔗 [auth-service -> user-service] Đã đồng bộ hồ sơ user ${newAccount.id}`))
        .catch((err) => console.warn('[auth-service -> user-service] Đồng bộ user-service lỗi:', err.message))

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: newAccount.id,
          name: newAccount.name,
          email: newAccount.email,
          role: newAccount.role
        }
      })
    } catch (error) {
      console.error('[auth-service] Register error:', error)
      res.status(500).json({
        success: false,
        message: 'Đã có lỗi xảy ra tại Auth Service'
      })
    }
  }

  // POST /api/v1/auth/refresh
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Thiếu refreshToken' })
        return
      }

      const payload = JwtService.verifyRefreshToken(refreshToken)
      if (!payload) {
        res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' })
        return
      }

      const account = await AccountRepository.findById(payload.userId)
      if (!account || !account.isActive) {
        res.status(403).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa' })
        return
      }

      const tokens = JwtService.generateTokens({
        userId: account.id,
        email: account.email,
        role: account.role,
        name: account.name
      })

      res.status(200).json({
        success: true,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      })
    } catch (error) {
      console.error('[auth-service] Refresh error:', error)
      res.status(500).json({ success: false, message: 'Lỗi làm mới token' })
    }
  }

  // POST /api/v1/auth/verify (Dành cho các microservices khác gọi xác thực token)
  static async verify(req: Request, res: Response): Promise<void> {
    const { token } = req.body
    if (!token) {
      res.status(400).json({ valid: false, message: 'Thiếu token' })
      return
    }

    const payload = JwtService.verifyAccessToken(token)
    if (!payload) {
      res.status(401).json({ valid: false, message: 'Token không hợp lệ' })
      return
    }

    // Kiểm tra thêm trạng thái tài khoản trong DB
    const account = await AccountRepository.findById(payload.userId)
    if (!account || !account.isActive) {
      res.status(403).json({ valid: false, message: 'Tài khoản đã bị vô hiệu hóa hoặc không tồn tại' })
      return
    }

    res.status(200).json({
      valid: true,
      user: {
        userId: account.id,
        email: account.email,
        role: account.role,
        name: account.name
      }
    })
  }

  // GET /api/v1/auth/me
  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' })
      return
    }

    const account = await AccountRepository.findById(req.user.userId)
    if (!account) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' })
      return
    }

    res.status(200).json({
      success: true,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        avatar: account.avatar,
        createdAt: account.createdAt
      }
    })
  }

  // PUT /api/v1/auth/internal/users/:id/status (Inter-service API từ user-service gọi sang)
  static async syncUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body
      const isActive = status === 'active'
      const updated = await AccountRepository.updateStatus(id, isActive)

      res.status(200).json({
        success: updated,
        message: updated
          ? `[auth-service] Đã cập nhật is_active=${isActive} cho user ${id}`
          : `Không tìm thấy user ${id}`
      })
    } catch (err) {
      res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái tại auth-service' })
    }
  }
}
