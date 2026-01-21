import { Category } from '../data/stores';

interface CategoryFilterProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories: Array<{ id: Category; label: string; emoji: string }> = [
  { id: 'all', label: '전체', emoji: '🌟' },
  { id: 'dubai', label: '두바이 쿠키', emoji: '🍪' },
  { id: 'bungeoppang', label: '붕어빵', emoji: '🐟' },
  { id: 'goguma', label: '군고구마', emoji: '🍠' },
  { id: 'cake', label: '케이크', emoji: '🎂' },
  { id: 'all', label: 'ALL', emoji: '🍪' },
  { id: 'dubai', label: 'DUBAI', emoji: '🍫' },
  { id: 'bungeoppang', label: 'BUNGEOPPANG', emoji: '🐟' },
  { id: 'goguma', label: 'GOGUMA', emoji: '🍠' },
  { id: 'cake', label: 'CAKE', emoji: '🎂' },
];

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:justify-center md:flex-wrap md:overflow-visible">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300 ${
            activeCategory === cat.id
              ? 'bg-[#FF8C42] text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#FF8C42] hover:text-[#FF8C42]'
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
