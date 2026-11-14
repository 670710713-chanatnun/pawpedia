// สถานะมาตรฐาน 3 แบบที่ทุกหน้าที่ fetch ข้อมูลต้องมี: Loading / Empty / Error

export function Loading({ text = 'กำลังโหลดข้อมูล...' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-stone-500">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function EmptyState({ icon = '🐕', title, message, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="text-5xl" aria-hidden="true">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="max-w-md text-sm text-stone-500">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'โหลดข้อมูลไม่สำเร็จ' }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <div className="text-5xl" aria-hidden="true">😿</div>
      <h3 className="text-lg font-semibold text-red-700">{title}</h3>
      <p className="max-w-md text-sm text-red-600">{error?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}</p>
      {onRetry && (
        <button type="button" className="btn-outline mt-3" onClick={onRetry}>
          ลองใหม่อีกครั้ง
        </button>
      )}
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-brand-200 bg-brand-50 text-brand-800',
  };
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
