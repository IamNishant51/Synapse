"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAIConfig, deleteAIConfig, verifyJudgeToken, type AIConfig } from "@/lib/api";
import { useToast } from "./ToastContext";

interface AIConfigContextType {
  config: AIConfig | null;
  loading: boolean;
  isModalOpen: boolean;
  isJudgeAuthorized: boolean;
  openModal: () => void;
  closeModal: () => void;
  refreshConfig: () => Promise<void>;
  disconnectAI: () => Promise<void>;
  saveJudgeToken: (token: string) => Promise<boolean>;
  disconnectJudge: () => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export function AIConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJudgeAuthorized, setIsJudgeAuthorized] = useState(false);
  const { addToast } = useToast();

  const refreshConfig = useCallback(async () => {
    try {
      const data = await getAIConfig();
      setConfig(data);
    } catch (err) {
      console.error("Failed to load AI config", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      refreshConfig();
      if (typeof window !== "undefined") {
        const hasCookie = document.cookie.split(";").some((item) => item.trim().startsWith("synapse_judge_token="));
        setIsJudgeAuthorized(hasCookie);
      }
    });
  }, [refreshConfig]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const saveJudgeToken = useCallback(async (token: string) => {
    try {
      setLoading(true);
      await verifyJudgeToken(token.trim());
      
      // Set cookie client-side
      document.cookie = `synapse_judge_token=${encodeURIComponent(token.trim())}; path=/; max-age=31536000; SameSite=Lax`;
      setIsJudgeAuthorized(true);
      addToast("Judge access token verified successfully", "success");
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      addToast(error.message || "Invalid judge access token", "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const disconnectJudge = useCallback(() => {
    document.cookie = "synapse_judge_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    setIsJudgeAuthorized(false);
    addToast("Judge access token disconnected", "success");
  }, [addToast]);

  const disconnectAI = useCallback(async () => {
    try {
      setLoading(true);
      await deleteAIConfig();
      await refreshConfig();
      addToast("AI configuration disconnected successfully", "success");
    } catch (err) {
      addToast("Failed to disconnect AI configuration", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [refreshConfig, addToast]);

  return (
    <AIConfigContext.Provider
      value={{
        config,
        loading,
        isModalOpen,
        isJudgeAuthorized,
        openModal,
        closeModal,
        refreshConfig,
        disconnectAI,
        saveJudgeToken,
        disconnectJudge,
      }}
    >
      {children}
    </AIConfigContext.Provider>
  );
}

export function useAIConfig() {
  const context = useContext(AIConfigContext);
  if (context === undefined) {
    throw new Error("useAIConfig must be used within an AIConfigProvider");
  }
  return context;
}
