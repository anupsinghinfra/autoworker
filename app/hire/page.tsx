"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const M = "font-[family-name:var(--font-mono)]";

const ROLES = [
  { id: "engineer", name: "Engineer", icon: "⚡", desc: "Watches repos. Triages issues. Writes fixes. Opens PRs." },
  { id: "support", name: "Support Agent", icon: "🎧", desc: "Answers tickets. Searches KB. Escalates when stuck." },
  { id: "researcher", name: "Researcher", icon: "🔍", desc: "Monitors competitors. Writes weekly reports." },
  { id: "ops", name: "Ops / DevOps", icon: "🛡️", desc: "Monitors alerts. Diagnoses incidents. Deploys fixes." },
];

const PROVIDERS: Record<string, { id: string; name: string; targetsLabel: string; targetsHint: string; tokenHint: string }[]> = {
  engineer: [
    { id: "github", name: "GitHub", targetsLabel: "Repos to watch", targetsHint: "myorg/app, myorg/api", tokenHint: "ghp_... (fine-grained PAT, repo scope)" },
  ],
  support: [
    { id: "zendesk", name: "Zendesk", targetsLabel: "Views to watch", targetsHint: "New tickets, Escalations", tokenHint: "Zendesk API token" },
    { id: "slack", name: "Slack", targetsLabel: "Channels to watch", targetsHint: "#support, #help", tokenHint: "xoxb-... bot token" },
  ],
  researcher: [
    { id: "rss", name: "RSS / Web", targetsLabel: "Feeds & sites to watch", targetsHint: "https://competitor.com/blog, https://news.ycombinator.com", tokenHint: "" },
  ],
  ops: [
    { id: "cloudwatch", name: "CloudWatch", targetsLabel: "Log groups to watch", targetsHint: "/aws/lambda/api, /ecs/web", tokenHint: "AWS access key" },
    { id: "pagerduty", name: "PagerDuty", targetsLabel: "Services to watch", targetsHint: "prod-api, prod-web", tokenHint: "PagerDuty API key" },
  ],
};

const NAME_SUGGESTIONS = ["Alex", "Sam", "Jordan", "Riley", "Casey", "Morgan"];

export default function HirePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [targets, setTargets] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = role ? PROVIDERS[role] : [];
  const provider = providers.find((p) => p.id === providerId) || null;

  async function hire() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pokios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role }),
      });
      const data = await res.json();
      if (data.error && !data.pokio) throw new Error(data.error);

      if (provider && targets.trim()) {
        await fetch("/api/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pokioId: data.pokio.id,
            provider: provider.id,
            targets: targets.split(/[,\n]/).map((t) => t.trim()).filter(Boolean),
            token: token || undefined,
          }),
        });
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-8 pt-24 pb-32">
      <nav className={`fixed top-0 left-0 right-0 z-50 h-12 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-between px-6 ${M} text-xs tracking-wider`}>
        <Link href="/" className="text-emerald-500 font-semibold text-sm">pokio</Link>
        <Link href="/dashboard" className="text-white/30 hover:text-white/50">DASHBOARD</Link>
      </nav>

      {/* Progress */}
      <div className={`${M} text-xs text-white/20 tracking-wider mb-10 flex gap-3`}>
        {["ROLE", "NAME", "CONNECT"].map((label, i) => (
          <span key={label} className={i === step ? "text-emerald-500" : i < step ? "text-white/40" : ""}>
            {String(i + 1).padStart(2, "0")} {label}
          </span>
        ))}
      </div>

      {step === 0 && (
        <>
          <h1 className="text-3xl font-light mb-8">Pick a role.</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setProviderId(PROVIDERS[r.id][0].id); setStep(1); }}
                className="text-left bg-[#111] border border-white/[0.06] rounded-xl p-6 hover:border-emerald-500/40 transition-colors"
              >
                <div className="text-2xl mb-3">{r.icon}</div>
                <h3 className="font-semibold mb-1">{r.name}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{r.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="text-3xl font-light mb-8">Name your {ROLES.find((r) => r.id === role)?.name}.</h1>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(2)}
            placeholder="Alex"
            className="w-full bg-[#111] border border-white/10 rounded-lg px-5 py-4 text-lg outline-none focus:border-emerald-500/50"
          />
          <div className="flex gap-2 mt-4 flex-wrap">
            {NAME_SUGGESTIONS.map((n) => (
              <button key={n} onClick={() => setName(n)} className={`${M} text-xs border border-white/10 text-white/40 px-3 py-1.5 rounded-md hover:border-emerald-500/40`}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-10">
            <button onClick={() => setStep(0)} className={`${M} border border-white/10 text-white/35 px-6 py-3 rounded-lg text-sm tracking-wider`}>BACK</button>
            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className={`${M} bg-emerald-500 text-[#0a0a0a] px-8 py-3 rounded-lg font-bold text-sm tracking-wider disabled:opacity-30`}
            >
              CONTINUE
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-3xl font-light mb-2">Connect {name}&apos;s tools.</h1>
          <p className="text-white/40 text-sm mb-8">Optional — you can also connect later from the dashboard.</p>

          {providers.length > 1 && (
            <div className="flex gap-2 mb-6">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProviderId(p.id)}
                  className={`${M} text-xs px-4 py-2 rounded-md border tracking-wider ${providerId === p.id ? "border-emerald-500/50 text-emerald-500" : "border-white/10 text-white/40"}`}
                >
                  {p.name.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {provider && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={`${M} text-xs text-white/30 tracking-wider block mb-2`}>{provider.targetsLabel.toUpperCase()}</label>
                <textarea
                  value={targets}
                  onChange={(e) => setTargets(e.target.value)}
                  placeholder={provider.targetsHint}
                  rows={3}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>
              {provider.tokenHint && (
                <div>
                  <label className={`${M} text-xs text-white/30 tracking-wider block mb-2`}>ACCESS TOKEN</label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={provider.tokenHint}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500/50"
                  />
                  <p className="text-[11px] text-white/20 mt-2">Stored as an encrypted secret on oncell — never in Pokio&apos;s database.</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-6">{error}</p>}

          <div className="flex gap-3 mt-10">
            <button onClick={() => setStep(1)} className={`${M} border border-white/10 text-white/35 px-6 py-3 rounded-lg text-sm tracking-wider`}>BACK</button>
            <button
              onClick={hire}
              disabled={busy}
              className={`${M} bg-emerald-500 text-[#0a0a0a] px-8 py-3 rounded-lg font-bold text-sm tracking-wider disabled:opacity-50`}
            >
              {busy ? "HIRING..." : `HIRE ${name.toUpperCase() || "POKIO"}`}
            </button>
            {!targets.trim() && !busy && (
              <button onClick={hire} className={`${M} text-white/25 text-xs tracking-wider hover:text-white/40`}>
                SKIP &amp; HIRE
              </button>
            )}
          </div>
        </>
      )}
    </main>
  );
}
