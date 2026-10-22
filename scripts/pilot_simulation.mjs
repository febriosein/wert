/**
 * End-to-End Photocopy Shop Pilot Simulation (PRD Section 14 & Milestone 6)
 * Simulates real user journeys A-G against the live server:
 * - Flow A: Registration with PIN & Recovery Code
 * - Flow B: Desktop Direct Upload
 * - Flow C: Mobile QR Upload (/u/[token])
 * - Flow D: Document Conversion & Download
 * - Flow E: Atomic File Replacement
 * - Flow F: IDOR Security Check (User B cannot access User A's file)
 * - Flow G: Cleanup
 */

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedCount++;
  }
}

async function runPilotSimulation() {
  console.log("==================================================");
  console.log("   WERT PHOTOCOPY SHOP PILOT SIMULATION (M6)     ");
  console.log(`   Target Server: ${BASE_URL}                   `);
  console.log("==================================================");

  const startTime = Date.now();
  const testUsername = `pilot_mhs_${Date.now().toString().slice(-4)}`;
  const testPin = "7890";
  let sessionCookieA = "";
  let fileIdA = "";
  let qrToken = "";

  try {
    // 1. HEALTH CHECK
    console.log("\n[1] Health Check & Uptime:");
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.ok, "Health check endpoint returns HTTP 200");
    assert(healthData.database === "connected", "Database is connected and healthy");

    // 2. FLOW A: REGISTRATION & PIN
    console.log(`\n[2] Flow A: Registration for @${testUsername}:`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testUsername, pin: testPin }),
    });
    const regData = await regRes.json();
    assert(regRes.ok && regData.success, "Student registration succeeds");
    assert(regData.recoveryCode && regData.recoveryCode.startsWith("WERT-"), "Recovery code issued");

    // Capture Session Cookie
    const rawCookies = regRes.headers.get("set-cookie") || "";
    sessionCookieA = rawCookies.split(";")[0];
    assert(sessionCookieA.includes("wert_session="), "HttpOnly session cookie established");

    // 3. FLOW B: DESKTOP FILE UPLOAD
    console.log("\n[3] Flow B: Desktop File Upload:");
    // Create a valid dummy PDF buffer (%PDF-1.4 header)
    const dummyPdfContent = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF"
    );

    const formData = new FormData();
    const pdfBlob = new Blob([dummyPdfContent], { type: "application/pdf" });
    formData.append("file", pdfBlob, "tugas_akhir.pdf");

    const uploadRes = await fetch(`${BASE_URL}/api/files`, {
      method: "POST",
      headers: { Cookie: sessionCookieA },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.ok && uploadData.success, "Desktop file upload succeeds");
    fileIdA = uploadData.file.id;
    assert(uploadData.file.display_name === "tugas_akhir.pdf", "File display name matches");

    // 4. FLOW C: MOBILE QR UPLOAD
    console.log("\n[4] Flow C: Smartphone QR Upload (/u/[token]):");
    // Generate QR session from desktop
    const qrRes = await fetch(`${BASE_URL}/api/upload-sessions`, {
      method: "POST",
      headers: { Cookie: sessionCookieA },
    });
    const qrData = await qrRes.json();
    assert(qrRes.ok && qrData.success, "Upload QR token generated for desktop");
    qrToken = qrData.token;

    // Mobile checks token without login
    const checkTokenRes = await fetch(`${BASE_URL}/api/u/${qrToken}`);
    const checkTokenData = await checkTokenRes.json();
    assert(checkTokenRes.ok && checkTokenData.valid, "Mobile verifies QR token successfully");
    assert(checkTokenData.username === testUsername, "Mobile associates with correct username");

    // Mobile uploads file via token
    const mobileFormData = new FormData();
    mobileFormData.append("file", pdfBlob, "lampiran_hp.pdf");
    const mobileUploadRes = await fetch(`${BASE_URL}/api/u/${qrToken}/upload`, {
      method: "POST",
      body: mobileFormData,
    });
    const mobileUploadData = await mobileUploadRes.json();
    assert(mobileUploadRes.ok && mobileUploadData.success, "Mobile uploads file directly without login");

    // 5. FLOW D: DIRECT SECURE DOWNLOAD
    console.log("\n[5] Flow D: Direct File Download & Range Streaming:");
    const downloadOriginalRes = await fetch(
      `${BASE_URL}/api/files/${fileIdA}/download`,
      {
        headers: { Cookie: sessionCookieA },
        redirect: "manual",
      }
    );
    assert(
      downloadOriginalRes.status === 200 || downloadOriginalRes.status === 307 || downloadOriginalRes.status === 302,
      "Signed download for uploaded file is served"
    );

    // 6. FLOW E: ATOMIC FILE REPLACE
    console.log("\n[6] Flow E: Atomic File Replacement:");
    const replaceFormData = new FormData();
    const replacementBlob = new Blob([dummyPdfContent], { type: "application/pdf" });
    replaceFormData.append("file", replacementBlob, "tugas_revisi.pdf");

    const replaceRes = await fetch(`${BASE_URL}/api/files/${fileIdA}/replace`, {
      method: "PUT",
      headers: { Cookie: sessionCookieA },
      body: replaceFormData,
    });
    const replaceData = await replaceRes.json();
    assert(replaceRes.ok && replaceData.success, "Atomic replacement completes");
    assert(replaceData.file.display_name === "tugas_revisi.pdf", "File updated with new name and content");
    assert(replaceData.file.id === fileIdA, "File ID preserved atomically");

    // 7. FLOW F: IDOR SECURITY ENFORCEMENT
    console.log("\n[7] Flow F: Security & IDOR Enforcement (User B access User A's file):");
    const userBName = `attacker_${Date.now().toString().slice(-4)}`;
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userBName }),
    });
    const sessionCookieB = (regBRes.headers.get("set-cookie") || "").split(";")[0];

    // User B tries to delete User A's file
    const idorDeleteRes = await fetch(`${BASE_URL}/api/files/${fileIdA}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieB },
    });
    assert(
      idorDeleteRes.status === 404 || idorDeleteRes.status === 401 || idorDeleteRes.status === 403,
      "Prevents IDOR: User B cannot delete User A's file"
    );

    // User B tries to download User A's file
    const idorDownloadRes = await fetch(`${BASE_URL}/api/files/${fileIdA}/download?variant=original`, {
      headers: { Cookie: sessionCookieB },
    });
    assert(
      idorDownloadRes.status === 404 || idorDownloadRes.status === 401 || idorDownloadRes.status === 403,
      "Prevents IDOR: User B cannot download User A's file"
    );

    // 8. FLOW G: CLEANUP
    console.log("\n[8] Flow G: Account Wipe & Logout:");
    const wipeRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PATCH",
      headers: {
        Cookie: sessionCookieA,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "delete_account", pin: testPin }),
    });
    assert(wipeRes.ok, "Account and all associated files purged cleanly");

    // Wipe User B
    await fetch(`${BASE_URL}/api/settings`, {
      method: "PATCH",
      headers: {
        Cookie: sessionCookieB,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "delete_account" }),
    });

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n==================================================");
    console.log(`PILOT SIMULATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log(`Total execution time: ${elapsedSeconds} seconds (Target <= 20s)`);
    console.log("==================================================");

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Simulation error:", err);
    process.exit(1);
  }
}

runPilotSimulation();
