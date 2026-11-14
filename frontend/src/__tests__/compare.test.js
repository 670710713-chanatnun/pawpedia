import { addToCompare, removeFromCompare, MAX_COMPARE } from '../utils/compare';

describe('รายการเปรียบเทียบสายพันธุ์', () => {
  test('เพิ่มสายพันธุ์ได้และแปลง id เป็นตัวเลข', () => {
    const res = addToCompare([], '5');
    expect(res.error).toBeNull();
    expect(res.list).toEqual([5]);
  });

  test('ไม่เพิ่มสายพันธุ์ซ้ำ', () => {
    const res = addToCompare([5], 5);
    expect(res.list).toEqual([5]);
    expect(res.error).toMatch(/อยู่ในรายการเปรียบเทียบแล้ว/);
  });

  test(`เพิ่มได้ไม่เกิน ${MAX_COMPARE} สายพันธุ์`, () => {
    const full = [1, 2, 3];
    const res = addToCompare(full, 4);
    expect(res.list).toBe(full); // คืนรายการเดิม ไม่ถูกแก้
    expect(res.error).toMatch(/สูงสุด 3/);
  });

  test('ลบสายพันธุ์ออกจากรายการ', () => {
    expect(removeFromCompare([1, 2, 3], '2')).toEqual([1, 3]);
  });
});
