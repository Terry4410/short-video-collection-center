# 短影音收藏中心｜MVP PRD

## 目標
將各平台短影音連結集中收藏，透過分類、標籤、狀態與地點，把「稍後再看」轉為可搜尋、可行動的個人知識與生活清單。

## MVP 使用流程
1. 在短影音 App 複製連結，開啟本 App。
2. 在「新增」貼上連結，平台自動辨識；可立即儲存為待整理。
3. 選擇 AI 模擬整理，系統依分享文字/標題提供分類、標籤、狀態與信心分數。
4. 在收藏頁搜尋與篩選；地點型內容可在地圖頁依目前位置查詢，並交由 Google Maps 導航。

## MVP 功能與邊界
- 已完成：五頁籤、localStorage、CRUD、URL 平台判斷、YouTube 縮圖、AI mock、地點/距離/定位、Google Maps 連結、統計、PWA manifest。
- 尚未串接：Firestore、帳號、Google Maps JavaScript API / Places、正式 AI、iOS share target、平台內容擷取。

## 驗收標準
- 手機瀏覽器可完成新增、AI 模擬、編輯、刪除與重新整理後資料保留。
- 有座標的收藏出現在地圖頁；允許定位後能依距離篩選。
- 每筆有座標的收藏可開啟 Google Maps 搜尋與駕車導航。

## 第二階段
Firestore `bookmarks` collection 改為即時資料來源；Firebase Auth 提供個人帳號；Google Places 提供地點候選與 Place ID；後端 Cloud Function 代理 OpenAI、oEmbed 與安全金鑰；再評估 iOS PWA `share_target`（iOS 行為較不一致，保留「複製連結→快速收藏」為可靠備援）。
