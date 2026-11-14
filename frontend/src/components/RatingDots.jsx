// แสดงระดับ 1-5 เป็นจุด
export default function RatingDots({ value, label }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${label} ${value} จาก 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${i <= value ? 'bg-brand-500' : 'bg-stone-200'}`}
        />
      ))}
    </div>
  );
}
