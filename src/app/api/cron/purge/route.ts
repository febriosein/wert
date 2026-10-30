import { NextRequest, NextResponse } from "next/server";
import { runFullMaintenancePurge } from "@/lib/storage/purge";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // In development if secret not set

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const urlSecret = req.nextUrl.searchParams.get("secret");
  if (urlSecret === cronSecret) return true;

  return false;
}

async function handlePurge(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runFullMaintenancePurge();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menjalankan purge" }, { status: 500 });
  }
}

/**
 * Vercel Cron invokes endpoints using HTTP GET.
 */
export async function GET(req: NextRequest) {
  return handlePurge(req);
}

/**
 * Support manual POST invocation as well.
 */
export async function POST(req: NextRequest) {
  return handlePurge(req);
}
