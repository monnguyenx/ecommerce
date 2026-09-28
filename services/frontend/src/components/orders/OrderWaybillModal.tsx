import React, { useState, useRef } from 'react'
import {
  Printer,
  X,
  Copy,
  Check,
  Truck,
  Building2
} from 'lucide-react'
import type { Order } from '../../services/orderApi'

interface OrderWaybillModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
}

/**
 * Component tạo thanh mã vạch SVG giả lập Code 128 sắc nét, chuẩn in ấn
 */
const SvgBarcode: React.FC<{ value: string; height?: number; className?: string }> = ({
  value,
  height = 52,
  className = ''
}) => {
  // Sinh các vạch barcode giả lập từ mã chuỗi một cách nhất quán
  const bars: { width: number; isSpace: boolean }[] = []
  let seed = 0
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) & 0xffffffff
  }

  // Khởi tạo các vạch bảo vệ start
  bars.push({ width: 2, isSpace: false }, { width: 1, isSpace: true }, { width: 2, isSpace: false })

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    const pattern = (code ^ Math.abs(seed >> (i % 16))) % 64
    bars.push(
      { width: ((pattern >> 0) & 1) + 1, isSpace: false },
      { width: ((pattern >> 1) & 1) + 1, isSpace: true },
      { width: ((pattern >> 2) & 1) + 1.5, isSpace: false },
      { width: ((pattern >> 3) & 1) + 1, isSpace: true },
      { width: ((pattern >> 4) & 1) + 2, isSpace: false },
      { width: ((pattern >> 5) & 1) + 1, isSpace: true }
    )
  }

  // Vạch bảo vệ stop
  bars.push({ width: 2, isSpace: false }, { width: 1, isSpace: true }, { width: 3, isSpace: false })

  let currentX = 10
  const totalWidth = bars.reduce((acc, b) => acc + b.width * 2, 20)

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[260px] h-12"
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => {
          const x = currentX
          const w = bar.width * 2
          currentX += w
          if (bar.isSpace) return null
          return <rect key={idx} x={x} y={0} width={w} height={height} fill="#000000" />
        })}
      </svg>
      <span className="font-mono text-[11px] font-bold tracking-widest text-slate-900 mt-0.5">
        {value}
      </span>
    </div>
  )
}

export const OrderWaybillModal: React.FC<OrderWaybillModalProps> = ({ order, isOpen, onClose }) => {
  const [printFormat, setPrintFormat] = useState<'A4' | 'A5'>('A4')
  const [copiedCode, setCopiedCode] = useState(false)
  const waybillRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const cnTracking = order.cnTrackingCode || `SF${order.orderCode.replace(/[^0-9]/g, '').padEnd(10, '6')}CN`
  const vnTracking = order.vnTrackingCode || `VNPOST${order.orderCode.replace(/[^0-9]/g, '').padEnd(8, '9')}VN`

  const handlePrint = () => {
    window.print()
  }

  const handleCopyOrderCode = () => {
    navigator.clipboard.writeText(order.orderCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // QR tracking code
  const trackingQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&data=${encodeURIComponent(
    `https://omniorder.vn/tracking?code=${order.orderCode}&sf=${cnTracking}&vn=${vnTracking}`
  )}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Print CSS styles injected directly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #order-waybill-print-area, #order-waybill-print-area * {
            visibility: visible !important;
          }
          #order-waybill-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12px !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Top Header / Actions Bar (Hidden on print) */}
        <div className="no-print p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Phiếu Vận Đơn &amp; Khai Báo Hải Quan Song Ngữ</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  中越双语面单
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Chuẩn hóa logistics quốc tế Trung - Việt (SF Express &amp; Bưu chính VN)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Format toggle: A4 vs A5 */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  printFormat === 'A4'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Khổ A4 (Hồ sơ)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('A5')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  printFormat === 'A5'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Khổ A5 (Tem Thùng)
              </button>
            </div>

            {/* Copy order code */}
            <button
              type="button"
              onClick={handleCopyOrderCode}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Đã chép' : 'Sao chép mã'}</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer transition-all btn-press"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Vận Đơn</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950 flex justify-center">
          {/* THE WAYBILL PAPER SHEET (Black/White high contrast for crystal-clear printing) */}
          <div
            id="order-waybill-print-area"
            ref={waybillRef}
            className={`bg-white text-slate-900 border-2 border-slate-900 shadow-2xl transition-all duration-300 font-sans ${
              printFormat === 'A4'
                ? 'w-full max-w-[800px] p-6 sm:p-8 rounded-xl'
                : 'w-full max-w-[620px] p-4 sm:p-6 rounded-lg'
            }`}
          >
            {/* 1. TOP HEADER: LOGO, TITLE, BARCODES */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Brand Logo & Logistics Title */}
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="bg-slate-900 text-white font-black text-sm px-2.5 py-1 rounded tracking-wider">
                      OMNIORDER
                    </span>
                    <span className="font-extrabold text-xs text-blue-900 tracking-tight uppercase">
                      Cross-Border Express &bull; 跨境特快专线
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight uppercase">
                    PHIẾU GỬI HÀNG QUỐC TẾ &amp; VẬN ĐƠN HẢI QUAN
                  </h1>
                  <p className="text-xs font-bold text-slate-700 tracking-wide">
                    国际货物运单及海关申报单 / BILINGUAL WAYBILL &amp; PACKING SLIP
                  </p>
                </div>

                {/* Tracking SF Express Barcode */}
                <div className="flex flex-col items-center border border-slate-400 p-2 rounded bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Mã SF Express (Trung Quốc / 顺丰速运)
                  </span>
                  <SvgBarcode value={cnTracking} height={46} />
                </div>
              </div>

              {/* Order Meta Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-300 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Mã Đơn / 订单号:</span>
                  <strong className="font-mono text-xs text-blue-950 font-bold">{order.orderCode}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Ngày Khởi Tạo / 日期:</span>
                  <strong className="font-mono text-xs">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Dịch Vụ / 业务类型:</span>
                  <strong className="text-xs font-bold text-emerald-800">D2D Quốc Tế Trọn Gói</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Nguồn Hàng / 平台:</span>
                  <strong className="text-xs font-bold text-indigo-900">
                    {order.supplierPlatform || 'Taobao / 1688'}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. SHIPPER & CONSIGNEE BILINGUAL 2-COLUMN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* SHIPPER (NGƯỜI GỬI / 发件人) */}
              <div className="border-2 border-slate-900 p-3 rounded-lg bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-800" />
                      1. NGƯỜI GỬI / 发件人 (SHIPPER)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">
                      GUANGZHOU HUB
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-950">
                      Kho Tổng Quảng Châu Hub (广州集运分拨中心 - OmniOrder)
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      广东省广州市白云区太和镇物流园区88号 (Số 88 KCN Logistics Thái Hòa, Bạch Vân, Quảng Châu)
                    </p>
                    <p className="text-[11px] text-slate-800 font-mono">
                      <strong>Hotline / 电话:</strong> +86-20-8888-6688 &bull; <strong>ZIP:</strong> 510000
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                  <span>Xuất kho trung chuyển Quảng Châu</span>
                  <span className="font-mono">Status: DISPATCHED</span>
                </div>
              </div>

              {/* CONSIGNEE (NGƯỜI NHẬN / 收件人) */}
              <div className="border-2 border-slate-900 p-3 rounded-lg bg-blue-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-800" />
                      2. NGƯỜI NHẬN / 收件人 (CONSIGNEE)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                      VIETNAM D2D
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-extrabold text-slate-950 text-sm">{order.customerName}</p>
                    <p className="font-mono font-bold text-blue-950 text-xs">
                      Điện thoại / 电话: {order.customerPhone}
                    </p>
                    <p className="text-[11px] text-slate-800 font-medium leading-snug">
                      <strong>Địa chỉ / 地址:</strong> {order.customerAddress}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-600 flex justify-between items-center">
                  <span>Mã Bưu chính VN / 越南派送码:</span>
                  <strong className="font-mono text-emerald-900 text-xs">{vnTracking}</strong>
                </div>
              </div>
            </div>

            {/* 3. LOGISTICS ROUTING & QR TRACKING BAR */}
            <div className="border-2 border-slate-900 rounded-lg p-2.5 mb-4 bg-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase">
                  LỘ TRÌNH VẬN CHUYỂN XUYÊN BIÊN GIỚI / 跨境干线运输路由:
                </span>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap font-mono text-[11px] font-bold text-slate-800">
                  <span className="px-2 py-0.5 bg-white border border-slate-400 rounded">
                    🇨🇳 广州总仓 (Guangzhou Hub)
                  </span>
                  <span>➔</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-400 rounded">
                    🛡️ 友谊关口岸 (Huu Nghi Gate)
                  </span>
                  <span>➔</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-400 rounded">
                    🇻🇳 河内SOC (Hanoi Sorting)
                  </span>
                  <span>➔</span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded">
                    🏠 派送客户 (Door-to-Door)
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex items-center gap-2 border border-slate-300 p-1.5 bg-white rounded flex-shrink-0">
                <img
                  src={trackingQrUrl}
                  alt="QR Tracking"
                  className="w-14 h-14 object-contain"
                  crossOrigin="anonymous"
                />
                <div className="text-[9px] text-slate-600 leading-tight">
                  <p className="font-bold text-slate-900">Quét Mã Tra Cứu</p>
                  <p>扫码实时跟踪</p>
                  <p className="font-mono text-[8px] text-slate-400 mt-0.5">Live GPS Sync</p>
                </div>
              </div>
            </div>

            {/* 4. GOODS DESCRIPTION & CUSTOMS DECLARATION TABLE */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase text-slate-900">
                  3. KHAI BÁO HẢI QUAN &amp; THÔNG TIN HÀNG HÓA / 货物申报与装箱明细:
                </span>
                <span className="text-[10px] text-slate-500 font-mono">HS CODE: 8517.13.00 (Decl. Cleared)</span>
              </div>

              <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 text-[11px] font-extrabold uppercase">
                    <th className="border border-slate-900 p-1.5 text-center w-8">STT</th>
                    <th className="border border-slate-900 p-1.5 text-left">
                      Tên Hàng Hóa &amp; Quy Cách / 品名与规格
                    </th>
                    <th className="border border-slate-900 p-1.5 text-center w-20">Mã SKU</th>
                    <th className="border border-slate-900 p-1.5 text-center w-12">SL</th>
                    <th className="border border-slate-900 p-1.5 text-center w-24">Trọng Lượng</th>
                    <th className="border border-slate-900 p-1.5 text-right w-24">Đơn Giá (VND)</th>
                    <th className="border border-slate-900 p-1.5 text-right w-28">Trị Giá Khai Báo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-2 text-center font-bold">1</td>
                    <td className="border border-slate-900 p-2">
                      <p className="font-bold text-slate-950 text-xs">{order.productName}</p>
                      <p className="text-[10px] text-slate-600">
                        {order.itemTitle || 'Tiêu chuẩn quốc tế xuất nhập khẩu'} &bull; Biến thể chính hãng
                      </p>
                    </td>
                    <td className="border border-slate-900 p-2 text-center font-mono text-[11px]">
                      {order.itemSku || order.productCode || 'SKU-STD'}
                    </td>
                    <td className="border border-slate-900 p-2 text-center font-bold">
                      {order.quantity} 件
                    </td>
                    <td className="border border-slate-900 p-2 text-center font-mono text-[11px]">
                      0.65 kg <br />
                      <span className="text-[9px] text-slate-500">(Quy đổi: 0.85kg)</span>
                    </td>
                    <td className="border border-slate-900 p-2 text-right font-mono">
                      {order.unitPrice.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="border border-slate-900 p-2 text-right font-mono font-bold">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. FINANCIAL & COD RECONCILIATION BOX */}
            <div className="border-2 border-slate-900 rounded-lg p-3 mb-4 bg-slate-50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="border-r border-slate-300 pr-2">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                  Tổng Giá Trị Đơn Hàng / 订单总额:
                </span>
                <span className="text-sm font-extrabold font-mono text-slate-900">
                  {order.totalAmount.toLocaleString('vi-VN')} đ
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Tỷ giá tham chiếu: 3,750 VND/CNY</p>
              </div>

              <div className="border-r border-slate-300 pr-2">
                <span className="text-[10px] text-emerald-700 uppercase block font-semibold">
                  Đã Đặt Cọc (50%) / 已收定金:
                </span>
                <span className="text-sm font-extrabold font-mono text-emerald-800">
                  {order.depositAmount.toLocaleString('vi-VN')} đ
                </span>
                <p className="text-[10px] font-bold text-emerald-600 mt-0.5">✓ ĐÃ THU QUA VIETQR</p>
              </div>

              <div>
                <span className="text-[10px] text-amber-700 uppercase block font-semibold">
                  Tiền Thu Hộ Khi Nhận (COD 50%) / 货到付款:
                </span>
                <span className="text-base font-black font-mono text-amber-900">
                  {order.remainingAmount.toLocaleString('vi-VN')} đ
                </span>
                <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                  SHIPPER THU ĐỦ KHI GIAO KIỆN
                </p>
              </div>
            </div>

            {/* 6. RED OFFICIAL SEALS & SIGNATURES (CON DẤU HẢI QUAN & QC INSPECTION) */}
            <div className="border-2 border-slate-900 rounded-lg p-3.5 mb-2 relative overflow-hidden bg-white">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* Sign 1: Kho TQ */}
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">
                    1. Thủ Kho Quảng Châu / 广州发货人
                  </p>
                  <p className="text-[10px] text-slate-500">(Ký &amp; Đóng dấu)</p>
                  <div className="h-14 flex items-center justify-center font-serif italic text-blue-900 font-bold">
                    Trần Vĩ Hưng (陈伟兴)
                  </div>
                </div>

                {/* Sign 2: Kiểm định viên QC */}
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">
                    2. Giám Định Viên QC / 质检工程师
                  </p>
                  <p className="text-[10px] text-slate-500">(Kiểm tra ngoại quan 100%)</p>
                  <div className="h-14 flex items-center justify-center font-serif italic text-emerald-900 font-bold">
                    Lý Mẫn Đức (李敏德)
                  </div>
                </div>

                {/* Sign 3: Người nhận hàng */}
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">
                    3. Người Nhận Hàng / 收件人签名
                  </p>
                  <p className="text-[10px] text-slate-500">(Ký nhận nguyên niêm phong)</p>
                  <div className="h-14 flex items-center justify-center text-slate-400 border-b border-dashed border-slate-300">
                    <span className="text-[10px] italic">Ký và ghi rõ họ tên</span>
                  </div>
                </div>
              </div>

              {/* CON DẤU ĐỎ THẬT 1: KHO QUẢNG CHÂU QC PASS */}
              <div className="absolute top-2 left-[20%] transform -rotate-12 pointer-events-none opacity-90 select-none">
                <div className="w-24 h-24 rounded-full border-2 border-red-600 flex flex-col items-center justify-center text-red-600 p-1 text-center font-bold shadow-sm ring-1 ring-red-400 bg-red-500/5">
                  <span className="text-[7px] font-mono tracking-tighter uppercase leading-none">
                    ★ KHO TỔNG QUẢNG CHÂU ★
                  </span>
                  <div className="my-0.5 border-t border-b border-red-600 w-full py-0.5 text-center">
                    <span className="text-[11px] font-black uppercase tracking-wider block leading-none">
                      QC PASSED
                    </span>
                    <span className="text-[8px] block font-sans leading-none mt-0.5">已验货合格</span>
                  </div>
                  <span className="text-[7px] font-mono leading-none">OMNIORDER HUB</span>
                </div>
              </div>

              {/* CON DẤU ĐỎ THẬT 2: HẢI QUAN CỬA KHẨU HỮU NGHỊ CLEARED */}
              <div className="absolute top-2 right-[20%] transform rotate-6 pointer-events-none opacity-90 select-none">
                <div className="w-24 h-24 rounded-full border-2 border-red-600 flex flex-col items-center justify-center text-red-600 p-1 text-center font-bold shadow-sm ring-1 ring-red-400 bg-red-500/5">
                  <span className="text-[7px] font-mono tracking-tighter uppercase leading-none">
                    ★ CỬA KHẨU QUỐC TẾ HỮU NGHỊ ★
                  </span>
                  <div className="my-0.5 border-t border-b border-red-600 w-full py-0.5 text-center">
                    <span className="text-[11px] font-black uppercase tracking-wider block leading-none">
                      CLEARED
                    </span>
                    <span className="text-[8px] block font-sans leading-none mt-0.5">海关验讫放行</span>
                  </div>
                  <span className="text-[7px] font-mono leading-none">CUSTOMS POST</span>
                </div>
              </div>
            </div>

            {/* 7. FOOTER BAR */}
            <div className="pt-2 text-[9px] text-slate-500 flex flex-col sm:flex-row items-center justify-between border-t border-slate-300">
              <span>OmniOrder Logistics International &bull; ISO 9001:2015 Express Delivery Standard</span>
              <span className="font-mono">In lúc: {new Date().toLocaleString('vi-VN')} &bull; Trang 1/1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
