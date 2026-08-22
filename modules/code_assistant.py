"""
White Owl Code Assistant Module
Specialized developer workflows: Explanation, Bug fixing, SQL optimization, Code conversion, Refactoring.
"""

from typing import Dict, Any, List

CODE_MODES = {
    "Explain Code": {
        "description": "Deconstruct algorithms, control flow, libraries, and logic step-by-step.",
        "prompt": "Explain the following code in depth. Breakdown: 1) Purpose & Architecture, 2) Step-by-Step Logic, 3) Time & Space Complexity (Big-O), 4) Potential Edge Cases:\n\n```{language}\n{code}\n```"
    },
    "Find Bugs & Fix": {
        "description": "Detect logical flaws, off-by-one errors, security vulnerabilities, and provide patched code.",
        "prompt": "Review this code for bugs, race conditions, memory leaks, and vulnerabilities. Point out the bugs with line references and provide the corrected, production-ready code:\n\n```{language}\n{code}\n```"
    },
    "Optimize & Refactor": {
        "description": "Improve runtime performance, readability, memory footprint, and follow modern design patterns.",
        "prompt": "Refactor and optimize the following code for superior performance, idiomatic conventions, and readability. Explain the before/after optimization gains:\n\n```{language}\n{code}\n```"
    },
    "Language Conversion": {
        "description": "Translate code from one programming language to another maintaining idiomatic style.",
        "prompt": "Convert the following {language} code to idiomatic {target_language}. Ensure modern conventions, error handling, and type safety where applicable:\n\n```{language}\n{code}\n```"
    },
    "SQL Query Optimization": {
        "description": "Analyze query plan efficiency, missing indexes, JOIN bottlenecks, and rewritten queries.",
        "prompt": "Analyze this SQL query. Provide an optimized rewrite, index recommendations, and explain why the changes improve execution plan efficiency:\n\n```sql\n{code}\n```"
    }
}

SUPPORTED_LANGUAGES = [
    "Python", "JavaScript", "TypeScript", "SQL", "HTML/CSS", 
    "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Bash/Shell"
]

class CodeAssistant:
    """Orchestrates structured developer prompts."""

    @staticmethod
    def get_modes() -> List[str]:
        return list(CODE_MODES.keys())

    @staticmethod
    def get_mode_description(mode: str) -> str:
        return CODE_MODES.get(mode, {}).get("description", "")

    @staticmethod
    def build_prompt(mode: str, code: str, language: str = "Python", target_language: str = "TypeScript") -> str:
        mode_info = CODE_MODES.get(mode, CODE_MODES["Explain Code"])
        template = mode_info["prompt"]
        return template.format(
            code=code,
            language=language,
            target_language=target_language
        )
