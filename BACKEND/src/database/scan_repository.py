"""Repository for persisting and querying scan history."""

from __future__ import annotations

import json
from typing import Any

from src.database.database import get_db_connection, init_db


class ScanRepository:
    """Store and retrieve scan records from SQLite."""

    def __init__(self) -> None:
        init_db()

    def save_scan(
        self,
        scan_id: str,
        timestamp: str,
        product_name: str | None,
        category: str | None,
        final_status: str,
        overall_confidence: float,
        detected_count: int,
        summary_note: str,
        image_path: str | None,
        result_dict: dict[str, Any],
    ) -> None:
        """Insert or replace a scan record."""
        conn = get_db_connection()
        try:
            with conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO scans (
                        id, timestamp, product_name, category, final_status,
                        overall_confidence, detected_count, summary_note,
                        image_path, result_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        scan_id,
                        timestamp,
                        product_name,
                        category,
                        final_status,
                        overall_confidence,
                        detected_count,
                        summary_note,
                        image_path,
                        json.dumps(result_dict),
                    ),
                )
        finally:
            conn.close()

    def get_recent_scans(self, limit: int = 50) -> list[dict[str, Any]]:
        """Retrieve recent scans ordered by creation date descending."""
        conn = get_db_connection()
        try:
            rows = conn.execute(
                """
                SELECT id, timestamp, product_name, category, final_status,
                       overall_confidence, detected_count, summary_note,
                       image_path, result_json, created_at
                FROM scans
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

            results = []
            for row in rows:
                item = dict(row)
                try:
                    item["result"] = json.loads(item.pop("result_json"))
                except Exception:
                    item["result"] = {}
                results.append(item)
            return results
        finally:
            conn.close()

    def get_scan_by_id(self, scan_id: str) -> dict[str, Any] | None:
        """Fetch a single scan by ID."""
        conn = get_db_connection()
        try:
            row = conn.execute(
                "SELECT * FROM scans WHERE id = ?", (scan_id,)
            ).fetchone()
            if not row:
                return None
            item = dict(row)
            item["result"] = json.loads(item.pop("result_json"))
            return item
        finally:
            conn.close()
