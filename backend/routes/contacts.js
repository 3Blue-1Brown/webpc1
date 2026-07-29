const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyManagerOrAdmin } = require('./auth');
const { logActivity } = require('../logger');

// CREATE contact entry (Public)
router.post('/', async (req, res) => {
  const { ho_ten, email, so_dien_thoai, noi_dung } = req.body;

  if (!ho_ten || !email || !noi_dung) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ họ tên, email và nội dung liên hệ!' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO lien_he (ho_ten, email, so_dien_thoai, noi_dung, trang_thai) 
       VALUES (?, ?, ?, ?, 'Mới')`,
      [ho_ten, email, so_dien_thoai || null, noi_dung]
    );

    logActivity(null, 'Người dùng liên hệ mới', 'Liên hệ', result.insertId, `Họ tên: ${ho_ten}, Email: ${email}, Nội dung: ${noi_dung}`);
    res.status(201).json({ id: result.insertId, message: 'Gửi liên hệ thành công!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET unread contact notifications count (For Admin)
router.get('/unread-count', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [[result]] = await db.query("SELECT COUNT(*) as count FROM lien_he WHERE trang_thai = 'Mới'");
    res.json({ unreadCount: result ? result.count : 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all contact entries (For Admin Panel)
router.get('/', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lien_he ORDER BY ngay_gui DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// MARK contact as read (For Admin Panel)
router.put('/:id/read', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    await db.query("UPDATE lien_he SET trang_thai = 'Đã xem' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Đã đánh dấu đã xem' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE contact entry (For Admin Panel)
router.delete('/:id', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM lien_he WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Liên hệ không tồn tại' });
    }
    logActivity(req.user, 'Xóa tin nhắn liên hệ', 'Liên hệ', req.params.id, `Đã xóa liên hệ #${req.params.id}`);
    res.json({ message: 'Xóa tin nhắn liên hệ thành công' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
