import pool from '@/lib/db';
import { json, fail, withAuth } from '@/lib/server';

// Cek profil user login
export const GET = withAuth(async ({ user }) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, nama_lengkap, foto, role, created_at FROM users WHERE id = ?',
      [user.id]
    );

    if (rows.length === 0) {
      return fail('User tidak ditemukan.', 404);
    }

    return json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('Error getMe:', error);
    return fail('Gagal mengambil data user.', 500);
  }
});
