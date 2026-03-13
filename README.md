## URL Shortner (Spring Boot)

This project is a backend-only URL shortening service built with Spring Boot, JPA, and PostgreSQL. It lets you:

- Create short URLs for long links, with optional human-friendly aliases.
- Redirect users from short URLs to their original destinations while tracking per-link request counts.
- Query metadata about a short URL (original URL, created/expiry timestamps, request count).
- Track global request and redirect statistics via an AOP-based aspect.
- Automatically expire and purge old short URLs on a schedule.

- **AOP usage**: An Aspect (`StatisticsAspect`) wraps controller methods to increment in-memory counters for total requests and successful redirects.
- **Encoding approach**: Each database id is converted to a string and then encoded using a URL-safe Base64 variant without padding; this encoded id is used in the path segment of the short URL (no additional security layer is applied).
- **Automatic docs**: Method-level docs were generated automatically by AI and inserted as Javadoc above methods in the codebase. API docs and this README were also generated automatically by AI.

---

## How it works (high level)

- **Create**: You POST a full URL (and optional alias). The service stores it and returns a short URL of the form `{BASE_URL}/{url_id}` or `{BASE_URL}/{url_id}/{alias}`.
- **Resolve/redirect**: You GET the short URL and the service returns a **307 Temporary Redirect** with `Location` set to the full URL.
- **Stats**:
  - In-memory totals (request count / redirect count) are tracked via an AOP aspect and reset on restart.
  - Per-short-URL `requestCount` is persisted in the database and increments on redirect.
- **Expiration**:
  - Each short URL has `expiresAt`.
  - Expiry is set/refreshed to `now + 1 month` when creating a short URL and when redirecting.
  - Expired links return **410 Gone**.
- **Cleanup job**: A scheduled task deletes expired URLs daily at midnight (server time).

---

## API docs

See `API.yaml` or `API.md`.

---

## Folder structure (main parts)

- **`src/main/java/com/cyberronin/url_shortner/`**
  - **`controller/`**: HTTP endpoints (`UrlController`, `StatsController`)
  - **`service/`**: business logic (`UrlService`, `StatsService`, `CleanupService`)
  - **`repo/`**: Spring Data JPA repository (`UrlRepo`)
  - **`model/`**: JPA entity (`ShortUrl`)
  - **`dto/`**: request/response records (`RequestUrl`, `RequestShortUrl`, `ResponseUrl`, `ErrorResponse`)
  - **`exceptions/`**: custom exceptions + `GlobalExceptionHandler`
  - **`aop/`**: AOP aspect for stats (`StatisticsAspect`)
  - **`validator/`**: input validation (`RequestValidator`)
- **`src/main/resources/`**
  - **`application.properties`**: Spring and app config
- **`Dockerfile`**: container image for the app
- **`dockercompose.yaml`**: main Docker Compose file (see note below)
- **`pom.xml`**: Maven build config

---

## Configuration

Key application properties (see `src/main/resources/application.properties`):

- **`app.base.url`**: base URL used when constructing short URLs (default `http://localhost:8080`)
- **`app.url.alias.min.size`** / **`app.url.alias.max.size`**: alias size limits

Database configuration is driven by:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

---

## Local setup with Docker (recommended)

### Prerequisites

- Docker + Docker Compose installed

### 1) Create an env file

Copy `sample.env` to `.env` and fill values:

- `POSTGRES_USERNAME`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB_NAME`
- `BASE_URL` (optional; defaults to `http://localhost:8080`)

### 2) Build the app jar

The Docker image expects a jar at `target/UrlShortner.jar` (see `Dockerfile`).

From the project root:

```bash
./mvnw -DskipTests package
```

### 3) Start services

Use the main compose file.

Important naming note: the repo contains `~docker-compose.yaml` which should be treated as the main compose. When referenced in docs, it is referred to as `dockercompose.yaml`.

```bash
docker compose -f dockercompose.yaml -f dockercompose.dev.yaml up --build
```

### 4) Verify

- API should be on `http://localhost:8080`
- Postgres runs inside Docker and is reachable by the app using `db:5432`

---

## Quick usage examples

### Shorten a URL

```bash
curl -s -X POST "http://localhost:8080/api/v1/shortenUrl" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","alias":"ex"}'
```

### Fetch metadata

```bash
curl -s -X POST "http://localhost:8080/api/v1/data" \
  -H "Content-Type: application/json" \
  -d '{"url_id":"<encoded_id>","alias":"ex"}'
```

### Redirect

Open in a browser:

- `http://localhost:8080/<encoded_id>`
- `http://localhost:8080/<encoded_id>/ex`

### Stats

```bash
curl -s "http://localhost:8080/api/v1/stats/totalRequestCount"
curl -s "http://localhost:8080/api/v1/stats/redirectCount"
curl -s "http://localhost:8080/api/v1/stats/requestCount?url_id=<encoded_id>&alias=ex"
```

