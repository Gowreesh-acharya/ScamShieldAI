"""Risk Scoring Engine for ScamShield AI.
Computes a normalized risk score from 0 to 100 based on weighted indicators,
evidence co-occurrence (synergies), and legitimate dampening safeguards.
"""

from typing import List, Tuple

from ai_engine.models import Indicator, IndicatorSeverity, RiskLevel

# Base severity weights
SEVERITY_WEIGHTS = {
    IndicatorSeverity.CRITICAL: 65,
    IndicatorSeverity.HIGH: 40,
    IndicatorSeverity.MEDIUM: 35,
    IndicatorSeverity.LOW: 10,
    IndicatorSeverity.INFO: 0,
}

# Threshold boundaries
LOW_THRESHOLD = 30
MEDIUM_THRESHOLD = 60


class RiskScorer:
    """Calculates non-double-counting risk scores and determines risk classification."""

    def __init__(self) -> None:
        pass

    def calculate_score(
        self,
        indicators: List[Indicator],
        has_url: bool = False,
        is_defensive: bool = False,
    ) -> Tuple[int, RiskLevel, str]:
        """Calculates risk score (0-100), risk level (LOW, MEDIUM, HIGH), and a headline verdict.
        
        Rules:
        - Each distinct indicator contributes once based on its severity weight.
        - Co-occurring scam indicators produce a synergistic boost.
        - Legitimate defensive markers (e.g. 'Bank never asks for OTP') dampen false alarms.
        - Final score is bounded strictly between 0 and 100.
        """
        if not indicators:
            return 0, RiskLevel.LOW, "Safe – No suspicious indicators detected"

        # Step 1: Base score accumulation (ensuring no duplicate indicator codes)
        seen_codes = set()
        base_score = 0
        critical_count = 0
        high_count = 0
        medium_count = 0

        for ind in indicators:
            if ind.code in seen_codes:
                continue
            seen_codes.add(ind.code)

            weight = SEVERITY_WEIGHTS.get(ind.severity, 0)
            base_score += weight

            if ind.severity == IndicatorSeverity.CRITICAL:
                critical_count += 1
            elif ind.severity == IndicatorSeverity.HIGH:
                high_count += 1
            elif ind.severity == IndicatorSeverity.MEDIUM:
                medium_count += 1

        score = base_score

        # Step 2: Contextual Synergy Multipliers
        # (A) Threat + Link + Credential/KYC harvesting = classic high-confidence phishing campaign
        has_threat = any(
            c in seen_codes
            for c in ["ACCOUNT_SUSPENSION_THREAT", "SIM_DEACTIVATION", "GOVT_UTILITY_IMPERSONATION"]
        )
        has_harvesting = any(
            c in seen_codes
            for c in ["FAKE_KYC", "CREDENTIAL_THEFT_REQUEST", "UPI_QR_FRAUD", "FAKE_SUPPORT_APK"]
        )
        has_url_shortener = "URL_SHORTENER" in seen_codes
        has_typosquatting = "URL_BRAND_TYPOSQUATTING" in seen_codes
        has_raw_ip = "URL_RAW_IP_HOST" in seen_codes
        has_suspicious_path = "URL_SUSPICIOUS_PATH" in seen_codes

        if has_raw_ip and has_suspicious_path:
            score += 25  # Raw IP host with banking/login path is almost certainly phishing

        if has_threat and (has_harvesting or has_url):
            score += 15  # Threat combined with link or harvesting increases confidence

        if has_url_shortener and (has_threat or has_harvesting):
            score += 15  # Obfuscated link combined with urgent demand is highly characteristic of scams

        if has_typosquatting and has_harvesting:
            score += 20  # Impersonated domain asking for credentials is near certainty

        # Synergistic boost for multiple independent high/critical signals
        if (critical_count + high_count) >= 3:
            score += 15
        elif (critical_count + high_count) == 2:
            score += 8

        # Step 3: Mitigating Dampeners for Legitimate Alerts
        # If the message contains standard banking disclaimers ("Never share OTP")
        # and has NO malicious credential harvesting or brand spoofing:
        has_malicious_demands = any(
            c in seen_codes
            for c in [
                "CREDENTIAL_THEFT_REQUEST",
                "FAKE_KYC",
                "UPI_QR_FRAUD",
                "URL_BRAND_TYPOSQUATTING",
                "URL_RAW_IP_HOST",
                "FAKE_SUPPORT_APK",
                "LOTTERY_PRIZE_SCAM",
                "FAKE_JOB_OFFER",
                "INVESTMENT_CRYPTO_FRAUD",
                "FAMILY_IMPERSONATION",
            ]
        )

        if is_defensive and not has_malicious_demands:
            # Strong legitimate bank SMS signal (e.g. debit alert with standard OTP warning)
            score = max(0, score - 35)

        # Step 4: Strict Bounding (0 to 100)
        final_score = max(0, min(100, int(score)))

        # Step 5: Risk Level & Verdict Mapping
        if final_score <= LOW_THRESHOLD:
            risk_level = RiskLevel.LOW
            if final_score == 0:
                verdict = "Safe – No suspicious indicators detected"
            else:
                verdict = "Low Risk – Routine message or minimal flags"
        elif final_score <= MEDIUM_THRESHOLD:
            risk_level = RiskLevel.MEDIUM
            verdict = "Medium Risk – Suspicious elements detected, proceed with caution"
        else:
            risk_level = RiskLevel.HIGH
            verdict = "High Risk – Highly suspicious scam or phishing pattern detected"

        return final_score, risk_level, verdict
