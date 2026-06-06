from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.procurement.models import Approval, Invoice, PurchaseOrder, Quotation, RFQ, RFQItem
from apps.vendors.models import Vendor


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "vendorbridge-tests",
        }
    },
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class VendorBridgeAPITestCase(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@test.com",
            password="pass12345",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.officer = User.objects.create_user(username="officer", email="officer@test.com", password="pass12345", role=User.Role.OFFICER)
        self.approver = User.objects.create_user(username="approver", email="approver@test.com", password="pass12345", role=User.Role.APPROVER)
        self.vendor_user = User.objects.create_user(username="vendor", email="vendor@test.com", password="pass12345", role=User.Role.VENDOR)
        self.other_vendor_user = User.objects.create_user(username="vendor2", email="vendor2@test.com", password="pass12345", role=User.Role.VENDOR)

        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            name="Vendor One",
            company_name="Vendor One Pvt Ltd",
            email="vendor@test.com",
            gst_number="29ABCDE1234F1Z5",
        )
        self.other_vendor = Vendor.objects.create(
            user=self.other_vendor_user,
            name="Vendor Two",
            company_name="Vendor Two Pvt Ltd",
            email="vendor2@test.com",
            gst_number="27PQRSX9876L1Z2",
        )

        self.rfq = RFQ.objects.create(
            title="Laptop Procurement",
            description="Engineering laptops",
            deadline=timezone.localdate() + timedelta(days=10),
            created_by=self.officer,
            status=RFQ.Status.PUBLISHED,
        )
        self.rfq.assigned_vendors.add(self.vendor)
        RFQItem.objects.create(rfq=self.rfq, product_name="Laptop", quantity=10, unit="Units")

        self.quotation = Quotation.objects.create(
            rfq=self.rfq,
            vendor=self.vendor,
            price="500000.00",
            tax="90000.00",
            delivery_days=7,
            status=Quotation.Status.SUBMITTED,
            submitted_at=timezone.now(),
        )
        self.approval = Approval.objects.create(quotation=self.quotation, approver=self.approver)

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_login_returns_tokens(self):
        response = self.client.post(reverse("login"), {"email": "officer@test.com", "password": "pass12345"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["role"], "officer")

    def test_vendor_cannot_create_rfq(self):
        self.authenticate(self.vendor_user)

        response = self.client.post(
            "/api/rfqs/",
            {
                "title": "Unauthorized RFQ",
                "description": "Should fail",
                "deadline": str(timezone.localdate() + timedelta(days=5)),
                "assigned_vendors": [self.vendor.id],
                "items": [{"product_name": "Mouse", "quantity": "5", "unit": "Units"}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_vendor_only_sees_own_quotations(self):
        Quotation.objects.create(
            rfq=self.rfq,
            vendor=self.other_vendor,
            price="600000.00",
            tax="108000.00",
            delivery_days=12,
            status=Quotation.Status.SUBMITTED,
        )
        self.authenticate(self.vendor_user)

        response = self.client.get("/api/quotations/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["vendor"], self.vendor.id)

    def test_approval_is_idempotent_and_creates_one_po(self):
        self.authenticate(self.approver)

        first = self.client.post(f"/api/approvals/{self.approval.id}/approve/", {"remarks": "Approved"}, format="json")
        second = self.client.post(f"/api/approvals/{self.approval.id}/approve/", {"remarks": "Approved again"}, format="json")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(PurchaseOrder.objects.filter(quotation=self.quotation).count(), 1)

    def test_generate_invoice_is_idempotent(self):
        po = PurchaseOrder.objects.create(quotation=self.quotation)
        self.authenticate(self.officer)

        with patch("apps.procurement.services.generate_invoice_pdf.delay"):
            first = self.client.post(f"/api/purchase-orders/{po.id}/generate-invoice/")
            second = self.client.post(f"/api/purchase-orders/{po.id}/generate-invoice/")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Invoice.objects.filter(purchase_order=po).count(), 1)

    def test_health_endpoint_is_public(self):
        response = self.client.get("/api/health/")

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn("api", response.data)
        self.assertIn("database", response.data)
        self.assertIn("redis", response.data)

    def test_forgot_password_endpoint_does_not_leak_user_existence(self):
        response = self.client.post("/api/auth/forgot-password/", {"email": "missing@example.com"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

    def test_report_csv_export(self):
        self.authenticate(self.officer)

        response = self.client.get("/api/reports/export-vendor-performance/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_invoice_pdf_download_queues_when_missing(self):
        po = PurchaseOrder.objects.create(quotation=self.quotation)
        invoice = Invoice.objects.create(purchase_order=po)
        self.authenticate(self.officer)

        with patch("apps.procurement.services.generate_invoice_pdf.delay"):
            response = self.client.get(f"/api/invoices/{invoice.id}/download-pdf/")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
