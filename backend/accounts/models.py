from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import Group

class User(AbstractUser):
    USER_TYPES = (
        ('manager', 'Manager'),
        ('auditor', 'Auditor'),
        ('client', 'Client'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        
        if is_new:
            group, created = Group.objects.get_or_create(name=self.user_type)
            self.groups.add(group)