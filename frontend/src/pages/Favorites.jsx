import { Link } from 'react-router-dom';
import { listFavorites } from '../api/favorites';
import { useAsync } from '../hooks/useAsync';
import { useFavorites } from '../context/FavoritesContext';
import BreedCard from '../components/BreedCard';
import { EmptyState, ErrorState, Loading } from '../components/States';

export default function Favorites() {
  const { ids } = useFavorites();
  // โหลดใหม่ทุกครั้งที่จำนวนรายการโปรดเปลี่ยน (เช่น กด ♥ เพื่อลบ)
  const { data, loading, error, reload } = useAsync(listFavorites, [ids.size]);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">รายการโปรดของฉัน</h1>
      <p className="mt-1 text-stone-500">กดปุ่ม ♥ บนการ์ดเพื่อนำสายพันธุ์ออกจากรายการโปรด</p>
      <div className="mt-6">
        {loading && !data && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && data.length === 0 && (
          <EmptyState icon="♡" title="ยังไม่มีรายการโปรด" message="ไปดูสายพันธุ์ต่าง ๆ แล้วกดปุ่ม ♡ เพื่อบันทึกไว้ที่นี่"
            action={<Link to="/breeds" className="btn-primary">เลือกดูสายพันธุ์</Link>} />
        )}
        {data && data.length > 0 && (
          <>
            <p className="mb-4 text-sm text-stone-500">บันทึกไว้ {data.length} สายพันธุ์</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.map((b) => <BreedCard key={b.id} breed={b} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
