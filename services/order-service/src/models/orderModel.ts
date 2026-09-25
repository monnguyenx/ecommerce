import { pool } from '../config/db.js'
import {
  Order,
  OrderTrackingEvent,
  CreateOrderPayload,
  CheckpointCode,
  OrderStatus
} from '../types/order.js'

export class OrderModel {
  static async findAll(filter: {
    search?: string
    status?: string
    customerId?: string
    page?: number
    limit?: number
  } = {}): Promise<{ orders: Order[]; total: number }> {
    try {
      const conditions: string[] = []
      const values: any[] = []
      let idx = 1

      if (filter.search) {
        conditions.push(`(
          LOWER(o.order_code) LIKE $${idx}
          OR LOWER(o.customer_name) LIKE $${idx}
          OR LOWER(o.customer_phone) LIKE $${idx}
          OR LOWER(o.product_name) LIKE $${idx}
          OR LOWER(COALESCE(o.cn_tracking_code, '')) LIKE $${idx}
          OR LOWER(COALESCE(o.vn_tracking_code, '')) LIKE $${idx}
        )`)
        values.push(`%${filter.search.toLowerCase()}%`)
        idx++
      }

      if (filter.status) {
        conditions.push(`o.current_status = $${idx}`)
        values.push(filter.status)
        idx++
      }

      if (filter.customerId) {
        conditions.push(`o.customer_id = $${idx}`)
        values.push(filter.customerId)
        idx++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const countRes = await pool.query(`SELECT COUNT(*) FROM orders o ${whereClause}`, values)
      const total = parseInt(countRes.rows[0].count, 10)

      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit

      const queryStr = `
        SELECT o.id, o.order_code as "orderCode", o.customer_id as "customerId",
               o.customer_name as "customerName", o.customer_phone as "customerPhone",
               o.customer_address as "customerAddress", o.product_id as "productId",
               o.product_code as "productCode", o.product_name as "productName",
               o.product_thumbnail as "productThumbnail", o.item_sku as "itemSku",
               o.item_title as "itemTitle", o.unit_price::bigint as "unitPrice",
               o.quantity, o.total_amount::bigint as "totalAmount",
               o.deposit_rate::float as "depositRate", o.deposit_amount::bigint as "depositAmount",
               o.remaining_amount::bigint as "remainingAmount", o.order_type as "orderType",
               o.supplier_platform as "supplierPlatform", o.cn_tracking_code as "cnTrackingCode",
               o.vn_tracking_code as "vnTrackingCode", o.current_checkpoint as "currentCheckpoint",
               o.current_status as "currentStatus", o.estimated_delivery_days as "estimatedDeliveryDays",
               o.estimated_delivery_date as "estimatedDeliveryDate",
               o.created_at as "createdAt", o.updated_at as "updatedAt"
        FROM orders o
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `
      values.push(limit, offset)

      const res = await pool.query(queryStr, values)
      const orders: Order[] = res.rows.map((row) => ({
        ...row,
        unitPrice: Number(row.unitPrice),
        totalAmount: Number(row.totalAmount),
        depositAmount: Number(row.depositAmount),
        remainingAmount: Number(row.remainingAmount)
      }))

      return { orders, total }
    } catch (error) {
      console.error('[order-service] OrderModel.findAll error:', error)
      return { orders: [], total: 0 }
    }
  }

  static async findById(id: string): Promise<Order | null> {
    try {
      const res = await pool.query(
        `SELECT o.id, o.order_code as "orderCode", o.customer_id as "customerId",
                o.customer_name as "customerName", o.customer_phone as "customerPhone",
                o.customer_address as "customerAddress", o.product_id as "productId",
                o.product_code as "productCode", o.product_name as "productName",
                o.product_thumbnail as "productThumbnail", o.item_sku as "itemSku",
                o.item_title as "itemTitle", o.unit_price::bigint as "unitPrice",
                o.quantity, o.total_amount::bigint as "totalAmount",
                o.deposit_rate::float as "depositRate", o.deposit_amount::bigint as "depositAmount",
                o.remaining_amount::bigint as "remainingAmount", o.order_type as "orderType",
                o.supplier_platform as "supplierPlatform", o.cn_tracking_code as "cnTrackingCode",
                o.vn_tracking_code as "vnTrackingCode", o.current_checkpoint as "currentCheckpoint",
                o.current_status as "currentStatus", o.estimated_delivery_days as "estimatedDeliveryDays",
                o.estimated_delivery_date as "estimatedDeliveryDate",
                o.created_at as "createdAt", o.updated_at as "updatedAt"
         FROM orders o WHERE o.id = $1`,
        [id]
      )

      if (res.rows.length === 0) return null

      const row = res.rows[0]
      const order: Order = {
        ...row,
        unitPrice: Number(row.unitPrice),
        totalAmount: Number(row.totalAmount),
        depositAmount: Number(row.depositAmount),
        remainingAmount: Number(row.remainingAmount)
      }

      // Nạp danh sách các mốc định vị tracking
      const eventsRes = await pool.query(
        `SELECT id, order_id as "orderId", checkpoint_step as "checkpointStep",
                checkpoint_code as "checkpointCode", title, location, description,
                timestamp, is_completed as "isCompleted", is_current as "isCurrent"
         FROM order_tracking_events
         WHERE order_id = $1
         ORDER BY checkpoint_step ASC`,
        [id]
      )

      order.trackingEvents = eventsRes.rows
      return order
    } catch (error) {
      console.error('[order-service] OrderModel.findById error:', error)
      return null
    }
  }

  static async findByCode(code: string): Promise<Order | null> {
    try {
      const trimmed = code.trim().toLowerCase()
      const res = await pool.query(
        `SELECT id FROM orders
         WHERE LOWER(order_code) = $1
            OR LOWER(COALESCE(cn_tracking_code, '')) = $1
            OR LOWER(COALESCE(vn_tracking_code, '')) = $1
         LIMIT 1`,
        [trimmed]
      )

      if (res.rows.length === 0) return null
      return this.findById(res.rows[0].id)
    } catch (error) {
      console.error('[order-service] OrderModel.findByCode error:', error)
      return null
    }
  }

  static async create(payload: CreateOrderPayload): Promise<Order> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const newId = `ord-${Date.now().toString(36)}`
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      const orderCode = `ORD-CN-2026-${randomSuffix}`

      const totalAmount = payload.unitPrice * (payload.quantity || 1)
      const depositRate = payload.depositRate ?? 0.50
      const depositAmount = Math.round(totalAmount * depositRate)
      const remainingAmount = totalAmount - depositAmount

      const cnTrackingCode = `SF${Math.floor(1000000000 + Math.random() * 9000000000)}CN`
      const vnTrackingCode = `VNPOST-${randomSuffix}`

      // Tạo bản ghi đơn hàng
      const orderRes = await client.query(
        `INSERT INTO orders (
          id, order_code, customer_id, customer_name, customer_phone, customer_address,
          product_id, product_code, product_name, product_thumbnail, item_sku, item_title,
          unit_price, quantity, total_amount, deposit_rate, deposit_amount, remaining_amount,
          order_type, supplier_platform, cn_tracking_code, vn_tracking_code,
          current_checkpoint, current_status, estimated_delivery_days, estimated_delivery_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          'china_preorder', $19, $20, $21, 'ORDER_DEPOSITED', 'processing', '7 - 14 ngày',
          CURRENT_TIMESTAMP + INTERVAL '10 days'
        ) RETURNING *;`,
        [
          newId,
          orderCode,
          payload.customerId,
          payload.customerName,
          payload.customerPhone,
          payload.customerAddress,
          payload.productId,
          payload.productCode || 'SP-UNKNOWN',
          payload.productName,
          payload.productThumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          payload.itemSku || 'SKU-DEFAULT',
          payload.itemTitle || payload.productName,
          payload.unitPrice,
          payload.quantity || 1,
          totalAmount,
          depositRate,
          depositAmount,
          remainingAmount,
          payload.supplierPlatform || 'Taobao / 1688 / Tmall',
          cnTrackingCode,
          vnTrackingCode
        ]
      )

      // Khởi tạo 6 chặng logistics xuyên biên giới
      const events: Array<{
        step: number
        code: CheckpointCode
        title: string
        location: string
        desc: string
        isCompleted: boolean
        isCurrent: boolean
        interval: string
      }> = [
        {
          step: 1,
          code: 'ORDER_DEPOSITED',
          title: `Đã xác nhận đơn hàng & Đặt cọc 50% (${depositAmount.toLocaleString('vi-VN')} đ)`,
          location: 'Cổng thanh toán OmniOrder - Hà Nội',
          desc: `Khách hàng ${payload.customerName} đã thanh toán số tiền cọc 50%. Đơn hàng đã được chuyển tiếp sang bộ phận thu mua tại Trung Quốc.`,
          isCompleted: true,
          isCurrent: true,
          interval: '0 hours'
        },
        {
          step: 2,
          code: 'SUPPLIER_DISPATCHED',
          title: 'Shop bên Trung Quốc xuất kho & Đóng gói',
          location: 'Thâm Quyến / Chiết Giang, Trung Quốc',
          desc: `Nhà cung cấp tiếp nhận đơn order và đóng gói kiện hàng theo tiêu chuẩn vận tải quốc tế (Mã SF: ${cnTrackingCode}).`,
          isCompleted: false,
          isCurrent: false,
          interval: '2 days'
        },
        {
          step: 3,
          code: 'CN_WAREHOUSE_RECEIVED',
          title: 'Nhập Kho Trung Chuyển Quốc Tế Quảng Châu',
          location: 'Kho Tổng Quảng Châu Hub (Quảng Đông, Trung Quốc)',
          desc: 'Kiện hàng được kiểm đếm, chụp ảnh niêm phong và đóng kiện gỗ chống sốc sẵn sàng vận tải đường bộ về Cửa khẩu.',
          isCompleted: false,
          isCurrent: false,
          interval: '4 days'
        },
        {
          step: 4,
          code: 'CUSTOMS_CLEARING',
          title: 'Hàng tới Cửa khẩu Quốc tế & Làm thủ tục Thông quan',
          location: 'Cửa khẩu Quốc tế Hữu Nghị (Lạng Sơn, Việt Nam)',
          desc: 'Tiến hành thông quan hải quan chính ngạch, kiểm tra mã HS Code và đóng thuế nhập khẩu.',
          isCompleted: false,
          isCurrent: false,
          interval: '7 days'
        },
        {
          step: 5,
          code: 'VN_WAREHOUSE_SORTING',
          title: 'Đã thông quan & Nhập Kho phân loại Việt Nam',
          location: 'Kho Phân loại Trung tâm (Hà Nội SOC / TP.HCM SOC)',
          desc: 'Kiện hàng đã về tới lãnh thổ Việt Nam, tiến hành dán tem vận chuyển chặng cuối bưu chính.',
          isCompleted: false,
          isCurrent: false,
          interval: '9 days'
        },
        {
          step: 6,
          code: 'LOCAL_DELIVERING',
          title: `Shipper giao hàng tận nơi & Thu số tiền còn lại (${remainingAmount.toLocaleString('vi-VN')} đ)`,
          location: payload.customerAddress,
          desc: `Bưu tá giao tận tay khách hàng. Khách kiểm tra kiện hàng và thanh toán số tiền COD còn lại ${remainingAmount.toLocaleString('vi-VN')} đ.`,
          isCompleted: false,
          isCurrent: false,
          interval: '11 days'
        }
      ]

      for (const ev of events) {
        await client.query(
          `INSERT INTO order_tracking_events (
            id, order_id, checkpoint_step, checkpoint_code, title, location, description, timestamp, is_completed, is_current
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP + ($8)::interval, $9, $10
          )`,
          [
            `evt-${newId}-${ev.step}`,
            newId,
            ev.step,
            ev.code,
            ev.title,
            ev.location,
            ev.desc,
            ev.interval,
            ev.isCompleted,
            ev.isCurrent
          ]
        )
      }

      await client.query('COMMIT')
      return (await this.findById(newId))!
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('[order-service] OrderModel.create error:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // Cập nhật bước tiến trình vận chuyển & thông tin chi tiết mốc (Dành cho Admin quản lý)
  static async updateCheckpoint(
    orderId: string,
    checkpointStep: number,
    options?: {
      location?: string
      description?: string
      title?: string
      note?: string
    }
  ): Promise<Order | null> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Cập nhật trạng thái các events
      // Các bước <= checkpointStep: is_completed = true
      // Bước == checkpointStep: is_current = true
      // Các bước > checkpointStep: is_completed = false, is_current = false
      await client.query(
        `UPDATE order_tracking_events
         SET is_completed = (checkpoint_step <= $1),
             is_current = (checkpoint_step = $1),
             timestamp = CASE WHEN checkpoint_step <= $1 THEN CURRENT_TIMESTAMP ELSE timestamp END
         WHERE order_id = $2`,
        [checkpointStep, orderId]
      )

      // Nếu có cập nhật vị trí hoặc mô tả chi tiết cho mốc hiện tại
      if (options?.location || options?.description || options?.title || options?.note) {
        const desc = options.description || options.note
        await client.query(
          `UPDATE order_tracking_events
           SET location = COALESCE($3, location),
               description = COALESCE($4, description),
               title = COALESCE($5, title)
           WHERE order_id = $1 AND checkpoint_step = $2`,
          [orderId, checkpointStep, options.location || null, desc || null, options.title || null]
        )
      }

      // Lấy checkpoint_code tương ứng
      const stepRes = await client.query(
        `SELECT checkpoint_code FROM order_tracking_events WHERE order_id = $1 AND checkpoint_step = $2`,
        [orderId, checkpointStep]
      )

      const cpCode: CheckpointCode = stepRes.rows[0]?.checkpoint_code || 'ORDER_DEPOSITED'

      let newStatus: OrderStatus = 'processing'
      if (checkpointStep >= 2 && checkpointStep <= 3) newStatus = 'in_transit_cn'
      else if (checkpointStep === 4) newStatus = 'customs'
      else if (checkpointStep === 5) newStatus = 'in_transit_vn'
      else if (checkpointStep === 6) newStatus = 'delivering'

      await client.query(
        `UPDATE orders
         SET current_checkpoint = $1, current_status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [cpCode, newStatus, orderId]
      )

      await client.query('COMMIT')
      return this.findById(orderId)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('[order-service] OrderModel.updateCheckpoint error:', error)
      return null
    } finally {
      client.release()
    }
  }

  // Cập nhật thông tin đơn hàng & mã vận đơn (Dành cho Admin)
  static async updateOrder(
    orderId: string,
    updates: {
      cnTrackingCode?: string
      vnTrackingCode?: string
      estimatedDeliveryDays?: string
      currentStatus?: OrderStatus
      customerPhone?: string
      customerAddress?: string
      supplierPlatform?: string
    }
  ): Promise<Order | null> {
    try {
      const existing = await this.findById(orderId)
      if (!existing) return null

      const cnTrackingCode = updates.cnTrackingCode !== undefined ? updates.cnTrackingCode : existing.cnTrackingCode
      const vnTrackingCode = updates.vnTrackingCode !== undefined ? updates.vnTrackingCode : existing.vnTrackingCode
      const estimatedDeliveryDays = updates.estimatedDeliveryDays !== undefined ? updates.estimatedDeliveryDays : existing.estimatedDeliveryDays
      const currentStatus = updates.currentStatus !== undefined ? updates.currentStatus : existing.currentStatus
      const customerPhone = updates.customerPhone !== undefined ? updates.customerPhone : existing.customerPhone
      const customerAddress = updates.customerAddress !== undefined ? updates.customerAddress : existing.customerAddress
      const supplierPlatform = updates.supplierPlatform !== undefined ? updates.supplierPlatform : existing.supplierPlatform

      await pool.query(
        `UPDATE orders
         SET cn_tracking_code = $1, vn_tracking_code = $2, estimated_delivery_days = $3,
             current_status = $4, customer_phone = $5, customer_address = $6, supplier_platform = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [cnTrackingCode, vnTrackingCode, estimatedDeliveryDays, currentStatus, customerPhone, customerAddress, supplierPlatform, orderId]
      )

      return this.findById(orderId)
    } catch (error) {
      console.error('[order-service] OrderModel.updateOrder error:', error)
      return null
    }
  }

  // Cập nhật chi tiết 1 mốc sự kiện cụ thể trong Timeline (Dành cho Admin)
  static async updateEvent(
    orderId: string,
    eventId: string,
    updates: {
      title?: string
      location?: string
      description?: string
      isCompleted?: boolean
      isCurrent?: boolean
      timestamp?: string
    }
  ): Promise<Order | null> {
    try {
      const res = await pool.query(
        'SELECT * FROM order_tracking_events WHERE id = $1 AND order_id = $2',
        [eventId, orderId]
      )
      if (res.rows.length === 0) return null
      const existing = res.rows[0]

      const title = updates.title ?? existing.title
      const location = updates.location ?? existing.location
      const description = updates.description ?? existing.description
      const isCompleted = updates.isCompleted ?? existing.is_completed
      const isCurrent = updates.isCurrent ?? existing.is_current
      const timestamp = updates.timestamp ?? existing.timestamp

      await pool.query(
        `UPDATE order_tracking_events
         SET title = $1, location = $2, description = $3, is_completed = $4, is_current = $5, timestamp = $6
         WHERE id = $7 AND order_id = $8`,
        [title, location, description, isCompleted, isCurrent, timestamp, eventId, orderId]
      )

      return this.findById(orderId)
    } catch (error) {
      console.error('[order-service] OrderModel.updateEvent error:', error)
      return null
    }
  }

  // Thêm sự kiện mốc mới vào lộ trình (Dành cho Admin)
  static async addEvent(
    orderId: string,
    payload: {
      title: string
      location: string
      description: string
      checkpointStep?: number
      checkpointCode?: CheckpointCode
      isCompleted?: boolean
      isCurrent?: boolean
    }
  ): Promise<Order | null> {
    try {
      const newId = `evt-${Date.now().toString(36)}`
      const maxStepRes = await pool.query(
        'SELECT COALESCE(MAX(checkpoint_step), 0) as "maxStep" FROM order_tracking_events WHERE order_id = $1',
        [orderId]
      )
      const nextStep = payload.checkpointStep || parseInt(maxStepRes.rows[0].maxStep, 10) + 1
      const cpCode = payload.checkpointCode || 'CUSTOMS_CLEARING'

      await pool.query(
        `INSERT INTO order_tracking_events (
          id, order_id, checkpoint_step, checkpoint_code, title, location, description, timestamp, is_completed, is_current
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, $9)`,
        [
          newId,
          orderId,
          nextStep,
          cpCode,
          payload.title,
          payload.location,
          payload.description,
          payload.isCompleted ?? true,
          payload.isCurrent ?? true
        ]
      )

      return this.findById(orderId)
    } catch (error) {
      console.error('[order-service] OrderModel.addEvent error:', error)
      return null
    }
  }

  static async getStats(): Promise<{
    totalOrders: number
    totalRevenue: number
    totalDeposits: number
    inTransitCount: number
    customsCount: number
    deliveringCount: number
  }> {
    try {
      const res = await pool.query(`
        SELECT
          COUNT(*) as "totalOrders",
          COALESCE(SUM(total_amount), 0) as "totalRevenue",
          COALESCE(SUM(deposit_amount), 0) as "totalDeposits",
          COUNT(*) FILTER (WHERE current_status IN ('in_transit_cn', 'processing')) as "inTransitCount",
          COUNT(*) FILTER (WHERE current_status = 'customs') as "customsCount",
          COUNT(*) FILTER (WHERE current_status IN ('in_transit_vn', 'delivering')) as "deliveringCount"
        FROM orders;
      `)

      const row = res.rows[0]
      return {
        totalOrders: parseInt(row.totalOrders, 10),
        totalRevenue: Number(row.totalRevenue),
        totalDeposits: Number(row.totalDeposits),
        inTransitCount: parseInt(row.inTransitCount, 10),
        customsCount: parseInt(row.customsCount, 10),
        deliveringCount: parseInt(row.deliveringCount, 10)
      }
    } catch (error) {
      console.error('[order-service] OrderModel.getStats error:', error)
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalDeposits: 0,
        inTransitCount: 0,
        customsCount: 0,
        deliveringCount: 0
      }
    }
  }
}
