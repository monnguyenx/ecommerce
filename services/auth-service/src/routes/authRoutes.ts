import { Router } from 'express'
import { AuthController } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

// Public routes
router.post('/login', AuthController.login)
router.post('/register', AuthController.register)
router.post('/refresh', AuthController.refresh)
router.post('/verify', AuthController.verify)
router.put('/internal/users/:id/status', AuthController.syncUserStatus)

// Protected routes (yêu cầu header Bearer Token)
router.get('/me', authenticateToken, AuthController.getMe)

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  })
})

export default router
