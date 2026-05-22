// ChatPage.jsx
import { useState, useEffect } from "react";
import ChatWindow from "../components/ChatWindow.jsx";
import MessageInput from "../components/MessageInput.jsx";
import { sendMessage, fetchConversation } from "../utils/api.js";

export default function ChatPage({ conversationId, onConversationCreated }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);

  // Load existing conversation when ID changes
  useEffect(() => {
    setActiveConversationId(conversationId);
    setError(null);

    if (!conversationId) {
      setMessages([]);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchConversation(conversationId);
        setMessages(data.messages);
      } catch (err) {
        setError("Failed to load conversation.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [conversationId]);

  const handleSend = async (text) => {
    setError(null);

    // Optimistically add user message to UI immediately
    const tempId = `temp-${Date.now()}`;
    const userMsg = { tempId, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await sendMessage(text, activeConversationId);

      // Replace temp message + add AI reply
      setMessages((prev) =>
        prev
          .map((m) =>
            m.tempId === tempId ? { ...m, tempId: undefined, id: `user-${Date.now()}` } : m
          )
          .concat({ id: data.message_id, role: "assistant", content: data.reply })
      );

      // If this was a new conversation, notify parent to update sidebar
      if (!activeConversationId) {
        setActiveConversationId(data.conversation_id);
        onConversationCreated(data.conversation_id);
      }
    } catch (err) {
      // Remove optimistic user message on failure
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      const msg =
        err.response?.data?.error || "Something went wrong. Is Django running?";
      setError(msg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header className="chat-header">
        <div className="chat-header-title">
          <i className="bi bi-chat-dots" style={{ marginRight: "var(--spacing-sm)" }}></i>
          {activeConversationId ? (
            <span>Conversation</span>
          ) : (
            <span>New Chat</span>
          )}
        </div>
      </header>

      <div className="chat-body" style={{ flex: 1, overflowY: "auto" }}>
        <ChatWindow messages={messages} isLoading={isLoading} />
      </div>

      {error && (
        <div className="error-banner fade-in">
          <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: "var(--spacing-sm)" }}></i>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ 
              float: "right", 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              color: "inherit",
              padding: 0,
              marginLeft: "var(--spacing-md)"
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      <MessageInput
        onSend={handleSend}
        isLoading={isLoading}
        disabled={false}
      />
    </div>
  );
}