import assert from "node:assert/strict";
import { readFileSync } from "fs";
import {
  SUPABASE_PAYLOAD_KEYS,
  fromSupabasePayload,
  toSupabasePayload,
} from "../src/lib/supabase-data";
import {
  SUPABASE_ENV,
  missingSupabaseEnv,
  supabaseConfigured,
} from "../src/lib/supabase";
import { persistenceLabel, persistenceMode } from "../src/lib/store";
import type { AppData } from "../src/lib/types";

const saved = {
  url: process.env[SUPABASE_ENV.url],
  service: process.env[SUPABASE_ENV.serviceRoleKey],
  anon: process.env[SUPABASE_ENV.anonKey],
  blob: process.env.BLOB_READ_WRITE_TOKEN,
};

function restoreEnv() {
  const set = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  set(SUPABASE_ENV.url, saved.url);
  set(SUPABASE_ENV.serviceRoleKey, saved.service);
  set(SUPABASE_ENV.anonKey, saved.anon);
  set("BLOB_READ_WRITE_TOKEN", saved.blob);
}

const sample: AppData = {
  version: 2,
  organizations: [
    { id: "org_inf", name: "Infunity Company Limited", createdAt: "2026-11-03T00:00:00.000Z" },
    { id: "org_other", name: "示例無關工程有限公司", createdAt: "2026-11-03T00:00:00.000Z" },
  ],
  users: [
    {
      id: "user_owner",
      orgId: "org_inf",
      email: "owner@demo.local",
      name: "Alvis",
      companyName: "Infunity Company Limited",
      phoneE164: "+85291234567",
      roleDefault: "owner",
      passwordHash: "$2a$10$examplehash",
      createdAt: "2026-11-03T00:00:00.000Z",
    },
  ],
  projects: [
    {
      id: "proj_1",
      orgId: "org_inf",
      name: "太古城單位翻新",
      location: "香港",
      clientDisplayName: "張先生",
      status: "active",
      plannedStart: "2026-11-01",
      plannedEnd: "2026-11-20",
      notes: "",
      createdAt: "2026-11-03T00:00:00.000Z",
      updatedAt: "2026-11-03T00:00:00.000Z",
    },
  ],
  trades: [
    {
      id: "trade_1",
      projectId: "proj_1",
      name: "油漆",
      assigneeUserId: null,
      status: "ready",
      plannedStart: "2026-11-04",
      plannedEnd: "2026-11-06",
      actualStart: null,
      actualEnd: null,
      sortOrder: 1,
      notes: "",
    },
  ],
  dependencies: [],
  procurements: [
    {
      id: "proc_1",
      projectId: "proj_1",
      tradeId: "trade_1",
      name: "乳膠漆",
      qty: 12,
      unit: "桶",
      status: "ordered",
      supplierNote: "",
      updatedAt: "2026-11-03T00:00:00.000Z",
    },
  ],
  workLogs: [],
  photos: [],
  comments: [],
  notifications: [
    {
      id: "ntf_1",
      userId: "user_owner",
      type: "assigned",
      title: "指派",
      body: "油漆",
      entityType: "trade",
      entityId: "trade_1",
      href: "/projects/proj_1/trades/trade_1",
      readAt: null,
      createdAt: "2026-11-03T00:00:00+00:00",
    },
  ],
};

const payload = toSupabasePayload(sample);
assert.deepEqual(Object.keys(payload).sort(), [...SUPABASE_PAYLOAD_KEYS].sort());

const loaded = fromSupabasePayload({
  revision: 3,
  ...payload,
  procurements: [{ ...payload.procurements[0], qty: "12" }],
  photos: undefined,
});
assert.equal(loaded.revision, 3);
assert.equal(loaded.data.version, 2);
assert.equal(loaded.data.organizations.length, 2);
assert.equal(loaded.data.organizations[0].name, "Infunity Company Limited");
assert.equal(loaded.data.users[0].passwordHash, "$2a$10$examplehash");
assert.equal(loaded.data.users[0].orgId, "org_inf");
assert.equal(loaded.data.projects[1], undefined);
assert.equal(loaded.data.projects[0].orgId, "org_inf");
assert.equal(loaded.data.trades[0].assigneeUserId, null);
assert.equal(loaded.data.procurements[0].qty, 12);
assert.deepEqual(loaded.data.photos, []);
assert.equal(loaded.data.notifications[0].readAt, null);

const adminRoundTrip = structuredClone(sample);
adminRoundTrip.users.push({
  id: "user_gwpm_admin",
  orgId: "org_gwpm",
  email: "admin@gwpm.com",
  name: "系統管理員",
  companyName: "Gwpm",
  phoneE164: "",
  roleDefault: "admin",
  passwordHash: "$2a$10$admin",
  createdAt: "2026-11-03T00:00:00.000Z",
});
const adminPayload = toSupabasePayload(adminRoundTrip);
assert.equal(adminPayload.users.find((user) => user.email === "admin@gwpm.com")?.roleDefault, "owner");
const adminLoaded = fromSupabasePayload({ revision: 4, ...adminPayload });
assert.equal(
  adminLoaded.data.users.find((user) => user.email === "admin@gwpm.com")?.roleDefault,
  "admin",
);
assert.equal(adminLoaded.data.users.find((user) => user.email === "owner@demo.local")?.roleDefault, "owner");

const pending = structuredClone(sample);
pending.users[0].accountStatus = "pending";
const pendingPayload = toSupabasePayload(pending);
assert.equal(pendingPayload.users[0].accountStatus, "pending");
assert.ok(pendingPayload.users[0].passwordHash.startsWith("gwpm-status:pending:"));
const oldSqlPayload = {
  ...pendingPayload,
  users: pendingPayload.users.map((user) => {
    const copy = { ...user };
    delete copy.accountStatus;
    return copy;
  }),
};
const pendingLoaded = fromSupabasePayload({ revision: 5, ...oldSqlPayload });
assert.equal(pendingLoaded.data.users[0].accountStatus, "pending");
assert.equal(pendingLoaded.data.users[0].roleDefault, "owner");

assert.equal(persistenceLabel("local"), "本地 JSON（未連接 Supabase）");
assert.equal(persistenceLabel("blob"), "Vercel Blob（可寫）");
assert.equal(persistenceLabel("supabase"), "Supabase（多租戶）");

delete process.env[SUPABASE_ENV.url];
delete process.env[SUPABASE_ENV.serviceRoleKey];
delete process.env.BLOB_READ_WRITE_TOKEN;
process.env[SUPABASE_ENV.anonKey] = "anon-only";
assert.equal(supabaseConfigured(), false);
assert.deepEqual(missingSupabaseEnv(), [
  SUPABASE_ENV.url,
  SUPABASE_ENV.serviceRoleKey,
]);
assert.equal(persistenceMode(), "local");

process.env[SUPABASE_ENV.url] = "https://example.supabase.co";
assert.equal(supabaseConfigured(), false);
assert.deepEqual(missingSupabaseEnv(), [SUPABASE_ENV.serviceRoleKey]);

process.env.BLOB_READ_WRITE_TOKEN = "blob-token";
assert.equal(persistenceMode(), "blob");

process.env[SUPABASE_ENV.serviceRoleKey] = "service-role-test";
assert.equal(supabaseConfigured(), true);
assert.equal(persistenceMode(), "supabase");

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
assert.match(schema, /'admin', 'owner', 'trade_lead'/);
assert.match(schema, /function gwpm_load_data/);
assert.match(schema, /function gwpm_replace_data/);
assert.match(schema, /enable row level security/);
assert.match(schema, /gwpm-uploads/);
assert.match(schema, /revoke all on function public.gwpm_load_data\(\) from public/);
assert.doesNotMatch(schema, /delete from\s+[a-z_]+\s*;/i);
for (const table of [
  "work_log_photos",
  "trade_comments",
  "work_logs",
  "trade_dependencies",
  "procurement_items",
  "notifications",
  "project_trades",
  "projects",
  "users",
  "organizations",
]) {
  assert.match(schema, new RegExp(`delete from ${table} where true;`));
}

restoreEnv();
console.log("supabase mapping checks ok");
