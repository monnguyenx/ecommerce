# Hệ Thống Microservices Quản Lý Bán Hàng & Đặt Hàng (OmniOrder)

Dự án ứng dụng bán hàng và quản trị đơn hàng xây dựng theo mô hình **Microservices Architecture**, áp dụng tiêu chuẩn **Database-per-Service** và giao tiếp liên dịch vụ (**Inter-Service Communication**).

---

## 🏛️ Kiến Trúc Cơ Sở Dữ Liệu Riêng Biệt (Database-per-Service Pattern)

Toàn bộ cụm microservices kết nối trực tiếp tới container `ecommerce-postgres`, mỗi service sở hữu một Database độc lập hoàn toàn:

| Service | Port | Database riêng | Bảng dữ liệu chính | Nhiệm vụ |
| :--- | :--- | :--- | :--- | :--- |
| **`auth-service`** | `:8001` | **`ecommerce_auth_db`** | `accounts`, `refresh_tokens` | Quản lý thông tin định danh, tài khoản đăng nhập, mật khẩu Bcrypt, JWT Token |
| **`user-service`** | `:8002` | **`ecommerce_user_db`** | `user_profiles`, `user_addresses` | Quản lý hồ sơ cá nhân, số điện thoại, vai trò (RBAC), địa chỉ giao hàng |
| **`product-service`** | `:8003` | **`ecommerce_product_db`** | `products`, `product_items`, `product_codes` | Quản lý sản phẩm, mã định danh tra cứu (Mã code/SKU/Barcode), biến thể và thuộc tính Order Trung Quốc |
| **`order-service`** | `:8004` | **`ecommerce_order_db`** | `orders`, `order_tracking_events` | Quản lý Đơn hàng Order Trung Quốc (7-14 ngày), cơ chế đặt cọc 50%, định vị kiện hàng 6 chặng |

---

## 🇨🇳 Mô Hình Nghiệp Vụ: Order Hàng Trung Quốc & Vị Trí Kiện Hàng (7 - 14 ngày)

1. **Cơ chế Đặt cọc & Thanh toán (50% Deposit & 50% COD)**:
   - Khách hàng không mua hàng có sẵn tại kho VN, mà đặt trước các sản phẩm nội địa từ các sàn thương mại điện tử Trung Quốc (Taobao, 1688, Tmall).
   - Khi tạo đơn, khách hàng **thanh toán đặt cọc 50%** giá trị đơn hàng để kích hoạt mua hàng.
   - **50% số tiền còn lại** khách hàng sẽ thanh toán tiền mặt (COD) cho shipper sau khi nhận và kiểm tra hàng tận tay tại Việt Nam.

2. **Lộ trình 6 Chặng Logistics Xuyên Biên Giới (China ➔ Việt Nam)**:
   - **Trạm 1: `ORDER_DEPOSITED`** - Đã xác nhận đơn hàng & Đặt cọc 50% thành công.
   - **Trạm 2: `SUPPLIER_DISPATCHED`** - Shop bên Trung Quốc đóng gói & gửi hàng (SF Express).
   - **Trạm 3: `CN_WAREHOUSE_RECEIVED`** - Nhập Kho trung chuyển Quốc tế Quảng Châu Hub (Kiểm đếm & đóng kiện gỗ).
   - **Trạm 4: `CUSTOMS_CLEARING`** - Hàng về tới Cửa khẩu Quốc tế Hữu Nghị (Lạng Sơn) & Làm thủ tục thông quan chính ngạch.
   - **Trạm 5: `VN_WAREHOUSE_SORTING`** - Đã thông quan & Nhập Kho phân loại Việt Nam (Hà Nội SOC / TP.HCM SOC).
   - **Trạm 6: `LOCAL_DELIVERING`** - Shipper bưu chính giao hàng tận tay khách & Thu số tiền COD còn lại (50%).

---

## 🛠️ Hướng Dẫn Khởi Chạy

```bash
# 1. Khởi động hạ tầng PostgreSQL & Redis bằng Docker
docker compose up -d postgres redis

# 2. Khởi động các Microservices:
cd services/auth-service && npm run dev     # Port 8001
cd services/user-service && npm run dev     # Port 8002
cd services/product-service && npm run dev  # Port 8003
cd services/order-service && npm run dev    # Port 8004
cd services/frontend && npm run dev         # Port 3000
```

---

## 🔄 Duy Trì Phiên Làm Việc & Làm Việc Từ Xa (Work From Home)

### 1. Duy trì phiên làm việc trên cùng một máy (Hôm sau làm tiếp)

* **Nối tiếp phiên AI Assistant (`agy`) tức thì**:
  Khi mở terminal tại thư mục dự án vào ngày hôm sau, chỉ cần chạy:
  ```bash
  agy -c
  # hoặc: agy --continue
  ```
  *(Tự động nối tiếp đúng phiên trò chuyện gần nhất, không mất lịch sử ngữ cảnh).*

* **Giữ màn hình CLI chạy ngầm 24/7 với `screen`**:
  ```bash
  # Tạo phiên làm việc mới
  screen -S omniorder
  agy -c

  # Khi hết giờ làm việc: Nhấn tổ hợp Ctrl + A, sau đó nhấn phím D (Detach)
  # Ngày hôm sau vào lại chỉ cần gõ:
  screen -r omniorder
  ```

* **Duy trì toàn bộ hạ tầng & microservices chạy ngầm vĩnh viễn**:
  ```bash
  docker compose up -d --build
  # Toàn bộ services có cờ restart: unless-stopped nên sẽ tự khởi động lại cùng hệ điều hành
  ```

---

### 2. Làm việc từ xa trên Laptop cá nhân (Cross-Device / Work From Home)

> **Lưu ý quan trọng**: Lịch sử phiên hội thoại AI (`~/.gemini/antigravity-cli/brain/`), mã nguồn và cơ sở dữ liệu PostgreSQL / Redis mặc định được lưu trữ **cục bộ (Local)** trên máy tính hiện tại. Khi về nhà mở laptop cá nhân sẽ **không tự xuất hiện** dù đăng nhập chung tài khoản.

Có 3 giải pháp để tiếp tục làm việc:

* **Cách 1: Remote SSH vào máy công ty (Khuyên dùng - giữ trọn 100%)**:
  * Kết nối qua VPN nội bộ / Tailscale / VS Code Remote - SSH vào máy công ty.
  * Mở terminal từ xa và gõ `agy -c` (hoặc `screen -r omniorder`). Toàn bộ database, dịch vụ và phiên làm việc đều sẵn sàng ngay lập tức.

* **Cách 2: Điều khiển phiên từ xa qua `agy remote-control`**:
  * **Tại máy công ty**: Bật daemon điều khiển:
    ```bash
    agy remote-control start --name "office-workstation"
    ```
  * **Tại laptop cá nhân**: Kết nối về máy công ty:
    ```bash
    agy --remote-control
    ```

* **Cách 3: Đồng bộ qua Git & Bắt nhịp phiên mới tại nhà trong vài giây**:
  1. **Tại máy công ty**: Push code mới nhất lên repo:
     ```bash
     git add . && git commit -m "feat: sync work progress" && git push origin main
     ```
  2. **Tại laptop cá nhân**:
     * Kéo code về: `git pull origin main`
     * Khởi động database: `docker compose up -d postgres redis`
     * Mở `agy` và nhập câu lệnh:
       > *"Đọc file README.md, kiểm tra các service và tiếp tục triển khai phần order-service"*
     * AI sẽ tự động phân tích mã nguồn, schema dữ liệu và bắt nhịp công việc ngay lập tức.
