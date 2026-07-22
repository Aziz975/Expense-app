# Expense Tracker - Full Stack Application

A production-ready expense tracking application built with React, Node.js, Express, and MySQL.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React (Vite), React Router, Axios, Context API, Recharts, Tailwind CSS, React Toastify |
| Backend | Node.js, Express.js, JWT, bcrypt, express-validator |
| Database | MySQL |

## Features

- **Authentication** - Register, Login, JWT tokens, protected routes, profile management
- **Dashboard** - Summary cards, bar/pie/line charts, recent transactions, budget alerts
- **Income Management** - Full CRUD with search and date filtering
- **Expense Management** - Full CRUD with search, filter, sort by amount/date
- **Budget Management** - Monthly budgets with progress bars and 80% warnings
- **Reports** - Monthly and category reports with PDF/Excel export
- **Admin Panel** - View/delete users, view user expenses, platform statistics
- **AI Features** - Auto-categorization, spending analysis, budget suggestions, smart insights, AI reports (PDF), chatbot, natural-language search, receipt scanning
- **UI** - Responsive design, sidebar navigation, dark mode, mobile friendly

## Project Structure

```
Expense App/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth & validation middleware
│   ├── routes/          # API route definitions
│   ├── services/        # AI + data aggregation services
│   ├── utils/           # Helpers, validators, seed script
│   ├── server.js        # Express entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # UI + AI components
│   │   ├── pages/       # Pages including AI Assistant
│   │   ├── context/     # Auth & Theme context
│   │   ├── services/    # API service layer
│   │   ├── utils/       # Constants & formatters
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── database/
│   ├── schema.sql       # Database schema
│   └── sample_data.sql  # Sample data reference
├── API_DOCUMENTATION.md
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [XAMPP](https://www.apachefriends.org/) (MySQL running)
- npm
- (Optional) OpenAI API key — or any OpenAI-compatible provider — for full LLM features

## Installation

### 1. Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (`http://localhost/phpmyadmin`)
3. Import or run the SQL script:

```bash
# Via MySQL CLI
mysql -u root -p < database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (default works with XAMPP)
npm run seed    # Creates admin + sample user with data
npm run dev     # Starts server on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev     # Starts app on http://localhost:5173
```

## Default Login Credentials

After running `npm run seed`:

| Role  | Email              | Password     |
|-------|--------------------|--------------|
| Admin | admin@expense.com  | Password@123 |
| User  | john@example.com   | Password@123 |

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=expense_tracker
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# Optional — enables full LLM features (categorize, chat, receipt OCR, etc.)
# Without a key, the app uses built-in rule-based AI fallbacks
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

## AI Features Overview

| Feature | Where | Notes |
|---------|-------|-------|
| Auto Categorization | Add Expense + `POST /ai/categorize` | Maps to DB categories (Medical → Health) |
| Spending Analysis | Dashboard | Human-readable monthly summary |
| Budget Suggestions | Dashboard | Compares budgets vs actuals |
| Smart Insights | Dashboard top card | Regenerates from live MySQL data |
| AI Monthly Report | Dashboard button + PDF export | Health score, tips, comparisons |
| AI Chatbot | `/ai-assistant` page | Answers from your expense data |
| Smart Search | Expenses page | Natural language → safe SQL filters |
| Receipt Scanner | Expenses → Scan Receipt | Requires OpenAI vision model |

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full details.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/profile | Get user profile |
| PUT | /api/auth/profile | Update profile/password |
| GET | /api/income | List income records |
| POST | /api/income | Create income |
| PUT | /api/income/:id | Update income |
| DELETE | /api/income/:id | Delete income |
| GET | /api/expenses | List expenses |
| POST | /api/expenses | Create expense (optional category → AI) |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |
| GET | /api/budget | List budgets with progress |
| POST | /api/budget | Create budget |
| PUT | /api/budget/:id | Update budget |
| DELETE | /api/budget/:id | Delete budget |
| GET | /api/reports/dashboard | Dashboard data |
| GET | /api/reports/monthly | Monthly report |
| GET | /api/reports/category | Category report |
| GET | /api/reports/export/pdf | Export PDF |
| GET | /api/reports/export/excel | Export Excel |
| POST | /api/ai/categorize | AI expense categorization |
| GET | /api/ai/analyze | AI spending analysis |
| GET | /api/ai/budget-suggestions | AI budget tips |
| GET | /api/ai/insights | Dashboard smart insights |
| GET | /api/ai/report | AI monthly report JSON |
| GET | /api/ai/report/pdf | AI monthly report PDF |
| POST | /api/ai/chat | AI finance chatbot |
| POST | /api/ai/smart-search | Natural language expense search |
| POST | /api/ai/scan-receipt | Receipt OCR |
| POST | /api/ai/scan-receipt/confirm | Create expense from scan |
| GET | /api/admin/stats | Admin statistics |
| GET | /api/admin/users | List all users |
| DELETE | /api/admin/users/:id | Delete user |
| GET | /api/admin/users/:id/expenses | View user transactions |

## Security

- JWT authentication on all protected routes
- bcrypt password hashing (salt rounds: 10)
- Input validation with express-validator
- Parameterized SQL queries (SQL injection prevention)
- CORS configuration
- Environment variables for secrets

## Deploy on Render

See [DEPLOY.md](./DEPLOY.md) for a full walkthrough.

Quick path: push this repo → Render Dashboard → **New → Blueprint** → select repo → fill MySQL `DB_*` env vars → Apply.

## License

MIT
