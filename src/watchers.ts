/**
 * Watchers — autonomous loops that find work 24/7.
 *
 * Each watcher monitors a source (GitHub, logs, Slack, etc.)
 * and creates tasks when it finds something to do.
 * The human never assigns work. The worker finds it.
 */

import { runWorker } from "./worker.js";
import { db, getConfig } from "./store.js";
import { execSync } from "node:child_process";

export interface WatcherConfig {
  github?: {
    repos: string[];
    watch: ("issues" | "prs" | "errors" | "security")[];
    interval_minutes?: number;
  };
  logs?: {
    cmd: string;  // command to fetch logs (e.g. aws logs, docker logs, tail)
    error_pattern?: string;
    interval_minutes?: number;
  };
  slack?: {
    channels: string[];
    watch_for?: string;  // keyword or pattern to trigger work
    interval_minutes?: number;
  };
  cron?: {
    schedule: string;
    task: string;
  }[];
}

interface PendingApproval {
  id: string;
  question: string;
  context: string;
  created_at: string;
}

// Track what we've already seen
function hasSeen(key: string): boolean {
  const row = db().prepare("SELECT 1 FROM seen WHERE key = ?").get(key);
  return !!row;
}

function markSeen(key: string): void {
  db().prepare("INSERT OR IGNORE INTO seen (key, ts) VALUES (?, ?)").run(key, new Date().toISOString());
}

// ─── GitHub Watcher ──────────────────────────────────────────────────────

async function watchGitHub(repos: string[], watch: string[], onAskHuman: (q: string) => Promise<string>): Promise<void> {
  for (const repo of repos) {
    // Watch new issues — auto-triage and attempt fix
    if (watch.includes("issues")) {
      try {
        const result = execSync(
          `gh issue list --repo ${repo} --state open --limit 10 --json number,title,body,createdAt`,
          { encoding: "utf-8", timeout: 15000 }
        );
        const issues = JSON.parse(result || "[]");

        for (const issue of issues) {
          const key = `issue:${repo}:${issue.number}`;
          if (hasSeen(key)) continue;
          markSeen(key);

          console.log(`[watcher] New issue: ${repo}#${issue.number} — ${issue.title}`);

          await runWorker(
            `New issue in ${repo}#${issue.number}: "${issue.title}"\n${(issue.body || "").slice(0, 500)}\n\n` +
            `Triage this issue:\n` +
            `1. Is this a bug, feature request, or question?\n` +
            `2. If it's a bug you can fix, clone the repo, fix it, run tests, and open a PR.\n` +
            `3. If you can't fix it, add a helpful comment with your analysis.\n` +
            `4. Ask for approval before opening PRs or posting comments.`,
            {
              maxSteps: 40,
              onStep: (s, a) => console.log(`  [issue:${issue.number}] step ${s}: ${a}`),
              onAskHuman,
            }
          );
        }
      } catch (e: any) {
        console.error(`[watcher] GitHub issues error for ${repo}:`, e.message);
      }
    }

    // Watch new PRs — auto-review
    if (watch.includes("prs")) {
      try {
        const result = execSync(
          `gh pr list --repo ${repo} --state open --limit 5 --json number,title,createdAt`,
          { encoding: "utf-8", timeout: 15000 }
        );
        const prs = JSON.parse(result || "[]");

        for (const pr of prs) {
          const key = `pr-review:${repo}:${pr.number}`;
          if (hasSeen(key)) continue;
          markSeen(key);

          console.log(`[watcher] New PR: ${repo}#${pr.number} — ${pr.title}`);

          await runWorker(
            `Review PR #${pr.number} in ${repo}: "${pr.title}"\n` +
            `Run: gh pr diff ${pr.number} --repo ${repo}\n` +
            `Post a thorough code review. Check for bugs, edge cases, security issues.\n` +
            `Ask for approval before posting the review comment.`,
            {
              maxSteps: 15,
              onStep: (s, a) => console.log(`  [pr:${pr.number}] step ${s}: ${a}`),
              onAskHuman,
            }
          );
        }
      } catch (e: any) {
        console.error(`[watcher] GitHub PRs error for ${repo}:`, e.message);
      }
    }
  }
}

// ─── Log Watcher ─────────────────────────────────────────────────────────

async function watchLogs(cmd: string, errorPattern: string, onAskHuman: (q: string) => Promise<string>): Promise<void> {
  try {
    const logs = execSync(cmd, { encoding: "utf-8", timeout: 30000 });
    if (!logs.trim()) return;

    const lines = logs.split("\n").filter(l => l.toLowerCase().includes(errorPattern.toLowerCase()));
    if (lines.length === 0) return;

    // Deduplicate by error signature (first 80 chars)
    const newErrors = lines.filter(l => {
      const key = `log:${l.slice(0, 80)}`;
      if (hasSeen(key)) return false;
      markSeen(key);
      return true;
    });

    if (newErrors.length === 0) return;

    console.log(`[watcher] Found ${newErrors.length} new errors in logs`);

    await runWorker(
      `Production errors found:\n${newErrors.slice(0, 20).join("\n")}\n\n` +
      `Analyze these errors. For each:\n` +
      `1. What's the root cause?\n` +
      `2. Can you fix it? If yes, clone the repo, fix, test, open PR.\n` +
      `3. If not fixable from here, create a GitHub issue with your analysis.\n` +
      `Ask for approval before opening PRs.`,
      {
        maxSteps: 40,
        onStep: (s, a) => console.log(`  [logs] step ${s}: ${a}`),
        onAskHuman,
      }
    );
  } catch (e: any) {
    console.error(`[watcher] Log watch error:`, e.message);
  }
}

// ─── Main loop ───────────────────────────────────────────────────────────

export async function startWatchers(
  config: WatcherConfig,
  onAskHuman: (question: string) => Promise<string>,
): Promise<void> {
  // Ensure seen table exists
  db().exec("CREATE TABLE IF NOT EXISTS seen (key TEXT PRIMARY KEY, ts TEXT)");

  console.log("\n  autoworker — running 24/7\n");

  if (config.github) {
    console.log(`  watching: ${config.github.repos.join(", ")} (${config.github.watch.join(", ")})`);
  }
  if (config.logs) {
    console.log(`  watching: logs via "${config.logs.cmd.slice(0, 50)}..."`);
  }
  console.log("");

  const tick = async () => {
    if (config.github) {
      await watchGitHub(config.github.repos, config.github.watch, onAskHuman);
    }
    if (config.logs) {
      await watchLogs(config.logs.cmd, config.logs.error_pattern || "error", onAskHuman);
    }
  };

  // Run immediately, then on interval
  await tick();

  const intervalMs = Math.min(
    (config.github?.interval_minutes || 10) * 60000,
    (config.logs?.interval_minutes || 10) * 60000,
  );

  setInterval(tick, intervalMs);

  console.log(`  next check in ${intervalMs / 60000} minutes\n`);
}
