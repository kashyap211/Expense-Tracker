import {
  CHART_COLORS,
  CATEGORY_ICONS,
  MONTH_NAMES,
  apiRequest,
  clearNode,
  createElement,
  createEmptyState,
  createLoadingState,
  createSelect,
  createSvgElement,
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

function buildMonthlyOverview(monthlyTotals, selectedYear) {
  const card = createElement('section', { className: 'chart-card chart-span-2' });
  card.append(createElement('div', {
    className: 'chart-card-title',
    text: `Monthly Overview ${selectedYear}`
  }));

  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    income: 0,
    expense: 0
  }));

  monthlyTotals.forEach((entry) => {
    const month = monthly[entry._id.month - 1];
    if (!month) return;

    if (entry._id.type === 'income') month.income = entry.total;
    if (entry._id.type === 'expense') month.expense = entry.total;
  });

  const maxValue = Math.max(
    ...monthly.map((item) => Math.max(item.income, item.expense)),
    1
  );

  const chart = createElement('div', { className: 'bar-chart' });

  monthly.forEach((item) => {
    const group = createElement('div', { className: 'bar-group' });
    const bars = createElement('div', { className: 'bars' });
    const incomeBar = createElement('div', {
      className: 'bar income',
      title: `Income: ${formatCurrency(item.income)}`
    });
    const expenseBar = createElement('div', {
      className: 'bar expense',
      title: `Expense: ${formatCurrency(item.expense)}`
    });
    incomeBar.style.height = `${Math.max((item.income / maxValue) * 120, 4)}px`;
    expenseBar.style.height = `${Math.max((item.expense / maxValue) * 120, 4)}px`;

    bars.append(incomeBar, expenseBar);
    group.append(
      bars,
      createElement('div', { className: 'bar-label', text: MONTH_NAMES[item.month - 1].slice(0, 3) })
    );
    chart.append(group);
  });

  const legend = createElement('div', { className: 'legend-row' });
  const incomeLegend = createElement('div', { className: 'legend-item' });
  incomeLegend.append(
    createElement('span', { className: 'legend-dot', attrs: { style: 'background:#4deba0' } }),
    createElement('span', { text: 'Income' })
  );
  const expenseLegend = createElement('div', { className: 'legend-item' });
  expenseLegend.append(
    createElement('span', { className: 'legend-dot', attrs: { style: 'background:#ff5c5c' } }),
    createElement('span', { text: 'Expense' })
  );
  legend.append(incomeLegend, expenseLegend);

  card.append(chart, legend);
  return card;
}

function buildCategoryCard(categoryBreakdown, selectedMonth) {
  const card = createElement('section', { className: 'chart-card' });
  card.append(createElement('div', {
    className: 'chart-card-title',
    text: `Expenses by Category - ${MONTH_NAMES[selectedMonth - 1]}`
  }));

  if (!categoryBreakdown.length) {
    card.append(createEmptyState('No expense data for the selected period'));
    return card;
  }

  const total = categoryBreakdown.reduce((sum, item) => sum + item.spent, 0);
  const wrap = createElement('div', { className: 'donut-wrap' });
  const svg = createSvgElement('svg', {
    viewBox: '0 0 36 36',
    width: '124',
    height: '124'
  });
  const legend = createElement('div', { className: 'donut-legend' });

  let offset = 0;
  const radius = 15.9;
  const circumference = 2 * Math.PI * radius;

  categoryBreakdown.forEach((item, index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const fraction = item.spent / total;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const circle = createSvgElement('circle', {
      cx: '18',
      cy: '18',
      r: String(radius),
      fill: 'none',
      stroke: color,
      'stroke-width': '3.5',
      'stroke-dasharray': `${dash.toFixed(2)} ${gap.toFixed(2)}`,
      'stroke-dashoffset': `${(-offset * circumference).toFixed(2)}`,
      transform: 'rotate(-90 18 18)'
    });

    offset += fraction;
    svg.append(circle);

    const legendItem = createElement('div', { className: 'legend-item' });
    const label = createElement('div', { className: 'legend-label' });
    label.append(
      createElement('span', { className: 'legend-dot', attrs: { style: `background:${color}` } }),
      createElement('span', { text: `${CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other} ${item.category}` })
    );
    const value = createElement('span', {
      className: 'legend-value',
      text: `${Math.round((item.spent / total) * 100)}%`
    });
    legendItem.append(label, value);
    legend.append(legendItem);
  });

  wrap.append(svg, legend);
  card.append(wrap);
  return card;
}

function buildTopSpendingCard(categoryBreakdown) {
  const card = createElement('section', { className: 'chart-card' });
  card.append(createElement('div', {
    className: 'chart-card-title',
    text: 'Top Spending Categories'
  }));

  if (!categoryBreakdown.length) {
    card.append(createEmptyState('No spending data to rank'));
    return card;
  }

  const maxValue = Math.max(...categoryBreakdown.map((item) => item.spent), 1);
  const container = createElement('div', { className: 'page' });

  categoryBreakdown.slice(0, 5).forEach((item, index) => {
    const row = createElement('div', { className: 'page' });
    const header = createElement('div', { className: 'progress-copy' });
    header.append(
      createElement('span', { text: `${CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other} ${item.category}` }),
      createElement('span', { text: formatCurrency(item.spent) })
    );

    const progress = createElement('div', { className: 'budget-progress' });
    const progressBar = createElement('div', { className: 'budget-progress-bar' });
    progressBar.style.width = `${Math.max((item.spent / maxValue) * 100, 5)}%`;
    progressBar.style.background = CHART_COLORS[index % CHART_COLORS.length];
    progress.append(progressBar);

    row.append(header, progress);
    container.append(row);
  });

  card.append(container);
  return card;
}

function buildBudgetWatchCard(budgetComparison) {
  const card = createElement('section', { className: 'chart-card' });
  card.append(createElement('div', {
    className: 'chart-card-title',
    text: 'Budget Watch'
  }));

  const trackedBudgets = budgetComparison
    .filter((item) => item.budget > 0)
    .sort((left, right) => right.percentUsed - left.percentUsed);

  if (!trackedBudgets.length) {
    card.append(createEmptyState('No budgets set for this period'));
    return card;
  }

  const list = createElement('div', { className: 'page' });

  trackedBudgets.forEach((item) => {
    const row = createElement('div', { className: 'budget-card' });
    const top = createElement('div', { className: 'budget-header' });
    const meta = createElement('div', { className: 'budget-meta' });
    meta.append(
      createElement('div', { className: 'budget-title', text: `${CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other} ${item.category}` }),
      createElement('div', {
        className: 'budget-copy',
        text: `${formatCurrency(item.spent)} of ${formatCurrency(item.budget)} used`
      })
    );

    let badgeClass = 'good';
    let badgeText = 'On Track';

    if (item.percentUsed >= 100) {
      badgeClass = 'over';
      badgeText = 'Over Budget';
    } else if (item.percentUsed >= 80) {
      badgeClass = 'warn';
      badgeText = 'Above 80%';
    }

    const badge = createElement('span', {
      className: `badge ${badgeClass}`,
      text: `${badgeText} • ${item.percentUsed}%`
    });

    top.append(meta, badge);
    row.append(top);
    list.append(row);
  });

  card.append(list);
  return card;
}

export async function renderAnalyticsPage(root, context) {
  clearNode(root);

  const page = createElement('section', { className: 'page' });
  const header = createElement('div', { className: 'page-header' });
  const headerCopy = createElement('div', { className: 'page-header-copy' });
  headerCopy.append(
    createElement('h1', { className: 'page-title', text: 'Analytics' }),
    createElement('p', {
      className: 'page-subtitle',
      text: 'Track monthly performance, spending mix, and budget pressure.'
    })
  );

  const filters = createElement('div', { className: 'filter-bar' });
  const monthSelect = createSelect(monthOptions(), state.analyticsFilters.month, {
    onChange: (event) => {
      state.analyticsFilters.month = Number(event.target.value);
      context.rerender();
    }
  });
  const yearSelect = createSelect(yearOptions(), state.analyticsFilters.year, {
    onChange: (event) => {
      state.analyticsFilters.year = Number(event.target.value);
      context.rerender();
    }
  });
  filters.append(
    createFilterGroup('Month', monthSelect),
    createFilterGroup('Year', yearSelect)
  );

  header.append(headerCopy, filters);
  const grid = createElement('div', { className: 'charts-grid' });
  grid.append(createLoadingState('Loading analytics...'));

  page.append(header, grid);
  root.append(page);

  try {
    const summary = await apiRequest(
      'GET',
      `/api/expenses/summary?month=${state.analyticsFilters.month}&year=${state.analyticsFilters.year}`
    );
    const monthlyTotals = summary.monthlyTotals || [];
    const budgetComparison = summary.budgetComparison || [];
    const categoryBreakdown = budgetComparison
      .filter((item) => item.spent > 0)
      .sort((left, right) => right.spent - left.spent);

    clearNode(grid).append(
      buildMonthlyOverview(monthlyTotals, state.analyticsFilters.year),
      buildCategoryCard(categoryBreakdown, state.analyticsFilters.month),
      buildTopSpendingCard(categoryBreakdown),
      buildBudgetWatchCard(budgetComparison)
    );
  } catch (error) {
    clearNode(grid).append(createEmptyState(error.message));
    showToast(error.message, 'error');
  }
}
