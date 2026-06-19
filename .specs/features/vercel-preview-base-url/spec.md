# Vercel Preview Base URL

**Status:** Implemented
**Created:** 2026-06-19
**Scope:** Medium

## Summary

Support Vercel Preview deployment URLs without manually configuring `NEXT_PUBLIC_URL` for every preview, while preserving stable local and production absolute URLs for auth and email flows.

## Context

The application currently uses `NEXT_PUBLIC_URL` as the single base URL for Better Auth and absolute email links. Vercel Preview deployments receive unique deployment domains, so a fixed Preview environment value can point auth redirects and email URLs at the wrong deployment.

Vercel exposes `VERCEL_URL` at build and runtime when system environment variables are enabled. Better Auth 1.6 supports a dynamic `baseURL` object with `allowedHosts`, `protocol`, and `fallback`, intended for multi-domain deployments such as previews and branch environments.

## Requirements

### VPBU-001: Resolve server-side app base URL

Create a server-side helper that resolves the app base URL from:

- Explicit `NEXT_PUBLIC_URL`
- `https://${VERCEL_URL}` when Vercel provides a deployment URL
- `http://localhost:3000` as local fallback

The helper must normalize the result to an origin without path or trailing slash.

### VPBU-002: Support Better Auth preview URLs

Configure Better Auth so preview deployments can resolve their request-specific base URL instead of relying on a single static URL.

### VPBU-003: Restrict accepted auth hosts

Better Auth must allow only the configured app host, local development hosts, and Vercel deployment hosts.

### VPBU-004: Use resolved base URL for email links

Invitation and password reset links must use the server-side resolved base URL.

### VPBU-005: Document Vercel Preview env behavior

Document that `NEXT_PUBLIC_URL` should not be manually fixed for Vercel Preview deployments, and that Vercel system environment variables should provide preview-specific URLs.

### VPBU-006: Test URL resolution

Add focused unit tests for explicit URL, Vercel Preview URL, and local fallback resolution.

## Non-Goals

- No OAuth provider redirect URI configuration changes.
- No new public client-side URL API.
- No Vercel dashboard automation.

## Acceptance Criteria

- Preview deployments can use `VERCEL_URL` without a manual `NEXT_PUBLIC_URL`.
- Production can still use an explicit canonical `NEXT_PUBLIC_URL`.
- Local development still falls back to `http://localhost:3000`.
- Email link builders use the resolved base URL.
- Better Auth uses dynamic base URL allowlisting.
- `pnpm test:unit` passes.
- `pnpm build` passes.
