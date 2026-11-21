"""Unified standalone test runner for ScamShield AI Detection Engine.
Executes all test suites, validates outputs, and outputs a clean report.
Does not require external pytest or third-party test runners.
"""

import inspect
import sys
import time

# Ensure project root is in python path
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import tests.test_safe_messages as t_safe
import tests.test_suspicious_messages as t_suspicious
import tests.test_scam_messages as t_scam
import tests.test_urls as t_urls
import tests.test_scoring as t_scoring


def run_module_tests(module, module_name: str) -> tuple[int, int]:
    print(f"\n>> Running: {module_name}")
    print("-" * 65)
    passed = 0
    failed = 0

    test_functions = [
        (name, func)
        for name, func in inspect.getmembers(module, inspect.isfunction)
        if name.startswith("test_")
    ]

    for name, func in test_functions:
        try:
            func()
            print(f"  [PASS] {name}")
            passed += 1
        except AssertionError as e:
            print(f"  [FAIL] {name}")
            print(f"         Error: {e}")
            failed += 1
        except Exception as e:
            print(f"  [ERROR] {name}")
            print(f"          Exception: {type(e).__name__}: {e}")
            failed += 1

    return passed, failed


def main() -> None:
    start_time = time.time()
    print("=" * 65)
    print("  SCAMSHIELD AI - TEST SUITE RUNNER (Build Bengaluru 2.0)")
    print("=" * 65)

    suites = [
        (t_safe, "Safe & Routine Messages Suite"),
        (t_suspicious, "Suspicious & Borderline Messages Suite"),
        (t_scam, "Scam Messages Suite (15 Categories + Hinglish)"),
        (t_urls, "URL Detection & Typosquatting Suite"),
        (t_scoring, "Risk Scoring, Boundaries & Contracts Suite"),
    ]

    total_passed = 0
    total_failed = 0

    for mod, desc in suites:
        p, f = run_module_tests(mod, desc)
        total_passed += p
        total_failed += f

    elapsed = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"  TEST SUMMARY:")
    print(f"  Total Tests: {total_passed + total_failed}")
    print(f"  Passed:      {total_passed}")
    print(f"  Failed:      {total_failed}")
    print(f"  Time Taken:  {elapsed:.3f} seconds")
    print("=" * 65)

    if total_failed == 0:
        print(">> ALL TESTS PASSED SUCCESSFULLY! ENGINE IS READY FOR DEMO <<\n")
        sys.exit(0)
    else:
        print(f">> WARNING: {total_failed} TESTS FAILED. PLEASE REVIEW ABOVE <<\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
