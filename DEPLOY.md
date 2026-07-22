# Deploy Expense Tracker on Render

This app needs **3 pieces**:

1. **MySQL database** (external free host — Render’s MySQL needs a paid disk)
2. **Backend API** (Render Web Service)
3. **Frontend** (Render Static Site)

---

## 1. Create a free MySQL database

Pick any free MySQL provider, for example:

- [FreeSQLDatabase](https://www.freesqldatabase.com/)
- [Aiven](https://aiven.io/) (free trial)
- [Railway](https://railway.app/) (MySQL plugin)
- [Clever Cloud](https://www.clever-cloud.com/)

After you get credentials, run `database/schema_cloud.sql` in their SQL console (or MySQL Workbench / DBeaver).

Optional: seed users locally against that remote DB:

```bash
cd backend
# set DB_* in .env to the cloud MySQL values, then:
npm run seed
```

---

## 2. Push this repo to GitHub

Your remote should already be:

`https://github.com/Aziz975/Expense-App.git`

Commit and push the deploy files (`render.yaml`, `DEPLOY.md`, etc.) if they are not on GitHub yet.

---

## 3. Deploy with Render Blueprint (recommended)

1. Open [https://dashboard.render.com](https://dashboard.render.com) and sign in with GitHub.
2. Click **New → Blueprint**.
3. Select the **Expense-App** repository.
4. Render reads `render.yaml` and creates:
   - `expense-tracker-api` (Node web service)
   - `expense-tracker-web` (static frontend)
5. When prompted, fill in these **API** environment variables from your MySQL host:

| Key | Example |
|-----|---------|
| `DB_HOST` | `sql12.freesqldatabase.com` |
| `DB_USER` | `sql12xxxxxx` |
| `DB_PASSWORD` | your password |
| `DB_NAME` | `sql12xxxxxx` |
| `OPENAI_API_KEY` | optional (leave blank for rule-based AI) |

`DB_SSL` is already set to `true` in the blueprint.

6. Click **Apply**.

---

## 4. Manual deploy (if you prefer clicking through)

### Backend

1. **New → Web Service** → connect repo
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. Environment variables (same as table above), plus:

```env
NODE_ENV=production
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://YOUR-FRONTEND.onrender.com
DB_PORT=3306
DB_SSL=true
```

4. Health check path: `/api/health`

### Frontend

1. **New → Static Site** → same repo
2. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Environment variable:

```env
VITE_API_URL=https://YOUR-API.onrender.com/api
```

4. Add a **Rewrite** rule: Source `/*` → Destination `/index.html` (SPA routing)

5. After both URLs exist, update:
   - Backend `FRONTEND_URL` → frontend URL
   - Frontend `VITE_API_URL` → `https://<api>.onrender.com/api`
   - Redeploy frontend so Vite rebuilds with the correct API URL

---

## 5. Verify

1. Open `https://expense-tracker-api.onrender.com/api/health`  
   → should return `{ "success": true, ... }`
2. Open the frontend URL → register / login
3. If CORS errors appear, set `FRONTEND_URL` exactly to the frontend origin (no trailing slash) and redeploy the API

---

## Notes

- Free Render services **spin down** after idle time; the first request can take ~30–60 seconds.
- Free MySQL hosts may sleep or limit connections — keep that in mind for demos.
- Do **not** commit real `.env` files with passwords.
- Optional AI features work without `OPENAI_API_KEY` (rule-based fallbacks), except receipt scanning.
