"""Request bodies. Responses are plain JSON documented by example in /docs."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.constants import CHANNELS, MERCHANT_CATEGORIES, TRANSACTION_TYPES


class _TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, examples=[1249.99])
    type: str = Field(..., description=f"One of {TRANSACTION_TYPES}", examples=["PURCHASE"])
    merchant_category: str | None = Field(None, description=f"One of {MERCHANT_CATEGORIES}", examples=["electronics"])
    channel: str | None = Field(None, description=f"One of {CHANNELS}", examples=["WEB"])
    country: str | None = Field(None, min_length=2, max_length=2, examples=["US"])
    timestamp: datetime | None = None
    is_vpn: bool | None = None
    ip_risk_score: float | None = Field(None, ge=0, le=1)
    failed_logins_24h: int | None = Field(None, ge=0)

    @field_validator("type")
    @classmethod
    def _type(cls, v: str) -> str:
        if v.upper() not in TRANSACTION_TYPES:
            raise ValueError(f"type must be one of {TRANSACTION_TYPES}")
        return v.upper()

    @field_validator("channel")
    @classmethod
    def _channel(cls, v: str | None) -> str | None:
        if v is not None and v.upper() not in CHANNELS:
            raise ValueError(f"channel must be one of {CHANNELS}")
        return v.upper() if v else v

    @field_validator("merchant_category")
    @classmethod
    def _category(cls, v: str | None) -> str | None:
        if v is not None and v.lower() not in MERCHANT_CATEGORIES:
            raise ValueError(f"merchant_category must be one of {MERCHANT_CATEGORIES}")
        return v.lower() if v else v

    @field_validator("country")
    @classmethod
    def _country(cls, v: str | None) -> str | None:
        return v.upper() if v else v


class TransactionCreate(_TransactionBase):
    """A new transaction. Velocity, account age, device age and spend ratio are derived
    from the customer's history; device-intelligence signals may be supplied."""

    customer_id: str = Field(..., min_length=1, examples=["CUST-00042"])
    ip_address: str | None = Field(None, examples=["185.220.101.7"])
    device_id: str | None = Field(None, examples=["dev_4f2a91c03b7e"])


class ScoreRequest(_TransactionBase):
    """A fully specified what-if scenario. Nothing is stored."""

    home_country: str | None = Field(None, min_length=2, max_length=2)
    account_age_days: float | None = Field(None, ge=0)
    device_age_days: float | None = Field(None, ge=0)
    is_new_device: bool | None = None
    txn_count_1h: int | None = Field(None, ge=0)
    txn_count_24h: int | None = Field(None, ge=0)
    amount_to_avg_ratio: float | None = Field(None, ge=0)
    distance_from_home_km: float | None = Field(None, ge=0)

    @field_validator("home_country")
    @classmethod
    def _home(cls, v: str | None) -> str | None:
        return v.upper() if v else v


class ReviewRequest(BaseModel):
    decision: Literal["approve", "block"]
    note: str | None = Field(None, max_length=500)
