import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

// ปุ่ม ♥ — Guest กดแล้วพาไปหน้า Login, Member กดเพื่อเพิ่ม/ลบรายการโปรด
export default function FavoriteButton({ breedId, withLabel = false }) {
  const { member } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const active = isFavorite(breedId);

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!member) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setBusy(true);
    try {
      await toggle(breedId);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  const label = active ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      aria-pressed={active}
      title={member ? label : 'เข้าสู่ระบบเพื่อบันทึกรายการโปรด'}
      className={
        withLabel
          ? `btn ${active ? 'bg-rose-500 text-white hover:bg-rose-600' : 'border border-rose-300 bg-white text-rose-600 hover:bg-rose-50'}`
          : `flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow transition hover:scale-110 ${active ? 'text-rose-500' : 'text-stone-400'}`
      }
    >
      <span aria-hidden="true">{active ? '♥' : '♡'}</span>
      {withLabel && <span>{active ? 'อยู่ในรายการโปรด' : 'เพิ่มรายการโปรด'}</span>}
    </button>
  );
}
