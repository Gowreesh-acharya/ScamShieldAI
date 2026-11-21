"""Master Orchestrator for ScamShield AI Detection Engine.
Integrates message parsing, URL inspection, multi-factor risk scoring,
and explainability generation into simple, robust Python API endpoints.
"""

from typing import Any, Dict, List, Optional, Union

from ai_engine.analyzers.message_analyzer import MessageAnalyzer
from ai_engine.analyzers.url_analyzer import URLAnalyzer
from ai_engine.explainability.explainer import Explainer
from ai_engine.models import DetectionResult, Indicator, RiskLevel, URLAnalysisDetails
from ai_engine.scoring.risk_scorer import RiskScorer


class DetectionEngine:
    """Core engine orchestrating detection components, scoring, and explainability."""

    def __init__(self) -> None:
        self.message_analyzer = MessageAnalyzer()
        self.url_analyzer = URLAnalyzer()
        self.risk_scorer = RiskScorer()
        self.explainer = Explainer()

    def analyze_message(self, message: str) -> Dict[str, Any]:
        """Analyzes a suspicious text message (SMS, WhatsApp, Email).
        
        Automatically discovers and inspects any URLs embedded within the message.
        Returns a JSON-compatible dictionary.
        """
        if not message or not isinstance(message, str) or not message.strip():
            empty_result = DetectionResult(
                input_type="message",
                analyzed_target="",
                risk_score=0,
                risk_level=RiskLevel.LOW,
                verdict="Empty or invalid input provided",
                scam_category=None,
                detected_indicators=[],
                explanation="No content was submitted for analysis.",
                recommendations=["Please submit text or a URL to analyze."],
            )
            return empty_result.to_dict()

        target_text = message.strip()

        # Step 1: Analyze text patterns
        msg_indicators, scam_cat, is_defensive = self.message_analyzer.analyze(target_text)

        # Step 2: Extract embedded URLs and analyze them
        embedded_urls = self.message_analyzer.extract_urls(target_text)
        url_details_list: List[URLAnalysisDetails] = []
        combined_indicators: List[Indicator] = list(msg_indicators)
        seen_codes = {ind.code for ind in combined_indicators}

        for u in embedded_urls:
            u_inds, u_details = self.url_analyzer.analyze_url(u)
            url_details_list.append(u_details)
            for u_ind in u_inds:
                if u_ind.code not in seen_codes:
                    combined_indicators.append(u_ind)
                    seen_codes.add(u_ind.code)

        # Step 3: Compute risk score
        score, risk_lvl, verdict = self.risk_scorer.calculate_score(
            indicators=combined_indicators,
            has_url=len(embedded_urls) > 0,
            is_defensive=is_defensive,
        )

        # Step 4: Generate explainable narratives & recommendations
        explanation = self.explainer.generate_explanation(
            risk_level=risk_lvl,
            indicators=combined_indicators,
            scam_category=scam_cat,
            url_details=url_details_list,
            is_defensive=is_defensive,
        )
        recommendations = self.explainer.generate_recommendations(
            risk_level=risk_lvl,
            indicators=combined_indicators,
            url_details=url_details_list,
            is_defensive=is_defensive,
        )

        # If the risk score is LOW, clear the scam category so legitimate alerts aren't labeled as scams
        effective_category = scam_cat if risk_lvl != RiskLevel.LOW else None

        result = DetectionResult(
            input_type="message",
            analyzed_target=target_text[:300] + ("..." if len(target_text) > 300 else ""),
            risk_score=score,
            risk_level=risk_lvl,
            verdict=verdict,
            scam_category=effective_category,
            detected_indicators=combined_indicators,
            explanation=explanation,
            recommendations=recommendations,
            urls_found=embedded_urls,
            url_details=url_details_list,
        )
        return result.to_dict()

    def analyze_url(self, url: str) -> Dict[str, Any]:
        """Analyzes a suspicious URL or website link using static heuristic checks.
        
        Never visits or connects to the remote address.
        Returns a JSON-compatible dictionary.
        """
        if not url or not isinstance(url, str) or not url.strip():
            empty_result = DetectionResult(
                input_type="url",
                analyzed_target="",
                risk_score=0,
                risk_level=RiskLevel.LOW,
                verdict="Empty or invalid URL provided",
                scam_category=None,
                detected_indicators=[],
                explanation="No URL was provided for analysis.",
                recommendations=["Please provide a valid website address."],
            )
            return empty_result.to_dict()

        target_url = url.strip()
        indicators, details = self.url_analyzer.analyze_url(target_url)

        # Primary category if brand typosquatting detected
        scam_cat = (
            f"Brand Spoofing ({details.target_brand_mimicked.upper()})"
            if details.has_typosquatting and details.target_brand_mimicked
            else ("URL Obfuscation" if details.is_shortener or details.is_ip_address else None)
        )

        # Compute risk score
        score, risk_lvl, verdict = self.risk_scorer.calculate_score(
            indicators=indicators,
            has_url=True,
            is_defensive=False,
        )

        effective_category = scam_cat if risk_lvl != RiskLevel.LOW else None

        # Generate explainable narratives & recommendations
        explanation = self.explainer.generate_explanation(
            risk_level=risk_lvl,
            indicators=indicators,
            scam_category=scam_cat,
            url_details=[details],
            is_defensive=False,
        )
        recommendations = self.explainer.generate_recommendations(
            risk_level=risk_lvl,
            indicators=indicators,
            url_details=[details],
            is_defensive=False,
        )

        result = DetectionResult(
            input_type="url",
            analyzed_target=target_url,
            risk_score=score,
            risk_level=risk_lvl,
            verdict=verdict,
            scam_category=effective_category,
            detected_indicators=indicators,
            explanation=explanation,
            recommendations=recommendations,
            urls_found=[target_url],
            url_details=[details],
        )
        return result.to_dict()

    def analyze_input(
        self,
        message: Optional[str] = None,
        urls: Optional[Union[List[str], str]] = None,
    ) -> Dict[str, Any]:
        """Unified endpoint accepting text, URLs, or both.
        
        Intelligently routes inputs for convenient single-call FastAPI integrations.
        """
        # If explicit URLs are supplied as a list or string
        explicit_urls: List[str] = []
        if isinstance(urls, str) and urls.strip():
            explicit_urls.append(urls.strip())
        elif isinstance(urls, list):
            explicit_urls.extend([str(u).strip() for u in urls if str(u).strip()])

        msg_text = (message or "").strip()

        # If only a single URL was provided in either field
        if not msg_text and len(explicit_urls) == 1:
            return self.analyze_url(explicit_urls[0])

        # If text looks exclusively like a URL (no spaces, starts with http or www or has domain form)
        if msg_text and not explicit_urls and " " not in msg_text:
            if msg_text.startswith(("http://", "https://", "www.")) or (
                "." in msg_text and "/" in msg_text
            ):
                return self.analyze_url(msg_text)

        # Otherwise analyze as message (which automatically discovers and inspects all links)
        if explicit_urls:
            combined_text = f"{msg_text} " + " ".join(explicit_urls)
            return self.analyze_message(combined_text)

        return self.analyze_message(msg_text)


# ==========================================
# CONVENIENCE SINGLETONS FOR FASTAPI
# ==========================================
_default_engine = DetectionEngine()


def analyze_message(message: str) -> Dict[str, Any]:
    """Public convenience function for FastAPI to analyze a message."""
    return _default_engine.analyze_message(message)


def analyze_url(url: str) -> Dict[str, Any]:
    """Public convenience function for FastAPI to analyze a URL."""
    return _default_engine.analyze_url(url)


def analyze_input(
    message: Optional[str] = None,
    urls: Optional[Union[List[str], str]] = None,
) -> Dict[str, Any]:
    """Public convenience function for FastAPI to analyze combined or arbitrary inputs."""
    return _default_engine.analyze_input(message=message, urls=urls)
