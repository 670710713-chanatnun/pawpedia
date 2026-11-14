import { sizeLabel } from '../utils/format';

const COLORS = {
  small: 'bg-sky-100 text-sky-700',
  medium: 'bg-emerald-100 text-emerald-700',
  large: 'bg-violet-100 text-violet-700',
};

export default function SizeBadge({ size }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[size] || 'bg-stone-100'}`}>
      พันธุ์{sizeLabel(size)}
    </span>
  );
}
