import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Bell, Search } from 'lucide-react';
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

  // 숫자 카드에 쓸 값들
  const todayCount = filteredStores.length;

  return (
    <div className="min-h-screen bg-[#FFD400]">
      {/* ===== Top Bar (기존 헤더 대체: 사진1 스타일) ===== */}
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

      {/* ===== Hero (사진1 + 사진2 믹스) ===== */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        {/* (옵션) 로드 에러 배지 */}
        {loadError ? (
          <div className="mb-3 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 rounded-full text-xs font-semibold shadow-[3px_3px_0_#000]">
            ⚠️ {loadError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LEFT: REAL TIME 카드 */}
          <div className="md:col-span-2 h-[120px] rounded-xl border-4 border-black bg-gradient-to-r from-pink-500 via-orange-400 to-purple-500 shadow-[6px_6px_0_#000] flex flex-col justify-center px-6">
            <div className="text-white text-4xl md:text-5xl font-black tracking-[0.06em]">
              REAL TIME
            </div>
            <div className="text-white/90 text-xs font-semibold tracking-wider mt-1">
              STOCK UPDATES
            </div>
          </div>

          {/* RIGHT: TODAY 카드 */}
          <div className="h-[120px] rounded-xl border-4 border-black shadow-[6px_6px_0_#000] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 flex">
              <div className="flex-1 bg-white flex flex-col justify-center px-4">
                <div className="text-[11px] text-gray-500 font-bold tracking-widest">
                  TODAY
                </div>
                <div className="text-4xl font-black leading-none mt-1">{todayCount}+</div>
                <div className="text-[11px] font-bold tracking-widest mt-1">
                  STORES
                </div>
              </div>

              {/* 여기 이미지는 선택사항:
                  public/images/hero_dessert.png 같은 파일을 두면 더 “포스터 느낌”으로 살아남
              */}
              <div className="w-[140px] flex items-center justify-center">
                <img
                  src="/images/hero_dessert.png"
                  alt="dessert"
                  className="w-[110px] h-[110px] object-contain drop-shadow-lg"
                  onError={(e) => {
                    // 이미지 없을 때 깨지지 않게
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="text-white/90 text-2xl font-black" aria-hidden>
                  🍫
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Title line (사진2 타이포 느낌) ===== */}
        <div className="mt-5 flex items-center gap-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">디저트 재고</h2>
          <div className="flex-1 h-[2px] bg-black" />
          <div className="text-sm font-black">©24</div>
        </div>

        {/* ===== Filter + Search Row ===== */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="shrink-0">
            {/* ✅ 기존 컴포넌트 그대로 */}
            <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>

          {/* Search (기존 화면 감성 섞기: 라운드+굵은 라인) */}
          <div className="md:ml-auto flex items-center gap-2 bg-white border-2 border-black rounded-full px-4 py-3 shadow-[4px_4px_0_#000] max-w-xl w-full md:w-[420px]">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent outline-none text-sm font-semibold"
              readOnly
            />
          </div>
        </div>
      </section>

      {/* ===== Map Section ===== */}
      <section className="max-w-6xl mx-auto px-4 mt-5">
        <div className="relative h-[280px] md:h-[340px] rounded-xl border-4 border-black overflow-hidden bg-white shadow-[6px_6px_0_#000]">
          <StoreMap
            stores={filteredStores as unknown as Store[]}
            activeCategory={activeCategory} // ✅ 기존 props 유지
            onSelectStore={setSelectedStore}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
          <button
            className="absolute right-3 bottom-3 w-11 h-11 border-2 border-black bg-white grid place-items-center shadow-[3px_3px_0_#000]"
            title="현재 위치"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>

        {/* 로딩 표시 */}
        {isLoading ? (
          <div className="mt-3 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 rounded-full text-xs font-semibold shadow-[3px_3px_0_#000]">
            ⏳ stores loading...
          </div>
        ) : null}
      </section>

      {/* ===== Nearby Section ===== */}
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

      {/* ✅ 기존 모달 유지 */}
      <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} />
    </div>
  );
}