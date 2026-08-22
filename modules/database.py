"""
White Owl Database Module
Handles persistent SQLite conversation storage with safe parameterized queries.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "white_owl.db")

def ensure_db_dir():
    """Ensure data directory exists."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with row factory enabled."""
    ensure_db_dir()
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database tables if they do not exist."""
    ensure_db_dir()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata_json TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        """)
        conn.commit()

def create_conversation(conv_id: str, title: str = "New Conversation") -> Dict[str, Any]:
    """Creates a new conversation record."""
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (conv_id, title, now, now)
        )
        conn.commit()
    return {"id": conv_id, "title": title, "created_at": now, "updated_at": now}

def get_all_conversations() -> List[Dict[str, Any]]:
    """Retrieves all conversations ordered by last updated time."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_conversation(conv_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single conversation by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?", (conv_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def rename_conversation(conv_id: str, new_title: str) -> bool:
    """Renames an existing conversation."""
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
            (new_title, now, conv_id)
        )
        conn.commit()
        return cursor.rowcount > 0

def delete_conversation(conv_id: str) -> bool:
    """Deletes a conversation and all its messages."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
        cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        conn.commit()
        return True

def save_message(conv_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> int:
    """Saves a message to a conversation and updates its timestamp."""
    now = datetime.utcnow().isoformat()
    meta_str = json.dumps(metadata) if metadata else None
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO messages (conversation_id, role, content, metadata_json, timestamp) VALUES (?, ?, ?, ?, ?)",
            (conv_id, role, content, meta_str, now)
        )
        cursor.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (now, conv_id)
        )
        conn.commit()
        return cursor.lastrowid

def get_messages(conv_id: str) -> List[Dict[str, Any]]:
    """Fetches all messages for a given conversation ordered by sequence."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, role, content, metadata_json, timestamp FROM messages WHERE conversation_id = ? ORDER BY id ASC",
            (conv_id,)
        )
        rows = cursor.fetchall()
        messages = []
        for row in rows:
            meta = json.loads(row["metadata_json"]) if row["metadata_json"] else None
            messages.append({
                "id": row["id"],
                "role": row["role"],
                "content": row["content"],
                "metadata": meta,
                "timestamp": row["timestamp"]
            })
        return messages

def clear_conversation_messages(conv_id: str) -> bool:
    """Clears all messages for a given conversation."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
        conn.commit()
        return True
