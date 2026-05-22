import axios from "axios";

// Axios instance — base URL uses Vite proxy (/api → Django :8000)
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30s — AI responses can be slow
});

/**
 * Send a chat message to the backend.
 * @param {string} message - The user's message text
 * @param {string|null} conversationId - UUID of existing conversation, or null to start new
 * @returns {{ reply, conversation_id, message_id }}
 */
export async function sendMessage(message, conversationId = null) {
  const payload = { message };
  if (conversationId) payload.conversation_id = conversationId;

  const { data } = await api.post("/chat/", payload);
  return data;
}

/**
 * Fetch the list of all conversations (lightweight, no messages).
 * @returns {Array<{ id, title, message_count, created_at, updated_at }>}
 */
export async function fetchConversations() {
  const { data } = await api.get("/conversations/");
  return data;
}

/**
 * Fetch a single conversation with its full message history.
 * @param {string} conversationId - UUID
 * @returns {{ id, title, messages: Array<{ id, role, content, created_at }> }}
 */
export async function fetchConversation(conversationId) {
  const { data } = await api.get(`/conversations/${conversationId}/`);
  return data;
}

/**
 * Delete a single conversation by UUID.
 * @param {string} conversationId
 */
export async function deleteConversation(conversationId) {
  const { data } = await api.delete(`/conversations/${conversationId}/`);
  return data;
}

/**
 * Delete ALL conversations.
 */
export async function deleteAllConversations() {
  const { data } = await api.delete("/conversations/");
  return data;
}