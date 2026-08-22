"""
White Owl Specialized Workspace Components
Renders dedicated views for PDF Assistant, Data Analyst, Text Assistant, Code Assistant, Image Assistant, and About Page.
"""

import streamlit as st
import pandas as pd
from modules.pdf_assistant import PDFAssistant
from modules.data_analyzer import DataAnalyzer
from modules.text_assistant import TextAssistant, SUPPORTED_LANGUAGES
from modules.code_assistant import CodeAssistant, SUPPORTED_LANGUAGES as CODE_LANGUAGES
from modules.image_assistant import ImageAssistant
from modules.ai_client import generate_text, analyze_image, stream_chat
from modules.utils import format_file_size

def render_pdf_assistant_view():
    """Renders the interactive PDF Document Intelligence workspace."""
    st.markdown("## 📄 Document Assistant")
    st.caption("Upload a PDF document to extract page chunks, synthesize key points, and query citations.")

    uploaded_pdf = st.file_uploader("Upload your PDF", type=["pdf"], key="pdf_uploader")

    if uploaded_pdf:
        pdf_bytes = uploaded_pdf.read()
        file_size_str = format_file_size(len(pdf_bytes))
        
        # Process and extract if new document
        if st.session_state.get("pdf_doc_name") != uploaded_pdf.name:
            with st.spinner("Analyzing document structure and extracting pages..."):
                pages_data = PDFAssistant.extract_pages(pdf_bytes)
                chunks = PDFAssistant.create_chunks(pages_data)
                st.session_state.pdf_pages_data = pages_data
                st.session_state.pdf_chunks = chunks
                st.session_state.pdf_doc_name = uploaded_pdf.name
                st.session_state.pdf_chat_history = []

        total_pages = len(st.session_state.get("pdf_pages_data", []))
        total_chunks = len(st.session_state.get("pdf_chunks", []))

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Document", uploaded_pdf.name)
        with col2:
            st.metric("Pages", total_pages)
        with col3:
            st.metric("File Size", file_size_str)

        st.markdown("---")

        # Display PDF Q&A History
        pdf_history = st.session_state.get("pdf_chat_history", [])
        for q, a in pdf_history:
            st.markdown(
                f"""
                <div class="user-msg-box">
                    <div class="msg-header"><span class="user-tag">👤 You</span></div>
                    <div>{q}</div>
                </div>
                """,
                unsafe_allow_html=True
            )
            st.markdown(
                f"""
                <div class="owl-msg-box">
                    <div class="msg-header"><span class="owl-tag">🦉 White Owl</span></div>
                </div>
                """,
                unsafe_allow_html=True
            )
            st.markdown(a)

        # Query input
        pdf_query = st.chat_input("Ask a question about this document...")
        if pdf_query:
            pdf_context = PDFAssistant.build_pdf_context(st.session_state.pdf_chunks)
            prompt = PDFAssistant.prepare_pdf_prompt(
                pdf_query, 
                st.session_state.pdf_doc_name, 
                total_pages, 
                pdf_context
            )

            st.markdown(
                f"""
                <div class="user-msg-box">
                    <div class="msg-header"><span class="user-tag">👤 You</span></div>
                    <div>{pdf_query}</div>
                </div>
                <div class="owl-msg-box">
                    <div class="msg-header"><span class="owl-tag">🦉 White Owl</span></div>
                </div>
                """,
                unsafe_allow_html=True
            )

            placeholder = st.empty()
            full_ans = ""
            with st.spinner("White Owl is examining the document..."):
                for chunk in stream_chat(
                    messages=[{"role": "user", "content": prompt}],
                    model_name=st.session_state.get("selected_model", "gemini-2.5-flash"),
                    style=st.session_state.get("response_style", "Balanced"),
                    temperature=0.3
                ):
                    full_ans += chunk
                    placeholder.markdown(full_ans + "▌")
            placeholder.markdown(full_ans)

            pdf_history.append((pdf_query, full_ans))
            st.session_state.pdf_chat_history = pdf_history
            st.rerun()

def render_data_analyst_view():
    """Renders the Pandas Data Analyst and Plotly visualization hub."""
    st.markdown("## 📊 CSV / Excel Data Analyst")
    st.caption("Upload tabular datasets (.csv, .xlsx, .xls) for schema profiling, statistical inquiry, and interactive charts.")

    uploaded_data = st.file_uploader("Upload dataset", type=["csv", "xlsx", "xls"], key="data_uploader")

    if uploaded_data:
        data_bytes = uploaded_data.read()
        try:
            df = DataAnalyzer.load_dataset(data_bytes, uploaded_data.name)
            st.session_state.data_df = df
            st.session_state.data_filename = uploaded_data.name
        except Exception as e:
            st.error(f"Error loading dataset: {str(e)}")
            return

        df = st.session_state.data_df
        summary = DataAnalyzer.get_summary(df)

        # Key Metrics Row
        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.metric("Rows", f"{summary['rows']:,}")
        with m2:
            st.metric("Columns", summary['columns'])
        with m3:
            st.metric("Missing Cells", f"{summary['total_missing']} ({summary['missing_pct']}%)")
        with m4:
            st.metric("Numeric Cols", len(summary['numeric_columns']))

        # Tabs for Dataset inspection vs Visualizations vs AI Inquiries
        tab_preview, tab_stats, tab_charts, tab_ai = st.tabs(["📋 Data Preview", "📈 Summary Stats", "📊 Interactive Charts", "🤖 AI Data Analyst"])

        with tab_preview:
            st.markdown("### Data Preview (Top 50 Rows)")
            st.dataframe(df.head(50), use_container_width=True)

        with tab_stats:
            st.markdown("### Statistical Breakdown")
            if summary['numeric_columns']:
                st.dataframe(df.describe().T, use_container_width=True)
            else:
                st.info("No numeric columns found for descriptive statistical calculation.")

            st.markdown("### Column Data Types & Missing Counts")
            col_info_df = pd.DataFrame({
                "Column": summary["column_names"],
                "Data Type": [summary["dtypes"][c] for c in summary["column_names"]],
                "Missing Values": [summary["missing_counts"][c] for c in summary["column_names"]]
            })
            st.dataframe(col_info_df, use_container_width=True)

        with tab_charts:
            st.markdown("### Interactive Plotly Chart Studio")
            c_type_col, c_x_col, c_y_col, c_color_col = st.columns(4)
            with c_type_col:
                chart_type = st.selectbox("Chart Type", ["bar", "line", "scatter", "histogram", "pie", "box"])
            with c_x_col:
                x_col = st.selectbox("X-Axis / Category", summary["column_names"])
            with c_y_col:
                y_options = [None] + summary["numeric_columns"]
                y_col = st.selectbox("Y-Axis / Measure (Optional)", y_options)
            with c_color_col:
                color_options = [None] + summary["column_names"]
                color_col = st.selectbox("Color Dimension (Optional)", color_options)

            if st.button("Generate Chart", type="primary"):
                fig = DataAnalyzer.create_chart(df, chart_type, x_col, y_col, color_col)
                st.plotly_chart(fig, use_container_width=True)

        with tab_ai:
            st.markdown("### Ask White Owl About This Dataset")
            st.caption("Ask questions like: 'Which segment drives highest revenue?', 'Find outlier values', 'Summarize key risks'")
            
            data_q = st.text_input("Analytical Question", placeholder="What are the top 5 key insights from this dataset?", key="data_ai_input")
            if st.button("Analyze Dataset", type="primary") and data_q:
                prompt = DataAnalyzer.prepare_analysis_prompt(data_q, df)
                placeholder = st.empty()
                full_ans = ""
                with st.spinner("Analyzing dataset dimensions and distributions..."):
                    for chunk in stream_chat(
                        messages=[{"role": "user", "content": prompt}],
                        model_name=st.session_state.get("selected_model", "gemini-2.5-flash"),
                        style="Detailed",
                        temperature=0.4
                    ):
                        full_ans += chunk
                        placeholder.markdown(full_ans + "▌")
                placeholder.markdown(full_ans)

def render_text_assistant_view():
    """Renders the 8-in-1 Text Polish and Transformation Suite."""
    st.markdown("## 📝 Text Assistant")
    st.caption("Transform, summarize, polish, translate, and synthesize copy with specialized AI modes.")

    tasks = TextAssistant.get_task_names()
    selected_task = st.selectbox("Select Task", tasks)
    st.info(TextAssistant.get_task_description(selected_task))

    target_lang = "Spanish"
    if selected_task == "Language Translation":
        target_lang = st.selectbox("Target Language", SUPPORTED_LANGUAGES)

    user_text = st.text_area("Input Text", height=180, placeholder="Paste your raw text, draft, notes, or article here...")

    if st.button("Generate Transformation", type="primary") and user_text.strip():
        prompt = TextAssistant.build_prompt(selected_task, user_text, target_lang)
        placeholder = st.empty()
        full_ans = ""
        with st.spinner("White Owl is refining your text..."):
            for chunk in stream_chat(
                messages=[{"role": "user", "content": prompt}],
                model_name=st.session_state.get("selected_model", "gemini-2.5-flash"),
                style=st.session_state.get("response_style", "Balanced"),
                temperature=0.6
            ):
                full_ans += chunk
                placeholder.markdown(full_ans + "▌")
        placeholder.markdown(full_ans)

def render_code_assistant_view():
    """Renders the Developer and SQL Optimization Studio."""
    st.markdown("## 💻 Code Assistant")
    st.caption("Explain complex algorithms, pinpoint bugs, convert between languages, and tune SQL queries.")

    modes = CodeAssistant.get_modes()
    selected_mode = st.selectbox("Operation Mode", modes)
    st.info(CodeAssistant.get_mode_description(selected_mode))

    c1, c2 = st.columns(2)
    with c1:
        src_lang = st.selectbox("Source Language", CODE_LANGUAGES, index=0)
    with c2:
        target_lang = "TypeScript"
        if selected_mode == "Language Conversion":
            target_lang = st.selectbox("Target Language", CODE_LANGUAGES, index=2)

    code_input = st.text_area("Source Code", height=200, placeholder="Paste your code snippet or SQL query here...", key="code_area")

    if st.button("Execute Code Analysis", type="primary") and code_input.strip():
        prompt = CodeAssistant.build_prompt(selected_mode, code_input, src_lang, target_lang)
        placeholder = st.empty()
        full_ans = ""
        with st.spinner("Analyzing syntax trees and logic paths..."):
            for chunk in stream_chat(
                messages=[{"role": "user", "content": prompt}],
                model_name=st.session_state.get("selected_model", "gemini-2.5-flash"),
                style="Technical",
                temperature=0.2
            ):
                full_ans += chunk
                placeholder.markdown(full_ans + "▌")
        placeholder.markdown(full_ans)

def render_image_assistant_view():
    """Renders the Multimodal Visual Intelligence workspace."""
    st.markdown("## 🖼️ Image Assistant")
    st.caption("Upload images (.png, .jpg, .webp) for visual understanding, OCR text extraction, and diagram analysis.")

    uploaded_img = st.file_uploader("Upload Image", type=["png", "jpg", "jpeg", "webp"], key="img_uploader")

    if uploaded_img:
        img_bytes = uploaded_img.read()
        val_result = ImageAssistant.validate_image(img_bytes)

        if not val_result["valid"]:
            st.error(val_result.get("error", "Invalid image file."))
            return

        col_img, col_tasks = st.columns([1, 1])
        with col_img:
            st.image(img_bytes, caption=f"{uploaded_img.name} ({val_result['width']}x{val_result['height']} px)", use_container_width=True)

        with col_tasks:
            tasks = ImageAssistant.get_task_names()
            selected_task = st.selectbox("Visual Task", tasks)
            custom_q = st.text_input("Custom Question (Optional)", placeholder="e.g. What is the key takeaway in this diagram?")

            if st.button("Analyze Image", type="primary"):
                prompt = ImageAssistant.build_prompt(selected_task, custom_q)
                with st.spinner("White Owl is scanning visual features..."):
                    mime = f"image/{val_result['format'].lower()}"
                    ans = analyze_image(
                        image_bytes=img_bytes,
                        mime_type=mime,
                        prompt=prompt,
                        model_name=st.session_state.get("selected_model", "gemini-2.5-flash")
                    )
                st.markdown("### Analysis Result")
                st.markdown(ans)

def render_about_view():
    """Renders the White Owl application manifesto and version information."""
    st.markdown(
        """
        <div class="owl-hero-container">
            <div class="owl-icon">🦉</div>
            <h1 class="owl-title">WHITE OWL</h1>
            <div class="owl-tagline">Think. Ask. Discover.</div>
            <p style="color: #8b949e; max-width: 600px; margin: 1rem auto 0 auto; font-size: 1.05rem; line-height: 1.6;">
                Your intelligent AI workspace. White Owl helps you chat with AI, analyze documents,
                understand datasets, work with code, and generate useful content from one unified interface.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.markdown("### 🌟 Core Capabilities")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown(
            """
            **💬 Main Chatbot**
            - Multi-turn conversation memory
            - Streaming answers & thinking status
            - Parameter tuning & style personas
            - SQLite persistence & MD/TXT export
            """
        )
    with c2:
        st.markdown(
            """
            **📄 Document & Data**
            - PDF page extraction & chunk citation
            - CSV/Excel profiling & health metrics
            - Interactive Plotly visualizations
            - Natural language dataset exploration
            """
        )
    with c3:
        st.markdown(
            """
            **💻 Code & Vision**
            - Bug finding & query optimization
            - Idiomatic language conversion
            - Multimodal OCR & diagram breakdowns
            - 8-in-1 Text Polish suite
            """
        )

    st.markdown("---")
    st.markdown(
        """
        <div style="text-align: center; color: #8b949e; font-size: 0.85rem;">
            White Owl AI Workspace • Version 1.0.0 • Built with Python & Streamlit
        </div>
        """,
        unsafe_allow_html=True
    )
