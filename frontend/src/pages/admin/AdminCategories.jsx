import { useState } from 'react';
import { listCategories } from '../../api/breeds';
import { createCategory, deleteCategory, updateCategory } from '../../api/admin';
import { useAsync } from '../../hooks/useAsync';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/States';

const EMPTY = { name_en: '', name_th: '', description: '' };

export default function AdminCategories() {
  const { data, loading, error, reload } = useAsync(listCategories, []);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  function startEdit(c) {
    setEditingId(c.id);
    setForm({ name_en: c.name_en, name_th: c.name_th, description: c.description });
    setMsg({ type: '', text: '' });
  }

  function cancel() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.name_en.trim()) return setMsg({ type: 'error', text: 'กรุณากรอกชื่อหมวดหมู่ภาษาอังกฤษ' });
    setBusy(true);
    try {
      if (editingId) await updateCategory(editingId, form);
      else await createCategory(form);
      setMsg({ type: 'success', text: editingId ? 'แก้ไขหมวดหมู่แล้ว' : 'เพิ่มหมวดหมู่แล้ว' });
      cancel();
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(c) {
    const note = c.breed_count > 0 ? `\nสายพันธุ์ ${c.breed_count} รายการในหมวดนี้จะกลายเป็น "ไม่มีหมวดหมู่"` : '';
    if (!window.confirm(`ลบหมวดหมู่ "${c.name_en}" ใช่หรือไม่?${note}`)) return;
    try {
      await deleteCategory(c.id);
      setMsg({ type: 'success', text: `ลบ "${c.name_en}" แล้ว` });
      if (editingId === c.id) cancel();
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">จัดการหมวดหมู่</h2>

      <form onSubmit={onSubmit} noValidate className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_2fr_auto]">
        <input className="input" placeholder="ชื่ออังกฤษ *" aria-label="ชื่อหมวดหมู่ภาษาอังกฤษ" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        <input className="input" placeholder="ชื่อไทย" aria-label="ชื่อหมวดหมู่ภาษาไทย" value={form.name_th} onChange={(e) => setForm({ ...form, name_th: e.target.value })} />
        <input className="input" placeholder="คำอธิบาย" aria-label="คำอธิบาย" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex gap-2">
          <button className="btn-primary whitespace-nowrap" type="submit" disabled={busy}>{editingId ? 'บันทึก' : '+ เพิ่ม'}</button>
          {editingId && <button className="btn-ghost" type="button" onClick={cancel}>ยกเลิก</button>}
        </div>
      </form>
      <Alert type={msg.type || 'error'}>{msg.text}</Alert>

      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon="🏷️" title="ยังไม่มีหมวดหมู่" message="เพิ่มหมวดหมู่แรกจากฟอร์มด้านบน" />}
      {data && data.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="p-3">ชื่อ</th>
                <th className="p-3">คำอธิบาย</th>
                <th className="p-3 text-center">สายพันธุ์</th>
                <th className="p-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className={`border-t border-stone-100 ${editingId === c.id ? 'bg-brand-50' : ''}`}>
                  <td className="p-3">
                    <p className="font-medium">{c.name_en}</p>
                    <p className="text-xs text-stone-500">{c.name_th}</p>
                  </td>
                  <td className="p-3 text-stone-600">{c.description}</td>
                  <td className="p-3 text-center">{c.breed_count}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => startEdit(c)}>แก้ไข</button>
                      <button type="button" className="btn-danger !px-3 !py-1.5" onClick={() => onDelete(c)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
