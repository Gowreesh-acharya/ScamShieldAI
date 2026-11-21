import asyncio
import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient
from detector import analyze
from main import app, create_app

client = TestClient(app)


class TestBackend(unittest.TestCase):
    def test_examples(self):
        for message, expected in [
            ("Your refund is ready. Reply with your OTP.", "HIGH_RISK"),
            ("Your refund has been processed. Never share your OTP.", "SAFE"),
            ("Never share your OTP. Now send us your OTP.", "HIGH_RISK"),
            ("SBI: Reply with your OTP. https://sbi.co.in", "HIGH_RISK"),
            ("Refund ke liye UPI PIN daalo", "HIGH_RISK"),
            ("Demo Bank: verify at https://example.com.other.example.org", "SUSPICIOUS"),
            ("Demo Bank: visit https://app.example.com", "SAFE"),
            ("bit.ly/demo", "SUSPICIOUS"),
            ("https://[bad", "SUSPICIOUS"),
        ]:
            with self.subTest(message=message):
                response = client.post("/api/analyze", json={"content": message})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["verdict"], expected)

    def test_credential_requests_preserve_signal_and_evidence(self):
        scan_client = self.enterContext(TestClient(create_app(public_mode=True)))
        expected_fields = {
            "verdict", "score", "link_only", "notice", "highlighted_phrases",
            "extracted_urls", "unrolled_urls", "signals", "reason", "action", "safety_tip",
        }
        for message, evidence in [
            ("अपना ओटीपी भेजें।", "अपना ओटीपी भेजें"),
            ("ನಿಮ್ಮ ಒಟಿಪಿಯನ್ನು ಕಳುಹಿಸಿ.", "ನಿಮ್ಮ ಒಟಿಪಿಯನ್ನು ಕಳುಹಿಸಿ"),
            ("OTP de do.", "OTP de do"),
            ("Share your UPI-PIN to receive a refund.", "Share your UPI-PIN"),
            ("Reply with your OTP.", "Reply with your OTP"),
            ("Reply with your one-time verification code.", "Reply with your one-time verification code"),
            ("अपना सत्यापन कोड भेजें।", "अपना सत्यापन कोड भेजें"),
            ("ನಿಮ್ಮ ಯುಪಿಐ ಪಿನ್ ಕಳುಹಿಸಿ.", "ನಿಮ್ಮ ಯುಪಿಐ ಪಿನ್ ಕಳುಹಿಸಿ"),
            ("Verification code bhejo.", "Verification code bhejo"),
        ]:
            with self.subTest(message=message):
                response = scan_client.post("/api/analyze", json={"content": message})
                self.assertEqual(response.status_code, 200)
                result = response.json()
                self.assertEqual(set(result), expected_fields)
                self.assertEqual((result["verdict"], result["score"]), ("HIGH_RISK", 75))
                self.assertEqual(result["signals"], [{"label": "Request for a secret", "weight": 75}])
                self.assertEqual(result["highlighted_phrases"], [evidence])

    def test_credential_warnings_and_quoted_examples(self):
        scan_client = self.enterContext(TestClient(create_app(public_mode=True)))
        for message in [
            "अपना ओटीपी कभी साझा न करें।",
            "ನಿಮ್ಮ ಒಟಿಪಿಯನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
            "OTP kisi ko mat dena.",
            "Never share your UPI PIN.",
            "Do not under any circumstances share your OTP.",
            "Do not share or send your OTP.",
            "Do not share your one-time verification code.",
            "अपना सत्यापन कोड कभी साझा न करें।",
            "ನಿಮ್ಮ ಯುಪಿಐ ಪಿನ್ ಕಳುಹಿಸಬೇಡಿ.",
            'Scam example: "Reply with your OTP."',
            "If someone says “Send us your OTP”, do not respond.",
            "'Reply with your OTP' is an example of a scam.",
        ]:
            with self.subTest(message=message):
                response = scan_client.post("/api/analyze", json={"content": message})
                self.assertEqual(response.status_code, 200)
                result = response.json()
                self.assertEqual((result["verdict"], result["score"]), ("SAFE", 0))
                self.assertEqual(result["signals"], [])
                self.assertEqual(result["highlighted_phrases"], [])

    def test_credential_requests_survive_separate_warnings(self):
        scan_client = self.enterContext(TestClient(create_app(public_mode=True)))
        for message, evidence in [
            ("Never share your OTP. Now send us your OTP.", "send us your OTP"),
            ('Scam example: "Reply with your OTP." Now send us your OTP.', "send us your OTP"),
            ('"Reply with your OTP."', "Reply with your OTP"),
        ]:
            with self.subTest(message=message):
                response = scan_client.post("/api/analyze", json={"content": message})
                self.assertEqual(response.status_code, 200)
                result = response.json()
                self.assertEqual((result["verdict"], result["score"]), ("HIGH_RISK", 75))
                self.assertEqual(result["highlighted_phrases"], [evidence])

    def test_maximum_allowed_content(self):
        message = "A" * 5000

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["verdict"], "SAFE")
        self.assertEqual(data["score"], 0)
        self.assertEqual(data["signals"], [])

    def test_just_over_maximum_content(self):
        message = "A" * 5001

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 422)

        errors = response.json()["detail"]
        self.assertEqual(errors[0]["type"], "string_too_long")
        self.assertEqual(
            errors[0]["loc"],
            ["body", "content"]
        )

    def test_numeric_content_rejected(self):
        response = client.post(
            "/api/analyze",
            json={"content": 12345}
        )

        self.assertEqual(response.status_code, 422)

        errors = response.json()["detail"]

        self.assertEqual(
            errors[0]["type"],
            "string_type"
        )

        self.assertEqual(
            errors[0]["loc"],
            ["body", "content"]
        )

    def test_whitespace_content_rejected(self):
        response = client.post(
            "/api/analyze",
            json={"content": "   "}
        )

        self.assertEqual(response.status_code, 422)

        errors = response.json()["detail"]

        self.assertEqual(
            errors[0]["type"],
            "value_error"
        )

        self.assertEqual(
            errors[0]["loc"],
            ["body", "content"]
        )

    def test_visually_empty_content_rejected_with_redacted_details(self):
        cases = [
            ("zero-width space", "\u200b"),
            ("byte-order mark", "\ufeff"),
            ("mixed whitespace and formats", " \t\n\u00a0\u200b\u200c\u200d\ufeff"),
        ]
        for label, content in cases:
            with self.subTest(input=label):
                response = client.post("/api/analyze", json={"content": content})

                self.assertEqual(response.status_code, 422)
                self.assertEqual(response.headers["cache-control"], "no-store")
                self.assertEqual(response.json(), {"detail": [{
                    "type": "value_error",
                    "loc": ["body", "content"],
                    "msg": "Paste a message or link.",
                }]})

    def test_meaningful_selected_text_reaches_detector_unchanged(self):
        cases = [
            ("English with a combining mark", "Your cafe\u0301 order is ready."),
            ("Hindi with a joiner", "क्\u200dष का अभ्यास करें।"),
            ("Kannada with a non-joiner", "ಕ್\u200cಷ ಅಕ್ಷರವನ್ನು ಓದಿ."),
            ("Hinglish", "Aapka order taiyaar hai."),
            ("multiline", "Account update\nReply with your OTP\nUse the official app."),
        ]
        with TestClient(create_app(public_mode=True)) as public_client:
            for label, content in cases:
                with self.subTest(input=label), patch("main.analyze", wraps=analyze) as detector:
                    response = public_client.post("/api/analyze", json={"content": content})

                    self.assertEqual(response.status_code, 200)
                    detector.assert_awaited_once_with(content)

    def test_oversized_content_rejected(self):
        message = "A" * 10000

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 422)


    def test_inputs(self):
        for content in ["", "  ", "x"*12001]:
            self.assertEqual(client.post("/api/analyze", json={"content": content}).status_code, 422)
        result = client.post("/api/analyze", json={"content":"https://example.com https://example.org"}).json()
        self.assertTrue(result["link_only"])
        self.assertEqual(len(result["extracted_urls"]), 2)

    def test_kannada_account_threat(self):
        message = "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ ಬ್ಲಾಕ್ ಆಗುತ್ತದೆ. ತಕ್ಷಣ ಪರಿಶೀಲಿಸಿ."
        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["verdict"], "SUSPICIOUS")
        self.assertIn(
            "Pressure or threat",
            [s["label"] for s in response.json()["signals"]]
        )

    def test_hinglish_account_threat(self):
        message = (
            "Aapka bank account aaj block ho jayega. "
            "Turant verification karo."
        )

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["verdict"],
            "SUSPICIOUS"
        )
        self.assertIn(
            "Pressure or threat",
            [
                signal["label"]
                for signal in response.json()["signals"]
            ]
        )

    def test_hinglish_safety_warning(self):
        message = (
            "Agar koi bole bank account aaj block ho jayega, "
            "toh unki baat par bharosa mat karo."
        )

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["verdict"], "SAFE")
        self.assertEqual(response.json()["score"], 0)



    def test_link_only_brand_impersonation(self):
        suspicious_url = "https://sbi-kyc-verify.example.com/login"

        response = client.post(
            "/api/analyze",
            json={"content": suspicious_url}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data["link_only"])
        self.assertIn(suspicious_url, data["extracted_urls"])
        self.assertEqual(data["verdict"], "SUSPICIOUS")
        self.assertIn(
            "Brand and domain differ",
            [signal["label"] for signal in data["signals"]]
        )

        # A listed SBI domain should not trigger
        # a brand/domain mismatch.
        trusted = client.post(
            "/api/analyze",
            json={"content": "https://secure.onlinesbi.sbi/login"}
        )

        self.assertEqual(trusted.status_code, 200)
        self.assertNotIn(
            "Brand and domain differ",
            [
                signal["label"]
                for signal in trusted.json()["signals"]
            ]
        )

    def test_misleading_url_userinfo(self):
        url = (
            "https://onlinesbi.sbi@"
            "verify-account.example.com/login"
        )

        response = client.post(
            "/api/analyze",
            json={"content": url}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertTrue(data["link_only"])
        self.assertIn(url, data["extracted_urls"])

        self.assertEqual(
            data["verdict"],
            "SUSPICIOUS"
        )

        self.assertIn(
            "Misleading URL userinfo",
            [signal["label"] for signal in data["signals"]]
        )

    def test_missing_content_rejected(self):
        response = client.post(
            "/api/analyze",
            json={}
        )

        self.assertEqual(response.status_code, 422)

        errors = response.json()["detail"]

        self.assertEqual(
            errors[0]["type"],
            "missing"
        )

        self.assertEqual(
            errors[0]["loc"],
            ["body", "content"]
        )

    def test_null_content_rejected(self):
        response = client.post(
            "/api/analyze",
            json={"content": None}
        )

        self.assertEqual(response.status_code, 422)

        errors = response.json()["detail"]

        self.assertEqual(
            errors[0]["type"],
            "string_type"
        )

        self.assertEqual(
            errors[0]["loc"],
            ["body", "content"]
        )

    def test_empty_content_rejected(self):
        response = client.post(
            "/api/analyze",
            json={"content": ""}
        )

        self.assertEqual(response.status_code, 422)

        errors = response.json()["detail"]
        self.assertEqual(errors[0]["type"], "string_too_short")

    def test_combined_risk_score_cap(self):
        message = (
            "Your bank account will be blocked today. "
            "Reply with your OTP and visit "
            "https://bit.ly/scamshield-demo-test"
        )

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["verdict"], "HIGH_RISK")
        self.assertEqual(data["score"], 100)

        signals = {
            signal["label"]: signal["weight"]
            for signal in data["signals"]
        }

        self.assertEqual(signals["Request for a secret"], 75)
        self.assertEqual(signals["Pressure or threat"], 20)
        self.assertEqual(signals["Hidden destination"], 25)

        self.assertEqual(sum(signals.values()), 120)
        self.assertFalse(data["link_only"])


    def test_url_extraction_preserves_complete_candidates(self):
        scan_client = self.enterContext(TestClient(create_app(public_mode=True)))
        for message, expected_url, link_only in [
            ("http://[::1]", "http://[::1]", True),
            ("http://[::1]/audit", "http://[::1]/audit", True),
            ("http://[::1]:8080/audit", "http://[::1]:8080/audit", True),
            ("See [http://[::1]].", "http://[::1]", False),
            ("https://example.org/receipt_(draft)", "https://example.org/receipt_(draft)", True),
            ("See (https://example.org/receipt_(draft)).", "https://example.org/receipt_(draft)", False),
            ("See https://example.org/receipt.", "https://example.org/receipt", False),
            ("See “https://example.org/receipt”.", "https://example.org/receipt", False),
            ("example.org:8443/receipt", "example.org:8443/receipt", True),
            ("example.org?reference=opaque-demo#receipt", "example.org?reference=opaque-demo#receipt", True),
            ("example.org?next=https://example.test/a", "example.org?next=https://example.test/a", True),
            ("https://example.org/pay?tag=(draft)", "https://example.org/pay?tag=(draft)", True),
        ]:
            with self.subTest(message=message):
                response = scan_client.post("/api/analyze", json={"content": message})
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data["extracted_urls"], [expected_url])
                self.assertEqual(data["link_only"], link_only)
                self.assertEqual((data["verdict"], data["score"]), ("SAFE", 0))

    def test_malformed_urls_remain_complete_and_unreadable(self):
        scan_client = self.enterContext(TestClient(create_app(public_mode=True)))
        for url in [
            "https://[bad",
            "http://[::not-an-ip]/",
            "http://[::1]]",
            "http://[::1]garbage",
            "https://example.org:bad/pay",
            "https://example.org:65536/pay",
            "example.org:bad/pay",
            "example.org::",
            "https://",
        ]:
            with self.subTest(url=url):
                response = scan_client.post("/api/analyze", json={"content": url})
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data["extracted_urls"], [url])
                self.assertEqual(data["highlighted_phrases"], [url])
                self.assertEqual(data["signals"], [{"label": "Unreadable address", "weight": 25}])
                self.assertEqual((data["verdict"], data["score"]), ("SUSPICIOUS", 25))

    def test_internationalized_url_evidence_and_bare_candidate_boundaries(self):
        scan_client = self.enterContext(TestClient(create_app(public_mode=True)))
        for content, urls in [
            ("https://例子.测试/receipt", ["https://例子.测试/receipt"]),
            ("https://xn--fsqu00a.xn--0zwm56d/receipt", ["https://xn--fsqu00a.xn--0zwm56d/receipt"]),
            ("xn--fsqu00a.xn--0zwm56d/receipt", ["xn--fsqu00a.xn--0zwm56d/receipt"]),
            ("someone@example.org", []),
            ("example.org.123/receipt", []),
        ]:
            with self.subTest(content=content):
                response = scan_client.post("/api/analyze", json={"content": content})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["extracted_urls"], urls)

    def test_complete_urls_preserve_order_deduplication_and_credential_evidence(self):
        scan_client = self.enterContext(TestClient(create_app(public_mode=True)))
        first = "example.org:8443/receipt"
        second = "https://sbi-verify.example.test/login?kind=kyc"
        for content, link_only, score, verdict, signals, highlights in [
            (f"{first}\n{second}\n{first}", True, 35, "SUSPICIOUS",
             [{"label": "Brand and domain differ", "weight": 35}], [second]),
            (f"Reply with your OTP. Use {first}, then {second}. Backup {first}.",
             False, 100, "HIGH_RISK", [
                 {"label": "Request for a secret", "weight": 75},
                 {"label": "Brand and domain differ", "weight": 35},
             ], ["Reply with your OTP", second]),
        ]:
            with self.subTest(link_only=link_only):
                response = scan_client.post("/api/analyze", json={"content": content})
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data["extracted_urls"], [first, second])
                self.assertEqual(data["link_only"], link_only)
                self.assertEqual(data["signals"], signals)
                self.assertEqual(data["highlighted_phrases"], highlights)
                self.assertEqual((data["verdict"], data["score"]), (verdict, score))

    def test_multiple_urls(self):
        safe_url = "https://example.com"
        suspicious_url = "https://sbi-kyc-verify.example.com/login"

        message = (
            f"Visit {safe_url} first. "
            f"Then complete verification at {suspicious_url}"
        )

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertFalse(data["link_only"])

        self.assertEqual(
            data["extracted_urls"],
            [safe_url, suspicious_url]
        )

        self.assertEqual(data["verdict"], "SUSPICIOUS")
        self.assertEqual(data["score"], 35)

        self.assertIn(
            suspicious_url,
            data["highlighted_phrases"]
        )

    def test_duplicate_urls(self):
        url = "https://sbi-kyc-verify.example.com/login"

        message = f"Check {url} and again {url}"

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # The repeated URL should appear only once.
        self.assertEqual(data["extracted_urls"], [url])
        self.assertEqual(data["highlighted_phrases"], [url])

        # Repetition should not increase the score.
        self.assertEqual(data["verdict"], "SUSPICIOUS")
        self.assertEqual(data["score"], 35)

        self.assertEqual(
            [signal["label"] for signal in data["signals"]],
            ["Brand and domain differ"]
        )

    def test_at_symbol_in_url_path(self):
        url = "https://example.com/contact/@support"

        response = client.post(
            "/api/analyze",
            json={"content": url}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertTrue(data["link_only"])
        self.assertEqual(data["extracted_urls"], [url])
        self.assertEqual(data["verdict"], "SAFE")
        self.assertEqual(data["score"], 0)

        self.assertNotIn(
            "Misleading URL userinfo",
            [signal["label"] for signal in data["signals"]]
        )

    def test_misleading_sbi_subdomain(self):
        url = "https://onlinesbi.sbi.example.com/login"

        response = client.post(
            "/api/analyze",
            json={"content": url}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertTrue(data["link_only"])
        self.assertEqual(data["extracted_urls"], [url])

        self.assertEqual(data["verdict"], "SUSPICIOUS")
        self.assertEqual(data["score"], 35)

        self.assertIn(
            "Brand and domain differ",
            [signal["label"] for signal in data["signals"]]
        )

        self.assertIn(url, data["highlighted_phrases"])

    def test_shortened_url_inside_message(self):
        url = "https://bit.ly/scamshield-demo-test"

        message = (
            "Please check this link for more information: "
            + url
        )

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertFalse(data["link_only"])
        self.assertEqual(data["extracted_urls"], [url])
        self.assertEqual(data["unrolled_urls"], [])

        self.assertEqual(data["verdict"], "SUSPICIOUS")
        self.assertEqual(data["score"], 25)

        self.assertIn(
            "Hidden destination",
            [signal["label"] for signal in data["signals"]]
        )

        self.assertIn(url, data["highlighted_phrases"])

    def test_otp_and_short_url_evidence(self):
        url = "https://bit.ly/scamshield-demo-test"
        message = f"Reply with your OTP and visit {url}"

        response = client.post(
            "/api/analyze",
            json={"content": message}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["verdict"], "HIGH_RISK")
        self.assertEqual(data["score"], 100)
        self.assertFalse(data["link_only"])

        self.assertEqual(data["extracted_urls"], [url])

        self.assertIn(
            "Reply with your OTP",
            data["highlighted_phrases"]
        )
        self.assertIn(
            url,
            data["highlighted_phrases"]
        )

        self.assertEqual(
            {signal["label"] for signal in data["signals"]},
            {"Request for a secret", "Hidden destination"}
        )

    def test_shortened_link_only(self):
        url = "https://bit.ly/scamshield-demo-test"

        response = client.post(
            "/api/analyze",
            json={"content": url}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data["link_only"])
        self.assertEqual(data["notice"], "Only the link was checked.")
        self.assertEqual(data["extracted_urls"], [url])
        self.assertEqual(data["unrolled_urls"], [])

        self.assertEqual(data["verdict"], "SUSPICIOUS")
        self.assertEqual(data["score"], 25)

        self.assertIn(
            "Hidden destination",
            [signal["label"] for signal in data["signals"]]
        )


    def test_hdfc_link_only_impersonation(self):
        suspicious_url = (
            "https://hdfcbank-verify.example.com/login"
        )

        response = client.post(
            "/api/analyze",
            json={"content": suspicious_url}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertTrue(data["link_only"])
        self.assertEqual(
            data["extracted_urls"],
            [suspicious_url]
        )

        self.assertEqual(data["verdict"], "SUSPICIOUS")

        self.assertIn(
            "Brand and domain differ",
            [signal["label"] for signal in data["signals"]]
        )

    def test_legitimate_hdfc_domain(self):
        response = client.post(
            "/api/analyze",
            json={"content": "https://www.hdfcbank.com"}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        labels = [s["label"] for s in data["signals"]]

        self.assertNotIn("Brand and domain differ", labels)
        self.assertEqual(data["score"], 0)
        self.assertEqual(data["verdict"], "SAFE")

    def test_deceptive_hdfc_subdomain(self):
        response = client.post(
            "/api/analyze",
            json={
                "content":
                "https://www.hdfcbank.com.example.com/login"
            }
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        labels = [s["label"] for s in data["signals"]]

        self.assertIn("Brand and domain differ", labels)
        self.assertEqual(data["verdict"], "SUSPICIOUS")
        self.assertEqual(data["score"], 35)

    def test_percent_encoded_hostname(self):
        suspicious_url = (
            "https://hdfcbank%2dverify.example.com/login"
        )

        response = client.post(
            "/api/analyze",
            json={"content": suspicious_url}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertTrue(data["link_only"])
        self.assertEqual(
            data["extracted_urls"],
            [suspicious_url]
        )

        self.assertEqual(
            data["verdict"],
            "SUSPICIOUS"
        )

        labels = [
            signal["label"]
            for signal in data["signals"]
        ]

        self.assertIn(
            "Encoded hostname",
            labels
        )





    def test_redirects(self):
        async def run():
            def answer(request):
                self.assertEqual(request.url.host, "bit.ly")
                if request.url.path == "/down":
                    raise httpx.ReadTimeout("timeout")
                return httpx.Response(302, headers={"Location":"https://other.example.org"})
            async with httpx.AsyncClient(transport=httpx.MockTransport(answer)) as http:
                result = await analyze("Demo Bank bit.ly/demo", http)
                self.assertEqual(result["unrolled_urls"], ["https://other.example.org"])
                self.assertIn("Brand and domain differ", [s["label"] for s in result["signals"]])
                result = await analyze("bit.ly/down", http)
                self.assertEqual(result["unrolled_urls"], [])
                self.assertEqual(result["verdict"], "SUSPICIOUS")
        asyncio.run(run())
