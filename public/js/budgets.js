import {
  CATEGORIES,
  CATEGORY_ICONS,
  apiRequest,
  clearNode,
  createElement,
  createLoadingState,
  createSelect,
  formatCurrency,
  monthOptions,
  showToast,
  state,
  yearOptions
} from './api.js';

function createFilterGroup(label, control) {
  const wrapper = createElement('div', { className: 'filter-group' });
  wrapper.append(
    createElement('label', { className: 'filter-label', text: label }),
    control
  );
  return wrapper;
}

function createBudgetCard(category, budgetInfo, context) {
  const budget = budgetInfo?.budget || 0;
  const spent = budgetInfo?.spent || 0;
  const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const progressWidth = budget > 0 ? Math.min(percentUsed, 100) : spent > 0 ? 100 : 0;

  let badgeClass = 'neutral';
  let badgeText = 'No Budget';
  let progressTone = 'none';

  if (budget > 0 && percentUsed < 80) {
    badgeClass = 'good';
    badgeText = 'On Track';
    progressTone = '';
  } else if (budget > 0 && percentUsed < 100) {
    badgeClass = 'warn';
    badgeText = 'Above 80%';
    progressTone = 'warn';
  } else if (budget > 0) {
    badgeClass = 'over';
    badgeText = 'Over Budget';
    progressTone = 'over';
  }

  const card = createElement('section', { className: 'budget-card' });
  const header = createElement('div', { className: 'budget-header' });
  const meta = createElement('div', { className: 'budget-meta' });
  meta.append(
    createElement('div', {
      className: 'budget-title',
      text: `${CATEGORY_ICONS[category] || CATEGORY_ICONS.Other} ${category}`
    }),
    createElement('div', {
      className: 'budget-copy',
      text: `Spent ${formatCurrency(spent)}${budget > 0 ? ` of ${formatCurrency(budget)}` : ''}`
    })
  );
  const badge = createElement('span', {
    className: `badge ${badgeClass}`,
    text: budget > 0 ? `${badgeText} • ${percentUsed}%` : badgeText
  });
  header.append(meta, badge);

  const progress = createElement('div', { className: 'budget-progress' });
  const progressBar = createElement('div', {
    className: `budget-progress-bar ${progressTone}`.trim()
  });
  progressBar.style.width = `${progressWidth}%`;
  progress.append(progressBar);

  const copy = createElement('div', { className: 'progress-copy' });
  copy.append(
    createElement('span', {
      text: budget > 0 ? `Remaining ${formatCurrency(budget - spent)}` : 'Set a budget to track this category'
    }),
    createElement('span', {
      text: budget > 0 ? `Limit ${formatCurrency(budget)}` : 'Budget not set'
    })
  );

  const input = createElement('input', {
    className: 'text-input',
    type: 'number',
    value: budget || '',
    placeholder: '0.00',
    attrs: { min: '0', step: '0.01' }
  });
  const saveButton = createElement('button', {
    className: 'btn-primary',
    type: 'button',
    text: budget > 0 ? 'Update' : 'Set Budget'
  });

  saveButton.addEventListener('click', async () => {
    const amount = Number.parseFloat(input.value || '0');

    if (!Number.isFinite(amount) || amount < 0) {
      showToast('Budget amount must be 0 or greater', 'error');
      return;
    }

    try {
      await apiRequest('POST', '/api/budgets', {
        category,
        amount,
        month: state.budgetFilters.month,
        year: state.budgetFilters.year
      });
      showToast(`Budget saved for ${category}`);
      await context.rerender();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  const inputRow = createElement('div', { className: 'budget-input-row' });
  inputRow.append(input, saveButton);

  card.append(header, progress, copy, inputRow);
  return card;
}

export async function renderBudgetsPage(root, context) {
  clearNode(root);

  const page = createElement('section', { className: 'page' });
  const header = createElement('div', { className: 'page-header' });
  const copy = createElement('div', { className: 'page-header-copy' });
  copy.append(
    createElement('h1', { className: 'page-title', text: 'Budgets' }),
    createElement('p', {
      className: 'page-subtitle',
      text: 'Set category limits and watch how quickly each one is being used.'
    })
  );

  const filters = createElement('div', { className: 'filter-bar' });
  const monthSelect = createSelect(monthOptions(), state.budgetFilters.month, {
    onChange: (event) => {
      state.budgetFilters.month = Number(event.target.value);
      context.rerender();
    }
  });
  const yearSelect = createSelect(yearOptions(), state.budgetFilters.year, {
    onChange: (event) => {
      state.budgetFilters.year = Number(event.target.value);
      context.rerender();
    }
  });
  filters.append(
    createFilterGroup('Month', monthSelect),
    createFilterGroup('Year', yearSelect)
  );
  header.append(copy, filters);

  const grid = createElement('div', { className: 'budget-grid' });
  grid.append(createLoadingState('Loading budgets...'));
  page.append(header, grid);
  root.append(page);

  try {
    const summary = await apiRequest(
      'GET',
      `/api/expenses/summary?month=${state.budgetFilters.month}&year=${state.budgetFilters.year}`
    );
    const budgetMap = new Map((summary.budgetComparison || []).map((item) => [item.category, item]));

    clearNode(grid);
    CATEGORIES.forEach((category) => {
      grid.append(createBudgetCard(category, budgetMap.get(category), context));
    });
  } catch (error) {
    clearNode(grid).append(createElement('div', {
      className: 'empty-state',
      text: error.message
    }));
    showToast(error.message, 'error');
  }
}
