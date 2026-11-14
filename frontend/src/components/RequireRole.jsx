import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './States';

// กันหน้า Admin ฝั่ง Frontend (เพื่อ UX) — ความปลอดภัยจริงอยู่ที่ Backend: RequireRole("admin")
export default function RequireRole({ role, children }) {
  const { member, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading text="กำลังตรวจสอบสิทธิ์..." />;
  if (!member) return <Navigate to="/login" replace state={{ from: location }} />;
  if (member.role !== role) return <Navigate to="/" replace />;
  return children;
}
