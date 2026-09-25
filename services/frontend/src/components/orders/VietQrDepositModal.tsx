import React, { useState, useEffect } from 'react'
import {
  QrCode,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { orderApi, type Order } from '../../services/orderApi'

interface VietQrDepositModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedOrder: Order) => void
}

export const VietQrDepositModal: React.FC<VietQrDepositModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(600) // 10 minutes
  const [isConfirming, setIsConfirming] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [updatedOrderData, setUpdatedOrderData] = useState<Order | null>(null)

  const bankName = 'MB Bank (Ngân hàng TMCP Quân Đội)'
  const bankCode = 'MB'
  const accountNo = '0988889999'
  const accountName = 'CONG TY TNHH OMNIORDER VIET NAM'
  const depositAmount = order.depositAmount || Math.round(order.totalAmount * 0.5)
  const transferContent = order.orderCode

  // Link VietQR Napas 247 chính thức
  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountName)}`

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isSuccess) return

    setTimeLeft(600)
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, isSuccess])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2500)
  }

  // Khớp thanh toán realtime qua order-service
  const handleConfirmPayment = async () => {
    setIsConfirming(true)
    try {
      const res = await orderApi.confirmDeposit(order.id)
      if (res.success && res.data) {
        setIsSuccess(true)
        setUpdatedOrderData(res.data)
      } else {
        alert(res.message || 'Lỗi xác nhận thanh toán')
      }
    } catch (err: any) {
      alert('Lỗi kết nối ngân hàng: ' + err.message)
    } finally {
      setIsConfirming(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-blue-500/30 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Quét Mã VietQR Đặt Cọc 50%</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Napas 247
                </span>
              </div>
              <p className="text-xs text-slate-400">Khớp giao dịch tự động 100% qua cổng Napas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isSuccess ? (
            /* TRẠNG THÁI THÀNH CÔNG */
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-white">Thanh Toán Đặt Cọc Thành Công!</h4>
                <p className="text-xs text-slate-400">
                  Hệ thống ngân hàng Napas 247 đã khớp số tiền{' '}
                  <strong className="text-emerald-400 font-mono text-sm">
                    {depositAmount.toLocaleString('vi-VN')} đ
                  </strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã đơn hàng:</span>
                  <strong className="font-mono text-white">{order.orderCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Đã chuyển giao cho bộ phận Mua Hàng Quảng Châu
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-800/40">
                  <span className="text-slate-400">Còn lại thu COD khi giao hàng (50%):</span>
                  <strong className="text-amber-400 font-mono">
                    {order.remainingAmount.toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSuccess(updatedOrderData || order)
                  onClose()
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 cursor-pointer btn-press"
              >
                <span>Xem Hành Trình Vận Chuyển Kiện Hàng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* TRẠNG THÁI CHỜ QUÉT MÃ */
            <div className="space-y-5">
              {/* QR Image & Timer Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="relative p-2 rounded-2xl bg-white shadow-2xl flex-shrink-0 group">
                  <img
                    src={qrUrl}
                    alt="VietQR Napas 247"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-blue-500/40 rounded-2xl pointer-events-none" />
                </div>

                <div className="space-y-3 flex-1 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Hết hạn sau:</span>
                    <span className="font-mono font-bold text-amber-400 flex items-center gap-1 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimer(timeLeft)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[11px]">Số tiền đặt cọc (50%):</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-black text-emerald-400">
                        {depositAmount.toLocaleString('vi-VN')} đ
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(depositAmount.toString(), 'amount')}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer text-[10px] flex items-center gap-1"
                      >
                        {copiedField === 'amount' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                      <span>Tự động khớp giao dịch Napas 247</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Mở bất kỳ App Ngân hàng (MB, VCB, Techcombank, VPBank, Momo...) quét mã để thanh toán tức thì.
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin chuyển khoản thủ công */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                  <span className="font-semibold text-white">{bankName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-400 text-sm">{accountNo}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accountNo, 'accountNo')}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'accountNo' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <span className="font-semibold text-white uppercase">{accountName}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Nội dung chuyển khoản (Bắt buộc):</span>
                    <span className="text-[10px] text-amber-400">Để bot tự động khớp đơn hàng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-amber-300 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transferContent, 'content')}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={handleConfirmPayment}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer disabled:opacity-50 transition-all btn-press"
                >
                  {isConfirming ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>⚡ Tôi Đã Chuyển Khoản (Khớp giao dịch tức thì)</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bảo mật chuẩn PCI-DSS &amp; Napas 247</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
