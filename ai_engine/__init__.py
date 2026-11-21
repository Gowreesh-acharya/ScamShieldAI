"""ScamShield AI - AI Detection Engine
Build Bengaluru 2.0 Hackathon

Core entry points for scam message and URL analysis.
Designed for seamless integration into FastAPI backends.
"""

from ai_engine.engine import DetectionEngine, analyze_input, analyze_message, analyze_url
from ai_engine.models import DetectionResult, Indicator, RiskLevel

__all__ = [
    "analyze_message",
    "analyze_url",
    "analyze_input",
    "DetectionEngine",
    "DetectionResult",
    "Indicator",
    "RiskLevel",
]

__version__ = "1.0.0"
