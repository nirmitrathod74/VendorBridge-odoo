from django.http import FileResponse
from rest_framework import decorators, permissions, status, viewsets
from rest_framework.response import Response

from apps.accounts.permissions import IsApproverOrAdmin, IsOfficerApproverOrAdmin, IsOfficerOrAdmin, IsOfficerVendorOrAdmin

from .models import Approval, AuditLog, Invoice, Notification, PurchaseOrder, Quotation, RFQ
from .serializers import (
    ApprovalSerializer,
    AuditLogSerializer,
    InvoiceSerializer,
    NotificationSerializer,
    PurchaseOrderSerializer,
    QuotationSerializer,
    RFQSerializer,
)
from .services import (
    approve_request,
    audit,
    create_quotation,
    create_rfq,
    generate_invoice_from_po,
    publish_rfq,
    queue_invoice_email,
    queue_invoice_pdf,
    reject_request,
    select_quotation_for_approval,
    soft_delete_rfq,
    submit_quotation,
    transition_invoice,
    transition_purchase_order,
    transition_rfq,
    update_rfq,
)


class RFQViewSet(viewsets.ModelViewSet):
    serializer_class = RFQSerializer
    filterset_fields = ["status", "deadline", "assigned_vendors"]
    search_fields = ["rfq_number", "title", "description"]
    ordering_fields = ["created_at", "deadline", "status"]

    def get_queryset(self):
        queryset = RFQ.objects.prefetch_related("items", "assigned_vendors", "quotations").filter(is_deleted=False)
        user = self.request.user
        if user.is_superuser or user.role in {"admin", "officer", "approver"}:
            return queryset
        return queryset.filter(assigned_vendors__user=user).distinct()

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsOfficerOrAdmin()]

    def perform_create(self, serializer):
        create_rfq(serializer, self.request.user)

    def perform_update(self, serializer):
        before = RFQSerializer(serializer.instance).data
        update_rfq(serializer, self.request.user, before, lambda rfq: RFQSerializer(rfq).data)

    def perform_destroy(self, instance):
        soft_delete_rfq(instance, self.request.user)

    @decorators.action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        rfq, _ = publish_rfq(pk, request.user)
        return Response(self.get_serializer(rfq).data)

    @decorators.action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        rfq, _ = transition_rfq(pk, request.user, RFQ.Status.CLOSED, "closed")
        return Response(self.get_serializer(rfq).data)

    @decorators.action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        rfq, _ = transition_rfq(pk, request.user, RFQ.Status.REJECTED, "rejected")
        return Response(self.get_serializer(rfq).data)

    @decorators.action(detail=True, methods=["get"])
    def compare(self, request, pk=None):
        rfq = self.get_object()
        quotes = rfq.quotations.filter(status__in=[Quotation.Status.SUBMITTED, Quotation.Status.SELECTED, Quotation.Status.APPROVED])
        return Response(QuotationSerializer(quotes, many=True).data)


class QuotationViewSet(viewsets.ModelViewSet):
    serializer_class = QuotationSerializer
    filterset_fields = ["status", "rfq", "vendor"]
    search_fields = ["quotation_number", "vendor__company_name", "rfq__title"]
    ordering_fields = ["price", "delivery_days", "created_at"]

    def get_queryset(self):
        queryset = Quotation.objects.select_related("rfq", "vendor").order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {"admin", "officer", "approver"}:
            return queryset
        return queryset.filter(vendor__user=user)

    def get_permissions(self):
        if self.action in ["select_for_approval"]:
            return [IsOfficerOrAdmin()]
        if self.action in ["create", "submit"]:
            return [IsOfficerVendorOrAdmin()]
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        create_quotation(serializer, self.request.user)

    @decorators.action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        quotation, _ = submit_quotation(pk, request.user)
        return Response(self.get_serializer(quotation).data)

    @decorators.action(detail=True, methods=["post"], url_path="select-for-approval")
    def select_for_approval(self, request, pk=None):
        approval, created = select_quotation_for_approval(pk, request.user, request.data.get("approver"))
        return Response(ApprovalSerializer(approval).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ApprovalViewSet(viewsets.ModelViewSet):
    serializer_class = ApprovalSerializer
    filterset_fields = ["status", "approver", "quotation"]

    def get_queryset(self):
        queryset = Approval.objects.select_related("quotation__rfq", "quotation__vendor", "approver").order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {"admin", "officer"}:
            return queryset
        if user.role == "approver":
            return queryset.filter(approver=user)
        return queryset.filter(quotation__vendor__user=user)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsApproverOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(approver=self.request.user)

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Create approvals by selecting a submitted quotation for approval."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @decorators.action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        po, created = approve_request(pk, request.user, request.data.get("remarks"))
        return Response(PurchaseOrderSerializer(po).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @decorators.action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        approval, _ = reject_request(pk, request.user, request.data.get("remarks"))
        return Response(self.get_serializer(approval).data)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    filterset_fields = ["status"]

    def get_queryset(self):
        queryset = PurchaseOrder.objects.select_related("quotation__rfq", "quotation__vendor").order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {"admin", "officer", "approver"}:
            return queryset
        return queryset.filter(quotation__vendor__user=user)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsOfficerOrAdmin()]

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Purchase orders are created only when an approval is accepted."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @decorators.action(detail=True, methods=["post"], url_path="generate-invoice")
    def generate_invoice(self, request, pk=None):
        invoice, _ = generate_invoice_from_po(pk, request.user)
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        po, _ = transition_purchase_order(pk, request.user, PurchaseOrder.Status.CONFIRMED, "confirmed")
        return Response(self.get_serializer(po).data)

    @decorators.action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        po, _ = transition_purchase_order(pk, request.user, PurchaseOrder.Status.CANCELLED, "cancelled")
        return Response(self.get_serializer(po).data)


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    filterset_fields = ["status", "invoice_date", "due_date"]

    def get_queryset(self):
        queryset = Invoice.objects.select_related("purchase_order__quotation__rfq", "purchase_order__quotation__vendor").order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {"admin", "officer", "approver"}:
            return queryset
        return queryset.filter(purchase_order__quotation__vendor__user=user)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsOfficerOrAdmin()]

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Invoices are generated from purchase orders."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @decorators.action(detail=True, methods=["post"], url_path="send-email")
    def send_email(self, request, pk=None):
        invoice = self.get_object()
        queue_invoice_email(invoice, request.user)
        return Response({"detail": "Invoice email queued."})

    @decorators.action(detail=True, methods=["post"], url_path="mark-sent")
    def mark_sent(self, request, pk=None):
        invoice, _ = transition_invoice(pk, request.user, Invoice.Status.SENT, "sent")
        return Response(self.get_serializer(invoice).data)

    @decorators.action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        invoice, _ = transition_invoice(pk, request.user, Invoice.Status.PAID, "paid")
        return Response(self.get_serializer(invoice).data)

    @decorators.action(detail=True, methods=["post"], url_path="mark-overdue")
    def mark_overdue(self, request, pk=None):
        invoice, _ = transition_invoice(pk, request.user, Invoice.Status.OVERDUE, "overdue")
        return Response(self.get_serializer(invoice).data)

    @decorators.action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        invoice, _ = transition_invoice(pk, request.user, Invoice.Status.CANCELLED, "cancelled")
        return Response(self.get_serializer(invoice).data)

    @decorators.action(detail=True, methods=["get"], url_path="download-pdf")
    def download_pdf(self, request, pk=None):
        invoice = self.get_object()
        if not invoice.pdf_file:
            queue_invoice_pdf(invoice, request.user)
            return Response({"detail": "Invoice PDF is being generated. Try again shortly."}, status=status.HTTP_202_ACCEPTED)
        return FileResponse(invoice.pdf_file.open("rb"), as_attachment=True, filename=f"{invoice.invoice_number}.pdf")


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    filterset_fields = ["is_read", "notification_type"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @decorators.action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(self.get_serializer(notification).data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsOfficerApproverOrAdmin]
