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

export type QcStatus = 'none' | 'pending' | 'approved' | 'rejected'

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
  qcPhotos?: string[]
  qcStatus?: QcStatus
  qcNote?: string
  qcInspectedAt?: string
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
