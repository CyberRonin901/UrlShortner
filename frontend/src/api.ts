export type ErrorResponse = {
  status: number;
  error: string;
  message: string;
};

export type ResponseUrl = {
  shortUrl: string;
  fullUrl: string;
  createdAt: string;
  expiresAt: string;
  requestCount: number;
};

function getBackendBaseUrl(): string {
  const base = import.meta.env.VITE_BACKEND_BASE_URL as string | undefined;
  return (base || "").replace(/\/$/, "");
}

function isDev(): boolean {
  return import.meta.env.DEV;
}

function toUrl(path: string): string {
  // In dev, Vite proxy can forward both /api and /{id} requests,
  // so relative URLs work (and avoids CORS).
  if (isDev()) return path;

  const backendBase = getBackendBaseUrl();
  if (!backendBase) return path; // fallback; may fail if no proxy/CORS
  return `${backendBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function parseErrorBody(resp: Response): Promise<unknown> {
  const text = await resp.text();
  // Some endpoints (wildcard) return plain text, others return JSON.
  try {
    return JSON.parse(text);
  } catch {
    return text || null;
  }
}

export async function shortenUrl(payload: { url: string; alias?: string | null }) {
  const res = await fetch(toUrl("/api/v1/shortenUrl"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: payload.url,
      // Only send alias when present; backend can handle null too.
      alias: payload.alias ?? null,
    }),
  });

  if (!res.ok) throw await parseErrorBody(res);
  return res.json() as Promise<{ url: string }>;
}

export async function getShortUrlData(payload: { url_id: string; alias?: string | null }) {
  const res = await fetch(toUrl("/api/v1/data"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url_id: payload.url_id,
      alias: payload.alias ?? null,
    }),
  });

  if (!res.ok) throw await parseErrorBody(res);
  return res.json() as Promise<ResponseUrl>;
}

export async function deleteShortUrl(payload: { url_id: string; alias?: string | null }) {
  const path =
    payload.alias && payload.alias.trim().length > 0
      ? `/${encodeURIComponent(payload.url_id)}/${encodeURIComponent(payload.alias.trim())}`
      : `/${encodeURIComponent(payload.url_id)}`;

  const res = await fetch(toUrl(path), {
    method: "DELETE",
  });

  if (!res.ok) throw await parseErrorBody(res);
  return { ok: true as const };
}

export type RedirectResult =
  | { kind: "location"; status: number; location: string }
  | { kind: "unknown"; status: number; body: unknown };

export async function resolveRedirect(payload: { url_id: string; alias?: string | null }): Promise<RedirectResult> {
  const path =
    payload.alias && payload.alias.trim().length > 0
      ? `/${encodeURIComponent(payload.url_id)}/${encodeURIComponent(payload.alias.trim())}`
      : `/${encodeURIComponent(payload.url_id)}`;

  const res = await fetch(toUrl(path), {
    method: "GET",
    redirect: "manual",
  });

  const location = res.headers.get("Location");
  if (location) return { kind: "location", status: res.status, location };
  return { kind: "unknown", status: res.status, body: await parseErrorBody(res) };
}

export async function fetchTotalRequestCount(): Promise<number> {
  const res = await fetch(toUrl("/api/v1/stats/totalRequestCount"));
  if (!res.ok) throw await parseErrorBody(res);
  const data = (await res.json()) as { totalRequestCount: number };
  return data.totalRequestCount;
}

export async function fetchRedirectCount(): Promise<number> {
  const res = await fetch(toUrl("/api/v1/stats/redirectCount"));
  if (!res.ok) throw await parseErrorBody(res);
  const data = (await res.json()) as { redirectCount: number };
  return data.redirectCount;
}

