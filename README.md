# Gwpm

**Gwpm**（Goodwill Project Management System）— 工程協調項目管理系統第一版。

繁體中文｜手機優先｜Next.js App Router｜現場調度台（Site Desk）視覺。

## 功能（MVP）

- 工程案／工種／負責人指派與標準狀態
- 排程、依賴提示（可進場／受阻）
- 採購掛鈎工種、日誌＋相片、工種留言
- 系統內通知、明日進場 WhatsApp 一鍵提醒（`wa.me`）
- 客戶進度報告（列印／PDF）
- PWA 可加入主畫面

## 快速開始

```bash
npm install
cp .env.example .env.local
# 編輯 AUTH_SECRET
npm run seed
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

### 演示帳號

| 角色 | 電郵 | 密碼 |
|------|------|------|
| 老闆 | `owner@demo.local` | `owner123` |
| 油漆負責人 | `paint@demo.local` | `lead123` |
| 水電負責人 | `plumb@demo.local` | `lead123` |

## 資料層（Vercel 可寫）

| 環境 | 行為 |
|------|------|
| 本地開發 | `data/gwpm.json` + `public/uploads/` |
| Vercel | 設定 `BLOB_READ_WRITE_TOKEN` 後，狀態與相片寫入 **Vercel Blob** |

環境變數見 `.env.example`。

```bash
npm run seed   # 重設演示資料
```

## 部署（Vercel）

1. Import 此 GitHub repo（或 CLI：`npx vercel link` → `npx vercel --prod`）
2. 設定環境變數 `AUTH_SECRET`（必填）
3. 建議啟用 Vercel Blob 並設定 `BLOB_READ_WRITE_TOKEN`（生產可寫持久化；未設則用記憶體／`/tmp`，實例重啟會遺失）
4. Deploy 後首次請求會自動 seed；本地可用 `npm run seed`

## 指令摘要

```bash
npm run dev      # 開發伺服器
npm run build    # 生產建置
npm run start    # 啟動生產伺服器
npm run seed     # 重設演示資料
npm run lint     # ESLint
```
