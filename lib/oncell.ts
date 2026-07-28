/**
 * oncell integration — all agent execution goes through here.
 * Pokio stores the org chart. oncell runs the agents.
 */

const ONCELL_API = process.env.ONCELL_API_URL || "https://api.oncell.ai";
const ONCELL_KEY = process.env.ONCELL_API_KEY || "";

export function oncellConfigured(): boolean {
  return ONCELL_KEY.length > 0;
}

async function oncellFetch(path: string, opts: RequestInit = {}) {
  if (!ONCELL_KEY) {
    throw new Error("ONCELL_API_KEY not set — get a key at oncell.ai and export it before starting Pokio");
  }
  const res = await fetch(`${ONCELL_API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ONCELL_KEY}`,
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`oncell ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Deploy a Pokio as an oncell agent.
 */
export async function deployPokio(
  name: string,
  agentConfig: {
    instructions: string;
    model?: string;
    skills?: Record<string, { when: string; guide: string; model?: string }>;
    tools?: string[];
  },
): Promise<{ agentName: string; url: string }> {
  return oncellFetch("/api/v1/deploy", {
    method: "POST",
    body: JSON.stringify({
      agentName: `pokio-${name.toLowerCase()}`,
      source: generateAgentSource(name, agentConfig),
    }),
  });
}

/**
 * Run a task on a Pokio's oncell agent.
 */
export async function runPokio(
  name: string,
  task: string,
  input: Record<string, unknown> = {},
): Promise<unknown> {
  return oncellFetch(`/api/v1/agents/pokio-${name.toLowerCase()}/${task}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Get pending approvals across all Pokios.
 */
export async function getApprovals(): Promise<{ pending: unknown[] }> {
  return oncellFetch("/api/v1/agents/approvals");
}

/**
 * Approve or deny a pending action.
 */
export async function resolveApproval(
  runId: string,
  approved: boolean,
  reason?: string,
): Promise<unknown> {
  return oncellFetch(`/api/v1/agents/approve/${runId}`, {
    method: "POST",
    body: JSON.stringify({ approved, reason }),
  });
}

/**
 * Get a Pokio's recent activity (runs).
 */
export async function getActivity(name: string): Promise<{ runs: unknown[] }> {
  return oncellFetch(`/api/v1/agents/pokio-${name.toLowerCase()}/runs`);
}

/**
 * Set secrets for a Pokio (GitHub token, Slack token, etc.)
 */
export async function setSecrets(secrets: Record<string, string>): Promise<unknown> {
  return oncellFetch("/api/v1/secrets", {
    method: "POST",
    body: JSON.stringify({ secrets }),
  });
}

/**
 * Generate agent.ts source code from a template config.
 */
function generateAgentSource(
  name: string,
  config: {
    instructions: string;
    model?: string;
    skills?: Record<string, { when: string; guide: string; model?: string }>;
    tools?: string[];
  },
): string {
  const skills = config.skills
    ? Object.entries(config.skills).map(([k, v]) =>
      `    ${k}: { when: ${JSON.stringify(v.when)}, guide: ${JSON.stringify(v.guide)}${v.model ? `, model: ${JSON.stringify(v.model)}` : ""} }`
    ).join(",\n")
    : "";

  return `import { Agent } from "oncell";

const agent = new Agent("pokio-${name.toLowerCase()}", {
  instructions: ${JSON.stringify(config.instructions)},
  model: ${JSON.stringify(config.model || "kimi-k3")},
${skills ? `  skills: {\n${skills}\n  },\n` : ""}  tools: ${JSON.stringify(config.tools || ["files", "shell", "memory"])},
});

agent.schedule("patrol", "every 10m", async () => {
  return agent.llm("Check for new work. Review open issues, new PRs, and error logs. Fix what you can, report what you can't.", {
    maxSteps: 30,
    maxCost: 3.00,
  });
}, { maxCost: 5.00 });

agent.task("do", async ({ task }) => {
  return agent.llm(task, { maxSteps: 50, maxCost: 5.00 });
});

export default agent;`;
}
