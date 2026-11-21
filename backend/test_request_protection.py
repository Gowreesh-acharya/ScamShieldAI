import asyncio
import json
import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from detector import analyze
from main import create_app
from request_protection import MAX_BODY_BYTES

SCAN_PATH = "/api/analyze"
OTP_FIXTURE = {"content": "Reply with your OTP"}
LOCAL_ORIGIN = "http://localhost:5173"


class TestScanPrivacy(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(create_app())
        self.addCleanup(self.client.close)

    def test_validation_never_returns_submitted_values_or_parser_context(self):
        marker = "synthetic-private-marker"
        cases = [
            ({"content": {"nested": marker}}, "string_type"),
            ({"content": marker * 500}, "string_too_long"),
            ({"nested": marker}, "missing"),
            ([marker], "invalid_body"),
        ]
        for payload, code in cases:
            with self.subTest(code=code):
                response = self.client.post(SCAN_PATH, json=payload)
                self.assertEqual(response.status_code, 422)
                self.assertEqual(response.headers["cache-control"], "no-store")
                self.assertNotIn(marker, response.text)
                details = response.json()["detail"]
                self.assertEqual(details[0]["type"], code)
                self.assertTrue(all(set(item) == {"type", "loc", "msg"} for item in details))

        response = self.client.post(
            SCAN_PATH, content=f'{{"content": "{marker}",',
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(response.status_code, 422)
        self.assertNotIn(marker, response.text)
        self.assertEqual(response.json()["detail"], [
            {"type": "json_invalid", "loc": ["body"], "msg": "Send a valid JSON object."}
        ])

    def test_unexpected_analysis_failure_suppresses_input_in_response_and_log(self):
        marker = "synthetic-private-marker"
        with patch("main.analyze", side_effect=RuntimeError(marker)):
            with self.assertLogs("request_protection", level="ERROR") as logs:
                response = self.client.post(SCAN_PATH, json={"content": marker})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertNotIn(marker, response.text + "\n".join(logs.output))
        self.assertIsNone(logs.records[0].exc_info)

    def test_public_mode_preserves_contract_and_blocks_optional_lookup(self):
        with TestClient(create_app(public_mode=True)) as client:
            with patch.dict("os.environ", {"SCAMSHIELD_LOOKUP": "1"}):
                with patch("main.analyze", wraps=analyze) as detector:
                    response = client.post(SCAN_PATH, json=OTP_FIXTURE)
                    detector.assert_awaited_once_with(OTP_FIXTURE["content"])
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers["cache-control"], "no-store")
            result = response.json()
            self.assertEqual((result["verdict"], result["score"]), ("HIGH_RISK", 75))
            self.assertEqual(set(result), {
                "verdict", "score", "link_only", "notice", "highlighted_phrases",
                "extracted_urls", "unrolled_urls", "signals", "reason", "action", "safety_tip",
            })
            for path in ("/docs", "/redoc", "/openapi.json"):
                self.assertEqual(client.get(path).status_code, 404)
            trailing_slash = client.post(f"{SCAN_PATH}/", json=OTP_FIXTURE, follow_redirects=False)
            self.assertEqual(trailing_slash.status_code, 404)
            self.assertNotIn("location", trailing_slash.headers)


class TestScanRequestLimits(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=create_app()), base_url="http://test"
        )
        self.addAsyncCleanup(self.client.aclose)

    async def test_fully_escaped_5000_character_input_fits_at_byte_limit(self):
        body = json.dumps({"content": "\U0001f600" * 5000}).encode()
        body = body.ljust(MAX_BODY_BYTES)
        response = await self.client.post(
            SCAN_PATH, content=body, headers={"Content-Type": "application/json"}
        )
        self.assertEqual(response.status_code, 200)

    async def test_declared_oversized_body_is_rejected_before_reading(self):
        async def body():
            self.fail("The body should not be read when its declared length is too large")
            yield b""

        response = await self.client.post(
            SCAN_PATH, content=body(), headers={"Content-Length": str(MAX_BODY_BYTES + 1)}
        )
        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.headers["cache-control"], "no-store")

    async def test_streamed_input_is_limited_without_a_content_length(self):
        async def body():
            yield b"x" * MAX_BODY_BYTES
            yield b"x"
            self.fail("The body should not be read after exceeding the byte limit")

        with patch("main.analyze") as detector:
            response = await self.client.post(
                SCAN_PATH, content=body(), headers={"Content-Type": "application/json"}
            )
            detector.assert_not_called()
        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.headers["cache-control"], "no-store")

    async def test_slow_body_times_out(self):
        async def body():
            yield b'{"content":'
            await asyncio.sleep(60)

        with patch("request_protection.BODY_READ_TIMEOUT_SECONDS", 0.05):
            response = await self.client.post(
                SCAN_PATH, content=body(), headers={"Content-Type": "application/json"}
            )
        self.assertEqual(response.status_code, 408)

    async def test_unsupported_content_encoding_is_rejected(self):
        response = await self.client.post(
            SCAN_PATH, json=OTP_FIXTURE, headers={"Content-Encoding": "gzip"}
        )
        self.assertEqual(response.status_code, 415)


class TestPublicScanRateLimit(unittest.TestCase):
    def test_peer_and_service_limits_expire_and_ignore_forwarded_headers(self):
        app = create_app(public_mode=True)
        clients = [
            TestClient(app, client=(f"192.0.2.{index}", 50000)) for index in range(1, 4)
        ]
        for client in clients:
            self.addCleanup(client.close)
        first, second, third = clients
        with patch.multiple("request_protection", PEER_REQUEST_LIMIT=2, SERVICE_REQUEST_LIMIT=3):
            with patch("request_protection.monotonic", return_value=100) as clock:
                preflight = first.options(SCAN_PATH, headers={
                    "Origin": LOCAL_ORIGIN, "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type",
                })
                self.assertEqual(preflight.status_code, 200)
                self.assertEqual(first.post(SCAN_PATH, json=OTP_FIXTURE).status_code, 200)
                self.assertEqual(first.post(SCAN_PATH, json={}).status_code, 422)
                clock.return_value = 110
                response = first.post(SCAN_PATH, json=OTP_FIXTURE, headers={
                    "Origin": LOCAL_ORIGIN,
                    "X-Forwarded-For": "192.0.2.9",
                    "True-Client-IP": "192.0.2.9",
                })
                self.assertEqual(response.status_code, 429)
                self.assertEqual(response.headers["retry-after"], "50")
                self.assertEqual(response.headers["cache-control"], "no-store")
                self.assertEqual(response.headers["access-control-allow-origin"], LOCAL_ORIGIN)
                self.assertEqual(response.headers["access-control-expose-headers"], "Retry-After")
                self.assertEqual(second.post(SCAN_PATH, json=OTP_FIXTURE).status_code, 200)
                self.assertEqual(third.post(SCAN_PATH, json=OTP_FIXTURE).status_code, 429)
                clock.return_value = 160
                self.assertEqual(first.post(SCAN_PATH, json=OTP_FIXTURE).status_code, 200)

    def test_concurrent_requests_cannot_exceed_the_peer_limit(self):
        async def submit():
            transport = httpx.ASGITransport(app=create_app(public_mode=True))
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                with patch("request_protection.PEER_REQUEST_LIMIT", 2):
                    responses = await asyncio.gather(
                        *(client.post(SCAN_PATH, json=OTP_FIXTURE) for _ in range(5))
                    )
            return sorted(response.status_code for response in responses)

        self.assertEqual(asyncio.run(submit()), [200, 200, 429, 429, 429])
