import { Product, ProductFilter, ProductItem, ProductCode } from '../types/product.js'
import { pool } from '../config/db.js'

export class ProductModel {
  static async findAll(filter: ProductFilter = {}): Promise<{ products: Product[]; total: number }> {
    try {
      const conditions: string[] = []
      const values: any[] = []
      let idx = 1

      if (filter.search) {
        // Tìm kiếm toàn diện theo: Tên sản phẩm, Thương hiệu, Mã code sản phẩm chính, hoặc bất kỳ mã nào trong bảng product_codes (SKU, Barcode, ...)
        conditions.push(`(
          LOWER(p.name) LIKE $${idx}
          OR LOWER(p.brand) LIKE $${idx}
          OR LOWER(COALESCE(p.code, '')) LIKE $${idx}
          OR EXISTS (
            SELECT 1 FROM product_codes pc
            WHERE pc.product_id = p.id AND LOWER(pc.code) LIKE $${idx}
          )
        )`)
        values.push(`%${filter.search.toLowerCase()}%`)
        idx++
      }

      if (filter.code) {
        conditions.push(`(
          LOWER(COALESCE(p.code, '')) = $${idx}
          OR EXISTS (
            SELECT 1 FROM product_codes pc
            WHERE pc.product_id = p.id AND LOWER(pc.code) = $${idx}
          )
        )`)
        values.push(filter.code.toLowerCase())
        idx++
      }

      if (filter.category) {
        conditions.push(`p.category = $${idx}`)
        values.push(filter.category)
        idx++
      }

      if (filter.status) {
        conditions.push(`p.status = $${idx}`)
        values.push(filter.status)
        idx++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const countRes = await pool.query(`SELECT COUNT(*) FROM products p ${whereClause}`, values)
      const total = parseInt(countRes.rows[0].count, 10)

      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit

      const queryStr = `
        SELECT p.id, COALESCE(p.code, 'SP-' || UPPER(SUBSTRING(p.id FROM 6))) as code,
               p.name, p.slug, p.category, p.brand, p.description, p.thumbnail,
               p.status, p.rating::float, p.total_sales as "totalSales",
               COALESCE(p.order_type, 'china_preorder') as "orderType",
               COALESCE(p.origin, 'Trung Quốc (Nội địa)') as origin,
               COALESCE(p.estimated_days, '7 - 14 ngày') as "estimatedDays",
               COALESCE(p.deposit_rate, 0.50)::float as "depositRate",
               COALESCE(p.supplier_platform, 'Taobao / 1688 / Tmall') as "supplierPlatform",
               p.created_at as "createdAt", p.updated_at as "updatedAt"
        FROM products p
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `
      values.push(limit, offset)

      const prodsRes = await pool.query(queryStr, values)
      const products: Product[] = prodsRes.rows

      if (products.length > 0) {
        const prodIds = products.map((p) => p.id)

        // 1. Nạp danh sách items/SKUs
        const itemsRes = await pool.query(
          `SELECT id, product_id, sku, title, price::bigint, original_price::bigint as "originalPrice",
                  stock_quantity as "stockQuantity", barcode, attributes
           FROM product_items
           WHERE product_id = ANY($1)
           ORDER BY price ASC`,
          [prodIds]
        )

        const itemsByProd: Record<string, ProductItem[]> = {}
        for (const item of itemsRes.rows) {
          if (!itemsByProd[item.product_id]) itemsByProd[item.product_id] = []
          itemsByProd[item.product_id].push({
            id: item.id,
            sku: item.sku,
            title: item.title,
            price: Number(item.price),
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            stockQuantity: item.stockQuantity,
            barcode: item.barcode,
            attributes: item.attributes || {}
          })
        }

        // 2. Nạp danh sách mã định danh từ bảng product_codes
        const codesRes = await pool.query(
          `SELECT id, product_id as "productId", item_id as "itemId", code,
                  code_type as "codeType", description, is_primary as "isPrimary",
                  created_at as "createdAt"
           FROM product_codes
           WHERE product_id = ANY($1)
           ORDER BY is_primary DESC, created_at ASC`,
          [prodIds]
        )

        const codesByProd: Record<string, ProductCode[]> = {}
        for (const c of codesRes.rows) {
          if (!codesByProd[c.productId]) codesByProd[c.productId] = []
          codesByProd[c.productId].push({
            id: c.id,
            productId: c.productId,
            itemId: c.itemId,
            code: c.code,
            codeType: c.codeType,
            description: c.description,
            isPrimary: c.isPrimary,
            createdAt: c.createdAt
          })
        }

        products.forEach((p) => {
          p.items = itemsByProd[p.id] || []
          p.codes = codesByProd[p.id] || []
        })
      }

      return { products, total }
    } catch (err) {
      console.error('[product-service] DB findAll error:', err)
      return { products: [], total: 0 }
    }
  }

  static async findById(id: string): Promise<Product | null> {
    try {
      const res = await pool.query(
        `SELECT id, COALESCE(code, 'SP-' || UPPER(SUBSTRING(id FROM 6))) as code,
                name, slug, category, brand, description, thumbnail,
                status, rating::float, total_sales as "totalSales",
                COALESCE(order_type, 'china_preorder') as "orderType",
                COALESCE(origin, 'Trung Quốc (Nội địa)') as origin,
                COALESCE(estimated_days, '7 - 14 ngày') as "estimatedDays",
                COALESCE(deposit_rate, 0.50)::float as "depositRate",
                COALESCE(supplier_platform, 'Taobao / 1688 / Tmall') as "supplierPlatform",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM products WHERE id = $1`,
        [id]
      )
      if (res.rows.length === 0) return null

      const product: Product = res.rows[0]

      // Lấy danh sách biến thể SKU
      const itemsRes = await pool.query(
        `SELECT id, product_id, sku, title, price::bigint, original_price::bigint as "originalPrice",
                stock_quantity as "stockQuantity", barcode, attributes
         FROM product_items WHERE product_id = $1 ORDER BY price ASC`,
        [id]
      )

      product.items = itemsRes.rows.map((item) => ({
        id: item.id,
        sku: item.sku,
        title: item.title,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        stockQuantity: item.stockQuantity,
        barcode: item.barcode,
        attributes: item.attributes || {}
      }))

      // Lấy toàn bộ mã từ bảng product_codes
      const codesRes = await pool.query(
        `SELECT id, product_id as "productId", item_id as "itemId", code,
                code_type as "codeType", description, is_primary as "isPrimary",
                created_at as "createdAt"
         FROM product_codes WHERE product_id = $1
         ORDER BY is_primary DESC, created_at ASC`,
        [id]
      )

      product.codes = codesRes.rows.map((c) => ({
        id: c.id,
        productId: c.productId,
        itemId: c.itemId,
        code: c.code,
        codeType: c.codeType,
        description: c.description,
        isPrimary: c.isPrimary,
        createdAt: c.createdAt
      }))

      return product
    } catch (err) {
      console.error('[product-service] DB findById error:', err)
      return null
    }
  }

  // Tra cứu trực tiếp sản phẩm bằng mã code (mã sản phẩm, SKU hoặc Barcode)
  static async findByCode(code: string): Promise<{ product: Product; matchedCode: ProductCode } | null> {
    try {
      const codeRes = await pool.query(
        `SELECT id, product_id as "productId", item_id as "itemId", code,
                code_type as "codeType", description, is_primary as "isPrimary",
                created_at as "createdAt"
         FROM product_codes
         WHERE LOWER(code) = LOWER($1)
         LIMIT 1`,
        [code.trim()]
      )

      if (codeRes.rows.length === 0) {
        // Thử tìm trong products.code
        const prodCheck = await pool.query(
          'SELECT id FROM products WHERE LOWER(code) = LOWER($1) LIMIT 1',
          [code.trim()]
        )
        if (prodCheck.rows.length === 0) return null
        const prod = await this.findById(prodCheck.rows[0].id)
        if (!prod) return null
        return {
          product: prod,
          matchedCode: {
            id: `temp-${prod.id}`,
            productId: prod.id,
            code: prod.code,
            codeType: 'PRODUCT_CODE',
            description: `Mã sản phẩm: ${prod.name}`,
            isPrimary: true
          }
        }
      }

      const matchedCode: ProductCode = codeRes.rows[0]
      const product = await this.findById(matchedCode.productId)
      if (!product) return null

      return { product, matchedCode }
    } catch (err) {
      console.error('[product-service] DB findByCode error:', err)
      return null
    }
  }

  // Lấy danh sách toàn bộ các mã trong bảng product_codes (Dùng để query / thống kê)
  static async getAllCodes(filter: { search?: string; codeType?: string } = {}): Promise<ProductCode[]> {
    try {
      const conditions: string[] = []
      const values: any[] = []
      let idx = 1

      if (filter.search) {
        conditions.push(`(LOWER(pc.code) LIKE $${idx} OR LOWER(pc.description) LIKE $${idx})`)
        values.push(`%${filter.search.toLowerCase()}%`)
        idx++
      }

      if (filter.codeType) {
        conditions.push(`pc.code_type = $${idx}`)
        values.push(filter.codeType)
        idx++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const res = await pool.query(
        `SELECT pc.id, pc.product_id as "productId", pc.item_id as "itemId", pc.code,
                pc.code_type as "codeType", pc.description, pc.is_primary as "isPrimary",
                pc.created_at as "createdAt", p.name as "productName"
         FROM product_codes pc
         JOIN products p ON pc.product_id = p.id
         ${whereClause}
         ORDER BY pc.created_at DESC
         LIMIT 100`,
        values
      )

      return res.rows
    } catch (err) {
      console.error('[product-service] DB getAllCodes error:', err)
      return []
    }
  }

  static async create(payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalSales' | 'rating'>): Promise<Product> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const newId = `prod-${Date.now().toString(36)}`
      const productCode = payload.code?.trim() || `SP-${Date.now().toString(36).slice(-4).toUpperCase()}`

      const prodRes = await client.query(
        `INSERT INTO products (id, code, name, slug, category, brand, description, thumbnail, status, rating, total_sales, order_type, origin, estimated_days, deposit_rate, supplier_platform)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 5.0, 0, $10, $11, $12, $13, $14)
         RETURNING id, code, name, slug, category, brand, description, thumbnail, status, rating::float, total_sales as "totalSales",
                   order_type as "orderType", origin, estimated_days as "estimatedDays", deposit_rate::float as "depositRate", supplier_platform as "supplierPlatform",
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [
          newId,
          productCode,
          payload.name,
          payload.slug,
          payload.category,
          payload.brand,
          payload.description,
          payload.thumbnail,
          payload.status,
          payload.orderType || 'china_preorder',
          payload.origin || 'Trung Quốc (Nội địa)',
          payload.estimatedDays || '7 - 14 ngày',
          payload.depositRate ?? 0.50,
          payload.supplierPlatform || 'Taobao / 1688 / Tmall'
        ]
      )

      const product = prodRes.rows[0]
      const items: ProductItem[] = []
      const codes: ProductCode[] = []

      // 1. Lưu mã sản phẩm chính vào bảng product_codes
      const primaryCodeId = `code-${newId}-pri`
      await client.query(
        `INSERT INTO product_codes (id, product_id, item_id, code, code_type, description, is_primary)
         VALUES ($1, $2, NULL, $3, 'PRODUCT_CODE', $4, true)`,
        [primaryCodeId, newId, productCode, `Mã sản phẩm chính: ${payload.name}`]
      )
      codes.push({
        id: primaryCodeId,
        productId: newId,
        code: productCode,
        codeType: 'PRODUCT_CODE',
        description: `Mã sản phẩm chính: ${payload.name}`,
        isPrimary: true
      })

      // 2. Lưu từng mặt hàng SKU và Barcode tương ứng vào product_items và product_codes
      for (const item of payload.items || []) {
        const itemId = item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
        const itemRes = await client.query(
          `INSERT INTO product_items (id, product_id, sku, title, price, original_price, stock_quantity, barcode, attributes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, sku, title, price::bigint, original_price::bigint as "originalPrice", stock_quantity as "stockQuantity", barcode, attributes`,
          [itemId, newId, item.sku, item.title, item.price, item.originalPrice || null, item.stockQuantity, item.barcode || null, JSON.stringify(item.attributes || {})]
        )
        const row = itemRes.rows[0]
        items.push({
          id: row.id,
          sku: row.sku,
          title: row.title,
          price: Number(row.price),
          originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
          stockQuantity: row.stockQuantity,
          barcode: row.barcode,
          attributes: row.attributes || {}
        })

        // Lưu SKU vào product_codes
        if (row.sku) {
          const skuCodeId = `code-sku-${row.id}`
          await client.query(
            `INSERT INTO product_codes (id, product_id, item_id, code, code_type, description, is_primary)
             VALUES ($1, $2, $3, $4, 'SKU', $5, false)`,
            [skuCodeId, newId, row.id, row.sku, `Mã SKU: ${row.title}`]
          )
          codes.push({
            id: skuCodeId,
            productId: newId,
            itemId: row.id,
            code: row.sku,
            codeType: 'SKU',
            description: `Mã SKU: ${row.title}`,
            isPrimary: false
          })
        }

        // Lưu Barcode vào product_codes nếu có
        if (row.barcode) {
          const barCodeId = `code-bar-${row.id}`
          await client.query(
            `INSERT INTO product_codes (id, product_id, item_id, code, code_type, description, is_primary)
             VALUES ($1, $2, $3, $4, 'BARCODE', $5, false)`,
            [barCodeId, newId, row.id, row.barcode, `Mã vạch Barcode: ${row.title}`]
          )
          codes.push({
            id: barCodeId,
            productId: newId,
            itemId: row.id,
            code: row.barcode,
            codeType: 'BARCODE',
            description: `Mã vạch Barcode: ${row.title}`,
            isPrimary: false
          })
        }
      }

      await client.query('COMMIT')
      product.items = items
      product.codes = codes
      return product
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('[product-service] DB create error:', err)
      throw err
    } finally {
      client.release()
    }
  }

  static async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const existing = await this.findById(id)
      if (!existing) return null

      const code = updates.code ?? existing.code
      const name = updates.name ?? existing.name
      const category = updates.category ?? existing.category
      const brand = updates.brand ?? existing.brand
      const description = updates.description ?? existing.description
      const thumbnail = updates.thumbnail ?? existing.thumbnail
      const status = updates.status ?? existing.status
      const orderType = updates.orderType ?? existing.orderType
      const origin = updates.origin ?? existing.origin
      const estimatedDays = updates.estimatedDays ?? existing.estimatedDays
      const depositRate = updates.depositRate ?? existing.depositRate
      const supplierPlatform = updates.supplierPlatform ?? existing.supplierPlatform

      await pool.query(
        `UPDATE products
         SET code = $1, name = $2, category = $3, brand = $4, description = $5, thumbnail = $6, status = $7,
             order_type = $8, origin = $9, estimated_days = $10, deposit_rate = $11, supplier_platform = $12,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $13`,
        [code, name, category, brand, description, thumbnail, status, orderType, origin, estimatedDays, depositRate, supplierPlatform, id]
      )

      // Cập nhật lại mã chính trong product_codes nếu có thay đổi
      if (updates.code && updates.code !== existing.code) {
        await pool.query(
          `UPDATE product_codes SET code = $1 WHERE product_id = $2 AND is_primary = true`,
          [updates.code, id]
        )
      }

      return this.findById(id)
    } catch (err) {
      console.error('[product-service] DB update error:', err)
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const res = await pool.query('DELETE FROM products WHERE id = $1', [id])
      return (res.rowCount ?? 0) > 0
    } catch (err) {
      console.error('[product-service] DB delete error:', err)
      return false
    }
  }

  static async updateItemStock(productId: string, itemId: string, stockQuantity: number): Promise<boolean> {
    try {
      const res = await pool.query(
        'UPDATE product_items SET stock_quantity = $1 WHERE id = $2 AND product_id = $3',
        [stockQuantity, itemId, productId]
      )
      return (res.rowCount ?? 0) > 0
    } catch (err) {
      console.error('[product-service] DB updateItemStock error:', err)
      return false
    }
  }

  static async getCategories(): Promise<string[]> {
    try {
      const res = await pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC')
      return res.rows.map((r) => r.category)
    } catch (err) {
      console.error('[product-service] DB getCategories error:', err)
      return []
    }
  }

  static async getStats(): Promise<{
    totalProducts: number
    totalItems: number
    totalStockQuantity: number
    totalInventoryValue: number
    totalCodes?: number
  }> {
    try {
      const prodRes = await pool.query('SELECT COUNT(*) FROM products;')
      const totalProducts = parseInt(prodRes.rows[0].count, 10)

      const itemsRes = await pool.query(`
        SELECT COUNT(*) as "totalItems",
               COALESCE(SUM(stock_quantity), 0) as "totalStockQuantity",
               COALESCE(SUM(stock_quantity * price), 0) as "totalInventoryValue"
        FROM product_items;
      `)

      const codesRes = await pool.query('SELECT COUNT(*) FROM product_codes;')
      const totalCodes = parseInt(codesRes.rows[0].count, 10)

      const row = itemsRes.rows[0]
      return {
        totalProducts,
        totalItems: parseInt(row.totalItems, 10),
        totalStockQuantity: parseInt(row.totalStockQuantity, 10),
        totalInventoryValue: Number(row.totalInventoryValue),
        totalCodes
      }
    } catch (err) {
      console.error('[product-service] DB getStats error:', err)
      return { totalProducts: 0, totalItems: 0, totalStockQuantity: 0, totalInventoryValue: 0, totalCodes: 0 }
    }
  }
}
