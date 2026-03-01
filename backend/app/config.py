from __future__ import annotations

import os
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]

DEFAULT_DB_PATH = BACKEND_ROOT / "database" / "inventory.db"
DEFAULT_EXPORTS_DIR = WORKSPACE_ROOT / "exports"
QUOTATIONS_ROOT = WORKSPACE_ROOT / "quotations"
QUOTATIONS_REGISTERED_ROOT = QUOTATIONS_ROOT / "registered"
QUOTATIONS_UNREGISTERED_ROOT = QUOTATIONS_ROOT / "unregistered"
QUOTATIONS_REGISTERED_CSV_ROOT = QUOTATIONS_REGISTERED_ROOT / "csv_files"
QUOTATIONS_REGISTERED_PDF_ROOT = QUOTATIONS_REGISTERED_ROOT / "pdf_files"
QUOTATIONS_UNREGISTERED_CSV_ROOT = QUOTATIONS_UNREGISTERED_ROOT / "csv_files"
QUOTATIONS_UNREGISTERED_PDF_ROOT = QUOTATIONS_UNREGISTERED_ROOT / "pdf_files"
AUTH_MODE_NONE = "none"
AUTH_MODE_DRY_RUN = "rbac_dry_run"
AUTH_MODE_ENFORCED = "rbac_enforced"


def resolve_db_path(explicit: str | None = None) -> Path:
    raw = explicit or os.getenv("INVENTORY_DB_PATH")
    if raw:
        return Path(raw).expanduser().resolve()
    return DEFAULT_DB_PATH


def get_auth_mode() -> str:
    raw = (os.getenv("INVENTORY_AUTH_MODE") or AUTH_MODE_NONE).strip().lower()
    if raw not in {AUTH_MODE_NONE, AUTH_MODE_DRY_RUN, AUTH_MODE_ENFORCED}:
        return AUTH_MODE_NONE
    return raw


def ensure_workspace_layout() -> None:
    for path in (
        DEFAULT_DB_PATH.parent,
        DEFAULT_EXPORTS_DIR,
        QUOTATIONS_ROOT,
        QUOTATIONS_REGISTERED_ROOT,
        QUOTATIONS_UNREGISTERED_ROOT,
        QUOTATIONS_REGISTERED_CSV_ROOT,
        QUOTATIONS_REGISTERED_PDF_ROOT,
        QUOTATIONS_UNREGISTERED_CSV_ROOT,
        QUOTATIONS_UNREGISTERED_PDF_ROOT,
    ):
        path.mkdir(parents=True, exist_ok=True)
