import json

from django.core.cache import cache

from apps.procurement.models import AuditLog

ANALYTICS_CACHE_KEYS = [
    "vendorbridge:dashboard",
    "vendorbridge:report:vendor-performance",
    "vendorbridge:report:spending-summary",
    "vendorbridge:report:monthly-trends",
]


def invalidate_analytics_cache():
    cache.delete_many(ANALYTICS_CACHE_KEYS)


def audit_vendor(user, action, vendor, summary, details=None):
    return AuditLog.objects.create(
        user=user,
        action=action,
        module="Vendor",
        object_id=vendor.id,
        summary=summary,
        details=json.dumps(details or {}, default=str),
    )


def create_vendor(serializer, user):
    vendor = serializer.save()
    audit_vendor(user, "create", vendor, f"Vendor {vendor.company_name} created")
    invalidate_analytics_cache()
    return vendor


def update_vendor(serializer, user, before, after_factory):
    vendor = serializer.save()
    audit_vendor(user, "update", vendor, f"Vendor {vendor.company_name} updated", {"old": before, "new": after_factory(vendor)})
    invalidate_analytics_cache()
    return vendor


def soft_delete_vendor(vendor, user):
    vendor.is_deleted = True
    vendor.version += 1
    vendor.save(update_fields=["is_deleted", "version", "updated_at"])
    audit_vendor(user, "soft_delete", vendor, f"Vendor {vendor.company_name} soft deleted")
    invalidate_analytics_cache()
