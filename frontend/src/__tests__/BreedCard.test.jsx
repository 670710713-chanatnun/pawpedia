import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BreedCard from '../components/BreedCard';

const breed = {
  id: 31,
  name_en: 'Golden Retriever',
  name_th: 'โกลเด้นรีทรีฟเวอร์',
  size: 'large',
  category_name: 'Sporting',
  weight_min_kg: 25,
  weight_max_kg: 34,
  image_url: '',
};

describe('BreedCard', () => {
  test('แสดงชื่อ ขนาด หมวดหมู่ และน้ำหนักของสายพันธุ์', () => {
    render(<BreedCard breed={breed} />, { wrapper: MemoryRouter });

    expect(screen.getByRole('heading', { name: 'Golden Retriever' })).toBeInTheDocument();
    expect(screen.getByText('โกลเด้นรีทรีฟเวอร์')).toBeInTheDocument();
    expect(screen.getByText('พันธุ์ใหญ่')).toBeInTheDocument();
    expect(screen.getByText(/Sporting · 25–34 กก\./)).toBeInTheDocument();
  });

  test('ลิงก์ชื่อสายพันธุ์พาไปหน้ารายละเอียดที่ถูกต้อง', () => {
    render(<BreedCard breed={breed} />, { wrapper: MemoryRouter });
    // ทั้งรูปและชื่อเป็นลิงก์ → ทุกลิงก์ต้องไปที่ /breeds/31
    const links = screen.getAllByRole('link', { name: 'Golden Retriever' });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link).toHaveAttribute('href', '/breeds/31'));
  });

  test('ไม่มีรูป → แสดงภาพแทนพร้อมชื่อสำหรับ screen reader', () => {
    render(<BreedCard breed={breed} />, { wrapper: MemoryRouter });
    expect(screen.getByRole('img', { name: 'Golden Retriever' })).toBeInTheDocument();
  });
});
