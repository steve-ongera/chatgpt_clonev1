from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import (
    ChatRequestSerializer,
    ChatResponseSerializer,
    ConversationListSerializer,
    ConversationDetailSerializer,
)
from .ai_service import get_ai_reply, AIServiceError


class ChatView(APIView):
    """
    POST /api/chat/
    Accepts a user message and an optional conversation_id.
    Routes to local model or OpenAI based on AI_PROVIDER in .env.
    """

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message    = serializer.validated_data["message"]
        conversation_id = serializer.validated_data.get("conversation_id")

        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                return Response(
                    {"error": "Conversation not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            conversation = Conversation.objects.create()

        # Persist the user message
        Message.objects.create(
            conversation=conversation,
            role="user",
            content=user_message,
        )

        # Build message history (last 20 exchanges for context window)
        history = (
            conversation.messages
            .order_by("created_at")
            .values("role", "content")
        )
        openai_messages = [{"role": m["role"], "content": m["content"]} for m in history]

        # Prepend system prompt
        openai_messages.insert(0, {
            "role": "system",
            "content": (
                "You are a helpful, friendly, and concise AI assistant. "
                "Answer clearly and accurately. If you don't know something, say so."
            ),
        })

        # Call whichever provider is configured
        try:
            ai_reply = get_ai_reply(openai_messages)
        except AIServiceError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Persist AI reply
        assistant_message = Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_reply,
        )

        # Auto-title after first exchange
        if conversation.messages.count() == 2:
            conversation.generate_title()

        return Response(
            ChatResponseSerializer({
                "reply":           ai_reply,
                "conversation_id": conversation.id,
                "message_id":      assistant_message.id,
            }).data,
            status=status.HTTP_200_OK,
        )


class ConversationListView(APIView):
    """
    GET    /api/conversations/  — list all conversations
    DELETE /api/conversations/  — wipe all conversations
    """

    def get(self, request):
        conversations = Conversation.objects.all()
        serializer    = ConversationListSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        Conversation.objects.all().delete()
        return Response({"message": "All conversations deleted."}, status=status.HTTP_200_OK)


class ConversationDetailView(APIView):
    """
    GET    /api/conversations/<uuid>/  — full conversation + messages
    DELETE /api/conversations/<uuid>/  — delete one conversation
    """

    def _get_conversation(self, pk):
        try:
            return Conversation.objects.get(id=pk)
        except Conversation.DoesNotExist:
            return None

    def get(self, request, pk):
        conversation = self._get_conversation(pk)
        if not conversation:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ConversationDetailSerializer(conversation).data)

    def delete(self, request, pk):
        conversation = self._get_conversation(pk)
        if not conversation:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        conversation.delete()
        return Response({"message": "Conversation deleted."}, status=status.HTTP_200_OK)