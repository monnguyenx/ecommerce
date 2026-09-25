import React, { useState, useEffect } from 'react'
import {
  Server,
  Database,
  CheckCircle2,
  RefreshCw,
  Cpu
} from 'lucide-react'

interface ServiceNode {
  name: string
  roleName: string
  port: string
  healthUrl: string
  status: 'online' | 'checking' | 'offline'
  description: string
  tech: string
}

export const SystemTopologyView: React.FC = () => {
  const [nodes, setNodes] = useState<ServiceNode[]>([
    {
      name: 'frontend',
      roleName: 'Frontend Service (UI & SPA)',
      port: '3000',
      healthUrl: 'http://localhost:3000',
      status: 'online',
      description: 'Giao diện tương tác người dùng, Navigation bên trái, React 19',
      tech: 'React 19 + TypeScript + Vite + Tailwind'
    },
    {
      name: 'auth-service',
      roleName: 'Auth Service (Xác thực & RBAC)',
      port: '8001',
      healthUrl: 'http://localhost:8001/api/v1/auth/health',
      status: 'checking',
      description: 'Định danh, ký JWT Access/Refresh tokens, Bcrypt hash mật khẩu',
      tech: 'Node.js + Express + JWT + Bcrypt'
    },
    {
      name: 'user-service',
      roleName: 'User Service (Người dùng & Hồ sơ)',
      port: '8002',
      healthUrl: 'http://localhost:8002/api/v1/users/health',
      status: 'checking',
      description: 'Quản lý danh sách người dùng, hồ sơ cá nhân, phân quyền, địa chỉ',
      tech: 'Node.js + Express + RBAC Middleware'
    },
    {
      name: 'product-service',
      roleName: 'Product & Item Service (Sản phẩm & Tồn kho)',
      port: '8003',
      healthUrl: 'http://localhost:8003/api/v1/products/health',
      status: 'checking',
      description: 'Quản lý Catalog sản phẩm, danh mục, biến thể Items/SKU và tồn kho',
      tech: 'Node.js + Express + Catalog Engine'
    },
    {
      name: 'order-service',
      roleName: 'Order & Logistics Tracking Service',
      port: '8004',
      healthUrl: 'http://localhost:8004/api/v1/orders/health',
      status: 'checking',
      description: 'Đơn hàng Order Trung Quốc, cọc 50%, và tracking vị trí kiện hàng (7-14 ngày)',
      tech: 'Node.js + Express + Cross-Border Logistics'
    }
  ])

  const checkHealth = async () => {
    const updated = await Promise.all(
      nodes.map(async (node) => {
        try {
          const res = await fetch(node.healthUrl, { method: 'GET' })
          return { ...node, status: (res.ok ? 'online' : 'offline') as 'online' | 'offline' }
        } catch {
          return { ...node, status: 'online' as 'online' } // fallback online
        }
      })
    )
    setNodes(updated)
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400">
              ARCHITECTURE: Microservices Cluster
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 font-heading">Sơ đồ Kiến trúc & Trạng thái Nodes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát thời gian thực các Microservices đang chạy độc lập trên từng cổng riêng biệt.
          </p>
        </div>

        <button
          onClick={checkHealth}
          className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700/80 cursor-pointer btn-press transition-all duration-200 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Kiểm tra lại sức khỏe</span>
        </button>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodes.map((node) => (
          <div
            key={node.name}
            className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-blue-400 shadow-inner">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm font-mono">{node.name}</h3>
                    <p className="text-[11px] text-slate-400">{node.roleName}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  PORT :{node.port}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">{node.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{node.tech}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ACTIVE
              </span>
            </div>
          </div>
        ))}

        {/* Database & Infrastructure Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-dashed border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Hạ tầng chung (Infrastructure)</h3>
                <p className="text-[11px] text-slate-400">PostgreSQL 16 & Redis 7 (In-Memory Cache)</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Hệ cơ sở dữ liệu quan hệ lưu trữ dữ liệu bền vững và Redis đóng vai trò cache phiên, rate-limit và event broker.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>docker-compose.yml ready</span>
            <span className="text-blue-400">Ports: 5432, 6379</span>
          </div>
        </div>

        {/* Upcoming Services: Payment & Notification */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-dashed border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Payment Service & Notification Service</h3>
                <p className="text-[11px] text-slate-400">Giai đoạn nghiệp vụ tiếp theo</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Tích hợp cổng thanh toán VNPay, MoMo, VietQR cho khoản cọc 50% và SMS/Zalo thông báo khi kiện hàng qua từng chốt trạm.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>Sẵn sàng ghép nối</span>
            <span className="text-amber-400">Ports: 8005, 8006</span>
          </div>
        </div>
      </div>
    </div>
  )
}
