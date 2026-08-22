# 🦉 WHITE OWL — AI Workspace & Chatbot

> **Think. Ask. Discover.**  
> A full-stack AI workspace built with Python and Streamlit, featuring multi-turn conversation memory, document intelligence, CSV/Excel data analytics, code deconstruction, and multimodal vision.

---

## 🌟 Key Features

1. **💬 Main Conversational AI**
   - Streaming responses with a real-time thinking indicator.
   - Context windowing management to avoid uncontrolled token inflation.
   - Persistent SQLite conversation history with rename, clear, and delete options.
   - One-click export to Markdown (`.md`) and Plain Text (`.txt`).
   - Quick prompt accelerators for immediate discovery.

2. **📄 PDF Document Assistant**
   - In-memory PDF text extraction and chunking with `pypdf`.
   - Page-level citation attribution and source vs. general AI knowledge distinction.

3. **📊 CSV / Excel Data Analyst**
   - Ingests `.csv`, `.xlsx`, and `.xls` files into Pandas DataFrames.
   - Automatic health profiling (missing cells, data types, statistics).
   - Interactive Plotly charts (Bar, Line, Scatter, Histogram, Pie, Box).
   - Natural language queries translated into analytical summaries.

4. **📝 Text Assistant**
   - 8 specialized NLP modes: Summarization, Rewriting, Grammar Correction, Professional Polishing, Email Drafting, Content Creation, Translation (12+ languages), and Keyword Extraction.

5. **💻 Code Assistant**
   - Code explanation with Big-O complexity breakdown.
   - Bug detection, security vulnerability checks, and patches.
   - SQL query optimization with indexing recommendations.
   - Cross-language code translation (Python, JS, TS, Java, Go, Rust, C++, etc.).

6. **🖼️ Image Assistant**
   - Multimodal image processing (`.png`, `.jpg`, `.jpeg`, `.webp`).
   - OCR transcription, diagram/architecture deconstruction, and visual QA.

7. **⚙️ Workspace Customization**
   - Model switching (Gemini 2.5 Flash, Gemini 2.5 Pro, Gemini 1.5 Flash/Pro).
   - 6 Response Persona Styles: Balanced, Concise, Detailed, Professional, Friendly, Technical.
   - Fine-grained temperature and token output controls.
   - Dark / Light UI theme toggling.

---

## 📂 Project Architecture

```text
white-owl/
│
├── app.py                     # Streamlit application entry point & view router
├── requirements.txt           # Python dependencies
├── README.md                  # Comprehensive setup & deployment guide
├── .gitignore                 # Excludes cache, secrets, and SQLite databases
├── .env.example               # Environment variables template
│
├── .streamlit/
│   └── config.toml            # Custom theme & server configuration
│
├── modules/
│   ├── __init__.py
│   ├── ai_client.py           # Gemini API client, key manager & streaming engine
│   ├── chat_manager.py        # Conversation memory, windowing, and exports
│   ├── database.py            # SQLite parameter-safe query manager
│   ├── pdf_assistant.py       # PDF parsing, chunking, and document prompt engine
│   ├── data_analyzer.py       # Pandas statistics, schema profiling & Plotly charts
│   ├── text_assistant.py      # 8-in-1 text transformation suite
│   ├── code_assistant.py      # Code explanation, bug finding, & SQL optimizer
│   ├── image_assistant.py     # Pillow verification & multimodal vision prompts
│   └── utils.py               # Formatting, sanitization, & error handlers
│
├── ui/
│   ├── __init__.py
│   ├── styles.py              # Dark/light theme injection & custom CSS cards
│   ├── sidebar.py             # Drawer navigation, history list, & settings
│   ├── chat_ui.py             # Primary chat screen, hero banner, & prompt cards
│   └── components.py          # Dedicated views for tools (PDF, Data, Text, Code, Image)
│
└── data/                      # Local storage directory for SQLite database
```

---

## 🚀 Local Quickstart

### 1. Clone & Environment Setup
```bash
git clone <repository_url>
cd white-owl
python3 -m venv venv
```

**Activate Virtual Environment:**
- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```
- **Windows:**
  ```bash
  venv\Scripts\activate
  ```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure API Key
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Edit `.env` and set your key:
```env
AI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Application
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## ☁️ Deployment on Streamlit Community Cloud

1. Push your repository to **GitHub**.
2. Go to [share.streamlit.io](https://share.streamlit.io) and click **New app**.
3. Select your repository, branch (`main`), and set the main file path to `app.py`.
4. In **Advanced Settings > Secrets**, configure:
   ```toml
   AI_API_KEY = "your_gemini_api_key_here"
   ```
5. Click **Deploy!**

---

## 🔒 Security Best Practices
- **Never hardcode credentials**: White Owl uses `python-dotenv` for local `.env` and `st.secrets` in cloud environments.
- **Sanitized SQL execution**: All SQLite queries use parameterized placeholders (`?`).
- **No arbitrary code execution**: Dataset analytics and code assistants operate in a safe, controlled sandbox without `exec()` or `eval()`.
