import os
import unicodedata
from typing import Literal

import httpx
from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from detector import analyze
from request_protection import ScanRequestProtection

router = APIRouter()

VALIDATION_MESSAGES = {
    "missing": "Content is required.",
    "string_type": "Content must be a string.",
    "string_too_short": "Content must contain at least one character.",
    "string_too_long": "Content must contain at most 5,000 characters.",
    "value_error": "Paste a message or link.",
    "json_invalid": "Send a valid JSON object.",
}


async def invalid_request(_request: Request, error: RequestValidationError):
    details = []
    for item in error.errors():
        code = item["type"]
        location = ["body", "content"] if tuple(item["loc"]) == ("body", "content") else ["body"]
        if code not in VALIDATION_MESSAGES:
            code = "invalid_body"
        details.append(
            {"type": code, "loc": location, "msg": VALIDATION_MESSAGES.get(code, "Invalid request body.")}
        )
    return JSONResponse({"detail": details}, status_code=422)


class ScanInput(BaseModel):

    content: str = Field(min_length=1, max_length=5000)


    @field_validator("content")
    @classmethod
    def require_content(cls, value):
        content = value.strip()
        # A visually blank selection may contain Unicode format (Cf) characters.
        if all(char.isspace() or unicodedata.category(char) == "Cf" for char in content):
            raise ValueError("Paste a message or link.")
        return content


class Signal(BaseModel):
    label: str
    weight: int


class ScanResult(BaseModel):
    verdict: Literal["SAFE", "SUSPICIOUS", "HIGH_RISK"]
    score: int = Field(ge=0, le=100)
    link_only: bool
    notice: str | None
    highlighted_phrases: list[str]
    extracted_urls: list[str]
    unrolled_urls: list[str]
    signals: list[Signal]
    reason: str
    action: str
    safety_tip: str


@router.post("/api/analyze", response_model=ScanResult)
async def scan(payload: ScanInput, request: Request):
    if not request.app.state.public_mode and os.getenv("SCAMSHIELD_LOOKUP") == "1":
        async with httpx.AsyncClient(timeout=3, trust_env=False, follow_redirects=False) as client:
            return await analyze(payload.content, client)
    return await analyze(payload.content)


def create_app(*, public_mode=False):
    application = FastAPI(
        title="ScamShield",
        version="1.0",
        openapi_url=None if public_mode else "/openapi.json",
        redirect_slashes=not public_mode,
    )
    application.state.public_mode = public_mode
    application.add_middleware(ScanRequestProtection, rate_limited=public_mode)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["POST"],
        allow_headers=["Content-Type"],
        expose_headers=["Retry-After"],
    )
    application.add_exception_handler(RequestValidationError, invalid_request)
    application.include_router(router)
    return application


app = create_app(public_mode=os.getenv("SCAMSHIELD_PUBLIC_MODE") == "1")
