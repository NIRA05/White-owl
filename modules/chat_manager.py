"""
White Owl Chat Manager Module
Orchestrates conversation lifecycle, memory windowing, persistence synchronization, and export.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from .database import (
    create_conversation,
    get_all_conversations,
    get_conversation,
    rename_conversation,
    delete_conversation,
    save_message,
    get_messages,
    clear_conversation_messages
)

class ChatManager:
    """Manages active chat session state, SQLite synchronization, and token memory."""

    @staticmethod
    def generate_conv_id() -> str:
        return str(uuid.uuid4())

    @staticmethod
    def create_new_session(title: str = "New Conversation") -> Dict[str, Any]:
        conv_id = ChatManager.generate_conv_id()
        return create_conversation(conv_id, title)

    @staticmethod
    def load_session_messages(conv_id: str) -> List[Dict[str, Any]]:
        return get_messages(conv_id)

    @staticmethod
    def save_chat_turn(conv_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        return save_message(conv_id, role, content, metadata)

    @staticmethod
    def get_all_sessions() -> List[Dict[str, Any]]:
        return get_all_conversations()

    @staticmethod
    def rename_session(conv_id: str, title: str) -> bool:
        return rename_conversation(conv_id, title)

    @staticmethod
    def delete_session(conv_id: str) -> bool:
        return delete_conversation(conv_id)

    @staticmethod
    def clear_session(conv_id: str) -> bool:
        return clear_conversation_messages(conv_id)

    @staticmethod
    def get_trimmed_context(messages: List[Dict[str, Any]], max_turns: int = 8) -> List[Dict[str, str]]:
        """
        Maintains a rolling context window to prevent uncontrolled context inflation.
        Extracts only role and content.
        """
        # Take the most recent (max_turns * 2) messages
        window = messages[-(max_turns * 2):] if len(messages) > (max_turns * 2) else messages
        trimmed = []
        for m in window:
            trimmed.append({
                "role": m.get("role", "user"),
                "content": m.get("content", "")
            })
        return trimmed

    @staticmethod
    def auto_title_from_prompt(prompt: str, max_length: int = 32) -> str:
        """Generates a clean, concise conversation title from the first prompt."""
        clean = " ".join(prompt.strip().split())
        if len(clean) <= max_length:
            return clean.capitalize()
        # Find clean cutoff
        cutoff = clean[:max_length].rsplit(" ", 1)[0]
        return (cutoff if cutoff else clean[:max_length]) + "..."

    @staticmethod
    def export_as_markdown(conv_title: str, messages: List[Dict[str, Any]]) -> str:
        """Exports the conversation history as formatted Markdown."""
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        lines = [
            "# 🦉 WHITE OWL — CONVERSATION EXPORT",
            f"**Title:** {conv_title}",
            f"**Export Date:** {now_str}",
            f"**Tagline:** Think. Ask. Discover.",
            "",
            "---",
            ""
        ]
        for msg in messages:
            role = "### 👤 User" if msg.get("role") == "user" else "### 🦉 White Owl"
            lines.append(role)
            lines.append(msg.get("content", ""))
            lines.append("")
            lines.append("---")
            lines.append("")
        return "\n".join(lines)

    @staticmethod
    def export_as_txt(conv_title: str, messages: List[Dict[str, Any]]) -> str:
        """Exports the conversation history as plain text."""
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        lines = [
            "==================================================",
            "WHITE OWL — AI WORKSPACE CONVERSATION EXPORT",
            f"Title: {conv_title}",
            f"Date: {now_str}",
            "Tagline: Think. Ask. Discover.",
            "==================================================",
            ""
        ]
        for msg in messages:
            role = "USER:" if msg.get("role") == "user" else "WHITE OWL:"
            lines.append(role)
            lines.append(msg.get("content", ""))
            lines.append("-" * 40)
            lines.append("")
        return "\n".join(lines)
