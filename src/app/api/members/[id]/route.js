import pool from '@/lib/db';
import { json, fail, readBody, withAuth } from '@/lib/server';

// Update member (Admin)
export const PUT = withAuth(
  async ({ request, params }) => {
    try {
      const { id } = params;
      const { nama, no_hp, alamat } = await readBody(request);

      if (!nama || !no_hp) {
        return fail('Nama dan Nomor HP member wajib diisi!', 400);
      }

      const [existing] = await pool.query(
        'SELECT id FROM members WHERE no_hp = ? AND id != ?',
        [no_hp.trim(), id]
      );

      if (existing.length > 0) {
        return fail('Nomor HP ini sudah digunakan oleh member lain!', 400);
      }

      await pool.query('UPDATE members SET nama = ?, no_hp = ?, alamat = ? WHERE id = ?', [
        nama.trim(),
        no_hp.trim(),
        (alamat || '').trim(),
        id,
      ]);

      return json({ success: true, message: 'Data member berhasil diperbarui!' });
    } catch (error) {
      console.error('Error updateMember:', error);
      return fail('Gagal memperbarui data member.', 500);
    }
  },
  { role: 'admin' }
);

// Hapus member (Admin)
export const DELETE = withAuth(
  async ({ params }) => {
    try {
      const { id } = params;
      const [result] = await pool.query('DELETE FROM members WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return fail('Member tidak ditemukan.', 404);
      }

      return json({ success: true, message: 'Member berhasil dihapus!' });
    } catch (error) {
      console.error('Error deleteMember:', error);
      return fail('Gagal menghapus member.', 500);
    }
  },
  { role: 'admin' }
);
