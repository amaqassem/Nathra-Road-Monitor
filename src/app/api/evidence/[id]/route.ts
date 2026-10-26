import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/incidents";

// تسجيل وصول لدليل (Chain of Custody)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { actor, action } = body as { actor: string; action: "view" | "download" | "verify" };

    const evidence = await db.incidentEvidence.findUnique({ where: { id } });
    if (!evidence) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const logs = evidence.accessLogs ? JSON.parse(evidence.accessLogs) : [];
    logs.push({ actor, action, at: new Date().toISOString() });

    const updated = await db.incidentEvidence.update({
      where: { id },
      data: { accessLogs: JSON.stringify(logs) },
    });

    await logAudit({
      incidentId: evidence.incidentId,
      action: `evidence_${action}`,
      actor,
      details: JSON.stringify({ evidenceId: id, fileName: evidence.fileName, hash: evidence.fileHash.substring(0, 16) }),
    });

    return NextResponse.json({ success: true, accessLogs: logs, hash: updated.fileHash });
  } catch (error) {
    console.error("Evidence PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
