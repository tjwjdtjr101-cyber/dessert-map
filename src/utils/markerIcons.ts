import { Icon } from 'leaflet';
import { StockStatus, Category } from '../data/stores';

const createEmojiIcon = (emoji: string, bgColor: string = 'white') => {
  const svg = `
    <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
        </filter>
      </defs>
      <circle cx="20" cy="18" r="17" fill="${bgColor}" stroke="#FF8C42" stroke-width="2.5" filter="url(#shadow)"/>
      <text x="20" y="26" font-size="22" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      <polygon points="20,42 14,28 26,28" fill="#FF8C42"/>
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
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNCIgY3k9IjE0IiByPSI4IiBmaWxsPSIjM0I4MkY2Ii8+PGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTIiIHN0cm9rZT0iIzNCODJGNiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PC9zdmc+',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});
