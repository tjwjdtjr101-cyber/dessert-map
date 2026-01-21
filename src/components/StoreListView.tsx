import { ExternalLink, MapPin, Star, Clock } from 'lucide-react';
import { Store, Category, StoreCategory, StockStatus } from '../data/stores';

interface StoreListViewProps {
  stores: Store[];
  category: Category;
  onStoreSelect: (store: Store) => void;
  onZoomToStore: (lat: number, lng: number) => void;
}

const categoryLabels: Record<Category, string> = {
  all: 'ALL',
  dubai: 'DUBAI',
  bungeoppang: 'BUNGEOPPANG',
  goguma: 'GOGUMA',
  cake: 'CAKE',
};

const categoryEmojis: Record<Category, string> = {
  all: '🍪',
  dubai: '🍫',
  bungeoppang: '🐟',
  goguma: '🍠',
  cake: '🎂',
};

function statusToBadge(status: StockStatus) {
  // 스크린샷 톤: IN STOCK / LIMITED / SOLD OUT
  if (status === 'soldout') return { label: 'SOLD OUT', note: 'RESTOCKING' };
  if (status === 'check') return { label: 'LIMITED', note: 'HURRY!' };
  return { label: 'IN STOCK', note: 'AVAILABLE' };
}

function getMenuLines(categories: StoreCategory[]) {
  // 데이터에 메뉴가 없어서 카테고리 기반으로 “대표 메뉴” 느낌만 만들어줌
  const lines: Array<{ name: string; left: string }> = [];
  const has = (c: StoreCategory) => categories.includes(c);

  if (has('dubai')) {
    lines.push({ name: '두바이 쿠키 오리지널', left: '2 LEFT' });
    lines.push({ name: '두바이 피스타치오 쿠키', left: '8 LEFT' });
  }
  if (has('bungeoppang')) {
    lines.push({ name: '붕어빵 팥/슈크림', left: '5 LEFT' });
    lines.push({ name: '미니 붕어빵 세트', left: '3 LEFT' });
  }
  if (has('goguma')) {
    lines.push({ name: '군고구마 (대)', left: '12 LEFT' });
    lines.push({ name: '꿀고구마 스틱', left: '6 LEFT' });
  }
  if (has('cake')) {
    lines.push({ name: '얼그레이 케이크', left: '3 LEFT' });
    lines.push({ name: '초코 생크림 케이크', left: '2 LEFT' });
  }

  // 최소 2개는 보이게
  return lines.slice(0, 2);
}

export default function StoreListView({ stores, category, onStoreSelect, onZoomToStore }: StoreListViewProps) {
  const headerGradients = [
    'from-purple-600 to-blue-500',
    'from-rose-500 to-orange-400',
    'from-pink-500 to-red-500',
  ];

  return (
    <section className="bg-[#F7C600] pb-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end gap-3 pt-2">
          <h3 className="text-xl font-black tracking-wide">NEARBY STORES</h3>
          <div className="flex-1 border-b-2 border-black mb-2" />
          <div className="text-sm font-black">{stores.length}</div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store, idx) => {
            const badge = statusToBadge(store.status);
            const menu = getMenuLines(store.categories as StoreCategory[]);
            const gradient = headerGradients[idx % headerGradients.length];

            return (
              <div
                key={store.id}
                onClick={() => {
                  onStoreSelect(store);
                  onZoomToStore(store.lat, store.lng);
                }}
                className="border-2 border-black shadow-[4px_4px_0_#111] bg-white cursor-pointer"
              >
                <div className={`h-12 bg-gradient-to-r ${gradient} relative border-b-2 border-black`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://map.naver.com/search/${encodeURIComponent(store.address ?? store.name)}`, '_blank');
                    }}
                    className="absolute right-2 top-2 w-8 h-8 border-2 border-black bg-white shadow-[2px_2px_0_#111] grid place-items-center"
                    aria-label="Open in Naver Map"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-black truncate">{store.name}</div>
                      <div className="text-xs text-gray-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{store.district}</span>
                        {store.distance ? <span className="text-gray-500">{store.distance}</span> : null}
                      </div>
                    </div>

                    {store.rating ? (
                      <div className="flex items-center gap-1 text-xs font-black">
                        <Star className="w-4 h-4 fill-black" />
                        <span>{store.rating}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-1 border-2 border-black bg-white shadow-[1px_1px_0_#111] text-[11px] font-black flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      UNTIL 22:00
                    </span>
                    <span className="text-[11px] font-black flex items-center gap-2">
                      <span className="opacity-70">{categoryEmojis[category]}</span>
                      <span className="opacity-70">{categoryLabels[category]}</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {menu.map((m, i) => (
                      <div key={i} className="border-2 border-black bg-gray-100 p-2 flex items-center justify-between">
                        <div className="text-xs font-black">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{categoryEmojis[store.categories?.[0] ?? 'dubai']}</span>
                            <span>{m.name}</span>
                          </div>
                          <div className="text-[10px] text-gray-600 font-bold mt-0.5">{m.left}</div>
                        </div>

                        <div className="text-right">
                          <div className="px-2 py-1 border-2 border-black bg-white text-[10px] font-black">{badge.label}</div>
                          <div className="text-[10px] font-black mt-1 opacity-70">{badge.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {stores.length === 0 ? (
          <div className="border-2 border-black shadow-[4px_4px_0_#111] bg-white mt-6 p-6 text-center">
            <div className="text-4xl mb-2">🍪</div>
            <p className="font-black">해당 카테고리의 판매처가 없습니다</p>
            <p className="text-sm text-gray-600 mt-1">다른 카테고리를 선택해주세요</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
