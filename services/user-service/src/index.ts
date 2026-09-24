import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/userRoutes.js'
import { initUserDatabase } from './config/db.js'

dotenv.config()

// Khởi tạo PostgreSQL Database: ecommerce_user_db
initUserDatabase()

const app = express()
const PORT = process.env.PORT || 8002

app.use(cors())
app.use(express.json())

// Mount API routes
app.use('/api/v1/users', userRoutes)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'OmniOrder User Service',
    version: '1.0.0',
    description: 'Quản lý Thông tin & Danh sách Người dùng Microservice',
    endpoints: {
      health: 'GET /api/v1/users/health',
      listUsers: 'GET /api/v1/users (Admin/Manager)',
      myProfile: 'GET /api/v1/users/profile/me',
      updateProfile: 'PUT /api/v1/users/profile/me',
      stats: 'GET /api/v1/users/stats/summary (Admin/Manager)',
      updateStatus: 'PUT /api/v1/users/:id/status (Admin)'
    }
  })
})

app.listen(PORT, () => {
  console.log(`🚀 [user-service] đang chạy trên port :${PORT}`)
})

export default app
