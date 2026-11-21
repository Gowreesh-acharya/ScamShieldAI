"""URL Scam Detection Analyzer for ScamShield AI.
Performs pure static heuristic analysis on URLs using urllib.parse and ipaddress.
Never connects to, executes, or requests suspicious links.
"""

import ipaddress
import re
from typing import List, Optional, Tuple
from urllib.parse import parse_qs, urlparse

from ai_engine.analyzers.patterns import (
    LEGITIMATE_BRANDS,
    SUSPICIOUS_TLDS,
    URL_SHORTENERS,
    WATCHLIST_BRANDS,
)
from ai_engine.models import Indicator, IndicatorSeverity, URLAnalysisDetails


class URLAnalyzer:
    """Static heuristic analyzer for suspicious URL structures and brand spoofing."""

    def __init__(self) -> None:
        pass

    def _normalize_url(self, raw_url: str) -> str:
        """Ensures a parseable URL scheme without connecting to anything."""
        url = raw_url.strip()
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+\-.]*://", url):
            url = "http://" + url
        return url

    def _check_ip_address(self, hostname: str) -> bool:
        """Determines if the host is a raw numeric IPv4 or IPv6 address."""
        if not hostname:
            return False
        # Remove brackets from IPv6 hostnames like [::1]
        host = hostname.strip("[]")
        try:
            ipaddress.ip_address(host)
            return True
        except ValueError:
            return False

    def _check_typosquatting(self, hostname: str) -> Tuple[bool, Optional[str]]:
        """Checks if a known brand keyword appears in the domain/subdomain,
        while the full domain is NOT an authorized legitimate domain for that brand.
        """
        host_lower = hostname.lower()
        
        for brand, legitimate_domains in LEGITIMATE_BRANDS.items():
            # Check if brand appears in hostname (e.g. 'sbi' in 'sbi-update.xyz' or 'hdfc' in 'hdfc-kyc.com')
            pattern = rf"(^|[.\-_]){re.escape(brand)}([.\-_]|$)"
            if re.search(pattern, host_lower) or brand in host_lower:
                # Is it an official, authorized domain?
                is_legit = any(
                    host_lower == legit or host_lower.endswith("." + legit)
                    for legit in legitimate_domains
                )
                if not is_legit:
                    return True, brand

        return False, None

    def analyze_url(self, raw_url: str) -> Tuple[List[Indicator], URLAnalysisDetails]:
        """Performs static heuristic analysis on a single URL."""
        normalized = self._normalize_url(raw_url)
        parsed = urlparse(normalized)
        hostname = (parsed.hostname or "").lower()
        port = parsed.port
        path = parsed.path or ""
        query = parsed.query or ""

        details = URLAnalysisDetails(
            url=raw_url,
            domain=hostname,
            scheme=parsed.scheme.lower(),
        )

        indicators: List[Indicator] = []

        # 1. Raw IP Address Host Check
        is_ip = self._check_ip_address(hostname)
        if is_ip:
            details.is_ip_address = True
            indicators.append(
                Indicator(
                    code="URL_RAW_IP_HOST",
                    title="Direct IP Address Host",
                    severity=IndicatorSeverity.HIGH,
                    matched_text=hostname,
                    description="The link directly connects to an IP address instead of a verified registered domain, a common tactic to bypass domain reputation filters.",
                    category="URL Obfuscation",
                )
            )

        # 2. Known URL Shortener Detection
        if hostname in URL_SHORTENERS:
            details.is_shortener = True
            indicators.append(
                Indicator(
                    code="URL_SHORTENER",
                    title="Shortened URL Service",
                    severity=IndicatorSeverity.MEDIUM,
                    matched_text=hostname,
                    description="The link uses a URL shortener service that obscures the ultimate destination domain. Shorteners are frequently leveraged in phishing campaigns.",
                    category="URL Obfuscation",
                )
            )

        # 3. Suspicious or High-Risk TLD
        domain_parts = hostname.split(".")
        tld = domain_parts[-1] if len(domain_parts) > 1 else ""
        if tld in SUSPICIOUS_TLDS:
            details.is_suspicious_tld = True
            indicators.append(
                Indicator(
                    code="URL_SUSPICIOUS_TLD",
                    title=f"High-Risk Top-Level Domain (.{tld})",
                    severity=IndicatorSeverity.MEDIUM,
                    matched_text=f".{tld}",
                    description=f"The domain uses the '.{tld}' extension, which is disproportionately associated with disposable, low-cost phishing sites.",
                    category="Domain Structure",
                )
            )

        # 4. Brand Typosquatting / Spoofing Check
        has_typo, brand_mimicked = self._check_typosquatting(hostname)
        if has_typo and brand_mimicked:
            details.has_typosquatting = True
            details.target_brand_mimicked = brand_mimicked
            indicators.append(
                Indicator(
                    code="URL_BRAND_TYPOSQUATTING",
                    title=f"Suspected Brand Impersonation ({brand_mimicked.upper()})",
                    severity=IndicatorSeverity.CRITICAL,
                    matched_text=hostname,
                    description=f"The URL contains the name of {brand_mimicked.upper()}, but does not match any official, verified domain belonging to that organization.",
                    category="Brand Spoofing",
                )
            )

        # 5. Excessive Subdomain Nesting (e.g. sbi.bank.login.portal.domain.com)
        if len(domain_parts) >= 4 and not is_ip:
            details.has_excessive_subdomains = True
            indicators.append(
                Indicator(
                    code="URL_EXCESSIVE_SUBDOMAINS",
                    title="Deeply Nested Subdomain Structure",
                    severity=IndicatorSeverity.MEDIUM,
                    matched_text=hostname,
                    description="The domain has an unusually high number of subdomains, often structured to deceive users viewing only the start of the URL.",
                    category="Domain Structure",
                )
            )

        # 6. Excessive Hyphens in Domain (e.g., secure-login-sbi-portal-update.com)
        hyphen_count = hostname.count("-")
        if hyphen_count >= 3:
            indicators.append(
                Indicator(
                    code="URL_EXCESSIVE_HYPHENS",
                    title="Multiple Domain Hyphens",
                    severity=IndicatorSeverity.LOW,
                    matched_text=hostname,
                    description="Multiple hyphens in domain names are frequently used by fraudulent domains trying to stitch recognizable brand names together.",
                    category="Domain Structure",
                )
            )

        # 7. Credential Harvesting Keywords in Path or Query
        path_lower = (path + "?" + query).lower()
        phishing_path_keywords = [
            "kyc", "pan-update", "panupdate", "verify-account", "netbanking",
            "login.php", "signin.php", "ebank", "otp-verify", "apk", "claim-reward"
        ]
        matched_path_keywords = [kw for kw in phishing_path_keywords if kw in path_lower]
        if matched_path_keywords:
            details.suspicious_keywords_in_path = matched_path_keywords
            indicators.append(
                Indicator(
                    code="URL_SUSPICIOUS_PATH",
                    title="Sensitive Verification Keywords in Path",
                    severity=IndicatorSeverity.HIGH if has_typo else IndicatorSeverity.MEDIUM,
                    matched_text=", ".join(matched_path_keywords),
                    description=f"The URL path contains sensitive keywords ({', '.join(matched_path_keywords)}) typical of mock banking or credential capture portals.",
                    category="Phishing Path",
                )
            )

        # 8. Authority Obfuscation via '@' Symbol (http://legit.com@evil.com)
        if "@" in raw_url:
            details.has_at_symbol = True
            indicators.append(
                Indicator(
                    code="URL_AT_SYMBOL_OBFUSCATION",
                    title="URL Authority Obfuscation ('@' sign)",
                    severity=IndicatorSeverity.CRITICAL,
                    matched_text="@",
                    description="The URL uses an '@' character, which tricks browsers and users into ignoring the preceding domain and routing to the destination following the '@'.",
                    category="URL Obfuscation",
                )
            )

        # 9. Unusually Long URL
        if len(raw_url) > 100:
            details.is_unusually_long = True
            indicators.append(
                Indicator(
                    code="URL_UNUSUALLY_LONG",
                    title="Excessively Long URL Structure",
                    severity=IndicatorSeverity.LOW,
                    matched_text=f"{len(raw_url)} characters",
                    description="The link is unusually long, which can be an attempt to push malicious destination domains out of sight on mobile screens.",
                    category="URL Obfuscation",
                )
            )

        # 10. Non-HTTPS Connection Note
        if parsed.scheme.lower() == "http" and not is_ip:
            indicators.append(
                Indicator(
                    code="URL_INSECURE_HTTP",
                    title="Unencrypted HTTP Protocol",
                    severity=IndicatorSeverity.LOW,
                    matched_text="http://",
                    description="The link uses unencrypted HTTP. Note: Modern phishing sites frequently use HTTPS, so HTTPS alone never guarantees safety.",
                    category="Transport Security",
                )
            )

        return indicators, details
