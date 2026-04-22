const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('spendix_user') || 'null');
  } catch {
    return null;
  }
})();

const now = new Date();

export const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Rent',
  'Salary',
  'Investment',
  'Other'
];

export const CATEGORY_ICONS = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍',
  Entertainment: '🎬',
  Health: '💊',
  Education: '📚',
  Rent: '🏠',
  Salary: '💼',
  Investment: '📈',
  Other: '📦'
};

export const CHART_COLORS = ['#c8fb5e', '#7c6af7', '#ff5c5c', '#4deba0', '#ff9f43', '#54a0ff', '#ff6b9d', '#48dbfb', '#feca57', '#a29bfe'];

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const state = {
  token: localStorage.getItem('spendix_token'),
  currentUser: storedUser,
  currentPage: 'dashboard',
  transactionFilters: {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    type: '',
    category: ''
  },
  analyticsFilters: {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  },
  budgetFilters: {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  }
};

export const ui = {};

export function setUiRefs(refs) {
  Object.assign(ui, refs);
}

export function clearNode(node) {
  node.replaceChildren();
  return node;
}

export function appendChildren(parent, ...children) {
  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    if (typeof child === 'string') {
      parent.append(document.createTextNode(child));
      return;
    }

    parent.append(child);
  });

  return parent;
}

export function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.className) element.className = options.className;
  if (options.id) element.id = options.id;
  if (options.text !== undefined) element.textContent = options.text;
  if (options.type) element.type = options.type;
  if (options.name) element.name = options.name;
  if (options.placeholder !== undefined) element.placeholder = options.placeholder;
  if (options.value !== undefined) element.value = options.value;
  if (options.checked !== undefined) element.checked = options.checked;
  if (options.disabled !== undefined) element.disabled = options.disabled;
  if (options.title !== undefined) element.title = options.title;

  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, value]) => {
      element.dataset[key] = value;
    });
  }

  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      element.setAttribute(key, value);
    });
  }

  if (options.onClick) element.addEventListener('click', options.onClick);
  if (options.onChange) element.addEventListener('change', options.onChange);
  if (options.onSubmit) element.addEventListener('submit', options.onSubmit);

  return element;
}

export function createSvgElement(tag, attrs = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

export function createFieldGroup(labelText, control, className = 'field') {
  const wrapper = createElement('div', { className });
  const label = createElement('label', { text: labelText });
  wrapper.append(label, control);
  return wrapper;
}

export function createSelect(options, selectedValue, config = {}) {
  const select = createElement('select', {
    className: config.className || 'filter-select',
    id: config.id,
    name: config.name
  });

  if (config.placeholder) {
    const blank = createElement('option', { text: config.placeholder });
    blank.value = '';
    select.append(blank);
  }

  options.forEach((option) => {
    const item = createElement('option', { text: option.label });
    item.value = String(option.value);
    item.selected = String(option.value) === String(selectedValue ?? '');
    select.append(item);
  });

  if (config.onChange) {
    select.addEventListener('change', config.onChange);
  }

  return select;
}

export function formatCurrency(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `₹${Math.abs(safeValue).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function toInputDate(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function monthOptions() {
  return MONTH_NAMES.map((label, index) => ({ value: index + 1, label }));
}

export function yearOptions(center = new Date().getFullYear(), span = 5) {
  return Array.from({ length: span * 2 + 1 }, (_, index) => {
    const year = center - span + index;
    return { value: year, label: String(year) };
  });
}

async function parseError(response) {
  try {
    const payload = await response.clone().json();
    return payload.error || payload.message || payload.code || 'Request failed';
  } catch {
    const text = await response.text();
    return text || 'Request failed';
  }
}

export async function apiRequest(method, path, body) {
  const headers = {};

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function downloadRequest(path) {
  const headers = {};

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { headers });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    filename: filenameMatch?.[1] || 'export.csv'
  };
}

export function setSession(payload) {
  state.token = payload.token;
  state.currentUser = payload.user;
  localStorage.setItem('spendix_token', payload.token);
  localStorage.setItem('spendix_user', JSON.stringify(payload.user));
  syncUserDisplay();
}

export function clearSession() {
  state.token = null;
  state.currentUser = null;
  localStorage.removeItem('spendix_token');
  localStorage.removeItem('spendix_user');
  syncUserDisplay();
}

export function syncUserDisplay() {
  if (!ui.userName || !ui.userAvatar) return;

  ui.userName.textContent = state.currentUser?.name || 'Guest';
  ui.userAvatar.textContent = state.currentUser?.name?.charAt(0)?.toUpperCase() || 'G';
}

export function createLoadingState(message = 'Loading...') {
  const wrapper = createElement('div', { className: 'loading' });
  const spinner = createElement('div', { className: 'spinner', attrs: { 'aria-hidden': 'true' } });
  const copy = createElement('span', { text: message });
  wrapper.append(spinner, copy);
  return wrapper;
}

export function createEmptyState(message, icon = '💸') {
  const wrapper = createElement('div', { className: 'empty-state' });
  const emoji = createElement('div', { className: 'empty-emoji', text: icon });
  const copy = createElement('p', { text: message });
  wrapper.append(emoji, copy);
  return wrapper;
}

export function showToast(message, type = 'success') {
  if (!ui.toastContainer) return;

  const toast = createElement('div', { className: `toast ${type}` });
  const icon = createElement('div', { className: 'toast-icon', text: type === 'success' ? '✓' : '!' });
  const copy = createElement('div', { text: message });

  toast.append(icon, copy);
  ui.toastContainer.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}
