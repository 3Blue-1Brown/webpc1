// db.js
// Connection pool using mysql2 connected to Clever Cloud Cloud Database
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'bqkzt4ns3c4znylrimuv-mysql.services.clever-cloud.com',
  user: process.env.DB_USER || 'uge4ns0rgb6l8c2c',
  password: process.env.DB_PASSWORD || '5BsD3ImKEWv0zs1ckw53',
  database: process.env.DB_NAME || 'bqkzt4ns3c4znylrimuv',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 3, // Reduced to 3 to stay within Clever Cloud max 5 connections during Render container restarts
  queueLimit: 1000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Periodic heartbeat (every 35s) to keep connections alive
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    // Ignore transient heartbeat errors
  }
}, 35000);

// Test connection on load gracefully
pool.query('SELECT 1')
  .then(() => {
    console.log('✅ Connected to Clever Cloud MySQL Database');
  })
  .catch(err => {
    console.warn('ℹ️ DB initial connection note:', err.message);
  });

module.exports = pool;
