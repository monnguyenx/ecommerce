import { Request, Response, NextFunction } from 'express'
import { JwtService } from '../services/jwtService.js'
import { TokenPayload, UserRole } from '../types/auth.js'

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Yêu cầu token xác thực (Missing Bearer Token)'
    })
    return
  }

  const payload = JwtService.verifyAccessToken(token)
  if (!payload) {
    res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn (Invalid/Expired Token)'
    })
    return
  }

  req.user = payload
  next()
}

export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa được xác thực' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu một trong các quyền: [${roles.join(', ')}]`
      })
      return
    }

    next()
  }
}
