import json

from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Approval, AuditLog, Invoice, Notification, PurchaseOrder, Quotation, RFQ
from .tasks import generate_invoice_pdf, send_invoice_email

ANALYTICS_CACHE_KEYS = [
    "vendorbridge:dashboard",
    "vendorbridge:report:vendor-performance",
    "vendorbridge:report:spending-summary",
    "vendorbridge:report:monthly-trends",
]


def invalidate_analytics_cache():
    cache.delete_many(ANALYTICS_CACHE_KEYS)


def audit(user, action, module, obj, summary, details=None):
    return AuditLog.objects.create(
        user=user,
        action=action,
        module=module,
        object_id=obj.id,
        summary=summary,
        details=json.dumps(details or {}, default=str),
    )


def create_rfq(serializer, user):
    rfq = serializer.save()
    audit(user, "create", "RFQ", rfq, f"RFQ {rfq.rfq_number} created")
    invalidate_analytics_cache()
    return rfq


def update_rfq(serializer, user, before, after_factory):
    rfq = serializer.save()
    audit(user, "update", "RFQ", rfq, f"RFQ {rfq.rfq_number} updated", {"old": before, "new": after_factory(rfq)})
    invalidate_analytics_cache()
    return rfq


def soft_delete_rfq(rfq, user):
    rfq.is_deleted = True
    rfq.version += 1
    rfq.save(update_fields=["is_deleted", "version", "updated_at"])
    audit(user, "soft_delete", "RFQ", rfq, f"RFQ {rfq.rfq_number} soft deleted")
    invalidate_analytics_cache()


def publish_rfq(rfq_id, user):
    with transaction.atomic():
        rfq = RFQ.objects.select_for_update().get(pk=rfq_id, is_deleted=False)
        created = False
        if rfq.status == RFQ.Status.PUBLISHED:
            return rfq, created
        if not rfq.can_transition_to(RFQ.Status.PUBLISHED):
            raise ValidationError({"status": f"Cannot publish RFQ from {rfq.status}."})
        if not rfq.items.exists() or not rfq.assigned_vendors.exists():
            raise ValidationError({"detail": "RFQ requires items and assigned vendors before publishing."})
        rfq.status = RFQ.Status.PUBLISHED
        rfq.version += 1
        rfq.save(update_fields=["status", "version", "updated_at"])
        for vendor in rfq.assigned_vendors.select_related("user"):
            if vendor.user:
                Notification.objects.create(
                    user=vendor.user,
                    title="New RFQ Assigned",
                    message=f"You were assigned to {rfq.rfq_number}.",
                    notification_type="rfq",
                )
        audit(user, "publish", "RFQ", rfq, f"RFQ {rfq.rfq_number} published")
        created = True
    invalidate_analytics_cache()
    return rfq, created


def transition_rfq(rfq_id, user, next_status, action):
    with transaction.atomic():
        rfq = RFQ.objects.select_for_update().get(pk=rfq_id, is_deleted=False)
        if rfq.status == next_status:
            return rfq, False
        if not rfq.can_transition_to(next_status):
            raise ValidationError({"status": f"Cannot transition RFQ from {rfq.status} to {next_status}."})
        rfq.status = next_status
        rfq.version += 1
        rfq.save(update_fields=["status", "version", "updated_at"])
        audit(user, action, "RFQ", rfq, f"RFQ {rfq.rfq_number} {action}")
    invalidate_analytics_cache()
    return rfq, True


def create_quotation(serializer, user):
    quotation = serializer.save()
    if user.role == "vendor" and quotation.vendor.user_id != user.id:
        quotation.delete()
        raise PermissionDenied("Vendor users can only create quotations for their own vendor profile.")
    if quotation.vendor not in quotation.rfq.assigned_vendors.all():
        quotation.delete()
        raise PermissionDenied("This vendor is not assigned to the selected RFQ.")
    audit(user, "create", "Quotation", quotation, f"Quotation {quotation.quotation_number} created")
    return quotation


def submit_quotation(quotation_id, user):
    with transaction.atomic():
        quotation = Quotation.objects.select_for_update().select_related("rfq", "vendor").get(pk=quotation_id)
        if user.role == "vendor" and quotation.vendor.user_id != user.id:
            raise PermissionDenied("Vendor users can only submit quotations for their own vendor profile.")
        if quotation.status == Quotation.Status.SUBMITTED:
            return quotation, False
        if not quotation.can_transition_to(Quotation.Status.SUBMITTED):
            raise ValidationError({"status": f"Cannot submit quotation from {quotation.status}."})
        if quotation.vendor not in quotation.rfq.assigned_vendors.all():
            raise ValidationError({"detail": "Vendor is not assigned to this RFQ."})
        quotation.status = Quotation.Status.SUBMITTED
        quotation.submitted_at = timezone.now()
        quotation.save(update_fields=["status", "submitted_at", "updated_at"])
        if quotation.rfq.status == RFQ.Status.PUBLISHED:
            quotation.rfq.status = RFQ.Status.PENDING_QUOTATIONS
            quotation.rfq.version += 1
            quotation.rfq.save(update_fields=["status", "version", "updated_at"])
        audit(user, "submit", "Quotation", quotation, f"Quotation {quotation.quotation_number} submitted")
    invalidate_analytics_cache()
    return quotation, True


def select_quotation_for_approval(quotation_id, user, approver_id=None):
    with transaction.atomic():
        quotation = Quotation.objects.select_for_update().get(pk=quotation_id)
        existing = quotation.approvals.exclude(status=Approval.Status.REJECTED).first()
        if existing:
            return existing, False
        if not quotation.can_transition_to(Quotation.Status.SELECTED):
            raise ValidationError({"status": f"Cannot select quotation from {quotation.status}."})
        User = get_user_model()
        approver_queryset = User.objects.filter(is_active=True).filter(role=User.Role.APPROVER)
        if approver_id:
            approver = approver_queryset.filter(pk=approver_id).first()
            if not approver:
                raise ValidationError({"approver": "Selected user must be an active approver."})
        else:
            approver = approver_queryset.order_by("id").first()
            if not approver:
                approver = User.objects.filter(is_active=True, role=User.Role.ADMIN).order_by("id").first()
            if not approver:
                raise ValidationError({"approver": "No active approver is available for this workflow."})
        quotation.status = Quotation.Status.SELECTED
        quotation.save(update_fields=["status", "updated_at"])
        approval = Approval.objects.create(quotation=quotation, approver=approver)
        audit(user, "select", "Quotation", quotation, f"Quotation {quotation.quotation_number} selected")
    invalidate_analytics_cache()
    return approval, True


def approve_request(approval_id, user, remarks=None):
    with transaction.atomic():
        approval = Approval.objects.select_for_update().select_related("quotation__rfq").get(pk=approval_id)
        if approval.status == Approval.Status.APPROVED:
            po, _ = PurchaseOrder.objects.get_or_create(quotation=approval.quotation)
            return po, False
        if not approval.can_transition_to(Approval.Status.APPROVED):
            raise ValidationError({"status": f"Cannot approve from {approval.status}."})
        approval.status = Approval.Status.APPROVED
        approval.reviewed_at = timezone.now()
        approval.remarks = remarks or approval.remarks
        approval.save(update_fields=["status", "reviewed_at", "remarks", "updated_at"])
        quotation = approval.quotation
        quotation.status = Quotation.Status.APPROVED
        quotation.save(update_fields=["status", "updated_at"])
        quotation.rfq.status = RFQ.Status.APPROVED
        quotation.rfq.version += 1
        quotation.rfq.save(update_fields=["status", "version", "updated_at"])
        po, _ = PurchaseOrder.objects.get_or_create(quotation=quotation)
        audit(user, "approve", "Approval", approval, f"Approval {approval.approval_number} approved")
    invalidate_analytics_cache()
    return po, True


def reject_request(approval_id, user, remarks=None):
    with transaction.atomic():
        approval = Approval.objects.select_for_update().select_related("quotation").get(pk=approval_id)
        if approval.status == Approval.Status.REJECTED:
            return approval, False
        if not approval.can_transition_to(Approval.Status.REJECTED):
            raise ValidationError({"status": f"Cannot reject from {approval.status}."})
        approval.status = Approval.Status.REJECTED
        approval.reviewed_at = timezone.now()
        approval.remarks = remarks or approval.remarks
        approval.save(update_fields=["status", "reviewed_at", "remarks", "updated_at"])
        approval.quotation.status = Quotation.Status.REJECTED
        approval.quotation.save(update_fields=["status", "updated_at"])
        audit(user, "reject", "Approval", approval, f"Approval {approval.approval_number} rejected")
    invalidate_analytics_cache()
    return approval, True


def generate_invoice_from_po(po_id, user):
    with transaction.atomic():
        po = PurchaseOrder.objects.select_for_update().get(pk=po_id)
        if not po.can_transition_to(PurchaseOrder.Status.INVOICED) and po.status != PurchaseOrder.Status.INVOICED:
            raise ValidationError({"status": f"Cannot generate invoice from purchase order status {po.status}."})
        invoice, created = Invoice.objects.get_or_create(purchase_order=po)
        if po.status != PurchaseOrder.Status.INVOICED:
            po.status = PurchaseOrder.Status.INVOICED
            po.save(update_fields=["status", "updated_at"])
        if created or not invoice.pdf_file:
            generate_invoice_pdf.delay(invoice.id)
        audit(user, "create", "Invoice", invoice, f"Invoice {invoice.invoice_number} generated")
    invalidate_analytics_cache()
    return invoice, created


def transition_purchase_order(po_id, user, next_status, action):
    with transaction.atomic():
        po = PurchaseOrder.objects.select_for_update().get(pk=po_id)
        if po.status == next_status:
            return po, False
        if not po.can_transition_to(next_status):
            raise ValidationError({"status": f"Cannot transition purchase order from {po.status} to {next_status}."})
        po.status = next_status
        po.save(update_fields=["status", "updated_at"])
        audit(user, action, "PurchaseOrder", po, f"Purchase order {po.po_number} {action}")
    invalidate_analytics_cache()
    return po, True


def transition_invoice(invoice_id, user, next_status, action):
    with transaction.atomic():
        invoice = Invoice.objects.select_for_update().get(pk=invoice_id)
        if invoice.status == next_status:
            return invoice, False
        if not invoice.can_transition_to(next_status):
            raise ValidationError({"status": f"Cannot transition invoice from {invoice.status} to {next_status}."})
        invoice.status = next_status
        invoice.save(update_fields=["status", "updated_at"])
        audit(user, action, "Invoice", invoice, f"Invoice {invoice.invoice_number} {action}")
    invalidate_analytics_cache()
    return invoice, True


def queue_invoice_pdf(invoice, user):
    generate_invoice_pdf.delay(invoice.id)
    audit(user, "pdf_queued", "Invoice", invoice, f"Invoice {invoice.invoice_number} PDF generation queued")
    return invoice


def queue_invoice_email(invoice, user):
    send_invoice_email.delay(invoice.id)
    audit(user, "email", "Invoice", invoice, f"Invoice {invoice.invoice_number} queued for email")
    return invoice
