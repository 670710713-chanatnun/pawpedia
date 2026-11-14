import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as favApi from '../api/favorites';
import { useAuth } from './AuthContext';

export const FavoritesContext = createContext({
  ids: new Set(),
  isFavorite: () => false,
  toggle: async () => {},
});

// เก็บ id ของสายพันธุ์ที่ member กดใจไว้ เพื่อให้ปุ่ม ♥ ทุกหน้าตรงกัน
export function FavoritesProvider({ children }) {
  const { member } = useAuth();
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!member) {
      setIds(new Set());
      return;
    }
    favApi
      .listFavorites()
      .then((list) => setIds(new Set(list.map((b) => b.id))))
      .catch(() => setIds(new Set()));
  }, [member]);

  const toggle = useCallback(
    async (breedId) => {
      const id = Number(breedId);
      if (ids.has(id)) {
        await favApi.removeFavorite(id);
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await favApi.addFavorite(id);
        setIds((prev) => new Set(prev).add(id));
      }
    },
    [ids]
  );

  const value = useMemo(
    () => ({ ids, isFavorite: (id) => ids.has(Number(id)), toggle }),
    [ids, toggle]
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
