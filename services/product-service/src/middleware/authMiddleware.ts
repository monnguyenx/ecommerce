import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedProductRequest extends Request {
  user?: {
    userId: string
    email: string
    role: 'admin' | 'manager' | 'customer'
    name?: string
  }
}

export const authenticateToken = async (
  req: AuthenticatedProductRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    res.status(401).json({ success: false, message: 'Yêu cầu Bearer Token xác thực' })
    return
  }

  try {
    // INTER-SERVICE CALL: Gọi sang auth-service (:8001) để verify tính hợp lệ của token
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001'
    const verifyRes = await fetch(`${authServiceUrl}/api/v1/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    if (!verifyRes.ok) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã bị khóa từ auth-service' })
      return
    }

    const data = await verifyRes.json()
    if (!data.valid || !data.user) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ' })
      return
    }

    req.user = data.user
    next()
  } catch (err: any) {
    console.error('[product-service] Lỗi gọi auth-service verify:', err.message)
    res.status(503).json({ success: false, message: 'Không thể kết nối tới Auth Service để xác thực quyền' })
  }
}

export const requireManagerOrAdmin = (
  req: AuthenticatedProductRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: 'Chỉ Quản trị viên (Admin) hoặc Quản lý (Manager) mới có quyền thao tác dữ liệu sản phẩm'
    })
    return
  }
  next()
}
