import React from "react";
import { MessageSquare, FileText, BarChart3, Code2, Shield, Cpu } from "lucide-react";
import { OwlAvatar } from "./OwlAvatar";

interface AboutViewProps {
  isDark?: boolean;
}

export const AboutView: React.FC<AboutViewProps> = ({ isDark = true }) => {
  return (
    <div className={`flex-1 flex flex-col h-screen overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full ${isDark ? "bg-black" : "bg-white"}`}>
      {/* Brand Hero - Directly on the Pure Black Board */}
      <div className="text-center py-6 px-4 mb-8">
        <div className="flex justify-center mb-3">
          <OwlAvatar size="hero" showGlow />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-red-500 uppercase mb-1">
          WHITE OWL
        </h1>
        <p className="text-xs md:text-sm tracking-[0.25em] text-zinc-400 font-semibold uppercase mb-3">
          Think. Ask. Discover.
        </p>
        <p className="text-zinc-200 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          Your unified AI workspace designed for executive decision-makers, software engineers, data analysts, and researchers.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Unified Capability Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
            isDark ? "border-zinc-800/80 bg-black" : "border-zinc-200 bg-white shadow-sm"
          }`}>
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`font-bold text-sm mb-1 ${isDark ? "text-white" : "text-black"}`}>Contextual Chatbot</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Multi-turn conversation memory with rolling context windowing, streaming responses, and 6 specialized persona response styles.
              </p>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
            isDark ? "border-zinc-800/80 bg-black" : "border-zinc-200 bg-white shadow-sm"
          }`}>
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`font-bold text-sm mb-1 ${isDark ? "text-white" : "text-black"}`}>PDF & Document Intelligence</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                In-memory page extraction and chunking with citation attribution, clearly distinguishing source findings from general knowledge.
              </p>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
            isDark ? "border-zinc-800/80 bg-black" : "border-zinc-200 bg-white shadow-sm"
          }`}>
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`font-bold text-sm mb-1 ${isDark ? "text-white" : "text-black"}`}>Data & Tabular Analyst</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Automated statistical health checks, interactive charts (Bar, Line, Pie), and natural language SQL/Pandas question interpretation.
              </p>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
            isDark ? "border-zinc-800/80 bg-black" : "border-zinc-200 bg-white shadow-sm"
          }`}>
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 flex-shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`font-bold text-sm mb-1 ${isDark ? "text-white" : "text-black"}`}>Developer Studio & Vision</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Code deconstruction, bug patching, SQL index optimization, cross-language conversion, and multimodal OCR vision analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Technical spec footer */}
        <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs ${
          isDark ? "border-zinc-800/80 bg-black text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
        }`}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span>Zero Data Leakage • Server-side Protected Secrets</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Powered by Gemini 2.5 Multi-Modal Reasoning</span>
          </div>
          <div>Version 1.0.0</div>
        </div>
      </div>
    </div>
  );
};
