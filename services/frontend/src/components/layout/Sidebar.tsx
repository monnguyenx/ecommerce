import React from 'react'
import {
  ShoppingBag,
  Compass,
  Package,
  Users,
  ShieldCheck,
  Layers,
  LogOut,
  ChevronRight
} from 'lucide-react'
import type { User } from '../../types/auth'

export type ActiveScreen = 'products' | 'orders' | 'users' | 'auth' | 'topology'

interface SidebarProps {
  activeScreen: ActiveScreen
  onSelectScreen: (screen: ActiveScreen) => void
  user: User
  onLogout: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  user,
  onLogout
}) => {
  const menuItems: Array<{
    id: ActiveScreen
    label: string
    sublabel: string
    icon: React.ReactNode
    badge: string
    port: string
  }> = [
    {
      id: 'products',
      label: 'Sản phẩm & Mặt hàng',
      sublabel: 'product-service (Items/SKU)',
      icon: <Package className="w-5 h-5" />,
      badge: 'Port :8003',
      port: '8003'
    },
    {
      id: 'orders',
      label: 'Đơn hàng & Vị trí Kiện',
      sublabel: 'order-service (Tracking 7-14d)',
      icon: <Compass className="w-5 h-5" />,
      badge: 'Port :8004',
      port: '8004'
    },
    {
      id: 'users',
      label: 'Quản lý Người dùng',
      sublabel: 'user-service (Profiles/RBAC)',
      icon: <Users className="w-5 h-5" />,
      badge: 'Port :8002',
      port: '8002'
    },
    {
      id: 'auth',
      label: 'Xác thực & Phân quyền',
      sublabel: 'auth-service (JWT Session)',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: 'Port :8001',
      port: '8001'
    },
    {
      id: 'topology',
      label: 'Kiến trúc Hệ thống',
      sublabel: 'Microservices Topology',
      icon: <Layers className="w-5 h-5" />,
      badge: '5 Nodes',
      port: 'Cluster'
    }
  ]

  const roleBadge = {
    admin: { label: 'Admin', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    manager: { label: 'Manager', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    customer: { label: 'Customer', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
  }[user.role]

  return (
    <aside className="w-72 lg:w-80 h-screen bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-5 flex-shrink-0 sticky top-0 z-40">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25 border border-blue-400/30 flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white">OmniOrder</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                HUB
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Microservices Console</p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px]">4 Backend Services Live</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">:8001 :8002 :8003 :8004</span>
        </div>

        {/* Navigation Menu */}
        <div className="mt-6 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500 px-3 mb-2">
            Màn hình nghiệp vụ Services
          </p>

          {menuItems.map((item) => {
            const isActive = activeScreen === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer group btn-press ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 font-semibold border border-blue-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/90 border border-transparent hover:border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'bg-slate-900/80 text-slate-400 group-hover:text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/10'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{item.label}</p>
                    <p
                      className={`text-[10px] mt-1 font-mono transition-colors ${
                        isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white/20 text-white border border-white/20'
                        : 'bg-slate-900 text-slate-400 group-hover:text-slate-300 border border-slate-800'
                    }`}
                  >
                    {item.port}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isActive ? 'translate-x-0.5 text-white' : 'text-slate-600 group-hover:translate-x-1 group-hover:text-slate-300'
                    }`}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* User Card & Logout at Bottom */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700/80 transition-all duration-200 shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-700 ring-2 ring-blue-500/20 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs flex-shrink-0 ring-2 ring-blue-500/20">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-0.5 ${roleBadge.bg}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0 active:scale-95"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
