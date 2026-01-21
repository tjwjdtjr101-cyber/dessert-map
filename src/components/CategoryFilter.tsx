import { Category } from '../data/stores';

interface CategoryFilterProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories: Array<{ id: Category; label: string; emoji: string }> = [
  { id: 'all', label: 'ALL', emoji: '🍪' },
  { id: 'dubai', label: 'DUBAI', emoji: '🍫' },
  { id: 'bungeoppang', label: 'BUNGEOPPANG', emoji: '🐟' },
  { id: 'goguma', label: 'GOGUMA', emoji: '🍠' },
  { id: 'cake', label: 'CAKE', emoji: '🎂' },
];

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:justify-center md:flex-wrap md:overflow-visible">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`flex items-center gap-2 px-4 py-2 border-2 border-black shadow-[2px_2px_0_#111] font-black text-xs tracking-wide whitespace-nowrap transition-transform active:translate-x-[1px] active:translate-y-[1px] ${
            activeCategory === cat.id ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          <span className="text-lg">{cat.emoji}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
