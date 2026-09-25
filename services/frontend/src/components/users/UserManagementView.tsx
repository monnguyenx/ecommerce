import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react'
import { userApi, type UserItem, type UserStats } from '../../services/userApi'
import type { User } from '../../types/auth'

interface UserManagementViewProps {
  user: User
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ user }) => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const token = localStorage.getItem('ecommerce_auth_token') || ''
  const isAdmin = user.role === 'admin'

  const loadData = async () => {
    setIsLoading(true)
    const [userList, userStats] = await Promise.all([
      userApi.getUsers(token),
      userApi.getStats(token)
    ])
    setUsers(userList)
    setStats(userStats)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm))
    const matchRole = roleFilter ? u.role === roleFilter : true
    return matchSearch && matchRole
  })

  const toggleUserStatus = (targetUser: UserItem) => {
    if (!isAdmin) return
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active'
    setUsers((prev) =>
      prev.map((item) => (item.id === targetUser.id ? { ...item, status: newStatus } : item))
    )
    setActionNotice(`Đã chuyển trạng thái user "${targetUser.name}" sang: ${newStatus}`)
    setTimeout(() => setActionNotice(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Backend Service Info */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400">
              SERVICE: user-service (Port :8002)
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 font-heading">Quản lý Người dùng & Hồ sơ tài khoản</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Nghiệp vụ lưu trữ thông tin khách hàng, phân quyền vai trò (RBAC), lịch sử chi tiêu và địa chỉ nhận hàng.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-700/80 transition-all duration-200 cursor-pointer btn-press active:rotate-180"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Tổng người dùng</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-heading">{stats?.totalUsers ?? users.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tất cả tài khoản trong hệ thống</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Khách mua hàng</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-heading">{stats?.byRole?.customer ?? 3}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Khách hàng đặt hàng</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Quản lý & Nhân viên</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-heading">{stats?.byRole?.manager ?? 1}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Điều phối đơn hàng</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Quản trị viên (Admin)</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white font-heading">{stats?.byRole?.admin ?? 1}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Quyền cấu hình hệ thống</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="customer">Khách mua hàng (Customer)</option>
            <option value="manager">Quản lý (Manager)</option>
            <option value="admin">Quản trị viên (Admin)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Người dùng</th>
                <th className="px-5 py-3.5">Thông tin liên hệ</th>
                <th className="px-5 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Đơn hàng</th>
                <th className="px-5 py-3.5">Tổng chi tiêu</th>
                {isAdmin && <th className="px-5 py-3.5 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs border border-slate-700">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{u.id}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{u.email}</span>
                      </p>
                      {u.phone && (
                        <p className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{u.phone}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : u.role === 'manager'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          u.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-200">
                      {u.totalOrders} đơn
                    </td>
                    <td className="px-5 py-3.5 font-mono font-medium text-emerald-400">
                      {u.totalSpent ? u.totalSpent.toLocaleString('vi-VN') + ' đ' : '0 đ'}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-slate-700'
                              : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30'
                          }`}
                          title={u.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                        >
                          {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-xs">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
