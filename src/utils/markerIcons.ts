import { Icon } from 'leaflet';
import { StockStatus, Category } from '../data/stores';

const OUTLINE = '#AC998C'; // ✅ 배경과 어울리는 브라운-뉴트럴 톤

const createEmojiIcon = (emoji: string, bgColor: string = 'white') => {
  // ✅ filter id 충돌 방지 (여러 마커가 동시에 떠도 안전)
  const safeId = `shadow-${encodeURIComponent(emoji)}`.replace(/%/g, '');

  const svg = `
    <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="${safeId}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.35"/>
        </filter>
      </defs>

      <!-- ✅ 검정 아웃라인 → 배경톤 아웃라인 -->
      <circle
        cx="20"
        cy="18"
        r="17"
        fill="${bgColor}"
        filter="url(#${safeId})"
      />
      <text x="20" y="26" font-size="22" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      <polygon points="20,42 14,28 26,28" fill="#000000"/>
    </svg>
  `;

  const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  return new Icon({
    iconUrl: dataUrl,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });
};

// ✅ 두바이 쿠키 전용 아이콘(이미지 기반)
// - 테두리 색은 index.css의 .dubai-marker에서 제어
export const dubaiCookieIcon = new Icon({
  iconUrl: '/두바이쫀든쿠키.png',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
  className: 'dubai-marker',
});

export const markerIcons: Record<StockStatus, Icon> = {
  available: dubaiCookieIcon,
  soldout: createEmojiIcon('❌', '#fee2e2'),
  check: createEmojiIcon('⏰', '#fed7aa'),
};

export const markerIconsByCategory: Record<Category, Icon> = {
  all: dubaiCookieIcon,
  dubai: dubaiCookieIcon,
  bungeoppang: createEmojiIcon('🐟', '#fef3c7'),
  goguma: createEmojiIcon('🍠', '#fde68a'),
  cake: createEmojiIcon('🎂', '#fce7f3'),
};

export const userLocationIcon = new Icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iOCIgZmlsbD0iIzI1NjNFQiIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iNCIgZmlsbD0iIzI1NjNFQiIvPgo8L3N2Zz4=',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});