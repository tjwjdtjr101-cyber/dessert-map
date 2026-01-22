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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');

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

  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--charcoal)]">
      {/* 페이지 폭은 기존대로 쓰고, 섹션 색만 팔레트로 맞춤 */}
      <div className="mx-auto w-full max-w-[420px] px-4 pb-10">

        {/* (선택) 에러 표시 */}
        {loadError ? (
          <div className="mt-4 rounded-xl border border-[var(--brown-neutral)] bg-white/60 px-3 py-2 text-xs font-bold">
            ⚠ {loadError}
          </div>
        ) : null}

        {/* ====== “디저트 재고” 라인 ====== */}
        <div className="mt-6 flex items-end gap-3">
          <h2 className="text-3xl font-black tracking-tight">디저트 재고</h2>
          <div className="flex-1 h-px bg-[var(--brown-neutral)] mb-2" />
          <div className="text-[12px] font-black mb-2 text-[var(--brown-neutral)]">©24</div>
        </div>

        {/* ====== 카테고리 ====== */}
        <div className="mt-3">
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>

        {/* ====== 지도 (팔레트 톤 카드) ====== */}
        <div
          className="
            mt-3 relative h-[220px]
            rounded-[18px] overflow-hidden
            bg-[var(--cream)]
            border border-[var(--brown-neutral)]
            shadow-[0_10px_30px_rgba(45,39,30,0.18)]
          "
        >
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
          <div className="mt-3 text-xs font-bold text-[var(--brown-neutral)]">loading…</div>
        ) : null}

        {/* ====== 리스트 ====== */}
        {!isLoading && (
          <div className="mt-7">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-[13px] font-black tracking-[0.12em]">NEARBY STORES</h3>
              <div className="flex-1 h-px bg-[var(--brown-neutral)]" />
              <div className="text-[12px] font-black text-[var(--brown-neutral)]">
                {filteredStores.length}
              </div>
            </div>

            <StoreListView
              stores={filteredStores as unknown as Store[]}
              category={activeCategory}
              onStoreSelect={setSelectedStore}
              onZoomToStore={handleZoomToStore}
            />
          </div>
        )}

        <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} />
      </div>
    </div>
  );
}