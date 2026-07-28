import { NextRequest, NextResponse } from "next/server";
import { createConnection, deleteConnection, getConnection, getPokio, listConnections } from "../../../lib/db";
import { setSecrets } from "../../../lib/oncell";
import { redeployPokio } from "../../../lib/deploy";

// GET /api/connections?pokioId=xxx — list a pokio's connections
export async function GET(req: NextRequest) {
  const pokioId = req.nextUrl.searchParams.get("pokioId");
  if (!pokioId) return NextResponse.json({ error: "pokioId required" }, { status: 400 });
  return NextResponse.json({ connections: listConnections(pokioId) });
}

// POST /api/connections — connect a provider to a pokio
// Body: { pokioId, provider, targets: string[], token? }
// The token goes straight to oncell secrets — it is never stored in Pokio's DB.
export async function POST(req: NextRequest) {
  const { pokioId, provider, targets, token } = await req.json();

  if (!pokioId || !provider) {
    return NextResponse.json({ error: "pokioId and provider required" }, { status: 400 });
  }
  const pokio = getPokio(pokioId);
  if (!pokio) return NextResponse.json({ error: "pokio not found" }, { status: 404 });

  const connection = createConnection(pokioId, provider, {
    targets: Array.isArray(targets) ? targets.filter(Boolean) : [],
  });

  try {
    if (token) {
      await setSecrets({ [`${provider.toUpperCase()}_TOKEN`]: token });
    }
    await redeployPokio(pokio);
    return NextResponse.json({ connection, deployed: true });
  } catch (e) {
    return NextResponse.json({ connection, deployed: false, error: e instanceof Error ? e.message : String(e) });
  }
}

// DELETE /api/connections?id=xxx — disconnect and redeploy
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const connection = getConnection(id);
  if (!connection) return NextResponse.json({ error: "not found" }, { status: 404 });

  deleteConnection(id);

  const pokio = getPokio(connection.pokio_id);
  if (pokio) {
    try {
      await redeployPokio(pokio);
    } catch {
      // pokio record updated either way; next redeploy picks up the change
    }
  }
  return NextResponse.json({ deleted: true });
}
