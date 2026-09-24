export type ProductStatus = 'active' | 'draft' | 'archived'

export type ProductCodeType = 'PRODUCT_CODE' | 'SKU' | 'BARCODE' | 'QR_CODE'

export interface ProductCode {
  id: string
  productId: string
  itemId?: string
  code: string
  codeType: ProductCodeType
  description?: string
  isPrimary: boolean
  createdAt?: string
}

export interface ProductItem {
  id: string
  sku: string
  title: string
  price: number
  originalPrice?: number
  stockQuantity: number
  barcode?: string
  attributes: Record<string, string> // Ví dụ: { color: 'Titan Tự Nhiên', storage: '256GB' }
}

export interface Product {
  id: string
  code: string // Mã sản phẩm chính (VD: SP-IP16PM)
  name: string
  slug: string
  category: string
  brand: string
  description: string
  thumbnail: string
  status: ProductStatus
  rating: number
  totalSales: number
  orderType: string // 'china_preorder' | 'ready_stock'
  origin: string // 'Trung Quốc (Nội địa)'
  estimatedDays: string // '7 - 14 ngày'
  depositRate: number // 0.50 (50% đặt cọc)
  supplierPlatform?: string // 'Taobao / 1688 / Tmall'
  items: ProductItem[] // Danh sách các mặt hàng / biến thể SKU
  codes?: ProductCode[] // Toàn bộ mã định danh (từ bảng product_codes)
  createdAt: string
  updatedAt: string
}

export interface ProductFilter {
  page?: number
  limit?: number
  search?: string
  code?: string
  category?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
}
