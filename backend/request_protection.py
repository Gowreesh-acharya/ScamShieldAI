import asyncio
import logging
from collections import Counter
from math import ceil
from time import monotonic

from starlette.datastructures import Headers, MutableHeaders
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse

MAX_BODY_BYTES = 64 * 1024
BODY_READ_TIMEOUT_SECONDS = 5
RATE_WINDOW_SECONDS = 60
PEER_REQUEST_LIMIT = 60
SERVICE_REQUEST_LIMIT = 240

logger = logging.getLogger(__name__)


class ScanRateLimit:
    def __init__(self):
        self.window_end = 0
        self.total = 0
        self.by_peer = Counter()

    def retry_after(self, peer):
        now = monotonic()
        if now >= self.window_end:
            self.window_end = now + RATE_WINDOW_SECONDS
            self.total = 0
            self.by_peer.clear()

        if self.total >= SERVICE_REQUEST_LIMIT or self.by_peer[peer] >= PEER_REQUEST_LIMIT:
            return ceil(self.window_end - now)

        self.total += 1
        self.by_peer[peer] += 1
        return None


class ScanRequestProtection:
    def __init__(self, app, *, rate_limited):
        self.app = app
        self.rate_limit = ScanRateLimit() if rate_limited else None

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST" or scope["path"] != "/api/analyze":
            await self.app(scope, receive, send)
            return

        response_started = False

        async def send_without_caching(message):
            nonlocal response_started
            if message["type"] == "http.response.start":
                MutableHeaders(scope=message)["Cache-Control"] = "no-store"
                response_started = True
            await send(message)

        async def reject(status, detail, headers=None):
            response = JSONResponse({"detail": detail}, status_code=status, headers=headers)
            await response(scope, receive, send_without_caching)

        if self.rate_limit is not None:
            # Production Uvicorn passes the socket peer with proxy headers disabled.
            client = scope.get("client")
            retry_after = self.rate_limit.retry_after(client[0] if client else None)
            if retry_after is not None:
                await reject(429, "Too many scan requests.", {"Retry-After": str(retry_after)})
                return

        headers = Headers(scope=scope)
        encodings = headers.getlist("content-encoding")
        if encodings and (len(encodings) != 1 or encodings[0].strip().lower() != "identity"):
            await reject(415, "Send an uncompressed JSON request.")
            return

        content_length = headers.get("content-length", "0")
        if not content_length.isascii() or not content_length.isdecimal():
            await reject(400, "Invalid Content-Length.")
            return
        significant_length = content_length.lstrip("0") or "0"
        if len(significant_length) > len(str(MAX_BODY_BYTES)) or int(significant_length) > MAX_BODY_BYTES:
            await reject(413, "Request body exceeds 64 KiB.")
            return

        received = 0
        deadline = asyncio.get_running_loop().time() + BODY_READ_TIMEOUT_SECONDS

        async def receive_limited():
            nonlocal received
            try:
                async with asyncio.timeout_at(deadline):
                    message = await receive()
            except TimeoutError:
                raise HTTPException(408, "Request body took too long to arrive.") from None

            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > MAX_BODY_BYTES:
                    raise HTTPException(413, "Request body exceeds 64 KiB.")
            return message

        try:
            await self.app(scope, receive_limited, send_without_caching)
        except Exception:
            if response_started:
                raise
            # Exception messages and traceback details can include submitted content.
            logger.error("Unexpected error processing a scan request")
            await reject(500, "The scan could not be completed.")
