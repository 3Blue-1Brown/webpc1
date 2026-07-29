const express = require('express');
const router = express.Router();
const db = require('../db');
const { logActivity } = require('../logger');

// Helper: just clean up image URLs before saving to DB.
// No conversion needed — the frontend handles display via image-utils.js
function cleanImageUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (url.startsWith('data:image/') || url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return url;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = 'https://' + url;
  }
  return url;
}
const multer = require('multer');
const path = require('path');
const { verifyToken, verifyAdmin, verifyManagerOrAdmin } = require('./auth');

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/banners'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// GET all active banners (For Frontend)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM banner WHERE trang_thai = 1 ORDER BY vi_tri ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all banners (For Admin)
router.get('/all', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM banner ORDER BY vi_tri ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE banner (Admin)
router.post('/', verifyToken, verifyManagerOrAdmin,  async (req, res) => {
  try {
    const { tieu_de, lien_ket, vi_tri, trang_thai, hinh_anh } = req.body;
    
    if (!hinh_anh) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đường dẫn hình ảnh banner.' });
    }

    const finalImage = cleanImageUrl(hinh_anh);

    const [result] = await db.execute(
      'INSERT INTO banner (tieu_de, hinh_anh, lien_ket, vi_tri, trang_thai) VALUES (?, ?, ?, ?, ?)',
      [tieu_de || null, finalImage, lien_ket || '#', vi_tri || 0, trang_thai !== undefined ? trang_thai : 1]
    );
    const isMgr = req.user && (req.user.role || '').toLowerCase() === 'manager';
    const logMsg = isMgr ? `[MANAGER THÊM] Tiêu đề: ${tieu_de || 'Banner mới'}` : `Tiêu đề: ${tieu_de || 'Banner mới'}`;
    logActivity(req.user, 'Thêm banner', 'Banner', result.insertId, logMsg);
    res.status(201).json({ id: result.insertId, message: 'Banner created' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE banner (Admin)
router.put('/:id', verifyToken, verifyManagerOrAdmin,  async (req, res) => {
  try {
    const { tieu_de, lien_ket, vi_tri, trang_thai, hinh_anh } = req.body;
    const finalImage = hinh_anh ? cleanImageUrl(hinh_anh) : null;
    
    if (finalImage) {
      await db.execute(
        'UPDATE banner SET tieu_de = ?, hinh_anh = ?, lien_ket = ?, vi_tri = ?, trang_thai = ? WHERE id = ?',
        [tieu_de, finalImage, lien_ket, vi_tri, trang_thai, req.params.id]
      );
    } else {
      await db.execute(
        'UPDATE banner SET tieu_de = ?, lien_ket = ?, vi_tri = ?, trang_thai = ? WHERE id = ?',
        [tieu_de, lien_ket, vi_tri, trang_thai, req.params.id]
      );
    }
    res.json({ message: 'Banner updated' });
    const isMgr = req.user && (req.user.role || '').toLowerCase() === 'manager';
    const logMsg = isMgr ? `[MANAGER CHỈNH SỬA] Cập nhật banner #${req.params.id}` : `Cập nhật banner #${req.params.id}`;
    logActivity(req.user, 'Sửa banner', 'Banner', req.params.id, logMsg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE banner (Only Admin can delete)
router.delete('/:id', verifyToken, verifyAdmin,  async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM banner WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Banner not found' });
    logActivity(req.user, 'Xóa banner', 'Banner', req.params.id, `Xóa banner #${req.params.id}`);
    res.json({ message: 'Banner deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
