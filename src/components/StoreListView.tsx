import { MapPin, Star, Clock } from 'lucide-react';
import { Store, Category } from '../data/stores';

interface StoreListViewProps {
  stores: Store[];
  category: Category;
  onStoreSelect: (store: Store) => void;
  onZoomToStore: (lat: number, lng: number) => void;
}

const categoryLabels: Record<Category, string> = {
  all: '전체',
  dubai: '두바이 쿠키',
  bungeoppang: '붕어빵',
  goguma: '군고구마',
  cake: '케이크',
};

const categoryEmojis: Record<Category, string> = {
  all: '🌟',
  dubai: '🍪',
  bungeoppang: '🐟',
  goguma: '🍠',
  cake: '🎂',
};

export default function StoreListView({ stores, category, onStoreSelect, onZoomToStore }: StoreListViewProps) {
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      available: { bg: 'bg-green-50 text-green-600', text: 'border-green-200', label: '재고 충분' },
      soldout: { bg: 'bg-red-50 text-red-600', text: 'border-red-200', label: '품절' },
      check: { bg: 'bg-orange-50 text-orange-600', text: 'border-orange-200', label: '재고 보통' },
    };
    return badges[status] || badges.available;
  };

  return (
    <div className="bg-[#FFF9F5] py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            주변 판매처
          </h2>
          <span className="text-sm text-gray-600 font-medium">{stores.length}개 매장</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => {
            const statusBadge = getStatusBadge(store.status);
            return (
              <div
                key={store.id}
                onClick={() => {
                  onStoreSelect(store);
                  onZoomToStore(store.lat, store.lng);
                }}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#FF8C42] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{store.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{store.district}</span>
                      {store.distance && <span>{store.distance}</span>}
                    </div>
                  </div>
                  {store.rating && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-sm text-gray-900">{store.rating}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-2xl">{categoryEmojis[store.category]}</span>
                    <span className="font-medium text-gray-700">{categoryLabels[store.category]}</span>
                  </div>

                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 ${statusBadge.bg} ${statusBadge.text}`}>
                    {statusBadge.label}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">22:00까지 영업</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStoreSelect(store);
                    }}
                    className="w-full bg-[#FF8C42] hover:bg-[#FF7A2E] text-white font-bold py-2.5 rounded-lg transition-all duration-200"
                  >
                    길찾기
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {stores.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg font-medium">해당 카테고리의 판매처가 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">다른 카테고리를 선택해주세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
