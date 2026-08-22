"""
White Owl Chat UI Module
Renders the primary conversational canvas, quick prompt accelerators, streaming responses, and message actions.
"""

import streamlit as st
from modules.ai_client import stream_chat
from modules.chat_manager import ChatManager

QUICK_PROMPTS = [
    {
        "icon": "💡",
        "title": "Explain a Concept",
        "desc": "Explain quantum computing and superposition like I'm a beginner.",
        "prompt": "Explain quantum computing and superposition like I'm a beginner with intuitive analogies."
    },
    {
        "icon": "📊",
        "title": "Data Insights",
        "desc": "Help me calculate customer lifetime value and identify churn anomalies.",
        "prompt": "How do I calculate Customer Lifetime Value (CLV) and detect churn anomalies in subscription data?"
    },
    {
        "icon": "📄",
        "title": "Document Review",
        "desc": "How should I structure an executive summary for a strategic audit?",
        "prompt": "Outline an executive summary framework for a corporate strategic audit."
    },
    {
        "icon": "💻",
        "title": "Code Architecture",
        "desc": "Design a resilient asynchronous task queue pattern in Python.",
        "prompt": "Write a clean, resilient asynchronous task queue implementation in Python with error handling."
    },
    {
        "icon": "📝",
        "title": "Executive Polish",
        "desc": "Transform brief bullet points into an articulate boardroom proposal.",
        "prompt": "Elevate these notes into a polished boardroom proposal: We need to modernize our AI stack to reduce support ticket latency by 40%."
    }
]

def render_hero_banner():
    """Renders the signature White Owl welcome hero."""
    st.markdown(
        """
        <div class="owl-hero-container">
            <div class="owl-icon">🦉</div>
            <h1 class="owl-title">WHITE OWL</h1>
            <div class="owl-tagline">Think. Ask. Discover.</div>
            <div class="owl-subtext">How can I help you today?</div>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_quick_prompts():
    """Renders clickable prompt cards that populate the chat."""
    st.markdown("<p style='font-size: 0.9rem; font-weight: 700; color: #8b949e; text-transform: uppercase; margin-bottom: 0.75rem;'>SUGGESTED EXPLORATIONS</p>", unsafe_allow_html=True)
    cols = st.columns(len(QUICK_PROMPTS))
    for idx, qp in enumerate(QUICK_PROMPTS):
        with cols[idx]:
            btn_label = f"{qp['icon']} **{qp['title']}**\n\n{qp['desc']}"
            if st.button(btn_label, key=f"quick_prompt_{idx}", use_container_width=True):
                st.session_state.pending_prompt = qp["prompt"]
                st.rerun()

def render_chat_messages():
    """Renders all conversation messages with custom containers."""
    messages = st.session_state.get("messages", [])
    for idx, msg in enumerate(messages):
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        if role == "user":
            st.markdown(
                f"""
                <div class="user-msg-box">
                    <div class="msg-header">
                        <span class="user-tag">👤 You</span>
                    </div>
                    <div>{content}</div>
                </div>
                """,
                unsafe_allow_html=True
            )
        else:
            st.markdown(
                f"""
                <div class="owl-msg-box">
                    <div class="msg-header">
                        <span class="owl-tag">🦉 White Owl</span>
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )
            # Use Streamlit markdown renderer for full syntax highlighting & table support
            st.markdown(content)

def render_chat_view():
    """Main Chat View orchestration."""
    messages = st.session_state.get("messages", [])
    
    # Render hero banner if conversation is fresh
    if not messages:
        render_hero_banner()
        render_quick_prompts()
    else:
        # Header bar with conversation title & export options
        col_title, col_exp_md, col_exp_txt, col_clear = st.columns([6, 1.5, 1.5, 1.5])
        with col_title:
            st.markdown(f"### 💬 {st.session_state.get('current_conv_title', 'Conversation')}")
        with col_exp_md:
            md_content = ChatManager.export_as_markdown(
                st.session_state.get("current_conv_title", "Chat"),
                messages
            )
            st.download_button(
                "📥 .MD",
                data=md_content,
                file_name=f"white_owl_{st.session_state.get('current_conv_id', 'chat')[:8]}.md",
                mime="text/markdown",
                use_container_width=True
            )
        with col_exp_txt:
            txt_content = ChatManager.export_as_txt(
                st.session_state.get("current_conv_title", "Chat"),
                messages
            )
            st.download_button(
                "📥 .TXT",
                data=txt_content,
                file_name=f"white_owl_{st.session_state.get('current_conv_id', 'chat')[:8]}.txt",
                mime="text/plain",
                use_container_width=True
            )
        with col_clear:
            if st.button("🧹 Clear", use_container_width=True, help="Clear current chat messages"):
                conv_id = st.session_state.get("current_conv_id")
                if conv_id:
                    ChatManager.clear_session(conv_id)
                st.session_state.messages = []
                st.rerun()

        st.markdown("---")
        render_chat_messages()

    # Check for pending prompt from quick prompts or previous action
    pending_prompt = st.session_state.pop("pending_prompt", None)
    
    # Primary Chat Input
    user_input = st.chat_input("Ask White Owl anything...")
    prompt_to_send = user_input or pending_prompt

    if prompt_to_send:
        conv_id = st.session_state.get("current_conv_id")
        if not conv_id:
            new_session = ChatManager.create_new_session()
            conv_id = new_session["id"]
            st.session_state.current_conv_id = conv_id
            st.session_state.current_conv_title = new_session["title"]

        # Auto-update title if it's the first message
        if not messages or st.session_state.get("current_conv_title") == "New Conversation":
            new_title = ChatManager.auto_title_from_prompt(prompt_to_send)
            ChatManager.rename_session(conv_id, new_title)
            st.session_state.current_conv_title = new_title

        # Record User Message
        user_msg = {"role": "user", "content": prompt_to_send}
        st.session_state.messages.append(user_msg)
        ChatManager.save_chat_turn(conv_id, "user", prompt_to_send)

        # Render User Message immediately
        st.markdown(
            f"""
            <div class="user-msg-box">
                <div class="msg-header">
                    <span class="user-tag">👤 You</span>
                </div>
                <div>{prompt_to_send}</div>
            </div>
            """,
            unsafe_allow_html=True
        )

        # Prepare Context Window
        trimmed_context = ChatManager.get_trimmed_context(st.session_state.messages)

        # White Owl Response Bubble
        st.markdown(
            """
            <div class="owl-msg-box">
                <div class="msg-header">
                    <span class="owl-tag">🦉 White Owl</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        # Thinking and Streaming Display
        response_placeholder = st.empty()
        full_response = ""

        with st.spinner("White Owl is thinking..."):
            stream_gen = stream_chat(
                messages=trimmed_context,
                model_name=st.session_state.get("selected_model", "gemini-2.5-flash"),
                style=st.session_state.get("response_style", "Balanced"),
                temperature=float(st.session_state.get("temperature", 0.7)),
                max_output_tokens=int(st.session_state.get("max_tokens", 2048))
            )
            for chunk in stream_gen:
                full_response += chunk
                response_placeholder.markdown(full_response + "▌")

        # Final Render without cursor
        response_placeholder.markdown(full_response)

        # Save Assistant Message
        if full_response.strip():
            assistant_msg = {"role": "assistant", "content": full_response}
            st.session_state.messages.append(assistant_msg)
            ChatManager.save_chat_turn(conv_id, "assistant", full_response)
        
        st.rerun()
