import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { json, fail, readBody, withAuth } from '@/lib/server';

// Daftar akun petugas (HANYA ADMIN)
export const GET = withAuth(
  async ({ request }) => {
    try {
      const search = request.nextUrl.searchParams.get('search');

      let query =
        'SELECT id, username, nama_lengkap, role, created_at FROM users WHERE role = "petugas"';
      const params = [];

      if (search && search.trim() !== '') {
        query += ' AND (nama_lengkap LIKE ? OR username LIKE ?)';
        const keyword = `%${search.trim()}%`;
        params.push(keyword, keyword);
      }

      query += ' ORDER BY created_at DESC, id DESC';

      const [rows] = await pool.query(query, params);
      return json({ success: true, data: rows });
    } catch (error) {
      console.error('Error getPetugas:', error);
      return fail('Gagal mengambil data petugas.', 500);
    }
  },
  { role: 'admin' }
);

// Daftarkan akun petugas baru (HANYA ADMIN). Role selalu "petugas".
export const POST = withAuth(
  async ({ request }) => {
    try {
      const { username, password, nama_lengkap } = await readBody(request);

      if (!username || !password || !nama_lengkap) {
        return fail('Nama lengkap, username, dan password wajib diisi!', 400);
      }

      if (username.trim().length < 3) {
        return fail('Username minimal 3 karakter!', 400);
      }

      if (password.length < 6) {
        return fail('Password minimal 6 karakter!', 400);
      }

      const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [
        username.trim(),
      ]);

      if (existing.length > 0) {
        return fail('Username sudah digunakan, silakan pilih username lain.', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        'INSERT INTO users (username, password, nama_lengkap, role) VALUES (?, ?, ?, "petugas")',
        [username.trim(), hashedPassword, nama_lengkap.trim()]
      );

      return json(
        {
          success: true,
          message: `Akun petugas "${nama_lengkap.trim()}" berhasil didaftarkan!`,
          userId: result.insertId,
        },
        201
      );
    } catch (error) {
      console.error('Error createPetugas:', error);
      return fail('Terjadi kesalahan pada server saat mendaftarkan petugas.', 500);
    }
  },
  { role: 'admin' }
);
