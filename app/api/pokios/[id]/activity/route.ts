import { NextRequest, NextResponse } from "next/server";
import { getPokio } from "../../../../../lib/db";
import { getActivity } from "../../../../../lib/oncell";

// GET /api/pokios/[id]/activity — recent runs from oncell
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/pokios/[id]/activity">) {
  const { id } = await ctx.params;
  const pokio = getPokio(id);
  if (!pokio) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const activity = await getActivity(pokio.name);
    return NextResponse.json({ runs: activity.runs || [] });
  } catch (e) {
    return NextResponse.json({ runs: [], error: e instanceof Error ? e.message : String(e) });
  }
}
