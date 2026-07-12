# 短影音收藏中心

手機優先的 React + TypeScript + Vite MVP。支援本機暫存、Google 登入與 Firestore 同步。

## 本機執行
```bash
npm install
npm run dev
```

## 部署到 GitHub Pages
1. 將此資料夾推送到 GitHub repository。
2. GitHub 的 **Settings → Pages → Build and deployment** 選擇 **GitHub Actions**。
3. 新增 `.github/workflows/deploy.yml`（可使用官方 Vite Pages workflow），並在 workflow 設定 `base: '/repository-name/'`；或改用 Vercel，Vite 預設即可部署。
4. 本專案目前 `vite.config.ts` 使用相對路徑 `./`，適合靜態 Pages；若之後加入 Router，建議改為 repository base path。

## Firebase 設定

已設定 Firebase Web App 與 Google 登入。首次部署後，請使用 App 登入並提供 Firebase UID，再將 `firestore.rules` 的 `OWNER_UID_AFTER_FIRST_LOGIN` 改成該 UID 後部署規則。Firebase Web 設定可公開；Google Maps/Places 與 OpenAI 金鑰不可放入前端或 GitHub。
