"""
White Owl Custom Styles Module
Provides sleek CSS theme injections for dark/light modes, owl branding, glassmorphism, and custom chat bubbles.
"""

import streamlit as st

def apply_custom_styles(theme: str = "Dark"):
    """Injects high-craft CSS into the Streamlit app to transform the visual experience."""
    
    is_dark = (theme == "Dark")
    
    bg_color = "#0b0b0b" if is_dark else "#ffffff"
    card_bg = "rgba(26, 26, 26, 0.92)" if is_dark else "#ffffff"
    border_color = "rgba(229, 9, 20, 0.35)" if is_dark else "rgba(229, 9, 20, 0.45)"
    text_primary = "#ffffff" if is_dark else "#0b0b0b"
    text_muted = "#b3b3b3" if is_dark else "#4d4d4d"
    accent_red = "#e50914"
    accent_red_glow = "rgba(229, 9, 20, 0.2)"
    user_bubble_bg = "#1a1a1a" if is_dark else "#f2f2f2"
    owl_bubble_bg = "rgba(22, 27, 34, 0.9)" if is_dark else "#ffffff"

    custom_css = f"""
    <style>
    /* Hide default Streamlit headers and footers */
    #MainMenu {{visibility: hidden;}}
    footer {{visibility: hidden;}}
    .stDeployButton {{display:none;}}

    /* Global typography & background */
    .stApp {{
        background-color: {bg_color};
        color: {text_primary};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }}

    /* Custom owl banner */
    .owl-hero-container {{
        text-align: center;
        padding: 2.5rem 1rem 1.5rem 1rem;
        background: radial-gradient(circle at center, {accent_red_glow} 0%, transparent 70%);
        border-radius: 16px;
        margin-bottom: 2rem;
    }}
    .owl-icon {{
        font-size: 3.5rem;
        display: inline-block;
        filter: drop-shadow(0 4px 12px {accent_red_glow});
        margin-bottom: 0.5rem;
    }}
    .owl-title {{
        font-size: 2.25rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: {accent_red};
        margin: 0;
        text-transform: uppercase;
    }}
    .owl-tagline {{
        font-size: 1.05rem;
        color: {text_muted};
        letter-spacing: 0.15em;
        margin-top: 0.35rem;
        font-weight: 500;
        text-transform: uppercase;
    }}
    .owl-subtext {{
        font-size: 1.1rem;
        color: {text_primary};
        margin-top: 1rem;
        font-weight: 400;
    }}

    /* Quick prompt cards */
    .prompt-grid {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0 2rem 0;
    }}
    .prompt-card {{
        background: {card_bg};
        border: 1px solid {border_color};
        border-radius: 12px;
        padding: 1.25rem;
        transition: all 0.2s ease-in-out;
        cursor: pointer;
        backdrop-filter: blur(8px);
    }}
    .prompt-card:hover {{
        border-color: {accent_red};
        transform: translateY(-2px);
        box-shadow: 0 6px 16px {accent_red_glow};
    }}
    .prompt-card-title {{
        font-weight: 700;
        font-size: 0.95rem;
        color: {accent_red};
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.35rem;
    }}
    .prompt-card-desc {{
        font-size: 0.85rem;
        color: {text_muted};
        line-height: 1.4;
    }}

    /* Custom chat message containers */
    .user-msg-box {{
        background: {user_bubble_bg};
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px 14px 2px 14px;
        padding: 1rem 1.25rem;
        margin: 0.75rem 0;
        color: {text_primary};
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }}
    .owl-msg-box {{
        background: {owl_bubble_bg};
        border: 1px solid {border_color};
        border-radius: 14px 14px 14px 2px;
        padding: 1.25rem 1.5rem;
        margin: 0.75rem 0;
        color: {text_primary};
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
    }}
    .msg-header {{
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
    }}
    .user-tag {{
        color: {accent_red};
    }}
    .owl-tag {{
        color: {accent_red};
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }}

    /* Sidebar improvements */
    [data-testid="stSidebar"] {{
        background-color: {card_bg} !important;
        border-right: 1px solid {border_color};
    }}

    /* Button custom styles */
    .stButton>button {{
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.2s ease;
        border: 1px solid {border_color};
    }}
    .stButton>button:hover {{
        border-color: {accent_red};
        color: {accent_red};
    }}

    /* Status badge pill */
    .status-pill {{
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }}
    .status-connected {{
        background: rgba(229, 9, 20, 0.15);
        color: #ffffff;
        border: 1px solid rgba(229, 9, 20, 0.3);
    }}
    .status-disconnected {{
        background: rgba(248, 113, 113, 0.15);
        color: #f87171;
        border: 1px solid rgba(248, 113, 113, 0.3);
    }}

    /* Code blocks */
    pre code {{
        font-family: 'Fira Code', 'Courier New', monospace !important;
        border-radius: 8px;
    }}
    </style>
    """
    st.markdown(custom_css, unsafe_allow_html=True)
