-- ========================================================
-- DATABASE SCHEMA: APLIKASI KASIR (POINT OF SALE) SMK
-- ========================================================

CREATE DATABASE IF NOT EXISTS `db_kasir_pos`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `db_kasir_pos`;

-- 1. TABEL USERS
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nama_lengkap` VARCHAR(100) NOT NULL DEFAULT 'User Kasir',
  `foto` MEDIUMTEXT NULL,
  `role` ENUM('admin', 'petugas') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL PRODUCTS (BARANG)
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `barcode` VARCHAR(100) NOT NULL UNIQUE,
  `nama_barang` VARCHAR(150) NOT NULL,
  `harga` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `stok` INT NOT NULL DEFAULT 0,
  `kategori` VARCHAR(100) NOT NULL DEFAULT 'Umum',
  `satuan` VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_barcode (`barcode`),
  INDEX idx_nama (`nama_barang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABEL MEMBERS
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `no_hp` VARCHAR(20) NOT NULL,
  `alamat` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_no_hp (`no_hp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABEL TRANSACTIONS (TRANSAKSI KASIR)
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_no` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `member_id` INT NULL,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `bayar` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `kembalian` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `tanggal_transaksi` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL,
  INDEX idx_tanggal (`tanggal_transaksi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABEL TRANSACTION_DETAILS (RINCIAN BARANG TRANSAKSI)
CREATE TABLE IF NOT EXISTS `transaction_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `jumlah` INT NOT NULL,
  `harga` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABEL STOCK_LOGS (RIWAYAT UPDATE STOK OLEH ADMIN)
CREATE TABLE IF NOT EXISTS `stock_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `tipe` ENUM('masuk', 'keluar') NOT NULL,
  `jumlah` INT NOT NULL,
  `stok_sebelum` INT NOT NULL,
  `stok_sesudah` INT NOT NULL,
  `keterangan` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
