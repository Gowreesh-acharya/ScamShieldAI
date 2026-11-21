# ScamShield AI Android integration

The native Kotlin app uses the same FastAPI service as the React frontend. The Android project is maintained separately. This guide describes the contract and provides code the Android team can adapt in that project.

## Configure the API base URL

Wire `SCAMSHIELD_API_BASE_URL` into the Android app's Gradle build configuration. An AI Studio environment value must be passed into Gradle explicitly if the generated project does not already do so. Read the value through `providers.gradleProperty("SCAMSHIELD_API_BASE_URL").orElse(providers.environmentVariable("SCAMSHIELD_API_BASE_URL"))` and expose it through the app module's generated `BuildConfig` or its existing configuration layer. Keep `UNCONFIGURED` as an explicit setup state. Show a configuration error for a missing, blank, or invalid value.

Provide only the service origin, including its scheme and optional local port. Normalize it to a trailing slash before passing it to Retrofit. The relative Retrofit path `api/analyze` supplies the endpoint. Use the verified HTTPS origin from the backend owner for release builds. The origin is public configuration that can be extracted from the APK. Keep private keys, including Gemini and hosting credentials, in server-side secret storage. The current API requires no backend credential from the app or its users. Use a stable team-controlled origin and keep temporary tunnel addresses out of the app.

| Dev target | Base URL | How it reaches FastAPI |
| --- | --- | --- |
| Android Studio emulator | `http://10.0.2.2:8000/` | The emulator maps `10.0.2.2` to the development machine's loopback interface. |
| Physical device via USB | `http://127.0.0.1:8000/` | Run `adb reverse tcp:8000 tcp:8000` for the connected device before launching the app. |
| Remote teammate or release build | The verified HTTPS origin supplied by the backend owner | The device connects directly to the hosted service. |

On a physical device, loopback points to the phone. With USB forwarding it reaches the computer attached to that phone. A teammate on another network needs their own local backend or the approved hosted HTTPS origin. [Android emulator networking](https://developer.android.com/studio/run/emulator-networking-address) · [Android USB port forwarding](https://developer.android.com/develop/ui/views/layout/webapps/access-local-server)

After wiring the Gradle property, build from the Android repository root with `.\gradlew.bat assembleDebug '-PSCAMSHIELD_API_BASE_URL=http://10.0.2.2:8000/'` in PowerShell. For the USB setup, run `adb reverse tcp:8000 tcp:8000` and use `http://127.0.0.1:8000/` as the property value.

In PowerShell from this repository's root, install the pinned backend requirements in a virtual environment and start FastAPI on loopback.

```powershell
if (!(Test-Path '.\.venv\Scripts\python.exe')) { python -m venv .venv }
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
$env:SCAMSHIELD_LOOKUP = '0'
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Declare `<uses-permission android:name="android.permission.INTERNET" />` in the Android manifest. Permit cleartext for only the selected local hosts in the debug variant's Network Security Config. Use HTTPS with the normal system trust store and hostname verification in release builds. Local development above uses HTTP, so use synthetic input. [Android network permissions](https://developer.android.com/develop/connectivity/network-ops/connecting) · [Android Network Security Configuration](https://developer.android.com/privacy-and-security/security-config)

## Analyze endpoint

Send `POST /api/analyze` with `Content-Type: application/json`. The request object has one required string field, `content`. The backend checks for 1–5,000 Unicode characters before trimming and rejects whitespace-only content. The message, separator, and URL count toward the same limit. Kotlin `String.length` counts UTF-16 code units, so use `content.codePointCount(0, content.length)` for a matching client-side limit. Treat the server's validation as authoritative and never silently truncate evidence.

- **Message Scanner** sends the original message in `content`.
- **URL Scanner** sends the selected address in `content`. Prefer a complete `http://` or `https://` address. After a successful response, require `link_only == true` and a nonempty `extracted_urls` before presenting a URL-only assessment. If those checks fail, ask the user to enter a complete address. Render extracted URLs as untrusted text and avoid opening them automatically.
- **Combined Scanner** joins nonblank inputs with a newline and submits that single string. Preserve both inputs when supplied. If the user provides a separate URL, show the extracted evidence so they can verify what was assessed. When the selected URL is missing from that evidence, report the link as unchecked. A single nonblank input may use the same endpoint.

The response is a JSON object with these eleven required fields. `notice` is nullable and the other fields have non-null values.

| JSON field | Type | Meaning |
| --- | --- | --- |
| `verdict` | String enum | `SAFE`, `SUSPICIOUS`, or `HIGH_RISK` |
| `score` | Integer | Risk score from 0 to 100 |
| `link_only` | Boolean | The submitted content contained only recognized links and separators |
| `notice` | String or null | Scope note, such as “Only the link was checked.” |
| `highlighted_phrases` | Array of strings | Flagged excerpts and addresses |
| `extracted_urls` | Array of strings | Addresses recognized in the input |
| `unrolled_urls` | Array of strings | First redirect destinations returned by the optional lookup. The array is empty without those results. |
| `signals` | Array of objects | Each object has a string `label` and an integer `weight`. The final score caps at 100. |
| `reason` | String | Explanation of the observed evidence |
| `action` | String | Recommended action |
| `safety_tip` | String | General safety guidance |

Render the exact score and preserve the backend verdict. Use `SAFE` for “No warning signs detected” with the backend's verification advice, `SUSPICIOUS` for a caution state, and `HIGH_RISK` for a strong warning. The label “Dangerous” can be a display alias for `HIGH_RISK`. With the current detector, scores are 0 for `SAFE`, 1–69 for `SUSPICIOUS`, and 70–100 for `HIGH_RISK`. A score of 0 describes the signals matched by this detector and carries no guarantee about a sender or site.

### Observed JSON examples

The responses below came from the local FastAPI server with `SCAMSHIELD_LOOKUP=0`. Synthetic URL examples use the reserved `example.com` domain.

**Message request**

```json
{"content":"Reply with your OTP"}
```

**HTTP 200 response**

```json
{
  "verdict": "HIGH_RISK",
  "score": 75,
  "link_only": false,
  "notice": null,
  "highlighted_phrases": ["Reply with your OTP"],
  "extracted_urls": [],
  "unrolled_urls": [],
  "signals": [{"label": "Request for a secret", "weight": 75}],
  "reason": "The message asks for an OTP or payment PIN.",
  "action": "Keep your OTP or PIN private. Verify through the original app.",
  "safety_tip": "For suspected fraudulent calls, SMS or WhatsApp messages in India, use Chakshu. If you have lost money to cyber fraud, call 1930 immediately."
}
```

**URL request**

```json
{"content":"https://sbi-kyc-verify.example.com/login"}
```

**HTTP 200 response**

```json
{
  "verdict": "SUSPICIOUS",
  "score": 35,
  "link_only": true,
  "notice": "Only the link was checked.",
  "highlighted_phrases": ["https://sbi-kyc-verify.example.com/login"],
  "extracted_urls": ["https://sbi-kyc-verify.example.com/login"],
  "unrolled_urls": [],
  "signals": [{"label": "Brand and domain differ", "weight": 35}],
  "reason": "sbi-kyc-verify.example.com is outside the listed reference domains for SBI.",
  "action": "Check through the organization's official app or a known contact.",
  "safety_tip": "For suspected fraudulent calls, SMS or WhatsApp messages in India, use Chakshu. If you have lost money to cyber fraud, call 1930 immediately."
}
```

**Combined request**

```json
{"content":"Reply with your OTP\nhttps://sbi-kyc-verify.example.com/login"}
```

This returned `HIGH_RISK` with score `100`, `link_only: false`, both highlighted excerpts, the extracted URL, and the 75- and 35-point signals from the examples above.

## Kotlin client

Use Retrofit with OkHttp and the Kotlin serialization Gradle plugin matched to the project's Kotlin version. Add `org.jetbrains.kotlinx:kotlinx-serialization-json`, `com.squareup.retrofit2:retrofit`, and Retrofit's matching `com.squareup.retrofit2:converter-kotlinx-serialization`. Use the project's OkHttp dependency or its compatible Retrofit-resolved version. [Retrofit converter artifact](https://central.sonatype.com/artifact/com.squareup.retrofit2/converter-kotlinx-serialization) · [OkHttp client configuration](https://okhttp.org/)

```kotlin
import java.util.concurrent.TimeUnit.SECONDS
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

@Serializable
data class AnalyzeRequest(val content: String)

@Serializable
enum class Verdict { SAFE, SUSPICIOUS, HIGH_RISK }

@Serializable
data class Signal(val label: String, val weight: Int)

@Serializable
data class AnalyzeResponse(
    val verdict: Verdict,
    val score: Int,
    @SerialName("link_only") val linkOnly: Boolean,
    val notice: String?,
    @SerialName("highlighted_phrases") val highlightedPhrases: List<String>,
    @SerialName("extracted_urls") val extractedUrls: List<String>,
    @SerialName("unrolled_urls") val unrolledUrls: List<String>,
    val signals: List<Signal>,
    val reason: String,
    val action: String,
    @SerialName("safety_tip") val safetyTip: String
)

interface ScamShieldApi {
    @POST("api/analyze")
    suspend fun analyze(@Body request: AnalyzeRequest): Response<AnalyzeResponse>
}

fun createScamShieldApi(rawBaseUrl: String, debug: Boolean): ScamShieldApi {
    val url = requireNotNull(rawBaseUrl.trim().toHttpUrlOrNull()) {
        "Configure SCAMSHIELD_API_BASE_URL with the ScamShield service origin."
    }
    require(url.encodedPath == "/" && url.query == null && url.fragment == null)
    require(url.username.isEmpty() && url.password.isEmpty())
    require(url.isHttps || (debug && url.host in setOf("10.0.2.2", "127.0.0.1"))) {
        "ScamShield requires HTTPS outside local debug builds."
    }

    val client = OkHttpClient.Builder()
        .connectTimeout(5, SECONDS)
        .readTimeout(10, SECONDS)
        .callTimeout(15, SECONDS)
        .followRedirects(false)
        .retryOnConnectionFailure(false)
        .build()

    val json = Json {
        explicitNulls = true
        coerceInputValues = false
        ignoreUnknownKeys = true
    }
    return Retrofit.Builder()
        .baseUrl(url)
        .client(client)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(ScamShieldApi::class.java)
}
```

The DTOs require every known field, including an explicit value or `null` for `notice`. They tolerate additive fields. Validate the decoded score range and the current verdict/score pairing before showing or saving a result. If the chosen JSON converter accepts scalar coercions, reject wrong JSON types before DTO decoding, such as a quoted score. Test invalid types, missing fields and unknown verdicts with HTTP 200 fixtures. [Kotlin explicit null handling](https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-json/kotlinx.serialization.json/-json-builder/explicit-nulls.html)

### Error handling and verification

| Outcome | Android behavior |
| --- | --- |
| HTTP 200 with a valid result | Display the backend score and verdict, evidence, and advice. Save only the completed result if history is enabled. |
| HTTP 200 with an empty body, HTML, invalid JSON, or malformed result | Show a server response error. Clear any previous result and skip the history write. |
| HTTP 404 or 405 | Report the endpoint configuration error. Verify the base URL, `POST` method, and path. |
| HTTP 422 | Keep the input editable and show a validation message. The `detail` array contains safe error codes, field locations, and messages. |
| HTTP 408 or 415 | Report a request-body timeout or unsupported encoding. Send JSON without compression. |
| HTTP 500/502/503 or other unexpected status | Show server unavailable and offer a manual retry. |
| Timeout, DNS, TLS, or offline failure | Show a connection error or timeout and offer a manual retry. Let coroutine cancellation propagate and cancel outdated requests. |
| HTTP 413 or 429 | Explain the 64 KiB request limit or the public service's scan rate limit. For 429, honor `Retry-After` when present. |

Use an explicit error state for every failed live request. Clear stale results when the input changes or a new scan starts. Never synthesize `SAFE`, score 0, or a completed history record on failure. If the app includes offline Demo mode, require an explicit selection and label the result and any saved demo entry **Demo**. Label a valid API response **Live**. A demo score is generated by the app's fixtures or heuristics.

For an on-demand **Test connection** action, call `POST /api/analyze` with the fixed body `{"content":"Hello"}`. The current backend returns a valid `SAFE` result with score `0` for the probe. Use only its status and shape to update connectivity and bypass the app's scan history and result screen. There is no dedicated health API.

In the configured app, submit the synthetic OTP message and confirm a real HTTP 200 from the configured origin, score 75, the secret-request signal, and a **Live** marker. Repeat with the URL and Combined fixtures. Then stop the local backend or disconnect the device and verify that the screen reports a failure and adds no history entry. Use status, timing, and test assertions for diagnostics. Keep submitted messages, URL query strings, response bodies, and validation details out of logs and analytics. Explain to the user that a live scan sends the selected content to the server and let them remove personal information first.

## Backend gaps and priority

| Feature | Available today | Missing and endpoint decision | Security and privacy | Priority |
| --- | --- | --- | --- | --- |
| Screenshot OCR | The analyzer accepts reviewed text extracted from an image. | Use on-device OCR with editable review first. A backend endpoint is only needed if the team deliberately chooses server-side OCR. | Request access to the selected image only. Minimize uploaded text and avoid retaining images or logging OCR output. Server OCR would also need upload byte, image dimension, format, and processing limits. | First after core scanning if screenshot support is selected. |
| Evidence-grounded investigation | Scans return signals, phrases, URLs, a reason, advice, and a safety tip. | Render an evidence view from these fields. A separate endpoint is only needed for a future server-generated conversation or investigation. | Treat evidence as untrusted input. Restrict tool and network access, keep provider keys server-side, and redact sensitive content before any model call. | After structured evidence review. |
| Emergency guidance | Scan results include a general safety tip and action. | Use an offline, reviewed guidance screen for static instructions. A backend endpoint is only needed if the team later needs centralized live updates. | Check regional guidance before release, keep instructions accessible offline, and avoid collecting financial data or contact lists. | Prioritize reviewing guidance before a public release. A backend endpoint is deferred. |
| Android-specific features | The same endpoint handles text and links selected by Android. | Share-sheet intake, permissions, settings, and local history belong in the app. A mobile-only endpoint is unnecessary for Stage 1.5. | Send only the item explicitly selected for scanning. Use app-private storage, provide deletion, and exclude sensitive history from analytics and backups. | Integrate the shared API first. |

## Validation and handoff

The 28 existing Python tests passed. A local HTTP smoke test against Uvicorn also checked the exact eleven success fields and nested signal types, plus these cases.

| Input | Observed result |
| --- | --- |
| `Reply with your OTP` | 200 · `HIGH_RISK` · 75 |
| `Your bank account will be blocked today.` | 200 · `SUSPICIOUS` · 20 |
| `Your refund has been processed. Never share your OTP.` | 200 · `SAFE` · 0 |
| URL fixture above | 200 · `SUSPICIOUS` · 35 · link only |
| Combined fixture above | 200 · `HIGH_RISK` · 100 |
| `Hello` availability probe | 200 · `SAFE` · 0 |
| Missing, numeric, empty, whitespace-only, or 5,001-character content | 422 |
| Malformed JSON | 422 |
| 5,000-character content | 200 |

Send this guide and the [deployment runbook](BACKEND_DEPLOYMENT.md) to the Android developer. Until a hosted service has been approved and verified, have them run the same backend locally and use the emulator or USB configuration above. After deployment approval, share the exact verified HTTPS origin as `SCAMSHIELD_API_BASE_URL`, along with the OTP fixture and its expected `HIGH_RISK` / `75` result. Ask the developer to rebuild with the new configuration and run the live and failure checks on their emulator and a physical device. Android build and device verification belong to that separate project.
