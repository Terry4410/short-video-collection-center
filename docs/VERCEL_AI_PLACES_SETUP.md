# Vercel AI 與 Google Places 設定

GitHub Pages 維持 iPhone App；Vercel 只提供安全 API。

在 Vercel 選擇 Add New，再選 Project，匯入 short-video-collection-center。

在 Project Settings 的 Environment Variables 設定 OPENAI_API_KEY、OPENAI_MODEL、GOOGLE_MAPS_API_KEY、ALLOWED_ORIGIN。不要將 Key 放入 GitHub。

API 包含 analyze-bookmark 與 search-places。前端會在下一個更新連接它們，並要求使用者確認候選地點。
