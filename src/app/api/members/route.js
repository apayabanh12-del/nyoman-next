import pool from '@/lib/db';
import { json, fail, readBody, withAuth } from '@/lib/server';

// Semua member (Admin & Petugas)
export const GET = withAuth(async ({ request }) => {
  try {
    const search = request.nextUrl.searchParams.get('search');

    let query = 'SELECT * FROM members';
    const params = [];

    if (search && search.trim() !== '') {
      query += ' WHERE nama LIKE ? OR no_hp LIKE ? OR alamat LIKE ?';
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    query += ' ORDER BY nama ASC';

    const [members] = await pool.query(query, params);
    return json({ success: true, data: members });
  } catch (error) {
    console.error('Error getMembers:', error);
    return fail('Gagal mengambil data member.', 500);
  }
});

// Tambah member baru (Admin & Petugas)
export const POST = withAuth(async ({ request }) => {
  try {
    const { nama, no_hp, alamat } = await readBody(request);

    if (!nama || !no_hp) {
      return fail('Nama dan Nomor HP member wajib diisi!', 400);
    }

    const [existing] = await pool.query('SELECT id FROM members WHERE no_hp = ?', [
      no_hp.trim(),
    ]);
    if (existing.length > 0) {
      return fail('Nomor HP ini sudah terdaftar sebagai member!', 400);
    }

    const [result] = await pool.query(
      'INSERT INTO members (nama, no_hp, alamat) VALUES (?, ?, ?)',
      [nama.trim(), no_hp.trim(), (alamat || '').trim()]
    );

    const [newMember] = await pool.query('SELECT * FROM members WHERE id = ?', [
      result.insertId,
    ]);

    return json(
      { success: true, message: 'Member berhasil ditambahkan!', data: newMember[0] },
      201
    );
  } catch (error) {
    console.error('Error createMember:', error);
    return fail('Gagal mendaftarkan member baru.', 500);
  }
});
