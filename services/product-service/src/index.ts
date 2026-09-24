import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import productRoutes from './routes/productRoutes.js'
import { initProductDatabase } from './config/db.js'

dotenv.config()

// Khởi tạo PostgreSQL Database: ecommerce_product_db
initProductDatabase()

const app = express()
const PORT = process.env.PORT || 8003

app.use(cors())
app.use(express.json())

// Mount API routes
app.use('/api/v1/products', productRoutes)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'OmniOrder Product & Item Service',
    version: '1.0.0',
    description: 'Quản lý Sản phẩm, Mặt hàng (Items/SKU) & Tồn kho Microservice',
    endpoints: {
      health: 'GET /api/v1/products/health',
      listProducts: 'GET /api/v1/products',
      categories: 'GET /api/v1/products/categories/list',
      stats: 'GET /api/v1/products/stats/summary',
      detail: 'GET /api/v1/products/:id',
      create: 'POST /api/v1/products (Admin/Manager)',
      update: 'PUT /api/v1/products/:id (Admin/Manager)',
      delete: 'DELETE /api/v1/products/:id (Admin/Manager)'
    }
  })
})

app.listen(PORT, () => {
  console.log(`🚀 [product-service] đang chạy trên port :${PORT}`)
})

export default app
