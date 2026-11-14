import { api, toQuery } from './client';

// Guest เรียกได้ทั้งหมด
export const listBreeds = ({ q, size, category, page, limit } = {}) =>
  api(`/api/breeds${toQuery({ q, size, category, page, limit })}`);

export const getBreed = (id) => api(`/api/breeds/${id}`);

export const compareBreeds = (ids) => api(`/api/breeds/compare${toQuery({ ids: ids.join(',') })}`);

export const listCategories = () => api('/api/categories');
