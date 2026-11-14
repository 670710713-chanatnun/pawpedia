import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';

export default function NotFound() {
  return (
    <div className="container-page py-14">
      <EmptyState icon="🦴" title="ไม่พบหน้านี้ (404)" message="หน้าที่คุณต้องการอาจถูกย้ายหรือไม่มีอยู่"
        action={<Link to="/" className="btn-primary">กลับหน้าแรก</Link>} />
    </div>
  );
}
