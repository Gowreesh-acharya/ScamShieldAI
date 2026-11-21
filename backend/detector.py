import asyncio
import re
from difflib import SequenceMatcher
from unicodedata import normalize
from urllib.parse import urlsplit, urljoin

import httpx
import idna

# A small demonstration reference set, not an exhaustive ownership directory.
BRANDS = {
    "Demo Bank": ("example.com",),
    "India Post": ("indiapost.gov.in",),
    "HDFC Bank": ("hdfcbank.com",),
    "SBI": ("sbi.co.in", "onlinesbi.sbi", "sbi.bank.in"),
}
SHORT = {"bit.ly", "tinyurl.com"}
URL = re.compile(
    r"""https?://[^\s<>"'“”‘’]*"""
    r"""|(?<![\w@./%-])(?:[\w-]+\.)+(?:xn--[a-z0-9-]+|[a-z]{2,63})"""
    r"""(?![\w@%-]|\.+[\w-])(?:[:/?#][^\s<>"'“”‘’]*)?""",
    re.I,
)
URL_CLOSERS = {")": "(", "]": "[", "}": "{"}
URL_SCHEME = re.compile(r"[a-z][a-z0-9+.-]*://", re.I)
LATIN_CREDENTIAL = r"(?:OTP|UPI(?:\s+|\s*-\s*)PIN|(?:one[- ]time\s+)?verification\s+code|one[- ]time\s+password)"
HINDI_CREDENTIAL = rf"(?:ओटीपी|सत्यापन\s+कोड|यूपीआई\s+पिन|{LATIN_CREDENTIAL})"
KANNADA_CREDENTIAL = rf"(?:[ಒಓ]ಟಿಪಿ(?:ಯನ್ನು)?|ಪರಿಶೀಲನಾ\s+ಕೋಡ್|ಯುಪಿಐ\s+ಪಿನ್|{LATIN_CREDENTIAL})"
HINDI_REQUEST = rf"(?:अपना\s+)?{HINDI_CREDENTIAL}\s+(?:हमें\s+)?(?:भेजें|भेजो|बताएँ|बताएं|बताओ|साझा\s+करें)"
KANNADA_REQUEST = rf"(?:ನಿಮ್ಮ\s+)?{KANNADA_CREDENTIAL}\s+(?:ಅನ್ನು\s+)?(?:ಕಳುಹಿಸಿ|ಹಂಚಿಕೊಳ್ಳಿ)"
# Native words can end in combining marks, which Python's \b treats as non-word characters.
NATIVE_SEPARATORS = r"""\s.,;:!?।॥"'“”‘’()\[\]–—"""
SECRET = re.compile(
    rf"\b(?:(?:reply(?:\s+with)?|share|send|tell|enter)\s+"
    rf"(?:(?:us|me|your|the|apna|apni|with)\s+){{0,4}}{LATIN_CREDENTIAL}"
    rf"|{LATIN_CREDENTIAL}\s+(?:batao|bhejo|daalo|share\s+karo|de\s+do))\b"
    rf"|(?<![^{NATIVE_SEPARATORS}])(?:{HINDI_REQUEST}|{KANNADA_REQUEST})(?![^{NATIVE_SEPARATORS}])",
    re.I,
)
NEGATION = re.compile(
    r"\b(?:never|don['’]t|(?:do|should|must)\s+not|mat|not\s+to)"
    r"(?:(?:\s+|,\s*)(?:ever|under\s+any\s+circumstances),?)?"
    r"(?:\s+(?:share|send|tell|enter|reveal|disclose)\s+(?:or|nor))?\s*\Z",
    re.I,
)
QUOTED_TEXT = re.compile(r"""“[^”\r\n]+”|"[^"\r\n]+"|‘[^’\r\n]+’|(?<!\w)'[^'\r\n]+'(?!\w)""")
EXAMPLE_INTRO = re.compile(
    r"\b(?:scam\s+example|example\s+scam|example\s+of\s+(?:a\s+)?scam(?:\s+message)?|"
    r"scammers?\s+(?:may|might)\s+(?:say|write)|if\s+someone\s+says|"
    r"(?:do\s+not|don['’]t|never)\s+(?:reply|respond)\s+to(?:\s+messages?\s+(?:like|that\s+say))?)"
    r"\s*:?\s*\Z",
    re.I,
)
EXAMPLE_DESCRIPTION = re.compile(r"\s+is\s+(?:a\s+scam|an\s+example\s+of\s+(?:a\s+)?scam)\b", re.I)


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



def split_candidate(value):
    return urlsplit(value if URL_SCHEME.match(value) else "https://" + value)


def host(value):
    try:
        parsed = split_candidate(value)
        _ = parsed.port  # Reject malformed ports.
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            return ""
        return parsed.hostname.lower().rstrip(".")
    except ValueError:
        return ""


def hostname_for_comparison(name):
    """Return the ASCII reference name and Unicode spelling for a parsed hostname."""
    if ":" in name or (name.isascii() and not any(label.startswith("xn--") for label in name.split("."))):
        return name, name

    # Use NFC and strict IDNA2008. UTS #46 compatibility mapping is disabled.
    encoded = idna.encode(normalize("NFC", name), strict=True, uts46=False)
    return encoded.decode("ascii"), idna.decode(encoded, strict=True, uts46=False)


def trim_url(match):
    candidate = match.group()
    excess = {
        close: candidate.count(close) - candidate.count(opening)
        for close, opening in URL_CLOSERS.items()
    }
    before = match.start() - 1
    end = len(candidate)
    while end:
        tail = candidate[end - 1]
        if tail in ".,;!?":
            end -= 1
            continue
        if tail == ":" and candidate[end - 2] != ":":
            end -= 1
            continue
        if tail not in URL_CLOSERS or excess[tail] <= 0:
            break
        wrapped = before >= 0 and match.string[before] == URL_CLOSERS[tail]
        # An extra bracket in a host can make the address invalid.
        if tail != ")" and not wrapped:
            break
        if wrapped:
            before -= 1
        excess[tail] -= 1
        end -= 1
    return candidate[:end]


async def short_target(client, value):
    # Contact only the two named providers. Build the origin ourselves.
    # Never request the returned Location or forward credentials/query tokens.
    hostname = host(value)
    if hostname not in SHORT:
        return None
    parsed = split_candidate(value)
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


def secret_requests(message):
    example_spans = [
        quote.span()
        for quote in QUOTED_TEXT.finditer(message)
        if EXAMPLE_INTRO.search(message[max(0, quote.start() - 80):quote.start()])
        or EXAMPLE_DESCRIPTION.match(message, quote.end())
    ]
    for match in SECRET.finditer(message):
        before = message[max(0, match.start() - 80):match.start()]
        if NEGATION.search(before):
            continue
        if any(start <= match.start() and match.end() <= end for start, end in example_spans):
            continue
        yield match


async def analyze(content, client=None):
    urls = list(dict.fromkeys(trim_url(match) for match in URL.finditer(content)))
    # Preserve offsets while excluding URL paths from the language checks.
    message = URL.sub(lambda match: " " * len(match.group()), content)
    link_only = bool(urls) and not message.strip(" \r\n\t,;.")
    reasons, signals, highlights = [], [], []

    def add(label, weight, evidence, reason):
        if evidence not in highlights:
            highlights.append(evidence)
        if all(s["label"] != label for s in signals):
            signals.append({"label": label, "weight": weight})
        if reason not in reasons:
            reasons.append(reason)

    for match in secret_requests(message):
        evidence = content[match.start():match.end()]
        add("Request for a secret", 75, evidence, "The message asks for an OTP or payment PIN.")

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
        parsed = split_candidate(url)

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
        if re.search(
            r"%[0-9a-fA-F]{2}",
            parsed.hostname or ""
        ):

            add(
                "Encoded hostname",
                20,
                url,
                "The URL contains percent-encoded characters in "
                "its authority. Verify the destination independently."
            )

        try:
            ascii_name, unicode_name = hostname_for_comparison(name)
        except idna.IDNAError:
            add("Unreadable address", 25, url, "The website address could not be interpreted.")
            continue

        known_domain = any(ascii_name == d or ascii_name.endswith("." + d)
                           for domains in BRANDS.values() for d in domains)
        if not known_domain:
            for token in unicode_name.split(".")[:-1]:
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
                ascii_name == domain or ascii_name.endswith("." + domain)
                for domain in domains
            )

            if is_listed_domain:
                continue

            has_brand_label = any(
                re.search(
                    r"(?:^|[.-])" + re.escape(alias) + r"(?:$|[.-])",
                    unicode_name,
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
                if not any(ascii_name == d or ascii_name.endswith("." + d) for d in domains):
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
