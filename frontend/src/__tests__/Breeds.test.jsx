import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breeds from '../pages/Breeds';
import { listBreeds, listCategories } from '../api/breeds';

// mock ชั้น API → ทดสอบหน้าโดยไม่ต้องมี Backend จริง
jest.mock('../api/breeds');

function renderPage(url = '/breeds') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Breeds />
    </MemoryRouter>
  );
}

describe('หน้า Breeds: Loading / Data / Empty / Error', () => {
  beforeEach(() => {
    listCategories.mockResolvedValue([{ id: 2, name_en: 'Sporting', name_th: 'สุนัขกีฬา', breed_count: 1 }]);
  });

  test('แสดง Loading ก่อน แล้วแสดงรายการเมื่อโหลดเสร็จ', async () => {
    listBreeds.mockResolvedValue({
      items: [{ id: 1, name_en: 'Beagle', name_th: 'บีเกิ้ล', size: 'medium', weight_min_kg: 9, weight_max_kg: 11 }],
      total: 1, page: 1, limit: 12,
    });
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('กำลังโหลด');
    expect(await screen.findByRole('heading', { name: 'Beagle' })).toBeInTheDocument();
    expect(screen.getByText('พบ 1 สายพันธุ์')).toBeInTheDocument();
  });

  test('ส่งเงื่อนไขค้นหาจาก URL ไปที่ API', async () => {
    listBreeds.mockResolvedValue({ items: [], total: 0, page: 1, limit: 12 });
    renderPage('/breeds?q=husky&size=medium&category=2');

    await screen.findByText('ไม่พบสายพันธุ์ที่ค้นหา');
    expect(listBreeds).toHaveBeenCalledWith({ q: 'husky', size: 'medium', category: '2', page: 1, limit: 12 });
  });

  test('ไม่มีผลลัพธ์ → แสดง Empty state พร้อมปุ่มล้างตัวกรอง', async () => {
    listBreeds.mockResolvedValue({ items: [], total: 0, page: 1, limit: 12 });
    renderPage('/breeds?q=zzz');

    expect(await screen.findByText('ไม่พบสายพันธุ์ที่ค้นหา')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ล้างตัวกรอง' })).toBeInTheDocument();
  });

  test('API ล้มเหลว → แสดง Error state พร้อมปุ่มลองใหม่', async () => {
    listBreeds.mockRejectedValue(new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('โหลดข้อมูลไม่สำเร็จ');
    expect(screen.getByText('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ลองใหม่อีกครั้ง' })).toBeInTheDocument();
  });
});
