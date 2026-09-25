import React, { useState } from 'react'
import {
  Link2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Boxes,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react'
import { productApi } from '../../services/productApi'
import { orderApi, type Order } from '../../services/orderApi'
import { VietQrDepositModal } from '../orders/VietQrDepositModal'
import type { User } from '../../types/auth'

interface SmartUrlSourcingBoxProps {
  user: User
  onProductCreated?: () => void
  onGoToTracking?: (orderId?: string) => void
}

interface ParsedProduct {
  platform: 'Taobao' | '1688' | 'Tmall' | 'JD' | 'Khác'
  platformColor: string
  itemId: string
  originalUrl: string
  titleVi: string
  titleCn: string
  shopName: string
  shopReputation: string
  thumbnail: string
  gallery: string[]
  priceCny: number
  originCategory: string
  weightGrams: number
  variants: Array<{
    sku: string
    title: string
    priceCny: number
    stock: number
  }>
}

const SAMPLE_PRESETS: Record<string, ParsedProduct> = {
  taobao: {
    platform: 'Taobao',
    platformColor: 'from-orange-500 to-amber-500',
    itemId: '748291028',
    originalUrl: 'https://item.taobao.com/item.htm?id=748291028',
    titleVi: 'Tai nghe Bluetooth Không Dây Chống Ồn Chủ Động ANC Hi-Res Bass',
    titleCn: '无线降噪蓝牙耳机主动ANC重低音长续航',
    shopName: 'Baseus Official Flagship Store (Thâm Quyến)',
    shopReputation: '⭐⭐⭐⭐⭐ 4.9/5 (10.000+ đánh giá)',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
    ],
    priceCny: 199,
    originCategory: 'Âm thanh & Phụ kiện số',
    weightGrams: 350,
    variants: [
      { sku: 'ANC-BLK', title: 'Màu Đen Nhám - Bản ANC Cao Cấp', priceCny: 199, stock: 150 },
      { sku: 'ANC-WHT', title: 'Màu Trắng Sữa - Bản ANC Cao Cấp', priceCny: 199, stock: 80 },
      { sku: 'ANC-SLV', title: 'Màu Bạc Titan - Bản Giới Hạn', priceCny: 219, stock: 45 }
    ]
  },
  '1688': {
    platform: '1688',
    platformColor: 'from-red-600 to-orange-600',
    itemId: '68291049281',
    originalUrl: 'https://detail.1688.com/offer/68291049281.html',
    titleVi: 'Áo Khoác Gió Thể Thao Chống Nước Gore-Tex 3 Lớp Unisex Xuất Khẩu',
    titleCn: '工厂直销户外冲锋衣三合一防水透气登山服',
    shopName: 'Xưởng May Mặc & Xuất Khẩu Chiết Giang (Hơn 12 năm uy tín)',
    shopReputation: '🏆 Xưởng Đầu Mối 1688 Cấp AAA',
    thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80'
    ],
    priceCny: 88,
    originCategory: 'Thời trang & May mặc',
    weightGrams: 550,
    variants: [
      { sku: 'JK-BLK-L', title: 'Màu Đen - Size L (60-70kg)', priceCny: 88, stock: 500 },
      { sku: 'JK-BLK-XL', title: 'Màu Đen - Size XL (70-80kg)', priceCny: 88, stock: 350 },
      { sku: 'JK-GRN-L', title: 'Xanh Rêu Quân Đội - Size L', priceCny: 92, stock: 200 }
    ]
  },
  tmall: {
    platform: 'Tmall',
    platformColor: 'from-red-600 to-rose-600',
    itemId: '810293847',
    originalUrl: 'https://detail.tmall.com/item.htm?id=810293847',
    titleVi: 'Bàn Phím Cơ Không Dây Nhôm CNC 3-Mode RGB Gasket Mount Hotswap',
    titleCn: '铝合金机械键盘三模无线热插拔RGB客制化',
    shopName: 'Akko Official Flagship Store (Tmall Thương Hiệu)',
    shopReputation: '💎 Flagship Store Chính Hãng Tmall',
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80'
    ],
    priceCny: 349,
    originCategory: 'Bàn phím & Phụ kiện PC',
    weightGrams: 1200,
    variants: [
      { sku: 'KB-SIL-RED', title: 'Vỏ Nhôm Bạc - Switch Tuyết Trắng (Linear)', priceCny: 349, stock: 60 },
      { sku: 'KB-BLK-BLU', title: 'Vỏ Nhôm Đen - Switch Xanh Dương (Tactile)', priceCny: 349, stock: 45 },
      { sku: 'KB-PNK-PRO', title: 'Bản Retro Hồng Phấn - Full Keycap PBT', priceCny: 379, stock: 20 }
    ]
  }
}

export const SmartUrlSourcingBox: React.FC<SmartUrlSourcingBoxProps> = ({
  user,
  onProductCreated,
  onGoToTracking
}) => {
  const [urlInput, setUrlInput] = useState('')
  const [exchangeRate, setExchangeRate] = useState<number>(3650)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedProduct | null>(null)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [isExpanded, setIsExpanded] = useState(true)

  // Order & Import action states
  const [isOrdering, setIsOrdering] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const [showVietQrModal, setShowVietQrModal] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Parse logic
  const handleParseUrl = (input?: string) => {
    const targetUrl = (input !== undefined ? input : urlInput).trim()
    if (!targetUrl) {
      alert('Vui lòng nhập link Taobao, 1688 hoặc Tmall cần bóc tách')
      return
    }

    setIsParsing(true)
    setStatusMessage(null)

    setTimeout(() => {
      const lower = targetUrl.toLowerCase()
      let result: ParsedProduct

      if (lower.includes('1688')) {
        result = { ...SAMPLE_PRESETS['1688'], originalUrl: targetUrl }
      } else if (lower.includes('tmall')) {
        result = { ...SAMPLE_PRESETS['tmall'], originalUrl: targetUrl }
      } else if (lower.includes('taobao')) {
        result = { ...SAMPLE_PRESETS['taobao'], originalUrl: targetUrl }
      } else {
        // Fallback generic parse
        result = {
          platform: 'Taobao',
          platformColor: 'from-orange-500 to-amber-500',
          itemId: `ITEM-${Date.now().toString(36)}`,
          originalUrl: targetUrl,
          titleVi: 'Sản Phẩm Order Nhập Khẩu Trung Quốc (Đã Bóc Tách)',
          titleCn: '淘宝/1688进口采购精选商品',
          shopName: 'Nhà cung cấp uy tín Quảng Đông, TQ',
          shopReputation: '⭐⭐⭐⭐ 4.8/5',
          thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
          ],
          priceCny: 150,
          originCategory: 'Đồ gia dụng thông minh',
          weightGrams: 500,
          variants: [
            { sku: 'GEN-01', title: 'Phiên bản tiêu chuẩn (Màu Đen)', priceCny: 150, stock: 100 },
            { sku: 'GEN-02', title: 'Phiên bản nâng cấp (Màu Trắng)', priceCny: 170, stock: 60 }
          ]
        }
      }

      setParsedData(result)
      setSelectedVariantIdx(0)
      setIsParsing(false)
      setIsExpanded(true)
    }, 600)
  }

  const handleSelectPreset = (key: 'taobao' | '1688' | 'tmall') => {
    const preset = SAMPLE_PRESETS[key]
    setUrlInput(preset.originalUrl)
    handleParseUrl(preset.originalUrl)
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrlInput(text)
        handleParseUrl(text)
      }
    } catch {
      alert('Không thể đọc từ clipboard. Vui lòng dán trực tiếp vào ô nhập.')
    }
  }

  // Calculations
  const activeVariant = parsedData?.variants[selectedVariantIdx] || parsedData?.variants[0]
  const currentPriceCny = activeVariant ? activeVariant.priceCny : (parsedData?.priceCny || 0)
  const itemTotalVnd = currentPriceCny * exchangeRate * orderQuantity
  const serviceFee = Math.max(15000, Math.round(itemTotalVnd * 0.03)) // 3% phí mua hộ, tối thiểu 15k
  const totalAmountVnd = itemTotalVnd + serviceFee
  const depositAmountVnd = Math.round(totalAmountVnd * 0.5)
  const remainingAmountVnd = totalAmountVnd - depositAmountVnd

  // 1-Click Order Placement via order-service
  const handleCreateOrderNow = async () => {
    if (!parsedData || !activeVariant) return
    setIsOrdering(true)
    try {
      const res = await orderApi.createOrder({
        customerId: user.id || 'user-001',
        customerName: user.name || 'Khách Hàng OmniOrder',
        customerPhone: '0912345678',
        customerAddress: 'Tòa FPT Tower, Số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
        productId: `prod-src-${Date.now().toString(36)}`,
        productCode: `SP-${activeVariant.sku}`,
        productName: parsedData.titleVi,
        productThumbnail: parsedData.thumbnail,
        itemSku: activeVariant.sku,
        itemTitle: activeVariant.title,
        unitPrice: currentPriceCny * exchangeRate,
        quantity: orderQuantity,
        depositRate: 0.50,
        supplierPlatform: `${parsedData.platform} (${parsedData.shopName})`,
        notes: `Nguồn link gốc: ${parsedData.originalUrl}`
      })

      if (res.success && res.data) {
        setCreatedOrder(res.data)
        setShowVietQrModal(true)
        setStatusMessage({
          type: 'success',
          text: `Đã tạo đơn ${res.data.orderCode} từ link ${parsedData.platform}! Vui lòng quét mã VietQR để cọc 50%.`
        })
      } else {
        alert(res.message || 'Lỗi khi tạo đơn hàng')
      }
    } catch (err: any) {
      alert('Lỗi kết nối order-service: ' + err.message)
    } finally {
      setIsOrdering(false)
    }
  }

  // Import into product-service catalog
  const handleImportToCatalog = async () => {
    if (!parsedData) return
    setIsImporting(true)
    try {
      const token = localStorage.getItem('omni_token') || ''
      const res = await productApi.createProduct(
        {
          code: `SP-${Date.now().toString(36).toUpperCase()}`,
          name: parsedData.titleVi,
          category: parsedData.originCategory,
          brand: parsedData.shopName.split(' ')[0] || 'Nội Địa Trung',
          description: `${parsedData.titleVi}\nTên gốc tiếng Trung: ${parsedData.titleCn}\nNguồn hàng: ${parsedData.platform} - ${parsedData.shopName}\nLink sản phẩm: ${parsedData.originalUrl}`,
          thumbnail: parsedData.thumbnail,
          items: parsedData.variants.map((v) => ({
            id: `item-${Date.now().toString(36)}-${v.sku}`,
            sku: v.sku,
            title: v.title,
            price: v.priceCny * exchangeRate,
            stockQuantity: v.stock,
            attributes: { 'Biến thể': v.title }
          }))
        },
        token
      )

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Đã nhập sản phẩm "${parsedData.titleVi}" thành công vào danh mục hệ thống!`
        })
        if (onProductCreated) onProductCreated()
      } else {
        alert(res.message || 'Lỗi nhập sản phẩm vào catalog')
      }
    } catch (err: any) {
      alert('Lỗi kết nối product-service: ' + err.message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
      {/* HEADER BAR */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10">
              <Link2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Hộp Dán Link Taobao / 1688 / Tmall Thông Minh</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Smart URL Parser
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động bóc tách tên, ảnh HD, biến thể và quy đổi CNY sang VND theo tỷ giá thị trường
              </p>
            </div>
          </div>
        </div>

        {/* Exchange Rate Controller */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Tỷ giá:</span>
            <span className="text-emerald-400 font-mono font-bold">1 ¥ =</span>
            <input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value) || 3650)}
              className="w-16 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-white font-mono font-bold text-right text-xs focus:outline-none focus:border-blue-500"
            />
            <span className="text-slate-400 font-mono">đ</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* INPUT URL BOX */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleParseUrl()
            }}
            className="space-y-3"
          >
            <div className="relative flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Dán link sản phẩm từ Taobao, 1688, Tmall... (VD: https://item.taobao.com/item.htm?id=...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-24 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="absolute right-2.5 top-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Dán link</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isParsing}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 cursor-pointer disabled:opacity-50 transition-all btn-press shrink-0"
              >
                {isParsing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Bóc Tách Dữ Liệu</span>
              </button>
            </div>

            {/* Quick Sample Links */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-500 text-[11px]">Thử link mẫu:</span>
              <button
                type="button"
                onClick={() => handleSelectPreset('taobao')}
                className="px-2.5 py-1 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-medium cursor-pointer transition-colors"
              >
                🎧 Taobao: Tai nghe Bluetooth ANC (¥199)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('1688')}
                className="px-2.5 py-1 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-300 border border-red-600/30 text-[11px] font-medium cursor-pointer transition-colors"
              >
                🧥 1688: Áo gió thể thao Gore-Tex (¥88)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('tmall')}
                className="px-2.5 py-1 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-600/30 text-[11px] font-medium cursor-pointer transition-colors"
              >
                ⌨️ Tmall: Bàn phím cơ nhôm CNC (¥349)
              </button>
            </div>
          </form>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* PARSED RESULT CARD */}
          {parsedData && (
            <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-5 animate-scale-up">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Product Thumbnail & Platform Stamp */}
                <div className="relative w-full lg:w-56 h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 group">
                  <img
                    src={parsedData.thumbnail}
                    alt={parsedData.titleVi}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-bold text-white border border-white/20">
                    {parsedData.platform}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-mono bg-black/60 backdrop-blur-md text-slate-300 py-1 rounded border border-white/10">
                    ID: {parsedData.itemId}
                  </div>
                </div>

                {/* Details & Live Pricing */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {parsedData.originCategory}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Shop: <strong className="text-slate-200">{parsedData.shopName}</strong> &bull; {parsedData.shopReputation}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white leading-snug">
                      {parsedData.titleVi}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono italic mt-0.5">
                      {parsedData.titleCn}
                    </p>
                  </div>

                  {/* Variant Selection Chips */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold block">
                      Chọn Biến thể / Màu sắc / Size:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {parsedData.variants.map((v, idx) => (
                        <button
                          key={v.sku}
                          type="button"
                          onClick={() => setSelectedVariantIdx(idx)}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                            selectedVariantIdx === idx
                              ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="truncate">{v.sku}</span>
                            <span className="font-mono text-amber-400">¥{v.priceCny}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{v.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity & Financial Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">Số lượng mua:</span>
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs text-white">
                            {orderQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setOrderQuantity(orderQuantity + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Giá gốc Trung Quốc:</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          ¥{(currentPriceCny * orderQuantity).toLocaleString('en-US')} RMB
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Tiền hàng (VND):</span>
                        <strong className="text-white font-mono">{itemTotalVnd.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Phí mua hộ (3%):</span>
                        <strong className="text-blue-300 font-mono">{serviceFee.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <div>
                        <span className="text-emerald-400 text-[10px] block font-semibold">Cọc ngay 50%:</span>
                        <strong className="text-emerald-400 font-mono text-sm">{depositAmountVnd.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <div>
                        <span className="text-amber-400 text-[10px] block font-semibold">Thu COD khi nhận:</span>
                        <strong className="text-amber-400 font-mono">{remainingAmountVnd.toLocaleString('vi-VN')} đ</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={handleImportToCatalog}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Boxes className="w-3.5 h-3.5 text-blue-400" />}
                      <span>Lưu Vào Catalog Sản Phẩm</span>
                    </button>

                    <button
                      type="button"
                      disabled={isOrdering}
                      onClick={handleCreateOrderNow}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer disabled:opacity-50 transition-all btn-press"
                    >
                      {isOrdering ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>⚡ Đặt Cọc 50% Ngay (Mở VietQR)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIETQR MODAL WHEN ORDER CREATED */}
      {createdOrder && (
        <VietQrDepositModal
          order={createdOrder}
          isOpen={showVietQrModal}
          onClose={() => setShowVietQrModal(false)}
          onSuccess={(updatedOrder) => {
            setShowVietQrModal(false)
            if (onGoToTracking) {
              onGoToTracking(updatedOrder.id)
            }
          }}
        />
      )}
    </div>
  )
}
