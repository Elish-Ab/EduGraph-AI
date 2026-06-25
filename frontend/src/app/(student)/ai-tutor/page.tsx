"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import type { ChatMessage } from "@/types";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Why did I fail the circuit question?",
  "Explain Ohm's Law simply",
  "What should I study today?",
  "Show me a practice problem on parallel circuits",
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "0",
  role: "assistant",
  content: "Hi! I'm your EduGraph AI tutor. I know your learning gaps, study plan, and curriculum. Ask me anything about your subjects — I'll explain based on exactly where you are right now.",
  timestamp: new Date().toISOString(),
};

export default function AITutorPage() {
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || streaming) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      const token = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("edugraph-auth") ?? "{}").state?.token ?? ""
        : "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/ai/tutor/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: content }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: full } : m))
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "I'm having trouble connecting right now. Make sure the AI server is running." }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">AI Academic Tutor</h1>
            <p className="text-xs text-muted-foreground">Curriculum-aware · Personalized · Offline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
            {profile?.career_interest?.replace(/_/g, " ") ?? "Not set"}
          </Badge>
          <Badge className="bg-muted text-muted-foreground border-border text-xs">
            Grade {profile?.grade ?? "—"}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === "assistant" ? "bg-primary/10" : "bg-muted"
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "bg-card border border-border text-foreground rounded-tl-sm"
                  : "bg-primary/15 text-primary rounded-tr-sm"
              )}
            >
              {msg.content || (
                <span className="flex gap-1 text-muted-foreground">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-8 pb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-8 py-4 bg-card">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask anything about your curriculum…"
            className="bg-input border-border flex-1"
            disabled={streaming}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
