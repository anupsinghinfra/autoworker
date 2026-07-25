import { NextRequest, NextResponse } from "next/server";
import { createPokio, listPokios, deletePokio, updatePokio, getOrCreateOrg } from "../../../lib/db";
import { deployPokio } from "../../../lib/oncell";
import { getTemplate } from "../../../templates";

// GET /api/pokios — list all pokios for an org
export async function GET(req: NextRequest) {
  const orgId = req.headers.get("x-org-id") || "default";
  const pokios = listPokios(orgId);
  return NextResponse.json({ pokios });
}

// POST /api/pokios — hire a new pokio
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, role, level, orgName, connections } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "name and role required" }, { status: 400 });
  }

  // Get or create org
  const orgId = getOrCreateOrg(orgName || "default");

  // Create pokio record
  const pokio = createPokio(orgId, name, role, level || "senior");

  // Get template for this role
  const template = await getTemplate(role);

  // Deploy as oncell agent
  try {
    const deployed = await deployPokio(name, {
      instructions: template.instructions,
      model: template.model,
      skills: template.skills,
      tools: template.tools,
    });

    updatePokio(pokio.id, { oncell_agent_id: deployed.agentName });

    return NextResponse.json({
      pokio: { ...pokio, oncell_agent_id: deployed.agentName },
      deployed: true,
    });
  } catch (e: any) {
    return NextResponse.json({
      pokio,
      deployed: false,
      error: e.message,
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
