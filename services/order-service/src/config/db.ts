import pg from 'pg'

const { Pool } = pg

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || '5432'
const DB_USER = process.env.DB_USER || 'ecommerce_user'
const DB_PASSWORD = process.env.DB_PASSWORD || 'ecommerce_secret'
const DB_NAME = process.env.DB_NAME || 'ecommerce_order_db'

const DB_URL =
  process.env.DATABASE_URL ||
  `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

export const pool = new Pool({
  connectionString: DB_URL,
  max: 10,
  idleTimeoutMillis: 30000
})

export const initOrderDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect()
    console.log('📦 [order-service] Đã kết nối thành công tới database: ecommerce_order_db')

    // Tạo bảng orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        order_code VARCHAR(64) UNIQUE NOT NULL,
        customer_id VARCHAR(64) NOT NULL,
        customer_name VARCHAR(128) NOT NULL,
        customer_phone VARCHAR(32) NOT NULL,
        customer_address TEXT NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        product_code VARCHAR(64),
        product_name VARCHAR(255) NOT NULL,
        product_thumbnail TEXT,
        item_sku VARCHAR(64),
        item_title VARCHAR(255),
        unit_price BIGINT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_amount BIGINT NOT NULL,
        deposit_rate NUMERIC(3,2) NOT NULL DEFAULT 0.50,
        deposit_amount BIGINT NOT NULL,
        remaining_amount BIGINT NOT NULL,
        order_type VARCHAR(32) NOT NULL DEFAULT 'china_preorder',
        supplier_platform VARCHAR(64) DEFAULT 'Taobao / 1688',
        cn_tracking_code VARCHAR(64),
        vn_tracking_code VARCHAR(64),
        current_checkpoint VARCHAR(64) NOT NULL DEFAULT 'ORDER_DEPOSITED',
        current_status VARCHAR(64) NOT NULL DEFAULT 'processing',
        estimated_delivery_days VARCHAR(64) DEFAULT '7 - 14 ngày',
        estimated_delivery_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(LOWER(order_code));
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(current_status);
    `)

    // Tạo bảng order_tracking_events (Lưu trữ hành trình và các mốc định vị kiện hàng)
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_tracking_events (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
        checkpoint_step INT NOT NULL,
        checkpoint_code VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_completed BOOLEAN DEFAULT FALSE,
        is_current BOOLEAN DEFAULT FALSE
      );
      CREATE INDEX IF NOT EXISTS idx_tracking_order_id ON order_tracking_events(order_id);
      CREATE INDEX IF NOT EXISTS idx_tracking_step ON order_tracking_events(checkpoint_step);
    `)

    // Migration: Bổ sung các cột QC Photos (Ảnh chụp thực tế kiểm hàng tại Kho Quảng Châu)
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS qc_photos TEXT[] DEFAULT '{}';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS qc_status VARCHAR(32) DEFAULT 'none';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS qc_note TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS qc_inspected_at TIMESTAMP WITH TIME ZONE;
    `)

    // Khởi tạo ảnh QC mẫu cho đơn 1 (iPhone 16 Pro Max đang ở Kho Quảng Châu)
    await client.query(`
      UPDATE orders
      SET qc_photos = ARRAY[
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1200&auto=format&fit=crop&q=80'
      ],
      qc_status = 'pending',
      qc_note = 'Đã kiểm tra tại Kho Quảng Châu Hub: Nguyên seal hộp Apple, phụ kiện cáp USB-C đầy đủ, ngoại quan màu Titan Tự Nhiên không trầy xước.',
      qc_inspected_at = CURRENT_TIMESTAMP
      WHERE id = 'ord-2026-001' AND (qc_photos IS NULL OR array_length(qc_photos, 1) IS NULL);
    `)

    // Kiểm tra và seed dữ liệu mẫu
    const checkRes = await client.query('SELECT COUNT(*) FROM orders;')
    const count = parseInt(checkRes.rows[0].count, 10)

    if (count === 0) {
      console.log('🌱 [order-service] Khởi tạo dữ liệu đơn hàng order & tracking mẫu trong ecommerce_order_db...')

      // Đơn 1: Đang ở Kho Quảng Châu (Step 3)
      await client.query(`
        INSERT INTO orders (
          id, order_code, customer_id, customer_name, customer_phone, customer_address,
          product_id, product_code, product_name, product_thumbnail, item_sku, item_title,
          unit_price, quantity, total_amount, deposit_rate, deposit_amount, remaining_amount,
          order_type, supplier_platform, cn_tracking_code, vn_tracking_code,
          current_checkpoint, current_status, estimated_delivery_days, estimated_delivery_date, created_at
        ) VALUES (
          'ord-2026-001', 'ORD-CN-2026-8891', 'user-001', 'Nguyễn Đình Hùng', '0912345678', 'Tòa FPT Tower, Số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
          'prod-001', 'SP-IP16PM', 'iPhone 16 Pro Max 256GB', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
          'IP16PM-256-NAT', 'Bản 256GB - Titan Tự Nhiên', 34990000, 1, 34990000, 0.50, 17495000, 17495000,
          'china_preorder', 'Apple Official Flagship (Tmall Trung Quốc)', 'SF1428938829CN', 'VNPOST-882910',
          'CN_WAREHOUSE_RECEIVED', 'in_transit_cn', '7 - 14 ngày', CURRENT_TIMESTAMP + INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '3 days'
        );
      `)

      // Tracking events cho Đơn 1
      await client.query(`
        INSERT INTO order_tracking_events (id, order_id, checkpoint_step, checkpoint_code, title, location, description, timestamp, is_completed, is_current) VALUES
        ('evt-1-1', 'ord-2026-001', 1, 'ORDER_DEPOSITED', 'Đã đặt cọc 50% thành công', 'Cổng thanh toán OmniOrder - Hà Nội', 'Khách hàng đã thanh toán 17.495.000 đ tiền cọc. Đơn hàng được kích hoạt.', CURRENT_TIMESTAMP - INTERVAL '3 days', true, false),
        ('evt-1-2', 'ord-2026-001', 2, 'SUPPLIER_DISPATCHED', 'Shop Trung Quốc đã gửi hàng', 'Thâm Quyến, Quảng Đông, Trung Quốc', 'Nhà cung cấp đóng gói và bàn giao cho đơn vị vận chuyển nội địa SF Express.', CURRENT_TIMESTAMP - INTERVAL '2 days', true, false),
        ('evt-1-3', 'ord-2026-001', 3, 'CN_WAREHOUSE_RECEIVED', 'Nhập Kho Trung Chuyển Quốc Tế Quảng Châu', 'Kho Tổng Quảng Châu Hub (Quảng Đông, TQ)', 'Kiện hàng đã được kiểm đếm, đóng thùng chống sốc và sẵn sàng xuất khẩu.', CURRENT_TIMESTAMP - INTERVAL '6 hours', true, true),
        ('evt-1-4', 'ord-2026-001', 4, 'CUSTOMS_CLEARING', 'Vận chuyển Cửa khẩu & Thông quan', 'Cửa khẩu Quốc tế Hữu Nghị (Lạng Sơn)', 'Dự kiến làm thủ tục thông quan chính ngạch và kiểm tra hàng hóa.', CURRENT_TIMESTAMP + INTERVAL '2 days', false, false),
        ('evt-1-5', 'ord-2026-001', 5, 'VN_WAREHOUSE_SORTING', 'Nhập Kho Phân loại Việt Nam', 'Kho Trung tâm Hà Nội SOC (Mê Linh, Hà Nội)', 'Phân tuyến giao hàng nội địa đến khu vực người nhận.', CURRENT_TIMESTAMP + INTERVAL '4 days', false, false),
        ('evt-1-6', 'ord-2026-001', 6, 'LOCAL_DELIVERING', 'Giao hàng tận tay & Thu COD còn lại', 'Quận Cầu Giấy, Hà Nội', 'Shipper liên hệ giao hàng và thu số tiền còn lại 17.495.000 đ.', CURRENT_TIMESTAMP + INTERVAL '6 days', false, false);
      `)

      // Đơn 2: Đã về Kho phân loại Hà Nội SOC (Step 5)
      await client.query(`
        INSERT INTO orders (
          id, order_code, customer_id, customer_name, customer_phone, customer_address,
          product_id, product_code, product_name, product_thumbnail, item_sku, item_title,
          unit_price, quantity, total_amount, deposit_rate, deposit_amount, remaining_amount,
          order_type, supplier_platform, cn_tracking_code, vn_tracking_code,
          current_checkpoint, current_status, estimated_delivery_days, estimated_delivery_date, created_at
        ) VALUES (
          'ord-2026-002', 'ORD-CN-2026-5510', 'user-002', 'Trần Thị Thu Thảo', '0987654321', 'Số 45 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
          'prod-003', 'SP-WH1000XM5', 'Tai nghe Sony WH-1000XM5 Chống Ồn', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'SN-WH5-BLK', 'Màu Đen Nhám Midnight Black', 7490000, 1, 7490000, 0.50, 3745000, 3745000,
          'china_preorder', 'Taobao Official Store', 'ZTO-992144182CN', 'GHN-HCM-9921',
          'VN_WAREHOUSE_SORTING', 'in_transit_vn', '7 - 14 ngày', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '8 days'
        );
      `)

      // Tracking events cho Đơn 2
      await client.query(`
        INSERT INTO order_tracking_events (id, order_id, checkpoint_step, checkpoint_code, title, location, description, timestamp, is_completed, is_current) VALUES
        ('evt-2-1', 'ord-2026-002', 1, 'ORDER_DEPOSITED', 'Đã đặt cọc 50% thành công', 'Cổng thanh toán OmniOrder', 'Khách hàng đặt cọc 3.745.000 đ thành công.', CURRENT_TIMESTAMP - INTERVAL '8 days', true, false),
        ('evt-2-2', 'ord-2026-002', 2, 'SUPPLIER_DISPATCHED', 'Shop Trung Quốc xuất kho', 'Ninh Ba, Chiết Giang, Trung Quốc', 'Bàn giao cho đơn vị vận chuyển ZTO Express.', CURRENT_TIMESTAMP - INTERVAL '7 days', true, false),
        ('evt-2-3', 'ord-2026-002', 3, 'CN_WAREHOUSE_RECEIVED', 'Nhập Kho Quảng Châu Hub', 'Kho Tổng Quảng Châu (TQ)', 'Kiện hàng hoàn tất kiểm tra và bốc dỡ lên xe vận tải quốc tế.', CURRENT_TIMESTAMP - INTERVAL '5 days', true, false),
        ('evt-2-4', 'ord-2026-002', 4, 'CUSTOMS_CLEARING', 'Hoàn tất Thông quan Cửa khẩu', 'Cửa khẩu Hữu Nghị (Lạng Sơn)', 'Kiện hàng đã thông quan hải quan hợp lệ, bàn giao bưu chính Việt Nam.', CURRENT_TIMESTAMP - INTERVAL '2 days', true, false),
        ('evt-2-5', 'ord-2026-002', 5, 'VN_WAREHOUSE_SORTING', 'Đã nhập Kho Phân loại TP.HCM SOC', 'Kho Tân Bình SOC (TP. Hồ Chí Minh)', 'Đang phân loại theo tuyến bưu tá Quận 1 để tiến hành giao hàng sáng mai.', CURRENT_TIMESTAMP - INTERVAL '3 hours', true, true),
        ('evt-2-6', 'ord-2026-002', 6, 'LOCAL_DELIVERING', 'Giao hàng tận tay & Thu COD còn lại', 'Quận 1, TP. Hồ Chí Minh', 'Bưu tá giao hàng và thu số tiền COD còn lại 3.745.000 đ.', CURRENT_TIMESTAMP + INTERVAL '1 day', false, false);
      `)
    }

    client.release()
  } catch (error) {
    console.error('❌ [order-service] Lỗi khởi tạo database ecommerce_order_db:', error)
  }
}
