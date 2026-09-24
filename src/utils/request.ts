import { getConfig } from "./template";

const CONFIG_API_URL = getConfig((config) => config.template.apiUrl);
const ENV_API_URL = (import.meta as any).env?.VITE_API_URL;

function getConfiguredApiUrl() {
  return (ENV_API_URL || CONFIG_API_URL || "http://localhost:5001").replace(/\/$/, "");
}

export function getApiBaseUrl() {
  return getConfiguredApiUrl();
}

const mockUrls = import.meta.glob<{ default: string }>("../mock/*.json", {
  query: "url",
  eager: true,
});

export async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const mockUrl = mockUrls[`../mock${path}.json`]?.default;
  const apiUrl = getConfiguredApiUrl();
  const url = apiUrl ? `${apiUrl}${path}` : mockUrl;

  if (!apiUrl) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!url) {
    throw new Error(`No API or mock data configured for ${path}`);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as T;
}

export async function requestWithFallback<T>(
  path: string,
  fallbackValue: T
): Promise<T> {
  try {
    return await request<T>(path);
  } catch (error) {
    console.warn(
      "An error occurred while fetching data. Falling back to default value!"
    );
    console.warn({ path, error, fallbackValue });
    return fallbackValue;
  }
}

export async function requestWithPost<P, T>(
  path: string,
  payload: P
): Promise<T> {
  return await request<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
