# 📕 TÀI LIỆU HƯỚNG DẪN QUẢN TRỊ WEBSITE (ADMIN USER MANUAL)
**Dự án**: Website Bán Hàng Laptop, PC & Linh Kiện Máy Tính (WebPC1)  
**Dành cho**: Ban Quản Lý, Nhân viên Admin & Nhân viên Manager  
**Đơn vị cung cấp**: Công ty TNHH Công Nghệ Nam Nguyễn

---

## 📑 MỤC LỤC
1. [Hướng dẫn Đăng nhập & Quyền truy cập](#1-hướng-dẫn-đăng-nhập--quyền-truy-cập)
2. [Quản lý Sản phẩm (Thêm / Sửa / Xóa)](#2-quản-lý-sản-phẩm-thêm--sửa--xóa)
3. [Quy tắc dán Thông số & Mô tả sản phẩm tự động](#3-quy-tắc-dán-thông-số--mô-tả-sản-phẩm-tự-động)
4. [Quản lý Banner trang chủ](#4-quản-lý-banner-trang-chủ)
5. [Quản lý Đơn hàng & Xử lý trạng thái](#5-quản-lý-đơn-hàng--xử-lý-trạng-thái)
6. [Quản lý Khung thông báo Manager & Lịch sử hoạt động](#6-quản-lý-khung-thông-báo-manager--lịch-sử-hoạt-động)
7. [Quản lý Tài khoản & Phân quyền](#7-quản-lý-tài-khoản--phân-quyền)

---

## 1. HƯỚNG DẪN ĐĂNG NHẬP & QUYỀN TRUY CẬP

### 🔑 Đường dẫn truy cập:
- Địa chỉ trang quản trị: `http://domain-cuaban.com/admin/login.html` (hoặc `http://localhost:3000/admin/login.html`).

### 👥 Phân quyền tài khoản:
1. **Tài khoản ADMIN (Quyền Tối Cao)**:
   - Toàn quyền Thêm, Sửa, Xóa Sản phẩm, Đơn hàng, Banner, Tài khoản.
   - Nhận thông báo tự động mỗi khi tài khoản Manager thực hiện chỉnh sửa dữ liệu.
2. **Tài khoản MANAGER (Quyền Quản Lý Nội Dung)**:
   - Có quyền Thêm mới và Chỉnh sửa thông tin Sản phẩm, Banner, Đơn hàng.
   - **Không có quyền xóa** dữ liệu nguy hại. Mọi thao tác chỉnh sửa sẽ được ghi nhật ký và gửi thông báo trực tiếp đến Admin.

---

## 2. QUẢN LÝ SẢN PHẨM (THÊM / SỬA / XÓA)

### Các bước thêm sản phẩm mới:
1. Vào mục **Sản phẩm** trên menu bên trái.
2. Bấm nút **`➕ Thêm sản phẩm mới`**.
3. Điền các thông tin cơ bản:
   - **Tên sản phẩm**: Viết rõ ràng (Ví dụ: `CPU Intel Core i5 13400F`).
   - **Danh mục**: Chọn Laptop, PC, Linh kiện, Màn hình...
   - **Giá bán & Giá khuyến mãi**: Nhập số tiền (chỉ nhập số, không nhập ký tự `đ`).
   - **Số lượng tồn kho**: Số lượng sản phẩm có trong kho.
   - **Nhãn tích chọn**: Tích chọn `Nổi bật`, `Hàng mới`, `Flash Sale` nếu muốn hiển thị ra trang chủ.
4. **Tải lên hình ảnh / Dán link ảnh**:
   - Dán đường dẫn link ảnh (Hỗ trợ **Google Drive**, **Imgur**, link web bất kỳ).
   - Hoặc tải file ảnh trực tiếp từ máy tính (Hệ thống sẽ **tự động nén sang chuẩn WebP siêu nhẹ**).
5. Bấm **`💾 Lưu sản phẩm`**.

---

## 3. QUY TẮC DÁN THÔNG SỐ & MÔ TẢ SẢN PHẨM TỰ ĐỘNG

> 💡 **TÍNH NĂNG ĐẶC BIỆT**: Bạn không cần nhập thủ công từng ô thông số rườm rà. Bạn chỉ cần copy văn bản từ Word, Excel hoặc trang web khác và dán trực tiếp vào ô **"Mô tả chi tiết"**.

### Các kiểu dán được hệ thống tự động bóc tách thành Bảng 2 cột:
- **Kiểu 1 (Dấu hai chấm `:`)**:
  ```text
  Socket: LGA1700
  Số nhân: 10 Nhân
  Số luồng: 16 Luồng
  Xung nhịp: Up to 4.6 GHz
  ```
- **Kiểu 2 (Dấu Tab `\t` từ Excel)**:
  ```text
  Sản phẩm	CPU Intel Core i5
  Bảo hành	36 Tháng
  ```
- **Kiểu 3 (Từ khóa chuẩn)**:
  ```text
  Socket LGA1700
  Cache 20MB
  RAM DDR4 / DDR5
  ```

Hệ thống sẽ tự động lọc thông số đưa vào **Bảng 2 cột viền xám cực kỳ đẹp mắt**, các đoạn văn mô tả chung sẽ được đưa vào khung ghi chú bên dưới bảng.

---

## 4. QUẢN LÝ BANNER TRANG CHỦ

1. Chọn mục **Banners** từ Sidebar.
2. Bấm **`➕ Thêm Banner Mới`**.
3. Nhập tiêu đề, link liên kết khi khách hàng bấm vào (ví dụ: `#` hoặc đường dẫn khuyến mãi).
4. Dán URL Hình ảnh (link Google Drive hoặc link ảnh trực tiếp). Khung xem trước sẽ hiển thị ảnh ngay lập tức.
5. Nhập **Thứ tự hiển thị** (0, 1, 2...) để sắp xếp banner nào xuất hiện trước.
6. Bấm **`💾 Lưu Banner`**.

---

## 5. QUẢN LÝ ĐƠN HÀNG & XỬ LÝ TRẠNG THÁI

1. Chọn mục **Đơn hàng**.
2. Danh sách hiển thị mã đơn, tên khách hàng, ngày đặt, tổng tiền và trạng thái hiện tại.
3. Bấm **`👁️ Xem`** để xem đầy đủ chi tiết danh sách sản phẩm khách đã đặt, địa chỉ và ghi chú.
4. Chuyển trạng thái đơn hàng:
   - **Mới** ➔ **Đang xử lý** ➔ **Hoàn thành** (hoặc **Hủy**).

---

## 6. QUẢN LÝ KHUNG THÔNG BÁO MANAGER & LỊCH SỬ HOẠT ĐỘNG

- Khi đăng nhập bằng tài khoản **Admin**, ở đầu trang Tổng quan sẽ xuất hiện khung **`🔔 Thông báo hoạt động mới từ Manager`**.
- Mặc định khung chỉ hiển thị **1 thông báo mới nhất dưới dạng thẻ ngang trải dài**.
- Bấm nút **`Xem thêm N thông báo khác ▼`** ở cuối để mở rộng danh sách xem toàn bộ các thao tác chỉnh sửa của nhân viên. Bấm **`Thu gọn thông báo ▲`** để đóng lại gọn gàng.
- Bấm **"Xem chi tiết →"** trên từng thông báo để nhảy thẳng tới dòng nhật ký tương ứng trong mục **Lịch sử hoạt động**.

---

## 7. QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN

1. Chọn mục **Tài khoản**.
2.Admin có quyền thêm tài khoản nhân viên mới và phân vai trò:
   - **Admin**: Quyền toàn năng.
   - **Manager**: Quyền nhập liệu và quản lý đơn hàng.
3. Đổi mật khẩu định kỳ để đảm bảo an toàn bảo mật cho hệ thống.
