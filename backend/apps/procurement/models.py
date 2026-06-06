from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.vendors.models import Vendor


def next_code(prefix, model):
    year = timezone.now().year
    count = model.objects.filter(created_at__year=year).count() + 1
    return f"{prefix}/{year}/{count:05d}"


def validate_upload_size(file):
    max_size_mb = 10
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f"File size cannot exceed {max_size_mb} MB.")


document_validators = [
    FileExtensionValidator(allowed_extensions=["pdf", "doc", "docx", "xls", "xlsx", "csv", "png", "jpg", "jpeg"]),
    validate_upload_size,
]


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    module = models.CharField(max_length=80)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    summary = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["module", "action"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]


class RFQ(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        PENDING_QUOTATIONS = "pending_quotations", "Pending Quotations"
        CLOSED = "closed", "Closed"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    rfq_number = models.CharField(max_length=30, unique=True, blank=True)
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    deadline = models.DateField()
    attachment = models.FileField(upload_to="rfq_attachments/", blank=True, null=True, validators=document_validators)
    assigned_vendors = models.ManyToManyField(Vendor, related_name="rfqs", blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_rfqs")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    version = models.PositiveIntegerField(default=1)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["deadline"]),
            models.Index(fields=["created_by", "status"]),
            models.Index(fields=["is_deleted", "status"]),
            models.Index(fields=["created_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.rfq_number:
            self.rfq_number = next_code("RFQ", RFQ)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.rfq_number} - {self.title}"

    def can_transition_to(self, next_status):
        transitions = {
            self.Status.DRAFT: {self.Status.PUBLISHED, self.Status.REJECTED},
            self.Status.PUBLISHED: {self.Status.PENDING_QUOTATIONS, self.Status.CLOSED, self.Status.REJECTED},
            self.Status.PENDING_QUOTATIONS: {self.Status.APPROVED, self.Status.CLOSED, self.Status.REJECTED},
            self.Status.CLOSED: set(),
            self.Status.APPROVED: set(),
            self.Status.REJECTED: set(),
        }
        return next_status in transitions.get(self.status, set())


class RFQItem(models.Model):
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name="items")
    product_name = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    unit = models.CharField(max_length=30, default="Units")

    class Meta:
        indexes = [
            models.Index(fields=["rfq"]),
            models.Index(fields=["product_name"]),
        ]


class Quotation(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        SELECTED = "selected", "Selected"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    quotation_number = models.CharField(max_length=30, unique=True, blank=True)
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name="quotations")
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="quotations")
    price = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    delivery_days = models.PositiveIntegerField(default=0)
    warranty = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    attachment = models.FileField(upload_to="quotation_attachments/", blank=True, null=True, validators=document_validators)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["price", "delivery_days"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["rfq", "status"]),
            models.Index(fields=["vendor", "status"]),
            models.Index(fields=["price"]),
            models.Index(fields=["delivery_days"]),
            models.Index(fields=["created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["rfq", "vendor"], name="unique_quotation_per_rfq_vendor"),
        ]

    @property
    def total(self):
        return self.price + self.tax

    def save(self, *args, **kwargs):
        if not self.quotation_number:
            self.quotation_number = next_code("QT", Quotation)
        super().save(*args, **kwargs)

    def can_transition_to(self, next_status):
        transitions = {
            self.Status.DRAFT: {self.Status.SUBMITTED, self.Status.REJECTED},
            self.Status.SUBMITTED: {self.Status.SELECTED, self.Status.REJECTED},
            self.Status.SELECTED: {self.Status.APPROVED, self.Status.REJECTED},
            self.Status.APPROVED: set(),
            self.Status.REJECTED: set(),
        }
        return next_status in transitions.get(self.status, set())


class Approval(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        UNDER_REVIEW = "under_review", "Under Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        ESCALATED = "escalated", "Escalated"

    approval_number = models.CharField(max_length=30, unique=True, blank=True)
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="approvals")
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="approvals")
    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.approval_number:
            self.approval_number = next_code("APR", Approval)
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["approver", "status"]),
            models.Index(fields=["quotation"]),
            models.Index(fields=["created_at"]),
        ]

    def can_transition_to(self, next_status):
        transitions = {
            self.Status.PENDING: {self.Status.UNDER_REVIEW, self.Status.APPROVED, self.Status.REJECTED, self.Status.ESCALATED},
            self.Status.UNDER_REVIEW: {self.Status.APPROVED, self.Status.REJECTED, self.Status.ESCALATED},
            self.Status.ESCALATED: {self.Status.UNDER_REVIEW, self.Status.APPROVED, self.Status.REJECTED},
            self.Status.APPROVED: set(),
            self.Status.REJECTED: set(),
        }
        return next_status in transitions.get(self.status, set())


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        CONFIRMED = "confirmed", "Confirmed"
        INVOICED = "invoiced", "Invoiced"
        CANCELLED = "cancelled", "Cancelled"

    po_number = models.CharField(max_length=30, unique=True, blank=True)
    quotation = models.OneToOneField(Quotation, on_delete=models.PROTECT, related_name="purchase_order")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        return self.quotation.total

    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = next_code("PO", PurchaseOrder)
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]


class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    invoice_number = models.CharField(max_length=30, unique=True, blank=True)
    purchase_order = models.OneToOneField(PurchaseOrder, on_delete=models.PROTECT, related_name="invoice")
    invoice_date = models.DateField(default=timezone.localdate)
    due_date = models.DateField(null=True, blank=True)
    pdf_file = models.FileField(upload_to="invoices/", blank=True, null=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        return self.purchase_order.total

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = next_code("INV", Invoice)
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["invoice_date"]),
            models.Index(fields=["due_date"]),
            models.Index(fields=["created_at"]),
        ]


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=160)
    message = models.TextField()
    notification_type = models.CharField(max_length=40, default="system")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["notification_type"]),
            models.Index(fields=["created_at"]),
        ]
