const M = "font-[family-name:var(--font-mono)]";

export default function Home() {
  return (
    <main>
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-12 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-between px-6 ${M} text-xs tracking-wider`}>
        <span className="text-emerald-500 font-semibold text-sm">pokio</span>
        <div className="flex items-center gap-4">
          <a href="#how" className="text-white/30 hover:text-white/50 hidden sm:block">HOW IT WORKS</a>
          <a href="#pricing" className="text-white/30 hover:text-white/50 hidden sm:block">PRICING</a>
          <a href="https://github.com/anupsinghinfra/pokio.ai" className="text-white/30 hover:text-white/50">GITHUB</a>
          <a href="#signup" className="bg-emerald-500 text-[#0a0a0a] px-5 py-2 rounded-md font-bold">HIRE A POKIO</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center pt-12 px-8 text-center">
        <div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.1] mb-6">
            Hire AI employees<br />that <span className="text-emerald-500">work 24/7.</span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
            Engineers, support agents, researchers. They watch your repos, fix bugs, answer tickets, write reports. You just approve.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="#signup" className={`${M} bg-emerald-500 text-[#0a0a0a] px-8 py-3.5 rounded-lg font-bold text-sm tracking-wider`}>HIRE YOUR FIRST POKIO</a>
            <a href="#how" className={`${M} border border-white/10 text-white/35 px-8 py-3.5 rounded-lg text-sm tracking-wider hover:border-white/20`}>SEE HOW IT WORKS</a>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-4xl mx-auto px-8 pb-32">
        <p className={`${M} text-xs text-emerald-500 tracking-[0.12em] mb-4`}>ROLES</p>
        <h2 className="text-3xl font-light mb-10">Hire for any role. They start immediately.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { role: "Engineer", desc: "Watches repos. Triages issues. Writes fixes. Runs tests. Opens PRs. Reviews code.", watches: "GitHub repos, error logs" },
            { role: "Support Agent", desc: "Answers customer tickets. Searches knowledge base. Escalates when stuck. Follows up.", watches: "Zendesk, Intercom, Slack" },
            { role: "Researcher", desc: "Monitors competitors. Reads industry news. Writes weekly reports. Spots opportunities.", watches: "RSS feeds, web, news" },
            { role: "Ops / DevOps", desc: "Monitors alerts. Diagnoses incidents. Writes runbooks. Deploys fixes.", watches: "CloudWatch, PagerDuty, logs" },
          ].map((r) => (
            <div key={r.role} className="bg-[#111] border border-white/[0.06] rounded-xl p-7 hover:border-emerald-500/30 transition-colors">
              <h3 className="text-lg font-semibold mb-2">{r.role}</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-4">{r.desc}</p>
              <p className={`${M} text-[11px] text-white/15`}>Watches: {r.watches}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="max-w-4xl mx-auto px-8 pb-32">
        <p className={`${M} text-xs text-emerald-500 tracking-[0.12em] mb-4`}>DASHBOARD</p>
        <h2 className="text-3xl font-light mb-10">Your AI team at a glance.</h2>
        <div className={`bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden ${M} text-sm`}>
          <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-emerald-500 font-semibold">Your Team</span>
            <span className="text-white/20">3 Pokios &middot; $5.70 today</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[
              { name: "Alex", role: "Engineer", status: "green", action: "Fixed #47, opened PR #48", cost: "$4.20" },
              { name: "Sam", role: "Support", status: "amber", action: "\u23F8 \"Refund $200 for order #123?\"", approval: true, cost: "$1.50" },
              { name: "Jordan", role: "Researcher", status: "green", action: "Weekly report generated", cost: "$0.00" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-3 px-5 py-4">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === "green" ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="font-semibold w-20">{p.name}</span>
                <span className="text-amber-500 w-24">{p.role}</span>
                <span className="text-white/25 flex-1 text-xs">
                  {p.action}
                  {p.approval && <button className="ml-2 bg-emerald-500 text-[#0a0a0a] px-3 py-0.5 rounded text-[11px] font-bold">Approve</button>}
                </span>
                <span className="text-emerald-500 text-xs">{p.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-4xl mx-auto px-8 pb-32">
        <p className={`${M} text-xs text-emerald-500 tracking-[0.12em] mb-4`}>HOW IT WORKS</p>
        <h2 className="text-3xl font-light mb-10">Three clicks. Your AI employee starts working.</h2>
        <div className="flex flex-col gap-6 max-w-lg">
          {[
            ["01", "Pick a role.", "Engineer, support, researcher, or ops. Each comes with the right skills and tools."],
            ["02", "Connect your tools.", "GitHub, Slack, Zendesk \u2014 one-click OAuth. Your Pokio gets access."],
            ["03", "Choose what to watch.", "Pick repos, channels, log groups. Your Pokio starts monitoring immediately."],
            ["04", "Approve when asked.", "Pokio asks before anything consequential. Approve from the dashboard or Slack."],
          ].map(([num, title, desc]) => (
            <div key={num} className="flex gap-4">
              <span className={`${M} text-emerald-500 font-bold text-sm w-7 flex-shrink-0`}>{num}</span>
              <div className="text-[15px]">
                <span className="font-medium">{title}</span>{" "}
                <span className="text-white/40">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Overnight */}
      <section className="max-w-4xl mx-auto px-8 pb-32">
        <p className={`${M} text-xs text-emerald-500 tracking-[0.12em] mb-4`}>WHILE YOU SLEEP</p>
        <h2 className="text-3xl font-light mb-10">You wake up to this.</h2>
        <div className={`bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden max-w-xl ${M} text-sm`}>
          <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
            <span className="text-emerald-500 font-semibold">Alex</span>
            <span className="text-white/20">&middot; Engineer &middot; overnight</span>
          </div>
          <div className="px-5 py-4 text-white/30 leading-[2.2] text-xs">
            <div><span className="text-white/10">2:14 AM</span> &nbsp; New issue #51: &quot;Timeout on /api/search&quot;</div>
            <div><span className="text-white/10">2:15 AM</span> &nbsp; Cloned repo, reading src/search.ts</div>
            <div><span className="text-white/10">2:18 AM</span> &nbsp; Root cause: missing pagination, full table scan</div>
            <div><span className="text-white/10">2:22 AM</span> &nbsp; Fixed. Added test. All 47 tests passing.</div>
            <div><span className="text-white/10">2:23 AM</span> &nbsp; Opened PR #52 <span className="text-emerald-500">&middot; awaiting approval</span></div>
            <div><span className="text-white/10">2:23 AM</span> &nbsp; Idle. $0/hr.</div>
            <div className="mt-4">
              <button className="bg-emerald-500 text-[#0a0a0a] px-5 py-2 rounded-md text-xs font-bold">Approve &amp; merge PR #52</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-8 pb-32">
        <p className={`${M} text-xs text-emerald-500 tracking-[0.12em] mb-4`}>PRICING</p>
        <h2 className="text-3xl font-light mb-10">Pay only when they work. $0 when idle.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { plan: "Starter", price: "$0", unit: "1 Pokio, 100 actions/mo", features: ["1 AI employee", "GitHub + Slack", "Dashboard", "$0 when idle"], featured: false },
            { plan: "Team", price: "$49", unit: "5 Pokios, 2k actions/mo", features: ["5 AI employees", "All integrations", "Priority support", "Approve via Slack"], featured: true },
            { plan: "Company", price: "$199", unit: "Unlimited Pokios", features: ["Unlimited employees", "SSO / audit log", "Custom roles", "Dedicated support"], featured: false },
          ].map((p) => (
            <div key={p.plan} className={`bg-[#111] border rounded-xl p-7 text-center ${p.featured ? "border-emerald-500/30" : "border-white/[0.06]"}`}>
              <h3 className="text-base font-semibold mb-2">{p.plan}</h3>
              <div className="text-3xl font-light text-emerald-500 mb-1">{p.price}<span className="text-base">/mo</span></div>
              <div className="text-xs text-white/30 mb-5">{p.unit}</div>
              <div className="text-sm text-white/30 text-left leading-8">
                {p.features.map((f) => <div key={f}>&#10003; {f}</div>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="signup" className="text-center py-20 px-8">
        <h2 className="text-4xl md:text-5xl font-light mb-4">Hire your first AI employee.</h2>
        <p className="text-white/30 mb-8">Free to start. No credit card.</p>
        <a href="/hire" className={`${M} bg-emerald-500 text-[#0a0a0a] px-10 py-4 rounded-lg text-base font-bold tracking-wider`}>GET STARTED FREE</a>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] max-w-4xl mx-auto px-8 py-10">
        <div className={`flex items-center gap-3 ${M} text-xs text-white/15`}>
          <span className="text-emerald-500 font-semibold">pokio</span>
          <span>&copy; 2026</span>
          <span className="text-white/[0.06]">|</span>
          <a href="https://github.com/anupsinghinfra/pokio.ai" className="hover:text-white/30">GitHub</a>
          <a href="https://oncell.ai" className="hover:text-white/30">Powered by oncell</a>
        </div>
      </footer>
    </main>
  );
}
