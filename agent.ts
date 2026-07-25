/**
 * AutoWorker — your 24/7 AI employee.
 *
 * Like OpenWorker, but cloud-native. Always on. No desktop required.
 * Connects to GitHub, Slack, Jira, Notion, Gmail, Calendar.
 * Delivers finished work — docs, PRs, tickets, emails, reports.
 *
 * Deploy: npx oncell deploy
 */

import { Agent } from "oncell";

const agent = new Agent("autoworker", {
  instructions: `You are AutoWorker — an AI employee that gets real work done.

    You don't chat. You deliver finished work:
    - Pull requests with tested code
    - Drafted emails ready to send
    - Jira tickets filed with context
    - Notion docs written and formatted
    - Slack messages posted with data
    - Reports generated from real data
    - Calendar events scheduled

    You have access to all the tools your human colleagues use.
    You ask for approval before anything consequential.
    You run 24/7 and handle scheduled tasks automatically.

    When given a task:
    1. Break it into steps
    2. Use the right tools for each step
    3. Ask for approval before sending/posting/merging
    4. Deliver the finished result`,

  model: "kimi-k3",

  skills: {
    plan: {
      when: "Breaking down a complex task, deciding approach",
      model: "claude-opus",
      guide: `Think step by step. Identify which tools and integrations
        are needed. Consider dependencies between steps.`,
    },
    write: {
      when: "Writing docs, emails, reports, ticket descriptions",
      model: "claude-opus",
      guide: `Write clearly and professionally. Match the tone of
        the team. Include relevant data and context.`,
    },
    code: {
      when: "Writing or editing code, scripts, configs",
      guide: `Write minimal, correct code. Run tests. Match style.`,
    },
    research: {
      when: "Gathering information, reading docs, analyzing data",
      guide: `Be thorough. Cross-reference sources. Summarize findings.`,
    },
  },

  tools: ["files", "shell", "memory"],
});

// ─── Chat: natural language task assignment ──────────────────────────────

agent.chat(async ({ message, user }) => {
  const context = await agent.memory.forUser(user.id).get("context");
  const history = await agent.memory.forUser(user.id).get("history");

  const result = await agent.llm(message, {
    context: context as string,
    history: history as any[],
    maxSteps: 50,
    maxCost: 5.00,
  });

  await agent.memory.forUser(user.id).append("history", {
    task: message,
    result: result.text,
    steps: result.steps,
    cost: result.cost,
    ts: new Date().toISOString(),
  });

  return result;
});

// ─── Task: do work ───────────────────────────────────────────────────────
// The universal entry point. Describe what you want, get it done.

agent.task("do", async ({ task, context }: { task: string; context?: string }) => {
  await agent.emit(`Starting: ${task}`);

  const integrations = await loadIntegrations();

  const result = await agent.llm(
    `Task: ${task}\n\n` +
    (context ? `Context: ${context}\n\n` : "") +
    `Available integrations: ${integrations.join(", ")}\n\n` +
    `Break this into steps, execute each one, and deliver the finished result. ` +
    `Ask for approval before sending emails, posting messages, or merging PRs.`,
    {
      maxSteps: 50,
      maxCost: 5.00,
    }
  );

  await agent.memory.append("completed_tasks", {
    task,
    result: result.text,
    steps: result.steps,
    cost: result.cost,
    ts: new Date().toISOString(),
  });

  return result;
});

// ─── GitHub: PRs, issues, code ───────────────────────────────────────────

agent.task("github", async ({
  action, repo, title, body, branch, issue,
}: {
  action: "pr" | "issue" | "review" | "fix";
  repo: string;
  title?: string;
  body?: string;
  branch?: string;
  issue?: string;
}) => {
  await agent.emit(`GitHub ${action}: ${repo}`);

  switch (action) {
    case "fix": {
      await agent.shell(`git clone https://github.com/${repo}.git workspace`);
      await agent.shell(`cd workspace && git checkout -b autoworker/fix-$(date +%s)`);

      const result = await agent.llm(
        `Fix this in ${repo}:\n${issue || title}\n\nRepo at ./workspace.`,
        { maxSteps: 40, maxCost: 4.00 }
      );

      await agent.shell(`cd workspace && git add -A && git commit -m "fix: ${(title || issue || "").slice(0, 60)}"`);
      await agent.shell(`cd workspace && git push origin HEAD`);

      const ok = await agent.askHuman({
        question: `PR ready for ${repo}: ${title || issue}. Approve to create?`,
      });

      if (ok.approved) {
        await agent.shell(`cd workspace && gh pr create --title "${title || issue}" --body "${result.text.slice(0, 500)}"`);
      }
      return { action: "fix", approved: ok.approved };
    }

    case "issue": {
      await agent.shell(
        `gh issue create --repo ${repo} --title ${JSON.stringify(title)} --body ${JSON.stringify(body || "")}`
      );
      return { action: "issue", created: true };
    }

    case "review": {
      const diff = await agent.shell(`gh pr diff ${issue} --repo ${repo}`);
      const review = await agent.llm(
        `Review this PR:\n${diff.stdout}\n\nCheck bugs, edge cases, security.`,
        { maxSteps: 10, maxCost: 2.00 }
      );
      await agent.shell(
        `gh pr review ${issue} --repo ${repo} --comment --body ${JSON.stringify(review.text)}`
      );
      return { action: "review", review: review.text };
    }

    case "pr": {
      await agent.shell(
        `gh pr create --repo ${repo} --title ${JSON.stringify(title)} --body ${JSON.stringify(body || "")} --head ${branch || "HEAD"}`
      );
      return { action: "pr", created: true };
    }
  }
});

// ─── Slack: post, read, respond ──────────────────────────────────────────

agent.task("slack", async ({
  action, channel, message, thread,
}: {
  action: "post" | "read" | "summarize";
  channel: string;
  message?: string;
  thread?: string;
}) => {
  const token = await agent.secrets.SLACK_TOKEN;

  switch (action) {
    case "post": {
      const ok = await agent.askHuman({
        question: `Post to #${channel}: "${(message || "").slice(0, 100)}"?`,
      });
      if (!ok.approved) return { posted: false };

      await agent.shell(
        `curl -s -X POST https://slack.com/api/chat.postMessage ` +
        `-H "Authorization: Bearer ${token}" ` +
        `-H "Content-Type: application/json" ` +
        `-d '{"channel":"${channel}","text":${JSON.stringify(message)}}'`
      );
      return { posted: true };
    }

    case "read": {
      const result = await agent.shell(
        `curl -s "https://slack.com/api/conversations.history?channel=${channel}&limit=20" ` +
        `-H "Authorization: Bearer ${token}"`
      );
      return JSON.parse(result.stdout);
    }

    case "summarize": {
      const history = await agent.shell(
        `curl -s "https://slack.com/api/conversations.history?channel=${channel}&limit=50" ` +
        `-H "Authorization: Bearer ${token}"`
      );
      const summary = await agent.llm(
        `Summarize this Slack channel:\n${history.stdout}`,
        { maxSteps: 3, maxCost: 0.50 }
      );
      return { summary: summary.text };
    }
  }
});

// ─── Email: draft, send ──────────────────────────────────────────────────

agent.task("email", async ({
  action, to, subject, body, draft,
}: {
  action: "draft" | "send" | "read";
  to?: string;
  subject?: string;
  body?: string;
  draft?: boolean;
}) => {
  if (action === "draft" || action === "send") {
    const content = body || (await agent.llm(
      `Write an email to ${to} about: ${subject}`,
      { maxSteps: 3, maxCost: 0.50 }
    )).text;

    if (action === "send") {
      const ok = await agent.askHuman({
        question: `Send email to ${to}: "${(subject || "").slice(0, 60)}"?`,
      });
      if (!ok.approved) return { sent: false };
    }

    // Store draft
    await agent.files.write(`drafts/${Date.now()}-${subject}.md`, [
      `To: ${to}`,
      `Subject: ${subject}`,
      ``,
      content,
    ].join("\n"));

    return { action, to, subject, content: content.slice(0, 200) };
  }
});

// ─── Scheduled: morning brief ────────────────────────────────────────────

agent.schedule("morning-brief", "daily 8am", async () => {
  await agent.emit("Generating morning brief...");

  const tasks = (await agent.memory.get("completed_tasks") || []) as any[];
  const yesterday = tasks.filter((t: any) =>
    new Date(t.ts) > new Date(Date.now() - 86400000)
  );

  const brief = await agent.llm(
    `Generate a morning brief:\n` +
    `- Tasks completed yesterday: ${yesterday.length}\n` +
    `- Total cost: $${yesterday.reduce((s: number, t: any) => s + (t.cost || 0), 0).toFixed(2)}\n` +
    `- Pending items: check memory for incomplete work\n\n` +
    `Keep it concise. Highlight what needs attention today.`,
    { maxSteps: 5, maxCost: 0.50 }
  );

  await agent.files.write(
    `briefs/${new Date().toISOString().split("T")[0]}.md`,
    brief.text
  );

  return { brief: brief.text };
}, { maxCost: 1.00 });

// ─── Scheduled: weekly report ────────────────────────────────────────────

agent.schedule("weekly-report", "weekly monday 9am", async () => {
  const tasks = (await agent.memory.get("completed_tasks") || []) as any[];
  const thisWeek = tasks.filter((t: any) =>
    new Date(t.ts) > new Date(Date.now() - 7 * 86400000)
  );

  const report = await agent.llm(
    `Write a weekly report:\n` +
    `Tasks completed: ${thisWeek.length}\n` +
    `Details: ${JSON.stringify(thisWeek.slice(-20))}\n\n` +
    `Format as a professional summary with sections: Completed, In Progress, Blocked.`,
    { maxSteps: 5, maxCost: 1.00 }
  );

  await agent.files.write(
    `reports/week-${new Date().toISOString().split("T")[0]}.md`,
    report.text
  );

  return { report: report.text };
}, { maxCost: 2.00 });

// ─── Webhook: receive events ─────────────────────────────────────────────

agent.onWebhook("/github", async ({ payload }) => {
  const event = (payload as any);

  if (event.action === "opened" && event.pull_request) {
    // Auto-review new PRs
    const diff = await agent.shell(`gh pr diff ${event.pull_request.number} --repo ${event.repository.full_name}`);
    const review = await agent.llm(
      `Review this PR:\n${diff.stdout}`,
      { maxSteps: 10, maxCost: 2.00 }
    );
    await agent.shell(
      `gh pr review ${event.pull_request.number} --repo ${event.repository.full_name} --comment --body ${JSON.stringify(review.text)}`
    );
  }

  if (event.action === "created" && event.issue) {
    // Auto-triage new issues
    await agent.memory.append("pending_issues", {
      repo: event.repository.full_name,
      issue: event.issue.number,
      title: event.issue.title,
      body: event.issue.body?.slice(0, 500),
    });
  }
});

agent.onWebhook("/slack", async ({ payload }) => {
  const event = (payload as any);
  if (event.event?.type === "app_mention") {
    const text = event.event.text.replace(/<@[^>]+>/g, "").trim();
    const result = await agent.llm(text, { maxSteps: 20, maxCost: 2.00 });

    await agent.shell(
      `curl -s -X POST https://slack.com/api/chat.postMessage ` +
      `-H "Authorization: Bearer ${await agent.secrets.SLACK_TOKEN}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '{"channel":"${event.event.channel}","text":${JSON.stringify(result.text)},"thread_ts":"${event.event.ts}"}'`
    );
  }
});

// ─── Configure ───────────────────────────────────────────────────────────

agent.task("configure", async (config: {
  github_repos?: string[];
  slack_channels?: string[];
  jira_project?: string;
  notion_workspace?: string;
}) => {
  for (const [key, value] of Object.entries(config)) {
    await agent.memory.set(`config:${key}`, value);
  }
  return { configured: true, ...config };
});

agent.task("status", async () => {
  const tasks = (await agent.memory.get("completed_tasks") || []) as any[];
  const pending = (await agent.memory.get("pending_issues") || []) as any[];
  return {
    tasks_completed: tasks.length,
    pending_issues: pending.length,
    recent: tasks.slice(-5),
    cost_total: tasks.reduce((s: number, t: any) => s + (t.cost || 0), 0),
  };
});

// ─── Helper ──────────────────────────────────────────────────────────────

async function loadIntegrations(): Promise<string[]> {
  const integrations: string[] = ["GitHub (shell: gh)", "files", "shell"];
  if (await agent.secrets.SLACK_TOKEN) integrations.push("Slack");
  if (await agent.secrets.JIRA_TOKEN) integrations.push("Jira");
  if (await agent.secrets.NOTION_TOKEN) integrations.push("Notion");
  if (await agent.secrets.GMAIL_TOKEN) integrations.push("Gmail");
  return integrations;
}

export default agent;
