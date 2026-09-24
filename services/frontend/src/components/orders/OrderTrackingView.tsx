import React, { useState, useEffect } from 'react'
import {
  Compass,
  Search,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  RefreshCw,
  DollarSign,
  Boxes,
  Building2,
  FileCheck2,
  Phone,
  UserCheck,
  Sparkles
} from 'lucide-react'
import { orderApi, type Order, type OrderStats, type CheckpointCode } from '../../services/orderApi'
import type { User } from '../../types/auth'

interface OrderTrackingViewProps {
  user: User
  initialOrderId?: string
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ user: _user, initialOrderId }) => {
  const [orders, setProductsOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingCheckpoint, setIsUpdatingCheckpoint] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const loadData = async (queryTerm = searchTerm) => {
    setIsLoading(true)
    const [orderList, statsRes] = await Promise.all([
      orderApi.getOrders({ search: queryTerm, status: statusFilter }),
      orderApi.getStats()
    ])
    setProductsOrders(orderList)
    setStats(statsRes)

    // Nếu có initialOrderId hoặc chưa chọn order nào, chọn cái đầu tiên
    if (orderList.length > 0) {
      if (initialOrderId) {
        const found = orderList.find((o) => o.id === initialOrderId || o.orderCode === initialOrderId)
        if (found) {
          const detail = await orderApi.getOrderById(found.id)
          setSelectedOrder(detail || found)
        } else {
          const detail = await orderApi.getOrderById(orderList[0].id)
          setSelectedOrder(detail || orderList[0])
        }
      } else if (!selectedOrder || !orderList.some((o) => o.id === selectedOrder.id)) {
        const detail = await orderApi.getOrderById(orderList[0].id)
        setSelectedOrder(detail || orderList[0])
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleSelectOrder = async (orderId: string) => {
    setIsLoading(true)
    const detail = await orderApi.getOrderById(orderId)
    if (detail) setSelectedOrder(detail)
    setIsLoading(false)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      loadData('')
      return
    }
    setIsLoading(true)
    // Thử lookup trực tiếp
    const directMatch = await orderApi.lookupByCode(searchTerm.trim())
    if (directMatch) {
      setSelectedOrder(directMatch)
      setActionMessage(`Tìm thấy kiện hàng [${directMatch.orderCode}]`)
      setTimeout(() => setActionMessage(null), 3000)
    } else {
      await loadData(searchTerm.trim())
    }
    setIsLoading(false)
  }

  // Mô phỏng cập nhật trạm checkpoint của kiện hàng
  const handleSimulateCheckpoint = async (step: number) => {
    if (!selectedOrder) return
    setIsUpdatingCheckpoint(true)
    const res = await orderApi.updateCheckpoint(selectedOrder.id, step)
    if (res.success && res.data) {
      setSelectedOrder(res.data)
      setActionMessage(res.message)
      setTimeout(() => setActionMessage(null), 4000)
      loadData(searchTerm)
    }
    setIsUpdatingCheckpoint(false)
  }

  const getCheckpointStepNumber = (code?: CheckpointCode): number => {
    switch (code) {
      case 'ORDER_DEPOSITED':
        return 1
      case 'SUPPLIER_DISPATCHED':
        return 2
      case 'CN_WAREHOUSE_RECEIVED':
        return 3
      case 'CUSTOMS_CLEARING':
        return 4
      case 'VN_WAREHOUSE_SORTING':
        return 5
      case 'LOCAL_DELIVERING':
      case 'DELIVERED_SUCCESS':
        return 6
      default:
        return 1
    }
  }

  const currentStep = getCheckpointStepNumber(selectedOrder?.currentCheckpoint)

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-blue-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                order-service (:8004) &bull; ecommerce_order_db
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🇨🇳 Mô hình Order Trung Quốc (7 - 14 ngày)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Theo dõi Đơn hàng & Định vị Kiện hàng Xuyên Biên Giới
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Theo dõi lộ trình thực tế từ Nhà cung cấp Trung Quốc (Taobao / 1688 / Tmall) qua Kho trung chuyển Quảng Châu, Cửa khẩu Hữu Nghị tới tận tay khách hàng tại Việt Nam.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Tổng đơn Order</p>
            <p className="text-2xl font-black text-white mt-1 font-mono">
              {stats?.totalOrders || orders.length}
            </p>
            <span className="text-[11px] text-blue-400 font-mono">Đang phục vụ</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Đang ở Trung Quốc</p>
            <p className="text-2xl font-black text-amber-400 mt-1 font-mono">
              {stats?.inTransitCount || 0}
            </p>
            <span className="text-[11px] text-slate-400">Shop / Kho Quảng Châu</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Thông quan Cửa khẩu</p>
            <p className="text-2xl font-black text-indigo-400 mt-1 font-mono">
              {stats?.customsCount || 0}
            </p>
            <span className="text-[11px] text-slate-400">Hữu Nghị - Lạng Sơn</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Đã về Kho VN & Giao</p>
            <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {stats?.deliveringCount || 0}
            </p>
            <span className="text-[11px] text-slate-400">Kho SOC & Chặng cuối</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & LOOKUP BAR */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-blue-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nhập Mã Đơn (ORD-CN-...), Mã vận đơn SF Express, Bưu chính VN, hoặc tên khách hàng..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </form>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({stats?.totalOrders || orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_transit_cn')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'in_transit_cn' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Tại Trung Quốc
          </button>
          <button
            onClick={() => setStatusFilter('customs')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'customs' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Thông quan
          </button>
          <button
            onClick={() => setStatusFilter('in_transit_vn')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'in_transit_vn' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Về Việt Nam
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 whitespace-nowrap">Đơn mẫu:</span>
          {orders.slice(0, 3).map((ord) => (
            <button
              key={ord.id}
              onClick={() => handleSelectOrder(ord.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedOrder?.id === ord.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {ord.orderCode}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ACTIVE ORDER DETAILS & 6-STAGE TIMELINE TRACKING */}
      {selectedOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI: THÔNG TIN ĐƠN HÀNG & TÀI CHÍNH ĐẶT CỌC (5 Cột) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Thẻ Sản phẩm Đặt hàng */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                  {selectedOrder.orderCode}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div className="flex gap-4">
                <img
                  src={selectedOrder.productThumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                  alt={selectedOrder.productName}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-950 border border-slate-800 flex-shrink-0"
                />
                <div className="space-y-1.5 overflow-hidden">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Mã SP: {selectedOrder.productCode}
                  </span>
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">
                    {selectedOrder.productName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    SKU: <strong className="text-slate-200">{selectedOrder.itemSku}</strong>
                  </p>
                  <p className="text-xs text-slate-400">
                    Biến thể: {selectedOrder.itemTitle}
                  </p>
                </div>
              </div>

              {/* Thông tin vận chuyển xuyên biên giới */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nguồn hàng:</span>
                  <span className="font-semibold text-slate-200">{selectedOrder.supplierPlatform}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vận đơn nội địa Trung (SF Express):</span>
                  <span className="font-mono text-blue-400 font-bold">{selectedOrder.cnTrackingCode || 'Đang cập nhật'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vận đơn bưu chính Việt Nam:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedOrder.vnTrackingCode || 'Đang cập nhật'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Thời gian giao dự kiến:</span>
                  <span className="font-bold text-amber-400">{selectedOrder.estimatedDeliveryDays}</span>
                </div>
              </div>

              {/* BẢNG TÍNH TÀI CHÍNH & ĐẶT CỌC 50% */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Cơ chế Đặt cọc & Thanh toán
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Cọc 50%
                  </span>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Tổng giá trị đơn hàng ({selectedOrder.quantity} món):</span>
                    <strong className="text-white font-mono text-sm">
                      {selectedOrder.totalAmount.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-emerald-300 font-medium">Tiền đặt cọc (50%):</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-emerald-400">
                        {selectedOrder.depositAmount.toLocaleString('vi-VN')} đ
                      </span>
                      <p className="text-[10px] text-emerald-500 font-medium">✓ Đã thanh toán</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-950/30 border border-amber-800/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-300 font-medium">Còn lại thu COD (50%):</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-amber-400">
                        {selectedOrder.remainingAmount.toLocaleString('vi-VN')} đ
                      </span>
                      <p className="text-[10px] text-amber-500 font-medium">Thu khi nhận hàng</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin khách hàng & Địa chỉ giao */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>Người nhận hàng:</span>
                </div>
                <p className="text-white font-bold text-sm">{selectedOrder.customerName}</p>
                <p className="text-slate-400 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {selectedOrder.customerPhone}
                </p>
                <p className="text-slate-400 flex items-start gap-1.5 leading-relaxed pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                  {selectedOrder.customerAddress}
                </p>
              </div>

              {/* SIMULATOR: Nút chuyển trạm (Dành cho thử nghiệm & Demo nghiệp vụ) */}
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Mô phỏng Chuyển trạm Kiện hàng
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Trạm {currentStep}/6</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Bấm để mô phỏng kiện hàng di chuyển qua các điểm chốt từ Trung Quốc về Việt Nam:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    disabled={isUpdatingCheckpoint}
                    onClick={() => handleSimulateCheckpoint(1)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                      currentStep === 1 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    1. Đặt cọc
                  </button>
                  <button
                    disabled={isUpdatingCheckpoint}
                    onClick={() => handleSimulateCheckpoint(2)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                      currentStep === 2 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    2. Shop TQ gửi
                  </button>
                  <button
                    disabled={isUpdatingCheckpoint}
                    onClick={() => handleSimulateCheckpoint(3)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                      currentStep === 3 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    3. Kho Quảng Châu
                  </button>
                  <button
                    disabled={isUpdatingCheckpoint}
                    onClick={() => handleSimulateCheckpoint(4)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                      currentStep === 4 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    4. Cửa khẩu Hữu Nghị
                  </button>
                  <button
                    disabled={isUpdatingCheckpoint}
                    onClick={() => handleSimulateCheckpoint(5)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                      currentStep === 5 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    5. Kho VN SOC
                  </button>
                  <button
                    disabled={isUpdatingCheckpoint}
                    onClick={() => handleSimulateCheckpoint(6)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                      currentStep === 6 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    6. Đang giao hàng
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TIMELINE ĐỊNH VỊ 6 CHẶNG XUYÊN BIÊN GIỚI (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-400" />
                    Hành trình Vận chuyển Xuyên Biên Giới (China ➔ VN)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hàng hóa được cập nhật vị trí real-time tại từng trạm trung chuyển
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 self-start sm:self-auto">
                  Hiện tại: Trạm {currentStep} / 6
                </span>
              </div>

              {/* TIMELINE VERTICAL STEPPER */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {(selectedOrder.trackingEvents || []).map((ev, index) => {
                  const isPast = ev.isCompleted && !ev.isCurrent
                  const isCurrent = ev.isCurrent

                  return (
                    <div key={ev.id || index} className="relative group">
                      {/* Checkpoint Dot */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 shadow-lg shadow-blue-500/50 scale-110'
                            : isPast
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : ev.checkpointStep}
                      </div>

                      {/* Checkpoint Card */}
                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/40 shadow-xl shadow-blue-500/5'
                            : isPast
                            ? 'bg-slate-950/70 border-slate-800/90'
                            : 'bg-slate-950/30 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                isCurrent
                                  ? 'bg-blue-500 text-white animate-pulse'
                                  : isPast
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              Bước {ev.checkpointStep}
                            </span>
                            <h4
                              className={`text-sm font-bold ${
                                isCurrent ? 'text-white' : isPast ? 'text-slate-200' : 'text-slate-400'
                              }`}
                            >
                              {ev.title}
                            </h4>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(ev.timestamp).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium mt-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{ev.location}</span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Chưa có đơn hàng nào được chọn</h3>
          <p className="text-xs text-slate-400">
            Vui lòng nhập mã đơn hoặc chọn 1 đơn hàng từ danh sách để xem lộ trình vận chuyển.
          </p>
        </div>
      )}

      {/* 5. ORDER LIST TABLE (DANH SÁCH TOÀN BỘ ĐƠN HÀNG ORDER) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-400" />
              Danh sách Đơn hàng Order Trung Quốc ({orders.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Bấm vào bất kỳ dòng nào để xem chi tiết timeline và vị trí</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Mã đơn & Ngày đặt</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Sản phẩm & Biến thể</th>
                <th className="py-3 px-4">Tổng tiền & Cọc 50%</th>
                <th className="py-3 px-4">Trạm hiện tại</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((o) => {
                const isSelected = selectedOrder?.id === o.id
                return (
                  <tr
                    key={o.id}
                    onClick={() => handleSelectOrder(o.id)}
                    className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-950/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-blue-400">{o.orderCode}</span>
                      <p className="text-[10px] text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{o.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{o.customerPhone}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200 line-clamp-1">{o.productName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {o.itemSku}</p>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <p className="font-bold text-white">{o.totalAmount.toLocaleString('vi-VN')} đ</p>
                      <p className="text-[10px] text-emerald-400">Đã cọc: {o.depositAmount.toLocaleString('vi-VN')} đ</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-950 border border-slate-800 text-blue-300">
                        Trạm {getCheckpointStepNumber(o.currentCheckpoint)}/6
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectOrder(o.id)
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors cursor-pointer text-xs"
                      >
                        Xem vị trí
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
