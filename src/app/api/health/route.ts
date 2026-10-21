import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { documentConverter } from "@/lib/converter/provider";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let gotenbergStatus = false;

  try {
    const { error } = await supabaseAdmin.from("users").select("id").limit(1);
    dbStatus = error ? `error: ${error.message}` : "connected";
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  try {
    gotenbergStatus = await documentConverter.checkHealth();
  } catch {
    gotenbergStatus = false;
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    gotenbergOnline: gotenbergStatus,
    responseTimeMs,
    timestamp: new Date().toISOString(),
  });
}
