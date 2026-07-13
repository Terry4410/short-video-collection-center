import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bookmark as BookmarkIcon, CheckCircle2, ChevronRight, ExternalLink, Edit3, Home, Layers, Map, MapPin, Navigation, Plus, Save, Search, Sparkles, Trash2 } from 'lucide-react';
import './style.css';
import './chatgpt.css';
import './advanced.css';
import { CategoryManager, GoogleMapPanel } from './AdvancedPanels';
import { ensureFirebaseSession, isFirebaseConfigured } from './lib/firebase';
import { addBookmark, deleteBookmark, subscribeBookmarks, updateBookmark } from './services/bookmarkService';
import type { Bookmark, BookmarkInput, BookmarkPriority, BookmarkStatus } from './types/bookmark';

type Tab = '首頁' | '收藏' | '地圖' | '新增' | '分類';
type SortOption = 'recentCreated' | 'recentUpdated' | 'priority';
type LocationFilter = '全部' | '有地點' | '無地點';
type DataSource = 'firebase' | 'fallback';
const CONFIG_KEY = 'shortVideoCategoryConfig';
const FALLBACK_KEY = 'shortVideoBookmarks';
const FALLBACK_MIGRATED_KEY = 'shortVideoBookmarksMigratedToFirestore';
const defaultCategories = ['旅遊', '美食', '購物', '知識', '學習', 'AI工具', '工作', '投資', '生活', '車用', '健康', '其他'];
const statuses: BookmarkStatus[] = ['待整理', 'AI待確認', '已確認', '想看', '想學', '想買', '想去', '進行中', '已完成', '已購買', '已去過', '封存'];
const defaultSubCategories: Record<string, string[]> = {
  旅遊: ['景點', '住宿', '行程', '交通', '伴手禮'], 美食: ['餐廳', '小吃', '咖啡', '甜點', '早餐', '宵夜'],
  購物: ['商品推薦', '淘寶', '家電', '車用配件', '生活用品'], AI工具: ['ChatGPT', 'Copilot', 'Gemini', 'Claude', '簡報工具', '影片工具', '文件整理', '自動化'],
  學習: ['英文', 'Excel', 'VBA', 'Python', '管理', '簡報', '寫作'], 工作: ['HR', 'SAP', 'HRIS', 'DJSI', '管理', '職場技巧'],
  投資: ['ETF', '美股', '台股', '選擇權', '總經', '財務觀念'], 生活: ['居家', '運動', '親子', '生活技巧'],
  車用: ['Tesla', 'Model Y', '配件', '充電', '保養', '露營'], 健康: ['運動', '飲食', '醫療', '復健', '睡眠'],
};

const normalizeStatus = (status: unknown): BookmarkStatus => status === 'AI已整理' || status === 'AI 待確認' ? 'AI待確認' : (statuses.includes(status as BookmarkStatus) ? status as BookmarkStatus : '待整理');
function platform(url: string) { const value = url.toLowerCase(); if (value.includes('youtube.com') || value.includes('youtu.be')) return 'YouTube'; if (value.includes('tiktok.com')) return 'TikTok'; if (value.includes('instagram.com')) return 'Instagram'; if (value.includes('threads.com')) return 'Threads'; if (value.includes('facebook.com') || value.includes('fb.watch')) return 'Facebook'; return 'Other'; }
function thumbnail(url: string) { const match = url.match(/(?:youtu.be\/|v=|shorts\/)([\w-]{6,})/); return match ? 'https://img.youtube.com/vi/' + match[1] + '/mqdefault.jpg' : ''; }
function emptyBookmark(): Bookmark { return { id: '', url: '', platform: 'Other', title: '', description: '', note: '', mainCategory: '其他', subCategory: '', tags: [], status: '待整理', priority: '中', thumbnailUrl: '', hasLocation: false, placeName: '', address: '', googlePlaceId: '', mapUrl: '', sourceText: '', aiSummary: '', aiSuggestedCategory: '', aiSuggestedTags: [], aiSuggestedStatus: '', aiSuggestedLocation: '', aiConfidence: 0, createdAt: null, updatedAt: null }; }
function normalBookmark(value: Partial<Bookmark>): Bookmark { return { ...emptyBookmark(), ...value, id: value.id || crypto.randomUUID(), platform: value.platform || platform(value.url || ''), status: normalizeStatus(value.status), priority: (value.priority === '高' || value.priority === '低' ? value.priority : '中') as BookmarkPriority, tags: Array.isArray(value.tags) ? value.tags : [], hasLocation: Boolean(value.hasLocation) }; }
function localBookmarks(): Bookmark[] { try { const stored = JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]'); return Array.isArray(stored) ? stored.map(normalBookmark) : []; } catch { return []; } }
function dateNumber(value: Bookmark['createdAt'] | Bookmark['updatedAt']) { if (!value) return 0; if (typeof value === 'string') return new Date(value).getTime(); if (value instanceof Date) return value.getTime(); return value.toDate().getTime(); }
function placeQuery(item: Bookmark) { return typeof item.lat === 'number' && typeof item.lng === 'number' ? item.lat + ',' + item.lng : item.address || item.placeName || ''; }
function mapUrl(item: Bookmark) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(placeQuery(item)); }
function directionsUrl(item: Bookmark) { return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(placeQuery(item)) + '&travelmode=driving'; }

function BookmarkCard({ item, edit, remove }: { item: Bookmark; edit: (item: Bookmark) => void; remove: (id: string) => void }) {
  return <article className="bookmark-card">
    <div className={'bookmark-thumb ' + item.platform}>{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : <ExternalLink size={23} />}<small>{item.platform}</small></div>
    <div className="bookmark-card__body">
      <div className="bookmark-card__top"><h3>{item.title || '未命名收藏'}</h3><span className="status-badge">{item.status}</span></div>
      <p className="bookmark-card__summary">{item.mainCategory}{item.subCategory ? ' · ' + item.subCategory : ''}{item.note || item.aiSummary ? '　' + (item.note || item.aiSummary) : ''}</p>
      <div className="tag-row">{item.tags.slice(0, 4).map((tag) => <span className="tag-badge" key={tag}>#{tag}</span>)}{item.hasLocation && <span className="tag-badge"><MapPin size={12} />{item.placeName || item.address || '已標註地點'}</span>}</div>
      <div className="bookmark-actions"><a href={item.url} target="_blank" rel="noreferrer"><ExternalLink size={16} />影片</a><button onClick={() => edit(item)}><Edit3 size={16} />編輯</button>{item.hasLocation && placeQuery(item) && <><a href={mapUrl(item)} target="_blank" rel="noreferrer"><Map size={16} />地圖</a><a href={directionsUrl(item)} target="_blank" rel="noreferrer"><Navigation size={16} />導航</a></>}<button className="danger-button" onClick={() => remove(item.id)} aria-label="刪除收藏"><Trash2 size={16} /></button></div>
    </div>
  </article>;
}

function BookmarkForm({ initial, categories, subCategories, save, cancel, saving }: { initial: Bookmark; categories: string[]; subCategories: Record<string, string[]>; save: (item: Bookmark) => Promise<void>; cancel: () => void; saving: boolean }) {
  const [item, setItem] = useState(initial);
  const [json, setJson] = useState('');
  const [message, setMessage] = useState('');
  const [getting, setGetting] = useState(false);
  const set = <K extends keyof Bookmark>(key: K, value: Bookmark[K]) => setItem((current) => ({ ...current, [key]: value }));
  const loadMetadata = async () => {
    if (!item.url) { setMessage('請先貼上影片連結。'); return; }
    const detected = platform(item.url); setGetting(true); set('platform', detected);
    try {
      if (detected === 'YouTube') {
        const response = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(item.url));
        if (!response.ok) throw new Error();
        const data = await response.json();
        setItem((current) => ({ ...current, platform: detected, title: current.title || data.title || '', thumbnailUrl: current.thumbnailUrl || data.thumbnail_url || thumbnail(current.url) }));
        setMessage('已取得 YouTube 公開標題與縮圖。');
      } else {
        setItem((current) => ({ ...current, platform: detected, thumbnailUrl: current.thumbnailUrl || thumbnail(current.url) }));
        setMessage('已辨識為 ' + detected + '。可使用下方 Prompt 請 ChatGPT 分析公開內容。');
      }
    } catch { setMessage('無法直接取得公開標題；仍可使用下方 Prompt，由 ChatGPT 嘗試讀取公開內容。'); } finally { setGetting(false); }
  };
  const makePrompt = () => ['請分析以下公開短影音連結：', '連結：' + item.url, '平台：' + item.platform, '目前取得的標題：' + (item.title || '未取得'), '', '請先嘗試讀取公開連結可取得的標題、描述、字幕或頁面內容。', '', '重要規則：', '1. 不可根據單一地名、模糊標題或個人推測，自行猜測影片內容。', '2. 若無法讀取足以判斷內容的公開文字：mainCategory 必須填「其他」、subCategory 與 placeName 必須為空字串、tags 只保留可確認關鍵字、hasLocation 必須為 false、status 必須填「待整理」、priority 必須填「低」、confidence 必須低於 30，summary 必須以「待確認：」開頭。', '3. 只有影片文字明確提到特定餐廳、店家、景點或地址時，hasLocation 才能為 true。', '4. 西門町、台北、台南等區域名稱不能單獨當作 placeName。', '5. confidence 必須是 0 到 100 的整數。', '6. 只回傳 JSON，不要 Markdown。', '', 'JSON 格式：', '{"title":"","summary":"","mainCategory":"","subCategory":"","tags":[],"placeName":"","addressHint":"","hasLocation":false,"status":"","priority":"","confidence":0,"analysisBasis":"public_content | title_only | unavailable","needsConfirmation":true}'].join('\n');
  const copyPrompt = async () => { if (!item.url) { setMessage('請先貼上影片連結。'); return; } await navigator.clipboard.writeText(makePrompt()); setMessage('Prompt 已複製。請在 ChatGPT Plus 貼上分析，再將 JSON 貼回這裡。'); };
  const applyJson = () => {
    try {
      const fence = String.fromCharCode(96).repeat(3);
      const result = JSON.parse(json.trim().replace(fence + 'json', '').replace(fence, '').trim());
      setItem((current) => ({ ...current, title: result.title || current.title, mainCategory: categories.includes(result.mainCategory) ? result.mainCategory : current.mainCategory, subCategory: result.subCategory || '', tags: Array.isArray(result.tags) ? result.tags.map(String) : current.tags, status: normalizeStatus(result.status || 'AI待確認'), priority: result.priority === '高' || result.priority === '低' ? result.priority : '中', note: result.summary || current.note, hasLocation: typeof result.hasLocation === 'boolean' ? result.hasLocation : current.hasLocation, placeName: result.placeName || '', address: result.addressHint || '', aiSummary: result.summary || current.aiSummary, aiSuggestedCategory: result.mainCategory || '', aiSuggestedTags: Array.isArray(result.tags) ? result.tags.map(String) : [], aiSuggestedStatus: normalizeStatus(result.status || 'AI待確認'), aiSuggestedLocation: result.placeName || '', aiConfidence: Number(result.confidence) || 0 }));
      setMessage('JSON 已套用；請確認完整資料與地點後儲存。');
    } catch { setMessage('JSON 格式無法辨識，請確認貼上的是完整 JSON。'); }
  };
  const submit = async () => { await save({ ...item, title: item.title.trim() || item.platform + ' 收藏', platform: platform(item.url), thumbnailUrl: item.thumbnailUrl || thumbnail(item.url) }); };
  return <section className="bookmark-form">
    <div className="form-intro"><strong>{item.id ? '編輯收藏' : '快速收藏'}</strong><small>貼上連結即可先存；名稱、分類與地點都可在同一頁完成。</small></div>
    <label>影片連結<input autoFocus value={item.url} onChange={(event) => { set('url', event.target.value); set('platform', platform(event.target.value)); }} onBlur={loadMetadata} placeholder="貼上 TikTok、Reels、Shorts…" /></label>
    <button className="metadata-button" onClick={loadMetadata} disabled={getting}>{getting ? '正在取得公開資訊…' : '取得公開標題與平台資訊'}</button>
    <label>收藏名稱<input value={item.title} onChange={(event) => set('title', event.target.value)} placeholder="為這筆收藏取一個容易找到的名稱" /></label>
    <section className="chatgpt-flow"><h2>使用 ChatGPT Plus 分析</h2><p>不需要 API Key。系統會帶入連結與已取得的公開標題，讓 ChatGPT 回傳可直接套用的 JSON。</p><button className="ai-button" onClick={copyPrompt}><Sparkles size={18} />複製 ChatGPT Prompt</button><label>貼回 ChatGPT 的 JSON 結果<textarea value={json} onChange={(event) => setJson(event.target.value)} placeholder="貼上 ChatGPT 回傳的 JSON" /></label><button className="apply-json-button" onClick={applyJson}><CheckCircle2 size={18} />套用 JSON 並自動回填</button>{message && <div className="form-message">{message}</div>}</section>
    <section className="full-form"><h2>完整資料與地點</h2>
      <div className="form-grid"><label>平台<select value={item.platform} onChange={(event) => set('platform', event.target.value)}>{['YouTube', 'TikTok', 'Instagram', 'Threads', 'Facebook', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label><label>狀態<select value={item.status} onChange={(event) => set('status', normalizeStatus(event.target.value))}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <div className="form-grid"><label>主分類<select value={item.mainCategory} onChange={(event) => { set('mainCategory', event.target.value); set('subCategory', ''); }}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label>子分類<select value={item.subCategory || ''} onChange={(event) => set('subCategory', event.target.value)}><option value="">請選擇</option>{(subCategories[item.mainCategory] || []).map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <div className="form-grid"><label>標籤（逗號分隔）<input value={item.tags.join(', ')} onChange={(event) => set('tags', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} /></label><label>優先度<select value={item.priority} onChange={(event) => set('priority', event.target.value as BookmarkPriority)}>{(['高', '中', '低'] as BookmarkPriority[]).map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <label>筆記<textarea value={item.note || ''} onChange={(event) => set('note', event.target.value)} placeholder="留下想記得的重點…" /></label>
      <label className="location-check"><input type="checkbox" checked={item.hasLocation} onChange={(event) => set('hasLocation', event.target.checked)} />此收藏有地點</label>
      {item.hasLocation && <><label>地點名稱<input value={item.placeName || ''} onChange={(event) => set('placeName', event.target.value)} placeholder="例如：店家或景點完整名稱" /></label><label>地址<input value={item.address || ''} onChange={(event) => set('address', event.target.value)} placeholder="可先填地址線索" /></label><div className="form-grid"><label>緯度<input type="number" value={item.lat ?? ''} onChange={(event) => set('lat', event.target.value ? Number(event.target.value) : undefined)} /></label><label>經度<input type="number" value={item.lng ?? ''} onChange={(event) => set('lng', event.target.value ? Number(event.target.value) : undefined)} /></label></div></>}
    </section>
    <div className="form-actions"><button onClick={cancel}>取消</button><button className="primary-button" disabled={!item.url || saving} onClick={submit}><Save size={18} />{saving ? '儲存中…' : '儲存收藏'}</button></div>
  </section>;
}

function App() {
  const configuration = useMemo(() => { try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null'); } catch { return null; } }, []);
  const [categories, setCategories] = useState<string[]>(() => Array.isArray(configuration?.categories) ? configuration.categories.filter((value: string) => value !== '待整理') : defaultCategories);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>(configuration?.subCategories || defaultSubCategories);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tab, setTab] = useState<Tab>('首頁');
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState<'全部' | BookmarkStatus>('全部');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('全部');
  const [sort, setSort] = useState<SortOption>('recentCreated');
  const [source, setSource] = useState<DataSource>(isFirebaseConfigured ? 'firebase' : 'fallback');
  const [dataMessage, setDataMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (!isFirebaseConfigured) { setSource('fallback'); setBookmarks(localBookmarks()); setDataMessage('Firebase 尚未設定，目前使用此裝置的暫存資料。'); return; }
    ensureFirebaseSession().then(() => {
      unsubscribe = subscribeBookmarks((next) => {
        const legacy = localBookmarks();
        if (!next.length && legacy.length && !localStorage.getItem(FALLBACK_MIGRATED_KEY)) {
          setDataMessage('正在將這台裝置原有的 ' + legacy.length + ' 筆收藏匯入 Firestore…');
          Promise.all(legacy.map(({ id, createdAt, updatedAt, ...legacyItem }) => addBookmark(legacyItem as BookmarkInput))).then(() => localStorage.setItem(FALLBACK_MIGRATED_KEY, 'true')).catch((error: Error) => setDataMessage('舊資料匯入 Firestore 失敗：' + error.message));
          return;
        }
        setSource('firebase'); setBookmarks(next.map(normalBookmark)); setDataMessage('');
      }, (error) => { setSource('fallback'); setBookmarks(localBookmarks()); setDataMessage('Firestore 無法連線：' + error.message + '。目前改用這台裝置的暫存資料。'); });
    }).catch((error: Error) => { setSource('fallback'); setBookmarks(localBookmarks()); setDataMessage('Firebase 驗證或 Firestore 無法連線：' + error.message + '。目前改用這台裝置的暫存資料。'); });
    return () => unsubscribe?.();
  }, []);
  useEffect(() => { localStorage.setItem(CONFIG_KEY, JSON.stringify({ categories, subCategories })); }, [categories, subCategories]);
  useEffect(() => { if (source === 'fallback') localStorage.setItem(FALLBACK_KEY, JSON.stringify(bookmarks)); }, [bookmarks, source]);
  const openNew = () => { setEditing(emptyBookmark()); setTab('新增'); };
  const edit = (item: Bookmark) => { setEditing(item); setTab('新增'); };
  const save = async (item: Bookmark) => {
    setSaving(true);
    try {
      const { id, createdAt, updatedAt, ...input } = item;
      if (source === 'firebase' && isFirebaseConfigured) { if (id) await updateBookmark(id, input); else await addBookmark(input as BookmarkInput); }
      else { const saved = { ...item, id: id || crypto.randomUUID(), createdAt: createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }; setBookmarks((current) => current.some((value) => value.id === saved.id) ? current.map((value) => value.id === saved.id ? saved : value) : [saved, ...current]); }
      setEditing(null); setTab('收藏');
    } catch (error) { setDataMessage('儲存失敗：' + (error instanceof Error ? error.message : '請稍後再試')); } finally { setSaving(false); }
  };
  const remove = async (id: string) => { if (!confirm('確定要刪除這筆收藏嗎？')) return; try { if (source === 'firebase' && isFirebaseConfigured) await deleteBookmark(id); else setBookmarks((current) => current.filter((item) => item.id !== id)); } catch (error) { setDataMessage('刪除失敗：' + (error instanceof Error ? error.message : '請稍後再試')); } };
  const selectStatus = (status: BookmarkStatus) => { setStatusFilter(status); setCategoryFilter('全部'); setLocationFilter('全部'); setSearch(''); setTab('收藏'); };
  const shown = useMemo(() => {
    const key = search.trim().toLowerCase(); const weight: Record<BookmarkPriority, number> = { 高: 3, 中: 2, 低: 1 };
    return bookmarks.filter((item) => categoryFilter === '全部' || item.mainCategory === categoryFilter).filter((item) => statusFilter === '全部' || item.status === statusFilter).filter((item) => locationFilter === '全部' || (locationFilter === '有地點' ? item.hasLocation : !item.hasLocation)).filter((item) => !key || [item.title, item.note, item.aiSummary, item.tags.join(' ')].join(' ').toLowerCase().includes(key)).sort((a, b) => sort === 'priority' ? weight[b.priority] - weight[a.priority] || dateNumber(b.updatedAt || b.createdAt) - dateNumber(a.updatedAt || a.createdAt) : sort === 'recentUpdated' ? dateNumber(b.updatedAt || b.createdAt) - dateNumber(a.updatedAt || a.createdAt) : dateNumber(b.createdAt) - dateNumber(a.createdAt));
  }, [bookmarks, categoryFilter, statusFilter, locationFilter, search, sort]);
  const highPriority = bookmarks.filter((item) => item.priority === '高' && item.status !== '封存').sort((a, b) => dateNumber(b.updatedAt || b.createdAt) - dateNumber(a.updatedAt || a.createdAt));
  const cards: Array<{ label: string; status: BookmarkStatus }> = [{ label: '待整理', status: '待整理' }, { label: 'AI待確認', status: 'AI待確認' }, { label: '想看', status: '想看' }, { label: '想學', status: '想學' }, { label: '想買', status: '想買' }, { label: '想去', status: '想去' }];
  const pageTitle: Record<Tab, string> = { 首頁: '首頁', 收藏: '收藏', 地圖: '地圖', 新增: editing?.id ? '編輯收藏' : '新增收藏', 分類: '分類' };
  const nav: Array<{ label: Tab; icon: typeof Home }> = [{ label: '首頁', icon: Home }, { label: '收藏', icon: BookmarkIcon }, { label: '地圖', icon: Map }, { label: '新增', icon: Plus }, { label: '分類', icon: Layers }];
  return <main className="app-shell">
    <header className="app-header"><div><p className="app-header__brand">短影音收藏中心</p><h1>{pageTitle[tab]}</h1></div>{(tab === '首頁' || tab === '收藏') && <button className="quick-add-button" onClick={openNew}><Plus size={20} /><span>快速新增</span></button>}</header>
    {dataMessage && <p className="data-notice">{dataMessage}</p>}
    {tab === '首頁' && <><button className="home-quick-entry" onClick={openNew}><Plus size={24} />快速貼上短影音連結<ChevronRight size={20} /></button><section className="status-stat-grid">{cards.map((card) => <button key={card.status} onClick={() => selectStatus(card.status)}><b>{bookmarks.filter((item) => item.status === card.status).length}</b><span>{card.label}</span></button>)}</section><section className="section-heading"><div><p>優先處理</p><h2>高優先度收藏</h2></div></section>{highPriority.length ? highPriority.map((item) => <BookmarkCard key={item.id} item={item} edit={edit} remove={remove} />) : <div className="empty-state">目前沒有高優先度收藏</div>}</>}
    {tab === '收藏' && <><div className="search-box"><Search size={20} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋標題、筆記或標籤" /></div><section className="filter-panel"><p>主分類</p><div className="filter-chips">{['全部', ...categories].map((category) => <button key={category} className={categoryFilter === category ? 'selected' : ''} onClick={() => setCategoryFilter(category)}>{category}</button>)}</div><div className="filter-selects"><label>狀態<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as '全部' | BookmarkStatus)}><option>全部</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>地點<select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value as LocationFilter)}><option>全部</option><option>有地點</option><option>無地點</option></select></label><label>排序<select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="recentCreated">最近新增</option><option value="recentUpdated">最近更新</option><option value="priority">優先度高到低</option></select></label></div></section><p className="result-count">共 {shown.length} 筆收藏</p>{shown.length ? shown.map((item) => <BookmarkCard key={item.id} item={item} edit={edit} remove={remove} />) : <div className="empty-state">沒有符合目前篩選條件的收藏</div>}</>}
    {tab === '地圖' && <><GoogleMapPanel items={bookmarks.filter((item) => item.hasLocation).map((item) => ({ id: item.id, title: item.title, placeName: item.placeName || item.address || '', lat: item.lat, lng: item.lng }))} /><section className="section-heading compact"><div><p>你的收藏地點</p><h2>有地點的收藏</h2></div></section>{bookmarks.filter((item) => item.hasLocation).length ? bookmarks.filter((item) => item.hasLocation).map((item) => <BookmarkCard key={item.id} item={item} edit={edit} remove={remove} />) : <div className="empty-state">尚未有標註地點的收藏</div>}</>}
    {tab === '新增' && <BookmarkForm key={editing?.id || 'new'} initial={editing || emptyBookmark()} categories={categories} subCategories={subCategories} save={save} cancel={() => { setEditing(null); setTab('首頁'); }} saving={saving} />}
    {tab === '分類' && <><section className="category-overview"><h2>收藏總覽 <span>{bookmarks.length} 筆</span></h2>{categories.map((category) => { const count = bookmarks.filter((item) => item.mainCategory === category).length; return <div className="category-overview__row" key={category}><span>{category}</span><b>{count}</b><i style={{ width: Math.max(5, bookmarks.length ? count / bookmarks.length * 100 : 5) + '%' }} /></div>; })}</section><CategoryManager categories={categories} subCategories={subCategories} onChange={(nextCategories, nextSubCategories) => { setCategories(nextCategories); setSubCategories(nextSubCategories); }} /></>}
    <nav className="bottom-tab-bar">{nav.map(({ label, icon: Icon }) => <button key={label} className={tab === label ? 'active' : ''} onClick={() => { if (label === '新增') openNew(); else { setEditing(null); setTab(label); } }}><span className="bottom-tab-bar__icon"><Icon /></span><span>{label}</span></button>)}</nav>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);
