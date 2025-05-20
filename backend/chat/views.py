from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.http import FileResponse
from .models import ChatRoom, Message, DeletedMessage  # Add DeletedMessage import
from .serializers import ChatRoomSerializer, MessageSerializer
from accounts.models import User
from accounts.serializers import UserSerializer

class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)

    @action(detail=False, methods=['get'])
    def available_users(self, request):
        user = request.user
        if user.user_type == 'manager':
            # Managers can chat with everyone
            users = User.objects.exclude(id=user.id)
        else:
            # Clients and auditors can only chat with managers and each other
            users = User.objects.filter(
                Q(user_type='manager') |  # Can chat with managers
                Q(user_type__in=['client', 'auditor'])  # Can chat with other clients/auditors
            ).exclude(id=user.id)
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        room = serializer.save(created_by=self.request.user)
        # Add the creator to participants
        room.participants.add(self.request.user)
        # Add other participants
        participant_ids = self.request.data.get('participant_ids', [])
        for participant_id in participant_ids:
            room.participants.add(participant_id)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room', None)
        # Update queryset to handle both deleted_for_everyone and personal deletions
        base_queryset = Message.objects.filter(
            ~Q(deleted_by__user=self.request.user)  # Not deleted for current user
        )
        if room_id:
            return base_queryset.filter(room_id=room_id)
        return base_queryset.filter(room__participants=self.request.user)

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        if file_obj:
            serializer.save(
                sender=self.request.user,
                file=file_obj,
                file_name=file_obj.name
            )
        else:
            serializer.save(sender=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download file attached to message"""
        message = self.get_object()
        if not message.file:
            return Response(
                {'error': 'No file attached to this message'},
                status=status.HTTP_404_NOT_FOUND
            )

        response = FileResponse(
            message.file.open('rb'),
            as_attachment=True,
            filename=message.file_name
        )
        return response

    # Add these new actions for message deletion
    @action(detail=True, methods=['post'])
    def delete_for_me(self, request, pk=None):
        """Delete message for the current user only"""
        message = self.get_object()
        DeletedMessage.objects.get_or_create(
            message=message,
            user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])  # Changed from delete to post
    def delete_for_everyone(self, request, pk=None):
        """Mark message as deleted for everyone but keep in database"""
        message = self.get_object()
        # Check if user has permission to delete for everyone
        if message.sender == request.user or message.room.created_by == request.user:
            message.deleted_for_everyone = True  # Instead of deleting, mark as deleted
            message.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {'error': 'You do not have permission to delete this message'},
            status=status.HTTP_403_FORBIDDEN
        )