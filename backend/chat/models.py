from django.db import models
from django.conf import settings

class ChatRoom(models.Model):
    CHAT_TYPES = (
        ('private', 'Private Chat'),
        ('group', 'Group Chat'),
    )

    name = models.CharField(max_length=100)  # Fixed: max_length instead of max_width
    chat_type = models.CharField(max_length=10, choices=CHAT_TYPES, default='private')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_rooms')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_rooms',
        null=True,  # Making it nullable temporarily
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    file = models.FileField(upload_to='chat_files/', null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    deleted_for_everyone = models.BooleanField(default=False)  # Added this field

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.sender.username}: {self.content[:50]}'

# Add this new model for message deletion
class DeletedMessage(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='deleted_by')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    deleted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')
        ordering = ['-deleted_at']

    def __str__(self):
        return f'Message {self.message.id} deleted by {self.user.username}'