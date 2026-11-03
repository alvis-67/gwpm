import { missingSupabaseEnv } from "../src/lib/supabase";
import { persistenceLabel, persistenceMode, resetData } from "../src/lib/store";

async function main() {
  const data = await resetData();
  console.log("已重設演示資料");
  console.log(`使用者：${data.users.length}｜工程：${data.projects.length}｜工種：${data.trades.length}`);
  console.log(`資料層：${persistenceLabel()}`);
  if (persistenceMode() !== "supabase") {
    const missing = missingSupabaseEnv();
    console.log(
      `Supabase 未連接（缺少 ${missing.join("、")}）。請設在 Vercel Environment Variables 與本地 .env.local，勿提交金鑰。`,
    );
  }
  console.log("帳號：");
  console.log("  Infunity 老闆 owner@demo.local / owner123");
  console.log("  油漆 paint@demo.local / lead123");
  console.log("  水電 plumb@demo.local / lead123");
  console.log("  無關公司老闆 other@demo.local / owner123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
