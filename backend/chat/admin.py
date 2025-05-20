from django.contrib import admin
from .models import ChatRoom, Message

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'chat_type', 'created_by', 'created_at')
    list_filter = ('chat_type', 'created_at')
    search_fields = ('name', 'participants__username')
    filter_horizontal = ('participants',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'room', 'content', 'timestamp')
    list_filter = ('room', 'timestamp')
    search_fields = ('content', 'sender__username')
    readonly_fields = ('timestamp',)