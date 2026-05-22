import openai
from django.conf import settings
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

# Configure the OpenAI client once at module level
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)


class ChatView(APIView):
    """
    POST /api/chat/
    Accepts a user message and an optional conversation_id.
    - If conversation_id is provided, continues that conversation.
    - If not, starts a new conversation.
    Returns the AI reply and the conversation_id.
    """

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data["message"]
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

        # Save the user's message
        Message.objects.create(
            conversation=conversation,
            role="user",
            content=user_message,
        )

        # Build message history for OpenAI (last 20 messages for context window)
        history = conversation.messages.order_by("created_at").values("role", "content")
        openai_messages = [{"role": m["role"], "content": m["content"]} for m in history]

        # Prepend a system prompt
        openai_messages.insert(
            0,
            {
                "role": "system",
                "content": (
                    "You are a helpful, friendly, and concise AI assistant. "
                    "Answer clearly and accurately. If you don't know something, say so."
                ),
            },
        )

        # Call OpenAI API
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=openai_messages,
                max_tokens=1024,
                temperature=0.7,
            )
            ai_reply = response.choices[0].message.content.strip()
        except openai.AuthenticationError:
            return Response(
                {"error": "Invalid OpenAI API key. Check your .env file."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except openai.RateLimitError:
            return Response(
                {"error": "OpenAI rate limit exceeded. Try again shortly."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except openai.OpenAIError as e:
            return Response(
                {"error": f"OpenAI error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Save the assistant's reply
        assistant_message = Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_reply,
        )

        # Auto-title the conversation after first exchange
        if conversation.messages.count() == 2:
            conversation.generate_title()

        response_data = ChatResponseSerializer({
            "reply": ai_reply,
            "conversation_id": conversation.id,
            "message_id": assistant_message.id,
        }).data

        return Response(response_data, status=status.HTTP_200_OK)


class ConversationListView(APIView):
    """
    GET /api/conversations/
    Returns all conversations ordered by most recently updated.
    """

    def get(self, request):
        conversations = Conversation.objects.all()
        serializer = ConversationListSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        """DELETE /api/conversations/ — wipes all conversations."""
        Conversation.objects.all().delete()
        return Response({"message": "All conversations deleted."}, status=status.HTTP_200_OK)


class ConversationDetailView(APIView):
    """
    GET  /api/conversations/<uuid>/  — fetch full conversation with messages
    DELETE /api/conversations/<uuid>/ — delete a conversation
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
        serializer = ConversationDetailSerializer(conversation)
        return Response(serializer.data)

    def delete(self, request, pk):
        conversation = self._get_conversation(pk)
        if not conversation:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        conversation.delete()
        return Response({"message": "Conversation deleted."}, status=status.HTTP_200_OK)