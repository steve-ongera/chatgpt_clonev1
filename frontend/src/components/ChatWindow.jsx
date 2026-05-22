import { useEffect, useRef } from "react";

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "message-row--user" : "message-row--ai"}`}>
      <div className="message-avatar">
        {isUser ? "You" : "AI"}
      </div>
      <div className={`message-bubble ${isUser ? "bubble--user" : "bubble--ai"}`}>
        {message.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-row message-row--ai">
      <div className="message-avatar">AI</div>
      <div className="message-bubble bubble--ai bubble--typing">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-icon">⬡</div>
        <h2 className="chat-empty-title">How can I help you today?</h2>
        <p className="chat-empty-sub">Start a conversation below</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {messages.map((msg) => (
        <MessageBubble key={msg.id || msg.tempId} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}