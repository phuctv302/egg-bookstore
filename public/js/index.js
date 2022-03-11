/* eslint-disable */
import '@babel/polyfill';

import { login, logout, signup, forgotPassword, resetPassword } from './auth';
import { updateSetting } from './updateSettings';

// DOM
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const dataForm = document.querySelector('.form-user-data');
const passwordForm = document.querySelector('.form-user-password');
const logoutBtn = document.querySelector('.nav__logout-btn');

const forgotPasswordForm = document.querySelector('.form--forgot-password');
const resetPasswordForm = document.querySelector('.form--reset-password');

// DELEGATE
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    signup({ name, email, password, passwordConfirm });
  });
}

if (dataForm) {
  dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-data').textContent = 'Updating...';

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await updateSetting(form, 'data');

    document.querySelector('.btn--save-data').textContent = 'Save settings';
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSetting(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => logout());
}

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    forgotPassword(email);
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const token = resetPasswordForm.dataset.resetToken;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    resetPassword({ password, passwordConfirm }, token);
  });
}
