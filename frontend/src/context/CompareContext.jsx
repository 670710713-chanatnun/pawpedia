import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addToCompare, removeFromCompare } from '../utils/compare';

const KEY = 'pawpedia.compare';

export const CompareContext = createContext({
  ids: [],
  add: () => null,
  remove: () => {},
  clear: () => {},
  has: () => false,
});

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.map(Number).filter(Boolean).slice(0, 3) : [];
  } catch {
    return [];
  }
}

// รายการเปรียบเทียบ — ใช้ได้ทั้ง Guest และ Member (เก็บในเบราว์เซอร์)
export function CompareProvider({ children }) {
  const [ids, setIds] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids]);

  const add = useCallback(
    (id) => {
      const res = addToCompare(ids, id);
      if (!res.error) setIds(res.list);
      return res.error;
    },
    [ids]
  );
  const remove = useCallback((id) => setIds((prev) => removeFromCompare(prev, id)), []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, add, remove, clear, has: (id) => ids.includes(Number(id)) }),
    [ids, add, remove, clear]
  );
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export const useCompare = () => useContext(CompareContext);
