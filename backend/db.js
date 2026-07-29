// db.js
// Universal Pure JavaScript Database Engine (0 Native C Dependencies, 0 GLIBC Errors)
// Supports MySQL if remote DB configured, or embedded Pure JS Data Store for Render Cloud
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let mode = 'PURE_JS';
let mysqlPool = null;

const storePath = path.join(__dirname, 'data_store.json');

// Memory Data Store
let store = {
  danh_muc: [],
  san_pham: [],
  anh_san_pham: [],
  don_hang: [],
  chi_tiet_don_hang: [],
  banners: [],
  tai_khoan: [],
  lich_su_hoat_dong: [],
  lien_he: []
};

function saveStore() {
  try {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving data_store.json:', err.message);
  }
}

function loadStore() {
  if (fs.existsSync(storePath)) {
    try {
      const raw = fs.readFileSync(storePath, 'utf8');
      const loaded = JSON.parse(raw);
      if (loaded && Array.isArray(loaded.san_pham) && loaded.san_pham.length > 0 && Array.isArray(loaded.anh_san_pham) && loaded.anh_san_pham.length > 0) {
        store = { ...store, ...loaded };
      } else {
        initSeedStore();
      }
    } catch (e) {
      initSeedStore();
    }
  } else {
    initSeedStore();
  }

  // Ensure array safety
  if (!Array.isArray(store.danh_muc)) store.danh_muc = [];
  if (!Array.isArray(store.san_pham)) store.san_pham = [];
  if (!Array.isArray(store.anh_san_pham)) store.anh_san_pham = [];
  if (!Array.isArray(store.don_hang)) store.don_hang = [];
  if (!Array.isArray(store.chi_tiet_don_hang)) store.chi_tiet_don_hang = [];
  if (!Array.isArray(store.banners)) store.banners = [];
  if (!Array.isArray(store.tai_khoan)) store.tai_khoan = [];
  if (!Array.isArray(store.lich_su_hoat_dong)) store.lich_su_hoat_dong = [];
  if (!Array.isArray(store.lien_he)) store.lien_he = [];
}

function initSeedStore() {
  const hashedPassword = bcrypt.hashSync('123456', 10);

  store = {
    danh_muc: [
      { id: 1, ten_danh_muc: 'Laptop', mo_ta: 'Laptop văn phòng, Gaming, Workstation' },
      { id: 2, ten_danh_muc: 'PC Gaming', mo_ta: 'Máy tính chơi game & Workstation đồ họa' },
      { id: 3, ten_danh_muc: 'Linh kiện PC', mo_ta: 'CPU, RAM, VGA, Mainboard, SSD, Nguồn' },
      { id: 4, ten_danh_muc: 'Màn hình', mo_ta: 'Màn hình máy tính 144Hz, 4K' }
    ],
    san_pham: [
      {
        id: 1,
        ten_san_pham: 'CPU Intel Core i5 13400F (Up To 4.6GHz, 10 Nhân 16 Luồng)',
        id_danh_muc: 3,
        hang_san_xuat: 'Intel',
        gia: 4890000,
        gia_khuyen_mai: 4590000,
        so_luong: 20,
        trang_thai: 1,
        is_noi_bat: 1,
        is_moi: 1,
        is_flash_sale: 1,
        mo_ta: 'Socket: LGA1700\nSố nhân: 10 Nhân\nSố luồng: 16 Luồng\nXung nhịp: Up to 4.6 GHz\nCache: 20MB\nBảo hành: 36 Tháng\nCPU Intel Core i5 13400F hiệu năng cao dành cho PC chơi game và làm việc đồ họa.',
        thong_so: '{}',
        is_deleted: 0
      },
      {
        id: 2,
        ten_san_pham: 'CPU Intel Core i7 14700K (Up To 5.6GHz, 20 Nhân 28 Luồng)',
        id_danh_muc: 3,
        hang_san_xuat: 'Intel',
        gia: 10890000,
        gia_khuyen_mai: 10290000,
        so_luong: 15,
        trang_thai: 1,
        is_noi_bat: 1,
        is_moi: 1,
        is_flash_sale: 0,
        mo_ta: 'Socket: LGA1700\nSố nhân: 20 Nhân\nSố luồng: 28 Luồng\nXung nhịp: Up to 5.6 GHz\nCache: 33MB\nBảo hành: 36 Tháng\nCPU Intel Core i7 14700K đỉnh cao đồ họa 3D và Gaming chuyên nghiệp.',
        thong_so: '{}',
        is_deleted: 0
      },
      {
        id: 3,
        ten_san_pham: 'Card Màn Hình VGA NVIDIA RTX 4060 8GB GDDR6',
        id_danh_muc: 3,
        hang_san_xuat: 'NVIDIA',
        gia: 8590000,
        gia_khuyen_mai: 7990000,
        so_luong: 12,
        trang_thai: 1,
        is_noi_bat: 1,
        is_moi: 0,
        is_flash_sale: 1,
        mo_ta: 'VRAM: 8GB GDDR6\nBus Memory: 128-bit\nCổng kết nối: HDMI, DisplayPort\nBảo hành: 36 Tháng\nCard đồ họa thế hệ RTX 40 series hỗ trợ DLSS 3 và Ray Tracing cực đỉnh.',
        thong_so: '{}',
        is_deleted: 0
      },
      {
        id: 4,
        ten_san_pham: 'RAM PC DDR4 16GB Bus 3200MHz Kingston Fury Beast',
        id_danh_muc: 3,
        hang_san_xuat: 'Kingston',
        gia: 1050000,
        gia_khuyen_mai: 890000,
        so_luong: 30,
        trang_thai: 1,
        is_noi_bat: 0,
        is_moi: 1,
        is_flash_sale: 0,
        mo_ta: 'Loại RAM: DDR4\nDung lượng: 16GB\nBus: 3200MHz\nĐiện áp: 1.35V\nBảo hành: 36 Tháng',
        thong_so: '{}',
        is_deleted: 0
      },
      {
        id: 5,
        ten_san_pham: 'Màn Hình Gaming ASUS TUF 27 Inch 180Hz IPS 1ms',
        id_danh_muc: 4,
        hang_san_xuat: 'ASUS',
        gia: 4590000,
        gia_khuyen_mai: 3990000,
        so_luong: 10,
        trang_thai: 1,
        is_noi_bat: 1,
        is_moi: 1,
        is_flash_sale: 1,
        mo_ta: 'Kích thước: 27 Inch\nTấm nền: Fast IPS\nTần số quét: 180Hz\nThời gian phản hồi: 1ms\nĐộ phân giải: Full HD\nBảo hành: 36 Tháng',
        thong_so: '{}',
        is_deleted: 0
      }
    ],
    anh_san_pham: [
      { id: 1, id_san_pham: 1, duong_dan: 'uploads/products/cpu_pc.webp', anh_chinh: 1 },
      { id: 2, id_san_pham: 2, duong_dan: 'uploads/products/cpu_server.webp', anh_chinh: 1 },
      { id: 3, id_san_pham: 3, duong_dan: 'uploads/products/gpu.webp', anh_chinh: 1 },
      { id: 4, id_san_pham: 4, duong_dan: 'uploads/products/ram_pc.webp', anh_chinh: 1 },
      { id: 5, id_san_pham: 5, duong_dan: 'uploads/products/monitor.webp', anh_chinh: 1 }
    ],
    don_hang: [],
    chi_tiet_don_hang: [],
    banners: [
      { id: 1, tieu_de: 'Siêu Khuyến Mãi Linh Kiện Máy Tính 2026', duong_dan_anh: 'flash_banner1.png', lien_ket: '#', thu_tu: 1, trang_thai: 1 },
      { id: 2, tieu_de: 'PC Gaming & Workstation Đồ Họa Đỉnh Cao', duong_dan_anh: 'banner2.png', lien_ket: '#', thu_tu: 2, trang_thai: 1 }
    ],
    tai_khoan: [
      { id: 1, ten_dang_nhap: 'admin', mat_khau: hashedPassword, ho_ten: 'Quản Trị Viên Hệ Thống', chuc_vu: 'admin' },
      { id: 2, ten_dang_nhap: 'manager', mat_khau: hashedPassword, ho_ten: 'Nhân Viên Manager', chuc_vu: 'manager' }
    ],
    lich_su_hoat_dong: [],
    lien_he: []
  };

  saveStore();
}

loadStore();

// Pure JS Query Processor
function executePureJsQuery(sql, params = []) {
  const cleanSql = sql.trim();
  const lowerSql = cleanSql.toLowerCase();

  // 1. SELECT queries
  if (lowerSql.startsWith('select')) {
    let tableName = '';

    if (lowerSql.includes('from san_pham')) tableName = 'san_pham';
    else if (lowerSql.includes('from danh_muc')) tableName = 'danh_muc';
    else if (lowerSql.includes('from banners')) tableName = 'banners';
    else if (lowerSql.includes('from don_hang')) tableName = 'don_hang';
    else if (lowerSql.includes('from chi_tiet_don_hang')) tableName = 'chi_tiet_don_hang';
    else if (lowerSql.includes('from tai_khoan')) tableName = 'tai_khoan';
    else if (lowerSql.includes('from lich_su_hoat_dong')) tableName = 'lich_su_hoat_dong';
    else if (lowerSql.includes('from anh_san_pham')) tableName = 'anh_san_pham';
    else if (lowerSql.includes('from lien_he')) tableName = 'lien_he';
    else {
      const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      if (fromMatch) tableName = fromMatch[1].trim();
    }

    if (tableName === 'sp') tableName = 'san_pham';
    if (tableName === 'dm') tableName = 'danh_muc';

    let items = (store[tableName] && Array.isArray(store[tableName])) ? [...store[tableName]] : [];

    // Filter is_deleted
    if (tableName === 'san_pham' && lowerSql.includes('is_deleted = 0')) {
      items = items.filter(i => !i.is_deleted);
    }

    // Join category name and image for san_pham
    if (tableName === 'san_pham') {
      items = items.map(p => {
        const cat = (store.danh_muc || []).find(c => c.id === Number(p.id_danh_muc));
        const img = (store.anh_san_pham || []).find(a => a.id_san_pham === p.id && a.anh_chinh === 1) || (store.anh_san_pham || []).find(a => a.id_san_pham === p.id);
        return {
          ...p,
          ten_danh_muc: cat ? cat.ten_danh_muc : '',
          duong_dan_anh: img ? img.duong_dan : ''
        };
      });
    }

    // Filter by category if requested
    if (tableName === 'san_pham' && lowerSql.includes('id_danh_muc =') && params.length > 0) {
      const catId = Number(params[0]);
      if (catId) items = items.filter(i => Number(i.id_danh_muc) === catId);
    }

    // Filter by ID
    const idMatch = cleanSql.match(/WHERE\s+(?:sp\.)?id\s*=\s*\?/i);
    if (idMatch && params.length > 0) {
      const targetId = Number(params[0]);
      items = items.filter(i => Number(i.id) === targetId);
    }

    // Filter by id_san_pham
    const spIdMatch = cleanSql.match(/WHERE\s+id_san_pham\s*=\s*\?/i);
    if (spIdMatch && params.length > 0) {
      const targetSpId = Number(params[0]);
      items = items.filter(i => Number(i.id_san_pham) === targetSpId);
    }

    // Filter by ten_dang_nhap
    const userMatch = cleanSql.match(/WHERE\s+ten_dang_nhap\s*=\s*\?/i);
    if (userMatch && params.length > 0) {
      const targetUser = String(params[0]).toLowerCase();
      items = items.filter(i => String(i.ten_dang_nhap).toLowerCase() === targetUser);
    }

    // Filter active banners
    if (tableName === 'banners' && lowerSql.includes('trang_thai = 1')) {
      items = items.filter(b => Number(b.trang_thai) === 1);
    }

    // Order by ID DESC / thu_tu ASC / thoi_gian DESC
    if (lowerSql.includes('order by thu_tu asc')) {
      items.sort((a, b) => Number(a.thu_tu || 0) - Number(b.thu_tu || 0));
    } else if (lowerSql.includes('order by id desc')) {
      items.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (lowerSql.includes('order by thoi_gian desc')) {
      items.sort((a, b) => new Date(b.thoi_gian || 0) - new Date(a.thoi_gian || 0));
    }

    // COUNT query
    if (lowerSql.includes('count(')) {
      return [{ count: items.length }];
    }

    return items;
  }

  // 2. INSERT queries
  if (lowerSql.startsWith('insert')) {
    const intoMatch = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
    const tableName = intoMatch ? intoMatch[1].trim() : '';

    if (!Array.isArray(store[tableName])) store[tableName] = [];

    const newId = store[tableName].length > 0 ? Math.max(...store[tableName].map(i => Number(i.id) || 0)) + 1 : 1;
    const newObj = { id: newId };

    const colMatch = cleanSql.match(/\(([^)]+)\)\s+VALUES/i);
    if (colMatch && params.length > 0) {
      const cols = colMatch[1].split(',').map(c => c.trim().replace(/[`"]/g, ''));
      cols.forEach((col, idx) => {
        if (idx < params.length) {
          newObj[col] = params[idx];
        }
      });
    }

    if (tableName === 'lich_su_hoat_dong' || tableName === 'don_hang') {
      newObj.thoi_gian = new Date().toISOString();
      newObj.ngay_dat = new Date().toISOString();
    }

    store[tableName].push(newObj);
    saveStore();

    return { insertId: newId, affectedRows: 1 };
  }

  // 3. UPDATE queries
  if (lowerSql.startsWith('update')) {
    const updateMatch = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    const tableName = updateMatch ? updateMatch[1].trim() : '';

    if (store[tableName] && Array.isArray(store[tableName])) {
      let affected = 0;
      const targetId = params.length > 0 ? Number(params[params.length - 1]) : null;

      if (targetId) {
        const item = store[tableName].find(i => Number(i.id) === targetId);
        if (item) {
          if (lowerSql.includes('is_deleted = 1')) item.is_deleted = 1;
          if (lowerSql.includes('trang_thai')) item.trang_thai = params[0];
          if (lowerSql.includes('trang_thai_don_hang')) item.trang_thai_don_hang = params[0];

          affected = 1;
          saveStore();
        }
      }
      return { insertId: 0, affectedRows: affected };
    }
  }

  // 4. DELETE queries
  if (lowerSql.startsWith('delete')) {
    const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const tableName = fromMatch ? fromMatch[1].trim() : '';

    if (store[tableName] && Array.isArray(store[tableName]) && params.length > 0) {
      const targetId = Number(params[0]);
      const initialLen = store[tableName].length;
      store[tableName] = store[tableName].filter(i => Number(i.id) !== targetId);
      saveStore();
      return { insertId: 0, affectedRows: initialLen - store[tableName].length };
    }
  }

  return [];
}

// Unified Query method returning [rows, null] matching mysql2
async function query(sql, params = []) {
  if (mode === 'MYSQL' && mysqlPool) {
    try {
      return await mysqlPool.query(sql, params);
    } catch (err) {
      console.warn('⚠️ Remote MySQL failed, using Pure JS Engine:', err.message);
      mode = 'PURE_JS';
    }
  }

  const result = executePureJsQuery(sql, params);
  return [result, null];
}

// Optional Remote MySQL initialization
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
        connectTimeout: 3000
      });

      const conn = await mysqlPool.getConnection();
      conn.release();
      mode = 'MYSQL';
      console.log('✅ Connected to Remote MySQL Database');
      return;
    } catch (err) {
      console.log('ℹ️ Remote MySQL not configured, using Pure JS Database Engine');
    }
  }

  console.log('⚡ Using Pure JavaScript Embedded Database Engine (Zero C/GLIBC dependencies)');
}

initDatabase().catch(err => console.error('DB init error:', err));

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
