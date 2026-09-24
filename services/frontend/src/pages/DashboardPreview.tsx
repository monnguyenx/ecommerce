import React, { useState } from 'react'
import type { User } from '../types/auth'
import { Sidebar, type ActiveScreen } from '../components/layout/Sidebar'
import { ProductManagementView } from '../components/products/ProductManagementView'
import { OrderTrackingView } from '../components/orders/OrderTrackingView'
import { UserManagementView } from '../components/users/UserManagementView'
import { AuthManagementView } from '../components/auth/AuthManagementView'
import { SystemTopologyView } from '../components/system/SystemTopologyView'

interface DashboardPreviewProps {
  user: User
  onLogout: () => void
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({ user, onLogout }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('products')

  const screenTitle = {
    products: 'Quản lý Sản phẩm & Mặt hàng (product-service)',
    orders: 'Đơn hàng Order Trung Quốc & Vị trí Kiện hàng (order-service)',
    users: 'Quản lý Người dùng & Hồ sơ (user-service)',
    auth: 'Xác thực & Phiên làm việc (auth-service)',
    topology: 'Sơ đồ Kiến trúc Toàn cụm Microservices'
  }[activeScreen]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row w-full overflow-hidden">
      {/* 1. SIDEBAR BÊN TRÁI: Danh sách các màn hình nghiệp vụ microservices */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        user={user}
        onLogout={onLogout}
      />

      {/* 2. KHÔNG GIAN LÀM VIỆC CHÍNH BÊN PHẢI: Logic nghiệp vụ của Backend tương ứng */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 px-6 sm:px-8 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-30 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {screenTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gateway: Direct Call</span>
            </span>
          </div>
        </header>

        {/* Nội dung màn hình tương ứng */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeScreen === 'products' && (
            <ProductManagementView
              key={activeScreen}
              user={user}
              onGoToTracking={() => setActiveScreen('orders')}
            />
          )}
          {activeScreen === 'orders' && <OrderTrackingView user={user} />}
          {activeScreen === 'users' && <UserManagementView user={user} />}
          {activeScreen === 'auth' && <AuthManagementView user={user} />}
          {activeScreen === 'topology' && <SystemTopologyView />}
        </main>
      </div>
    </div>
  )
}
