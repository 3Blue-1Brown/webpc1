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
    cb(null, path.join(__dirname, '../uploads/banners'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Helper: Ensure loai_banner column exists in database
async function ensureLoaiBannerColumn() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS banner (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tieu_de VARCHAR(255) NULL,
        hinh_anh TEXT NOT NULL,
        lien_ket VARCHAR(255) DEFAULT '#',
        vi_tri INT DEFAULT 0,
        trang_thai TINYINT DEFAULT 1,
        loai_banner VARCHAR(50) DEFAULT 'main'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    const [cols] = await db.query("SHOW COLUMNS FROM banner LIKE 'loai_banner'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE banner ADD COLUMN loai_banner VARCHAR(50) DEFAULT 'main'");
      console.log('✅ Added loai_banner column to banner table');
    }
  } catch (err) {
    console.warn('ℹ️ Banner table migration note:', err.message);
  }
}

// Run migration immediately on module load
ensureLoaiBannerColumn();

// GET active banners (For Frontend, with optional ?type=main or ?type=sale)
router.get('/', async (req, res) => {
  try {
    await ensureLoaiBannerColumn();
    const bannerType = req.query.type || 'main';
    let query = 'SELECT * FROM banner WHERE trang_thai = 1';

    if (bannerType === 'sale') {
      query += " AND loai_banner = 'sale'";
    } else {
      query += " AND (loai_banner = 'main' OR loai_banner IS NULL OR loai_banner = '')";
    }
    query += ' ORDER BY vi_tri ASC';

    try {
      const [rows] = await db.query(query);
      res.json(rows);
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes("Unknown column 'loai_banner'")) {
        await db.query("ALTER TABLE banner ADD COLUMN loai_banner VARCHAR(50) DEFAULT 'main'");
        const [rows] = await db.query('SELECT * FROM banner WHERE trang_thai = 1 ORDER BY vi_tri ASC');
        res.json(rows);
      } else {
        throw dbErr;
      }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all banners (For Admin)
router.get('/all', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    await ensureLoaiBannerColumn();
    const bannerType = req.query.type;
    let query = 'SELECT * FROM banner';
    if (bannerType === 'sale') {
      query += " WHERE loai_banner = 'sale'";
    } else if (bannerType === 'main') {
      query += " WHERE (loai_banner = 'main' OR loai_banner IS NULL OR loai_banner = '')";
    }
    query += ' ORDER BY vi_tri ASC';

    try {
      const [rows] = await db.query(query);
      res.json(rows);
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes("Unknown column 'loai_banner'")) {
        await db.query("ALTER TABLE banner ADD COLUMN loai_banner VARCHAR(50) DEFAULT 'main'");
        const [rows] = await db.query('SELECT * FROM banner ORDER BY vi_tri ASC');
        res.json(rows);
      } else {
        throw dbErr;
      }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE banner (Admin)
router.post('/', verifyToken, verifyManagerOrAdmin,  async (req, res) => {
  try {
    const { tieu_de, lien_ket, vi_tri, trang_thai, hinh_anh, loai_banner } = req.body;
    
    if (!hinh_anh) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đường dẫn hình ảnh banner.' });
    }

    const finalImage = cleanImageUrl(hinh_anh);
    const bannerType = loai_banner === 'sale' ? 'sale' : 'main';

    await ensureLoaiBannerColumn();

    let result;
    try {
      [result] = await db.execute(
        'INSERT INTO banner (tieu_de, hinh_anh, lien_ket, vi_tri, trang_thai, loai_banner) VALUES (?, ?, ?, ?, ?, ?)',
        [tieu_de || null, finalImage, lien_ket || '#', vi_tri || 0, trang_thai !== undefined ? parseInt(trang_thai) : 1, bannerType]
      );
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes("Unknown column 'loai_banner'")) {
        await db.query("ALTER TABLE banner ADD COLUMN loai_banner VARCHAR(50) DEFAULT 'main'");
        [result] = await db.execute(
          'INSERT INTO banner (tieu_de, hinh_anh, lien_ket, vi_tri, trang_thai, loai_banner) VALUES (?, ?, ?, ?, ?, ?)',
          [tieu_de || null, finalImage, lien_ket || '#', vi_tri || 0, trang_thai !== undefined ? parseInt(trang_thai) : 1, bannerType]
        );
      } else {
        throw dbErr;
      }
    }

    const isMgr = req.user && (req.user.role || '').toLowerCase() === 'manager';
    const logMsg = isMgr ? `[MANAGER THÊM BANNER ${bannerType.toUpperCase()}] Tiêu đề: ${tieu_de || 'Banner mới'}` : `Tiêu đề: ${tieu_de || 'Banner mới'}`;
    logActivity(req.user, 'Thêm banner', 'Banner', result.insertId, logMsg);
    res.status(201).json({ id: result.insertId, message: 'Banner created' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE banner (Admin)
router.put('/:id', verifyToken, verifyManagerOrAdmin,  async (req, res) => {
  try {
    const { tieu_de, lien_ket, vi_tri, trang_thai, hinh_anh, loai_banner } = req.body;
    const finalImage = hinh_anh ? cleanImageUrl(hinh_anh) : null;
    const bannerType = loai_banner === 'sale' ? 'sale' : 'main';

    await ensureLoaiBannerColumn();
    
    try {
      if (finalImage) {
        await db.execute(
          'UPDATE banner SET tieu_de = ?, hinh_anh = ?, lien_ket = ?, vi_tri = ?, trang_thai = ?, loai_banner = ? WHERE id = ?',
          [tieu_de, finalImage, lien_ket, vi_tri, parseInt(trang_thai), bannerType, req.params.id]
        );
      } else {
        await db.execute(
          'UPDATE banner SET tieu_de = ?, lien_ket = ?, vi_tri = ?, trang_thai = ?, loai_banner = ? WHERE id = ?',
          [tieu_de, lien_ket, vi_tri, parseInt(trang_thai), bannerType, req.params.id]
        );
      }
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes("Unknown column 'loai_banner'")) {
        await db.query("ALTER TABLE banner ADD COLUMN loai_banner VARCHAR(50) DEFAULT 'main'");
        if (finalImage) {
          await db.execute(
            'UPDATE banner SET tieu_de = ?, hinh_anh = ?, lien_ket = ?, vi_tri = ?, trang_thai = ?, loai_banner = ? WHERE id = ?',
            [tieu_de, finalImage, lien_ket, vi_tri, parseInt(trang_thai), bannerType, req.params.id]
          );
        } else {
          await db.execute(
            'UPDATE banner SET tieu_de = ?, lien_ket = ?, vi_tri = ?, trang_thai = ?, loai_banner = ? WHERE id = ?',
            [tieu_de, lien_ket, vi_tri, parseInt(trang_thai), bannerType, req.params.id]
          );
        }
      } else {
        throw dbErr;
      }
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
