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

## Run locally

Pokio is fully open source. Run it yourself with just an oncell API key:

```bash
git clone https://github.com/anupsinghinfra/pokio.ai
cd pokio.ai
npm install

export ONCELL_API_KEY=oncell_sk_...   # get at oncell.ai
npm run dev
```

Everything runs on [oncell](https://oncell.ai) — compute, state, LLM, durability. One key, everything works.

---

## FAQ

**How is this different from Devin / OpenWorker / Cursor?**
Those are coding assistants you prompt. Pokio works autonomously 24/7 — you don't assign work, it finds work by watching your repos and logs. You just approve.

**Is my code safe?**
Pokio runs in isolated gVisor sandboxes on oncell. It never pushes to main — always opens PRs for your review.

**What LLMs does it support?**
Kimi K3 (default), Claude, OpenAI — configured through oncell. Bring your own key or use oncell's built-in LLM gateway.

**What if I don't approve?**
Pokio waits. Costs $0 while waiting. No timeout.

---

## License

MIT

**[pokio.ai](https://pokio.ai)** — Hire AI employees that work 24/7.
