import React, { useState } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  Briefcase,
  UserCheck
} from 'lucide-react'
import type { User } from '../../types/auth'
import { authApi } from '../../services/authApi'

interface LoginFormProps {
  onSuccess: (user: User) => void
  onSwitchToRegister: () => void
  onForgotPassword: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }

    setIsLoading(true)
    try {
      const res = await authApi.login({ email: email.trim(), password, rememberMe })
      if (res.success && res.user) {
        onSuccess(res.user)
      } else {
        setErrorMessage(res.message || 'Đăng nhập không thành công')
      }
    } catch {
      setErrorMessage('Lỗi kết nối tới dịch vụ xác thực')
    } finally {
      setIsLoading(false)
    }
  }

  // Chọn tài khoản mẫu để test nhanh UI
  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrorMessage(null)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Title */}
      <div className="mb-6 text-left">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Đăng nhập tài khoản</h2>
        <p className="text-sm text-slate-400 mt-1.5">
          Nhập thông tin truy cập để quản lý đơn hàng và điều hành bán hàng
        </p>
      </div>

      {/* Quick Demo Autofill Bar */}
      <div className="mb-6 p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-sm">
        <p className="text-xs font-medium text-slate-400 mb-2.5 flex items-center gap-1.5">
          <span>⚡ Chọn nhanh tài khoản thử nghiệm:</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleFillDemo('admin@ecommerce.local', 'admin123')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-850 hover:border-blue-500/50 transition-all text-slate-300 hover:text-white group cursor-pointer"
          >
            <Shield className="w-4 h-4 mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Quản trị viên</span>
            <span className="text-[10px] text-slate-500">Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleFillDemo('manager@ecommerce.local', 'manager123')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-850 hover:border-emerald-500/50 transition-all text-slate-300 hover:text-white group cursor-pointer"
          >
            <Briefcase className="w-4 h-4 mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Quản lý đơn</span>
            <span className="text-[10px] text-slate-500">Manager</span>
          </button>

          <button
            type="button"
            onClick={() => handleFillDemo('customer@ecommerce.local', 'customer123')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-850 hover:border-indigo-500/50 transition-all text-slate-300 hover:text-white group cursor-pointer"
          >
            <UserCheck className="w-4 h-4 mb-1 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Khách hàng</span>
            <span className="text-[10px] text-slate-500">Customer</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email hoặc Tên tài khoản
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@congty.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">Mật khẩu</label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
            />
            <span className="text-xs text-slate-400">Ghi nhớ đăng nhập trên thiết bị này</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang kết nối xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập hệ thống</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 pt-5 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400">
          Chưa có tài khoản quản lý hoặc mua hàng?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer ml-1"
          >
            Đăng ký tài khoản mới
          </button>
        </p>
      </div>
    </div>
  )
}
