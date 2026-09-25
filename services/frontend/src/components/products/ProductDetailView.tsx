import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Boxes,
  Tag,
  Star,
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Trash2,
  ShoppingBag,
  ShoppingCart,
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  PackageCheck,
  Plus,
  Minus,
  Save,
  Compass
} from 'lucide-react'
import { productApi, type Product, type ProductItem } from '../../services/productApi'
import { orderApi, type Order } from '../../services/orderApi'
import { VietQrDepositModal } from '../orders/VietQrDepositModal'
import type { User } from '../../types/auth'

interface ProductDetailViewProps {
  productId: string
  user: User
  onBack: () => void
  onProductDeleted?: () => void
  onGoToTracking?: (orderId?: string) => void
}

type TabType = 'items' | 'specs' | 'codes' | 'database'

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  user,
  onBack,
  onProductDeleted,
  onGoToTracking
}) => {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('items')

  // Stock edit state
  const [isEditingStock, setIsEditingStock] = useState<boolean>(false)
  const [newStockValue, setNewStockValue] = useState<number>(0)
  const [isUpdatingStock, setIsUpdatingStock] = useState<boolean>(false)

  // Order quantity & cross-border checkout
  const [orderQuantity, setOrderQuantity] = useState<number>(1)
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false)
  const [customerName, setCustomerName] = useState<string>(user.name || 'Nguyễn Đình Hùng')
  const [customerPhone, setCustomerPhone] = useState<string>('0912345678')
  const [customerAddress, setCustomerAddress] = useState<string>('Tòa FPT Tower, Số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội')
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const [showQrModal, setShowQrModal] = useState<boolean>(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Code lookup test state
  const [lookupTestCode, setLookupTestCode] = useState<string>('')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [isTestingLookup, setIsTestingLookup] = useState<boolean>(false)

  // Edit product modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editCode, setEditCode] = useState('')
  const [editName, setEditName] = useState('')
  const [editBrand, setEditBrand] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editThumbnail, setEditThumbnail] = useState('')
  const [isSavingProduct, setIsSavingProduct] = useState(false)

  const canManage = user.role === 'admin' || user.role === 'manager'

  const loadProduct = async () => {
    setIsLoading(true)
    setError(null)
    const data = await productApi.getProductById(productId)
    if (!data) {
      setError('Không tìm thấy thông tin sản phẩm hoặc sản phẩm đã bị xóa.')
      setIsLoading(false)
      return
    }

    setProduct(data)
    if (data.items && data.items.length > 0) {
      // Giữ variant đang chọn nếu vẫn tồn tại, hoặc chọn cái đầu tiên
      setSelectedItem((prev) => {
        const found = data.items.find((i) => i.id === prev?.id)
        return found || data.items[0]
      })
      setNewStockValue(data.items[0].stockQuantity)
    }

    // Gán dữ liệu form edit
    setEditCode(data.code || '')
    setEditName(data.name)
    setEditBrand(data.brand)
    setEditCategory(data.category)
    setEditDescription(data.description)
    setEditThumbnail(data.thumbnail)

    setIsLoading(false)
  }

  // Thử nghiệm tra cứu nhanh qua mã code
  const handleTestLookup = async (codeToTest?: string) => {
    const target = codeToTest || lookupTestCode
    if (!target) return
    setIsTestingLookup(true)
    setLookupTestCode(target)
    const res = await productApi.lookupByCode(target)
    setLookupResult(res)
    setIsTestingLookup(false)
  }

  useEffect(() => {
    loadProduct()
  }, [productId])

  useEffect(() => {
    if (selectedItem) {
      setNewStockValue(selectedItem.stockQuantity)
    }
  }, [selectedItem])

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text })
    setTimeout(() => setActionMessage(null), 4000)
  }

  // Cập nhật tồn kho SKU trực tiếp vào PostgreSQL (ecommerce_product_db)
  const handleUpdateStock = async () => {
    if (!product || !selectedItem) return
    setIsUpdatingStock(true)
    const token = localStorage.getItem('omni_token') || ''
    const res = await productApi.updateItemStock(product.id, selectedItem.id, newStockValue, token)

    if (res.success) {
      showNotification('success', `Đã cập nhật tồn kho SKU [${selectedItem.sku}] thành ${newStockValue} chiếc!`)
      setIsEditingStock(false)
      // Cập nhật state local
      setSelectedItem((prev) => (prev ? { ...prev, stockQuantity: newStockValue } : null))
      setProduct((prev) => {
        if (!prev) return null
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === selectedItem.id ? { ...i, stockQuantity: newStockValue } : i
          )
        }
      })
    } else {
      showNotification('error', res.message || 'Lỗi khi cập nhật tồn kho')
    }
    setIsUpdatingStock(false)
  }

  // Cập nhật thông tin sản phẩm
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    setIsSavingProduct(true)
    const token = localStorage.getItem('omni_token') || ''
    const res = await productApi.updateProduct(
      product.id,
      {
        code: editCode ? editCode.trim().toUpperCase() : undefined,
        name: editName,
        brand: editBrand,
        category: editCategory,
        description: editDescription,
        thumbnail: editThumbnail
      },
      token
    )

    if (res.success && res.data) {
      showNotification('success', 'Đã lưu cập nhật thông tin sản phẩm và mã code thành công!')
      setShowEditModal(false)
      setProduct((prev) => (prev ? { ...prev, ...res.data } : res.data!))
    } else {
      showNotification('error', res.message || 'Lỗi khi lưu thông tin sản phẩm')
    }
    setIsSavingProduct(false)
  }

  // Xóa sản phẩm
  const handleDeleteProduct = async () => {
    if (!product) return
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${product.name}" khỏi hệ thống?`)) {
      return
    }

    const token = localStorage.getItem('omni_token') || ''
    const success = await productApi.deleteProduct(product.id, token)
    if (success) {
      alert('Đã xóa sản phẩm thành công!')
      if (onProductDeleted) onProductDeleted()
      onBack()
    } else {
      showNotification('error', 'Không thể xóa sản phẩm. Vui lòng kiểm tra lại quyền hạn.')
    }
  }

  // Tạo đơn hàng Order Trung Quốc qua order-service (:8004)
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !selectedItem) return
    setIsCreatingOrder(true)
    try {
      const res = await orderApi.createOrder({
        customerId: user.id || 'user-001',
        customerName,
        customerPhone,
        customerAddress,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        productThumbnail: product.thumbnail,
        itemSku: selectedItem.sku,
        itemTitle: selectedItem.title,
        unitPrice: selectedItem.price,
        quantity: orderQuantity,
        depositRate: product.depositRate || 0.50,
        supplierPlatform: product.supplierPlatform || 'Taobao / 1688'
      })

      if (res.success && res.data) {
        setCreatedOrder(res.data)
        setShowOrderModal(false)
        setShowQrModal(true)
        showNotification('success', `Đã tạo đơn ${res.data.orderCode}! Vui lòng quét mã VietQR để cọc 50%.`)
      } else {
        showNotification('error', res.message || 'Lỗi khi tạo đơn hàng')
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Lỗi kết nối order-service')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
        <h3 className="text-base font-semibold text-white">Đang tải chi tiết sản phẩm & biến thể SKU...</h3>
        <p className="text-xs text-slate-400 font-mono">product-service:8003 &bull; database: ecommerce_product_db</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Không tìm thấy sản phẩm</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Danh sách Sản phẩm</span>
        </button>
      </div>
    )
  }

  // Giá và tồn kho của SKU đang chọn hoặc fallback
  const currentPrice = selectedItem ? selectedItem.price : product.items[0]?.price || 0
  const currentOriginal = selectedItem ? selectedItem.originalPrice : product.items[0]?.originalPrice
  const currentStock = selectedItem ? selectedItem.stockQuantity : product.items.reduce((s, i) => s + i.stockQuantity, 0)
  const totalStockAllItems = product.items.reduce((s, i) => s + i.stockQuantity, 0)

  return (
    <div className="space-y-6 pb-16 animate-fade-in-up">
      {/* 1. TOP NAVIGATION & BREADCRUMB BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-2 text-xs font-semibold border border-slate-700 cursor-pointer shadow-sm group btn-press"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Quay lại danh sách</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Breadcrumb text */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 flex-wrap">
            <span
              onClick={onBack}
              className="hover:text-blue-400 cursor-pointer transition-colors"
            >
              Sản phẩm & Mặt hàng
            </span>
            <span>/</span>
            <span className="text-slate-300">{product.category}</span>
            <span>/</span>
            <span className="text-white font-bold truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadProduct}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs border border-slate-700 cursor-pointer transition-colors"
            title="Tải lại dữ liệu từ product-service"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canManage && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 text-xs font-semibold border border-blue-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>

              <button
                onClick={handleDeleteProduct}
                className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium animate-fadeIn ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 2. MAIN PRODUCT HERO SHOWCASE (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Large Square Image Showcase & Specs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl group">
            {/* Aspect Square Image */}
            <div className="aspect-square w-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
              <img
                src={product.thumbnail}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-blue-300 border border-blue-500/30 flex items-center gap-1.5 shadow-lg">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  {product.brand}
                </span>

                {currentOriginal && currentOriginal > currentPrice && (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-600 text-white shadow-lg shadow-rose-600/40 w-fit">
                    -{Math.round(((currentOriginal - currentPrice) / currentOriginal) * 100)}%
                  </span>
                )}
              </div>

              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md border shadow-lg flex items-center gap-1.5 ${
                    currentStock > 15
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : currentStock > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentStock > 15 ? 'bg-emerald-400' : currentStock > 0 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                  />
                  {currentStock > 0 ? `Tồn kho: ${currentStock}` : 'Hết hàng'}
                </span>
              </div>

              {/* Bottom image overlay stats */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-xs text-slate-300 font-mono bg-slate-950/70 backdrop-blur-md p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold">{product.rating.toFixed(1)} / 5.0</span>
                </div>
                <div>
                  <span>Đã bán: </span>
                  <strong className="text-white">{product.totalSales}</strong>
                </div>
                <div>
                  <span>Tổng SKU: </span>
                  <strong className="text-purple-400">{product.items.length}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Microservices Metadata Quick Card */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Cơ sở dữ liệu:
              </span>
              <span className="font-mono text-emerald-400 font-bold">ecommerce_product_db</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Dịch vụ quản trị:
              </span>
              <span className="font-mono text-blue-400 font-bold">product-service (:8003)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mã sản phẩm (Code):</span>
              <span className="font-mono text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                {product.code}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-cyan-400" />
                Bảng lưu mã code:
              </span>
              <span className="font-mono text-cyan-400 font-bold">product_codes ({product.codes?.length || 0} mã)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mã định danh sản phẩm:</span>
              <span className="font-mono text-slate-300">{product.id}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Thời gian tạo:</span>
              <span className="font-mono text-slate-300">
                {new Date(product.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Details, SKU Variant Selector & Purchase / Inventory Console (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Title & Categories */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Mã SP: {product.code}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {product.category}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Thương hiệu: {product.brand}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Trạng thái: {product.status === 'active' ? 'Đang kinh doanh' : 'Tạm dừng'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                {product.name}
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
                {product.description}
              </p>
            </div>

            {/* Dynamic Price Display */}
            <div className="pt-4 border-t border-slate-800/80 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                {currentPrice.toLocaleString('vi-VN')} đ
              </span>
              {currentOriginal && currentOriginal > currentPrice && (
                <span className="text-base sm:text-lg text-slate-500 line-through font-mono">
                  {currentOriginal.toLocaleString('vi-VN')} đ
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono ml-auto">
                (Đã bao gồm VAT &bull; Đơn giá áp dụng cho SKU đang chọn)
              </span>
            </div>

            {/* CHÍNH SÁCH ORDER TRUNG QUỐC & TIỀN CỌC 50% */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-blue-950/40 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    🇨🇳 Cơ chế Bán hàng: Order Hàng Nội Địa Trung Quốc
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Thời gian về VN: {product.estimatedDays || '7 - 14 ngày'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tiền đặt cọc trước (50%):</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                        Cọc kích hoạt đơn
                      </span>
                    </div>
                    <p className="text-lg font-black text-emerald-400 font-mono">
                      {Math.round(currentPrice * (product.depositRate || 0.5)).toLocaleString('vi-VN')} đ
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Thanh toán khi chốt đặt đơn để shop Trung xuất kho
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Còn lại thanh toán khi nhận (50%):</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        Thu COD tận nơi
                      </span>
                    </div>
                    <p className="text-lg font-black text-amber-400 font-mono">
                      {Math.round(currentPrice * (1 - (product.depositRate || 0.5))).toLocaleString('vi-VN')} đ
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Kiểm tra kiện hàng xong mới thanh toán cho shipper tại VN
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                  <span>Nguồn hàng: <strong>{product.supplierPlatform || 'Taobao / 1688 / Tmall'}</strong></span>
                  <span>Đóng kiện & Vận chuyển: <strong>Kho Quảng Châu ➔ Cửa khẩu Hữu Nghị ➔ Kho VN</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* SKU VARIANTS SELECTOR (Mặt hàng / Phiên bản) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Chọn Mặt hàng & Biến thể SKU ({product.items.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                Tổng kho toàn bộ: {totalStockAllItems} chiếc
              </span>
            </div>

            {/* Visual Variant Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.items.map((item) => {
                const isSelected = selectedItem?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden btn-press ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/15'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-blue-600 rounded-bl-2xl flex items-center justify-center text-white shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between pr-6">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {item.sku}
                        </span>
                        <span
                          className={`text-xs font-mono font-semibold ${
                            item.stockQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          Kho: {item.stockQuantity}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-2">{item.title}</h4>

                      {/* Attributes */}
                      {item.attributes && Object.keys(item.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(item.attributes).map(([k, v]) => (
                            <span
                              key={k}
                              className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                            >
                              {k}: <strong className="text-slate-200">{v}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {item.price.toLocaleString('vi-VN')} đ
                      </span>
                      {item.barcode && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-500" />
                          {item.barcode}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Currently Active SKU Summary & Admin Inventory Tool */}
            {selectedItem && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Đang chọn: </span>
                    <strong className="text-white">{selectedItem.title}</strong>
                    <span className="text-blue-400 font-mono ml-2">({selectedItem.sku})</span>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => setIsEditingStock(!isEditingStock)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                    >
                      <PackageCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isEditingStock ? 'Đóng chỉnh sửa kho' : 'Điều chỉnh tồn kho'}</span>
                    </button>
                  )}
                </div>

                {/* Stock Edit Panel */}
                {isEditingStock && canManage && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-blue-500/30 flex items-center justify-between gap-3 animate-fadeIn flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">Số lượng tồn kho mới:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setNewStockValue((prev) => Math.max(0, prev - 5))}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center cursor-pointer"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewStockValue((prev) => Math.max(0, prev - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center cursor-pointer"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={newStockValue}
                          onChange={(e) => setNewStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono font-bold text-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setNewStockValue((prev) => prev + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewStockValue((prev) => prev + 5)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center cursor-pointer"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isUpdatingStock}
                      onClick={handleUpdateStock}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      {isUpdatingStock ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Lưu vào DB</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ORDER & CART SIMULATION CONSOLE */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <span>Đặt hàng & Thử nghiệm Luồng Order</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                order-service &bull; Port :8004
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Số lượng mua:</span>
                <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
                  <button
                    onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-white text-xs">
                    {orderQuantity}
                  </span>
                  <button
                    onClick={() => setOrderQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={orderQuantity >= currentStock}
                    className="p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Tạm tính đơn hàng: </span>
                <span className="text-xl font-black text-emerald-400 font-mono ml-2">
                  {(currentPrice * orderQuantity).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  showNotification(
                    'success',
                    `Đã thêm ${orderQuantity}x [${selectedItem?.sku || product.name}] vào giỏ hàng thành công!`
                  )
                }}
                disabled={currentStock <= 0}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer btn-press"
              >
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Thêm vào Giỏ hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOrderModal(true)}
                disabled={currentStock <= 0}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer btn-press"
              >
                <Sparkles className="w-4 h-4" />
                <span>Đặt hàng ngay (Tạo Order)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM TABBED DETAILS & DATABASE INSPECTOR */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer whitespace-nowrap btn-press ${
              activeTab === 'items'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Bảng Toàn bộ Mặt hàng SKU ({product.items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer whitespace-nowrap btn-press ${
              activeTab === 'specs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Mô tả & Thông số Kỹ thuật</span>
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer whitespace-nowrap btn-press ${
              activeTab === 'codes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Barcode className="w-4 h-4 text-cyan-400" />
            <span>Tra cứu Mã & Barcode (Bảng product_codes) ({product.codes?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer whitespace-nowrap btn-press ${
              activeTab === 'database'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Dữ liệu PostgreSQL (Microservices Inspector)</span>
          </button>
        </div>

        {/* Tab 1: Detailed Items Table */}
        {activeTab === 'items' && (
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                  <th className="pb-3 pl-2">Mã SKU</th>
                  <th className="pb-3">Tên biến thể mặt hàng</th>
                  <th className="pb-3">Thuộc tính</th>
                  <th className="pb-3">Mã vạch (Barcode)</th>
                  <th className="pb-3">Đơn giá</th>
                  <th className="pb-3">Tồn kho</th>
                  <th className="pb-3 text-right pr-2">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {product.items.map((item) => {
                  const isCur = selectedItem?.id === item.id
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCur ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 pl-2 font-mono font-bold text-blue-400">
                        {item.sku}
                      </td>
                      <td className="py-3.5 font-semibold text-white">
                        {item.title}
                      </td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(item.attributes || {}).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-300"
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-400">
                        {item.barcode || '---'}
                      </td>
                      <td className="py-3.5 font-mono font-bold text-emerald-400">
                        {item.price.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`font-mono px-2 py-0.5 rounded text-xs font-semibold ${
                            item.stockQuantity > 15
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.stockQuantity > 0
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.stockQuantity} chiếc
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setIsEditingStock(true)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-700"
                        >
                          Chọn & Sửa kho
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Specs & Descriptions */}
        {activeTab === 'specs' && (
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mô tả sản phẩm</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500">Danh mục chính</span>
                <p className="text-xs font-bold text-white mt-1">{product.category}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500">Thương hiệu (Brand)</span>
                <p className="text-xs font-bold text-white mt-1">{product.brand}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500">Đường dẫn Slug</span>
                <p className="text-xs font-mono text-blue-400 mt-1">{product.slug}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500">Số lượng biến thể SKU</span>
                <p className="text-xs font-bold text-purple-400 mt-1">{product.items.length} phân loại</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500">Điểm đánh giá trung bình</span>
                <p className="text-xs font-bold text-amber-400 mt-1">⭐ {product.rating.toFixed(1)} / 5.0</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-500">Tổng sản phẩm đã tiêu thụ</span>
                <p className="text-xs font-bold text-emerald-400 mt-1">{product.totalSales} đơn hàng</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tra cứu Mã & Barcode (Bảng product_codes) */}
        {activeTab === 'codes' && (
          <div className="p-6 space-y-6">
            {/* Context Box */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-cyan-400" />
                  <span>Bộ định danh & Tra cứu mã (Bảng product_codes trong PostgreSQL)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Bảng <code className="text-cyan-300 font-mono">product_codes</code> lưu trữ tập trung mã sản phẩm chính, mã phiên bản SKU và mã vạch Barcode máy quét. Khách hàng hoặc thủ kho có thể tìm kiếm sản phẩm bằng bất kỳ mã nào thông qua endpoint <code className="text-emerald-400 font-mono">GET /api/v1/products/lookup/code/:code</code>.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Tổng số mã:</span>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  {product.codes?.length || 0} mã
                </span>
              </div>
            </div>

            {/* Test Interactive Lookup Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span>Thử nghiệm API Tra cứu nhanh qua Mã Code:</span>
              </h5>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={lookupTestCode}
                    onChange={(e) => setLookupTestCode(e.target.value)}
                    placeholder="Nhập mã code cần test (VD: SP-IP16PM, IP16PM-256-NAT, 893850123401)..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleTestLookup()}
                  disabled={!lookupTestCode || isTestingLookup}
                  className="w-full sm:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md shadow-cyan-600/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingLookup ? 'animate-spin' : ''}`} />
                  <span>Tra cứu API</span>
                </button>
              </div>

              {lookupResult && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Kết quả tra cứu khớp trong DB:</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Mã khớp: <strong className="text-cyan-300">{lookupResult.matchedCode?.code}</strong> ({lookupResult.matchedCode?.codeType})
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-3">
                    <span>Sản phẩm: <strong className="text-white">{lookupResult.product?.name}</strong></span>
                    <span>Hãng: <strong className="text-blue-300">{lookupResult.product?.brand}</strong></span>
                    <span>Mã SP chính: <strong className="text-indigo-400 font-mono">{lookupResult.product?.code}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Table of all codes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="pb-3 pl-2">Mã Tra Cứu (Code)</th>
                    <th className="pb-3">Phân Loại Mã</th>
                    <th className="pb-3">Cấp Độ</th>
                    <th className="pb-3">Mô Tả Định Danh</th>
                    <th className="pb-3 text-right pr-2">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {(product.codes && product.codes.length > 0) ? (
                    product.codes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 pl-2 font-bold text-cyan-300 font-mono flex items-center gap-2">
                          <span className="bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                            {c.code}
                          </span>
                        </td>
                        <td className="py-3">
                          {c.codeType === 'PRODUCT_CODE' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                              MÃ SẢN PHẨM (PRODUCT_CODE)
                            </span>
                          )}
                          {c.codeType === 'SKU' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              MÃ SKU PHIÊN BẢN (SKU)
                            </span>
                          )}
                          {c.codeType === 'BARCODE' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              MÃ VẠCH MÁY QUÉT (BARCODE)
                            </span>
                          )}
                          {c.codeType === 'QR_CODE' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              MÃ QR CODE
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {c.isPrimary ? (
                            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 font-sans">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mã chính sản phẩm
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-sans">
                              Mã theo SKU / Biến thể
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-300 font-sans text-xs">
                          {c.description || 'Không có mô tả'}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <button
                            type="button"
                            onClick={() => handleTestLookup(c.code)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-medium transition-colors cursor-pointer"
                          >
                            Tra cứu thử
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                        Chưa có bản ghi nào trong bảng product_codes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Microservices Database Inspector */}
        {activeTab === 'database' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  GET http://localhost:8003/api/v1/products/{product.id}
                </span>
                <span className="text-slate-400">Cơ sở dữ liệu riêng: <strong>ecommerce_product_db</strong></span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Format: JSON Application</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto max-h-96">
              <pre className="text-[11px] font-mono text-blue-300 leading-relaxed">
                {JSON.stringify(product, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CHỈNH SỬA SẢN PHẨM (Dành cho Admin/Manager) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Chỉnh sửa thông tin sản phẩm</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1 flex items-center justify-between">
                    <span>Mã sản phẩm (Code) *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Bảng product_codes</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-indigo-900/60 text-indigo-300 font-mono text-xs uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thương hiệu</label>
                  <input
                    type="text"
                    required
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục</label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Link Ảnh Thumbnail</label>
                <input
                  type="text"
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOCK TẠO ĐƠN HÀNG (ORDER SERVICE CONFIRMATION) */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Xác nhận Đặt hàng</h3>
                  <p className="text-[11px] text-slate-400 font-mono">order-service (:8004)</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {createdOrder ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white">Tạo Đơn Hàng Order Thành Công!</h4>
                  <p className="text-xs text-emerald-300">
                    Mã đơn hàng: <strong className="font-mono text-white text-sm bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-600/50">{createdOrder.orderCode}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tiền đặt cọc (50%):</span>
                    <strong className="text-emerald-400 font-mono text-sm">{createdOrder.depositAmount.toLocaleString('vi-VN')} đ (Đã nhận)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Còn lại thu COD (50%):</span>
                    <strong className="text-amber-400 font-mono text-sm">{createdOrder.remainingAmount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vận đơn nội địa TQ (SF Express):</span>
                    <span className="font-mono text-blue-400 font-bold">{createdOrder.cnTrackingCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời gian dự kiến về VN:</span>
                    <span className="font-bold text-white">{createdOrder.estimatedDeliveryDays}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrderModal(false)
                      setCreatedOrder(null)
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrderModal(false)
                      if (onGoToTracking) {
                        onGoToTracking(createdOrder.id)
                      }
                    }}
                    className="flex-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Theo dõi Kiện hàng ngay</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sản phẩm:</span>
                    <span className="font-bold text-white text-right max-w-[200px] truncate">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Biến thể SKU:</span>
                    <span className="font-mono text-blue-400">{selectedItem?.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số lượng:</span>
                    <span className="font-bold text-white">{orderQuantity} chiếc</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Tổng giá trị đơn:</span>
                    <span className="font-mono font-black text-white text-sm">
                      {(currentPrice * orderQuantity).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                    <span className="font-bold">Đặt cọc ngay 50%:</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {Math.round(currentPrice * orderQuantity * 0.5).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Còn lại thu COD (50%):</span>
                    <span className="font-mono text-amber-400">
                      {Math.round(currentPrice * orderQuantity * 0.5).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Form fields khách hàng */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Tên người nhận hàng *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Số điện thoại *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Địa chỉ nhận hàng tại Việt Nam *</label>
                    <input
                      type="text"
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Hàng order nội địa Trung Quốc sẽ về kho Việt Nam sau <strong>7 - 14 ngày</strong>. Khách hàng theo dõi vị trí kiện hàng liên tục qua hệ thống.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingOrder}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    {isCreatingOrder ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Xác nhận Đặt cọc 50% & Lên đơn</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIETQR ĐẶT CỌC 50% TỰ ĐỘNG NAPAS 247 */}
      {createdOrder && (
        <VietQrDepositModal
          order={createdOrder}
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          onSuccess={(updatedOrder) => {
            setShowQrModal(false)
            if (onGoToTracking) {
              onGoToTracking(updatedOrder.id)
            }
          }}
        />
      )}
    </div>
  )
}
