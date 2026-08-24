"""
White Owl Sidebar UI Module
Renders the navigation drawer, chat history manager, parameter controls, and API status indicator.
"""

import streamlit as st
from pathlib import Path
from modules.ai_client import is_api_configured, get_api_key_masked, AVAILABLE_MODELS, STYLE_PROMPTS
from modules.chat_manager import ChatManager

OWL_IMAGE_PATH = Path(__file__).resolve().parents[1] / "src" / "assets" / "images" / "white_owl_avatar_1787395434065.jpg"

def render_sidebar():
    """Renders the comprehensive White Owl sidebar."""
    with st.sidebar:
        # Header Brand
        st.image(str(OWL_IMAGE_PATH), width=100)
        st.markdown(
            """
            <div style="text-align: center; margin-bottom: 1.25rem;">
                <div style="font-size: 1.35rem; font-weight: 800; color: #e50914; letter-spacing: 0.08em; text-transform: uppercase;">WHITE OWL</div>
                <div style="font-size: 0.75rem; color: #b3b3b3; letter-spacing: 0.15em; text-transform: uppercase;">Think. Ask. Discover.</div>
            </div>
            """,
            unsafe_allow_html=True
        )

        # Primary Action: New Chat
        if st.button("➕ New Chat", use_container_width=True, type="primary"):
            new_session = ChatManager.create_new_session("New Conversation")
            st.session_state.current_conv_id = new_session["id"]
            st.session_state.current_conv_title = new_session["title"]
            st.session_state.messages = []
            st.session_state.current_mode = "Main Chatbot"
            st.session_state.pdf_chunks = []
            st.session_state.pdf_doc_name = None
            st.session_state.data_df = None
            st.rerun()

        st.markdown("---")

        # Mode Selection
        st.markdown("<p style='font-size: 0.8rem; font-weight: 700; color: #8b949e; text-transform: uppercase; margin-bottom: 0.5rem;'>WORKSPACE MODES</p>", unsafe_allow_html=True)
        modes = [
            ("💬 Main Chatbot", "Main Chatbot"),
            ("📄 PDF Assistant", "PDF Assistant"),
            ("📊 Data Analyst", "Data Analyst"),
            ("📝 Text Assistant", "Text Assistant"),
            ("💻 Code Assistant", "Code Assistant"),
            ("🖼️ Image Assistant", "Image Assistant"),
            ("ℹ️ About White Owl", "About")
        ]
        
        mode_names = [m[0] for m in modes]
        current_idx = 0
        for i, m in enumerate(modes):
            if m[1] == st.session_state.get("current_mode", "Main Chatbot"):
                current_idx = i
                break

        selected_mode_label = st.radio(
            "Select Mode",
            mode_names,
            index=current_idx,
            label_visibility="collapsed"
        )
        
        for m in modes:
            if m[0] == selected_mode_label:
                st.session_state.current_mode = m[1]

        st.markdown("---")

        # Chat History Accordion
        with st.expander("📚 Chat History", expanded=False):
            conversations = ChatManager.get_all_sessions()
            if not conversations:
                st.caption("No saved conversations yet.")
            else:
                for conv in conversations:
                    is_active = (conv["id"] == st.session_state.get("current_conv_id"))
                    title_display = f"{'▶ ' if is_active else ''}{conv['title'][:24]}"
                    
                    col_conv, col_del = st.columns([4, 1])
                    with col_conv:
                        if st.button(title_display, key=f"conv_{conv['id']}", use_container_width=True):
                            st.session_state.current_conv_id = conv["id"]
                            st.session_state.current_conv_title = conv["title"]
                            st.session_state.messages = ChatManager.load_session_messages(conv["id"])
                            st.session_state.current_mode = "Main Chatbot"
                            st.rerun()
                    with col_del:
                        if st.button("🗑️", key=f"del_{conv['id']}", help="Delete Conversation"):
                            ChatManager.delete_session(conv["id"])
                            if is_active:
                                new_session = ChatManager.create_new_session("New Conversation")
                                st.session_state.current_conv_id = new_session["id"]
                                st.session_state.current_conv_title = new_session["title"]
                                st.session_state.messages = []
                            st.rerun()

                # Rename Current Active Conversation
                if st.session_state.get("current_conv_id"):
                    st.markdown("<p style='font-size: 0.75rem; color: #8b949e; margin-top: 0.75rem;'>RENAME CURRENT</p>", unsafe_allow_html=True)
                    new_title_input = st.text_input(
                        "New Title",
                        value=st.session_state.get("current_conv_title", "New Conversation"),
                        key="rename_input",
                        label_visibility="collapsed"
                    )
                    if st.button("Save Title", use_container_width=True):
                        if new_title_input.strip():
                            ChatManager.rename_session(st.session_state.current_conv_id, new_title_input.strip())
                            st.session_state.current_conv_title = new_title_input.strip()
                            st.rerun()

        # Model & Workspace Settings Accordion
        with st.expander("⚙️ Settings", expanded=False):
            # Model Selection
            model_options = [m["id"] for m in AVAILABLE_MODELS]
            model_labels = {m["id"]: f"{m['name']} ({m['badge']})" for m in AVAILABLE_MODELS}
            
            selected_model = st.selectbox(
                "AI Model",
                model_options,
                format_func=lambda x: model_labels.get(x, x),
                index=0
            )
            st.session_state.selected_model = selected_model

            # Response Style
            style_options = list(STYLE_PROMPTS.keys())
            selected_style = st.selectbox(
                "Response Style",
                style_options,
                index=style_options.index(st.session_state.get("response_style", "Balanced"))
            )
            st.session_state.response_style = selected_style

            # Temperature Slider
            temp = st.slider(
                "Creativity / Temperature",
                min_value=0.0,
                max_value=1.0,
                value=float(st.session_state.get("temperature", 0.7)),
                step=0.05,
                help="Lower values make responses more factual and deterministic; higher values make them more creative."
            )
            st.session_state.temperature = temp

            # Max Tokens Slider
            max_tokens = st.select_slider(
                "Max Tokens",
                options=[512, 1024, 2048, 4096, 8192],
                value=int(st.session_state.get("max_tokens", 2048))
            )
            st.session_state.max_tokens = max_tokens

            # UI Theme Mode
            theme_mode = st.radio(
                "Theme Mode",
                ["Dark", "Light"],
                index=0 if st.session_state.get("theme_mode", "Dark") == "Dark" else 1,
                horizontal=True
            )
            st.session_state.theme_mode = theme_mode

        st.markdown("---")

        # API Status Indicator
        api_ready = is_api_configured()
        if api_ready:
            st.markdown(
                f"""
                <div style="background: rgba(229, 9, 20, 0.1); border: 1px solid rgba(229, 9, 20, 0.3); border-radius: 8px; padding: 0.6rem 0.8rem; text-align: center;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                        <span style="font-size: 0.9rem;">●</span> API Connected
                    </div>
                    <div style="font-size: 0.7rem; color: #8b949e; margin-top: 0.2rem;">Key: {get_api_key_masked()}</div>
                </div>
                """,
                unsafe_allow_html=True
            )
        else:
            st.markdown(
                """
                <div style="background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 8px; padding: 0.6rem 0.8rem; text-align: center;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #f87171; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                        <span style="font-size: 0.9rem;">⚠️</span> Key Not Configured
                    </div>
                    <div style="font-size: 0.7rem; color: #8b949e; margin-top: 0.2rem;">Set GEMINI_API_KEY in .env or Secrets</div>
                </div>
                """,
                unsafe_allow_html=True
            )
