import { Router } from 'express'
import { UserController } from '../controllers/userController.js'
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js'

const router = Router()

// Health check endpoint (Public)
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'user-service',
    timestamp: new Date().toISOString()
  })
})

// Internal inter-service endpoint (được gọi từ auth-service khi đăng ký user mới)
router.post('/internal/sync', UserController.syncProfile)

// Protected routes (Bắt buộc đăng nhập Bearer Token)
router.use(authenticateToken)

// Profile cá nhân của người dùng hiện tại
router.get('/profile/me', UserController.getMyProfile)
router.put('/profile/me', UserController.updateMyProfile)

// Quản trị danh sách người dùng (Chỉ Admin & Manager)
router.get('/', requireRoles(['admin', 'manager']), UserController.getUsers)
router.get('/stats/summary', requireRoles(['admin', 'manager']), UserController.getStats)
router.get('/:id', requireRoles(['admin', 'manager']), UserController.getUserById)

// Cập nhật trạng thái khóa/mở tài khoản (Chỉ Admin)
router.put('/:id/status', requireRoles(['admin']), UserController.updateUserStatus)

export default router
