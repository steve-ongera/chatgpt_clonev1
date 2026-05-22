from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "created_at"]
        read_only_fields = ["id", "created_at"]


class ConversationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing conversations (no messages)."""
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "title", "message_count", "created_at", "updated_at"]

    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Full serializer — includes all messages in the conversation."""
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "title", "messages", "created_at", "updated_at"]


class ChatRequestSerializer(serializers.Serializer):
    """Validates incoming chat requests from the frontend."""
    message = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=4000,
        error_messages={
            "required": "A message is required.",
            "blank": "Message cannot be empty.",
            "max_length": "Message cannot exceed 4000 characters.",
        },
    )
    conversation_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None,
        help_text="Pass an existing conversation UUID to continue it, or omit to start a new one.",
    )


class ChatResponseSerializer(serializers.Serializer):
    """Shape of the response sent back to the frontend."""
    reply = serializers.CharField()
    conversation_id = serializers.UUIDField()
    message_id = serializers.UUIDField()