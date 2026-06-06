from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class VendorBridgeUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("VendorBridge", {"fields": ("role", "phone")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("VendorBridge", {"fields": ("email", "first_name", "last_name", "role", "phone")}),
    )
    list_display = ("email", "username", "first_name", "last_name", "role", "is_active", "is_staff", "is_superuser")
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "username", "first_name", "last_name", "phone")
    ordering = ("email",)
