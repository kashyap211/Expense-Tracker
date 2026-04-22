import {
  CATEGORIES,
  CATEGORY_ICONS,
  apiRequest,
  appendChildren,
  clearNode,
  createElement,
  createEmptyState,
  createFieldGroup,
  createLoadingState,
  createSelect,
  downloadRequest,
  formatCurrency,
  formatDate,
  monthOptions,
  showToast,
  state,
  toInputDate,
  ui,
  yearOptions
} from './api.js';

let activeEscapeHandler = null;

function buildExpenseQuery(filters, includeCategory = true) {
  const params = new URLSearchParams({
    month: String(filters.month),
    year: String(filters.year)
  });

  if (filters.type) params.set('type', filters.type);
  if (includeCategory && filters.category) params.set('category', filters.category);

  return params.toString();
}

async function fetchExpenses(filters) {
  return apiRequest('GET', `/api/expenses?${buildExpenseQuery(filters)}`);
}

function closeTransactionModal() {
  clearNode(ui.modalRoot);

  if (activeEscapeHandler) {
    document.removeEventListener('keydown', activeEscapeHandler);
    activeEscapeHandler = null;
  }
}

function createFilterGroup(label, control) {
  const wrapper = createElement('div', { className: 'filter-group' });
  const title = createElement('label', { className: 'filter-label', text: label });
  wrapper.append(title, control);
  return wrapper;
}

async function exportTransactionsCsv() {
  try {
    const query = buildExpenseQuery(state.transactionFilters, false);
    const { blob, filename } = await downloadRequest(`/api/expenses/export?${query}`);
    const url = URL.createObjectURL(blob);
    const link = createElement('a', {
      attrs: {
        href: url,
        download: filename
      }
    });

    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('CSV export downloaded');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

export async function deleteTransaction(id, onDeleted) {
  if (!window.confirm('Delete this transaction?')) return;

  try {
    await apiRequest('DELETE', `/api/expenses/${id}`);
    showToast('Transaction deleted');

    if (onDeleted) {
      await onDeleted();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function createTransactionItem(expense, handlers = {}) {
  const item = createElement('article', { className: 'tx-item' });
  const icon = createElement('div', {
    className: `tx-icon ${expense.type}`,
    text: CATEGORY_ICONS[expense.category] || CATEGORY_ICONS.Other
  });

  const info = createElement('div', { className: 'tx-info' });
  const title = createElement('div', { className: 'tx-title', text: expense.title });
  const meta = createElement('div', { className: 'tx-meta' });
  const date = createElement('span', { text: formatDate(expense.date) });
  const category = createElement('span', { className: 'tx-cat', text: expense.category });
  meta.append(date, category);
  info.append(title, meta);

  if (expense.description) {
    info.append(createElement('div', { className: 'tx-note', text: expense.description }));
  }

  const amount = createElement('div', {
    className: `tx-amount ${expense.type}`,
    text: `${expense.type === 'income' ? '+' : '-'}${formatCurrency(expense.amount)}`
  });

  const actions = createElement('div', { className: 'tx-actions' });
  const editButton = createElement('button', {
    className: 'btn-icon edit',
    type: 'button',
    text: '✎',
    title: 'Edit transaction'
  });
  const deleteButton = createElement('button', {
    className: 'btn-icon delete',
    type: 'button',
    text: '×',
    title: 'Delete transaction'
  });

  editButton.addEventListener('click', () => handlers.onEdit?.(expense));
  deleteButton.addEventListener('click', () => handlers.onDelete?.(expense));
  actions.append(editButton, deleteButton);

  item.append(icon, info, amount, actions);
  return item;
}

export function createTransactionList(expenses, handlers = {}, emptyMessage = 'No transactions found') {
  if (!expenses.length) {
    return createEmptyState(emptyMessage);
  }

  const list = createElement('div', { className: 'tx-list' });
  expenses.forEach((expense) => {
    list.append(createTransactionItem(expense, handlers));
  });
  return list;
}

export function openTransactionModal({ expense = null, onSaved }) {
  closeTransactionModal();

  let currentType = expense?.type || 'expense';
  const overlay = createElement('div', { className: 'modal-overlay' });
  const modal = createElement('div', { className: 'modal' });
  const form = createElement('form', { className: 'modal-form' });
  const header = createElement('div', { className: 'modal-header' });
  const title = createElement('div', {
    className: 'modal-title',
    text: expense ? 'Edit Transaction' : 'Add Transaction'
  });
  const closeButton = createElement('button', {
    className: 'btn-ghost',
    type: 'button',
    text: 'Close'
  });
  closeButton.addEventListener('click', closeTransactionModal);
  header.append(title, closeButton);

  const typeToggle = createElement('div', { className: 'type-toggle' });
  const expenseTypeButton = createElement('button', {
    className: 'type-btn',
    type: 'button',
    text: 'Expense'
  });
  const incomeTypeButton = createElement('button', {
    className: 'type-btn',
    type: 'button',
    text: 'Income'
  });

  const titleInput = createElement('input', {
    type: 'text',
    placeholder: 'e.g. Groceries',
    value: expense?.title || ''
  });
  const amountInput = createElement('input', {
    type: 'number',
    placeholder: '0.00',
    value: expense?.amount ?? '',
    attrs: { min: '0', step: '0.01' }
  });
  const categorySelect = createSelect(
    CATEGORIES.map((category) => ({ value: category, label: category })),
    expense?.category || 'Food',
    { className: 'text-input' }
  );
  const dateInput = createElement('input', {
    type: 'date',
    value: toInputDate(expense?.date || new Date())
  });
  const descriptionInput = createElement('input', {
    type: 'text',
    placeholder: 'Add a note',
    value: expense?.description || ''
  });

  const helpText = createElement('div', {
    className: 'form-help',
    text: 'Recurring options are handled by the API and can be added in later UI updates.'
  });

  const updateTypeButtons = () => {
    expenseTypeButton.className = `type-btn ${currentType === 'expense' ? 'active expense' : ''}`.trim();
    incomeTypeButton.className = `type-btn ${currentType === 'income' ? 'active income' : ''}`.trim();
  };

  expenseTypeButton.addEventListener('click', () => {
    currentType = 'expense';
    updateTypeButtons();
  });

  incomeTypeButton.addEventListener('click', () => {
    currentType = 'income';
    updateTypeButtons();
  });

  updateTypeButtons();
  typeToggle.append(expenseTypeButton, incomeTypeButton);

  const firstRow = createElement('div', { className: 'field-grid' });
  const secondRow = createElement('div', { className: 'field-grid' });
  firstRow.append(
    createFieldGroup('Title', titleInput),
    createFieldGroup('Amount', amountInput)
  );
  secondRow.append(
    createFieldGroup('Category', categorySelect),
    createFieldGroup('Date', dateInput)
  );

  const actionRow = createElement('div', { className: 'form-actions' });
  const cancelButton = createElement('button', {
    className: 'btn-ghost',
    type: 'button',
    text: 'Cancel'
  });
  cancelButton.addEventListener('click', closeTransactionModal);
  const saveButton = createElement('button', {
    className: 'btn-primary',
    type: 'submit',
    text: expense ? 'Save Changes' : 'Save Transaction'
  });
  actionRow.append(cancelButton, saveButton);

  appendChildren(
    form,
    header,
    typeToggle,
    firstRow,
    secondRow,
    createFieldGroup('Description', descriptionInput),
    helpText,
    actionRow
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      title: titleInput.value.trim(),
      amount: Number.parseFloat(amountInput.value),
      category: categorySelect.value,
      type: currentType,
      date: dateInput.value,
      description: descriptionInput.value.trim()
    };

    if (!payload.title || !Number.isFinite(payload.amount) || payload.amount <= 0) {
      showToast('Title and a valid amount are required', 'error');
      return;
    }

    try {
      if (expense) {
        await apiRequest('PUT', `/api/expenses/${expense._id}`, payload);
        showToast('Transaction updated');
      } else {
        await apiRequest('POST', '/api/expenses', payload);
        showToast('Transaction added');
      }

      closeTransactionModal();
      await onSaved?.();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeTransactionModal();
    }
  });

  activeEscapeHandler = (event) => {
    if (event.key === 'Escape') {
      closeTransactionModal();
    }
  };
  document.addEventListener('keydown', activeEscapeHandler);

  modal.append(form);
  overlay.append(modal);
  ui.modalRoot.append(overlay);
}

export async function renderTransactionsPage(root, context) {
  clearNode(root);

  const page = createElement('section', { className: 'page' });
  const header = createElement('div', { className: 'page-header' });
  const headerCopy = createElement('div', { className: 'page-header-copy' });
  const title = createElement('h1', { className: 'page-title', text: 'All Transactions' });
  const subtitle = createElement('p', {
    className: 'page-subtitle',
    text: 'Filter, edit, delete, or export your transaction history.'
  });
  headerCopy.append(title, subtitle);

  const actions = createElement('div', { className: 'page-actions' });
  const exportButton = createElement('button', {
    className: 'btn-secondary',
    type: 'button',
    text: 'Export CSV'
  });
  exportButton.addEventListener('click', exportTransactionsCsv);

  const addButton = createElement('button', {
    className: 'btn-primary',
    type: 'button',
    text: 'Add Transaction'
  });
  addButton.addEventListener('click', () => context.openTransactionModal());
  actions.append(exportButton, addButton);
  header.append(headerCopy, actions);

  const filters = createElement('div', { className: 'filter-bar' });
  const monthSelect = createSelect(monthOptions(), state.transactionFilters.month, {
    onChange: (event) => {
      state.transactionFilters.month = Number(event.target.value);
      context.rerender();
    }
  });
  const yearSelect = createSelect(yearOptions(), state.transactionFilters.year, {
    onChange: (event) => {
      state.transactionFilters.year = Number(event.target.value);
      context.rerender();
    }
  });
  const typeSelect = createSelect([
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' }
  ], state.transactionFilters.type, {
    placeholder: 'All Types',
    onChange: (event) => {
      state.transactionFilters.type = event.target.value;
      context.rerender();
    }
  });
  const categorySelect = createSelect(
    CATEGORIES.map((category) => ({ value: category, label: category })),
    state.transactionFilters.category,
    {
      placeholder: 'All Categories',
      onChange: (event) => {
        state.transactionFilters.category = event.target.value;
        context.rerender();
      }
    }
  );

  filters.append(
    createFilterGroup('Month', monthSelect),
    createFilterGroup('Year', yearSelect),
    createFilterGroup('Type', typeSelect),
    createFilterGroup('Category', categorySelect)
  );

  const listContainer = createElement('div');
  listContainer.append(createLoadingState('Loading transactions...'));

  page.append(header, filters, listContainer);
  root.append(page);

  try {
    const expenses = await fetchExpenses(state.transactionFilters);
    clearNode(listContainer).append(
      createTransactionList(
        expenses,
        {
          onEdit: (selectedExpense) => context.openTransactionModal(selectedExpense),
          onDelete: (selectedExpense) => deleteTransaction(selectedExpense._id, context.rerender)
        }
      )
    );
  } catch (error) {
    clearNode(listContainer).append(createEmptyState(error.message));
    showToast(error.message, 'error');
  }
}
