import { Link } from 'react-router-dom';
import { compareBreeds } from '../api/breeds';
import { useAsync } from '../hooks/useAsync';
import { useCompare } from '../context/CompareContext';
import BreedImage from '../components/BreedImage';
import RatingDots from '../components/RatingDots';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { range, sizeLabel } from '../utils/format';

const ROWS = [
  ['ขนาด', (b) => `พันธุ์${sizeLabel(b.size)}`],
  ['หมวดหมู่', (b) => b.category_name || '-'],
  ['ถิ่นกำเนิด', (b) => b.origin || '-'],
  ['น้ำหนัก', (b) => range(b.weight_min_kg, b.weight_max_kg, 'กก.')],
  ['ส่วนสูง', (b) => range(b.height_min_cm, b.height_max_cm, 'ซม.')],
  ['อายุขัย', (b) => range(b.life_min, b.life_max, 'ปี')],
  ['ระดับพลังงาน', (b) => <RatingDots value={b.energy_level} label="ระดับพลังงาน" />],
  ['การดูแลขน', (b) => <RatingDots value={b.grooming_level} label="การดูแลขน" />],
  ['เหมาะกับเด็ก', (b) => (b.good_with_kids ? '✓ เหมาะ' : '⚠ ควรระวัง')],
  ['นิสัย', (b) => b.temperament || '-'],
];

export default function Compare() {
  const { ids, remove, clear } = useCompare();
  const key = ids.join(',');
  const { data, loading, error, reload } = useAsync(
    () => (ids.length ? compareBreeds(ids) : Promise.resolve({ items: [] })),
    [key]
  );

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">เปรียบเทียบสายพันธุ์</h1>
          <p className="mt-1 text-stone-500">เลือกได้สูงสุด 3 สายพันธุ์ จากปุ่ม "⇄ เปรียบเทียบ" ในหน้ารายการหรือหน้ารายละเอียด</p>
        </div>
        {ids.length > 0 && <button type="button" className="btn-outline" onClick={clear}>ล้างทั้งหมด</button>}
      </div>

      <div className="mt-6">
        {ids.length === 0 && (
          <EmptyState icon="⚖️" title="ยังไม่ได้เลือกสายพันธุ์" message="เพิ่มอย่างน้อย 2 สายพันธุ์เพื่อเปรียบเทียบข้อมูลแบบตาราง"
            action={<Link to="/breeds" className="btn-primary">ไปเลือกสายพันธุ์</Link>} />
        )}
        {ids.length > 0 && loading && <Loading />}
        {ids.length > 0 && error && <ErrorState error={error} onRetry={reload} />}
        {ids.length > 0 && data && (
          <>
            {data.items.length === 1 && (
              <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                เลือกเพิ่มอีกอย่างน้อย 1 สายพันธุ์เพื่อเปรียบเทียบ — <Link to="/breeds" className="underline">เลือกเพิ่ม</Link>
              </p>
            )}
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr>
                    <th className="w-36 p-4 text-left align-bottom text-stone-500">คุณสมบัติ</th>
                    {data.items.map((b) => (
                      <th key={b.id} className="p-4 text-left align-top">
                        <BreedImage src={b.image_url} name={b.name_en} className="mb-3 aspect-[4/3] w-full rounded-xl" />
                        <Link to={`/breeds/${b.id}`} className="block text-base font-semibold hover:text-brand-600">{b.name_en}</Link>
                        <span className="block font-normal text-stone-500">{b.name_th}</span>
                        <button type="button" className="mt-2 text-xs font-normal text-red-600 hover:underline" onClick={() => remove(b.id)}>
                          นำออก
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(([label, render]) => (
                    <tr key={label} className="border-t border-stone-100">
                      <th scope="row" className="p-4 text-left font-medium text-stone-600">{label}</th>
                      {data.items.map((b) => <td key={b.id} className="p-4">{render(b)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
