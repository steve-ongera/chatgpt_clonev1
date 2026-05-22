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
        <h1 className="history-title">Chat History</h1>
        <p className="history-sub">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="history-controls">
        <input
          className="history-search"
          type="text"
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {conversations.length > 0 && (
          <button
            className="btn-delete-all"
            onClick={handleDeleteAll}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "🗑 Delete All"}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="history-empty">
          {search ? `No results for "${search}"` : "No conversations yet. Start chatting!"}
        </div>
      ) : (
        <div className="history-list">
          {filtered.map((c) => (
            <div key={c.id} className="history-card" onClick={() => onSelect(c.id)}>
              <div className="history-card-body">
                <h3 className="history-card-title">{c.title || "Untitled Chat"}</h3>
                <p className="history-card-meta">
                  {c.message_count} message{c.message_count !== 1 ? "s" : ""} ·{" "}
                  {formatDate(c.updated_at)}
                </p>
              </div>
              <button
                className="history-card-delete"
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
        </div>
      )}
    </div>
  );
}