"""Public input validation. Units are carried in every continuous setting name."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Settings(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)

    scenario_id: Literal["steel-shaft", "tight-finish"] = "steel-shaft"
    mode: Literal["trial", "week"] = "trial"
    speed_m_min: float = Field(default=180.0, ge=80, le=300)
    feed_mm_rev: float = Field(default=0.18, ge=0.08, le=0.4)
    change_after_parts: int = Field(default=20, ge=1, le=200)
    inspect_every: int = Field(default=5, ge=1, le=200)
    quantity: int = Field(default=10, ge=1, le=5000)
    seed: int = Field(default=42, ge=0, le=2147483647)
    logging: bool = True
    stop_on_reject: bool = False
    release_policy: Literal["sample", "final"] = "sample"
    inspection_offset: int = Field(default=0, ge=0, le=199)

    @model_validator(mode="after")
    def valid_inspection_offset(self):
        if self.inspection_offset >= self.inspect_every:
            raise ValueError("Inspectieverschuiving moet kleiner zijn dan het inspectie-interval.")
        return self
