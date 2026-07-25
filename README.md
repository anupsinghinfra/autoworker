# AutoWorker

**Your AI employee. Runs locally or on [chay.ai](https://chay.ai).**

Give it a task in plain English. It uses tools (shell, GitHub, Slack, files) to deliver finished work — PRs, docs, tickets, reports. Not chat. Results.

Like [OpenWorker](https://github.com/andrewyng/openworker), but no desktop app. Just a CLI and an HTTP server.

```bash
npx autoworker "Fix the checkout bug in myorg/app and open a PR"
```

## Install

```bash
npm install -g autoworker
# or
npx autoworker
```

## Set your LLM key

```bash
# Pick one (Kimi K3 is the default, fast and cheap)
export MOONSHOT_API_KEY=sk-...       # Kimi K3
export ANTHROPIC_API_KEY=sk-ant-...  # Claude
export OPENAI_API_KEY=sk-...         # OpenAI

# For GitHub operations
export GITHUB_TOKEN=ghp_...
```

## Use it

### Run a task

```bash
autoworker "Summarize the last 20 commits in myorg/app"
```

### Fix a GitHub issue

```bash
autoworker fix --repo myorg/app --issue "Cart total wrong when coupon applied twice"
```

It clones the repo, reads the code, writes a fix, runs tests, and opens a PR. Asks for your approval before creating the PR.

### Review a PR

```bash
autoworker review --repo myorg/app --pr 42
```

### Interactive mode

```bash
autoworker chat
→ Read the README in myorg/api and write API docs
→ Find all TODO comments in src/ and create GitHub issues for each
→ Draft an email to the team about the v2 migration plan
```

### Run as a server

```bash
autoworker serve

# Then call it via HTTP
curl -X POST http://localhost:4747/do \
  -H "Content-Type: application/json" \
  -d '{"task": "Fix the login timeout bug in myorg/app"}'

curl -X POST http://localhost:4747/github \
  -H "Content-Type: application/json" \
  -d '{"action": "review", "repo": "myorg/app", "issue": "42"}'
```

## Managed hosting

Don't want to run it yourself? Deploy on [chay.ai](https://chay.ai) — runs 24/7, $0 when idle.

```bash
# Coming soon
npx autoworker deploy --host chay.ai
```

## How it works

```
You: "Fix the checkout bug in myorg/app"
  │
  ▼
AutoWorker calls LLM with tools (shell, read_file, write_file, ask_human)
  │
  ├─ shell: gh repo clone myorg/app workspace
  ├─ read_file: workspace/src/checkout.ts
  ├─ LLM thinks about the bug...
  ├─ write_file: workspace/src/checkout.ts (fixed)
  ├─ shell: cd workspace && npm test
  ├─ shell: cd workspace && git add -A && git commit -m "fix: ..."
  ├─ shell: cd workspace && git push origin HEAD
  ├─ ask_human: "Open PR for checkout fix?" → you approve
  ├─ shell: cd workspace && gh pr create --title "fix: ..."
  │
  ▼
Done. PR opened. You review and merge.
```

**Key:** it asks for approval (`ask_human`) before anything consequential.

## Models

| Model | Provider | Set with | Best for |
|-------|----------|----------|----------|
| `kimi-k3` | Moonshot | `MOONSHOT_API_KEY` | Default. Fast coding. |
| `claude-sonnet` | Anthropic | `ANTHROPIC_API_KEY` | Balanced |
| `claude-opus` | Anthropic | `ANTHROPIC_API_KEY` | Complex reasoning |
| `gpt-4o` | OpenAI | `OPENAI_API_KEY` | Alternative |

Switch models:

```bash
AUTOWORKER_MODEL=claude-opus autoworker "Design the new auth system"
```

## What it can do

| Task | What happens |
|------|-------------|
| `"Fix the checkout bug"` | Clones, reads, fixes, tests, opens PR |
| `"Review PR #42"` | Reads diff, posts detailed review |
| `"Write API docs from the codebase"` | Reads code, generates docs, writes files |
| `"Create issues for all TODOs in src/"` | Finds TODOs, creates GitHub issues |
| `"Summarize #engineering Slack"` | Reads channel, posts summary |
| `"Draft email about the delay"` | Writes email draft to a file |

## Data

All data stored locally in `.autoworker/autoworker.db` (SQLite). No cloud, no telemetry, no accounts. Delete the folder to reset.

## API (programmatic use)

```typescript
import { runWorker } from "autoworker";

const result = await runWorker("Fix the login bug in myorg/app", {
  model: "kimi-k3",
  maxSteps: 30,
  onStep: (step, action) => console.log(`${step}: ${action}`),
  onAskHuman: async (question) => "approved",
});

console.log(result.text);
```

## License

Apache 2.0

---

**[chay.ai](https://chay.ai)** — managed AutoWorker. Always on, $0 when idle.
