import csv

from django.core.cache import cache
from django.db import connection
from django.db.models import Avg, Count, Sum
from django.http import HttpResponse
from rest_framework import decorators, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsOfficerOrAdmin
from apps.procurement.models import Approval, Invoice, PurchaseOrder, Quotation, RFQ
from apps.vendors.models import Vendor


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    def get(self, request):
        checks = {"api": "ok", "database": "ok", "redis": "ok"}
        status_code = 200

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception as exc:
            checks["database"] = f"error: {exc.__class__.__name__}"
            status_code = 503

        try:
            cache.set("vendorbridge:health", "ok", timeout=10)
            if cache.get("vendorbridge:health") != "ok":
                raise RuntimeError("cache round trip failed")
        except Exception as exc:
            checks["redis"] = f"error: {exc.__class__.__name__}"
            status_code = 503

        return Response(checks, status=status_code)


class DashboardView(APIView):
    permission_classes = [IsOfficerOrAdmin]

    def get(self, request):
        cached = cache.get("vendorbridge:dashboard")
        if cached:
            return Response(cached)
        invoices = Invoice.objects.exclude(status=Invoice.Status.CANCELLED)
        data = {
            "total_vendors": Vendor.objects.filter(is_deleted=False).count(),
            "active_rfqs": RFQ.objects.filter(is_deleted=False, status__in=[RFQ.Status.PUBLISHED, RFQ.Status.PENDING_QUOTATIONS]).count(),
            "pending_approvals": Approval.objects.filter(status__in=[Approval.Status.PENDING, Approval.Status.UNDER_REVIEW, Approval.Status.ESCALATED]).count(),
            "recent_purchase_orders": list(PurchaseOrder.objects.order_by("-created_at")[:5].values("id", "po_number", "status", "created_at")),
            "recent_invoices": list(invoices.order_by("-created_at")[:5].values("id", "invoice_number", "status", "created_at")),
            "total_procurement_value": invoices.aggregate(total=Sum("purchase_order__quotation__price"))["total"] or 0,
        }
        cache.set("vendorbridge:dashboard", data, timeout=60)
        return Response(data)


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsOfficerOrAdmin]

    @decorators.action(detail=False, methods=["get"], url_path="vendor-performance")
    def vendor_performance(self, request):
        cached = cache.get("vendorbridge:report:vendor-performance")
        if cached:
            return Response(cached)
        data = Vendor.objects.filter(is_deleted=False).annotate(
            quotation_count=Count("quotations"),
            average_price=Avg("quotations__price"),
        ).values("id", "company_name", "rating", "quotation_count", "average_price")
        data = list(data)
        cache.set("vendorbridge:report:vendor-performance", data, timeout=300)
        return Response(data)

    @decorators.action(detail=False, methods=["get"], url_path="spending-summary")
    def spending_summary(self, request):
        cached = cache.get("vendorbridge:report:spending-summary")
        if cached:
            return Response(cached)
        data = Invoice.objects.values("status").annotate(total=Sum("purchase_order__quotation__price"), count=Count("id"))
        data = list(data)
        cache.set("vendorbridge:report:spending-summary", data, timeout=300)
        return Response(data)

    @decorators.action(detail=False, methods=["get"], url_path="monthly-trends")
    def monthly_trends(self, request):
        cached = cache.get("vendorbridge:report:monthly-trends")
        if cached:
            return Response(cached)
        data = Invoice.objects.extra(select={"month": "date_trunc('month', invoice_date)"}).values("month").annotate(total=Sum("purchase_order__quotation__price"), count=Count("id")).order_by("month")
        data = list(data)
        cache.set("vendorbridge:report:monthly-trends", data, timeout=300)
        return Response(data)

    @decorators.action(detail=False, methods=["get"], url_path="export-vendor-performance")
    def export_vendor_performance(self, request):
        rows = Vendor.objects.filter(is_deleted=False).annotate(
            quotation_count=Count("quotations"),
            average_price=Avg("quotations__price"),
        ).values("company_name", "rating", "quotation_count", "average_price")
        return csv_response("vendor_performance.csv", ["company_name", "rating", "quotation_count", "average_price"], rows)

    @decorators.action(detail=False, methods=["get"], url_path="export-spending-summary")
    def export_spending_summary(self, request):
        rows = Invoice.objects.values("status").annotate(total=Sum("purchase_order__quotation__price"), count=Count("id"))
        return csv_response("spending_summary.csv", ["status", "total", "count"], rows)

    @decorators.action(detail=False, methods=["get"], url_path="export-monthly-trends")
    def export_monthly_trends(self, request):
        rows = Invoice.objects.extra(select={"month": "date_trunc('month', invoice_date)"}).values("month").annotate(total=Sum("purchase_order__quotation__price"), count=Count("id")).order_by("month")
        return csv_response("monthly_trends.csv", ["month", "total", "count"], rows)

    @decorators.action(detail=False, methods=["get"], url_path="export-invoices")
    def export_invoices(self, request):
        rows = Invoice.objects.select_related("purchase_order__quotation__vendor").values(
            "invoice_number",
            "purchase_order__po_number",
            "purchase_order__quotation__vendor__company_name",
            "invoice_date",
            "due_date",
            "status",
        )
        return csv_response("invoices.csv", ["invoice_number", "purchase_order__po_number", "purchase_order__quotation__vendor__company_name", "invoice_date", "due_date", "status"], rows)

    @decorators.action(detail=False, methods=["get"], url_path="export-purchase-orders")
    def export_purchase_orders(self, request):
        rows = PurchaseOrder.objects.select_related("quotation__vendor").values(
            "po_number",
            "quotation__quotation_number",
            "quotation__vendor__company_name",
            "status",
            "created_at",
        )
        return csv_response("purchase_orders.csv", ["po_number", "quotation__quotation_number", "quotation__vendor__company_name", "status", "created_at"], rows)

    @decorators.action(detail=False, methods=["get"], url_path="export-approval-workflow")
    def export_approval_workflow(self, request):
        rows = Approval.objects.select_related("quotation", "approver").values(
            "approval_number",
            "quotation__quotation_number",
            "approver__email",
            "status",
            "reviewed_at",
            "remarks",
        )
        return csv_response("approval_workflow.csv", ["approval_number", "quotation__quotation_number", "approver__email", "status", "reviewed_at", "remarks"], rows)


def csv_response(filename, headers, rows):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    writer = csv.DictWriter(response, fieldnames=headers)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return response
