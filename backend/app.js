require('dotenv').config();
const express = require('express');
const compression = require('compression');
const path = require('path');
const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const bannersRouter = require('./routes/banners');
const contactsRouter = require('./routes/contacts');
const ordersRouter = require('./routes/orders');

const { router: authRouter } = require('./routes/auth');
const usersRouter = require('./routes/users');
const activityLogsRouter = require('./routes/activity_logs');
const statsRouter = require('./routes/stats');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Gzip compression — reduces response size ~70%
app.use(compression());

// Serve static frontend files (Disable cache for HTML files so updates reflect immediately)
app.use(express.static(path.join(__dirname, '..', 'frontend'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '30d'
}));

app.use(express.json());
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/activity-logs', activityLogsRouter);
app.use('/api/stats', statsRouter);


// Start the server
app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
