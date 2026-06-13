import React, { useEffect, useRef, useState } from "react";
import "./Chatbot.css";

// Backend chat API endpoint (returns JSON: { reply: string })
const secretURL = import.meta.env.VITE_CHATBOT;
const CHAT_URL = `${secretURL}`;

type Message = { id: string; role: "user" | "assistant"; text: string };

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: "user",
      text,
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error(`Chat API error ${res.status}`);

      const data = await res.json();
      const reply = (data && (data.reply ?? data.message ?? "")) || "";

      const assistantMsg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "assistant",
        text: reply,
      };

      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error("Chat send error", err);
      const errorMsg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "assistant",
        text: "Sorry — something went wrong. Please try again.",
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={open ? "lm-chatbot lm-chatbot-open" : "lm-chatbot"}>
      <button
        className="lm-chatbot-toggle"
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((s) => !s)}
        type="button"
      >
        {open ? "✕" : "💬"}
      </button>

      <div className="lm-chatbot-panel" role="dialog" aria-hidden={!open}>
        <div className="lm-chatbot-header">
          <div className="lm-chatbot-title">Chat</div>
          <button
            className="lm-chatbot-close"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="lm-chatbot-body">
          <div className="lm-chatbot-messages" role="log" aria-live="polite">
            {messages.length === 0 && (
              <div className="lm-chatbot-empty">
                Ask me about the library...
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`lm-chatbot-message lm-chatbot-message-${m.role}`}
              >
                <div className="lm-chatbot-message-text">{m.text}</div>
              </div>
            ))}

            {loading && (
              <div className="lm-chatbot-message lm-chatbot-message-assistant lm-chatbot-typing">
                typing…
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div className="lm-chatbot-composer">
            <input
              className="lm-chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              aria-label="Type a message"
              disabled={loading}
            />

            <button
              className="lm-chatbot-send"
              onClick={sendMessage}
              disabled={loading || input.trim() === ""}
              type="button"
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
