import { Request, Response } from 'express'
import { OrderModel } from '../models/orderModel.js'

export class OrderController {
  // GET /api/v1/orders (Danh sách đơn hàng)
  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const search = (req.query.search as string) || undefined
      const status = (req.query.status as string) || undefined
      const customerId = (req.query.customerId as string) || undefined

      const result = await OrderModel.findAll({ search, status, customerId, page, limit })

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      })
    } catch (error) {
      console.error('[order-service] getOrders error:', error)
      res.status(500).json({ success: false, message: 'Lỗi truy xuất danh sách đơn hàng' })
    }
  }

  // GET /api/v1/orders/lookup/:code (Tra cứu nhanh theo mã đơn / mã vận đơn)
  static async lookupByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params
      if (!code) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã đơn hàng hoặc mã vận đơn' })
        return
      }

      const order = await OrderModel.findByCode(code)
      if (!order) {
        res.status(404).json({ success: false, message: `Không tìm thấy đơn hàng với mã: ${code}` })
        return
      }

      res.status(200).json({
        success: true,
        data: order
      })
    } catch (error) {
      console.error('[order-service] lookupByCode error:', error)
      res.status(500).json({ success: false, message: 'Lỗi tra cứu đơn hàng' })
    }
  }

  // GET /api/v1/orders/stats/summary (Thống kê đơn hàng và trạng thái vận chuyển)
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await OrderModel.getStats()
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('[order-service] getStats error:', error)
      res.status(500).json({ success: false, message: 'Lỗi lấy thống kê đơn hàng' })
    }
  }

  // GET /api/v1/orders/:id (Chi tiết đơn hàng kèm các mốc tracking)
  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const order = await OrderModel.findById(id)

      if (!order) {
        res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
        return
      }

      res.status(200).json({
        success: true,
        data: order
      })
    } catch (error) {
      console.error('[order-service] getOrderById error:', error)
      res.status(500).json({ success: false, message: 'Lỗi truy xuất chi tiết đơn hàng' })
    }
  }

  // POST /api/v1/orders (Tạo đơn hàng order mới từ Trung Quốc)
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerId,
        customerName,
        customerPhone,
        customerAddress,
        productId,
        productCode,
        productName,
        productThumbnail,
        itemSku,
        itemTitle,
        unitPrice,
        quantity,
        depositRate,
        supplierPlatform,
        notes
      } = req.body

      if (!customerName || !customerPhone || !customerAddress || !productId || !unitPrice) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin khách hàng, địa chỉ và sản phẩm đặt mua'
        })
        return
      }

      const newOrder = await OrderModel.create({
        customerId: customerId || 'guest-user',
        customerName,
        customerPhone,
        customerAddress,
        productId,
        productCode,
        productName,
        productThumbnail,
        itemSku,
        itemTitle,
        unitPrice: Number(unitPrice),
        quantity: Number(quantity) || 1,
        depositRate: depositRate ? parseFloat(depositRate) : 0.50,
        supplierPlatform,
        notes
      })

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng order Trung Quốc thành công! Đã kích hoạt theo dõi vận chuyển.',
        data: newOrder
      })
    } catch (error) {
      console.error('[order-service] createOrder error:', error)
      res.status(500).json({ success: false, message: 'Lỗi khi tạo đơn hàng' })
    }
  }

  // PATCH /api/v1/orders/:id/checkpoint (Cập nhật tiến trình trạm vận chuyển)
  static async updateCheckpoint(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { checkpointStep, location, description, title, note } = req.body

      if (!checkpointStep || typeof checkpointStep !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Vui lòng chỉ định checkpointStep từ 1 đến 6'
        })
        return
      }

      const updated = await OrderModel.updateCheckpoint(id, checkpointStep, {
        location,
        description,
        title,
        note
      })

      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
        return
      }

      res.status(200).json({
        success: true,
        message: `Đã cập nhật tiến trình đơn hàng sang bước [${checkpointStep}] thành công!`,
        data: updated
      })
    } catch (error) {
      console.error('[order-service] updateCheckpoint error:', error)
      res.status(500).json({ success: false, message: 'Lỗi cập nhật tiến trình đơn hàng' })
    }
  }

  // PUT /api/v1/orders/:id (Cập nhật thông tin đơn hàng / mã vận đơn dành cho Admin)
  static async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updates = req.body

      const updated = await OrderModel.updateOrder(id, updates)
      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Đã cập nhật thông tin đơn hàng và mã vận đơn thành công!',
        data: updated
      })
    } catch (error) {
      console.error('[order-service] updateOrder error:', error)
      res.status(500).json({ success: false, message: 'Lỗi cập nhật thông tin đơn hàng' })
    }
  }

  // PUT /api/v1/orders/:id/events/:eventId (Cập nhật 1 mốc sự kiện cụ thể trong timeline)
  static async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id, eventId } = req.params
      const updates = req.body

      const updated = await OrderModel.updateEvent(id, eventId, updates)
      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện tracking cần cập nhật' })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Đã cập nhật mốc tracking thành công!',
        data: updated
      })
    } catch (error) {
      console.error('[order-service] updateEvent error:', error)
      res.status(500).json({ success: false, message: 'Lỗi cập nhật mốc tracking' })
    }
  }

  // POST /api/v1/orders/:id/events (Thêm mốc sự kiện mới vào lộ trình)
  static async addEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { title, location, description, checkpointStep, checkpointCode, isCompleted, isCurrent } = req.body

      if (!title || !location || !description) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng điền tiêu đề mốc, vị trí và mô tả chi tiết'
        })
        return
      }

      const updated = await OrderModel.addEvent(id, {
        title,
        location,
        description,
        checkpointStep,
        checkpointCode,
        isCompleted,
        isCurrent
      })

      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
        return
      }

      res.status(201).json({
        success: true,
        message: 'Đã thêm mốc lộ trình mới cho kiện hàng!',
        data: updated
      })
    } catch (error) {
      console.error('[order-service] addEvent error:', error)
      res.status(500).json({ success: false, message: 'Lỗi thêm mốc tracking' })
    }
  }
}
