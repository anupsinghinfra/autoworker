/**
 * HTTP server — run AutoWorker as a service.
 * POST /do     — give it a task
 * POST /github — GitHub operations
 * GET  /status — check what it's done
 * GET  /health — health check
 */

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { runWorker } from "./worker.js";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok", agent: "autoworker" }));

app.post("/do", async (c) => {
  const { task, model } = await c.req.json();
  if (!task) return c.json({ error: "task required" }, 400);

  console.log(`[autoworker] Task: ${task}`);

  const result = await runWorker(task, {
    model,
    onStep: (step, action) => console.log(`  step ${step}: ${action}`),
    onAskHuman: async (q) => {
      console.log(`  ⏸ APPROVAL NEEDED: ${q}`);
      return "approved"; // auto-approve in server mode (configure webhook for real approval)
    },
  });

  return c.json(result);
});

app.post("/github", async (c) => {
  const { action, repo, issue, title, body } = await c.req.json();
  if (!action || !repo) return c.json({ error: "action and repo required" }, 400);

  const taskMap: Record<string, string> = {
    fix: `Clone https://github.com/${repo}. Fix this issue: ${issue || title}. Run tests. Open a PR with gh CLI.`,
    review: `Review PR #${issue} in ${repo}. Run: gh pr diff ${issue} --repo ${repo}. Post a detailed review comment.`,
    issue: `Create a GitHub issue in ${repo} with title "${title}" and body "${body || ""}". Use gh CLI.`,
  };

  const task = taskMap[action];
  if (!task) return c.json({ error: `Unknown action: ${action}` }, 400);

  const result = await runWorker(task, {
    onStep: (step, act) => console.log(`  step ${step}: ${act}`),
    onAskHuman: async (q) => {
      console.log(`  ⏸ APPROVAL NEEDED: ${q}`);
      return "approved";
    },
  });

  return c.json(result);
});

app.get("/status", async (c) => {
  const { db: getDb } = await import("./store.js");
  const tasks = getDb().prepare(
    "SELECT id, task, status, started_at FROM tasks ORDER BY started_at DESC LIMIT 20"
  ).all();
  return c.json({ tasks });
});

export function startServer(port = 4747) {
  serve({ fetch: app.fetch, port }, () => {
    console.log(`\n  autoworker`);
    console.log(`  ✓ http://localhost:${port}`);
    console.log(`  ✓ POST /do    — give it a task`);
    console.log(`  ✓ POST /github — fix, review, issue`);
    console.log(`  ✓ GET  /status — see what it's done\n`);
  });
}
