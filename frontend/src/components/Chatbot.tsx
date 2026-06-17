import React, { useEffect, useRef, useState } from "react";
import "./Chatbot.css";

const secretURL = import.meta.env.VITE_CHATBOT;
const CHAT_URL = `${secretURL}`;

type Message = { id: string; role: "user" | "assistant"; text: string };

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // sync state -> dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // sync dialog -> state (ESC / backdrop close)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => setOpen(false);
    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

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
      const reply = data?.reply ?? data?.message ?? "";

      setMessages((m) => [
        ...m,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role: "assistant",
          text: reply,
        },
      ]);
    } catch (err) {
      console.error("Chat send error", err);

      setMessages((m) => [
        ...m,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role: "assistant",
          text: "Sorry — something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="lm-chatbot-toggle"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        type="button"
      >
        {open ? "✕" : "💬"}
      </button>

      <dialog ref={dialogRef} className="lm-chatbot-panel">
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
      </dialog>
    </>
  );
}
