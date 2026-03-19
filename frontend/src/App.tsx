import React, { useEffect, useMemo, useState } from "react";
import {
  deleteShortUrl,
  fetchRedirectCount,
  fetchTotalRequestCount,
  getShortUrlData,
  resolveRedirect,
  shortenUrl,
} from "./api";
import type { RedirectResult, ResponseUrl } from "./api";

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

type UiStatus =
  | { kind: "idle" }
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string };

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stats, setStats] = useState<{ totalRequestCount: number | null; redirectCount: number | null }>({
    totalRequestCount: null,
    redirectCount: null,
  });
  const [statsStatus, setStatsStatus] = useState<UiStatus>({ kind: "idle" });

  // Input validation states
  const [urlError, setUrlError] = useState<string>("");
  const [aliasError, setAliasError] = useState<string>("");

  // Shorten URL
  const [fullUrl, setFullUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [shortenStatus, setShortenStatus] = useState<UiStatus>({ kind: "idle" });
  const [shortenResult, setShortenResult] = useState<{ url: string } | null>(null);
  const [isShortening, setIsShortening] = useState(false);

  // Get short URL data
  const [urlId, setUrlId] = useState("");
  const [dataAlias, setDataAlias] = useState("");
  const [dataStatus, setDataStatus] = useState<UiStatus>({ kind: "idle" });
  const [dataResult, setDataResult] = useState<ResponseUrl | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Redirect resolve
  const [redirectAlias, setRedirectAlias] = useState("");
  const [redirectStatus, setRedirectStatus] = useState<UiStatus>({ kind: "idle" });
  const [redirectResult, setRedirectResult] = useState<RedirectResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Delete
  const [deleteAlias, setDeleteAlias] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<UiStatus>({ kind: "idle" });
  const [deleteResult, setDeleteResult] = useState<{ ok: true } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme);

    async function loadStats() {
      setStatsStatus({ kind: "idle" });
      try {
        const [total, redirect] = await Promise.all([fetchTotalRequestCount(), fetchRedirectCount()]);
        if (cancelled) return;
        setStats({ totalRequestCount: total, redirectCount: redirect });
        setStatsStatus({ kind: "ok", message: `Stats loaded.` });
      } catch (e) {
        if (cancelled) return;
        setStatsStatus({ kind: "err", message: e ? String(e) : "Failed to load stats." });
      }
    }

    // Update stats only when the user opens/refreshes the page.
    loadStats();

    return () => {
      cancelled = true;
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const canShorten = useMemo(() => {
    const trimmedUrl = fullUrl.trim();
    let error = "";
    
    if (!trimmedUrl) {
      error = "URL is required";
    } else if (!trimmedUrl.match(/^https?:\/\/.+/)) {
      error = "Please enter a valid URL starting with http:// or https://";
    }
    
    setUrlError(error);
    return error === "";
  }, [fullUrl]);
  
  const canGetData = useMemo(() => urlId.trim().length > 0, [urlId]);
  const canRedirect = useMemo(() => urlId.trim().length > 0, [urlId]);
  const canDelete = useMemo(() => urlId.trim().length > 0, [urlId]);

  async function onShorten() {
    if (!canShorten) return;
    
    setShortenStatus({ kind: "idle" });
    setShortenResult(null);
    setIsShortening(true);

    try {
      const res = await shortenUrl({
        url: fullUrl.trim(),
        alias: alias.trim() ? alias.trim() : null,
      });
      setShortenResult(res);
      setShortenStatus({ kind: "ok", message: "Short URL created successfully!" });
    } catch (e) {
      const errorMsg = e ? String(e) : "Request failed.";
      const userFriendlyMsg = errorMsg.includes("400") ? 
        "Invalid input. Please check your URL and alias." : errorMsg;
      setShortenStatus({ kind: "err", message: userFriendlyMsg });
    } finally {
      setIsShortening(false);
    }
  }

  async function onGetData() {
    if (!canGetData) return;
    
    setDataStatus({ kind: "idle" });
    setDataResult(null);
    setIsFetchingData(true);

    try {
      const res = await getShortUrlData({
        url_id: urlId.trim(),
        alias: dataAlias.trim() ? dataAlias.trim() : null,
      });
      setDataResult(res);
      setDataStatus({ kind: "ok", message: "Metadata fetched successfully!" });
    } catch (e) {
      const errorMsg = e ? String(e) : "Request failed.";
      const userFriendlyMsg = errorMsg.includes("404") ? 
        "URL not found. Please check the ID and alias." : 
        errorMsg.includes("410") ? "URL has expired." :
        errorMsg.includes("400") ? "Invalid input. Please check your ID and alias." : errorMsg;
      setDataStatus({ kind: "err", message: userFriendlyMsg });
    } finally {
      setIsFetchingData(false);
    }
  }

  async function onResolveRedirect() {
    if (!canRedirect) return;
    
    setRedirectStatus({ kind: "idle" });
    setRedirectResult(null);
    setIsResolving(true);

    try {
      const res = await resolveRedirect({
        url_id: urlId.trim(),
        alias: redirectAlias.trim() ? redirectAlias.trim() : null,
      });
      setRedirectResult(res);
      setRedirectStatus({ kind: "ok", message: "Redirect resolved successfully!" });
    } catch (e) {
      const errorMsg = e ? String(e) : "Request failed.";
      const userFriendlyMsg = errorMsg.includes("404") ? 
        "URL not found. Please check the ID and alias." : 
        errorMsg.includes("410") ? "URL has expired." :
        errorMsg.includes("400") ? "Invalid input. Please check your ID and alias." : errorMsg;
      setRedirectStatus({ kind: "err", message: userFriendlyMsg });
    } finally {
      setIsResolving(false);
    }
  }

  function openRedirectInBrowser() {
    const path =
      redirectAlias.trim().length > 0
        ? `/${encodeURIComponent(urlId.trim())}/${encodeURIComponent(redirectAlias.trim())}`
        : `/${encodeURIComponent(urlId.trim())}`;

    // Let the browser follow the server redirect.
    const backendBase = import.meta.env.DEV ? "" : ((import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) || "").replace(/\/$/, "");
    window.location.href = `${backendBase}${path}`;
  }

  async function onDelete() {
    if (!canDelete) return;
    
    setDeleteStatus({ kind: "idle" });
    setDeleteResult(null);
    setIsDeleting(true);

    try {
      const res = await deleteShortUrl({
        url_id: urlId.trim(),
        alias: deleteAlias.trim() ? deleteAlias.trim() : null,
      });
      setDeleteResult(res);
      setDeleteStatus({ kind: "ok", message: "URL deleted successfully!" });
    } catch (e) {
      const errorMsg = e ? String(e) : "Request failed.";
      const userFriendlyMsg = errorMsg.includes("404") ? 
        "URL not found. Please check the ID and alias." : 
        errorMsg.includes("410") ? "URL has expired." :
        errorMsg.includes("400") ? "Invalid input. Please check your ID and alias." : errorMsg;
      setDeleteStatus({ kind: "err", message: userFriendlyMsg });
    } finally {
      setIsDeleting(false);
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>URL Shortner</h1>
          <div className="subtitle">One-page React UI for calling the backend API.</div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="badge">
            Backend base URL:{" "}
            <span style={{ fontFamily: "monospace" }}>{import.meta.env.VITE_BACKEND_BASE_URL || "(via dev proxy)"}</span>
          </div>
          <button className="themeToggle" onClick={toggleTheme}>
            {theme === "light" ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card first-card">
          <h2>1) Shorten URL</h2>

          <label>Short URL (required)</label>
          <input 
            value={fullUrl} 
            onChange={(e) => setFullUrl(e.target.value)} 
            placeholder="https://example.com/..."
            className={urlError ? "error" : ""}
            autoFocus
          />
          {urlError && <div className="error-message">{urlError}</div>}

          <label>Alias (optional)</label>
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="my-alias" />

          <div className="row" style={{ marginTop: 12 }}>
            <button className="primary" disabled={!canShorten || isShortening} onClick={onShorten}>
              {isShortening ? "Shortening..." : "Shorten"}
            </button>
          </div>

          {shortenStatus.kind !== "idle" && (
            <div className={`status ${shortenStatus.kind === "ok" ? "ok" : "err"}`}>{shortenStatus.message}</div>
          )}

          {shortenResult && (
            <div className="result-container">
              <div className="result-url">
                <span>{shortenResult.url}</span>
                <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(shortenResult.url)}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>2) Get Short URL Metadata</h2>

          <label>url_id (encoded id, required)</label>
          <input
            value={urlId}
            onChange={(e) => setUrlId(e.target.value)}
            placeholder="MTIzNDU"
          />

          <label>alias (optional)</label>
          <input value={dataAlias} onChange={(e) => setDataAlias(e.target.value)} placeholder="my-alias" />

          <div className="row" style={{ marginTop: 12 }}>
            <button className="primary" disabled={!canGetData || isFetchingData} onClick={onGetData}>
              {isFetchingData ? "Fetching..." : "Fetch Data"}
            </button>
          </div>

          {dataStatus.kind !== "idle" && (
            <div className={`status ${dataStatus.kind === "ok" ? "ok" : "err"}`}>{dataStatus.message}</div>
          )}

          {dataResult && (
            <div className="result-container">
              <div className="metadata-display">
                <div className="metadata-item">
                  <strong>Short URL:</strong>
                  <div className="url-display">
                    <span>{dataResult.shortUrl}</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => copyToClipboard(dataResult.shortUrl)}
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="metadata-item">
                  <strong>Full URL:</strong>
                  <div className="url-display">
                    <span>{dataResult.fullUrl}</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => copyToClipboard(dataResult.fullUrl)}
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="metadata-item">
                  <strong>Created:</strong> {new Date(dataResult.createdAt).toLocaleString()}
                </div>
                <div className="metadata-item">
                  <strong>Expires:</strong> {new Date(dataResult.expiresAt).toLocaleString()}
                </div>
                <div className="metadata-item">
                  <strong>Request Count:</strong> {dataResult.requestCount}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>3) Redirect (Resolve via API)</h2>

          <label>url_id (encoded id, required)</label>
          <input value={urlId} onChange={(e) => setUrlId(e.target.value)} placeholder="MTIzNDU" />

          <label>alias (optional)</label>
          <input
            value={redirectAlias}
            onChange={(e) => setRedirectAlias(e.target.value)}
            placeholder="my-alias"
          />

          <div className="row" style={{ marginTop: 12 }}>
            <button className="primary" disabled={!canRedirect || isResolving} onClick={onResolveRedirect}>
              {isResolving ? "Resolving..." : "Resolve Redirect"}
            </button>
            <button disabled={!canRedirect} onClick={openRedirectInBrowser}>
              Open Redirect
            </button>
          </div>

          {redirectStatus.kind !== "idle" && (
            <div className={`status ${redirectStatus.kind === "ok" ? "ok" : "err"}`}>{redirectStatus.message}</div>
          )}

          {redirectResult && (
            <div className="result-container">
              <div className="metadata-display">
                {redirectResult.kind === "location" ? (
                  <>
                    <div className="metadata-item">
                      <strong>Target URL:</strong>
                      <div className="url-display">
                        <span>{redirectResult.location}</span>
                        <button 
                          className="copy-btn" 
                          onClick={() => copyToClipboard(redirectResult.location)}
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="metadata-item">
                      <strong>Redirect Type:</strong> {redirectResult.status} {redirectResult.status === 307 ? "Temporary Redirect" : "Redirect"}
                    </div>
                  </>
                ) : (
                  <div className="metadata-item">
                    <strong>Status:</strong> {redirectResult.status} - Unable to resolve
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>4) Delete Short URL</h2>

          <label>url_id (encoded id, required)</label>
          <input value={urlId} onChange={(e) => setUrlId(e.target.value)} placeholder="MTIzNDU" />

          <label>alias (optional)</label>
          <input value={deleteAlias} onChange={(e) => setDeleteAlias(e.target.value)} placeholder="my-alias" />

          <div className="row" style={{ marginTop: 12 }}>
            <button className="danger" disabled={!canDelete || isDeleting} onClick={onDelete}>
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>

          {deleteStatus.kind !== "idle" && (
            <div className={`status ${deleteStatus.kind === "ok" ? "ok" : "err"}`}>{deleteStatus.message}</div>
          )}

          {deleteResult && (
            <div className="result-container">
              <div className="success-message">
                ✅ URL deleted successfully!
              </div>
            </div>
          )}
        </div>

        <div className="card span-2">
          <h2>Stats (loaded once on page load)</h2>
          <div className="footer-stats">
            <div className="badge stat-button">
              Total requests:{" "}
              <span style={{ fontFamily: "monospace" }}>
                {stats.totalRequestCount === null ? "..." : stats.totalRequestCount}
              </span>
            </div>
            <div className="badge redirect-button">
              Total redirects:{" "}
              <span style={{ fontFamily: "monospace" }}>
                {stats.redirectCount === null ? "..." : stats.redirectCount}
              </span>
            </div>
            <div className="status" style={{ marginTop: 0 }}>
              {statsStatus.kind === "idle" ? "Loading..." : statsStatus.message}
            </div>
          </div>
          <div className="subtitle" style={{ marginTop: 8 }}>
            Stats update only when the page is refreshed/loaded.
          </div>
        </div>
      </div>
    </div>
  );
}

