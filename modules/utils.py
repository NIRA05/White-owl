"""
White Owl Utilities Module
Helper functions for formatting, sanitization, token approximations, and file checks.
"""

import re
import html
from typing import Dict, Any, List

def format_file_size(size_bytes: int) -> str:
    """Formats bytes into human readable string (KB, MB, GB)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def estimate_tokens(text: str) -> int:
    """Rough estimation of token count (~4 chars per token)."""
    if not text:
        return 0
    return max(1, len(text) // 4)

def sanitize_filename(filename: str) -> str:
    """Sanitizes user uploaded filename to prevent directory traversal or invalid characters."""
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)
    return clean[:100]

def truncate_text(text: str, max_chars: int = 150) -> str:
    """Truncates text with ellipsis."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "..."

def get_error_message(err: Exception) -> str:
    """Translates technical exceptions into user-friendly diagnostic messages."""
    err_str = str(err).lower()
    if "api_key" in err_str or "unauthenticated" in err_str:
        return "⚠️ White Owl could not authenticate with the AI service. Please verify your API Key in Settings or `.env`."
    if "quota" in err_str or "rate limit" in err_str or "429" in err_str:
        return "⚠️ API rate limit or quota exceeded. Please wait a few moments before sending another request."
    if "timeout" in err_str:
        return "⚠️ The request timed out. Please try sending a shorter prompt or splitting your request."
    if "permission" in err_str:
        return "⚠️ Permission denied for this model or operation."
    return f"⚠️ An unexpected error occurred: {html.escape(str(err))}"
