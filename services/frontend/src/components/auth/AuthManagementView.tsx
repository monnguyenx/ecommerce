import React, { useState } from 'react'
import {
  Key,
  CheckCircle2,
  Copy,
  Activity,
  UserCheck,
  Lock
} from 'lucide-react'
import type { User } from '../../types/auth'

interface AuthManagementViewProps {
  user: User
}

export const AuthManagementView: React.FC<AuthManagementViewProps> = ({ user }) => {
  const token = localStorage.getItem('ecommerce_auth_token') || ''
  const [copied, setCopied] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const copyToken = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testVerifyToken = async () => {
    setIsVerifying(true)
    try {
      const res = await fetch('http://localhost:8001/api/v1/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setVerifyStatus('Token hoàn toàn hợp lệ! Được xác nhận từ auth-service (:8001)')
      } else {
        setVerifyStatus('Xác thực thất bại hoặc Token đã hết hạn.')
      }
    } catch {
      setVerifyStatus('Không thể kết nối tới auth-service:8001')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Backend Service Info */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400">
              SERVICE: auth-service (Port :8001)
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 font-heading">Xác thực & Bảo mật (JWT & RBAC)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Nghiệp vụ cấp phát token phiên làm việc, mã hóa mật khẩu Bcrypt, phân quyền vai trò và API verify token cho các microservice khác.
          </p>
        </div>

        <button
          onClick={testVerifyToken}
          disabled={isVerifying}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer disabled:opacity-50 btn-press transition-all duration-200"
        >
          <Activity className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>Kiểm tra Token trực tiếp (:8001)</span>
        </button>
      </div>

      {verifyStatus && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{verifyStatus}</span>
        </div>
      )}

      {/* Token Details & Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Token Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
              <Key className="w-4 h-4 text-purple-400" />
              <span>JWT Bearer Token hiện tại</span>
            </h3>
            <button
              onClick={copyToken}
              className="text-[11px] font-mono px-3 py-1 bg-slate-800/90 hover:bg-slate-750 text-slate-300 rounded-xl flex items-center gap-1.5 border border-slate-700 cursor-pointer btn-press transition-all"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 break-all select-all leading-relaxed">
            {token || 'Chưa có token trong bộ nhớ'}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Thuật toán ký: <strong className="text-white font-mono">HMAC SHA-256</strong></span>
            <span>Thời hạn phiên: <strong className="text-white font-mono">2 giờ</strong></span>
          </div>
        </div>

        {/* User Claims */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Thông tin định danh (Token Claims)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">User ID</span>
              <span className="font-mono text-white">{user.id}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Email</span>
              <span className="font-mono text-white">{user.email}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Vai trò phân quyền (RBAC)</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {user.role}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Dịch vụ cấp phát</span>
              <span className="font-mono text-emerald-400">auth-service (:8001)</span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Bảng ma trận phân quyền (Role-Based Access Control)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Quyền hạn / Chức năng</th>
                <th className="px-4 py-3 text-center">Khách hàng (Customer)</th>
                <th className="px-4 py-3 text-center">Quản lý (Manager)</th>
                <th className="px-4 py-3 text-center">Quản trị viên (Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="px-4 py-3 font-medium">Xem catalog sản phẩm & mặt hàng items</td>
                <td className="px-4 py-3 text-center text-emerald-400">✓ Có</td>
                <td className="px-4 py-3 text-center text-emerald-400">✓ Có</td>
                <td className="px-4 py-3 text-center text-emerald-400">✓ Có</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Thêm / Sửa / Xóa sản phẩm và tồn kho</td>
                <td className="px-4 py-3 text-center text-slate-600">✗ Không</td>
                <td className="px-4 py-3 text-center text-emerald-400">✓ Có</td>
                <td className="px-4 py-3 text-center text-emerald-400">✓ Có</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Xem danh sách người dùng toàn hệ thống</td>
                <td className="px-4 py-3 text-center text-slate-600">✗ Không</td>
                <td className="px-4 py-3 text-center text-emerald-400">✓ Có</td>
                <td className="px-4 py-3 text-center text-emerald-400">✓ Có</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Khóa / Kích hoạt tài khoản người dùng</td>
                <td className="px-4 py-3 text-center text-slate-600">✗ Không</td>
                <td className="px-4 py-3 text-center text-slate-600">✗ Không</td>
                <td className="px-4 py-3 text-center text-emerald-400">✓ Có</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
