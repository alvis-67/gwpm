# Gwpm

**Gwpm**（Goodwill Project Management System）— 工程協調項目管理系統。

繁體中文｜手機優先｜Next.js App Router｜多租戶（各工程公司老闆獨立）｜現場調度台視覺。

## 功能

- **多公司隔離**：每位老闆註冊自己的工程公司；只看見本公司工程案
- 工程案／自訂工種／分包公司與負責人指派
- 排程、依賴提示、採購、日誌相片、留言、通知、WhatsApp 明日進場、報告匯出、PWA

## 快速開始

```bash
npm install
cp .env.example .env.local
# 編輯 AUTH_SECRET
npm run seed
npm run dev
```

### 演示帳號

| 角色 | 電郵 | 密碼 | 公司 |
|------|------|------|------|
| Infunity 老闆 Alvis | `owner@demo.local` | `owner123` | Infunity Company Limited |
| 油漆負責人 | `paint@demo.local` | `lead123` | （Infunity 下分包） |
| 水電負責人 | `plumb@demo.local` | `lead123` | （Infunity 下分包） |
| 無關公司老闆 | `other@demo.local` | `owner123` | 示例無關工程有限公司 |

沒有公開註冊。老闆登入後在「我的 → 帳號」建立本公司帳號（電郵、姓名、角色、密碼）。新帳號的 `orgId` 固定為建立者的公司。Supabase Authentication 的用戶不能登入。

首頁（未登入）顯示 `Version`，定義在 `src/lib/version.ts`。每次發佈把 `1.0` 改成 `1.1`、`1.2`，依此類推。

## 資料層

有 `NEXT_PUBLIC_SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY` 時，讀寫走 Supabase（公司隔離仍由登入者的 org 過濾；RLS 拒絕 anon，避免讀到密碼雜湊）。否則用本地 JSON 或 Vercel Blob。

**正式資料庫尚未連接**：repo 與這個開發環境都沒有真實 URL／key。Alvis 把數值設進 Vercel（Production 與 Preview）和本地 `.env.local` 並重新部署之前，預覽站不會寫入 Supabase。不要把 key 提交進 git 或 PR。

| 變數 | 必填 | 設在哪 |
|------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Vercel Environment Variables、`.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | 是（只放伺服器） | 同上。不可用 `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 否 | 伺服器資料層不讀。RLS 拒絕 anon |
| `DATABASE_URL` | 否 | 只給 psql。應用程式不讀 |

接上步驟：Supabase 建立 project → SQL Editor 執行 `supabase/schema.sql` → 設定上面兩個必填變數 → 重新部署。空資料庫第一次讀取會寫入現有演示帳號。`npm run seed` 在已連接時會把演示資料整份重置進 Supabase。

| 環境 | 行為 |
|------|------|
| 未設定 Supabase | 本地 `data/gwpm.json`；Vercel 上若有 `BLOB_READ_WRITE_TOKEN` 則用 Blob，否則為執行個體暫存 |
| 已設定 Supabase | 多公司資料與現場相片（bucket `gwpm-uploads`）走 Supabase |

## 指令

```bash
npm run dev
npm run build
npm run seed
```
