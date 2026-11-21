"""Message scam detection analyzer for ScamShield AI.
Analyzes SMS, WhatsApp, and email message text for scam patterns, urgency,
credential harvesting, impersonation, and legitimate defensive disclaimers.
"""

import re
from typing import List, Optional, Tuple

from ai_engine.analyzers.patterns import (
    DEFENSIVE_DISCLAIMER_PATTERNS,
    LEGITIMATE_TRANSACTION_PATTERNS,
    SCAM_PATTERNS,
)
from ai_engine.models import Indicator, IndicatorSeverity

# Regex to safely find URLs embedded within text messages
URL_REGEX = re.compile(
    r"(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,63}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))\)|[^\s`!()\[\]{};:'\".,<>?«»“”‘’]))"
)


class MessageAnalyzer:
    """Analyzes message text against curated patterns, financial context, and behavioral cues."""

    def __init__(self) -> None:
        pass

    def extract_urls(self, text: str) -> List[str]:
        """Safely extracts all embedded URLs or web addresses from the message text."""
        if not text:
            return []
        matches = URL_REGEX.findall(text)
        urls = []
        for match in matches:
            url_str = match[0] if isinstance(match, tuple) else match
            # If it starts with www, prepend http:// for consistent parsing
            if url_str.lower().startswith("www."):
                url_str = "http://" + url_str
            if url_str not in urls:
                urls.append(url_str)
        return urls

    def check_defensive_signals(self, text: str) -> Tuple[bool, List[Indicator]]:
        """Checks if the message contains explicit official safeguards or standard transaction receipts.
        
        Legitimate banks always remind users: 'Never share OTP/password' and send standard
        credit/debit transaction notifications.
        """
        defensive_indicators: List[Indicator] = []
        has_defensive_warning = False

        # 1. Check for explicit safety warnings
        for pattern in DEFENSIVE_DISCLAIMER_PATTERNS:
            match = pattern.search(text)
            if match:
                has_defensive_warning = True
                defensive_indicators.append(
                    Indicator(
                        code="OFFICIAL_SAFETY_WARNING",
                        title="Official Bank Safety Warning Detected",
                        severity=IndicatorSeverity.INFO,
                        matched_text=match.group(0),
                        description="The message contains standard advisory language instructing you never to share OTPs or credentials.",
                        category="Legitimate Safeguard",
                    )
                )
                break  # Record one high-confidence defensive indicator

        # 2. Check for legitimate transaction receipt patterns
        has_legit_txn = False
        for pattern in LEGITIMATE_TRANSACTION_PATTERNS:
            match = pattern.search(text)
            if match:
                has_legit_txn = True
                defensive_indicators.append(
                    Indicator(
                        code="LEGITIMATE_TRANSACTION_RECEIPT",
                        title="Standard Transaction/Delivery Notification Format",
                        severity=IndicatorSeverity.INFO,
                        matched_text=match.group(0),
                        description="The message follows standard automated notification structures used by financial services or logistics providers.",
                        category="Legitimate Safeguard",
                    )
                )
                break

        return (has_defensive_warning or has_legit_txn), defensive_indicators

    def analyze(self, text: str) -> Tuple[List[Indicator], Optional[str], bool]:
        """Analyzes the message text and returns:
        
        - List of detected Indicators (without double-counting)
        - Primary scam category name (if scam indicators were detected)
        - is_defensive: Boolean indicating whether legitimate defensive markers were identified
        """
        if not text or not text.strip():
            return [], None, False

        detected: List[Indicator] = []
        seen_codes = set()
        severity_rank = {
            IndicatorSeverity.CRITICAL: 5,
            IndicatorSeverity.HIGH: 4,
            IndicatorSeverity.MEDIUM: 3,
            IndicatorSeverity.LOW: 2,
            IndicatorSeverity.INFO: 1,
        }

        # Step 1: Scan for defensive disclaimers & transaction structures
        is_defensive, defensive_inds = self.check_defensive_signals(text)

        # Step 2: Scan for all 15 scam indicator categories
        primary_category: Optional[str] = None
        highest_severity_val = 0

        for code, data in SCAM_PATTERNS.items():
            matched_span = None
            for pattern in data["patterns"]:
                match = pattern.search(text)
                if match:
                    # Guard against false positives for credential harvesting when preceded by defensive phrasing
                    if code == "CREDENTIAL_THEFT_REQUEST":
                        start_pos = match.start()
                        context_window = text[max(0, start_pos - 40) : start_pos].lower()
                        defensive_tokens = ["do not", "don't", "dont", "never", "kisi", "na batayein", "neither", "not to"]
                        if any(token in context_window for token in defensive_tokens):
                            continue  # It is an official safety warning, not a credential harvesting solicitation!

                    matched_span = match.group(0)
                    break

            if matched_span and code not in seen_codes:
                sev_enum = IndicatorSeverity(data["severity"])
                indicator = Indicator(
                    code=code,
                    title=data["title"],
                    severity=sev_enum,
                    matched_text=matched_span,
                    description=data["explanation"],
                    category=data["category"],
                )
                detected.append(indicator)
                seen_codes.add(code)

                # Track highest-severity category for primary classification
                sev_val = severity_rank.get(sev_enum, 0)
                if sev_val > highest_severity_val:
                    highest_severity_val = sev_val
                    primary_category = data["title"]

        # Step 3: Add defensive indicators if present (useful for scoring mitigations)
        for d_ind in defensive_inds:
            if d_ind.code not in seen_codes:
                detected.append(d_ind)
                seen_codes.add(d_ind.code)

        return detected, primary_category, is_defensive
