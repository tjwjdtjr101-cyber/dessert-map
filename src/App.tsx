import { useEffect, useMemo, useRef, useState } from 'react';
import StoreMap from './components/StoreMap';
import StoreDetailModal from './components/StoreDetailModal';
import CategoryFilter from './components/CategoryFilter';
import StoreListView from './components/StoreListView';

import { stores as fallbackStores, Store, Category, StoreCategory } from './data/stores';

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

      return { ...s, categories, category } as StoreWithCompat;
    })
    .filter((s) => typeof s?.id === 'number' && typeof s?.lat === 'number' && typeof s?.lng === 'number');
}

export default function App() {
  const [stores, setStores] = useState<StoreWithCompat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // 기본 dubai 유지 (과밀 방지)
  const [activeCategory, setActiveCategory] = useState<Category>('dubai');

  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
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
    if (mapRef.current) mapRef.current.setView([lat, lng], 16);
  };

  const count = filteredStores.length;

  return (
    <div className="min-h-screen bg-[#F4EEE3]">
      {/* ✅ 레퍼런스처럼 전체 톤 + 종이 질감 느낌(가벼운) */}
      <div className="mx-auto w-full max-w-[980px] px-4 md:px-8 py-8">
        {/* 에러 배지(작게) */}
        {loadError ? (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white/60 px-3 py-1 text-[11px] font-bold">
            ⚠️ {loadError}
          </div>
        ) : null}

        {/* ✅ 섹션 헤더: 디저트 재고 라인 + 우측 카운트 */}
        <div className="flex items-end gap-4">
          <h2 className="text-[34px] md:text-[38px] font-black tracking-tight text-[#2D271E]">
            디저트 재고
          </h2>
          <div className="flex-1 h-px bg-black/20 mb-3" />
          <div className="flex items-center gap-2 mb-2 text-[#2D271E]">
            <span className="inline-block w-2 h-2 rounded-full bg-black/30" />
            <span className="text-[14px] font-black">{count}</span>
          </div>
        </div>

        {/* ✅ 필터(레퍼런스 pill 탭) */}
        <div className="mt-3">
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>

        {/* ✅ 지도 카드 */}
        <section className="mt-4">
          <div className="relative h-[220px] md:h-[260px] rounded-[18px] border border-black/15 overflow-hidden bg-white/50 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
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
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/60 px-3 py-1 text-[11px] font-bold text-[#2D271E]">
              ⏳ loading...
            </div>
          ) : null}
        </section>

        {/* ✅ 리스트 헤더: NEARBY STORES 라인 + 우측 카운트 */}
        {!isLoading && (
          <section className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-[14px] md:text-[15px] font-black tracking-[0.14em] text-[#2D271E]">
                NEARBY STORES
              </h3>
              <div className="flex-1 h-px bg-black/20" />
              <div className="text-[14px] font-black text-[#2D271E]">{count}</div>
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
    </div>
  );
}