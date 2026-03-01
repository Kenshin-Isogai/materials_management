from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api import create_app
from app.db import get_connection, init_db


@pytest.fixture
def db_path(tmp_path: Path) -> Path:
    return tmp_path / "inventory.db"


@pytest.fixture
def conn(db_path: Path):
    init_db(str(db_path))
    connection = get_connection(str(db_path))
    try:
        yield connection
    finally:
        connection.close()


@pytest.fixture
def client(db_path: Path):
    app = create_app(db_path=str(db_path))
    with TestClient(app) as test_client:
        yield test_client

