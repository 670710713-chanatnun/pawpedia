import { useCompare } from '../context/CompareContext';

export default function CompareButton({ breedId, className = '' }) {
  const { has, add, remove } = useCompare();
  const active = has(breedId);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (active) {
      remove(breedId);
      return;
    }
    const error = add(breedId);
    if (error) window.alert(error);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`btn ${active ? 'bg-stone-800 text-white hover:bg-stone-700' : 'border border-stone-300 bg-white text-stone-700 hover:border-brand-400'} ${className}`}
    >
      {active ? '✓ อยู่ในรายการเทียบ' : '⇄ เปรียบเทียบ'}
    </button>
  );
}
