import { hash } from "bcryptjs";
import { addDays, format, startOfDay } from "date-fns";
import type { AppData } from "./types";
import { createId } from "./ids";

function d(offset: number, base = new Date()): string {
  return format(addDays(startOfDay(base), offset), "yyyy-MM-dd");
}

export async function buildSeedData(): Promise<AppData> {
  const now = new Date().toISOString();
  const ownerPass = await hash("owner123", 10);
  const leadPass = await hash("lead123", 10);

  const infunityOrgId = createId("org");
  const otherOrgId = createId("org");

  const ownerId = createId("user");
  const paintId = createId("user");
  const plumbId = createId("user");
  const otherOwnerId = createId("user");

  const projectId = createId("proj");
  const project2Id = createId("proj");
  const project3Id = createId("proj");
  const otherProjectId = createId("proj");

  const trades = [
    {
      id: createId("trade"),
      projectId,
      name: "清拆",
      assigneeUserId: null as string | null,
      status: "completed" as const,
      plannedStart: d(-14),
      plannedEnd: d(-10),
      actualStart: d(-14),
      actualEnd: d(-10),
      sortOrder: 1,
      notes: "",
    },
    {
      id: createId("trade"),
      projectId,
      name: "水電",
      assigneeUserId: plumbId,
      status: "in_progress" as const,
      plannedStart: d(-3),
      plannedEnd: d(5),
      actualStart: d(-3),
      actualEnd: null as string | null,
      sortOrder: 2,
      notes: "幹線已完成，待插座",
    },
    {
      id: createId("trade"),
      projectId,
      name: "泥水",
      assigneeUserId: null,
      status: "in_progress" as const,
      plannedStart: d(-2),
      plannedEnd: d(4),
      actualStart: d(-2),
      actualEnd: null,
      sortOrder: 3,
      notes: "",
    },
    {
      id: createId("trade"),
      projectId,
      name: "油漆",
      assigneeUserId: paintId,
      status: "ready" as const,
      plannedStart: d(1),
      plannedEnd: d(6),
      actualStart: null,
      actualEnd: null,
      sortOrder: 4,
      notes: "需泥水完成後方宜進場",
    },
    {
      id: createId("trade"),
      projectId,
      name: "門窗",
      assigneeUserId: null,
      status: "not_started" as const,
      plannedStart: d(7),
      plannedEnd: d(10),
      actualStart: null,
      actualEnd: null,
      sortOrder: 5,
      notes: "",
    },
  ];

  const paintTrade = trades.find((t) => t.name === "油漆")!;
  const plasterTrade = trades.find((t) => t.name === "泥水")!;
  const plumbTrade = trades.find((t) => t.name === "水電")!;

  const log1 = createId("log");
  const log2 = createId("log");
  const otherTradeId = createId("trade");

  return {
    version: 2,
    organizations: [
      {
        id: infunityOrgId,
        name: "Infunity Company Limited",
        createdAt: now,
      },
      {
        id: otherOrgId,
        name: "示例無關工程有限公司",
        createdAt: now,
      },
    ],
    users: [
      {
        id: ownerId,
        orgId: infunityOrgId,
        email: "owner@demo.local",
        name: "Alvis",
        companyName: "Infunity Company Limited",
        phoneE164: "+85291234567",
        roleDefault: "owner",
        passwordHash: ownerPass,
        createdAt: now,
      },
      {
        id: paintId,
        orgId: infunityOrgId,
        email: "paint@demo.local",
        name: "李師傅",
        companyName: "美新油漆工程",
        phoneE164: "+85298765432",
        roleDefault: "trade_lead",
        passwordHash: leadPass,
        createdAt: now,
      },
      {
        id: plumbId,
        orgId: infunityOrgId,
        email: "plumb@demo.local",
        name: "王師傅",
        companyName: "通達水電",
        phoneE164: "+85261112222",
        roleDefault: "trade_lead",
        passwordHash: leadPass,
        createdAt: now,
      },
      {
        id: otherOwnerId,
        orgId: otherOrgId,
        email: "other@demo.local",
        name: "陳生",
        companyName: "示例無關工程有限公司",
        phoneE164: "+85290001111",
        roleDefault: "owner",
        passwordHash: ownerPass,
        createdAt: now,
      },
    ],
    projects: [
      {
        id: projectId,
        orgId: infunityOrgId,
        name: "太古城單位翻新",
        location: "香港太古城道 18 號",
        clientDisplayName: "張先生",
        status: "active",
        plannedStart: d(-14),
        plannedEnd: d(21),
        notes: "Infunity 示範工程案",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: project2Id,
        orgId: infunityOrgId,
        name: "觀塘辦公室裝修",
        location: "觀塘開源道",
        clientDisplayName: "Infunity 內部",
        status: "planning",
        plannedStart: d(10),
        plannedEnd: d(45),
        notes: "",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: project3Id,
        orgId: infunityOrgId,
        name: "沙田商舖翻新",
        location: "沙田正街",
        clientDisplayName: "林小姐",
        status: "active",
        plannedStart: d(-5),
        plannedEnd: d(30),
        notes: "",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: otherProjectId,
        orgId: otherOrgId,
        name: "無關公司工程案（隔離測試）",
        location: "屯門",
        clientDisplayName: "外客",
        status: "active",
        plannedStart: d(0),
        plannedEnd: d(20),
        notes: "Alvis／Infunity 不應看見此案",
        createdAt: now,
        updatedAt: now,
      },
    ],
    trades: [
      ...trades,
      {
        id: createId("trade"),
        projectId: project2Id,
        name: "室內設計",
        assigneeUserId: paintId,
        status: "not_started",
        plannedStart: d(12),
        plannedEnd: d(20),
        actualStart: null,
        actualEnd: null,
        sortOrder: 1,
        notes: "",
      },
      {
        id: otherTradeId,
        projectId: otherProjectId,
        name: "泥水",
        assigneeUserId: null,
        status: "in_progress",
        plannedStart: d(0),
        plannedEnd: d(10),
        actualStart: d(0),
        actualEnd: null,
        sortOrder: 1,
        notes: "",
      },
    ],
    dependencies: [
      {
        id: createId("dep"),
        projectId,
        tradeId: paintTrade.id,
        dependsOnTradeId: plasterTrade.id,
        requiredStatus: "completed",
      },
    ],
    procurements: [
      {
        id: createId("proc"),
        projectId,
        tradeId: paintTrade.id,
        name: "乳膠漆（啞光白）",
        qty: 12,
        unit: "桶",
        status: "ordered",
        supplierNote: "訂購中，預計明日到",
        updatedAt: now,
      },
      {
        id: createId("proc"),
        projectId,
        tradeId: plumbTrade.id,
        name: "防水膠布",
        qty: 5,
        unit: "卷",
        status: "shortage",
        supplierNote: "缺貨待補",
        updatedAt: now,
      },
    ],
    workLogs: [
      {
        id: log1,
        projectTradeId: plumbTrade.id,
        authorUserId: plumbId,
        body: "完成廚房幹線配管，明早繼續插座。",
        createdAt: new Date(Date.now() - 3600_000).toISOString(),
      },
      {
        id: log2,
        projectTradeId: plasterTrade.id,
        authorUserId: ownerId,
        body: "泥水批盪進行中，客廳約 70%。",
        createdAt: new Date(Date.now() - 7200_000).toISOString(),
      },
    ],
    photos: [],
    comments: [
      {
        id: createId("cmt"),
        projectTradeId: paintTrade.id,
        authorUserId: ownerId,
        body: "泥水完成後請即進場，漆料已訂。",
        createdAt: new Date(Date.now() - 1800_000).toISOString(),
      },
    ],
    notifications: [
      {
        id: createId("ntf"),
        userId: paintId,
        type: "assigned",
        title: "您已被指派工種",
        body: "太古城單位翻新｜油漆",
        entityType: "trade",
        entityId: paintTrade.id,
        href: `/projects/${projectId}/trades/${paintTrade.id}`,
        readAt: null,
        createdAt: now,
      },
      {
        id: createId("ntf"),
        userId: ownerId,
        type: "tomorrow_entry",
        title: "明日進場提醒",
        body: "油漆｜美新油漆工程｜李師傅計劃明日進場",
        entityType: "trade",
        entityId: paintTrade.id,
        href: "/today",
        readAt: null,
        createdAt: now,
      },
      {
        id: createId("ntf"),
        userId: paintId,
        type: "comment",
        title: "新留言",
        body: "Alvis 於「油漆」留言",
        entityType: "trade",
        entityId: paintTrade.id,
        href: `/projects/${projectId}/trades/${paintTrade.id}/comments`,
        readAt: null,
        createdAt: new Date(Date.now() - 1700_000).toISOString(),
      },
    ],
  };
}
