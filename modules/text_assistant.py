"""
White Owl Text Assistant Module
Specialized NLP utilities: Summarization, Rewriting, Grammar Polish, Professional Tone, Email, Content, Translation, Keywords.
"""

from typing import Dict, Any, List

TEXT_TASKS = {
    "Summarization": {
        "description": "Condense text into concise, high-impact bullet points and an executive summary.",
        "prompt_template": "Summarize the following text clearly. Provide a 2-sentence executive summary followed by key bullet points:\n\n{text}"
    },
    "Rewriting": {
        "description": "Improve flow, clarity, variety, and cadence while preserving core meaning.",
        "prompt_template": "Rewrite the following text to improve clarity, rhythm, and impact while retaining its original intent:\n\n{text}"
    },
    "Grammar & Proofreading": {
        "description": "Correct spelling, syntax, punctuation, and typographical inconsistencies.",
        "prompt_template": "Proofread and correct all grammar, spelling, punctuation, and syntax errors in this text. List the key changes made after the corrected version:\n\n{text}"
    },
    "Professional Polishing": {
        "description": "Elevate tone to executive, board-ready, or client-facing corporate standard.",
        "prompt_template": "Elevate the following text into a polished, articulate, professional business standard:\n\n{text}"
    },
    "Email Drafting": {
        "description": "Transform notes or bullet points into a well-structured, persuasive email.",
        "prompt_template": "Convert the following notes/context into a crisp, persuasive email with Subject Line, Greeting, Body, Call to Action, and Sign-off:\n\n{text}"
    },
    "Content Creation": {
        "description": "Expand an outline or idea into a compelling article, post, or brief.",
        "prompt_template": "Expand the following concept/outline into an engaging, structured piece of content with subheadings:\n\n{text}"
    },
    "Language Translation": {
        "description": "Accurately translate into the specified target language preserving nuances.",
        "prompt_template": "Translate the following text into {target_language}. Ensure natural phrasing and cultural accuracy:\n\n{text}"
    },
    "Keyword & Entity Extraction": {
        "description": "Extract primary topics, key entities, themes, and taxonomy tags.",
        "prompt_template": "Analyze the following text and extract: 1) Primary Keywords, 2) Named Entities, 3) Core Themes, 4) Recommended Search Tags:\n\n{text}"
    }
}

SUPPORTED_LANGUAGES = [
    "Spanish", "French", "German", "Japanese", "Chinese (Mandarin)", 
    "Italian", "Portuguese", "Hindi", "Arabic", "Russian", "Korean", "Dutch"
]

class TextAssistant:
    """Orchestrates structured text transformation prompts."""

    @staticmethod
    def get_task_names() -> List[str]:
        return list(TEXT_TASKS.keys())

    @staticmethod
    def get_task_description(task_name: str) -> str:
        return TEXT_TASKS.get(task_name, {}).get("description", "")

    @staticmethod
    def build_prompt(task_name: str, input_text: str, target_language: str = "Spanish") -> str:
        task_info = TEXT_TASKS.get(task_name, TEXT_TASKS["Summarization"])
        template = task_info["prompt_template"]
        return template.format(text=input_text, target_language=target_language)
