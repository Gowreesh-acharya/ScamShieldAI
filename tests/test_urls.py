"""Unit tests for URL scam and heuristic detection.
Tests legitimate domains, IP-address-based URLs, URL shorteners,
suspicious TLDs, and brand typosquatting against Indian banking entities.
Never connects to remote links.
"""

from ai_engine import analyze_url


def test_legitimate_sbi_domain() -> None:
    url = "https://www.onlinesbi.sbi/portal/index.html"
    result = analyze_url(url)
    assert result["risk_level"] == "LOW", f"Expected LOW risk for legitimate domain, got {result['risk_level']}"
    assert result["risk_score"] <= 30


def test_legitimate_hdfc_domain() -> None:
    url = "https://www.hdfcbank.com/personal/ways-to-bank/online-banking"
    result = analyze_url(url)
    assert result["risk_level"] == "LOW"
    assert result["risk_score"] <= 30


def test_raw_ip_address_url() -> None:
    url = "http://192.168.1.50/sbi/login.php"
    result = analyze_url(url)
    assert result["risk_level"] == "HIGH", f"Expected HIGH risk for raw IP with banking path, got {result['risk_level']}"
    assert any(ind["code"] == "URL_RAW_IP_HOST" for ind in result["detected_indicators"])


def test_url_shortener_alone_is_warning_not_definitive_scam() -> None:
    url = "https://bit.ly/summer-sale"
    result = analyze_url(url)
    # A shortener alone is a warning signal (MEDIUM risk), not HIGH risk proof of scam
    assert result["risk_level"] == "MEDIUM", f"Expected MEDIUM risk, got {result['risk_level']}"
    assert any(ind["code"] == "URL_SHORTENER" for ind in result["detected_indicators"])


def test_brand_typosquatting_and_suspicious_tld() -> None:
    url = "http://sbi-kyc-update.xyz/netbanking/login.php"
    result = analyze_url(url)
    assert result["risk_level"] == "HIGH", f"Expected HIGH risk, got {result['risk_level']}"
    assert result["risk_score"] >= 61
    assert any(ind["code"] == "URL_BRAND_TYPOSQUATTING" for ind in result["detected_indicators"])
    assert any(ind["code"] == "URL_SUSPICIOUS_TLD" for ind in result["detected_indicators"])


def test_excessive_subdomains() -> None:
    url = "http://secure.account.login.update.portal.fakehost.com/verify"
    result = analyze_url(url)
    assert any(ind["code"] == "URL_EXCESSIVE_SUBDOMAINS" for ind in result["detected_indicators"])


def test_at_symbol_obfuscation() -> None:
    url = "http://onlinesbi.sbi@evil-attacker-site.com/login"
    result = analyze_url(url)
    assert result["risk_level"] == "HIGH"
    assert any(ind["code"] == "URL_AT_SYMBOL_OBFUSCATION" for ind in result["detected_indicators"])
