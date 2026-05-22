import uuid
from django.db import models


class Conversation(models.Model):
    """
    Represents a single chat session.
    Each conversation holds an ordered list of messages.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, blank=True, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.id})"

    def generate_title(self):
        """Auto-generate title from first user message."""
        first_msg = self.messages.filter(role="user").first()
        if first_msg:
            self.title = first_msg.content[:60]
            self.save(update_fields=["title"])


class Message(models.Model):
    """
    A single message within a conversation.
    Role is either 'user' or 'assistant'.
    """
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
        ("system", "System"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}"