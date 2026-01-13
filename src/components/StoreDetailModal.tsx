import { X, Instagram, MapPin, Tag } from 'lucide-react';
import { Store } from '../data/stores';

interface StoreDetailModalProps {
  store: Store | null;
  onClose: () => void;
}

export default function StoreDetailModal({ store, onClose }: StoreDetailModalProps) {
  if (!store) return null;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: '판매중',
      soldout: '품절',
      check: '확인필요',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      soldout: 'bg-red-50 border-red-200 text-red-700',
      check: 'bg-orange-50 border-orange-200 text-orange-700',
    };
    return colors[status] || 'bg-gray-50';
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="relative h-24 bg-gradient-to-r from-[#93C572]/20 to-[#6B4423]/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-[#93C572]/30 mb-6">
            <h2 className="text-2xl font-bold text-[#6B4423] mb-4">{store.name}</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#93C572] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">주소</p>
                  <p className="text-gray-800">{store.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-[#93C572] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">메뉴</p>
                  <p className="text-gray-800">두바이 쫀득 쿠키</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-[#93C572] flex-shrink-0 mt-1 font-bold">₩</div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">가격</p>
                  <p className="text-gray-800 font-semibold">{store.price.toLocaleString()}원</p>
                </div>
              </div>

              <div className={`rounded-lg border-2 p-3 flex items-center justify-center ${getStatusColor(store.status)}`}>
                <span className="font-semibold">{getStatusLabel(store.status)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {store.instagramHandle && (
                <a
                  href={`https://instagram.com/${store.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#93C572] to-[#7AB35C] text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <Instagram className="w-5 h-5" />
                  인스타그램 방문
                </a>
              )}

              <a
                href={`https://map.naver.com/search/${encodeURIComponent(store.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#6B4423] text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <MapPin className="w-5 h-5" />
                네이버 지도에서 길찾기
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
