import { Request, Response } from 'express'
import { ProductModel } from '../models/productModel.js'
import { ProductStatus } from '../types/product.js'

export class ProductController {
  // GET /api/v1/products (Lấy danh sách sản phẩm)
  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const search = (req.query.search as string) || undefined
      const code = (req.query.code as string) || undefined
      const category = (req.query.category as string) || undefined
      const status = (req.query.status as ProductStatus) || undefined

      const result = await ProductModel.findAll({ page, limit, search, code, category, status })

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      })
    } catch (error) {
      console.error('[product-service] getProducts error:', error)
      res.status(500).json({ success: false, message: 'Lỗi truy xuất danh sách sản phẩm' })
    }
  }

  // GET /api/v1/products/lookup/code/:code (Tra cứu nhanh qua mã code: Mã SP, SKU, Barcode)
  static async lookupByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params
      if (!code) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã code cần tra cứu' })
        return
      }

      const result = await ProductModel.findByCode(code)
      if (!result) {
        res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm với mã code: ${code}` })
        return
      }

      res.status(200).json({
        success: true,
        data: result.product,
        matchedCode: result.matchedCode
      })
    } catch (error) {
      console.error('[product-service] lookupByCode error:', error)
      res.status(500).json({ success: false, message: 'Lỗi tra cứu mã sản phẩm' })
    }
  }

  // GET /api/v1/products/codes/list (Lấy danh sách các mã trong bảng product_codes để query)
  static async getAllCodes(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string) || undefined
      const codeType = (req.query.type as string) || undefined
      const codes = await ProductModel.getAllCodes({ search, codeType })

      res.status(200).json({
        success: true,
        data: codes,
        total: codes.length
      })
    } catch (error) {
      console.error('[product-service] getAllCodes error:', error)
      res.status(500).json({ success: false, message: 'Lỗi truy xuất danh mục mã' })
    }
  }

  // GET /api/v1/products/:id (Chi tiết sản phẩm & biến thể items)
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const product = await ProductModel.findById(id)

      if (!product) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
        return
      }

      res.status(200).json({
        success: true,
        data: product
      })
    } catch (error) {
      console.error('[product-service] getProductById error:', error)
      res.status(500).json({ success: false, message: 'Lỗi truy xuất chi tiết sản phẩm' })
    }
  }

  // POST /api/v1/products (Tạo sản phẩm mới kèm các mặt hàng items)
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const {
        code,
        name,
        category,
        brand,
        description,
        thumbnail,
        items,
        orderType,
        origin,
        estimatedDays,
        depositRate,
        supplierPlatform
      } = req.body

      if (!name || !category || !brand) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng điền tên sản phẩm, danh mục và thương hiệu'
        })
        return
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

      const newProduct = await ProductModel.create({
        code: code ? code.trim().toUpperCase() : undefined as any,
        name: name.trim(),
        slug,
        category,
        brand,
        description: description || '',
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80',
        status: 'active',
        orderType: orderType || 'china_preorder',
        origin: origin || 'Trung Quốc (Nội địa)',
        estimatedDays: estimatedDays || '7 - 14 ngày',
        depositRate: depositRate ? parseFloat(depositRate) : 0.50,
        supplierPlatform: supplierPlatform || 'Taobao / 1688 / Tmall',
        items: items || []
      })

      res.status(201).json({
        success: true,
        message: 'Thêm sản phẩm thành công',
        data: newProduct
      })
    } catch (error) {
      console.error('[product-service] createProduct error:', error)
      res.status(500).json({ success: false, message: 'Lỗi khi tạo sản phẩm' })
    }
  }

  // PUT /api/v1/products/:id (Cập nhật sản phẩm)
  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updates = req.body

      const updated = await ProductModel.update(id, updates)
      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật sản phẩm thành công',
        data: updated
      })
    } catch (error) {
      console.error('[product-service] updateProduct error:', error)
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật sản phẩm' })
    }
  }

  // DELETE /api/v1/products/:id (Xóa sản phẩm)
  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const deleted = await ProductModel.delete(id)

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Đã xóa sản phẩm thành công'
      })
    } catch (error) {
      console.error('[product-service] deleteProduct error:', error)
      res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm' })
    }
  }

  // PATCH /api/v1/products/:id/items/:itemId/stock (Cập nhật tồn kho SKU)
  static async updateItemStock(req: Request, res: Response): Promise<void> {
    try {
      const { id, itemId } = req.params
      const { stockQuantity } = req.body

      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        res.status(400).json({ success: false, message: 'Số lượng tồn kho không hợp lệ' })
        return
      }

      const updated = await ProductModel.updateItemStock(id, itemId, stockQuantity)
      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy mặt hàng để cập nhật' })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật số lượng tồn kho thành công',
        data: { id, itemId, stockQuantity }
      })
    } catch (error) {
      console.error('[product-service] updateItemStock error:', error)
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật tồn kho' })
    }
  }

  // GET /api/v1/products/categories/list (Danh sách danh mục)
  static async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await ProductModel.getCategories()
      res.status(200).json({
        success: true,
        data: categories
      })
    } catch (error) {
      console.error('[product-service] getCategories error:', error)
      res.status(500).json({ success: false, message: 'Lỗi lấy danh mục' })
    }
  }

  // GET /api/v1/products/stats/summary (Thống kê kho & mặt hàng)
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await ProductModel.getStats()
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('[product-service] getStats error:', error)
      res.status(500).json({ success: false, message: 'Lỗi lấy thống kê kho sản phẩm' })
    }
  }
}
