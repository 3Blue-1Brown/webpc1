// routes/categories.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyAdmin, verifyManagerOrAdmin } = require('./auth');

// CREATE category
router.post('/', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  const { ten_danh_muc, mo_ta, trang_thai } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO danh_muc (ten_danh_muc, mo_ta, trang_thai) VALUES (?,?,?)',
      [ten_danh_muc, mo_ta || null, trang_thai ?? true]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// READ all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM danh_muc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// READ one category
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM danh_muc WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE category
router.put('/:id', verifyToken, verifyManagerOrAdmin, async (req, res) => {
  const { ten_danh_muc, mo_ta, trang_thai } = req.body;
  try {
    const [result] = await db.execute(
      'UPDATE danh_muc SET ten_danh_muc = ?, mo_ta = ?, trang_thai = ? WHERE id = ?',
      [ten_danh_muc, mo_ta, trang_thai, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE category (Only Admin can delete)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM danh_muc WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
