from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        OFFICER = "officer", "Procurement Officer"
        VENDOR = "vendor", "Vendor"
        APPROVER = "approver", "Manager / Approver"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.OFFICER)
    phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def is_admin_role(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def is_officer_role(self):
        return self.role in {self.Role.ADMIN, self.Role.OFFICER} or self.is_superuser

    def is_approver_role(self):
        return self.role in {self.Role.ADMIN, self.Role.APPROVER} or self.is_superuser
