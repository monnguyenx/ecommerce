import React, { useState, useEffect } from 'react'
import {
  Bell,
  Truck,
  Camera,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Clock
} from 'lucide-react'
import { socketService, type OrderLiveEvent, type OrderEventType } from '../../services/socketService'

interface LiveOrderNotificationCenterProps {
  onSelectOrder?: (orderId: string) => void
}

export const LiveOrderNotificationCenter: React.FC<LiveOrderNotificationCenterProps> = ({
  onSelectOrder
}) => {
  const [events, setEvents] = useState<OrderLiveEvent[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [currentToast, setCurrentToast] = useState<OrderLiveEvent | null>(null)

  useEffect(() => {
    socketService.connect()

    const unsubscribe = socketService.subscribe((event) => {
      setEvents((prev) => [event, ...prev.slice(0, 19)])
      setUnreadCount((prev) => prev + 1)
      setCurrentToast(event)

      // Auto dismiss toast after 6s
      setTimeout(() => {
        setCurrentToast((curr) => (curr?.timestamp === event.timestamp ? null : curr))
      }, 6000)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const getEventIcon = (type: OrderEventType) => {
    switch (type) {
      case 'CHECKPOINT_UPDATED':
      case 'EVENT_ADDED':
        return <Truck className="w-4 h-4 text-blue-400" />
      case 'QC_UPDATED':
      case 'QC_APPROVED':
        return <Camera className="w-4 h-4 text-amber-400" />
      case 'QC_REJECTED':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'DEPOSIT_CONFIRMED':
        return <DollarSign className="w-4 h-4 text-emerald-400" />
      case 'ORDER_CREATED':
        return <Sparkles className="w-4 h-4 text-purple-400" />
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />
    }
  }

  const handleOpenDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setUnreadCount(0)
    }
  }

  const handleItemClick = (orderId: string) => {
    setIsOpen(false)
    if (onSelectOrder) {
      onSelectOrder(orderId)
    }
  }

  return (
    <div className="relative">
      {/* 1. BELL BUTTON */}
      <button
        type="button"
        onClick={handleOpenDropdown}
        className="relative p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer btn-press"
        title="Thông báo Real-time Vận chuyển"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg shadow-red-500/50 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. REAL-TIME TOAST NOTIFICATION POPUP (SLIDE-IN FROM TOP RIGHT) */}
      {currentToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-blue-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-fade-in-up flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            {getEventIcon(currentToast.type)}
          </div>

          <div
            className="flex-1 text-xs space-y-1 cursor-pointer"
            onClick={() => {
              if (onSelectOrder) onSelectOrder(currentToast.orderId)
              setCurrentToast(null)
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">{currentToast.title}</span>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                {currentToast.orderCode}
              </span>
            </div>
            <p className="text-slate-300 line-clamp-2 leading-relaxed">{currentToast.message}</p>
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> Vừa xong &bull; Bấm để xem
            </span>
          </div>

          <button
            onClick={() => setCurrentToast(null)}
            className="text-slate-500 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. DROPDOWN NOTIFICATION DRAWER */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-scale-up">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Thông Báo Vận Chuyển Real-Time
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Socket.io Live
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80">
            {events.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Bell className="w-6 h-6 mx-auto text-slate-700 animate-pulse" />
                <p>Chưa có thông báo vận chuyển mới.</p>
                <p className="text-[10px] text-slate-600">
                  Khi Admin cập nhật trạm hoặc nạp ảnh QC, thông báo tự động xuất hiện tại đây.
                </p>
              </div>
            ) : (
              events.map((ev, idx) => (
                <div
                  key={idx}
                  onClick={() => handleItemClick(ev.orderId)}
                  className="p-3.5 hover:bg-slate-850/60 transition-colors cursor-pointer text-xs flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 group-hover:border-slate-700">
                    {getEventIcon(ev.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px]">{ev.title}</span>
                      <span className="text-[10px] font-mono text-blue-400">{ev.orderCode}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                      {ev.message}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {new Date(ev.timestamp).toLocaleTimeString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
