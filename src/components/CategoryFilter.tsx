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
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:justify-center md:flex-wrap md:overflow-visible">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={[
              'flex items-center gap-2',
              'px-4 py-2',
              'border-[3px] border-black',
              'shadow-[3px_3px_0_#000]',
              'font-black text-xs tracking-wide whitespace-nowrap',
              'transition-transform',
              'active:translate-x-[1px] active:translate-y-[1px]',
              isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100',
            ].join(' ')}
            aria-pressed={isActive}
          >
            <span className="text-base leading-none">{cat.emoji}</span>
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