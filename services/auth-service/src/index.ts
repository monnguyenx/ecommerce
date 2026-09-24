import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import { initAuthDatabase } from './config/db.js'

dotenv.config()

// Khởi tạo PostgreSQL Database: ecommerce_auth_db
initAuthDatabase()

const app = express()
const PORT = process.env.PORT || 8001

app.use(cors())
app.use(express.json())

// Mount API routes
app.use('/api/v1/auth', authRoutes)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'OmniOrder Auth Service',
    version: '1.0.0',
    description: 'Xác thực & Phân quyền Microservice',
    endpoints: {
      health: 'GET /api/v1/auth/health',
      login: 'POST /api/v1/auth/login',
      register: 'POST /api/v1/auth/register',
      refresh: 'POST /api/v1/auth/refresh',
      verify: 'POST /api/v1/auth/verify',
      me: 'GET /api/v1/auth/me'
    }
  })
})

app.listen(PORT, () => {
  console.log(`🚀 [auth-service] đang chạy trên port :${PORT}`)
})

export default app
