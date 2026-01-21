import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import StoreMap from './components/StoreMap';
import StoreDetailModal from './components/StoreDetailModal';
import CategoryFilter from './components/CategoryFilter';
import StoreListView from './components/StoreListView';

// ✅ 더미 데이터는 "fallback" 용도로만 사용
import { stores as fallbackStores, Store, Category, StoreCategory } from './data/stores';

console.log('🔥 App.tsx LOADED', new Date().toISOString());

type StoreWithCompat = Store & {
  category?: StoreCategory;
  categories?: StoreCategory[];
};

function normalizeStores(raw: any): StoreWithCompat[] {
  const arr: any[] = Array.isArray(raw) ? raw : [];
  return arr
    .map((s) => {
      const categories: StoreCategory[] =
        Array.isArray(s?.categories) && s.categories.length > 0
          ? s.categories
          : s?.category
            ? [s.category]
            : [];

      const category: StoreCategory | undefined =
        (s?.category as StoreCategory) ?? (categories[0] as StoreCategory) ?? undefined;

      return {
        ...s,
        categories,
        category,
      } as StoreWithCompat;
    })
    .filter((s) => typeof s?.id === 'number' && typeof s?.lat === 'number' && typeof s?.lng === 'number');
}

export default function App() {
  const [stores, setStores] = useState<StoreWithCompat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const mapRef = useRef<any>(null);

  useEffect(() => {
    console.log('🚀 fetching stores.json');
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // ✅ 캐시 회피
        const res = await fetch('/stores.json?ts=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`stores.json fetch failed: ${res.status}`);

        const data = await res.json();
        const normalized = normalizeStores(data);

        if (!cancelled) {
          setStores(normalized);
          setIsLoading(false);
        }
      } catch (e: any) {
        const normalizedFallback = normalizeStores(fallbackStores);

        if (!cancelled) {
          setLoadError(e?.message ?? 'failed to load stores.json');
          setStores(normalizedFallback);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStores = useMemo(() => {
    if (activeCategory === 'all') return stores;

    const cat = activeCategory as StoreCategory;
    return stores.filter((s) => {
      const categories = s.categories ?? (s.category ? [s.category] : []);
      return categories.includes(cat);
    });
  }, [stores, activeCategory]);

  const handleZoomToStore = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
    }
  };

  // ✅ 1번 디자인의 TODAY 숫자
  const todayCount = filteredStores.length;

  return (
    <div className="min-h-screen bg-[#FFD400]">
      {/* ===== Top App Bar (사진1 느낌) ===== */}
      <header className="sticky top-0 z-50 bg-[#FFD400] border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 border-2 border-black bg-white grid place-items-center">
              ☰
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 border-2 border-black bg-black grid place-items-center text-white">
                🍪
              </div>
              <div className="leading-tight">
                <div className="font-black tracking-tight text-lg">DESSERT</div>
                <div className="text-[11px] font-semibold -mt-0.5">FINDER</div>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button className="w-10 h-10 border-2 border-black bg-white grid place-items-center">
              <Bell className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 border-2 border-black bg-pink-500 text-white grid place-items-center">
              👤
            </button>
          </nav>
        </div>
      </header>

      {/* ===== HERO (✅ 1번 디자인: 포스터 + TODAY 카드) ===== */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        {/* 에러 배지(있으면만) */}
        {loadError ? (
          <div className="mb-4 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 rounded-full text-xs font-bold shadow-[3px_3px_0_#000]">
            ⚠️ {loadError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* LEFT: Poster block */}
          <div className="md:col-span-2 rounded-xl border-4 border-black bg-[#FFD400] shadow-[6px_6px_0_#000] p-6 md:p-8">
            <div className="font-black tracking-[0.24em] text-xs md:text-sm">REAL TIME</div>

            <div className="mt-4 font-black leading-[0.88] text-black">
              <div className="text-[54px] md:text-[80px] tracking-tight">DESSERT</div>
              <div className="text-[54px] md:text-[80px] tracking-tight">STOCK</div>
            </div>

            <div className="mt-6 h-[3px] bg-black w-full" />
            <div className="mt-4 font-black tracking-[0.40em] text-xs md:text-sm">SEOUL · 2026</div>
          </div>

          {/* RIGHT: TODAY card */}
          <div className="rounded-xl border-4 border-black bg-white shadow-[6px_6px_0_#000] overflow-hidden">
            <div className="bg-black text-white px-4 py-3 font-black tracking-[0.28em] text-xs">
              TODAY
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="text-5xl font-black leading-none">{todayCount}+</div>
              <div className="text-xs font-black tracking-[0.28em]">STORES</div>

              {/* 작은 아이콘 라벨 (유럽 포스터 느낌 유지) */}
              <div className="mt-4 border-2 border-black rounded-lg p-3 flex items-center justify-between">
                <div className="text-[11px] font-black tracking-[0.22em]">FEATURED</div>
                <div className="text-2xl">🥐</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Title line ===== */}
        <div className="mt-6 flex items-center gap-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">디저트 재고</h2>
          <div className="flex-1 h-[2px] bg-black" />
          <div className="text-sm font-black">©24</div>
        </div>

        {/* ===== Filters (너가 수정한 CategoryFilter 그대로 사용) ===== */}
        <div className="mt-4">
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>
      </section>

      {/* ===== Map ===== */}
      <section className="max-w-6xl mx-auto px-4 mt-5">
        <div className="relative h-[280px] md:h-[340px] rounded-xl border-4 border-black overflow-hidden bg-white shadow-[6px_6px_0_#000]">
          <StoreMap
            stores={filteredStores as unknown as Store[]}
            activeCategory={activeCategory}
            onSelectStore={setSelectedStore}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
        </div>

        {isLoading ? (
          <div className="mt-3 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 rounded-full text-xs font-bold shadow-[3px_3px_0_#000]">
            ⏳ stores loading...
          </div>
        ) : null}
      </section>

      {/* ===== List ===== */}
      {!isLoading && (
        <section className="max-w-6xl mx-auto px-4 mt-8 pb-10">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-lg font-black tracking-wide">NEARBY STORES</h3>
            <div className="flex-1 h-[2px] bg-black" />
            <div className="text-sm font-black">{filteredStores.length}</div>
          </div>

          <StoreListView
            stores={filteredStores as unknown as Store[]}
            category={activeCategory}
            onStoreSelect={setSelectedStore}
            onZoomToStore={handleZoomToStore}
          />
        </section>
      )}

      <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} />
    </div>
  );
}