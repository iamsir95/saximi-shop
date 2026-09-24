const ZALO_ENV_VALUES = new Set(["TESTING_LOCAL", "TESTING", "DEVELOPMENT"]);

export type RuntimePlatform = "zalo-mini-app" | "website";

export function getRuntimePlatform(): RuntimePlatform {
  if (typeof window === "undefined") return "website";

  const env = new URLSearchParams(window.location.search).get("env");
  const hasZaloBridge = Boolean(window.ZJSBridge);
  const hasZaloBasePath = Boolean(window.BASE_PATH?.includes("/zapps/"));

  return hasZaloBridge || hasZaloBasePath || Boolean(env && ZALO_ENV_VALUES.has(env))
    ? "zalo-mini-app"
    : "website";
}

export function isZaloMiniAppRuntime() {
  return getRuntimePlatform() === "zalo-mini-app";
}

export function isWebsiteRuntime() {
  return getRuntimePlatform() === "website";
}

export function getPublicAppUrl(path = "/") {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export function buildReferralLink(referrerId: string, path = "/") {
  const url = new URL(getPublicAppUrl(path));
  url.searchParams.set("ref", referrerId);
  return url.toString();
}
