import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthContext } from '../context/AuthContext';

function renderLogin(login) {
  return render(
    <AuthContext.Provider value={{ member: null, ready: true, login }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('หน้า Login', () => {
  test('ส่งฟอร์มว่าง → แสดงข้อความเตือน และไม่เรียก API', async () => {
    const login = jest.fn();
    renderLogin(login);

    await userEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

    expect(screen.getByText('กรุณากรอกอีเมล')).toBeInTheDocument();
    expect(screen.getByText('กรุณากรอกรหัสผ่าน')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  test('อีเมลผิดรูปแบบ → แสดงข้อความเตือน', async () => {
    const login = jest.fn();
    renderLogin(login);

    await userEvent.type(screen.getByLabelText('อีเมล'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('รหัสผ่าน'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

    expect(screen.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  test('Backend ตอบรหัสผิด → แสดงข้อความจาก Backend', async () => {
    const login = jest.fn().mockRejectedValue(new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
    renderLogin(login);

    await userEvent.type(screen.getByLabelText('อีเมล'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('รหัสผ่าน'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

    expect(login).toHaveBeenCalledWith('a@b.com', 'wrongpass');
    expect(await screen.findByRole('alert')).toHaveTextContent('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  });
});
