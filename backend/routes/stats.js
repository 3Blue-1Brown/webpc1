const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyManagerOrAdmin } = require('./auth');

// GET /api/stats/summary - Real-time statistics for Admin/Manager Dashboard with Date Filtering
router.get('/summary', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    let orderWhereClause = '';
    const orderParams = [];

    if (period === 'today') {
      orderWhereClause = ' WHERE DATE(ngay_dat) = CURDATE()';
    } else if (period === 'yesterday') {
      orderWhereClause = ' WHERE DATE(ngay_dat) = CURDATE() - INTERVAL 1 DAY';
    } else if (period === '7days') {
      orderWhereClause = ' WHERE ngay_dat >= NOW() - INTERVAL 7 DAY';
    } else if (period === '30days') {
      orderWhereClause = ' WHERE ngay_dat >= NOW() - INTERVAL 30 DAY';
    } else if (period === 'this_month') {
      orderWhereClause = ' WHERE MONTH(ngay_dat) = MONTH(CURDATE()) AND YEAR(ngay_dat) = YEAR(CURDATE())';
    } else if (period === 'last_month') {
      orderWhereClause = ' WHERE MONTH(ngay_dat) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(ngay_dat) = YEAR(CURDATE() - INTERVAL 1 MONTH)';
    } else if (period === 'this_year') {
      orderWhereClause = ' WHERE YEAR(ngay_dat) = YEAR(CURDATE())';
    } else if (period === 'custom' && startDate && endDate) {
      orderWhereClause = ' WHERE DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ?';
      orderParams.push(startDate, endDate);
    }

    // 1. Revenue calculations with optional date filter
    const [[revRow]] = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN trang_thai_don_hang = 'Hoàn thành' THEN tong_tien ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN trang_thai_don_hang != 'Hủy' THEN tong_tien ELSE 0 END), 0) AS potential_revenue,
        COUNT(*) AS total_orders,
        SUM(CASE WHEN trang_thai_don_hang = 'Mới' THEN 1 ELSE 0 END) AS count_moi,
        SUM(CASE WHEN trang_thai_don_hang = 'Đang xử lý' THEN 1 ELSE 0 END) AS count_xu_ly,
        SUM(CASE WHEN trang_thai_don_hang = 'Hoàn thành' THEN 1 ELSE 0 END) AS count_hoan_thanh,
        SUM(CASE WHEN trang_thai_don_hang = 'Hủy' THEN 1 ELSE 0 END) AS count_huy
       FROM don_hang ${orderWhereClause}`,
      orderParams
    );

    // 2. Product and Stock calculations (Overall catalog status)
    const [[productRow]] = await db.query(
      `SELECT 
        COUNT(*) AS total_products,
        COALESCE(SUM(so_luong), 0) AS total_stock
       FROM san_pham 
       WHERE is_deleted = 0`
    );

    // 3. User calculation
    const [[userRow]] = await db.query(
      `SELECT COUNT(*) AS total_users FROM users`
    );

    // 4. Contact message calculation
    const [[contactRow]] = await db.query(
      `SELECT COUNT(*) AS total_contacts, SUM(CASE WHEN trang_thai = 'Mới' THEN 1 ELSE 0 END) AS new_contacts FROM lien_he`
    );

    // 5. Top 5 selling products within date filter if applied
    let topProductsSql = `SELECT sp.id, sp.ten_san_pham, sp.gia, sp.so_luong, dm.ten_danh_muc,
              COALESCE(SUM(ct.so_luong), 0) AS total_sold,
              (SELECT duong_dan FROM anh_san_pham WHERE id_san_pham = sp.id ORDER BY anh_chinh DESC, id ASC LIMIT 1) AS duong_dan_anh
       FROM san_pham sp
       LEFT JOIN danh_muc dm ON sp.id_danh_muc = dm.id
       LEFT JOIN chi_tiet_don_hang ct ON sp.id = ct.id_san_pham`;

    let topProductsParams = [];
    if (orderWhereClause) {
      topProductsSql += ` LEFT JOIN don_hang dh ON ct.id_don_hang = dh.id`;
      const dhWhere = orderWhereClause.replace('WHERE', 'AND').replace(/ngay_dat/g, 'dh.ngay_dat');
      topProductsSql += ` WHERE sp.is_deleted = 0 ${dhWhere}`;
      topProductsParams = [...orderParams];
    } else {
      topProductsSql += ` WHERE sp.is_deleted = 0`;
    }

    topProductsSql += ` GROUP BY sp.id ORDER BY total_sold DESC, sp.id DESC LIMIT 5`;

    const [topProducts] = await db.query(topProductsSql, topProductsParams);

    // 6. Category breakdown
    const [categoriesStats] = await db.query(
      `SELECT dm.ten_danh_muc, COUNT(sp.id) AS count_products
       FROM danh_muc dm
       LEFT JOIN san_pham sp ON dm.id = sp.id_danh_muc AND sp.is_deleted = 0
       GROUP BY dm.id
       ORDER BY count_products DESC`
    );

    res.json({
      revenue: {
        completed: Number(revRow.total_revenue || 0),
        potential: Number(revRow.potential_revenue || 0)
      },
      orders: {
        total: Number(revRow.total_orders || 0),
        moi: Number(revRow.count_moi || 0),
        xu_ly: Number(revRow.count_xu_ly || 0),
        hoan_thanh: Number(revRow.count_hoan_thanh || 0),
        huy: Number(revRow.count_huy || 0)
      },
      products: {
        total: Number(productRow.total_products || 0),
        stock: Number(productRow.total_stock || 0)
      },
      users: {
        total: Number(userRow.total_users || 0)
      },
      contacts: {
        total: Number(contactRow.total_contacts || 0),
        new: Number(contactRow.new_contacts || 0)
      },
      topProducts,
      categoriesStats,
      filter: {
        period: period || 'all',
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Stats Summary Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
