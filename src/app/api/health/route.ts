import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    const gotenbergUrl = (process.env.GOTENBERG_URL || "http://localhost:3001").replace(/\/$/, "");
    const res = await fetch(`${gotenbergUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    gotenbergStatus = res.ok;
  } catch {
    gotenbergStatus = false;
  }

  const responseTimeMs = Date.now() - startTime;
  const isCloudConverter = Boolean(process.env.CONVERTAPI_SECRET || process.env.CLOUDCONVERT_API_KEY);
  const converterReady = isCloudConverter || gotenbergStatus;

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    gotenbergOnline: gotenbergStatus,
    converterReady,
    activeEngine: process.env.CONVERTAPI_SECRET
      ? "ConvertAPI (Cloud MS Office)"
      : process.env.CLOUDCONVERT_API_KEY
      ? "CloudConvert (Cloud API)"
      : gotenbergStatus
      ? "Gotenberg (LibreOffice Container)"
      : "None/Local",
    responseTimeMs,
    timestamp: new Date().toISOString(),
  });
}
