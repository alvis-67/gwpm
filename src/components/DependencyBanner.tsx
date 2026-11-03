import type { DependencyHint } from "@/lib/dependencies";

export function DependencyBanner({ hint }: { hint: DependencyHint }) {
  if (hint.kind === "none") return null;
  if (hint.kind === "ready") {
    return (
      <div className="banner banner-ready" role="status">
        可進場：前置條件已滿足
      </div>
    );
  }
  return (
    <div className="banner banner-blocked" role="status">
      受阻／不宜進場：需「
      {hint.blockers.map((b) => `${b.name}（${b.requiredLabel}）`).join("、")}
      」
    </div>
  );
}
