"""Unit tests for high-risk scam messages across all 15 categories,
including English and Hinglish variants.
All scenarios must produce HIGH RISK (score >= 61).
"""

from ai_engine import analyze_message


def test_fake_kyc_and_bank_impersonation() -> None:
    msg = "Dear SBI user, your account will be blocked today. Complete KYC immediately at http://bit.ly/sbi-kyc"
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH", f"Expected HIGH risk, got {result['risk_level']}"
    assert result["risk_score"] >= 61
    assert any(ind["code"] == "FAKE_KYC" for ind in result["detected_indicators"])


def test_otp_and_credential_theft() -> None:
    msg = "Urgent: Share your OTP immediately to verify your transaction and prevent account suspension."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert result["risk_score"] >= 61
    assert any(ind["code"] == "CREDENTIAL_THEFT_REQUEST" for ind in result["detected_indicators"])


def test_electricity_utility_disconnection_threat() -> None:
    msg = (
        "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from "
        "electricity office because your previous month bill was not updated. Call helpline immediately."
    )
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert any("GOVT_UTILITY" in ind["code"] for ind in result["detected_indicators"])


def test_sim_deactivation_threat() -> None:
    msg = "Important notice from TRAI: Your SIM card will be deactivated within 24 hours. Submit documents to keep active."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert any("SIM_DEACTIVATION" in ind["code"] for ind in result["detected_indicators"])


def test_lottery_and_kbc_scam() -> None:
    msg = "Congratulations! You have won Rs 25,00,000 in KBC Lucky Draw winner lottery. Contact head office to claim your cash prize."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert any("LOTTERY" in ind["code"] for ind in result["detected_indicators"])


def test_fake_part_time_job_scam() -> None:
    msg = "Part time work from home job: Earn Rs 3000 to 5000 daily by liking YouTube videos. Join our Telegram task job."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert any("JOB" in ind["code"] for ind in result["detected_indicators"])


def test_crypto_investment_doubler() -> None:
    msg = "Guaranteed return of 200% in 7 days! Double your investment with our automated crypto trading robot."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert any("INVESTMENT_CRYPTO" in ind["code"] for ind in result["detected_indicators"])


def test_family_emergency_impersonation() -> None:
    msg = "Hi Mom, I dropped and broke my phone. This is my new number. Urgent help needed, please transfer money."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert any("FAMILY_IMPERSONATION" in ind["code"] for ind in result["detected_indicators"])


def test_upi_qr_code_fraud() -> None:
    msg = "Scan this QR code to receive money of Rs 10,000 cashback directly in your Google Pay account."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert any("UPI_QR_FRAUD" in ind["code"] for ind in result["detected_indicators"])


def test_fake_support_and_remote_access_apk() -> None:
    msg = "Download our support app sbi_update.apk and install AnyDesk to verify your pending refund."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert any("FAKE_SUPPORT_APK" in ind["code"] for ind in result["detected_indicators"])


def test_hinglish_kyc_threat() -> None:
    msg = "Aapka account block ho jayega. Turant KYC update karein nahi toh aaj hi block kar diya jayega."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
    assert result["risk_score"] >= 61


def test_hinglish_electricity_threat() -> None:
    msg = "Bijli connection kat diya jayega aaj raat. Bill turant pay karein."
    result = analyze_message(msg)
    assert result["risk_level"] == "HIGH"
