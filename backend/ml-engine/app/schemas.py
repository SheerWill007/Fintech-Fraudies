from pydantic import BaseModel, Field, field_validator

class TransactionInput(BaseModel):
    transactionId: str = Field(..., min_length=1, description="Unique transaction ID")
    userId: str = Field(..., min_length=1, description="User identifier")
    amount: float = Field(
        ..., gt=0, description="Transaction amount (must be positive)"
    )
    type: str = Field(
        ..., description="Transaction type: DEPOSIT, WITHDRAWAL, TRANSFER, or PURCHASE"
    )
    ipAddress: str | None = Field(default=None, description="Originating IP address")
    deviceId: str | None = Field(default=None, description="Device fingerprint / ID")

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"DEPOSIT", "WITHDRAWAL", "TRANSFER", "PURCHASE"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError(f"type must be one of {allowed}, got '{v}'")
        return upper


class RiskScoreOutput(BaseModel):
    transactionId: str
    riskScore: float = Field(..., ge=0.0, le=1.0)
    status: str  # APPROVED | PENDING | FLAGGED
    factors: list[str]
