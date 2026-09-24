import { isZaloMiniAppRuntime } from "./platform";

export function getBasePath() {
  const urlParams = new URLSearchParams(window.location.search);
  const appEnv = urlParams.get("env");

  if (window.BASE_PATH) {
    return window.BASE_PATH;
  }

  if (isZaloMiniAppRuntime() && window.APP_ID && appEnv) {
    return `/zapps/${window.APP_ID}`;
  }

  return "";
}
