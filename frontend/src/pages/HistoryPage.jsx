// HistoryPage.jsx
import { useState } from "react";
import { deleteAllConversations } from "../utils/api.js";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage({ conversations, onSelect, onDelete }) {
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete ALL conversations? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await deleteAllConversations();
      // Reload page to clear state
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to delete all:", err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <h1 className="history-title">
          <i className="bi bi-clock-history" style={{ marginRight: "var(--spacing-md)", color: "var(--brand-green)" }}></i>
          Chat History
        </h1>
        <p className="history-sub">
          <i className="bi bi-chat-dots" style={{ marginRight: "var(--spacing-xs)" }}></i>
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="history-controls">
        <div className="input-with-icon" style={{ flex: 1 }}>
          <i className="bi bi-search"></i>
          <input
            className="history-search"
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="icon-button"
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)" }}
            >
              <i className="bi bi-x-circle-fill" style={{ fontSize: "14px" }}></i>
            </button>
          )}
        </div>
        {conversations.length > 0 && (
          <button
            className="btn-danger"
            onClick={handleDeleteAll}
            disabled={isDeleting}
            style={{ padding: "var(--spacing-sm) var(--spacing-lg)" }}
          >
            {isDeleting ? (
              <>
                <i className="bi bi-arrow-repeat spinner-icon" style={{ marginRight: "var(--spacing-sm)" }}></i>
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash3-fill" style={{ marginRight: "var(--spacing-sm)" }}></i>
                Delete All
              </>
            )}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="history-empty fade-in">
          {search ? (
            <>
              <i className="bi bi-search" style={{ fontSize: "48px", display: "block", marginBottom: "var(--spacing-md)", color: "var(--text-muted)" }}></i>
              <p>No results for "{search}"</p>
              <button 
                className="btn-ghost" 
                onClick={() => setSearch("")}
                style={{ marginTop: "var(--spacing-md)" }}
              >
                <i className="bi bi-arrow-left"></i> Clear search
              </button>
            </>
          ) : (
            <>
              <i className="bi bi-inbox" style={{ fontSize: "48px", display: "block", marginBottom: "var(--spacing-md)", color: "var(--text-muted)" }}></i>
              <p>No conversations yet. Start chatting!</p>
              <button 
                className="btn-primary" 
                onClick={() => window.location.href = "/"}
                style={{ marginTop: "var(--spacing-md)" }}
              >
                <i className="bi bi-plus-lg"></i> New Chat
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filtered.map((c) => (
            <div key={c.id} className="history-item" onClick={() => onSelect(c.id)}>
              <div className="history-info">
                <h3 className="history-title">
                  <i className="bi bi-chat-text" style={{ marginRight: "var(--spacing-sm)", fontSize: "16px", color: "var(--brand-green)" }}></i>
                  {c.title || "Untitled Chat"}
                </h3>
                <p className="history-date">
                  <i className="bi bi-envelope-paper" style={{ marginRight: "var(--spacing-xs)", fontSize: "12px" }}></i>
                  {c.message_count} message{c.message_count !== 1 ? "s" : ""} · 
                  <i className="bi bi-calendar3" style={{ marginLeft: "var(--spacing-sm)", marginRight: "var(--spacing-xs)", fontSize: "12px" }}></i>
                  {formatDate(c.updated_at)}
                </p>
              </div>
              <button
                className="history-delete icon-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                title="Delete conversation"
              >
                <i className="bi bi-trash3"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}