import pg from 'pg'

const { Pool } = pg

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || '5432'
const DB_USER = process.env.DB_USER || 'ecommerce_user'
const DB_PASSWORD = process.env.DB_PASSWORD || 'ecommerce_secret'
const DB_NAME = process.env.DB_NAME || 'ecommerce_product_db'

const DB_URL =
  process.env.DATABASE_URL ||
  `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

export const pool = new Pool({
  connectionString: DB_URL,
  max: 10,
  idleTimeoutMillis: 30000
})

export const initProductDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect()
    console.log('📦 [product-service] Đã kết nối thành công tới database: ecommerce_product_db')

    // Tạo bảng products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        category VARCHAR(128) NOT NULL,
        brand VARCHAR(128) NOT NULL,
        description TEXT,
        thumbnail TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
        total_sales INT NOT NULL DEFAULT 0,
        order_type VARCHAR(32) NOT NULL DEFAULT 'china_preorder',
        origin VARCHAR(128) NOT NULL DEFAULT 'Trung Quốc (Nội địa)',
        estimated_days VARCHAR(64) NOT NULL DEFAULT '7 - 14 ngày',
        deposit_rate NUMERIC(3,2) NOT NULL DEFAULT 0.50,
        supplier_platform VARCHAR(64) NOT NULL DEFAULT 'Taobao / 1688 / Tmall',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE products ADD COLUMN IF NOT EXISTS code VARCHAR(64);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS order_type VARCHAR(32) NOT NULL DEFAULT 'china_preorder';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS origin VARCHAR(128) NOT NULL DEFAULT 'Trung Quốc (Nội địa)';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS estimated_days VARCHAR(64) NOT NULL DEFAULT '7 - 14 ngày';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS deposit_rate NUMERIC(3,2) NOT NULL DEFAULT 0.50;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_platform VARCHAR(64) NOT NULL DEFAULT 'Taobao / 1688 / Tmall';
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code_unique ON products(code) WHERE code IS NOT NULL;
    `)

    // Tạo bảng product_items (các mặt hàng / biến thể SKU)
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_items (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(64) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        price BIGINT NOT NULL,
        original_price BIGINT,
        stock_quantity INT NOT NULL DEFAULT 0,
        barcode VARCHAR(64),
        attributes JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Tạo bảng product_codes (Lưu trữ và tra cứu toàn bộ mã sản phẩm, SKU, Barcode)
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_codes (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
        item_id VARCHAR(64) REFERENCES product_items(id) ON DELETE SET NULL,
        code VARCHAR(64) NOT NULL,
        code_type VARCHAR(32) NOT NULL, -- 'PRODUCT_CODE', 'SKU', 'BARCODE', 'QR_CODE'
        description VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_product_codes_code ON product_codes(LOWER(code));
      CREATE INDEX IF NOT EXISTS idx_product_codes_product_id ON product_codes(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_codes_type ON product_codes(code_type);
    `)

    // Kiểm tra xem đã có dữ liệu sản phẩm chưa
    const checkRes = await client.query('SELECT COUNT(*) FROM products;')
    const count = parseInt(checkRes.rows[0].count, 10)

    if (count === 0) {
      console.log('🌱 [product-service] Khởi tạo dữ liệu sản phẩm & mặt hàng mẫu trong ecommerce_product_db...')
      
      // Seed 7 sản phẩm
      await client.query(`
        INSERT INTO products (id, code, name, slug, category, brand, description, thumbnail, status, rating, total_sales) VALUES
        ('prod-001', 'SP-IP16PM', 'iPhone 16 Pro Max 256GB', 'iphone-16-pro-max-256gb', 'Điện thoại & Phụ kiện', 'Apple', 'Thiết kế Titan chuẩn hàng không vũ trụ, chip A18 Pro mạnh mẽ, camera Fusion 48MP.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80', 'active', 4.90, 284),
        ('prod-002', 'SP-MBP14', 'MacBook Pro 14 M4 Pro 2026', 'macbook-pro-14-m4-pro-2026', 'Máy tính & Laptop', 'Apple', 'Hiệu năng đỉnh cao với chip M4 Pro thế hệ mới, màn hình Liquid Retina XDR.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80', 'active', 4.95, 115),
        ('prod-003', 'SP-WH1000XM5', 'Tai nghe Sony WH-1000XM5 Chống Ồn', 'tai-nghe-sony-wh-1000xm5', 'Âm thanh & Phụ kiện', 'Sony', 'Công nghệ chống ồn chủ động hàng đầu ngành với bộ xử lý V1, chất âm Hi-Res Audio.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', 'active', 4.80, 412),
        ('prod-004', 'SP-KEY-Q1P', 'Bàn phím cơ không dây Keychron Q1 Pro', 'ban-phim-co-keychron-q1-pro', 'Phụ kiện máy tính', 'Keychron', 'Vỏ nhôm CNC nguyên khối, layout 75%, kết nối Bluetooth 5.1 và có dây.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', 'active', 4.75, 189),
        ('prod-005', 'SP-LG-27UP', 'Màn hình LG UltraFine 27 inch 4K IPS', 'man-hinh-lg-ultrafine-27-4k', 'Màn hình', 'LG', 'Độ phân giải 4K UHD 3840x2160, chuẩn màu DCI-P3 95%, hỗ trợ HDR400 và cổng Type-C 90W.', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80', 'active', 4.85, 96),
        ('prod-006', 'SP-AWU2', 'Đồng hồ thông minh Apple Watch Ultra 2', 'apple-watch-ultra-2', 'Đồng hồ & Smartwatch', 'Apple', 'Vỏ Titan đen 49mm chống nước 100m, màn hình sáng 3000 nits, GPS tần số kép.', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80', 'active', 4.90, 167),
        ('prod-007', 'SP-MS-STAN3', 'Loa Bluetooth Marshall Stanmore III', 'loa-marshall-stanmore-iii', 'Âm thanh & Phụ kiện', 'Marshall', 'Thiết kế vintage cổ điển huyền thoại, âm trường rộng với Dynamic Loudness.', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80', 'active', 4.88, 230);
      `)

      // Seed mặt hàng / biến thể items
      await client.query(`
        INSERT INTO product_items (id, product_id, sku, title, price, original_price, stock_quantity, barcode, attributes) VALUES
        ('item-001-1', 'prod-001', 'IP16PM-256-NAT', 'Bản 256GB - Titan Tự Nhiên', 34990000, 36990000, 45, '893850123401', '{"color": "Titan Tự Nhiên", "storage": "256GB"}'::jsonb),
        ('item-001-2', 'prod-001', 'IP16PM-256-DES', 'Bản 256GB - Titan Sa Mạc', 34990000, 36990000, 32, '893850123402', '{"color": "Titan Sa Mạc", "storage": "256GB"}'::jsonb),
        ('item-001-3', 'prod-001', 'IP16PM-512-BLK', 'Bản 512GB - Titan Đen', 40990000, 42990000, 18, '893850123403', '{"color": "Titan Đen", "storage": "512GB"}'::jsonb),
        ('item-002-1', 'prod-002', 'MBP14-M4P-24-512', '24GB RAM / 512GB SSD - Đen Không Gian', 49990000, 52990000, 22, '893850123411', '{"ram": "24GB", "storage": "512GB"}'::jsonb),
        ('item-002-2', 'prod-002', 'MBP14-M4P-48-1TB', '48GB RAM / 1TB SSD - Bạc', 64990000, 67990000, 12, '893850123412', '{"ram": "48GB", "storage": "1TB"}'::jsonb),
        ('item-003-1', 'prod-003', 'SN-WH5-BLK', 'Màu Đen Nhám Midnight Black', 7490000, 8490000, 65, '893850123421', '{"color": "Đen Nhám"}'::jsonb),
        ('item-003-2', 'prod-003', 'SN-WH5-SLV', 'Màu Trắng Bạc Platinum Silver', 7490000, 8490000, 40, '893850123422', '{"color": "Bạc Ánh Kim"}'::jsonb),
        ('item-004-1', 'prod-004', 'KC-Q1P-RED', 'Switch Red (Êm, gõ mượt) - Màu Xám', 4350000, 4790000, 28, '893850123431', '{"switch": "Red"}'::jsonb),
        ('item-004-2', 'prod-004', 'KC-Q1P-BRN', 'Switch Brown (Khấc nhẹ) - Màu Trắng', 4350000, 4790000, 15, '893850123432', '{"switch": "Brown"}'::jsonb),
        ('item-005-1', 'prod-005', 'LG-27UP850N', 'LG 27UP850N-W Chân công thái học Ergo', 9990000, 11500000, 14, '893850123441', '{"size": "27 inch"}'::jsonb),
        ('item-006-1', 'prod-006', 'AWU2-49-TRAIL', 'Dây Trail Loop Xanh/Đen - Cỡ S/M', 21990000, 22990000, 25, '893850123451', '{"strap": "Trail Loop"}'::jsonb),
        ('item-006-2', 'prod-006', 'AWU2-49-OCEAN', 'Dây Ocean Xanh Đậm - Lặn chuyên nghiệp', 21990000, 22990000, 19, '893850123452', '{"strap": "Ocean Band"}'::jsonb),
        ('item-007-1', 'prod-007', 'MS-STAN3-BLK', 'Màu Đen Cổ Điển Black Gold', 8990000, 9990000, 30, '893850123461', '{"color": "Black Gold"}'::jsonb),
        ('item-007-2', 'prod-007', 'MS-STAN3-CRM', 'Màu Trắng Kem Cream Vintage', 8990000, 9990000, 24, '893850123462', '{"color": "Cream Vintage"}'::jsonb);
      `)
    }

    // Tự động đồng bộ và gán mã code cho các sản phẩm hiện có
    const defaultCodes: Record<string, string> = {
      'prod-001': 'SP-IP16PM',
      'prod-002': 'SP-MBP14',
      'prod-003': 'SP-WH1000XM5',
      'prod-004': 'SP-KEY-Q1P',
      'prod-005': 'SP-LG-27UP',
      'prod-006': 'SP-AWU2',
      'prod-007': 'SP-MS-STAN3',
      'prod-mudtsl7w': 'SP-AP-PRO'
    }

    const prodsWithoutCode = await client.query('SELECT id, name FROM products WHERE code IS NULL OR code = \'\'')
    for (const p of prodsWithoutCode.rows) {
      const assignedCode = defaultCodes[p.id] || `SP-${p.id.replace('prod-', '').toUpperCase()}`
      await client.query('UPDATE products SET code = $1 WHERE id = $2', [assignedCode, p.id])
    }

    // Đồng bộ toàn bộ mã vào bảng product_codes (Mã sản phẩm, SKU, Barcode)
    const allProds = await client.query('SELECT id, code, name FROM products')
    for (const p of allProds.rows) {
      if (p.code) {
        await client.query(`
          INSERT INTO product_codes (id, product_id, item_id, code, code_type, description, is_primary)
          VALUES ($1, $2, NULL, $3, 'PRODUCT_CODE', $4, true)
          ON CONFLICT (id) DO NOTHING
        `, [`code-${p.id}-primary`, p.id, p.code, `Mã sản phẩm: ${p.name}`])
      }
    }

    const allItems = await client.query('SELECT id, product_id, sku, barcode, title FROM product_items')
    for (const it of allItems.rows) {
      if (it.sku) {
        await client.query(`
          INSERT INTO product_codes (id, product_id, item_id, code, code_type, description, is_primary)
          VALUES ($1, $2, $3, $4, 'SKU', $5, false)
          ON CONFLICT (id) DO NOTHING
        `, [`code-sku-${it.id}`, it.product_id, it.id, it.sku, `Mã SKU mặt hàng: ${it.title}`])
      }
      if (it.barcode) {
        await client.query(`
          INSERT INTO product_codes (id, product_id, item_id, code, code_type, description, is_primary)
          VALUES ($1, $2, $3, $4, 'BARCODE', $5, false)
          ON CONFLICT (id) DO NOTHING
        `, [`code-bar-${it.id}`, it.product_id, it.id, it.barcode, `Mã vạch Barcode: ${it.title}`])
      }
    }

    client.release()
  } catch (error) {
    console.error('❌ [product-service] Lỗi khởi tạo database ecommerce_product_db:', error)
  }
}
