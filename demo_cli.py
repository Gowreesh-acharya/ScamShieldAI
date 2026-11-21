"""Interactive command-line tool to test ScamShield AI Detection Engine.
Usage:
    python demo_cli.py
    python demo_cli.py --message "Your SBI account is blocked. Update KYC at http://bit.ly/sbi-kyc"
    python demo_cli.py --url "http://192.168.1.1/login.php"
"""

import argparse
import json
import sys
from ai_engine import analyze_input, analyze_message, analyze_url


def print_result(result: dict) -> None:
    print("\n" + "=" * 60)
    print(f"  SCAMSHIELD AI - DETECTION REPORT")
    print("=" * 60)
    print(f"Target:      {result.get('analyzed_target')}")
    print(f"Input Type:  {result.get('input_type')}")
    print(f"Risk Score:  {result.get('risk_score')} / 100")
    print(f"Risk Level:  {result.get('risk_level')}")
    print(f"Verdict:     {result.get('verdict')}")
    if result.get("scam_category"):
        print(f"Category:    {result.get('scam_category')}")
    
    print("\n[!] DETECTED WARNING INDICATORS:")
    indicators = result.get("detected_indicators", [])
    if not indicators:
        print("  - None (Content appears normal)")
    else:
        for idx, ind in enumerate(indicators, 1):
            print(f"  {idx}. [{ind['severity']}] {ind['title']}")
            print(f"     Evidence: \"{ind['matched_text']}\"")
            print(f"     Reason:   {ind['description']}")

    print("\n[i] EXPLAINABLE SUMMARY:")
    print(f"  {result.get('explanation')}")

    print("\n[>] ACTIONABLE RECOMMENDATIONS:")
    for rec in result.get("recommendations", []):
        print(f"  * {rec}")

    print("\n" + "-" * 60)
    print(f"Disclaimer: {result.get('disclaimer')}")
    print("=" * 60 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="ScamShield AI Detection Engine CLI")
    parser.add_argument("-m", "--message", type=str, help="Message text to analyze")
    parser.add_argument("-u", "--url", type=str, help="URL to analyze")
    parser.add_argument("--json", action="store_true", help="Output raw JSON format")
    args = parser.parse_args()

    if args.message:
        res = analyze_message(args.message)
    elif args.url:
        res = analyze_url(args.url)
    else:
        print("Welcome to ScamShield AI Detection Engine (Build Bengaluru 2.0)")
        print("Enter a message, SMS, email, or URL to analyze (or type 'exit' to quit):")
        while True:
            try:
                user_input = input("\nScamShield > ").strip()
                if not user_input or user_input.lower() in ("exit", "quit"):
                    break
                res = analyze_input(user_input)
                print_result(res)
            except (KeyboardInterrupt, EOFError):
                break
        return

    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print_result(res)


if __name__ == "__main__":
    main()
