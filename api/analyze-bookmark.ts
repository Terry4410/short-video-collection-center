import {isAllowed,response} from './_shared';
export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return response(request, {}, 204);
  if (request.method !== 'POST') return response(request, {error:'Method not allowed'}, 405);
  if (!isAllowed(request)) return response(request, {error:'Origin not allowed'}, 403);
  if (!process.env.OPENAI_API_KEY) return response(request, {error:'AI 尚未設定，請先在 Vercel 設定 OPENAI_API_KEY。'}, 503);
  const body = await request.json() as {url?:string;sourceText?:string;title?:string};
  const content = [body.sourceText,body.title,body.url].filter(Boolean).join('\n');
  if (!content) return response(request, {error:'請提供連結或分享文字。'}, 400);
  const prompt = '你是短影音收藏助手。根據下列內容，回傳嚴格 JSON，不要 Markdown。欄位：title、summary、mainCategory、subCategory、tags 陣列、status、priority、hasLocation、placeSearchQuery、confidence。地點不確定時不可虛構特定店名。內容：\n'+content;
  const api = await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',input:prompt})});
  if (!api.ok) return response(request, {error:'AI 分析暫時無法完成。'}, 502);
  const data:any = await api.json();
  try { return response(request, {analysis:JSON.parse(data.output_text||'')}); } catch { return response(request, {error:'AI 回傳格式無法辨識，請再試一次。'}, 502); }
}
