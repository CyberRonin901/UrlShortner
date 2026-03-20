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
    <div className="app-container">
      <div className="background-gradient"></div>
      
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">ShortUrl</h1>
          <div className="header-stats">
            <div className="redirect-counter">
              <span className="counter-label">Total Redirects:</span>
              <span className="counter-value">
                {redirectCount === null ? "..." : redirectCount.toLocaleString()}
              </span>
            </div>
            <button className="theme-toggle-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="hero-section">
          <div className="url-shortener-card">
            <h2 className="card-title">Shorten URL</h2>
            
            <div className="horizontal-input-group">
              <div className="input-row">
                <div className="input-wrapper">
                  <label className="input-label">Full URL (required)</label>
                  <input 
                    className="url-input" 
                    value={fullUrl} 
                    onChange={(e) => setFullUrl(e.target.value)} 
                    placeholder="https://example.com/..." 
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Alias (optional)</label>
                  <input 
                    className="url-input" 
                    value={alias} 
                    onChange={(e) => setAlias(e.target.value)} 
                    placeholder="my-alias" 
                  />
                </div>
                <div className="button-wrapper">
                  <label className="input-label">&nbsp;</label>
                  <button className="shorten-btn" disabled={!canShorten} onClick={onShorten}>
                    Shorten
                  </button>
                </div>
              </div>
            </div>

            {shortenStatus.kind !== "idle" && (
              <div className={`status-message ${shortenStatus.kind === "ok" ? "success" : "error"}`}>
                {shortenStatus.message}
              </div>
            )}

            {shortUrl && (
              <div className="result-section">
                <div className="horizontal-result-group">
                  <div className="result-input-wrapper">
                    <label className="input-label">Short URL</label>
                    <div className="result-input-container">
                      <input className="url-input result-input" value={shortUrl} readOnly />
                    </div>
                  </div>
                  <div className="result-buttons-wrapper">
                    <label className="input-label">&nbsp;</label>
                    <div className="result-buttons">
                      <button className="copy-btn" onClick={onCopyShortUrl}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                        </svg>
                        Copy
                      </button>
                      <button className="open-btn" onClick={onOpenRedirect}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"/>
                        </svg>
                        Open
                      </button>
                    </div>
                  </div>
                </div>

                {shortenCopyStatus.kind !== "idle" && (
                  <div className={`status-message ${shortenCopyStatus.kind === "ok" ? "success" : "error"}`}>
                    {shortenCopyStatus.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h3 className="feature-title">Get Short URL Metadata</h3>
            
            <div className="input-group">
              <label className="input-label">Full short URL (required)</label>
              <input
                className="url-input"
                value={metaShortUrlInput}
                onChange={(e) => setMetaShortUrlInput(e.target.value)}
                placeholder="http://localhost:5000/{id} or http://localhost:5000/{id}/{alias}"
              />
            </div>

            <div className="action-buttons">
              <button className="fetch-btn" disabled={!metaShortUrlInput.trim()} onClick={onGetMetadata}>
                Fetch Metadata
              </button>
            </div>

            {metaStatus.kind !== "idle" && (
              <div className={`status-message ${metaStatus.kind === "ok" ? "success" : "error"}`}>
                {metaStatus.message}
              </div>
            )}

            {metaResult && (
              <div className="metadata-display">
                <div className="metadata-item">
                  <span className="metadata-key">Short URL:</span>
                  <span className="metadata-value">{metaResult.shortUrl}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-key">Full URL:</span>
                  <span className="metadata-value">{metaResult.fullUrl}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-key">Created At:</span>
                  <span className="metadata-value">{formatDateTime(metaResult.createdAt)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-key">Expires At:</span>
                  <span className="metadata-value">{formatDateTime(metaResult.expiresAt)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-key">Request Count:</span>
                  <span className="metadata-value">{metaResult.requestCount}</span>
                </div>
              </div>
            )}
          </div>

          <div className="feature-card">
            <h3 className="feature-title">Delete Short URL</h3>
            
            <div className="warning-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
              </svg>
              <span>Warning: All shared URLs will become permanently inaccessible and cannot be recovered.</span>
            </div>
            
            <div className="input-group">
              <label className="input-label">Full short URL (required)</label>
              <input
                className="url-input"
                value={deleteShortUrlInput}
                onChange={(e) => setDeleteShortUrlInput(e.target.value)}
                placeholder="http://localhost:5000/{id} or http://localhost:5000/{id}/{alias}"
              />
            </div>

            <div className="action-buttons">
              <button
                className="delete-btn"
                disabled={!deleteShortUrlInput.trim()}
                onClick={onDelete}
              >
                Delete
              </button>
            </div>

            {deleteStatus.kind !== "idle" && (
              <div className={`status-message ${deleteStatus.kind === "ok" ? "success" : "error"}`}>
                {deleteStatus.message}
              </div>
            )}

            {deleteOk === true && (
              <div className="status-message success">
                Deleted successfully.
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3 className="footer-title">ShortUrl</h3>
          </div>
          <div className="footer-links">
            <a 
              href="https://github.com/CyberRonin901/UrlShortner" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="github-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

