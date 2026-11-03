export const PROJECT_NAME_PRESETS = [
  "室內設計",
  "清拆",
  "水電",
  "油漆",
  "泥水",
  "冷氣",
  "防水",
] as const;

/** Preset names first, then names already used, so a typed 新增 name shows up next time. */
export function projectNameOptions(existing: string[], current = ""): string[] {
  const extras = new Set<string>();
  for (const name of [...existing, current]) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    if (!(PROJECT_NAME_PRESETS as readonly string[]).includes(trimmed)) extras.add(trimmed);
  }
  return [
    ...PROJECT_NAME_PRESETS,
    ...[...extras].sort((a, b) => a.localeCompare(b, "zh-Hant")),
  ];
}
