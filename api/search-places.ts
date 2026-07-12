import {isAllowed,response} from './_shared';
export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return response(request, {}, 204);
  if (request.method !== 'POST') return response(request, {error:'Method not allowed'}, 405);
  if (!isAllowed(request)) return response(request, {error:'Origin not allowed'}, 403);
  if (!process.env.GOOGLE_MAPS_API_KEY) return response(request, {error:'地點搜尋尚未設定，請先在 Vercel 設定 GOOGLE_MAPS_API_KEY。'}, 503);
  const body = await request.json() as {query?:string};
  if (!body.query) return response(request, {error:'請提供地點搜尋關鍵字。'}, 400);
  const api = await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':process.env.GOOGLE_MAPS_API_KEY,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri'},body:JSON.stringify({textQuery:body.query,languageCode:'zh-TW',maxResultCount:5})});
  if (!api.ok) return response(request, {error:'Google Places 搜尋暫時無法完成。'}, 502);
  const data:any = await api.json();
  return response(request, {candidates:(data.places||[]).map((p:any)=>({googlePlaceId:p.id,name:p.displayName?.text||'',address:p.formattedAddress||'',lat:p.location?.latitude,lng:p.location?.longitude,mapUrl:p.googleMapsUri||''}))});
}
