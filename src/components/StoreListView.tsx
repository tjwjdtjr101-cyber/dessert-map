import { Store, Category } from '../data/stores';

interface StoreListViewProps {
  stores: Store[];
  category: Category;
  onStoreSelect: (store: Store) => void;
  onZoomToStore: (lat: number, lng: number) => void;
}

export default function StoreListView({
  stores,
  onStoreSelect,
  onZoomToStore,
}: StoreListViewProps) {
  if (stores.length === 0) {
    return (
      <div className="py-12 text-center text-black/60 font-semibold">
        표시할 매장이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stores.map((store) => (
        <button
          key={store.id}
          onClick={() => {
            onStoreSelect(store);
            onZoomToStore(store.lat, store.lng);
          }}
          className="group text-left rounded-[18px] bg-white/80 backdrop-blur
            shadow-[0_8px_20px_rgba(0,0,0,0.12)]
            hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)]
            transition-shadow"
        >
          {/* 썸네일 */}
          <div className="h-28 rounded-t-[18px] bg-gradient-to-br from-yellow-200 to-orange-200 flex items-center justify-center text-4xl">
            🍰
          </div>

          {/* 콘텐츠 */}
          <div className="p-4">
            <div className="font-black text-sm text-black truncate">
              {store.name}
            </div>

            <div className="mt-1 text-[11px] text-black/60 truncate">
              {store.address}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs font-bold text-black">
                {store.price ? `${store.price.toLocaleString()}원` : '가격 정보 없음'}
              </div>

              <span
                className={[
                  'text-[10px] font-extrabold px-2 py-1 rounded-full',
                  store.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : store.status === 'soldout'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800',
                ].join(' ')}
              >
                {store.status === 'available'
                  ? '판매중'
                  : store.status === 'soldout'
                    ? '품절'
                    : '확인중'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}