export default function Pagination({ page, total, limit, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <nav aria-label="เปลี่ยนหน้า" className="mt-8 flex items-center justify-center gap-3">
      <button type="button" className="btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← ก่อนหน้า
      </button>
      <span className="text-sm text-stone-600">
        หน้า {page} / {pages}
      </span>
      <button type="button" className="btn-outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        ถัดไป →
      </button>
    </nav>
  );
}
