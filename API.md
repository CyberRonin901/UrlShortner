## URL Shortner HTTP API

This document is a concise Markdown view of the HTTP API, derived from `API.docs`.
Method-level Javadoc, `API.docs`, `API.yaml`, and this file were generated automatically by AI.

Base URL (local): `http://localhost:5000` for API requests.

Note: returned short URLs are built using `app.base.url` (default `http://localhost:5000`), so the `url`/`shortUrl` fields may start with `:5000` unless `BASE_URL` is provided to the container environment.

---

### 1. Shorten URL

- **Method**: `POST`
- **Path**: `/api/v1/shortenUrl`
- **Purpose**: Create (or reuse) a short URL for a given full URL and optional alias.

**Request body**

```json
{
  "url": "https://example.com/some/path",
  "alias": "optional-alias"
}
```

- `alias` is optional and may be omitted or `null`.

**Responses**

- `200 OK`

```json
{
  "url": "http://localhost:5000/MTIzNDU/optional-alias"
}
```

- `400 Bad Request` — invalid input (null/blank URL, prohibited base URL, alias length out of range).

---

### 2. Get short URL metadata

- **Method**: `POST`
- **Path**: `/api/v1/data`
- **Purpose**: Retrieve metadata for a short URL by encoded id and optional alias.

**Request body**

```json
{
  "url_id": "MTIzNDU",
  "alias": "optional-alias"
}
```

**Responses**

- `200 OK`

```json
{
  "shortUrl": "http://localhost:5000/MTIzNDU/optional-alias",
  "fullUrl": "https://example.com/some/path",
  "createdAt": "2026-03-13T12:34:56.000",
  "expiresAt": "2026-04-13T12:34:56.000",
  "requestCount": 42
}
```

- `404 Not Found` — decoded id not present.
- `400 Bad Request` — alias mismatch or invalid id format.
- `410 Gone` — URL is expired.

---

### 3. Redirect to full URL

- **Method**: `GET`
- **Paths**:
  - `/{id}`
  - `/{id}/{alias}`
- **Purpose**: Resolve a short URL and redirect to the stored full URL.

**Path parameters**

- `id` — encoded `url_id`.
- `alias` — optional alias (required if the stored record has an alias).

**Responses**

- `307 Temporary Redirect`
  - `Location` header set to the full target URL.

Notes:

- Increments per-URL request count.
- Refreshes expiry to `now + 1 month`.

- Errors mirror the metadata endpoint:
  - `404 Not Found`
  - `400 Bad Request`
  - `410 Gone`

---

### 4. Delete short URL

- **Method**: `DELETE`
- **Paths**:
  - `/{id}`
  - `/{id}/{alias}`
- **Purpose**: Delete the stored short URL record.

**Path parameters**

- `id` — encoded `url_id`.
- `alias` — optional alias (required if the stored record has an alias).

**Responses**

- `204 No Content` — deletion successful.
- `404 Not Found`, `400 Bad Request`, or `410 Gone` — same error semantics as for metadata.

---

### 5. Stats: total request count

- **Method**: `GET`
- **Path**: `/api/v1/stats/totalRequestCount`
- **Purpose**: Return the total number of requests that hit any `UrlController` endpoint.

**Responses**

- `200 OK`

```json
{
  "totalRequestCount": 123
}
```

Note: Tracked in-memory via AOP and resets on application restart.

---

### 6. Stats: per-short-URL request count

- **Method**: `GET`
- **Path**: `/api/v1/stats/requestCount`
- **Purpose**: Return the persisted request count for a specific short URL.

**Query parameters**

- `url_id` (required) — encoded id.
- `alias` (optional) — alias.

**Responses**

- `200 OK`

```json
{
  "requestCount": 42
}
```

- `404 Not Found`, `400 Bad Request`, or `410 Gone` — same semantics as other URL-specific endpoints.

---

### 7. Stats: total redirect count

- **Method**: `GET`
- **Path**: `/api/v1/stats/redirectCount`
- **Purpose**: Return the total number of redirects performed by the redirect endpoint.

**Responses**

- `200 OK`

```json
{
  "redirectCount": 99
}
```

Note: Tracked in-memory via AOP and resets on application restart.

---

### 8. Error format

All handled errors share a common shape:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable message"
}
```

Status mappings:

- `404 Not Found` — `UrlNotFoundException`
- `400 Bad Request` — `AliasMismatchException`, `InvalidInputLengthException`, `InvalidUrlIdException`, `ProhibitedDomainException`, `NullInputException`
- `410 Gone` — `UrlExpiredException`
- `500 Internal Server Error` — any other unhandled exception; message becomes `Unexpected Internal Server Error`.

Unmatched paths: the wildcard controller (`WildCardControlller`) catches any other routes and returns HTTP `400` with a plain-text body `Path not found`.

