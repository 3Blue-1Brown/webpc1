const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { logActivity } = require('../logger');
const { verifyToken, verifyAdmin, verifyManagerOrAdmin } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Customer: Get my orders
router.get('/orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [[u]] = await db.query('SELECT email, phone FROM users WHERE id = ?', [userId]);
    const email = u ? u.email : '';
    const phone = u ? u.phone : '';

    const [orders] = await db.query(
      `SELECT id, ten_khach_hang, email, so_dien_thoai, dia_chi, tong_tien, 
              trang_thai_don_hang, phuong_thuc_thanh_toan, ngay_dat, ghi_chu 
       FROM don_hang 
       WHERE id_nguoi_dung = ? 
          OR (email IS NOT NULL AND email != '' AND email = ?)
          OR (so_dien_thoai IS NOT NULL AND so_dien_thoai != '' AND so_dien_thoai = ?)
       ORDER BY id DESC`,
      [userId, email, phone]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/Manager: Get all users
router.get('/', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, fullname, username, email, phone, address, role, status, avatar, created_at FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create new user (e.g. manager/admin) - Only Admin
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { fullname, username, email, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    
    const [[usernameCheck]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (usernameCheck) return res.status(409).json({ error: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role || 'customer';
    
    const [result] = await db.query(
      'INSERT INTO users (username, password, fullname, email, role, status) VALUES (?,?,?,?,?,"active")',
      [username, passwordHash, fullname, email, userRole]
    );
    logActivity(req.user, 'Tạo tài khoản mới', 'Tài khoản', result.insertId, `Tên đăng nhập: ${username}, Vai trò: ${userRole}`);
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update user role - Only Admin
router.put('/:id/role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'manager', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    // Prevent removing last admin
    if (role !== 'admin') {
      const [[adminCount]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
      const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
      if (user && user.role === 'admin' && adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin' });
      }
    }
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    logActivity(req.user, 'Đổi quyền tài khoản', 'Tài khoản', req.params.id, `Đổi quyền user #${req.params.id} thành ${role}`);
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update user status (lock/unlock) - Only Admin
router.put('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'locked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    // Prevent locking oneself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot lock your own account' });
    }
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    logActivity(req.user, 'Thay đổi trạng thái tài khoản', 'Tài khoản', req.params.id, `Đổi trạng thái user #${req.params.id} thành ${status === 'active' ? 'Hoạt động' : 'Đã khóa'}`);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Any user: Update profile
router.put('/profile', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    const { fullname, phone, address, email } = req.body;
    let sql = 'UPDATE users SET fullname = ?, phone = ?, address = ?, email = ?';
    let params = [fullname, phone, address, email];

    if (req.file) {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      sql += ', avatar = ?';
      params.push(avatarUrl);
    }
    sql += ' WHERE id = ?';
    params.push(req.user.id);

    await db.query(sql, params);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Any user: Update password
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 chars' });

    const [[user]] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    
    // Also support plain text check for legacy passwords
    if (!passwordMatch && currentPassword !== user.password) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Any user: Get my orders
router.get('/orders', verifyToken, async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT phone FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.phone) return res.json([]);

    const [orders] = await db.query('SELECT * FROM don_hang WHERE so_dien_thoai = ? ORDER BY id DESC', [user.phone]);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete user - Only Admin
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Prevent deleting oneself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Bạn không thể xóa tài khoản của chính mình' });
    }
    // Prevent deleting the last admin
    const [[adminCount]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    const [[user]] = await db.query('SELECT role, username FROM users WHERE id = ?', [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    if (user.role === 'admin' && adminCount.count <= 1) {
      return res.status(400).json({ error: 'Không thể xóa admin cuối cùng của hệ thống' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    logActivity(req.user, 'Xóa tài khoản', 'Tài khoản', req.params.id, `Xóa tài khoản: ${user.username}`);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
