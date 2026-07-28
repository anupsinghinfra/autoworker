export { engineer } from "./engineer";
export { support } from "./support";
export { researcher } from "./researcher";
export { ops } from "./ops";

// Lazy import to avoid issues with Next.js
export async function getTemplate(role: string) {
  switch (role) {
    case "engineer": return (await import("./engineer")).engineer;
    case "support": return (await import("./support")).support;
    case "researcher": return (await import("./researcher")).researcher;
    case "ops": return (await import("./ops")).ops;
    default: throw new Error(`Unknown role: ${role}`);
  }
}

export const ROLES = [
  { id: "engineer", name: "Engineer", description: "Watches repos, fixes bugs, reviews PRs", icon: "⚡" },
  { id: "support", name: "Support Agent", description: "Answers tickets, searches KB, escalates", icon: "🎧" },
  { id: "researcher", name: "Researcher", description: "Monitors competitors, writes reports", icon: "🔍" },
  { id: "ops", name: "Ops / DevOps", description: "Monitors alerts, diagnoses incidents", icon: "🛡️" },
];
