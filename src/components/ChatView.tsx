import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  Bot,
  PanelLeftOpen
} from "lucide-react";
import { Message, ResponseStyle } from "../types";
import { OwlAvatar } from "./OwlAvatar";

interface ChatViewProps {
  conversationTitle: string;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  onClearMessages: () => void;
  isStreaming: boolean;
  isDark: boolean;
  selectedModel: string;
  responseStyle: ResponseStyle;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: "💡",
    title: "Explain a Concept",
    desc: "Explain quantum computing and superposition like I'm a beginner.",
    prompt: "Explain quantum computing and superposition like I'm a beginner with intuitive analogies."
  },
  {
    icon: "📊",
    title: "Data Insights",
    desc: "Help me calculate customer lifetime value and detect churn anomalies.",
    prompt: "How do I calculate Customer Lifetime Value (CLV) and detect churn anomalies in subscription data?"
  },
  {
    icon: "📄",
    title: "Document Review",
    desc: "How should I structure an executive summary for a strategic audit?",
    prompt: "Outline an executive summary framework for a corporate strategic audit."
  },
  {
    icon: "💻",
    title: "Code Architecture",
    desc: "Design a resilient asynchronous task queue pattern in Python.",
    prompt: "Write a clean, resilient asynchronous task queue implementation in Python with error handling."
  },
  {
    icon: "📝",
    title: "Executive Polish",
    desc: "Transform brief bullet points into an articulate boardroom proposal.",
    prompt: "Elevate these notes into a polished boardroom proposal: We need to modernize our AI stack to reduce support ticket latency by 40%."
  }
];

export const ChatView: React.FC<ChatViewProps> = ({
  conversationTitle,
  messages,
  onSendMessage,
  onClearMessages,
  isStreaming,
  isDark,
  selectedModel,
  responseStyle,
  onToggleSidebar,
  isSidebarCollapsed = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const text = inputText.trim();
    setInputText("");
    await onSendMessage(text);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const exportChat = (format: "md" | "txt") => {
    const dateStr = new Date().toISOString();
    let content = "";
    if (format === "md") {
      content = `# 🦉 WHITE OWL — CONVERSATION EXPORT\n**Title:** ${conversationTitle}\n**Date:** ${dateStr}\n**Model:** ${selectedModel}\n**Style:** ${responseStyle}\n\n---\n\n` +
        messages.map((m) => `### ${m.role === "user" ? "👤 User" : "🦉 White Owl"}\n\n${m.content}\n\n---`).join("\n\n");
    } else {
      content = `WHITE OWL CONVERSATION EXPORT\nTitle: ${conversationTitle}\nDate: ${dateStr}\n\n` +
        messages.map((m) => `${m.role === "user" ? "USER" : "WHITE OWL"}:\n${m.content}\n----------------------------------------`).join("\n\n");
    }

    const blob = new Blob([content], { type: format === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `white_owl_export_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex-1 flex flex-col h-screen overflow-hidden relative ${isDark ? "bg-black" : "bg-white"}`}>
      {/* Top Bar */}
      <header className={`px-6 py-3 border-b flex items-center justify-between transition-colors ${
        isDark ? "bg-black border-zinc-900" : "bg-white border-zinc-200"
      }`}>
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              id="sidebar-open-btn"
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                isSidebarCollapsed
                  ? "border-red-600/40 bg-red-600/10 text-red-500 hover:bg-red-600/20 shadow-sm"
                  : "border-zinc-800 text-zinc-400 hover:text-white"
              }`}
              title={isSidebarCollapsed ? "Open Sidebar" : "Toggle Sidebar"}
              aria-label={isSidebarCollapsed ? "Open sidebar" : "Toggle sidebar"}
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          <OwlAvatar size="sm" />
          <div>
            <h2 className="font-bold text-sm text-red-500 tracking-wide truncate max-w-md">
              {conversationTitle || "New Conversation"}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span>{selectedModel}</span>
              <span>•</span>
              <span className="text-red-400 font-medium">{responseStyle} Style</span>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              id="export-md-btn"
              onClick={() => exportChat("md")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isDark ? "border-zinc-800 bg-black hover:bg-zinc-950 text-zinc-200 hover:text-white" : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
              }`}
              title="Export as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.MD</span>
            </button>
            <button
              id="export-txt-btn"
              onClick={() => exportChat("txt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isDark ? "border-zinc-800 bg-black hover:bg-zinc-950 text-zinc-200 hover:text-white" : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
              }`}
              title="Export as Plain Text"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.TXT</span>
            </button>
            <button
              id="clear-chat-btn"
              onClick={onClearMessages}
              className={`p-1.5 rounded-lg border transition-colors text-zinc-400 hover:text-red-400 cursor-pointer ${
                isDark ? "border-zinc-900 hover:bg-zinc-950" : "border-zinc-300 hover:bg-zinc-100"
              }`}
              title="Clear Current Messages"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Main Chat Scroll Container */}
      <div className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 ${isDark ? "bg-black" : "bg-white"}`}>
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto py-8">
            {/* Hero Welcome Section - Directly on the Pure Black Dashboard Canvas */}
            <div className="text-center py-8 px-4 mb-6 relative">
              <div className="flex justify-center mb-3">
                <OwlAvatar size="hero" showGlow />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-red-500 uppercase mb-1">
                WHITE OWL
              </h1>
              <p className="text-xs md:text-sm tracking-[0.25em] text-zinc-400 font-semibold uppercase mb-3">
                Think. Ask. Discover.
              </p>
              <p className="text-zinc-200 text-base md:text-lg font-medium max-w-md mx-auto">
                How can I help you today?
              </p>
            </div>

            {/* Quick Prompts Bento */}
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 px-1">
                Suggested Explorations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    id={`quick-prompt-${idx}`}
                    onClick={() => onSendMessage(qp.prompt)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                      isDark
                        ? "bg-black border-zinc-800/80 hover:border-red-500 hover:shadow-[0_8px_25px_rgba(220,38,38,0.2)]"
                        : "bg-white border-zinc-200 hover:border-red-500/50 hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{qp.icon}</span>
                        <span className="font-bold text-xs text-red-500">{qp.title}</span>
                      </div>
                      <p className="text-[12px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {qp.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-red-400 font-semibold mt-3">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                id={`chat-message-${idx}`}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`w-full max-w-2xl rounded-2xl p-4 md:p-5 border transition-all shadow-sm ${
                    msg.role === "user"
                      ? isDark
                        ? "bg-black border-zinc-800 text-white rounded-br-none"
                        : "bg-zinc-100 border-zinc-300 text-black rounded-br-none"
                      : isDark
                        ? "bg-black border-red-600/40 text-zinc-100 rounded-bl-none shadow-lg shadow-red-950/20"
                        : "bg-white border-red-500/20 text-zinc-900 rounded-bl-none shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit/40 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      {msg.role === "user" ? (
                        <span className="text-zinc-300 font-bold">👤 You</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1.5 font-bold">
                          <OwlAvatar size="xs" />
                          <span>White Owl</span>
                        </span>
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="p-1 text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                        title="Copy message"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex items-start">
                <div className={`rounded-2xl p-4 border rounded-bl-none flex items-center gap-3 ${
                  isDark ? "bg-black border-red-600/40 text-zinc-300" : "bg-white border-red-500/20 text-zinc-700"
                }`}>
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-medium text-red-500 animate-pulse">White Owl is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Field */}
      <div className={`p-4 md:p-6 border-t transition-colors ${
        isDark ? "bg-black border-zinc-900" : "bg-white border-zinc-200"
      }`}>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
          <input
            id="chat-input-field"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask White Owl anything..."
            disabled={isStreaming}
            className={`w-full py-3.5 pl-5 pr-14 rounded-2xl border text-sm outline-none transition-all shadow-sm ${
              isDark 
                ? "bg-black border-zinc-800 text-white placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            }`}
          />
          <button
            id="send-message-btn"
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            className="absolute right-2 p-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-bold transition-all shadow-md shadow-red-600/25 cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-[11px] text-center text-zinc-500 mt-2">
          White Owl can explain concepts, analyze datasets, synthesize documents, and review code.
        </div>
      </div>
    </div>
  );
};
