import React, { useState } from 'react'
import { BrandShowcase } from '../components/auth/BrandShowcase'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import type { User } from '../types/auth'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface LoginPageProps {
  onLoginSuccess: (user: User) => void
}

type AuthMode = 'login' | 'register'

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitted, setForgotSubmitted] = useState(false)

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotEmail.trim()) {
      setForgotSubmitted(true)
    }
  }

  const closeForgotModal = () => {
    setShowForgotModal(false)
    setForgotSubmitted(false)
    setForgotEmail('')
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Cột trái: Brand Showcase Banner Full-Height (7/12) */}
      <div className="w-full lg:w-7/12 xl:w-7/12 min-h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800/80">
        <BrandShowcase />
      </div>

      {/* Cột phải: Form Đăng nhập / Đăng ký Tràn màn hình Fullscreen (5/12) */}
      <div className="w-full lg:w-5/12 xl:w-5/12 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-slate-950 relative z-10">
        {/* Thanh chuyển chế độ trên cùng */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer btn-press ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer btn-press ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Đăng ký
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
              PORT: 3000
            </span>
          </div>
        </div>

        {/* Khối Form chính giữa với transition */}
        <div className="my-auto py-4 animate-fade-in-up" key={mode}>
          {mode === 'login' ? (
            <LoginForm
              onSuccess={onLoginSuccess}
              onSwitchToRegister={() => setMode('register')}
              onForgotPassword={() => setShowForgotModal(true)}
            />
          ) : (
            <RegisterForm
              onSuccess={onLoginSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
        </div>

        {/* Footer thông tin chân trang */}
        <div className="pt-6 border-t border-slate-900 text-center">
          <p className="text-[11px] text-slate-500">
            Hệ sinh thái Microservices &bull; Frontend Service v1.0.0 &bull; Bảo mật JWT
          </p>
        </div>
      </div>

      {/* Modal Quên mật khẩu */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-md bg-slate-900/95 rounded-3xl shadow-2xl border border-slate-800 p-6 sm:p-8 animate-scale-up">
            {!forgotSubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Quên mật khẩu?</h3>
                    <p className="text-xs text-slate-400">Khôi phục quyền truy cập tài khoản</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                  Nhập địa chỉ email đăng ký trong hệ thống, chúng tôi sẽ tạo đường dẫn khôi phục bảo mật.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email đã đăng ký
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="ten@congty.com"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="w-1/2 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl cursor-pointer transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer shadow-md shadow-blue-600/30 transition-all"
                    >
                      Gửi yêu cầu
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Đã gửi liên kết khôi phục!</h3>
                <p className="text-xs text-slate-300 mb-5">
                  Vui lòng kiểm tra hộp thư <span className="font-semibold text-blue-400">{forgotEmail}</span> để thiết lập mật khẩu mới.
                </p>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
