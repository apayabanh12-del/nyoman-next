import mysql from 'mysql2/promise';

// Cache pool di globalThis supaya tidak bikin koneksi baru tiap hot-reload (mode dev)
const globalForDb = globalThis;

const pool =
  globalForDb.__posPool ||
  mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_kasir_pos',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.__posPool = pool;

export default pool;
