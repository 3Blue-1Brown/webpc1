const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyManagerOrAdmin } = require('./auth');
const { logActivity } = require('../logger');

// GET activity logs
router.get('/', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [logs] = await db.query('SELECT * FROM lich_su_hoat_dong ORDER BY thoi_gian DESC LIMIT 300');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all activity logs (Clear history)
router.delete('/clear', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    await db.query('TRUNCATE TABLE lich_su_hoat_dong');
    logActivity(req.user, 'Xóa toàn bộ nhật ký', 'Hệ thống', null, 'Đã dọn dẹp lịch sử hoạt động để tối ưu dung lượng');
    res.json({ message: 'Đã xóa toàn bộ lịch sử hoạt động thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE single activity log entry
router.delete('/:id', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM lich_su_hoat_dong WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Nhật ký không tồn tại' });
    }
    res.json({ message: 'Đã xóa dòng nhật ký thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;