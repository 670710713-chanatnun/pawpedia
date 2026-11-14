import { api, toQuery } from './client';

// ทุก endpoint ต้องใช้ token ของ admin — Backend ตอบ 403 ถ้าไม่ใช่ admin
export const getStats = () => api('/api/admin/stats');

export const createBreed = (data) => api('/api/admin/breeds', { method: 'POST', body: data });
export const updateBreed = (id, data) => api(`/api/admin/breeds/${id}`, { method: 'PUT', body: data });
export const deleteBreed = (id) => api(`/api/admin/breeds/${id}`, { method: 'DELETE' });

export const createCategory = (data) => api('/api/admin/categories', { method: 'POST', body: data });
export const updateCategory = (id, data) =>
  api(`/api/admin/categories/${id}`, { method: 'PUT', body: data });
export const deleteCategory = (id) => api(`/api/admin/categories/${id}`, { method: 'DELETE' });

export const listMembers = (q) => api(`/api/admin/members${toQuery({ q })}`);
export const setMemberRole = (id, role) =>
  api(`/api/admin/members/${id}/role`, { method: 'PUT', body: { role } });
export const setMemberStatus = (id, isActive) =>
  api(`/api/admin/members/${id}/status`, { method: 'PUT', body: { is_active: isActive } });
