# 📘 TÀI LIỆU KỸ THUẬT VÀ DỰNG DỰ ÁN (TECHNICAL DOCUMENTATION)
**Dự án**: Website Bán Hàng Laptop, PC & Linh Kiện Máy Tính (WebPC1)  
**Đơn vị thực hiện**: Công ty TNHH Công Nghệ Nam Nguyễn  
**Phiên bản**: 1.0 (Bản nghiệm thu sản phẩm Tuần 8)

---

## 📑 MỤC LỤC
1. [Tổng quan dự án & Công nghệ sử dụng](#1-tổng-quan-dự-án--công-nghệ-sử-dụng)
2. [Cấu trúc thư mục Source Code](#2-cấu-trúc-thư-mục-source-code)
3. [Thiết kế CSDL (Database Schema)](#3-thiết-kế-csdl-database-schema)
4. [Danh sách API Routes (Backend Endpoints)](#4-danh-sách-api-routes-backend-endpoints)
5. [Hướng dẫn cài đặt & Chạy Localhost](#5-hướng-dẫn-cài-đặt--chạy-localhost)
6. [Hướng dẫn Deploy lên Server / Hosting / VPS](#6-hướng-dẫn-deploy-lên-server--hosting--vps)
7. [Quy trình Backup & Bảo trì hệ thống](#7-quy-trình-backup--bảo-trì-hệ-thống)

---

## 1. TỔNG QUAN DỰ ÁN & CÔNG NGHỆ SỬ DỤNG

### 🎯 Mục tiêu:
Xây dựng website bán hàng công nghệ chuyên nghiệp dành cho Laptop, PC Gaming, Linh kiện & Màn hình với trải nghiệm mượt mà, chuẩn Responsive trên Điện thoại và Máy tính, có tích hợp bảng thông số tự động và hệ thống quản trị Admin thông minh.

### 🛠️ Công nghệ cốt lõi:
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System, Flexbox, Grid), JavaScript ES6+ (Native Fetch API, Image Utilities).
- **Backend**: Node.js, Express.js framework, CORS, Multer (xử lý upload file), Sharp (tự động nén ảnh WebP).
- **Database**: Clever Cloud MySQL (`mysql2` driver, hỗ trợ connection pooling và tự động duy trì kết nối).
- **Tích hợp hình ảnh**: Tự động chuyển đổi link Google Drive, CDN, Imgur với cơ chế `referrerPolicy="no-referrer"` chống chặn ảnh.

---

## 2. CẤU TRÚC THƯ MỤC SOURCE CODE

```
webpc1/
├── backend/
│   ├── app.js                 # Entry point chính của Node.js Express server
│   ├── db.js                  # Cấu hình & duy trì kết nối Database MySQL Pool
│   ├── .env                   # File chứa biến môi trường & đường dẫn kết nối CSDL
│   ├── routes/                # Các tuyến API route
│   │   ├── products.js        # API Sản phẩm, danh mục & upload ảnh
│   │   ├── orders.js          # API Đơn hàng & chi tiết đơn
│   │   ├── banners.js         # API Quản lý Banner trang chủ
│   │   ├── auth.js            # API Đăng nhập Admin & phân quyền
│   │   ├── contacts.js        # API Tin nhắn liên hệ
│   │   └── activity-logs.js   # API Nhật ký hoạt động Manager/Admin
│   ├── uploads/               # Thư mục chứa ảnh tải lên server
│   └── package.json           # Danh sách thư viện và script
├── frontend/
│   ├── index.html             # Trang chủ website
│   ├── products.html          # Trang danh sách sản phẩm, lọc & tìm kiếm
│   ├── product_detail.html    # Trang chi tiết sản phẩm (Bảng thông số 2 cột)
│   ├── cart.html              # Trang giỏ hàng
│   ├── checkout.html          # Trang thanh toán & đặt hàng
│   ├── admin/
│   │   ├── index.html         # Trang quản trị Admin (Báo cáo, Sản phẩm, Đơn hàng, Banner, Logs)
│   │   └── login.html         # Trang đăng nhập Admin
│   ├── js/
│   │   ├── image-utils.js     # Thư viện xử lý ảnh Google Drive & fallback
│   │   ├── cart.js            # Xử lý giỏ hàng & LocalStorage
│   │   └── zalo-qr-modal.js   # Modal hiển thị QR báo giá Zalo
│   └── css/
│       └── style.css          # CSS thiết kế tổng thể
└── docs/                      # Tài liệu kỹ thuật & tài liệu hướng dẫn
```

---

## 3. THIẾT KẾ CSDL (DATABASE SCHEMA)

### 🔌 Thông tin đường dẫn & Cấu hình kết nối CSDL (Database Connection Path):
- **Trang quản trị trực tiếp Addon Database `ban-hang-db` (Personal Space)**:  
  [https://console.clever-cloud.com/organisations/user_dd27e6a5-6b89-4e50-bc14-e3861efbe6f4/addons/addon_d27ff64a-59b2-4845-b2b2-84d472f3c192](https://console.clever-cloud.com/organisations/user_dd27e6a5-6b89-4e50-bc14-e3861efbe6f4/addons/addon_d27ff64a-59b2-4845-b2b2-84d472f3c192)  
- **Trang chủ Console Clever Cloud**:  
  [https://console.clever-cloud.com](https://console.clever-cloud.com)  
  *(Cách mở giao diện PHPMyAdmin như ảnh: Vào [console.clever-cloud.com](https://console.clever-cloud.com) ➔ Chọn **Personal space** ➔ Ở menu bên trái chọn **ban-hang-db** ➔ Nhấn nút **PHPMyAdmin**)*
- **Trang đăng nhập phpMyAdmin độc lập**: [https://phpmyadmin.services.clever-cloud.com](https://phpmyadmin.services.clever-cloud.com)
- **Addon ID**: `addon_d27ff64a-59b2-4845-b2b2-84d472f3c192`
- **User / Org ID**: `user_dd27e6a5-6b89-4e50-bc14-e3861efbe6f4`
- **Cloud Provider**: Clever Cloud (MySQL Managed Service)
- **Host / Server**: `bqkzt4ns3c4znylrimuv-mysql.services.clever-cloud.com`
- **Port**: `3306`
- **Database Name**: `bqkzt4ns3c4znylrimuv`
- **User**: `uge4ns0rgb6l8c2c`
- **Password**: `5BsD3ImKEWv0zs1ckw53`
- **Chuỗi kết nối (Connection URI / Path)**:  
  `mysql://uge4ns0rgb6l8c2c:5BsD3ImKEWv0zs1ckw53@bqkzt4ns3c4znylrimuv-mysql.services.clever-cloud.com:3306/bqkzt4ns3c4znylrimuv`
- **File cấu hình môi trường**: [backend/.env](file:///c:/Users/minhngoc/Documents/webpc1/backend/.env)
- **File khởi tạo Pool kết nối**: [backend/db.js](file:///c:/Users/minhngoc/Documents/webpc1/backend/db.js)

### Các bảng dữ liệu chính:
1. **`danh_muc`**: `id`, `ten_danh_muc`, `mo_ta`
2. **`san_pham`**: `id`, `ten_san_pham`, `id_danh_muc`, `gia`, `gia_khuyen_mai`, `so_luong`, `mo_ta`, `thong_so`, `is_noi_bat`, `is_moi`, `is_flash_sale`, `trang_thai`
3. **`anh_san_pham`**: `id`, `id_san_pham`, `duong_dan`, `is_main`
4. **`don_hang`**: `id`, `ho_ten`, `so_dien_thoai`, `dia_chi`, `phuong_thuc_nhan_hang`, `phuong_thuc_thanh_toan`, `tong_tien`, `trang_thai`, `ngay_dat`
5. **`chi_tiet_don_hang`**: `id`, `id_don_hang`, `id_san_pham`, `so_luong`, `don_gia`
6. **`banners`**: `id`, `tieu_de`, `duong_dan_anh`, `lien_ket`, `thu_tu`, `trang_thai`
7. **`tai_khoan`**: `id`, `ten_dang_nhap`, `mat_khau`, `ho_ten`, `vaitro` (`admin` / `manager`)
8. **`lich_su_hoat_dong`**: `id`, `ten_nguoi_dung`, `hanh_dong`, `loai_doi_tuong`, `chi_tiet`, `thoi_gian`

---

## 4. DANH SÁCH API ROUTES (BACKEND ENDPOINTS)

### Sản phẩm (`/api/products`):
- `GET /api/products` - Lấy danh sách sản phẩm (có lọc, phân trang, tìm kiếm)
- `GET /api/products/:id` - Lấy chi tiết 1 sản phẩm
- `POST /api/products` - Thêm sản phẩm mới (Upload ảnh & dán link)
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm (Soft delete)

### Đơn hàng (`/api/orders`):
- `POST /api/orders` - Tạo đơn hàng mới từ trang checkout
- `GET /api/orders` - Lấy danh sách đơn hàng cho Admin
- `PUT /api/orders/:id/status` - Cập nhật trạng thái đơn hàng (Mới / Đang xử lý / Hoàn thành / Hủy)

### Banner (`/api/banners`):
- `GET /api/banners` - Lấy danh sách banner hiển thị trang chủ
- `POST /api/banners` - Thêm banner mới
- `PUT /api/banners/:id` - Cập nhật thông tin/thứ tự banner
- `DELETE /api/banners/:id` - Xóa banner

### Nhật ký hoạt động (`/api/activity-logs`):
- `GET /api/activity-logs` - Lấy lịch sử thao tác của Manager/Admin để hiển thị widget thông báo

---

## 5. HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCALHOST

### Yêu cầu môi trường:
- Node.js (Phiên bản >= 16.x)
- NPM (Phiên bản >= 8.x)

### Các bước thực hiện:
```bash
# 1. Mở Terminal tại thư mục backend
cd backend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Khởi động server backend (chạy port 3000 hoặc 5000)
npm start
```
- **Website người dùng**: Mở trình duyệt truy cập `http://localhost:3000` (hoặc mở file `frontend/index.html`).
- **Trang quản trị Admin**: Truy cập `http://localhost:3000/admin` hoặc `frontend/admin/index.html`.

---

## 6. HƯỚNG DẪN DEPLOY LÊN SERVER / HOSTING / VPS

### Phương án A: Deploy lên VPS (Ubuntu / Nginx / PM2)
1. Upload toàn bộ source code `webpc1` lên VPS.
2. Cài đặt PM2 để chạy ẩn Node.js backend:
   ```bash
   cd backend
   npm install
   npm install -g pm2
   pm2 start app.js --name "webpc1-backend"
   pm2 startup && pm2 save
   ```
3. Cấu hình Nginx Reverse Proxy trỏ domain về port của Node.js:
   ```nginx
   server {
       listen 80;
       server_name domaincuaban.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Cài đặt SSL miễn phí Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d domaincuaban.com
   ```

### Phương án B: Deploy nhanh lên Render / Vercel
- Đưa mã nguồn lên GitHub.
- Tạo dịch vụ **Web Service** trên Render.com, trỏ về repository `backend` với lệnh start `node app.js`.

---

## 7. QUY TRÌNH BACKUP & BẢO TRÌ HỆ THỐNG

1. **Sao lưu CSDL**: File `backend/database.sqlite` (hoặc dump MySQL) nên được tự động sao lưu hàng tuần.
2. **Sao lưu hình ảnh**: Thư mục `backend/uploads/` chứa các ảnh nén WebP do người dùng tải lên.
3. **Bảo mật**: Thay đổi `JWT_SECRET` và mật khẩu tài khoản Admin mặc định ngay khi bàn giao dự án.
