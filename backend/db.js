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
  connectionLimit: 5, // Up to 5 connections for Clever Cloud free max limit
  queueLimit: 1000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Periodic heartbeat (every 30s) to keep connections alive and prevent ETIMEDOUT / ECONNRESET on Clever Cloud
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.warn('⚠️ DB Heartbeat reconnecting...', err.message);
  }
}, 30000);

// Test connection on load
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to Clever Cloud MySQL Database');
    conn.release();
  })
  .catch(err => {
    console.warn('⚠️ DB connection info:', err.message);
  });

module.exports = pool;
