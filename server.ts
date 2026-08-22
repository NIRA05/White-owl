import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { PDFParse } from "pdf-parse";

dotenv.config();

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!key || key.startsWith("your_") || key.startsWith("MY_")) return null;
  return new GoogleGenAI({
    apiKey: key,
  });
}

function getGrokApiKey() {
  const key = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!key || key.startsWith("your_") || key.startsWith("MY_")) return null;
  if (key.startsWith("gsk_") || key.startsWith("AIza") || key.startsWith("AQ.")) return null;
  return key;
}

const STYLE_PROMPTS: Record<string, string> = {
  Balanced: "You are White Owl, an intelligent AI workspace assistant. Provide clear, balanced, and well-structured answers using clean Markdown formatting, bullet points, and code blocks where helpful.",
  Concise: "You are White Owl. Respond with maximum brevity, sharp precision, and immediate clarity. Avoid fluff; deliver direct bullet points or minimal code snippets.",
  Detailed: "You are White Owl. Provide exhaustive, comprehensive, deep-dive answers with background context, step-by-step breakdowns, edge cases, examples, and deep analysis.",
  Professional: "You are White Owl, an executive-level AI intelligence advisor. Communicate with polished corporate decorum, structured strategic outlines, and formal business precision.",
  Casual: "You are White Owl, a friendly, approachable, and witty AI companion. Use warm, natural language, approachable analogies, and engaging explanations.",
};

// Generic single-turn completion helper for all assistants
async function generateAIResponse({
  prompt,
  systemContext,
  style = "Balanced",
  model,
  temperature = 0.7,
}: {
  prompt: string;
  systemContext?: string;
  style?: string;
  model?: string;
  temperature?: number;
}): Promise<string> {
  const grokKey = getGrokApiKey();
  const geminiClient = getGeminiClient();

  const systemInstruction = STYLE_PROMPTS[style] || STYLE_PROMPTS.Balanced;
  const fullSystem = systemContext ? `${systemInstruction}\n\n${systemContext}` : systemInstruction;

  const isGrok = (model && model.toLowerCase().startsWith("grok")) || (grokKey && !geminiClient);

  if (isGrok) {
    if (!grokKey) throw new Error("Grok API key is required. Please set GROK_API_KEY in .env");
    const grokModel = model && model.startsWith("grok") ? model : "grok-2-latest";

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${grokKey}`,
      },
      body: JSON.stringify({
        model: grokModel,
        messages: [
          { role: "system", content: fullSystem },
          { role: "user", content: prompt },
        ],
        temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`xAI Grok error (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
  }

  if (!geminiClient) {
    throw new Error("No AI API key found. Please set GROK_API_KEY or GEMINI_API_KEY in your .env file.");
  }

  const geminiModel = model && model.startsWith("gemini") ? model : "gemini-2.5-flash";
  const result = await geminiClient.models.generateContent({
    model: geminiModel,
    contents: prompt,
    config: {
      systemInstruction: fullSystem,
      temperature,
    },
  });

  return result.text || "No response generated.";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Status check for all configured keys
  app.get("/api/status", (req, res) => {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const isGeminiConfigured = Boolean(geminiKey && geminiKey.length > 5 && !geminiKey.startsWith("your_") && !geminiKey.startsWith("MY_"));
    const grokKey = getGrokApiKey();
    const isGrokConfigured = Boolean(grokKey && grokKey.length > 5);

    const isAnyConfigured = isGrokConfigured || isGeminiConfigured;
    const primaryKey = grokKey || geminiKey || "";
    const activeProvider = isGrokConfigured ? "xAI Grok" : isGeminiConfigured ? "Google Gemini" : "None";

    res.json({
      status: "ok",
      apiConfigured: isAnyConfigured,
      grokConfigured: isGrokConfigured,
      geminiConfigured: isGeminiConfigured,
      activeProvider,
      keyMasked: isAnyConfigured ? `${primaryKey.slice(0, 4)}••••••••${primaryKey.slice(-4)}` : "Not Configured",
    });
  });

  // Chat Streaming Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, model = "gemini-2.5-flash", style = "Balanced", temperature = 0.7, systemContext } = req.body;
      const grokKey = getGrokApiKey();
      const geminiClient = getGeminiClient();

      const systemInstruction = STYLE_PROMPTS[style] || STYLE_PROMPTS.Balanced;
      const fullSystemPrompt = systemContext ? `${systemInstruction}\n\n${systemContext}` : systemInstruction;

      const isGrokModel = model.toLowerCase().startsWith("grok");

      if (isGrokModel || (grokKey && !geminiClient)) {
        if (!grokKey) {
          return res.status(400).json({ error: "Grok API key is not configured. Please set GROK_API_KEY in .env" });
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const grokMessages = [
          { role: "system", content: fullSystemPrompt },
          ...(messages || []).map((m: { role: string; content: string }) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        ];

        const grokModelName = isGrokModel ? model : "grok-2-latest";

        const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${grokKey}`,
          },
          body: JSON.stringify({
            model: grokModelName,
            messages: grokMessages,
            temperature: typeof temperature === "number" ? temperature : 0.7,
            stream: true,
          }),
        });

        if (!grokResponse.ok) {
          const errText = await grokResponse.text();
          throw new Error(`xAI Grok API error (${grokResponse.status}): ${errText}`);
        }

        const reader = grokResponse.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const jsonStr = trimmed.replace(/^data:\s*/, "");
              if (jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  res.write(`data: ${JSON.stringify({ text: deltaContent })}\n\n`);
                }
              } catch (e) {}
            }
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
      }

      if (!geminiClient) {
        return res.status(400).json({ error: "No AI API key found. Please configure GROK_API_KEY or GEMINI_API_KEY in .env." });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const contents = (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const stream = await geminiClient.models.generateContentStream({
        model: model || "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: fullSystemPrompt,
          temperature: typeof temperature === "number" ? temperature : 0.7,
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error("Chat API Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Failed to process chat response." });
      } else {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    }
  });

  // Vision / Multimodal Image Assistant Endpoint
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", prompt, model, style = "Balanced" } = req.body;
      const grokKey = getGrokApiKey();
      const geminiClient = getGeminiClient();
      const systemInstruction = STYLE_PROMPTS[style] || STYLE_PROMPTS.Balanced;

      const isGrok = (model && model.toLowerCase().startsWith("grok")) || (grokKey && !geminiClient);

      if (isGrok) {
        if (!grokKey) return res.status(400).json({ error: "Grok API key is required." });
        const fullImageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:${mimeType};base64,${imageBase64}`;

        const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${grokKey}`,
          },
          body: JSON.stringify({
            model: "grok-2-vision-1212",
            messages: [
              { role: "system", content: systemInstruction },
              {
                role: "user",
                content: [
                  { type: "text", text: prompt || "Analyze this image in detail and describe everything visible." },
                  { type: "image_url", image_url: { url: fullImageUrl } },
                ],
              },
            ],
            temperature: 0.4,
          }),
        });

        if (!grokResponse.ok) {
          const errText = await grokResponse.text();
          throw new Error(`xAI Grok Vision API error: ${errText}`);
        }

        const data = await grokResponse.json();
        return res.json({ text: data.choices?.[0]?.message?.content || "No textual analysis generated." });
      }

      if (!geminiClient) {
        return res.status(400).json({ error: "No AI API key configured for image analysis." });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      const response = await geminiClient.models.generateContent({
        model: model && model.startsWith("gemini") ? model : "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: prompt || "Analyze this image in detail." },
          ],
        },
        config: { systemInstruction },
      });

      res.json({ text: response.text || "No response generated." });
    } catch (err: any) {
      console.error("Image Analysis Error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze image." });
    }
  });

  // Code Assistant Endpoint
  app.post("/api/execute-code", async (req, res) => {
    try {
      const { code, language, action = "explain", model, style } = req.body;
      const prompt = `Action: ${action.toUpperCase()}\nLanguage: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;
      const text = await generateAIResponse({
        prompt,
        systemContext: "You are White Owl Code Intelligence. Provide structured code analysis, bug fixes, optimizations, or explanations in markdown with code blocks.",
        model,
        style,
        temperature: 0.2,
      });
      res.json({ result: text });
    } catch (err: any) {
      console.error("Code Analysis Error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze code." });
    }
  });

  // Data Analyst Endpoint
  app.post("/api/analyze-data", async (req, res) => {
    try {
      const { dataContent, fileName, userPrompt, model, style } = req.body;
      const prompt = `Dataset: ${fileName}\n\nUser Request: ${userPrompt}\n\nData Excerpt:\n${dataContent.slice(0, 15000)}`;
      const text = await generateAIResponse({
        prompt,
        systemContext: "You are White Owl Data Analyst. Analyze tabular data, find trends, anomalies, metrics, and suggest charts or actionable insights.",
        model,
        style,
        temperature: 0.3,
      });
      res.json({ text });
    } catch (err: any) {
      console.error("Data Analysis Error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze dataset." });
    }
  });

  // PDF Text Extraction Endpoint
  app.post("/api/parse-pdf", async (req, res) => {
    try {
      const { fileBase64, fileName } = req.body;
      if (!fileBase64) return res.status(400).json({ error: "No PDF file data provided." });

      const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");

      const pdfDoc = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await pdfDoc.getText();
      const text = result?.text ? result.text.trim() : "";
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      res.json({
        success: true,
        text,
        numpages: result?.pages?.length || 1,
        wordCount,
        info: {},
        fileName: fileName || "document.pdf",
      });
    } catch (err: any) {
      console.error("PDF Parsing Error:", err);
      res.status(500).json({ error: err.message || "Failed to extract text from PDF document." });
    }
  });

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`White Owl Intelligence Server running on http://localhost:${PORT}`);
  });
}

startServer();