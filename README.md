# Pokio

**Hire AI employees that work 24/7.**

Pokio creates AI workers — engineers, support agents, researchers — that autonomously watch your repos, fix bugs, answer tickets, and write reports. They ask before anything consequential. You approve from the dashboard.

**[pokio.ai](https://pokio.ai)** — sign up, hire your first Pokio, connect GitHub. Done.

---

## What Pokio does

You don't assign work. Pokio finds it.

| You hire | Pokio watches | Pokio does | You approve |
|----------|--------------|------------|-------------|
| **Engineer** | GitHub repos, error logs | Triages issues, writes fixes, runs tests, opens PRs | Merge PR |
| **Support** | Zendesk, Slack channels | Answers tickets, searches KB, escalates hard cases | Send reply |
| **Researcher** | Competitor sites, news | Writes weekly reports, spots market changes | Publish report |
| **Ops** | CloudWatch, PagerDuty | Diagnoses alerts, writes fixes, pages humans for P0 | Deploy fix |

---

## How it works

```
1. Sign up at pokio.ai
2. Click "Hire a Pokio"
3. Pick role: Engineer
4. Connect GitHub (one-click OAuth)
5. Select repos to watch
6. Pokio starts working. Checks every 10 minutes.
```

### What happens overnight

```
2:14 AM  New issue #51: "Timeout on /api/search"
2:15 AM  Cloned repo, reading src/search.ts
2:18 AM  Root cause: missing pagination, full table scan
2:22 AM  Fixed. Added test. All 47 tests passing.
2:23 AM  Opened PR #52 → waiting for your approval
2:23 AM  Idle. $0.

  ☀️ You wake up. Open pokio.ai.
  One click: "Approve & merge PR #52"
  Done.
```

---

## Your team dashboard

```
┌──────────────────────────────────────────────────┐
│  pokio.ai                          $5.70 today   │
├──────────────────────────────────────────────────┤
│                                                  │
│  🟢 Alex · Engineer                              │
│     Watching: myorg/app, myorg/api               │
│     Today: Fixed #47, opened PR #48, reviewed #49│
│     Cost: $4.20                                  │
│                                                  │
│  🟡 Sam · Support                                │
│     Watching: #support, Zendesk                  │
│     ⏸ "Refund $200 for order #123?"              │
│     [Approve] [Deny]                             │
│                                                  │
│  🟢 Jordan · Researcher                          │
│     Watching: competitor blogs                   │
│     Last: Weekly report generated                │
│     Cost: $0.00 (idle)                           │
│                                                  │
│  [+ Hire another Pokio]                          │
└──────────────────────────────────────────────────┘
```

---

## Pricing

| Plan | Pokios | Price | Best for |
|------|--------|-------|----------|
| **Starter** | 1 | Free | Try it out |
| **Team** | 5 | $49/mo | Small teams |
| **Company** | Unlimited | $199/mo | Scaling orgs |

Pokios only cost when working. **$0 when idle.** Typical engineer Pokio: ~$3-5/day.

---

## Open source

Pokio is fully open source (Apache 2.0). You can self-host it or use [pokio.ai](https://pokio.ai) for managed hosting.

### Self-host

```bash
git clone https://github.com/anupsinghinfra/pokio.ai
cd pokio.ai
npm install

# Set your LLM key
export MOONSHOT_API_KEY=sk-...   # or ANTHROPIC_API_KEY

# Set GitHub access
export GITHUB_TOKEN=ghp_...

# Run
npm run dev
```

### Architecture

```
pokio.ai (managed)              self-hosted
    │                               │
    ▼                               ▼
┌──────────┐                 ┌──────────┐
│ pokio.ai │                 │ your     │
│ dashboard│                 │ server   │
└────┬─────┘                 └────┬─────┘
     │                            │
     ▼                            ▼
┌──────────┐                 ┌──────────┐
│  oncell  │                 │  pokio   │
│  cloud   │                 │  runtime │
└──────────┘                 └──────────┘
     │                            │
     ▼                            ▼
  Watchers → LLM → Tools → Ask human → Act
```

### Tech stack

- **Runtime:** Node.js + TypeScript
- **LLM:** Multi-provider (Kimi K3, Claude, OpenAI — bring your own key)
- **State:** Local SQLite (self-hosted) or oncell (managed)
- **Tools:** Shell, GitHub (gh CLI), file read/write, human approval

---

## FAQ

**How is this different from Devin / OpenWorker / Cursor?**
Those are coding assistants you prompt. Pokio works autonomously 24/7 — you don't assign work, it finds work by watching your repos and logs. You just approve.

**Is my code safe?**
Pokio runs in isolated sandboxes. It never pushes to main — always opens PRs for your review. Self-host if you need full control.

**What LLMs does it support?**
Kimi K3 (default, fast & cheap), Claude (Anthropic), OpenAI, or any OpenAI-compatible provider. Bring your own API key.

**What if I don't approve?**
Pokio waits. Costs $0 while waiting. No timeout. It'll wait until you approve or deny.

---

## License

Apache 2.0

**[pokio.ai](https://pokio.ai)** — Hire AI employees that work 24/7.
