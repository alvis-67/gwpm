import type { User } from "./types";

export function formatLeadLabel(user: User): string {
  const company = user.companyName?.trim();
  if (company) return `${company}｜${user.name}`;
  return user.name;
}
