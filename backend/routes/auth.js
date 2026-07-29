const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REMEMBER_EXPIRES = process.env.JWT_REMEMBER_EXPIRES || '30d';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = { id: decoded.id, role: decoded.role };
    next();
  });
};

// Role based access control middleware
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  const userRole = (req.user.role || '').toLowerCase();
  const allowedRoles = roles.map(r => r.toLowerCase());
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'Bạn không có quyền thực hiện chức năng này.' });
  }
  next();
};

const verifyAdmin = requireRole('admin');
const verifyManagerOrAdmin = requireRole('admin', 'manager');

// ---------- Registration ----------
router.post(
  '/register',
  [
    body('fullName').notEmpty().withMessage('Họ và tên không được để trống'),
    body('username').notEmpty().withMessage('Tên đăng nhập không được để trống'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, username, email, password } = req.body;
    try {
      const [[usernameCheck]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
      if (usernameCheck) {
        return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (username, password, fullname, email, role, status) VALUES (?,?,?,?,"customer","active")',
        [username, passwordHash, fullName, email]
      );
      res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ---------- Login ----------
router.post(
  '/login',
  [
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const usernameOrEmail = req.body.usernameOrEmail || req.body.username;
    if (!usernameOrEmail) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc Email không được để trống' });
    }

    const { password, rememberMe } = req.body;
    try {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [usernameOrEmail, usernameOrEmail]
      );
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
      }
      const user = rows[0];
      
      if (user.status === 'locked') {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa' });
      }
      
      let passwordMatch = false;
      try {
        passwordMatch = await bcrypt.compare(password, user.password);
      } catch (err) {
        // Fallback to plain text check
      }

      if (!passwordMatch && password === user.password) {
        passwordMatch = true;
      }

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
      }

      const expiresIn = rememberMe ? JWT_REMEMBER_EXPIRES : JWT_EXPIRES_IN;
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn });

      res.json({
        message: 'Đăng nhập thành công',
        token,
        user: {
          id: user.id,
          fullName: user.fullname,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Example protected route to get current user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, fullname, email, role, avatar, phone, address, status FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    res.json({
      id: user.id,
      fullName: user.fullname,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      status: user.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, verifyToken, requireRole, verifyAdmin, verifyManagerOrAdmin };
