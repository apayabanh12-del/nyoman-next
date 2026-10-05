import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { json, fail, readBody, signToken } from '@/lib/server';

// Login untuk Admin dan Petugas
export async function POST(request) {
  try {
    const { username, password } = await readBody(request);

    if (!username || !password) {
      return fail('Username dan password wajib diisi!', 400);
    }

    const [rows] = await pool.query(
      'SELECT id, username, password, nama_lengkap, foto, role FROM users WHERE username = ?',
      [String(username).trim()]
    );

    if (rows.length === 0) {
      return fail('Username atau password salah!', 401);
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return fail('Username atau password salah!', 401);
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      foto: user.foto || null,
      role: user.role,
    });

    return json({
      success: true,
      message: `Login berhasil. Selamat datang, ${user.nama_lengkap}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        foto: user.foto || null,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error saat login:', error);
    return fail('Terjadi kesalahan pada server saat login.', 500);
  }
}
