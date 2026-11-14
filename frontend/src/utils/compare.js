export const MAX_COMPARE = 3;

/**
 * เพิ่ม id เข้ารายการเปรียบเทียบ (ไม่ซ้ำ และไม่เกิน MAX_COMPARE)
 * คืน { list, error } — ถ้าเพิ่มไม่ได้ list จะเป็นของเดิม
 */
export function addToCompare(list, id, max = MAX_COMPARE) {
  const n = Number(id);
  if (list.includes(n)) return { list, error: 'สายพันธุ์นี้อยู่ในรายการเปรียบเทียบแล้ว' };
  if (list.length >= max) return { list, error: `เปรียบเทียบได้สูงสุด ${max} สายพันธุ์` };
  return { list: [...list, n], error: null };
}

export function removeFromCompare(list, id) {
  return list.filter((x) => x !== Number(id));
}
