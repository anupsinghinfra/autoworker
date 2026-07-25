# AutoWorker

**Your 24/7 AI employee. Like [OpenWorker](https://github.com/andrewyng/openworker), but cloud-native.**

AutoWorker is an autonomous AI agent that does real work — not chat. It connects to GitHub, Slack, Jira, Notion, Gmail, and Calendar, then delivers finished results: pull requests, drafted emails, filed tickets, written docs, and posted messages.

OpenWorker runs on your desktop. AutoWorker runs in the cloud, 24/7, on [oncell](https://oncell.ai).

## What it delivers

| Task | Result |
|------|--------|
| "Fix the checkout bug from today's errors" | PR with tested fix, awaiting your approval |
| "Write a weekly report from Slack activity" | Formatted doc in your workspace |
| "Triage the 5 new GitHub issues" | Labels, priorities, and first responses posted |
| "Draft an email to the client about the delay" | Email draft ready to review and send |
| "Summarize #engineering from the last 24h" | Concise summary posted to #leadership |
| "Review PR #42" | Detailed code review comment posted |

**Not chat. Finished work.**

## Quick Start

```bash
npm install oncell
npx oncell deploy
```

Set your secrets:

```bash
oncell secrets set GITHUB_TOKEN=ghp_...
oncell secrets set SLACK_TOKEN=xoxb-...
# Optional:
oncell secrets set JIRA_TOKEN=...
oncell secrets set NOTION_TOKEN=...
```

Configure:

```typescript
import { OnCell } from "@oncell/sdk";
const oncell = new OnCell({ apiKey: "oncell_sk_..." });

await oncell.agent("autoworker").run("configure", {
  github_repos: ["yourorg/app", "yourorg/api"],
  slack_channels: ["engineering", "alerts"],
});
```

## Usage

### Natural language (chat)

```typescript
// From your app, Slack, or the dashboard
await oncell.agent("autoworker").run("do", {
  task: "Fix the null pointer in checkout and open a PR"
});
```

### GitHub

```typescript
// Fix an issue
await oncell.agent("autoworker").run("github", {
  action: "fix", repo: "yourorg/app",
  issue: "Cart total is wrong when coupon is applied twice"
});

// Review a PR
await oncell.agent("autoworker").run("github", {
  action: "review", repo: "yourorg/app", issue: "42"
});

// Create an issue
await oncell.agent("autoworker").run("github", {
  action: "issue", repo: "yourorg/app",
  title: "Checkout timeout on large carts",
  body: "Users report 504 when cart has >20 items..."
});
```

### Slack

```typescript
// Post a message (asks for approval first)
await oncell.agent("autoworker").run("slack", {
  action: "post", channel: "engineering",
  message: "Deploy complete. All tests passing."
});

// Summarize a channel
await oncell.agent("autoworker").run("slack", {
  action: "summarize", channel: "alerts"
});
```

### Email

```typescript
// Draft an email
await oncell.agent("autoworker").run("email", {
  action: "draft",
  to: "client@company.com",
  subject: "Project update — Week 12"
});
```

### Webhooks (auto-triggers)

Set up GitHub webhook → `https://api.oncell.ai/agents/autoworker/webhook/github`

- **New PR** → auto-reviews with detailed comments
- **New issue** → auto-triages, adds to pending queue

Set up Slack webhook → `https://api.oncell.ai/agents/autoworker/webhook/slack`

- **@AutoWorker** mention → executes the request, replies in thread

## Scheduled automations

| Schedule | What it does |
|----------|-------------|
| **Daily 8am** | Morning brief: yesterday's completed tasks, pending items, what needs attention |
| **Weekly Monday 9am** | Weekly report: completed, in progress, blocked — saved to files |

## How it's different from OpenWorker

| | OpenWorker | AutoWorker |
|---|-----------|------------|
| **Runs on** | Your desktop (Tauri app) | Cloud (oncell) — 24/7 |
| **Always on** | Only when desktop is open | Yes, runs scheduled tasks while you sleep |
| **Webhooks** | No | GitHub + Slack auto-triggers |
| **Deploy** | Install desktop app | `npx oncell deploy` |
| **State** | Local files | Durable memory + files (survives crashes) |
| **Cost when idle** | Your laptop battery | $0 (auto-pauses) |
| **Approval** | Desktop popup | Dashboard, API, or Slack |
| **Multi-model** | Manual selection | Auto-switches per skill (opus for thinking, k3 for coding) |
| **Scheduled tasks** | Yes | Yes, plus survives restarts |
| **Open source** | MIT | Apache 2.0 |

## Models

| Skill | Model | Why |
|-------|-------|-----|
| Planning & analysis | claude-opus | Deep reasoning for task breakdown |
| Writing (docs, emails) | claude-opus | Professional quality output |
| Coding | kimi-k3 | Fast, cheap code generation |
| Research | kimi-k3 | Quick information gathering |

## Cost

- **Chat / do task**: $0.50-5.00 per task
- **PR fix**: $2-5 per fix
- **Morning brief**: ~$0.50/day
- **Weekly report**: ~$1/week
- **Waiting for approval**: $0
- **Monthly estimate**: $30-100 for a typical team

## Architecture

```
                  ┌─────────────────────────────┐
                  │  AutoWorker (oncell agent)   │
                  │  Runs 24/7, $0 when idle     │
                  ├─────────────────────────────┤
                  │  Skills:                     │
                  │  • plan (claude-opus)        │
                  │  • write (claude-opus)       │
                  │  • code (kimi-k3)            │
                  │  • research (kimi-k3)        │
                  ├─────────────────────────────┤
     ┌────────────┤  Integrations:              ├────────────┐
     │            │  GitHub · Slack · Email      │            │
     │            │  Jira · Notion · Calendar    │            │
     │            └──────────┬──────────────────┘            │
     │                       │                               │
     ▼                       ▼                               ▼
  Webhooks             Scheduled tasks               Chat / API
  (auto-trigger)       (morning brief,               (on-demand
  on PR, issue,         weekly report)                tasks)
  @mention)
```

## License

Apache 2.0

## Built on

[oncell](https://oncell.ai) — the cloud where AI agents live.
