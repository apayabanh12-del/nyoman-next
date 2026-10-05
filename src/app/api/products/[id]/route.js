import pool from '@/lib/db';
import { json, fail, readBody, withAuth } from '@/lib/server';

// Detail 1 produk by ID
export const GET = withAuth(async ({ params }) => {
  try {
    const { id } = params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (rows.length === 0) {
      return fail('Produk tidak ditemukan.', 404);
    }

    return json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error getProductById:', error);
    return fail('Gagal mengambil detail produk.', 500);
  }
});

// Update data produk (HANYA ADMIN)
export const PUT = withAuth(
  async ({ request, params }) => {
    try {
      const { id } = params;
      const { barcode, nama_barang, harga, kategori, satuan } = await readBody(request);

      if (!barcode || !nama_barang || harga === undefined) {
        return fail('Barcode, nama barang, dan harga wajib diisi!', 400);
      }

      const numHarga = Number(harga);
      if (isNaN(numHarga) || numHarga < 0) {
        return fail('Harga harus berupa angka dan tidak boleh minus.', 400);
      }

      const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      if (existing.length === 0) {
        return fail('Produk tidak ditemukan.', 404);
      }

      const [dup] = await pool.query(
        'SELECT id FROM products WHERE barcode = ? AND id != ?',
        [barcode.trim(), id]
      );

      if (dup.length > 0) {
        return fail(`Barcode "${barcode.trim()}" sudah digunakan oleh produk lain!`, 400);
      }

      await pool.query(
        'UPDATE products SET barcode = ?, nama_barang = ?, harga = ?, kategori = ?, satuan = ? WHERE id = ?',
        [
          barcode.trim(),
          nama_barang.trim(),
          numHarga,
          (kategori || 'Umum').trim(),
          (satuan || 'Pcs').trim(),
          id,
        ]
      );

      return json({ success: true, message: 'Data produk berhasil diperbarui!' });
    } catch (error) {
      console.error('Error updateProduct:', error);
      return fail('Terjadi kesalahan saat memperbarui produk.', 500);
    }
  },
  { role: 'admin' }
);

// Hapus produk (HANYA ADMIN)
export const DELETE = withAuth(
  async ({ params }) => {
    try {
      const { id } = params;

      const [transactions] = await pool.query(
        'SELECT id FROM transaction_details WHERE product_id = ? LIMIT 1',
        [id]
      );

      if (transactions.length > 0) {
        return fail(
          'Barang ini tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan. Anda dapat mengubah stoknya menjadi 0 jika barang tidak lagi dijual.',
          400
        );
      }

      const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return fail('Produk tidak ditemukan.', 404);
      }

      return json({ success: true, message: 'Produk berhasil dihapus!' });
    } catch (error) {
      console.error('Error deleteProduct:', error);
      return fail('Gagal menghapus produk.', 500);
    }
  },
  { role: 'admin' }
);
