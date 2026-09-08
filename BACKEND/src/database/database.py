"""SQLite database connection and initialization for PACKSCAN AI."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from config import PATHS

DB_PATH = PATHS.database_dir / "packscan.db"


def get_db_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """Return an SQLite database connection with row factory configured."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Path = DB_PATH) -> None:
    """Create the scans table if it does not already exist."""
    conn = get_db_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scans (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    product_name TEXT,
                    category TEXT,
                    final_status TEXT NOT NULL,
                    overall_confidence REAL NOT NULL,
                    detected_count INTEGER NOT NULL,
                    summary_note TEXT,
                    image_path TEXT,
                    result_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
    finally:
        conn.close()
