# 🐾 Pawpedia — สารานุกรมสายพันธุ์สุนัข

Term Project วิชา Backend Development & Frontend Development (BE-FE)

เว็บไซต์รวบรวมข้อมูลสายพันธุ์สุนัขทั่วโลก ค้นหา กรองตามขนาด/หมวดหมู่ ดูรายละเอียด เปรียบเทียบ และบันทึกรายการโปรดได้

| ส่วน | URL |
|---|---|
| Frontend (Vercel) | `https://<ใส่ URL หลัง deploy>.vercel.app` |
| Backend (Render) | `https://<ใส่ URL หลัง deploy>.onrender.com/api/health` |
| Database | Supabase (PostgreSQL) |

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 19 (Create React App), React Router v6, Tailwind CSS, **Fetch API** |
| Backend | **Go** `net/http` (ServeMux แบบ `"GET /api/..."`), pgx v5 (pgxpool), JWT (golang-jwt), bcrypt |
| Database | PostgreSQL บน **Supabase** |
| Test | Jest + React Testing Library (Frontend), `go test` (Backend), GitHub Actions |
| Deploy | Frontend → **Vercel**, Backend → **Render** (เชื่อม GitHub repo), DB → **Supabase** |

## ฟีเจอร์ตามสิทธิ์ผู้ใช้

| ฟีเจอร์ | Guest | Member | Admin |
|---|:-:|:-:|:-:|
| หน้าแรก, ดูรายการ, ค้นหา, กรองตามขนาด/หมวดหมู่, ดูรายละเอียด | ✅ | ✅ | ✅ |
| เปรียบเทียบสายพันธุ์ (สูงสุด 3) | ✅ | ✅ | ✅ |
| Register / Login / Logout | ✅ | ✅ | ✅ |
| ดู/แก้ไข Profile, เปลี่ยนรหัสผ่าน | | ✅ | ✅ |
| เพิ่ม/ลบ/ดูรายการโปรด | | ✅ | ✅ |
| Dashboard (สถิติ, จำนวนสายพันธุ์ ฯลฯ) | | | ✅ |
| เพิ่ม/แก้ไข/ลบสายพันธุ์ | | | ✅ |
| จัดการหมวดหมู่ (CRUD) | | | ✅ |
| ดูรายการสมาชิก, เปลี่ยน role, ระงับ/เปิดบัญชี | | | ✅ |

**การตรวจสิทธิ์อยู่ที่ Backend** (`backend/mw/auth.go`):
- `RequireLogin` ตรวจ JWT และ**อ่าน role/สถานะล่าสุดจาก DB ทุก request** ทำให้ถ้าถูกถอดสิทธิ์หรือถูกระงับ จะมีผลทันที
- `RequireRole("admin")` ครอบทุก route `/api/admin/*` ถ้าไม่ใช่ admin จะได้ **403**
- `/api/me/*` ใช้ `member_id` จาก token เท่านั้น จึงแก้ข้อมูลของคนอื่นไม่ได้
- Admin เปลี่ยน role หรือระงับบัญชี**ของตัวเอง**ไม่ได้ (ได้ 400 `SELF_CHANGE`)

## โครงสร้างโปรเจกต์

```
pawpedia/
├── backend/                 Go API
│   ├── main.go              ตั้งค่า, ลงทะเบียน route, middleware chain
│   ├── auth/                ออก/ตรวจ JWT, hash รหัสผ่าน (bcrypt)
│   ├── mw/                  RequireLogin, RequireRole, CORS, Logging, Recover (+ test)
│   ├── handler/             รับ request → validate → เรียก store → ตอบ JSON
│   ├── store/               SQL ทั้งหมด (pgx)
│   ├── respond/             helper ตอบ JSON/error รูปแบบเดียวกัน
│   └── db/schema.sql, seed.sql
├── frontend/                React (CRA)
│   ├── src/api/             ฟังก์ชัน fetch แยกตามเรื่อง (client.js คือตัวกลาง)
│   ├── src/context/         AuthContext, FavoritesContext, CompareContext
│   ├── src/hooks/useAsync.js  สถานะ loading / error / data
│   ├── src/components/      Navbar, BreedCard, SizeFilter, States (Loading/Empty/Error), ProtectedRoute, RequireRole ...
│   ├── src/pages/           หน้า Guest / Member
│   ├── src/pages/admin/     หน้า Admin
│   ├── src/__tests__/       Unit tests
│   └── vercel.json          rewrite ให้ refresh หน้าใดก็ได้ไม่ 404
└── .github/workflows/test.yml
```

## เส้นทางข้อมูล (ตัวอย่าง: กด ♥ เพิ่มรายการโปรด)

```
FavoriteButton.onClick
 → FavoritesContext.toggle()
 → api/favorites.js addFavorite()  ── fetch POST /api/me/favorites  (Authorization: Bearer <JWT>)
 → Go: Logging → Recover → CORS → mux
 → mw.RequireLogin (ตรวจ JWT + อ่าน role จาก DB)
 → handler.AddFavorite (validate breed_id, ใช้ member_id จาก token)
 → store.AddFavorite  ── INSERT INTO favorites ... ON CONFLICT DO NOTHING
 → 201 JSON → อัปเดต state → ปุ่มเปลี่ยนเป็น ♥
```

## API

| Method & Path | สิทธิ์ |
|---|---|
| `GET /api/health` | ทุกคน |
| `POST /api/auth/register`, `POST /api/auth/login` | ทุกคน |
| `GET /api/categories` | ทุกคน |
| `GET /api/breeds?q=&size=&category=&page=&limit=` | ทุกคน |
| `GET /api/breeds/{id}`, `GET /api/breeds/compare?ids=1,2,3` | ทุกคน |
| `GET/PUT /api/me`, `PUT /api/me/password` | Member |
| `GET/POST /api/me/favorites`, `DELETE /api/me/favorites/{breedId}` | Member |
| `GET /api/admin/stats` | Admin |
| `POST /api/admin/breeds`, `PUT/DELETE /api/admin/breeds/{id}` | Admin |
| `POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/{id}` | Admin |
| `GET /api/admin/members`, `PUT /api/admin/members/{id}/role`, `PUT /api/admin/members/{id}/status` | Admin |

Error ทุกตัวอยู่ในรูปแบบ `{"error":{"code":"...","message":"..."}}`

## รันบนเครื่อง

**1. Database:** สร้าง project บน Supabase → SQL Editor → รัน `backend/db/schema.sql` แล้วรัน `backend/db/seed.sql`

**2. Backend**
```bash
cd backend
cp .env.example .env      # ใส่ DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
go mod tidy
go run .                  # http://localhost:8080/api/health
go test ./...
```

**3. Frontend**
```bash
cd frontend
npm install
npm start                 # http://localhost:3000 (proxy /api ไป :8080)
npm test
```

## Deploy

### Supabase
1. New project → จดรหัสผ่าน DB ไว้
2. SQL Editor → รัน `schema.sql` แล้ว `seed.sql`
3. Project Settings → Database → Connection string → เลือก **Session pooler** (Render ไม่รองรับ IPv6 ของ Direct connection) → คัดลอกเป็น `DATABASE_URL`

### Render (Backend)
1. New → **Web Service** → เชื่อม GitHub repo นี้
2. Root Directory: `backend` · Runtime: **Go**
3. Build Command: `go build -o app .` · Start Command: `./app`
4. Environment: `DATABASE_URL`, `JWT_SECRET` (32 ตัวอักษรขึ้นไป), `ALLOWED_ORIGINS` (URL ของ Vercel), `ADMIN_EMAIL`, `ADMIN_PASSWORD`
5. Health Check Path: `/api/health`

### Vercel (Frontend)
1. Add New Project → import repo → Root Directory: `frontend` (Framework: Create React App)
2. Environment Variable: `REACT_APP_API_URL=https://<service>.onrender.com`
3. Deploy แล้วนำ URL ที่ได้ไปใส่ใน `ALLOWED_ORIGINS` บน Render แล้ว redeploy Backend

> Render แผนฟรีจะหลับเมื่อไม่มีคนใช้ ก่อนสาธิตให้เปิด `/api/health` ปลุกก่อนประมาณ 1 นาที

## บัญชีทดสอบ
- Admin: ใช้ค่า `ADMIN_EMAIL` / `ADMIN_PASSWORD` ที่ตั้งไว้บน Render (Backend สร้างให้อัตโนมัติตอนเริ่มทำงาน)
- Member: สมัครผ่านหน้า Register

## ข้อมูลรูปภาพ
รูปสุนัขมาจาก [Dog CEO API](https://dog.ceo/dog-api/) (Stanford Dogs Dataset) ถ้าสายพันธุ์ไหนไม่มีรูปจะแสดงภาพแทน
