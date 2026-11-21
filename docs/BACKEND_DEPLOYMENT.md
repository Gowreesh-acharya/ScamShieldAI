# ScamShield AI backend deployment

## Readiness

The existing backend can run as a native Python web service. FastAPI starts under Uvicorn, handles scans without a database or persistent disk, and requires no API keys. The production command was exercised locally with the configured bind address and an assigned port. Render configuration is prepared for review. A hosted build and public HTTPS smoke test remain pending approval.

The [Blueprint](../render.yaml) defines a public Render Web Service on the free plan for the Android pilot. It selects `feature/api-integration`, disables automatic deploys and preview environments, and enables the request protections below. Confirm the plan before applying it. A free instance can sleep when idle, even though its HTTPS hostname stays assigned. [Render web services](https://render.com/docs/web-services) · [Render free service limits](https://render.com/docs/free)

## Build and start settings

| Setting | Value |
| --- | --- |
| Service type / runtime | Web Service / Python |
| Git branch | `feature/api-integration` |
| Root directory | `backend` |
| Build command | `python -m pip install -r requirements.txt` |
| Production start command | `python -m uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1 --limit-concurrency 64 --no-proxy-headers --no-access-log` |
| Platform health check | Leave the HTTP path empty to use Render's default TCP probe. |
| Auto-deploy | Off |

The build installs FastAPI, Pydantic, HTTPX, and Uvicorn at the versions in [backend/requirements.txt](../backend/requirements.txt). The working directory is `backend` so Python can import `main:app` and `detector.py`. Uvicorn listens on the service interface and platform-assigned port. Render terminates public HTTPS and forwards requests to Uvicorn. A different hosting provider needs the equivalent port binding and HTTPS ingress. [Deploy FastAPI on Render](https://render.com/docs/deploy-fastapi) · [Render web services](https://render.com/docs/web-services) · [Render health checks](https://render.com/docs/health-checks)

| Environment variable | Value and purpose |
| --- | --- |
| `PORT` | Render supplies it. The shell expands it in the start command. |
| `PYTHON_VERSION` | The Blueprint pins `3.14.10`, a Render-supported Python patch release. Local validation used Python 3.14.0. |
| `SCAMSHIELD_PUBLIC_MODE` | Set to `1` on Render to enable rate limits, suppress the generated API docs routes, and disable outbound lookups. |
| `SCAMSHIELD_LOOKUP` | Set to `0` on Render. Local development can opt in to the limited shortener lookup with `1`. Public mode leaves lookup disabled even if this value is set to `1`. |

`SCAMSHIELD_API_BASE_URL` and `VITE_API_BASE_URL` configure the Android and React clients respectively. The FastAPI process does not read them. [Render Python version selection](https://render.com/docs/python-version) · [Render environment variables](https://render.com/docs/environment-variables)

## Request and privacy controls

1. **Scan rate and concurrency.** Public mode allows 60 scan requests per observed socket peer and 240 across the process in each 60-second window. Invalid scans consume quota. Rate-limited requests receive HTTP 429 and a `Retry-After` value in seconds. CORS preflights bypass the scan quota. The in-memory counters reset each window or restart, and Uvicorn caps concurrency at 64. Keep one worker and one instance for these documented thresholds. [Uvicorn settings](https://uvicorn.dev/settings/)
2. **Client identity at the proxy.** Uvicorn ignores caller-supplied forwarding headers. Render users can share a peer bucket when they arrive through the same ingress proxy. These are origin-side resource limits for a small pilot. Before a wider rollout, measure that shared behavior and use a trusted ingress that can enforce per-client quotas on verified identity. Keep the origin-side cap and cover the direct service hostname in the abuse-control design.
3. **Body limits and validation.** The server rejects declared and streamed request bodies over 64 KiB before JSON parsing with HTTP 413. It allows five seconds to read the body and returns HTTP 408 on timeout. Compressed bodies receive HTTP 415. The `content` field keeps its existing 1–5,000 character limit. HTTP 422 details contain only safe `type`, `loc`, and `msg` fields.
4. **Browser CORS.** The policy allows `http://localhost:5173` and `http://127.0.0.1:5173` for browser POST requests with `Content-Type`. Allowed browsers can read `Retry-After` on throttled responses. Native Kotlin HTTP requests do not depend on CORS. If a hosted React client is approved, add only its exact HTTPS origin under separate review. CORS applies in browsers and does not authenticate callers.
5. **Scan privacy.** The server processes scan content in memory for the request and has no persistence layer. Scan responses use `Cache-Control: no-store`. The production command disables Uvicorn access logs, and unexpected scan failures log a fixed error message without request or traceback details. Confirm that Render and any log drains, tracing tools, or crash analytics capture only necessary operational metadata. Keep request and response bodies and URL query values out of logs. Set access and retention rules for any operational logs. [Render request logging](https://render.com/docs/logging)
6. **Outbound requests and public routes.** Keep both public environment settings shown above. The optional shortener lookup remains available for explicitly configured local development, where it only contacts the fixed providers and reads the first redirect without following it. Public mode serves the exact `POST /api/analyze` path, disables trailing-slash redirects and removes generated `/docs`, `/redoc`, and `/openapi.json` routes.

## GitHub and Render checklist after approval

1. Review the local diff on `feature/api-integration`. Stage only the reviewed Stage 1, 1.5, and 1.6 files and inspect `git diff --cached --name-status` before committing. Confirm the staged files contain no private environment or credential files. After approval, commit and push that feature branch to the team's GitHub repository. On GitHub, select the feature branch and record the reviewed commit SHA. A merge into shared `main` is unnecessary for this pilot.
2. In the Render Dashboard, select **New → Web Service** and connect the GitHub repository. Explicitly select `feature/api-integration`. Set Python, `backend` as Root Directory, the build and start commands above, and the displayed environment settings. Set **Auto-Deploy → Off** and leave the HTTP Health Check Path empty before creating the service. Web Service creation starts the first deployment, so confirm that the feature branch head still matches the reviewed SHA. For the Blueprint alternative, select that same branch and review the planned service before applying `render.yaml`. Set **Auto Sync → No** in the Blueprint's Settings to keep later configuration syncs manual. [Render web service setup](https://render.com/docs/your-first-deploy) · [Render auto-deploy settings](https://render.com/docs/deploys) · [Render Blueprint auto-sync](https://render.com/docs/infrastructure-as-code)
3. Watch the build and runtime logs until the service is live. Confirm that Uvicorn is listening on `0.0.0.0` and the supplied `PORT`. The TCP check only confirms that an instance accepts connections. Use the POST smoke test below to confirm application readiness. A free instance can spin down while idle. Allow for cold starts during synthetic testing and select an approved plan with suitable availability for production. [Render free service limits](https://render.com/docs/free)
4. Copy the service's public HTTPS address from the Dashboard service page after the deploy succeeds. Use the exact assigned origin or an approved custom domain after its certificate is active. Keep the origin separate from the API path. The Uvicorn address shown in logs is the internal bind address.
5. Check the deployed SHA on the Render **Deploys** page. For later updates use **Manual Deploy → Deploy a specific commit** and enter the reviewed SHA. Run the HTTPS smoke test from outside the hosting network. Verify the expected successes, sanitized errors, rate limit and cache headers, and review logging before passing the verified origin to the Android teammate. [Render manual deploys](https://render.com/docs/deploys)

## Test the actual HTTPS endpoint

Paste the HTTPS origin copied from Render when prompted. Use a synthetic message so the test can be shared safely.

```powershell
$baseUrl = (Read-Host 'Paste the public HTTPS origin from Render').Trim().TrimEnd('/')
$origin = [uri]$baseUrl
if (!$origin.IsAbsoluteUri -or $origin.Scheme -ne 'https' -or
    $origin.AbsolutePath -ne '/' -or $origin.Query -or $origin.Fragment -or $origin.UserInfo) {
    throw 'Provide the HTTPS service origin without an endpoint path, query, or credentials.'
}
$response = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/analyze" `
    -Method Post -ContentType 'application/json' `
    -Body (@{ content = 'Reply with your OTP' } | ConvertTo-Json -Compress) `
    -MaximumRedirection 0 -TimeoutSec 90 -ErrorAction Stop
$result = $response.Content | ConvertFrom-Json
$expectedFields = @(
    'verdict', 'score', 'link_only', 'notice', 'highlighted_phrases',
    'extracted_urls', 'unrolled_urls', 'signals', 'reason', 'action', 'safety_tip'
)
$actualFields = @($result.PSObject.Properties.Name)
if ($response.StatusCode -ne 200 -or $result.verdict -cne 'HIGH_RISK' -or
    $result.score -ne 75 -or (Compare-Object $expectedFields $actualFields -CaseSensitive)) {
    throw 'The deployed endpoint did not return the expected analysis contract.'
}
$result | ConvertTo-Json -Depth 5
```

Expect HTTP 200 and the OTP fixture response shown in the [Android guide](ANDROID_INTEGRATION.md). Verify `Cache-Control: no-store`. Repeat with an invalid synthetic `content` value and verify HTTP 422 without the submitted value. For the pilot, verify HTTP 413 with a synthetic oversized body and HTTP 429 with `Retry-After` when the configured scan quota is exhausted. Check the service logs for metadata only.

## Share with the Android developer

Send the verified origin, the [Android integration guide](ANDROID_INTEGRATION.md), and the OTP fixture in the team's handoff channel. The configuration key is `SCAMSHIELD_API_BASE_URL`. Its value is the copied HTTPS origin. The Android client appends `api/analyze` and expects `HIGH_RISK` with score `75` for the fixture. Share the branch or deployed revision used for the smoke test so the teammate can match the contract. A teammate developing before deployment can use local emulator or USB networking from the integration guide.
