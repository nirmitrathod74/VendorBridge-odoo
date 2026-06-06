from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class VendorBridgeUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("VendorBridge", {"fields": ("role", "phone")}),)
    list_display = ("email", "username", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
