import jwt from 'jsonwebtoken'
import { TokenPayload, AuthTokens } from '../types/auth.js'

const JWT_SECRET = process.env.JWT_SECRET || 'omniorder_super_secret_jwt_key_2026'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'omniorder_super_refresh_jwt_key_2026'
const ACCESS_TOKEN_EXPIRY = '2h'
const REFRESH_TOKEN_EXPIRY = '7d'

export class JwtService {
  static generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const refreshToken = jwt.sign({ userId: payload.userId }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: 7200 // 2 hours in seconds
    }
  }

  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch {
      return null
    }
  }

  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
    } catch {
      return null
    }
  }
}
