import {useMemo,useState} from 'react';
import {LocateFixed,MapPin,Plus,Trash2} from 'lucide-react';

type LocationItem={id:string;title:string;placeName:string;lat?:number;lng?:number};

export function GoogleMapPanel({items}:{items:LocationItem[]}){
  const [position,setPosition]=useState<{lat:number;lng:number}|null>(null);
  const [error,setError]=useState('');
  const [zoom,setZoom]=useState(15);
  const center=position||items.find(x=>x.lat&&x.lng)||{lat:25.033,lng:121.5654};
  const mapUrl='https://www.google.com/maps?q='+center.lat+','+center.lng+'&z='+zoom+'&output=embed';
  const locate=()=>navigator.geolocation?.getCurrentPosition(
    p=>{setPosition({lat:p.coords.latitude,lng:p.coords.longitude});setError('')},
    ()=>setError('無法取得目前位置，請在 iPhone 設定中允許 Safari 使用定位。'),
    {enableHighAccuracy:true,timeout:12000,maximumAge:30000}
  );
  return <>
    <section className="google-map-card">
      <iframe title="Google Maps 收藏地圖" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
      <div className="map-controls">
        <button onClick={locate}><LocateFixed size={17}/>我的位置</button>
        <button onClick={()=>setZoom(z=>Math.min(20,z+1))}>＋</button>
        <button onClick={()=>setZoom(z=>Math.max(3,z-1))}>－</button>
      </div>
    </section>
    {error&&<p className="notice">{error}</p>}
    {position&&<p className="gps-status"><MapPin size={14}/>GPS 已定位：{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>}
  </>;
}

export function CategoryManager({categories,subCategories,onChange}:{categories:string[];subCategories:Record<string,string[]>;onChange:(c:string[],s:Record<string,string[]>)=>void}){
  const [main,setMain]=useState('');
  const [selected,setSelected]=useState(categories[0]||'');
  const [sub,setSub]=useState('');
  const counts=useMemo(()=>categories.length,[categories]);
  const addMain=()=>{const value=main.trim();if(!value||categories.includes(value))return;onChange([...categories,value],{...subCategories,[value]:[]});setMain('');setSelected(value)};
  const removeMain=(value:string)=>{if(['待整理','其他'].includes(value))return;const next=categories.filter(x=>x!==value);const nextSubs={...subCategories};delete nextSubs[value];onChange(next,nextSubs);setSelected(next[0]||'')};
  const addSub=()=>{const value=sub.trim();if(!selected||!value||(subCategories[selected]||[]).includes(value))return;onChange(categories,{...subCategories,[selected]:[...(subCategories[selected]||[]),value]});setSub('')};
  const removeSub=(value:string)=>onChange(categories,{...subCategories,[selected]:(subCategories[selected]||[]).filter(x=>x!==value)});
  return <section className="category-manager">
    <h2>分類設定 <span>{counts} 個主分類</span></h2>
    <div className="setting-row"><input value={main} onChange={e=>setMain(e.target.value)} placeholder="新增主分類"/><button onClick={addMain}><Plus size={16}/>新增</button></div>
    <div className="category-settings-list">{categories.map(c=><div className={selected===c?'selected':''} key={c}><button onClick={()=>setSelected(c)}>{c}</button>{!['待整理','其他'].includes(c)&&<button className="delete-setting" onClick={()=>removeMain(c)}><Trash2 size={15}/></button>}</div>)}</div>
    <h2>{selected||'請選擇分類'}的子分類</h2>
    <div className="setting-row"><input value={sub} onChange={e=>setSub(e.target.value)} placeholder="新增子分類"/><button onClick={addSub}><Plus size={16}/>新增</button></div>
    <div className="subcategory-settings">{(subCategories[selected]||[]).map(s=><span key={s}>{s}<button onClick={()=>removeSub(s)}>×</button></span>)}{!(subCategories[selected]||[]).length&&<p>尚未設定子分類</p>}</div>
  </section>;
}
