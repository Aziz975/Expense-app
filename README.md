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
- **UI** - Responsive design, sidebar navigation, dark mode, mobile friendly

## Project Structure

```
Expense App/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth & validation middleware
│   ├── routes/          # API route definitions
│   ├── utils/           # Helpers, validators, seed script
│   ├── server.js        # Express entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
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
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

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
| POST | /api/expenses | Create expense |
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

## License

MIT
