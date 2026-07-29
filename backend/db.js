// db.js
// Universal Database Module: Fast embedded SQLite with MySQL compatibility wrapper
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let mode = 'SQLITE'; // Default to SQLite for 0ms instant startup & Cloud compatibility
let mysqlPool = null;
let sqliteDb = null;
let sqliteInitPromise = null;

const sqlitePath = path.join(__dirname, 'database.sqlite');

function initSqlite() {
  if (sqliteInitPromise) return sqliteInitPromise;

  sqliteInitPromise = new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(sqlitePath, async (err) => {
      if (err) return reject(err);
      console.log('⚡ SQLite Database connected:', sqlitePath);
      try {
        await setupSqliteTables();
        resolve();
      } catch (setupErr) {
        reject(setupErr);
      }
    });
  });

  return sqliteInitPromise;
}

function runSqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ insertId: this.lastID, affectedRows: this.changes });
    });
  });
}

function allSqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function setupSqliteTables() {
  await runSqlite(`CREATE TABLE IF NOT EXISTS danh_muc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_danh_muc TEXT NOT NULL,
    mo_ta TEXT
  )`);

  await runSqlite(`CREATE TABLE IF NOT EXISTS san_pham (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_san_pham TEXT NOT NULL,
    id_danh_muc INTEGER,
    hang_san_xuat TEXT,
    gia REAL NOT NULL,
    gia_khuyen_mai REAL,
    so_luong INTEGER DEFAULT 10,
    trang_thai INTEGER DEFAULT 1,
    is_noi_bat INTEGER DEFAULT 0,
    is_moi INTEGER DEFAULT 0,
    is_flash_sale INTEGER DEFAULT 0,
    mo_ta TEXT,
    thong_so TEXT,
    is_deleted INTEGER DEFAULT 0
  )`);

  await runSqlite(`CREATE TABLE IF NOT EXISTS anh_san_pham (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_san_pham INTEGER NOT NULL,
    duong_dan TEXT NOT NULL,
    anh_chinh INTEGER DEFAULT 0
  )`);

  await runSqlite(`CREATE TABLE IF NOT EXISTS don_hang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_khach_hang TEXT,
    so_dien_thoai TEXT,
    dia_chi TEXT,
    phuong_thuc_nhan_hang TEXT,
    phuong_thuc_thanh_toan TEXT,
    tong_tien REAL DEFAULT 0,
    trang_thai_don_hang TEXT DEFAULT 'Mới',
    trang_thai TEXT DEFAULT 'Mới',
    ghi_chu TEXT,
    ngay_dat DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await runSqlite(`CREATE TABLE IF NOT EXISTS chi_tiet_don_hang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_don_hang INTEGER NOT NULL,
    id_san_pham INTEGER NOT NULL,
    so_luong INTEGER DEFAULT 1,
    don_gia REAL DEFAULT 0
  )`);

  await runSqlite(`CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tieu_de TEXT,
    duong_dan_anh TEXT NOT NULL,
    lien_ket TEXT DEFAULT '#',
    thu_tu INTEGER DEFAULT 0,
    trang_thai INTEGER DEFAULT 1
  )`);

  await runSqlite(`CREATE TABLE IF NOT EXISTS tai_khoan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_dang_nhap TEXT UNIQUE NOT NULL,
    mat_khau TEXT NOT NULL,
    ho_ten TEXT,
    chuc_vu TEXT DEFAULT 'manager'
  )`);

  await runSqlite(`CREATE TABLE IF NOT EXISTS lich_su_hoat_dong (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_nguoi_dung TEXT,
    hanh_dong TEXT,
    loai_doi_tuong TEXT,
    chi_tiet TEXT,
    thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed sample categories
  const cats = await allSqlite('SELECT COUNT(*) as count FROM danh_muc');
  if (cats[0].count === 0) {
    await runSqlite('INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES (?, ?)', ['Laptop', 'Laptop văn phòng, Gaming, Workstation']);
    await runSqlite('INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES (?, ?)', ['PC Gaming', 'Máy tính chơi game & Workstation đồ họa']);
    await runSqlite('INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES (?, ?)', ['Linh kiện PC', 'CPU, RAM, VGA, Mainboard, SSD, Nguồn']);
    await runSqlite('INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES (?, ?)', ['Màn hình', 'Màn hình máy tính 144Hz, 4K']);
  }

  // Seed sample products
  const prods = await allSqlite('SELECT COUNT(*) as count FROM san_pham');
  if (prods[0].count === 0) {
    const sampleProducts = [
      {
        ten: 'CPU Intel Core i5 13400F (Up To 4.6GHz, 10 Nhân 16 Luồng)',
        cat: 3, brand: 'Intel', gia: 4890000, km: 4590000,
        desc: 'Socket: LGA1700\nSố nhân: 10 Nhân\nSố luồng: 16 Luồng\nXung nhịp: Up to 4.6 GHz\nCache: 20MB\nBảo hành: 36 Tháng\nCPU Intel Core i5 13400F hiệu năng cao dành cho PC chơi game và làm việc đồ họa.',
        img: 'uploads/products/cpu_pc.webp', is_noi_bat: 1, is_moi: 1, is_flash: 1
      },
      {
        ten: 'CPU Intel Core i7 14700K (Up To 5.6GHz, 20 Nhân 28 Luồng)',
        cat: 3, brand: 'Intel', gia: 10890000, km: 10290000,
        desc: 'Socket: LGA1700\nSố nhân: 20 Nhân\nSố luồng: 28 Luồng\nXung nhịp: Up to 5.6 GHz\nCache: 33MB\nBảo hành: 36 Tháng\nCPU Intel Core i7 14700K đỉnh cao đồ họa 3D và Gaming chuyên nghiệp.',
        img: 'uploads/products/cpu_server.webp', is_noi_bat: 1, is_moi: 1, is_flash: 0
      },
      {
        ten: 'Card Màn Hình VGA NVIDIA RTX 4060 8GB GDDR6',
        cat: 3, brand: 'NVIDIA', gia: 8590000, km: 7990000,
        desc: 'VRAM: 8GB GDDR6\nBus Memory: 128-bit\nCổng kết nối: HDMI, DisplayPort\nBảo hành: 36 Tháng\nCard đồ họa thế hệ RTX 40 series hỗ trợ DLSS 3 và Ray Tracing cực đỉnh.',
        img: 'uploads/products/gpu.webp', is_noi_bat: 1, is_moi: 0, is_flash: 1
      },
      {
        ten: 'RAM PC DDR4 16GB Bus 3200MHz Kingston Fury Beast',
        cat: 3, brand: 'Kingston', gia: 1050000, km: 890000,
        desc: 'Loại RAM: DDR4\nDung lượng: 16GB\nBus: 3200MHz\nĐiện áp: 1.35V\nBảo hành: 36 Tháng',
        img: 'uploads/products/ram_pc.webp', is_noi_bat: 0, is_moi: 1, is_flash: 0
      },
      {
        ten: 'Màn Hình Gaming ASUS TUF 27 Inch 180Hz IPS 1ms',
        cat: 4, brand: 'ASUS', gia: 4590000, km: 3990000,
        desc: 'Kích thước: 27 Inch\nTấm nền: Fast IPS\nTần số quét: 180Hz\nThời gian phản hồi: 1ms\nĐộ phân giải: Full HD\nBảo hành: 36 Tháng',
        img: 'uploads/products/monitor.webp', is_noi_bat: 1, is_moi: 1, is_flash: 1
      }
    ];

    for (const p of sampleProducts) {
      const res = await runSqlite(`INSERT INTO san_pham 
        (ten_san_pham, id_danh_muc, hang_san_xuat, gia, gia_khuyen_mai, so_luong, trang_thai, is_noi_bat, is_moi, is_flash_sale, mo_ta, thong_so)
        VALUES (?, ?, ?, ?, ?, 20, 1, ?, ?, ?, ?, '{}')`,
        [p.ten, p.cat, p.brand, p.gia, p.km, p.is_noi_bat, p.is_moi, p.is_flash, p.desc]
      );
      await runSqlite('INSERT INTO anh_san_pham (id_san_pham, duong_dan, anh_chinh) VALUES (?, ?, 1)', [res.insertId, p.img]);
    }
  }

  // Seed sample banners
  const banners = await allSqlite('SELECT COUNT(*) as count FROM banners');
  if (banners[0].count === 0) {
    await runSqlite('INSERT INTO banners (tieu_de, duong_dan_anh, lien_ket, thu_tu, trang_thai) VALUES (?, ?, ?, 1, 1)',
      ['Siêu Khuyến Mãi Linh Kiện Máy Tính 2026', 'flash_banner1.png', '#']
    );
    await runSqlite('INSERT INTO banners (tieu_de, duong_dan_anh, lien_ket, thu_tu, trang_thai) VALUES (?, ?, ?, 2, 1)',
      ['PC Gaming & Workstation Đồ Họa Đỉnh Cao', 'banner2.png', '#']
    );
  }

  // Seed admin user
  const users = await allSqlite('SELECT COUNT(*) as count FROM tai_khoan');
  if (users[0].count === 0) {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('123456', 10);
    await runSqlite('INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, chuc_vu) VALUES (?, ?, ?, ?)',
      ['admin', hashed, 'Quản Trị Viên Hệ Thống', 'admin']
    );
    await runSqlite('INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, chuc_vu) VALUES (?, ?, ?, ?)',
      ['manager', hashed, 'Nhân Viên Manager', 'manager']
    );
  }
}

// Adapt MySQL query syntax to SQLite
function adaptQuery(sql) {
  let s = sql;
  s = s.replace(/NOW\(\)/gi, "CURRENT_TIMESTAMP");
  s = s.replace(/ISNULL\(/gi, "IFNULL(");
  s = s.replace(/LIMIT\s+(\d+)\s*,\s*(\d+)/gi, "LIMIT $2 OFFSET $1");
  return s;
}

// Main Query method returning [rows, fields] format matching mysql2
async function query(sql, params = []) {
  if (mode === 'MYSQL' && mysqlPool) {
    try {
      return await mysqlPool.query(sql, params);
    } catch (err) {
      console.warn('⚠️ MySQL Query Failed, switching to SQLite:', err.message);
      mode = 'SQLITE';
    }
  }

  await initSqlite();
  const cleanSql = adaptQuery(sql);
  const cleanParams = Array.isArray(params) ? params : [params];
  const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)/i.test(cleanSql);

  if (isSelect) {
    const rows = await allSqlite(cleanSql, cleanParams);
    return [rows, null];
  } else {
    const res = await runSqlite(cleanSql, cleanParams);
    return [res, null];
  }
}

// Try MySQL if DB_HOST is configured
async function initDatabase() {
  if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.USE_MYSQL === 'true') {
    try {
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ban_hang_db',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 4000
      });

      const conn = await mysqlPool.getConnection();
      conn.release();
      mode = 'MYSQL';
      console.log('✅ Connected to Remote MySQL Database');
      return;
    } catch (err) {
      console.log('ℹ️ Remote MySQL unavailable, using SQLite');
    }
  }

  // Otherwise, use SQLite
  await initSqlite();
}

initDatabase().catch(err => console.error('Database initialization error:', err));

module.exports = {
  query: query,
  execute: query,
  getConnection: async () => {
    return {
      query: query,
      execute: query,
      release: () => {}
    };
  }
};
