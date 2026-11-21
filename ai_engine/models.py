"""Data models and schemas for ScamShield AI Detection Engine.
Provides clean Python types and JSON-serializable dictionaries for FastAPI.
"""

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class RiskLevel(str, Enum):
    LOW = "LOW"          # Score: 0 - 30
    MEDIUM = "MEDIUM"    # Score: 31 - 60
    HIGH = "HIGH"        # Score: 61 - 100


class IndicatorSeverity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class Indicator:
    """Represents a specific suspicious pattern or safety signal detected in the input."""
    code: str
    title: str
    severity: IndicatorSeverity
    matched_text: str
    description: str
    category: str = "general"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "title": self.title,
            "severity": self.severity.value if isinstance(self.severity, IndicatorSeverity) else str(self.severity),
            "matched_text": self.matched_text,
            "description": self.description,
            "category": self.category,
        }


@dataclass
class URLAnalysisDetails:
    """Detailed structural indicators discovered during URL heuristic inspection."""
    url: str
    domain: str = ""
    scheme: str = ""
    is_ip_address: bool = False
    is_shortener: bool = False
    is_suspicious_tld: bool = False
    has_typosquatting: bool = False
    target_brand_mimicked: Optional[str] = None
    has_excessive_subdomains: bool = False
    suspicious_keywords_in_path: List[str] = field(default_factory=list)
    has_at_symbol: bool = False
    is_unusually_long: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class DetectionResult:
    """The unified, JSON-serializable response returned to FastAPI and the frontend."""
    input_type: str                         # "message", "url", or "combined"
    analyzed_target: str                    # Original message or URL snippet
    risk_score: int                         # 0 to 100
    risk_level: RiskLevel                   # LOW, MEDIUM, HIGH
    verdict: str                            # Short human headline (e.g., "Likely Safe", "Suspicious Alert", "High Risk Scam")
    scam_category: Optional[str]            # Primary scam classification if detected (e.g., "Fake KYC", "UPI Fraud")
    detected_indicators: List[Indicator] = field(default_factory=list)
    explanation: str = ""                   # Plain-language explanation of why it was flagged
    recommendations: List[str] = field(default_factory=list) # Concrete, actionable steps
    urls_found: List[str] = field(default_factory=list)
    url_details: List[URLAnalysisDetails] = field(default_factory=list)
    disclaimer: str = (
        "ScamShield AI utilizes evidence-based heuristic analysis. "
        "Always verify independently through verified official channels."
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input_type": self.input_type,
            "analyzed_target": self.analyzed_target,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level.value if isinstance(self.risk_level, RiskLevel) else str(self.risk_level),
            "verdict": self.verdict,
            "scam_category": self.scam_category,
            "detected_indicators": [ind.to_dict() for ind in self.detected_indicators],
            "explanation": self.explanation,
            "recommendations": self.recommendations,
            "urls_found": self.urls_found,
            "url_details": [u.to_dict() for u in self.url_details],
            "disclaimer": self.disclaimer,
        }
