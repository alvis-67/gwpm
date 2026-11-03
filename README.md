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

新公司老闆：開 `/register` 註冊（建立獨立 Organization）。

## 資料層

| 環境 | 行為 |
|------|------|
| 本地 | `data/gwpm.json` |
| Vercel | 建議 `BLOB_READ_WRITE_TOKEN` |
| Supabase（建議升級） | 開 project → 跑 `supabase/schema.sql` → 設 URL／keys；接線完成後作正式多公司持久化 |

## 指令

```bash
npm run dev
npm run build
npm run seed
```
