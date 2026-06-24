"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { answerQuery } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export interface ConversationMeta {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: (val: string) => void;
  isProcessing: boolean;
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
  convIndex: ConversationMeta[];
  handleSubmit: (query?: string) => Promise<void>;
  newConversation: () => void;
  switchToConversation: (convId: string) => void;
  deleteConversation: (convId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CUR_KEY = "ask-messages";
const CONV_INDEX_KEY = "ask-conv-index";

function saveMessagesRaw(msgs: ChatMessage[]) {
  try { localStorage.setItem(CUR_KEY, JSON.stringify(msgs)); } catch {}
}

function loadMessagesRaw(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUR_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function getConvIndex(): ConversationMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONV_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistConvIndex(list: ConversationMeta[]) {
  try { localStorage.setItem(CONV_INDEX_KEY, JSON.stringify(list)); } catch {}
}

function convMsgKey(id: string) {
  return `ask-conv-${id}`;
}

function saveConvMessages(id: string, msgs: ChatMessage[]) {
  try { localStorage.setItem(convMsgKey(id), JSON.stringify(msgs)); } catch {}
}

function loadConvMessages(id: string): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(convMsgKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function deleteConvMessages(id: string) {
  try { localStorage.removeItem(convMsgKey(id)); } catch {}
}

function generateTitle(msgs: ChatMessage[]): string {
  if (msgs.length === 0) return "Empty conversation";
  const first = msgs[0].query;
  return first.length > 45 ? first.slice(0, 42) + "..." : first;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [convIndex, setConvIndex] = useState<ConversationMeta[]>([]);
  
  const epochRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = loadMessagesRaw();
    if (saved.length > 0) setMessages(saved);
    setConvIndex(getConvIndex());
  }, []);

  useEffect(() => {
    saveMessagesRaw(messages);
  }, [messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const saveCurrentToHistory = useCallback((currentMsgs: ChatMessage[]) => {
    if (currentMsgs.length === 0) return null;
    const convId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    saveConvMessages(convId, currentMsgs);
    const convs = getConvIndex();
    const updatedConvs = [
      {
        id: convId,
        title: generateTitle(currentMsgs),
        updatedAt: new Date().toISOString(),
        messageCount: currentMsgs.length,
      },
      ...convs
    ];
    persistConvIndex(updatedConvs);
    setConvIndex(updatedConvs);
    return convId;
  }, []);

  const newConversation = useCallback(() => {
    saveCurrentToHistory(messages);
    setMessages([]);
    try { localStorage.removeItem(CUR_KEY); } catch {}
  }, [messages, saveCurrentToHistory]);

  const switchToConversation = useCallback((convId: string) => {
    saveCurrentToHistory(messages);
    const stored = loadConvMessages(convId);
    if (stored) {
      setMessages(stored);
    }
    const convs = getConvIndex();
    const updatedConvs = convs.filter(c => c.id !== convId);
    persistConvIndex(updatedConvs);
    setConvIndex(updatedConvs);
    setShowHistory(false);
  }, [messages, saveCurrentToHistory]);

  const deleteConversation = useCallback((convId: string) => {
    deleteConvMessages(convId);
    const convs = getConvIndex();
    const updatedConvs = convs.filter(c => c.id !== convId);
    persistConvIndex(updatedConvs);
    setConvIndex(updatedConvs);
  }, []);

  const handleSubmit = async (query?: string) => {
    const q = (query || input).trim();
    if (!q || isProcessing) return;

    const epoch = ++epochRef.current;
    setIsProcessing(true);
    setInput("");

    // Abort previous active request if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await answerQuery(q, controller.signal);
      if (epoch !== epochRef.current) return;
      setMessages((prev) => {
        const next = [...prev, response];
        saveMessagesRaw(next);
        return next;
      });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      if (epoch !== epochRef.current) return;
      
      const msg = e instanceof Error ? e.message : "Failed to get answer";
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        query: q,
        intent: null,
        answer: `Error: ${msg}. Make sure the backend is running.`,
        sources: [],
        diffCard: null,
        timeline: null,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, errorMsg];
        saveMessagesRaw(next);
        return next;
      });
    } finally {
      if (epoch === epochRef.current) {
        setIsProcessing(false);
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        input,
        setInput,
        isProcessing,
        showHistory,
        setShowHistory,
        convIndex,
        handleSubmit,
        newConversation,
        switchToConversation,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
