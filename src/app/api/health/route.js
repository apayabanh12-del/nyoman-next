export const dynamic = 'force-dynamic';

import { json } from '@/lib/server';

export async function GET() {
  return json({
    status: 'OK',
    message: 'API POS Kasir SMK (Next.js) berjalan normal',
    timestamp: new Date(),
  });
}
