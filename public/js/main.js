import {
  clearNode,
  clearSession,
  createElement,
  setSession,
  setUiRefs,
  showToast,
  state,
  syncUserDisplay,
  ui
} from './api.js';
import { renderAuthScreen } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderTransactionsPage, openTransactionModal } from './transactions.js';
import { renderAnalyticsPage } from './analytics.js';
import { renderBudgetsPage } from './budgets.js';
import { renderProfilePage } from './profile.js';

const root = document.getElementById('app-shell');
const toastContainer = document.getElementById('toast-container');

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { key: 'transactions', label: 'Transactions', icon: '↕' },
  { key: 'analytics', label: 'Analytics', icon: '◎' },
  { key: 'budgets', label: 'Budgets', icon: '₹' },
  { key: 'profile', label: 'Profile', icon: '◌' }
];

const PAGE_RENDERERS = {
  dashboard: renderDashboard,
  transactions: renderTransactionsPage,
  analytics: renderAnalyticsPage,
  budgets: renderBudgetsPage,
  profile: renderProfilePage
};

const navButtons = new Map();

function buildShell() {
  const authScreen = createElement('section', { id: 'auth-screen' });
  const app = createElement('div', { id: 'app', attrs: { hidden: 'true' } });
  const header = createElement('header', { className: 'header' });
  const headerLogo = createElement('div', { className: 'header-logo' });
  headerLogo.append('Spen', createElement('span', { text: 'dix' }));

  const headerRight = createElement('div', { className: 'header-right' });
  const userPill = createElement('div', { className: 'user-pill' });
  const userAvatar = createElement('div', { className: 'user-avatar', id: 'user-avatar', text: 'G' });
  const userName = createElement('span', { className: 'user-name', id: 'user-name', text: 'Guest' });
  userPill.append(userAvatar, userName);

  const logoutButton = createElement('button', {
    className: 'btn-ghost btn-logout',
    type: 'button',
    text: 'Logout'
  });
  logoutButton.addEventListener('click', () => {
    clearSession();
    state.currentPage = 'dashboard';
    clearNode(ui.modalRoot);
    showToast('Logged out');
    showAuthView();
  });

  headerRight.append(userPill, logoutButton);
  header.append(headerLogo, headerRight);

  const mainLayout = createElement('div', { className: 'main-layout' });
  const sidebar = createElement('nav', { className: 'sidebar' });
  const content = createElement('main', { className: 'content', attrs: { id: 'main-content' } });
  const modalRoot = createElement('div', { id: 'modal-root' });

  NAV_ITEMS.forEach((item) => {
    const button = createElement('button', {
      className: 'nav-item',
      type: 'button'
    });
    const icon = createElement('span', { className: 'nav-icon', text: item.icon });
    const label = createElement('span', { text: item.label });

    button.addEventListener('click', () => navigate(item.key));
    button.append(icon, label);
    navButtons.set(item.key, button);
    sidebar.append(button);
  });

  mainLayout.append(sidebar, content);
  app.append(header, mainLayout);
  root.append(authScreen, app, modalRoot);

  setUiRefs({
    authScreen,
    app,
    content,
    modalRoot,
    toastContainer,
    userName,
    userAvatar,
    navButtons
  });
}

function setActiveNav() {
  navButtons.forEach((button, key) => {
    button.classList.toggle('active', key === state.currentPage);
  });
}

async function renderCurrentPage() {
  const renderPage = PAGE_RENDERERS[state.currentPage] || PAGE_RENDERERS.dashboard;
  setActiveNav();
  clearNode(ui.modalRoot);
  ui.content.scrollTop = 0;

  try {
    await renderPage(ui.content, {
      navigate,
      rerender: renderCurrentPage,
      openTransactionModal: (expense = null) => openTransactionModal({
        expense,
        onSaved: renderCurrentPage
      })
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function showAppView() {
  ui.authScreen.hidden = true;
  ui.app.hidden = false;
  syncUserDisplay();
}

function showAuthView() {
  clearNode(ui.modalRoot);
  ui.app.hidden = true;
  ui.authScreen.hidden = false;
  renderAuthScreen(ui.authScreen, {
    onAuthenticated: (payload) => {
      setSession(payload);
      state.currentPage = 'dashboard';
      showAppView();
      renderCurrentPage();
    }
  });
}

function navigate(page) {
  state.currentPage = page;
  showAppView();
  renderCurrentPage();
}

buildShell();

if (state.token && state.currentUser) {
  showAppView();
  renderCurrentPage();
} else {
  showAuthView();
}
