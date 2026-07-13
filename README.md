# 短影音收藏中心

手機優先的 React + TypeScript + Vite PWA。正式資料來源為 Firebase Firestore 的 bookmarks collection，只有兩個授權 Google 帳號可以存取：

- terry4410@gmail.com
- baritone90064@gmail.com

## Firebase Console 中文版設定

### 1. 啟用 Google 登入

Firebase Console → 建置 → Authentication → 登入方式 → 新增供應商 → Google → 啟用。

「專案的支援電子郵件」請選擇 terry4410@gmail.com，然後儲存。

「將外部專案的用戶端 ID 新增至許可清單（選用）」不是填使用者 Email 的欄位。請不要把 baritone90064@gmail.com 填在這裡；此欄位維持空白，除非你有外部 Google Cloud OAuth Client ID。

### 2. 建立 Firestore 與發布 Rules

Firebase Console → 建置 → Firestore Database → 建立資料庫。

接著到「規則」，貼上本專案 firestore.rules 的內容並按「發布」。Rules 與前端的 ALLOWED_EMAILS 都只允許 terry4410@gmail.com 和 baritone90064@gmail.com。

### 3. 授權網域

Firebase Console → 建置 → Authentication → 設定 → 授權網域，確認包含：

- localhost
- terry4410.github.io
- 你的 Vercel 網域（如有使用）
- Firebase Hosting 網域（如有使用）

## 環境變數與 GitHub Pages

GitHub repository → Settings → Secrets and variables → Actions → New repository secret。

每個 Secret 只填 Firebase config 的純值，不要包含 key 名稱、冒號、引號或逗號。需要設定：

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_GOOGLE_MAPS_API_KEY（要顯示可點擊的地圖 Marker 時才需要）

例如 Firebase config 的 apiKey 值是 AIzaxxxx，則 VITE_FIREBASE_API_KEY 的 Secret 值只填 AIzaxxxx。

GitHub → Settings → Pages → Build and deployment 選擇 GitHub Actions。更新 Secrets 後，請重新執行 GitHub Actions 部署，Vite 才會將新設定帶入網站。

## 本機執行

1. 複製 .env.example 為 .env。
2. 填入 Firebase Web App 的設定值。
3. 執行 npm install 與 npm run dev。

## 資料與登入行為

App 啟動時會先等待 Google 登入狀態；未登入不會讀取 Firestore。登入後前端以 ALLOWED_EMAILS 檢查 email，授權帳號才建立 bookmarks 即時監聽。

首次成功連上空白 Firestore 時，App 會將此裝置原本 localStorage 的收藏一次匯入雲端，避免舊收藏遺失。
