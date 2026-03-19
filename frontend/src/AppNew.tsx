import React, { useEffect, useMemo, useState } from "react";
import { deleteShortUrl, fetchRedirectCount, getShortUrlData, shortenUrl } from "./api";
import type { ResponseUrl } from "./api";

type Theme = "dark" | "light";

type UiStatus =
  | { kind: "idle" }
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string };

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function errorToText(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.error === "string") return anyErr.error;
    if (typeof anyErr.toString === "function") return anyErr.toString();
  }
  return prettyJson(err);
}

function formatDateTime(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString();
}

function parseShortUrl(input: string): { urlId: string; alias: string | null } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Accept both full URL and path-only inputs.
  let pathname = trimmed;
  try {
    pathname = new URL(trimmed).pathname;
  } catch {
    // keep pathname as-is
  }

  // If a base path exists (e.g. `http://host:5000/base`), remove it first.
  // Then extract `{id}` / `{id}/{alias}` from the end segments.
  const backendBase = (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) || "";
  let basePath = "";
  try {
    basePath = new URL(backendBase).pathname;
  } catch {
    basePath = "";
  }
  basePath = basePath.replace(/\/+$/, "");
  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length);
  }

  pathname = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  pathname = pathname.replace(/\/+$/, "");
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length < 1) return null;

  // Interpret from the end:
  // - /{id} => id is the last segment
  // - /{id}/{alias} => id is the second last, alias is the last
  if (parts.length === 1) {
    return { urlId: decodeURIComponent(parts[0]), alias: null };
  }

  return {
    urlId: decodeURIComponent(parts[parts.length - 2]),
    alias: decodeURIComponent(parts[parts.length - 1]),
  };
}

export default function AppNew() {
  const [theme, setTheme] = useState<Theme>("dark");

  const [redirectCount, setRedirectCount] = useState<number | null>(null);
  const [statsStatus, setStatsStatus] = useState<UiStatus>({ kind: "idle" });

  // Shorten
  const [fullUrl, setFullUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [shortenStatus, setShortenStatus] = useState<UiStatus>({ kind: "idle" });
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [shortenCopyStatus, setShortenCopyStatus] = useState<UiStatus>({ kind: "idle" });

  // Metadata
  const [metaShortUrlInput, setMetaShortUrlInput] = useState("");
  const [metaStatus, setMetaStatus] = useState<UiStatus>({ kind: "idle" });
  const [metaResult, setMetaResult] = useState<ResponseUrl | null>(null);

  // Delete
  const [deleteShortUrlInput, setDeleteShortUrlInput] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<UiStatus>({ kind: "idle" });
  const [deleteOk, setDeleteOk] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setStatsStatus({ kind: "idle" });
      try {
        const count = await fetchRedirectCount();
        if (cancelled) return;
        setRedirectCount(count);
        setStatsStatus({ kind: "ok", message: "Stats loaded." });
      } catch (e) {
        if (cancelled) return;
        setStatsStatus({ kind: "err", message: errorToText(e) || "Failed to load stats." });
      }
    }

    // Stats update only on refresh/page load.
    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const canShorten = useMemo(() => fullUrl.trim().length > 0, [fullUrl]);

  async function onShorten() {
    setShortenStatus({ kind: "idle" });
    setShortenCopyStatus({ kind: "idle" });
    setShortUrl(null);

    try {
      const res = await shortenUrl({
        url: fullUrl.trim(),
        alias: alias.trim() ? alias.trim() : null,
      });
      setShortUrl(res.url);
      setShortenStatus({ kind: "ok", message: "Short URL created." });
    } catch (e) {
      setShortenStatus({ kind: "err", message: errorToText(e) || "Request failed." });
    }
  }

  async function onCopyShortUrl() {
    if (!shortUrl) return;
    setShortenCopyStatus({ kind: "idle" });
    try {
      await navigator.clipboard.writeText(shortUrl);
      setShortenCopyStatus({ kind: "ok", message: "Copied to clipboard." });
    } catch (e) {
      setShortenCopyStatus({ kind: "err", message: errorToText(e) || "Copy failed." });
    }
  }

  function onOpenRedirect() {
    if (!shortUrl) return;
    window.open(shortUrl, "_blank", "noopener,noreferrer");
  }

  async function onGetMetadata() {
    setMetaStatus({ kind: "idle" });
    setMetaResult(null);

    const parsed = parseShortUrl(metaShortUrlInput);
    if (!parsed) {
      setMetaStatus({ kind: "err", message: "Please paste a valid full short URL (ending with /{id} or /{id}/{alias})." });
      return;
    }

    try {
      const res = await getShortUrlData({
        url_id: parsed.urlId,
        alias: parsed.alias,
      });
      setMetaResult(res);
      setMetaStatus({ kind: "ok", message: "Metadata loaded." });
    } catch (e) {
      setMetaStatus({ kind: "err", message: errorToText(e) || "Request failed." });
    }
  }

  async function onDelete() {
    setDeleteStatus({ kind: "idle" });
    setDeleteOk(null);

    const parsed = parseShortUrl(deleteShortUrlInput);
    if (!parsed) {
      setDeleteStatus({ kind: "err", message: "Please paste a valid full short URL (ending with /{id} or /{id}/{alias})." });
      return;
    }

    try {
      await deleteShortUrl({
        url_id: parsed.urlId,
        alias: parsed.alias,
      });
      setDeleteOk(true);
      setDeleteStatus({ kind: "ok", message: "Delete completed." });
    } catch (e) {
      setDeleteOk(false);
      setDeleteStatus({ kind: "err", message: errorToText(e) || "Request failed." });
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>URL Shortner</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="badge" title="Total redirects since server start (tracked by AOP in memory)">
            Total redirects:{" "}
            <span style={{ fontFamily: "monospace" }}>
              {redirectCount === null ? "..." : redirectCount}
            </span>
          </div>

          <button className="themeToggle" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
      </div>

      {statsStatus.kind !== "idle" && statsStatus.kind === "err" && (
        <div className="status err">{statsStatus.message}</div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Shorten URL</h2>

        <label>Full URL (required)</label>
        <input value={fullUrl} onChange={(e) => setFullUrl(e.target.value)} placeholder="https://example.com/..." />

        <label>Alias (optional)</label>
        <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="my-alias" />

        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" disabled={!canShorten} onClick={onShorten}>
            Shorten
          </button>
        </div>

        {shortenStatus.kind !== "idle" && (
          <div className={`status ${shortenStatus.kind === "ok" ? "ok" : "err"}`}>{shortenStatus.message}</div>
        )}

        {shortUrl && (
          <>
            <label style={{ marginTop: 14 }}>Short URL</label>
            <input value={shortUrl} readOnly />

            <div className="row" style={{ marginTop: 12 }}>
              <button className="primary" onClick={onCopyShortUrl}>
                Copy URL
              </button>
              <button onClick={onOpenRedirect}>Open Redirect</button>
            </div>

            {shortenCopyStatus.kind !== "idle" && (
              <div className={`status ${shortenCopyStatus.kind === "ok" ? "ok" : "err"}`}>{shortenCopyStatus.message}</div>
            )}
          </>
        )}
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card">
          <h2>Get Short URL Metadata</h2>

          <label>Full short URL (required)</label>
          <input
            value={metaShortUrlInput}
            onChange={(e) => setMetaShortUrlInput(e.target.value)}
            placeholder="http://localhost:5000/{id} or http://localhost:5000/{id}/{alias}"
          />

          <div className="row" style={{ marginTop: 12 }}>
            <button className="primary" disabled={!metaShortUrlInput.trim()} onClick={onGetMetadata}>
              Fetch Metadata
            </button>
          </div>

          {metaStatus.kind !== "idle" && (
            <div className={`status ${metaStatus.kind === "ok" ? "ok" : "err"}`}>{metaStatus.message}</div>
          )}

          {metaResult && (
            <div>
              <div className="kv">
                <div className="k">Short URL</div>
                <div className="v" style={{ fontFamily: "monospace", wordBreak: "break-word" }}>{metaResult.shortUrl}</div>
              </div>
              <div className="kv">
                <div className="k">Full URL</div>
                <div className="v" style={{ wordBreak: "break-word" }}>{metaResult.fullUrl}</div>
              </div>
              <div className="kv">
                <div className="k">Created At</div>
                <div className="v">{formatDateTime(metaResult.createdAt)}</div>
              </div>
              <div className="kv">
                <div className="k">Expires At</div>
                <div className="v">{formatDateTime(metaResult.expiresAt)}</div>
              </div>
              <div className="kv">
                <div className="k">Request Count</div>
                <div className="v" style={{ fontFamily: "monospace" }}>{metaResult.requestCount}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Delete Short URL</h2>

          <label>Full short URL (required)</label>
          <input
            value={deleteShortUrlInput}
            onChange={(e) => setDeleteShortUrlInput(e.target.value)}
            placeholder="http://localhost:5000/{id} or http://localhost:5000/{id}/{alias}"
          />

          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="danger"
              disabled={!deleteShortUrlInput.trim()}
              onClick={onDelete}
            >
              Delete
            </button>
          </div>

          {deleteStatus.kind !== "idle" && (
            <div className={`status ${deleteStatus.kind === "ok" ? "ok" : "err"}`}>{deleteStatus.message}</div>
          )}

          {deleteOk === true && (
            <div className="status ok" style={{ marginTop: 12 }}>
              Deleted successfully.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

