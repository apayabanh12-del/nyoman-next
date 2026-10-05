const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_kasir_pos',
  decimalNumbers: true,
});

async function seed() {
  console.log('🌱 Memulai proses seeding data default POS Kasir SMK...');

  const connection = await pool.getConnection();
  try {
    // 1. Seed Users
    console.log('👤 Seeding Users...');
    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const hashedPetugas = await bcrypt.hash('petugas123', 10);
    const hashedSiti = await bcrypt.hash('siti123', 10);

    const users = [
      ['admin', hashedAdmin, 'Administrator Utama', 'admin'],
      ['petugas', hashedPetugas, 'Budi Petugas Kasir', 'petugas'],
      ['siti', hashedSiti, 'Siti Rahmawati', 'petugas']
    ];

    for (const u of users) {
      await connection.query(
        'INSERT INTO users (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_lengkap = VALUES(nama_lengkap), role = VALUES(role)',
        u
      );
    }

    // 2. Seed Members
    console.log('👥 Seeding Members...');
    const members = [
      ['Andi Pratama', '081234567890', 'Jl. Merdeka No. 45, Denpasar'],
      ['Dewi Lestari', '081987654321', 'Jl. Gatot Subroto No. 12, Badung'],
      ['I Made Wijaya', '085712345678', 'Jl. Teuku Umar No. 88, Denpasar'],
      ['Ni Putu Ayu', '087811223344', 'Jl. Hayam Wuruk No. 10, Tabanan']
    ];

    for (const m of members) {
      const [existing] = await connection.query('SELECT id FROM members WHERE no_hp = ?', [m[1]]);
      if (existing.length === 0) {
        await connection.query('INSERT INTO members (nama, no_hp, alamat) VALUES (?, ?, ?)', m);
      }
    }

    // 3. Seed Products (Barang Kasir Lengkap dengan Barcode Standar EAN-13 Indonesia)
    console.log('📦 Seeding Products...');
    const products = [
      ['8999999500010', 'Indomie Goreng Spesial 85g', 3500, 150, 'Makanan', 'Bungkus'],
      ['8999999500027', 'Indomie Kuah Ayam Bawang 69g', 3500, 100, 'Makanan', 'Bungkus'],
      ['8992753721112', 'Aqua Air Mineral 600ml', 3500, 120, 'Minuman', 'Botol'],
      ['8996001301124', 'Teh Botol Sosro 350ml', 4500, 80, 'Minuman', 'Botol'],
      ['8993189271101', 'Ultra Milk Coklat 250ml', 6500, 60, 'Minuman', 'Kotak'],
      ['8998866200213', 'Silverqueen Chunky Bar 95g', 22500, 45, 'Makanan Ringan', 'Pcs'],
      ['8992388111010', 'Chitato Sapi Panggang 68g', 11000, 50, 'Makanan Ringan', 'Bungkus'],
      ['8991389222019', 'Oreo Original 133g', 9500, 65, 'Makanan Ringan', 'Bungkus'],
      ['8991001100223', 'Pepsodent White 190g', 16500, 40, 'Kebutuhan Rumah', 'Pcs'],
      ['8992696404455', 'Lifebuoy Sabun Total 10 110g', 5000, 90, 'Kebutuhan Rumah', 'Pcs'],
      ['8999999002118', 'Bimoli Minyak Goreng 1 Liter', 20000, 35, 'Sembako', 'Pouch'],
      ['8998009010114', 'Gulaku Gula Pasir Tebu 1 Kg', 18000, 40, 'Sembako', 'Kg'],
      ['8992222111199', 'Beras Raja Platinum 5 Kg', 75000, 20, 'Sembako', 'Sak'],
      ['8997003411029', 'Kecap Manis Bango 520ml', 24000, 25, 'Bumbu Dapur', 'Pouch'],
      ['8991234567890', 'Kopi Kapal Api Mix 10x24g', 14500, 75, 'Minuman', 'Renceng']
    ];

    for (const p of products) {
      await connection.query(
        `INSERT INTO products (barcode, nama_barang, harga, stok, kategori, satuan)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            nama_barang = VALUES(nama_barang),
            harga = VALUES(harga),
            stok = VALUES(stok),
            kategori = VALUES(kategori),
            satuan = VALUES(satuan)`,
        p
      );
    }

    // 4. Cek apakah transaksi sudah pernah dibuat
    const [existingTrx] = await connection.query('SELECT COUNT(*) as count FROM transactions');
    if (existingTrx[0].count === 0) {
      console.log('🧾 Seeding Sampel Transaksi Awal...');
      const [kasirUsers] = await connection.query('SELECT id FROM users WHERE role = "petugas" LIMIT 1');
      const [allProd] = await connection.query('SELECT id, harga, stok FROM products LIMIT 5');
      const [allMemb] = await connection.query('SELECT id FROM members LIMIT 2');

      const kasirId = kasirUsers[0].id;
      const memberId = allMemb[0]?.id || null;

      // Sample Trx 1
      const item1 = allProd[0];
      const item2 = allProd[2];
      const qty1 = 2;
      const qty2 = 1;
      const sub1 = item1.harga * qty1;
      const sub2 = item2.harga * qty2;
      const total1 = sub1 + sub2;
      const bayar1 = 20000;
      const kembalian1 = bayar1 - total1;

      const [res1] = await connection.query(
        `INSERT INTO transactions (invoice_no, user_id, member_id, total, bayar, kembalian, tanggal_transaksi)
         VALUES ('TRX-20260928-1001', ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 1 DAY))`,
        [kasirId, memberId, total1, bayar1, kembalian1]
      );
      await connection.query(
        `INSERT INTO transaction_details (transaction_id, product_id, jumlah, harga, subtotal)
         VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
        [res1.insertId, item1.id, qty1, item1.harga, sub1, res1.insertId, item2.id, qty2, item2.harga, sub2]
      );

      // Sample Trx 2 (Hari Ini)
      const item3 = allProd[1];
      const qty3 = 3;
      const sub3 = item3.harga * qty3;
      const total2 = sub3;
      const bayar2 = 15000;
      const kembalian2 = bayar2 - total2;

      const [res2] = await connection.query(
        `INSERT INTO transactions (invoice_no, user_id, member_id, total, bayar, kembalian, tanggal_transaksi)
         VALUES ('TRX-20260929-1002', ?, NULL, ?, ?, ?, NOW())`,
        [kasirId, total2, bayar2, kembalian2]
      );
      await connection.query(
        `INSERT INTO transaction_details (transaction_id, product_id, jumlah, harga, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [res2.insertId, item3.id, qty3, item3.harga, sub3]
      );
    }

    console.log('✅ Seeding data berhasil diselesaikan dengan sukses!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal saat seeding:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

seed();
