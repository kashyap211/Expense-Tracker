# Spendix Expense Manager

Spendix is a full-stack expense tracker built with Node.js, Express, MongoDB, and a modular vanilla-JavaScript frontend. It supports JWT authentication, income and expense tracking, budgets, recurring transactions, CSV export, analytics, and profile management.

## Tech Stack

- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Auth: JWT + bcrypt password hashing
- Frontend: vanilla JavaScript modules, HTML, CSS
- Background jobs: `node-cron`
- CSV export: `json2csv`
- Validation/sanitization: `express-validator`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   copy .env.example .env
   ```

   On macOS/Linux:

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with the values you want to use:

   ```env
   MONGO_URI=mongodb://localhost:27017/expense_manager
   JWT_SECRET=replace_with_a_secure_secret
   PORT=3000
   ```

4. Start MongoDB locally and make sure the URI in `.env` is reachable.

5. Start the app:

   ```bash
   npm start
   ```

6. Open the app in your browser:

   ```text
   http://localhost:3000
   ```

   If you changed `PORT`, use that value instead.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `PORT` | No | HTTP port for the Express server. Defaults to `3000` |

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the production server |
| `npm run dev` | Start the server with `nodemon` |

## Project Structure

```text
expense-manager/
├── config/
│   ├── db.js
│   └── env.js
├── constants/
│   └── expense.js
├── controllers/
│   ├── authController.js
│   ├── budgetController.js
│   └── expenseController.js
├── jobs/
│   └── recurringTransactions.js
├── middleware/
│   ├── auth.js
│   └── validate.js
├── models/
│   ├── Budget.js
│   ├── Expense.js
│   └── User.js
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── analytics.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── budgets.js
│   │   ├── dashboard.js
│   │   ├── main.js
│   │   ├── profile.js
│   │   └── transactions.js
│   └── index.html
├── routes/
│   ├── auth.js
│   ├── budgets.js
│   └── expenses.js
├── utils/
│   └── http.js
├── validators/
│   ├── auth.js
│   ├── budget.js
│   └── expense.js
├── .env.example
├── package.json
└── server.js
```

## Runtime Notes

- The server loads `.env` through `dotenv` from [config/env.js](./config/env.js).
- MongoDB is connected before the Express server starts listening.
- Recurring transactions are generated once on startup and then daily at midnight server time.
- API validation errors and controller errors use the same response shape:

  ```json
  {
    "error": "Invalid credentials",
    "code": "INVALID_CREDENTIALS"
  }
  ```

## API Reference

All protected endpoints require:

```text
Authorization: Bearer <jwt>
```

### Authentication

| Method | Path | Auth | Purpose | Inputs |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create a user account and return a JWT session | Body: `name`, `email`, `password` |
| `POST` | `/api/auth/login` | No | Log in and return a JWT session | Body: `email`, `password` |
| `POST` | `/api/auth/change-password` | Yes | Change the current user password after verifying the current password | Body: `currentPassword`, `newPassword` |
| `PUT` | `/api/auth/profile` | Yes | Update the current user display name and return a refreshed `{ token, user }` payload | Body: `name` |

### Budgets

| Method | Path | Auth | Purpose | Inputs |
|---|---|---|---|---|
| `GET` | `/api/budgets` | Yes | Get all budgets for a month/year period. Defaults to the current month/year if omitted | Query: `month`, `year` |
| `POST` | `/api/budgets` | Yes | Create or update a single category budget for a month/year | Body: `category`, `amount`, `month`, `year` |

### Expenses

| Method | Path | Auth | Purpose | Inputs |
|---|---|---|---|---|
| `GET` | `/api/expenses` | Yes | List the current user expenses/income entries | Query: `month`, `year`, `type`, `category` |
| `POST` | `/api/expenses` | Yes | Create a transaction | Body: `title`, `amount`, `category`, `type`, optional `date`, `description`, `isRecurring`, `recurringFrequency` |
| `PUT` | `/api/expenses/:id` | Yes | Update a transaction. Only `title`, `amount`, `category`, `type`, `date`, and `description` are accepted | Route param: `id`; Body: any allowed update fields |
| `DELETE` | `/api/expenses/:id` | Yes | Delete a transaction | Route param: `id` |
| `GET` | `/api/expenses/summary` | Yes | Get yearly monthly totals plus budget-vs-actual category data for a selected month | Query: `year`, optional `month` |
| `GET` | `/api/expenses/export` | Yes | Download a CSV export of matching transactions | Query: `month`, `year`, `type` |

## Response Notes

### `POST /api/auth/register`

```json
{
  "token": "jwt",
  "user": {
    "id": "userId",
    "name": "Alex Johnson",
    "email": "alex@example.com"
  }
}
```

### `GET /api/budgets`

```json
{
  "month": 4,
  "year": 2026,
  "budgets": [
    {
      "_id": "budgetId",
      "userId": "userId",
      "category": "Food",
      "amount": 10000,
      "month": 4,
      "year": 2026
    }
  ]
}
```

### `GET /api/expenses/summary`

```json
{
  "monthlyTotals": [
    {
      "_id": {
        "month": 4,
        "type": "expense"
      },
      "total": 12500
    }
  ],
  "budgetComparison": [
    {
      "category": "Food",
      "budget": 15000,
      "spent": 12500,
      "remaining": 2500,
      "percentUsed": 83
    }
  ],
  "period": {
    "month": 4,
    "year": 2026
  }
}
```

### `GET /api/expenses/export`

- Returns a `text/csv` attachment.
- The filename is generated from the selected period/type, for example:

  ```text
  expenses-2026-04-expense.csv
  ```

## Data Model Summary

### User

| Field | Type | Notes |
|---|---|---|
| `name` | `String` | Required |
| `email` | `String` | Required, unique, stored lowercase |
| `password` | `String` | bcrypt hash |
| `createdAt` | `Date` | Default `Date.now` |

### Expense

| Field | Type | Notes |
|---|---|---|
| `userId` | `ObjectId` | Reference to `User` |
| `title` | `String` | Required |
| `amount` | `Number` | Required |
| `category` | `String` | Enum of supported categories |
| `type` | `String` | `expense` or `income` |
| `date` | `Date` | Defaults to `Date.now` |
| `description` | `String` | Optional |
| `isRecurring` | `Boolean` | Defaults to `false` |
| `recurringFrequency` | `String` | `weekly` or `monthly` when recurring |
| `createdAt` | `Date` | Default `Date.now` |

### Budget

| Field | Type | Notes |
|---|---|---|
| `userId` | `ObjectId` | Reference to `User` |
| `category` | `String` | Enum of supported categories |
| `amount` | `Number` | Category limit for the month |
| `month` | `Number` | `1` through `12` |
| `year` | `Number` | Four-digit year |

## Frontend Pages

- Dashboard: monthly balance, income, expenses, recent transactions
- Transactions: filtered list, add/edit/delete, CSV export
- Analytics: monthly overview, category breakdown, budget watch
- Budgets: inline budget editing with warning states
- Profile: display name update and password rotation

## Security and Validation Notes

- Secrets are loaded from `.env`, not hardcoded in source.
- Protected routes use Bearer JWT auth.
- Passwords are hashed with `bcryptjs`.
- POST/PUT routes use `express-validator` for validation and sanitization.
- Expense updates are field-whitelisted server-side and run with `runValidators: true`.
- Categories are validated on the backend against the supported enum.
