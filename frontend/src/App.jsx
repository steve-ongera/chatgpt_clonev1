// App.jsx - With working drawer sidebar for mobile
import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import ChatPage from "./pages/ChatPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import { fetchConversations, deleteConversation } from "./utils/api.js";

function Sidebar({ conversations, activeId, onNew, onSelect, onDelete, onHistory, isOpen, onClose, isMobile }) {
  return (
    <>
      {/* Sidebar drawer */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <i className="bi bi-chat-dots-fill"></i>
          </span>
          <span className="sidebar-brand">NeuralChat</span>
        </div>

        <button className="btn-new-chat" onClick={onNew}>
          <i className="bi bi-plus-lg"></i>
          <span>New Chat</span>
        </button>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">
            <i className="bi bi-clock-history"></i> Recent
          </p>
          {conversations.length === 0 && (
            <p className="sidebar-empty">
              <i className="bi bi-inbox"></i> No conversations yet
            </p>
          )}
          {conversations.slice(0, 8).map((c) => (
            <div
              key={c.id}
              className={`sidebar-item ${activeId === c.id ? "active" : ""}`}
              onClick={() => onSelect(c.id)}
            >
              <i className="bi bi-chat-text"></i>
              <span className="sidebar-item-title">{c.title || "Untitled"}</span>
              <button
                className="sidebar-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                title="Delete"
              >
                <i className="bi bi-trash3"></i>
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-history" onClick={onHistory}>
            <i className="bi bi-clock-history"></i>
            <span>All History</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div className="sidebar-mobile-overlay active" onClick={onClose} />
      )}
    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false); // Close sidebar on desktop resize
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location?.pathname, isMobile]);

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
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleSelectConversation = (id) => {
    setActiveId(id);
    navigate(`/chat/${id}`);
    if (isMobile) setIsSidebarOpen(false);
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
    if (isMobile) setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNew={handleNewChat}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onHistory={() => {
          navigate("/history");
          if (isMobile) setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
      />
      <main className={`main-content ${isMobile && isSidebarOpen ? 'blur-background' : ''}`}>
        {/* Mobile Menu Toggle Button */}
        {isMobile && (
          <button 
            className="mobile-menu-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <i className={`bi ${isSidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
        )}
        
        <Routes>
          <Route
            path="/"
            element={
              <ChatPage
                conversationId={null}
                onConversationCreated={handleConversationCreated}
                isMobileMenuOpen={isSidebarOpen}
                onMobileMenuToggle={toggleSidebar}
              />
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ChatPageWithId 
                onConversationCreated={handleConversationCreated}
                isMobileMenuOpen={isSidebarOpen}
                onMobileMenuToggle={toggleSidebar}
              />
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
function ChatPageWithId({ onConversationCreated, isMobileMenuOpen, onMobileMenuToggle }) {
  const { id } = useParams();
  return (
    <ChatPage 
      conversationId={id} 
      onConversationCreated={onConversationCreated}
      isMobileMenuOpen={isMobileMenuOpen}
      onMobileMenuToggle={onMobileMenuToggle}
    />
  );
}