import { Router } from 'express'
import { OrderController } from '../controllers/orderController.js'

const router = Router()

// Public / Client endpoints
router.get('/orders', OrderController.getOrders)
router.get('/orders/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'order-service', port: 8004, database: 'ecommerce_order_db' })
})
router.get('/orders/stats/summary', OrderController.getStats)
router.get('/orders/lookup/:code', OrderController.lookupByCode)
router.get('/orders/:id', OrderController.getOrderById)
router.post('/orders', OrderController.createOrder)
router.patch('/orders/:id/checkpoint', OrderController.updateCheckpoint)

export default router
