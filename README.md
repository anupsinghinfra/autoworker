# Pokio

**AI employee that works 24/7. Watches your repos and logs, finds issues, fixes them, opens PRs. You just approve.**

```bash
pokio watch --github myorg/app --github myorg/api
```

That's it. It runs forever. Checks your repos every 10 minutes. When it finds a new issue, it reads the code, writes a fix, runs tests, and opens a PR. It asks you before merging. You approve from your terminal, or ignore and it waits.

Like [OpenWorker](https://github.com/andrewyng/openworker), but no desktop app. Runs anywhere — your server, a VM, or [pokio.ai](https://pokio.ai).

## Install

```bash
npm install -g pokio
```

## Setup

```bash
# Pick your LLM (Kimi K3 is default — fast and cheap)
export MOONSHOT_API_KEY=sk-...       # or ANTHROPIC_API_KEY or OPENAI_API_KEY

# GitHub access
export GITHUB_TOKEN=ghp_...
```

## Run 24/7

```bash
# Watch one repo
pokio watch --github myorg/app

# Watch multiple repos
pokio watch --github myorg/app --github myorg/api --github myorg/web

# Watch repos + production logs
pokio watch --github myorg/app --logs "docker logs myapp --since 1h"

# Custom check interval (default: 10 min)
pokio watch --github myorg/app --interval 5
```

### What it does automatically

| Source | What it watches | What it does |
|--------|----------------|-------------|
| **GitHub issues** | New issues opened | Reads code, attempts fix, opens PR |
| **GitHub PRs** | New PRs opened | Posts detailed code review |
| **Logs** | Errors in output | Diagnoses root cause, fixes if possible |

### Approval flow

Pokio **never** pushes to main or merges without asking:

```
[watcher] New issue: myorg/app#47 — "Checkout fails with > 10 items"
  [issue:47] step 1: shell(gh repo clone myorg/app workspace)
  [issue:47] step 2: read_file(workspace/src/checkout.ts)
  [issue:47] step 3: write_file(workspace/src/checkout.ts)
  [issue:47] step 4: shell(cd workspace && npm test)
  [issue:47] step 5: shell(cd workspace && git add -A && git commit ...)

  ⏸ Open PR to fix checkout overflow? [y/n]: y

  [issue:47] step 6: shell(cd workspace && gh pr create ...)
  ✓ PR #48 opened
```

You can also run it non-interactively (auto-approves):

```bash
pokio watch --github myorg/app &  # background, auto-approves
```

## One-shot mode

Don't want 24/7? Just run one task:

```bash
pokio "Fix the login timeout bug in myorg/app"
pokio fix --repo myorg/app --issue "Cart total wrong"
pokio review --repo myorg/app --pr 42
```

## Interactive mode

```bash
pokio chat
→ Summarize the last 20 commits in myorg/app
→ Find all TODO comments and create GitHub issues
→ Write API docs from the codebase
```

## HTTP server

```bash
pokio serve  # → http://localhost:4747

curl -X POST http://localhost:4747/do \
  -d '{"task": "Fix the login bug in myorg/app"}'

curl -X POST http://localhost:4747/github \
  -d '{"action": "fix", "repo": "myorg/app", "issue": "Cart bug"}'
```

## Managed hosting

Run on [pokio.ai](https://pokio.ai) — always on, $0 when idle, no server to manage.

```bash
pokio deploy --host pokio.ai  # coming soon
```

## How it works

```
pokio watch --github myorg/app
        │
        │  every 10 min
        ▼
┌─────────────────────────┐
│  Check for new issues   │ ← gh issue list
│  Check for new PRs      │ ← gh pr list
│  Check logs for errors  │ ← your log command
└────────┬────────────────┘
         │ found something new
         ▼
┌─────────────────────────┐
│  LLM + tools loop       │
│  • shell (git, gh, npm) │
│  • read_file / write    │
│  • ask_human            │
└────────┬────────────────┘
         │ asks for approval
         ▼
┌─────────────────────────┐
│  Human approves (y/n)   │
│  or auto-approves       │
└────────┬────────────────┘
         │
         ▼
    PR opened / review posted / issue commented
```

## Models

```bash
# Default (fast, cheap)
pokio watch --github myorg/app

# Use Claude for complex reasoning
POKIO_MODEL=claude-opus pokio watch --github myorg/app

# Use per-task
pokio "Design the new auth system"  # uses default
POKIO_MODEL=claude-opus pokio "Design the new auth system"  # uses opus
```

## Data

All local. SQLite in `.pokio/`. No cloud, no telemetry. Delete the folder to reset.

```
.pokio/
└── pokio.db    # tasks, steps, seen items, config
```

## Programmatic API

```typescript
import { runWorker, startWatchers } from "pokio";

// One-shot
const result = await runWorker("Fix the bug", {
  onAskHuman: async (q) => "approved",
});

// 24/7 autonomous
await startWatchers(
  { github: { repos: ["myorg/app"], watch: ["issues", "prs"] } },
  async (question) => "approved",
);
```

## License

Apache 2.0

---

**[pokio.ai](https://pokio.ai)** — managed Pokio. Always on, $0 when idle.
