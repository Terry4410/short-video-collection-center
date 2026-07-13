import { useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed, MapPin, Plus, Trash2 } from 'lucide-react';

type Point = { lat: number; lng: number };
type LocationItem = { id: string; title: string; placeName: string; mainCategory?: string; lat?: number; lng?: number };
type GoogleMapInstance = { panTo: (point: Point) => void; setZoom: (zoom: number) => void; getZoom: () => number; getCenter: () => { lat: () => number; lng: () => number } | undefined };
const TAIWAN_CENTER: Point = { lat: 23.6978, lng: 120.9605 };
const MAP_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let mapsLoader: Promise<any> | null = null;

function loadGoogleMaps() {
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(MAP_API_KEY) + '&v=weekly';
    script.async = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error('Google Maps 載入失敗'));
    document.head.appendChild(script);
  });
  return mapsLoader;
}

function readLastCenter(): { center: Point; zoom: number } | null {
  const lat = Number(localStorage.getItem('lastMapCenterLat'));
  const lng = Number(localStorage.getItem('lastMapCenterLng'));
  const zoom = Number(localStorage.getItem('lastMapZoom'));
  return Number.isFinite(lat) && Number.isFinite(lng) ? { center: { lat, lng }, zoom: Number.isFinite(zoom) ? zoom : 14 } : null;
}

function markerLabel(category = '') { if (category === '旅遊') return '🏞'; if (category === '美食') return '🍜'; if (category === '購物') return '🛍'; return '●'; }

export function GoogleMapPanel({ items, onSelect, onPosition }: { items: LocationItem[]; onSelect: (id: string) => void; onPosition: (position: Point | null) => void }) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const [position, setPosition] = useState<Point | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(readLastCenter()?.zoom || 14);
  const validItems = useMemo(() => items.filter((item): item is LocationItem & Point => typeof item.lat === 'number' && typeof item.lng === 'number'), [items]);
  const saved = readLastCenter();
  const defaultCenter = position || saved?.center || validItems[0] || TAIWAN_CENTER;
  const locate = () => {
    if (!navigator.geolocation) { setError('此瀏覽器不支援定位功能。'); return; }
    navigator.geolocation.getCurrentPosition((result) => {
      const next = { lat: result.coords.latitude, lng: result.coords.longitude };
      setPosition(next); onPosition(next); setError(''); mapRef.current?.panTo(next); mapRef.current?.setZoom(15);
    }, () => setError('無法取得目前位置；已改用上次地圖位置、收藏地點或台灣中心。'), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  };
  useEffect(() => { locate(); }, []);
  useEffect(() => {
    if (!MAP_API_KEY || !mapElement.current) return;
    let cancelled = false;
    loadGoogleMaps().then((google) => {
      if (cancelled || !mapElement.current) return;
      const previous = readLastCenter();
      const map = new google.maps.Map(mapElement.current, { center: previous?.center || validItems[0] || TAIWAN_CENTER, zoom: previous?.zoom || (validItems.length > 1 ? 8 : 14), mapTypeControl: false, streetViewControl: false, fullscreenControl: true });
      mapRef.current = map;
      if (!previous && validItems.length > 1) { const bounds = new google.maps.LatLngBounds(); validItems.forEach((item) => bounds.extend({ lat: item.lat, lng: item.lng })); map.fitBounds(bounds, 42); }
      validItems.forEach((item) => { const marker = new google.maps.Marker({ position: { lat: item.lat, lng: item.lng }, map, title: item.title || item.placeName, label: markerLabel(item.mainCategory) }); marker.addListener('click', () => onSelect(item.id)); });
      map.addListener('idle', () => { const center = map.getCenter(); if (!center) return; localStorage.setItem('lastMapCenterLat', String(center.lat())); localStorage.setItem('lastMapCenterLng', String(center.lng())); localStorage.setItem('lastMapZoom', String(map.getZoom())); setZoom(map.getZoom()); });
      if (position) { map.panTo(position); map.setZoom(15); }
    }).catch((reason: Error) => setError(reason.message));
    return () => { cancelled = true; mapRef.current = null; };
  }, [validItems, position, onSelect]);
  const mapUrl = 'https://www.google.com/maps?q=' + defaultCenter.lat + ',' + defaultCenter.lng + '&z=' + zoom + '&output=embed';
  const changeZoom = (delta: number) => { const next = Math.max(3, Math.min(20, zoom + delta)); setZoom(next); mapRef.current?.setZoom(next); };
  return <><section className="google-map-card">{MAP_API_KEY ? <div ref={mapElement} className="google-map-canvas" /> : <iframe title="Google Maps 收藏地圖" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />}<div className="map-controls"><button onClick={locate}><LocateFixed size={17} />我的位置</button><button onClick={() => changeZoom(1)}>＋</button><button onClick={() => changeZoom(-1)}>－</button></div></section>{!MAP_API_KEY && <p className="map-api-note">設定 VITE_GOOGLE_MAPS_API_KEY 後，即可在地圖上顯示可點擊的收藏 Marker。</p>}{error && <p className="notice">{error}</p>}{position && <p className="gps-status"><MapPin size={14} />GPS 已定位：{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>}</>;
}

export function CategoryManager({ categories, subCategories, onChange }: { categories: string[]; subCategories: Record<string, string[]>; onChange: (categories: string[], subs: Record<string, string[]>) => void }) {
  const [main, setMain] = useState(''); const [selected, setSelected] = useState(categories[0] || ''); const [sub, setSub] = useState(''); const counts = useMemo(() => categories.length, [categories]);
  const addMain = () => { const value = main.trim(); if (!value || categories.includes(value)) return; onChange([...categories, value], { ...subCategories, [value]: [] }); setMain(''); setSelected(value); };
  const removeMain = (value: string) => { if (value === '其他') return; const next = categories.filter((item) => item !== value); const nextSubs = { ...subCategories }; delete nextSubs[value]; onChange(next, nextSubs); setSelected(next[0] || ''); };
  const addSub = () => { const value = sub.trim(); if (!selected || !value || (subCategories[selected] || []).includes(value)) return; onChange(categories, { ...subCategories, [selected]: [...(subCategories[selected] || []), value] }); setSub(''); };
  const removeSub = (value: string) => onChange(categories, { ...subCategories, [selected]: (subCategories[selected] || []).filter((item) => item !== value) });
  return <section className="category-manager"><h2>分類設定 <span>{counts} 個主分類</span></h2><div className="setting-row"><input value={main} onChange={(event) => setMain(event.target.value)} placeholder="新增主分類" /><button onClick={addMain}><Plus size={16} />新增</button></div><div className="category-settings-list">{categories.map((category) => <div className={selected === category ? 'selected' : ''} key={category}><button onClick={() => setSelected(category)}>{category}</button>{category !== '其他' && <button className="delete-setting" onClick={() => removeMain(category)}><Trash2 size={15} /></button>}</div>)}</div><h2>{selected || '請選擇分類'}的子分類</h2><div className="setting-row"><input value={sub} onChange={(event) => setSub(event.target.value)} placeholder="新增子分類" /><button onClick={addSub}><Plus size={16} />新增</button></div><div className="subcategory-settings">{(subCategories[selected] || []).map((value) => <span key={value}>{value}<button onClick={() => removeSub(value)}>×</button></span>)}{!(subCategories[selected] || []).length && <p>尚未設定子分類</p>}</div></section>;
}
