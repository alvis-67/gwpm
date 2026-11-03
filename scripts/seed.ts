import { resetData, isUsingBlobStore } from "../src/lib/store";

async function main() {
  const data = await resetData();
  console.log("已重設演示資料");
  console.log(`使用者：${data.users.length}｜工程：${data.projects.length}｜工種：${data.trades.length}`);
  console.log(`資料層：${isUsingBlobStore() ? "Vercel Blob" : "本地 data/gwpm.json"}`);
  console.log("帳號：");
  console.log("  老闆 owner@demo.local / owner123");
  console.log("  油漆 paint@demo.local / lead123");
  console.log("  水電 plumb@demo.local / lead123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
