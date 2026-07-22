# API Documentation - Expense Tracker

Base URL: `http://localhost:5000/api`

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### Register
`POST /auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "token": "eyJhbG...",
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "user" }
  }
}
```

### Login
`POST /auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Get Profile
`GET /auth/profile` 🔒

### Update Profile
`PUT /auth/profile` 🔒

**Body (all fields optional):**
```json
{
  "name": "John Updated",
  "email": "newemail@example.com",
  "currentPassword": "Password@123",
  "newPassword": "NewPassword@456"
}
```

---

## Income

### List Income
`GET /income` 🔒

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search description, source, amount |
| source | string | Filter by source |
| startDate | date | Filter from date (YYYY-MM-DD) |
| endDate | date | Filter to date |
| month | string | Filter by month (YYYY-MM) |
| sortBy | string | amount, date, source |
| sortOrder | string | ASC or DESC |

### Create Income
`POST /income` 🔒

**Body:**
```json
{
  "amount": 5000,
  "source": "Salary",
  "description": "Monthly salary",
  "date": "2026-06-01"
}
```

### Update Income
`PUT /income/:id` 🔒

### Delete Income
`DELETE /income/:id` 🔒

---

## Expenses

### List Expenses
`GET /expenses` 🔒

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search description, category, amount |
| category | string | Food, Travel, Shopping, etc. |
| startDate | date | Filter from date |
| endDate | date | Filter to date |
| month | string | Filter by month |
| sortBy | string | amount, date, category |
| sortOrder | string | ASC or DESC |

### Create Expense
`POST /expenses` 🔒

**Body:**
```json
{
  "amount": 150.00,
  "category": "Food",
  "description": "Grocery shopping",
  "date": "2026-06-02"
}
```

**Valid Categories:** Food, Travel, Shopping, Bills, Health, Education, Entertainment, Other

### Update Expense
`PUT /expenses/:id` 🔒

### Delete Expense
`DELETE /expenses/:id` 🔒

---

## Budget

### List Budgets
`GET /budget` 🔒

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| month | string | Filter by month (YYYY-MM) |

**Response includes:** spent, remaining, percentage, warning (true if >= 80%)

### Create Budget
`POST /budget` 🔒

**Body:**
```json
{
  "category": "Food",
  "budget_amount": 600,
  "month": "2026-06"
}
```

### Update Budget
`PUT /budget/:id` 🔒

### Delete Budget
`DELETE /budget/:id` 🔒

---

## Reports

### Dashboard
`GET /reports/dashboard` 🔒

Returns summary cards, charts data, recent transactions, and budget warnings.

### Monthly Report
`GET /reports/monthly` 🔒

**Query:** `?month=2026-06`

### Category Report
`GET /reports/category` 🔒

**Query:** `?month=2026-06` or `?startDate=2026-01-01&endDate=2026-06-30`

### Export PDF
`GET /reports/export/pdf` 🔒

**Query:** `?month=2026-06`

Returns PDF file download.

### Export Excel
`GET /reports/export/excel` 🔒

**Query:** `?month=2026-06`

Returns Excel (.xlsx) file download.

---

## Admin (Admin role required)

### Platform Statistics
`GET /admin/stats` 🔒👑

### List All Users
`GET /admin/users` 🔒👑

### Delete User
`DELETE /admin/users/:id` 🔒👑

### View User Transactions
`GET /admin/users/:id/expenses` 🔒👑

---

## AI Features

All AI endpoints fall back to rule-based logic when `OPENAI_API_KEY` is not set (except receipt scan, which requires a vision-capable model).

### Auto Categorize
`POST /ai/categorize` 🔒

**Body:**
```json
{ "description": "Dominos Pizza" }
```

**Response:**
```json
{
  "success": true,
  "data": { "category": "Food", "confidence": 0.9, "source": "ai" }
}
```

### Spending Analysis
`GET /ai/analyze?month=2026-07` 🔒

Returns a human-readable monthly spending summary.

### Budget Suggestions
`GET /ai/budget-suggestions?month=2026-07` 🔒

Returns personalized budget tips, risk level, and summary.

### Dashboard Insights
`GET /ai/insights?month=2026-07` 🔒

Returns short bullet insights for the dashboard card.

### AI Monthly Report
`GET /ai/report?month=2026-07` 🔒

Returns detailed report: totals, top/lowest categories, budget status, comparison, savings tips, health score.

### Export AI Report PDF
`GET /ai/report/pdf?month=2026-07` 🔒

Returns PDF download of the AI report.

### AI Chat Assistant
`POST /ai/chat` 🔒

**Body:**
```json
{
  "message": "How much did I spend on food?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

Answers using the authenticated user's MySQL expense/income/budget data.

### Smart Search
`POST /ai/smart-search` 🔒

**Body:**
```json
{ "query": "Show travel expenses last month" }
```

Converts natural language into safe filter parameters (never executes raw AI SQL) and returns matching expenses.

### Scan Receipt
`POST /ai/scan-receipt` 🔒

**Body:**
```json
{
  "image": "<base64-encoded-image>",
  "mimeType": "image/jpeg"
}
```

Extracts merchant, amount, date, and category. Requires `OPENAI_API_KEY`.

### Confirm Receipt Expense
`POST /ai/scan-receipt/confirm` 🔒

**Body:**
```json
{
  "amount": 450,
  "category": "Food",
  "description": "Dominos Pizza",
  "date": "2026-07-15"
}
```

Creates an expense after user confirmation.

---

## Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Valid email is required." }]
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden (admin only) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email/budget) |
| 500 | Server error |

---

🔒 = Requires authentication
👑 = Requires admin role
