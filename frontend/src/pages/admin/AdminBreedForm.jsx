import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBreed, listCategories } from '../../api/breeds';
import { createBreed, updateBreed } from '../../api/admin';
import { useAsync } from '../../hooks/useAsync';
import { Alert, ErrorState, Loading } from '../../components/States';
import { SIZES } from '../../utils/format';

const EMPTY = {
  name_en: '', name_th: '', origin: '', size: 'medium', category_id: '',
  weight_min_kg: '', weight_max_kg: '', height_min_cm: '', height_max_cm: '', life_min: '', life_max: '',
  temperament: '', description: '', care_tips: '', energy_level: 3, grooming_level: 3,
  good_with_kids: true, image_url: '',
};

// แปลงค่าจากฟอร์ม (string) เป็นชนิดข้อมูลที่ Backend ต้องการ
function toPayload(f) {
  return {
    ...f,
    category_id: f.category_id ? Number(f.category_id) : null,
    weight_min_kg: Number(f.weight_min_kg),
    weight_max_kg: Number(f.weight_max_kg),
    height_min_cm: Number(f.height_min_cm),
    height_max_cm: Number(f.height_max_cm),
    life_min: Number(f.life_min),
    life_max: Number(f.life_max),
    energy_level: Number(f.energy_level),
    grooming_level: Number(f.grooming_level),
  };
}

function validate(f) {
  if (!f.name_en.trim()) return 'กรุณากรอกชื่อสายพันธุ์ภาษาอังกฤษ';
  const pairs = [
    ['น้ำหนัก', f.weight_min_kg, f.weight_max_kg],
    ['ส่วนสูง', f.height_min_cm, f.height_max_cm],
    ['อายุขัย', f.life_min, f.life_max],
  ];
  for (const [label, min, max] of pairs) {
    if (!(Number(min) > 0) || !(Number(max) > 0)) return `กรุณากรอก${label}ให้ครบและมากกว่า 0`;
    if (Number(max) < Number(min)) return `${label}สูงสุดต้องไม่น้อยกว่าค่าต่ำสุด`;
  }
  return '';
}

export default function AdminBreedForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const categories = useAsync(listCategories, []);
  const existing = useAsync(() => (isEdit ? getBreed(id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    if (existing.data) {
      const b = existing.data;
      setForm({ ...EMPTY, ...b, category_id: b.category_id ? String(b.category_id) : '' });
    }
  }, [existing.data]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const msg = validate(form);
    if (msg) return setError(msg);
    setBusy(true);
    setError('');
    try {
      const payload = toPayload(form);
      if (isEdit) await updateBreed(id, payload);
      else await createBreed(payload);
      navigate('/admin/breeds');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (isEdit && existing.loading) return <Loading />;
  if (isEdit && existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const input = (key, label, props = {}) => (
    <div>
      <label htmlFor={key} className="label">{label}</label>
      <input id={key} className="input" value={form[key]} onChange={set(key)} {...props} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{isEdit ? `แก้ไข: ${existing.data?.name_en}` : 'เพิ่มสายพันธุ์ใหม่'}</h2>
        <Link to="/admin/breeds" className="text-sm text-stone-500 hover:text-brand-600">← กลับ</Link>
      </div>
      <Alert>{error}</Alert>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-medium text-stone-600">ข้อมูลทั่วไป</legend>
        {input('name_en', 'ชื่อภาษาอังกฤษ *')}
        {input('name_th', 'ชื่อภาษาไทย')}
        {input('origin', 'ถิ่นกำเนิด')}
        {input('image_url', 'ลิงก์รูปภาพ', { placeholder: 'https://...' })}
        <div>
          <label htmlFor="size" className="label">ขนาด *</label>
          <select id="size" className="input" value={form.size} onChange={set('size')}>
            {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label} ({s.en})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category_id" className="label">หมวดหมู่</label>
          <select id="category_id" className="input" value={form.category_id} onChange={set('category_id')}>
            <option value="">— ไม่ระบุ —</option>
            {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <legend className="mb-2 font-medium text-stone-600">ขนาดตัวและอายุ</legend>
        {input('weight_min_kg', 'น้ำหนักต่ำสุด (กก.) *', { type: 'number', step: '0.1', min: '0' })}
        {input('weight_max_kg', 'น้ำหนักสูงสุด (กก.) *', { type: 'number', step: '0.1', min: '0' })}
        <div className="hidden md:block" />
        {input('height_min_cm', 'ส่วนสูงต่ำสุด (ซม.) *', { type: 'number', min: '0' })}
        {input('height_max_cm', 'ส่วนสูงสูงสุด (ซม.) *', { type: 'number', min: '0' })}
        <div className="hidden md:block" />
        {input('life_min', 'อายุขัยต่ำสุด (ปี) *', { type: 'number', min: '0' })}
        {input('life_max', 'อายุขัยสูงสุด (ปี) *', { type: 'number', min: '0' })}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 font-medium text-stone-600">ลักษณะนิสัย</legend>
        <div>
          <label htmlFor="energy_level" className="label">ระดับพลังงาน: {form.energy_level}</label>
          <input id="energy_level" type="range" min="1" max="5" className="w-full accent-brand-500" value={form.energy_level} onChange={set('energy_level')} />
        </div>
        <div>
          <label htmlFor="grooming_level" className="label">การดูแลขน: {form.grooming_level}</label>
          <input id="grooming_level" type="range" min="1" max="5" className="w-full accent-brand-500" value={form.grooming_level} onChange={set('grooming_level')} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={form.good_with_kids} onChange={set('good_with_kids')} />
          เหมาะกับครอบครัวที่มีเด็ก
        </label>
      </fieldset>

      <div className="space-y-4">
        {input('temperament', 'นิสัย (คั่นด้วย , เช่น ร่าเริง, ฉลาด)')}
        <div>
          <label htmlFor="description" className="label">ลักษณะและประวัติ</label>
          <textarea id="description" rows="3" className="input" value={form.description} onChange={set('description')} />
        </div>
        <div>
          <label htmlFor="care_tips" className="label">วิธีดูแล</label>
          <textarea id="care_tips" rows="3" className="input" value={form.care_tips} onChange={set('care_tips')} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link to="/admin/breeds" className="btn-outline">ยกเลิก</Link>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสายพันธุ์'}
        </button>
      </div>
    </form>
  );
}
