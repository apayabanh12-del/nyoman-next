import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET belum diset di file .env.local');
  return secret;
};

export const signToken = (payload) =>
  jwt.sign(payload, getSecret(), { expiresIn: '24h' });

export const json = (body, status = 200) => NextResponse.json(body, { status });

export const fail = (message, status = 400) =>
  json({ success: false, message }, status);

export const readBody = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

/**
 * Pengganti middleware verifyToken + isAdmin + isPetugas dari Express.
 *
 *   export const GET = withAuth(async ({ request, user, params }) => {...});
 *   export const POST = withAuth(handler, { role: 'admin' });
 */
export const withAuth = (handler, { role } = {}) => {
  return async (request, context = {}) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return fail(
        'Akses ditolak: Token autentikasi tidak ditemukan. Silakan login kembali.',
        401
      );
    }

    let user;
    try {
      user = jwt.verify(token, getSecret());
    } catch (err) {
      return fail('Sesi berakhir atau token tidak valid. Silakan login kembali.', 401);
    }

    if (role === 'admin' && user.role !== 'admin') {
      return fail('Akses ditolak: Fitur ini hanya dapat diakses oleh Admin.', 403);
    }
    if (role === 'petugas' && user.role !== 'petugas') {
      return fail('Akses ditolak: Fitur ini hanya dapat diakses oleh Petugas Kasir.', 403);
    }

    // await aman di Next 14 (objek biasa) maupun Next 15 (Promise)
    const params = context.params ? await context.params : {};
    return handler({ request, user, params });
  };
};
