"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const M = "font-[family-name:var(--font-mono)]";

interface Connection {
  id: string;
  provider: string;
  config: { targets?: string[] };
}

interface Pokio {
  id: string;
  name: string;
  role: string;
  status: string;
  oncell_agent_id: string | null;
  connections: Connection[];
}

// Approval / run shapes come from oncell — render defensively.
interface Approval {
  runId?: string;
  run_id?: string;
  id?: string;
  question?: string;
  summary?: string;
  description?: string;
  task?: string;
  agent?: string;
}

interface Run {
  id?: string;
  startedAt?: string;
  created_at?: string;
  time?: string;
  summary?: string;
  task?: string;
  status?: string;
  cost?: number;
}

const ROLE_NAMES: Record<string, string> = {
  engineer: "Engineer",
  support: "Support",
  researcher: "Researcher",
  ops: "Ops",
};

export default function Dashboard() {
  const [pokios, setPokios] = useState<Pokio[] | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [oncellOk, setOncellOk] = useState(true);
  const [activity, setActivity] = useState<Record<string, Run[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [pokioRes, approveRes] = await Promise.all([
      fetch("/api/pokios").then((r) => r.json()).catch(() => null),
      fetch("/api/approve").then((r) => r.json()).catch(() => null),
    ]);
    if (pokioRes) {
      setPokios(pokioRes.pokios || []);
      setOncellOk(pokioRes.oncellConfigured !== false);
    }
    setApprovals(Array.isArray(approveRes?.pending) ? approveRes.pending : []);
  }, []);

  useEffect(() => {
    // refresh only sets state after awaited network I/O, never synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, [refresh]);

  async function toggleActivity(id: string) {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    const res = await fetch(`/api/pokios/${id}/activity`).then((r) => r.json()).catch(() => null);
    setActivity((a) => ({ ...a, [id]: Array.isArray(res?.runs) ? res.runs : [] }));
  }

  async function resolve(approval: Approval, approved: boolean) {
    const runId = approval.runId || approval.run_id || approval.id;
    await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, approved }),
    });
    refresh();
  }

  async function setStatus(pokio: Pokio, status: "active" | "paused") {
    await fetch(`/api/pokios/${pokio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  async function fire(pokio: Pokio) {
    if (!confirm(`Fire ${pokio.name}? Their agent and connections will be removed.`)) return;
    await fetch(`/api/pokios?id=${pokio.id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-8 pt-24 pb-32">
      <nav className={`fixed top-0 left-0 right-0 z-50 h-12 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-between px-6 ${M} text-xs tracking-wider`}>
        <Link href="/" className="text-emerald-500 font-semibold text-sm">pokio</Link>
        <Link href="/hire" className="bg-emerald-500 text-[#0a0a0a] px-5 py-2 rounded-md font-bold">+ HIRE A POKIO</Link>
      </nav>

      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl font-light">Your team</h1>
        {pokios && <span className={`${M} text-xs text-white/20`}>{pokios.length} Pokio{pokios.length === 1 ? "" : "s"}</span>}
      </div>

      {!oncellOk && (
        <div className={`${M} text-xs bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-lg px-5 py-4 mb-6 leading-relaxed`}>
          ONCELL_API_KEY is not set — Pokios are saved but can&apos;t run. Get a key at oncell.ai, then <span className="text-amber-300">export ONCELL_API_KEY=...</span> and restart.
        </div>
      )}

      {/* Pending approvals */}
      {approvals.length > 0 && (
        <div className="bg-[#111] border border-amber-500/30 rounded-xl overflow-hidden mb-6">
          <div className={`${M} bg-amber-500/[0.06] px-5 py-3 border-b border-white/[0.06] text-xs text-amber-500 tracking-wider`}>
            ⏸ WAITING FOR YOUR APPROVAL
          </div>
          <div className="divide-y divide-white/[0.04]">
            {approvals.map((a, i) => (
              <div key={a.runId || a.id || i} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 text-sm text-white/60">
                  {a.question || a.summary || a.description || a.task || JSON.stringify(a).slice(0, 140)}
                  {a.agent && <span className={`${M} block text-[11px] text-white/20 mt-1`}>{a.agent}</span>}
                </div>
                <button onClick={() => resolve(a, true)} className={`${M} bg-emerald-500 text-[#0a0a0a] px-4 py-1.5 rounded text-xs font-bold`}>Approve</button>
                <button onClick={() => resolve(a, false)} className={`${M} border border-white/10 text-white/40 px-4 py-1.5 rounded text-xs`}>Deny</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team */}
      {pokios === null ? (
        <p className={`${M} text-xs text-white/20`}>Loading…</p>
      ) : pokios.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-xl py-20 text-center">
          <p className="text-white/40 mb-6">No Pokios yet. Your first hire takes about a minute.</p>
          <Link href="/hire" className={`${M} bg-emerald-500 text-[#0a0a0a] px-8 py-3.5 rounded-lg font-bold text-sm tracking-wider`}>
            HIRE YOUR FIRST POKIO
          </Link>
        </div>
      ) : (
        <div className="bg-[#111] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
          {pokios.map((p) => (
            <div key={p.id} className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === "active" ? "bg-emerald-500" : "bg-white/20"}`} />
                <span className="font-semibold">{p.name}</span>
                <span className={`${M} text-amber-500 text-xs`}>{ROLE_NAMES[p.role] || p.role}</span>
                <span className={`${M} text-[11px] text-white/20 flex-1 truncate`}>
                  {p.connections.length > 0
                    ? `Watching: ${p.connections.map((c) => c.config.targets?.join(", ") || c.provider).join(" · ")}`
                    : "Nothing connected yet"}
                </span>
                <button onClick={() => toggleActivity(p.id)} className={`${M} text-[11px] text-white/30 hover:text-white/50`}>
                  {expanded === p.id ? "HIDE" : "ACTIVITY"}
                </button>
                <button onClick={() => setStatus(p, p.status === "active" ? "paused" : "active")} className={`${M} text-[11px] text-white/30 hover:text-white/50`}>
                  {p.status === "active" ? "PAUSE" : "RESUME"}
                </button>
                <button onClick={() => fire(p)} className={`${M} text-[11px] text-white/20 hover:text-red-400`}>FIRE</button>
              </div>

              {expanded === p.id && (
                <div className={`${M} mt-4 ml-5 text-xs text-white/30 leading-7`}>
                  {!activity[p.id] ? (
                    <span className="text-white/15">Loading activity…</span>
                  ) : activity[p.id].length === 0 ? (
                    <span className="text-white/15">
                      No runs yet. {p.oncell_agent_id ? "Patrols every 10 minutes." : "Not deployed — check your oncell key."}
                    </span>
                  ) : (
                    activity[p.id].slice(0, 10).map((r, i) => (
                      <div key={r.id || i} className="truncate">
                        <span className="text-white/10">{r.startedAt || r.created_at || r.time || ""}</span>{" "}
                        {r.summary || r.task || r.status || JSON.stringify(r).slice(0, 120)}
                        {r.cost != null && <span className="text-emerald-500"> · ${Number(r.cost).toFixed(2)}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
