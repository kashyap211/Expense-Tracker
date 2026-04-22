import {
  apiRequest,
  clearNode,
  createElement,
  createEmptyState,
  createLoadingState,
  formatCurrency,
  state
} from './api.js';
import { createTransactionList, deleteTransaction } from './transactions.js';

function createStatCard({ label, value, tone, description }) {
  const card = createElement('div', { className: 'stat-card' });
  const statLabel = createElement('div', { className: 'stat-label', text: label });
  const statValue = createElement('div', { className: `stat-value ${tone}`.trim(), text: value });
  const statChange = createElement('div', { className: 'stat-change', text: description });
  card.append(statLabel, statValue, statChange);
  return card;
}

export async function renderDashboard(root, context) {
  clearNode(root);

  const page = createElement('section', { className: 'page' });
  const header = createElement('div', { className: 'page-header' });
  const copy = createElement('div', { className: 'page-header-copy' });
  const title = createElement('h1', {
    className: 'page-title',
    text: `Welcome back, ${state.currentUser?.name?.split(' ')[0] || 'there'}`
  });
  const subtitle = createElement('p', {
    className: 'page-subtitle',
    text: 'Here is a snapshot of your current month.'
  });
  copy.append(title, subtitle);

  const addButton = createElement('button', {
    className: 'btn-primary',
    type: 'button',
    text: 'Add Transaction'
  });
  addButton.addEventListener('click', () => context.openTransactionModal());
  header.append(copy, addButton);

  const statsGrid = createElement('div', { className: 'stats-grid' });
  const recentSection = createElement('section', { className: 'page' });
  const recentHeader = createElement('div', { className: 'page-header' });
  const recentCopy = createElement('div', { className: 'page-header-copy' });
  recentCopy.append(
    createElement('h2', { className: 'page-title', text: 'Recent Transactions' }),
    createElement('p', {
      className: 'page-subtitle',
      text: 'The latest 10 entries from this month.'
    })
  );
  recentHeader.append(recentCopy);
  const recentList = createElement('div');
  recentList.append(createLoadingState('Loading dashboard...'));

  recentSection.append(recentHeader, recentList);
  page.append(header, statsGrid, recentSection);
  root.append(page);

  try {
    const now = new Date();
    const expenses = await apiRequest('GET', `/api/expenses?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);

    const income = expenses
      .filter((expense) => expense.type === 'income')
      .reduce((total, expense) => total + expense.amount, 0);
    const outgoing = expenses
      .filter((expense) => expense.type === 'expense')
      .reduce((total, expense) => total + expense.amount, 0);
    const balance = income - outgoing;

    statsGrid.append(
      createStatCard({
        label: 'Total Balance',
        value: formatCurrency(balance),
        tone: 'balance',
        description: 'This month'
      }),
      createStatCard({
        label: 'Income',
        value: formatCurrency(income),
        tone: 'income',
        description: `${expenses.filter((expense) => expense.type === 'income').length} transactions`
      }),
      createStatCard({
        label: 'Expenses',
        value: formatCurrency(outgoing),
        tone: 'expense',
        description: `${expenses.filter((expense) => expense.type === 'expense').length} transactions`
      })
    );

    clearNode(recentList).append(
      createTransactionList(
        expenses.slice(0, 10),
        {
          onEdit: (selectedExpense) => context.openTransactionModal(selectedExpense),
          onDelete: (selectedExpense) => deleteTransaction(selectedExpense._id, context.rerender)
        },
        'No transactions for the current month'
      )
    );
  } catch (error) {
    clearNode(statsGrid).append(createEmptyState(error.message));
    clearNode(recentList).append(createEmptyState('Unable to load recent transactions'));
  }
}
