import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Bell } from 'lucide-react';
import { Bell, Menu, User, Home, Search, Map as MapIcon, MoreHorizontal, Plus } from 'lucide-react';
import StoreMap from './components/StoreMap';
import StoreDetailModal from './components/StoreDetailModal';
import CategoryFilter from './components/CategoryFilter';
import StoreListView from './components/StoreListView';

// ✅ 더미 데이터는 "fallback" 용도로만 사용
import { stores as fallbackStores, Store, Category, StoreCategory } from './data/stores';

console.log("🔥 App.tsx LOADED", new Date().toISOString());

type StoreWithCompat = Store & {
  // stores.json이 category를 포함할 수도 / 안 할 수도 있어서 호환 필드 추가
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
    // 최소 필수 필드가 없는 건 제거(지도/리스트 깨짐 방지)
    .filter((s) => typeof s?.id === 'number' && typeof s?.lat === 'number' && typeof s?.lng === 'number');
}

export default function App() {
  const [stores, setStores] = useState<StoreWithCompat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const mapRef = useRef<any>(null);

  useEffect(() => {
    console.log("🚀 fetching stores.json");
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // ✅ 캐시 회피(호스팅/브라우저 캐시 때문에 최신이 안 뜨는 케이스 방지)
        const res = await fetch('/stores.json?ts=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`stores.json fetch failed: ${res.status}`);

        const data = await res.json();
        const normalized = normalizeStores(data);

        if (!cancelled) {
          setStores(normalized);
          setIsLoading(false);
        }
      } catch (e: any) {
        // ✅ 실패 시 fallback 더미 데이터라도 보여주기
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
    const q = searchQuery.trim().toLowerCase();

    const cat = activeCategory as StoreCategory;
    return stores.filter((s) => {
      const categories = s.categories ?? (s.category ? [s.category] : []);
      return categories.includes(cat);
      // 1) category filter
      if (activeCategory !== 'all') {
        const cat = activeCategory as StoreCategory;
        const categories = s.categories ?? (s.category ? [s.category] : []);
        if (!categories.includes(cat)) return false;
      }

      // 2) search filter
      if (!q) return true;
      const hay = [s.name, s.address, s.district].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [stores, activeCategory]);
  }, [stores, activeCategory, searchQuery]);

  const handleZoomToStore = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/두바이쫀든쿠키.png" alt="Dubai Dessert" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dubai Dessert</h1>
                <p className="text-xs text-[#FF8C42] font-medium">실시간 디저트 트래킹</p>
    <div className="min-h-screen bg-[#F7C600] text-[#111] pb-20">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-[#F7C600] border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 border-2 border-black bg-white shadow-[2px_2px_0_#111] grid place-items-center" aria-label="Menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="font-black leading-none">
                <div className="text-sm">DESSERT</div>
                <div className="text-[10px] -mt-0.5 opacity-80">FINDER</div>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <button className="text-sm font-medium text-gray-700 hover:text-[#FF8C42] transition-colors">
                지도
              </button>
              <button className="text-sm font-medium text-gray-700 hover:text-[#FF8C42] transition-colors">
                판매처
              </button>
              <button className="text-sm font-medium text-gray-700 hover:text-[#FF8C42] transition-colors flex items-center gap-1">
                <Bell className="w-4 h-4" />
                알림설정
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 border-2 border-black bg-white shadow-[2px_2px_0_#111] grid place-items-center" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <button className="w-9 h-9 border-2 border-black bg-[#FF2D7A] shadow-[2px_2px_0_#111] grid place-items-center" aria-label="Profile">
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-br from-[#FFF5EB] to-[#FFF9F5] py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-block bg-[#FFE8D6] text-[#FF8C42] px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              ✨ 실시간 재고 업데이트
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">서울에서 찾는</h2>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#FF8C42] to-[#FF6B1A] bg-clip-text text-transparent mb-5">
              프리미엄 디저트
            </h2>
            <p className="text-gray-600 text-base md:text-lg">가장 가까운 판매처의 실시간 재고를 확인하고</p>
            <p className="text-gray-600 text-base md:text-lg">신선한 디저트를 즐기세요</p>
      <main className="max-w-6xl mx-auto px-4 pt-4 space-y-4">
        {/* Hero (스크린샷 레이아웃 + 1번(레트로) 톤) */}
        <section className="border-2 border-black shadow-[4px_4px_0_#111] bg-white p-6 md:p-8">
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 border-2 border-black bg-[#FFF3B0] shadow-[2px_2px_0_#111] text-[11px] font-black">
              ⚡ 실시간 재고 업데이트
            </span>
          </div>

          <div className="max-w-4xl mx-auto mb-8">
          <h1 className="mt-4 text-center font-black tracking-tight text-3xl md:text-5xl leading-tight">
            서울에서 찾는
            <br />
            <span className="inline-block px-2 bg-[#FF2D7A] text-white border-2 border-black shadow-[2px_2px_0_#111]">
              프리미엄 디저트
            </span>
          </h1>

          <p className="mt-3 text-center text-sm md:text-base font-bold text-black/70">
            가장 가까운 판매처의 실시간 재고를 확인하고, 신선한 디저트를 즐기세요.
          </p>

          {loadError ? (
            <div className="mt-4 text-center">
              <span className="inline-block text-[11px] font-black bg-[#111] text-white px-3 py-1 border-2 border-black shadow-[2px_2px_0_#111]">
                ⚠️ stores.json 로드 실패 → fallback 데이터 표시 중
              </span>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col items-center gap-3">
            <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>

          <div className="max-w-5xl mx-auto mb-8">
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="서울특별시에서 검색 중..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#FF8C42] focus:outline-none text-gray-700 font-medium shadow-sm"
                readOnly
              />
            <div className="w-full max-w-3xl">
              <label className="sr-only" htmlFor="store-search">Search</label>
              <div className="flex items-center gap-2 border-2 border-black shadow-[4px_4px_0_#111] bg-white px-3 py-2">
                <Search className="w-5 h-5" />
                <input
                  id="store-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="서울특별시에서 검색 (가게명/주소/구)"
                  className="w-full outline-none font-bold placeholder:text-black/40"
                />
                <div className="text-[11px] font-black opacity-70 whitespace-nowrap">
                  {filteredStores.length}곳
                </div>
              </div>
            </div>
          </div>
        </section>

          <div className="max-w-6xl mx-auto">
            <StoreMap
              // StoreMap/StoreListView는 Store 타입을 받는데,
              // 실제로는 StoreWithCompat가 Store를 포함하므로 캐스팅해서 전달
              stores={filteredStores as unknown as Store[]}
              activeCategory={activeCategory}   // ✅ 이 줄 추가
              onSelectStore={setSelectedStore}
              onMapReady={(map) => {
                mapRef.current = map;
              }}
            />
        {/* Section title above map */}
        <section className="space-y-1">
          <div className="flex items-end gap-3">
            <h2 className="text-2xl font-black">지도</h2>
            <div className="flex-1 border-b-2 border-black mb-2" />
            <div className="text-sm font-black">TODAY {stores.length}+</div>
          </div>
        </section>

        {/* Map */}
        <section>
          <StoreMap
            stores={filteredStores as unknown as Store[]}
            activeCategory={activeCategory}
            onSelectStore={setSelectedStore}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
        </section>

        {/* List */}
        {!isLoading ? (
          <StoreListView
            stores={filteredStores as unknown as Store[]}
            category={activeCategory}
            onStoreSelect={setSelectedStore}
            onZoomToStore={handleZoomToStore}
          />
        ) : (
          <div className="border-2 border-black shadow-[4px_4px_0_#111] bg-white p-6 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <div className="font-black">데이터 불러오는 중...</div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111] text-white border-t-2 border-black">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button className="flex flex-col items-center text-[10px] font-black gap-1 opacity-90">
            <Home className="w-5 h-5" />
            HOME
          </button>
          <button className="flex flex-col items-center text-[10px] font-black gap-1 opacity-90">
            <Search className="w-5 h-5" />
            SEARCH
          </button>
          <button className="w-11 h-11 border-2 border-black bg-[#FF2D7A] shadow-[2px_2px_0_#000] grid place-items-center -mt-6">
            <Plus className="w-6 h-6" />
          </button>
          <button className="flex flex-col items-center text-[10px] font-black gap-1 opacity-90">
            <MapIcon className="w-5 h-5" />
            MAP
          </button>
          <button className="flex flex-col items-center text-[10px] font-black gap-1 opacity-90">
            <MoreHorizontal className="w-5 h-5" />
            MORE
          </button>
        </div>
      </div>

      {!isLoading && (
        <StoreListView
          stores={filteredStores as unknown as Store[]}
          category={activeCategory}
          onStoreSelect={setSelectedStore}
          onZoomToStore={handleZoomToStore}
        />
      )}

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">© 2026 Dubai Dessert. 모든 디저트 정보는 실시간으로 업데이트됩니다.</p>
        </div>
      </footer>
      </nav>

      <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} />
    </div>
  );