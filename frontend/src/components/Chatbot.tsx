import React, { useEffect, useRef, useState } from "react";
import "./Chatbot.css";
import { io, Socket } from "socket.io-client";
const secretURL = import.meta.env.VITE_CHATBOT;
const CHAT_URL = `${secretURL}`;

type Message = { id: string; role: "user" | "assistant"; text: string };

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    const socket = io(CHAT_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    const handleChatResponse = (response: any) => {
      // clear the pending timeout now that a real response arrived
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const reply = response?.error ? response.error : (response?.reply ?? "");

      setMessages((m) => [
        ...m,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role: "assistant",
          text: typeof reply === "string" ? reply : JSON.stringify(reply),
        },
      ]);

      setLoading(false);
    };

    socket.on("chat-response", handleChatResponse);
    socket.on("connect_error", (err) =>
      console.error("connect_error", err.message),
    );
    socket.on("disconnect", (reason) => console.warn("disconnected", reason));

    return () => {
      socket.off("chat-response", handleChatResponse);
      socket.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const sendMessage = () => {
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

    socketRef.current?.emit("chat", { message: text });

    // clear any stale pending timeout before starting a new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setMessages((m) => [
        ...m,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role: "assistant",
          text: "Request timed out.",
        },
      ]);
      timeoutRef.current = null;
    }, 15000);
  };

  return (
    <div className="lm-chatbot">
      {/* toggle button */}
      <button
        className="lm-chatbot-toggle"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        type="button"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* panel */}
      <div className={`lm-chatbot-panel ${open ? "open" : ""}`}>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
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
