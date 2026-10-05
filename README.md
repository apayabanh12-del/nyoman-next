# 🛒 POS KASIR SMK — versi Next.js

Project lama (React + Vite di `frontend/`, Express di `backend/`) sekarang digabung jadi **satu project Next.js 14 (App Router)**.
Frontend dan API jalan di **satu server, satu port (3000)**. Nggak perlu lagi buka 2 terminal atau proxy Vite.

## Cara jalanin

1. Nyalain MySQL (Laragon / XAMPP), lalu import `database.sql`.
2. Cek `.env.local` (isi DB sudah sama dengan `.env` lama; kalau belum ada, copy dari `.env.example`).
3. Install & jalanin:

```bash
npm install
npm run seed      # opsional: isi data awal (admin/admin123, petugas/petugas123)
npm run dev       # http://localhost:3000
```

Produksi: `npm run build` lalu `npm start`.
Windows tinggal klik `start.bat`.

## Struktur

```
src/
├── app/
│   ├── layout.jsx, globals.css        # root layout + AuthProvider
│   ├── page.jsx                       # "/" redirect sesuai login/role
│   ├── login/  laporan/
│   ├── admin/  (layout.jsx = guard admin)
│   │   ├── dashboard/ products/ stock/ members/ petugas/ transactions/ reports/
│   ├── kasir/  (layout.jsx = guard petugas)
│   │   ├── page.jsx (POS)  reports/
│   └── api/                           # ← pengganti Express (Route Handlers)
│       ├── auth/{login,me,profile}
│       ├── petugas/   (admin only: daftar + tambah akun petugas)
│       ├── products/ (+ [id], [id]/stock, barcode/[barcode], logs/stock)
│       ├── members/ (+ [id])
│       ├── transactions/ (+ [id])
│       ├── reports/  dashboard/stats/  health/
├── components/   Navbar, AdminSidebar, ProtectedRoute, ReceiptModal, BarcodeScannerModal, ReportPage
├── context/      AuthContext
├── layouts/      AdminLayout, PetugasLayout
└── lib/
    ├── db.js      # pool mysql2 (sama seperti config/db.js)
    ├── server.js  # withAuth() = pengganti verifyToken/isAdmin/isPetugas
    └── api.js     # helper fetch di sisi client (tetap pakai /api/...)
```

## Peta konversi Express → Next.js

| Dulu (Express) | Sekarang (Next.js) |
|---|---|
| `routes/*.js` + `controllers/*.js` | `src/app/api/**/route.js` (export `GET`/`POST`/`PUT`/`DELETE`) |
| `middlewares/auth.js` | `withAuth(handler, { role })` di `src/lib/server.js` |
| `req.body / req.params / req.query` | `await readBody(request)` / `params` / `request.nextUrl.searchParams` |
| `res.status(x).json(...)` | `json(body, x)` / `fail(msg, x)` |
| `react-router-dom` `<Routes>` | file-based routing folder `src/app` |
| `ProtectedRoute` + `<Outlet/>` | `layout.jsx` per grup (`/admin`, `/kasir`) + `{children}` |
| `useNavigate` / `<Link to>` / `NavLink` | `useRouter().push` / `<Link href>` / `usePathname` |
| Vite proxy `/api → :5000` | tidak perlu (satu server) |

URL endpoint, format response, pesan error, dan aturan hak akses **sama persis** dengan versi lama, jadi semua halaman frontend jalan tanpa ubah logika.

## Registrasi petugas

Halaman `/register` publik sudah **dihapus**. Akun petugas sekarang hanya bisa dibuat oleh **Admin**:

1. Login sebagai admin
2. Menu **Data Petugas** di sidebar
3. Klik **Daftarkan Petugas Baru**, isi nama, username, password, lalu simpan
4. Kasih username & password ke petugas, lalu petugas login lewat halaman login biasa

Endpoint-nya `GET/POST /api/petugas` dan dikunci role admin (petugas atau tanpa token ditolak 403/401). Role akun baru selalu `petugas`.

## Catatan

- Token JWT masih disimpan di `localStorage` seperti aslinya (logika login tidak diubah).
- `JWT_SECRET` sekarang wajib ada di `.env.local` (fallback hardcode dihapus). Ganti dengan string acak sebelum deploy.
- Akun demo dari seed: `admin / admin123`, `petugas / petugas123`, `siti / siti123`.
