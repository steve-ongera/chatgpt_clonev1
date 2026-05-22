// ChatPage.jsx (updated to accept sidebar toggle props)
import { useState, useEffect, useRef } from "react";
import ChatWindow from "../components/ChatWindow.jsx";
import MessageInput from "../components/MessageInput.jsx";
import { sendMessage, fetchConversation } from "../utils/api.js";

export default function ChatPage({ 
  conversationId, 
  onConversationCreated,
  isMobileMenuOpen,
  onMobileMenuToggle 
}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const chatBodyRef = useRef(null);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load existing conversation
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
        setTimeout(() => {
          if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          }
        }, 100);
      } catch (err) {
        setError("Failed to load conversation.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [conversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTo({
          top: chatBodyRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;
    
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const userMsg = { 
      tempId, 
      role: "user", 
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setIsTyping(true);
    scrollToBottom();

    try {
      const data = await sendMessage(text, activeConversationId);

      setTimeout(() => {
        setMessages((prev) =>
          prev
            .map((m) =>
              m.tempId === tempId ? { 
                ...m, 
                tempId: undefined, 
                id: `user-${Date.now()}`,
                timestamp: new Date().toISOString()
              } : m
            )
            .concat({ 
              id: data.message_id, 
              role: "assistant", 
              content: data.reply,
              timestamp: new Date().toISOString()
            })
        );
        setIsTyping(false);
        scrollToBottom();
      }, 300);

      if (!activeConversationId) {
        setActiveConversationId(data.conversation_id);
        onConversationCreated(data.conversation_id);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      const msg = err.response?.data?.error || "Something went wrong. Please try again.";
      setError(msg);
      console.error(err);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page slide-up">
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-title">
            <i className="bi bi-chat-dots-fill" style={{ color: "var(--brand-green)" }}></i>
            {activeConversationId ? (
              <span className="text-gradient">Chat</span>
            ) : (
              <span className="text-gradient">New Chat</span>
            )}
          </div>
        </div>
        
        {activeConversationId && messages.length > 0 && !isMobile && (
          <div className="chat-header-stats">
            <span className="badge badge-primary">
              <i className="bi bi-envelope-paper"></i>
              {messages.length}
            </span>
          </div>
        )}
      </header>

      <div className="chat-body" ref={chatBodyRef}>
        <ChatWindow messages={messages} isLoading={isTyping} />
      </div>

      {error && (
        <div className="error-toast slide-in-right">
          <div className="error-toast-content">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="error-toast-close">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      <MessageInput onSend={handleSend} isLoading={isLoading} disabled={false} />
    </div>
  );
}