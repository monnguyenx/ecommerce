export type OrderStatus =
  | 'pending_deposit'
  | 'processing'
  | 'in_transit_cn'
  | 'customs'
  | 'in_transit_vn'
  | 'delivering'
  | 'completed'
  | 'cancelled'

export type CheckpointCode =
  | 'ORDER_DEPOSITED'
  | 'SUPPLIER_DISPATCHED'
  | 'CN_WAREHOUSE_RECEIVED'
  | 'CUSTOMS_CLEARING'
  | 'VN_WAREHOUSE_SORTING'
  | 'LOCAL_DELIVERING'
  | 'DELIVERED_SUCCESS'

export interface OrderTrackingEvent {
  id: string
  orderId: string
  checkpointStep: number
  checkpointCode: CheckpointCode
  title: string
  location: string
  description: string
  timestamp: string
  isCompleted: boolean
  isCurrent: boolean
}

export interface Order {
  id: string
  orderCode: string
  customerId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  productId: string
  productCode: string
  productName: string
  productThumbnail?: string
  itemSku?: string
  itemTitle?: string
  unitPrice: number
  quantity: number
  totalAmount: number
  depositRate: number
  depositAmount: number
  remainingAmount: number
  orderType: string
  supplierPlatform: string
  cnTrackingCode?: string
  vnTrackingCode?: string
  currentCheckpoint: CheckpointCode
  currentStatus: OrderStatus
  estimatedDeliveryDays: string
  estimatedDeliveryDate?: string
  trackingEvents?: OrderTrackingEvent[]
  createdAt: string
  updatedAt: string
}

export interface CreateOrderPayload {
  customerId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  productId: string
  productCode?: string
  productName: string
  productThumbnail?: string
  itemSku?: string
  itemTitle?: string
  unitPrice: number
  quantity: number
  depositRate?: number
  supplierPlatform?: string
  notes?: string
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  totalDeposits: number
  inTransitCount: number
  customsCount: number
  deliveringCount: number
}

const ORDER_API_URL = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:8004'

export const orderApi = {
  // Lấy danh sách đơn hàng
  async getOrders(params?: { search?: string; status?: string; customerId?: string }): Promise<Order[]> {
    try {
      const url = new URL(`${ORDER_API_URL}/api/v1/orders`)
      if (params?.search) url.searchParams.append('search', params.search)
      if (params?.status) url.searchParams.append('status', params.status)
      if (params?.customerId) url.searchParams.append('customerId', params.customerId)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng')
      const json = await res.json()
      return json.data || []
    } catch (err) {
      console.error('[orderApi] getOrders failed:', err)
      return []
    }
  },

  // Lấy chi tiết đơn hàng kèm timeline 6 chặng vận chuyển
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const res = await fetch(`${ORDER_API_URL}/api/v1/orders/${id}`)
      if (!res.ok) return null
      const json = await res.json()
      return json.data || null
    } catch (err) {
      console.error('[orderApi] getOrderById failed:', err)
      return null
    }
  },

  // Tra cứu nhanh theo mã đơn hàng hoặc mã vận đơn
  async lookupByCode(code: string): Promise<Order | null> {
    try {
      const res = await fetch(`${ORDER_API_URL}/api/v1/orders/lookup/${encodeURIComponent(code)}`)
      if (!res.ok) return null
      const json = await res.json()
      return json.data || null
    } catch (err) {
      console.error('[orderApi] lookupByCode failed:', err)
      return null
    }
  },

  // Lấy thống kê đơn hàng
  async getStats(): Promise<OrderStats | null> {
    try {
      const res = await fetch(`${ORDER_API_URL}/api/v1/orders/stats/summary`)
      if (!res.ok) return null
      const json = await res.json()
      return json.data || null
    } catch {
      return null
    }
  },

  // Đặt mua order hàng Trung Quốc (tạo đơn)
  async createOrder(payload: CreateOrderPayload): Promise<{ success: boolean; message: string; data?: Order }> {
    try {
      const res = await fetch(`${ORDER_API_URL}/api/v1/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      return json
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi kết nối tới order-service' }
    }
  },

  // Cập nhật trạm checkpoint và ghi chú vị trí hành trình (Dành cho Admin)
  async updateCheckpoint(
    orderId: string,
    checkpointStep: number,
    options?: {
      location?: string
      description?: string
      title?: string
      note?: string
    }
  ): Promise<{ success: boolean; message: string; data?: Order }> {
    try {
      const res = await fetch(`${ORDER_API_URL}/api/v1/orders/${orderId}/checkpoint`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointStep, ...options })
      })
      const json = await res.json()
      return json
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi cập nhật trạm kiện hàng' }
    }
  },

  // Cập nhật thông tin vận đơn, trạng thái đơn hàng (Dành cho Admin)
  async updateOrder(
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
  ): Promise<{ success: boolean; message: string; data?: Order }> {
    try {
      const res = await fetch(`${ORDER_API_URL}/api/v1/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const json = await res.json()
      return json
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi cập nhật thông tin đơn hàng' }
    }
  },

  // Cập nhật chi tiết 1 mốc tracking trong timeline
  async updateEvent(
    orderId: string,
    eventId: string,
    updates: {
      title?: string
      location?: string
      description?: string
      timestamp?: string
      isCompleted?: boolean
      isCurrent?: boolean
    }
  ): Promise<{ success: boolean; message: string; data?: Order }> {
    try {
      const res = await fetch(`${ORDER_API_URL}/api/v1/orders/${orderId}/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const json = await res.json()
      return json
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi cập nhật mốc tracking' }
    }
  },

  // Thêm mốc tracking mới vào hành trình
  async addEvent(
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
  ): Promise<{ success: boolean; message: string; data?: Order }> {
    try {
      const res = await fetch(`${ORDER_API_URL}/api/v1/orders/${orderId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      return json
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi thêm mốc tracking' }
    }
  }
}
