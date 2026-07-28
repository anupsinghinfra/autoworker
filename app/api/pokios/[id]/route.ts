import { NextRequest, NextResponse } from "next/server";
import { getPokio, updatePokio, listConnections } from "../../../../lib/db";

// GET /api/pokios/[id] — one pokio with its connections
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/pokios/[id]">) {
  const { id } = await ctx.params;
  const pokio = getPokio(id);
  if (!pokio) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ pokio: { ...pokio, connections: listConnections(id) } });
}

// PATCH /api/pokios/[id] — pause / resume
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/pokios/[id]">) {
  const { id } = await ctx.params;
  const pokio = getPokio(id);
  if (!pokio) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { status } = await req.json();
  if (status !== "active" && status !== "paused") {
    return NextResponse.json({ error: "status must be 'active' or 'paused'" }, { status: 400 });
  }

  updatePokio(id, { status });
  return NextResponse.json({ pokio: getPokio(id) });
}
