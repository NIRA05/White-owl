import React, { useState } from "react";
import { Upload, FileText, Send, CheckCircle2, BookOpen } from "lucide-react";

interface PDFAssistantViewProps {
  isDark: boolean;
  onSendDocumentQuery: (query: string, docName: string, docContext: string) => Promise<string>;
}

export const PDFAssistantView: React.FC<PDFAssistantViewProps> = ({ isDark, onSendDocumentQuery }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");
    setQaHistory([]);

    try {
      if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const base64Data = (event.target?.result as string) || "";
            const response = await fetch("/api/parse-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileBase64: base64Data,
                fileName: file.name,
              }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
              throw new Error(data.error || "Could not parse PDF text.");
            }

            setExtractedText(data.text || "");
            setPageCount(data.numpages || 1);
            setWordCount(data.wordCount || 0);
          } catch (err: any) {
            alert("PDF Parse Error: " + err.message);
          } finally {
            setIsParsing(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = (event.target?.result as string) || "";
          setExtractedText(content);
          setIsParsing(false);
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      alert("Error reading file: " + err.message);
      setIsParsing(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !fileName || isProcessing) return;

    const userQ = query.trim();
    setQuery("");
    setIsProcessing(true);

    try {
      const answer = await onSendDocumentQuery(userQ, fileName, extractedText);
      setQaHistory((prev) => [...prev, { q: userQ, a: answer }]);
    } catch (err: any) {
      setQaHistory((prev) => [...prev, { q: userQ, a: `⚠️ Document query error: ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" />
          <span>Document Intelligence</span>
        </div>
        <h2 className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-black"}`}>PDF Assistant</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Upload PDF reports, research papers, or manuals to extract page-level citations and get instant answers.
        </p>
      </div>

      {/* Upload Box */}
      <div className={`p-8 rounded-3xl border-2 border-dashed transition-all mb-8 text-center ${
        isDark ? "bg-black border-zinc-800 hover:border-red-500/50" : "bg-white border-zinc-300 hover:border-red-500/50"
      }`}>
        <input
          type="file"
          id="pdf-file-input"
          accept=".pdf,.txt,.md,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label
          htmlFor="pdf-file-input"
          className="cursor-pointer flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 shadow-inner">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-sm text-red-500 hover:underline">Click to upload document</span>
            <span className="text-zinc-400 text-xs block mt-1">PDF, TXT, or Markdown files</span>
          </div>
        </label>

        {isParsing && (
          <div className="mt-4 text-xs text-red-500 font-medium animate-pulse">
            Extracting text from PDF...
          </div>
        )}

        {fileName && !isParsing && (
          <div className="mt-6 inline-flex items-center gap-4 py-2 px-4 rounded-xl bg-red-600/10 border border-red-600/30 text-xs text-red-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{fileName}</span>
            <span className="text-zinc-500">|</span>
            <span>{pageCount} Pages</span>
            <span className="text-zinc-500">|</span>
            <span>{fileSize}</span>
          </div>
        )}
      </div>

      {/* Q&A Stream */}
      {fileName && (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="space-y-4">
            {qaHistory.map((item, idx) => (
              <div key={idx} className="space-y-3">
                <div className={`p-4 rounded-2xl rounded-br-none border ${
                  isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-100 border-zinc-300 text-black"
                }`}>
                  <div className="text-xs font-bold text-zinc-400 mb-1">👤 You</div>
                  <div className="text-sm">{item.q}</div>
                </div>
                <div className={`p-5 rounded-2xl rounded-bl-none border ${
                  isDark ? "bg-black border-red-600/40 shadow-md text-zinc-100" : "bg-white border-red-500/20 shadow-md text-zinc-900"
                }`}>
                  <div className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>White Owl (Document Citations)</span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{item.a}</div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="p-4 rounded-2xl border border-red-500/25 flex items-center gap-3 bg-red-500/5">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium text-red-500">Examining document pages & verifying facts...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAsk} className="sticky bottom-4 pt-4">
            <div className="relative flex items-center">
              <input
                id="pdf-query-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ask a question about ${fileName}...`}
                disabled={isProcessing}
                className={`w-full py-3.5 pl-5 pr-14 rounded-2xl border text-sm outline-none transition-all shadow-lg ${
                  isDark ? "bg-black border-zinc-800 text-white focus:border-red-500" : "bg-white border-zinc-300 text-black focus:border-red-500"
                }`}
              />
              <button
                type="submit"
                disabled={!query.trim() || isProcessing}
                className="absolute right-2 p-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-red-600/25 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
