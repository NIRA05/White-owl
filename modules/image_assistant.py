"""
White Owl Image Assistant Module
Handles image verification, preprocessing, and multimodal visual analysis tasks.
"""

import io
from typing import Dict, Any, List, Optional
from PIL import Image

IMAGE_TASKS = {
    "General Description": "Provide a detailed, articulate description of everything occurring in this image.",
    "Text & OCR Extraction": "Extract and transcribe all visible text, numbers, labels, and typography found in this image. Maintain layout formatting.",
    "Diagram & Architecture Analysis": "Analyze this diagram, flowchart, or wireframe. Explain the system architecture, component relationships, data flow, and key nodes.",
    "Chart & Data Extraction": "Analyze this chart/graph. Identify the chart type, axes, units, data points, trends, and key statistical takeaways."
}

class ImageAssistant:
    """Provides image validation, formatting, and visual inquiry orchestration."""

    @staticmethod
    def validate_image(image_bytes: bytes) -> Dict[str, Any]:
        """Validates that the uploaded bytes form a valid image and extracts dimensions."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            format_name = img.format or "JPEG"
            return {
                "valid": True,
                "width": width,
                "height": height,
                "format": format_name,
                "mode": img.mode
            }
        except Exception as e:
            return {
                "valid": False,
                "error": f"Invalid image format: {str(e)}"
            }

    @staticmethod
    def get_task_names() -> List[str]:
        return list(IMAGE_TASKS.keys())

    @staticmethod
    def build_prompt(task_name: str, custom_question: Optional[str] = None) -> str:
        base = IMAGE_TASKS.get(task_name, IMAGE_TASKS["General Description"])
        if custom_question and custom_question.strip():
            return f"{base}\n\n[USER INQUIRY]: {custom_question.strip()}"
        return base
