import React, { useState } from "react";
import { FileEdit, Copy, Check, Sparkles } from "lucide-react";

interface TextAssistantViewProps {
  isDark: boolean;
  onTransformText: (task: string, text: string, targetLang?: string) => Promise<string>;
}

const TEXT_TASKS = [
  { id: "Summarization", label: "Summarization", desc: "Condense text into high-impact bullet points and executive summary." },
  { id: "Rewriting", label: "Rewriting", desc: "Improve flow, cadence, clarity, and tone." },
  { id: "Grammar & Proofreading", label: "Grammar & Proofreading", desc: "Fix spelling, punctuation, and syntax errors." },
  { id: "Professional Polishing", label: "Professional Polishing", desc: "Elevate tone to executive corporate standard." },
  { id: "Email Drafting", label: "Email Drafting", desc: "Transform notes into a structured, persuasive email." },
  { id: "Content Creation", label: "Content Creation", desc: "Expand an outline or idea into a rich article." },
  { id: "Language Translation", label: "Language Translation", desc: "Accurately translate into target language." },
  { id: "Keyword Extraction", label: "Keyword & Entity Extraction", desc: "Extract primary keywords, entities, and tags." }
];

const LANGUAGES = [
  "Spanish", "French", "German", "Japanese", "Chinese (Mandarin)",
  "Italian", "Portuguese", "Hindi", "Arabic", "Russian", "Korean", "Dutch"
];

export const TextAssistantView: React.FC<TextAssistantViewProps> = ({ isDark, onTransformText }) => {
  const [selectedTask, setSelectedTask] = useState(TEXT_TASKS[0].id);
  const [targetLang, setTargetLang] = useState("Spanish");
  const [inputText, setInputText] = useState("");
  const [resultText, setResultText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await onTransformText(selectedTask, inputText, targetLang);
      setResultText(res);
    } catch (err: any) {
      setResultText(`⚠️ Transformation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
          <FileEdit className="w-4 h-4" />
          <span>Copywriting & Linguistic Suite</span>
        </div>
        <h2 className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-black"}`}>Text Assistant</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Transform, summarize, rewrite, translate, and polish copy with specialized AI modes.
        </p>
      </div>

      {/* Task Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        {TEXT_TASKS.map((task) => (
          <button
            key={task.id}
            onClick={() => setSelectedTask(task.id)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedTask === task.id
                ? "bg-red-600/15 border-red-600/50 text-red-500 shadow-sm"
                : isDark ? "bg-black border-zinc-800 text-zinc-300 hover:border-zinc-700" : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
            }`}
          >
            <div className="font-bold text-xs truncate">{task.label}</div>
            <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{task.desc}</div>
          </button>
        ))}
      </div>

      {/* Optional Language selector for translation */}
      {selectedTask === "Language Translation" && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs font-bold text-zinc-400 uppercase">Target Language:</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className={`rounded-lg border text-xs px-3 py-1.5 outline-none focus:border-red-500 ${
              isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-100 border-zinc-300 text-black"
            }`}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      )}

      {/* Input / Output Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Input Column */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Input Draft / Notes</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your raw notes, draft, or excerpt here..."
            className={`flex-1 min-h-[220px] p-4 rounded-2xl border text-sm outline-none resize-none ${
              isDark ? "bg-black border-zinc-800 text-white focus:border-red-500" : "bg-white border-zinc-200 text-black focus:border-red-500"
            }`}
          />
          <button
            onClick={handleGenerate}
            disabled={!inputText.trim() || isGenerating}
            className="mt-3 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-600/25"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? "Refining Text..." : "Transform Copy"}</span>
          </button>
        </div>

        {/* Result Column */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-red-500 uppercase tracking-wider">Refined Output</label>
            {resultText && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
          <div className={`flex-1 min-h-[220px] p-4 rounded-2xl border text-sm overflow-y-auto whitespace-pre-wrap leading-relaxed ${
            isDark ? "bg-black border-red-600/25 text-zinc-100 shadow-md" : "bg-zinc-50 border-red-500/20 text-zinc-900 shadow-md"
          }`}>
            {resultText || <span className="text-zinc-500 italic">Click "Transform Copy" to generate the refined output...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
