import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './States';

// หน้าที่ต้อง login — ถ้ายังไม่ login จะพาไปหน้า Login แล้วกลับมาหน้าเดิมหลัง login สำเร็จ
export default function ProtectedRoute({ children }) {
  const { member, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading text="กำลังตรวจสอบการเข้าสู่ระบบ..." />;
  if (!member) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
