import { api } from './client';

export const register = (data) => api('/api/auth/register', { method: 'POST', body: data });
export const login = (email, password) =>
  api('/api/auth/login', { method: 'POST', body: { email, password } });

export const getMe = () => api('/api/me');
export const updateMe = (data) => api('/api/me', { method: 'PUT', body: data });
export const changePassword = (currentPassword, newPassword) =>
  api('/api/me/password', {
    method: 'PUT',
    body: { current_password: currentPassword, new_password: newPassword },
  });
