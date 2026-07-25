#!/usr/bin/env node
/**
 * AutoWorker CLI
 *
 * Usage:
 *   autoworker "Fix the checkout bug"
 *   autoworker serve
 *   autoworker fix --repo yourorg/app --issue "Cart total wrong"
 *   autoworker review --repo yourorg/app --pr 42
 *   autoworker status
 */

import { runWorker } from "./worker.js";
import { startServer } from "./server.js";
import * as readline from "node:readline";

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
  console.log(`
  autoworker — your 24/7 AI employee

  Usage:
    autoworker "Fix the login timeout bug"     Run a task
    autoworker serve                            Start HTTP server
    autoworker fix --repo org/app --issue "…"   Fix a GitHub issue
    autoworker review --repo org/app --pr 42    Review a PR
    autoworker status                           Show recent tasks
    autoworker chat                             Interactive mode

  Environment:
    MOONSHOT_API_KEY      Kimi K3 (default model)
    ANTHROPIC_API_KEY     Claude (for complex reasoning)
    OPENAI_API_KEY        OpenAI (alternative)
    GITHUB_TOKEN          GitHub access (gh CLI)
    AUTOWORKER_MODEL      Default model (kimi-k3)
    AUTOWORKER_DATA       Data directory (.autoworker)
  `);
  process.exit(0);
}

// ─── serve ───────────────────────────────────────────────────────────────

if (command === "serve") {
  const port = parseInt(getFlag("--port") || "4747");
  startServer(port);
}

// ─── status ──────────────────────────────────────────────────────────────

else if (command === "status") {
  const { db } = await import("./store.js");
  const tasks = db().prepare(
    "SELECT id, task, status, started_at FROM tasks ORDER BY started_at DESC LIMIT 10"
  ).all() as any[];

  if (tasks.length === 0) {
    console.log("No tasks yet. Run: autoworker \"Fix the bug\"");
  } else {
    for (const t of tasks) {
      console.log(`  ${t.status === "completed" ? "✓" : "…"} ${t.task.slice(0, 60)} (${t.status})`);
    }
  }
}

// ─── fix ─────────────────────────────────────────────────────────────────

else if (command === "fix") {
  const repo = getFlag("--repo");
  const issue = getFlag("--issue");
  if (!repo || !issue) { console.error("Usage: autoworker fix --repo org/app --issue \"…\""); process.exit(1); }

  await run(`Clone https://github.com/${repo}. Fix: ${issue}. Run tests. Open a PR with gh CLI.`);
}

// ─── review ──────────────────────────────────────────────────────────────

else if (command === "review") {
  const repo = getFlag("--repo");
  const pr = getFlag("--pr");
  if (!repo || !pr) { console.error("Usage: autoworker review --repo org/app --pr 42"); process.exit(1); }

  await run(`Review PR #${pr} in ${repo}. Run: gh pr diff ${pr} --repo ${repo}. Post detailed review.`);
}

// ─── chat ────────────────────────────────────────────────────────────────

else if (command === "chat") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("autoworker interactive mode. Type a task, press enter. Ctrl+C to quit.\n");

  const prompt = () => {
    rl.question("→ ", async (input) => {
      if (!input.trim()) { prompt(); return; }
      await run(input.trim());
      prompt();
    });
  };
  prompt();
}

// ─── default: run a task ─────────────────────────────────────────────────

else {
  const task = args.join(" ");
  await run(task);
}

// ─── helpers ─────────────────────────────────────────────────────────────

async function run(task: string) {
  console.log(`\n  ⚡ ${task}\n`);

  const result = await runWorker(task, {
    onStep: (step, action) => console.log(`  ${step}. ${action}`),
    onAskHuman: async (question) => {
      return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`\n  ⏸ ${question} [y/n]: `, (answer) => {
          rl.close();
          resolve(answer.toLowerCase().startsWith("y") ? "approved" : "denied");
        });
      });
    },
  });

  console.log(`\n  ✓ Done (${result.steps} steps)\n`);
  if (result.text) console.log(result.text);
}

function getFlag(name: string): string | undefined {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
}
