from django.contrib import admin

from .models import Approval, AuditLog, Invoice, Notification, PurchaseOrder, Quotation, RFQ, RFQItem


class RFQItemInline(admin.TabularInline):
    model = RFQItem
    extra = 1


@admin.register(RFQ)
class RFQAdmin(admin.ModelAdmin):
    list_display = ("rfq_number", "title", "deadline", "status", "created_by", "created_at")
    list_filter = ("status", "deadline")
    search_fields = ("rfq_number", "title")
    inlines = [RFQItemInline]


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ("quotation_number", "rfq", "vendor", "price", "tax", "delivery_days", "status")
    list_filter = ("status",)
    search_fields = ("quotation_number", "rfq__title", "vendor__company_name")


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ("approval_number", "quotation", "approver", "status", "reviewed_at")
    list_filter = ("status",)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("po_number", "quotation", "status", "created_at")
    list_filter = ("status",)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "purchase_order", "invoice_date", "due_date", "status")
    list_filter = ("status",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "notification_type", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "module", "action", "summary")
    list_filter = ("module", "action")
    search_fields = ("summary", "details")
    readonly_fields = ("created_at",)
