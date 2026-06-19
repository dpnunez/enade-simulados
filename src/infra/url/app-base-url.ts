const LOCAL_APP_BASE_URL = "http://localhost:3000";

function normalizeBaseUrl(url: string) {
  return new URL(url).origin;
}

function getOptionalEnvUrl(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) return null;

  return normalizeBaseUrl(trimmedValue);
}

export function getAppBaseUrl() {
  return (
    getOptionalEnvUrl(process.env.NEXT_PUBLIC_URL) ??
    getOptionalEnvUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ) ??
    LOCAL_APP_BASE_URL
  );
}

export function getAppBaseUrlHost() {
  return new URL(getAppBaseUrl()).host;
}
