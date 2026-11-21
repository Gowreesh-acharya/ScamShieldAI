import asyncio
import re
from difflib import SequenceMatcher
from urllib.parse import urlsplit, urljoin

import httpx

# A small demonstration reference set, not an exhaustive ownership directory.
BRANDS = {
    "Demo Bank": ("example.com",),
    "India Post": ("indiapost.gov.in",),
    "HDFC Bank": ("hdfcbank.com",),
    "SBI": ("sbi.co.in", "onlinesbi.sbi", "sbi.bank.in"),
}
SHORT = {"bit.ly", "tinyurl.com"}
URL = re.compile(r"(?i)(?:https?://[^\s<>\"']+|(?<![\w@./-])(?:[\w-]+\.)+(?:[a-z]{2,63})\b(?:/[^\s<>\"']*)?)")
SECRET = re.compile(r"\b(?:(?:reply(?:\s+with)?|share|send|tell|enter)\s+(?:(?:us|me|your|the|apna|apni|with)\s+){0,4}(?:OTP|UPI\s+PIN)|(?:OTP|UPI\s+PIN)\s+(?:batao|bhejo|daalo|share\s+karo))\b", re.I)
NEGATION = re.compile(r"(?:\bnever|\bdon['’]t|\bdo\s+not|\bmat|\bdon’t\s+ever)(?:\s+ever)?\s*$", re.I)


URGENCY = re.compile(
    r"(?:"
    r"\b(?:in\s+\d+\s+(?:minutes?|hours?)|"
    r"khata\s+band|KYC\s+expired|"
    r"account\s+(?:will\s+be\s+)?blocked|"
    r"bank\s+account\s+(?:aaj\s+)?block\s+ho\s+jayega)\b"
    r"|ಬ್ಯಾಂಕ್\s+ಖಾತೆ\s+ಬ್ಲಾಕ್\s+ಆಗುತ್ತದೆ"
    r")",
    re.I
)



def host(value):
    try:
        parsed = urlsplit(value if "://" in value else "https://" + value)
        _ = parsed.port  # Reject malformed ports.
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            return ""
        return parsed.hostname.lower().rstrip(".")
    except ValueError:
        return ""


async def short_target(client, value):
    # Contact only the two named providers. Build the origin ourselves.
    # Never request the returned Location or forward credentials/query tokens.
    hostname = host(value)
    if hostname not in SHORT:
        return None
    parsed = urlsplit(value if "://" in value else "https://" + value)
    if not re.fullmatch(r"/[A-Za-z0-9_-]{1,128}/?", parsed.path) or parsed.query or parsed.username:
        return None
    origin = "https://" + hostname + parsed.path
    try:
        response = await client.head(origin)
        if response.status_code in {301, 302, 303, 307, 308} and response.headers.get("location"):
            target = urljoin(origin, response.headers["location"])
            if host(target) and urlsplit(target).scheme in {"http", "https"}:
                return target
    except (httpx.HTTPError, ValueError):
        pass
    return None


async def analyze(content, client=None):
    matches = list(URL.finditer(content))
    urls = list(dict.fromkeys(m.group().rstrip(".,;:!?)]}") for m in matches))
    link_only = bool(urls) and not URL.sub("", content).strip(" \r\n\t,;.")
    reasons, signals, highlights = [], [], []

    def add(label, weight, evidence, reason):
        if evidence not in highlights:
            highlights.append(evidence)
        if all(s["label"] != label for s in signals):
            signals.append({"label": label, "weight": weight})
        if reason not in reasons:
            reasons.append(reason)

    # Preserve offsets while excluding URL paths from the language checks.
    message = URL.sub(lambda m: " " * len(m.group()), content)
    for m in SECRET.finditer(message):
        if not NEGATION.search(message[max(0, m.start()-32):m.start()]):
            add("Request for a secret", 75, m.group(), "The message asks for an OTP or payment PIN.")

    for m in URGENCY.finditer(message):
        before = message[max(0, m.start() - 50):m.start()]
        after = message[m.end():m.end() + 80]

        is_safety_warning = (
            re.search(r"\bagar\s+koi\s+bole\s*$", before, re.I)
            and re.search(
                r"^\s*,?\s*toh\s+unki\s+baat\s+par\s+bharosa\s+mat\s+karo\b",
                after,
                re.I
            )
        )

        if is_safety_warning:
            continue

        add(
            "Pressure or threat",
            20,
            m.group(),
            "The wording creates pressure to act quickly."
        )


    short_urls = [u for u in urls if host(u) in SHORT]
    targets = {}
    if client and short_urls:
        batch = short_urls[:4]
        try:
            values = await asyncio.wait_for(asyncio.gather(*(short_target(client, u) for u in batch)), 3)
            targets = dict(zip(batch, values))
        except asyncio.TimeoutError:
            pass
    for url in urls:
        name = host(url)
        if not name:
            add("Unreadable address", 25, url, "The website address could not be interpreted.")
            continue

        # Detect URLs with misleading user information before @.
        parsed = urlsplit(
            url if "://" in url else "https://" + url
        )

        if parsed.username is not None or parsed.password is not None:
            add(
                "Misleading URL userinfo",
                35,
                url,
                "The address contains user information before @. "
                f"The actual website hostname is {name}."
            )

        if name in SHORT:
            target = targets.get(url)
            if not target:
                add("Hidden destination", 25, url, "The shortened link's destination is unknown.")
                continue
            name = host(target)
            add("Shortened link", 20, url, "The provider returned a redirect address. Further redirects were not checked.")
        # Compare longer brand labels only. Fuzzy matches are weak evidence.

        # Detect percent-encoded characters in the URL authority.
        parsed_url = urlsplit(url)


        if re.search(
            r"%[0-9a-fA-F]{2}",
            parsed_url.hostname or ""
        ):

            add(
                "Encoded hostname",
                20,
                url,
                "The URL contains percent-encoded characters in "
                "its authority. Verify the destination independently."
            )

        known_domain = any(name == d or name.endswith("." + d)
                           for domains in BRANDS.values() for d in domains)
        if not known_domain:
            for token in name.split(".")[:-1]:
                for reference in ("hdfcbank", "indiapost"):
                    similarity = SequenceMatcher(None, token, reference).ratio()
                    if 0.82 <= similarity < 1:
                        add("Similar brand spelling", 20, url,
                            f"The address contains '{token}', which resembles '{reference}'. Verify the spelling.")

        # Detect SBI branding in a link-only hostname.

        # Reusable brand impersonation detection.
        brand_aliases = {
            "SBI": ("sbi", "onlinesbi"),
            "HDFC Bank": ("hdfcbank",),
            "India Post": ("indiapost",),
        }

        for brand, aliases in brand_aliases.items():
            domains = BRANDS[brand]

            is_listed_domain = any(
                name == domain or name.endswith("." + domain)
                for domain in domains
            )

            if is_listed_domain:
                continue

            has_brand_label = any(
                re.search(
                    r"(?:^|[.-])" + re.escape(alias) + r"(?:$|[.-])",
                    name,
                    re.I
                )
                for alias in aliases
            )

            if has_brand_label:
                add(
                    "Brand and domain differ",
                    35,
                    url,
                    f"{name} is outside the listed reference "
                    f"domains for {brand}."
                )

        for brand, domains in BRANDS.items():
            if re.search(r"\b" + re.escape(brand) + r"\b", message, re.I):
                if not any(name == d or name.endswith("." + d) for d in domains):
                    add("Brand and domain differ", 35, url, f"{name} is outside the listed reference domains for {brand}.")
    score = min(100, sum(s["weight"] for s in signals))
    verdict = "HIGH_RISK" if score >= 70 else "SUSPICIOUS" if score else "SAFE"
    return dict(
        verdict=verdict, score=score, link_only=link_only,
        notice="Only the link was checked." if link_only else None,
        highlighted_phrases=highlights, extracted_urls=urls,
        unrolled_urls=list(dict.fromkeys(t for t in targets.values() if t)),
        signals=signals, reason=" ".join(reasons) or "No obvious warning signs found by these checks. Sender identity is unverified.",
        action=("Keep your OTP or PIN private. Verify through the original app." if any(s["label"] == "Request for a secret" for s in signals)
                else "Check through the organization's official app or a known contact." if signals
                else "Verify unexpected requests independently before acting."),
        safety_tip="For suspected fraudulent calls, SMS or WhatsApp messages in India, use Chakshu. If you have lost money to cyber fraud, call 1930 immediately.",
    )
