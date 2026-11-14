import { Link } from 'react-router-dom';
import BreedImage from './BreedImage';
import SizeBadge from './SizeBadge';
import FavoriteButton from './FavoriteButton';
import CompareButton from './CompareButton';
import { range } from '../utils/format';

export default function BreedCard({ breed }) {
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <Link to={`/breeds/${breed.id}`} aria-label={breed.name_en}>
          <BreedImage src={breed.image_url} name={breed.name_en} className="aspect-[4/3] w-full" />
        </Link>
        <div className="absolute right-2 top-2">
          <FavoriteButton breedId={breed.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">
              <Link to={`/breeds/${breed.id}`} className="hover:text-brand-600">
                {breed.name_en}
              </Link>
            </h3>
            {breed.name_th && <p className="text-sm text-stone-500">{breed.name_th}</p>}
          </div>
          <SizeBadge size={breed.size} />
        </div>
        <p className="text-xs text-stone-500">
          {breed.category_name || 'ไม่มีหมวดหมู่'} · {range(breed.weight_min_kg, breed.weight_max_kg, 'กก.')}
        </p>
        <div className="mt-auto pt-2">
          <CompareButton breedId={breed.id} className="w-full !py-1.5 !text-xs" />
        </div>
      </div>
    </article>
  );
}
