import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import orderRoutes from './routes/orderRoutes.js'
import { initOrderDatabase } from './config/db.js'

dotenv.config()

// Khởi tạo PostgreSQL Database: ecommerce_order_db
initOrderDatabase()

import { createServer } from 'http'
import { initSocketIO } from './socket.js'

const app = express()
const PORT = process.env.PORT || 8004

app.use(cors())
app.use(express.json())

// Tạo HTTP Server và gắn kết Socket.io
const httpServer = createServer(app)
initSocketIO(httpServer)

// Mount API routes
app.use('/api/v1', orderRoutes)

// Health check
app.get('/api/v1/orders/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    port: PORT,
    database: 'ecommerce_order_db',
    websocket: 'socket.io enabled',
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
    websocket: 'socket.io enabled',
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

httpServer.listen(PORT, () => {
  console.log(`🚀 [order-service] đang chạy trên port :${PORT} (HTTP + Socket.io Real-time)`)
})

export default app
