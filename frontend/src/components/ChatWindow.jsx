// ChatWindow.jsx
import { useEffect, useRef } from "react";

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-group ${isUser ? "message-user" : "message-assistant"}`}>
      <div className="message-avatar">
        {isUser ? (
          <i className="bi bi-person-fill" style={{ fontSize: "18px" }}></i>
        ) : (
          <i className="bi bi-cpu-fill" style={{ fontSize: "16px", color: "var(--brand-green)" }}></i>
        )}
      </div>
      <div className="message-content">
        <div className={`message-bubble ${isUser ? "bubble--user" : "bubble--ai"}`}>
          {message.content.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < message.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
        <div className="message-meta">
          {isUser ? (
            <i className="bi bi-check2-circle" style={{ fontSize: "12px", marginRight: "4px" }}></i>
          ) : (
            <i className="bi bi-dot" style={{ fontSize: "20px", lineHeight: "1" }}></i>
          )}
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-group message-assistant">
      <div className="message-avatar">
        <i className="bi bi-cpu-fill" style={{ fontSize: "16px", color: "var(--brand-green)" }}></i>
      </div>
      <div className="message-content">
        <div className="typing-indicator">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="fade-in" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center" style={{ maxWidth: "400px" }}>
          <div style={{ fontSize: "64px", marginBottom: "var(--spacing-lg)" }}>
            <i className="bi bi-chat-dots-fill" style={{ color: "var(--brand-green)" }}></i>
          </div>
          <h2 style={{ marginBottom: "var(--spacing-sm)" }}>How can I help you today?</h2>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            <i className="bi bi-lightbulb" style={{ marginRight: "var(--spacing-xs)" }}></i>
            Start a conversation below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={chatBodyRef} className="chat-container" style={{ overflowY: "auto" }}>
      <div className="chat-window" style={{ paddingBottom: "var(--spacing-xl)" }}>
        {messages.map((msg, idx) => (
          <MessageBubble key={msg.id || msg.tempId || idx} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}