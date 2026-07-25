#!/usr/bin/env node
/**
 * Pokio CLI
 *
 * Autonomous mode (24/7):
 *   pokio watch --github myorg/app --github myorg/api
 *   pokio watch --logs "docker logs myapp --since 1h"
 *
 * One-shot mode:
 *   pokio "Fix the checkout bug"
 *   pokio fix --repo myorg/app --issue "Cart total wrong"
 *   pokio review --repo myorg/app --pr 42
 *
 * Server mode:
 *   pokio serve
 *
 * Interactive:
 *   pokio chat
 */

import { runWorker } from "./worker.js";
import { startServer } from "./server.js";
import { startWatchers, type WatcherConfig } from "./watchers.js";
import * as readline from "node:readline";

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
  console.log(`
  pokio — your 24/7 AI employee

  Autonomous (runs forever, finds its own work):
    pokio watch --github myorg/app          Watch repo for issues + PRs
    pokio watch --github myorg/app \\
                     --github myorg/api \\
                     --logs "docker logs app"    Watch repos + logs

  One-shot (do one task):
    pokio "Fix the login timeout bug"       Run a task
    pokio fix --repo org/app --issue "…"    Fix a GitHub issue
    pokio review --repo org/app --pr 42     Review a PR

  Server:
    pokio serve                             HTTP API on :4747

  Interactive:
    pokio chat                              REPL mode

  Environment:
    MOONSHOT_API_KEY      Kimi K3 (default model)
    ANTHROPIC_API_KEY     Claude
    OPENAI_API_KEY        OpenAI
    GITHUB_TOKEN          GitHub access (gh CLI)
    POKIO_MODEL      Default model (kimi-k3)
  `);
  process.exit(0);
}

// ─── watch (autonomous 24/7 mode) ────────────────────────────────────────

if (command === "watch") {
  const config: WatcherConfig = { github: { repos: [], watch: ["issues", "prs"] } };

  // Parse --github flags
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--github" && args[i + 1]) {
      config.github!.repos.push(args[++i]);
    }
    if (args[i] === "--logs" && args[i + 1]) {
      config.logs = { cmd: args[++i] };
    }
    if (args[i] === "--interval" && args[i + 1]) {
      const mins = parseInt(args[++i]);
      if (config.github) config.github.interval_minutes = mins;
      if (config.logs) config.logs.interval_minutes = mins;
    }
    if (args[i] === "--watch" && args[i + 1]) {
      config.github!.watch = args[++i].split(",") as any;
    }
  }

  if (config.github!.repos.length === 0 && !config.logs) {
    console.error("Specify at least one source: --github org/repo or --logs \"command\"");
    process.exit(1);
  }

  // In terminal: ask human via stdin. In production: queue approvals.
  const isTTY = process.stdin.isTTY;

  const onAskHuman = isTTY
    ? async (question: string): Promise<string> => {
        return new Promise((resolve) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question(`\n  ⏸ ${question} [y/n]: `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase().startsWith("y") ? "approved" : "denied");
          });
        });
      }
    : async (question: string): Promise<string> => {
        console.log(`  ⏸ AUTO-APPROVED (non-interactive): ${question}`);
        return "approved";
      };

  await startWatchers(config, onAskHuman);

  // Keep process alive
  await new Promise(() => {});
}

// ─── serve ───────────────────────────────────────────────────────────────

else if (command === "serve") {
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
    console.log("No tasks yet. Run: pokio watch --github myorg/app");
  } else {
    for (const t of tasks) {
      console.log(`  ${t.status === "completed" ? "✓" : "…"} ${t.task.slice(0, 70)} (${t.status})`);
    }
  }
}

// ─── fix ─────────────────────────────────────────────────────────────────

else if (command === "fix") {
  const repo = getFlag("--repo");
  const issue = getFlag("--issue");
  if (!repo || !issue) { console.error("Usage: pokio fix --repo org/app --issue \"…\""); process.exit(1); }
  await run(`Clone https://github.com/${repo}. Fix: ${issue}. Run tests. Open a PR with gh CLI.`);
}

// ─── review ──────────────────────────────────────────────────────────────

else if (command === "review") {
  const repo = getFlag("--repo");
  const pr = getFlag("--pr");
  if (!repo || !pr) { console.error("Usage: pokio review --repo org/app --pr 42"); process.exit(1); }
  await run(`Review PR #${pr} in ${repo}. Run: gh pr diff ${pr} --repo ${repo}. Post detailed review.`);
}

// ─── chat ────────────────────────────────────────────────────────────────

else if (command === "chat") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("pokio interactive mode. Type a task, press enter. Ctrl+C to quit.\n");

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
  await run(args.join(" "));
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
