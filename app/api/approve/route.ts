import { NextRequest, NextResponse } from "next/server";
import { getApprovals, resolveApproval } from "../../../lib/oncell";

// GET /api/approve — list pending approvals
export async function GET() {
  const result = await getApprovals();
  return NextResponse.json(result);
}

// POST /api/approve — approve or deny
export async function POST(req: NextRequest) {
  const { runId, approved, reason } = await req.json();

  if (!runId) {
    return NextResponse.json({ error: "runId required" }, { status: 400 });
  }

  const result = await resolveApproval(runId, approved ?? true, reason);
  return NextResponse.json(result);
}
