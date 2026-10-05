import pool from '@/lib/db';
import { json, fail, readBody, withAuth } from '@/lib/server';

// Update stok barang khusus ADMIN. Aturan: stok tidak boleh minus.
export const POST = withAuth(
  async ({ request, user, params }) => {
    const connection = await pool.getConnection();
    try {
      const { id } = params;
      const { tipe, jumlah, keterangan } = await readBody(request);

      const numJumlah = Number(jumlah);
      if (!tipe || isNaN(numJumlah) || numJumlah <= 0) {
        return fail(
          'Tipe perubahan (masuk/keluar) dan jumlah harus valid serta lebih dari 0!',
          400
        );
      }

      await connection.beginTransaction();

      // Lock baris produk dengan FOR UPDATE
      const [rows] = await connection.query(
        'SELECT id, nama_barang, stok FROM products WHERE id = ? FOR UPDATE',
        [id]
      );

      if (rows.length === 0) {
        await connection.rollback();
        return fail('Produk tidak ditemukan.', 404);
      }

      const product = rows[0];
      const currentStock = Number(product.stok);
      let newStock = currentStock;

      if (tipe === 'masuk') {
        newStock = currentStock + numJumlah;
      } else if (tipe === 'keluar') {
        if (currentStock < numJumlah) {
          await connection.rollback();
          return fail(
            `Stok tidak mencukupi! Stok saat ini ${currentStock}, pengurangan ${numJumlah} akan menyebabkan stok minus.`,
            400
          );
        }
        newStock = currentStock - numJumlah;
      } else {
        await connection.rollback();
        return fail('Tipe harus "masuk" atau "keluar".', 400);
      }

      await connection.query('UPDATE products SET stok = ? WHERE id = ?', [newStock, id]);

      await connection.query(
        'INSERT INTO stock_logs (product_id, user_id, tipe, jumlah, stok_sebelum, stok_sesudah, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          user.id,
          tipe,
          numJumlah,
          currentStock,
          newStock,
          (keterangan || (tipe === 'masuk' ? 'Penambahan stok manual' : 'Pengurangan stok manual')).trim(),
        ]
      );

      await connection.commit();

      return json({
        success: true,
        message: `Stok "${product.nama_barang}" berhasil diupdate dari ${currentStock} menjadi ${newStock}.`,
        stok: newStock,
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error updateStock:', error);
      return fail('Gagal memperbarui stok barang.', 500);
    } finally {
      connection.release();
    }
  },
  { role: 'admin' }
);
