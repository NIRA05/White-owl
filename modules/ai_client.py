"""
White Owl AI Client Module
Centralized Gemini AI SDK integration with secure key retrieval, streaming, and vision.
"""

import os
from typing import Generator, List, Dict, Any, Optional
import dotenv

dotenv.load_dotenv()

# Available response style system prompts
STYLE_PROMPTS = {
    "Balanced": (
        "You are White Owl, an intelligent, discerning, and articulate AI workspace assistant. "
        "Provide clear, balanced, and well-structured answers using clean Markdown formatting, "
        "bullet points, and code blocks where helpful. Tagline: Think. Ask. Discover."
    ),
    "Concise": (
        "You are White Owl. Respond with maximum brevity, sharp precision, and immediate clarity. "
        "Avoid fluff or long intros; deliver direct bullet points, crisp definitions, or minimal code snippets."
    ),
    "Detailed": (
        "You are White Owl. Provide exhaustive, comprehensive, deep-dive answers. "
        "Include background context, step-by-step breakdowns, edge cases, examples, and deep analysis."
    ),
    "Professional": (
        "You are White Owl, an executive-level AI intelligence advisor. "
        "Communicate with polished corporate decorum, structured strategic outlines, and formal business precision."
    ),
    "Friendly": (
        "You are White Owl, an approachable, warm, and highly encouraging AI mentor. "
        "Use inviting language, clear analogies, and helpful follow-up recommendations."
    ),
    "Technical": (
        "You are White Owl, a senior software architect and AI engineer. "
        "Provide rigorous technical explanations, optimized code samples, complexity analysis (Big-O), "
        "and architectural trade-offs."
    ),
}

AVAILABLE_MODELS = [
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "description": "Ultra-fast multimodal model, ideal for rapid chat, document Q&A, and data analysis.",
        "badge": "Default & Fast"
    },
    {
        "id": "gemini-2.5-pro",
        "name": "Gemini 2.5 Pro",
        "description": "Advanced reasoning model designed for complex coding, mathematical proofs, and deep synthesis.",
        "badge": "Reasoning & Code"
    },
    {
        "id": "gemini-1.5-flash",
        "name": "Gemini 1.5 Flash",
        "description": "High-throughput model with massive context window capabilities.",
        "badge": "Legacy Fast"
    },
    {
        "id": "gemini-1.5-pro",
        "name": "Gemini 1.5 Pro",
        "description": "Deep multi-turn reasoning and long-context processing.",
        "badge": "Deep Context"
    }
]

def get_api_key() -> Optional[str]:
    """
    Safely retrieves the AI API Key from Streamlit Secrets or Environment Variables.
    Never exposes or logs the key.
    """
    # 1. Check Streamlit Secrets if running under Streamlit
    try:
        import streamlit as st
        if hasattr(st, "secrets"):
            if "AI_API_KEY" in st.secrets and st.secrets["AI_API_KEY"]:
                return str(st.secrets["AI_API_KEY"]).strip()
            if "GEMINI_API_KEY" in st.secrets and st.secrets["GEMINI_API_KEY"]:
                return str(st.secrets["GEMINI_API_KEY"]).strip()
    except Exception:
        pass

    # 2. Check OS environment
    api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if api_key and api_key.strip():
        return api_key.strip()

    return None

def is_api_configured() -> bool:
    """Checks if a valid API key is present."""
    key = get_api_key()
    return bool(key and len(key) >= 10 and not key.startswith("your_"))

def get_api_key_masked() -> str:
    """Returns a masked version of the key for safe UI status indicators."""
    key = get_api_key()
    if not key:
        return "Not Configured"
    if len(key) <= 8:
        return "••••••••"
    return f"{key[:4]}••••••••{key[-4:]}"

def build_system_instruction(style: str = "Balanced", custom_context: Optional[str] = None) -> str:
    """Builds the complete system instruction with style and custom document/data context."""
    base = STYLE_PROMPTS.get(style, STYLE_PROMPTS["Balanced"])
    if custom_context:
        return f"{base}\n\n[CONTEXT SPECIFICATION]:\n{custom_context}"
    return base

def stream_chat(
    messages: List[Dict[str, str]],
    model_name: str = "gemini-2.5-flash",
    style: str = "Balanced",
    temperature: float = 0.7,
    max_output_tokens: int = 2048,
    system_context: Optional[str] = None
) -> Generator[str, None, None]:
    """
    Streams response from Gemini API using the modern SDK.
    Falls back gracefully if an error occurs.
    """
    api_key = get_api_key()
    if not api_key:
        yield "⚠️ **API Key Missing**: Please configure `AI_API_KEY` in your `.env` or Streamlit Secrets."
        return

    system_instruction = build_system_instruction(style, system_context)

    # Try modern google-genai SDK first
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Convert messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )

        response_stream = client.models.generate_content_stream(
            model=model_name,
            contents=contents,
            config=config,
        )

        for chunk in response_stream:
            if hasattr(chunk, "text") and chunk.text:
                yield chunk.text

        return
    except ImportError:
        pass
    except Exception as e:
        err_msg = str(e)
        if "API_KEY_INVALID" in err_msg or "400" in err_msg and "key" in err_msg.lower():
            yield "⚠️ **Invalid API Key**: Please verify your `AI_API_KEY` credentials in `.env` or Streamlit Secrets."
            return
        elif "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
            yield "⚠️ **Rate Limit Reached**: Gemini quota exceeded. Please wait a moment and try again."
            return

    # Fallback to google-generativeai SDK if modern genai isn't available
    try:
        import google.generativeai as legacy_genai
        legacy_genai.configure(api_key=api_key)
        
        legacy_model = legacy_genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction,
            generation_config=legacy_genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            )
        )
        
        # Build chat history
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})
            
        chat = legacy_model.start_chat(history=history)
        last_msg = messages[-1]["content"] if messages else ""
        response = chat.send_message(last_msg, stream=True)
        
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"⚠️ **White Owl encountered an issue**: {str(e)}"

def generate_text(
    prompt: str,
    model_name: str = "gemini-2.5-flash",
    style: str = "Balanced",
    temperature: float = 0.7,
    max_output_tokens: int = 2048,
    system_context: Optional[str] = None
) -> str:
    """Non-streaming text generation helper."""
    chunks = list(stream_chat(
        messages=[{"role": "user", "content": prompt}],
        model_name=model_name,
        style=style,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        system_context=system_context
    ))
    return "".join(chunks)

def analyze_image(
    image_bytes: bytes,
    mime_type: str,
    prompt: str,
    model_name: str = "gemini-2.5-flash",
    style: str = "Balanced"
) -> str:
    """Analyzes an uploaded image with a multimodal prompt."""
    api_key = get_api_key()
    if not api_key:
        return "⚠️ **API Key Missing**: Please configure `AI_API_KEY`."

    system_instruction = build_system_instruction(style)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.4,
            )
        )
        return response.text or "No textual response generated for image."
    except ImportError:
        pass
    except Exception as e:
        return f"⚠️ **Image Analysis Error**: {str(e)}"

    try:
        import google.generativeai as legacy_genai
        from PIL import Image
        import io

        legacy_genai.configure(api_key=api_key)
        img = Image.open(io.BytesIO(image_bytes))
        legacy_model = legacy_genai.GenerativeModel(model_name=model_name)
        response = legacy_model.generate_content([prompt, img])
        return response.text or "No response generated."
    except Exception as e:
        return f"⚠️ **Image Analysis Error**: {str(e)}"
