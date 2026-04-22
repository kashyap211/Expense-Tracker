import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config/env.js';
import connectDB from './config/db.js';
import { startRecurringExpenseJob } from './jobs/recurringTransactions.js';
import authRoutes from './routes/auth.js';
import budgetRoutes from './routes/budgets.js';
import expenseRoutes from './routes/expenses.js';
import { formatError } from './utils/http.js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors({
  origin: "https://expense-tracker-production-8137.up.railway.app/"
}));
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

app.get('*', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const { status, body } = formatError(err);
  return res.status(status).json(body);
});

const startServer = async () => {
  try {
    await connectDB();
    await startRecurringExpenseJob();
    app.listen(config.port, () => console.log(`🚀 Server running at http://localhost:${config.port}`));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
