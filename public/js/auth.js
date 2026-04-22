import {
  apiRequest,
  appendChildren,
  clearNode,
  createElement,
  createFieldGroup,
  showToast
} from './api.js';

function createFormButton(label) {
  return createElement('button', {
    className: 'btn-primary',
    type: 'submit',
    text: label
  });
}

export function renderAuthScreen(root, { onAuthenticated }) {
  clearNode(root);

  const wrapper = createElement('div', { className: 'auth-wrap' });
  const logo = createElement('div', { className: 'auth-logo' });
  logo.append('Spen', createElement('span', { text: 'dix' }));

  const subtitle = createElement('p', {
    className: 'auth-subtitle',
    text: 'Your personal finance tracker'
  });

  const tabs = createElement('div', { className: 'auth-tabs' });
  const errorCopy = createElement('div', { className: 'auth-error' });

  const loginForm = createElement('form');
  const loginEmail = createElement('input', {
    type: 'email',
    placeholder: 'you@email.com',
    attrs: { autocomplete: 'email', required: 'true' }
  });
  const loginPassword = createElement('input', {
    type: 'password',
    placeholder: 'Enter your password',
    attrs: { autocomplete: 'current-password', required: 'true' }
  });

  appendChildren(
    loginForm,
    createFieldGroup('Email', loginEmail),
    createFieldGroup('Password', loginPassword),
    createFormButton('Sign In')
  );

  const registerForm = createElement('form', { attrs: { hidden: 'true' } });
  const registerName = createElement('input', {
    type: 'text',
    placeholder: 'Alex Johnson',
    attrs: { autocomplete: 'name', required: 'true' }
  });
  const registerEmail = createElement('input', {
    type: 'email',
    placeholder: 'you@email.com',
    attrs: { autocomplete: 'email', required: 'true' }
  });
  const registerPassword = createElement('input', {
    type: 'password',
    placeholder: 'At least 8 characters',
    attrs: { autocomplete: 'new-password', minlength: '8', required: 'true' }
  });

  appendChildren(
    registerForm,
    createFieldGroup('Full Name', registerName),
    createFieldGroup('Email', registerEmail),
    createFieldGroup('Password', registerPassword),
    createFormButton('Create Account')
  );

  const setActiveTab = (tab) => {
    loginTab.classList.toggle('active', tab === 'login');
    registerTab.classList.toggle('active', tab === 'register');
    loginForm.hidden = tab !== 'login';
    registerForm.hidden = tab !== 'register';
    errorCopy.textContent = '';
  };

  const loginTab = createElement('button', {
    className: 'auth-tab active',
    type: 'button',
    text: 'Sign In',
    onClick: () => setActiveTab('login')
  });

  const registerTab = createElement('button', {
    className: 'auth-tab',
    type: 'button',
    text: 'Create Account',
    onClick: () => setActiveTab('register')
  });

  tabs.append(loginTab, registerTab);

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const payload = await apiRequest('POST', '/api/auth/login', {
        email: loginEmail.value.trim(),
        password: loginPassword.value
      });

      showToast('Signed in successfully');
      onAuthenticated(payload);
    } catch (error) {
      errorCopy.textContent = error.message;
      showToast(error.message, 'error');
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const payload = await apiRequest('POST', '/api/auth/register', {
        name: registerName.value.trim(),
        email: registerEmail.value.trim(),
        password: registerPassword.value
      });

      showToast('Account created successfully');
      onAuthenticated(payload);
    } catch (error) {
      errorCopy.textContent = error.message;
      showToast(error.message, 'error');
    }
  });

  appendChildren(wrapper, logo, subtitle, tabs, loginForm, registerForm, errorCopy);
  root.append(wrapper);
}
