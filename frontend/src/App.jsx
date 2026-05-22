import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import ChatPage from "./pages/ChatPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import { fetchConversations, deleteConversation } from "./utils/api.js";

function Sidebar({ conversations, activeId, onNew, onSelect, onDelete, onHistory }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">⬡</span>
        <span className="sidebar-brand">NeuralChat</span>
      </div>

      <button className="btn-new-chat" onClick={onNew}>
        <span>+</span> New Chat
      </button>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Recent</p>
        {conversations.length === 0 && (
          <p className="sidebar-empty">No conversations yet</p>
        )}
        {conversations.slice(0, 8).map((c) => (
          <div
            key={c.id}
            className={`sidebar-item ${activeId === c.id ? "active" : ""}`}
            onClick={() => onSelect(c.id)}
          >
            <span className="sidebar-item-title">{c.title || "Untitled"}</span>
            <button
              className="sidebar-item-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-history" onClick={onHistory}>
          📋 All History
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = () => {
    setActiveId(null);
    navigate("/");
  };

  const handleSelectConversation = (id) => {
    setActiveId(id);
    navigate(`/chat/${id}`);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        navigate("/");
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleConversationCreated = (newId) => {
    setActiveId(newId);
    loadConversations();
  };

  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNew={handleNewChat}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onHistory={() => navigate("/history")}
      />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <ChatPage
                conversationId={null}
                onConversationCreated={handleConversationCreated}
              />
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ChatPageWithId onConversationCreated={handleConversationCreated} />
            }
          />
          <Route
            path="/history"
            element={
              <HistoryPage
                conversations={conversations}
                onSelect={handleSelectConversation}
                onDelete={handleDeleteConversation}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

// Wrapper to extract :id param and pass to ChatPage
function ChatPageWithId({ onConversationCreated }) {
  const { id } = useParams();
  return <ChatPage conversationId={id} onConversationCreated={onConversationCreated} />;
}