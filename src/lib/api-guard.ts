import { NextRequest, NextResponse } from "next/server";

/**
 * Phase 0 protection for the unauthenticated OpenAI routes.
 *
 * These routes spend real money on Anthony's personal key and sit behind a
 * public URL. This is a same-origin gate plus a payload cap: it stops casual
 * cross-site and scripted abuse. It is NOT a real per-IP rate limiter.
 *
 * TODO (next pass): add a proper rate limit — Vercel Firewall rule on /api/*,
 * or Upstash sliding-window keyed by IP — for hard abuse protection.
 */

// ~1.8MB of base64 ≈ a high-detail phone photo; rejects oversized payloads.
export const MAX_IMAGE_BYTES = 1_800_000;

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

/**
 * Allow only same-origin browser requests. A legitimate PWA fetch sends an
 * Origin (on POST) and/or a Referer whose host matches the app's own host.
 * Returns a 403 response to short-circuit, or null to proceed.
 */
export function sameOriginGuard(request: NextRequest): NextResponse | null {
  const allowed = new Set<string>();
  const host = request.headers.get("host");
  if (host) allowed.add(host);
  const envHost = hostOf(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  if (envHost) allowed.add(envHost);

  const originHost = hostOf(request.headers.get("origin"));
  const refererHost = hostOf(request.headers.get("referer"));

  if (originHost && allowed.has(originHost)) return null;
  if (refererHost && allowed.has(refererHost)) return null;

  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
}
