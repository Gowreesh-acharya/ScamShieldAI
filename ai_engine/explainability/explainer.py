"""Explainability Engine for ScamShield AI.
Translates heuristic indicators and risk factors into accessible,
human-understandable explanations and actionable safety recommendations.
"""

from typing import List, Optional

from ai_engine.models import Indicator, IndicatorSeverity, RiskLevel, URLAnalysisDetails


class Explainer:
    """Generates user-friendly explanations and protective guidance."""

    def __init__(self) -> None:
        pass

    def generate_explanation(
        self,
        risk_level: RiskLevel,
        indicators: List[Indicator],
        scam_category: Optional[str],
        url_details: List[URLAnalysisDetails],
        is_defensive: bool = False,
    ) -> str:
        """Constructs an articulate, non-technical explanation of the detection verdict."""
        if risk_level == RiskLevel.LOW:
            if is_defensive:
                return (
                    "This message appears to be a legitimate notification. It follows standard "
                    "informational banking/service patterns and includes official safety disclaimers "
                    "advising you not to share your credentials or OTPs with anyone."
                )
            if not indicators:
                return (
                    "No suspicious scam indicators or dangerous URL patterns were detected in the submitted content. "
                    "The language and structure appear normal."
                )
            return (
                "The submitted content shows minimal or routine indicators that do not match known fraud patterns. "
                "However, always remain vigilant when interacting with unexpected messages."
            )

        # Build dynamic explanation based on detected signals
        reasons = []

        # 1. Primary Scam Category Context
        if scam_category:
            reasons.append(f"It matches behavioral traits of a '{scam_category}'.")

        # 2. Key warning elements
        threat_inds = [ind for ind in indicators if "THREAT" in ind.code or "SUSPENSION" in ind.code]
        if threat_inds:
            reasons.append(
                f"It uses coercive urgency or intimidation (e.g., '{threat_inds[0].matched_text}') "
                "to rush you into acting before verifying."
            )

        harvest_inds = [ind for ind in indicators if "CREDENTIAL" in ind.code or "OTP" in ind.code or "KYC" in ind.code]
        if harvest_inds:
            reasons.append(
                f"It solicits sensitive identity or authorization details (e.g., '{harvest_inds[0].matched_text}'). "
                "Legitimate institutions never request PINs, OTPs, or passwords over text messages or external links."
            )

        lottery_inds = [ind for ind in indicators if "LOTTERY" in ind.code or "PRIZE" in ind.code or "JOB" in ind.code]
        if lottery_inds:
            reasons.append(
                f"It advertises unprompted rewards or high earnings (e.g., '{lottery_inds[0].matched_text}'), "
                "which is a classic lure used in advance-fee and task-fraud schemes."
            )

        # 3. URL-related warnings
        for u in url_details:
            if u.is_ip_address:
                reasons.append(
                    f"The link directs to a raw numerical IP address ({u.domain}) instead of an official registered domain."
                )
            if u.has_typosquatting and u.target_brand_mimicked:
                reasons.append(
                    f"The web link mimics the brand '{u.target_brand_mimicked.upper()}' on an unauthorized host ({u.domain})."
                )
            elif u.is_shortener:
                reasons.append(
                    f"It contains a shortened link ({u.domain}) that conceals the true final web destination."
                )
            elif u.is_suspicious_tld:
                reasons.append(
                    f"The website uses a top-level domain ({u.domain}) frequently registered for low-cost phishing sites."
                )

        if not reasons:
            reasons.append(
                "Several low-to-medium risk signals were flagged, including unusual wording and suspicious formatting."
            )

        prefix = (
            "Caution: This content exhibits strong indicators of a fraudulent scam attempt. "
            if risk_level == RiskLevel.HIGH
            else "Notice: This content contains suspicious elements that warrant caution. "
        )

        return prefix + " " + " ".join(reasons)

    def generate_recommendations(
        self,
        risk_level: RiskLevel,
        indicators: List[Indicator],
        url_details: List[URLAnalysisDetails],
        is_defensive: bool = False,
    ) -> List[str]:
        """Provides specific, actionable safety steps the user should follow immediately."""
        if risk_level == RiskLevel.LOW:
            return [
                "No immediate risk detected. You can proceed normally.",
                "As a standard precaution, never share your OTP, UPI PIN, or net banking password with anyone.",
                "Verify transactions directly within your official banking app if you have any doubts.",
            ]

        recommendations = []
        codes = {ind.code for ind in indicators}

        # Targeted recommendations
        if any(u.url for u in url_details) or "URL_SHORTENER" in codes or "PHISHING_ACTION_PROMPT" in codes:
            recommendations.append("Do NOT click on any links provided in the message.")

        if "CREDENTIAL_THEFT_REQUEST" in codes or "FAKE_KYC" in codes:
            recommendations.append("Never enter your OTP, UPI PIN, password, or card CVV on any external web form.")

        if "UPI_QR_FRAUD" in codes:
            recommendations.append("Remember: Entering your UPI PIN is ONLY for paying money, NEVER for receiving money.")

        if "FAKE_SUPPORT_APK" in codes:
            recommendations.append("Do NOT install any APK files or remote control software (such as AnyDesk, TeamViewer, or RustDesk).")

        if "GOVT_UTILITY_IMPERSONATION" in codes or "SIM_DEACTIVATION" in codes:
            recommendations.append("Do not call the phone numbers listed in the message. Contact your service provider using their official bill or website.")

        if "FAMILY_IMPERSONATION" in codes:
            recommendations.append("Call your family member directly on their known, original phone number to verify their safety before sending any funds.")

        if "LOTTERY_PRIZE_SCAM" in codes or "FAKE_JOB_OFFER" in codes or "INVESTMENT_CRYPTO_FRAUD" in codes:
            recommendations.append("Do NOT send any 'registration fee', 'security deposit', or 'processing charge' to unlock prizes or jobs.")

        # Standard general safety recommendation if high risk
        if risk_level == RiskLevel.HIGH:
            recommendations.append(
                "If you have already shared credentials or transferred money, immediately contact the National Cyber Crime Helpline at 1930 or visit cybercrime.gov.in."
            )
        else:
            recommendations.append("Verify through official, independently looked-up contact channels before taking any action.")

        return recommendations
