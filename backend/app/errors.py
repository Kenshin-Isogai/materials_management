from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class AppError(Exception):
    code: str
    message: str
    status_code: int = 400
    details: dict[str, Any] | None = None

    def __str__(self) -> str:  # pragma: no cover - convenience only
        return f"{self.code}: {self.message}"

