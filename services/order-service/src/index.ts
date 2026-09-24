import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import orderRoutes from './routes/orderRoutes.js'
import { initOrderDatabase } from './config/db.js'

dotenv.config()

// Khởi tạo PostgreSQL Database: ecommerce_order_db
initOrderDatabase()

const app = express()
const PORT = process.env.PORT || 8004

app.use(cors())
app.use(express.json())

// Mount API routes
app.use('/api/v1', orderRoutes)

// Health check
app.get('/api/v1/orders/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    port: PORT,
    database: 'ecommerce_order_db',
    timestamp: new Date().toISOString()
  })
})

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'OmniOrder Cross-Border Order & Logistics Tracking Service',
    version: '1.0.0',
    port: PORT,
    database: 'ecommerce_order_db',
    description: 'Quản lý Đơn hàng Order Trung Quốc & Định vị Kiện hàng Xuyên Biên Giới (7-14 ngày)',
    endpoints: {
      health: 'GET /api/v1/orders/health',
      listOrders: 'GET /api/v1/orders',
      lookup: 'GET /api/v1/orders/lookup/:code',
      detail: 'GET /api/v1/orders/:id',
      create: 'POST /api/v1/orders',
      updateCheckpoint: 'PATCH /api/v1/orders/:id/checkpoint',
      stats: 'GET /api/v1/orders/stats/summary'
    }
  })
})

app.listen(PORT, () => {
  console.log(`🚀 [order-service] đang chạy trên port :${PORT}`)
})

export default app
