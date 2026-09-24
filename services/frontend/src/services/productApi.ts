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
  productName?: string
}

export interface ProductItem {
  id: string
  sku: string
  title: string
  price: number
  originalPrice?: number
  stockQuantity: number
  barcode?: string
  attributes: Record<string, string>
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
  status: 'active' | 'draft' | 'archived'
  rating: number
  totalSales: number
  orderType?: string // 'china_preorder' | 'ready_stock'
  origin?: string // 'Trung Quốc (Nội địa)'
  estimatedDays?: string // '7 - 14 ngày'
  depositRate?: number // 0.50
  supplierPlatform?: string // 'Taobao / 1688 / Tmall'
  items: ProductItem[]
  codes?: ProductCode[] // Toàn bộ mã từ bảng product_codes trong DB
  createdAt: string
  updatedAt: string
}

export interface ProductStats {
  totalProducts: number
  totalItems: number
  totalStockQuantity: number
  totalInventoryValue: number
}

const PRODUCT_API_URL = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:8003'

export const productApi = {
  // Lấy danh sách sản phẩm & items từ product-service
  async getProducts(params?: { search?: string; category?: string }): Promise<Product[]> {
    try {
      const url = new URL(`${PRODUCT_API_URL}/api/v1/products`)
      if (params?.search) url.searchParams.append('search', params.search)
      if (params?.category) url.searchParams.append('category', params.category)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Không thể tải sản phẩm')
      const json = await res.json()
      return json.data || []
    } catch (err) {
      console.error('[productApi] getProducts failed:', err)
      return []
    }
  },

  // Lấy danh sách danh mục
  async getCategories(): Promise<string[]> {
    try {
      const res = await fetch(`${PRODUCT_API_URL}/api/v1/products/categories/list`)
      if (!res.ok) throw new Error('Lỗi tải danh mục')
      const json = await res.json()
      return json.data || []
    } catch {
      return []
    }
  },

  // Lấy thống kê kho và mặt hàng
  async getStats(): Promise<ProductStats | null> {
    try {
      const res = await fetch(`${PRODUCT_API_URL}/api/v1/products/stats/summary`)
      if (!res.ok) throw new Error('Lỗi tải thống kê kho')
      const json = await res.json()
      return json.data || null
    } catch {
      return null
    }
  },

  // Thêm sản phẩm mới kèm các mặt hàng items và mã code
  async createProduct(
    payload: {
      code?: string
      name: string
      category: string
      brand: string
      description: string
      thumbnail?: string
      items: Array<{
        id: string
        sku: string
        title: string
        price: number
        stockQuantity: number
        barcode?: string
        attributes: Record<string, string>
      }>
    },
    token: string
  ): Promise<{ success: boolean; message: string; data?: Product }> {
    try {
      const res = await fetch(`${PRODUCT_API_URL}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      return json
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi thêm sản phẩm' }
    }
  },

  // Tra cứu nhanh sản phẩm qua bất kỳ mã code nào (Mã SP, SKU, Barcode) từ bảng product_codes
  async lookupByCode(code: string): Promise<{ product: Product; matchedCode: ProductCode } | null> {
    try {
      const res = await fetch(`${PRODUCT_API_URL}/api/v1/products/lookup/code/${encodeURIComponent(code)}`)
      if (!res.ok) return null
      const json = await res.json()
      if (json.success && json.data) {
        return {
          product: json.data,
          matchedCode: json.matchedCode
        }
      }
      return null
    } catch (err) {
      console.error('[productApi] lookupByCode failed:', err)
      return null
    }
  },

  // Lấy toàn bộ danh sách mã trong bảng product_codes (Dùng để query / thống kê)
  async getAllCodes(params?: { search?: string; type?: string }): Promise<ProductCode[]> {
    try {
      const url = new URL(`${PRODUCT_API_URL}/api/v1/products/codes/list`)
      if (params?.search) url.searchParams.append('search', params.search)
      if (params?.type) url.searchParams.append('type', params.type)
      const res = await fetch(url.toString())
      if (!res.ok) return []
      const json = await res.json()
      return json.data || []
    } catch {
      return []
    }
  },

  // Lấy chi tiết 1 sản phẩm theo ID kèm các mặt hàng SKU
  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await fetch(`${PRODUCT_API_URL}/api/v1/products/${id}`)
      if (!res.ok) return null
      const json = await res.json()
      return json.data || null
    } catch (err) {
      console.error('[productApi] getProductById failed:', err)
      return null
    }
  },

  // Cập nhật sản phẩm
  async updateProduct(
    id: string,
    updates: Partial<Product>,
    token: string
  ): Promise<{ success: boolean; message: string; data?: Product }> {
    try {
      const res = await fetch(`${PRODUCT_API_URL}/api/v1/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })
      const json = await res.json()
      return json
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi cập nhật sản phẩm' }
    }
  },

  // Cập nhật số lượng tồn kho của 1 SKU item
  async updateItemStock(
    productId: string,
    itemId: string,
    stockQuantity: number,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${PRODUCT_API_URL}/api/v1/products/${productId}/items/${itemId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stockQuantity })
      })
      const json = await res.json()
      return json
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi cập nhật tồn kho SKU' }
    }
  },

  // Xóa sản phẩm
  async deleteProduct(id: string, token: string): Promise<boolean> {
    try {
      const res = await fetch(`${PRODUCT_API_URL}/api/v1/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return res.ok
    } catch {
      return false
    }
  }
}
