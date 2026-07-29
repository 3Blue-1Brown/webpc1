const express = require('express');
const router = express.Router();
const db = require('../db');
const { logActivity } = require('../logger');
const { verifyToken, verifyAdmin, verifyManagerOrAdmin } = require('./auth');

// helper function to calculate total from DB directly for security
async function calculateOrderTotal(items) {
  let total = 0;
  for (const item of items) {
    const [rows] = await db.query('SELECT gia, gia_khuyen_mai FROM san_pham WHERE id = ? AND is_deleted = 0', [item.id]);
    if (rows.length > 0) {
      const product = rows[0];
      const price = (product.gia_khuyen_mai && product.gia_khuyen_mai < product.gia) ? product.gia_khuyen_mai : product.gia;
      total += price * item.quantity;
    } else {
      throw new Error(`Sản phẩm với ID ${item.id} không tồn tại.`);
    }
  }
  return total;
}

// CREATE a new order (Checkout)
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { ho_ten, email, so_dien_thoai, dia_chi, ghi_chu, phuong_thuc_nhan_hang, phuong_thuc_thanh_toan, items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống.' });
    }

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'change_this_to_a_strong_random_secret');
        userId = decoded.id || null;
      } catch (e) {}
    }

    await connection.beginTransaction();

    // 1. Calculate total securely
    const totalAmount = await calculateOrderTotal(items);

    // 2. Insert into don_hang
    const [orderResult] = await connection.query(
      `INSERT INTO don_hang (id_nguoi_dung, email, ten_khach_hang, so_dien_thoai, dia_chi, ghi_chu, phuong_thuc_nhan_hang, phuong_thuc_thanh_toan, trang_thai_don_hang, tong_tien) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Mới', ?)`,
      [userId, email || null, ho_ten, so_dien_thoai, dia_chi, ghi_chu || '', phuong_thuc_nhan_hang, phuong_thuc_thanh_toan, totalAmount]
    );
    const orderId = orderResult.insertId;

    // 3. Insert into chi_tiet_don_hang & deduct stock
    for (const item of items) {
      const [pRows] = await connection.query('SELECT gia, gia_khuyen_mai, so_luong, ten_san_pham FROM san_pham WHERE id = ? AND is_deleted = 0', [item.id]);
      const p = pRows[0];
      if (!p) {
        const err = new Error(`Sản phẩm với ID ${item.id} không tồn tại.`);
        err.statusCode = 400;
        throw err;
      }
      if (p.so_luong < item.quantity) {
        const err = new Error(`Sản phẩm "${p.ten_san_pham}" không đủ hàng trong kho (Còn lại: ${p.so_luong}).`);
        err.statusCode = 400;
        throw err;
      }
      
      const price = (p.gia_khuyen_mai && p.gia_khuyen_mai < p.gia) ? p.gia_khuyen_mai : p.gia;
      
      await connection.query(
        `INSERT INTO chi_tiet_don_hang (id_don_hang, id_san_pham, so_luong, don_gia) VALUES (?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, price]
      );

      await connection.query(
        `UPDATE san_pham SET so_luong = so_luong - ? WHERE id = ?`,
        [item.quantity, item.id]
      );
    }

    await connection.commit();
    logActivity(null, 'Tạo đơn hàng mới', 'Đơn hàng', orderId, `Khách hàng: ${ho_ten}, SĐT: ${so_dien_thoai}`);
    res.status(201).json({ message: 'Đặt hàng thành công!', orderId: orderId });
  } catch (error) {
    await connection.rollback();
    console.error('Order Error:', error);
    const statusCode = error.statusCode || 500;
    const errorMsg = error.statusCode ? error.message : 'Có lỗi xảy ra khi xử lý đơn hàng.';
    res.status(statusCode).json({ error: errorMsg });
  } finally {
    connection.release();
  }
});

// GET all orders (Admin/Manager)
router.get('/', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT *, ten_khach_hang AS ho_ten, trang_thai_don_hang AS trang_thai FROM don_hang ORDER BY ngay_dat DESC');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET order details by ID (Admin/Manager)
router.get('/:id', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT *, ten_khach_hang AS ho_ten, trang_thai_don_hang AS trang_thai FROM don_hang WHERE id = ?', [req.params.id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const [items] = await db.query(
      `SELECT ct.*, ct.don_gia AS gia_luc_mua, sp.ten_san_pham,
              (SELECT duong_dan FROM anh_san_pham WHERE id_san_pham = sp.id ORDER BY anh_chinh DESC, id ASC LIMIT 1) AS duong_dan_anh 
       FROM chi_tiet_don_hang ct 
       LEFT JOIN san_pham sp ON ct.id_san_pham = sp.id 
       WHERE ct.id_don_hang = ?`, 
      [req.params.id]
    );
    
    res.json({ order: orders[0], items: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE order status (Admin)
router.put('/:id/status', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { trang_thai } = req.body;
    const validStatuses = ['Mới', 'Đang xử lý', 'Hoàn thành', 'Hủy'];
    if (!validStatuses.includes(trang_thai)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    await connection.beginTransaction();

    // 1. Get current order and its status
    const [orders] = await connection.query('SELECT trang_thai_don_hang FROM don_hang WHERE id = ?', [req.params.id]);
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }
    
    const oldStatus = orders[0].trang_thai_don_hang;
    
    if (oldStatus !== trang_thai) {
      // 2. Get order items details
      const [orderItems] = await connection.query(
        'SELECT id_san_pham, so_luong FROM chi_tiet_don_hang WHERE id_don_hang = ?',
        [req.params.id]
      );

      // Transition to 'Hủy' (from an active status): Restore stock
      if (trang_thai === 'Hủy' && oldStatus !== 'Hủy') {
        for (const item of orderItems) {
          await connection.query(
            'UPDATE san_pham SET so_luong = so_luong + ? WHERE id = ?',
            [item.so_luong, item.id_san_pham]
          );
        }
      }
      // Transition from 'Hủy' back to active: Validate and deduct stock
      else if (oldStatus === 'Hủy' && trang_thai !== 'Hủy') {
        // Validate stock first
        for (const item of orderItems) {
          const [pRows] = await connection.query('SELECT so_luong, ten_san_pham FROM san_pham WHERE id = ? AND is_deleted = 0', [item.id_san_pham]);
          const p = pRows[0];
          if (!p) {
            await connection.rollback();
            return res.status(400).json({ error: `Sản phẩm với ID ${item.id_san_pham} không tồn tại hoặc đã bị xóa.` });
          }
          if (p.so_luong < item.so_luong) {
            await connection.rollback();
            return res.status(400).json({ 
              error: `Sản phẩm "${p.ten_san_pham}" không đủ hàng để khôi phục đơn hàng (Yêu cầu: ${item.so_luong}, Còn lại: ${p.so_luong}).` 
            });
          }
        }
        // Deduct stock
        for (const item of orderItems) {
          await connection.query(
            'UPDATE san_pham SET so_luong = so_luong - ? WHERE id = ?',
            [item.so_luong, item.id_san_pham]
          );
        }
      }
    }

    // 3. Update status in DB
    await connection.query(
      'UPDATE don_hang SET trang_thai_don_hang = ? WHERE id = ?',
      [trang_thai, req.params.id]
    );

    await connection.commit();

    const isMgr = req.user && (req.user.role || '').toLowerCase() === 'manager';
    const logMsg = isMgr ? `[MANAGER CẬP NHẬT] Đổi trạng thái đơn #${req.params.id} thành "${trang_thai}"` : `Đổi trạng thái đơn #${req.params.id} thành "${trang_thai}"`;
    logActivity(req.user, 'Cập nhật trạng thái đơn hàng', 'Đơn hàng', req.params.id, logMsg);
    
    res.json({ message: 'Cập nhật trạng thái thành công', trang_thai });
  } catch (error) {
    await connection.rollback();
    console.error('Update Order Status Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// DELETE single order (Only Admin can delete)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get the order and check its status before deleting
    const [orders] = await connection.query('SELECT trang_thai_don_hang FROM don_hang WHERE id = ?', [req.params.id]);
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    const orderStatus = orders[0].trang_thai_don_hang;

    // 2. If the order was active (not 'Hủy'), restore the stock
    if (orderStatus !== 'Hủy') {
      const [orderItems] = await connection.query(
        'SELECT id_san_pham, so_luong FROM chi_tiet_don_hang WHERE id_don_hang = ?',
        [req.params.id]
      );
      for (const item of orderItems) {
        await connection.query(
          'UPDATE san_pham SET so_luong = so_luong + ? WHERE id = ?',
          [item.so_luong, item.id_san_pham]
        );
      }
    }

    // 3. Delete order items and the order
    await connection.query('DELETE FROM chi_tiet_don_hang WHERE id_don_hang = ?', [req.params.id]);
    const [result] = await connection.query('DELETE FROM don_hang WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    await connection.commit();
    logActivity(req.user, 'Xóa đơn hàng', 'Đơn hàng', req.params.id, `Đã xóa đơn hàng #${req.params.id}`);
    res.json({ message: 'Xóa đơn hàng thành công' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
