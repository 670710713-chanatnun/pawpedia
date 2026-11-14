import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RequireRole from '../components/RequireRole';
import { AuthContext } from '../context/AuthContext';

function renderAdminRoute(member) {
  return render(
    <AuthContext.Provider value={{ member, ready: true }}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<p>หน้าแรก</p>} />
          <Route path="/login" element={<p>หน้าเข้าสู่ระบบ</p>} />
          <Route path="/admin" element={<RequireRole role="admin"><p>แผงผู้ดูแลระบบ</p></RequireRole>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('RequireRole (หน้า Admin)', () => {
  test('Guest ถูกพาไปหน้า Login', () => {
    renderAdminRoute(null);
    expect(screen.getByText('หน้าเข้าสู่ระบบ')).toBeInTheDocument();
    expect(screen.queryByText('แผงผู้ดูแลระบบ')).not.toBeInTheDocument();
  });

  test('Member ทั่วไปเข้าไม่ได้ ถูกพากลับหน้าแรก', () => {
    renderAdminRoute({ id: 2, role: 'member' });
    expect(screen.getByText('หน้าแรก')).toBeInTheDocument();
    expect(screen.queryByText('แผงผู้ดูแลระบบ')).not.toBeInTheDocument();
  });

  test('Admin เข้าได้', () => {
    renderAdminRoute({ id: 1, role: 'admin' });
    expect(screen.getByText('แผงผู้ดูแลระบบ')).toBeInTheDocument();
  });
});
