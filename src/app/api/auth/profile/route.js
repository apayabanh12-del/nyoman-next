import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { json, fail, readBody, withAuth } from '@/lib/server';

// Update profil & foto profil
export const PUT = withAuth(async ({ request, user }) => {
  try {
    const { nama_lengkap, foto, password } = await readBody(request);
    const userId = user.id;

    if (!nama_lengkap || !nama_lengkap.trim()) {
      return fail('Nama lengkap tidak boleh kosong!', 400);
    }

    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return fail('Password baru minimal 6 karakter!', 400);
      }
      const hashed = await bcrypt.hash(password.trim(), 10);
      await pool.query(
        'UPDATE users SET nama_lengkap = ?, foto = ?, password = ? WHERE id = ?',
        [nama_lengkap.trim(), foto || null, hashed, userId]
      );
    } else {
      await pool.query('UPDATE users SET nama_lengkap = ?, foto = ? WHERE id = ?', [
        nama_lengkap.trim(),
        foto || null,
        userId,
      ]);
    }

    const [rows] = await pool.query(
      'SELECT id, username, nama_lengkap, foto, role FROM users WHERE id = ?',
      [userId]
    );

    return json({
      success: true,
      message: 'Foto profil dan data berhasil diperbarui!',
      user: rows[0],
    });
  } catch (error) {
    console.error('Error updateProfile:', error);
    return fail('Gagal memperbarui profil pengguna.', 500);
  }
});
