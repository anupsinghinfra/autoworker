/**
 * Deploys (or re-deploys) a Pokio to oncell with its current config baked in.
 * Called on hire and whenever connections change, so the agent always knows
 * exactly what it's watching.
 */

import { Pokio, listConnections, updatePokio } from "./db";
import { deployPokio } from "./oncell";
import { getTemplate } from "../templates";

const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub repos",
  slack: "Slack channels",
  zendesk: "Zendesk views",
  rss: "RSS / web feeds",
  cloudwatch: "CloudWatch log groups",
  pagerduty: "PagerDuty services",
};

/** Human-readable "what you watch" block appended to template instructions. */
export function buildWatchInstructions(pokio: Pokio): string {
  const connections = listConnections(pokio.id);
  if (connections.length === 0) {
    return "\n\nYou have no connections configured yet. Report that you're waiting for a connection instead of guessing at work.";
  }

  const lines = connections.map((c) => {
    const label = PROVIDER_LABELS[c.provider] || c.provider;
    const targets = c.config.targets?.length ? c.config.targets.join(", ") : "(all)";
    return `- ${label}: ${targets} — credentials are in the ${c.provider.toUpperCase()}_TOKEN secret`;
  });

  return `\n\nYou are watching:\n${lines.join("\n")}\n\nOnly act on the targets listed above.`;
}

/** Deploy the pokio's oncell agent from its role template + connections. */
export async function redeployPokio(pokio: Pokio): Promise<string> {
  const template = await getTemplate(pokio.role);

  const deployed = await deployPokio(pokio.name, {
    instructions: template.instructions + buildWatchInstructions(pokio),
    model: template.model,
    skills: template.skills,
    tools: template.tools,
  });

  updatePokio(pokio.id, { oncell_agent_id: deployed.agentName });
  return deployed.agentName;
}
