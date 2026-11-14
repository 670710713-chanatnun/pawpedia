import { Link, useParams } from 'react-router-dom';
import { getBreed } from '../api/breeds';
import { useAsync } from '../hooks/useAsync';
import BreedImage from '../components/BreedImage';
import SizeBadge from '../components/SizeBadge';
import RatingDots from '../components/RatingDots';
import FavoriteButton from '../components/FavoriteButton';
import CompareButton from '../components/CompareButton';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { range, splitTraits } from '../utils/format';

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-stone-50 p-3">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

export default function BreedDetail() {
  const { id } = useParams();
  const { data: b, loading, error, reload } = useAsync(() => getBreed(id), [id]);

  if (loading) return <Loading />;
  if (error?.status === 404 || error?.status === 400) {
    return (
      <div className="container-page py-10">
        <EmptyState icon="🦴" title="ไม่พบสายพันธุ์นี้" message="สายพันธุ์อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"
          action={<Link to="/breeds" className="btn-primary">กลับไปหน้ารายการ</Link>} />
      </div>
    );
  }
  if (error) return <div className="container-page py-10"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <div className="container-page py-10">
      <Link to="/breeds" className="text-sm text-stone-500 hover:text-brand-600">← สายพันธุ์ทั้งหมด</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <BreedImage src={b.image_url} name={b.name_en} className="aspect-[4/3] w-full rounded-3xl shadow-sm" />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <SizeBadge size={b.size} />
            {b.category_name && (
              <Link to={`/breeds?category=${b.category_id}`} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs hover:bg-stone-200">
                {b.category_name}
              </Link>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">{b.name_en}</h1>
          {b.name_th && <p className="text-lg text-stone-500">{b.name_th}</p>}
          <p className="mt-1 text-sm text-stone-500">ถิ่นกำเนิด: {b.origin || '-'}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <FavoriteButton breedId={b.id} withLabel />
            <CompareButton breedId={b.id} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="น้ำหนัก" value={range(b.weight_min_kg, b.weight_max_kg, 'กก.')} />
            <Stat label="ส่วนสูง" value={range(b.height_min_cm, b.height_max_cm, 'ซม.')} />
            <Stat label="อายุขัย" value={range(b.life_min, b.life_max, 'ปี')} />
          </dl>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">ระดับพลังงาน</span>
              <RatingDots value={b.energy_level} label="ระดับพลังงาน" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">การดูแลขน</span>
              <RatingDots value={b.grooming_level} label="การดูแลขน" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">เหมาะกับครอบครัวที่มีเด็ก</span>
              <span className={`text-sm font-medium ${b.good_with_kids ? 'text-green-600' : 'text-amber-600'}`}>
                {b.good_with_kids ? '✓ เหมาะ' : '⚠ ควรระวัง'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <section className="card p-6 md:col-span-2">
          <h2 className="text-lg font-semibold">ลักษณะและประวัติ</h2>
          <p className="mt-2 leading-relaxed text-stone-700">{b.description || 'ยังไม่มีข้อมูล'}</p>
          <h2 className="mt-6 text-lg font-semibold">วิธีดูแล</h2>
          <p className="mt-2 leading-relaxed text-stone-700">{b.care_tips || 'ยังไม่มีข้อมูล'}</p>
        </section>
        <section className="card p-6">
          <h2 className="text-lg font-semibold">นิสัย</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {splitTraits(b.temperament).length === 0 && <p className="text-sm text-stone-500">ยังไม่มีข้อมูล</p>}
            {splitTraits(b.temperament).map((t) => (
              <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">{t}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
