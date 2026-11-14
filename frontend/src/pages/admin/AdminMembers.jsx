import { useState } from 'react';
import { listMembers, setMemberRole, setMemberStatus } from '../../api/admin';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/States';
import { formatDate } from '../../utils/format';

export default function AdminMembers() {
  const { member: me } = useAuth();
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const { data, loading, error, reload } = useAsync(() => listMembers(q), [q]);

  async function run(action, success) {
    try {
      await action();
      setMsg({ type: 'success', text: success });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  }

  function onRole(m, role) {
    if (!window.confirm(`เปลี่ยนสิทธิ์ของ ${m.email} เป็น ${role} ใช่หรือไม่?`)) return;
    run(() => setMemberRole(m.id, role), `เปลี่ยนสิทธิ์ ${m.email} เป็น ${role} แล้ว`);
  }

  function onStatus(m) {
    const next = !m.is_active;
    if (!window.confirm(`${next ? 'เปิดใช้งาน' : 'ระงับ'}บัญชี ${m.email} ใช่หรือไม่?`)) return;
    run(() => setMemberStatus(m.id, next), `${next ? 'เปิดใช้งาน' : 'ระงับ'}บัญชี ${m.email} แล้ว`);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">จัดการสมาชิก {data && <span className="text-stone-400">({data.length})</span>}</h2>
      <p className="text-sm text-stone-500">
        ผู้ดูแลระบบเปลี่ยนสิทธิ์และระงับ/เปิดใช้งานบัญชีได้ แต่เปลี่ยนสิทธิ์หรือระงับบัญชีของตัวเองไม่ได้
        และไม่สามารถดูหรือแก้รหัสผ่านของสมาชิกได้
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
      >
        <input className="input" placeholder="ค้นหาอีเมลหรือชื่อ..." value={input} onChange={(e) => setInput(e.target.value)} aria-label="ค้นหาสมาชิก" />
        <button className="btn-outline" type="submit">ค้นหา</button>
      </form>
      <Alert type={msg.type || 'error'}>{msg.text}</Alert>

      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon="👥" title="ไม่พบสมาชิก" />}
      {data && data.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="p-3">สมาชิก</th>
                <th className="p-3">สมัครเมื่อ</th>
                <th className="p-3 text-center">♥</th>
                <th className="p-3">สิทธิ์</th>
                <th className="p-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => {
                const self = m.id === me?.id;
                return (
                  <tr key={m.id} className="border-t border-stone-100">
                    <td className="p-3">
                      <p className="font-medium">{m.display_name} {self && <span className="text-xs text-brand-600">(คุณ)</span>}</p>
                      <p className="text-xs text-stone-500">{m.email}</p>
                    </td>
                    <td className="p-3 text-stone-600">{formatDate(m.created_at)}</td>
                    <td className="p-3 text-center">{m.favorite_count}</td>
                    <td className="p-3">
                      <select
                        className="input !w-32 !py-1.5"
                        value={m.role}
                        disabled={self}
                        onChange={(e) => onRole(m, e.target.value)}
                        aria-label={`สิทธิ์ของ ${m.email}`}
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        disabled={self}
                        onClick={() => onStatus(m)}
                        className={`btn !px-3 !py-1.5 ${m.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {m.is_active ? '● ใช้งานอยู่' : '○ ถูกระงับ'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
