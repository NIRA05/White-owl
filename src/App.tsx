import React, { useState, useEffect } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { ChatView } from "./components/ChatView";
import { PDFAssistantView } from "./components/PDFAssistantView";
import { DataAnalystView } from "./components/DataAnalystView";
import { TextAssistantView } from "./components/TextAssistantView";
import { CodeAssistantView } from "./components/CodeAssistantView";
import { ImageAssistantView } from "./components/ImageAssistantView";
import { AboutView } from "./components/AboutView";
import { WorkspaceMode, Conversation, Message, ResponseStyle } from "./types";

const STORAGE_KEY = "white_owl_conversations";
const PREFS_KEY = "white_owl_preferences";

export default function App() {
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>("chat");
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    const initialId = "conv_" + Date.now();
    return [
      {
        id: initialId,
        title: "New Conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      },
    ];
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    return conversations[0]?.id || "conv_" + Date.now();
  });

  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>("Balanced");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<{
    configured: boolean;
    keyMasked: string;
    activeProvider?: string;
    grokConfigured?: boolean;
    geminiConfigured?: boolean;
  }>({
    configured: true,
    keyMasked: "••••••••",
    activeProvider: "AI Engine",
  });

  // Check API health status on mount
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiConfigured !== undefined) {
          setApiStatus({
            configured: data.apiConfigured,
            keyMasked: data.keyMasked || "Configured",
            activeProvider: data.activeProvider,
            grokConfigured: data.grokConfigured,
            geminiConfigured: data.geminiConfigured,
          });
          if (data.geminiConfigured && !data.grokConfigured) {
            setSelectedModel("gemini-2.5-flash");
          } else if (data.grokConfigured && !data.geminiConfigured) {
            setSelectedModel("grok-2-latest");
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleNewChat = () => {
    const newId = "conv_" + Date.now();
    const newConv: Conversation = {
      id: newId,
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setCurrentMode("chat");
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fallbackId = "conv_" + Date.now();
        const fallback: Conversation = {
          id: fallbackId,
          title: "New Conversation",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        setActiveConvId(fallbackId);
        return [fallback];
      }
      if (activeConvId === id) {
        setActiveConvId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleClearMessages = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, messages: [], updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  // Streaming chat sender via SSE
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Auto-update conversation title if it's the first message
    const isFirst = activeConversation.messages.length === 0 || activeConversation.title === "New Conversation";
    const newTitle = isFirst ? text.slice(0, 30) + (text.length > 30 ? "..." : "") : activeConversation.title;

    const updatedMessages = [...activeConversation.messages, userMessage];

    // Optimistically update UI
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    setIsStreaming(true);

    try {
      // Rolling context window (last 10 messages)
      const contextWindow = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: contextWindow,
          model: selectedModel,
          style: responseStyle,
          temperature,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      // Append blank assistant message to stream into
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                messages: [
                  ...updatedMessages,
                  { role: "assistant", content: "", timestamp: new Date().toISOString() },
                ],
              }
            : c
        )
      );

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.text) {
                  assistantText += parsed.text;
                  // Update current message
                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== activeConvId) return c;
                      const msgs = [...c.messages];
                      const lastIdx = msgs.length - 1;
                      if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                        msgs[lastIdx] = { ...msgs[lastIdx], content: assistantText };
                      }
                      return { ...c, messages: msgs };
                    })
                  );
                } else if (parsed.error) {
                  assistantText += `\n⚠️ Error: ${parsed.error}`;
                }
              } catch {}
            }
          }
        }
      }
    } catch (err: any) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConvId) return c;
          const msgs = [...c.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: `⚠️ White Owl could not reach the AI service. (${err.message}). Please verify your GEMINI_API_KEY in Secrets.`,
            };
          } else {
            msgs.push({
              role: "assistant",
              content: `⚠️ Error: ${err.message}`,
              timestamp: new Date().toISOString(),
            });
          }
          return { ...c, messages: msgs };
        })
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Helper for specialized text generation tasks
  const handleGenericQuery = async (prompt: string, context?: string, style: ResponseStyle = "Balanced"): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: selectedModel,
        style,
        temperature,
        systemContext: context,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    if (reader) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) fullText += data.text;
            } catch {}
          }
        }
      }
    }
    return fullText || "No response received.";
  };

  // Vision Analysis helper
  const handleAnalyzeImage = async (imageBase64: string, mimeType: string, prompt: string): Promise<string> => {
    const res = await fetch("/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        prompt,
        model: selectedModel,
        style: responseStyle,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.text;
  };

  return (
      <div className={`flex h-screen w-screen overflow-hidden ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Persistent Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          currentMode={currentMode}
          onSelectMode={setCurrentMode}
          conversations={conversations}
          activeConvId={activeConvId}
          onSelectConversation={setActiveConvId}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          selectedModel={selectedModel}
          onChangeModel={setSelectedModel}
          responseStyle={responseStyle}
          onChangeResponseStyle={setResponseStyle}
          temperature={temperature}
          onChangeTemperature={setTemperature}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          onClose={() => setIsSidebarOpen(false)}
          apiStatus={apiStatus}
        />
      )}

      {/* Main Workspace Stage */}
      <main className="relative flex-1 flex flex-col h-screen overflow-hidden">
        {!isSidebarOpen && (
          <button
            id="open-sidebar-btn"
            onClick={() => setIsSidebarOpen(true)}
            className={`absolute left-4 top-4 z-10 p-2 rounded-lg border shadow-sm transition-colors cursor-pointer ${
              isDark
                ? "bg-black border-zinc-800 text-zinc-300 hover:border-red-500 hover:text-red-400"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-red-500 hover:text-red-500"
            }`}
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
        {currentMode === "chat" && (
          <ChatView
            conversationTitle={activeConversation.title}
            messages={activeConversation.messages}
            onSendMessage={handleSendMessage}
            onClearMessages={handleClearMessages}
            isStreaming={isStreaming}
            isDark={isDark}
            selectedModel={selectedModel}
            responseStyle={responseStyle}
          />
        )}

        {currentMode === "pdf" && (
          <PDFAssistantView
            isDark={isDark}
            onSendDocumentQuery={(q, docName, ctx) =>
              handleGenericQuery(
                `Document Name: "${docName}"\n\nUser Question: ${q}\n\nPlease answer the user's question accurately based on the provided document context. Include specific citations, sections, or excerpts where relevant.`,
                `=== ATTACHED DOCUMENT: ${docName} ===\n${ctx}`,
                responseStyle
              )
            }
          />
        )}

        {currentMode === "data" && (
          <DataAnalystView
            isDark={isDark}
            onSendAnalysisQuery={(q, summary) =>
              handleGenericQuery(
                `Dataset Analysis Query: ${q}`,
                summary,
                "Detailed"
              )
            }
          />
        )}

        {currentMode === "text" && (
          <TextAssistantView
            isDark={isDark}
            onTransformText={(task, text, targetLang) =>
              handleGenericQuery(
                `Task: ${task} ${targetLang ? `(Target Language: ${targetLang})` : ""}\n\nInput Text:\n${text}`,
                undefined,
                responseStyle
              )
            }
          />
        )}

        {currentMode === "code" && (
          <CodeAssistantView
            isDark={isDark}
            onExecuteCodeTask={(mode, code, lang, targetLang) =>
              handleGenericQuery(
                `Mode: ${mode}\nSource Language: ${lang}${targetLang ? `\nTarget Language: ${targetLang}` : ""}\n\nCode:\n${code}`,
                undefined,
                "Technical"
              )
            }
          />
        )}

        {currentMode === "image" && (
          <ImageAssistantView
            isDark={isDark}
            onAnalyzeImage={handleAnalyzeImage}
          />
        )}

        {currentMode === "about" && <AboutView isDark={isDark} />}
      </main>
    </div>
  );
}
