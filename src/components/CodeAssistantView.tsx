import React, { useState } from "react";
import { Code2, Copy, Check, Terminal, Bug, Zap, ArrowRightLeft, Database } from "lucide-react";

interface CodeAssistantViewProps {
  isDark: boolean;
  onExecuteCodeTask: (mode: string, code: string, lang: string, targetLang?: string) => Promise<string>;
}

const MODES = [
  { id: "Explain Code", label: "Explain Code", icon: <Terminal className="w-4 h-4" /> },
  { id: "Find Bugs & Fix", label: "Find Bugs & Fix", icon: <Bug className="w-4 h-4" /> },
  { id: "Optimize & Refactor", label: "Optimize & Refactor", icon: <Zap className="w-4 h-4" /> },
  { id: "Language Conversion", label: "Language Conversion", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { id: "SQL Query Optimization", label: "SQL Query Optimization", icon: <Database className="w-4 h-4" /> },
];

const LANGUAGES = [
  "Python", "JavaScript", "TypeScript", "SQL", "Java", "C++", "C#", "Go", "Rust", "PHP", "HTML/CSS"
];

export const CodeAssistantView: React.FC<CodeAssistantViewProps> = ({ isDark, onExecuteCodeTask }) => {
  const [selectedMode, setSelectedMode] = useState(MODES[0].id);
  const [sourceLang, setSourceLang] = useState("Python");
  const [targetLang, setTargetLang] = useState("TypeScript");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!codeSnippet.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await onExecuteCodeTask(selectedMode, codeSnippet, sourceLang, targetLang);
      setAnalysisResult(res);
    } catch (err: any) {
      setAnalysisResult(`⚠️ Code review error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
          <Code2 className="w-4 h-4" />
          <span>Developer & Database Studio</span>
        </div>
        <h2 className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-black"}`}>Code Assistant</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Explain algorithms, find bugs, optimize database queries, and convert between languages.
        </p>
      </div>

      {/* Modes Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              selectedMode === mode.id
                ? "bg-red-600/15 border-red-500 text-red-500 shadow-sm"
                : isDark ? "bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Language selectors */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Source:</label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className={`rounded-lg border text-xs px-2.5 py-1.5 outline-none focus:border-red-500 ${
              isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-100 border-zinc-300 text-black"
            }`}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {selectedMode === "Language Conversion" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Target:</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className={`rounded-lg border text-xs px-2.5 py-1.5 outline-none focus:border-red-500 ${
                isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-100 border-zinc-300 text-black"
              }`}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Code Editor & Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Code Snippet / Query</label>
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder="Paste code or SQL query here..."
            className={`flex-1 min-h-[240px] p-4 rounded-2xl border font-mono text-xs outline-none focus:border-red-500 resize-none shadow-inner ${
              isDark ? "border-zinc-800 bg-black text-zinc-100" : "border-zinc-300 bg-zinc-50 text-black"
            }`}
          />
          <button
            onClick={handleAnalyze}
            disabled={!codeSnippet.trim() || isProcessing}
            className="mt-3 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-600/20"
          >
            <Code2 className="w-4 h-4" />
            <span>{isProcessing ? "Analyzing Code Logic..." : `Execute ${selectedMode}`}</span>
          </button>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-red-500 uppercase tracking-wider">White Owl Code Review</label>
            {analysisResult && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
          <div className={`flex-1 min-h-[240px] p-4 rounded-2xl border text-xs overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed shadow-md ${
            isDark ? "border-red-600/30 bg-black text-zinc-100" : "border-red-500/20 bg-zinc-50 text-zinc-900"
          }`}>
            {analysisResult || <span className="text-zinc-500 font-sans italic">Click "Execute" to run the deconstruction & optimization...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
