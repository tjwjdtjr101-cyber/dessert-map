import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
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

  // ✅ 모바일에서 지도 마커 과밀 방지용: 기본 dubai(원하면 'all'로 변경)
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

  // ✅ 레퍼런스처럼 24+ 느낌
  const todayCount = Math.min(filteredStores.length, 24);

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_420px_at_20%_0%,#FFE7A3_0%,#FFD86B_40%,#F8C44E_100%)]">
      {/* ✅ 모바일 미리보기처럼 보이게 전체 폭 제한
          - 모바일: 100%
          - 데스크탑에서도 레퍼런스처럼: 420px 고정폭 느낌
          - 원하면 md:max-w-6xl 로 바꾸면 “웹 확장 버전” 됨 */}
      <div className="mx-auto w-full max-w-[420px] md:max-w-6xl px-3 md:px-6 pb-10">

        {/* Error badge */}
        {loadError ? (
          <div className="mt-3 inline-flex items-center gap-2 border border-black/60 bg-white/70 px-3 py-1 rounded-full text-[11px] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
            ⚠️ {loadError}
          </div>
        ) : null}


        {/* HERO (모바일 1열) */}
        <section className="mt-4">
          {/* Poster */}
          <div className="rounded-[18px] border border-black/70 bg-[#F7C95A] shadow-[0_10px_30px_rgba(0,0,0,0.15)] px-6 py-7">
            <div className="font-extrabold tracking-[0.18em] text-[11px]">REAL TIME</div>

            <div className="mt-5 font-black leading-[0.92] text-black">
              <div className="text-[52px] tracking-tight">DESSERT</div>
              <div className="text-[52px] tracking-tight">STOCK</div>
            </div>

            <div className="mt-6 h-px bg-black/70 w-full" />
            <div className="mt-4 font-extrabold tracking-[0.24em] text-[11px]">SEOUL · 2026</div>
          </div>


          {/* Title line */}
          <div className="mt-5 flex items-end gap-3">
            <h2 className="text-4xl font-black tracking-tight">디저트 재고</h2>
            <div className="flex-1 h-px bg-black/60 mb-2" />
            <div className="text-[12px] font-black mb-2 text-black/80">©24</div>
          </div>

          {/* Filters */}
          <div className="mt-1">
            <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        </section>

        {/* Map */}
        <section className="mt-4">
          <div className="relative h-[240px] rounded-[18px] border border-black/70 overflow-hidden bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
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
            <div className="mt-3 inline-flex items-center gap-2 border border-black/60 bg-white/70 px-3 py-1 rounded-full text-[11px] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              ⏳ loading...
            </div>
          ) : null}
        </section>

        {/* List */}
        {!isLoading && (
          <section className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-[13px] font-black tracking-[0.12em]">NEARBY STORES</h3>
              <div className="flex-1 h-px bg-black/60" />
              <div className="text-[12px] font-black text-black/80">{filteredStores.length}</div>
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
