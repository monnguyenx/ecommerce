import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '../types/user.js'

const JWT_SECRET = process.env.JWT_SECRET || 'omniorder_super_secret_jwt_key_2026'

export interface UserTokenPayload {
  userId: string
  email: string
  role: UserRole
  name: string
}

export interface AuthenticatedUserRequest extends Request {
  user?: UserTokenPayload
}

export const authenticateToken = (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Yêu cầu token xác thực Bearer Token'
    })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserTokenPayload
    req.user = payload
    next()
  } catch {
    res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    })
  }
}

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedUserRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa được xác thực' })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập thông tin này. Yêu cầu quyền: [${allowedRoles.join(', ')}]`
      })
      return
    }

    next()
  }
}
