import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || '5432'
const DB_USER = process.env.DB_USER || 'ecommerce_user'
const DB_PASSWORD = process.env.DB_PASSWORD || 'ecommerce_secret'
const DB_NAME = process.env.DB_NAME || 'ecommerce_auth_db'

const DB_URL =
  process.env.DATABASE_URL ||
  `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

export const pool = new Pool({
  connectionString: DB_URL,
  max: 10,
  idleTimeoutMillis: 30000
})

export const initAuthDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect()
    console.log('📦 [auth-service] Đã kết nối thành công tới database: ecommerce_auth_db')

    // Tạo bảng accounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'customer',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        avatar TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Kiểm tra xem đã có tài khoản khởi tạo chưa
    const checkRes = await client.query('SELECT COUNT(*) FROM accounts;')
    const count = parseInt(checkRes.rows[0].count, 10)

    if (count === 0) {
      console.log('🌱 [auth-service] Khởi tạo tài khoản mẫu trong ecommerce_auth_db...')
      const adminHash = bcrypt.hashSync('admin123', 10)
      const mgrHash = bcrypt.hashSync('manager123', 10)
      const custHash = bcrypt.hashSync('customer123', 10)

      await client.query(`
        INSERT INTO accounts (id, name, email, password_hash, role, is_active, avatar) VALUES
        ('usr-admin-01', 'Nguyễn Văn Quản Trị', 'admin@ecommerce.local', '${adminHash}', 'admin', true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'),
        ('usr-mgr-02', 'Trần Thị Điều Phối', 'manager@ecommerce.local', '${mgrHash}', 'manager', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'),
        ('usr-cust-03', 'Lê Hoàng Khách Mua', 'customer@ecommerce.local', '${custHash}', 'customer', true, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80');
      `)
    }

    client.release()
  } catch (error) {
    console.error('❌ [auth-service] Lỗi khởi tạo database ecommerce_auth_db:', error)
  }
}
