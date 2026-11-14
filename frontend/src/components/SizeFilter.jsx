import { SIZES } from '../utils/format';

const OPTIONS = [{ value: '', label: 'ทุกขนาด' }, ...SIZES.map((s) => ({ value: s.value, label: `${s.label} (${s.en})` }))];

// ปุ่มกรองขนาด — ส่งค่า '' | 'small' | 'medium' | 'large' ออกไปทาง onChange
export default function SizeFilter({ value, onChange }) {
  return (
    <div role="group" aria-label="กรองตามขนาด" className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => {
        const active = (value || '') === o.value;
        return (
          <button
            key={o.value || 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              active
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-stone-300 bg-white text-stone-600 hover:border-brand-400'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
