import { useState } from 'react';

// รูปสุนัข — ถ้าไม่มีลิงก์หรือโหลดไม่ได้ จะแสดงกรอบสีพร้อมอักษรย่อแทน
export default function BreedImage({ src, name, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const initials = (name || '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return (
      <div
        role="img"
        aria-label={name}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-brand-100 to-amber-200 text-brand-700 ${className}`}
      >
        <span className="text-4xl" aria-hidden="true">🐶</span>
        <span className="mt-1 text-sm font-semibold tracking-wider">{initials}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
