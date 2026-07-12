# Firestore 資料結構

Collection：`bookmarks`；文件 ID 由 Firestore 產生。第一版 localStorage 欄位已與未來結構對齊。

| 欄位 | 型別 | 說明 |
|---|---|---|
| url, platform, title, description, note | string | 來源與內容 |
| mainCategory, subCategory, status, priority | string | 分類與行動狀態 |
| tags, aiSuggestedTags | string[] | 可搜尋標籤 |
| thumbnailUrl | string | 儲存遠端縮圖 URL，不上傳圖片 |
| hasLocation | boolean | 是否在地圖顯示 |
| placeName, address, googlePlaceId, mapUrl | string | 地點資訊 |
| lat, lng | number | 地圖與距離運算；正式版建議另存 GeoPoint |
| sourceText, aiSummary, aiSuggestedCategory, aiSuggestedStatus, aiSuggestedLocation | string | AI 來源與建議 |
| aiConfidence | number | 0–100 |
| createdAt, updatedAt, confirmedAt, completedAt, visitedAt, purchasedAt, archivedAt | Timestamp | 稽核與生命週期 |

建議索引：`status + updatedAt desc`、`mainCategory + updatedAt desc`、`hasLocation + updatedAt desc`。距離查詢改採 GeoFirestore / geohash。
