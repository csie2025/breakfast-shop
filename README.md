# 🥐 早餐店網路訂購系統

完整全端早餐店點餐系統，包含顧客 App、廚房 KDS、管理後台。

**Tech Stack:** Bun + ElysiaJS + Prisma + PostgreSQL (Neon) + React + Vite + TailwindCSS

---

## 🚀 部署流程 (GitHub → Render + Neon)

### 第一步：建立 Neon 資料庫

1. 前往 [neon.tech](https://neon.tech) 並免費註冊
2. 點擊 **「New Project」**
3. Project name: `breakfast-shop`，選擇離台灣最近的 Region（Singapore 或 Tokyo）
4. 建立後，在 **Dashboard** 找到 **Connection string**
5. 複製格式為：`postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require` 的字串
6. **儲存此字串**，稍後部署後端時需要

---

### 第二步：推送到 GitHub

```bash
# 在你的電腦上執行（需已安裝 Git）

# 1. 初始化 git（在 breakfast-shop 根目錄）
cd breakfast-shop
git init
git add .
git commit -m "feat: initial breakfast shop system"

# 2. 前往 github.com 建立新 repo，名稱: breakfast-shop
# 不要勾選 README / .gitignore / License

# 3. 連結並推送
git remote add origin https://github.com/你的帳號/breakfast-shop.git
git branch -M main
git push -u origin main
```

---

### 第三步：部署後端到 Render

1. 前往 [render.com](https://render.com) 並用 GitHub 帳號登入
2. 點擊 **「New +」→「Web Service」**
3. 選擇你的 `breakfast-shop` repo
4. 設定如下：

| 欄位 | 值 |
|------|-----|
| Name | `breakfast-shop-backend` |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `npm install -g bun && bun install && bunx prisma generate && bunx prisma migrate deploy` |
| Start Command | `bun run src/index.ts` |
| Instance Type | `Free` |

5. 點擊 **「Advanced」→「Add Environment Variable」**，逐一加入：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | 你的 Neon 連線字串 |
| `JWT_SECRET` | 任意長字串，例如 `my-super-secret-jwt-key-2026` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | 先填 `*`，之後前端部署後更新 |
| `PORT` | `3001` |

6. 點擊 **「Create Web Service」**，等待 3-5 分鐘部署完成
7. 部署成功後，記錄 Render 提供的後端 URL，例如：
   `https://breakfast-shop-backend.onrender.com`

8. **填入種子資料**（在 Render Shell 執行，或本機有 DATABASE_URL 時執行）：
```bash
cd backend
DATABASE_URL="你的neon連線字串" bun run db:seed
```

---

### 第四步：部署前端到 Render

1. 在 Render 點擊 **「New +」→「Static Site」**
2. 選擇同一個 repo
3. 設定：

| 欄位 | 值 |
|------|-----|
| Name | `breakfast-shop-frontend` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

4. **「Advanced」→「Add Environment Variable」**：

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://breakfast-shop-backend.onrender.com/api` |

5. 點擊 **「Create Static Site」**，等待 2-3 分鐘
6. 部署成功後取得前端 URL，例如：
   `https://breakfast-shop-frontend.onrender.com`

7. **回到後端**，更新 `FRONTEND_URL` 環境變數為前端 URL

---

### 第五步：驗證部署

1. 開啟前端網址，應看到菜單頁面
2. 使用測試帳號登入：
   - 顧客：`user@breakfast.tw` / `User12345`
   - 廚師：`staff@breakfast.tw` / `Staff1234`
   - 管理員：`admin@breakfast.tw` / `Admin1234`
3. 確認可以瀏覽菜單、加入購物車、下單

---

## 💻 本地開發

### 後端

```bash
cd backend
cp .env.example .env
# 編輯 .env，填入 DATABASE_URL 和 JWT_SECRET

bun install
bunx prisma generate
bunx prisma db push     # 建立資料表
bun run db:seed         # 填入測試資料
bun run dev             # 啟動開發伺服器 http://localhost:3001
```

### 前端

```bash
cd frontend
cp .env.example .env
# .env 內容: VITE_API_URL=http://localhost:3001/api（或留空用 proxy）

npm install
npm run dev             # 啟動開發伺服器 http://localhost:5173
```

---

## 📋 測試帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 顧客 | user@breakfast.tw | User12345 |
| 廚師 | staff@breakfast.tw | Staff1234 |
| 管理員 | admin@breakfast.tw | Admin1234 |

## 🔗 重要頁面

| 頁面 | 路由 | 說明 |
|------|------|------|
| 菜單 | `/` | 顧客點餐首頁 |
| 購物車 | `/cart` | 確認商品 |
| 結帳 | `/checkout` | 下單流程 |
| 訂單追蹤 | `/orders` | 查看訂單狀態 |
| 廚房 KDS | `/kitchen` | 廚師操作介面 |
| 菜單管理 | `/admin/menu` | 管理員 CRUD |
| 訂單管理 | `/admin/orders` | 管理員查看所有訂單 |
| 統計報表 | `/admin/stats` | 銷售分析 |
| API 文件 | `/swagger` | 後端 Swagger UI |
