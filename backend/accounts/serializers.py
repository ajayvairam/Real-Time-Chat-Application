from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'user_type', 'profile_picture', 'bio')
        read_only_fields = ('id',)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    user_type = serializers.ChoiceField(choices=User.USER_TYPES, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'user_type')

    def validate(self, attrs):
        # Validate password
        try:
            validate_password(attrs['password'])
        except Exception as e:
            raise serializers.ValidationError({"password": list(e)})
        return attrs

    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                user_type=validated_data['user_type']
            )
            return user
        except Exception as e:
            raise serializers.ValidationError(str(e))