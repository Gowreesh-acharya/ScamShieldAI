import os
from typing import Literal

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from detector import analyze

app = FastAPI(title="ScamShield", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class ScanInput(BaseModel):

    content: str = Field(min_length=1, max_length=5000)


    @field_validator("content")
    @classmethod
    def require_content(cls, value):
        if not value.strip():
            raise ValueError("Paste a message or link.")
        return value.strip()


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


@app.post("/api/analyze", response_model=ScanResult)
async def scan(payload: ScanInput):
    if os.getenv("SCAMSHIELD_LOOKUP") == "1":
        async with httpx.AsyncClient(timeout=3, trust_env=False, follow_redirects=False) as client:
            return await analyze(payload.content, client)
    return await analyze(payload.content)
