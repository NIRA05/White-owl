export type WorkspaceMode = 
  | "chat" 
  | "pdf" 
  | "data" 
  | "text" 
  | "code" 
  | "image" 
  | "about";

export type ResponseStyle = 
  | "Balanced" 
  | "Concise" 
  | "Detailed" 
  | "Professional" 
  | "Friendly" 
  | "Technical";

export interface Message {
  id?: string | number;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}
