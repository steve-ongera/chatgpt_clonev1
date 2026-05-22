// MessageInput.jsx
import { useState, useRef, useEffect } from "react";

export default function MessageInput({ onSend, isLoading, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [text]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setText("");
    
    // Reset textarea height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-bar">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          className="input-field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT..."
          rows={1}
          disabled={isLoading || disabled}
        />
        <button
          className="send-button"
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading || disabled}
          title="Send message"
        >
          {isLoading ? (
            <i className="bi bi-arrow-repeat spinner-icon"></i>
          ) : (
            <i className="bi bi-send-fill"></i>
          )}
        </button>
      </div>
      <div className="input-hint">
        <i className="bi bi-arrow-return-left" style={{ fontSize: "12px", marginRight: "4px" }}></i>
        Enter to send · 
        <i className="bi bi-shift-fill" style={{ fontSize: "12px", marginLeft: "4px", marginRight: "4px" }}></i>
        + Enter for new line
      </div>
    </div>
  );
}