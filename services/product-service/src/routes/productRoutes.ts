import { Router } from 'express'
import { ProductController } from '../controllers/productController.js'
import { authenticateToken, requireManagerOrAdmin } from '../middleware/authMiddleware.js'

const router = Router()

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'product-service',
    timestamp: new Date().toISOString()
  })
})

// Public catalog routes
router.get('/', ProductController.getProducts)
router.get('/categories/list', ProductController.getCategories)
router.get('/stats/summary', ProductController.getStats)
router.get('/lookup/code/:code', ProductController.lookupByCode)
router.get('/codes/list', ProductController.getAllCodes)
router.get('/:id', ProductController.getProductById)

// Protected mutation routes (Yêu cầu đăng nhập và quyền Admin/Manager)
router.post('/', authenticateToken, requireManagerOrAdmin, ProductController.createProduct)
router.put('/:id', authenticateToken, requireManagerOrAdmin, ProductController.updateProduct)
router.patch('/:id/items/:itemId/stock', authenticateToken, requireManagerOrAdmin, ProductController.updateItemStock)
router.delete('/:id', authenticateToken, requireManagerOrAdmin, ProductController.deleteProduct)

export default router
