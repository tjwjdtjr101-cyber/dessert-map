export type StockStatus = 'available' | 'soldout' | 'check';
export type Category = 'all' | 'dubai' | 'bungeoppang' | 'goguma' | 'cake';

// 매장에 들어갈 실제 카테고리(=all 제외)
export type StoreCategory = Exclude<Category, 'all'>;

export interface Store {
  id: number;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  status: StockStatus;
  price: number;

  // ✅ 단일 -> 다중
  categories: StoreCategory[];

  instagramHandle?: string;
  distance?: string;
  rating?: number;
}

// ✅ 더미 데이터도 category -> categories 로 바꿔야 타입 에러 안 남
export const stores: Store[] = [
  {
    id: 1,
    name: '카페 메틀',
    address: '서울 마포구 연남동',
    district: '마포구',
    lat: 37.5664,
    lng: 126.9253,
    status: 'available',
    price: 5500,
    categories: ['dubai'],
    rating: 4.8,
    distance: '350m',
    instagramHandle: 'cafe_mettle',
  },
  {
    id: 2,
    name: '연남 쿠키스팟',
    address: '서울 마포구 연남동 12',
    district: '마포구',
    lat: 37.5659,
    lng: 126.9246,
    status: 'available',
    price: 5300,
    categories: ['dubai'],
    rating: 4.7,
    distance: '420m',
    instagramHandle: 'yeonnam_cookie_spot',
  },
];