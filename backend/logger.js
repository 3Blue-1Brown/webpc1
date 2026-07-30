const db = require('./db');

async function initLogger(retryCount = 0) {
  try {
    await db.query('CREATE TABLE IF NOT EXISTS lich_su_hoat_dong (id INT AUTO_INCREMENT PRIMARY KEY, id_nguoi_dung INT NULL, ten_nguoi_dung VARCHAR(255) NULL, hanh_dong VARCHAR(100) NOT NULL, loai_doi_tuong VARCHAR(50) NOT NULL, id_doi_tuong INT NULL, chi_tiet TEXT NULL, thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
    console.log('✅ Activity log table initialized');
  } catch (err) {
    if (retryCount < 3) {
      setTimeout(() => initLogger(retryCount + 1), 3000);
    } else {
      console.warn('ℹ️ Activity log table note:', err.message);
    }
  }
}

initLogger();

async function logActivity(reqUser, hanhDong, loaiDoiTuong, idDoiTuong = null, chiTiet = '') {
  try {
    let idNguoiDung = null;
    let tenNguoiDung = 'Hệ thống';
    if (reqUser) {
      idNguoiDung = reqUser.id || null;
      tenNguoiDung = reqUser.username || reqUser.fullname || reqUser.name || (idNguoiDung ? 'User #' + idNguoiDung : 'Quản trị viên');
      if (idNguoiDung) {
        try {
          const [[u]] = await db.query('SELECT username, fullname FROM users WHERE id = ?', [idNguoiDung]);
          if (u) {
            tenNguoiDung = u.username + (u.fullname ? ' (' + u.fullname + ')' : '');
          }
        } catch (e) {}
      }
    }
    await db.query(
      'INSERT INTO lich_su_hoat_dong (id_nguoi_dung, ten_nguoi_dung, hanh_dong, loai_doi_tuong, id_doi_tuong, chi_tiet) VALUES (?, ?, ?, ?, ?, ?)',
      [idNguoiDung, tenNguoiDung, hanhDong, loaiDoiTuong, idDoiTuong, chiTiet]
    );
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

module.exports = { logActivity };