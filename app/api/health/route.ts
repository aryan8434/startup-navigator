import { NextResponse, type NextRequest } from "next/server";
import { checkAllProviders } from "@/lib/providers";

/**
 * Live provider diagnostics.
 *
 * Sends a real completion to each configured provider rather than just checking
 * that a key is present — a valid key pointed at a retired model still fails,
 * which is exactly the failure this app shipped with.
 */
export async function GET(request: NextRequest) {
  // Reading the URL keeps this handler request-scoped so it is never prerendered.
  const verbose = request.nextUrl.searchParams.get("verbose") === "1";

  const providers = await checkAllProviders();

  const configured = providers.filter((p) => p.configured);
  const healthy = providers.filter((p) => p.reachable);

  return NextResponse.json(
    {
      status: healthy.length > 0 ? "ok" : configured.length > 0 ? "degraded" : "unconfigured",
      checkedAt: new Date().toISOString(),
      summary: {
        configured: configured.length,
        healthy: healthy.length,
        consensusAvailable: healthy.length >= 2,
      },
      providers: providers.map((p) => ({
        provider: p.provider,
        configured: p.configured,
        reachable: p.reachable,
        workingModel: p.workingModel,
        latencyMs: p.latencyMs,
        error: p.error,
        modelCount: p.availableModels.length,
        ...(verbose ? { availableModels: p.availableModels } : {}),
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
