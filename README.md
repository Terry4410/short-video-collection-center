# 短影音收藏中心

手機優先的 React + TypeScript + Vite PWA。資料正式來源為 Firebase Firestore 的 bookmarks collection；只有尚未設定 Firebase 或連線失敗時，才退回使用此裝置的 localStorage 暫存。

## 本機執行

1. 複製環境變數範本：cp .env.example .env
2. 填入 Firebase Web App 的設定值。
3. 執行 npm install 與 npm run dev。

## Firebase 設定

1. Firebase Console → Authentication → Sign-in method → 啟用「匿名」。
   App 會在背景自動建立匿名 Firebase 工作階段，不會顯示 Google 登入畫面。
2. Firebase Console → Firestore Database → 建立資料庫。
3. 將本專案的 firestore.rules 發布到 Firestore Rules。
4. 設定下列 Vite 環境變數，範例請見 .env.example。

   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_APP_ID

## GitHub Pages 部署

GitHub repository → Settings → Secrets and variables → Actions → New repository secret，建立上述六個名稱完全相同的 Secrets，填入 Firebase Web App 設定值。

接著在 Settings → Pages → Build and deployment 選擇 GitHub Actions。合併到 main 後，.github/workflows/deploy.yml 會建置並部署網站。

Firebase Web App 的 API key 不是資料庫權限控管；實際權限由 Firestore Rules 決定。本專案以匿名登入限制未驗證請求。因為這是單人、未設帳號的 MVP，任何取得網站的匿名使用者仍可能讀寫收藏；正式公開使用前應改成真正的帳號登入與個人資料隔離規則。

## 資料欄位

bookmarks 每筆資料包含連結、平台、標題、分類、標籤、狀態、優先度、地點、ChatGPT 分析欄位與 createdAt / updatedAt 等 Firestore timestamp。完整型別定義在 src/types/bookmark.ts。
