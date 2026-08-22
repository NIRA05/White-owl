"""
White Owl PDF Assistant Module
Extracts, chunks, and contextualizes PDF documents for citation-backed question answering.
"""

import io
from typing import List, Dict, Any, Optional
import pypdf

class PDFAssistant:
    """Handles PDF parsing, page extraction, chunking, and contextual query generation."""

    @staticmethod
    def extract_pages(pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extracts text from each page of a PDF file using pypdf.
        Returns a list of dicts with page number and extracted text.
        """
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages_data = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages_data.append({
                "page_num": idx + 1,
                "text": text.strip(),
                "char_count": len(text)
            })
        return pages_data

    @staticmethod
    def create_chunks(pages_data: List[Dict[str, Any]], chunk_size: int = 1200, overlap: int = 150) -> List[Dict[str, Any]]:
        """
        Splits extracted page text into manageable overlapping chunks with page citations.
        """
        chunks = []
        for page in pages_data:
            page_text = page["text"]
            page_num = page["page_num"]
            if not page_text:
                continue

            start = 0
            while start < len(page_text):
                end = min(start + chunk_size, len(page_text))
                chunk_text = page_text[start:end]
                chunks.append({
                    "page_num": page_num,
                    "text": chunk_text
                })
                if end == len(page_text):
                    break
                start += (chunk_size - overlap)

        return chunks

    @staticmethod
    def build_pdf_context(chunks: List[Dict[str, Any]], max_chars: int = 16000) -> str:
        """
        Constructs a structured document context string with explicit page headers.
        """
        context_parts = []
        current_len = 0
        
        for idx, chunk in enumerate(chunks):
            part = f"--- [DOCUMENT PAGE {chunk['page_num']}] ---\n{chunk['text']}\n"
            if current_len + len(part) > max_chars:
                context_parts.append("\n[Document truncated for optimal token context...]")
                break
            context_parts.append(part)
            current_len += len(part)

        return "\n".join(context_parts)

    @staticmethod
    def prepare_pdf_prompt(user_query: str, doc_name: str, total_pages: int, pdf_context: str) -> str:
        """
        Builds a high-precision prompt instructing White Owl to cite pages and distinguish source vs general knowledge.
        """
        return f"""
You are acting as the White Owl Document Intelligence Engine.
You have been provided with excerpts from an uploaded document named "{doc_name}" ({total_pages} pages).

[DOCUMENT CONTEXT]:
{pdf_context}

[USER QUESTION]:
{user_query}

[INSTRUCTIONS]:
1. Ground your answer in the provided document context whenever possible.
2. Explicitly cite the page numbers (e.g. "[Page 3]", "[Pages 1-2]") where specific facts or findings are located.
3. Clearly distinguish between:
   - **Found in Document**: Exact findings, quotes, or numbers from the document.
   - **General AI Knowledge**: Complementary background context or definitions not explicitly in the text.
4. If the document does not contain the answer, politely state: "The uploaded document does not explicitly state this, however..." and provide the best known factual answer.
5. Format your response with clear headers, bullet points, and high readability.
"""
