# EduTrack — Student Results Portal

**Stack:** React (Vercel) + FastAPI + SQLModel (Render) + Supabase (PostgreSQL)

---

## Project Structure
```
edutrack/
├── frontend/          → React app         → deploy to Vercel
├── backend/           → FastAPI/SQLModel  → deploy to Render
└── README.md
```

---

## Step 1 — Set up Supabase

1. Go to https://supabase.com → create a free project
2. Go to **Settings → Database → Connection Pooling**
3. Copy the **Transaction mode** URL — it looks like:
   ```
   postgresql://postgres.xxxx:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   ⚠️ This is the only URL you need. It's IPv4-only — works perfectly with Render's free tier.

---

## Step 2 — Deploy Backend (Render)

1. Push `backend/` to GitHub
2. Go to https://render.com → **New Web Service** → connect repo
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   ```
   DATABASE_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   JWT_SECRET=a-long-random-secret
   ```
5. Deploy → copy your Render URL

---

## Step 3 — Seed the Database

After first deploy, run the seed script once to create tables and insert users:

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env    # fill in your DATABASE_URL and JWT_SECRET
python seed.py
```

This creates all tables and inserts sample students + admin.
To add real students later, edit `seed.py` with real names and passwords.

---

## Step 4 — Deploy Frontend (Vercel)

1. Push `frontend/` to GitHub
2. Go to https://vercel.com → **New Project** → connect repo
3. Add environment variable:
   ```
   VITE_API_URL=https://your-app.onrender.com
   ```
4. Update CORS in `backend/app/main.py` → add your Vercel URL → redeploy backend
5. Deploy

---

## Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
python seed.py         # creates tables + sample data
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8000
npm run dev
```

---

## API Endpoints

| Method | Endpoint                  | Auth    | Description                  |
|--------|---------------------------|---------|------------------------------|
| POST   | `/auth/login`             | None    | Returns JWT token            |
| GET    | `/results/me?week=Week 1` | Student | My scores filtered by week   |
| GET    | `/results/weeks`          | Student | Available weeks              |
| GET    | `/leaderboard/{week}`     | Student | Top 3 in my class            |
| POST   | `/admin/upload-results`   | Admin   | Upload a week's results      |
| GET    | `/admin/students`         | Admin   | All students                 |

---

## Customising

- **School name/motto** → `frontend/src/pages/HomePage.jsx`
- **Subjects** → `frontend/src/pages/AdminDashboard.jsx` → `subjects` array
- **Add students** → edit and re-run `backend/seed.py`
- **Colours** → all styles use `#7c3aed` (purple) and `#ec4899` (pink)
