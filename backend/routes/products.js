// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logActivity } = require('../logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { verifyToken, requireRole, verifyAdmin, verifyManagerOrAdmin } = require('./auth');

// Helper: just clean up image URLs before saving to DB.
// No conversion needed — the frontend handles display via image-utils.js
function cleanImageUrl(url) {
  if (!url) return '';
  url = url.trim();

  // Data URLs or local paths — return as-is
  if (url.startsWith('data:image/') || url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return url;
  }

  // Prepend https:// if no protocol
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = 'https://' + url;
  }

  return url;
}


// Multer configuration for product images (Memory storage for sharp processing)
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });


// GET all products (Supports category, brand filters and search query)
router.get('/', async (req, res) => {
  try {
    const { category, brand, search, type } = req.query;
    let sql = `
      SELECT sp.*, dm.ten_danh_muc,
             (SELECT duong_dan FROM anh_san_pham WHERE id_san_pham = sp.id ORDER BY anh_chinh DESC, id ASC LIMIT 1) AS duong_dan_anh
      FROM san_pham sp
      LEFT JOIN danh_muc dm ON sp.id_danh_muc = dm.id
      WHERE sp.is_deleted = 0
    `;
    const params = [];

    if (type === 'noi_bat') {
      sql += ' AND sp.is_noi_bat = 1';
    } else if (type === 'moi') {
      sql += ' AND sp.is_moi = 1';
    } else if (type === 'flash_sale') {
      sql += ' AND sp.is_flash_sale = 1';
    }

    if (category && category !== 'All') {
      sql += ' AND (dm.ten_danh_muc = ? OR sp.id_danh_muc = ?)';
      params.push(category, category);
    }

    if (brand && brand !== 'All') {
      sql += ' AND sp.hang_san_xuat = ?';
      params.push(brand);
    }

    if (search) {
      sql += ' AND sp.ten_san_pham LIKE ?';
      params.push(`%${search}%`);
    }

    const [rows] = await db.query(sql, params);
    
    rows.forEach(r => {
      if (r.duong_dan_anh && !r.duong_dan_anh.startsWith('http') && !r.duong_dan_anh.startsWith('/')) {
        r.duong_dan_anh = '/' + r.duong_dan_anh;
      }
      r.images = [r.duong_dan_anh || '/placeholder.png'];
    });

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET one product (includes dynamic specifications and images)
router.get('/:id', async (req, res) => {
  try {
    const [productRows] = await db.execute(
      `SELECT sp.*, dm.ten_danh_muc 
       FROM san_pham sp 
       LEFT JOIN danh_muc dm ON sp.id_danh_muc = dm.id 
       WHERE sp.id = ? AND sp.is_deleted = 0`,
      [req.params.id]
    );
    if (productRows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const product = productRows[0];

    // Fetch images
    const [imageRows] = await db.execute(
      'SELECT duong_dan, anh_chinh FROM anh_san_pham WHERE id_san_pham = ? ORDER BY anh_chinh DESC, id ASC',
      [req.params.id]
    );
    product.images = imageRows.map(r => r.duong_dan);
    product.image_objects = imageRows; // full details

    // Fetch specs
    const [specRows] = await db.execute(
      'SELECT ten_thong_so, gia_tri FROM thong_so_san_pham WHERE id_san_pham = ?',
      [req.params.id]
    );
    const specsObj = {};
    specRows.forEach(r => {
      specsObj[r.ten_thong_so] = r.gia_tri;
    });
    product.thong_so = specsObj;

    // Backward compatibility fields for frontend product-card.js
    const compatSpecs = ['cpu', 'ram', 'vga', 'man_hinh', 'bao_hanh'];
    compatSpecs.forEach(f => {
      product[f] = specsObj[f] || specsObj[f.toUpperCase()] || null;
    });

    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper for input validation
function validateProductInput(body) {
  const { ten_san_pham, gia, id_danh_muc } = body;
  if (!ten_san_pham || ten_san_pham.trim() === '') {
    return 'Tên sản phẩm không được để trống.';
  }
  if (!gia || isNaN(gia) || Number(gia) <= 0) {
    return 'Giá sản phẩm phải là một số dương.';
  }
  if (!id_danh_muc || isNaN(id_danh_muc)) {
    return 'Vui lòng chọn danh mục hợp lệ.';
  }
  return null;
}

// CREATE product (Admin and Manager can create products)
router.post(
  '/',
  verifyToken, verifyManagerOrAdmin,
  upload.array('images', 10),
  async (req, res) => {
    const validationError = validateProductInput(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const {
      id_danh_muc,
      ten_san_pham,
      hang_san_xuat,
      mo_ta,
      gia,
      gia_khuyen_mai,
      so_luong,
      trang_thai,
      is_noi_bat,
      is_moi,
      is_flash_sale,
      thong_so, // JSON string
      anh_url    // JSON string array of URLs, or raw text list
    } = req.body;

    // Parse/extract image URLs
    let urls = [];
    if (anh_url) {
      try {
        if (typeof anh_url === 'string') {
          if (anh_url.trim().startsWith('[')) {
            urls = JSON.parse(anh_url);
          } else {
            urls = anh_url.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
          }
        } else if (Array.isArray(anh_url)) {
          urls = anh_url;
        }
      } catch (e) {
        console.error('Failed to parse anh_url', e);
      }
    }

    // Clean up image URLs (save directly to DB, frontend handles display)
    const formattedUrls = [];
    for (const rawUrl of urls) {
      const cleaned = cleanImageUrl(rawUrl);
      if (cleaned) formattedUrls.push(cleaned);
    }

    if (req.files && req.files.length > 0) {
      const uploadDir = path.join(__dirname, '../../uploads/products');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      for (const file of req.files) {
        const uniqueName = Date.now() + '-' + Math.floor(Math.random()*10000) + '.webp';
        const filepath = path.join(uploadDir, uniqueName);
        
        await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filepath);
          
        formattedUrls.push(`uploads/products/${uniqueName}`);
      }
    }

    if (formattedUrls.length === 0) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ít nhất một đường dẫn hoặc tải lên ảnh sản phẩm.' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert product basic info
      const [result] = await connection.execute(
        `INSERT INTO san_pham 
          (id_danh_muc, ten_san_pham, hang_san_xuat, mo_ta, gia, gia_khuyen_mai, so_luong, trang_thai, is_noi_bat, is_moi, is_flash_sale) 
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id_danh_muc,
          ten_san_pham.trim(),
          hang_san_xuat ? hang_san_xuat.trim() : null,
          mo_ta ? mo_ta.trim() : null,
          gia,
          gia_khuyen_mai && gia_khuyen_mai.toString().trim() !== '' ? gia_khuyen_mai : null,
          so_luong !== undefined && so_luong.toString().trim() !== '' ? so_luong : 0,
          trang_thai !== undefined ? (trang_thai === 'true' || trang_thai === '1' || trang_thai === 1) : 1,
          is_noi_bat === 'true' || is_noi_bat === '1' || is_noi_bat === 1 ? 1 : 0,
          is_moi === 'true' || is_moi === '1' || is_moi === 1 ? 1 : 0,
          is_flash_sale === 'true' || is_flash_sale === '1' || is_flash_sale === 1 ? 1 : 0
        ]
      );
      const productId = result.insertId;

      // 2. Process Specifications
      if (thong_so) {
        const specsObj = typeof thong_so === 'string' ? JSON.parse(thong_so) : thong_so;
        for (const [key, value] of Object.entries(specsObj)) {
          if (value !== undefined && value !== null && value.toString().trim() !== '') {
            await connection.execute(
              'INSERT INTO thong_so_san_pham (id_san_pham, ten_thong_so, gia_tri) VALUES (?, ?, ?)',
              [productId, key.trim(), value.toString().trim()]
            );
          }
        }
      }

      // 3. Process Images (Main + Sub)
      for (let i = 0; i < formattedUrls.length; i++) {
        const isMain = i === 0 ? 1 : 0;
        await connection.execute(
          'INSERT INTO anh_san_pham (id_san_pham, duong_dan, anh_chinh) VALUES (?, ?, ?)',
          [productId, formattedUrls[i], isMain]
        );
      }

      await connection.commit();
      const isMgr = req.user && (req.user.role || '').toLowerCase() === 'manager';
      const logMsg = isMgr ? `[MANAGER THÊM] ${ten_san_pham}` : `Tên: ${ten_san_pham}`;
      logActivity(req.user, 'Thêm sản phẩm', 'Sản phẩm', productId, logMsg);
      res.status(201).json({ id: productId, message: 'Product created successfully' });
    } catch (e) {
      await connection.rollback();
      res.status(500).json({ error: e.message });
    } finally {
      connection.release();
    }
  }
);

// UPDATE product (Supports Google Drive URLs & other web URLs, no file upload)
router.put(
  '/:id',
  verifyToken, verifyManagerOrAdmin,
  upload.array('images', 10),
  async (req, res) => {
    const productId = req.params.id;
    const validationError = validateProductInput(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const {
      id_danh_muc,
      ten_san_pham,
      hang_san_xuat,
      mo_ta,
      gia,
      gia_khuyen_mai,
      so_luong,
      trang_thai,
      thong_so,      // JSON string
      anh_url        // JSON string array of URLs, or raw text list
    } = req.body;

    // Parse/extract image URLs
    let urls = [];
    if (anh_url) {
      try {
        if (typeof anh_url === 'string') {
          if (anh_url.trim().startsWith('[')) {
            urls = JSON.parse(anh_url);
          } else {
            urls = anh_url.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
          }
        } else if (Array.isArray(anh_url)) {
          urls = anh_url;
        }
      } catch (e) {
        console.error('Failed to parse anh_url', e);
      }
    }

    // Clean up image URLs (save directly to DB, frontend handles display)
    const formattedUrls = [];
    for (const rawUrl of urls) {
      const cleaned = cleanImageUrl(rawUrl);
      if (cleaned) formattedUrls.push(cleaned);
    }

    if (req.files && req.files.length > 0) {
      const uploadDir = path.join(__dirname, '../../uploads/products');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      for (const file of req.files) {
        const uniqueName = Date.now() + '-' + Math.floor(Math.random()*10000) + '.webp';
        const filepath = path.join(uploadDir, uniqueName);
        
        await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filepath);
          
        formattedUrls.push(`uploads/products/${uniqueName}`);
      }
    }

    if (formattedUrls.length === 0) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ít nhất một đường dẫn hoặc tải lên ảnh sản phẩm.' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Update basic info
      const {
        is_noi_bat,
        is_moi,
        is_flash_sale
      } = req.body;

      const [updateRes] = await connection.execute(
        `UPDATE san_pham SET 
          id_danh_muc = ?, ten_san_pham = ?, hang_san_xuat = ?, mo_ta = ?, 
          gia = ?, gia_khuyen_mai = ?, so_luong = ?, trang_thai = ?,
          is_noi_bat = ?, is_moi = ?, is_flash_sale = ?
         WHERE id = ? AND is_deleted = 0`,
        [
          id_danh_muc,
          ten_san_pham.trim(),
          hang_san_xuat ? hang_san_xuat.trim() : null,
          mo_ta ? mo_ta.trim() : null,
          gia,
          gia_khuyen_mai && gia_khuyen_mai.toString().trim() !== '' ? gia_khuyen_mai : null,
          so_luong !== undefined && so_luong.toString().trim() !== '' ? so_luong : 0,
          trang_thai !== undefined ? (trang_thai === 'true' || trang_thai === '1' || trang_thai === 1) : 1,
          is_noi_bat === 'true' || is_noi_bat === '1' || is_noi_bat === 1 ? 1 : 0,
          is_moi === 'true' || is_moi === '1' || is_moi === 1 ? 1 : 0,
          is_flash_sale === 'true' || is_flash_sale === '1' || is_flash_sale === 1 ? 1 : 0,
          productId
        ]
      );

      if (updateRes.affectedRows === 0) {
        connection.release();
        return res.status(404).json({ error: 'Product not found or already deleted' });
      }

      // 2. Update Specifications (clear and recreate)
      await connection.execute('DELETE FROM thong_so_san_pham WHERE id_san_pham = ?', [productId]);
      if (thong_so) {
        const specsObj = typeof thong_so === 'string' ? JSON.parse(thong_so) : thong_so;
        for (const [key, value] of Object.entries(specsObj)) {
          if (value !== undefined && value !== null && value.toString().trim() !== '') {
            await connection.execute(
              'INSERT INTO thong_so_san_pham (id_san_pham, ten_thong_so, gia_tri) VALUES (?, ?, ?)',
              [productId, key.trim(), value.toString().trim()]
            );
          }
        }
      }

      // 3. Update Images (clear and recreate)
      await connection.execute('DELETE FROM anh_san_pham WHERE id_san_pham = ?', [productId]);
      for (let i = 0; i < formattedUrls.length; i++) {
        const isMain = i === 0 ? 1 : 0;
        await connection.execute(
          'INSERT INTO anh_san_pham (id_san_pham, duong_dan, anh_chinh) VALUES (?, ?, ?)',
          [productId, formattedUrls[i], isMain]
        );
      }

      await connection.commit();
      const isMgr = req.user && (req.user.role || '').toLowerCase() === 'manager';
      const logMsg = isMgr ? `[MANAGER CHỈNH SỬA] ${ten_san_pham}` : `Tên: ${ten_san_pham}`;
      logActivity(req.user, 'Sửa sản phẩm', 'Sản phẩm', productId, logMsg);
      res.json({ message: 'Product updated successfully' });
    } catch (e) {
      await connection.rollback();
      res.status(500).json({ error: e.message });
    } finally {
      connection.release();
    }
  }
);

// DELETE product (Only Admin can delete)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    // Set is_deleted = 1
    const [result] = await db.execute(
      'UPDATE san_pham SET is_deleted = 1 WHERE id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logActivity(req.user, 'Xóa sản phẩm', 'Sản phẩm', productId, `Xóa sản phẩm #${productId}`);
    res.json({ message: 'Product soft deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
