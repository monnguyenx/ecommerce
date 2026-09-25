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
router.put('/orders/:id', OrderController.updateOrder)
router.patch('/orders/:id/checkpoint', OrderController.updateCheckpoint)
router.post('/orders/:id/events', OrderController.addEvent)
router.put('/orders/:id/events/:eventId', OrderController.updateEvent)
router.post('/orders/:id/qc-photos', OrderController.updateQcPhotos)
router.patch('/orders/:id/qc-status', OrderController.updateQcStatus)
router.post('/orders/:id/confirm-deposit', OrderController.confirmDeposit)

export default router
