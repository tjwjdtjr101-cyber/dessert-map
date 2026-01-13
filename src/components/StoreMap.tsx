import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Store } from '../data/stores';
import 'leaflet/dist/leaflet.css';

interface StoreMapProps {
  stores: Store[];
  onSelectStore: (store: Store) => void;
  onMapReady?: (map: any) => void;
}

function LocationControl() {
  const map = useMap();
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);

  useEffect(() => {
    const locationControl = L.control({ position: 'bottomright' });

    locationControl.onAdd = () => {
      const button = L.DomUtil.create('button', 'location-button');
      button.innerHTML = '📍';
      button.style.cssText = `
        width: 50px;
        height: 50px;
        background-color: #FF8C42;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      `;

      L.DomEvent.disableClickPropagation(button);

      button.onmouseenter = () => {
        button.style.backgroundColor = '#FF7A2E';
        button.style.transform = 'scale(1.1)';
      };

      button.onmouseleave = () => {
        button.style.backgroundColor = '#FF8C42';
        button.style.transform = 'scale(1)';
      };

      button.onclick = () => {
        if (navigator.geolocation) {
          button.innerHTML = '⏳';
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;

              if (userMarker) {
                map.removeLayer(userMarker);
              }

              const customIcon = L.divIcon({
                html: `
                  <div style="width: 28px; height: 28px; position: relative;">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="14" cy="14" r="8" fill="#3B82F6"/>
                      <circle cx="14" cy="14" r="12" stroke="#3B82F6" stroke-width="3" fill="none"/>
                    </svg>
                  </div>
                `,
                className: 'user-location-marker',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              });

              const marker = L.marker([latitude, longitude], { icon: customIcon })
                .addTo(map)
                .bindPopup('현재 위치')
                .openPopup();

              setUserMarker(marker);
              map.setView([latitude, longitude], 15);
              button.innerHTML = '📍';
            },
            () => {
              alert('현재 위치를 가져올 수 없습니다.');
              button.innerHTML = '📍';
            }
          );
        }
      };

      return button;
    };

    locationControl.addTo(map);

    return () => {
      locationControl.remove();
    };
  }, [map, userMarker]);

  return null;
}

function MapInitializer({ onMapReady }: { onMapReady?: (map: any) => void }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

export default function StoreMap({ stores, onSelectStore, onMapReady }: StoreMapProps) {
  const categoryEmojis: Record<string, string> = {
    dubai: '🍪',
    bungeoppang: '🐟',
    goguma: '🍠',
    cake: '🎂',
  };

  const createCustomIcon = (store: Store) => {
    const emoji = categoryEmojis[store.category] || '🍪';

    return L.divIcon({
      html: `
        <div style="position: relative;">
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
      className: 'custom-marker',
      iconSize: [40, 48],
      iconAnchor: [20, 48],
      popupAnchor: [0, -48],
    });
  };

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-xl">
      <MapContainer
        center={[37.5665, 126.978]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapInitializer onMapReady={onMapReady} />
        <LocationControl />

        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.lat, store.lng]}
            icon={createCustomIcon(store)}
          >
            <Popup maxWidth={300} className="custom-popup">
              <div style={{ padding: '8px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid #FF8C42' }}>
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: '#111827', margin: '0 0 4px 0' }}>
                    {store.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                    {store.address}
                  </p>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  {store.rating && (
                    <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>
                      <span style={{ color: '#fbbf24' }}>⭐</span>{' '}
                      <span style={{ fontWeight: '600' }}>{store.rating}</span>
                    </p>
                  )}
                  <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 8px 0' }}>
                    <span style={{ fontWeight: '600' }}>가격:</span> {store.price.toLocaleString()}원
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>상태:</span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        ...(store.status === 'available'
                          ? { backgroundColor: '#d1fae5', color: '#065f46' }
                          : store.status === 'soldout'
                          ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                          : { backgroundColor: '#fed7aa', color: '#9a3412' }),
                      }}
                    >
                      {store.status === 'available' ? '판매중' : store.status === 'soldout' ? '품절' : '확인필요'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => onSelectStore(store)}
                    style={{
                      width: '100%',
                      backgroundColor: '#FF8C42',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FF7A2E')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF8C42')}
                  >
                    상세보기
                  </button>
                  <a
                    href={`https://map.naver.com/search/${encodeURIComponent(store.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '100%',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      fontWeight: 'bold',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'block',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  >
                    길찾기
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style>{`
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
        .custom-marker {
          background: none;
          border: none;
        }
        .user-location-marker {
          background: none;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip-container {
          display: none;
        }
      `}</style>
    </div>
  );
}
