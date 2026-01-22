import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Bell } from 'lucide-react';
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
          </div>

          <div className="max-w-4xl mx-auto mb-8">
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
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <StoreMap
              stores={filteredStores as unknown as Store[]}
              activeCategory={activeCategory}
              onSelectStore={setSelectedStore}
              onMapReady={(map) => {
                mapRef.current = map;
              }}
            />
          </div>
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
          <p className="text-gray-600 text-sm">
            © 2026 Dubai Dessert. 모든 디저트 정보는 실시간으로 업데이트됩니다.
          </p>
        </div>
      </footer>

      <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} />
    </div>
  );
}