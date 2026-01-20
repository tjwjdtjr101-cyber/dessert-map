import { useEffect, useRef, useState } from 'react';
import { Store } from '../data/stores';

interface StoreMapProps {
  // ✅ 기존 props 유지 (부모가 뭐를 넘기든 상관없이 StoreMap이 직접 runtimeStores를 가져오게 함)
  stores: Store[];
  activeCategory: Category; // ✅ 추가
  onSelectStore: (store: Store) => void;
  onMapReady?: (mapInstance: any) => void;
}

declare global {
  interface Window {
    naver: any;
  }
}

export default function StoreMap({ stores, onSelectStore, onMapReady }: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // ✅ StoreMap이 직접 stores.json을 로드해서 사용
  const [runtimeStores, setRuntimeStores] = useState<Store[]>([]);

  /**
   * ✅ stores.json 로드 (StoreMap에서 직접)
   */
  useEffect(() => {
    (async () => {
      try {
        console.log('🚀 StoreMap fetching /stores.json');
        const res = await fetch('/stores.json?ts=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`stores.json fetch failed: ${res.status}`);

        const data = await res.json();
        if (Array.isArray(data)) {
          setRuntimeStores(data);
          console.log('✅ StoreMap loaded stores:', data.length);
        } else {
          setRuntimeStores([]);
          console.warn('⚠️ stores.json is not an array');
        }
      } catch (e) {
        console.error('❌ StoreMap failed to load stores.json', e);
        setRuntimeStores([]);
      }
    })();
  }, []);

  /**
   * ✅ [기존] 네이버 지도 스크립트 로드/준비 완료 체크
   */
  useEffect(() => {
    console.log('현재 접속 URL:', window.location.href);
    console.log('현재 도메인:', window.location.hostname);
    console.log('프로토콜:', window.location.protocol);

    const timeoutId = window.setTimeout(() => {
      if (!window.naver?.maps) {
        console.error('네이버 지도 API 로드 실패');
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
        console.log('naver.maps 객체 감지됨');

        if (typeof window.naver.maps.onJSContentLoaded === 'function') {
          window.naver.maps.onJSContentLoaded = () => {
            console.log('네이버 지도 JS Content Loaded');
            window.clearTimeout(timeoutId);
            setIsMapLoaded(true);
          };
        } else {
          window.clearTimeout(timeoutId);
          setIsMapLoaded(true);
        }
        return;
      }

      window.setTimeout(waitForMaps, 100);
    };

    waitForMaps();

    return () => window.clearTimeout(timeoutId);
  }, []);

  /**
   * 지도 생성 (1회)
   */
  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps || !isMapLoaded) return;
    if (mapInstanceRef.current) return;

    const mapOptions = {
      center: new window.naver.maps.LatLng(37.5665, 126.978),
      zoom: 12,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    };

    const map = new window.naver.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = map;
    onMapReady?.(map);

    // 📍 내 위치 버튼
    const locationButton = document.createElement('button');
    locationButton.innerHTML = '📍';
    locationButton.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background-color: #FF8C42;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      transition: all 0.3s ease;
    `;

    locationButton.addEventListener('mouseenter', () => {
      locationButton.style.backgroundColor = '#FF7A2E';
      locationButton.style.transform = 'scale(1.1)';
    });

    locationButton.addEventListener('mouseleave', () => {
      locationButton.style.backgroundColor = '#FF8C42';
      locationButton.style.transform = 'scale(1)';
    });

    locationButton.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);

          map.setCenter(new window.naver.maps.LatLng(latitude, longitude));
          map.setZoom(15);

          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
          }

          const userMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(latitude, longitude),
            map: map,
            icon: {
              content: `
                <div style="width: 28px; height: 28px; position: relative;">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="8" fill="#3B82F6"/>
                    <circle cx="14" cy="14" r="12" stroke="#3B82F6" stroke-width="3" fill="none"/>
                  </svg>
                </div>
              `,
              anchor: new window.naver.maps.Point(14, 14),
            },
          });

          userMarkerRef.current = userMarker;
        });
      }
    });

    if (mapRef.current) {
      mapRef.current.appendChild(locationButton);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
    };
  }, [onMapReady, isMapLoaded]);

  /**
   * 마커 렌더링
   * - ✅ runtimeStores(=stores.json) 기준으로 렌더
   */
  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver?.maps || !isMapLoaded || !Array.isArray(runtimeStores)) return;

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const categoryEmojis: Record<string, string> = {
      dubai: '🍪',
      bungeoppang: '🐟',
      goguma: '🍠',
      cake: '🎂',
    };

    runtimeStores.forEach((store: any) => {
      // ✅ 좌표 방어
      if (store.lat == null || store.lng == null) return;
      const lat = Number(store.lat);
      const lng = Number(store.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      // ✅ category 방어 (category 없으면 categories[0])
      const cat = store.category ?? store.categories?.[0] ?? 'dubai';
      const emoji = categoryEmojis[String(cat)] || '🍪';

      // ✅ price/status 방어
      const safePrice = typeof store.price === 'number' ? store.price : Number(store.price);
      const priceText = Number.isFinite(safePrice) ? safePrice.toLocaleString() : '-';
      const safeStatus = store.status ?? 'unknown';

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(lat, lng),
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="position: relative; cursor: pointer;">
              <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="shadow-${store.id}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
                  </filter>
                </defs>
                <circle cx="20" cy="18" r="17" fill="white" stroke="#FF8C42" stroke-width="2.5" filter="url(#shadow-${store.id})"/>
                <text x="20" y="26" font-size="22" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
                <polygon points="20,42 14,28 26,28" fill="#FF8C42"/>
              </svg>
            </div>
          `,
          anchor: new window.naver.maps.Point(20, 48),
        },
      });

      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding: 16px; width: 280px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #FF8C42;">
              <h3 style="font-weight: bold; font-size: 18px; color: #111827; margin: 0 0 4px 0;">${store.name ?? ''}</h3>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">${store.address ?? ''}</p>
            </div>
            <div style="margin-bottom: 12px;">
              ${
                store.rating
                  ? `<p style="font-size: 14px; margin: 0 0 8px 0;"><span style="color: #fbbf24;">⭐</span> <span style="font-weight: 600;">${store.rating}</span></p>`
                  : ''
              }
              <p style="font-size: 14px; color: #374151; margin: 0 0 8px 0;"><span style="font-weight: 600;">가격:</span> ${priceText}원</p>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 600; font-size: 14px; color: #374151;">상태:</span>
                <span style="
                  font-size: 12px;
                  font-weight: bold;
                  padding: 4px 8px;
                  border-radius: 9999px;
                  ${
                    safeStatus === 'available'
                      ? 'background-color: #d1fae5; color: #065f46;'
                      : safeStatus === 'soldout'
                      ? 'background-color: #fee2e2; color: #991b1b;'
                      : 'background-color: #fed7aa; color: #9a3412;'
                  }
                ">
                  ${safeStatus === 'available' ? '판매중' : safeStatus === 'soldout' ? '품절' : '확인필요'}
                </span>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button
                id="detail-btn-${store.id}"
                style="
                  width: 100%;
                  background-color: #FF8C42;
                  color: white;
                  font-weight: bold;
                  padding: 8px;
                  border-radius: 8px;
                  border: none;
                  cursor: pointer;
                  font-size: 14px;
                  transition: background-color 0.2s;
                "
                onmouseover="this.style.backgroundColor='#FF7A2E'"
                onmouseout="this.style.backgroundColor='#FF8C42'"
              >
                상세보기
              </button>
              <a
                href="https://map.naver.com/search/${encodeURIComponent(store.address ?? '')}"
                target="_blank"
                style="
                  width: 100%;
                  background-color: #f3f4f6;
                  color: #374151;
                  font-weight: bold;
                  padding: 8px;
                  border-radius: 8px;
                  border: none;
                  cursor: pointer;
                  font-size: 14px;
                  text-align: center;
                  text-decoration: none;
                  display: block;
                  transition: background-color 0.2s;
                "
                onmouseover="this.style.backgroundColor='#e5e7eb'"
                onmouseout="this.style.backgroundColor='#f3f4f6'"
              >
                길찾기
              </a>
            </div>
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
        } else {
          infoWindow.open(mapInstanceRef.current, marker);

          setTimeout(() => {
            const detailBtn = document.getElementById(`detail-btn-${store.id}`);
            if (detailBtn) {
              detailBtn.addEventListener('click', () => {
                onSelectStore(store as Store);
                infoWindow.close();
              });
            }
          }, 100);
        }
      });

      markersRef.current.push(marker);
    });
  }, [runtimeStores, onSelectStore, isMapLoaded]);

  if (mapError) {
    return (
      <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-xl bg-red-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-2xl">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-red-800 mb-2">지도 인증 실패</h3>
          <p className="text-red-600 mb-4 whitespace-pre-line">{mapError}</p>
          <div className="text-sm text-gray-700 bg-white p-4 rounded-lg text-left">
            <p className="font-semibold mb-3 text-base">해결 방법:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li className="mb-2">
                <strong>현재 URL을 복사하세요</strong> (브라우저 주소창)
              </li>
              <li className="mb-2">
                <strong>네이버 클라우드 플랫폼</strong> → <strong>AI·NAVER API</strong> → <strong>Application</strong>
              </li>
              <li className="mb-2">
                <strong>서비스 환경</strong>에서 <strong>Web 서비스 URL</strong>에 현재 URL 추가
              </li>
              <li className="mb-2">또는 클라이언트 ID가 <strong>Web Dynamic Map</strong> 서비스용인지 확인</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs font-semibold text-yellow-800 mb-1">💡 TIP</p>
              <p className="text-xs text-yellow-700">Bolt 환경은 프리뷰(iframe) 대신 새 탭에서 열어 테스트하세요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-xl bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF8C42] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return <div id="map" ref={mapRef} className="w-full h-[500px] rounded-xl overflow-hidden shadow-xl" />;
}