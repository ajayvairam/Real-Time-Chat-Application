from rest_framework import serializers
from .models import ChatRoom, Message
from accounts.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    is_deleted = serializers.SerializerMethodField()  # Add this field

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'content', 'file', 'file_name', 'file_url', 'timestamp', 'is_deleted', 'deleted_for_everyone']
        read_only_fields = ['sender', 'file_url', 'is_deleted', 'deleted_for_everyone']

    def get_file_url(self, obj):
        if obj.file:
            return self.context['request'].build_absolute_uri(obj.file.url)
        return None

    def get_is_deleted(self, obj):
        """Check if message is deleted for current user or for everyone"""
        request = self.context.get('request')
        if request and request.user:
            return obj.deleted_for_everyone or obj.deleted_by.filter(user=request.user).exists()
        return False

    def to_representation(self, instance):
        """Customize the message representation based on deletion status"""
        data = super().to_representation(instance)
        
        # If message is deleted for everyone, only show basic info
        if instance.deleted_for_everyone:
            # Keep only necessary fields
            basic_fields = ['id', 'room', 'sender', 'timestamp', 'is_deleted', 'deleted_for_everyone']
            filtered_data = {k: v for k, v in data.items() if k in basic_fields}
            filtered_data['content'] = 'This message was deleted'
            filtered_data['file'] = None
            filtered_data['file_name'] = None
            filtered_data['file_url'] = None
            return filtered_data
            
        return data

class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'chat_type', 'participants', 'created_by', 'created_at', 'last_message']

    def get_last_message(self, obj):
        request = self.context.get('request')
        if request and request.user:
            # Get last message not deleted by current user
            last_message = obj.messages.exclude(
                deleted_by__user=request.user
            ).last()
            if last_message:
                return MessageSerializer(last_message, context=self.context).data
        return None