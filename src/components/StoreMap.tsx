import { useEffect, useRef, useState } from 'react';
import { Store, Category, StoreCategory } from '../data/stores';

interface StoreMapProps {
  stores: Store[]; // (호환용)
  activeCategory: Category;
  onSelectStore: (store: Store) => void;
  onMapReady?: (mapInstance: any) => void;
}

declare global {
  interface Window {
    naver: any;
  }
}

type AnyStore = any;

export default function StoreMap({ activeCategory, onSelectStore, onMapReady }: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [runtimeStores, setRuntimeStores] = useState<AnyStore[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/stores.json?ts=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`stores.json fetch failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setRuntimeStores(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setRuntimeStores([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!window.naver?.maps) {
        setMapError(
          `네이버 지도 인증/로드에 실패했습니다.\n` +
            `현재 URL: ${window.location.href}\n\n` +
            `네이버 클라우드 플랫폼 → Maps → Application → Web 서비스 URL에\n` +
            `현재 주소가 등록되어 있는지 확인해주세요.`
        );
      }
    }, 8000);

    const waitForMaps = () => {
      if (window.naver?.maps) {
        window.clearTimeout(timeoutId);
        setIsMapLoaded(true);
        return;
      }
      window.setTimeout(waitForMaps, 100);
    };

    waitForMaps();
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps || !isMapLoaded) return;
    if (mapInstanceRef.current) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.5665, 126.978),
      zoom: 12,
      zoomControl: true,
      zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT },
    });

    mapInstanceRef.current = map;
    onMapReady?.(map);

    // 📍 버튼
    const locationButton = document.createElement('button');
    locationButton.type = 'button';
    locationButton.innerHTML = '📍';
    locationButton.style.cssText = `
      position:absolute; bottom:14px; right:14px;
      width:46px; height:46px;
      background:#fff; border:3px solid #000;
      border-radius:10px; font-size:22px;
      cursor:pointer; box-shadow:4px 4px 0 #000;
      z-index:1000;
    `;

    locationButton.addEventListener('click', () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        map.setCenter(new window.naver.maps.LatLng(latitude, longitude));
        map.setZoom(15);

        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null);
          userMarkerRef.current = null;
        }

        const userMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(latitude, longitude),
          map,
          icon: {
            content: `
  <div style="
    width:32px;height:32px;border-radius:9999px;
    background:rgba(255,255,255,0.92);
    border:1px solid rgba(0,0,0,0.35);
    box-shadow:0 8px 18px rgba(0,0,0,0.14);
    display:flex;align-items:center;justify-content:center;
    font-size:17px;
  ">
    <span style="transform: translateY(-0.5px);">${emoji}</span>
  </div>
`,
anchor: new window.naver.maps.Point(16, 16),
          },
        });

        userMarkerRef.current = userMarker;
      });
    });

    mapRef.current.appendChild(locationButton);

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
      try {
        mapRef.current?.removeChild(locationButton);
      } catch {}
    };
  }, [isMapLoaded, onMapReady]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver?.maps || !isMapLoaded) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const categoryEmojis: Record<string, string> = {
      dubai: '🍪',
      bungeoppang: '🐟',
      goguma: '🍠',
      cake: '🎂',
    };

    const storesToRender =
      activeCategory === 'all'
        ? runtimeStores
        : runtimeStores.filter((s: AnyStore) => {
            const cats: StoreCategory[] = Array.isArray(s?.categories)
              ? s.categories
              : s?.category
                ? [s.category]
                : [];
            return cats.includes(activeCategory as StoreCategory);
          });

    // ✅ 과밀 완화: 너무 많으면 일부만 (원하면 제거 가능)
    const limited = storesToRender.slice(0, 120);

    limited.forEach((store: AnyStore) => {
      const lat = Number(store?.lat);
      const lng = Number(store?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const cat = (store?.category ?? store?.categories?.[0] ?? 'dubai') as string;
      const emoji = categoryEmojis[String(cat)] || '🍪';

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(lat, lng),
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="position:relative; cursor:pointer;">
              <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="shadow-${store.id}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.35"/>
                  </filter>
                </defs>
                <circle cx="20" cy="18" r="17" fill="#fff" stroke="#000" stroke-width="3" filter="url(#shadow-${store.id})"/>
                <text x="20" y="26" font-size="22" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
                <polygon points="20,42 14,28 26,28" fill="#000"/>
              </svg>
            </div>
          `,
          anchor: new window.naver.maps.Point(20, 48),
        },
      });

      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding:14px; width:280px; background:#fff; border:3px solid #000; box-shadow:4px 4px 0 #000; border-radius:12px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="margin-bottom:10px; padding-bottom:10px; border-bottom:2px solid #000;">
              <h3 style="font-weight:900; font-size:18px; margin:0 0 4px 0;">${store?.name ?? ''}</h3>
              <p style="font-size:12px; color:#6b7280; margin:0;">${store?.address ?? ''}</p>
            </div>
            <button id="detail-btn-${store.id}" style="width:100%; background:#000; color:#fff; font-weight:900; padding:10px; border-radius:10px; border:3px solid #000; cursor:pointer;">
              상세보기
            </button>
          </div>
        `,
        borderWidth: 0,
        disableAnchor: true,
        backgroundColor: 'transparent',
        pixelOffset: new window.naver.maps.Point(0, -10),
      });

      window.naver.maps.Event.addListener(marker, 'click', () => {
        if (infoWindow.getMap()) {
          infoWindow.close();
          return;
        }
        infoWindow.open(mapInstanceRef.current, marker);
        setTimeout(() => {
          const btn = document.getElementById(`detail-btn-${store.id}`);
          if (btn) btn.onclick = () => onSelectStore(store as Store);
        }, 80);
      });

      markersRef.current.push(marker);
    });
  }, [runtimeStores, activeCategory, onSelectStore, isMapLoaded]);

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-6">
          <div className="text-5xl mb-3">❌</div>
          <h3 className="text-xl font-black text-red-800 mb-2">지도 인증 실패</h3>
          <p className="text-red-600 whitespace-pre-line">{mapError}</p>
        </div>
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-black border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-700 font-semibold">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}