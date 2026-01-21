import { Category } from '../data/stores';

interface CategoryFilterProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories: Array<{ id: Category; ko: string; en: string; emoji: string }> = [
  { id: 'all', ko: '전체', en: 'ALL', emoji: '🌟' },
  { id: 'dubai', ko: '두바이 쿠키', en: 'DUBAI', emoji: '🍪' },
  { id: 'bungeoppang', ko: '붕어빵', en: 'BUNGEOPPANG', emoji: '🐟' },
  { id: 'goguma', ko: '군고구마', en: 'GOGUMA', emoji: '🍠' },
  { id: 'cake', ko: '케이크', en: 'CAKE', emoji: '🎂' },
];

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={[
              'shrink-0',
              'w-9 h-9',                         // ✅ 정사각형
              'rounded-full',
              'border border-black/70',
              'grid place-items-center',
              'bg-[#F6F1E6]',
              'transition',
              activeCategory === cat.id
                ? 'bg-black text-white scale-105'
                : 'text-black hover:bg-white/80',
            ].join(' ')}
            title={`${cat.ko} (${cat.en})`}
            aria-label={cat.ko}
            aria-pressed={isActive}
          >
            <span className="text-[18px] leading-none">{cat.emoji}</span>
            <span className="leading-tight">
              <span className="block text-[12px]">{cat.ko}</span>
              <span className="block text-[10px] opacity-80 tracking-widest">{cat.en}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}