import React, { useState } from 'react'
import {
  Calculator,
  Truck,
  Plane,
  Boxes,
  ShieldCheck,
  Package,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Info
} from 'lucide-react'

interface ShippingCostCalculatorProps {
  onClose?: () => void
  initialWeight?: number
}

type ShippingRoute = 'air_express' | 'standard_road' | 'economy_bulk'
type DestinationZone = 'north' | 'central' | 'south'

interface PresetPackage {
  name: string
  icon: string
  weight: number
  length: number
  width: number
  height: number
  value: number
  woodCrate: boolean
  insurance: boolean
}

const PRESETS: PresetPackage[] = [
  {
    name: 'Điện thoại / Phụ kiện điện tử',
    icon: '📱',
    weight: 0.5,
    length: 18,
    width: 10,
    height: 6,
    value: 20000000,
    woodCrate: false,
    insurance: true
  },
  {
    name: 'Giày Sneaker / Quần áo hộp',
    icon: '👟',
    weight: 1.2,
    length: 34,
    width: 23,
    height: 14,
    value: 1500000,
    woodCrate: false,
    insurance: false
  },
  {
    name: 'Màn hình máy tính / Đồ dễ vỡ',
    icon: '🖥️',
    weight: 5.5,
    length: 68,
    width: 45,
    height: 16,
    value: 5200000,
    woodCrate: true,
    insurance: true
  },
  {
    name: 'Ghế công thái học / Nội thất',
    icon: '🪑',
    weight: 16.0,
    length: 75,
    width: 65,
    height: 40,
    value: 3600000,
    woodCrate: true,
    insurance: false
  }
]

export const ShippingCostCalculator: React.FC<ShippingCostCalculatorProps> = ({
  onClose,
  initialWeight = 1.0
}) => {
  const [actualWeight, setActualWeight] = useState<number>(initialWeight)
  const [length, setLength] = useState<number>(25)
  const [width, setWidth] = useState<number>(18)
  const [height, setHeight] = useState<number>(12)
  const [productValue, setProductValue] = useState<number>(1500000)
  const [route, setRoute] = useState<ShippingRoute>('standard_road')
  const [zone, setZone] = useState<DestinationZone>('north')
  const [useWoodCrate, setUseWoodCrate] = useState<boolean>(false)
  const [useInsurance, setUseInsurance] = useState<boolean>(true)
  const [useDoorDelivery, setUseDoorDelivery] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)

  // Công thức IATA quốc tế: (D x R x C cm) / 6000
  const volumetricWeight = Math.round(((length * width * height) / 6000) * 100) / 100
  const volumeCbm = Math.round(((length * width * height) / 1000000) * 1000) / 1000

  // Trọng lượng tính cước = MAX(thực tế, thể tích)
  const chargeableWeight = Math.max(actualWeight, volumetricWeight)
  const isVolumetricCharged = volumetricWeight > actualWeight

  // Cước cơ sở theo tuyến
  const routeTariffs: Record<
    ShippingRoute,
    { name: string; ratePerKg: number; days: string; icon: any; minWeight: number }
  > = {
    air_express: {
      name: 'Chuyển phát Nhanh (Đường bay Air)',
      ratePerKg: 35000,
      days: '2 - 4 ngày',
      icon: Plane,
      minWeight: 1.0
    },
    standard_road: {
      name: 'Vận chuyển Chuẩn (Đường bộ Thương mại)',
      ratePerKg: 22000,
      days: '4 - 7 ngày',
      icon: Truck,
      minWeight: 1.0
    },
    economy_bulk: {
      name: 'Vận chuyển Tiết kiệm (Hàng cồng kềnh / Lô lớn)',
      ratePerKg: 14000,
      days: '8 - 12 ngày',
      icon: Boxes,
      minWeight: 5.0
    }
  }

  // Phụ phí vùng miền
  const zoneSurcharges: Record<DestinationZone, { name: string; extraPerKg: number }> = {
    north: { name: 'Miền Bắc (Hà Nội, Hải Phòng, Bắc Ninh...)', extraPerKg: 0 },
    central: { name: 'Miền Trung (Đà Nẵng, Huế, Nghệ An...)', extraPerKg: 4000 },
    south: { name: 'Miền Nam (TP.HCM, Bình Dương, Cần Thơ...)', extraPerKg: 6000 }
  }

  const selectedRouteConfig = routeTariffs[route]
  const selectedZoneConfig = zoneSurcharges[zone]

  // Tính các thành phần chi phí
  const effectiveWeight = Math.max(chargeableWeight, selectedRouteConfig.minWeight)
  const baseFreightCost =
    Math.round(effectiveWeight * (selectedRouteConfig.ratePerKg + selectedZoneConfig.extraPerKg))

  const woodCrateCost = useWoodCrate ? (chargeableWeight > 10 ? 80000 : 50000) : 0
  const insuranceCost = useInsurance ? Math.round(productValue * 0.02) : 0 // 2% giá trị hàng
  const doorDeliveryCost = useDoorDelivery ? 25000 : 0 // 25k ship tận cửa

  const totalCost = baseFreightCost + woodCrateCost + insuranceCost + doorDeliveryCost

  const handleApplyPreset = (p: PresetPackage) => {
    setActualWeight(p.weight)
    setLength(p.length)
    setWidth(p.width)
    setHeight(p.height)
    setProductValue(p.value)
    setUseWoodCrate(p.woodCrate)
    setUseInsurance(p.insurance)
  }

  const handleReset = () => {
    setActualWeight(1.0)
    setLength(25)
    setWidth(18)
    setHeight(12)
    setProductValue(1500000)
    setRoute('standard_road')
    setZone('north')
    setUseWoodCrate(false)
    setUseInsurance(true)
    setUseDoorDelivery(true)
  }

  const handleCopyEstimate = () => {
    const text = `📦 BẢNG TÍNH CƯỚC VẬN CHUYỂN OMNIORDER (TQ ➔ VN)
- Tuyến: ${selectedRouteConfig.name} (${selectedRouteConfig.days})
- Điểm đến: ${selectedZoneConfig.name}
- Cân nặng thực tế: ${actualWeight} kg
- Kích thước: ${length}x${width}x${height} cm (${volumeCbm} m³)
- Cân nặng thể tích IATA: ${volumetricWeight} kg
- Trọng lượng tính cước: ${chargeableWeight} kg (${isVolumetricCharged ? 'Quy đổi thể tích' : 'Theo cân nặng'})
-------------------------
+ Cước quốc tế TQ-VN: ${baseFreightCost.toLocaleString('vi-VN')} đ
+ Gia cố đóng kiện gỗ: ${woodCrateCost.toLocaleString('vi-VN')} đ
+ Bảo hiểm hàng hóa 100%: ${insuranceCost.toLocaleString('vi-VN')} đ
+ Giao tận nhà Door-to-Door: ${doorDeliveryCost.toLocaleString('vi-VN')} đ
=========================
TỔNG CƯỚC ƯỚC TÍNH: ${totalCost.toLocaleString('vi-VN')} đ`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
      {/* HEADER */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/30">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Máy Tính Cước & Biểu Phí Vận Chuyển Kiện Hàng
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                IATA / 6000
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              So sánh cước cân nặng vs cước quy đổi thể tích cồng kềnh từ Trung Quốc về Việt Nam
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* QUICK PRESETS CHIPS */}
      <div className="px-5 sm:px-6 py-3.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-500 font-medium whitespace-nowrap text-[11px] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Gợi ý kiện mẫu:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => handleApplyPreset(p)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* MAIN BODY: 2 COLUMNS (INPUT CONTROLS VS CALCULATION RECEIPT) */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CONTROLS (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Trọng lượng thực tế */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-400" />
                <span>1. Cân nặng thực tế (Gross Weight):</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(Math.max(0.1, Number(e.target.value) || 0.1))}
                  className="w-20 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg text-white font-mono font-bold text-right text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-400 font-mono">kg</span>
              </div>
            </div>

            <input
              type="range"
              min="0.1"
              max="30"
              step="0.1"
              value={actualWeight}
              onChange={(e) => setActualWeight(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.1 kg</span>
              <span>10 kg</span>
              <span>20 kg</span>
              <span>30 kg+</span>
            </div>
          </div>

          {/* 2. Kích thước kiện hàng 3 chiều */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-purple-400" />
                <span>2. Kích thước kiện hàng (Dài x Rộng x Cao):</span>
              </label>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Thể tích: {volumeCbm} m³
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Dài (cm)</span>
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={length}
                  onChange={(e) => setLength(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-xl text-white font-mono font-bold text-center text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Rộng (cm)</span>
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-xl text-white font-mono font-bold text-center text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Cao (cm)</span>
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-xl text-white font-mono font-bold text-center text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Banner so sánh Cân nặng thể tích vs Cân nặng thực */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                isVolumetricCharged
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  {isVolumetricCharged
                    ? `⚠️ Kiện hàng cồng kềnh (Thể tích quy đổi: ${volumetricWeight} kg > Cân nặng: ${actualWeight} kg)`
                    : `✓ Kiện hàng gọn chuẩn (Cân nặng thực tế: ${actualWeight} kg >= Thể tích: ${volumetricWeight} kg)`}
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Công thức IATA: ({length} x {width} x {height}) / 6000 = <strong>{volumetricWeight} kg</strong>.
                  Trọng lượng tính cước chính thức: <strong>{chargeableWeight} kg</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Tuyến vận chuyển & Tốc độ */}
          <div className="space-y-2 text-xs">
            <label className="text-slate-300 font-semibold block">3. Chọn Gói Vận Chuyển Quốc Tế:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(routeTariffs) as ShippingRoute[]).map((rKey) => {
                const r = routeTariffs[rKey]
                const IconComponent = r.icon
                const isSelected = route === rKey
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => setRoute(rKey)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className="font-mono text-emerald-400 font-bold text-xs">
                        {r.ratePerKg.toLocaleString('vi-VN')} đ/kg
                      </span>
                    </div>
                    <p className="font-bold text-[11px] truncate">{r.name.split('(')[0]}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">⏱️ {r.days}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Tuyến giao hàng tại Việt Nam */}
          <div className="space-y-2 text-xs">
            <label className="text-slate-300 font-semibold block">4. Điểm Nhận Hàng Tại Việt Nam:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'north', label: 'Miền Bắc', sub: 'Hà Nội (0 đ)' },
                { id: 'central', label: 'Miền Trung', sub: 'Đà Nẵng (+4k/kg)' },
                { id: 'south', label: 'Miền Nam', sub: 'TP.HCM (+6k/kg)' }
              ].map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZone(z.id as DestinationZone)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    zone === z.id
                      ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs">{z.label}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">{z.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Dịch vụ giá trị gia tăng */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <label className="text-slate-300 font-semibold block">5. Dịch Vụ Gia Cố &amp; Bảo Hiểm:</label>
            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useWoodCrate}
                    onChange={(e) => setUseWoodCrate(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-white">Đóng kiện gỗ chống sốc / gia cố bọt khí</span>
                    <p className="text-[10px] text-slate-400">Khuyên dùng cho hàng dễ vỡ, màn hình, bàn phím cơ</p>
                  </div>
                </div>
                <span className="font-mono text-amber-400 font-bold">
                  +{chargeableWeight > 10 ? '80.000' : '50.000'} đ
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useInsurance}
                    onChange={(e) => setUseInsurance(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-white">Bảo hiểm hàng hóa 100% rủi ro</span>
                    <p className="text-[10px] text-slate-400">Đền bù 100% giá trị hàng khi thất lạc / nứt vỡ (2%)</p>
                  </div>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  +{insuranceCost.toLocaleString('vi-VN')} đ
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useDoorDelivery}
                    onChange={(e) => setUseDoorDelivery(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-white">Giao hàng tận cửa Door-to-Door nội địa VN</span>
                    <p className="text-[10px] text-slate-400">Shipper liên hệ giao tận tay theo địa chỉ yêu cầu</p>
                  </div>
                </div>
                <span className="font-mono text-indigo-300 font-bold">+25.000 đ</span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED INVOICE & RECEIPT (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Phiếu Ước Tính Cước Phí
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Real-time
              </span>
            </div>

            {/* Thông số tính cước */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Cân nặng thực tế:</span>
                <strong className="text-white font-mono">{actualWeight} kg</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Thể tích kiện (CBM):</span>
                <strong className="text-white font-mono">{volumeCbm} m³</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quy đổi IATA ({length}x{width}x{height}/6000):</span>
                <strong className="text-purple-300 font-mono">{volumetricWeight} kg</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-xs">
                <span className="text-slate-200 font-bold">Trọng lượng tính cước:</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {chargeableWeight} kg
                </span>
              </div>
            </div>

            {/* Bảng kê chi phí */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <div>
                  <span>Cước vận chuyển ({effectiveWeight} kg):</span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {selectedRouteConfig.ratePerKg + selectedZoneConfig.extraPerKg} đ/kg &bull; {selectedRouteConfig.days}
                  </p>
                </div>
                <strong className="font-mono text-white">
                  {baseFreightCost.toLocaleString('vi-VN')} đ
                </strong>
              </div>

              {useWoodCrate && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>Gia cố đóng kiện gỗ:</span>
                  <strong className="font-mono text-amber-400">
                    +{woodCrateCost.toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              )}

              {useInsurance && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>Bảo hiểm rủi ro 100%:</span>
                  <strong className="font-mono text-emerald-400">
                    +{insuranceCost.toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              )}

              {useDoorDelivery && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>Giao tận cửa Door-to-Door:</span>
                  <strong className="font-mono text-indigo-300">
                    +{doorDeliveryCost.toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              )}
            </div>

            {/* TỔNG CỘNG */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 text-center space-y-1">
              <span className="text-[11px] text-blue-300 uppercase tracking-wider font-semibold block">
                Tổng Cước Ước Tính
              </span>
              <p className="text-2xl sm:text-3xl font-mono font-black text-white">
                {totalCost.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-[11px] text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Thời gian giao dự kiến: <strong>{selectedRouteConfig.days}</strong>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCopyEstimate}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép bảng tính cước!' : 'Sao chép bảng tính cước'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
