import React, { useState } from "react";
import { 
  MessageSquare, 
  FileText, 
  BarChart3, 
  FileEdit, 
  Code2, 
  Image as ImageIcon, 
  Info, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Sliders, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertCircle,
  PanelLeftClose
} from "lucide-react";
import { WorkspaceMode, Conversation, ResponseStyle } from "../types";
import { OwlAvatar } from "./OwlAvatar";

interface SidebarProps {
  currentMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  conversations: Conversation[];
  activeConvId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
  responseStyle: ResponseStyle;
  onChangeResponseStyle: (style: ResponseStyle) => void;
  temperature: number;
  onChangeTemperature: (temp: number) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onToggleCollapse?: () => void;
  apiStatus: { configured: boolean; keyMasked: string; activeProvider?: string; grokConfigured?: boolean; geminiConfigured?: boolean };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  selectedModel,
  onChangeModel,
  responseStyle,
  onChangeResponseStyle,
  temperature,
  onChangeTemperature,
  isDark,
  onToggleTheme,
  onToggleCollapse,
  apiStatus,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const navItems: { mode: WorkspaceMode; label: string; icon: React.ReactNode }[] = [
    { mode: "chat", label: "Main Chatbot", icon: <MessageSquare className="w-4 h-4" /> },
    { mode: "pdf", label: "PDF Assistant", icon: <FileText className="w-4 h-4" /> },
    { mode: "data", label: "Data Analyst", icon: <BarChart3 className="w-4 h-4" /> },
    { mode: "text", label: "Text Assistant", icon: <FileEdit className="w-4 h-4" /> },
    { mode: "code", label: "Code Assistant", icon: <Code2 className="w-4 h-4" /> },
    { mode: "image", label: "Image Assistant", icon: <ImageIcon className="w-4 h-4" /> },
    { mode: "about", label: "About White Owl", icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <aside 
      id="white-owl-sidebar"
      className={`w-72 flex-shrink-0 flex flex-col border-r h-screen transition-colors duration-200 ${
        isDark ? "bg-black border-zinc-900 text-white" : "bg-white border-zinc-200 text-zinc-950"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-inherit flex items-center justify-between">
        <div className="flex items-center gap-3">
          <OwlAvatar size="md" />
          <div>
            <h1 className="font-extrabold text-base tracking-wider text-red-500 uppercase">WHITE OWL</h1>
            <p className="text-[10px] tracking-widest text-zinc-400 uppercase font-semibold">Think. Ask. Discover.</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-zinc-500/10 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {onToggleCollapse && (
            <button
              id="sidebar-close-btn"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-zinc-500/10 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Close Sidebar"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          id="new-chat-btn"
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-md hover:shadow-red-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Navigation Modes */}
      <div className="px-3 py-1 space-y-0.5">
        <div className="px-2 pb-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Workspace Modes
        </div>
        {navItems.map((item) => {
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              id={`nav-mode-${item.mode}`}
              onClick={() => onSelectMode(item.mode)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-red-600/15 text-red-500 border border-red-600/30 shadow-sm"
                  : isDark 
                    ? "hover:bg-zinc-900 text-zinc-300 hover:text-white" 
                    : "hover:bg-zinc-100 text-zinc-700 hover:text-black"
              }`}
            >
              <span className={isActive ? "text-red-500" : "text-zinc-400"}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Middle: Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 pt-2 pb-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span>Chat History</span>
          <span className="text-[10px] font-normal text-zinc-500">{conversations.length}</span>
        </div>

        {conversations.length === 0 ? (
          <div className="text-xs text-zinc-500 px-3 py-4 text-center">
            No saved conversations yet.
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConvId;
            return (
              <div
                key={conv.id}
                id={`chat-history-item-${conv.id}`}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-red-600/10 border border-red-600/25 text-red-400 font-medium"
                    : isDark 
                      ? "hover:bg-zinc-900 text-zinc-300" 
                      : "hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                {editingId === conv.id ? (
                  <div className="flex items-center gap-1.5 flex-1 mr-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(conv.id)}
                      className="w-full bg-black border border-red-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-red-500"
                      autoFocus
                    />
                    <button
                      onClick={() => saveRename(conv.id)}
                      className="p-1 hover:text-emerald-400 text-zinc-400 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onSelectConversation(conv.id);
                      if (currentMode !== "chat") onSelectMode("chat");
                    }}
                    className="flex-1 text-left truncate mr-2 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-[10px] text-zinc-500">{isActive ? "▶" : "•"}</span>
                    <span className="truncate">{conv.title}</span>
                  </button>
                )}

                {editingId !== conv.id && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button
                      onClick={() => startRename(conv)}
                      className="p-1 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Rename"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteConversation(conv.id)}
                      className="p-1 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Settings Panel Accordion */}
      <div className="p-3 border-t border-inherit">
        <button
          id="toggle-settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            isDark ? "hover:bg-zinc-900 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>AI Model & Parameters</span>
          </div>
          <span className="text-[10px] text-red-500 font-mono">{showSettings ? "▲" : "▼"}</span>
        </button>

        {showSettings && (
          <div className={`mt-2 p-3 rounded-xl border text-xs space-y-3 ${
            isDark ? "bg-black border-zinc-900" : "bg-white border-zinc-200 shadow-sm"
          }`}>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">AI Model Engine</label>
              <select
                id="select-ai-model"
                value={selectedModel}
                onChange={(e) => onChangeModel(e.target.value)}
                className={`w-full rounded-md border px-2 py-1.5 text-xs outline-none focus:border-red-500 ${
                  isDark ? "border-zinc-800 bg-black text-white" : "border-zinc-300 bg-zinc-50 text-black"
                }`}
              >
                <optgroup label="xAI Grok Models">
                  <option value="grok-2-latest">Grok 2.0 (xAI Flagship Reasoning)</option>
                  <option value="grok-2-vision-1212">Grok 2 Vision (Multimodal)</option>
                  <option value="grok-beta">Grok Beta (Fast & Conversational)</option>
                </optgroup>
                <optgroup label="Google Gemini Models">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-fast)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Code & Analysis)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Standard)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Response Style</label>
              <select
                id="select-response-style"
                value={responseStyle}
                onChange={(e) => onChangeResponseStyle(e.target.value as ResponseStyle)}
                className={`w-full rounded-md border px-2 py-1.5 text-xs outline-none focus:border-red-500 ${
                  isDark ? "border-zinc-800 bg-black text-white" : "border-zinc-300 bg-zinc-50 text-black"
                }`}
              >
                <option value="Balanced">Balanced (Clear & Structured)</option>
                <option value="Concise">Concise (Punchy & Direct)</option>
                <option value="Detailed">Detailed (Deep Dive & Context)</option>
                <option value="Professional">Professional (Executive Decorum)</option>
                <option value="Friendly">Friendly (Approachable Mentor)</option>
                <option value="Technical">Technical (Engineering & Big-O)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase mb-1">
                <span>Temperature</span>
                <span className="text-red-400 font-bold">{temperature}</span>
              </div>
              <input
                id="range-temperature"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* API Connection Status Badge */}
        <div className="mt-2.5">
          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
            apiStatus.configured
              ? isDark ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {apiStatus.configured ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="truncate flex-1">
                  <div className="font-bold text-[11px] uppercase tracking-wide leading-none flex items-center justify-between">
                    <span>{apiStatus.activeProvider || "AI Engine Connected"}</span>
                  </div>
                  <div className="text-[9px] text-zinc-400 truncate mt-0.5">Key: {apiStatus.keyMasked}</div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[11px] uppercase tracking-wide leading-none">API Key Missing</div>
                  <div className="text-[9px] text-zinc-400 truncate mt-0.5">Add GROK_API_KEY or GEMINI_API_KEY</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
