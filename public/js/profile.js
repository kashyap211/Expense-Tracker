import {
  apiRequest,
  clearNode,
  createElement,
  createFieldGroup,
  setSession,
  showToast,
  state
} from './api.js';

export async function renderProfilePage(root, context) {
  clearNode(root);

  const page = createElement('section', { className: 'page' });
  const header = createElement('div', { className: 'page-header-copy' });
  header.append(
    createElement('h1', { className: 'page-title', text: 'Profile' }),
    createElement('p', {
      className: 'page-subtitle',
      text: 'Update your display name and rotate your password when needed.'
    })
  );

  const grid = createElement('div', { className: 'profile-grid' });

  const profileCard = createElement('section', { className: 'profile-card' });
  profileCard.append(
    createElement('div', { className: 'profile-card-title', text: 'Account Details' }),
    createElement('div', { className: 'profile-detail', text: `Email: ${state.currentUser?.email || '-'}` })
  );

  const nameInput = createElement('input', {
    type: 'text',
    value: state.currentUser?.name || '',
    placeholder: 'Display name'
  });
  const nameForm = createElement('form', { className: 'page' });
  nameForm.append(
    createFieldGroup('Display Name', nameInput),
    createElement('button', {
      className: 'btn-primary',
      type: 'submit',
      text: 'Save Profile'
    })
  );

  nameForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const payload = await apiRequest('PUT', '/api/auth/profile', {
        name: nameInput.value.trim()
      });
      setSession(payload);
      showToast('Profile updated');
      await context.rerender();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  profileCard.append(nameForm);

  const passwordCard = createElement('section', { className: 'profile-card' });
  passwordCard.append(
    createElement('div', { className: 'profile-card-title', text: 'Change Password' }),
    createElement('div', {
      className: 'profile-detail',
      text: 'New passwords must be at least 8 characters long.'
    })
  );

  const currentPassword = createElement('input', {
    type: 'password',
    placeholder: 'Current password'
  });
  const newPassword = createElement('input', {
    type: 'password',
    placeholder: 'New password'
  });
  const confirmPassword = createElement('input', {
    type: 'password',
    placeholder: 'Confirm new password'
  });

  const passwordForm = createElement('form', { className: 'page' });
  passwordForm.append(
    createFieldGroup('Current Password', currentPassword),
    createFieldGroup('New Password', newPassword),
    createFieldGroup('Confirm Password', confirmPassword),
    createElement('button', {
      className: 'btn-primary',
      type: 'submit',
      text: 'Update Password'
    })
  );

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (newPassword.value !== confirmPassword.value) {
      showToast('New password and confirmation must match', 'error');
      return;
    }

    try {
      await apiRequest('POST', '/api/auth/change-password', {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      });
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
      showToast('Password updated');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  passwordCard.append(passwordForm);
  grid.append(profileCard, passwordCard);
  page.append(header, grid);
  root.append(page);
}
