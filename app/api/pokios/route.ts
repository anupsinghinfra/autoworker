import { NextRequest, NextResponse } from "next/server";
import { createPokio, listPokios, deletePokio, listConnections, getOrCreateOrg } from "../../../lib/db";
import { oncellConfigured } from "../../../lib/oncell";
import { redeployPokio } from "../../../lib/deploy";

// GET /api/pokios — list all pokios for an org (x-org-id header is the org name)
export async function GET(req: NextRequest) {
  const orgId = getOrCreateOrg(req.headers.get("x-org-id") || "default");
  const pokios = listPokios(orgId).map((p) => ({
    ...p,
    connections: listConnections(p.id),
  }));
  return NextResponse.json({ pokios, oncellConfigured: oncellConfigured() });
}

// POST /api/pokios — hire a new pokio
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, role, level, orgName } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "name and role required" }, { status: 400 });
  }

  const orgId = getOrCreateOrg(orgName || "default");
  const pokio = createPokio(orgId, name, role, level || "senior");

  try {
    const agentName = await redeployPokio(pokio);
    return NextResponse.json({
      pokio: { ...pokio, oncell_agent_id: agentName },
      deployed: true,
    });
  } catch (e) {
    return NextResponse.json({
      pokio,
      deployed: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

// DELETE /api/pokios?id=xxx — fire a pokio
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deletePokio(id);
  return NextResponse.json({ deleted: true });
}
