from django.conf import settings
from django.db import models
from django.db.models import Q


class Vendor(models.Model):
    class Category(models.TextChoices):
        GOODS = "goods", "Goods"
        SERVICES = "services", "Services"
        TECHNOLOGY = "technology", "Technology"
        LOGISTICS = "logistics", "Logistics"
        MAINTENANCE = "maintenance", "Maintenance"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        BLACKLISTED = "blacklisted", "Blacklisted"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=180)
    company_name = models.CharField(max_length=180)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    gst_number = models.CharField(max_length=40, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.GOODS)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.ACTIVE)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    version = models.PositiveIntegerField(default=1)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company_name} ({self.name})"

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
            models.Index(fields=["company_name"]),
            models.Index(fields=["email"]),
            models.Index(fields=["gst_number"]),
            models.Index(fields=["is_deleted", "status"]),
            models.Index(fields=["created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["gst_number"],
                condition=~Q(gst_number=""),
                name="unique_nonblank_vendor_gst_number",
            ),
        ]
