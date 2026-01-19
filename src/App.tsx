import { useEffect, useState, useRef } from 'react';
import { MapPin, Bell } from 'lucide-react';
import StoreMap from './components/StoreMap';
import StoreDetailModal from './components/StoreDetailModal';
import CategoryFilter from './components/CategoryFilter';
import StoreListView from './components/StoreListView';
import { Store, Category, StoreCategory } from './data/stores';

function App() {
  const [stores, setStores] = useState<Store[]>([]);           // ✅ 추가: 서버/정적json에서 온 stores
  const [loadError, setLoadError] = useState<string | null>(null); // ✅ 선택(디버깅용)

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const mapRef = useRef<any>(null);

  // ✅ 추가: 앱 시작 시 stores.json 로드
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/stores.json?ts=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error(`stores.json fetch failed: ${res.status}`);
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
        setLoadError(null);
      } catch (e: any) {
        setLoadError(e?.message ?? "failed to load stores.json");
        setStores([]);
      }
    })();
  }, []);

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
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
              서울에서 찾는
            </h2>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#FF8C42] to-[#FF6B1A] bg-clip-text text-transparent mb-5">
              프리미엄 디저트
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              가장 가까운 판매처의 실시간 재고를 확인하고
            </p>
            <p className="text-gray-600 text-base md:text-lg">
              신선한 디저트를 즐기세요
            </p>
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
              stores={filteredStores}
              onSelectStore={setSelectedStore}
              onMapReady={(map) => {
                mapRef.current = map;
              }}
            />
          </div>
        </div>
      </div>

      <StoreListView
        stores={filteredStores}
        category={activeCategory}
        onStoreSelect={setSelectedStore}
        onZoomToStore={handleZoomToStore}
      />

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2024 Dubai Dessert. 모든 디저트 정보는 실시간으로 업데이트됩니다.
          </p>
        </div>
      </footer>

      <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} />
    </div>
  );
}

export default App;
