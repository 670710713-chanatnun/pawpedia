import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SizeFilter from '../components/SizeFilter';

describe('SizeFilter', () => {
  test('กดปุ่ม "เล็ก" แล้วส่งค่า small ออกไป', async () => {
    const onChange = jest.fn();
    render(<SizeFilter value="" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /เล็ก/ }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('small');
  });

  test('ปุ่มที่ตรงกับค่าปัจจุบันถูกทำเครื่องหมายว่าเลือกอยู่', () => {
    render(<SizeFilter value="large" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /ใหญ่/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ทุกขนาด' })).toHaveAttribute('aria-pressed', 'false');
  });
});
