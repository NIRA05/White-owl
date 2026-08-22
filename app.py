"""
WHITE OWL — AI WORKSPACE & CHATBOT
Think. Ask. Discover.
Built with Python + Streamlit.
"""

import streamlit as st

# 1. Page Configuration (Must be first Streamlit call)
st.set_page_config(
    page_title="White Owl — AI Workspace",
    page_icon="🦉",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 2. Module Imports
from modules.database import init_db
from modules.chat_manager import ChatManager
from ui.styles import apply_custom_styles
from ui.sidebar import render_sidebar
from ui.chat_ui import render_chat_view
from ui.components import (
    render_pdf_assistant_view,
    render_data_analyst_view,
    render_text_assistant_view,
    render_code_assistant_view,
    render_image_assistant_view,
    render_about_view
)

def init_session_state():
    """Initializes all necessary session state variables cleanly."""
    init_db()

    if "current_conv_id" not in st.session_state:
        # Check if there are existing conversations
        conversations = ChatManager.get_all_sessions()
        if conversations:
            active = conversations[0]
            st.session_state.current_conv_id = active["id"]
            st.session_state.current_conv_title = active["title"]
            st.session_state.messages = ChatManager.load_session_messages(active["id"])
        else:
            new_session = ChatManager.create_new_session("New Conversation")
            st.session_state.current_conv_id = new_session["id"]
            st.session_state.current_conv_title = new_session["title"]
            st.session_state.messages = []

    if "messages" not in st.session_state:
        st.session_state.messages = []

    if "current_mode" not in st.session_state:
        st.session_state.current_mode = "Main Chatbot"

    if "selected_model" not in st.session_state:
        st.session_state.selected_model = "gemini-2.5-flash"

    if "response_style" not in st.session_state:
        st.session_state.response_style = "Balanced"

    if "temperature" not in st.session_state:
        st.session_state.temperature = 0.7

    if "max_tokens" not in st.session_state:
        st.session_state.max_tokens = 2048

    if "theme_mode" not in st.session_state:
        st.session_state.theme_mode = "Dark"

    if "pdf_chunks" not in st.session_state:
        st.session_state.pdf_chunks = []
    if "pdf_doc_name" not in st.session_state:
        st.session_state.pdf_doc_name = None
    if "pdf_chat_history" not in st.session_state:
        st.session_state.pdf_chat_history = []

    if "data_df" not in st.session_state:
        st.session_state.data_df = None
    if "data_filename" not in st.session_state:
        st.session_state.data_filename = None

def main():
    """Main application lifecycle controller."""
    init_session_state()

    # Apply CSS Theme (Dark/Light)
    apply_custom_styles(st.session_state.theme_mode)

    # Render Persistent Navigation Sidebar
    render_sidebar()

    # Main Workspace View Switcher
    mode = st.session_state.get("current_mode", "Main Chatbot")

    if mode == "Main Chatbot":
        render_chat_view()
    elif mode == "PDF Assistant":
        render_pdf_assistant_view()
    elif mode == "Data Analyst":
        render_data_analyst_view()
    elif mode == "Text Assistant":
        render_text_assistant_view()
    elif mode == "Code Assistant":
        render_code_assistant_view()
    elif mode == "Image Assistant":
        render_image_assistant_view()
    elif mode == "About":
        render_about_view()
    else:
        render_chat_view()

if __name__ == "__main__":
    main()
