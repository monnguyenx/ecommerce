import React from 'react'
import {
  ShoppingBag,
  Layers,
  Zap,
  ShieldCheck,
  PackageCheck,
  Server,
  Activity,
  Boxes,
  Cpu
} from 'lucide-react'

export const BrandShowcase: React.FC = () => {
  return (
    <div className="relative flex flex-col justify-between px-6 sm:px-12 lg:px-14 xl:px-16 py-8 sm:py-10 lg:py-12 h-full text-white bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background ambient glowing spheres & microservices grid pattern */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-15 pointer-events-none" />

      {/* Centered Content Wrapper: Cân giữa toàn bộ nội dung trong cột trái */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col justify-between h-full min-h-[640px]">
        {/* Header / Brand Logo: Căn giữa thương hiệu */}
        <div className="flex items-center justify-center gap-3.5 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 shadow-xl shadow-blue-500/25 text-white font-bold border border-blue-400/30 flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">
                OmniOrder
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                MICROSERVICES
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống Quản lý Bán hàng & Xử lý Đơn hàng Phân tán
            </p>
          </div>
        </div>

        {/* Main Showcase Hero: Căn giữa tiêu đề, huy hiệu và mô tả */}
        <div className="my-auto py-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-blue-300 backdrop-blur-md shadow-inner">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Kiến trúc phân tán Microservices hiệu năng cao</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            Quản trị đơn hàng <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              tốc độ cao & đồng bộ tức thì.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto">
            Tách biệt hoàn toàn các dịch vụ Định danh (Auth), Đơn hàng (Orders), Kho hàng (Inventory) và Thanh toán (Payment) với kiến trúc độc lập, mở rộng linh hoạt theo tải.
          </p>

          {/* Microservices Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 text-blue-400 mb-1.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">Xử lý tức thì</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Đồng bộ dữ liệu đa kênh thông qua Message Queue & Event Bus
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 text-emerald-400 mb-1.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">Đồng bộ tồn kho</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Kiểm soát real-time loại bỏ triệt để rủi ro overselling đơn hàng
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 text-amber-400 mb-1.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Server className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">Độc lập dịch vụ</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Nâng cấp và scale từng service mà không gián đoạn hệ thống
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 text-purple-400 mb-1.5">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">Bảo mật chuẩn JWT</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Phân quyền chặt chẽ giữa Quản trị viên, Quản lý đơn & Khách hàng
              </p>
            </div>
          </div>

          {/* Dynamic Topology Mini Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
              <Boxes className="w-4 h-4 text-sky-400" />
              <span>Auth</span>
              <span className="text-slate-600">→</span>
              <span>Order</span>
              <span className="text-slate-600">→</span>
              <span>Catalog</span>
              <span className="text-slate-600">→</span>
              <span>Payment</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              100% HEALTHY
            </span>
          </div>
        </div>

        {/* Footer System Status: Cân đối trong container */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="font-mono">frontend-service:v1.0.0</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Sẵn sàng kết nối</span>
          </div>
        </div>
      </div>
    </div>
  )
}
