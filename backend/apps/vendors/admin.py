from django.contrib import admin

from .models import Vendor


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ("company_name", "name", "email", "category", "status", "rating")
    list_filter = ("category", "status")
    search_fields = ("company_name", "name", "email", "gst_number")
