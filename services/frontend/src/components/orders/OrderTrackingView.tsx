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
  Edit3,
  Plus,
  Save,
  ShieldCheck
} from 'lucide-react'
import {
  orderApi,
  type Order,
  type OrderStats,
  type CheckpointCode,
  type OrderTrackingEvent,
  type OrderStatus
} from '../../services/orderApi'
import type { User } from '../../types/auth'

interface OrderTrackingViewProps {
  user: User
  initialOrderId?: string
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ user, initialOrderId }) => {
  const [orders, setProductsOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const canManage = user.role === 'admin' || user.role === 'manager'

  // Admin Editing Form State
  const [adminStep, setAdminStep] = useState<number>(1)
  const [adminLocation, setAdminLocation] = useState<string>('')
  const [adminDescription, setAdminDescription] = useState<string>('')
  const [adminCnTracking, setAdminCnTracking] = useState<string>('')
  const [adminVnTracking, setAdminVnTracking] = useState<string>('')
  const [adminEstimatedDays, setAdminEstimatedDays] = useState<string>('')
  const [adminStatus, setAdminStatus] = useState<OrderStatus>('processing')
  const [isSavingAdmin, setIsSavingAdmin] = useState<boolean>(false)

  // Edit Single Event Modal State
  const [editingEvent, setEditingEvent] = useState<OrderTrackingEvent | null>(null)
  const [eventEditTitle, setEventEditTitle] = useState('')
  const [eventEditLocation, setEventEditLocation] = useState('')
  const [eventEditDesc, setEventEditDesc] = useState('')
  const [isSavingEvent, setIsSavingEvent] = useState(false)

  // Add Custom Event Modal State
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [isAddingEvent, setIsAddingEvent] = useState(false)

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

  const loadData = async (queryTerm = searchTerm) => {
    setIsLoading(true)
    const [orderList, statsRes] = await Promise.all([
      orderApi.getOrders({ search: queryTerm, status: statusFilter }),
      orderApi.getStats()
    ])
    setProductsOrders(orderList)
    setStats(statsRes)

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

  // Sync form inputs whenever selectedOrder updates
  useEffect(() => {
    if (selectedOrder) {
      const step = getCheckpointStepNumber(selectedOrder.currentCheckpoint)
      setAdminStep(step)
      const currentEv =
        selectedOrder.trackingEvents?.find((e) => e.isCurrent) ||
        selectedOrder.trackingEvents?.[step - 1] ||
        selectedOrder.trackingEvents?.[0]

      setAdminLocation(currentEv?.location || '')
      setAdminDescription(currentEv?.description || '')
      setAdminCnTracking(selectedOrder.cnTrackingCode || '')
      setAdminVnTracking(selectedOrder.vnTrackingCode || '')
      setAdminEstimatedDays(selectedOrder.estimatedDeliveryDays || '7 - 14 ngày')
      setAdminStatus(selectedOrder.currentStatus)
    }
  }, [selectedOrder?.id, selectedOrder?.currentCheckpoint])

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

  // Admin selects a checkpoint step to inspect/modify
  const handleSelectAdminStep = (step: number) => {
    setAdminStep(step)
    const ev = selectedOrder?.trackingEvents?.find((e) => e.checkpointStep === step)
    if (ev) {
      setAdminLocation(ev.location)
      setAdminDescription(ev.description)
    } else {
      const defaultLocations: Record<number, string> = {
        1: 'Cổng thanh toán OmniOrder - Hà Nội',
        2: 'Thâm Quyến, Quảng Đông, Trung Quốc',
        3: 'Kho Tổng Quảng Châu Hub (Quảng Đông, TQ)',
        4: 'Cửa khẩu Quốc tế Hữu Nghị (Lạng Sơn)',
        5: 'Kho Trung tâm Hà Nội SOC (Mê Linh, Hà Nội)',
        6: selectedOrder?.customerAddress || 'Địa chỉ người nhận'
      }
      setAdminLocation(defaultLocations[step] || '')
    }
  }

  // Quick chips for filling location
  const handleQuickLocation = (loc: string) => {
    setAdminLocation(loc)
  }

  // Admin saves checkpoint and order details
  const handleSaveAdminTracking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    setIsSavingAdmin(true)
    try {
      // 1. Cập nhật checkpoint & ghi chú vị trí
      await orderApi.updateCheckpoint(selectedOrder.id, adminStep, {
        location: adminLocation,
        description: adminDescription
      })

      // 2. Cập nhật mã vận đơn và trạng thái
      const ordRes = await orderApi.updateOrder(selectedOrder.id, {
        cnTrackingCode: adminCnTracking,
        vnTrackingCode: adminVnTracking,
        estimatedDeliveryDays: adminEstimatedDays,
        currentStatus: adminStatus
      })

      if (ordRes.success && ordRes.data) {
        setSelectedOrder(ordRes.data)
        setActionMessage('✓ Đã cập nhật vị trí kiện hàng và thông tin vận đơn cho khách hàng thành công!')
        setTimeout(() => setActionMessage(null), 4000)
        loadData(searchTerm)
      } else {
        const detail = await orderApi.getOrderById(selectedOrder.id)
        if (detail) setSelectedOrder(detail)
        setActionMessage('✓ Đã cập nhật trạm vị trí thành công!')
        setTimeout(() => setActionMessage(null), 4000)
        loadData(searchTerm)
      }
    } catch (err: any) {
      setActionMessage('Lỗi cập nhật: ' + err.message)
    } finally {
      setIsSavingAdmin(false)
    }
  }

  // Admin saves a specific event modal
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !editingEvent) return
    setIsSavingEvent(true)
    try {
      const res = await orderApi.updateEvent(selectedOrder.id, editingEvent.id, {
        title: eventEditTitle,
        location: eventEditLocation,
        description: eventEditDesc
      })
      if (res.success && res.data) {
        setSelectedOrder(res.data)
        setEditingEvent(null)
        setActionMessage('✓ Đã lưu thay đổi mốc hành trình thành công!')
        setTimeout(() => setActionMessage(null), 4000)
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setIsSavingEvent(false)
    }
  }

  // Admin adds a custom event
  const handleAddCustomEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    setIsAddingEvent(true)
    try {
      const res = await orderApi.addEvent(selectedOrder.id, {
        title: newEventTitle,
        location: newEventLocation,
        description: newEventDesc
      })
      if (res.success && res.data) {
        setSelectedOrder(res.data)
        setShowAddEventModal(false)
        setNewEventTitle('')
        setNewEventLocation('')
        setNewEventDesc('')
        setActionMessage('✓ Đã bổ sung mốc hành trình mới thành công!')
        setTimeout(() => setActionMessage(null), 4000)
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setIsAddingEvent(false)
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

              {canManage ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  Quyền Quản Trị Viên: Cho Phép Chỉnh Sửa Vị Trí & Vận Đơn
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Chế độ Khách hàng: Theo dõi Thời gian thực
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🇨🇳 Mô hình Order Trung Quốc (7 - 14 ngày)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Theo dõi Đơn hàng & Quản lý Định vị Kiện hàng
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {canManage
                ? 'Quản trị viên có toàn quyền cập nhật mốc trạm, thay đổi vị trí thực tế, ghi chú thông quan và mã vận đơn để khách hàng theo dõi trực tiếp.'
                : 'Theo dõi lộ trình thực tế từ Nhà cung cấp Trung Quốc (Taobao / 1688 / Tmall) qua Kho trung chuyển Quảng Châu, Cửa khẩu Hữu Nghị tới tận tay tại Việt Nam.'}
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
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
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
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
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

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
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
          {/* CỘT TRÁI: THÔNG TIN ĐƠN HÀNG, TÀI CHÍNH & ADMIN MANAGEMENT CONSOLE (5 Cột) */}
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
                  <span className="font-mono text-blue-400 font-bold">{selectedOrder.cnTrackingCode || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vận đơn bưu chính Việt Nam:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedOrder.vnTrackingCode || 'Chưa cập nhật'}</span>
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

              {/* BẢNG ĐIỀU KHIỂN & CHỈNH SỬA VẬN ĐƠN DÀNH CHO ADMIN */}
              {canManage && (
                <div className="p-5 rounded-3xl bg-gradient-to-b from-blue-950/50 via-slate-950 to-slate-900 border-2 border-blue-500/40 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Admin: Cập Nhật Vị Trí & Vận Đơn
                        </h4>
                        <p className="text-[10px] text-blue-300">Cập nhật ngay để khách hàng nhận thông tin</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Trạm {adminStep} / 6
                    </span>
                  </div>

                  <form onSubmit={handleSaveAdminTracking} className="space-y-3.5 text-xs">
                    {/* 1. Chọn Trạm Checkpoint */}
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        1. Chọn Trạm Kiện Hàng Đang Tới *
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { step: 1, label: '1. Đặt cọc' },
                          { step: 2, label: '2. Shop TQ gửi' },
                          { step: 3, label: '3. Kho Quảng Châu' },
                          { step: 4, label: '4. Cửa khẩu Hữu Nghị' },
                          { step: 5, label: '5. Kho VN SOC' },
                          { step: 6, label: '6. Đang giao hàng' }
                        ].map((s) => (
                          <button
                            key={s.step}
                            type="button"
                            onClick={() => handleSelectAdminStep(s.step)}
                            className={`px-2 py-2 rounded-xl text-[11px] font-mono transition-all cursor-pointer text-center ${
                              adminStep === s.step
                                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-2 ring-blue-400'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Vị trí thực tế */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold">2. Tọa độ / Vị trí thực tế *</label>
                        <span className="text-[10px] text-slate-500">Khách sẽ thấy trên bản đồ</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={adminLocation}
                        onChange={(e) => setAdminLocation(e.target.value)}
                        placeholder="VD: Cửa khẩu Quốc tế Hữu Nghị (Lạng Sơn)..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-blue-500"
                      />

                      {/* Gợi ý vị trí nhanh */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[10px] text-slate-500 self-center">Chọn nhanh:</span>
                        {[
                          'Kho Tổng Quảng Châu Hub (Quảng Đông, TQ)',
                          'Cửa khẩu Quốc tế Hữu Nghị (Lạng Sơn)',
                          'Kho Trung tâm Hà Nội SOC (Mê Linh, HN)',
                          'Kho Tân Bình SOC (TP.HCM)'
                        ].map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleQuickLocation(loc)}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-blue-300 border border-slate-800 cursor-pointer"
                          >
                            {loc.split('(')[0].trim()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Ghi chú thông báo cho khách */}
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        3. Ghi chú chi tiết thông báo cho khách hàng *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={adminDescription}
                        onChange={(e) => setAdminDescription(e.target.value)}
                        placeholder="Nhập thông tin cập nhật chi tiết lộ trình..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
                      />
                    </div>

                    {/* 4. Mã vận đơn & Thời gian dự kiến */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Mã SF Express (TQ)</label>
                        <input
                          type="text"
                          value={adminCnTracking}
                          onChange={(e) => setAdminCnTracking(e.target.value)}
                          placeholder="SF..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-blue-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Mã Bưu chính (VN)</label>
                        <input
                          type="text"
                          value={adminVnTracking}
                          onChange={(e) => setAdminVnTracking(e.target.value)}
                          placeholder="GHN / VNPOST..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Thời gian về VN</label>
                        <input
                          type="text"
                          value={adminEstimatedDays}
                          onChange={(e) => setAdminEstimatedDays(e.target.value)}
                          placeholder="7 - 14 ngày"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Trạng thái đơn</label>
                        <select
                          value={adminStatus}
                          onChange={(e) => setAdminStatus(e.target.value as OrderStatus)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="processing">Đang chuẩn bị hàng</option>
                          <option value="in_transit_cn">Đang vận chuyển nội địa TQ</option>
                          <option value="customs">Đang thông quan Cửa khẩu</option>
                          <option value="in_transit_vn">Đã về kho phân loại VN</option>
                          <option value="delivering">Đang giao tận tay</option>
                          <option value="completed">Đã giao thành công</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingAdmin}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer mt-2"
                    >
                      {isSavingAdmin ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Lưu Cập Nhật Vị Trí & Vận Đơn Ngay</span>
                    </button>
                  </form>
                </div>
              )}
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

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Trạm hiện tại: {currentStep} / 6
                  </span>

                  {canManage && (
                    <button
                      onClick={() => setShowAddEventModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm mốc phát sinh</span>
                    </button>
                  )}
                </div>
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

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(ev.timestamp).toLocaleString('vi-VN')}
                            </span>

                            {canManage && (
                              <button
                                onClick={() => {
                                  setEditingEvent(ev)
                                  setEventEditTitle(ev.title)
                                  setEventEditLocation(ev.location)
                                  setEventEditDesc(ev.description)
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Chỉnh sửa chi tiết mốc này"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium mt-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{ev.location}</span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
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
                        {canManage ? 'Quản lý vị trí' : 'Xem vị trí'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA CHI TIẾT 1 MỐC SỰ KIỆN TRONG TIMELINE */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Chỉnh sửa Mốc Hành trình</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Bước {editingEvent.checkpointStep} &bull; {editingEvent.checkpointCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tiêu đề mốc *</label>
                <input
                  type="text"
                  required
                  value={eventEditTitle}
                  onChange={(e) => setEventEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vị trí địa lý *</label>
                <input
                  type="text"
                  required
                  value={eventEditLocation}
                  onChange={(e) => setEventEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả hành trình thông báo khách *</label>
                <textarea
                  rows={3}
                  required
                  value={eventEditDesc}
                  onChange={(e) => setEventEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  {isSavingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Lưu mốc</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM MỐC LỘ TRÌNH PHÁT SINH */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Thêm Mốc Lộ Trình Phát Sinh</h3>
                  <p className="text-[11px] text-slate-400">Bổ sung sự kiện cập nhật vị trí cho khách hàng</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tiêu đề mốc *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiểm tra đặc biệt tại Cửa khẩu / Chuyển xe liên vận..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vị trí địa lý *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cửa khẩu Hữu Nghị - Làn xe container 03..."
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả thông báo chi tiết *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập thông tin mô tả chi tiết sự kiện vận chuyển..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAddingEvent}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  {isAddingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Thêm vào lộ trình</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
