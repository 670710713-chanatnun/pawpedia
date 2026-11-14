export const SIZES = [
  { value: 'small', label: 'เล็ก', en: 'Small' },
  { value: 'medium', label: 'กลาง', en: 'Medium' },
  { value: 'large', label: 'ใหญ่', en: 'Large' },
];

export const sizeLabel = (size) => SIZES.find((s) => s.value === size)?.label || size;

export function range(min, max, unit) {
  if (min === undefined || min === null) return '-';
  const a = Number(min);
  const b = Number(max);
  return a === b ? `${a} ${unit}` : `${a}–${b} ${unit}`;
}

export function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const splitTraits = (text) =>
  (text || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
