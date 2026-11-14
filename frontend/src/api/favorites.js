import { api } from './client';

export const listFavorites = () => api('/api/me/favorites');
export const addFavorite = (breedId) =>
  api('/api/me/favorites', { method: 'POST', body: { breed_id: Number(breedId) } });
export const removeFavorite = (breedId) => api(`/api/me/favorites/${breedId}`, { method: 'DELETE' });
