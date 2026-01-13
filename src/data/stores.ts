export type StockStatus = 'available' | 'soldout' | 'check';
export type Category = 'all' | 'dubai' | 'bungeoppang' | 'goguma' | 'cake';

export interface Store {
  id: number;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  status: StockStatus;
  price: number;
  category: Category;
  instagramHandle?: string;
  distance?: string;
  rating?: number;
}

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
    category: 'dubai',
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
    category: 'dubai',
    rating: 4.7,
    distance: '420m',
    instagramHandle: 'yeonnam_cookie_spot',
  }


  
];
