import React, { useState, useEffect, useRef } from 'react'
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Boxes,
  DollarSign,
  Tag,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  Film,
  Sparkles
} from 'lucide-react'
import { productApi, type Product, type ProductItem, type ProductStats } from '../../services/productApi'
import type { User } from '../../types/auth'
import { ProductDetailView } from './ProductDetailView'

interface ProductManagementViewProps {
  user: User
  onGoToTracking?: (orderId?: string) => void
}

type DisplayMode = 'grid' | 'carousel'

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({ user, onGoToTracking }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid')

  // Selected item variant for each product card
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductItem>>({})

  // Điều hướng sang Màn hình Chi tiết Sản phẩm riêng biệt
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)

  // Form state for creating a product
  const [newProductCode, setNewProductCode] = useState('SP-NEW-01')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Điện thoại & Phụ kiện')
  const [newBrand, setNewBrand] = useState('')
  const [newPrice, setNewPrice] = useState('15000000')
  const [newStock, setNewStock] = useState('20')
  const [newSku, setNewSku] = useState('SKU-NEW-01')
  const [newVariant, setNewVariant] = useState('Màu Đen - Tiêu chuẩn')
  const [newThumb, setNewThumb] = useState('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Carousel slider ref
  const sliderRef = useRef<HTMLDivElement>(null)

  const canManage = user.role === 'admin' || user.role === 'manager'

  const loadData = async (queryTerm = searchTerm, cat = selectedCategory) => {
    setIsLoading(true)
    const [prods, catList, st] = await Promise.all([
      productApi.getProducts({ search: queryTerm, category: cat }),
      productApi.getCategories(),
      productApi.getStats()
    ])
    setProducts(prods)
    setCategories(catList)
    setStats(st)

    // Khởi tạo variant mặc định (item đầu tiên) cho từng sản phẩm
    const initialVariants: Record<string, ProductItem> = {}
    prods.forEach((p) => {
      if (p.items && p.items.length > 0) {
        initialVariants[p.id] = p.items[0]
      }
    })
    setSelectedVariants(initialVariants)

    setIsLoading(false)
  }

  // Tự động tìm kiếm tức thì khi người dùng gõ mã code hoặc tên (Debounce 250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(searchTerm, selectedCategory)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadData(searchTerm, selectedCategory)
  }

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 360
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi hệ thống?')) return
    const token = localStorage.getItem('ecommerce_auth_token') || ''
    const ok = await productApi.deleteProduct(id, token)
    if (ok) {
      setActionMessage('Đã xóa sản phẩm thành công!')
      setTimeout(() => setActionMessage(null), 3000)
      if (selectedProductId === id) setSelectedProductId(null)
      loadData()
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newBrand) return

    setIsSubmitting(true)
    const token = localStorage.getItem('ecommerce_auth_token') || ''
    const res = await productApi.createProduct(
      {
        code: newProductCode ? newProductCode.trim().toUpperCase() : undefined,
        name: newName,
        category: newCategory,
        brand: newBrand,
        description: `Sản phẩm ${newName} chính hãng thương hiệu ${newBrand}.`,
        thumbnail: newThumb,
        items: [
          {
            id: `item-${Date.now()}`,
            sku: newSku || `SKU-${Date.now().toString().slice(-4)}`,
            title: newVariant || 'Phiên bản tiêu chuẩn',
            price: Number(newPrice) || 1000000,
            stockQuantity: Number(newStock) || 10,
            attributes: { variant: newVariant }
          }
        ]
      },
      token
    )

    setIsSubmitting(false)
    if (res.success) {
      setShowAddModal(false)
      setNewProductCode(`SP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`)
      setNewName('')
      setNewBrand('')
      setActionMessage('Thêm sản phẩm mới và lưu mã vào bảng product_codes thành công!')
      setTimeout(() => setActionMessage(null), 3000)
      loadData()
    } else {
      alert(res.message || 'Lỗi thêm sản phẩm')
    }
  }

  // Nếu đang chọn 1 sản phẩm, điều hướng sang màn hình chi tiết sản phẩm riêng biệt (thay vì popup box)
  if (selectedProductId) {
    return (
      <ProductDetailView
        productId={selectedProductId}
        user={user}
        onBack={() => {
          setSelectedProductId(null)
          loadData()
        }}
        onProductDeleted={() => {
          setSelectedProductId(null)
          loadData()
        }}
        onGoToTracking={onGoToTracking}
      />
    )
  }

  return (
    <div className="space-y-7 pb-12">
      {/* Top Banner with Backend Service Info */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400">
              SERVICE: product-service (Port :8003)
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2.5">
            <span>Catalog Sản phẩm & Mặt hàng (Items/SKU)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
              SQUARE CARDS VIEW
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Hiển thị trực quan theo dạng thẻ ô vuông hình ảnh sắc nét, tương tác xem trực tiếp các biến thể SKU, giá cả và tồn kho real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-slate-950/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer btn-press ${
                displayMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lưới ô vuông</span>
            </button>
            <button
              onClick={() => setDisplayMode('carousel')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer btn-press ${
                displayMode === 'carousel'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Slide trình chiếu</span>
            </button>
          </div>

          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-850 text-slate-300 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer btn-press active:rotate-180"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 cursor-pointer transition-all duration-200 btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sản phẩm</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Tổng sản phẩm</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-heading">{stats?.totalProducts ?? products.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sản phẩm gốc trong catalog</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Mặt hàng (Items/SKU)</span>
            <Boxes className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-heading">{stats?.totalItems ?? 14}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Biến thể màu / dung lượng / size</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Tổng tồn kho</span>
            <Tag className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-heading">{stats?.totalStockQuantity ?? 395} chiếc</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sẵn sàng xuất đơn</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 card-interactive">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Giá trị tồn kho</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 font-mono">
            {stats?.totalInventoryValue ? (stats.totalInventoryValue / 1000000000).toFixed(2) + ' tỷ đ' : '...'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Theo giá niêm yết</p>
        </div>
      </div>

      {/* SECTION 1: SLIDE Ô VUÔNG TRÌNH CHIẾU SẢN PHẨM NỔI BẬT (SLIDER CAROUSEL) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sản phẩm & Mặt hàng Nổi bật (Slide Trình Chiếu)</h3>
              <p className="text-xs text-slate-400">Vuốt ngang hoặc dùng nút điều hướng để xem nhanh các ô vuông sản phẩm</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollSlider('left')}
              className="p-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all duration-200 btn-press"
              title="Slide trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollSlider('right')}
              className="p-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all duration-200 btn-press"
              title="Slide sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Square Slides Container */}
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((p) => {
            const activeItem = selectedVariants[p.id] || p.items[0] || null
            const displayPrice = activeItem ? activeItem.price : (p.items[0]?.price || 0)
            const displayOriginal = activeItem?.originalPrice || p.items[0]?.originalPrice || null
            const displayStock = activeItem ? activeItem.stockQuantity : 0

            return (
              <div
                key={`slide-${p.id}`}
                className="w-72 sm:w-80 flex-shrink-0 snap-start rounded-3xl bg-slate-950 border border-slate-800/90 hover:border-blue-500/50 card-interactive overflow-hidden flex flex-col group shadow-xl"
              >
                {/* Square Image Box */}
                <div
                  onClick={() => setSelectedProductId(p.id)}
                  className="aspect-square w-full relative overflow-hidden bg-slate-900 cursor-pointer"
                >
                  <img
                    src={p.thumbnail}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

                  {/* Badges on Square Image */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-blue-300 border border-slate-700/80 shadow-sm">
                      {p.brand}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 shadow-sm">
                      Mã: {p.code}
                    </span>
                    {displayOriginal && displayOriginal > displayPrice && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-600 text-white shadow-sm">
                        -{Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-slate-700/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Kho: {displayStock}
                    </span>
                  </div>

                  {/* Quick Action Button on Hover */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProductId(p.id)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết sản phẩm</span>
                    </button>
                  </div>
                </div>

                {/* Content info below image */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="truncate">{p.category}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-semibold font-mono">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {p.rating}
                      </span>
                    </div>

                    <h4
                      onClick={() => setSelectedProductId(p.id)}
                      className="font-bold text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {p.name}
                    </h4>

                    {/* Mã sản phẩm */}
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-indigo-400">
                      <span className="text-[10px] text-slate-500 font-sans">Mã SP:</span>
                      <span className="font-bold bg-indigo-950/70 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60">
                        {p.code}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base font-extrabold text-emerald-400 font-mono">
                        {displayPrice.toLocaleString('vi-VN')} đ
                      </span>
                      {displayOriginal && (
                        <span className="text-xs text-slate-500 line-through font-mono">
                          {displayOriginal.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>

                    {/* Pre-order China Tag & 50% Deposit preview */}
                    <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-amber-300">
                        <span className="flex items-center gap-1 font-semibold text-[10px]">
                          🇨🇳 Hàng Order ({p.estimatedDays || '7-14 ngày'})
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 truncate max-w-[120px]">
                          {p.supplierPlatform || 'Taobao / 1688'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                        <span>Cọc 50%:</span>
                        <strong className="text-emerald-400 font-bold">
                          {Math.round(displayPrice * (p.depositRate || 0.5)).toLocaleString('vi-VN')} đ
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* SKU variant chips */}
                  {p.items.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <p className="text-[10px] text-slate-500 mb-1.5 font-mono">
                        {p.items.length} mặt hàng SKU:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.items.map((item) => {
                          const isSelected = activeItem?.id === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() =>
                                setSelectedVariants((prev) => ({ ...prev, [p.id]: item }))
                              }
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                              title={`${item.title} - ${item.price.toLocaleString('vi-VN')} đ (Kho: ${item.stockQuantity})`}
                            >
                              {item.sku}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: TOOLBAR SEARCH & CATEGORY FILTER */}
      <div className="space-y-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-indigo-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm theo mã SP (SP-...), SKU, Barcode, tên, hãng..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-medium"
            />
          </form>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Tất cả danh mục sản phẩm</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search Code Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-slate-800/80 text-xs">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>Mã mẫu tra cứu nhanh (Click để thử tìm):</span>
          </span>
          {[
            { label: 'SP-IP16PM (Mã SP)', val: 'SP-IP16PM' },
            { label: 'SP-MBP14 (Mã SP)', val: 'SP-MBP14' },
            { label: '893850123401 (Mã vạch)', val: '893850123401' },
            { label: '893850123441 (Mã vạch)', val: '893850123441' },
            { label: 'IP16PM-256-NAT (SKU)', val: 'IP16PM-256-NAT' }
          ].map((chip) => (
            <button
              key={chip.val}
              type="button"
              onClick={() => setSearchTerm(chip.val)}
              className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition-all cursor-pointer border ${
                searchTerm === chip.val
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                  : 'bg-slate-950 text-indigo-300 border-slate-800 hover:border-indigo-600 hover:bg-slate-850'
              }`}
            >
              {chip.label}
            </button>
          ))}
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-[10px] text-rose-400 hover:underline cursor-pointer ml-1"
            >
              ✕ Xóa tìm kiếm
            </button>
          )}
        </div>
      </div>

      {/* SECTION 3: LƯỚI Ô VUÔNG SẢN PHẨM (GRID CARDS WITH LARGE SQUARE IMAGES) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-400" />
            <span>Toàn bộ sản phẩm trong kho ({products.length} sản phẩm)</span>
          </h3>
          <span className="text-xs text-slate-400">Click vào thẻ để xem tất cả các mặt hàng items</span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => {
              const activeItem = selectedVariants[p.id] || p.items[0] || null
              const displayPrice = activeItem ? activeItem.price : (p.items[0]?.price || 0)
              const displayOriginal = activeItem?.originalPrice || p.items[0]?.originalPrice || null
              const displayStock = activeItem ? activeItem.stockQuantity : 0

              return (
                <div
                  key={`grid-${p.id}`}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800/80 card-interactive overflow-hidden flex flex-col group shadow-xl"
                >
                  {/* Big Square Image Container */}
                  <div
                    onClick={() => setSelectedProductId(p.id)}
                    className="aspect-square w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                  >
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-50" />

                    {/* Category & Brand Pills */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-950/85 backdrop-blur-md text-blue-300 border border-slate-800 shadow-sm">
                        {p.brand}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 shadow-sm">
                        Mã: {p.code}
                      </span>
                      {displayOriginal && displayOriginal > displayPrice && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-600 text-white shadow-sm">
                          -{Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-950/85 backdrop-blur-md text-emerald-400 border border-slate-800 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Kho: {displayStock}
                      </span>
                    </div>

                    {/* Quick view button appearing on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProductId(p.id)
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer transform translate-y-2 group-hover:translate-y-0 transition-transform"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Vào màn chi tiết sản phẩm</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="truncate">{p.category}</span>
                        <span className="flex items-center gap-1 text-amber-400 font-semibold font-mono">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {p.rating}
                        </span>
                      </div>

                      <h4
                        onClick={() => setSelectedProductId(p.id)}
                        className="font-bold text-white text-sm line-clamp-1 hover:text-blue-400 transition-colors cursor-pointer"
                        title={p.name}
                      >
                        {p.name}
                      </h4>

                      {/* Mã sản phẩm */}
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-indigo-400">
                        <span className="text-[10px] text-slate-500 font-sans">Mã SP:</span>
                        <span className="font-bold bg-indigo-950/70 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60">
                          {p.code}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                        {p.description}
                      </p>

                      {/* Price Display */}
                      <div className="flex items-baseline gap-2 mt-2.5">
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {displayPrice.toLocaleString('vi-VN')} đ
                        </span>
                        {displayOriginal && (
                          <span className="text-xs text-slate-500 line-through font-mono">
                            {displayOriginal.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </div>

                      {/* Pre-order China Tag & 50% Deposit preview */}
                      <div className="mt-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-amber-300">
                          <span className="flex items-center gap-1 font-semibold text-[10px]">
                            🇨🇳 Hàng Order ({p.estimatedDays || '7-14 ngày'})
                          </span>
                          <span className="font-mono text-[9px] text-slate-400 truncate max-w-[140px]">
                            {p.supplierPlatform || 'Taobao / 1688'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                          <span>Cọc 50%:</span>
                          <strong className="text-emerald-400 font-bold">
                            {Math.round(displayPrice * (p.depositRate || 0.5)).toLocaleString('vi-VN')} đ
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Variant/Item Pills */}
                    {p.items.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                          <span>Mặt hàng (Items):</span>
                          <span className="font-mono text-purple-400">{p.items.length} biến thể</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.items.map((item) => {
                            const isSelected = activeItem?.id === item.id
                            return (
                              <button
                                key={item.id}
                                onClick={() =>
                                  setSelectedVariants((prev) => ({ ...prev, [p.id]: item }))
                                }
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all duration-150 cursor-pointer btn-press ${
                                  isSelected
                                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400/50 shadow-md shadow-blue-500/20'
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                                }`}
                                title={`${item.title} - ${item.price.toLocaleString('vi-VN')} đ (Kho: ${item.stockQuantity})`}
                              >
                                {item.sku}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setSelectedProductId(p.id)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer btn-press group-hover:translate-x-0.5 transition-all"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Chi tiết & Mặt hàng ({p.items.length})</span>
                      </button>

                      {canManage && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer btn-press"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800 text-slate-400 text-sm">
            {isLoading ? 'Đang kết nối tải sản phẩm từ product-service...' : 'Không tìm thấy sản phẩm nào phù hợp.'}
          </div>
        )}
      </div>

      {/* MODAL 2: THÊM SẢN PHẨM MỚI KÈM MẶT HÀNG ITEMS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900/95 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-scale-up">
            <h3 className="text-lg font-bold text-white mb-1 font-heading">Thêm sản phẩm mới vào Catalog</h3>
            <p className="text-xs text-slate-400 mb-5">
              Dữ liệu sẽ được lưu trực tiếp vào backend <span className="font-mono text-blue-400">product-service:8003</span>
            </p>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ví dụ: Tai nghe Gaming không dây Razer BlackShark"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1 flex items-center justify-between">
                    <span>Mã sản phẩm (Code) *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Bảng product_codes</span>
                  </label>
                  <input
                    type="text"
                    value={newProductCode}
                    onChange={(e) => setNewProductCode(e.target.value)}
                    placeholder="Ví dụ: SP-RAZER-01"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-indigo-900/60 rounded-xl text-xs font-mono text-indigo-300 uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Điện thoại & Phụ kiện">Điện thoại & Phụ kiện</option>
                    <option value="Máy tính & Laptop">Máy tính & Laptop</option>
                    <option value="Âm thanh & Phụ kiện">Âm thanh & Phụ kiện</option>
                    <option value="Đồng hồ & Smartwatch">Đồng hồ & Smartwatch</option>
                    <option value="Phụ kiện máy tính">Phụ kiện máy tính</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thương hiệu *</label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Apple, Sony, Razer, v.v."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Link ảnh thumbnail (URL)</label>
                <input
                  type="text"
                  value={newThumb}
                  onChange={(e) => setNewThumb(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Mặt hàng khởi tạo (Item/SKU) */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Mặt hàng / Biến thể (Item/SKU) ban đầu:</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Mã SKU *</label>
                    <input
                      type="text"
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tên biến thể *</label>
                    <input
                      type="text"
                      value={newVariant}
                      onChange={(e) => setNewVariant(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Giá bán (VNĐ) *</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-2xl cursor-pointer btn-press"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-2xl shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 btn-press"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
