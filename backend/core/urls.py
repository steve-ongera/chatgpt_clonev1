from django.urls import path
from .views import ChatView, ConversationListView, ConversationDetailView

urlpatterns = [
    # Send a message / start or continue a conversation
    path("chat/", ChatView.as_view(), name="chat"),

    # List all conversations  |  Delete all conversations
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),

    # Get or delete a single conversation (with full message history)
    path("conversations/<uuid:pk>/", ConversationDetailView.as_view(), name="conversation-detail"),
]