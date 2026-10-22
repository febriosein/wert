import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";

  try {
    const { error } = await supabaseAdmin.from("users").select("id").limit(1);
    dbStatus = error ? `error: ${error.message}` : "connected";
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    responseTimeMs,
    timestamp: new Date().toISOString(),
  });
}
