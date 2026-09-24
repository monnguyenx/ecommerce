import pg from 'pg'

const { Pool } = pg

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || '5432'
const DB_USER = process.env.DB_USER || 'ecommerce_user'
const DB_PASSWORD = process.env.DB_PASSWORD || 'ecommerce_secret'
const DB_NAME = process.env.DB_NAME || 'ecommerce_user_db'

const DB_URL =
  process.env.DATABASE_URL ||
  `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

export const pool = new Pool({
  connectionString: DB_URL,
  max: 10,
  idleTimeoutMillis: 30000
})

export const initUserDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect()
    console.log('📦 [user-service] Đã kết nối thành công tới database: ecommerce_user_db')

    // Tạo bảng user_profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(32),
        role VARCHAR(32) NOT NULL DEFAULT 'customer',
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        avatar TEXT,
        total_orders INT NOT NULL DEFAULT 0,
        total_spent BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Tạo bảng user_addresses
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES user_profiles(id) ON DELETE CASCADE,
        street VARCHAR(255) NOT NULL,
        ward VARCHAR(128) NOT NULL,
        district VARCHAR(128) NOT NULL,
        city VARCHAR(128) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Kiểm tra xem đã có hồ sơ người dùng chưa
    const checkRes = await client.query('SELECT COUNT(*) FROM user_profiles;')
    const count = parseInt(checkRes.rows[0].count, 10)

    if (count === 0) {
      console.log('🌱 [user-service] Khởi tạo hồ sơ người dùng mẫu trong ecommerce_user_db...')
      await client.query(`
        INSERT INTO user_profiles (id, name, email, phone, role, status, avatar, total_orders, total_spent) VALUES
        ('usr-admin-01', 'Nguyễn Văn Quản Trị', 'admin@ecommerce.local', '0901234567', 'admin', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', 0, 0),
        ('usr-mgr-02', 'Trần Thị Điều Phối', 'manager@ecommerce.local', '0912345678', 'manager', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', 18, 12500000),
        ('usr-cust-03', 'Lê Hoàng Khách Mua', 'customer@ecommerce.local', '0987654321', 'customer', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', 42, 38900000),
        ('usr-cust-04', 'Phạm Minh Đức', 'duc.pham@gmail.com', '0933445566', 'customer', 'active', NULL, 5, 4200000),
        ('usr-cust-05', 'Võ Mai Anh', 'maianh.vo@outlook.com', '0977889900', 'customer', 'active', NULL, 12, 9800000);
      `)

      await client.query(`
        INSERT INTO user_addresses (id, user_id, street, ward, district, city, is_default) VALUES
        ('addr-01', 'usr-admin-01', '72 Lê Thánh Tôn', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', true),
        ('addr-02', 'usr-mgr-02', '15 Duy Tân', 'Dịch Vọng Hậu', 'Cầu Giấy', 'Hà Nội', true),
        ('addr-03', 'usr-cust-03', '234 Nguyễn Thị Minh Khai', 'Phường 6', 'Quận 3', 'TP. Hồ Chí Minh', true);
      `)
    }

    client.release()
  } catch (error) {
    console.error('❌ [user-service] Lỗi khởi tạo database ecommerce_user_db:', error)
  }
}
